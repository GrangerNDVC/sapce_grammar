// ===== DONNÉES DU JEU : mots, planètes, chemins des images =====

const ALL_NATURES = [
  'Nom', 'Verbe', 'Adjectif', 'Adverbe', 'Préposition', 'Conjonction', 'Interjection',
  'Dét. Art. Défini', 'Dét. Art. Indéfini', 'Dét. Art. Contracté',
  'Dét. Possessif', 'Dét. Démonstratif', 'Dét. Indéfini', 'Dét. Numéral',
  'Pron. Personnel', 'Pron. Possessif', 'Pron. Démonstratif', 'Pron. Indéfini',
  'Pron. Relatif', 'Pron. Interrogatif'
];

const WORDS = [
  { word: "chat", class: "Nom" }, { word: "soleil", class: "Nom" }, { word: "liberté", class: "Nom" }, { word: "table", class: "Nom" },
  { word: "maison", class: "Nom" }, { word: "école", class: "Nom" },
  { word: "mange", class: "Verbe" }, { word: "court", class: "Verbe" }, { word: "suis", class: "Verbe" }, { word: "finira", class: "Verbe" },
  { word: "chantons", class: "Verbe" }, { word: "avaient", class: "Verbe" },
  { word: "grand", class: "Adjectif" }, { word: "bleu", class: "Adjectif" }, { word: "jolie", class: "Adjectif" }, { word: "triste", class: "Adjectif" },
  { word: "rapide", class: "Adjectif" }, { word: "gentils", class: "Adjectif" },

  { word: "très", class: "Adverbe" }, { word: "vite", class: "Adverbe" }, { word: "jamais", class: "Adverbe" }, { word: "ici", class: "Adverbe" },
  { word: "souvent", class: "Adverbe" },
  { word: "sur", class: "Préposition" }, { word: "dans", class: "Préposition" }, { word: "chez", class: "Préposition" }, { word: "pour", class: "Préposition" },
  { word: "avec", class: "Préposition" },
  { word: "et", class: "Conjonction" }, { word: "mais", class: "Conjonction" }, { word: "donc", class: "Conjonction" }, { word: "car", class: "Conjonction" },
  { word: "Ah !", class: "Interjection" }, { word: "Oh !", class: "Interjection" }, { word: "Hélas !", class: "Interjection" },

  { word: "le", class: "Dét. Art. Défini" }, { word: "la", class: "Dét. Art. Défini" }, { word: "les", class: "Dét. Art. Défini" },
  { word: "un", class: "Dét. Art. Indéfini" }, { word: "une", class: "Dét. Art. Indéfini" }, { word: "des", class: "Dét. Art. Indéfini" },
  { word: "au", class: "Dét. Art. Contracté" }, { word: "aux", class: "Dét. Art. Contracté" }, { word: "du", class: "Dét. Art. Contracté" },
  { word: "mon", class: "Dét. Possessif" }, { word: "ta", class: "Dét. Possessif" }, { word: "ses", class: "Dét. Possessif" }, { word: "notre", class: "Dét. Possessif" },
  { word: "ce", class: "Dét. Démonstratif" }, { word: "cette", class: "Dét. Démonstratif" }, { word: "ces", class: "Dét. Démonstratif" },
  { word: "chaque", class: "Dét. Indéfini" }, { word: "plusieurs", class: "Dét. Indéfini" }, { word: "quelques", class: "Dét. Indéfini" },
  { word: "deux", class: "Dét. Numéral" }, { word: "trois", class: "Dét. Numéral" }, { word: "cent", class: "Dét. Numéral" },

  { word: "je", class: "Pron. Personnel" }, { word: "tu", class: "Pron. Personnel" }, { word: "lui", class: "Pron. Personnel" }, { word: "nous", class: "Pron. Personnel" },
  { word: "le mien", class: "Pron. Possessif" }, { word: "le tien", class: "Pron. Possessif" }, { word: "la vôtre", class: "Pron. Possessif" },
  { word: "celui-ci", class: "Pron. Démonstratif" }, { word: "cela", class: "Pron. Démonstratif" }, { word: "ça", class: "Pron. Démonstratif" },
  { word: "personne", class: "Pron. Indéfini" }, { word: "rien", class: "Pron. Indéfini" }, { word: "on", class: "Pron. Indéfini" }, { word: "chacun", class: "Pron. Indéfini" },
  { word: "qui", class: "Pron. Relatif" }, { word: "que", class: "Pron. Relatif" }, { word: "dont", class: "Pron. Relatif" }, { word: "où", class: "Pron. Relatif" },
  { word: "Qui ?", class: "Pron. Interrogatif" }, { word: "Que ?", class: "Pron. Interrogatif" }, { word: "Quoi ?", class: "Pron. Interrogatif" }
];

