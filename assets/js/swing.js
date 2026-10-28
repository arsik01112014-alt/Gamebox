/* Паук на канате: держи палец — цепляешься паутиной, отпускаешь — летишь */
window.GAMES = window.GAMES || {};
window.GAMES.swing = {
  title: 'Паук на канате', desc: 'Раскачивайся и лети', cat: 'arcade', isNew4: true, medals: [150, 400, 900],
  hint: 'Зажми палец — паутина цепляется за ближайшую точку впереди, и ты раскачиваешься. Отпусти в верхней точке, чтобы улететь дальше. Не падай вниз! Очки — за пройденное расстояние, звёздочки дают бонус.',
  d0: 'Точки часто', d1: 'Обычно', d2: 'Точки реже', d3: 'Редко и высоко',
  colors: ['#0ea5e9', '#1e3a8a'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#0c4a6e"/><circle cx="70" cy="20" r="6" fill="#fde68a"/><path d="M70 20L38 62" stroke="#e0f2fe" stroke-width="3"/><circle cx="36" cy="66" r="10" fill="#ef4444"/><circle cx="33" cy="63" r="3" fill="#fff"/><circle cx="40" cy="63" r="3" fill="#fff"/><rect x="6" y="82" width="88" height="12" fill="#1e293b"/></svg>',
  create: function (api) {
    var p, rope, anchors, stars, camX, t, maxX, holding, dead, deadT, trail, bonus;
    var GAPX = [150, 180, 215, 250];
    function addAnchor(x) { anchors.push({ x: x, y: 70 + Math.random() * (api.diff >= 3 ? 90 : 140) }); if (Math.random() < 0.5) stars.push({ x: x + 60 + Math.random() * 60, y: 170 + Math.random() * 200, got: 0 }); }
    function attach() {
      var best = null, bd = 1e9;
      anchors.forEach(function (a) { if (a.x < p.x - 40 || a.y > p.y) return; var d = Math.hypot(a.x - p.x, a.y - p.y); if (d < 420 && d < bd) { bd = d; best = a; } });
      if (best) { rope = { a: best, len: Math.max(80, bd) }; api.sound('click'); }
    }
    return {
      reset: function () {
        p = { x: 80, y: 220, vx: 160, vy: 0 }; anchors = []; stars = []; camX = 0; t = 0; maxX = 80; holding = false; dead = false; deadT = 0; trail = []; bonus = 0;
        for (var x = 160; x < 2000; x += GAPX[api.diff] * (0.8 + Math.random() * 0.4)) addAnchor(x);
        rope = { a: anchors[0], len: Math.hypot(anchors[0].x - p.x, anchors[0].y - p.y) }; holding = true;
      },
      resize: function () { }, idle: function (dt) { t += dt || 0; }, key: function (k, d) { if (k === 'up' || k === 'space' || k === 'action') { holding = d; if (d) attach(); else rope = null; } },
      input: function (type) { if (type === 'down') { holding = true; attach(); } else if (type === 'up') { holding = false; rope = null; } },
      update: function (dt) {
        t += dt;
        if (dead) { deadT += dt; if (deadT > 0.8) api.gameOver(); return; }
        var steps = 3, h = dt / steps;
        for (var s = 0; s < steps; s++) {
          p.vy += 900 * h; p.vx *= 0.9995;
          p.x += p.vx * h; p.y += p.vy * h;
          if (rope) { // канат не растягивается: проекция на окружность и гашение радиальной скорости
            var dx = p.x - rope.a.x, dy = p.y - rope.a.y, d = Math.hypot(dx, dy);
            if (d > rope.len) {
              var nx = dx / d, ny = dy / d; p.x = rope.a.x + nx * rope.len; p.y = rope.a.y + ny * rope.len;
              var vr = p.vx * nx + p.vy * ny; if (vr > 0) { p.vx -= vr * nx; p.vy -= vr * ny; }
              if (rope.len > 90) rope.len -= 30 * h; // подтягивается, чтобы раскачка была живее
            }
          }
        }
        trail.push([p.x, p.y]); if (trail.length > 18) trail.shift();
        if (p.x > maxX) { var gain = Math.floor(p.x / 20) - Math.floor(maxX / 20); if (gain > 0) api.addScore(gain); maxX = p.x; }
        var last = anchors[anchors.length - 1]; while (last.x < p.x + api.W * 2) { addAnchor(last.x + GAPX[api.diff] * (0.8 + Math.random() * 0.4)); last = anchors[anchors.length - 1]; }
        anchors = anchors.filter(function (a) { return a.x > camX - 200 || (rope && rope.a === a); });
        stars.forEach(function (st) { if (!st.got && Math.hypot(st.x - p.x, st.y - p.y) < 26) { st.got = 1; api.addScore(10); bonus = 0.8; api.sound('coin'); api.vibrate(10); } });
        stars = stars.filter(function (st) { return st.x > camX - 100; }); if (bonus > 0) bonus -= dt;
        var tx = p.x - api.W * 0.35; camX += (tx - camX) * Math.min(1, dt * 5);
        if (p.y > api.H + 40) { dead = true; api.sound('hit'); api.vibrate(60); }
        if (p.y < -400) p.vy = Math.max(p.vy, 0);
      },
      draw: function (c) {
        var W = api.W, H = api.H, g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#0c4a6e'); g.addColorStop(1, '#7dd3fc'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        // дальние небоскрёбы
        for (var layer = 0; layer < 2; layer++) {
          var k = layer ? 0.5 : 0.25, col = layer ? '#1e3a5f' : '#2b4d74', bw = layer ? 70 : 50;
          c.fillStyle = col;
          var start = Math.floor(camX * k / bw) - 1;
          for (var i = start; i < start + W / bw + 3; i++) { var hh = 120 + ((i * 7919) % 11) * (layer ? 26 : 18); c.fillRect(i * bw - camX * k, H - hh, bw - 6, hh); }
        }
        c.fillStyle = '#0f172a'; c.fillRect(0, H - 24, W, 24);
        c.save(); c.translate(-camX, 0);
        anchors.forEach(function (a) { c.fillStyle = '#fde68a'; c.beginPath(); c.arc(a.x, a.y, 7, 0, 6.283); c.fill(); c.strokeStyle = 'rgba(253,230,138,.3)'; c.lineWidth = 6; c.beginPath(); c.arc(a.x, a.y, 12, 0, 6.283); c.stroke(); });
        stars.forEach(function (st) { if (st.got) return; c.font = '24px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('⭐', st.x, st.y + Math.sin(t * 4 + st.x) * 4); });
        if (rope) { c.strokeStyle = '#f8fafc'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(rope.a.x, rope.a.y); c.lineTo(p.x, p.y); c.stroke(); }
        trail.forEach(function (q, i) { c.fillStyle = 'rgba(255,255,255,' + i / trail.length * 0.35 + ')'; c.beginPath(); c.arc(q[0], q[1], 3 + i / 5, 0, 6.283); c.fill(); });
        var ang = Math.atan2(p.vy, p.vx);
        c.save(); c.translate(p.x, p.y); c.rotate(ang * 0.3);
        c.fillStyle = '#dc2626'; c.beginPath(); c.arc(0, 0, 14, 0, 6.283); c.fill();
        c.strokeStyle = '#7f1d1d'; c.lineWidth = 1; c.beginPath(); c.moveTo(-14, 0); c.lineTo(14, 0); c.moveTo(0, -14); c.lineTo(0, 14); c.stroke();
        c.fillStyle = '#fff'; c.beginPath(); c.ellipse(-5, -3, 4, 5.5, -0.3, 0, 6.283); c.ellipse(5, -3, 4, 5.5, 0.3, 0, 6.283); c.fill();
        c.restore(); c.restore();
        c.fillStyle = '#fff'; c.font = '800 15px system-ui'; c.textAlign = 'center'; c.fillText(Math.floor(maxX / 20) + ' м' + (bonus > 0 ? '  +10 ⭐' : ''), W / 2, 30);
        if (t < 3) { c.font = '700 14px system-ui'; c.fillText('Держи палец — паутина, отпусти — полёт', W / 2, H - 60); }
      }
    };
  }
};
