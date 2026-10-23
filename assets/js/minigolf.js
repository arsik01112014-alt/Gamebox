/* Мини-гольф: 9 лунок, рогатка-прицел, мельницы, вода, песок, горки, телепорты */
window.GAMES = window.GAMES || {};
window.GAMES.minigolf = {
  title: 'Мини-гольф',
  desc: '9 лунок с мельницами и телепортами',
  hint: 'Потяни назад от мяча и отпусти — чем дальше тянешь, тем сильнее удар. Отскакивай от бортиков, обходи мельницу, избегай воды (+1 удар) и песка (тормозит). Стрелки на газоне — уклон, порталы переносят мяч. Очки за лунку: пар — 50, бёрди — 75, игл — 100, с одного удара — 150.',
  d0: 'Большая лунка, линия траектории', d1: 'Короткая подсказка прицела', d2: 'Без подсказок, препятствия быстрее', d3: 'Маленькая лунка, быстрый газон',
  colors: ['#16a34a', '#0f172a'],
  controls: 'none',
  isNew4: true,
  cat: 'arcade',
  medals: [300, 450, 600],
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="minigolfG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4ade80"/><stop offset="1" stop-color="#15803d"/></linearGradient>' +
    '<radialGradient id="minigolfB" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#e2e8f0"/><stop offset="1" stop-color="#94a3b8"/></radialGradient>' +
    '<linearGradient id="minigolfW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d97706"/><stop offset="1" stop-color="#78350f"/></linearGradient></defs>' +
    '<rect width="100" height="100" rx="18" fill="#14532d"/><rect x="10" y="10" width="80" height="80" rx="10" fill="url(#minigolfW)"/><rect x="15" y="14" width="70" height="70" rx="7" fill="url(#minigolfG)"/>' +
    '<path d="M15 34l20-20h12L15 46zM15 58l44-44h12L15 70zM29 84l56-56v12L41 84zM53 84l32-32v12L65 84z" fill="#fff" opacity=".09"/>' +
    '<ellipse cx="62" cy="34" rx="7" ry="5" fill="#052e16"/><ellipse cx="62" cy="33" rx="5.5" ry="3.6" fill="#000" opacity=".6"/>' +
    '<path d="M63 33V8" stroke="#e2e8f0" stroke-width="2"/><path d="M64 8c6 2 9-1 15 1v10c-6-2-9 1-15-1z" fill="#ef4444"/>' +
    '<path d="M34 72l18-24" stroke="#fde047" stroke-width="2.5" stroke-dasharray="3 3" stroke-linecap="round"/>' +
    '<ellipse cx="32" cy="77" rx="7" ry="3" fill="#000" opacity=".35"/><circle cx="30" cy="72" r="6.5" fill="url(#minigolfB)"/></svg>',

  create: function (api) {
    var BR = 2, WR = 1.6, CW = 100, CH = 172;
    var DIFF = [
      { cupR: 4.4, sinkV: 150, prev: 2, fric: 1, obst: 0.75, extra: 6 },
      { cupR: 3.6, sinkV: 115, prev: 1, fric: 1, obst: 1, extra: 5 },
      { cupR: 3.3, sinkV: 100, prev: 0, fric: 0.92, obst: 1.25, extra: 4 },
      { cupR: 3, sinkV: 85, prev: 0, fric: 0.85, obst: 1.5, extra: 4 }
    ];
    function R(x, y, w, h) { return { r: [x, y, w, h] }; }
    function E(x, y, rx, ry) { return { e: [x, y, rx, ry] }; }
    function Cc(x, y, r) { return { c: [x, y, r] }; }
    var HOLES = [
      { par: 2, mat: 'wood', tee: [50, 146], cup: [50, 38], out: [[[32, 20], [68, 20], [75, 27], [75, 153], [68, 160], [32, 160], [25, 153], [25, 27]]], bump: [[50, 92, 4.5]], sand: [E(63, 58, 7, 5)] },
      { par: 3, mat: 'brick', tee: [76, 146], cup: [24, 40], out: [[[60, 160], [92, 160], [92, 38], [74, 20], [10, 20], [10, 60], [60, 60]]], sand: [E(44, 33, 6, 8)], bump: [[76, 92, 3]] },
      { par: 3, mat: 'wood', tee: [50, 148], cup: [50, 36], out: [[[38, 20], [62, 20], [72, 30], [72, 160], [28, 160], [28, 30]]], mill: { x: 50, y: 90, len: 21, sp: 1.5, hub: 5 }, bump: [[37, 56, 3], [63, 56, 3]] },
      { par: 3, mat: 'stone', tee: [50, 146], cup: [28, 38], out: [[[18, 20], [82, 20], [88, 26], [88, 154], [82, 160], [18, 160], [12, 154], [12, 26]]], water: [R(12, 72, 31, 28), R(57, 72, 31, 28)], sand: [E(70, 42, 9, 7)] },
      { par: 3, mat: 'brick', tee: [30, 146], cup: [38, 38], out: [[[30, 20], [70, 20], [88, 40], [88, 160], [12, 160], [12, 40]]], slope: [{ s: R(12, 76, 76, 34), ax: 55, ay: 0 }], funnel: { x: 38, y: 38, r: 15, k: 45 }, bump: [[62, 132, 3.5]] },
      { par: 3, mat: 'wood', tee: [60, 148], cup: [64, 32], out: [[[12, 104], [88, 104], [88, 160], [12, 160]], [[12, 20], [88, 20], [88, 86], [12, 86]]], tele: [{ a: [76, 118], b: [24, 74] }, { a: [18, 110], b: [80, 74] }], bump: [[29, 113, 3]], sand: [E(42, 44, 8, 6)] },
      { par: 3, mat: 'stone', tee: [70, 148], cup: [30, 34], out: [[[21, 20], [85, 20], [85, 154], [79, 160], [15, 160], [15, 26]]], walls: [[[15, 120], [56, 106]], [[85, 72], [44, 58]]], mover: { a: [26, 89], b: [44, 89], amp: [22, 0], sp: 1.3 }, sand: [E(70, 38, 8, 6)] },
      { par: 3, mat: 'stone', tee: [50, 148], cup: [50, 42], out: [[[16, 20], [84, 20], [90, 26], [90, 154], [84, 160], [16, 160], [10, 154], [10, 26]]], water: [{ r: [10, 22, 80, 66], minus: [Cc(50, 44, 19), R(43, 60, 14, 30)] }], bump: [[37, 122, 3.5], [63, 122, 3.5]] },
      { par: 4, mat: 'brick', tee: [25, 148], cup: [75, 108], out: [[[10, 160], [40, 160], [40, 48], [60, 48], [60, 122], [90, 122], [90, 30], [75, 15], [25, 15], [10, 30]]], mill: { x: 25, y: 100, len: 13.5, sp: 2, hub: 3.5 }, slope: [{ s: R(60, 62, 30, 38), ax: 0, ay: -42 }], tele: [{ a: [17, 60], b: [83, 38] }], sand: [E(50, 26, 7, 5)] }
    ];
    var D, hole, hi, ball, strokes, state, stT, holeT, t, s, ox, oy, courseC = null, courseKey = '', aim, label, results, lastPos, stillT, teleCd, millA, trail, ripples, sinkP, bounceT, total;

    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function mkC(w, h) {
      var dpr = Math.min(2, window.devicePixelRatio || 1), cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.ceil(w * dpr)); cv.height = Math.max(1, Math.ceil(h * dpr));
      var x = cv.getContext('2d'); x.scale(dpr, dpr); return { cv: cv, x: x };
    }
    function rrect(c, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
    }
    function seeded(sd) { return function () { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }; }
    function layout() {
      var W = api.W, H = api.H, top = 74;
      s = Math.min((W - 14) / CW, (H - top - 8) / CH);
      ox = (W - CW * s) / 2; oy = top + (H - top - 8 - CH * s) / 2;
    }
    function SX(x) { return ox + x * s; }
    function SY(y) { return oy + y * s; }

    /* ---------- геометрия ---------- */
    function inShape(sh, x, y) {
      var ok = false, i;
      if (sh.r) ok = x >= sh.r[0] && x <= sh.r[0] + sh.r[2] && y >= sh.r[1] && y <= sh.r[1] + sh.r[3];
      else if (sh.e) { var dx = (x - sh.e[0]) / sh.e[2], dy = (y - sh.e[1]) / sh.e[3]; ok = dx * dx + dy * dy <= 1; }
      else if (sh.c) ok = (x - sh.c[0]) * (x - sh.c[0]) + (y - sh.c[1]) * (y - sh.c[1]) <= sh.c[2] * sh.c[2];
      if (ok && sh.minus) for (i = 0; i < sh.minus.length; i++) if (inShape(sh.minus[i], x, y)) return false;
      return ok;
    }
    function shapePath(c, sh, rad) {
      if (sh.r) rrect(c, sh.r[0], sh.r[1], sh.r[2], sh.r[3], rad);
      else if (sh.e) { c.moveTo(sh.e[0] + sh.e[2], sh.e[1]); c.ellipse(sh.e[0], sh.e[1], sh.e[2], sh.e[3], 0, 0, 6.283); }
      else if (sh.c) { c.moveTo(sh.c[0] + sh.c[2], sh.c[1]); c.arc(sh.c[0], sh.c[1], sh.c[2], 0, 6.283); }
      if (sh.minus) for (var i = 0; i < sh.minus.length; i++) shapePath(c, sh.minus[i], rad);
    }
    function inPoly(p, x, y) {
      var ins = false;
      for (var i = 0, j = p.length - 1; i < p.length; j = i++) {
        if (((p[i][1] > y) !== (p[j][1] > y)) && (x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0])) ins = !ins;
      }
      return ins;
    }
    function onCourse(x, y) { for (var i = 0; i < hole.out.length; i++) if (inPoly(hole.out[i], x, y)) return true; return false; }
    function segDist(px, py, ax, ay, bx, by) {
      var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, u = l2 ? clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1) : 0;
      return Math.hypot(px - ax - dx * u, py - ay - dy * u);
    }
    function staticSegs() {
      var segs = [], i, j, p;
      for (i = 0; i < hole.out.length; i++) { p = hole.out[i]; for (j = 0; j < p.length; j++) { var q = p[(j + 1) % p.length]; segs.push([p[j][0], p[j][1], q[0], q[1], WR, 0.72]); } }
      if (hole.walls) for (i = 0; i < hole.walls.length; i++) { p = hole.walls[i]; for (j = 0; j + 1 < p.length; j++) segs.push([p[j][0], p[j][1], p[j + 1][0], p[j + 1][1], WR, 0.72]); }
      return segs;
    }
    var SEGS = [];
    function collideSeg(b, ax, ay, bx, by, rad, e, ux, uy) {
      var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, u = l2 ? clamp(((b.x - ax) * dx + (b.y - ay) * dy) / l2, 0, 1) : 0;
      var cx = ax + dx * u, cy = ay + dy * u, nx = b.x - cx, ny = b.y - cy, d = Math.sqrt(nx * nx + ny * ny), m = BR + rad;
      if (d >= m || d < 1e-6) return 0;
      nx /= d; ny /= d; b.x = cx + nx * m; b.y = cy + ny * m;
      var rvx = b.vx - (ux || 0), rvy = b.vy - (uy || 0), vn = rvx * nx + rvy * ny;
      if (vn < 0) { b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; return -vn; }
      return 0;
    }
    function collideCirc(b, x, y, r, e) {
      var nx = b.x - x, ny = b.y - y, d = Math.sqrt(nx * nx + ny * ny), m = BR + r;
      if (d >= m || d < 1e-6) return 0;
      nx /= d; ny /= d; b.x = x + nx * m; b.y = y + ny * m;
      var vn = b.vx * nx + b.vy * ny;
      if (vn < 0) { b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; return -vn; }
      return 0;
    }
    function accelAt(x, y) {
      var ax = 0, ay = 0, i;
      if (hole.slope) for (i = 0; i < hole.slope.length; i++) if (inShape(hole.slope[i].s, x, y)) { ax += hole.slope[i].ax; ay += hole.slope[i].ay; }
      if (hole.funnel) {
        var f = hole.funnel, dx = f.x - x, dy = f.y - y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < f.r && d > 0.5) { var k = f.k * (1 - d / f.r) + 6; ax += dx / d * k; ay += dy / d * k; }
      }
      return [ax, ay];
    }
    function inSand(x, y) { if (hole.sand) for (var i = 0; i < hole.sand.length; i++) if (inShape(hole.sand[i], x, y)) return true; return false; }
    function inWater(x, y) { if (hole.water) for (var i = 0; i < hole.water.length; i++) if (inShape(hole.water[i], x, y)) return true; return false; }
    function friction(b, h) {
      var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy); if (sp < 1e-4) return;
      var sand = inSand(b.x, b.y), dec = (sand ? 190 : 52 * D.fric) * h + sp * (sand ? 2.5 : 0.35) * h, ns = Math.max(0, sp - dec) / sp;
      b.vx *= ns; b.vy *= ns;
    }
    function millSegs() {
      var m = hole.mill, out = [];
      if (!m) return out;
      var w = m.sp * D.obst;
      for (var k = 0; k < 4; k++) { var a = millA + k * Math.PI / 2; out.push([m.x, m.y, m.x + Math.cos(a) * m.len, m.y + Math.sin(a) * m.len, 1.1, w]); }
      return out;
    }
    function moverPos() {
      var m = hole.mover; if (!m) return null;
      var w = m.sp * D.obst, o = Math.sin(t * w), v = Math.cos(t * w) * w;
      return { ax: m.a[0] + m.amp[0] * o * 0.5, ay: m.a[1] + m.amp[1] * o * 0.5, bx: m.b[0] + m.amp[0] * o * 0.5, by: m.b[1] + m.amp[1] * o * 0.5, ux: m.amp[0] * v * 0.5, uy: m.amp[1] * v * 0.5 };
    }
    function bounceSnd(v, kind) {
      if (bounceT > 0 || v < 12) return; bounceT = 0.05;
      if (kind === 1) api.tone(520 + Math.min(300, v * 2), 0.09, 'sine', Math.min(0.09, 0.02 + v * 0.0006));
      else api.tone(230 + Math.random() * 40, 0.05, 'square', Math.min(0.06, 0.012 + v * 0.0004));
    }
    function physStep(b, h, sim) {
      var a = accelAt(b.x, b.y), i, v;
      b.vx += a[0] * h; b.vy += a[1] * h;
      friction(b, h);
      // притяжение лунки
      var cdx = hole.cup[0] - b.x, cdy = hole.cup[1] - b.y, cd = Math.sqrt(cdx * cdx + cdy * cdy);
      if (cd < D.cupR * 1.5 && cd > 0.01) { b.vx += cdx / cd * 40 * h; b.vy += cdy / cd * 40 * h; }
      b.x += b.vx * h; b.y += b.vy * h;
      for (i = 0; i < SEGS.length; i++) { var sg = SEGS[i]; v = collideSeg(b, sg[0], sg[1], sg[2], sg[3], sg[4], sg[5]); if (v && !sim) bounceSnd(v, 0); if (v && sim) b.hits = (b.hits || 0) + 1; }
      if (hole.bump) for (i = 0; i < hole.bump.length; i++) { var bp = hole.bump[i]; v = collideCirc(b, bp[0], bp[1], bp[2], 0.88); if (v && !sim) { bounceSnd(v, 1); bp.flash = 1; } if (v && sim) b.hits = (b.hits || 0) + 1; }
      if (sim) return;
      if (hole.mill) {
        var ms = millSegs(), w = ms.length ? ms[0][5] : 0, m = hole.mill;
        v = collideCirc(b, m.x, m.y, m.hub, 0.6); if (v) bounceSnd(v, 0);
        for (i = 0; i < ms.length; i++) {
          var sg2 = ms[i], rx = b.x - m.x, ry = b.y - m.y;
          v = collideSeg(b, sg2[0], sg2[1], sg2[2], sg2[3], sg2[4], 0.5, -ry * w, rx * w); if (v) bounceSnd(v, 0);
        }
      }
      var mp = moverPos();
      if (mp) { v = collideSeg(b, mp.ax, mp.ay, mp.bx, mp.by, 2.2, 0.75, mp.ux, mp.uy); if (v) bounceSnd(v, 0); }
    }

    /* ---------- слой поля ---------- */
    function buildCourse() {
      var W = api.W, H = api.H, Q = api.quality, o = mkC(W, H), c = o.x, i, j, rnd = seeded(31 + hi * 101);
      courseC = o.cv; courseKey = W + 'x' + H + 'h' + hi + 'q' + Q;
      // трава-«рафф» вокруг
      var bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1d4d24'); bg.addColorStop(1, '#173f1e');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      var nt = Q > 0 ? 2600 : 900;
      for (i = 0; i < nt; i++) {
        var x = rnd() * W, y = rnd() * H, l = 2 + rnd() * 4;
        c.strokeStyle = rnd() < 0.5 ? 'rgba(74,140,60,' + (0.2 + rnd() * 0.3) + ')' : 'rgba(10,40,15,' + (0.2 + rnd() * 0.3) + ')';
        c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (rnd() - 0.5) * 2, y - l); c.stroke();
      }
      c.save(); c.translate(ox, oy); c.scale(s, s);
      function nearCourse(x, y, m) {
        if (onCourse(x, y)) return true;
        for (var a = 0; a < hole.out.length; a++) { var p = hole.out[a]; for (var b = 0; b < p.length; b++) { var q = p[(b + 1) % p.length]; if (segDist(x, y, p[b][0], p[b][1], q[0], q[1]) < m) return true; } }
        return false;
      }
      // декор: кусты, деревья, цветы, камни
      var x0 = -ox / s, y0 = -oy / s, x1 = (W - ox) / s, y1 = (H - oy) / s, deco = [];
      for (i = 0; i < 160 && deco.length < 34; i++) {
        var dx = x0 + rnd() * (x1 - x0), dy = y0 + rnd() * (y1 - y0), kind = rnd(), rr = kind < 0.25 ? 7 + rnd() * 5 : kind < 0.6 ? 3 + rnd() * 2.5 : kind < 0.85 ? 1.6 : 2 + rnd() * 1.5;
        if (nearCourse(dx, dy, rr + 3.5)) continue;
        deco.push([dx, dy, rr, kind < 0.25 ? 0 : kind < 0.6 ? 1 : kind < 0.85 ? 2 : 3, rnd()]);
      }
      deco.sort(function (a, b) { return a[1] - b[1]; });
      for (i = 0; i < deco.length; i++) { var d0 = deco[i]; if (d0[3] < 2) { c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(d0[0] + d0[2] * 0.35, d0[1] + d0[2] * 0.45, d0[2], d0[2] * 0.85, 0, 0, 6.283); c.fill(); } }
      for (i = 0; i < deco.length; i++) {
        var dd = deco[i], X = dd[0], Y = dd[1], r = dd[2];
        if (dd[3] === 0 || dd[3] === 1) {
          var base = dd[3] === 0 ? ['#14532d', '#22803a', '#4ade80'] : ['#166534', '#2f9a44', '#86efac'];
          for (j = 0; j < 6; j++) {
            var a = j / 6 * 6.283 + dd[4], px = X + Math.cos(a) * r * 0.45, py = Y + Math.sin(a) * r * 0.45, pr = r * 0.62;
            var g = c.createRadialGradient(px - pr * 0.3, py - pr * 0.4, pr * 0.1, px, py, pr); g.addColorStop(0, base[2]); g.addColorStop(0.45, base[1]); g.addColorStop(1, base[0]);
            c.fillStyle = g; c.beginPath(); c.arc(px, py, pr, 0, 6.283); c.fill();
          }
          var g2 = c.createRadialGradient(X - r * 0.3, Y - r * 0.35, r * 0.05, X, Y, r * 0.6); g2.addColorStop(0, base[2]); g2.addColorStop(1, base[1]);
          c.fillStyle = g2; c.beginPath(); c.arc(X, Y, r * 0.55, 0, 6.283); c.fill();
          if (dd[3] === 1 && dd[4] > 0.5) { c.fillStyle = dd[4] > 0.75 ? '#f472b6' : '#fde047'; for (j = 0; j < 5; j++) { c.beginPath(); c.arc(X + Math.cos(j * 2.4) * r * 0.5, Y + Math.sin(j * 2.4) * r * 0.5, 0.55, 0, 6.283); c.fill(); } }
        } else if (dd[3] === 2) {
          var fc = ['#f472b6', '#fde047', '#f8fafc', '#a78bfa', '#fb923c'][Math.floor(dd[4] * 5)];
          for (j = 0; j < 5; j++) { c.fillStyle = fc; c.beginPath(); c.arc(X + Math.cos(j * 1.256) * 0.8, Y + Math.sin(j * 1.256) * 0.8, 0.7, 0, 6.283); c.fill(); }
          c.fillStyle = '#facc15'; c.beginPath(); c.arc(X, Y, 0.5, 0, 6.283); c.fill();
        } else {
          c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(X + 0.6, Y + 0.8, r, r * 0.7, 0, 0, 6.283); c.fill();
          var rg = c.createRadialGradient(X - r * 0.3, Y - r * 0.4, r * 0.1, X, Y, r); rg.addColorStop(0, '#e2e8f0'); rg.addColorStop(1, '#64748b');
          c.fillStyle = rg; c.beginPath(); c.ellipse(X, Y, r, r * 0.75, dd[4], 0, 6.283); c.fill();
        }
      }
      function outPath() { c.beginPath(); for (var a = 0; a < hole.out.length; a++) { var p = hole.out[a]; c.moveTo(p[0][0], p[0][1]); for (var b = 1; b < p.length; b++) c.lineTo(p[b][0], p[b][1]); c.closePath(); } }
      // тень поля
      c.save(); c.translate(1.4, 2.4); outPath(); c.lineJoin = 'round'; c.lineWidth = WR * 2 + 1; c.strokeStyle = 'rgba(0,0,0,.4)'; c.stroke(); c.fillStyle = 'rgba(0,0,0,.4)'; c.fill(); c.restore();
      // газон
      c.save(); outPath(); c.clip();
      c.fillStyle = '#3aa648'; c.fillRect(-10, -10, CW + 20, CH + 20);
      c.save(); c.translate(CW / 2, CH / 2); c.rotate(-0.62);
      for (i = -14; i < 14; i++) { c.fillStyle = i % 2 ? 'rgba(255,255,255,.075)' : 'rgba(0,40,0,.06)'; c.fillRect(i * 8.5, -150, 8.5, 300); }
      c.restore();
      for (i = 0; i < (Q > 0 ? 2200 : 700); i++) {
        c.fillStyle = rnd() < 0.5 ? 'rgba(180,255,170,.12)' : 'rgba(0,50,10,.12)';
        c.fillRect(rnd() * CW, rnd() * CH, 0.35, 0.35 + rnd() * 0.5);
      }
      // уклоны
      if (hole.slope) for (i = 0; i < hole.slope.length; i++) {
        var sl = hole.slope[i], r0 = sl.s.r, mag = Math.hypot(sl.ax, sl.ay), ux = sl.ax / mag, uy = sl.ay / mag;
        var cx = r0[0] + r0[2] / 2, cy = r0[1] + r0[3] / 2, ext = Math.abs(ux) * r0[2] / 2 + Math.abs(uy) * r0[3] / 2;
        var sg = c.createLinearGradient(cx - ux * ext, cy - uy * ext, cx + ux * ext, cy + uy * ext);
        sg.addColorStop(0, 'rgba(255,255,220,.2)'); sg.addColorStop(0.5, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(0,30,0,.28)');
        c.fillStyle = sg; c.fillRect(r0[0], r0[1], r0[2], r0[3]);
        c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 0.35; c.setLineDash([1.5, 1.2]); c.strokeRect(r0[0] + 0.5, r0[1] + 0.5, r0[2] - 1, r0[3] - 1); c.setLineDash([]);
      }
      if (hole.funnel) {
        var fn = hole.funnel, fg = c.createRadialGradient(fn.x, fn.y, 1, fn.x, fn.y, fn.r);
        fg.addColorStop(0, 'rgba(0,30,0,.3)'); fg.addColorStop(0.7, 'rgba(0,30,0,.08)'); fg.addColorStop(1, 'rgba(255,255,255,.08)');
        c.fillStyle = fg; c.beginPath(); c.arc(fn.x, fn.y, fn.r, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 0.3;
        for (j = 1; j <= 3; j++) { c.beginPath(); c.arc(fn.x, fn.y, fn.r * j / 3.3, 0, 6.283); c.stroke(); }
      }
      // песок
      if (hole.sand) for (i = 0; i < hole.sand.length; i++) {
        var sd = hole.sand[i];
        c.fillStyle = 'rgba(80,60,10,.35)'; c.beginPath(); shapePath(c, sd, 3); c.save(); c.translate(0.3, 0.6); c.fill(); c.restore();
        var sx = sd.e ? sd.e[0] : sd.r[0] + sd.r[2] / 2, sy = sd.e ? sd.e[1] : sd.r[1] + sd.r[3] / 2, srr = sd.e ? Math.max(sd.e[2], sd.e[3]) : Math.max(sd.r[2], sd.r[3]);
        var sgr = c.createRadialGradient(sx - srr * 0.3, sy - srr * 0.3, 1, sx, sy, srr * 1.1); sgr.addColorStop(0, '#fbeac0'); sgr.addColorStop(1, '#d9b56a');
        c.fillStyle = sgr; c.beginPath(); shapePath(c, sd, 3); c.fill();
        c.save(); c.beginPath(); shapePath(c, sd, 3); c.clip();
        for (j = 0; j < 140; j++) { c.fillStyle = rnd() < 0.5 ? 'rgba(140,100,30,.35)' : 'rgba(255,255,255,.45)'; c.fillRect(sx - srr + rnd() * srr * 2, sy - srr + rnd() * srr * 2, 0.3, 0.3); }
        c.strokeStyle = 'rgba(160,120,50,.35)'; c.lineWidth = 0.25;
        for (j = -3; j <= 3; j++) { c.beginPath(); c.arc(sx + j * 1.7, sy + 5, srr * 0.9, 3.6, 5.8); c.stroke(); }
        c.restore();
        c.strokeStyle = 'rgba(120,90,30,.6)'; c.lineWidth = 0.5; c.beginPath(); shapePath(c, sd, 3); c.stroke();
      }
      // вода (основа)
      if (hole.water) for (i = 0; i < hole.water.length; i++) {
        var wt = hole.water[i];
        c.save(); c.beginPath(); shapePath(c, wt, 4); c.clip('evenodd');
        var wg = c.createLinearGradient(0, wt.r ? wt.r[1] : 0, 0, wt.r ? wt.r[1] + wt.r[3] : CH); wg.addColorStop(0, '#0e7490'); wg.addColorStop(1, '#155e75');
        c.fillStyle = wg; c.fillRect(-10, -10, CW + 20, CH + 20);
        c.strokeStyle = 'rgba(2,30,50,.55)'; c.lineWidth = 4; c.beginPath(); shapePath(c, wt, 4); c.stroke();
        for (j = 0; j < 40; j++) { c.fillStyle = 'rgba(165,243,252,' + (0.05 + rnd() * 0.08) + ')'; c.beginPath(); c.ellipse(rnd() * CW, rnd() * CH, 2 + rnd() * 4, 0.4, 0, 0, 6.283); c.fill(); }
        c.restore();
        c.strokeStyle = 'rgba(236,254,255,.7)'; c.lineWidth = 0.6; c.beginPath(); shapePath(c, wt, 4); c.stroke();
        c.strokeStyle = 'rgba(120,90,50,.55)'; c.lineWidth = 0.8; c.save(); c.translate(0, -0.6); c.beginPath(); shapePath(c, wt, 4); c.stroke(); c.restore();
      }
      // мягкая тень у бортов
      outPath(); c.lineJoin = 'round';
      c.strokeStyle = 'rgba(0,30,0,.2)'; c.lineWidth = 9; c.stroke(); c.strokeStyle = 'rgba(0,30,0,.18)'; c.lineWidth = 5.5; c.stroke();
      c.restore();
      // коврик ти
      var tx = hole.tee[0], ty = hole.tee[1];
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); rrect(c, tx - 7.5, ty - 4.5, 15, 10, 2); c.fill();
      c.fillStyle = '#2d7a37'; c.beginPath(); rrect(c, tx - 7.5, ty - 5, 15, 10, 2); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 0.4; c.stroke();
      for (j = 0; j < 7; j++) { c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(tx - 7 + j * 2, ty - 4.5, 1, 9); }
      c.fillStyle = '#f8fafc'; c.beginPath(); c.arc(tx - 5.5, ty, 0.9, 0, 6.283); c.arc(tx + 5.5, ty, 0.9, 0, 6.283); c.fill();
      // лунка
      var cx2 = hole.cup[0], cy2 = hole.cup[1], cr = D.cupR;
      c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(cx2, cy2, cr + 1.4, 0, 6.283); c.fill();
      var cg = c.createRadialGradient(cx2, cy2 - cr * 0.4, cr * 0.2, cx2, cy2, cr); cg.addColorStop(0, '#000'); cg.addColorStop(0.7, '#0a1a0c'); cg.addColorStop(1, '#3f4b3f');
      c.fillStyle = cg; c.beginPath(); c.arc(cx2, cy2, cr, 0, 6.283); c.fill();
      c.strokeStyle = '#e5e7eb'; c.lineWidth = 0.55; c.beginPath(); c.arc(cx2, cy2, cr, 0.15, Math.PI - 0.15); c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.arc(cx2, cy2, cr - 0.3, Math.PI + 0.2, -0.2); c.stroke();
      // стены (3D)
      var MAT = { wood: ['#5b3416', '#a8672c', '#d79a55', 'rgba(70,35,10,.55)'], brick: ['#5c1d12', '#a83a24', '#d8674a', 'rgba(255,230,210,.55)'], stone: ['#3a3f4a', '#7b8494', '#b9c1cf', 'rgba(30,35,45,.45)'] }[hole.mat];
      var lines = [];
      for (i = 0; i < hole.out.length; i++) lines.push({ p: hole.out[i], cl: true });
      if (hole.walls) for (i = 0; i < hole.walls.length; i++) lines.push({ p: hole.walls[i], cl: false });
      function lpath(L0, dx, dy) { c.beginPath(); c.moveTo(L0.p[0][0] + dx, L0.p[0][1] + dy); for (var k = 1; k < L0.p.length; k++) c.lineTo(L0.p[k][0] + dx, L0.p[k][1] + dy); if (L0.cl) c.closePath(); }
      c.lineJoin = 'round'; c.lineCap = 'round';
      for (i = 0; i < lines.length; i++) { lpath(lines[i], 1.1, 2.2); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = WR * 2; c.stroke(); }
      for (i = 0; i < lines.length; i++) { lpath(lines[i], 0, 1.3); c.strokeStyle = MAT[0]; c.lineWidth = WR * 2; c.stroke(); }
      for (i = 0; i < lines.length; i++) { lpath(lines[i], 0, 0); c.strokeStyle = MAT[1]; c.lineWidth = WR * 2; c.stroke(); }
      for (i = 0; i < lines.length; i++) { lpath(lines[i], -0.25, -0.35); c.strokeStyle = MAT[2]; c.lineWidth = WR * 0.6; c.globalAlpha = 0.6; c.stroke(); c.globalAlpha = 1; }
      // фактура стен
      c.strokeStyle = MAT[3]; c.lineWidth = 0.22; c.lineCap = 'butt';
      for (i = 0; i < lines.length; i++) {
        var P = lines[i].p, n = lines[i].cl ? P.length : P.length - 1;
        for (j = 0; j < n; j++) {
          var A = P[j], B = P[(j + 1) % P.length], ddx = B[0] - A[0], ddy = B[1] - A[1], len = Math.hypot(ddx, ddy), ex = ddx / len, ey = ddy / len, nx = -ey, ny = ex;
          if (hole.mat === 'wood') {
            c.beginPath(); c.moveTo(A[0] + nx * 0.5, A[1] + ny * 0.5); c.lineTo(B[0] + nx * 0.5, B[1] + ny * 0.5); c.moveTo(A[0] - nx * 0.5, A[1] - ny * 0.5); c.lineTo(B[0] - nx * 0.5, B[1] - ny * 0.5); c.stroke();
            for (var u = 6 + (j % 3) * 3; u < len - 2; u += 11) { c.beginPath(); c.moveTo(A[0] + ex * u - nx * WR, A[1] + ey * u - ny * WR); c.lineTo(A[0] + ex * u + nx * WR, A[1] + ey * u + ny * WR); c.stroke(); }
          } else if (hole.mat === 'brick') {
            c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke();
            for (var u2 = 1.5, kk = 0; u2 < len - 0.5; u2 += 1.6, kk++) {
              var off = kk % 2 ? 0 : 1;
              c.beginPath(); c.moveTo(A[0] + ex * (u2 + off * 0.8) + nx * (off ? 0 : -WR), A[1] + ey * (u2 + off * 0.8) + ny * (off ? 0 : -WR)); c.lineTo(A[0] + ex * (u2 + off * 0.8) + nx * (off ? WR : 0), A[1] + ey * (u2 + off * 0.8) + ny * (off ? WR : 0)); c.stroke();
            }
          } else {
            for (var u3 = 1 + (j % 2) * 1.5; u3 < len - 1; u3 += 2.6 + ((u3 * 7) % 1.3)) { c.beginPath(); c.moveTo(A[0] + ex * u3 - nx * WR, A[1] + ey * u3 - ny * WR); c.lineTo(A[0] + ex * (u3 + 0.4) + nx * WR, A[1] + ey * (u3 + 0.4) + ny * WR); c.stroke(); }
          }
        }
      }
      c.lineCap = 'butt';
      // бамперы
      if (hole.bump) for (i = 0; i < hole.bump.length; i++) {
        var bp = hole.bump[i];
        c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(bp[0] + 1, bp[1] + 2, bp[2], 0, 6.283); c.fill();
        c.fillStyle = MAT[0]; c.beginPath(); c.arc(bp[0], bp[1] + 1.2, bp[2], 0, 6.283); c.fill();
      }
      // мельница: башня
      if (hole.mill) {
        var ml = hole.mill, hr = ml.hub;
        c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(ml.x + 1.5, ml.y + 2.5, hr * 1.25, 0, 6.283); c.fill();
        c.fillStyle = '#7c2d12'; c.beginPath(); c.arc(ml.x, ml.y + 1.4, hr * 1.2, 0, 6.283); c.fill();
        var tg = c.createRadialGradient(ml.x - hr * 0.4, ml.y - hr * 0.5, 0.5, ml.x, ml.y, hr * 1.2); tg.addColorStop(0, '#fde68a'); tg.addColorStop(0.5, '#f59e0b'); tg.addColorStop(1, '#9a3412');
        c.fillStyle = tg; c.beginPath(); c.arc(ml.x, ml.y, hr * 1.2, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(120,40,10,.6)'; c.lineWidth = 0.3;
        for (j = 0; j < 12; j++) { var aa = j / 12 * 6.283; c.beginPath(); c.moveTo(ml.x, ml.y); c.lineTo(ml.x + Math.cos(aa) * hr * 1.2, ml.y + Math.sin(aa) * hr * 1.2); c.stroke(); }
      }
      // телепорты (основа)
      if (hole.tele) for (i = 0; i < hole.tele.length; i++) {
        var tl = hole.tele[i], tc = i ? ['#9a3412', '#fb923c'] : ['#4c1d95', '#a78bfa'];
        for (j = 0; j < 2; j++) {
          var pt = j ? tl.b : tl.a;
          c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(pt[0] + 0.6, pt[1] + 1, 4.4, 0, 6.283); c.fill();
          c.fillStyle = '#334155'; c.beginPath(); c.arc(pt[0], pt[1], 4.4, 0, 6.283); c.fill();
          var pg = c.createRadialGradient(pt[0], pt[1], 0.5, pt[0], pt[1], 3.6); pg.addColorStop(0, j ? '#e0f2fe' : '#000'); pg.addColorStop(1, tc[0]);
          c.fillStyle = pg; c.beginPath(); c.arc(pt[0], pt[1], 3.6, 0, 6.283); c.fill();
        }
      }
      c.restore();
      // виньетка
      var vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.4)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
    }

    /* ---------- ход игры ---------- */
    function startHole(i) {
      hi = i; hole = HOLES[i]; SEGS = staticSegs();
      ball = { x: hole.tee[0], y: hole.tee[1], vx: 0, vy: 0, sc: 1, alpha: 1 };
      lastPos = [ball.x, ball.y]; strokes = 0; state = 'aim'; stT = 0; holeT = 0; aim = null; stillT = 0; teleCd = -1; trail = []; sinkP = 0;
      if (hole.bump) for (var k = 0; k < hole.bump.length; k++) hole.bump[k].flash = 0;
      courseKey = '';
    }
    function holePts(st, par) { if (st === 1) return 150; return Math.max(5, 50 + (par - st) * 25); }
    function finishHole(sunk) {
      var par = hole.par, pts = sunk ? holePts(strokes, par) : 0, d = strokes - par, name, col;
      results.push({ st: strokes, par: par, sunk: sunk });
      total += pts; api.setScore(total);
      if (!sunk) { name = api.t('golf.pickup'); col = '#94a3b8'; api.sound('over'); }
      else if (strokes === 1) { name = api.t('golf.ace'); col = '#fde047'; api.sound('win'); api.fx.confetti(110); api.fx.flash('#fef08a', 0.35); api.vibrate(80); }
      else if (d <= -2) { name = api.t('golf.eagle'); col = '#f0abfc'; api.sound('win'); api.fx.confetti(70); }
      else if (d === -1) { name = api.t('golf.birdie'); col = '#7dd3fc'; api.sound('bonus'); api.fx.confetti(35); }
      else if (d === 0) { name = api.t('golf.par'); col = '#86efac'; api.sound('coin'); }
      else if (d === 1) { name = api.t('golf.bogey'); col = '#fdba74'; api.sound('point'); }
      else { name = api.t('golf.dbogey', d); col = '#fca5a5'; api.sound('point'); }
      label = { s: name, sub: '+' + pts, c: col, t: 0 };
      state = 'sunk'; stT = 0;
    }
    function shoot(a) {
      var sp = 22 + a.p * 200;
      ball.vx = Math.cos(a.ang) * sp; ball.vy = Math.sin(a.ang) * sp;
      lastPos = [ball.x, ball.y]; strokes++; state = 'roll'; stillT = 0; stT = 0;
      api.sound('hit'); api.tone(180 + a.p * 160, 0.06, 'triangle', 0.06); api.vibrate(12);
    }
    function aimFrom(dx, dy) {
      var len = Math.hypot(dx, dy), maxP = Math.min(api.W, api.H) * 0.36;
      if (len < 6) return null;
      return { ang: Math.atan2(dy, dx), p: Math.min(1, len / maxP), len: len };
    }
    function simPath(a) {
      var b = { x: ball.x, y: ball.y, vx: Math.cos(a.ang) * (22 + a.p * 200), vy: Math.sin(a.ang) * (22 + a.p * 200), hits: 0 }, pts = [], h = 1 / 120, dist = 0, maxD = D.prev === 2 ? 130 : 46, maxH = D.prev === 2 ? 2 : 0;
      for (var i = 0; i < 1200; i++) {
        var px = b.x, py = b.y;
        physStep(b, h, true);
        dist += Math.hypot(b.x - px, b.y - py);
        if (i % 3 === 0) pts.push([b.x, b.y]);
        if (dist > maxD || b.hits > maxH || Math.hypot(b.vx, b.vy) < 3 || inWater(b.x, b.y)) break;
        if (Math.hypot(b.x - hole.cup[0], b.y - hole.cup[1]) < D.cupR) break;
      }
      return pts;
    }

    return {
      reset: function () {
        D = DIFF[api.diff]; layout();
        t = 0; millA = 0; total = 0; results = []; label = null; ripples = []; bounceT = 0;
        startHole(0);
      },
      resize: function () { layout(); courseKey = ''; },
      idle: function (dt) { t += dt; },
      input: function (type, d) {
        if (state !== 'aim') { aim = null; return; }
        if (type === 'down') { aim = { x0: d.x, y0: d.y, x: d.x, y: d.y, a: null, pv: null }; return; }
        if (!aim) return;
        if (type === 'move') {
          aim.x = d.x; aim.y = d.y; aim.a = aimFrom(aim.x0 - d.x, aim.y0 - d.y);
          aim.pv = aim.a && D.prev ? simPath(aim.a) : null;
        } else if (type === 'up') {
          aim.x = d.x; aim.y = d.y; var a = aimFrom(aim.x0 - d.x, aim.y0 - d.y);
          if (a && a.p > 0.06) shoot(a);
          aim = null;
        }
      },
      update: function (dt) {
        var i;
        t += dt; stT += dt; holeT += dt; if (bounceT > 0) bounceT -= dt;
        if (hole.mill) millA += hole.mill.sp * D.obst * dt;
        if (hole.bump) for (i = 0; i < hole.bump.length; i++) if (hole.bump[i].flash > 0) hole.bump[i].flash -= dt * 3;
        if (label) label.t += dt;
        for (i = ripples.length - 1; i >= 0; i--) { ripples[i].t += dt; if (ripples[i].t > 1.2) ripples.splice(i, 1); }
        if (state === 'roll') {
          var sp0 = Math.hypot(ball.vx, ball.vy), n = Math.min(24, Math.max(1, Math.ceil(sp0 * dt / 0.8)) + (hole.mill || hole.mover ? 2 : 0));
          for (i = 0; i < n; i++) {
            physStep(ball, dt / n, false);
            var cd = Math.hypot(ball.x - hole.cup[0], ball.y - hole.cup[1]), sp = Math.hypot(ball.vx, ball.vy);
            if (cd < D.cupR - BR * 0.3 && sp < D.sinkV) { state = 'sink'; stT = 0; sinkP = 0; api.sound('coin'); api.tone(880, 0.12, 'sine', 0.06); break; }
            if (cd < D.cupR && sp >= D.sinkV && bounceT <= 0) { api.tone(700, 0.05, 'triangle', 0.05); bounceT = 0.15; ball.vx *= 0.92; ball.vy *= 0.92; }
            if (inWater(ball.x, ball.y)) {
              state = 'splash'; stT = 0; strokes++; ripples.push({ x: ball.x, y: ball.y, t: 0 }); ripples.push({ x: ball.x, y: ball.y, t: -0.25 });
              api.sound('life'); api.fx.burst(SX(ball.x), SY(ball.y), '#7dd3fc', 22, 160, 3); api.vibrate(40);
              label = { s: api.t('golf.water'), sub: '', c: '#7dd3fc', t: 0, small: true };
              break;
            }
            if (hole.tele) {
              for (var k = 0; k < hole.tele.length; k++) {
                var tl = hole.tele[k];
                if (teleCd !== k && Math.hypot(ball.x - tl.a[0], ball.y - tl.a[1]) < 3.4) {
                  api.fx.burst(SX(tl.a[0]), SY(tl.a[1]), k ? '#fb923c' : '#c4b5fd', 14, 120, 3);
                  ball.x = tl.b[0]; ball.y = tl.b[1]; teleCd = k; trail = [];
                  api.tone(400, 0.08, 'sine', 0.05); api.tone(900, 0.14, 'sine', 0.05);
                  api.fx.burst(SX(tl.b[0]), SY(tl.b[1]), k ? '#fdba74' : '#a5f3fc', 18, 140, 3);
                }
              }
              if (teleCd >= 0) { var tb = hole.tele[teleCd].b; if (Math.hypot(ball.x - tb[0], ball.y - tb[1]) > 5.5) teleCd = -1; }
            }
            if (!onCourse(ball.x, ball.y)) { ball.x = lastPos[0]; ball.y = lastPos[1]; ball.vx = ball.vy = 0; }
          }
          if (state === 'roll') {
            if (api.quality > 0) { trail.push([ball.x, ball.y]); if (trail.length > 10) trail.shift(); }
            var spd = Math.hypot(ball.vx, ball.vy), acc = accelAt(ball.x, ball.y), am = Math.hypot(acc[0], acc[1]);
            if (spd < 3.2) stillT += dt; else stillT = 0;
            if ((spd < 3.2 && am < 20) || stillT > 0.7 || stT > 14) {
              ball.vx = ball.vy = 0; trail = [];
              if (strokes >= hole.par + D.extra) finishHole(false);
              else { state = 'aim'; stT = 0; }
            }
          }
        } else if (state === 'sink') {
          sinkP = Math.min(1, sinkP + dt * 3.5);
          ball.x += (hole.cup[0] - ball.x) * Math.min(1, dt * 14); ball.y += (hole.cup[1] - ball.y) * Math.min(1, dt * 14);
          if (stT > 0.45) finishHole(true);
        } else if (state === 'splash') {
          if (stT > 1.1) {
            ball.x = lastPos[0]; ball.y = lastPos[1]; ball.vx = ball.vy = 0; trail = [];
            if (strokes >= hole.par + D.extra) finishHole(false); else { state = 'aim'; stT = 0; }
          }
        } else if (state === 'sunk') {
          if (stT > 2.1) {
            if (hi + 1 >= HOLES.length) { state = 'done'; stT = 0; }
            else { state = 'trans'; stT = 0; }
          }
        } else if (state === 'trans') {
          if (stT > 0.35 && hole === HOLES[hi] && results.length === hi + 1) { startHole(hi + 1); state = 'trans'; stT = 0.35; }
          if (stT > 0.75) { state = 'aim'; stT = 0; }
        } else if (state === 'done') {
          if (stT > 2) { api.gameOver(); stT = -999; }
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H, Q = api.quality, i, k;
        if (courseKey !== W + 'x' + H + 'h' + hi + 'q' + Q) { layout(); buildCourse(); }
        c.save();
        c.drawImage(courseC, 0, 0, W, H);
        c.save(); c.translate(ox, oy); c.scale(s, s);
        // блики воды
        if (hole.water && Q > 0) {
          for (i = 0; i < hole.water.length; i++) {
            var wt = hole.water[i];
            c.save(); c.beginPath(); shapePath(c, wt, 4); c.clip('evenodd');
            var bx0 = wt.r ? wt.r[0] : 0, by0 = wt.r ? wt.r[1] : 0, bw = wt.r ? wt.r[2] : CW, bh = wt.r ? wt.r[3] : CH;
            for (k = 0; k < 9; k++) {
              var ph = t * 0.35 + k * 0.37, wx = bx0 + ((k * 37.3 + t * 3) % bw), wy = by0 + ((k * 23.7) % bh) + Math.sin(ph * 2) * 1.5;
              c.fillStyle = 'rgba(224,255,255,' + (0.12 + 0.12 * Math.sin(ph * 3 + k)) + ')';
              c.beginPath(); c.ellipse(wx, wy, 3 + (k % 3), 0.35, 0, 0, 6.283); c.fill();
            }
            c.restore();
          }
        }
        // анимированные стрелки уклона
        if (hole.slope) for (i = 0; i < hole.slope.length; i++) {
          var sl = hole.slope[i], r0 = sl.s.r, mag = Math.hypot(sl.ax, sl.ay), ux = sl.ax / mag, uy = sl.ay / mag;
          c.save(); c.beginPath(); c.rect(r0[0], r0[1], r0[2], r0[3]); c.clip();
          c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 0.9; c.lineCap = 'round'; c.lineJoin = 'round';
          var spc = 9, ofs = (t * 6) % spc;
          for (var gx = -1; gx <= Math.ceil(r0[2] / spc) + 1; gx++) for (var gy = -1; gy <= Math.ceil(r0[3] / spc) + 1; gy++) {
            var ax2 = r0[0] + gx * spc + ux * ofs + (gy % 2) * spc * 0.5 * Math.abs(uy), ay2 = r0[1] + gy * spc + uy * ofs + (gx % 2) * spc * 0.5 * Math.abs(ux);
            c.beginPath(); c.moveTo(ax2 - ux * 1.6 - uy * 1.6, ay2 - uy * 1.6 + ux * 1.6); c.lineTo(ax2, ay2); c.lineTo(ax2 - ux * 1.6 + uy * 1.6, ay2 - uy * 1.6 - ux * 1.6); c.stroke();
          }
          c.restore(); c.lineCap = 'butt';
        }
        // телепорты (анимация)
        if (hole.tele) for (i = 0; i < hole.tele.length; i++) {
          var tl = hole.tele[i], col = i ? '251,146,60' : '167,139,250';
          for (k = 0; k < 2; k++) {
            var pt = k ? tl.b : tl.a, rot = t * (k ? -2.5 : 3);
            c.strokeStyle = 'rgba(' + col + ',.95)'; c.lineWidth = 0.8;
            for (var q = 0; q < 3; q++) { c.beginPath(); c.arc(pt[0], pt[1], 2.6 - q * 0.7, rot + q * 2.1, rot + q * 2.1 + 2.2); c.stroke(); }
            var pul = 0.5 + 0.5 * Math.sin(t * 4 + k * 2);
            c.strokeStyle = 'rgba(' + col + ',' + (0.35 + pul * 0.4) + ')'; c.lineWidth = 0.6; c.beginPath(); c.arc(pt[0], pt[1], 4.4 + pul * 0.6, 0, 6.283); c.stroke();
          }
        }
        // бамперы (верх)
        if (hole.bump) {
          var MT = { wood: ['#a8672c', '#e8b06e'], brick: ['#a83a24', '#f08a6a'], stone: ['#7b8494', '#dfe5ee'] }[hole.mat];
          for (i = 0; i < hole.bump.length; i++) {
            var bp = hole.bump[i], fl = Math.max(0, bp.flash || 0);
            var bg2 = c.createRadialGradient(bp[0] - bp[2] * 0.35, bp[1] - bp[2] * 0.4, 0.2, bp[0], bp[1], bp[2]);
            bg2.addColorStop(0, fl > 0 ? '#fff' : MT[1]); bg2.addColorStop(1, MT[0]);
            c.fillStyle = bg2; c.beginPath(); c.arc(bp[0], bp[1], bp[2], 0, 6.283); c.fill();
            c.strokeStyle = fl > 0 ? 'rgba(253,224,71,' + fl + ')' : 'rgba(30,20,10,.5)'; c.lineWidth = 0.7; c.beginPath(); c.arc(bp[0], bp[1], bp[2] - 0.4, 0, 6.283); c.stroke();
          }
        }
        // движущийся блок
        var mp = moverPos();
        if (mp) {
          c.lineCap = 'round';
          c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 4.4; c.beginPath(); c.moveTo(mp.ax + 1, mp.ay + 2); c.lineTo(mp.bx + 1, mp.by + 2); c.stroke();
          c.strokeStyle = '#1e3a8a'; c.beginPath(); c.moveTo(mp.ax, mp.ay + 1); c.lineTo(mp.bx, mp.by + 1); c.stroke();
          c.strokeStyle = '#3b82f6'; c.beginPath(); c.moveTo(mp.ax, mp.ay); c.lineTo(mp.bx, mp.by); c.stroke();
          c.strokeStyle = '#facc15'; c.lineWidth = 1.2; c.setLineDash([1.6, 1.6]); c.beginPath(); c.moveTo(mp.ax, mp.ay); c.lineTo(mp.bx, mp.by); c.stroke(); c.setLineDash([]);
          c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(mp.ax, mp.ay - 1.2); c.lineTo(mp.bx, mp.by - 1.2); c.stroke();
          c.lineCap = 'butt';
        }
        // рябь
        for (i = 0; i < ripples.length; i++) {
          var rp = ripples[i]; if (rp.t < 0) continue;
          c.strokeStyle = 'rgba(236,254,255,' + (1 - rp.t / 1.2) * 0.8 + ')'; c.lineWidth = 0.5;
          c.beginPath(); c.ellipse(rp.x, rp.y, 1 + rp.t * 9, (1 + rp.t * 9) * 0.7, 0, 0, 6.283); c.stroke();
        }
        // траектория-подсказка и прицел
        if (aim && aim.a) {
          var a = aim.a, pw = a.p, cr = pw < 0.5 ? 'rgba(' + Math.round(80 + pw * 2 * 170) + ',230,80,' : 'rgba(250,' + Math.round(230 - (pw - 0.5) * 2 * 180) + ',60,';
          if (aim.pv) for (i = 1; i < aim.pv.length; i += 2) { var pp = aim.pv[i], fa = 1 - i / aim.pv.length; c.fillStyle = 'rgba(255,255,255,' + (0.85 * fa + 0.1) + ')'; c.beginPath(); c.arc(pp[0], pp[1], 0.65, 0, 6.283); c.fill(); }
          var L = 8 + pw * 22, ex = ball.x + Math.cos(a.ang) * L, ey = ball.y + Math.sin(a.ang) * L;
          c.strokeStyle = cr + '.95)'; c.lineWidth = 1.4; c.lineCap = 'round';
          c.beginPath(); c.moveTo(ball.x + Math.cos(a.ang) * 3, ball.y + Math.sin(a.ang) * 3); c.lineTo(ex, ey); c.stroke();
          c.fillStyle = cr + '.95)'; c.beginPath(); c.moveTo(ex + Math.cos(a.ang) * 3, ey + Math.sin(a.ang) * 3); c.lineTo(ex + Math.cos(a.ang + 2.3) * 2.6, ey + Math.sin(a.ang + 2.3) * 2.6); c.lineTo(ex + Math.cos(a.ang - 2.3) * 2.6, ey + Math.sin(a.ang - 2.3) * 2.6); c.closePath(); c.fill();
          // резинка «рогатки»
          var bx = ball.x - Math.cos(a.ang) * Math.min(12, a.len / s), by = ball.y - Math.sin(a.ang) * Math.min(12, a.len / s);
          c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 0.5; c.setLineDash([1, 1]); c.beginPath(); c.moveTo(ball.x, ball.y); c.lineTo(bx, by); c.stroke(); c.setLineDash([]);
          c.lineCap = 'butt';
        }
        // мяч
        var sink = state === 'sink' || state === 'sunk' || state === 'trans' || state === 'done', spl = state === 'splash';
        if (!(sink && sinkP >= 1) && !(state === 'sunk' || state === 'trans' || state === 'done')) {
          var bsc = sink ? 1 - sinkP * 0.45 : spl ? Math.max(0, 1 - stT * 3) : 1;
          if (bsc > 0.02) {
            for (i = 0; i < trail.length; i++) { c.fillStyle = 'rgba(255,255,255,' + (i / trail.length) * 0.22 + ')'; c.beginPath(); c.arc(trail[i][0], trail[i][1], BR * (0.4 + 0.5 * i / trail.length), 0, 6.283); c.fill(); }
            if (!sink) { c.fillStyle = 'rgba(0,20,0,.35)'; c.beginPath(); c.ellipse(ball.x + 0.7, ball.y + 1.1, BR * bsc * 1.05, BR * bsc * 0.8, 0.4, 0, 6.283); c.fill(); }
            var bg3 = c.createRadialGradient(ball.x - BR * 0.4 * bsc, ball.y - BR * 0.45 * bsc, 0.1, ball.x, ball.y, BR * bsc);
            bg3.addColorStop(0, '#ffffff'); bg3.addColorStop(0.6, sink ? '#9ca3af' : '#eef2f7'); bg3.addColorStop(1, sink ? '#4b5563' : '#a9b3c4');
            c.fillStyle = bg3; c.beginPath(); c.arc(ball.x, ball.y, BR * bsc, 0, 6.283); c.fill();
            if (Q > 0 && bsc > 0.6) { c.fillStyle = 'rgba(100,116,139,.35)'; for (k = 0; k < 5; k++) { c.beginPath(); c.arc(ball.x + Math.cos(k * 1.3 + 0.4) * BR * 0.55, ball.y + Math.sin(k * 1.3 + 0.4) * BR * 0.55, 0.2, 0, 6.283); c.fill(); } }
          }
        }
        // мельница: лопасти
        if (hole.mill) {
          var ml = hole.mill;
          for (var pass = 0; pass < 2; pass++) {
            for (k = 0; k < 4; k++) {
              var an = millA + k * Math.PI / 2, ca = Math.cos(an), sa = Math.sin(an), w2 = 2.2, r1 = ml.hub * 0.7, r2 = ml.len;
              var dx2 = pass ? 0 : 2.4, dy2 = pass ? 0 : 4;
              if (pass === 0) {
                c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath();
                c.moveTo(ml.x + dx2 + ca * r1 - sa * w2, ml.y + dy2 + sa * r1 + ca * w2); c.lineTo(ml.x + dx2 + ca * r2 - sa * w2, ml.y + dy2 + sa * r2 + ca * w2);
                c.lineTo(ml.x + dx2 + ca * r2 + sa * 0.5, ml.y + dy2 + sa * r2 - ca * 0.5); c.lineTo(ml.x + dx2 + ca * r1 + sa * 0.5, ml.y + dy2 + sa * r1 - ca * 0.5); c.closePath(); c.fill();
              } else {
                c.fillStyle = 'rgba(248,240,220,.92)'; c.beginPath();
                c.moveTo(ml.x + ca * (r1 + 1) - sa * w2, ml.y + sa * (r1 + 1) + ca * w2); c.lineTo(ml.x + ca * r2 - sa * w2, ml.y + sa * r2 + ca * w2);
                c.lineTo(ml.x + ca * r2, ml.y + sa * r2); c.lineTo(ml.x + ca * (r1 + 1), ml.y + sa * (r1 + 1)); c.closePath(); c.fill();
                c.strokeStyle = '#7c4a1e'; c.lineWidth = 0.35;
                for (var u = r1 + 3; u < r2; u += 2.6) { c.beginPath(); c.moveTo(ml.x + ca * u, ml.y + sa * u); c.lineTo(ml.x + ca * u - sa * w2, ml.y + sa * u + ca * w2); c.stroke(); }
                c.beginPath(); c.moveTo(ml.x + ca * (r1 + 1) - sa * w2, ml.y + sa * (r1 + 1) + ca * w2); c.lineTo(ml.x + ca * r2 - sa * w2, ml.y + sa * r2 + ca * w2); c.stroke();
                c.strokeStyle = '#5b3416'; c.lineWidth = 1; c.beginPath(); c.moveTo(ml.x, ml.y); c.lineTo(ml.x + ca * r2, ml.y + sa * r2); c.stroke();
              }
            }
          }
          var hg = c.createRadialGradient(ml.x - 0.6, ml.y - 0.6, 0.2, ml.x, ml.y, 1.8); hg.addColorStop(0, '#fde68a'); hg.addColorStop(1, '#92400e');
          c.fillStyle = hg; c.beginPath(); c.arc(ml.x, ml.y, 1.8, 0, 6.283); c.fill();
        }
        // флажок
        var cx = hole.cup[0], cy = hole.cup[1], near = Math.hypot(ball.x - cx, ball.y - cy), fa2 = sink ? 0.35 : clamp((near - 6) / 20, 0.35, 1), PHt = 26;
        c.globalAlpha = fa2;
        c.strokeStyle = 'rgba(0,20,0,.3)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + 10, cy + 6); c.stroke();
        c.fillStyle = 'rgba(0,20,0,.22)'; c.beginPath(); c.moveTo(cx + 10, cy + 6); c.lineTo(cx + 14, cy + 4); c.lineTo(cx + 12, cy + 8.5); c.closePath(); c.fill();
        var pg = c.createLinearGradient(cx - 0.5, 0, cx + 0.5, 0); pg.addColorStop(0, '#94a3b8'); pg.addColorStop(0.5, '#fff'); pg.addColorStop(1, '#64748b');
        c.fillStyle = pg; c.fillRect(cx - 0.45, cy - PHt, 0.9, PHt);
        c.fillStyle = '#fde047'; c.beginPath(); c.arc(cx, cy - PHt, 0.9, 0, 6.283); c.fill();
        c.beginPath(); var FL = 11, FH = 7;
        c.moveTo(cx + 0.4, cy - PHt + 0.5);
        for (k = 0; k <= 10; k++) { var u2 = k / 10; c.lineTo(cx + 0.4 + u2 * FL, cy - PHt + 0.5 + Math.sin(t * 6 - u2 * 4) * u2 * 1.4); }
        for (k = 10; k >= 0; k--) { var u3 = k / 10; c.lineTo(cx + 0.4 + u3 * FL * (1 - 0.15 * u3), cy - PHt + 0.5 + FH * (1 - u3 * 0.45) + Math.sin(t * 6 - u3 * 4) * u3 * 1.4); }
        c.closePath();
        var fg = c.createLinearGradient(cx, 0, cx + FL, 0); fg.addColorStop(0, '#b91c1c'); fg.addColorStop(0.5, '#ef4444'); fg.addColorStop(1, '#dc2626');
        c.fillStyle = fg; c.fill();
        c.fillStyle = '#fff'; c.font = '900 4.4px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(String(hi + 1), cx + 5, cy - PHt + 3.6 + Math.sin(t * 6 - 2) * 0.7);
        c.globalAlpha = 1;
        c.restore();
        // HUD
        function pill(x, y, w, h) { c.fillStyle = 'rgba(5,30,12,.66)'; rrect(c, x, y, w, h, h / 2); c.fill(); c.strokeStyle = 'rgba(187,247,208,.22)'; c.lineWidth = 1; c.stroke(); }
        c.beginPath();
        c.textBaseline = 'middle'; c.textAlign = 'center';
        var hs = api.t('golf.hole', hi + 1, HOLES.length), ps = api.t('golf.parN', hole.par), ss = api.t('golf.strokes', strokes);
        c.font = '800 14px system-ui, sans-serif';
        var w1 = c.measureText(hs).width + 24, w2b = c.measureText(ps).width + 24, w3 = c.measureText(ss).width + 24;
        c.beginPath(); pill(8, 8, w1, 28); c.fillStyle = '#fff'; c.fillText(hs, 8 + w1 / 2, 22.5);
        c.beginPath(); pill(W / 2 - w2b / 2, 8, w2b, 28); c.fillStyle = '#86efac'; c.fillText(ps, W / 2, 22.5);
        c.beginPath(); pill(W - 8 - w3, 8, w3, 28); c.fillStyle = strokes > hole.par ? '#fdba74' : '#fff'; c.fillText(ss, W - 8 - w3 / 2, 22.5);
        // мини-табло лунок
        var dw = Math.min(26, (W - 30) / 9), dx0 = W / 2 - dw * 4.5;
        for (i = 0; i < HOLES.length; i++) {
          var rx = dx0 + i * dw + dw / 2, ry = 52, res = results[i], cur = i === hi && !res;
          c.beginPath(); c.arc(rx, ry, dw * 0.38, 0, 6.283);
          if (res) { var df = res.st - res.par; c.fillStyle = !res.sunk ? '#475569' : res.st === 1 ? '#eab308' : df < 0 ? '#0ea5e9' : df === 0 ? '#16a34a' : '#ea580c'; c.fill(); c.fillStyle = '#fff'; c.font = '800 10px system-ui, sans-serif'; c.fillText(res.sunk ? String(res.st) : '×', rx, ry + 0.5); }
          else { c.fillStyle = cur ? 'rgba(253,224,71,.25)' : 'rgba(5,30,12,.55)'; c.fill(); c.strokeStyle = cur ? '#fde047' : 'rgba(187,247,208,.3)'; c.lineWidth = cur ? 1.5 : 1; c.stroke(); c.fillStyle = cur ? '#fde047' : 'rgba(220,252,231,.6)'; c.font = '700 9px system-ui, sans-serif'; c.fillText(String(i + 1), rx, ry + 0.5); }
        }
        // сила удара
        if (aim && aim.a) {
          var bx2 = SX(ball.x), by2 = SY(ball.y), pr = 8 * s * 0.5 + 10;
          c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 5; c.beginPath(); c.arc(bx2, by2, pr, -Math.PI / 2, Math.PI * 1.5); c.stroke();
          c.strokeStyle = aim.a.p < 0.5 ? '#a3e635' : aim.a.p < 0.8 ? '#facc15' : '#f87171'; c.lineWidth = 3.5;
          c.beginPath(); c.arc(bx2, by2, pr, -Math.PI / 2, -Math.PI / 2 + 6.283 * aim.a.p); c.stroke();
          c.fillStyle = '#fff'; c.font = '800 12px system-ui, sans-serif'; c.fillText(Math.round(aim.a.p * 100) + '%', bx2, by2 - pr - 10);
        }
        // подсказка
        if (state === 'aim' && hi === 0 && strokes === 0 && !aim) {
          var tip = api.t('golf.tip'); c.font = '800 14px system-ui, sans-serif';
          var tw = Math.min(W - 16, c.measureText(tip).width + 28), tyy = SY(ball.y) + 22 * s * 0.5 + 18;
          if (tyy > H - 40) tyy = SY(ball.y) - 70;
          c.beginPath(); pill(W / 2 - tw / 2, tyy, tw, 30); c.fillStyle = '#fff'; c.fillText(tip, W / 2, tyy + 15.5, W - 30);
          var ph2 = (t % 1.6) / 1.6, fx = SX(ball.x) + ph2 * 30, fy = SY(ball.y) + ph2 * 45;
          c.globalAlpha = Math.sin(ph2 * Math.PI) * 0.8; c.fillStyle = '#fff'; c.beginPath(); c.arc(fx, fy, 8, 0, 6.283); c.fill();
          c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(fx, fy, 13, 0, 6.283); c.stroke(); c.globalAlpha = 1;
        }
        // карточка лунки
        var intro = state === 'trans' ? 1 : holeT < 1.6 ? 1 : Math.max(0, 1 - (holeT - 1.6) / 0.4);
        if (state === 'trans') { c.fillStyle = 'rgba(4,20,8,' + (stT < 0.35 ? stT / 0.35 : 1 - (stT - 0.35) / 0.4) * 0.85 + ')'; c.fillRect(0, 0, W, H); }
        if (intro > 0 && state !== 'sunk' && state !== 'done') {
          c.globalAlpha = intro; var cyy = H * 0.42;
          c.fillStyle = 'rgba(5,30,12,.78)'; c.beginPath(); rrect(c, W / 2 - 92, cyy - 34, 184, 68, 16); c.fill(); c.strokeStyle = 'rgba(134,239,172,.5)'; c.lineWidth = 1.5; c.stroke();
          c.fillStyle = '#fff'; c.font = '900 24px system-ui, sans-serif'; c.fillText(api.t('golf.hole', hi + 1, HOLES.length), W / 2, cyy - 10);
          c.fillStyle = '#86efac'; c.font = '800 15px system-ui, sans-serif'; c.fillText(api.t('golf.parN', hole.par), W / 2, cyy + 16);
          c.globalAlpha = 1;
        }
        // надпись результата
        if (label && label.t < (label.small ? 1.2 : 2.1)) {
          var lt = label.t, sc = lt < 0.2 ? 0.5 + lt / 0.2 * 0.7 : lt < 0.35 ? 1.2 - (lt - 0.2) / 0.15 * 0.2 : 1, la = lt > (label.small ? 0.9 : 1.7) ? Math.max(0, 1 - (lt - (label.small ? 0.9 : 1.7)) / 0.4) : 1;
          var fs = label.small ? 28 : Math.min(48, W * 0.12);
          c.save(); c.globalAlpha = la; c.translate(W / 2, H * 0.4); c.scale(sc, sc);
          c.font = '900 italic ' + fs + 'px system-ui, sans-serif'; c.lineJoin = 'round'; c.lineWidth = fs * 0.16; c.strokeStyle = 'rgba(2,24,8,.9)';
          c.strokeText(label.s, 0, 0); var lg = c.createLinearGradient(0, -fs / 2, 0, fs / 2); lg.addColorStop(0, '#fff'); lg.addColorStop(0.55, label.c); lg.addColorStop(1, label.c);
          c.fillStyle = lg; c.fillText(label.s, 0, 0);
          if (label.sub) { c.font = '900 ' + Math.round(fs * 0.55) + 'px system-ui, sans-serif'; c.lineWidth = 5; c.strokeText(label.sub, 0, fs * 0.85); c.fillStyle = '#fde047'; c.fillText(label.sub, 0, fs * 0.85); }
          c.restore();
        }
        if (state === 'done') {
          var aa = Math.min(1, stT * 2); c.globalAlpha = aa;
          c.fillStyle = 'rgba(5,30,12,.82)'; c.beginPath(); rrect(c, W / 2 - 100, H * 0.5 - 40, 200, 80, 16); c.fill();
          c.fillStyle = '#bbf7d0'; c.font = '700 14px system-ui, sans-serif'; c.fillText(api.t('golf.total'), W / 2, H * 0.5 - 16);
          c.fillStyle = '#fde047'; c.font = '900 32px system-ui, sans-serif'; c.fillText(String(total), W / 2, H * 0.5 + 14);
          c.globalAlpha = 1;
        }
        c.restore();
        c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      }
    };
  }
};
