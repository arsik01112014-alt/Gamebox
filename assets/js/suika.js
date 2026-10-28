/* Арбузы: роняй фрукты, одинаковые сливаются в фрукт побольше. Собери арбуз! */
window.GAMES = window.GAMES || {};
window.GAMES.suika = {
  title: 'Арбузы', desc: 'Сливай фрукты до арбуза', cat: 'puzzle', isNew4: true, medals: [3000, 8000, 20000],
  hint: 'Веди пальцем, чтобы выбрать место, отпусти — фрукт упадёт. Два одинаковых фрукта сливаются в следующий: вишня → клубника → виноград → … → арбуз. Если фрукты долго лежат выше красной линии — игра окончена.',
  d0: 'Большая банка', d1: 'Обычно', d2: 'Банка поуже', d3: 'Узкая банка, крупные фрукты',
  colors: ['#16a34a', '#dc2626'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#fef3c7"/><path d="M18 30v52a8 8 0 0 0 8 8h48a8 8 0 0 0 8-8V30" fill="#fde68a" stroke="#b45309" stroke-width="4"/><circle cx="62" cy="68" r="17" fill="#16a34a"/><path d="M50 60c6 4 18 4 24 0M48 70c8 4 20 4 28 0" stroke="#14532d" stroke-width="2.5" fill="none"/><circle cx="34" cy="74" r="10" fill="#f97316"/><circle cx="36" cy="54" r="7" fill="#a855f7"/><circle cx="50" cy="20" r="6" fill="#dc2626"/></svg>',
  create: function (api) {
    var F = [['🍒', '#dc2626', 13], ['🍓', '#f43f5e', 17], ['🍇', '#a855f7', 22], ['🍊', '#fb923c', 27], ['🍋', '#facc15', 32], ['🍎', '#ef4444', 38], ['🍐', '#a3e635', 44], ['🍑', '#fdba74', 50], ['🍍', '#eab308', 57], ['🍈', '#86efac', 64], ['🍉', '#16a34a', 72]];
    var balls, box, cur, nxt, aimX, dropT, t, overT, endT, pops, best, combo, comboT;
    function scl() { return [1, 1, 1.06, 1.14][api.diff] * Math.min(1, api.W / 390); }
    function rad(k) { return F[k][2] * scl(); }
    function layout() { var w = Math.min(api.W - 24, [370, 350, 320, 300][api.diff] * Math.min(1, api.W / 390)); box = { l: (api.W - w) / 2, r: (api.W + w) / 2, b: api.H - 30, top: 150 }; }
    function rndK() { return Math.floor(Math.random() * Math.min(5, 2 + (best > 4 ? 3 : best))); }
    return {
      reset: function () { layout(); balls = []; best = 0; cur = rndK(); nxt = rndK(); aimX = api.W / 2; dropT = 0; t = 0; overT = 0; endT = 0; pops = []; best = 0; combo = 0; comboT = 0; },
      resize: layout, idle: function (dt) { t += dt || 0; }, key: function () { },
      input: function (type, d) {
        if (endT > 0) return;
        if (d && d.x != null) aimX = Math.max(box.l + rad(cur), Math.min(box.r - rad(cur), d.x));
        if (type === 'up' && dropT <= 0) { balls.push({ x: aimX, y: box.top - 40, vx: 0, vy: 0, k: cur, age: 0 }); cur = nxt; nxt = rndK(); dropT = 0.5; api.sound('drop'); }
      },
      update: function (dt) {
        t += dt; if (dropT > 0) dropT -= dt; if (comboT > 0) comboT -= dt; else combo = 0;
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        var sub = 4, h = Math.min(dt, 1 / 30) / sub;
        for (var s = 0; s < sub; s++) {
          balls.forEach(function (b) { b.vy += 1400 * h; b.x += b.vx * h; b.y += b.vy * h; b.vx *= 0.995; });
          for (var it = 0; it < 3; it++) {
            for (var i = 0; i < balls.length; i++) {
              var A = balls[i], ra = rad(A.k);
              if (A.x - ra < box.l) { A.x = box.l + ra; A.vx = Math.abs(A.vx) * 0.3; }
              if (A.x + ra > box.r) { A.x = box.r - ra; A.vx = -Math.abs(A.vx) * 0.3; }
              if (A.y + ra > box.b) { A.y = box.b - ra; A.vy = -Math.abs(A.vy) * 0.2; A.vx *= 0.92; }
              for (var j = i + 1; j < balls.length; j++) {
                var B = balls[j], rbb = rad(B.k), dx = B.x - A.x, dy = B.y - A.y, d2 = dx * dx + dy * dy, rr = ra + rbb;
                if (d2 >= rr * rr || d2 === 0) continue;
                var dd = Math.sqrt(d2), nx = dx / dd, ny = dy / dd, ov = rr - dd;
                if (A.k === B.k && !A.m && !B.m && A.k < F.length - 1) { A.m = B.m = 1; A.mx = (A.x + B.x) / 2; A.my = (A.y + B.y) / 2; A.with = B; continue; }
                var ma = ra * ra, mb = rbb * rbb, tot = ma + mb;
                A.x -= nx * ov * mb / tot; A.y -= ny * ov * mb / tot; B.x += nx * ov * ma / tot; B.y += ny * ov * ma / tot;
                var rv = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny; if (rv < 0) { var imp = -rv * 1.15; A.vx -= nx * imp * mb / tot; A.vy -= ny * imp * mb / tot; B.vx += nx * imp * ma / tot; B.vy += ny * imp * ma / tot; }
              }
            }
          }
          // слияния
          for (var m = balls.length - 1; m >= 0; m--) {
            var X = balls[m]; if (!X.with) continue;
            var nk = X.k + 1; balls.splice(balls.indexOf(X.with), 1); balls.splice(balls.indexOf(X), 1);
            balls.push({ x: X.mx, y: X.my, vx: 0, vy: -60, k: nk, age: 0, grow: 0 }); best = Math.max(best, nk);
            combo++; comboT = 1; api.addScore((nk + 1) * (nk + 1) * 2 * (combo > 1 ? combo : 1)); api.sound(nk >= 8 ? 'bonus' : 'coin'); api.vibrate(10);
            pops.push({ x: X.mx, y: X.my, r: rad(nk), c: F[nk][1], l: 0.5 }); if (nk === F.length - 1) api.fx.confetti(70);
            m = balls.length; // список изменился — пройти заново
            break;
          }
        }
        balls.forEach(function (b) { b.age += dt; if (b.grow != null && b.grow < 1) b.grow = Math.min(1, b.grow + dt * 6); b.m = 0; });
        var high = balls.some(function (b) { return b.age > 1 && b.y - rad(b.k) < box.top && Math.abs(b.vy) < 80; });
        if (high) { overT += dt; if (overT > 2) { endT = 1.5; api.sound('hit'); api.vibrate(80); } } else overT = Math.max(0, overT - dt);
        pops.forEach(function (q) { q.l -= dt; }); pops = pops.filter(function (q) { return q.l > 0; });
      },
      draw: function (c) {
        var W = api.W, H = api.H, K = window.GBK, g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#fef9c3'); g.addColorStop(1, '#fed7aa'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(234,88,12,.06)'; for (var i = 0; i < 12; i++) { c.beginPath(); c.arc((i * 97) % W, (i * 173) % H, 30 + (i % 3) * 14, 0, 6.283); c.fill(); }
        // банка
        c.save(); c.shadowColor = 'rgba(146,64,14,.35)'; c.shadowBlur = 20; c.shadowOffsetY = 8;
        K.rr(c, box.l - 8, box.top - 30, box.r - box.l + 16, box.b - box.top + 38, 22); c.fillStyle = 'rgba(255,255,255,.5)'; c.fill(); c.restore();
        K.rr(c, box.l - 8, box.top - 30, box.r - box.l + 16, box.b - box.top + 38, 22); c.strokeStyle = '#d97706'; c.lineWidth = 5; c.stroke();
        c.fillStyle = 'rgba(255,255,255,.35)'; K.rr(c, box.l + 4, box.top - 20, 10, box.b - box.top + 10, 5); c.fill();
        // красная линия
        c.strokeStyle = overT > 0 ? 'rgba(220,38,38,' + (0.5 + 0.5 * Math.sin(t * 16)) + ')' : 'rgba(220,38,38,.35)'; c.setLineDash([8, 6]); c.lineWidth = 2;
        c.beginPath(); c.moveTo(box.l, box.top); c.lineTo(box.r, box.top); c.stroke(); c.setLineDash([]);
        // прицел
        if (endT <= 0) { c.strokeStyle = 'rgba(180,83,9,.3)'; c.lineWidth = 2; c.setLineDash([4, 6]); c.beginPath(); c.moveTo(aimX, box.top - 40); c.lineTo(aimX, box.b); c.stroke(); c.setLineDash([]); }
        function fruit(x, y, k, s2) {
          var r = rad(k) * (s2 == null ? 1 : s2);
          c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(x + 2, y + r * 0.9, r * 0.8, r * 0.2, 0, 0, 6.283); c.fill();
          var gr = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); gr.addColorStop(0, '#fff'); gr.addColorStop(0.25, F[k][1]); gr.addColorStop(1, K.shade(F[k][1], -0.3));
          c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
          c.font = Math.round(r * 1.25) + 'px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(F[k][0], x, y + r * 0.06);
        }
        balls.forEach(function (b) { fruit(b.x, b.y, b.k, b.grow != null ? 0.6 + 0.4 * b.grow : 1); });
        pops.forEach(function (q) { c.strokeStyle = q.c; c.globalAlpha = q.l * 2; c.lineWidth = 4; c.beginPath(); c.arc(q.x, q.y, q.r * (1.6 - q.l), 0, 6.283); c.stroke(); }); c.globalAlpha = 1;
        if (endT <= 0 && dropT <= 0) fruit(aimX, box.top - 40, cur);
        // следующий и шкала фруктов
        c.fillStyle = '#9a3412'; c.font = '800 13px system-ui'; c.textAlign = 'left'; c.fillText('Дальше:', 16, 30); c.font = '26px system-ui'; c.fillText(F[nxt][0], 76, 31);
        c.textAlign = 'center'; c.font = '17px system-ui';
        for (var k = 0; k < F.length; k++) { c.globalAlpha = k <= best ? 1 : 0.3; c.fillText(F[k][0], W - 16 - (F.length - 1 - k) * 22 - 6, 30); } c.globalAlpha = 1;
        if (combo > 1) { c.fillStyle = '#ea580c'; c.font = '900 22px system-ui'; c.fillText('Комбо ×' + combo, W / 2, 80); }
        if (endT > 0) K.toast(c, W, H / 2, 'Банка переполнена!', 1);
      }
    };
  }
};
