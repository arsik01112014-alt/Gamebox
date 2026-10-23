/* Гонки: уворачивайся от машин на трассе */
window.GAMES = window.GAMES || {};
window.GAMES.racing = {
  title: 'Гонки',
  desc: 'Обгоняй и не врезайся',
  hint: 'Держи палец слева или справа от машины (или веди пальцем), чтобы рулить. Обгоняй машины вплотную за бонус, собирай монеты и нитро ⚡. Скорость растёт с каждым километром.',
  d0: 'Медленный трафик, 3 жизни', d1: 'Обычный трафик', d2: 'Плотный трафик', d3: 'Час пик',
  colors: ['#334155', '#f97316'],
  controls: 'none',
  isNew3: true,
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="rcRoad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#262b34"/><stop offset=".5" stop-color="#3f4652"/><stop offset="1" stop-color="#262b34"/></linearGradient>' +
    '<linearGradient id="rcMe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a3412"/><stop offset=".5" stop-color="#fdba74"/><stop offset="1" stop-color="#9a3412"/></linearGradient>' +
    '<linearGradient id="rcB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1e3a8a"/><stop offset=".5" stop-color="#93c5fd"/><stop offset="1" stop-color="#1e3a8a"/></linearGradient>' +
    '<linearGradient id="rcG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#14532d"/><stop offset=".5" stop-color="#86efac"/><stop offset="1" stop-color="#14532d"/></linearGradient>' +
    '<linearGradient id="rcGl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dbeafe"/><stop offset="1" stop-color="#1e3a8a"/></linearGradient>' +
    '<linearGradient id="rcF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde047"/><stop offset="1" stop-color="#f97316" stop-opacity="0"/></linearGradient></defs>' +
    '<rect x="2" y="2" width="96" height="96" rx="20" fill="#166534"/><rect x="14" y="2" width="72" height="96" fill="url(#rcRoad)"/>' +
    '<path d="M11 2v96M89 2v96" stroke="#dc2626" stroke-width="5" stroke-dasharray="7 7"/><path d="M11 9v89M89 9v89" stroke="#fff" stroke-width="5" stroke-dasharray="7 7"/>' +
    '<path d="M38 4v12M38 26v12M38 48v12M38 70v12M38 92v6M62 4v12M62 26v12M62 48v12M62 70v12M62 92v6" stroke="#f5f5f0" stroke-width="3" opacity=".75"/>' +
    '<path d="M42 54 L34 26 H66 L58 54z" fill="#fef9c3" opacity=".18"/>' +
    '<path d="M45 84 l2 12 2 -12z M51 84 l2 12 2 -12z" fill="url(#rcF)"/>' +
    '<rect x="43" y="57" width="18" height="30" rx="6" fill="#000" opacity=".3"/><rect x="41" y="54" width="18" height="30" rx="6" fill="url(#rcMe)"/><path d="M44 63 L45.5 59 H54.5 L56 63z" fill="url(#rcGl)"/><rect x="44.5" y="63" width="11" height="9" rx="2" fill="#fb923c"/><rect x="48" y="54" width="1.5" height="30" fill="#fff" opacity=".8"/><rect x="50.5" y="54" width="1.5" height="30" fill="#fff" opacity=".8"/><rect x="42.5" y="54.5" width="4" height="1.6" rx=".8" fill="#fef9c3"/><rect x="53.5" y="54.5" width="4" height="1.6" rx=".8" fill="#fef9c3"/>' +
    '<rect x="22" y="17" width="16" height="28" rx="5" fill="#000" opacity=".3"/><rect x="20" y="14" width="16" height="28" rx="5" fill="url(#rcB)"/><path d="M23 22 L24 18.5 H32 L33 22z" fill="url(#rcGl)"/><rect x="21.5" y="39" width="3.5" height="1.6" fill="#dc2626"/><rect x="31" y="39" width="3.5" height="1.6" fill="#dc2626"/>' +
    '<rect x="68" y="33" width="14" height="25" rx="5" fill="#000" opacity=".3"/><rect x="66" y="30" width="14" height="25" rx="5" fill="url(#rcG)"/><path d="M68.5 37 L69.5 34 H76.5 L77.5 37z" fill="url(#rcGl)"/><rect x="67" y="52" width="3" height="1.5" fill="#dc2626"/><rect x="76" y="52" width="3" height="1.5" fill="#dc2626"/></svg>',

  create: function (api) {
    var DIFF = [{ lives: 3, dens: 0.75 }, { lives: 1, dens: 1 }, { lives: 1, dens: 1.25 }, { lives: 1, dens: 1.55 }];
    var LANES = 4, D, car, cars, items, roadX, roadW, laneW, speed, dist, spawnT, t, lives, inv, dead, deadT, steer, nitro, nitroT, coins, lines, keys;
    var CAR_COL = ['#3b82f6', '#22c55e', '#a855f7', '#eab308', '#ec4899', '#14b8a6', '#f8fafc'];
    function layout() { roadW = Math.min(api.W - 30, 420); roadX = (api.W - roadW) / 2; laneW = roadW / LANES; }
    function bolt(c, x, y, k) { c.save(); c.translate(x, y); c.scale(k, k); c.fillStyle = '#fde047'; c.strokeStyle = '#a16207'; c.lineWidth = 1; c.beginPath(); c.moveTo(2, -10); c.lineTo(-6, 2); c.lineTo(-1, 2); c.lineTo(-3, 10); c.lineTo(6, -2); c.lineTo(1, -2); c.closePath(); c.fill(); c.stroke(); c.restore(); }
    function laneX(l) { return roadX + laneW * (l + 0.5); }
    function spawn() {
      var lane = Math.floor(Math.random() * LANES);
      if (cars.some(function (c) { return c.lane === lane && c.y < 140; })) return;
      var truck = Math.random() < 0.18;
      cars.push({ lane: lane, x: laneX(lane), y: -120, w: laneW * 0.56, h: truck ? 120 : 64, v: 0.35 + Math.random() * 0.3, col: CAR_COL[Math.floor(Math.random() * CAR_COL.length)], truck: truck, passed: false, chg: Math.random() < 0.15 * api.diff ? 1 + Math.random() * 2 : 0 });
      if (Math.random() < 0.35) { var ol = (lane + 1 + Math.floor(Math.random() * (LANES - 1))) % LANES; items.push({ k: Math.random() < 0.15 ? 'nitro' : 'coin', x: laneX(ol), y: -60 }); }
    }
    var TH = 240, tile, tileKey, trees, sprCache = {};
    function mk(w, h) { var cv = document.createElement('canvas'), d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.max(1, Math.round(w * d)); cv.height = Math.max(1, Math.round(h * d)); var g = cv.getContext('2d'); g.scale(d, d); return { cv: cv, g: g }; }
    function rr(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else { r = Math.min(r, w / 2, h / 2); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); } }
    function shade(hex, k) {
      var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
      if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
      return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
    }
    function buildTile() {
      var W = api.W; tileKey = W + 'x' + roadW; sprCache = {};
      var o = mk(W, TH), g = o.g, i, x, y;
      // grass
      var gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#14532d'); gr.addColorStop(0.5, '#166534'); gr.addColorStop(1, '#14532d');
      g.fillStyle = gr; g.fillRect(0, 0, W, TH);
      for (i = 0; i < 260; i++) { x = Math.random() * W; y = Math.random() * TH; g.fillStyle = Math.random() < 0.5 ? 'rgba(34,197,94,.35)' : 'rgba(5,46,22,.35)'; g.fillRect(x, y, 1.2, 3); }
      for (i = 0; i < TH; i += 40) { g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(0, i, W, 20); }
      // shoulder
      g.fillStyle = '#57534e'; g.fillRect(roadX - 10, 0, roadW + 20, TH);
      // asphalt
      gr = g.createLinearGradient(roadX, 0, roadX + roadW, 0); gr.addColorStop(0, '#2b313b'); gr.addColorStop(0.5, '#3a414d'); gr.addColorStop(1, '#2b313b');
      g.fillStyle = gr; g.fillRect(roadX, 0, roadW, TH);
      for (i = 0; i < roadW * TH / 60; i++) { x = roadX + Math.random() * roadW; y = Math.random() * TH; g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.18)'; g.fillRect(x, y, 1.3, 1.3); }
      // tyre wear lanes
      for (var l = 0; l < LANES; l++) { var lx = roadX + laneW * (l + 0.5); g.fillStyle = 'rgba(0,0,0,.07)'; g.fillRect(lx - laneW * 0.24, 0, laneW * 0.1, TH); g.fillRect(lx + laneW * 0.14, 0, laneW * 0.1, TH); }
      // patches / cracks
      for (i = 0; i < 3; i++) { x = roadX + Math.random() * (roadW - 40); y = Math.random() * (TH - 40); g.fillStyle = 'rgba(0,0,0,.05)'; g.beginPath(); g.ellipse(x + 20, y + 14, 12 + Math.random() * 18, 7 + Math.random() * 10, Math.random() * 3, 0, 6.283); g.fill(); }
      g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1;
      for (i = 0; i < 3; i++) { x = roadX + Math.random() * roadW; y = Math.random() * TH; g.beginPath(); g.moveTo(x, y); for (var k = 0; k < 4; k++) { x += (Math.random() - 0.5) * 14; y += 6 + Math.random() * 8; g.lineTo(x, y); } g.stroke(); }
      // lane dashes (spacing 80 -> 3 per tile)
      for (l = 1; l < LANES; l++) for (y = 0; y < TH; y += 80) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(roadX + l * laneW - 2, y + 1, 4, 44); g.fillStyle = 'rgba(245,245,240,.85)'; g.fillRect(roadX + l * laneW - 2, y, 4, 44); }
      // edge lines
      g.fillStyle = '#f5f5f0'; g.fillRect(roadX + 3, 0, 3, TH); g.fillRect(roadX + roadW - 6, 0, 3, TH);
      // kerbs
      for (y = 0; y < TH; y += 24) { g.fillStyle = (y / 24) % 2 ? '#f8fafc' : '#dc2626'; g.fillRect(roadX - 6, y, 6, 24); g.fillRect(roadX + roadW, y, 6, 24); }
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(roadX - 6, 0, 1, TH); g.fillRect(roadX + roadW + 5, 0, 1, TH);
      // barrier posts on grass
      for (y = 12; y < TH; y += 60) [roadX - 13, roadX + roadW + 10].forEach(function (bx) { if (bx < 0 || bx > W - 3) return; g.fillStyle = '#e2e8f0'; g.fillRect(bx, y, 3, 8); g.fillStyle = '#f97316'; g.fillRect(bx, y + 1, 3, 2); });
      tile = o.cv;
      // trees sprite
      var to = mk(70, 70), tg = to.g;
      tg.fillStyle = 'rgba(0,0,0,.3)'; tg.beginPath(); tg.arc(40, 40, 28, 0, 6.283); tg.fill();
      [[35, 35, 26, '#14532d'], [30, 30, 20, '#15803d'], [27, 26, 12, '#22c55e']].forEach(function (b) { tg.fillStyle = b[3]; tg.beginPath(); tg.arc(b[0], b[1], b[2], 0, 6.283); tg.fill(); });
      for (i = 0; i < 14; i++) { tg.fillStyle = 'rgba(134,239,172,.35)'; tg.beginPath(); tg.arc(20 + Math.random() * 28, 16 + Math.random() * 28, 2 + Math.random() * 2, 0, 6.283); tg.fill(); }
      trees = to.cv;
    }
    function carSprite(w, h, col, me, truck) {
      var key = col + '|' + Math.round(w) + '|' + h + '|' + (me ? 1 : 0) + (truck ? 1 : 0);
      if (sprCache[key]) return sprCache[key];
      var P = 8, o = mk(w + P * 2, h + P * 2), g = o.g, x = P, y = P, gr;
      var dk = shade(col, -0.45), li = shade(col, 0.45);
      // wheels
      g.fillStyle = '#0a0a0a';
      [0.2, truck ? 0.55 : 0.78, truck ? 0.85 : -1].forEach(function (f) { if (f < 0) return; rr(g, x - 2.5, y + h * f - 7, 6, 14, 2); g.fill(); rr(g, x + w - 3.5, y + h * f - 7, 6, 14, 2); g.fill(); });
      if (truck) {
        // cargo box
        gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, '#94a3b8'); gr.addColorStop(0.5, '#f1f5f9'); gr.addColorStop(1, '#94a3b8');
        g.fillStyle = gr; rr(g, x, y + h * 0.3, w, h * 0.7, 4); g.fill();
        g.strokeStyle = 'rgba(71,85,105,.5)'; g.lineWidth = 1;
        for (var rb = 1; rb < 8; rb++) { g.beginPath(); g.moveTo(x + 2, y + h * 0.3 + rb * h * 0.7 / 8); g.lineTo(x + w - 2, y + h * 0.3 + rb * h * 0.7 / 8); g.stroke(); }
        g.fillStyle = col; g.fillRect(x + 3, y + h * 0.55, w - 6, 6);
        g.fillStyle = '#ef4444'; g.fillRect(x + 2, y + h - 4, 6, 3); g.fillRect(x + w - 8, y + h - 4, 6, 3);
        // cab
        gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, dk); gr.addColorStop(0.45, li); gr.addColorStop(1, dk);
        g.fillStyle = gr; rr(g, x + 1, y, w - 2, h * 0.28, w * 0.22); g.fill();
        gr = g.createLinearGradient(0, y + h * 0.12, 0, y + h * 0.24); gr.addColorStop(0, '#bfdbfe'); gr.addColorStop(1, '#1e3a8a');
        g.fillStyle = gr; rr(g, x + w * 0.15, y + h * 0.13, w * 0.7, h * 0.1, 3); g.fill();
        g.fillStyle = '#fef9c3'; g.fillRect(x + 4, y + 1, w * 0.2, 3); g.fillRect(x + w * 0.8 - 4, y + 1, w * 0.2, 3);
        sprCache[key] = o.cv; return o.cv;
      }
      // body
      gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, dk); gr.addColorStop(0.25, col); gr.addColorStop(0.5, li); gr.addColorStop(0.75, col); gr.addColorStop(1, dk);
      g.fillStyle = gr; rr(g, x, y, w, h, w * 0.3); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; rr(g, x + 0.5, y + 0.5, w - 1, h - 1, w * 0.3); g.stroke();
      // hood lines
      g.strokeStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.moveTo(x + w * 0.3, y + 4); g.lineTo(x + w * 0.25, y + h * 0.28); g.moveTo(x + w * 0.7, y + 4); g.lineTo(x + w * 0.75, y + h * 0.28); g.stroke();
      // windshield
      gr = g.createLinearGradient(0, y + h * 0.26, 0, y + h * 0.42); gr.addColorStop(0, '#dbeafe'); gr.addColorStop(0.5, '#60a5fa'); gr.addColorStop(1, '#1e3a8a');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x + w * 0.16, y + h * 0.42); g.lineTo(x + w * 0.22, y + h * 0.27); g.lineTo(x + w * 0.78, y + h * 0.27); g.lineTo(x + w * 0.84, y + h * 0.42); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(x + w * 0.3, y + h * 0.28); g.lineTo(x + w * 0.42, y + h * 0.28); g.lineTo(x + w * 0.32, y + h * 0.4); g.lineTo(x + w * 0.24, y + h * 0.4); g.closePath(); g.fill();
      // roof
      gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, col); gr.addColorStop(0.5, li); gr.addColorStop(1, col);
      g.fillStyle = gr; rr(g, x + w * 0.17, y + h * 0.42, w * 0.66, h * 0.28, 4); g.fill();
      // rear window
      g.fillStyle = '#1e293b'; g.beginPath(); g.moveTo(x + w * 0.2, y + h * 0.71); g.lineTo(x + w * 0.8, y + h * 0.71); g.lineTo(x + w * 0.75, y + h * 0.8); g.lineTo(x + w * 0.25, y + h * 0.8); g.closePath(); g.fill();
      g.fillStyle = 'rgba(147,197,253,.35)'; g.fillRect(x + w * 0.3, y + h * 0.72, w * 0.15, h * 0.03);
      // mirrors
      g.fillStyle = dk; g.fillRect(x - 3, y + h * 0.33, 4, 5); g.fillRect(x + w - 1, y + h * 0.33, 4, 5);
      if (me) { g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(x + w * 0.4, y + 2, w * 0.07, h * 0.25); g.fillRect(x + w * 0.53, y + 2, w * 0.07, h * 0.25); g.fillRect(x + w * 0.4, y + h * 0.82, w * 0.07, h * 0.16); g.fillRect(x + w * 0.53, y + h * 0.82, w * 0.07, h * 0.16); }
      // lights
      g.fillStyle = '#fef9c3'; rr(g, x + w * 0.1, y + 1.5, w * 0.22, 4, 2); g.fill(); rr(g, x + w * 0.68, y + 1.5, w * 0.22, 4, 2); g.fill();
      g.fillStyle = '#dc2626'; rr(g, x + w * 0.1, y + h - 5, w * 0.22, 3.5, 1.5); g.fill(); rr(g, x + w * 0.68, y + h - 5, w * 0.22, 3.5, 1.5); g.fill();
      sprCache[key] = o.cv; return o.cv;
    }
    function drawCar(c, x, y, w, h, col, me, truck) {
      c.fillStyle = 'rgba(0,0,0,.35)'; rr(c, x - w / 2 + 4, y - h / 2 + 6, w, h, w * 0.3); c.fill();
      c.drawImage(carSprite(w, h, col, me, truck), x - w / 2 - 8, y - h / 2 - 8, w + 16, h + 16);
    }
    return {
      reset: function () {
        D = DIFF[api.diff]; layout(); t = 0; cars = []; items = []; dist = 0; speed = 320; spawnT = 1; lives = D.lives; inv = 0; dead = false; deadT = 0;
        steer = null; nitro = 1; nitroT = 0; coins = 0; lines = 0; keys = {};
        car = { x: laneX(1.5), y: api.H - 110, w: laneW * 0.56, h: 66, tx: laneX(1.5) };
      },
      resize: function () { layout(); car.y = api.H - 110; },
      idle: function (dt) { t += dt; lines += dt * 200; },
      key: function (k, d) { keys[k] = d; if (d && (k === 'a' || k === 'up') && nitro > 0 && nitroT <= 0) { nitro--; nitroT = 3; api.sound('bonus'); } },
      input: function (type, d) {
        if (type === 'down' && Math.hypot(d.x - (api.W - 44), d.y - 50) < 40) { if (nitro > 0 && nitroT <= 0) { nitro--; nitroT = 3; api.sound('bonus'); } return; }
        if (type === 'down' || type === 'move') steer = d.x;
        else if (type === 'up') steer = null;
      },
      update: function (dt) {
        t += dt;
        if (dead) { deadT -= dt; if (deadT <= 0) api.gameOver(); return; }
        if (inv > 0) inv -= dt;
        if (nitroT > 0) nitroT -= dt;
        speed = Math.min(900, 320 + dist / 30) * (nitroT > 0 ? 1.6 : 1);
        dist += speed * dt / 10;
        lines += speed * dt;
        var sc = Math.floor(dist / 10) + coins * 10;
        if (sc !== api.getScore()) api.setScore(sc);
        // руление
        var target = car.x;
        if (steer != null) target = Math.max(roadX + car.w / 2, Math.min(roadX + roadW - car.w / 2, steer));
        if (keys.left) target = car.x - 500 * dt; if (keys.right) target = car.x + 500 * dt;
        target = Math.max(roadX + car.w / 2, Math.min(roadX + roadW - car.w / 2, target));
        var mv = 700 * dt, dx = target - car.x; car.x += Math.max(-mv, Math.min(mv, dx)); car.tilt = Math.max(-0.25, Math.min(0.25, dx / 200));
        spawnT -= dt;
        if (spawnT <= 0) { spawn(); spawnT = Math.max(0.28, 1.1 - dist / 6000) / D.dens * (0.7 + Math.random() * 0.6); }
        for (var i = cars.length - 1; i >= 0; i--) {
          var o = cars[i];
          o.y += speed * (1 - o.v) * dt;
          if (o.chg) { o.chg -= dt; if (o.chg <= 0) { o.lane = Math.max(0, Math.min(LANES - 1, o.lane + (Math.random() < 0.5 ? -1 : 1))); } }
          o.x += (laneX(o.lane) - o.x) * Math.min(1, dt * 3);
          if (Math.abs(o.x - car.x) < (o.w + car.w) / 2 - 4 && Math.abs(o.y - car.y) < (o.h + car.h) / 2 - 6 && inv <= 0) {
            if (nitroT > 0) { cars.splice(i, 1); api.fx.burst(o.x, o.y, o.col, 20, 240); api.sound('break'); api.addScore(20); continue; }
            lives--; inv = 2; api.sound('hit'); api.vibrate(200); api.fx.shake(10); api.fx.flash('#ef4444', 0.3);
            api.fx.burst(car.x, car.y, '#f97316', 24, 260);
            if (lives <= 0) { dead = true; deadT = 1.2; return; }
          }
          if (!o.passed && o.y > car.y + o.h / 2) {
            o.passed = true;
            if (Math.abs(o.x - car.x) < laneW * 1.15) { coins++; api.fx.text(car.x, car.y - 50, api.t('race.close'), '#fde047', 15); api.tone(900, 0.05, 'square', 0.03); }
          }
          if (o.y > api.H + 150) cars.splice(i, 1);
        }
        for (var j = items.length - 1; j >= 0; j--) {
          var it = items[j]; it.y += speed * dt;
          if (Math.abs(it.x - car.x) < car.w / 2 + 12 && Math.abs(it.y - car.y) < car.h / 2 + 12) {
            items.splice(j, 1);
            if (it.k === 'coin') { coins++; api.sound('coin'); } else { nitro = Math.min(3, nitro + 1); api.sound('bonus'); api.fx.text(car.x, car.y - 60, '⚡+1', '#38bdf8', 16); }
            continue;
          }
          if (it.y > api.H + 40) items.splice(j, 1);
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H, q = api.quality, i, j;
        if (!tile || tileKey !== W + 'x' + roadW) buildTile();
        var off = lines % TH;
        for (var ty = off - TH; ty < H; ty += TH) c.drawImage(tile, 0, ty, W, TH);
        // headlight beams of player
        var carVis = !dead && !(inv > 0 && Math.floor(t * 10) % 2);
        if (carVis) {
        var bl = c.createLinearGradient(0, car.y - car.h / 2 - 120, 0, car.y - car.h / 2);
        bl.addColorStop(0, 'rgba(254,249,195,0)'); bl.addColorStop(1, 'rgba(254,249,195,' + (q > 0 ? 0.22 : 0.12) + ')');
        c.fillStyle = bl; c.beginPath(); c.moveTo(car.x - car.w * 0.4, car.y - car.h / 2); c.lineTo(car.x - car.w * 0.9, car.y - car.h / 2 - 120); c.lineTo(car.x + car.w * 0.9, car.y - car.h / 2 - 120); c.lineTo(car.x + car.w * 0.4, car.y - car.h / 2); c.fill();
        }
        items.forEach(function (it) {
          if (it.k === 'coin') {
            var sx = Math.abs(Math.cos(t * 4 + it.x)) * 0.8 + 0.2;
            c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(it.x + 3, it.y + 5, 11 * sx, 10, 0, 0, 6.283); c.fill();
            c.save(); c.translate(it.x, it.y); c.scale(sx, 1);
            var cg = c.createRadialGradient(-4, -4, 1, 0, 0, 12); cg.addColorStop(0, '#fef9c3'); cg.addColorStop(0.5, '#facc15'); cg.addColorStop(1, '#ca8a04');
            c.fillStyle = '#a16207'; c.beginPath(); c.arc(0, 0, 12, 0, 6.283); c.fill();
            c.fillStyle = cg; c.beginPath(); c.arc(0, 0, 10.5, 0, 6.283); c.fill();
            c.strokeStyle = 'rgba(161,98,7,.7)'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, 7, 0, 6.283); c.stroke();
            c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.ellipse(-4, -5, 3, 1.6, -0.6, 0, 6.283); c.fill();
            c.restore();
          } else {
            var pu = 1 + Math.sin(t * 6) * 0.08;
            if (q > 0) { var ng = c.createRadialGradient(it.x, it.y, 4, it.x, it.y, 30); ng.addColorStop(0, 'rgba(56,189,248,.55)'); ng.addColorStop(1, 'rgba(56,189,248,0)'); c.fillStyle = ng; c.fillRect(it.x - 30, it.y - 30, 60, 60); }
            c.save(); c.translate(it.x, it.y); c.scale(pu, pu);
            var og = c.createRadialGradient(-4, -5, 1, 0, 0, 15); og.addColorStop(0, '#e0f2fe'); og.addColorStop(0.45, '#0ea5e9'); og.addColorStop(1, '#075985');
            c.fillStyle = og; c.beginPath(); c.arc(0, 0, 14, 0, 6.283); c.fill();
            c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.5; c.stroke();
            bolt(c, 0, 1, 1); c.restore();
          }
        });
        cars.forEach(function (o) { drawCar(c, o.x, o.y, o.w, o.h, o.col, false, o.truck); });
        if (!(inv > 0 && Math.floor(t * 10) % 2)) {
          c.save(); c.translate(car.x, car.y); c.rotate(car.tilt || 0);
          if (nitroT > 0) {
            var fl = 26 + Math.random() * 16;
            for (var e = -1; e <= 1; e += 2) {
              var ex = e * car.w * 0.22, ey = car.h / 2 - 2;
              if (q > 0) { var fg = c.createRadialGradient(ex, ey + 10, 1, ex, ey + 10, 26); fg.addColorStop(0, 'rgba(56,189,248,.6)'); fg.addColorStop(1, 'rgba(56,189,248,0)'); c.fillStyle = fg; c.fillRect(ex - 26, ey - 16, 52, 52); }
              c.fillStyle = '#f97316'; c.beginPath(); c.moveTo(ex - 6, ey); c.quadraticCurveTo(ex - 4, ey + fl * 0.6, ex, ey + fl); c.quadraticCurveTo(ex + 4, ey + fl * 0.6, ex + 6, ey); c.fill();
              c.fillStyle = '#fde047'; c.beginPath(); c.moveTo(ex - 4, ey); c.quadraticCurveTo(ex - 2, ey + fl * 0.45, ex, ey + fl * 0.7); c.quadraticCurveTo(ex + 2, ey + fl * 0.45, ex + 4, ey); c.fill();
              c.fillStyle = '#e0f2fe'; c.beginPath(); c.moveTo(ex - 2, ey); c.lineTo(ex, ey + fl * 0.35); c.lineTo(ex + 2, ey); c.fill();
            }
          }
          drawCar(c, 0, 0, car.w, car.h, '#f97316', true, false); c.restore();
        }
        // overhanging trees (faster parallax)
        if (q > 0 && trees) {
          var to = (lines * 1.25) % 300;
          for (j = -1; j < H / 150 + 1; j++) {
            var yy = to + j * 150 - 150;
            if (roadX > 4) { c.drawImage(trees, -42 + (j % 2) * 8, yy, 70, 70); c.drawImage(trees, W - 28 - (j % 2) * 8, yy + 75, 70, 70); }
          }
        }
        // speed lines
        var spd = (speed - 450) / 450;
        if (nitroT > 0) spd = 1;
        if (spd > 0 && q > 0) {
          c.strokeStyle = 'rgba(255,255,255,' + (0.12 + spd * 0.25) + ')'; c.lineWidth = 1.5; c.beginPath();
          for (i = 0; i < 14; i++) {
            var lx = roadX + ((i * 0.6180339) % 1) * roadW, ly = (((i * 0.3819) % 1) * (H + 200) + lines * 2.2) % (H + 200) - 100, ll = 40 + spd * 60;
            c.moveTo(lx, ly); c.lineTo(lx, ly + ll);
          }
          c.stroke();
        }
        if (nitroT > 0) {
          var vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.7);
          vg.addColorStop(0, 'rgba(56,189,248,0)'); vg.addColorStop(1, 'rgba(56,189,248,.28)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
        }
        // HUD
        c.textAlign = 'left'; c.textBaseline = 'middle'; c.font = '800 13px system-ui, sans-serif';
        var t1 = (dist / 100).toFixed(1) + ' km · ' + Math.round(speed / 4) + ' km/h', w1 = c.measureText(t1).width + 20;
        c.fillStyle = 'rgba(15,23,42,.72)'; rr(c, 8, 8, w1, 24, 12); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; c.stroke();
        c.fillStyle = '#fff'; c.fillText(t1, 18, 20.5);
        var sw = Math.min(1, speed / 900); c.fillStyle = 'rgba(255,255,255,.12)'; rr(c, 18, 27, w1 - 20, 2.5, 1.2); c.fill();
        c.fillStyle = nitroT > 0 ? '#38bdf8' : '#f97316'; rr(c, 18, 27, (w1 - 20) * sw, 2.5, 1.2); c.fill();
        var t2 = String(coins) + (D.lives > 1 ? '   ' + '❤'.repeat(Math.max(0, lives)) : ''), w2 = c.measureText(t2).width + 40;
        c.fillStyle = 'rgba(15,23,42,.72)'; rr(c, 8, 36, w2, 24, 12); c.fill();
        var cg2 = c.createRadialGradient(20, 46, 1, 22, 48, 7); cg2.addColorStop(0, '#fef9c3'); cg2.addColorStop(1, '#ca8a04');
        c.fillStyle = cg2; c.beginPath(); c.arc(22, 48, 6.5, 0, 6.283); c.fill();
        c.fillStyle = '#fff'; c.fillText(t2, 34, 48.5);
        // nitro button
        var nx = W - 44, ny = 50, on = nitro > 0;
        c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.arc(nx + 2, ny + 3, 30, 0, 6.283); c.fill();
        var bgN = c.createRadialGradient(nx - 10, ny - 12, 2, nx, ny, 30);
        if (on) { bgN.addColorStop(0, '#7dd3fc'); bgN.addColorStop(0.6, '#0284c7'); bgN.addColorStop(1, '#0c4a6e'); } else { bgN.addColorStop(0, 'rgba(148,163,184,.5)'); bgN.addColorStop(1, 'rgba(30,41,59,.6)'); }
        c.fillStyle = bgN; c.beginPath(); c.arc(nx, ny, 30, 0, 6.283); c.fill();
        c.strokeStyle = on ? 'rgba(224,242,254,.85)' : 'rgba(255,255,255,.2)'; c.lineWidth = 2; c.beginPath(); c.arc(nx, ny, 27, 0, 6.283); c.stroke();
        if (nitroT > 0) { c.strokeStyle = '#fde047'; c.lineWidth = 3.5; c.beginPath(); c.arc(nx, ny, 30, -Math.PI / 2, -Math.PI / 2 + 6.283 * (nitroT / 3)); c.stroke(); }
        c.save(); c.translate(nx - 8, ny); bolt(c, 0, 0, 1.05); c.restore();
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '900 20px system-ui, sans-serif'; c.fillText(String(nitro), nx + 10, ny + 1);
        c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.globalAlpha = 1;
      }
    };
  }
};
