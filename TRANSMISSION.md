# Document de transmission – Space Grammar

**Projet** : serious game "L'Identificateur de l'Espace" (natures de mots), HTML/JS pur, GitHub → Netlify. Julie fait les images elle-même à partir des prompts du générateur.

**État (04/11/2026)** : chantiers 1 et 2 terminés (voir ROADMAP.md). Jeu jouable sans images grâce aux visuels de secours.

**Architecture**
- `js/data.js` : WORDS, PLANETS (6), ASSET_PATHS, options de personnalisation.
- `js/storage.js` : `SGStore` (localStorage : sg_progress, sg_cosmetics) et `SGHooks.onEvent` (vide, à brancher sur Firebase).
- `js/game.js` : IIFE ; état de partie `S` ; phases `S.wave` 0 = flotte, 1 = flotte + amiral, 2 = boss ; images testées au démarrage (`assetOK`).
- Recoloration : `filter: hue-rotate()` (vaisseau = cyan de base, ennemis = magenta de base, teinte décalée par planète).

**Décisions de Julie** : garder le principe d'origine (cliquer la bonne nature) ; vaisseau recolorable/personnalisable et évolutif ; identifiant élève à 4 chiffres ; symbole discret enseignant avec cheat de débogage et suivi de progression ; rester sur des outils gratuits.

**Prochaine étape** : chantier 3 (images + équilibrage), puis Firebase.
