import { WASTE_ITEMS } from '../data/items.js?v=2026-10-07-direct-sort';
import { setupBoothViewport, portraitMetrics } from './booth-ui.js?v=2026-10-09-local-leaderboard';
import { loadTopScores, submitScore, normalizePlayerName, isLeaderboardTemporary } from './leaderboard-service.js?v=2026-10-09-local-leaderboard';

const $ = (id) => document.getElementById(id);
const hud = $('hud');
const scoreEl = $('hud-score');
const comboEl = $('hud-combo');
const comboFill = $('combo-fill');
const timeEl = $('hud-time');
const phaseEl = $('hud-phase');
const accEl = $('hud-accuracy');
const impactEl = $('hud-impact');
const startScreen = $('start-screen');
const resultScreen = $('result-screen');
const startBtn = $('start-btn');
const startForm = $('start-form');
const playerInput = $('player-name');
const nameError = $('name-error');
const leaderboardScreen = $('leaderboard-screen');
const openLeaderboardBtn = $('open-leaderboard-btn');
const resultLeaderboardBtn = $('result-leaderboard-btn');
const leaderboardBackBtn = $('leaderboard-back-btn');
const playAgainBtn = $('play-again-btn');
const startError = $('start-error');
const toastEl = $('toast');
const stormBanner = $('storm-banner');
const waveBanner = $('wave-banner');
const soundBtn = $('sound-btn');
const comboCard = document.querySelector('.hud-card.combo');
const tutorialHud = $('tutorial-hud');
const tutorialProgressFill = $('tutorial-progress-fill');
const tutorialProgressText = $('tutorial-progress-text');
const feedbackEdge = $('feedback-edge');
let bannerTimer;
let noticeBusy = false;
let noticeQueue = [];
let edgeTimer;
let impactTimer;
let comboTimer;
let lastEdgeAt = 0;
let latestScoreId = null;
let leaderboardSource = 'menu';

setupBoothViewport();

const BY_ID = Object.fromEntries(WASTE_ITEMS.map(item => [item.id, item]));

const WAVE_PRESETS = [
  { title: 'เวฟ 1 · เริ่มจริง!', quota: 4, maxActive: 4, spawnDelay: 0.70, speed: [22, 30], pool: ['can', 'apple', 'tissue', 'cable'] },
  { title: 'เวฟ 2 · เจอของใหม่', quota: 7, maxActive: 3, spawnDelay: 0.78, speed: [28, 39], pool: ['pet', 'can', 'banana', 'apple', 'wrapper', 'milk-carton', 'eggshell', 'plastic-cup'] },
  { title: 'เวฟ 3 · เริ่มเร็วขึ้น', quota: 9, maxActive: 3, spawnDelay: 0.70, speed: [35, 49], pool: ['pet', 'glass', 'cardboard', 'banana', 'food', 'wrapper', 'foam', 'newspaper', 'plastic-bag', 'tea-bag'] },
  { title: 'เวฟ 4 · เพิ่มความท้าทาย', quota: 11, maxActive: 4, spawnDelay: 0.62, speed: [43, 59], pool: ['pet', 'can', 'glass', 'cardboard', 'apple', 'food', 'wrapper', 'foam', 'battery', 'plastic-spoon', 'face-mask', 'glass-jar', 'light-bulb'] },
  { title: 'เวฟ 5 · ของยากมาแล้ว', quota: 13, maxActive: 4, spawnDelay: 0.54, speed: [51, 70], pool: ['pet', 'can', 'glass', 'cardboard', 'banana', 'apple', 'food', 'wrapper', 'foam', 'battery', 'cable', 'phone', 'spray-can', 'coffee-cup', 'newspaper', 'eggshell'] },
  { title: 'เวฟ 6 · แยกให้ไว', quota: 15, maxActive: 5, spawnDelay: 0.46, speed: [58, 80], pool: WASTE_ITEMS.map(x => x.id) },
];

let sceneRef = null;
let sounds = {};
let muted = false;
let audioReady = false;

function makeSounds() {
  if (!window.Howl || audioReady) return;
  sounds = {
    correct: new Howl({ src: ['assets/audio/correct.wav'], volume: 0.58 }),
    wrong: new Howl({ src: ['assets/audio/wrong.wav'], volume: 0.52 }),
    combo: new Howl({ src: ['assets/audio/combo.wav'], volume: 0.58 }),
    storm: new Howl({ src: ['assets/audio/storm.wav'], volume: 0.58 }),
    start: new Howl({ src: ['assets/audio/start.wav'], volume: 0.55 }),
    finish: new Howl({ src: ['assets/audio/finish.wav'], volume: 0.58 }),
    bgm: new Howl({ src: ['assets/audio/bgm.wav'], volume: 0.22, loop: true }),
  };
  audioReady = true;
}

function playSound(name) {
  if (!muted && sounds[name]) sounds[name].play();
}
function startMusic() {
  if (!muted && sounds.bgm && !sounds.bgm.playing()) sounds.bgm.play();
}
function stopMusic() {
  if (sounds.bgm) sounds.bgm.stop();
}

soundBtn.addEventListener('click', () => {
  makeSounds();
  muted = !muted;
  window.Howler?.mute(muted);
  soundBtn.innerHTML = muted ? '<span>เสียง</span><strong>ปิด</strong>' : '<span>เสียง</span><strong>เปิด</strong>';
  soundBtn.classList.toggle('muted', muted);
  if (!muted && sceneRef?.playing) startMusic();
});

function toast(msg, tone = 'good') {
  if (noticeBusy) return;
  toastEl.textContent = msg;
  toastEl.dataset.tone = tone;
  toastEl.classList.remove('show');
  void toastEl.offsetWidth;
  toastEl.classList.add('show');
}

function updateHud(s) {
  scoreEl.textContent = Math.round(s.score).toLocaleString('th-TH');
  comboEl.textContent = 'x' + Math.max(1, s.combo);
  comboFill.style.width = Math.min(100, s.combo * 8) + '%';
  const sec = Math.max(0, Math.ceil(s.timeLeft));
  timeEl.textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  const total = s.correct + s.wrong + s.missed;
  accEl.textContent = ((s.correct / (total || 1)) * 100).toFixed(0) + '%';
  const previousImpact = Number(impactEl.dataset.value || 0);
  impactEl.textContent = '≈ ' + s.impact.toFixed(2) + ' kg CO₂e';
  impactEl.dataset.value = s.impact;
  if (s.impact > previousImpact) {
    clearTimeout(impactTimer);
    impactEl.classList.remove('is-updated');
    void impactEl.offsetWidth;
    impactEl.classList.add('is-updated');
    impactTimer = setTimeout(() => impactEl.classList.remove('is-updated'), 420);
  }
  phaseEl.textContent = `เวฟ ${Math.max(1, s.waveIndex)}${s.storm ? ' · พายุขยะ' : ''}`;
  comboCard?.classList.toggle('hot', s.combo >= 4);
}

