/* Фрукт-ниндзя: режь фрукты взмахом пальца, не задевай бомбы */
window.GAMES = window.GAMES || {};
window.GAMES.fruit = {
  title: 'Фрукт-ниндзя',
  desc: 'Режь фрукты, береги пальцы',
  hint: 'Проводи пальцем по экрану, чтобы разрезать фрукты. Несколько за один взмах — комбо! Не трогай бомбы 💣 и не роняй фрукты. ❄ замедляет время, 🍌 удваивает очки, золотой фрукт — бонус.',
  d0: 'Без бомб, 5 жизней', d1: '3 жизни, редкие бомбы', d2: 'Больше бомб и фруктов', d3: 'Бомба — мгновенный конец',
  colors: ['#f97316', '#dc2626'],
  controls: 'none',
  isNew2: true,
  icon: '<svg viewBox="0 0 100 100"><defs><radialGradient id="fruitG1" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fca5a5"/><stop offset=".6" stop-color="#ef4444"/><stop offset="1" stop-color="#b91c1c"/></radialGradient>' +
    '<radialGradient id="fruitG2" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffedd5"/><stop offset="1" stop-color="#fb923c"/></radialGradient>' +
    '<linearGradient id="fruitG3" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#7dd3fc" stop-opacity="0"/><stop offset="1" stop-color="#e0f2fe"/></linearGradient></defs>' +
    '<g transform="rotate(-18 40 62)"><path d="M10 58 a30 30 0 0 0 60 0z" fill="#166534"/><path d="M14 58 a26 26 0 0 0 52 0z" fill="#bbf7d0"/><path d="M17 58 a23 23 0 0 0 46 0z" fill="url(#fruitG1)"/>' +
    '<g fill="#1c1917"><ellipse cx="30" cy="66" rx="1.6" ry="2.6"/><ellipse cx="40" cy="70" rx="1.6" ry="2.6"/><ellipse cx="50" cy="66" rx="1.6" ry="2.6"/><ellipse cx="35" cy="75" rx="1.4" ry="2.3"/><ellipse cx="45" cy="75" rx="1.4" ry="2.3"/></g>' +
    '<path d="M20 60 h40" stroke="#fff" stroke-opacity=".35" stroke-width="2"/></g>' +
    '<circle cx="70" cy="34" r="17" fill="#ea580c"/><circle cx="70" cy="34" r="14.5" fill="#fff7ed"/><circle cx="70" cy="34" r="13" fill="url(#fruitG2)"/>' +
    '<path d="M70 21v26M57 34h26M60.8 24.8l18.4 18.4M79.2 24.8l-18.4 18.4" stroke="#fff7ed" stroke-width="1.4"/><circle cx="70" cy="34" r="2.2" fill="#fff7ed"/>' +
    '<path d="M8 92 Q50 60 94 8" stroke="url(#fruitG3)" stroke-width="9" stroke-linecap="round" fill="none"/><path d="M14 88 Q52 58 94 8" stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none"/>' +
    '<g fill="#ef4444"><circle cx="20" cy="30" r="3"/><circle cx="27" cy="22" r="2"/><circle cx="14" cy="40" r="1.6"/></g></svg>',

  create: function (api) {
    var DIFF = [
      { lives: 5, bomb: 0, rate: 1.25, kill: false },
      { lives: 3, bomb: 0.1, rate: 1.05, kill: false },
      { lives: 3, bomb: 0.17, rate: 0.85, kill: false },
      { lives: 3, bomb: 0.22, rate: 0.75, kill: true }
    ];
    var KINDS = [
      { n: 'apple', c: '#ef4444', in: '#fef3c7', r: 24 }, { n: 'orange', c: '#f97316', in: '#fdba74', r: 24 },
      { n: 'lime', c: '#65a30d', in: '#d9f99d', r: 21 }, { n: 'melon', c: '#15803d', in: '#f87171', r: 32 },
      { n: 'plum', c: '#7e22ce', in: '#fde68a', r: 20 }, { n: 'lemon', c: '#facc15', in: '#fef9c3', r: 22 },
      { n: 'coco', c: '#78350f', in: '#fff', r: 26 }
    ];
    var slashes = [];
    var D, items, halves, splats, trail, lives, t, spawnT, wave, deadT, slow, dbl, combo, comboT, swipeHits, G, msg, msgT;

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function launch(special) {
      var W = api.W, H = api.H;
      var x = rnd(W * 0.15, W * 0.85), vy = -rnd(Math.sqrt(2 * G * H * 0.55), Math.sqrt(2 * G * H * 0.9));
      var vx = (W / 2 - x) * rnd(0.3, 0.9) + rnd(-40, 40);
      var k = KINDS[Math.floor(Math.random() * KINDS.length)];
      var it = { x: x, y: H + 40, vx: vx, vy: vy, a: rnd(0, 6.28), va: rnd(-4, 4), k: k, r: k.r * (api.W < 380 ? 0.9 : 1), type: 'fruit' };
      if (special === 'bomb') { it.type = 'bomb'; it.r = 22; }
      else if (special) it.type = special;
      items.push(it);
    }
    function spawnWave() {
      wave++;
      var n = Math.min(6, 1 + Math.floor(Math.random() * (2 + wave / 6)));
      var pattern = Math.random();
      for (var i = 0; i < n; i++) {
        var sp = null;
        if (Math.random() < D.bomb * Math.min(1.6, 0.6 + wave / 20)) sp = 'bomb';
        else if (Math.random() < 0.035) sp = 'ice';
        else if (Math.random() < 0.035) sp = 'banana';
        else if (Math.random() < 0.04) sp = 'gold';
        (function (s, delay) { setTimeoutGame(function () { launch(s); }, delay); })(sp, pattern < 0.5 ? i * 0.18 : 0);
      }
    }
    var timers = [];
    function setTimeoutGame(fn, d) { timers.push({ fn: fn, t: d }); }
    function segHit(ax, ay, bx, by, cx, cy, r) {
      var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, k = l2 ? Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / l2)) : 0;
      var px = ax + dx * k - cx, py = ay + dy * k - cy;
      return px * px + py * py < r * r;
    }
    function slice(it, ang) {
      var pts = 10;
      if (it.type === 'bomb') {
        api.sound('hit'); api.vibrate(300); api.fx.flash('#fff', 0.6); api.fx.shake(14);
        api.fx.burst(it.x, it.y, '#fb923c', 40, 300, 4);
        if (D.kill) { lives = 0; deadT = 1.2; }
        else { lives--; msg = '-1 ❤'; msgT = 1; if (lives <= 0) deadT = 1.2; }
        return;
      }
      if (it.type === 'ice') { slow = 5; api.sound('bonus'); msg = api.t('fruit.freeze'); msgT = 1.2; api.fx.flash('#bae6fd', 0.3); }
      if (it.type === 'banana') { dbl = 7; api.sound('bonus'); msg = api.t('fruit.double'); msgT = 1.2; }
      if (it.type === 'gold') { pts = 50; api.sound('coin'); api.fx.burst(it.x, it.y, '#fde047', 26, 240); }
      else api.tone(700 + Math.random() * 300, 0.06, 'triangle', 0.06);
      swipeHits++;
      var mult = dbl > 0 ? 2 : 1;
      api.addScore(pts * mult);
      api.fx.text(it.x, it.y - it.r, '+' + pts * mult, it.type === 'gold' ? '#fde047' : '#fff', 15);
      var col = it.type === 'gold' ? '#facc15' : it.type === 'ice' ? '#7dd3fc' : it.type === 'banana' ? '#fde047' : it.k.c;
      var inn = it.type === 'gold' ? '#fef08a' : it.type === 'ice' ? '#e0f2fe' : it.type === 'banana' ? '#fef9c3' : it.k.in;
      for (var s = -1; s <= 1; s += 2) {
        halves.push({ x: it.x, y: it.y, vx: it.vx * 0.5 + Math.cos(ang + Math.PI / 2) * 90 * s, vy: it.vy * 0.4 + Math.sin(ang + Math.PI / 2) * 90 * s - 60,
          a: ang, va: s * rnd(2, 5), r: it.r, c: col, inn: inn, side: s, life: 2, kind: it.type === 'fruit' ? it.k.n : it.type });
      }
      splats.push(mkSplat(it.x, it.y, it.r * rnd(1.2, 1.8), juiceCol(it), ang));
      slashes.push({ x: it.x, y: it.y, a: ang, r: it.r, life: 0.22 });
      api.fx.burst(it.x, it.y, inn, 8, 160, 3);
      api.vibrate(10);
    }

    /* ---------- графика: спрайты, фон, эффекты ---------- */
    var bgC = null, bgW = 0, bgH = 0, frostC = null, SPR = {}, glowSpr = {};
    function DPR() { return Math.min(2, window.devicePixelRatio || 1); }
    function mkCanvas(w, h) { var cv = document.createElement('canvas'), d = DPR(); cv.width = Math.max(1, Math.ceil(w * d)); cv.height = Math.max(1, Math.ceil(h * d)); var x = cv.getContext('2d'); x.scale(d, d); return { cv: cv, x: x, w: w, h: h }; }
    function prng(seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
    function juiceCol(it) {
      if (it.type === 'gold') return '#facc15'; if (it.type === 'ice') return '#7dd3fc'; if (it.type === 'banana') return '#fde047';
      return { apple: '#f87171', orange: '#fb923c', lime: '#a3e635', melon: '#ef4444', plum: '#a855f7', lemon: '#fde047', coco: '#f5f5f4' }[it.k.n] || it.k.c;
    }
    function mkSplat(x, y, r, col, ang) {
      var s = { x: x, y: y, r: r, c: col, life: 2.5, a: rnd(0, 6), pts: [], drops: [] };
      for (var k = 0; k < 12; k++) s.pts.push(rnd(0.62, 1.05));
      var nd = api.quality === 0 ? 3 : 7;
      for (var d = 0; d < nd; d++) { var da = ang + (Math.random() < 0.5 ? 0 : Math.PI) + rnd(-0.5, 0.5), dd = r * rnd(1.1, 2.1); s.drops.push({ x: Math.cos(da) * dd, y: Math.sin(da) * dd, r: r * rnd(0.06, 0.16) }); }
      return s;
    }
    function buildBg(W, H) {
      var o = mkCanvas(W, H), x = o.x, R = prng(77);
      var n = W < 360 ? 4 : 5, pw = W / n, tones = ['#8a4b22', '#7a3f1b', '#93542a', '#82461f', '#8d4d25'];
      for (var p = 0; p < n; p++) {
        var x0 = p * pw;
        var g = x.createLinearGradient(x0, 0, x0 + pw, 0);
        g.addColorStop(0, tones[p % 5]); g.addColorStop(0.5, shade(tones[p % 5], 12)); g.addColorStop(1, shade(tones[p % 5], -10));
        x.fillStyle = g; x.fillRect(x0, 0, pw + 1, H);
        // волокна
        x.save(); x.beginPath(); x.rect(x0, 0, pw, H); x.clip();
        var ph = R() * 10, kx = x0 + pw * (0.3 + R() * 0.4), ky = H * (0.15 + R() * 0.7);
        for (var j = -4; j < pw + 4; j += 2.2) {
          var dark = R() < 0.55;
          x.strokeStyle = dark ? 'rgba(60,25,8,' + (0.08 + R() * 0.16) + ')' : 'rgba(255,210,160,' + (0.03 + R() * 0.06) + ')';
          x.lineWidth = 0.6 + R() * 1.4;
          x.beginPath();
          for (var y = -10; y <= H + 10; y += 10) {
            var xx = x0 + j + Math.sin(y * 0.011 + ph + j * 0.05) * 3 + Math.sin(y * 0.043 + j) * 0.8;
            var dx = xx - kx, dy = (y - ky) * 0.35, dk = Math.sqrt(dx * dx + dy * dy);
            if (dk < 40) xx += (dx >= 0 ? 1 : -1) * (40 - dk) * 0.45;
            if (y === -10) x.moveTo(xx, y); else x.lineTo(xx, y);
          }
          x.stroke();
        }
        // сучок
        if (R() < 0.8) {
          for (var kr = 3; kr < 16; kr += 2.5) { x.strokeStyle = 'rgba(55,20,5,' + (0.35 - kr * 0.015) + ')'; x.lineWidth = 1.2; x.beginPath(); x.ellipse(kx, ky, kr * 0.75, kr * 1.7, 0, 0, 6.283); x.stroke(); }
          x.fillStyle = 'rgba(45,15,3,.55)'; x.beginPath(); x.ellipse(kx, ky, 3, 6, 0, 0, 6.283); x.fill();
        }
        x.restore();
        // зазоры между досками
        x.fillStyle = 'rgba(25,8,2,.75)'; x.fillRect(x0 - 1.2, 0, 2.4, H);
        x.fillStyle = 'rgba(255,220,180,.10)'; x.fillRect(x0 + 1.2, 0, 1.2, H);
        // гвозди
        for (var ny = 0; ny < 2; ny++) {
          var nyy = ny ? H - 26 : 26, nxx = x0 + pw / 2;
          var ng = x.createRadialGradient(nxx - 1, nyy - 1, 0.5, nxx, nyy, 4);
          ng.addColorStop(0, '#d6d3d1'); ng.addColorStop(1, '#44403c');
          x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.arc(nxx + 1, nyy + 1.5, 4, 0, 6.283); x.fill();
          x.fillStyle = ng; x.beginPath(); x.arc(nxx, nyy, 3.6, 0, 6.283); x.fill();
        }
      }
      // следы от ножа
      for (var s = 0; s < 26; s++) {
        var sx = R() * W, sy = R() * H, sl = 20 + R() * 70, sa = -0.6 + R() * 1.2 + (R() < 0.5 ? 0 : Math.PI / 2);
        x.strokeStyle = 'rgba(30,10,2,.22)'; x.lineWidth = 1;
        x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + Math.cos(sa) * sl, sy + Math.sin(sa) * sl); x.stroke();
        x.strokeStyle = 'rgba(255,220,180,.07)'; x.beginPath(); x.moveTo(sx + 1, sy + 1); x.lineTo(sx + 1 + Math.cos(sa) * sl, sy + 1 + Math.sin(sa) * sl); x.stroke();
      }
      // свет и виньетка
      var lg = x.createRadialGradient(W * 0.5, H * 0.38, 10, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
      lg.addColorStop(0, 'rgba(255,200,140,.16)'); lg.addColorStop(0.55, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(10,3,0,.62)');
      x.fillStyle = lg; x.fillRect(0, 0, W, H);
      return o.cv;
    }
    function buildFrost(W, H) {
      var o = mkCanvas(W, H), x = o.x, R = prng(5);
      var g = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
      g.addColorStop(0, 'rgba(186,230,253,0)'); g.addColorStop(1, 'rgba(224,242,254,.85)');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 1;
      for (var i = 0; i < 40; i++) {
        var edge = R() * 4 | 0, px = edge === 0 ? R() * W : edge === 1 ? W - R() * 30 : edge === 2 ? R() * W : R() * 30, py = edge === 0 ? R() * 30 : edge === 1 ? R() * H : edge === 2 ? H - R() * 30 : R() * H;
        var s = 4 + R() * 9;
        for (var k = 0; k < 3; k++) { var a = k * 1.047 + R() * 0.2; x.beginPath(); x.moveTo(px - Math.cos(a) * s, py - Math.sin(a) * s); x.lineTo(px + Math.cos(a) * s, py + Math.sin(a) * s); x.stroke(); }
      }
      return o.cv;
    }
    function shade(hex, amt) {
      var n = parseInt(hex.slice(1), 16), r = (n >> 16) + amt, g = (n >> 8 & 255) + amt, b = (n & 255) + amt;
      r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    }
    function rad(x, r, c0, c1, c2) { var g = x.createRadialGradient(-r * 0.38, -r * 0.42, r * 0.05, 0, 0, r * 1.05); g.addColorStop(0, c0); g.addColorStop(0.45, c1); g.addColorStop(1, c2); return g; }
    function dots(x, r, n, col, seed, sx, sy) { var R = prng(seed); x.fillStyle = col; for (var i = 0; i < n; i++) { var a = R() * 6.283, d = Math.sqrt(R()) * r * 0.92; x.beginPath(); x.arc(Math.cos(a) * d * (sx || 1), Math.sin(a) * d * (sy || 1), 0.5 + R() * 0.7, 0, 6.283); x.fill(); } }
    function gloss(x, r, a) { x.fillStyle = 'rgba(255,255,255,' + (a || 0.55) + ')'; x.beginPath(); x.ellipse(-r * 0.38, -r * 0.42, r * 0.26, r * 0.14, -0.7, 0, 6.283); x.fill(); x.fillStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.arc(-r * 0.5, -r * 0.5, r * 0.06, 0, 6.283); x.fill(); }
    function rimShade(x, r) { var g = x.createRadialGradient(r * 0.2, r * 0.25, r * 0.5, 0, 0, r * 1.02); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.35)'); return g; }
    function leaf(x, px, py, s, a) {
      x.save(); x.translate(px, py); x.rotate(a);
      var g = x.createLinearGradient(0, -s * 0.4, 0, s * 0.4); g.addColorStop(0, '#4ade80'); g.addColorStop(1, '#15803d');
      x.fillStyle = g; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(s * 0.5, -s * 0.45, s, 0); x.quadraticCurveTo(s * 0.5, s * 0.45, 0, 0); x.fill();
      x.strokeStyle = 'rgba(20,83,45,.8)'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(0, 0); x.lineTo(s * 0.9, 0); x.stroke();
      x.restore();
    }
    function stem(x, x0, y0, x1, y1) { x.strokeStyle = '#57311a'; x.lineWidth = 2.6; x.lineCap = 'round'; x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(x0 + 1, (y0 + y1) / 2, x1, y1); x.stroke(); x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 0.8; x.stroke(); x.lineCap = 'butt'; }
    function appleShape(x, r) {
      x.beginPath(); x.moveTo(0, -r * 0.72);
      x.bezierCurveTo(r * 0.55, -r * 1.12, r * 1.18, -r * 0.62, r * 0.98, r * 0.22);
      x.bezierCurveTo(r * 0.85, r * 0.85, r * 0.38, r * 1.05, 0, r * 0.88);
      x.bezierCurveTo(-r * 0.38, r * 1.05, -r * 0.85, r * 0.85, -r * 0.98, r * 0.22);
      x.bezierCurveTo(-r * 1.18, -r * 0.62, -r * 0.55, -r * 1.12, 0, -r * 0.72); x.closePath();
    }
    function lemonShape(x, r) {
      x.beginPath(); x.moveTo(-r * 1.15, 0);
      x.bezierCurveTo(-r * 0.9, -r * 0.95, r * 0.9, -r * 0.95, r * 1.15, 0);
      x.bezierCurveTo(r * 0.9, r * 0.95, -r * 0.9, r * 0.95, -r * 1.15, 0); x.closePath();
    }
    function drawWhole(x, kind, r) {
      if (kind === 'apple' || kind === 'gold') {
        var gold = kind === 'gold';
        appleShape(x, r); x.fillStyle = gold ? rad(x, r, '#fffbeb', '#facc15', '#a16207') : rad(x, r, '#fda4af', '#e11d48', '#7f1d1d'); x.fill();
        x.save(); appleShape(x, r); x.clip();
        var R = prng(gold ? 3 : 11); x.strokeStyle = gold ? 'rgba(255,255,255,.18)' : 'rgba(254,240,138,.16)'; x.lineWidth = 1.2;
        for (var i = 0; i < 9; i++) { var sx = -r * 0.8 + R() * r * 1.6; x.beginPath(); x.moveTo(sx, -r * 0.6); x.quadraticCurveTo(sx * 1.2, 0, sx * 0.9, r * 0.8); x.stroke(); }
        x.fillStyle = rimShade(x, r); x.fillRect(-r * 1.3, -r * 1.3, r * 2.6, r * 2.6);
        x.fillStyle = 'rgba(60,0,0,.25)'; x.beginPath(); x.ellipse(0, -r * 0.66, r * 0.22, r * 0.09, 0, 0, 6.283); x.fill();
        x.restore();
        stem(x, 0, -r * 0.66, r * 0.12, -r * 1.08); leaf(x, r * 0.1, -r * 0.92, r * 0.62, -0.5);
        gloss(x, r, 0.6);
        if (gold) { x.fillStyle = '#fff'; star(x, r * 0.45, -r * 0.25, r * 0.16); star(x, -r * 0.2, r * 0.45, r * 0.1); }
      } else if (kind === 'orange' || kind === 'lime') {
        var org = kind === 'orange', sy = org ? 1 : 0.9;
        x.save(); x.scale(1, sy);
        x.fillStyle = org ? rad(x, r, '#fed7aa', '#f97316', '#9a3412') : rad(x, r, '#d9f99d', '#65a30d', '#1a2e05');
        x.beginPath(); x.arc(0, 0, r, 0, 6.283); x.fill();
        dots(x, r, 70, org ? 'rgba(124,45,18,.28)' : 'rgba(20,40,5,.3)', org ? 21 : 33);
        dots(x, r, 30, 'rgba(255,255,255,.18)', org ? 22 : 34);
        x.fillStyle = rimShade(x, r); x.beginPath(); x.arc(0, 0, r, 0, 6.283); x.fill();
        x.restore();
        if (org) { x.fillStyle = '#4d7c0f'; star(x, r * 0.15, -r * 0.82, r * 0.14); leaf(x, r * 0.2, -r * 0.86, r * 0.5, -0.3); }
        else { x.fillStyle = '#3f6212'; x.beginPath(); x.ellipse(r * 0.98, 0, r * 0.09, r * 0.13, 0, 0, 6.283); x.fill(); x.beginPath(); x.ellipse(-r * 0.98, 0, r * 0.06, r * 0.09, 0, 0, 6.283); x.fill(); }
        gloss(x, r, 0.5);
      } else if (kind === 'lemon') {
        lemonShape(x, r); x.fillStyle = rad(x, r, '#fefce8', '#facc15', '#a16207'); x.fill();
        x.save(); lemonShape(x, r); x.clip();
        dots(x, r, 60, 'rgba(161,98,7,.3)', 44, 1.1, 0.85); x.fillStyle = rimShade(x, r); x.fillRect(-r * 1.3, -r, r * 2.6, r * 2);
        x.restore();
        x.fillStyle = '#ca8a04'; x.beginPath(); x.ellipse(r * 1.12, 0, r * 0.1, r * 0.08, 0, 0, 6.283); x.fill();
        leaf(x, -r * 1.05, -r * 0.05, r * 0.55, -2.6);
        gloss(x, r, 0.55);
      } else if (kind === 'melon') {
        x.save(); x.scale(1.06, 0.94);
        x.fillStyle = rad(x, r, '#86efac', '#16a34a', '#052e16'); x.beginPath(); x.arc(0, 0, r, 0, 6.283); x.fill();
        x.save(); x.beginPath(); x.arc(0, 0, r, 0, 6.283); x.clip();
        x.fillStyle = 'rgba(5,46,22,.75)';
        for (var m = -3; m <= 3; m++) {
          var bx = m * r * 0.32;
          x.beginPath(); x.moveTo(bx - r * 0.06, -r);
          for (var yy = -r; yy <= r; yy += r * 0.14) x.lineTo(bx + Math.sin(yy * 0.5 / r * 6) * r * 0.05 - r * 0.07 * Math.cos(yy / r), yy);
          for (var yy2 = r; yy2 >= -r; yy2 -= r * 0.14) x.lineTo(bx + Math.sin(yy2 * 0.5 / r * 6 + 1) * r * 0.05 + r * 0.07 * Math.cos(yy2 / r), yy2);
          x.closePath(); x.fill();
        }
        x.fillStyle = rimShade(x, r); x.fillRect(-r, -r, 2 * r, 2 * r);
        x.restore(); x.restore();
        x.fillStyle = '#65a30d'; x.beginPath(); x.arc(0, -r * 0.92, r * 0.08, 0, 6.283); x.fill();
        gloss(x, r, 0.45);
      } else if (kind === 'plum') {
        x.fillStyle = rad(x, r, '#e9d5ff', '#9333ea', '#2e1065'); x.beginPath(); x.arc(0, 0, r, 0, 6.283); x.fill();
        x.strokeStyle = 'rgba(46,16,101,.55)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(r * 0.05, -r * 0.9); x.bezierCurveTo(r * 0.55, -r * 0.4, r * 0.55, r * 0.4, r * 0.1, r * 0.95); x.stroke();
        x.fillStyle = 'rgba(219,234,254,.14)'; x.beginPath(); x.arc(r * 0.1, r * 0.1, r * 0.8, 0, 6.283); x.fill();
        x.fillStyle = rimShade(x, r); x.beginPath(); x.arc(0, 0, r, 0, 6.283); x.fill();
        stem(x, 0, -r * 0.9, -r * 0.1, -r * 1.25);
        gloss(x, r, 0.5);
      } else if (kind === 'coco') {
        x.fillStyle = rad(x, r, '#b45309', '#78350f', '#290f02'); x.beginPath(); x.arc(0, 0, r, 0, 6.283); x.fill();
        x.save(); x.beginPath(); x.arc(0, 0, r, 0, 6.283); x.clip();
        var Rc = prng(9); x.lineWidth = 1;
        for (var f = 0; f < 120; f++) { var fa = Rc() * 6.283, fd = Math.sqrt(Rc()) * r, fx = Math.cos(fa) * fd, fy = Math.sin(fa) * fd, fl = 3 + Rc() * 5, fan = fa + 1.4 + Rc() * 0.5;
          x.strokeStyle = Rc() < 0.5 ? 'rgba(217,119,6,.35)' : 'rgba(30,10,0,.45)'; x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx + Math.cos(fan) * fl, fy + Math.sin(fan) * fl); x.stroke(); }
        x.fillStyle = rimShade(x, r); x.fillRect(-r, -r, 2 * r, 2 * r);
        x.restore();
        x.fillStyle = '#1c0a00'; [[-0.22, -0.45], [0.22, -0.45], [0, -0.2]].forEach(function (e) { x.beginPath(); x.ellipse(e[0] * r, e[1] * r, r * 0.09, r * 0.12, 0, 0, 6.283); x.fill(); });
        gloss(x, r, 0.25);
      } else if (kind === 'ice') {
        var ig = x.createLinearGradient(-r, -r, r, r); ig.addColorStop(0, '#f0f9ff'); ig.addColorStop(0.5, '#7dd3fc'); ig.addColorStop(1, '#0369a1');
        x.fillStyle = ig; x.beginPath(); for (var k = 0; k < 6; k++) { var a = k * 1.047 + 0.52; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill();
        x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 1.5; x.stroke();
        x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 1;
        for (var k3 = 0; k3 < 6; k3++) { var a3 = k3 * 1.047 + 0.52; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a3) * r, Math.sin(a3) * r); x.stroke(); }
        x.strokeStyle = '#fff'; x.lineWidth = 2.2; x.lineCap = 'round';
        for (var k2 = 0; k2 < 3; k2++) {
          var a2 = k2 * 1.047 + 0.52, cx2 = Math.cos(a2), sy2 = Math.sin(a2);
          x.beginPath(); x.moveTo(-cx2 * r * 0.62, -sy2 * r * 0.62); x.lineTo(cx2 * r * 0.62, sy2 * r * 0.62); x.stroke();
          for (var sg = -1; sg <= 1; sg += 2) for (var bb = -1; bb <= 1; bb += 2) {
            var px = cx2 * r * 0.38 * sg, py = sy2 * r * 0.38 * sg;
            x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a2 + bb * 0.8) * r * 0.16 * sg, py + Math.sin(a2 + bb * 0.8) * r * 0.16 * sg); x.stroke();
          }
        }
        x.lineCap = 'butt';
        x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.moveTo(-r * 0.6, -r * 0.5); x.lineTo(-r * 0.15, -r * 0.8); x.lineTo(-r * 0.35, -r * 0.35); x.closePath(); x.fill();
      } else if (kind === 'banana') {
        var bg = x.createLinearGradient(0, -r * 0.6, 0, r * 0.9); bg.addColorStop(0, '#fef9c3'); bg.addColorStop(0.45, '#facc15'); bg.addColorStop(1, '#a16207');
        x.save(); x.translate(0, -r * 0.55);
        x.beginPath(); x.arc(0, 0, r * 1.32, 0.35, 2.79); x.arc(0, -r * 0.62, r * 1.02, 2.62, 0.52, true); x.closePath();
        x.fillStyle = bg; x.fill(); x.strokeStyle = 'rgba(120,53,15,.55)'; x.lineWidth = 1.2; x.stroke();
        x.strokeStyle = 'rgba(161,98,7,.55)'; x.lineWidth = 1.4; x.beginPath(); x.arc(0, -r * 0.3, r * 1.18, 0.55, 2.59); x.stroke();
        x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 2; x.lineCap = 'round'; x.beginPath(); x.arc(0, -r * 0.5, r * 1.08, 1.15, 1.95); x.stroke(); x.lineCap = 'butt';
        x.fillStyle = '#422006'; x.beginPath(); x.arc(Math.cos(0.38) * r * 1.2, Math.sin(0.38) * r * 1.2 - r * 0.05, r * 0.11, 0, 6.283); x.fill();
        x.fillStyle = '#65a30d'; x.save(); x.translate(Math.cos(2.76) * r * 1.2, Math.sin(2.76) * r * 1.2 - r * 0.08); x.rotate(-0.9); x.fillRect(-r * 0.08, -r * 0.3, r * 0.16, r * 0.32); x.restore();
        x.restore();
      }
    }
    function star(x, px, py, s) { x.beginPath(); for (var i = 0; i < 8; i++) { var a = i * 0.785, rr = i % 2 ? s * 0.35 : s; x.lineTo(px + Math.cos(a) * rr, py + Math.sin(a) * rr); } x.closePath(); x.fill(); }
    function drawCut(x, kind, r) {
      var P = {
        apple: ['#be123c', '#fff7ed', '#fde68a'], gold: ['#ca8a04', '#fefce8', '#fde047'], orange: ['#ea580c', '#fff7ed', '#fb923c'],
        lime: ['#4d7c0f', '#f7fee7', '#a3e635'], lemon: ['#eab308', '#fefce8', '#fde047'], melon: ['#14532d', '#bbf7d0', '#ef4444'],
        plum: ['#6b21a8', '#fef3c7', '#facc15'], coco: ['#451a03', '#fafaf9', '#e7e5e4'], ice: ['#0284c7', '#e0f2fe', '#bae6fd'], banana: ['#eab308', '#fefce8', '#fef3c7']
      }[kind] || ['#888', '#eee', '#ccc'];
      x.fillStyle = P[0]; x.beginPath(); x.arc(0, 0, r, 0, 6.283); x.fill();
      var inner = kind === 'coco' ? 0.72 : kind === 'melon' ? 0.9 : 0.9;
      x.fillStyle = P[1]; x.beginPath(); x.arc(0, 0, r * inner, 0, 6.283); x.fill();
      var fr = r * (kind === 'melon' ? 0.8 : kind === 'apple' || kind === 'gold' || kind === 'plum' ? 0.86 : kind === 'coco' ? 0.6 : 0.8);
      var fg = x.createRadialGradient(0, 0, fr * 0.1, 0, 0, fr); fg.addColorStop(0, shadeA(P[2], 40)); fg.addColorStop(1, P[2]);
      if (kind === 'apple' || kind === 'gold') { fg = x.createRadialGradient(0, 0, 1, 0, 0, fr); fg.addColorStop(0, '#fffbeb'); fg.addColorStop(1, kind === 'gold' ? '#fde68a' : '#fef3c7'); }
      x.fillStyle = fg; x.beginPath(); x.arc(0, 0, fr, 0, 6.283); x.fill();
      if (kind === 'orange' || kind === 'lime' || kind === 'lemon') {
        x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 1.3;
        for (var s = 0; s < 10; s++) { var a = s * 0.628; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * fr, Math.sin(a) * fr); x.stroke(); }
        x.fillStyle = 'rgba(255,255,255,.35)'; var R = prng(kind.length * 7);
        for (var j = 0; j < 26; j++) { var ja = R() * 6.283, jd = fr * (0.3 + R() * 0.6); x.beginPath(); x.ellipse(Math.cos(ja) * jd, Math.sin(ja) * jd, 1.6, 0.8, ja, 0, 6.283); x.fill(); }
        x.fillStyle = P[1]; x.beginPath(); x.arc(0, 0, fr * 0.12, 0, 6.283); x.fill();
      } else if (kind === 'melon') {
        x.fillStyle = '#1c1917';
        for (var sd = 0; sd < 9; sd++) { var sa = sd * 0.698 + 0.2, sdd = fr * (sd % 2 ? 0.55 : 0.4); x.save(); x.translate(Math.cos(sa) * sdd, Math.sin(sa) * sdd); x.rotate(sa); x.beginPath(); x.ellipse(0, 0, r * 0.08, r * 0.045, 0, 0, 6.283); x.fill(); x.restore(); }
      } else if (kind === 'apple' || kind === 'gold') {
        x.strokeStyle = 'rgba(180,140,60,.45)'; x.lineWidth = 1; x.beginPath();
        for (var p = 0; p < 10; p++) { var pa = p * 0.628 - 1.57, pr = p % 2 ? fr * 0.18 : fr * 0.42; x.lineTo(Math.cos(pa) * pr, Math.sin(pa) * pr); } x.closePath(); x.stroke();
        x.fillStyle = '#422006'; for (var q = 0; q < 3; q++) { var qa = q * 2.094 - 1.57; x.save(); x.translate(Math.cos(qa) * fr * 0.22, Math.sin(qa) * fr * 0.22); x.rotate(qa + 1.57); x.beginPath(); x.ellipse(0, 0, r * 0.05, r * 0.09, 0, 0, 6.283); x.fill(); x.restore(); }
      } else if (kind === 'plum') {
        var pg = x.createRadialGradient(-2, -2, 1, 0, 0, fr * 0.45); pg.addColorStop(0, '#b45309'); pg.addColorStop(1, '#78350f');
        x.fillStyle = pg; x.beginPath(); x.ellipse(0, 0, fr * 0.3, fr * 0.42, 0, 0, 6.283); x.fill();
      } else if (kind === 'coco') {
        x.fillStyle = 'rgba(186,230,253,.4)'; x.beginPath(); x.arc(0, 0, fr * 0.8, 0, 6.283); x.fill();
      } else if (kind === 'banana') {
        x.fillStyle = 'rgba(161,98,7,.45)'; for (var b = 0; b < 3; b++) { var ba = b * 2.094; x.beginPath(); x.arc(Math.cos(ba) * fr * 0.18, Math.sin(ba) * fr * 0.18, 1.6, 0, 6.283); x.fill(); }
      } else if (kind === 'ice') {
        x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 1.5; for (var ic = 0; ic < 6; ic++) { var ia = ic * 1.047; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(ia) * fr * 0.8, Math.sin(ia) * fr * 0.8); x.stroke(); }
      }
      // влажный блик
      x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.ellipse(-fr * 0.35, -fr * 0.45, fr * 0.3, fr * 0.1, -0.5, 0, 6.283); x.fill();
    }
    function shadeA(col, amt) { return col.charAt(0) === '#' ? shade(col, amt) : col; }
    function sprite(kind, r, cut) {
      var key = kind + (cut ? '_c' : '_w') + Math.round(r);
      if (SPR[key]) return SPR[key];
      var S = Math.ceil(r * 3.0), o = mkCanvas(S, S);
      o.x.translate(S / 2, S / 2);
      if (cut) drawCut(o.x, kind, r); else drawWhole(o.x, kind, r);
      SPR[key] = o; return o;
    }
    function glowSprite(col) {
      if (glowSpr[col]) return glowSpr[col];
      var o = mkCanvas(64, 64), g = o.x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      o.x.fillStyle = g; o.x.fillRect(0, 0, 64, 64); glowSpr[col] = o; return o;
    }
    function bombSprite(r) {
      var key = 'bomb' + Math.round(r); if (SPR[key]) return SPR[key];
      var S = Math.ceil(r * 4), o = mkCanvas(S, S), x = o.x; x.translate(S / 2, S / 2);
      x.fillStyle = rad(x, r, '#6b7280', '#1f2937', '#030712'); x.beginPath(); x.arc(0, 0, r, 0, 6.283); x.fill();
      x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 1.5; x.stroke();
      // поясок с заклёпками
      x.save(); x.beginPath(); x.arc(0, 0, r, 0, 6.283); x.clip();
      x.fillStyle = 'rgba(255,255,255,.07)'; x.beginPath(); x.ellipse(0, r * 0.1, r * 1.1, r * 0.22, 0, 0, 6.283); x.fill();
      x.restore();
      for (var i = -2; i <= 2; i++) { x.fillStyle = '#9ca3af'; x.beginPath(); x.arc(i * r * 0.36, r * 0.1 + Math.abs(i) * r * 0.02, r * 0.055, 0, 6.283); x.fill(); }
      // колпачок
      var cg = x.createLinearGradient(-r * 0.3, 0, r * 0.3, 0); cg.addColorStop(0, '#374151'); cg.addColorStop(0.4, '#d1d5db'); cg.addColorStop(1, '#4b5563');
      x.fillStyle = cg; x.fillRect(-r * 0.28, -r * 1.12, r * 0.56, r * 0.3);
      x.fillStyle = '#111827'; x.fillRect(-r * 0.28, -r * 0.84, r * 0.56, r * 0.05);
      // фитиль
      x.strokeStyle = '#a16207'; x.lineWidth = 3; x.lineCap = 'round'; x.beginPath(); x.moveTo(0, -r * 1.1); x.quadraticCurveTo(r * 0.45, -r * 1.45, r * 0.22, -r * 1.65); x.stroke();
      x.strokeStyle = 'rgba(66,32,6,.8)'; x.lineWidth = 1; x.setLineDash([2, 2]); x.stroke(); x.setLineDash([]); x.lineCap = 'butt';
      // череп-крест
      x.strokeStyle = '#ef4444'; x.lineWidth = r * 0.16; x.lineCap = 'round';
      x.beginPath(); x.moveTo(-r * 0.3, -r * 0.42); x.lineTo(r * 0.3, r * 0.18); x.moveTo(r * 0.3, -r * 0.42); x.lineTo(-r * 0.3, r * 0.18); x.stroke(); x.lineCap = 'butt';
      gloss(x, r, 0.35);
      SPR[key] = o; return o;
    }
    function blit(c, o, x, y, a, sc) {
      c.save(); c.translate(x, y); if (a) c.rotate(a); if (sc && sc !== 1) c.scale(sc, sc);
      c.drawImage(o.cv, -o.w / 2, -o.h / 2, o.w, o.h); c.restore();
    }
    function heart(c, x, y, s) {
      c.beginPath(); c.moveTo(x, y + s * 0.35);
      c.bezierCurveTo(x - s * 0.1, y + s * 0.2, x - s * 0.55, y + s * 0.05, x - s * 0.5, y - s * 0.22);
      c.bezierCurveTo(x - s * 0.45, y - s * 0.5, x - s * 0.08, y - s * 0.5, x, y - s * 0.22);
      c.bezierCurveTo(x + s * 0.08, y - s * 0.5, x + s * 0.45, y - s * 0.5, x + s * 0.5, y - s * 0.22);
      c.bezierCurveTo(x + s * 0.55, y + s * 0.05, x + s * 0.1, y + s * 0.2, x, y + s * 0.35); c.closePath();
    }
    function pill(c, x, y, w, h) { var r = h / 2; c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.arc(x + w - r, y + r, r, -1.571, 1.571); c.lineTo(x + r, y + h); c.arc(x + r, y + r, r, 1.571, 4.712); c.closePath(); }
    function trailPath(c, pts, wmax, wmin) {
      var n = pts.length, L = [], Rr = [];
      for (var i = 0; i < n; i++) {
        var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, l = Math.sqrt(dx * dx + dy * dy) || 1;
        var k = i / (n - 1), w = (wmin + (wmax - wmin) * k) * (i === n - 1 ? 0.6 : 1) / 2;
        L.push([pts[i].x - dy / l * w, pts[i].y + dx / l * w]); Rr.push([pts[i].x + dy / l * w, pts[i].y - dx / l * w]);
      }
      c.beginPath(); c.moveTo(L[0][0], L[0][1]);
      for (var j = 1; j < n; j++) c.lineTo(L[j][0], L[j][1]);
      var e = pts[n - 1]; c.arc(e.x, e.y, (wmax * 0.6) / 2, 0, 0.001);
      for (var q = n - 1; q >= 0; q--) c.lineTo(Rr[q][0], Rr[q][1]);
      c.closePath();
    }

    return {
      reset: function () {
        D = DIFF[api.diff];
        items = []; halves = []; splats = []; trail = []; timers = []; slashes = [];
        lives = D.lives; t = 0; spawnT = 1; wave = 0; deadT = 0; slow = 0; dbl = 0; combo = 0; comboT = 0; swipeHits = 0; msg = ''; msgT = 0;
        G = Math.max(500, api.H * 1.1);
      },
      resize: function () { G = Math.max(500, api.H * 1.1); },
      idle: function (dt) { t += dt; },
      input: function (type, d) {
        if (deadT > 0) return;
        if (type === 'down') { trail = [{ x: d.x, y: d.y, t: t }]; swipeHits = 0; }
        else if (type === 'move') {
          var last = trail[trail.length - 1];
          trail.push({ x: d.x, y: d.y, t: t });
          if (trail.length > 14) trail.shift();
          if (!last) return;
          var ang = Math.atan2(d.y - last.y, d.x - last.x);
          for (var i = items.length - 1; i >= 0; i--) {
            var it = items[i];
            if (segHit(last.x, last.y, d.x, d.y, it.x, it.y, it.r + 6)) { items.splice(i, 1); slice(it, ang); if (deadT > 0) return; }
          }
        } else if (type === 'up') {
          if (swipeHits >= 3) {
            var bonus = swipeHits * 10 * (dbl > 0 ? 2 : 1);
            api.addScore(bonus); api.sound('bonus');
            var lp = trail[trail.length - 1] || { x: api.W / 2, y: api.H / 2 };
            api.fx.text(lp.x, lp.y - 30, api.t('fruit.combo', swipeHits) + ' +' + bonus, '#f472b6', 20);
          }
          swipeHits = 0;
        }
      },
      update: function (rdt) {
        t += rdt;
        if (msgT > 0) msgT -= rdt;
        if (slow > 0) slow -= rdt;
        if (dbl > 0) dbl -= rdt;
        var dt = rdt * (slow > 0 ? 0.45 : 1);
        while (trail.length && t - trail[0].t > 0.16) trail.shift();
        for (var sl = slashes.length - 1; sl >= 0; sl--) { slashes[sl].life -= rdt; if (slashes[sl].life <= 0) slashes.splice(sl, 1); }
        if (deadT > 0) { deadT -= rdt; if (deadT <= 0) api.gameOver(); return; }
        for (var ti = timers.length - 1; ti >= 0; ti--) { timers[ti].t -= dt; if (timers[ti].t <= 0) { var fn = timers[ti].fn; timers.splice(ti, 1); fn(); } }
        spawnT -= dt;
        if (spawnT <= 0) { spawnWave(); spawnT = D.rate * rnd(0.8, 1.3) * Math.max(0.55, 1 - wave * 0.012); }
        for (var i = items.length - 1; i >= 0; i--) {
          var it = items[i];
          it.vy += G * dt; it.x += it.vx * dt; it.y += it.vy * dt; it.a += it.va * dt;
          if (it.y > api.H + 60 && it.vy > 0) {
            items.splice(i, 1);
            if (it.type === 'fruit' || it.type === 'gold') {
              lives--; api.sound('drop'); api.vibrate(60); msg = '-1 ❤'; msgT = 0.8;
              if (lives <= 0) { deadT = 1; api.sound('hit'); }
            }
          }
        }
        for (var h = halves.length - 1; h >= 0; h--) {
          var hf = halves[h]; hf.vy += G * dt; hf.x += hf.vx * dt; hf.y += hf.vy * dt; hf.a += hf.va * dt; hf.life -= dt;
          if (hf.y > api.H + 80 || hf.life <= 0) halves.splice(h, 1);
        }
        for (var s = splats.length - 1; s >= 0; s--) { splats[s].life -= rdt; if (splats[s].life <= 0) splats.splice(s, 1); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, Q = api.quality;
        if (!bgC || bgW !== W || bgH !== H) { bgC = buildBg(W, H); frostC = null; bgW = W; bgH = H; }
        c.drawImage(bgC, 0, 0, W, H);
        // кляксы сока
        for (var si = 0; si < splats.length; si++) {
          var s = splats[si], n = s.pts.length;
          c.globalAlpha = Math.min(0.72, s.life * 0.4); c.fillStyle = s.c;
          c.beginPath();
          for (var k = 0; k <= n; k++) {
            var a = s.a + k / n * 6.283, rr = s.r * s.pts[k % n], a2 = s.a + (k + 0.5) / n * 6.283, rr2 = s.r * (s.pts[k % n] + s.pts[(k + 1) % n]) * 0.42;
            if (k === 0) c.moveTo(s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr);
            else c.quadraticCurveTo(s.x + Math.cos(a - 3.1416 / n) * rr2 * 1.25, s.y + Math.sin(a - 3.1416 / n) * rr2 * 1.25, s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr);
          }
          c.closePath(); c.fill();
          for (var di = 0; di < s.drops.length; di++) { var dr = s.drops[di]; c.beginPath(); c.arc(s.x + dr.x, s.y + dr.y, dr.r, 0, 6.283); c.fill(); }
          c.globalAlpha = Math.min(0.25, s.life * 0.15); c.fillStyle = '#fff';
          c.beginPath(); c.ellipse(s.x - s.r * 0.25, s.y - s.r * 0.3, s.r * 0.25, s.r * 0.08, -0.5, 0, 6.283); c.fill();
        }
        c.globalAlpha = 1;
        if (slow > 0) {
          if (!frostC) frostC = buildFrost(W, H);
          c.globalAlpha = Math.min(1, slow * 0.6); c.drawImage(frostC, 0, 0, W, H); c.globalAlpha = 1;
        }
        // тени предметов
        c.fillStyle = 'rgba(20,6,0,.28)';
        for (var sh = 0; sh < items.length; sh++) { var si2 = items[sh]; c.beginPath(); c.ellipse(si2.x + 8, si2.y + si2.r * 0.9 + 10, si2.r * 0.85, si2.r * 0.3, 0, 0, 6.283); c.fill(); }
        // половинки
        for (var hi = 0; hi < halves.length; hi++) {
          var hf = halves[hi], cs = sprite(hf.kind || 'apple', hf.r, true), S = cs.w;
          c.save(); c.translate(hf.x, hf.y); c.rotate(hf.a);
          c.globalAlpha = Math.min(1, hf.life * 2);
          c.beginPath(); if (hf.side > 0) c.rect(-S, 0, S * 2, S); else c.rect(-S, -S, S * 2, S); c.clip();
          c.drawImage(cs.cv, -S / 2, -S / 2, S, S);
          c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-hf.r, hf.side > 0 ? 0 : -2, hf.r * 2, 2);
          c.restore();
        }
        c.globalAlpha = 1;
        // целые предметы
        for (var ii = 0; ii < items.length; ii++) {
          var it = items[ii];
          if (it.type === 'bomb') {
            var pul = 0.5 + 0.5 * Math.sin(t * 10);
            if (Q > 0) { c.globalAlpha = 0.25 + pul * 0.25; blit(c, glowSprite('rgba(239,68,68,.9)'), it.x, it.y, 0, it.r * 2.6 / 64); c.globalAlpha = 1; }
            blit(c, bombSprite(it.r), it.x, it.y, it.a);
            // искра на фитиле
            var fx = it.x + (Math.cos(it.a) * it.r * 0.22 - Math.sin(it.a) * -it.r * 1.68), fy = it.y + (Math.sin(it.a) * it.r * 0.22 + Math.cos(it.a) * -it.r * 1.68);
            var fl = 0.7 + Math.random() * 0.5;
            c.save(); c.globalCompositeOperation = 'lighter';
            if (Q > 0) blit(c, glowSprite('rgba(253,186,116,1)'), fx, fy, 0, fl * 0.7);
            c.strokeStyle = '#fde047'; c.lineWidth = 1.5;
            for (var ry = 0; ry < (Q > 0 ? 6 : 3); ry++) { var ra = Math.random() * 6.283, rl = 4 + Math.random() * 8; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + Math.cos(ra) * rl, fy + Math.sin(ra) * rl); c.stroke(); }
            c.fillStyle = '#fff'; c.beginPath(); c.arc(fx, fy, 2.5 * fl, 0, 6.283); c.fill();
            c.restore();
          } else {
            var kind = it.type === 'fruit' ? it.k.n : it.type;
            if ((it.type === 'gold' || it.type === 'ice') && Q > 0) {
              c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 + 0.2 * Math.sin(t * 6);
              blit(c, glowSprite(it.type === 'gold' ? 'rgba(253,224,71,.9)' : 'rgba(186,230,253,.9)'), it.x, it.y, 0, it.r * 3 / 64);
              c.restore();
            }
            blit(c, sprite(kind, it.r, false), it.x, it.y, it.a);
            if (it.type === 'gold' && Q > 0) {
              c.fillStyle = '#fff'; c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 9 + it.x);
              var sa2 = t * 2 + it.x; star(c, it.x + Math.cos(sa2) * it.r * 1.1, it.y + Math.sin(sa2) * it.r * 1.1, 4); c.globalAlpha = 1;
            }
          }
        }
        // вспышка разреза
        for (var sl = 0; sl < slashes.length; sl++) {
          var z = slashes[sl], k4 = z.life / 0.22, L = z.r * (1.6 + (1 - k4) * 0.8);
          c.save(); c.translate(z.x, z.y); c.rotate(z.a); c.globalAlpha = k4;
          c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-L, 0); c.quadraticCurveTo(0, -3 * k4 - 1, L, 0); c.quadraticCurveTo(0, 3 * k4 + 1, -L, 0); c.fill();
          c.restore();
        }
        c.globalAlpha = 1;
        // след клинка
        if (trail.length > 1) {
          c.save();
          if (Q > 0) { c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(56,189,248,.28)'; trailPath(c, trail, 26, 2); c.fill(); c.fillStyle = 'rgba(125,211,252,.45)'; trailPath(c, trail, 14, 1); c.fill(); c.globalCompositeOperation = 'source-over'; }
          c.fillStyle = 'rgba(255,255,255,.95)'; trailPath(c, trail, 6, 0.5); c.fill();
          var tp = trail[trail.length - 1];
          if (Q > 0) { c.globalCompositeOperation = 'lighter'; blit(c, glowSprite('rgba(224,242,254,1)'), tp.x, tp.y, 0, 0.5); }
          c.restore();
        }
        // HUD: жизни
        var hs = 18, hw = D.lives * 22 + 12;
        c.fillStyle = 'rgba(20,6,0,.45)'; pill(c, W - hw - 8, 10, hw, 26); c.fill();
        c.strokeStyle = 'rgba(255,220,180,.15)'; c.lineWidth = 1; c.stroke();
        for (var l = 0; l < D.lives; l++) {
          var hx = W - 8 - 17 - l * 22, hy = 23, on = l < lives;
          heart(c, hx, hy + 1.5, hs); c.fillStyle = 'rgba(0,0,0,.35)'; c.fill();
          heart(c, hx, hy, hs);
          if (on) { var hg = c.createLinearGradient(0, hy - 8, 0, hy + 7); hg.addColorStop(0, '#fb7185'); hg.addColorStop(1, '#be123c'); c.fillStyle = hg; c.fill(); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(hx - 4, hy - 4, 2.6, 1.6, -0.6, 0, 6.283); c.fill(); }
          else { c.fillStyle = 'rgba(255,255,255,.12)'; c.fill(); }
        }
        // бонусы
        c.textAlign = 'left'; c.textBaseline = 'middle'; c.font = '800 13px system-ui, sans-serif';
        var yy = 10;
        function badge(label, col, frac) {
          c.fillStyle = 'rgba(20,6,0,.5)'; pill(c, 8, yy, 70, 24); c.fill();
          c.fillStyle = col; c.globalAlpha = 0.35; pill(c, 8, yy, Math.max(24, 70 * frac), 24); c.fill(); c.globalAlpha = 1;
          c.strokeStyle = col; c.lineWidth = 1.2; pill(c, 8, yy, 70, 24); c.stroke();
          c.fillStyle = '#fff'; c.fillText(label, 18, yy + 12.5); yy += 30;
        }
        if (slow > 0) badge('❄ ' + Math.ceil(slow), '#7dd3fc', slow / 5);
        if (dbl > 0) badge('x2 ' + Math.ceil(dbl), '#fde047', dbl / 7);
        if (msgT > 0) {
          c.textAlign = 'center'; c.globalAlpha = Math.min(1, msgT * 2);
          var sc = 1 + Math.max(0, msgT - 0.8) * 1.2;
          c.save(); c.translate(W / 2, H * 0.22); c.scale(sc, sc);
          c.font = '900 26px system-ui, sans-serif'; c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = 'rgba(30,8,0,.75)'; c.strokeText(msg, 0, 0);
          c.fillStyle = msg.indexOf('❤') >= 0 ? '#fca5a5' : '#fff'; c.fillText(msg, 0, 0);
          c.restore(); c.globalAlpha = 1;
        }
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      }
    };
  }
};
