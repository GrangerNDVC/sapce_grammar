// ===== SONS synthétisés (aucun fichier audio nécessaire) =====
const SFX = (() => {
  let ctx = null;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, endFreq, dur, type, vol) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 20), c.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.08, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  }
  function noise(dur, vol) {
    const c = ac(); if (!c) return;
    const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), g = c.createGain();
    s.buffer = buf; g.gain.value = vol || 0.12;
    s.connect(g); g.connect(c.destination); s.start();
  }
  return {
    unlock: () => ac(),
    laser: () => tone(900, 200, 0.15, 'square', 0.06),
    boom: () => noise(0.25, 0.12),
    error: () => tone(160, 70, 0.3, 'sawtooth', 0.09),
    levelup: () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, f, 0.18, 'triangle', 0.09), i * 110)); },
    bossHit: () => { tone(300, 120, 0.2, 'square', 0.08); noise(0.15, 0.1); },
    bossDown: () => { noise(0.9, 0.18); tone(400, 40, 0.9, 'sawtooth', 0.1); }
  };
})();