function showStorm() {
  showWaveBanner('พายุขยะมาแล้ว! เหลือ 15 วินาที', { tone: 'warning', priority: true });
  playSound('storm');
}

function showWaveBanner(text, { mode = 'notice', tone = 'normal', priority = false } = {}) {
  if (mode === 'countdown' || priority) {
    clearTimeout(bannerTimer);
    noticeBusy = false;
    noticeQueue = [];
  } else if (noticeBusy) {
    if (!noticeQueue.some(notice => notice.text === text)) {
      noticeQueue.push({ text, tone });
      noticeQueue = noticeQueue.slice(-3);
    }
    return;
  }
  toastEl.classList.remove('show');
  waveBanner.textContent = text;
  waveBanner.dataset.mode = mode;
  waveBanner.dataset.tone = tone;
  waveBanner.classList.remove('hidden');
  waveBanner.classList.remove('show');
  void waveBanner.offsetWidth;
  waveBanner.classList.add('show');
  noticeBusy = mode === 'notice';
  bannerTimer = setTimeout(() => {
    waveBanner.classList.remove('show');
    waveBanner.classList.add('hidden');
    noticeBusy = false;
    const next = noticeQueue.shift();
    if (next) showWaveBanner(next.text, { tone: next.tone });
  }, mode === 'countdown' ? 850 : 2000);
}

function wrongEdge() {
  const now = Date.now();
  if (now - lastEdgeAt < 350) return;
  lastEdgeAt = now;
  clearTimeout(edgeTimer);
  feedbackEdge.dataset.tone = 'wrong';
  feedbackEdge.classList.remove('show');
  void feedbackEdge.offsetWidth;
  feedbackEdge.classList.add('show');
  edgeTimer = setTimeout(() => feedbackEdge.classList.remove('show'), 350);
}

function resetVisualFeedback() {
  for (const timer of [bannerTimer, edgeTimer, impactTimer, comboTimer]) clearTimeout(timer);
  noticeBusy = false;
  noticeQueue = [];
  waveBanner.classList.remove('show');
  waveBanner.classList.add('hidden');
  stormBanner.classList.remove('show');
  toastEl.classList.remove('show');
  feedbackEdge.classList.remove('show');
  impactEl.classList.remove('is-updated');
  comboCard?.classList.remove('is-celebrating');
}

function showRoundResult(s) {
  stopMusic();
  playSound('finish');
  hud.classList.add('hidden');
  tutorialHud?.classList.add('hidden');
  $('end-score').textContent = Math.round(s.score).toLocaleString('th-TH');
  $('end-impact').textContent = '≈ ' + s.impact.toFixed(2) + ' kg CO₂e';
  $('end-items').textContent = s.correct + ' ชิ้น';
  $('end-player-name').textContent = s.player;
  const submission = submitScore({ name: s.player, score: s.score, co2e: s.impact, items: s.correct });
  latestScoreId = submission.current.id;
  const status = $('score-save-status');
  status.dataset.state = submission.saved ? 'saved' : 'temporary';
  if (!submission.saved) {
    status.textContent = 'เบราว์เซอร์บล็อก Cookie · เก็บอันดับได้ชั่วคราวจนกว่าจะปิดหน้านี้';
  } else if (submission.rank) {
    status.textContent = `บันทึกคะแนนแล้ว · อันดับ ${submission.rank} ของเครื่องนี้`;
  } else {
    status.textContent = 'คะแนนรอบนี้ยังไม่ติด 10 อันดับสูงสุด · ลองอีกครั้งได้เลย!';
  }
  playAgainBtn.textContent = 'เล่นอีกครั้ง';
  resultScreen.classList.remove('hidden');
}

function openLeaderboard(source) {
  if (sceneRef?.playing || startScreen.classList.contains('starting')) return;
  leaderboardSource = source;
  resetVisualFeedback();
  stopMusic();
  startScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');
  hud.classList.add('hidden');
  tutorialHud?.classList.add('hidden');
  const list = $('leaderboard-list');
  list.replaceChildren();
  const rows = loadTopScores();
  rows.forEach((row, index) => {
    const item = document.createElement('li');
    item.className = 'leaderboard-row';
    if (source === 'result' && row.id === latestScoreId) {
      item.classList.add('current');
      item.setAttribute('aria-current', 'true');
    }
    const rank = document.createElement('span');
    rank.className = 'leaderboard-rank';
    rank.textContent = index + 1;
    const player = document.createElement('div');
    player.className = 'leaderboard-player';
    const name = document.createElement('strong');
    name.textContent = row.name;
    const impact = document.createElement('small');
    impact.textContent = `≈ ${row.co2e.toFixed(2)} kg CO₂e`;
    player.append(name, impact);
    const score = document.createElement('div');
    score.className = 'leaderboard-score';
    const points = document.createElement('strong');
    points.textContent = row.score.toLocaleString('th-TH');
    const unit = document.createElement('small');
    unit.textContent = 'คะแนน';
    score.append(points, unit);
    item.append(rank, player, score);
    list.append(item);
  });
  $('leaderboard-empty').classList.toggle('hidden', rows.length > 0);
  $('leaderboard-storage-note').textContent = isLeaderboardTemporary()
    ? 'Cookie ถูกบล็อก · อันดับเก็บชั่วคราวในหน้านี้'
    : 'บันทึกด้วย Cookie ในเบราว์เซอร์นี้ · คะแนนแต่ละเครื่องแยกกัน';
  leaderboardBackBtn.textContent = source === 'result' ? 'กลับหน้าสรุปผล' : 'กลับหน้าเริ่มเกม';
  leaderboardScreen.classList.remove('hidden');
  $('leaderboard-title').focus({ preventScroll: true });
}

function closeLeaderboard() {
  leaderboardScreen.classList.add('hidden');
  if (leaderboardSource === 'result') {
    resultScreen.classList.remove('hidden');
    resultLeaderboardBtn.focus({ preventScroll: true });
  } else {
    startScreen.classList.remove('hidden');
    openLeaderboardBtn.focus({ preventScroll: true });
  }
}

