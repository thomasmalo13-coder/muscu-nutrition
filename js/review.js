'use strict';
/* ===================== BILAN DU MOIS, MENSURATIONS, PHOTOS (IndexedDB) ===================== */
const IDB = {
  db: null,
  open() { if (this.db) return Promise.resolve(this.db); return new Promise((res, rej) => { if (!('indexedDB' in window)) return rej(); const r = indexedDB.open('muscuNutriPhotos', 1); r.onupgradeneeded = () => r.result.createObjectStore('p'); r.onsuccess = () => res(this.db = r.result); r.onerror = () => rej(r.error); }); },
  async tx(mode, fn) { const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction('p', mode), st = t.objectStore('p'), q = fn(st); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }); },
  put(id, blob) { return this.tx('readwrite', s => s.put(blob, id)); },
  get(id) { return this.tx('readonly', s => s.get(id)); },
  del(id) { return this.tx('readwrite', s => s.delete(id)); }
};
const photoURLs = {};
async function photoURL(id) { if (photoURLs[id]) return photoURLs[id]; try { const b = await IDB.get(id); if (b) return photoURLs[id] = URL.createObjectURL(b); } catch {} return null; }
function resizeImage(file, max = 1080) {
  return new Promise((res, rej) => { const img = new Image(), u = URL.createObjectURL(file); img.onload = () => { const r = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); c.toBlob(b => b ? res(b) : rej(), 'image/jpeg', 0.82); }; img.onerror = rej; img.src = u; });
}
async function addPhoto(file) {
  if (!file) return; try { const b = await resizeImage(file), id = uid(); await IDB.put(id, b); S.photos.push({ id, date: today() }); save(); render(); toast('Photo enregistrée sur ce téléphone'); } catch { toast('Impossible d’enregistrer la photo'); }
}
function hydratePhotos(root = document) { $$('img[data-ph]', root).forEach(async im => { const u = await photoURL(im.dataset.ph); if (u) im.src = u; else im.closest('.ph')?.classList.add('miss'); }); }

