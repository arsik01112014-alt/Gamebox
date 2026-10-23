/* Flappy Bird */
window.GAMES = window.GAMES || {};
window.GAMES.flappy = {
  title: 'Flappy Bird',
  desc: 'Пролети между трубами',
  hint: 'Тапай по экрану, чтобы птичка взмахнула крыльями. Пролетай между трубами и не касайся земли!',
  colors: ['#f59e0b', '#ef4444'],
  controls: 'none',
  keyAsTap: true,
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="flappyP" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4ade80"/><stop offset="1" stop-color="#15803d"/></linearGradient><radialGradient id="flappyB" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fef9c3"/><stop offset="1" stop-color="#f59e0b"/></radialGradient></defs><rect x="68" y="0" width="22" height="34" rx="3" fill="url(#flappyP)" stroke="#052e16" stroke-width="2"/><rect x="64" y="28" width="30" height="10" rx="3" fill="url(#flappyP)" stroke="#052e16" stroke-width="2"/>' +
    '<rect x="68" y="72" width="22" height="28" rx="3" fill="url(#flappyP)" stroke="#052e16" stroke-width="2"/><rect x="64" y="66" width="30" height="10" rx="3" fill="url(#flappyP)" stroke="#052e16" stroke-width="2"/>' +
    '<ellipse cx="40" cy="52" rx="25" ry="21" fill="url(#flappyB)" stroke="#7c2d12" stroke-width="3"/>' +
    '<ellipse cx="30" cy="58" rx="12" ry="8" fill="#fef3c7" stroke="#7c2d12" stroke-width="2.5"/>' +
    '<circle cx="50" cy="43" r="8" fill="#fff" stroke="#7c2d12" stroke-width="2.5"/><circle cx="53" cy="43" r="3.3" fill="#111"/>' +
    '<path d="M56 54 h14 q4 3 0 6 h-14z" fill="#f97316" stroke="#7c2d12" stroke-width="2.5"/></svg>',

  create: function (api) {
    var s, bird, pipes, groundH, groundX, t, dead, deadT, speed, gap, pw, spacing, clouds, hills, flash, passed, D, city, fx;
    var items, shield, dayK, stars, coinsN; // v2.0: монеты, щит, смена дня и ночи
    var DIFF = [
      { gap: 215, speed: 130, grav: 1250, max: 200, min: 170, move: 0 },
      { gap: 175, speed: 150, grav: 1450, max: 260, min: 125, move: 0 },
      { gap: 150, speed: 175, grav: 1550, max: 290, min: 115, move: 0 },
      { gap: 165, speed: 165, grav: 1500, max: 280, min: 130, move: 48 }
    ];

    function rnd(a, b) { return a + Math.random() * (b - a); }

    function flap() {
      if (dead) return;
      bird.vy = -430 * s;
      bird.flapT = 0.25;
      api.sound('flap');
    }

    function addPipe(x) {
      var top = 70 * s, bot = api.H - groundH - 70 * s;
      var g = Math.max(gap - passed * 1.2 * s, D.min * s);
      var cy = rnd(top + g / 2, bot - g / 2);
      if (pipes.length) { // плавнее разброс высот
        var prev = pipes[pipes.length - 1].cy, lim = 210 * s;
        cy = Math.max(prev - lim, Math.min(prev + lim, cy));
      }
      var mv = D.move * s;
      if (mv) cy = Math.max(top + g / 2 + mv, Math.min(bot - g / 2 - mv, cy));
      pipes.push({ x: x, cy: cy, cy0: cy, ph: Math.random() * 6.283, g: g, done: false });
      // между трубами иногда висят монеты, изредка — щит
      if (passed > 2 && Math.random() < 0.45) items.push({ x: x + pw + spacing / 2, y: cy + rnd(-g * 0.25, g * 0.25), k: 'coin', got: false });
      else if (passed > 6 && !shield && Math.random() < 0.08) items.push({ x: x + pw + spacing / 2, y: cy, k: 'shield', got: false });
    }

    function hitTest() {
      var r = 13 * s;
      if (bird.y + r >= api.H - groundH) return true;
      for (var i = 0; i < pipes.length; i++) {
        var p = pipes[i];
        if (bird.x + r < p.x - 3 * s || bird.x - r > p.x + pw + 3 * s) continue;
        var topB = p.cy - p.g / 2, botT = p.cy + p.g / 2;
        // ближайшая точка прямоугольника к центру круга
        var nx = Math.max(p.x, Math.min(bird.x, p.x + pw));
        if (bird.y - r < topB) { var ny = Math.min(bird.y, topB); if ((bird.x - nx) * (bird.x - nx) + (bird.y - ny) * (bird.y - ny) < r * r) return true; }
        if (bird.y + r > botT) { var ny2 = Math.max(bird.y, botT); if ((bird.x - nx) * (bird.x - nx) + (bird.y - ny2) * (bird.y - ny2) < r * r) return true; }
      }
      return false;
    }

    function scenery(dt) {
      groundX = (groundX + speed * dt) % (24 * s);
      for (var i = 0; i < clouds.length; i++) {
        var cl = clouds[i];
        cl.x -= speed * 0.15 * cl.k * dt;
        if (cl.x < -120 * s) { cl.x = api.W + rnd(0, 100) * s; cl.y = rnd(30, api.H * 0.45 / s) * s; }
      }
      hills.off = (hills.off + speed * 0.3 * dt);
    }

    function genCity() {
      city = []; var x = 0;
      while (x < 640) {
        var w = rnd(28, 58), h = rnd(50, 150);
        var win = [];
        for (var wy = 10; wy < h - 8; wy += 13) for (var wx = 6; wx < w - 8; wx += 11) if (Math.random() < 0.55) win.push([wx, wy]);
        city.push({ x: x, w: w, h: h, win: win, ant: Math.random() < 0.25 });
        x += w + rnd(2, 8);
      }
      city.len = x;
    }
    function drawCity(c, gy) {
      var off = (hills.off * 0.5) % (city.len * s), Hc = 170 * s;
      if (cityDay) {
        for (var rp = 0; rp < 3; rp++) {
          var bx = rp * city.len * s - off;
          if (bx > api.W || bx + city.len * s < 0) continue;
          c.drawImage(cityDay, bx, gy - Hc, city.len * s, Hc);
          if (dayK > 0.01) { c.globalAlpha = dayK; c.drawImage(cityNight, bx, gy - Hc, city.len * s, Hc); c.globalAlpha = 1; }
        }
        return;
      }
      for (var rep2 = 0; rep2 < 3; rep2++) {
        var base = rep2 * city.len * s - off;
        for (var i = 0; i < city.length; i++) {
          var b = city[i], x = base + b.x * s, w = b.w * s, h = b.h * s;
          if (x > api.W || x + w < 0) continue;
          c.fillStyle = '#93c5fd'; c.fillRect(x, gy - h, w, h);
          c.fillStyle = '#bfdbfe'; c.fillRect(x, gy - h, w * 0.18, h);
          if (b.ant) { c.fillRect(x + w / 2 - s, gy - h - 14 * s, 2 * s, 14 * s); }
          c.fillStyle = 'rgba(255,255,255,.75)';
          for (var k = 0; k < b.win.length; k++) c.fillRect(x + b.win[k][0] * s, gy - h + b.win[k][1] * s, 5 * s, 6 * s);
        }
      }
    }
    /* ---- пререндер: облако, город (день/ночь), земля ---- */
    var cloudOff, cityDay, cityNight, groundOff, offW = 0, offH = 0;
    function mk(w, h) {
      var d = Math.min(2, window.devicePixelRatio || 1), o = document.createElement('canvas');
      o.width = Math.max(1, Math.ceil(w * d)); o.height = Math.max(1, Math.ceil(h * d));
      var c = o.getContext('2d'); c.scale(d, d); o.c = c; return o;
    }
    function buildOff() {
      offW = api.W; offH = api.H;
      // облако 100x60 (масштаб 1), рисуем в 2x для чёткости
      var o = mk(200, 120), c = o.c; c.scale(2, 2);
      function blob() { c.beginPath(); c.arc(28, 36, 20, 0, 6.283); c.arc(50, 26, 24, 0, 6.283); c.arc(74, 36, 18, 0, 6.283); c.arc(40, 42, 16, 0, 6.283); c.arc(62, 42, 16, 0, 6.283); c.rect(28, 36, 46, 18); }
      blob(); c.fillStyle = '#c7dff5'; c.fill();
      c.save(); c.translate(0, -4); blob(); var cg = c.createLinearGradient(0, 4, 0, 52); cg.addColorStop(0, '#ffffff'); cg.addColorStop(1, '#eef6ff'); c.fillStyle = cg; c.fill(); c.restore();
      c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(46, 18, 9, 0, 6.283); c.arc(30, 28, 6, 0, 6.283); c.fill();
      cloudOff = o;
      // город
      var L = city.len * s, Hc = 170 * s;
      function cityStrip(night) {
        var o2 = mk(L, Hc), q = o2.c;
        for (var i = 0; i < city.length; i++) {
          var b = city[i], x = b.x * s, w = b.w * s, h = b.h * s, y = Hc - h;
          var g = q.createLinearGradient(x, 0, x + w, 0);
          if (night) { g.addColorStop(0, '#334155'); g.addColorStop(1, '#1e293b'); } else { g.addColorStop(0, '#bfdbfe'); g.addColorStop(0.2, '#93c5fd'); g.addColorStop(1, '#7cb2f0'); }
          q.fillStyle = g; q.fillRect(x, y, w, h);
          q.fillStyle = night ? '#475569' : '#dbeafe'; q.fillRect(x - 1.5 * s, y, w + 3 * s, 4 * s); // карниз
          q.fillStyle = night ? 'rgba(0,0,0,.25)' : 'rgba(30,64,175,.12)'; q.fillRect(x, y + 4 * s, w, 3 * s);
          if (b.ant) {
            q.fillStyle = night ? '#475569' : '#bfdbfe'; q.fillRect(x + w / 2 - s, y - 14 * s, 2 * s, 14 * s);
            q.fillStyle = '#ef4444'; q.beginPath(); q.arc(x + w / 2, y - 14 * s, 2 * s, 0, 6.283); q.fill();
          }
          for (var k = 0; k < b.win.length; k++) {
            var wx = x + b.win[k][0] * s, wy = y + b.win[k][1] * s;
            if (night) { q.fillStyle = (k * 7 + i) % 3 ? '#fde68a' : 'rgba(253,230,138,.35)'; q.fillRect(wx, wy, 5 * s, 6 * s); }
            else {
              q.fillStyle = 'rgba(30,64,175,.25)'; q.fillRect(wx, wy + 1, 5 * s, 6 * s);
              q.fillStyle = 'rgba(255,255,255,.85)'; q.fillRect(wx, wy, 5 * s, 6 * s);
              q.fillStyle = 'rgba(147,197,253,.7)'; q.fillRect(wx + 2.5 * s, wy + 3 * s, 2.5 * s, 3 * s);
            }
          }
        }
        // дымка у земли
        var hz = q.createLinearGradient(0, Hc * 0.5, 0, Hc);
        hz.addColorStop(0, 'rgba(255,255,255,0)'); hz.addColorStop(1, night ? 'rgba(76,29,149,.35)' : 'rgba(224,242,254,.55)');
        q.globalCompositeOperation = 'source-atop'; q.fillStyle = hz; q.fillRect(0, 0, L, Hc); q.globalCompositeOperation = 'source-over';
        return o2;
      }
      cityDay = cityStrip(false); cityNight = cityStrip(true);
      // земля: тайл 24s повторяется
      var tw = 24 * s, GW = Math.ceil(api.W / tw + 2) * tw;
      var go = mk(GW, groundH), gq = go.c;
      var sg = gq.createLinearGradient(0, 0, 0, groundH);
      sg.addColorStop(0, '#e9e1a3'); sg.addColorStop(1, '#c9b56a');
      gq.fillStyle = sg; gq.fillRect(0, 0, GW, groundH);
      for (var gx = 0; gx < GW; gx += tw) {
        gq.fillStyle = '#65a30d'; gq.fillRect(gx, 0, tw, 14 * s);
        gq.fillStyle = '#84cc16';
        gq.beginPath(); gq.moveTo(gx, 14 * s); gq.lineTo(gx + 12 * s, 0); gq.lineTo(gx + 24 * s, 0); gq.lineTo(gx + 12 * s, 14 * s); gq.fill();
        gq.fillStyle = 'rgba(255,255,255,.18)'; gq.fillRect(gx + 12 * s, 0, 12 * s, 2 * s);
        // камешки (периодичные)
        for (var pi = 0; pi < 3; pi++) {
          var px = gx + ((pi * 9 + 4) % 24) * s, py = (24 + pi * 14) * s;
          if (py > groundH - 4) continue;
          gq.fillStyle = 'rgba(120,90,40,.28)'; gq.beginPath(); gq.ellipse(px, py, (2 + pi) * s, (1.3 + pi * 0.5) * s, 0, 0, 6.283); gq.fill();
          gq.fillStyle = 'rgba(255,255,255,.35)'; gq.fillRect(px - s, py - s, s, s);
        }
      }
      gq.fillStyle = '#3f6212'; gq.fillRect(0, 0, GW, 3);
      gq.fillStyle = '#b8a35a'; gq.fillRect(0, 14 * s, GW, 4 * s);
      gq.fillStyle = 'rgba(0,0,0,.12)'; gq.fillRect(0, 18 * s, GW, 2 * s);
      groundOff = go;
    }
    function puff(x, y, col, n, sp) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.283, v = rnd(30, sp || 160) * s;
        fx.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40 * s, life: rnd(0.5, 1), rot: Math.random() * 6, col: col, kind: 'f' });
      }
    }

    function drawPipe(c, x, y, w, h, isTop) {
      if (h <= 0) return;
      var g = c.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, '#15803d'); g.addColorStop(0.25, '#4ade80'); g.addColorStop(0.55, '#22c55e'); g.addColorStop(1, '#14532d');
      c.fillStyle = g; c.fillRect(x, y, w, h);
      c.strokeStyle = '#052e16'; c.lineWidth = 2.5; c.strokeRect(x, y, w, h);
      var lh = 26 * s, lx = x - 5 * s, lw = w + 10 * s, ly = isTop ? y + h - lh : y;
      var g2 = c.createLinearGradient(lx, 0, lx + lw, 0);
      g2.addColorStop(0, '#166534'); g2.addColorStop(0.25, '#86efac'); g2.addColorStop(0.55, '#22c55e'); g2.addColorStop(1, '#14532d');
      c.fillStyle = g2; c.fillRect(lx, ly, lw, lh);
      c.strokeRect(lx, ly, lw, lh);
      // блики и заклёпки
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x + w * 0.16, y, w * 0.06, h);
      c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(x + w * 0.78, y, w * 0.1, h);
      c.fillStyle = '#14532d';
      for (var r = 0; r < 4; r++) { c.beginPath(); c.arc(lx + lw * (0.15 + r * 0.233), ly + lh / 2, 2 * s, 0, 6.283); c.fill(); }
      c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x, isTop ? ly - 6 * s : ly + lh, w, 6 * s);
    }

    function drawBird(c) {
      var r = 15 * s;
      c.save();
      c.translate(bird.x, bird.y);
      c.rotate(bird.rot);
      c.lineWidth = 2.5 * s; c.strokeStyle = '#7c2d12';
      // тело
      var g = c.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.2, 0, 0, r * 1.2);
      g.addColorStop(0, '#fef08a'); g.addColorStop(1, '#f59e0b');
      c.fillStyle = g;
      c.beginPath(); c.ellipse(0, 0, r * 1.18, r, 0, 0, 6.283); c.fill(); c.stroke();
      // хвост
      c.fillStyle = '#f59e0b';
      c.beginPath(); c.moveTo(-r * 1.0, -r * 0.1); c.lineTo(-r * 1.65, -r * 0.45); c.lineTo(-r * 1.5, r * 0.05); c.lineTo(-r * 1.7, r * 0.35); c.lineTo(-r * 1.0, r * 0.25); c.closePath(); c.fill(); c.stroke();
      // брюшко
      c.fillStyle = '#fde68a'; c.beginPath(); c.ellipse(-r * 0.1, r * 0.45, r * 0.75, r * 0.45, 0, 0, 6.283); c.fill();
      // крыло
      var wa = bird.flapT > 0 ? Math.sin(bird.flapT * 40) * 0.6 : Math.sin(t * 14) * 0.25;
      c.save(); c.translate(-r * 0.45, r * 0.05); c.rotate(wa);
      c.fillStyle = '#fffbeb'; c.beginPath(); c.ellipse(0, 0, r * 0.6, r * 0.38, 0, 0, 6.283); c.fill(); c.stroke();
      c.restore();
      // глаз
      c.fillStyle = '#fff'; c.beginPath(); c.arc(r * 0.5, -r * 0.35, r * 0.42, 0, 6.283); c.fill(); c.stroke();
      if (t % 3.2 < 0.13 && !dead) { c.fillStyle = '#f59e0b'; c.beginPath(); c.arc(r * 0.5, -r * 0.35, r * 0.42, 0, 6.283); c.fill(); c.stroke(); }
      else if (dead) { c.strokeStyle = '#111'; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(r * 0.38, -r * 0.5); c.lineTo(r * 0.72, -r * 0.18); c.moveTo(r * 0.72, -r * 0.5); c.lineTo(r * 0.38, -r * 0.18); c.stroke(); c.strokeStyle = '#7c2d12'; c.lineWidth = 2.5 * s; }
      else {
        c.fillStyle = '#111'; c.beginPath(); c.arc(r * 0.65, -r * 0.33, r * 0.17, 0, 6.283); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(r * 0.7, -r * 0.4, r * 0.06, 0, 6.283); c.fill();
      }
      c.fillStyle = 'rgba(244,114,182,.55)'; c.beginPath(); c.ellipse(r * 0.35, r * 0.2, r * 0.2, r * 0.12, 0, 0, 6.283); c.fill();
      // клюв
      c.fillStyle = '#f97316';
      c.beginPath(); c.moveTo(r * 0.7, r * 0.05); c.lineTo(r * 1.55, r * 0.18); c.lineTo(r * 0.7, r * 0.45); c.closePath(); c.fill(); c.stroke();
      c.restore();
    }

    var self = {
      reset: function () {
        s = Math.min(api.H / 640, api.W / 360);
        groundH = Math.round(Math.max(60, api.H * 0.12));
        bird = { x: api.W * 0.3, y: api.H * 0.42, vy: 0, rot: 0, flapT: 0 };
        pipes = []; groundX = 0; t = 0; dead = false; deadT = 0; flash = 0; passed = 0;
        D = DIFF[api.diff];
        speed = D.speed * s; gap = D.gap * s; pw = 66 * s; spacing = 230 * s; fx = [];
        items = []; shield = false; dayK = 0; coinsN = 0;
        stars = []; for (var si = 0; si < 50; si++) stars.push({ x: Math.random(), y: Math.random() * 0.6, r: rnd(0.6, 1.8) });
        genCity();
        clouds = [];
        for (var i = 0; i < 6; i++) clouds.push({ x: rnd(0, api.W), y: rnd(30, api.H * 0.45 / s) * s, k: rnd(0.6, 1.4) });
        hills = { off: 0 };
        buildOff();
      },
      resize: function () { },
      begin: function () { addPipe(api.W + 80 * s); flap(); },
      idle: function (dt) {
        t += dt;
        bird.y = api.H * 0.42 + Math.sin(t * 3) * 10 * s;
        bird.rot = 0;
        scenery(dt);
      },
      input: function (type) { if (type === 'down') flap(); },
      key: function () { },
      update: function (dt) {
        t += dt;
        if (flash > 0) flash -= dt;
        bird.flapT = Math.max(0, bird.flapT - dt);
        bird.vy = Math.min(bird.vy + D.grav * s * dt, 900 * s);
        for (var q = fx.length - 1; q >= 0; q--) { var f = fx[q]; if (f.kind !== 'ring') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 300 * s * dt; f.vx *= 0.97; f.rot += dt * 5; } f.life -= dt; if (f.life <= 0) fx.splice(q, 1); }
        bird.y += bird.vy * dt;
        if (bird.y < 15 * s) { bird.y = 15 * s; bird.vy = 0; }
        var target = bird.vy < 0 ? -0.45 : Math.min(1.45, bird.vy / (500 * s));
        bird.rot += (target - bird.rot) * Math.min(1, dt * (bird.vy < 0 ? 18 : 6));

        if (dead) {
          var floor = api.H - groundH - 13 * s;
          if (bird.y >= floor) { bird.y = floor; bird.vy = 0; }
          deadT -= dt;
          if (deadT <= 0) api.gameOver();
          return;
        }

        scenery(dt);
        for (var i = 0; i < pipes.length; i++) {
          var p = pipes[i];
          p.x -= speed * dt;
          if (D.move) p.cy = p.cy0 + Math.sin(t * 1.7 + p.ph) * D.move * s;
          if (!p.done && p.x + pw < bird.x) {
            p.done = true; passed++;
            api.addScore(1); api.sound('point');
            fx.push({ kind: 'ring', x: p.x + pw / 2, y: p.cy, r: 10 * s, life: 0.45 });
            speed = Math.min(D.max * s, speed + 2.5 * s);
          }
        }
        if (pipes.length && pipes[0].x < -pw - 20 * s) pipes.shift();
        // смена времени суток каждые 20 труб
        var phase = (passed % 40) / 20, targetK = phase < 1 ? Math.max(0, (phase - 0.7) / 0.3) : Math.max(0, 1 - (phase - 1.7) / 0.3);
        if (phase >= 1 && phase < 1.7) targetK = 1;
        dayK += (targetK - dayK) * Math.min(1, dt * 1.5);
        for (var it = items.length - 1; it >= 0; it--) {
          var o = items[it];
          o.x -= speed * dt;
          if (!o.got && Math.hypot(o.x - bird.x, o.y - bird.y) < 24 * s) {
            o.got = true;
            if (o.k === 'coin') { coinsN++; api.addScore(1); api.sound('coin'); api.fx.text(o.x, o.y - 16 * s, '+1', '#fde047', 16); puff(o.x, o.y, '#fde047', 6, 120); }
            else { shield = true; api.sound('bonus'); api.fx.text(o.x, o.y - 18 * s, api.t('fl.shield'), '#7dd3fc', 16); }
          }
          if (o.x < -40 || o.got) items.splice(it, 1);
        }
        var last = pipes[pipes.length - 1];
        if (last && last.x < api.W - spacing) addPipe(last.x + spacing);

        if (hitTest() && shield && bird.y + 13 * s < api.H - groundH) {
          // щит лопается: птичку выталкивает в центр зазора ближайшей трубы
          shield = false; flash = 0.15; api.sound('break'); api.vibrate(60); api.fx.shake(4);
          puff(bird.x, bird.y, '#7dd3fc', 16, 200);
          for (var pi2 = 0; pi2 < pipes.length; pi2++) { var pp = pipes[pi2]; if (pp.x - 20 * s < bird.x && pp.x + pw + 20 * s > bird.x) { bird.y = pp.cy; bird.vy = -120 * s; } }
        }
        if (hitTest()) {
          dead = true; api.fx.shake(7); deadT = 1.1; flash = 0.25;
          bird.vy = Math.min(bird.vy, -150 * s);
          puff(bird.x, bird.y, '#fde68a', 14, 220);
          api.sound('hit'); api.vibrate(180);
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H, gy = H - groundH;
        // небо
        var sky = c.createLinearGradient(0, 0, 0, gy);
        sky.addColorStop(0, '#38bdf8'); sky.addColorStop(0.7, '#a5f3fc'); sky.addColorStop(1, '#e0f2fe');
        c.fillStyle = sky; c.fillRect(0, 0, W, gy);
        if (dayK > 0.01) {
          var ng = c.createLinearGradient(0, 0, 0, gy);
          ng.addColorStop(0, 'rgba(15,23,42,' + dayK * 0.95 + ')'); ng.addColorStop(1, 'rgba(76,29,149,' + dayK * 0.6 + ')');
          c.fillStyle = ng; c.fillRect(0, 0, W, gy);
          c.fillStyle = '#fff';
          for (var sti = 0; sti < stars.length; sti++) { var st = stars[sti]; c.globalAlpha = dayK * (0.5 + 0.5 * Math.sin(t * 2 + sti)); c.fillRect(st.x * W, st.y * gy, st.r * s, st.r * s); }
          c.globalAlpha = 1;
        }
        // солнце
        var sunY = H * 0.13 + dayK * H * 0.05;
        if (!cloudOff || offW !== W || offH !== H) buildOff();
        var sxp = W * 0.8, night = dayK > 0.5;
        var glow = c.createRadialGradient(sxp, sunY, 20 * s, sxp, sunY, 90 * s);
        glow.addColorStop(0, night ? 'rgba(226,232,240,.3)' : 'rgba(254,240,138,.55)'); glow.addColorStop(1, 'rgba(254,240,138,0)');
        c.fillStyle = glow; c.beginPath(); c.arc(sxp, sunY, 90 * s, 0, 6.283); c.fill();
        if (!night && api.quality > 0) { // лучи
          c.save(); c.translate(sxp, sunY); c.rotate(t * 0.15); c.fillStyle = 'rgba(255,251,200,.15)';
          for (var ry = 0; ry < 10; ry++) { c.rotate(0.6283); c.beginPath(); c.moveTo(-5 * s, 38 * s); c.lineTo(5 * s, 38 * s); c.lineTo(0, 78 * s); c.closePath(); c.fill(); }
          c.restore();
        }
        var sg2 = c.createRadialGradient(sxp - 10 * s, sunY - 10 * s, 4 * s, sxp, sunY, 34 * s);
        if (night) { sg2.addColorStop(0, '#ffffff'); sg2.addColorStop(1, '#cbd5e1'); } else { sg2.addColorStop(0, '#fffbeb'); sg2.addColorStop(0.6, '#fde047'); sg2.addColorStop(1, '#fbbf24'); }
        c.fillStyle = sg2; c.beginPath(); c.arc(sxp, sunY, 34 * s, 0, 6.283); c.fill();
        if (night) { c.fillStyle = 'rgba(148,163,184,.5)'; c.beginPath(); c.arc(sxp - 10 * s, sunY - 6 * s, 7 * s, 0, 6.283); c.arc(sxp + 12 * s, sunY + 8 * s, 5 * s, 0, 6.283); c.arc(sxp + 4 * s, sunY - 16 * s, 3 * s, 0, 6.283); c.fill(); }
        // облака
        c.globalAlpha = 1 - dayK * 0.45;
        for (var i = 0; i < clouds.length; i++) {
          var cl = clouds[i], k = cl.k * s;
          c.drawImage(cloudOff, cl.x - 28 * k, cl.y - 36 * k, 100 * k, 60 * k);
        }
        c.globalAlpha = 1;
        drawCity(c, gy);
        // холмы на переднем плане
        var off = hills.off % (90 * s);
        var hg1 = c.createLinearGradient(0, gy - 70 * s, 0, gy);
        hg1.addColorStop(0, '#a7f3c0'); hg1.addColorStop(1, '#5fd88e');
        c.fillStyle = hg1;
        c.beginPath(); c.moveTo(0, gy);
        for (var x = -off; x <= W + 90 * s; x += 90 * s) {
          c.quadraticCurveTo(x + 45 * s, gy - 70 * s, x + 90 * s, gy);
        }
        c.fill();
        var hg2 = c.createLinearGradient(0, gy - 34 * s, 0, gy);
        hg2.addColorStop(0, '#4ade80'); hg2.addColorStop(1, '#16a34a');
        c.fillStyle = hg2;
        var off2 = (hills.off * 1.6) % (60 * s);
        c.beginPath(); c.moveTo(0, gy);
        for (var x2 = -off2; x2 <= W + 60 * s; x2 += 60 * s) {
          c.quadraticCurveTo(x2 + 30 * s, gy - 34 * s, x2 + 60 * s, gy);
        }
        c.fill();
        // кустики на гребнях
        c.fillStyle = 'rgba(255,255,255,.22)';
        for (var x3 = -off2; x3 <= W + 60 * s; x3 += 60 * s) { c.beginPath(); c.ellipse(x3 + 24 * s, gy - 14 * s, 6 * s, 3 * s, -0.4, 0, 6.283); c.fill(); }
        if (dayK > 0.01) { c.fillStyle = 'rgba(15,23,42,' + dayK * 0.45 + ')'; c.fillRect(0, gy - 72 * s, W, 72 * s); }
        // трубы
        for (var j = 0; j < pipes.length; j++) {
          var p = pipes[j];
          drawPipe(c, p.x, -4, pw, p.cy - p.g / 2 + 4, true);
          drawPipe(c, p.x, p.cy + p.g / 2, pw, gy - (p.cy + p.g / 2), false);
        }
        // земля
        c.drawImage(groundOff, -groundX, gy, groundOff.width / Math.min(2, window.devicePixelRatio || 1), groundH);
        c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, gy - 2, W, 2);
        // травка на земле
        c.fillStyle = '#4d7c0f';
        for (var tx = -groundX * 2 % (37 * s); tx < W; tx += 37 * s) {
          c.beginPath(); c.moveTo(tx, gy + 30 * s); c.lineTo(tx + 3 * s, gy + 22 * s); c.lineTo(tx + 6 * s, gy + 30 * s); c.fill();
        }
        // монеты и щиты
        items.forEach(function (o) {
          if (o.k === 'coin') {
            var wsc = Math.abs(Math.cos(t * 4 + o.x * 0.01));
            var cw2 = 10 * s * Math.max(0.15, wsc);
            c.fillStyle = '#b45309'; c.beginPath(); c.ellipse(o.x + 1.5 * s * (1 - wsc), o.y, cw2, 10 * s, 0, 0, 6.283); c.fill();
            var cg3 = c.createLinearGradient(o.x, o.y - 10 * s, o.x, o.y + 10 * s);
            cg3.addColorStop(0, '#fef08a'); cg3.addColorStop(0.5, '#facc15'); cg3.addColorStop(1, '#ca8a04');
            c.fillStyle = cg3; c.strokeStyle = '#a16207'; c.lineWidth = 1.5 * s;
            c.beginPath(); c.ellipse(o.x, o.y, cw2, 10 * s, 0, 0, 6.283); c.fill(); c.stroke();
            c.beginPath(); c.ellipse(o.x, o.y, cw2 * 0.65, 6.5 * s, 0, 0, 6.283); c.stroke();
            c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(o.x - cw2 * 0.45, o.y - 5 * s, 2.5 * s * wsc, 10 * s);
          } else {
            c.save(); c.shadowColor = '#7dd3fc'; c.shadowBlur = 16;
            c.strokeStyle = '#7dd3fc'; c.lineWidth = 3 * s; c.fillStyle = 'rgba(125,211,252,.25)';
            c.beginPath(); c.arc(o.x, o.y + Math.sin(t * 3) * 4 * s, 14 * s, 0, 6.283); c.fill(); c.stroke(); c.restore();
            c.fillStyle = '#e0f2fe'; c.font = '900 ' + Math.round(14 * s) + 'px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('✚', o.x, o.y + Math.sin(t * 3) * 4 * s);
          }
        });
        // птица
        drawBird(c);
        if (shield && !dead) {
          c.strokeStyle = 'rgba(125,211,252,' + (0.55 + 0.3 * Math.sin(t * 6)) + ')'; c.lineWidth = 3 * s;
          c.beginPath(); c.arc(bird.x, bird.y, 26 * s, 0, 6.283); c.stroke();
          c.fillStyle = 'rgba(125,211,252,.12)'; c.fill();
        }
        fx.forEach(function (f) {
          c.globalAlpha = Math.max(0, Math.min(1, f.life * 2));
          if (f.kind === 'ring') {
            f.r += 3 * s; c.strokeStyle = '#fff'; c.lineWidth = 3 * s;
            c.beginPath(); c.arc(f.x, f.y, f.r, 0, 6.283); c.stroke();
          } else {
            c.save(); c.translate(f.x, f.y); c.rotate(f.rot); c.fillStyle = f.col;
            c.beginPath(); c.ellipse(0, 0, 6 * s, 2.5 * s, 0, 0, 6.283); c.fill(); c.restore();
          }
        });
        c.globalAlpha = 1;
        // большой счёт
        var sc = String(api.getScore());
        c.font = '900 ' + Math.round(54 * s) + 'px system-ui, sans-serif';
        c.textAlign = 'center'; c.textBaseline = 'top';
        c.lineJoin = 'round'; c.lineWidth = 7 * s; c.strokeStyle = '#1f2937'; c.strokeText(sc, W / 2, 26 * s);
        c.fillStyle = '#fff'; c.fillText(sc, W / 2, 26 * s);
        if (coinsN) { c.font = '900 ' + Math.round(16 * s) + 'px system-ui, sans-serif'; c.textAlign = 'left'; c.lineWidth = 4 * s; c.strokeText('● ' + coinsN, 12, 14 * s); c.fillStyle = '#fde047'; c.fillText('● ' + coinsN, 12, 14 * s); c.textAlign = 'center'; }
        if (flash > 0) { c.fillStyle = 'rgba(255,255,255,' + (flash * 3) + ')'; c.fillRect(0, 0, W, H); }
      }
    };
    return self;
  }
};
