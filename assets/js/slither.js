/* Змейка с ботами (арена) */
window.GAMES = window.GAMES || {};
window.GAMES.slither = {
  title: 'Змейка.io',
  colors: ['#7c3aed', '#16a34a'],
  controls: 'none',
  multiTouch: true,
  icon: '<svg viewBox="0 0 100 100"><defs><radialGradient id="slBg" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#1e1b4b"/><stop offset="1" stop-color="#0b0f1a"/></radialGradient>' +
    '<linearGradient id="slBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c4b5fd"/><stop offset="1" stop-color="#6d28d9"/></linearGradient>' +
    '<radialGradient id="slFood" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#facc15"/><stop offset="1" stop-color="#facc15" stop-opacity="0"/></radialGradient></defs>' +
    '<rect x="4" y="4" width="92" height="92" rx="18" fill="url(#slBg)"/>' +
    '<path d="M22 40l6-4 6 4v7l-6 4-6-4zM62 70l6-4 6 4v7l-6 4-6-4zM70 10l6-4 6 4v7l-6 4-6-4z" fill="none" stroke="#6366f1" stroke-opacity=".35" stroke-width="1.5"/>' +
    '<path d="M18 30 C30 22 40 40 54 28" fill="none" stroke="#166534" stroke-width="10" stroke-linecap="round"/><path d="M18 30 C30 22 40 40 54 28" fill="none" stroke="#4ade80" stroke-width="7" stroke-linecap="round" stroke-dasharray="5 4"/>' +
    '<path d="M20 76 C30 52 56 76 62 52 S76 30 82 32" fill="none" stroke="#4c1d95" stroke-width="15" stroke-linecap="round"/>' +
    '<path d="M20 76 C30 52 56 76 62 52 S76 30 82 32" fill="none" stroke="url(#slBody)" stroke-width="12" stroke-linecap="round"/>' +
    '<path d="M20 76 C30 52 56 76 62 52 S76 30 82 32" fill="none" stroke="#5b21b6" stroke-width="12" stroke-dasharray="3 9" stroke-linecap="round" opacity=".6"/>' +
    '<circle cx="83" cy="31" r="10" fill="url(#slBody)" stroke="#4c1d95" stroke-width="2"/><path d="M92 33 l6 -2 M92 33 l6 3" stroke="#ef4444" stroke-width="1.6" stroke-linecap="round"/>' +
    '<circle cx="84" cy="26" r="3.6" fill="#fff"/><circle cx="85.5" cy="26" r="1.8" fill="#111"/><circle cx="88" cy="34" r="3.2" fill="#fff"/><circle cx="89.4" cy="34" r="1.6" fill="#111"/>' +
    '<circle cx="34" cy="88" r="5" fill="url(#slFood)"/><circle cx="76" cy="82" r="6" fill="url(#slFood)"/><circle cx="46" cy="14" r="5" fill="url(#slFood)"/></svg>',

  create: function (api) {
    var DIFF = [{ bots: 7, aggr: 0, bspeed: 0.9 }, { bots: 11, aggr: 0.3, bspeed: 1 }, { bots: 15, aggr: 0.6, bspeed: 1.05 }, { bots: 19, aggr: 0.9, bspeed: 1.12 }];
    var NAMES = ['Kaa', 'Viper', 'Zmey', 'Slinky', 'Noodle', 'Python', 'Mamba', 'Cobra', 'Boa', 'Ziggy', 'Lola', 'Rex', 'Nyx', 'Spark', 'Mochi', 'Pixel', 'Taco', 'Bolt', 'Luna', 'Kiwi'];
    var PAL = ['#f472b6', '#22d3ee', '#facc15', '#fb923c', '#4ade80', '#60a5fa', '#f87171', '#c084fc', '#2dd4bf', '#a3e635'];
    var WR = 1500, SP = 150, SPB = 290, SEG = 7;
    var D, snakes, food, me, cam, zoom, t, boost, deadT, boostBtn = { x: -999, y: -999, r: 1 }, bonus;
    // v2.0: сферы-усилители на арене — магнит, щит, двойная еда
    var orbs = [], pw = { magnet: 0, shield: 0, x2: 0 }, ORBC = { magnet: '#f472b6', shield: '#38bdf8', x2: '#facc15' };
    function spawnOrb() { var a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * WR * 0.9, ks = Object.keys(ORBC); orbs.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, k: ks[Math.floor(Math.random() * ks.length)] }); }
    // плавающий джойстик: точка касания — центр, змейка ползёт туда, куда ведёшь палец от центра
    var JR = 56, joy = null, hexTile = null;
    function onBoost(p) { return Math.hypot(p.x - boostBtn.x, p.y - boostBtn.y) < boostBtn.r * 1.35; }

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function makeSnake(x, y, col, name, bot, mass) {
      var s = { x: x, y: y, a: rnd(0, 6.283), ta: 0, body: [], mass: mass || 20, col: col, col2: shade(col), name: name, bot: bot, alive: true, boost: false, think: 0, id: Math.random() };
      for (var i = 0; i < 12; i++) s.body.push({ x: x, y: y });
      s.ta = s.a;
      return s;
    }
    function shade(hex) {
      var n = parseInt(hex.slice(1), 16), r = (n >> 16) * 0.65 | 0, g = ((n >> 8) & 255) * 0.65 | 0, b = (n & 255) * 0.65 | 0;
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    }
    function width(s) { return 7 + Math.min(18, Math.sqrt(s.mass) * 1.1); }
    function targetLen(s) { return Math.floor(10 + s.mass * 0.9); }
    function spawnFood(x, y, v, col) {
      food.push({ x: x != null ? x : 0, y: y != null ? y : 0, v: v || rnd(1, 2.5), col: col || PAL[Math.floor(Math.random() * PAL.length)], ph: Math.random() * 6 });
      if (x == null) { var a = rnd(0, 6.283), r = Math.sqrt(Math.random()) * WR * 0.97; food[food.length - 1].x = Math.cos(a) * r; food[food.length - 1].y = Math.sin(a) * r; }
    }
    function safeSpot() {
      for (var k = 0; k < 40; k++) {
        var a = rnd(0, 6.283), r = Math.sqrt(Math.random()) * WR * 0.8, x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (!snakes.some(function (s) { return s.alive && Math.hypot(s.x - x, s.y - y) < 260; })) return [x, y];
      }
      return [0, 0];
    }
    function kill(s) {
      s.alive = false;
      for (var i = 0; i < s.body.length; i += 2) spawnFood(s.body[i].x + rnd(-8, 8), s.body[i].y + rnd(-8, 8), Math.max(1.5, s.mass / s.body.length * 2.2), s.col);
      if (s === me) { deadT = 1.6; api.sound('hit'); api.vibrate(250); }
      else if (Math.hypot(s.x - me.x, s.y - me.y) < 500) api.sound('break');
    }
    function moveSnake(s, dt) {
      var turn = (s.bot ? 3.6 : 4.6) * (s.boost ? 0.8 : 1);
      var da = Math.atan2(Math.sin(s.ta - s.a), Math.cos(s.ta - s.a));
      s.a += Math.max(-turn * dt, Math.min(turn * dt, da));
      var sp = (s.boost && s.mass > 12 ? SPB : SP) * (s.bot ? D.bspeed : 1);
      if (s.boost && s.mass > 12) {
        s.mass -= dt * 4;
        s.dropT = (s.dropT || 0) + dt;
        if (s.dropT > 0.12) { s.dropT = 0; var tail = s.body[s.body.length - 1]; spawnFood(tail.x, tail.y, 1, s.col); }
      }
      s.x += Math.cos(s.a) * sp * dt; s.y += Math.sin(s.a) * sp * dt;
      // тело следует за головой с фиксированным шагом
      var prev = { x: s.x, y: s.y };
      for (var i = 0; i < s.body.length; i++) {
        var b = s.body[i], dx = b.x - prev.x, dy = b.y - prev.y, d = Math.hypot(dx, dy);
        if (d > SEG) { b.x = prev.x + dx / d * SEG; b.y = prev.y + dy / d * SEG; }
        prev = b;
      }
      var L = targetLen(s);
      while (s.body.length < L) { var last = s.body[s.body.length - 1]; s.body.push({ x: last.x, y: last.y }); }
      while (s.body.length > L && s.body.length > 10) s.body.pop();
      if (Math.hypot(s.x, s.y) > WR - width(s) / 2) kill(s);
    }
    function botThink(s, dt) {
      s.think -= dt;
      if (s.think > 0) return;
      s.think = rnd(0.15, 0.35);
      // избегать стены
      var dc = Math.hypot(s.x, s.y);
      if (dc > WR - 220) { s.ta = Math.atan2(-s.y, -s.x) + rnd(-0.5, 0.5); s.boost = false; return; }
      // избегать тел впереди
      var ax = s.x + Math.cos(s.a) * 70, ay = s.y + Math.sin(s.a) * 70, danger = false;
      for (var i = 0; i < snakes.length && !danger; i++) {
        var o = snakes[i]; if (o === s || !o.alive) continue;
        if (Math.abs(o.x - s.x) > 400 || Math.abs(o.y - s.y) > 400) continue;
        for (var j = 0; j < o.body.length; j += 2) { if (Math.hypot(o.body[j].x - ax, o.body[j].y - ay) < width(o) + 26) { danger = true; break; } }
      }
      if (danger) { s.ta = s.a + (Math.random() < 0.5 ? 1.6 : -1.6); s.boost = false; return; }
      // атаковать игрока: срезать путь перед его головой
      if (me.alive && Math.random() < D.aggr && s.mass > 30 && Math.hypot(me.x - s.x, me.y - s.y) < 360) {
        var px = me.x + Math.cos(me.a) * 110, py = me.y + Math.sin(me.a) * 110;
        s.ta = Math.atan2(py - s.y, px - s.x); s.boost = Math.random() < 0.5 * D.aggr; return;
      }
      // искать еду
      var best = null, bd = 1e9;
      for (var k = 0; k < food.length; k += 3) {
        var f = food[k], d = Math.abs(f.x - s.x) + Math.abs(f.y - s.y) - f.v * 30;
        if (d < bd) { bd = d; best = f; }
      }
      if (best) s.ta = Math.atan2(best.y - s.y, best.x - s.x);
      s.boost = false;
    }
    function collide() {
      for (var i = 0; i < snakes.length; i++) {
        var s = snakes[i]; if (!s.alive) continue;
        var hr = width(s) / 2;
        for (var j = 0; j < snakes.length; j++) {
          var o = snakes[j]; if (o === s || !o.alive) continue;
          if (Math.abs(o.x - s.x) > 600 || Math.abs(o.y - s.y) > 600) continue;
          var or = width(o) / 2;
          if (s === me && pw.shield > 0) break;
          for (var k = 2; k < o.body.length; k++) {
            var b = o.body[k];
            if ((b.x - s.x) * (b.x - s.x) + (b.y - s.y) * (b.y - s.y) < (hr + or) * (hr + or) * 0.8) { if (o === me && s !== me) { bonus += Math.round(s.mass / 2); api.toast('+' + Math.round(s.mass / 2)); api.sound('coin'); } kill(s); break; }
          }
          if (!s.alive) break;
        }
      }
    }
    function eat(s) {
      var r = width(s) / 2 + 10, r2 = r + (s === me && pw.magnet > 0 ? 180 : 50);
      for (var i = food.length - 1; i >= 0; i--) {
        var f = food[i], dx = f.x - s.x, dy = f.y - s.y;
        if (Math.abs(dx) > r2 || Math.abs(dy) > r2) continue;
        var d2 = dx * dx + dy * dy;
        if (d2 < r * r) { s.mass += f.v * (s === me && pw.x2 > 0 ? 2 : 1); food.splice(i, 1); if (s === me && Math.random() < 0.3) api.sound('eat'); }
        else if (d2 < r2 * r2) { var d = Math.sqrt(d2); f.x -= dx / d * 140 * 0.016; f.y -= dy / d * 140 * 0.016; }
      }
    }
    var sprites = {}, vigOff = null, vigKey = '';
    function hexRgb(hex) { var n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    function mix(rgb, m, k) { return 'rgb(' + Math.round(rgb[0] + (m[0] - rgb[0]) * k) + ',' + Math.round(rgb[1] + (m[1] - rgb[1]) * k) + ',' + Math.round(rgb[2] + (m[2] - rgb[2]) * k) + ')'; }
    function segSprite(col, kind) { // шарик-сегмент с объёмом; kind: 0 основной, 1 тёмная полоса, 2 с пятнами
      var key = col + kind; if (sprites[key]) return sprites[key];
      var S = 64, cv = document.createElement('canvas'); cv.width = cv.height = S;
      var g = cv.getContext('2d'), rgb = hexRgb(col), base = kind === 1 ? rgb.map(function (v) { return v * 0.62; }) : rgb;
      var rg = g.createRadialGradient(S * 0.4, S * 0.36, 2, S / 2, S / 2, S / 2);
      rg.addColorStop(0, mix(base, [255, 255, 255], 0.45)); rg.addColorStop(0.55, mix(base, [0, 0, 0], 0)); rg.addColorStop(1, mix(base, [0, 0, 0], 0.5));
      g.fillStyle = rg; g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 1, 0, 6.283); g.fill();
      if (kind === 2) { g.fillStyle = mix(rgb, [0, 0, 0], 0.45); [[0.36, 0.6, 0.11], [0.62, 0.38, 0.09], [0.66, 0.7, 0.07]].forEach(function (sp) { g.beginPath(); g.arc(S * sp[0], S * sp[1], S * sp[2], 0, 6.283); g.fill(); }); }
      g.strokeStyle = mix(base, [0, 0, 0], 0.6); g.globalAlpha = 0.5; g.lineWidth = 2; g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 2, 0, 6.283); g.stroke(); g.globalAlpha = 1;
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(S * 0.36, S * 0.3, S * 0.14, S * 0.08, -0.6, 0, 6.283); g.fill();
      return (sprites[key] = cv);
    }
    function foodSprite(col) {
      var key = 'f' + col; if (sprites[key]) return sprites[key];
      var S = 48, cv = document.createElement('canvas'); cv.width = cv.height = S;
      var g = cv.getContext('2d'), rgb = hexRgb(col), rg = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.16, mix(rgb, [255, 255, 255], 0.35)); rg.addColorStop(0.42, col);
      rg.addColorStop(0.47, 'rgba(' + rgb.join(',') + ',.45)'); rg.addColorStop(1, 'rgba(' + rgb.join(',') + ',0)');
      g.fillStyle = rg; g.fillRect(0, 0, S, S);
      return (sprites[key] = cv);
    }
    function patOf(s) { var n = parseInt(s.col.slice(1), 16); return n % 3; }
    function drawSnake(c, s) {
      var w = width(s), n = s.body.length, pat = patOf(s);
      c.lineCap = 'round'; c.lineJoin = 'round';
      if (api.quality > 0) { // мягкая тень
        c.globalAlpha = 0.35; c.strokeStyle = '#000'; c.lineWidth = w * 0.95; c.beginPath(); c.moveTo(s.x + 3, s.y + 5);
        for (var q0 = 0; q0 < n; q0 += 2) c.lineTo(s.body[q0].x + 3, s.body[q0].y + 5);
        c.stroke(); c.globalAlpha = 1;
      }
      if (s.boost && s.mass > 12) { // свечение без shadowBlur — он очень медленный на телефонах
        c.globalAlpha = 0.3; c.strokeStyle = s.col; c.lineWidth = w * 1.9; c.beginPath(); c.moveTo(s.x, s.y);
        for (var q = 0; q < n; q += 2) c.lineTo(s.body[q].x, s.body[q].y);
        c.stroke(); c.globalAlpha = 1;
      }
      var sp0 = segSprite(s.col, 0), sp1 = segSprite(s.col, 1), sp2 = segSprite(s.col, 2);
      for (var i = n - 1; i >= 0; i--) {
        var b = s.body[i], img;
        if (pat === 0) img = (Math.floor(i / 4) % 2) ? sp0 : sp1;
        else if (pat === 1) img = i % 6 < 2 ? sp1 : sp0;
        else img = i % 5 === 0 ? sp1 : sp2;
        var tw = i > n - 8 ? w * (0.62 + 0.38 * (n - i) / 8) : w;
        c.drawImage(img, b.x - tw / 2, b.y - tw / 2, tw, tw);
      }
      var hw = w * 1.12;
      c.drawImage(sp0, s.x - hw / 2, s.y - hw / 2, hw, hw);
      var ca = Math.cos(s.a), sa = Math.sin(s.a);
      if (Math.sin(t * 3 + s.id * 40) > 0.8) { // язык
        c.strokeStyle = '#ef4444'; c.lineWidth = Math.max(1.2, w * 0.08);
        var tx = s.x + ca * w * 0.55, ty = s.y + sa * w * 0.55, tx2 = s.x + ca * w * 0.95, ty2 = s.y + sa * w * 0.95;
        c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx2, ty2);
        c.lineTo(tx2 + Math.cos(s.a + 0.5) * w * 0.18, ty2 + Math.sin(s.a + 0.5) * w * 0.18); c.moveTo(tx2, ty2);
        c.lineTo(tx2 + Math.cos(s.a - 0.5) * w * 0.18, ty2 + Math.sin(s.a - 0.5) * w * 0.18); c.stroke();
      }
      // глаза
      for (var e = -1; e <= 1; e += 2) {
        var ex = s.x + Math.cos(s.a + e * 0.6) * w * 0.32, ey = s.y + Math.sin(s.a + e * 0.6) * w * 0.32;
        c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(ex, ey + 0.8, w * 0.23, 0, 6.283); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(ex, ey, w * 0.21, 0, 6.283); c.fill();
        c.fillStyle = '#111'; c.beginPath(); c.arc(ex + ca * w * 0.08, ey + sa * w * 0.08, w * 0.11, 0, 6.283); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + ca * w * 0.05 - w * 0.04, ey + sa * w * 0.05 - w * 0.05, w * 0.04, 0, 6.283); c.fill();
      }
      c.font = '800 12px system-ui, sans-serif'; c.textAlign = 'center';
      c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.55)'; c.strokeText(s.name, s.x, s.y - w - 8);
      c.fillStyle = 'rgba(255,255,255,.92)'; c.fillText(s.name, s.x, s.y - w - 8);
    }

    // одна плитка шестиугольной сетки (повторяется паттерном)
    function makeHexTile() {
      var hs = 44, hw = hs * Math.sqrt(3), cv = document.createElement('canvas');
      cv.width = Math.round(hw); cv.height = Math.round(hs * 3);
      var g = cv.getContext('2d');
      g.scale(cv.width / hw, cv.height / (hs * 3));
      g.fillStyle = '#0d1222'; g.fillRect(0, 0, hw, hs * 3);
      [[0, 0], [hw, 0], [hw / 2, hs * 1.5], [0, hs * 3], [hw, hs * 3]].forEach(function (o) {
        function hexP(r) { g.beginPath(); for (var k = 0; k < 6; k++) { var a = k * Math.PI / 3 + Math.PI / 6; g.lineTo(o[0] + Math.cos(a) * r, o[1] + Math.sin(a) * r); } g.closePath(); }
        var hg = g.createLinearGradient(o[0], o[1] - hs, o[0], o[1] + hs); hg.addColorStop(0, '#182040'); hg.addColorStop(1, '#0f1428');
        hexP(hs * 0.9); g.fillStyle = hg; g.fill();
        g.strokeStyle = 'rgba(129,140,248,.16)'; g.lineWidth = 2; g.stroke();
        hexP(hs * 0.8); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1.5; g.stroke();
        g.fillStyle = 'rgba(129,140,248,.08)'; g.beginPath(); g.arc(o[0], o[1], 2.2, 0, 6.283); g.fill();
      });
      return cv;
    }

    return {
      reset: function () {
        D = DIFF[api.diff]; snakes = []; food = []; t = 0; deadT = 0; boost = false; zoom = 1; bonus = 0;
        orbs = []; pw = { magnet: 0, shield: 0, x2: 0 };
        me = makeSnake(0, 0, '#a78bfa', api.t('g.you'), false, 20);
        snakes.push(me);
        for (var i = 0; i < D.bots; i++) { var p = safeSpot(); snakes.push(makeSnake(p[0], p[1], PAL[i % PAL.length], NAMES[i % NAMES.length], true, rnd(15, 60 + api.diff * 30))); }
        for (var f = 0; f < 650; f++) spawnFood();
        cam = { x: 0, y: 0 }; joy = null;
        api.setScore(20);
      },
      idle: function (dt) { t += dt; },
      key: function (k, down) {
        if (k === 'a') boost = down;
        if (down && k === 'left') me.ta = me.a - 0.9; if (down && k === 'right') me.ta = me.a + 0.9;
      },
      input: function (type, d) {
        if (type === 'press') { if (!onBoost(d)) joy = { ox: d.x, oy: d.y, x: d.x, y: d.y }; return; }
        if (type !== 'multi') return;
        var b = false, st = null;
        d.forEach(function (p) { if (onBoost(p)) b = true; else if (!st) st = p; });
        boost = b;
        if (!st) { joy = null; return; }
        if (!joy) joy = { ox: st.x, oy: st.y, x: st.x, y: st.y };
        joy.x = st.x; joy.y = st.y;
        var dx = joy.x - joy.ox, dy = joy.y - joy.oy, dd = Math.hypot(dx, dy);
        if (dd > JR) { joy.ox = joy.x - dx / dd * JR; joy.oy = joy.y - dy / dd * JR; } // центр тянется за пальцем
        if (dd > 6 && me.alive) me.ta = Math.atan2(dy, dx);
      },
      update: function (dt) {
        t += dt;
        if (deadT > 0) { deadT -= dt; if (deadT <= 0) api.gameOver(); }
        me.boost = boost;
        snakes.forEach(function (s) { if (s.alive && s.bot) botThink(s, dt); });
        snakes.forEach(function (s) { if (s.alive) { moveSnake(s, dt); eat(s); } });
        collide();
        // возрождение ботов
        for (var i = 0; i < snakes.length; i++) {
          var s = snakes[i];
          if (!s.alive && s.bot) { s.respawn = (s.respawn || 0) + dt; if (s.respawn > 3) { var p = safeSpot(); snakes[i] = makeSnake(p[0], p[1], s.col, s.name, true, rnd(15, 50 + api.diff * 25)); } }
        }
        while (food.length < 650) spawnFood();
        while (orbs.length < 7) spawnOrb();
        for (var pk in pw) if (pw[pk] > 0) pw[pk] -= dt;
        if (me.alive) for (var oi = orbs.length - 1; oi >= 0; oi--) {
          var ob = orbs[oi];
          if (Math.hypot(ob.x - me.x, ob.y - me.y) < width(me) / 2 + 18) {
            pw[ob.k] = ob.k === 'shield' ? 8 : 12; orbs.splice(oi, 1);
            api.sound('bonus'); api.vibrate(25); api.toast(api.t('slither.' + ob.k));
          }
        }
        if (me.alive) { api.setScore(Math.round(me.mass) + bonus); cam.x += (me.x - cam.x) * Math.min(1, dt * 8); cam.y += (me.y - cam.y) * Math.min(1, dt * 8); }
        var tz = 1 / (1 + Math.min(0.8, me.mass / 600));
        zoom += (tz - zoom) * Math.min(1, dt * 2);
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        c.fillStyle = '#12070c'; c.fillRect(0, 0, W, H);
        c.save();
        c.translate(W / 2, H / 2); c.scale(zoom, zoom); c.translate(-cam.x, -cam.y);
        var vw = W / zoom, vh = H / zoom, x0 = cam.x - vw / 2 - 60, y0 = cam.y - vh / 2 - 60, x1 = cam.x + vw / 2 + 60, y1 = cam.y + vh / 2 + 60;
        // шестиугольная сетка
        if (!hexTile) hexTile = c.createPattern(makeHexTile(), 'repeat');
        c.save(); c.beginPath(); c.arc(0, 0, WR, 0, 6.283); c.clip();
        c.fillStyle = hexTile; c.fillRect(x0, y0, x1 - x0, y1 - y0);
        c.restore();
        // граница арены
        c.strokeStyle = 'rgba(239,68,68,.12)'; c.lineWidth = 90; c.beginPath(); c.arc(0, 0, WR + 45, 0, 6.283); c.stroke();
        c.strokeStyle = 'rgba(239,68,68,.22)'; c.lineWidth = 36; c.beginPath(); c.arc(0, 0, WR + 18, 0, 6.283); c.stroke();
        c.strokeStyle = 'rgba(248,113,113,.9)'; c.lineWidth = 8; c.beginPath(); c.arc(0, 0, WR, 0, 6.283); c.stroke();
        c.strokeStyle = 'rgba(254,202,202,.7)'; c.lineWidth = 2; c.setLineDash([18, 22]); c.lineDashOffset = -t * 30; c.beginPath(); c.arc(0, 0, WR - 8, 0, 6.283); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0;
        // еда
        food.forEach(function (f) {
          if (f.x < x0 || f.x > x1 || f.y < y0 || f.y > y1) return;
          var r = 3 + f.v * 1.6 + Math.sin(t * 4 + f.ph) * 0.8, rs = r * 2.3;
          c.drawImage(foodSprite(f.col), f.x - rs, f.y - rs, rs * 2, rs * 2);
        });
        orbs.forEach(function (ob) {
          if (ob.x < x0 || ob.x > x1 || ob.y < y0 || ob.y > y1) return;
          var pr = 13 + Math.sin(t * 5 + ob.x) * 2, col = ORBC[ob.k];
          c.drawImage(foodSprite(col), ob.x - pr * 2.4, ob.y - pr * 2.4, pr * 4.8, pr * 4.8);
          c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.5; c.beginPath(); c.arc(ob.x, ob.y, pr + 5, t * 3, t * 3 + 2); c.stroke();
          c.globalAlpha = 1; c.strokeStyle = col; c.lineWidth = 3; c.fillStyle = 'rgba(15,23,42,.8)';
          c.beginPath(); c.arc(ob.x, ob.y, pr, 0, 6.283); c.fill(); c.stroke();
          c.fillStyle = col; c.font = '900 13px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(ob.k === 'magnet' ? 'U' : ob.k === 'shield' ? '◈' : '×2', ob.x, ob.y + 1);
        });
        if (me.alive && pw.shield > 0) { c.strokeStyle = 'rgba(56,189,248,' + (0.4 + 0.3 * Math.sin(t * 8)) + ')'; c.lineWidth = 4; c.beginPath(); c.arc(me.x, me.y, width(me) + 10, 0, 6.283); c.stroke(); }
        if (me.alive && pw.magnet > 0) { c.strokeStyle = 'rgba(244,114,182,.2)'; c.lineWidth = 2; c.beginPath(); c.arc(me.x, me.y, width(me) / 2 + 190, 0, 6.283); c.stroke(); }
        snakes.forEach(function (s) { if (s.alive && s !== me && s.x > x0 - 300 && s.x < x1 + 300 && s.y > y0 - 300 && s.y < y1 + 300) drawSnake(c, s); });
        if (me.alive) drawSnake(c, me);
        c.restore();
        var vk = W + 'x' + H;
        if (vk !== vigKey) {
          vigKey = vk; var dpr = Math.min(2, window.devicePixelRatio || 1); vigOff = document.createElement('canvas'); vigOff.width = Math.ceil(W * dpr); vigOff.height = Math.ceil(H * dpr);
          var vx = vigOff.getContext('2d'); vx.setTransform(dpr, 0, 0, dpr, 0, 0);
          var vg = vx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72);
          vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,8,.55)'); vx.fillStyle = vg; vx.fillRect(0, 0, W, H);
        }
        c.drawImage(vigOff, 0, 0, W, H);
        // лидеры
        var alive = snakes.filter(function (s) { return s.alive; }).sort(function (a, b) { return b.mass - a.mass; });
        c.fillStyle = 'rgba(10,12,30,.6)'; c.beginPath(); if (c.roundRect) c.roundRect(W - 138, 8, 130, 102, 12); else c.rect(W - 138, 8, 130, 102); c.fill();
        c.strokeStyle = 'rgba(129,140,248,.35)'; c.lineWidth = 1; c.stroke();
        c.fillStyle = 'rgba(253,224,71,.15)'; c.fillRect(W - 130, 28, 114, 1);
        c.font = '800 11px system-ui, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillStyle = '#fde047'; c.fillText(api.t('slither.top'), W - 130, 20);
        alive.slice(0, 5).forEach(function (s, i) {
          c.fillStyle = s === me ? '#a78bfa' : 'rgba(255,255,255,.8)';
          c.fillText((i + 1) + '. ' + s.name, W - 130, 38 + i * 16);
          c.textAlign = 'right'; c.fillText(String(Math.round(s.mass)), W - 14, 38 + i * 16); c.textAlign = 'left';
        });
        var rank = alive.indexOf(me) + 1;
        c.fillStyle = 'rgba(255,255,255,.75)'; c.font = '800 13px system-ui, sans-serif';
        c.fillText(api.t('slither.len') + ': ' + Math.round(me.mass) + (rank ? '  ·  #' + rank + '/' + alive.length : ''), 12, 20);
        var py0 = 40;
        for (var pk2 in pw) if (pw[pk2] > 0) { c.fillStyle = ORBC[pk2]; c.fillText((pk2 === 'magnet' ? 'U ' : pk2 === 'shield' ? '◈ ' : '×2 ') + Math.ceil(pw[pk2]), 12, py0); py0 += 18; }
        // мини-карта
        var mr = 40, mx = 12 + mr, my = H - 12 - mr;
        c.fillStyle = 'rgba(10,12,30,.65)'; c.beginPath(); c.arc(mx, my, mr, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(239,68,68,.7)'; c.lineWidth = 2; c.stroke();
        c.strokeStyle = 'rgba(129,140,248,.15)'; c.lineWidth = 1; c.beginPath(); c.arc(mx, my, mr * 0.5, 0, 6.283); c.moveTo(mx - mr, my); c.lineTo(mx + mr, my); c.moveTo(mx, my - mr); c.lineTo(mx, my + mr); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; c.strokeRect(mx + (cam.x - W / zoom / 2) / WR * mr, my + (cam.y - H / zoom / 2) / WR * mr, W / zoom / WR * mr, H / zoom / WR * mr);
        snakes.forEach(function (s) { if (!s.alive) return; c.fillStyle = s === me ? '#fff' : s.col; c.beginPath(); c.arc(mx + s.x / WR * mr, my + s.y / WR * mr, s === me ? 3 : 1.6, 0, 6.283); c.fill(); });
        // джойстик
        if (joy && me.alive) {
          c.fillStyle = 'rgba(255,255,255,.08)'; c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2;
          c.beginPath(); c.arc(joy.ox, joy.oy, JR, 0, 6.283); c.fill(); c.stroke();
          c.drawImage(segSprite('#a78bfa', 0), joy.x - 24, joy.y - 24, 48, 48);
        }
        // кнопка ускорения
        boostBtn = { x: W - 62, y: H - 66, r: 44 };
        var bgr = c.createRadialGradient(boostBtn.x - 12, boostBtn.y - 14, 4, boostBtn.x, boostBtn.y, boostBtn.r);
        if (boost) { bgr.addColorStop(0, '#fef08a'); bgr.addColorStop(1, '#ca8a04'); } else { bgr.addColorStop(0, 'rgba(255,255,255,.28)'); bgr.addColorStop(1, 'rgba(255,255,255,.06)'); }
        c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.arc(boostBtn.x, boostBtn.y + 3, boostBtn.r, 0, 6.283); c.fill();
        c.fillStyle = bgr; c.beginPath(); c.arc(boostBtn.x, boostBtn.y, boostBtn.r, 0, 6.283); c.fill();
        c.strokeStyle = boost ? '#fde047' : 'rgba(255,255,255,.5)'; c.lineWidth = 2; c.stroke();
        c.fillStyle = boost ? '#422006' : '#fff'; c.font = '900 22px system-ui, sans-serif'; c.textAlign = 'center';
        // молния рисуется контуром — эмодзи есть не на всех телефонах
        c.beginPath(); var bx = boostBtn.x, by = boostBtn.y;
        c.moveTo(bx + 4, by - 18); c.lineTo(bx - 10, by + 3); c.lineTo(bx - 1, by + 3); c.lineTo(bx - 4, by + 18); c.lineTo(bx + 10, by - 3); c.lineTo(bx + 1, by - 3); c.closePath(); c.fill();
        if (t < 5 && me.alive) { c.fillStyle = 'rgba(255,255,255,.5)'; c.font = '700 13px system-ui, sans-serif'; c.fillText(api.t('slither.tip'), W / 2, H - 22); }
      }
    };
  }
};
