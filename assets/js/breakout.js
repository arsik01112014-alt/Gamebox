/* Арканоид */
window.GAMES = window.GAMES || {};
window.GAMES.breakout = {
  title: 'Арканоид',
  desc: 'Разбей все кирпичи',
  hint: 'Води пальцем по экрану — платформа двигается за ним. Отпусти палец, чтобы запустить мяч. Лови бонусы: W — шире, M — мульти-мяч, S — медленнее, ♥ — жизнь.',
  colors: ['#06b6d4', '#6366f1'],
  controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="breakoutP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbcfe8"/><stop offset="1" stop-color="#db2777"/></linearGradient><linearGradient id="breakoutY" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fef08a"/><stop offset="1" stop-color="#ca8a04"/></linearGradient><linearGradient id="breakoutG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bbf7d0"/><stop offset="1" stop-color="#16a34a"/></linearGradient><linearGradient id="breakoutD" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#22d3ee"/></linearGradient><radialGradient id="breakoutBall" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#a5b4fc"/></radialGradient></defs><g stroke="rgba(0,0,0,.2)" stroke-width="1.5">' +
    '<rect x="10" y="14" width="24" height="11" rx="3" fill="url(#breakoutP)"/><rect x="38" y="14" width="24" height="11" rx="3" fill="url(#breakoutP)"/><rect x="66" y="14" width="24" height="11" rx="3" fill="url(#breakoutP)"/>' +
    '<rect x="10" y="29" width="24" height="11" rx="3" fill="url(#breakoutY)"/><rect x="66" y="29" width="24" height="11" rx="3" fill="url(#breakoutY)"/>' +
    '<rect x="38" y="44" width="24" height="11" rx="3" fill="url(#breakoutG)"/></g>' +
    '<circle cx="47" cy="66" r="11" fill="#fff" opacity=".2"/><circle cx="47" cy="66" r="7" fill="url(#breakoutBall)"/><path d="M47 66 L36 47" stroke="#fff" stroke-width="2" stroke-dasharray="3 3" opacity=".6"/>' +
    '<rect x="24" y="80" width="52" height="10" rx="5" fill="url(#breakoutD)" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/></svg>',

  create: function (api) {
    var ROWCOL = ['#f43f5e', '#f97316', '#facc15', '#4ade80', '#22d3ee', '#818cf8', '#e879f9'];
    var s, paddle, balls, bricks, caps, parts, level, lives, t, target, keys, combo, shake, banner, held, endT, slowT, wideT;
    var COLS = 8;
    var DIFF = [
      { lives: 5, pw: 124, sp: 280, hard: 0.5 },
      { lives: 3, pw: 92, sp: 330, hard: 1 },
      { lives: 3, pw: 86, sp: 400, hard: 1.8 },
      { lives: 1, pw: 70, sp: 430, hard: 2.2 }
    ];
    var D = DIFF[1], lasers = [], laserT = 0, laserCD = 0, bgStars = [];
    var fireT = 0, guard = false; // v2.0: огненный мяч, страховочный барьер, взрывные кирпичи, новые узоры

    function bw() { return (api.W - 20 * s - (COLS - 1) * 5 * s) / COLS; }
    function buildLevel() {
      bricks = [];
      var rows = Math.min(9, 5 + Math.floor(level / 2)), w = bw(), h = 20 * s, top = 70 * s;
      for (var r = 0; r < rows; r++) for (var c = 0; c < COLS; c++) {
        var keep;
        var cc2 = Math.abs(c - 3.5), rm = rows - 1 - r;
        switch ((level - 1) % 10) {
          case 0: keep = true; break;
          case 1: keep = (r + c) % 2 === 0 || r === 0; break;
          case 2: keep = Math.abs(c - 3.5) <= r * 0.75 + 0.5; break;
          case 3: keep = c === 0 || c === COLS - 1 || r === 0 || r === rows - 1 || (r === Math.floor(rows / 2) && c > 1 && c < COLS - 2); break;
          case 4: keep = Math.random() < 0.75; break;
          case 5: keep = cc2 + Math.abs(r - (rows - 1) / 2) * 1.1 <= 4; break; // ромб
          case 6: keep = r % 2 === 0; break; // полосы
          case 7: keep = (r < 2 && (c === 1 || c === 2 || c === 5 || c === 6)) || (r >= 2 && cc2 <= 3.5 - (r - 2) * 0.8); break; // сердце
          case 8: keep = c % 3 !== 2 || r === 0; break; // колонны
          default: keep = cc2 >= rm * 0.5 || r === 0; // чаша
        }
        if (!keep) continue;
        var hard = (level > 1 || D.hard > 1.5) && (r === 0 || Math.random() < 0.08 * D.hard * Math.min(level, 4));
        var hp = hard ? (D.hard > 1.5 && Math.random() < 0.35 ? 3 : 2) : 1;
        var tnt = hp === 1 && level > 1 && Math.random() < 0.06;
        bricks.push({ x: 10 * s + c * (w + 5 * s), y: top + r * (h + 5 * s), w: w, h: h, hp: hp, max: hp, col: ROWCOL[r % ROWCOL.length], hit: 0, seed: Math.random(), tnt: tnt });
      }
      banner = 1.6;
    }
    function newBall() {
      held = true;
      balls = [{ x: paddle.x, y: paddle.y - 9 * s, vx: 0, vy: 0, r: 7 * s, trail: [] }];
    }
    function speed() { return (D.sp + level * 25) * s * (slowT > 0 ? 0.7 : 1); }
    function launch() {
      if (!held) return;
      held = false;
      var a = (Math.random() - 0.5) * 0.6, sp = speed();
      balls[0].vx = Math.sin(a) * sp; balls[0].vy = -Math.cos(a) * sp;
      api.sound('jump');
    }
    function burst(x, y, col, n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.283, v = (60 + Math.random() * 220) * s;
        parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6 + Math.random() * 0.3, col: col, sz: (2 + Math.random() * 4) * s });
      }
    }
    function hitBrick(b, ball) {
      if (bricks.indexOf(b) < 0) return;
      b.hp -= fireT > 0 ? 9 : 1; b.hit = 0.15;
      combo++;
      if (b.hp <= 0) {
        bricks.splice(bricks.indexOf(b), 1);
        api.addScore(10 * level * Math.min(combo, 8));
        if (combo >= 5 && combo % 5 === 0) api.fx.text(b.x + b.w / 2, b.y, api.t('breakout.combo') + ' ' + combo, '#fde047', 16);
        if (b.tnt) { // взрыв задевает соседей
          api.sound('break'); api.fx.shake(6); burst(b.x + b.w / 2, b.y + b.h / 2, '#fb923c', 30);
          var near = bricks.filter(function (o) { return Math.abs(o.x - b.x) < b.w * 1.6 && Math.abs(o.y - b.y) < b.h * 1.8; });
          near.forEach(function (o) { o.hp = 1; hitBrick(o); });
          if (!bricks.length || held) return;
        }
        burst(b.x + b.w / 2, b.y + b.h / 2, b.col, 14);
        api.sound(combo > 3 ? 'coin' : 'eat'); api.vibrate(8);
        if (Math.random() < 0.14) {
          var types = ['W', 'M', 'S', 'L', 'F', 'D', 'H'], ty = types[Math.floor(Math.random() * (lives < 5 ? 7 : 6))];
          caps.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, type: ty });
        }
        if (!bricks.length) {
          api.addScore(500 * level); api.sound('win'); api.vibrate(60);
          level++; buildLevel(); newBall(); caps = [];
        }
      } else { api.sound('rotate'); }
    }
    function collideBricks(ball, axis) {
      for (var i = 0; i < bricks.length; i++) {
        var b = bricks[i];
        if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w && ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
          if (fireT > 0) { hitBrick(b, ball); return true; }
          if (axis === 'x') { ball.x = ball.vx > 0 ? b.x - ball.r : b.x + b.w + ball.r; ball.vx = -ball.vx; }
          else { ball.y = ball.vy > 0 ? b.y - ball.r : b.y + b.h + ball.r; ball.vy = -ball.vy; }
          hitBrick(b, ball);
          return true;
        }
      }
      return false;
    }
    function stepBall(ball, h) {
      ball.x += ball.vx * h;
      if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); api.sound('move'); }
      if (ball.x > api.W - ball.r) { ball.x = api.W - ball.r; ball.vx = -Math.abs(ball.vx); api.sound('move'); }
      collideBricks(ball, 'x');
      ball.y += ball.vy * h;
      if (ball.y < ball.r + 44 * s) { ball.y = ball.r + 44 * s; ball.vy = Math.abs(ball.vy); api.sound('move'); }
      collideBricks(ball, 'y');
      // платформа
      var p = paddle;
      if (ball.vy > 0 && ball.y + ball.r >= p.y && ball.y - ball.r <= p.y + p.h && ball.x > p.x - p.w / 2 - ball.r && ball.x < p.x + p.w / 2 + ball.r) {
        var off = Math.max(-1, Math.min(1, (ball.x - p.x) / (p.w / 2)));
        var a = off * 1.05, sp = Math.min(speed() * 1.35, Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) * 1.01);
        ball.vx = Math.sin(a) * sp; ball.vy = -Math.abs(Math.cos(a) * sp);
        ball.y = p.y - ball.r;
        combo = 0; p.squash = 0.15;
        api.sound('stomp'); api.vibrate(10);
      }
    }
    function rr(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }

    /* пререндер фона и спрайтов кирпичей (свечение запекается один раз) */
    var bgOff = null, bgKey = '', bcache = {};
    function DPR() { return Math.min(2, window.devicePixelRatio || 1); }
    function mk(w, h) { var d = DPR(), o = document.createElement('canvas'); o.width = Math.ceil(w * d); o.height = Math.ceil(h * d); var q = o.getContext('2d'); q.scale(d, d); o.q = q; return o; }
    function shade(hex, k) {
      var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
      function f(v) { return Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); }
      return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
    }
    function buildBg() {
      var W = api.W, H = api.H; bgKey = W + 'x' + H; bcache = {};
      var o = mk(W, H), c = o.q;
      var g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0b1023'); g.addColorStop(0.6, '#161a46'); g.addColorStop(1, '#251a55');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      var n1 = c.createRadialGradient(W * 0.2, H * 0.25, 0, W * 0.2, H * 0.25, W * 0.7);
      n1.addColorStop(0, 'rgba(232,121,249,.12)'); n1.addColorStop(1, 'rgba(232,121,249,0)'); c.fillStyle = n1; c.fillRect(0, 0, W, H);
      var n2 = c.createRadialGradient(W * 0.85, H * 0.5, 0, W * 0.85, H * 0.5, W * 0.6);
      n2.addColorStop(0, 'rgba(56,189,248,.1)'); n2.addColorStop(1, 'rgba(56,189,248,0)'); c.fillStyle = n2; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(99,102,241,.07)'; c.lineWidth = 1;
      for (var gx = 0; gx < W; gx += 28 * s) { c.beginPath(); c.moveTo(gx + 0.5, 0); c.lineTo(gx + 0.5, H * 0.62); c.stroke(); }
      for (var gy = 0; gy < H * 0.62; gy += 28 * s) { c.beginPath(); c.moveTo(0, gy + 0.5); c.lineTo(W, gy + 0.5); c.stroke(); }
      // перспективная неоновая сетка внизу
      var hy = H * 0.62;
      c.strokeStyle = 'rgba(34,211,238,.13)';
      for (var k = -12; k <= 12; k++) { c.beginPath(); c.moveTo(W / 2 + k * W * 0.04, hy); c.lineTo(W / 2 + k * W * 0.22, H); c.stroke(); }
      for (var j = 0; j < 9; j++) { var yy = hy + (H - hy) * Math.pow(j / 8, 1.8); c.globalAlpha = 0.4 + j / 12; c.beginPath(); c.moveTo(0, yy); c.lineTo(W, yy); c.stroke(); }
      c.globalAlpha = 1;
      var hl = c.createLinearGradient(0, hy - 30 * s, 0, hy + 30 * s);
      hl.addColorStop(0, 'rgba(232,121,249,0)'); hl.addColorStop(0.5, 'rgba(232,121,249,.18)'); hl.addColorStop(1, 'rgba(232,121,249,0)');
      c.fillStyle = hl; c.fillRect(0, hy - 30 * s, W, 60 * s);
      var hz = c.createRadialGradient(W / 2, H * 1.05, 0, W / 2, H * 1.05, H * 0.6);
      hz.addColorStop(0, 'rgba(34,211,238,.2)'); hz.addColorStop(1, 'rgba(34,211,238,0)'); c.fillStyle = hz; c.fillRect(0, 0, W, H);
      // боковые неоновые стенки
      var wl = c.createLinearGradient(0, 0, 6 * s, 0);
      wl.addColorStop(0, 'rgba(129,140,248,.35)'); wl.addColorStop(1, 'rgba(129,140,248,0)');
      c.fillStyle = wl; c.fillRect(0, 0, 6 * s, H);
      c.save(); c.translate(W, 0); c.scale(-1, 1); c.fillRect(0, 0, 6 * s, H); c.restore();
      var vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.4)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
      bgOff = o;
    }
    function brickSprite(b, col) {
      var key = col + b.max + '|' + Math.round(b.w) + 'x' + Math.round(b.h);
      if (bcache[key]) return bcache[key];
      var P = Math.ceil(10 * s), w = b.w, h = b.h, R = 5 * s, o = mk(w + P * 2, h + P * 2), c = o.q;
      var dark = b.max >= 3 ? '#92400e' : b.max >= 2 ? '#475569' : shade(col, -0.5);
      if (api.quality > 0) { c.save(); c.shadowColor = col; c.shadowBlur = 10 * s; c.globalAlpha = 0.8; c.fillStyle = col; rr(c, P, P, w, h, R); c.fill(); c.restore(); }
      c.fillStyle = dark; rr(c, P, P, w, h, R); c.fill();
      var g = c.createLinearGradient(0, P, 0, P + h);
      g.addColorStop(0, shade(col, 0.35)); g.addColorStop(0.45, col); g.addColorStop(1, shade(col, -0.3));
      c.fillStyle = g; rr(c, P + 1, P + 1, w - 2, h - 3 * s, R * 0.85); c.fill();
      if (b.max >= 3) { // золото: рифлёный узор
        c.save(); rr(c, P + 1, P + 1, w - 2, h - 3 * s, R * 0.85); c.clip();
        c.strokeStyle = 'rgba(146,64,14,.35)'; c.lineWidth = 1;
        for (var x = -h; x < w; x += 6 * s) { c.beginPath(); c.moveTo(P + x, P + h); c.lineTo(P + x + h, P); c.stroke(); }
        c.restore();
      } else if (b.max >= 2) { // сталь: шлифовка
        c.save(); rr(c, P + 1, P + 1, w - 2, h - 3 * s, R * 0.85); c.clip();
        c.fillStyle = 'rgba(255,255,255,.08)';
        for (var y = 0; y < h; y += 2) if ((y * 7) % 5 < 2) c.fillRect(P, P + y, w, 1);
        c.restore();
      } else { // стекло: внутренняя грань
        c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1; rr(c, P + 3 * s, P + 3 * s, w - 6 * s, h - 7 * s, R * 0.5); c.stroke();
      }
      c.fillStyle = 'rgba(255,255,255,.42)'; rr(c, P + 3 * s, P + 2 * s, w - 6 * s, h * 0.28, 3 * s); c.fill();
      c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(P + 6 * s, P + h * 0.22, 1.3 * s, 0, 6.283); c.fill();
      if (b.max >= 2) {
        c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.5; rr(c, P + 1, P + 1, w - 2, h - 2, R); c.stroke();
        [[0.1, 0.32], [0.9, 0.32], [0.1, 0.7], [0.9, 0.7]].forEach(function (pp) {
          var rx = P + w * pp[0], ry = P + h * pp[1];
          c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(rx + 0.6, ry + 0.8, 1.7 * s, 0, 6.283); c.fill();
          c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(rx, ry, 1.5 * s, 0, 6.283); c.fill();
        });
      }
      o.P = P; bcache[key] = o; return o;
    }

    return {
      reset: function () {
        s = api.W / 400;
        D = DIFF[api.diff];
        paddle = { x: api.W / 2, y: api.H - 50 * s, w: D.pw * s, h: 14 * s, squash: 0 };
        lasers = []; laserT = 0; laserCD = 0;
        bgStars = []; for (var i = 0; i < 60; i++) bgStars.push({ x: Math.random(), y: Math.random(), p: Math.random() * 6, r: Math.random() * 1.3 + 0.3 });
        target = paddle.x; keys = {};
        level = 1; lives = D.lives; t = 0; combo = 0; shake = 0; caps = []; parts = []; endT = 0; slowT = 0; wideT = 0; fireT = 0; guard = false;
        buildLevel(); newBall();
      },
      idle: function (dt) { t += dt; if (banner > 0) banner -= dt * 0.3; },
      key: function (k, down) { keys[k] = down; if (down && (k === 'a' || k === 'up')) launch(); },
      input: function (type, d) {
        if (type === 'down' || type === 'move') target = d.x;
        else if (type === 'up' || type === 'tap') launch();
      },
      update: function (dt) {
        t += dt;
        if (banner > 0) banner -= dt;
        if (shake > 0) shake -= dt;
        if (slowT > 0) slowT -= dt;
        if (fireT > 0) fireT -= dt;
        if (wideT > 0) { wideT -= dt; if (wideT <= 0) paddle.w = D.pw * s; }
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); }
        if (keys.left) target = paddle.x - 600 * s * dt * 3;
        if (keys.right) target = paddle.x + 600 * s * dt * 3;
        var p = paddle;
        target = Math.max(p.w / 2, Math.min(api.W - p.w / 2, target));
        p.x += (target - p.x) * Math.min(1, dt * 22);
        if (p.squash > 0) p.squash -= dt;

        if (held && balls.length) { balls[0].x = p.x; balls[0].y = p.y - balls[0].r - 1; }
        else if (endT <= 0) {
          for (var i = balls.length - 1; i >= 0; i--) {
            var b = balls[i], dist = Math.sqrt(b.vx * b.vx + b.vy * b.vy) * dt, n = Math.max(1, Math.ceil(dist / (b.r * 0.5)));
            for (var k = 0; k < n && !held; k++) stepBall(b, dt / n);
            if (held) break; // уровень пройден во время шага
            if (guard && b.vy > 0 && b.y + b.r > api.H - 10 * s) { b.vy = -Math.abs(b.vy); b.y = api.H - 10 * s - b.r; guard = false; api.sound('break'); api.fx.flash('#22d3ee', 0.15); }
            b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > 8) b.trail.shift();
            if (b.y - b.r > api.H) balls.splice(i, 1);
          }
          if (!held && !balls.length) {
            lives--; shake = 0.3; api.sound('hit'); api.vibrate(150);
            if (lives <= 0) { endT = 0.6; }
            else { newBall(); p.w = D.pw * s; wideT = 0; slowT = 0; laserT = 0; fireT = 0; }
          }
        }
        // лазер
        if (laserT > 0 && endT <= 0) {
          laserT -= dt; laserCD -= dt;
          if (laserCD <= 0 && !held) {
            laserCD = 0.32;
            lasers.push({ x: p.x - p.w / 2 + 8 * s, y: p.y }); lasers.push({ x: p.x + p.w / 2 - 8 * s, y: p.y });
            api.sound('move');
          }
        }
        for (var li = lasers.length - 1; li >= 0; li--) {
          var lz = lasers[li]; lz.y -= 700 * s * dt;
          var hitL = false;
          for (var bi = 0; bi < bricks.length; bi++) {
            var bk = bricks[bi];
            if (lz.x > bk.x && lz.x < bk.x + bk.w && lz.y < bk.y + bk.h && lz.y > bk.y - 10 * s) { hitBrick(bk); hitL = true; break; }
          }
          if (hitL || lz.y < 40 * s || held) lasers.splice(li, 1);
        }
        // бонусы
        for (var j = caps.length - 1; j >= 0; j--) {
          var cp = caps[j];
          cp.y += 150 * s * dt;
          if (cp.y > p.y - 8 * s && cp.y < p.y + p.h + 8 * s && Math.abs(cp.x - p.x) < p.w / 2 + 14 * s) {
            caps.splice(j, 1);
            api.sound('bonus'); api.vibrate(20); api.addScore(50);
            if (cp.type === 'W') { p.w = D.pw * 1.5 * s; wideT = 15; api.toast(api.t('breakout.wide')); }
            else if (cp.type === 'S') { slowT = 10; api.toast(api.t('breakout.slow')); }
            else if (cp.type === 'H') { lives++; api.toast(api.t('breakout.life')); }
            else if (cp.type === 'L') { laserT = 9; api.toast(api.t('breakout.laser')); }
            else if (cp.type === 'F') { fireT = 8; api.toast(api.t('breakout.fire')); }
            else if (cp.type === 'D') { guard = true; api.toast(api.t('breakout.guard')); }
            else if (cp.type === 'M' && balls.length && !held) {
              var src = balls[0], sp = Math.sqrt(src.vx * src.vx + src.vy * src.vy);
              for (var m = 0; m < 2; m++) {
                var a = (m ? 0.5 : -0.5) + Math.atan2(src.vx, -src.vy);
                balls.push({ x: src.x, y: src.y, vx: Math.sin(a) * sp, vy: -Math.abs(Math.cos(a) * sp), r: src.r, trail: [] });
              }
              api.toast(api.t('breakout.multi'));
            }
          } else if (cp.y > api.H + 20) caps.splice(j, 1);
        }
        for (var q = parts.length - 1; q >= 0; q--) {
          var pt = parts[q];
          pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 500 * s * dt; pt.life -= dt;
          if (pt.life <= 0) parts.splice(q, 1);
        }
        bricks.forEach(function (b) { if (b.hit > 0) b.hit -= dt; });
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        if (!bgOff || bgKey !== W + 'x' + H) buildBg();
        c.drawImage(bgOff, 0, 0, W, H);
        bgStars.forEach(function (st) {
          c.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(t * 1.5 + st.p));
          c.fillStyle = '#c7d2fe'; c.beginPath(); c.arc(st.x * W, st.y * H, st.r, 0, 6.283); c.fill();
        });
        c.globalAlpha = 1;
        c.save();
        if (shake > 0) c.translate((Math.random() - 0.5) * 12 * shake * s, (Math.random() - 0.5) * 12 * shake * s);
        // кирпичи
        bricks.forEach(function (b) {
          var col = b.max >= 3 ? '#fbbf24' : b.max >= 2 ? '#cbd5e1' : b.col;
          var bs = brickSprite(b, col);
          c.drawImage(bs, b.x - bs.P, b.y - bs.P, b.w + bs.P * 2, b.h + bs.P * 2);
          if (b.hp < b.max) { // трещины
            c.strokeStyle = 'rgba(15,23,42,.75)'; c.lineWidth = 1.4;
            var cx0 = b.x + b.w * (0.3 + b.seed * 0.4);
            c.beginPath(); c.moveTo(cx0, b.y); c.lineTo(cx0 + 5 * s, b.y + b.h * 0.45); c.lineTo(cx0 - 3 * s, b.y + b.h * 0.65); c.lineTo(cx0 + 2 * s, b.y + b.h);
            c.moveTo(cx0 + 5 * s, b.y + b.h * 0.45); c.lineTo(cx0 + 14 * s, b.y + b.h * 0.3);
            if (b.max - b.hp >= 2) { c.moveTo(b.x + b.w * 0.15, b.y + b.h * 0.6); c.lineTo(b.x + b.w * 0.3, b.y + b.h * 0.4); c.lineTo(cx0 - 3 * s, b.y + b.h * 0.65); }
            c.stroke();
          }
          if (b.tnt) {
            c.fillStyle = '#7f1d1d'; rr(c, b.x + 2, b.y + 2, b.w - 4, b.h - 4, 4 * s); c.fill();
            c.fillStyle = Math.floor(t * 4) % 2 ? '#fde047' : '#fb923c'; c.font = '900 ' + Math.round(b.h * 0.6) + 'px system-ui, sans-serif';
            c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TNT', b.x + b.w / 2, b.y + b.h / 2 + 1);
          }
          if (b.hit > 0) { c.fillStyle = 'rgba(255,255,255,' + b.hit * 5 + ')'; rr(c, b.x, b.y, b.w, b.h, 5 * s); c.fill(); }
        });
        // бонусы
        var CAP = { W: '#4ade80', M: '#60a5fa', S: '#facc15', L: '#f472b6', H: '#f43f5e', F: '#fb923c', D: '#22d3ee' };
        if (guard) { c.fillStyle = 'rgba(34,211,238,' + (0.5 + 0.3 * Math.sin(t * 5)) + ')'; c.fillRect(0, api.H - 8 * s, api.W, 4 * s); }
        caps.forEach(function (cp) {
          var cc0 = CAP[cp.type];
          if (api.quality > 0) { c.globalAlpha = 0.3; c.fillStyle = cc0; rr(c, cp.x - 22 * s, cp.y - 13 * s, 44 * s, 26 * s, 13 * s); c.fill(); c.globalAlpha = 1; }
          c.fillStyle = shade(cc0, -0.45); rr(c, cp.x - 18 * s, cp.y - 9 * s, 36 * s, 18 * s, 9 * s); c.fill();
          var cg = c.createLinearGradient(0, cp.y - 9 * s, 0, cp.y + 9 * s);
          cg.addColorStop(0, shade(cc0, 0.4)); cg.addColorStop(0.5, cc0); cg.addColorStop(1, shade(cc0, -0.25));
          c.fillStyle = cg; rr(c, cp.x - 17 * s, cp.y - 8 * s, 34 * s, 16 * s, 8 * s); c.fill();
          c.fillStyle = 'rgba(255,255,255,.5)'; rr(c, cp.x - 12 * s, cp.y - 6.5 * s, 24 * s, 4 * s, 2 * s); c.fill();
          c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(cp.x - 9 * s, cp.y - 8 * s, 1.5 * s, 16 * s); c.fillRect(cp.x + 7.5 * s, cp.y - 8 * s, 1.5 * s, 16 * s);
          c.fillStyle = '#0f172a'; c.font = '900 ' + Math.round(12 * s) + 'px system-ui, sans-serif';
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(cp.type === 'H' ? '♥' : cp.type === 'F' ? '🔥' : cp.type === 'D' ? '▁' : cp.type, cp.x, cp.y + 1);
        });
        // частицы
        parts.forEach(function (pt) {
          c.globalAlpha = Math.max(0, pt.life); c.fillStyle = pt.col; c.beginPath(); c.arc(pt.x + pt.sz / 2, pt.y + pt.sz / 2, pt.sz * 0.6, 0, 6.283); c.fill();
        });
        c.globalAlpha = 1;
        // платформа
        var p = paddle, sq = p.squash > 0 ? p.squash * 20 * s : 0;
        c.save(); c.shadowColor = '#22d3ee'; c.shadowBlur = 18;
        var pg = c.createLinearGradient(p.x - p.w / 2, 0, p.x + p.w / 2, 0);
        pg.addColorStop(0, '#6366f1'); pg.addColorStop(0.5, '#22d3ee'); pg.addColorStop(1, '#6366f1');
        c.fillStyle = pg; rr(c, p.x - p.w / 2 - sq / 2, p.y + sq / 4, p.w + sq, p.h - sq / 2, p.h / 2); c.fill();
        c.restore();
        var pl = p.x - p.w / 2 - sq / 2, pwd = p.w + sq;
        c.fillStyle = 'rgba(15,23,42,.35)'; rr(c, pl + 2, p.y + p.h * 0.55 + sq / 4, pwd - 4, p.h * 0.4 - sq / 2, p.h * 0.2); c.fill();
        // торцевые металлические колпачки
        var capW = Math.min(14 * s, pwd * 0.18);
        var mg = c.createLinearGradient(0, p.y, 0, p.y + p.h);
        mg.addColorStop(0, '#f1f5f9'); mg.addColorStop(0.5, '#94a3b8'); mg.addColorStop(1, '#475569');
        c.fillStyle = mg;
        rr(c, pl, p.y + sq / 4, capW, p.h - sq / 2, p.h / 2); c.fill();
        rr(c, pl + pwd - capW, p.y + sq / 4, capW, p.h - sq / 2, p.h / 2); c.fill();
        c.fillStyle = 'rgba(255,255,255,.5)'; rr(c, p.x - p.w / 2 + 6 * s, p.y + 2 * s, p.w - 12 * s, 3 * s, 2 * s); c.fill();
        c.fillStyle = 'rgba(255,255,255,.25)';
        for (var gr = -2; gr <= 2; gr++) c.fillRect(p.x + gr * 6 * s - 0.5 * s, p.y + p.h * 0.45, 1 * s, p.h * 0.35);
        c.fillStyle = '#f472b6'; // огоньки по краям
        c.beginPath(); c.arc(p.x - p.w / 2 + 6 * s, p.y + p.h / 2, 2.5 * s, 0, 6.283); c.arc(p.x + p.w / 2 - 6 * s, p.y + p.h / 2, 2.5 * s, 0, 6.283); c.fill();
        if (laserT > 0) {
          c.fillStyle = '#e2e8f0';
          c.fillRect(p.x - p.w / 2 + 5 * s, p.y - 8 * s, 6 * s, 9 * s); c.fillRect(p.x + p.w / 2 - 11 * s, p.y - 8 * s, 6 * s, 9 * s);
        }
        c.save(); c.shadowColor = '#f472b6'; c.shadowBlur = 10; c.fillStyle = '#fbcfe8';
        lasers.forEach(function (lz) { c.fillRect(lz.x - 1.5 * s, lz.y - 12 * s, 3 * s, 14 * s); });
        c.restore();
        // мячи
        balls.forEach(function (b) {
          for (var i = 0; i < b.trail.length; i++) {
            c.globalAlpha = i / b.trail.length * 0.35;
            c.fillStyle = slowT > 0 ? '#facc15' : '#a5f3fc';
            c.beginPath(); c.arc(b.trail[i].x, b.trail[i].y, b.r * (0.4 + i / b.trail.length * 0.6), 0, 6.283); c.fill();
          }
          c.globalAlpha = 1;
          c.save(); c.shadowColor = fireT > 0 ? '#fb923c' : '#fff'; c.shadowBlur = fireT > 0 ? 22 : 14;
          c.fillStyle = fireT > 0 ? (Math.floor(t * 12) % 2 ? '#fdba74' : '#f97316') : '#fff'; c.beginPath(); c.arc(b.x, b.y, b.r * (fireT > 0 ? 1.2 : 1), 0, 6.283); c.fill(); c.restore();
          c.fillStyle = 'rgba(99,102,241,.35)'; c.beginPath(); c.arc(b.x + b.r * 0.25, b.y + b.r * 0.25, b.r * 0.6, 0, 6.283); c.fill();
          c.fillStyle = '#fff'; c.beginPath(); c.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.3, 0, 6.283); c.fill();
        });
        c.restore();
        // HUD
        c.textBaseline = 'middle'; c.font = '800 ' + Math.round(15 * s) + 'px system-ui, sans-serif';
        c.textAlign = 'left'; c.fillStyle = '#f43f5e';
        var hearts = ''; for (var h = 0; h < Math.min(lives, 6); h++) hearts += '♥ ';
        c.fillText(hearts, 12 * s, 22 * s);
        c.textAlign = 'right'; c.fillStyle = 'rgba(255,255,255,.75)';
        c.fillText(api.t('breakout.level') + ' ' + level, W - 12 * s, 22 * s);
        if (combo > 2) { c.textAlign = 'center'; c.fillStyle = '#facc15'; c.fillText(api.t('breakout.combo') + ' ×' + Math.min(combo, 8), W / 2, 22 * s); }
        if (held && endT <= 0) {
          c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,' + (0.5 + 0.4 * Math.sin(t * 5)) + ')';
          c.font = '700 ' + Math.round(14 * s) + 'px system-ui, sans-serif';
          c.fillText(api.t('breakout.release'), W / 2, paddle.y - 40 * s);
        }
        if (banner > 0) {
          c.globalAlpha = Math.min(1, banner);
          c.textAlign = 'center'; c.fillStyle = '#fff'; c.font = '900 ' + Math.round(34 * s) + 'px system-ui, sans-serif';
          c.fillText(api.t('breakout.level') + ' ' + level, W / 2, H * 0.55);
          c.globalAlpha = 1;
        }
      }
    };
  }
};
