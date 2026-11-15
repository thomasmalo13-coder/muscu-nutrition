'use strict';
/* ===================== SPORT ===================== */
const equip = () => (S.profile && S.profile.equip) || [];
const level = () => (S.profile && S.profile.level) || 'inter';
const levelIdx = () => ({ deb: 0, inter: 1, avance: 2 })[level()];
function famIdx(f) { const F = FAMS[f]; let i = S.fam[f] ?? F.start[levelIdx()]; return clamp(i, 0, F.list.length - 1); }
function famVariant(f, i = famIdx(f)) { const L = FAMS[f].list; while (i > 0 && !hasEq(L[i], equip())) i--; return hasEq(L[i], equip()) ? L[i] : null; }
const exUnit = n => (EX[n] && EX[n].u) || 'reps';
const exWeighted = n => EX[n] ? !!EX[n].w : true; // exercices de salle : avec charge
const exInfo = n => EX[n] || { p: 'arms', r: 10, top: 12, w: true, cue: ['Mouvement contrôlé, amplitude complète.', 'Garde le dos neutre et le gainage serré.', 'Augmente la charge quand tu fais toutes tes reps proprement.'] };
function resolveSlot(sl) {
  const eq = equip();
  if (sl.fixed && hasEq(sl.fixed, eq)) return sl.fixed;
  if (sl.pick && famVariant(sl.pick) && hasEq(famVariant(sl.pick), eq) && EX[famVariant(sl.pick)].eq) return famVariant(sl.pick);
  for (const o of sl.o || []) if (EX[o] && hasEq(o, eq)) return o;
  if (sl.f) return famVariant(sl.f);
  return null;
}
function buildDay(p, di) {
  const cfg = LEVEL_CFG[level()], d = p.days[di];
  if (d.ex) return d.ex.map(([n, sets, r, rest, u]) => ({ n, sets, r, rest, u: u || 'reps', w: u !== 'sec' }));
  return d.s.map(sl => resolveSlot(sl)).filter(Boolean).filter((n, i, a) => a.indexOf(n) === i).map(n => {
    const x = EX[n]; return { n, sets: p.circuit ? 1 : (x.p === 'cardio' ? 2 : cfg.sets), r: x.r, rest: p.circuit ? 30 : (x.w ? cfg.rest + 15 : cfg.rest), u: x.u || 'reps', w: !!x.w, test: false };
  });
}
const progById = id => ALL_PROGS().find(p => p.id === id);
function nextWorkout() { const p = progById(S.settings.lastProg) || HOME[0]; const di = (S.settings.lastDay + 1) % p.days.length; return { p, di, d: p.days[di], list: buildDay(p, di) }; }
const exNames = list => list.slice(0, 3).map(e => e.n.replace(/ \(.+\)$/, '')).join(' · ');

const e1rm = (kg, r) => kg > 0 ? kg * (1 + Math.min(r, 15) / 30) : 0;
function sessVolume(w) { let v = 0; for (const e of w.exercises) for (const s of e.sets) if (s.done && e.u !== 'sec') v += num(s.r) * (num(s.kg) || 0); return v; }
const sessReps = w => w.exercises.reduce((a, e) => a + (e.u === 'sec' ? 0 : e.sets.filter(s => s.done).reduce((b, s) => b + num(s.r), 0)), 0);
function exHistory(name) {
  const out = [];
  for (const w of S.workouts) for (const e of w.exercises) {
    if (e.n !== name) continue; const done = e.sets.filter(s => s.done); if (!done.length) continue;
    let best = 0, maxKg = 0, maxR = 0, vol = 0;
    for (const s of done) { const r = num(s.r), kg = num(s.kg); best = Math.max(best, e1rm(kg, r)); maxKg = Math.max(maxKg, kg); maxR = Math.max(maxR, r); vol += r * kg; }
    out.push({ t: w.start, day: w.day, best, maxKg, maxR, vol, u: e.u, sets: done });
  }
  return out.sort((a, b) => a.t - b.t);
}
function lastSetsFor(name) { for (let i = S.workouts.length - 1; i >= 0; i--) { const e = S.workouts[i].exercises.find(x => x.n === name); if (e && e.sets.some(s => s.done)) return e.sets.filter(s => s.done); } return null; }
function newSet(name, i, r) { const last = lastSetsFor(name), ls = last && (last[i] || last[last.length - 1]); return { r: ls ? ls.r : r, kg: ls ? ls.kg : '', done: false }; }
const fmtSet = (s, e) => `${s.r}${e.u === 'sec' ? ' s' : ''}${num(s.kg) ? ' × ' + fr(num(s.kg), 1) + ' kg' : ''}`;

