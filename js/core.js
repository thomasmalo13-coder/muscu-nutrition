'use strict';
/* ===================== Utilitaires ===================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.').replace(/[^\d.\-]/g, '')); return isFinite(n) ? n : 0; };
const fr = (n, d = 0) => (Math.round(n * 10 ** d) / 10 ** d).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: d });
const eur = (n, d) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: d ?? (Math.abs(n) >= 100 || Number.isInteger(n) ? 0 : 2), maximumFractionDigits: d ?? (Math.abs(n) >= 100 ? 0 : 2) });
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
const daysBetween = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 864e5);
const DAY_MS = 864e5;
const today = () => ymd(new Date());
const fmtDate = (k, o = { day: 'numeric', month: 'short' }) => parseYmd(k).toLocaleDateString('fr-FR', o).replace('.', '');
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const params = new URLSearchParams(location.search);
const DEMO = params.has('demo'); // mode aperçu : rien n'est enregistré
const ICON = {
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9Z"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M7.5 5v14l11-7Z"/></svg>',
  repeat: '<svg viewBox="0 0 24 24"><path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
};

/* ===================== État & migration ===================== */
const KEY = 'muscuNutri.v1';
const DEF = () => ({
  v: 2, profile: null, workouts: [], active: null, meals: [], favorites: [], weights: [], conso: [], goals: [], fam: {},
  fin: { budget: 0, expenses: [], savings: [], consoBase: '', consoInBudget: true },
  water: {}, sleep: [], checkin: {}, measures: [], photos: [], shop: { r: {}, done: {} }, badges: {},
  settings: { dayStart: 12, theme: 'auto', prices: { cig: 0.6, joint: 5, biere: 2.5, coke: 60 }, beerCl: 50, alcoholInMeals: true, lastProg: null, lastDay: -1, goalsSuggested: false, seen: {}, rem: { session: '', water: false, weigh: '' }, remFired: {}, badgesInit: false }
});
let S;
function load() {
  let raw; try { raw = JSON.parse(localStorage.getItem(KEY)); } catch { raw = null; }
  S = raw || DEF(); const v0 = raw ? raw.v : 2;
  const d = DEF();
  for (const k in d) if (S[k] === undefined) S[k] = d[k];
  const old = S.settings || {};
  S.settings = { ...d.settings, ...old, prices: { ...d.settings.prices, ...(old.prices || {}) } };
  S.fin = { ...d.fin, ...S.fin };
  // v1 → v2 : limites de conso → objectifs
  if (old.goals && typeof old.goals === 'object') {
    for (const [t, v] of Object.entries(old.goals)) if (v !== '' && v != null && !S.goals.some(g => g.type === 'conso' && g.t === t)) S.goals.push({ id: uid(), cat: 'nutri', type: 'conso', t, target: num(v), created: today(), deadline: '' });
    delete S.settings.goals;
  }
  if (S.profile && !S.profile.equip) { S.profile.equip = []; S.profile.level = S.profile.level || 'inter'; }
  if (!S.settings.lastProg || v0 !== 2 || (!S.settings.lastProg.startsWith('h-') && !S.workouts.length)) { S.settings.lastProg = 'h-fb'; S.settings.lastDay = -1; }
  S.v = 2;
}
let saveT;
function save(now) { if (DEMO) return; clearTimeout(saveT); const w = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { toast('Stockage plein : exporte une sauvegarde'); } }; now ? w() : (saveT = setTimeout(w, 150)); }
window.addEventListener('pagehide', () => save(true));
document.addEventListener('visibilitychange', () => { if (document.hidden) save(true); });

// La « journée » commence à l'heure choisie (12 h par défaut) : repas et conso de la nuit restent sur la même journée.
const dayKey = (ts = Date.now()) => ymd(new Date(ts - S.settings.dayStart * 36e5));
const dayLabel = k => {
  const t = dayKey(); if (k === t) return "Aujourd'hui"; if (k === addDays(t, -1)) return 'Hier';
  const s = parseYmd(k).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' }); return s[0].toUpperCase() + s.slice(1);
};
const weekStart = k => { const d = parseYmd(k); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return ymd(d); };
const monthKey = k => k.slice(0, 7);
const monthLabel = m => { const s = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }); return s[0].toUpperCase() + s.slice(1); };
const daysInMonth = m => new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate();

