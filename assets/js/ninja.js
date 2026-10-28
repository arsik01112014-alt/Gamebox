/* Ниндзя на стенах: прыгай между стенами вверх, уворачиваясь от шипов */
window.GAMES = window.GAMES || {};
window.GAMES.ninja = {
  title: 'Ниндзя на стенах', desc: 'Прыгай между стен вверх', cat: 'arcade', isNew4: true, medals: [50, 150, 350],
  hint: 'Нажми — ниндзя прыгает на противоположную стену. Нажми в прыжке — сделает двойной прыжок обратно. Уворачивайся от шипов на стенах и летящих сюрикенов. Собирай монетки. Лезь как можно выше!',
  d0: 'Медленно', d1: 'Обычно', d2: 'Быстро', d3: 'Очень быстро',
  colors: ['#334155', '#dc2626'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#0f172a"/><rect x="6" y="6" width="16" height="88" fill="#475569"/><rect x="78" y="6" width="16" height="88" fill="#475569"/><path d="M22 30l10 5-10 5zM78 60l-10 5 10 5z" fill="#e2e8f0"/><circle cx="36" cy="58" r="11" fill="#111827"/><rect x="26" y="54" width="20" height="5" fill="#dc2626"/><circle cx="40" cy="56" r="2" fill="#fff"/><path d="M26 57l-8 4" stroke="#dc2626" stroke-width="3"/><circle cx="62" cy="26" r="5" fill="#facc15"/></svg>',
  create: function (api) {
    var WW = 34, P, objs, camY, t, nextY, height, dead, deadT, coins, speed, parts;
    var SPD = [70, 95, 125, 155];
    function wallX(side) { return side ? api.W - WW : WW; }
    function gen(y) { // y растёт вверх (мировые координаты), объекты на стенах и в воздухе
      var r = Math.random();
      if (r < 0.55) objs.push({ k: 'spike', side: Math.random() < 0.5 ? 0 : 1, y: y, h: 40 + Math.random() * 50 });
      else if (r < 0.75) objs.push({ k: 'star', y: y, x: Math.random() < 0.5 ? -30 : api.W + 30, vx: 0 });
      if (Math.random() < 0.5) objs.push({ k: 'coin', y: y + 70, x: api.W * (0.3 + Math.random() * 0.4) });
    }
    function sy(y) { return api.H - (y - camY); }
    return {
      reset: function () {
        P = { side: 0, y: 120, x: WW + 14, vx: 0, vy: 0, air: false, dbl: false, rot: 0 }; objs = []; camY = 0; t = 0; height = 0; dead = false; deadT = 0; coins = 0; speed = SPD[api.diff]; parts = [];
        nextY = 420; while (nextY < 1400) { gen(nextY); nextY += 150 + Math.random() * 90; }
      },
      resize: function () { }, idle: function (dt) { t += dt || 0; }, key: function (k, d) { if (d && (k === 'up' || k === 'space' || k === 'action')) this.input('down'); },
      input: function (type) {
        if (type !== 'down' || dead) return;
        if (!P.air) { P.air = true; P.dbl = false; P.vx = P.side ? -520 : 520; P.vy = 360; api.sound('jump'); }
        else if (!P.dbl) { P.dbl = true; P.vx = -P.vx; P.vy = 300; api.sound('jump'); }
      },
      update: function (dt) {
        t += dt;
        if (dead) { deadT += dt; P.vy -= 1200 * dt; P.y += P.vy * dt; P.rot += dt * 12; if (deadT > 1) api.gameOver(); return; }
        speed = SPD[api.diff] + height * 0.04;
        if (P.air) {
          P.x += P.vx * dt; P.y += P.vy * dt; P.vy -= 500 * dt; P.rot += dt * 14 * (P.vx > 0 ? 1 : -1);
          if (P.x <= WW + 14) { P.x = WW + 14; P.side = 0; P.air = false; P.rot = 0; api.vibrate(5); }
          else if (P.x >= api.W - WW - 14) { P.x = api.W - WW - 14; P.side = 1; P.air = false; P.rot = 0; api.vibrate(5); }
        } else P.y += speed * 0.6 * dt; // на стене скользит вверх
        camY += speed * dt; if (P.y - camY > api.H * 0.55) camY = P.y - api.H * 0.55;
        var h = Math.floor(camY / 10); if (h > height) { api.addScore(h - height); height = h; }
        while (nextY < camY + api.H + 300) { gen(nextY); nextY += Math.max(110, 170 - height * 0.05) + Math.random() * 90; }
        objs.forEach(function (o) {
          if (o.k === 'star') { if (!o.vx && o.y - camY < api.H * 0.9) o.vx = o.x < 0 ? 170 : -170; o.x += o.vx * dt; o.r = (o.r || 0) + dt * 12; }
          if (o.dead) return;
          if (o.k === 'spike' && !P.air && P.side === o.side && P.y > o.y - 10 && P.y < o.y + o.h + 10) die();
          if (o.k === 'star' && Math.hypot(o.x - P.x, o.y - P.y) < 24) die();
          if (o.k === 'coin' && Math.hypot(o.x - P.x, o.y - P.y) < 26) { o.dead = true; coins++; api.addScore(5); api.sound('coin'); }
        });
        objs = objs.filter(function (o) { return o.y > camY - 100 && !(o.k === 'coin' && o.dead); });
        if (P.y < camY - 30) die();
        parts.forEach(function (q) { q.x += q.vx * dt; q.y += q.vy * dt; q.l -= dt; }); parts = parts.filter(function (q) { return q.l > 0; });
      },
      draw: function (c) {
        var W = api.W, H = api.H, g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#1e1b4b'); g.addColorStop(1, '#0f172a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        var mg = c.createRadialGradient(W * 0.62, H * 0.22, 10, W * 0.62, H * 0.22, 120); mg.addColorStop(0, 'rgba(254,243,199,.35)'); mg.addColorStop(1, 'rgba(254,243,199,0)'); c.fillStyle = mg; c.fillRect(0, 0, W, H);
        c.fillStyle = '#fef3c7'; c.beginPath(); c.arc(W * 0.62, H * 0.22, 34, 0, 6.283); c.fill(); c.fillStyle = 'rgba(234,179,8,.25)'; c.beginPath(); c.arc(W * 0.62 - 10, H * 0.22 - 6, 7, 0, 6.283); c.arc(W * 0.62 + 12, H * 0.22 + 8, 5, 0, 6.283); c.fill();
        // силуэт пагоды, медленно уезжает вниз
        var py = H - 120 + Math.min(260, camY * 0.2); c.fillStyle = 'rgba(15,23,42,.8)'; for (var fl = 0; fl < 4; fl++) { var fw = 120 - fl * 22, fy = py - fl * 46; c.fillRect(W / 2 - fw / 2 + 10, fy, fw - 20, 46); c.beginPath(); c.moveTo(W / 2 - fw / 2 - 14, fy + 4); c.lineTo(W / 2, fy - 18); c.lineTo(W / 2 + fw / 2 + 14, fy + 4); c.fill(); }
        // фонари на дальнем плане
        for (var k = 0; k < 24; k++) { var ly = ((k * 173 + camY * 0.3) % (H + 100)) - 50; c.fillStyle = 'rgba(255,255,255,' + (0.25 + (k % 4) * 0.12) + ')'; c.fillRect(WW + ((k * 97) % (W - WW * 2)), H - ly, 2, 2); }
        // стены из кирпича
        [0, 1].forEach(function (s) {
          var x = s ? W - WW : 0; c.fillStyle = '#334155'; c.fillRect(x, 0, WW, H);
          c.strokeStyle = '#1e293b'; c.lineWidth = 2; var off = camY % 24;
          for (var y = -24; y < H + 24; y += 24) { c.beginPath(); c.moveTo(x, y + off); c.lineTo(x + WW, y + off); c.stroke(); var bx = x + ((Math.floor((y + camY) / 24) % 2) ? WW / 2 : WW / 4); c.beginPath(); c.moveTo(bx, y + off); c.lineTo(bx, y + off + 24); c.stroke(); }
        });
        objs.forEach(function (o) {
          if (o.k === 'spike') {
            var x0 = wallX(o.side), dir = o.side ? -1 : 1, top = sy(o.y + o.h), n = Math.max(2, Math.floor(o.h / 14));
            c.fillStyle = '#e2e8f0'; for (var i = 0; i < n; i++) { var yy = top + i * (o.h / n); c.beginPath(); c.moveTo(x0, yy); c.lineTo(x0 + dir * 16, yy + o.h / n / 2); c.lineTo(x0, yy + o.h / n); c.fill(); }
          } else if (o.k === 'star') {
            c.save(); c.translate(o.x, sy(o.y)); c.rotate(o.r || 0); c.fillStyle = '#cbd5e1';
            c.beginPath(); for (var q = 0; q < 8; q++) { var a = q * Math.PI / 4, rr = q % 2 ? 5 : 15; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.fill(); c.restore();
          } else if (!o.dead) { c.fillStyle = '#facc15'; c.beginPath(); c.ellipse(o.x, sy(o.y), 9 * Math.abs(Math.cos(t * 3 + o.x)) + 2, 9, 0, 0, 6.283); c.fill(); }
        });
        // ниндзя
        c.save(); c.translate(P.x, sy(P.y)); c.rotate(P.air ? P.rot : 0); if (!P.air && P.side) c.scale(-1, 1);
        c.scale(1.25, 1.25);
        c.strokeStyle = '#94a3b8'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-10, 10); c.lineTo(12, -14); c.stroke(); c.fillStyle = '#7c2d12'; c.fillRect(-12, 8, 6, 4);
        c.fillStyle = '#111827'; c.beginPath(); c.ellipse(0, 3, 12, 14, 0, 0, 6.283); c.fill(); c.beginPath(); c.arc(0, -8, 10, 0, 6.283); c.fill();
        c.fillStyle = '#fcd9b6'; c.fillRect(-7, -11, 14, 5);
        c.fillStyle = '#111'; c.fillRect(-4, -10, 3, 3); c.fillRect(2, -10, 3, 3);
        c.fillStyle = '#dc2626'; c.fillRect(-10, -15, 20, 4); c.strokeStyle = '#dc2626'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(-9, -13); c.quadraticCurveTo(-18, -14 + Math.sin(t * 18) * 3, -24, -8 + Math.sin(t * 20) * 4); c.stroke();
        c.fillStyle = '#1f2937'; c.fillRect(-12, 1, 24, 3);
        c.restore();
        c.textAlign = 'center'; c.fillStyle = '#fff'; c.font = '800 16px system-ui'; c.fillText(height + ' м   🪙 ' + coins, W / 2, 30);
        if (t < 3) { c.font = '700 14px system-ui'; c.fillText('Нажимай — прыжок, в воздухе — ещё раз', W / 2, H - 60); }
      }
    };
    function die() { if (dead) return; dead = true; P.vy = 300; api.sound('hit'); api.vibrate(70); }
  }
};
