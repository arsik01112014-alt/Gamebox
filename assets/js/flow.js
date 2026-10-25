/* Соедини цвета: проведи линии между точками одного цвета, линии не пересекаются. Марафон на 3 минуты */
window.GAMES = window.GAMES || {};
window.GAMES.flow = {
  title: 'Соедини цвета', desc: 'Соедини пары точек линиями', cat: 'puzzle', isNew4: true, medals: [150, 400, 800],
  hint: 'Веди пальцем от точки к точке того же цвета. Линии не могут пересекаться. Соедини все пары — уровень пройден, а если ещё и заполнишь всё поле — бонус. На всё 3 минуты.',
  d0: 'Поле 5×5', d1: 'Поле 6×6', d2: 'Поле 7×7', d3: 'Поле 8×8',
  colors: ['#ec4899', '#6366f1'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#111827"/><path d="M26 26h48v24" stroke="#ef4444" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 50v24h24" stroke="#3b82f6" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M74 74H62" stroke="#22c55e" stroke-width="9" stroke-linecap="round"/><circle cx="26" cy="26" r="8" fill="#ef4444"/><circle cx="74" cy="50" r="8" fill="#ef4444"/><circle cx="26" cy="50" r="8" fill="#3b82f6"/><circle cx="50" cy="74" r="8" fill="#3b82f6"/><circle cx="62" cy="74" r="8" fill="#22c55e"/><circle cx="80" cy="74" r="6" fill="#22c55e"/></svg>',
  create: function (api) {
    var COL = ['#ef4444', '#3b82f6', '#22c55e', '#facc15', '#f97316', '#a855f7', '#06b6d4', '#ec4899', '#84cc16', '#f8fafc', '#a16207', '#64748b'];
    var N, ends, paths, owner, cur, timeLeft, level, done, cs, gx, gy, flashT;
    function layout() { cs = Math.floor(Math.min(api.W - 24, api.H - 220) / N); gx = (api.W - cs * N) / 2; gy = 110; }
    // уровень: случайный гамильтонов путь (змейка + перемешивание «backbite»), разрезанный на куски
    function gen() {
      var path = [], x, y;
      for (y = 0; y < N; y++) for (x = 0; x < N; x++) path.push(y % 2 ? y * N + (N - 1 - x) : y * N + x);
      for (var it = 0; it < N * N * 30; it++) {
        if (Math.random() < 0.5) path.reverse();
        var e = path[path.length - 1], ex = e % N, ey = Math.floor(e / N);
        var nb = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)], nx = ex + nb[0], ny = ey + nb[1];
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
        var n = ny * N + nx, i = path.indexOf(n);
        if (i === path.length - 2) continue;
        var tail = path.splice(i + 1); tail.reverse(); path = path.concat(tail);
      }
      var segs = [], pos = 0, total = N * N;
      while (pos < total) {
        var len = 3 + Math.floor(Math.random() * (N - 1));
        if (total - pos - len < 3) len = total - pos;
        segs.push(path.slice(pos, pos + len)); pos += len;
      }
      ends = segs.map(function (sg, k) { return { a: sg[0], b: sg[sg.length - 1], c: k % COL.length }; });
      paths = ends.map(function () { return []; });
      owner = []; for (var q = 0; q < N * N; q++) owner.push(-1);
      layout();
    }
    function endAt(cell) { for (var k = 0; k < ends.length; k++) if (ends[k].a === cell || ends[k].b === cell) return k; return -1; }
    function connected(k) { var p = paths[k]; if (p.length < 2) return false; var e = ends[k], s = p[0], f = p[p.length - 1]; return (s === e.a && f === e.b) || (s === e.b && f === e.a); }
    function cut(k, from) { var p = paths[k]; for (var i = from; i < p.length; i++) owner[p[i]] = -1; p.length = from; }
    function cellAt(x, y) { var cx = Math.floor((x - gx) / cs), cy = Math.floor((y - gy) / cs); return cx < 0 || cy < 0 || cx >= N || cy >= N ? -1 : cy * N + cx; }
    function adj(a, b) { var ax = a % N, ay = Math.floor(a / N), bx = b % N, by = Math.floor(b / N); return Math.abs(ax - bx) + Math.abs(ay - by) === 1; }
    function step(cell) {
      var p = paths[cur], last = p[p.length - 1];
      if (cell === last) return;
      var bi = p.indexOf(cell);
      if (bi >= 0) { cut(cur, bi + 1); return; } // назад по своей линии
      if (!adj(cell, last) || connected(cur)) return;
      var ek = endAt(cell);
      if (ek >= 0 && ek !== cur) return; // чужая точка
      if (owner[cell] >= 0 && owner[cell] !== cur) { var o = owner[cell]; cut(o, paths[o].indexOf(cell)); }
      p.push(cell); owner[cell] = cur;
      if (connected(cur)) { api.sound('point'); api.vibrate(10); check(); }
    }
    function check() {
      if (!paths.every(function (p, k) { return connected(k); })) return;
      var full = owner.every(function (o) { return o >= 0; });
      api.addScore(N * 10 + (full ? N * 5 : 0)); level++; flashT = 0.6;
      api.sound('win'); api.fx.confetti(30); if (full) api.toast('Поле заполнено! Бонус');
      gen();
    }
    return {
      reset: function () { N = [5, 6, 7, 8][api.diff]; level = 1; timeLeft = 180; cur = -1; done = false; flashT = 0; gen(); },
      resize: function () { if (N) layout(); }, idle: function () { }, key: function () { },
      input: function (type, d) {
        if (done) return;
        if (type === 'down') {
          var cell = cellAt(d.x, d.y); if (cell < 0) return;
          var ek = endAt(cell);
          if (ek >= 0) { cut(ek, 0); cur = ek; paths[ek].push(cell); owner[cell] = ek; return; }
          if (owner[cell] >= 0) { cur = owner[cell]; cut(cur, paths[cur].indexOf(cell) + 1); }
        } else if (type === 'move' && cur >= 0) {
          var c2 = cellAt(d.x, d.y); if (c2 < 0) return;
          // быстрый палец мог перескочить клетки — идём к цели по одной
          var guard = 0;
          while (c2 !== paths[cur][paths[cur].length - 1] && guard++ < 20) {
            var last = paths[cur][paths[cur].length - 1], lx = last % N, ly = Math.floor(last / N), tx = c2 % N, ty = Math.floor(c2 / N);
            if (paths[cur].indexOf(c2) >= 0) { step(c2); break; }
            var nx = lx + Math.sign(tx - lx), ny = ly;
            if (nx === lx || Math.abs(ty - ly) > Math.abs(tx - lx)) { nx = lx; ny = ly + Math.sign(ty - ly); }
            var before = paths[cur].length; step(ny * N + nx);
            if (paths[cur].length === before || connected(cur)) break;
          }
        } else if (type === 'up') cur = -1;
      },
      update: function (dt) {
        if (done) return;
        if (flashT > 0) flashT -= dt;
        timeLeft -= dt;
        if (timeLeft <= 0) { done = true; api.gameOver(); }
      },
      draw: function (c) {
        var W = api.W;
        c.fillStyle = '#0b1020'; c.fillRect(0, 0, W, api.H);
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#e2e8f0'; c.font = '800 16px system-ui';
        c.fillText('Уровень ' + level + '   ·   ' + Math.max(0, Math.ceil(timeLeft)) + ' с', W / 2, 50);
        c.fillStyle = '#1e293b'; c.fillRect(W / 2 - 120, 70, 240, 6); c.fillStyle = timeLeft < 20 ? '#ef4444' : '#22c55e'; c.fillRect(W / 2 - 120, 70, 240 * Math.max(0, timeLeft) / 180, 6);
        for (var i = 0; i < N * N; i++) {
          var x = gx + (i % N) * cs, y = gy + Math.floor(i / N) * cs;
          c.fillStyle = owner[i] >= 0 ? COL[ends[owner[i]].c] + '33' : '#111827'; c.fillRect(x + 1, y + 1, cs - 2, cs - 2);
        }
        c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = cs * 0.34;
        paths.forEach(function (p, k) {
          if (p.length < 2) return;
          c.strokeStyle = COL[ends[k].c]; c.beginPath();
          p.forEach(function (cell, j) { var x = gx + (cell % N + 0.5) * cs, y = gy + (Math.floor(cell / N) + 0.5) * cs; if (j) c.lineTo(x, y); else c.moveTo(x, y); });
          c.stroke();
        });
        ends.forEach(function (e, k) {
          [e.a, e.b].forEach(function (cell) {
            var x = gx + (cell % N + 0.5) * cs, y = gy + (Math.floor(cell / N) + 0.5) * cs;
            c.fillStyle = COL[e.c]; c.beginPath(); c.arc(x, y, cs * 0.34, 0, 6.283); c.fill();
            if (connected(k)) { c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke(); c.lineWidth = cs * 0.34; }
          });
        });
        if (flashT > 0) { c.fillStyle = 'rgba(255,255,255,' + flashT * 0.3 + ')'; c.fillRect(gx, gy, cs * N, cs * N); }
      }
    };
  }
};
