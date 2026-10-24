/* Шарики против блоков: прицелься и выпусти очередь шариков, у блоков есть прочность. Блоки опускаются каждый ход */
window.GAMES = window.GAMES || {};
window.GAMES.bricks = {
  title: 'Шарики и блоки', desc: 'Разбивай блоки очередью шариков', cat: 'arcade', isNew4: true, medals: [30, 80, 160],
  hint: 'Веди пальцем, чтобы прицелиться, отпусти — шарики полетят очередью. Число на блоке — сколько ударов он выдержит. Зелёный кружок даёт ещё один шарик. Если блок опустится до низа — конец игры.',
  d0: 'Слабые блоки', d1: 'Обычно', d2: 'Прочные блоки', d3: 'Очень прочные блоки',
  colors: ['#22c55e', '#6366f1'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#0f172a"/><rect x="16" y="18" width="20" height="20" rx="4" fill="#f43f5e"/><rect x="40" y="18" width="20" height="20" rx="4" fill="#f59e0b"/><rect x="64" y="30" width="20" height="20" rx="4" fill="#6366f1"/><path d="M50 82L34 52" stroke="#fff" stroke-width="2" stroke-dasharray="3 4"/><circle cx="50" cy="82" r="5" fill="#fff"/></svg>',
  create: function (api) {
    var COLS = 7, MUL = [0.7, 1, 1.4, 1.9];
    var grid, balls, nBalls, round, aim, shooting, toShoot, shootT, sx, firstBack, cs, top, BR = 6, SPEED = 700;
    function layout() { cs = Math.floor((api.W - 16) / COLS); top = 70; }
    function bottomY() { return api.H - 70; }
    function rowsFit() { return Math.floor((bottomY() - top) / cs); }
    function addRow() {
      grid.forEach(function (b) { b.r++; });
      var hp = Math.max(1, Math.round(round * MUL[api.diff])), used = {};
      var extra = Math.floor(Math.random() * COLS); used[extra] = 1;
      grid.push({ r: 0, c: extra, hp: 0, ball: true });
      for (var c = 0; c < COLS; c++) if (!used[c] && Math.random() < 0.5) grid.push({ r: 0, c: c, hp: Math.random() < 0.2 ? hp * 2 : hp });
      if (grid.some(function (b) { return !b.ball && b.r >= rowsFit() - 1; })) api.gameOver();
      grid = grid.filter(function (b) { return !(b.ball && b.r >= rowsFit() - 1); });
    }
    function rect(b) { return { x: 8 + b.c * cs + 2, y: top + b.r * cs + 2, w: cs - 4, h: cs - 4 }; }
    function shoot(a) {
      aim = null; shooting = true; toShoot = nBalls; shootT = 0; firstBack = null;
      balls = []; this_ang = a;
    }
    var this_ang = 0;
    function color(hp) { var k = Math.min(1, hp / (round * 1.5 + 1)); return 'hsl(' + Math.round(140 - k * 140) + ',75%,55%)'; }
    return {
      reset: function () { layout(); grid = []; balls = []; nBalls = 1; round = 1; aim = null; shooting = false; sx = api.W / 2; addRow(); },
      resize: layout, idle: function () { }, key: function () { },
      input: function (type, d) {
        if (shooting) return;
        if (type === 'down' || type === 'move') {
          var dx = d.x - sx, dy = d.y - bottomY();
          if (dy > -20) { aim = null; return; }
          aim = Math.atan2(dy, dx); aim = Math.max(-Math.PI + 0.12, Math.min(-0.12, aim));
        } else if (type === 'up' || type === 'tap') { if (aim != null) shoot(aim); }
      },
      update: function (dt) {
        if (!shooting) return;
        shootT -= dt;
        if (toShoot > 0 && shootT <= 0) { balls.push({ x: sx, y: bottomY(), vx: Math.cos(this_ang) * SPEED, vy: Math.sin(this_ang) * SPEED }); toShoot--; shootT = 0.07; }
        var steps = 3, h = dt / steps;
        for (var s = 0; s < steps; s++) for (var i = balls.length - 1; i >= 0; i--) {
          var b = balls[i]; b.x += b.vx * h; b.y += b.vy * h;
          if (b.x < BR) { b.x = BR; b.vx = Math.abs(b.vx); } if (b.x > api.W - BR) { b.x = api.W - BR; b.vx = -Math.abs(b.vx); }
          if (b.y < top + BR) { b.y = top + BR; b.vy = Math.abs(b.vy); }
          if (b.y > bottomY()) { if (firstBack == null) firstBack = b.x; balls.splice(i, 1); continue; }
          for (var j = grid.length - 1; j >= 0; j--) {
            var g = grid[j], r = rect(g);
            if (g.ball) { if (Math.hypot(b.x - (r.x + r.w / 2), b.y - (r.y + r.h / 2)) < cs * 0.25 + BR) { grid.splice(j, 1); nBalls++; api.sound('coin'); } continue; }
            var nx = Math.max(r.x, Math.min(b.x, r.x + r.w)), ny = Math.max(r.y, Math.min(b.y, r.y + r.h));
            var ddx = b.x - nx, ddy = b.y - ny;
            if (ddx * ddx + ddy * ddy < BR * BR) {
              if (Math.abs(ddx) > Math.abs(ddy)) { b.vx = ddx > 0 ? Math.abs(b.vx) : -Math.abs(b.vx); } else { b.vy = ddy > 0 ? Math.abs(b.vy) : -Math.abs(b.vy); }
              g.hp--; api.sound('click');
              if (g.hp <= 0) { grid.splice(j, 1); api.fx.burst && api.fx.burst(r.x + r.w / 2, r.y + r.h / 2, '#a5b4fc', 8); }
              break;
            }
          }
        }
        if (toShoot === 0 && balls.length === 0) {
          shooting = false; sx = Math.max(BR, Math.min(api.W - BR, firstBack == null ? sx : firstBack));
          round++; api.addScore(1); addRow();
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        c.fillStyle = '#0f172a'; c.fillRect(0, 0, W, H);
        c.fillStyle = '#1e293b'; c.fillRect(0, bottomY() + BR, W, 2);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        grid.forEach(function (g) {
          var r = rect(g);
          if (g.ball) { c.strokeStyle = '#22c55e'; c.lineWidth = 3; c.beginPath(); c.arc(r.x + r.w / 2, r.y + r.h / 2, cs * 0.22, 0, 6.283); c.stroke(); c.fillStyle = '#22c55e'; c.beginPath(); c.arc(r.x + r.w / 2, r.y + r.h / 2, 5, 0, 6.283); c.fill(); return; }
          c.fillStyle = color(g.hp); c.fillRect(r.x, r.y, r.w, r.h);
          c.fillStyle = '#0f172a'; c.font = '800 ' + Math.round(cs * 0.34) + 'px system-ui'; c.fillText(g.hp, r.x + r.w / 2, r.y + r.h / 2 + 1);
        });
        if (aim != null && !shooting) {
          c.strokeStyle = 'rgba(255,255,255,.6)'; c.setLineDash([4, 8]); c.lineWidth = 2;
          c.beginPath(); c.moveTo(sx, bottomY()); c.lineTo(sx + Math.cos(aim) * H * 0.6, bottomY() + Math.sin(aim) * H * 0.6); c.stroke(); c.setLineDash([]);
        }
        c.fillStyle = '#fff';
        balls.forEach(function (b) { c.beginPath(); c.arc(b.x, b.y, BR, 0, 6.283); c.fill(); });
        if (!shooting || toShoot > 0) { c.beginPath(); c.arc(sx, bottomY(), BR, 0, 6.283); c.fill(); }
        c.font = '700 14px system-ui'; c.fillStyle = '#cbd5e1';
        c.fillText('×' + (shooting ? toShoot : nBalls), sx, bottomY() + 24);
        c.fillText('Ход ' + round, W / 2, 46);
      }
    };
  }
};
