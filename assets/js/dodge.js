/* Уворот: води пальцем, лови монеты, не попадай под блоки */
window.GAMES = window.GAMES || {};
window.GAMES.dodge = {
  title: 'Уворот', desc: 'Уклоняйся от падающих блоков', cat: 'arcade', isNew4: true, medals: [300, 900, 1800],
  hint: 'Води пальцем влево-вправо. Лови золотые монеты, уворачивайся от красных блоков. Три жизни. Со временем всё быстрее.',
  d0: 'Медленные блоки', d1: 'Обычная скорость', d2: 'Быстро', d3: 'Очень быстро, блоки следят за тобой',
  colors: ['#f43f5e', '#7c3aed'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="20" y="8" width="26" height="26" rx="5" fill="#fb7185"/><rect x="58" y="30" width="22" height="22" rx="5" fill="#f43f5e"/><circle cx="34" cy="58" r="9" fill="#facc15"/><path d="M50 92 34 70h32z" fill="#fff"/></svg>',
  create: function (api) {
    var px, items, t, lives, sp, inv, tx;
    return {
      reset: function () { px = tx = api.W / 2; items = []; t = 0; lives = 3; inv = 0; sp = [150, 210, 280, 340][api.diff]; },
      idle: function () { }, resize: function () { }, key: function (k, d) { if (!d) return; if (k === 'left') tx -= 40; if (k === 'right') tx += 40; },
      input: function (type, d) { if (type === 'down' || type === 'move') tx = d.x; },
      update: function (dt) {
        t += dt; var W = api.W, H = api.H, v = sp * (1 + t / 60); px += (tx - px) * Math.min(1, dt * 14); px = Math.max(20, Math.min(W - 20, px));
        if (Math.random() < dt * (1.6 + t / 25)) { var coin = Math.random() < 0.22; items.push({ x: 20 + Math.random() * (W - 40), y: -30, c: coin, s: coin ? 22 : 24 + Math.random() * 22, vy: v * (0.8 + Math.random() * 0.5) }); }
        inv -= dt; var py = H - 70;
        for (var i = items.length - 1; i >= 0; i--) {
          var o = items[i]; o.y += o.vy * dt; if (api.diff === 3 && !o.c && o.y < py - 80) o.x += Math.sign(px - o.x) * 30 * dt;
          if (Math.abs(o.x - px) < o.s / 2 + 16 && Math.abs(o.y - py) < o.s / 2 + 14) {
            if (o.c) { api.addScore(25); api.sound('coin'); items.splice(i, 1); continue; }
            if (inv <= 0) { lives--; inv = 1.2; api.sound('hit'); api.vibrate(60); api.fx.shake(6); if (lives <= 0) { api.gameOver(); return; } }
          }
          if (o.y > H + 40) items.splice(i, 1);
        }
        this._tick = (this._tick || 0) + dt; if (this._tick >= 0.2) { this._tick -= 0.2; api.addScore(1); }
      },
      draw: function (c) {
        var W = api.W, H = api.H; c.fillStyle = '#1e1b4b'; c.fillRect(0, 0, W, H);
        items.forEach(function (o) { if (o.c) { c.fillStyle = '#facc15'; c.beginPath(); c.arc(o.x, o.y, o.s / 2, 0, 6.283); c.fill(); } else { c.fillStyle = '#f43f5e'; c.fillRect(o.x - o.s / 2, o.y - o.s / 2, o.s, o.s); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(o.x - o.s / 2, o.y - o.s / 2, o.s, 5); } });
        if (inv <= 0 || Math.floor(inv * 10) % 2) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(px, H - 90); c.lineTo(px - 18, H - 56); c.lineTo(px + 18, H - 56); c.closePath(); c.fill(); }
        c.fillStyle = '#fda4af'; c.font = '800 18px system-ui'; c.textAlign = 'left'; c.fillText('❤'.repeat(lives), 12, 28);
      }
    };
  }
};
