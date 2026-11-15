'use strict';
/* ===================== FORME : eau, sommeil, check-in, score, séries, badges, rappels ===================== */
const GLASS = 250;
const waterTarget = () => clamp(Math.round((lastWeight() || 75) * 35 / GLASS), 6, 14);
const waterOf = k => S.water[k] || 0;
function addWater(n) { const k = dayKey(), v = Math.max(0, waterOf(k) + n); S.water[k] = v; save(); buzz(8); const T = waterTarget(); if (n > 0 && v === T) toast('Objectif d’hydratation atteint 💧'); }
const hm = s => { const [h, m] = String(s || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
const fmtH = h => { const H = Math.floor(h), M = Math.round((h - H) * 60); return M ? `${H} h ${pad(M)}` : `${H} h`; };
const sleepOf = k => S.sleep.filter(s => s.day === k).reduce((a, s) => a + s.h, 0) || null;
function lastSleep() { return S.sleep.length ? S.sleep[S.sleep.length - 1] : null; }

/* Score de forme 0–100 */
function formeScore(k = dayKey()) {
  const T = targets(), parts = [];
  const sl = sleepOf(k) ?? sleepOf(addDays(k, -1));
  if (sl != null) parts.push(['Sommeil', 35 * Math.min(1, (sl / 7) ** 1.4), 35, sl < 6 ? `${fmtH(sl)} : vise 7 h` : `${fmtH(sl)} dormi`]);
  const recent = S.workouts.filter(w => w.day >= addDays(k, -2) && w.day <= k).length, last = S.workouts.length ? S.workouts[S.workouts.length - 1].day : null, since = last ? daysBetween(last, k) : 99;
  parts.push(['Entraînement', recent ? 20 : since <= 3 ? 13 : 5, 20, recent ? 'séance récente' : since < 99 ? `dernière séance il y a ${since} j` : 'aucune séance']);
  let pk = k; if (!dayMeals(k).length && k === dayKey()) pk = addDays(k, -1);
  const p = dayTotals(pk).p, pr = T ? Math.min(1, p / T.p) : (p ? 0.7 : 0), wr = Math.min(1, waterOf(k) / waterTarget());
  parts.push(['Nutrition & eau', 15 * pr + 10 * wr, 25, `${fr(p)} g prot. · ${waterOf(k)}/${waterTarget()} verres`]);
  const c = consoDay(k), c2 = consoDay(addDays(k, -1)), pen = (x => x.cig * 0.6 + x.joint * 3 + x.biere * 2 + x.coke * 12);
  const pn = pen(c) + pen(c2) * 0.4;
  parts.push(['Conso', Math.max(0, 20 - pn), 20, pn < 1 ? 'rien ou presque' : CONSO.filter(x => c[x.id]).map(x => fr(c[x.id], 1) + ' ' + x.u).join(', ') || 'hier']);
  const got = parts.reduce((s, x) => s + x[1], 0), max = parts.reduce((s, x) => s + x[2], 0);
  const ci = S.checkin[k]; let score = Math.round(got / max * 100);
  if (ci && ci.fat >= 4) score = Math.max(0, score - (ci.fat - 3) * 4);
  return { score, parts, hasSleep: sl != null };
}
const formeLabel = s => s >= 80 ? 'Excellente' : s >= 65 ? 'Bonne' : s >= 45 ? 'Moyenne' : 'À recharger';
const formeColor = s => s >= 65 ? 'var(--acc)' : s >= 45 ? 'var(--warn)' : 'var(--bad)';

/* Check-in « Retour de tournée » */
const MOODS = ['😫', '😕', '😐', '🙂', '😄'];
function checkinVisible() { const h = new Date().getHours(), k = dayKey(); return (params.has('checkin') || (h >= 5 && h < 14)) && !(S.checkin[k] && S.checkin[k].closed); }
function sessionAdvice(ci) {
  const sl = sleepOf(dayKey()) ?? sleepOf(addDays(dayKey(), -1)), fat = ci && ci.fat, mood = ci && ci.mood;
  const nw = S.profile ? nextWorkout() : null;
  if (fat >= 4 || (sl != null && sl < 5)) return { t: 'Repos aujourd’hui', s: 'Fatigue élevée : dors d’abord. Si tu veux bouger, 10 min d’étirements après le réveil.', btn: null };
  if (fat === 3 || (mood && mood <= 2)) return { t: 'Express 20 min', s: 'Circuit court et modéré : tu entretiens sans t’épuiser, et tu dors bien après.', btn: ['h-express', 0] };
  if (nw) return { t: nw.d.n + ' · ' + nw.p.name, s: `${nw.list.length} exercices · ${exNames(nw.list)}. Idéal après ton réveil, avant le service.`, btn: [nw.p.id, nw.di] };
  return { t: 'Express 20 min', s: 'Une petite séance pour démarrer.', btn: ['h-express', 0] };
}
function sleepPlan() {
  const now = new Date(), b = new Date(now.getTime() + 30 * 60e3); b.setMinutes(Math.ceil(b.getMinutes() / 15) * 15, 0, 0);
  const w = new Date(b.getTime() + 7.5 * 36e5), f = d => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return { bed: f(b), wake: f(w) };
}
function checkinCard() {
  const k = dayKey(), ci = S.checkin[k] || {}, adv = sessionAdvice(ci), sp = sleepPlan(), T = targets(), tot = dayTotals(k);
  const kLeft = T ? Math.max(0, T.kcal - tot.kcal) : 0, pLeft = T ? Math.max(0, T.p - tot.p) : 0, rec = suggestRecipe(kLeft, pLeft);
  return `<div class="card checkin"><div class="h-row"><div><div class="eyebrow">Retour de tournée</div><h3 style="margin:2px 0 0;font-size:19px;color:var(--txt)">Bien rentré ? 🌅</h3></div><button class="x-btn" data-act="ciClose" aria-label="Masquer">${ICON.x}</button></div>
  <div class="ci-row"><span>Humeur</span><div class="moods">${MOODS.map((m, i) => `<button class="${ci.mood === i + 1 ? 'on' : ''}" data-act="ci" data-f="mood" data-v="${i + 1}" aria-label="Humeur ${i + 1}">${m}</button>`).join('')}</div></div>
  <div class="ci-row"><span>Fatigue</span><div class="moods num">${[1, 2, 3, 4, 5].map(i => `<button class="${ci.fat === i ? 'on' : ''}" data-act="ci" data-f="fat" data-v="${i}" aria-label="Fatigue ${i}">${i}</button>`).join('')}</div></div>
  <div class="ci-box"><span class="ico">😴</span><div class="grow"><b>Au lit vers ${sp.bed}, lever ${sp.wake}</b><span>7 h 30 = 5 cycles. Volets fermés, téléphone loin, pas de café.</span></div></div>
  <div class="ci-box"><span class="ico">${adv.btn ? '🏋️' : '🛌'}</span><div class="grow"><b>${esc(adv.t)}</b><span>${esc(adv.s)}</span></div>${adv.btn ? `<button class="btn sm pri" data-act="start" data-p="${adv.btn[0]}" data-d="${adv.btn[1]}">${ICON.play}</button>` : ''}</div>
  ${T ? `<button class="ci-box tap" data-act="recipe" data-id="${rec[0]}" style="width:100%;text-align:left"><span class="ico">${rec[2]}</span><div class="grow"><b>Reste ${fr(kLeft)} kcal · ${fr(pLeft)} g de protéines</b><span>Idée avant de dormir : ${esc(rec[1].toLowerCase())}</span></div><span class="dim">${ICON.right}</span></button>` : ''}
  </div>`;
}

/* Carte forme (accueil) */
function formeCard() {
  const k = dayKey(), F = formeScore(k), wt = waterTarget(), w = waterOf(k), sl = sleepOf(k);
  const days = Array.from({ length: 7 }, (_, i) => addDays(k, i - 6)), sc = days.map(d => formeScore(d).score), avg = Math.round(sc.slice(0, 6).reduce((a, b) => a + b, 0) / 6), dlt = F.score - avg;
  return `<div class="card"><div class="h-row" style="margin-bottom:12px"><h3>Ma forme</h3><span class="badge ${dlt >= 0 ? 'acc' : 'warn'}">${dlt >= 0 ? ICON.up : ICON.down}${Math.abs(dlt)} pts vs 7 j</span></div>
  <div class="ring-wrap">${ring(F.score, 100, F.score, formeLabel(F.score), { size: 112, stroke: 9, color: formeColor(F.score), warnOver: false })}<div class="macros">${F.parts.map(p => `<div><div class="bar-l"><b>${p[0]}</b><span>${fr(p[1])}/${p[2]}</span></div>${bar(p[1] / p[2] * 100, p[1] / p[2] >= 0.7 ? 'var(--acc)' : p[1] / p[2] >= 0.45 ? 'var(--warn)' : 'var(--bad)', true)}</div>`).join('')}</div></div>
  <div class="spark">${sc.map((v, i) => `<div class="${i === 6 ? 'cur' : ''}"><i style="height:${Math.max(6, v)}%;background:${formeColor(v)}"></i><span>${fmtDate(days[i], { weekday: 'short' }).slice(0, 1).toUpperCase()}</span></div>`).join('')}</div>
  ${F.hasSleep ? '' : `<p class="dim small" style="margin:6px 0 0">Note ton sommeil pour un score complet.</p>`}
  <div class="grid2" style="margin-top:14px"><div class="water"><button data-act="water" data-d="-1" aria-label="Retirer un verre">−</button><div class="wv"><b>💧 ${w}<small>/${wt}</small></b><span>verres d’eau</span></div><button class="plus" data-act="water" data-d="1" aria-label="Ajouter un verre">+</button></div>
  <button class="water tap" data-act="sleepAdd" style="justify-content:center"><div class="wv"><b>😴 ${sl ? fmtH(sl) : '—'}</b><span>${sl ? 'sommeil noté' : 'noter mon sommeil'}</span></div></button></div></div>`;
}
function sleepSheet() {
  const ls = lastSleep();
  openSheet(`<h2>Mon sommeil</h2><p class="lead">Après la tournée, l’idéal : 7 h à 8 h d’affilée, toujours aux mêmes heures.</p><div class="form" style="margin-top:14px"><div class="grid2"><label class="f"><span>Couché à</span><input class="in" type="time" id="slB" value="${ls ? ls.bed : '08:00'}"></label><label class="f"><span>Levé à</span><input class="in" type="time" id="slW" value="${ls ? ls.wake : '15:00'}"></label></div><div class="stat" id="slH" style="text-align:center"></div>
  <label class="f"><span>Qualité</span><div class="moods" id="slQ">${MOODS.map((m, i) => `<button type="button" data-v="${i + 1}" class="${i === 3 ? 'on' : ''}">${m}</button>`).join('')}</div></label>
  <button class="check" id="slNap" type="button"><span class="bx">${ICON.check}</span><span class="grow"><span class="t">C’est une sieste (s’ajoute au sommeil du jour)</span></span></button>
  <button class="btn pri block" id="slOk">Enregistrer</button></div>`);
  let q = 4, nap = false; const calc = () => { let d = hm($('#slW').value) - hm($('#slB').value); if (d <= 0) d += 1440; return Math.round(d / 6) / 10; };
  const show = () => { const h = calc(); $('#slH').innerHTML = `<div class="v" style="color:${h >= 7 ? 'var(--acc)' : h >= 5.5 ? 'var(--warn)' : 'var(--bad)'}">${fmtH(h)}</div><div class="l">${h >= 7 ? 'Super, c’est l’idéal' : h >= 5.5 ? 'Un peu court : une sieste avant le service aidera' : 'Trop court : la récup et la muscu en pâtissent'}</div>`; };
  ['slB', 'slW'].forEach(i => $('#' + i).addEventListener('input', show)); show();
  $('#slQ').onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; q = +b.dataset.v; $$('#slQ button').forEach(x => x.classList.toggle('on', x === b)); };
  $('#slNap').onclick = e => { nap = !nap; e.currentTarget.classList.toggle('on', nap); };
  $('#slOk').onclick = () => { const k = dayKey(); if (!nap) S.sleep = S.sleep.filter(s => s.day !== k || s.nap); S.sleep.push({ id: uid(), day: k, bed: $('#slB').value, wake: $('#slW').value, h: calc(), q, nap }); save(); closeSheet(); render(); toast('Sommeil enregistré'); };
}

/* Séries & badges */
function loggedDay(k) { return dayMeals(k).length || S.workouts.some(w => w.day === k) || S.weights.some(w => w.date === k) || S.conso.some(c => c.day === k) || waterOf(k) || S.sleep.some(s => s.day === k); }
function dayStreak(test) { let k = dayKey(), n = 0; if (!test(k)) k = addDays(k, -1); while (test(k) && n < 1000) { n++; k = addDays(k, -1); } return n; }
function streaks() {
  const T = targets();
  const wkOk = w => S.workouts.filter(x => x.day >= w && x.day <= addDays(w, 6)).length >= 2;
  let w = weekStart(dayKey()), sw = 0; if (!wkOk(w)) w = addDays(w, -7); while (wkOk(w) && sw < 200) { sw++; w = addDays(w, -7); }
  return {
    log: dayStreak(loggedDay), prot: T ? dayStreak(k => dayTotals(k).p >= T.p * 0.9) : 0, water: dayStreak(k => waterOf(k) >= waterTarget()),
    sleep: dayStreak(k => (sleepOf(k) || 0) >= 7), weeks: sw,
    without: CONSO.filter(c => S.conso.some(e => e.t === c.id)).map(c => [c, daysWithout(c.id)])
  };
}
let _stC = null; const ST = () => _stC || (_stC = streaks());
const totalSaved = () => S.fin.savings.reduce((s, x) => s + x.amount, 0) + consoSavingsBetween('0000-00-00', today());
const BADGES = [
  ['s1', '🏁', 'Premier pas', 'Ta première séance', () => S.workouts.length >= 1],
  ['s10', '💪', 'Régulier', '10 séances', () => S.workouts.length >= 10],
  ['s50', '🦾', 'Machine', '50 séances', () => S.workouts.length >= 50],
  ['pr', '📈', 'Record battu', 'Un record personnel', () => S.workouts.some(w => w.prs && w.prs.length)],
  ['lvl', '🧗', 'Niveau supérieur', 'Une variante plus dure débloquée', () => Object.keys(S.fam || {}).length > 0],
  ['wk4', '📅', 'Un mois carré', '4 semaines d’affilée à 2 séances ou plus', () => ST().weeks >= 4],
  ['log7', '📝', 'Assidu', '7 jours de suivi d’affilée', () => ST().log >= 7],
  ['log30', '🗓️', 'Discipline', '30 jours de suivi d’affilée', () => ST().log >= 30],
  ['prot7', '🥩', 'Protéines au top', '7 jours d’affilée dans la cible', () => ST().prot >= 7],
  ['water7', '💧', 'Bien hydraté', '7 jours d’affilée à l’objectif d’eau', () => ST().water >= 7],
  ['sleep5', '😴', 'Gros dormeur', '5 jours d’affilée à 7 h de sommeil', () => ST().sleep >= 5],
  ['goal1', '🎯', 'Objectif atteint', 'Ton premier objectif réussi', () => S.goals.some(g => g.done)],
  ['goal3', '🏆', 'Triple', '3 objectifs atteints', () => S.goals.filter(g => g.done).length >= 3],
  ['save100', '🐷', 'Tirelire', '100 € mis de côté', () => totalSaved() >= 100],
  ['save500', '💰', 'Bas de laine', '500 € mis de côté', () => totalSaved() >= 500],
  ['limit', '🌿', 'Sous contrôle', 'Une semaine sous ta limite de conso', () => S.goals.some(g => g.type === 'conso' && g.wins && g.wins.length)],
  ['free7', '🚭', 'Une semaine sans', '7 jours sans une conso que tu notais', () => ST().without.some(([, d]) => d >= 7)],
  ['meas', '📏', 'Mesuré', 'Tes premières mensurations', () => S.measures.length >= 1],
  ['photo', '📸', 'Avant / après', 'Ta première photo de progression', () => S.photos.length >= 1]
];
function checkBadges() {
  _stC = null; let n = 0; const first = !S.settings.badgesInit;
  for (const [id, em, t, d, test] of BADGES) { if (S.badges[id]) continue; let ok = false; try { ok = test(); } catch {} if (ok) { S.badges[id] = today(); n++; if (!first) celebrate(em, 'Badge débloqué : ' + t, esc(d) + '.'); } }
  if (first) { S.settings.badgesInit = true; n++; }
  return n > 0;
}
function trophiesHtml() {
  const st = streaks(), got = BADGES.filter(b => S.badges[b[0]]).length;
  const tile = (em, v, l, on) => `<div class="stat ${on ? '' : 'off'}"><div class="v">${em} ${v}</div><div class="l">${l}</div></div>`;
  let h = `<div class="card"><h3>Mes séries en cours</h3><div class="grid2">${tile('📝', st.log, 'jours de suivi', st.log)}${tile('🏋️', st.weeks, 'semaines actives', st.weeks)}${tile('🥩', st.prot, 'jours protéines OK', st.prot)}${tile('💧', st.water, 'jours bien hydraté', st.water)}${tile('😴', st.sleep, 'nuits de 7 h', st.sleep)}${st.without.map(([c, d]) => tile(c.i, d, 'jours sans ' + c.n.toLowerCase(), d)).join('')}</div><p class="dim small" style="margin-top:10px">Une série continue tant que tu fais la chose chaque jour (ou 2 séances par semaine pour le sport).</p></div>`;
  h += `<div class="card"><div class="h-row" style="margin-bottom:12px"><h3>Badges</h3><span class="badge acc">${got} / ${BADGES.length}</span></div><div class="badges">${BADGES.map(([id, em, t, d]) => `<div class="bdg ${S.badges[id] ? 'on' : ''}"><span class="be">${S.badges[id] ? em : '🔒'}</span><b>${t}</b><span>${S.badges[id] ? fmtDate(S.badges[id]) : d}</span></div>`).join('')}</div></div>`;
  return h;
}

/* Rappels : notifications locales si possible, sinon dans l'appli */
const notifOK = () => 'Notification' in window && Notification.permission === 'granted';
const DAYS_FR = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
function dueReminders() {
  const R = S.settings.rem, now = new Date(), H = now.getHours() + now.getMinutes() / 60, k = dayKey(), out = [];
  if (R.session && H >= num(R.session) && H < num(R.session) + 6 && !S.workouts.some(w => w.day === k) && !S.active) out.push(['session', '🏋️', 'C’est l’heure de ta séance', 'Même 20 min comptent.', 'sport']);
  if (R.water && H >= 15 || R.water && H < 5) { const wt = waterTarget(), w = waterOf(k), exp = Math.min(wt, Math.round(wt * (((H + 24 - 15) % 24) / 14))); if (w < exp - 1) out.push(['water', '💧', 'Pense à boire', `${w}/${wt} verres aujourd’hui`, 'home']); }
  if (R.weigh !== '' && R.weigh != null && now.getDay() === num(R.weigh) && H >= 14 && !S.weights.some(w => w.date === today())) out.push(['weigh', '⚖️', 'Pesée de la semaine', 'Au réveil, avant de manger.', 'goals']);
  return out;
}
function fireReminders() {
  if (DEMO) return; const k = dayKey(), F = S.settings.remFired; let ch = false;
  for (const [id, , t, b] of dueReminders()) {
    const key = id + (id === 'water' ? Math.floor(new Date().getHours() / 3) : ''); if (F[key] === k) continue; F[key] = k; ch = true;
    if (notifOK() && document.hidden && navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(r => r.showNotification(t, { body: b, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: id })).catch(() => {});
  }
  if (ch) save();
}
setInterval(fireReminders, 60e3); document.addEventListener('visibilitychange', fireReminders);
function remindersHtml() {
  const R = S.settings.rem, sup = 'Notification' in window, perm = sup ? Notification.permission : 'denied';
  return `<div class="card"><h3>Rappels</h3><div class="form">
  <label class="f"><span>Séance du jour</span><select class="in" id="remS"><option value="">Désactivé</option>${[14, 15, 16, 17, 18, 19, 20, 21, 22].map(h => `<option value="${h}" ${String(R.session) === String(h) ? 'selected' : ''}>à ${h} h</option>`).join('')}</select></label>
  <label class="f"><span>Pesée hebdomadaire</span><select class="in" id="remW"><option value="">Désactivé</option>${[1, 2, 3, 4, 5, 6, 0].map(d => `<option value="${d}" ${String(R.weigh) === String(d) ? 'selected' : ''}>le ${DAYS_FR[d].replace('.', '')}</option>`).join('')}</select></label>
  <button class="check ${R.water ? 'on' : ''}" type="button" id="remE"><span class="bx">${ICON.check}</span><span class="grow"><span class="t" style="display:block">Rappels pour boire</span><span class="s">Quand tu es en retard sur ton objectif d’eau</span></span></button>
  ${sup && perm === 'default' ? `<button class="btn soft block" data-act="notifAsk">Autoriser les notifications</button>` : ''}
  <p class="dim small">${perm === 'granted' ? 'Notifications activées.' : 'Sans notifications, les rappels s’affichent sur l’accueil.'} Le téléphone peut mettre l’appli en veille : les rappels arrivent alors à l’ouverture.</p></div></div>`;
}
function bindReminders() {
  const R = S.settings.rem;
  $('#remS').onchange = e => { R.session = e.target.value; save(); toast('Rappel enregistré'); };
  $('#remW').onchange = e => { R.weigh = e.target.value; save(); toast('Rappel enregistré'); };
  $('#remE').onclick = e => { R.water = !R.water; e.currentTarget.classList.toggle('on', R.water); save(); };
}
function reminderChips() {
  const due = dueReminders().filter(r => !S.settings.seen['rem' + r[0] + dayKey()]); if (!due.length) return '';
  return `<div class="rems">${due.map(([id, em, t, b, tab]) => `<div class="rem"><button class="grow tap" data-act="goto" data-tab="${tab}" style="text-align:left;min-width:0"><b>${em} ${esc(t)}</b><span>${esc(b)}</span></button><button class="x-btn" data-act="remHide" data-id="${id}" aria-label="Masquer">${ICON.x}</button></div>`).join('')}</div>`;
}
Object.assign(ACT, {
  water: d => { addWater(num(d.d)); render(); },
  sleepAdd: () => sleepSheet(),
  ci: d => { const k = dayKey(); S.checkin[k] = { ...(S.checkin[k] || {}), [d.f]: num(d.v), ts: Date.now() }; save(); render(); },
  ciClose: () => { const k = dayKey(); S.checkin[k] = { ...(S.checkin[k] || {}), closed: true }; save(); render(); toast('À demain matin 🌅', 4000, { label: 'Annuler', fn: () => { S.checkin[k].closed = false; save(); render(); } }); },
  remHide: d => { S.settings.seen['rem' + d.id + dayKey()] = 1; save(); render(); },
  notifAsk: async () => { try { const p = await Notification.requestPermission(); toast(p === 'granted' ? 'Notifications activées' : 'Notifications refusées : rappels dans l’appli'); settingsSheet(false); } catch { toast('Notifications indisponibles'); } }
});
