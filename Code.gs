/**
 * @fileoverview Bataille navale
 * @author Fabrice Faucheux
 */

const CONFIG = {
  NOM_FEUILLE: 'Bataille navale',
  TAILLE: 10,
  FLOTTE: [5, 4, 3, 3, 2],
  COULEURS: {
    EAU: '#cfe2f3',
    PLOUF: '#eeeeee',
    TOUCHE: '#ea9999',
    COULE: '#cc0000',
    VICTOIRE: '#b6d7a8',
    TEXTE_CHECKBOX: '#434343'
  },
  EMOJIS: {
    PLOUF: '💧',
    TOUCHE: '💥',
    COULE: '☠️'
  }
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎮 Jeux')
    .addItem('🚢 Nouvelle partie', 'nouvellePartie')
    .addItem('📜 Voir les règles', 'afficherRegles') // Ajout d'un menu pour revoir les règles
    .addToUi();
}

function onEdit(e) {
  const feuille = e.source.getActiveSheet();
  if (feuille.getName() !== CONFIG.NOM_FEUILLE) return;
  
  const range = e.range;
  if (range.getNumRows() > 1 || range.getNumColumns() > 1 || e.value !== 'TRUE') return;

  const lig = range.getRow();
  const col = range.getColumn();

  if (lig < 3 || lig > CONFIG.TAILLE + 2 || col < 3 || col > CONFIG.TAILLE + 2) return;

  try {
    jouerCoup(lig, col, feuille, range);
  } catch (err) {
    console.error(err);
  }
}

/**
 * Affiche une boite de dialogue avec les règles du jeu.
 */
function afficherRegles() {
  const ui = SpreadsheetApp.getUi();
  const message = `
COMMANDANT, À VOS ORDRES ! 🫡

Votre mission : Localiser et détruire la flotte ennemie cachée dans la grille.

📋 LÉGENDE TACTIQUE :

☑️  ACTION : Cochez une case pour tirer.
💧  EAU : Tir manqué (Plouf).
💥  TOUCHÉ : Navire ennemi touché !
☠️  COULÉ : Navire détruit (toutes ses cases sont touchées).

🏆 OBJECTIF :
Coulez les 5 navires ennemis en utilisant le moins de coups possible.

Bonne chance, Amiral !
  `;
  
  ui.alert('📜 BRIEFING DE MISSION', message, ui.ButtonSet.OK);
}

function jouerCoup(lig, col, feuille, range) {
  const etat = recupererEtat();
  
  if (!etat || !etat.enCours) {
    range.removeCheckboxes();
    return;
  }

  const x = lig - 3;
  const y = col - 3;

  etat.coupsJoues++;
  feuille.getRange('C2').setValue(`Coups : ${etat.coupsJoues}`);

  range.removeCheckboxes();

  const idNavire = etat.grille[x][y];

  if (idNavire > 0) {
    // --- TOUCHÉ ---
    const navire = etat.navires[idNavire];
    navire.pv--;
    etat.touchesRestantes--;
    feuille.getRange('H2').setValue(`Cibles : ${etat.touchesRestantes}`);

    if (navire.pv === 0) {
      // --- COULÉ ---
      SpreadsheetApp.getActiveSpreadsheet().toast("Navire coulé !", "⚓ BATAILLE NAVALE", 3);
      
      navire.coords.forEach(coord => {
        feuille.getRange(coord.x + 3, coord.y + 3)
          .setValue(CONFIG.EMOJIS.COULE)
          .setBackground(CONFIG.COULEURS.COULE)
          .setFontColor('white')
          .setFontWeight('bold')
          .setHorizontalAlignment('center')
          .setVerticalAlignment('middle');
      });

    } else {
      // --- JUSTE TOUCHÉ ---
      range.setValue(CONFIG.EMOJIS.TOUCHE)
           .setBackground(CONFIG.COULEURS.TOUCHE)
           .setFontWeight('bold')
           .setHorizontalAlignment('center')
           .setVerticalAlignment('middle');
    }
    
    if (etat.touchesRestantes <= 0) {
      etat.enCours = false;
      feuille.getRange('C1').setValue('🏆 VICTOIRE !');
      feuille.getRange(3, 3, CONFIG.TAILLE, CONFIG.TAILLE).setBackground(CONFIG.COULEURS.VICTOIRE);
      SpreadsheetApp.getUi().alert(`MISSION ACCOMPLIE !\n\nVictoire en ${etat.coupsJoues} coups.`);
    }

  } else {
    // --- PLOUF ---
    range.setValue(CONFIG.EMOJIS.PLOUF)
         .setBackground(CONFIG.COULEURS.PLOUF)
         .setFontColor('#aaaaaa')
         .setHorizontalAlignment('center')
         .setVerticalAlignment('middle');
  }

  sauvegarderEtat(etat);
}

