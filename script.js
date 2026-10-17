const header = document.querySelector('header');

const set_header_h = () => {
  document.documentElement.style.setProperty('--header_h', `${header.offsetHeight}px`);
};

set_header_h();
window.addEventListener('resize', set_header_h);

const burger = document.getElementById('burger');
const toc_panel = document.getElementById('toc_panel');

const set_panel = (open) => {
toc_panel.classList.toggle('hidden', !open);
document.body.classList.toggle('toc_open', open);
burger.setAttribute('aria-expanded', String(open));
};

burger.addEventListener('click', () => {
set_panel(toc_panel.classList.contains('hidden'));
});

document.addEventListener('keydown', (e) => {
if (e.key === 'Escape') set_panel(false);
});

document.querySelectorAll('.toc_btn').forEach((btn) => {
btn.addEventListener('click', () => {
 const el = document.getElementById(btn.dataset.target);
 if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
 if (window.innerWidth < 900) set_panel(false);
});
});

const calm_btn = document.getElementById('calm_btn');

calm_btn.addEventListener('click', () => {
  const on = document.body.classList.toggle('calm');
  calm_btn.setAttribute('aria-pressed', String(on));
});

const fmt_time = (s) => {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

const bg = new Audio('musics/stuff/bg.mp3');
bg.loop = true;
bg.volume = 0.25;

const try_bg = () => {
  const p = bg.play();
  if (p && p.catch) p.catch(() => {});
};

bg.play().catch(() => {});

const mute_btn = document.getElementById('mute_btn');

mute_btn.addEventListener('click', () => {
  const muted = mute_btn.getAttribute('aria-pressed') === 'true';
  bg.muted = !muted;
  mute_btn.setAttribute('aria-pressed', String(!muted));
});

const audios = [];

const resume_bg = () => {
  const busy = audios.some((a) => !a.paused && !a.ended);
  if (!busy) bg.play().catch(() => {});
};

let bg_unlocked = false;
const unlock_bg = () => {
  if (bg_unlocked) return;
  bg_unlocked = true;
  try_bg();
};
document.addEventListener('pointerdown', unlock_bg, { once: true });
document.addEventListener('keydown', unlock_bg, { once: true });

document.querySelectorAll('.player').forEach((player) => {
  if (!player.dataset.src) return;
  const audio = new Audio(player.dataset.src);
  audios.push(audio);
  const play_btn = player.querySelector('.player_play');
  const seek = player.querySelector('.player_seek');
  const time = player.querySelector('.player_time');

  const set_progress = () => {
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    seek.value = String(Math.round((pct / 100) * 1000));
    seek.style.setProperty('--p', `${pct}%`);
  };

  play_btn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  audio.addEventListener('play', () => {
    player.classList.add('is_playing');
    audios.forEach((other) => {
      if (other !== audio) other.pause();
    });
    bg.pause();
  });
  audio.addEventListener('pause', () => {
    player.classList.remove('is_playing');
    resume_bg();
  });
  audio.addEventListener('ended', () => {
    player.classList.remove('is_playing');
    audio.currentTime = 0;
    set_progress();
    resume_bg();
  });

  audio.addEventListener('loadedmetadata', () => {
    time.textContent = `0:00 / ${fmt_time(audio.duration)}`;
  });

  audio.addEventListener('timeupdate', () => {
    time.textContent = `${fmt_time(audio.currentTime)} / ${fmt_time(audio.duration)}`;
    set_progress();
  });

  seek.addEventListener('input', () => {
    if (audio.duration) {
      audio.currentTime = (Number(seek.value) / 1000) * audio.duration;
      set_progress();
    }
  });
});

const rail = document.getElementById('scroll_rail');
const thumb = document.getElementById('scroll_thumb');
const MIN_THUMB = 34;

let rail_m = { h: 0, travel: 0, max_scroll: 0, view_h: 0 };

const sync_thumb = () => {
  const { h, travel, max_scroll } = rail_m;
  if (!h || max_scroll <= 0) return;
  const y = window.scrollY || document.documentElement.scrollTop || 0;
  const p = Math.min(1, Math.max(0, y / max_scroll));
  thumb.style.transform = `translateY(${Math.round(p * travel)}px)`;
  thumb.setAttribute('aria-valuenow', String(Math.round(p * 100)));
  thumb.setAttribute('aria-valuetext', `${Math.round(p * 100)}% scrolled`);
};

const measure_rail = () => {
  const de = document.documentElement;
  const view_h = de.clientHeight;
  const doc_h = Math.max(de.scrollHeight, document.body.scrollHeight);
  const h = rail.clientHeight;
  const max_scroll = Math.max(doc_h - view_h, 0);
  const usable = h > 0 && max_scroll > 1;

  document.body.classList.toggle('no_scroll_rail', !usable);
  if (!usable) {
    rail_m = { h: 0, travel: 0, max_scroll: 0, view_h };
    return;
  }

  const thumb_h = Math.min(h, Math.max(MIN_THUMB, Math.round((h * view_h) / doc_h)));
  rail_m = { h, travel: h - thumb_h, max_scroll, view_h };
  thumb.style.height = `${thumb_h}px`;
  sync_thumb();
};

let rail_queued = false;
window.addEventListener('scroll', () => {
  if (rail_queued) return;
  rail_queued = true;
  requestAnimationFrame(() => {
    rail_queued = false;
    sync_thumb();
  });
}, { passive: true });

window.addEventListener('resize', measure_rail);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure_rail);
if ('ResizeObserver' in window) {
  new ResizeObserver(measure_rail).observe(document.body);
}

