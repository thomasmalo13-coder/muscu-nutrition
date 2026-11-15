'use strict';
/* ===================== NUTRITION ===================== */
const SLOTS = [
  { id: 'main', n: 'Repas principal', t: 'au réveil, après-midi' },
  { id: 'snack', n: 'Collation', t: 'fin d’après-midi, soirée' },
  { id: 'pre', n: 'Avant le service', t: 'vers minuit' },
  { id: 'pause', n: 'Pause de nuit', t: 'vers 4 h, léger' },
  { id: 'post', n: 'Après le service', t: 'avant de dormir' }
];
const ACTIVITY = [[1.2, 'Sédentaire'], [1.375, 'Légère (1–3 séances/sem)'], [1.55, 'Modérée (3–5 séances/sem)'], [1.725, 'Élevée (6–7 séances/sem)'], [1.9, 'Très élevée (physique + sport)']];
const GOALS_N = { masse: 'Prise de masse', seche: 'Sèche', maintien: 'Maintien' };
const NIGHT_TIPS = [
  ['🌙', 'Gros repas avant, léger pendant', 'Ton vrai repas complet avant le service (vers minuit). À 4 h, reste léger : yaourt, fruit, poignée d’amandes.'],
  ['🥚', 'Des protéines à chaque prise', '25 à 40 g par repas (viande, œufs, skyr, thon, whey) répartis sur la journée.'],
  ['☕', 'Café : stop vers 4 h', 'La caféine reste 5 à 6 h dans le corps. Après 4 h du matin, elle abîme ton sommeil de récupération.'],
  ['🛏️', 'Petit repas avant de dormir', 'Après la tournée, un en-cas protéiné et léger (fromage blanc, œufs) puis au lit. Pas de plat gras.'],
  ['💧', 'Bois régulièrement', '1,5 à 2 L sur ta journée, une bouteille dans le camion. Le coup de fatigue de 4–5 h, c’est souvent la soif.'],
  ['🏠', 'Séance au réveil', 'Le mieux : t’entraîner après ton sommeil, puis ton repas principal. Après la tournée, préfère le circuit 20 min.'],
  ['🍌', 'Coup de barre à 5 h ?', 'Une banane ou des dattes avec de l’eau plutôt qu’un soda : énergie plus stable.'],
  ['🕶️', 'Protège ton sommeil', 'Lunettes de soleil au retour, chambre noire, téléphone en silencieux : meilleure récup et moins de fringales.']
];
function targets(p = S.profile) {
  if (!p || !p.weight) return null;
  const w = num(p.weight) || 75, h = num(p.height) || 175, a = num(p.age) || 30;
  const bmr = 10 * w + 6.25 * h - 5 * a + (p.sex === 'F' ? -161 : 5), tdee = bmr * (num(p.activity) || 1.55);
  let kcal = tdee, pk = 1.8, fk = 0.9;
  if (p.goal === 'masse') { kcal = tdee + 300; fk = 1; }
  if (p.goal === 'seche') { kcal = tdee * 0.8; pk = 2.2; fk = 0.8; }
  kcal = Math.round(kcal / 10) * 10;
  const pr = Math.round(w * pk), fa = Math.round(w * fk), ca = Math.max(0, Math.round((kcal - pr * 4 - fa * 9) / 4));
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, p: pr, c: ca, f: fa };
}
const lastWeight = () => S.weights.length ? S.weights[S.weights.length - 1].kg : (S.profile ? num(S.profile.weight) : 0);
const beerKcal = () => Math.round(S.settings.beerCl * 10 * 0.43);
const dayMeals = k => S.meals.filter(m => m.day === k);
function dayTotals(k) {
  const t = { kcal: 0, p: 0, c: 0, f: 0, alc: 0 };
  for (const m of dayMeals(k)) { t.kcal += m.kcal; t.p += m.p; t.c += m.c; t.f += m.f; }
  if (S.settings.alcoholInMeals) { t.alc = consoDay(k).biere * beerKcal(); t.kcal += t.alc; }
  return t;
}
const macroBar = (lbl, v, t, col) => { const pc = t > 0 ? Math.min(100, v / t * 100) : 0, over = t > 0 && v > t * 1.1; return `<div><div class="bar-l"><b>${lbl}</b><span>${fr(v)} / ${fr(t)} g</span></div>${bar(pc, over ? 'var(--bad)' : col)}</div>`; };
function nutritionBlock(k, T, tot, remaining) {
  if (!T) return `<div class="row"><p class="lead grow">${fr(tot.kcal)} kcal · ${fr(tot.p)} g de protéines</p><button class="btn sm soft" data-act="profile">Mon profil</button></div>`;
  return `<div class="ring-wrap">${remaining ? ring(tot.kcal, T.kcal, fr(Math.max(0, T.kcal - tot.kcal)), 'kcal restantes') : ring(tot.kcal, T.kcal, fr(tot.kcal), 'sur ' + fr(T.kcal) + ' kcal')}<div class="macros">${macroBar('Protéines', tot.p, T.p, 'var(--p)')}${macroBar('Glucides', tot.c, T.c, 'var(--c)')}${macroBar('Lipides', tot.f, T.f, 'var(--f)')}</div></div>`;
}
let repasDay = null;
RENDER.repas = function () {
  const el = $('#s-repas'), k = repasDay || dayKey(), T = targets(), tot = dayTotals(k), td = dayKey();
  let h = `<h2>Repas</h2>`;
  h += `<div class="card"><div class="daynav" style="margin-bottom:16px"><button class="icon-btn" data-act="rday" data-d="-1" aria-label="Jour précédent">${ICON.left}</button><div class="dn">${esc(dayLabel(k))}<small>journée de ${S.settings.dayStart} h à ${S.settings.dayStart} h</small></div><button class="icon-btn" data-act="rday" data-d="1" aria-label="Jour suivant" ${k >= td ? 'disabled' : ''}>${ICON.right}</button></div>${nutritionBlock(k, T, tot)}${tot.alc ? `<p class="dim small" style="margin-top:12px">Dont ${fr(tot.alc)} kcal d’alcool (onglet Conso)</p>` : ''}</div>`;
  const canRepeat = dayMeals(addDays(k, -1)).length && !dayMeals(k).length;
  if (S.favorites.length || canRepeat) h += `<div class="card"><h3>Ajout rapide</h3><div class="chips">${canRepeat ? `<button class="chip" data-act="repeat">${ICON.repeat} Comme hier</button>` : ''}${S.favorites.map((f, i) => `<button class="chip" data-act="fav" data-i="${i}">${esc(f.name)}</button>`).join('')}</div></div>`;
  for (const sl of SLOTS) {
    const items = dayMeals(k).filter(m => m.slot === sl.id), kc = items.reduce((s, m) => s + m.kcal, 0);
    h += `<div class="card"><div class="meal-h"><div style="min-width:0"><div class="mn">${sl.n}</div><div class="mt">${items.length ? `<b class="acc">${fr(kc)} kcal</b> · ` : ''}${sl.t}</div></div><div class="row" style="gap:6px">${items.length ? `<button class="x-btn" data-act="savefav" data-s="${sl.id}" aria-label="Enregistrer en favori">${ICON.star}</button>` : ''}<button class="icon-btn" data-act="addfood" data-s="${sl.id}" aria-label="Ajouter" style="color:var(--acc)">${ICON.plus}</button></div></div>`;
    if (items.length) h += `<div class="list">${items.map(m => `<div class="item"><div class="grow"><div class="t">${esc(m.name)}</div><div class="s">${m.g ? fr(m.g) + ' g · ' : ''}P ${fr(m.p)} · G ${fr(m.c)} · L ${fr(m.f)}</div></div><div class="k">${fr(m.kcal)}<small>kcal</small></div><button class="x-btn" data-act="delmeal" data-id="${m.id}" aria-label="Supprimer">${ICON.x}</button></div>`).join('')}</div>`;
    h += `</div>`;
  }
  h += `<div class="card"><h3>Manger en horaires de nuit</h3><div class="tips">${NIGHT_TIPS.map(t => `<div class="tip"><div class="ti">${t[0]}</div><div><b>${t[1]}</b><span>${t[2]}</span></div></div>`).join('')}</div><p class="dim small" style="margin-top:14px">Valeurs nutritionnelles indicatives (tables de composition type CIQUAL), arrondies.</p></div>`;
  el.innerHTML = h; animateIn(el);
};
function recentFoods() { const seen = new Set(), out = []; for (let i = S.meals.length - 1; i >= 0 && out.length < 15; i--) { const m = S.meals[i]; if (m.fi != null && !seen.has(m.fi)) { seen.add(m.fi); out.push(m.fi); } } return out; }
let foodCtx = { slot: 'main', cat: 'Tous', q: '' };
function defaultSlot() { const h = new Date().getHours(); return h >= 22 || h < 2 ? 'pre' : h < 6 ? 'pause' : h < 11 ? 'post' : h < 17 ? 'main' : 'snack'; }
function foodSheet(slot) {
  foodCtx = { slot: slot || defaultSlot(), cat: recentFoods().length ? 'Récents' : 'Tous', q: '' };
  const cats = ['Récents', 'Tous', ...new Set(FOODS.map(f => f[5]))];
  openSheet(`<div class="stick"><h2>Ajouter un aliment</h2><div class="chips" id="slotChips" style="margin-top:10px">${SLOTS.map(s => `<button class="chip ${s.id === foodCtx.slot ? 'on' : ''}" data-act="fslot" data-s="${s.id}">${s.n}</button>`).join('')}</div><div style="position:relative;margin-top:10px"><input class="in" id="foodQ" type="search" placeholder="Rechercher : poulet, riz, skyr…" autocomplete="off" style="padding-left:44px"><span style="position:absolute;left:13px;top:13px;color:var(--dim);pointer-events:none">${ICON.search}</span></div><div class="chips" id="catChips" style="margin-top:10px">${cats.map(c => `<button class="chip ${c === foodCtx.cat ? 'on' : ''}" data-act="fcat" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div></div><div class="food-res" id="foodRes"></div><button class="btn ghost block" data-act="freefood" style="margin-top:12px">${ICON.edit} Saisie libre (plat, resto…)</button>`);
  const on = $('#slotChips .chip.on'); if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' });
  drawFoods(); $('#foodQ').oninput = e => { foodCtx.q = e.target.value; drawFoods(); };
}
function drawFoods() {
  const q = norm(foodCtx.q.trim()); let idx;
  if (q) idx = FOODS.map((f, i) => i).filter(i => q.split(/\s+/).every(w => norm(FOODS[i][0] + ' ' + FOODS[i][5]).includes(w)));
  else if (foodCtx.cat === 'Récents') idx = recentFoods();
  else idx = FOODS.map((f, i) => i).filter(i => foodCtx.cat === 'Tous' || FOODS[i][5] === foodCtx.cat);
  $('#foodRes').innerHTML = idx.length ? idx.slice(0, 80).map(i => { const f = FOODS[i]; return `<button class="item tap" data-act="pickfood" data-i="${i}"><div class="grow"><div class="t">${esc(f[0])}</div><div class="s">${esc(f[7])} · ${f[6]} g · P ${fr(f[2], 1)} g/100 g</div></div><div class="k">${f[1]}<small>kcal/100 g</small></div></button>`; }).join('') : `<div class="empty">Rien trouvé. Utilise la saisie libre.</div>`;
}
function foodDetail(i) {
  const f = FOODS[i]; let g = f[6];
  const calc = g => ({ kcal: f[1] * g / 100, p: f[2] * g / 100, c: f[3] * g / 100, f: f[4] * g / 100 });
  const pv = () => { const m = calc(g); $('#pv').innerHTML = `<div class="stat"><div class="v">${fr(m.kcal)}</div><div class="l">kcal</div></div><div class="stat"><div class="v" style="color:var(--p)">${fr(m.p, 1)}</div><div class="l">Prot. g</div></div><div class="stat"><div class="v" style="color:var(--c)">${fr(m.c, 1)}</div><div class="l">Gluc. g</div></div><div class="stat"><div class="v" style="color:var(--f)">${fr(m.f, 1)}</div><div class="l">Lip. g</div></div>`; };
  const sl = SLOTS.find(s => s.id === foodCtx.slot);
  openSheet(`<h2>${esc(f[0])}</h2><p class="lead">${esc(sl.n)} · pour 100 g : ${f[1]} kcal · P ${fr(f[2], 1)} · G ${fr(f[3], 1)} · L ${fr(f[4], 1)}</p>
    <div class="row"><button class="icon-btn" data-g="-10" aria-label="moins 10 g" style="width:56px;height:56px;font-size:22px">−</button><div class="grow" style="position:relative"><input class="in" id="gIn" inputmode="decimal" value="${g}" style="text-align:center;font-size:24px;font-weight:700;min-height:56px"><span style="position:absolute;right:16px;top:17px;color:var(--dim)">g</span></div><button class="icon-btn" data-g="10" aria-label="plus 10 g" style="width:56px;height:56px;font-size:22px">+</button></div>
    <div class="chips" style="margin-top:12px"><button class="chip" data-gs="${f[6]}">${esc(f[7])}</button><button class="chip" data-gs="${f[6] * 2}">× 2</button><button class="chip" data-gs="${Math.round(f[6] / 2)}">½ portion</button><button class="chip" data-gs="100">100 g</button></div>
    <div class="pv" id="pv"></div><div class="grid2"><button class="btn" data-act="backfood">Retour</button><button class="btn pri" id="addF">${ICON.plus} Ajouter</button></div>`);
  const inp = $('#gIn'); pv();
  inp.oninput = () => { g = num(inp.value); pv(); };
  $$('[data-g]').forEach(b => b.onclick = () => { g = Math.max(0, num(inp.value) + num(b.dataset.g)); inp.value = g; pv(); });
  $$('[data-gs]').forEach(b => b.onclick = () => { g = num(b.dataset.gs); inp.value = g; pv(); });
  $('#addF').onclick = () => { if (g <= 0) return; addMeal({ name: f[0], g, ...calc(g), fi: i, slot: foodCtx.slot }); closeSheet(); toast(`${f[0]} ajouté`); };
}
function addMeal(m) { const r = v => Math.round(v * 10) / 10; S.meals.push({ id: uid(), day: repasDay || dayKey(), slot: m.slot, name: m.name, g: m.g || 0, kcal: Math.round(m.kcal), p: r(m.p), c: r(m.c), f: r(m.f), fi: m.fi ?? null }); save(); render(); }
function freeFood() {
  openSheet(`<h2>Saisie libre</h2><p class="lead">Pour un plat ou un repas au resto.</p><div class="form"><label class="f"><span>Nom</span><input class="in" id="ffN" placeholder="ex. Menu burger"></label><div class="grid2"><label class="f"><span>Calories (kcal)</span><input class="in" id="ffK" inputmode="numeric"></label><label class="f"><span>Protéines (g)</span><input class="in" id="ffP" inputmode="decimal"></label><label class="f"><span>Glucides (g)</span><input class="in" id="ffC" inputmode="decimal"></label><label class="f"><span>Lipides (g)</span><input class="in" id="ffF" inputmode="decimal"></label></div><div class="grid2"><button class="btn" data-act="backfood">Retour</button><button class="btn pri" id="ffOk">Ajouter</button></div></div>`);
  $('#ffOk').onclick = () => { const k = num($('#ffK').value); if (!k) return toast('Indique au moins les calories'); addMeal({ name: $('#ffN').value.trim() || 'Repas', kcal: k, p: num($('#ffP').value), c: num($('#ffC').value), f: num($('#ffF').value), slot: foodCtx.slot }); closeSheet(); toast('Ajouté'); };
}
Object.assign(ACT, {
  addfood: d => foodSheet(d.s),
  fslot: d => { foodCtx.slot = d.s; $$('#slotChips .chip').forEach(c => c.classList.toggle('on', c.dataset.s === d.s)); },
  fcat: d => { foodCtx.cat = d.c; foodCtx.q = ''; $('#foodQ').value = ''; $$('#catChips .chip').forEach(c => c.classList.toggle('on', c.dataset.c === d.c)); drawFoods(); },
  pickfood: d => foodDetail(num(d.i)),
  backfood: () => foodSheet(foodCtx.slot),
  freefood: () => freeFood(),
  delmeal: d => { S.meals = S.meals.filter(m => m.id !== d.id); save(); render(); },
  rday: d => { const k = addDays(repasDay || dayKey(), num(d.d)); repasDay = k >= dayKey() ? null : k; RENDER.repas(); },
  repeat: () => { const k = repasDay || dayKey(); dayMeals(addDays(k, -1)).forEach(m => S.meals.push({ ...m, id: uid(), day: k })); save(); render(); toast('Repas d’hier copiés'); },
  savefav: d => {
    const k = repasDay || dayKey(), items = dayMeals(k).filter(m => m.slot === d.s), sl = SLOTS.find(s => s.id === d.s);
    openSheet(`<h2>Repas favori</h2><p class="lead">${items.map(m => esc(m.name)).join(', ')}</p><div class="form"><label class="f"><span>Nom du favori</span><input class="in" id="favN" value="${esc(items.slice(0, 2).map(m => m.name.split(' ')[0]).join(' + '))}"></label><button class="btn pri block" id="favOk">Enregistrer</button></div>`);
    $('#favOk').onclick = () => { S.favorites.push({ name: $('#favN').value.trim() || sl.n, slot: d.s, items: items.map(({ id, day, ...m }) => m) }); save(); closeSheet(); render(); toast('Favori enregistré'); };
  },
  fav: d => { const f = S.favorites[num(d.i)], k = repasDay || dayKey(); f.items.forEach(m => S.meals.push({ ...m, id: uid(), day: k })); save(); render(); toast(`${f.name} ajouté`); },
  delfav: d => { S.favorites.splice(num(d.i), 1); save(); settingsSheet(); }
});
