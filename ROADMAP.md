# Feuille de route – Space Grammar

## Chantier 1 – Prompts & images ✅ (fait)
`prompt-generator.html` : 25 prompts complets (5 vaisseaux, 3 flotte, 4 boss, 7 décors, 6 planètes de carte).
**À faire côté Julie** : générer les images, les nommer et les déposer dans `assets/…`.
Ordre conseillé (⭐ = priorité) : ship_tier1 ⭐, scout ⭐, cruiser ⭐, admiral ⭐, boss_1 ⭐, bg_1 ⭐, puis le reste.

## Chantier 2 – Jeu v1 ✅ (fait)
Planètes, vagues, amiral, boss, vaisseau évolutif, personnalisation, sons, sauvegarde locale.

## Chantier 3 – Images + équilibrage (en cours)
- ✅ Images intégrées et testées en navigateur (partie complète planète 1 jusqu'au boss, sans erreur) : vaisseaux 1-5, flotte, 4 boss, décors 1-6, explosions.
- ✅ Planètes de carte (orb_1…6) et décor titre intégrés : toutes les images prévues sont là.
- ⏳ Optionnel : régénérer `bg_1.jpg` (Rubicon, paysage au sol) avec le prompt « sphère vue d'orbite ».
- À vérifier au jeu : teintes par planète (hue-rotate décale aussi le jaune des yeux/noyaux).
- Régler vitesse / PV des boss / nombre de mots par vague selon les élèves.
- Ajuster les listes de mots par planète (ajouter du vocabulaire du cours).
- Test tablette / téléphone.

## Chantier 4 – Firebase élèves
- Identifiant à 4 chiffres (écran de connexion avant le titre), progression et personnalisation sauvegardées dans Firebase.
- Brancher `SGStore` (storage.js) sur Firestore ; fallback localStorage si hors ligne.
- Brancher `SGHooks.onEvent` : événements déjà émis → `answer {word, expected, chosen, correct}`, `planet_start`, `planet_cleared`, `game_over`.

## Chantier 5 – Espace enseignant
- Symbole discret (ex. coin de l'écran titre) → code enseignant.
- Cheats de débogage : débloquer toutes les planètes, vies infinies, passer le boss.
- Tableau de suivi : progression par élève, notions les plus ratées (agrégation des événements `answer`).

## Chantier 6 – Finitions (optionnel)
Bonus / power-ups, musique, mode révision des erreurs, classement de classe.
