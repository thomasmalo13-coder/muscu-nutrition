'use strict';
/* ===== Matériel, exercices maison, échelles de progression, programmes ===== */
const EQUIP = [['halteres', 'Haltères'], ['elastiques', 'Élastiques'], ['barre', 'Barre de traction'], ['banc', 'Banc'], ['kettlebell', 'Kettlebell']];
const LEVELS = [['deb', 'Débutant'], ['inter', 'Intermédiaire'], ['avance', 'Avancé']];

// Pictogrammes très simples par type de mouvement (viewBox 150×96)
const PICT = {
  push: '<circle cx="26" cy="42" r="7"/><path d="M34 46 132 70M46 49v29M132 70v10M10 86h132"/>',
  vpush: '<circle cx="47" cy="66" r="7"/><path d="M40 82 82 28l38 54M52 60 82 28M10 86h132"/>',
  dips: '<path d="M96 52h34v34M96 52v34"/><circle cx="72" cy="22" r="7"/><path d="M72 30v26l26 2M72 34l24 16M72 56l-26 4-4 24M10 86h132"/>',
  pull: '<path d="M30 8h90"/><circle cx="75" cy="32" r="7"/><path d="M58 8l8 20M92 8l-8 20M75 40v26M75 66l-8 22M75 66l8 22"/>',
  row: '<path d="M14 20h122M24 20v66M126 20v66"/><circle cx="48" cy="40" r="7"/><path d="M50 30v-10M56 44l60 26M116 70l4 16M62 46v-26M10 86h132"/>',
  squat: '<circle cx="74" cy="16" r="7"/><path d="M74 24l-6 28 26 6-4 26M70 32l34 4M64 52l-4 32M10 86h132"/>',
  lunge: '<circle cx="72" cy="14" r="7"/><path d="M72 22v32M72 54l26 6v24M72 54l-30 16-12 16M72 32v20M10 86h132"/>',
  hinge: '<circle cx="18" cy="74" r="7"/><path d="M26 76l46-22 30-4 8 30M72 54l-4 30M10 86h132"/>',
  core: '<circle cx="28" cy="56" r="7"/><path d="M36 60l96 14M42 62v16h20M132 74v8M10 86h132"/>',
  abs: '<circle cx="34" cy="60" r="7"/><path d="M40 66l30 14 32-26 26 6M10 86h132"/>',
  calf: '<path d="M60 74h40v12"/><circle cx="78" cy="12" r="7"/><path d="M78 20v34M78 54l-4 18M78 54l4 18M78 28l-14 18M78 28l14 18M10 86h132"/>',
  cardio: '<circle cx="75" cy="14" r="7"/><path d="M75 22v32M75 54l-18 30M75 54l18 30M75 30 52 12M75 30l23-18M10 86h132"/>',
  arms: '<circle cx="75" cy="12" r="7"/><path d="M75 20v36M75 56l-8 28M75 56l8 28M75 28l-14 14 8-18M75 28l14 14-8-18"/><path d="M62 22h-6M94 22h-6"/>',
  carry: '<circle cx="75" cy="12" r="7"/><path d="M75 20v36M75 56l-8 28M75 56l8 28M75 28l-16 30M75 28l16 30"/><rect x="52" y="58" width="12" height="8" rx="2"/><rect x="86" y="58" width="12" height="8" rx="2"/>'
};