let progEx = null, showLevel = false;
RENDER.sport = function () {
  const el = $('#s-sport');
  if (S.active) return rSession(el);
  const nw = nextWorkout(), eq = equip();
  let h = `<h2>Sport maison</h2>`;
  h += `<div class="card accent hero"><div class="eyebrow">Prochaine séance · ${esc(nw.p.name)}</div><div class="big">${esc(nw.d.n)}</div><p class="lead">${nw.list.length} exercices · ${esc(exNames(nw.list))}</p><div class="actions"><button class="btn pri" data-act="start" data-p="${nw.p.id}" data-d="${nw.di}">${ICON.play} Démarrer</button><button class="btn" data-act="start" data-p="h-express" data-d="0">${ICON.clock} 20 min</button></div></div>`;
  h += `<div class="card"><div class="h-row" style="margin-bottom:12px"><h3>Mon niveau et mon matériel</h3><button class="link" data-act="equipEdit">Modifier</button></div><div class="seg" id="lvSeg">${LEVELS.map(([k, l]) => `<button data-act="setLevel" data-v="${k}" class="${level() === k ? 'on' : ''}">${l}</button>`).join('')}</div><div class="equip">${eq.length ? eq.map(k => `<span class="badge acc">${EQUIP.find(e => e[0] === k)[1]}</span>`).join('') : '<span class="badge">Sans matériel</span>'}</div><p class="dim small" style="margin-top:10px">Les exercices s’adaptent à ton matériel. Quand tu réussis toutes tes séries au palier, l’appli te passe à la variante plus dure.</p></div>`;
  h += `<div class="card"><h3>Programmes maison</h3>${HOME.map(p => progCard(p)).join('')}</div>`;
  h += progressCard();
  h += historyCard();
  h += `<details class="more"><summary>Programmes salle ${ICON.right}</summary><div class="inner">${GYM.map(p => progCard(p)).join('')}<button class="btn ghost block" data-act="free" style="margin-top:12px">Séance libre</button></div></details>`;
  el.innerHTML = h; animateIn(el);
  const sel = $('#progSel', el); if (sel) sel.onchange = () => { progEx = sel.value; RENDER.sport(); };
};
function progCard(p) {
  return `<div class="prog"><div class="ph"><div style="min-width:0"><div class="pn">${esc(p.name)}</div><div class="pd">${esc(p.freq)} · ${esc(p.desc)}</div></div>${S.settings.lastProg === p.id ? '<span class="badge acc">En cours</span>' : ''}</div><div class="days">${p.days.map((d, i) => { const l = buildDay(p, i); return `<button class="day" data-act="start" data-p="${p.id}" data-d="${i}"><b>${esc(d.n)}</b><span>${esc(exNames(l))}</span></button>`; }).join('')}</div></div>`;
}
function progressCard() {
  const done = [...new Set(S.workouts.flatMap(w => w.exercises.filter(e => e.sets.some(s => s.done)).map(e => e.n)))];
  if (!done.length) return '';
  if (!progEx || !done.includes(progEx)) { const cnt = {}; S.workouts.forEach(w => w.exercises.forEach(e => cnt[e.n] = (cnt[e.n] || 0) + 1)); progEx = [...done].sort((a, b) => (cnt[b] || 0) - (cnt[a] || 0))[0]; }
  const hst = exHistory(progEx), isT = hst.length && hst[hst.length - 1].u === 'sec', bw = hst.every(x => x.maxKg === 0);
  const pts = hst.map(x => ({ x: x.t, y: bw ? x.maxR : Math.round(x.best * 10) / 10 }));
  const bestE = Math.max(...hst.map(x => x.best)), bestKg = Math.max(...hst.map(x => x.maxKg)), bestR = Math.max(...hst.map(x => x.maxR)), totR = hst.reduce((s, x) => s + x.sets.reduce((a, b) => a + num(b.r), 0), 0);
  return `<div class="card"><div class="h-row" style="margin-bottom:12px"><h3>Progression</h3><span class="badge">${hst.length} séance${hst.length > 1 ? 's' : ''}</span></div>
    <select class="in" id="progSel" aria-label="Exercice">${[...done].sort((a, b) => a.localeCompare(b, 'fr')).map(n => `<option ${n === progEx ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
    <p class="dim small" style="margin:12px 2px 8px">${bw ? (isT ? 'Meilleur temps par séance (secondes)' : 'Meilleure série par séance (répétitions)') : 'Force estimée par séance (1RM, formule d’Epley)'}</p>
    ${lineChart(pts, { unit: bw ? (isT ? ' s' : '') : ' kg', dec: bw ? 0 : 1 })}
    <div class="grid3" style="margin-top:14px">${bw ? `<div class="stat"><div class="v acc">${fr(bestR)}${isT ? '<small>s</small>' : ''}</div><div class="l">Record</div></div><div class="stat"><div class="v">${fr(hst[hst.length - 1].maxR)}</div><div class="l">Dernière</div></div><div class="stat"><div class="v">${isT ? fr(totR / 60) + '<small>min</small>' : fr(totR)}</div><div class="l">${isT ? 'Total' : 'Total reps'}</div></div>` : `<div class="stat"><div class="v acc">${fr(bestKg, 1)}<small>kg</small></div><div class="l">Charge max</div></div><div class="stat"><div class="v">${fr(bestE, 1)}<small>kg</small></div><div class="l">1RM estimé</div></div><div class="stat"><div class="v">${fr(bestR)}</div><div class="l">Reps max</div></div>`}</div></div>`;
}
function historyCard() {
  const ws = [...S.workouts].reverse().slice(0, 6);
  return `<div class="card"><h3>Historique</h3>${ws.length ? `<div class="list">${ws.map(w => { const n = w.exercises.reduce((s, e) => s + e.sets.filter(x => x.done).length, 0), dur = w.end ? Math.round((w.end - w.start) / 6e4) : 0, vol = sessVolume(w), reps = sessReps(w); return `<button class="item tap" data-act="wview" data-id="${w.id}"><div class="grow"><div class="t">${esc(w.name.split(' · ')[0])} ${w.prs && w.prs.length ? `<span class="badge pr">Record</span>` : ''}</div><div class="s">${new Date(w.start).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · ${n} séries${dur ? ' · ' + dur + ' min' : ''}</div></div><div class="k">${vol > 0 ? fr(vol / 1000, 1) + ' t' : fr(reps) + ' reps'}</div></button>`; }).join('')}</div>` : `<div class="empty">Aucune séance pour l’instant. Lance la première !</div>`}</div>`;
}

/* Séance */
function startWorkout(pid, di) {
  const p = progById(pid);
  const exs = p ? buildDay(p, di).map(x => ({ n: x.n, rest: x.rest, u: x.u, w: x.w, sets: Array.from({ length: p.circuit ? LEVEL_CFG[level()].circ : x.sets }, (_, i) => newSet(x.n, i, x.r)) })) : [];
  S.active = { id: uid(), start: Date.now(), name: p ? `${p.days[di].n} · ${p.name}` : 'Séance libre', prog: pid || null, di: p ? di : -1, circuit: !!(p && p.circuit), exercises: exs };
  save(true); buzz(15);
  if (TAB !== 'sport') setTab('sport'); else { RENDER.sport(); window.scrollTo({ top: 0 }); }
  if (!p) addExerciseSheet();
}
function sessSummary() { const A = S.active, done = A.exercises.reduce((s, e) => s + e.sets.filter(x => x.done).length, 0), all = A.exercises.reduce((s, e) => s + e.sets.length, 0); return `<span id="sessClock">${clock(A.start)}</span> · ${done}/${all} séries`; }
function rSession(el) {
  const A = S.active;
  let h = `<div class="sess-top"><div><div class="n">${esc(A.name.split(' · ')[0])}</div><div class="s">${sessSummary()}</div></div><button class="btn sm pri" data-act="finish">Terminer</button></div>`;
  if (A.circuit) h += `<p class="lead" style="margin:12px 4px 0">Circuit : enchaîne les exercices, ${A.exercises[0] ? A.exercises[0].sets.length : 3} tours, 30 s de repos entre les exercices. Rythme modéré.</p>`;
  h += `<div>${A.exercises.map((e, ei) => exCard(e, ei)).join('')}</div>`;
  if (!A.exercises.length) h += `<div class="empty">Ajoute ton premier exercice.</div>`;
  h += `<div class="grid2"><button class="btn soft" data-act="addex">${ICON.plus} Exercice</button><button class="btn danger" data-act="cancel">Abandonner</button></div>`;
  el.innerHTML = h;
}
function exCard(e, ei) {
  const last = lastSetsFor(e.n), x = exInfo(e.n), unit = e.u === 'sec' ? 'secondes' : (x.unit || 'reps'), f = famOf(e.n);
  const lastTxt = (last ? 'Dernière fois : ' + last.map(s => fmtSet(s, e)).join(', ') : 'Première fois') + ` · palier ${x.top}${e.u === 'sec' ? ' s' : ''}`;
  let lad = '';
  if (f) { const L = FAMS[f].list, i = L.indexOf(e.n); const prev = L.slice(0, i).reverse().find(n => hasEq(n, equip())), next = L.slice(i + 1).find(n => hasEq(n, equip()));
    lad = `<div class="lad"><button class="btn sm ghost" data-act="swap" data-ei="${ei}" data-to="${esc(prev || '')}" ${prev ? '' : 'disabled style="opacity:.35"'}>${ICON.down} Plus facile</button><span class="lv">Niveau ${i + 1}/${L.length}</span><button class="btn sm ghost" data-act="swap" data-ei="${ei}" data-to="${esc(next || '')}" ${next ? '' : 'disabled style="opacity:.35"'}>Plus dur ${ICON.up}</button></div>`; }
  const bw = !e.w;
  return `<div class="ex" data-ei="${ei}"><div class="ex-h"><div style="min-width:0"><div class="n">${esc(e.n)}</div><div class="last">${esc(lastTxt)}</div></div><div class="acts"><button class="x-btn" data-act="cues" data-n="${esc(e.n)}" aria-label="Comment faire">${ICON.info}</button><button class="x-btn" data-act="delex" data-ei="${ei}" aria-label="Retirer">${ICON.trash}</button></div></div>${lad}
  <div class="set-head ${bw ? 'bw' : ''}"><span>#</span><span>${unit}</span>${bw ? '' : '<span>kg</span>'}<span></span></div>
  <div class="sets">${e.sets.map((s, si) => `<div class="set ${bw ? 'bw' : ''} ${s.done ? 'done' : ''}" data-ei="${ei}" data-si="${si}"><div class="no">${si + 1}</div><div class="cell"><input inputmode="numeric" value="${esc(s.r)}" data-f="r" aria-label="${unit}">${e.u === 'sec' ? '<em>s</em>' : bw ? '' : '<em>×</em>'}</div>${bw ? '' : `<div class="cell"><input inputmode="decimal" value="${esc(String(s.kg).replace('.', ','))}" data-f="kg" placeholder="—" aria-label="kg"><em>kg</em></div>`}<button class="ok" data-act="setok" aria-label="Série faite">${ICON.check}</button></div>`).join('')}</div>
  <div class="ex-f"><button class="btn sm ghost" data-act="addset" data-ei="${ei}">${ICON.plus} Série</button><button class="btn sm ghost" data-act="rmset" data-ei="${ei}">− Série</button></div></div>`;
}
const clock = t => { const s = Math.max(0, Math.floor((Date.now() - t) / 1000)); return `${Math.floor(s / 60)}:${pad(s % 60)}`; };
setInterval(() => { const c = $('#sessClock'); if (c && S.active) c.textContent = clock(S.active.start); }, 1000);
function bestBefore(name) { let b = 0, kg = 0, r = 0; for (const h of exHistory(name)) { b = Math.max(b, h.best); kg = Math.max(kg, h.maxKg); r = Math.max(r, h.maxR); } return { b, kg, r }; }
function toggleSet(ei, si) {
  const e = S.active.exercises[ei], s = e.sets[si]; s.done = !s.done; save();
  const row = $(`.set[data-ei="${ei}"][data-si="${si}"]`); if (row) row.classList.toggle('done', s.done);
  if (s.done) {
    buzz(12); startTimer(e.rest || 60);
    const kg = num(s.kg), r = num(s.r), pb = bestBefore(e.n), others = e.sets.filter((x, i) => x.done && i !== si);
    if (kg > 0 && pb.b > 0 && e1rm(kg, r) > Math.max(pb.b, ...others.map(x => e1rm(num(x.kg), num(x.r)))) + 0.01) toast(`Nouveau record : ${e.n}, ${fr(kg, 1)} kg × ${r}`);
    else if (!kg && pb.r > 0 && r > Math.max(pb.r, ...others.map(x => num(x.r)))) toast(`Nouveau record : ${r}${e.u === 'sec' ? ' s' : ''} en ${e.n}`);
  }
  const top = $('.sess-top .s'); if (top) top.innerHTML = sessSummary();
}
function finishWorkout() {
  const A = S.active;
  if (!A.exercises.some(e => e.sets.some(s => s.done))) { toast('Valide au moins une série'); return; }
  A.exercises = A.exercises.filter(e => e.sets.some(s => s.done)); A.exercises.forEach(e => e.sets = e.sets.filter(s => s.done));
  const prs = [], ups = [];
  for (const e of A.exercises) {
    const pb = bestBefore(e.n), b = Math.max(...e.sets.map(s => e1rm(num(s.kg), num(s.r)))), r = Math.max(...e.sets.map(s => num(s.r)));
    if ((pb.b > 0 && b > pb.b + 0.01) || (!b && pb.r > 0 && r > pb.r)) prs.push(e.n);
    const f = famOf(e.n), x = EX[e.n];
    if (f && x && e.sets.length >= 2 && e.sets.every(s => num(s.r) >= x.top)) { const L = FAMS[f].list, next = L.slice(L.indexOf(e.n) + 1).find(n => hasEq(n, equip())); if (next) { S.fam[f] = L.indexOf(next); ups.push([e.n, next]); } }
  }
  A.end = Date.now(); A.day = dayKey(A.start); A.prs = prs;
  S.workouts.push(A); if (A.prog && A.prog !== 'h-express') { S.settings.lastProg = A.prog; S.settings.lastDay = A.di; }
  S.active = null; stopTimer(); save(true); buzz([20, 50, 20]);
  RENDER.sport(); window.scrollTo({ top: 0 });
  const vol = sessVolume(A), reps = sessReps(A);
  checkGoals(); openSheet(`<h2>Séance terminée</h2><p class="lead">Bien joué. Pense à manger dans l’heure : protéines + glucides.</p><div class="grid3"><div class="stat"><div class="v">${Math.max(1, Math.round((A.end - A.start) / 6e4))}<small>min</small></div><div class="l">Durée</div></div><div class="stat"><div class="v">${A.exercises.reduce((s, e) => s + e.sets.length, 0)}</div><div class="l">Séries</div></div><div class="stat"><div class="v acc">${vol > 0 ? fr(vol / 1000, 2) + '<small>t</small>' : fr(reps)}</div><div class="l">${vol > 0 ? 'Volume' : 'Répétitions'}</div></div></div>
  ${ups.length ? `<div class="card" style="margin-top:12px"><h3>Niveau supérieur débloqué</h3>${ups.map(([a, b]) => `<div class="kv"><span>${esc(a)}</span><b class="acc">→ ${esc(b)}</b></div>`).join('')}<p class="dim small" style="margin-top:8px">Tu as tenu le palier sur toutes les séries : la prochaine séance passe à la variante plus dure.</p></div>` : ''}
  ${prs.length ? `<div class="card" style="margin-top:12px"><h3>Nouveaux records</h3>${prs.map(n => `<div class="kv"><span>${esc(n)}</span><b><span class="badge pr">Record</span></b></div>`).join('')}</div>` : ''}
  <button class="btn pri block" data-act="close" style="margin-top:16px">Continuer</button>`);
}
function addExerciseSheet() {
  const eq = equip();
  const draw = q => { const list = ALL_EX.filter(n => (!EX[n] || hasEq(n, eq) || q) && (!q || norm(n).includes(norm(q)))); return list.map(n => `<button class="item tap" data-act="pickex" data-n="${esc(n)}"><div class="grow"><div class="t">${esc(n)}</div><div class="s">${EX[n] ? (EX[n].eq ? EX[n].eq.map(k => EQUIP.find(e => e[0] === k)[1]).join(' + ') : 'Sans matériel') : 'Salle'}</div></div>${ICON.plus}</button>`).join('') + (q && !list.some(n => norm(n) === norm(q)) ? `<button class="item tap" data-act="pickex" data-n="${esc(q)}"><div class="grow"><div class="t">Créer « ${esc(q)} »</div><div class="s">Exercice perso</div></div>${ICON.plus}</button>` : ''); };
  openSheet(`<div class="stick"><h2>Ajouter un exercice</h2><input class="in" id="exQ" placeholder="Rechercher ou créer…" autocomplete="off" style="margin-top:8px"></div><div class="list" id="exList">${draw('')}</div>`);
  const q = $('#exQ'); q.oninput = () => $('#exList').innerHTML = draw(q.value.trim());
}
function cuesSheet(n) {
  const x = exInfo(n), f = famOf(n);
  let h = `<h2>${esc(n)}</h2><p class="lead">${x.eq ? 'Matériel : ' + x.eq.map(k => EQUIP.find(e => e[0] === k)[1]).join(', ') : EX[n] ? 'Sans matériel' : 'Salle'} · palier : ${x.top}${x.u === 'sec' ? ' s' : ' ' + (x.unit || 'reps')}</p><div class="pict"><svg viewBox="0 0 150 96">${PICT[x.p] || PICT.arms}</svg></div><ul class="cues">${x.cue.map((c, i) => `<li><b>${i + 1}</b><span>${esc(c)}</span></li>`).join('')}</ul>`;
  if (f) { const L = FAMS[f].list, cur = famVariant(f);
    h += `<div class="sep"></div><h3>Progression · ${esc(FAMS[f].n)}</h3><div class="ladder">${L.map((m, i) => `<div class="item ${m === cur ? 'cur' : ''} ${hasEq(m, equip()) ? '' : 'lock'}"><span class="badge ${m === cur ? 'acc' : ''}">${i + 1}</span><div class="grow"><div class="t">${esc(m)}</div>${hasEq(m, equip()) ? '' : `<div class="s">Nécessite : ${EX[m].eq.map(k => EQUIP.find(e => e[0] === k)[1]).join(', ')}</div>`}</div>${m === cur ? '<span class="small">Ton niveau</span>' : ''}</div>`).join('')}</div>
    <p class="dim small" style="margin-top:12px">Règle : quand tu fais ${x.top}${x.u === 'sec' ? ' s' : ' reps'} sur toutes tes séries, passe à la variante suivante. Sinon, ajoute 1–2 reps par séance ou ralentis la descente (3 secondes).</p>`; }
  else if (x.w) h += `<p class="dim small" style="margin-top:14px">Progression : quand tu fais ${x.top} reps sur toutes les séries, augmente la charge de 1 à 2,5 kg.</p>`;
  openSheet(h + `<button class="btn block" data-act="close" style="margin-top:16px">Fermer</button>`);
}
function viewWorkout(id) {
  const w = S.workouts.find(x => x.id === id); if (!w) return;
  openSheet(`<h2>${esc(w.name.split(' · ')[0])}</h2><p class="lead">${new Date(w.start).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>${w.exercises.map(e => `<div class="kv"><span>${esc(e.n)} ${w.prs && w.prs.includes(e.n) ? '<span class="badge pr">Record</span>' : ''}</span><b>${e.sets.map(s => fmtSet(s, e)).join(', ')}</b></div>`).join('')}<div class="grid2" style="margin-top:18px"><button class="btn danger" data-act="delw" data-id="${w.id}">${ICON.trash} Supprimer</button><button class="btn pri" data-act="close">Fermer</button></div>`);
}
function equipSheet(after) {
  const p = S.profile || {}; let eq = [...(p.equip || [])];
  const draw = () => `<div class="list">${EQUIP.map(([k, l]) => `<button class="check ${eq.includes(k) ? 'on' : ''}" data-eq="${k}"><span class="bx">${ICON.check}</span><span class="grow"><span class="t">${l}</span></span></button>`).join('')}</div>`;
  openSheet(`<h2>Mon matériel</h2><p class="lead">Coche ce que tu as à la maison. Rien coché = programmes 100 % poids du corps.</p><div id="eqList">${draw()}</div><button class="btn pri block" id="eqOk" style="margin-top:16px">Enregistrer</button>`);
  $('#eqList').onclick = e => { const b = e.target.closest('[data-eq]'); if (!b) return; const k = b.dataset.eq; eq = eq.includes(k) ? eq.filter(x => x !== k) : [...eq, k]; b.classList.toggle('on'); };
  $('#eqOk').onclick = () => { S.profile = { ...(S.profile || { sex: 'H', level: 'inter' }), equip: eq }; save(); closeSheet(); render(); toast('Matériel enregistré'); after && after(); };
}

/* Minuteur de repos */
let TM = null, tmI = null, audioCtx = null;
function beep() { try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.frequency.value = 740; o.connect(g); g.connect(audioCtx.destination); g.gain.setValueAtTime(0.0001, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6); o.start(); o.stop(audioCtx.currentTime + 0.6); } catch {} }
function startTimer(sec) { TM = { end: Date.now() + sec * 1000, rang: false }; drawTimer(); clearInterval(tmI); tmI = setInterval(drawTimer, 250); }
function stopTimer() { TM = null; clearInterval(tmI); $('#timer').classList.add('hidden'); document.body.classList.remove('has-timer'); }
function drawTimer() {
  const t = $('#timer'); if (!TM) return stopTimer();
  const left = Math.ceil((TM.end - Date.now()) / 1000);
  if (left <= 0 && !TM.rang) { TM.rang = true; buzz([180, 90, 180]); beep(); }
  if (left < -20) return stopTimer();
  if (!t.dataset.built) { t.innerHTML = `<button class="tb" data-tm="-15">−15</button><div class="tv"></div><button class="tb" data-tm="15">+15</button><button class="tb" data-tm="x" aria-label="Arrêter">${ICON.x}</button>`; t.dataset.built = 1; }
  t.querySelector('.tv').textContent = left > 0 ? `${Math.floor(left / 60)}:${pad(left % 60)}` : 'C’est parti'; t.classList.toggle('end', left <= 0); t.classList.remove('hidden'); document.body.classList.add('has-timer');
}
$('#timer').addEventListener('click', e => { const b = e.target.closest('[data-tm]'); if (!b || !TM) return; if (b.dataset.tm === 'x') return stopTimer(); TM.end = Math.max(Date.now() + 1000, TM.end + num(b.dataset.tm) * 1000); TM.rang = false; drawTimer(); });

const confirmReplace = () => !S.active || confirm('Une séance est déjà en cours. La remplacer ?');
Object.assign(ACT, {
  start: d => { if (confirmReplace()) startWorkout(d.p, num(d.d)); },
  free: () => { if (confirmReplace()) startWorkout(null, 0); },
  setok: (d, b) => { const row = b.closest('.set'); toggleSet(num(row.dataset.ei), num(row.dataset.si)); },
  addset: d => { const ex = S.active.exercises[num(d.ei)], ls = ex.sets[ex.sets.length - 1]; ex.sets.push({ r: ls ? ls.r : 10, kg: ls ? ls.kg : '', done: false }); save(); RENDER.sport(); },
  rmset: d => { const ex = S.active.exercises[num(d.ei)]; if (ex.sets.length > 1) { ex.sets.pop(); save(); RENDER.sport(); } },
  delex: d => { if (confirm('Retirer cet exercice de la séance ?')) { S.active.exercises.splice(num(d.ei), 1); save(); RENDER.sport(); } },
  swap: d => { if (!d.to) return; const e = S.active.exercises[num(d.ei)], x = EX[d.to]; const f = famOf(d.to); e.n = d.to; e.u = x.u || 'reps'; e.w = !!x.w; e.sets.forEach((s, i) => { if (!s.done) Object.assign(s, newSet(d.to, i, x.r)); }); if (f) S.fam[f] = FAMS[f].list.indexOf(d.to); save(); RENDER.sport(); },
  cues: d => cuesSheet(d.n),
  addex: () => addExerciseSheet(),
  pickex: d => { const n = d.n, x = exInfo(n); S.active.exercises.push({ n, rest: x.w ? 90 : 60, u: x.u || 'reps', w: EX[n] ? !!x.w : true, sets: Array.from({ length: 3 }, (_, i) => newSet(n, i, x.r)) }); save(); closeSheet(); RENDER.sport(); setTimeout(() => { const c = $$('.ex'); c.length && c[c.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 350); },
  finish: () => finishWorkout(),
  cancel: () => { if (confirm('Abandonner la séance ? Les séries ne seront pas enregistrées.')) { S.active = null; stopTimer(); save(true); RENDER.sport(); } },
  wview: d => viewWorkout(d.id),
  delw: d => { if (confirm('Supprimer cette séance ?')) { S.workouts = S.workouts.filter(w => w.id !== d.id); save(); closeSheet(); render(); } },
  setLevel: d => { if (!S.profile) S.profile = { sex: 'H', equip: [] }; S.profile.level = d.v; S.fam = {}; save(); RENDER.sport(); toast('Niveau : ' + LEVELS.find(l => l[0] === d.v)[1]); },
  equipEdit: () => equipSheet()
});
document.addEventListener('input', e => {
  const i = e.target; if (!i.dataset.f || !S.active) return;
  const row = i.closest('.set'); if (!row) return; const s = S.active.exercises[num(row.dataset.ei)].sets[num(row.dataset.si)];
  s[i.dataset.f] = i.value.replace(',', '.').replace(/[^\d.]/g, ''); save();
});
document.addEventListener('focusin', e => { if (e.target.matches('.set input')) setTimeout(() => e.target.select(), 0); });