// 6 planètes. natures : boutons proposés (si > 6, 6 sont tirés au hasard à chaque vague)
// hue : rotation de teinte appliquée aux ennemis de la planète
const PLANETS = [
  { id: 1, name: "Rubicon", desc: "Désert rouge", speed: 1.1, hue: 0,
    natures: ['Nom', 'Verbe', 'Adjectif', 'Dét. Art. Défini', 'Dét. Art. Indéfini'],
    bossName: "Gardien des Dunes", bossImg: "boss_1", bossEmoji: "🦂", bossHp: 8,
    bg: "radial-gradient(circle at 50% 18%, #ff8a50 0%, #8a2d12 25%, #2b0c10 60%, #0c0a18 100%)",
    orb: "radial-gradient(circle at 35% 30%, #ffb27a, #c4501f 55%, #4a1409)" },
  { id: 2, name: "Aquaria", desc: "Planète océan", speed: 1.3, hue: 40,
    natures: ['Nom', 'Verbe', 'Adjectif', 'Adverbe', 'Préposition', 'Conjonction'],
    bossName: "Kraken des Abysses", bossImg: "boss_2", bossEmoji: "🐙", bossHp: 9,
    bg: "radial-gradient(circle at 50% 18%, #4fc3ff 0%, #0d5a9c 28%, #08254a 62%, #0c0a18 100%)",
    orb: "radial-gradient(circle at 35% 30%, #a8e6ff, #1a7fd1 55%, #08254a)" },
  { id: 3, name: "Sylvanis", desc: "Jungle lumineuse", speed: 1.5, hue: -60,
    natures: ['Dét. Art. Défini', 'Dét. Possessif', 'Dét. Démonstratif', 'Pron. Personnel', 'Pron. Relatif', 'Nom'],
    bossName: "Reine de la Ruche", bossImg: "boss_3", bossEmoji: "🐝", bossHp: 10,
    bg: "radial-gradient(circle at 50% 18%, #5dffb0 0%, #14803f 28%, #08331f 62%, #0c0a18 100%)",
    orb: "radial-gradient(circle at 35% 30%, #b8ffd2, #1e9c52 55%, #08331f)" },
  { id: 4, name: "Glacius", desc: "Monde de glace", speed: 1.7, hue: 120,
    natures: ['Dét. Art. Contracté', 'Dét. Indéfini', 'Dét. Numéral', 'Pron. Indéfini', 'Pron. Démonstratif', 'Pron. Possessif'],
    bossName: "Gardien des Dunes (version glacée)", bossImg: "boss_1", bossEmoji: "❄️", bossHp: 11,
    bg: "radial-gradient(circle at 50% 18%, #d6f4ff 0%, #6fb4d9 25%, #2a4a78 60%, #0c0a18 100%)",
    orb: "radial-gradient(circle at 35% 30%, #ffffff, #8fd0f0 55%, #2a4a78)" },
  { id: 5, name: "Ignis", desc: "Planète volcanique", speed: 1.9, hue: 200,
    natures: ALL_NATURES,
    bossName: "Kraken de Lave", bossImg: "boss_2", bossEmoji: "🌋", bossHp: 12,
    bg: "radial-gradient(circle at 50% 18%, #ffd34d 0%, #e8431a 25%, #4d0f0a 60%, #0c0a18 100%)",
    orb: "radial-gradient(circle at 35% 30%, #ffd34d, #e8431a 50%, #2a0a08)" },
  { id: 6, name: "Nébula Prime", desc: "Forteresse de l'Empereur", speed: 2.1, hue: -30,
    natures: ALL_NATURES,
    bossName: "L'Empereur", bossImg: "boss_final", bossEmoji: "👾", bossHp: 15,
    bg: "radial-gradient(circle at 50% 18%, #b266ff 0%, #4b1a8a 28%, #1a0933 62%, #05030c 100%)",
    orb: "radial-gradient(circle at 35% 30%, #d9a8ff, #6a2bb8 55%, #1a0933)" }
];

