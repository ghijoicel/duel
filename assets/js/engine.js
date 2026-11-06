'use strict';
/* Mesin logika murni (tanpa DOM), bisa diuji di Node. */
(function (root) {
  const TILES = 9, MAXSEQ = 30, LIVES = 3, TIME = 8;
  function createGame(count) {
    const n = Math.min(4, Math.max(2, Number.isInteger(count) ? count : 2));
    const g = { n, players: Array.from({ length: n }, (_, i) => ({ id: i, lives: LIVES, score: 0, alive: true })),
      seq: [], turn: 0, phase: 'add', idx: 0, timer: TIME, over: false, winner: -1, events: [] };
    const ev = (type, o) => { if (g.events.length < 100) g.events.push(Object.assign({ type }, o)); };
    const cur = () => g.players[g.turn];
    g.reverse = () => g.seq.length > 0 && g.seq.length % 5 === 0; // tiap kelipatan 5: ulangi MUNDUR
    const end = () => {
      g.over = true; g.phase = 'over';
      const s = [...g.players].sort((a, b) => b.lives - a.lives || b.score - a.score);
      g.winner = s[0].lives === s[1].lives && s[0].score === s[1].score ? -1 : s[0].id;
      ev('over');
    };
    const next = () => {
      if (g.players.filter(p => p.alive).length <= 1 || g.seq.length >= MAXSEQ) return end();
      do { g.turn = (g.turn + 1) % n; } while (!cur().alive);
      g.idx = 0; g.phase = g.seq.length ? 'watch' : 'add'; g.timer = TIME; ev('turn', { p: g.turn });
    };
    const fail = reason => {
      const p = cur(); p.lives--; ev('wrong', { p: p.id, reason });
      if (p.lives <= 0) { p.alive = false; ev('out', { p: p.id }); }
      next();
    };
    g.beginInput = () => { if (g.phase === 'watch' && !g.over) { g.phase = 'repeat'; g.idx = 0; g.timer = TIME; } };
    g.press = t => {
      if (g.over || !Number.isInteger(t) || t < 0 || t >= TILES) return false;
      if (g.phase === 'repeat') {
        const L = g.seq.length, exp = g.reverse() ? g.seq[L - 1 - g.idx] : g.seq[g.idx];
        if (t !== exp) { fail('wrong'); return false; }
        g.idx++; ev('ok', { t });
        if (g.idx >= L) { cur().score += L; g.phase = 'add'; g.idx = 0; g.timer = TIME; ev('done'); }
        return true;
      }
      if (g.phase === 'add') { g.seq.push(t); ev('added', { t }); next(); return true; }
      return false;
    };
    g.tick = dt => {
      if (g.over || g.phase === 'watch' || !(dt > 0)) return;
      g.timer -= Math.min(dt, 0.1);
      if (g.timer <= 0) fail('timeout');
    };
    return g;
  }
  const api = { createGame, TILES, MAXSEQ, LIVES, TIME };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SinapsisEngine = api;
})(typeof self !== 'undefined' ? self : this);
