// ===== SAUVEGARDE LOCALE + POINTS D'ACCROCHE POUR FIREBASE (chantier 4) =====
// Aujourd'hui : tout est stocké dans localStorage.
// Plus tard : on remplacera le contenu de SGStore.* par Firebase sans toucher à game.js.

const SGStore = {
  _get(key, def) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v === null ? def : v; }
    catch (e) { return def; }
  },
  _set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} },

  loadProgress() {
    return Object.assign({ unlocked: 0, conquered: [], best: 0 }, this._get('sg_progress', {}));
  },
  saveProgress(p) { this._set('sg_progress', p); SGHooks.onEvent('progress_saved', p); },

  loadCosmetics() {
    return Object.assign({ hue: 0, laser: "#ffc400", badge: "", aura: "glow" }, this._get('sg_cosmetics', {}));
  },
  saveCosmetics(c) { this._set('sg_cosmetics', c); }
};

// Chaque événement important du jeu passe par ici.
// Le chantier Firebase branchera onEvent pour remonter la progression à l'enseignant.
// Événements : game_start, planet_start, answer {word, expected, chosen, correct}, planet_cleared, game_over, progress_saved
const SGHooks = {
  onEvent: function (name, data) { /* branché plus tard */ }
};
