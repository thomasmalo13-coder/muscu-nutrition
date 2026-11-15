'use strict';
/* ===================== IDENTITÉ VISUELLE v4 : ciel ambiant, illustrations ===================== */
// Le fond suit le moment de la journée : aube (retour de tournée), jour, crépuscule, nuit
function ambientOf(h = new Date().getHours()) { return h >= 5 && h < 10 ? 'dawn' : h >= 10 && h < 17 ? 'day' : h >= 17 && h < 21 ? 'dusk' : 'night'; }
function applyAmbient() { const a = params.get('amb') || ambientOf(); document.documentElement.dataset.amb = a; return a; }
setInterval(() => { const before = document.documentElement.dataset.amb; if (applyAmbient() !== before && TAB === 'home') RENDER.home(); }, 5 * 60e3);

const ART = {
  sport: `<circle class="f-b" cx="88" cy="28" r="20"/><path d="M8 70h104"/><circle class="f-a" cx="42" cy="52" r="16"/><circle cx="42" cy="52" r="16"/><path d="M33 40v-5a9 9 0 0 1 18 0v5"/><path d="M36 54a7 7 0 0 0 6 6"/><path d="M70 62 94 38"/><path d="M64 58l10 10M90 32l10 10M60 61l4 4M99 31l4 4"/><path d="M106 12v8M102 16h8"/>`,
  repas: `<circle class="f-b" cx="86" cy="26" r="19"/><path class="f-a" d="M22 44h64a32 22 0 0 1-64 0Z"/><path d="M22 44h64a32 22 0 0 1-64 0Z"/><path d="M42 72h24"/><path d="M42 34c-4-5 4-8 0-13M54 34c-4-5 4-8 0-13M66 34c-4-5 4-8 0-13"/><path class="f-a" d="M96 62c8-2 15-10 15-21-11 0-17 9-15 21Z"/><path d="M96 62c8-2 15-10 15-21-11 0-17 9-15 21ZM96 62l9-13"/>`,
  goals: `<circle class="f-b" cx="94" cy="22" r="14"/><path class="f-a" d="M6 70 38 26l18 24 14-16 42 36Z"/><path d="M6 70 38 26l18 24 14-16 42 36Z"/><path d="M70 34V10l15 5-15 5"/><path d="M24 70c6-8 14-6 20-14s12-6 18-12" stroke-dasharray="1 6"/>`,
  budget: `<circle class="f-b" cx="90" cy="24" r="17"/><path class="f-a" d="M30 30h40v6c6 4 8 10 8 18v10a6 6 0 0 1-6 6H28a6 6 0 0 1-6-6V54c0-8 2-14 8-18Z"/><path d="M30 30h40v6c6 4 8 10 8 18v10a6 6 0 0 1-6 6H28a6 6 0 0 1-6-6V54c0-8 2-14 8-18ZM27 30h46"/><circle cx="50" cy="56" r="8"/><path d="M50 52v8"/><ellipse cx="96" cy="66" rx="10" ry="3.5"/><path d="M86 66v-6M106 66v-6"/><ellipse class="f-a" cx="96" cy="60" rx="10" ry="3.5"/><ellipse cx="96" cy="60" rx="10" ry="3.5"/>`,
  conso: `<circle class="f-b" cx="88" cy="24" r="18"/><path class="f-a" d="M38 54h44l-6 18H44Z"/><path d="M38 54h44l-6 18H44Z"/><path d="M60 54V32"/><path class="f-a" d="M60 40c0-10-8-16-18-16 0 10 8 16 18 16Z"/><path d="M60 40c0-10-8-16-18-16 0 10 8 16 18 16Z"/><path d="M60 34c0-8 6-13 15-13 0 8-6 13-15 13Z"/>`
};
function tabHead(key, title, sub) {
  return `<header class="th"><div class="th-t"><div class="th-k">${esc(sub)}</div><h2>${esc(title)}</h2></div><svg class="th-art" viewBox="0 0 120 80" aria-hidden="true">${ART[key]}</svg></header>`;
}
const SCENE_TXT = {
  dawn: ['Bien rentré', 'L’aube, c’est ton moment pour récupérer.'],
  day: ['Le jour pour dormir', 'Et l’après-midi pour bouger un peu.'],
  dusk: ['La nuit se prépare', 'Un vrai repas, de l’eau, et c’est parti.'],
  night: ['Bonne tournée', 'Prudence sur la route, à tout à l’heure.']
};
function homeScene() {
  const a = document.documentElement.dataset.amb || ambientOf(), now = new Date(), night = a === 'night';
  const h = params.get('amb') ? { dawn: 7.5, day: 13, dusk: 18.6, night: 23 }[a] : now.getHours() + now.getMinutes() / 60;
  const t = clamp((h - 6) / 14, 0, 1), sx = 250 + t * 80, sy = 96 - Math.sin(Math.PI * t) * 58;
  const stars = night ? Array.from({ length: 14 }, (_, i) => `<circle class="star" cx="${(i * 97) % 340 + 10}" cy="${(i * 53) % 70 + 10}" r="${i % 3 ? 0.9 : 1.4}" style="animation-delay:${i * 0.3}s"/>`).join('') : '';
  const body = night ? `<circle class="moon" cx="292" cy="38" r="15"/><circle class="moon-cut" cx="300" cy="33" r="13"/>` : `<circle class="sun-glow" cx="${sx}" cy="${sy}" r="34"/><circle class="sun" cx="${sx}" cy="${sy}" r="15"/>`;
  const F = formeScore(), [t1, t2] = SCENE_TXT[a];
  return `<div class="scene"><svg viewBox="0 0 360 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${stars}${body}
    <path class="h1" d="M0 104 C50 86 110 96 170 88 S290 70 360 92 V150 H0Z"/><path class="h2" d="M0 120 C70 102 140 116 210 106 S310 98 360 112 V150H0Z"/>
    <path class="road" d="M0 136 C90 126 200 134 360 124 V150 H0Z"/><path class="lane" d="M0 141 C90 132 200 140 360 130" stroke-dasharray="10 12"/>
    <g class="van" transform="translate(222 113)">${night || a === 'dusk' ? '<path class="beam" d="M37 9 L80 2 L80 18Z"/>' : ''}<rect class="vb" x="0" y="0" width="26" height="14" rx="3"/><path class="vb" d="M26 4h6l5 5v5H26Z"/><rect class="vw" x="28" y="5" width="4" height="4" rx="1"/><circle class="wh" cx="7" cy="15" r="3"/><circle class="wh" cx="30" cy="15" r="3"/><path class="cross" d="M10 7h6M13 4v6"/></g></svg>
    <div class="scene-t"><b>${t1}</b><span>${t2}</span>${S.profile ? `<em>Forme ${F.score} · ${formeLabel(F.score).toLowerCase()}</em>` : ''}</div></div>`;
}