// p = pattern, eq = matériel requis, u = unité, r = reps de départ, top = palier de progression, w = avec charge
const EX = {
  // Poussée horizontale
  'Pompes inclinées (mains sur table)': { p: 'push', r: 10, top: 15, cue: ['Mains sur une table ou un plan de travail, largeur d’épaules.', 'Corps gainé bien droit, des talons à la tête.', 'Descends la poitrine jusqu’au rebord, pousse fort.'] },
  'Pompes sur genoux': { p: 'push', r: 10, top: 15, cue: ['Genoux au sol, hanches dans l’alignement (pas les fesses en l’air).', 'Mains sous les épaules, coudes à 45° du corps.', 'Poitrine à un poing du sol, puis remonte.'] },
  'Pompes': { p: 'push', r: 10, top: 20, cue: ['Mains sous les épaules, corps gainé comme une planche.', 'Descends 2 s, coudes à 45°, poitrine presque au sol.', 'Pousse le sol, sans creuser le dos.'] },
  'Pompes diamant': { p: 'push', r: 8, top: 15, cue: ['Mains rapprochées sous la poitrine (pouces et index forment un losange).', 'Coudes le long du corps : travaille les triceps.', 'Amplitude complète, gainage serré.'] },
  'Pompes déclinées (pieds surélevés)': { p: 'push', r: 8, top: 15, cue: ['Pieds sur une chaise ou le canapé, mains au sol.', 'Plus les pieds sont hauts, plus c’est dur (haut des pecs, épaules).', 'Garde les abdos serrés pour ne pas cambrer.'] },
  'Pompes archer': { p: 'push', r: 5, top: 10, unit: 'reps / côté', cue: ['Mains très écartées. Descends vers une main, l’autre bras reste tendu.', 'Alterne les côtés.', 'Étape avant la pompe à un bras.'] },
  // Poussée verticale
  'Pike push-up': { p: 'vpush', r: 8, top: 15, cue: ['Fesses en l’air, corps en V inversé, mains un peu plus larges que les épaules.', 'Descends le haut du crâne vers le sol, entre les mains.', 'Pousse en arrière et vers le haut : ce sont les épaules qui bossent.'] },
  'Pike pieds surélevés': { p: 'vpush', r: 6, top: 12, cue: ['Même mouvement, pieds sur une chaise.', 'Hanches au-dessus des épaules.', 'Descends lentement, contrôle.'] },
  'Poirier contre le mur (négatives)': { p: 'vpush', r: 4, top: 8, cue: ['Monte en poirier dos au mur (ou ventre au mur, plus facile pour l’équilibre).', 'Descends la tête vers le sol en 3–4 s.', 'Redescends des pieds et recommence.'] },
  // Dips
  'Dips sur chaise genoux fléchis': { p: 'dips', r: 8, top: 15, cue: ['Mains sur le bord d’une chaise stable, doigts vers l’avant.', 'Pieds au sol, genoux à 90°.', 'Descends jusqu’à coudes à 90°, épaules basses.'] },
  'Dips sur chaise jambes tendues': { p: 'dips', r: 8, top: 15, cue: ['Jambes tendues, talons au sol : plus de poids sur les bras.', 'Coudes vers l’arrière, pas vers l’extérieur.', 'Remonte bras tendus sans verrouiller.'] },
  'Dips pieds surélevés': { p: 'dips', r: 8, top: 15, cue: ['Mains sur une chaise, pieds sur une autre.', 'Descente contrôlée en 2–3 s.', 'Triceps et pectoraux bas.'] },
  // Tirage
  'Rowing serviette (porte)': { p: 'row', r: 10, top: 15, cue: ['Serviette passée autour d’une poignée de porte bien fermée, une extrémité dans chaque main.', 'Pieds près de la porte, penche-toi en arrière bras tendus.', 'Tire la poitrine vers la porte en serrant les omoplates.'] },
  'Rowing sous une table genoux fléchis': { p: 'row', r: 8, top: 15, cue: ['Allongé sous une table solide, mains sur le bord.', 'Pieds au sol, genoux pliés, corps gainé.', 'Tire la poitrine vers la table, omoplates serrées.'] },
  'Rowing sous une table jambes tendues': { p: 'row', r: 8, top: 15, cue: ['Même position, jambes tendues : plus dur.', 'Corps droit comme une planche.', 'Marque 1 s en haut.'] },
  'Rowing sous une table pieds surélevés': { p: 'row', r: 8, top: 15, cue: ['Pieds posés sur une chaise, corps horizontal.', 'Tire jusqu’à toucher la table avec la poitrine.', 'Descente lente.'] },
  // Tractions
  'Suspension active': { p: 'pull', eq: ['barre'], u: 'sec', r: 20, top: 40, cue: ['Suspends-toi à la barre, bras tendus.', 'Tire les épaules vers le bas (loin des oreilles), sans plier les bras.', 'Tiens la position.'] },
  'Tractions négatives': { p: 'pull', eq: ['barre'], r: 4, top: 8, cue: ['Saute ou monte sur une chaise pour avoir le menton au-dessus de la barre.', 'Descends le plus lentement possible (4–5 s).', 'Repose les pieds et recommence.'] },
  'Tractions': { p: 'pull', eq: ['barre'], r: 4, top: 12, cue: ['Mains en pronation, un peu plus larges que les épaules.', 'Pars bras tendus, tire les coudes vers les hanches.', 'Menton au-dessus de la barre, descends contrôlé.'] },
  'Tractions archer': { p: 'pull', eq: ['barre'], r: 3, top: 8, unit: 'reps / côté', cue: ['Prise large. Monte vers une main, l’autre bras se tend.', 'Alterne les côtés.', 'Étape vers la traction à un bras.'] },
  // Jambes
  'Squat assisté (chaise)': { p: 'squat', r: 12, top: 20, cue: ['Debout devant une chaise, pieds largeur d’épaules.', 'Assieds-toi lentement en poussant les fesses en arrière, puis relève-toi.', 'Genoux dans l’axe des pieds.'] },
  'Squat poids du corps': { p: 'squat', r: 15, top: 25, cue: ['Pieds largeur d’épaules, pointes légèrement ouvertes.', 'Descends hanches sous les genoux si possible, talons au sol.', 'Poitrine haute, remonte en poussant le sol.'] },
  'Squat tempo 3-1-1': { p: 'squat', r: 12, top: 20, cue: ['Descends en 3 secondes.', 'Pause 1 s en bas.', 'Remonte en 1 s : plus dur sans charge.'] },
  'Squat bulgare': { p: 'squat', r: 8, top: 15, unit: 'reps / jambe', cue: ['Pied arrière posé sur une chaise ou le canapé.', 'Descends le genou arrière vers le sol, buste droit.', 'Pousse avec le talon de la jambe avant.'] },
  'Pistol squat assisté': { p: 'squat', r: 5, top: 10, unit: 'reps / jambe', cue: ['Sur une jambe, l’autre tendue devant, en te tenant à un cadre de porte.', 'Descends le plus bas possible en contrôle.', 'Aide-toi des bras le moins possible.'] },
  'Pistol squat': { p: 'squat', r: 3, top: 8, unit: 'reps / jambe', cue: ['Squat complet sur une jambe, l’autre tendue devant.', 'Bras devant pour l’équilibre.', 'Talon au sol tout du long.'] },
  'Fentes alternées': { p: 'lunge', r: 10, top: 16, unit: 'reps / jambe', cue: ['Grand pas en avant, descends le genou arrière près du sol.', 'Buste droit, genou avant au-dessus de la cheville.', 'Reviens et change de jambe.'] },
  'Fentes arrière': { p: 'lunge', r: 10, top: 16, unit: 'reps / jambe', cue: ['Recule une jambe et descends.', 'Plus doux pour les genoux que la fente avant.', 'Pousse avec la jambe avant pour revenir.'] },
  'Fentes sautées': { p: 'lunge', r: 8, top: 14, unit: 'reps / jambe', cue: ['Fente, puis saute et change de jambe en l’air.', 'Réception souple.', 'Cardio + puissance.'] },
  'Pont fessier': { p: 'hinge', r: 15, top: 25, cue: ['Dos au sol, genoux pliés, pieds à plat.', 'Pousse dans les talons, monte les hanches.', 'Serre les fessiers 1 s en haut.'] },
  'Pont fessier une jambe': { p: 'hinge', r: 10, top: 20, unit: 'reps / jambe', cue: ['Une jambe tendue en l’air.', 'Monte les hanches sans les faire pencher.', 'Contrôle la descente.'] },
  'Hip thrust une jambe (canapé)': { p: 'hinge', r: 10, top: 20, unit: 'reps / jambe', cue: ['Haut du dos appuyé sur le canapé.', 'Une jambe, monte les hanches jusqu’à l’horizontale.', 'Menton rentré, fessier serré.'] },
  'Mollets sur une marche': { p: 'calf', r: 15, top: 25, cue: ['Pointe des pieds sur une marche, talons dans le vide.', 'Monte au maximum, descends sous la marche.', 'Lent et complet.'] },
  'Mollets une jambe': { p: 'calf', r: 12, top: 20, unit: 'reps / jambe', cue: ['Même chose sur une seule jambe.', 'Tiens-toi au mur pour l’équilibre.', 'Pause 1 s en haut.'] },
  // Gainage / abdos
  'Gainage planche': { p: 'core', u: 'sec', r: 30, top: 60, cue: ['Avant-bras au sol, coudes sous les épaules.', 'Corps droit, fesses serrées, ventre rentré.', 'Respire calmement, ne creuse pas le dos.'] },
  'Gainage touches d’épaules': { p: 'core', r: 16, top: 30, cue: ['Position de pompe bras tendus.', 'Touche l’épaule opposée, une main après l’autre.', 'Les hanches ne bougent pas.'] },
  'Hollow hold': { p: 'core', u: 'sec', r: 20, top: 45, cue: ['Allongé sur le dos, bas du dos plaqué au sol.', 'Décolle épaules et jambes tendues, bras derrière la tête.', 'Forme une banane, tiens.'] },
  'Crunch': { p: 'abs', r: 15, top: 25, cue: ['Dos au sol, genoux pliés.', 'Enroule le haut du dos en soufflant.', 'Ne tire pas sur la nuque.'] },
  'Relevés de jambes au sol': { p: 'abs', r: 10, top: 20, cue: ['Allongé, mains sous les fesses.', 'Monte les jambes tendues à la verticale.', 'Descends lentement sans toucher le sol.'] },
  'Relevés de genoux suspendus': { p: 'abs', eq: ['barre'], r: 8, top: 15, cue: ['Suspendu à la barre.', 'Monte les genoux à la poitrine en enroulant le bassin.', 'Sans balancer.'] },
  // Cardio
  'Jumping jacks': { p: 'cardio', u: 'sec', r: 30, top: 60, cue: ['Saute en écartant bras et jambes, puis reviens.', 'Rythme régulier.', 'Sur la pointe des pieds.'] },
  'Montées de genoux': { p: 'cardio', u: 'sec', r: 30, top: 60, cue: ['Course sur place, genoux à hauteur de hanches.', 'Bras actifs.', 'Version douce : marche rapide genoux hauts.'] },
  'Mountain climbers': { p: 'cardio', u: 'sec', r: 30, top: 45, cue: ['Position de pompe.', 'Ramène les genoux vers la poitrine en alternance, vite.', 'Hanches basses.'] },
  'Burpees': { p: 'cardio', r: 8, top: 15, cue: ['Accroupi, mains au sol, jambes en arrière.', 'Ramène les pieds et saute bras en l’air.', 'Version douce : sans pompe ni saut.'] },
  // Haltères
  'Développé haltères au sol': { p: 'push', eq: ['halteres'], w: true, r: 10, top: 12, cue: ['Allongé au sol, haltères au-dessus de la poitrine.', 'Descends jusqu’à ce que les coudes touchent le sol.', 'Pousse en serrant les pecs.'] },
  'Développé couché haltères': { p: 'push', eq: ['halteres', 'banc'], w: true, r: 10, top: 12, cue: ['Sur le banc, pieds au sol, omoplates serrées.', 'Descends les haltères au niveau de la poitrine.', 'Pousse vers le haut sans cogner.'] },
  'Rowing haltère unilatéral': { p: 'row', eq: ['halteres'], w: true, r: 10, top: 12, unit: 'reps / bras', cue: ['Une main et un genou sur une chaise ou le banc, dos plat.', 'Tire l’haltère vers la hanche, coude près du corps.', 'Descends bras tendu.'] },
  'Développé militaire haltères': { p: 'vpush', eq: ['halteres'], w: true, r: 10, top: 12, cue: ['Debout ou assis, haltères à hauteur d’épaules.', 'Pousse au-dessus de la tête, sans cambrer.', 'Abdos et fessiers serrés.'] },
  'Élévations latérales': { p: 'arms', eq: ['halteres'], w: true, r: 12, top: 15, cue: ['Haltères légers, bras presque tendus.', 'Monte sur les côtés jusqu’à l’horizontale.', 'Descends lentement.'] },
  'Curl haltères': { p: 'arms', eq: ['halteres'], w: true, r: 10, top: 12, cue: ['Coudes collés au corps.', 'Monte en tournant les paumes vers le haut.', 'Descente contrôlée, sans balancer.'] },
  'Extension triceps haltère': { p: 'arms', eq: ['halteres'], w: true, r: 10, top: 12, cue: ['Un haltère tenu à deux mains derrière la tête.', 'Coudes pointés vers le plafond.', 'Tends les bras au-dessus de la tête.'] },
  'Goblet squat haltère': { p: 'squat', eq: ['halteres'], w: true, r: 10, top: 15, cue: ['Haltère tenu verticalement contre la poitrine.', 'Squat profond, coudes entre les genoux.', 'Dos droit.'] },
  'Soulevé de terre roumain haltères': { p: 'hinge', eq: ['halteres'], w: true, r: 10, top: 12, cue: ['Haltères devant les cuisses, genoux légèrement fléchis.', 'Pousse les fesses en arrière, dos plat, haltères le long des jambes.', 'Remonte en serrant les fessiers.'] },
  'Fentes haltères': { p: 'lunge', eq: ['halteres'], w: true, r: 10, top: 12, unit: 'reps / jambe', cue: ['Un haltère dans chaque main.', 'Fente arrière, genou proche du sol.', 'Buste droit.'] },
  // Élastiques
  'Rowing élastique': { p: 'row', eq: ['elastiques'], r: 12, top: 20, cue: ['Élastique accroché à une porte à hauteur de poitrine (ou autour des pieds, assis).', 'Tire les coudes vers l’arrière, omoplates serrées.', 'Reviens lentement.'] },
  'Face pull élastique': { p: 'row', eq: ['elastiques'], r: 15, top: 20, cue: ['Élastique à hauteur des yeux.', 'Tire vers le visage en écartant les mains.', 'Excellent pour les épaules et la posture.'] },
  'Écarté élastique (pull-apart)': { p: 'row', eq: ['elastiques'], r: 15, top: 25, cue: ['Élastique tenu bras tendus devant toi.', 'Écarte les bras jusqu’à toucher la poitrine.', 'Contrôle le retour.'] },
  'Curl élastique': { p: 'arms', eq: ['elastiques'], r: 12, top: 20, cue: ['Pieds sur l’élastique.', 'Coudes fixes, monte les mains vers les épaules.', 'Descends lentement.'] },
  'Développé épaules élastique': { p: 'vpush', eq: ['elastiques'], r: 12, top: 20, cue: ['Pieds sur l’élastique, mains à hauteur d’épaules.', 'Pousse au-dessus de la tête.', 'Gaine le ventre.'] },
  // Kettlebell
  'Kettlebell swing': { p: 'hinge', eq: ['kettlebell'], w: true, r: 15, top: 25, cue: ['Pieds un peu plus larges que les épaules.', 'Charnière de hanches : la kettlebell passe entre les jambes.', 'Projette les hanches, la cloche monte à hauteur de poitrine.'] },
  'Goblet squat kettlebell': { p: 'squat', eq: ['kettlebell'], w: true, r: 10, top: 15, cue: ['Kettlebell tenue par les cornes contre la poitrine.', 'Squat profond, dos droit.', 'Pousse dans les talons.'] },
  'Clean & press kettlebell': { p: 'vpush', eq: ['kettlebell'], w: true, r: 6, top: 10, unit: 'reps / bras', cue: ['Amène la kettlebell à l’épaule d’un mouvement de hanches.', 'Pousse au-dessus de la tête.', 'Redescends contrôlé.'] },
  // Banc
  'Step-up sur banc': { p: 'lunge', eq: ['banc'], r: 10, top: 15, unit: 'reps / jambe', cue: ['Monte sur le banc avec une jambe, pousse dans le talon.', 'Ne t’aide pas de la jambe du bas.', 'Redescends lentement.'] },
  'Chin-up (supination)': { p: 'pull', eq: ['barre'], r: 4, top: 12, cue: ['Paumes vers toi, mains largeur d’épaules.', 'Monte le menton au-dessus de la barre.', 'Plus facile que la traction, sollicite les biceps.'] }
};

