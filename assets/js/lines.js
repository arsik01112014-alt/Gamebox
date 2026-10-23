/* Линии: передвигай шары, собирай 5 и больше одного цвета в линию */
window.GAMES = window.GAMES || {};
window.GAMES.lines = {
  title: 'Линии', desc: 'Собери 5 шаров в ряд', cat: 'puzzle', isNew4: true, medals: [200, 600, 1200],
  hint: 'Нажми на шар, затем на пустую клетку: шар переместится, если к ней есть путь. Пять и больше шаров одного цвета в линию по горизонтали, вертикали или диагонали исчезают. После хода без линии появляются 3 новых шара. Поле заполнено — конец игры.',
  d0: '5 цветов', d1: '6 цветов', d2: '7 цветов', d3: '7 цветов, по 4 новых шара',
  colors: ['#2563eb', '#9333ea'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#e5e7eb"/><circle cx="26" cy="74" r="9" fill="#ef4444"/><circle cx="40" cy="60" r="9" fill="#ef4444"/><circle cx="54" cy="46" r="9" fill="#ef4444"/><circle cx="68" cy="32" r="9" fill="#ef4444"/><circle cx="70" cy="70" r="9" fill="#2563eb"/></svg>',
  create: function (api) {
    var N = 9, PAL = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#06b6d4', '#f97316'];
    var grid, next, sel, cs, gx, gy;
    function K() { return [5, 6, 7, 7][api.diff]; }
    function layout() { cs = Math.floor(Math.min(api.W - 16, api.H - 160) / N); gx = (api.W - cs * N) / 2; gy = 100; }
    function pickNext() { next = []; for (var i = 0; i < (api.diff === 3 ? 4 : 3); i++) next.push(Math.floor(Math.random() * K())); }
    function empties() { var e = []; for (var i = 0; i < N * N; i++) if (grid[i] < 0) e.push(i); return e; }
    function linesAt(k) {
      var col = grid[k], r0 = Math.floor(k / N), c0 = k % N, out = [];
      [[0, 1], [1, 0], [1, 1], [1, -1]].forEach(function (d) {
        var cells = [k];
        [1, -1].forEach(function (s) {
          var r = r0 + d[0] * s, c = c0 + d[1] * s;
          while (r >= 0 && c >= 0 && r < N && c < N && grid[r * N + c] === col) { cells.push(r * N + c); r += d[0] * s; c += d[1] * s; }
        });
        if (cells.length >= 5) out = out.concat(cells);
      });
      return out;
    }
    function clear(cells) {
      var uniq = cells.filter(function (v, i) { return cells.indexOf(v) === i; });
      if (!uniq.length) return false;
      uniq.forEach(function (i) { grid[i] = -1; });
      api.addScore((uniq.length - 4) * uniq.length * 2 * (api.diff + 1)); api.sound('win'); api.vibrate(20);
      return true;
    }
    function spawn() {
      var got = [];
      next.forEach(function (col) {
        var e = empties(); if (!e.length) return;
        var k = e[Math.floor(Math.random() * e.length)]; grid[k] = col; got.push(k);
      });
      pickNext();
      var rm = [];
      got.forEach(function (k) { if (grid[k] >= 0) rm = rm.concat(linesAt(k)); });
      clear(rm);
      if (!empties().length) api.gameOver();
    }
    function reachable(from, to) {
      var seen = {}, q = [from]; seen[from] = 1;
      while (q.length) {
        var k = q.shift(); if (k === to) return true;
        var r = Math.floor(k / N), c = k % N;
        [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(function (p) {
          var j = p[0] * N + p[1];
          if (p[0] >= 0 && p[1] >= 0 && p[0] < N && p[1] < N && !seen[j] && (grid[j] < 0 || j === to)) { seen[j] = 1; q.push(j); }
        });
      }
      return false;
    }
    return {
      reset: function () { grid = []; for (var i = 0; i < N * N; i++) grid.push(-1); sel = -1; layout(); pickNext(); spawn(); spawn(); },
      resize: function () { layout(); }, idle: function () { }, update: function () { }, key: function () { },
      input: function (type, d) {
        if (type !== 'down') return;
        var c = Math.floor((d.x - gx) / cs), r = Math.floor((d.y - gy) / cs);
        if (c < 0 || r < 0 || c >= N || r >= N) return;
        var k = r * N + c;
        if (grid[k] >= 0) { sel = k; api.sound('click'); return; }
        if (sel < 0) return;
        if (!reachable(sel, k)) { api.sound('hit'); api.vibrate(30); return; }
        grid[k] = grid[sel]; grid[sel] = -1; sel = -1;
        if (!clear(linesAt(k))) spawn();
      },
      draw: function (c) {
        var W = api.W, H = api.H, t = Date.now() / 200;
        c.fillStyle = '#0f172a'; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#e2e8f0'; c.font = '700 16px system-ui';
        c.fillText('Следующие:', W / 2 - 50, 50);
        next.forEach(function (col, i) { c.fillStyle = PAL[col]; c.beginPath(); c.arc(W / 2 + 20 + i * 26, 50, 10, 0, 6.283); c.fill(); });
        for (var i = 0; i < N * N; i++) {
          var x = gx + (i % N) * cs, y = gy + Math.floor(i / N) * cs;
          c.fillStyle = '#1e293b'; c.fillRect(x + 1, y + 1, cs - 2, cs - 2);
          if (grid[i] >= 0) {
            var rad = cs * 0.36 * (i === sel ? 1 + 0.08 * Math.sin(t) : 1);
            c.fillStyle = PAL[grid[i]]; c.beginPath(); c.arc(x + cs / 2, y + cs / 2, rad, 0, 6.283); c.fill();
            if (i === sel) { c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke(); }
          }
        }
      }
    };
  }
};
