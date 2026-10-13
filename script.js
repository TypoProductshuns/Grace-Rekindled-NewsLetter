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