// Échelles de progression (du plus facile au plus dur) + variante de départ par niveau [débutant, inter, avancé]
const FAMS = {
  push: { n: 'Pompes', list: ['Pompes inclinées (mains sur table)', 'Pompes sur genoux', 'Pompes', 'Pompes diamant', 'Pompes déclinées (pieds surélevés)', 'Pompes archer'], start: [0, 2, 4] },
  vpush: { n: 'Épaules (poids du corps)', list: ['Pike push-up', 'Pike pieds surélevés', 'Poirier contre le mur (négatives)'], start: [0, 0, 1] },
  dips: { n: 'Dips', list: ['Dips sur chaise genoux fléchis', 'Dips sur chaise jambes tendues', 'Dips pieds surélevés'], start: [0, 1, 2] },
  row: { n: 'Rowing (poids du corps)', list: ['Rowing serviette (porte)', 'Rowing sous une table genoux fléchis', 'Rowing sous une table jambes tendues', 'Rowing sous une table pieds surélevés'], start: [0, 1, 2] },
  pull: { n: 'Tractions', list: ['Suspension active', 'Tractions négatives', 'Tractions', 'Tractions archer'], start: [0, 1, 2] },
  squat: { n: 'Squat', list: ['Squat assisté (chaise)', 'Squat poids du corps', 'Squat tempo 3-1-1', 'Squat bulgare', 'Pistol squat assisté', 'Pistol squat'], start: [0, 1, 3] },
  lunge: { n: 'Fentes', list: ['Fentes arrière', 'Fentes alternées', 'Fentes sautées'], start: [0, 1, 2] },
  hinge: { n: 'Fessiers / ischios', list: ['Pont fessier', 'Pont fessier une jambe', 'Hip thrust une jambe (canapé)'], start: [0, 1, 2] },
  core: { n: 'Gainage', list: ['Gainage planche', 'Gainage touches d’épaules', 'Hollow hold'], start: [0, 1, 2] },
  abs: { n: 'Abdos', list: ['Crunch', 'Relevés de jambes au sol', 'Relevés de genoux suspendus'], start: [0, 1, 1] },
  calf: { n: 'Mollets', list: ['Mollets sur une marche', 'Mollets une jambe'], start: [0, 0, 1] }
};
for (const [f, d] of Object.entries(FAMS)) d.list.forEach(n => EX[n].fam = f);
const famOf = n => EX[n] && EX[n].fam;
const hasEq = (n, eq) => !(EX[n] && EX[n].eq) || EX[n].eq.every(x => eq.includes(x));

