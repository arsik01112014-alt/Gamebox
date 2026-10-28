/* Вертолёт в пещере: держи палец — набираешь высоту, отпусти — снижаешься */
window.GAMES = window.GAMES || {};
window.GAMES.heli = {
  title: 'Вертолёт', desc: 'Пролети через пещеру', cat: 'arcade', isNew4: true, medals: [150, 400, 900],
  hint: 'Держи палец на экране — вертолёт поднимается, отпустишь — опускается. Не задевай стены пещеры и сталактиты. Пещера постепенно сужается и ускоряется. Собирай топливо ⛽ для бонуса.',
  d0: 'Широкая пещера', d1: 'Обычно', d2: 'Узкая и быстрая', d3: 'Очень узкая',
  colors: ['#0891b2', '#78350f'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#0c4a6e"/><path d="M6 6h88v18l-10 6-12-4-14 8-14-6-14 8-12-4-12 6z" fill="#78350f"/><path d="M6 94h88V76l-12-6-14 6-12-8-14 6-12-4-14 8z" fill="#78350f"/><ellipse cx="46" cy="52" rx="16" ry="10" fill="#facc15"/><rect x="58" y="49" width="22" height="5" fill="#facc15"/><path d="M28 40h36" stroke="#e2e8f0" stroke-width="3"/><circle cx="40" cy="50" r="5" fill="#7dd3fc"/></svg>',
  create: function (api) {
    var cols, scroll, P, hold, t, dead, deadT, dist, smoke, items, top, gap, drift;
    var GAP = [0.62, 0.52, 0.44, 0.38], SP = [170, 200, 240, 280], CW = 12;
    function addCol() {
      var lastC = cols[cols.length - 1]; drift += (Math.random() - 0.5) * 10 + ((api.H - gap) / 2 - top) * 0.004; drift = Math.max(-5, Math.min(5, drift * 0.96));
      top = Math.max(20, Math.min(api.H - gap - 40, top + drift));
      gap = Math.max(api.H * (GAP[api.diff] - 0.16), gap - 0.06);
      var col = { x: lastC ? lastC.x + CW : 0, top: top, bot: top + gap };
      if (Math.random() < 0.025 && cols.length > 40) col.stal = { y: Math.random() < 0.5 ? 'top' : 'bot', h: gap * (0.25 + Math.random() * 0.2) };
      if (Math.random() < 0.012) items.push({ x: col.x, y: top + gap / 2 });
      cols.push(col);
    }
    return {
      reset: function () {
        cols = []; items = []; smoke = []; scroll = 0; t = 0; dead = false; deadT = 0; dist = 0; hold = false; drift = 0;
        gap = api.H * GAP[api.diff]; top = (api.H - gap) / 2; P = { x: api.W * 0.25, y: api.H / 2, vy: 0 };
        while (cols.length * CW < api.W + 60) addCol();
      },
      resize: function () { }, idle: function (dt) { t += dt || 0; }, key: function (k, d) { if (k === 'up' || k === 'space' || k === 'action') hold = d; },
      input: function (type) { if (type === 'down') hold = true; else if (type === 'up') hold = false; },
      update: function (dt) {
        t += dt;
        if (dead) { deadT += dt; P.vy += 600 * dt; P.y += P.vy * dt; if (deadT > 1.1) api.gameOver(); return; }
        var sp = SP[api.diff] + dist * 0.02; scroll += sp * dt;
        P.vy += (hold ? -900 : 700) * dt; P.vy = Math.max(-320, Math.min(380, P.vy)); P.y += P.vy * dt;
        while (cols.length && cols[0].x - scroll < -CW * 2) cols.shift();
        while (cols[cols.length - 1].x - scroll < api.W + 40) addCol();
        var d = Math.floor(scroll / 10); if (d > dist) { api.addScore(d - dist); dist = d; }
        // столкновение: колонка под вертолётом
        cols.forEach(function (c) {
          var sx = c.x - scroll; if (sx < P.x - 26 || sx > P.x + 22) return;
          var tp = c.top + (c.stal && c.stal.y === 'top' ? c.stal.h : 0), bt = c.bot - (c.stal && c.stal.y === 'bot' ? c.stal.h : 0);
          if (P.y - 10 < tp || P.y + 10 > bt) { dead = true; P.vy = -100; api.sound('hit'); api.vibrate(90); api.fx.shake && api.fx.shake(10); }
        });
        items.forEach(function (it) { if (!it.got && Math.hypot(it.x - scroll - P.x, it.y - P.y) < 26) { it.got = 1; api.addScore(25); api.sound('coin'); } });
        items = items.filter(function (it) { return it.x - scroll > -30; });
        if (Math.random() < 0.5) smoke.push({ x: P.x - 24, y: P.y + 2, l: 0.6 });
        smoke.forEach(function (s) { s.x -= sp * dt; s.l -= dt; }); smoke = smoke.filter(function (s) { return s.l > 0; });
      },
      draw: function (c) {
        var W = api.W, H = api.H, g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#082f49'); g.addColorStop(0.5, '#0e7490'); g.addColorStop(1, '#082f49'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        // дальние камни
        c.fillStyle = 'rgba(8,47,73,.6)'; for (var k = 0; k < 6; k++) { var x = ((k * 211 - scroll * 0.3) % (W + 200) + W + 200) % (W + 200) - 100; c.beginPath(); c.ellipse(x, H * (k % 2 ? 0.2 : 0.8), 90, 40, 0, 0, 6.283); c.fill(); }
        var rock = c.createLinearGradient(0, 0, 0, H); rock.addColorStop(0, '#78350f'); rock.addColorStop(0.5, '#451a03'); rock.addColorStop(1, '#78350f');
        c.fillStyle = rock;
        c.beginPath(); c.moveTo(-10, 0); cols.forEach(function (col) { c.lineTo(col.x - scroll, col.top); }); c.lineTo(W + 20, 0); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(-10, H); cols.forEach(function (col) { c.lineTo(col.x - scroll, col.bot); }); c.lineTo(W + 20, H); c.closePath(); c.fill();
        c.fillStyle = '#92400e';
        cols.forEach(function (col) {
          if (!col.stal) return; var x = col.x - scroll;
          c.beginPath(); if (col.stal.y === 'top') { c.moveTo(x - 14, col.top - 2); c.lineTo(x + 14, col.top - 2); c.lineTo(x, col.top + col.stal.h); } else { c.moveTo(x - 14, col.bot + 2); c.lineTo(x + 14, col.bot + 2); c.lineTo(x, col.bot - col.stal.h); } c.fill();
        });
        items.forEach(function (it) { if (it.got) return; c.font = '24px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('⛽', it.x - scroll, it.y + Math.sin(t * 4 + it.x) * 4); });
        smoke.forEach(function (s) { c.fillStyle = 'rgba(226,232,240,' + s.l * 0.4 + ')'; c.beginPath(); c.arc(s.x, s.y, 8 * (1.2 - s.l), 0, 6.283); c.fill(); });
        // вертолёт
        c.save(); c.translate(P.x, P.y); c.rotate(Math.max(-0.3, Math.min(0.3, P.vy / 900)) + (dead ? deadT * 6 : 0));
        c.fillStyle = '#facc15'; c.beginPath(); c.ellipse(0, 0, 20, 12, 0, 0, 6.283); c.fill();
        c.fillRect(-36, -3, 20, 5); c.fillRect(-38, -9, 5, 12);
        c.fillStyle = '#7dd3fc'; c.beginPath(); c.ellipse(8, -2, 8, 6, 0, 0, 6.283); c.fill();
        c.strokeStyle = '#334155'; c.lineWidth = 2; c.beginPath(); c.moveTo(-14, 16); c.lineTo(16, 16); c.moveTo(-6, 12); c.lineTo(-8, 16); c.moveTo(8, 12); c.lineTo(10, 16); c.stroke();
        c.fillStyle = '#334155'; c.fillRect(-2, -16, 4, 5);
        var bl = 28 * Math.abs(Math.cos(t * 40)); c.strokeStyle = '#e2e8f0'; c.lineWidth = 3; c.beginPath(); c.moveTo(-bl, -16); c.lineTo(bl, -16); c.stroke();
        c.restore();
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.font = '800 16px system-ui'; c.fillText(dist + ' м', W / 2, 26);
        if (t < 3) { c.font = '700 14px system-ui'; c.fillText('Держи палец — вверх, отпусти — вниз', W / 2, H - 50); }
      }
    };
  }
};
