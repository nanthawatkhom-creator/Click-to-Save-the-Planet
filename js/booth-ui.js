export function portraitMetrics(width, height) {
  const portrait = height / width >= 1.15;
  const unit = Math.min(width / 1080, height / 1920);
  return { portrait, unit };
}

export function setupBoothViewport() {
  const root = document.documentElement;
  function update() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const { portrait, unit } = portraitMetrics(width, height);
    root.classList.toggle('booth-portrait', portrait);
    root.style.setProperty('--booth-unit', unit + 'px');
  }
  window.addEventListener('resize', update);
  window.visualViewport?.addEventListener('resize', update);
  update();
}