/* ===================== Actions & rendu ===================== */
const ACT = {}; // registre des actions data-act
const RENDER = {};
let TAB = 'home';
function setTab(t, noScroll) {
  TAB = t;
  $$('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === 's-' + t));
  render();
  if (!noScroll) window.scrollTo({ top: 0 });
}
function render() { renderHeader(); RENDER[TAB] && RENDER[TAB](); checkGoals(); }
function renderHeader() {
  $('#topDate').textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const h = new Date().getHours(), nm = S.profile && S.profile.name ? ' ' + S.profile.name : '';
  $('#topHello').textContent = (h < 5 ? 'Bonne tournée' : h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir') + nm;
}
let toastT;
let undoFn = null;
function toast(msg, ms = 2200, action) {
  const t = $('#toast'); undoFn = action ? action.fn : null;
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button" id="toastBtn">${esc(action.label)}</button>` : ''}`; t.classList.toggle('act', !!action);
  t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => { t.classList.remove('show'); undoFn = null; }, action ? Math.max(ms, 5000) : ms);
}
// Suppression avec « Annuler » : snapshot de l'état puis restauration
function undoable(msg, mutate) {
  const snap = JSON.stringify(S); mutate(); save(); render(); buzz(12);
  toast(msg, 5000, { label: 'Annuler', fn: () => { S = JSON.parse(snap); save(); render(); toast('Restauré'); } });
}
document.addEventListener('click', e => { if (e.target.id === 'toastBtn' && undoFn) { const f = undoFn; undoFn = null; $('#toast').classList.remove('show'); f(); } });
function buzz(p = 10) { try { navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive && navigator.vibrate(p); } catch {} }
function applyTheme() {
  let t = S.settings.theme; if (t === 'auto') t = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  document.documentElement.dataset.theme = t; const m = $('#themeColor'); if (m) m.content = t === 'light' ? '#f6f2ec' : '#0f1015'; if (typeof applyAmbient === 'function') applyAmbient();
}
matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => { if (S.settings.theme === 'auto') { applyTheme(); render(); } });
window.addEventListener('scroll', () => $('.top').classList.toggle('scrolled', scrollY > 4), { passive: true });

// Feuille (bottom sheet) + bouton retour Android
let sheetOpen = false, sheetOnClose = null;
function openSheet(html, onClose) {
  $('#sheetBody').innerHTML = html; sheetOnClose = onClose || null;
  const w = $('#sheetWrap'); w.querySelector('.sheet').scrollTop = 0;
  if (!sheetOpen) { history.pushState({ sheet: 1 }, ''); sheetOpen = true; }
  requestAnimationFrame(() => { w.classList.add('open'); w.setAttribute('aria-hidden', 'false'); });
  animateIn($('#sheetBody'));
}
function closeSheet(fromPop) {
  if (!sheetOpen) return; sheetOpen = false;
  const w = $('#sheetWrap'); w.classList.remove('open'); w.setAttribute('aria-hidden', 'true');
  if (document.activeElement) document.activeElement.blur();
  const cb = sheetOnClose; sheetOnClose = null; cb && cb();
  if (!fromPop && history.state && history.state.sheet) history.back();
  setTimeout(nextCelebration, 400);
}
window.addEventListener('popstate', () => { if (sheetOpen) closeSheet(true); });
$('#sheetWrap .backdrop').addEventListener('click', () => closeSheet());

// Célébrations (une à la fois)
const CELEB = [];
function celebrate(emoji, title, text) { CELEB.push({ emoji, title, text }); nextCelebration(); }
function nextCelebration() {
  const box = $('#celebrate'); if (!CELEB.length || sheetOpen || !box.classList.contains('hidden')) return;
  const c = CELEB.shift(), cols = ['var(--acc)', 'var(--c1)', 'var(--c3)', 'var(--c2)', 'var(--c4)'];
  const conf = Array.from({ length: 26 }, (_, i) => `<i style="left:${4 + Math.random() * 92}%;background:${cols[i % cols.length]};animation-delay:${Math.random() * 0.4}s;transform:rotate(${Math.random() * 180}deg)"></i>`).join('');
  box.innerHTML = `<div class="cbox"><div class="confetti">${conf}</div><div class="em">${c.emoji}</div><h2>${esc(c.title)}</h2><p>${c.text}</p><button class="btn pri block" data-act="celebOk">Continuer</button></div>`;
  box.classList.remove('hidden'); buzz([20, 40, 20]);
}
ACT.celebOk = () => { $('#celebrate').classList.add('hidden'); setTimeout(nextCelebration, 250); };

