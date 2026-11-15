'use strict';
/* ===================== CONSO ===================== */
const CONSO = [
  { id: 'cig', n: 'Cigarettes', i: '🚬', u: 'cig.', step: 1, tc: 'var(--c3)' },
  { id: 'joint', n: 'Joints', i: '🌿', u: 'joint(s)', step: 1, tc: 'var(--c7)' },
  { id: 'biere', n: 'Bières', i: '🍺', u: 'bière(s)', step: 1, tc: 'var(--c1)' },
  { id: 'coke', n: 'Cocaïne', i: '❄️', u: 'g', step: 0.1, tc: 'var(--c6)' }
];
const zeroC = () => ({ cig: 0, joint: 0, biere: 0, coke: 0 });
function consoDay(k) { const r = zeroC(); for (const e of S.conso) if (e.day === k && r[e.t] !== undefined) r[e.t] = Math.round((r[e.t] + e.q) * 10) / 10; return r; }
const consoCost = r => CONSO.reduce((s, c) => s + r[c.id] * (S.settings.prices[c.id] || 0), 0);
function sumDays(from, n) { const r = zeroC(); for (let i = 0; i < n; i++) { const d = consoDay(addDays(from, -i)); for (const t in r) r[t] = Math.round((r[t] + d[t]) * 10) / 10; } return r; }
function daysWithout(t) { let last = null; for (const e of S.conso) if (e.t === t && e.q > 0 && (!last || e.day > last)) last = e.day; return last ? daysBetween(last, dayKey()) : 0; }
let consoDayK = null;
RENDER.conso = function () {
  const el = $('#s-conso'), td = dayKey(), k = consoDayK || td, c = consoDay(k), P = S.settings.prices;
  let h = tabHead('conso', 'Conso', 'Garder la main, sereinement');
  h += `<div class="card"><div class="daynav"><button class="icon-btn" data-act="cday" data-d="-1" aria-label="Jour précédent">${ICON.left}</button><div class="dn">${esc(dayLabel(k))}<small>${eur(consoCost(c))} ce jour</small></div><button class="icon-btn" data-act="cday" data-d="1" aria-label="Jour suivant" ${k >= td ? 'disabled' : ''}>${ICON.right}</button></div></div>`;
  h += `<div class="cgrid">${CONSO.map(x => `<div class="cc" style="--tc:${x.tc}"><div class="ct"><i>${x.i}</i>${x.n}</div><div class="cn" id="cn-${x.id}">${fr(c[x.id], 1)}</div><div class="cu">${x.u} · ${eur(c[x.id] * P[x.id])}</div><div class="cb"><button data-act="cminus" data-t="${x.id}" aria-label="Retirer">−</button><button class="plus" data-act="cplus" data-t="${x.id}" aria-label="Ajouter">+${x.step < 1 ? '<span class="st">' + fr(x.step, 1) + ' g</span>' : ''}</button></div></div>`).join('')}</div>`;
  const days = Array.from({ length: 7 }, (_, i) => addDays(td, i - 6)), wk7 = sumDays(td, 7), month = sumDays(td, 30);
  h += `<div class="card"><div class="h-row" style="margin-bottom:8px"><h3>7 derniers jours</h3><b class="num" style="font-size:18px">${eur(consoCost(wk7))}</b></div>
    ${barChart(days.map(x => { const r = consoDay(x); return { l: fmtDate(x, { weekday: 'short' }).slice(0, 3), hi: x === k, segs: CONSO.map(cc => ({ v: r[cc.id] * P[cc.id], c: cc.tc })) }; }), { unitFmt: v => fr(v) + ' €' })}
    <div class="legend">${CONSO.map(x => `<span><i style="background:${x.tc}"></i>${x.n}</span>`).join('')}</div>
    <div class="grid2" style="margin-top:14px"><div class="stat"><div class="v">${eur(consoCost(month), 0)}</div><div class="l">Sur 30 jours</div></div><div class="stat"><div class="v">${eur(consoCost(wk7) * 52, 0)}</div><div class="l">À ce rythme sur 1 an</div></div></div></div>`;
  // Limites (objectifs de type conso, semaine en cours)
  const ws = weekStart(td), wkDays = Array.from({ length: 7 }, (_, i) => addDays(ws, i)), pws = addDays(ws, -7);
  const cur = zeroC(), prev = zeroC(); wkDays.forEach(d => { const r = consoDay(d); for (const t in cur) cur[t] += r[t]; }); for (let i = 0; i < 7; i++) { const r = consoDay(addDays(pws, i)); for (const t in prev) prev[t] += r[t]; }
  const el7 = daysBetween(ws, td) + 1;
  h += `<div class="card"><div class="h-row" style="margin-bottom:12px"><h3>Mes limites · cette semaine</h3><button class="btn sm ghost" data-act="cgoals">${ICON.edit} Régler</button></div>`;
  h += CONSO.map(x => {
    const g = activeGoals().find(g => g.type === 'conso' && g.t === x.id), v = Math.round(cur[x.id] * 10) / 10, pv = Math.round(prev[x.id] * 10) / 10, since = daysWithout(x.id);
    if (!g && !v && !pv) return '';
    const tr = v < pv ? `<span class="acc">${ICON.down}${fr(pv - v, 1)}</span>` : v > pv && el7 === 7 ? `<span class="bad">${ICON.up}${fr(v - pv, 1)}</span>` : '';
    const over = g && v > g.target, warn = g && !over && v / el7 * 7 > g.target;
    return `<div style="margin-bottom:14px"><div class="bar-l"><b>${x.i} ${x.n}</b><span>${fr(v, 1)}${g ? ' / ' + fr(g.target, 1) : ''} <span class="dim">${x.u}</span> <span class="trend">${tr}</span></span></div>${g ? bar(g.target ? Math.min(100, v / g.target * 100) : (v ? 100 : 0), over ? 'var(--bad)' : warn ? 'var(--warn)' : x.tc) : ''}<div class="small dim" style="margin-top:5px">${pv ? 'Semaine dernière : ' + fr(pv, 1) : ''}${since >= 2 ? `${pv ? ' · ' : ''}<span class="acc">${since >= 30 ? '30 jours et plus sans' : since + ' jours sans'}</span>` : ''}</div></div>`;
  }).join('') || `<p class="dim small">Rien de noté pour l’instant. Fixe-toi une limite par semaine avec « Régler ».</p>`;
  h += `</div>`;
  const sv = consoSavingsBetween(monthKey(td) + '-01', td), base = consoBaseline();
  h += `<button class="card tap" data-act="goto" data-tab="budget" style="display:block;width:100%;text-align:left"><div class="h-row"><div><h3 style="margin:0">Économies sur la conso</h3><div class="small mut" style="margin-top:4px">${base ? `Référence : ${eur(base.week, 0)} / semaine${base.auto ? ' (calculée)' : ''}` : 'Note ta conso 2 semaines pour calculer ta référence'}</div></div><div class="amount acc" style="font-size:22px">${eur(sv, 0)}</div></div><div class="small dim" style="margin-top:8px">ce mois-ci · compté dans ton épargne ${ICON.right}</div></button>`;
  h += `<div class="card"><h3>Impact sport & récup</h3><div class="tips">
    <div class="tip"><div class="ti">🍺</div><div><b>${fr(wk7.biere * beerKcal())} kcal d’alcool sur 7 jours</b><span>Une bière de ${S.settings.beerCl} cl ≈ ${beerKcal()} kcal. L’alcool freine la construction musculaire et casse le sommeil profond.${S.settings.alcoholInMeals ? ' Ces calories sont comptées dans Repas.' : ''}</span></div></div>
    <div class="tip"><div class="ti">🚬</div><div><b>Tabac</b><span>Moins d’oxygène dans le sang : cardio et endurance en baisse, récup plus lente.</span></div></div>
    <div class="tip"><div class="ti">🌿</div><div><b>Cannabis</b><span>Fringales (souvent sucrées) et sommeil moins réparateur : à anticiper dans tes repas.</span></div></div>
    <div class="tip"><div class="ti">❄️</div><div><b>Cocaïne</b><span>Cœur et tension en surrégime : pas de séance dans les heures qui suivent. Avec de l’alcool, le cœur est encore plus chargé.</span></div></div>
    <div class="tip"><div class="ti">🚐</div><div><b>Au volant</b><span>Avant la tournée : rien. Les tests salivaires restent positifs longtemps.</span></div></div></div></div>`;
  h += `<p class="dim small" style="text-align:center;padding:4px 0">Ces données restent uniquement sur ce téléphone.</p>`;
  el.innerHTML = h; animateIn(el);
};
function consoAdd(t, sign) {
  const k = consoDayK || dayKey(), x = CONSO.find(c => c.id === t), cur = consoDay(k)[t];
  if (sign < 0 && cur <= 0) return;
  const tot = Math.max(0, Math.round((cur + sign * x.step) * 10) / 10);
  S.conso = S.conso.filter(e => !(e.day === k && e.t === t)); if (tot > 0) S.conso.push({ id: uid(), ts: Date.now(), day: k, t, q: tot });
  save(); buzz(10); RENDER.conso(); const n = $('#cn-' + t); if (n) { n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump'); }
}
function consoLimitsSheet() {
  const gOf = t => activeGoals().find(g => g.type === 'conso' && g.t === t);
  openSheet(`<h2>Limites par semaine</h2><p class="lead">Le maximum que tu te fixes, du lundi au dimanche. Laisse vide pour aucune limite. Elles apparaissent aussi dans tes objectifs.</p><div class="form" style="margin-top:14px">${CONSO.map(x => { const g = gOf(x.id); return `<label class="f"><span>${x.i} ${x.n} (${x.u})</span><input class="in" inputmode="decimal" data-lim="${x.id}" value="${g ? esc(String(g.target).replace('.', ',')) : ''}" placeholder="aucune"></label>`; }).join('')}<button class="btn pri block" id="limOk">Enregistrer</button></div>`);
  $('#limOk').onclick = () => {
    $$('[data-lim]').forEach(i => { const t = i.dataset.lim, g = gOf(t), v = i.value.trim(); if (!v) { if (g) S.goals = S.goals.filter(x => x !== g); return; } if (g) g.target = num(v); else S.goals.push({ id: uid(), cat: 'nutri', type: 'conso', t, target: num(v), created: today(), deadline: '', ms: [], wins: [] }); });
    save(); closeSheet(); render(); toast('Limites enregistrées');
  };
}
Object.assign(ACT, {
  cday: d => { const k = addDays(consoDayK || dayKey(), num(d.d)); consoDayK = k >= dayKey() ? null : k; RENDER.conso(); },
  cplus: d => consoAdd(d.t, 1),
  cminus: d => consoAdd(d.t, -1),
  cgoals: () => consoLimitsSheet()
});
