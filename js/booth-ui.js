export function portraitMetrics(width, height) {
  const portrait = height / width >= 1.15;
  const unit = Math.min(width / 1080, height / 1920);
  return { portrait, unit };
}

export function setupBoothViewport() {
  const root = document.documentElement;
  const field = document.getElementById('player-name');
  let stable = null;
  let focusBaseline = null;
  let timer;
  function update() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const focused = document.activeElement === field;
    if (focused) {
      if (!focusBaseline || Math.abs(focusBaseline.width - width) >= 4) {
        focusBaseline = { width, height, ...portraitMetrics(width, height) };
      }
      stable = focusBaseline;
    } else {
      focusBaseline = null;
      stable = { width, height, ...portraitMetrics(width, height) };
    }
    const visibleHeight = Math.min(height, window.visualViewport?.height || height);
    const keyboard = focused && visibleHeight < focusBaseline.height * .82;
    root.classList.toggle('booth-portrait', stable.portrait);
    root.classList.toggle('keyboard-open', keyboard);
    root.style.setProperty('--booth-unit', stable.unit + 'px');
    if (keyboard) {
      clearTimeout(timer);
      timer = setTimeout(() => field.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 160);
    }
  }
  window.addEventListener('resize', update);
  window.visualViewport?.addEventListener('resize', update);
  field.addEventListener('focus', update);
  field.addEventListener('blur', () => {
    root.classList.remove('keyboard-open');
    setTimeout(update, 220);
  });
  update();
}
