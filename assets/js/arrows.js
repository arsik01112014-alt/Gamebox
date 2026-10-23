/* Стрелки: убирай стрелку, если путь до края поля в её сторону свободен */
window.GAMES = window.GAMES || {};
window.GAMES.arrows = {
  title: 'Стрелки', desc: 'Освободи поле от стрелок', cat: 'puzzle', isNew4: true, medals: [800, 2000, 4000],
  hint: 'Нажми на стрелку: она улетит, если в её сторону до края поля нет других стрелок. Если путь занят — теряешь жизнь. Очисти поле, чтобы перейти на следующее.',
  d0: 'Поле 5×5, 5 жизней', d1: 'Поле 6×6', d2: 'Поле 7×7', d3: 'Поле 8×8',
  colors: ['#0ea5e9', '#2563eb'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#0c4a6e"/><path d="M30 30h22v-8l14 14-14 14v-8H30z" fill="#38bdf8"/><path d="M70 70H48v8L34 64l14-14v8h22z" fill="#fbbf24"/></svg>',
  create: function (api) {
    var D = [[-1, 0], [0, 1], [1, 0], [0, -1]];
    var N, grid, lives, level, cs, gx, gy, flash;
    function layout() { cs = Math.floor(Math.min(api.W - 24, api.H - 160) / N); gx = (api.W - cs * N) / 2; gy = 90; }
    function clearPath(k, dir) {
      var r = Math.floor(k / N) + D[dir][0], c = k % N + D[dir][1];
      while (r >= 0 && c >= 0 && r < N && c < N) { if (grid[r * N + c] >= 0) return false; r += D[dir][0]; c += D[dir][1]; }
      return true;
    }
    // каждая стрелка ставится только с путём к краю, свободным в момент установки:
    // убирая их в обратном порядке, поле всегда можно пройти
    function newBoard() {
      N = [5, 6, 7, 8][api.diff]; grid = [];
      for (var i = 0; i < N * N; i++) grid.push(-1);
      var cells = grid.map(function (_, k) { return k; }).sort(function () { return Math.random() - 0.5; });
      cells.forEach(function (k) {
        var dirs = [0, 1, 2, 3].sort(function () { return Math.random() - 0.5; });
        for (var j = 0; j < 4; j++) if (clearPath(k, dirs[j])) { grid[k] = dirs[j]; return; }
      });
      layout();
    }
    return {
      reset: function () { lives = api.diff === 0 ? 5 : 3; level = 1; flash = null; newBoard(); },
      resize: function () { if (N) layout(); }, idle: function () { }, key: function () { },
      input: function (type, d) {
        if (type !== 'down') return;
        var c = Math.floor((d.x - gx) / cs), r = Math.floor((d.y - gy) / cs);
        if (c < 0 || r < 0 || c >= N || r >= N) return;
        var k = r * N + c;
        if (grid[k] < 0) return;
        if (!clearPath(k, grid[k])) {
          lives--; flash = { k: k, t: 0.3 }; api.sound('hit'); api.vibrate(40);
          if (lives <= 0) api.gameOver();
          return;
        }
        grid[k] = -1; api.addScore(10 * (api.diff + 1)); api.sound('click');
        if (grid.every(function (v) { return v < 0; })) { api.addScore(200 * (api.diff + 1)); api.fx.confetti(30); api.sound('win'); level++; newBoard(); }
      },
      update: function (dt) { if (flash && (flash.t -= dt) <= 0) flash = null; },
      draw: function (c) {
        var W = api.W, H = api.H;
        c.fillStyle = '#082f49'; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#e0f2fe'; c.font = '700 16px system-ui';
        c.fillText('Поле ' + level + '   ·   жизни: ' + '♥'.repeat(Math.max(0, lives)), W / 2, 50);
        for (var i = 0; i < N * N; i++) {
          var x = gx + (i % N) * cs, y = gy + Math.floor(i / N) * cs;
          c.fillStyle = flash && flash.k === i ? '#7f1d1d' : '#0c4a6e';
          c.fillRect(x + 2, y + 2, cs - 4, cs - 4);
          if (grid[i] < 0) continue;
          c.save(); c.translate(x + cs / 2, y + cs / 2); c.rotate(grid[i] * Math.PI / 2);
          c.fillStyle = ['#38bdf8', '#fbbf24', '#34d399', '#f472b6'][grid[i]];
          var s = cs * 0.3;
          c.beginPath(); c.moveTo(0, -s * 1.2); c.lineTo(s, 0); c.lineTo(s * 0.4, 0); c.lineTo(s * 0.4, s * 1.1);
          c.lineTo(-s * 0.4, s * 1.1); c.lineTo(-s * 0.4, 0); c.lineTo(-s, 0); c.closePath(); c.fill();
          c.restore();
        }
      }
    };
  }
};
