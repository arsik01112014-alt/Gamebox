/* Коридор: доведи фишку до другого края, ставь стенки сопернику */
window.GAMES = window.GAMES || {};
window.GAMES.quoridor = {
  title: 'Коридор', desc: 'Дойди до края и перекрой путь', cat: 'board', isNew4: true, modes: true, lan: true, medals: [150, 300, 500],
  hint: 'Нажми на подсвеченную клетку, чтобы шагнуть. Кнопка «Стенка» — режим стенок: нажми между клетками, повторное нажатие поворачивает стенку, «Поставить» — подтвердить. Стенку нельзя ставить так, чтобы полностью закрыть путь. Кто первым дойдёт до противоположного края — победил.',
  d0: 'Простой соперник', d1: 'Соперник ставит стенки', d2: 'Соперник умнее', d3: 'Сильный соперник',
  colors: ['#4f46e5', '#1e1b4b'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#312e81"/><g fill="#4338ca"><rect x="14" y="14" width="14" height="14" rx="3"/><rect x="33" y="14" width="14" height="14" rx="3"/><rect x="52" y="14" width="14" height="14" rx="3"/><rect x="71" y="14" width="14" height="14" rx="3"/><rect x="14" y="33" width="14" height="14" rx="3"/><rect x="33" y="33" width="14" height="14" rx="3"/><rect x="52" y="33" width="14" height="14" rx="3"/><rect x="71" y="33" width="14" height="14" rx="3"/><rect x="14" y="52" width="14" height="14" rx="3"/><rect x="33" y="52" width="14" height="14" rx="3"/><rect x="52" y="52" width="14" height="14" rx="3"/><rect x="71" y="52" width="14" height="14" rx="3"/><rect x="14" y="71" width="14" height="14" rx="3"/><rect x="33" y="71" width="14" height="14" rx="3"/><rect x="52" y="71" width="14" height="14" rx="3"/><rect x="71" y="71" width="14" height="14" rx="3"/></g><rect x="13" y="48" width="34" height="4" rx="2" fill="#fbbf24"/><rect x="48" y="32" width="4" height="34" rx="2" fill="#fbbf24"/><circle cx="40" cy="78" r="6" fill="#f87171"/><circle cx="59" cy="21" r="6" fill="#60a5fa"/></svg>',
  create: function (api) {
    var K = window.GBK, N = 9, pw, walls, wl, turn, netQ, endT, t, thinkT, over, wallMode, pend, cs, ox, oy, msg, msgT, lastW;
    // стенки: H[r][c] — горизонтальная под клетками (r,c),(r,c+1); V[r][c] — вертикальная справа от (r,c),(r+1,c)
    function names() { return api.mode === 1 ? [api.t('g.p1'), api.t('g.p2')] : api.mode === 2 ? (api.net.side === 0 ? [api.t('g.you'), api.t('net.opp')] : [api.t('net.opp'), api.t('g.you')]) : [api.t('g.you'), api.t('g.cpu')]; }
    function me() { return api.mode === 2 ? api.net.side + 1 : 1; }
    function myTurn() { return !over && (api.mode === 1 ? true : api.mode === 2 ? turn === me() : turn === 1); }
    function goal(p) { return p === 1 ? 0 : N - 1; }
    function key(o, r, c) { return o + r * 10 + c; }
    function blocked(W, r, c, dr, dc) { // есть ли стенка между (r,c) и (r+dr,c+dc)
      if (dr) { var rr = dr > 0 ? r : r - 1; return W[key(100, rr, c)] || W[key(100, rr, c - 1)]; }
      var cc = dc > 0 ? c : c - 1; return W[key(200, r, cc)] || W[key(200, r - 1, cc)];
    }
    function inB(r, c) { return r >= 0 && c >= 0 && r < N && c < N; }
    function pathLen(W, p, from) {
      var s = from || pw[p - 1], seen = {}, q = [[s[0], s[1], 0]]; seen[s[0] * N + s[1]] = 1;
      while (q.length) {
        var u = q.shift(); if (u[0] === goal(p)) return u[2];
        for (var d = 0; d < 4; d++) { var dr = [1, -1, 0, 0][d], dc = [0, 0, 1, -1][d], r = u[0] + dr, c = u[1] + dc; if (!inB(r, c) || seen[r * N + c] || blocked(W, u[0], u[1], dr, dc)) continue; seen[r * N + c] = 1; q.push([r, c, u[2] + 1]); }
      }
      return -1;
    }
    function legalSteps(p) {
      var a = pw[p - 1], o = pw[2 - p], res = [];
      for (var d = 0; d < 4; d++) {
        var dr = [1, -1, 0, 0][d], dc = [0, 0, 1, -1][d], r = a[0] + dr, c = a[1] + dc;
        if (!inB(r, c) || blocked(walls, a[0], a[1], dr, dc)) continue;
        if (r === o[0] && c === o[1]) { // прыжок через соперника
          var jr = r + dr, jc = c + dc;
          if (inB(jr, jc) && !blocked(walls, r, c, dr, dc)) res.push([jr, jc]);
          else for (var s = -1; s <= 1; s += 2) { var sr = dr ? 0 : s, sc = dr ? s : 0, nr = r + sr, nc = c + sc; if (inB(nr, nc) && !blocked(walls, r, c, sr, sc)) res.push([nr, nc]); }
        } else res.push([r, c]);
      }
      return res;
    }
    function wallOk(o, r, c) {
      if (r < 0 || c < 0 || r > N - 2 || c > N - 2) return false;
      if (walls[key(o, r, c)] || walls[key(300 - o, r, c)]) return false;
      if (o === 100 && (walls[key(100, r, c - 1)] || walls[key(100, r, c + 1)])) return false;
      if (o === 200 && (walls[key(200, r - 1, c)] || walls[key(200, r + 1, c)])) return false;
      walls[key(o, r, c)] = 1; var ok = pathLen(walls, 1) >= 0 && pathLen(walls, 2) >= 0; delete walls[key(o, r, c)];
      return ok;
    }
    function doMove(m, remote) { // m: {m:[r,c]} или {w:[o,r,c]}
      if (api.mode === 2 && !remote) api.net.send(m);
      if (m.m) { pw[turn - 1] = [m.m[0], m.m[1]]; api.sound('click'); if (m.m[0] === goal(turn)) return win(turn); }
      else { walls[key(m.w[0], m.w[1], m.w[2])] = 1; wl[turn - 1]--; lastW = key(m.w[0], m.w[1], m.w[2]); api.sound('hit'); api.vibrate(12); }
      turn = 3 - turn; wallMode = false; pend = null; thinkT = 0.5 + Math.random() * 0.4;
    }
    function win(p) {
      over = p; var mine = api.mode === 1 || p === me();
      api.sound(mine ? 'win' : 'hit'); if (mine) api.fx.confetti(50);
      if (api.mode === 0 && p === 1) api.addScore(150 + api.diff * 100 + wl[0] * 15 + pathLen(walls, 2) * 10);
      endT = 2.8;
    }
    function aiMove() {
      var my = pathLen(walls, 2), op = pathLen(walls, 1);
      var useWalls = api.diff > 0 && wl[1] > 0 && (op < my || op <= 3 + api.diff) && Math.random() < [0, 0.6, 0.85, 1][api.diff];
      if (useWalls) {
        var best = null, bs = api.diff >= 2 ? 0 : -1;
        for (var o = 100; o <= 200; o += 100) for (var r = 0; r < N - 1; r++) for (var c = 0; c < N - 1; c++) {
          if (!wallOk(o, r, c)) continue;
          walls[key(o, r, c)] = 1; var s = pathLen(walls, 1) - op - (pathLen(walls, 2) - my) * 1.1 + Math.random() * 0.2; delete walls[key(o, r, c)];
          if (s > bs) { bs = s; best = [o, r, c]; }
        }
        if (best && bs >= 1) return doMove({ w: best });
      }
      var st = legalSteps(2), bm = st[0], bl = 1e9;
      st.forEach(function (s) { var l = pathLen(walls, 2, s) + (api.diff === 0 ? Math.random() * 2.5 : Math.random() * 0.1); if (l < bl) { bl = l; bm = s; } });
      doMove({ m: bm });
    }
    function flip() { return api.mode === 2 && api.net.side === 1; }
    function layout() { cs = Math.min((api.W - 24) / N, (api.H - 250) / N); ox = (api.W - cs * N) / 2; oy = 92; }
    function cellXY(r, c) { if (flip()) { r = N - 1 - r; c = N - 1 - c; } return [ox + c * cs, oy + r * cs]; }
    function toCell(x, y) { var c = Math.floor((x - ox) / cs), r = Math.floor((y - oy) / cs); if (flip()) { r = N - 1 - r; c = N - 1 - c; } return [r, c]; }
    function wallRect(o, r, c) { // в экранных координатах
      var a = cellXY(r, c), b = cellXY(r + 1, c + 1), x0 = Math.min(a[0], b[0]), y0 = Math.min(a[1], b[1]), m = cs * 0.08;
      var cx = x0 + cs, cy = y0 + cs; // перекрёсток
      return o === 100 ? [cx - cs + m, cy - cs * 0.07, cs * 2 - m * 2, cs * 0.14] : [cx - cs * 0.07, cy - cs + m, cs * 0.14, cs * 2 - m * 2];
    }
    function btns() { var y = oy + cs * N + 18, w = Math.min(150, (api.W - 36) / 2); return { wall: [api.W / 2 - w - 6, y, w, 44], ok: [api.W / 2 + 6, y, w, 44] }; }
    function hit(b, d) { return d.x >= b[0] && d.x <= b[0] + b[2] && d.y >= b[1] && d.y <= b[1] + b[3]; }
    function say(s) { msg = s; msgT = 1.5; }
    return {
      reset: function () {
        pw = [[N - 1, 4], [0, 4]]; walls = {}; wl = [10, 10]; turn = 1; netQ = []; endT = 0; t = 0; over = 0; wallMode = false; pend = null; msgT = 0; thinkT = 0.8; lastW = -1; layout();
      },
      resize: layout, idle: function (dt) { t += dt || 0; }, key: function () { },
      netMsg: function (d) { netQ.push(d); },
      input: function (type, d) {
        if (type !== 'down' || !myTurn()) return;
        var B = btns();
        if (hit(B.wall, d)) { if (wl[turn - 1] <= 0) { say('Стенки закончились'); return; } wallMode = !wallMode; pend = null; api.sound('click'); return; }
        if (wallMode && hit(B.ok, d)) { if (pend) doMove({ w: pend }); else say('Нажми между клетками'); return; }
        if (wallMode) {
          // ближайший перекрёсток
          var gx = Math.round((d.x - ox) / cs), gy = Math.round((d.y - oy) / cs);
          if (gx < 1 || gy < 1 || gx > N - 1 || gy > N - 1) return;
          var r = gy - 1, c = gx - 1; if (flip()) { r = N - 2 - r; c = N - 2 - c; }
          var o = pend && pend[1] === r && pend[2] === c ? 300 - pend[0] : 100;
          if (!wallOk(o, r, c)) o = 300 - o;
          if (!wallOk(o, r, c)) { say('Сюда нельзя'); api.vibrate(30); return; }
          pend = [o, r, c]; api.sound('click'); return;
        }
        var rc = toCell(d.x, d.y);
        legalSteps(turn).forEach(function (s) { if (s[0] === rc[0] && s[1] === rc[1]) doMove({ m: s }); });
      },
      update: function (dt) {
        t += dt; if (msgT > 0) msgT -= dt;
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (over) return;
        if (api.mode === 0 && turn === 2) { thinkT -= dt; if (thinkT <= 0) aiMove(); }
        if (api.mode === 2 && turn !== me() && netQ.length) {
          var m = netQ.shift();
          if (m.m && legalSteps(turn).some(function (s) { return s[0] === m.m[0] && s[1] === m.m[1]; })) doMove(m, true);
          else if (m.w && wl[turn - 1] > 0 && wallOk(m.w[0], m.w[1], m.w[2])) doMove(m, true);
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H, nm = names(), COL = ['#ef4444', '#3b82f6'];
        K.bg(c, W, H, '#1e1b4b', '#0b0a1f', 'rgba(129,140,248,.14)');
        c.textAlign = 'center'; c.textBaseline = 'middle';
        [0, 1].forEach(function (p) {
          var x = p ? W * 0.75 : W * 0.25, act = !over && turn === p + 1;
          c.fillStyle = act ? '#fde68a' : COL[p]; c.font = '800 15px system-ui'; c.fillText((act ? '▶ ' : '') + nm[p], x, 30);
          c.fillStyle = '#a5b4fc'; c.font = '700 12px system-ui'; c.fillText('стенок: ' + wl[p] + ' · до края ' + Math.max(0, pathLen(walls, p + 1)), x, 52);
        });
        // поле и цели
        K.rr(c, ox - 8, oy - 8, cs * N + 16, cs * N + 16, 14); c.fillStyle = '#312e81'; c.fill();
        var gTop = flip() ? 1 : 0; // верхний край — цель красных (без поворота)
        c.fillStyle = COL[gTop] ; c.globalAlpha = 0.5; c.fillRect(ox, oy - 6, cs * N, 4); c.fillStyle = COL[1 - gTop]; c.fillRect(ox, oy + cs * N + 2, cs * N, 4); c.globalAlpha = 1;
        var steps = myTurn() && !wallMode ? legalSteps(turn) : [];
        for (var r = 0; r < N; r++) for (var cc = 0; cc < N; cc++) {
          var p = cellXY(r, cc), isStep = steps.some(function (s) { return s[0] === r && s[1] === cc; });
          K.rr(c, p[0] + cs * 0.08, p[1] + cs * 0.08, cs * 0.84, cs * 0.84, cs * 0.16);
          c.fillStyle = isStep ? 'rgba(253,230,138,' + (0.45 + 0.25 * Math.sin(t * 6)) + ')' : '#4338ca'; c.fill();
        }
        for (var k in walls) {
          var o = Math.floor(k / 100) * 100, rem = k - o, wr = wallRect(o, Math.floor(rem / 10), rem % 10);
          K.rr(c, wr[0], wr[1], wr[2], wr[3], 3); c.fillStyle = +k === lastW ? '#fde047' : '#f59e0b'; c.fill();
        }
        if (pend) { var pr = wallRect(pend[0], pend[1], pend[2]); K.rr(c, pr[0], pr[1], pr[2], pr[3], 3); c.fillStyle = 'rgba(253,224,71,' + (0.5 + 0.4 * Math.sin(t * 8)) + ')'; c.fill(); }
        pw.forEach(function (q, i) {
          var p = cellXY(q[0], q[1]), x = p[0] + cs / 2, y = p[1] + cs / 2, g = c.createRadialGradient(x - cs * 0.12, y - cs * 0.14, 1, x, y, cs * 0.36);
          g.addColorStop(0, i ? '#bfdbfe' : '#fecaca'); g.addColorStop(1, COL[i]);
          c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(x + 1, y + 3, cs * 0.33, 0, 6.283); c.fill();
          c.fillStyle = g; c.beginPath(); c.arc(x, y, cs * 0.33, 0, 6.283); c.fill();
        });
        if (myTurn()) {
          var B = btns();
          K.key(c, B.wall[0], B.wall[1], B.wall[2], B.wall[3], wallMode ? '#d97706' : '#4f46e5', wallMode ? '✕ Отмена' : '▮ Стенка (' + wl[turn - 1] + ')', '800 15px system-ui');
          if (wallMode) K.key(c, B.ok[0], B.ok[1], B.ok[2], B.ok[3], pend ? '#16a34a' : '#475569', '✓ Поставить', '800 15px system-ui');
        }
        var tip;
        if (over) tip = api.mode === 1 ? api.t(over === 1 ? 'g.p1win' : 'g.p2win') : over === me() ? api.t('g.win') : api.t('g.lose');
        else if (msgT > 0) tip = msg;
        else if (api.mode === 0 && turn === 2) tip = 'Компьютер думает…';
        else if (api.mode === 2 && turn !== me()) tip = api.t('net.oppTurn');
        else if (wallMode) tip = pend ? 'Нажми ещё раз — повернуть' : 'Нажми между клетками';
        else tip = (api.mode === 1 ? nm[turn - 1] + ', ' : '') + 'шагай или ставь стенку';
        K.toast(c, W, H - 46, tip, 1);
      }
    };
  }
};
