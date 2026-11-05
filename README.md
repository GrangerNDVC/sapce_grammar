# 🚀 L'Identificateur de l'Espace (Space Grammar)

Serious game sur les **natures de mots** : 6 planètes à conquérir, une flotte (éclaireurs, croiseurs, amiral) et un boss par planète. Le vaisseau évolue (5 niveaux) et se personnalise (couleur, laser, emblème, aura).

## Structure du dépôt (à déposer tel quel sur GitHub → Netlify)

```
index.html                 ← le jeu
prompt-generator.html      ← outil perso pour générer les prompts d'images (peut rester dans le dépôt)
css/style.css
js/data.js                 ← mots, planètes, chemins d'images, options de personnalisation
js/storage.js              ← sauvegarde locale + SGHooks (points d'accroche Firebase)
js/sfx.js                  ← sons synthétisés (aucun fichier audio)
js/game.js                 ← logique du jeu
assets/ship/      ship_tier1.png … ship_tier5.png
assets/enemies/   scout.png, cruiser.png, admiral.png
assets/bosses/    boss_1.png, boss_2.png, boss_3.png, boss_final.png
assets/fx/        expl_enemy.png, expl_big.png, expl_player.png
assets/planets/   bg_1.jpg … bg_6.jpg, bg_title.jpg, orb_1.png … orb_6.png
```

Les dossiers `assets/…` sont à créer : il suffit d'y déposer les images avec **exactement ces noms**.
**Le jeu fonctionne sans aucune image** (décors en dégradés, vaisseaux dessinés par le code) et utilise chaque image dès qu'elle est présente.

## État des images (05/11/2026)
**Toutes les images prévues sont intégrées** (28) : vaisseaux 1-5, éclaireur, croiseur, amiral, 4 boss, décors 1-6 + titre, 6 planètes de carte, 3 explosions.
Fonds verts retirés, images redimensionnées pour le web (dépôt ≈ 8 Mo).
Pour remplacer une image : la redéposer avec le même nom (PNG détouré pour les sprites, JPG pour les décors).
Remarque : `bg_1.jpg` (Rubicon) montre encore un paysage de canyons au sol ; à régénérer avec le nouveau prompt « sphère vue d'orbite » si tu veux la même cohérence que les autres décors.

## Déploiement
1. Créer un dépôt GitHub vide, y déposer tout le contenu du dossier.
2. Netlify → "Import from Git" → aucun build, dossier de publication = racine.

## Réglages rapides (js/data.js)
- Vitesse d'une planète : `speed` · points de vie du boss : `bossHp`
- Natures proposées : `natures` (si > 6, 6 boutons sont tirés au hasard à chaque vague)
- Mots : tableau `WORDS` (ajouter `{ word: "...", class: "Nom" }`)

## Règles du jeu
- 3 vagues par planète : flotte (8 mots) → flotte + **amiral** (2 coups, mot différent à chaque coup) → **boss**.
- Erreur de nature ou vaisseau qui passe = −1 vie (10 vies par planète).
- Touches 1 à 6 du clavier = boutons.
- Vaisseau : niveau = numéro de planète (max 5). Tirs doubles dès le niveau 3, triples au niveau 5.
