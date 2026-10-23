/* Баскетбол: бросай мяч в кольцо свайпом */
window.GAMES = window.GAMES || {};
window.GAMES.basket = {
  title: 'Баскетбол',
  desc: 'Забрось как можно больше',
  hint: 'Смахни мяч вверх в сторону кольца — чем длиннее свайп, тем сильнее бросок. Чистое попадание без касания дужки — «чисто!» и двойные очки. Каждые 5 мячей кольцо двигается, за попадание подряд +время.',
  d0: '60 секунд, кольцо стоит', d1: '45 секунд', d2: '40 секунд, кольцо двигается', d3: '30 секунд, кольцо быстрое',
  colors: ['#ea580c', '#1e293b'],
  controls: 'none',
  isNew3: true,
  icon: '<svg viewBox="0 0 100 100"><defs><radialGradient id="basketB" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fdba74"/><stop offset=".55" stop-color="#ea580c"/><stop offset="1" stop-color="#7c2d12"/></radialGradient>' +
    '<linearGradient id="basketG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eff6ff"/><stop offset="1" stop-color="#bfdbfe"/></linearGradient></defs>' +
    '<rect x="44" y="6" width="50" height="34" rx="4" fill="#94a3b8"/><rect x="47" y="9" width="44" height="28" rx="2" fill="url(#basketG)"/><path d="M52 9l8 0-10 28h-6z" fill="#fff" opacity=".6"/>' +
    '<rect x="60" y="18" width="18" height="13" fill="none" stroke="#dc2626" stroke-width="2.5"/>' +
    '<path d="M57 44 l4 16 M63 44 l2 16 M69 44 v16 M75 44 l-2 16 M81 44 l-4 16 M58 48 l20 8 M80 48 l-20 8 M60 54 h18" stroke="#f1f5f9" stroke-width="1.6" fill="none"/>' +
    '<ellipse cx="69" cy="43" rx="13" ry="3.5" fill="none" stroke="#ea580c" stroke-width="3.5"/>' +
    '<ellipse cx="34" cy="92" rx="18" ry="3.5" fill="#000" opacity=".3"/><circle cx="34" cy="68" r="20" fill="url(#basketB)"/>' +
    '<path d="M14 68 h40 M34 48 v40 M21 53 Q32 68 21 83 M47 53 Q36 68 47 83" stroke="#3b1405" stroke-width="2.2" fill="none"/><ellipse cx="27" cy="58" rx="5" ry="3" fill="#fff" opacity=".45" transform="rotate(-35 27 58)"/></svg>',

  create: function (api) {
    var DIFF = [{ time: 60, move: 0 }, { time: 45, move: 0.5 }, { time: 40, move: 1 }, { time: 30, move: 1.6 }];
    var D, ball, hoop, timeLeft, t, endT, made, streak, drag, flying, rimHit, R, G, net, msg, msgT;
    function newBall() { ball = { x: api.W / 2, y: api.H - 90, vx: 0, vy: 0, r: R, rot: 0, z: 1 }; flying = false; rimHit = false; }
    function placeHoop() {
      hoop.baseX = api.W * (0.3 + Math.random() * 0.4); hoop.x = hoop.baseX;
      hoop.y = api.H * (0.24 + Math.random() * 0.1);
    }
    var bgC = null, bgW = 0, bgH = 0, boardC = null, boardKey = '', ghosts = [];
    function mkC(w, h) {
      var dpr = Math.min(2, window.devicePixelRatio || 1), cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.ceil(w * dpr)); cv.height = Math.max(1, Math.ceil(h * dpr));
      var x = cv.getContext('2d'); x.scale(dpr, dpr); return { cv: cv, x: x };
    }
    function rrect(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
    }
    function floorTop() { return api.H * 0.64; }
    function buildBg() {
      var W = api.W, H = api.H, o = mkC(W, H), c = o.x, FT = floorTop(), i, x, y;
      bgW = W; bgH = H; bgC = o.cv;
      var seed = 11; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      var g = c.createLinearGradient(0, 0, 0, FT); g.addColorStop(0, '#060912'); g.addColorStop(0.5, '#121a31'); g.addColorStop(1, '#1d2742');
      c.fillStyle = g; c.fillRect(0, 0, W, FT);
      // ферма потолка
      var t1 = H * 0.035, t2 = H * 0.075;
      c.strokeStyle = 'rgba(148,163,184,.14)'; c.lineWidth = 1.5; c.beginPath();
      c.moveTo(0, t1); c.lineTo(W, t1); c.moveTo(0, t2); c.lineTo(W, t2);
      for (x = 0; x <= W; x += 26) { c.moveTo(x, t1); c.lineTo(x + 13, t2); c.lineTo(x + 26, t1); }
      c.stroke();
      // лучи прожекторов
      c.globalCompositeOperation = 'lighter';
      for (i = 0; i < 4; i++) {
        var bx = W * (0.125 + i * 0.25), bg = c.createLinearGradient(0, t2, 0, FT);
        bg.addColorStop(0, 'rgba(255,236,200,.10)'); bg.addColorStop(1, 'rgba(255,236,200,0)');
        c.fillStyle = bg; c.beginPath(); c.moveTo(bx - 5, t2); c.lineTo(bx + 5, t2); c.lineTo(bx + W * 0.14, FT); c.lineTo(bx - W * 0.14, FT); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
      // трибуны с толпой (боке)
      var sT = H * 0.36, sB = FT - H * 0.035;
      var sg = c.createLinearGradient(0, sT, 0, sB); sg.addColorStop(0, '#0d1326'); sg.addColorStop(1, '#1a2340');
      c.fillStyle = sg; c.fillRect(0, sT, W, sB - sT);
      var cols = ['#f87171', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa', '#34d399', '#fde68a', '#e2e8f0', '#fb923c'];
      for (var row = 0; row < 8; row++) {
        var yy = sT + 6 + row * (sB - sT - 8) / 8, rr = 2 + row * 0.42;
        c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, yy + rr * 1.6, W, 1.5);
        for (x = -4; x < W + 6; x += rr * 2.5) {
          c.globalAlpha = 0.16 + rnd() * 0.32; c.fillStyle = cols[Math.floor(rnd() * cols.length)];
          c.beginPath(); c.arc(x + rnd() * 3, yy + rnd() * 2, rr * (0.75 + rnd() * 0.5), 0, 6.283); c.fill();
          c.fillRect(x - rr * 0.8 + rnd(), yy + rr * 0.9, rr * 1.6, rr * 1.4);
        }
      }
      c.globalAlpha = 1;
      for (i = 0; i < 16; i++) {
        var px = rnd() * W, py = sT + rnd() * (sB - sT), pr = 3 + rnd() * 9;
        var bk = c.createRadialGradient(px, py, 0, px, py, pr); bk.addColorStop(0, 'rgba(255,255,255,.4)'); bk.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = bk; c.fillRect(px - pr, py - pr, pr * 2, pr * 2);
      }
      // светодиодный борт
      var lb = c.createLinearGradient(0, sB, 0, FT); lb.addColorStop(0, '#1e3a8a'); lb.addColorStop(1, '#0f1d4a');
      c.fillStyle = lb; c.fillRect(0, sB, W, FT - sB);
      for (x = 3; x < W; x += 6) for (y = sB + 3; y < FT - 2; y += 4) { c.fillStyle = rnd() < 0.4 ? 'rgba(253,186,116,.85)' : 'rgba(96,165,250,.25)'; c.fillRect(x, y, 2, 2); }
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(0, sB, W, 1);
      // паркет
      var fg = c.createLinearGradient(0, FT, 0, H); fg.addColorStop(0, '#8a4d1f'); fg.addColorStop(0.35, '#b86e33'); fg.addColorStop(1, '#d99350');
      c.fillStyle = fg; c.fillRect(0, FT, W, H - FT);
      var vx = W / 2, vy = FT - H * 0.75;
      function lx(bx2, yy2) { return vx + (bx2 - vx) * (yy2 - vy) / (H - vy); }
      var PW = W * 0.07, N = Math.ceil(W / PW) + 12;
      for (i = -N; i <= N; i++) {
        var b0 = W / 2 + i * PW, b1 = b0 + PW;
        // тон доски
        c.fillStyle = rnd() < 0.5 ? 'rgba(255,220,170,' + (rnd() * 0.08) + ')' : 'rgba(70,30,5,' + (rnd() * 0.1) + ')';
        c.beginPath(); c.moveTo(lx(b0, FT), FT); c.lineTo(lx(b1, FT), FT); c.lineTo(b1, H); c.lineTo(b0, H); c.fill();
        // текстура волокон
        for (var k = 0; k < 5; k++) {
          var ta = rnd(), tb = Math.min(1, ta + 0.1 + rnd() * 0.25), f = 0.2 + rnd() * 0.6;
          var ya = FT + (H - FT) * ta * ta, yb = FT + (H - FT) * tb * tb;
          c.strokeStyle = 'rgba(90,40,10,' + (0.08 + rnd() * 0.1) + ')'; c.lineWidth = 0.7;
          c.beginPath(); c.moveTo(lx(b0 + PW * f, ya), ya); c.lineTo(lx(b0 + PW * f, yb), yb); c.stroke();
        }
        c.strokeStyle = 'rgba(55,22,4,.32)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(lx(b0, FT), FT); c.lineTo(b0, H); c.stroke();
        // стыки досок
        for (var j = 0; j < 3; j++) {
          var tj = rnd(), yj = FT + (H - FT) * tj * tj;
          c.beginPath(); c.moveTo(lx(b0, yj), yj); c.lineTo(lx(b1, yj), yj); c.stroke();
        }
      }
      // разметка: трапеция и дуги
      var kTop = FT + (H - FT) * 0.28, kw0 = W * 0.17, kw1 = W * 0.27;
      c.fillStyle = 'rgba(185,28,28,.42)'; c.beginPath();
      c.moveTo(lx(W / 2 - kw1, kTop), kTop); c.lineTo(lx(W / 2 + kw1, kTop), kTop); c.lineTo(W / 2 + kw1, H); c.lineTo(W / 2 - kw1, H); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2.5; c.stroke();
      c.beginPath(); c.ellipse(W / 2, kTop, (lx(W / 2 + kw1, kTop) - W / 2), (H - FT) * 0.09, 0, Math.PI, 0); c.stroke();
      c.setLineDash([6, 6]); c.beginPath(); c.ellipse(W / 2, kTop, (lx(W / 2 + kw1, kTop) - W / 2), (H - FT) * 0.09, 0, 0, Math.PI); c.stroke(); c.setLineDash([]);
      c.lineWidth = 2.5; c.beginPath(); c.ellipse(W / 2, FT + (H - FT) * 0.08, W * 0.46, (H - FT) * 0.55, 0, 0.12, Math.PI - 0.12); c.stroke();
      void kw0;
      // лак: отражения прожекторов
      c.globalCompositeOperation = 'lighter';
      for (i = 0; i < 4; i++) {
        var rx = W * (0.125 + i * 0.25), rg = c.createRadialGradient(rx, FT + (H - FT) * 0.25, 0, rx, FT + (H - FT) * 0.25, W * 0.16);
        rg.addColorStop(0, 'rgba(255,235,200,.16)'); rg.addColorStop(1, 'rgba(255,235,200,0)');
        c.fillStyle = rg; c.save(); c.translate(rx, FT + (H - FT) * 0.25); c.scale(0.45, 1.6); c.translate(-rx, -(FT + (H - FT) * 0.25));
        c.fillRect(rx - W * 0.16, FT + (H - FT) * 0.25 - W * 0.16, W * 0.32, W * 0.32); c.restore();
      }
      c.globalCompositeOperation = 'source-over';
      var sh = c.createLinearGradient(0, FT, 0, FT + 22); sh.addColorStop(0, 'rgba(0,0,0,.45)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = sh; c.fillRect(0, FT, W, 22);
      // виньетка
      var vg = c.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
    }
    function buildBoard() {
      var bw = hoop.w * 1.9, bh = hoop.w * 1.2, P = 10, o = mkC(bw + P * 2, bh + P * 2 + 6), c = o.x;
      boardC = o.cv; boardKey = hoop.w;
      // тень
      c.fillStyle = 'rgba(0,0,0,.35)'; rrect(c, P + 4, P + 6, bw, bh, 5); c.fill();
      // рама
      var fr = c.createLinearGradient(0, P, 0, P + bh); fr.addColorStop(0, '#f8fafc'); fr.addColorStop(1, '#94a3b8');
      c.fillStyle = fr; rrect(c, P, P, bw, bh, 5); c.fill();
      // стекло
      var m = Math.max(3, bw * 0.035), gl = c.createLinearGradient(P, P, P + bw, P + bh);
      gl.addColorStop(0, 'rgba(219,234,254,.95)'); gl.addColorStop(0.5, 'rgba(241,245,249,.92)'); gl.addColorStop(1, 'rgba(191,219,254,.95)');
      c.fillStyle = gl; rrect(c, P + m, P + m, bw - m * 2, bh - m * 2, 3); c.fill();
      // блик
      c.save(); rrect(c, P + m, P + m, bw - m * 2, bh - m * 2, 3); c.clip();
      c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(P + bw * 0.12, P); c.lineTo(P + bw * 0.3, P); c.lineTo(P + bw * 0.08, P + bh); c.lineTo(P - bw * 0.1, P + bh); c.fill();
      c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.moveTo(P + bw * 0.36, P); c.lineTo(P + bw * 0.42, P); c.lineTo(P + bw * 0.2, P + bh); c.lineTo(P + bw * 0.14, P + bh); c.fill();
      c.restore();
      // мишень
      var hx = P + bw / 2, hy = P + bh + 4, tw = hoop.w * 0.84, th = bh * 0.5, tx = hx - tw / 2, ty = hy - bh * 0.62;
      c.strokeStyle = '#dc2626'; c.lineWidth = 3.5; c.strokeRect(tx, ty, tw, th);
      c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1; c.strokeRect(tx - 2.2, ty - 2.2, tw + 4.4, th + 4.4);
      c.strokeStyle = '#dc2626'; c.lineWidth = 3.5; c.strokeRect(P + m * 1.6, P + m * 1.6, bw - m * 3.2, bh - m * 3.2);
      // болты
      c.fillStyle = '#64748b';
      [[P + m / 2, P + m / 2], [P + bw - m / 2, P + m / 2], [P + m / 2, P + bh - m / 2], [P + bw - m / 2, P + bh - m / 2]].forEach(function (b) { c.beginPath(); c.arc(b[0], b[1], 1.6, 0, 6.283); c.fill(); });
      // кронштейн кольца
      var br = c.createLinearGradient(hx - 8, 0, hx + 8, 0); br.addColorStop(0, '#9a3412'); br.addColorStop(0.5, '#fb923c'); br.addColorStop(1, '#9a3412');
      c.fillStyle = br; c.fillRect(hx - 9, hy - 10, 18, 9);
      c.fillStyle = '#7c2d12'; c.fillRect(hx - 9, hy - 2, 18, 2);
    }
    return {
      reset: function () {
        D = DIFF[api.diff]; R = Math.min(26, api.W * 0.065); G = 1500;
        hoop = { x: api.W / 2, y: api.H * 0.28, w: R * 3.1, baseX: api.W / 2, ph: 0 };
        timeLeft = D.time; t = 0; endT = 0; made = 0; streak = 0; drag = null; net = 0; msg = ''; msgT = 0;
        newBall();
      },
      idle: function (dt) { t += dt; },
      input: function (type, d) {
        if (flying || endT > 0) return;
        if (type === 'move' && drag) { drag.cx = d.x; drag.cy = d.y; return; }
        if (type === 'down' && Math.hypot(d.x - ball.x, d.y - ball.y) < R * 3) drag = { x: d.x, y: d.y, t: t };
        else if (type === 'up' && drag) {
          var dx = d.x - drag.x, dy = d.y - drag.y;
          drag = null;
          if (dy > -30) return;
          var k = Math.min(1.6, Math.hypot(dx, dy) / 260);
          ball.vy = -900 - 520 * k; ball.vx = dx * 2.2;
          flying = true; ball.peak = false; api.sound('jump');
        }
      },
      update: function (dt) {
        t += dt; if (msgT > 0) msgT -= dt; if (net > 0) net -= dt * 3;
        if (D.move && made >= 3) { hoop.ph += dt * D.move; hoop.x = hoop.baseX + Math.sin(hoop.ph) * api.W * 0.18; }
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (!flying) { timeLeft -= dt; if (timeLeft <= 0) { timeLeft = 0; endT = 1; api.sound('over'); } return; }
        timeLeft -= dt;
        var n = 4;
        for (var i = 0; i < n; i++) {
          var h = dt / n, py = ball.y;
          ball.vy += G * h; ball.x += ball.vx * h; ball.y += ball.vy * h; ball.rot += ball.vx * h * 0.02;
          if (ball.vy > 0) ball.peak = true;
          ball.z = Math.max(0.62, ball.z - h * 0.5);
          var r = R * ball.z;
          // дужки кольца — только на спуске (мяч «за» кольцом на подъёме)
          if (ball.peak) {
            [hoop.x - hoop.w / 2, hoop.x + hoop.w / 2].forEach(function (rx) {
              var dx = ball.x - rx, dy = ball.y - hoop.y, d = Math.hypot(dx, dy);
              if (d < r + 4 && d > 0) {
                var nx = dx / d, ny = dy / d, vn = ball.vx * nx + ball.vy * ny;
                if (vn < 0) { ball.vx -= 1.6 * vn * nx; ball.vy -= 1.6 * vn * ny; rimHit = true; api.tone(200, 0.05, 'square', 0.05); }
                ball.x = rx + nx * (r + 4); ball.y = hoop.y + ny * (r + 4);
              }
            });
            if (py < hoop.y && ball.y >= hoop.y && Math.abs(ball.x - hoop.x) < hoop.w / 2 - r * 0.4) {
              var clean = !rimHit, pts = (clean ? 3 : 2) * (1 + Math.min(4, streak) * 0.5);
              pts = Math.round(pts); made++; streak++; net = 1; ball.scored = true;
              api.addScore(pts); api.sound(clean ? 'coin' : 'point'); api.vibrate(25);
              api.fx.text(hoop.x, hoop.y - 40, (clean ? api.t('bb.swish') + ' ' : '') + '+' + pts, clean ? '#fde047' : '#fff', 20);
              if (streak >= 3) { timeLeft += 2; api.fx.text(hoop.x, hoop.y - 70, '+2s', '#86efac', 16); }
              if (made % 5 === 0) { placeHoop(); api.toast(api.t('bb.move')); }
            }
          }
        }
        if (ball.y > api.H + 60 || ball.x < -80 || ball.x > api.W + 80) {
          if (!ball.scored) streak = 0;
          newBall();
        }
        if (timeLeft <= 0) { timeLeft = 0; endT = 1; api.sound('over'); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, Q = api.quality, i;
        if (!bgC || bgW !== W || bgH !== H) buildBg();
        if (!boardC || boardKey !== hoop.w) buildBoard();
        c.save();
        c.drawImage(bgC, 0, 0, W, H);
        var FT = floorTop();
        var bw = hoop.w * 1.9, bh = hoop.w * 1.2, bx = hoop.x - bw / 2, by = hoop.y - bh - 4;
        // подвес щита
        c.strokeStyle = '#334155'; c.lineWidth = 3; c.lineCap = 'round';
        c.beginPath(); c.moveTo(hoop.x - bw * 0.32, by + 2); c.lineTo(hoop.x - bw * 0.12, 0); c.moveTo(hoop.x + bw * 0.32, by + 2); c.lineTo(hoop.x + bw * 0.12, 0); c.stroke();
        c.strokeStyle = 'rgba(148,163,184,.5)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(hoop.x - bw * 0.32 + 1, by + 2); c.lineTo(hoop.x - bw * 0.12 + 1, 0); c.moveTo(hoop.x + bw * 0.32 - 1, by + 2); c.lineTo(hoop.x + bw * 0.12 - 1, 0); c.stroke();
        c.lineCap = 'butt';
        c.drawImage(boardC, bx - 10, by - 10, bw + 20, bh + 26);
        var r = R * ball.z, behind = flying && !ball.peak;
        // тень мяча на полу
        var restY = api.H - 90 + R * 0.92, zk = (ball.z - 0.62) / 0.38;
        var shY = FT + 14 + (restY - FT - 14) * Math.max(0, Math.min(1, zk)), hgt = Math.max(0, shY - ball.y - r);
        var sa = Math.max(0.08, 0.45 - hgt / 900), srx = r * (1.05 + hgt / 600);
        c.fillStyle = 'rgba(20,8,0,' + sa + ')'; c.beginPath(); c.ellipse(ball.x, shY, srx, srx * 0.28, 0, 0, 6.283); c.fill();
        // прицел
        if (drag && drag.cx !== undefined && !flying) {
          var adx = drag.cx - drag.x, ady = drag.cy - drag.y;
          if (ady < -30) {
            var kk = Math.min(1.6, Math.hypot(adx, ady) / 260), avy = -900 - 520 * kk, avx = adx * 2.2;
            for (i = 1; i <= 14; i++) {
              var tt = i * 0.045, ax = ball.x + avx * tt, ay = ball.y + avy * tt + G * tt * tt / 2;
              c.fillStyle = 'rgba(255,255,255,' + (0.85 - i * 0.05) + ')';
              c.beginPath(); c.arc(ax, ay, Math.max(1.2, 4 - i * 0.2), 0, 6.283); c.fill();
            }
            c.strokeStyle = 'rgba(253,224,71,.85)'; c.lineWidth = 3;
            c.beginPath(); c.arc(ball.x, ball.y, r + 7, -Math.PI / 2, -Math.PI / 2 + 6.283 * (kk / 1.6)); c.stroke();
          }
        }
        // след
        if (flying && Q > 0) { ghosts.push({ x: ball.x, y: ball.y, r: r }); if (ghosts.length > 6) ghosts.shift(); } else ghosts.length = 0;
        function drawBall() {
          for (var gi = 0; gi < ghosts.length - 1; gi++) {
            var gh = ghosts[gi]; c.fillStyle = 'rgba(251,146,60,' + (gi + 1) * 0.04 + ')';
            c.beginPath(); c.arc(gh.x, gh.y, gh.r * (0.7 + gi * 0.05), 0, 6.283); c.fill();
          }
          c.save(); c.translate(ball.x, ball.y);
          c.fillStyle = '#e2661d'; c.beginPath(); c.arc(0, 0, r, 0, 6.283); c.fill();
          c.save(); c.clip(); c.rotate(ball.rot);
          c.strokeStyle = '#3b1405'; c.lineWidth = Math.max(1.4, r * 0.075); c.lineCap = 'round';
          c.beginPath(); c.moveTo(-r, 0); c.lineTo(r, 0); c.moveTo(0, -r); c.lineTo(0, r); c.stroke();
          c.beginPath(); c.arc(-r * 1.35, 0, r * 0.98, -0.8, 0.8); c.stroke();
          c.beginPath(); c.arc(r * 1.35, 0, r * 0.98, Math.PI - 0.8, Math.PI + 0.8); c.stroke();
          c.restore();
          var sh2 = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.05, 0, 0, r);
          sh2.addColorStop(0, 'rgba(255,220,180,.55)'); sh2.addColorStop(0.45, 'rgba(255,170,90,0)'); sh2.addColorStop(1, 'rgba(60,15,0,.55)');
          c.fillStyle = sh2; c.beginPath(); c.arc(0, 0, r, 0, 6.283); c.fill();
          c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-r * 0.38, -r * 0.45, r * 0.22, r * 0.12, -0.6, 0, 6.283); c.fill();
          c.strokeStyle = 'rgba(40,10,0,.6)'; c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, r, 0, 6.283); c.stroke();
          c.restore();
        }
        var ry = hoop.w * 0.13, hw = hoop.w / 2;
        // задняя дужка кольца
        c.strokeStyle = '#9a3412'; c.lineWidth = 4; c.beginPath(); c.ellipse(hoop.x, hoop.y, hw, ry, 0, Math.PI, 6.283); c.stroke();
        if (behind) drawBall();
        // сетка (сетка-ромб)
        var sw = net > 0 ? Math.sin(net * 12) * 4 : 0, st = 1 + (net > 0 ? Math.sin(net * Math.PI) * 0.35 : 0);
        var K = 10, M = 5, nl = hoop.w * 0.78 * st, pts = [], back = [];
        for (var m = 0; m <= M; m++) {
          var f = m / M, wk = 1 - 0.42 * f - (net > 0 ? Math.sin(net * Math.PI) * 0.12 * Math.sin(f * Math.PI) : 0), rowP = [], rowB = [];
          for (var k = 0; k <= K; k++) {
            var a = Math.PI - k * Math.PI / K, ox2 = sw * f * (1 + 0.3 * Math.sin(k));
            rowP.push([hoop.x + Math.cos(a) * hw * wk + ox2, hoop.y + Math.sin(a) * ry * wk + nl * f]);
            rowB.push([hoop.x + Math.cos(a) * hw * wk + ox2 * 0.6, hoop.y - Math.sin(a) * ry * wk + nl * f]);
          }
          pts.push(rowP); back.push(rowB);
        }
        function mesh(P2) {
          c.beginPath();
          for (var mm = 0; mm < M; mm++) for (var kq = 0; kq < K; kq++) {
            c.moveTo(P2[mm][kq][0], P2[mm][kq][1]); c.lineTo(P2[mm + 1][kq + 1][0], P2[mm + 1][kq + 1][1]);
            c.moveTo(P2[mm][kq + 1][0], P2[mm][kq + 1][1]); c.lineTo(P2[mm + 1][kq][0], P2[mm + 1][kq][1]);
          }
          c.stroke();
        }
        c.strokeStyle = 'rgba(203,213,225,.35)'; c.lineWidth = 1; mesh(back);
        c.strokeStyle = 'rgba(248,250,252,.92)'; c.lineWidth = 1.4; mesh(pts);
        c.beginPath(); for (k = 0; k <= K; k++) { var pb = pts[M][k]; if (k) c.lineTo(pb[0], pb[1]); else c.moveTo(pb[0], pb[1]); } c.stroke();
        if (!behind) drawBall();
        // передняя дужка
        c.strokeStyle = '#c2410c'; c.lineWidth = 5; c.beginPath(); c.ellipse(hoop.x, hoop.y, hw, ry, 0, 0, Math.PI); c.stroke();
        c.strokeStyle = '#fdba74'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(hoop.x, hoop.y - 1.5, hw, ry, 0, 0.3, Math.PI - 0.3); c.stroke();
        if (net > 0 && Q > 0) {
          c.globalCompositeOperation = 'lighter';
          var gw = c.createRadialGradient(hoop.x, hoop.y, 0, hoop.x, hoop.y, hoop.w);
          gw.addColorStop(0, 'rgba(253,224,71,' + 0.45 * net + ')'); gw.addColorStop(1, 'rgba(253,224,71,0)');
          c.fillStyle = gw; c.fillRect(hoop.x - hoop.w, hoop.y - hoop.w, hoop.w * 2, hoop.w * 2);
          c.globalCompositeOperation = 'source-over';
        }
        // HUD
        function pill(x, y, w, h) {
          c.fillStyle = 'rgba(2,6,23,.55)'; rrect(c, x, y, w, h, h / 2); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1; c.stroke();
        }
        var low = timeLeft < 6;
        pill(10, 10, 80, 34);
        c.strokeStyle = low ? '#f87171' : '#e2e8f0'; c.lineWidth = 2;
        c.beginPath(); c.arc(29, 28, 8, 0, 6.283); c.stroke();
        c.beginPath(); c.moveTo(29, 28); c.lineTo(29, 23); c.moveTo(29, 28); c.lineTo(32.5, 29.5); c.moveTo(27, 18); c.lineTo(31, 18); c.stroke();
        c.fillStyle = low ? '#f87171' : '#fff'; c.font = '900 22px system-ui, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(String(Math.ceil(timeLeft)), 44, 28);
        var lab = made + (streak >= 2 ? '  🔥' + streak : '');
        c.font = '800 16px system-ui, sans-serif';
        var lw = c.measureText(lab).width + 46;
        pill(W - 10 - lw, 10, lw, 34);
        var ix = W - 10 - lw + 19, iy = 27;
        var ig = c.createRadialGradient(ix - 3, iy - 3, 1, ix, iy, 9); ig.addColorStop(0, '#fdba74'); ig.addColorStop(1, '#c2410c');
        c.fillStyle = ig; c.beginPath(); c.arc(ix, iy, 9, 0, 6.283); c.fill();
        c.strokeStyle = '#431407'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(ix - 9, iy); c.lineTo(ix + 9, iy); c.moveTo(ix, iy - 9); c.lineTo(ix, iy + 9); c.stroke();
        c.beginPath(); c.arc(ix - 12, iy, 9, -0.75, 0.75); c.stroke(); c.beginPath(); c.arc(ix + 12, iy, 9, Math.PI - 0.75, Math.PI + 0.75); c.stroke();
        c.fillStyle = '#fed7aa'; c.textAlign = 'left'; c.fillText(lab, ix + 15, iy + 1);
        if (!flying && made === 0 && t < 4) {
          c.textAlign = 'center'; c.font = '800 15px system-ui, sans-serif';
          var tw2 = c.measureText(api.t('bb.tip')).width + 28; pill(W / 2 - tw2 / 2, H - 167, tw2, 32);
          c.fillStyle = 'rgba(255,255,255,.85)'; c.fillText(api.t('bb.tip'), W / 2, H - 150);
        }
        c.restore();
        c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      }
    };
  }
};
