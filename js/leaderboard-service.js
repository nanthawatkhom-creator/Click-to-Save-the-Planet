const COOKIE_NAME = 'click_save_planet_scores_v1';
const COOKIE_PATH = new URL('../', import.meta.url).pathname;
const MAX_ENTRIES = 10;
const LEGACY_KEY = 'sortshift_th_scores_v2';
let sessionScores = null;
let sessionOnly = false;

export function normalizePlayerName(value) {
  return Array.from(String(value ?? '').normalize('NFC').replace(/[\u0000-\u001f\u007f]/g, '').trim().replace(/\s+/g, ' ')).slice(0, 20).join('');
}

function numberInRange(value, max, rounded = false) {
  const number = Number(value);
  const safe = Number.isFinite(number) ? Math.min(max, Math.max(0, number)) : 0;
  return rounded ? Math.round(safe) : safe;
}

function normalizeEntry(entry, index = 0) {
  const createdAtMs = numberInRange(entry.createdAtMs, 8640000000000000, true);
  return {
    id: String(entry.id || `legacy-${createdAtMs}-${index}`).slice(0, 40),
    name: normalizePlayerName(entry.name) || 'ผู้เล่น',
    score: numberInRange(entry.score, 1000000000, true),
    co2e: Math.round(numberInRange(entry.co2e, 99999) * 10000) / 10000,
    items: numberInRange(entry.items, 99999, true),
    createdAtMs,
  };
}

function sortedScores(rows) {
  return rows.map(normalizeEntry).sort((a, b) => b.score - a.score || b.co2e - a.co2e || a.createdAtMs - b.createdAtMs).slice(0, MAX_ENTRIES);
}

function cookieValue() {
  try {
    const cookie = document.cookie.split(';').map(part => part.trim()).find(part => part.startsWith(COOKIE_NAME + '='));
    return cookie ? cookie.slice(COOKIE_NAME.length + 1) : null;
  } catch {
    return null;
  }
}

function decodeScores(value) {
  if (!value) return null;
  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (data.v !== 1 || !Array.isArray(data.r)) return null;
    const rows = data.r.filter(row => Array.isArray(row) && row.length === 6).map(row => ({
      id: row[0], name: row[1], score: row[2], co2e: row[3], items: row[4], createdAtMs: row[5],
    }));
    return sortedScores(rows);
  } catch {
    return null;
  }
}

function storeScores(rows) {
  sessionScores = rows;
  try {
    const packed = { v: 1, r: rows.map(row => [row.id, row.name, row.score, row.co2e, row.items, row.createdAtMs]) };
    const bytes = new TextEncoder().encode(JSON.stringify(packed));
    const value = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    // Leave room for the cookie name and attributes within the browser's cookie limit.
    if (value.length > 3800) throw new Error('Leaderboard cookie is too large');
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${COOKIE_NAME}=${value}; Path=${COOKIE_PATH}; Max-Age=31536000; SameSite=Lax${secure}`;
    sessionOnly = cookieValue() !== value;
  } catch {
    sessionOnly = true;
  }
  return !sessionOnly;
}

export function loadTopScores() {
  // Keep newer scores in memory if this browser refused the most recent cookie write.
  if (sessionOnly && sessionScores) return [...sessionScores];
  const cookieScores = decodeScores(cookieValue());
  if (cookieScores !== null) return cookieScores;
  if (sessionScores) return [...sessionScores];

  // Preserve scores saved by the previous local leaderboard when it is available.
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]');
    if (Array.isArray(legacy) && legacy.length) {
      const rows = sortedScores(legacy.filter(row => row && typeof row === 'object'));
      if (rows.length) storeScores(rows);
      return rows;
    }
  } catch {
    // Storage can be unavailable in private or locked-down browsers.
  }
  return [];
}

export function submitScore(entry) {
  const current = normalizeEntry({
    ...entry,
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    createdAtMs: Date.now(),
  });
  const rows = sortedScores([...loadTopScores(), current]);
  const saved = storeScores(rows);
  const index = rows.findIndex(row => row.id === current.id);
  return { saved, current, rank: index >= 0 ? index + 1 : null };
}

export function isLeaderboardTemporary() {
  return sessionOnly;
}
