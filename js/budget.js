'use strict';
/* ===================== BUDGET & ÉPARGNE ===================== */
const FINCATS = [
  ['courses', 'Courses', '🛒', 'var(--c1)'], ['resto', 'Resto & fast-food', '🍔', 'var(--c2)'], ['carbu', 'Carburant', '⛽', 'var(--c3)'],
  ['logement', 'Logement', '🏠', 'var(--c4)'], ['abos', 'Abonnements', '📱', 'var(--c5)'], ['loisirs', 'Loisirs', '🎮', 'var(--c6)'],
  ['sport', 'Sport', '💪', 'var(--c7)'], ['sante', 'Santé', '💊', 'var(--c8)'], ['autre', 'Autre', '📦', 'var(--c9)']
];
const CONSO_CAT = ['conso', 'Conso', '🚬', 'var(--dim)'];
const finCat = id => FINCATS.find(c => c[0] === id) || (id === 'conso' ? CONSO_CAT : FINCATS[8]);
const shortCat = n => n.replace(' & fast-food', '').replace('Abonnements', 'Abos');
// Référence conso (€ / semaine) : manuelle, sinon moyenne des 14 premiers jours notés
function consoBaseline() {
  if (S.fin.consoBase !== '' && S.fin.consoBase != null) return { week: num(S.fin.consoBase), from: '0000-00-00', auto: false };
  if (!S.conso.length) return null;
  const first = S.conso.reduce((m, e) => e.day < m ? e.day : m, '9999'), end = addDays(first, 13);
  if (end >= dayKey()) return null;
  let c = 0; for (let d = first; d <= end; d = addDays(d, 1)) c += consoCost(consoDay(d));
  return { week: c / 2, from: addDays(end, 1), auto: true };
}
function consoSavingsBetween(a, b) {
  const base = consoBaseline(); if (!base || !base.week) return 0;
  const from = a > base.from ? a : base.from, to = b < dayKey() ? b : dayKey(); if (from > to) return 0;
  let s = 0; for (let d = from; d <= to; d = addDays(d, 1)) s += base.week / 7 - consoCost(consoDay(d));
  return Math.max(0, Math.round(s));
}
const depositsBetween = (a, b) => S.fin.savings.filter(x => x.date >= a && x.date <= b).reduce((s, x) => s + x.amount, 0);
const savingsBetween = (a, b, conso = true) => depositsBetween(a, b) + (conso ? consoSavingsBetween(a, b) : 0);
function consoMonthCost(m, before) { let c = 0; const n = daysInMonth(m); for (let i = 1; i <= n; i++) { const d = `${m}-${pad(i)}`; if (d > dayKey() || (before && d >= before)) break; c += consoCost(consoDay(d)); } return c; }
function monthSpend(m, cat = 'all', before) {
  let s = S.fin.expenses.filter(e => e.date.startsWith(m) && (cat === 'all' || e.cat === cat) && (!before || e.date < before)).reduce((a, e) => a + e.amount, 0);
  if (S.fin.consoInBudget && (cat === 'all' || cat === 'conso')) s += consoMonthCost(m, before);
  return s;
}
function monthProjection(m, cat = 'all') { const sp = monthSpend(m, cat); if (m !== monthKey(today())) return sp; const fx = cat === 'all' ? monthSpend(m, 'logement') + monthSpend(m, 'abos') : ['logement', 'abos'].includes(cat) ? sp : 0; return fx + (sp - fx) / +today().slice(8) * daysInMonth(m); }
let finMonth = null;
RENDER.budget = function () {
  const el = $('#s-budget'), cm = monthKey(today()), m = finMonth || cm, isCur = m === cm, B = num(S.fin.budget);
  const spent = monthSpend(m), dom = isCur ? +today().slice(8) : daysInMonth(m), dim = daysInMonth(m), proj = monthProjection(m);
  let h = tabHead('budget', 'Budget', 'Chaque euro a un rôle') + `<div class="card"><div class="daynav"><button class="icon-btn" data-act="fm" data-d="-1" aria-label="Mois précédent">${ICON.left}</button><div class="dn">${esc(monthLabel(m))}<small>${isCur ? `${dim - dom} jours restants` : 'mois terminé'}</small></div><button class="icon-btn" data-act="fm" data-d="1" aria-label="Mois suivant" ${isCur ? 'disabled' : ''}>${ICON.right}</button></div></div>`;
  // Carte budget
  const left = B - spent, pct = B ? spent / B * 100 : 0, tone = !B ? 'var(--acc)' : spent > B ? 'var(--bad)' : proj > B ? 'var(--warn)' : 'var(--acc)';
  h += `<div class="card accent"><div class="eyebrow">${B ? (left >= 0 ? 'Reste à dépenser' : 'Dépassement') : 'Dépensé ce mois'}</div><div class="amount" style="margin:6px 0 14px${B && left < 0 ? ';color:var(--bad)' : ''}">${eur(B ? Math.abs(left) : spent, 0)}${B ? `<small>sur ${eur(B, 0)}</small>` : ''}</div>${B ? bar(pct, tone) + `<div class="bar-l" style="margin:8px 0 0"><span>${eur(spent, 0)} dépensés</span><span style="color:${tone}">${isCur ? 'projection ' + eur(proj, 0) : fr(pct) + ' %'}</span></div>` : `<p class="lead">Fixe un budget mensuel pour suivre ce qu’il te reste.</p>`}
  <div class="grid2" style="margin-top:16px"><button class="btn pri" data-act="expAdd">${ICON.plus} Dépense</button><button class="btn soft" data-act="saveAdd">${ICON.plus} Épargne</button></div><button class="link" data-act="budgetSet" style="margin-top:12px">${B ? 'Modifier le budget' : 'Définir mon budget mensuel'}</button></div>`;
  // Par catégorie
  const parts = FINCATS.map(c => [c, monthSpend(m, c[0]) - (0)]).filter(([, v]) => v > 0);
  if (S.fin.consoInBudget) { const cc = consoMonthCost(m); if (cc > 0) parts.push([CONSO_CAT, cc]); }
  parts.sort((a, b) => b[1] - a[1]);
  if (parts.length) { const tot = parts.reduce((s, p) => s + p[1], 0);
    h += `<div class="card"><h3>Par catégorie</h3><div class="donut-wrap">${donut(parts.map(([c, v]) => ({ v, c: c[3] })), 128, eur(tot, 0), 'total')}<div class="cat-list">${parts.slice(0, 5).map(([c, v]) => `<div><div class="bar-l"><b>${c[2]} ${esc(shortCat(c[1]))}</b><span>${eur(v, 0)}</span></div>${bar(v / tot * 100, c[3], true)}</div>`).join('')}${parts.length > 5 ? `<div class="small dim">+ ${parts.length - 5} autres · ${eur(parts.slice(5).reduce((s, p) => s + p[1], 0), 0)}</div>` : ''}</div></div></div>`; }
  // Épargne
  const ms = m + '-01', me = m + '-' + pad(dim), dep = depositsBetween(ms, me), cs = consoSavingsBetween(ms, me), all = S.fin.savings.reduce((s, x) => s + x.amount, 0), base = consoBaseline();
  h += `<div class="card"><div class="h-row" style="margin-bottom:12px"><h3>Épargne</h3><span class="badge acc">${eur(dep + cs, 0)} ce mois</span></div><div class="grid3"><div class="stat"><div class="v">${eur(dep, 0)}</div><div class="l">Mis de côté</div></div><div class="stat"><div class="v acc">${eur(cs, 0)}</div><div class="l">Sur la conso</div></div><div class="stat"><div class="v">${eur(all + consoSavingsBetween('0000-00-00', today()), 0)}</div><div class="l">Total</div></div></div><p class="dim small" style="margin-top:12px">${base ? `Conso : référence ${eur(base.week, 0)} par semaine${base.auto ? ', calculée sur tes 2 premières semaines' : ''}. Chaque euro en dessous compte comme épargné.` : 'Note ta conso pendant 2 semaines : l’appli calculera ce que tu économises en réduisant.'}</p></div>`;
  // Objectifs financiers
  const fg = activeGoals().filter(g => g.cat === 'finance');
  h += `<div class="card"><div class="h-row" style="margin-bottom:8px"><h3>Objectifs financiers</h3><button class="link" data-act="gnewFin">${ICON.plus} Ajouter</button></div>${fg.length ? fg.map(goalRow).join('') : '<p class="dim small">Un projet (vacances, permis, matériel) ou un plafond de dépenses ? Crée un objectif, la progression se calcule toute seule.</p>'}</div>`;
  // Dernières dépenses
  const ex = S.fin.expenses.filter(e => e.date.startsWith(m)).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)), sv = S.fin.savings.filter(x => x.date.startsWith(m));
  const rows = [...ex.map(e => ({ ...e, k: 'e' })), ...sv.map(s => ({ ...s, k: 's' }))].sort((a, b) => b.date.localeCompare(a.date));
  h += `<div class="card"><h3>Mouvements</h3>${rows.length ? `<div class="list">${rows.slice(0, 30).map(r => { const c = r.k === 's' ? ['', 'Épargne', '🐷', 'var(--acc)'] : finCat(r.cat); return `<div class="item"><span class="ico" style="background:color-mix(in srgb, ${c[3]} 16%, transparent)">${c[2]}</span><div class="grow"><div class="t">${esc(r.note || c[1])}</div><div class="s">${fmtDate(r.date)}${r.note ? ' · ' + esc(shortCat(c[1])) : ''}</div></div><div class="k ${r.k === 's' ? 'acc' : ''}">${r.k === 's' ? '+' : '−'}${eur(r.amount)}</div><button class="x-btn" data-act="${r.k === 's' ? 'delSave' : 'delExp'}" data-id="${r.id}" aria-label="Supprimer">${ICON.x}</button></div>`; }).join('')}</div>` : '<div class="empty">Aucune dépense notée ce mois-ci.</div>'}</div>`;
  el.innerHTML = h; animateIn(el);
};
function moneySheet(kind, goalId) {
  const isE = kind === 'e'; let cat = 'courses';
  openSheet(`<h2>${isE ? 'Nouvelle dépense' : 'Mettre de côté'}</h2><div class="form" style="margin-top:12px"><div style="position:relative"><input class="in bigin" id="mAmt" inputmode="decimal" placeholder="0" aria-label="Montant"><span style="position:absolute;right:18px;top:19px;font-size:20px;color:var(--dim)">€</span></div>
  ${isE ? `<div class="catgrid" id="mCat">${FINCATS.map(c => `<button type="button" class="catbtn ${c[0] === cat ? 'on' : ''}" data-c="${c[0]}"><i>${c[2]}</i>${esc(shortCat(c[1]))}</button>`).join('')}</div>` : ''}
  <div class="grid2"><label class="f"><span>Date</span><input class="in" type="date" id="mDate" value="${today()}" max="${today()}"></label><label class="f"><span>Note</span><input class="in" id="mNote" placeholder="${isE ? 'facultatif' : 'ex. Livret A'}"></label></div><button class="btn pri block" id="mOk">${isE ? 'Ajouter la dépense' : 'Enregistrer'}</button></div>`);
  if (isE) $('#mCat').onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; cat = b.dataset.c; $$('#mCat .catbtn').forEach(x => x.classList.toggle('on', x === b)); };
  setTimeout(() => { const i = $('#mAmt'); i && !DEMO && i.focus(); }, 320);
  $('#mOk').onclick = () => { const a = Math.round(num($('#mAmt').value) * 100) / 100; if (!(a > 0)) return toast('Indique un montant'); const o = { id: uid(), date: $('#mDate').value || today(), amount: a, note: $('#mNote').value.trim() }; if (isE) S.fin.expenses.push({ ...o, cat }); else { if (goalId) o.goal = goalId; S.fin.savings.push(o); } save(); closeSheet(); render(); toast(isE ? 'Dépense ajoutée' : 'Épargne enregistrée'); buzz(10); };
}
function budgetSheet() {
  openSheet(`<h2>Budget mensuel</h2><p class="lead">Le total que tu t’autorises à dépenser chaque mois (hors loyer si tu préfères, à toi de voir).</p><div class="form" style="margin-top:14px"><div style="position:relative"><input class="in bigin" id="bAmt" inputmode="decimal" value="${S.fin.budget ? String(S.fin.budget).replace('.', ',') : ''}" placeholder="0"><span style="position:absolute;right:18px;top:19px;font-size:20px;color:var(--dim)">€</span></div>
  <button class="check ${S.fin.consoInBudget ? 'on' : ''}" id="bCo" type="button"><span class="bx">${ICON.check}</span><span class="grow"><span class="t" style="display:block">Inclure la conso dans les dépenses</span><span class="s">Calculée avec les prix des réglages</span></span></button>
  <label class="f"><span>Référence conso par semaine (€) · vide = calcul automatique</span><input class="in" id="bBase" inputmode="decimal" value="${S.fin.consoBase !== '' ? esc(String(S.fin.consoBase).replace('.', ',')) : ''}" placeholder="${consoBaseline() && consoBaseline().auto ? fr(consoBaseline().week) + ' (auto)' : 'auto'}"></label>
  <button class="btn pri block" id="bOk">Enregistrer</button></div>`);
  let co = S.fin.consoInBudget; $('#bCo').onclick = () => { co = !co; $('#bCo').classList.toggle('on', co); };
  $('#bOk').onclick = () => { S.fin.budget = num($('#bAmt').value); S.fin.consoInBudget = co; const b = $('#bBase').value.trim(); S.fin.consoBase = b ? num(b) : ''; const g = activeGoals().find(g => g.type === 'depenses' && (g.c || 'all') === 'all'); if (g && S.fin.budget) g.target = S.fin.budget; save(); closeSheet(); render(); toast('Budget enregistré'); };
}
Object.assign(ACT, {
  fm: d => { const cm = monthKey(today()); const [y, mo] = (finMonth || cm).split('-').map(Number); const dt = new Date(y, mo - 1 + num(d.d), 1); const k = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}`; finMonth = k >= cm ? null : k; RENDER.budget(); },
  expAdd: () => moneySheet('e'),
  saveAdd: d => moneySheet('s', d.g),
  budgetSet: () => budgetSheet(),
  gnewFin: () => goalForm(null, { type: 'epargne' }),
  delExp: d => undoable('Dépense supprimée', () => { S.fin.expenses = S.fin.expenses.filter(e => e.id !== d.id); }),
  delSave: d => undoable('Épargne supprimée', () => { S.fin.savings = S.fin.savings.filter(e => e.id !== d.id); })
});
