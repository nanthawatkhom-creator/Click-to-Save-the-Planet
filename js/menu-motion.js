(() => {
  const root = document.documentElement;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'trashSorter.menuMotion';
  let saved = null;
  let button;
  let status;

  try {
    const value = localStorage.getItem(storageKey);
    if (value === 'on' || value === 'off') saved = value;
  } catch { /* The control still works when browser storage is unavailable. */ }

  function update() {
    const enabled = saved ? saved === 'on' : !preference.matches;
    root.dataset.menuMotion = enabled ? 'on' : 'off';
    if (!button) return;
    button.setAttribute('aria-pressed', String(enabled));
    status.textContent = enabled ? 'เปิด' : 'ปิด';
    button.title = enabled
      ? 'ปิดลูกเล่นขยับในหน้าเมนู'
      : 'เปิดมาสคอต ใบไม้ และประกายขยับในหน้าเมนู';
  }

  update();
  preference.addEventListener('change', update);
  document.addEventListener('DOMContentLoaded', () => {
    button = document.getElementById('menu-motion-btn');
    status = document.getElementById('menu-motion-status');
    if (!button || !status) return;
    button.addEventListener('click', () => {
      saved = root.dataset.menuMotion === 'on' ? 'off' : 'on';
      try { localStorage.setItem(storageKey, saved); } catch { /* Session-only choice. */ }
      update();
    });
    update();
  });
})();