function showStartFailure(message) {
  startBtn.disabled = true;
  startError.textContent = message;
  startError.classList.remove('hidden');
}

// Keep the menu error readable when both Phaser CDN requests fail.
class GameScene extends (window.Phaser?.Scene || class {}) {
  constructor() {
    super('GameScene');
    this.playing = false;
    this.currentHoverBin = null;
    this.tutorialMode = false;
    this.tutorialCorrect = 0;
  }

  preload() {
    this.load.image('campus', 'assets/campus/campus-game.jpg');
    for (const item of WASTE_ITEMS) this.load.image('w_' + item.id, item.asset);
    ['general', 'special', 'recycle', 'organic'].forEach(key => {
      this.load.image('bin_closed_' + key, `assets/bins_closed_new/${key}.png`);
      this.load.image('bin_open_' + key, `assets/bins_open_new/${key}.png`);
      this.load.image('bin_closed_glow_' + key, `assets/bins_closed_new_glow/${key}.png`);
      this.load.image('bin_open_glow_' + key, `assets/bins_open_new_glow/${key}.png`);
    });
  }

  create() {
    sceneRef = this;
    this.cityImage = this.add.image(this.scale.width / 2, this.scale.height / 2, 'campus').setDepth(-50);
    this.smogOverlay = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x8A93A0, 0.22).setDepth(-45);
    this.cityStage = 0;
    this.items = [];
    this.bins = {};
    this.makeBins();

    this.activeDrag = null;
    this.activePointerId = null;

    this.input.on('pointerdown', pointer => {
      if (!this.playing || this.activeDrag) return;
      const target = this.findWasteAt(pointer.x, pointer.y);
      if (target) this.beginManualDrag(target, pointer);
    });

    this.input.on('pointermove', pointer => {
      if (!this.activeDrag || !this.playing) return;
      if (this.activePointerId !== null && pointer.id !== this.activePointerId) return;
      this.moveActiveDrag(pointer);
    });

    this.input.on('pointerup', pointer => {
      if (!this.activeDrag) return;
      if (this.activePointerId !== null && pointer.id !== this.activePointerId) return;
      this.endActiveDrag(pointer);
    });