function nouvellePartie() {
  const classeur = SpreadsheetApp.getActiveSpreadsheet();
  let feuille = classeur.getSheetByName(CONFIG.NOM_FEUILLE);

  if (!feuille) {
    feuille = classeur.insertSheet(CONFIG.NOM_FEUILLE);
  } else {
    feuille.clear();
    feuille.getRange('1:3').breakApart(); 
  }

  feuille.setColumnWidths(1, 20, 30);
  feuille.setRowHeights(1, 2, 30);
  feuille.setRowHeights(3, 10, 30);
  
  // Header Ligne 1
  feuille.getRange('C1:L1').merge()
    .setValue('BATAILLE NAVALE')
    .setFontWeight('bold').setFontSize(14)
    .setHorizontalAlignment('center').setVerticalAlignment('middle')
    .setBackground('#f3f6f4')
    .setBorder(false, false, true, false, false, false, '#999999', SpreadsheetApp.BorderStyle.SOLID);

  // Header Ligne 2
  feuille.getRange('C2:G2').merge()
    .setValue('Coups : 0')
    .setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle')
    .setBackground('#ffffff');

  feuille.getRange('H2:L2').merge()
    .setValue('Préparation...')
    .setHorizontalAlignment('center').setVerticalAlignment('middle')
    .setBackground('#ffffff');

  // Grille
  const zone = feuille.getRange(3, 3, CONFIG.TAILLE, CONFIG.TAILLE);
  zone.insertCheckboxes()
      .setBackground(CONFIG.COULEURS.EAU)
      .setFontColor(CONFIG.COULEURS.TEXTE_CHECKBOX)
      .setBorder(true, true, true, true, true, true, '#999999', SpreadsheetApp.BorderStyle.SOLID)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');

  const donnees = genererLogique();
  feuille.getRange('H2').setValue(`Cibles : ${donnees.touchesRestantes}`);
  
  sauvegarderEtat(donnees);
  
  feuille.getRange('A1').activate();
  
  // APPEL DU BRIEFING AU LANCEMENT
  afficherRegles();
}

// --- LOGIQUE METIER ---

function genererLogique() {
  const grille = Array(CONFIG.TAILLE).fill().map(() => Array(CONFIG.TAILLE).fill(0));
  const navires = {};
  let currentId = 1;

  for (const taille of CONFIG.FLOTTE) {
    let place = false;
    let tryCount = 0;
    while (!place && tryCount < 200) {
      tryCount++;
      const horiz = Math.random() < 0.5;
      const x = Math.floor(Math.random() * (horiz ? CONFIG.TAILLE : CONFIG.TAILLE - taille + 1));
      const y = Math.floor(Math.random() * (horiz ? CONFIG.TAILLE - taille + 1 : CONFIG.TAILLE));
      
      if (checkLibre(grille, x, y, taille, horiz)) {
        navires[currentId] = { id: currentId, pv: taille, coords: [] };
        for(let i=0; i<taille; i++) {
          const cx = horiz ? x : x+i;
          const cy = horiz ? y+i : y;
          grille[cx][cy] = currentId;
          navires[currentId].coords.push({x: cx, y: cy});
        }
        currentId++;
        place = true;
      }
    }
  }
  return { grille, navires, touchesRestantes: CONFIG.FLOTTE.reduce((a,b)=>a+b, 0), coupsJoues: 0, enCours: true };
}

function checkLibre(g, x, y, len, horiz) {
  for(let i=0; i<len; i++) if (g[horiz ? x : x+i][horiz ? y+i : y] !== 0) return false;
  return true;
}

function sauvegarderEtat(obj) {
  PropertiesService.getScriptProperties().setProperty('BN_DATA', JSON.stringify(obj));
}

function recupererEtat() {
  const j = PropertiesService.getScriptProperties().getProperty('BN_DATA');
  return j ? JSON.parse(j) : null;
}
