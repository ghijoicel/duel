'use strict';
/* Tampilan & input. Tanpa innerHTML/eval/jaringan. */
(() => {
  const E = window.SinapsisEngine; if (!E) return;
  const $ = id => document.getElementById(id);
  const tiles = [...document.querySelectorAll('.tile')], stage = $('stage'), board = $('board');
  const NOTES = [262, 294, 330, 392, 440, 523, 587, 659, 784];
  const KEY = 'sinapsis.best';
  const load = () => { try { const n = parseInt(localStorage.getItem(KEY), 10); return Number.isInteger(n) && n >= 0 && n <= E.MAXSEQ ? n : 0; } catch { return 0; } };
  const save = n => { try { localStorage.setItem(KEY, String(n)); } catch { /* abaikan */ } };

  let g = null, count = 2, state = 'ready', busy = true, tok = 0, muted = false, ac = null, best = load(), last = 0, toastTO = 0, cards = [];
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const beep = (f, d = 0.25, type = 'sine', v = 0.07) => {
    if (muted) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), gn = ac.createGain(), t = ac.currentTime;
      o.type = type; o.frequency.value = f; gn.gain.setValueAtTime(v, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(gn); gn.connect(ac.destination); o.start(t); o.stop(t + d);
    } catch { /* audio tidak tersedia */ }
  };
  const light = (i, ms = 300) => { const t = tiles[i]; t.classList.add('lit'); beep(NOTES[i], ms / 1000 + 0.15); setTimeout(() => t.classList.remove('lit'), ms); };
  const toast = msg => { const t = $('toast'); t.textContent = ''; const b = document.createElement('b'); b.textContent = msg; t.append(b); t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); clearTimeout(toastTO); toastTO = setTimeout(() => t.classList.remove('show'), 2300); };

  /* layar penuh & suara */
  const reqFS = stage.requestFullscreen || stage.webkitRequestFullscreen;
  const isFS = () => (document.fullscreenElement || document.webkitFullscreenElement) === stage;
  const toggleFS = async () => { try { if (isFS()) await (document.exitFullscreen || document.webkitExitFullscreen).call(document); else await reqFS.call(stage); } catch { toast('Layar penuh tidak diizinkan browser'); } };
  const syncFS = () => { $('bFs').textContent = isFS() ? '🗗' : '⛶'; $('bFs').setAttribute('aria-label', isFS() ? 'Keluar layar penuh' : 'Layar penuh'); };
  if (!reqFS) { $('bFs').disabled = true; $('bFs').title = 'Browser ini tidak mendukung layar penuh'; }
  $('bFs').addEventListener('click', toggleFS);
  document.addEventListener('fullscreenchange', syncFS); document.addEventListener('webkitfullscreenchange', syncFS);
  $('bMute').addEventListener('click', () => { muted = !muted; $('bMute').textContent = muted ? '🔇' : '🔊'; });

  /* papan skor */
  const buildScore = () => {
    const box = $('score'); box.textContent = ''; cards = [];
    for (let i = 0; i < count; i++) {
      const d = document.createElement('div'); d.className = 'pc';
      const nm = document.createElement('b'); nm.textContent = 'Pemain ' + (i + 1);
      const pt = document.createElement('span'); pt.className = 'pts';
      const hp = document.createElement('span'); hp.className = 'hp';
      d.append(nm, pt, hp); box.append(d); cards.push({ d, pt, hp });
    }
  };
  const updateScore = () => g && g.players.forEach((p, i) => {
    const c = cards[i]; c.pt.textContent = p.score + ' poin'; c.hp.textContent = '❤️'.repeat(p.lives) + '🖤'.repeat(E.LIVES - p.lives);
    c.d.classList.toggle('active', i === g.turn && !g.over); c.d.classList.toggle('out', !p.alive);
  });
  const setStatus = () => {
    const s = $('status'); s.textContent = '';
    const main = document.createElement('span'), sub = document.createElement('small'); let m, u;
    if (g.over) { m = 'Selesai'; u = ''; }
    else if (g.phase === 'watch' || busy) { m = 'Pemain ' + (g.turn + 1) + ' — perhatikan!'; u = g.reverse() ? 'Nanti ulangi MUNDUR ⏪' : 'Hafalkan urutannya'; }
    else if (g.phase === 'repeat') { m = 'Pemain ' + (g.turn + 1) + ' — ulangi ' + (g.reverse() ? 'MUNDUR ⏪' : 'urutan'); u = (g.idx) + ' / ' + g.seq.length; }
    else { m = 'Pemain ' + (g.turn + 1) + ' — tambah 1 petak ✨'; u = 'Pilih petak baru'; }
    main.textContent = m; sub.textContent = u; s.append(main, sub);
    $('len').textContent = String(g.seq.length); $('best').textContent = String(best);
    board.classList.toggle('locked', busy);
  };

  /* alur */
  const overlay = (t, p, b, sel) => { $('ovT').textContent = t; $('ovP').textContent = p; $('btn').textContent = b; $('sel').hidden = !sel; $('ov').hidden = false; $('btn').focus({ preventScroll: true }); };
  const start = () => { g = E.createGame(count); buildScore(); state = 'play'; $('ov').hidden = true; beep(523, 0.2); runTurn(); };
  const pause = () => { if (state === 'play') { tok++; state = 'pause'; overlay('Jeda', 'Permainan ditahan sebentar.', 'Lanjutkan', false); } };
  const resume = () => { state = 'play'; $('ov').hidden = true; last = performance.now(); runTurn(); };
  async function runTurn() {
    const my = ++tok; busy = true; updateScore(); setStatus();
    if (g.phase === 'watch') {
      await sleep(g.events.length ? 1100 : 700);
      const d = Math.max(240, 520 - g.seq.length * 9);
      for (const t of g.seq) { if (my !== tok || state !== 'play') return; light(t, d * 0.75); await sleep(d); }
      if (my !== tok) return; g.beginInput();
    }
    busy = false; updateScore(); setStatus();
  }
  const finish = () => {
    state = 'over'; busy = true; updateScore(); setStatus();
    const w = g.winner;
    overlay(w >= 0 ? '🏆 Pemain ' + (w + 1) + ' menang!' : 'Seri! 🤝', 'Urutan terpanjang: ' + g.seq.length + (g.seq.length > best ? ' — rekor baru!' : ''), 'Main Lagi', true);
    if (g.seq.length > best) { best = g.seq.length; save(best); }
  };
  const handle = () => {
    let turn = false;
    for (const e of g.events) {
      if (e.type === 'wrong') { toast('Pemain ' + (e.p + 1) + (e.reason === 'timeout' ? ' kehabisan waktu' : ' salah') + '! −1 ❤️'); board.classList.remove('shake'); void board.offsetWidth; board.classList.add('shake'); beep(110, 0.35, 'sawtooth', 0.06); }
      else if (e.type === 'out') toast('Pemain ' + (e.p + 1) + ' tersingkir 💀');
      else if (e.type === 'done') { toast('✔ Benar! Sekarang tambah 1 petak'); beep(880, 0.2); }
      else if (e.type === 'turn') turn = true;
      else if (e.type === 'added' && g.seq.length > best && !g.over) { best = g.seq.length; save(best); }
    }
    const over = g.over; g.events.length = 0; updateScore();
    if (over) finish(); else if (turn) runTurn(); else setStatus();
  };
  const input = i => {
    if (state !== 'play' || busy || g.over || (g.phase !== 'repeat' && g.phase !== 'add')) return;
    light(i, 220); g.press(i); handle();
  };
  tiles.forEach(t => t.addEventListener('click', () => input(Number(t.dataset.i))));
  $('btn').addEventListener('click', () => (state === 'pause' ? resume() : start()));
  $('sel').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { count = Number(b.dataset.n); $('sel').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const k = e.key.toLowerCase();
    if (/^[1-9]$/.test(k)) input(Number(k) - 1);
    else if (k === 'f') toggleFS(); else if (k === 'm') $('bMute').click();
    else if (k === 'p' || k === 'escape') { if (state === 'play') pause(); else if (state === 'pause') resume(); }
  });
  addEventListener('blur', pause); document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

  g = E.createGame(count); buildScore(); updateScore(); setStatus();
  overlay('Sinapsis Duel', 'Asah ingatanmu. Yang paling lama bertahan menang!' + (best ? ' Rekor urutan: ' + best : ''), 'Mulai Duel', true);
  const frame = ts => {
    requestAnimationFrame(frame); const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    if (state === 'play' && !busy) { g.tick(dt); if (g.events.length) handle(); }
    $('tbar').style.setProperty('--v', state === 'play' && !busy && !g.over ? (g.timer / E.TIME * 100).toFixed(1) : '100');
  };
  requestAnimationFrame(frame);
})();
