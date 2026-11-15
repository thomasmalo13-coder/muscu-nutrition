'use strict';
/* ===================== ACCUEIL ===================== */
RENDER.home = function () {
  const el = $('#s-home'), k = dayKey(), T = targets(), tot = dayTotals(k);
  let h = reminderChips();
  const ciOn = S.profile && checkinVisible(); if (ciOn) h += checkinCard();
  if (!S.profile) h += `<div class="card accent"><div class="eyebrow">Bienvenue</div><div class="hero"><div class="big">Sport maison, repas, budget : tout au même endroit</div></div><p class="lead">Renseigne ton profil (1 minute) pour avoir tes besoins en calories, un programme adapté à ton matériel et des objectifs sur mesure.</p><button class="btn pri block" data-act="profile" style="margin-top:16px">Créer mon profil</button></div>`;
  if (S.active) h += `<div class="card accent hero"><div class="eyebrow">Séance en cours</div><div class="big">${esc(S.active.name.split(' · ')[0])}</div><p class="lead">${S.active.exercises.reduce((s, e) => s + e.sets.filter(x => x.done).length, 0)} séries faites · commencée à ${new Date(S.active.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p><div class="actions"><button class="btn pri" data-act="goto" data-tab="sport">${ICON.play} Reprendre</button></div></div>`;
  else if (S.profile && !ciOn) { const nw = nextWorkout(), doneToday = S.workouts.some(w => w.day === k);
    h += `<div class="card accent hero"><div class="eyebrow">${doneToday ? 'Séance faite aujourd’hui ✓' : 'Prochaine séance'} · ${esc(nw.p.name)}</div><div class="big">${esc(nw.d.n)}</div><p class="lead">${nw.list.length} exercices · ${esc(exNames(nw.list))}</p><div class="actions"><button class="btn pri" data-act="start" data-p="${nw.p.id}" data-d="${nw.di}">${ICON.play} Démarrer</button><button class="btn" data-act="start" data-p="h-express" data-d="0">${ICON.clock} 20 min</button></div></div>`; }
  if (S.profile) h += formeCard();
  if (S.profile) h += homeGoalsCard();
  h += `<div class="card"><div class="h-row" style="margin-bottom:14px"><h3>Aujourd’hui</h3><button class="link" data-act="goto" data-tab="repas">Repas ${ICON.right}</button></div>${nutritionBlock(k, T, tot, true)}</div>`;
  const lw = lastWeight(), w7 = S.weights.filter(w => w.date <= addDays(today(), -7)), dW = lw && w7.length ? lw - w7[w7.length - 1].kg : null;
  const wk = weekStart(k), nS = S.workouts.filter(w => w.day >= wk).length, sg = activeGoals().find(g => g.type === 'seances'), B = num(S.fin.budget), sp = monthSpend(monthKey(today())), cd = consoDay(k), cc = consoCost(cd);
  h += `<div class="grid2">
    <button class="stat tap" data-act="gotoSuivi"><div class="l">Poids</div><div class="v">${lw ? fr(lw, 1) + '<small>kg</small>' : '—'}</div><div class="s">${dW == null ? 'Pèse-toi' : (dW > 0 ? '+' : dW < 0 ? '−' : '±') + fr(Math.abs(dW), 1) + ' kg en 7 jours'}</div></button>
    <button class="stat tap" data-act="goto" data-tab="sport"><div class="l">Séances</div><div class="v">${nS}${sg ? '<small>/ ' + sg.target + '</small>' : ''}</div><div class="s">cette semaine</div></button>
    <button class="stat tap" data-act="goto" data-tab="budget"><div class="l">${B ? 'Budget restant' : 'Dépensé'}</div><div class="v" ${B && sp > B ? 'style="color:var(--bad)"' : ''}>${eur(B ? B - sp : sp, 0)}</div><div class="s">${monthLabel(monthKey(today())).split(' ')[0]}</div></button>
    <button class="stat tap" data-act="goto" data-tab="conso"><div class="l">Conso du jour</div><div class="v">${eur(cc, 0)}</div><div class="s">${CONSO.filter(c => cd[c.id]).map(c => c.i + ' ' + fr(cd[c.id], 1)).join('  ') || 'rien noté'}</div></button></div>`;
  const tip = NIGHT_TIPS[(Math.floor(Date.now() / DAY_MS)) % NIGHT_TIPS.length];
  h += `<div class="card"><div class="tips"><div class="tip"><div class="ti">${tip[0]}</div><div><b>${esc(tip[1])}</b><span>${esc(tip[2])}</span></div></div></div></div>`;
  el.innerHTML = h; animateIn(el);
};

