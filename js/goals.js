'use strict';
/* ===================== OBJECTIFS ===================== */
const GCAT = { sport: ['Sport', '🏋️'], nutri: ['Nutrition & santé', '🥗'], finance: ['Finances', '💶'] };
const GT = {
  reps: { cat: 'sport', n: 'Répétitions d’affilée', ex: 'Pompes', kind: 'cum' },
  charge: { cat: 'sport', n: 'Charge à atteindre', kind: 'cum', unit: 'kg' },
  seances: { cat: 'sport', n: 'Séances par semaine', kind: 'week' },
  poids: { cat: 'nutri', n: 'Poids cible', kind: 'cum', unit: 'kg' },
  proteines: { cat: 'nutri', n: 'Protéines par jour', kind: 'avg', unit: 'g' },
  conso: { cat: 'nutri', n: 'Réduire une conso', kind: 'limit' },
  epargne: { cat: 'finance', n: 'Épargne', kind: 'cum', unit: '€' },
  depenses: { cat: 'finance', n: 'Limite de dépenses', kind: 'limitm', unit: '€' }
};
const REPS_EX = () => ['Pompes', 'Tractions', ...Object.keys(EX).filter(n => !EX[n].w && n !== 'Pompes' && n !== 'Tractions')];
const LOAD_EX = () => [...Object.keys(EX).filter(n => EX[n].w), ...GYM_EX];
const activeGoals = () => S.goals.filter(g => !g.done);
const plural = (n, s, p) => n > 1 ? (p || s + 's') : s;
function gLabel(g) {
  const t = g.target;
  switch (g.type) {
    case 'poids': return `Atteindre ${fr(t, 1)} kg`;
    case 'reps': { const u = exUnit(g.ex) === 'sec'; return u ? `${fr(t)} s de ${g.ex.toLowerCase()}` : `${fr(t)} ${g.ex.toLowerCase()} d’affilée`; }
    case 'charge': return `${g.ex} à ${fr(t, 1)} kg`;
    case 'seances': return `${fr(t)} ${plural(t, 'séance')} par semaine`;
    case 'proteines': return `${fr(t)} g de protéines par jour`;
    case 'conso': { const c = CONSO.find(x => x.id === g.t); return `${c.n} : max ${fr(t, 1)} par semaine`; }
    case 'epargne': return g.name ? `${g.name} : ${eur(t)}` : `Épargner ${eur(t)}`;
    case 'depenses': return g.c === 'all' || !g.c ? `Budget : max ${eur(t)} par mois` : `${(FINCATS.find(c => c[0] === g.c) || ['', 'Dépenses'])[1]} : max ${eur(t)}/mois`;
  }
  return 'Objectif';
}
// Meilleure série d'un exercice (les variantes plus dures de la même famille comptent)
function bestReps(name, from) {
  const f = famOf(name), L = f ? FAMS[f].list : [name], i0 = L.indexOf(name);
  let b = 0; for (const w of S.workouts) { if (from && w.day < from) continue; for (const e of w.exercises) { const j = L.indexOf(e.n); if (j < 0 || j < i0) continue; for (const s of e.sets) if (s.done) b = Math.max(b, num(s.r)); } }
  return b;
}
function bestKg(name, from) { let b = 0; for (const w of S.workouts) { if (from && w.day < from) continue; for (const e of w.exercises) if (e.n === name) for (const s of e.sets) if (s.done) b = Math.max(b, num(s.kg)); } return b; }
function seriesFor(g) { // points {x: ms, y}
  if (g.type === 'poids') return S.weights.map(w => ({ x: parseYmd(w.date).getTime(), y: w.kg }));
  if (g.type === 'reps' || g.type === 'charge') {
    const f = famOf(g.ex), L = f ? FAMS[f].list : [g.ex], i0 = L.indexOf(g.ex), out = [];
    for (const w of S.workouts) { let b = 0; for (const e of w.exercises) { const j = L.indexOf(e.n); if (j < 0 || (g.type === 'reps' ? j < i0 : e.n !== g.ex)) continue; for (const s of e.sets) if (s.done) b = Math.max(b, num(g.type === 'reps' ? s.r : s.kg)); } if (b > 0) out.push({ x: w.start, y: b }); }
    return out;
  }
  if (g.type === 'epargne') { const out = []; let acc = 0; const from = g.created; for (let d = from; d <= today(); d = addDays(d, 1)) { acc = savingsBetween(from, d, g.conso !== false); if (d === from || d === today() || parseYmd(d).getDay() === 0) out.push({ x: parseYmd(d).getTime(), y: Math.round(acc) }); } return out; }
  return [];
}
function gEta(g, cur) {
  let slope = null; const t0 = Date.now();
  if (g.type === 'epargne') { const d = Math.max(1, daysBetween(g.created, today())); if (d >= 3 && cur > 0) slope = cur / d; }
  else { const pts = seriesFor(g).filter(p => p.x >= t0 - 42 * DAY_MS).map(p => ({ x: (p.x - t0) / DAY_MS, y: p.y })); if (pts.length >= 3 && (pts[pts.length - 1].x - pts[0].x) >= 5) slope = linreg(pts); }
  if (!slope) return null;
  const days = (g.target - cur) / slope;
  if (!isFinite(days) || days < 0 || days > 1100) return days > 1100 ? 'long' : null;
  return addDays(today(), Math.ceil(days));
}
function gState(g) {
  const T = g.target, wk = weekStart(dayKey()), td = today(); let cur = 0, pct = 0, txt = '', sub = '', tone = 'acc', reached = false, eta = null;
  const dl = g.deadline ? daysBetween(td, g.deadline) : null;
  const dlTxt = dl == null ? '' : dl < 0 ? 'échéance passée' : dl === 0 ? 'échéance aujourd’hui' : `J-${dl}`;
  switch (GT[g.type].kind) {
    case 'cum': {
      cur = g.type === 'poids' ? lastWeight() : g.type === 'reps' ? bestReps(g.ex) : g.type === 'charge' ? bestKg(g.ex) : savingsBetween(g.created, td, g.conso !== false);
      const st = g.type === 'epargne' ? 0 : (g.startVal ?? 0), up = T >= st;
      pct = T === st ? 1 : clamp((cur - st) / (T - st), 0, 1); reached = up ? cur >= T : cur <= T;
      const u = g.type === 'epargne' ? '' : g.type === 'reps' ? (exUnit(g.ex) === 'sec' ? ' s' : '') : ' kg';
      txt = g.type === 'epargne' ? `${eur(cur)} / ${eur(T)}` : `${fr(cur, 1)}${u} → ${fr(T, 1)}${u}`;
      if (!reached) { eta = gEta(g, cur); if (eta === 'long') { sub = 'au rythme actuel : plus de 3 ans'; tone = 'warn'; eta = null; } else if (eta) { sub = `≈ atteint le ${fmtDate(eta, { day: 'numeric', month: 'short', year: eta.slice(0, 4) !== td.slice(0, 4) ? 'numeric' : undefined })}`; if (g.deadline && eta > g.deadline) { tone = 'warn'; sub += ' · en retard'; } else if (g.deadline) sub += ' · dans les temps'; } else sub = g.type === 'poids' ? 'pèse-toi régulièrement pour une estimation' : g.type === 'epargne' ? 'mets de côté pour voir une estimation' : 'encore quelques séances pour estimer'; }
      else sub = 'objectif atteint';
      break;
    }
    case 'week': {
      cur = S.workouts.filter(w => w.day >= wk).length; pct = clamp(cur / T, 0, 1); reached = cur >= T;
      txt = `${cur} / ${fr(T)} cette semaine`; const st = weekStreak(g); sub = reached ? 'semaine validée' : `encore ${fr(T - cur)} ${plural(T - cur, 'séance')}`; if (st) sub += ` · ${st} ${plural(st, 'semaine')} réussie${st > 1 ? 's' : ''} d’affilée`;
      break;
    }
    case 'avg': {
      const days = Array.from({ length: 7 }, (_, i) => addDays(dayKey(), -i)).filter(d => dayMeals(d).length);
      cur = days.length ? days.reduce((s, d) => s + dayTotals(d).p, 0) / days.length : 0; pct = clamp(cur / T, 0, 1);
      txt = `${fr(cur)} g / ${fr(T)} g en moyenne`; const hit = Array.from({ length: 7 }, (_, i) => addDays(wk, i)).filter(d => dayTotals(d).p >= T * 0.9).length;
      sub = days.length ? `${hit} ${plural(hit, 'jour')} dans la cible cette semaine` : 'note tes repas pour suivre'; tone = cur >= T * 0.9 ? 'acc' : 'warn'; break;
    }
    case 'limit': {
      const c = CONSO.find(x => x.id === g.t); cur = Array.from({ length: 7 }, (_, i) => addDays(wk, i)).reduce((s, d) => s + consoDay(d)[g.t], 0); cur = Math.round(cur * 10) / 10;
      pct = T > 0 ? cur / T : (cur > 0 ? 1.2 : 0); const el = daysBetween(wk, dayKey()) + 1, projW = cur / el * 7;
      txt = `${fr(cur, 1)} / ${fr(T, 1)} ${c.u} cette semaine`; tone = cur > T ? 'bad' : projW > T ? 'warn' : 'acc';
      sub = cur > T ? 'limite dépassée cette semaine' : projW > T ? `à ce rythme : ${fr(projW, 1)} sur la semaine` : (T - cur > 0 ? `il te reste ${fr(T - cur, 1)}` : 'limite atteinte, tiens bon'); const st = weekStreak(g); if (st) sub += ` · ${st} ${plural(st, 'semaine')} sous la limite`; break;
    }
    case 'limitm': {
      const m = monthKey(td); cur = monthSpend(m, g.c || 'all'); pct = T > 0 ? cur / T : 0; const proj = monthProjection(m, g.c || 'all');
      txt = `${eur(cur)} / ${eur(T)} ce mois`; tone = cur > T ? 'bad' : proj > T ? 'warn' : 'acc'; sub = cur > T ? 'budget dépassé' : proj > T ? `projection fin de mois : ${eur(proj)}` : `reste ${eur(T - cur)}`; break;
    }
  }
  if (dlTxt && GT[g.type].kind === 'cum' && !reached) sub += ' · ' + dlTxt;
  return { cur, pct, txt, sub, tone, reached, eta };
}
function weekStreak(g) { // semaines complètes réussies d'affilée (avant la semaine en cours)
  let n = 0, w = addDays(weekStart(dayKey()), -7); const created = weekStart(g.created);
  while (w >= created && n < 52) {
    const days = Array.from({ length: 7 }, (_, i) => addDays(w, i));
    const ok = g.type === 'seances' ? S.workouts.filter(x => x.day >= w && x.day <= days[6]).length >= g.target : days.reduce((s, d) => s + consoDay(d)[g.t], 0) <= g.target;
    if (!ok) break; n++; w = addDays(w, -7);
  }
  return n;
}
function weekMinis() {
  const out = [], wk = weekStart(dayKey()), wkDays = Array.from({ length: 7 }, (_, i) => addDays(wk, i)), td = today();
  for (const g of activeGoals()) {
    const weeksLeft = g.deadline ? Math.max(1, daysBetween(td, g.deadline) / 7) : 8;
    if (g.type === 'poids') {
      const before = S.weights.filter(w => w.date < wk), base = before.length ? before[before.length - 1].kg : (g.startVal ?? lastWeight()); if (!base) continue;
      const cap = S.profile && S.profile.goal === 'masse' ? 0.4 : 0.8, need = clamp((g.target - base) / weeksLeft, -cap, cap), tw = Math.round((base + need) * 10) / 10;
      const inW = S.weights.filter(w => w.date >= wk), lw = inW.length ? inW[inW.length - 1].kg : null;
      out.push({ g, label: 'Te peser 3 fois', cur: inW.length, target: 3, done: inW.length >= 3 });
      if (Math.abs(need) >= 0.05) out.push({ g, label: `Viser ${fr(tw, 1)} kg en fin de semaine`, cur: lw ?? base, target: tw, done: lw != null && (need > 0 ? lw >= tw : lw <= tw), txt: lw != null ? `${fr(lw, 1)} kg` : '' });
    } else if (g.type === 'reps' || g.type === 'charge') {
      const isR = g.type === 'reps', prevB = isR ? bestReps(g.ex) - 0 : bestKg(g.ex); const before = isR ? bestBeforeWeek(g, wk) : bestKgBefore(g.ex, wk), thisW = isR ? bestReps(g.ex, wk) : bestKg(g.ex, wk);
      if (!before) { out.push({ g, label: `Faire un test max : ${g.ex.toLowerCase()}`, cur: thisW ? 1 : 0, target: 1, done: thisW > 0 }); continue; }
      const goal = Math.min(g.target, isR ? before + Math.max(1, Math.round(before * 0.08)) : before + 2.5);
      out.push({ g, label: isR ? `Une série de ${fr(goal)}${exUnit(g.ex) === 'sec' ? ' s' : ''} en ${g.ex.toLowerCase()}` : `${g.ex} à ${fr(goal, 1)} kg`, cur: thisW, target: goal, done: thisW >= goal, txt: thisW ? `meilleur : ${fr(thisW, 1)}` : '' });
      void prevB;
    } else if (g.type === 'seances') {
      const c = S.workouts.filter(w => w.day >= wk).length; out.push({ g, label: `${fr(g.target)} ${plural(g.target, 'séance')} de sport`, cur: c, target: g.target, done: c >= g.target });
    } else if (g.type === 'proteines') {
      const hit = wkDays.filter(d => dayTotals(d).p >= g.target * 0.9).length; out.push({ g, label: `${fr(g.target)} g de protéines, 5 jours sur 7`, cur: hit, target: 5, done: hit >= 5 });
    } else if (g.type === 'conso') {
      const c = CONSO.find(x => x.id === g.t), cur = Math.round(wkDays.reduce((s, d) => s + consoDay(d)[g.t], 0) * 10) / 10;
      out.push({ g, label: `${c.n} : max ${fr(g.target, 1)} cette semaine`, cur, target: g.target, limit: true, done: cur <= g.target });
    } else if (g.type === 'epargne') {
      const st = gState(g); if (st.reached) continue; const need = Math.max(5, Math.ceil((g.target - st.cur) / weeksLeft / 5) * 5), cur = savingsBetween(wk, td, g.conso !== false);
      out.push({ g, label: `Mettre ${eur(need, 0)} de côté`, cur, target: need, done: cur >= need, txt: cur ? eur(cur) : '' });
    } else if (g.type === 'depenses') {
      const m = monthKey(td), spentBefore = monthSpend(m, g.c || 'all', wk), wl = Math.max(1, (daysInMonth(m) - +wk.slice(8) + 1) / 7), allow = Math.max(0, (g.target - spentBefore) / (wk.slice(0, 7) === m ? wl : (daysInMonth(m) - +td.slice(8) + 1) / 7)), cur = monthSpend(m, g.c || 'all') - spentBefore;
      out.push({ g, label: `Dépenses : max ${eur(Math.round(allow), 0)} cette semaine`, cur, target: allow, limit: true, done: cur <= allow, txt: eur(cur) });
    }
  }
  return out;
}
function bestBeforeWeek(g, wk) { const f = famOf(g.ex), L = f ? FAMS[f].list : [g.ex], i0 = L.indexOf(g.ex); let b = 0; for (const w of S.workouts) { if (w.day >= wk) continue; for (const e of w.exercises) { const j = L.indexOf(e.n); if (j < i0 || j < 0) continue; for (const s of e.sets) if (s.done) b = Math.max(b, num(s.r)); } } return b; }
function bestKgBefore(name, wk) { let b = 0; for (const w of S.workouts) { if (w.day >= wk) continue; for (const e of w.exercises) if (e.n === name) for (const s of e.sets) if (s.done) b = Math.max(b, num(s.kg)); } return b; }