/* Mensurations */
const MEAS = [['taille', 'Tour de taille'], ['bras', 'Tour de bras'], ['poitrine', 'Tour de poitrine']];
let measSel = 'taille';
function measuresSheet() {
  const last = S.measures[S.measures.length - 1] || {};
  openSheet(`<h2>Mensurations</h2><p class="lead">Mesure le matin, ruban à plat sans serrer. Toujours au même endroit : nombril pour la taille, milieu du biceps contracté pour le bras.</p><div class="form" style="margin-top:14px">${MEAS.map(([k, l]) => `<label class="f"><span>${l} (cm)${last[k] ? ' · dernier ' + fr(last[k], 1) : ''}</span><input class="in" inputmode="decimal" data-m="${k}" placeholder="${last[k] ? fr(last[k], 1) : 'ex. 82'}"></label>`).join('')}<button class="btn pri block" id="mOkM">Enregistrer</button></div>`);
  $('#mOkM').onclick = () => { const o = { id: uid(), date: today() }; let any = false; $$('[data-m]').forEach(i => { const v = num(i.value); if (v > 10 && v < 250) { o[i.dataset.m] = Math.round(v * 10) / 10; any = true; } }); if (!any) return toast('Entre au moins une mesure'); S.measures = S.measures.filter(m => m.date !== o.date); S.measures.push(o); S.measures.sort((a, b) => a.date.localeCompare(b.date)); save(); closeSheet(); render(); toast('Mensurations enregistrées'); };
}
function measuresCard() {
  const pts = S.measures.filter(m => m[measSel]).map(m => ({ x: parseYmd(m.date).getTime(), y: m[measSel] })), last = S.measures[S.measures.length - 1];
  const first = k => (S.measures.find(m => m[k]) || {})[k], lastV = k => ([...S.measures].reverse().find(m => m[k]) || {})[k];
  let h = `<div class="card"><div class="h-row" style="margin-bottom:12px"><h3>Mensurations</h3><button class="link" data-act="measAdd">${ICON.plus} Mesurer</button></div>`;
  if (!S.measures.length) return h + `<div class="empty">Le poids ne dit pas tout : en prise de muscle, le tour de bras monte pendant que la taille reste stable. Mesure-toi une fois par mois.</div></div>`;
  h += `<div class="grid3">${MEAS.map(([k, l]) => { const a = first(k), b = lastV(k), d = a && b ? b - a : 0; return `<button class="stat tap ${measSel === k ? 'sel' : ''}" data-act="measSel" data-k="${k}"><div class="v">${b ? fr(b, b >= 100 ? 0 : 1) : '—'}<small>cm</small></div><div class="l">${{ taille: 'Taille', bras: 'Bras', poitrine: 'Poitrine' }[k]}</div><div class="s">${d ? `<span class="${(k === 'taille') === (d < 0) ? 'acc' : 'warn'}">${d > 0 ? '+' : '−'}${fr(Math.abs(d), 1)} cm</span>` : 'depuis le début'}</div></button>`; }).join('')}</div>`;
  h += `<div style="margin-top:14px">${lineChart(pts, { unit: ' cm', h: 150 })}</div><p class="dim small" style="margin-top:6px">Dernière mesure : ${fmtDate(last.date, { day: 'numeric', month: 'long' })}</p></div>`;
  return h;
}
function photosCard() {
  const P = S.photos;
  let h = `<div class="card"><div class="h-row" style="margin-bottom:12px"><h3>Photos de progression</h3><label class="link" style="cursor:pointer">${ICON.plus} Photo<input type="file" accept="image/*" capture="environment" id="phIn" class="hidden"></label></div>`;
  if (!P.length) return h + `<div class="empty">📸 Une photo de face et de profil par mois, même lumière, même endroit. Elles restent uniquement sur ce téléphone (pas dans l’export).</div></div>`;
  if (P.length >= 2) h += `<div class="cmp"><div class="ph"><img data-ph="${P[0].id}" alt=""><span>${fmtDate(P[0].date)}</span></div><div class="ph"><img data-ph="${P[P.length - 1].id}" alt=""><span>${fmtDate(P[P.length - 1].date)}</span></div></div>`;
  h += `<div class="phgrid">${P.slice().reverse().slice(0, 9).map(p => `<button class="ph tap" data-act="photo" data-id="${p.id}"><img data-ph="${p.id}" alt=""><span>${fmtDate(p.date)}</span></button>`).join('')}</div></div>`;
  return h;
}
async function photoSheet(id) {
  const p = S.photos.find(x => x.id === id); if (!p) return; const u = await photoURL(id);
  openSheet(`<h2>Photo du ${fmtDate(p.date, { day: 'numeric', month: 'long', year: 'numeric' })}</h2>${u ? `<img src="${u}" alt="" class="phbig">` : '<div class="empty">Photo introuvable sur ce téléphone.</div>'}<div class="grid2" style="margin-top:14px"><button class="btn danger" data-act="photoDel" data-id="${id}">${ICON.trash} Supprimer</button><button class="btn" data-act="close">Fermer</button></div>`);
}
const delTimers = {};
function photoDel(id) {
  const p = S.photos.find(x => x.id === id), i = S.photos.indexOf(p); S.photos.splice(i, 1); save(); closeSheet(); render(); buzz(12);
  delTimers[id] = setTimeout(() => { IDB.del(id).catch(() => {}); delete photoURLs[id]; }, 6000);
  toast('Photo supprimée', 5000, { label: 'Annuler', fn: () => { clearTimeout(delTimers[id]); S.photos.splice(i, 0, p); save(); render(); } });
}

/* Sommeil & eau (semaine) */
function sleepWaterCard() {
  const k = dayKey(), days = Array.from({ length: 7 }, (_, i) => addDays(k, i - 6)), sl = days.map(d => sleepOf(d)), has = sl.filter(x => x != null), wt = waterTarget();
  const avg = has.length ? has.reduce((a, b) => a + b, 0) / has.length : 0, wOk = days.filter(d => waterOf(d) >= wt).length;
  return `<div class="card"><div class="h-row" style="margin-bottom:12px"><h3>Sommeil & eau · 7 jours</h3><button class="link" data-act="sleepAdd">${ICON.plus} Sommeil</button></div>
  <div class="grid2" style="margin-bottom:14px"><div class="stat"><div class="v" ${avg && avg < 6.5 ? 'style="color:var(--warn)"' : ''}>${avg ? fmtH(avg) : '—'}</div><div class="l">Sommeil moyen</div></div><div class="stat"><div class="v">${wOk}<small>/ 7</small></div><div class="l">Jours bien hydraté</div></div></div>
  ${has.length ? barChart(days.map((d, i) => ({ l: fmtDate(d, { weekday: 'short' }).slice(0, 3), hi: d === k, segs: [{ v: sl[i] || 0, c: (sl[i] || 0) >= 7 ? 'var(--acc)' : 'var(--warn)' }] })), { target: 7, h: 130, unitFmt: v => fr(v) + ' h' }) : `<div class="empty">Note ton sommeil après la tournée (accueil › Ma forme) pour voir ta semaine.</div>`}</div>`;
}

