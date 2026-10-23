/* Танки */
window.GAMES = window.GAMES || {};
window.GAMES.tanks = {
  title: 'Танки',
  colors: ['#65a30d', '#3f6212'],
  controls: 'tank',
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="tkHull" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset=".5" stop-color="#facc15"/><stop offset="1" stop-color="#a16207"/></linearGradient>' +
    '<radialGradient id="tkTur" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#fef3c7"/><stop offset="1" stop-color="#ca8a04"/></radialGradient></defs>' +
    '<rect x="4" y="4" width="92" height="92" rx="16" fill="#26291c"/><path d="M4 70 Q30 60 50 72 T96 66 V96 H4z" fill="#1c1f15"/>' +
    '<g fill="#b45309"><rect x="8" y="8" width="16" height="8" rx="1"/><rect x="8" y="17" width="7" height="8" rx="1"/><rect x="16" y="17" width="8" height="8" rx="1"/><rect x="76" y="8" width="16" height="8" rx="1"/><rect x="76" y="17" width="8" height="8" rx="1"/><rect x="85" y="17" width="7" height="8" rx="1"/></g>' +
    '<rect x="22" y="32" width="14" height="52" rx="4" fill="#27272a"/><rect x="64" y="32" width="14" height="52" rx="4" fill="#27272a"/>' +
    '<path d="M24 38h10M24 46h10M24 54h10M24 62h10M24 70h10M24 78h10M66 38h10M66 46h10M66 54h10M66 62h10M66 70h10M66 78h10" stroke="#71717a" stroke-width="2.5"/>' +
    '<rect x="32" y="38" width="36" height="40" rx="6" fill="url(#tkHull)" stroke="#713f12" stroke-width="2"/>' +
    '<rect x="46" y="10" width="8" height="40" rx="2" fill="#a16207" stroke="#713f12" stroke-width="1.5"/><rect x="44" y="9" width="12" height="6" rx="2" fill="#713f12"/>' +
    '<circle cx="50" cy="58" r="12" fill="url(#tkTur)" stroke="#713f12" stroke-width="2"/><circle cx="54" cy="62" r="3" fill="#a16207"/></svg>',

  create: function (api) {
    var N = 26; // карта в полуклетках
    var DIFF = [
      { lives: 5, total: 10, field: 3, fire: 0.6, smart: 0.15 }, { lives: 3, total: 14, field: 4, fire: 1, smart: 0.3 },
      { lives: 3, total: 18, field: 4, fire: 1.4, smart: 0.5 }, { lives: 2, total: 20, field: 5, fire: 1.9, smart: 0.7 }
    ];
    var TYPES = {
      basic: { sp: 3.2, hp: 1, bs: 12, pts: 100, col: '#cbd5e1' }, fast: { sp: 5.2, hp: 1, bs: 12, pts: 200, col: '#93c5fd' },
      power: { sp: 3.4, hp: 1, bs: 20, pts: 300, col: '#fca5a5' }, armor: { sp: 2.5, hp: 4, bs: 13, pts: 400, col: '#86efac' },
      boss: { sp: 2.4, hp: 10, bs: 17, pts: 2500, col: '#c084fc' } // v2.0: босс на каждом 3-м уровне
    };
    var chainN = 0, chainT = 0; // v2.0: серия уничтожений
    var D, map, ts, ox, oy, player, enemies, bullets, booms, bonuses, keys, level, lives, toSpawn, spawnT, freezeT, shovelT, baseDead, phase, phaseT, t, kills, endT, lastDir;
    var DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

    function cell(x, y) { return x < 0 || y < 0 || x >= N || y >= N ? 'S' : map[y][x]; }
    function setCell(x, y, v) { if (x >= 0 && y >= 0 && x < N && y < N) map[y][x] = v; }
    function genMap() {
      map = []; for (var y = 0; y < N; y++) { map.push([]); for (var x = 0; x < N; x++) map[y].push(' '); }
      var seed = level * 97 + api.diff * 13;
      function R() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      for (var ty = 1; ty < 11; ty++) for (var tx = 0; tx < 7; tx++) {
        var r = R(), ch = r < 0.42 ? 'B' : r < 0.47 ? 'S' : r < 0.52 ? 'W' : r < 0.6 ? 'F' : ' ';
        if (ty <= 1 && (tx === 0 || tx === 6)) ch = ' ';
        var half = R();
        for (var dy = 0; dy < 2; dy++) for (var dx = 0; dx < 2; dx++) {
          if (ch === 'B' && half < 0.3 && dy === 0) continue; // полукирпич
          setCell(tx * 2 + dx, ty * 2 + dy, ch); setCell(N - 1 - (tx * 2 + dx), ty * 2 + dy, ch);
        }
      }
      // стартовые зоны и база
      for (var y2 = 22; y2 < N; y2++) for (var x2 = 0; x2 < N; x2++) setCell(x2, y2, ' ');
      for (var y3 = 0; y3 < 2; y3++) for (var x3 = 0; x3 < N; x3++) setCell(x3, y3, ' ');
      for (var k = 0; k < N; k += 4) if (k > 3 && k < 22) { setCell(k, 22, R() < 0.5 ? 'B' : ' '); setCell(k + 1, 22, map[22][k]); }
      baseWalls('B');
      setCell(12, 24, 'E'); setCell(13, 24, 'E'); setCell(12, 25, 'E'); setCell(13, 25, 'E');
      for (var cx = 8; cx < 10; cx++) for (var cy = 24; cy < 26; cy++) setCell(cx, cy, ' ');
    }
    function baseWalls(ch) {
      [[11, 23], [12, 23], [13, 23], [14, 23], [11, 24], [11, 25], [14, 24], [14, 25]].forEach(function (p) { setCell(p[0], p[1], ch); });
    }
    var SPR = null, sprKey = '';
    function layout() {
      ts = Math.floor(Math.min(api.W - 8, api.H - 40) / N);
      ox = Math.floor((api.W - ts * N) / 2); oy = Math.floor(34 + (api.H - 34 - ts * N) / 2);
      var key = api.W + 'x' + api.H + ':' + ts; if (key !== sprKey) { sprKey = key; buildSprites(); }
    }
    function mk(w, h) { var d = Math.min(2, window.devicePixelRatio || 1), cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w * d)); cv.height = Math.max(1, Math.ceil(h * d)); var x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); cv.x = x; return cv; }
    function buildSprites() {
      var W = api.W, H = api.H, seed = 21, i, F = ts * N;
      function R() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      SPR = {};
      // фон: металлическая рама и грунт поля
      var bg = mk(W, H), x = bg.x;
      var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#23251d'); g.addColorStop(1, '#141510');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (i = 0; i < 900; i++) { x.fillStyle = R() < 0.5 ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.12)'; x.fillRect(R() * W, R() * H, 2, 2); }
      x.fillStyle = 'rgba(0,0,0,.5)'; x.fillRect(ox - 6, oy - 4, F + 12, F + 12);
      var fg = x.createLinearGradient(ox - 6, 0, ox + F + 6, 0); fg.addColorStop(0, '#52525b'); fg.addColorStop(0.5, '#3f3f46'); fg.addColorStop(1, '#27272a');
      x.fillStyle = fg; x.fillRect(ox - 6, oy - 6, F + 12, F + 12);
      x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(ox - 6, oy - 6, F + 12, 1);
      x.fillStyle = '#a1a1aa';
      for (var rv = 0; rv < 4; rv++) { var rx = rv % 2 ? ox + F + 3 : ox - 3, ry = rv < 2 ? oy - 3 : oy + F + 3; x.beginPath(); x.arc(rx, ry, 1.6, 0, 6.283); x.fill(); }
      var gg = x.createRadialGradient(ox + F / 2, oy + F / 2, F * 0.1, ox + F / 2, oy + F / 2, F * 0.75); gg.addColorStop(0, '#2b2c22'); gg.addColorStop(1, '#17180f');
      x.fillStyle = gg; x.fillRect(ox, oy, F, F);
      for (i = 0; i < 2600; i++) { var v = R(); x.fillStyle = v < 0.45 ? 'rgba(255,240,200,.04)' : v < 0.9 ? 'rgba(0,0,0,.18)' : 'rgba(120,110,80,.12)'; x.fillRect(ox + R() * F, oy + R() * F, 1 + R() * 1.5, 1 + R() * 1.5); }
      x.strokeStyle = 'rgba(255,255,255,.025)'; x.lineWidth = 1;
      for (i = 2; i < N; i += 2) { x.beginPath(); x.moveTo(ox + i * ts + 0.5, oy); x.lineTo(ox + i * ts + 0.5, oy + F); x.moveTo(ox, oy + i * ts + 0.5); x.lineTo(ox + F, oy + i * ts + 0.5); x.stroke(); }
      x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 1.2; // трещины
      for (i = 0; i < 9; i++) { var cxp = ox + R() * F, cyp = oy + R() * F; x.beginPath(); x.moveTo(cxp, cyp); for (var sg = 0; sg < 4; sg++) { cxp += (R() - 0.5) * ts * 2; cyp += (R() - 0.5) * ts * 2; x.lineTo(cxp, cyp); } x.stroke(); }
      x.fillStyle = 'rgba(0,0,0,.14)'; // следы гусениц
      for (i = 0; i < 6; i++) { var tx = ox + Math.floor(R() * (N - 2)) * ts, vert = R() < 0.5; for (var tk = 0; tk < N * 2; tk += 1) { if (vert) { x.fillRect(tx + ts * 0.1, oy + tk * ts / 2, ts * 0.45, ts * 0.18); x.fillRect(tx + ts * 1.45, oy + tk * ts / 2, ts * 0.45, ts * 0.18); } else { x.fillRect(ox + tk * ts / 2, tx - ox + oy + ts * 0.1, ts * 0.18, ts * 0.45); x.fillRect(ox + tk * ts / 2, tx - ox + oy + ts * 1.45, ts * 0.18, ts * 0.45); } } }
      var vg = x.createRadialGradient(ox + F / 2, oy + F / 2, F * 0.35, ox + F / 2, oy + F / 2, F * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
      x.fillStyle = vg; x.fillRect(ox, oy, F, F);
      SPR.bg = bg;
      // кирпич (2 варианта сдвига)
      SPR.brick = [0, 1].map(function (par) {
        var cv = mk(ts, ts), b = cv.x;
        b.fillStyle = '#4a1d08'; b.fillRect(0, 0, ts, ts);
        var bw = ts / 2, bh = ts / 2;
        for (var row = 0; row < 2; row++) for (var col = -1; col < 2; col++) {
          var sx = col * bw + ((row + par) % 2 ? bw / 2 : 0), sy = row * bh;
          var bgr = b.createLinearGradient(0, sy, 0, sy + bh); bgr.addColorStop(0, '#e0782f'); bgr.addColorStop(0.5, '#c2581c'); bgr.addColorStop(1, '#8f3a0e');
          b.fillStyle = bgr; b.fillRect(sx + 0.7, sy + 0.7, bw - 1.4, bh - 1.4);
          b.fillStyle = 'rgba(255,220,180,.35)'; b.fillRect(sx + 0.7, sy + 0.7, bw - 1.4, 0.8);
          b.fillStyle = 'rgba(60,20,5,.3)'; for (var sp = 0; sp < 3; sp++) b.fillRect(sx + R() * bw, sy + R() * bh, 1, 1);
        }
        return cv;
      });
      // сталь
      var st = mk(ts, ts), q = st.x, sgr = q.createLinearGradient(0, 0, ts, ts); sgr.addColorStop(0, '#e4e4e7'); sgr.addColorStop(0.5, '#a1a1aa'); sgr.addColorStop(1, '#71717a');
      q.fillStyle = sgr; q.fillRect(0, 0, ts, ts);
      q.fillStyle = 'rgba(255,255,255,.6)'; q.fillRect(0, 0, ts, 1); q.fillRect(0, 0, 1, ts);
      q.fillStyle = 'rgba(0,0,0,.45)'; q.fillRect(0, ts - 1, ts, 1); q.fillRect(ts - 1, 0, 1, ts);
      q.fillStyle = 'rgba(255,255,255,.25)'; q.beginPath(); q.moveTo(ts * 0.15, ts); q.lineTo(ts * 0.55, 0); q.lineTo(ts * 0.75, 0); q.lineTo(ts * 0.35, ts); q.closePath(); q.fill();
      [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]].forEach(function (r) { q.fillStyle = '#52525b'; q.beginPath(); q.arc(ts * r[0], ts * r[1], ts * 0.09, 0, 6.283); q.fill(); q.fillStyle = '#f4f4f5'; q.beginPath(); q.arc(ts * r[0] - ts * 0.03, ts * r[1] - ts * 0.03, ts * 0.04, 0, 6.283); q.fill(); });
      SPR.steel = st;
      // вода (2 кадра)
      SPR.water = [0, 1].map(function (fr) {
        var cv = mk(ts, ts), w = cv.x, wg = w.createLinearGradient(0, 0, 0, ts); wg.addColorStop(0, '#1e5bd8'); wg.addColorStop(1, '#1740a8');
        w.fillStyle = wg; w.fillRect(0, 0, ts, ts);
        w.strokeStyle = 'rgba(191,219,254,.55)'; w.lineWidth = 1.2; w.lineCap = 'round';
        for (var wl = 0; wl < 2; wl++) { var wy = ts * (0.3 + wl * 0.42), wx = (fr * 0.5 + wl * 0.3) % 1 * ts; w.beginPath(); w.moveTo(wx - ts * 0.25, wy); w.quadraticCurveTo(wx, wy - ts * 0.15, wx + ts * 0.25, wy); w.stroke(); }
        w.fillStyle = 'rgba(255,255,255,.12)'; w.fillRect(0, 0, ts, 1);
        return cv;
      });
      // лес — пышнее клетки
      var fs = ts * 1.5; SPR.fs = fs;
      SPR.forest = [0, 1, 2].map(function () {
        var cv = mk(fs, fs), f = cv.x, o = (fs - ts) / 2;
        var blobs = []; for (var bl = 0; bl < 5; bl++) blobs.push([o + ts * (0.2 + R() * 0.6), o + ts * (0.2 + R() * 0.6), ts * (0.28 + R() * 0.16)]);
        f.fillStyle = 'rgba(0,0,0,.35)'; blobs.forEach(function (b2) { f.beginPath(); f.arc(b2[0] + ts * 0.08, b2[1] + ts * 0.12, b2[2], 0, 6.283); f.fill(); });
        blobs.forEach(function (b2) {
          var lg = f.createRadialGradient(b2[0] - b2[2] * 0.4, b2[1] - b2[2] * 0.4, 0, b2[0], b2[1], b2[2]);
          lg.addColorStop(0, '#4ade80'); lg.addColorStop(0.6, '#16a34a'); lg.addColorStop(1, '#14532d');
          f.fillStyle = lg; f.beginPath(); f.arc(b2[0], b2[1], b2[2], 0, 6.283); f.fill();
        });
        f.fillStyle = 'rgba(187,247,208,.5)'; for (var lf = 0; lf < 6; lf++) { f.beginPath(); f.arc(o + R() * ts, o + R() * ts, ts * 0.05, 0, 6.283); f.fill(); }
        return cv;
      });
    }
    function blocked(x, y, self) {
      // танк 2×2 полуклетки
      for (var yy = Math.floor(y); yy < Math.ceil(y + 2 - 1e-6); yy++) for (var xx = Math.floor(x); xx < Math.ceil(x + 2 - 1e-6); xx++) {
        var ch = cell(xx, yy);
        if (ch === 'B' || ch === 'S' || ch === 'W' || ch === 'E') return true;
      }
      var all = enemies.concat(player && player.alive ? [player] : []);
      for (var i = 0; i < all.length; i++) {
        var o = all[i]; if (o === self || !o.alive) continue;
        if (Math.abs(o.x - x) < 1.9 && Math.abs(o.y - y) < 1.9) {
          // разрешаем расходиться, если уже пересекались
          if (Math.abs(o.x - self.x) < 1.9 && Math.abs(o.y - self.y) < 1.9) continue;
          return true;
        }
      }
      return false;
    }
    function moveTank(tk, dir, dt) {
      if (tk.dir !== dir) {
        var v0 = DIRV[tk.dir], v1 = DIRV[dir];
        if (v0[0] !== v1[0] && v0[1] !== v1[1] && v0[0] !== -v1[0]) { tk.x = Math.round(tk.x); tk.y = Math.round(tk.y); }
        tk.dir = dir;
      }
      var v = DIRV[dir], step = tk.sp * dt;
      var nx = tk.x + v[0] * step, ny = tk.y + v[1] * step;
      tk.tread += step * 4;
      if (!blocked(nx, ny, tk)) { tk.x = nx; tk.y = ny; return true; }
      return false;
    }
    function fire(tk) {
      var own = bullets.filter(function (b) { return b.owner === tk; }).length;
      if (own >= (tk === player && player.star >= 2 ? 2 : tk.type === 'boss' ? 2 : 1)) return;
      var v = DIRV[tk.dir];
      bullets.push({ x: tk.x + 1 + v[0] * 1.1, y: tk.y + 1 + v[1] * 1.1, vx: v[0], vy: v[1], sp: tk.bs, owner: tk, power: tk === player && player.star >= 3 });
      if (tk === player) api.sound('move');
    }
    function boom(x, y, big) { booms.push({ x: x, y: y, t: 0, big: big }); if (big) api.sound('break'); }
    function spawnEnemy() {
      var spots = [0, 12, 24], k = Math.floor(Math.random() * 3);
      for (var i = 0; i < 3; i++) {
        var sx = spots[(k + i) % 3];
        if (!enemies.some(function (e) { return e.alive && Math.abs(e.x - sx) < 2 && e.y < 2; }) && !(player.alive && Math.abs(player.x - sx) < 2 && player.y < 2)) {
          var lvl = level + api.diff, r = Math.random(), type = r < 0.5 - lvl * 0.04 ? 'basic' : r < 0.72 ? 'fast' : r < 0.88 ? 'power' : 'armor';
          if (level % 3 === 0 && toSpawn === 1) { type = 'boss'; api.toast(api.t('tanks.boss')); api.sound('life'); }
          var T2 = TYPES[type], n = D.total - toSpawn;
          enemies.push({ x: sx, y: 0, dir: 'down', sp: T2.sp * (0.9 + api.diff * 0.06), hp: T2.hp, bs: T2.bs, pts: T2.pts, col: T2.col, type: type, alive: true, spawnT: 0.8,
            fireT: 1 + Math.random(), turnT: 1, tread: 0, bonus: n % 4 === 3 || type === 'boss', hitT: 0 });
          if (type === 'boss') enemies[enemies.length - 1].hp = T2.hp + level;
          toSpawn--;
          return;
        }
      }
    }
    function respawnPlayer() {
      player = { x: 8, y: 24, dir: 'up', sp: 4.6, bs: 15, alive: true, shield: 3, star: player ? player.star : 0, tread: 0, spawnT: 0.6 };
    }
    function hitTank(tk, b) {
      if (tk === player) {
        if (player.shield > 0) return;
        player.alive = false; boom(tk.x + 1, tk.y + 1, true); api.vibrate(250);
        lives--; player.star = 0;
        if (lives <= 0) { phase = 'lost'; endT = 2.2; } else phase = 'respawn', phaseT = 0;
        return;
      }
      tk.hp--; tk.hitT = 0.12;
      if (tk.hp > 0) { api.sound('rotate'); return; }
      tk.alive = false; boom(tk.x + 1, tk.y + 1, true); kills++;
      api.addScore(tk.pts); api.vibrate(30);
      chainN = chainT > 0 ? chainN + 1 : 1; chainT = 2.5;
      var ex = ox + (tk.x + 1) * ts, ey = oy + tk.y * ts;
      if (chainN >= 2) { api.addScore(100 * chainN); api.fx.text(ex, ey, api.t('tanks.chain', chainN) + ' +' + 100 * chainN, '#fde047', 15); }
      if (tk.type === 'boss') { api.fx.shake(10); api.fx.flash('#c084fc', 0.3); api.fx.burst(ex, ey + ts, '#c084fc', 40, 260, 4); }
      if (tk.bonus) spawnBonus();
    }
    function spawnBonus() {
      var types = ['star', 'helmet', 'grenade', 'clock', 'shovel', 'life'];
      bonuses.push({ type: types[Math.floor(Math.random() * types.length)], x: 2 + Math.floor(Math.random() * 20), y: 4 + Math.floor(Math.random() * 16), t: 12 });
      api.sound('bonus');
    }
    function takeBonus(b) {
      api.addScore(500); api.sound('life'); api.vibrate(40);
      if (b.type === 'star') player.star = Math.min(3, player.star + 1);
      else if (b.type === 'helmet') player.shield = 10;
      else if (b.type === 'grenade') enemies.forEach(function (e) { if (e.alive) { e.alive = false; boom(e.x + 1, e.y + 1, true); api.addScore(e.pts); kills++; } });
      else if (b.type === 'clock') freezeT = 8;
      else if (b.type === 'shovel') { shovelT = 15; baseWalls('S'); }
      else if (b.type === 'life') lives++;
      api.toast(api.t('tanks.b_' + b.type));
    }
    function updateBullets(dt) {
      for (var i = bullets.length - 1; i >= 0; i--) {
        var b = bullets[i], dead = false, sub = 4;
        for (var s = 0; s < sub && !dead; s++) {
          b.x += b.vx * b.sp * dt / sub; b.y += b.vy * b.sp * dt / sub;
          var cx = Math.floor(b.x), cy = Math.floor(b.y), ch = cell(cx, cy);
          if (b.x < 0 || b.y < 0 || b.x >= N || b.y >= N) { dead = true; boom(b.x, b.y, false); break; }
          if (ch === 'B' || ch === 'S' || ch === 'E') {
            dead = true; boom(b.x, b.y, false);
            if (ch === 'E') { baseDead = true; phase = 'lost'; endT = 2.4; boom(13, 25, true); api.vibrate(300); break; }
            if (ch === 'B' || (ch === 'S' && b.power)) {
              // разрушаем полосу шириной 2 полуклетки поперёк полёта
              var px = b.vx ? 0 : 1, py = b.vy ? 0 : 1, bx0 = b.vx ? cx : Math.round(b.x) - 1, by0 = b.vy ? cy : Math.round(b.y) - 1;
              for (var k = 0; k < 2; k++) { var xx = bx0 + px * k, yy = by0 + py * k, c2 = cell(xx, yy); if (c2 === 'B' || (c2 === 'S' && b.power)) setCell(xx, yy, ' '); }
              if (b.owner === player) api.sound('stomp');
            } else if (b.owner === player) api.sound('move');
            break;
          }
          var targets = b.owner === player ? enemies : [player];
          for (var j = 0; j < targets.length; j++) {
            var tk = targets[j];
            if (!tk || !tk.alive || tk.spawnT > 0) continue;
            if (b.x > tk.x && b.x < tk.x + 2 && b.y > tk.y && b.y < tk.y + 2) { dead = true; hitTank(tk, b); break; }
          }
        }
        if (!dead) for (var q = 0; q < bullets.length; q++) {
          var o = bullets[q]; if (o === b || (o.owner === player) === (b.owner === player)) continue;
          if (Math.abs(o.x - b.x) < 0.5 && Math.abs(o.y - b.y) < 0.5) { dead = true; bullets.splice(q, 1); if (q < i) i--; break; }
        }
        if (dead) bullets.splice(i, 1);
      }
    }
    function enemyAI(e, dt) {
      if (e.spawnT > 0) { e.spawnT -= dt; return; }
      if (freezeT > 0) return;
      e.turnT -= dt;
      var moved = moveTank(e, e.dir, dt);
      if (!moved || e.turnT <= 0) {
        e.turnT = 0.8 + Math.random() * 2.2;
        var r = Math.random(), dirs = ['up', 'down', 'left', 'right'];
        if (r < D.smart && player.alive) { // к игроку
          var dx = player.x - e.x, dy = player.y - e.y;
          e.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        } else if (r < D.smart + 0.3) { // к базе
          var bx = 12 - e.x;
          e.dir = Math.random() < 0.6 ? 'down' : (bx > 0 ? 'right' : 'left');
        } else e.dir = dirs[Math.floor(Math.random() * 4)];
        if (!moved && Math.random() < 0.5) fire(e);
      }
      e.fireT -= dt * D.fire;
      var aligned = player.alive && ((Math.abs(player.x - e.x) < 1 && ((e.dir === 'down' && player.y > e.y) || (e.dir === 'up' && player.y < e.y))) ||
        (Math.abs(player.y - e.y) < 1 && ((e.dir === 'right' && player.x > e.x) || (e.dir === 'left' && player.x < e.x))));
      if (e.fireT <= 0 || (aligned && Math.random() < dt * 3 * D.fire)) { fire(e); e.fireT = 0.8 + Math.random() * 1.6; }
      if (e.hitT > 0) e.hitT -= dt;
    }
    function drawTank(c, tk, col, dark) {
      var x = ox + tk.x * ts, y = oy + tk.y * ts, s = ts * 2;
      if (tk.spawnT > 0) {
        var k = Math.sin(t * 30) * 0.5 + 0.5; c.fillStyle = 'rgba(255,255,255,' + k + ')';
        c.beginPath(); for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4 + t * 6, rr = i % 2 ? s * 0.18 : s * 0.48; c.lineTo(x + s / 2 + Math.cos(a) * rr, y + s / 2 + Math.sin(a) * rr); } c.closePath(); c.fill();
        c.strokeStyle = 'rgba(253,224,71,' + (1 - k) * 0.8 + ')'; c.lineWidth = 2; c.beginPath(); c.arc(x + s / 2, y + s / 2, s * (0.3 + k * 0.25), 0, 6.283); c.stroke();
        return;
      }
      c.save(); c.translate(x + s / 2, y + s / 2);
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(-s * 0.44, -s * 0.4, s * 0.98, s * 0.96); // тень
      c.rotate({ up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[tk.dir]);
      // гусеницы
      c.fillStyle = '#18181b'; c.fillRect(-s * 0.49, -s * 0.47, s * 0.28, s * 0.94); c.fillRect(s * 0.21, -s * 0.47, s * 0.28, s * 0.94);
      c.fillStyle = '#3f3f46'; c.fillRect(-s * 0.46, -s * 0.45, s * 0.22, s * 0.9); c.fillRect(s * 0.24, -s * 0.45, s * 0.22, s * 0.9);
      c.fillStyle = '#71717a';
      var off = (tk.tread % 1) * s * 0.12;
      for (var tr = -0.47; tr < 0.47; tr += 0.12) { var ty = tr * s + off; if (ty > s * 0.45) continue; c.fillRect(-s * 0.49, ty, s * 0.28, s * 0.035); c.fillRect(s * 0.21, ty, s * 0.28, s * 0.035); }
      c.fillStyle = '#27272a'; // катки
      for (var wh = -0.3; wh <= 0.31; wh += 0.2) { c.beginPath(); c.arc(-s * 0.35, wh * s, s * 0.06, 0, 6.283); c.arc(s * 0.35, wh * s, s * 0.06, 0, 6.283); c.fill(); }
      // корпус
      var hc = tk.hitT > 0 ? '#fff' : col;
      c.fillStyle = dark; c.fillRect(-s * 0.27, -s * 0.37, s * 0.54, s * 0.75);
      var hg = c.createLinearGradient(-s * 0.26, 0, s * 0.26, 0); hg.addColorStop(0, 'rgba(255,255,255,.35)'); hg.addColorStop(0.5, 'rgba(255,255,255,0)'); hg.addColorStop(1, 'rgba(0,0,0,.3)');
      c.fillStyle = hc; c.fillRect(-s * 0.25, -s * 0.35, s * 0.5, s * 0.7);
      c.fillStyle = hg; c.fillRect(-s * 0.25, -s * 0.35, s * 0.5, s * 0.7);
      c.fillStyle = 'rgba(0,0,0,.3)'; for (var gr = 0; gr < 3; gr++) c.fillRect(-s * 0.16, s * 0.2 + gr * s * 0.045, s * 0.32, s * 0.02); // решётка двигателя
      c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(-s * 0.25, -s * 0.35, s * 0.5, 1);
      // ствол
      c.fillStyle = dark; c.fillRect(-s * 0.055, -s * 0.54, s * 0.11, s * 0.42);
      c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-s * 0.04, -s * 0.52, s * 0.03, s * 0.38);
      c.fillStyle = '#18181b'; c.fillRect(-s * 0.075, -s * 0.56, s * 0.15, s * 0.07);
      // башня
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(s * 0.02, s * 0.03, s * 0.2, 0, 6.283); c.fill();
      c.fillStyle = dark; c.beginPath(); c.arc(0, 0, s * 0.2, 0, 6.283); c.fill();
      var tg = c.createRadialGradient(-s * 0.06, -s * 0.07, 1, 0, 0, s * 0.17); tg.addColorStop(0, '#ffffff'); tg.addColorStop(0.35, hc); tg.addColorStop(1, hc);
      c.fillStyle = tg; c.beginPath(); c.arc(0, 0, s * 0.16, 0, 6.283); c.fill();
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.arc(s * 0.06, s * 0.05, s * 0.05, 0, 6.283); c.fill(); // люк
      if (tk.type === 'boss') { c.fillStyle = '#fde047'; c.beginPath(); c.moveTo(-s * 0.14, s * 0.06); c.lineTo(-s * 0.14, -s * 0.08); c.lineTo(-s * 0.07, 0); c.lineTo(0, -s * 0.1); c.lineTo(s * 0.07, 0); c.lineTo(s * 0.14, -s * 0.08); c.lineTo(s * 0.14, s * 0.06); c.closePath(); c.fill(); }
      c.restore();
      if (tk.type === 'boss' && tk.hp > 0) { c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(x, y - 6, s, 4); c.fillStyle = '#c084fc'; c.fillRect(x, y - 6, s * Math.min(1, tk.hp / (10 + level)), 4); }
      if (tk.shield > 0) {
        c.strokeStyle = 'rgba(147,197,253,' + (0.5 + 0.4 * Math.sin(t * 20)) + ')'; c.lineWidth = 2;
        c.beginPath(); c.arc(x + s / 2, y + s / 2, s * 0.62, 0, 6.283); c.stroke();
        c.fillStyle = 'rgba(147,197,253,.12)'; c.fill();
      }
    }

    return {
      reset: function () {
        D = DIFF[api.diff]; level = 1; lives = D.lives; t = 0; kills = 0; endT = 0; keys = {}; lastDir = null; player = null;
        layout(); startLevel();
      },
      resize: layout,
      idle: function (dt) { t += dt; },
      key: function (k, down) {
        keys[k] = down;
        if (DIRV[k]) { if (down) lastDir = k; else if (lastDir === k) lastDir = ['up', 'down', 'left', 'right'].filter(function (d) { return keys[d]; })[0] || null; }
        if (k === 'a' && down && player.alive && phase === 'play') fire(player);
      },
      input: function () { },
      update: function (dt) {
        t += dt; phaseT += dt;
        booms = booms.filter(function (b) { b.t += dt; return b.t < 0.5; });
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); }
        if (phase === 'intro') { if (phaseT > 1.6) { phase = 'play'; } return; }
        if (phase === 'respawn' && phaseT > 1.2) { respawnPlayer(); phase = 'play'; }
        if (phase === 'clear') { if (phaseT > 2.2) { level++; startLevel(); } return; }
        if (freezeT > 0) freezeT -= dt;
        if (chainT > 0) chainT -= dt;
        if (shovelT > 0) { shovelT -= dt; if (shovelT <= 0) baseWalls('B'); }
        // игрок
        if (player.alive && phase !== 'lost') {
          if (player.spawnT > 0) player.spawnT -= dt;
          if (player.shield > 0) player.shield -= dt;
          if (lastDir) moveTank(player, lastDir, dt);
          if (keys.a && Math.random() < dt * 6) fire(player);
          for (var bi = bonuses.length - 1; bi >= 0; bi--) {
            var bn = bonuses[bi];
            if (Math.abs(bn.x - player.x) < 2 && Math.abs(bn.y - player.y) < 2) { takeBonus(bn); bonuses.splice(bi, 1); }
          }
        }
        bonuses.forEach(function (b) { b.t -= dt; }); bonuses = bonuses.filter(function (b) { return b.t > 0; });
        // враги
        spawnT -= dt;
        var aliveN = enemies.filter(function (e) { return e.alive; }).length;
        if (toSpawn > 0 && aliveN < D.field && spawnT <= 0) { spawnEnemy(); spawnT = 2.2; }
        enemies.forEach(function (e) { if (e.alive) enemyAI(e, dt); });
        enemies = enemies.filter(function (e) { return e.alive; });
        updateBullets(dt);
        if (phase === 'play' && toSpawn <= 0 && !enemies.length) { phase = 'clear'; phaseT = 0; api.addScore(1000 * level); api.sound('win'); }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        c.drawImage(SPR.bg, 0, 0, W, H);
        // плитки
        var wf = Math.floor(t * 2);
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
          var ch = map[y][x], px = ox + x * ts, py = oy + y * ts;
          if (ch === ' ' || ch === 'F') continue;
          if (ch === 'B') c.drawImage(SPR.brick[y % 2], px, py, ts, ts);
          else if (ch === 'S') c.drawImage(SPR.steel, px, py, ts, ts);
          else if (ch === 'W') c.drawImage(SPR.water[(wf + x + y) % 2], px, py, ts, ts);
          else if (ch === 'E' && x === 12 && y === 24) {
            var bxp = px, byp = py, bs = ts * 2;
            c.fillStyle = '#18181b'; c.fillRect(bxp, byp, bs, bs);
            if (baseDead) {
              c.fillStyle = '#3f3f46'; c.beginPath(); c.moveTo(bxp + bs * 0.1, byp + bs * 0.92); c.lineTo(bxp + bs * 0.3, byp + bs * 0.55); c.lineTo(bxp + bs * 0.45, byp + bs * 0.7); c.lineTo(bxp + bs * 0.62, byp + bs * 0.45); c.lineTo(bxp + bs * 0.9, byp + bs * 0.92); c.closePath(); c.fill();
              c.fillStyle = 'rgba(120,113,108,' + (0.3 + 0.2 * Math.sin(t * 3)) + ')'; c.beginPath(); c.arc(bxp + bs * 0.5, byp + bs * (0.35 - (t * 0.3 % 0.3)), bs * 0.2, 0, 6.283); c.fill();
            } else {
              var eg = c.createLinearGradient(0, byp, 0, byp + bs); eg.addColorStop(0, '#e4e4e7'); eg.addColorStop(1, '#71717a');
              c.fillStyle = '#27272a'; c.fillRect(bxp + bs * 0.18, byp + bs * 0.86, bs * 0.64, bs * 0.1);
              c.fillStyle = eg; c.strokeStyle = '#27272a'; c.lineWidth = 1.2;
              c.beginPath(); c.moveTo(bxp + bs * 0.5, byp + bs * 0.1); c.lineTo(bxp + bs * 0.92, byp + bs * 0.38); c.lineTo(bxp + bs * 0.7, byp + bs * 0.45); c.lineTo(bxp + bs * 0.75, byp + bs * 0.86);
              c.lineTo(bxp + bs * 0.25, byp + bs * 0.86); c.lineTo(bxp + bs * 0.3, byp + bs * 0.45); c.lineTo(bxp + bs * 0.08, byp + bs * 0.38); c.closePath(); c.fill(); c.stroke();
              c.strokeStyle = 'rgba(0,0,0,.3)'; c.beginPath(); for (var fl = 0; fl < 3; fl++) { c.moveTo(bxp + bs * (0.2 + fl * 0.06), byp + bs * (0.42 + fl * 0.04)); c.lineTo(bxp + bs * (0.32 + fl * 0.04), byp + bs * (0.5 + fl * 0.04)); c.moveTo(bxp + bs * (0.8 - fl * 0.06), byp + bs * (0.42 + fl * 0.04)); c.lineTo(bxp + bs * (0.68 - fl * 0.04), byp + bs * (0.5 + fl * 0.04)); } c.stroke();
              c.fillStyle = '#facc15'; c.beginPath(); c.arc(bxp + bs * 0.5, byp + bs * 0.3, bs * 0.08, 0, 6.283); c.fill();
              c.fillStyle = '#fff'; c.beginPath(); c.arc(bxp + bs * 0.48, byp + bs * 0.28, bs * 0.025, 0, 6.283); c.fill();
            }
          }
        }
        // бонусы
        bonuses.forEach(function (b) {
          if (b.t < 3 && Math.floor(t * 8) % 2) return;
          var bx = ox + b.x * ts, by = oy + b.y * ts, s = ts * 2;
          var pg = c.createLinearGradient(0, by, 0, by + s); pg.addColorStop(0, '#ffffff'); pg.addColorStop(1, '#cbd5e1');
          c.fillStyle = 'rgba(220,38,38,' + (0.25 + 0.2 * Math.sin(t * 8)) + ')'; c.fillRect(bx - 3, by - 3, s + 6, s + 6);
          c.fillStyle = pg; c.fillRect(bx, by, s, s); c.strokeStyle = '#dc2626'; c.lineWidth = 2; c.strokeRect(bx + 1, by + 1, s - 2, s - 2);
          c.fillStyle = '#dc2626';
          c.font = '900 ' + Math.round(s * 0.62) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText({ star: '★', helmet: '⛑', grenade: '✸', clock: '⏱', shovel: '⛏', life: '♥' }[b.type], bx + s / 2, by + s / 2 + 1);
        });
        if (player && player.alive) drawTank(c, player, '#facc15', '#a16207');
        enemies.forEach(function (e) {
          var col = e.bonus && Math.floor(t * 6) % 2 ? '#f87171' : e.type === 'armor' ? ['#86efac', '#fde047', '#fdba74', '#cbd5e1'][Math.max(0, 4 - e.hp)] : e.col;
          drawTank(c, e, col, '#3f3f46');
        });
        bullets.forEach(function (b) {
          var bx2 = ox + b.x * ts, by2 = oy + b.y * ts, mine = b.owner === player, vx = b.dx != null ? b.dx : (b.vx || 0), vy = b.dy != null ? b.dy : (b.vy || 0), vl = Math.hypot(vx, vy) || 1;
          if (api.quality > 0) { c.strokeStyle = mine ? 'rgba(253,224,71,.35)' : 'rgba(228,228,231,.3)'; c.lineWidth = ts * 0.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(bx2, by2); c.lineTo(bx2 - vx / vl * ts * 1.4, by2 - vy / vl * ts * 1.4); c.stroke(); c.lineCap = 'butt';
            c.fillStyle = mine ? 'rgba(253,224,71,.25)' : 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(bx2, by2, ts * 0.6, 0, 6.283); c.fill(); }
          c.fillStyle = mine ? '#fef08a' : '#e4e4e7'; c.beginPath(); c.arc(bx2, by2, ts * 0.3, 0, 6.283); c.fill();
          c.fillStyle = '#fff'; c.beginPath(); c.arc(bx2 - ts * 0.08, by2 - ts * 0.08, ts * 0.12, 0, 6.283); c.fill();
        });
        // лес поверх
        for (var fy = 0; fy < N; fy++) for (var fx = 0; fx < N; fx++) if (map[fy][fx] === 'F') {
          var qx = ox + fx * ts, qy = oy + fy * ts, fo = (SPR.fs - ts) / 2;
          c.drawImage(SPR.forest[(fx * 7 + fy * 3) % 3], qx - fo, qy - fo, SPR.fs, SPR.fs);
        }
        booms.forEach(function (b) {
          var k = b.t / 0.5, r = (b.big ? ts * 2.2 : ts * 0.9) * (0.4 + k), bx3 = ox + b.x * ts, by3 = oy + b.y * ts;
          c.fillStyle = 'rgba(82,82,91,' + (1 - k) * 0.5 + ')'; c.beginPath(); c.arc(bx3, by3 - k * ts, r * 1.15, 0, 6.283); c.fill();
          c.fillStyle = 'rgba(234,88,12,' + (1 - k) + ')'; c.beginPath(); c.arc(bx3, by3, r, 0, 6.283); c.fill();
          c.fillStyle = 'rgba(251,191,36,' + (1 - k) + ')'; c.beginPath(); c.arc(bx3, by3, r * 0.68, 0, 6.283); c.fill();
          c.fillStyle = 'rgba(255,251,235,' + (1 - k) + ')'; c.beginPath(); c.arc(bx3, by3, r * 0.35, 0, 6.283); c.fill();
          if (b.big && api.quality > 0) { c.fillStyle = 'rgba(253,186,116,' + (1 - k) + ')'; for (var sp = 0; sp < 8; sp++) { var sa = sp * 0.785 + b.x, sd = r * (0.8 + k * 0.9); c.fillRect(bx3 + Math.cos(sa) * sd - 1.5, by3 + Math.sin(sa) * sd - 1.5, 3, 3); } }
        });
        // HUD
        var hb = c.createLinearGradient(0, 0, 0, 34); hb.addColorStop(0, 'rgba(63,63,70,.9)'); hb.addColorStop(1, 'rgba(24,24,27,.9)');
        c.fillStyle = hb; c.fillRect(0, 2, W, 30); c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(0, 2, W, 1); c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, 32, W, 1);
        c.textBaseline = 'middle'; c.textAlign = 'left'; c.font = '800 14px system-ui, sans-serif';
        c.fillStyle = '#facc15'; c.fillText('♥ ' + lives, 10, 17);
        c.fillStyle = '#e4e4e7'; c.fillText(api.t('tetris.level') + ' ' + level, 64, 17);
        var left = toSpawn + enemies.length;
        c.textAlign = 'right'; c.fillStyle = '#fca5a5'; c.fillText('⛟ ' + left, W - 10, 17);
        if (player && player.star) { c.fillStyle = '#fde047'; c.textAlign = 'center'; c.fillText('★'.repeat(player.star), W / 2, 17); }
        if (freezeT > 0) { c.fillStyle = 'rgba(147,197,253,.12)'; c.fillRect(ox, oy, ts * N, ts * N); }
        c.textAlign = 'center';
        if (phase === 'intro' || phase === 'clear') {
          c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, H / 2 - 34, W, 68);
          c.fillStyle = '#fde047'; c.font = '900 28px system-ui, sans-serif';
          c.fillText(phase === 'clear' ? api.t('tanks.clear') : api.t('tetris.level') + ' ' + level, W / 2, H / 2);
        } else if (phase === 'lost') {
          c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, H / 2 - 34, W, 68);
          c.fillStyle = '#f87171'; c.font = '900 28px system-ui, sans-serif'; c.fillText(baseDead ? api.t('tanks.base') : api.t('g.lose'), W / 2, H / 2);
        }
      }
    };
    function startLevel() {
      genMap(); enemies = []; bullets = []; booms = []; bonuses = []; toSpawn = D.total + Math.min(6, level - 1); spawnT = 1; freezeT = 0; shovelT = 0; baseDead = false;
      respawnPlayer(); phase = 'intro'; phaseT = 0;
    }
  }
};
