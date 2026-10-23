/* Заливка: меняй цвет области у левого верхнего угла, пока всё поле не станет одного цвета */
window.GAMES = window.GAMES || {};
window.GAMES.flood = {
  title: 'Заливка', desc: 'Залей поле одним цветом', cat: 'puzzle', isNew4: true, medals: [1000, 2200, 3600],
  hint: 'Внизу выбери цвет: область от левого верхнего угла зальётся им и сольётся с соседними клетками. Залей всё поле одним цветом, пока не кончились ходы. Чем больше ходов осталось после победы, тем больше очков.',
  d0: '8×8, 4 цвета, 22 хода', d1: '10×10, 5 цветов, 22 хода', d2: '10×10, 5 цветов, 18 ходов', d3: '12×12, 6 цветов, 20 ходов',
  colors: ['#f97316', '#ec4899'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#fff"/><circle cx="30" cy="30" r="13" fill="#ef4444"/><circle cx="70" cy="30" r="13" fill="#3b82f6"/><circle cx="30" cy="70" r="13" fill="#22c55e"/><circle cx="70" cy="70" r="13" fill="#eab308"/></svg>',
  create: function (api) {
    var N, K, left, board, cs, gx, gy, round;
    var PAL = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#f97316'];
    var SIZE = [8, 10, 10, 12], COLS = [4, 5, 5, 6], MOVES = [22, 22, 18, 20];
    function palBox() {
      var bw = Math.min(64, (api.W - 24) / K);
      return { bw: bw, x0: (api.W - bw * K) / 2, y: gy + cs * N + 30, h: bw - 10 };
    }
    function layout() {
      cs = Math.floor(Math.min(api.W - 24, api.H - 230) / N);
      gx = (api.W - cs * N) / 2; gy = 70;
    }
    function newBoard() {
      N = SIZE[api.diff]; K = COLS[api.diff]; left = MOVES[api.diff];
      board = [];
      for (var i = 0; i < N * N; i++) board.push(Math.floor(Math.random() * K));
      layout();
    }
    function fill(col) {
      var from = board[0], stack = [0];
      if (col === from) return false;
      while (stack.length) {
        var k = stack.pop();
        if (board[k] !== from) continue;
        board[k] = col;
        var r = Math.floor(k / N), c = k % N;
        if (r > 0) stack.push(k - N);
        if (r < N - 1) stack.push(k + N);
        if (c > 0) stack.push(k - 1);
        if (c < N - 1) stack.push(k + 1);
      }
      return true;
    }
    function won() { return board.every(function (v) { return v === board[0]; }); }
    function paletteAt(x, y) {
      var p = palBox();
      if (y < p.y || y > p.y + p.h) return -1;
      var k = Math.floor((x - p.x0) / p.bw);
      return k >= 0 && k < K ? k : -1;
    }
    return {
      reset: function () { round = 0; newBoard(); },
      resize: function () { if (N) layout(); }, idle: function () { }, update: function () { }, key: function () { },
      input: function (type, d) {
        if (type !== 'down') return;
        var col = paletteAt(d.x, d.y);
        if (col < 0 || !fill(col)) return;
        left--; api.sound('click'); api.vibrate(15);
        if (won()) {
          api.addScore(left * 120 + 300 * (api.diff + 1)); api.fx.confetti(30); api.sound('win');
          round++; newBoard(); return;
        }
        if (left <= 0) { api.sound('hit'); api.vibrate(60); api.gameOver(); }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        c.fillStyle = '#1c1917'; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '800 18px system-ui'; c.fillStyle = '#fafaf9';
        c.fillText('Поле ' + (round + 1) + '   ·   ходов осталось: ' + left, W / 2, 42);
        for (var i = 0; i < N * N; i++) {
          c.fillStyle = PAL[board[i]];
          c.fillRect(gx + (i % N) * cs + 1, gy + Math.floor(i / N) * cs + 1, cs - 2, cs - 2);
        }
        var p = palBox();
        for (var k = 0; k < K; k++) {
          c.fillStyle = PAL[k];
          c.fillRect(p.x0 + k * p.bw + 4, p.y, p.bw - 8, p.h);
        }
      }
    };
  }
};
