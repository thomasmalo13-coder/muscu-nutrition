'use strict';
/* ===================== RECETTES PROTÉINÉES & LISTE DE COURSES ===================== */
// [id, nom, emoji, minutes, prix € / portion, tags, ingrédients [aliment FOODS, g], étapes]
// tags : nc = sans cuisson, box = lunchbox / camion, nuit = pause de nuit légère, masse = riche en calories
const RECIPES = [
  ['skyr', 'Skyr fruits rouges & avoine', '🫐', 3, 1.6, 'nc nuit', [['Skyr nature', 250], ['Fruits rouges surgelés', 100], ['Flocons d\'avoine', 40], ['Miel', 10]], 'Mélange tout dans un bol ou une boîte. Les fruits surgelés décongèlent en 1 h dans le camion.'],
  ['oats', 'Overnight oats whey', '🥣', 5, 1.4, 'nc box', [['Flocons d\'avoine', 60], ['Lait demi-écrémé', 200], ['Whey protéine (poudre)', 30], ['Banane', 100]], 'La veille : avoine + lait + whey dans un pot, au frigo. Ajoute la banane au moment de manger.'],
  ['wrapthon', 'Wrap thon crudités', '🌯', 5, 1.9, 'nc box', [['Wrap / tortilla blé', 60], ['Thon au naturel (boîte)', 140], ['Fromage blanc 3%', 40], ['Carottes râpées', 50], ['Salade verte', 20]], 'Écrase le thon avec le fromage blanc, étale sur le wrap, ajoute carottes et salade, roule serré dans de l’alu.'],
  ['pfb', 'Fromage blanc amandes miel', '🍯', 2, 1.3, 'nc nuit', [['Fromage blanc 0%', 300], ['Amandes', 20], ['Miel', 10]], 'Idéal à 4 h : léger, rassasiant, beaucoup de protéines lentes.'],
  ['sandpoulet', 'Sandwich poulet maison', '🥪', 5, 2.2, 'nc box', [['Pain complet', 100], ['Blanc de poulet cuit', 120], ['Fromage blanc 3%', 30], ['Tomate', 60], ['Salade verte', 15]], 'Fromage blanc à la place du beurre ou de la mayo : moins gras, plus de protéines.'],
  ['shake', 'Shake prise de masse', '🥤', 3, 1.5, 'nc masse', [['Lait entier', 300], ['Flocons d\'avoine', 60], ['Banane', 120], ['Whey protéine (poudre)', 30], ['Beurre de cacahuète', 20]], 'Tout au mixeur 30 secondes. Se boit en 2 minutes au réveil ou avant le service.'],
  ['oeufbox', 'Box œufs durs & crudités', '🥚', 3, 1.5, 'nc box nuit', [['Œuf entier', 180], ['Carottes râpées', 100], ['Pain complet', 60], ['Comté', 30]], 'Cuis 6 œufs d’avance (10 min), ils se gardent 5 jours au frigo dans leur coquille.'],
  ['sardines', 'Tartines sardines tomate', '🐟', 4, 1.4, 'nc', [['Pain complet', 80], ['Sardines à l\'huile égouttées', 100], ['Tomate', 80]], 'Écrase les sardines sur le pain, tranches de tomate, poivre. Riche en oméga-3.'],
  ['pchiche', 'Salade pois chiches thon', '🥗', 5, 1.8, 'nc box', [['Pois chiches cuits', 200], ['Thon au naturel (boîte)', 140], ['Tomate', 100], ['Concombre', 80], ['Vinaigrette', 15]], 'Tout en boîte, la vinaigrette à part. Tient très bien jusqu’au lendemain.'],
  ['grec', 'Yaourt grec muesli kiwi', '🥝', 2, 1.3, 'nc nuit', [['Yaourt grec', 200], ['Muesli', 50], ['Kiwi', 100]], 'Le muesli à part pour qu’il reste croquant.'],
  ['galettes', 'Galettes de riz cacahuète banane', '🍌', 2, 0.9, 'nc nuit', [['Galettes de riz', 30], ['Beurre de cacahuète', 25], ['Banane', 120]], 'Collation camion rapide quand tu as un coup de barre vers 3 h.'],
  ['omelette', 'Omelette jambon fromage', '🍳', 10, 1.6, '', [['Œuf entier', 180], ['Jambon blanc', 50], ['Emmental', 20], ['Pain complet', 60]], 'Bats 3 œufs, poêle chaude, ajoute jambon et fromage, plie en deux. 5 min de cuisson.'],
  ['porridge', 'Porridge chaud protéiné', '🍎', 6, 1.1, '', [['Flocons d\'avoine', 70], ['Lait demi-écrémé', 250], ['Whey protéine (poudre)', 25], ['Pomme', 120]], 'Avoine + lait 3 min au micro-ondes, mélange la whey après cuisson, pomme en dés.'],
  ['pthon', 'Pâtes thon ratatouille', '🍝', 12, 1.9, 'box masse', [['Pâtes cuites', 250], ['Thon au naturel (boîte)', 140], ['Ratatouille', 150], ['Emmental', 15]], 'Pâtes cuites + ratatouille en boîte réchauffées, thon et fromage par-dessus.'],
  ['prb', 'Poulet riz brocoli', '🍗', 15, 2.6, 'box', [['Riz basmati cuit', 250], ['Blanc de poulet cuit', 180], ['Brocoli cuit', 150], ['Huile d\'olive', 5]], 'Le classique. Cuisine pour 3 jours d’un coup : 3 boîtes prêtes.'],
  ['salriz', 'Salade poulet riz maïs', '🌽', 8, 2.3, 'box', [['Riz basmati cuit', 200], ['Blanc de poulet cuit', 150], ['Maïs doux (boîte)', 60], ['Tomate', 100], ['Huile d\'olive', 10]], 'Avec du riz cuit d’avance. Se mange froid : parfait pour la pause de minuit.'],
  ['taboule', 'Taboulé au poulet', '🍋', 10, 2.0, 'box', [['Semoule cuite', 200], ['Blanc de poulet cuit', 130], ['Tomate', 100], ['Concombre', 100], ['Huile d\'olive', 10]], 'Semoule + eau bouillante 5 min, puis légumes en dés, citron, menthe si tu as.'],
  ['lentilles', 'Bowl lentilles œufs épinards', '🥬', 12, 1.4, 'box', [['Lentilles cuites', 200], ['Œuf entier', 120], ['Épinards cuits', 100], ['Huile d\'olive', 5]], 'Lentilles en conserve rincées, épinards surgelés poêlés, 2 œufs mollets dessus.'],
  ['chili', 'Chili express', '🌶️', 15, 2.2, 'box masse', [['Steak haché 5% cuit', 150], ['Haricots rouges cuits', 150], ['Riz blanc cuit', 200], ['Tomate', 100]], 'Viande émiettée à la poêle + haricots + tomates concassées + épices, 10 min.'],
  ['saumon', 'Saumon patate douce', '🍠', 20, 3.4, '', [['Saumon cuit', 150], ['Patate douce cuite', 250], ['Haricots verts cuits', 150]], 'Patate douce en cubes au micro-ondes 8 min, saumon à la poêle 4 min par face.'],
  ['dinde', 'Dinde courgettes semoule', '🦃', 15, 2.0, 'box', [['Escalope de dinde cuite', 150], ['Semoule cuite', 200], ['Courgette cuite', 150], ['Huile d\'olive', 5]], 'Dinde en lanières saisie 5 min, courgettes en rondelles, semoule à côté.'],
  ['cantonais', 'Riz cantonais protéiné', '🍚', 12, 1.5, 'box masse', [['Riz blanc cuit', 250], ['Œuf entier', 120], ['Jambon blanc', 60], ['Petits pois cuits', 80], ['Huile d\'olive', 5]], 'Riz de la veille à la poêle, œufs brouillés, jambon en dés, petits pois.'],
  ['steakpdt', 'Steak haché, pommes de terre, haricots', '🥩', 20, 2.4, '', [['Steak haché 5% cuit', 150], ['Pomme de terre cuite à l\'eau', 300], ['Haricots verts cuits', 150]], 'Simple et efficace avant le service : protéines + glucides lents.'],
  ['quinoa', 'Quinoa poulet avocat', '🥑', 12, 3.0, 'box', [['Quinoa cuit', 200], ['Blanc de poulet cuit', 140], ['Avocat', 70], ['Tomate', 80]], 'Se prépare d’avance, l’avocat coupé au dernier moment avec un filet de citron.'],
  ['crevettes', 'Crevettes riz légumes poêlés', '🍤', 12, 3.2, 'box', [['Crevettes cuites', 150], ['Riz basmati cuit', 220], ['Légumes poêlés (mélange)', 200]], 'Légumes surgelés à la poêle 8 min, crevettes 2 min, sauce soja.'],
  ['gnocchis', 'Gnocchis jambon mozzarella', '🧀', 12, 2.3, 'masse', [['Gnocchis cuits', 250], ['Jambon blanc', 60], ['Mozzarella', 60], ['Tomate', 100]], 'Gnocchis dorés à la poêle, tomate, jambon, mozzarella qui fond dessus.']
];
const RTAGS = [['all', 'Toutes'], ['nc', 'Sans cuisson'], ['box', 'Lunchbox'], ['nuit', 'Pause de nuit'], ['masse', 'Masse']];
const fIdx = n => FOODS.findIndex(f => f[0] === n);
function recipeItems(r, mult = 1) {
  return r[6].map(([n, g]) => { const i = fIdx(n), F = FOODS[i], gg = Math.round(g * mult); return { name: F[0], g: gg, kcal: Math.round(F[1] * gg / 100), p: Math.round(F[2] * gg) / 100, c: Math.round(F[3] * gg) / 100, f: Math.round(F[4] * gg) / 100, fi: i }; });
}
function recipeMacros(r) { return recipeItems(r).reduce((t, m) => ({ kcal: t.kcal + m.kcal, p: t.p + m.p, c: t.c + m.c, f: t.f + m.f }), { kcal: 0, p: 0, c: 0, f: 0 }); }
const recipeById = id => RECIPES.find(r => r[0] === id);
let recTag = 'all';
function recipeCardHtml(r) { const m = recipeMacros(r); return `<button class="rcp tap" data-act="recipe" data-id="${r[0]}"><span class="re">${r[2]}</span><span class="grow" style="min-width:0"><span class="t">${esc(r[1])}</span><span class="s">${r[3]} min · ${eur(r[4])} · ${fr(m.kcal)} kcal</span></span><span class="rp"><b>${fr(m.p)} g</b>prot.</span></button>`; }
function recipesSheet() {
  const list = RECIPES.filter(r => recTag === 'all' || r[5].split(' ').includes(recTag)).sort((a, b) => recipeMacros(b).p / recipeMacros(b).kcal - recipeMacros(a).p / recipeMacros(a).kcal);
  const nShop = Object.keys(S.shop.r).length;
  openSheet(`<h2>Recettes protéinées</h2><p class="lead">Rapides et pas chères. Les plus riches en protéines par calorie en premier.</p><div class="chips" style="margin:14px 0 6px">${RTAGS.map(([k, l]) => `<button class="chip ${recTag === k ? 'on' : ''}" data-act="rtag" data-v="${k}">${l}</button>`).join('')}</div><div class="list">${list.map(recipeCardHtml).join('')}</div><button class="btn soft block" data-act="shopList" style="margin-top:16px">🛒 Liste de courses${nShop ? ` (${nShop} recette${nShop > 1 ? 's' : ''})` : ''}</button>`);
}
function recipeSheet(id) {
  const r = recipeById(id), m = recipeMacros(r), its = recipeItems(r), inShop = S.shop.r[id] || 0;
  let slot = defaultSlot();
  openSheet(`<button class="link" data-act="recipes" style="margin-bottom:8px">${ICON.left} Recettes</button><div class="row" style="gap:14px;align-items:center"><span class="re big">${r[2]}</span><div class="grow"><h2 style="margin:0">${esc(r[1])}</h2><p class="lead" style="margin-top:4px">${r[3]} min · environ ${eur(r[4])} la portion${r[5].includes('nc') ? ' · sans cuisson' : ''}</p></div></div>
  <div class="grid3" style="margin:16px 0"><div class="stat"><div class="v">${fr(m.kcal)}</div><div class="l">kcal</div></div><div class="stat"><div class="v acc">${fr(m.p)}<small>g</small></div><div class="l">Protéines</div></div><div class="stat"><div class="v">${fr(m.c)}<small>g</small></div><div class="l">Glucides</div></div></div>
  <h3>Ingrédients</h3><div class="list">${its.map(x => `<div class="item"><div class="grow"><div class="t">${esc(x.name)}</div><div class="s">P ${fr(x.p)} · G ${fr(x.c)} · L ${fr(x.f)}</div></div><div class="k">${shopQty(x.name, x.g)}</div></div>`).join('')}</div>
  <h3 style="margin-top:16px">Préparation</h3><p class="small" style="line-height:1.6">${esc(r[7])}</p>
  <h3 style="margin-top:16px">Ajouter à</h3><div class="chips" id="rSlot">${SLOTS.map(s => `<button class="chip ${s.id === slot ? 'on' : ''}" data-s="${s.id}" type="button">${s.n}</button>`).join('')}</div>
  <div class="grid2" style="margin-top:14px"><button class="btn" data-act="shopToggle" data-id="${id}">${inShop ? '✓ Dans la liste' : '🛒 Aux courses'}</button><button class="btn pri" id="rLog">${ICON.plus} Je mange ça</button></div>`);
  $('#rSlot').onclick = e => { const b = e.target.closest('[data-s]'); if (!b) return; slot = b.dataset.s; $$('#rSlot .chip').forEach(c => c.classList.toggle('on', c === b)); };
  $('#rLog').onclick = () => { const k = repasDay || dayKey(); recipeItems(r).forEach(x => S.meals.push({ ...x, id: uid(), day: k, slot })); save(); closeSheet(); render(); toast(`${r[1]} ajouté · ${fr(m.p)} g de protéines`); };
}
function shopQty(name, g) {
  if (name === 'Œuf entier') return `${Math.ceil(g / 60)} œuf${g > 60 ? 's' : ''}`;
  if (/Lait|Jus/.test(name)) return g >= 1000 ? fr(g / 1000, 1) + ' L' : g + ' ml';
  return g >= 1000 ? fr(g / 1000, 1) + ' kg' : g + ' g';
}
const SHOP_RAY = { 'Viandes & volailles': '🥩 Viandes', 'Poissons & œufs': '🐟 Poissons & œufs' };
function shopList() {
  const agg = {};
  for (const [id, n] of Object.entries(S.shop.r)) { const r = recipeById(id); if (!r) continue; for (const [nm, g] of r[6]) agg[nm] = (agg[nm] || 0) + g * n; }
  const groups = {};
  for (const [nm, g] of Object.entries(agg)) { const cat = FOODS[fIdx(nm)][5]; (groups[cat] = groups[cat] || []).push([nm, g]); }
  return groups;
}
function shopSheet() {
  const groups = shopList(), ids = Object.keys(S.shop.r), cost = ids.reduce((s, id) => s + recipeById(id)[4] * S.shop.r[id], 0);
  let h = `<button class="link" data-act="recipes" style="margin-bottom:8px">${ICON.left} Recettes</button><h2>Liste de courses</h2>`;
  if (!ids.length) h += `<div class="empty">Ta liste est vide.<br>Ouvre une recette et touche « Aux courses » : les quantités s’additionnent toutes seules.</div>`;
  else {
    h += `<p class="lead">${ids.length} recette${ids.length > 1 ? 's' : ''} · environ ${eur(cost, 0)} au total</p><div class="list" style="margin:14px 0">${ids.map(id => { const r = recipeById(id); return `<div class="item"><span class="re">${r[2]}</span><div class="grow"><div class="t">${esc(r[1])}</div><div class="s">${S.shop.r[id]} portion${S.shop.r[id] > 1 ? 's' : ''}</div></div><div class="stepper"><button data-act="shopN" data-id="${id}" data-d="-1" aria-label="Moins">−</button><button data-act="shopN" data-id="${id}" data-d="1" aria-label="Plus">+</button></div></div>`; }).join('')}</div>`;
    for (const [cat, items] of Object.entries(groups)) h += `<h3 style="margin-top:14px">${esc(cat)}</h3><div class="list">${items.map(([nm, g]) => `<button class="check ${S.shop.done[nm] ? 'on' : ''}" data-act="shopDone" data-n="${esc(nm)}" type="button"><span class="bx">${ICON.check}</span><span class="grow"><span class="t" ${S.shop.done[nm] ? 'style="text-decoration:line-through;opacity:.6"' : ''}>${esc(nm)}</span></span><span class="k mut">${shopQty(nm, g)}</span></button>`).join('')}</div>`;
    h += `<div class="grid2" style="margin-top:18px"><button class="btn" data-act="shopShare">Copier la liste</button><button class="btn danger" data-act="shopClear">Vider</button></div>`;
  }
  openSheet(h);
}
function shopText() { const g = shopList(); return Object.entries(g).map(([c, it]) => c + '\n' + it.map(([n, q]) => `- ${n} : ${shopQty(n, q)}`).join('\n')).join('\n\n'); }
function suggestRecipe(kLeft, pLeft) { // recette qui colle aux calories restantes, sans cuisson en priorité la nuit
  const h = new Date().getHours(), night = h < 7 || h >= 22;
  return RECIPES.map(r => ({ r, m: recipeMacros(r) })).filter(x => !night || x.r[5].includes('nc')).filter(x => x.m.kcal <= Math.max(350, kLeft + 100)).sort((a, b) => Math.abs(a.m.p - Math.min(60, pLeft)) - Math.abs(b.m.p - Math.min(60, pLeft)))[0]?.r || RECIPES[0];
}
Object.assign(ACT, {
  recipes: () => recipesSheet(),
  recipe: d => recipeSheet(d.id),
  rtag: d => { recTag = d.v; recipesSheet(); },
  shopList: () => shopSheet(),
  shopToggle: (d, b) => { if (S.shop.r[d.id]) delete S.shop.r[d.id]; else S.shop.r[d.id] = 1; save(); b.textContent = S.shop.r[d.id] ? '✓ Dans la liste' : '🛒 Aux courses'; toast(S.shop.r[d.id] ? 'Ajouté à la liste de courses' : 'Retiré de la liste'); },
  shopN: d => { const n = (S.shop.r[d.id] || 0) + num(d.d); if (n <= 0) delete S.shop.r[d.id]; else S.shop.r[d.id] = Math.min(14, n); save(); shopSheet(); },
  shopDone: (d, b) => { S.shop.done[d.n] = !S.shop.done[d.n]; save(); b.classList.toggle('on'); const t = b.querySelector('.t'); t.style.textDecoration = S.shop.done[d.n] ? 'line-through' : ''; t.style.opacity = S.shop.done[d.n] ? '.6' : ''; },
  shopShare: async () => { const t = 'Courses\n\n' + shopText(); try { if (navigator.share) await navigator.share({ text: t }); else { await navigator.clipboard.writeText(t); toast('Liste copiée'); } } catch { try { await navigator.clipboard.writeText(t); toast('Liste copiée'); } catch { toast('Copie impossible'); } } },
  shopClear: () => { const snap = JSON.stringify(S.shop); S.shop = { r: {}, done: {} }; save(); shopSheet(); toast('Liste vidée', 5000, { label: 'Annuler', fn: () => { S.shop = JSON.parse(snap); save(); shopSheet(); } }); }
});
