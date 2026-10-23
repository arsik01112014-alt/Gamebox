/* Цветной прыжок: проходи только через свой цвет */
window.GAMES = window.GAMES || {};
window.GAMES.colorjump = {
  title: 'Цветной прыжок',
  desc: 'Проскочи через свой цвет',
  hint: 'Тапай, чтобы мячик подпрыгнул. Проходить препятствия можно только через часть своего цвета. Разноцветный шар меняет цвет мячика, звёзды дают очки. Не падай вниз!',
  d0: 'Медленное вращение', d1: 'Обычная скорость', d2: 'Быстро, двойные кольца', d3: 'Очень быстро',
  colors: ['#7c3aed', '#0f172a'],
  controls: 'none',
  keyAsTap: true,
  isNew3: true,
  icon: '<svg viewBox="0 0 100 100"><defs><radialGradient id="cjBg" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#2e1065"/><stop offset="1" stop-color="#05030f"/></radialGradient>' +
    '<radialGradient id="cjBall" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#22d3ee"/><stop offset="1" stop-color="#0e7490"/></radialGradient>' +
    '<linearGradient id="cjStar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbeb"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs>' +
    '<rect x="2" y="2" width="96" height="96" rx="22" fill="url(#cjBg)"/>' +
    '<circle cx="18" cy="16" r="1.2" fill="#fff"/><circle cx="84" cy="22" r="1" fill="#c4b5fd"/><circle cx="80" cy="84" r="1.3" fill="#fff"/><circle cx="14" cy="78" r="1" fill="#a5f3fc"/><circle cx="90" cy="54" r=".8" fill="#fff"/>' +
    '<g fill="none" stroke-width="13" opacity=".25"><path d="M50 18 A32 32 0 0 1 82 50" stroke="#f43f5e"/><path d="M82 50 A32 32 0 0 1 50 82" stroke="#facc15"/><path d="M50 82 A32 32 0 0 1 18 50" stroke="#22d3ee"/><path d="M18 50 A32 32 0 0 1 50 18" stroke="#a855f7"/></g>' +
    '<g fill="none" stroke-width="8"><path d="M50 18 A32 32 0 0 1 82 50" stroke="#f43f5e"/><path d="M82 50 A32 32 0 0 1 50 82" stroke="#facc15"/><path d="M50 82 A32 32 0 0 1 18 50" stroke="#22d3ee"/><path d="M18 50 A32 32 0 0 1 50 18" stroke="#a855f7"/></g>' +
    '<circle cx="50" cy="50" r="35.5" fill="none" stroke="#fff" stroke-width="1.4" opacity=".45"/>' +
    '<circle cx="50" cy="73" r="5" fill="#22d3ee" opacity=".35"/><circle cx="50" cy="66" r="7" fill="#22d3ee" opacity=".2"/><circle cx="50" cy="62" r="13" fill="#22d3ee" opacity=".18"/>' +
    '<circle cx="50" cy="62" r="8.5" fill="url(#cjBall)"/><ellipse cx="47" cy="58.5" rx="2.6" ry="1.5" fill="#fff" opacity=".85"/>' +
    '<path d="M50 32 l3 7 7.5 .8 -5.6 5 1.6 7.4 -6.5 -3.8 -6.5 3.8 1.6 -7.4 -5.6 -5 7.5 -.8z" fill="url(#cjStar)" stroke="#b45309" stroke-width="1"/></svg>',

  create: function (api) {
    var COL = ['#f43f5e', '#facc15', '#22d3ee', '#a855f7'];
    var DIFF = [{ sp: 0.8, gap: 330 }, { sp: 1.1, gap: 300 }, { sp: 1.4, gap: 280 }, { sp: 1.75, gap: 260 }];
    var D, ball, obs, cam, t, dead, deadT, nextY, started, parts, R;
    function rnd(a, b) { return a + Math.random() * (b - a); }
    var DARK = ['#9f1239', '#a16207', '#0e7490', '#6b21a8'];
    var bg, bgW, bgH, stars1, stars2, glows, glowW, glowY, twk = [], trail = [];
    function dprq() { return Math.min(2, window.devicePixelRatio || 1); }
    function mk(w, h) { var cv = document.createElement('canvas'), d = dprq(); cv.width = Math.max(1, Math.round(w * d)); cv.height = Math.max(1, Math.round(h * d)); var g = cv.getContext('2d'); g.scale(d, d); return { cv: cv, g: g }; }
    function rr(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else { c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); } }
    function starPath(c, r1, r2) { c.beginPath(); for (var s = 0; s < 10; s++) { var r = s % 2 ? r2 : r1, a = s * Math.PI / 5 - Math.PI / 2; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); }
    function glowSprite(col) {
      var o = mk(64, 64), g = o.g, gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, col); gr.addColorStop(0.25, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = 0.55; g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return o.cv;
    }
    function starLayer(W, H, n, big) {
      var o = mk(W, H), g = o.g;
      for (var i = 0; i < n; i++) {
        var x = Math.random() * W, y = Math.random() * H, r = big ? rnd(0.8, 1.7) : rnd(0.3, 0.9);
        g.globalAlpha = big ? rnd(0.5, 1) : rnd(0.25, 0.7);
        g.fillStyle = Math.random() < 0.2 ? '#c4b5fd' : Math.random() < 0.2 ? '#a5f3fc' : '#fff';
        g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
      }
      return o.cv;
    }
    function buildBg() {
      var W = api.W, H = api.H; bgW = W; bgH = H;
      var o = mk(W, H), g = o.g, gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#05030f'); gr.addColorStop(0.45, '#140a33'); gr.addColorStop(0.8, '#0b1438'); gr.addColorStop(1, '#060a1c');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      var neb = [[W * 0.2, H * 0.25, W * 0.7, 'rgba(168,85,247,.22)'], [W * 0.85, H * 0.6, W * 0.65, 'rgba(34,211,238,.13)'], [W * 0.3, H * 0.85, W * 0.6, 'rgba(244,63,94,.12)'], [W * 0.7, H * 0.1, W * 0.4, 'rgba(59,130,246,.15)']];
      neb.forEach(function (n) { var r = g.createRadialGradient(n[0], n[1], 0, n[0], n[1], n[2]); r.addColorStop(0, n[3]); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, W, H); });
      var v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
      bg = o.cv;
      stars1 = starLayer(W, H, Math.round(W * H / 1400), false);
      stars2 = starLayer(W, H, Math.round(W * H / 6000), true);
      glows = COL.map(glowSprite); glowW = glowSprite('rgba(255,255,255,.9)'); glowY = glowSprite('#fde047');
      twk = []; for (var i = 0; i < (api.quality > 0 ? 10 : 4); i++) twk.push({ x: Math.random() * W, y: Math.random() * H, s: rnd(1, 3), p: rnd(0, 6) });
    }
    function ringDraw(c, cx, cy, r, a0, shift) {
      var q = api.quality, k, a1, a2, HP = Math.PI / 2;
      for (k = 0; k < 4; k++) {
        var ci = (k + shift) % 4; a1 = a0 + k * HP; a2 = a1 + HP;
        if (q > 0) { c.globalAlpha = 0.18; c.strokeStyle = COL[ci]; c.lineWidth = 30; c.beginPath(); c.arc(cx, cy, r, a1, a2); c.stroke(); c.globalAlpha = 1; }
        c.strokeStyle = DARK[ci]; c.lineWidth = 17; c.beginPath(); c.arc(cx, cy, r, a1, a2); c.stroke();
        c.strokeStyle = COL[ci]; c.lineWidth = 13; c.beginPath(); c.arc(cx, cy, r + 0.5, a1, a2); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.42)'; c.lineWidth = 2.5; c.beginPath(); c.arc(cx, cy, r + 4, a1 + 0.04, a2 - 0.04); c.stroke();
      }
      c.strokeStyle = 'rgba(5,3,15,.55)'; c.lineWidth = 2;
      for (k = 0; k < 4; k++) { a1 = a0 + k * HP; c.beginPath(); c.moveTo(cx + Math.cos(a1) * (r - 9), cy + Math.sin(a1) * (r - 9)); c.lineTo(cx + Math.cos(a1) * (r + 9), cy + Math.sin(a1) * (r + 9)); c.stroke(); }
    }
    function addObs(y) {
      var k = obs.length, r = Math.random(), sp = D.sp * (1 + Math.min(1, k / 30)) * (Math.random() < 0.5 ? 1 : -1);
      var type = k < 2 ? 'ring' : r < 0.45 ? 'ring' : r < 0.65 && api.diff >= 1 ? 'double' : r < 0.85 ? 'bar' : 'cross';
      var o = { type: type, y: y, a: rnd(0, 6.28), sp: sp, r: Math.min(api.W * 0.34, 120), star: true, sw: true, passed: false };
      obs.push(o);
    }
    function colorAt(o, ang, rr) {
      var a = ((ang - o.a) % 6.283 + 6.283) % 6.283;
      return Math.floor(a / (Math.PI / 2)) % 4;
    }
    function burst(x, y, c, n) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.28, v = rnd(60, 280); parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rnd(0.4, 1), c: c }); } }
    function die() {
      if (dead) return;
      dead = true; deadT = 1.2; api.sound('hit'); api.vibrate(200); api.fx.shake(8);
      for (var i = 0; i < 4; i++) burst(api.W / 2, ball.y - cam, COL[i], 10);
    }
    function check(o) {
      var cx = api.W / 2, by = ball.y, dy = by - o.y, bc = ball.c;
      if (o.type === 'ring' || o.type === 'double') {
        var rings = o.type === 'double' ? [o.r, o.r * 0.72] : [o.r];
        for (var i = 0; i < rings.length; i++) {
          var rr = rings[i], th = 10, d = Math.abs(dy);
          // мяч пересекает кольцо сверху или снизу (по вертикальной оси)
          if (Math.abs(d - rr) < th + R) {
            var ang = dy < 0 ? -Math.PI / 2 : Math.PI / 2, a2 = i === 1 ? -o.a * 2 : o.a;
            var cc = colorAt({ a: a2 }, ang); if (i === 1) cc = (cc + 2) % 4;
            if (cc !== bc) die();
          }
        }
      } else if (o.type === 'bar') {
        if (Math.abs(dy) < 8 + R) {
          var w = api.W / 4, off = ((o.a * 60) % api.W + api.W) % api.W;
          var idx = Math.floor((((cx - off) % api.W) + api.W) % api.W / w) % 4;
          if (idx !== bc) die();
        }
      } else if (o.type === 'cross') {
        // крест из 4 лучей вокруг точки справа/слева от центра
        var px = cx - o.r * 0.55;
        for (var k = 0; k < 4; k++) {
          var aa = o.a + k * Math.PI / 2, ex = px + Math.cos(aa) * o.r * 0.9, ey = o.y + Math.sin(aa) * o.r * 0.9;
          var vx = ex - px, vy = ey - o.y, l2 = vx * vx + vy * vy, tt = Math.max(0, Math.min(1, ((cx - px) * vx + (by - o.y) * vy) / l2));
          var qx = px + vx * tt - cx, qy = o.y + vy * tt - by;
          if (qx * qx + qy * qy < (R + 7) * (R + 7) && k !== bc) die();
        }
      }
    }
    return {
      reset: function () {
        D = DIFF[api.diff]; R = 9; t = 0; dead = false; deadT = 0; started = false; parts = [];
        ball = { y: api.H * 0.75, vy: 0, c: Math.floor(Math.random() * 4) };
        cam = 0; obs = []; nextY = api.H * 0.35; trail = []; if (!bg || bgW !== api.W || bgH !== api.H) buildBg();
        for (var i = 0; i < 6; i++) { addObs(nextY); nextY -= D.gap; }
      },
      idle: function (dt) { t += dt; obs.forEach(function (o) { o.a += o.sp * dt; }); },
      input: function (type) {
        if (type !== 'down' || dead) return;
        started = true; ball.vy = -430; api.tone(600, 0.05, 'sine', 0.06);
      },
      key: function () { },
      resize: function () { buildBg(); },
      update: function (dt) {
        t += dt;
        parts = parts.filter(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 400 * dt; p.life -= dt; return p.life > 0; });
        obs.forEach(function (o) { o.a += o.sp * dt; });
        if (dead) { deadT -= dt; if (deadT <= 0) api.gameOver(); return; }
        if (!started) return;
        ball.vy += 1150 * dt; ball.y += ball.vy * dt;
        trail.push(ball.y); if (trail.length > 10) trail.shift();
        if (ball.y - cam < api.H * 0.45) cam = ball.y - api.H * 0.45;
        if (ball.y - cam > api.H + 20) { die(); return; }
        for (var i = 0; i < obs.length; i++) {
          var o = obs[i];
          check(o); if (dead) return;
          if (o.star && Math.abs(ball.y - o.y) < 16) { o.star = false; api.addScore(1); api.sound('coin'); api.fx.text(api.W / 2, o.y - cam - 20, '+1', '#fff', 16); }
          var swY = o.y - D.gap / 2;
          if (o.sw && Math.abs(ball.y - swY) < 16) {
            o.sw = false; var nc; do { nc = Math.floor(Math.random() * 4); } while (nc === ball.c); ball.c = nc;
            api.sound('bonus'); burst(api.W / 2, swY - cam, COL[nc], 12);
          }
        }
        while (obs.length && obs[0].y - cam > api.H + 200) obs.shift();
        while (obs[obs.length - 1].y - cam > -400) { addObs(nextY); nextY -= D.gap; }
      },
      draw: function (c) {
        var W = api.W, H = api.H, cx = W / 2, q = api.quality, k, m;
        if (!bg || bgW !== W || bgH !== H) buildBg();
        c.drawImage(bg, 0, 0, W, H);
        // parallax star layers
        var o1 = ((cam * -0.12) % H + H) % H, o2 = ((cam * -0.3) % H + H) % H;
        c.drawImage(stars1, 0, o1 - H, W, H); c.drawImage(stars1, 0, o1, W, H);
        if (q > 0) { c.drawImage(stars2, 0, o2 - H, W, H); c.drawImage(stars2, 0, o2, W, H); }
        // twinkles
        for (k = 0; k < twk.length; k++) {
          var tw = twk[k], ty = ((tw.y - cam * 0.3) % H + H) % H, al = 0.35 + 0.65 * Math.abs(Math.sin(t * tw.s + tw.p));
          c.globalAlpha = al; c.drawImage(glowW, tw.x - 7, ty - 7, 14, 14);
          c.fillStyle = '#fff'; c.fillRect(tw.x - 0.6, ty - 3.5, 1.2, 7); c.fillRect(tw.x - 3.5, ty - 0.6, 7, 1.2);
        }
        c.globalAlpha = 1;
        c.save(); c.translate(0, -cam);
        obs.forEach(function (o) {
          if (o.y - cam < -200 || o.y - cam > H + 200) return;
          c.lineCap = 'butt';
          if (o.type === 'ring' || o.type === 'double') {
            ringDraw(c, cx, o.y, o.r, o.a, 0);
            if (o.type === 'double') ringDraw(c, cx, o.y, o.r * 0.72, -o.a * 2, 2);
          } else if (o.type === 'bar') {
            var w = W / 4, off = ((o.a * 60) % W + W) % W, j, bx;
            if (q > 0) { c.globalAlpha = 0.22; for (j = -1; j < 5; j++) { c.fillStyle = COL[((j % 4) + 4) % 4]; c.fillRect(off + j * w - W, o.y - 15, w, 30); c.fillRect(off + j * w, o.y - 15, w, 30); } c.globalAlpha = 1; }
            for (j = -1; j < 5; j++) {
              var ci = ((j % 4) + 4) % 4;
              for (var rep = 0; rep < 2; rep++) {
                bx = off + j * w - (rep ? 0 : W);
                if (bx > W || bx + w < 0) continue;
                c.fillStyle = COL[ci]; rr(c, bx + 1.5, o.y - 8, w - 3, 16, 6); c.fill();
                c.fillStyle = 'rgba(255,255,255,.35)'; rr(c, bx + 5, o.y - 6, w - 10, 4, 2); c.fill();
                c.fillStyle = DARK[ci]; c.fillRect(bx + 4, o.y + 4, w - 8, 3);
              }
            }
          } else {
            var px = cx - o.r * 0.55, L = o.r * 0.9;
            c.lineCap = 'round';
            for (m = 0; m < 4; m++) {
              var aa = o.a + m * Math.PI / 2, ex = px + Math.cos(aa) * L, ey = o.y + Math.sin(aa) * L;
              if (q > 0) { c.globalAlpha = 0.25; c.strokeStyle = COL[m]; c.lineWidth = 26; c.beginPath(); c.moveTo(px, o.y); c.lineTo(ex, ey); c.stroke(); c.globalAlpha = 1; }
              c.strokeStyle = DARK[m]; c.lineWidth = 16; c.beginPath(); c.moveTo(px, o.y); c.lineTo(ex, ey); c.stroke();
              c.strokeStyle = COL[m]; c.lineWidth = 12; c.beginPath(); c.moveTo(px, o.y); c.lineTo(ex, ey); c.stroke();
              c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 3; c.beginPath(); c.moveTo(px + Math.cos(aa) * 8 - Math.sin(aa) * 2.5, o.y + Math.sin(aa) * 8 + Math.cos(aa) * 2.5); c.lineTo(ex - Math.cos(aa) * 4 - Math.sin(aa) * 2.5, ey - Math.sin(aa) * 4 + Math.cos(aa) * 2.5); c.stroke();
            }
            var hg = c.createRadialGradient(px - 3, o.y - 3, 1, px, o.y, 11); hg.addColorStop(0, '#fff'); hg.addColorStop(1, '#64748b');
            c.fillStyle = hg; c.beginPath(); c.arc(px, o.y, 10, 0, 6.283); c.fill();
            c.fillStyle = '#1e293b'; c.beginPath(); c.arc(px, o.y, 3.5, 0, 6.283); c.fill();
          }
          if (o.star) {
            var pul = 1 + Math.sin(t * 4 + o.y) * 0.08, rot = Math.sin(t * 3) * 0.2;
            if (q > 0) c.drawImage(glowY, cx - 30, o.y - 30, 60, 60);
            c.save(); c.translate(cx, o.y); c.rotate(rot); c.scale(pul, pul);
            starPath(c, 14, 6.5); c.fillStyle = '#b45309'; c.fill();
            starPath(c, 12.5, 5.6); var sg = c.createLinearGradient(0, -12, 0, 12); sg.addColorStop(0, '#fffbeb'); sg.addColorStop(0.5, '#fde047'); sg.addColorStop(1, '#f59e0b'); c.fillStyle = sg; c.fill();
            c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.ellipse(-3, -4, 3, 1.6, -0.6, 0, 6.283); c.fill();
            c.restore();
          }
          if (o.sw) {
            var sy = o.y - D.gap / 2, sr = 12 + Math.sin(t * 5) * 0.8;
            if (q > 0) { c.globalAlpha = 0.8; c.drawImage(glowW, cx - 32, sy - 32, 64, 64); c.globalAlpha = 1; }
            c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(cx, sy, sr + 2, 0, 6.283); c.fill();
            for (m = 0; m < 4; m++) { c.fillStyle = COL[m]; c.beginPath(); c.moveTo(cx, sy); c.arc(cx, sy, sr, m * Math.PI / 2 + t * 2, (m + 1) * Math.PI / 2 + t * 2); c.fill(); }
            var og = c.createRadialGradient(cx - sr * 0.4, sy - sr * 0.4, 1, cx, sy, sr); og.addColorStop(0, 'rgba(255,255,255,.65)'); og.addColorStop(0.5, 'rgba(255,255,255,0)'); og.addColorStop(1, 'rgba(0,0,0,.3)');
            c.fillStyle = og; c.beginPath(); c.arc(cx, sy, sr, 0, 6.283); c.fill();
          }
        });
        if (!dead) {
          var bcol = COL[ball.c];
          // trail
          for (k = 0; k < trail.length; k++) {
            var f = (k + 1) / (trail.length + 1);
            c.globalAlpha = f * 0.45; c.fillStyle = bcol; c.beginPath(); c.arc(cx, trail[k], R * (0.35 + f * 0.6), 0, 6.283); c.fill();
          }
          c.globalAlpha = 1;
          if (q > 0) c.drawImage(glows[ball.c], cx - 34, ball.y - 34, 68, 68);
          var st = Math.max(-0.22, Math.min(0.22, -ball.vy / 2200));
          c.save(); c.translate(cx, ball.y); c.scale(1 - st * 0.6, 1 + st);
          var bgd = c.createRadialGradient(-R * 0.35, -R * 0.4, 1, 0, 0, R); bgd.addColorStop(0, '#fff'); bgd.addColorStop(0.35, bcol); bgd.addColorStop(1, DARK[ball.c]);
          c.fillStyle = bgd; c.beginPath(); c.arc(0, 0, R, 0, 6.283); c.fill();
          c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(-R * 0.35, -R * 0.42, R * 0.28, R * 0.16, -0.6, 0, 6.283); c.fill();
          c.restore();
        }
        c.restore();
        // particles
        if (q > 0) c.globalCompositeOperation = 'lighter';
        parts.forEach(function (p) {
          var a = Math.min(1, p.life * 2), sz = 2 + p.life * 3;
          c.globalAlpha = a;
          if (q > 0) c.drawImage(glows[COL.indexOf(p.c) < 0 ? 0 : COL.indexOf(p.c)], p.x - sz * 3, p.y - sz * 3, sz * 6, sz * 6);
          c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, sz, 0, 6.283); c.fill();
        });
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
        if (!started) {
          var pa = 0.6 + Math.sin(t * 4) * 0.25, txt = api.t('cj.tap');
          c.font = '800 16px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          var tw2 = c.measureText(txt).width + 36;
          c.fillStyle = 'rgba(15,10,40,.6)'; rr(c, cx - tw2 / 2, H * 0.9 - 18, tw2, 36, 18); c.fill();
          c.strokeStyle = 'rgba(168,85,247,' + (0.4 + pa * 0.4) + ')'; c.lineWidth = 1.5; c.stroke();
          c.fillStyle = 'rgba(255,255,255,' + (0.7 + pa * 0.3) + ')'; c.fillText(txt, cx, H * 0.9 + 1);
          c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        }
      }
    };
  }
};
