/* Сокобан: толкай ящики на отметки склада */
window.GAMES = window.GAMES || {};
window.GAMES.sokoban = {
  title: 'Сокобан',
  desc: 'Расставь ящики по отметкам склада',
  hint: 'Свайп или крестовина — шаг кладовщика. Тап по полу — пройти туда. Ящики можно только толкать, не тянуть. Поставь все ящики на светящиеся отметки. Чем ближе к норме ходов, тем больше звёзд и очков. ↶ — отмена хода, ⟲ — заново, ⏭ — пропустить уровень, ⚑ — завершить.',
  d0: 'Обучение: 1–2 ящика, маленькие склады',
  d1: '2–3 ящика, запас ходов ×3',
  d2: '3–4 ящика, запас ходов ×2,5',
  d3: '4–5 ящиков, лимит ходов ×2, 1 пропуск',
  colors: ['#d97706', '#78350f'],
  controls: 'dpad',
  cat: 'puzzle',
  isNew4: true,
  medals: [1000, 2600, 5000],
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="sokobanBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f3a36"/><stop offset="1" stop-color="#1c1917"/></linearGradient>' +
    '<linearGradient id="sokobanW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0b45a"/><stop offset="1" stop-color="#b86f22"/></linearGradient>' +
    '<radialGradient id="sokobanT" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fde68a"/><stop offset=".6" stop-color="#f59e0b" stop-opacity=".6"/><stop offset="1" stop-color="#f59e0b" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="sokobanH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde047"/><stop offset="1" stop-color="#ca8a04"/></linearGradient></defs>' +
    '<rect x="4" y="4" width="92" height="92" rx="18" fill="url(#sokobanBg)"/>' +
    '<g stroke="rgba(255,255,255,.07)" stroke-width="1"><path d="M4 30h92M4 56h92M4 82h92M30 4v92M56 4v92M82 4v92"/></g>' +
    '<rect x="6" y="6" width="22" height="22" rx="3" fill="#7c2d12"/><rect x="6" y="6" width="22" height="16" rx="3" fill="#b45309"/><rect x="72" y="6" width="22" height="22" rx="3" fill="#7c2d12"/><rect x="72" y="6" width="22" height="16" rx="3" fill="#b45309"/>' +
    '<circle cx="70" cy="72" r="18" fill="url(#sokobanT)"/><circle cx="70" cy="72" r="9" fill="none" stroke="#fbbf24" stroke-width="3"/>' +
    '<g transform="translate(40 34)"><rect x="0" y="0" width="34" height="34" rx="4" fill="#78350f"/><rect x="0" y="0" width="34" height="27" rx="4" fill="url(#sokobanW)"/>' +
    '<rect x="3" y="3" width="28" height="21" rx="2" fill="none" stroke="#7c4310" stroke-width="2.5"/><path d="M5 22L29 5" stroke="#7c4310" stroke-width="3"/><path d="M4 10h26M4 17h26" stroke="rgba(120,53,15,.35)" stroke-width="1"/>' +
    '<circle cx="6" cy="6" r="1.4" fill="#e7e5e4"/><circle cx="28" cy="6" r="1.4" fill="#e7e5e4"/><circle cx="6" cy="21" r="1.4" fill="#e7e5e4"/><circle cx="28" cy="21" r="1.4" fill="#e7e5e4"/></g>' +
    '<g transform="translate(14 46)"><ellipse cx="12" cy="40" rx="11" ry="4" fill="rgba(0,0,0,.4)"/><rect x="5" y="28" width="5" height="11" rx="2" fill="#1e3a8a"/><rect x="14" y="28" width="5" height="11" rx="2" fill="#1e3a8a"/>' +
    '<rect x="3" y="14" width="18" height="17" rx="5" fill="#2563eb"/><rect x="5" y="15" width="14" height="13" rx="3" fill="#f97316"/><path d="M5 20h14M5 24h14" stroke="#fef08a" stroke-width="1.6"/>' +
    '<rect x="19" y="17" width="10" height="5" rx="2.5" fill="#f2c094"/><circle cx="12" cy="9" r="7" fill="#f2c094"/><path d="M4 8a8 8 0 0 1 16 0z" fill="url(#sokobanH)"/><rect x="3" y="7" width="18" height="2.6" rx="1.3" fill="#eab308"/>' +
    '<circle cx="15" cy="11" r="1.1" fill="#292524"/></g></svg>',

  create: function (api) {
    // уровни сгенерированы обратными «вытягиваниями» и проверены решателем; второе число — оптимум ходов (норма)
    var LEVELS = [
      [['######|#    #|#    #|# $###|#.@#--|####--',12],
       ['####--|#  ###|#  $@#|#    #|## .##|-####-',14],
       ['--####|###@ #|# $$ #|#    #|#..  #|######',21],
       ['--#####|--#.. #|###   #|#     #|# $ $@#|#   ###|#####--',25],
       ['#####--|#  .###|#   $@#|#. #$ #|#    ##|######-',26],
       ['-#####-|-#   #-|-#   ##|###$$ #|#. @  #|#.    #|#######',28],
       ['--#####|###.  #|# @$  #|#   $##|###. #-|--####-',29],
       ['---####|---#  #|-### .#|##  $$#|#.   @#|#     #|#######',33],
       ['#####--|#   #--|# # ###|#. $  #|# @$. #|#######',39],
       ['---####|---#. #|-###  #|##    #|#@$  *#|#  #  #|#######',39]],
      [['-#######|##    .#|#     .#|#      #|##$ $ ##|-#@ ###-|-####---',25],
       ['######--|#    #--|#    #--|#    ###|#.  $  #|#  @*  #|########',26],
       ['---#####|---#  .#|-###   #|-# .$  #|##$ $+ #|#   #  #|#   ####|#####---',31],
       ['#####---|#  .#---|#   ####|# .    #|# $@$  #|#####  #|----####',34],
       ['--######|### @  #|#   $$ #|# .  # #|# .#   #|#  #####|####----',35],
       ['--####|-##. #|##  .#|#  $ #|#. $##|# $  #|##@  #|-#####',43],
       ['-######-|-#    ##|-#    .#|-##   .#|##  .  #|# $$ $ #|#  @####|#####---',43],
       ['######--|#  . ###|#  . . #|#  ##  #|# $ ## #|# $@$  #|##     #|-#######',63],
       ['-#######|##   . #|# $#.  #|#      #|# #$# .#|#  $@###|#    #--|######--',64],
       ['-#######|##    .#|#.$##  #|#   $ ##|#  ##  #|##$.   #|-#@    #|-#######',81]],
      [['----####-|-####  #-|-# @# $##|## $$   #|#.. #   #|#   #. ##|#  #####-|####-----',48],
       ['#########|#..     #|# .     #|# .#  $ #|# $  $$ #|###  @###|--#####--',48],
       ['-----####|---### .#|-###  $ #|##  $$$ #|#.   @  #|# #.   ##|# .   ##-|#######--',52],
       ['--####---|--# .##--|--#   ###|#### .. #|#  #@   #|#  $$$ ##|#  #  ##-|#     #--|#######--',55],
       ['-########|-#      #|-#     .#|##.  ## #|# .#  $ #|#  # $###|####$ #--|---#@ #--|---####--',63],
       ['--######-|### .  ##|#       #|#$  #.  #|#  ###  #|#.  $@$ #|#     ###|#######--',63],
       ['-#####---|-#  @###-|##$#$ .#-|#  #  .#-|# $#  ##-|# .#  ###|#       #|#####   #|----#####',66],
       ['--#######|--#   . #|###$## @#|#     $$#|#  $.# .#|#  #.#  #|#    ####|######---',83],
       ['--#####--|###.. #--|#     ##-|#    $@#-|#. ##$ ##|# $.  $ #|####    #|---######',83],
       ['#######-|#.    #-|#  .#$#-|#. ##@##|#    $ #|# $.$  #|###   ##|--#####-',87]],
      [['-####----|##. ####-|#    . #-|#.   $ #-|#.   $##-|####$ ###|---#  $@#|---#    #|---######',51],
       ['########--|#.     #--|# $$$..###|##@$ #   #|-### .   #|---#   ###|---#   #--|---#  ##--|---####---',55],
       ['-#####--|-#   #--|##   #--|# *$$##-|#@$   #-|### . ##|--#   .#|--## . #|---#####',60],
       ['########|#.   . #|# . ## #|# . #  #|##  $$ #|#    $ #|#    $@#|##  ####|-####---',60],
       ['--######-|###    ##|#  .   .#|#   ##  #|####   .#|#@$     #|# $ $ $ #|### . ###|--#####--',62],
       ['-####-----|-#@ #-----|##$ ######|#  ###  .#|# .###  .#|#   $.   #|#.  $$$ ##|###   ###-|--#####---',71],
       ['--####--|--#  ###|###.. .#|# $ $  #|# $$  ##|#  . ###|#. #$  #|#  #@  #|########',72],
       ['----######|----#  . #|#####    #|#  ##$  .#|# $##@   #|#  .$$  .#|#   #   ##|#########-',74],
       ['######--|#   .#--|#  $ ###|# #$...#|# $  $ #|## #$###|#   + #-|#     #-|#######-',99],
       ['-#######-|-# $ + #-|-# .$$$##|##. # $ #|#    .# #|# ##    #|#.    ###|##  ###--|-####----',116]]
    ];
    var DIRS = { up: [0, -1, 0], right: [1, 0, 1], down: [0, 1, 2], left: [-1, 0, 3] };
    var LIM = [4, 3, 2.5, 2], BASE = [100, 150, 200, 300], SKIPS = [3, 3, 2, 1];
    var lv, li, grid, cols, rows, targets, boxes, pl, moves, pushes, undos, hist, queue, state, stT, t, anim, walkPh, holdK, holdT;
    var parts, skips, levelScore, stars, stuckWarn, flashT, enterT, totalStars;
    var cs, bx, by, HUD = 58, BAR = 62;
    var dpr = 1, bgL = null, boardL = null, crateS = null, crateT = null, glowS = null, lw = 0, lh = 0;

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function seedRnd(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
    function mkC(w, h) {
      var o = document.createElement('canvas');
      o.width = Math.max(1, Math.ceil(w * dpr)); o.height = Math.max(1, Math.ceil(h * dpr));
      var x = o.getContext('2d'); x.scale(dpr, dpr); return o;
    }
    function rr(c, x, y, w, h, r) {
      r = Math.max(0, Math.min(r, w / 2, h / 2));
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }
    function cell(x, y) { return y < 0 || x < 0 || y >= rows || x >= cols ? '-' : grid[y][x]; }
    function isWall(x, y) { var c = cell(x, y); return c === '#' || c === '-'; }
    function boxAt(x, y) { for (var i = 0; i < boxes.length; i++) if (boxes[i].x === x && boxes[i].y === y) return i; return -1; }
    function isTarget(x, y) { return targets[y * cols + x] === 1; }

    // ---------- уровень ----------
    function loadLevel(i) {
      var set = LEVELS[api.diff];
      li = i; lv = set[i];
      var lines = lv[0].split('|');
      rows = lines.length; cols = 0;
      lines.forEach(function (l) { cols = Math.max(cols, l.length); });
      grid = []; targets = {}; boxes = [];
      for (var y = 0; y < rows; y++) {
        var row = [];
        for (var x = 0; x < cols; x++) {
          var ch = lines[y][x] || '-';
          if (ch === '.' || ch === '*' || ch === '+') targets[y * cols + x] = 1;
          if (ch === '$' || ch === '*') boxes.push({ x: x, y: y, fx: x, fy: y, ox: x, oy: y, on: ch === '*', glow: ch === '*' ? 1 : 0, stuck: false });
          if (ch === '@' || ch === '+') pl = { x: x, y: y, ox: x, oy: y, dir: 2, push: 0 };
          row.push(ch === '#' ? '#' : ch === '-' ? '-' : ' ');
        }
        grid.push(row);
      }
      moves = 0; pushes = 0; undos = 0; hist = []; queue = []; anim = 1; state = 'play'; stT = 0; stuckWarn = false; enterT = 0;
      layout();
    }
    function limit() { return Math.ceil(lv[1] * LIM[api.diff]) + 6; }
    function layout() {
      var aw = api.W - 20, ah = api.H - HUD - BAR - 14;
      cs = Math.floor(Math.min(aw / cols, ah / rows, 64));
      bx = Math.round((api.W - cs * cols) / 2); by = Math.round(HUD + 6 + (ah - cs * rows) / 2);
      build();
    }

    // ---------- пре-рендер ----------
    function build() {
      var W = api.W, H = api.H, c, g, i, x, y, r = seedRnd(7 + li * 13);
      dpr = Math.min(2, window.devicePixelRatio || 1); lw = W; lh = H;
      // фон: бетонный пол склада
      bgL = mkC(W, H); c = bgL.getContext('2d');
      g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a2622'); g.addColorStop(0.5, '#1f1c19'); g.addColorStop(1, '#141210');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      if (api.quality > 0) for (i = 0; i < W * H / 40; i++) { c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.12)'; c.fillRect(r() * W, r() * H, 1 + r() * 1.5, 1 + r() * 1.5); }
      c.strokeStyle = 'rgba(255,255,255,.035)'; c.lineWidth = 1;
      for (x = 0; x < W; x += 48) { c.beginPath(); c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, H); c.stroke(); }
      for (y = 0; y < H; y += 48) { c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(W, y + 0.5); c.stroke(); }
      // световые пятна от ламп
      for (i = 0; i < 3; i++) {
        var lx = W * (0.2 + i * 0.3), ly = H * 0.35 + (i % 2) * 60;
        g = c.createRadialGradient(lx, ly, 0, lx, ly, W * 0.45);
        g.addColorStop(0, 'rgba(255,214,150,.09)'); g.addColorStop(1, 'rgba(255,214,150,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
      }
      // жёлто-чёрные полосы безопасности вверху и внизу
      function hazard(y0, h) {
        c.save(); c.beginPath(); c.rect(0, y0, W, h); c.clip();
        c.fillStyle = '#facc15'; c.fillRect(0, y0, W, h);
        c.fillStyle = '#1c1917';
        for (var s = -h; s < W + h; s += 16) { c.beginPath(); c.moveTo(s, y0 + h); c.lineTo(s + 8, y0 + h); c.lineTo(s + 8 + h, y0); c.lineTo(s + h, y0); c.fill(); }
        c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, y0 + h - 1, W, 1); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(0, y0, W, 1);
        c.restore();
      }
      hazard(HUD - 5, 4); hazard(H - BAR + 1, 4);
      g = c.createLinearGradient(0, 0, 0, HUD - 5); g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,.1)');
      c.fillStyle = g; c.fillRect(0, 0, W, HUD - 5);
      g = c.createLinearGradient(0, H - BAR + 5, 0, H); g.addColorStop(0, 'rgba(0,0,0,.15)'); g.addColorStop(1, 'rgba(0,0,0,.45)');
      c.fillStyle = g; c.fillRect(0, H - BAR + 5, W, BAR);
      g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.5)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);

      // поле
      boardL = mkC(W, H); c = boardL.getContext('2d');
      var floorC = function (x, y) { var ch = cell(x, y); return ch === ' '; };
      // тень под полом
      c.save(); c.shadowColor = 'rgba(0,0,0,.7)'; c.shadowBlur = 18; c.shadowOffsetY = 8; c.fillStyle = '#000';
      for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) if (cell(x, y) !== '-') c.fillRect(bx + x * cs, by + y * cs, cs, cs);
      c.restore();
      for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) {
        if (!floorC(x, y)) continue;
        var px = bx + x * cs, py = by + y * cs, L = 40 + r() * 5;
        c.fillStyle = 'hsl(36,10%,' + L + '%)'; c.fillRect(px, py, cs, cs);
        g = c.createLinearGradient(px, py, px + cs, py + cs);
        g.addColorStop(0, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(0,0,0,.1)');
        c.fillStyle = g; c.fillRect(px, py, cs, cs);
        if (api.quality > 0) for (i = 0; i < cs * 0.8; i++) { c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.08)'; c.fillRect(px + r() * cs, py + r() * cs, 1, 1); }
        if (r() < 0.25) { // пятна масла / потёртости
          var sx = px + cs * (0.25 + r() * 0.5), sy = py + cs * (0.25 + r() * 0.5), sr = cs * (0.08 + r() * 0.16);
          g = c.createRadialGradient(sx, sy, 0, sx, sy, sr); g.addColorStop(0, 'rgba(30,25,20,.22)'); g.addColorStop(1, 'rgba(30,25,20,0)');
          c.fillStyle = g; c.beginPath(); c.arc(sx, sy, sr, 0, 6.283); c.fill();
        }
        if (r() < 0.12) { c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1; c.beginPath(); var cx0 = px + r() * cs, cy0 = py + r() * cs; c.moveTo(cx0, cy0); c.lineTo(cx0 + rnd(-1, 1) * cs * 0.3, cy0 + rnd(-1, 1) * cs * 0.3); c.lineTo(cx0 + rnd(-1, 1) * cs * 0.4, cy0 + rnd(-1, 1) * cs * 0.4); c.stroke(); }
        c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(px, py, cs, 1); c.fillRect(px, py, 1, cs);
        c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(px, py + cs - 1, cs, 1); c.fillRect(px + cs - 1, py, 1, cs);
        // отметка
        if (isTarget(x, y)) {
          var tx = px + cs / 2, ty = py + cs / 2, tr = cs * 0.3;
          c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.arc(tx, ty + 1, tr + 2, 0, 6.283); c.fill();
          c.save(); c.beginPath(); c.arc(tx, ty, tr, 0, 6.283); c.clip();
          c.fillStyle = '#facc15'; c.fillRect(tx - tr, ty - tr, tr * 2, tr * 2);
          c.fillStyle = '#292524';
          for (var s2 = -tr * 2; s2 < tr * 2; s2 += tr * 0.55) { c.beginPath(); c.moveTo(tx + s2, ty + tr); c.lineTo(tx + s2 + tr * 0.27, ty + tr); c.lineTo(tx + s2 + tr * 0.27 + tr * 2, ty - tr); c.lineTo(tx + s2 + tr * 2, ty - tr); c.fill(); }
          c.restore();
          c.fillStyle = '#3f3a36'; c.beginPath(); c.arc(tx, ty, tr * 0.56, 0, 6.283); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; c.beginPath(); c.arc(tx, ty, tr, 3.4, 5.6); c.stroke();
        }
      }
      // ambient occlusion от стен
      for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) {
        if (!floorC(x, y)) continue;
        var px2 = bx + x * cs, py2 = by + y * cs, ao = cs * 0.22;
        if (isWall(x, y - 1)) { g = c.createLinearGradient(0, py2, 0, py2 + ao * 1.4); g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(px2, py2, cs, ao * 1.4); }
        if (isWall(x - 1, y)) { g = c.createLinearGradient(px2, 0, px2 + ao, 0); g.addColorStop(0, 'rgba(0,0,0,.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(px2, py2, ao, cs); }
        if (isWall(x + 1, y)) { g = c.createLinearGradient(px2 + cs, 0, px2 + cs - ao, 0); g.addColorStop(0, 'rgba(0,0,0,.2)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(px2 + cs - ao, py2, ao, cs); }
      }
      // стены: кирпичные блоки с верхней гранью и фасадом
      var fh = Math.round(cs * 0.26);
      for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) {
        if (cell(x, y) !== '#') continue;
        var wx = bx + x * cs, wy = by + y * cs, below = cell(x, y + 1) === '#', topH = below ? cs : cs - fh;
        // верх
        g = c.createLinearGradient(0, wy, 0, wy + topH);
        g.addColorStop(0, '#8b5a44'); g.addColorStop(1, '#6d4434');
        c.fillStyle = g; c.fillRect(wx, wy, cs, topH);
        // кирпичная кладка
        c.strokeStyle = 'rgba(40,20,14,.55)'; c.lineWidth = 1;
        var bh = cs / 3;
        for (var br = 0; br < 3; br++) {
          var yy = wy + br * bh; if (yy >= wy + topH) break;
          c.beginPath(); c.moveTo(wx, yy + 0.5); c.lineTo(wx + cs, yy + 0.5); c.stroke();
          var off = ((br + x + y) % 2) * cs / 4;
          for (var bxx = off; bxx < cs; bxx += cs / 2) { c.beginPath(); c.moveTo(wx + bxx + 0.5, yy); c.lineTo(wx + bxx + 0.5, Math.min(yy + bh, wy + topH)); c.stroke(); }
          c.fillStyle = 'rgba(255,220,190,.07)'; c.fillRect(wx, yy + 1, cs, 1.5);
        }
        if (api.quality > 0) for (i = 0; i < cs * 0.6; i++) { c.fillStyle = r() < 0.5 ? 'rgba(255,230,210,.08)' : 'rgba(30,10,5,.15)'; c.fillRect(wx + r() * cs, wy + r() * topH, 1.5, 1.5); }
        // кромки
        if (!isWall(x, y - 1) || cell(x, y - 1) === '-') { c.fillStyle = 'rgba(255,225,200,.35)'; c.fillRect(wx, wy, cs, 2); }
        if (cell(x - 1, y) !== '#') { c.fillStyle = 'rgba(255,225,200,.18)'; c.fillRect(wx, wy, 2, topH); }
        if (cell(x + 1, y) !== '#') { c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(wx + cs - 2, wy, 2, topH); }
        if (!below) {
          // фасад
          g = c.createLinearGradient(0, wy + topH, 0, wy + cs);
          g.addColorStop(0, '#4a2a1f'); g.addColorStop(1, '#2e1913');
          c.fillStyle = g; c.fillRect(wx, wy + topH, cs, fh);
          c.fillStyle = 'rgba(255,200,170,.25)'; c.fillRect(wx, wy + topH, cs, 1);
          c.strokeStyle = 'rgba(0,0,0,.35)'; c.beginPath();
          var o2 = ((x + y) % 2) * cs / 4;
          for (var fx = o2; fx < cs; fx += cs / 2) { c.moveTo(wx + fx + 0.5, wy + topH); c.lineTo(wx + fx + 0.5, wy + cs); }
          c.stroke();
        }
      }
      // ящики
      crateS = crateSprite(false); crateT = crateSprite(true);
      // свечение отметки
      glowS = mkC(cs * 2, cs * 2); c = glowS.getContext('2d');
      g = c.createRadialGradient(cs, cs, 0, cs, cs, cs);
      g.addColorStop(0, 'rgba(255,230,120,.75)'); g.addColorStop(0.35, 'rgba(250,180,40,.35)'); g.addColorStop(1, 'rgba(250,160,20,0)');
      c.fillStyle = g; c.fillRect(0, 0, cs * 2, cs * 2);
    }
    function crateSprite(on) {
      var o = mkC(cs, cs * 1.2), c = o.getContext('2d'), m = cs * 0.07, w = cs - m * 2, fh = cs * 0.2, top = m - cs * 0.04, th = w - fh, g;
      // тень
      c.fillStyle = 'rgba(0,0,0,.35)'; rr(c, m + 2, top + 4, w, w + 1, 4); c.fill();
      // фасад
      g = c.createLinearGradient(0, top + th, 0, top + w);
      g.addColorStop(0, on ? '#7a4a1a' : '#81481a'); g.addColorStop(1, on ? '#4a2c10' : '#552d0e');
      c.fillStyle = g; rr(c, m, top, w, w, cs * 0.06); c.fill();
      // верх
      g = c.createLinearGradient(0, top, 0, top + th);
      g.addColorStop(0, on ? '#f7cf7a' : '#e9a957'); g.addColorStop(1, on ? '#d7a04c' : '#c07a32');
      c.fillStyle = g; rr(c, m, top, w, th, cs * 0.06); c.fill();
      // доски
      var fi = w * 0.12;
      c.strokeStyle = 'rgba(90,45,10,.45)'; c.lineWidth = 1;
      for (var i = 1; i < 4; i++) { var py = top + fi + (th - fi * 2) * i / 4; c.beginPath(); c.moveTo(m + fi, py + 0.5); c.lineTo(m + w - fi, py + 0.5); c.stroke(); }
      // волокна
      c.strokeStyle = 'rgba(120,60,15,.18)';
      for (i = 0; i < 10; i++) { var gy = top + fi + Math.random() * (th - fi * 2); c.beginPath(); c.moveTo(m + fi, gy); c.quadraticCurveTo(m + w / 2, gy + (Math.random() - 0.5) * 3, m + w - fi, gy + (Math.random() - 0.5) * 2); c.stroke(); }
      // рама
      c.lineWidth = fi; c.strokeStyle = on ? '#a86a26' : '#9a5a1f';
      rr(c, m + fi / 2, top + fi / 2, w - fi, th - fi, cs * 0.04); c.stroke();
      c.lineWidth = 1; c.strokeStyle = 'rgba(255,230,180,.45)'; rr(c, m + 0.5, top + 0.5, w - 1, th - 1, cs * 0.06); c.stroke();
      c.strokeStyle = 'rgba(60,30,8,.5)'; rr(c, m + fi, top + fi, w - fi * 2, th - fi * 2, 2); c.stroke();
      // диагональная распорка
      c.save(); c.beginPath(); c.rect(m + fi, top + fi, w - fi * 2, th - fi * 2); c.clip();
      c.strokeStyle = on ? '#a86a26' : '#9a5a1f'; c.lineWidth = fi * 0.95; c.beginPath(); c.moveTo(m + fi, top + th - fi); c.lineTo(m + w - fi, top + fi); c.stroke();
      c.strokeStyle = 'rgba(255,230,180,.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(m + fi, top + th - fi - fi * 0.45); c.lineTo(m + w - fi - fi * 0.45, top + fi); c.stroke();
      c.restore();
      // гвозди
      var nails = [[m + fi / 2, top + fi / 2], [m + w - fi / 2, top + fi / 2], [m + fi / 2, top + th - fi / 2], [m + w - fi / 2, top + th - fi / 2]];
      nails.forEach(function (p) {
        c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(p[0] + 0.5, p[1] + 0.6, Math.max(1.2, cs * 0.028), 0, 6.283); c.fill();
        c.fillStyle = '#d6d3d1'; c.beginPath(); c.arc(p[0], p[1], Math.max(1, cs * 0.025), 0, 6.283); c.fill();
      });
      // фасадные доски
      c.strokeStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.moveTo(m + 2, top + th + fh / 2); c.lineTo(m + w - 2, top + th + fh / 2); c.stroke();
      c.fillStyle = 'rgba(255,220,170,.2)'; c.fillRect(m + 2, top + th, w - 4, 1);
      if (on) {
        // зелёный индикатор «на месте»
        var cx = m + w / 2, cy = top + th + fh / 2;
        c.fillStyle = '#052e16'; rr(c, cx - w * 0.22, cy - 2.5, w * 0.44, 5, 2.5); c.fill();
        c.fillStyle = '#4ade80'; rr(c, cx - w * 0.2, cy - 1.6, w * 0.4, 3.2, 1.6); c.fill();
        c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(cx - w * 0.17, cy - 1.2, w * 0.2, 1);
      }
      return o;
    }

    // ---------- кладовщик ----------
    function drawWorker(c, x, y, s, dir, ph, push, moving) {
      var sw = moving ? Math.sin(ph) : 0, bob = moving ? Math.abs(Math.cos(ph)) * s * 0.03 : Math.sin(t * 2.4) * s * 0.01;
      c.save(); c.translate(x, y);
      // тень
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(0, s * 0.36, s * 0.26, s * 0.09, 0, 0, 6.283); c.fill();
      c.translate(0, -bob);
      var side = dir === 1 || dir === 3, back = dir === 0, fl = dir === 3 ? -1 : 1;
      if (side) c.scale(fl, 1);
      var skin = '#f2c094', suit = '#1d4ed8', suitD = '#1e3a8a', vest = '#f97316', hat = '#facc15';
      // ноги
      c.fillStyle = suitD;
      if (side) {
        c.save(); c.translate(-s * 0.02, s * 0.12); c.rotate(sw * 0.5); rr(c, -s * 0.055, 0, s * 0.11, s * 0.24, s * 0.04); c.fill(); c.fillStyle = '#292524'; rr(c, -s * 0.06, s * 0.2, s * 0.15, s * 0.07, s * 0.03); c.fill(); c.restore();
        c.fillStyle = suit;
        c.save(); c.translate(s * 0.02, s * 0.12); c.rotate(-sw * 0.5); rr(c, -s * 0.055, 0, s * 0.11, s * 0.24, s * 0.04); c.fill(); c.fillStyle = '#44403c'; rr(c, -s * 0.06, s * 0.2, s * 0.15, s * 0.07, s * 0.03); c.fill(); c.restore();
      } else {
        var l1 = sw * s * 0.05, l2 = -l1;
        rr(c, -s * 0.13, s * 0.1 + l1, s * 0.1, s * 0.22 - l1, s * 0.04); c.fill();
        rr(c, s * 0.03, s * 0.1 + l2, s * 0.1, s * 0.22 - l2, s * 0.04); c.fill();
        c.fillStyle = '#292524';
        rr(c, -s * 0.14, s * 0.28, s * 0.12, s * 0.06, s * 0.03); c.fill(); rr(c, s * 0.02, s * 0.28, s * 0.12, s * 0.06, s * 0.03); c.fill();
      }
      // руки (сзади)
      var armA = push ? -1.35 : sw * 0.6;
      function arm(ax, front) {
        c.save(); c.translate(ax, -s * 0.08); c.rotate(side ? armA * (front ? 1 : 0.8) : 0);
        c.fillStyle = front ? suit : suitD; rr(c, -s * 0.045, 0, s * 0.09, s * 0.2, s * 0.045); c.fill();
        c.fillStyle = skin; c.beginPath(); c.arc(0, s * 0.21, s * 0.045, 0, 6.283); c.fill();
        c.restore();
      }
      if (side) arm(-s * 0.03, false);
      else {
        var ay = push && !back ? -s * 0.06 : 0;
        c.fillStyle = suit;
        c.save(); c.translate(-s * 0.19, -s * 0.07 + ay); c.rotate(push ? (back ? 3.0 : 0.2) : 0.12 + sw * 0.1); rr(c, -s * 0.045, 0, s * 0.09, s * 0.19, s * 0.045); c.fill(); c.fillStyle = skin; c.beginPath(); c.arc(0, s * 0.2, s * 0.045, 0, 6.283); c.fill(); c.restore();
        c.fillStyle = suit;
        c.save(); c.translate(s * 0.19, -s * 0.07 + ay); c.rotate(push ? (back ? -3.0 : -0.2) : -0.12 - sw * 0.1); rr(c, -s * 0.045, 0, s * 0.09, s * 0.19, s * 0.045); c.fill(); c.fillStyle = skin; c.beginPath(); c.arc(0, s * 0.2, s * 0.045, 0, 6.283); c.fill(); c.restore();
      }
      // туловище
      var tw = side ? s * 0.26 : s * 0.34;
      c.fillStyle = suit; rr(c, -tw / 2, -s * 0.12, tw, s * 0.27, s * 0.08); c.fill();
      c.fillStyle = vest; rr(c, -tw / 2 + s * 0.02, -s * 0.11, tw - s * 0.04, s * 0.2, s * 0.06); c.fill();
      c.fillStyle = '#fef08a'; c.fillRect(-tw / 2 + s * 0.02, -s * 0.03, tw - s * 0.04, s * 0.025); c.fillRect(-tw / 2 + s * 0.02, s * 0.03, tw - s * 0.04, s * 0.025);
      c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(-tw / 2 + s * 0.04, -s * 0.1, s * 0.03, s * 0.17);
      if (!side && !back) { c.fillStyle = suitD; c.fillRect(-s * 0.015, -s * 0.11, s * 0.03, s * 0.19); }
      if (side) arm(s * 0.03, true);
      // голова
      var hy = -s * 0.22;
      c.fillStyle = skin; c.beginPath(); c.arc(side ? s * 0.02 : 0, hy, s * 0.13, 0, 6.283); c.fill();
      c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.arc(side ? s * 0.02 : 0, hy + s * 0.02, s * 0.12, 0.2, 2.9); c.fill();
      if (!back) {
        c.fillStyle = '#292524';
        if (side) { c.beginPath(); c.arc(s * 0.09, hy + s * 0.01, s * 0.022, 0, 6.283); c.fill(); }
        else {
          var blink = (t % 3.3) < 0.12;
          if (blink) { c.fillRect(-s * 0.07, hy + s * 0.01, s * 0.04, s * 0.012); c.fillRect(s * 0.03, hy + s * 0.01, s * 0.04, s * 0.012); }
          else { c.beginPath(); c.arc(-s * 0.05, hy + s * 0.015, s * 0.022, 0, 6.283); c.arc(s * 0.05, hy + s * 0.015, s * 0.022, 0, 6.283); c.fill(); }
          c.strokeStyle = '#9a3412'; c.lineWidth = Math.max(1, s * 0.018); c.beginPath(); c.arc(0, hy + s * 0.05, s * 0.035, 0.3, 2.84); c.stroke();
          c.fillStyle = 'rgba(244,114,114,.35)'; c.beginPath(); c.arc(-s * 0.085, hy + s * 0.05, s * 0.025, 0, 6.283); c.arc(s * 0.085, hy + s * 0.05, s * 0.025, 0, 6.283); c.fill();
        }
      }
      // каска
      c.fillStyle = hat;
      c.beginPath(); c.arc(side ? s * 0.01 : 0, hy - s * 0.03, s * 0.14, Math.PI, 0); c.closePath(); c.fill();
      c.fillStyle = '#eab308';
      if (side) rr(c, -s * 0.13, hy - s * 0.045, s * 0.31, s * 0.045, s * 0.02);
      else rr(c, -s * 0.17, hy - s * 0.045, s * 0.34, s * 0.045, s * 0.02);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-s * 0.04, hy - s * 0.12, s * 0.05, s * 0.025, -0.4, 0, 6.283); c.fill();
      c.fillStyle = '#ca8a04'; c.fillRect(-s * 0.012, hy - s * 0.17, s * 0.024, s * 0.13);
      c.restore();
    }

    // ---------- логика ----------
    function snapshot() { return { px: pl.x, py: pl.y, dir: pl.dir, b: boxes.map(function (b) { return [b.x, b.y]; }), m: moves, p: pushes }; }
    function settle() {
      boxes.forEach(function (b) { b.ox = b.x; b.oy = b.y; });
      pl.ox = pl.x; pl.oy = pl.y; anim = 1;
    }
    function tryMove(dx, dy, dc) {
      if (state !== 'play') return false;
      var nx = pl.x + dx, ny = pl.y + dy;
      pl.dir = dc;
      if (isWall(nx, ny)) { bump(); return false; }
      var bi = boxAt(nx, ny);
      if (bi >= 0) {
        var bx2 = nx + dx, by2 = ny + dy;
        if (isWall(bx2, by2) || boxAt(bx2, by2) >= 0) { bump(); return false; }
        hist.push(snapshot()); if (hist.length > 400) hist.shift();
        settle();
        var b = boxes[bi]; b.x = bx2; b.y = by2; pushes++;
        pl.push = 0.25;
        var on = isTarget(bx2, by2);
        if (on && !b.on) { api.tone(660, 0.08, 'triangle', 0.08); setTimeout(function () { api.tone(990, 0.12, 'triangle', 0.07); }, 70); sparkle(bx2, by2); }
        else { api.tone(140 + Math.random() * 30, 0.06, 'square', 0.04); dust(nx, ny, dx, dy); }
        b.on = on; b.stuck = !on && deadCorner(bx2, by2);
        if (b.stuck && !stuckWarn) { stuckWarn = true; api.toast(api.t('sokoban.stuck')); api.vibrate(30); }
      } else {
        hist.push(snapshot()); if (hist.length > 400) hist.shift();
        settle();
        api.tone(300 + (moves % 2) * 40, 0.025, 'triangle', 0.025);
      }
      pl.x = nx; pl.y = ny; moves++; anim = 0;
      api.vibrate(5);
      return true;
    }
    function deadCorner(x, y) {
      var v = isWall(x, y - 1) || isWall(x, y + 1), h = isWall(x - 1, y) || isWall(x + 1, y);
      return v && h;
    }
    function bump() { pl.bump = 0.15; api.tone(90, 0.05, 'sine', 0.05); queue = []; }
    function undo() {
      if (!hist.length || state !== 'play') { api.tone(200, 0.05, 'sine', 0.04); return; }
      var s = hist.pop();
      pl.x = s.px; pl.y = s.py; pl.dir = s.dir; moves = s.m; pushes = s.p;
      boxes.forEach(function (b, i) { b.x = s.b[i][0]; b.y = s.b[i][1]; b.on = isTarget(b.x, b.y); b.stuck = !b.on && deadCorner(b.x, b.y); });
      settle(); queue = []; undos++;
      api.sound('click');
    }
    function restart() {
      if (state !== 'play') return;
      if (!moves) return;
      var u = undos; loadLevel(li); undos = u + 1; enterT = 0.5; api.sound('rotate');
    }
    function solved() { for (var i = 0; i < boxes.length; i++) if (!boxes[i].on) return false; return true; }
    function checkEnd() {
      if (solved()) {
        state = 'win'; stT = 0;
        var par = lv[1];
        stars = moves <= par ? 3 : moves <= Math.ceil(par * 1.35) + 2 ? 2 : 1;
        levelScore = BASE[api.diff] * (stars + 1);
        totalStars += stars;
        api.addScore(levelScore);
        api.sound('win'); api.fx.confetti(70); api.vibrate(40);
        api.fx.text(api.W / 2, by + rows * cs / 2, '+' + levelScore, '#fde047');
        return;
      }
      if (moves >= limit()) { state = 'fail'; stT = 0; api.sound('over'); api.vibrate(80); api.fx.shake(6); }
    }
    function nextLevel() {
      if (li + 1 >= LEVELS[api.diff].length) {
        state = 'all'; stT = 0; var bonus = totalStars * 20 * (api.diff + 1);
        api.addScore(bonus); api.sound('bonus'); api.fx.confetti(140);
        return;
      }
      loadLevel(li + 1); enterT = 0.6; api.sound('move');
    }
    function skip() {
      if (state !== 'play') return;
      if (skips <= 0) { api.toast(api.t('sokoban.noSkip')); api.tone(160, 0.08, 'sine', 0.05); return; }
      skips--; api.toast(api.t('sokoban.skip'));
      nextLevel();
    }
    function finish() { if (state === 'play' || state === 'win') { state = 'end'; api.gameOver(); } }
    function pathTo(tx, ty) {
      if (isWall(tx, ty) || boxAt(tx, ty) >= 0) return null;
      var prev = {}, q = [[pl.x, pl.y]], k0 = pl.y * cols + pl.x; prev[k0] = -1;
      while (q.length) {
        var p = q.shift();
        if (p[0] === tx && p[1] === ty) {
          var out = [], k = ty * cols + tx;
          while (prev[k] !== -1) { out.unshift(prev[k][1]); k = prev[k][0]; }
          return out;
        }
        for (var d in DIRS) {
          var D = DIRS[d], nx = p[0] + D[0], ny = p[1] + D[1], nk = ny * cols + nx;
          if (prev[nk] !== undefined || isWall(nx, ny) || boxAt(nx, ny) >= 0) continue;
          prev[nk] = [p[1] * cols + p[0], d]; q.push([nx, ny]);
        }
      }
      return null;
    }

    // ---------- частицы ----------
    function dust(x, y, dx, dy) {
      if (api.quality === 0) return;
      var cx = bx + (x + 0.5) * cs, cy = by + (y + 0.8) * cs;
      for (var i = 0; i < 6; i++) parts.push({ x: cx + rnd(-cs * 0.3, cs * 0.3), y: cy, vx: -dx * rnd(10, 40) + rnd(-15, 15), vy: rnd(-25, -5), r: rnd(2, 4.5), life: rnd(0.35, 0.6), max: 0.6, c: 'rgba(200,185,160,', g: -20 });
    }
    function sparkle(x, y) {
      var cx = bx + (x + 0.5) * cs, cy = by + (y + 0.5) * cs;
      for (var i = 0; i < (api.quality ? 18 : 8); i++) { var a = rnd(0, 6.283), v = rnd(40, 130); parts.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rnd(1.5, 3), life: rnd(0.4, 0.8), max: 0.8, c: Math.random() < 0.5 ? 'rgba(253,224,71,' : 'rgba(134,239,172,', g: 120 }); }
    }

    // ---------- HUD ----------
    var BTN = ['undo', 'restart', 'skip', 'finish'];
    function btnPos(i) { var n = BTN.length, gap = Math.min(86, (api.W - 40) / n); return { x: api.W / 2 + (i - (n - 1) / 2) * gap, y: api.H - BAR / 2 + 3, r: 21 }; }
    var press = { k: -1, t: 0 };
    function icon(c, k, x, y) {
      c.strokeStyle = '#fff'; c.fillStyle = '#fff'; c.lineWidth = 2.6; c.lineCap = 'round'; c.lineJoin = 'round';
      if (k === 'undo') { c.beginPath(); c.arc(x + 1, y + 2, 7, -2.6, 1.6); c.stroke(); c.beginPath(); c.moveTo(x - 9, y - 5); c.lineTo(x - 5.5, y + 1.5); c.lineTo(x - 0.5, y - 4.5); c.closePath(); c.fill(); }
      else if (k === 'restart') { c.beginPath(); c.arc(x, y, 7.5, -1.2, 4.6); c.stroke(); c.beginPath(); c.moveTo(x + 1, y - 12); c.lineTo(x + 7, y - 7.5); c.lineTo(x + 0.5, y - 3.5); c.closePath(); c.fill(); }
      else if (k === 'skip') { c.beginPath(); c.moveTo(x - 8, y - 7); c.lineTo(x - 1, y); c.lineTo(x - 8, y + 7); c.closePath(); c.fill(); c.beginPath(); c.moveTo(x - 1, y - 7); c.lineTo(x + 6, y); c.lineTo(x - 1, y + 7); c.closePath(); c.fill(); c.fillRect(x + 6, y - 7, 2.6, 14); }
      else { c.beginPath(); c.moveTo(x - 6, y + 9); c.lineTo(x - 6, y - 9); c.stroke(); c.beginPath(); c.moveTo(x - 5, y - 9); c.lineTo(x + 8, y - 5); c.lineTo(x - 5, y - 1); c.closePath(); c.fill(); }
      c.lineCap = 'butt'; c.lineJoin = 'miter';
    }
    function pill(c, x, y, w, h, a) {
      var g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(255,255,255,' + (0.16 * a) + ')'); g.addColorStop(1, 'rgba(255,255,255,' + (0.05 * a) + ')');
      c.fillStyle = 'rgba(0,0,0,.35)'; rr(c, x, y + 2, w, h, h / 2); c.fill();
      c.fillStyle = g; rr(c, x, y, w, h, h / 2); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 1; c.stroke();
    }
    function star(c, x, y, r, fill) {
      c.beginPath();
      for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
      c.closePath(); c.fillStyle = fill; c.fill();
    }
    function drawHUD(c) {
      var W = api.W;
      c.textBaseline = 'middle';
      // уровень
      var lt = api.t('sokoban.level') + ' ' + (li + 1) + '/' + LEVELS[api.diff].length;
      c.font = '800 15px system-ui, sans-serif';
      var w1 = c.measureText(lt).width + 26;
      pill(c, 10, 10, w1, 34, 1);
      c.fillStyle = '#fde68a'; c.textAlign = 'left'; c.fillText(lt, 23, 28);
      // ходы
      var lim = limit(), left = lim - moves;
      var mt = api.t('memory.moves') + ' ' + moves, pt = api.t('sokoban.par') + ' ' + lv[1];
      c.font = '800 15px system-ui, sans-serif'; var wm = c.measureText(mt).width;
      c.font = '700 11px system-ui, sans-serif'; var wp = c.measureText(pt).width;
      var w2 = Math.max(wm, wp) + 28, x2 = W - 10 - w2;
      pill(c, x2, 6, w2, 42, 1);
      c.textAlign = 'center';
      c.font = '800 15px system-ui, sans-serif'; c.fillStyle = '#fff'; c.fillText(mt, x2 + w2 / 2, 21);
      c.font = '700 11px system-ui, sans-serif'; c.fillStyle = moves <= lv[1] ? '#86efac' : '#cbd5e1'; c.fillText(pt, x2 + w2 / 2, 37);
      // звёзды-прогноз и запас ходов
      var cx = (10 + w1 + x2) / 2;
      var sp = moves <= lv[1] ? 3 : moves <= Math.ceil(lv[1] * 1.35) + 2 ? 2 : 1;
      if (cx - 40 > 10 + w1) {
        for (var i = 0; i < 3; i++) star(c, cx - 16 + i * 16, 20, 7, i < sp ? '#facc15' : 'rgba(255,255,255,.18)');
        c.font = '700 11px system-ui, sans-serif'; c.fillStyle = left <= 10 ? (Math.sin(t * 8) > 0 ? '#f87171' : '#fca5a5') : 'rgba(255,255,255,.6)';
        c.fillText(api.t('sokoban.left') + ' ' + Math.max(0, left), cx, 38);
      }
      // кнопки
      for (i = 0; i < BTN.length; i++) {
        var p = btnPos(i), pr = press.k === i ? press.t : 0, dis = (BTN[i] === 'undo' && !hist.length) || (BTN[i] === 'skip' && skips <= 0) || (BTN[i] === 'restart' && !moves);
        c.save(); c.translate(p.x, p.y); var sc = 1 - pr * 0.6; c.scale(sc, sc);
        c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.arc(0, 3, p.r, 0, 6.283); c.fill();
        var g = c.createLinearGradient(0, -p.r, 0, p.r);
        var col = BTN[i] === 'finish' ? ['#f87171', '#b91c1c'] : BTN[i] === 'skip' ? ['#a78bfa', '#6d28d9'] : ['#fbbf24', '#c2410c'];
        if (dis) col = ['#57534e', '#292524'];
        g.addColorStop(0, col[0]); g.addColorStop(1, col[1]);
        c.fillStyle = g; c.beginPath(); c.arc(0, 0, p.r, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, p.r - 1, 3.5, 5.9); c.stroke();
        c.globalAlpha = dis ? 0.45 : 1; icon(c, BTN[i], 0, 0); c.globalAlpha = 1;
        if (BTN[i] === 'skip' && skips > 0) {
          c.fillStyle = '#fff'; c.beginPath(); c.arc(p.r * 0.72, -p.r * 0.72, 8, 0, 6.283); c.fill();
          c.fillStyle = '#6d28d9'; c.font = '900 11px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText(String(skips), p.r * 0.72, -p.r * 0.72 + 0.5);
        }
        c.restore();
      }
    }
    function drawBanner(c) {
      var W = api.W, H = api.H, k = Math.min(1, stT * 3), e = 1 - Math.pow(1 - k, 3);
      c.fillStyle = 'rgba(10,8,6,' + (0.55 * k) + ')'; c.fillRect(0, 0, W, H);
      var bw = Math.min(320, W - 40), bh = 190, x = (W - bw) / 2, y = H / 2 - bh / 2 + (1 - e) * 60;
      c.globalAlpha = k;
      c.fillStyle = 'rgba(0,0,0,.5)'; rr(c, x, y + 6, bw, bh, 22); c.fill();
      var g = c.createLinearGradient(0, y, 0, y + bh);
      var good = state !== 'fail';
      g.addColorStop(0, good ? '#3f2e1e' : '#3b1d1d'); g.addColorStop(1, good ? '#1f1710' : '#1c0d0d');
      c.fillStyle = g; rr(c, x, y, bw, bh, 22); c.fill();
      c.strokeStyle = good ? 'rgba(250,204,21,.6)' : 'rgba(248,113,113,.6)'; c.lineWidth = 2; c.stroke();
      // полоса безопасности сверху
      c.save(); rr(c, x, y, bw, bh, 22); c.clip(); c.fillStyle = good ? '#facc15' : '#ef4444'; c.fillRect(x, y, bw, 10);
      c.fillStyle = '#1c1917'; for (var s = x - 10; s < x + bw; s += 16) { c.beginPath(); c.moveTo(s, y + 10); c.lineTo(s + 8, y + 10); c.lineTo(s + 18, y); c.lineTo(s + 10, y); c.fill(); }
      c.restore();
      c.textAlign = 'center'; c.textBaseline = 'middle';
      var title = state === 'win' ? api.t('sokoban.clear') : state === 'all' ? api.t('sokoban.all') : api.t('sokoban.out');
      c.font = '900 22px system-ui, sans-serif'; c.fillStyle = good ? '#fde68a' : '#fca5a5'; c.fillText(title, W / 2, y + 42);
      if (good) {
        var ns = state === 'win' ? stars : 3;
        for (var i = 0; i < 3; i++) {
          var sk = Math.max(0, Math.min(1, (stT - 0.25 - i * 0.22) * 4)), sz = i === 1 ? 26 : 21;
          var pop = sk < 1 ? 0.4 + sk * 0.9 : 1 + Math.sin(t * 3 + i) * 0.04;
          star(c, W / 2 + (i - 1) * 56, y + 92 - (i === 1 ? 8 : 0), sz + 3, 'rgba(0,0,0,.35)');
          star(c, W / 2 + (i - 1) * 56, y + 90 - (i === 1 ? 8 : 0), (i < ns ? sz * pop : sz), i < ns && sk > 0 ? '#facc15' : 'rgba(255,255,255,.15)');
          if (i < ns && sk > 0) star(c, W / 2 + (i - 1) * 56 - sz * 0.15, y + 86 - (i === 1 ? 8 : 0), sz * 0.35 * pop, 'rgba(255,255,255,.55)');
        }
        c.font = '700 14px system-ui, sans-serif'; c.fillStyle = '#e7e5e4';
        if (state === 'win') c.fillText(api.t('memory.moves') + ': ' + moves + '  ·  ' + api.t('sokoban.par') + ': ' + lv[1] + '  ·  +' + levelScore, W / 2, y + 134);
        else c.fillText('★ ' + totalStars, W / 2, y + 134);
      } else {
        c.font = '700 14px system-ui, sans-serif'; c.fillStyle = '#e7e5e4';
        c.fillText(api.t('sokoban.par') + ': ' + lv[1] + '  ·  ' + api.t('memory.moves') + ': ' + moves, W / 2, y + 92);
      }
      if (stT > 0.9 && state !== 'end') { c.font = '700 13px system-ui, sans-serif'; c.fillStyle = 'rgba(255,255,255,' + (0.5 + Math.sin(t * 5) * 0.3) + ')'; c.fillText(api.t('sokoban.tapNext'), W / 2, y + 166); }
      c.globalAlpha = 1;
    }

    function doKey(k) {
      var D = DIRS[k]; if (!D) return;
      if (anim < 1 || queue.length) { if (queue.length < 2) queue.push(k); return; }
      tryMove(D[0], D[1], D[2]);
    }
    function advance() {
      if (state === 'win' && stT > 0.6) nextLevel();
      else if ((state === 'fail' || state === 'all') && stT > 0.8) { state = 'end'; api.gameOver(); }
    }

    if (window.__test) window.__test.sokoban = function () { return { li: li, pl: pl, boxes: boxes, state: state, moves: moves, lv: lv, anim: anim, queue: queue }; };
    return {
      reset: function () {
        parts = []; t = 0; walkPh = 0; holdK = null; holdT = 0; skips = SKIPS[api.diff]; totalStars = 0; flashT = 0;
        loadLevel(0); enterT = 0.6;
      },
      resize: layout,
      idle: function (dt) { t += dt; },
      key: function (k, down) {
        if (!down) { if (k === holdK) holdK = null; return; }
        if (state !== 'play') { if (k === 'a' || k === 'space') advance(); return; }
        if (DIRS[k]) { holdK = k; holdT = 0.28; queue = []; doKey(k); }
      },
      input: function (type, d) {
        if (type === 'down') {
          for (var i = 0; i < BTN.length; i++) { var p = btnPos(i), dx = d.x - p.x, dy = d.y - p.y; if (dx * dx + dy * dy < (p.r + 8) * (p.r + 8)) { press.k = i; press.t = 0.3; } }
          return;
        }
        if (type === 'tap') {
          if (state !== 'play') { advance(); return; }
          for (i = 0; i < BTN.length; i++) {
            p = btnPos(i); dx = d.x - p.x; dy = d.y - p.y;
            if (dx * dx + dy * dy < (p.r + 8) * (p.r + 8)) {
              var b = BTN[i];
              if (b === 'undo') undo(); else if (b === 'restart') restart(); else if (b === 'skip') skip(); else finish();
              return;
            }
          }
          var cx = Math.floor((d.x - bx) / cs), cy = Math.floor((d.y - by) / cs);
          if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return;
          // тап по соседнему ящику — толкнуть
          var ddx = cx - pl.x, ddy = cy - pl.y;
          if (Math.abs(ddx) + Math.abs(ddy) === 1 && boxAt(cx, cy) >= 0) { queue = []; doKey(ddx > 0 ? 'right' : ddx < 0 ? 'left' : ddy > 0 ? 'down' : 'up'); return; }
          var path = pathTo(cx, cy);
          if (path && path.length) { queue = path.slice(0, 60); api.sound('click'); }
          return;
        }
        if (type === 'swipe') {
          if (state !== 'play') return;
          if (d.y > api.H - BAR) return;
          queue = queue.slice(0, 1); doKey(d.dir);
        }
      },
      update: function (dt) {
        t += dt;
        if (press.t > 0) press.t = Math.max(0, press.t - dt * 2); else press.k = -1;
        if (enterT > 0) enterT = Math.max(0, enterT - dt);
        if (pl.bump > 0) pl.bump -= dt;
        if (pl.push > 0) pl.push -= dt;
        for (var i = parts.length - 1; i >= 0; i--) { var p = parts[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= 0.96; p.life -= dt; if (p.life <= 0) parts.splice(i, 1); }
        boxes.forEach(function (b) { b.glow += ((b.on ? 1 : 0) - b.glow) * Math.min(1, dt * 6); });
        if (state !== 'play') { stT += dt; if (state === 'win' && stT > 2.8) nextLevel(); return; }
        if (anim < 1) {
          anim = Math.min(1, anim + dt / 0.12); walkPh += dt * 22;
          if (anim >= 1) { settle(); checkEnd(); }
        } else if (queue.length) {
          var k = queue.shift(), D = DIRS[k];
          if (!tryMove(D[0], D[1], D[2])) queue = [];
        } else if (holdK) {
          holdT -= dt;
          if (holdT <= 0) { holdT = 0.13; doKey(holdK); }
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        if (!bgL || lw !== W || lh !== H) layout();
        c.drawImage(bgL, 0, 0, W, H);
        var ek = enterT > 0 ? enterT / 0.6 : 0, ox = ek * ek * W * 0.6;
        c.save(); c.globalAlpha = 1 - ek * 0.8; c.translate(ox, 0);
        c.drawImage(boardL, 0, 0, W, H);
        var e = anim < 1 ? 1 - (1 - anim) * (1 - anim) : 1;
        // свечение отметок
        var pulse = 0.55 + Math.sin(t * 3) * 0.2;
        c.globalCompositeOperation = 'lighter';
        for (var k in targets) {
          var tx = k % cols, ty = Math.floor(k / cols), bi = boxAt(tx, ty);
          c.globalAlpha = (bi >= 0 ? 0.25 + boxes[bi].glow * 0.5 : pulse) * (1 - ek * 0.8);
          c.drawImage(glowS, bx + tx * cs - cs / 2, by + ty * cs - cs / 2, cs * 2, cs * 2);
        }
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1 - ek * 0.8;
        // объекты по рядам (глубина)
        var items = [];
        boxes.forEach(function (b) { var fx = b.ox + (b.x - b.ox) * e, fy = b.oy + (b.y - b.oy) * e; items.push({ y: fy, b: b, x: fx }); });
        var pfx = pl.ox + (pl.x - pl.ox) * e, pfy = pl.oy + (pl.y - pl.oy) * e;
        if (pl.bump > 0) { var bd = [[0, -1], [1, 0], [0, 1], [-1, 0]][pl.dir], bk = Math.sin(pl.bump / 0.15 * Math.PI) * 0.08; pfx += bd[0] * bk; pfy += bd[1] * bk; }
        items.push({ y: pfy, p: true, x: pfx });
        items.sort(function (a, b) { return a.y - b.y; });
        items.forEach(function (it) {
          var px = bx + it.x * cs, py = by + it.y * cs;
          if (it.p) {
            var mv = anim < 1 || queue.length > 0;
            drawWorker(c, px + cs / 2, py + cs * 0.5, cs * 1.12, pl.dir, walkPh, pl.push > 0 || (anim < 1 && pushes && hist.length && boxMoving()), mv);
          } else {
            var b = it.b;
            c.drawImage(b.glow > 0.5 ? crateT : crateS, px, py - cs * 0.06, cs, cs * 1.2);
            if (b.glow > 0.02) {
              c.strokeStyle = 'rgba(74,222,128,' + (b.glow * (0.45 + Math.sin(t * 4) * 0.2)) + ')'; c.lineWidth = 2;
              rr(c, px + cs * 0.06, py + cs * 0.0, cs * 0.88, cs * 0.9, cs * 0.08); c.stroke();
            }
            if (b.stuck) {
              c.strokeStyle = 'rgba(239,68,68,' + (0.5 + Math.sin(t * 7) * 0.35) + ')'; c.lineWidth = 2.5;
              rr(c, px + cs * 0.06, py, cs * 0.88, cs * 0.9, cs * 0.08); c.stroke();
              c.fillStyle = '#ef4444'; c.beginPath(); c.arc(px + cs * 0.85, py + cs * 0.08, cs * 0.12, 0, 6.283); c.fill();
              c.fillStyle = '#fff'; c.font = '900 ' + Math.round(cs * 0.18) + 'px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', px + cs * 0.85, py + cs * 0.09);
            }
          }
        });
        // частицы
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i], a = Math.max(0, p.life / p.max);
          c.fillStyle = p.c + a.toFixed(2) + ')'; c.beginPath(); c.arc(p.x, p.y, p.r * (0.5 + a * 0.5), 0, 6.283); c.fill();
        }
        c.restore();
        drawHUD(c);
        if (state !== 'play' && state !== 'end') drawBanner(c);
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      }
    };
    function boxMoving() { for (var i = 0; i < boxes.length; i++) if (boxes[i].ox !== boxes[i].x || boxes[i].oy !== boxes[i].y) return true; return false; }
  }
};
