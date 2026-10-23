/* Лабиринт: доведи шарик до выхода на время */
window.GAMES = window.GAMES || {};
window.GAMES.maze = {
  title: 'Лабиринт',
  desc: 'Найди выход быстрее',
  hint: 'Свайпни или нажми стрелку — шарик катится до ближайшей развилки. Доберись до флажка 🏁 до конца времени. Монеты дают очки, часы — время. Каждый уровень лабиринт больше.',
  d0: 'Маленький лабиринт, много времени', d1: 'Обычный', d2: 'Большой, мало времени', d3: 'Огромный, в темноте',
  colors: ['#0d9488', '#1e3a8a'],
  controls: 'dpad',
  isNew3: true,
  icon: '<svg viewBox="0 0 100 100"><defs><radialGradient id="mazeB" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="#fffbea"/><stop offset=".4" stop-color="#fde047"/><stop offset="1" stop-color="#b45309"/></radialGradient>' +
    '<radialGradient id="mazeP" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#a7f3d0"/><stop offset="1" stop-color="#2dd4bf" stop-opacity="0"/></radialGradient></defs>' +
    '<rect x="6" y="8" width="88" height="88" rx="12" fill="#000" opacity=".35"/><rect x="6" y="6" width="88" height="88" rx="12" fill="#1e293b"/><rect x="12" y="12" width="76" height="76" rx="4" fill="#1a2438"/>' +
    '<path d="M18 18h64v64H18zM18 38h24M58 18v24h14M38 38v24h24M18 62h8M82 62h-12v-10M50 82v-8" stroke="#0f5f58" stroke-width="7" fill="none" stroke-linecap="square" transform="translate(0 2)"/>' +
    '<path d="M18 18h64v64H18zM18 38h24M58 18v24h14M38 38v24h24M18 62h8M82 62h-12v-10M50 82v-8" stroke="#5eead4" stroke-width="7" fill="none" stroke-linecap="square"/>' +
    '<circle cx="72" cy="72" r="10" fill="url(#mazeP)"/><ellipse cx="29" cy="32" rx="6" ry="2.5" fill="#000" opacity=".4"/><circle cx="28" cy="28" r="6.5" fill="url(#mazeB)"/>' +
    '<path d="M68 76v-16" stroke="#e2e8f0" stroke-width="2"/><path d="M69 60h10v6h-10z" fill="#f8fafc"/><path d="M69 60h5v3h-5zM74 63h5v3h-5z" fill="#111827"/></svg>',

  create: function (api) {
    var DIFF = [{ s: 7, time: 40 }, { s: 9, time: 35 }, { s: 11, time: 30 }, { s: 12, time: 30, dark: true }];
    var D, C, R, walls, ball, exit, cs, ox, oy, level, timeLeft, t, endT, moving, items, trail, between;
    function gen() {
      // стены: для каждой клетки [верх, право, низ, лево]
      walls = []; for (var i = 0; i < C * R; i++) walls.push([1, 1, 1, 1]);
      var seen = {}, st = [0]; seen[0] = 1;
      while (st.length) {
        var cur = st[st.length - 1], x = cur % C, y = Math.floor(cur / C), nb = [];
        [[0, -1, 0, 2], [1, 0, 1, 3], [0, 1, 2, 0], [-1, 0, 3, 1]].forEach(function (d) {
          var nx = x + d[0], ny = y + d[1], k = ny * C + nx;
          if (nx >= 0 && ny >= 0 && nx < C && ny < R && !seen[k]) nb.push([k, d[2], d[3]]);
        });
        if (!nb.length) { st.pop(); continue; }
        var p = nb[Math.floor(Math.random() * nb.length)];
        walls[cur][p[1]] = 0; walls[p[0]][p[2]] = 0; seen[p[0]] = 1; st.push(p[0]);
      }
      // несколько лишних проходов, чтобы были развилки
      for (var e = 0; e < C * R / 10; e++) {
        var q = Math.floor(Math.random() * C * R), qx = q % C, qy = Math.floor(q / C);
        if (qx < C - 1) { walls[q][1] = 0; walls[q + 1][3] = 0; }
      }
    }
    function layout() {
      cs = Math.floor(Math.min((api.W - 16) / C, (api.H - 60) / R));
      ox = Math.floor((api.W - cs * C) / 2); oy = Math.floor(44 + (api.H - 50 - cs * R) / 2);
      lay = null;
    }
    function newLevel() {
      C = Math.min(16, D.s + level - 1); R = Math.min(22, Math.round(C * 1.35));
      gen(); layout();
      ball = { x: 0, y: 0, px: 0, py: 0, k: 1 };
      exit = { x: C - 1, y: R - 1 };
      items = [];
      for (var i = 0; i < 3 + level; i++) items.push({ x: Math.floor(Math.random() * C), y: Math.floor(Math.random() * R), k: Math.random() < 0.25 ? 'clock' : 'coin' });
      items = items.filter(function (it) { return !(it.x === 0 && it.y === 0) && !(it.x === exit.x && it.y === exit.y); });
      timeLeft = D.time + (level - 1) * 6 + C * R / 12; trail = [];
    }
    var lay = null, layW = 0, layH = 0;
    function rrect(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
    }
    function buildLayer() {
      if (!walls || !cs) return;
      var W = api.W, H = api.H, dpr = Math.min(2, window.devicePixelRatio || 1);
      var cv = document.createElement('canvas'); cv.width = Math.ceil(W * dpr); cv.height = Math.ceil(H * dpr);
      var c = cv.getContext('2d'); c.scale(dpr, dpr); lay = cv; layW = W; layH = H;
      var seed = 5 + C * 31 + R; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      var i, x, y;
      // фон: тёмный камень с узором
      var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1324'); g.addColorStop(1, '#050a14');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(45,212,191,.05)'; c.lineWidth = 1;
      for (x = -H; x < W; x += 18) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + H, H); c.stroke(); }
      var bw = cs * C, bh = cs * R, pad = Math.max(3, Math.min(cs * 0.28, ox - 2));
      // рама доски
      c.fillStyle = 'rgba(0,0,0,.5)'; rrect(c, ox - pad + 3, oy - pad + 6, bw + pad * 2, bh + pad * 2, 12); c.fill();
      var fr = c.createLinearGradient(0, oy - pad, 0, oy + bh + pad); fr.addColorStop(0, '#3b4a63'); fr.addColorStop(1, '#1b2436');
      c.fillStyle = fr; rrect(c, ox - pad, oy - pad, bw + pad * 2, bh + pad * 2, 12); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; rrect(c, ox - pad + 0.5, oy - pad + 0.5, bw + pad * 2 - 1, bh + pad * 2 - 1, 12); c.stroke();
      // плитка пола
      for (y = 0; y < R; y++) for (x = 0; x < C; x++) {
        var X = ox + x * cs, Y = oy + y * cs, l = 14 + ((x + y) % 2) * 3 + rnd() * 3;
        c.fillStyle = 'hsl(220,28%,' + l + '%)'; c.fillRect(X, Y, cs, cs);
        c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(X, Y, cs, 1); c.fillRect(X, Y, 1, cs);
        c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(X, Y + cs - 1, cs, 1); c.fillRect(X + cs - 1, Y, 1, cs);
        if (rnd() < 0.25) { c.strokeStyle = 'rgba(0,0,0,.18)'; c.beginPath(); var sx = X + rnd() * cs, sy = Y + rnd() * cs; c.moveTo(sx, sy); c.lineTo(sx + (rnd() - 0.5) * cs * 0.5, sy + (rnd() - 0.5) * cs * 0.5); c.stroke(); }
      }
      // стены: собираем отрезки
      var wt = Math.max(3, cs * 0.22), d = Math.max(2, wt * 0.75), segs = [];
      for (y = 0; y < R; y++) for (x = 0; x < C; x++) {
        var w = walls[y * C + x], X2 = ox + x * cs, Y2 = oy + y * cs;
        if (w[0]) segs.push([X2 - wt / 2, Y2 - wt / 2, cs + wt, wt]);
        if (w[3]) segs.push([X2 - wt / 2, Y2 - wt / 2, wt, cs + wt]);
        if (y === R - 1 && w[2]) segs.push([X2 - wt / 2, Y2 + cs - wt / 2, cs + wt, wt]);
        if (x === C - 1 && w[1]) segs.push([X2 + cs - wt / 2, Y2 - wt / 2, wt, cs + wt]);
      }
      // тень
      c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath();
      segs.forEach(function (s) { c.rect(s[0] + d * 0.5, s[1] + d * 0.9, s[2], s[3]); }); c.fill();
      // боковая грань
      c.fillStyle = '#0f5f58'; c.beginPath();
      segs.forEach(function (s) { c.rect(s[0], s[1] - d * 0.5, s[2], s[3] + d); }); c.fill();
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath();
      segs.forEach(function (s) { c.rect(s[0], s[1] + s[3] + d * 0.5 - 1, s[2], 1); }); c.fill();
      // верхняя грань
      var tg = c.createLinearGradient(0, oy, 0, oy + bh); tg.addColorStop(0, '#5eead4'); tg.addColorStop(1, '#2bb3a3');
      c.fillStyle = tg; c.beginPath();
      segs.forEach(function (s) { c.rect(s[0], s[1] - d * 0.5, s[2], s[3] - d * 0.15); }); c.fill();
      // фактура камня и швы
      c.save(); c.beginPath(); segs.forEach(function (s) { c.rect(s[0], s[1] - d * 0.5, s[2], s[3] - d * 0.15); }); c.clip();
      for (i = 0; i < C * R * 6; i++) {
        c.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.18)' : 'rgba(6,78,59,.25)';
        c.fillRect(ox - wt + rnd() * (bw + wt * 2), oy - wt + rnd() * (bh + wt * 2), 1.2, 1.2);
      }
      c.strokeStyle = 'rgba(15,95,88,.55)'; c.lineWidth = 1; c.beginPath();
      segs.forEach(function (s) {
        var horiz = s[2] > s[3], n, k;
        if (horiz) { n = Math.max(1, Math.round(s[2] / (cs * 0.5))); for (k = 1; k < n; k++) { c.moveTo(s[0] + k * s[2] / n, s[1] - d * 0.5); c.lineTo(s[0] + k * s[2] / n, s[1] + s[3]); } }
        else { n = Math.max(1, Math.round(s[3] / (cs * 0.5))); for (k = 1; k < n; k++) { c.moveTo(s[0], s[1] - d * 0.5 + k * s[3] / n); c.lineTo(s[0] + s[2], s[1] - d * 0.5 + k * s[3] / n); } }
      });
      c.stroke(); c.restore();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath();
      segs.forEach(function (s) { c.rect(s[0], s[1] - d * 0.5, s[2], 1); }); c.fill();
      // виньетка
      var vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    }
    var DIRS = { up: [0, -1, 0], right: [1, 0, 1], down: [0, 1, 2], left: [-1, 0, 3] };
    function roll(dir) {
      if (moving || endT > 0 || between > 0) return;
      var d = DIRS[dir]; if (!d) return;
      var x = ball.x, y = ball.y, path = [];
      while (!walls[y * C + x][d[2]]) {
        x += d[0]; y += d[1]; path.push([x, y]);
        var w = walls[y * C + x], open = 0; for (var k = 0; k < 4; k++) if (!w[k]) open++;
        if (open !== 2 || (x === exit.x && y === exit.y)) break;
        // поворот коридора — остановка
        if (w[d[2]]) break;
      }
      if (!path.length) { api.tone(150, 0.04, 'square', 0.03); return; }
      moving = { path: path, i: 0, k: 0 };
      api.tone(400, 0.04, 'triangle', 0.04);
    }
    return {
      reset: function () { D = DIFF[api.diff]; level = 1; t = 0; endT = 0; moving = null; between = 0; newLevel(); },
      resize: layout,
      idle: function (dt) { t += dt; },
      key: function (k, d) { if (d) roll(k); },
      input: function (type, d) { if (type === 'swipe') roll(d.dir); },
      update: function (dt) {
        t += dt;
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (between > 0) { between -= dt; if (between <= 0) { level++; newLevel(); } return; }
        timeLeft -= dt;
        if (timeLeft <= 0) { timeLeft = 0; endT = 1.2; api.sound('over'); return; }
        if (moving) {
          moving.k += dt * 16;
          while (moving && moving.k >= 1) {
            moving.k -= 1;
            var p = moving.path[moving.i];
            trail.push({ x: ball.x, y: ball.y, life: 1 });
            ball.x = p[0]; ball.y = p[1]; moving.i++;
            for (var j = items.length - 1; j >= 0; j--) if (items[j].x === ball.x && items[j].y === ball.y) {
              var it = items.splice(j, 1)[0];
              if (it.k === 'coin') { api.addScore(20); api.sound('coin'); } else { timeLeft += 5; api.sound('bonus'); api.fx.text(ox + (ball.x + 0.5) * cs, oy + ball.y * cs, '+5s', '#7dd3fc', 15); }
            }
            if (ball.x === exit.x && ball.y === exit.y) {
              moving = null;
              var pts = 100 * level + Math.round(timeLeft) * 10;
              api.addScore(pts); api.sound('win'); api.fx.confetti(60); api.toast(api.t('maze.level', level + 1));
              between = 1.3; return;
            }
            if (moving.i >= moving.path.length) moving = null;
          }
        }
        trail.forEach(function (q) { q.life -= dt * 0.8; });
        trail = trail.filter(function (q) { return q.life > 0; });
      },
      draw: function (c) {
        var W = api.W, H = api.H, Q = api.quality;
        if (!lay || layW !== W || layH !== H) buildLayer();
        c.save();
        c.drawImage(lay, 0, 0, W, H);
        var bxp = ox + (ball.x + 0.5) * cs, byp = oy + (ball.y + 0.5) * cs;
        // след
        if (Q > 0) c.globalCompositeOperation = 'lighter';
        trail.forEach(function (q) {
          c.fillStyle = 'rgba(250,204,21,' + q.life * 0.35 + ')';
          c.beginPath(); c.arc(ox + (q.x + 0.5) * cs, oy + (q.y + 0.5) * cs, cs * (0.08 + q.life * 0.1), 0, 6.283); c.fill();
        });
        c.globalCompositeOperation = 'source-over';
        // предметы
        items.forEach(function (it, n) {
          var ix = ox + (it.x + 0.5) * cs, iy = oy + (it.y + 0.5) * cs, bob = Math.sin(t * 3 + n) * cs * 0.04;
          c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(ix + cs * 0.03, iy + cs * 0.24, cs * 0.17, cs * 0.05, 0, 0, 6.283); c.fill();
          if (it.k === 'coin') {
            var rr = cs * 0.2, sx = Math.max(0.15, Math.abs(Math.cos(t * 2.4 + n * 0.9))), cy = iy + bob - cs * 0.02;
            c.save(); c.translate(ix, cy); c.scale(sx, 1);
            c.fillStyle = '#a16207'; c.beginPath(); c.arc(cs * 0.03, 0, rr, 0, 6.283); c.fill();
            var cg = c.createRadialGradient(-rr * 0.35, -rr * 0.4, 1, 0, 0, rr); cg.addColorStop(0, '#fef9c3'); cg.addColorStop(0.5, '#facc15'); cg.addColorStop(1, '#ca8a04');
            c.fillStyle = cg; c.beginPath(); c.arc(0, 0, rr, 0, 6.283); c.fill();
            c.strokeStyle = 'rgba(161,98,7,.8)'; c.lineWidth = Math.max(1, rr * 0.12); c.beginPath(); c.arc(0, 0, rr * 0.7, 0, 6.283); c.stroke();
            c.fillStyle = '#a16207'; c.beginPath();
            for (var s = 0; s < 10; s++) { var ang = -Math.PI / 2 + s * Math.PI / 5, rad = s % 2 ? rr * 0.2 : rr * 0.45; c.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad); }
            c.fill(); c.restore();
            if (Q > 0 && Math.sin(t * 2.4 + n * 0.9) > 0.92) {
              c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath();
              var gx = ix - rr * 0.4, gy = cy - rr * 0.5, gs = rr * 0.5;
              c.moveTo(gx, gy - gs); c.lineTo(gx + gs * 0.18, gy - gs * 0.18); c.lineTo(gx + gs, gy); c.lineTo(gx + gs * 0.18, gy + gs * 0.18);
              c.lineTo(gx, gy + gs); c.lineTo(gx - gs * 0.18, gy + gs * 0.18); c.lineTo(gx - gs, gy); c.lineTo(gx - gs * 0.18, gy - gs * 0.18); c.fill();
            }
          } else {
            var cr = cs * 0.2, cx = ix, cyy = iy + bob, wob = Math.sin(t * 18) * (Math.sin(t * 1.5 + n) > 0.7 ? 0.12 : 0);
            c.save(); c.translate(cx, cyy); c.rotate(wob);
            c.fillStyle = '#0369a1';
            c.beginPath(); c.arc(-cr * 0.72, -cr * 0.8, cr * 0.42, 0, 6.283); c.fill();
            c.beginPath(); c.arc(cr * 0.72, -cr * 0.8, cr * 0.42, 0, 6.283); c.fill();
            c.strokeStyle = '#0c4a6e'; c.lineWidth = Math.max(1, cr * 0.14);
            c.beginPath(); c.moveTo(-cr * 0.55, cr * 0.8); c.lineTo(-cr * 0.85, cr * 1.15); c.moveTo(cr * 0.55, cr * 0.8); c.lineTo(cr * 0.85, cr * 1.15); c.stroke();
            var kg = c.createLinearGradient(0, -cr, 0, cr); kg.addColorStop(0, '#7dd3fc'); kg.addColorStop(1, '#0284c7');
            c.fillStyle = kg; c.beginPath(); c.arc(0, 0, cr, 0, 6.283); c.fill();
            c.fillStyle = '#f0f9ff'; c.beginPath(); c.arc(0, 0, cr * 0.76, 0, 6.283); c.fill();
            c.fillStyle = '#0c4a6e';
            for (var tk = 0; tk < 12; tk += 3) c.fillRect(Math.cos(tk * Math.PI / 6) * cr * 0.6 - 0.75, Math.sin(tk * Math.PI / 6) * cr * 0.6 - 0.75, 1.5, 1.5);
            c.strokeStyle = '#0c4a6e'; c.lineCap = 'round'; c.lineWidth = Math.max(1, cr * 0.13);
            var ha = t * 0.7, ma = t * 4;
            c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(ha) * cr * 0.38, -Math.cos(ha) * cr * 0.38);
            c.moveTo(0, 0); c.lineTo(Math.sin(ma) * cr * 0.58, -Math.cos(ma) * cr * 0.58); c.stroke();
            c.fillStyle = '#ef4444'; c.beginPath(); c.arc(0, 0, cr * 0.1, 0, 6.283); c.fill();
            c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-cr * 0.35, -cr * 0.45, cr * 0.25, cr * 0.12, -0.6, 0, 6.283); c.fill();
            c.lineCap = 'butt'; c.restore();
          }
        });
        // выход: портал + флаг
        var ex = ox + (exit.x + 0.5) * cs, ey = oy + (exit.y + 0.5) * cs, pr = cs * 0.42, pulse = 1 + Math.sin(t * 4) * 0.06 + (between > 0 ? 0.3 : 0);
        var pg = c.createRadialGradient(ex, ey, 0, ex, ey, pr * 1.3 * pulse);
        pg.addColorStop(0, 'rgba(167,243,208,.85)'); pg.addColorStop(0.45, 'rgba(45,212,191,.45)'); pg.addColorStop(1, 'rgba(45,212,191,0)');
        c.fillStyle = pg; c.beginPath(); c.arc(ex, ey, pr * 1.3 * pulse, 0, 6.283); c.fill();
        c.lineWidth = Math.max(1.2, cs * 0.05);
        for (var ring = 0; ring < 2; ring++) {
          c.strokeStyle = ring ? 'rgba(255,255,255,.75)' : 'rgba(153,246,228,.9)';
          var rr2 = pr * (ring ? 0.55 : 0.85), rot = t * (ring ? -3 : 2);
          for (var a = 0; a < 3; a++) { c.beginPath(); c.arc(ex, ey, rr2, rot + a * 2.094, rot + a * 2.094 + 1.3); c.stroke(); }
        }
        var fx0 = ex - cs * 0.12, fy0 = ey - cs * 0.36, fw = cs * 0.36, fh = cs * 0.24;
        c.fillStyle = '#e2e8f0'; c.fillRect(fx0 - 1, fy0, Math.max(1.5, cs * 0.05), cs * 0.62);
        c.fillStyle = '#facc15'; c.beginPath(); c.arc(fx0, fy0, Math.max(1.5, cs * 0.045), 0, 6.283); c.fill();
        var nCols = 4, nRows = 2;
        for (var fc = 0; fc < nCols; fc++) for (var frw = 0; frw < nRows; frw++) {
          var u0 = fc / nCols, u1 = (fc + 1) / nCols;
          var w0 = Math.sin(t * 6 - u0 * 4) * fh * 0.15 * u0, w1 = Math.sin(t * 6 - u1 * 4) * fh * 0.15 * u1;
          var y0 = fy0 + frw * fh / nRows, y1 = y0 + fh / nRows;
          c.fillStyle = (fc + frw) % 2 ? '#111827' : '#f8fafc';
          c.beginPath(); c.moveTo(fx0 + u0 * fw, y0 + w0); c.lineTo(fx0 + u1 * fw, y0 + w1); c.lineTo(fx0 + u1 * fw, y1 + w1); c.lineTo(fx0 + u0 * fw, y1 + w0); c.fill();
        }
        // шарик
        var mx = bxp, my = byp, mdx = 0, mdy = 0;
        if (moving) { var nx = moving.path[moving.i]; mdx = nx[0] - ball.x; mdy = nx[1] - ball.y; mx += mdx * cs * moving.k; my += mdy * cs * moving.k; }
        if (D.dark) {
          c.save(); c.fillStyle = 'rgba(0,0,0,.92)'; c.beginPath(); c.rect(0, 0, W, H); c.arc(mx, my, cs * 3.2, 0, 6.283, true); c.fill(); c.restore();
          var gl = c.createRadialGradient(mx, my, cs, mx, my, cs * 3.2); gl.addColorStop(0, 'rgba(0,0,0,0)'); gl.addColorStop(1, 'rgba(0,0,0,.9)');
          c.fillStyle = gl; c.beginPath(); c.arc(mx, my, cs * 3.2, 0, 6.283); c.fill();
        }
        var br = cs * 0.32;
        if (moving && Q > 0) {
          var sg = c.createLinearGradient(mx - mdx * cs * 0.9, my - mdy * cs * 0.9, mx, my); sg.addColorStop(0, 'rgba(253,224,71,0)'); sg.addColorStop(1, 'rgba(253,224,71,.35)');
          c.strokeStyle = sg; c.lineWidth = br * 1.6; c.lineCap = 'round';
          c.beginPath(); c.moveTo(mx - mdx * cs * 0.9, my - mdy * cs * 0.9); c.lineTo(mx, my); c.stroke(); c.lineCap = 'butt';
        }
        c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(mx + br * 0.25, my + br * 0.75, br * 0.9, br * 0.4, 0, 0, 6.283); c.fill();
        var bg = c.createRadialGradient(mx - br * 0.35, my - br * 0.4, 1, mx, my, br);
        bg.addColorStop(0, '#fffbea'); bg.addColorStop(0.35, '#fde047'); bg.addColorStop(0.85, '#d97706'); bg.addColorStop(1, '#92400e');
        c.fillStyle = bg; c.beginPath(); c.arc(mx, my, br, 0, 6.283); c.fill();
        var sp = (mx + my) / cs * 1.6;
        c.save(); c.beginPath(); c.arc(mx, my, br * 0.92, 0, 6.283); c.clip();
        c.strokeStyle = 'rgba(194,65,12,.55)'; c.lineWidth = Math.max(1.2, br * 0.18);
        c.beginPath(); c.arc(mx + Math.cos(sp) * br * 0.3, my + Math.sin(sp) * br * 0.3, br * 0.55, sp, sp + 2.2); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = Math.max(1, br * 0.1);
        c.beginPath(); c.arc(mx - Math.cos(sp) * br * 0.25, my - Math.sin(sp) * br * 0.25, br * 0.5, sp + 3, sp + 4.6); c.stroke();
        c.restore();
        c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(mx - br * 0.38, my - br * 0.42, br * 0.22, br * 0.13, -0.7, 0, 6.283); c.fill();
        c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(mx + br * 0.4, my + br * 0.38, br * 0.1, 0, 6.283); c.fill();
        // HUD
        function pill(x, y, w, h, col) {
          c.fillStyle = 'rgba(2,6,23,.6)'; rrect(c, x, y, w, h, h / 2); c.fill();
          c.strokeStyle = col || 'rgba(45,212,191,.35)'; c.lineWidth = 1; c.stroke();
        }
        var low = timeLeft < 8;
        c.font = '800 15px system-ui, sans-serif'; c.textBaseline = 'middle';
        var ts = Math.ceil(timeLeft) + 's', tw = c.measureText(ts).width + 40;
        pill(8, 8, tw, 28, low ? 'rgba(248,113,113,.7)' : null);
        c.strokeStyle = low ? '#f87171' : '#5eead4'; c.lineWidth = 2;
        c.beginPath(); c.arc(24, 23, 7, 0, 6.283); c.moveTo(24, 23); c.lineTo(24, 19); c.moveTo(24, 23); c.lineTo(27, 24.5); c.stroke();
        c.fillStyle = low ? '#f87171' : '#e2e8f0'; c.textAlign = 'left'; c.fillText(ts, 36, 22.5);
        var st = api.t('knife.stage') + ' ' + level, sw2 = c.measureText(st).width + 24;
        pill(W - 8 - sw2, 8, sw2, 28);
        c.fillStyle = '#e2e8f0'; c.textAlign = 'center'; c.fillText(st, W - 8 - sw2 / 2, 22.5);
        c.restore();
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      }
    };
  }
};
