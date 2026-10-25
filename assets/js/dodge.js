/* Уворот: води пальцем, лови монеты, не попадай под блоки */
window.GAMES = window.GAMES || {};
window.GAMES.dodge = {
  title: 'Уворот', desc: 'Уклоняйся от падающих блоков', cat: 'arcade', isNew4: true, medals: [300, 900, 1800],
  hint: 'Води пальцем влево-вправо. Лови золотые монеты, уворачивайся от красных блоков. Три жизни. Со временем всё быстрее.',
  d0: 'Медленные блоки', d1: 'Обычная скорость', d2: 'Быстро', d3: 'Очень быстро, блоки следят за тобой',
  colors: ['#f43f5e', '#7c3aed'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="20" y="8" width="26" height="26" rx="5" fill="#fb7185"/><rect x="58" y="30" width="22" height="22" rx="5" fill="#f43f5e"/><circle cx="34" cy="58" r="9" fill="#facc15"/><path d="M50 92 34 70h32z" fill="#fff"/></svg>',
  create: function (api) {
    var px, items, t, lives, sp, inv, tx, stars, parts, trail, tilt, K = window.GBK;
    function burst(x, y, col, n) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = 60 + Math.random() * 220; parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 0.6 + Math.random() * 0.3, c: col }); } }
    return {
      reset: function () {
        px = tx = api.W / 2; items = []; t = 0; lives = 3; inv = 0; sp = [150, 210, 280, 340][api.diff]; parts = []; trail = []; tilt = 0;
        stars = []; for (var i = 0; i < 70; i++) stars.push({ x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.7 });
      },
      idle: function (dt) { t += dt || 0; }, resize: function () { }, key: function (k, d) { if (!d) return; if (k === 'left') tx -= 40; if (k === 'right') tx += 40; },
      input: function (type, d) { if (type === 'down' || type === 'move') tx = d.x; },
      update: function (dt) {
        t += dt; var W = api.W, H = api.H, v = sp * (1 + t / 60), ox = px;
        px += (tx - px) * Math.min(1, dt * 14); px = Math.max(20, Math.min(W - 20, px));
        tilt += ((px - ox) / Math.max(dt, 0.001) * 0.0015 - tilt) * Math.min(1, dt * 10);
        stars.forEach(function (s2) { s2.y += dt * s2.z * v / H * 0.6; if (s2.y > 1) { s2.y -= 1; s2.x = Math.random(); } });
        for (var q = parts.length - 1; q >= 0; q--) { var p = parts[q]; p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt; if (p.l <= 0) parts.splice(q, 1); }
        trail.push({ x: px, y: H - 52, l: 0.35 }); trail.forEach(function (tr) { tr.l -= dt; tr.y += v * dt * 0.6; }); trail = trail.filter(function (tr) { return tr.l > 0; });
        if (Math.random() < dt * (1.6 + t / 25)) { var coin = Math.random() < 0.22; items.push({ x: 20 + Math.random() * (W - 40), y: -30, c: coin, s: coin ? 22 : 24 + Math.random() * 22, vy: v * (0.8 + Math.random() * 0.5), r: Math.random() * 6, vr: (Math.random() - 0.5) * 4 }); }
        inv -= dt; var py = H - 70;
        for (var i = items.length - 1; i >= 0; i--) {
          var o = items[i]; o.y += o.vy * dt; o.r += o.vr * dt; if (api.diff === 3 && !o.c && o.y < py - 80) o.x += Math.sign(px - o.x) * 30 * dt;
          if (Math.abs(o.x - px) < o.s / 2 + 16 && Math.abs(o.y - py) < o.s / 2 + 14) {
            if (o.c) { api.addScore(25); api.sound('coin'); burst(o.x, o.y, '#facc15', 10); items.splice(i, 1); continue; }
            if (inv <= 0) { lives--; inv = 1.2; api.sound('hit'); api.vibrate(60); api.fx.shake(6); burst(px, py, '#fb7185', 22); items.splice(i, 1); if (lives <= 0) { api.gameOver(); return; } continue; }
          }
          if (o.y > H + 40) items.splice(i, 1);
        }
        this._tick = (this._tick || 0) + dt; if (this._tick >= 0.2) { this._tick -= 0.2; api.addScore(1); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, py = H - 70;
        K.bg(c, W, H, '#0b0620', '#1e1b4b', 'rgba(124,58,237,.18)');
        stars.forEach(function (s2) { c.fillStyle = 'rgba(255,255,255,' + (0.3 + s2.z * 0.6) + ')'; c.fillRect(s2.x * W, s2.y * H, s2.z * 2.2, s2.z * 2.2 + s2.z * 4); });
        items.forEach(function (o) {
          c.save(); c.translate(o.x, o.y);
          if (o.c) {
            var sw = Math.abs(Math.cos(t * 4 + o.x));
            c.shadowColor = '#facc15'; c.shadowBlur = 14;
            c.fillStyle = '#b45309'; c.beginPath(); c.ellipse(1.5, 0, o.s / 2 * sw + 1, o.s / 2, 0, 0, 6.283); c.fill();
            c.fillStyle = '#facc15'; c.beginPath(); c.ellipse(0, 0, o.s / 2 * sw + 1, o.s / 2, 0, 0, 6.283); c.fill(); c.shadowBlur = 0;
            c.fillStyle = '#fef9c3'; c.beginPath(); c.ellipse(-o.s * 0.12 * sw, -o.s * 0.15, o.s * 0.12 * sw + 0.5, o.s * 0.12, 0, 0, 6.283); c.fill();
          } else {
            c.rotate(o.r); var h = o.s / 2;
            c.shadowColor = '#f43f5e'; c.shadowBlur = 16;
            var g = c.createLinearGradient(-h, -h, h, h); g.addColorStop(0, '#fb7185'); g.addColorStop(1, '#9f1239');
            K.rr(c, -h, -h, o.s, o.s, 6); c.fillStyle = g; c.fill(); c.shadowBlur = 0;
            c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; K.rr(c, -h + 4, -h + 4, o.s - 8, o.s - 8, 4); c.stroke();
            c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(-h * 0.35, -h * 0.35, h * 0.7, h * 0.7);
          }
          c.restore();
        });
        trail.forEach(function (tr) { c.globalAlpha = tr.l * 1.6; c.fillStyle = '#38bdf8'; c.beginPath(); c.arc(tr.x, tr.y, 6 * tr.l / 0.35, 0, 6.283); c.fill(); }); c.globalAlpha = 1;
        if (inv <= 0 || Math.floor(inv * 10) % 2) {
          c.save(); c.translate(px, py); c.rotate(Math.max(-0.4, Math.min(0.4, tilt)));
          var fl = 12 + Math.random() * 8; // огонь из сопла
          var fg = c.createLinearGradient(0, 12, 0, 12 + fl); fg.addColorStop(0, '#fde047'); fg.addColorStop(1, 'rgba(249,115,22,0)');
          c.fillStyle = fg; c.beginPath(); c.moveTo(-7, 12); c.lineTo(0, 12 + fl + 6); c.lineTo(7, 12); c.fill();
          c.shadowColor = '#38bdf8'; c.shadowBlur = 16;
          c.fillStyle = '#e2e8f0'; c.beginPath(); c.moveTo(0, -24); c.quadraticCurveTo(12, -6, 10, 14); c.lineTo(-10, 14); c.quadraticCurveTo(-12, -6, 0, -24); c.fill(); c.shadowBlur = 0;
          c.fillStyle = '#6366f1'; c.beginPath(); c.moveTo(-10, 2); c.lineTo(-22, 16); c.lineTo(-9, 14); c.fill(); c.beginPath(); c.moveTo(10, 2); c.lineTo(22, 16); c.lineTo(9, 14); c.fill();
          c.fillStyle = '#38bdf8'; c.beginPath(); c.ellipse(0, -6, 4.5, 7, 0, 0, 6.283); c.fill();
          c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(-1.5, -8, 1.5, 3, 0, 0, 6.283); c.fill();
          c.restore();
        }
        parts.forEach(function (p) { c.globalAlpha = Math.max(0, p.l * 1.5); c.fillStyle = p.c; c.fillRect(p.x - 2.5, p.y - 2.5, 5, 5); }); c.globalAlpha = 1;
        for (var hI = 0; hI < 3; hI++) K.heart(c, 22 + hI * 26, 26, 20, hI < lives ? '#f43f5e' : 'rgba(255,255,255,.18)');
      }
    };
  }
};