    this.scale.on('resize', () => this.layout());
    window.visualViewport?.addEventListener('resize', () => this.layout());
    this.hudResizeObserver = new ResizeObserver(() => this.layout());
    this.hudResizeObserver.observe(hud);
    this.hudResizeObserver.observe(tutorialHud);
    this.events.once('shutdown', () => this.hudResizeObserver.disconnect());
    this.layout();
    startError.classList.add('hidden');
    startBtn.disabled = false;
  }

  findWasteAt(x, y) {
    let best = null;
    let bestRatio = Infinity;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (!item?.active || item.isDragging) continue;
      const radius = item.hitRadius || 72;
      const d = Phaser.Math.Distance.Between(x, y, item.x, item.y);
      if (d <= radius) {
        const ratio = d / radius;
        if (ratio < bestRatio) {
          bestRatio = ratio;
          best = item;
        }
      }
    }
    return best;
  }

  beginManualDrag(obj, pointer) {
    if (!this.playing || !obj?.wasteDef || this.activeDrag) return;
    this.activeDrag = obj;
    this.activePointerId = pointer.id;
    obj.isDragging = true;
    obj.dragOffsetX = obj.x - pointer.x;
    obj.dragOffsetY = obj.y - pointer.y;
    obj.setDepth(30);
    obj.grabHalo?.setAlpha(0.34);
    obj.grabHalo?.setStrokeStyle(5, 0xFFFFFF, 0.95);
    this.tweens.killTweensOf(obj);
    this.tweens.add({ targets: obj, scale: 1.10, duration: 75, ease: 'Sine.Out' });
    this.updateBinHover(obj.x, obj.y);
    try {
      const ev = pointer.event;
      if (ev?.target?.setPointerCapture && ev.pointerId !== undefined) ev.target.setPointerCapture(ev.pointerId);
      ev?.preventDefault?.();
    } catch {}
  }

  moveActiveDrag(pointer) {
    const obj = this.activeDrag;
    if (!obj) return;
    const pad = obj.hitRadius || 72;
    const minY = Math.max(78, this.safeTop ? this.safeTop - 40 : 90);
    const maxY = Math.min(this.scale.height, window.visualViewport?.height || this.scale.height) - 18;
    obj.x = Phaser.Math.Clamp(pointer.x + (obj.dragOffsetX || 0), pad * 0.55, this.scale.width - pad * 0.55);
    obj.y = Phaser.Math.Clamp(pointer.y + (obj.dragOffsetY || 0), minY, maxY);
    obj.angle = 0;
    this.updateBinHover(obj.x, obj.y);
  }

  endActiveDrag(pointer) {
    const obj = this.activeDrag;
    if (!obj) return;
    const hovered = this.currentHoverBin;
    obj.isDragging = false;
    obj.setDepth(10);
    obj.grabHalo?.setAlpha(0.14);
    obj.grabHalo?.setStrokeStyle(4, 0xFFFFFF, 0.68);
    this.tweens.add({ targets: obj, scale: 1, duration: 90, ease: 'Sine.Out' });
    this.activeDrag = null;
    this.activePointerId = null;
    this.clearBinHover();
    this.handleDrop(obj, hovered);
    try {
      const ev = pointer?.event;
      if (ev?.target?.releasePointerCapture && ev.pointerId !== undefined) ev.target.releasePointerCapture(ev.pointerId);
    } catch {}
  }

  layout() {
    const w = this.scale.width;
    const canvasH = this.scale.height;
    const h = Math.min(canvasH, window.visualViewport?.height || canvasH);
    const { portrait, unit: u } = portraitMetrics(w, h);
    const previousFallFactor = this.portraitLayout ? this.playHeight / 900 : 1;
    const fallFactor = portrait ? h / 900 : 1;
    this.portraitLayout = portrait;
    this.layoutUnit = u;
    this.playHeight = h;
    this.cityImage.setPosition(w / 2, canvasH / 2);
    this.cityImage.setScale(Math.max(w / 1600, canvasH / 900));
    this.smogOverlay.setPosition(w / 2, canvasH / 2).setSize(w, canvasH).setDisplaySize(w, canvasH);

    const panel = this.tutorialMode ? tutorialHud : hud;
    const panelBottom = panel.getBoundingClientRect().bottom;
    const baseTop = portrait ? Math.max(110, 220 * u) : (w < 600 ? 150 : (h < 720 ? 120 : 135));
    const messageSpace = portrait ? Math.max(56, 136 * u) : 80;
    const panelGap = portrait ? Math.max(12, 24 * u) : 12;
    this.safeTop = panelBottom > 0
      ? Math.max(baseTop, panelBottom + panelGap * 2 + messageSpace)
      : baseTop;
    document.documentElement.style.setProperty('--hud-bottom', (panelBottom || baseTop) + 'px');
    const binOrder = ['general', 'special', 'recycle', 'organic'];
    const side = portrait ? Math.max(8, 60 * u) : Math.max(5, w * .012);
    const gap = portrait ? Math.max(5, 18 * u) : Math.max(2, w * .004);
    const bw = (w - side * 2 - gap * 3) / 4;
    const binY = h - (portrait ? Math.max(44, 100 * u) : 4);
    this.binTop = h;

    binOrder.forEach((cat, i) => {
      const b = this.bins[cat];
      const x = side + bw / 2 + i * (bw + gap);
      const mobileScale = h < 700 ? .27 : .30;
      const scale = portrait
        ? Math.min(bw * .92 / b.sprite.width, 390 * u / b.sprite.height)
        : Math.min((bw + 14) / 360, w < 600 ? mobileScale : (h < 700 ? .31 : .38));
      b.container.setPosition(x, binY);
      b.baseX = x;
      b.baseScale = scale;
      b.sprite.setScale(scale);
      b.glow.setScale(scale * 1.10);
      b.shadow.setDisplaySize(portrait ? bw * .76 : 120, portrait ? Math.max(10, 24 * u) : 24);
      b.label.setVisible(portrait).setPosition(0, Math.max(16, 32 * u));
      b.label.setFontSize(Math.max(12, 26 * u)).setPadding(Math.max(4, 14 * u), Math.max(3, 6 * u));
      const artH = b.sprite.displayHeight;
      this.binTop = Math.min(this.binTop, binY - artH);
      const hitW = portrait ? bw * .96 : Math.max(98, bw * 1.08);
      const hitH = portrait ? artH * .98 : Math.max(180, Math.min(250, h * .29));
      b.hit = new Phaser.Geom.Ellipse(x, binY - hitH * .50, hitW, hitH);
    });

    for (const item of this.items) {
      if (Number.isFinite(item.fallSpeed)) item.fallSpeed *= fallFactor / previousFallFactor;
      this.resizeWasteItem(item);
    }
    if (this.tutorialMode && this.items.length) this.positionTutorialItems();
  }

  makeBins() {
    ['general', 'special', 'recycle', 'organic'].forEach(cat => {
      const c = this.add.container(0, 0).setDepth(8);
      const shadow = this.add.ellipse(0, -2, 120, 24, 0x000000, 0.18);
      const glow = this.add.image(0, 0, 'bin_closed_glow_' + cat).setOrigin(0.5, 1).setAlpha(0);
      const sprite = this.add.image(0, 0, 'bin_closed_' + cat).setOrigin(0.5, 1);
      const names = { general: 'ทั่วไป', special: 'อันตราย', recycle: 'รีไซเคิล', organic: 'ขยะเปียก' };
      const label = this.add.text(0, 0, names[cat], { fontFamily: 'Noto Sans Thai, sans-serif', fontSize: '26px', fontStyle: 'bold', color: '#294e43', backgroundColor: '#fffdf4' }).setOrigin(.5).setVisible(false);
      c.add([shadow, glow, sprite, label]);
      this.bins[cat] = {
        container: c,
        shadow,
        glow,
        sprite,
        label,
        hit: null,
        state: 'closed',
        baseScale: 1,
        closedKey: 'bin_closed_' + cat,
        openKey: 'bin_open_' + cat,
        closedGlowKey: 'bin_closed_glow_' + cat,
        openGlowKey: 'bin_open_glow_' + cat,
      };
    });
  }

  setBinVisual(cat, state = 'closed') {
    const b = this.bins[cat];
    if (!b || b.state === state) return;
    b.state = state;
    this.tweens.killTweensOf([b.sprite, b.glow, b.container]);
    b.container.x = b.baseX;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced && (state === 'success' || state === 'wrong')) {
      b.sprite.setTexture(b.openKey).setScale(b.baseScale);
      b.glow.setTexture(b.openGlowKey).setScale(b.baseScale * 1.10).setAlpha(.85).setTint(state === 'success' ? 0x8CE1A6 : 0xFF566A);
      this.time.delayedCall(250, () => this.setBinVisual(cat, 'closed'));
      return;
    }

    if (state === 'closed') {
      b.sprite.setTexture(b.closedKey);
      b.glow.setTexture(b.closedGlowKey).setAlpha(0).clearTint();
      this.tweens.add({ targets: b.sprite, scale: b.baseScale, duration: 90, ease: 'Sine.Out' });
      this.tweens.add({ targets: b.glow, scale: b.baseScale * 1.10, alpha: 0, duration: 90 });
    } else if (state === 'open') {
      b.sprite.setTexture(b.openKey);
      b.glow.setTexture(b.openGlowKey).setScale(b.baseScale * 1.12).setAlpha(0.82).clearTint();
      this.tweens.add({ targets: b.sprite, scale: b.baseScale * 1.025, duration: 90, ease: 'Sine.Out' });
      if (!reduced) this.tweens.add({ targets: b.glow, alpha: { from: 0.48, to: 0.90 }, scale: { from: b.baseScale * 1.08, to: b.baseScale * 1.14 }, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    } else if (state === 'success') {
      b.sprite.setTexture(b.openKey);
      b.glow.setTexture(b.openGlowKey).setScale(b.baseScale * 1.16).setAlpha(1).setTint(0x8CE1A6);
      this.tweens.add({ targets: [b.sprite, b.glow], scale: b.baseScale * 1.08, duration: 100, yoyo: true, ease: 'Back.Out' });
      this.tweens.add({ targets: b.glow, alpha: 0.10, duration: 190, yoyo: true });
      this.time.delayedCall(250, () => this.setBinVisual(cat, 'closed'));
    } else if (state === 'wrong') {
      b.sprite.setTexture(b.openKey);
      b.glow.setTexture(b.openGlowKey).setScale(b.baseScale * 1.13).setAlpha(0.75).setTint(0xFF566A);
      this.tweens.add({ targets: b.container, x: b.baseX + 4, yoyo: true, repeat: 1, duration: 60, ease: 'Sine.InOut' });
      this.tweens.add({ targets: b.glow, alpha: 0.12, duration: 180, yoyo: true });
      this.time.delayedCall(250, () => this.setBinVisual(cat, 'closed'));
    }
  }

  updateBinHover(x, y) {
    let hovered = null;
    let bestDistance = Infinity;
    for (const [cat, b] of Object.entries(this.bins)) {
      if (!b.hit || !Phaser.Geom.Ellipse.Contains(b.hit, x, y)) continue;
      const d = Phaser.Math.Distance.Between(x, y, b.hit.x, b.hit.y);
      if (d < bestDistance) {
        bestDistance = d;
        hovered = cat;
      }
    }
    if (hovered === this.currentHoverBin) return;
    this.currentHoverBin = hovered;
    for (const cat of Object.keys(this.bins)) this.setBinVisual(cat, cat === hovered ? 'open' : 'closed');
  }

  clearBinHover() {
    this.currentHoverBin = null;
    for (const cat of Object.keys(this.bins)) {
      if (this.bins[cat].state === 'open') this.setBinVisual(cat, 'closed');
    }
  }

  wasteSizing() {
    const w = this.scale.width;
    const { portrait, unit } = portraitMetrics(w, this.playHeight || this.scale.height);
    return {
      grabRadius: portrait ? Math.max(52, 108 * unit) : (w < 600 ? 82 : (w < 900 ? 78 : 74)),
      maxVisual: portrait ? Math.max(96, 180 * unit) : (w < 600 ? 122 : (w < 900 ? 128 : 136)),
      unit,
      portrait,
    };
  }

  resizeWasteItem(item) {
    if (!item.wasteImage) return;
    const { grabRadius, maxVisual, portrait, unit } = this.wasteSizing();
    item.hitRadius = grabRadius;
    item.wasteImage.setScale(Math.min(maxVisual / item.wasteImage.width, maxVisual / item.wasteImage.height));
    item.grabHalo.setRadius(grabRadius);
    item.innerHalo.setRadius(grabRadius - 8);
    item.wasteShadow.setPosition(0, grabRadius * .52).setDisplaySize(grabRadius * 1.12, grabRadius * .30);
    const badgeSize = portrait ? Math.max(10, 22 * unit) : 10;
    item.rareBadge?.setPosition(-grabRadius * .50, -grabRadius * .56).setFontSize(badgeSize);
    if (!item.isDragging && item.tutorialSlot === undefined) {
      item.x = Phaser.Math.Clamp(item.x, grabRadius, this.scale.width - grabRadius);
      item.y = Phaser.Math.Clamp(item.y, this.safeTop + grabRadius, Math.max(this.safeTop + grabRadius, this.binTop - grabRadius));
    }
  }

  tutorialSlotPosition(slot) {
    const w = this.scale.width;
    const h = this.playHeight || this.scale.height;
    if (this.portraitLayout) {
      const { grabRadius } = this.wasteSizing();
      const top = this.safeTop + grabRadius + 30 * this.layoutUnit;
      const bottom = Math.max(top, this.binTop - grabRadius - 70 * this.layoutUnit);
      const xs = [w * .28, w * .72];
      const ys = [top + (bottom - top) * .24, top + (bottom - top) * .72];
      return { x: xs[slot % 2], y: ys[Math.floor(slot / 2)] };
    }
    const xs = [w * .17, w * .39, w * .61, w * .83];
    return { x: xs[slot], y: Math.max(this.safeTop + 96, h * .30) };
  }

  positionTutorialItems() {
    for (const item of this.items) {
      if (item.tutorialSlot === undefined || item.isDragging) continue;
      const pos = this.tutorialSlotPosition(item.tutorialSlot);
      item.homeX = pos.x;
      item.homeY = pos.y;
      item.setPosition(pos.x, pos.y);
    }
  }

  createTutorialItem(def, slot) {
    const pos = this.tutorialSlotPosition(slot);
    const w = this.scale.width;
    const { grabRadius, maxVisual } = this.wasteSizing();
    const c = this.add.container(pos.x, pos.y).setDepth(10);
    c.wasteDef = def;
    c.isDragging = false;
    c.age = 0;
    c.hitRadius = grabRadius;
    c.fallSpeed = 0;
    c.tutorialSlot = slot;
    c.homeX = pos.x;
    c.homeY = pos.y;

    const shadow = this.add.ellipse(0, grabRadius * 0.52, grabRadius * 1.12, grabRadius * 0.30, 0x26323D, 0.22);
    const halo = this.add.circle(0, 0, grabRadius, 0xFFFFFF, 0.15).setStrokeStyle(4, 0xFFFFFF, 0.82);
    const innerHalo = this.add.circle(0, 0, grabRadius - 8, 0xDFF8FF, 0.04).setStrokeStyle(2, 0xDFF8FF, 0.30);
    const img = this.add.image(0, -2, 'w_' + def.id);
    const scale = Math.min(maxVisual / img.width, maxVisual / img.height);
    img.setScale(scale);
    c.add([shadow, halo, innerHalo, img]);
    c.grabHalo = halo;
    c.wasteImage = img;
    c.innerHalo = innerHalo;
    c.wasteShadow = shadow;
    this.items.push(c);
    this.tweens.add({ targets: c, scale: { from: 0.78, to: 1 }, alpha: { from: 0, to: 1 }, duration: 260 + slot * 70, ease: 'Back.Out' });
    return c;
  }

  updateTutorialProgress() {
    const done = Math.max(0, Math.min(4, this.tutorialCorrect));
    if (tutorialProgressFill) tutorialProgressFill.style.width = `${done * 25}%`;
    if (tutorialProgressText) tutorialProgressText.textContent = `${done} / 4 ชิ้น`;
  }

  startTutorial(playerName) {
    this.player = playerName;
    resetVisualFeedback();
    this.clearItems();
    this.tutorialMode = true;
    this.tutorialCorrect = 0;
    this.playing = true;
    this.activeDrag = null;
    this.activePointerId = null;
    this.currentHoverBin = null;
    this.setCityStage(0, true);
    hud.classList.add('hidden');
    tutorialHud?.classList.remove('hidden');
    this.updateTutorialProgress();
    this.layout();
    showWaveBanner('ลองแยกขยะ 4 ประเภท');

    const tutorialIds = ['pet', 'banana', 'wrapper', 'battery'];
    tutorialIds.forEach((id, slot) => this.createTutorialItem(BY_ID[id], slot));
    playSound('start');
  }

  finishTutorial() {
    if (!this.tutorialMode) return;
    this.tutorialMode = false;
    this.playing = false;
    this.clearBinHover();
    tutorialHud?.classList.add('complete');
    if (tutorialProgressText) tutorialProgressText.textContent = 'พร้อมแล้ว!';
    playSound('combo');

    const steps = [
      [300, '3'],
      [1200, '2'],
      [2100, '1'],
      [3000, 'เริ่ม!'],
    ];
    for (const [delay, label] of steps) {
      this.time.delayedCall(delay, () => showWaveBanner(label, { mode: 'countdown' }));
    }
    this.time.delayedCall(3700, () => {
      tutorialHud?.classList.add('hidden');
      tutorialHud?.classList.remove('complete');
      hud.classList.remove('hidden');
      this.startRound();
    });
  }

  startRound() {
    resetVisualFeedback();
    this.clearItems();
    this.tutorialMode = false;
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.correct = 0;
    this.wrong = 0;
    this.missed = 0;
    this.impact = 0;
    this.timeLeft = 75;
    this.spawnClock = 0.55;
    this.storm = false;
    this.cityStage = 0;
    this.waveIndex = 0;
    this.waveName = '';
    this.waveWaiting = false;
    this.waveResolved = false;
    this.lastSpawnId = null;
    this.activeDrag = null;
    this.activePointerId = null;
    this.playing = true;
    this.setCityStage(0, true);
    this.layout();
    this.advanceWave(true);
    updateHud(this);
    playSound('start');
    startMusic();
  }

  clearItems() {
    this.activeDrag = null;
    this.activePointerId = null;
    for (const o of this.items || []) o.destroy();
    this.items = [];
    if (this.dropFeedbackNode) {
      this.tweens.killTweensOf(this.dropFeedbackNode);
      this.dropFeedbackNode.destroy();
      this.dropFeedbackNode = null;
    }
  }

  getWaveConfig(index) {
    const preset = WAVE_PRESETS[index - 1];
    if (preset) return preset;
    const bonus = index - WAVE_PRESETS.length;
    return {
      title: `เวฟ ${index} · เร็วขึ้นอีก`,
      quota: 14 + bonus * 2,
      maxActive: Math.min(6, 4 + Math.floor(bonus / 2)),
      spawnDelay: Math.max(0.38, 0.54 - bonus * 0.04),
      speed: [62 + bonus * 4, 86 + bonus * 6],
      pool: WASTE_ITEMS.map(x => x.id),
    };
  }

  advanceWave(initial = false) {
    this.waveIndex += 1;
    this.currentWave = this.getWaveConfig(this.waveIndex);
    this.spawnedInWave = 0;
    this.waveWaiting = false;
    this.waveResolved = false;
    this.spawnClock = initial ? 0.28 : 0.78;
    showWaveBanner(this.currentWave.title);
    updateHud(this);
  }

  randomDef() {
    let ids = [...(this.currentWave.pool || WASTE_ITEMS.map(x => x.id))];
    if (this.lastSpawnId && ids.length > 1) ids = ids.filter(id => id !== this.lastSpawnId);
    if (this.storm && ids.includes('board') && Math.random() < 0.14) {
      this.lastSpawnId = 'board';
      return BY_ID.board;
    }
    const id = ids[Math.floor(Math.random() * ids.length)];
    this.lastSpawnId = id;
    return BY_ID[id];
  }

  spawnItem() {
    const activeCap = this.portraitLayout ? Math.min(this.currentWave.maxActive, this.scale.width < 600 ? 3 : 4) : this.currentWave.maxActive;
    if (this.spawnedInWave >= this.currentWave.quota || this.items.length >= activeCap) return;

    const def = this.randomDef();
    const w = this.scale.width;
    const h = this.scale.height;
    const { grabRadius, maxVisual } = this.wasteSizing();
    const margin = grabRadius + 12;
    const minGap = this.portraitLayout ? grabRadius * 2.05 : (w < 600 ? 118 : 138);
    let startX = Phaser.Math.Between(margin, Math.max(margin + 1, w - margin));
    const startYBase = this.safeTop + grabRadius + (this.portraitLayout ? 28 * this.layoutUnit : 12);
    let startY = Phaser.Math.Between(startYBase, startYBase + (w < 600 ? 76 : 96));

    let foundSpace = false;
    for (let tries = 0; tries < 24; tries++) {
      const candidateX = Phaser.Math.Between(margin, Math.max(margin + 1, w - margin));
      const candidateY = Phaser.Math.Between(startYBase, startYBase + (w < 600 ? 84 : 110));
      const farEnough = this.items.every(it => Phaser.Math.Distance.Between(it.x, it.y, candidateX, candidateY) > minGap);
      if (farEnough) {
        foundSpace = true;
        startX = candidateX;
        startY = candidateY;
        break;
      }
    }

    if (this.portraitLayout && !foundSpace) return;
    const c = this.add.container(startX, startY).setDepth(10);
    c.wasteDef = def;
    c.isDragging = false;
    c.age = 0;
    c.hitRadius = grabRadius;
    c.fallSpeed = (Phaser.Math.Between(this.currentWave.speed[0], this.currentWave.speed[1]) + (this.storm ? 12 : 0)) * (this.portraitLayout ? this.playHeight / 900 : 1);

    const shadow = this.add.ellipse(0, grabRadius * 0.52, grabRadius * 1.12, grabRadius * 0.30, 0x26323D, 0.22);
    const halo = this.add.circle(0, 0, grabRadius, 0xFFFFFF, 0.13).setStrokeStyle(4, 0xFFFFFF, 0.72);
    const innerHalo = this.add.circle(0, 0, grabRadius - 8, 0xDFF8FF, 0.035).setStrokeStyle(2, 0xDFF8FF, 0.25);
    const img = this.add.image(0, -2, 'w_' + def.id);
    const scale = Math.min(maxVisual / img.width, maxVisual / img.height);
    img.setScale(scale);
    c.add([shadow, halo, innerHalo, img]);
    c.grabHalo = halo;
    c.wasteImage = img;
    c.innerHalo = innerHalo;
    c.wasteShadow = shadow;

    if (def.rare) {
      const rare = this.add.text(-grabRadius * 0.50, -grabRadius * 0.56, 'BONUS', {
        fontFamily: 'Noto Sans Thai, sans-serif', fontSize: w < 600 ? '9px' : '10px', fontStyle: '900', color: '#5F4C80', backgroundColor: '#EFE7FF', padding: { x: 6, y: 4 }
      }).setOrigin(0.5);
      c.add(rare);
      c.rareBadge = rare;
    }

    this.resizeWasteItem(c);
    this.items.push(c);
    this.spawnedInWave += 1;
    this.tweens.add({ targets: c, scale: { from: 0.82, to: 1 }, alpha: { from: 0, to: 1 }, duration: 190, ease: 'Back.Out' });
  }

  dropFeedback(cat, label, tone = 'good', position = null) {
    if (this.dropFeedbackNode) {
      this.tweens.killTweensOf(this.dropFeedbackNode);
      this.dropFeedbackNode.destroy();
    }
    const u = this.layoutUnit || 1;
    const size = this.portraitLayout ? Math.max(14, 32 * u) : 20;
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Noto Sans Thai, sans-serif', fontSize: size + 'px', fontStyle: 'bold', color: '#FFFDF5',
      padding: { x: Math.max(8, 18 * u), y: Math.max(6, 12 * u) },
    }).setOrigin(.5);
    const plate = this.add.graphics();
    const color = tone === 'wrong' ? 0x842C3D : tone === 'neutral' ? 0x48415C : 0x164D3B;
    plate.fillStyle(color, 1).fillRoundedRect(-text.width / 2, -text.height / 2, text.width, text.height, Math.max(10, 18 * u));
    const bin = this.bins[cat];
    const x = Phaser.Math.Clamp(position?.x ?? bin?.container.x ?? this.scale.width / 2, text.width / 2 + 10, this.scale.width - text.width / 2 - 10);
    const y = position?.y ?? this.binTop - Math.max(18, 34 * u);
    const node = this.add.container(x, y, [plate, text]).setDepth(45);
    this.dropFeedbackNode = node;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.time.delayedCall(reduced ? 600 : 380, () => {
      if (!node.active) return;
      if (reduced) {
        node.destroy();
        if (this.dropFeedbackNode === node) this.dropFeedbackNode = null;
        return;
      }
      this.tweens.add({ targets: node, y: y - Math.max(12, 28 * u), alpha: 0, duration: 220, ease: 'Sine.In', onComplete: () => {
        node.destroy();
        if (this.dropFeedbackNode === node) this.dropFeedbackNode = null;
      } });
    });
  }

  comboFeedback() {
    if (this.combo < 3) return;
    clearTimeout(comboTimer);
    comboCard?.classList.remove('is-celebrating');
    void comboCard?.offsetWidth;
    comboCard?.classList.add('is-celebrating');
    comboTimer = setTimeout(() => comboCard?.classList.remove('is-celebrating'), 350);
    if ([4, 7, 10].includes(this.combo) || (this.combo > 10 && this.combo % 5 === 0)) {
      playSound('combo');
      comboCard?.classList.remove('hot');
      void comboCard?.offsetWidth;
      comboCard?.classList.add('hot');
    }
  }

  handleDrop(obj, hoveredBin = null) {
    const def = obj.wasteDef;

    if (this.tutorialMode) {
      let hit = hoveredBin;
      if (!hit) {
        let best = null;
        let bestDistance = Infinity;
        for (const [cat, b] of Object.entries(this.bins)) {
          if (!b.hit || !Phaser.Geom.Ellipse.Contains(b.hit, obj.x, obj.y)) continue;
          const d = Phaser.Math.Distance.Between(obj.x, obj.y, b.hit.x, b.hit.y);
          if (d < bestDistance) { bestDistance = d; best = cat; }
        }
        hit = best;
      }

      if (!hit) {
        this.tweens.add({ targets: obj, x: obj.homeX, y: obj.homeY, duration: 220, ease: 'Back.Out' });
        return;
      }

      if (hit !== def.category) {
        playSound('wrong');
        this.setBinVisual(hit, 'wrong');
        wrongEdge();
        this.dropFeedback(hit, '✕ ผิดถัง · ลองอีกครั้ง', 'wrong');
        this.tweens.add({ targets: obj, x: obj.homeX, y: obj.homeY, duration: 260, ease: 'Back.Out' });
        return;
      }

      playSound('correct');
      this.setBinVisual(hit, 'success');
      this.spark(this.bins[hit].container.x, this.binTop + 24 * this.layoutUnit, 0x8CE1A6);
      this.removeItem(obj);
      this.tutorialCorrect += 1;
      this.updateTutorialProgress();
      this.dropFeedback(hit, '✓ ถูกต้อง!');
      if (this.tutorialCorrect >= 4) this.time.delayedCall(420, () => this.finishTutorial());
      return;
    }

    let hit = hoveredBin;
    if (!hit) {
      for (const [cat, b] of Object.entries(this.bins)) {
        if (b.hit && Phaser.Geom.Ellipse.Contains(b.hit, obj.x, obj.y)) {
          hit = cat;
          break;
        }
      }
    }

    if (!hit) return;

    if (hit !== def.category) {
      this.wrong += 1;
      this.combo = 0;
      this.score = Math.max(0, this.score - 45);
      playSound('wrong');
      wrongEdge();
      this.dropFeedback(hit, '✕ ผิดถัง −45', 'wrong');
      this.setBinVisual(hit, 'wrong');
      this.removeItem(obj);
      updateHud(this);
      this.checkWaveComplete();
      return;
    }

    this.correct += 1;
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const speedBonus = Math.max(0, 58 - Math.round(obj.age * 7));
    const multiplier = 1 + Math.min(1.5, this.combo * 0.08);
    const rareBonus = def.rare ? 240 : 0;
    const gained = (110 + speedBonus + rareBonus) * multiplier;
    this.score += gained;
    this.impact += def.co2eKg * (1 + Math.min(0.28, this.combo * 0.012));

    playSound('correct');
    this.setBinVisual(hit, 'success');
    this.spark(this.bins[hit].container.x, this.binTop + 24 * this.layoutUnit, 0x8CE1A6);
    this.removeItem(obj);
    this.dropFeedback(hit, `✓ ถูกต้อง +${Math.round(gained)}`);
    this.comboFeedback();

    const stage = this.impact >= 2.4 ? 3 : this.impact >= 1.35 ? 2 : this.impact >= 0.55 ? 1 : 0;
    if (stage !== this.cityStage) this.setCityStage(stage);
    updateHud(this);
    this.checkWaveComplete();
  }

  checkWaveComplete() {
    if (this.waveResolved || this.waveWaiting || !this.currentWave) return;
    if (this.spawnedInWave >= this.currentWave.quota && this.items.length === 0) {
      this.waveResolved = true;
      const clearBonus = 120 + this.waveIndex * 30;
      this.score += clearBonus;
      updateHud(this);
      showWaveBanner(`✓ ผ่านเวฟ ${this.waveIndex} · +${clearBonus} คะแนน`);
      this.waveWaiting = true;
      this.time.delayedCall(900, () => {
        if (this.playing && this.timeLeft > 0.1) this.advanceWave();
      });
    }
  }

  spark(x, y, color) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (let i = 0; i < (reduced ? 3 : 8); i++) {
      const p = this.portraitLayout && i % 4 === 0 && !reduced
        ? this.add.text(x, y, i % 8 === 0 ? '✦' : '🍃', { fontSize: Math.max(16, 28 * this.layoutUnit) + 'px', color: '#fff5b7' }).setOrigin(.5).setDepth(28)
        : this.add.circle(x, y, Phaser.Math.FloatBetween(2, Math.max(3, 6 * this.layoutUnit)), color, 1).setDepth(28);
      const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const d = Phaser.Math.FloatBetween(Math.max(18, 40 * this.layoutUnit), Math.max(30, 70 * this.layoutUnit));
      this.tweens.add({ targets: p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, scale: 0.2, duration: reduced ? 200 : Phaser.Math.Between(350, 500), ease: 'Cubic.Out', onComplete: () => p.destroy() });
    }
  }

  removeItem(obj) {
    const idx = this.items.indexOf(obj);
    if (idx >= 0) this.items.splice(idx, 1);
    this.tweens.add({ targets: obj, scale: 0.25, alpha: 0, duration: 160, onComplete: () => obj.destroy() });
  }

  setCityStage(stage, instant = false) {
    this.cityStage = stage;
    const alphas = [0.22, 0.14, 0.07, 0.0];
    const target = alphas[Math.max(0, Math.min(3, stage))];
    if (instant) {
      this.smogOverlay.setAlpha(target);
    } else {
      this.tweens.add({ targets: this.smogOverlay, alpha: target, duration: 650, ease: 'Sine.InOut' });
    }
  }

  update(time, delta) {
    if (!this.playing) return;
    if (this.tutorialMode) return;
    const dt = Math.min(0.04, delta / 1000);
    this.timeLeft -= dt;

    if (this.timeLeft <= 15 && !this.storm) {
      this.storm = true;
      showStorm();
      for (const item of this.items) item.fallSpeed += 12 * (this.portraitLayout ? this.playHeight / 900 : 1);
    }

    if (!this.waveWaiting) {
      this.spawnClock -= dt;
      const spawnDelay = (this.currentWave?.spawnDelay ?? 0.9) * (this.storm ? 0.78 : 1);
      if (this.spawnClock <= 0) {
        this.spawnItem();
        this.spawnClock = spawnDelay;
      }
    }

    const floor = this.portraitLayout ? this.binTop + 20 * this.layoutUnit : this.scale.height - Math.max(180, this.scale.height * 0.23);
    for (const obj of [...this.items]) {
      if (obj.isDragging) continue;
      obj.age += dt;
      obj.y += obj.fallSpeed * dt;
      obj.angle = Math.sin(obj.age * 2 + obj.x * 0.01) * 2.0;
      if (obj.y > floor) {
        this.missed += 1;
        this.combo = 0;
        this.score = Math.max(0, this.score - 20);
        this.dropFeedback(null, 'หลุดไปหนึ่งชิ้น −20', 'wrong');
        playSound('wrong');
        this.removeItem(obj);
        this.checkWaveComplete();
      }
    }

    updateHud(this);
    if (this.timeLeft <= 0) this.finishRound();
  }

  finishRound() {
    if (!this.playing) return;
    this.playing = false;
    this.timeLeft = 0;
    this.clearBinHover();
    updateHud(this);
    this.clearItems();
    resetVisualFeedback();
    showRoundResult(this);
  }
}

