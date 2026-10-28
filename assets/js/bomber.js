/* Бомбер: ставь бомбы, взрывай ящики и соперников. Последний выживший побеждает */
window.GAMES = window.GAMES || {};
window.GAMES.bomber = {
  title: 'Бомбер', desc: 'Взорви всех соперников', cat: 'arcade', isNew4: true, medals: [300, 700, 1200],
  hint: 'Крестовина — ходить, кнопка — поставить бомбу. Взрыв идёт крестом и ломает ящики. Под ящиками бывают бонусы: 💣 больше бомб, 🔥 длиннее взрыв, 👟 быстрее. Не стой на линии взрыва! Победи трёх соперников.',
  d0: 'Медленные соперники', d1: 'Обычные', d2: 'Хитрые', d3: 'Очень опасные',
  colors: ['#f97316', '#1e293b'], controls: 'tank',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#166534"/><g fill="#64748b"><rect x="24" y="24" width="16" height="16" rx="3"/><rect x="60" y="24" width="16" height="16" rx="3"/><rect x="24" y="60" width="16" height="16" rx="3"/><rect x="60" y="60" width="16" height="16" rx="3"/></g><rect x="42" y="42" width="16" height="16" rx="3" fill="#b45309"/><circle cx="50" cy="32" r="9" fill="#111827"/><path d="M54 24q4-6 8-4" stroke="#f97316" stroke-width="3" fill="none"/><path d="M14 50h20M66 50h20" stroke="#fbbf24" stroke-width="7" stroke-linecap="round"/></svg>',
  create: function (api) {
    var C = 13, Rw = 11, M, bombs, fl, items, ents, me, cs, ox, oy, t, keys, endT, parts, msg, msgT;
    // клетки: 0 пусто, 1 стена, 2 ящик
    function I(x, y) { return y * C + x; }
    function free(x, y, ignoreBomb) { if (x < 0 || y < 0 || x >= C || y >= Rw || M[I(x, y)]) return false; if (!ignoreBomb && bombs.some(function (b) { return b.x === x && b.y === y; })) return false; return true; }
    function newMap() {
      M = []; for (var y = 0; y < Rw; y++) for (var x = 0; x < C; x++) M.push(x % 2 === 1 && y % 2 === 1 ? 1 : 0);
      var safe = function (x, y) { return (x < 3 || x > C - 4) && (y < 3 || y > Rw - 4) && ((x < 2 || x > C - 3) || (y < 2 || y > Rw - 3)); };
      items = {};
      for (var i = 0; i < M.length; i++) { var x2 = i % C, y2 = (i / C) | 0; if (!M[i] && !safe(x2, y2) && Math.random() < 0.62) { M[i] = 2; if (Math.random() < 0.3) items[i] = ['bomb', 'fire', 'speed'][Math.floor(Math.random() * 3)]; } }
    }
    function mkEnt(x, y, col, bot) { return { x: x, y: y, px: x, py: y, fx: x, fy: y, mv: 0, col: col, bot: bot, alive: true, max: 1, fire: 2, spd: 4.2, think: 0, path: null }; }
    function layout() { cs = Math.floor(Math.min((api.W - 12) / C, (api.H - 70) / Rw)); ox = (api.W - cs * C) / 2; oy = 52 + Math.max(0, (api.H - 70 - cs * Rw) / 2); }
    function blastCells(b) { // клетки, которые заденет бомба b
      var out = [[b.x, b.y]];
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { for (var k = 1; k <= b.r; k++) { var x = b.x + d[0] * k, y = b.y + d[1] * k; if (x < 0 || y < 0 || x >= C || y >= Rw || M[I(x, y)] === 1) break; out.push([x, y]); if (M[I(x, y)] === 2) break; } });
      return out;
    }
    function danger() { var D = {}; bombs.forEach(function (b) { blastCells(b).forEach(function (q) { D[I(q[0], q[1])] = Math.min(D[I(q[0], q[1])] || 9, b.t); }); }); for (var k in fl) D[k] = 0; return D; }
    function explode(b) {
      bombs.splice(bombs.indexOf(b), 1); b.own.out--; api.sound('break'); api.vibrate(20);
      blastCells(b).forEach(function (q) {
        var i = I(q[0], q[1]); fl[i] = 0.5;
        if (M[i] === 2) { M[i] = 0; if (b.own === me) api.addScore(5); for (var k = 0; k < 5; k++) parts.push({ x: ox + (q[0] + 0.5) * cs, y: oy + (q[1] + 0.5) * cs, vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.7) * 200, l: 0.5, c: '#b45309' }); }
        else if (items[i] && M[i] === 0 && !b.fresh) { /* бонус на открытом месте сгорает только во втором взрыве */ }
        bombs.slice().forEach(function (o) { if (o.x === q[0] && o.y === q[1]) { o.t = Math.min(o.t, 0.05); } });
      });
    }
    function placeBomb(e) { if (!e.alive || e.out >= e.max || bombs.some(function (b) { return b.x === e.x && b.y === e.y; })) return; bombs.push({ x: e.x, y: e.y, t: 2.2, r: e.fire, own: e }); e.out = (e.out || 0) + 1; api.sound('drop'); }
    function bfs(e, goal, D) { // путь к клетке, удовлетворяющей goal, без опасных клеток
      var q = [[e.x, e.y]], prev = {}, seen = {}; seen[I(e.x, e.y)] = 1;
      while (q.length) {
        var u = q.shift(); if (goal(u[0], u[1]) && (u[0] !== e.x || u[1] !== e.y)) { var p = [u]; var k = I(u[0], u[1]); while (prev[k] != null) { var pk = prev[k]; if (pk === I(e.x, e.y)) break; p.unshift([pk % C, (pk / C) | 0]); k = pk; } return p; }
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var x = u[0] + d[0], y = u[1] + d[1], i = I(x, y); if (!seen[i] && free(x, y) && !(D && D[i] != null && D[i] < 0.6)) { seen[i] = 1; prev[i] = I(u[0], u[1]); q.push([x, y]); } });
      }
      return null;
    }
    function botThink(e) {
      var D = danger(), here = I(e.x, e.y);
      if (D[here] != null) { e.path = bfs(e, function (x, y) { return D[I(x, y)] == null; }, null); return; }
      var near = function (x, y) { return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (d) { var X = x + d[0], Y = y + d[1]; return X >= 0 && Y >= 0 && X < C && Y < Rw && M[I(X, Y)] === 2; }); };
      var foe = ents.filter(function (o) { return o !== e && o.alive && (o.x === e.x && Math.abs(o.y - e.y) <= e.fire || o.y === e.y && Math.abs(o.x - e.x) <= e.fire); })[0];
      if ((near(e.x, e.y) || (foe && Math.random() < [0.2, 0.5, 0.8, 1][api.diff])) && (e.out || 0) < e.max) {
        // ставить, только если есть куда убежать
        var test = { x: e.x, y: e.y, r: e.fire }, cells = blastCells(test), cover = {}; cells.forEach(function (q) { cover[I(q[0], q[1])] = 1; });
        bombs.push({ x: e.x, y: e.y, t: 9, r: e.fire, own: e, test: 1 });
        var esc = bfs(e, function (x, y) { return !cover[I(x, y)] && D[I(x, y)] == null; }, D);
        bombs.pop();
        if (esc && esc.length <= 4) { placeBomb(e); e.path = esc; return; }
      }
      if (Math.random() < [0.4, 0.25, 0.15, 0.1][api.diff]) { e.path = null; return; } // замешкался
      var target = api.diff >= 2 && Math.random() < 0.5 ? function (x, y) { return Math.abs(x - me.x) + Math.abs(y - me.y) <= 2; } : near;
      e.path = bfs(e, target, D);
      if (e.path) e.path = e.path.slice(0, 3);
    }
    function moveStep(e, dt) {
      if (e.mv > 0) {
        e.mv -= dt * e.spd; var k = Math.max(0, e.mv); e.fx = e.x + (e.px - e.x) * k; e.fy = e.y + (e.py - e.y) * k;
        if (e.mv <= 0) { e.fx = e.x; e.fy = e.y; pick(e); }
        return true;
      }
      return false;
    }
    function tryGo(e, dx, dy) {
      var nx = e.x + dx, ny = e.y + dy; if (!free(nx, ny)) return false;
      e.px = e.x; e.py = e.y; e.x = nx; e.y = ny; e.mv = 1; e.dir = [dx, dy]; return true;
    }
    function pick(e) {
      var i = I(e.x, e.y), it = items[i]; if (!it || M[i]) return; delete items[i];
      if (it === 'bomb') e.max++; else if (it === 'fire') e.fire++; else e.spd = Math.min(7, e.spd + 0.8);
      if (e === me) { api.addScore(20); api.sound('coin'); say({ bomb: '💣 Больше бомб!', fire: '🔥 Взрыв длиннее!', speed: '👟 Быстрее!' }[it]); }
    }
    function say(s) { msg = s; msgT = 1.4; }
    function die(e) {
      if (!e.alive) return; e.alive = false;
      for (var k = 0; k < 20; k++) parts.push({ x: ox + (e.fx + 0.5) * cs, y: oy + (e.fy + 0.5) * cs, vx: (Math.random() - 0.5) * 260, vy: (Math.random() - 0.5) * 260, l: 0.7, c: e.col });
      if (e === me) { api.sound('hit'); api.vibrate(120); endT = 1.8; say('Тебя взорвали!'); }
      else { api.addScore(100 + api.diff * 40); say('Соперник выбыл!'); if (ents.filter(function (o) { return o.alive && o !== me; }).length === 0) { api.addScore(300 * (api.diff + 1)); api.sound('win'); api.fx.confetti(70); endT = 2.2; say('Победа! 🏆'); } }
    }
    return {
      reset: function () {
        layout(); newMap(); bombs = []; fl = {}; parts = []; t = 0; endT = 0; keys = {}; msgT = 0;
        me = mkEnt(0, 0, '#f8fafc', false);
        ents = [me, mkEnt(C - 1, Rw - 1, '#ef4444', true), mkEnt(C - 1, 0, '#3b82f6', true), mkEnt(0, Rw - 1, '#22c55e', true)];
        ents.forEach(function (e) { e.out = 0; if (e.bot) e.spd = [3, 3.6, 4.2, 4.6][api.diff]; });
      },
      resize: layout, idle: function (dt) { t += dt || 0; },
      key: function (k, down) { if (k === 'a') { if (down) placeBomb(me); return; } keys[k] = down; },
      input: function (type, d) { if (type === 'swipe') { keys = {}; keys[d.dir] = true; } },
      update: function (dt) {
        t += dt; if (msgT > 0) msgT -= dt;
        parts.forEach(function (q) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 400 * dt; q.l -= dt; }); parts = parts.filter(function (q) { return q.l > 0; });
        for (var k in fl) { fl[k] -= dt; if (fl[k] <= 0) delete fl[k]; }
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); }
        bombs.slice().forEach(function (b) { b.t -= dt; if (b.t <= 0 && bombs.indexOf(b) >= 0) explode(b); });
        ents.forEach(function (e) {
          if (!e.alive) return;
          if (!moveStep(e, dt)) {
            if (e === me) { if (endT <= 0) { if (keys.up) tryGo(e, 0, -1); else if (keys.down) tryGo(e, 0, 1); else if (keys.left) tryGo(e, -1, 0); else if (keys.right) tryGo(e, 1, 0); } }
            else {
              e.think -= dt; if (!e.path || !e.path.length) { if (e.think <= 0 || danger()[I(e.x, e.y)] != null) { botThink(e); e.think = [0.5, 0.3, 0.15, 0.08][api.diff]; } }
              if (e.path && e.path.length) { var n = e.path[0], D = danger(); if (D[I(n[0], n[1])] != null && D[I(n[0], n[1])] < 0.4 && D[I(e.x, e.y)] == null) { e.path = null; } else if (tryGo(e, n[0] - e.x, n[1] - e.y)) e.path.shift(); else e.path = null; }
            }
          }
          var ci = I(Math.round(e.fx), Math.round(e.fy)); if (fl[ci] != null) die(e);
        });
      },
      draw: function (c) {
        var W = api.W, H = api.H, K = window.GBK;
        c.fillStyle = '#14532d'; c.fillRect(0, 0, W, H);
        K.rr(c, ox - 6, oy - 6, cs * C + 12, cs * Rw + 12, 10); c.fillStyle = '#334155'; c.fill();
        for (var y = 0; y < Rw; y++) for (var x = 0; x < C; x++) {
          var i = I(x, y), X = ox + x * cs, Y = oy + y * cs;
          c.fillStyle = (x + y) % 2 ? '#4ade80' : '#22c55e'; c.fillRect(X, Y, cs, cs);
          if (items[i] && !M[i]) { c.fillStyle = 'rgba(255,255,255,.7)'; K.rr(c, X + 3, Y + 3, cs - 6, cs - 6, 6); c.fill(); c.font = Math.round(cs * 0.6) + 'px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText({ bomb: '💣', fire: '🔥', speed: '👟' }[items[i]], X + cs / 2, Y + cs / 2 + Math.sin(t * 5 + i) * 2); }
          if (M[i] === 1) { c.fillStyle = '#475569'; c.fillRect(X, Y, cs, cs); c.fillStyle = '#64748b'; c.fillRect(X + 2, Y + 2, cs - 4, cs - 8); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(X + 2, Y + 2, cs - 4, 3); }
          else if (M[i] === 2) { c.fillStyle = '#92400e'; c.fillRect(X + 1, Y + 1, cs - 2, cs - 2); c.fillStyle = '#b45309'; c.fillRect(X + 3, Y + 3, cs - 6, cs - 8); c.strokeStyle = '#78350f'; c.lineWidth = 2; c.beginPath(); c.moveTo(X + 4, Y + 4); c.lineTo(X + cs - 4, Y + cs - 6); c.moveTo(X + cs - 4, Y + 4); c.lineTo(X + 4, Y + cs - 6); c.stroke(); }
        }
        // пламя
        for (var k in fl) { var fx = ox + (k % C) * cs, fy = oy + ((k / C) | 0) * cs, a = Math.min(1, fl[k] * 3); var gg = c.createRadialGradient(fx + cs / 2, fy + cs / 2, 2, fx + cs / 2, fy + cs / 2, cs * 0.7); gg.addColorStop(0, 'rgba(254,249,195,' + a + ')'); gg.addColorStop(0.5, 'rgba(251,146,60,' + a + ')'); gg.addColorStop(1, 'rgba(220,38,38,0)'); c.fillStyle = gg; c.fillRect(fx - cs * 0.2, fy - cs * 0.2, cs * 1.4, cs * 1.4); }
        bombs.forEach(function (b) {
          var X = ox + (b.x + 0.5) * cs, Y = oy + (b.y + 0.5) * cs, pulse = 1 + 0.08 * Math.sin(t * (b.t < 0.8 ? 30 : 10));
          c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(X + 2, Y + cs * 0.32, cs * 0.32, cs * 0.12, 0, 0, 6.283); c.fill();
          var bg = c.createRadialGradient(X - cs * 0.12, Y - cs * 0.12, 1, X, Y, cs * 0.38); bg.addColorStop(0, '#475569'); bg.addColorStop(1, '#0f172a'); c.fillStyle = bg; c.beginPath(); c.arc(X, Y, cs * 0.36 * pulse, 0, 6.283); c.fill();
          c.strokeStyle = '#a16207'; c.lineWidth = 2; c.beginPath(); c.moveTo(X + cs * 0.15, Y - cs * 0.28); c.quadraticCurveTo(X + cs * 0.3, Y - cs * 0.45, X + cs * 0.35, Y - cs * 0.35); c.stroke();
          c.fillStyle = Math.sin(t * 40) > 0 ? '#fde047' : '#f97316'; c.beginPath(); c.arc(X + cs * 0.36, Y - cs * 0.36, 3, 0, 6.283); c.fill();
        });
        ents.forEach(function (e) {
          if (!e.alive) return; var X = ox + (e.fx + 0.5) * cs, Y = oy + (e.fy + 0.5) * cs, bob = e.mv > 0 ? Math.abs(Math.sin(t * 16)) * 2 : 0, r = cs * 0.36;
          c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(X, Y + r, r * 0.9, r * 0.3, 0, 0, 6.283); c.fill();
          c.fillStyle = e.col; c.beginPath(); c.arc(X, Y - bob, r, 0, 6.283); c.fill();
          c.fillStyle = e === me ? '#ec4899' : '#1e293b'; c.fillRect(X - r, Y - bob - r * 0.25, r * 2, r * 0.5); // повязка
          c.fillStyle = '#fff'; c.beginPath(); c.arc(X - r * 0.35, Y - bob, r * 0.18, 0, 6.283); c.arc(X + r * 0.35, Y - bob, r * 0.18, 0, 6.283); c.fill();
          c.fillStyle = '#111'; var dx = e.dir ? e.dir[0] : 0, dy = e.dir ? e.dir[1] : 1; c.beginPath(); c.arc(X - r * 0.35 + dx * 2, Y - bob + dy * 2, r * 0.09, 0, 6.283); c.arc(X + r * 0.35 + dx * 2, Y - bob + dy * 2, r * 0.09, 0, 6.283); c.fill();
          if (e === me) { c.fillStyle = '#fde047'; c.font = '900 11px system-ui'; c.textAlign = 'center'; c.fillText('ТЫ', X, Y - r - 8 - bob); }
        });
        parts.forEach(function (q) { c.fillStyle = q.c; c.globalAlpha = Math.min(1, q.l * 2); c.fillRect(q.x - 3, q.y - 3, 6, 6); }); c.globalAlpha = 1;
        c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.font = '800 14px system-ui';
        c.fillText('💣 ' + me.max + '   🔥 ' + me.fire + '   👟 ' + me.spd.toFixed(1), 12, 24);
        c.textAlign = 'right'; c.fillText('Соперников: ' + ents.filter(function (o) { return o.alive && o !== me; }).length, W - 12, 24);
        if (msgT > 0) K.toast(c, W, H - 26, msg, Math.min(1, msgT * 2));
      }
    };
  }
};
