// ===== FIREBASE : comptes élèves (code à 4 chiffres) + espace enseignant =====
// Si Firebase est bloqué (réseau de l'école) ou absent, le jeu fonctionne quand même : tout reste sur l'appareil.
// Sécurité : voir firebase/database.rules.json. Les données des élèves sont considérées comme NON FIABLES :
// l'espace enseignant les affiche uniquement avec textContent (jamais innerHTML).
const SGCloud = (() => {
  const $ = id => document.getElementById(id);
  const TIMEOUT = 8000;
  let auth = null, db = null;
  let code = null;                 // code élève connecté (ou null)
  let teacher = false;             // session enseignant ouverte
  let pushTimer = null, pending = false;
  let students = {};               // données chargées côté enseignant

  // ---------- Outils ----------
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms || TIMEOUT))]);
  const num = v => { v = Number(v); return isFinite(v) ? v : 0; };
  const parse = s => { try { const o = JSON.parse(s); return (o && typeof o === 'object') ? o : null; } catch (e) { return null; } };
  const path = c => SG_DB_PATH + '/' + c;
  // construit un élément avec du TEXTE (jamais de HTML)
  function h(tag, text, cls) {
    const e = document.createElement(tag);
    if (text !== undefined && text !== null) e.textContent = String(text);
    if (cls) e.className = cls;
    return e;
  }
  function fmtDate(t) {
    t = num(t); if (!t) return '—';
    const d = new Date(t), now = new Date();
    const hh = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return d.toDateString() === now.toDateString() ? 'aujourd\'hui ' + hh : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' + hh;
  }

  function init() {
    try {
      if (typeof firebase === 'undefined') return false;
      const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(SG_FIREBASE_CONFIG);
      auth = firebase.auth(app); db = firebase.database(app);
      return true;
    } catch (e) { console.warn('Firebase indisponible', e); auth = db = null; return false; }
  }

  async function ensureAnon() {
    await withTimeout(new Promise(res => { const off = auth.onAuthStateChanged(() => { off(); res(); }); }));
    if (auth.currentUser && !auth.currentUser.isAnonymous) await auth.signOut();   // une session enseignant ne sert pas aux élèves
    if (!auth.currentUser) await auth.signInAnonymously();
  }

  // ---------- Élève : connexion ----------
  const msg = t => { $('login-msg').textContent = t || ''; };
  function showLogin() { $('login-box').style.display = 'flex'; $('menu-box').style.display = 'none'; $('code-input').value = ''; }
  function showMenu(text) {
    $('login-box').style.display = 'none'; $('menu-box').style.display = 'flex';
    $('who').textContent = (code ? 'Élève ' + code : 'Mode sans code') + (text ? ' · ' + text : '');
  }

  function payload() {
    const st = SGStore.exportAll();
    let donnees = JSON.stringify(st);
    if (donnees.length > 55000) { st.stats.miss = {}; st.stats.conf = {}; donnees = JSON.stringify(st); }
    let maj = SGStore.getMaj();
    if (!maj) { maj = Date.now(); SGStore._set(SGStore._k('maj'), maj); }
    const resume = JSON.stringify({ u: st.progress.unlocked, c: st.progress.conquered.length, b: st.progress.best,
                                    ok: st.stats.ok, ko: st.stats.ko, t: st.stats.last });
    return { v: 1, maj, donnees, resume };
  }
  async function push() {
    pending = false; clearTimeout(pushTimer);
    if (!db || !code || teacher || SGStore.profile !== code) return;
    try { await withTimeout(ensureAnon()); await withTimeout(db.ref(path(code)).set(payload())); }
    catch (e) { pending = true; console.warn('Envoi différé', e.message); }
  }
  function schedulePush(delay) {
    if (!db || !code || teacher) return;
    pending = true; clearTimeout(pushTimer); pushTimer = setTimeout(push, delay);
  }
  function flush() { if (pending) push(); }

  async function login(c, auto) {
    if (!/^\d{4}$/.test(c)) { msg('Le code doit avoir exactement 4 chiffres.'); return; }
    $('btn-login').disabled = true; msg('Connexion…');
    const hadLocal = (() => { SGStore.setProfile(c); return SGStore.getMaj() > 0; })();
    let status = '';
    if (db) {
      try {
        await withTimeout(ensureAnon());
        const r = (await withTimeout(db.ref(path(c)).once('value'))).val();
        if (!r) {
          if (!auto && !hadLocal && !confirm('Le code ' + c + ' n\'existe pas encore.\nCréer ce code ? (vérifie que tu as bien tapé tes 4 chiffres)')) {
            SGStore.setProfile('local'); $('btn-login').disabled = false; msg(''); return;
          }
          code = c; await withTimeout(db.ref(path(c)).set(payload())); status = '✓ nouveau compte';
        } else {
          code = c;
          const rm = num(r.maj), d = parse(r.donnees);
          if (d && rm > SGStore.getMaj()) { SGStore.importAll(d, rm); status = '✓ progression retrouvée'; }
          else { if (rm < SGStore.getMaj()) await withTimeout(db.ref(path(c)).set(payload())); status = '✓ synchronisé'; }
        }
      } catch (e) {
        code = c; pending = true; status = '⚠ hors ligne (progression gardée sur cet appareil)'; console.warn(e.message);
      }
    } else { code = c; status = '⚠ hors ligne (progression gardée sur cet appareil)'; }
    try { localStorage.setItem('sg_code', c); } catch (e) {}
    SGGame.reloadProfile(); msg(''); $('btn-login').disabled = false;
    showMenu(status);
  }

  async function logout() {
    await push();
    code = null; pending = false;
    try { localStorage.removeItem('sg_code'); } catch (e) {}
    SGStore.setProfile('local'); SGGame.reloadProfile(); showLogin();
  }

  function playLocal() {
    code = null; SGStore.setProfile('local'); SGGame.reloadProfile(); showMenu('rien n\'est sauvegardé en ligne');
  }

  // ---------- Statistiques (alimentées par les événements du jeu) ----------
  function recordAnswer(nature, correct, word, chosen) {
    const s = SGStore.loadStats();
    const n = s.nat[nature] || [0, 0];
    if (correct) { s.ok++; n[0]++; } else {
      s.ko++; n[1]++;
      const k = String(word).slice(0, 40) + '|' + nature; s.miss[k] = (s.miss[k] || 0) + 1;
      if (chosen) { const c = nature + '>' + chosen; s.conf[c] = (s.conf[c] || 0) + 1; }
    }
    s.nat[nature] = n; s.last = Date.now();
    SGStore.saveStats(s);
  }
  SGHooks.on((name, d) => {
    if (SGStore.profile === 'prof') return;                     // les tests de l'enseignant ne comptent pas
    if (name === 'answer') { recordAnswer(d.expected, d.correct, d.word, d.chosen); schedulePush(20000); }
    else if (name === 'missed') { recordAnswer(d.nature, false, d.word, null); schedulePush(20000); }
    else if (name === 'planet_cleared' || name === 'game_over') schedulePush(1500);
    else if (name === 'progress_saved' || name === 'cosmetics_saved') schedulePush(2500);
  });
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('online', flush);

  // ---------- Enseignant ----------
  const tStatus = t => { $('t-status').textContent = t || ''; };

  async function teacherLogin() {
    if (teacher) { SGGame.show('teacher-screen'); return; }
    if (!auth) { alert('Firebase n\'est pas joignable (réseau ou connexion). Réessaie plus tard.'); return; }
    try {
      await flushNow();
      const res = await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      if (!res.user || res.user.email !== SG_TEACHER_EMAIL) { await auth.signOut(); alert('Ce compte n\'a pas accès à l\'espace enseignant.'); return; }
    } catch (e) { if (e && e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') alert('Connexion impossible : ' + (e.message || e)); return; }
    teacher = true;
    SGStore.setProfile('prof'); SGGame.reloadProfile(); SGGame.setTeacherMode(true);
    SGGame.show('teacher-screen'); tab('eleves'); loadStudents();
  }
  async function flushNow() { if (pending && code) await push(); }

  async function leaveTeacher() {
    teacher = false; SGGame.setTeacherMode(false);
    try { await auth.signOut(); } catch (e) {}
    SGStore.setProfile(code || 'local'); SGGame.reloadProfile(); SGGame.show('title-screen');
  }

  function tab(name) {
    $('t-eleves').style.display = name === 'eleves' ? '' : 'none';
    $('t-outils').style.display = name === 'outils' ? '' : 'none';
    $('tab-eleves').classList.toggle('on', name === 'eleves');
    $('tab-outils').classList.toggle('on', name === 'outils');
  }

  async function loadStudents() {
    tStatus('Chargement…'); $('t-detail').textContent = '';
    try {
      const v = (await withTimeout(db.ref(SG_DB_PATH).once('value'), 15000)).val() || {};
      students = {};
      Object.keys(v).filter(k => /^\d{4}$/.test(k)).forEach(k => { if (v[k] && typeof v[k] === 'object') students[k] = v[k]; });
      tStatus(Object.keys(students).length + ' élève(s) · ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      renderList();
    } catch (e) { tStatus('Chargement impossible : ' + (e.message || e)); }
  }

  function summary(r) {
    const s = parse(r.resume) || {};
    return { u: num(s.u), c: num(s.c), b: num(s.b), ok: num(s.ok), ko: num(s.ko), t: num(s.t) };
  }
  const pct = (ok, ko) => (ok + ko) ? Math.round(100 * ok / (ok + ko)) : null;

  function renderList() {
    const box = $('t-list'); box.textContent = '';
    const codes = Object.keys(students).sort();
    if (!codes.length) { box.appendChild(h('p', 'Aucun élève pour l\'instant.')); return; }
    const tbl = h('table', null, 't-table'), thead = h('thead'), tr = h('tr');
    ['Code', 'Planètes', 'Meilleur', 'Réussite', 'Réponses', 'Dernière activité'].forEach(t => tr.appendChild(h('th', t)));
    thead.appendChild(tr); tbl.appendChild(thead);
    const tb = h('tbody');
    codes.forEach(c => {
      const s = summary(students[c]), p = pct(s.ok, s.ko), row = h('tr');
      [c, s.c + '/' + PLANETS.length, s.b, p === null ? '—' : p + ' %', s.ok + s.ko, fmtDate(s.t)].forEach(t => row.appendChild(h('td', t)));
      row.onclick = () => renderDetail(c);
      tb.appendChild(row);
    });
    tbl.appendChild(tb); box.appendChild(tbl);
  }

  function renderDetail(c) {
    const box = $('t-detail'); box.textContent = '';
    const r = students[c]; if (!r) return;
    const d = parse(r.donnees) || {}, st = d.stats || {}, pr = d.progress || {};
    box.appendChild(h('h3', 'Élève ' + c + ' · planètes conquises : ' + ((pr.conquered && pr.conquered.length) || 0) + '/' + PLANETS.length));

    box.appendChild(h('h3', 'Réussite par nature (les plus faibles d\'abord)'));
    const rows = Object.entries(st.nat || {}).map(([n, v]) => ({ n: String(n).slice(0, 40), ok: num(v && v[0]), ko: num(v && v[1]) }))
      .filter(x => x.ok + x.ko > 0).map(x => Object.assign(x, { p: Math.round(100 * x.ok / (x.ok + x.ko)) })).sort((a, b) => a.p - b.p);
    if (!rows.length) box.appendChild(h('p', 'Pas encore de réponses.'));
    rows.forEach(x => {
      const line = h('div', null, 't-bar-row'), bar = h('div', null, 't-bar'), fill = h('div', null, 't-fill ' + (x.p >= 80 ? 'good' : x.p >= 50 ? 'mid' : 'bad'));
      fill.style.width = x.p + '%'; bar.appendChild(fill);
      line.appendChild(h('span', x.n, 'lab')); line.appendChild(bar); line.appendChild(h('span', x.p + ' % (' + x.ok + '/' + (x.ok + x.ko) + ')'));
      box.appendChild(line);
    });

    const top = (map, n) => Object.entries(map || {}).map(([k, v]) => [String(k).slice(0, 60), num(v)]).sort((a, b) => b[1] - a[1]).slice(0, n);
    const miss = top(st.miss, 10);
    if (miss.length) {
      box.appendChild(h('h3', 'Mots les plus ratés'));
      box.appendChild(h('p', miss.map(([k, v]) => { const [w, n] = k.split('|'); return w + ' (' + (n || '?') + ') ×' + v; }).join(' · ')));
    }
    const conf = top(st.conf, 8);
    if (conf.length) {
      box.appendChild(h('h3', 'Confusions fréquentes'));
      box.appendChild(h('p', conf.map(([k, v]) => k.replace('>', ' pris pour ') + ' ×' + v).join(' · ')));
    }

    const acts = h('div', null, 't-actions');
    const b1 = h('button', '🔓 Débloquer toutes les planètes', 'btn dark sm'), b2 = h('button', '♻ Remettre la progression à zéro', 'btn dark sm'), b3 = h('button', '🗑 Supprimer cet élève', 'btn dark sm');
    b1.onclick = () => writeStudent(c, o => { o.progress = Object.assign({ conquered: [], best: 0 }, o.progress, { unlocked: PLANETS.length - 1 }); });
    b2.onclick = () => { if (confirm('Remettre à zéro la progression de ' + c + ' ? (ses statistiques sont conservées)')) writeStudent(c, o => { o.progress = { unlocked: 0, conquered: [], best: 0 }; }); };
    b3.onclick = async () => {
      if (!confirm('Supprimer définitivement l\'élève ' + c + ' ?')) return;
      try { await withTimeout(db.ref(path(c)).remove()); delete students[c]; box.textContent = ''; renderList(); } catch (e) { alert('Échec : ' + e.message); }
    };
    [b1, b2, b3].forEach(b => acts.appendChild(b)); box.appendChild(acts);
  }

  async function writeStudent(c, mutate) {
    const r = students[c]; if (!r) return;
    const d = parse(r.donnees) || {}; mutate(d);
    const resume = Object.assign(summary(r), { u: num(d.progress && d.progress.unlocked), c: num(d.progress && d.progress.conquered && d.progress.conquered.length), b: num(d.progress && d.progress.best) });
    const nr = { v: 1, maj: Date.now(), donnees: JSON.stringify(d), resume: JSON.stringify(resume) };
    try { await withTimeout(db.ref(path(c)).set(nr)); students[c] = nr; renderList(); renderDetail(c); tStatus('Modifié : l\'élève le verra à sa prochaine connexion.'); }
    catch (e) { alert('Échec : ' + e.message); }
  }

  function exportCSV() {
    const q = v => '"' + String(v).replace(/"/g, '""') + '"';
    const head = ['Code', 'Planètes conquises', 'Planètes débloquées', 'Meilleur score', 'Bonnes réponses', 'Erreurs', 'Réussite %', 'Dernière activité'].concat(ALL_NATURES.map(n => 'Réussite ' + n + ' %'));
    const lines = [head.map(q).join(';')];
    Object.keys(students).sort().forEach(c => {
      const r = students[c], s = summary(r), d = parse(r.donnees) || {}, nat = (d.stats && d.stats.nat) || {};
      const p = pct(s.ok, s.ko);
      const row = [c, s.c, s.u + 1, s.b, s.ok, s.ko, p === null ? '' : p, s.t ? new Date(s.t).toLocaleString('fr-FR') : '']
        .concat(ALL_NATURES.map(n => { const v = nat[n]; const o = num(v && v[0]), k = num(v && v[1]); return (o + k) ? Math.round(100 * o / (o + k)) : ''; }));
      lines.push(row.map(q).join(';'));
    });
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'eleves-natures.csv';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------- Branchements ----------
  const ok = init();
  $('code-input').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); });
  $('code-input').addEventListener('keydown', e => { if (e.key === 'Enter') login($('code-input').value, false); e.stopPropagation(); });
  $('code-input').addEventListener('keyup', e => e.stopPropagation());
  $('btn-login').onclick = () => login($('code-input').value, false);
  $('btn-nocode').onclick = playLocal;
  $('btn-logout').onclick = logout;
  $('btn-teacher').onclick = teacherLogin;
  $('t-refresh').onclick = loadStudents;
  $('t-csv').onclick = exportCSV;
  $('t-play').onclick = () => SGGame.openMap();
  $('t-out').onclick = leaveTeacher;
  $('tab-eleves').onclick = () => tab('eleves');
  $('tab-outils').onclick = () => tab('outils');
  $('tool-unlock').onclick = () => SGGame.unlockAll();
  $('tool-reset').onclick = () => { if (confirm('Réinitialiser ton profil de test ?')) SGGame.resetTest(); };
  $('tool-inf').onchange = e => { SGGame.cheat.infiniteLives = e.target.checked; };
  $('tool-boss1').onchange = e => { SGGame.cheat.bossHp1 = e.target.checked; };

  // reconnexion automatique de l'élève de cet appareil
  let saved = null; try { saved = localStorage.getItem('sg_code'); } catch (e) {}
  if (saved && /^\d{4}$/.test(saved)) login(saved, true); else showLogin();

  return { login, logout, push, teacherLogin };
})();
