/* Уголки: переведи все свои фишки в угол соперника. Ход — шаг на соседнюю клетку или серия прыжков через фишки */
window.GAMES = window.GAMES || {};
window.GAMES.ugolki = {
  title: 'Уголки', desc: 'Перебери фишки в чужой угол', cat: 'board', isNew4: true, modes: true, lan: true, medals: [150, 400, 800],
  hint: 'Нажми на свою фишку, затем на подсвеченную клетку. Ходить можно на соседнюю клетку по горизонтали или вертикали либо перепрыгивать через любые фишки — несколько прыжков подряд за один ход. Кто первым займёт угол соперника, тот победил.',
  d0: 'Компьютер играет слабо', d1: 'Обычный соперник', d2: 'Хитрый соперник', d3: 'Сильный соперник',
  colors: ['#0f766e', '#134e4a'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#e7d3a8"/><g fill="#b98b4e"><rect x="16" y="16" width="17" height="17"/><rect x="50" y="16" width="17" height="17"/><rect x="33" y="33" width="17" height="17"/><rect x="67" y="33" width="17" height="17"/><rect x="16" y="50" width="17" height="17"/><rect x="50" y="50" width="17" height="17"/><rect x="33" y="67" width="17" height="17"/><rect x="67" y="67" width="17" height="17"/></g><g fill="#f8fafc" stroke="#334155" stroke-width="2"><circle cx="24" cy="76" r="6"/><circle cx="41" cy="76" r="6"/><circle cx="24" cy="59" r="6"/></g><g fill="#1f2937"><circle cx="76" cy="24" r="6"/><circle cx="59" cy="24" r="6"/><circle cx="76" cy="41" r="6"/></g></svg>',
  create: function (api) {
    var N = 8, ROWS = 3, COLS = 4, K = window.GBK, LIMIT = 80;
    var board, turn, sel, opts, netQ, wins, endT, t, thinkT, last, cs, ox, oy, roundOver, roundT, moves, anim;
    function names() { return api.mode === 1 ? [api.t('g.p1'), api.t('g.p2')] : api.mode === 2 ? (api.net.side === 0 ? [api.t('g.you'), api.t('net.opp')] : [api.t('net.opp'), api.t('g.you')]) : [api.t('g.you'), api.t('g.cpu')]; }
    function me() { return api.mode === 2 ? api.net.side + 1 : 1; }
    function myTurn() { return api.mode === 1 || turn === me(); }
    // игрок 1 начинает внизу слева и идёт в правый верхний угол; игрок 2 — наоборот
    function home(p, r, c) { return p === 1 ? r >= N - ROWS && c < COLS : r < ROWS && c >= N - COLS; }
    function target(p, r, c) { return home(3 - p, r, c); }
    function inTarget(p) { var n = 0; for (var i = 0; i < N * N; i++) if (board[i] === p && target(p, Math.floor(i / N), i % N)) n++; return n; }
    function dist(p) { var s = 0; for (var i = 0; i < N * N; i++) if (board[i] === p) { var r = Math.floor(i / N), c = i % N; s += p === 1 ? r + (N - 1 - c) : (N - 1 - r) + c; } return s; }
    // куда можно сходить фишкой a: шаги и цепочки прыжков; для каждой цели — путь
    function reach(a) {
      var res = {}, r0 = Math.floor(a / N), c0 = a % N, D = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      D.forEach(function (d) { var r = r0 + d[0], c = c0 + d[1]; if (r >= 0 && c >= 0 && r < N && c < N && !board[r * N + c]) res[r * N + c] = [a, r * N + c]; });
      var q = [[a]], seen = {}; seen[a] = 1;
      while (q.length) {
        var path = q.shift(), cur = path[path.length - 1], cr = Math.floor(cur / N), cc = cur % N;
        D.forEach(function (d) {
          var mr = cr + d[0], mc = cc + d[1], tr = cr + 2 * d[0], tc = cc + 2 * d[1];
          if (tr < 0 || tc < 0 || tr >= N || tc >= N) return;
          var mi = mr * N + mc, ti = tr * N + tc;
          if (board[mi] && !board[ti] && !seen[ti]) { seen[ti] = 1; var np = path.concat(ti); if (!res[ti]) res[ti] = np; q.push(np); }
        });
      }
      return res;
    }
    function newRound() {
      board = []; for (var i = 0; i < N * N; i++) { var r = Math.floor(i / N), c = i % N; board.push(home(1, r, c) ? 1 : home(2, r, c) ? 2 : 0); }
      turn = 1; sel = -1; opts = null; last = null; roundOver = 0; roundT = 0; moves = 0; thinkT = 0.7; anim = null;
    }
    function finish(w) {
      roundOver = w; roundT = 0; if (w < 3) wins[w - 1]++;
      var mine = api.mode === 1 || w === me();
      api.sound(w === 3 ? 'click' : mine ? 'win' : 'hit'); if (w < 3 && mine) api.fx.confetti(40);
      if (api.mode === 0 && w === 1) api.addScore(150 * (api.diff + 1) + Math.max(0, 60 - moves) * 3);
      if (w < 3 && wins[w - 1] >= 2) endT = 2.2; else if (w === 3 && wins[0] + wins[1] >= 3) endT = 2.2;
    }
    function doMove(path, remote) {
      if (api.mode === 2 && !remote) api.net.send({ p: path });
      var a = path[0], b = path[path.length - 1];
      board[b] = board[a]; board[a] = 0; last = path; anim = { path: path, t: 0, p: board[b] }; sel = -1; opts = null;
      api.sound('click'); api.vibrate(8); moves++;
      if (inTarget(turn) === ROWS * COLS) { finish(turn); return; }
      if (moves >= LIMIT * 2) { var a1 = inTarget(1), a2 = inTarget(2); finish(a1 > a2 ? 1 : a2 > a1 ? 2 : 3); return; }
      turn = 3 - turn; thinkT = 0.5 + Math.random() * 0.4;
    }
    function aiMove() {
      var all = [];
      for (var i = 0; i < N * N; i++) if (board[i] === 2) { var R = reach(i); Object.keys(R).forEach(function (k) { all.push(R[k]); }); }
      if (!all.length) { turn = 1; return; }
      var base = dist(2);
      all.forEach(function (p) {
        var a = p[0], b = p[p.length - 1], ar = Math.floor(a / N), ac = a % N, br = Math.floor(b / N), bc = b % N;
        var gain = ((br - ar) - (bc - ac)); // вниз и влево — к цели
        var s = gain * 10 + Math.random() * (api.diff === 0 ? 30 : 4);
        if (api.diff >= 1 && target(2, br, bc) && !target(2, ar, ac)) s += 6;
        if (api.diff >= 1 && target(2, ar, ac) && gain <= 0) s -= 25; // не уходить из цели
        if (api.diff >= 2) s += (ar - (N - 1 - ac)) * 0.8; // сначала подтягивать отстающие
        p.s = s;
      });
      all.sort(function (x, y) { return y.s - x.s; });
      doMove(api.diff === 0 ? all[Math.floor(Math.random() * Math.min(6, all.length))] : all[0]);
    }
    function layout() { var size = Math.min(api.W - 24, api.H - 220); cs = Math.floor(size / N); ox = (api.W - cs * N) / 2; oy = 96 + (api.H - 190 - cs * N) / 2; }
    function cellXY(i) { return [ox + (i % N) * cs + cs / 2, oy + Math.floor(i / N) * cs + cs / 2]; }
    return {
      reset: function () { wins = [0, 0]; endT = 0; netQ = []; t = 0; layout(); newRound(); },
      resize: layout, idle: function (dt) { t += dt || 0; }, key: function () { },
      netMsg: function (d) { netQ.push(d); },
      input: function (type, d) {
        if (type !== 'tap' || endT > 0) return;
        if (roundOver) { if (roundT > 1 && api.mode !== 2) newRound(); return; }
        if (!myTurn() || (api.mode === 0 && turn === 2)) return;
        var c = Math.floor((d.x - ox) / cs), r = Math.floor((d.y - oy) / cs); if (c < 0 || r < 0 || c >= N || r >= N) return;
        var i = r * N + c;
        if (board[i] === turn) { sel = i; opts = reach(i); api.sound('click'); return; }
        if (sel >= 0 && opts && opts[i]) doMove(opts[i]);
      },
      update: function (dt) {
        t += dt; if (anim) { anim.t += dt; if (anim.t > 0.18 * (anim.path.length - 1) + 0.1) anim = null; }
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (roundOver) { roundT += dt; if (api.mode === 2 && roundT > 2.2) newRound(); return; }
        if (api.mode === 0 && turn === 2) { thinkT -= dt; if (thinkT <= 0) aiMove(); }
        if (api.mode === 2 && turn !== me() && netQ.length) { var m = netQ.shift(); if (m.p && board[m.p[0]] === turn) doMove(m.p, true); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, nm = names();
        K.bg(c, W, H, '#134e4a', '#042f2e', 'rgba(45,212,191,.12)');
        [0, 1].forEach(function (p) {
          var x = p ? W - 16 : 16, act = !roundOver && turn === p + 1;
          c.textAlign = p ? 'right' : 'left'; c.textBaseline = 'middle'; c.fillStyle = act ? '#fde68a' : '#ccfbf1'; c.font = '800 15px system-ui';
          c.fillText((p ? '● ' : '○ ') + nm[p] + (act ? ' ◀' : ''), x, 30);
          c.font = '700 12px system-ui'; c.fillStyle = '#99f6e4'; c.fillText('в углу ' + inTarget(p + 1) + '/' + ROWS * COLS + ' · побед ' + wins[p], x, 52);
        });
        c.textAlign = 'center'; c.fillStyle = '#5eead4'; c.font = '700 12px system-ui'; c.fillText('ход ' + Math.ceil((moves + 1) / 2) + ' из ' + LIMIT, W / 2, 74);
        c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 20; c.shadowOffsetY = 6;
        K.rr(c, ox - 8, oy - 8, cs * N + 16, cs * N + 16, 12); c.fillStyle = '#5b3a1a'; c.fill(); c.restore();
        for (var i = 0; i < N * N; i++) {
          var r = Math.floor(i / N), cc = i % N, x = ox + cc * cs, y = oy + r * cs;
          c.fillStyle = (r + cc) % 2 ? '#b98b4e' : '#ecd9b0'; c.fillRect(x, y, cs, cs);
          if (home(1, r, cc)) { c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x, y, cs, cs); }
          if (home(2, r, cc)) { c.fillStyle = 'rgba(15,23,42,.18)'; c.fillRect(x, y, cs, cs); }
        }
        if (last) { c.strokeStyle = 'rgba(245,158,11,.75)'; c.lineWidth = 3; c.setLineDash([6, 5]); c.beginPath(); last.forEach(function (q, k) { var p = cellXY(q); if (k) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.stroke(); c.setLineDash([]); }
        if (opts) Object.keys(opts).forEach(function (k) { var p = cellXY(+k); c.fillStyle = 'rgba(34,197,94,' + (0.55 + 0.25 * Math.sin(t * 6)) + ')'; c.beginPath(); c.arc(p[0], p[1], cs * 0.17, 0, 6.283); c.fill(); });
        function piece(x, y, v, hl) {
          var R2 = cs * 0.36;
          c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 6; c.shadowOffsetY = 3;
          var pg = c.createRadialGradient(x - R2 * 0.35, y - R2 * 0.35, 2, x, y, R2);
          if (v === 1) { pg.addColorStop(0, '#ffffff'); pg.addColorStop(1, '#cbd5e1'); } else { pg.addColorStop(0, '#64748b'); pg.addColorStop(1, '#0f172a'); }
          c.fillStyle = pg; c.beginPath(); c.arc(x, y, R2, 0, 6.283); c.fill(); c.restore();
          c.strokeStyle = v === 1 ? 'rgba(100,116,139,.5)' : 'rgba(148,163,184,.35)'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, R2 * 0.6, 0, 6.283); c.stroke();
          if (hl) { c.strokeStyle = '#22c55e'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, R2 + 3, 0, 6.283); c.stroke(); }
        }
        for (var j = 0; j < N * N; j++) {
          if (!board[j] || (anim && j === anim.path[anim.path.length - 1])) continue;
          var p = cellXY(j); piece(p[0], p[1], board[j], j === sel);
        }
        if (anim) { // фишка прыгает по пути
          var seg = Math.min(anim.path.length - 2, Math.floor(anim.t / 0.18)), f = Math.min(1, (anim.t - seg * 0.18) / 0.18);
          var a = cellXY(anim.path[seg]), b = cellXY(anim.path[seg + 1]), hop = Math.sin(f * Math.PI) * cs * 0.35;
          piece(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f - hop, anim.p, false);
        }
        var tip;
        if (roundOver) tip = roundOver === 3 ? api.t('g.draw') : (api.mode === 1 ? api.t(roundOver === 1 ? 'g.p1win' : 'g.p2win') : roundOver === me() ? api.t('g.win') : api.t('g.lose')) + (endT || api.mode === 2 ? '' : ' · ' + api.t('g.tapContinue'));
        else if (api.mode === 0 && turn === 2) tip = 'Компьютер думает…';
        else if (api.mode === 2 && turn !== me()) tip = api.t('net.oppTurn');
        else tip = (api.mode === 1 ? nm[turn - 1] + ': ' : '') + (sel < 0 ? 'Выбери фишку' : 'Куда пойти?');
        K.toast(c, W, H - 46, tip, 1);
      }
    };
  }
};