// Programmes maison. Un « slot » = { f: famille } ou { o: [options par ordre de préférence], f: repli } ; opt: true = sauté si aucun matériel
const HOME = [
  { id: 'h-fb', name: 'Full body maison', freq: '3× par semaine', desc: 'Tout le corps à chaque séance · 35–45 min', days: [
    { n: 'Séance A', s: [{ f: 'push' }, { f: 'squat' }, { o: ['Rowing haltère unilatéral', 'Rowing élastique'], f: 'row' }, { o: ['Soulevé de terre roumain haltères', 'Kettlebell swing'], f: 'hinge' }, { f: 'core' }] },
    { n: 'Séance B', s: [{ f: 'vpush' }, { o: ['Fentes haltères', 'Step-up sur banc'], f: 'lunge' }, { o: ['Tractions', 'Chin-up (supination)'], pick: 'pull', f: 'row' }, { f: 'dips' }, { f: 'abs' }] },
    { n: 'Séance C', s: [{ o: ['Développé couché haltères', 'Développé haltères au sol'], f: 'push' }, { o: ['Goblet squat kettlebell', 'Goblet squat haltère'], f: 'squat' }, { f: 'row' }, { f: 'hinge' }, { f: 'calf' }, { o: ['Burpees'] }] }
  ] },
  { id: 'h-hb', name: 'Haut / Bas maison', freq: '4× par semaine', desc: 'Plus de volume par muscle · 35–45 min', days: [
    { n: 'Haut A', s: [{ f: 'push' }, { o: ['Rowing haltère unilatéral', 'Rowing élastique'], f: 'row' }, { f: 'vpush' }, { f: 'dips' }, { o: ['Curl haltères', 'Curl élastique'], opt: true }, { f: 'core' }] },
    { n: 'Bas A', s: [{ f: 'squat' }, { f: 'hinge' }, { f: 'lunge' }, { f: 'calf' }, { f: 'abs' }] },
    { n: 'Haut B', s: [{ o: ['Tractions', 'Chin-up (supination)'], pick: 'pull', f: 'row' }, { o: ['Développé couché haltères', 'Développé haltères au sol'], f: 'push' }, { o: ['Élévations latérales', 'Développé épaules élastique'], f: 'vpush' }, { o: ['Face pull élastique', 'Écarté élastique (pull-apart)'], opt: true }, { o: ['Extension triceps haltère'], f: 'dips' }, { f: 'core' }] },
    { n: 'Bas B', s: [{ o: ['Goblet squat kettlebell', 'Goblet squat haltère'], f: 'squat' }, { o: ['Kettlebell swing', 'Soulevé de terre roumain haltères'], f: 'hinge' }, { o: ['Step-up sur banc'], f: 'lunge' }, { o: ['Mountain climbers'] }, { f: 'abs' }] }
  ] },
  { id: 'h-express', name: 'Express 20 min', freq: 'Après la tournée', desc: 'Circuit court, intensité modérée : tu peux dormir après', circuit: true, days: [
    { n: 'Circuit', s: [{ o: ['Jumping jacks'] }, { f: 'push' }, { f: 'squat' }, { f: 'row' }, { f: 'hinge' }, { f: 'core' }] }
  ] },
  { id: 'h-pp', name: 'Objectif pompes & tractions', freq: '3× par semaine', desc: 'Pour battre tes records : 50 pompes, 10 tractions', days: [
    { n: 'Force', s: [{ f: 'push' }, { o: ['Tractions'], pick: 'pull', f: 'row' }, { f: 'dips' }, { f: 'core' }] },
    { n: 'Volume', s: [{ fixed: 'Pompes' }, { o: ['Tractions négatives'], f: 'row' }, { f: 'vpush' }, { f: 'abs' }] },
    { n: 'Test & technique', s: [{ fixed: 'Pompes', test: true }, { o: ['Tractions'], pick: 'pull', test: true, f: 'row' }, { f: 'hinge' }, { f: 'core' }] }
  ] }
];
const LEVEL_CFG = { deb: { sets: 3, rest: 75, circ: 2 }, inter: { sets: 3, rest: 60, circ: 3 }, avance: { sets: 4, rest: 60, circ: 4 } };

