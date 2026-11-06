# Sinapsis Duel — CinemaX Brain Games
Duel memori 2–4 pemain di **satu perangkat** (bergantian). Perhatikan urutan petak bercahaya, ulangi, tambahkan satu petak baru,
lalu giliran pemain berikutnya. Tiap pemain 3 ❤️; salah atau telat 8 detik = −1 ❤️. Tiap kelipatan 5 petak: ulangi MUNDUR.
Terakhir bertahan menang (atau nyawa & poin terbanyak jika urutan mencapai 30).

Buka `index.html`. Kontrol: ketuk petak atau tombol 1–9 · F layar penuh · P jeda · M suara.
Bukan multiplayer online (itu butuh server). Keamanan: CSP ketat, tanpa innerHTML/eval/jaringan.
Uji: `node tests/test.js`.