/* ===================== Graphiques SVG ===================== */
let gid = 0;
function smoothPath(pts) {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2, t = 0.18;
    let c1x = p1[0] + (p2[0] - p0[0]) * t, c1y = p1[1] + (p2[1] - p0[1]) * t, c2x = p2[0] - (p3[0] - p1[0]) * t, c2y = p2[1] - (p3[1] - p1[1]) * t;
    const lo = Math.min(p1[1], p2[1]), hi = Math.max(p1[1], p2[1]); c1y = clamp(c1y, lo, hi); c2y = clamp(c2y, lo, hi);
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
function niceRange(min, max, n = 4) {
  if (min === max) { min -= 1; max += 1; }
  const raw = (max - min) / n, mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(s => s * mag).find(s => s >= raw) || raw;
  return { lo: Math.floor(min / step) * step, hi: Math.ceil(max / step) * step, step };
}
const fmtTick = (v, step) => fr(v, step < 1 ? 1 : 0);
function lineChart(points, { color = 'var(--acc)', unit = '', h = 180, dec = 1, target = null, proj = null } = {}) {
  if (points.length < 2) return `<div class="empty">${points.length ? 'Encore une donnée et la courbe apparaît.' : 'Pas encore de données.'}</div>`;
  const W = 360, H = h, L = 36, R = 10, T = 16, B = 24, id = 'g' + (++gid);
  const xs = points.map(p => p.x).concat(proj ? [proj.x] : []), ys = points.map(p => p.y);
  let ymin = Math.min(...ys), ymax = Math.max(...ys);
  if (target != null) { ymin = Math.min(ymin, target); ymax = Math.max(ymax, target); }
  const pd = (ymax - ymin) * 0.12 || 1, nr = niceRange(ymin >= 0 ? Math.max(0, ymin - pd) : ymin - pd, ymax + pd);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const X = x => L + (x - x0) / ((x1 - x0) || 1) * (W - L - R), Y = y => T + (1 - (y - nr.lo) / (nr.hi - nr.lo)) * (H - T - B);
  const pts = points.map(p => [X(p.x), Y(p.y)]), path = smoothPath(pts);
  const area = `${path} L${pts[pts.length - 1][0].toFixed(1)},${H - B} L${pts[0][0].toFixed(1)},${H - B} Z`;
  let g = '';
  for (let v = nr.lo; v <= nr.hi + 1e-9; v += nr.step) g += `<line class="gl" x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${L - 7}" y="${Y(v) + 3.5}" text-anchor="end">${fmtTick(v, nr.step)}</text>`;
  const fx = x => new Date(x).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '');
  const lastX = proj ? X(proj.x) : pts[pts.length - 1][0];
  g += `<text class="ax" x="${pts[0][0]}" y="${H - 6}" text-anchor="start">${fx(points[0].x)}</text><text class="ax" x="${lastX}" y="${H - 6}" text-anchor="end">${fx(proj ? proj.x : points[points.length - 1].x)}</text>`;
  if (target != null) g += `<line x1="${L}" x2="${W - R}" y1="${Y(target)}" y2="${Y(target)}" style="stroke:var(--mut)" stroke-width="1.2" stroke-dasharray="4 5" opacity=".7"/><text class="ax" x="${L + 4}" y="${Y(target) - 6}">objectif ${fr(target, dec)}${unit}</text>`;
  if (proj) { const lp = pts[pts.length - 1]; g += `<path d="M${lp[0]},${lp[1]} L${X(proj.x)},${Y(proj.y)}" style="stroke:${color}" stroke-width="2" stroke-dasharray="3 5" opacity=".6"/><circle cx="${X(proj.x)}" cy="${Y(proj.y)}" r="4" style="fill:var(--s1);stroke:${color}" stroke-width="2"/>`; }
  const last = pts.length - 1;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img"><defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:${color};stop-opacity:.34"/><stop offset="1" style="stop-color:${color};stop-opacity:0"/></linearGradient></defs>${g}<path d="${area}" fill="url(#${id})" class="ar"/><path d="${path}" class="ln draw" pathLength="1000" style="stroke:${color};--len:1000"/><circle cx="${pts[last][0]}" cy="${pts[last][1]}" r="4.5" class="ar" style="fill:var(--s1);stroke:${color}" stroke-width="2.4"/><text x="${clamp(pts[last][0], L + 30, W - R)}" y="${Math.max(pts[last][1] - 11, 11)}" text-anchor="end" class="ar" style="fill:var(--txt);font-size:12px;font-weight:600">${fr(ys[last], dec)}${unit}</text></svg></div>`;
}
function barChart(days, { h = 160, target = null, unitFmt = v => fr(v) } = {}) {
  const W = 360, H = h, L = 36, R = 6, T = 10, B = 24;
  const tots = days.map(d => d.segs.reduce((s, x) => s + x.v, 0));
  const nr = niceRange(0, Math.max(...tots, target || 0, 0.0001) * 1.05, 3), Y = v => T + (1 - v / nr.hi) * (H - T - B);
  const bw = (W - L - R) / days.length, w = Math.min(26, bw * 0.56), sid = 'sh' + (++gid);
  let g = '';
  for (let v = 0; v <= nr.hi + 1e-9; v += nr.step) g += `<line class="gl" x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${L - 7}" y="${Y(v) + 3.5}" text-anchor="end">${unitFmt(v)}</text>`;
  days.forEach((d, i) => {
    const cx = L + bw * i + bw / 2; let acc = 0; const segs = d.segs.filter(s => s.v > 0);
    segs.forEach((s, j) => {
      const y1 = Y(acc + s.v), y0 = Y(acc), hh = Math.max(0, y0 - y1), r = Math.min(5, hh); acc += s.v;
      const st = `fill:${s.c};animation-delay:${i * 35}ms`;
      if (j === segs.length - 1) { const dd = `M${cx - w / 2},${y0} V${y1 + r} Q${cx - w / 2},${y1} ${cx - w / 2 + r},${y1} H${cx + w / 2 - r} Q${cx + w / 2},${y1} ${cx + w / 2},${y1 + r} V${y0} Z`; g += `<path class="bb" d="${dd}" style="${st}"/><path class="bb sheen" d="${dd}" style="fill:url(#${sid});animation-delay:${i * 35}ms"/>`; }
      else g += `<rect class="bb" x="${cx - w / 2}" y="${y1}" width="${w}" height="${hh + 0.5}" style="${st}"/>`;
    });
    if (!segs.length) g += `<rect x="${cx - w / 2}" y="${Y(0) - 3}" width="${w}" height="3" rx="1.5" style="fill:var(--s3)"/>`;
    g += `<text class="ax" x="${cx}" y="${H - 6}" text-anchor="middle" ${d.hi ? 'style="fill:var(--txt);font-weight:700"' : ''}>${d.l}</text>`;
  });
  if (target > 0) g += `<line x1="${L}" x2="${W - R}" y1="${Y(target)}" y2="${Y(target)}" style="stroke:var(--mut)" stroke-width="1.2" stroke-dasharray="4 5" opacity=".8"/>`;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img"><defs><linearGradient id="${sid}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>${g}</svg></div>`;
}
function donut(parts, size = 132, label = '', sub = '') {
  const tot = parts.reduce((s, p) => s + p.v, 0), r = size / 2 - 10, c = 2 * Math.PI * r; let off = 0;
  const segs = tot > 0 ? parts.filter(p => p.v > 0).map(p => { const len = p.v / tot * c, gap = parts.filter(q => q.v > 0).length > 1 ? 2 : 0; const s = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" style="stroke:${p.c}" stroke-width="14" stroke-dasharray="${Math.max(0, len - gap)} ${c}" stroke-dashoffset="${-off}"/>`; off += len; return s; }).join('') : '';
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle class="trk" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="14"/>${segs}</svg><div class="ctr"><b style="font-size:18px">${label}</b><span>${sub}</span></div></div>`;
}
function ring(val, max, label, sub, { size = 128, stroke = 11, color = 'var(--acc)', warnOver = true } = {}) {
  const r = size / 2 - stroke / 2 - 1, c = 2 * Math.PI * r, pct = max > 0 ? Math.min(val / max, 1) : 0, over = warnOver && max > 0 && val > max * 1.05;
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle class="trk" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"/><defs><linearGradient id="rg${++gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb, ${over ? 'var(--bad)' : color} 55%, #fff)"/><stop offset="1" style="stop-color:${over ? 'var(--bad)' : color}"/></linearGradient></defs><circle class="val" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" style="stroke:url(#rg${gid})" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-off="${c * (1 - pct)}"/></svg><div class="ctr"><b>${label}</b>${sub ? `<span>${sub}</span>` : ''}</div></div>`;
}
function animateIn(root) {
  const go = () => { $$('.ring .val', root).forEach(e => e.style.strokeDashoffset = e.dataset.off); $$('.bar i[data-w]', root).forEach(e => e.style.width = e.dataset.w); };
  if (document.documentElement.classList.contains('noanim')) return go();
  requestAnimationFrame(() => requestAnimationFrame(go));
}
const bar = (pct, color, thin) => `<div class="bar${thin ? ' thin' : ''}"><i data-w="${clamp(pct, 0, 100)}%" style="${color ? 'background:' + color : ''}"></i></div>`;
function linreg(pts) { // pts [{x(jours), y}] → pente / jour
  const n = pts.length; if (n < 2) return null;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n, my = pts.reduce((s, p) => s + p.y, 0) / n;
  let a = 0, b = 0; for (const p of pts) { a += (p.x - mx) * (p.y - my); b += (p.x - mx) ** 2; }
  return b ? a / b : null;
}
