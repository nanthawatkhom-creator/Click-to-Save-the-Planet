// The display has no controls: load the animation atlas and pause off-screen.
import { loadMascotAtlas } from './mascot-atlas.js?v=2026-10-09-garden-effects';

const standee = document.querySelector('.standee');
const actor = document.querySelector('.mascot-actor');
const sprite = actor?.querySelector('.mascot-sprite');

function syncVisibility() {
  standee?.classList.toggle('is-paused', document.hidden);
}

document.addEventListener('visibilitychange', syncVisibility);
window.addEventListener('pageshow', syncVisibility);
window.addEventListener('pagehide', () => standee?.classList.add('is-paused'));
syncVisibility();

loadMascotAtlas(actor, sprite);
