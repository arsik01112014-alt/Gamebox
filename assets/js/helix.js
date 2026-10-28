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
    function segAt(L) { // какой сектор этажа сейчас под мячиком (мячик спереди, угол 0)
      var a = ((-rot) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
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
          splats.push({ lv: i, a: -rot, life: 1.5 });
          break;
        }
        ball.y = ny; trail.push(ball.y); if (trail.length > 8) trail.shift();
        var target = ball.y - api.H * 0.32; if (target > camY) camY += (target - camY) * Math.min(1, dt * 8);
        splats.forEach(function (s) { s.life -= dt; }); splats = splats.filter(function (s) { return s.life > 0; });
        levels.forEach(function (L) { if (L.broke === 2) L.bt += dt; });
      },
      draw: function (c) {
        var W = api.W, H = api.H, cx = W / 2, r = R(), ri = r * 0.22, T = 0.34, TH = 14, step = Math.PI * 2 / SEG, rb = (r + ri) / 2;
        var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, pal[2]); g.addColorStop(1, '#0b0a1f'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        for (var q = 0; q < 26; q++) { var px = (q * 137) % W, py = ((q * 251 - camY * (0.15 + (q % 3) * 0.08)) % H + H) % H; c.fillStyle = 'rgba(255,255,255,' + (0.1 + (q % 4) * 0.06) + ')'; c.beginPath(); c.arc(px, py, 1 + (q % 3) * 0.6, 0, 6.283); c.fill(); }
        function sy(L) { return L.y - camY + 30; }
        function P(a, rr, y) { return [cx + Math.sin(a) * rr, y + Math.cos(a) * rr * T]; }
        function shade(hex, k) { return window.GBK.shade(hex, k); }
        function pole(y0, y1) { // кусок столба между y0 и y1
          if (y1 < y0) { var tt = y0; y0 = y1; y1 = tt; }
          var pg = c.createLinearGradient(cx - ri, 0, cx + ri, 0); pg.addColorStop(0, '#64748b'); pg.addColorStop(0.35, '#f1f5f9'); pg.addColorStop(1, '#475569');
          c.fillStyle = pg; c.fillRect(cx - ri, y0, ri * 2, y1 - y0);
        }
        function arcPts(a0, a1, rr, y, out) { var n = 6; for (var k = 0; k <= n; k++) { var p2 = P(a0 + (a1 - a0) * k / n, rr, y); out.push(p2); } return out; }
        function poly(pts, col) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var k = 1; k < pts.length; k++) c.lineTo(pts[k][0], pts[k][1]); c.closePath(); c.fillStyle = col; c.fill(); }
        function level(L, li, half) { // half: -1 задние сектора, 1 передние
          var y = sy(L), off = 0, drop = 0, alpha = 1;
          if (L.broke === 2) { off = L.bt * 220; drop = L.bt * L.bt * 500; alpha = Math.max(0, 1 - L.bt * 1.6); if (alpha <= 0) return; }
          c.globalAlpha = alpha;
          for (var k = 0; k < SEG; k++) {
            var sv = L.s[k]; if (!sv) continue;
            var a0 = k * step + rot - 0.012, a1 = a0 + step + 0.024, am = (a0 + a1) / 2, front = Math.cos(am) > 0;
            if ((half > 0) !== front) continue;
            var ox = Math.sin(am) * off, oy = drop;
            c.save(); c.translate(ox, oy);
            var base = sv === 2 ? '#f43f5e' : pal[0], light = 0.08 * Math.cos(am - 0.6);
            if (front) { // наружная стенка и торцы у щелей
              var wall = arcPts(a0, a1, r, y, []), wall2 = arcPts(a1, a0, r, y + TH, []);
              poly(wall.concat(wall2), shade(sv === 2 ? '#be123c' : pal[1], -0.05 + light));
              [[a0, L.s[(k + SEG - 1) % SEG] !== sv], [a1, L.s[(k + 1) % SEG] !== sv]].forEach(function (e) {
                if (!e[1] || Math.cos(e[0]) < 0) return; var o1 = P(e[0], r, y), i1 = P(e[0], ri, y);
                poly([o1, i1, [i1[0], i1[1] + TH], [o1[0], o1[1] + TH]], shade(sv === 2 ? '#9f1239' : pal[1], -0.25));
              });
            }
            var top = arcPts(a0, a1, r, y, []).concat(arcPts(a1, a0, ri, y, []));
            poly(top, front ? shade(base, light) : shade(base, -0.14 + light));
            if (front) { c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.2; c.beginPath(); var e1 = arcPts(a0, a1, r - 1, y, []); c.moveTo(e1[0][0], e1[0][1]); e1.forEach(function (pp) { c.lineTo(pp[0], pp[1]); }); c.stroke(); }
            if (sv === 2) { c.fillStyle = 'rgba(255,255,255,' + (0.12 + 0.1 * Math.sin(t * 8)) + ')'; poly(arcPts(a0 + 0.06, a1 - 0.06, r * 0.85, y, []).concat(arcPts(a1 - 0.06, a0 + 0.06, r * 0.6, y, [])), c.fillStyle); }
            c.restore();
          }
          if (half > 0) splats.forEach(function (sp) { if (sp.lv !== li || L.broke) return; var a = sp.a + rot; if (Math.cos(a) < 0.2) return; var pp = P(a, rb, y); c.fillStyle = 'rgba(251,191,36,' + Math.min(0.85, sp.life) + ')'; c.beginPath(); c.ellipse(pp[0], pp[1], 13 * Math.cos(a), 4.5, 0, 0, 6.283); c.fill(); });
          c.globalAlpha = 1;
        }
        var vis = []; levels.forEach(function (L, li) { var y = sy(L); if (y > -60 && y < H + 80 && L.broke !== 1) vis.push(li); });
        pole(0, H); // фон столба
        var by = ball.y - camY + 30 - 12, ballDrawn = false;
        function drawBall() {
          ballDrawn = true; var bpos = P(0, rb, by), sq = Math.max(0, ball.sq);
          // тень на ближайшем этаже снизу
          for (var k = 0; k < levels.length; k++) { var L = levels[k]; if (L.broke || L.y < ball.y + 12) continue; var ly = sy(L), d = ly - (by + 12); if (L.s[segAt(L)]) { var sp2 = P(0, rb, ly); c.fillStyle = 'rgba(0,0,0,' + Math.max(0.08, 0.35 - d / 400) + ')'; c.beginPath(); c.ellipse(sp2[0], sp2[1], 12 + d * 0.02, 4.5, 0, 0, 6.283); c.fill(); } break; }
          trail.forEach(function (p2, i) { var tp = P(0, rb, p2 - camY + 30 - 12); c.fillStyle = (combo >= 3 ? 'rgba(249,115,22,' : 'rgba(251,191,36,') + (i / trail.length * 0.35) + ')'; c.beginPath(); c.arc(tp[0], tp[1], 3 + i / trail.length * 7, 0, 6.283); c.fill(); });
          var bg2 = c.createRadialGradient(bpos[0] - 4, bpos[1] - 5, 2, bpos[0], bpos[1], 13); bg2.addColorStop(0, '#fff7d6'); bg2.addColorStop(1, combo >= 3 ? '#f97316' : '#f59e0b');
          c.fillStyle = bg2; c.beginPath(); c.ellipse(bpos[0], bpos[1] + sq * 3, 12 * (1 + sq * 0.25), 12 * (1 - sq * 0.25), 0, 0, 6.283); c.fill();
          if (combo >= 3) { c.strokeStyle = 'rgba(249,115,22,.6)'; c.lineWidth = 3; c.beginPath(); c.arc(bpos[0], bpos[1], 18 + Math.sin(t * 20) * 2, 0, 6.283); c.stroke(); }
        }
        // снизу вверх: нижние этажи раньше, верхние перекрывают их; мячик — между этажами
        for (var vi = vis.length - 1; vi >= 0; vi--) {
          var li = vis[vi], L = levels[li], y = sy(L);
          if (!ballDrawn && y < by + 12) drawBall();
          level(L, li, -1);
          var up = vi > 0 ? sy(levels[vis[vi - 1]]) : -10; pole(up, y); // столб над этажом закрывает его заднюю половину
          level(L, li, 1);
        }
        if (!ballDrawn) drawBall();
        if (dead) { c.fillStyle = 'rgba(244,63,94,' + Math.min(0.4, deadT) + ')'; c.fillRect(0, 0, W, H); }
        c.fillStyle = '#fff'; c.font = '800 15px system-ui'; c.textAlign = 'center'; c.fillText('Этажей: ' + passed + (combo >= 3 ? '  🔥 ПРОБОЙ!' : ''), W / 2, 30);
        for (var cb = 0; cb < 3; cb++) { c.fillStyle = cb < combo ? '#f97316' : 'rgba(255,255,255,.2)'; window.GBK.rr(c, W / 2 - 39 + cb * 27, 42, 24, 6, 3); c.fill(); }
      }
    };
  }
};
