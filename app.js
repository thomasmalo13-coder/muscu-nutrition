'use strict';
/* ===================== Utilitaires ===================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.').replace(/[^\d.\-]/g, '')); return isFinite(n) ? n : 0; };
const fr = (n, d = 0) => (Math.round(n * 10 ** d) / 10 ** d).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: d });
const eur = n => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: n >= 100 ? 0 : 2 });
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
const DAY_MS = 864e5;
const params = new URLSearchParams(location.search);
const DEMO = params.has('demo'); // mode aperçu : rien n'est enregistré
const ICON = {
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9Z"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5Z"/></svg>',
  repeat: '<svg viewBox="0 0 24 24"><path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/></svg>'
};

/* ===================== Données de référence ===================== */
// [nom, séries, reps cibles, repos (s), unité]
const PROGRAMS = [
  { id: 'fb3', name: 'Full body 3×/semaine', desc: 'Salle · idéal pour débuter ou reprendre · 45–60 min', days: [
    { n: 'Séance A', ex: [['Squat', 4, 8, 150], ['Développé couché', 4, 8, 150], ['Rowing barre', 3, 10, 120], ['Développé militaire haltères', 3, 10, 90], ['Curl biceps haltères', 2, 12, 60], ['Gainage planche', 3, 45, 60, 'sec']] },
    { n: 'Séance B', ex: [['Soulevé de terre', 3, 6, 180], ['Développé incliné haltères', 3, 10, 120], ['Tirage vertical', 3, 10, 90], ['Fentes haltères', 3, 10, 90], ['Extension triceps poulie', 2, 12, 60], ['Crunch', 3, 15, 45]] },
    { n: 'Séance C', ex: [['Presse à cuisses', 4, 10, 120], ['Dips', 3, 10, 90], ['Rowing haltère unilatéral', 3, 10, 90], ['Élévations latérales', 3, 15, 60], ['Leg curl', 3, 12, 60], ['Mollets debout', 3, 15, 45]] }
  ] },
  { id: 'ppl', name: 'Push · Pull · Legs', desc: 'Salle · 3 à 6 séances/semaine · intermédiaire', days: [
    { n: 'Push', ex: [['Développé couché', 4, 8, 150], ['Développé militaire barre', 3, 8, 120], ['Développé incliné haltères', 3, 10, 90], ['Élévations latérales', 4, 15, 60], ['Dips', 3, 10, 90], ['Extension triceps poulie', 3, 12, 60]] },
    { n: 'Pull', ex: [['Tractions', 4, 8, 120], ['Rowing barre', 4, 8, 120], ['Tirage horizontal poulie', 3, 12, 90], ['Face pull', 3, 15, 60], ['Curl barre', 3, 10, 60], ['Curl marteau', 3, 12, 60]] },
    { n: 'Legs', ex: [['Squat', 4, 6, 180], ['Soulevé de terre jambes tendues', 3, 10, 120], ['Presse à cuisses', 3, 12, 120], ['Leg curl', 3, 12, 60], ['Leg extension', 3, 15, 60], ['Mollets debout', 4, 15, 45]] }
  ] },
  { id: 'hb4', name: 'Haut / Bas 4×/semaine', desc: 'Salle · force + volume · intermédiaire', days: [
    { n: 'Haut 1', ex: [['Développé couché', 4, 6, 150], ['Rowing barre', 4, 8, 120], ['Développé militaire haltères', 3, 10, 90], ['Tirage vertical', 3, 10, 90], ['Curl barre', 2, 12, 60], ['Extension triceps poulie', 2, 12, 60]] },
    { n: 'Bas 1', ex: [['Squat', 4, 6, 180], ['Soulevé de terre jambes tendues', 3, 8, 120], ['Fentes haltères', 3, 10, 90], ['Mollets debout', 4, 12, 45], ['Gainage planche', 3, 45, 60, 'sec']] },
    { n: 'Haut 2', ex: [['Développé incliné haltères', 4, 10, 120], ['Tractions', 4, 8, 120], ['Élévations latérales', 4, 15, 60], ['Rowing haltère unilatéral', 3, 10, 90], ['Dips', 3, 10, 90], ['Curl marteau', 2, 12, 60]] },
    { n: 'Bas 2', ex: [['Soulevé de terre', 3, 5, 180], ['Presse à cuisses', 4, 10, 120], ['Leg curl', 3, 12, 60], ['Leg extension', 3, 15, 60], ['Crunch', 3, 15, 45]] }
  ] },
  { id: 'home', name: 'Maison · poids du corps', desc: 'Sans matériel · 30–40 min · à caler avant ou après le service', days: [
    { n: 'Circuit 1', ex: [['Pompes', 4, 12, 60], ['Squat poids du corps', 4, 20, 60], ['Rowing sous une table', 4, 10, 60], ['Fentes alternées', 3, 12, 60], ['Pompes diamant', 3, 8, 60], ['Gainage planche', 3, 45, 45, 'sec']] },
    { n: 'Circuit 2', ex: [['Pompes pieds surélevés', 4, 10, 60], ['Squat bulgare', 3, 10, 60], ['Pont fessier', 4, 15, 45], ['Dips sur chaise', 3, 12, 60], ['Pike push-up', 3, 8, 60], ['Mountain climbers', 3, 30, 45, 'sec']] },
    { n: 'Circuit 3', ex: [['Burpees', 4, 10, 60], ['Pompes larges', 4, 12, 60], ['Chaise contre le mur', 3, 45, 45, 'sec'], ['Superman', 3, 15, 45], ['Mollets sur une marche', 4, 20, 45], ['Crunch', 3, 20, 45]] }
  ] }
];
const EXTRA_EX = ['Hip thrust', 'Pull-over', 'Shrugs', 'Écarté couché haltères', 'Pec deck', 'Oiseau haltères', 'Curl incliné', 'Barre au front', 'Hack squat', 'Abducteurs machine', 'Relevés de jambes', 'Vélo / cardio', 'Corde à sauter'];
const ALL_EX = [...new Set([...PROGRAMS.flatMap(p => p.days.flatMap(d => d.ex.map(e => e[0]))), ...EXTRA_EX])].sort((a, b) => a.localeCompare(b, 'fr'));
const exMeta = name => { for (const p of PROGRAMS) for (const d of p.days) for (const e of d.ex) if (e[0] === name) return { rest: e[3], u: e[4] || 'reps', r: e[2] }; return { rest: 90, u: 'reps', r: 10 }; };

const SLOTS = [
  { id: 'main', n: 'Repas principal', t: 'au réveil, après-midi' },
  { id: 'snack', n: 'Collation', t: 'fin d’après-midi, soirée' },
  { id: 'pre', n: 'Avant le service', t: 'vers minuit' },
  { id: 'pause', n: 'Pause de nuit', t: 'vers 4 h, léger' },
  { id: 'post', n: 'Après le service', t: 'avant de dormir' }
];
const ACTIVITY = [[1.2, 'Sédentaire'], [1.375, 'Légère (1–3 séances/sem)'], [1.55, 'Modérée (3–5 séances/sem)'], [1.725, 'Élevée (6–7 séances/sem)'], [1.9, 'Très élevée (physique + sport)']];
const GOALS = { masse: 'Prise de masse', seche: 'Sèche', maintien: 'Maintien' };
const CONSO = [
  { id: 'cig', n: 'Cigarettes', i: '🚬', u: 'cig.', step: 1, tc: '#ffb020', tint: 'rgba(255,176,32,.7)' },
  { id: 'joint', n: 'Joints', i: '🌿', u: 'joint(s)', step: 1, tc: '#b6ff3b', tint: 'rgba(182,255,59,.7)' },
  { id: 'biere', n: 'Bières', i: '🍺', u: 'bière(s)', step: 1, tc: '#00e5ff', tint: 'rgba(0,229,255,.7)' },
  { id: 'coke', n: 'Cocaïne', i: '❄️', u: 'g', step: 0.1, tc: '#ff2bd6', tint: 'rgba(255,43,214,.7)' }
];
const NIGHT_TIPS = [
  ['🌙', 'Gros repas avant, léger pendant', 'Ton vrai repas complet avant le service (vers minuit). À 4 h, reste léger : yaourt, fruit, poignée d’amandes. Un gros repas en pleine nuit fatigue et digère mal.'],
  ['🥩', 'Protéines à chaque prise', '25–40 g par repas (viande, œufs, skyr, thon, whey) répartis sur ta journée : c’est ce qui nourrit le muscle.'],
  ['☕', 'Café : stop vers 4 h', 'La caféine reste 5–6 h dans le corps. Après 4 h du matin, elle abîme ton sommeil de récupération.'],
  ['😴', 'Petit repas avant de dormir', 'Après la tournée, un en-cas protéiné et léger (fromage blanc, œufs) puis dodo. Pas de gros plat gras juste avant de dormir.'],
  ['💧', 'Bois régulièrement', '1,5–2 L sur ta journée, une bouteille dans le camion. La fatigue de 4–5 h est souvent un peu de déshydratation.'],
  ['🏋️', 'Séance au réveil', 'Le mieux : t’entraîner après ton sommeil (après-midi), puis ton repas principal. Évite la séance juste avant de dormir.'],
  ['🍌', 'Coup de barre à 5 h ?', 'Une banane ou des dattes + de l’eau plutôt qu’un soda ou une barre chocolatée : énergie plus stable.'],
  ['🕶️', 'Protège ton sommeil', 'Lunettes de soleil sur le retour, chambre noire, téléphone en silencieux : 7 h de sommeil = meilleure récup et moins de fringales.']
];

/* ===================== État ===================== */
const KEY = 'muscuNutri.v1';
const DEF = () => ({
  v: 1, profile: null, workouts: [], active: null, meals: [], favorites: [], weights: [], conso: [],
  settings: { dayStart: 12, prices: { cig: 0.6, joint: 5, biere: 2.5, coke: 60 }, beerCl: 50, alcoholInMeals: true, goals: { cig: '', joint: '', biere: '', coke: '' }, lastProg: null, lastDay: -1 }
});
let S;
function load() {
  try { S = JSON.parse(localStorage.getItem(KEY)) || DEF(); } catch { S = DEF(); }
  const d = DEF();
  for (const k in d) if (S[k] === undefined) S[k] = d[k];
  S.settings = { ...d.settings, ...S.settings, prices: { ...d.settings.prices, ...(S.settings || {}).prices }, goals: { ...d.settings.goals, ...(S.settings || {}).goals } };
}
let saveT;
function save(now) { if (DEMO) return; clearTimeout(saveT); const w = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('⚠️ Stockage plein : exporte une sauvegarde'); } }; now ? w() : (saveT = setTimeout(w, 150)); }
window.addEventListener('pagehide', () => save(true));
document.addEventListener('visibilitychange', () => { if (document.hidden) save(true); });

// La « journée » commence à l'heure choisie (12 h par défaut) : repas et conso de la nuit comptent pour la même journée.
const dayKey = (ts = Date.now()) => ymd(new Date(ts - S.settings.dayStart * 36e5));
const dayLabel = k => {
  const t = dayKey(); if (k === t) return "Aujourd'hui"; if (k === addDays(t, -1)) return 'Hier';
  const s = parseYmd(k).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' }); return s[0].toUpperCase() + s.slice(1);
};
const weekStart = k => { const d = parseYmd(k); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return ymd(d); };