/* Jalons et célébrations */
let checking = false;
function checkGoals() {
  if (checking || (DEMO && !params.has('celebrate'))) return; checking = true; let changed = checkBadges();
  const wk = weekStart(dayKey());
  for (const g of S.goals) {
    if (g.done) continue; const st = gState(g), kind = GT[g.type].kind; g.ms = g.ms || []; g.wins = g.wins || [];
    if (kind === 'cum') {
      if (st.reached) { g.done = today(); changed = true; celebrate('🏆', 'Objectif atteint !', `${esc(gLabel(g))}. Bravo, tu l’as fait.`); continue; }
      const p = Math.floor(st.pct * 100), news = [25, 50, 75].filter(m => p >= m && !g.ms.includes(m));
      if (news.length) { g.ms.push(...news); changed = true; const m = Math.max(...news); celebrate(m >= 75 ? '🔥' : m >= 50 ? '💪' : '✨', `${m} % du chemin`, `${esc(gLabel(g))}. ${m >= 75 ? 'La ligne d’arrivée est proche.' : m >= 50 ? 'Mi-parcours, continue comme ça.' : 'Beau début, garde le rythme.'}`); }
    } else if (kind === 'week' && st.reached && !g.wins.includes(wk)) { g.wins.push(wk); changed = true; celebrate('✅', 'Semaine validée', `${esc(gLabel(g))} : c’est fait pour cette semaine.`); }
    else if (kind === 'limit') { const pw = addDays(wk, -7); if (g.created <= pw && !g.wins.includes(pw) && !g.fails?.includes(pw)) { const tot = Array.from({ length: 7 }, (_, i) => addDays(pw, i)).reduce((s, d) => s + consoDay(d)[g.t], 0); if (tot <= g.target) { g.wins.push(pw); celebrate('🌿', 'Semaine réussie', `Tu es resté sous ta limite : ${esc(gLabel(g).toLowerCase())}.`); } else { g.fails = [...(g.fails || []), pw]; } changed = true; } }
  }
  const minis = weekMinis().filter(m => !m.limit);
  if (minis.length >= 2 && minis.every(m => m.done) && !S.settings.seen['mini' + wk]) { S.settings.seen['mini' + wk] = 1; changed = true; celebrate('⭐', 'Tous tes mini-objectifs !', 'Semaine parfaite. Les petits pas font les grands résultats.'); }
  if (changed) save();
  checking = false;
}

