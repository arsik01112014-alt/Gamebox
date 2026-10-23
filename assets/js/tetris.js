/* Тетрис */
window.GAMES = window.GAMES || {};
window.GAMES.tetris = {
  title: 'Тетрис',
  desc: 'Собирай целые линии',
  hint: 'Стрелки влево/вправо — сдвиг, вниз — ускорить, круглая кнопка — поворот, кнопка с чертой — сбросить вниз. Жесты: тап — поворот, свайп — сдвиг, свайп вниз — сброс.',
  colors: ['#8b5cf6', '#3b82f6'],
  controls: 'tetris',
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="tetrisC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a5f3fc"/><stop offset="1" stop-color="#0891b2"/></linearGradient><linearGradient id="tetrisY" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fef08a"/><stop offset="1" stop-color="#ca8a04"/></linearGradient><linearGradient id="tetrisR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fca5a5"/><stop offset="1" stop-color="#b91c1c"/></linearGradient><linearGradient id="tetrisP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9d5ff"/><stop offset="1" stop-color="#7e22ce"/></linearGradient></defs>' +
    '<g stroke="rgba(0,0,0,.25)" stroke-width="2">' +
    '<rect x="14" y="60" width="18" height="18" rx="3" fill="url(#tetrisC)"/><rect x="32" y="60" width="18" height="18" rx="3" fill="url(#tetrisC)"/><rect x="50" y="60" width="18" height="18" rx="3" fill="url(#tetrisC)"/><rect x="68" y="60" width="18" height="18" rx="3" fill="url(#tetrisC)"/>' +
    '<rect x="14" y="42" width="18" height="18" rx="3" fill="url(#tetrisY)"/><rect x="32" y="42" width="18" height="18" rx="3" fill="url(#tetrisY)"/>' +
    '<rect x="50" y="42" width="18" height="18" rx="3" fill="url(#tetrisR)"/><rect x="68" y="42" width="18" height="18" rx="3" fill="url(#tetrisR)"/><rect x="50" y="24" width="18" height="18" rx="3" fill="url(#tetrisR)"/>' +
    '<rect x="32" y="6" width="18" height="18" rx="3" fill="url(#tetrisP)"/><rect x="14" y="24" width="18" height="18" rx="3" fill="url(#tetrisP)"/><rect x="32" y="24" width="18" height="18" rx="3" fill="url(#tetrisP)"/>' +
    '</g><g fill="#fff" opacity=".35"><rect x="16" y="62" width="70" height="3" rx="1.5"/><rect x="16" y="44" width="70" height="3" rx="1.5"/><rect x="52" y="26" width="14" height="3" rx="1.5"/><rect x="16" y="26" width="32" height="3" rx="1.5"/><rect x="34" y="8" width="14" height="3" rx="1.5"/></g></svg>',

  create: function (api) {
    var COLS = 10, ROWS = 20;
    var SHAPES = {
      I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
      J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
      L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
      O: [[1, 1], [1, 1]],
      S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
      T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
      Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]]
    };
    var COLORS = { G: '#64748b', I: '#22d3ee', J: '#3b82f6', L: '#f97316', O: '#facc15', S: '#22c55e', T: '#a855f7', Z: '#ef4444' };
    var KICKS = [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0], [-1, -1], [1, -1]];

    var board, cur, next, bag, lines, level, fallT, lockT, lockMoves, soft, clearing, clearT, das, t, cell, bx, by, panelX, flashes, gameEnded, endT, parts;
    var hold, canHold, combo, b2b, holdY; // v2.0: удержание фигуры, комбо, серия тетрисов

    function rotate(m) {
      var n = m.length, r = [];
      for (var y = 0; y < n; y++) { r.push([]); for (var x = 0; x < n; x++) r[y].push(m[n - 1 - x][y]); }
      return r;
    }
    function fromBag() {
      if (!bag.length) {
        bag = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
        for (var i = bag.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = bag[i]; bag[i] = bag[j]; bag[j] = tmp; }
      }
      return bag.pop();
    }
    function makePiece(type) {
      var m = SHAPES[type].map(function (r) { return r.slice(); });
      return { type: type, m: m, x: Math.floor((COLS - m.length) / 2), y: type === 'I' ? -1 : 0 };
    }
    function collide(p, dx, dy, m) {
      m = m || p.m;
      for (var y = 0; y < m.length; y++) for (var x = 0; x < m.length; x++) {
        if (!m[y][x]) continue;
        var nx = p.x + x + dx, ny = p.y + y + dy;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
      return false;
    }
    function spawn(type) {
      cur = makePiece(type || next);
      if (!type) next = fromBag();
      canHold = true;
      fallT = 0; lockT = 0; lockMoves = 0;
      if (collide(cur, 0, 0)) { gameEnded = true; endT = 0.6; cur = null; api.sound('hit'); api.vibrate(200); }
    }
    function move(dx) {
      if (!cur || !collide(cur, dx, 0)) {
        if (!cur) return false;
        cur.x += dx; api.sound('move'); touchLock(); return true;
      }
      return false;
    }
    function touchLock() { if (lockMoves < 15) { lockT = 0; lockMoves++; } }
    function rot() {
      if (!cur || cur.type === 'O') return;
      var m = rotate(cur.m);
      for (var i = 0; i < KICKS.length; i++) {
        var k = KICKS[i];
        if (!collide(cur, k[0], k[1], m)) { cur.m = m; cur.x += k[0]; cur.y += k[1]; api.sound('rotate'); touchLock(); return; }
      }
    }
    function ghostY() {
      var d = 0; while (!collide(cur, 0, d + 1)) d++; return cur.y + d;
    }
    function doHold() {
      if (!cur || !canHold || clearing) return;
      var t0 = cur.type;
      if (hold) { var h = hold; hold = t0; spawn(h); }
      else { hold = t0; spawn(); }
      canHold = false;
      api.sound('rotate'); api.vibrate(10);
    }
    function hardDrop() {
      if (!cur) return;
      var gy = ghostY(), dist = gy - cur.y;
      for (var x = 0; x < cur.m.length; x++) for (var y = 0; y < cur.m.length; y++) if (cur.m[y][x]) {
        flashes.push({ x: cur.x + x, y0: cur.y + y, y1: gy + y, life: 0.25, c: COLORS[cur.type] });
      }
      cur.y = gy;
      api.addScore(dist * 2);
      api.sound('drop'); api.vibrate(25);
      lock();
    }
    function lock() {
      var above = false;
      for (var y = 0; y < cur.m.length; y++) for (var x = 0; x < cur.m.length; x++) {
        if (!cur.m[y][x]) continue;
        var by2 = cur.y + y;
        if (by2 < 0) above = true; else board[by2][cur.x + x] = cur.type;
      }
      cur = null;
      if (above) { gameEnded = true; endT = 0.6; api.sound('hit'); api.vibrate(200); return; }
      var full = [];
      for (var r = 0; r < ROWS; r++) if (board[r].every(function (v) { return v; })) full.push(r);
      if (full.length) {
        clearing = full; clearT = 0.3;
        var pts = [0, 100, 300, 500, 800][full.length] * level;
        combo++;
        if (full.length === 4) { if (b2b) { pts = Math.round(pts * 1.5); api.fx.text(bx + COLS * cell / 2, by + full[0] * cell - 10, 'B2B ×1.5', '#22d3ee', 18); } b2b = true; } else b2b = false;
        if (combo > 1) { pts += 50 * (combo - 1) * level; api.fx.text(bx + COLS * cell / 2, by + full[0] * cell + 14, api.t('tetris.combo', combo - 1), '#f472b6', 18); }
        // полная очистка поля
        var rest = 0;
        for (var rr = 0; rr < ROWS; rr++) if (full.indexOf(rr) < 0) for (var cc = 0; cc < COLS; cc++) if (board[rr][cc]) rest++;
        if (!rest) { pts += 2000 * level; api.fx.confetti(90); api.toast(api.t('tetris.perfect')); api.sound('win'); }
        api.addScore(pts);
        api.fx.text(bx + COLS * cell / 2, by + full[full.length - 1] * cell, '+' + pts, '#fde047', 16 + full.length * 3);
        if (full.length === 4) api.fx.shake(6);
        if (full.length > 1) api.toast(api.t('tetris.l' + full.length));
        api.sound(full.length === 4 ? 'tetris' : 'line'); api.vibrate(full.length === 4 ? 90 : 35);
        full.forEach(function (row) {
          for (var c = 0; c < COLS; c++) for (var k = 0; k < 2; k++) {
            parts.push({ x: bx + (c + 0.5) * cell, y: by + (row + 0.5) * cell, vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.8) * 300, life: 0.7, c: COLORS[board[row][c]] });
          }
        });
      } else {
        combo = 0;
        api.sound('drop');
        spawn();
      }
    }
    var DIFF = [
      { start: 1, grav: 1.6, ghost: true, garbage: 0 },
      { start: 1, grav: 1, ghost: true, garbage: 0 },
      { start: 5, grav: 1, ghost: true, garbage: 5 },
      { start: 10, grav: 1, ghost: false, garbage: 3 }
    ];
    var D = DIFF[1], rain = [];
    function gravity() { return Math.max(0.04, 0.8 * Math.pow(0.85, level - 1) * D.grav); }

    function layout() {
      cell = Math.floor(Math.min((api.H - 16) / ROWS, (api.W - 24) / (COLS + 4.6)));
      var bw = COLS * cell, pw = 4.2 * cell, total = bw + pw + 10;
      bx = Math.floor((api.W - total) / 2);
      by = Math.floor((api.H - ROWS * cell) / 2);
      panelX = bx + bw + 10;
    }

    /* спрайты блоков кэшируются по цвету и размеру */
    var bcache = {}, wellOff = null, wellKey = '';
    function DPR() { return Math.min(2, window.devicePixelRatio || 1); }
    function shade(hex, k) {
      var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
      function f(v) { return Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); }
      return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
    }
    function rrect(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }
    function sprite(col, sz) {
      var key = col + '|' + Math.round(sz * 4);
      if (bcache[key]) return bcache[key];
      var d = DPR(), o = document.createElement('canvas');
      o.width = Math.ceil(sz * d); o.height = Math.ceil(sz * d);
      var c = o.getContext('2d'); c.scale(d, d);
      var p = Math.max(0.5, sz * 0.04), r = Math.max(1.5, sz * 0.16), w = sz - p * 2;
      rrect(c, p, p, w, w, r); c.fillStyle = shade(col, -0.45); c.fill();             // тёмный край
      var g = c.createLinearGradient(0, p, 0, p + w);
      g.addColorStop(0, shade(col, 0.35)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.25));
      var b = Math.max(1.5, sz * 0.1);
      rrect(c, p + 0.8, p + 0.8, w - 1.6, w - 1.6, r * 0.9); c.fillStyle = g; c.fill();
      // скос: светлый верх-лево, тёмный низ-право
      c.fillStyle = 'rgba(255,255,255,.35)';
      c.beginPath(); c.moveTo(p + r, p + 1); c.lineTo(p + w - r, p + 1); c.lineTo(p + w - b, p + b); c.lineTo(p + b, p + b); c.lineTo(p + b, p + w - b); c.lineTo(p + 1, p + w - r); c.lineTo(p + 1, p + r); c.closePath(); c.fill();
      c.fillStyle = 'rgba(0,0,0,.25)';
      c.beginPath(); c.moveTo(p + w - 1, p + r); c.lineTo(p + w - 1, p + w - r); c.lineTo(p + w - r, p + w - 1); c.lineTo(p + r, p + w - 1); c.lineTo(p + b, p + w - b); c.lineTo(p + w - b, p + w - b); c.lineTo(p + w - b, p + b); c.closePath(); c.fill();
      // грань-плитка в центре + глянцевый блик
      var ig = c.createLinearGradient(0, p + b, 0, p + w - b);
      ig.addColorStop(0, shade(col, 0.15)); ig.addColorStop(1, shade(col, -0.1));
      rrect(c, p + b, p + b, w - b * 2, w - b * 2, r * 0.5); c.fillStyle = ig; c.fill();
      c.fillStyle = 'rgba(255,255,255,.28)';
      rrect(c, p + b + 1, p + b + 1, (w - b * 2) * 0.55, (w - b * 2) * 0.22, r * 0.4); c.fill();
      c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(p + b * 1.6, p + b * 1.6, Math.max(0.8, sz * 0.05), 0, 6.283); c.fill();
      bcache[key] = o; return o;
    }
    function block(c, x, y, sz, col, alpha) {
      c.globalAlpha = alpha == null ? 1 : alpha;
      c.drawImage(sprite(col, sz), x, y, sz, sz);
      c.globalAlpha = 1;
    }
    // статичный фон + стакан
    function buildWell() {
      var W = api.W, H = api.H, d = DPR();
      wellKey = W + 'x' + H + ':' + cell; bcache = {};
      wellOff = document.createElement('canvas'); wellOff.width = Math.ceil(W * d); wellOff.height = Math.ceil(H * d);
      var c = wellOff.getContext('2d'); c.scale(d, d);
      var bg = c.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#221d5c'); bg.addColorStop(0.6, '#15113d'); bg.addColorStop(1, '#0a0820');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      var rg = c.createRadialGradient(W * 0.5, H * 0.1, 0, W * 0.5, H * 0.1, H * 0.7);
      rg.addColorStop(0, 'rgba(139,92,246,.28)'); rg.addColorStop(1, 'rgba(139,92,246,0)');
      c.fillStyle = rg; c.fillRect(0, 0, W, H);
      // точечная сетка
      c.fillStyle = 'rgba(255,255,255,.05)';
      for (var gy = 8; gy < H; gy += 16) for (var gx = 8; gx < W; gx += 16) c.fillRect(gx, gy, 1, 1);
      var bw = COLS * cell, bh = ROWS * cell;
      // свечение стакана (один раз)
      c.save(); c.shadowColor = 'rgba(139,92,246,.9)'; c.shadowBlur = 26;
      c.fillStyle = '#0b0820'; c.fillRect(bx - 4, by - 4, bw + 8, bh + 8); c.restore();
      // рамка-металл
      var fg = c.createLinearGradient(bx - 5, 0, bx + bw + 5, 0);
      fg.addColorStop(0, '#6d5bd0'); fg.addColorStop(0.5, '#a78bfa'); fg.addColorStop(1, '#5b4bb8');
      rrect(c, bx - 5, by - 5, bw + 10, bh + 10, 6); c.fillStyle = fg; c.fill();
      // колодец
      var wg = c.createLinearGradient(0, by, 0, by + bh);
      wg.addColorStop(0, '#0d0a26'); wg.addColorStop(1, '#151036');
      c.fillStyle = wg; c.fillRect(bx, by, bw, bh);
      for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) {
        c.fillStyle = (x + y) % 2 ? 'rgba(255,255,255,.012)' : 'rgba(255,255,255,.028)';
        c.fillRect(bx + x * cell, by + y * cell, cell, cell);
      }
      c.strokeStyle = 'rgba(167,139,250,.08)'; c.lineWidth = 1;
      for (var x2 = 1; x2 < COLS; x2++) { c.beginPath(); c.moveTo(bx + x2 * cell + 0.5, by); c.lineTo(bx + x2 * cell + 0.5, by + bh); c.stroke(); }
      for (var y2 = 1; y2 < ROWS; y2++) { c.beginPath(); c.moveTo(bx, by + y2 * cell + 0.5); c.lineTo(bx + bw, by + y2 * cell + 0.5); c.stroke(); }
      var sh = c.createLinearGradient(bx, 0, bx + bw * 0.25, 0); // боковая тень
      sh.addColorStop(0, 'rgba(0,0,0,.35)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = sh; c.fillRect(bx, by, bw * 0.25, bh);
      var gl = c.createLinearGradient(bx, by, bx + bw, by + bh * 0.4); // стекло
      gl.addColorStop(0, 'rgba(255,255,255,.06)'); gl.addColorStop(0.5, 'rgba(255,255,255,0)');
      c.fillStyle = gl; c.fillRect(bx, by, bw, bh);
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; rrect(c, bx - 4.5, by - 4.5, bw + 9, bh + 9, 5.5); c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeRect(bx - 0.5, by - 0.5, bw + 1, bh + 1);
    }
    function panelBox(c, x, y, w, h, on) {
      var g = c.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, on ? 'rgba(139,92,246,.22)' : 'rgba(255,255,255,.04)'); g.addColorStop(1, 'rgba(15,12,41,.6)');
      rrect(c, x, y, w, h, Math.min(10, cell * 0.4)); c.fillStyle = g; c.fill();
      c.strokeStyle = on ? 'rgba(167,139,250,.55)' : 'rgba(255,255,255,.12)'; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(x + 6, y + 1.5, w - 12, 1);
    }

    function label(c, txt, val, y) {
      c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '700 ' + Math.round(cell * 0.5) + 'px system-ui, sans-serif';
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText(txt, panelX + 4, y);
      c.fillStyle = '#fff'; c.font = '900 ' + Math.round(cell * 0.9) + 'px system-ui, sans-serif';
      c.fillText(val, panelX + 4, y + cell * 0.6);
    }

    var keys = {};

    var self = {
      reset: function () {
        layout();
        board = []; for (var r = 0; r < ROWS; r++) { board.push([]); for (var c = 0; c < COLS; c++) board[r].push(null); }
        D = DIFF[api.diff];
        for (var gr = 0; gr < D.garbage; gr++) {
          var row = board[ROWS - 1 - gr], hole = Math.floor(Math.random() * COLS);
          for (var gc = 0; gc < COLS; gc++) row[gc] = gc === hole ? null : 'G';
        }
        rain = [];
        for (var rn = 0; rn < 14; rn++) rain.push({ x: Math.random(), y: Math.random(), v: 0.02 + Math.random() * 0.05, k: 'IJLOSTZ'[rn % 7], s: 0.5 + Math.random() * 0.8 });
        bag = []; next = fromBag(); lines = 0; level = D.start; soft = false; clearing = null; clearT = 0;
        das = { left: 0, right: 0 }; keys = {}; t = 0; flashes = []; parts = []; gameEnded = false;
        cur = null; hold = null; canHold = true; combo = 0; b2b = false;
        spawn();
      },
      resize: function () { layout(); },
      idle: function (dt) { t += dt; },
      key: function (k, down) {
        keys[k] = down;
        if (gameEnded) return;
        if (!down) { if (k === 'down') soft = false; return; }
        if (k === 'left') { move(-1); das.left = 0.17; }
        else if (k === 'right') { move(1); das.right = 0.17; }
        else if (k === 'down') soft = true;
        else if (k === 'a' || k === 'up') rot();
        else if (k === 'b') hardDrop();
      },
      input: function (type, d) {
        if (gameEnded || !cur) return;
        if (type === 'tap' && d.x >= panelX) { doHold(); return; }
        if (type === 'tap') rot();
        else if (type === 'swipe') {
          if (d.dir === 'left' || d.dir === 'right') {
            var n = Math.max(1, Math.round(Math.abs(d.dx) / cell)), s = d.dir === 'left' ? -1 : 1;
            for (var i = 0; i < n; i++) if (!move(s)) break;
          } else if (d.dir === 'down') hardDrop();
          else if (d.dir === 'up') rot();
        }
      },
      update: function (dt) {
        t += dt;
        for (var i = flashes.length - 1; i >= 0; i--) { flashes[i].life -= dt; if (flashes[i].life <= 0) flashes.splice(i, 1); }
        for (var j = parts.length - 1; j >= 0; j--) {
          var p = parts[j]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.life -= dt;
          if (p.life <= 0) parts.splice(j, 1);
        }
        if (gameEnded) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (clearing) {
          clearT -= dt;
          if (clearT <= 0) {
            clearing.forEach(function (row) {
              board.splice(row, 1);
              var e = []; for (var c = 0; c < COLS; c++) e.push(null);
              board.unshift(e);
            });
            lines += clearing.length;
            var nl = D.start + Math.floor(lines / 10);
            if (nl > level) { api.toast(api.t('toast.level', nl)); api.sound('life'); }
            level = nl;
            clearing = null;
            spawn();
          }
          return;
        }
        if (!cur) return;
        // автоповтор сдвига
        ['left', 'right'].forEach(function (k) {
          if (!keys[k]) return;
          das[k] -= dt;
          while (das[k] <= 0) { move(k === 'left' ? -1 : 1); das[k] += 0.05; }
        });
        if (!cur) return;
        var g = soft ? Math.min(0.035, gravity()) : gravity();
        if (collide(cur, 0, 1)) {
          lockT += dt;
          if (lockT >= 0.5) lock();
        } else {
          fallT += dt;
          while (fallT >= g && cur && !collide(cur, 0, 1)) {
            fallT -= g; cur.y++; lockT = 0;
            if (soft) api.addScore(1);
          }
          if (fallT >= g) fallT = 0;
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        if (!wellOff || wellKey !== W + 'x' + H + ':' + cell) buildWell();
        c.drawImage(wellOff, 0, 0, W, H);
        // фон: медленно падающие полупрозрачные фигуры
        rain.forEach(function (r) {
          r.y += r.v / 60; if (r.y > 1.1) { r.y = -0.1; r.x = Math.random(); }
          var m = SHAPES[r.k], sz = cell * r.s;
          for (var yy = 0; yy < m.length; yy++) for (var xx = 0; xx < m.length; xx++) if (m[yy][xx]) {
            var rx0 = r.x * W + xx * sz, ry0 = r.y * H + yy * sz;
            if (rx0 + sz > bx - 6 && rx0 < bx + COLS * cell + 6 && ry0 + sz > by - 6 && ry0 < by + ROWS * cell + 6) continue;
            block(c, rx0, ry0, sz, COLORS[r.k], 0.07);
          }
        });
        c.globalAlpha = 1;
        var bw = COLS * cell, bh = ROWS * cell;

        for (var r = 0; r < ROWS; r++) for (var cc = 0; cc < COLS; cc++) {
          var v = board[r][cc];
          if (!v) continue;
          if (clearing && clearing.indexOf(r) >= 0) {
            var k = clearT / 0.3;
            block(c, bx + cc * cell, by + r * cell, cell, Math.floor(t * 20) % 2 ? '#ffffff' : COLORS[v], k);
            if (cc === 0) { c.globalAlpha = k * 0.6; c.fillStyle = '#fff'; c.fillRect(bx, by + r * cell + cell * 0.5 * (1 - k), bw, cell * k); c.globalAlpha = 1; }
          } else block(c, bx + cc * cell, by + r * cell, cell, gameEnded ? '#6b7280' : COLORS[v]);
        }
        // следы жёсткого сброса
        for (var f = 0; f < flashes.length; f++) {
          var fl = flashes[f], a = fl.life / 0.25;
          var gr = c.createLinearGradient(0, by + fl.y0 * cell, 0, by + (fl.y1 + 1) * cell);
          gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, fl.c);
          c.globalAlpha = a * 0.5; c.fillStyle = gr;
          c.fillRect(bx + fl.x * cell, by + Math.max(0, fl.y0) * cell, cell, (fl.y1 - Math.max(0, fl.y0) + 1) * cell);
          c.globalAlpha = 1;
        }
        if (cur) {
          // тень
          var gy = ghostY();
          for (var py = 0; py < cur.m.length; py++) for (var px = 0; px < cur.m.length; px++) {
            if (!D.ghost || !cur.m[py][px] || gy + py < 0) continue;
            var gx0 = bx + (cur.x + px) * cell + 2, gy0 = by + (gy + py) * cell + 2;
            c.fillStyle = COLORS[cur.type]; c.globalAlpha = 0.14;
            rrect(c, gx0, gy0, cell - 4, cell - 4, cell * 0.14); c.fill();
            c.strokeStyle = COLORS[cur.type]; c.globalAlpha = 0.6; c.lineWidth = 1.5; c.stroke();
            c.globalAlpha = 1;
          }
          for (var qy = 0; qy < cur.m.length; qy++) for (var qx = 0; qx < cur.m.length; qx++) {
            if (!cur.m[qy][qx] || cur.y + qy < 0) continue;
            block(c, bx + (cur.x + qx) * cell, by + (cur.y + qy) * cell, cell, COLORS[cur.type]);
          }
        }
        // боковая панель
        var nx = panelX, ny = by;
        c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '700 ' + Math.round(cell * 0.5) + 'px system-ui, sans-serif';
        c.textAlign = 'left'; c.textBaseline = 'top';
        c.fillText(api.t('tetris.next'), nx + 4, ny);
        var boxS = cell * 4.2;
        panelBox(c, nx, ny + cell * 0.7, boxS, boxS * 0.8, true);
        var nm = SHAPES[next], ms = cell * 0.8;
        var minX = 9, maxX = -1, minY = 9, maxY = -1;
        for (var a1 = 0; a1 < nm.length; a1++) for (var b1 = 0; b1 < nm.length; b1++) if (nm[a1][b1]) {
          minX = Math.min(minX, b1); maxX = Math.max(maxX, b1); minY = Math.min(minY, a1); maxY = Math.max(maxY, a1);
        }
        var ow = (maxX - minX + 1) * ms, oh = (maxY - minY + 1) * ms;
        var sx = nx + (boxS - ow) / 2, sy = ny + cell * 0.7 + (boxS * 0.8 - oh) / 2;
        for (var a2 = 0; a2 < nm.length; a2++) for (var b2 = 0; b2 < nm.length; b2++) if (nm[a2][b2]) {
          block(c, sx + (b2 - minX) * ms, sy + (a2 - minY) * ms, ms, COLORS[next]);
        }
        var ly = ny + cell * 0.7 + boxS * 0.8 + cell * 0.8;
        label(c, api.t('tetris.level'), String(level), ly);
        label(c, api.t('tetris.lines'), String(lines), ly + cell * 2.2);
        label(c, api.t('tetris.score'), String(api.getScore()), ly + cell * 4.4);
        // полоска прогресса до следующего уровня
        var pr = (lines % 10) / 10, pw2 = cell * 4;
        var ph = Math.max(4, cell * 0.25);
        rrect(c, panelX + 4, ly + cell * 6.8, pw2, ph, ph / 2); c.fillStyle = 'rgba(255,255,255,.1)'; c.fill();
        var pg = c.createLinearGradient(panelX, 0, panelX + pw2, 0); pg.addColorStop(0, '#8b5cf6'); pg.addColorStop(1, '#22d3ee');
        if (pr > 0) { rrect(c, panelX + 4, ly + cell * 6.8, Math.max(ph, pw2 * pr), ph, ph / 2); c.fillStyle = pg; c.fill(); }
        // удержание
        holdY = ly + cell * 7.5;
        c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '700 ' + Math.round(cell * 0.5) + 'px system-ui, sans-serif';
        c.fillText(api.t('tetris.hold'), nx + 4, holdY);
        panelBox(c, nx, holdY + cell * 0.7, boxS, boxS * 0.8, canHold);
        if (hold) {
          var hm = SHAPES[hold], hx0 = 9, hx1 = -1, hy0 = 9, hy1 = -1;
          for (var h1 = 0; h1 < hm.length; h1++) for (var h2 = 0; h2 < hm.length; h2++) if (hm[h1][h2]) { hx0 = Math.min(hx0, h2); hx1 = Math.max(hx1, h2); hy0 = Math.min(hy0, h1); hy1 = Math.max(hy1, h1); }
          var hsx = nx + (boxS - (hx1 - hx0 + 1) * ms) / 2, hsy = holdY + cell * 0.7 + (boxS * 0.8 - (hy1 - hy0 + 1) * ms) / 2;
          for (var h3 = 0; h3 < hm.length; h3++) for (var h4 = 0; h4 < hm.length; h4++) if (hm[h3][h4]) block(c, hsx + (h4 - hx0) * ms, hsy + (h3 - hy0) * ms, ms, COLORS[hold], canHold ? 1 : 0.4);
        } else {
          c.fillStyle = 'rgba(255,255,255,.3)'; c.font = '700 ' + Math.round(cell * 0.4) + 'px system-ui, sans-serif'; c.textAlign = 'center';
          c.fillText(api.t('tetris.holdTap'), nx + boxS / 2, holdY + cell * 0.7 + boxS * 0.35); c.textAlign = 'left';
        }
        if (combo > 1) { c.fillStyle = '#f472b6'; c.font = '900 ' + Math.round(cell * 0.6) + 'px system-ui, sans-serif'; c.fillText(api.t('tetris.combo', combo - 1), nx + 4, holdY + cell * 4.3); }
        // частицы
        for (var q = 0; q < parts.length; q++) {
          var pp = parts[q];
          c.globalAlpha = Math.max(0, pp.life / 0.7);
          c.drawImage(sprite(pp.c, cell * 0.3), pp.x - cell * 0.15, pp.y - cell * 0.15, cell * 0.3, cell * 0.3);
        }
        c.globalAlpha = 1;
      }
    };
    return self;
  }
};
