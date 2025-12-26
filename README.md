# 🚢 Bataille navale pour Google Sheets

![License MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Platform](https://img.shields.io/badge/Platform-Google%20Apps%20Script-green)
![Runtime](https://img.shields.io/badge/Google%20Apps%20Script-V8-green)
![Author](https://img.shields.io/badge/Auteur-Fabrice%20Faucheux-orange)

Une implémentation complète et interactive du jeu de la Bataille Navale, fonctionnant entièrement dans une feuille de calcul Google Sheets grâce à Google Apps Script.

## 📋 Description

Ce projet transforme une feuille de calcul classique en une grille de jeu interactive. Contrairement aux implémentations basées sur des formules complexes, cette version utilise le moteur **Apps Script V8** pour gérer la logique du jeu, garantissant fluidité et sécurité (anti-triche).

L'interface utilise des **Cases à cocher (Checkboxes)** natives pour les interactions utilisateur, offrant une expérience tactile agréable sur ordinateur comme sur mobile.

## ✨ Fonctionnalités clés

* **Interface Graphique Native** : Utilisation de checkboxes et formatage conditionnel par script.
* **Génération Aléatoire** : Placement dynamique de la flotte à chaque nouvelle partie.
* **Système Anti-Triche** : La position des navires est stockée dans le `PropertiesService` (backend), invisible sur la grille tant que le joueur n'a pas tiré.
* **Feedback Visuel** :
    * 💧 Eau (Plouf)
    * 💥 Touché
    * ☠️ Coulé (Révélation du navire entier)
* **Menu Personnalisé** : Intégration directe dans l'interface Sheets via le menu "🎮 Jeux".

## 🛠️ Installation

1.  Ouvrez une nouvelle feuille **Google Sheets**.
2.  Allez dans **Extensions** > **Apps Script**.
3.  Supprimez tout code existant dans le fichier `Code.gs`.
4.  Copiez-collez l'intégralité du script fourni.
5.  Sauvegardez le projet (💾).
6.  Rechargez votre feuille Google Sheets (F5).
7.  Un nouveau menu **"🎮 Jeux"** apparaîtra dans la barre d'outils après quelques secondes.

## 🎮 Comment jouer ?

1.  Cliquez sur **🎮 Jeux** > **🚢 Nouvelle partie**.
2.  Le script va générer la grille et cacher une flotte composée de :
    * 1 Porte-avions (5 cases)
    * 1 Croiseur (4 cases)
    * 2 Contre-torpilleurs (3 cases)
    * 1 Torpilleur (2 cases)
3.  **Pour tirer**, cochez simplement une case dans la grille.
4.  La case se transformera instantanément pour révéler le résultat du tir.
5.  L'objectif est de couler tous les navires en un minimum de coups.

## ⚙️ Configuration technique

Le script utilise les services suivants :
* `SpreadsheetApp` : Pour la manipulation de la grille et de l'UI.
* `PropertiesService` : Pour la persistance des données de la partie en cours (`ScriptProperties`).

Les constantes de configuration (couleurs, emojis, taille de la grille) sont modifiables via l'objet `CONFIG` en début de script.

---
*Développé avec ❤️ par Fabrice Faucheux.*
