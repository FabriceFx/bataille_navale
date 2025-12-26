/**
 * @fileoverview Moteur de jeu "Bataille Navale" interactif pour Google Sheets.
 * * Ce script transforme une feuille de calcul en grille de jeu interactive.
 * Il utilise les événements 'onEdit' sur des cases à cocher pour simuler les tirs.
 * * Fonctionnalités principales :
 * - Génération procédurale de la flotte (positionnement aléatoire).
 * - Persistance de l'état du jeu via PropertiesService (anti-refresh).
 * - Interface graphique dynamique (Emojis, formatage conditionnel par script).
 * @author       Fabrice Faucheux
 * @version      1.0.0
 * @lastUpdated  27-12-2025-
 * @license      MIT
 */

/**
 * Limite les permissions du script au seul fichier Google Sheets actif.
 * @OnlyCurrentDoc
 */

const CONFIG = {
  NOM_FEUILLE: 'Bataille navale',
  TAILLE: 10,
  FLOTTE: [5, 4, 3, 3, 2], // Tailles des navires
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

/**
 * Crée le menu personnalisé à l'ouverture du classeur.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎮 Jeux')
    .addItem('🚢 Nouvelle partie', 'nouvellePartie')
    .addItem('📜 Voir les règles', 'afficherRegles')
    .addToUi();
}

/**
 * Déclencheur simple exécuté lors de l'édition d'une cellule.
 * Gère la logique du tir lorsqu'une case est cochée.
 * @param {GoogleAppsScript.Events.SheetsOnEdit} e - L'événement d'édition
 */
function onEdit(e) {
  const feuille = e.source.getActiveSheet();
  if (feuille.getName() !== CONFIG.NOM_FEUILLE) return;
  
  const range = e.range;
  // Optimisation : On ne traite que les éditions d'une seule cellule cochée (TRUE)
  if (range.getNumRows() > 1 || range.getNumColumns() > 1 || e.value !== 'TRUE') return;

  const lig = range.getRow();
  const col = range.getColumn();

  // Vérification des bornes de la grille de jeu (Marge de 2 lignes/col)
  if (lig < 3 || lig > CONFIG.TAILLE + 2 || col < 3 || col > CONFIG.TAILLE + 2) return;

  try {
    jouerCoup(lig, col, feuille, range);
  } catch (err) {
    console.error('Erreur lors du coup :', err);
  }
}

/**
 * Affiche une modale avec les instructions.
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
☠️  COULÉ : Navire détruit.

🏆 OBJECTIF :
Coulez les 5 navires ennemis en un minimum de coups.
  `;
  ui.alert('📜 BRIEFING DE MISSION', message, ui.ButtonSet.OK);
}

/**
 * Logique principale du tour de jeu.
 * @param {number} lig - Ligne de la cellule
 * @param {number} col - Colonne de la cellule
 * @param {GoogleAppsScript.Spreadsheet.Sheet} feuille - La feuille active
 * @param {GoogleAppsScript.Spreadsheet.Range} range - La cellule modifiée
 */
function jouerCoup(lig, col, feuille, range) {
  const etat = recupererEtat();
  
  // Si pas de partie en cours, on décoche simplement
  if (!etat || !etat.enCours) {
    range.removeCheckboxes();
    return;
  }

  // Conversion coordonnées grille (0-indexed)
  const x = lig - 3;
  const y = col - 3;

  etat.coupsJoues++;
  feuille.getRange('C2').setValue(`Coups : ${etat.coupsJoues}`);

  // On supprime la checkbox pour afficher le résultat
  range.removeCheckboxes();

  const idNavire = etat.grille[x][y];

  if (idNavire > 0) {
    // --- SCÉNARIO : TOUCHÉ ---
    const navire = etat.navires[idNavire];
    navire.pv--;
    etat.touchesRestantes--; // Décrémente le compteur global de cibles
    feuille.getRange('H2').setValue(`Cibles : ${etat.touchesRestantes}`);

    if (navire.pv === 0) {
      // --- SCÉNARIO : COULÉ ---
      SpreadsheetApp.getActiveSpreadsheet().toast("Navire coulé !", "⚓ BATAILLE NAVALE", 3);
      
      // Batch update pour le navire coulé (visuel)
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
      // --- SCÉNARIO : JUSTE TOUCHÉ ---
      range.setValue(CONFIG.EMOJIS.TOUCHE)
           .setBackground(CONFIG.COULEURS.TOUCHE)
           .setFontWeight('bold')
           .setHorizontalAlignment('center')
           .setVerticalAlignment('middle');
    }
    
    // Vérification de la victoire
    if (etat.touchesRestantes <= 0) {
      etat.enCours = false;
      feuille.getRange('C1').setValue('🏆 VICTOIRE !');
      feuille.getRange(3, 3, CONFIG.TAILLE, CONFIG.TAILLE).setBackground(CONFIG.COULEURS.VICTOIRE);
      SpreadsheetApp.getUi().alert(`MISSION ACCOMPLIE !\n\nVictoire en ${etat.coupsJoues} coups.`);
    }

  } else {
    // --- SCÉNARIO : DANS L'EAU ---
    range.setValue(CONFIG.EMOJIS.PLOUF)
         .setBackground(CONFIG.COULEURS.PLOUF)
         .setFontColor('#aaaaaa')
         .setHorizontalAlignment('center')
         .setVerticalAlignment('middle');
  }

  sauvegarderEtat(etat);
}

/**
 * Initialise une nouvelle partie : Nettoyage UI, Génération logique, Sauvegarde.
 */
function nouvellePartie() {
  const classeur = SpreadsheetApp.getActiveSpreadsheet();
  let feuille = classeur.getSheetByName(CONFIG.NOM_FEUILLE);

  if (!feuille) {
    feuille = classeur.insertSheet(CONFIG.NOM_FEUILLE);
  } else {
    feuille.clear();
    // Nettoyage des fusions précédentes si nécessaire
    const zoneHeader = feuille.getRange('1:3'); 
    try { zoneHeader.breakApart(); } catch(e) {} 
  }

  // Formatage structurel
  feuille.setColumnWidths(1, 20, 30);
  feuille.setRowHeights(1, 2, 30);
  feuille.setRowHeights(3, 10, 30);
  
  // Construction du Header
  feuille.getRange('C1:L1').merge()
    .setValue('BATAILLE NAVALE')
    .setFontWeight('bold').setFontSize(14)
    .setHorizontalAlignment('center').setVerticalAlignment('middle')
    .setBackground('#f3f6f4')
    .setBorder(false, false, true, false, false, false, '#999999', SpreadsheetApp.BorderStyle.SOLID);

  feuille.getRange('C2:G2').merge()
    .setValue('Coups : 0')
    .setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle')
    .setBackground('#ffffff');

  feuille.getRange('H2:L2').merge()
    .setValue('Initialisation...')
    .setHorizontalAlignment('center').setVerticalAlignment('middle')
    .setBackground('#ffffff');

  // Création de la grille de Checkboxes
  const zone = feuille.getRange(3, 3, CONFIG.TAILLE, CONFIG.TAILLE);
  zone.insertCheckboxes()
      .setBackground(CONFIG.COULEURS.EAU)
      .setFontColor(CONFIG.COULEURS.TEXTE_CHECKBOX)
      .setBorder(true, true, true, true, true, true, '#999999', SpreadsheetApp.BorderStyle.SOLID)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');

  // Génération de la logique métier
  const donnees = genererLogique();
  feuille.getRange('H2').setValue(`Cibles : ${donnees.touchesRestantes}`);
  
  sauvegarderEtat(donnees);
  
  feuille.getRange('A1').activate();
  afficherRegles();
}

// --- LOGIQUE MÉTIER & PERSISTANCE ---

/**
 * Génère la grille virtuelle et place les navires aléatoirement.
 * @return {Object} L'état initial du jeu
 */
function genererLogique() {
  // Création matrice 10x10 vide
  const grille = Array(CONFIG.TAILLE).fill().map(() => Array(CONFIG.TAILLE).fill(0));
  const navires = {};
  let currentId = 1;

  for (const taille of CONFIG.FLOTTE) {
    let place = false;
    let tryCount = 0;
    // Algorithme de placement aléatoire avec "backoff"
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
  
  const totalPv = CONFIG.FLOTTE.reduce((a, b) => a + b, 0);
  return { grille, navires, touchesRestantes: totalPv, coupsJoues: 0, enCours: true };
}

/**
 * Vérifie si un emplacement est libre pour un navire.
 */
function checkLibre(g, x, y, len, horiz) {
  for(let i=0; i<len; i++) {
    if (g[horiz ? x : x+i][horiz ? y+i : y] !== 0) return false;
  }
  return true;
}

/**
 * Sauvegarde l'état du jeu dans les propriétés du script.
 * @param {Object} obj - L'objet état à sérialiser
 */
function sauvegarderEtat(obj) {
  PropertiesService.getScriptProperties().setProperty('BN_DATA', JSON.stringify(obj));
}

/**
 * Récupère l'état du jeu depuis les propriétés du script.
 * @return {Object|null} L'objet état désérialisé ou null
 */
function recupererEtat() {
  const j = PropertiesService.getScriptProperties().getProperty('BN_DATA');
  return j ? JSON.parse(j) : null;
}
