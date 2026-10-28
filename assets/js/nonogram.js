/* Японский кроссворд: закрась клетки по числам в строках и столбцах */
window.GAMES = window.GAMES || {};
window.GAMES.nonogram = {
  title: 'Японский кроссворд', desc: 'Нарисуй картинку по числам', cat: 'puzzle', isNew4: true, medals: [300, 700, 1200],
  hint: 'Числа слева и сверху — длины закрашенных отрезков в этой строке или столбце, по порядку; между отрезками хотя бы одна пустая клетка. Нажимай на клетки, чтобы закрасить. Режим «✕» ставит крестик там, где точно пусто. Реши 3 кроссворда — чем быстрее, тем больше очков.',
  d0: 'Поле 5×5', d1: 'Поле 7×7', d2: 'Поле 10×10', d3: 'Поле 12×12',
  colors: ['#0891b2', '#164e63'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#ecfeff"/><g fill="#0e7490"><rect x="34" y="34" width="14" height="14"/><rect x="48" y="34" width="14" height="14"/><rect x="62" y="48" width="14" height="14"/><rect x="34" y="62" width="14" height="14"/><rect x="48" y="62" width="14" height="14"/><rect x="62" y="62" width="14" height="14"/></g><g fill="#155e75" font-family="sans-serif" font-weight="800" font-size="11"><text x="14" y="45">2</text><text x="14" y="59">1</text><text x="14" y="73">3</text><text x="38" y="26">2</text><text x="66" y="26">2</text></g></svg>',
  create: function (api) {
    var N, sol, cur, rowC, colC, cs, ox, oy, puzzle, solved, solvedT, cross, t, startT, paint, endT;
    // готовые картинки делают кроссворды узнаваемыми; остальное — случайные узоры
    var PICS = {
      5: ['0111011111111110111000100', '0101011111111110111000100', '1000101010001000101010001', '0010001110111110010001010'],
      7: ['0011100011111011111110111110001110000111000000100', '0110110111111111111110111110001110000010000000000', '0001000001110001111100111110111111100010000011100']
    };
    function clues(line) { var r = [], n = 0; line.forEach(function (v) { if (v) n++; else if (n) { r.push(n); n = 0; } }); if (n) r.push(n); return r.length ? r : [0]; }
    function newPuzzle() {
      N = [5, 7, 10, 12][api.diff];
      var pics = PICS[N], s;
      if (pics && Math.random() < 0.7) { var p = pics[Math.floor(Math.random() * pics.length)]; s = p.split('').map(Number); }
      else { s = []; for (var i = 0; i < N * N; i++) s.push(Math.random() < 0.58 ? 1 : 0); }
      sol = s; cur = new Array(N * N).fill(0);
      rowC = []; colC = [];
      for (var r = 0; r < N; r++) rowC.push(clues(sol.slice(r * N, r * N + N)));
      for (var c2 = 0; c2 < N; c2++) { var col = []; for (var r2 = 0; r2 < N; r2++) col.push(sol[r2 * N + c2]); colC.push(clues(col)); }
      solved = false; solvedT = 0; startT = t; layout();
    }
    function layout() {
      var mr = Math.max.apply(null, rowC.map(function (x) { return x.length; })), mc = Math.max.apply(null, colC.map(function (x) { return x.length; }));
      var fw = N + mr * 0.62, fh = N + mc * 0.7;
      cs = Math.min((api.W - 20) / fw, (api.H - 230) / fh);
      ox = (api.W - N * cs) / 2 + mr * 0.62 * cs / 2; oy = 70 + mc * 0.7 * cs;
    }
    function lineOk(get, cl) { var line = []; for (var i = 0; i < N; i++) line.push(get(i) === 1 ? 1 : 0); return clues(line).join() === cl.join(); }
    function check() {
      for (var r = 0; r < N; r++) if (!lineOk(function (i) { return cur[r * N + i]; }, rowC[r])) return false;
      for (var c2 = 0; c2 < N; c2++) if (!lineOk(function (i) { return cur[i * N + c2]; }, colC[c2])) return false;
      return true;
    }
    function cellAt(x, y) { var c2 = Math.floor((x - ox) / cs), r = Math.floor((y - oy) / cs); return c2 >= 0 && r >= 0 && c2 < N && r < N ? r * N + c2 : -1; }
    function btn() { var w = 150; return [api.W / 2 - w / 2, oy + N * cs + 18, w, 44]; }
    function setCell(i) {
      if (i < 0 || solved) return;
      if (paint == null) paint = cur[i] === (cross ? 2 : 1) ? 0 : cross ? 2 : 1;
      if (cur[i] === paint) return;
      cur[i] = paint; api.sound('click'); api.vibrate(5);
      if (check()) {
        solved = true; solvedT = 0; puzzle++;
        var sec = t - startT, pts = Math.max(50, Math.round(N * N * 6 - sec * 2));
        api.addScore(pts); api.sound('win'); api.fx.confetti(40);
      }
    }
    return {
      reset: function () { t = 0; puzzle = 0; cross = false; endT = 0; paint = null; newPuzzle(); },
      resize: function () { if (N) layout(); }, idle: function (dt) { t += dt || 0; }, key: function () { },
      input: function (type, d) {
        if (type === 'down') {
          var b = btn(); if (d.x > b[0] && d.x < b[0] + b[2] && d.y > b[1] && d.y < b[1] + b[3]) { cross = !cross; api.sound('click'); return; }
          paint = null; setCell(cellAt(d.x, d.y));
        } else if (type === 'move' && paint != null) setCell(cellAt(d.x, d.y));
        else if (type === 'up') paint = null;
      },
      update: function (dt) {
        t += dt;
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (solved) { solvedT += dt; if (solvedT > 1.8) { if (puzzle >= 3) endT = 0.01; else newPuzzle(); } }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        c.fillStyle = '#ecfeff'; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = '#155e75'; c.font = '800 15px system-ui'; c.fillText('Кроссворд ' + Math.min(3, puzzle + (solved ? 0 : 1)) + ' из 3 · ' + Math.floor(t - startT) + ' с', W / 2, 28);
        var fs = Math.max(9, Math.min(15, cs * 0.5));
        c.font = '800 ' + fs + 'px system-ui';
        for (var r = 0; r < N; r++) {
          var ok = lineOk(function (i) { return cur[r * N + i]; }, rowC[r]);
          c.fillStyle = r % 2 ? '#cffafe' : '#a5f3fc'; c.fillRect(0, oy + r * cs, ox - 2, cs);
          c.fillStyle = ok ? '#94a3b8' : '#164e63';
          rowC[r].slice().reverse().forEach(function (n, k) { c.fillText(n, ox - 8 - k * cs * 0.62, oy + r * cs + cs / 2); });
        }
        for (var c2 = 0; c2 < N; c2++) {
          var okc = lineOk(function (i) { return cur[i * N + c2]; }, colC[c2]);
          c.fillStyle = c2 % 2 ? '#cffafe' : '#a5f3fc'; c.fillRect(ox + c2 * cs, 50, cs, oy - 52);
          c.fillStyle = okc ? '#94a3b8' : '#164e63';
          colC[c2].slice().reverse().forEach(function (n, k) { c.fillText(n, ox + c2 * cs + cs / 2, oy - 10 - k * cs * 0.7); });
        }
        for (var i = 0; i < N * N; i++) {
          var x = ox + (i % N) * cs, y = oy + Math.floor(i / N) * cs;
          c.fillStyle = cur[i] === 1 ? (solved ? '#0e7490' : '#164e63') : '#fff'; c.fillRect(x + 1, y + 1, cs - 2, cs - 2);
          if (cur[i] === 2) { c.strokeStyle = '#f87171'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + cs * 0.3, y + cs * 0.3); c.lineTo(x + cs * 0.7, y + cs * 0.7); c.moveTo(x + cs * 0.7, y + cs * 0.3); c.lineTo(x + cs * 0.3, y + cs * 0.7); c.stroke(); }
        }
        c.strokeStyle = '#0e7490'; c.lineWidth = 2;
        for (var k = 0; k <= N; k += 5) { c.beginPath(); c.moveTo(ox + k * cs, oy); c.lineTo(ox + k * cs, oy + N * cs); c.moveTo(ox, oy + k * cs); c.lineTo(ox + N * cs, oy + k * cs); c.stroke(); }
        c.strokeRect(ox, oy, N * cs, N * cs);
        var b = btn(); window.GBK.key(c, b[0], b[1], b[2], b[3], cross ? '#ef4444' : '#0891b2', cross ? '✕ Крестики' : '■ Закрашивать', '800 15px system-ui');
        if (solved) window.GBK.toast(c, W, H - 46, puzzle >= 3 ? 'Все кроссворды решены! 🎉' : 'Решено! Следующий…', 1);
      }
    };
  }
};
