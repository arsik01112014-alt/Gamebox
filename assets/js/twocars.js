/* Две машины: управляй двумя машинами сразу — левая половина экрана для левой, правая для правой.
   Собирай кружки, объезжай квадраты. Пропущенный кружок или удар о квадрат — конец игры */
window.GAMES = window.GAMES || {};
window.GAMES.twocars = {
  title: 'Две машины', desc: 'Управляй двумя машинами сразу', cat: 'arcade', isNew4: true, medals: [20, 50, 100],
  hint: 'Нажимай на левую половину экрана — левая машина меняет полосу, на правую — правая. Собирай кружки и объезжай квадраты. Пропустишь кружок или врежешься в квадрат — конец игры.',
  d0: 'Медленно', d1: 'Обычно', d2: 'Быстро', d3: 'Очень быстро',
  colors: ['#ef4444', '#06b6d4'], controls: 'none', multiTouch: true,
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#25174a"/><path d="M50 8v84" stroke="#a78bfa" stroke-width="2"/><path d="M29 8v84M71 8v84" stroke="#4c3a85" stroke-width="1.5" stroke-dasharray="5 5"/><rect x="14" y="62" width="12" height="20" rx="4" fill="#ef4444"/><rect x="74" y="62" width="12" height="20" rx="4" fill="#06b6d4"/><circle cx="38" cy="30" r="7" fill="none" stroke="#ef4444" stroke-width="4"/><rect x="56" y="24" width="13" height="13" rx="2" fill="#06b6d4"/></svg>',
  create: function (api) {
    var SP = [220, 280, 340, 400];
    var cars, objs, sp, spawnT, dead, t, parts;
    function laneX(side, l) { var q = api.W / 4; return side * api.W / 2 + q * (l + 0.5); }
    function carY() { return api.H - 110; }
    function spawn() {
      for (var side = 0; side < 2; side++) {
        if (Math.random() < 0.35) continue;
        objs.push({ side: side, l: Math.random() < 0.5 ? 0 : 1, y: -40 - Math.random() * 120, k: Math.random() < 0.5 ? 'o' : 'x' });
      }
    }
    function die(x, y, col) {
      dead = 1; api.sound('hit'); api.vibrate(200); api.fx.shake(6);
      for (var i = 0; i < 20; i++) parts.push({ x: x, y: y, vx: (Math.random() - 0.5) * 400, vy: (Math.random() - 0.5) * 400, l: 0.8, c: col });
    }
    function sideCol(s) { return s ? '#06b6d4' : '#ef4444'; }
    return {
      reset: function () { cars = [{ l: 0, x: laneX(0, 0) }, { l: 1, x: laneX(1, 1) }]; objs = []; sp = SP[api.diff]; spawnT = 0.5; dead = 0; t = 0; parts = []; },
      resize: function () { }, idle: function () { },
      key: function (k, down) { if (!down || dead) return; if (k === 'left') cars[0].l ^= 1; if (k === 'right') cars[1].l ^= 1; },
      input: function (type, d) { if (type === 'press' && !dead) { var s = d.x < api.W / 2 ? 0 : 1; cars[s].l ^= 1; api.sound('click'); } },
      update: function (dt) {
        t += dt;
        for (var q = parts.length - 1; q >= 0; q--) { var p = parts[q]; p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt; if (p.l <= 0) parts.splice(q, 1); }
        if (dead) { dead -= dt; if (dead <= 0) api.gameOver(); return; }
        sp += dt * 4;
        cars.forEach(function (cr, s) { cr.x += (laneX(s, cr.l) - cr.x) * Math.min(1, dt * 16); });
        spawnT -= dt;
        if (spawnT <= 0) { spawn(); spawnT = Math.max(0.42, 0.95 - t * 0.006) * 280 / sp * 1.4; }
        var cy = carY();
        for (var i = objs.length - 1; i >= 0; i--) {
          var o = objs[i]; o.y += sp * dt;
          var cr = cars[o.side];
          if (Math.abs(o.y - cy) < 34 && Math.abs(laneX(o.side, o.l) - cr.x) < api.W / 8) {
            objs.splice(i, 1);
            if (o.k === 'o') { api.addScore(1); api.sound('coin'); continue; }
            return die(cr.x, cy, sideCol(o.side));
          }
          if (o.y > api.H + 30) { objs.splice(i, 1); if (o.k === 'o') return die(laneX(o.side, o.l), api.H - 20, sideCol(o.side)); }
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        c.fillStyle = '#25174a'; c.fillRect(0, 0, W, H);
        c.strokeStyle = '#a78bfa'; c.lineWidth = 2; c.beginPath(); c.moveTo(W / 2, 0); c.lineTo(W / 2, H); c.stroke();
        c.strokeStyle = '#4c3a85'; c.setLineDash([16, 16]); c.lineDashOffset = -(t * sp) % 32;
        [W / 4, W * 3 / 4].forEach(function (x) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); });
        c.setLineDash([]);
        objs.forEach(function (o) {
          var x = laneX(o.side, o.l), col = sideCol(o.side);
          if (o.k === 'o') { c.strokeStyle = col; c.lineWidth = 7; c.beginPath(); c.arc(x, o.y, 15, 0, 6.283); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x, o.y, 4, 0, 6.283); c.fill(); }
          else { c.fillStyle = col; c.fillRect(x - 16, o.y - 16, 32, 32); c.fillStyle = '#25174a'; c.fillRect(x - 7, o.y - 7, 14, 14); }
        });
        if (!dead || dead > 0.95) cars.forEach(function (cr, s) {
          var y = carY(), tilt = (laneX(s, cr.l) - cr.x) * -0.006;
          c.save(); c.translate(cr.x, y); c.rotate(tilt);
          c.fillStyle = sideCol(s); c.beginPath(); c.roundRect ? c.roundRect(-16, -28, 32, 56, 9) : c.rect(-16, -28, 32, 56); c.fill();
          c.fillStyle = 'rgba(15,23,42,.75)'; c.fillRect(-11, -16, 22, 12); c.fillRect(-11, 10, 22, 8);
          c.fillStyle = '#fef08a'; c.fillRect(-13, -28, 7, 4); c.fillRect(6, -28, 7, 4);
          c.restore();
        });
        parts.forEach(function (p) { c.globalAlpha = Math.max(0, p.l); c.fillStyle = p.c; c.fillRect(p.x - 4, p.y - 4, 8, 8); }); c.globalAlpha = 1;
        if (t < 3 && !dead) { c.fillStyle = 'rgba(255,255,255,.75)'; c.font = '800 15px system-ui'; c.textAlign = 'center'; c.fillText('Жми слева — левая, справа — правая', W / 2, H * 0.4); }
      }
    };
  }
};
