/* Змейка */
window.GAMES = window.GAMES || {};
window.GAMES.snake = {
  title: 'Змейка',
  desc: 'Собирай яблоки и расти',
  hint: 'Свайпай по полю или жми стрелки. Ешь яблоки 🍎, лови золотые звёзды ⭐ за бонус. Не врезайся в стены и в себя!',
  colors: ['#22c55e', '#0d9488'],
  controls: 'dpad',
  liveSwipe: true,
  swipeDist: 16,
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="snakeB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86efac"/><stop offset="1" stop-color="#16a34a"/></linearGradient><radialGradient id="snakeH" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#bbf7d0"/><stop offset="1" stop-color="#22c55e"/></radialGradient><radialGradient id="snakeA" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fecaca"/><stop offset="1" stop-color="#b91c1c"/></radialGradient></defs><circle cx="50" cy="50" r="46" fill="#14532d" opacity=".35"/>' +
    '<path d="M18 70 C18 50 42 52 42 38 C42 24 64 22 70 34" fill="none" stroke="#14532d" stroke-width="15" stroke-linecap="round"/>' +
    '<path d="M18 70 C18 50 42 52 42 38 C42 24 64 22 70 34" fill="none" stroke="url(#snakeB)" stroke-width="11" stroke-linecap="round"/>' +
    '<circle cx="72" cy="36" r="11.5" fill="#14532d"/><circle cx="72" cy="36" r="10" fill="url(#snakeH)"/><circle cx="75" cy="33" r="3.2" fill="#fff"/><circle cx="76" cy="33" r="1.6" fill="#111"/>' +
    '<path d="M81 40 l7 3 -7 1" fill="#ef4444"/>' +
    '<circle cx="76" cy="72" r="9" fill="url(#snakeA)"/><ellipse cx="73" cy="68" rx="2.5" ry="1.6" fill="#fff" opacity=".7"/><path d="M76 63 q3 -6 8 -6" stroke="#166534" stroke-width="3" fill="none"/></svg>',

  create: function (api) {
    var COLS = 17;
    var D, rocks, field, cell, rows, ox, oy, snake, prev, dir, queue, food, bonus, eaten, timer, interval, alive, deadT, parts, t, shake;
    // v2.0: комбо и бонусы (🐢 замедление, ✂ укорачивание, 👻 призрак — сквозь себя)
    var combo, lastEat, pw, pwT, slowT, ghostT;
    var PW = { slow: { c: '#38bdf8', s: '🐢' }, cut: { c: '#f472b6', s: '✂' }, ghost: { c: '#c4b5fd', s: '👻' } };

    function layout() {
      cell = Math.floor(Math.min(api.W / COLS, api.H / 12));
      rows = Math.max(10, Math.floor(api.H / cell));
      ox = Math.floor((api.W - COLS * cell) / 2);
      oy = Math.floor((api.H - rows * cell) / 2);
    }

    function free(x, y) {
      for (var i = 0; i < snake.length; i++) if (snake[i].x === x && snake[i].y === y) return false;
      if (food && food.x === x && food.y === y) return false;
      if (bonus && bonus.x === x && bonus.y === y) return false;
      if (pw && pw.x === x && pw.y === y) return false;
      if (isRock(x, y)) return false;
      return true;
    }
    function spot() {
      for (var n = 0; n < 500; n++) {
        var x = Math.floor(Math.random() * COLS), y = Math.floor(Math.random() * rows);
        if (free(x, y)) return { x: x, y: y };
      }
      return { x: 0, y: 0 };
    }

    var DIFF = [
      { wrap: true, base: 0.17, min: 0.08, acc: 0.0018, rocks: 0, grow: 0 },
      { wrap: false, base: 0.15, min: 0.055, acc: 0.0025, rocks: 0, grow: 0 },
      { wrap: false, base: 0.12, min: 0.045, acc: 0.0028, rocks: 6, grow: 0 },
      { wrap: false, base: 0.095, min: 0.038, acc: 0.003, rocks: 11, grow: 5 }
    ];
    function isRock(x, y) {
      for (var i = 0; i < rocks.length; i++) if (rocks[i].x === x && rocks[i].y === y) return true;
      return false;
    }
    function addRock() {
      var h = snake[0];
      for (var n = 0; n < 300; n++) {
        var p = spot();
        // не ставим камни прямо перед головой и в стартовом ряду
        if (Math.abs(p.y - h.y) <= 1 && (p.x - h.x) * dir.x >= 0 && Math.abs(p.x - h.x) < 6) continue;
        if (Math.abs(p.x - h.x) + Math.abs(p.y - h.y) < 4) continue;
        rocks.push({ x: p.x, y: p.y, v: Math.random() }); return;
      }
    }
    // статичный фон поля с травой и цветами рисуется один раз
    function buildField() {
      field = document.createElement('canvas');
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      field.width = Math.ceil(COLS * cell * dpr); field.height = Math.ceil(rows * cell * dpr);
      var c = field.getContext('2d'); c.scale(dpr, dpr);
      var seed = 7;
      function R() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      for (var y = 0; y < rows; y++) for (var x = 0; x < COLS; x++) {
        c.fillStyle = (x + y) % 2 ? '#1a8a42' : '#22a04d';
        c.fillRect(x * cell, y * cell, cell, cell);
        c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(x * cell, y * cell, cell, 1.5);
        c.fillStyle = 'rgba(0,0,0,.07)'; c.fillRect(x * cell, (y + 1) * cell - 2, cell, 2);
        // травинки
        var n = 2 + Math.floor(R() * 3);
        for (var k = 0; k < n; k++) {
          var gx = x * cell + R() * cell, gy = y * cell + R() * cell, gh = cell * (0.12 + R() * 0.15);
          c.strokeStyle = R() < 0.5 ? 'rgba(187,247,208,.35)' : 'rgba(20,83,45,.45)'; c.lineWidth = 1.2;
          c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + (R() - 0.5) * gh, gy - gh); c.stroke();
        }
        // цветочки
        if (R() < 0.07) {
          var fx = x * cell + cell * (0.25 + R() * 0.5), fy = y * cell + cell * (0.25 + R() * 0.5), fr = cell * 0.07;
          var col = ['#fef08a', '#fbcfe8', '#ffffff', '#c4b5fd'][Math.floor(R() * 4)];
          c.fillStyle = col;
          for (var pt = 0; pt < 5; pt++) { var a = pt * 1.2566; c.beginPath(); c.arc(fx + Math.cos(a) * fr * 1.3, fy + Math.sin(a) * fr * 1.3, fr, 0, 6.283); c.fill(); }
          c.fillStyle = '#f59e0b'; c.beginPath(); c.arc(fx, fy, fr * 0.8, 0, 6.283); c.fill();
        }
      }
      // солнечные пятна и тени от облаков
      for (var sp = 0; sp < 6; sp++) {
        var spx = R() * COLS * cell, spy = R() * rows * cell, spr = cell * (2 + R() * 3);
        var sg = c.createRadialGradient(spx, spy, 0, spx, spy, spr);
        sg.addColorStop(0, sp % 2 ? 'rgba(254,249,195,.12)' : 'rgba(5,46,22,.14)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = sg; c.fillRect(spx - spr, spy - spr, spr * 2, spr * 2);
      }
      // внутренняя тень от рамки
      var isg = c.createLinearGradient(0, 0, 0, cell * 0.8);
      isg.addColorStop(0, 'rgba(0,0,0,.35)'); isg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = isg; c.fillRect(0, 0, COLS * cell, cell * 0.8);
      // виньетка
      var vg = c.createRadialGradient(COLS * cell / 2, rows * cell / 2, cell * 3, COLS * cell / 2, rows * cell / 2, Math.max(COLS, rows) * cell * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)');
      c.fillStyle = vg; c.fillRect(0, 0, COLS * cell, rows * cell);
    }
    // фон вокруг поля: тёмный лес + деревянная рамка
    var backOff = null;
    function buildBack() {
      var W = api.W, H = api.H, dpr = Math.min(window.devicePixelRatio || 1, 2);
      backOff = document.createElement('canvas');
      backOff.width = Math.ceil(W * dpr); backOff.height = Math.ceil(H * dpr);
      var c = backOff.getContext('2d'); c.scale(dpr, dpr);
      var g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0b3b1f'); g.addColorStop(1, '#03200f');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      var seed = 11;
      function R() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      for (var i = 0; i < 90; i++) { // листья
        var lx = R() * W, ly = R() * H, lr = 6 + R() * 10;
        c.fillStyle = R() < 0.5 ? 'rgba(34,197,94,.10)' : 'rgba(0,0,0,.18)';
        c.beginPath(); c.ellipse(lx, ly, lr, lr * 0.45, R() * 3.14, 0, 6.283); c.fill();
      }
      var fw = COLS * cell, fh = rows * cell;
      if (!D.wrap) {
        var b = Math.max(5, Math.min(ox, oy, 9));
        c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(ox - b + 3, oy - b + 5, fw + b * 2, fh + b * 2);
        var wg = c.createLinearGradient(0, oy - b, 0, oy + fh + b);
        wg.addColorStop(0, '#92582a'); wg.addColorStop(0.5, '#7a4520'); wg.addColorStop(1, '#5b3215');
        c.fillStyle = wg; c.fillRect(ox - b, oy - b, fw + b * 2, fh + b * 2);
        c.strokeStyle = 'rgba(40,20,5,.35)'; c.lineWidth = 0.8; // волокна
        for (var k = 0; k < 40; k++) {
          var yy = oy - b + R() * (fh + b * 2), xx = ox - b + R() * (fw + b * 2);
          c.beginPath(); c.moveTo(ox - b, yy); c.lineTo(ox - b + b * 0.9, yy + 2); c.stroke();
          c.beginPath(); c.moveTo(ox + fw, yy); c.lineTo(ox + fw + b, yy - 2); c.stroke();
          c.beginPath(); c.moveTo(xx, oy - b + 1 + (k % 3) * b * 0.3); c.lineTo(xx + 20, oy - b + 1 + (k % 3) * b * 0.3); c.stroke();
          c.beginPath(); c.moveTo(xx, oy + fh + 1 + (k % 3) * b * 0.3); c.lineTo(xx + 20, oy + fh + 1 + (k % 3) * b * 0.3); c.stroke();
        }
        c.strokeStyle = 'rgba(253,230,138,.35)'; c.lineWidth = 1; c.strokeRect(ox - b + 0.5, oy - b + 0.5, fw + b * 2 - 1, fh + b * 2 - 1);
        c.strokeStyle = 'rgba(30,15,5,.7)'; c.lineWidth = 1.5; c.strokeRect(ox - 0.75, oy - 0.75, fw + 1.5, fh + 1.5);
        // заклёпки в углах
        [[ox - b / 2, oy - b / 2], [ox + fw + b / 2, oy - b / 2], [ox - b / 2, oy + fh + b / 2], [ox + fw + b / 2, oy + fh + b / 2]].forEach(function (p) {
          var rg = c.createRadialGradient(p[0] - 1, p[1] - 1, 0.5, p[0], p[1], b * 0.4);
          rg.addColorStop(0, '#fef3c7'); rg.addColorStop(1, '#a16207');
          c.fillStyle = rg; c.beginPath(); c.arc(p[0], p[1], b * 0.35, 0, 6.283); c.fill();
        });
      }
    }
    function drawRock(c, r) {
      var x = ox + (r.x + 0.5) * cell, y = oy + (r.y + 0.55) * cell, s = cell * (0.4 + r.v * 0.06);
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x + 2, y + s * 0.55, s * 1.05, s * 0.35, 0, 0, 6.283); c.fill();
      var g = c.createLinearGradient(x - s, y - s, x + s, y + s);
      g.addColorStop(0, '#d6d3d1'); g.addColorStop(0.5, '#a8a29e'); g.addColorStop(1, '#57534e');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(x - s, y + s * 0.4); c.lineTo(x - s * 0.8, y - s * 0.4); c.lineTo(x - s * 0.2, y - s * 0.85);
      c.lineTo(x + s * 0.6, y - s * 0.6); c.lineTo(x + s, y + s * 0.1); c.lineTo(x + s * 0.7, y + s * 0.6); c.lineTo(x - s * 0.6, y + s * 0.65);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(41,37,36,.6)'; c.lineWidth = 1.2; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.4)';
      c.beginPath(); c.moveTo(x - s * 0.6, y - s * 0.3); c.lineTo(x - s * 0.15, y - s * 0.65); c.stroke();
      c.fillStyle = 'rgba(132,204,22,.7)'; c.beginPath(); c.arc(x + s * 0.35, y - s * 0.45, s * 0.18, 0, 6.283); c.fill();
    }

    function burst(x, y, color, n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = (Math.random() * 3 + 1.5) * cell;
        parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.3, max: 0.8, c: color });
      }
    }

    function step() {
      prev = snake.map(function (q) { return { x: q.x, y: q.y }; });
      if (queue.length) dir = queue.shift();
      var h = snake[0], nx = h.x + dir.x, ny = h.y + dir.y;
      if (D.wrap) { nx = (nx + COLS) % COLS; ny = (ny + rows) % rows; }
      var grow = food && food.x === nx && food.y === ny;
      var hitSelf = false;
      for (var i = 0; i < snake.length - (grow ? 0 : 1); i++) {
        if (snake[i].x === nx && snake[i].y === ny) { hitSelf = true; break; }
      }
      if (ghostT > 0) hitSelf = false;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= rows || hitSelf || isRock(nx, ny)) {
        alive = false; deadT = 1.0; shake = 0.35;
        api.sound('hit'); api.vibrate(200); api.fx.flash('#ef4444', 0.2);
        for (var j = 0; j < snake.length; j++) burst(ox + (snake[j].x + 0.5) * cell, oy + (snake[j].y + 0.5) * cell, '#4ade80', 2);
        return;
      }
      snake.unshift({ x: nx, y: ny });
      if (grow) {
        eaten++;
        combo = t - lastEat < 3.2 ? combo + 1 : 1; lastEat = t;
        var cb = Math.min(5, combo - 1);
        api.addScore(1 + cb); api.sound('eat'); api.vibrate(15);
        if (cb > 0) api.fx.text(ox + (nx + 0.5) * cell, oy + ny * cell - 6, 'x' + combo + ' +' + (1 + cb), combo >= 4 ? '#f472b6' : '#fde047', 15);
        if (eaten % 10 === 0) { api.fx.text(api.W / 2, api.H * 0.25, api.t('snake.lvl') + ' ' + (eaten / 10 + 1), '#bbf7d0', 26); api.sound('bonus'); }
        if (eaten % 7 === 0 && !pw) { var pk = ['slow', 'cut', 'ghost'][Math.floor(Math.random() * 3)]; if (pk === 'cut' && snake.length < 8) pk = 'slow'; pw = spot(); pw.k = pk; pw.life = 8; }
        burst(ox + (nx + 0.5) * cell, oy + (ny + 0.5) * cell, '#ef4444', 12);
        food = null; food = spot();
        interval = Math.max(D.min, D.base - eaten * D.acc);
        if (D.grow && eaten % D.grow === 0) addRock();
        if (eaten % 5 === 0 && !bonus) { bonus = spot(); bonus.life = 6; }
      } else {
        snake.pop();
      }
      if (pw && pw.x === nx && pw.y === ny) {
        var px = ox + (nx + 0.5) * cell, py = oy + (ny + 0.5) * cell;
        api.sound('bonus'); api.vibrate(30); burst(px, py, PW[pw.k].c, 16);
        api.fx.text(px, py - cell, api.t('snake.' + pw.k), PW[pw.k].c, 16);
        if (pw.k === 'slow') slowT = 6;
        else if (pw.k === 'ghost') ghostT = 6;
        else { for (var cu = 0; cu < 3 && snake.length > 4; cu++) { var tl = snake.pop(); burst(ox + (tl.x + 0.5) * cell, oy + (tl.y + 0.5) * cell, '#f472b6', 4); } api.addScore(3); }
        pw = null;
      }
      if (bonus && bonus.x === nx && bonus.y === ny) {
        api.addScore(5); api.sound('bonus'); api.vibrate(30);
        burst(ox + (nx + 0.5) * cell, oy + (ny + 0.5) * cell, '#facc15', 18);
        snake.push({ x: snake[snake.length - 1].x, y: snake[snake.length - 1].y });
        bonus = null;
      }
    }

    function turn(d) {
      var v = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }[d];
      if (!v) return;
      var last = queue.length ? queue[queue.length - 1] : dir;
      if (last.x === v.x && last.y === v.y) return;
      if (last.x === -v.x && last.y === -v.y) return;
      if (queue.length < 3) queue.push(v);
    }

    function updParts(dt) {
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; p.life -= dt;
        if (p.life <= 0) parts.splice(i, 1);
      }
    }

    function rr(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }

    function mix(a, b, k) {
      return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * k) + ',' + Math.round(a[1] + (b[1] - a[1]) * k) + ',' + Math.round(a[2] + (b[2] - a[2]) * k) + ')';
    }

    var self = {
      reset: function () {
        D = DIFF[api.diff]; rocks = [];
        layout(); buildField(); buildBack();
        var my = Math.floor(rows / 2);
        snake = [{ x: 6, y: my }, { x: 5, y: my }, { x: 4, y: my }, { x: 3, y: my }];
        prev = snake.slice();
        dir = { x: 1, y: 0 }; queue = [];
        food = null; bonus = null; food = spot();
        rocks = [];
        for (var r = 0; r < D.rocks; r++) addRock();
        eaten = 0; timer = 0; interval = D.base; alive = true; deadT = 0; parts = []; t = 0; shake = 0;
        combo = 0; lastEat = -10; pw = null; pwT = 0; slowT = 0; ghostT = 0;
      },
      resize: function () { layout(); buildField(); buildBack(); },
      idle: function (dt) { t += dt; updParts(dt); },
      update: function (dt) {
        t += dt; updParts(dt);
        if (shake > 0) shake -= dt;
        if (!alive) {
          deadT -= dt;
          if (deadT <= 0) api.gameOver();
          return;
        }
        if (bonus) { bonus.life -= dt; if (bonus.life <= 0) bonus = null; }
        if (pw) { pw.life -= dt; if (pw.life <= 0) pw = null; }
        if (slowT > 0) slowT -= dt;
        if (ghostT > 0) ghostT -= dt;
        timer += dt;
        var iv = slowT > 0 ? interval * 1.6 : interval;
        while (timer >= iv && alive) { timer -= iv; step(); }
      },
      key: function (k, down) { if (down) turn(k); },
      input: function (type, d) {
        if (type === 'swipe') turn(d.dir);
        else if (type === 'tap') {
          // тап по полю: поворот в сторону касания относительно головы
          var last = queue.length ? queue[queue.length - 1] : dir, h = snake[0];
          var hx = ox + (h.x + 0.5) * cell, hy = oy + (h.y + 0.5) * cell;
          if (last.x !== 0) turn(d.y < hy ? 'up' : 'down');
          else turn(d.x < hx ? 'left' : 'right');
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        if (!backOff) buildBack();
        c.drawImage(backOff, 0, 0, W, H);
        c.save();
        if (shake > 0) c.translate((Math.random() - 0.5) * 10 * shake, (Math.random() - 0.5) * 10 * shake);
        // поле
        c.drawImage(field, ox, oy, COLS * cell, rows * cell);
        if (D.wrap) { // проходимые стены — пунктир
          c.setLineDash([6, 6]); c.lineDashOffset = -t * 20;
          c.strokeStyle = 'rgba(187,247,208,.55)'; c.lineWidth = 2;
          c.strokeRect(ox - 1, oy - 1, COLS * cell + 2, rows * cell + 2);
          c.setLineDash([]);
        }
        rocks.forEach(function (r) { drawRock(c, r); });

        // яблоко
        if (food) {
          var fx = ox + (food.x + 0.5) * cell, fy = oy + (food.y + 0.55) * cell, pr = cell * (0.36 + Math.sin(t * 6) * 0.03);
          c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(fx, fy + pr * 0.9, pr * 0.9, pr * 0.3, 0, 0, 6.283); c.fill();
          var g = c.createRadialGradient(fx - pr * 0.3, fy - pr * 0.3, pr * 0.1, fx, fy, pr);
          g.addColorStop(0, '#fca5a5'); g.addColorStop(0.4, '#ef4444'); g.addColorStop(1, '#991b1b');
          c.fillStyle = g; c.beginPath(); c.arc(fx, fy, pr, 0, 6.283); c.fill();
          c.strokeStyle = '#78350f'; c.lineWidth = Math.max(1.5, cell * 0.07);
          c.beginPath(); c.moveTo(fx, fy - pr * 0.8); c.lineTo(fx + pr * 0.1, fy - pr * 1.3); c.stroke();
          c.fillStyle = '#22c55e'; c.beginPath(); c.ellipse(fx + pr * 0.45, fy - pr * 1.15, pr * 0.4, pr * 0.2, -0.5, 0, 6.283); c.fill();
        }
        // бонус-звезда
        if (bonus) {
          var bx = ox + (bonus.x + 0.5) * cell, by = oy + (bonus.y + 0.5) * cell, br = cell * 0.48;
          if (bonus.life > 1.5 || Math.floor(t * 8) % 2) {
            c.save(); c.translate(bx, by); c.rotate(t * 2);
            c.shadowColor = '#fde047'; c.shadowBlur = 14;
            c.fillStyle = '#facc15'; c.beginPath();
            for (var i = 0; i < 10; i++) {
              var rad = i % 2 ? br * 0.45 : br, a = i * Math.PI / 5 - Math.PI / 2;
              c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
            }
            c.closePath(); c.fill(); c.restore();
          }
          c.strokeStyle = 'rgba(250,204,21,.8)'; c.lineWidth = 2;
          c.beginPath(); c.arc(bx, by, cell * 0.62, -Math.PI / 2, -Math.PI / 2 + 6.283 * (bonus.life / 6)); c.stroke();
        }

        // бонус-предмет
        if (pw && (pw.life > 2 || Math.floor(t * 8) % 2)) {
          var wx = ox + (pw.x + 0.5) * cell, wy = oy + (pw.y + 0.5) * cell + Math.sin(t * 5) * 2;
          c.save(); c.shadowColor = PW[pw.k].c; c.shadowBlur = 14;
          c.fillStyle = 'rgba(15,23,42,.7)'; c.strokeStyle = PW[pw.k].c; c.lineWidth = 2;
          c.beginPath(); c.arc(wx, wy, cell * 0.46, 0, 6.283); c.fill(); c.stroke(); c.restore();
          c.font = Math.round(cell * 0.55) + 'px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(PW[pw.k].s, wx, wy + 1);
          c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        }
        if (ghostT > 0) c.globalAlpha = 0.55 + 0.2 * Math.sin(t * 10);
        // змейка — плавное движение между клетками
        var n = snake.length, s = cell * 0.8, kk = alive ? Math.min(1, timer / (slowT > 0 ? interval * 1.6 : interval)) : 1;
        function ctr(q) { return [ox + (q.x + 0.5) * cell, oy + (q.y + 0.5) * cell]; }
        var pts = [];
        for (var i = 0; i < n; i++) {
          var pv = prev[i] && Math.abs(prev[i].x - snake[i].x) + Math.abs(prev[i].y - snake[i].y) <= 1 ? prev[i] : snake[i];
          var a = ctr(pv), b = ctr(snake[i]);
          pts.push([a[0] + (b[0] - a[0]) * kk, a[1] + (b[1] - a[1]) * kk]);
        }
        var A = [190, 255, 140], B = [21, 128, 61];
        c.lineCap = 'round'; c.lineJoin = 'round';
        // тень
        c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = s;
        c.beginPath(); c.moveTo(pts[n - 1][0] + 3, pts[n - 1][1] + 4);
        function adj(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1; }
        for (var j = n - 1; j >= 1; j--) {
          var jc = ctr(snake[j]); c.lineTo(jc[0] + 3, jc[1] + 4);
          if (adj(snake[j], snake[j - 1])) c.lineTo(pts[j - 1][0] + 3, pts[j - 1][1] + 4); else c.moveTo(pts[j - 1][0] + 3, pts[j - 1][1] + 4);
        }
        c.stroke();
        // тёмный контур тела
        c.strokeStyle = !alive && Math.floor(t * 10) % 2 ? '#7f1d1d' : '#0f4a24';
        for (var o2 = n - 1; o2 >= 1; o2--) {
          var oc = ctr(snake[o2]);
          c.lineWidth = s * (1 - o2 / n * 0.35) + 3;
          c.beginPath(); c.moveTo(pts[o2][0], pts[o2][1]); c.lineTo(oc[0], oc[1]);
          if (adj(snake[o2], snake[o2 - 1])) c.lineTo(pts[o2 - 1][0], pts[o2 - 1][1]);
          c.stroke();
        }
        c.fillStyle = c.strokeStyle; c.beginPath(); c.arc(pts[0][0], pts[0][1], s * 0.56 + 1.5, 0, 6.283); c.fill();
        for (var k = n - 1; k >= 1; k--) {
          var col = mix(A, B, k / (n - 1));
          if (!alive && Math.floor(t * 10) % 2) col = '#fca5a5';
          var mid = ctr(snake[k]);
          c.strokeStyle = col; c.lineWidth = s * (1 - k / n * 0.35);
          c.beginPath(); c.moveTo(pts[k][0], pts[k][1]); c.lineTo(mid[0], mid[1]);
          if (adj(snake[k], snake[k - 1])) c.lineTo(pts[k - 1][0], pts[k - 1][1]);
          c.stroke();
        }
        // блик вдоль спины и чешуйки
        c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = s * 0.22;
        c.beginPath(); c.moveTo(pts[n - 1][0] - s * 0.12, pts[n - 1][1] - s * 0.12);
        for (var h2 = n - 1; h2 >= 1; h2--) {
          var m2 = ctr(snake[h2]);
          c.lineTo(m2[0] - s * 0.12, m2[1] - s * 0.12);
          if (adj(snake[h2], snake[h2 - 1])) c.lineTo(pts[h2 - 1][0] - s * 0.12, pts[h2 - 1][1] - s * 0.12); else c.moveTo(pts[h2 - 1][0] - s * 0.12, pts[h2 - 1][1] - s * 0.12);
        }
        c.stroke();
        c.fillStyle = 'rgba(20,83,45,.28)';
        for (var sc = 1; sc < n; sc++) {
          var sw = s * 0.11 * (1 - sc / n * 0.35);
          c.beginPath(); c.arc(pts[sc][0] + s * 0.18, pts[sc][1] + s * 0.14, sw, 0, 6.283); c.fill();
        }
        for (var q = 2; q < n; q += 2) { // узор на спине
          c.fillStyle = 'rgba(255,255,255,.16)';
          c.beginPath(); c.arc(pts[q][0], pts[q][1], s * 0.16 * (1 - q / n * 0.35), 0, 6.283); c.fill();
        }
        // голова: глаза и язык
        var hx = pts[0][0], hy = pts[0][1];
        var dx = dir.x, dy = dir.y, er = cell * 0.13, hr = s * 0.56;
        var hg = c.createRadialGradient(hx - hr * 0.35, hy - hr * 0.4, hr * 0.1, hx, hy, hr);
        if (!alive && Math.floor(t * 10) % 2) { hg.addColorStop(0, '#fee2e2'); hg.addColorStop(1, '#f87171'); }
        else { hg.addColorStop(0, '#d9ffb3'); hg.addColorStop(0.6, mix(A, B, 0)); hg.addColorStop(1, '#5fbf4a'); }
        c.fillStyle = hg; c.beginPath(); c.arc(hx, hy, hr, 0, 6.283); c.fill();
        // ноздри и щёчки
        c.fillStyle = 'rgba(20,83,45,.6)';
        for (var nn = -1; nn <= 1; nn += 2) { c.beginPath(); c.arc(hx + dx * hr * 0.72 + (-dy) * nn * hr * 0.18, hy + dy * hr * 0.72 + dx * nn * hr * 0.18, Math.max(0.8, hr * 0.07), 0, 6.283); c.fill(); }
        c.fillStyle = 'rgba(244,114,182,.35)';
        for (var ck = -1; ck <= 1; ck += 2) { c.beginPath(); c.arc(hx - dx * hr * 0.15 + (-dy) * ck * hr * 0.62, hy - dy * hr * 0.15 + dx * ck * hr * 0.62, hr * 0.16, 0, 6.283); c.fill(); }
        if (Math.floor(t * 2.5) % 3 === 0 && alive) {
          c.strokeStyle = '#ef4444'; c.lineWidth = Math.max(1.5, cell * 0.07);
          c.beginPath(); c.moveTo(hx + dx * cell * 0.45, hy + dy * cell * 0.45); c.lineTo(hx + dx * cell * 0.75, hy + dy * cell * 0.75); c.stroke();
        }
        for (var e = -1; e <= 1; e += 2) {
          var ex = hx + dx * cell * 0.12 + (-dy) * e * cell * 0.22, ey = hy + dy * cell * 0.12 + dx * e * cell * 0.22;
          c.fillStyle = '#fff'; c.beginPath(); c.arc(ex, ey, er * 1.35, 0, 6.283); c.fill();
          c.fillStyle = '#111'; c.beginPath(); c.arc(ex + dx * er * 0.45, ey + dy * er * 0.45, er * 0.7, 0, 6.283); c.fill();
          c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + dx * er * 0.2 - er * 0.3, ey + dy * er * 0.2 - er * 0.3, er * 0.28, 0, 6.283); c.fill();
          c.strokeStyle = 'rgba(15,74,36,.8)'; c.lineWidth = 1; c.beginPath(); c.arc(ex, ey, er * 1.35, 0, 6.283); c.stroke();
        }
        c.lineCap = 'butt';
        c.globalAlpha = 1;
        // активные эффекты
        var hy0 = oy + 16;
        [['slow', slowT], ['ghost', ghostT]].forEach(function (e) {
          if (e[1] <= 0) return;
          c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.roundRect ? c.roundRect(ox + 6, hy0 - 12, 64, 22, 11) : c.rect(ox + 6, hy0 - 12, 64, 22); c.fill();
          c.fillStyle = PW[e[0]].c; c.font = '800 13px system-ui, sans-serif'; c.fillText(PW[e[0]].s + ' ' + Math.ceil(e[1]), ox + 12, hy0 + 4);
          hy0 += 26;
        });
        if (combo >= 2 && t - lastEat < 3.2) {
          c.fillStyle = 'rgba(253,224,71,' + (1 - (t - lastEat) / 3.2) + ')'; c.fillRect(ox, oy + rows * cell - 4, COLS * cell * (1 - (t - lastEat) / 3.2), 4);
        }

        // частицы
        for (var q = 0; q < parts.length; q++) {
          var pp = parts[q];
          c.globalAlpha = Math.max(0, pp.life / pp.max);
          c.fillStyle = pp.c; c.beginPath(); c.arc(pp.x, pp.y, cell * 0.12, 0, 6.283); c.fill();
        }
        c.globalAlpha = 1;
        c.restore();
      }
    };
    return self;
  }
};
