/* Прыгун: прыгай по платформам всё выше */
window.GAMES = window.GAMES || {};
window.GAMES.jumper = {
  title: 'Прыгун',
  desc: 'Прыгай всё выше',
  hint: 'Держи палец слева или справа, чтобы смещаться. Прыжки — сами. Пружины подбрасывают высоко, ломкие платформы рассыпаются. Не падай!',
  colors: ['#84cc16', '#0ea5e9'],
  controls: 'none',
  multiTouch: true,
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="jpSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38bdf8"/><stop offset="1" stop-color="#bae6fd"/></linearGradient>' +
    '<radialGradient id="jpBody" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fef9c3"/><stop offset=".5" stop-color="#fde047"/><stop offset="1" stop-color="#ca8a04"/></radialGradient>' +
    '<linearGradient id="jpGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86efac"/><stop offset="1" stop-color="#16a34a"/></linearGradient></defs>' +
    '<rect x="4" y="4" width="92" height="92" rx="18" fill="url(#jpSky)"/><circle cx="78" cy="22" r="9" fill="#fef9c3" opacity=".9"/>' +
    '<path d="M14 26a7 7 0 0 1 12-4a6 6 0 0 1 10 4z" fill="#fff" opacity=".85"/>' +
    '<rect x="10" y="80" width="36" height="9" rx="4" fill="#854d0e"/><rect x="8" y="77" width="40" height="6" rx="3" fill="url(#jpGrass)"/>' +
    '<rect x="58" y="58" width="32" height="8" rx="4" fill="#0284c7"/><rect x="58" y="57" width="32" height="3" rx="1.5" fill="#7dd3fc"/>' +
    '<path d="M66 57 l2-4 2 4 2-4 2 4" stroke="#94a3b8" stroke-width="2" fill="none"/><rect x="64" y="51" width="12" height="3" rx="1" fill="#ef4444"/>' +
    '<ellipse cx="38" cy="52" rx="14" ry="16" fill="url(#jpBody)" stroke="#a16207" stroke-width="1.5"/><ellipse cx="31" cy="56" rx="5" ry="7" fill="#facc15" stroke="#ca8a04" stroke-width="1.2"/>' +
    '<circle cx="40" cy="46" r="4.2" fill="#fff"/><circle cx="48" cy="46" r="3.8" fill="#fff"/><circle cx="41.5" cy="46.5" r="2" fill="#111"/><circle cx="49" cy="46.5" r="1.8" fill="#111"/>' +
    '<path d="M50 52 l9 2 -9 3z" fill="#f97316"/><path d="M33 68 l-2 6 M43 68 l2 6" stroke="#f97316" stroke-width="3.5" stroke-linecap="round"/></svg>',

  create: function (api) {
    var DIFF = [
      { gap: 70, move: 0.1, brk: 0.05, spring: 0.12, w: 78 },
      { gap: 85, move: 0.2, brk: 0.12, spring: 0.09, w: 70 },
      { gap: 100, move: 0.3, brk: 0.18, spring: 0.07, w: 62 },
      { gap: 112, move: 0.42, brk: 0.25, spring: 0.06, w: 54 }
    ];
    var D, p, plats, cam, maxH, keys, t, dead, deadT, parts, clouds, nextY, finger = null, multiT = 0, tilt = 0, bgGrad = null, bgK = -1;
    // наклон телефона: работает, если есть датчик
    function onTilt(e) { if (e.gamma != null) tilt = e.gamma; }
    window.addEventListener('deviceorientation', onTilt);
    var G = 1500, JUMP = 760, R = 15;
    // v2.0: монеты, реактивный ранец и монстры (на монстра можно прыгнуть сверху)
    var items = [], bonus = 0, jetT = 0;

    function addPlat(y) {
      var hgt = -y, k = Math.min(1, hgt / 6000);
      var w = Math.max(44, D.w - k * 14);
      var r = Math.random(), type = 'n';
      if (hgt > 300) {
        if (r < D.brk + k * 0.08) type = 'b';
        else if (r < D.brk + D.move + k * 0.15) type = 'm';
      }
      var pl = { x: Math.random() * (api.W - w), y: y, w: w, type: type, vx: (Math.random() < 0.5 ? -1 : 1) * (50 + k * 90), gone: false, fall: 0 };
      if (type !== 'b' && Math.random() < D.spring) pl.spring = Math.random() * (w - 16) + 8, pl.sp = 0;
      plats.push(pl);
      var rr = Math.random();
      if (hgt > 400 && rr < 0.015 && type === 'n') items.push({ k: 'jet', x: pl.x + pl.w / 2, y: y - 18 });
      else if (rr < 0.17) items.push({ k: 'coin', x: 20 + Math.random() * (api.W - 40), y: y - 40 - Math.random() * 30 });
      else if (hgt > 900 && rr < 0.17 + 0.03 + api.diff * 0.012) items.push({ k: 'mon', x: 30 + Math.random() * (api.W - 60), y: y - 50, ph: Math.random() * 6, alive: true });
    }
    function fill() {
      while (nextY > cam - 60) {
        var g = D.gap * (0.6 + Math.random() * 0.6) * (1 + Math.min(0.5, -nextY / 12000));
        nextY -= Math.min(g, 190);
        addPlat(nextY);
      }
    }
    var spr = {}, hills = null, stars = null, sprW = 0;
    function mk(w, h) { var d = Math.min(2, window.devicePixelRatio || 1), cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w * d)); cv.height = Math.max(1, Math.ceil(h * d)); var x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); cv.x = x; return cv; }
    function rrp(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
    function platSprite(type, w) { // кешируем по типу и ширине
      var wr = Math.round(w), key = type + wr; if (spr[key]) return spr[key];
      var cv = mk(wr + 8, 26), x = cv.x, i, g;
      x.fillStyle = 'rgba(0,0,0,.15)'; rrp(x, 6, 10, wr, 14, 7); x.fill();
      if (type === 'n') {
        g = x.createLinearGradient(0, 8, 0, 20); g.addColorStop(0, '#a16207'); g.addColorStop(1, '#5c3310');
        x.fillStyle = g; rrp(x, 4, 8, wr, 12, 6); x.fill();
        x.fillStyle = 'rgba(255,230,180,.35)'; for (i = 0; i < wr / 9; i++) { x.beginPath(); x.arc(9 + i * 9 + (i % 2) * 3, 14 + (i % 3), 1.3, 0, 6.283); x.fill(); }
        g = x.createLinearGradient(0, 5, 0, 12); g.addColorStop(0, '#86efac'); g.addColorStop(1, '#16a34a');
        x.fillStyle = g; rrp(x, 3, 5, wr + 2, 7, 3.5); x.fill();
        for (i = 0; i < (wr - 4) / 7; i++) { x.beginPath(); x.arc(7 + i * 7, 11.5, 2.6, 0, Math.PI); x.fill(); } // свисающая трава
        x.fillStyle = '#4ade80'; for (i = 0; i < wr / 6; i++) { var bx = 6 + i * 6 + (i % 2); x.beginPath(); x.moveTo(bx - 1.5, 6); x.lineTo(bx, 2 + (i % 3)); x.lineTo(bx + 1.5, 6); x.fill(); }
        x.fillStyle = 'rgba(255,255,255,.4)'; x.fillRect(8, 6, wr - 8, 1.2);
      } else if (type === 'm') {
        g = x.createLinearGradient(0, 6, 0, 18); g.addColorStop(0, '#bae6fd'); g.addColorStop(0.3, '#38bdf8'); g.addColorStop(1, '#0369a1');
        x.fillStyle = '#075985'; rrp(x, 4, 7, wr, 12, 6); x.fill();
        x.fillStyle = g; rrp(x, 4, 6, wr, 11, 5.5); x.fill();
        x.fillStyle = 'rgba(255,255,255,.6)'; x.fillRect(9, 7.5, wr - 10, 1.5);
        x.fillStyle = '#e0f2fe'; [10, wr - 2].forEach(function (rx) { x.beginPath(); x.arc(rx, 12, 1.6, 0, 6.283); x.fill(); });
        x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 1.6; x.lineCap = 'round';
        x.beginPath(); x.moveTo(wr / 2 - 2, 9.5); x.lineTo(wr / 2 - 5, 12); x.lineTo(wr / 2 - 2, 14.5); x.moveTo(wr / 2 + 10, 9.5); x.lineTo(wr / 2 + 13, 12); x.lineTo(wr / 2 + 10, 14.5); x.stroke();
      } else {
        g = x.createLinearGradient(0, 6, 0, 18); g.addColorStop(0, '#e9b872'); g.addColorStop(1, '#8a4b14');
        x.fillStyle = g; rrp(x, 4, 6, wr, 12, 3); x.fill();
        x.strokeStyle = 'rgba(92,51,16,.45)'; x.lineWidth = 0.8;
        for (i = 0; i < 3; i++) { x.beginPath(); x.moveTo(6, 9 + i * 3); x.bezierCurveTo(wr * 0.3, 8 + i * 3, wr * 0.6, 11 + i * 3, wr + 2, 9 + i * 3); x.stroke(); }
        x.fillStyle = '#44403c'; [8, wr].forEach(function (nx) { x.beginPath(); x.arc(nx, 12, 1.4, 0, 6.283); x.fill(); });
        x.strokeStyle = '#5c2d0a'; x.lineWidth = 1.6;
        x.beginPath(); x.moveTo(4 + wr * 0.35, 6); x.lineTo(4 + wr * 0.42, 11); x.lineTo(4 + wr * 0.38, 18); x.moveTo(4 + wr * 0.7, 6); x.lineTo(4 + wr * 0.63, 12); x.lineTo(4 + wr * 0.67, 18); x.stroke();
        x.fillStyle = 'rgba(255,255,255,.3)'; x.fillRect(7, 7, wr - 6, 1.2);
      }
      return (spr[key] = cv);
    }
    function buildScenery() {
      var W = api.W, H = api.H, seed = 4, i;
      function R() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      sprW = W + 'x' + H; spr = {};
      // холмы
      var hh = 220; hills = mk(W, hh); var x = hills.x;
      [[0.35, '#7dd3a8', 60, 0.6], [0.6, '#4fb07a', 40, 1.3], [0.82, '#2f8f5a', 26, 2.1]].forEach(function (L) {
        x.fillStyle = L[1]; x.beginPath(); x.moveTo(0, hh);
        for (var xx = 0; xx <= W; xx += 8) x.lineTo(xx, hh * L[0] + Math.sin(xx * 0.012 * L[3] + L[3] * 3) * L[2] * 0.6 + Math.sin(xx * 0.031 + L[3]) * L[2] * 0.25);
        x.lineTo(W, hh); x.closePath(); x.fill();
      });
      for (i = 0; i < 14; i++) { // деревца
        var tx = R() * W, ty = hh * (0.62 + R() * 0.25);
        x.fillStyle = '#5b3a1e'; x.fillRect(tx - 1.5, ty, 3, 8);
        x.fillStyle = R() < 0.5 ? '#166534' : '#15803d'; x.beginPath(); x.arc(tx, ty - 2, 6 + R() * 4, 0, 6.283); x.fill();
        x.fillStyle = 'rgba(255,255,255,.18)'; x.beginPath(); x.arc(tx - 2, ty - 5, 3, 0, 6.283); x.fill();
      }
      // звёзды (на высоте)
      stars = mk(W, H); var y = stars.x;
      for (i = 0; i < 110; i++) { var sx = R() * W, sy = R() * H, sr = R() * 1.4 + 0.3; y.fillStyle = 'rgba(255,255,255,' + (0.4 + R() * 0.6).toFixed(2) + ')'; y.beginPath(); y.arc(sx, sy, sr, 0, 6.283); y.fill(); }
      // облака
      spr.cloud = [0, 1].map(function (v) {
        var cv = mk(90, 50), q = cv.x, blobs = v ? [[22, 32, 15], [42, 24, 20], [64, 31, 14], [50, 36, 13]] : [[20, 32, 14], [38, 26, 18], [58, 22, 16], [72, 32, 12]];
        q.fillStyle = 'rgba(148,180,210,.45)'; blobs.forEach(function (b) { q.beginPath(); q.arc(b[0] + 2, b[1] + 4, b[2], 0, 6.283); q.fill(); });
        blobs.forEach(function (b) { var g = q.createRadialGradient(b[0] - b[2] * 0.3, b[1] - b[2] * 0.4, 1, b[0], b[1], b[2]); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e2eef8'); q.fillStyle = g; q.beginPath(); q.arc(b[0], b[1], b[2], 0, 6.283); q.fill(); });
        return cv;
      });
      // солнце
      var sc = mk(140, 140), z = sc.x, sg = z.createRadialGradient(70, 70, 8, 70, 70, 70);
      sg.addColorStop(0, 'rgba(255,253,230,1)'); sg.addColorStop(0.25, 'rgba(254,240,138,.9)'); sg.addColorStop(0.3, 'rgba(254,240,138,.35)'); sg.addColorStop(1, 'rgba(254,240,138,0)');
      z.fillStyle = sg; z.fillRect(0, 0, 140, 140); spr.sun = sc;
      // монета
      var cc = mk(24, 24), m = cc.x, cg = m.createRadialGradient(9, 8, 1, 12, 12, 11); cg.addColorStop(0, '#fef9c3'); cg.addColorStop(0.5, '#facc15'); cg.addColorStop(1, '#a16207');
      m.fillStyle = '#854d0e'; m.beginPath(); m.arc(12, 12, 11, 0, 6.283); m.fill();
      m.fillStyle = cg; m.beginPath(); m.arc(12, 12, 9.8, 0, 6.283); m.fill();
      m.strokeStyle = 'rgba(133,77,14,.6)'; m.lineWidth = 1.2; m.beginPath(); m.arc(12, 12, 6.5, 0, 6.283); m.stroke();
      m.fillStyle = '#a16207'; m.font = '900 9px system-ui, sans-serif'; m.textAlign = 'center'; m.textBaseline = 'middle'; m.fillText('$', 12, 12.5);
      m.fillStyle = 'rgba(255,255,255,.7)'; m.beginPath(); m.ellipse(8, 7, 2.5, 1.4, -0.7, 0, 6.283); m.fill();
      spr.coin = cc;
    }
    function burst(x, y, c, n) {
      for (var i = 0; i < n; i++) parts.push({ x: x, y: y, vx: (Math.random() - 0.5) * 200, vy: -Math.random() * 150, life: 0.5, c: c });
    }

    return {
      reset: function () {
        D = DIFF[api.diff]; t = 0; dead = false; deadT = 0; parts = []; finger = null; keys = { l: 0, r: 0 };
        items = []; bonus = 0; jetT = 0;
        cam = 0; maxH = 0; plats = [];
        p = { x: api.W / 2, y: api.H - 120, vx: 0, vy: -JUMP, face: 1, sq: 0 };
        plats.push({ x: api.W / 2 - 40, y: api.H - 90, w: 80, type: 'n', vx: 0 });
        nextY = api.H - 90;
        clouds = []; for (var i = 0; i < 6; i++) clouds.push({ x: Math.random() * api.W, y: Math.random() * api.H, s: 0.5 + Math.random(), v: i % 2 });
        if (sprW !== api.W + 'x' + api.H) buildScenery();
        fill();
      },
      idle: function (dt) { t += dt; p.sq = Math.max(0, p.sq - dt * 4); },
      destroy: function () { window.removeEventListener('deviceorientation', onTilt); },
      input: function (type, d) {
        // герой бежит под палец: касания приходят списком ('multi'), мышь — 'press'/'multi'/'up'
        if (type === 'multi') { finger = d.length ? d[d.length - 1].x : null; multiT = Date.now(); }
        else if (type === 'press') finger = d.x;
        else if (type === 'up' && Date.now() - multiT > 40) finger = null; // касания уже обработаны в 'multi'
      },
      key: function (k, down) {
        if (k === 'left') keys.l = down ? 1 : 0;
        if (k === 'right') keys.r = down ? 1 : 0;
      },
      update: function (dt) {
        t += dt;
        var target;
        if (finger != null) { var fx = finger - p.x; target = Math.abs(fx) < 4 ? 0 : Math.max(-520, Math.min(520, fx * 9)); }
        else if (keys.r - keys.l) target = (keys.r - keys.l) * 360;
        else if (Math.abs(tilt) > 3) target = Math.max(-1, Math.min(1, (tilt - (tilt > 0 ? 3 : -3)) / 22)) * 420;
        else target = 0;
        p.vx += (target - p.vx) * Math.min(1, dt * 12);
        if (Math.abs(p.vx) > 25) p.face = p.vx > 0 ? 1 : -1;
        p.x += p.vx * dt;
        if (p.x < -R) p.x = api.W + R; if (p.x > api.W + R) p.x = -R;
        var prevY = p.y;
        if (jetT > 0) { jetT -= dt; p.vy = -900; if (Math.random() < 0.8) parts.push({ x: p.x - p.face * 8, y: p.y + R, vx: (Math.random() - 0.5) * 60, vy: 200, life: 0.35, c: Math.random() < 0.5 ? '#fb923c' : '#fde047' }); }
        p.vy += G * dt; p.y += p.vy * dt;
        for (var it = items.length - 1; it >= 0; it--) {
          var o = items[it];
          if (o.y > cam + api.H + 60) { items.splice(it, 1); continue; }
          if (o.k === 'mon') { if (!o.alive) { o.y += 500 * dt; continue; } o.ph += dt; o.x += Math.sin(o.ph * 1.5) * 40 * dt; }
          var dx = p.x - o.x, dy = (p.y) - o.y;
          if (dead) continue;
          if (o.k === 'coin' && Math.abs(dx) < 22 && Math.abs(dy) < 24) { items.splice(it, 1); bonus += 5; api.sound('coin'); api.fx.text(o.x, o.y - cam - 14, '+5', '#fde047', 15); }
          else if (o.k === 'jet' && Math.abs(dx) < 22 && Math.abs(dy) < 26) { items.splice(it, 1); jetT = 2.6; api.sound('bonus'); api.vibrate(30); api.fx.text(o.x, o.y - cam - 20, api.t('jumper.jet'), '#fb923c', 17); }
          else if (o.k === 'mon' && o.alive && Math.abs(dx) < 26 && Math.abs(dy) < 26) {
            if (p.vy > 0 && dy < -6 || jetT > 0) { o.alive = false; p.vy = -JUMP * 1.1; bonus += 25; api.sound('stomp'); api.vibrate(30); api.fx.burst(o.x, o.y - cam, '#a855f7', 14, 180); api.fx.text(o.x, o.y - cam - 20, '+25', '#c084fc', 16); }
            else { dead = true; deadT = 0.9; p.vy = 300; api.sound('hit'); api.vibrate(200); api.fx.shake(7); }
          }
        }
        p.sq = Math.max(0, p.sq - dt * 4);
        plats.forEach(function (pl) {
          if (pl.type === 'm') { pl.x += pl.vx * dt; if (pl.x < 0) { pl.x = 0; pl.vx = -pl.vx; } if (pl.x + pl.w > api.W) { pl.x = api.W - pl.w; pl.vx = -pl.vx; } }
          if (pl.gone) { pl.fall += dt; pl.y += 400 * dt; }
          if (pl.sp) pl.sp = Math.max(0, pl.sp - dt * 3);
        });
        if (!dead && p.vy > 0 && jetT <= 0) {
          for (var i = 0; i < plats.length; i++) {
            var pl = plats[i];
            if (pl.gone) continue;
            if (prevY + R <= pl.y + 2 && p.y + R >= pl.y && p.x > pl.x - 8 && p.x < pl.x + pl.w + 8) {
              if (pl.type === 'b') { pl.gone = true; burst(p.x, pl.y, '#a16207', 8); api.sound('break'); continue; }
              p.y = pl.y - R; p.sq = 1;
              if (pl.spring != null && Math.abs(p.x - (pl.x + pl.spring)) < 14) { p.vy = -JUMP * 1.65; pl.sp = 1; api.sound('bonus'); api.vibrate(25); }
              else { p.vy = -JUMP; api.sound('jump'); }
              break;
            }
          }
        }
        // камера идёт только вверх
        var top = api.H * 0.42;
        if (p.y < cam + top) cam = p.y - top;
        var h = Math.max(0, Math.round((api.H - 120 - p.y) / 10));
        if (h > maxH) maxH = h;
        if (maxH + bonus !== api.getScore()) api.setScore(maxH + bonus);
        plats = plats.filter(function (pl) { return pl.y < cam + api.H + 40 && pl.fall < 2; });
        fill();
        parts = parts.filter(function (q) { q.vy += 600 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; return q.life > 0; });
        if (!dead && p.y - R > cam + api.H) { dead = true; deadT = 0.7; api.sound('over'); api.vibrate(80); }
        if (dead) { deadT -= dt; if (deadT <= 0) api.gameOver(); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, hgt = -cam;
        var k = Math.min(1, hgt / 20000);
        var kq = Math.round(k * 200);
        if (!bgGrad || kq !== bgK || bgGrad.h !== H) {
          var kk = kq / 200;
          bgGrad = c.createLinearGradient(0, 0, 0, H); bgGrad.h = H; bgK = kq;
          bgGrad.addColorStop(0, 'hsl(' + (200 + kk * 60) + ',70%,' + (62 - kk * 50) + '%)');
          bgGrad.addColorStop(1, 'hsl(' + (190 + kk * 50) + ',75%,' + (82 - kk * 55) + '%)');
        }
        c.fillStyle = bgGrad; c.fillRect(0, 0, W, H);
        if (sprW !== W + 'x' + H) buildScenery();
        var ks = Math.min(1, hgt / 9000);
        if (ks > 0.02) { // звёзды проступают на высоте
          var so = ((hgt * 0.04) % H + H) % H;
          c.globalAlpha = ks; c.drawImage(stars, 0, so, W, H); c.drawImage(stars, 0, so - H, W, H); c.globalAlpha = 1;
        }
        var sunY = 70 + hgt * 0.04;
        if (sunY < H + 70) { c.globalAlpha = 1 - k * 0.7; c.drawImage(spr.sun, W * 0.78 - 70, sunY - 70, 140, 140); c.globalAlpha = 1; }
        var hy = H - 190 + hgt * 0.18;
        if (hy < H) c.drawImage(hills, 0, hy, W, 220);
        clouds.forEach(function (cl) {
          var cy = ((cl.y - cam * 0.25 * cl.s) % (H + 80) + H + 80) % (H + 80) - 40;
          var cx = ((cl.x + t * 6 * cl.s) % (W + 120) + W + 120) % (W + 120) - 80;
          c.globalAlpha = Math.max(0.15, 0.9 - k * 0.6); c.drawImage(spr.cloud[cl.v || 0], cx, cy - 25 * cl.s, 90 * cl.s, 50 * cl.s);
        });
        c.globalAlpha = 1;
        c.save(); c.translate(0, -cam);
        plats.forEach(function (pl) {
          var cols = { n: ['#4ade80', '#16a34a'], m: ['#38bdf8', '#0284c7'], b: ['#d6a35c', '#92400e'] }[pl.type];
          c.save();
          if (pl.gone) { c.globalAlpha = Math.max(0, 1 - pl.fall); c.translate(pl.x + pl.w / 2, pl.y); c.rotate(pl.fall * 0.8); c.translate(-pl.x - pl.w / 2, -pl.y); }
          var ps = platSprite(pl.type, pl.w);
          c.drawImage(ps, pl.x - 4, pl.y - 6, Math.round(pl.w) + 8, 26);
          if (pl.spring != null) {
            var sx = pl.x + pl.spring, ext = 8 + pl.sp * 10;
            c.fillStyle = '#475569'; c.fillRect(sx - 7, pl.y - 1, 14, 3);
            c.lineCap = 'round'; c.strokeStyle = '#475569'; c.lineWidth = 3.4; c.beginPath();
            c.moveTo(sx - 6, pl.y); c.lineTo(sx + 6, pl.y - ext * 0.33); c.lineTo(sx - 6, pl.y - ext * 0.66); c.lineTo(sx + 6, pl.y - ext); c.stroke();
            c.strokeStyle = '#e2e8f0'; c.lineWidth = 1.4; c.stroke(); c.lineCap = 'butt';
            c.fillStyle = '#991b1b'; rrp(c, sx - 9, pl.y - ext - 3, 18, 5, 2); c.fill();
            c.fillStyle = '#ef4444'; rrp(c, sx - 9, pl.y - ext - 4, 18, 4, 2); c.fill();
            c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(sx - 6, pl.y - ext - 3.5, 12, 1);
          }
          c.restore();
        });
        parts.forEach(function (q) { c.globalAlpha = Math.min(1, q.life * 2); c.fillStyle = q.c; c.beginPath(); c.arc(q.x, q.y, 1.5 + q.life * 4, 0, 6.283); c.fill(); });
        c.globalAlpha = 1;
        items.forEach(function (o) {
          if (o.k === 'coin') {
            var ws = Math.max(0.15, Math.abs(Math.cos(t * 4 + o.x)));
            c.fillStyle = 'rgba(253,224,71,.25)'; c.beginPath(); c.arc(o.x, o.y, 14, 0, 6.283); c.fill();
            c.drawImage(spr.coin, o.x - 11 * ws, o.y - 11, 22 * ws, 22);
          } else if (o.k === 'jet') {
            var jg = c.createLinearGradient(o.x - 9, 0, o.x + 9, 0); jg.addColorStop(0, '#94a3b8'); jg.addColorStop(0.4, '#e2e8f0'); jg.addColorStop(1, '#475569');
            c.fillStyle = jg; rrp(c, o.x - 9, o.y - 12, 8, 20, 3); c.fill(); rrp(c, o.x + 1, o.y - 12, 8, 20, 3); c.fill();
            c.fillStyle = '#ef4444'; rrp(c, o.x - 10, o.y - 15, 20, 5, 2); c.fill();
            c.fillStyle = '#334155'; c.fillRect(o.x - 8, o.y + 6, 6, 3); c.fillRect(o.x + 2, o.y + 6, 6, 3);
            c.fillStyle = '#fb923c'; c.beginPath(); c.moveTo(o.x - 8, o.y + 8); c.lineTo(o.x - 5, o.y + 14 + Math.random() * 4); c.lineTo(o.x - 2, o.y + 8); c.fill();
          } else {
            c.save(); c.translate(o.x, o.y); if (!o.alive) c.rotate(t * 8);
            c.fillStyle = '#5b21b6'; c.beginPath(); c.moveTo(-14, -9); c.lineTo(-10, -20); c.lineTo(-6, -11); c.moveTo(14, -9); c.lineTo(10, -20); c.lineTo(6, -11); c.fill();
            var mg = c.createRadialGradient(-6, -6, 2, 0, 0, 20); mg.addColorStop(0, '#a78bfa'); mg.addColorStop(1, '#5b21b6');
            c.fillStyle = mg; c.beginPath(); c.ellipse(0, 0, 20, 15, 0, 0, 6.283); c.fill();
            c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(-7, -8, 6, 3, -0.4, 0, 6.283); c.fill();
            c.fillStyle = '#a78bfa'; for (var lg = -2; lg <= 2; lg++) { c.beginPath(); c.ellipse(lg * 7, 14 + Math.sin(t * 10 + lg) * 2, 3, 6, 0, 0, 6.283); c.fill(); }
            c.fillStyle = '#fff'; c.beginPath(); c.arc(-6, -3, 5, 0, 6.283); c.arc(6, -3, 5, 0, 6.283); c.fill();
            c.fillStyle = '#111'; c.beginPath(); c.arc(-5, -2, 2.4, 0, 6.283); c.arc(7, -2, 2.4, 0, 6.283); c.fill();
            c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(-6, 7); c.lineTo(-3, 4); c.lineTo(0, 7); c.lineTo(3, 4); c.lineTo(6, 7); c.stroke();
            c.restore();
          }
        });
        if (jetT > 0) { c.fillStyle = '#64748b'; c.fillRect(p.x - p.face * 14 - 4, p.y - 6, 8, 18); }
        // герой
        var sq = p.sq * 0.25, sx2 = 1 + sq, sy2 = 1 - sq;
        c.save(); c.translate(p.x, p.y + R); c.scale(p.face * sx2, sy2);
        c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(0, 2, 12, 3, 0, 0, 6.283); c.fill();
        c.strokeStyle = '#ea580c'; c.lineWidth = 3.5; c.lineCap = 'round';
        c.beginPath(); c.moveTo(-6, -6); c.lineTo(-8, 0); c.lineTo(-11, 0.5); c.moveTo(6, -6); c.lineTo(8, 0); c.lineTo(11, 0.5); c.stroke();
        var bg = c.createRadialGradient(-4, -R * 1.6, 2, 0, -R, R * 1.35);
        bg.addColorStop(0, '#fef9c3'); bg.addColorStop(0.5, '#fde047'); bg.addColorStop(1, '#ca8a04');
        c.fillStyle = '#a16207'; c.beginPath(); c.ellipse(0, -R - 2, R + 1.2, R + 3.2, 0, 0, 6.283); c.fill();
        c.fillStyle = bg; c.beginPath(); c.ellipse(0, -R - 2, R, R + 2, 0, 0, 6.283); c.fill();
        c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(2, -R + 5, 7, 6, 0, 0, 6.283); c.fill(); // брюшко
        c.fillStyle = '#fde047'; c.strokeStyle = '#ca8a04'; c.lineWidth = 1.2; // крылышко
        var fl = p.vy < 0 ? Math.sin(t * 30) * 0.4 : 0.3;
        c.save(); c.translate(-6, -R); c.rotate(-0.4 + fl); c.beginPath(); c.ellipse(0, 3, 4.5, 7, 0, 0, 6.283); c.fill(); c.stroke(); c.restore();
        c.fillStyle = '#ca8a04'; c.beginPath(); c.moveTo(-2, -R * 2 - 3); c.quadraticCurveTo(2, -R * 2 - 10, 4, -R * 2 - 2); c.fill(); // хохолок
        var blink = (t % 3.2) < 0.12;
        if (blink) { c.strokeStyle = '#111'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, -R - 6); c.lineTo(7, -R - 6); c.moveTo(8.5, -R - 6); c.lineTo(14, -R - 6); c.stroke(); }
        else {
          c.fillStyle = '#fff'; c.beginPath(); c.arc(3, -R - 6, 4.5, 0, 6.283); c.arc(11, -R - 6, 4, 0, 6.283); c.fill();
          c.fillStyle = '#111'; c.beginPath(); c.arc(5, -R - 6 + (p.vy > 300 ? 1 : 0), 2.2, 0, 6.283); c.arc(12.5, -R - 6 + (p.vy > 300 ? 1 : 0), 2, 0, 6.283); c.fill();
          c.fillStyle = '#fff'; c.beginPath(); c.arc(4.3, -R - 7, 0.8, 0, 6.283); c.arc(11.8, -R - 7, 0.7, 0, 6.283); c.fill();
        }
        c.fillStyle = 'rgba(251,113,133,.45)'; c.beginPath(); c.arc(1, -R + 1, 2.4, 0, 6.283); c.fill();
        c.fillStyle = '#ea580c'; c.beginPath(); c.moveTo(R - 2, -R + 1); c.lineTo(R + 9, -R + 3); c.lineTo(R - 2, -R + 6); c.fill();
        c.fillStyle = '#fb923c'; c.beginPath(); c.moveTo(R - 2, -R + 1); c.lineTo(R + 9, -R + 3); c.lineTo(R - 2, -R + 3.4); c.fill();
        c.restore();
        c.restore();
        // подсказка
        if (t < 3 && maxH < 5) {
          c.fillStyle = 'rgba(255,255,255,.5)'; c.font = '800 28px system-ui, sans-serif'; c.textAlign = 'center';
          c.font = '800 15px system-ui, sans-serif'; c.fillText(api.t('jumper.tip'), W / 2, H - 40); c.textAlign = 'left';
        }
      }
    };
  }
};
