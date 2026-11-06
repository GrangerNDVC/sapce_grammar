// ===== SAUVEGARDE LOCALE PAR PROFIL + ÉVÉNEMENTS =====
// Un "profil" = un code élève (4 chiffres), 'local' (sans code) ou 'prof' (tests de l'enseignant, jamais envoyé en ligne).
// cloud.js synchronise ces données avec Firebase ; game.js ne connaît que SGStore.

const SGHooks = {
  _h: [],
  on(fn) { this._h.push(fn); },
  // Événements : game_start, planet_start, answer {planet,word,expected,chosen,correct}, missed {planet,word,nature},
  //              planet_cleared, game_over, progress_saved, cosmetics_saved
  onEvent(name, data) { this._h.forEach(fn => { try { fn(name, data); } catch (e) { console.warn(e); } }); }
};

const SGStore = {
  profile: 'local',
  setProfile(id) { this.profile = id || 'local'; },
  _k(name) { return 'sg_' + name + '_' + this.profile; },
  _get(key, def) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v === null ? def : v; }
    catch (e) { return def; }
  },
  _set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} },
  _del(key) { try { localStorage.removeItem(key); } catch (e) {} },
  _touch() { this._set(this._k('maj'), Date.now()); },
  getMaj() { return this._get(this._k('maj'), 0) || 0; },

  loadProgress() {
    let p = this._get(this._k('progress'), null);
    if (p === null && this.profile === 'local') p = this._get('sg_progress', null); // version précédente du jeu
    return Object.assign({ unlocked: 0, conquered: [], best: 0 }, p || {});
  },
  saveProgress(p) { this._set(this._k('progress'), p); this._touch(); SGHooks.onEvent('progress_saved', p); },

  loadCosmetics() {
    let c = this._get(this._k('cosmetics'), null);
    if (c === null && this.profile === 'local') c = this._get('sg_cosmetics', null);
    return Object.assign({ hue: 0, laser: "#ffc400", badge: "", aura: "glow", auraColor: "auto", black: false, speed: "cadet" }, c || {});
  },
  saveCosmetics(c) { this._set(this._k('cosmetics'), c); this._touch(); SGHooks.onEvent('cosmetics_saved', c); },

  // Statistiques : ok/ko globaux, par nature [ok, ko], mots ratés "mot|nature", confusions "attendu>choisi"
  loadStats() {
    return Object.assign({ ok: 0, ko: 0, nat: {}, miss: {}, conf: {}, last: 0 }, this._get(this._k('stats'), {}));
  },
  saveStats(s) {
    const top = (map, n) => Object.fromEntries(Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n));
    if (Object.keys(s.miss).length > 90) s.miss = top(s.miss, 60);
    if (Object.keys(s.conf).length > 60) s.conf = top(s.conf, 40);
    this._set(this._k('stats'), s); this._touch();
  },

  exportAll() { return { progress: this.loadProgress(), cos: this.loadCosmetics(), stats: this.loadStats() }; },
  importAll(d, maj) {
    if (d.progress) this._set(this._k('progress'), d.progress);
    if (d.cos) this._set(this._k('cosmetics'), d.cos);
    if (d.stats) this._set(this._k('stats'), d.stats);
    this._set(this._k('maj'), maj || Date.now());
  },
  resetProfile() { ['progress', 'cosmetics', 'stats', 'maj'].forEach(n => this._del(this._k(n))); }
};
