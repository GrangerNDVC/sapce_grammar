// ===== MUSIQUES (facultatives) =====
// Dépose les fichiers dans assets/music/ avec ces noms : s'il manque un fichier, le jeu reste simplement silencieux.
const SGMusic = (() => {
  const FILES = {
    title: 'assets/music/title.mp3', map: 'assets/music/map.mp3',
    planet_1: 'assets/music/planet_1.mp3', planet_2: 'assets/music/planet_2.mp3', planet_3: 'assets/music/planet_3.mp3',
    planet_4: 'assets/music/planet_4.mp3', planet_5: 'assets/music/planet_5.mp3', planet_6: 'assets/music/planet_6.mp3',
    boss: 'assets/music/boss.mp3', boss_final: 'assets/music/boss_final.mp3',
    victory: 'assets/music/victory.mp3', gameover: 'assets/music/gameover.mp3'
  };
  const ONESHOT = { victory: true, gameover: true };
  const VOL = 0.45;
  const cache = {};
  let cur = null, curKey = null, wanted = null, muted = false, fadeTimer = null;
  try { muted = localStorage.getItem('sg_muted') === '1'; } catch (e) {}

  function get(key) {
    if (cache[key] !== undefined) return cache[key];
    const a = new Audio();
    a.preload = 'auto'; a.loop = !ONESHOT[key]; a.volume = 0; a.src = FILES[key];
    a.addEventListener('error', () => { cache[key] = null; if (curKey === key) { curKey = null; cur = null; } });
    return (cache[key] = a);
  }
  function fade(a, to, ms, done) {
    if (!a) return;
    const from = a.volume, steps = Math.max(1, Math.round(ms / 50)); let i = 0;
    const t = setInterval(() => {
      i++; a.volume = Math.max(0, Math.min(1, from + (to - from) * i / steps));
      if (i >= steps) { clearInterval(t); if (done) done(); }
    }, 50);
  }
  function stopCurrent(ms) {
    const a = cur; cur = null; curKey = null;
    if (a) fade(a, 0, ms, () => { try { a.pause(); } catch (e) {} });
  }
  function play(key) {
    wanted = key;
    if (muted || !FILES[key]) return;
    if (curKey === key && cur && !cur.paused) return;
    const a = get(key); if (!a) return;
    stopCurrent(500);
    a.currentTime = 0; a.volume = 0;
    const p = a.play();
    cur = a; curKey = key;
    if (p && p.catch) p.catch(() => { if (curKey === key) { cur = null; curKey = null; } });   // son bloqué avant le 1er clic : on réessaie ensuite
    fade(a, VOL, ONESHOT[key] ? 50 : 900);
  }
  function retry() { if (wanted && !muted && !curKey) play(wanted); }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, retry, { passive: true }));

  const btn = document.getElementById('btn-mute');
  function paintBtn() { if (btn) btn.textContent = muted ? '🔇' : '🔊'; }
  if (btn) btn.onclick = () => {
    muted = !muted;
    try { localStorage.setItem('sg_muted', muted ? '1' : '0'); } catch (e) {}
    paintBtn();
    if (muted) stopCurrent(200); else if (wanted) play(wanted);
  };
  paintBtn();

  return {
    screen(id) {
      if (id === 'title-screen' || id === 'custom-screen') play('title');
      else if (id === 'map-screen') play('map');
      else if (id === 'win-screen') play('victory');
      else if (id === 'over-screen') play('gameover');
      else if (id === 'teacher-screen') { wanted = null; stopCurrent(300); }
    },
    planet(idx) { play('planet_' + (idx + 1)); },
    boss(final) { play(final ? 'boss_final' : 'boss'); },
    fadeOut() { wanted = null; stopCurrent(600); }
  };
})();
