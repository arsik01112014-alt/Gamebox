/* Зигзаг: шар катится по узкой дорожке, нажатие меняет направление. Не упади с края, собирай кристаллы */
window.GAMES = window.GAMES || {};
window.GAMES.zigzag = {
  title: 'Зигзаг', desc: 'Поворачивай шар на поворотах', cat: 'arcade', isNew4: true, medals: [60, 180, 400],
  hint: 'Шар катится сам. Нажимай, чтобы он повернул в другую сторону, и не дай ему упасть с дорожки. Очко за каждый поворот, кристалл — ещё 2.',
  d0: 'Широкая дорожка', d1: 'Обычно', d2: 'Быстро', d3: 'Очень быстро',
  colors: ['#0ea5e9', '#f472b6'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#7dd3fc"/><path d="M20 70l14-8 14 8-14 8zM34 62l14-8 14 8-14 8zM48 54l14-8 14 8-14 8zM48 38l14-8 14 8-14 8z" fill="#f8fafc" stroke="#94a3b8"/><circle cx="48" cy="58" r="6" fill="#f472b6"/><path d="M62 30l4 4-4 4-4-4z" fill="#a855f7"/></svg>',
  create: function (api) {
    var SPD = [3.2, 3.8, 4.6, 5.4], WID = [1.6, 1, 1, 1];
    var tiles, bx, by, dir, sp, falling, fallT, t, gems, camX, camY, nextX, nextY, ndir, turns, parts;
    var TS = 30; // половина ширины плитки на экране
    function iso(x, y) { return { x: (x - y) * TS, y: -(x + y) * TS * 0.5 }; } // вперёд — вверх по экрану
    function addTiles(n) {
      for (var i = 0; i < n; i++) {
        if (Math.random() < 0.38 && turns > 2) { ndir ^= 1; turns = 0; } else turns++;
        if (ndir === 0) nextX++; else nextY++;
        tiles.push({ x: nextX, y: nextY, f: 0, g: Math.random() < 0.08 });
      }
    }
    function onPath(x, y) {
      var w = WID[api.diff] / 2;
      for (var i = Math.max(0, tiles.length - 80); i < tiles.length; i++) { var tl = tiles[i]; if (tl.f < 0.2 && Math.abs(x - tl.x) <= w + 0.02 && Math.abs(y - tl.y) <= w + 0.02) return tl; }
      return null;
    }
    return {
      reset: function () {
        tiles = []; for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) tiles.push({ x: a, y: b, f: 0 });
        nextX = 1; nextY = 1; ndir = 0; turns = 0; addTiles(60);
        bx = 1; by = 1; dir = 0; sp = SPD[api.diff]; falling = false; fallT = 0; t = 0; gems = 0; camX = 0; camY = 0; parts = [];
      },
      resize: function () { }, idle: function () { },
      key: function (k, down) { if (down) this.input('down'); },
      input: function (type) { if (type === 'down' && !falling) { dir ^= 1; api.addScore(1); api.sound('click'); } },
      update: function (dt) {
        t += dt;
        for (var q = parts.length - 1; q >= 0; q--) { var p = parts[q]; p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt; if (p.l <= 0) parts.splice(q, 1); }
        if (falling) { fallT += dt; if (fallT > 1) api.gameOver(); return; }
        sp += dt * 0.03;
        if (dir === 0) bx += sp * dt; else by += sp * dt;
        var tl = onPath(bx, by);
        if (!tl) { falling = true; api.sound('hit'); api.vibrate(150); return; }
        if (tl.g) { tl.g = false; gems++; api.addScore(2); api.sound('coin'); var s = iso(tl.x, tl.y); for (var k = 0; k < 8; k++) parts.push({ x: s.x, y: s.y, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 160, l: 0.6 }); }
        // пройденные плитки падают
        tiles.forEach(function (tt) { if (tt.x + tt.y < bx + by - 3) tt.f += dt; });
        tiles = tiles.filter(function (tt) { return tt.f < 1.2; });
        if (tiles.length < 70) addTiles(30);
        var s2 = iso(bx, by); camX += (s2.x - camX) * Math.min(1, dt * 4); camY += (s2.y - camY) * Math.min(1, dt * 4);
      },
      draw: function (c) {
        var W = api.W, H = api.H, ox = W / 2 - camX, oy = H * 0.62 - camY;
        var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7dd3fc'); g.addColorStop(1, '#f9a8d4'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        var w = WID[api.diff] / 2;
        tiles.slice().sort(function (a, b) { return (b.x + b.y) - (a.x + a.y); }).forEach(function (tl) {
          var p = iso(tl.x, tl.y), drop = tl.f * tl.f * 400, x = ox + p.x, y = oy + p.y + drop, hw = TS * w * 2, hh = TS * w, dep = 22;
          if (y < -60 || y > H + 60) return;
          c.globalAlpha = Math.max(0, 1 - tl.f);
          c.fillStyle = '#f8fafc'; c.beginPath(); c.moveTo(x, y - hh); c.lineTo(x + hw, y); c.lineTo(x, y + hh); c.lineTo(x - hw, y); c.fill();
          c.fillStyle = '#cbd5e1'; c.beginPath(); c.moveTo(x - hw, y); c.lineTo(x, y + hh); c.lineTo(x, y + hh + dep); c.lineTo(x - hw, y + dep); c.fill();
          c.fillStyle = '#94a3b8'; c.beginPath(); c.moveTo(x + hw, y); c.lineTo(x, y + hh); c.lineTo(x, y + hh + dep); c.lineTo(x + hw, y + dep); c.fill();
          if (tl.g) { var bob = Math.sin(t * 4 + tl.x) * 3; c.fillStyle = '#a855f7'; c.beginPath(); c.moveTo(x, y - 20 + bob); c.lineTo(x + 7, y - 12 + bob); c.lineTo(x, y - 4 + bob); c.lineTo(x - 7, y - 12 + bob); c.fill(); }
          c.globalAlpha = 1;
        });
        var b = iso(bx, by), drop2 = falling ? fallT * fallT * 600 : 0;
        if (!falling) { c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(ox + b.x, oy + b.y + 2, 9, 4, 0, 0, 6.283); c.fill(); }
        var bg = c.createRadialGradient(ox + b.x - 3, oy + b.y - 14 + drop2, 2, ox + b.x, oy + b.y - 10 + drop2, 10);
        bg.addColorStop(0, '#fbcfe8'); bg.addColorStop(1, '#db2777'); c.fillStyle = bg;
        c.beginPath(); c.arc(ox + b.x, oy + b.y - 10 + drop2, 10, 0, 6.283); c.fill();
        c.fillStyle = '#a855f7'; parts.forEach(function (p) { c.globalAlpha = Math.max(0, p.l * 1.5); c.fillRect(ox + p.x - 3, oy + p.y - 3, 6, 6); }); c.globalAlpha = 1;
        c.fillStyle = '#fff'; c.font = '800 15px system-ui'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('◆ ' + gems, 14, 24);
        if (t < 2.5) { c.textAlign = 'center'; c.fillText('Нажимай, чтобы повернуть', W / 2, H * 0.25); }
      }
    };
  }
};