/* ===================== RÉGLAGES ===================== */
function settingsSheet(focusProfile) {
  const p = S.profile || { name: '', sex: 'H', age: '', height: '', weight: lastWeight() || '', activity: 1.55, goal: 'maintien', level: 'inter', equip: [] }, st = S.settings;
  const priceLbl = { cig: 'par cigarette', joint: 'par joint', biere: 'par bière', coke: 'le gramme' };
  let eq = [...(p.equip || [])], lv = p.level || 'inter', sex = p.sex === 'F' ? 'F' : 'H', goal = p.goal || 'maintien';
  openSheet(`<h2>${focusProfile ? 'Mon profil' : 'Réglages'}</h2>
  <div class="card"><h3>Profil</h3><div class="form">
    <div class="grid2"><label class="f"><span>Prénom</span><input class="in" id="pName" value="${esc(p.name || '')}" placeholder="facultatif" autocomplete="given-name"></label><label class="f"><span>Sexe</span><div class="seg" id="sexSeg"><button type="button" data-v="H" class="${sex === 'H' ? 'on' : ''}">Homme</button><button type="button" data-v="F" class="${sex === 'F' ? 'on' : ''}">Femme</button></div></label></div>
    <div class="grid3"><label class="f"><span>Âge</span><input class="in" id="pAge" inputmode="numeric" value="${esc(p.age)}" placeholder="30"></label><label class="f"><span>Taille (cm)</span><input class="in" id="pH" inputmode="numeric" value="${esc(p.height)}" placeholder="178"></label><label class="f"><span>Poids (kg)</span><input class="in" id="pW" inputmode="decimal" value="${esc(String(p.weight).replace('.', ','))}" placeholder="75"></label></div>
    <label class="f"><span>Activité (en plus du travail)</span><select class="in" id="pAct">${ACTIVITY.map(([v, l]) => `<option value="${v}" ${num(p.activity) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="f"><span>Objectif physique</span><div class="seg" id="goalSeg">${Object.entries({ masse: 'Masse', seche: 'Sèche', maintien: 'Maintien' }).map(([k, l]) => `<button type="button" data-v="${k}" class="${goal === k ? 'on' : ''}">${l}</button>`).join('')}</div></label>
    <div id="tgtBox"></div>
    <label class="f"><span>Niveau en sport</span><div class="seg" id="lvSeg2">${LEVELS.map(([k, l]) => `<button type="button" data-v="${k}" class="${lv === k ? 'on' : ''}">${l}</button>`).join('')}</div></label>
    <label class="f"><span>Mon matériel à la maison (rien coché = poids du corps)</span></label><div class="chips wrap" id="eqChips" style="margin-top:-6px">${EQUIP.map(([k, l]) => `<button type="button" class="chip ${eq.includes(k) ? 'on' : ''}" data-eq="${k}">${l}</button>`).join('')}</div>
    <button class="btn pri block" id="pOk">Enregistrer le profil</button></div></div>
  ${focusProfile ? '' : `<div class="card"><h3>Apparence</h3><div class="seg" id="thSeg">${[['auto', 'Auto'], ['light', 'Clair'], ['dark', 'Sombre']].map(([k, l]) => `<button type="button" data-v="${k}" class="${st.theme === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
  ${remindersHtml()}
  <div class="card"><h3>Journée</h3><label class="f"><span>Ma journée commence à… (les repas et la conso de la nuit restent sur la même journée)</span><select class="in" id="dStart">${[0, 6, 8, 10, 12, 14, 16].map(h => `<option value="${h}" ${st.dayStart === h ? 'selected' : ''}>${h === 0 ? 'Minuit' : h + ' h'}${h === 12 ? ' (conseillé)' : ''}</option>`).join('')}</select></label></div>
  <div class="card"><h3>Conso</h3><div class="form"><div class="grid2">${CONSO.map(x => `<label class="f"><span>Prix ${priceLbl[x.id]} (€)</span><input class="in" inputmode="decimal" data-price="${x.id}" value="${String(st.prices[x.id]).replace('.', ',')}"></label>`).join('')}</div>
    <label class="f"><span>Taille d’une bière</span><select class="in" id="beerCl">${[25, 33, 50].map(v => `<option value="${v}" ${st.beerCl === v ? 'selected' : ''}>${v} cl</option>`).join('')}</select></label>
    <button class="check ${st.alcoholInMeals ? 'on' : ''}" type="button" id="alcM"><span class="bx">${ICON.check}</span><span class="grow"><span class="t">Compter l’alcool dans les calories</span></span></button>
    <button class="check ${S.fin.consoInBudget ? 'on' : ''}" type="button" id="cBud"><span class="bx">${ICON.check}</span><span class="grow"><span class="t">Compter la conso dans le budget</span></span></button>
    <button class="btn soft block" id="cOk">Enregistrer</button></div></div>
  <div class="card"><h3>Repas favoris</h3><div class="list">${S.favorites.length ? S.favorites.map((f, i) => `<div class="item"><div class="grow"><div class="t">${esc(f.name)}</div><div class="s">${f.items.length} aliment${f.items.length > 1 ? 's' : ''} · ${fr(f.items.reduce((s, m) => s + m.kcal, 0))} kcal</div></div><button class="x-btn" data-act="delfav" data-i="${i}" aria-label="Supprimer">${ICON.x}</button></div>`).join('') : '<p class="dim small">Aucun. Touche l’étoile sur un repas pour l’enregistrer.</p>'}</div></div>
  <div class="card"><h3>Sauvegarde</h3><p class="mut small" style="margin-bottom:12px">Tout est stocké sur ce téléphone uniquement. Exporte un fichier de temps en temps (changement de téléphone, nettoyage…).</p><div class="grid2"><button class="btn soft" data-act="export">Exporter</button><button class="btn" data-act="import">Importer</button></div><input type="file" id="impF" accept="application/json,.json" class="hidden"><div class="sep"></div><button class="btn danger block" data-act="reset">Tout effacer</button></div>
  <div style="text-align:center;margin:6px 0 4px"><span class="dim small">Muscu · Nutri v3 · fonctionne hors connexion</span><br><a href="#" class="foot-link" data-act="help">Aide</a></div>`}`);
  const read = () => ({ ...(S.profile || {}), name: $('#pName').value.trim(), sex, goal, level: lv, equip: eq, age: num($('#pAge').value) || '', height: num($('#pH').value) || '', weight: num($('#pW').value) || '', activity: num($('#pAct').value) });
  const showT = () => { const pp = read(); const t = pp.age && pp.height && pp.weight ? targets(pp) : null; $('#tgtBox').innerHTML = t ? `<div class="stat"><div class="kv"><span>Métabolisme de base</span><b>${fr(t.bmr)} kcal</b></div><div class="kv"><span>Dépense estimée</span><b>${fr(t.tdee)} kcal</b></div><div class="kv"><span>Cible ${GOALS_N[goal].toLowerCase()}</span><b class="acc">${fr(t.kcal)} kcal</b></div><div class="kv"><span>Prot. · Gluc. · Lip.</span><b>${t.p} · ${t.c} · ${t.f} g</b></div></div><p class="dim small" style="margin-top:8px">Formule Mifflin-St Jeor : estimation à ajuster selon ton poids sur 2–3 semaines.</p>` : '<p class="dim small">Renseigne âge, taille et poids pour voir tes besoins.</p>'; };
  const segBind = (id, set) => $$(`#${id} button`).forEach(b => b.onclick = () => { set(b.dataset.v); $$(`#${id} button`).forEach(x => x.classList.toggle('on', x === b)); showT(); });
  segBind('sexSeg', v => sex = v); segBind('goalSeg', v => goal = v); segBind('lvSeg2', v => lv = v);
  $('#eqChips').onclick = e => { const b = e.target.closest('[data-eq]'); if (!b) return; const k = b.dataset.eq; eq = eq.includes(k) ? eq.filter(x => x !== k) : [...eq, k]; b.classList.toggle('on'); };
  ['pAge', 'pH', 'pW', 'pAct'].forEach(i => $('#' + i).addEventListener('input', showT)); showT();
  $('#pOk').onclick = () => {
    const pp = read(); if (!pp.age || !pp.height || !pp.weight) return toast('Remplis âge, taille et poids');
    if (S.profile && S.profile.level !== pp.level) S.fam = {};
    S.profile = pp; if (!S.weights.length || lastWeight() !== pp.weight) { const t = today(); S.weights = S.weights.filter(w => w.date !== t); S.weights.push({ date: t, kg: pp.weight }); S.weights.sort((a, b) => a.date.localeCompare(b.date)); }
    save(true); closeSheet(); render(); toast('Profil enregistré');
    if (!S.settings.goalsSuggested) setTimeout(() => suggestSheet(true), 380);
  };
  if (!focusProfile) {
    segBind('thSeg', v => { S.settings.theme = v; applyTheme(); save(); }); bindReminders();
    $('#dStart').onchange = e => { S.settings.dayStart = num(e.target.value); repasDay = consoDayK = null; save(); render(); toast('Enregistré'); };
    $('#alcM').onclick = e => e.currentTarget.classList.toggle('on'); $('#cBud').onclick = e => e.currentTarget.classList.toggle('on');
    $('#cOk').onclick = () => { $$('[data-price]').forEach(i => S.settings.prices[i.dataset.price] = num(i.value)); S.settings.beerCl = num($('#beerCl').value); S.settings.alcoholInMeals = $('#alcM').classList.contains('on'); S.fin.consoInBudget = $('#cBud').classList.contains('on'); save(); render(); toast('Réglages conso enregistrés'); };
    $('#impF').onchange = e => importFile(e.target.files[0]);
  }
}
function exportData() {
  const blob = new Blob([JSON.stringify({ app: 'muscu-nutri', exported: new Date().toISOString(), data: S })], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `muscu-nutri-${today()}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); toast('Sauvegarde exportée');
}
function importFile(f) {
  if (!f) return; const r = new FileReader();
  r.onload = () => { try { const j = JSON.parse(r.result), d = j.data || j; if (!d || !Array.isArray(d.workouts) || !Array.isArray(d.meals)) throw 0; if (!confirm('Remplacer toutes les données actuelles par cette sauvegarde ?')) return; localStorage.setItem(KEY, JSON.stringify(d)); load(); migrateWorkouts(); applyTheme(); closeSheet(); render(); toast('Sauvegarde importée'); } catch { toast('Fichier invalide'); } };
  r.readAsText(f);
}
const HELP_HTML = `<h2>Aide</h2><p class="lead" style="margin-bottom:14px">Sites d’info officiels, gratuits et anonymes :</p><div class="list">${[['Drogues Info Service', 'drogues-info-service.fr'], ['Tabac Info Service', 'tabac-info-service.fr'], ['Alcool Info Service', 'alcool-info-service.fr']].map(([n, u]) => `<a class="item tap" href="https://www.${u}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none"><div class="grow"><div class="t">${n}</div><div class="s">${u}</div></div><span class="dim">${ICON.right}</span></a>`).join('')}</div><button class="btn block" data-act="close" style="margin-top:16px">Fermer</button>`;
function migrateWorkouts() { for (const w of [...S.workouts, S.active].filter(Boolean)) for (const e of w.exercises) if (e.w === undefined) e.w = exWeighted(e.n) || e.sets.some(s => num(s.kg) > 0); }

/* ===================== Événements ===================== */
Object.assign(ACT, {
  goto: d => setTab(d.tab),
  gotoSuivi: () => { goalsView = 'suivi'; setTab('goals'); },
  profile: () => settingsSheet(true),
  close: () => closeSheet(),
  export: () => exportData(),
  import: () => $('#impF').click(),
  reset: () => { if (confirm('Effacer TOUTES les données (séances, repas, poids, objectifs, budget, conso) ?') && confirm('Vraiment tout effacer ? Pense à exporter avant.')) { localStorage.removeItem(KEY); load(); closeSheet(); render(); toast('Données effacées'); } },
  help: (d, b, e) => { e.preventDefault(); openSheet(HELP_HTML); }
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const f = ACT[b.dataset.act]; if (f) { buzz(6); f(b.dataset, b, e); }
});
$$('.tabs button').forEach(b => b.addEventListener('click', () => { buzz(6); if (b.dataset.tab === 'repas') repasDay = null; if (b.dataset.tab === TAB) return window.scrollTo({ top: 0, behavior: 'smooth' }); setTab(b.dataset.tab); }));
$('#btnSettings').addEventListener('click', () => settingsSheet(false));

/* ===================== Démo (aperçus uniquement, ?demo) ===================== */
function seedDemo() {
  const now = Date.now(), k0 = ymd(new Date()); S = DEF();
  S.profile = { name: 'Yann', sex: 'H', age: 32, height: 178, weight: 78.9, activity: 1.55, goal: 'masse', level: 'inter', equip: ['barre', 'halteres'] }; S.fam = { pull: 2 };
  for (let i = 56; i >= 0; i -= 2) S.weights.push({ date: addDays(k0, -i), kg: Math.round((77.2 + (56 - i) * 0.03 + Math.sin(i) * 0.2) * 10) / 10 });
  const p = progById('h-fb'); let di = 0, n = 0;
  for (let i = 38; i >= 1; i--) {
    if (![1, 3, 5].includes(new Date(now - i * DAY_MS).getDay())) continue;
    const t = now - i * DAY_MS - 5 * 36e5, pr = (38 - i) / 38;
    const exs = buildDay(p, di).map(x => { const bump = x.n === 'Pompes' ? Math.round(14 + pr * 18) : x.n === 'Tractions' ? Math.round(3 + pr * 4) : x.r + Math.round(pr * 3); const kg = x.w ? Math.round((12 + pr * 4) / 2) * 2 : ''; return { n: x.n, rest: x.rest, u: x.u, w: x.w, sets: Array.from({ length: x.sets }, (_, j) => ({ r: x.u === 'sec' ? 30 + Math.round(pr * 20) : Math.max(1, bump - j * (x.n === 'Tractions' ? 1 : 2)), kg, done: true })) }; });
    S.workouts.push({ id: uid(), start: t, end: t + 41 * 6e4, day: ymd(new Date(t - 12 * 36e5)), name: `${p.days[di].n} · ${p.name}`, prog: 'h-fb', di, exercises: exs, prs: i < 8 ? ['Pompes'] : [] });
    S.settings.lastProg = 'h-fb'; S.settings.lastDay = di; di = (di + 1) % 3; n++;
  }
  const k = k0, f = nm => FOODS.findIndex(x => x[0] === nm);
  const add = (day, slot, nm, g) => { const i = f(nm); if (i < 0) return; const F = FOODS[i]; S.meals.push({ id: uid(), day, slot, name: F[0], g, kcal: Math.round(F[1] * g / 100), p: Math.round(F[2] * g) / 100, c: Math.round(F[3] * g) / 100, f: Math.round(F[4] * g) / 100, fi: i }); };
  for (let d = 6; d >= 1; d--) { const day = addDays(k, -d); add(day, 'main', 'Riz basmati cuit', 250); add(day, 'main', 'Blanc de poulet cuit', 180); add(day, 'main', 'Brocoli cuit', 150); add(day, 'snack', 'Skyr nature', 150); add(day, 'snack', 'Banane', 120); add(day, 'pre', 'Pâtes cuites', 250); add(day, 'pre', 'Steak haché 5% cuit', 125); add(day, 'pause', 'Yaourt grec', 150); add(day, 'post', 'Omelette nature', 120); if (d % 2) add(day, 'pre', 'Pizza reine / jambon', 175); }
  add(k, 'main', 'Riz basmati cuit', 250); add(k, 'main', 'Blanc de poulet cuit', 180); add(k, 'main', 'Brocoli cuit', 150); add(k, 'snack', 'Flocons d\'avoine', 70); add(k, 'snack', 'Whey protéine (poudre)', 30); add(k, 'pre', 'Pâtes cuites', 250); add(k, 'pre', 'Thon au naturel (boîte)', 100);
  S.favorites = [{ name: 'Riz poulet brocoli', slot: 'main', items: S.meals.filter(m => m.day === k && m.slot === 'main').map(({ id, day, ...m }) => m) }];
  for (let d = 30; d >= 0; d--) { const day = addDays(k, -d), early = d > 16; const q = { cig: early ? 14 : Math.max(5, 11 - Math.round((16 - d) / 4)) + (d % 3 === 0 ? 1 : 0), biere: early ? 3 : (d % 2 ? 2 : 1), joint: early || d % 3 === 0 ? 1 : 0, coke: d === 22 || d === 9 ? 0.2 : 0 }; for (const [t, v] of Object.entries(q)) if (v) S.conso.push({ id: uid(), ts: now, day, t, q: v }); }
  const m = k.slice(0, 8), dom = +k.slice(8), E = (d, amount, cat, note) => d <= dom && S.fin.expenses.push({ id: uid(), date: m + pad(d), amount, cat, note: note || '' });
  E(1, 520, 'logement', 'Loyer'); E(2, 64.3, 'courses', 'Leclerc'); E(3, 45, 'carbu'); E(4, 13.99, 'abos', 'Netflix'); E(5, 11.5, 'resto', 'Kebab'); E(6, 29.9, 'sport', 'Élastiques'); E(8, 71.2, 'courses', 'Lidl'); E(9, 50, 'carbu'); E(10, 24, 'loisirs', 'Cinéma'); E(11, 8.9, 'sante', 'Pharmacie'); E(12, 17.4, 'resto', 'McDo'); E(13, 38.6, 'courses');
  S.fin.budget = 1300; S.fin.savings = [{ id: uid(), date: m + '01', amount: 50, note: 'Livret A' }, { id: uid(), date: addDays(k, -3), amount: 40, note: 'Livret A' }];
  const c5 = addDays(k, -35), G = (o) => S.goals.push({ id: uid(), created: c5, deadline: '', ms: [], wins: [], ...o });
  G({ cat: 'sport', type: 'reps', ex: 'Pompes', target: 50, startVal: 14, deadline: addDays(k, 60), ms: [25, 50] });
  G({ cat: 'sport', type: 'reps', ex: 'Tractions', target: 10, startVal: 3, deadline: addDays(k, 90), ms: [25, 50] });
  G({ cat: 'sport', type: 'seances', target: 3 });
  G({ cat: 'nutri', type: 'poids', target: 81, startVal: 77.4, deadline: addDays(k, 70), ms: [25] });
  G({ cat: 'nutri', type: 'proteines', target: 150 });
  G({ cat: 'nutri', type: 'conso', t: 'cig', target: 56 });
  G({ cat: 'finance', type: 'epargne', name: 'Fonds de secours', target: 300, created: addDays(k, -20), deadline: addDays(k, 70), conso: true, ms: [25] });
  G({ cat: 'finance', type: 'depenses', c: 'all', target: 1300 });
  S.settings.goalsSuggested = true;
  for (let d = 9; d >= 0; d--) { const day = addDays(k, -d), h = [7.5, 6, 7, 5.2, 7.8, 6.5, 7.2, 4.8, 7.4, 6.8][d]; S.sleep.push({ id: uid(), day, bed: '08:15', wake: (() => { const m = 495 + Math.round(h * 60); return pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60); })(), h, q: 4 }); S.water[day] = [9, 11, 8, 10, 12, 7, 11, 10, 9, 6][d]; }
  S.water[k] = 6; S.checkin[k] = { mood: 4, fat: 3 };
  [[63, 84.5, 34, 98], [33, 83.8, 34.6, 99], [3, 83.1, 35.2, 100.5]].forEach(([d, t, b, p]) => S.measures.push({ id: uid(), date: addDays(k, -d), taille: t, bras: b, poitrine: p }));
  S.shop = { r: { prb: 3, oats: 4, wrapthon: 2 }, done: { 'Banane': true } };
  S.settings.rem = { session: '16', water: true, weigh: '1' };
  S.settings.badgesInit = false; checkBadges(); S.settings.badgesInit = true;
}

/* ===================== Démarrage ===================== */
load(); migrateWorkouts();
if (DEMO) { seedDemo(); if (params.get('theme')) S.settings.theme = params.get('theme'); if (params.has('fresh')) { S = DEF(); } }
applyTheme();
if (params.has('noanim')) document.documentElement.classList.add('noanim');
const qTab = params.get('tab');
if (qTab === 'suivi') goalsView = 'suivi'; if (qTab === 'troph') goalsView = 'troph';
setTab(['home', 'sport', 'repas', 'goals', 'budget', 'conso'].includes(qTab) ? qTab : ['suivi', 'troph'].includes(qTab) ? 'goals' : (S.active ? 'sport' : 'home'), true);
if (params.get('session')) { const [pp, dd] = params.get('session').split(':'); startWorkout(pp, num(dd)); if (params.has('timer')) { toggleSet(0, 0); toggleSet(0, 1); } }
({
  food: () => foodSheet('pre'), fooddetail: () => { foodSheet('pre'); foodDetail(FOODS.findIndex(x => x[0] === 'Blanc de poulet cuit')); },
  settings: () => settingsSheet(false), profile: () => settingsSheet(true), help: () => openSheet(HELP_HTML),
  goal: () => goalSheet(S.goals[0] && S.goals[0].id), goalsave: () => goalSheet((S.goals.find(g => g.type === 'epargne') || {}).id), newgoal: () => goalForm(), suggest: () => { S.goals = S.goals.slice(0, 2); suggestSheet(true); },
  expense: () => moneySheet('e'), budget: () => budgetSheet(), limits: () => consoLimitsSheet(),
  cues: () => cuesSheet && S.active && cuesSheet(S.active.exercises[0].n), equip: () => equipSheet(),
  recipes: () => recipesSheet(), recipe: () => recipeSheet('wrapthon'), shop: () => shopSheet(), sleep: () => sleepSheet(), measures: () => measuresSheet(),
  badge: () => celebrate('🥩', 'Badge débloqué : Protéines au top', '7 jours d’affilée dans la cible.'),
  celebrate: () => celebrate('🔥', '75 % du chemin', '50 pompes d’affilée. La ligne d’arrivée est proche.')
}[params.get('sheet')] || (() => {}))();
if (location.search) history.replaceState(sheetOpen ? { sheet: 1 } : null, '', location.pathname);

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  let reloaded = false; const hadCtrl = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(r => { r.update().catch(() => {}); setInterval(() => r.update().catch(() => {}), 30 * 60e3); }).catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!hadCtrl || reloaded || sheetOpen || DEMO) return; reloaded = true; save(true); location.reload(); });
}
