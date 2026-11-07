(() => {
  const $ = id => document.getElementById(id);
  const box = $('game-container');
  const MAX_LIVES = 10;
  const KILLS_PER_WAVE = 8;
  const SHIP_HALF = 45;          // demi-largeur du vaisseau (px)
  const KEY_SPEED = 9;           // vitesse clavier (px par image)

  let progress = SGStore.loadProgress();
  let cos = SGStore.loadCosmetics();
  let S = null;                  // état de la partie en cours
  const assetOK = {};            // image dispo ? (true/false)
  let tickTimer = null, spawnTimer = null, bannerTimer = null;
  let teacherMode = false;
  const cheat = { infiniteLives: false, bossHp1: false };
  const keys = { left: false, right: false };
  let shipX = 0, targetX = 0, shipVX = 0, lastHint = 0;

  // ---------- IMAGES (avec repli si absentes) ----------
  function preload() {
    Object.entries(ASSET_PATHS).forEach(([key, src]) => {
      const im = new Image();
      im.onload = () => { assetOK[key] = true; refreshVisuals(); };
      im.onerror = () => { assetOK[key] = false; };
      im.src = src;
    });
  }
  const src = key => assetOK[key] ? ASSET_PATHS[key] : null;

  // ---------- VAISSEAU DU JOUEUR ----------
  function fallbackShipSVG(tier) {
    let s = '<svg viewBox="0 0 100 100"><polygon points="50,4 62,62 50,54 38,62" fill="#00e6e6" stroke="#fff" stroke-width="1.5"/>';
    s += '<polygon points="38,60 14,86 40,76" fill="#0aa" stroke="#fff" stroke-width="1.5"/><polygon points="62,60 86,86 60,76" fill="#0aa" stroke="#fff" stroke-width="1.5"/>';
    s += '<circle cx="50" cy="40" r="6" fill="#bff" stroke="#fff"/>';
    if (tier >= 2) s += '<rect x="20" y="64" width="4" height="14" fill="#fff"/><rect x="76" y="64" width="4" height="14" fill="#fff"/>';
    if (tier >= 3) s += '<polygon points="38,62 4,70 30,82" fill="#08a"/><polygon points="62,62 96,70 70,82" fill="#08a"/>';
    if (tier >= 4) s += '<rect x="45" y="62" width="10" height="16" fill="#ffc400"/>';
    if (tier >= 5) s += '<circle cx="50" cy="56" r="6" fill="#fff" opacity=".9"/><polygon points="50,0 56,14 44,14" fill="#ffc400"/>';
    s += '<polygon points="44,78 56,78 50,95" fill="#ffc400" opacity=".85"/></svg>';
    return s;
  }
  function hueColor(deg) { return 'hsl(' + ((180 + deg + 360) % 360) + ',100%,60%)'; }
  // Couleur du vaisseau : rotation de teinte, ou version noire
  function tintFilter() {
    return cos.black ? 'grayscale(1) brightness(.4) contrast(1.35) drop-shadow(0 0 2px rgba(255,255,255,.7))'
                     : 'hue-rotate(' + cos.hue + 'deg)';
  }
  // Couleur de l'aura (lueur / pulsation) : choisie à part, ou "comme le vaisseau"
  function auraCss() {
    if (cos.auraColor && cos.auraColor !== 'auto') return cos.auraColor;
    return cos.black ? '#ffffff' : hueColor(cos.hue);
  }
  function shipBody(tier) {
    const s = src('ship' + tier);
    return '<div class="body"><div class="tint" style="filter:' + tintFilter() + '">' +
      (s ? '<img src="' + s + '" alt="">' : fallbackShipSVG(tier)) + '</div></div>' +
      (cos.badge ? '<div class="badge">' + cos.badge + '</div>' : '');
  }
  function applyShip(el, tier) {
    el.classList.remove('aura-none', 'aura-glow', 'aura-pulse');
    el.classList.add('aura-' + cos.aura);
    el.style.setProperty('--shipglow', auraCss());
    el.innerHTML = shipBody(tier);
  }
  function shipTier() { return S ? Math.min(5, S.idx + 1) : Math.min(5, progress.unlocked + 1); }

  function refreshVisuals() {
    document.documentElement.style.setProperty('--laser', cos.laser);
    if (S) { applyShip($('ship'), shipTier()); setBg(S.idx); }
    else setBg(null);
    applyShip($('ship-preview'), Math.min(5, progress.unlocked + 1));
    if ($('map-screen').classList.contains('show')) renderMap();
  }
  function setBg(idx) {
    const bg = $('bg');
    const key = idx === null ? 'bg_title' : 'bg_' + (idx + 1);
    if (src(key)) { bg.style.backgroundImage = 'url(' + src(key) + ')'; }
    else bg.style.backgroundImage = idx === null ? 'radial-gradient(circle at 50% 30%, #3a1d7a, #0c0a18 70%)' : PLANETS[idx].bg;
  }

  // ---------- ÉCRANS ----------
  function showScreen(id) {
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('show'));
    if (id) {
      $(id).classList.add('show');
      setHud(false);
      if (window.SGMusic) SGMusic.screen(id);
    }
  }
  function setHud(on) {
    $('info-bar').style.display = on ? 'flex' : 'none';
    $('controls').style.display = on ? 'flex' : 'none';
    $('ship').style.display = on ? 'block' : 'none';
    $('cheatbar').style.display = (on && teacherMode) ? 'flex' : 'none';
    if (!on) { $('boss').style.display = 'none'; $('boss-bar-wrap').style.display = 'none'; }
  }

  function speedLevel() { return SPEEDS.find(x => x.id === cos.speed) || SPEEDS[0]; }
  const pts = n => Math.round(n * speedLevel().m);
  function renderSpeed() {
    const c = $('opt-speed'); c.innerHTML = '';
    SPEEDS.forEach(sp => {
      const d = document.createElement('div');
      d.className = 'pill' + (sp.id === speedLevel().id ? ' on' : '');
      d.textContent = sp.name + ' ×' + sp.m;
      d.onclick = () => { cos.speed = sp.id; SGStore.saveCosmetics(cos); renderSpeed(); };
      c.appendChild(d);
    });
  }
  function renderMap() {
    renderSpeed();
    const grid = $('planet-grid'); grid.innerHTML = '';
    PLANETS.forEach((p, i) => {
      const locked = i > progress.unlocked, done = progress.conquered.includes(i);
      const card = document.createElement('div');
      card.className = 'planet-card' + (locked ? ' locked' : '') + (done ? ' done' : '') + (!locked && !done ? ' next' : '');
      const orbSrc = src('orb_' + (i + 1));
      card.innerHTML = '<div class="orb" style="background-image:' + (orbSrc ? 'url(' + orbSrc + ')' : p.orb) + '"></div>' +
        p.name + '<small>' + (locked ? '🔒 verrouillée' : done ? '✅ conquise' : '▶ à conquérir') + '<br>' + p.desc + '</small>';
      if (!locked) card.onclick = () => { SFX.unlock(); startPlanet(i); };
      grid.appendChild(card);
    });
  }

  // ---------- PERSONNALISATION ----------
  function renderCustom() {
    const mk = (id, items, isOn, onPick, render) => {
      const c = $(id); c.innerHTML = '';
      items.forEach(it => {
        const d = document.createElement('div');
        d.className = (id === 'opt-aura' ? 'pill' : 'swatch') + (isOn(it) ? ' on' : '');
        render(d, it);
        d.onclick = () => { onPick(it); SGStore.saveCosmetics(cos); refreshVisuals(); renderCustom(); };
        c.appendChild(d);
      });
    };
    const darkRing = (d, c) => { if (c === '#000000' || c === '#111') d.style.boxShadow = 'inset 0 0 0 1px #777'; };
    mk('opt-hue', SHIP_HUES,
      h => h.black ? !!cos.black : (!cos.black && h.deg === cos.hue),
      h => { cos.black = !!h.black; if (!h.black) cos.hue = h.deg; },
      (d, h) => { d.style.background = h.black ? '#111' : hueColor(h.deg); d.title = h.name; darkRing(d, h.black ? '#111' : ''); });
    mk('opt-laser', LASER_COLORS, c => c === cos.laser, c => cos.laser = c, (d, c) => { d.style.background = c; darkRing(d, c); });
    mk('opt-badge', BADGES, b => b === cos.badge, b => cos.badge = b, (d, b) => { d.textContent = b || '∅'; });
    mk('opt-aura', AURAS, a => a.id === cos.aura, a => cos.aura = a.id, (d, a) => { d.textContent = a.name; });
    mk('opt-auracolor', AURA_COLORS, c => c === (cos.auraColor || 'auto'), c => cos.auraColor = c, (d, c) => {
      if (c === 'auto') { d.textContent = '='; d.title = 'Comme le vaisseau'; d.style.background = 'linear-gradient(135deg,#00e6e6,#ff00ff)'; }
      else { d.style.background = c; darkRing(d, c); }
    });
    $('opt-auracolor').parentElement.style.opacity = cos.aura === 'none' ? .4 : 1;
  }

  // ---------- PARTIE ----------
  function startPlanet(idx) {
    stopLoops();
    S = { idx, mult: speedLevel().m, wave: 0, kills: 0, lives: MAX_LIVES, score: 0, running: false, paused: true,
          bossHp: 0, bossMax: 0, admiralDone: false, admiralDead: false, active: [], planet: PLANETS[idx] };
    box.querySelectorAll('.enemy, .laser-beam, .explosion').forEach(e => e.remove());
    showScreen(null);
    $('ship').style.opacity = '';
    setHud(true);
    setBg(idx);
    applyShip($('ship'), shipTier());
    shipX = targetX = playW() / 2; shipVX = 0;
    $('ship').style.left = shipX + 'px';
    $('ship').classList.add('ship-upgrade'); setTimeout(() => $('ship').classList.remove('ship-upgrade'), 1000);
    if (window.SGMusic) SGMusic.planet(idx);
    SGHooks.onEvent('planet_start', { planet: idx + 1 });
    beginWave();
    tickTimer = setInterval(tick, 16);
  }

  function stopLoops() { clearInterval(tickTimer); clearTimeout(spawnTimer); clearTimeout(bannerTimer); tickTimer = null; }

  function banner(text, ms) {
    const b = $('banner'); b.innerHTML = text; b.style.opacity = 1;
    clearTimeout(bannerTimer); bannerTimer = setTimeout(() => { b.style.opacity = 0; }, ms);
  }

  function beginWave() {
    S.paused = true; S.running = true; S.kills = 0; S.admiralDone = false; S.admiralDead = false;
    clearTimeout(spawnTimer);
    box.querySelectorAll('.enemy').forEach(e => e.remove());
    S.active = [];
    const p = S.planet;
    const isBoss = S.wave === 2;
    $('boss').style.display = 'none'; $('boss-bar-wrap').style.display = 'none';
    generateButtons();
    updateHud();
    let txt;
    if (S.wave === 0) txt = 'PLANÈTE ' + p.id + '<br>' + p.name.toUpperCase();
    else if (S.wave === 1) txt = 'VAGUE 2<br>⚠ L\'AMIRAL ARRIVE';
    else txt = '⚠ BOSS ⚠<br>' + p.bossName.toUpperCase();
    banner(txt, 1700);
    if (S.wave > 0) SFX.levelup();
    if (isBoss && window.SGMusic) SGMusic.boss(S.idx === PLANETS.length - 1);
    setTimeout(() => {
      if (!S || !S.running) return;
      if (isBoss) showBoss();
      S.paused = false;
      scheduleSpawn(300);
    }, 1800);
  }

  function showBoss() {
    const p = S.planet;
    S.bossMax = S.bossHp = cheat.bossHp1 ? 1 : p.bossHp;
    const b = $('boss');
    const s = src(p.bossImg);
    b.className = '';
    b.innerHTML = s ? '<img src="' + s + '" alt="" style="filter:hue-rotate(' + p.hue + 'deg)">'
                    : '<div class="fb" style="filter:hue-rotate(' + p.hue + 'deg)">' + p.bossEmoji + '</div>';
    b.style.display = 'block';
    $('boss-name').textContent = p.bossName.toUpperCase();
    $('boss-bar-wrap').style.display = 'block';
    $('boss-bar-fill').style.width = '100%';
  }

  // ---------- BAC À MUNITIONS (à droite) : ↑ ↓ pour choisir, Espace pour tirer, ou clic / toucher ----------
  function generateButtons() {
    const c = $('controls'); c.innerHTML = '';
    const pool = S.planet.natures;
    let list = pool;
    if (pool.length > 6) list = [...pool].sort(() => 0.5 - Math.random()).slice(0, 6);
    S.buttons = list; S.sel = 0;
    const t = document.createElement('div'); t.className = 'bay-title'; t.textContent = 'MUNITIONS'; c.appendChild(t);
    list.forEach((n, i) => {
      const b = document.createElement('button');
      b.className = 'tense-button'; b.tabIndex = -1; b.dataset.i = i; b.dataset.nature = n;
      b.innerHTML = '<span class="k">' + (i + 1) + '</span><span class="n"></span><span class="ab"></span>';
      b.querySelector('.n').textContent = n;
      b.querySelector('.ab').textContent = ABBR[n] || n;
      b.title = n;
      c.appendChild(b);
    });
    const h = document.createElement('div'); h.className = 'bay-hint'; h.innerHTML = '↑↓ choisir<br>Espace tirer'; c.appendChild(h);
    paintBay();
  }
  function paintBay() {
    document.querySelectorAll('#controls .tense-button').forEach(b => b.classList.toggle('sel', +b.dataset.i === S.sel));
  }
  function moveSel(d) {
    if (!S || !S.buttons) return;
    const n = S.buttons.length;
    S.sel = (S.sel + d + n) % n; paintBay();
  }
  function fire(i) {
    if (!S || !S.running || !S.buttons) return;
    if (i !== undefined) { S.sel = i; paintBay(); }
    const b = document.querySelector('#controls .tense-button[data-i="' + S.sel + '"]');
    if (b) { b.classList.add('fired'); setTimeout(() => b.classList.remove('fired'), 180); }
    onAnswer(S.buttons[S.sel]);
  }

  function spawnRate() {
    const base = S.wave === 2 ? 1800 - S.idx * 90 : 2300 - S.idx * 150 - S.wave * 100;
    // un peu plus lent qu'avant : il faut le temps de se placer en face de l'ennemi
    return Math.max(1000, (base + 250) / (0.4 + 0.6 * speedLevel().f));
  }
  function scheduleSpawn(delay) {
    clearTimeout(spawnTimer);
    spawnTimer = setTimeout(() => {
      if (S && S.running && !S.paused) {
        if (S.active.length < 5) createEnemy();
        scheduleSpawn(spawnRate());
      }
    }, delay);
  }

  function pickWord(excludeWord) {
    const pool = WORDS.filter(w => S.buttons.includes(w.class) && w.word !== excludeWord);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function createEnemy(forceKind) {
    let kind = forceKind;
    if (!kind) {
      if (S.wave === 1 && !S.admiralDone && S.kills >= 3) { kind = 'admiral'; S.admiralDone = true; }
      else kind = (S.wave >= 1 && Math.random() < 0.35) ? 'cruiser' : 'scout';
    }
    const w = pickWord(); if (!w) return;
    const sz = kind === 'admiral' ? 130 : kind === 'cruiser' ? 96 : 76;
    const el = document.createElement('div');
    el.className = 'enemy ' + kind;
    el.style.setProperty('--sz', sz + 'px');
    el.dataset.nature = w.class; el.dataset.kind = kind; el.dataset.hp = kind === 'admiral' ? 2 : 1; el.dataset.sz = sz;
    const s = src(kind);
    const fb = { scout: '#4B0082', cruiser: '#8a1c5c', admiral: '#b8860b' }[kind];
    el.innerHTML = (kind === 'admiral' ? '<div class="hp">❤❤</div>' : '') +
      (s ? '<img src="' + s + '" alt="" style="filter:hue-rotate(' + S.planet.hue + 'deg)">'
         : '<div class="fbshape" style="--fb:' + fb + ';filter:hue-rotate(' + S.planet.hue + 'deg)"></div>') +
      '<div class="word"></div>';
    el.querySelector('.word').textContent = w.word;
    el.style.top = (S.wave === 2 ? 150 : -(sz + 40)) + 'px';
    el.style.visibility = 'hidden';
    box.appendChild(el);
    const ww = el.offsetWidth;
    el.style.left = Math.floor(Math.random() * Math.max(0, playW() - ww - 10)) + 'px';
    el.style.visibility = 'visible';
    S.active.push(el);
  }

  // largeur de la zone de jeu = conteneur moins le bac à munitions
  function playW() { const c = $('controls'); return box.clientWidth - (c.offsetWidth || 0); }
  function speed() { return (S.planet.speed + S.wave * 0.12 + (S.wave === 2 ? 0.15 : 0)) * speedLevel().f; }

  // ---------- DÉPLACEMENT : flèches (ou Q/D, A/D) + souris/doigt, utilisables en même temps ----------
  function moveShip() {
    const W = playW();
    if (keys.left) targetX -= KEY_SPEED;
    if (keys.right) targetX += KEY_SPEED;
    targetX = Math.max(SHIP_HALF, Math.min(W - SHIP_HALF, targetX));
    shipVX = Math.max(-16, Math.min(16, (targetX - shipX) * 0.3));
    shipX += shipVX;
    const ship = $('ship');
    ship.style.left = shipX + 'px';
    const body = ship.firstChild;
    if (body && body.style) body.style.transform = 'rotate(' + (shipVX * 0.7).toFixed(1) + 'deg)';
  }
  // L'ennemi "en face" = le plus bas dont le centre est dans la colonne du vaisseau
  function tolerance(el) { return Math.max(34, (parseFloat(el.dataset.sz) || 70) / 2) + 8; }
  function lockedEnemy() {
    let best = null;
    for (const el of S.active) {
      if (el.classList.contains('destroyed')) continue;
      const cx = el.offsetLeft + el.offsetWidth / 2;
      if (Math.abs(cx - shipX) <= tolerance(el) && (!best || el.offsetTop > best.offsetTop)) best = el;
    }
    return best;
  }

  function tick() {
    if (!S || !S.running) return;
    moveShip();
    if (S.paused) return;
    const lk = lockedEnemy();
    const limit = $('ship').offsetTop - 10;
    const v = speed();
    for (const el of S.active.slice()) {
      el.classList.toggle('locked', el === lk);
      if (el.classList.contains('destroyed')) continue;
      const top = parseFloat(el.style.top);
      const nt = top + v * (el.dataset.kind === 'admiral' ? 0.75 : 1);
      el.style.top = nt + 'px';
      if (nt + el.offsetHeight > limit) {
        SGHooks.onEvent('missed', { planet: S.idx + 1, word: el.querySelector('.word').textContent, nature: el.dataset.nature });
        removeEnemy(el); loseLife(); if (!S || !S.running) return;
      }
    }
  }
  function removeEnemy(el) { el.remove(); if (S) S.active = S.active.filter(e => e !== el); }

  // ---------- TIRS ----------
  function laserCount() { return shipTier() >= 5 ? 3 : shipTier() >= 3 ? 2 : 1; }
  function shootLaser(target) {
    SFX.laser();
    const g = box.getBoundingClientRect(), sh = $('ship').getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const sx = sh.left - g.left + sh.width / 2, sy = sh.top - g.top;
    const ex = t.left - g.left + t.width / 2, ey = t.top - g.top + t.height / 2;
    const n = laserCount();
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * 14;
      const l = document.createElement('div'); l.className = 'laser-beam';
      l.style.left = (sx + off) + 'px'; l.style.top = sy + 'px'; box.appendChild(l);
      requestAnimationFrame(() => { l.style.left = (ex + off * 0.3) + 'px'; l.style.top = ey + 'px'; });
      setTimeout(() => l.remove(), 300);
    }
  }
  function shootAir() {   // tir dans le vide : aucun ennemi en face
    SFX.laser();
    const g = box.getBoundingClientRect(), sh = $('ship').getBoundingClientRect();
    const l = document.createElement('div'); l.className = 'laser-beam';
    l.style.left = (sh.left - g.left + sh.width / 2) + 'px'; l.style.top = (sh.top - g.top) + 'px'; box.appendChild(l);
    requestAnimationFrame(() => { l.style.top = '40px'; });
    setTimeout(() => l.remove(), 300);
  }
  function hintAlign() {
    const now = Date.now(); if (now - lastHint < 2500) return; lastHint = now;
    banner('Place-toi en face<br>d\'un ennemi !', 1100);
  }

  // ---------- EXPLOSIONS ----------
  function explode(cx, cy, size, key) {
    const d = document.createElement('div');
    d.className = 'explosion';
    d.style.left = (cx - size / 2) + 'px'; d.style.top = (cy - size / 2) + 'px';
    d.style.width = size + 'px'; d.style.height = size + 'px';
    const s = src(key);
    if (s) d.innerHTML = '<img src="' + s + '" alt="">';
    else d.classList.add('fb', ...(key === 'expl_player' ? ['blue'] : []));
    box.appendChild(d);
    setTimeout(() => d.remove(), 700);
  }
  function centerOf(el) {
    const r = el.getBoundingClientRect(), g = box.getBoundingClientRect();
    return { x: r.left - g.left + r.width / 2, y: r.top - g.top + r.height / 2, w: r.width, h: r.height };
  }

  // ---------- RÉPONSES ----------
  function onAnswer(chosen) {
    if (!S || !S.running || S.paused) return;
    const target = lockedEnemy();
    if (!target) { shootAir(); hintAlign(); return; }   // pas en face : rien ne se passe
    const word = target.querySelector('.word').textContent;
    const ok = target.dataset.nature === chosen;
    SGHooks.onEvent('answer', { planet: S.idx + 1, word, expected: target.dataset.nature, chosen, correct: ok });
    if (!ok) { loseLife(); return; }

    shootLaser(target);
    S.kills++; S.score += pts(1);
    const hp = parseInt(target.dataset.hp) - 1;
    if (S.wave === 2) hitBoss();
    if (hp > 0) { // amiral touché mais pas détruit
      target.dataset.hp = hp;
      target.classList.add('hit'); setTimeout(() => target.classList.remove('hit'), 500);
      const h = target.querySelector('.hp'); if (h) h.textContent = '❤';
      const nw = pickWord(word);
      target.querySelector('.word').textContent = nw.word; target.dataset.nature = nw.class;
      S.score += pts(1);
    } else {
      if (target.dataset.kind === 'admiral') { S.score += pts(2); S.admiralDead = true; }
      setTimeout(() => {
        SFX.boom();
        const c = centerOf(target), k = target.dataset.kind;
        explode(c.x, c.y, k === 'admiral' ? 200 : k === 'cruiser' ? 140 : 110, k === 'admiral' ? 'expl_big' : 'expl_enemy');
        target.classList.add('destroyed');
        S && (S.active = S.active.filter(e => e !== target));
        setTimeout(() => target.remove(), 220);
      }, 150);
    }
    updateHud();
    if (S.wave === 0 && S.kills >= KILLS_PER_WAVE) waveCleared();
    else if (S.wave === 1 && S.kills >= KILLS_PER_WAVE && S.admiralDead) waveCleared();
  }

  function hitBoss() {
    if (S.bossHp <= 0) return;
    S.bossHp--;
    $('boss-bar-fill').style.width = Math.max(0, S.bossHp / S.bossMax * 100) + '%';
    const b = $('boss'); b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 500);
    SFX.bossHit();
    if (S.bossHp <= 0) bossDefeated();
  }

  function waveCleared() {
    S.wave++;
    S.score += pts(3);
    beginWave();
  }

  function loseLife() {
    SFX.error();
    if (!cheat.infiniteLives) S.lives--;
    updateHud();
    box.style.boxShadow = '0 0 30px #ff2d2d'; setTimeout(() => { box.style.boxShadow = ''; }, 200);
    if (S.lives <= 0) gameOver();
  }

  function bossDefeated() {
    S.running = false; stopLoops();
    SFX.bossDown();
    if (window.SGMusic) SGMusic.fadeOut();
    const bc = centerOf($('boss'));
    for (let i = 0; i < 5; i++) {
      setTimeout(() => explode(bc.x + (Math.random() - .5) * bc.w * .7, bc.y + (Math.random() - .5) * bc.h * .6, 150 + Math.random() * 80, 'expl_big'), i * 180);
    }
    $('boss').classList.add('dying');
    S.score += pts(10);
    box.querySelectorAll('.enemy').forEach(e => e.classList.add('destroyed'));
    const idx = S.idx;
    if (!progress.conquered.includes(idx)) progress.conquered.push(idx);
    progress.unlocked = Math.max(progress.unlocked, Math.min(PLANETS.length - 1, idx + 1));
    progress.best = Math.max(progress.best, S.score);
    SGStore.saveProgress(progress);
    SGHooks.onEvent('planet_cleared', { planet: idx + 1, score: S.score, lives: S.lives });
    setTimeout(() => {
      box.querySelectorAll('.enemy').forEach(e => e.remove());
      const last = idx === PLANETS.length - 1;
      const newTier = Math.min(5, idx + 2);
      $('win-title').textContent = last ? '🏆 GALAXIE CONQUISE ! 🏆' : 'PLANÈTE CONQUISE !';
      $('win-text').innerHTML = S.planet.name + ' est libérée ! Score : ' + S.score + ' · Vies restantes : ' + S.lives +
        (!last && newTier > Math.min(5, idx + 1) ? '<br><br>🔧 Ton vaisseau évolue au niveau ' + newTier + ' !' : '') +
        (last ? '<br><br>Tu es le meilleur identificateur de la galaxie !' : '');
      $('btn-next').style.display = last ? 'none' : '';
      showScreen('win-screen');
      applyShip($('ship-preview'), Math.min(5, progress.unlocked + 1));
    }, 1300);
  }

  function gameOver() {
    S.running = false; stopLoops();
    if (window.SGMusic) SGMusic.fadeOut();
    SGHooks.onEvent('game_over', { planet: S.idx + 1, score: S.score });
    progress.best = Math.max(progress.best, S.score); SGStore.saveProgress(progress);
    $('over-text').textContent = 'Planète ' + S.planet.name + ' · Score : ' + S.score + ' · Meilleur : ' + progress.best;
    const sc = centerOf($('ship'));
    SFX.bossDown();
    explode(sc.x, sc.y, 200, 'expl_player');
    $('ship').style.opacity = 0;
    setTimeout(() => showScreen('over-screen'), 900);
  }

  function updateHud() {
    if (!S) return;
    $('i-score').textContent = 'Score : ' + S.score + (S.mult > 1 ? ' (×' + S.mult + ')' : '');
    $('i-planet').textContent = 'Planète ' + S.planet.id;
    $('i-wave').textContent = S.wave === 2 ? 'BOSS' : 'Vague ' + (S.wave + 1) + '/3';
    $('i-lives').textContent = 'Vies : ' + (cheat.infiniteLives ? '∞' : S.lives);
  }

  // ---------- OUTILS ENSEIGNANT (barre de triche) ----------
  function cheatSkip() {
    if (!S || !S.running || S.paused) return;
    if (S.wave < 2) waveCleared(); else cheatKillBoss();
  }
  function cheatKillBoss() {
    if (!S || !S.running || S.paused) return;
    if (S.wave < 2) { S.wave = 1; waveCleared(); return; }   // saute d'abord jusqu'au boss
    S.bossHp = 0; $('boss-bar-fill').style.width = '0%'; bossDefeated();
  }
  function cheatLives() { if (S) { S.lives = MAX_LIVES; updateHud(); } }
  function cheatToMap() {
    stopLoops(); if (S) S.running = false;
    box.querySelectorAll('.enemy, .laser-beam, .explosion').forEach(e => e.remove());
    $('banner').style.opacity = 0;
    S = null; renderMap(); setBg(null); showScreen('map-screen');
  }
  $('ch-skip').onclick = cheatSkip;
  $('ch-boss').onclick = cheatKillBoss;
  $('ch-lives').onclick = cheatLives;
  $('ch-map').onclick = cheatToMap;

  // ---------- ÉVÉNEMENTS ----------
  $('controls').addEventListener('mousedown', e => e.preventDefault());   // le bac ne prend jamais le focus (sinon Espace re-cliquerait)
  $('controls').addEventListener('click', e => { const b = e.target.closest('.tense-button'); if (b) fire(+b.dataset.i); });
  document.addEventListener('keydown', e => {
    if (!S || !S.running) return;
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'q' || k === 'Q' || k === 'a' || k === 'A') { keys.left = true; e.preventDefault(); return; }
    if (k === 'ArrowRight' || k === 'd' || k === 'D') { keys.right = true; e.preventDefault(); return; }
    if (k === 'ArrowUp' || k === 'z' || k === 'Z' || k === 'w' || k === 'W') { moveSel(-1); e.preventDefault(); return; }
    if (k === 'ArrowDown' || k === 's' || k === 'S') { moveSel(1); e.preventDefault(); return; }
    if (k === ' ' || k === 'Enter') { e.preventDefault(); if (!e.repeat) fire(); return; }
    const i = parseInt(k) - 1;
    if (i >= 0 && S.buttons && S.buttons[i]) fire(i);
  });
  document.addEventListener('keyup', e => {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'q' || k === 'Q' || k === 'a' || k === 'A') keys.left = false;
    if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = false;
  });
  window.addEventListener('blur', () => { keys.left = keys.right = false; });
  // Souris / doigt : le vaisseau suit le pointeur (sauf près des boutons, pour ne pas dériver quand on va cliquer)
  function steer(e) {
    if (!S || !S.running) return;
    const r = box.getBoundingClientRect();
    if (e.target.closest && e.target.closest('#controls')) return;   // sur le bac : on ne déplace pas le vaisseau
    targetX = e.clientX - r.left;
  }
  box.addEventListener('pointermove', steer);
  box.addEventListener('pointerdown', steer);

  $('btn-play').onclick = () => { SFX.unlock(); renderMap(); showScreen('map-screen'); SGHooks.onEvent('game_start', {}); };
  $('btn-custom').onclick = () => { SFX.unlock(); renderCustom(); showScreen('custom-screen'); };
  $('btn-custom-ok').onclick = () => { showScreen('title-screen'); };
  $('btn-map-back').onclick = () => showScreen('title-screen');
  $('btn-win-map').onclick = () => { S = null; renderMap(); showScreen('map-screen'); setBg(null); };
  $('btn-over-map').onclick = () => { S = null; renderMap(); showScreen('map-screen'); setBg(null); };
  $('btn-retry').onclick = () => startPlanet(S.idx);
  $('btn-next').onclick = () => startPlanet(Math.min(PLANETS.length - 1, S.idx + 1));

  // ---------- API pour cloud.js (comptes, espace enseignant) ----------
  window.SGGame = {
    cheat,
    reloadProfile() { progress = SGStore.loadProgress(); cos = SGStore.loadCosmetics(); refreshVisuals(); },
    isIdle: () => !S || !S.running,
    show: id => showScreen(id),
    openMap() { cheatToMap(); },
    setTeacherMode(on) {
      teacherMode = on;
      if (!on) { cheat.infiniteLives = false; cheat.bossHp1 = false; }
      setHud(false);
    },
    unlockAll() { progress.unlocked = PLANETS.length - 1; SGStore.saveProgress(progress); refreshVisuals(); },
    resetTest() { if (SGStore.profile === 'prof') { SGStore.resetProfile(); this.reloadProfile(); } }
  };

  // ---------- DÉMARRAGE ----------
  setHud(false);
  showScreen('title-screen');
  preload();
  refreshVisuals();
})();