// Chemins des images (le jeu fonctionne sans, avec des visuels de secours)
const ASSET_PATHS = {
  ship1: "assets/ship/ship_tier1.png", ship2: "assets/ship/ship_tier2.png", ship3: "assets/ship/ship_tier3.png",
  ship4: "assets/ship/ship_tier4.png", ship5: "assets/ship/ship_tier5.png",
  scout: "assets/enemies/scout.png", cruiser: "assets/enemies/cruiser.png", admiral: "assets/enemies/admiral.png",
  boss_1: "assets/bosses/boss_1.png", boss_2: "assets/bosses/boss_2.png", boss_3: "assets/bosses/boss_3.png", boss_final: "assets/bosses/boss_final.png",
  bg_1: "assets/planets/bg_1.jpg", bg_2: "assets/planets/bg_2.jpg", bg_3: "assets/planets/bg_3.jpg",
  bg_4: "assets/planets/bg_4.jpg", bg_5: "assets/planets/bg_5.jpg", bg_6: "assets/planets/bg_6.jpg",
  bg_title: "assets/planets/bg_title.jpg",
  orb_1: "assets/planets/orb_1.png", orb_2: "assets/planets/orb_2.png", orb_3: "assets/planets/orb_3.png",
  orb_4: "assets/planets/orb_4.png", orb_5: "assets/planets/orb_5.png", orb_6: "assets/planets/orb_6.png",
  expl_enemy: "assets/fx/expl_enemy.png", expl_big: "assets/fx/expl_big.png", expl_player: "assets/fx/expl_player.png"
};

// Options de personnalisation
const SHIP_HUES = [ // rotation de teinte depuis le cyan de base
  { name: "Cyan", deg: 0 }, { name: "Bleu", deg: 40 }, { name: "Violet", deg: 100 }, { name: "Rose", deg: 140 },
  { name: "Rouge", deg: 180 }, { name: "Orange", deg: -150 }, { name: "Jaune", deg: -125 }, { name: "Vert", deg: -60 }, { name: "Noir", black: true, deg: 0 }
];
const LASER_COLORS = ["#ffc400", "#ff3b3b", "#39ff14", "#00e6e6", "#ff00ff", "#ffffff", "#000000"];
const BADGES = ["", "💀", "⭐", "🔥", "⚡", "🐉", "🦊", "💎", "🚀"];
// Couleur de l'aura (lueur / pulsation) : "auto" = comme le vaisseau
const AURA_COLORS = ["auto", "#00e6e6", "#4d7cff", "#b266ff", "#ff4fd8", "#ff3b3b", "#ff9a1f", "#ffe94d", "#39ff14", "#ffffff", "#000000"];
// Vitesse de jeu : f = facteur de vitesse des ennemis, m = multiplicateur de points
const SPEEDS = [
  { id: "cadet", name: "🐢 Cadet", f: 0.6, m: 1 }, { id: "pilote", name: "🚀 Pilote", f: 0.8, m: 1.5 },
  { id: "commandant", name: "⚡ Commandant", f: 1, m: 2 }, { id: "legende", name: "🔥 Légende", f: 1.3, m: 3 }
];
const AURAS = [
  { id: "none", name: "Aucune" }, { id: "glow", name: "Lueur" }, { id: "pulse", name: "Pulsation" }
];