let dragging = false;
let grab_offset = 0;

const thumb_drag = (e) => {
  const rail_top = rail.getBoundingClientRect().top;
  const y = Math.min(Math.max(e.clientY - rail_top - grab_offset, 0), rail_m.travel);
  const ratio = rail_m.travel > 0 ? y / rail_m.travel : 0;
  window.scrollTo({ top: ratio * rail_m.max_scroll, behavior: 'instant' });
};

thumb.addEventListener('pointerdown', (e) => {
  dragging = true;
  grab_offset = e.clientY - thumb.getBoundingClientRect().top;
  thumb.classList.add('is_dragging');
  try {
    thumb.setPointerCapture(e.pointerId);
  } catch (_) {
  }
  e.preventDefault();
});

thumb.addEventListener('pointermove', (e) => {
  if (dragging) thumb_drag(e);
});

const end_drag = (e) => {
  if (!dragging) return;
  dragging = false;
  thumb.classList.remove('is_dragging');
  if (thumb.hasPointerCapture(e.pointerId)) thumb.releasePointerCapture(e.pointerId);
};

thumb.addEventListener('pointerup', end_drag);
thumb.addEventListener('pointercancel', end_drag);

rail.addEventListener('pointerdown', (e) => {
  if (e.target === thumb || !rail_m.max_scroll) return;
  const box = thumb.getBoundingClientRect();
  const dir = e.clientY < box.top ? -1 : 1;
  window.scrollBy({ top: dir * rail_m.view_h * 0.9, behavior: 'smooth' });
});

thumb.addEventListener('keydown', (e) => {
  if (!rail_m.max_scroll) return;
  const step = 60;
  const page = rail_m.view_h * 0.9;
  let y = window.scrollY;
  if (e.key === 'ArrowDown') y += step;
  else if (e.key === 'ArrowUp') y -= step;
  else if (e.key === 'PageDown') y += page;
  else if (e.key === 'PageUp') y -= page;
  else if (e.key === 'Home') y = 0;
  else if (e.key === 'End') y = rail_m.max_scroll;
  else return;
  e.preventDefault();
  window.scrollTo({
    top: Math.min(Math.max(y, 0), rail_m.max_scroll),
    behavior: 'smooth',
  });
});

measure_rail();
