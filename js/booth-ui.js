export function portraitMetrics(width, height) {
  const portrait = height / width >= 1.15;
  const unit = Math.min(width / 1080, height / 1920);
  return { portrait, unit };
}

export function setupBoothViewport() {
  const root = document.documentElement;
  const field = document.getElementById('player-name');
  let focusBaseline = null;
  let scrollTimer;
  function update() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const focused = document.activeElement === field;
    if (!focused) focusBaseline = null;
    if (focused && (!focusBaseline || Math.abs(focusBaseline.width - width) >= 8)) {
      focusBaseline = { width, height, ...portraitMetrics(width, height) };
    }
    const { portrait, unit } = focusBaseline || portraitMetrics(width, height);
    const visibleHeight = Math.min(height, window.visualViewport?.height || height);
    const keyboardOpen = focused && visibleHeight < focusBaseline.height * .82;
    root.classList.toggle('booth-portrait', portrait);
    root.classList.toggle('keyboard-open', keyboardOpen);
    root.style.setProperty('--booth-unit', unit + 'px');
    clearTimeout(scrollTimer);
    if (keyboardOpen) scrollTimer = setTimeout(() => field.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 160);
  }
  window.addEventListener('resize', update);
  window.visualViewport?.addEventListener('resize', update);
  field?.addEventListener('focus', update);
  field?.addEventListener('blur', () => {
    clearTimeout(scrollTimer);
    root.classList.remove('keyboard-open');
    focusBaseline = null;
    setTimeout(update, 220);
  });
  update();
}
