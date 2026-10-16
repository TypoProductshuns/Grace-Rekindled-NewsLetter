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

const music_hint = document.getElementById('music_hint');

const try_bg = () => {
  const p = bg.play();
  if (p && p.catch) p.catch(() => {});
};

bg.addEventListener('playing', () => {
  document.body.classList.add('music_on');
});

bg.play().catch(() => {});

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
