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

---
## Mise à jour 06/11/2026 — commandes, Firebase, musiques

### Commandes
- **← →** (ou Q/D) et/ou **souris / doigt** : déplacer le vaisseau (les deux marchent en même temps).
- **↑ ↓** (ou Z/S) : choisir la munition dans le **bac à munitions** (à droite). **Espace / Entrée** : tirer. Cliquer/toucher une munition tire aussi ; les chiffres 1-6 sont des raccourcis.
- On ne touche un ennemi que s'il est **en face** du vaisseau (surligné en jaune). Hors alignement : le tir part dans le vide, aucune vie perdue.

### Personnalisation
Couleur du vaisseau (dont **noir**), du laser (dont noir), emblème (dont 💀), effet (aucun/lueur/pulsation) **et sa propre palette de couleur**.

### Firebase (à faire une seule fois)
1. Console Firebase > Authentication > Sign-in method : activer **Anonyme** et **Google**.
2. Authentication > Settings > Authorized domains : ajouter le domaine Netlify du jeu.
3. Realtime Database > Rules : coller le contenu de `firebase/database.rules.json` (il contient tes règles existantes + le nœud `natures`) puis Publier.
4. Le jeu écrit dans `jeux/natures/<code à 4 chiffres>`. Espace enseignant : bouton ⚙ discret (en bas à droite de l'écran titre), connexion Google avec julie.granger.rennes@gmail.com.
- Limite connue : un code à 4 chiffres n'est pas un mot de passe (un élève peut taper le code d'un camarade). Suffisant pour du suivi pédagogique, pas pour des données sensibles : ne stocke que la progression et les stats.
- Sans réseau/Firebase bloqué : le jeu marche, la progression reste sur l'appareil et se synchronise plus tard.

### Musiques (facultatives)
Déposer des MP3 dans `assets/music/` : title, map, planet_1…planet_6, boss, boss_final, victory, gameover (prompts dans le générateur, catégorie Musiques). Fichier absent = silence. Bouton 🔊/🔇 en haut à gauche.

### Tableau des scores (ajouté)
Bouton 🏆 SCORES dans le menu : top 10 (meilleur score + planètes conquises). Les élèves apparaissent sous un **pseudo anonyme** généré depuis leur code (ex. « Loup Agile 70 ») : le code n'est jamais affiché. Données dans `jeux/natures_scores/<code>` (règles ajoutées dans `firebase/database.rules.json` : lecture pour tout utilisateur connecté, écriture limitée à un code à 4 chiffres, score < 100000, planètes ≤ 6).

### Vitesse et tablettes (06/11/2026)
- Sur la carte : choix de la vitesse des ennemis, avec multiplicateur de points : 🐢 Cadet ×1 (par défaut) · 🚀 Pilote ×1,5 · ⚡ Commandant ×2 · 🔥 Légende ×3. Le choix est sauvegardé avec le profil.
- iPad / smartphone : commandes tactiles (glisser le doigt pour placer le vaisseau, toucher une munition pour tirer, les deux en même temps), écran adapté (dvh), volume de la musique géré par Web Audio (iOS ignore le volume des balises audio). Le son démarre au premier toucher (règle iOS).