/* Vue Objectifs */
let goalsView = 'goals', goalsFilter = 'all';
RENDER.goals = function () {
  const el = $('#s-goals');
  let h = tabHead('goals', 'Objectifs', 'Un pas après l’autre') + `<div class="seg"><button class="${goalsView === 'goals' ? 'on' : ''}" data-act="gview" data-v="goals">Objectifs</button><button class="${goalsView === 'troph' ? 'on' : ''}" data-act="gview" data-v="troph">Trophées</button><button class="${goalsView === 'suivi' ? 'on' : ''}" data-act="gview" data-v="suivi">Poids & bilan</button></div>`;
  h += goalsView === 'goals' ? goalsHtml() : goalsView === 'troph' ? trophiesHtml() : suiviHtml() + sleepWaterCard() + monthReviewCard() + measuresCard() + photosCard();
  el.innerHTML = h; animateIn(el); hydratePhotos(el);
};
function goalRow(g) {
  const st = gState(g), col = st.tone === 'bad' ? 'var(--bad)' : st.tone === 'warn' ? 'var(--warn)' : 'var(--acc)', lim = ['limit', 'limitm'].includes(GT[g.type].kind);
  return `<button class="goal tap cat-${GT[g.type].cat}" data-act="goal" data-id="${g.id}">${ring(lim ? Math.min(st.pct, 1) : st.pct, 1, fr(Math.min(st.pct, 9.99) * 100) + '%', '', { size: 54, stroke: 5, color: col, warnOver: false })}<div class="grow" style="min-width:0"><div class="gt">${esc(gLabel(g))}</div><div class="gs">${esc(st.txt)}</div><div class="gs" style="color:${st.tone === 'acc' ? 'var(--mut)' : col}">${esc(st.sub)}</div></div><span class="dim">${ICON.right}</span></button>`;
}
function goalsHtml() {
  const minis = weekMinis(), act = activeGoals().filter(g => goalsFilter === 'all' || GT[g.type].cat === goalsFilter), done = S.goals.filter(g => g.done);
  let h = '';
  if (!S.goals.length) return h + `<div class="card accent"><div class="eyebrow">Pour commencer</div><div class="hero"><div class="big">Fixe-toi tes premiers objectifs</div></div><p class="lead">Sport, nutrition et finances : l’appli suit tes progrès toute seule et estime quand tu y arriveras.</p><div class="grid2" style="margin-top:16px"><button class="btn pri" data-act="gsuggest">Suggestions</button><button class="btn" data-act="gnew">Créer</button></div></div>`;
  if (minis.length) { const ok = minis.filter(m => m.done && !m.limit).length, tot = minis.filter(m => !m.limit).length;
    h += `<div class="card"><div class="h-row" style="margin-bottom:4px"><h3>Cette semaine</h3><span class="badge ${ok === tot && tot ? 'acc' : ''}">${ok} / ${tot}</span></div>${minis.map(m => `<div class="mini ${m.done ? 'done' : ''}"><span class="ck">${ICON.check}</span><div class="grow"><div class="t">${esc(m.label)}</div>${m.limit ? `<div class="s">${m.txt || fr(m.cur, 1)} pour l’instant</div>` : m.txt ? `<div class="s">${esc(m.txt)}</div>` : m.target > 1 && !m.done ? `<div class="s">${fr(m.cur, 1)} / ${fr(m.target, 1)}</div>` : ''}</div></div>`).join('')}</div>`; }
  h += `<div class="chips">${[['all', 'Tous'], ...Object.entries(GCAT).map(([k, v]) => [k, v[0]])].map(([k, l]) => `<button class="chip ${goalsFilter === k ? 'on' : ''}" data-act="gfilter" data-v="${k}">${l}</button>`).join('')}</div>`;
  for (const [c, [cn, ci]] of Object.entries(GCAT)) {
    const list = act.filter(g => GT[g.type].cat === c); if (!list.length) continue;
    h += `<div class="card"><h3>${ci} ${cn}</h3>${list.map(goalRow).join('')}</div>`;
  }
  if (!act.length) h += `<div class="empty">Aucun objectif actif dans cette catégorie.</div>`;
  h += `<div class="grid2"><button class="btn pri" data-act="gnew">${ICON.plus} Nouvel objectif</button><button class="btn" data-act="gsuggest">Suggestions</button></div>`;
  if (done.length) h += `<div class="card"><h3>Objectifs atteints</h3><div class="list">${done.slice(-8).reverse().map(g => `<button class="item tap" data-act="goal" data-id="${g.id}"><span class="ico">🏆</span><div class="grow"><div class="t">${esc(gLabel(g))}</div><div class="s">Atteint le ${fmtDate(g.done, { day: 'numeric', month: 'long' })}</div></div></button>`).join('')}</div></div>`;
  return h;
}
function homeGoalsCard() {
  const act = activeGoals();
  if (!act.length) return `<div class="card"><div class="h-row" style="margin-bottom:8px"><h3>Mes objectifs</h3></div><p class="lead">Sport, nutrition, finances : fixe-toi 2 ou 3 objectifs, l’appli suit tout automatiquement.</p><button class="btn soft block" data-act="gsuggest" style="margin-top:14px">Voir les suggestions</button></div>`;
  const top = Object.keys(GCAT).map(c => act.filter(g => GT[g.type].cat === c).sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0))[0]).filter(Boolean);
  while (top.length < 3 && act.length > top.length) { const n = act.find(g => !top.includes(g)); if (!n) break; top.push(n); }
  const minis = weekMinis().filter(m => !m.limit), ok = minis.filter(m => m.done).length;
  return `<div class="card"><div class="h-row" style="margin-bottom:4px"><h3>Mes objectifs</h3><button class="link" data-act="goto" data-tab="goals">Tout voir</button></div>${top.map(g => { const st = gState(g), col = st.tone === 'bad' ? 'var(--bad)' : st.tone === 'warn' ? 'var(--warn)' : 'var(--cat)'; return `<button class="goal-mini tap cat-${GT[g.type].cat}" data-act="goal" data-id="${g.id}"><span class="ico cat">${GCAT[GT[g.type].cat][1]}</span><div style="min-width:0"><div class="gt">${esc(gLabel(g))}</div>${bar(Math.min(st.pct, 1) * 100, col, true)}</div><div class="pc">${fr(Math.min(st.pct, 9.99) * 100)}%<small>${st.eta ? '≈ ' + fmtDate(st.eta) : GT[g.type].kind === 'cum' ? '' : esc(st.txt.split(' ').slice(0, 3).join(' '))}</small></div></button>`; }).join('')}
  ${minis.length ? `<div class="sep" style="margin:10px 0 12px"></div><div class="bar-l"><b>Mini-objectifs de la semaine</b><span>${ok} / ${minis.length}</span></div>${bar(ok / minis.length * 100)}` : ''}</div>`;
}

