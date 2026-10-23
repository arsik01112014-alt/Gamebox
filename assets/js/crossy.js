/* Переход: цыплёнок перебегает дороги, реки и железные дороги */
window.GAMES = window.GAMES || {};
window.GAMES.crossy = {
  title: 'Переход',
  desc: 'Перебеги дорогу и реку',
  hint: 'Тап — прыжок вперёд, свайп влево/вправо/вниз — шаг в сторону. Уворачивайся от машин и поездов, по реке прыгай по брёвнам и кувшинкам. Собирай монеты и не стой на месте — орёл не ждёт!',
  d0: 'Медленные машины', d1: 'Обычная скорость', d2: 'Быстрые машины, больше поездов', d3: 'Безумное движение',
  colors: ['#16a34a', '#0ea5e9'],
  controls: 'dpad',
  isNew2: true,
  icon: '<svg viewBox="0 0 100 100"><path d="M24 4 H76 Q96 4 96 24 V34 H4 V24 Q4 4 24 4z" fill="#4cc157"/>' +
    '<rect x="62" y="6" width="22" height="7" fill="#3dc864"/><rect x="62" y="13" width="22" height="12" fill="#22a046"/><rect x="70" y="25" width="6" height="6" fill="#6b3f1d"/>' +
    '<rect x="4" y="34" width="92" height="30" fill="#3f4652"/><path d="M8 62h12M34 62h14M62 62h14M88 62h8" stroke="#f1f5f9" stroke-width="2.5"/>' +
    '<rect x="54" y="58" width="32" height="5" rx="2" fill="#000" opacity=".3"/><rect x="56" y="57" width="7" height="6" rx="1.5" fill="#111827"/><rect x="76" y="57" width="7" height="6" rx="1.5" fill="#111827"/>' +
    '<rect x="52" y="44" width="34" height="14" fill="#dc2626"/><rect x="52" y="39" width="34" height="6" fill="#f87171"/><rect x="59" y="33" width="20" height="6" fill="#fca5a5"/><rect x="60" y="46" width="8" height="5" fill="#93c5fd"/><rect x="70" y="46" width="8" height="5" fill="#93c5fd"/><rect x="83" y="49" width="3" height="3" fill="#fef08a"/>' +
    '<path d="M4 64 H96 V76 Q96 96 76 96 H24 Q4 96 4 76z" fill="#0ea5e9"/><rect x="4" y="64" width="92" height="4" fill="#0369a1"/><path d="M14 88q4 -3 8 0M44 92q4 -3 8 0M70 84q4 -3 8 0" stroke="#fff" stroke-opacity=".55" stroke-width="2" fill="none"/>' +
    '<rect x="8" y="70" width="40" height="16" rx="5" fill="#6b3d17"/><rect x="10" y="71" width="36" height="5" rx="2" fill="#8b5a2b"/><ellipse cx="13" cy="78" rx="4" ry="7.5" fill="#d9a066" stroke="#4a280d" stroke-width="1.2"/><ellipse cx="13" cy="78" rx="1.8" ry="3.5" fill="none" stroke="#a0703c"/>' +
    '<ellipse cx="32" cy="34" rx="10" ry="3.5" fill="#000" opacity=".25"/><rect x="25" y="34" width="3" height="4" fill="#ea580c"/><rect x="35" y="34" width="3" height="4" fill="#ea580c"/>' +
    '<rect x="22" y="12" width="20" height="7" fill="#fff"/><rect x="22" y="19" width="20" height="15" fill="#f1f5f9"/><rect x="22" y="31" width="20" height="3" fill="#cbd5e1"/><rect x="28" y="7" width="8" height="5" fill="#dc2626"/><rect x="29" y="4" width="3" height="4" fill="#ef4444"/>' +
    '<rect x="38" y="19" width="7" height="4" fill="#f97316"/><rect x="40" y="23" width="3" height="4" fill="#dc2626"/><rect x="34" y="15" width="3" height="3" fill="#111"/></svg>',

  create: function (api) {
    var DIFF = [{ sp: 0.7, train: 0.05, eagle: 9 }, { sp: 1, train: 0.1, eagle: 7 }, { sp: 1.3, train: 0.15, eagle: 6 }, { sp: 1.65, train: 0.2, eagle: 5 }];
    var COLS = 9;
    var tiles = null, tilesK = '';
    var D, cs, rows, lanes, hero, cam, best, coins, t, deadT, idleT, eagle, parts, dir, hopQ, lastLane, msg, msgT;

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function layout() { cs = Math.floor(api.W / COLS); rows = Math.ceil(api.H / cs) + 3; }
    // ряд с номером y (растёт вверх)
    function makeLane(y) {
      var L = { y: y, type: 'grass', items: [], trees: {}, coin: -1 };
      if (y < 3) { for (var x0 = 0; x0 < COLS; x0++) if (x0 === 0 || x0 === COLS - 1) L.trees[x0] = 1; return L; }
      var diffK = Math.min(1, y / 120), r = Math.random();
      var prev = lastLane;
      if (r < 0.32 - diffK * 0.08 || (prev && prev.type !== 'grass' && prev.run >= 4)) L.type = 'grass';
      else if (r < 0.66) L.type = 'road';
      else if (r < 0.88) L.type = 'river';
      else L.type = Math.random() < D.train * 3 ? 'rail' : 'road';
      L.run = prev && prev.type === L.type ? prev.run + 1 : 1;
      if (L.type === 'river' && prev && prev.type === 'river' && prev.run >= 3) L.type = 'grass';
      var dirS = Math.random() < 0.5 ? -1 : 1;
      if (L.type === 'grass') {
        var n = Math.floor(rnd(1, 4 + diffK * 2));
        for (var i = 0; i < n; i++) L.trees[Math.floor(Math.random() * COLS)] = 1 + Math.floor(Math.random() * 2);
        if (Math.random() < 0.35) { var cx = Math.floor(Math.random() * COLS); if (!L.trees[cx]) L.coin = cx; }
      } else if (L.type === 'road') {
        L.speed = rnd(1.2, 2.6 + diffK * 1.5) * D.sp * dirS;
        var truck = Math.random() < 0.3, len = truck ? 2.2 : 1.2, gap = rnd(3, 5.5 - diffK * 1.2);
        L.color = ['#ef4444', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6'][Math.floor(Math.random() * 6)];
        for (var p = rnd(0, gap); p < COLS + 3; p += len + gap) L.items.push({ x: p - 2, len: len, truck: truck });
        L.period = COLS + 3 + len;
      } else if (L.type === 'river') {
        L.speed = rnd(0.9, 1.8 + diffK) * D.sp * dirS;
        var lily = Math.random() < 0.3;
        if (lily) { L.speed = 0; for (var q = 0; q < COLS; q++) if (Math.random() < 0.45) L.items.push({ x: q, len: 1, lily: true }); if (L.items.length < 2) L.items.push({ x: 4, len: 1, lily: true }); }
        else {
          var ll = rnd(2, 3.4 - diffK), gg = rnd(1.4, 2.6);
          for (var z = rnd(0, 1); z < COLS + 3; z += ll + gg) L.items.push({ x: z - 2, len: ll });
          L.period = COLS + 3 + ll;
        }
      } else if (L.type === 'rail') {
        L.trainT = rnd(2, 6); L.warn = 0; L.train = null; L.speed = (Math.random() < 0.5 ? -1 : 1) * 22 * D.sp;
      }
      lastLane = L;
      return L;
    }
    function lane(y) {
      while (lanes.length && lanes[0].y < cam - 6) lanes.shift();
      while (!lanes.length || lanes[lanes.length - 1].y < y) lanes.push(makeLane(lanes.length ? lanes[lanes.length - 1].y + 1 : 0));
      for (var i = 0; i < lanes.length; i++) if (lanes[i].y === y) return lanes[i];
      return null;
    }
    function itemAt(L, x) {
      for (var i = 0; i < L.items.length; i++) {
        var it = L.items[i];
        if (x + 0.5 > it.x + 0.12 && x + 0.5 < it.x + it.len - 0.12) return it;
      }
      return null;
    }
    function hop(dx, dy) {
      if (deadT > 0 || hero.jump > 0) { if (hopQ.length < 2) hopQ.push([dx, dy]); return; }
      var nx = Math.round(hero.x) + dx, ny = hero.y + dy;
      if (nx < 0 || nx >= COLS || ny < best - 4) return;
      var L = lane(ny);
      if (L.type === 'grass' && L.trees[nx]) { api.tone(160, 0.05, 'square', 0.03); hero.bump = 0.12; return; }
      hero.fx = hero.x; hero.fy = hero.y; hero.x = nx; hero.y = ny; hero.jump = 0.12; hero.ride = null; idleT = 0;
      dir = dx > 0 ? 1 : dx < 0 ? 3 : dy > 0 ? 0 : 2;
      api.tone(520 + Math.random() * 60, 0.05, 'triangle', 0.05);
      if (ny > best) {
        api.addScore(ny - best); best = ny;
        if (best % 25 === 0) { api.sound('bonus'); api.fx.text(api.W / 2, api.H * 0.3, best + '!', '#fde047', 26); }
      }
    }
    function die(kind) {
      if (deadT > 0) return;
      deadT = 1.3; hero.dead = kind;
      api.sound(kind === 'water' ? 'drop' : 'hit'); api.vibrate(200); api.fx.shake(kind === 'water' ? 4 : 9);
      var p = scr(hero.x, hero.y);
      for (var i = 0; i < 24; i++) parts.push({ x: p.x, y: p.y, vx: rnd(-160, 160), vy: rnd(-220, 40), life: rnd(0.5, 1), c: kind === 'water' ? '#bae6fd' : (Math.random() < 0.5 ? '#fff' : '#fde047') });
    }
    function scr(x, y) { return { x: x * cs + cs / 2, y: api.H - (y - cam) * cs - cs * 2.5 }; }

    return {
      reset: function () {
        D = DIFF[api.diff]; layout();
        lanes = []; lastLane = null; cam = 0; best = 0; coins = 0; t = 0; deadT = 0; idleT = 0; parts = []; dir = 2; hopQ = []; msg = ''; msgT = 0;
        hero = { x: 4, y: 1, fx: 4, fy: 1, jump: 0, ride: null, bump: 0, dead: null };
        eagle = null;
        lane(rows + 2);
        lane(1).trees = {};
      },
      resize: layout,
      idle: function (dt) { t += dt; },
      key: function (k, down) {
        if (!down) return;
        if (k === 'up' || k === 'a') hop(0, 1); else if (k === 'down') hop(0, -1); else if (k === 'left') hop(-1, 0); else if (k === 'right') hop(1, 0);
      },
      input: function (type, d) {
        if (type === 'tap') hop(0, 1);
        else if (type === 'swipe') hop(d.dir === 'left' ? -1 : d.dir === 'right' ? 1 : 0, d.dir === 'up' ? 1 : d.dir === 'down' ? -1 : 0);
      },
      update: function (dt) {
        t += dt;
        if (msgT > 0) msgT -= dt;
        for (var pi = parts.length - 1; pi >= 0; pi--) { var p = parts[pi]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.life -= dt; if (p.life <= 0) parts.splice(pi, 1); }
        // камера плавно следует за героем
        var target = Math.max(cam, hero.y - 3);
        cam += (target - cam) * Math.min(1, dt * 4);
        lane(Math.ceil(cam) + rows + 2);
        // движение машин, брёвен, поездов
        for (var i = 0; i < lanes.length; i++) {
          var L = lanes[i];
          if (L.type === 'road' || (L.type === 'river' && L.speed)) {
            L.items.forEach(function (it) {
              it.x += L.speed * dt;
              if (L.speed > 0 && it.x > COLS + 1) it.x -= L.period;
              if (L.speed < 0 && it.x + it.len < -1) it.x += L.period;
            });
          } else if (L.type === 'rail') {
            if (L.train) { L.train.x += L.speed * dt; if (L.train.x > COLS + 14 || L.train.x < -28) { L.train = null; L.trainT = rnd(3, 7) / (0.6 + D.train * 3); } }
            else {
              L.trainT -= dt;
              if (L.trainT < 1.2 && L.trainT > 0) { if (!L.warn) api.tone(1200, 0.08, 'square', 0.02); L.warn = 1; }
              if (L.trainT <= 0) { L.warn = 0; L.train = { x: L.speed > 0 ? -16 : COLS + 2, len: 14 }; if (Math.abs(L.y - hero.y) < 6) api.sound('break'); }
            }
          }
        }
        if (hero.jump > 0) { hero.jump -= dt; if (hero.jump <= 0 && hopQ.length) { var h = hopQ.shift(); hero.jump = 0; hop(h[0], h[1]); } }
        if (hero.bump > 0) hero.bump -= dt;
        if (deadT > 0) {
          deadT -= dt;
          if (eagle) { eagle.y -= 900 * dt; }
          if (deadT <= 0) api.gameOver();
          return;
        }
        // проверка клетки героя
        var HL = lane(hero.y);
        if (hero.jump <= 0) {
          if (HL.type === 'river') {
            var it = itemAt(HL, hero.x);
            if (!it) { die('water'); return; }
            if (!it.lily) { hero.x += HL.speed * dt; if (hero.x < -0.4 || hero.x > COLS - 0.6) { die('water'); return; } }
          } else if (hero.x !== Math.round(hero.x)) hero.x = Math.max(0, Math.min(COLS - 1, Math.round(hero.x)));
          if (HL.coin >= 0 && HL.coin === Math.round(hero.x)) {
            HL.coin = -1; coins++; api.addScore(5); api.sound('coin');
            var cp = scr(hero.x, hero.y); api.fx.text(cp.x, cp.y - 20, '+5', '#fde047', 16); api.fx.burst(cp.x, cp.y, '#fde047', 10, 120);
          }
        }
        if (HL.type === 'road') {
          for (var k = 0; k < HL.items.length; k++) { var car = HL.items[k]; if (hero.x + 0.5 > car.x + 0.1 && hero.x + 0.5 < car.x + car.len - 0.05) { die('car'); return; } }
        }
        if (HL.type === 'rail' && HL.train && hero.x + 0.5 > HL.train.x && hero.x + 0.5 < HL.train.x + HL.train.len) { die('car'); return; }
        // орёл: если долго стоишь или отстал от камеры
        idleT += dt;
        if ((idleT > D.eagle || hero.y < cam - 2.2) && !eagle) {
          eagle = { y: -80 }; api.sound('hit'); die('eagle');
        }
        if (idleT > D.eagle - 2.5 && Math.floor(t * 6) % 2 === 0 && !msgT) { msg = api.t('crossy.hurry'); msgT = 0.5; }
      },
      draw: function (c) {
        var W = api.W, H = api.H, Q = api.quality;
        if (!tiles || tilesK !== W + 'x' + cs) buildTiles();
        c.fillStyle = '#14532d'; c.fillRect(0, 0, W, H);
        var y0 = Math.floor(cam) - 3, y1 = Math.ceil(cam) + rows + 1;
        for (var y = y1; y >= y0; y--) {
          var L = lane(y), sy = H - (y - cam) * cs - cs * 3;
          if (sy > H || sy < -cs * 2) continue;
          if (!L) {
            if (y < 0) { c.drawImage(tiles['g' + (((y % 4) + 4) % 4)], 0, sy, W, cs + 1); c.fillStyle = 'rgba(5,46,22,' + Math.min(0.6, 0.2 - y * 0.12) + ')'; c.fillRect(0, sy, W, cs + 1); }
            continue;
          }
          var tl = L.type === 'grass' ? tiles['g' + (((y % 4) + 4) % 4)] : tiles[L.type];
          c.drawImage(tl, 0, sy, W, cs + 1);
          if (L.type === 'river') drawWater(c, L, y, sy, W, Q);
          else if (L.type === 'rail' && L.warn) {
            var on = Math.floor(t * 8) % 2;
            c.fillStyle = on ? 'rgba(239,68,68,.16)' : 'rgba(239,68,68,.05)'; c.fillRect(0, sy, W, cs);
          }
          // предметы
          if (L.type === 'grass') {
            for (var tx in L.trees) drawProp(c, +tx * cs, sy, L.trees[tx] === 2, (+tx * 7 + y * 13) % 5);
            if (L.coin >= 0) drawCoin(c, L.coin * cs + cs / 2, sy + cs / 2 + Math.sin(t * 4) * 3, Q);
          } else if (L.type === 'road') {
            for (var ci = 0; ci < L.items.length; ci++) drawCar(c, L.items[ci], L, sy, Q);
          } else if (L.type === 'river') {
            for (var li = 0; li < L.items.length; li++) {
              var it = L.items[li];
              if (it.lily) drawLily(c, it.x * cs + cs / 2, sy + cs / 2, li + y);
              else drawLog(c, it.x * cs, it.len * cs, sy, li + y);
            }
          } else if (L.type === 'rail') {
            drawSignal(c, W - cs * 0.42, sy, L.warn, Q);
            if (L.train) drawTrain(c, L, sy, Q);
          }
          if (y === hero.y) drawHero(c);
        }
        // частицы (перья / брызги)
        for (var pi = 0; pi < parts.length; pi++) {
          var p = parts[pi];
          c.globalAlpha = Math.max(0, Math.min(1, p.life)); c.fillStyle = p.c;
          c.save(); c.translate(p.x, p.y); c.rotate(p.vx * 0.01 + p.life * 4);
          c.beginPath(); c.ellipse(0, 0, 5, 2.4, 0, 0, 6.283); c.fill(); c.restore();
        }
        c.globalAlpha = 1;
        if (eagle) drawEagle(c);
        // HUD
        c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillStyle = 'rgba(0,0,0,.4)'; rr(c, 10, 10, 78, 30, 15); c.fill();
        c.strokeStyle = 'rgba(253,224,71,.45)'; c.lineWidth = 1.5; c.stroke();
        coinIcon(c, 26, 25, 9);
        c.font = '900 16px system-ui, sans-serif';
        c.fillStyle = 'rgba(0,0,0,.4)'; c.fillText(coins, 42, 27);
        c.fillStyle = '#fff'; c.fillText(coins, 41, 25.5);
        if (msgT > 0) {
          c.textAlign = 'center'; c.font = '900 20px system-ui, sans-serif'; c.lineJoin = 'round';
          c.lineWidth = 5; c.strokeStyle = 'rgba(127,29,29,.85)'; c.strokeText(msg, W / 2, 60);
          c.fillStyle = '#fecaca'; c.fillText(msg, W / 2, 60); c.lineJoin = 'miter';
        }
        c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.lineWidth = 1;
      }
    };
    function rr(c, x, y, w, h, r) {
      r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath();
      c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
      c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
    }
    function shade(h, f) {
      var v = parseInt(h.slice(1), 16), r = v >> 16 & 255, g = v >> 8 & 255, b = v & 255;
      if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
      return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
    }
    function srand(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
    // текстуры полос (ширина W, высота cs)
    function buildTiles() {
      var W = api.W, dpr = Math.min(2, window.devicePixelRatio || 1), R = srand(777), i, k;
      tiles = {}; tilesK = W + 'x' + cs;
      function mk() {
        var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(W * dpr)); cv.height = Math.max(1, Math.ceil((cs + 1) * dpr));
        var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); return { cv: cv, g: g };
      }
      // трава: 4 варианта
      for (k = 0; k < 4; k++) {
        var o = mk(), g = o.g, base = k % 2 ? '#5fd068' : '#4cc157';
        g.fillStyle = base; g.fillRect(0, 0, W, cs + 1);
        // клетчатый оттенок
        for (i = 0; i < COLS + 1; i++) if ((i + k) % 2) { g.fillStyle = 'rgba(255,255,255,.045)'; g.fillRect(i * cs, 0, cs, cs + 1); }
        for (i = 0; i < 60; i++) {
          var gx = R() * W, gy = 4 + R() * (cs - 8);
          g.fillStyle = R() < 0.5 ? 'rgba(21,128,61,.45)' : 'rgba(187,247,208,.4)';
          g.fillRect(gx, gy, 2, 3 + R() * 3); g.fillRect(gx + 3, gy + 1, 2, 2 + R() * 3);
        }
        for (i = 0; i < 3; i++) {
          var fx = R() * W, fy = 6 + R() * (cs - 12), fc = R() < 0.5 ? '#fff' : (R() < 0.5 ? '#fde047' : '#f9a8d4');
          g.fillStyle = fc; g.fillRect(fx - 2, fy, 2, 2); g.fillRect(fx + 2, fy, 2, 2); g.fillRect(fx, fy - 2, 2, 2); g.fillRect(fx, fy + 2, 2, 2);
          g.fillStyle = '#f59e0b'; g.fillRect(fx, fy, 2, 2);
        }
        g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, 0, W, 2);
        g.fillStyle = 'rgba(0,40,0,.14)'; g.fillRect(0, cs - 3, W, 4);
        // тень за краями поля
        var eg = g.createLinearGradient(0, 0, W, 0);
        eg.addColorStop(0, 'rgba(0,30,0,.22)'); eg.addColorStop(0.06, 'rgba(0,30,0,0)'); eg.addColorStop(0.94, 'rgba(0,30,0,0)'); eg.addColorStop(1, 'rgba(0,30,0,.22)');
        g.fillStyle = eg; g.fillRect(0, 0, W, cs + 1);
        tiles['g' + k] = o.cv;
      }
      // дорога
      var ro = mk(), q = ro.g;
      q.fillStyle = '#3f4652'; q.fillRect(0, 0, W, cs + 1);
      for (i = 0; i < 500; i++) { q.fillStyle = R() < 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.14)'; q.fillRect(R() * W, R() * cs, 1.5, 1.5); }
      q.strokeStyle = 'rgba(0,0,0,.25)'; q.lineWidth = 1;
      for (i = 0; i < 3; i++) { var cx0 = R() * W, cy0 = R() * cs; q.beginPath(); q.moveTo(cx0, cy0); q.lineTo(cx0 + 6, cy0 + 3); q.lineTo(cx0 + 9, cy0 - 1); q.lineTo(cx0 + 15, cy0 + 2); q.stroke(); }
      q.fillStyle = 'rgba(255,255,255,.07)'; q.fillRect(0, 0, W, 2);
      q.fillStyle = 'rgba(0,0,0,.2)'; q.fillRect(0, cs - 4, W, 4);
      for (var dx = 0; dx < W; dx += cs) {
        q.fillStyle = 'rgba(0,0,0,.25)'; q.fillRect(dx + cs * 0.3, cs - 2.5, cs * 0.4, 3);
        q.fillStyle = 'rgba(241,245,249,.75)'; q.fillRect(dx + cs * 0.3, cs - 3.5, cs * 0.4, 2.5);
      }
      tiles.road = ro.cv;
      // река
      var wo = mk(), w = wo.g, wg = w.createLinearGradient(0, 0, 0, cs);
      wg.addColorStop(0, '#0369a1'); wg.addColorStop(0.25, '#0ea5e9'); wg.addColorStop(1, '#0284c7');
      w.fillStyle = wg; w.fillRect(0, 0, W, cs + 1);
      for (i = 0; i < 40; i++) { w.fillStyle = 'rgba(255,255,255,' + (0.05 + R() * 0.1) + ')'; w.fillRect(R() * W, cs * 0.2 + R() * cs * 0.75, 4 + R() * 10, 1.5); }
      w.fillStyle = 'rgba(0,0,0,.18)'; w.fillRect(0, 0, W, 3);
      tiles.river = wo.cv;
      // рельсы
      var lo = mk(), r = lo.g;
      r.fillStyle = '#6b6158'; r.fillRect(0, 0, W, cs + 1);
      for (i = 0; i < 700; i++) { var gc = R(); r.fillStyle = gc < 0.33 ? '#8a7f74' : gc < 0.66 ? '#4a423b' : '#a39a90'; r.fillRect(R() * W, R() * cs, 2, 2); }
      for (var rx = 0; rx < W; rx += cs * 0.5) {
        r.fillStyle = 'rgba(0,0,0,.3)'; r.fillRect(rx + 2, cs * 0.17, cs * 0.2, cs * 0.7);
        r.fillStyle = '#6b3f1d'; r.fillRect(rx, cs * 0.14, cs * 0.2, cs * 0.7);
        r.fillStyle = '#8b5a2b'; r.fillRect(rx, cs * 0.14, cs * 0.2, cs * 0.12);
        r.fillStyle = 'rgba(0,0,0,.25)'; r.fillRect(rx + cs * 0.06, cs * 0.3, 1, cs * 0.45);
      }
      [0.27, 0.68].forEach(function (yy) {
        r.fillStyle = 'rgba(0,0,0,.35)'; r.fillRect(0, cs * yy + 3, W, 3);
        r.fillStyle = '#64748b'; r.fillRect(0, cs * yy, W, 4);
        r.fillStyle = '#e2e8f0'; r.fillRect(0, cs * yy, W, 1.5);
      });
      r.fillStyle = 'rgba(0,0,0,.2)'; r.fillRect(0, cs - 3, W, 3);
      tiles.rail = lo.cv;
    }
    function drawWater(c, L, y, sy, W, Q) {
      var dirS = L.speed >= 0 ? 1 : -1, sp = L.speed ? 30 : 10;
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.lineCap = 'round';
      c.beginPath();
      for (var wx = -cs; wx < W + cs; wx += cs) {
        var off = ((t * sp * dirS + y * 17) % cs + cs) % cs, yy = sy + cs * (0.35 + ((wx / cs + y) % 2) * 0.3);
        c.moveTo(wx + off, yy); c.quadraticCurveTo(wx + off + cs * 0.15, yy - cs * 0.08, wx + off + cs * 0.3, yy);
      }
      c.stroke(); c.lineCap = 'butt';
      if (Q > 0) {
        c.fillStyle = 'rgba(255,255,255,.5)';
        for (var s = 0; s < 4; s++) {
          var ph = (t * 1.3 + s * 0.27 + y * 0.13) % 1, sx = ((s * 97 + y * 53) % W);
          c.globalAlpha = Math.sin(ph * Math.PI) * 0.8; c.fillRect(sx, sy + cs * (0.25 + (s % 3) * 0.22), 3, 1.5);
        }
        c.globalAlpha = 1;
      }
    }
    // дерево (big) или валун
    function drawProp(c, X, sy, big, v) {
      c.fillStyle = 'rgba(0,40,0,.25)'; rr(c, X + cs * 0.14, sy + cs * 0.62, cs * 0.8, cs * 0.3, 5); c.fill();
      if (big) {
        // ствол
        c.fillStyle = '#6b3f1d'; c.fillRect(X + cs * 0.4, sy + cs * 0.42, cs * 0.2, cs * 0.4);
        c.fillStyle = '#8b5a2b'; c.fillRect(X + cs * 0.4, sy + cs * 0.42, cs * 0.07, cs * 0.4);
        // крона (нижний ярус)
        var tall = v % 2 ? 0.15 : 0;
        cube(c, X + cs * 0.1, sy - cs * (0.2 + tall), cs * 0.8, cs * 0.28, cs * 0.42, '#22a046', '#3dc864', '#167a33');
        cube(c, X + cs * 0.22, sy - cs * (0.48 + tall), cs * 0.56, cs * 0.22, cs * 0.3, '#2fb554', '#5ad97c', '#1b8a3b');
        c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(X + cs * 0.16, sy - cs * (0.18 + tall), cs * 0.12, cs * 0.12); c.fillRect(X + cs * 0.6, sy - cs * (0.12 + tall) + cs * 0.24, cs * 0.1, cs * 0.1);
        c.fillStyle = 'rgba(0,60,20,.25)'; c.fillRect(X + cs * 0.45, sy - cs * (0.05 + tall) + cs * 0.12, cs * 0.12, cs * 0.12);
        if (v === 3) { c.fillStyle = '#ef4444'; c.fillRect(X + cs * 0.3, sy + cs * 0.12, cs * 0.08, cs * 0.08); c.fillRect(X + cs * 0.62, sy, cs * 0.08, cs * 0.08); }
      } else {
        cube(c, X + cs * 0.14, sy + cs * 0.12, cs * 0.72, cs * 0.26, cs * 0.4, '#a8a29e', '#d6d3d1', '#78716c');
        c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(X + cs * 0.3, sy + cs * 0.48, cs * 0.18, cs * 0.06);
        if (v % 2) { c.fillStyle = '#65a30d'; c.fillRect(X + cs * 0.18, sy + cs * 0.12, cs * 0.3, cs * 0.08); c.fillRect(X + cs * 0.24, sy + cs * 0.2, cs * 0.12, cs * 0.06); }
        c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(X + cs * 0.56, sy + cs * 0.16, cs * 0.14, cs * 0.05);
      }
    }
    // воксельный блок: верх (top), передняя грань (front), кромки
    function cube(c, x, y, w, topH, frontH, front, top, edge) {
      c.fillStyle = front; c.fillRect(x, y + topH, w, frontH);
      c.fillStyle = top; c.fillRect(x, y, w, topH);
      c.fillStyle = edge; c.fillRect(x, y + topH + frontH - 3, w, 3); c.fillRect(x + w - 3, y + topH, 3, frontH);
      c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(x, y, w, 2);
    }
    function drawCoin(c, x, y, Q) {
      var wsc = Math.max(0.15, Math.abs(Math.cos(t * 3)));
      c.fillStyle = 'rgba(0,40,0,.25)'; c.beginPath(); c.ellipse(x, y + cs * 0.3, cs * 0.18, cs * 0.06, 0, 0, 6.283); c.fill();
      c.save(); c.translate(x, y); c.scale(wsc, 1);
      coinIcon(c, 0, 0, cs * 0.22);
      c.restore();
    }
    function coinIcon(c, x, y, r) {
      c.fillStyle = '#a16207'; c.beginPath(); c.arc(x, y + r * 0.12, r, 0, 6.283); c.fill();
      var g = c.createLinearGradient(x, y - r, x, y + r); g.addColorStop(0, '#fef08a'); g.addColorStop(0.5, '#facc15'); g.addColorStop(1, '#ca8a04');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
      c.strokeStyle = '#ca8a04'; c.lineWidth = Math.max(1, r * 0.14); c.beginPath(); c.arc(x, y, r * 0.7, 0, 6.283); c.stroke();
      c.fillStyle = '#fff7c2'; c.beginPath();
      for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * 0.2 : r * 0.45; c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); }
      c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(x - r * 0.4, y - r * 0.45, r * 0.25, r * 0.12, -0.6, 0, 6.283); c.fill();
    }
    function drawCar(c, it, L, sy, Q) {
      var x = it.x * cs, w = it.len * cs, R2 = L.speed > 0, col = L.color;
      // фары: световой конус
      if (Q > 0) {
        var fx = R2 ? x + w : x, d = R2 ? 1 : -1;
        c.fillStyle = 'rgba(254,240,138,.13)'; c.beginPath();
        c.moveTo(fx, sy + cs * 0.45); c.lineTo(fx + d * cs * 0.9, sy + cs * 0.25); c.lineTo(fx + d * cs * 0.9, sy + cs * 0.9); c.lineTo(fx, sy + cs * 0.72); c.fill();
      }
      c.fillStyle = 'rgba(0,0,0,.3)'; rr(c, x + 3, sy + cs * 0.55, w, cs * 0.38, 6); c.fill();
      // колёса
      c.fillStyle = '#111827';
      rr(c, x + cs * 0.12, sy + cs * 0.68, cs * 0.28, cs * 0.22, 3); c.fill();
      rr(c, x + w - cs * 0.4, sy + cs * 0.68, cs * 0.28, cs * 0.22, 3); c.fill();
      c.fillStyle = '#9ca3af'; c.fillRect(x + cs * 0.21, sy + cs * 0.74, cs * 0.1, cs * 0.08); c.fillRect(x + w - cs * 0.31, sy + cs * 0.74, cs * 0.1, cs * 0.08);
      if (it.truck) {
        var cabW = cs * 0.62, cabX = R2 ? x + w - cabW : x, boxX = R2 ? x : x + cabW, boxW = w - cabW - 2;
        if (!R2) boxX += 2;
        // кузов-фургон
        cube(c, boxX, sy - cs * 0.12, boxW, cs * 0.3, cs * 0.6, '#d1d5db', '#f3f4f6', '#9ca3af');
        c.fillStyle = 'rgba(0,0,0,.08)'; for (var rb = boxX + cs * 0.2; rb < boxX + boxW - 4; rb += cs * 0.22) c.fillRect(rb, sy + cs * 0.2, 2, cs * 0.44);
        c.fillStyle = col; c.fillRect(boxX, sy + cs * 0.38, boxW, cs * 0.08);
        // кабина
        cube(c, cabX, sy + cs * 0.08, cabW, cs * 0.18, cs * 0.52, shade(col, -0.1), shade(col, 0.25), shade(col, -0.45));
        var wx = R2 ? cabX + cabW * 0.45 : cabX + cabW * 0.1;
        c.fillStyle = '#bfdbfe'; c.fillRect(wx, sy + cs * 0.3, cabW * 0.45, cs * 0.2);
        c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(wx + 2, sy + cs * 0.31, cabW * 0.12, cs * 0.17);
      } else {
        cube(c, x, sy + cs * 0.12, w, cs * 0.22, cs * 0.46, col, shade(col, 0.25), shade(col, -0.4));
        // кабина с окнами
        var cx = x + w * 0.22, cw = w * 0.56;
        c.fillStyle = shade(col, -0.15); c.fillRect(cx, sy - cs * 0.02, cw, cs * 0.14);
        c.fillStyle = shade(col, 0.4); c.fillRect(cx + 2, sy - cs * 0.1, cw - 4, cs * 0.1);
        c.fillStyle = '#1e3a5f'; c.fillRect(cx + 3, sy + cs * 0.36, cw - 6, cs * 0.16);
        c.fillStyle = '#93c5fd'; c.fillRect(cx + 4, sy + cs * 0.37, cw * 0.4, cs * 0.14); c.fillRect(cx + cw * 0.52, sy + cs * 0.37, cw * 0.4, cs * 0.14);
        c.fillStyle = 'rgba(255,255,255,.65)'; c.fillRect(cx + 6, sy + cs * 0.38, 3, cs * 0.12); c.fillRect(cx + cw * 0.55, sy + cs * 0.38, 3, cs * 0.12);
        c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x + w * 0.5 - 1, sy + cs * 0.56, 2, cs * 0.14);
      }
      // фары и стоп-сигналы
      var fX = R2 ? x + w - 4 : x, bX = R2 ? x : x + w - 3;
      c.fillStyle = '#fef08a'; c.fillRect(fX, sy + cs * 0.5, 4, cs * 0.1); c.fillRect(fX, sy + cs * 0.64, 4, cs * 0.06);
      c.fillStyle = '#ef4444'; c.fillRect(bX, sy + cs * 0.5, 3, cs * 0.12);
    }
    function drawLog(c, x, w, sy, v) {
      var top = sy + cs * 0.2, h = cs * 0.6, bob = Math.sin(t * 2 + v) * 1.2;
      top += bob;
      // пена
      c.fillStyle = 'rgba(255,255,255,.4)';
      c.beginPath(); c.ellipse(x + 2, top + h * 0.85, 6, 3, 0, 0, 6.283); c.ellipse(x + w - 2, top + h * 0.85, 6, 3, 0, 0, 6.283); c.fill();
      c.fillStyle = 'rgba(2,60,100,.35)'; rr(c, x + 2, top + h * 0.6, w, h * 0.5, h * 0.25); c.fill();
      c.fillStyle = '#6b3d17'; rr(c, x, top, w, h, h * 0.3); c.fill();
      c.fillStyle = '#8b5a2b'; rr(c, x + 2, top + 1, w - 4, h * 0.35, h * 0.15); c.fill();
      c.fillStyle = '#4a280d'; c.fillRect(x + h * 0.3, top + h * 0.82, w - h * 0.6, h * 0.12);
      // кора
      c.strokeStyle = 'rgba(40,20,5,.55)'; c.lineWidth = 1.2; c.beginPath();
      for (var b = 0; b < 3; b++) {
        var by = top + h * (0.35 + b * 0.18), sx = x + h * 0.5 + ((v * 13 + b * 29) % 12);
        c.moveTo(sx, by); c.lineTo(sx + w * 0.25, by + 1); c.moveTo(sx + w * 0.35, by - 1); c.lineTo(Math.min(x + w - 6, sx + w * 0.62), by);
      }
      c.stroke();
      // сучок
      var kx = x + w * (0.3 + (v % 3) * 0.2);
      c.fillStyle = '#4a280d'; c.beginPath(); c.ellipse(kx, top + h * 0.55, 3.5, 2.5, 0, 0, 6.283); c.fill();
      c.fillStyle = '#a0703c'; c.beginPath(); c.ellipse(kx, top + h * 0.53, 1.6, 1.1, 0, 0, 6.283); c.fill();
      // торец с кольцами
      c.fillStyle = '#d9a066'; c.beginPath(); c.ellipse(x + h * 0.22, top + h * 0.5, h * 0.22, h * 0.48, 0, 0, 6.283); c.fill();
      c.strokeStyle = '#a0703c'; c.lineWidth = 1;
      c.beginPath(); c.ellipse(x + h * 0.22, top + h * 0.5, h * 0.14, h * 0.32, 0, 0, 6.283); c.stroke();
      c.beginPath(); c.ellipse(x + h * 0.22, top + h * 0.5, h * 0.06, h * 0.15, 0, 0, 6.283); c.stroke();
      c.strokeStyle = '#4a280d'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(x + h * 0.22, top + h * 0.5, h * 0.22, h * 0.48, 0, 0, 6.283); c.stroke();
    }
    function drawLily(c, x, y, v) {
      var bob = Math.sin(t * 2 + v) * 0.08, r = cs * 0.38;
      c.fillStyle = 'rgba(2,60,100,.35)'; c.beginPath(); c.ellipse(x + 2, y + 4, r, r * 0.8, 0, 0, 6.283); c.fill();
      c.fillStyle = '#15803d'; c.beginPath(); c.arc(x, y + 2, r, 0.3 + bob, 6 + bob); c.lineTo(x, y + 2); c.fill();
      c.fillStyle = '#22c55e'; c.beginPath(); c.arc(x, y, r, 0.3 + bob, 6 + bob); c.lineTo(x, y); c.fill();
      c.strokeStyle = 'rgba(21,128,61,.8)'; c.lineWidth = 1; c.beginPath();
      for (var k = 0; k < 6; k++) { var a = 0.9 + k * 0.9 + bob; c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85); }
      c.stroke();
      c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(x - r * 0.35, y - r * 0.4, r * 0.3, r * 0.12, -0.5, 0, 6.283); c.fill();
      if (v % 3 === 0) {
        c.fillStyle = '#f9a8d4'; for (var p = 0; p < 5; p++) { var pa = p * 1.2566; c.beginPath(); c.ellipse(x - r * 0.25 + Math.cos(pa) * 3, y + r * 0.2 + Math.sin(pa) * 3, 3, 2, pa, 0, 6.283); c.fill(); }
        c.fillStyle = '#fde047'; c.beginPath(); c.arc(x - r * 0.25, y + r * 0.2, 2, 0, 6.283); c.fill();
      }
    }
    function drawSignal(c, x, sy, warn, Q) {
      c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x + 3, sy + cs * 0.75, cs * 0.3, cs * 0.12);
      c.fillStyle = '#e5e7eb'; c.fillRect(x - 2, sy - cs * 0.15, 4, cs * 0.95);
      c.fillStyle = '#9ca3af'; c.fillRect(x, sy - cs * 0.15, 2, cs * 0.95);
      c.fillStyle = '#1f2937'; rr(c, x - cs * 0.24, sy - cs * 0.28, cs * 0.48, cs * 0.24, 4); c.fill();
      var on = Math.floor(t * 8) % 2;
      for (var k = 0; k < 2; k++) {
        var lx = x - cs * 0.12 + k * cs * 0.24, ly = sy - cs * 0.16, lit = warn && (k ? on : !on);
        if (lit && Q > 0) { c.fillStyle = 'rgba(239,68,68,.3)'; c.beginPath(); c.arc(lx, ly, cs * 0.2, 0, 6.283); c.fill(); }
        c.fillStyle = lit ? '#f87171' : '#4b1113'; c.beginPath(); c.arc(lx, ly, cs * 0.075, 0, 6.283); c.fill();
      }
      // крест-знак
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath();
      c.moveTo(x - cs * 0.18, sy + cs * 0.05); c.lineTo(x + cs * 0.18, sy + cs * 0.25); c.moveTo(x + cs * 0.18, sy + cs * 0.05); c.lineTo(x - cs * 0.18, sy + cs * 0.25); c.stroke();
      c.strokeStyle = '#dc2626'; c.lineWidth = 1; c.stroke();
    }
    function drawTrain(c, L, sy, Q) {
      var tx0 = L.train.x * cs, tw = L.train.len * cs, R2 = L.speed > 0, carL = cs * 3.4, gap = cs * 0.12;
      c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(tx0 + 4, sy + cs * 0.55, tw, cs * 0.4);
      var n = Math.ceil(tw / (carL + gap));
      for (var i = 0; i < n; i++) {
        var cx = R2 ? tx0 + tw - (i + 1) * (carL + gap) + gap : tx0 + i * (carL + gap);
        var cw = carL, loco = i === 0;
        if (cx < tx0) { cw -= tx0 - cx; cx = tx0; }
        if (cx + cw > tx0 + tw) cw = tx0 + tw - cx;
        if (cw <= 2) continue;
        // колёса
        c.fillStyle = '#111827';
        for (var wh = cx + cs * 0.35; wh < cx + cw - cs * 0.2; wh += cs * 0.75) { c.beginPath(); c.arc(wh, sy + cs * 0.8, cs * 0.12, 0, 6.283); c.fill(); }
        var body = loco ? '#dc2626' : '#1d4ed8';
        cube(c, cx, sy - cs * 0.2, cw, cs * 0.26, cs * 0.66, body, loco ? '#f87171' : '#60a5fa', loco ? '#7f1d1d' : '#1e3a8a');
        c.fillStyle = '#facc15'; c.fillRect(cx, sy + cs * 0.5, cw, cs * 0.06);
        if (loco) {
          var nose = R2 ? cx + cw - cs * 0.5 : cx;
          c.fillStyle = '#1f2937'; c.fillRect(nose, sy + cs * 0.1, cs * 0.5, cs * 0.3);
          c.fillStyle = '#bfdbfe'; c.fillRect(nose + cs * 0.08, sy + cs * 0.13, cs * 0.34, cs * 0.18);
          var hl = R2 ? cx + cw - 4 : cx;
          c.fillStyle = '#fef9c3'; c.fillRect(hl, sy + cs * 0.3, 4, cs * 0.12);
          if (Q > 0) {
            var d = R2 ? 1 : -1; c.fillStyle = 'rgba(254,249,195,.15)'; c.beginPath();
            c.moveTo(hl + (R2 ? 4 : 0), sy + cs * 0.3); c.lineTo(hl + d * cs * 1.6, sy); c.lineTo(hl + d * cs * 1.6, sy + cs * 0.9); c.lineTo(hl + (R2 ? 4 : 0), sy + cs * 0.42); c.fill();
          }
          c.fillStyle = '#374151'; c.fillRect(R2 ? cx + cs * 0.5 : cx + cw - cs * 0.8, sy - cs * 0.38, cs * 0.3, cs * 0.2);
        } else {
          c.fillStyle = '#bfdbfe';
          for (var wx = cx + cs * 0.25; wx < cx + cw - cs * 0.5; wx += cs * 0.7) {
            c.fillRect(wx, sy + cs * 0.14, cs * 0.45, cs * 0.24);
            c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(wx + 2, sy + cs * 0.15, 3, cs * 0.2); c.fillStyle = '#bfdbfe';
          }
        }
      }
    }
    function drawEagle(c) {
      var ep = scr(hero.x, hero.y), x = ep.x, y = eagle.y + ep.y, flap = Math.sin(t * 25) * cs * 0.25;
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x, ep.y + cs * 0.4, cs * 1.1, cs * 0.25, 0, 0, 6.283); c.fill();
      c.fillStyle = '#57391f';
      c.beginPath(); c.moveTo(x, y + cs * 0.2); c.lineTo(x - cs * 1.3, y - flap); c.lineTo(x - cs * 1.1, y + cs * 0.15 - flap * 0.5); c.lineTo(x - cs * 0.9, y + cs * 0.1 - flap * 0.3); c.lineTo(x - cs * 0.7, y + cs * 0.35); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(x, y + cs * 0.2); c.lineTo(x + cs * 1.3, y - flap); c.lineTo(x + cs * 1.1, y + cs * 0.15 - flap * 0.5); c.lineTo(x + cs * 0.9, y + cs * 0.1 - flap * 0.3); c.lineTo(x + cs * 0.7, y + cs * 0.35); c.closePath(); c.fill();
      c.fillStyle = '#3f2a14'; rr(c, x - cs * 0.22, y - cs * 0.05, cs * 0.44, cs * 0.75, 6); c.fill();
      c.beginPath(); c.moveTo(x - cs * 0.22, y + cs * 0.6); c.lineTo(x, y + cs * 0.95); c.lineTo(x + cs * 0.22, y + cs * 0.6); c.fill();
      c.fillStyle = '#f8fafc'; rr(c, x - cs * 0.18, y - cs * 0.3, cs * 0.36, cs * 0.32, 5); c.fill();
      c.fillStyle = '#f59e0b'; c.beginPath(); c.moveTo(x - cs * 0.07, y - cs * 0.02); c.lineTo(x + cs * 0.07, y - cs * 0.02); c.lineTo(x, y + cs * 0.12); c.fill();
      c.fillStyle = '#111'; c.fillRect(x - cs * 0.12, y - cs * 0.2, 3, 3); c.fillRect(x + cs * 0.12 - 3, y - cs * 0.2, 3, 3);
    }
    function drawHero(c) {
      var k = hero.jump > 0 ? hero.jump / 0.12 : 0;
      var hx = hero.x + (hero.fx - hero.x) * k, hy = hero.y + (hero.fy - hero.y) * k;
      var p = scr(hx, hy), jk = Math.sin(k * Math.PI), lift = jk * cs * 0.35;
      var s = cs * 0.62;
      if (hero.dead === 'car') {
        c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(p.x - s * 0.65, p.y + s * 0.25, s * 1.3, s * 0.3);
        c.fillStyle = '#fff'; c.fillRect(p.x - s * 0.6, p.y + s * 0.15, s * 1.2, s * 0.3);
        c.fillStyle = '#e5e7eb'; c.fillRect(p.x - s * 0.6, p.y + s * 0.35, s * 1.2, s * 0.1);
        c.fillStyle = '#ef4444'; c.fillRect(p.x - s * 0.1, p.y + s * 0.1, s * 0.2, s * 0.08);
        c.fillStyle = '#f97316'; c.fillRect(p.x + s * 0.55, p.y + s * 0.22, s * 0.18, s * 0.1); c.fillRect(p.x - s * 0.8, p.y + s * 0.3, s * 0.2, s * 0.06);
        return;
      }
      if (hero.dead === 'water') return;
      if (hero.dead === 'eagle') return;
      var bx = hero.bump > 0 ? Math.sin(hero.bump * 80) * 2 : 0;
      // тень уменьшается в прыжке
      var shS = 1 - jk * 0.35;
      c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(p.x, p.y + s * 0.45, s * 0.5 * shS, s * 0.16 * shS, 0, 0, 6.283); c.fill();
      // squash / stretch
      var sxk = 1 - jk * 0.08, syk = 1 + jk * 0.14;
      c.save(); c.translate(p.x + bx, p.y + s * 0.42 - lift); c.scale(sxk, syk); c.translate(0, -s * 0.42);
      var x = -s / 2, y = -s / 2 - s * 0.1, fx = dir === 1 ? 1 : dir === 3 ? -1 : 0;
      // лапки
      c.fillStyle = '#ea580c';
      c.fillRect(x + s * 0.18, y + s, s * 0.12, s * 0.14 - jk * s * 0.05); c.fillRect(x + s * 0.7, y + s, s * 0.12, s * 0.14 - jk * s * 0.05);
      c.fillStyle = '#f97316'; c.fillRect(x + s * 0.12, y + s * 1.1, s * 0.24, s * 0.06); c.fillRect(x + s * 0.64, y + s * 1.1, s * 0.24, s * 0.06);
      // хвост
      if (fx !== 0) { c.fillStyle = '#e5e7eb'; c.fillRect(fx > 0 ? x - s * 0.14 : x + s, y + s * 0.18, s * 0.14, s * 0.3); c.fillStyle = '#fff'; c.fillRect(fx > 0 ? x - s * 0.1 : x + s, y + s * 0.1, s * 0.1, s * 0.16); }
      else if (dir === 0) { c.fillStyle = '#f1f5f9'; c.fillRect(x + s * 0.3, y + s * 0.62, s * 0.4, s * 0.2); }
      // тело: верх + передняя грань
      c.fillStyle = '#ffffff'; c.fillRect(x, y, s, s * 0.32);
      c.fillStyle = '#f1f5f9'; c.fillRect(x, y + s * 0.32, s, s * 0.68);
      c.fillStyle = '#cbd5e1'; c.fillRect(x, y + s * 0.88, s, s * 0.12); c.fillRect(x + s * 0.9, y + s * 0.32, s * 0.1, s * 0.68);
      // крылья
      c.fillStyle = '#e2e8f0'; c.fillRect(x - s * 0.08, y + s * 0.45, s * 0.12, s * 0.32); c.fillRect(x + s * 0.96, y + s * 0.45, s * 0.12, s * 0.32);
      c.fillStyle = '#cbd5e1'; c.fillRect(x - s * 0.08, y + s * 0.68, s * 0.12, s * 0.09); c.fillRect(x + s * 0.96, y + s * 0.68, s * 0.12, s * 0.09);
      // гребешок
      c.fillStyle = '#dc2626'; c.fillRect(x + s * 0.32, y - s * 0.16, s * 0.36, s * 0.18);
      c.fillStyle = '#ef4444'; c.fillRect(x + s * 0.36, y - s * 0.26, s * 0.13, s * 0.14); c.fillRect(x + s * 0.52, y - s * 0.22, s * 0.13, s * 0.1);
      if (dir !== 0) {
        // клюв и бородка
        var bkx = -s * 0.12 + fx * s * 0.5;
        c.fillStyle = '#f97316'; c.fillRect(bkx, y + s * 0.38, s * 0.24, s * 0.16);
        c.fillStyle = '#c2410c'; c.fillRect(bkx, y + s * 0.49, s * 0.24, s * 0.05);
        c.fillStyle = '#dc2626'; c.fillRect(bkx + s * 0.06, y + s * 0.54, s * 0.12, s * 0.14);
        // глаза
        c.fillStyle = '#111';
        c.fillRect(-s * 0.3 + fx * s * 0.2, y + s * 0.2, s * 0.13, s * 0.13); c.fillRect(s * 0.17 + fx * s * 0.2, y + s * 0.2, s * 0.13, s * 0.13);
        c.fillStyle = '#fff';
        c.fillRect(-s * 0.3 + fx * s * 0.2, y + s * 0.2, s * 0.05, s * 0.05); c.fillRect(s * 0.17 + fx * s * 0.2, y + s * 0.2, s * 0.05, s * 0.05);
      }
      c.restore();
    }
  }
};