/* ===================== Calculs ===================== */
function targets(p = S.profile) {
  if (!p) return null;
  const w = num(p.weight) || 75, h = num(p.height) || 175, a = num(p.age) || 30;
  const bmr = 10 * w + 6.25 * h - 5 * a + (p.sex === 'F' ? -161 : 5);
  const tdee = bmr * (num(p.activity) || 1.55);
  let kcal = tdee, pk = 1.8, fk = 0.9;
  if (p.goal === 'masse') { kcal = tdee + 300; pk = 1.8; fk = 1; }
  if (p.goal === 'seche') { kcal = tdee * 0.8; pk = 2.2; fk = 0.8; }
  kcal = Math.round(kcal / 10) * 10;
  const pr = Math.round(w * pk), fa = Math.round(w * fk);
  const ca = Math.max(0, Math.round((kcal - pr * 4 - fa * 9) / 4));
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, p: pr, c: ca, f: fa };
}
const lastWeight = () => S.weights.length ? S.weights[S.weights.length - 1].kg : (S.profile ? num(S.profile.weight) : 0);
const beerKcal = () => Math.round(S.settings.beerCl * 10 * 0.43);
function dayMeals(k) { return S.meals.filter(m => m.day === k); }
function dayTotals(k) {
  const t = { kcal: 0, p: 0, c: 0, f: 0, alc: 0 };
  for (const m of dayMeals(k)) { t.kcal += m.kcal; t.p += m.p; t.c += m.c; t.f += m.f; }
  if (S.settings.alcoholInMeals) { t.alc = consoDay(k).biere * beerKcal(); t.kcal += t.alc; }
  return t;
}
function consoDay(k) { const r = { cig: 0, joint: 0, biere: 0, coke: 0 }; for (const e of S.conso) if (e.day === k) r[e.t] = Math.round((r[e.t] + e.q) * 10) / 10; return r; }
const consoCost = r => CONSO.reduce((s, c) => s + r[c.id] * S.settings.prices[c.id], 0);
const e1rm = (kg, r) => kg > 0 ? kg * (1 + Math.min(r, 15) / 30) : 0;
function sessVolume(w) { let v = 0; for (const e of w.exercises) for (const s of e.sets) if (s.done && e.u !== 'sec') v += num(s.r) * num(s.kg); return v; }
function exHistory(name) {
  const out = [];
  for (const w of S.workouts) {
    const e = w.exercises.find(x => x.n === name); if (!e) continue;
    const done = e.sets.filter(s => s.done); if (!done.length) continue;
    let best = 0, maxKg = 0, maxR = 0, vol = 0;
    for (const s of done) { const r = num(s.r), kg = num(s.kg); best = Math.max(best, e1rm(kg, r)); maxKg = Math.max(maxKg, kg); maxR = Math.max(maxR, r); vol += r * kg; }
    out.push({ t: w.start, day: w.day, best, maxKg, maxR, vol, u: e.u, sets: done, wid: w.id });
  }
  return out.sort((a, b) => a.t - b.t);
}
function lastSetsFor(name) {
  for (let i = S.workouts.length - 1; i >= 0; i--) { const e = S.workouts[i].exercises.find(x => x.n === name); if (e && e.sets.some(s => s.done)) return e.sets.filter(s => s.done); }
  return null;
}

/* ===================== UI de base ===================== */
let TAB = 'home';
function setTab(t, noScroll) {
  TAB = t;
  $$('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === 's-' + t));
  render();
  if (!noScroll) window.scrollTo({ top: 0 });
}
function render() {
  $('#topDate').textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  ({ home: rHome, muscu: rMuscu, repas: rRepas, suivi: rSuivi, conso: rConso })[TAB]();
}
let toastT;
function toast(msg, ms = 2200) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms); }
function buzz(p = 12) { try { navigator.vibrate && navigator.vibrate(p); } catch {} }

// Feuille (bottom sheet) avec gestion du bouton retour Android
let sheetOpen = false, sheetOnClose = null;
function openSheet(html, onClose) {
  $('#sheetBody').innerHTML = html; sheetOnClose = onClose || null;
  const w = $('#sheetWrap'); w.querySelector('.sheet').scrollTop = 0;
  if (!sheetOpen) { history.pushState({ sheet: 1 }, ''); sheetOpen = true; }
  requestAnimationFrame(() => { w.classList.add('open'); w.setAttribute('aria-hidden', 'false'); });
}
function closeSheet(fromPop) {
  if (!sheetOpen) return; sheetOpen = false;
  const w = $('#sheetWrap'); w.classList.remove('open'); w.setAttribute('aria-hidden', 'true');
  if (document.activeElement) document.activeElement.blur();
  const cb = sheetOnClose; sheetOnClose = null; cb && cb();
  if (!fromPop && history.state && history.state.sheet) history.back();
}
window.addEventListener('popstate', () => { if (sheetOpen) closeSheet(true); });
$('#sheetWrap .backdrop').addEventListener('click', () => closeSheet());

