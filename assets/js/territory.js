/* Захват территории: выходи со своей земли, обводи кусок и возвращайся — он станет твоим */
window.GAMES = window.GAMES || {};
window.GAMES.territory = {
  title: 'Захват территории', desc: 'Обводи и захватывай землю', cat: 'arcade', isNew4: true, medals: [300, 800, 1600],
  hint: 'Свайпай, чтобы повернуть. Выйди со своей земли — за тобой тянется след. Вернись на свою землю — всё обведённое станет твоим. Если кто-то наедет на твой след, ты проиграешь; наедь на чужой след — соперник выбывает. За 2 минуты захвати как можно больше!',
  d0: '2 медленных соперника', d1: '3 соперника', d2: '4 соперника', d3: '5 быстрых соперников',
  colors: ['#0ea5e9', '#7c3aed'], controls: 'none', liveSwipe: true, swipeDist: 14,
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#f1f5f9"/><rect x="14" y="54" width="32" height="32" rx="4" fill="#7dd3fc"/><path d="M46 62h22V34H38v20" fill="none" stroke="#0ea5e9" stroke-width="6" stroke-linejoin="round" opacity=".6"/><rect x="58" y="16" width="26" height="24" rx="4" fill="#fca5a5"/><circle cx="38" cy="54" r="7" fill="#0284c7"/><circle cx="70" cy="28" r="6" fill="#dc2626"/></svg>',
  create: function (api) {
    var COLS = 26, ROWS, G, TR, ents, me, cs, ox, oy, t, timeLeft, endT, stepT, parts, msg, msgT;
    var PAL = [['#0ea5e9', '#7dd3fc'], ['#ef4444', '#fca5a5'], ['#22c55e', '#86efac'], ['#f59e0b', '#fcd34d'], ['#a855f7', '#d8b4fe'], ['#ec4899', '#f9a8d4']];
    var NAMES = ['Ты', 'Огонёк', 'Листик', 'Солнце', 'Слива', 'Ягода'];
    var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    function idx(x, y) { return y * COLS + x; }
    function base(e, x, y) { for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < COLS && Y < ROWS) G[idx(X, Y)] = e.id; } }
    function spawn(e) {
      for (var tries = 0; tries < 60; tries++) {
        var x = 2 + Math.floor(Math.random() * (COLS - 4)), y = 2 + Math.floor(Math.random() * (ROWS - 4)), ok = true;
        for (var dy = -2; dy <= 2 && ok; dy++) for (var dx = -2; dx <= 2; dx++) if (G[idx(x + dx, y + dy)]) { ok = false; break; }
        if (ok || tries === 59) { e.x = x; e.y = y; e.alive = true; e.trail = []; e.dir = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)]; e.plan = null; base(e, x, y); return; }
      }
    }
    function kill(e) {
      if (!e.alive) return; e.alive = false; e.respT = 3;
      e.trail.forEach(function (i) { if (TR[i] === e.id) TR[i] = 0; }); e.trail = [];
      for (var i = 0; i < G.length; i++) if (G[i] === e.id) G[i] = 0;
      for (var k = 0; k < 18; k++) { var a = Math.random() * 6.283, v = 40 + Math.random() * 120; parts.push({ x: ox + (e.x + 0.5) * cs, y: oy + (e.y + 0.5) * cs, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 0.7, c: PAL[e.id - 1][0] }); }
      if (e === me) { api.sound('hit'); api.vibrate(100); endT = 1.6; } else { api.sound('break'); if (me.alive) { api.addScore(60); say('Ты выбил: ' + NAMES[e.id - 1] + '! +60'); } }
    }
    function capture(e) {
      e.trail.forEach(function (i) { G[i] = e.id; TR[i] = 0; }); e.trail = [];
      // заливка снаружи: всё, куда нельзя дойти от края не по своей земле, — окружено
      var seen = new Uint8Array(COLS * ROWS), q = [];
      for (var x = 0; x < COLS; x++) { [idx(x, 0), idx(x, ROWS - 1)].forEach(function (i) { if (G[i] !== e.id && !seen[i]) { seen[i] = 1; q.push(i); } }); }
      for (var y = 0; y < ROWS; y++) { [idx(0, y), idx(COLS - 1, y)].forEach(function (i) { if (G[i] !== e.id && !seen[i]) { seen[i] = 1; q.push(i); } }); }
      while (q.length) { var u = q.pop(), ux = u % COLS, uy = (u / COLS) | 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var X = ux + d[0], Y = uy + d[1]; if (X < 0 || Y < 0 || X >= COLS || Y >= ROWS) return; var v = idx(X, Y); if (!seen[v] && G[v] !== e.id) { seen[v] = 1; q.push(v); } }); }
      var got = 0;
      for (var i = 0; i < G.length; i++) if (!seen[i] && G[i] !== e.id) { if (TR[i]) { var o = ents[TR[i] - 1]; if (o !== e) kill(o); } G[i] = e.id; got++; }
      if (e === me) { var n = G.filter(function (v) { return v === me.id; }).length; api.addScore(Math.max(1, got + e.lastLen)); api.sound('coin'); api.vibrate(15); if (got > 30) say('Отличный захват! +' + got); }
    }
    function say(s) { msg = s; msgT = 1.6; }
    function step(e) {
      if (!e.alive) return;
      if (e !== me) botThink(e);
      var d = DIRS[e.dir], nx = e.x + d[0], ny = e.y + d[1];
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) { if (e !== me) { e.dir = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)]; } return; }
      var i = idx(nx, ny);
      if (TR[i]) { var o = ents[TR[i] - 1]; if (o === e) { kill(e); return; } kill(o); }
      ents.forEach(function (o) { if (o !== e && o.alive && o.x === nx && o.y === ny) { if (G[i] === o.id) kill(e); else kill(o); } });
      if (!e.alive) return;
      e.x = nx; e.y = ny;
      if (G[i] === e.id) { if (e.trail.length) { e.lastLen = e.trail.length; capture(e); } }
      else { TR[i] = e.id; e.trail.push(i); }
    }
    function botThink(e) {
      var home = G[idx(e.x, e.y)] === e.id, opp = { up: 'down', down: 'up', left: 'right', right: 'left' };
      if (!e.plan) e.plan = { out: 3 + Math.floor(Math.random() * (4 + api.diff * 2)), side: 2 + Math.floor(Math.random() * 5), n: 0, turn: Math.random() < 0.5 ? 1 : -1 };
      var P2 = e.plan; P2.n++;
      if (home && !e.trail.length) { if (P2.n > 2 || Math.random() < 0.3) { var ds = ['up', 'down', 'left', 'right'].filter(function (dd) { return dd !== opp[e.dir]; }); e.dir = ds[Math.floor(Math.random() * ds.length)]; } P2.n = 0; return; }
      var L = e.trail.length;
      if (L === P2.out) e.dir = rotate(e.dir, P2.turn);
      else if (L === P2.out + P2.side) e.dir = rotate(e.dir, P2.turn);
      else if (L > P2.out + P2.side || L > 14) { // возвращаемся домой
        var best = null, bd = 1e9;
        ['up', 'down', 'left', 'right'].forEach(function (dd) {
          if (dd === opp[e.dir]) return; var v = DIRS[dd], X = e.x + v[0], Y = e.y + v[1]; if (X < 0 || Y < 0 || X >= COLS || Y >= ROWS) return; var i = idx(X, Y); if (TR[i] === e.id) return;
          var dist = 1e9; for (var k = 0; k < G.length; k += 1) if (G[k] === e.id) { var dk = Math.abs(k % COLS - X) + Math.abs(((k / COLS) | 0) - Y); if (dk < dist) dist = dk; }
          if (dist < bd) { bd = dist; best = dd; }
        });
        if (best) e.dir = best;
      }
      // не врезаться в свой след
      var v2 = DIRS[e.dir], X2 = e.x + v2[0], Y2 = e.y + v2[1];
      if (X2 < 0 || Y2 < 0 || X2 >= COLS || Y2 >= ROWS || TR[idx(X2, Y2)] === e.id) { e.dir = rotate(e.dir, 1); v2 = DIRS[e.dir]; X2 = e.x + v2[0]; Y2 = e.y + v2[1]; if (X2 < 0 || Y2 < 0 || X2 >= COLS || Y2 >= ROWS || TR[idx(X2, Y2)] === e.id) e.dir = rotate(e.dir, 2); }
      // напасть на чужой след рядом
      if (api.diff >= 2) ['up', 'down', 'left', 'right'].forEach(function (dd) { var v = DIRS[dd], X = e.x + v[0], Y = e.y + v[1]; if (X >= 0 && Y >= 0 && X < COLS && Y < ROWS && TR[idx(X, Y)] && TR[idx(X, Y)] !== e.id && dd !== opp[e.dir]) e.dir = dd; });
      if (home) e.plan = null;
    }
    function rotate(d, k) { var o = ['up', 'right', 'down', 'left'], i = o.indexOf(d); return o[(i + k + 4) % 4]; }
    function layout() { cs = Math.floor(Math.min((api.W - 12) / COLS, (api.H - 110) / ROWS)); ox = (api.W - cs * COLS) / 2; oy = 70; }
    return {
      reset: function () {
        ROWS = Math.max(26, Math.min(44, Math.floor((api.H - 110) / ((api.W - 12) / COLS)))); layout();
        G = new Array(COLS * ROWS).fill(0); TR = new Array(COLS * ROWS).fill(0); parts = []; t = 0; timeLeft = 120; endT = 0; stepT = 0; msgT = 0;
        var n = [3, 4, 5, 6][api.diff]; ents = [];
        for (var i = 0; i < n; i++) { var e = { id: i + 1, trail: [], lastLen: 0 }; ents.push(e); spawn(e); }
        me = ents[0];
      },
      resize: layout, idle: function (dt) { t += dt || 0; }, key: function (k, d) { if (d && DIRS[k]) this.input('swipe', { dir: k }); },
      input: function (type, d) { if (type === 'swipe' && me.alive && DIRS[d.dir]) { var opp = { up: 'down', down: 'up', left: 'right', right: 'left' }; if (d.dir !== opp[me.dir] || !me.trail.length) me.dir = d.dir; } },
      update: function (dt) {
        t += dt; if (msgT > 0) msgT -= dt;
        parts.forEach(function (q) { q.x += q.vx * dt; q.y += q.vy * dt; q.l -= dt; }); parts = parts.filter(function (q) { return q.l > 0; });
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        timeLeft -= dt;
        if (timeLeft <= 0) { var share = G.filter(function (v) { return v === me.id; }).length / G.length; api.addScore(Math.round(share * 1000)); say('Время! Твоя земля: ' + Math.round(share * 100) + '%'); api.sound('win'); endT = 2.2; return; }
        stepT -= dt;
        if (stepT <= 0) {
          stepT += 0.115;
          ents.forEach(function (e, i) { if (e.alive && (e === me || Math.random() < [0.7, 0.85, 0.95, 1][api.diff])) step(e); });
          ents.forEach(function (e) { if (!e.alive && e !== me) { e.respT -= 0.115; if (e.respT <= 0) spawn(e); } });
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H, K = window.GBK;
        c.fillStyle = '#e2e8f0'; c.fillRect(0, 0, W, H);
        K.rr(c, ox - 4, oy - 4, cs * COLS + 8, cs * ROWS + 8, 10); c.fillStyle = '#f8fafc'; c.fill();
        c.fillStyle = 'rgba(148,163,184,.18)'; for (var y = 0; y < ROWS; y++) for (var x = (y % 2); x < COLS; x += 2) c.fillRect(ox + x * cs, oy + y * cs, cs, cs);
        for (var i = 0; i < G.length; i++) {
          var x2 = ox + (i % COLS) * cs, y2 = oy + ((i / COLS) | 0) * cs;
          if (G[i]) { c.fillStyle = PAL[G[i] - 1][1]; c.fillRect(x2, y2, cs + 0.6, cs + 0.6); }
          if (TR[i]) { c.fillStyle = PAL[TR[i] - 1][0]; c.globalAlpha = 0.55; c.fillRect(x2 + cs * 0.15, y2 + cs * 0.15, cs * 0.7, cs * 0.7); c.globalAlpha = 1; }
        }
        ents.forEach(function (e) {
          if (!e.alive) return; var x = ox + (e.x + 0.5) * cs, y = oy + (e.y + 0.5) * cs, d = DIRS[e.dir];
          c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x + 1, y + 3, cs * 0.6, cs * 0.35, 0, 0, 6.283); c.fill();
          K.rr(c, x - cs * 0.62, y - cs * 0.62, cs * 1.24, cs * 1.24, cs * 0.35); c.fillStyle = PAL[e.id - 1][0]; c.fill();
          c.fillStyle = 'rgba(255,255,255,.3)'; K.rr(c, x - cs * 0.5, y - cs * 0.55, cs, cs * 0.3, cs * 0.15); c.fill();
          c.fillStyle = '#fff'; c.beginPath(); c.arc(x + d[0] * cs * 0.2 - d[1] * cs * 0.22, y + d[1] * cs * 0.2 - d[0] * cs * 0.22, cs * 0.17, 0, 6.283); c.arc(x + d[0] * cs * 0.2 + d[1] * cs * 0.22, y + d[1] * cs * 0.2 + d[0] * cs * 0.22, cs * 0.17, 0, 6.283); c.fill();
          c.fillStyle = '#111'; c.beginPath(); c.arc(x + d[0] * cs * 0.28 - d[1] * cs * 0.22, y + d[1] * cs * 0.28 - d[0] * cs * 0.22, cs * 0.08, 0, 6.283); c.arc(x + d[0] * cs * 0.28 + d[1] * cs * 0.22, y + d[1] * cs * 0.28 + d[0] * cs * 0.22, cs * 0.08, 0, 6.283); c.fill();
          if (e === me) { c.strokeStyle = '#fff'; c.lineWidth = 2; K.rr(c, x - cs * 0.62, y - cs * 0.62, cs * 1.24, cs * 1.24, cs * 0.35); c.stroke(); }
        });
        parts.forEach(function (q) { c.fillStyle = q.c; c.globalAlpha = q.l; c.fillRect(q.x - 3, q.y - 3, 6, 6); }); c.globalAlpha = 1;
        // таблица лидеров
        var cnt = ents.map(function (e) { return { e: e, n: G.filter(function (v) { return v === e.id; }).length }; }).sort(function (a, b) { return b.n - a.n; });
        c.textAlign = 'left'; c.textBaseline = 'middle'; c.font = '800 12px system-ui';
        cnt.slice(0, 3).forEach(function (r, k) { K.rr(c, 8, 8 + k * 18, 150, 15, 7); c.fillStyle = 'rgba(15,23,42,.15)'; c.fill(); K.rr(c, 8, 8 + k * 18, Math.max(16, 150 * Math.min(1, r.n / G.length * 2)), 15, 7); c.fillStyle = PAL[r.e.id - 1][0]; c.fill(); c.fillStyle = '#fff'; c.fillText((k + 1) + '. ' + NAMES[r.e.id - 1] + ' ' + (r.n / G.length * 100).toFixed(1) + '%', 14, 16 + k * 18); });
        c.textAlign = 'right'; c.fillStyle = '#0f172a'; c.font = '900 20px system-ui'; c.fillText('⏱ ' + Math.max(0, Math.ceil(timeLeft)), W - 12, 26);
        if (msgT > 0) K.toast(c, W, H - 24, msg, Math.min(1, msgT * 2));
        else if (t < 4) K.toast(c, W, H - 24, 'Свайпай, чтобы поворачивать', 1);
      }
    };
  }
};