// Programmes salle (secondaires) : [nom, séries, reps, repos, unité]
const GYM = [
  { id: 'fb3', name: 'Full body salle', freq: '3× par semaine', desc: 'Salle · débuter ou reprendre', days: [
    { n: 'Séance A', ex: [['Squat', 4, 8, 150], ['Développé couché', 4, 8, 150], ['Rowing barre', 3, 10, 120], ['Développé militaire haltères', 3, 10, 90], ['Curl haltères', 2, 12, 60], ['Gainage planche', 3, 45, 60, 'sec']] },
    { n: 'Séance B', ex: [['Soulevé de terre', 3, 6, 180], ['Développé incliné haltères', 3, 10, 120], ['Tirage vertical', 3, 10, 90], ['Fentes haltères', 3, 10, 90], ['Extension triceps poulie', 2, 12, 60], ['Crunch', 3, 15, 45]] },
    { n: 'Séance C', ex: [['Presse à cuisses', 4, 10, 120], ['Dips', 3, 10, 90], ['Rowing haltère unilatéral', 3, 10, 90], ['Élévations latérales', 3, 15, 60], ['Leg curl', 3, 12, 60], ['Mollets debout', 3, 15, 45]] }
  ] },
  { id: 'ppl', name: 'Push · Pull · Legs salle', freq: '3 à 6× par semaine', desc: 'Salle · intermédiaire', days: [
    { n: 'Push', ex: [['Développé couché', 4, 8, 150], ['Développé militaire barre', 3, 8, 120], ['Développé incliné haltères', 3, 10, 90], ['Élévations latérales', 4, 15, 60], ['Dips', 3, 10, 90], ['Extension triceps poulie', 3, 12, 60]] },
    { n: 'Pull', ex: [['Tractions', 4, 8, 120], ['Rowing barre', 4, 8, 120], ['Tirage horizontal poulie', 3, 12, 90], ['Face pull', 3, 15, 60], ['Curl barre', 3, 10, 60], ['Curl marteau', 3, 12, 60]] },
    { n: 'Legs', ex: [['Squat', 4, 6, 180], ['Soulevé de terre jambes tendues', 3, 10, 120], ['Presse à cuisses', 3, 12, 120], ['Leg curl', 3, 12, 60], ['Leg extension', 3, 15, 60], ['Mollets debout', 4, 15, 45]] }
  ] }
];
const GYM_EX = ['Squat', 'Développé couché', 'Rowing barre', 'Soulevé de terre', 'Développé incliné haltères', 'Tirage vertical', 'Extension triceps poulie', 'Presse à cuisses', 'Dips', 'Leg curl', 'Mollets debout', 'Développé militaire barre', 'Tirage horizontal poulie', 'Face pull', 'Curl barre', 'Curl marteau', 'Soulevé de terre jambes tendues', 'Leg extension', 'Hip thrust', 'Écarté couché haltères'];
const ALL_EX = [...new Set([...Object.keys(EX), ...GYM_EX])].sort((a, b) => a.localeCompare(b, 'fr'));
const ALL_PROGS = () => [...HOME, ...GYM];