/* Détail d'un objectif */
function goalSheet(id) {
  const g = S.goals.find(x => x.id === id); if (!g) return; const st = gState(g), kind = GT[g.type].kind, col = st.tone === 'bad' ? 'var(--bad)' : st.tone === 'warn' ? 'var(--warn)' : 'var(--acc)';
  let h = `<span class="badge">${GCAT[GT[g.type].cat][1]} ${GCAT[GT[g.type].cat][0]}</span><h2 style="margin-top:10px">${esc(gLabel(g))}</h2><p class="lead">${g.done ? `Atteint le ${fmtDate(g.done, { day: 'numeric', month: 'long', year: 'numeric' })}` : esc(st.sub)}</p>`;
  h += `<div class="ring-wrap" style="margin-bottom:16px">${ring(Math.min(st.pct, 1), 1, fr(Math.min(st.pct, 9.99) * 100) + '%', kind === 'cum' ? 'du chemin' : kind.startsWith('limit') ? 'de la limite' : 'de la cible', { size: 120, stroke: 10, color: col, warnOver: false })}<div class="grow"><div class="kv"><span>Actuel</span><b>${esc(st.txt.split(/ → | \/ /)[0])}</b></div>${kind === 'cum' && g.type !== 'epargne' ? `<div class="kv"><span>Départ</span><b>${fr(g.startVal ?? 0, 1)}</b></div>` : ''}<div class="kv"><span>Objectif</span><b>${g.type === 'epargne' || g.type === 'depenses' ? eur(g.target) : fr(g.target, 1)}</b></div>${g.deadline ? `<div class="kv"><span>Échéance</span><b>${fmtDate(g.deadline, { day: 'numeric', month: 'short', year: 'numeric' })}</b></div>` : ''}${st.eta ? `<div class="kv"><span>Estimation</span><b class="acc">${fmtDate(st.eta, { day: 'numeric', month: 'short', year: 'numeric' })}</b></div>` : ''}</div></div>`;
  if (kind === 'cum') {
    const pts = seriesFor(g).slice(-40), proj = st.eta && pts.length ? { x: parseYmd(st.eta).getTime(), y: g.target } : null;
    h += `<div class="card" style="padding:14px 12px 10px">${lineChart(pts, { unit: g.type === 'epargne' ? ' €' : g.type === 'reps' ? '' : ' kg', dec: g.type === 'epargne' || g.type === 'reps' ? 0 : 1, target: g.target, proj })}</div>`;
    const p = st.pct * 100; h += `<h3 style="margin-top:16px">Étapes</h3><div class="ms">${[25, 50, 75, 100].map(m => `<div class="${p >= m || g.done ? 'on' : ''}"><b>${m} %</b>${p >= m || g.done ? 'atteint' : g.type === 'epargne' ? eur(g.target * m / 100, 0) : fr((g.startVal ?? 0) + (g.target - (g.startVal ?? 0)) * m / 100, 1)}</div>`).join('')}</div>`;
    if ((g.type === 'reps' || g.type === 'charge') && !g.done) h += `<div class="card" style="margin-top:14px"><h3>Enregistrer un test</h3><div class="row"><div class="grow" style="position:relative"><input class="in" id="testIn" inputmode="decimal" placeholder="${g.type === 'reps' ? 'Nombre de reps' : 'Charge en kg'}"></div><button class="btn pri" data-act="gtest" data-id="${g.id}">Valider</button></div><p class="dim small" style="margin-top:8px">Fais une série maximale propre, puis note le résultat.</p></div>`;
    if (g.type === 'epargne' && !g.done) h += `<button class="btn soft block" data-act="saveAdd" data-g="${g.id}" style="margin-top:14px">${ICON.plus} Mettre de l’argent de côté</button>`;
  }
  h += `<div class="grid2" style="margin-top:18px"><button class="btn danger" data-act="gdel" data-id="${g.id}">${ICON.trash} Supprimer</button><button class="btn" data-act="gedit" data-id="${g.id}">${ICON.edit} Modifier</button></div>`;
  openSheet(h);
}

