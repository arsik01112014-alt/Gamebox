/* Блоки: перетаскивай фигуры на поле и собирай линии (как 1010!) */
window.GAMES = window.GAMES || {};
window.GAMES.blocks = {
  title: 'Блоки',
  desc: 'Заполняй ряды и столбцы',
  hint: 'Перетаскивай фигуры снизу на поле. Заполненный ряд или столбец исчезает. Несколько линий сразу и подряд — комбо! Игра заканчивается, когда ни одна фигура не помещается.',
  d0: 'Поле 10×10, простые фигуры', d1: 'Поле 9×9', d2: 'Поле 9×9, сложные фигуры', d3: 'Поле 8×8, сложные фигуры',
  colors: ['#f59e0b', '#ec4899'],
  controls: 'none',
  isNew3: true,
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="blkbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3486"/><stop offset="1" stop-c' +
    'olor="#1c1848"/></linearGradient></defs><rect x="6" y="6" width="88" height="88" rx="13" fill="url(#blkbg)"/><rect x="11" y="11" width="78" height="78' +
    '" rx="7" fill="#0d0b26"/><g fill="#1a1640"><rect x="15" y="15" width="16" height="16" rx="3"/><rect x="33" y="15" width="16" height="16" rx="3"/><rect' +
    ' x="51" y="15" width="16" height="16" rx="3"/><rect x="69" y="15" width="16" height="16" rx="3"/><rect x="15" y="33" width="16" height="16" rx="3"/><r' +
    'ect x="33" y="33" width="16" height="16" rx="3"/><rect x="51" y="33" width="16" height="16" rx="3"/><rect x="69" y="33" width="16" height="16" rx="3"/' +
    '><rect x="15" y="51" width="16" height="16" rx="3"/><rect x="33" y="51" width="16" height="16" rx="3"/><rect x="51" y="51" width="16" height="16" rx="' +
    '3"/><rect x="69" y="51" width="16" height="16" rx="3"/><rect x="15" y="69" width="16" height="16" rx="3"/><rect x="33" y="69" width="16" height="16" r' +
    'x="3"/><rect x="51" y="69" width="16" height="16" rx="3"/><rect x="69" y="69" width="16" height="16" rx="3"/></g><rect x="14" y="14" width="18" height' +
    '="18" rx="3" fill="#f59e0b"/><path d="M14 14h18l-3.2 3.2h-11.6z" fill="#faca79"/><path d="M14 14v18l3.2 -3.2v-11.6z" fill="#f7b13c"/><path d="M32 14v1' +
    '8l-3.2 -3.2v-11.6z" fill="#bf7b09"/><path d="M14 32h18l-3.2 -3.2h-11.6z" fill="#8e5c06"/><rect x="17.2" y="17.2" width="11.6" height="11.6" rx="1.5" f' +
    'ill="#f6a61f"/><path d="M19.7 16.9l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="#fff"/><rect x="32" y="14" width="18" height="18" rx="3" fill="#f59e0b"/' +
    '><path d="M32 14h18l-3.2 3.2h-11.6z" fill="#faca79"/><path d="M32 14v18l3.2 -3.2v-11.6z" fill="#f7b13c"/><path d="M50 14v18l-3.2 -3.2v-11.6z" fill="#b' +
    'f7b09"/><path d="M32 32h18l-3.2 -3.2h-11.6z" fill="#8e5c06"/><rect x="35.2" y="17.2" width="11.6" height="11.6" rx="1.5" fill="#f6a61f"/><path d="M37.' +
    '7 16.9l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="#fff"/><rect x="50" y="14" width="18" height="18" rx="3" fill="#f59e0b"/><path d="M50 14h18l-3.2 3.2' +
    'h-11.6z" fill="#faca79"/><path d="M50 14v18l3.2 -3.2v-11.6z" fill="#f7b13c"/><path d="M68 14v18l-3.2 -3.2v-11.6z" fill="#bf7b09"/><path d="M50 32h18l-' +
    '3.2 -3.2h-11.6z" fill="#8e5c06"/><rect x="53.2" y="17.2" width="11.6" height="11.6" rx="1.5" fill="#f6a61f"/><path d="M55.7 16.9l.8 2 2 .8-2 .8-.8 2-.' +
    '8-2-2-.8 2-.8z" fill="#fff"/><rect x="14" y="32" width="18" height="18" rx="3" fill="#ec4899"/><path d="M14 32h18l-3.2 3.2h-11.6z" fill="#f59ac7"/><pa' +
    'th d="M14 32v18l3.2 -3.2v-11.6z" fill="#f06dad"/><path d="M32 32v18l-3.2 -3.2v-11.6z" fill="#b83877"/><path d="M14 50h18l-3.2 -3.2h-11.6z" fill="#892a' +
    '59"/><rect x="17.2" y="35.2" width="11.6" height="11.6" rx="1.5" fill="#ee57a1"/><path d="M19.7 34.9l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="#fff"/' +
    '><rect x="14" y="50" width="18" height="18" rx="3" fill="#ec4899"/><path d="M14 50h18l-3.2 3.2h-11.6z" fill="#f59ac7"/><path d="M14 50v18l3.2 -3.2v-11' +
    '.6z" fill="#f06dad"/><path d="M32 50v18l-3.2 -3.2v-11.6z" fill="#b83877"/><path d="M14 68h18l-3.2 -3.2h-11.6z" fill="#892a59"/><rect x="17.2" y="53.2"' +
    ' width="11.6" height="11.6" rx="1.5" fill="#ee57a1"/><path d="M19.7 52.9l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="#fff"/><rect x="32" y="50" width="' +
    '18" height="18" rx="3" fill="#ec4899"/><path d="M32 50h18l-3.2 3.2h-11.6z" fill="#f59ac7"/><path d="M32 50v18l3.2 -3.2v-11.6z" fill="#f06dad"/><path d' +
    '="M50 50v18l-3.2 -3.2v-11.6z" fill="#b83877"/><path d="M32 68h18l-3.2 -3.2h-11.6z" fill="#892a59"/><rect x="35.2" y="53.2" width="11.6" height="11.6" ' +
    'rx="1.5" fill="#ee57a1"/><path d="M37.7 52.9l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="#fff"/><rect x="50" y="50" width="18" height="18" rx="3" fill=' +
    '"#22c55e"/><path d="M50 50h18l-3.2 3.2h-11.6z" fill="#85dfa6"/><path d="M50 50v18l3.2 -3.2v-11.6z" fill="#4ed17e"/><path d="M68 50v18l-3.2 -3.2v-11.6z' +
    '" fill="#1b9a49"/><path d="M50 68h18l-3.2 -3.2h-11.6z" fill="#147237"/><rect x="53.2" y="53.2" width="11.6" height="11.6" rx="1.5" fill="#34ca6b"/><pa' +
    'th d="M55.7 52.9l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="#fff"/><rect x="68" y="50" width="18" height="18" rx="3" fill="#22c55e"/><path d="M68 50h1' +
    '8l-3.2 3.2h-11.6z" fill="#85dfa6"/><path d="M68 50v18l3.2 -3.2v-11.6z" fill="#4ed17e"/><path d="M86 50v18l-3.2 -3.2v-11.6z" fill="#1b9a49"/><path d="M' +
    '68 68h18l-3.2 -3.2h-11.6z" fill="#147237"/><rect x="71.2" y="53.2" width="11.6" height="11.6" rx="1.5" fill="#34ca6b"/><path d="M73.7 52.9l.8 2 2 .8-2' +
    ' .8-.8 2-.8-2-2-.8 2-.8z" fill="#fff"/><rect x="68" y="68" width="18" height="18" rx="3" fill="#22c55e"/><path d="M68 68h18l-3.2 3.2h-11.6z" fill="#85' +
    'dfa6"/><path d="M68 68v18l3.2 -3.2v-11.6z" fill="#4ed17e"/><path d="M86 68v18l-3.2 -3.2v-11.6z" fill="#1b9a49"/><path d="M68 86h18l-3.2 -3.2h-11.6z" f' +
    'ill="#147237"/><rect x="71.2" y="71.2" width="11.6" height="11.6" rx="1.5" fill="#34ca6b"/><path d="M73.7 70.9l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fi' +
    'll="#fff"/><rect x="32" y="68" width="18" height="18" rx="3" fill="#38bdf8"/><path d="M32 68h18l-3.2 3.2h-11.6z" fill="#92dbfb"/><path d="M32 68v18l3.' +
    '2 -3.2v-11.6z" fill="#60caf9"/><path d="M50 68v18l-3.2 -3.2v-11.6z" fill="#2c93c1"/><path d="M32 86h18l-3.2 -3.2h-11.6z" fill="#206e90"/><rect x="35.2' +
    '" y="71.2" width="11.6" height="11.6" rx="1.5" fill="#48c2f9"/><path d="M37.7 70.9l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="#fff"/></svg>',

  create: function (api) {
    var SIMPLE = [
      [[0, 0]], [[0, 0], [1, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1], [0, 2]],
      [[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [0, 1]], [[0, 0], [1, 0], [1, 1]], [[0, 0], [0, 1], [1, 1]], [[1, 0], [0, 1], [1, 1]],
      [[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [0, 1], [0, 2], [0, 3]]
    ];
    var HARD = [
      [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
      [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]],
      [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], [[2, 0], [2, 1], [2, 2], [1, 2], [0, 2]], [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]],
      [[0, 0], [1, 0], [1, 1], [2, 1]], [[1, 0], [0, 1], [1, 1], [2, 0]], [[0, 0], [1, 0], [2, 0], [1, 1]]
    ];
    var COLS = ['#f59e0b', '#ec4899', '#22c55e', '#38bdf8', '#a855f7', '#ef4444', '#14b8a6', '#facc15'];
    var N, grid, tray, drag, cs, bx, by, tcs, t, endT, combo, clearing, placedN;
    function layout() {
      var size = Math.min(api.W - 32, api.H * 0.62);
      cs = size / N; bx = (api.W - size) / 2; by = 48;
      tcs = Math.min(cs * 0.55, (api.W - 40) / 15);
      build();
    }
    function pool() { return api.diff >= 2 ? SIMPLE.concat(HARD, HARD) : api.diff === 1 ? SIMPLE.concat(HARD.slice(0, 7)) : SIMPLE; }
    function newTray() {
      var P = pool();
      tray = [0, 1, 2].map(function (k) { return { cells: P[Math.floor(Math.random() * P.length)], col: COLS[Math.floor(Math.random() * COLS.length)], used: false }; });
    }
    function size(cells) { var w = 0, h = 0; cells.forEach(function (p) { w = Math.max(w, p[0] + 1); h = Math.max(h, p[1] + 1); }); return [w, h]; }
    function fits(cells, gx, gy) {
      for (var i = 0; i < cells.length; i++) {
        var x = gx + cells[i][0], y = gy + cells[i][1];
        if (x < 0 || y < 0 || x >= N || y >= N || grid[y][x]) return false;
      }
      return true;
    }
    function anyFit(cells) { for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (fits(cells, x, y)) return true; return false; }
    function slotX(k) { return api.W * (k + 0.5) / 3; }
    function slotY() { return by + N * cs + (api.H - by - N * cs) / 2; }
    function dropCell() { // клетка поля под фигурой при перетаскивании (фигура над пальцем)
      var s = size(drag.p.cells);
      var px = drag.x - s[0] * cs / 2, py = drag.y - s[1] * cs - cs * 1.2;
      return [Math.round((px - bx) / cs), Math.round((py - by) / cs)];
    }
    function place(p, gx, gy) {
      p.cells.forEach(function (q) { grid[gy + q[1]][gx + q[0]] = p.col; });
      p.used = true; placedN++;
      api.addScore(p.cells.length); api.tone(400, 0.06, 'triangle', 0.06); api.vibrate(8);
      var rows = [], cols = [];
      for (var y = 0; y < N; y++) { var f = true; for (var x = 0; x < N; x++) if (!grid[y][x]) f = false; if (f) rows.push(y); }
      for (var x2 = 0; x2 < N; x2++) { var f2 = true; for (var y2 = 0; y2 < N; y2++) if (!grid[y2][x2]) f2 = false; if (f2) cols.push(x2); }
      var lines = rows.length + cols.length;
      if (lines) {
        combo++;
        var pts = lines * 10 * lines * Math.max(1, combo);
        api.addScore(pts);
        rows.forEach(function (y) { for (var x = 0; x < N; x++) { clearing.push({ x: x, y: y, c: grid[y][x], k: 0 }); } });
        cols.forEach(function (x) { for (var y = 0; y < N; y++) { clearing.push({ x: x, y: y, c: grid[y][x], k: 0 }); } });
        rows.forEach(function (y) { for (var x = 0; x < N; x++) grid[y][x] = null; });
        cols.forEach(function (x) { for (var y = 0; y < N; y++) grid[y][x] = null; });
        api.sound(lines > 1 ? 'tetris' : 'line'); api.vibrate(30);
        api.fx.text(bx + (gx + 1) * cs, by + gy * cs, '+' + pts + (combo > 1 ? ' ×' + combo : ''), '#fde047', 16 + lines * 3);
        if (lines >= 3) api.fx.shake(5);
        var empty = true; for (var yy = 0; yy < N; yy++) for (var xx = 0; xx < N; xx++) if (grid[yy][xx]) empty = false;
        if (empty) { api.addScore(300); api.toast(api.t('tetris.perfect')); api.fx.confetti(60); }
      } else combo = 0;
      if (tray.every(function (q) { return q.used; })) newTray();
      if (!tray.some(function (q) { return !q.used && anyFit(q.cells); })) { endT = 1.4; api.sound('over'); }
    }
    // ---------- графика ----------
    var dpr = 1, bgL = null, boardL = null, jc = {}, lw = 0, lh = 0, parts = [], prevG = null, popT = {};
    function mkC(w, h) {
      var o = document.createElement('canvas');
      o.width = Math.max(1, Math.ceil(w * dpr)); o.height = Math.max(1, Math.ceil(h * dpr));
      var x = o.getContext('2d'); x.scale(dpr, dpr); return o;
    }
    function rr(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }
    function seedRnd(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
    function mix(hex, k) { // k>0 — к белому, k<0 — к чёрному
      var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, t2 = k > 0 ? 255 : 0, a = Math.abs(k);
      return 'rgb(' + Math.round(r + (t2 - r) * a) + ',' + Math.round(g + (t2 - g) * a) + ',' + Math.round(b + (t2 - b) * a) + ')';
    }
    function jewel(col, s) {
      var key = col + '|' + Math.round(s * 10);
      if (jc[key]) return jc[key];
      var o = mkC(s, s), c = o.getContext('2d'), m = Math.max(1, s * 0.04), w = s - m * 2, b = s * 0.17, rad = s * 0.16, g;
      c.save(); rr(c, m, m, w, w, rad); c.clip();
      c.fillStyle = col; c.fillRect(0, 0, s, s);
      // грани
      c.fillStyle = mix(col, 0.45); c.beginPath(); c.moveTo(m, m); c.lineTo(s - m, m); c.lineTo(s - m - b, m + b); c.lineTo(m + b, m + b); c.closePath(); c.fill();
      c.fillStyle = mix(col, 0.2); c.beginPath(); c.moveTo(m, m); c.lineTo(m + b, m + b); c.lineTo(m + b, s - m - b); c.lineTo(m, s - m); c.closePath(); c.fill();
      c.fillStyle = mix(col, -0.22); c.beginPath(); c.moveTo(s - m, m); c.lineTo(s - m, s - m); c.lineTo(s - m - b, s - m - b); c.lineTo(s - m - b, m + b); c.closePath(); c.fill();
      c.fillStyle = mix(col, -0.42); c.beginPath(); c.moveTo(m, s - m); c.lineTo(s - m, s - m); c.lineTo(s - m - b, s - m - b); c.lineTo(m + b, s - m - b); c.closePath(); c.fill();
      c.restore();
      // лицевая грань
      g = c.createLinearGradient(m + b, m + b, s - m - b, s - m - b);
      g.addColorStop(0, mix(col, 0.25)); g.addColorStop(0.6, col); g.addColorStop(1, mix(col, -0.15));
      c.fillStyle = g; rr(c, m + b, m + b, w - b * 2, w - b * 2, rad * 0.4); c.fill();
      g = c.createLinearGradient(0, m + b, 0, m + b + (w - b * 2) * 0.5);
      g.addColorStop(0, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; rr(c, m + b, m + b, w - b * 2, (w - b * 2) * 0.5, rad * 0.4); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; rr(c, m + 0.5, m + 0.5, w - 1, w - 1, rad); c.stroke();
      // искорка
      var sx = m + b * 1.25, sy = m + b * 1.25, sr = s * 0.09;
      c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath();
      c.moveTo(sx, sy - sr); c.lineTo(sx + sr * 0.25, sy - sr * 0.25); c.lineTo(sx + sr, sy); c.lineTo(sx + sr * 0.25, sy + sr * 0.25);
      c.lineTo(sx, sy + sr); c.lineTo(sx - sr * 0.25, sy + sr * 0.25); c.lineTo(sx - sr, sy); c.lineTo(sx - sr * 0.25, sy - sr * 0.25); c.closePath(); c.fill();
      jc[key] = o; return o;
    }
    function build() {
      var W = api.W, H = api.H, sz = cs * N, g, i, x, y, rnd = seedRnd(5);
      dpr = Math.min(2, window.devicePixelRatio || 1); lw = W; lh = H; jc = {};
      bgL = mkC(W, H); var c = bgL.getContext('2d');
      g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#231c5c'); g.addColorStop(0.55, '#141a3f'); g.addColorStop(1, '#0a0f24');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // мелкие звёзды и сетка ромбов
      for (i = 0; i < 70; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.05 + rnd() * 0.25) + ')'; c.beginPath(); c.arc(rnd() * W, rnd() * H, rnd() * 1.2 + 0.3, 0, 6.283); c.fill(); }
      c.strokeStyle = 'rgba(167,139,250,.05)'; c.lineWidth = 1;
      for (i = -H; i < W + H; i += 34) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + H * 0.6, H); c.stroke(); c.beginPath(); c.moveTo(i, 0); c.lineTo(i - H * 0.6, H); c.stroke(); }
      g = c.createRadialGradient(W / 2, by + sz / 2, sz * 0.2, W / 2, by + sz / 2, Math.max(W, H) * 0.8);
      g.addColorStop(0, 'rgba(139,92,246,.18)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // лоток для фигур
      var ty0 = by + sz + 16, th = H - ty0 - 12;
      if (th > 40) {
        g = c.createLinearGradient(0, ty0, 0, ty0 + th);
        g.addColorStop(0, 'rgba(255,255,255,.07)'); g.addColorStop(1, 'rgba(255,255,255,.02)');
        c.fillStyle = g; rr(c, 10, ty0, W - 20, th, 18); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 1; c.stroke();
        for (i = 0; i < 3; i++) {
          var sxx = W * (i + 0.5) / 3, syy = ty0 + th / 2;
          g = c.createRadialGradient(sxx, syy, 4, sxx, syy, Math.min(W / 6, th / 2));
          g.addColorStop(0, 'rgba(139,92,246,.12)'); g.addColorStop(1, 'rgba(139,92,246,0)');
          c.fillStyle = g; c.beginPath(); c.arc(sxx, syy, Math.min(W / 6, th / 2), 0, 6.283); c.fill();
        }
        c.strokeStyle = 'rgba(255,255,255,.06)';
        c.beginPath(); c.moveTo(W / 3, ty0 + 14); c.lineTo(W / 3, ty0 + th - 14); c.moveTo(W * 2 / 3, ty0 + 14); c.lineTo(W * 2 / 3, ty0 + th - 14); c.stroke();
      }
      // поле
      boardL = mkC(W, H); c = boardL.getContext('2d');
      c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 20; c.shadowOffsetY = 8;
      g = c.createLinearGradient(0, by - 8, 0, by + sz + 8);
      g.addColorStop(0, '#3b3486'); g.addColorStop(1, '#1c1848');
      c.fillStyle = g; rr(c, bx - 8, by - 8, sz + 16, sz + 16, 14); c.fill(); c.restore();
      g = c.createLinearGradient(0, by - 8, 0, by + sz + 8);
      g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(0.4, 'rgba(255,255,255,.05)'); g.addColorStop(1, 'rgba(0,0,0,.4)');
      c.strokeStyle = g; c.lineWidth = 1.5; rr(c, bx - 7.25, by - 7.25, sz + 14.5, sz + 14.5, 13.5); c.stroke();
      c.fillStyle = '#0d0b26'; rr(c, bx - 2, by - 2, sz + 4, sz + 4, 8); c.fill();
      var ir = Math.max(2, cs * 0.14);
      for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
        var cx = bx + x * cs + 1.5, cy = by + y * cs + 1.5, cw = cs - 3;
        g = c.createLinearGradient(0, cy, 0, cy + cw);
        g.addColorStop(0, (x + y) % 2 ? '#14112f' : '#171436'); g.addColorStop(1, (x + y) % 2 ? '#1e1a45' : '#221d4d');
        c.fillStyle = g; rr(c, cx, cy, cw, cw, ir); c.fill();
        c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx + ir, cy + 0.75); c.lineTo(cx + cw - ir, cy + 0.75); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx + ir, cy + cw - 0.5); c.lineTo(cx + cw - ir, cy + cw - 0.5); c.stroke();
      }
      prevG = null;
    }
    function drawCell(c, x, y, s, col, a) {
      c.globalAlpha = a == null ? 1 : a;
      c.drawImage(jewel(col, s > (tcs + cs) / 2 ? cs : tcs), x, y, s, s); // спрайты только двух размеров
      c.globalAlpha = 1;
    }
    return {
      reset: function () {
        N = [10, 9, 9, 8][api.diff]; grid = [];
        for (var y = 0; y < N; y++) { grid.push([]); for (var x = 0; x < N; x++) grid[y].push(null); }
        t = 0; endT = 0; combo = 0; clearing = []; drag = null; placedN = 0; parts = []; popT = {}; prevG = null;
        layout(); newTray();
      },
      resize: layout,
      idle: function (dt) { t += dt; },
      input: function (type, d) {
        if (endT > 0) return;
        if (type === 'down') {
          for (var k = 0; k < 3; k++) {
            var p = tray[k]; if (p.used) continue;
            if (Math.abs(d.x - slotX(k)) < api.W / 6 && Math.abs(d.y - slotY()) < 80) { drag = { k: k, p: p, x: d.x, y: d.y }; api.sound('click'); return; }
          }
        } else if (type === 'move' && drag) { drag.x = d.x; drag.y = d.y; }
        else if (type === 'up' && drag) {
          var g = dropCell();
          if (fits(drag.p.cells, g[0], g[1])) place(drag.p, g[0], g[1]); else api.sound('move');
          drag = null;
        }
      },
      update: function (dt) {
        t += dt;
        clearing.forEach(function (q) {
          if (!q.sp) {
            q.sp = true;
            var np = api.quality === 0 ? 0 : api.quality === 1 ? 2 : 4;
            for (var pi2 = 0; pi2 < np && parts.length < 240; pi2++) {
              var an = Math.random() * 6.283, sp = 40 + Math.random() * 120;
              parts.push({ x: bx + (q.x + 0.5) * cs, y: by + (q.y + 0.5) * cs, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 40, l: 0.5 + Math.random() * 0.4, m: 0.9, r: 2 + Math.random() * 2.5, c: Math.random() < 0.5 ? '#ffffff' : (q.c || '#fde047') });
            }
          }
          q.k += dt * 3;
        });
        for (var pj = parts.length - 1; pj >= 0; pj--) {
          var pp = parts[pj]; pp.l -= dt; pp.x += pp.vx * dt; pp.y += pp.vy * dt; pp.vy += 160 * dt; pp.vx *= 0.98;
          if (pp.l <= 0) parts.splice(pj, 1);
        }
        clearing = clearing.filter(function (q) { return q.k < 1; });
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, q = api.quality, x, y, k;
        if (!bgL || lw !== W || lh !== H) layout();
        c.drawImage(bgL, 0, 0, W, H);
        c.drawImage(boardL, 0, 0, W, H);
        // отслеживаем новые клетки для «поп»-анимации
        if (!prevG || prevG.length !== N * N) { prevG = []; for (k = 0; k < N * N; k++) prevG.push(grid[Math.floor(k / N)][k % N]); }
        for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
          var gv = grid[y][x], pi = y * N + x;
          if (gv && !prevG[pi]) popT[pi] = t;
          prevG[pi] = gv;
          if (!gv) continue;
          var pt = popT[pi] != null ? (t - popT[pi]) / 0.22 : 1;
          if (pt < 1) {
            var ps = cs * (1 + Math.sin(pt * Math.PI) * 0.12);
            drawCell(c, bx + x * cs + (cs - ps) / 2, by + y * cs + (cs - ps) / 2, ps, gv);
          } else { if (popT[pi] != null) delete popT[pi]; drawCell(c, bx + x * cs, by + y * cs, cs, gv); }
        }
        // исчезающие линии
        clearing.forEach(function (cq) {
          var e = cq.k, s = cs * (1 - e * e);
          drawCell(c, bx + cq.x * cs + (cs - s) / 2, by + cq.y * cs + (cs - s) / 2, s, cq.c || '#ffffff', 1 - e);
          c.globalAlpha = Math.max(0, 0.8 - e * 1.6); c.fillStyle = '#fff';
          rr(c, bx + cq.x * cs + 2, by + cq.y * cs + 2, cs - 4, cs - 4, cs * 0.15); c.fill(); c.globalAlpha = 1;
        });
        // превью места
        if (drag) {
          var gc = dropCell(), ok = fits(drag.p.cells, gc[0], gc[1]);
          if (ok) {
            var fill = {}, rows = [], cols = [];
            drag.p.cells.forEach(function (pq) { fill[(gc[1] + pq[1]) * N + gc[0] + pq[0]] = 1; });
            for (y = 0; y < N; y++) { var fr = true; for (x = 0; x < N; x++) if (!grid[y][x] && !fill[y * N + x]) { fr = false; break; } if (fr) rows.push(y); }
            for (x = 0; x < N; x++) { var fc = true; for (y = 0; y < N; y++) if (!grid[y][x] && !fill[y * N + x]) { fc = false; break; } if (fc) cols.push(x); }
            var pa = 0.18 + 0.1 * Math.sin(t * 10);
            c.fillStyle = 'rgba(255,255,255,' + pa + ')';
            rows.forEach(function (ry) { c.fillRect(bx, by + ry * cs, N * cs, cs); });
            cols.forEach(function (cx2) { c.fillRect(bx + cx2 * cs, by, cs, N * cs); });
            drag.p.cells.forEach(function (pq) { drawCell(c, bx + (gc[0] + pq[0]) * cs, by + (gc[1] + pq[1]) * cs, cs, drag.p.col, 0.4); });
            c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.5;
            drag.p.cells.forEach(function (pq) { rr(c, bx + (gc[0] + pq[0]) * cs + 2, by + (gc[1] + pq[1]) * cs + 2, cs - 4, cs - 4, cs * 0.15); c.stroke(); });
          }
        }
        // частицы
        if (parts.length) {
          c.save(); c.globalCompositeOperation = 'lighter';
          parts.forEach(function (p) {
            var a = p.l / p.m, r = p.r * (0.5 + a * 0.5);
            c.globalAlpha = a; c.fillStyle = p.c;
            c.beginPath(); c.moveTo(p.x, p.y - r * 1.6); c.lineTo(p.x + r * 0.5, p.y); c.lineTo(p.x, p.y + r * 1.6); c.lineTo(p.x - r * 0.5, p.y); c.closePath(); c.fill();
            c.beginPath(); c.moveTo(p.x - r * 1.6, p.y); c.lineTo(p.x, p.y + r * 0.4); c.lineTo(p.x + r * 1.6, p.y); c.lineTo(p.x, p.y - r * 0.4); c.closePath(); c.fill();
          });
          c.restore(); c.globalAlpha = 1;
        }
        // фигуры в лотке
        for (k = 0; k < 3; k++) {
          var p = tray[k]; if (p.used || (drag && drag.k === k)) continue;
          var s = size(p.cells), fit = anyFit(p.cells), ox = slotX(k) - s[0] * tcs / 2, oy = slotY() - s[1] * tcs / 2 + Math.sin(t * 2 + k) * (fit ? 1.5 : 0);
          c.fillStyle = 'rgba(0,0,0,.35)';
          p.cells.forEach(function (pq) { rr(c, ox + pq[0] * tcs + 2, oy + pq[1] * tcs + 5, tcs - 2, tcs - 2, tcs * 0.18); c.fill(); });
          p.cells.forEach(function (pq) { drawCell(c, ox + pq[0] * tcs, oy + pq[1] * tcs, tcs, fit ? p.col : '#475569', fit ? 1 : 0.8); });
        }
        if (drag) {
          var s2 = size(drag.p.cells), px = drag.x - s2[0] * cs / 2, py = drag.y - s2[1] * cs - cs * 1.2;
          c.fillStyle = 'rgba(0,0,0,.35)';
          drag.p.cells.forEach(function (pq) { rr(c, px + pq[0] * cs + 5, py + pq[1] * cs + 10, cs - 3, cs - 3, cs * 0.16); c.fill(); });
          drag.p.cells.forEach(function (pq) { drawCell(c, px + pq[0] * cs, py + pq[1] * cs, cs, drag.p.col, 0.97); });
        }
        if (combo > 1) {
          c.font = '900 15px system-ui, sans-serif'; c.textBaseline = 'middle';
          var ct = api.t('tetris.combo', combo), cw2 = c.measureText(ct).width + 24;
          var cg = c.createLinearGradient(W - 12 - cw2, 0, W - 12, 0); cg.addColorStop(0, '#db2777'); cg.addColorStop(1, '#9333ea');
          c.fillStyle = cg; rr(c, W - 12 - cw2, 8, cw2, 26, 13); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; c.stroke();
          c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(ct, W - 12 - cw2 / 2, 22);
          c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        }
      }
    };
  }
};
