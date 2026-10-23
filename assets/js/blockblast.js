/* Блок-бласт: ставь фигуры на поле 8×8, заполненные строки и столбцы исчезают */
window.GAMES = window.GAMES || {};
window.GAMES.blockblast = {
  title: 'Блок-бласт', desc: 'Собирай линии из фигур', cat: 'puzzle', isNew4: true, medals: [500, 1500, 3000],
  hint: 'Нажми на фигуру внизу, затем на клетку поля: фигура встанет своим левым верхним углом в эту клетку. Заполненные строки и столбцы исчезают. Когда ни одна фигура не помещается — конец игры.',
  d0: 'Простые фигуры', d1: 'Больше фигур', d2: 'Крупные фигуры', d3: 'Все фигуры, больше очков',
  colors: ['#f43f5e', '#7c3aed'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#1e1b4b"/><rect x="20" y="20" width="18" height="18" rx="3" fill="#f43f5e"/><rect x="41" y="20" width="18" height="18" rx="3" fill="#f43f5e"/><rect x="41" y="41" width="18" height="18" rx="3" fill="#a855f7"/><rect x="62" y="41" width="18" height="18" rx="3" fill="#a855f7"/><rect x="20" y="62" width="60" height="18" rx="3" fill="#22c55e"/></svg>',
  create: function (api) {
    var N = 8, PAL = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#06b6d4'];
    var SH = [[[0, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0]], [[0, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [2, 0]],
      [[0, 0], [0, 1], [1, 0], [1, 1]], [[0, 0], [1, 0], [1, 1]], [[0, 1], [1, 0], [1, 1]],
      [[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [1, 0], [2, 0], [2, 1]],
      [[0, 0], [0, 1], [0, 2], [1, 1]], [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
      [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]]];
    var grid, tray, sel, cs, gx, gy, ty;
    function layout() { cs = Math.floor(Math.min(api.W - 24, api.H * 0.55) / N); gx = (api.W - cs * N) / 2; gy = 70; ty = gy + cs * N + 24; }
    function piece() { var pool = [8, 11, 13, 15][api.diff]; return { sh: SH[Math.floor(Math.random() * pool)], col: PAL[Math.floor(Math.random() * PAL.length)] }; }
    function refill() { tray = [piece(), piece(), piece()]; sel = -1; }
    function fits(sh, r, c) { return sh.every(function (p) { var y = r + p[0], x = c + p[1]; return y >= 0 && x >= 0 && y < N && x < N && !grid[y * N + x]; }); }
    function anyFits() {
      return tray.some(function (pc) { if (!pc) return false; for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) if (fits(pc.sh, r, c)) return true; return false; });
    }
    function clearLines() {
      var rows = [], cols = [], i, j;
      for (i = 0; i < N; i++) {
        var fr = true, fc = true;
        for (j = 0; j < N; j++) { if (!grid[i * N + j]) fr = false; if (!grid[j * N + i]) fc = false; }
        if (fr) rows.push(i); if (fc) cols.push(i);
      }
      rows.forEach(function (r) { for (j = 0; j < N; j++) grid[r * N + j] = null; });
      cols.forEach(function (c) { for (j = 0; j < N; j++) grid[j * N + c] = null; });
      return rows.length + cols.length;
    }
    function slotAt(x, y) { return y >= ty && y <= ty + api.W / 3 ? Math.min(2, Math.floor(x / (api.W / 3))) : -1; }
    return {
      reset: function () { grid = []; for (var i = 0; i < N * N; i++) grid.push(null); layout(); refill(); },
      resize: function () { layout(); }, idle: function () { }, update: function () { }, key: function () { },
      input: function (type, d) {
        if (type !== 'down') return;
        var s = slotAt(d.x, d.y);
        if (s >= 0) { if (tray[s]) { sel = s; api.sound('click'); } return; }
        if (sel < 0) return;
        var c = Math.floor((d.x - gx) / cs), r = Math.floor((d.y - gy) / cs), pc = tray[sel];
        if (!fits(pc.sh, r, c)) { api.sound('hit'); api.vibrate(20); return; }
        pc.sh.forEach(function (p) { grid[(r + p[0]) * N + c + p[1]] = pc.col; });
        tray[sel] = null; sel = -1;
        var lines = clearLines();
        api.addScore((pc.sh.length + 10 * lines * lines) * (api.diff + 1));
        if (lines) { api.sound('win'); api.vibrate(30); if (lines > 1) api.fx.confetti(20); } else api.sound('click');
        if (!tray.some(Boolean)) refill();
        if (!anyFits()) api.gameOver();
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        c.fillStyle = '#0f0a24'; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#e9d5ff'; c.font = '700 16px system-ui';
        c.fillText(sel < 0 ? 'Выбери фигуру внизу' : 'Нажми на клетку поля', W / 2, 40);
        for (var i = 0; i < N * N; i++) {
          c.fillStyle = grid[i] || '#1e1b4b';
          c.fillRect(gx + (i % N) * cs + 1, gy + Math.floor(i / N) * cs + 1, cs - 2, cs - 2);
        }
        var sw = W / 3;
        tray.forEach(function (pc, k) {
          if (k === sel) { c.fillStyle = 'rgba(250,204,21,.18)'; c.fillRect(k * sw + 4, ty, sw - 8, sw); }
          if (!pc) return;
          var ts = Math.floor(Math.min(cs * 0.55, (sw - 20) / 5));
          var w = 1 + Math.max.apply(null, pc.sh.map(function (p) { return p[1]; })), h = 1 + Math.max.apply(null, pc.sh.map(function (p) { return p[0]; }));
          var ox = k * sw + (sw - w * ts) / 2, oy = ty + (sw - h * ts) / 2;
          c.fillStyle = pc.col;
          pc.sh.forEach(function (p) { c.fillRect(ox + p[1] * ts + 1, oy + p[0] * ts + 1, ts - 2, ts - 2); });
        });
      }
    };
  }
};
