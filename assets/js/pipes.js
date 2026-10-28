/* Водопровод: поворачивай трубы, чтобы вода дошла до каждой */
window.GAMES = window.GAMES || {};
window.GAMES.pipes = {
  title: 'Водопровод', desc: 'Соедини все трубы', cat: 'puzzle', isNew4: true, medals: [300, 800, 1500],
  hint: 'Нажимай на трубу — она поворачивается. Вода идёт из крана в центре. Соедини трубы так, чтобы вода дошла до каждой клетки и ни одна труба не торчала в пустоту. 5 уровней, поле растёт. Меньше поворотов — больше очков.',
  d0: 'Начиная с 4×4', d1: 'Начиная с 5×5', d2: 'Начиная с 6×6', d3: 'Начиная с 7×7',
  colors: ['#0284c7', '#334155'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#1e293b"/><g stroke="#38bdf8" stroke-width="10" fill="none" stroke-linecap="round"><path d="M50 50H80"/><path d="M50 50V20H24"/><path d="M50 50V80"/></g><g stroke="#64748b" stroke-width="10" fill="none" stroke-linecap="round"><path d="M24 50v28"/></g><circle cx="50" cy="50" r="10" fill="#0ea5e9"/></svg>',
  create: function (api) {
    // направления: 1 — вверх, 2 — вправо, 4 — вниз, 8 — влево
    var N, cells, src, lvl, moves, cs, ox, oy, water, winT, t, endT, spin;
    var DR = { 1: [-1, 0], 2: [0, 1], 4: [1, 0], 8: [0, -1] }, OPP = { 1: 4, 2: 8, 4: 1, 8: 2 };
    function rotate(m) { return ((m << 1) | (m >> 3)) & 15; }
    function gen() {
      N = [4, 5, 6, 7][api.diff] + lvl; if (N > 9) N = 9;
      cells = new Array(N * N).fill(0); src = Math.floor(N / 2) * N + Math.floor(N / 2);
      var seen = {}, front = [src]; seen[src] = 1;
      while (front.length) { // случайное остовное дерево
        var i = front[Math.floor(Math.random() * front.length)], r = Math.floor(i / N), c = i % N, opts = [];
        [1, 2, 4, 8].forEach(function (d) { var nr = r + DR[d][0], nc = c + DR[d][1]; if (nr >= 0 && nc >= 0 && nr < N && nc < N && !seen[nr * N + nc]) opts.push(d); });
        if (!opts.length) { front.splice(front.indexOf(i), 1); continue; }
        var d = opts[Math.floor(Math.random() * opts.length)], j = (r + DR[d][0]) * N + c + DR[d][1];
        cells[i] |= d; cells[j] |= OPP[d]; seen[j] = 1; front.push(j);
      }
      spin = new Array(N * N).fill(0);
      for (var k = 0; k < N * N; k++) { var n = Math.floor(Math.random() * 4); for (var q = 0; q < n; q++) cells[k] = rotate(cells[k]); }
      moves = 0; winT = 0; layout(); flow();
    }
    function layout() { cs = Math.min((api.W - 24) / N, (api.H - 200) / N); ox = (api.W - cs * N) / 2; oy = 80 + Math.max(0, (api.H - 200 - cs * N) / 2); }
    function flow() {
      water = {}; var q = [src], all = true; water[src] = 1;
      while (q.length) {
        var i = q.shift(), r = Math.floor(i / N), c = i % N;
        [1, 2, 4, 8].forEach(function (d) {
          if (!(cells[i] & d)) return; var nr = r + DR[d][0], nc = c + DR[d][1]; if (nr < 0 || nc < 0 || nr >= N || nc >= N) return;
          var j = nr * N + nc; if (!(cells[j] & OPP[d]) || water[j]) return; water[j] = 1; q.push(j);
        });
      }
      for (var k = 0; k < N * N; k++) if (!water[k]) all = false;
      // нет торчащих концов: у каждой трубы с водой каждый выход ведёт в соседа с ответным выходом
      if (all) for (var m = 0; m < N * N; m++) { var rr = Math.floor(m / N), cc = m % N; for (var dd = 1; dd <= 8; dd <<= 1) if (cells[m] & dd) { var a = rr + DR[dd][0], b = cc + DR[dd][1]; if (a < 0 || b < 0 || a >= N || b >= N || !(cells[a * N + b] & OPP[dd])) all = false; } }
      return all;
    }
    return {
      reset: function () { lvl = 0; t = 0; endT = 0; gen(); },
      resize: function () { if (N) layout(); }, idle: function (dt) { t += dt || 0; }, key: function () { },
      input: function (type, d) {
        if (type !== 'down' || winT > 0 || endT > 0) return;
        var c = Math.floor((d.x - ox) / cs), r = Math.floor((d.y - oy) / cs); if (c < 0 || r < 0 || c >= N || r >= N) return;
        var i = r * N + c; cells[i] = rotate(cells[i]); spin[i] = 1; moves++; api.sound('click'); api.vibrate(5);
        if (flow()) {
          winT = 1.6; lvl++; api.addScore(Math.max(40, N * N * 12 - Math.max(0, moves - N * N) * 3)); api.sound('win'); api.fx.confetti(35);
        }
      },
      update: function (dt) {
        t += dt; for (var i = 0; i < spin.length; i++) if (spin[i] > 0) spin[i] = Math.max(0, spin[i] - dt * 8);
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (winT > 0) { winT -= dt; if (winT <= 0) { if (lvl >= 5) endT = 0.01; else gen(); } }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        c.fillStyle = '#0f172a'; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#e2e8f0'; c.font = '800 15px system-ui';
        c.fillText('Уровень ' + Math.min(5, lvl + (winT > 0 ? 0 : 1)) + ' из 5 · поворотов ' + moves, W / 2, 30);
        window.GBK.rr(c, ox - 6, oy - 6, cs * N + 12, cs * N + 12, 12); c.fillStyle = '#1e293b'; c.fill();
        for (var i = 0; i < N * N; i++) {
          var x = ox + (i % N) * cs + cs / 2, y = oy + Math.floor(i / N) * cs + cs / 2, wet = water[i];
          c.fillStyle = '#273449'; c.fillRect(x - cs / 2 + 1.5, y - cs / 2 + 1.5, cs - 3, cs - 3);
          c.save(); c.translate(x, y); c.rotate(-spin[i] * Math.PI / 2);
          c.lineCap = 'round';
          [[0, 0.26, '#0b1220'], [1, 0.18, wet ? '#38bdf8' : '#64748b']].forEach(function (pass) {
            c.strokeStyle = pass[2]; c.lineWidth = cs * pass[1]; c.beginPath();
            for (var d = 1; d <= 8; d <<= 1) if (cells[i] & d) { c.moveTo(0, 0); c.lineTo(DR[d][1] * cs / 2, DR[d][0] * cs / 2); }
            c.stroke();
          });
          var deg = [1, 2, 4, 8].filter(function (d) { return cells[i] & d; }).length;
          if (i === src) { c.fillStyle = '#0ea5e9'; c.beginPath(); c.arc(0, 0, cs * 0.24, 0, 6.283); c.fill(); c.fillStyle = '#fff'; c.font = Math.round(cs * 0.26) + 'px system-ui'; c.fillText('💧', 0, 1); }
          else if (deg === 1) { c.fillStyle = wet ? '#0ea5e9' : '#475569'; c.beginPath(); c.arc(0, 0, cs * 0.17, 0, 6.283); c.fill(); }
          c.restore();
        }
        if (winT > 0) window.GBK.toast(c, W, H - 46, lvl >= 5 ? 'Все уровни пройдены! 🎉' : 'Вода дошла везде! Следующий уровень…', 1);
      }
    };
  }
};
