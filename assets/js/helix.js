/* Спиральная башня: крути башню, чтобы мячик падал в щели, и не задевай красное */
window.GAMES = window.GAMES || {};
window.GAMES.helix = {
  title: 'Спиральная башня', desc: 'Крути башню, роняй мячик', cat: 'arcade', isNew4: true, medals: [40, 100, 200],
  hint: 'Води пальцем влево-вправо — башня поворачивается. Мячик прыгает и падает в щели. Красные участки опасны! Если пролететь 3 этажа подряд, мячик пробьёт следующий этаж насквозь.',
  d0: 'Мало красного', d1: 'Обычно', d2: 'Больше красного', d3: 'Много красного и узкие щели',
  colors: ['#f43f5e', '#7c3aed'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#312e81"/><rect x="44" y="10" width="12" height="82" fill="#c7d2fe"/><ellipse cx="50" cy="34" rx="34" ry="9" fill="#a78bfa"/><path d="M16 34a34 9 0 0 0 20 8l4-8z" fill="#312e81"/><ellipse cx="50" cy="60" rx="34" ry="9" fill="#a78bfa"/><path d="M70 66a34 9 0 0 0 14-6H64z" fill="#f43f5e"/><ellipse cx="50" cy="82" rx="34" ry="9" fill="#a78bfa"/><circle cx="50" cy="48" r="7" fill="#fbbf24"/></svg>',
  create: function (api) {
    var SEG = 12, GAP = 9, levels, rot, ball, camY, t, lastX, combo, dead, deadT, passed, splats, pal, trail;
    var RED = [0.05, 0.1, 0.16, 0.22];
    var PALS = [['#a78bfa', '#7c3aed', '#312e81'], ['#5eead4', '#0d9488', '#134e4a'], ['#fcd34d', '#d97706', '#78350f'], ['#93c5fd', '#2563eb', '#1e3a8a']];
    function mkLevel(i) {
      var s = [], g = Math.floor(Math.random() * SEG), gw = api.diff >= 3 ? 1 : 2;
      for (var k = 0; k < SEG; k++) {
        var d = (k - g + SEG) % SEG;
        s.push(i === 0 ? 1 : d < gw ? 0 : Math.random() < RED[api.diff] + i * 0.002 ? 2 : 1);
      }
      if (i === 0) for (var q = 0; q < 2; q++) s[(8 + q) % SEG] = 0;
      return { y: i * GAP * 10 + 120, s: s, broke: 0 };
    }
    function R() { return Math.min(api.W * 0.42, 170); }
    function segAt(L) { // какой сектор этажа сейчас под мячиком (мячик спереди, угол π/2)
      var a = ((Math.PI / 2 - rot) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      return Math.floor(a / (Math.PI * 2 / SEG)) % SEG;
    }
    return {
      reset: function () {
        levels = []; for (var i = 0; i < 60; i++) levels.push(mkLevel(i));
        rot = 0; ball = { y: 40, vy: 0, sq: 0 }; camY = 0; t = 0; lastX = null; combo = 0; dead = false; deadT = 0; passed = 0; splats = []; trail = []; pal = PALS[Math.floor(Math.random() * PALS.length)];
      },
      resize: function () { }, idle: function (dt) { t += dt || 0; }, key: function (k, d) { if (d && k === 'left') rot -= 0.3; if (d && k === 'right') rot += 0.3; },
      input: function (type, d) {
        if (type === 'down') lastX = d.x;
        else if (type === 'move' && lastX != null) { rot += (d.x - lastX) * 0.012; lastX = d.x; }
        else if (type === 'up') lastX = null;
      },
      update: function (dt) {
        t += dt;
        if (dead) { deadT += dt; if (deadT > 0.9) api.gameOver(); return; }
        ball.vy += 1500 * dt; var ny = ball.y + ball.vy * dt; if (ball.sq > 0) ball.sq -= dt * 4;
        for (var i = 0; i < levels.length; i++) {
          var L = levels[i]; if (L.broke || !(ball.y + 12 <= L.y && ny + 12 > L.y)) continue;
          var s = L.s[segAt(L)];
          if (s === 0) { L.broke = 1; passed++; combo++; api.addScore(combo >= 3 ? 2 : 1); api.sound('click'); if (levels.length - i < 30) levels.push(mkLevel(levels.length)); continue; }
          if (combo >= 3) { L.broke = 2; L.bt = 0; combo = 0; passed++; api.addScore(3); api.sound('bonus'); api.fx.shake && api.fx.shake(6); api.vibrate(25); continue; }
          if (s === 2) { dead = true; api.sound('hit'); api.vibrate(80); return; }
          ny = L.y - 12; ball.vy = -540; ball.sq = 1; combo = 0; api.sound('jump');
          splats.push({ lv: i, a: Math.PI / 2 - rot, life: 1.5 });
          break;
        }
        ball.y = ny; trail.push(ball.y); if (trail.length > 8) trail.shift();
        var target = ball.y - api.H * 0.32; if (target > camY) camY += (target - camY) * Math.min(1, dt * 8);
        splats.forEach(function (s) { s.life -= dt; }); splats = splats.filter(function (s) { return s.life > 0; });
        levels.forEach(function (L) { if (L.broke === 2) L.bt += dt; });
      },
      draw: function (c) {
        var W = api.W, H = api.H, cx = W / 2, r = R(), ry = r * 0.28, ri = r * 0.24;
        var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, pal[2]); g.addColorStop(1, '#0b0a1f'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        // дальние огоньки
        for (var q = 0; q < 26; q++) { var px = (q * 137) % W, py = ((q * 251 - camY * (0.15 + (q % 3) * 0.08)) % H + H) % H; c.fillStyle = 'rgba(255,255,255,' + (0.1 + (q % 4) * 0.06) + ')'; c.beginPath(); c.arc(px, py, 1 + (q % 3) * 0.6, 0, 6.283); c.fill(); }
        var step = Math.PI * 2 / SEG, vis = [];
        levels.forEach(function (L, li) {
          var y = L.y - camY + 30; if (y < -40 || y > H + 60 || L.broke === 1) return;
          var fade = L.broke === 2 ? Math.max(0, 1 - L.bt * 2) : 1; if (fade > 0) vis.push([L, li, y, fade]);
        });
        // сектор одного типа подряд рисуется одним куском — без щелей между секторами
        function runs(L, wantFront) {
          var out = [], k0 = -1;
          for (var k = 0; k <= SEG; k++) {
            var kk = k % SEG, s2 = k < SEG ? L.s[kk] : 0, mid = kk * step + step / 2 + rot, fr = Math.sin(mid) > 0;
            var ok = k < SEG && s2 && fr === wantFront;
            if (ok && (k0 < 0 || L.s[k0] !== s2)) { if (k0 >= 0) out.push([k0, k - 1]); k0 = k; }
            else if (!ok && k0 >= 0) { out.push([k0, k - 1]); k0 = -1; }
          }
          return out;
        }
        function ring(L, y, fade, front) {
          var off = L.broke === 2 ? L.bt * 160 : 0; c.globalAlpha = fade;
          runs(L, front).forEach(function (rn) {
            var s2 = L.s[rn[0]], a0 = rn[0] * step + rot - 0.004, a1 = (rn[1] + 1) * step + rot + 0.004, mid = (a0 + a1) / 2, ox = Math.cos(mid) * off, oy = Math.sin(mid) * off * 0.3;
            var top = s2 === 2 ? '#fb7185' : pal[0], side = s2 === 2 ? '#9f1239' : pal[1];
            if (front) { // боковая стенка этажа
              c.beginPath(); c.ellipse(cx + ox, y + oy, r, ry, 0, a0, a1); c.ellipse(cx + ox, y + oy + 12, r, ry, 0, a1, a0, true); c.closePath();
              var sg = c.createLinearGradient(cx - r, 0, cx + r, 0); sg.addColorStop(0, side); sg.addColorStop(0.5, s2 === 2 ? '#e11d48' : pal[1]); sg.addColorStop(1, side); c.fillStyle = sg; c.fill();
            }
            c.beginPath(); c.ellipse(cx + ox, y + oy, r, ry, 0, a0, a1); c.ellipse(cx + ox, y + oy, ri, ri * 0.28, 0, a1, a0, true); c.closePath();
            c.fillStyle = front ? top : side; c.fill();
            if (front) { c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(cx + ox, y + oy, r - 1, ry - 1, 0, a0, a1); c.stroke(); }
            if (s2 === 2 && front) { c.fillStyle = 'rgba(255,255,255,' + (0.15 + 0.1 * Math.sin(t * 8)) + ')'; c.beginPath(); c.ellipse(cx + ox, y + oy, r * 0.8, ry * 0.8, 0, a0 + 0.05, a1 - 0.05); c.ellipse(cx + ox, y + oy, r * 0.6, ry * 0.6, 0, a1 - 0.05, a0 + 0.05, true); c.closePath(); c.fill(); }
          });
          c.globalAlpha = 1;
        }
        vis.forEach(function (v2) { ring(v2[0], v2[2], v2[3], false); }); // задние половины — за столбом
        // столб с кольцами-полосками
        var pg = c.createLinearGradient(cx - ri, 0, cx + ri, 0); pg.addColorStop(0, '#94a3b8'); pg.addColorStop(0.35, '#f8fafc'); pg.addColorStop(1, '#64748b');
        c.fillStyle = pg; c.fillRect(cx - ri, 0, ri * 2, H);
        c.fillStyle = 'rgba(15,23,42,.12)'; for (var sy2 = -((camY * 1) % 46); sy2 < H; sy2 += 46) c.fillRect(cx - ri, sy2, ri * 2, 4);
        vis.forEach(function (v2) {
          ring(v2[0], v2[2], v2[3], true);
          splats.forEach(function (sp) { if (sp.lv !== v2[1]) return; var a = sp.a + rot; if (Math.sin(a) < 0) return; c.fillStyle = 'rgba(251,191,36,' + Math.min(0.8, sp.life) + ')'; c.beginPath(); c.ellipse(cx + Math.cos(a) * r * 0.62, v2[2] + Math.sin(a) * ry * 0.62, 13, 4.5, 0, 0, 6.283); c.fill(); });
        });
        // след мячика
        trail.forEach(function (p2, i) { c.fillStyle = (combo >= 3 ? 'rgba(249,115,22,' : 'rgba(251,191,36,') + (i / trail.length * 0.35) + ')'; c.beginPath(); c.arc(cx, p2 - camY + 30 - 12 + ry * 0.62, 4 + i / trail.length * 7, 0, 6.283); c.fill(); });
        // мячик спереди
        var by = ball.y - camY + 30 - 12, bx = cx, sq = Math.max(0, ball.sq);
        var bz = ry * 0.62; // спереди кольца
        c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(bx, by + bz + 14, 12, 4, 0, 0, 6.283); c.fill();
        var bg2 = c.createRadialGradient(bx - 4, by + bz - 5, 2, bx, by + bz, 13); bg2.addColorStop(0, '#fef3c7'); bg2.addColorStop(1, combo >= 3 ? '#f97316' : '#f59e0b');
        c.fillStyle = bg2; c.beginPath(); c.ellipse(bx, by + bz, 12 * (1 + sq * 0.25), 12 * (1 - sq * 0.25), 0, 0, 6.283); c.fill();
        if (combo >= 3) { c.strokeStyle = 'rgba(249,115,22,.6)'; c.lineWidth = 3; c.beginPath(); c.arc(bx, by + bz, 18 + Math.sin(t * 20) * 2, 0, 6.283); c.stroke(); }
        if (dead) { c.fillStyle = 'rgba(244,63,94,' + Math.min(0.4, deadT) + ')'; c.fillRect(0, 0, W, H); }
        c.fillStyle = '#fff'; c.font = '800 15px system-ui'; c.textAlign = 'center'; c.fillText('Этажей: ' + passed + (combo >= 3 ? '  🔥 ПРОБОЙ!' : ''), W / 2, 30);
        for (var cb = 0; cb < 3; cb++) { c.fillStyle = cb < combo ? '#f97316' : 'rgba(255,255,255,.2)'; window.GBK.rr(c, W / 2 - 39 + cb * 27, 42, 24, 6, 3); c.fill(); }
      }
    };
  }
};
