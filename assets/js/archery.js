/* Лук: стрельба по мишени с учётом ветра */
window.GAMES = window.GAMES || {};
window.GAMES.archery = {
  title: 'Лук',
  desc: 'Точно в яблочко',
  hint: 'Потяни пальцем назад от лучника, чтобы прицелиться и задать силу, отпусти — выстрел. Учитывай ветер ⟶ и расстояние. 10 стрел; поздние мишени движутся. Серия «десяток» даёт бонус.',
  d0: 'Слабый ветер, большая мишень', d1: 'Обычный ветер', d2: 'Сильный ветер, далеко', d3: 'Ураган и маленькая мишень',
  colors: ['#65a30d', '#b45309'],
  controls: 'none',
  isNew3: true,
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="arSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38bdf8"/><stop offset="1" stop-color="#fdf2d8"/></linearGradient>' +
    '<linearGradient id="arBow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d97706"/><stop offset="1" stop-color="#78350f"/></linearGradient></defs>' +
    '<rect x="2" y="2" width="96" height="96" rx="20" fill="url(#arSky)"/><circle cx="24" cy="22" r="8" fill="#fffbe6" opacity=".9"/>' +
    '<path d="M2 78 Q20 66 38 74 T76 70 T98 72 V98 H2z" fill="#84cc16"/><path d="M2 84 Q30 78 60 84 T98 82 V98 H2z" fill="#4d7c0f"/>' +
    '<path d="M74 70 L82 96 M70 70 L64 96" stroke="#5b2f0e" stroke-width="3.5" stroke-linecap="round"/>' +
    '<circle cx="66" cy="44" r="27" fill="#a16207"/><circle cx="65" cy="43" r="26" fill="#f8fafc"/><circle cx="65" cy="43" r="20.5" fill="#111827"/><circle cx="65" cy="43" r="15.5" fill="#2563eb"/><circle cx="65" cy="43" r="10.5" fill="#dc2626"/><circle cx="65" cy="43" r="5.5" fill="#facc15"/>' +
    '<path d="M49 30 A22 22 0 0 1 70 22" stroke="#fff" stroke-width="3" fill="none" opacity=".35"/>' +
    '<path d="M22 79 L63 46" stroke="#5b2f0e" stroke-width="3.2" stroke-linecap="round"/><path d="M62 47 l6 -6 -2 8z" fill="#cbd5e1" stroke="#475569" stroke-width="1"/>' +
    '<path d="M24 77 l-8 -1 -2 4 6 1z" fill="#f43f5e"/><path d="M24 77 l-2 8 3 2 2 -6z" fill="#be123c"/>' +
    '<path d="M8 58 Q34 52 40 90" stroke="url(#arBow)" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M8 58 L28 72 L40 90" stroke="#fff" stroke-width="1.2" fill="none" opacity=".9"/></svg>',

  create: function (api) {
    var DIFF = [{ wind: 6, dist: [0.55, 0.7], size: 1.25 }, { wind: 14, dist: [0.6, 0.8], size: 1 }, { wind: 24, dist: [0.7, 0.86], size: 0.9 }, { wind: 34, dist: [0.75, 0.9], size: 0.75 }];
    var D, arrows, shot, aim, drag, target, wind, t, endT, stuck, tens, groundY, archer, msg, msgT;
    var G = 520;
    var bg, fg, bgW, bgH, bgG, cloudSpr, clouds = [], hitT = 0, trailA = [];
    function mk(w, h) { var cv = document.createElement('canvas'), d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.max(1, Math.round(w * d)); cv.height = Math.max(1, Math.round(h * d)); var g = cv.getContext('2d'); g.scale(d, d); return { cv: cv, g: g }; }
    function rr(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else { c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); } }
    function drawArrow(c, x, y, a, k) {
      c.save(); c.translate(x, y); c.rotate(a); c.scale(k, k);
      c.strokeStyle = '#5b2f0e'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(-34, 0); c.lineTo(-1, 0); c.stroke();
      c.strokeStyle = '#d4a373'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-34, -0.4); c.lineTo(-1, -0.4); c.stroke();
      c.fillStyle = '#475569'; c.beginPath(); c.moveTo(6, 0); c.lineTo(-4, -4.2); c.lineTo(-2, 0); c.lineTo(-4, 4.2); c.closePath(); c.fill();
      c.fillStyle = '#e2e8f0'; c.beginPath(); c.moveTo(6, 0); c.lineTo(-4, -4.2); c.lineTo(-2, 0); c.closePath(); c.fill();
      c.fillStyle = '#f43f5e'; c.beginPath(); c.moveTo(-26, 0); c.lineTo(-35, -5.5); c.lineTo(-38, -5.5); c.lineTo(-33, 0); c.closePath(); c.fill();
      c.fillStyle = '#be123c'; c.beginPath(); c.moveTo(-26, 0); c.lineTo(-35, 5.5); c.lineTo(-38, 5.5); c.lineTo(-33, 0); c.closePath(); c.fill();
      c.fillStyle = '#f8fafc'; c.fillRect(-34, -0.9, 8, 1.8);
      c.fillStyle = '#1e293b'; c.fillRect(-37, -1.6, 3, 3.2);
      c.restore();
    }
    function buildBg() {
      var W = api.W, H = api.H, gy = groundY; bgW = W; bgH = H; bgG = gy;
      var o = mk(W, H), g = o.g, gr, x, i;
      gr = g.createLinearGradient(0, 0, 0, gy); gr.addColorStop(0, '#38bdf8'); gr.addColorStop(0.55, '#9ddcfb'); gr.addColorStop(1, '#fdf2d8');
      g.fillStyle = gr; g.fillRect(0, 0, W, gy);
      var sx = W * 0.8, sy = gy * 0.22;
      gr = g.createRadialGradient(sx, sy, 0, sx, sy, W * 0.45); gr.addColorStop(0, 'rgba(255,250,220,.9)'); gr.addColorStop(0.12, 'rgba(255,240,180,.55)'); gr.addColorStop(1, 'rgba(255,240,180,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, gy);
      g.fillStyle = 'rgba(255,251,230,.35)'; g.beginPath(); g.arc(sx, sy, 34, 0, 6.283); g.fill(); g.fillStyle = '#fffbe6'; g.beginPath(); g.arc(sx, sy, 22, 0, 6.283); g.fill();
      bg = o.cv;
      // foreground: hills, ground
      var f = mk(W, H), h = f.g;
      function ridge(base, amp, fr, ph, col, step) { h.fillStyle = col; h.beginPath(); h.moveTo(0, gy); for (x = 0; x <= W + step; x += step) h.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin(x * fr + ph)) - amp * 0.35 * Math.sin(x * fr * 2.7 + ph * 2)); h.lineTo(W, gy); h.closePath(); h.fill(); }
      ridge(gy - 60, 90, 0.011, 1.3, 'rgba(100,140,190,.55)', 8);
      gr = h.createLinearGradient(0, gy - 140, 0, gy); gr.addColorStop(0, 'rgba(255,255,255,.0)'); gr.addColorStop(1, 'rgba(255,250,235,.35)'); h.fillStyle = gr; h.fillRect(0, gy - 160, W, 160);
      ridge(gy - 26, 46, 0.017, 0.2, '#84cc16', 6);
      ridge(gy - 8, 26, 0.025, 2.4, '#65a30d', 5);
      // tree line
      for (i = 0; i < W / 22; i++) {
        x = i * 22 + Math.sin(i * 7.3) * 8; var th = 14 + (Math.sin(i * 3.1) + 1) * 8, ty = gy - 6 - (Math.sin(x * 0.025 + 2.4) * 0.5 + 0.5) * 18;
        h.fillStyle = '#3f6212'; h.beginPath(); h.moveTo(x - 6, ty); h.lineTo(x, ty - th); h.lineTo(x + 6, ty); h.closePath(); h.fill();
        h.fillStyle = 'rgba(190,242,100,.25)'; h.beginPath(); h.moveTo(x - 1, ty - th * 0.8); h.lineTo(x, ty - th); h.lineTo(x + 3, ty - th * 0.5); h.closePath(); h.fill();
      }
      gr = h.createLinearGradient(0, gy, 0, H); gr.addColorStop(0, '#65a30d'); gr.addColorStop(0.15, '#4d7c0f'); gr.addColorStop(1, '#2f4f0a');
      h.fillStyle = gr; h.fillRect(0, gy, W, H - gy);
      for (i = 0; i < W * (H - gy) / 90; i++) { x = Math.random() * W; var yy = gy + Math.random() * (H - gy); h.fillStyle = Math.random() < 0.5 ? 'rgba(190,242,100,.25)' : 'rgba(20,40,5,.25)'; h.fillRect(x, yy, 1.2, 3 + Math.random() * 3); }
      // mowed stripes
      for (i = 0; i < 6; i++) { h.fillStyle = i % 2 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.04)'; h.fillRect(0, gy + i * (H - gy) / 6, W, (H - gy) / 6); }
      // grass fringe
      h.strokeStyle = '#4d7c0f'; h.lineWidth = 1.2; h.beginPath();
      for (x = 0; x < W; x += 3) { h.moveTo(x, gy + 2); h.lineTo(x + (Math.random() - 0.5) * 3, gy - 2 - Math.random() * 5); }
      h.stroke();
      h.fillStyle = 'rgba(190,242,100,.6)'; h.fillRect(0, gy, W, 2);
      // shooting line + dirt patch
      var ax = archer.x;
      h.fillStyle = 'rgba(120,80,40,.35)'; h.beginPath(); h.ellipse(ax, gy + 8, 34, 7, 0, 0, 6.283); h.fill();
      h.fillStyle = 'rgba(255,255,255,.7)'; h.fillRect(ax + 28, gy + 2, 3, H - gy);
      // flowers
      for (i = 0; i < 18; i++) { x = Math.random() * W; var fy2 = gy + 12 + Math.random() * (H - gy - 20); h.fillStyle = ['#fde047', '#f9a8d4', '#fff'][i % 3]; h.beginPath(); h.arc(x, fy2, 1.6, 0, 6.283); h.fill(); }
      var v = h.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.45, W / 2, H * 0.45, Math.max(W, H) * 0.8);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,20,30,.25)'); h.fillStyle = v; h.fillRect(0, 0, W, H);
      fg = f.cv;
      var cs = mk(120, 60), cg = cs.g;
      [[30, 32, 18], [52, 24, 22], [76, 28, 18], [92, 34, 13], [60, 36, 16]].forEach(function (b) {
        var r = cg.createRadialGradient(b[0] - 4, b[1] - 6, 2, b[0], b[1], b[2]); r.addColorStop(0, '#fff'); r.addColorStop(1, 'rgba(240,248,255,.85)');
        cg.fillStyle = r; cg.beginPath(); cg.arc(b[0], b[1], b[2], 0, 6.283); cg.fill();
      });
      cg.globalCompositeOperation = 'source-atop'; var sh = cg.createLinearGradient(0, 20, 0, 54); sh.addColorStop(0, 'rgba(148,180,210,0)'); sh.addColorStop(1, 'rgba(148,180,210,.45)'); cg.fillStyle = sh; cg.fillRect(0, 0, 120, 60); cg.globalCompositeOperation = 'source-over';
      cloudSpr = cs.cv;
      clouds = []; for (i = 0; i < (api.quality > 0 ? 5 : 3); i++) clouds.push({ x: Math.random() * (W + 240), y: gy * (0.08 + Math.random() * 0.45), s: 0.6 + Math.random() * 0.8, v: 4 + Math.random() * 8, a: 0.7 + Math.random() * 0.3 });
    }
    function newTarget() {
      var k = 10 - arrows;
      target = { x: api.W * (D.dist[0] + Math.random() * (D.dist[1] - D.dist[0])), y: api.H * (0.38 + Math.random() * 0.22), r: 46 * D.size * Math.min(1, api.W / 400), move: k >= 5 ? 30 + k * 6 : 0, ph: Math.random() * 6, y0: 0 };
      target.y0 = target.y;
      wind = (Math.random() * 2 - 1) * D.wind;
      stuck = [];
    }
    function ringScore(dy) { var k = Math.abs(dy) / target.r; return k > 1 ? 0 : Math.max(1, 10 - Math.floor(k * 10)); }
    return {
      reset: function () {
        D = DIFF[api.diff]; arrows = 10; shot = null; drag = null; t = 0; endT = 0; stuck = []; tens = 0; msg = ''; msgT = 0;
        groundY = api.H * 0.82; archer = { x: Math.max(40, api.W * 0.12), y: groundY - 50 };
        newTarget(); hitT = 0; trailA = []; bg = null;
      },
      resize: function () { bg = null; },
      idle: function (dt) { t += dt; },
      input: function (type, d) {
        if (shot || endT > 0 || arrows <= 0) return;
        if (type === 'down') drag = { x0: d.x, y0: d.y, x: d.x, y: d.y };
        else if (type === 'move' && drag) { drag.x = d.x; drag.y = d.y; }
        else if (type === 'up' && drag) {
          var dx = drag.x0 - drag.x, dy = drag.y0 - drag.y, L = Math.min(170, Math.hypot(dx, dy));
          drag = null;
          if (L < 15) return;
          var a = Math.atan2(dy, dx), v = 220 + L * 3.4;
          trailA = []; shot = { x: archer.x + 20, y: archer.y - 8, vx: Math.cos(a) * v, vy: Math.sin(a) * v, a: a };
          arrows--; api.sound('flap'); api.vibrate(10);
        }
      },
      update: function (dt) {
        t += dt; if (msgT > 0) msgT -= dt; if (hitT > 0) hitT = Math.max(0, hitT - dt);
        if (target.move) target.y = target.y0 + Math.sin(t * 1.4 + target.ph) * target.move;
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (shot) {
          var n = 4;
          for (var i = 0; i < n && shot; i++) {
            var h = dt / n;
            shot.vy += G * h; shot.vx += wind * h; shot.x += shot.vx * h; shot.y += shot.vy * h; shot.a = Math.atan2(shot.vy, shot.vx);
            if (i === 0) { trailA.push({ x: shot.x, y: shot.y }); if (trailA.length > 12) trailA.shift(); }
            if (shot.x >= target.x - 4 && shot.x <= target.x + 10 && Math.abs(shot.y - target.y) <= target.r) {
              var sc = ringScore(shot.y - target.y), bonus = 0;
              if (sc === 10) { tens++; if (tens >= 2) bonus = 10 * tens; api.fx.confetti(30); api.sound('win'); } else { tens = 0; api.sound('stomp'); }
              api.addScore(sc * 10 + bonus);
              stuck.push({ dy: shot.y - target.y, a: shot.a, w: t }); hitT = 0.6;
              api.fx.text(target.x, target.y - target.r - 16, sc === 10 ? api.t('arch.bull') + (bonus ? ' +' + bonus : '') : String(sc), sc >= 9 ? '#fde047' : '#fff', 22);
              api.vibrate(20); shot = null; afterShot();
            } else if (shot.y > groundY || shot.x > api.W + 40 || shot.x < -40) {
              api.sound('move'); tens = 0; msg = api.t('darts.miss'); msgT = 1; shot = null; afterShot();
            }
          }
        }
        function afterShot() {
          if (arrows <= 0) { endT = 1.6; return; }
          if (arrows % 2 === 0) newTarget(); else wind = (Math.random() * 2 - 1) * D.wind;
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H, q = api.quality, i;
        if (!bg || bgW !== W || bgH !== H || bgG !== groundY) buildBg();
        c.drawImage(bg, 0, 0, W, H);
        // drifting clouds
        for (i = 0; i < clouds.length; i++) {
          var cl = clouds[i], cxp = ((cl.x + t * (cl.v + wind * 0.4)) % (W + 240) + W + 240) % (W + 240) - 120;
          c.globalAlpha = cl.a; c.drawImage(cloudSpr, cxp - 60 * cl.s, cl.y - 25 * cl.s, 120 * cl.s, 60 * cl.s);
        }
        c.globalAlpha = 1;
        c.drawImage(fg, 0, 0, W, H);
        // wind streaks
        if (q > 0 && Math.abs(wind) > 1) {
          c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1.2; c.beginPath();
          var ws = Math.abs(wind), dir = wind > 0 ? 1 : -1;
          for (i = 0; i < 8; i++) {
            var sx = (((i * 0.618 * W) + t * ws * 9 * dir) % (W + 80) + W + 80) % (W + 80) - 40, sy = groundY * (0.15 + ((i * 0.37) % 1) * 0.6), ln = 10 + ws * 0.9;
            c.moveTo(sx, sy); c.quadraticCurveTo(sx + dir * ln * 0.5, sy - 2, sx + dir * ln, sy);
          }
          c.stroke();
        }
        // wind flag
        var fx = W / 2 + 46, fy = 14, fl = 10 + Math.abs(wind) * 1.4, fd = wind >= 0 ? 1 : -1;
        c.fillStyle = 'rgba(15,23,42,.55)'; rr(c, W / 2 - 64, 10, 128, 44, 14); c.fill();
        c.strokeStyle = '#e2e8f0'; c.lineWidth = 2; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx, fy + 36); c.stroke();
        c.fillStyle = '#facc15'; c.beginPath(); c.arc(fx, fy, 2.2, 0, 6.283); c.fill();
        c.fillStyle = '#ef4444'; c.beginPath(); c.moveTo(fx, fy + 2);
        var seg = 6, flap = Math.min(1, 0.25 + Math.abs(wind) / 30);
        for (i = 1; i <= seg; i++) { var u = i / seg; c.lineTo(fx + fd * fl * u, fy + 2 + u * 4 * (1 - flap) * 2 + Math.sin(t * 9 - u * 4) * 2.2 * u); }
        for (i = seg; i >= 0; i--) { var u2 = i / seg; c.lineTo(fx + fd * fl * u2, fy + 14 - u2 * (5 - flap * 3) + u2 * 4 * (1 - flap) * 2 + Math.sin(t * 9 - u2 * 4) * 2.2 * u2); }
        c.closePath(); c.fill();
        c.fillStyle = '#fff'; c.font = '800 13px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(api.t('arch.wind') + ' ' + Math.abs(wind).toFixed(0), W / 2 - 14, 24);
        var wl = Math.min(60, Math.abs(wind) * 1.6), wx = W / 2 - 14;
        c.strokeStyle = '#7dd3fc'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(wx - wl / 2 * fd, 42); c.lineTo(wx + wl / 2 * fd, 42); c.stroke();
        if (wind) { var ex = wx + wl / 2 * fd + fd * 2; c.fillStyle = '#7dd3fc'; c.beginPath(); c.moveTo(ex, 42); c.lineTo(ex - 8 * fd, 36); c.lineTo(ex - 8 * fd, 48); c.fill(); }
        c.lineCap = 'butt';
        // target
        var wob = hitT > 0 ? Math.sin(hitT * 40) * hitT * 4 : 0;
        var tx = target.x + wob, ty = target.y, r = target.r;
        c.fillStyle = 'rgba(20,40,10,.3)'; c.beginPath(); c.ellipse(target.x + 8, groundY + 3, 30, 5, 0, 0, 6.283); c.fill();
        // stand
        c.lineCap = 'round';
        c.strokeStyle = '#5b2f0e'; c.lineWidth = 6; c.beginPath(); c.moveTo(tx + 12, ty + r * 0.3); c.lineTo(target.x + 30, groundY); c.stroke();
        c.strokeStyle = '#7c3f12'; c.lineWidth = 6; c.beginPath(); c.moveTo(tx + 9, ty); c.lineTo(target.x + 5, groundY); c.stroke();
        c.strokeStyle = '#a16207'; c.lineWidth = 2; c.beginPath(); c.moveTo(tx + 8, ty + 4); c.lineTo(target.x + 4.5, groundY - 2); c.stroke();
        c.strokeStyle = '#5b2f0e'; c.lineWidth = 3; c.beginPath(); c.moveTo(target.x + 6, (ty + groundY) / 2 + 10); c.lineTo(target.x + 22, (ty + groundY) / 2 + 14); c.stroke();
        c.lineCap = 'butt';
        // straw boss behind face
        c.fillStyle = '#a16207'; c.beginPath(); c.ellipse(tx + 7, ty, 10, r * 1.03, 0, 0, 6.283); c.fill();
        c.fillStyle = '#d6a64a'; c.beginPath(); c.ellipse(tx + 5, ty, 9, r * 1.02, 0, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(120,70,10,.45)'; c.lineWidth = 1;
        for (i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(tx + 6, ty + i * r * 0.28 - 3); c.lineTo(tx + 12, ty + i * r * 0.28 + 3); c.stroke(); }
        var rings = ['#f8fafc', '#111827', '#2563eb', '#dc2626', '#facc15'];
        for (var k = 0; k < 5; k++) {
          var rr2 = r * (1 - k * 0.2);
          c.fillStyle = rings[k]; c.beginPath(); c.ellipse(tx, ty, 8.5 - k * 0.6, rr2, 0, 0, 6.283); c.fill();
          c.strokeStyle = k === 1 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.25)'; c.lineWidth = 0.8; c.stroke();
        }
        c.fillStyle = '#fff7cc'; c.beginPath(); c.ellipse(tx - 1, ty, 2, r * 0.06, 0, 0, 6.283); c.fill();
        c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(tx - 4, ty - r * 0.3, 2, r * 0.45, 0, 0, 6.283); c.fill();
        stuck.forEach(function (st) {
          var age = st.w != null ? t - st.w : 9, wv = age < 0.8 ? Math.sin(age * 45) * (0.8 - age) * 0.18 : 0;
          drawArrow(c, tx + 2, ty + st.dy, st.a + wv, 0.82);
        });
        // archer
        var ax = archer.x, ay = archer.y;
        var aimA = drag ? Math.atan2(drag.y0 - drag.y, drag.x0 - drag.x) : -0.2, pull = drag ? Math.min(1, Math.hypot(drag.x0 - drag.x, drag.y0 - drag.y) / 170) : 0;
        c.fillStyle = 'rgba(20,40,10,.3)'; c.beginPath(); c.ellipse(ax, groundY + 2, 24, 4.5, 0, 0, 6.283); c.fill();
        c.lineCap = 'round'; c.lineJoin = 'round';
        // quiver
        c.save(); c.translate(ax - 9, ay - 6); c.rotate(-0.35);
        for (i = 0; i < Math.min(arrows, 5); i++) { c.strokeStyle = '#d4a373'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-3 + i * 1.6, -12); c.lineTo(-3 + i * 1.6, -22); c.stroke(); c.fillStyle = i % 2 ? '#f43f5e' : '#f8fafc'; c.fillRect(-4.2 + i * 1.6, -26, 2.4, 6); }
        c.fillStyle = '#7c2d12'; rr(c, -6, -14, 12, 30, 4); c.fill(); c.fillStyle = '#9a3412'; c.fillRect(-6, -12, 12, 3); c.fillRect(-6, 8, 12, 2);
        c.restore();
        // legs
        c.strokeStyle = '#334155'; c.lineWidth = 6;
        c.beginPath(); c.moveTo(ax, ay + 16); c.lineTo(ax - 9, ay + 33); c.lineTo(ax - 12, ay + 47); c.moveTo(ax, ay + 16); c.lineTo(ax + 9, ay + 32); c.lineTo(ax + 12, ay + 47); c.stroke();
        c.fillStyle = '#1c1917'; rr(c, ax - 18, ay + 45, 10, 5, 2); c.fill(); rr(c, ax + 9, ay + 45, 11, 5, 2); c.fill();
        // body (tunic)
        var tg = c.createLinearGradient(ax - 10, 0, ax + 10, 0); tg.addColorStop(0, '#166534'); tg.addColorStop(0.5, '#22c55e'); tg.addColorStop(1, '#15803d');
        c.fillStyle = tg; c.beginPath(); c.moveTo(ax - 8, ay - 20); c.lineTo(ax + 8, ay - 20); c.lineTo(ax + 11, ay + 20); c.lineTo(ax - 11, ay + 20); c.closePath(); c.fill();
        c.fillStyle = '#78350f'; c.fillRect(ax - 10, ay + 6, 21, 4); c.fillStyle = '#facc15'; c.fillRect(ax - 2, ay + 6, 4, 4);
        c.strokeStyle = '#78350f'; c.lineWidth = 2; c.beginPath(); c.moveTo(ax - 7, ay - 19); c.lineTo(ax + 8, ay + 4); c.stroke();
        // head
        c.fillStyle = '#f2c79b'; c.beginPath(); c.arc(ax, ay - 30, 9.5, 0, 6.283); c.fill();
        c.fillStyle = '#5b3716'; c.beginPath(); c.arc(ax - 1, ay - 33, 9.5, Math.PI * 1.02, Math.PI * 1.95); c.fill();
        c.fillStyle = '#14532d'; c.beginPath(); c.moveTo(ax - 11, ay - 34); c.quadraticCurveTo(ax, ay - 48, ax + 11, ay - 35); c.lineTo(ax - 11, ay - 34); c.fill();
        c.fillStyle = '#ef4444'; c.beginPath(); c.moveTo(ax - 6, ay - 40); c.lineTo(ax - 18, ay - 50); c.lineTo(ax - 3, ay - 42); c.fill();
        c.fillStyle = '#1e293b'; c.beginPath(); c.arc(ax + 5, ay - 30, 1.4, 0, 6.283); c.fill();
        // bow + arms
        var bxp = ax + 6, byp = ay - 8, ca = Math.cos(aimA), sa = Math.sin(aimA);
        var handX = bxp + ca * 18, handY = byp + sa * 18, sx2 = bxp + ca * (18 - 14 - pull * 26), sy2 = byp + sa * (18 - 14 - pull * 26);
        c.strokeStyle = '#f2c79b'; c.lineWidth = 4.5;
        c.beginPath(); c.moveTo(ax + 3, ay - 17); c.lineTo(handX, handY); c.stroke();
        c.beginPath(); c.moveTo(ax + 1, ay - 16); c.quadraticCurveTo((ax + sx2) / 2 - sa * 6, (ay - 16 + sy2) / 2 + ca * 6, sx2, sy2); c.stroke();
        c.strokeStyle = '#15803d'; c.lineWidth = 5; c.beginPath(); c.moveTo(ax + 2, ay - 17); c.lineTo(ax + 2 + ca * 6, ay - 17 + sa * 6); c.stroke();
        c.save(); c.translate(bxp, byp); c.rotate(aimA);
        var bend = 1 + pull * 0.25, tipX = Math.cos(1.2) * 30 - pull * 4, tipY = Math.sin(1.2) * 30 / (1 + pull * 0.08);
        // string
        c.strokeStyle = '#f8fafc'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(tipX, -tipY); c.lineTo(-pull * 26, 0); c.lineTo(tipX, tipY); c.stroke();
        if (pull > 0.05) { c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 3; c.beginPath(); c.moveTo(tipX, -tipY); c.lineTo(-pull * 26, 0); c.lineTo(tipX, tipY); c.stroke(); }
        // limbs (recurve)
        c.strokeStyle = '#5b2f0e'; c.lineWidth = 5.5;
        c.beginPath(); c.moveTo(tipX - 2, -tipY - 3); c.quadraticCurveTo(26 * bend, -20, 30, 0); c.quadraticCurveTo(26 * bend, 20, tipX - 2, tipY + 3); c.stroke();
        c.strokeStyle = '#b45309'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(tipX - 2, -tipY - 3); c.quadraticCurveTo(26 * bend, -20, 30, 0); c.quadraticCurveTo(26 * bend, 20, tipX - 2, tipY + 3); c.stroke();
        c.strokeStyle = 'rgba(253,230,138,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(tipX, -tipY); c.quadraticCurveTo(25 * bend, -20, 29, -2); c.stroke();
        c.fillStyle = '#1c1917'; rr(c, 27, -6, 6, 12, 2); c.fill();
        if (!shot && arrows > 0) drawArrow(c, 40 - pull * 26, 0, 0, 1);
        c.restore();
        c.fillStyle = '#f2c79b'; c.beginPath(); c.arc(handX, handY, 3.2, 0, 6.283); c.fill(); c.beginPath(); c.arc(sx2, sy2, 3, 0, 6.283); c.fill();
        c.lineCap = 'butt'; c.lineJoin = 'miter';
        // trajectory
        if (drag && api.diff < 3) {
          var dx = drag.x0 - drag.x, dy = drag.y0 - drag.y, L = Math.min(170, Math.hypot(dx, dy)), a = Math.atan2(dy, dx), v = 220 + L * 3.4;
          var px = archer.x + 20, py = archer.y - 8, vx = Math.cos(a) * v, vy = Math.sin(a) * v, steps = [14, 9, 5][api.diff];
          for (var s2 = 0; s2 < steps; s2++) {
            for (var qq = 0; qq < 4; qq++) { vy += G * 0.015; px += vx * 0.015; py += vy * 0.015; }
            var fa = 1 - s2 / steps * 0.7;
            c.globalAlpha = fa; c.fillStyle = 'rgba(15,23,42,.45)'; c.beginPath(); c.arc(px, py + 1, 3.6, 0, 6.283); c.fill();
            c.fillStyle = '#fff'; c.beginPath(); c.arc(px, py, 2.6, 0, 6.283); c.fill();
          }
          c.globalAlpha = 1;
          c.font = '800 12px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(15,23,42,.6)';
          rr(c, archer.x - 22, archer.y - 78, 44, 18, 9); c.fill();
          c.fillStyle = pull > 0.85 ? '#fde047' : '#fff'; c.fillText(Math.round(pull * 100) + '%', archer.x, archer.y - 68);
        }
        if (shot) {
          if (q > 0) for (i = 0; i < trailA.length; i++) { c.globalAlpha = (i + 1) / trailA.length * 0.35; c.fillStyle = '#fff'; c.beginPath(); c.arc(trailA[i].x, trailA[i].y, 1.2 + i * 0.25, 0, 6.283); c.fill(); }
          c.globalAlpha = 1;
          drawArrow(c, shot.x, shot.y, shot.a, 1);
        }
        // HUD: arrows left
        c.textBaseline = 'middle'; c.textAlign = 'left';
        var hw = 20 + Math.max(1, arrows) * 7 + 22;
        c.fillStyle = 'rgba(15,23,42,.55)'; rr(c, 8, 10, hw, 28, 14); c.fill();
        for (i = 0; i < arrows; i++) {
          var ix = 18 + i * 7;
          c.strokeStyle = '#e7c9a0'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(ix, 31); c.lineTo(ix, 18); c.stroke();
          c.fillStyle = '#cbd5e1'; c.beginPath(); c.moveTo(ix, 14); c.lineTo(ix - 2.5, 19); c.lineTo(ix + 2.5, 19); c.fill();
          c.fillStyle = '#f43f5e'; c.fillRect(ix - 2, 29, 4, 4);
        }
        c.fillStyle = '#fff'; c.font = '800 14px system-ui, sans-serif'; c.fillText(String(arrows), 18 + Math.max(1, arrows) * 7 + 2, 24.5);
        if (tens >= 2) {
          c.font = '900 14px system-ui, sans-serif'; var bt = '×' + tens, bw2 = c.measureText(bt).width + 42;
          var bgB = c.createLinearGradient(0, 10, 0, 38); bgB.addColorStop(0, '#fde047'); bgB.addColorStop(1, '#f59e0b');
          c.fillStyle = bgB; rr(c, W - 8 - bw2, 10, bw2, 28, 14); c.fill();
          var mx = W - bw2 + 8, my = 24; ['#dc2626', '#fff', '#dc2626'].forEach(function (cc, j) { c.fillStyle = cc; c.beginPath(); c.arc(mx, my, 8 - j * 2.6, 0, 6.283); c.fill(); });
          c.fillStyle = '#7c2d12'; c.textAlign = 'right'; c.fillText(bt, W - 18, 24.5);
        }
        if (msgT > 0) {
          var me2 = Math.min(1, (1 - msgT) * 5 + 0.2), ms = 0.8 + me2 * 0.2;
          c.save(); c.translate(W / 2, H * 0.3); c.scale(ms, ms); c.globalAlpha = Math.min(1, msgT * 2);
          c.textAlign = 'center'; c.font = '900 26px system-ui, sans-serif'; c.lineJoin = 'round';
          c.strokeStyle = '#fff'; c.lineWidth = 6; c.strokeText(msg, 0, 0); c.fillStyle = '#dc2626'; c.fillText(msg, 0, 0);
          c.restore(); c.lineJoin = 'miter';
        }
        c.globalAlpha = 1; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      }
    };
  }
};
