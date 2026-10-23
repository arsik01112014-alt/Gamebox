/* Пинбол: неоновый стол — флипперы, плунжер, бамперы, рогатки, мишени, рампа, орбита, множитель и мультибол */
window.GAMES = window.GAMES || {};
window.GAMES.pinball = {
  title: 'Пинбол',
  desc: 'Неоновый стол: рампа, бамперы и мультибол',
  hint: 'Левая половина экрана — левый флиппер, правая — правый (можно держать оба). Шар в жёлобе: зажми экран и отпусти (или потяни вниз) — чем дольше, тем сильнее запуск. Попади в подсвеченную верхнюю дорожку — «скилл-шот». Верхние дорожки и все мишени поднимают множитель, 3 рампы — мультибол и джекпоты. В начале шара включено спасение. 3 шара.',
  d0: 'Пологий стол, сильные флипперы, узкие ауты, спасение 14 с',
  d1: 'Обычный наклон, спасение 10 с',
  d2: 'Крутой стол, ауты шире, спасение 7 с',
  d3: 'Очень крутой стол, слабые флипперы, широкие ауты, спасение 5 с',
  colors: ['#c026d3', '#0b1030'],
  controls: 'none',
  multiTouch: true,
  isNew4: true,
  cat: 'arcade',
  medals: [100000, 400000, 1200000],
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="pinballBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e1065"/><stop offset="1" stop-color="#030712"/></linearGradient>' +
    '<radialGradient id="pinballB" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#cbd5e1"/><stop offset="1" stop-color="#334155"/></radialGradient>' +
    '<radialGradient id="pinballC" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#f0abfc"/><stop offset="1" stop-color="#a21caf"/></radialGradient>' +
    '<radialGradient id="pinballD" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#67e8f9"/><stop offset="1" stop-color="#0e7490"/></radialGradient>' +
    '<linearGradient id="pinballF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#cbd5e1"/></linearGradient></defs>' +
    '<rect x="4" y="4" width="92" height="92" rx="18" fill="url(#pinballBg)"/>' +
    '<path d="M12 96V40a38 32 0 0 1 76 0v56" fill="none" stroke="#94a3b8" stroke-width="3"/>' +
    '<path d="M22 70l-2 18M78 70l2 18" stroke="#22d3ee" stroke-width="2" opacity=".7"/>' +
    '<circle cx="36" cy="38" r="10" fill="#4a044e"/><circle cx="36" cy="38" r="7.5" fill="url(#pinballC)"/>' +
    '<circle cx="64" cy="38" r="10" fill="#083344"/><circle cx="64" cy="38" r="7.5" fill="url(#pinballD)"/>' +
    '<circle cx="50" cy="56" r="10" fill="#4a044e"/><circle cx="50" cy="56" r="7.5" fill="url(#pinballC)"/>' +
    '<path d="M44 66l3-4 3 4zM50 72l3-4 3 4z" fill="#facc15"/>' +
    '<path d="M24 82l20 7" stroke="#ef4444" stroke-width="8" stroke-linecap="round"/><path d="M24 82l20 7" stroke="url(#pinballF)" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M76 82l-20 7" stroke="#ef4444" stroke-width="8" stroke-linecap="round"/><path d="M76 82l-20 7" stroke="url(#pinballF)" stroke-width="5" stroke-linecap="round"/>' +
    '<circle cx="62" cy="70" r="6" fill="#22d3ee" opacity=".35"/><circle cx="60" cy="72" r="5" fill="url(#pinballB)"/></svg>',

  create: function (api) {
    var LW = 360, LH = 712, CX = 166, R = 8, HS = 1 / 480, VMAX = 1750, PI = Math.PI;
    var DIFF = [
      { g: 760, fw: 26, out: 23, save: 14 },
      { g: 880, fw: 24, out: 25, save: 10 },
      { g: 1000, fw: 22.5, out: 27, save: 7 },
      { g: 1120, fw: 21, out: 30, save: 5 }];
    var D, gL, gR, segs, bumpers, posts, drops, flips, sensors, drawPolys, slings, inserts, rampPts, rampCum, rampLen, rampPeak;
    var balls, queue, t, ballNo, mult, bonus, lanes, skill, skillOn, dropT, rampCount, mb, saveT, saveArmed, plunger, msgs, endT, overT;
    var started, playT, inl, orbitT, rampT, sparks, touches, lastMulti, keyL, keyR, keyP, combo, comboT, laneSpin, shakeT;
    var layers = null, layerKey = '', S = 1, OX = 0, OY = 0, dmdC = null, dmdX = null, sprites = null;
    var DMD = { x: 12, y: 6, w: 336, h: 56, cols: 128, rows: 21 };

    function mx(x) { return 2 * CX - x; }
    function seg(ax, ay, bx, by, r, e, kind, extra) {
      var s = { ax: ax, ay: ay, bx: bx, by: by, dx: bx - ax, dy: by - ay, r: r, e: e, kind: kind || 'wall' };
      var l2 = s.dx * s.dx + s.dy * s.dy; s.il2 = l2 ? 1 / l2 : 0; s.len = Math.sqrt(l2);
      s.nx = s.len ? s.dy / s.len : 0; s.ny = s.len ? -s.dx / s.len : 0;
      s.x0 = Math.min(ax, bx) - r - R - 2; s.x1 = Math.max(ax, bx) + r + R + 2; s.y0 = Math.min(ay, by) - r - R - 2; s.y1 = Math.max(ay, by) + r + R + 2;
      if (extra) for (var k in extra) s[k] = extra[k];
      segs.push(s); return s;
    }
    function poly(pts, r, e, style) {
      for (var i = 0; i < pts.length - 1; i++) seg(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], r, e);
      drawPolys.push({ pts: pts, r: r, style: style || 'rail' });
    }
    function post(x, y, r, e, style) { posts.push({ x: x, y: y, r: r, e: e, style: style || 'rubber' }); }
    function catmull(P, n) {
      var out = [], i, k;
      for (i = 0; i < P.length - 1; i++) {
        var p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
        for (k = 0; k < n; k++) {
          var u = k / n, u2 = u * u, u3 = u2 * u;
          out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
            0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)]);
        }
      }
      out.push(P[P.length - 1]); return out;
    }

    function buildTable() {
      segs = []; bumpers = []; posts = []; drops = []; drawPolys = []; slings = []; inserts = [];
      gL = 14 + D.out; gR = mx(gL);
      var i, arch = [];
      for (i = 0; i <= 44; i++) { var a = PI + i / 44 * PI; arch.push([180 + Math.cos(a) * 166, 240 + Math.sin(a) * 165]); }
      poly(arch, 3, 0.4, 'outer');
      poly([[14, 240], [14, LH + 40]], 3, 0.4, 'outer');
      poly([[346, 240], [346, LH + 40]], 3, 0.4, 'outer');
      // жёлоб плунжера
      poly([[318, 206], [318, LH + 40]], 2.5, 0.4, 'rail');
      post(318, 206, 3.2, 0.4, 'chrome');
      seg(318, 684, 346, 684, 2, 0.2, 'floor');
      seg(318, 207, 341, 199, 2, 0.35, 'gate', { one: true });
      // верхние дорожки
      [110, 150, 190, 230].forEach(function (x) { poly([[x, 110], [x, 140]], 3, 0.5, 'rail'); post(x, 110, 3.6, 0.5, 'chrome'); });
      // рампа слева и орбита справа
      poly([[58, 352], [54, 282]], 2.5, 0.5, 'rail'); post(54, 282, 4, 0.6, 'rubber'); post(58, 352, 4, 0.6, 'rubber');
      poly([[274, 352], [278, 292]], 2.5, 0.5, 'rail'); post(278, 292, 4, 0.6, 'rubber'); post(274, 352, 4, 0.6, 'rubber');
      // бамперы
      [[128, 205, '#e879f9'], [206, 205, '#22d3ee'], [167, 262, '#facc15']].forEach(function (b, k) { bumpers.push({ x: b[0], y: b[1], r: 17, col: b[2], f: 0, id: k }); });
      // мишени
      for (i = 0; i < 3; i++) { var x0 = 134 + i * 23; drops.push(seg(x0 + 2, 338, x0 + 19, 338, 3.5, 0.45, 'drop', { idx: i, down: false, anim: 0 })); }
      // флипперы
      flips = [mkFlip(CX - 60, 630, 1), mkFlip(CX + 60, 630, -1)];
      // направляющие инлейнов и рогатки (зеркально)
      [1, -1].forEach(function (sd) {
        var X = function (x) { return sd > 0 ? x : mx(x); };
        poly([[X(gL), 470], [X(gL), 590], [X(CX - 66), 625]], 2.5, 0.45, 'rail');
        post(X(gL), 470, 3.4, 0.6, 'rubber');
        var A = [X(gL + 24), 500], B = [X(gL + 24), 566], C = [X(CX - 84), 584];
        var sl = { A: A, B: B, C: C, f: 0, sd: sd };
        seg(A[0], A[1], B[0], B[1], 2.5, 0.4); seg(B[0], B[1], C[0], C[1], 2.5, 0.4);
        // ударная грань: нормаль к центру стола
        var fs = sd > 0 ? seg(A[0], A[1], C[0], C[1], 2.5, 0.6, 'sling', { sl: sl }) : seg(C[0], C[1], A[0], A[1], 2.5, 0.6, 'sling', { sl: sl });
        sl.seg = fs; slings.push(sl);
        post(A[0], A[1], 3.2, 0.6, 'rubber'); post(B[0], B[1], 3.2, 0.5, 'rubber'); post(C[0], C[1], 3.2, 0.5, 'rubber');
      });
      sensors = [
        { y: 126, x0: 113, x1: 147, id: 'lane', k: 0, dir: 0 }, { y: 126, x0: 153, x1: 187, id: 'lane', k: 1, dir: 0 }, { y: 126, x0: 193, x1: 227, id: 'lane', k: 2, dir: 0 },
        { y: 286, x0: 14, x1: 53, id: 'ramp', dir: -1 }, { y: 296, x0: 279, x1: 318, id: 'orbit', dir: -1 },
        { y: 532, x0: gL, x1: gL + 24, id: 'inl', k: 0, dir: 1 }, { y: 532, x0: gR - 24, x1: gR, id: 'inl', k: 1, dir: 1 },
        { y: 565, x0: 14, x1: gL, id: 'out', dir: 1 }, { y: 565, x0: gR, x1: 318, id: 'out', dir: 1 }];
      // путь рампы
      rampPts = catmull([[34, 286], [35, 205], [50, 150], [86, 116], [146, 98], [214, 98], [266, 120], [296, 168], [304, 236], [303, 330], [296, 400], [gR - 12, 446], [gR - 12, 482]], 8);
      rampCum = [0]; rampPeak = 0;
      for (i = 1; i < rampPts.length; i++) {
        rampCum.push(rampCum[i - 1] + Math.hypot(rampPts[i][0] - rampPts[i - 1][0], rampPts[i][1] - rampPts[i - 1][1]));
        if (rampPts[i][1] < rampPts[rampPeak][1]) rampPeak = i;
      }
      rampLen = rampCum[rampCum.length - 1]; rampPeak = rampCum[rampPeak];
      // вставки-огоньки
      inserts = [];
      function ins(o) { inserts.push(o); return o; }
      for (i = 0; i < 3; i++) ins({ sh: 'chev', x: 34, y: 378 + i * 22, s: 9, col: '#22d3ee', on: (function (k) { return function () { return rampCount > k || (rampCount === k && blink(4)); }; })(i) });
      ins({ sh: 'chev', x: 298, y: 378, s: 9, col: '#a3e635', on: function () { return orbitT > 0 ? blink(12) : false; } });
      ins({ sh: 'chev', x: 298, y: 400, s: 9, col: '#a3e635', on: function () { return orbitT > 0.4; } });
      for (i = 0; i < 3; i++) ins({ sh: 'circ', x: 130 + i * 40, y: 160, s: 6, col: '#facc15', on: (function (k) { return function () { return lanes[k] || (skillOn && skill === k && blink(6)); }; })(i) });
      for (i = 0; i < 3; i++) ins({ sh: 'rect', x: 144 + i * 23, y: 356, s: 7, col: '#fb923c', on: (function (k) { return function () { return drops[k].down; }; })(i) });
      ins({ sh: 'star', x: CX, y: 404, s: 15, col: '#e879f9', on: function () { return mb ? blink(5) : rampCount >= 2 && blink(2.5); } });
      for (i = 0; i < 4; i++) ins({ sh: 'circ', x: 118 + i * 32, y: 452, s: 10, col: '#38bdf8', label: (i + 2) + 'X', on: (function (k) { return function () { return mult >= k + 2; }; })(i) });
      ins({ sh: 'tri', x: gL + 12, y: 548, s: 6, col: '#4ade80', on: function () { return inl[0]; } });
      ins({ sh: 'tri', x: gR - 12, y: 548, s: 6, col: '#4ade80', on: function () { return inl[1]; } });
      ins({ sh: 'circ', x: (14 + gL) / 2, y: 600, s: 5, col: '#f43f5e', on: function () { return saveT > 0 && blink(3); } });
      ins({ sh: 'circ', x: (318 + gR) / 2, y: 600, s: 5, col: '#f43f5e', on: function () { return saveT > 0 && blink(3); } });
      ins({ sh: 'again', x: CX, y: 604, s: 8, col: '#ef4444', on: function () { return saveT > 0 && (saveT > 2 || blink(8)); } });
    }
    function blink(f) { return Math.sin(t * f * PI) > 0; }
    function mkFlip(px, py, side) { return { px: px, py: py, side: side, a: 0.5, len: 50, r0: 9, r1: 5, up: false, w: 0, th: side > 0 ? 0.5 : PI - 0.5 }; }
    function mkBall(x, y) { return { x: x, y: y, px: x, py: y, vx: 0, vy: 0, lane: false, ramp: null, trail: [], still: 0, auto: 0 }; }

    function msg(text, sub, dur, big) { if (msgs.length > 3) msgs.shift(); msgs.push({ text: text, sub: sub || '', t: dur || 1.6, d: dur || 1.6, big: !!big }); }
    function fmt(n) { var s = String(Math.floor(n)), o = ''; while (s.length > 3) { o = ',' + s.slice(-3) + o; s = s.slice(0, -3); } return s + o; }
    function award(p, x, y, col) {
      var v = p * mult; api.addScore(v); bonus += Math.round(p * 0.1);
      if (x !== undefined) { var sp = toScr(x, y); api.fx.text(sp.x, sp.y - 10, '+' + fmt(v), col || '#fde68a', 13); }
    }
    function toScr(x, y) { return { x: OX + x * S, y: OY + y * S }; }
    function spark(x, y, col, n, sp) {
      if (api.quality === 0) n = Math.ceil(n / 2);
      for (var i = 0; i < n && sparks.length < 160; i++) {
        var a = Math.random() * 6.283, v = (sp || 200) * (0.3 + Math.random());
        sparks.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.25 + Math.random() * 0.35, col: col });
      }
    }

    function newBall() {
      balls = [mkBall(332, 674)]; balls[0].lane = true; queue = 0;
      saveArmed = true; saveT = 0; mult = 1; bonus = 0; lanes = [false, false, false]; skill = Math.floor(Math.random() * 3); skillOn = true;
      inl = [false, false]; plunger.charge = 0; plunger.held = false; combo = 0;
      msg(api.t('pinball.ball') + ' ' + ballNo, api.t('pinball.launch'), 2.2);
    }
    function launch(b, power) {
      b.lane = false; b.vx = 0; b.vy = -Math.sqrt(2 * D.g * (420 + 420 * power)) * (0.985 + Math.random() * 0.03);
      api.tone(140, 0.18, 'sawtooth', 0.06); api.sound('move');
      if (saveArmed) { saveArmed = false; saveT = D.save; }
    }
    function laneBall() { for (var i = 0; i < balls.length; i++) if (balls[i].lane) return balls[i]; return null; }

    function startMultiball() {
      mb = true; queue += 2; saveT = Math.max(saveT, 10);
      msg(api.t('pinball.mb'), api.t('pinball.jackpotLit'), 2.6, true);
      api.sound('bonus'); api.fx.flash('#e879f9', 0.3); api.vibrate(60); shakeT = 0.4;
    }

    function stepFlips(h) {
      var lHeld = keyL, rHeld = keyR, i;
      for (i = 0; i < touches.length; i++) { if (touches[i].x < api.W / 2) lHeld = true; else rHeld = true; }
      for (i = 0; i < 2; i++) {
        var f = flips[i], want = i === 0 ? lHeld : rHeld;
        if (want && !f.up) { api.tone(95, 0.05, 'square', 0.035); laneRotate(i === 0 ? -1 : 1); }
        f.up = want;
        var oa = f.a;
        if (want) f.a = Math.max(-0.45, f.a - D.fw * h); else f.a = Math.min(0.5, f.a + 16 * h);
        var oth = f.th; f.th = f.side > 0 ? f.a : PI - f.a; f.w = (f.th - oth) / h; void oa;
      }
    }
    function laneRotate(dir) {
      if (skillOn && balls.length && balls[0].lane) { skill = (skill + dir + 3) % 3; return; }
      if (dir < 0) lanes.push(lanes.shift()); else lanes.unshift(lanes.pop());
    }

    function hitSeg(b, s) {
      if (b.x < s.x0 || b.x > s.x1 || b.y < s.y0 || b.y > s.y1) return 0;
      if (s.kind === 'drop' && s.down) return 0;
      if (s.one && (b.x - s.ax) * s.nx + (b.y - s.ay) * s.ny < 0) return 0;
      var tt = ((b.x - s.ax) * s.dx + (b.y - s.ay) * s.dy) * s.il2; tt = tt < 0 ? 0 : tt > 1 ? 1 : tt;
      var cx = s.ax + s.dx * tt, cy = s.ay + s.dy * tt, ex = b.x - cx, ey = b.y - cy, d2 = ex * ex + ey * ey, rr = R + s.r;
      if (d2 >= rr * rr) return 0;
      var d = Math.sqrt(d2), nx, ny;
      if (d < 1e-4) { nx = s.nx; ny = s.ny; } else { nx = ex / d; ny = ey / d; }
      b.x = cx + nx * rr; b.y = cy + ny * rr;
      var vn = b.vx * nx + b.vy * ny;
      if (vn >= 0) return 0;
      var e = -vn < 40 ? 0 : s.e;
      b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny;
      var tx = -ny, ty = nx, vt = b.vx * tx + b.vy * ty; b.vx -= vt * 0.015 * tx; b.vy -= vt * 0.015 * ty;
      var imp = -vn;
      if (s.kind === 'sling' && imp > 50) {
        var k = 380 + imp * 0.15; b.vx += s.nx * k; b.vy += s.ny * k; s.sl.f = 1;
        award(100); api.tone(300, 0.05, 'sawtooth', 0.05); spark(cx, cy, '#f0abfc', 8, 220);
      } else if (s.kind === 'drop') hitDrop(s);
      else if (imp > 320) api.tone(120 + Math.random() * 40, 0.03, 'triangle', 0.03);
      return imp;
    }
    function hitCirc(b, o, e) {
      var ex = b.x - o.x, ey = b.y - o.y, d2 = ex * ex + ey * ey, rr = R + o.r;
      if (d2 >= rr * rr) return 0;
      var d = Math.sqrt(d2) || 1e-4, nx = ex / d, ny = ey / d;
      b.x = o.x + nx * rr; b.y = o.y + ny * rr;
      var vn = b.vx * nx + b.vy * ny;
      if (vn >= 0) return 0;
      b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny;
      return { nx: nx, ny: ny, imp: -vn };
    }
    function hitFlip(b, f) {
      var c = Math.cos(f.th), s = Math.sin(f.th), ex = b.x - f.px, ey = b.y - f.py;
      var tt = ex * c + ey * s; if (tt < 0) tt = 0; else if (tt > f.len) tt = f.len;
      if (Math.abs(-ex * s + ey * c) > 30) return;
      var cx = f.px + c * tt, cy = f.py + s * tt, dx = b.x - cx, dy = b.y - cy, d2 = dx * dx + dy * dy;
      var rr = R + f.r0 + (f.r1 - f.r0) * tt / f.len;
      if (d2 >= rr * rr) return;
      var d = Math.sqrt(d2) || 1e-4, nx = dx / d, ny = dy / d;
      b.x = cx + nx * rr; b.y = cy + ny * rr;
      var vsx = -f.w * (cy - f.py), vsy = f.w * (cx - f.px);
      var rvx = b.vx - vsx, rvy = b.vy - vsy, vn = rvx * nx + rvy * ny;
      if (vn < 0) {
        var e = -vn < 60 ? 0 : 0.32;
        b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny;
        if (-vn > 500) api.tone(70, 0.04, 'triangle', 0.05);
      }
    }
    function hitDrop(s) {
      s.down = true; s.anim = 1; award(750, (s.ax + s.bx) / 2, s.ay, '#fdba74'); api.sound('point'); spark((s.ax + s.bx) / 2, s.ay, '#fb923c', 10, 180);
      skillOn = false;
      if (drops.every(function (q) { return q.down; })) {
        award(7500); mult = Math.min(5, mult + 1); dropT = 1.2;
        msg(api.t('pinball.targets'), mult + 'X', 1.8); api.sound('bonus');
      }
    }
    function sensorHit(b, s) {
      if (s.id === 'lane') {
        if (skillOn && s.k === skill && !b.lane) { award(15000); msg(api.t('pinball.skill'), '15,000', 2, true); api.sound('win'); api.fx.flash('#facc15', 0.2); }
        skillOn = false;
        if (!lanes[s.k]) { lanes[s.k] = true; award(500, (s.x0 + s.x1) / 2, s.y, '#fde047'); api.tone(880 + s.k * 110, 0.07, 'sine', 0.06); }
        else award(100);
        if (lanes[0] && lanes[1] && lanes[2]) {
          lanes = [false, false, false]; mult = Math.min(5, mult + 1); award(5000);
          msg(api.t('pinball.lanes'), mult + 'X', 1.8); api.sound('bonus');
        }
      } else if (s.id === 'ramp') {
        if (b.vy < -140) { b.ramp = { s: 0, v: Math.min(1150, Math.hypot(b.vx, b.vy) * 0.95) }; b.trail.length = 0; api.tone(220, 0.25, 'sawtooth', 0.04); }
      } else if (s.id === 'orbit') {
        award(2500, 298, 300, '#bef264'); orbitT = 1.6; api.tone(520, 0.12, 'triangle', 0.06); comboHit();
      } else if (s.id === 'inl') {
        inl[s.k] = true; award(1000); api.tone(700, 0.06, 'sine', 0.05);
        if (inl[0] && inl[1]) { inl = [false, false]; award(4000); msg(api.t('pinball.inlanes'), '4,000', 1.3); }
      } else if (s.id === 'out') { award(2000); api.tone(160, 0.3, 'sawtooth', 0.05); }
    }
    function comboHit() {
      if (comboT > 0) { combo++; if (combo >= 2) { award(5000 * combo); msg(api.t('pinball.combo') + ' x' + combo, fmt(5000 * combo * mult), 1.4); } }
      else combo = 1;
      comboT = 4;
    }
    function rampDone(b) {
      rampT = 1.5; api.sound('bonus');
      if (mb) {
        award(25000); msg(api.t('pinball.jackpot'), fmt(25000 * mult), 2, true); api.sound('win'); api.fx.flash('#e879f9', 0.25); api.vibrate(40);
        spark(b.x, b.y, '#f0abfc', 24, 320);
      } else {
        rampCount++; award(5000, b.x, b.y - 20, '#67e8f9');
        if (rampCount >= 3) { rampCount = 3; startMultiball(); }
        else msg(api.t('pinball.ramp'), (3 - rampCount) + ' ' + api.t('pinball.toMb'), 1.4);
      }
      comboHit();
    }
    function rampPos(sd) {
      var i = 1; while (i < rampCum.length - 1 && rampCum[i] < sd) i++;
      var a = rampPts[i - 1], bb = rampPts[i], seglen = rampCum[i] - rampCum[i - 1] || 1, u = (sd - rampCum[i - 1]) / seglen;
      u = u < 0 ? 0 : u > 1 ? 1 : u;
      return { x: a[0] + (bb[0] - a[0]) * u, y: a[1] + (bb[1] - a[1]) * u, dx: (bb[0] - a[0]) / seglen, dy: (bb[1] - a[1]) / seglen };
    }
    function stepRamp(b, h) {
      var r = b.ramp, p = rampPos(r.s);
      r.v -= D.g * 0.5 * p.dy * h;
      if (r.s > rampPeak && r.v < 140) r.v = 140;
      r.s += r.v * h;
      if (r.s <= 0) { var p0 = rampPos(0); b.ramp = null; b.x = p0.x; b.y = p0.y + 2; b.vx = 0; b.vy = Math.max(60, -r.v); return; }
      if (r.s >= rampLen) {
        var pe = rampPos(rampLen); b.ramp = null; b.x = pe.x; b.y = pe.y; var sp = Math.min(380, Math.max(180, r.v));
        b.vx = pe.dx * sp; b.vy = pe.dy * sp; rampDone(b); return;
      }
      p = rampPos(r.s); b.x = p.x; b.y = p.y;
    }

    function physics(h) {
      var i, j, k, b, n = balls.length;
      for (i = 0; i < n; i++) {
        b = balls[i];
        if (b.lane || b.dead) continue;
        if (b.ramp) { stepRamp(b, h); continue; }
        b.px = b.x; b.py = b.y;
        b.vy += D.g * h;
        var sp2 = b.vx * b.vx + b.vy * b.vy;
        if (sp2 > VMAX * VMAX) { var kf = VMAX / Math.sqrt(sp2); b.vx *= kf; b.vy *= kf; }
        b.x += b.vx * h; b.y += b.vy * h;
        for (k = 0; k < segs.length; k++) hitSeg(b, segs[k]);
        for (k = 0; k < posts.length; k++) hitCirc(b, posts[k], posts[k].e);
        for (k = 0; k < bumpers.length; k++) {
          var bm = bumpers[k], hc = hitCirc(b, bm, 0.5);
          if (hc) {
            var vn = b.vx * hc.nx + b.vy * hc.ny, kick = 470;
            if (vn < kick) { b.vx += (kick - vn) * hc.nx; b.vy += (kick - vn) * hc.ny; }
            if (bm.f < 0.6) {
              bm.f = 1; award(300, bm.x, bm.y - 20, bm.col); skillOn = false;
              api.tone(640 + bm.id * 120, 0.06, 'square', 0.05); spark(bm.x + hc.nx * bm.r, bm.y + hc.ny * bm.r, bm.col, 10, 260);
            }
          }
        }
        for (k = 0; k < 2; k++) hitFlip(b, flips[k]);
        for (k = 0; k < sensors.length; k++) {
          var s = sensors[k];
          if ((b.py - s.y) * (b.y - s.y) <= 0 && b.py !== b.y && b.x >= s.x0 && b.x <= s.x1) {
            if (s.dir === 0 || (s.dir > 0) === (b.y > b.py)) sensorHit(b, s);
            if (b.ramp) break;
          }
        }
        // покой в жёлобе плунжера
        if (b.x > 320 && b.y > 640 && Math.abs(b.vy) < 40 && Math.abs(b.vx) < 40 && !laneBallExcept(b)) {
          b.lane = true; b.x = 332; b.y = 674; b.vx = b.vy = 0;
          if (balls.length > 1 || queue > 0 || b.auto) b.auto = 0.4;
        }
        if (b.y > LH + 14) b.dead = true;
      }
      // столкновения шаров между собой
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
        var p = balls[i], q = balls[j];
        if (p.dead || q.dead || p.lane || q.lane || p.ramp || q.ramp) continue;
        var dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy;
        if (d2 < 4 * R * R && d2 > 1e-6) {
          var d = Math.sqrt(d2), nx = dx / d, ny = dy / d, ov = (2 * R - d) / 2;
          p.x -= nx * ov; p.y -= ny * ov; q.x += nx * ov; q.y += ny * ov;
          var rv = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;
          if (rv < 0) { var jj = -rv * 0.95; p.vx -= nx * jj; p.vy -= ny * jj; q.vx += nx * jj; q.vy += ny * jj; }
        }
      }
    }
    function laneBallExcept(b) { for (var i = 0; i < balls.length; i++) if (balls[i] !== b && balls[i].lane) return true; return false; }

    function endBall() {
      var bon = bonus * mult;
      msg(api.t('pinball.bonus'), fmt(bonus) + ' x ' + mult + ' = ' + fmt(bon), 2.2);
      api.addScore(bon); api.sound('life'); api.vibrate(80);
      endT = 2.4;
    }

    var self = {
      reset: function () {
        D = DIFF[api.diff] || DIFF[1];
        buildTable(); layerKey = '';
        t = 0; started = false; playT = 0; ballNo = 1; mult = 1; bonus = 0; dropT = 0; rampCount = 0; mb = false; saveT = 0; msgs = []; endT = 0; overT = 0;
        orbitT = 0; rampT = 0; sparks = []; touches = []; lastMulti = 0; keyL = keyR = keyP = false; combo = 0; comboT = 0; laneSpin = 0; shakeT = 0;
        plunger = { charge: 0, held: false, holdT: 0, sy: 0 };
        newBall();
      },
      resize: function () { layerKey = ''; },
      idle: function (dt) { t += dt; },
      input: function (type, d) {
        var now = (window.performance && performance.now) ? performance.now() : Date.now();
        if (type === 'multi') { touches = d.slice(); lastMulti = now; if (plunger.held && d.length) plunger.cy = d[0].y; }
        else if (type === 'press') {
          touches.push({ x: d.x, y: d.y });
          var lb = laneBall();
          if (lb && !lb.auto && endT <= 0 && overT <= 0 && !plunger.held) { plunger.held = true; plunger.holdT = 0; plunger.sy = d.y; plunger.cy = d.y; }
        } else if (type === 'move') { if (plunger.held) plunger.cy = d.y; }
        else if (type === 'up') { if (now - lastMulti > 4) touches = []; }
      },
      key: function (k, down) {
        if (k === 'left') keyL = down;
        else if (k === 'right') keyR = down;
        else if (k === 'a' || k === 'down' || k === 'b') {
          keyP = down; var lb = laneBall();
          if (down && lb && !lb.auto && !plunger.held) { plunger.held = true; plunger.holdT = 0; plunger.sy = plunger.cy = 0; }
        }
      },
      update: function (dt) {
        t += dt; playT += dt; started = true; var i;
        if (msgs.length) { msgs[0].t -= dt; if (msgs[0].t <= 0) msgs.shift(); }
        if (orbitT > 0) orbitT -= dt; if (rampT > 0) rampT -= dt; if (comboT > 0) { comboT -= dt; if (comboT <= 0) combo = 0; }
        if (shakeT > 0) shakeT -= dt;
        for (i = 0; i < bumpers.length; i++) if (bumpers[i].f > 0) bumpers[i].f = Math.max(0, bumpers[i].f - dt * 5);
        for (i = 0; i < slings.length; i++) if (slings[i].f > 0) slings[i].f = Math.max(0, slings[i].f - dt * 7);
        for (i = 0; i < drops.length; i++) if (drops[i].anim > 0) drops[i].anim = Math.max(0, drops[i].anim - dt * 4);
        if (dropT > 0) { dropT -= dt; if (dropT <= 0) { drops.forEach(function (q) { q.down = false; q.anim = 0; }); api.tone(400, 0.1, 'square', 0.04); } }
        if (overT > 0) { overT -= dt; if (overT <= 0) api.gameOver(); stepFlips(dt); return; }
        if (endT > 0) {
          endT -= dt;
          if (endT <= 0) {
            ballNo++;
            if (ballNo > 3) { msg(api.t('pinball.over'), fmt(api.getScore()), 3, true); api.sound('over'); overT = 1.8; ballNo = 3; }
            else newBall();
          }
          stepFlips(dt); return;
        }
        if (saveT > 0) saveT -= dt;
        // плунжер
        var lb = laneBall();
        if (plunger.held) {
          plunger.holdT += dt;
          var pull = plunger.cy && plunger.sy ? (plunger.cy - plunger.sy) / 150 : 0;
          plunger.charge = Math.max(0, Math.min(1, Math.max(plunger.holdT * 1.1, pull)));
          var released = !keyP && touches.length === 0;
          if (released || !lb) {
            if (lb) launch(lb, plunger.charge);
            plunger.held = false; plunger.charge = 0;
          }
        }
        if (lb && lb.auto > 0) { lb.auto -= dt; if (lb.auto <= 0) { lb.auto = 0; launch(lb, 0.55 + Math.random() * 0.2); } }
        if (queue > 0 && !lb) { var nb = mkBall(332, 674); nb.lane = true; nb.auto = 0.7; balls.push(nb); queue--; }
        // физика с подшагами
        var n = Math.min(40, Math.max(1, Math.ceil(dt / HS))), h = dt / n;
        for (i = 0; i < n; i++) { stepFlips(h); physics(h); }
        // трейлы, застревание, потери
        var alive = [];
        for (i = 0; i < balls.length; i++) {
          var b = balls[i];
          if (b.dead) {
            if (saveT > 0) { queue++; msg(api.t('pinball.saved'), '', 1.4); api.sound('rotate'); }
            continue;
          }
          if (!b.lane && api.quality > 0) { b.trail.push(b.x, b.y); if (b.trail.length > 16) b.trail.splice(0, 2); } else b.trail.length = 0;
          if (!b.lane && !b.ramp && Math.abs(b.vx) + Math.abs(b.vy) < 25) {
            b.still += dt;
            if (b.still > 2.6) { b.still = 0; b.vy = -320; b.vx = (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 80); shakeT = 0.25; msg(api.t('pinball.nudge'), '', 0.8); api.tone(90, 0.12, 'square', 0.05); }
          } else b.still = 0;
          alive.push(b);
        }
        var lost = balls.length - alive.length;
        balls = alive;
        if (lost > 0 && saveT <= 0) {
          if (mb && balls.length + queue <= 1) { mb = false; rampCount = 0; msg(api.t('pinball.mbOver'), '', 1.4); }
          if (balls.length === 0 && queue === 0) endBall();
          else api.tone(200, 0.2, 'sawtooth', 0.04);
        }
        if (mb && balls.length + queue <= 1 && saveT <= 0) { mb = false; rampCount = 0; }
        // искры
        for (i = sparks.length - 1; i >= 0; i--) {
          var p = sparks[i]; p.life -= dt; if (p.life <= 0) { sparks.splice(i, 1); continue; }
          p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy = p.vy * 0.92 + 300 * dt;
        }
      },
      draw: function (c) { draw(c); }
    };

    /* ===================== графика ===================== */
    function mkC(w, h) {
      var dpr = Math.min(2, window.devicePixelRatio || 1), cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.ceil(w * dpr)); cv.height = Math.max(1, Math.ceil(h * dpr));
      var x = cv.getContext('2d'); x.scale(dpr, dpr); return { cv: cv, x: x, w: w, h: h };
    }
    function rrect(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
    }
    function tablePath(c) { c.beginPath(); c.moveTo(14, LH); c.lineTo(14, 240); c.ellipse(180, 240, 166, 165, 0, PI, 2 * PI); c.lineTo(346, LH); c.closePath(); }
    function polyPath(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); }
    function insertPath(c, o, k) {
      var s = o.s * (k || 1), x = o.x, y = o.y;
      c.beginPath();
      if (o.sh === 'circ' || o.sh === 'again') c.arc(x, y, s, 0, 6.283);
      else if (o.sh === 'rect') { c.rect(x - s, y - s * 0.55, s * 2, s * 1.1); }
      else if (o.sh === 'chev') { c.moveTo(x, y - s); c.lineTo(x + s * 1.2, y + s * 0.3); c.lineTo(x + s * 1.2, y + s * 0.95); c.lineTo(x, y - s * 0.1); c.lineTo(x - s * 1.2, y + s * 0.95); c.lineTo(x - s * 1.2, y + s * 0.3); c.closePath(); }
      else if (o.sh === 'tri') { c.moveTo(x, y + s); c.lineTo(x + s, y - s * 0.7); c.lineTo(x - s, y - s * 0.7); c.closePath(); }
      else if (o.sh === 'star') { for (var i = 0; i < 10; i++) { var a = -PI / 2 + i * PI / 5, rr = i % 2 ? s * 0.45 : s; if (i) c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); }
    }
    function shade(hex, k) {
      var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
      if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
      return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
    }
    function glowSprite(col) {
      if (sprites.glow[col]) return sprites.glow[col];
      var o = mkC(64, 64), c = o.x, n = parseInt(col.slice(1), 16), rgb = (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
      var g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(' + rgb + ',.9)'); g.addColorStop(0.35, 'rgba(' + rgb + ',.35)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
      c.fillStyle = g; c.fillRect(0, 0, 64, 64); sprites.glow[col] = o.cv; return o.cv;
    }

    function buildLayers() {
      var W = api.W, H = api.H;
      S = Math.min(W / LW, H / LH); OX = (W - LW * S) / 2; OY = (H - LH * S) / 2;
      layerKey = W + 'x' + H + ':' + api.diff;
      sprites = { glow: {} };
      var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      // ---------- базовый слой ----------
      var o = mkC(W, H), c = o.x, i, k;
      var bg = c.createLinearGradient(0, 0, W, 0); bg.addColorStop(0, '#0a0614'); bg.addColorStop(0.5, '#170b2e'); bg.addColorStop(1, '#0a0614');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      if (OX > 4) { // боковины кабинета
        for (k = 0; k < 2; k++) {
          var sx = k ? OX + LW * S : 0, sw = OX;
          var sg = c.createLinearGradient(sx, 0, sx + sw, 0);
          sg.addColorStop(0, k ? '#3b0764' : '#1e1b4b'); sg.addColorStop(1, k ? '#1e1b4b' : '#3b0764');
          c.fillStyle = sg; c.fillRect(sx, 0, sw, H);
          c.strokeStyle = 'rgba(232,121,249,.35)'; c.lineWidth = 1.5;
          for (i = 0; i < 6; i++) { c.beginPath(); c.moveTo(sx, H * 0.2 + i * 18); c.lineTo(sx + sw, H * 0.2 + i * 18 + 40); c.stroke(); }
        }
      }
      c.save(); c.translate(OX, OY); c.scale(S, S);
      // корпус под столом
      c.fillStyle = '#05030c'; rrect(c, 4, 0, LW - 8, LH, 14); c.fill();
      // игровое поле
      c.save(); tablePath(c); c.clip();
      var pg = c.createLinearGradient(0, 70, 0, LH); pg.addColorStop(0, '#1f0a46'); pg.addColorStop(0.45, '#0f0a2e'); pg.addColorStop(1, '#050816');
      c.fillStyle = pg; c.fillRect(0, 0, LW, LH);
      function glow(x, y, r, col, a) { var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + col + ',' + a + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
      glow(167, 230, 150, '192,38,211', 0.28); glow(166, 470, 140, '14,165,233', 0.16); glow(60, 380, 90, '34,211,238', 0.12); glow(300, 380, 80, '163,230,53', 0.1);
      // синтвейв-сетка
      c.strokeStyle = 'rgba(56,189,248,.10)'; c.lineWidth = 1;
      var vx = CX, vy = 470;
      for (i = -12; i <= 12; i++) { c.beginPath(); c.moveTo(vx + i * 4, vy); c.lineTo(vx + i * 60, LH); c.stroke(); }
      for (i = 0; i < 9; i++) { var yy = vy + Math.pow(i / 8, 2) * (LH - vy); c.beginPath(); c.moveTo(0, yy); c.lineTo(LW, yy); c.stroke(); }
      // звёзды
      for (i = 0; i < 90; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.1 + rnd() * 0.4) + ')'; c.fillRect(20 + rnd() * 300, 80 + rnd() * 360, rnd() < 0.15 ? 1.6 : 0.9, rnd() < 0.15 ? 1.6 : 0.9); }
      // кольца вокруг бамперов
      c.strokeStyle = 'rgba(232,121,249,.16)'; c.lineWidth = 1.2;
      for (i = 0; i < 4; i++) { c.beginPath(); c.arc(167, 228, 70 + i * 14, 0, 6.283); c.stroke(); }
      c.strokeStyle = 'rgba(250,204,21,.12)'; c.setLineDash([3, 5]);
      c.beginPath(); c.arc(167, 228, 64, 0, 6.283); c.stroke(); c.setLineDash([]);
      // центральная звезда-эмблема
      c.strokeStyle = 'rgba(232,121,249,.25)'; c.lineWidth = 1.5;
      c.beginPath(); for (i = 0; i <= 6; i++) { var ha = -PI / 2 + i * PI / 3; c.lineTo(CX + Math.cos(ha) * 42, 420 + Math.sin(ha) * 42); } c.stroke();
      c.strokeStyle = 'rgba(56,189,248,.18)';
      c.beginPath(); for (i = 0; i <= 6; i++) { var hb = i * PI / 3; c.lineTo(CX + Math.cos(hb) * 52, 420 + Math.sin(hb) * 52); } c.stroke();
      // дорожки сверху — подложки
      for (i = 0; i < 3; i++) { var lx = 130 + i * 40, lg = c.createLinearGradient(0, 100, 0, 180); lg.addColorStop(0, 'rgba(250,204,21,.0)'); lg.addColorStop(1, 'rgba(250,204,21,.10)'); c.fillStyle = lg; c.fillRect(lx - 17, 100, 34, 80); }
      // полоса жёлоба
      c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(318, 190, 30, LH);
      for (i = 0; i < 6; i++) { c.fillStyle = 'rgba(250,204,21,' + (0.12 + i * 0.04) + ')'; var ay = 640 - i * 52; c.beginPath(); c.moveTo(332, ay - 8); c.lineTo(338, ay); c.lineTo(326, ay); c.closePath(); c.fill(); }
      // канал рампы
      var rg2 = c.createLinearGradient(0, 280, 0, 360); rg2.addColorStop(0, 'rgba(34,211,238,.18)'); rg2.addColorStop(1, 'rgba(34,211,238,0)');
      c.fillStyle = rg2; c.fillRect(16, 280, 40, 80);
      var og = c.createLinearGradient(0, 290, 0, 370); og.addColorStop(0, 'rgba(163,230,53,.15)'); og.addColorStop(1, 'rgba(163,230,53,0)');
      c.fillStyle = og; c.fillRect(278, 290, 40, 80);
      // тень рампы на поле
      c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 22; c.lineJoin = 'round'; c.lineCap = 'round';
      c.save(); c.translate(6, 8); polyPath(c, rampPts); c.stroke(); c.restore();
      // виньетка у бортов
      c.lineWidth = 26; c.strokeStyle = 'rgba(0,0,0,.35)'; tablePath(c); c.stroke();
      c.restore(); // clip
      // невключённые вставки
      for (i = 0; i < inserts.length; i++) {
        var ins = inserts[i];
        insertPath(c, ins, 1.25); c.fillStyle = 'rgba(0,0,0,.55)'; c.fill();
        insertPath(c, ins); c.fillStyle = shade(ins.col, -0.72); c.fill();
        c.strokeStyle = shade(ins.col, -0.35); c.lineWidth = 1; c.stroke();
        if (ins.label) { c.fillStyle = 'rgba(255,255,255,.35)'; c.font = '900 8px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ins.label, ins.x, ins.y + 0.5); }
        if (ins.sh === 'again') { c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.4; c.beginPath(); c.arc(ins.x, ins.y, 4, -2.4, 2); c.stroke(); }
      }
      // пластиковые накладки рогаток
      slings.forEach(function (sl) {
        var A0 = sl.A, B0 = sl.B, C0 = sl.C, gx = (A0[0] + B0[0] + C0[0]) / 3, gy = (A0[1] + B0[1] + C0[1]) / 3;
        var ex = function (p) { return [gx + (p[0] - gx) * 1.45, gy + (p[1] - gy) * 1.2]; }, A = ex(A0), B = ex(B0), C = ex(C0);
        c.fillStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.moveTo(A[0] + 3, A[1] + 4); c.lineTo(B[0] + 3, B[1] + 4); c.lineTo(C[0] + 3, C[1] + 4); c.closePath(); c.fill();
        var pg2 = c.createLinearGradient(A[0], A[1], C[0], C[1]); pg2.addColorStop(0, 'rgba(217,70,239,.85)'); pg2.addColorStop(1, 'rgba(99,102,241,.85)');
        c.fillStyle = pg2; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.lineTo(C[0], C[1]); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1; c.stroke();
        c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(B[0] + sl.sd * 3, B[1] - 8); c.lineTo(B[0] + sl.sd * 3, A[1] + 14); c.lineTo(B[0] + sl.sd * 7, A[1] + 30); c.closePath(); c.fill();
      });
      // рельсы и направляющие
      drawPolys.forEach(function (p) {
        c.lineCap = 'round'; c.lineJoin = 'round';
        if (p.style === 'outer') {
          c.strokeStyle = '#020617'; c.lineWidth = 10; polyPath(c, p.pts); c.stroke();
          c.strokeStyle = '#64748b'; c.lineWidth = 6.5; c.stroke();
          c.strokeStyle = '#cbd5e1'; c.lineWidth = 3; c.stroke();
          c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1; c.stroke();
        } else {
          c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = p.r * 2 + 3; c.save(); c.translate(2, 3); polyPath(c, p.pts); c.stroke(); c.restore();
          c.strokeStyle = '#475569'; c.lineWidth = p.r * 2 + 1; polyPath(c, p.pts); c.stroke();
          c.strokeStyle = '#cbd5e1'; c.lineWidth = p.r * 1.1; c.stroke();
          c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 0.8; c.stroke();
        }
      });
      // калитка жёлоба
      c.strokeStyle = '#94a3b8'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(318, 207); c.lineTo(341, 199); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1; c.stroke();
      // столбики
      posts.forEach(function (p) {
        c.fillStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.arc(p.x + 2, p.y + 3, p.r + 1, 0, 6.283); c.fill();
        if (p.style === 'chrome') {
          var pg3 = c.createRadialGradient(p.x - 1, p.y - 1, 0, p.x, p.y, p.r); pg3.addColorStop(0, '#fff'); pg3.addColorStop(1, '#64748b');
          c.fillStyle = pg3; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill();
        } else {
          c.fillStyle = '#0f172a'; c.beginPath(); c.arc(p.x, p.y, p.r + 0.6, 0, 6.283); c.fill();
          c.fillStyle = '#fbbf24'; c.beginPath(); c.arc(p.x, p.y, p.r - 0.6, 0, 6.283); c.fill();
          c.fillStyle = '#fef3c7'; c.beginPath(); c.arc(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.35, 0, 6.283); c.fill();
        }
      });
      // юбки бамперов
      bumpers.forEach(function (bm) {
        c.fillStyle = 'rgba(0,0,0,.55)'; c.beginPath(); c.arc(bm.x + 3, bm.y + 5, bm.r + 3, 0, 6.283); c.fill();
        var sk = c.createRadialGradient(bm.x, bm.y, bm.r * 0.6, bm.x, bm.y, bm.r + 3); sk.addColorStop(0, '#1e293b'); sk.addColorStop(1, '#94a3b8');
        c.fillStyle = sk; c.beginPath(); c.arc(bm.x, bm.y, bm.r + 3, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 0.8; c.beginPath(); c.arc(bm.x, bm.y, bm.r + 2.6, PI * 1.1, PI * 1.6); c.stroke();
      });
      // фартук внизу
      var ap = c.createLinearGradient(0, 688, 0, LH); ap.addColorStop(0, '#334155'); ap.addColorStop(0.15, '#1e293b'); ap.addColorStop(1, '#0f172a');
      c.fillStyle = ap; c.beginPath(); c.moveTo(14, 688); c.lineTo(CX - 26, 688); c.quadraticCurveTo(CX, 700, CX + 26, 688); c.lineTo(346, 688); c.lineTo(346, LH); c.lineTo(14, LH); c.closePath(); c.fill();
      c.strokeStyle = '#e879f9'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(18, 689); c.lineTo(CX - 26, 689); c.quadraticCurveTo(CX, 701, CX + 26, 689); c.lineTo(342, 689); c.stroke();
      c.strokeStyle = 'rgba(34,211,238,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(24, 700); c.lineTo(120, 700); c.moveTo(212, 700); c.lineTo(308, 700); c.stroke();
      // корпус плунжера
      var ph = c.createLinearGradient(320, 0, 344, 0); ph.addColorStop(0, '#1e293b'); ph.addColorStop(0.5, '#64748b'); ph.addColorStop(1, '#1e293b');
      c.fillStyle = ph; c.fillRect(322, 686, 20, 26);
      // DMD: рамка
      c.fillStyle = '#020617'; rrect(c, DMD.x - 6, DMD.y - 4, DMD.w + 12, DMD.h + 8, 8); c.fill();
      var fr = c.createLinearGradient(0, DMD.y - 4, 0, DMD.y + DMD.h + 4); fr.addColorStop(0, '#475569'); fr.addColorStop(1, '#0f172a');
      c.strokeStyle = fr; c.lineWidth = 2.5; c.stroke();
      c.fillStyle = '#140800'; c.fillRect(DMD.x, DMD.y, DMD.w, DMD.h);
      c.restore();
      layers = { base: o.cv };

      // ---------- верхний слой: рампа + сетка DMD ----------
      var o2 = mkC(W, H), c2 = o2.x;
      c2.save(); c2.translate(OX, OY); c2.scale(S, S);
      c2.lineJoin = 'round'; c2.lineCap = 'round';
      // прозрачный пластик входа и проволочная рампа
      c2.strokeStyle = 'rgba(103,232,249,.13)'; c2.lineWidth = 22; polyPath(c2, rampPts); c2.stroke();
      var L1 = [], L2 = [];
      for (i = 0; i < rampPts.length; i++) {
        var a0 = rampPts[Math.max(0, i - 1)], a1 = rampPts[Math.min(rampPts.length - 1, i + 1)], ddx = a1[0] - a0[0], ddy = a1[1] - a0[1], dl = Math.hypot(ddx, ddy) || 1;
        L1.push([rampPts[i][0] - ddy / dl * 10, rampPts[i][1] + ddx / dl * 10]); L2.push([rampPts[i][0] + ddy / dl * 10, rampPts[i][1] - ddx / dl * 10]);
      }
      // опоры
      c2.strokeStyle = 'rgba(148,163,184,.75)'; c2.lineWidth = 1.4;
      for (i = 4; i < rampPts.length; i += 7) { c2.beginPath(); c2.moveTo(L1[i][0], L1[i][1]); c2.lineTo(L2[i][0], L2[i][1]); c2.stroke(); }
      [L1, L2].forEach(function (L) {
        c2.strokeStyle = 'rgba(0,0,0,.5)'; c2.lineWidth = 4; polyPath(c2, L); c2.stroke();
        c2.strokeStyle = '#94a3b8'; c2.lineWidth = 2.6; c2.stroke();
        c2.strokeStyle = 'rgba(255,255,255,.9)'; c2.lineWidth = 0.9; c2.stroke();
      });
      // наклейка на входе
      c2.fillStyle = 'rgba(34,211,238,.35)'; c2.beginPath(); c2.moveTo(L1[0][0], L1[0][1]); c2.lineTo(L2[0][0], L2[0][1]); c2.lineTo(L2[10][0], L2[10][1]); c2.lineTo(L1[10][0], L1[10][1]); c2.closePath(); c2.fill();
      c2.strokeStyle = '#67e8f9'; c2.lineWidth = 1.2; c2.beginPath(); c2.moveTo(L1[0][0], L1[0][1]); c2.lineTo(L2[0][0], L2[0][1]); c2.stroke();
      c2.restore();
      // сетка DMD в экранных пикселях
      var dx0 = OX + DMD.x * S, dy0 = OY + DMD.y * S, dw = DMD.w * S, dh = DMD.h * S, pw = dw / DMD.cols, phh = dh / DMD.rows;
      var gO = mkC(dw, dh), gc = gO.x;
      gc.fillStyle = '#0a0400'; gc.fillRect(0, 0, dw, dh);
      gc.globalCompositeOperation = 'destination-out'; gc.fillStyle = '#000';
      var rr = Math.min(pw, phh) * 0.43;
      gc.beginPath();
      for (var yy2 = 0; yy2 < DMD.rows; yy2++) for (var xx2 = 0; xx2 < DMD.cols; xx2++) { var cx2 = (xx2 + 0.5) * pw, cy2 = (yy2 + 0.5) * phh; gc.moveTo(cx2 + rr, cy2); gc.arc(cx2, cy2, rr, 0, 6.283); }
      gc.fill();
      gc.globalCompositeOperation = 'source-over';
      var gl2 = gc.createLinearGradient(0, 0, 0, dh); gl2.addColorStop(0, 'rgba(255,255,255,.07)'); gl2.addColorStop(0.5, 'rgba(255,255,255,0)'); gc.fillStyle = gl2; gc.fillRect(0, 0, dw, dh);
      c2.drawImage(gO.cv, dx0, dy0, dw, dh);
      layers.top = o2.cv;
      if (!dmdC) { dmdC = document.createElement('canvas'); dmdC.width = DMD.cols; dmdC.height = DMD.rows; dmdX = dmdC.getContext('2d'); }

      // ---------- спрайты ----------
      var bo = mkC((R + 2) * 2 * S, (R + 2) * 2 * S), bc = bo.x, bR = R * S, bcx = (R + 2) * S;
      var bgr = bc.createRadialGradient(bcx - bR * 0.35, bcx - bR * 0.4, bR * 0.05, bcx, bcx, bR);
      bgr.addColorStop(0, '#ffffff'); bgr.addColorStop(0.3, '#e2e8f0'); bgr.addColorStop(0.7, '#94a3b8'); bgr.addColorStop(1, '#1e293b');
      bc.fillStyle = bgr; bc.beginPath(); bc.arc(bcx, bcx, bR, 0, 6.283); bc.fill();
      bc.save(); bc.beginPath(); bc.arc(bcx, bcx, bR, 0, 6.283); bc.clip();
      bc.fillStyle = 'rgba(30,27,75,.35)'; bc.fillRect(bcx - bR, bcx + bR * 0.15, bR * 2, bR * 0.35);
      bc.fillStyle = 'rgba(232,121,249,.35)'; bc.fillRect(bcx - bR, bcx + bR * 0.5, bR * 2, bR * 0.5);
      bc.restore();
      bc.fillStyle = 'rgba(255,255,255,.95)'; bc.beginPath(); bc.ellipse(bcx - bR * 0.35, bcx - bR * 0.42, bR * 0.28, bR * 0.17, -0.6, 0, 6.283); bc.fill();
      sprites.ball = bo.cv; sprites.ballSz = (R + 2) * 2;
      // флиппер
      var fpad = 4, fL = 50, fw = (fL + 9 + 5 + fpad * 2), fh = (9 * 2 + fpad * 2), fo = mkC(fw * S, fh * S), fc = fo.x;
      fc.scale(S, S); fc.translate(fpad + 9, fpad + 9);
      function fshape(r0, r1) { fc.beginPath(); fc.arc(0, 0, r0, PI / 2, PI * 1.5); fc.lineTo(fL, -r1); fc.arc(fL, 0, r1, -PI / 2, PI / 2); fc.closePath(); }
      fc.fillStyle = 'rgba(0,0,0,.4)'; fc.save(); fc.translate(1.5, 2.5); fshape(9, 5); fc.fill(); fc.restore();
      fc.fillStyle = '#dc2626'; fshape(9, 5); fc.fill();
      var fg = fc.createLinearGradient(0, -7, 0, 7); fg.addColorStop(0, '#ffffff'); fg.addColorStop(0.5, '#e2e8f0'); fg.addColorStop(1, '#94a3b8');
      fc.fillStyle = fg; fshape(6.6, 3.2); fc.fill();
      fc.fillStyle = 'rgba(232,121,249,.85)'; fc.fillRect(8, -1.2, fL - 14, 2.4);
      fc.fillStyle = 'rgba(255,255,255,.9)'; fc.fillRect(4, -5.2, fL - 10, 1);
      var bolt = fc.createRadialGradient(-1, -1, 0, 0, 0, 4); bolt.addColorStop(0, '#fff'); bolt.addColorStop(1, '#475569');
      fc.fillStyle = bolt; fc.beginPath(); fc.arc(0, 0, 3.6, 0, 6.283); fc.fill();
      sprites.flip = fo.cv; sprites.flipW = fw; sprites.flipH = fh; sprites.flipP = fpad + 9;
      // шляпки бамперов
      sprites.bump = [];
      bumpers.forEach(function (bm) {
        var sz = (bm.r + 4) * 2, pair = [];
        for (var lit = 0; lit < 2; lit++) {
          var q = mkC(sz * S, sz * S), qc = q.x; qc.scale(S, S); var cc = sz / 2;
          var cg = qc.createRadialGradient(cc - 3, cc - 4, 1, cc, cc, bm.r);
          if (lit) { cg.addColorStop(0, '#ffffff'); cg.addColorStop(0.35, shade(bm.col, 0.45)); cg.addColorStop(1, bm.col); }
          else { cg.addColorStop(0, shade(bm.col, 0.1)); cg.addColorStop(0.5, shade(bm.col, -0.45)); cg.addColorStop(1, shade(bm.col, -0.75)); }
          qc.fillStyle = cg; qc.beginPath(); qc.arc(cc, cc, bm.r, 0, 6.283); qc.fill();
          qc.strokeStyle = lit ? '#fff' : shade(bm.col, -0.2); qc.lineWidth = 1.6; qc.beginPath(); qc.arc(cc, cc, bm.r - 4, 0, 6.283); qc.stroke();
          qc.fillStyle = lit ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.35)'; qc.beginPath(); qc.ellipse(cc - 4, cc - 6, 6, 3, -0.4, 0, 6.283); qc.fill();
          qc.fillStyle = 'rgba(0,0,0,.35)'; qc.font = '900 8px system-ui, sans-serif'; qc.textAlign = 'center'; qc.textBaseline = 'middle'; qc.fillText('300', cc, cc + 4);
          pair.push(q.cv);
        }
        sprites.bump.push(pair);
      });
    }

    function drawDMD(c) {
      var x = dmdX, w = DMD.cols, h = DMD.rows;
      x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, w, h);
      x.fillStyle = '#ff9a2e'; x.textAlign = 'center'; x.textBaseline = 'middle';
      var m = msgs[0];
      if (m) {
        var age = m.d - m.t;
        if (m.big && age < 0.6) { // вспышка-рамка
          x.strokeStyle = '#ffb347'; x.lineWidth = 1; var ins = Math.floor(age * 10) % 3; x.strokeRect(0.5 + ins, 0.5 + ins, w - 1 - ins * 2, h - 1 - ins * 2);
        }
        if (!m.big || Math.sin(age * 18) > -0.6) { x.font = 'bold ' + (m.sub ? 10 : 13) + 'px monospace'; x.fillText(m.text, w / 2, m.sub ? 6 : h / 2 + 1, w - 4); }
        if (m.sub) { x.font = 'bold 8px monospace'; x.fillText(m.sub, w / 2, 16, w - 4); }
      } else {
        x.font = 'bold 14px monospace'; x.fillText(fmt(api.getScore()), w / 2, 8, w - 4);
        x.font = 'bold 7px monospace'; x.textAlign = 'left';
        x.fillText(api.t('pinball.ball') + ' ' + ballNo + '/3', 2, 17);
        x.textAlign = 'right'; x.fillText(mult + 'X', w - 2, 17);
        x.textAlign = 'center';
        if (mb) { if (blink(2)) x.fillText(api.t('pinball.mb'), w / 2, 17); }
        else { for (var i = 0; i < 3; i++) { x.fillStyle = i < rampCount ? '#ff9a2e' : 'rgba(255,154,46,.25)'; x.fillRect(w / 2 - 10 + i * 8, 15, 5, 4); } }
      }
      var dx0 = OX + DMD.x * S, dy0 = OY + DMD.y * S, dw = DMD.w * S, dh = DMD.h * S;
      c.save(); c.imageSmoothingEnabled = false;
      c.drawImage(dmdC, dx0, dy0, dw, dh);
      if (api.quality > 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; c.imageSmoothingEnabled = true; c.drawImage(dmdC, dx0 - 2, dy0 - 2, dw + 4, dh + 4); }
      c.restore();
    }

    function drawBall(c, b, scale) {
      var sz = sprites.ballSz * (scale || 1);
      c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(b.x + 3 * (scale || 1), b.y + 4 * (scale || 1), R * (scale || 1), R * 0.8 * (scale || 1), 0, 0, 6.283); c.fill();
      c.drawImage(sprites.ball, b.x - sz / 2, b.y - sz / 2, sz, sz);
    }
    function drawTrail(c, b) {
      var tr = b.trail, n = tr.length / 2;
      if (n < 2) return;
      var gs = glowSprite('#22d3ee');
      for (var i = 0; i < n - 1; i++) {
        var a = (i + 1) / n, r = R * (0.6 + a * 1.2);
        c.globalAlpha = a * 0.35; c.drawImage(gs, tr[i * 2] - r, tr[i * 2 + 1] - r, r * 2, r * 2);
      }
      c.globalAlpha = 1;
    }

    function draw(c) {
      var W = api.W, H = api.H, Q = api.quality, i;
      if (!layers || layerKey !== W + 'x' + H + ':' + api.diff) buildLayers();
      c.save();
      var shx = 0, shy = 0;
      if (shakeT > 0 && api.fxOn !== false) { shx = (Math.random() - 0.5) * 6 * shakeT; shy = (Math.random() - 0.5) * 6 * shakeT; }
      c.translate(shx, shy);
      c.drawImage(layers.base, 0, 0, W, H);
      c.save(); c.translate(OX, OY); c.scale(S, S);
      var attract = !started;
      // огоньки
      for (i = 0; i < inserts.length; i++) {
        var ins = inserts[i], on = attract ? Math.sin(t * 6 - i * 0.7) > 0.4 : ins.on();
        if (!on) continue;
        insertPath(c, ins); c.fillStyle = ins.col; c.fill();
        insertPath(c, ins, 0.55); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill();
        if (ins.label) { c.fillStyle = '#082f49'; c.font = '900 8px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ins.label, ins.x, ins.y + 0.5); }
        if (Q > 0) { c.globalCompositeOperation = 'lighter'; var gsz = ins.s * 5; c.globalAlpha = 0.6; c.drawImage(glowSprite(ins.col), ins.x - gsz / 2, ins.y - gsz / 2, gsz, gsz); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
      }
      // мишени
      for (i = 0; i < drops.length; i++) {
        var dr = drops[i], dx = dr.ax - 2, dw = dr.bx - dr.ax + 4;
        if (dr.down && dr.anim <= 0) { c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(dx, dr.ay - 1.5, dw, 3); continue; }
        var hgt = dr.down ? dr.anim : 1;
        c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(dx + 2, dr.ay - 1, dw, 6 * hgt);
        var tg = c.createLinearGradient(0, dr.ay - 4, 0, dr.ay + 4); tg.addColorStop(0, '#fed7aa'); tg.addColorStop(0.4, '#f97316'); tg.addColorStop(1, '#7c2d12');
        c.fillStyle = tg; c.fillRect(dx, dr.ay - 4 * hgt, dw, 8 * hgt);
        c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(dx + 1, dr.ay - 4 * hgt, dw - 2, 1.2);
      }
      // резинки рогаток
      slings.forEach(function (sl) {
        var A = sl.A, C = sl.C, bul = sl.f * 4, mx2 = (A[0] + C[0]) / 2 + sl.seg.nx * bul, my2 = (A[1] + C[1]) / 2 + sl.seg.ny * bul;
        c.strokeStyle = '#0f172a'; c.lineWidth = 5; c.lineCap = 'round';
        c.beginPath(); c.moveTo(A[0], A[1]); c.quadraticCurveTo(mx2, my2, C[0], C[1]); c.stroke();
        c.strokeStyle = sl.f > 0.1 ? '#fff' : '#e2e8f0'; c.lineWidth = 3; c.stroke();
        if (sl.f > 0 && Q > 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = sl.f; var gs2 = glowSprite('#e879f9'); c.drawImage(gs2, mx2 - 30, my2 - 30, 60, 60); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
      });
      // бамперы
      for (i = 0; i < bumpers.length; i++) {
        var bm = bumpers[i], sz = (bm.r + 4) * 2, lit = bm.f > 0 || (attract && Math.sin(t * 4 + i) > 0.5) || (mb && blink(3));
        c.drawImage(sprites.bump[i][0], bm.x - sz / 2, bm.y - sz / 2 + 1 - bm.f * 1.5, sz, sz);
        if (lit) { c.globalAlpha = bm.f > 0 ? Math.min(1, bm.f * 1.4) : 0.7; c.drawImage(sprites.bump[i][1], bm.x - sz / 2, bm.y - sz / 2 + 1 - bm.f * 1.5, sz, sz); c.globalAlpha = 1; }
        if (Q > 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25 + bm.f * 0.6; var g3 = glowSprite(bm.col), gz = bm.r * 4.2; c.drawImage(g3, bm.x - gz / 2, bm.y - gz / 2, gz, gz); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
      }
      // флипперы
      for (i = 0; i < 2; i++) {
        var f = flips[i];
        c.save(); c.translate(f.px, f.py); if (f.side < 0) c.scale(-1, 1); c.rotate(f.a);
        c.drawImage(sprites.flip, -sprites.flipP, -sprites.flipP, sprites.flipW, sprites.flipH);
        c.restore();
      }
      // плунжер
      var lb = balls && laneBall(), pc = plunger.held ? plunger.charge : 0, py = 684 + pc * 14;
      c.fillStyle = '#334155'; c.fillRect(329, py, 6, LH - py);
      c.strokeStyle = '#94a3b8'; c.lineWidth = 1.2; c.beginPath();
      for (var sy = py + 4; sy < 708; sy += 3.2 - pc * 1.2) { c.moveTo(325, sy); c.lineTo(339, sy + 1.6); } c.stroke();
      var kg = c.createLinearGradient(322, 0, 342, 0); kg.addColorStop(0, '#7f1d1d'); kg.addColorStop(0.5, '#f87171'); kg.addColorStop(1, '#7f1d1d');
      c.fillStyle = kg; rrect(c, 323, py - 2, 18, 6, 2); c.fill();
      if (plunger.held) { // индикатор силы
        c.fillStyle = 'rgba(0,0,0,.6)'; rrect(c, 300, 560, 10, 110, 4); c.fill();
        var pcol = pc > 0.8 ? '#f43f5e' : pc > 0.45 ? '#facc15' : '#4ade80';
        c.fillStyle = pcol; rrect(c, 302, 668 - 106 * pc, 6, 106 * pc, 2); c.fill();
      }
      // шары на поле
      c.save(); c.beginPath(); c.rect(0, 60, LW, 628); c.clip();
      if (balls) for (i = 0; i < balls.length; i++) {
        var b = balls[i]; if (b.ramp) continue;
        if (Q > 0 && !b.lane) { c.globalCompositeOperation = 'lighter'; drawTrail(c, b); c.globalCompositeOperation = 'source-over'; }
        if (b.lane) drawBall(c, { x: b.x, y: b.y + pc * 14 }); else drawBall(c, b);
      }
      c.restore();
      c.restore();
      // DMD-содержимое под сеткой
      drawDMD(c);
      c.drawImage(layers.top, 0, 0, W, H);
      c.save(); c.translate(OX, OY); c.scale(S, S);
      if (balls) for (i = 0; i < balls.length; i++) if (balls[i].ramp) {
        var rb = balls[i];
        if (Q > 0) { c.globalCompositeOperation = 'lighter'; drawTrail(c, rb); c.globalCompositeOperation = 'source-over'; rb.trail.push(rb.x, rb.y); if (rb.trail.length > 16) rb.trail.splice(0, 2); }
        drawBall(c, rb, 1.18);
      }
      // искры
      if (sparks.length) {
        c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        for (i = 0; i < sparks.length; i++) {
          var p = sparks[i]; c.strokeStyle = p.col; c.globalAlpha = Math.min(1, p.life * 3); c.lineWidth = 1.8;
          c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02); c.stroke();
        }
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      }
      // подсказка управления
      if (playT < 7 && ballNo === 1 && balls && balls.length && balls[0].lane && !plunger.held) {
        var al = Math.min(1, (7 - playT) / 1.5);
        c.globalAlpha = al * 0.85;
        c.fillStyle = 'rgba(2,6,23,.75)'; rrect(c, 40, 500, 252, 54, 12); c.fill();
        c.strokeStyle = 'rgba(232,121,249,.6)'; c.lineWidth = 1; c.stroke();
        c.fillStyle = '#f5d0fe'; c.font = '800 12px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(api.t('pinball.tip1'), CX, 518, 240);
        c.fillStyle = '#a5f3fc'; c.font = '700 11px system-ui, sans-serif';
        c.fillText(api.t('pinball.tip2'), CX, 538, 240);
        c.globalAlpha = 1;
      }
      c.restore();
      c.restore();
      c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }

    self._dbg = function () { return { balls: balls, flips: flips, segs: segs, D: D, sensors: sensors, plunger: plunger, launch: launch, physics: physics, stepFlips: stepFlips, st: function () { return { ballNo: ballNo, mult: mult, rampCount: rampCount, mb: mb, endT: endT, overT: overT, queue: queue, saveT: saveT }; } }; };
    return self;
  }
};
