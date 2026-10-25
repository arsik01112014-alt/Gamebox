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
    var N, grid, lives, level, cs, gx, gy, flash, fly, t, K = window.GBK, COLS = ['#38bdf8', '#fbbf24', '#34d399', '#f472b6'];
    function layout() { cs = Math.floor(Math.min(api.W - 24, api.H - 190) / N); gx = (api.W - cs * N) / 2; gy = 104; }
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
      reset: function () { lives = api.diff === 0 ? 5 : 3; level = 1; flash = null; fly = []; t = 0; newBoard(); },
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
        fly.push({ x: gx + c * cs + cs / 2, y: gy + r * cs + cs / 2, dir: grid[k], v: 0, l: 1 });
        grid[k] = -1; api.addScore(10 * (api.diff + 1)); api.sound('click');
        if (grid.every(function (v) { return v < 0; })) { api.addScore(200 * (api.diff + 1)); api.fx.confetti(30); api.sound('win'); level++; newBoard(); }
      },
      update: function (dt) {
        t += dt; if (flash && (flash.t -= dt) <= 0) flash = null;
        fly.forEach(function (f) { f.v += 2600 * dt; f.x += D[f.dir][1] * f.v * dt; f.y += D[f.dir][0] * f.v * dt; f.l -= dt * 1.6; });
        fly = fly.filter(function (f) { return f.l > 0; });
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        K.bg(c, W, H, '#0c4a6e', '#082f49', 'rgba(56,189,248,.15)');
        c.textAlign = 'center'; c.textBaseline = 'middle';
        K.rr(c, W / 2 - 54, 16, 108, 30, 15); c.fillStyle = 'rgba(0,0,0,.3)'; c.fill();
        c.fillStyle = '#e0f2fe'; c.font = '900 15px system-ui'; c.fillText('Поле ' + level, W / 2, 32);
        var maxL = api.diff === 0 ? 5 : 3;
        for (var hI = 0; hI < maxL; hI++) K.heart(c, W / 2 - (maxL - 1) * 12 + hI * 24, 64, 18, hI < lives ? '#f43f5e' : 'rgba(255,255,255,.2)');
        // доска
        c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 20; c.shadowOffsetY = 6;
        K.rr(c, gx - 10, gy - 10, cs * N + 20, cs * N + 20, 18); c.fillStyle = '#0b3a57'; c.fill(); c.restore();
        c.strokeStyle = 'rgba(125,211,252,.25)'; c.lineWidth = 2; K.rr(c, gx - 10, gy - 10, cs * N + 20, cs * N + 20, 18); c.stroke();
        function arrow(cx, cy, dir, s2, col, alpha) {
          c.save(); c.translate(cx, cy); c.rotate(dir * Math.PI / 2); c.globalAlpha = alpha;
          c.shadowColor = col; c.shadowBlur = 10;
          var g = c.createLinearGradient(0, -s2 * 1.2, 0, s2 * 1.1); g.addColorStop(0, K.shade(col, 0.35)); g.addColorStop(1, K.shade(col, -0.2));
          c.fillStyle = g; c.beginPath(); c.moveTo(0, -s2 * 1.2); c.lineTo(s2, -s2 * 0.1); c.lineTo(s2 * 0.38, -s2 * 0.1); c.lineTo(s2 * 0.38, s2 * 1.1);
          c.lineTo(-s2 * 0.38, s2 * 1.1); c.lineTo(-s2 * 0.38, -s2 * 0.1); c.lineTo(-s2, -s2 * 0.1); c.closePath(); c.fill();
          c.shadowBlur = 0; c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.5; c.stroke();
          c.restore();
        }
        for (var i = 0; i < N * N; i++) {
          var x = gx + (i % N) * cs, y = gy + Math.floor(i / N) * cs, bad = flash && flash.k === i;
          K.rr(c, x + 3, y + 5, cs - 6, cs - 6, 9); c.fillStyle = 'rgba(0,0,0,.35)'; c.fill();
          var tg = c.createLinearGradient(0, y, 0, y + cs); tg.addColorStop(0, bad ? '#b91c1c' : '#155e75'); tg.addColorStop(1, bad ? '#7f1d1d' : '#0e4a63');
          K.rr(c, x + 3, y + 3, cs - 6, cs - 7, 9); c.fillStyle = tg; c.fill();
          if (grid[i] < 0) continue;
          var bob = bad ? Math.sin(t * 50) * 3 : 0;
          arrow(x + cs / 2 + bob, y + cs / 2, grid[i], cs * 0.27, COLS[grid[i]], 1);
        }
        fly.forEach(function (f) { arrow(f.x, f.y, f.dir, cs * 0.27, COLS[f.dir], Math.max(0, f.l)); });
      }
    };
  }
};