async function init() {
  if (!window.Phaser) {
    showStartFailure('โหลดเกมไม่สำเร็จ กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วรีเฟรช');
    return;
  }
  await document.fonts?.ready?.catch?.(() => {});
  new Phaser.Game({
    type: Phaser.CANVAS,
    parent: 'game-root',
    backgroundColor: '#DDECF1',
    scene: [GameScene],
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { activePointers: 2, smoothFactor: 0, dragDistanceThreshold: 0, dragTimeThreshold: 0, topOnly: true },
    render: { antialias: true, pixelArt: false, roundPixels: false, transparent: false },
  });
  makeSounds();
}

startForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!sceneRef || startBtn.disabled) return;
  const name = normalizePlayerName(playerInput.value);
  if (!name) {
    nameError.textContent = 'ใส่ชื่อเล่นก่อนเริ่มเกมนะ';
    nameError.classList.remove('hidden');
    playerInput.setAttribute('aria-invalid', 'true');
    playerInput.focus();
    return;
  }
  playerInput.value = name;
  playerInput.blur();
  nameError.classList.add('hidden');
  playerInput.removeAttribute('aria-invalid');
  makeSounds();
  startBtn.disabled = true;
  startScreen.classList.add('starting');
  setTimeout(() => {
    startScreen.classList.add('hidden');
    startScreen.classList.remove('starting');
    resultScreen.classList.add('hidden');
    sceneRef.startTutorial(name);
    startBtn.disabled = false;
  }, document.documentElement.dataset.menuMotion === 'off' ? 0 : 240);
});

playerInput.addEventListener('input', () => {
  nameError.classList.add('hidden');
  playerInput.removeAttribute('aria-invalid');
});
openLeaderboardBtn.addEventListener('click', () => openLeaderboard('menu'));
resultLeaderboardBtn.addEventListener('click', () => openLeaderboard('result'));
leaderboardBackBtn.addEventListener('click', closeLeaderboard);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !leaderboardScreen.classList.contains('hidden')) closeLeaderboard();
});

playAgainBtn.addEventListener('click', () => {
  resetVisualFeedback();
  resultScreen.classList.add('hidden');
  hud.classList.add('hidden');
  tutorialHud?.classList.add('hidden');
  playerInput.value = '';
  latestScoreId = null;
  nameError.classList.add('hidden');
  playerInput.removeAttribute('aria-invalid');
  startScreen.classList.remove('hidden');
  startBtn.focus({ preventScroll: true });
});

document.addEventListener('contextmenu', e => e.preventDefault());
init().catch(error => {
  console.error(error);
  showStartFailure('เปิดเกมไม่สำเร็จ กรุณารีเฟรชหน้าเว็บแล้วลองอีกครั้ง');
});
