// Jalankan: node tests/test.js
const E = require('../assets/js/engine.js'); const assert = require('assert');
let seed = 3; const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const inv = g => { g.players.forEach(p => assert(p.lives >= 0 && p.lives <= 3 && p.alive === (p.lives > 0))); assert(g.seq.every(t => t >= 0 && t < 9) && g.seq.length <= 30); assert(g.players[g.turn].alive || g.over); g.events.length = 0; };
const expected = g => g.reverse() ? [...g.seq].reverse() : g.seq;
// 1) fuzz: input acak/tak valid
for (let r = 0; r < 60; r++) { seed = r + 11; const g = E.createGame(2 + (r % 3));
  for (let k = 0; k < 3000 && !g.over; k++) { if (g.phase === 'watch' && rng() < 0.7) g.beginInput(); g.press([rng() * 9 | 0, -1, 9, NaN, 1.5][rng() * 5 | 0]); g.tick(rng() * 3); inv(g); } }
// 2) pemain sempurna: harus selesai di panjang maksimum tanpa kehilangan nyawa
{ seed = 9; const g = E.createGame(3);
  while (!g.over) { if (g.phase === 'watch') { g.beginInput(); expected(g).forEach(t => g.press(t)); } if (g.phase === 'add') g.press(rng() * 9 | 0); inv(g); }
  assert(g.seq.length === 30 && g.players.every(p => p.lives === 3), 'permainan sempurna harus mencapai 30 tanpa kesalahan'); }
// 3) mode mundur: urutan maju salah, mundur benar
{ const g = E.createGame(2); [0, 1, 2, 3, 4].forEach(t => { if (g.phase === 'watch') { g.beginInput(); expected(g).forEach(x => g.press(x)); } g.press(t); g.events.length = 0; });
  assert(g.reverse() && g.seq.length === 5); g.beginInput(); assert(g.press(g.seq[4]), 'urutan mundur benar harus diterima'); }
// 4) pemain yang selalu salah tersingkir & lawan menang
{ const g = E.createGame(2); g.press(1); g.beginInput(); while (!g.over) { if (g.phase === 'watch') g.beginInput(); const p = g.turn; if (p === 0) g.press((expected(g)[g.idx] + 1) % 9); else { if (g.phase === 'repeat') expected(g).forEach(t => g.press(t)); if (g.phase === 'add') g.press(2); } inv(g); }
  assert(g.winner === 1, 'pemain yang tak pernah benar harus kalah'); }
// 5) timeout mengurangi nyawa
{ const g = E.createGame(2); g.tick(0.1); for (let i = 0; i < 100; i++) g.tick(0.1); assert(g.players[0].lives === 2 && g.turn === 1, 'timeout harus mengurangi nyawa & ganti giliran'); }
console.log('OK — fuzz, permainan sempurna, mode mundur, eliminasi, timeout lulus');
