/* Морской бой — экран пополам, расстановка перетаскиванием, пушки */
window.GAMES = window.GAMES || {};
window.GAMES.battleship = {
  title: 'Морской бой',
  colors: ['#1d4ed8', '#0f766e'],
  controls: 'none',
  modes: true,
  lan: true,
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="bsSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38bdf8"/><stop offset="1" stop-color="#0c4a6e"/></linearGradient>' +
    '<linearGradient id="bsHull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cbd5e1"/><stop offset="1" stop-color="#475569"/></linearGradient>' +
    '<radialGradient id="bsBoom" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fef08a"/><stop offset=".5" stop-color="#f97316"/><stop offset="1" stop-color="#f97316" stop-opacity="0"/></radialGradient></defs>' +
    '<rect x="4" y="4" width="92" height="92" rx="18" fill="url(#bsSea)"/>' +
    '<path d="M10 30q6-4 12 0t12 0M56 22q6-4 12 0t12 0M14 84q6-4 12 0t12 0M60 88q6-4 12 0t12 0" stroke="#e0f2fe" stroke-opacity=".5" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
    '<path d="M14 58 H74 L88 50 L84 66 Q80 72 70 72 H22 Q14 72 14 64z" fill="url(#bsHull)" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<rect x="32" y="44" width="22" height="14" rx="3" fill="#334155" stroke="#0f172a" stroke-width="2"/><rect x="38" y="34" width="6" height="10" fill="#1e293b"/>' +
    '<path d="M54 50 L72 44" stroke="#1e293b" stroke-width="4" stroke-linecap="round"/><circle cx="36" cy="51" r="2" fill="#7dd3fc"/><circle cx="44" cy="51" r="2" fill="#7dd3fc"/><circle cx="50" cy="51" r="2" fill="#7dd3fc"/>' +
    '<path d="M10 74q10 5 20 0t20 0 20 0 20 0" stroke="#fff" stroke-opacity=".8" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    '<circle cx="76" cy="26" r="16" fill="url(#bsBoom)"/><circle cx="76" cy="26" r="5" fill="#fff7d6"/></svg>',

  create: function (api) {
    var COLS = 10, ROWS = 8, FLEET = [5, 4, 3, 3, 2], STRIP = 56;
    var TEAM = [{ fill: '#ef4444', dark: '#7f1d1d', half: '#f4a07a', cell: 'rgba(120,40,20,.18)', cellHit: '#b45309', light: '#fecaca', sea: ['#1f7a8c', '#0f4f66', '#08314a'] },
      { fill: '#38bdf8', dark: '#0c4a6e', half: '#5aa9d6', cell: 'rgba(12,40,80,.25)', cellHit: '#0f3a5e', light: '#e0f2fe', sea: ['#2867b2', '#17407e', '#0b2452'] }];
    var halfOff = null, topOff = null, offKey = '';
    var cs, gx, gy; // геометрия нижнего поля (поле сиденья 0); поле сиденья 1 — поворот на 180°
    var boards, phase, deploySeat, drag, shooter, ball, fx, t, phaseT, endT, winner, aiState, netQ, ready, scores, aim, shake, msg, msgT, cannonAng;

    /* ---------- данные ---------- */
    function newBoard() {
      var b = { ships: [], shot: [], sunkCells: [], remote: false };
      for (var i = 0; i < COLS * ROWS; i++) b.shot.push(0);
      FLEET.forEach(function (len, k) { b.ships.push({ len: len, kind: k, r: 0, c: 0, h: true, placed: false, hits: 0, sunk: false }); });
      return b;
    }
    function cellsOf(sh, r, c, h) {
      var out = [];
      for (var k = 0; k < sh.len; k++) out.push([r + (h ? 0 : k), c + (h ? k : 0)]);
      return out;
    }
    function fits(b, sh, r, c, h) {
      var cells = cellsOf(sh, r, c, h);
      for (var i = 0; i < cells.length; i++) {
        var q = cells[i];
        if (q[0] < 0 || q[1] < 0 || q[0] >= ROWS || q[1] >= COLS) return false;
        for (var j = 0; j < b.ships.length; j++) {
          var o = b.ships[j]; if (o === sh || !o.placed) continue;
          if (cellsOf(o, o.r, o.c, o.h).some(function (z) { return z[0] === q[0] && z[1] === q[1]; })) return false;
        }
      }
      return true;
    }
    function shipAt(b, r, c) {
      for (var j = 0; j < b.ships.length; j++) {
        var o = b.ships[j]; if (!o.placed) continue;
        if (cellsOf(o, o.r, o.c, o.h).some(function (z) { return z[0] === r && z[1] === c; })) return o;
      }
      return null;
    }
    function randomize(b) {
      for (var attempt = 0; attempt < 100; attempt++) {
        b.ships.forEach(function (s) { s.placed = false; });
        var ok = b.ships.every(function (s) {
          for (var k = 0; k < 300; k++) {
            var h = Math.random() < 0.5, r = Math.floor(Math.random() * ROWS), c = Math.floor(Math.random() * COLS);
            if (fits(b, s, r, c, h)) { s.r = r; s.c = c; s.h = h; s.placed = true; return true; }
          }
          return false;
        });
        if (ok) return;
      }
    }
    function allPlaced(b) { return b.ships.every(function (s) { return s.placed; }); }

    /* ---------- геометрия ---------- */
    function layout() {
      var hh = (api.H - STRIP) / 2;
      cs = Math.floor(Math.min((api.W - 16) / COLS, (hh - 76) / ROWS));
      gx = Math.floor((api.W - cs * COLS) / 2);
      gy = Math.floor(api.H / 2 + STRIP / 2 + 6);
      var key = api.W + 'x' + api.H + ':' + cs;
      if (key !== offKey) { offKey = key; buildBg(); }
    }
    function mkOff(w, h) {
      var cv = document.createElement('canvas'), d = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.max(1, Math.ceil(w * d)); cv.height = Math.max(1, Math.ceil(h * d));
      var x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return { cv: cv, c: x };
    }
    function buildBg() {
      var W = api.W, H = api.H, hh = H / 2, seed = 7;
      function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      halfOff = [];
      for (var seat = 0; seat < 2; seat++) {
        var o = mkOff(W, hh), x = o.c, tm = TEAM[seat];
        x.translate(0, -hh);
        var g = x.createLinearGradient(0, hh, 0, H); g.addColorStop(0, tm.sea[0]); g.addColorStop(0.55, tm.sea[1]); g.addColorStop(1, tm.sea[2]);
        x.fillStyle = g; x.fillRect(0, hh, W, hh);
        for (var k = 0; k < 14; k++) { // блики-каустики
          var bx = rnd() * W, by = hh + rnd() * hh, br = 30 + rnd() * 60, rg = x.createRadialGradient(bx, by, 0, bx, by, br);
          rg.addColorStop(0, 'rgba(255,255,255,.07)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = rg; x.fillRect(bx - br, by - br, br * 2, br * 2);
        }
        x.lineCap = 'round';
        for (k = 0; k < 110; k++) { // гребешки волн
          var px = rnd() * W, py = hh + rnd() * hh, ww = 4 + rnd() * 9;
          x.strokeStyle = 'rgba(255,255,255,' + (0.05 + rnd() * 0.1).toFixed(3) + ')'; x.lineWidth = 1 + rnd();
          x.beginPath(); x.moveTo(px - ww, py); x.quadraticCurveTo(px, py - ww * 0.45, px + ww, py); x.stroke();
        }
        var tg = x.createLinearGradient(0, hh, 0, hh + 40); tg.addColorStop(0, tm.fill); tg.addColorStop(1, 'rgba(0,0,0,0)');
        x.globalAlpha = 0.35; x.fillStyle = tg; x.fillRect(0, hh, W, 40); x.globalAlpha = 1;
        // подложка сетки
        var GW = cs * COLS, GH = cs * ROWS;
        x.fillStyle = 'rgba(2,10,28,.3)'; rr(x, gx - 4, gy - 4, GW + 8, GH + 8, 10); x.fill();
        x.strokeStyle = tm.fill; x.globalAlpha = 0.7; x.lineWidth = 2; x.stroke(); x.globalAlpha = 1;
        for (var r = 0; r < ROWS; r++) for (var q = 0; q < COLS; q++) {
          var cx0 = gx + q * cs, cy0 = gy + r * cs;
          var cg = x.createLinearGradient(0, cy0, 0, cy0 + cs);
          cg.addColorStop(0, (r + q) % 2 ? 'rgba(255,255,255,.13)' : 'rgba(255,255,255,.09)'); cg.addColorStop(1, 'rgba(255,255,255,.03)');
          x.fillStyle = cg; rr(x, cx0 + 1.5, cy0 + 1.5, cs - 3, cs - 3, cs * 0.14); x.fill();
          x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 1; x.stroke();
          x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(cx0 + cs * 0.25, cy0 + 2.5, cs * 0.5, 1);
        }
        var vg = x.createRadialGradient(W / 2, hh * 1.5, hh * 0.3, W / 2, hh * 1.5, Math.max(W, hh) * 0.85);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,8,24,.45)'); x.fillStyle = vg; x.fillRect(0, hh, W, hh);
        halfOff.push(o.cv);
      }
      // верх экрана расстановки — штурманская рубка
      var th = H / 2 + STRIP / 2, t2 = mkOff(W, th), y = t2.c;
      var g2 = y.createLinearGradient(0, 0, 0, th); g2.addColorStop(0, '#1b2a45'); g2.addColorStop(1, '#0f172a');
      y.fillStyle = g2; y.fillRect(0, 0, W, th);
      y.strokeStyle = 'rgba(125,211,252,.07)'; y.lineWidth = 1;
      for (var gxl = 0; gxl < W; gxl += 22) { y.beginPath(); y.moveTo(gxl + 0.5, 0); y.lineTo(gxl + 0.5, th); y.stroke(); }
      for (var gyl = 0; gyl < th; gyl += 22) { y.beginPath(); y.moveTo(0, gyl + 0.5); y.lineTo(W, gyl + 0.5); y.stroke(); }
      y.strokeStyle = 'rgba(125,211,252,.12)';
      for (k = 1; k < 5; k++) { y.beginPath(); y.arc(W * 0.88, th * 0.12, k * 34, 0, 6.283); y.stroke(); }
      y.beginPath(); y.moveTo(W * 0.88 - 150, th * 0.12); y.lineTo(W * 0.88 + 150, th * 0.12); y.moveTo(W * 0.88, th * 0.12 - 150); y.lineTo(W * 0.88, th * 0.12 + 150); y.stroke();
      var vg2 = y.createRadialGradient(W / 2, th * 0.4, 20, W / 2, th * 0.4, Math.max(W, th));
      vg2.addColorStop(0, 'rgba(0,0,0,0)'); vg2.addColorStop(1, 'rgba(0,0,0,.5)'); y.fillStyle = vg2; y.fillRect(0, 0, W, th);
      topOff = t2.cv;
    }
    function drawWaves(c) { // бегущие блики поверх воды (локальные координаты сиденья)
      if (api.quality === 0) return;
      var W = api.W, hh = api.H / 2;
      c.save(); c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 1.5; c.lineCap = 'round';
      for (var i = 0; i < 9; i++) {
        var yy = hh + 30 + ((i * 0.618) % 1) * (hh - 40), xx = ((t * (10 + i * 2) + i * 97) % (W + 80)) - 40, ww = 10 + (i % 3) * 5;
        c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 1.3 + i);
        c.beginPath(); c.moveTo(xx - ww, yy); c.quadraticCurveTo(xx, yy - 4, xx + ww, yy); c.stroke();
      }
      c.restore();
    }
    function rot(c, seat, fn) { // рисование «от лица» сиденья
      if (seat === 1) { c.save(); c.translate(api.W, api.H); c.rotate(Math.PI); fn(); c.restore(); } else fn();
    }
    function localPt(seat, x, y) { return seat === 1 ? { x: api.W - x, y: api.H - y } : { x: x, y: y }; }
    function cellCenterScreen(seat, idx) {
      var r = Math.floor(idx / COLS), c = idx % COLS, x = gx + (c + 0.5) * cs, y = gy + (r + 0.5) * cs;
      return seat === 1 ? { x: api.W - x, y: api.H - y } : { x: x, y: y };
    }
    function cannonPos(seat) { var x = api.W * 0.78, y = api.H - Math.max(46, cs * 1.4); return seat === 1 ? { x: api.W - x, y: api.H - y } : { x: x, y: y }; }
    function seatHuman(seat) { return api.mode === 1 || seat === 0; }

    /* ---------- рисование ---------- */
    function rr(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }
    function hullPath(c, kind, L, Wd, p) {
      c.beginPath();
      if (kind === 0) { c.moveTo(p, -Wd / 2); c.lineTo(L - cs * 0.6, -Wd / 2); c.lineTo(L - p, -Wd * 0.15); c.lineTo(L - p, Wd * 0.2); c.lineTo(L - cs * 0.5, Wd / 2); c.lineTo(p, Wd / 2); c.closePath(); }
      else if (kind === 1) { c.moveTo(p, -Wd * 0.38); c.lineTo(L - cs * 0.9, -Wd / 2); c.quadraticCurveTo(L - p, -Wd * 0.2, L - p, 0); c.quadraticCurveTo(L - p, Wd * 0.2, L - cs * 0.9, Wd / 2); c.lineTo(p, Wd * 0.38); c.closePath(); }
      else if (kind === 2) { c.moveTo(p, -Wd * 0.35); c.lineTo(L - cs * 0.7, -Wd * 0.42); c.lineTo(L - p, 0); c.lineTo(L - cs * 0.7, Wd * 0.42); c.lineTo(p, Wd * 0.35); c.closePath(); }
      else if (kind === 3) { rr(c, p, -Wd * 0.34, L - 2 * p, Wd * 0.68, Wd * 0.34); }
      else { c.moveTo(p, -Wd * 0.4); c.lineTo(L - cs * 0.55, -Wd * 0.4); c.quadraticCurveTo(L - p, -Wd * 0.2, L - p, 0); c.quadraticCurveTo(L - p, Wd * 0.2, L - cs * 0.55, Wd * 0.4); c.lineTo(p, Wd * 0.4); c.closePath(); }
    }
    function drawShip(c, x, y, len, kind, h, team, alpha, sunk) {
      // x,y — левый верхний угол; корабль рисуется вдоль, затем поворачивается
      var L = len * cs, Wd = cs * 0.72;
      c.save();
      c.globalAlpha = alpha == null ? 1 : alpha;
      if (h) c.translate(x, y + cs / 2); else { c.translate(x + cs / 2, y); c.rotate(Math.PI / 2); }
      var fill = sunk ? '#64748b' : team.fill, dark = sunk ? '#1e293b' : team.dark, light = sunk ? '#94a3b8' : team.light;
      c.lineWidth = Math.max(2, cs * 0.07); c.strokeStyle = dark; c.lineJoin = 'round';
      var p = cs * 0.08;
      if (!sunk) { c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.ellipse(L / 2, 0, L / 2 + cs * 0.04, Wd / 2 + cs * 0.1, 0, 0, 6.283); c.fill(); }
      c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(L / 2 + 3, 4, L / 2 - p, Wd / 2, 0, 0, 6.283); c.fill();
      var hg = c.createLinearGradient(0, -Wd / 2, 0, Wd / 2); hg.addColorStop(0, light); hg.addColorStop(0.42, fill); hg.addColorStop(1, dark);
      hullPath(c, kind, L, Wd, p); c.fillStyle = hg; c.fill(); c.stroke();
      // палуба
      c.save(); c.translate(L / 2, 0); c.scale(Math.max(0.5, (L - cs * 0.34) / L), 0.6); c.translate(-L / 2, 0);
      hullPath(c, kind, L, Wd, p); c.fillStyle = kind === 0 ? 'rgba(15,23,42,.35)' : 'rgba(255,255,255,.2)'; c.fill(); c.restore();
      c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1; c.beginPath(); c.moveTo(cs * 0.3, -Wd * 0.3); c.lineTo(L - cs * 0.9, -Wd * 0.3); c.stroke();
      c.strokeStyle = dark; c.lineWidth = Math.max(2, cs * 0.07);
      if (kind === 0) { // авианосец
        c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.2; c.setLineDash([4, 4]);
        c.beginPath(); c.moveTo(cs * 1.95, 0); c.lineTo(L - cs * 1.6, 0); c.stroke(); c.setLineDash([]);
        for (var k = 0; k < 3; k++) { c.beginPath(); c.moveTo(cs * 1.6 + k * 6, -Wd * 0.25); c.lineTo(cs * 1.6 + k * 6, Wd * 0.25); c.stroke(); }
        c.fillStyle = dark;
        for (var j = 0; j < 3; j++) { var jx = cs * 0.35 + j * cs * 0.38; c.beginPath(); c.moveTo(jx, -Wd * 0.32); c.lineTo(jx + cs * 0.28, -Wd * 0.05); c.lineTo(jx, Wd * 0.1); c.closePath(); c.fill(); }
        rr(c, L - cs * 1.45, Wd * 0.04, cs * 0.6, Wd * 0.34, 3); c.fill();
        c.fillStyle = light; c.fillRect(L - cs * 1.35, Wd * 0.1, cs * 0.12, Wd * 0.1); c.fillRect(L - cs * 1.15, Wd * 0.1, cs * 0.12, Wd * 0.1);
      } else if (kind === 1) { // линкор
        [0.25, 0.5, 0.72].forEach(function (f, i2) {
          if (i2 !== 1) { c.fillStyle = '#1f2937'; c.fillRect(L * f, -Wd * 0.07, cs * 0.42, Wd * 0.06); c.fillRect(L * f, Wd * 0.01, cs * 0.42, Wd * 0.06); }
          c.fillStyle = dark; c.beginPath(); c.arc(L * f, 0, Wd * 0.22, 0, 6.283); c.fill();
          c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(L * f - Wd * 0.06, -Wd * 0.07, Wd * 0.08, 0, 6.283); c.fill();
        });
        c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(L * 0.38, -Wd * 0.34, cs * 0.5, Wd * 0.1);
      } else if (kind === 2) { // крейсер
        c.fillStyle = dark; rr(c, L * 0.3, -Wd * 0.22, L * 0.3, Wd * 0.44, 3); c.fill();
        c.fillStyle = 'rgba(255,255,255,.7)';
        for (var w2 = 0; w2 < 3; w2++) c.fillRect(L * 0.33 + w2 * L * 0.08, -Wd * 0.1, L * 0.05, Wd * 0.2);
        c.beginPath(); c.arc(L * 0.78, 0, Wd * 0.13, 0, 6.283); c.fill();
        c.strokeStyle = dark; c.lineWidth = 1.5; c.beginPath(); c.moveTo(L * 0.18, -Wd * 0.25); c.lineTo(L * 0.18, Wd * 0.25); c.moveTo(L * 0.12, 0); c.lineTo(L * 0.24, 0); c.stroke();
      } else if (kind === 3) { // подводная лодка
        c.fillStyle = dark; rr(c, L * 0.38, -Wd * 0.22, L * 0.2, Wd * 0.44, 4); c.fill();
        c.fillStyle = 'rgba(255,255,255,.3)'; rr(c, L * 0.4, -Wd * 0.18, L * 0.08, Wd * 0.14, 2); c.fill();
        c.fillStyle = dark; c.fillRect(L * 0.08, -Wd * 0.45, cs * 0.12, Wd * 0.9);
        c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(L * 0.75, 0, Wd * 0.1, 0, 6.283); c.arc(L * 0.86, 0, Wd * 0.1, 0, 6.283); c.fill();
      } else { // катер
        c.fillStyle = dark; rr(c, L * 0.18, -Wd * 0.24, L * 0.32, Wd * 0.48, 4); c.fill();
        c.fillStyle = 'rgba(186,230,253,.85)'; c.fillRect(L * 0.22, -Wd * 0.12, L * 0.08, Wd * 0.24); c.fillRect(L * 0.34, -Wd * 0.12, L * 0.08, Wd * 0.24);
        c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(L * 0.72, 0, Wd * 0.08, 0, 6.283); c.fill();
      }
      if (sunk) { // пробоины и копоть
        c.fillStyle = 'rgba(15,23,42,.55)';
        for (var s2 = 0; s2 < len; s2++) { c.beginPath(); c.arc(cs * (s2 + 0.5), ((s2 * 37) % 7 - 3) * Wd * 0.05, Wd * 0.2, 0, 6.283); c.fill(); }
        c.strokeStyle = 'rgba(15,23,42,.7)'; c.lineWidth = 1.2; c.beginPath();
        for (s2 = 0; s2 < len; s2++) { var sx = cs * (s2 + 0.5); c.moveTo(sx - Wd * 0.25, -Wd * 0.2); c.lineTo(sx, 0); c.lineTo(sx + Wd * 0.15, Wd * 0.28); }
        c.stroke();
      }
      c.restore();
    }
    function drawHalfBg(c, seat, dim) {
      c.drawImage(halfOff[seat], 0, api.H / 2, api.W, api.H / 2);
      drawWaves(c);
      if (dim) { c.fillStyle = 'rgba(0,0,0,' + dim + ')'; c.fillRect(0, api.H / 2, api.W, api.H / 2); }
    }
    function drawShots(c, seat, b) {
      var hq = api.quality > 0;
      for (var i = 0; i < b.shot.length; i++) {
        var st = b.shot[i]; if (!st) continue;
        var r = Math.floor(i / COLS), q = i % COLS, x = gx + q * cs, y = gy + r * cs, mx = x + cs / 2, my = y + cs / 2;
        if (st === 1) { // промах — белая фишка и круги на воде
          c.fillStyle = 'rgba(8,30,60,.3)'; rr(c, x + 2, y + 2, cs - 4, cs - 4, cs * 0.14); c.fill();
          if (hq) {
            c.lineWidth = 1.3;
            for (var j = 0; j < 2; j++) {
              var ph = (t * 0.6 + j * 0.5 + i * 0.13) % 1;
              c.strokeStyle = 'rgba(224,242,254,' + ((1 - ph) * 0.55).toFixed(3) + ')';
              c.beginPath(); c.ellipse(mx, my + cs * 0.06, cs * (0.16 + ph * 0.28), cs * (0.1 + ph * 0.17), 0, 0, 6.283); c.stroke();
            }
          }
          c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.arc(mx + 1.5, my + 2, cs * 0.15, 0, 6.283); c.fill();
          c.fillStyle = '#e2e8f0'; c.beginPath(); c.arc(mx, my, cs * 0.15, 0, 6.283); c.fill();
          c.fillStyle = '#fff'; c.beginPath(); c.arc(mx - cs * 0.05, my - cs * 0.05, cs * 0.06, 0, 6.283); c.fill();
        } else {
          c.fillStyle = st === 3 ? 'rgba(17,24,39,.3)' : 'rgba(30,12,6,.62)'; rr(c, x + 2, y + 2, cs - 4, cs - 4, cs * 0.14); c.fill();
          if (st === 2) { // огонь
            c.fillStyle = 'rgba(249,115,22,.22)'; c.beginPath(); c.arc(mx, my + cs * 0.05, cs * 0.42, 0, 6.283); c.fill();
            var fl = Math.sin(t * 12 + i) * cs * 0.04;
            c.fillStyle = '#dc2626'; c.beginPath(); c.moveTo(x + cs * 0.24, y + cs * 0.72); c.quadraticCurveTo(x + cs * 0.12, y + cs * 0.4, x + cs * 0.5, y + cs * 0.16 - fl); c.quadraticCurveTo(x + cs * 0.88, y + cs * 0.4, x + cs * 0.76, y + cs * 0.72); c.closePath(); c.fill();
            c.fillStyle = '#f97316'; c.beginPath(); c.moveTo(x + cs * 0.3, y + cs * 0.68); c.quadraticCurveTo(x + cs * 0.2, y + cs * 0.35, x + cs * 0.52, y + cs * 0.22 + fl); c.quadraticCurveTo(x + cs * 0.82, y + cs * 0.42, x + cs * 0.7, y + cs * 0.68); c.closePath(); c.fill();
            c.fillStyle = '#fde047'; c.beginPath(); c.moveTo(x + cs * 0.4, y + cs * 0.66); c.quadraticCurveTo(x + cs * 0.38, y + cs * 0.45, x + cs * 0.52, y + cs * 0.38 - fl); c.quadraticCurveTo(x + cs * 0.66, y + cs * 0.5, x + cs * 0.6, y + cs * 0.66); c.closePath(); c.fill();
          }
          if (hq) { // дым
            var sp = (t * 0.55 + i * 0.37) % 1;
            c.fillStyle = 'rgba(71,85,105,' + ((1 - sp) * (st === 2 ? 0.45 : 0.25)).toFixed(3) + ')';
            c.beginPath(); c.arc(mx + Math.sin(t * 2 + i) * cs * 0.08, y + cs * 0.25 - sp * cs * 0.55, cs * (0.1 + sp * 0.16), 0, 6.283); c.fill();
          }
        }
      }
    }
    function drawCannon(c, seat, active) {
      var p = cannonPos(seat), r = Math.max(22, cs * 0.75), ang = cannonAng[seat];
      c.save(); c.translate(p.x, p.y);
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(4, r * 0.25, r * 1.05, r * 0.7, 0, 0, 6.283); c.fill();
      c.fillStyle = '#111827'; c.beginPath(); c.arc(0, 0, r, 0, 6.283); c.fill();
      c.fillStyle = TEAM[seat].dark; c.beginPath(); c.arc(0, 0, r * 0.82, 0, 6.283); c.fill();
      var cg = c.createRadialGradient(-r * 0.25, -r * 0.25, 1, 0, 0, r * 0.7); cg.addColorStop(0, TEAM[seat].light); cg.addColorStop(1, TEAM[seat].fill);
      c.fillStyle = cg; c.beginPath(); c.arc(0, 0, r * 0.7, 0, 6.283); c.fill();
      c.fillStyle = 'rgba(255,255,255,.55)';
      for (var rv = 0; rv < 8; rv++) { var ra = rv * 0.785; c.beginPath(); c.arc(Math.cos(ra) * r * 0.91, Math.sin(ra) * r * 0.91, 1.4, 0, 6.283); c.fill(); }
      c.rotate(ang);
      var g = c.createLinearGradient(0, -r * 0.4, 0, r * 0.4); g.addColorStop(0, '#4b5563'); g.addColorStop(0.5, '#9ca3af'); g.addColorStop(1, '#374151');
      c.fillStyle = '#111827'; rr(c, -r * 0.1, -r * 0.44, r * 1.55, r * 0.88, r * 0.3); c.fill();
      c.fillStyle = g; rr(c, -r * 0.02, -r * 0.34, r * 1.4, r * 0.68, r * 0.25); c.fill();
      c.fillStyle = '#111827'; c.beginPath(); c.ellipse(r * 1.38, 0, r * 0.12, r * 0.34, 0, 0, 6.283); c.fill();
      c.restore();
      if (!active) { c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.arc(p.x, p.y, r, 0, 6.283); c.fill(); }
    }
    function drawTurnBadge(c, seat, text) {
      rot(c, seat, function () {
        var R2 = Math.min(110, api.W * 0.3), cx = api.W / 2 - api.W * 0.18, cy = api.H + R2 * 0.42;
        c.fillStyle = TEAM[seat].dark; c.beginPath(); c.arc(cx, cy, R2 + 5, 0, 6.283); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(cx, cy, R2 + 2, 0, 6.283); c.fill();
        c.fillStyle = TEAM[seat].fill; c.beginPath(); c.arc(cx, cy, R2 - 3, 0, 6.283); c.fill();
        c.fillStyle = '#fff'; c.font = '900 ' + Math.round(R2 * 0.24) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(text, cx, cy - R2 * 0.62);
      });
    }
    function drawStrip(c) {
      var y0 = api.H / 2 - STRIP / 2;
      var sg = c.createLinearGradient(0, y0, 0, y0 + STRIP); sg.addColorStop(0, '#475569'); sg.addColorStop(0.1, '#1e293b'); sg.addColorStop(0.5, '#0f172a'); sg.addColorStop(0.9, '#1e293b'); sg.addColorStop(1, '#475569');
      c.fillStyle = sg; c.fillRect(0, y0, api.W, STRIP);
      c.globalAlpha = 0.28; c.fillStyle = TEAM[1].fill; c.fillRect(0, y0 + 3, api.W, STRIP / 2 - 4);
      c.fillStyle = TEAM[0].fill; c.fillRect(0, api.H / 2 + 1, api.W, STRIP / 2 - 4); c.globalAlpha = 1;
      c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(0, api.H / 2 - 0.5, api.W, 1);
      c.fillStyle = 'rgba(203,213,225,.35)';
      for (var rx = 8; rx < api.W; rx += 24) { c.beginPath(); c.arc(rx, y0 + 2.5, 1.2, 0, 6.283); c.arc(rx, y0 + STRIP - 2.5, 1.2, 0, 6.283); c.fill(); }
      // мини-флоты
      [1, 0].forEach(function (seat) {
        var b = boards[seat], x = 60, y = seat === 1 ? y0 + 6 : api.H / 2 + 6, h = STRIP / 2 - 12, k = h / 0.72 / cs * 0.9;
        var sc2 = Math.min(k, (api.W - 80) / (17 * cs + 40));
        b.ships.forEach(function (sh) {
          var known = !b.remote || true;
          c.save(); c.translate(x, y - cs * sc2 * 0.15); c.scale(sc2, sc2);
          drawShip(c, 0, 0, sh.len, sh.kind, true, TEAM[seat], sh.sunk ? 0.35 : 1, sh.sunk);
          c.restore();
          x += sh.len * cs * sc2 + 8;
        });
      });
      // счёт
      var cx = 30, cy = api.H / 2;
      c.fillStyle = '#0f172a'; c.beginPath(); c.arc(cx, cy, 26, 0, 6.283); c.fill();
      var scg = c.createLinearGradient(0, cy - 24, 0, cy + 24); scg.addColorStop(0, '#ffffff'); scg.addColorStop(1, '#cbd5e1');
      c.fillStyle = scg; c.beginPath(); c.arc(cx, cy, 24, 0, 6.283); c.fill();
      c.font = '900 13px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = TEAM[1].dark; c.fillText(String(scores[1]), cx, cy - 8);
      c.fillStyle = '#94a3b8'; c.fillText('·', cx, cy);
      c.fillStyle = TEAM[0].dark; c.fillText(String(scores[0]), cx, cy + 9);
    }
    function drawDeploy(c) {
      var b = boards[deploySeat], W = api.W, H = api.H;
      rot(c, api.mode === 1 ? deploySeat : 0, function () {
        // верх — инструкции
        c.drawImage(halfOff[deploySeat], 0, H / 2, W, H / 2); drawWaves(c);
        c.drawImage(topOff, 0, 0, W, H / 2 + STRIP / 2);
        c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(0, H / 2 + STRIP / 2 - 1, W, 1);
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
        c.font = '900 24px system-ui, sans-serif'; c.fillText(api.t('bs.deploy'), W / 2, H * 0.07);
        c.font = '700 13px system-ui, sans-serif'; c.fillStyle = 'rgba(255,255,255,.7)';
        c.fillText(api.t('bs.deployHint'), W / 2, H * 0.07 + 30);
        var br = deployButtons();
        c.fillStyle = '#0b3d7a'; rr(c, br.rnd.x, br.rnd.y + 3, br.rnd.w, br.rnd.h, 10); c.fill();
        var bgr = c.createLinearGradient(0, br.rnd.y, 0, br.rnd.y + br.rnd.h); bgr.addColorStop(0, '#3b8cf0'); bgr.addColorStop(1, '#1d5fc0');
        c.fillStyle = bgr; rr(c, br.rnd.x, br.rnd.y, br.rnd.w, br.rnd.h, 10); c.fill();
        c.fillStyle = 'rgba(255,255,255,.18)'; rr(c, br.rnd.x + 3, br.rnd.y + 2, br.rnd.w - 6, br.rnd.h * 0.4, 8); c.fill();
        c.fillStyle = '#fff'; c.font = '900 15px system-ui, sans-serif'; c.fillText(api.t('bs.random'), br.rnd.x + br.rnd.w / 2, br.rnd.y + br.rnd.h / 2);
        if (allPlaced(b) && !drag) {
          c.fillStyle = '#2f9e44'; rr(c, br.save.x, br.save.y + 4, br.save.w, br.save.h, 12); c.fill();
          var sgr = c.createLinearGradient(0, br.save.y, 0, br.save.y + br.save.h); sgr.addColorStop(0, '#5fd47a'); sgr.addColorStop(1, '#36a14f');
          c.fillStyle = sgr; rr(c, br.save.x, br.save.y, br.save.w, br.save.h, 12); c.fill();
          c.fillStyle = 'rgba(255,255,255,.2)'; rr(c, br.save.x + 4, br.save.y + 3, br.save.w - 8, br.save.h * 0.38, 9); c.fill();
          c.fillStyle = '#fff'; c.font = '900 20px system-ui, sans-serif'; c.fillText('⚡ ' + api.t('bs.save'), br.save.x + br.save.w / 2, br.save.y + br.save.h / 2);
        }
        // полка с кораблями
        var tray = trayLayout();
        var trg = c.createLinearGradient(0, tray.y, 0, tray.y + tray.h); trg.addColorStop(0, TEAM[deploySeat].sea[0]); trg.addColorStop(1, TEAM[deploySeat].sea[2]);
        c.fillStyle = '#020617'; rr(c, tray.x, tray.y + 3, tray.w, tray.h, 14); c.fill();
        c.fillStyle = trg; rr(c, tray.x, tray.y, tray.w, tray.h, 14); c.fill();
        c.strokeStyle = TEAM[deploySeat].fill; c.lineWidth = 2; c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 1;
        for (var tl = 1; tl < 4; tl++) { c.beginPath(); c.moveTo(tray.x + 10, tray.y + tray.h * tl / 4); c.lineTo(tray.x + tray.w - 10, tray.y + tray.h * tl / 4); c.stroke(); }
        tray.slots.forEach(function (sl) {
          var sh = b.ships[sl.i];
          c.save(); c.translate(sl.x, sl.y); c.scale(sl.k, sl.k);
          drawShip(c, 0, 0, sh.len, sh.kind, true, TEAM[deploySeat], sh.placed || (drag && drag.ship === sh) ? 0.25 : 1);
          c.restore();
        });
        // поле
        b.ships.forEach(function (sh) {
          if (!sh.placed || (drag && drag.ship === sh && drag.moved)) return;
          drawShip(c, gx + sh.c * cs, gy + sh.r * cs, sh.len, sh.kind, sh.h, TEAM[deploySeat], 1);
          // значок поворота
          var cx2 = gx + (sh.c + (sh.h ? sh.len / 2 : 0.5)) * cs, cy2 = gy + (sh.r + (sh.h ? 0.5 : sh.len / 2)) * cs;
          c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2;
          c.beginPath(); c.arc(cx2 + (sh.h ? 0 : cs * 0.55), cy2 - (sh.h ? cs * 0.55 : 0), cs * 0.16, 0.3, 5.2); c.stroke();
        });
        if (drag && drag.moved) {
          var sh2 = drag.ship, snap = dragSnap(), ok = snap && fits(b, sh2, snap.r, snap.c, sh2.h);
          if (snap) {
            cellsOf(sh2, snap.r, snap.c, sh2.h).forEach(function (z) {
              if (z[0] < 0 || z[1] < 0 || z[0] >= ROWS || z[1] >= COLS) return;
              c.fillStyle = ok ? 'rgba(74,222,128,.45)' : 'rgba(239,68,68,.45)'; rr(c, gx + z[1] * cs + 2, gy + z[0] * cs + 2, cs - 4, cs - 4, cs * 0.12); c.fill();
            });
          }
          drawShip(c, drag.x - drag.ox, drag.y - drag.oy, sh2.len, sh2.kind, sh2.h, TEAM[deploySeat], 0.92);
        }
      });
    }
    function deployButtons() {
      var W = api.W, H = api.H, bw = Math.min(150, W * 0.38);
      return { rnd: { x: (W - bw * 0.8) / 2, y: H * 0.07 + 54, w: bw * 0.8, h: 40 }, save: { x: (W - bw) / 2, y: H * 0.07 + 108, w: bw, h: 52 } };
    }
    function trayLayout() {
      var W = api.W, H = api.H, y = H * 0.07 + 172, h = H / 2 + STRIP / 2 - 10 - y, x = 10, w = W - 20;
      if (h < 50) { y = H / 2 - 50; h = 60; }
      // два ряда: 5+4 / 3+3+2
      var rows2 = [[0, 1], [2, 3, 4]], slots = [], k = Math.min((w - 40) / (9 * cs), (h - 16) / 2 / cs);
      rows2.forEach(function (row, ri) {
        var total = row.reduce(function (a, i) { return a + FLEET[i] * cs * k; }, 0) + (row.length - 1) * 14, xx = x + (w - total) / 2;
        row.forEach(function (i) {
          slots.push({ i: i, x: xx, y: y + 8 + ri * (h - 16) / 2 + ((h - 16) / 2 - cs * k) / 2, k: k, w: FLEET[i] * cs * k, h: cs * k });
          xx += FLEET[i] * cs * k + 14;
        });
      });
      return { x: x, y: y, w: w, h: h, slots: slots };
    }
    function dragSnap() {
      var x = drag.x - drag.ox, y = drag.y - drag.oy;
      return { r: Math.round((y - gy) / cs), c: Math.round((x - gx) / cs) };
    }
    function inR(p, r) { return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }

    /* ---------- бой ---------- */
    function startBattle() {
      phase = 'count'; phaseT = 0; shooter = 0;
      if (api.mode === 2 && !api.net.host) shooter = 1; // ходит хост
      cannonAng = [-Math.PI / 2, Math.PI / 2];
      api.sound('point');
    }
    function fireAt(seatShooter, idx) {
      var target = 1 - seatShooter, b = boards[target];
      if (b.shot[idx] || ball) return false;
      var from = cannonPos(seatShooter), to = cellCenterScreen(target, idx);
      cannonAng[seatShooter] = Math.atan2(to.y - from.y, to.x - from.x);
      aim = { seat: target, idx: idx };
      ball = { from: from, to: to, k: 0, seat: seatShooter, idx: idx, res: null };
      api.sound('jump'); api.vibrate(15);
      if (api.mode === 2 && seatShooter === 0) api.net.send({ k: 'fire', i: idx });
      if (!boards[target].remote) ball.res = resolve(target, idx);
      return true;
    }
    function resolve(seat, idx) { // для поля с известными кораблями
      var b = boards[seat], r = Math.floor(idx / COLS), c = idx % COLS, sh = shipAt(b, r, c);
      if (!sh) return { hit: false };
      sh.hits++;
      var sunk = sh.hits >= sh.len;
      if (sunk) sh.sunk = true;
      return { hit: true, sunk: sunk ? { kind: sh.kind, r: sh.r, c: sh.c, h: sh.h } : null, over: b.ships.every(function (s) { return s.sunk; }) };
    }
    // v2.0: серия попаданий даёт очки, после серии промахов на лёгких уровнях срабатывает сонар
    var streak = 0, missRun = 0, sonar = null;
    function land() {
      var bl = ball, b = boards[1 - bl.seat], res = bl.res, p = bl.to;
      ball = null; aim = null;
      var human = api.mode === 0 && bl.seat === 0;
      if (human) {
        if (res.hit) { streak++; missRun = 0; api.addScore(20 * streak); if (streak >= 2) api.fx.text(p.x, p.y - cs, api.t('bs.streak', streak), '#fde047', 18); }
        else { streak = 0; missRun++; }
        if (!res.hit && missRun >= 4 && api.diff <= 1) {
          var cand = [];
          b.ships.forEach(function (sh) { if (!sh.sunk) cellsOf(sh, sh.r, sh.c, sh.h).forEach(function (z) { var k = z[0] * COLS + z[1]; if (!b.shot[k]) cand.push(k); }); });
          if (cand.length) { sonar = { idx: cand[Math.floor(Math.random() * cand.length)], life: 2.6 }; missRun = 0; api.toast(api.t('bs.sonar')); api.sound('bonus'); }
        }
      }
      if (res.hit) {
        b.shot[bl.idx] = 2; scores[bl.seat]++;
        for (var i = 0; i < 14; i++) { var a = Math.random() * 6.283, v = 40 + Math.random() * 120; fx.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6, kind: i % 3 ? 'star' : 'smoke' }); }
        fx.push({ x: p.x, y: p.y, life: 0.55, kind: 'boom' });
        shake = 0.3; api.sound('stomp'); api.vibrate(seatHuman(1 - bl.seat) ? 120 : 40);
        if (res.sunk) {
          var s = res.sunk, sh = b.ships[s.kind];
          sh.sunk = true; sh.r = s.r; sh.c = s.c; sh.h = s.h; sh.placed = true;
          cellsOf(sh, s.r, s.c, s.h).forEach(function (z) { b.shot[z[0] * COLS + z[1]] = 3; });
          say(api.t('bs.sunk')); api.sound('break');
          api.fx.shake(6); if (human) { api.addScore(100 * sh.len); api.fx.burst(p.x, p.y, '#fb923c', 30, 260, 4); }
        } else say(api.t('bs.hit'));
        if (res.over) { winner = bl.seat; phase = 'over'; endT = 3; finish(); return; }
        phase = 'battle'; // попал — стреляет ещё
      } else {
        b.shot[bl.idx] = 1;
        fx.push({ x: p.x, y: p.y, life: 0.7, kind: 'splash' });
        for (var dq = 0; dq < (api.quality ? 10 : 4); dq++) { var da = Math.random() * 6.283, dv = 30 + Math.random() * 90; fx.push({ x: p.x, y: p.y, vx: Math.cos(da) * dv, vy: Math.sin(da) * dv - 30, life: 0.45 + Math.random() * 0.2, kind: 'drop' }); }
        api.sound('move'); say(api.t('bs.miss'));
        phase = 'switch'; phaseT = 0;
      }
    }
    function finish() {
      if (api.mode === 0) {
        if (winner === 0) {
          var b = boards[0], alive = 0;
          b.ships.forEach(function (s) { alive += s.sunk ? 0 : s.len - s.hits; });
          var shots = boards[1].shot.filter(function (v) { return v; }).length;
          api.addScore(1000 * (api.diff + 1) + alive * 60 + Math.round(scores[0] / Math.max(1, shots) * 600));
          api.sound('win');
        } else api.sound('over');
      } else api.sound(api.mode === 2 && winner === 1 ? 'over' : 'win');
    }
    function say(m) { msg = m; msgT = 1; }
    /* ИИ: стреляет по полю сиденья 0 */
    function aiPick() {
      var b = boards[0], d = api.diff, open = [];
      for (var i = 0; i < b.shot.length; i++) if (!b.shot[i]) open.push(i);
      if (d === 0 && Math.random() < 0.85) return open[Math.floor(Math.random() * open.length)];
      var hits = []; for (var k = 0; k < b.shot.length; k++) if (b.shot[k] === 2) hits.push(k);
      if (hits.length) {
        var cand = [];
        // продолжение линии
        hits.forEach(function (h) {
          [[0, 1], [1, 0]].forEach(function (dv) {
            var r = Math.floor(h / COLS), c = h % COLS;
            var nr = r + dv[0], nc = c + dv[1];
            if (nr < ROWS && nc < COLS && b.shot[nr * COLS + nc] === 2) {
              [[r - dv[0], c - dv[1]], [nr + dv[0], nc + dv[1]]].forEach(function (z) {
                var rr2 = z[0], cc = z[1];
                while (rr2 >= 0 && cc >= 0 && rr2 < ROWS && cc < COLS && b.shot[rr2 * COLS + cc] === 2) { rr2 += z[0] < r ? -dv[0] : dv[0]; cc += z[1] < c ? -dv[1] : dv[1]; }
                if (rr2 >= 0 && cc >= 0 && rr2 < ROWS && cc < COLS && !b.shot[rr2 * COLS + cc]) cand.push(rr2 * COLS + cc);
              });
            }
          });
        });
        if (!cand.length) hits.forEach(function (h) {
          [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (dv) {
            var r = Math.floor(h / COLS) + dv[0], c = h % COLS + dv[1];
            if (r >= 0 && c >= 0 && r < ROWS && c < COLS && !b.shot[r * COLS + c]) cand.push(r * COLS + c);
          });
        });
        if (cand.length) return cand[Math.floor(Math.random() * cand.length)];
      }
      if (d <= 1) return open[Math.floor(Math.random() * open.length)];
      var left = b.ships.filter(function (s) { return !s.sunk; }).map(function (s) { return s.len; });
      if (d === 2) {
        var par = open.filter(function (i2) { return (Math.floor(i2 / COLS) + i2 % COLS) % 2 === 0; });
        return (par.length ? par : open)[Math.floor(Math.random() * (par.length || open.length))];
      }
      var heat = b.shot.map(function () { return 0; });
      left.forEach(function (len) {
        for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) for (var o = 0; o < 2; o++) {
          var cells = [], ok = true;
          for (var q = 0; q < len; q++) { var rr3 = r + (o ? q : 0), cc3 = c + (o ? 0 : q); if (rr3 >= ROWS || cc3 >= COLS || b.shot[rr3 * COLS + cc3] === 1 || b.shot[rr3 * COLS + cc3] === 3) { ok = false; break; } cells.push(rr3 * COLS + cc3); }
          if (ok) cells.forEach(function (ci) { heat[ci]++; });
        }
      });
      var best = open[0], bv = -1;
      open.forEach(function (i3) { var v = heat[i3] + Math.random() * 0.3; if (v > bv) { bv = v; best = i3; } });
      return best;
    }

    /* ---------- ввод ---------- */
    function deployInput(type, d) {
      var b = boards[deploySeat], p = localPt(api.mode === 1 ? deploySeat : 0, d.x, d.y);
      if (type === 'down') {
        // корабль на поле?
        var c = Math.floor((p.x - gx) / cs), r = Math.floor((p.y - gy) / cs), sh = null, ox = 0, oy = 0;
        if (r >= 0 && c >= 0 && r < ROWS && c < COLS) { sh = shipAt(b, r, c); if (sh) { ox = p.x - (gx + sh.c * cs); oy = p.y - (gy + sh.r * cs); } }
        if (!sh) {
          trayLayout().slots.forEach(function (sl) {
            var s2 = b.ships[sl.i];
            if (!s2.placed && p.x >= sl.x - 6 && p.x <= sl.x + sl.w + 6 && p.y >= sl.y - 10 && p.y <= sl.y + sl.h + 10) { sh = s2; s2.h = true; ox = (p.x - sl.x) / sl.k; oy = cs / 2; }
          });
        }
        if (sh) drag = { ship: sh, x: p.x, y: p.y, sx: p.x, sy: p.y, ox: ox, oy: oy, moved: false };
      } else if (type === 'move' && drag) {
        drag.x = p.x; drag.y = p.y;
        if (Math.hypot(p.x - drag.sx, p.y - drag.sy) > 8) drag.moved = true;
      } else if (type === 'up') {
        if (drag) {
          var s3 = drag.ship;
          if (!drag.moved) {
            if (s3.placed) { // поворот
              var nh = !s3.h, done = false;
              for (var sh2 = 0; sh2 < s3.len && !done; sh2++) {
                var tr = nh ? s3.r : s3.r - sh2, tc = nh ? s3.c - sh2 : s3.c;
                if (fits(b, s3, tr, tc, nh)) { s3.r = tr; s3.c = tc; s3.h = nh; done = true; }
              }
              api.sound(done ? 'rotate' : 'hit'); api.vibrate(done ? 10 : 40);
            }
          } else {
            var sn = dragSnap();
            if (fits(b, s3, sn.r, sn.c, s3.h)) { s3.r = sn.r; s3.c = sn.c; s3.placed = true; api.sound('move'); api.vibrate(10); }
            else api.sound('hit');
          }
          drag = null;
          return;
        }
        var br = deployButtons();
        if (inR(p, br.rnd)) { randomize(b); api.sound('rotate'); }
        else if (inR(p, br.save) && allPlaced(b)) { api.sound('click'); deployDone(); }
      }
    }
    function deployDone() {
      if (api.mode === 1 && deploySeat === 0) { phase = 'pass'; phaseT = 0; return; }
      if (api.mode === 2) { ready[0] = true; api.net.send({ k: 'ready' }); phase = ready[1] ? 'battleInit' : 'waitPeer'; if (ready[1]) startBattle(); return; }
      startBattle();
    }

    return {
      reset: function () {
        layout();
        boards = [newBoard(), newBoard()];
        randomize(boards[1]);
        if (api.mode === 2) { boards[1].remote = true; boards[1].ships.forEach(function (s) { s.placed = false; }); }
        phase = 'deploy'; deploySeat = 0; drag = null; ball = null; fx = []; t = 0; phaseT = 0; endT = 0; winner = null;
        netQ = []; aiState = null; ready = [false, false]; scores = [0, 0]; aim = null; shake = 0; msg = ''; msgT = 0; cannonAng = [-Math.PI / 2, Math.PI / 2];
        streak = 0; missRun = 0; sonar = null;
      },
      resize: layout,
      netMsg: function (d) { netQ.push(d); },
      idle: function (dt) { t += dt; },
      key: function () { },
      input: function (type, d) {
        if (endT > 0) return;
        if (phase === 'deploy') { deployInput(type, d); return; }
        if (type !== 'tap') return;
        if (phase === 'pass') { if (phaseT < 0.4) return; phase = 'deploy'; deploySeat = 1; randomize(boards[1]); boards[1].ships.forEach(function (s) { s.placed = false; }); api.sound('click'); return; }
        if (phase !== 'battle' || ball) return;
        if (!seatHuman(shooter) || (api.mode === 2 && shooter !== 0)) return;
        var target = 1 - shooter, p = localPt(target, d.x, d.y);
        var c = Math.floor((p.x - gx) / cs), r = Math.floor((p.y - gy) / cs);
        if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return;
        if (!fireAt(shooter, r * COLS + c)) api.sound('hit');
        else phase = 'flying';
      },
      update: function (dt) {
        if (sonar) { sonar.life -= dt; if (sonar.life <= 0) sonar = null; }
        t += dt; phaseT += dt;
        if (msgT > 0) msgT -= dt;
        if (shake > 0) shake -= dt;
        fx = fx.filter(function (f) { f.life -= dt; if (f.vx != null) { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.92; f.vy *= 0.92; } return f.life > 0; });
        // сетевые сообщения
        while (api.mode === 2 && netQ.length) {
          var m = netQ[0];
          if (m.k === 'ready') { netQ.shift(); ready[1] = true; if (ready[0] && phase === 'waitPeer') startBattle(); continue; }
          if (m.k === 'fire') { // соперник стреляет по моему полю
            if (phase !== 'battle' || shooter !== 1 || ball) break;
            netQ.shift();
            fireAt(1, m.i);
            var rs = ball.res;
            api.net.send({ k: 'res', i: m.i, hit: rs.hit, sunk: rs.sunk, over: rs.over || false });
            phase = 'flying';
            continue;
          }
          if (m.k === 'res') {
            if (!ball || ball.seat !== 0 || ball.idx !== m.i) break;
            netQ.shift();
            ball.res = { hit: m.hit, sunk: m.sunk, over: m.over };
            continue;
          }
          netQ.shift();
        }
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (phase === 'count' && phaseT > 3) { phase = 'battle'; phaseT = 0; api.sound('jump'); }
        if (ball) {
          ball.k = Math.min(1, ball.k + dt / 0.7);
          if (ball.k >= 1 && ball.res) land();
        }
        if (phase === 'flying' && !ball && phase !== 'over') phase = 'battle';
        if (phase === 'switch' && phaseT > 0.8) { shooter = 1 - shooter; phase = 'battle'; phaseT = 0; }
        if (phase === 'battle' && api.mode === 0 && shooter === 1 && !ball && phaseT > 0.7) {
          if (aiState == null) aiState = aiPick();
          var idx = aiState;
          var from = cannonPos(1), to = cellCenterScreen(0, idx), want = Math.atan2(to.y - from.y, to.x - from.x);
          cannonAng[1] += (want - cannonAng[1]) * Math.min(1, dt * 6);
          if (phaseT > 1.2) { aiState = null; fireAt(1, idx); phase = 'flying'; phaseT = 0; }
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        c.fillStyle = '#1e293b'; c.fillRect(0, 0, W, H);
        if (phase === 'deploy') { drawDeploy(c); return; }
        if (phase === 'pass' || phase === 'waitPeer') {
          var nextSeat = phase === 'pass' ? 1 : 0;
          rot(c, 1, function () { c.drawImage(halfOff[1], 0, H / 2, W, H / 2); }); c.drawImage(halfOff[0], 0, H / 2, W, H / 2);
          c.fillStyle = 'rgba(2,6,23,.45)'; c.fillRect(0, 0, W, H);
          rot(c, api.mode === 1 ? nextSeat : 0, function () {
            c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 24px system-ui, sans-serif';
            var lines = phase === 'pass' ? api.t('bs.passScreen').split('\n') : [api.t('bs.waitPeer')];
            lines.forEach(function (ln, i) { c.fillText(ln, W / 2, H * 0.4 + i * 32); });
            if (phase === 'pass') {
              c.fillStyle = '#fff'; rr(c, W / 2 - 70, H * 0.58, 140, 74, 18); c.fill();
              c.fillStyle = '#2f9e44'; rr(c, W / 2 - 58, H * 0.58 + 12, 116, 50, 10); c.fill();
              c.fillStyle = '#fff'; c.font = '900 20px system-ui, sans-serif'; c.fillText('OK', W / 2, H * 0.58 + 37);
            } else {
              c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.arc(W / 2, H * 0.55, 18, t * 5, t * 5 + 4.5); c.stroke();
            }
          });
          return;
        }
        c.save();
        if (shake > 0) c.translate((Math.random() - 0.5) * 12 * shake, (Math.random() - 0.5) * 12 * shake);
        // половины
        [0, 1].forEach(function (seat) {
          rot(c, seat, function () {
            var underFire = phase !== 'count' && shooter !== seat && phase !== 'over';
            drawHalfBg(c, seat, underFire ? 0 : 0.08);
            var b = boards[seat];
            // свои корабли видны только после конца игры (или потопленные)
            b.ships.forEach(function (sh) {
              if (!sh.placed) return;
              if (sh.sunk) drawShip(c, gx + sh.c * cs, gy + sh.r * cs, sh.len, sh.kind, sh.h, TEAM[seat], 0.9, true);
              else if (phase === 'over' || (seat === 0 && api.mode !== 1 && !b.remote)) drawShip(c, gx + sh.c * cs, gy + sh.r * cs, sh.len, sh.kind, sh.h, TEAM[seat], 0.55);
            });
            drawShots(c, seat, b);
            if (aim && aim.seat === seat) {
              var ar = Math.floor(aim.idx / COLS), ac = aim.idx % COLS, ax = gx + (ac + 0.5) * cs, ay = gy + (ar + 0.5) * cs;
              c.strokeStyle = '#fff'; c.lineWidth = 2.5;
              c.beginPath(); c.arc(ax, ay, cs * 0.32, 0, 6.283); c.moveTo(ax - cs * 0.5, ay); c.lineTo(ax + cs * 0.5, ay); c.moveTo(ax, ay - cs * 0.5); c.lineTo(ax, ay + cs * 0.5); c.stroke();
            }
            if (phase === 'count') {
              c.fillStyle = 'rgba(255,255,255,.9)'; c.font = '900 ' + Math.round(H * 0.16) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
              c.fillText(String(3 - Math.floor(phaseT)), W / 2, H * 0.75);
            }
          });
        });
        drawStrip(c);
        drawCannon(c, 0, shooter === 0 && phase !== 'over');
        drawCannon(c, 1, shooter === 1 && phase !== 'over');
        // ядро
        if (ball) {
          var k = ball.k, x = ball.from.x + (ball.to.x - ball.from.x) * k, y = ball.from.y + (ball.to.y - ball.from.y) * k, sc = 1 + Math.sin(k * Math.PI) * 0.9;
          c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.arc(x + 8 * sc, y + 10 * sc, cs * 0.3, 0, 6.283); c.fill();
          if (api.quality > 0) for (var tr = 1; tr <= 5; tr++) {
            var kk = Math.max(0, k - tr * 0.045), tx = ball.from.x + (ball.to.x - ball.from.x) * kk, ty = ball.from.y + (ball.to.y - ball.from.y) * kk;
            c.fillStyle = 'rgba(226,232,240,' + (0.32 - tr * 0.055).toFixed(3) + ')'; c.beginPath(); c.arc(tx, ty, cs * (0.18 + tr * 0.04) * (1 + Math.sin(kk * Math.PI) * 0.9), 0, 6.283); c.fill();
          }
          var g = c.createRadialGradient(x - cs * 0.12 * sc, y - cs * 0.12 * sc, 2, x, y, cs * 0.32 * sc);
          g.addColorStop(0, '#9ca3af'); g.addColorStop(0.4, '#4b5563'); g.addColorStop(1, '#0b1020');
          c.fillStyle = g; c.beginPath(); c.arc(x, y, cs * 0.32 * sc, 0, 6.283); c.fill();
        }
        fx.forEach(function (f) {
          var a = Math.max(0, f.life / 0.6);
          if (f.kind === 'boom') {
            var bk = 1 - f.life / 0.55;
            c.fillStyle = 'rgba(255,237,160,' + (1 - bk) * 0.9 + ')'; c.beginPath(); c.arc(f.x, f.y, cs * (0.3 + bk * 0.5), 0, 6.283); c.fill();
            c.strokeStyle = 'rgba(249,115,22,' + (1 - bk) + ')'; c.lineWidth = 4 * (1 - bk) + 1; c.beginPath(); c.arc(f.x, f.y, cs * (0.4 + bk * 1.3), 0, 6.283); c.stroke();
            return;
          }
          if (f.kind === 'drop') {
            c.fillStyle = 'rgba(186,230,253,' + Math.min(1, f.life * 2.2) + ')'; c.beginPath(); c.arc(f.x, f.y, cs * 0.07 + f.life * 3, 0, 6.283); c.fill();
            return;
          }
          if (f.kind === 'splash') {
            c.strokeStyle = 'rgba(255,255,255,' + f.life + ')'; c.lineWidth = 3;
            c.beginPath(); c.arc(f.x, f.y, cs * (1.1 - f.life), 0, 6.283); c.stroke();
            c.fillStyle = 'rgba(255,255,255,' + f.life * 0.5 + ')';
            for (var q = 0; q < 6; q++) { var an = q * 1.047; c.beginPath(); c.arc(f.x + Math.cos(an) * cs * (0.8 - f.life * 0.5), f.y + Math.sin(an) * cs * (0.8 - f.life * 0.5), cs * 0.12, 0, 6.283); c.fill(); }
          } else if (f.kind === 'star') {
            c.globalAlpha = a; c.fillStyle = f.life > 0.35 ? '#fde047' : '#f97316';
            c.save(); c.translate(f.x, f.y); c.rotate(t * 6);
            c.beginPath(); for (var s = 0; s < 8; s++) { var rr4 = s % 2 ? cs * 0.08 : cs * 0.22, an2 = s * Math.PI / 4; c.lineTo(Math.cos(an2) * rr4, Math.sin(an2) * rr4); } c.closePath(); c.fill();
            c.restore(); c.globalAlpha = 1;
          } else { c.fillStyle = 'rgba(148,163,184,' + a * 0.6 + ')'; c.beginPath(); c.arc(f.x, f.y, cs * (0.5 - a * 0.3), 0, 6.283); c.fill(); }
        });
        c.restore();
        if (sonar) {
          var sr0 = Math.floor(sonar.idx / COLS), sc0 = sonar.idx % COLS, off = [Math.floor(Math.random() * 0), 0];
          var cr = Math.max(0, Math.min(ROWS - 3, sr0 - 1 + ((sonar.idx * 7) % 3) - 1)), cc = Math.max(0, Math.min(COLS - 3, sc0 - 1 + ((sonar.idx * 5) % 3) - 1));
          var a0 = cellCenterScreen(1, cr * COLS + cc), a1 = cellCenterScreen(1, (cr + 2) * COLS + cc + 2);
          var x0 = Math.min(a0.x, a1.x) - cs / 2, y0 = Math.min(a0.y, a1.y) - cs / 2;
          c.strokeStyle = 'rgba(74,222,128,' + Math.min(1, sonar.life) + ')'; c.lineWidth = 3; c.setLineDash([6, 4]);
          c.strokeRect(x0, y0, cs * 3, cs * 3); c.setLineDash([]);
          c.fillStyle = 'rgba(74,222,128,' + Math.min(0.18, sonar.life * 0.1) + ')'; c.fillRect(x0, y0, cs * 3, cs * 3);
        }
        // плашка хода
        if (phase === 'battle' || phase === 'flying' || phase === 'switch') {
          if (seatHuman(shooter) && !(api.mode === 2 && shooter === 1)) drawTurnBadge(c, api.mode === 1 ? shooter : 0, api.t('g.yourTurn'));
          else {
            c.fillStyle = 'rgba(0,0,0,.35)'; rr(c, W / 2 - 80, 8, 160, 30, 15); c.fill();
            c.fillStyle = '#fff'; c.font = '800 13px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
            c.fillText(api.mode === 2 ? api.t('net.oppTurn') : api.t('g.cpuTurn'), W / 2, 23);
          }
        }
        if (msgT > 0 && ball == null) {
          var tg = shooter === 0 ? 1 : 0;
          rot(c, api.mode === 1 ? shooter : 0, function () {
            c.globalAlpha = Math.min(1, msgT * 2); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 30px system-ui, sans-serif';
            c.lineWidth = 6; c.lineJoin = 'round'; c.strokeStyle = 'rgba(15,23,42,.7)';
            var my = api.mode === 1 ? H * 0.25 : (tg === 1 ? H * 0.25 : H * 0.75);
            c.strokeText(msg, W / 2, my); c.fillStyle = '#fff'; c.fillText(msg, W / 2, my); c.globalAlpha = 1;
          });
        }
        if (phase === 'over') {
          [0, 1].forEach(function (seat) {
            if (api.mode !== 1 && seat === 1) return;
            rot(c, seat, function () {
              c.fillStyle = 'rgba(15,23,42,.55)'; c.fillRect(0, H * 0.68, W, 64);
              c.fillStyle = '#fde047'; c.font = '900 26px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
              c.fillText(api.t(winner === seat ? 'g.win' : 'g.lose'), W / 2, H * 0.68 + 32);
            });
          });
        }
      }
    };
  }
};
