/* Погаси свет: нажатие меняет клетку и её соседей, цель — выключить всё поле */
window.GAMES = window.GAMES || {};
window.GAMES.lights = {
  title: 'Погаси свет', desc: 'Выключи все лампочки', cat: 'puzzle', isNew4: true, medals: [1200, 3000, 5000],
  hint: 'Нажатие на лампочку меняет её и соседние по горизонтали и вертикали. Погаси все лампочки за как можно меньше нажатий. Пять полей подряд: чем меньше ходов, тем больше очков.',
  d0: 'Поле 3×3', d1: 'Поле 4×4', d2: 'Поле 5×5', d3: 'Поле 5×5, длинная перемешка',
  colors: ['#facc15', '#f97316'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#1e1b4b"/><circle cx="50" cy="44" r="20" fill="#fde047"/><rect x="41" y="62" width="18" height="12" rx="3" fill="#fde047"/><path d="M50 18v-4M72 44h6M22 44h-6M66 26l4-4M34 26l-4-4" stroke="#fde047" stroke-width="3" stroke-linecap="round"/></svg>',
  create: function (api) {
    var N, grid, moves, round, cs, gx, gy;
    var ROUNDS = 5, SCRAMBLE = [6, 9, 12, 18];
    var PLUS = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
    function layout() {
      cs = Math.floor(Math.min(api.W - 24, api.H - 150) / N);
      gx = (api.W - cs * N) / 2; gy = 80 + Math.max(0, (api.H - 110 - cs * N) / 2);
    }
    function press(r, c) {
      PLUS.forEach(function (d) {
        var y = r + d[0], x = c + d[1];
        if (y >= 0 && x >= 0 && y < N && x < N) grid[y * N + x] = !grid[y * N + x];
      });
    }
    function solved() { return grid.every(function (v) { return !v; }); }
    function newRound() {
      N = [3, 4, 5, 5][api.diff]; grid = [];
      for (var i = 0; i < N * N; i++) grid.push(false);
      for (i = 0; i < SCRAMBLE[api.diff] + round; i++) press(Math.floor(Math.random() * N), Math.floor(Math.random() * N));
      if (solved()) press(0, 0);
      moves = 0; layout();
    }
    return {
      reset: function () { round = 0; newRound(); },
      resize: function () { if (N) layout(); }, idle: function () { }, update: function () { }, key: function () { },
      input: function (type, d) {
        if (type !== 'down') return;
        var c = Math.floor((d.x - gx) / cs), r = Math.floor((d.y - gy) / cs);
        if (c < 0 || r < 0 || c >= N || r >= N) return;
        press(r, c); moves++; api.sound('click'); api.vibrate(15);
        if (!solved()) return;
        api.addScore(Math.max(60, 400 * (api.diff + 1) - moves * 20));
        api.fx.confetti(30); api.sound('win'); round++;
        if (round >= ROUNDS) api.gameOver(); else newRound();
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        c.fillStyle = '#0b1020'; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '800 18px system-ui'; c.fillStyle = '#e2e8f0';
        c.fillText('Поле ' + (round + 1) + ' / ' + ROUNDS + '   ·   ходов: ' + moves, W / 2, 42);
        for (var i = 0; i < N * N; i++) {
          var x = gx + (i % N) * cs, y = gy + Math.floor(i / N) * cs;
          c.fillStyle = grid[i] ? '#fde047' : '#1e1b4b';
          c.beginPath(); c.roundRect ? c.roundRect(x + 4, y + 4, cs - 8, cs - 8, 12) : c.rect(x + 4, y + 4, cs - 8, cs - 8); c.fill();
        }
      }
    };
  }
};
