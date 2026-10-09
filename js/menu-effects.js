import { loadMascotAtlas } from './mascot-atlas.js?v=2026-10-09-garden-effects';

const menu = document.getElementById('start-screen');
const actor = menu?.querySelector('.menu-mascot-actor');
loadMascotAtlas(actor, actor?.querySelector('.menu-mascot-sprite'));

function syncVisibility() {
  if (!menu) return;
  const paused = document.hidden || menu.classList.contains('hidden');
  if (menu.classList.contains('effects-paused') !== paused) {
    menu.classList.toggle('effects-paused', paused);
  }
}

if (menu) {
  // The game toggles this menu for play, results and Leaderboard. Keep the
  // decoration lifecycle separate from game logic and stop while it is hidden.
  new MutationObserver(syncVisibility).observe(menu, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', syncVisibility);
  window.addEventListener('pageshow', syncVisibility);
  window.addEventListener('pagehide', () => menu.classList.add('effects-paused'));
  syncVisibility();
}