/* Création / modification */
function goalForm(edit, preset) {
  const g = edit ? { ...edit } : { cat: 'sport', type: 'reps', ex: 'Pompes', target: '', deadline: addDays(today(), 84), conso: true, ...preset };
  let cat = GT[g.type].cat;
  const field = () => {
    const t = g.type, T = targets();
    const dl = `<label class="f"><span>Échéance (facultatif)</span><input class="in" type="date" id="gfD" value="${esc(g.deadline || '')}"></label>`;
    if (t === 'reps') return `<label class="f"><span>Exercice</span><select class="in" id="gfEx">${REPS_EX().map(n => `<option ${n === g.ex ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label><label class="f"><span>Objectif (répétitions ou secondes d’affilée)</span><input class="in" id="gfT" inputmode="numeric" value="${esc(g.target)}" placeholder="ex. 50"></label>${dl}`;
    if (t === 'charge') return `<label class="f"><span>Exercice</span><select class="in" id="gfEx">${LOAD_EX().map(n => `<option ${n === g.ex ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label><label class="f"><span>Charge visée (kg)</span><input class="in" id="gfT" inputmode="decimal" value="${esc(g.target)}" placeholder="ex. 30"></label>${dl}`;
    if (t === 'seances') return `<label class="f"><span>Séances par semaine</span><input class="in" id="gfT" inputmode="numeric" value="${esc(g.target || 3)}"></label>`;
    if (t === 'poids') return `<label class="f"><span>Poids visé (kg) · actuel ${lastWeight() ? fr(lastWeight(), 1) + ' kg' : 'non renseigné'}</span><input class="in" id="gfT" inputmode="decimal" value="${esc(g.target)}" placeholder="ex. 78"></label>${dl}`;
    if (t === 'proteines') return `<label class="f"><span>Protéines par jour (g)${T ? ' · conseillé ' + T.p + ' g' : ''}</span><input class="in" id="gfT" inputmode="numeric" value="${esc(g.target || (T ? T.p : ''))}"></label>`;
    if (t === 'conso') return `<label class="f"><span>Produit</span><select class="in" id="gfC">${CONSO.map(c => `<option value="${c.id}" ${g.t === c.id ? 'selected' : ''}>${c.n}</option>`).join('')}</select></label><label class="f"><span>Maximum par semaine</span><input class="in" id="gfT" inputmode="decimal" value="${esc(g.target)}" placeholder="ex. 50"></label>`;
    if (t === 'epargne') return `<label class="f"><span>Pour quoi ? (facultatif)</span><input class="in" id="gfN" value="${esc(g.name || '')}" placeholder="ex. Vacances, fonds de secours"></label><label class="f"><span>Montant à épargner (€)</span><input class="in" id="gfT" inputmode="decimal" value="${esc(g.target)}" placeholder="ex. 500"></label>${dl}<button class="check ${g.conso !== false ? 'on' : ''}" id="gfCo" type="button"><span class="bx">${ICON.check}</span><span class="grow"><span class="t">Compter l’argent économisé sur la conso</span><span class="s" style="display:block">Ce que tu dépenses en moins par rapport à ta référence</span></span></button>`;
    if (t === 'depenses') return `<label class="f"><span>Catégorie</span><select class="in" id="gfC"><option value="all">Toutes les dépenses (budget global)</option>${FINCATS.map(c => `<option value="${c[0]}" ${g.c === c[0] ? 'selected' : ''}>${c[1]}</option>`).join('')}</select></label><label class="f"><span>Maximum par mois (€)</span><input class="in" id="gfT" inputmode="decimal" value="${esc(g.target || S.fin.budget || '')}"></label>`;
  };
  const draw = () => {
    $('#gfTypes').innerHTML = Object.entries(GT).filter(([, v]) => v.cat === cat).map(([k, v]) => `<button class="chip ${g.type === k ? 'on' : ''}" data-gt="${k}" type="button">${v.n}</button>`).join('');
    $('#gfBody').innerHTML = field();
    const co = $('#gfCo'); if (co) co.onclick = () => { g.conso = !(g.conso !== false); co.classList.toggle('on'); };
  };
  openSheet(`<h2>${edit ? 'Modifier l’objectif' : 'Nouvel objectif'}</h2><p class="lead">La progression se calcule toute seule à partir de ce que tu notes.</p><div class="form">${edit ? '' : `<div class="seg" id="gfCat">${Object.entries(GCAT).map(([k, v]) => `<button type="button" data-c="${k}" class="${cat === k ? 'on' : ''}">${v[0].split(' ')[0]}</button>`).join('')}</div><div class="chips wrap" id="gfTypes"></div>`}<div class="form" id="gfBody"></div><button class="btn pri block" id="gfOk">${edit ? 'Enregistrer' : 'Créer l’objectif'}</button></div>`);
  if (!edit) { $('#gfCat').onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; cat = b.dataset.c; $$('#gfCat button').forEach(x => x.classList.toggle('on', x === b)); g.type = Object.keys(GT).find(k => GT[k].cat === cat); draw(); }; $('#gfTypes').onclick = e => { const b = e.target.closest('[data-gt]'); if (!b) return; g.type = b.dataset.gt; draw(); }; draw(); }
  else $('#gfBody').innerHTML = field(), ($('#gfCo') && ($('#gfCo').onclick = () => { g.conso = !(g.conso !== false); $('#gfCo').classList.toggle('on'); }));
  $('#gfOk').onclick = () => {
    const tv = num($('#gfT') && $('#gfT').value); if (!(tv > 0) && g.type !== 'conso') return toast('Indique une valeur cible');
    const out = { ...g, target: tv, cat: GT[g.type].cat, deadline: $('#gfD') ? $('#gfD').value : '' };
    if ($('#gfEx')) out.ex = $('#gfEx').value; if ($('#gfC')) { if (g.type === 'conso') out.t = $('#gfC').value; else out.c = $('#gfC').value; } if ($('#gfN')) out.name = $('#gfN').value.trim();
    if (!edit) { out.id = uid(); out.created = today(); out.ms = []; out.wins = []; }
    if (!edit || edit.ex !== out.ex || edit.type !== out.type) out.startVal = out.type === 'poids' ? lastWeight() : out.type === 'reps' ? bestReps(out.ex) : out.type === 'charge' ? bestKg(out.ex) : 0;
    if (out.type === 'poids' && !out.startVal) return toast('Enregistre d’abord ton poids (onglet Objectifs › Poids)');
    if (out.type === 'depenses' && (out.c || 'all') === 'all') S.fin.budget = tv;
    if (edit) { out.ms = (out.ms || []).filter(m => m <= gState(out).pct * 100); S.goals = S.goals.map(x => x.id === edit.id ? out : x); } else S.goals.push(out);
    save(); closeSheet(); render(); toast(edit ? 'Objectif mis à jour' : 'Objectif créé');
  };
}
function suggestGoals() {
  const T = targets(), p = S.profile || {}, lw = lastWeight(), eq = equip(), lv = level(), out = [];
  out.push({ on: true, type: 'seances', target: 3, why: 'La régularité avant tout' });
  const pb = bestReps('Pompes'), pt = pb >= 40 ? 75 : lv === 'deb' && pb < 15 ? 20 : 50;
  out.push({ on: true, type: 'reps', ex: 'Pompes', target: pt, deadline: addDays(today(), 84), why: `Record actuel : ${pb || 'à tester'}` });
  if (eq.includes('barre')) out.push({ on: lv !== 'deb', type: 'reps', ex: 'Tractions', target: lv === 'deb' ? 5 : 10, deadline: addDays(today(), 112), why: 'Le roi des exercices du dos' });
  else out.push({ on: false, type: 'reps', ex: 'Squat poids du corps', target: 50, deadline: addDays(today(), 84), why: 'Jambes et cardio' });
  if (lw && p.goal === 'masse') out.push({ on: true, type: 'poids', target: Math.round((lw + 3) * 2) / 2, deadline: addDays(today(), 84), why: '+3 kg en 12 semaines, prise propre' });
  if (lw && p.goal === 'seche') out.push({ on: true, type: 'poids', target: Math.round((lw - 4) * 2) / 2, deadline: addDays(today(), 84), why: '−4 kg en 12 semaines, sans perdre de muscle' });
  if (T) out.push({ on: true, type: 'proteines', target: T.p, why: `${fr(T.p / num(p.weight), 1)} g par kg de poids de corps` });
  const lastW = Array.from({ length: 7 }, (_, i) => consoDay(addDays(dayKey(), -i)));
  for (const c of CONSO) { const tot = lastW.reduce((s, d) => s + d[c.id], 0); if (tot > 0) out.push({ on: c.id === 'cig', type: 'conso', t: c.id, target: Math.max(0, Math.round(tot * (c.step < 1 ? 7 : 0.8)) / (c.step < 1 ? 10 : 1)), why: `Semaine dernière : ${fr(tot, 1)} · −20 %` }); }
  out.push({ on: true, type: 'epargne', name: 'Fonds de secours', target: 300, deadline: addDays(today(), 91), conso: true, why: 'Avec l’argent économisé sur la conso' });
  out.push({ on: !!S.fin.budget, type: 'depenses', c: 'all', target: S.fin.budget || 1200, why: 'Garder le contrôle du mois' });
  return out.filter(s => !S.goals.some(g => !g.done && g.type === s.type && (s.ex ? g.ex === s.ex : true) && (s.t ? g.t === s.t : true)));
}
function suggestSheet(first) {
  const sug = suggestGoals();
  if (!sug.length) return toast('Tu as déjà tous les objectifs suggérés');
  openSheet(`<h2>${first ? 'Tes premiers objectifs' : 'Objectifs suggérés'}</h2><p class="lead">Adaptés à ton profil. Coche ceux qui te parlent, tu pourras les modifier ensuite.</p>${Object.entries(GCAT).map(([c, [cn, ci]]) => { const l = sug.map((s, i) => [s, i]).filter(([s]) => GT[s.type].cat === c); return l.length ? `<h3 style="margin-top:16px">${ci} ${cn}</h3><div class="list">${l.map(([s, i]) => `<button class="check ${s.on ? 'on' : ''}" data-sg="${i}" type="button"><span class="bx">${ICON.check}</span><span class="grow"><span class="t" style="display:block">${esc(gLabel(s))}</span><span class="s">${esc(s.why)}${s.deadline ? ' · d’ici le ' + fmtDate(s.deadline) : ''}</span></span></button>`).join('')}</div>` : ''; }).join('')}<div class="grid2" style="margin-top:18px"><button class="btn" data-act="close">Plus tard</button><button class="btn pri" id="sgOk">Ajouter</button></div>`);
  $('#sheetBody').onclick = e => { const b = e.target.closest('[data-sg]'); if (!b) return; sug[+b.dataset.sg].on = !sug[+b.dataset.sg].on; b.classList.toggle('on'); };
  $('#sgOk').onclick = () => { const pick = sug.filter(s => s.on); pick.forEach(({ on, why, ...s }) => { const g = { id: uid(), cat: GT[s.type].cat, created: today(), deadline: s.deadline || '', ms: [], wins: [], ...s }; g.startVal = g.type === 'poids' ? lastWeight() : g.type === 'reps' ? bestReps(g.ex) : g.type === 'charge' ? bestKg(g.ex) : 0; if (g.type === 'depenses') S.fin.budget = g.target; S.goals.push(g); }); S.settings.goalsSuggested = true; save(); $('#sheetBody').onclick = null; closeSheet(); render(); if (pick.length) toast(`${pick.length} ${plural(pick.length, 'objectif')} ajouté${pick.length > 1 ? 's' : ''}`); };
}

/* Poids & bilan (ancien Suivi) */
let wRange = 30, sumWeek = 0;
function suiviHtml() {
  const td = today(), lw = lastWeight(), from = wRange ? addDays(td, -wRange) : '0000';
  const pts = S.weights.filter(w => w.date >= from).map(w => ({ x: parseYmd(w.date).getTime(), y: w.kg })), d = pts.length > 1 ? pts[pts.length - 1].y - pts[0].y : 0;
  const wg = activeGoals().find(g => g.type === 'poids');
  let h = `<div class="card"><div class="h-row"><h3>Poids</h3><span class="badge">${pts.length > 1 ? (d > 0 ? '+' : d < 0 ? '−' : '') + fr(Math.abs(d), 1) + ' kg' : '—'}</span></div>
    <div class="row" style="margin:14px 0"><div class="grow" style="position:relative"><input class="in" id="wIn" inputmode="decimal" placeholder="${lw ? fr(lw, 1) : 'ex. 78,5'}" aria-label="Poids du jour" style="font-size:19px;font-weight:600;min-height:50px"><span style="position:absolute;right:14px;top:15px;color:var(--dim)">kg</span></div><button class="btn pri" data-act="addw" style="min-height:50px">Enregistrer</button></div>
    <div class="seg" style="margin-bottom:14px">${[[30, '30 jours'], [90, '90 jours'], [0, 'Tout']].map(([v, l]) => `<button data-act="wr" data-v="${v}" class="${wRange === v ? 'on' : ''}">${l}</button>`).join('')}</div>${lineChart(pts, { unit: ' kg', target: wg ? wg.target : null })}</div>`;
  const k = dayKey(), ws0 = addDays(weekStart(k), -7 * sumWeek), we = addDays(ws0, 6), T = targets(), days = Array.from({ length: 7 }, (_, i) => addDays(ws0, i));
  const wos = S.workouts.filter(w => w.day >= ws0 && w.day <= we), logged = days.filter(x => dayMeals(x).length);
  const avg = f => logged.length ? logged.reduce((s, x) => s + dayTotals(x)[f], 0) / logged.length : 0;
  const wIn = S.weights.filter(w => w.date >= ws0 && w.date <= we), wPrev = S.weights.filter(w => w.date < ws0);
  const wDelta = wIn.length && (wPrev.length || wIn.length > 1) ? wIn[wIn.length - 1].kg - (wPrev.length ? wPrev[wPrev.length - 1].kg : wIn[0].kg) : null;
  const spent = days.reduce((s, x) => s + S.fin.expenses.filter(e => e.date === x).reduce((a, e) => a + e.amount, 0) + consoCost(consoDay(x)), 0);
  const lbl = sumWeek === 0 ? 'Cette semaine' : sumWeek === 1 ? 'Semaine dernière' : `Il y a ${sumWeek} semaines`;
  h += `<div class="card"><div class="daynav" style="margin-bottom:16px"><button class="icon-btn" data-act="sw" data-d="1" aria-label="Semaine précédente">${ICON.left}</button><div class="dn">${lbl}<small>du ${fmtDate(ws0)} au ${fmtDate(we)}</small></div><button class="icon-btn" data-act="sw" data-d="-1" aria-label="Semaine suivante" ${sumWeek === 0 ? 'disabled' : ''}>${ICON.right}</button></div>
  <div class="grid3"><div class="stat"><div class="v">${wos.length}</div><div class="l">Séances</div></div><div class="stat"><div class="v">${fr(wos.reduce((s, w) => s + sessReps(w), 0))}</div><div class="l">Répétitions</div></div><div class="stat"><div class="v">${wDelta == null ? '—' : (wDelta > 0 ? '+' : wDelta < 0 ? '−' : '') + fr(Math.abs(wDelta), 1)}${wDelta == null ? '' : '<small>kg</small>'}</div><div class="l">Poids</div></div>
  <div class="stat"><div class="v">${logged.length ? fr(avg('kcal')) : '—'}</div><div class="l">kcal / jour</div></div><div class="stat"><div class="v">${logged.length ? fr(avg('p')) + '<small>g</small>' : '—'}</div><div class="l">Protéines / j</div></div><div class="stat"><div class="v">${eur(spent, 0)}</div><div class="l">Dépensé</div></div></div>
  <p class="dim small" style="margin:18px 2px 8px">Calories par jour${T ? ' · pointillés : objectif ' + fr(T.kcal) + ' kcal' : ''}</p>
  ${barChart(days.map(x => { const t = dayTotals(x); return { l: fmtDate(x, { weekday: 'short' }).slice(0, 3), hi: x === k, segs: [{ v: t.kcal - t.alc, c: 'var(--acc)' }, { v: t.alc, c: 'var(--c6)' }] }; }), { target: T ? T.kcal : null, unitFmt: v => v >= 1000 ? fr(v / 1000, 1) + 'k' : fr(v) })}
  ${days.some(x => dayTotals(x).alc) ? `<div class="legend"><span><i style="background:var(--acc)"></i>Repas</span><span><i style="background:var(--c6)"></i>Alcool</span></div>` : ''}
  ${T ? `<div class="sep"></div><p class="small" style="line-height:1.8">${weekVerdict(logged.length, avg('kcal'), avg('p'), T, wos.length)}</p>` : ''}</div>`;
  return h;
}
function weekVerdict(n, kcal, p, T, wo) {
  if (!n) return '<span class="mut">Note tes repas pour avoir un bilan nutrition.</span>';
  const out = [], dk = kcal - T.kcal;
  out.push(Math.abs(dk) <= T.kcal * 0.07 ? '✓ Calories dans la cible.' : dk > 0 ? `• ${fr(dk)} kcal par jour au-dessus de la cible.` : `• ${fr(-dk)} kcal par jour sous la cible.`);
  out.push(p >= T.p * 0.9 ? '✓ Protéines au bon niveau.' : `• Il manque environ ${fr(T.p - p)} g de protéines par jour.`);
  out.push(wo >= 3 ? '✓ Bonne régularité à l’entraînement.' : wo ? `• ${wo} ${plural(wo, 'séance')} : vise 3.` : '• Aucune séance cette semaine.');
  return out.join('<br>');
}
Object.assign(ACT, {
  gview: d => { goalsView = d.v; RENDER.goals(); },
  gfilter: d => { goalsFilter = d.v; RENDER.goals(); },
  goal: d => goalSheet(d.id),
  gnew: () => goalForm(),
  gedit: d => goalForm(S.goals.find(g => g.id === d.id)),
  gdel: d => { closeSheet(); undoable('Objectif supprimé', () => { S.goals = S.goals.filter(g => g.id !== d.id); }); },
  gsuggest: () => suggestSheet(),
  gtest: d => { const g = S.goals.find(x => x.id === d.id), v = num($('#testIn').value); if (!(v > 0)) return toast('Indique un résultat'); const t = Date.now(); S.workouts.push({ id: uid(), start: t, end: t, day: dayKey(t), name: `Test · ${g.ex}`, prog: null, di: -1, exercises: [{ n: g.ex, u: exUnit(g.ex), w: g.type === 'charge', rest: 0, sets: [g.type === 'reps' ? { r: v, kg: '', done: true } : { r: 1, kg: v, done: true }] }], prs: [] }); save(); closeSheet(); render(); toast('Test enregistré'); },
  addw: () => { const v = num($('#wIn').value); if (v < 25 || v > 300) return toast('Entre un poids valide'); const t = today(); S.weights = S.weights.filter(w => w.date !== t); S.weights.push({ date: t, kg: Math.round(v * 10) / 10 }); S.weights.sort((a, b) => a.date.localeCompare(b.date)); if (S.profile) S.profile.weight = v; save(); render(); toast('Poids enregistré'); },
  wr: d => { wRange = num(d.v); RENDER.goals(); },
  sw: d => { sumWeek = Math.max(0, sumWeek + num(d.d)); RENDER.goals(); }
});