/* ===================== Graphiques SVG ===================== */
let gid = 0;
function smoothPath(pts) {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const t = 0.18;
    let c1x = p1[0] + (p2[0] - p0[0]) * t, c1y = p1[1] + (p2[1] - p0[1]) * t;
    let c2x = p2[0] - (p3[0] - p1[0]) * t, c2y = p2[1] - (p3[1] - p1[1]) * t;
    const lo = Math.min(p1[1], p2[1]), hi = Math.max(p1[1], p2[1]);
    c1y = Math.min(hi, Math.max(lo, c1y)); c2y = Math.min(hi, Math.max(lo, c2y));
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
function niceRange(min, max, n = 4) {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min, raw = span / n, mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(s => s * mag).find(s => s >= raw) || raw;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  return { lo, hi, step };
}
function lineChart(points, { color = '#00e5ff', unit = '', h = 190, dec = 1, target = null, fmtX } = {}) {
  if (points.length < 2) return `<div class="empty">${points.length ? 'Encore une donnée et la courbe apparaît 📈' : 'Pas encore de données'}</div>`;
  const W = 360, H = h, L = 38, R = 12, T = 14, B = 24, id = 'g' + (++gid);
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  let ymin = Math.min(...ys), ymax = Math.max(...ys);
  if (target != null) { ymin = Math.min(ymin, target); ymax = Math.max(ymax, target); }
  const pd = (ymax - ymin) * 0.12 || 1; const nr = niceRange(ymin - pd, ymax + pd);
  const x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1;
  const X = x => L + (x - x0) / ((x1 - x0) || 1) * (W - L - R), Y = y => T + (1 - (y - nr.lo) / (nr.hi - nr.lo)) * (H - T - B);
  const pts = points.map(p => [X(p.x), Y(p.y)]);
  const path = smoothPath(pts), area = `${path} L${pts[pts.length - 1][0].toFixed(1)},${H - B} L${pts[0][0].toFixed(1)},${H - B} Z`;
  let grid = '';
  for (let v = nr.lo; v <= nr.hi + 1e-9; v += nr.step) grid += `<line class="gl" x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${L - 6}" y="${Y(v) + 3}" text-anchor="end">${fr(v, nr.step < 1 ? 1 : 0)}</text>`;
  const fx = fmtX || (x => new Date(x).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', ''));
  const xl = [0, Math.floor((points.length - 1) / 2), points.length - 1].filter((v, i, a) => a.indexOf(v) === i);
  const xlab = xl.map((i, j) => `<text class="ax" x="${pts[i][0]}" y="${H - 6}" text-anchor="${j === 0 ? 'start' : j === xl.length - 1 ? 'end' : 'middle'}">${fx(points[i].x)}</text>`).join('');
  const tl = target != null ? `<line x1="${L}" x2="${W - R}" y1="${Y(target)}" y2="${Y(target)}" stroke="#b6ff3b" stroke-width="1.5" stroke-dasharray="5 5" opacity=".7"/>` : '';
  const iMax = ys.indexOf(Math.max(...ys)), last = pts.length - 1;
  const dot = (i, c) => `<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="4.5" fill="#06060d" stroke="${c}" stroke-width="2.5" class="ar"/>`;
  const lastLbl = `<text x="${Math.min(pts[last][0], W - R)}" y="${Math.max(pts[last][1] - 10, 10)}" text-anchor="end" class="ar" style="fill:${color};font-size:12px;font-weight:800">${fr(ys[last], dec)}${unit}</text>`;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img"><defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient><filter id="${id}f" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="3"/></filter></defs>${grid}${tl}<path d="${area}" fill="url(#${id})" class="ar"/><path d="${path}" class="ln" stroke="${color}" opacity=".55" filter="url(#${id}f)"/><path d="${path}" class="ln draw" stroke="${color}" pathLength="1000" style="--len:1000"/>${iMax !== last ? dot(iMax, '#b6ff3b') : ''}${dot(last, color)}${lastLbl}${xlab}</svg></div>`;
}
function barChart(days, { h = 170, target = null, unitFmt = v => fr(v) } = {}) {
  const W = 360, H = h, L = 38, R = 8, T = 12, B = 24;
  const tots = days.map(d => d.segs.reduce((s, x) => s + x.v, 0));
  const mx = Math.max(...tots, target || 0, 0.0001); const nr = niceRange(0, mx * 1.05, 3);
  const Y = v => T + (1 - v / nr.hi) * (H - T - B);
  const bw = (W - L - R) / days.length, w = Math.min(28, bw * 0.58);
  let g = '';
  for (let v = 0; v <= nr.hi + 1e-9; v += nr.step) g += `<line class="gl" x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${L - 6}" y="${Y(v) + 3}" text-anchor="end">${unitFmt(v)}</text>`;
  days.forEach((d, i) => {
    const cx = L + bw * i + bw / 2; let acc = 0;
    const segs = d.segs.filter(s => s.v > 0);
    segs.forEach((s, j) => {
      const y1 = Y(acc + s.v), y0 = Y(acc); acc += s.v;
      const top = j === segs.length - 1, hh = Math.max(0, y0 - y1);
      if (top) g += `<path class="bb" d="M${cx - w / 2},${y0} V${y1 + Math.min(6, hh)} Q${cx - w / 2},${y1} ${cx - w / 2 + Math.min(6, hh)},${y1} H${cx + w / 2 - Math.min(6, hh)} Q${cx + w / 2},${y1} ${cx + w / 2},${y1 + Math.min(6, hh)} V${y0} Z" fill="${s.c}" style="animation-delay:${i * 40}ms;filter:drop-shadow(0 0 4px ${s.c}88)"/>`;
      else g += `<rect class="bb" x="${cx - w / 2}" y="${y1}" width="${w}" height="${hh}" fill="${s.c}" style="animation-delay:${i * 40}ms;filter:drop-shadow(0 0 4px ${s.c}88)"/>`;
    });
    if (!segs.length) g += `<rect x="${cx - w / 2}" y="${Y(0) - 3}" width="${w}" height="3" rx="1.5" fill="rgba(140,150,255,.18)"/>`;
    g += `<text class="ax" x="${cx}" y="${H - 6}" text-anchor="middle" ${d.hi ? 'style="fill:#00e5ff;font-weight:800"' : ''}>${d.l}</text>`;
  });
  if (target != null && target > 0) g += `<line x1="${L}" x2="${W - R}" y1="${Y(target)}" y2="${Y(target)}" stroke="#b6ff3b" stroke-width="1.5" stroke-dasharray="5 5" opacity=".75"/>`;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img">${g}</svg></div>`;
}
function ring(val, max, label, sub, color = '#00e5ff') {
  const r = 56, c = 2 * Math.PI * r, pct = max > 0 ? Math.min(val / max, 1) : 0, over = max > 0 && val > max * 1.05;
  const col = over ? '#ff4d6d' : color, id = 'r' + (++gid);
  return `<div class="ring"><svg viewBox="0 0 132 132"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${col}"/><stop offset="1" stop-color="${over ? '#ff2bd6' : '#8b5cff'}"/></linearGradient></defs><circle class="trk" cx="66" cy="66" r="${r}" fill="none"/><circle class="val" cx="66" cy="66" r="${r}" fill="none" stroke="url(#${id})" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-off="${c * (1 - pct)}"/></svg><div class="ctr"><b>${label}</b><span>${sub}</span></div></div>`;
}
function animateIn(root) {
  const go = () => { $$('.ring .val', root).forEach(e => e.style.strokeDashoffset = e.dataset.off); $$('.bar i[data-w]', root).forEach(e => e.style.width = e.dataset.w); };
  if (document.documentElement.classList.contains('noanim')) return go();
  requestAnimationFrame(() => requestAnimationFrame(go));
}
const macroBar = (lbl, v, t, cls) => { const pc = t > 0 ? Math.min(100, v / t * 100) : 0; const over = t > 0 && v > t * 1.1; return `<div><div class="bar-l"><b>${lbl}</b><span>${fr(v)} / ${fr(t)} g</span></div><div class="bar"><i class="${cls}${over ? ' over' : ''}" data-w="${pc}%"></i></div></div>`; };

/* ===================== ACCUEIL ===================== */
function nextWorkout() {
  const pid = S.settings.lastProg || 'fb3'; const p = PROGRAMS.find(x => x.id === pid) || PROGRAMS[0];
  const di = (S.settings.lastDay + 1) % p.days.length; return { p, di, d: p.days[di] };
}
function rHome() {
  const el = $('#s-home'), k = dayKey(), T = targets(), tot = dayTotals(k), nw = nextWorkout();
  const ws = weekStart(k), wk = S.workouts.filter(w => w.day >= ws).length;
  const h = new Date().getHours();
  const hello = h < 6 ? 'Bonne tournée 🌙' : h < 12 ? 'Bien rentré ? Repos 😴' : h < 18 ? 'Bon réveil ⚡' : 'Bonne soirée 🔥';
  const tip = NIGHT_TIPS[Math.floor(Date.now() / DAY_MS) % NIGHT_TIPS.length];
  const c = consoDay(k), cTot = CONSO.filter(x => c[x.id] > 0);
  let html = '';
  if (!S.profile) html += `<div class="card neon-mg hero"><h3>Bienvenue</h3><div class="big">Règle ton profil<br>en 30 secondes</div><p class="mut small">Âge, taille, poids, objectif : l’appli calcule tes calories et tes macros du jour.</p><div style="margin-top:14px"><button class="btn pri block" data-act="profile">Configurer mon profil</button></div></div>`;
  if (S.active) {
    const done = S.active.exercises.reduce((s, e) => s + e.sets.filter(x => x.done).length, 0), all = S.active.exercises.reduce((s, e) => s + e.sets.length, 0);
    html += `<div class="card neon-mg hero"><h3>Séance en cours</h3><div class="big">${esc(S.active.name.split(' · ')[0])}</div><p class="mut small">${done} / ${all} séries faites · démarrée à ${new Date(S.active.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p><div style="margin-top:14px"><button class="btn pri block" data-act="goto" data-tab="muscu">${ICON.play} Reprendre la séance</button></div></div>`;
  } else {
    html += `<div class="card neon hero"><h3>${hello}</h3><div class="row" style="gap:10px;flex-wrap:wrap;margin:4px 0 6px"><div class="big" style="margin:0">${esc(nw.d.n)}</div><span class="badge cy">${esc(nw.p.name)}</span></div><p class="mut small">${nw.d.ex.slice(0, 3).map(e => esc(e[0])).join(' · ')}…</p><div class="actions"><button class="btn pri" data-act="start" data-p="${nw.p.id}" data-d="${nw.di}">${ICON.play} Démarrer</button><button class="btn cy" data-act="goto" data-tab="muscu">Programmes</button></div></div>`;
  }
  html += `<div class="card"><div class="h-row" style="margin-bottom:14px"><h3>Nutrition du jour</h3><button class="btn sm cy" data-act="addfood">${ICON.plus} Ajouter</button></div>`;
  if (T) html += `<div class="ring-wrap">${ring(tot.kcal, T.kcal, fr(Math.max(0, T.kcal - tot.kcal)), 'kcal restantes')}<div class="macros">${macroBar('Protéines', tot.p, T.p, 'c-p')}${macroBar('Glucides', tot.c, T.c, 'c-c')}${macroBar('Lipides', tot.f, T.f, 'c-f')}</div></div>`;
  else html += `<p class="mut small">${fr(tot.kcal)} kcal · ${fr(tot.p)} g de protéines. Configure ton profil pour avoir tes objectifs.</p>`;
  html += `</div>`;
  const lw = lastWeight(), ref = S.weights.find(w => w.date >= addDays(ymd(new Date()), -7));
  const dW = S.weights.length > 1 && ref ? lw - ref.kg : 0;
  html += `<div class="grid2">
    <button class="stat tap" data-act="goto" data-tab="suivi" style="text-align:left"><div class="v glow-cy">${lw ? fr(lw, 1) + '<small>kg</small>' : '—'}</div><div class="l">Poids${dW ? ' · ' + (dW > 0 ? '+' : '−') + fr(Math.abs(dW), 1) + ' kg/7 j' : ''}</div></button>
    <button class="stat tap" data-act="goto" data-tab="muscu" style="text-align:left"><div class="v glow-mg">${wk}<small>séance${wk > 1 ? 's' : ''}</small></div><div class="l">Cette semaine</div></button>
    <button class="stat tap" data-act="goto" data-tab="repas" style="text-align:left"><div class="v glow-li">${fr(tot.p)}<small>g</small></div><div class="l">Protéines du jour</div></button>
    <button class="stat tap" data-act="goto" data-tab="conso" style="text-align:left"><div class="v" style="color:var(--or)">${eur(consoCost(c))}</div><div class="l">${cTot.length ? cTot.map(x => fr(c[x.id], 1) + ' ' + x.i).join(' ') : 'Conso du jour'}</div></button>
  </div>`;
  html += `<div class="card"><h3>Conseil de nuit</h3><div class="tip"><div class="ti">${tip[0]}</div><div><b>${tip[1]}</b><span>${tip[2]}</span></div></div></div>`;
  el.innerHTML = html; animateIn(el);
}

/* ===================== MUSCU ===================== */
let progEx = null;
function rMuscu() {
  const el = $('#s-muscu');
  if (S.active) return rSession(el);
  const nw = nextWorkout();
  let html = `<h2>Musculation</h2>`;
  html += `<div class="card neon hero"><h3>Prochaine séance</h3><div class="big">${esc(nw.d.n)}</div><p class="mut small">${esc(nw.p.name)} · ${nw.d.ex.length} exercices</p><div class="actions"><button class="btn pri" data-act="start" data-p="${nw.p.id}" data-d="${nw.di}">${ICON.play} Démarrer</button><button class="btn cy" data-act="free">Séance libre</button></div></div>`;
  html += `<div class="card"><h3>Programmes</h3>`;
  for (const p of PROGRAMS) html += `<div class="prog"><div class="ph"><div><div class="pn">${esc(p.name)}</div><div class="pd">${esc(p.desc)}</div></div>${S.settings.lastProg === p.id ? '<span class="badge cy">en cours</span>' : ''}</div><div class="days">${p.days.map((d, i) => `<button class="day" data-act="start" data-p="${p.id}" data-d="${i}"><b>${esc(d.n)}</b><span>${d.ex.slice(0, 3).map(e => esc(e[0])).join(', ')}</span></button>`).join('')}</div></div>`;
  html += `</div>`;
  const done = [...new Set(S.workouts.flatMap(w => w.exercises.filter(e => e.sets.some(s => s.done)).map(e => e.n)))];
  if (done.length) {
    if (!progEx || !done.includes(progEx)) { const cnt = {}; S.workouts.forEach(w => w.exercises.forEach(e => cnt[e.n] = (cnt[e.n] || 0) + (num(e.sets[0] && e.sets[0].kg) > 0 ? 2 : 1))); progEx = [...done].sort((a, b) => (cnt[b] || 0) - (cnt[a] || 0))[0]; }
    const hst = exHistory(progEx), isT = hst.length && hst[hst.length - 1].u === 'sec', bw = hst.every(x => x.maxKg === 0);
    const pts = hst.map(x => ({ x: x.t, y: bw ? x.maxR : Math.round(x.best * 10) / 10 }));
    const bestE = Math.max(...hst.map(x => x.best)), bestKg = Math.max(...hst.map(x => x.maxKg)), bestR = Math.max(...hst.map(x => x.maxR)), bestV = Math.max(...hst.map(x => x.vol));
    html += `<div class="card"><div class="h-row" style="margin-bottom:12px"><h3>Progression</h3><span class="badge mg">${hst.length} séance${hst.length > 1 ? 's' : ''}</span></div>
      <select class="in" id="progSel" aria-label="Exercice">${[...done].sort((a, b) => a.localeCompare(b, 'fr')).map(n => `<option ${n === progEx ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
      <p class="dim small" style="margin:12px 2px 6px">${bw ? (isT ? 'Meilleur temps (s) par séance' : 'Meilleures reps par séance') : 'Force estimée (1RM, formule d’Epley) par séance'}</p>
      ${lineChart(pts, { color: '#ff2bd6', unit: bw ? '' : ' kg' })}
      <div class="grid3" style="margin-top:12px">${bw ? `<div class="stat"><div class="v glow-li">${fr(bestR)}</div><div class="l">${isT ? 'Record (s)' : 'Record reps'}</div></div>` : `<div class="stat"><div class="v glow-li">${fr(bestKg, 1)}<small>kg</small></div><div class="l">Charge max</div></div><div class="stat"><div class="v">${fr(bestE, 1)}<small>kg</small></div><div class="l">1RM estimé</div></div><div class="stat"><div class="v">${fr(bestV)}<small>kg</small></div><div class="l">Volume max</div></div>`}</div></div>`;
  }
  html += `<div class="card"><h3>Historique</h3>`;
  const ws = [...S.workouts].reverse().slice(0, 8);
  if (!ws.length) html += `<div class="empty">Aucune séance pour l’instant. Lance ta première ! 💪</div>`;
  else html += `<div class="list">${ws.map(w => { const n = w.exercises.reduce((s, e) => s + e.sets.filter(x => x.done).length, 0); const dur = w.end ? Math.round((w.end - w.start) / 6e4) : 0; return `<button class="item tap" style="width:100%;text-align:left" data-act="wview" data-id="${w.id}"><div class="grow"><div class="t">${esc(w.name.split(' · ')[0])} ${w.prs && w.prs.length ? `<span class="badge pr">🏆 ${w.prs.length} PR</span>` : ''}</div><div class="s">${new Date(w.start).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · ${n} séries${dur ? ' · ' + dur + ' min' : ''}</div></div><div class="k">${fr(sessVolume(w) / 1000, 1)} t</div></button>`; }).join('')}</div>`;
  html += `</div>`;
  el.innerHTML = html;
  const sel = $('#progSel', el); if (sel) sel.onchange = () => { progEx = sel.value; rMuscu(); };
}
function newSet(name, i, meta) {
  const last = lastSetsFor(name); const ls = last && (last[i] || last[last.length - 1]);
  return { r: ls ? ls.r : meta.r, kg: ls ? ls.kg : '', done: false };
}
function startWorkout(pid, di) {
  const p = PROGRAMS.find(x => x.id === pid);
  const exs = p ? p.days[di].ex.map(([n, sets, r, rest, u]) => { const m = { r, rest, u: u || 'reps' }; return { n, rest, u: m.u, sets: Array.from({ length: sets }, (_, i) => newSet(n, i, m)) }; }) : [];
  S.active = { id: uid(), start: Date.now(), name: p ? `${p.days[di].n} · ${p.name}` : 'Séance libre', prog: pid || null, di: p ? di : -1, exercises: exs };
  save(true); buzz(20);
  if (TAB !== 'muscu') setTab('muscu'); else { rMuscu(); window.scrollTo({ top: 0 }); }
  if (!p) addExerciseSheet();
}
function sessSummary() { const A = S.active, done = A.exercises.reduce((s, e) => s + e.sets.filter(x => x.done).length, 0), all = A.exercises.reduce((s, e) => s + e.sets.length, 0); return `<span id="sessClock">${clock(A.start)}</span> · ${done}/${all} séries · ${fr(sessVolume(A))} kg`; }
function rSession(el) {
  const A = S.active;
  let html = `<div class="sess-top"><div><div class="n">${esc(A.name.split(' · ')[0])}</div><div class="s">${sessSummary()}</div></div><button class="btn sm pri" data-act="finish">Terminer</button></div>`;
  html += `<div>${A.exercises.map((e, ei) => exCard(e, ei)).join('')}</div>`;
  if (!A.exercises.length) html += `<div class="empty">Ajoute ton premier exercice ⬇️</div>`;
  html += `<div class="grid2"><button class="btn cy" data-act="addex">${ICON.plus} Exercice</button><button class="btn danger" data-act="cancel">Abandonner</button></div>`;
  el.innerHTML = html;
}
const fmtSet = (s, e) => `${s.r}${e.u === 'sec' ? 's' : ''}${num(s.kg) ? '×' + fr(num(s.kg), 1) : ''}`;
function exCard(e, ei) {
  const last = lastSetsFor(e.n), unit = e.u === 'sec' ? 'sec' : 'reps';
  const lastTxt = (last ? 'Dernière fois : ' + last.map(s => fmtSet(s, e)).join(' · ') : 'Première fois') + ` · repos ${e.rest} s`;
  return `<div class="ex" data-ei="${ei}"><div class="ex-h"><div style="min-width:0"><div class="n">${esc(e.n)}</div><div class="last">${esc(lastTxt)}</div></div><button class="x-btn" data-act="delex" data-ei="${ei}" aria-label="Retirer l’exercice">${ICON.trash}</button></div>
  <div class="set-head"><span>#</span><span>${unit}</span><span>kg</span><span>ok</span></div>
  <div class="sets">${e.sets.map((s, si) => `<div class="set ${s.done ? 'done' : ''}" data-ei="${ei}" data-si="${si}"><div class="no">${si + 1}</div><div class="cell"><input inputmode="numeric" value="${esc(s.r)}" data-f="r" aria-label="${unit}"><em>${e.u === 'sec' ? 's' : '×'}</em></div><div class="cell"><input inputmode="decimal" value="${esc(String(s.kg).replace('.', ','))}" data-f="kg" placeholder="—" aria-label="kg"><em>kg</em></div><button class="ok" data-act="setok" aria-label="Série faite">${ICON.check}</button></div>`).join('')}</div>
  <div class="ex-f"><button class="btn sm ghost" data-act="addset" data-ei="${ei}">${ICON.plus} Série</button><button class="btn sm ghost" data-act="rmset" data-ei="${ei}">− Série</button></div></div>`;
}
const clock = t => { const s = Math.max(0, Math.floor((Date.now() - t) / 1000)); return `${Math.floor(s / 60)}:${pad(s % 60)}`; };
setInterval(() => { const c = $('#sessClock'); if (c && S.active) c.textContent = clock(S.active.start); }, 1000);
function bestBefore(name) { let b = 0, kg = 0; for (const h of exHistory(name)) { b = Math.max(b, h.best); kg = Math.max(kg, h.maxKg); } return { b, kg }; }
function toggleSet(ei, si) {
  const e = S.active.exercises[ei], s = e.sets[si]; s.done = !s.done; save();
  const row = $(`.set[data-ei="${ei}"][data-si="${si}"]`); if (row) row.classList.toggle('done', s.done);
  if (s.done) {
    buzz(15); startTimer(e.rest || 90);
    const kg = num(s.kg), r = num(s.r);
    if (kg > 0) { const pb = bestBefore(e.n); const others = e.sets.filter((x, i) => x.done && i !== si); const sessBest = Math.max(0, ...others.map(x => e1rm(num(x.kg), num(x.r))));
      if (pb.b > 0 && e1rm(kg, r) > Math.max(pb.b, sessBest) + 0.01) toast(`🏆 Record ! ${e.n} : ${fr(kg, 1)} kg × ${r}`); }
  }
  const top = $('.sess-top .s'); if (top) top.innerHTML = sessSummary();
}
function finishWorkout() {
  const A = S.active;
  if (!A.exercises.some(e => e.sets.some(s => s.done))) { toast('Valide au moins une série ✓'); return; }
  A.exercises = A.exercises.filter(e => e.sets.some(s => s.done)); A.exercises.forEach(e => e.sets = e.sets.filter(s => s.done));
  const prs = [];
  for (const e of A.exercises) { const pb = bestBefore(e.n); const b = Math.max(...e.sets.map(s => e1rm(num(s.kg), num(s.r)))); if (pb.b > 0 && b > pb.b + 0.01) prs.push(e.n); }
  A.end = Date.now(); A.day = dayKey(A.start); A.prs = prs;
  S.workouts.push(A); if (A.prog) { S.settings.lastProg = A.prog; S.settings.lastDay = A.di; }
  S.active = null; stopTimer(); save(true); buzz([30, 60, 30]);
  rMuscu(); window.scrollTo({ top: 0 });
  openSheet(`<h2>Séance terminée 🔥</h2><div class="grid3"><div class="stat"><div class="v glow-cy">${Math.max(1, Math.round((A.end - A.start) / 6e4))}<small>min</small></div><div class="l">Durée</div></div><div class="stat"><div class="v glow-mg">${A.exercises.reduce((s, e) => s + e.sets.length, 0)}</div><div class="l">Séries</div></div><div class="stat"><div class="v glow-li">${fr(sessVolume(A) / 1000, 2)}<small>t</small></div><div class="l">Volume</div></div></div>${prs.length ? `<div class="card" style="margin-top:12px;border-color:rgba(182,255,59,.4)"><h3>Nouveaux records</h3>${prs.map(n => `<div class="kv"><span>${esc(n)}</span><b><span class="badge pr">🏆 PR</span></b></div>`).join('')}</div>` : ''}<p class="mut small" style="margin:14px 2px">Mange dans l’heure : protéines + glucides (riz-poulet, ou skyr + banane).</p><button class="btn pri block" data-act="close">Super</button>`);
}
function addExerciseSheet() {
  const draw = q => { const list = ALL_EX.filter(n => !q || norm(n).includes(norm(q))); return list.map(n => `<button class="item tap" style="width:100%;text-align:left" data-act="pickex" data-n="${esc(n)}"><div class="grow"><div class="t">${esc(n)}</div></div>${ICON.plus}</button>`).join('') + (q && !list.some(n => norm(n) === norm(q)) ? `<button class="item tap" style="width:100%;text-align:left;border-color:rgba(0,229,255,.4)" data-act="pickex" data-n="${esc(q)}"><div class="grow"><div class="t">Créer « ${esc(q)} »</div><div class="s">Exercice perso</div></div>${ICON.plus}</button>` : ''); };
  openSheet(`<div class="stick"><h2>Ajouter un exercice</h2><input class="in" id="exQ" placeholder="Rechercher ou créer…" autocomplete="off"></div><div class="list" id="exList">${draw('')}</div>`);
  const q = $('#exQ'); q.oninput = () => $('#exList').innerHTML = draw(q.value.trim());
}
function viewWorkout(id) {
  const w = S.workouts.find(x => x.id === id); if (!w) return;
  openSheet(`<h2>${esc(w.name.split(' · ')[0])}</h2><p class="mut small" style="margin:-8px 0 14px">${new Date(w.start).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} · ${fr(sessVolume(w))} kg soulevés</p>${w.exercises.map(e => `<div class="kv"><span>${esc(e.n)} ${w.prs && w.prs.includes(e.n) ? '<span class="badge pr">PR</span>' : ''}</span><b>${e.sets.map(s => fmtSet(s, e)).join(' · ')}</b></div>`).join('')}<div class="grid2" style="margin-top:16px"><button class="btn danger" data-act="delw" data-id="${w.id}">${ICON.trash} Supprimer</button><button class="btn pri" data-act="close">Fermer</button></div>`);
}

/* Minuteur de repos */
let TM = null, tmI = null, audioCtx = null;
function beep() { try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination); g.gain.setValueAtTime(0.0001, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5); o.start(); o.stop(audioCtx.currentTime + 0.5); } catch {} }
function startTimer(sec) { TM = { end: Date.now() + sec * 1000, rang: false }; drawTimer(); clearInterval(tmI); tmI = setInterval(drawTimer, 250); }
function stopTimer() { TM = null; clearInterval(tmI); $('#timer').classList.add('hidden'); document.body.classList.remove('has-timer'); }
function drawTimer() {
  const t = $('#timer'); if (!TM) return stopTimer();
  const left = Math.ceil((TM.end - Date.now()) / 1000);
  if (left <= 0 && !TM.rang) { TM.rang = true; buzz([200, 100, 200]); beep(); }
  if (left < -20) return stopTimer();
  const v = left > 0 ? `${Math.floor(left / 60)}:${pad(left % 60)}` : 'GO !';
  if (!t.dataset.built) { t.innerHTML = `<button class="tb" data-tm="-15">−15</button><div class="tv"></div><button class="tb" data-tm="15">+15</button><button class="tb" data-tm="x" aria-label="Arrêter">${ICON.x}</button>`; t.dataset.built = 1; }
  t.querySelector('.tv').textContent = v; t.classList.toggle('end', left <= 0); t.classList.remove('hidden'); document.body.classList.add('has-timer');
}
$('#timer').addEventListener('click', e => { const b = e.target.closest('[data-tm]'); if (!b || !TM) return; const v = b.dataset.tm; if (v === 'x') return stopTimer(); TM.end = Math.max(Date.now() + 1000, TM.end + num(v) * 1000); TM.rang = false; drawTimer(); });

/* ===================== REPAS ===================== */
let repasDay = null;
const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function rRepas() {
  const el = $('#s-repas'), k = repasDay || dayKey(), T = targets(), tot = dayTotals(k), today = dayKey();
  let html = `<h2>Alimentation</h2>`;
  html += `<div class="card"><div class="daynav"><button class="icon-btn" data-act="rday" data-d="-1" aria-label="Jour précédent">${ICON.left}</button><div class="dn">${esc(dayLabel(k))}<small>journée de ${S.settings.dayStart} h à ${S.settings.dayStart} h</small></div><button class="icon-btn" data-act="rday" data-d="1" aria-label="Jour suivant" ${k >= today ? 'disabled style="opacity:.3"' : ''}>${ICON.right}</button></div>`;
  if (T) html += `<div class="ring-wrap" style="margin-top:16px">${ring(tot.kcal, T.kcal, fr(tot.kcal), 'sur ' + fr(T.kcal) + ' kcal')}<div class="macros">${macroBar('Protéines', tot.p, T.p, 'c-p')}${macroBar('Glucides', tot.c, T.c, 'c-c')}${macroBar('Lipides', tot.f, T.f, 'c-f')}</div></div>`;
  else html += `<div class="row" style="margin-top:14px"><p class="mut small grow">${fr(tot.kcal)} kcal · P ${fr(tot.p)} g · G ${fr(tot.c)} g · L ${fr(tot.f)} g</p><button class="btn sm cy" data-act="profile">Mes objectifs</button></div>`;
  if (tot.alc) html += `<p class="dim small" style="margin-top:12px">Dont ${fr(tot.alc)} kcal d’alcool (onglet Conso)</p>`;
  html += `</div>`;
  const canRepeat = dayMeals(addDays(k, -1)).length && !dayMeals(k).length;
  if (S.favorites.length || canRepeat) html += `<div class="card"><h3>Ajout rapide</h3><div class="chips">${canRepeat ? `<button class="chip" data-act="repeat">${ICON.repeat} Comme hier</button>` : ''}${S.favorites.map((f, i) => `<button class="chip" data-act="fav" data-i="${i}">⭐ ${esc(f.name)}</button>`).join('')}</div></div>`;
  for (const sl of SLOTS) {
    const items = dayMeals(k).filter(m => m.slot === sl.id), kc = items.reduce((s, m) => s + m.kcal, 0);
    html += `<div class="card"><div class="meal-h"><div style="min-width:0"><div class="mn">${sl.n}</div><div class="mt">${items.length ? `<b style="color:var(--cy)">${fr(kc)} kcal</b> · ` : ''}${sl.t}</div></div><div class="row">${items.length ? `<button class="x-btn" data-act="savefav" data-s="${sl.id}" aria-label="Enregistrer en favori" style="color:var(--or)">${ICON.star}</button>` : ''}<button class="icon-btn" data-act="addfood" data-s="${sl.id}" aria-label="Ajouter" style="color:var(--cy);border-color:rgba(0,229,255,.4)">${ICON.plus}</button></div></div>`;
    if (items.length) html += `<div class="list">${items.map(m => `<div class="item"><div class="grow"><div class="t">${esc(m.name)}</div><div class="s">${m.g ? fr(m.g) + ' g · ' : ''}P ${fr(m.p)} · G ${fr(m.c)} · L ${fr(m.f)}</div></div><div class="k">${fr(m.kcal)}<small>kcal</small></div><button class="x-btn" data-act="delmeal" data-id="${m.id}" aria-label="Supprimer">${ICON.x}</button></div>`).join('')}</div>`;
    html += `</div>`;
  }
  html += `<div class="card"><h3>Manger en horaires de nuit</h3><div class="tips">${NIGHT_TIPS.map(t => `<div class="tip"><div class="ti">${t[0]}</div><div><b>${t[1]}</b><span>${t[2]}</span></div></div>`).join('')}</div><p class="dim small" style="margin-top:14px">Valeurs nutritionnelles indicatives (tables de composition type CIQUAL), arrondies.</p></div>`;
  el.innerHTML = html; animateIn(el);
}
function recentFoods() { const seen = new Set(), out = []; for (let i = S.meals.length - 1; i >= 0 && out.length < 15; i--) { const m = S.meals[i]; if (m.fi != null && !seen.has(m.fi)) { seen.add(m.fi); out.push(m.fi); } } return out; }
let foodCtx = { slot: 'main', cat: 'Tous', q: '' };
function defaultSlot() { const h = new Date().getHours(); return h >= 22 || h < 2 ? 'pre' : h < 6 ? 'pause' : h < 11 ? 'post' : h < 17 ? 'main' : 'snack'; }
function foodSheet(slot) {
  foodCtx = { slot: slot || defaultSlot(), cat: recentFoods().length ? 'Récents' : 'Tous', q: '' };
  const cats = ['Récents', 'Tous', ...new Set(FOODS.map(f => f[5]))];
  openSheet(`<div class="stick"><h2>Ajouter un aliment</h2><div class="chips" id="slotChips">${SLOTS.map(s => `<button class="chip ${s.id === foodCtx.slot ? 'on' : ''}" data-act="fslot" data-s="${s.id}">${s.n}</button>`).join('')}</div><div style="position:relative;margin-top:8px"><input class="in" id="foodQ" type="search" placeholder="Rechercher : poulet, riz, skyr…" autocomplete="off" style="padding-left:44px"><span style="position:absolute;left:12px;top:12px;color:var(--dim);pointer-events:none">${ICON.search}</span></div><div class="chips" id="catChips" style="margin-top:10px">${cats.map(c => `<button class="chip ${c === foodCtx.cat ? 'on' : ''}" data-act="fcat" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div></div><div class="food-res" id="foodRes"></div><button class="btn ghost block" data-act="freefood" style="margin-top:12px">${ICON.edit} Saisie libre (plat, resto…)</button>`);
  const on = $('#slotChips .chip.on'); if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' }); drawFoods(); $('#foodQ').oninput = e => { foodCtx.q = e.target.value; drawFoods(); };
}
function drawFoods() {
  const q = norm(foodCtx.q.trim()); let idx;
  if (q) idx = FOODS.map((f, i) => i).filter(i => q.split(/\s+/).every(w => norm(FOODS[i][0] + ' ' + FOODS[i][5]).includes(w)));
  else if (foodCtx.cat === 'Récents') idx = recentFoods();
  else idx = FOODS.map((f, i) => i).filter(i => foodCtx.cat === 'Tous' || FOODS[i][5] === foodCtx.cat);
  $('#foodRes').innerHTML = idx.length ? idx.slice(0, 80).map(i => { const f = FOODS[i]; return `<button class="item tap" style="width:100%;text-align:left" data-act="pickfood" data-i="${i}"><div class="grow"><div class="t">${esc(f[0])}</div><div class="s">${esc(f[7])} · ${f[6]} g · P ${fr(f[2], 1)} g/100 g</div></div><div class="k" style="color:var(--cy);text-align:right;line-height:1.1">${f[1]}<div class="dim" style="font-size:11px;font-weight:600">kcal/100 g</div></div></button>`; }).join('') : `<div class="empty">Rien trouvé. Utilise la saisie libre ⬇️</div>`;
}
function foodDetail(i) {
  const f = FOODS[i]; let g = f[6];
  const calc = g => ({ kcal: f[1] * g / 100, p: f[2] * g / 100, c: f[3] * g / 100, f: f[4] * g / 100 });
  const pv = () => { const m = calc(g); $('#pv').innerHTML = `<div class="stat"><div class="v glow-cy">${fr(m.kcal)}</div><div class="l">kcal</div></div><div class="stat"><div class="v" style="color:var(--mg)">${fr(m.p, 1)}</div><div class="l">Prot. g</div></div><div class="stat"><div class="v">${fr(m.c, 1)}</div><div class="l">Gluc. g</div></div><div class="stat"><div class="v" style="color:var(--or)">${fr(m.f, 1)}</div><div class="l">Lip. g</div></div>`; };
  const sl = SLOTS.find(s => s.id === foodCtx.slot);
  openSheet(`<h2>${esc(f[0])}</h2><p class="mut small" style="margin:-8px 0 16px">${esc(sl.n)} · pour 100 g : ${f[1]} kcal · P ${fr(f[2], 1)} · G ${fr(f[3], 1)} · L ${fr(f[4], 1)}</p>
    <div class="row"><button class="icon-btn" data-g="-10" aria-label="moins 10 g" style="width:56px;height:56px;font-size:24px">−</button><div class="grow" style="position:relative"><input class="in" id="gIn" inputmode="decimal" value="${g}" style="text-align:center;font-size:24px;font-weight:800;min-height:56px"><span style="position:absolute;right:16px;top:17px;color:var(--dim)">g</span></div><button class="icon-btn" data-g="10" aria-label="plus 10 g" style="width:56px;height:56px;font-size:24px">+</button></div>
    <div class="chips" style="margin-top:12px"><button class="chip" data-gs="${f[6]}">${esc(f[7])}</button><button class="chip" data-gs="${f[6] * 2}">× 2</button><button class="chip" data-gs="${Math.round(f[6] / 2)}">½ portion</button><button class="chip" data-gs="100">100 g</button></div>
    <div class="pv" id="pv"></div><div class="grid2"><button class="btn" data-act="backfood">Retour</button><button class="btn pri" id="addF">${ICON.plus} Ajouter</button></div>`);
  const inp = $('#gIn'); pv();
  inp.oninput = () => { g = num(inp.value); pv(); };
  $$('[data-g]').forEach(b => b.onclick = () => { g = Math.max(0, num(inp.value) + num(b.dataset.g)); inp.value = g; pv(); buzz(5); });
  $$('[data-gs]').forEach(b => b.onclick = () => { g = num(b.dataset.gs); inp.value = g; pv(); buzz(5); });
  $('#addF').onclick = () => { if (g <= 0) return; const m = calc(g); addMeal({ name: f[0], g, ...m, fi: i, slot: foodCtx.slot }); closeSheet(); toast(`✓ ${f[0]} ajouté`); };
}
function addMeal(m) {
  const r = v => Math.round(v * 10) / 10;
  S.meals.push({ id: uid(), day: repasDay || dayKey(), slot: m.slot, name: m.name, g: m.g || 0, kcal: Math.round(m.kcal), p: r(m.p), c: r(m.c), f: r(m.f), fi: m.fi ?? null });
  save(); render();
}
function freeFood() {
  openSheet(`<h2>Saisie libre</h2><div class="form"><label class="f"><span>Nom</span><input class="in" id="ffN" placeholder="ex. Menu burger resto"></label><div class="grid2"><label class="f"><span>Calories (kcal)</span><input class="in" id="ffK" inputmode="numeric"></label><label class="f"><span>Protéines (g)</span><input class="in" id="ffP" inputmode="decimal"></label><label class="f"><span>Glucides (g)</span><input class="in" id="ffC" inputmode="decimal"></label><label class="f"><span>Lipides (g)</span><input class="in" id="ffF" inputmode="decimal"></label></div><div class="grid2"><button class="btn" data-act="backfood">Retour</button><button class="btn pri" id="ffOk">Ajouter</button></div></div>`);
  $('#ffOk').onclick = () => { const n = $('#ffN').value.trim() || 'Repas', k = num($('#ffK').value); if (!k) return toast('Indique au moins les calories'); addMeal({ name: n, kcal: k, p: num($('#ffP').value), c: num($('#ffC').value), f: num($('#ffF').value), slot: foodCtx.slot }); closeSheet(); toast('✓ Ajouté'); };
}

/* ===================== SUIVI ===================== */
let wRange = 30, sumWeek = 0;
function rSuivi() {
  const el = $('#s-suivi'), today = ymd(new Date()), lw = lastWeight();
  let html = `<h2>Suivi</h2>`;
  const from = wRange ? addDays(today, -wRange) : '0000';
  const pts = S.weights.filter(w => w.date >= from).map(w => ({ x: parseYmd(w.date).getTime(), y: w.kg }));
  const d = pts.length > 1 ? pts[pts.length - 1].y - pts[0].y : 0;
  html += `<div class="card neon"><div class="h-row"><h3>Poids</h3><span class="badge ${d > 0 ? 'mg' : 'cy'}">${pts.length > 1 ? (d > 0 ? '▲ +' : d < 0 ? '▼ −' : '') + fr(Math.abs(d), 1) + ' kg' : '—'}</span></div>
    <div class="row" style="margin:12px 0"><div class="grow" style="position:relative"><input class="in" id="wIn" inputmode="decimal" placeholder="${lw ? fr(lw, 1) : 'ex. 78,5'}" aria-label="Poids du jour" style="font-size:20px;font-weight:800;min-height:52px"><span style="position:absolute;right:14px;top:15px;color:var(--dim)">kg</span></div><button class="btn pri" data-act="addw" style="min-height:52px">Enregistrer</button></div>
    <div class="seg" style="margin-bottom:12px">${[[30, '30 jours'], [90, '90 jours'], [0, 'Tout']].map(([v, l]) => `<button data-act="wr" data-v="${v}" class="${wRange === v ? 'on' : ''}">${l}</button>`).join('')}</div>
    ${lineChart(pts, { color: '#00e5ff', unit: ' kg' })}</div>`;
  const k = dayKey(), ws0 = addDays(weekStart(k), -7 * sumWeek), we = addDays(ws0, 6), T = targets();
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws0, i));
  const wos = S.workouts.filter(w => w.day >= ws0 && w.day <= we);
  const logged = days.filter(x => dayMeals(x).length);
  const avg = f => logged.length ? logged.reduce((s, x) => s + dayTotals(x)[f], 0) / logged.length : 0;
  const wIn = S.weights.filter(w => w.date >= ws0 && w.date <= we), wPrev = S.weights.filter(w => w.date < ws0);
  const wDelta = wIn.length && (wPrev.length || wIn.length > 1) ? wIn[wIn.length - 1].kg - (wPrev.length ? wPrev[wPrev.length - 1].kg : wIn[0].kg) : null;
  const cw = { cig: 0, joint: 0, biere: 0, coke: 0 }; days.forEach(x => { const c = consoDay(x); for (const t in cw) cw[t] += c[t]; });
  const prs = wos.reduce((s, w) => s + (w.prs ? w.prs.length : 0), 0);
  const lbl = sumWeek === 0 ? 'Cette semaine' : sumWeek === 1 ? 'Semaine dernière' : `Il y a ${sumWeek} semaines`;
  html += `<div class="card"><div class="daynav" style="margin-bottom:14px"><button class="icon-btn" data-act="sw" data-d="1" aria-label="Semaine précédente">${ICON.left}</button><div class="dn">${lbl}<small>du ${parseYmd(ws0).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au ${parseYmd(we).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</small></div><button class="icon-btn" data-act="sw" data-d="-1" aria-label="Semaine suivante" ${sumWeek === 0 ? 'disabled style="opacity:.3"' : ''}>${ICON.right}</button></div>
  <div class="grid3"><div class="stat"><div class="v glow-mg">${wos.length}</div><div class="l">Séances</div></div><div class="stat"><div class="v">${fr(wos.reduce((s, w) => s + sessVolume(w), 0) / 1000, 1)}<small>t</small></div><div class="l">Volume</div></div><div class="stat"><div class="v glow-li">${prs}</div><div class="l">Records</div></div>
  <div class="stat"><div class="v glow-cy">${logged.length ? fr(avg('kcal')) : '—'}</div><div class="l">kcal / jour</div></div><div class="stat"><div class="v" style="color:var(--mg)">${logged.length ? fr(avg('p')) : '—'}<small>${logged.length ? 'g' : ''}</small></div><div class="l">Protéines / j</div></div><div class="stat"><div class="v">${wDelta == null ? '—' : (wDelta > 0 ? '+' : wDelta < 0 ? '−' : '') + fr(Math.abs(wDelta), 1)}<small>${wDelta == null ? '' : 'kg'}</small></div><div class="l">Poids</div></div></div>
  <p class="dim small" style="margin:16px 2px 6px">Calories par jour${T ? ' · pointillés = objectif ' + fr(T.kcal) + ' kcal' : ''}</p>
  ${barChart(days.map(x => { const t = dayTotals(x); return { l: parseYmd(x).toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').slice(0, 3), hi: x === k, segs: [{ v: t.kcal - t.alc, c: '#00e5ff' }, { v: t.alc, c: '#ff2bd6' }] }; }), { target: T ? T.kcal : null, unitFmt: v => v >= 1000 ? fr(v / 1000, 1) + 'k' : fr(v) })}
  ${days.some(x => dayTotals(x).alc) ? `<div class="legend"><span><i style="background:#00e5ff"></i>Repas</span><span><i style="background:#ff2bd6"></i>Alcool</span></div>` : ''}
  ${T ? `<div class="sep"></div><p class="small" style="line-height:1.7">${weekVerdict(logged.length, avg('kcal'), avg('p'), T, wos.length)}</p>` : ''}
  ${Object.values(cw).some(v => v > 0) ? `<div class="sep"></div><div class="kv"><span>Conso de la semaine</span><b>${CONSO.filter(c => cw[c.id] > 0).map(c => `${fr(cw[c.id], 1)} ${c.i}`).join('  ')}</b></div><div class="kv"><span>Dépensé</span><b style="color:var(--or)">${eur(consoCost(cw))}</b></div>` : ''}</div>`;
  el.innerHTML = html;
}
function weekVerdict(n, kcal, p, T, wo) {
  if (!n) return '<span class="mut">Note tes repas pour avoir un bilan nutrition.</span>';
  const out = [], dk = kcal - T.kcal;
  out.push(Math.abs(dk) <= T.kcal * 0.07 ? '✅ Calories dans la cible.' : dk > 0 ? `⚠️ ${fr(dk)} kcal/jour au-dessus de la cible.` : `⚠️ ${fr(-dk)} kcal/jour sous la cible.`);
  out.push(p >= T.p * 0.9 ? '✅ Protéines au top.' : `💪 Il manque ~${fr(T.p - p)} g de protéines/jour.`);
  out.push(wo >= 3 ? '🔥 Régularité au top.' : wo ? `🏋️ ${wo} séance${wo > 1 ? 's' : ''} : vise 3.` : '🏋️ Aucune séance cette semaine.');
  return out.join('<br>');
}

/* ===================== CONSO ===================== */
let consoDayK = null;
const zero = () => ({ cig: 0, joint: 0, biere: 0, coke: 0 });
function sumDays(from, n) { const r = zero(); for (let i = 0; i < n; i++) { const d = consoDay(addDays(from, -i)); for (const t in r) r[t] = Math.round((r[t] + d[t]) * 10) / 10; } return r; }
function rConso() {
  const el = $('#s-conso'), today = dayKey(), k = consoDayK || today, c = consoDay(k), P = S.settings.prices, G = S.settings.goals;
  let html = `<h2>Conso</h2>`;
  html += `<div class="card"><div class="daynav"><button class="icon-btn" data-act="cday" data-d="-1" aria-label="Jour précédent">${ICON.left}</button><div class="dn">${esc(dayLabel(k))}<small>${eur(consoCost(c))} dépensés ce jour</small></div><button class="icon-btn" data-act="cday" data-d="1" aria-label="Jour suivant" ${k >= today ? 'disabled style="opacity:.3"' : ''}>${ICON.right}</button></div></div>`;
  html += `<div class="cgrid">${CONSO.map(x => `<div class="cc" style="--tc:${x.tc};--tint:${x.tint}"><div class="ct"><i>${x.i}</i>${x.n}</div><div class="cn" id="cn-${x.id}">${fr(c[x.id], 1)}</div><div class="cu">${x.u} · ${eur(c[x.id] * P[x.id])}</div><div class="cb"><button data-act="cminus" data-t="${x.id}" aria-label="Retirer">−</button><button class="plus" data-act="cplus" data-t="${x.id}" aria-label="Ajouter">+${x.step < 1 ? '<span class="st">' + fr(x.step, 1) + ' g</span>' : ''}</button></div></div>`).join('')}</div>`;
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const wk = sumDays(today, 7), prev = sumDays(addDays(today, -7), 7), month = sumDays(today, 30);
  html += `<div class="card"><div class="h-row" style="margin-bottom:8px"><h3>7 derniers jours</h3><b style="color:var(--or);font-size:18px">${eur(consoCost(wk))}</b></div>
    ${barChart(days.map(x => { const r = consoDay(x); return { l: parseYmd(x).toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').slice(0, 3), hi: x === k, segs: CONSO.map(cc => ({ v: r[cc.id] * P[cc.id], c: cc.tc })) }; }), { unitFmt: v => fr(v) + ' €' })}
    <div class="legend">${CONSO.map(x => `<span><i style="background:${x.tc}"></i>${x.n}</span>`).join('')}</div>
    <div class="grid2" style="margin-top:14px"><div class="stat"><div class="v" style="color:var(--or)">${eur(consoCost(month))}</div><div class="l">Sur 30 jours</div></div><div class="stat"><div class="v">${eur(consoCost(wk) * 52)}</div><div class="l">À ce rythme sur 1 an</div></div></div></div>`;
  html += `<div class="card"><div class="h-row" style="margin-bottom:14px"><h3>Objectifs / 7 jours</h3><button class="btn sm ghost" data-act="cgoals">${ICON.edit} Régler</button></div>`;
  html += CONSO.map(x => {
    const g = num(G[x.id]), v = wk[x.id], pv = prev[x.id];
    const tr = v < pv ? `<span style="color:var(--li)">▼ ${fr(pv - v, 1)}</span>` : v > pv ? `<span style="color:var(--rd)">▲ ${fr(v - pv, 1)}</span>` : '<span class="dim">=</span>';
    const since = daysWithout(x.id);
    return `<div class="goal-row"><div class="bar-l"><b>${x.i} ${x.n}</b><span>${fr(v, 1)}${g ? ' / ' + fr(g, 1) : ''} ${x.u} ${tr}</span></div>${g ? `<div class="bar"><i class="${v > g ? 'over' : ''}" data-w="${Math.min(100, v / g * 100)}%" style="${v > g ? '' : `background:${x.tc};box-shadow:0 0 10px ${x.tc}`}"></i></div>` : ''}${since >= 2 ? `<div class="small" style="margin-top:4px;color:var(--li)">${since >= 30 ? '30 jours et plus sans 💪' : since + ' jours sans 💪'}</div>` : ''}</div>`;
  }).join('');
  html += `<p class="dim small" style="margin-top:14px">Flèches : comparaison avec les 7 jours d’avant.</p></div>`;
  html += `<div class="card"><h3>Impact sport & récup</h3><div class="tips">
    <div class="tip"><div class="ti">🍺</div><div><b>${fr(wk.biere * beerKcal())} kcal d’alcool sur 7 jours</b><span>Une bière de ${S.settings.beerCl} cl ≈ ${beerKcal()} kcal. L’alcool freine la construction musculaire et casse le sommeil profond.${S.settings.alcoholInMeals ? ' Ces calories sont comptées dans Repas.' : ''}</span></div></div>
    <div class="tip"><div class="ti">🚬</div><div><b>Tabac</b><span>Moins d’oxygène dans le sang : cardio et endurance en baisse, récup plus lente.</span></div></div>
    <div class="tip"><div class="ti">🌿</div><div><b>Cannabis</b><span>Fringales (souvent sucrées) et sommeil moins réparateur : à anticiper dans tes repas.</span></div></div>
    <div class="tip"><div class="ti">❄️</div><div><b>Cocaïne</b><span>Cœur et tension en surrégime : pas de séance dans les heures qui suivent. Avec de l’alcool, le cœur est encore plus chargé.</span></div></div>
    <div class="tip"><div class="ti">🚐</div><div><b>Au volant</b><span>Avant la tournée : rien. Les tests salivaires restent positifs longtemps.</span></div></div></div></div>`;
  html += `<p class="dim small" style="text-align:center;padding:4px 0">🔒 Ces données restent uniquement sur ce téléphone.</p>`;
  el.innerHTML = html; animateIn(el);
}
function daysWithout(t) { const today = dayKey(); let last = null; for (const e of S.conso) if (e.t === t && e.q > 0 && (!last || e.day > last)) last = e.day; if (!last) return 0; return Math.round((parseYmd(today) - parseYmd(last)) / DAY_MS); }
function consoAdd(t, sign) {
  const k = consoDayK || dayKey(), x = CONSO.find(c => c.id === t), cur = consoDay(k)[t];
  if (sign < 0 && cur <= 0) return;
  const tot = Math.max(0, Math.round((cur + sign * x.step) * 10) / 10);
  S.conso = S.conso.filter(e => !(e.day === k && e.t === t)); if (tot > 0) S.conso.push({ id: uid(), ts: Date.now(), day: k, t, q: tot });
  save(); buzz(10); rConso(); const n = $('#cn-' + t); if (n) { n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump'); }
}
function goalsSheet() {
  const G = S.settings.goals;
  openSheet(`<h2>Objectifs sur 7 jours</h2><p class="mut small" style="margin:-8px 0 14px">Le maximum que tu te fixes. Laisse vide pour aucun objectif.</p><div class="form">${CONSO.map(x => `<label class="f"><span>${x.i} ${x.n} (${x.u})</span><input class="in" inputmode="decimal" data-goal="${x.id}" value="${esc(String(G[x.id]).replace('.', ','))}" placeholder="aucun"></label>`).join('')}<button class="btn pri block" id="gOk">Enregistrer</button></div>`);
  $('#gOk').onclick = () => { $$('[data-goal]').forEach(i => S.settings.goals[i.dataset.goal] = i.value.trim() ? num(i.value) : ''); save(); closeSheet(); render(); toast('✓ Objectifs enregistrés'); };
}

/* ===================== RÉGLAGES ===================== */
function settingsSheet(focusProfile) {
  const p = S.profile || { sex: 'H', age: '', height: '', weight: lastWeight() || '', activity: 1.55, goal: 'maintien' }, st = S.settings;
  const priceLbl = { cig: 'par cigarette', joint: 'par joint', biere: 'par bière', coke: 'le gramme' };
  openSheet(`<h2>${focusProfile ? 'Mon profil' : 'Réglages'}</h2>
  <div class="card" style="padding:14px"><h3>Profil</h3><div class="form">
    <div class="seg" id="sexSeg"><button data-v="H" class="${p.sex !== 'F' ? 'on' : ''}">Homme</button><button data-v="F" class="${p.sex === 'F' ? 'on' : ''}">Femme</button></div>
    <div class="grid3"><label class="f"><span>Âge</span><input class="in" id="pAge" inputmode="numeric" value="${esc(p.age)}" placeholder="30"></label><label class="f"><span>Taille (cm)</span><input class="in" id="pH" inputmode="numeric" value="${esc(p.height)}" placeholder="178"></label><label class="f"><span>Poids (kg)</span><input class="in" id="pW" inputmode="decimal" value="${esc(String(p.weight).replace('.', ','))}" placeholder="75"></label></div>
    <label class="f"><span>Activité sportive</span><select class="in" id="pAct">${ACTIVITY.map(([v, l]) => `<option value="${v}" ${num(p.activity) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="f"><span>Objectif</span></label>
    <div class="seg" id="goalSeg" style="margin-top:-6px">${Object.entries({ masse: 'Masse', seche: 'Sèche', maintien: 'Maintien' }).map(([k, l]) => `<button data-v="${k}" class="${p.goal === k ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div id="tgtBox"></div>
    <button class="btn pri block" id="pOk">Enregistrer le profil</button></div></div>
  ${focusProfile ? '' : `<div class="card" style="padding:14px;margin-top:12px"><h3>Journée</h3><label class="f"><span>Ma journée commence à… (les repas et la conso de la nuit restent sur la même journée)</span><select class="in" id="dStart">${[0, 6, 8, 10, 12, 14, 16].map(h => `<option value="${h}" ${st.dayStart === h ? 'selected' : ''}>${h === 0 ? 'Minuit' : h + ' h'}${h === 12 ? ' (conseillé)' : ''}</option>`).join('')}</select></label></div>
  <div class="card" style="padding:14px;margin-top:12px"><h3>Conso</h3><div class="form"><div class="grid2">${CONSO.map(x => `<label class="f"><span>${x.i} Prix ${priceLbl[x.id]} (€)</span><input class="in" inputmode="decimal" data-price="${x.id}" value="${String(st.prices[x.id]).replace('.', ',')}"></label>`).join('')}</div>
    <label class="f"><span>Taille d’une bière</span><select class="in" id="beerCl">${[25, 33, 50].map(v => `<option value="${v}" ${st.beerCl === v ? 'selected' : ''}>${v} cl</option>`).join('')}</select></label>
    <label class="row" style="min-height:48px;justify-content:space-between;gap:12px"><span class="small">Compter l’alcool dans les calories du jour</span><input type="checkbox" id="alcM" ${st.alcoholInMeals ? 'checked' : ''} style="width:26px;height:26px;accent-color:#00e5ff;flex:none"></label>
    <button class="btn cy block" id="cOk">Enregistrer</button></div></div>
  <div class="card" style="padding:14px;margin-top:12px"><h3>Repas favoris</h3><div class="list">${S.favorites.length ? S.favorites.map((f, i) => `<div class="item"><div class="grow"><div class="t">⭐ ${esc(f.name)}</div><div class="s">${f.items.length} aliment(s) · ${fr(f.items.reduce((s, m) => s + m.kcal, 0))} kcal</div></div><button class="x-btn" data-act="delfav" data-i="${i}" aria-label="Supprimer">${ICON.x}</button></div>`).join('') : '<p class="dim small">Aucun. Touche ⭐ sur un repas pour l’enregistrer.</p>'}</div></div>
  <div class="card" style="padding:14px;margin-top:12px"><h3>Sauvegarde</h3><p class="mut small" style="margin-bottom:12px">Tout est stocké sur ce téléphone uniquement. Exporte un fichier de temps en temps (changement de téléphone, nettoyage…).</p><div class="grid2"><button class="btn cy" data-act="export">Exporter</button><button class="btn" data-act="import">Importer</button></div><input type="file" id="impF" accept="application/json,.json" class="hidden"><div class="sep"></div><button class="btn danger block" data-act="reset">Tout effacer</button></div>
  <div style="text-align:center;margin-top:12px"><span class="dim small">Muscu·Nutri v1 · fonctionne hors connexion</span><br><a href="#" class="foot-link" data-act="help">Aide</a></div>`}`);
  let sex = p.sex === 'F' ? 'F' : 'H', goal = p.goal || 'maintien';
  const read = () => ({ sex, goal, age: num($('#pAge').value) || '', height: num($('#pH').value) || '', weight: num($('#pW').value) || '', activity: num($('#pAct').value) });
  const showT = () => { const pp = read(); const t = pp.age && pp.height && pp.weight ? targets(pp) : null; $('#tgtBox').innerHTML = t ? `<div class="stat"><div class="kv"><span>Métabolisme de base</span><b>${fr(t.bmr)} kcal</b></div><div class="kv"><span>Dépense estimée</span><b>${fr(t.tdee)} kcal</b></div><div class="kv"><span>Cible ${GOALS[goal].toLowerCase()}</span><b class="glow-cy">${fr(t.kcal)} kcal</b></div><div class="kv"><span>Prot. · Gluc. · Lip.</span><b>${t.p} · ${t.c} · ${t.f} g</b></div></div><p class="dim small" style="margin-top:8px">Formule Mifflin-St Jeor : estimation à ajuster selon l’évolution du poids sur 2–3 semaines.</p>` : '<p class="dim small">Renseigne âge, taille et poids pour voir tes objectifs.</p>'; };
  $$('#sexSeg button').forEach(b => b.onclick = () => { sex = b.dataset.v; $$('#sexSeg button').forEach(x => x.classList.toggle('on', x === b)); showT(); });
  $$('#goalSeg button').forEach(b => b.onclick = () => { goal = b.dataset.v; $$('#goalSeg button').forEach(x => x.classList.toggle('on', x === b)); showT(); });
  ['pAge', 'pH', 'pW', 'pAct'].forEach(i => $('#' + i).addEventListener('input', showT)); showT();
  $('#pOk').onclick = () => { const pp = read(); if (!pp.age || !pp.height || !pp.weight) return toast('Remplis âge, taille et poids'); S.profile = pp; if (!S.weights.length) S.weights.push({ date: ymd(new Date()), kg: pp.weight }); save(true); closeSheet(); render(); toast('✓ Profil enregistré'); };
  if (!focusProfile) {
    $('#dStart').onchange = e => { S.settings.dayStart = num(e.target.value); repasDay = consoDayK = null; save(); render(); toast('✓ Enregistré'); };
    $('#cOk').onclick = () => { $$('[data-price]').forEach(i => S.settings.prices[i.dataset.price] = num(i.value)); S.settings.beerCl = num($('#beerCl').value); S.settings.alcoholInMeals = $('#alcM').checked; save(); render(); toast('✓ Réglages conso enregistrés'); };
    $('#impF').onchange = e => importFile(e.target.files[0]);
  }
}
function exportData() {
  const blob = new Blob([JSON.stringify({ app: 'muscu-nutri', exported: new Date().toISOString(), data: S })], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `muscu-nutri-${ymd(new Date())}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); toast('✓ Sauvegarde exportée');
}
function importFile(f) {
  if (!f) return; const r = new FileReader();
  r.onload = () => { try { const j = JSON.parse(r.result), d = j.data || j; if (!d || !Array.isArray(d.workouts) || !Array.isArray(d.meals)) throw 0; if (!confirm('Remplacer toutes les données actuelles par cette sauvegarde ?')) return; localStorage.setItem(KEY, JSON.stringify(d)); load(); closeSheet(); render(); toast('✓ Sauvegarde importée'); } catch { toast('⚠️ Fichier invalide'); } };
  r.readAsText(f);
}
const HELP_HTML = `<h2>Aide</h2><p class="mut small" style="margin-bottom:14px">Sites d’info officiels, gratuits et anonymes :</p><div class="list">${[['Drogues Info Service', 'drogues-info-service.fr'], ['Tabac Info Service', 'tabac-info-service.fr'], ['Alcool Info Service', 'alcool-info-service.fr']].map(([n, u]) => `<a class="item tap" href="https://www.${u}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none"><div class="grow"><div class="t">${n}</div><div class="s">${u}</div></div>${ICON.right}</a>`).join('')}</div><button class="btn block" data-act="close" style="margin-top:14px">Fermer</button>`;

/* ===================== Événements ===================== */
const confirmReplace = () => !S.active || confirm('Une séance est déjà en cours. La remplacer ?');
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, d = b.dataset;
  switch (a) {
    case 'goto': setTab(d.tab); break;
    case 'profile': settingsSheet(true); break;
    case 'start': if (confirmReplace()) startWorkout(d.p, num(d.d)); break;
    case 'free': if (confirmReplace()) startWorkout(null, 0); break;
    case 'setok': { const row = b.closest('.set'); toggleSet(num(row.dataset.ei), num(row.dataset.si)); break; }
    case 'addset': { const ex = S.active.exercises[num(d.ei)], ls = ex.sets[ex.sets.length - 1]; ex.sets.push({ r: ls ? ls.r : 10, kg: ls ? ls.kg : '', done: false }); save(); rMuscu(); break; }
    case 'rmset': { const ex = S.active.exercises[num(d.ei)]; if (ex.sets.length > 1) { ex.sets.pop(); save(); rMuscu(); } break; }
    case 'delex': if (confirm('Retirer cet exercice de la séance ?')) { S.active.exercises.splice(num(d.ei), 1); save(); rMuscu(); } break;
    case 'addex': addExerciseSheet(); break;
    case 'pickex': { const n = d.n, m = exMeta(n); S.active.exercises.push({ n, rest: m.rest, u: m.u, sets: Array.from({ length: 3 }, (_, i) => newSet(n, i, m)) }); save(); closeSheet(); rMuscu(); setTimeout(() => { const c = $$('.ex'); c.length && c[c.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 350); break; }
    case 'finish': finishWorkout(); break;
    case 'cancel': if (confirm('Abandonner la séance ? Les séries ne seront pas enregistrées.')) { S.active = null; stopTimer(); save(true); rMuscu(); } break;
    case 'wview': viewWorkout(d.id); break;
    case 'delw': if (confirm('Supprimer cette séance de l’historique ?')) { S.workouts = S.workouts.filter(w => w.id !== d.id); save(); closeSheet(); render(); } break;
    case 'close': closeSheet(); break;
    case 'addfood': foodSheet(d.s); break;
    case 'fslot': foodCtx.slot = d.s; $$('#slotChips .chip').forEach(c => c.classList.toggle('on', c.dataset.s === d.s)); break;
    case 'fcat': foodCtx.cat = d.c; foodCtx.q = ''; $('#foodQ').value = ''; $$('#catChips .chip').forEach(c => c.classList.toggle('on', c.dataset.c === d.c)); drawFoods(); break;
    case 'pickfood': foodDetail(num(d.i)); break;
    case 'backfood': foodSheet(foodCtx.slot); break;
    case 'freefood': freeFood(); break;
    case 'delmeal': S.meals = S.meals.filter(m => m.id !== d.id); save(); render(); break;
    case 'rday': { const k = addDays(repasDay || dayKey(), num(d.d)); repasDay = k >= dayKey() ? null : k; rRepas(); break; }
    case 'repeat': { const k = repasDay || dayKey(); dayMeals(addDays(k, -1)).forEach(m => S.meals.push({ ...m, id: uid(), day: k })); save(); render(); toast('✓ Repas d’hier copiés'); break; }
    case 'savefav': {
      const k = repasDay || dayKey(), items = dayMeals(k).filter(m => m.slot === d.s), sl = SLOTS.find(s => s.id === d.s);
      openSheet(`<h2>Repas favori</h2><p class="mut small" style="margin:-8px 0 14px">${items.map(m => esc(m.name)).join(', ')}</p><div class="form"><label class="f"><span>Nom du favori</span><input class="in" id="favN" value="${esc(items.slice(0, 2).map(m => m.name.split(' ')[0]).join(' + '))}"></label><button class="btn pri block" id="favOk">${ICON.star} Enregistrer</button></div>`);
      $('#favOk').onclick = () => { S.favorites.push({ name: $('#favN').value.trim() || sl.n, slot: d.s, items: items.map(({ id, day, ...m }) => m) }); save(); closeSheet(); render(); toast('⭐ Favori enregistré'); };
      break;
    }
    case 'fav': { const f = S.favorites[num(d.i)]; const k = repasDay || dayKey(); f.items.forEach(m => S.meals.push({ ...m, id: uid(), day: k })); save(); render(); toast(`✓ ${f.name} ajouté`); buzz(10); break; }
    case 'delfav': S.favorites.splice(num(d.i), 1); save(); settingsSheet(); break;
    case 'addw': { const v = num($('#wIn').value); if (v < 25 || v > 300) return toast('Entre un poids valide'); const t = ymd(new Date()); S.weights = S.weights.filter(w => w.date !== t); S.weights.push({ date: t, kg: Math.round(v * 10) / 10 }); S.weights.sort((x, y) => x.date.localeCompare(y.date)); if (S.profile) S.profile.weight = v; save(); rSuivi(); toast('✓ Poids enregistré'); break; }
    case 'wr': wRange = num(d.v); rSuivi(); break;
    case 'sw': sumWeek = Math.max(0, sumWeek + num(d.d)); rSuivi(); break;
    case 'cday': { const k = addDays(consoDayK || dayKey(), num(d.d)); consoDayK = k >= dayKey() ? null : k; rConso(); break; }
    case 'cplus': consoAdd(d.t, 1); break;
    case 'cminus': consoAdd(d.t, -1); break;
    case 'cgoals': goalsSheet(); break;
    case 'export': exportData(); break;
    case 'import': $('#impF').click(); break;
    case 'reset': if (confirm('Effacer TOUTES les données (séances, repas, poids, conso) ?') && confirm('Vraiment tout effacer ? Pense à exporter avant.')) { localStorage.removeItem(KEY); load(); closeSheet(); render(); toast('Données effacées'); } break;
    case 'help': e.preventDefault(); openSheet(HELP_HTML); break;
  }
});
document.addEventListener('input', e => {
  const i = e.target; if (!i.dataset.f || !S.active) return;
  const row = i.closest('.set'); const s = S.active.exercises[num(row.dataset.ei)].sets[num(row.dataset.si)];
  s[i.dataset.f] = i.value.replace(',', '.').replace(/[^\d.]/g, ''); save();
});
document.addEventListener('focusin', e => { if (e.target.matches('.set input')) setTimeout(() => e.target.select(), 0); });
$$('.tabs button').forEach(b => b.addEventListener('click', () => { buzz(6); if (b.dataset.tab === 'repas') repasDay = null; setTab(b.dataset.tab); }));
$('#btnSettings').addEventListener('click', () => settingsSheet(false));

/* ===================== Démo (aperçus uniquement, ?demo) ===================== */
function seedDemo() {
  const now = Date.now(); S = DEF();
  S.profile = { sex: 'H', age: 32, height: 178, weight: 80.2, activity: 1.55, goal: 'masse' };
  for (let i = 60; i >= 0; i -= 2) S.weights.push({ date: ymd(new Date(now - i * DAY_MS)), kg: Math.round((77.4 + (60 - i) * 0.047 + Math.sin(i) * 0.25) * 10) / 10 });
  const p = PROGRAMS[1]; let di = 0;
  const base = { 'Développé couché': 70, 'Squat': 90, 'Rowing barre': 60, 'Développé militaire barre': 42, 'Presse à cuisses': 160, 'Soulevé de terre jambes tendues': 80, 'Tractions': 0 };
  for (let i = 40; i >= 1; i -= 2) {
    if (i % 6 === 4) continue; const t = now - i * DAY_MS - 6 * 36e5, pr = (40 - i) / 40;
    const exs = p.days[di].ex.map(([n, sets, r, rest, u]) => { const b0 = base[n] ?? 16; const kg = b0 ? Math.round(b0 * (1 + pr * 0.14) / 2.5) * 2.5 : ''; return { n, rest, u: u || 'reps', sets: Array.from({ length: sets }, (_, j) => ({ r: r + (j === 0 && i % 4 === 0 ? 1 : 0), kg, done: true })) }; });
    S.workouts.push({ id: uid(), start: t, end: t + 62 * 6e4, day: ymd(new Date(t - 12 * 36e5)), name: `${p.days[di].n} · ${p.name}`, prog: 'ppl', di, exercises: exs, prs: i < 10 && di === 0 ? ['Développé couché'] : [] });
    S.settings.lastProg = 'ppl'; S.settings.lastDay = di; di = (di + 1) % 3;
  }
  const k = dayKey(), f = n => FOODS.findIndex(x => x[0] === n);
  const add = (day, slot, n, g) => { const i = f(n), F = FOODS[i]; S.meals.push({ id: uid(), day, slot, name: F[0], g, kcal: Math.round(F[1] * g / 100), p: Math.round(F[2] * g) / 100, c: Math.round(F[3] * g) / 100, f: Math.round(F[4] * g) / 100, fi: i }); };
  for (let d = 6; d >= 1; d--) { const day = addDays(k, -d); add(day, 'main', 'Riz basmati cuit', 250); add(day, 'main', 'Blanc de poulet cuit', 180); add(day, 'main', 'Brocoli cuit', 150); add(day, 'snack', 'Skyr nature', 150); add(day, 'snack', 'Banane', 120); add(day, 'pre', 'Pâtes cuites', 250); add(day, 'pre', 'Steak haché 5% cuit', 125); add(day, 'pause', 'Yaourt grec', 150); add(day, 'post', 'Omelette nature', 120); if (d % 2) add(day, 'pre', 'Pizza reine / jambon', 175); }
  add(k, 'main', 'Riz basmati cuit', 250); add(k, 'main', 'Blanc de poulet cuit', 180); add(k, 'main', 'Brocoli cuit', 150); add(k, 'snack', 'Flocons d\'avoine', 70); add(k, 'snack', 'Whey protéine (poudre)', 30); add(k, 'pre', 'Pâtes cuites', 250); add(k, 'pre', 'Thon au naturel (boîte)', 100);
  S.favorites = [{ name: 'Riz poulet brocoli', slot: 'main', items: S.meals.filter(m => m.day === k && m.slot === 'main').map(({ id, day, ...m }) => m) }, { name: 'Skyr banane', slot: 'snack', items: S.meals.filter(m => m.day === addDays(k, -1) && m.slot === 'snack').map(({ id, day, ...m }) => m) }];
  [[6, 12, 1, 3, 0], [5, 10, 2, 2, 0], [4, 14, 1, 4, 0.2], [3, 9, 1, 1, 0], [2, 11, 0, 2, 0], [1, 8, 1, 3, 0], [0, 6, 1, 2, 0]].forEach(([d, cig, joint, biere, coke]) => { const day = addDays(k, -d); [['cig', cig], ['joint', joint], ['biere', biere], ['coke', coke]].forEach(([t, q]) => q && S.conso.push({ id: uid(), ts: now, day, t, q })); });
  for (let d = 13; d >= 7; d--) { const day = addDays(k, -d); S.conso.push({ id: uid(), ts: now, day, t: 'cig', q: 13 }, { id: uid(), ts: now, day, t: 'biere', q: 3 }, { id: uid(), ts: now, day, t: 'joint', q: 1 }); }
  S.settings.goals = { cig: 70, joint: 7, biere: 14, coke: '' };
}

/* ===================== Démarrage ===================== */
load();
if (DEMO) seedDemo();
if (params.has('noanim')) document.documentElement.classList.add('noanim');
const qTab = params.get('tab');
setTab(['home', 'muscu', 'repas', 'suivi', 'conso'].includes(qTab) ? qTab : (S.active ? 'muscu' : 'home'), true);
if (params.get('session')) { const [p, d] = params.get('session').split(':'); startWorkout(p, num(d)); if (params.has('timer')) { toggleSet(0, 0); toggleSet(0, 1); } }
({ food: () => foodSheet('pre'), fooddetail: () => { foodSheet('pre'); foodDetail(FOODS.findIndex(f => f[0] === 'Blanc de poulet cuit')); }, settings: () => settingsSheet(false), profile: () => settingsSheet(true), help: () => openSheet(HELP_HTML) }[params.get('sheet')] || (() => {}))();
if (location.search) history.replaceState(sheetOpen ? { sheet: 1 } : null, '', location.pathname);

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  let reloaded = false;
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(r => { r.update().catch(() => {}); setInterval(() => r.update().catch(() => {}), 30 * 60e3); }).catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloaded || sheetOpen) return; reloaded = true; save(true); location.reload(); });
}