/* Bilan du mois */
function monthStats(m) {
  const n = daysInMonth(m), days = Array.from({ length: n }, (_, i) => `${m}-${pad(i + 1)}`).filter(d => d <= dayKey()), T = targets();
  const ws = S.workouts.filter(w => w.day.startsWith(m)), wIn = S.weights.filter(w => w.date.startsWith(m));
  const sl = days.map(sleepOf).filter(x => x != null), meals = days.filter(d => dayMeals(d).length);
  return { days: days.length, sess: ws.length, reps: ws.reduce((s, w) => s + sessReps(w), 0), wDelta: wIn.length > 1 ? wIn[wIn.length - 1].kg - wIn[0].kg : null,
    sleep: sl.length ? sl.reduce((a, b) => a + b, 0) / sl.length : null, prot: T && meals.length ? meals.filter(d => dayTotals(d).p >= T.p * 0.9).length / meals.length * 100 : null,
    conso: days.reduce((s, d) => s + consoCost(consoDay(d)), 0), saved: days.length ? savingsBetween(m + '-01', days[days.length - 1]) : 0, forme: days.length ? Math.round(days.reduce((s, d) => s + formeScore(d).score, 0) / days.length) : null };
}
function monthReviewCard() {
  const m = monthKey(today()), pm = (() => { const [y, mo] = m.split('-').map(Number), d = new Date(y, mo - 2, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; })();
  const A = monthStats(m), B = monthStats(pm);
  const cmp = (a, b, good = 1, f = v => fr(v)) => a == null || b == null || !b ? '' : (() => { const d = a - b; if (Math.abs(d) < 0.05) return ''; return `<span class="${d * good > 0 ? 'acc' : 'warn'}">${d > 0 ? ICON.up : ICON.down}${f(Math.abs(d))}</span>`; })();
  const tile = (v, l, c) => `<div class="stat"><div class="v">${v}</div><div class="l">${l} <span class="trend">${c || ''}</span></div></div>`;
  return `<div class="card"><div class="h-row" style="margin-bottom:4px"><h3>Bilan de ${monthLabel(m).split(' ')[0]}</h3><span class="badge">vs ${monthLabel(pm).split(' ')[0]}</span></div><p class="dim small" style="margin-bottom:12px">${A.days} jours écoulés</p>
  <div class="grid2">${tile(A.forme ?? '—', 'Forme moyenne', cmp(A.forme, B.forme))}${tile(A.sess, 'Séances', cmp(A.sess, B.sess))}${tile(A.wDelta == null ? '—' : (A.wDelta > 0 ? '+' : A.wDelta < 0 ? '−' : '') + fr(Math.abs(A.wDelta), 1) + '<small>kg</small>', 'Poids')}${tile(A.sleep ? fmtH(A.sleep) : '—', 'Sommeil moyen', cmp(A.sleep, B.sleep, 1, v => fr(v, 1) + ' h'))}${tile(A.prot == null ? '—' : fr(A.prot) + '<small>%</small>', 'Jours protéines OK', cmp(A.prot, B.prot, 1, v => fr(v) + ' %'))}${tile(eur(A.conso, 0), 'Conso', cmp(A.conso, B.conso, -1, v => eur(v, 0)))}</div>
  <div class="sep"></div><p class="small" style="line-height:1.7">${reviewVerdict(A, B)}</p></div>`;
}
function reviewVerdict(A, B) {
  const out = [];
  if (A.sess >= Math.max(8, B.sess)) out.push(`✓ ${A.sess} séances : belle régularité.`); else if (A.sess) out.push(`• ${A.sess} séances ce mois : vise 2 à 3 par semaine.`); else out.push('• Pas encore de séance ce mois-ci : l’Express 20 min est parfait pour reprendre.');
  if (A.sleep != null) out.push(A.sleep >= 7 ? '✓ Sommeil suffisant en moyenne.' : `• Sommeil moyen ${fmtH(A.sleep)} : protège ton créneau après la tournée.`);
  if (B.conso && A.conso < B.conso) out.push(`✓ ${eur(B.conso - A.conso, 0)} de moins en conso que le mois dernier.`);
  if (A.saved > 0) out.push(`✓ ${eur(A.saved, 0)} épargnés ce mois.`);
  return out.join('<br>');
}
Object.assign(ACT, {
  measAdd: () => measuresSheet(),
  measSel: d => { measSel = d.k; RENDER.goals(); },
  photo: d => photoSheet(d.id),
  photoDel: d => photoDel(d.id)
});
document.addEventListener('change', e => { if (e.target.id === 'phIn') addPhoto(e.target.files[0]); });
