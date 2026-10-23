/* Астероиды: корабль летит за пальцем и сам стреляет */
window.GAMES = window.GAMES || {};
window.GAMES.asteroids = {
  title: 'Астероиды',
  desc: 'Разбей метеоритный дождь',
  hint: 'Держи палец на экране — корабль поворачивает и летит к нему, пушка стреляет сама. Крупные камни раскалываются. Лови бонусы: тройной выстрел, щит, скорострельность.',
  d0: '5 жизней, медленные камни', d1: '3 жизни', d2: 'Быстрые камни, НЛО чаще', d3: '1 жизнь, метеоритный шторм',
  colors: ['#1e3a8a', '#7c3aed'],
  controls: 'none',
  isNew2: true,
  icon: '<svg viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="92" rx="20" fill="#0b1026"/><circle cx="38" cy="62" r="24" fill="#7c3aed" opacity=".28"/><circle cx="36" cy="64" r="16" fill="#db2777" opacity=".22"/><circle cx="72" cy="28" r="18" fill="#0ea5e9" opacity=".15"/>' +
    '<circle cx="20" cy="18" r="1.4" fill="#fff"/><circle cx="84" cy="62" r="1.2" fill="#fff"/><circle cx="12" cy="44" r="1" fill="#bfdbfe"/><circle cx="58" cy="88" r="1" fill="#fff"/><path d="M78 14 h8 M82 10 v8" stroke="#fff" stroke-width="1" opacity=".8"/>' +
    '<path d="M60 24 l15 -5 11 9 -1 15 -12 8 -13 -5 -5 -12z" fill="#8a837d" stroke="#e7e5e4" stroke-opacity=".5" stroke-width="1.5"/><path d="M73 51 l12 -8 1 -15 -6 -5 q2 18 -14 30z" fill="#292524" opacity=".5"/><path d="M62 26 l13 -4 4 3 q-12 0 -15 10z" fill="#e7e5e4" opacity=".5"/><circle cx="70" cy="32" r="4" fill="#000" opacity=".35"/><circle cx="78" cy="40" r="2.5" fill="#000" opacity=".3"/><circle cx="65" cy="40" r="2" fill="#000" opacity=".3"/>' +
    '<path d="M16 72 l9 -7 10 3 2 10 -8 7 -10 -3z" fill="#8a837d" stroke="#e7e5e4" stroke-opacity=".5" stroke-width="1.5"/><path d="M29 85 l8 -7 -2 -10 q0 12 -12 15z" fill="#292524" opacity=".5"/><circle cx="25" cy="73" r="2.5" fill="#000" opacity=".3"/>' +
    '<g transform="rotate(30 50 52)"><path d="M43 66 Q50 94 57 66z" fill="#f97316" opacity=".8"/><path d="M46 66 Q50 84 54 66z" fill="#fde047"/><path d="M36 64 L44 50 L44 64z M64 64 L56 50 L56 64z" fill="#3b82f6"/>' +
    '<path d="M50 30 Q56 44 56 66 H44 Q44 44 50 30z" fill="#e2e8f0" stroke="#1e293b" stroke-width="1"/><path d="M50 30 Q56 44 56 66 H51 Q52 44 50 30z" fill="#94a3b8"/><ellipse cx="50" cy="46" rx="3" ry="6" fill="#0ea5e9"/><ellipse cx="49" cy="44" rx="1" ry="2.5" fill="#fff" opacity=".8"/></g>' +
    '<path d="M58 34 l5 -8" stroke="#fde047" stroke-width="3" stroke-linecap="round"/><path d="M64 26 l4 -6" stroke="#fef9c3" stroke-width="2" stroke-linecap="round"/></svg>',

  create: function (api) {
    var DIFF = [
      { lives: 5, sp: 0.75, n: 3, ufo: 30, fire: 0.2 },
      { lives: 3, sp: 1, n: 4, ufo: 24, fire: 0.18 },
      { lives: 3, sp: 1.3, n: 5, ufo: 16, fire: 0.17 },
      { lives: 1, sp: 1.55, n: 6, ufo: 12, fire: 0.16 }
    ];
    var D, ship, rocks, bullets, ebullets, ufo, ufoT, pows, parts, stars, wave, lives, t, aim, fireT, inv, waveT, msgT, msg, power, deadT, keys, combo, comboT;
    var bgC = null, bgW = 0, bgH = 0, gCtx = null, gCache = {}, glowC = {}, texC = {}, rings = [], chunks = [];
    var SIZES = [0, 12, 22, 38], PTS = [0, 100, 50, 20];
    var POWS = [{ k: 'triple', c: '#38bdf8', s: '⋔' }, { k: 'shield', c: '#4ade80', s: '◎' }, { k: 'rapid', c: '#facc15', s: '»' }, { k: 'life', c: '#f472b6', s: '♥' }, { k: 'bomb', c: '#fb923c', s: '✸' }];

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function wrap(o) {
      var W = api.W, H = api.H, m = o.r || 10;
      if (o.x < -m) o.x += W + m * 2; else if (o.x > W + m) o.x -= W + m * 2;
      if (o.y < -m) o.y += H + m * 2; else if (o.y > H + m) o.y -= H + m * 2;
    }
    function rock(x, y, size, ang) {
      var sp = rnd(30, 70) * D.sp * (1 + (3 - size) * 0.35) * (1 + wave * 0.04), a = ang === undefined ? rnd(0, 6.283) : ang;
      var pts = [], n = 9 + size * 2;
      for (var i = 0; i < n; i++) pts.push(rnd(0.72, 1.12));
      return { x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, size: size, r: SIZES[size], a: 0, va: rnd(-1.2, 1.2), pts: pts, hp: size === 3 && api.diff >= 2 && Math.random() < 0.25 ? 2 : 1, hit: 0 };
    }
    function spawnWave() {
      wave++;
      var n = D.n + Math.floor(wave * 0.7);
      for (var i = 0; i < n; i++) {
        var x, y;
        do { x = rnd(0, api.W); y = rnd(0, api.H); } while (Math.hypot(x - ship.x, y - ship.y) < 170);
        rocks.push(rock(x, y, 3));
      }
      msg = api.t('ast.wave') + ' ' + wave; msgT = 1.6;
      if (wave > 1) { api.sound('bonus'); api.addScore(100 * (wave - 1)); }
    }
    function burst(x, y, col, n, sp) {
      for (var i = 0; i < n; i++) {
        var a = rnd(0, 6.283), v = rnd(20, sp || 160);
        parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rnd(0.3, 0.8), max: 0.8, c: col, r: rnd(1, 2.6) });
      }
    }
    function killRock(i, bullet) {
      var r = rocks[i];
      if (r.hp > 1) { r.hp--; r.hit = 0.15; burst(r.x, r.y, '#e7e5e4', 6, 90); api.sound('move'); return; }
      rocks.splice(i, 1);
      combo++; comboT = 1.2;
      var pts = PTS[r.size] * (combo >= 5 ? 2 : 1);
      api.addScore(pts);
      if (combo >= 3) api.fx.text(r.x, r.y - 10, 'x' + combo, combo >= 5 ? '#f472b6' : '#fde047', 16);
      burst(r.x, r.y, '#d6d3d1', 8 + r.size * 5, 60 + r.size * 40);
      debris(r);
      api.sound(r.size === 3 ? 'break' : 'stomp');
      if (r.size === 3) api.fx.shake(3);
      if (r.size > 1) {
        var base = bullet ? Math.atan2(bullet.vy, bullet.vx) : rnd(0, 6.283);
        rocks.push(rock(r.x, r.y, r.size - 1, base + rnd(0.4, 1.1)));
        rocks.push(rock(r.x, r.y, r.size - 1, base - rnd(0.4, 1.1)));
      }
      if (Math.random() < 0.07 + (r.size === 3 ? 0.05 : 0)) {
        var p = POWS[Math.floor(Math.random() * (lives < 3 ? 5 : 4))];
        if (p.k === 'life' && lives >= 3) p = POWS[0];
        pows.push({ x: r.x, y: r.y, k: p.k, c: p.c, s: p.s, life: 9, vx: rnd(-20, 20), vy: rnd(-20, 20) });
      }
    }
    function shipHit() {
      if (inv > 0 || deadT > 0) return;
      if (power.shield > 0) { power.shield = 0; inv = 1; api.sound('break'); api.fx.flash('#4ade80', 0.2); return; }
      lives--;
      rings.push({ x: ship.x, y: ship.y, r: 70, life: 0.6, max: 0.6 });
      burst(ship.x, ship.y, '#93c5fd', 40, 260); burst(ship.x, ship.y, '#fb923c', 25, 200);
      api.sound('hit'); api.vibrate(220); api.fx.shake(10); api.fx.flash('#ef4444', 0.3);
      power = { triple: 0, rapid: 0, shield: 0 };
      if (lives <= 0) { deadT = 1.4; return; }
      ship.x = api.W / 2; ship.y = api.H / 2; ship.vx = ship.vy = 0; inv = 2.5;
    }
    function debris(r) {
      rings.push({ x: r.x, y: r.y, r: r.r * 1.8, life: 0.4, max: 0.4 });
      var n = api.quality === 0 ? 2 : 3 + r.size * 2;
      for (var i = 0; i < n; i++) {
        var a = rnd(0, 6.283), v = rnd(30, 70 + r.size * 30);
        chunks.push({ x: r.x, y: r.y, vx: Math.cos(a) * v + r.vx * 0.5, vy: Math.sin(a) * v + r.vy * 0.5, a: rnd(0, 6.283), va: rnd(-6, 6), s: rnd(2, 3 + r.size * 1.5), life: rnd(0.5, 1.1), c: r.hp > 1 ? '#9a3412' : (Math.random() < 0.5 ? '#78716c' : '#a8a29e') });
      }
      if (api.quality > 0) for (var j = 0; j < 4 + r.size * 2; j++) {
        var b = rnd(0, 6.283), w = rnd(60, 180);
        parts.push({ x: r.x, y: r.y, vx: Math.cos(b) * w, vy: Math.sin(b) * w, life: rnd(0.2, 0.45), max: 0.45, c: Math.random() < 0.5 ? '#fdba74' : '#fde047', r: rnd(1, 2) });
      }
    }
    function shoot() {
      var spd = 520, n = power.triple > 0 ? 3 : 1;
      for (var i = 0; i < n; i++) {
        var a = ship.a + (i - (n - 1) / 2) * 0.18;
        bullets.push({ x: ship.x + Math.cos(ship.a) * 14, y: ship.y + Math.sin(ship.a) * 14, vx: Math.cos(a) * spd + ship.vx * 0.4, vy: Math.sin(a) * spd + ship.vy * 0.4, life: 0.9 });
      }
      api.tone(880 + Math.random() * 120, 0.05, 'square', 0.025);
    }
    function takePow(p) {
      api.sound('bonus'); api.vibrate(25);
      api.fx.text(p.x, p.y - 14, api.t('ast.' + p.k), p.c, 15);
      if (p.k === 'life') lives = Math.min(5, lives + 1);
      else if (p.k === 'bomb') {
        api.fx.flash('#fff', 0.4); api.fx.shake(8);
        for (var i = rocks.length - 1; i >= 0; i--) if (Math.hypot(rocks[i].x - ship.x, rocks[i].y - ship.y) < 220) killRock(i);
      } else power[p.k] = p.k === 'shield' ? 12 : 10;
    }

    return {
      reset: function () {
        D = DIFF[api.diff];
        ship = { x: api.W / 2, y: api.H / 2, vx: 0, vy: 0, a: -Math.PI / 2, thrust: false };
        rocks = []; bullets = []; ebullets = []; pows = []; parts = []; ufo = null; ufoT = D.ufo;
        wave = 0; lives = D.lives; t = 0; aim = null; fireT = 0; inv = 2; waveT = 0; msg = ''; msgT = 0; deadT = 0;
        power = { triple: 0, rapid: 0, shield: 0 }; keys = {}; combo = 0; comboT = 0; rings = []; chunks = [];
        stars = [];
        for (var i = 0; i < 90; i++) stars.push({ x: Math.random(), y: Math.random(), z: rnd(0.2, 1) });
        spawnWave();
      },
      resize: function () { },
      idle: function (dt) { t += dt; for (var i = 0; i < rocks.length; i++) { rocks[i].a += rocks[i].va * dt * 0.3; } },
      input: function (type, d) {
        if (type === 'down' || type === 'move') aim = { x: d.x, y: d.y };
        else if (type === 'up') aim = null;
      },
      key: function (k, down) { keys[k] = down; },
      update: function (dt) {
        t += dt;
        var W = api.W, H = api.H;
        if (deadT > 0) { deadT -= dt; if (deadT <= 0) api.gameOver(); }
        if (inv > 0) inv -= dt;
        if (msgT > 0) msgT -= dt;
        if (comboT > 0) { comboT -= dt; if (comboT <= 0) combo = 0; }
        for (var pk in power) if (power[pk] > 0) power[pk] -= dt;
        // управление кораблём
        if (deadT <= 0) {
          ship.thrust = false;
          if (aim) {
            var ta = Math.atan2(aim.y - ship.y, aim.x - ship.x), da = ta - ship.a;
            while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283;
            ship.a += Math.max(-7 * dt, Math.min(7 * dt, da));
            var dist = Math.hypot(aim.x - ship.x, aim.y - ship.y);
            if (dist > 40 && Math.abs(da) < 1.2) ship.thrust = true;
          }
          if (keys.left) ship.a -= 4.5 * dt;
          if (keys.right) ship.a += 4.5 * dt;
          if (keys.up) ship.thrust = true;
          if (ship.thrust) {
            ship.vx += Math.cos(ship.a) * 330 * dt; ship.vy += Math.sin(ship.a) * 330 * dt;
            if (Math.random() < 0.7) parts.push({ x: ship.x - Math.cos(ship.a) * 12, y: ship.y - Math.sin(ship.a) * 12, vx: -Math.cos(ship.a) * 120 + rnd(-30, 30), vy: -Math.sin(ship.a) * 120 + rnd(-30, 30), life: 0.3, max: 0.3, c: Math.random() < 0.5 ? '#fb923c' : '#fde047', r: rnd(1.5, 3) });
          }
          var sp = Math.hypot(ship.vx, ship.vy), maxS = 300;
          if (sp > maxS) { ship.vx *= maxS / sp; ship.vy *= maxS / sp; }
          ship.vx *= Math.pow(0.55, dt); ship.vy *= Math.pow(0.55, dt);
          ship.x += ship.vx * dt; ship.y += ship.vy * dt; ship.r = 10; wrap(ship);
          fireT -= dt;
          if (fireT <= 0) { shoot(); fireT = D.fire * (power.rapid > 0 ? 0.45 : 1); }
        }
        // пули
        for (var i = bullets.length - 1; i >= 0; i--) {
          var b = bullets[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; b.r = 2; wrap(b);
          var hit = false;
          for (var j = rocks.length - 1; j >= 0; j--) {
            var r = rocks[j];
            if (Math.hypot(r.x - b.x, r.y - b.y) < r.r) { killRock(j, b); hit = true; break; }
          }
          if (!hit && ufo && Math.hypot(ufo.x - b.x, ufo.y - b.y) < 16) {
            api.addScore(500); api.fx.text(ufo.x, ufo.y - 16, '+500', '#4ade80', 18);
            burst(ufo.x, ufo.y, '#4ade80', 30, 220); api.sound('coin'); api.fx.shake(5);
            pows.push({ x: ufo.x, y: ufo.y, k: POWS[Math.floor(Math.random() * 3)].k, c: '#fff', s: '★', life: 9, vx: 0, vy: 0 });
            var pp = pows[pows.length - 1], src = POWS.filter(function (q) { return q.k === pp.k; })[0]; pp.c = src.c; pp.s = src.s;
            ufo = null; hit = true;
          }
          if (hit || b.life <= 0) bullets.splice(i, 1);
        }
        // камни
        for (var k = 0; k < rocks.length; k++) {
          var rk = rocks[k]; rk.x += rk.vx * dt; rk.y += rk.vy * dt; rk.a += rk.va * dt; wrap(rk);
          if (rk.hit > 0) rk.hit -= dt;
          if (deadT <= 0 && Math.hypot(rk.x - ship.x, rk.y - ship.y) < rk.r + 8) {
            if (power.shield > 0) { killRock(k, null); k--; continue; }
            shipHit();
          }
        }
        // НЛО
        ufoT -= dt;
        if (!ufo && ufoT <= 0) {
          var fromL = Math.random() < 0.5;
          ufo = { x: fromL ? -20 : W + 20, y: rnd(60, H - 60), vx: (fromL ? 1 : -1) * rnd(70, 110) * D.sp, t: 0, shotT: 1.2 };
          ufoT = D.ufo + rnd(0, 8);
          api.tone(300, 0.3, 'sawtooth', 0.03);
        }
        if (ufo) {
          ufo.t += dt; ufo.x += ufo.vx * dt; ufo.y += Math.sin(ufo.t * 2.4) * 50 * dt;
          ufo.shotT -= dt;
          if (ufo.shotT <= 0 && deadT <= 0) {
            ufo.shotT = 1.6 - api.diff * 0.25;
            var aa = Math.atan2(ship.y - ufo.y, ship.x - ufo.x) + rnd(-0.25, 0.25) * (3 - api.diff) / 3;
            ebullets.push({ x: ufo.x, y: ufo.y, vx: Math.cos(aa) * 220, vy: Math.sin(aa) * 220, life: 2.4 });
            api.tone(220, 0.08, 'square', 0.03);
          }
          if (ufo.x < -40 || ufo.x > W + 40) ufo = null;
        }
        for (var e = ebullets.length - 1; e >= 0; e--) {
          var eb = ebullets[e]; eb.x += eb.vx * dt; eb.y += eb.vy * dt; eb.life -= dt;
          if (Math.hypot(eb.x - ship.x, eb.y - ship.y) < 10 && deadT <= 0) { ebullets.splice(e, 1); shipHit(); continue; }
          if (eb.life <= 0) ebullets.splice(e, 1);
        }
        // бонусы
        for (var q = pows.length - 1; q >= 0; q--) {
          var pw = pows[q]; pw.x += pw.vx * dt; pw.y += pw.vy * dt; pw.life -= dt; pw.r = 12; wrap(pw);
          if (deadT <= 0 && Math.hypot(pw.x - ship.x, pw.y - ship.y) < 24) { takePow(pw); pows.splice(q, 1); continue; }
          if (pw.life <= 0) pows.splice(q, 1);
        }
        for (var pi = parts.length - 1; pi >= 0; pi--) {
          var p = parts[pi]; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; p.life -= dt;
          if (p.life <= 0) parts.splice(pi, 1);
        }
        for (var wi = rings.length - 1; wi >= 0; wi--) { rings[wi].life -= dt; if (rings[wi].life <= 0) rings.splice(wi, 1); }
        for (var ci = chunks.length - 1; ci >= 0; ci--) { var ch = chunks[ci]; ch.x += ch.vx * dt; ch.y += ch.vy * dt; ch.a += ch.va * dt; ch.life -= dt; if (ch.life <= 0) chunks.splice(ci, 1); }
        if (!rocks.length && deadT <= 0) { waveT += dt; if (waveT > 1.2) { waveT = 0; spawnWave(); inv = Math.max(inv, 1.2); } }
      },
      draw: function (c) {
        var W = api.W, H = api.H, Q = api.quality;
        if (!bgC || bgW !== W || bgH !== H) buildBg();
        if (gCtx !== c) { gCtx = c; gCache = {}; }
        c.drawImage(bgC, 0, 0, W, H);
        // звёзды с параллаксом (ближний слой)
        for (var i = 0; i < stars.length; i++) {
          var s = stars[i], sx = ((s.x * W - ship.x * s.z * 0.08) % W + W) % W, sy = ((s.y * H - ship.y * s.z * 0.08) % H + H) % H;
          var tw = 0.7 + 0.3 * Math.sin(t * 2 + i);
          c.globalAlpha = 0.3 + s.z * 0.6 * tw;
          c.fillStyle = i % 7 === 0 ? '#bfdbfe' : i % 11 === 0 ? '#fde68a' : '#fff';
          c.fillRect(sx, sy, s.z * 2, s.z * 2);
          if (s.z > 0.9 && Q > 0) {
            c.globalAlpha = 0.35 * tw; var gl = 5 * s.z * tw;
            c.fillRect(sx - gl + s.z, sy + s.z - 0.4, gl * 2, 0.8); c.fillRect(sx + s.z - 0.4, sy - gl + s.z, 0.8, gl * 2);
          }
        }
        c.globalAlpha = 1;
        // ударные волны
        for (var wi = 0; wi < rings.length; wi++) {
          var rg0 = rings[wi], q = 1 - rg0.life / rg0.max;
          c.strokeStyle = 'rgba(253,186,116,' + (0.6 * (1 - q)).toFixed(3) + ')'; c.lineWidth = 3 * (1 - q) + 0.5;
          c.beginPath(); c.arc(rg0.x, rg0.y, rg0.r * (0.3 + q), 0, 6.283); c.stroke();
        }
        // камни
        for (var ri = 0; ri < rocks.length; ri++) drawRock(c, rocks[ri], Q);
        // осколки
        for (var ci = 0; ci < chunks.length; ci++) {
          var ch = chunks[ci];
          c.save(); c.translate(ch.x, ch.y); c.rotate(ch.a); c.globalAlpha = Math.min(1, ch.life * 2);
          c.fillStyle = ch.c; c.beginPath(); c.moveTo(ch.s, 0); c.lineTo(-ch.s * 0.6, ch.s * 0.8); c.lineTo(-ch.s * 0.8, -ch.s * 0.5); c.closePath(); c.fill();
          c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(ch.s, 0); c.lineTo(-ch.s * 0.8, -ch.s * 0.5); c.lineTo(-ch.s * 0.1, -ch.s * 0.1); c.closePath(); c.fill();
          c.restore();
        }
        c.globalAlpha = 1;
        // бонусы
        c.textAlign = 'center'; c.textBaseline = 'middle';
        pows.forEach(function (p) {
          if (p.life < 2 && Math.floor(t * 8) % 2) return;
          c.save(); c.translate(p.x, p.y);
          if (Q > 0) c.drawImage(glow(p.c), -30, -30, 60, 60);
          c.rotate(Math.sin(t * 3) * 0.3);
          var pg = c.createRadialGradient(-4, -5, 1, 0, 0, 13);
          pg.addColorStop(0, '#334155'); pg.addColorStop(1, '#0b1026');
          c.fillStyle = pg; c.beginPath(); c.arc(0, 0, 12, 0, 6.283); c.fill();
          c.strokeStyle = p.c; c.lineWidth = 2.5; c.stroke();
          c.save(); c.rotate(t * 2); c.strokeStyle = p.c; c.globalAlpha = 0.6; c.lineWidth = 1.5; c.setLineDash([4, 5]);
          c.beginPath(); c.arc(0, 0, 16, 0, 6.283); c.stroke(); c.setLineDash([]); c.restore();
          c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-4, -6, 5, 2.5, -0.5, 0, 6.283); c.fill();
          c.fillStyle = p.c; c.font = '900 14px system-ui, sans-serif'; c.fillText(p.s, 0, 1);
          c.restore();
        });
        // лазеры
        if (Q > 0) c.globalCompositeOperation = 'lighter';
        c.lineCap = 'round';
        for (var bi = 0; bi < bullets.length; bi++) {
          var b = bullets[bi], bl = 0.028;
          c.strokeStyle = 'rgba(245,158,11,.55)'; c.lineWidth = 6;
          c.beginPath(); c.moveTo(b.x - b.vx * bl, b.y - b.vy * bl); c.lineTo(b.x, b.y); c.stroke();
          c.strokeStyle = '#fde047'; c.lineWidth = 2.2;
          c.beginPath(); c.moveTo(b.x - b.vx * bl * 0.8, b.y - b.vy * bl * 0.8); c.lineTo(b.x, b.y); c.stroke();
        }
        for (var ei = 0; ei < ebullets.length; ei++) {
          var eb = ebullets[ei];
          if (Q > 0) c.drawImage(glow('#f87171'), eb.x - 12, eb.y - 12, 24, 24);
          c.fillStyle = '#fecaca'; c.beginPath(); c.arc(eb.x, eb.y, 3.2, 0, 6.283); c.fill();
          c.fillStyle = '#ef4444'; c.beginPath(); c.arc(eb.x, eb.y, 3.2, 0, 6.283); c.globalAlpha = 0.5; c.fill(); c.globalAlpha = 1;
        }
        c.lineCap = 'butt';
        // частицы
        for (var pi = 0; pi < parts.length; pi++) {
          var p = parts[pi]; c.globalAlpha = Math.max(0, p.life / p.max); c.fillStyle = p.c;
          c.beginPath(); c.arc(p.x, p.y, p.r * (0.5 + 0.5 * p.life / p.max), 0, 6.283); c.fill();
        }
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        // НЛО
        if (ufo) drawUfo(c, Q);
        // корабль
        if (deadT <= 0 && !(inv > 0 && Math.floor(t * 12) % 2)) drawShip(c, Q);
        // прицел пальца
        if (aim) {
          c.save(); c.translate(aim.x, aim.y); c.rotate(t * 1.5);
          c.strokeStyle = 'rgba(147,197,253,.5)'; c.lineWidth = 2;
          for (var ai = 0; ai < 4; ai++) { c.beginPath(); c.arc(0, 0, 16, ai * 1.571 + 0.25, ai * 1.571 + 1.32); c.stroke(); }
          c.fillStyle = 'rgba(147,197,253,.7)'; c.beginPath(); c.arc(0, 0, 2, 0, 6.283); c.fill();
          c.restore();
        }
        // HUD
        for (var l = 0; l < lives; l++) {
          c.save(); c.translate(20 + l * 22, 22); c.rotate(-Math.PI / 2); c.scale(0.62, 0.62);
          shipBody(c, false); c.restore();
        }
        c.font = '800 13px system-ui, sans-serif';
        var wt = api.t('ast.wave') + ' ' + wave, ww = c.measureText(wt).width + 20;
        c.fillStyle = 'rgba(15,23,42,.6)'; rr(c, W - 10 - ww, 10, ww, 24, 12); c.fill();
        c.strokeStyle = 'rgba(196,181,253,.4)'; c.lineWidth = 1; c.stroke();
        c.textAlign = 'center'; c.fillStyle = '#e0e7ff'; c.fillText(wt, W - 10 - ww / 2, 22.5);
        var py = 44;
        [['triple', '#38bdf8', 10], ['rapid', '#facc15', 10], ['shield', '#4ade80', 12]].forEach(function (z) {
          if (power[z[0]] > 0) {
            var lbl = api.t('ast.' + z[0]) + ' ' + Math.ceil(power[z[0]]);
            c.font = '800 12px system-ui, sans-serif'; var lw = Math.max(70, c.measureText(lbl).width + 16);
            c.fillStyle = 'rgba(15,23,42,.6)'; rr(c, W - 10 - lw, py - 2, lw, 20, 6); c.fill();
            c.fillStyle = hexA(z[1], 0.35); rr(c, W - 10 - lw, py - 2, lw * Math.min(1, power[z[0]] / z[2]), 20, 6); c.fill();
            c.textAlign = 'right'; c.fillStyle = z[1]; c.fillText(lbl, W - 18, py + 8.5);
            py += 24;
          }
        });
        if (msgT > 0) {
          c.textAlign = 'center'; var ma = Math.min(1, msgT), msc = 1 + Math.max(0, msgT - 1.3) * 0.8;
          c.save(); c.translate(W / 2, H * 0.3); c.scale(msc, msc); c.globalAlpha = ma;
          c.font = '900 30px system-ui, sans-serif';
          c.lineWidth = 6; c.strokeStyle = 'rgba(30,27,75,.8)'; c.lineJoin = 'round'; c.strokeText(msg, 0, 0);
          var mg = c.createLinearGradient(0, -16, 0, 16); mg.addColorStop(0, '#f5f3ff'); mg.addColorStop(1, '#a78bfa');
          c.fillStyle = mg; c.fillText(msg, 0, 0);
          c.restore();
        }
        c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.lineWidth = 1; c.lineJoin = 'miter';
      }
    };

    function hexA(h, a) {
      var v = parseInt(h.slice(1), 16);
      return 'rgba(' + (v >> 16 & 255) + ',' + (v >> 8 & 255) + ',' + (v & 255) + ',' + a + ')';
    }
    function rr(c, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2); c.beginPath();
      c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
      c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
    }
    function srand(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
    function dprQ() { return Math.min(2, window.devicePixelRatio || 1); }
    // мягкий светящийся спрайт
    function glow(col) {
      if (glowC[col]) return glowC[col];
      var cv = document.createElement('canvas'); cv.width = cv.height = 64;
      var g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, hexA(col, 0.75)); gr.addColorStop(0.35, hexA(col, 0.25)); gr.addColorStop(1, hexA(col, 0));
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      glowC[col] = cv; return cv;
    }
    // фон: космос, туманности, дальние звёзды, планета
    function buildBg() {
      var W = api.W, H = api.H, dpr = dprQ(), R = srand(4242), i;
      bgW = W; bgH = H;
      bgC = bgC || document.createElement('canvas');
      bgC.width = Math.max(1, Math.ceil(W * dpr)); bgC.height = Math.max(1, Math.ceil(H * dpr));
      var g = bgC.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      var gr = g.createRadialGradient(W * 0.3, H * 0.2, 10, W / 2, H / 2, Math.max(W, H));
      gr.addColorStop(0, '#1e1b4b'); gr.addColorStop(0.6, '#0b1026'); gr.addColorStop(1, '#02040c');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      // туманности
      var neb = [['#7c3aed', 0.2, 0.25, 0.55, 0.22], ['#db2777', 0.35, 0.32, 0.3, 0.14], ['#0ea5e9', 0.8, 0.7, 0.5, 0.16], ['#2563eb', 0.65, 0.85, 0.35, 0.14], ['#a855f7', 0.9, 0.15, 0.3, 0.1]];
      for (i = 0; i < neb.length; i++) {
        var n = neb[i];
        for (var k = 0; k < 6; k++) {
          var nx = (n[1] + (R() - 0.5) * 0.3) * W, ny = (n[2] + (R() - 0.5) * 0.25) * H, nr = n[3] * Math.max(W, H) * (0.4 + R() * 0.5);
          var ng = g.createRadialGradient(nx, ny, 0, nx, ny, nr);
          ng.addColorStop(0, hexA(n[0], n[4] * (0.5 + R() * 0.5))); ng.addColorStop(1, hexA(n[0], 0));
          g.fillStyle = ng; g.fillRect(nx - nr, ny - nr, nr * 2, nr * 2);
        }
      }
      // пылевые прожилки
      for (i = 0; i < 5; i++) {
        var dx = R() * W, dy = R() * H, dr = Math.max(W, H) * (0.15 + R() * 0.2);
        var dg = g.createRadialGradient(dx, dy, 0, dx, dy, dr);
        dg.addColorStop(0, 'rgba(2,4,12,.45)'); dg.addColorStop(1, 'rgba(2,4,12,0)');
        g.save(); g.translate(dx, dy); g.scale(1.8, 0.5); g.rotate(0); g.translate(-dx, -dy);
        g.fillStyle = dg; g.fillRect(dx - dr, dy - dr, dr * 2, dr * 2); g.restore();
      }
      // дальние звёзды
      for (i = 0; i < 320; i++) {
        var sx = R() * W, sy = R() * H, ss = R() < 0.9 ? 0.6 + R() * 0.6 : 1.4;
        g.globalAlpha = 0.25 + R() * 0.55; g.fillStyle = R() < 0.15 ? '#bfdbfe' : R() < 0.1 ? '#fecaca' : '#ffffff';
        g.fillRect(sx, sy, ss, ss);
      }
      g.globalAlpha = 1;
      // далёкая планета с кольцом
      var px = W * 0.86, py = H * 0.58, pr = Math.min(W, H) * 0.09;
      g.save(); g.globalAlpha = 0.42;
      g.strokeStyle = 'rgba(253,230,138,.35)'; g.lineWidth = 3;
      g.beginPath(); g.ellipse(px, py, pr * 1.9, pr * 0.45, -0.35, Math.PI, 6.283); g.stroke();
      var pg = g.createRadialGradient(px - pr * 0.4, py - pr * 0.4, pr * 0.1, px, py, pr);
      pg.addColorStop(0, '#fcd34d'); pg.addColorStop(0.5, '#c2410c'); pg.addColorStop(1, '#2a0a05');
      g.fillStyle = pg; g.beginPath(); g.arc(px, py, pr, 0, 6.283); g.fill();
      g.save(); g.beginPath(); g.arc(px, py, pr, 0, 6.283); g.clip();
      g.fillStyle = 'rgba(120,40,10,.35)';
      for (i = -2; i <= 2; i++) g.fillRect(px - pr, py + i * pr * 0.33 - 2, pr * 2, 3);
      g.restore();
      g.beginPath(); g.ellipse(px, py, pr * 1.9, pr * 0.45, -0.35, 0, Math.PI); g.stroke();
      g.restore();
      // виньетка
      var vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
    }
    // текстура камня (кратеры, трещины), кэш по размеру/типу/варианту
    function rockTex(size, hard, v) {
      var key = size + '_' + hard + '_' + v;
      if (texC[key]) return texC[key];
      var r = SIZES[size], dpr = dprQ(), S = Math.ceil(r * 2.4), cv = document.createElement('canvas');
      cv.width = cv.height = Math.ceil(S * dpr);
      var g = cv.getContext('2d'); g.scale(dpr, dpr); g.translate(S / 2, S / 2);
      var R = srand(1000 + size * 97 + v * 31 + (hard ? 500 : 0)), i;
      g.fillStyle = hard ? '#7c2d12' : '#8a837d'; g.fillRect(-S / 2, -S / 2, S, S);
      // пятна породы
      for (i = 0; i < 14; i++) {
        g.fillStyle = hard ? (R() < 0.5 ? 'rgba(154,52,18,.4)' : 'rgba(41,15,5,.25)') : (R() < 0.5 ? 'rgba(180,174,168,.22)' : 'rgba(41,37,36,.16)');
        g.beginPath(); g.ellipse((R() - 0.5) * r * 2, (R() - 0.5) * r * 2, r * (0.15 + R() * 0.3), r * (0.08 + R() * 0.15), R() * 3, 0, 6.283); g.fill();
      }
      for (i = 0; i < 40 + size * 30; i++) {
        g.fillStyle = R() < 0.5 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.18)';
        g.fillRect((R() - 0.5) * r * 2.2, (R() - 0.5) * r * 2.2, 1, 1);
      }
      // кратеры
      var nc = 2 + size * 2;
      for (i = 0; i < nc; i++) {
        var ca = R() * 6.283, cd = R() * r * 0.65, cx = Math.cos(ca) * cd, cy = Math.sin(ca) * cd, cr = r * (0.1 + R() * 0.18);
        g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(cx, cy, cr, 0, 6.283); g.fill();
        g.fillStyle = hard ? 'rgba(251,146,60,.25)' : 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(cx + cr * 0.25, cy + cr * 0.25, cr * 0.75, 0.2, 2.9); g.lineTo(cx, cy); g.fill();
        g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, cr, 3.6, 5.8); g.stroke();
      }
      // трещины
      g.strokeStyle = hard ? 'rgba(253,186,116,.8)' : 'rgba(28,25,23,.45)'; g.lineWidth = hard ? 1.6 : 1;
      for (i = 0; i < (hard ? 4 : 2); i++) {
        var x0 = (R() - 0.5) * r, y0 = (R() - 0.5) * r; g.beginPath(); g.moveTo(x0, y0);
        for (var sgm = 0; sgm < 3; sgm++) { x0 += (R() - 0.5) * r * 0.6; y0 += (R() - 0.5) * r * 0.6; g.lineTo(x0, y0); }
        g.stroke();
      }
      texC[key] = { cv: cv, S: S };
      return texC[key];
    }
    function lightGrad(c, r) {
      var key = 'L' + r;
      if (gCache[key]) return gCache[key];
      var g = c.createRadialGradient(-r * 0.45, -r * 0.5, r * 0.05, 0, 0, r * 1.15);
      g.addColorStop(0, 'rgba(255,255,255,.4)'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(0.8, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,.65)');
      gCache[key] = g; return g;
    }
    function drawRock(c, r, Q) {
      c.save(); c.translate(r.x, r.y);
      // тень-ореол
      c.rotate(r.a);
      c.beginPath();
      for (var k = 0; k < r.pts.length; k++) {
        var a = k / r.pts.length * 6.283, rr2 = r.r * r.pts[k];
        if (k) c.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); else c.moveTo(Math.cos(a) * rr2, Math.sin(a) * rr2);
      }
      c.closePath();
      var hard = r.hp > 1;
      if (Q > 0) {
        if (r.tv === undefined) r.tv = Math.floor(Math.random() * 3);
        var tx = rockTex(r.size, hard, r.tv);
        c.save(); c.clip();
        c.drawImage(tx.cv, -tx.S / 2, -tx.S / 2, tx.S, tx.S);
        c.rotate(-r.a);
        c.fillStyle = lightGrad(c, r.r); c.fillRect(-r.r * 1.3, -r.r * 1.3, r.r * 2.6, r.r * 2.6);
        if (r.hit > 0) { c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(-r.r * 1.3, -r.r * 1.3, r.r * 2.6, r.r * 2.6); }
        c.restore();
      } else {
        c.fillStyle = r.hit > 0 ? '#fff' : hard ? '#9a3412' : '#78716c'; c.fill();
      }
      c.strokeStyle = hard ? 'rgba(251,146,60,.9)' : 'rgba(231,229,228,.35)'; c.lineWidth = 1.5; c.lineJoin = 'round'; c.stroke();
      c.lineJoin = 'miter';
      c.restore();
    }
    function shipBody(c, detail) {
      // крылья
      var wg = detail ? c.createLinearGradient(0, -14, 0, 14) : null;
      if (wg) { wg.addColorStop(0, '#1d4ed8'); wg.addColorStop(0.5, '#60a5fa'); wg.addColorStop(1, '#1d4ed8'); }
      c.fillStyle = wg || '#3b82f6';
      c.beginPath(); c.moveTo(3, -3); c.lineTo(-7, -13); c.lineTo(-12, -12); c.lineTo(-8, -3); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(3, 3); c.lineTo(-7, 13); c.lineTo(-12, 12); c.lineTo(-8, 3); c.closePath(); c.fill();
      // корпус
      var hg = detail ? c.createLinearGradient(0, -6, 0, 6) : null;
      if (hg) { hg.addColorStop(0, '#ffffff'); hg.addColorStop(0.5, '#cbd5e1'); hg.addColorStop(1, '#64748b'); }
      c.fillStyle = hg || '#e2e8f0';
      c.beginPath(); c.moveTo(17, 0); c.quadraticCurveTo(8, -5, -2, -5.5); c.lineTo(-10, -4.5); c.lineTo(-10, 4.5); c.lineTo(-2, 5.5); c.quadraticCurveTo(8, 5, 17, 0); c.closePath(); c.fill();
      if (!detail) return;
      c.strokeStyle = 'rgba(30,41,59,.6)'; c.lineWidth = 0.8; c.stroke();
      // панели
      c.beginPath(); c.moveTo(-4, -5); c.lineTo(-4, 5); c.moveTo(-8, -4.5); c.lineTo(-8, 4.5); c.stroke();
      c.strokeStyle = 'rgba(30,58,138,.7)'; c.beginPath(); c.moveTo(1, -4); c.lineTo(-6, -11); c.moveTo(1, 4); c.lineTo(-6, 11); c.stroke();
      // сопла
      c.fillStyle = '#334155'; c.fillRect(-12.5, -4, 3, 3); c.fillRect(-12.5, 1, 3, 3);
      c.fillStyle = '#f97316'; c.fillRect(-12.5, -3.4, 1, 1.8); c.fillRect(-12.5, 1.6, 1, 1.8);
      // кабина
      var cg = c.createLinearGradient(2, -3, 8, 3);
      cg.addColorStop(0, '#a5f3fc'); cg.addColorStop(0.5, '#0ea5e9'); cg.addColorStop(1, '#0c4a6e');
      c.fillStyle = cg; c.beginPath(); c.ellipse(5, 0, 5, 2.6, 0, 0, 6.283); c.fill();
      c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.ellipse(6, -1, 2, 0.8, 0, 0, 6.283); c.fill();
      // навигационные огни
      var bl = Math.floor(t * 3) % 2;
      c.fillStyle = bl ? '#f87171' : '#7f1d1d'; c.beginPath(); c.arc(-10, -12.3, 1.3, 0, 6.283); c.fill();
      c.fillStyle = bl ? '#4ade80' : '#14532d'; c.beginPath(); c.arc(-10, 12.3, 1.3, 0, 6.283); c.fill();
    }
    function drawShip(c, Q) {
      c.save(); c.translate(ship.x, ship.y); c.rotate(ship.a);
      if (ship.thrust) {
        var fl = 14 + Math.random() * 9;
        if (Q > 0) { c.globalCompositeOperation = 'lighter'; c.drawImage(glow('#fb923c'), -12 - fl, -12, fl + 6, 24); }
        c.fillStyle = 'rgba(249,115,22,.85)';
        c.beginPath(); c.moveTo(-11, -4.5); c.quadraticCurveTo(-11 - fl * 0.6, -4, -11 - fl, 0); c.quadraticCurveTo(-11 - fl * 0.6, 4, -11, 4.5); c.fill();
        c.fillStyle = '#fde047';
        c.beginPath(); c.moveTo(-11, -2.8); c.quadraticCurveTo(-11 - fl * 0.4, -2.4, -11 - fl * 0.65, 0); c.quadraticCurveTo(-11 - fl * 0.4, 2.4, -11, 2.8); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.ellipse(-12, 0, fl * 0.18, 1.4, 0, 0, 6.283); c.fill();
        c.globalCompositeOperation = 'source-over';
      }
      shipBody(c, true);
      if (power.shield > 0) {
        var weak = power.shield < 2 && Math.floor(t * 8) % 2;
        var sg = c.createRadialGradient(0, 0, 10, 0, 0, 21);
        sg.addColorStop(0, 'rgba(74,222,128,0)'); sg.addColorStop(0.8, weak ? 'rgba(74,222,128,.08)' : 'rgba(74,222,128,.22)'); sg.addColorStop(1, weak ? 'rgba(74,222,128,.15)' : 'rgba(134,239,172,.5)');
        c.fillStyle = sg; c.beginPath(); c.arc(0, 0, 21, 0, 6.283); c.fill();
        c.strokeStyle = weak ? 'rgba(74,222,128,.3)' : 'rgba(187,247,208,.9)'; c.lineWidth = 1.5;
        c.beginPath(); c.arc(0, 0, 21, t * 3, t * 3 + 2); c.stroke();
        c.beginPath(); c.arc(0, 0, 21, t * 3 + 3.14, t * 3 + 5.14); c.stroke();
      }
      c.restore();
    }
    function drawUfo(c, Q) {
      c.save(); c.translate(ufo.x, ufo.y);
      if (Q > 0) c.drawImage(glow('#4ade80'), -30, -22, 60, 50);
      // луч снизу
      var bg = c.createLinearGradient(0, 4, 0, 26); bg.addColorStop(0, 'rgba(134,239,172,.35)'); bg.addColorStop(1, 'rgba(134,239,172,0)');
      c.fillStyle = bg; c.beginPath(); c.moveTo(-6, 5); c.lineTo(6, 5); c.lineTo(13, 26); c.lineTo(-13, 26); c.closePath(); c.fill();
      // купол
      var dg = c.createRadialGradient(-3, -9, 1, 0, -4, 9);
      dg.addColorStop(0, '#f0fdf4'); dg.addColorStop(0.4, '#86efac'); dg.addColorStop(1, '#166534');
      c.fillStyle = dg; c.beginPath(); c.ellipse(0, -3, 8.5, 8, 0, Math.PI, 0); c.fill();
      // пилот
      c.fillStyle = 'rgba(20,83,45,.8)'; c.beginPath(); c.arc(0, -5, 3, 0, 6.283); c.fill();
      c.fillStyle = '#000'; c.beginPath(); c.ellipse(-1.2, -5.3, 0.9, 1.3, 0.3, 0, 6.283); c.ellipse(1.2, -5.3, 0.9, 1.3, -0.3, 0, 6.283); c.fill();
      // тарелка
      var sg = c.createLinearGradient(0, -3, 0, 8);
      sg.addColorStop(0, '#e2e8f0'); sg.addColorStop(0.45, '#94a3b8'); sg.addColorStop(1, '#334155');
      c.fillStyle = sg; c.beginPath(); c.ellipse(0, 2, 19, 6.5, 0, 0, 6.283); c.fill();
      c.strokeStyle = '#f1f5f9'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 1.5, 18, 5.5, 0, Math.PI + 0.3, 6.283 - 0.3); c.stroke();
      c.fillStyle = '#1e293b'; c.beginPath(); c.ellipse(0, 4.5, 9, 2.5, 0, 0, 6.283); c.fill();
      for (var li = -2; li <= 2; li++) {
        var on = Math.floor(t * 8 + li) % 3 === 0;
        c.fillStyle = on ? '#fde047' : '#f472b6'; c.beginPath(); c.arc(li * 7, 2.5 + Math.abs(li) * -0.4, 1.8, 0, 6.283); c.fill();
      }
      c.restore();
    }
  }
};
