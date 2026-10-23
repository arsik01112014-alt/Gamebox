/* Пакман */
window.GAMES = window.GAMES || {};
window.GAMES.pacman = {
  title: 'Пакман',
  colors: ['#eab308', '#1d4ed8'],
  controls: 'dpad',
  liveSwipe: true,
  icon: '<svg viewBox="0 0 100 100"><defs><radialGradient id="pmY" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fef9c3"/><stop offset=".5" stop-color="#facc15"/><stop offset="1" stop-color="#ca8a04"/></radialGradient><linearGradient id="pmG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fca5a5"/><stop offset=".5" stop-color="#ef4444"/><stop offset="1" stop-color="#991b1b"/></linearGradient></defs><rect x="4" y="4" width="92" height="92" rx="18" fill="#060b2e"/><rect x="9" y="9" width="82" height="82" rx="14" fill="none" stroke="#3b82f6" stroke-width="2.5" opacity=".9"/><rect x="9" y="9" width="82" height="82" rx="14" fill="none" stroke="#60a5fa" stroke-width="7" opacity=".18"/><path d="M32 50 L56 36 A26 26 0 1 0 56 64 Z" fill="url(#pmY)"/><circle cx="29" cy="37" r="3.5" fill="#111"/><circle cx="28" cy="36" r="1.2" fill="#fff"/><circle cx="64" cy="50" r="3.5" fill="#fed7aa"/><circle cx="78" cy="50" r="5" fill="#fdba74" opacity=".35"/><circle cx="78" cy="50" r="3.5" fill="#fed7aa"/><path d="M62 84 v-14 a12 12 0 0 1 24 0 v14 l-4 -4 -4 4 -4 -4 -4 4 -4 -4z" fill="url(#pmG)"/><ellipse cx="69" cy="69" rx="3.4" ry="4" fill="#fff"/><ellipse cx="79" cy="69" rx="3.4" ry="4" fill="#fff"/><circle cx="70" cy="70" r="1.8" fill="#1d4ed8"/><circle cx="80" cy="70" r="1.8" fill="#1d4ed8"/></svg>',

  create: function (api) {
    var MAZE = [
      '###################',
      '#........#........#',
      '#o##.###.#.###.##o#',
      '#.................#',
      '#.##.#.#####.#.##.#',
      '#....#...#...#....#',
      '####.### # ###.####',
      '   #.#       #.#   ',
      '####.# ##-## #.####',
      '    .  #   #  .    ',
      '####.# ##### #.####',
      '   #.#       #.#   ',
      '####.# ##### #.####',
      '#........#........#',
      '#.##.###.#.###.##.#',
      '#o.#.....P.....#.o#',
      '##.#.#.#####.#.#.##',
      '#....#...#...#....#',
      '#.######.#.######.#',
      '#.................#',
      '###################'
    ];
    // v2.0: второй лабиринт (чередуется по уровням) и бонусные фрукты
    var MAZE2 = [
      '###################',
      '#o.......#.......o#',
      '#.##.###.#.###.##.#',
      '#.##...........##.#',
      '#....#..###..#....#',
      '####.#.......#.####',
      '####.### # ###.####',
      '   #.#       #.#   ',
      '####.# ##-## #.####',
      '    .  #   #  .    ',
      '####.# ##### #.####',
      '   #.#       #.#   ',
      '####.# ##### #.####',
      '#.................#',
      '#.###.#.#.#.#.###.#',
      '#o..#.#..P..#.#..o#',
      '###.#.#.###.#.#.###',
      '#.....#.....#.....#',
      '#.#######.#######.#',
      '#.................#',
      '###################'
    ];
    var MAZES = [MAZE, MAZE2], fruit = null, fruitN = 0;
    var FRUITS = [['🍒', 100], ['🍓', 300], ['🍊', 500], ['🍎', 700], ['🍈', 1000], ['🍇', 2000], ['🔔', 3000], ['🔑', 5000]];
    var COLS = 19, ROWS = 21, TUN = 9;
    var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    var DIFF = [
      { ghosts: 2, gs: 0.78, fright: 9, lives: 4 },
      { ghosts: 4, gs: 0.9, fright: 6, lives: 3 },
      { ghosts: 4, gs: 1.0, fright: 4, lives: 3 },
      { ghosts: 4, gs: 1.1, fright: 2.5, lives: 2 }
    ];
    var GH = [
      { name: 'blinky', col: '#ef4444', start: [9, 7], corner: [18, -2], rel: 0 },
      { name: 'pinky', col: '#f9a8d4', start: [9, 9], corner: [0, -2], rel: 1.5 },
      { name: 'inky', col: '#22d3ee', start: [8, 9], corner: [18, 22], rel: 5 },
      { name: 'clyde', col: '#fb923c', start: [10, 9], corner: [0, 22], rel: 9 }
    ];
    var D, dots, dotsLeft, pac, ghosts, want, ts, ox, oy, level, lives, phase, phaseT, frightT, eatChain, modeT, scatter, t, wallCv, popups, flash;

    function cellCh(x, y) {
      if (y < 0 || y >= ROWS) return '#';
      if (x < 0 || x >= COLS) return y === TUN ? ' ' : '#';
      return MAZE[y][x];
    }
    function open(x, y, ghost) {
      var ch = cellCh(x, y);
      if (ch === '#') return false;
      if (ch === '-') return !!ghost;
      return true;
    }
    function layout() {
      ts = Math.floor(Math.min((api.W - 8) / COLS, (api.H - 40) / ROWS));
      ox = Math.floor((api.W - ts * COLS) / 2);
      oy = Math.floor(34 + (api.H - 34 - ts * ROWS) / 2);
      bgKey = '';
      buildWalls();
    }
    function buildWalls() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      wallCv = document.createElement('canvas');
      wallCv.width = Math.ceil(COLS * ts * dpr); wallCv.height = Math.ceil(ROWS * ts * dpr);
      var c = wallCv.getContext('2d'); c.scale(dpr, dpr);
      function wall(x, y) { return cellCh(x, y) === '#' && x >= 0 && x < COLS; }
      var wg = c.createLinearGradient(0, 0, 0, ROWS * ts);
      wg.addColorStop(0, '#16308f'); wg.addColorStop(1, '#0c1d66');
      c.fillStyle = wg;
      for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) if (wall(x, y)) c.fillRect(x * ts, y * ts, ts, ts);
      // узор внутри стен
      c.fillStyle = 'rgba(96,165,250,.10)';
      for (var y3 = 0; y3 < ROWS; y3++) for (var x3 = 0; x3 < COLS; x3++) if (wall(x3, y3) && wall(x3 + 1, y3) && wall(x3, y3 + 1)) c.fillRect((x3 + 1) * ts - 1, (y3 + 1) * ts - 1, 2, 2);
      function edges() {
        c.beginPath();
        for (var y2 = 0; y2 < ROWS; y2++) for (var x2 = 0; x2 < COLS; x2++) {
          if (!wall(x2, y2)) continue;
          var X = x2 * ts, Y = y2 * ts, i = ts * 0.12;
          if (!wall(x2, y2 - 1) && y2 > 0) { c.moveTo(X, Y + i); c.lineTo(X + ts, Y + i); }
          if (!wall(x2, y2 + 1) && y2 < ROWS - 1) { c.moveTo(X, Y + ts - i); c.lineTo(X + ts, Y + ts - i); }
          if (!wall(x2 - 1, y2) && x2 > 0) { c.moveTo(X + i, Y); c.lineTo(X + i, Y + ts); }
          if (!wall(x2 + 1, y2) && x2 < COLS - 1) { c.moveTo(X + ts - i, Y); c.lineTo(X + ts - i, Y + ts); }
        }
      }
      c.lineCap = 'round'; c.lineJoin = 'round';
      // широкий мягкий ореол
      edges(); c.strokeStyle = 'rgba(59,130,246,.22)'; c.lineWidth = Math.max(5, ts * 0.42); c.stroke();
      c.strokeStyle = '#2563eb'; c.lineWidth = Math.max(2.5, ts * 0.18);
      c.shadowColor = '#60a5fa'; c.shadowBlur = ts * 0.6;
      c.stroke(); c.shadowBlur = 0;
      // светлая сердцевина
      c.strokeStyle = '#93c5fd'; c.lineWidth = Math.max(1, ts * 0.06); c.stroke();
      c.fillStyle = '#f9a8d4'; c.shadowColor = '#f472b6'; c.shadowBlur = ts * 0.5; c.fillRect(9 * ts, 8 * ts + ts * 0.4, ts, ts * 0.2); c.shadowBlur = 0; // дверь
      buildSprites();
    }
    // v3: спрайты точек и фон
    var dotCv, pwrCv, bgCv, bgKey = '';
    function mk(w, h) {
      var dpr = Math.min(window.devicePixelRatio || 1, 2), o = document.createElement('canvas');
      o.width = Math.max(1, Math.ceil(w * dpr)); o.height = Math.max(1, Math.ceil(h * dpr));
      var oc = o.getContext('2d'); oc.scale(dpr, dpr); return { cv: o, c: oc };
    }
    function buildSprites() {
      var S = ts, m = mk(S, S), o = m.c, g;
      g = o.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * 0.3);
      g.addColorStop(0, 'rgba(254,215,170,.45)'); g.addColorStop(1, 'rgba(253,186,116,0)');
      o.fillStyle = g; o.fillRect(0, 0, S, S);
      g = o.createRadialGradient(S / 2 - S * 0.03, S / 2 - S * 0.03, 0, S / 2, S / 2, S * 0.1);
      g.addColorStop(0, '#fff7ed'); g.addColorStop(1, '#fdba74');
      o.fillStyle = g; o.beginPath(); o.arc(S / 2, S / 2, S * 0.1, 0, 6.283); o.fill();
      dotCv = m.cv;
      var P = ts * 2, m2 = mk(P, P), q = m2.c;
      g = q.createRadialGradient(P / 2, P / 2, 0, P / 2, P / 2, P / 2);
      g.addColorStop(0, 'rgba(253,186,116,.65)'); g.addColorStop(0.35, 'rgba(253,186,116,.25)'); g.addColorStop(1, 'rgba(253,186,116,0)');
      q.fillStyle = g; q.fillRect(0, 0, P, P);
      g = q.createRadialGradient(P / 2 - ts * 0.1, P / 2 - ts * 0.1, 0, P / 2, P / 2, ts * 0.3);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#fed7aa'); g.addColorStop(1, '#fb923c');
      q.fillStyle = g; q.beginPath(); q.arc(P / 2, P / 2, ts * 0.3, 0, 6.283); q.fill();
      pwrCv = m2.cv;
    }
    function buildBg() {
      var W = api.W, H = api.H, m = mk(W, H), o = m.c;
      bgKey = W + 'x' + H;
      o.fillStyle = '#020617'; o.fillRect(0, 0, W, H);
      var g = o.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * 0.7);
      g.addColorStop(0, 'rgba(30,58,138,.22)'); g.addColorStop(0.6, 'rgba(15,23,80,.1)'); g.addColorStop(1, 'rgba(2,6,23,0)');
      o.fillStyle = g; o.fillRect(0, 0, W, H);
      o.fillStyle = 'rgba(148,163,255,.07)';
      for (var y = 6; y < H; y += 14) for (var x = (y / 14 % 2) * 7 + 4; x < W; x += 14) o.fillRect(x, y, 1.2, 1.2);
      // рамка лабиринта
      o.strokeStyle = 'rgba(96,165,250,.18)'; o.lineWidth = 1;
      o.strokeRect(ox - 3.5, oy - 3.5, COLS * ts + 7, ROWS * ts + 7);
      var v = o.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)');
      o.fillStyle = v; o.fillRect(0, 0, W, H);
      bgCv = m.cv;
    }
    function placeActors() {
      pac = { from: [9, 15], to: [9, 15], p: 0, dir: null, face: [-1, 0], mouth: 0 };
      want = 'left';
      ghosts = [];
      for (var i = 0; i < D.ghosts; i++) {
        var g = GH[i];
        ghosts.push({ g: g, from: g.start.slice(), to: g.start.slice(), p: 0, dir: [0, -1], mode: i === 0 ? 'out' : 'house',
          rel: g.rel * (api.diff === 0 ? 1.5 : 1) / (1 + (level - 1) * 0.2), path: null, bob: Math.random() * 6 });
      }
      frightT = 0; modeT = 0; scatter = true; eatChain = 0;
    }
    function pos(e) { return [e.from[0] + (e.to[0] - e.from[0]) * e.p, e.from[1] + (e.to[1] - e.from[1]) * e.p]; }
    function wrapTile(tl) {
      if (tl[0] < -1) tl[0] = COLS - 1; else if (tl[0] > COLS) tl[0] = 0;
      if (tl[0] === -1) return [COLS, tl[1]];
      if (tl[0] === COLS) return [-1, tl[1]];
      return null;
    }
    // общий шаг по сетке; choose(e) возвращает следующий вектор направления или null
    function advance(e, speed, dt, choose, ghost) {
      e.p += speed * dt;
      var guard = 0;
      while (e.p >= 1 && guard++ < 4) {
        e.p -= 1;
        e.from = e.to.slice();
        var w = wrapTile(e.from);
        if (w) e.from = w;
        var d = choose(e);
        if (!d) { e.to = e.from.slice(); e.p = 0; e.dir = null; return; }
        e.dir = d;
        e.to = [e.from[0] + d[0], e.from[1] + d[1]];
      }
    }
    function pacChoose(e) {
      var x = e.from[0], y = e.from[1];
      eatAt(x, y);
      var wd = DIRS[want];
      if (wd && open(x + wd[0], y + wd[1])) { e.face = wd; return wd; }
      if (e.dir && open(x + e.dir[0], y + e.dir[1])) return e.dir;
      return null;
    }
    function eatAt(x, y) {
      if (x < 0 || x >= COLS) return;
      var k = y * COLS + x;
      if (!dots[k]) return;
      if (dots[k] === 2) {
        api.addScore(50); frightT = Math.max(1.5, D.fright - (level - 1) * 0.5); eatChain = 0;
        ghosts.forEach(function (g) { if (g.mode === 'chase') { g.mode = 'fright'; if (g.dir) { var tmp = g.from; g.from = g.to; g.to = tmp; g.p = 1 - g.p; g.dir = [-g.dir[0], -g.dir[1]]; } } });
        api.sound('bonus'); api.vibrate(30);
      } else { api.addScore(10); if (dotsLeft % 2) api.sound('move'); }
      dots[k] = 0; dotsLeft--;
      var eaten = totalDots - dotsLeft;
      if ((eaten === 70 || eaten === 160) && !fruit) { var fd = FRUITS[Math.min(FRUITS.length - 1, level - 1)]; fruit = { x: 9, y: 11, e: fd[0], pts: fd[1], life: 9.5 }; }
      if (dotsLeft <= 0) { phase = 'clear'; phaseT = 0; api.sound('win'); api.vibrate(80); }
    }
    function pacTile() { var p = pos(pac); return [Math.round(p[0]), Math.round(p[1])]; }
    function targetOf(g) {
      var pt = pacTile(), f = pac.face || [0, 0];
      if (g.mode === 'eaten') return [9, 7];
      if (scatter) return g.g.corner;
      switch (g.g.name) {
        case 'blinky': return pt;
        case 'pinky': return [pt[0] + f[0] * 4, pt[1] + f[1] * 4];
        case 'inky':
          var b = ghosts[0] ? pos(ghosts[0]) : pt, ax = pt[0] + f[0] * 2, ay = pt[1] + f[1] * 2;
          return [ax * 2 - b[0], ay * 2 - b[1]];
        default:
          var gp = pos(g);
          return Math.hypot(gp[0] - pt[0], gp[1] - pt[1]) > 8 ? pt : g.g.corner;
      }
    }
    function ghostChoose(e) {
      if (e.path && e.path.length) return e.path.shift();
      var x = e.from[0], y = e.from[1];
      if (e.mode === 'eaten' && x === 9 && y === 7) { e.path = [[0, 1], [0, 1]]; e.reviving = true; return e.path.shift(); }
      if (e.reviving) { e.reviving = false; e.mode = 'house'; e.rel = 0.6; return null; }
      var opts = [], dirs = [[0, -1], [-1, 0], [0, 1], [1, 0]];
      for (var i = 0; i < 4; i++) {
        var d = dirs[i];
        if (e.dir && d[0] === -e.dir[0] && d[1] === -e.dir[1]) continue;
        var nx = x + d[0], ny = y + d[1];
        if (!open(nx, ny, false)) continue;
        if (cellCh(nx, ny) === '-') continue;
        opts.push(d);
      }
      if (!opts.length) return e.dir ? [-e.dir[0], -e.dir[1]] : null;
      if (e.mode === 'fright') return opts[Math.floor(Math.random() * opts.length)];
      var tg = targetOf(e), bestD = 1e9, best = opts[0];
      opts.forEach(function (d) {
        var dd = Math.pow(x + d[0] - tg[0], 2) + Math.pow(y + d[1] - tg[1], 2);
        if (dd < bestD) { bestD = dd; best = d; }
      });
      return best;
    }
    function ghostSpeed(g) {
      var p = pos(g), base = 7.2 * D.gs * (1 + (level - 1) * 0.04);
      if (g.mode === 'eaten') return 15;
      if (g.mode === 'fright') return 4.2;
      if (p[1] === TUN && (p[0] < 3 || p[0] > COLS - 4)) return base * 0.55;
      return base;
    }
    function die() {
      phase = 'dying'; phaseT = 0;
      api.sound('hit'); api.vibrate(250);
    }

    function drawPac(c, x, y, r, face, mouth) {
      var ang = Math.atan2(face[1], face[0]);
      var m = mouth;
      var g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
      g.addColorStop(0, '#fef9c3'); g.addColorStop(0.45, '#facc15'); g.addColorStop(1, '#ca8a04');
      c.fillStyle = g;
      c.save(); if (api.quality > 0) { c.shadowColor = '#fde047'; c.shadowBlur = r * 0.9; }
      c.beginPath(); c.moveTo(x, y); c.arc(x, y, r, ang + m, ang + 6.283 - m); c.closePath(); c.fill(); c.restore();
      c.strokeStyle = 'rgba(161,98,7,.6)'; c.lineWidth = Math.max(0.8, r * 0.08);
      c.beginPath(); c.arc(x, y, r * 0.96, ang + m, ang + 6.283 - m); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(x - r * 0.32, y - r * 0.45, r * 0.24, r * 0.14, -0.6, 0, 6.283); c.fill();
      if (m < 2.8) {
        var ex = x + Math.cos(ang - 1.3) * r * 0.5, ey = y + Math.sin(ang - 1.3) * r * 0.5;
        c.fillStyle = '#111'; c.beginPath(); c.arc(ex, ey, r * 0.14, 0, 6.283); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(ex - r * 0.04, ey - r * 0.05, r * 0.05, 0, 6.283); c.fill();
      }
    }
    function drawGhost(c, g, x, y, r) {
      var fr = g.mode === 'fright', eaten = g.mode === 'eaten';
      var flashOn = fr && frightT < 1.6 && Math.floor(t * 8) % 2;
      if (!eaten) {
        var body = fr ? (flashOn ? '#f8fafc' : '#2563eb') : g.g.col;
        c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x, y + r * 1.0, r * 0.75, r * 0.16, 0, 0, 6.283); c.fill();
        if (api.quality > 1) { c.save(); c.globalAlpha = 0.28; c.fillStyle = body; c.beginPath(); c.arc(x, y, r * 1.45, 0, 6.283); c.fill(); c.restore(); }
        c.fillStyle = body;
        c.beginPath();
        c.arc(x, y - r * 0.1, r, Math.PI, 0);
        var by = y + r * 0.85, w = r * 2, n = 4, ph = Math.floor(t * 8) % 2 ? 0 : 1;
        c.lineTo(x + r, by);
        for (var i = 0; i < n; i++) {
          var x1 = x + r - (i + 0.5) * w / n, x2 = x + r - (i + 1) * w / n;
          c.lineTo(x1, by - r * (i % 2 === ph ? 0.3 : 0.05)); c.lineTo(x2, by);
        }
        c.closePath(); c.fill();
        var sh = c.createLinearGradient(x - r, 0, x + r, 0);
        sh.addColorStop(0, 'rgba(255,255,255,.18)'); sh.addColorStop(0.45, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.32)');
        c.fillStyle = sh; c.fill();
        c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(x - r * 0.4, y - r * 0.55, r * 0.25, r * 0.15, -0.5, 0, 6.283); c.fill();
      }
      if (fr && !eaten) {
        c.fillStyle = flashOn ? '#ef4444' : '#fde68a';
        c.fillRect(x - r * 0.45, y - r * 0.35, r * 0.22, r * 0.22); c.fillRect(x + r * 0.23, y - r * 0.35, r * 0.22, r * 0.22);
        c.strokeStyle = c.fillStyle; c.lineWidth = Math.max(1.2, r * 0.12);
        c.beginPath(); c.moveTo(x - r * 0.6, y + r * 0.35);
        for (var k = 0; k < 6; k++) c.lineTo(x - r * 0.6 + (k + 1) * r * 0.2, y + r * (k % 2 ? 0.35 : 0.2));
        c.stroke();
        return;
      }
      var d = g.dir || [0, 0];
      for (var s = -1; s <= 1; s += 2) {
        var ex = x + s * r * 0.38, ey = y - r * 0.25;
        c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ex, ey, r * 0.28, r * 0.34, 0, 0, 6.283); c.fill();
        c.fillStyle = '#1e3a8a'; c.beginPath(); c.arc(ex + d[0] * r * 0.13, ey + d[1] * r * 0.15, r * 0.15, 0, 6.283); c.fill();
        c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(ex + d[0] * r * 0.13 - r * 0.05, ey + d[1] * r * 0.15 - r * 0.06, r * 0.05, 0, 6.283); c.fill();
      }
    }

    var totalDots = 0;
    function startLevel() {
      MAZE = MAZES[(level - 1) % MAZES.length]; buildWalls(); fruit = null;
      dots = []; dotsLeft = 0;
      for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) {
        var ch = MAZE[y][x], v = ch === '.' ? 1 : ch === 'o' ? 2 : 0;
        dots.push(v); if (v) dotsLeft++;
      }
      totalDots = dotsLeft;
      placeActors();
      phase = 'ready'; phaseT = 0;
    }

    return {
      reset: function () {
        D = DIFF[api.diff]; level = 1; lives = D.lives; t = 0; popups = []; flash = 0;
        layout(); startLevel();
      },
      resize: layout,
      idle: function (dt) { t += dt; },
      begin: function () { phase = 'ready'; phaseT = 0; },
      key: function (k, down) { if (down && DIRS[k]) want = k; },
      input: function (type, d) { if (type === 'swipe') want = d.dir; },
      update: function (dt) {
        t += dt;
        popups = popups.filter(function (p) { p.life -= dt; p.y -= dt * 0.8; return p.life > 0; });
        phaseT += dt;
        if (phase === 'ready') { if (phaseT > 1.4) phase = 'play'; return; }
        if (phase === 'dying') {
          if (phaseT > 1.6) {
            lives--;
            if (lives <= 0) { phase = 'over'; api.gameOver(); return; }
            placeActors(); phase = 'ready'; phaseT = 0;
          }
          return;
        }
        if (phase === 'clear') {
          flash = phaseT;
          if (phaseT > 2) { level++; api.toast(api.t('toast.level', level)); startLevel(); flash = 0; }
          return;
        }
        if (phase !== 'play') return;
        // режимы разбегания/погони
        if (frightT > 0) {
          frightT -= dt;
          if (frightT <= 0) ghosts.forEach(function (g) { if (g.mode === 'fright') g.mode = 'chase'; });
        } else {
          modeT += dt;
          if (scatter && modeT > 7) { scatter = false; modeT = 0; }
          else if (!scatter && modeT > 20) { scatter = true; modeT = 0; }
        }
        // пакман
        var reverse = DIRS[want];
        if (pac.dir && reverse && reverse[0] === -pac.dir[0] && reverse[1] === -pac.dir[1]) {
          var tmp = pac.from; pac.from = pac.to; pac.to = tmp; pac.p = 1 - pac.p; pac.dir = reverse; pac.face = reverse;
        }
        if (!pac.dir) { pac.p = 1; }
        advance(pac, 7.6 * (1 + (level - 1) * 0.02), dt, pacChoose);
        if (fruit) {
          fruit.life -= dt;
          var pt0 = pos(pac);
          if (Math.abs(pt0[0] - fruit.x) < 0.6 && Math.abs(pt0[1] - fruit.y) < 0.6) {
            api.addScore(fruit.pts); api.sound('coin'); api.vibrate(30); fruitN++;
            popups.push({ x: fruit.x, y: fruit.y, text: String(fruit.pts), life: 1.2 });
            api.fx.burst(ox + (fruit.x + 0.5) * ts, oy + (fruit.y + 0.5) * ts, '#f472b6', 14, 160);
            fruit = null;
          } else if (fruit.life <= 0) fruit = null;
        }
        if (pac.dir) pac.mouth += dt * 14;
        // призраки
        ghosts.forEach(function (g) {
          if (g.mode === 'house') {
            g.bob += dt * 5; g.rel -= dt;
            if (g.rel <= 0) {
              g.mode = 'leaving';
              var hx = g.from[0], path = [];
              if (hx !== 9) path.push([9 - hx > 0 ? 1 : -1, 0]);
              path.push([0, -1], [0, -1]);
              g.path = path; g.to = g.from.slice(); g.p = 1;
            }
            return;
          }
          if (g.mode === 'leaving' && !g.path.length && g.p >= 1) { g.mode = frightT > 0 ? 'chase' : 'chase'; }
          if (g.mode === 'leaving' && g.path.length === 0 && g.from[1] <= 7) g.mode = 'chase';
          if (g.mode === 'out') { g.mode = 'chase'; g.p = 1; }
          advance(g, g.mode === 'leaving' ? 4 : ghostSpeed(g), dt, ghostChoose, true);
        });
        // столкновения
        var pp = pos(pac);
        for (var i = 0; i < ghosts.length; i++) {
          var g = ghosts[i];
          if (g.mode === 'house' || g.mode === 'eaten' || g.mode === 'leaving') continue;
          var gp = pos(g);
          if (Math.abs(gp[0] - pp[0]) < 0.6 && Math.abs(gp[1] - pp[1]) < 0.6) {
            if (g.mode === 'fright') {
              eatChain++;
              var pts = 200 * Math.pow(2, eatChain - 1);
              api.addScore(pts); api.sound('coin'); api.vibrate(40);
              popups.push({ x: gp[0], y: gp[1], text: String(pts), life: 0.9 });
              g.mode = 'eaten'; g.path = null;
            } else { die(); return; }
          }
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        if (!bgCv || bgKey !== W + 'x' + H) buildBg();
        c.drawImage(bgCv, 0, 0, W, H);
        if (flash > 0 && Math.floor(flash * 6) % 2) c.globalAlpha = 0.35;
        c.drawImage(wallCv, ox, oy, COLS * ts, ROWS * ts);
        c.globalAlpha = 1;
        // точки
        for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) {
          var v = dots[y * COLS + x];
          if (!v) continue;
          var cx = ox + (x + 0.5) * ts, cy = oy + (y + 0.5) * ts;
          if (v === 1) c.drawImage(dotCv, cx - ts / 2, cy - ts / 2, ts, ts);
          else {
            var pk = phase !== 'play' ? 1 : 0.8 + 0.25 * Math.sin(t * 8);
            c.drawImage(pwrCv, cx - ts * pk, cy - ts * pk, ts * 2 * pk, ts * 2 * pk);
          }
        }
        if (fruit && (fruit.life > 2 || Math.floor(t * 8) % 2)) {
          c.font = Math.round(ts * 0.95) + 'px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(fruit.e, ox + (fruit.x + 0.5) * ts, oy + (fruit.y + 0.5) * ts + Math.sin(t * 4) * ts * 0.06);
        }
        c.save();
        c.beginPath(); c.rect(ox, oy - ts, COLS * ts, (ROWS + 2) * ts); c.clip();
        // призраки
        if (phase !== 'dying' || phaseT < 0.5) ghosts.forEach(function (g) {
          var p = pos(g), bob = g.mode === 'house' ? Math.sin(g.bob) * 0.2 : 0;
          drawGhost(c, g, ox + (p[0] + 0.5) * ts, oy + (p[1] + 0.5 + bob) * ts, ts * 0.46);
        });
        // пакман
        var pp = pos(pac), mouth;
        if (phase === 'dying') mouth = Math.min(3.14, 0.25 + phaseT * 2.2);
        else mouth = 0.08 + Math.abs(Math.sin(pac.mouth)) * 0.55;
        if (!(phase === 'dying' && phaseT > 1.4)) drawPac(c, ox + (pp[0] + 0.5) * ts, oy + (pp[1] + 0.5) * ts, ts * 0.46, phase === 'dying' ? [0, -1] : pac.face, mouth);
        c.restore();
        popups.forEach(function (p) {
          c.fillStyle = '#22d3ee'; c.font = '900 ' + Math.round(ts * 0.6) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(p.text, ox + (p.x + 0.5) * ts, oy + (p.y + 0.5) * ts);
        });
        // HUD
        for (var l = 0; l < lives; l++) drawPac(c, 16 + l * 22, 17, 8, [1, 0], 0.5);
        c.fillStyle = '#93c5fd'; c.font = '800 14px system-ui, sans-serif'; c.textAlign = 'right'; c.textBaseline = 'middle';
        c.fillText(api.t('tetris.level') + ' ' + level, W - 12, 17);
        if (phase === 'ready') {
          c.fillStyle = '#facc15'; c.font = '900 ' + Math.round(ts * 0.9) + 'px system-ui, sans-serif'; c.textAlign = 'center';
          c.fillText(api.t('pacman.ready'), ox + COLS * ts / 2, oy + 11.5 * ts);
        }
      }
    };
  }
};
