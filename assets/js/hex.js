/* Гекс: красные соединяют верх и низ, синие — левый и правый края. Ничьих не бывает */
window.GAMES = window.GAMES || {};
window.GAMES.hex = {
  title: 'Гекс', desc: 'Соедини свои края поля', cat: 'board', isNew4: true, modes: true, lan: true, medals: [100, 250, 500],
  hint: 'По очереди ставьте фишки на шестиугольники. Красные (первый игрок) должны соединить цепочкой верхний и нижний края, синие — левый и правый. Ничьих в Гексе не бывает: кто-то обязательно соединит.',
  d0: 'Поле 7×7, простой соперник', d1: 'Поле 9×9', d2: 'Поле 9×9, сильнее', d3: 'Поле 11×11, сильный соперник',
  colors: ['#dc2626', '#2563eb'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#0f172a"/><path d="M14 22h72" stroke="#ef4444" stroke-width="5"/><path d="M14 80h72" stroke="#ef4444" stroke-width="5"/><g stroke="#334155" stroke-width="2"><polygon points="30,38 38,33 46,38 46,47 38,52 30,47" fill="#ef4444"/><polygon points="46,47 54,42 62,47 62,56 54,61 46,56" fill="#ef4444"/><polygon points="38,52 46,56 46,65 38,70 30,65 30,56" fill="#3b82f6"/><polygon points="62,38 70,33 78,38 78,47 70,52 62,47" fill="#3b82f6"/></g></svg>',
  create: function (api) {
    var K = window.GBK, N, board, turn, wins, netQ, endT, t, thinkT, roundOver, roundT, last, winPath, hs, ox, oy;
    var NB = [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0]];
    function names() { return api.mode === 1 ? [api.t('g.p1'), api.t('g.p2')] : api.mode === 2 ? (api.net.side === 0 ? [api.t('g.you'), api.t('net.opp')] : [api.t('net.opp'), api.t('g.you')]) : [api.t('g.you'), api.t('g.cpu')]; }
    function me() { return api.mode === 2 ? api.net.side + 1 : 1; }
    function myTurn() { return api.mode === 1 || turn === me(); }
    // поиск пути: для игрока p стоимость своей клетки 0, пустой 1, чужой — непроходимо
    function dist(p, b) {
      b = b || board; var D = new Array(N * N).fill(1e9), dq = [];
      for (var i = 0; i < N; i++) { var k = p === 1 ? i : i * N, c = b[k] === p ? 0 : b[k] ? -1 : 1; if (c >= 0) { D[k] = c; c ? dq.push(k) : dq.unshift(k); } }
      while (dq.length) {
        var u = dq.shift(), ur = (u / N) | 0, uc = u % N;
        for (var j = 0; j < 6; j++) {
          var r = ur + NB[j][0], cc = uc + NB[j][1]; if (r < 0 || cc < 0 || r >= N || cc >= N) continue;
          var v = r * N + cc; if (b[v] && b[v] !== p) continue; var w = b[v] === p ? 0 : 1;
          if (D[u] + w < D[v]) { D[v] = D[u] + w; w ? dq.push(v) : dq.unshift(v); }
        }
      }
      var best = 1e9; for (var e = 0; e < N; e++) best = Math.min(best, D[p === 1 ? (N - 1) * N + e : e * N + N - 1]);
      return best;
    }
    function winner() { // цепочка игрока, соединившая края
      for (var p = 1; p <= 2; p++) {
        var seen = {}, prev = {}, q = [];
        for (var i = 0; i < N; i++) { var k = p === 1 ? i : i * N; if (board[k] === p) { q.push(k); seen[k] = 1; } }
        while (q.length) {
          var u = q.shift(), ur = (u / N) | 0, uc = u % N;
          if ((p === 1 && ur === N - 1) || (p === 2 && uc === N - 1)) { var path = []; while (u !== undefined) { path.push(u); u = prev[u]; } winPath = path; return p; }
          for (var j = 0; j < 6; j++) { var r = ur + NB[j][0], c = uc + NB[j][1]; if (r < 0 || c < 0 || r >= N || c >= N) continue; var v = r * N + c; if (board[v] === p && !seen[v]) { seen[v] = 1; prev[v] = u; q.push(v); } }
        }
      }
      return 0;
    }
    function newRound() {
      N = api.mode === 0 ? [7, 9, 9, 11][api.diff] : 9;
      board = new Array(N * N).fill(0); turn = roundOver === 1 ? 2 : 1; if (api.mode !== 0) turn = 1;
      roundOver = 0; roundT = 0; last = -1; winPath = null; thinkT = 0.6; layout();
    }
    function place(i, remote) {
      if (board[i] || roundOver) return;
      if (api.mode === 2 && !remote) api.net.send({ i: i });
      board[i] = turn; last = i; api.sound('click'); api.vibrate(8);
      var w = winner();
      if (w) {
        roundOver = w; roundT = 0; wins[w - 1]++;
        var mine = api.mode === 1 || w === me(); api.sound(mine ? 'win' : 'hit'); if (mine) api.fx.confetti(40);
        if (api.mode === 0 && w === 1) api.addScore(120 * (api.diff + 1) + (N * N - board.filter(Boolean).length) * 2);
        if (wins[w - 1] >= 2) endT = 2.2;
        return;
      }
      turn = 3 - turn; thinkT = 0.4 + Math.random() * 0.4;
    }
    function aiMove() {
      var empty = []; for (var i = 0; i < N * N; i++) if (!board[i]) empty.push(i);
      if (api.diff === 0 && Math.random() < 0.5) { place(empty[Math.floor(Math.random() * empty.length)]); return; }
      var c0 = ((N / 2) | 0) * N + ((N / 2) | 0);
      if (!board[c0] && board.filter(Boolean).length < 2) { place(c0); return; }
      var best = empty[0], bs = -1e9;
      empty.forEach(function (i) {
        board[i] = 2; var my = dist(2), op = dist(1); board[i] = 0;
        var s = (op - my) * 10 - (api.diff < 2 ? Math.random() * 12 : Math.random() * 2);
        if (my === 0) s += 1000;
        if (s > bs) { bs = s; best = i; }
      });
      place(best);
    }
    function layout() {
      // ромб из шестиугольников: ширина = (N + N/2) клеток
      hs = Math.min((api.W - 56) / ((N + (N - 1) / 2) * Math.sqrt(3)), (api.H - 230) / (N * 1.5 + 0.5));
      var w = (N + (N - 1) / 2) * Math.sqrt(3) * hs; ox = (api.W - w) / 2 + Math.sqrt(3) * hs / 2; oy = 110 + hs;
    }
    function cxy(i) { var r = (i / N) | 0, c = i % N; return [ox + (c + r / 2) * Math.sqrt(3) * hs, oy + r * 1.5 * hs]; }
    function hexPath(c, x, y, s) { c.beginPath(); for (var k = 0; k < 6; k++) { var a = Math.PI / 6 + k * Math.PI / 3; c.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); } c.closePath(); }
    return {
      reset: function () { wins = [0, 0]; netQ = []; endT = 0; t = 0; roundOver = 0; newRound(); },
      resize: function () { if (N) layout(); }, idle: function (dt) { t += dt || 0; }, key: function () { },
      netMsg: function (d) { netQ.push(d); },
      input: function (type, d) {
        if (type !== 'tap' || endT > 0) return;
        if (roundOver) { if (roundT > 1 && api.mode !== 2) newRound(); return; }
        if (!myTurn() || (api.mode === 0 && turn === 2)) return;
        for (var i = 0; i < N * N; i++) { var p = cxy(i); if (Math.hypot(p[0] - d.x, p[1] - d.y) < hs * 0.9) { place(i); return; } }
      },
      update: function (dt) {
        t += dt;
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (roundOver) { roundT += dt; if (api.mode === 2 && roundT > 2.4) newRound(); return; }
        if (api.mode === 0 && turn === 2) { thinkT -= dt; if (thinkT <= 0) aiMove(); }
        if (api.mode === 2 && turn !== me() && netQ.length) { var m = netQ.shift(); if (m.i >= 0 && m.i < N * N) place(m.i, true); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, nm = names(), COL = ['#ef4444', '#3b82f6'];
        K.bg(c, W, H, '#0f172a', '#020617', 'rgba(99,102,241,.12)');
        c.textAlign = 'center'; c.textBaseline = 'middle';
        [0, 1].forEach(function (p) {
          var x = p ? W * 0.75 : W * 0.25, act = !roundOver && turn === p + 1;
          c.fillStyle = act ? '#fde68a' : COL[p]; c.font = '800 15px system-ui'; c.fillText((act ? '▶ ' : '') + nm[p], x, 30);
          c.fillStyle = '#94a3b8'; c.font = '700 12px system-ui'; c.fillText((p ? 'лево ↔ право' : 'верх ↕ низ') + ' · побед ' + wins[p], x, 52);
        });
        // цветные края
        var a = cxy(0), b = cxy(N - 1), cc = cxy((N - 1) * N), dd = cxy(N * N - 1), e = hs * 1.25;
        c.lineWidth = 6; c.lineCap = 'round';
        c.strokeStyle = COL[0]; c.beginPath(); c.moveTo(a[0] - e, a[1] - e); c.lineTo(b[0] + e * 0.4, b[1] - e); c.stroke(); c.beginPath(); c.moveTo(cc[0] - e * 0.4, cc[1] + e); c.lineTo(dd[0] + e, dd[1] + e); c.stroke();
        c.strokeStyle = COL[1]; c.beginPath(); c.moveTo(a[0] - e, a[1] - e * 0.6); c.lineTo(cc[0] - e, cc[1] + e * 0.4); c.stroke(); c.beginPath(); c.moveTo(b[0] + e, b[1] - e * 0.4); c.lineTo(dd[0] + e, dd[1] + e * 0.6); c.stroke();
        var onPath = {}; (winPath || []).forEach(function (k) { onPath[k] = 1; });
        for (var i = 0; i < N * N; i++) {
          var p = cxy(i), v = board[i];
          hexPath(c, p[0], p[1], hs * 0.96);
          if (v) { var g = c.createRadialGradient(p[0] - hs * 0.3, p[1] - hs * 0.3, 1, p[0], p[1], hs); g.addColorStop(0, v === 1 ? '#fca5a5' : '#93c5fd'); g.addColorStop(1, COL[v - 1]); c.fillStyle = g; }
          else c.fillStyle = '#1e293b';
          c.fill(); c.strokeStyle = '#0b1220'; c.lineWidth = 2; c.stroke();
          if (onPath[i]) { hexPath(c, p[0], p[1], hs * 0.55); c.fillStyle = 'rgba(255,255,255,' + (0.5 + 0.3 * Math.sin(t * 6)) + ')'; c.fill(); }
          if (i === last && !winPath) { c.fillStyle = '#fff'; c.beginPath(); c.arc(p[0], p[1], hs * 0.18, 0, 6.283); c.fill(); }
        }
        var tip;
        if (roundOver) tip = (api.mode === 1 ? api.t(roundOver === 1 ? 'g.p1win' : 'g.p2win') : roundOver === me() ? api.t('g.win') : api.t('g.lose')) + (endT || api.mode === 2 ? '' : ' · ' + api.t('g.tapContinue'));
        else if (api.mode === 0 && turn === 2) tip = 'Компьютер думает…';
        else if (api.mode === 2 && turn !== me()) tip = api.t('net.oppTurn');
        else tip = (api.mode === 1 ? nm[turn - 1] + ', ' : '') + 'твой ход';
        K.toast(c, W, H - 46, tip, 1);
      }
    };
  }
};
