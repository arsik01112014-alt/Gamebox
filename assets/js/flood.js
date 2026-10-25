/* Заливка: меняй цвет области у левого верхнего угла, пока всё поле не станет одного цвета */
window.GAMES = window.GAMES || {};
window.GAMES.flood = {
  title: 'Заливка', desc: 'Залей поле одним цветом', cat: 'puzzle', isNew4: true, medals: [1000, 2200, 3600],
  hint: 'Внизу выбери цвет: область от левого верхнего угла зальётся им и сольётся с соседними клетками. Залей всё поле одним цветом, пока не кончились ходы. Чем больше ходов осталось после победы, тем больше очков.',
  d0: '8×8, 4 цвета, 22 хода', d1: '10×10, 5 цветов, 22 хода', d2: '10×10, 5 цветов, 18 ходов', d3: '12×12, 6 цветов, 20 ходов',
  colors: ['#f97316', '#ec4899'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#fff"/><circle cx="30" cy="30" r="13" fill="#ef4444"/><circle cx="70" cy="30" r="13" fill="#3b82f6"/><circle cx="30" cy="70" r="13" fill="#22c55e"/><circle cx="70" cy="70" r="13" fill="#eab308"/></svg>',
  create: function (api) {
    var N, K, left, board, cs, gx, gy, round, anim, t, winT, KIT = window.GBK;
    var PAL = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#f97316'];
    var SIZE = [8, 10, 10, 12], COLS = [4, 5, 5, 6], MOVES = [22, 22, 18, 20];
    function palBox() {
      var bw = Math.min(70, (api.W - 24) / K);
      return { bw: bw, x0: (api.W - bw * K) / 2, y: gy + cs * N + 40, h: bw - 12 };
    }
    function layout() { cs = Math.floor(Math.min(api.W - 24, api.H - 250) / N); gx = (api.W - cs * N) / 2; gy = 84; }
    function newBoard() {
      N = SIZE[api.diff]; K = COLS[api.diff]; left = MOVES[api.diff];
      board = []; anim = [];
      for (var i = 0; i < N * N; i++) { board.push(Math.floor(Math.random() * K)); anim.push(-Math.random() * 0.4 - (i % N + Math.floor(i / N)) * 0.03); }
      layout();
    }
    // заливка обходом в ширину: задержка анимации растёт с расстоянием от угла — получается волна
    function fill(col) {
      var from = board[0], q = [0], dist = {}, h = 0;
      if (col === from) return false;
      dist[0] = 0;
      while (h < q.length) {
        var k = q[h++];
        var r = Math.floor(k / N), c = k % N, nb = [];
        if (r > 0) nb.push(k - N); if (r < N - 1) nb.push(k + N); if (c > 0) nb.push(k - 1); if (c < N - 1) nb.push(k + 1);
        nb.forEach(function (m) { if (dist[m] === undefined && board[m] === from) { dist[m] = dist[k] + 1; q.push(m); } });
      }
      q.forEach(function (k2) { board[k2] = col; anim[k2] = -dist[k2] * 0.035; });
      return true;
    }
    function region() { var from = board[0], seen = {}, st = [0]; seen[0] = 1; while (st.length) { var k = st.pop(), r = Math.floor(k / N), c = k % N; [r > 0 ? k - N : -1, r < N - 1 ? k + N : -1, c > 0 ? k - 1 : -1, c < N - 1 ? k + 1 : -1].forEach(function (m) { if (m >= 0 && !seen[m] && board[m] === from) { seen[m] = 1; st.push(m); } }); } return seen; }
    function won() { return board.every(function (v) { return v === board[0]; }); }
    function paletteAt(x, y) {
      var p = palBox();
      if (y < p.y - 6 || y > p.y + p.h + 6) return -1;
      var k = Math.floor((x - p.x0) / p.bw);
      return k >= 0 && k < K ? k : -1;
    }
    return {
      reset: function () { round = 0; t = 0; winT = 0; newBoard(); },
      resize: function () { if (N) layout(); }, idle: function () { }, key: function () { },
      update: function (dt) {
        t += dt; for (var i = 0; i < anim.length; i++) if (anim[i] < 1) anim[i] = Math.min(1, anim[i] + dt * 4);
        if (winT > 0) { winT -= dt; if (winT <= 0) { round++; newBoard(); } }
      },
      input: function (type, d) {
        if (type !== 'down' || winT > 0) return;
        var col = paletteAt(d.x, d.y);
        if (col < 0 || !fill(col)) return;
        left--; api.sound('click'); api.vibrate(15);
        if (won()) { api.addScore(left * 120 + 300 * (api.diff + 1)); api.fx.confetti(40); api.sound('win'); winT = 1.2; return; }
        if (left <= 0) { api.sound('hit'); api.vibrate(60); api.gameOver(); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, own = region();
        KIT.bg(c, W, H, '#1c1917', '#0c0a09', 'rgba(249,115,22,.12)');
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = '#fafaf9'; c.font = '900 18px system-ui'; c.fillText('Поле ' + (round + 1), W / 2, 30);
        // полоска оставшихся ходов
        var bw2 = Math.min(260, W - 60), fr = left / MOVES[api.diff];
        KIT.rr(c, W / 2 - bw2 / 2, 48, bw2, 12, 6); c.fillStyle = 'rgba(255,255,255,.1)'; c.fill();
        KIT.rr(c, W / 2 - bw2 / 2, 48, Math.max(12, bw2 * fr), 12, 6); c.fillStyle = fr < 0.25 ? '#ef4444' : '#f59e0b'; c.fill();
        c.fillStyle = '#fde68a'; c.font = '800 12px system-ui'; c.fillText('ходов: ' + left, W / 2, 70);
        // подложка поля
        c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 18;
        KIT.rr(c, gx - 6, gy - 6, cs * N + 12, cs * N + 12, 14); c.fillStyle = '#292524'; c.fill(); c.restore();
        for (var i = 0; i < N * N; i++) {
          var a = Math.max(0, anim[i]), sc = a < 1 ? 0.6 + 0.4 * Math.sin(a * Math.PI / 2) + Math.sin(a * Math.PI) * 0.12 : 1;
          var x = gx + (i % N) * cs + cs / 2, y = gy + Math.floor(i / N) * cs + cs / 2, s2 = (cs - 3) * sc, col = PAL[board[i]];
          var g = c.createLinearGradient(x, y - s2 / 2, x, y + s2 / 2); g.addColorStop(0, KIT.shade(col, 0.25)); g.addColorStop(1, KIT.shade(col, -0.15));
          KIT.rr(c, x - s2 / 2, y - s2 / 2, s2, s2, Math.max(3, cs * 0.18)); c.fillStyle = g; c.fill();
          c.fillStyle = 'rgba(255,255,255,.22)'; KIT.rr(c, x - s2 / 2 + 2, y - s2 / 2 + 2, s2 - 4, s2 * 0.28, 3); c.fill();
          if (own[i]) { c.strokeStyle = 'rgba(255,255,255,' + (0.35 + 0.25 * Math.sin(t * 4)) + ')'; c.lineWidth = 1.5; KIT.rr(c, x - s2 / 2 + 1, y - s2 / 2 + 1, s2 - 2, s2 - 2, Math.max(3, cs * 0.18)); c.stroke(); }
        }
        // кнопки-кристаллы
        var p = palBox();
        for (var k = 0; k < K; k++) {
          var cx = p.x0 + k * p.bw + p.bw / 2, cy = p.y + p.h / 2, r = p.h / 2, cur = k === board[0];
          c.save(); c.shadowColor = PAL[k]; c.shadowBlur = cur ? 0 : 14;
          var rg = c.createRadialGradient(cx - r * 0.35, cy - r * 0.35, 2, cx, cy, r); rg.addColorStop(0, KIT.shade(PAL[k], 0.5)); rg.addColorStop(1, KIT.shade(PAL[k], -0.2));
          c.fillStyle = rg; c.globalAlpha = cur ? 0.35 : 1; c.beginPath(); c.arc(cx, cy, r, 0, 6.283); c.fill(); c.restore();
          c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(cx - r * 0.3, cy - r * 0.4, r * 0.32, r * 0.18, -0.5, 0, 6.283); c.fill();
          if (cur) { c.fillStyle = '#fff'; c.font = '900 ' + Math.round(r) + 'px system-ui'; c.fillText('✓', cx, cy + 1); }
        }
        c.fillStyle = '#a8a29e'; c.font = '700 12px system-ui'; c.fillText('Заливка начинается из левого верхнего угла', W / 2, p.y + p.h + 24);
      }
    };
  }
};
