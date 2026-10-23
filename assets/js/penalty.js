/* Пенальти: серия ударов — бей свайпом и тащи сам в воротах */
window.GAMES = window.GAMES || {};
window.GAMES.penalty = {
  title: 'Пенальти',
  desc: 'Серия пенальти: бей свайпом и тащи в воротах',
  hint: 'Твой удар: проведи пальцем от мяча к воротам. Направление свайпа — куда летит мяч, длина — высота, скорость — сила, изгиб свайпа — крутка. Потом ты в воротах: тапни туда, куда прыгнуть, — но не раньше удара! 5 ударов каждому, при равенстве — до первого промаха.',
  d0: 'Вратарь-новичок, без ветра, подсказка куда бьют',
  d1: 'Обычный вратарь, слабый ветер',
  d2: 'Умный вратарь, ветер, стенка на некоторых ударах',
  d3: 'Вратарь-звезда, сильный ветер, стенка, быстрые удары',
  colors: ['#16a34a', '#1e3a8a'],
  controls: 'none',
  isNew4: true,
  cat: 'arcade',
  medals: [400, 1150, 1900],
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="penaltySky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1026"/><stop offset="1" stop-color="#1e3a8a"/></linearGradient>' +
    '<linearGradient id="penaltyGr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15803d"/><stop offset="1" stop-color="#14532d"/></linearGradient>' +
    '<radialGradient id="penaltyBall" cx=".38" cy=".32" r=".7"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#e2e8f0"/><stop offset="1" stop-color="#64748b"/></radialGradient>' +
    '<radialGradient id="penaltyL" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fef9c3" stop-opacity=".9"/><stop offset="1" stop-color="#fef9c3" stop-opacity="0"/></radialGradient></defs>' +
    '<rect x="4" y="4" width="92" height="92" rx="20" fill="url(#penaltySky)"/><circle cx="16" cy="14" r="12" fill="url(#penaltyL)"/><circle cx="84" cy="14" r="12" fill="url(#penaltyL)"/>' +
    '<path d="M4 52H96V76Q96 96 76 96H24Q4 96 4 76Z" fill="url(#penaltyGr)"/><path d="M4 64H96V70H4Z" fill="#16a34a" opacity=".6"/><path d="M4 80H96V88H4Z" fill="#16a34a" opacity=".6"/>' +
    '<g stroke="#fff" stroke-opacity=".35" stroke-width=".8"><path d="M22 30V54M30 30V54M38 30V54M46 30V54M54 30V54M62 30V54M70 30V54M78 30V54M18 36H82M18 42H82M18 48H82"/></g>' +
    '<path d="M16 54V26H84V54" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>' +
    '<g transform="translate(60 33) rotate(-35)"><rect x="-4" y="-2" width="8" height="15" rx="3" fill="#f97316"/><circle cx="0" cy="-6" r="3.6" fill="#fcd34d"/><rect x="-11" y="-1" width="7" height="3.6" rx="1.8" fill="#f97316"/><rect x="4" y="-1" width="7" height="3.6" rx="1.8" fill="#f97316"/><circle cx="-12" cy=".8" r="2.6" fill="#fde047"/><circle cx="12" cy=".8" r="2.6" fill="#fde047"/></g>' +
    '<circle cx="36" cy="40" r="5" fill="url(#penaltyBall)"/><path d="M50 82Q36 66 37 46" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-dasharray="3 3"/>' +
    '<circle cx="50" cy="82" r="10" fill="url(#penaltyBall)"/><path d="M50 76l4 3-1.5 4.5h-5L46 79z" fill="#1e293b"/><path d="M41 80l3 1M59 80l-3 1M45 89l2-3M55 89l-2-3" stroke="#1e293b" stroke-width="1.5"/></svg>',

  create: function (api) {
    var W, H, F, HY, CAMZ = -2.5, CAMH = 1.1, GZ = 11, KZ = 10.6, NZ = 13, PW = 3.66, PH = 2.44, BR = 0.11;
    var dpr = 1, bgL = null, crowdA = null, crowdB = null, postsL = null, ballS = null, ballO = null, lw = 0, lh = 0, standTop = 0, standBot = 0;
    var phase, pT, round, res, sudden, ball, keeper, wall, wind, swipe, trail, banner, slow, slowK, net, cheer, clock, kickInfo, overT, hintT, firstKick, leg, cpuShot, earlyDive, shotsTaken;
    var rnd = Math.random;

    function rr(c, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }
    function mkC(w, h) {
      var o = document.createElement('canvas');
      o.width = Math.max(1, Math.ceil(w * dpr)); o.height = Math.max(1, Math.ceil(h * dpr));
      var x = o.getContext('2d'); x.scale(dpr, dpr); return o;
    }
    function P(x, y, z) { var d = Math.max(0.3, z - CAMZ), s = F / d; return { x: W / 2 + x * s, y: HY - (y - CAMH) * s, s: s }; }
    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function lerp(a, b, t) { return a + (b - a) * t; }

    /* ---------- статичные слои ---------- */
    function layout() {
      W = api.W; H = api.H; dpr = Math.min(2, window.devicePixelRatio || 1);
      F = Math.min(W * 1.55, H * 0.85); HY = Math.round(H * 0.34);
      lw = W; lh = H; buildBg(); buildBall();
    }
    function seeded(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
    function buildBg() {
      var c, g, i, j, R = seeded(77);
      bgL = mkC(W, H); c = bgL.getContext('2d');
      // небо
      g = c.createLinearGradient(0, 0, 0, HY);
      g.addColorStop(0, '#050816'); g.addColorStop(1, '#16224d');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (i = 0; i < 40; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.2 + R() * 0.5) + ')'; c.fillRect(R() * W, R() * HY * 0.3, 1, 1); }
      // трибуны
      standBot = P(0, 0, 16.5).y; standTop = P(0, 21, 46).y;
      var rows = [];
      for (var z = 17; z <= 46; z += 0.9) rows.push({ z: z, y: (z - 17) * 0.68 + 1.3 });
      // бетон
      for (i = rows.length - 1; i >= 0; i--) {
        var r0 = rows[i], p0 = P(0, r0.y, r0.z), p1 = i > 0 ? P(0, rows[i - 1].y, rows[i - 1].z) : P(0, 0, 16.5);
        var shade = 20 + (i % 2) * 6 + (i / rows.length) * 10;
        c.fillStyle = 'hsl(225,20%,' + shade + '%)'; c.fillRect(0, p0.y, W, p1.y - p0.y + 1);
      }
      // проход между ярусами
      var mid = rows[Math.floor(rows.length * 0.45)], pm = P(0, mid.y, mid.z);
      c.fillStyle = '#334155'; c.fillRect(0, pm.y - 3, W, 5); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(0, pm.y - 3, W, 1);
      // крыша
      g = c.createLinearGradient(0, 0, 0, standTop + 10);
      g.addColorStop(0, '#020617'); g.addColorStop(1, '#0f172a');
      c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, standTop + 6); c.quadraticCurveTo(W / 2, standTop - 18, 0, standTop + 6); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(148,163,184,.35)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, standTop + 6); c.quadraticCurveTo(W / 2, standTop - 18, W, standTop + 6); c.stroke();
      for (i = 0; i < 9; i++) { var xx = W * (i + 0.5) / 9; c.strokeStyle = 'rgba(148,163,184,.12)'; c.beginPath(); c.moveTo(xx, 0); c.lineTo(xx, standTop - 10 + Math.abs(xx - W / 2) / W * 30); c.stroke(); }
      // прожекторы
      [[W * 0.14, standTop * 0.35], [W * 0.86, standTop * 0.35]].forEach(function (L) {
        g = c.createRadialGradient(L[0], L[1], 2, L[0], L[1], W * 0.45);
        g.addColorStop(0, 'rgba(254,249,195,.55)'); g.addColorStop(0.15, 'rgba(254,249,195,.18)'); g.addColorStop(1, 'rgba(254,249,195,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, HY + 60);
        c.fillStyle = '#1e293b'; rr(c, L[0] - 22, L[1] - 9, 44, 18, 3); c.fill();
        for (var a = 0; a < 4; a++) for (var b = 0; b < 2; b++) { c.fillStyle = '#fefce8'; c.beginPath(); c.arc(L[0] - 15 + a * 10, L[1] - 3.5 + b * 7, 3, 0, 6.283); c.fill(); }
      });
      // зрители
      crowdA = mkC(W, standBot); crowdB = mkC(W, standBot);
      var pal = ['#1d4ed8', '#2563eb', '#f8fafc', '#1e40af', '#dc2626', '#b91c1c', '#facc15', '#f8fafc', '#0f172a'];
      var skin = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];
      [crowdA, crowdB].forEach(function (cv, v) {
        var cc = cv.getContext('2d'), RR = seeded(99);
        for (var i2 = rows.length - 1; i2 >= 0; i2--) {
          var row = rows[i2], pr = P(0, row.y, row.z), sp = 0.55 * pr.s;
          if (sp < 2.2) continue;
          var off = (i2 % 2) * sp / 2;
          for (var x = -sp + off; x < W + sp; x += sp) {
            if (RR() < 0.08) continue;
            var left = x < W / 2, col = RR() < 0.75 ? (left ? pal[Math.floor(RR() * 4)] : pal[4 + Math.floor(RR() * 4)]) : pal[Math.floor(RR() * pal.length)];
            var bw = sp * 0.78, bh = sp * 0.9, hy = pr.y - bh * 0.9 + (v && RR() < 0.6 ? -sp * 0.25 : 0), jx = x + (RR() - 0.5) * sp * 0.2;
            cc.fillStyle = col; rr(cc, jx - bw / 2, hy + bh * 0.25, bw, bh, bw * 0.35); cc.fill();
            cc.fillStyle = skin[Math.floor(RR() * skin.length)]; cc.beginPath(); cc.arc(jx, hy + bh * 0.08, bw * 0.3, 0, 6.283); cc.fill();
            if (v && RR() < 0.55) { // руки вверх
              cc.strokeStyle = col; cc.lineWidth = Math.max(1, bw * 0.2); cc.lineCap = 'round'; cc.beginPath();
              cc.moveTo(jx - bw * 0.35, hy + bh * 0.4); cc.lineTo(jx - bw * 0.55, hy - bh * 0.35); cc.moveTo(jx + bw * 0.35, hy + bh * 0.4); cc.lineTo(jx + bw * 0.55, hy - bh * 0.35); cc.stroke();
            }
            if (RR() < 0.04) { // флаг/шарф
              cc.fillStyle = left ? '#60a5fa' : '#f87171'; cc.fillRect(jx, hy - bh * (v ? 1.3 : 0.9), sp * 1.3, sp * 0.7);
              cc.fillStyle = '#fff'; cc.fillRect(jx, hy - bh * (v ? 1.3 : 0.9) + sp * 0.25, sp * 1.3, sp * 0.18);
              cc.strokeStyle = '#cbd5e1'; cc.lineWidth = 1; cc.beginPath(); cc.moveTo(jx, hy - bh * (v ? 1.3 : 0.9)); cc.lineTo(jx, hy + bh * 0.3); cc.stroke();
            }
          }
          // лёгкая дымка вдали
          cc.fillStyle = 'rgba(22,34,77,' + Math.min(0.45, i2 / rows.length * 0.5) + ')'; cc.fillRect(0, pr.y - sp * 1.2, W, sp * 1.2 + 1);
        }
      });
      // газон
      var gy = P(0, 0, 16.5).y;
      c.fillStyle = '#14532d'; c.fillRect(0, gy, W, H - gy);
      var zs = [], zz;
      for (zz = 16.5; zz > CAMZ + 0.5; zz -= 1.5) zs.push(zz);
      for (i = 0; i < zs.length; i++) {
        var a1 = P(0, 0, zs[i]).y, a2 = i + 1 < zs.length ? P(0, 0, zs[i + 1]).y : H;
        g = c.createLinearGradient(0, a1, 0, a2);
        var L = i % 2 ? 30 : 35;
        g.addColorStop(0, 'hsl(128,52%,' + (L - 3) + '%)'); g.addColorStop(1, 'hsl(128,52%,' + L + '%)');
        c.fillStyle = g; c.fillRect(0, a1, W, a2 - a1 + 1);
      }
      if (api.quality > 0) for (i = 0; i < W * (H - gy) / 6; i++) { c.fillStyle = R() < 0.5 ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.05)'; var yy = gy + R() * (H - gy); c.fillRect(R() * W, yy, 1 + (yy - gy) / 120, 1); }
      // рекламные щиты
      var bTop = P(0, 0.9, 15.5).y, bBot = P(0, 0, 15.5).y;
      g = c.createLinearGradient(0, bTop, 0, bBot); g.addColorStop(0, '#1e3a8a'); g.addColorStop(1, '#0c1a4a');
      c.fillStyle = g; c.fillRect(0, bTop, W, bBot - bTop);
      c.font = '900 ' + Math.round((bBot - bTop) * 0.62) + 'px system-ui, sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'center';
      var seg = (bBot - bTop) * 6;
      for (i = 0; i * seg < W + seg; i++) {
        var sx = i * seg + seg / 2, kind = i % 3;
        c.fillStyle = kind === 0 ? '#facc15' : kind === 1 ? '#f8fafc' : '#22d3ee';
        c.fillText(kind === 1 ? 'GAMEBOX' : kind === 0 ? '★ GOAL ★' : 'PLAY!', sx, (bTop + bBot) / 2 + 1);
        c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(i * seg, bTop, 1.5, bBot - bTop);
      }
      c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(0, bTop, W, 1);
      // разметка
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineCap = 'round';
      function line3(x1, z1, x2, z2, w) { var a = P(x1, 0, z1), b = P(x2, 0, z2); c.lineWidth = Math.max(1, w * (a.s + b.s) / 2); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
      line3(-40, GZ, 40, GZ, 0.12);
      line3(-9.16, GZ, -9.16, GZ - 5.5, 0.12); line3(9.16, GZ, 9.16, GZ - 5.5, 0.12); line3(-9.16, GZ - 5.5, 9.16, GZ - 5.5, 0.12);
      line3(-20.16, GZ, -20.16, -2.6, 0.12); line3(20.16, GZ, 20.16, -2.6, 0.12);
      var ps = P(0, 0, 0); c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(ps.x, ps.y, 0.13 * ps.s, 0.05 * ps.s, 0, 0, 6.283); c.fill();
      // тень ворот
      c.fillStyle = 'rgba(0,0,0,.18)';
      var q1 = P(-PW, 0, GZ), q2 = P(PW, 0, GZ), q3 = P(PW + 0.6, 0, NZ + 0.4), q4 = P(-PW - 0.6, 0, NZ + 0.4);
      c.beginPath(); c.moveTo(q1.x, q1.y); c.lineTo(q2.x, q2.y); c.lineTo(q3.x, q3.y); c.lineTo(q4.x, q4.y); c.closePath(); c.fill();
      // боковые сетки и крыша сетки
      c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 0.8;
      var NR = 2.2;
      for (j = 0; j <= 8; j++) { // боковые
        var t = j / 8, zz2 = lerp(GZ, NZ, t), hh = lerp(PH, NR, t);
        [-PW, PW].forEach(function (sx2) { var a = P(sx2, 0, zz2), b = P(sx2, hh, zz2); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); });
      }
      for (j = 0; j <= 7; j++) {
        var hy2 = PH * j / 7;
        [-PW, PW].forEach(function (sx2) { var a = P(sx2, hy2, GZ), b = P(sx2, Math.min(hy2, NR), NZ); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); });
      }
      for (j = 0; j <= 20; j++) { var xx2 = -PW + 2 * PW * j / 20, a = P(xx2, PH, GZ), b = P(xx2, NR, NZ); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
      for (j = 1; j <= 4; j++) { var t2 = j / 4, a3 = P(-PW, lerp(PH, NR, t2), lerp(GZ, NZ, t2)), b3 = P(PW, lerp(PH, NR, t2), lerp(GZ, NZ, t2)); c.beginPath(); c.moveTo(a3.x, a3.y); c.lineTo(b3.x, b3.y); c.stroke(); }
      // штанги (отдельный слой поверх мяча в сетке)
      postsL = mkC(W, H); c = postsL.getContext('2d');
      var pl = P(-PW, 0, GZ), pr2 = P(PW, 0, GZ), tl = P(-PW, PH, GZ), tr = P(PW, PH, GZ), pw = 0.12 * pl.s;
      [[pl, tl], [pr2, tr]].forEach(function (pp) {
        g = c.createLinearGradient(pp[0].x - pw / 2, 0, pp[0].x + pw / 2, 0);
        g.addColorStop(0, '#94a3b8'); g.addColorStop(0.35, '#fff'); g.addColorStop(1, '#cbd5e1');
        c.fillStyle = g; c.fillRect(pp[0].x - pw / 2, pp[1].y - pw / 2, pw, pp[0].y - pp[1].y + pw / 2);
      });
      g = c.createLinearGradient(0, tl.y - pw / 2, 0, tl.y + pw / 2);
      g.addColorStop(0, '#fff'); g.addColorStop(0.6, '#e2e8f0'); g.addColorStop(1, '#94a3b8');
      c.fillStyle = g; c.fillRect(tl.x - pw / 2, tl.y - pw / 2, tr.x - tl.x + pw, pw);
      // задние стойки
      c.strokeStyle = '#cbd5e1'; c.lineWidth = Math.max(1, pw * 0.35);
      [-PW, PW].forEach(function (sx2) { var a = P(sx2, PH, GZ), b = P(sx2, NR, NZ), d = P(sx2, 0, NZ); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(d.x, d.y); c.stroke(); });
    }
    function buildBall() {
      var r = 64, c, g;
      ballS = mkC(r * 2, r * 2); c = ballS.getContext('2d');
      g = c.createRadialGradient(r * 0.75, r * 0.7, r * 0.1, r, r, r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.75, '#e5e7eb'); g.addColorStop(1, '#9ca3af');
      c.fillStyle = g; c.beginPath(); c.arc(r, r, r - 1, 0, 6.283); c.fill();
      ballO = mkC(r * 2, r * 2); c = ballO.getContext('2d');
      g = c.createRadialGradient(r * 0.65, r * 0.55, r * 0.05, r, r, r);
      g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(0.25, 'rgba(255,255,255,.1)'); g.addColorStop(0.7, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(15,23,42,.55)');
      c.fillStyle = g; c.beginPath(); c.arc(r, r, r - 1, 0, 6.283); c.fill();
    }

    /* ---------- мяч: панели на вращающейся сфере ---------- */
    var ICO = (function () {
      var t = (1 + Math.sqrt(5)) / 2, v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
      return v.map(function (p) {
        var l = Math.hypot(p[0], p[1], p[2]), n = [p[0] / l, p[1] / l, p[2] / l];
        var a = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
        var t1 = [n[1] * a[2] - n[2] * a[1], n[2] * a[0] - n[0] * a[2], n[0] * a[1] - n[1] * a[0]], l1 = Math.hypot(t1[0], t1[1], t1[2]);
        t1 = [t1[0] / l1, t1[1] / l1, t1[2] / l1];
        var t2 = [n[1] * t1[2] - n[2] * t1[1], n[2] * t1[0] - n[0] * t1[2], n[0] * t1[1] - n[1] * t1[0]];
        var pts = [];
        for (var k = 0; k < 5; k++) {
          var an = k * 1.2566, q = [n[0] + 0.36 * (Math.cos(an) * t1[0] + Math.sin(an) * t2[0]), n[1] + 0.36 * (Math.cos(an) * t1[1] + Math.sin(an) * t2[1]), n[2] + 0.36 * (Math.cos(an) * t1[2] + Math.sin(an) * t2[2])];
          var lq = Math.hypot(q[0], q[1], q[2]); pts.push([q[0] / lq, q[1] / lq, q[2] / lq]);
        }
        return { n: n, p: pts };
      });
    })();
    function rotM(M, ax, ang) {
      var l = Math.hypot(ax[0], ax[1], ax[2]) || 1, x = ax[0] / l, y = ax[1] / l, z = ax[2] / l, c = Math.cos(ang), s = Math.sin(ang), C = 1 - c;
      var R = [c + x * x * C, x * y * C - z * s, x * z * C + y * s, y * x * C + z * s, c + y * y * C, y * z * C - x * s, z * x * C - y * s, z * y * C + x * s, c + z * z * C];
      var o = [];
      for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) o.push(R[i * 3] * M[j] + R[i * 3 + 1] * M[3 + j] + R[i * 3 + 2] * M[6 + j]);
      return o;
    }
    function mv(M, v) { return [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]]; }
    function drawBall(c, x, y, r) {
      if (r < 0.8) return;
      c.drawImage(ballS, x - r, y - r, r * 2, r * 2);
      if (r > 3) {
        c.fillStyle = '#111827';
        for (var i = 0; i < ICO.length; i++) {
          var n = mv(ball.M, ICO[i].n);
          if (n[2] > 0.15) continue;
          c.beginPath();
          for (var k = 0; k < 5; k++) { var q = mv(ball.M, ICO[i].p[k]); c.lineTo(x + q[0] * r * 0.97, y - q[1] * r * 0.97); }
          c.closePath(); c.fill();
        }
      }
      c.drawImage(ballO, x - r, y - r, r * 2, r * 2);
    }

    /* ---------- люди ---------- */
    function limb(c, x1, y1, x2, y2, w, col) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
    // центр тела в (sx,sy), sc — пикселей на метр, ang — наклон (рад, + вправо), pose: idle|ready|dive|up|stand, kit
    function drawPerson(c, sx, sy, sc, ang, pose, kit, back, t) {
      c.save(); c.translate(sx, sy); c.rotate(ang); c.scale(sc, sc);
      c.lineCap = 'round'; c.lineJoin = 'round';
      var bob = pose === 'idle' ? Math.sin(t * 6) * 0.02 : 0;
      // ноги
      var spread = pose === 'ready' ? 0.32 : pose === 'dive' ? 0.12 : pose === 'up' ? 0.1 : 0.22, bend = pose === 'ready' ? 0.08 : 0;
      [-1, 1].forEach(function (s) {
        var fx = s * spread, fy = 0.93 - bend;
        limb(c, s * 0.1, 0.05, s * (spread * 0.7 + bend), 0.5, 0.15, kit.skin);
        limb(c, s * (spread * 0.7 + bend), 0.5, fx, fy, 0.13, kit.skin);
        limb(c, s * (spread * 0.78 + bend * 0.8), 0.6, fx, fy - 0.05, 0.14, kit.sock);
        c.fillStyle = kit.boot; c.beginPath(); c.ellipse(fx + s * 0.04, fy + 0.03, 0.11, 0.06, 0, 0, 6.283); c.fill();
      });
      // шорты
      c.fillStyle = kit.shorts; c.beginPath(); c.moveTo(-0.22, -0.05); c.lineTo(0.22, -0.05); c.lineTo(0.25, 0.25); c.lineTo(0.02, 0.25); c.lineTo(0, 0.12); c.lineTo(-0.02, 0.25); c.lineTo(-0.25, 0.25); c.closePath(); c.fill();
      // руки
      var hands;
      if (pose === 'dive' || pose === 'up') hands = [[-0.16, -1.42], [0.16, -1.42]];
      else if (pose === 'ready') hands = [[-0.62, -0.42], [0.62, -0.42]];
      else if (pose === 'wall') hands = [[-0.12, 0.02], [0.12, 0.02]];
      else hands = [[-0.45, -0.12 + bob], [0.45, -0.12 - bob]];
      [-1, 1].forEach(function (s, k) {
        var sx2 = s * 0.2, sy2 = -0.55, hx = hands[k][0], hy = hands[k][1], ex = (sx2 + hx) / 2 + s * (pose === 'dive' || pose === 'up' ? 0.05 : 0.12), ey = (sy2 + hy) / 2 + (pose === 'ready' ? 0.08 : 0);
        limb(c, sx2, sy2, ex, ey, 0.13, kit.shirt2);
        limb(c, ex, ey, hx, hy, 0.11, kit.glove ? kit.shirt2 : kit.skin);
        if (kit.glove) { c.fillStyle = kit.glove; c.beginPath(); c.arc(hx, hy, 0.1, 0, 6.283); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(hx - 0.03, hy - 0.03, 0.04, 0, 6.283); c.fill(); }
        else { c.fillStyle = kit.skin; c.beginPath(); c.arc(hx, hy, 0.06, 0, 6.283); c.fill(); }
      });
      // торс
      var g = c.createLinearGradient(-0.25, 0, 0.25, 0);
      g.addColorStop(0, kit.shirt2); g.addColorStop(0.4, kit.shirt); g.addColorStop(1, kit.shirt2);
      c.fillStyle = g; rr(c, -0.24, -0.66, 0.48, 0.66, 0.1); c.fill();
      if (kit.stripe) { c.fillStyle = kit.stripe; c.fillRect(-0.24, -0.4, 0.48, 0.09); }
      if (back && kit.num) { c.save(); c.scale(0.01, 0.01); c.fillStyle = kit.numC || '#fff'; c.font = '900 30px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(kit.num, 0, -30); c.restore(); }
      // шея и голова
      c.fillStyle = kit.skin; c.fillRect(-0.05, -0.74, 0.1, 0.1);
      c.beginPath(); c.arc(0, -0.83, 0.13, 0, 6.283); c.fill();
      c.fillStyle = kit.hair;
      if (back) { c.beginPath(); c.arc(0, -0.84, 0.135, 0, 6.283); c.fill(); }
      else {
        c.beginPath(); c.arc(0, -0.86, 0.135, Math.PI * 1.05, Math.PI * 1.95); c.fill();
        c.fillStyle = '#111'; c.beginPath(); c.arc(-0.045, -0.83, 0.018, 0, 6.283); c.arc(0.045, -0.83, 0.018, 0, 6.283); c.fill();
      }
      c.restore();
    }
    var KITS = {
      cpuGk: { shirt: '#f97316', shirt2: '#c2410c', shorts: '#111827', sock: '#f97316', boot: '#111', skin: '#e0ac69', hair: '#3b2412', glove: '#fde047', stripe: '#111827' },
      myGk: { shirt: '#22c55e', shirt2: '#15803d', shorts: '#14532d', sock: '#22c55e', boot: '#111', skin: '#f1c27d', hair: '#7c4a1e', glove: '#f8fafc', stripe: '#bbf7d0' },
      wallK: { shirt: '#dc2626', shirt2: '#991b1b', shorts: '#fff', sock: '#dc2626', boot: '#111', skin: '#c68642', hair: '#1f1309', num: '4', numC: '#fff' }
    };

    /* ---------- логика удара ---------- */
    function keeperReset(who) {
      keeper = { who: who, x: 0, cx: 0, cy: 1.0, ang: 0, tx: 0, ty: 1, a: 0, t: 0, dur: 0, diving: false, fall: 0, sx: 0, kit: who === 'cpu' ? KITS.cpuGk : KITS.myGk, pose: 'idle', vy: 0, sway: rnd() * 6 };
    }
    function startDive(hx, hy, speed, reach) {
      if (keeper.diving) return;
      var x0 = keeper.cx, dx = hx - x0;
      hy = clamp(hy, 0.15, 2.75);
      var a = Math.atan2(dx, Math.max(0.25, hy - 0.2));
      var cx = hx - Math.sin(a) * 1.45, cy = hy - Math.cos(a) * 1.45;
      cy = clamp(cy, 0.25, 1.75);
      var ddx = cx - x0; if (Math.abs(ddx) > reach) { cx = x0 + Math.sign(ddx) * reach; }
      keeper.diving = true; keeper.t = 0; keeper.sx = x0; keeper.sy = keeper.cy; keeper.tx = cx; keeper.ty = cy; keeper.a = a;
      keeper.dur = (keeper.who === 'me' ? 0.1 : 0.16) + Math.hypot(cx - x0, cy - 1) / speed;
      keeper.pose = (Math.abs(a) < 0.35) ? 'up' : 'dive';
    }
    function keeperUpdate(dt) {
      var k = keeper;
      if (!k.diving) {
        k.sway += dt;
        if (k.pose === 'idle' || k.pose === 'ready') k.cx = Math.sin(k.sway * 1.3) * 0.25 + (k.shift || 0);
        k.cy = k.pose === 'ready' ? 0.92 : 1.0;
        return;
      }
      k.t += dt;
      var p = Math.min(1, k.t / k.dur), e = 1 - Math.pow(1 - p, 2.2);
      if (p < 1) {
        k.cx = lerp(k.sx, k.tx, e); k.cy = lerp(k.sy, k.ty, e) + Math.sin(p * Math.PI) * (k.pose === 'up' ? 0.15 : 0.12); k.ang = lerp(0, k.a, Math.min(1, e * 1.3));
      } else {
        // падение
        k.vy -= 9.8 * dt; k.cy = Math.max(0.24, k.cy + k.vy * dt);
        if (Math.abs(k.a) > 0.5) k.ang = lerp(k.ang, Math.sign(k.a) * 1.45, Math.min(1, dt * 4));
        if (k.pose === 'up' && k.cy <= 1.0) { k.cy = 1.0; k.vy = 0; }
      }
    }
    function keeperSeg() {
      var k = keeper, s = Math.sin(k.ang), c = Math.cos(k.ang), arms = (k.pose === 'dive' || k.pose === 'up') ? 1.55 : 0.85;
      return { x1: k.cx - s * 0.95, y1: k.cy - c * 0.95, x2: k.cx + s * arms, y2: k.cy + c * arms, ready: !k.diving };
    }
    function segDist(px, py, s) {
      var dx = s.x2 - s.x1, dy = s.y2 - s.y1, l = dx * dx + dy * dy, t = l ? clamp(((px - s.x1) * dx + (py - s.y1) * dy) / l, 0, 1) : 0;
      return Math.hypot(px - (s.x1 + dx * t), py - (s.y1 + dy * t));
    }
    function keeperHits(x, y) {
      var s = keeperSeg(), d = segDist(x, y, s) - 0.26 - BR;
      if (s.ready) { // руки в стороны
        var ay = keeper.cy + 0.5, ad = (Math.abs(x - keeper.cx) < 0.7 ? Math.abs(y - ay) : Math.hypot(Math.abs(x - keeper.cx) - 0.7, y - ay)) - 0.14 - BR;
        d = Math.min(d, ad);
      }
      return d;
    }

    function pathPos(pth, u) {
      var w4 = 4 * u * (1 - u);
      return { x: pth.tx * u + pth.b * w4 + pth.wind * u * u, y: BR + (pth.ty - BR) * u + pth.loft * w4, z: GZ * u };
    }
    function pathVel(pth, u) {
      var d = 4 * (1 - 2 * u);
      return { x: (pth.tx + pth.b * d + 2 * pth.wind * u) / pth.T, y: ((pth.ty - BR) + pth.loft * d) / pth.T, z: GZ / pth.T };
    }
    function launch(pth, mine) {
      ball.mode = 'path'; ball.p = pth; ball.u = 0; ball.mine = mine; ball.checked = {};
      ball.spinAx = [-1, pth.b * 0.6, pth.b * 0.3]; ball.spinW = 22 + 10 / pth.T;
      trail = [];
      api.tone(110, 0.09, 'square', 0.14, -40); api.tone(70, 0.12, 'sine', 0.2);
      api.vibrate(20);
      if (wall) wall.jumpT = 0;
      // прогноз для slow-mo
      slow = 0;
    }

    function shoot(sw) {
      var pts = sw.pts, a = pts[0], b = pts[pts.length - 1], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
      if (dy > -30 || len < 45) return false;
      var dur = Math.max(60, sw.t1 - sw.t0), v = len / dur;
      // цель = куда указывает свайп, если вести его от мяча
      var bp = P(0, BR, 0), gs = P(0, 0, GZ).s, rise = -dy;
      var ty = clamp(CAMH - ((bp.y - rise) - HY) / gs, BR, 4.8);
      var Ty = P(0, ty, GZ).y, tx = clamp(dx / rise * (bp.y - Ty) / gs, -9, 9);
      var T = clamp(1.0 - (v - 0.5) * 0.22, 0.46, 1.0);
      // изгиб: максимальное отклонение от хорды
      var dev = 0, nx = -dy / len, ny = dx / len;
      for (var i = 1; i < pts.length - 1; i++) { var d = (pts[i].x - a.x) * nx + (pts[i].y - a.y) * ny; if (Math.abs(d) > Math.abs(dev)) dev = d; }
      // nx>0: точка справа от хорды (для свайпа вверх)
      var bend = clamp(-dev * 0.035, -2.4, 2.4);
      if (Math.abs(dev) < 8) bend = 0;
      var pth = { tx: tx, ty: ty, b: bend, loft: 0.15 + (T - 0.46) * 0.6, T: T, wind: wind * 0.55 };
      kickInfo = { T: T, b: bend, tx: tx, ty: ty };
      launch(pth, true);
      // вратарь соперника читает удар
      var d = api.diff, fin = pathPos(pth, KZ / GZ);
      var fool = [0.55, 0.38, 0.2, 0.06][d], estX = fin.x + pth.b * fool * 3, estY = fin.y;
      var sig = [1.5, 0.92, 0.66, 0.42][d];
      estX += (rnd() + rnd() + rnd() - 1.5) * sig; estY += (rnd() - 0.5) * sig * 0.8;
      if (rnd() < [0.33, 0.24, 0.14, 0.07][d] && Math.abs(fin.x) > 0.7) estX = -estX * (0.6 + rnd() * 0.4);
      var react = [0.24, 0.17, 0.12, 0.08][d] * (0.8 + rnd() * 0.4);
      keeper.plan = { x: estX, y: estY, t: react, speed: [5.2, 6.8, 7.8, 8.6][d], reach: [2.1, 2.35, 2.55, 2.75][d] };
      phase = 'flight'; pT = 0; shotsTaken++;
      leg = { t: 0.02, kit: 'me' };
      // slow-mo если близко
      var k2 = predictKeeperDist(pth);
      var postNear = Math.min(Math.abs(Math.abs(fin.x) - PW), Math.abs(fin.y - PH) + (Math.abs(fin.x) > PW ? 1 : 0));
      if ((k2 > -0.15 && k2 < 0.35) || postNear < 0.3) slow = 1;
      return true;
    }
    function predictKeeperDist(pth) {
      // симулируем прыжок вратаря до момента пересечения
      var save = JSON.parse(JSON.stringify(keeper)), uK = KZ / GZ, tCross = pth.T * uK, t = 0, dt = 1 / 120;
      var pl = keeper.plan;
      while (t < tCross) { if (pl && !keeper.diving && t >= pl.t) startDive(pl.x, pl.y, pl.speed, pl.reach); keeperUpdate(dt); t += dt; }
      var f = pathPos(pth, uK), d = keeperHits(f.x, f.y);
      var plan = keeper.plan; keeper = save; keeper.plan = plan; keeper.kit = save.kit;
      return d;
    }

    function cpuKick() {
      var d = api.diff, side = rnd() < 0.5 ? -1 : 1, tx, ty;
      if (earlyDive && rnd() < [0.35, 0.6, 0.85, 1][d]) side = keeper.tx > keeper.sx ? -1 : 1;
      var r = rnd();
      if (r < [0.22, 0.16, 0.1, 0.06][d]) { tx = side * (PW + 0.1 + rnd() * 0.8); ty = 0.3 + rnd() * 2.6; } // мимо/штанга
      else if (r < 0.32) { tx = (rnd() - 0.5) * 1.2; ty = rnd() < 0.5 ? 0.3 + rnd() * 0.6 : 1.6 + rnd() * 0.6; } // по центру
      else { tx = side * (1.4 + rnd() * [1.6, 1.9, 2.1, 2.2][d]); ty = BR + rnd() * [1.4, 1.8, 2.1, 2.2][d]; }
      var T = [0.98, 0.82, 0.7, 0.6][d] * (0.92 + rnd() * 0.16);
      var pth = { tx: tx, ty: ty, b: (rnd() - 0.5) * [0.6, 1.2, 1.8, 2.2][d], loft: 0.15 + rnd() * 0.25, T: T, wind: wind * 0.55 };
      pth.tx -= pth.wind; // бьющий учитывает ветер
      cpuShot = pth;
      launch(pth, false);
      phase = 'cflight'; pT = 0;
      var fin = pathPos(pth, KZ / GZ);
      var k2 = keeper.diving ? predictKeeperDist(pth) : 9;
      if (Math.abs(k2) < 0.3) slow = 1;
      cpuShot.fin = fin;
    }

    function outcome(kind) {
      var mine = ball.mine, goal = kind === 'goal';
      ball.done = kind;
      var side = mine ? 0 : 1;
      res[side].push(goal ? 1 : 0);
      var txt, col;
      if (goal) {
        if (mine) {
          var bonus = 0, labels = [];
          var fx = ball.x, fy = ball.y;
          if (Math.abs(fx) > PW - 0.9) { bonus += 50; labels.push(api.t('penalty.corner')); }
          if (fy > PH - 0.7) { bonus += 50; labels.push(api.t('penalty.top')); }
          if (Math.abs(kickInfo.b) > 0.8) { bonus += 30; labels.push(api.t('penalty.curve')); }
          if (kickInfo.T < 0.6) { bonus += 20; labels.push(api.t('penalty.power')); }
          if (wall) { bonus += 40; }
          api.addScore(100 + bonus);
          txt = api.t('penalty.goal'); col = '#4ade80';
          banner = { t: 0, txt: txt, col: col, sub: labels.join(' · '), pts: '+' + (100 + bonus) };
          cheer = 2.5; api.sound('win'); api.fx.flash('#bbf7d0', 0.2);
          if (api.quality) api.fx.confetti(60);
        } else {
          txt = api.t('penalty.conceded'); col = '#f87171';
          banner = { t: 0, txt: txt, col: col, sub: '', pts: '' };
          cheer = 1.6; api.tone(300, 0.3, 'sawtooth', 0.05, -150);
        }
      } else {
        if (mine) {
          txt = kind === 'save' ? api.t('penalty.saved') : kind === 'post' ? api.t('penalty.post') : kind === 'wall' ? api.t('penalty.blocked') : api.t('penalty.miss');
          col = '#fca5a5'; banner = { t: 0, txt: txt, col: col, sub: '', pts: '' };
          api.tone(220, 0.25, 'triangle', 0.08, -100);
        } else {
          if (kind === 'save') { api.addScore(150); txt = api.t('penalty.mySave'); col = '#4ade80'; banner = { t: 0, txt: txt, col: col, sub: '', pts: '+150' }; cheer = 2.2; api.sound('bonus'); api.fx.confetti(api.quality ? 40 : 15); }
          else { api.addScore(30); txt = kind === 'post' ? api.t('penalty.post') : api.t('penalty.miss'); col = '#fde047'; banner = { t: 0, txt: txt, col: col, sub: '', pts: '+30' }; cheer = 1.2; api.sound('coin'); }
        }
      }
      if (kind === 'post') { api.tone(1500, 0.25, 'sine', 0.08, -200); api.tone(2200, 0.18, 'sine', 0.04); api.fx.shake(4); }
      if (kind === 'save') { api.tone(180, 0.12, 'square', 0.1); api.vibrate(30); api.fx.shake(5); }
      pT = 0; phase = mine ? 'result' : 'cresult';
    }

    function goFree(vx, vy, vz) { ball.mode = 'free'; ball.vx = vx; ball.vy = vy; ball.vz = vz; }

    function ballUpdate(dt) {
      if (ball.mode === 'rest') return;
      var w = ball.spinW || 0;
      if (ball.mode === 'path') {
        var pth = ball.p, u0 = ball.u;
        ball.u += dt / pth.T;
        var u = ball.u, q = pathPos(pth, Math.min(u, 1));
        ball.x = q.x; ball.y = q.y; ball.z = q.z;
        // стенка
        if (wall && !ball.checked.w && u >= wall.z / GZ) {
          ball.checked.w = true;
          var jh = wallJump();
          if (Math.abs(ball.x - wall.x) < 0.85 + BR && ball.y < 1.9 + jh + BR) {
            goFree((ball.x - wall.x) * 3 + (rnd() - 0.5) * 3, 3 + rnd() * 2, -5);
            outcome('wall'); return;
          }
        }
        // вратарь
        if (!ball.checked.k && u >= KZ / GZ) {
          ball.checked.k = true;
          var d = keeperHits(ball.x, ball.y);
          if (d < 0) {
            var v = pathVel(pth, u), sgn = ball.x - keeper.cx >= 0 ? 1 : -1;
            var catchIt = Math.abs(ball.x - keeper.cx) < 0.5 && Math.abs(ball.y - keeper.cy) < 0.8 && pth.T > 0.62;
            if (catchIt) { ball.mode = 'held'; }
            else goFree(sgn * (3 + rnd() * 4), 2.5 + rnd() * 3, -v.z * 0.25);
            outcome('save'); return;
          }
        }
        if (u >= 1) {
          var ax = Math.abs(ball.x), v2 = pathVel(pth, 1);
          var nearPost = Math.abs(ax - PW) < 0.06 + BR && ball.y < PH + BR, nearBar = Math.abs(ball.y - PH) < 0.06 + BR && ax < PW + BR;
          if (nearPost || nearBar) {
            if (rnd() < 0.35 && ax < PW && ball.y < PH) { goFree(-Math.sign(ball.x) * 2, v2.y * 0.3, v2.z * 0.7); outcome('goal'); }
            else { goFree(Math.sign(ball.x) * (2 + rnd() * 2), nearBar ? 3 : 1.5, -v2.z * 0.35); outcome('post'); }
            return;
          }
          if (ax < PW && ball.y < PH) { goFree(v2.x * 0.6, v2.y * 0.6, v2.z * 0.8); outcome('goal'); return; }
          goFree(v2.x, v2.y, v2.z); outcome('miss'); return;
        }
        if (api.quality > 0) { var pp = P(ball.x, ball.y, ball.z); trail.push({ x: pp.x, y: pp.y, r: BR * pp.s }); if (trail.length > 14) trail.shift(); }
      } else if (ball.mode === 'free') {
        ball.vy -= 9.8 * dt;
        ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.z += ball.vz * dt;
        if (ball.y < BR) { ball.y = BR; if (ball.vy < 0) ball.vy = -ball.vy * 0.45; ball.vx *= 0.85; ball.vz *= 0.85; if (Math.abs(ball.vy) < 0.6) ball.vy = 0; }
        // сетка
        var inGoal = ball.done === 'goal' && Math.abs(ball.x) < PW && ball.y < PH + 0.2;
        if (inGoal && ball.z > NZ - BR - 0.1 && ball.vz > 0) {
          net.x = ball.x; net.y = Math.min(ball.y, 2.0); net.a = Math.min(0.9, ball.vz * 0.06); net.t = 0;
          ball.z = NZ - BR - 0.1; ball.vz = -ball.vz * 0.12; ball.vx *= 0.3; ball.vy *= 0.2;
          api.tone(90, 0.15, 'sine', 0.12);
        }
        if (inGoal && ball.y > PH - 0.25 && ball.z > GZ + 0.2 && ball.vy > 0) { ball.vy = -ball.vy * 0.3; }
        if (ball.done !== 'goal' && ball.z > 15.3) { ball.z = 15.3; ball.vz = -ball.vz * 0.3; }
        w *= 0.98; ball.spinW = w;
      } else if (ball.mode === 'held') {
        var s = keeperSeg(); ball.x = s.x2; ball.y = Math.max(BR, s.y2 - 0.15); ball.z = KZ - 0.2; w = 0;
      }
      if (w) ball.M = rotM(ball.M, ball.spinAx, w * dt);
    }
    function wallJump() { if (!wall || wall.jumpT == null) return 0; var t = wall.jumpT; return t < 0.55 ? Math.sin(t / 0.55 * Math.PI) * 0.45 : 0; }

    /* ---------- ход матча ---------- */
    function decided() {
      var a = 0, b = 0, i, na = res[0].length, nb = res[1].length;
      for (i = 0; i < na; i++) a += res[0][i]; for (i = 0; i < nb; i++) b += res[1][i];
      if (na <= 5 && nb <= 5 && !sudden) {
        var remA = 5 - na, remB = 5 - nb;
        if (a > b + remB) return 1; if (b > a + remA) return -1;
        if (na === 5 && nb === 5) { if (a !== b) return a > b ? 1 : -1; sudden = true; }
        return 0;
      }
      if (na === nb && a !== b) return a > b ? 1 : -1;
      return 0;
    }
    function nextKick() {
      var dcs = decided();
      if (dcs) { endMatch(dcs > 0); return; }
      if (res[0].length === res[1].length) startShoot(); else startSave();
    }
    function startShoot() {
      round = res[0].length + 1;
      phase = 'aim'; pT = 0; swipe = null; trail = []; slow = 0; slowK = 1;
      ball = { x: 0, y: BR, z: 0, mode: 'rest', M: ball ? ball.M : [1, 0, 0, 0, 1, 0, 0, 0, 1], spinW: 0 };
      keeperReset('cpu'); net.a = 0; leg = null;
      var d = api.diff;
      wind = d === 0 ? 0 : (rnd() - 0.5) * 2 * [0, 1.2, 2.2, 3.4][d];
      wall = null;
      if (d >= 2 && (round % 2 === 0 || (d === 3 && round > 5))) {
        wall = { x: (rnd() - 0.5) * 2.4, z: 6.4, jumpT: null };
        keeper.shift = -wall.x * 0.4;
      }
      banner = { t: 0, txt: api.t('penalty.yourKick'), col: '#fff', sub: wall ? api.t('penalty.wall') : sudden ? api.t('penalty.sudden') : api.t('penalty.round', round), pts: '', small: true };
      api.tone(2600, 0.12, 'sine', 0.04); setTimeout(function () { api.tone(2600, 0.3, 'sine', 0.04); }, 150);
    }
    function startSave() {
      phase = 'crun'; pT = 0; slow = 0; slowK = 1; earlyDive = false; wall = null;
      ball = { x: 0, y: BR, z: 0, mode: 'rest', M: ball ? ball.M : [1, 0, 0, 0, 1, 0, 0, 0, 1], spinW: 0 };
      keeperReset('me'); net.a = 0; trail = [];
      var d = api.diff;
      wind = d === 0 ? 0 : (rnd() - 0.5) * 2 * [0, 0.8, 1.6, 2.4][d];
      leg = { t: -1.4, kit: 'cpu' };
      cpuShot = null;
      banner = { t: 0, txt: api.t('penalty.yourSave'), col: '#86efac', sub: '', pts: '', small: true };
    }
    function endMatch(win) {
      phase = 'end'; pT = 0;
      if (win) {
        var bonus = 400 + 100 * api.diff;
        api.addScore(bonus);
        banner = { t: 0, txt: api.t('penalty.win'), col: '#fde047', sub: '', pts: '+' + bonus, big: true };
        api.sound('win'); api.fx.confetti(api.quality ? 140 : 60); cheer = 4;
      } else {
        banner = { t: 0, txt: api.t('penalty.lose'), col: '#f87171', sub: '', pts: '', big: true };
        api.sound('over');
      }
    }

    /* ---------- отрисовка ---------- */
    function drawNet(c) {
      var cols = 18, rows = 8, NR = 2.2, i, j, pts = [];
      for (j = 0; j <= rows; j++) {
        var row = [];
        for (i = 0; i <= cols; i++) {
          var x = -PW + 2 * PW * i / cols, y = NR * j / rows, dz = 0;
          if (net.a > 0.001) { var dd = (x - net.x) * (x - net.x) + (y - net.y) * (y - net.y) * 1.4; dz = net.a * Math.exp(-dd / 0.9) * Math.cos(net.t * 9) * Math.exp(-net.t * 2.5); }
          row.push(P(x, y, NZ + dz));
        }
        pts.push(row);
      }
      c.strokeStyle = 'rgba(255,255,255,.42)'; c.lineWidth = 0.9;
      c.beginPath();
      for (j = 0; j <= rows; j++) { c.moveTo(pts[j][0].x, pts[j][0].y); for (i = 1; i <= cols; i++) c.lineTo(pts[j][i].x, pts[j][i].y); }
      for (i = 0; i <= cols; i++) { c.moveTo(pts[0][i].x, pts[0][i].y); for (j = 1; j <= rows; j++) c.lineTo(pts[j][i].x, pts[j][i].y); }
      c.stroke();
    }
    function drawKeeper(c) {
      var k = keeper, p = P(k.cx, k.cy, KZ), g = P(k.cx, 0, KZ);
      // тень
      c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(g.x, g.y, 0.55 * p.s * (1 + Math.abs(Math.sin(k.ang)) * 0.8), 0.12 * p.s, 0, 0, 6.283); c.fill();
      drawPerson(c, p.x, p.y, p.s, k.ang, k.pose, k.kit, false, clock + k.sway);
    }
    function drawWall(c) {
      if (!wall) return;
      var jh = wallJump();
      for (var i = -1; i <= 1; i++) {
        var x = wall.x + i * 0.55, g = P(x, 0, wall.z), p = P(x, 0.98 + jh, wall.z);
        c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(g.x, g.y, 0.3 * g.s, 0.07 * g.s, 0, 0, 6.283); c.fill();
        var kit = KITS.wallK; kit.num = String([4, 6, 8][i + 1]);
        drawPerson(c, p.x, p.y, p.s, 0, 'wall', kit, true, clock);
      }
    }
    function drawBallAll(c) {
      if (ball.mode === 'gone') return;
      var p = P(ball.x, ball.y, ball.z), g = P(ball.x, 0, ball.z), r = BR * p.s;
      var sh = clamp(1 - ball.y / 4, 0.2, 1);
      c.fillStyle = 'rgba(0,0,0,' + (0.35 * sh) + ')'; c.beginPath(); c.ellipse(g.x + r * 0.2, g.y, r * 1.1 * sh + 1, r * 0.35 * sh + 0.5, 0, 0, 6.283); c.fill();
      drawBall(c, p.x, p.y, r);
    }
    function drawTrail(c) {
      if (!trail || trail.length < 2 || api.quality === 0) return;
      for (var i = 1; i < trail.length; i++) {
        var a = trail[i - 1], b = trail[i], k = i / trail.length;
        c.strokeStyle = 'rgba(255,255,255,' + (k * 0.35) + ')'; c.lineWidth = Math.max(1, b.r * 1.3 * k);
        c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
      }
    }
    function taper(c, x1, y1, w1, x2, y2, w2, col) {
      var dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      c.fillStyle = col; c.beginPath();
      c.moveTo(x1 + nx * w1, y1 + ny * w1); c.lineTo(x2 + nx * w2, y2 + ny * w2);
      c.arc(x2, y2, w2, Math.atan2(ny, nx), Math.atan2(-ny, -nx), dx * ny - dy * nx > 0);
      c.lineTo(x1 - nx * w1, y1 - ny * w1); c.closePath(); c.fill();
    }
    function drawLeg(c) {
      if (!leg) return;
      var t = leg.t, bp = P(0, BR, 0), r = BR * bp.s;
      var mineK = leg.kit === 'me', side = mineK ? -1 : 1;
      var sock = mineK ? '#1d4ed8' : '#dc2626', sockD = mineK ? '#1e3a8a' : '#991b1b', band = '#f8fafc', boot = mineK ? '#0f172a' : '#111827', acc = mineK ? '#22d3ee' : '#facc15';
      var shorts = mineK ? '#f8fafc' : '#111827';
      // k: 0 — нога отведена, 1 — удар; затем проводка
      var k, out = 0;
      if (t < 0) k = clamp(1 + t / 0.5, 0, 1) * 0.6; else k = Math.min(1, 0.6 + t / 0.06 * 0.4);
      if (t > 0.08) out = Math.min(1, (t - 0.08) / 0.4);
      if (out >= 1 || (t < -0.5 && t < -1.1)) return;
      var e = k * k;
      var fx = bp.x + side * r * lerp(3.2, 1.25, e) + side * out * -r * 0.5, fy = bp.y + r * lerp(5.5, 0.35, e) - out * r * 4;
      var kx = bp.x + side * r * lerp(5.2, 3.6, e), ky = bp.y + r * lerp(6.5, 4.2, e) - out * r * 2.5;
      var hx = bp.x + side * r * 7.5, hy = H + r * 3;
      c.save(); c.globalAlpha = 1 - out; c.lineCap = 'round';
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(fx, bp.y + r * 1.0, r * 1.6, r * 0.4, 0, 0, 6.283); c.fill();
      taper(c, hx, hy, r * 1.9, kx, ky, r * 1.2, '#d6a77a');
      taper(c, hx, hy, r * 2.1, lerp(hx, kx, 0.35), lerp(hy, ky, 0.35), r * 1.8, shorts);
      taper(c, kx, ky, r * 1.15, fx, fy, r * 0.75, sock);
      taper(c, lerp(kx, fx, 0.55), lerp(ky, fy, 0.55), r * 1.06, fx, fy, r * 0.82, sockD);
      taper(c, lerp(kx, fx, 0.12), lerp(ky, fy, 0.12), r * 1.25, lerp(kx, fx, 0.22), lerp(ky, fy, 0.22), r * 1.2, band);
      c.save(); c.translate(fx, fy); c.rotate(Math.atan2(fy - ky, fx - kx) - Math.PI / 2);
      c.fillStyle = boot; rr(c, -r * 0.95, -r * 0.4, r * 1.9, r * 2.0, r * 0.9); c.fill();
      c.fillStyle = acc; c.fillRect(-r * 0.75, r * 0.3, r * 1.5, r * 0.22);
      c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(-r * 0.3, r * 0.8, r * 0.25, r * 0.6, 0, 0, 6.283); c.fill();
      c.restore(); c.restore();
    }
    function drawHud(c) {
      var y = 8, h = 60, x = 10, w = W - 20, g;
      g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(15,23,42,.88)'); g.addColorStop(1, 'rgba(2,6,23,.88)');
      c.fillStyle = g; rr(c, x, y, w, h, 14); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; rr(c, x + 0.5, y + 0.5, w - 1, h - 1, 14); c.stroke();
      var names = [api.t('g.you'), api.t('g.cpu')], cols = ['#3b82f6', '#ef4444'], i, j;
      c.textBaseline = 'middle'; c.font = '800 13px system-ui, sans-serif';
      var start = Math.max(0, Math.max(res[0].length, res[1].length) - 5), n = Math.max(5, Math.min(5, Math.max(res[0].length, res[1].length)));
      for (i = 0; i < 2; i++) {
        var ry = y + 18 + i * 24;
        c.fillStyle = cols[i]; rr(c, x + 10, ry - 7, 5, 14, 2); c.fill();
        c.fillStyle = '#fff'; c.textAlign = 'left'; c.fillText(names[i], x + 21, ry);
        var tot = 0; for (j = 0; j < res[i].length; j++) tot += res[i][j];
        for (j = 0; j < n; j++) {
          var idx = start + j, cx = x + 92 + j * 24, v = res[i][idx];
          c.fillStyle = 'rgba(255,255,255,.1)'; c.beginPath(); c.arc(cx, ry, 8.5, 0, 6.283); c.fill();
          if (v === 1) { c.fillStyle = '#22c55e'; c.beginPath(); c.arc(cx, ry, 8.5, 0, 6.283); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - 4, ry); c.lineTo(cx - 1, ry + 3.5); c.lineTo(cx + 4.5, ry - 3.5); c.stroke(); }
          else if (v === 0) { c.fillStyle = '#ef4444'; c.beginPath(); c.arc(cx, ry, 8.5, 0, 6.283); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - 3.5, ry - 3.5); c.lineTo(cx + 3.5, ry + 3.5); c.moveTo(cx + 3.5, ry - 3.5); c.lineTo(cx - 3.5, ry + 3.5); c.stroke(); }
          else if ((phase === 'aim' && i === 0 || phase === 'crun' && i === 1) && idx === res[i].length) { c.strokeStyle = 'rgba(253,224,71,' + (0.5 + 0.5 * Math.sin(clock * 6)) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(cx, ry, 8.5, 0, 6.283); c.stroke(); }
        }
        c.fillStyle = '#fff'; c.font = '900 20px system-ui, sans-serif'; c.textAlign = 'right'; c.fillText(String(tot), x + w - 14, ry + 1); c.font = '800 13px system-ui, sans-serif';
      }
      if (sudden) { c.fillStyle = '#fde047'; c.font = '800 10px system-ui, sans-serif'; c.textAlign = 'right'; c.fillText(api.t('penalty.sd'), x + w - 40, y + 30); }
      // ветер
      if (wind && (phase === 'aim' || phase === 'flight' || phase === 'crun' || phase === 'cflight')) {
        var wx = W / 2, wy = y + h + 18, len = Math.min(60, Math.abs(wind) * 18 + 12), sg = wind > 0 ? 1 : -1;
        c.fillStyle = 'rgba(15,23,42,.7)'; rr(c, wx - 62, wy - 12, 124, 24, 12); c.fill();
        c.strokeStyle = '#7dd3fc'; c.lineWidth = 3; c.lineCap = 'round';
        var off = ((clock * 40) % 12) * sg;
        c.beginPath(); c.moveTo(wx - sg * len / 2 + 20, wy); c.lineTo(wx + sg * len / 2 + 20, wy); c.stroke();
        c.beginPath(); c.moveTo(wx + sg * len / 2 + 20, wy); c.lineTo(wx + sg * (len / 2 - 6) + 20, wy - 5); c.moveTo(wx + sg * len / 2 + 20, wy); c.lineTo(wx + sg * (len / 2 - 6) + 20, wy + 5); c.stroke();
        c.globalAlpha = 0.5; c.beginPath(); c.moveTo(wx - sg * len / 2 + 20 + off, wy - 7); c.lineTo(wx - sg * len / 2 + 30 + off, wy - 7); c.stroke(); c.globalAlpha = 1;
        c.fillStyle = '#e0f2fe'; c.font = '800 11px system-ui, sans-serif'; c.textAlign = 'left';
        c.fillText(api.t('penalty.wind') + ' ' + Math.max(1, Math.round(Math.abs(wind) * 3)), wx - 54, wy + 1);
      }
      c.lineCap = 'butt';
    }
    function drawBanner(c) {
      if (!banner) return;
      var t = banner.t, a0 = t < 0.15 ? t / 0.15 : t > (banner.big ? 3.5 : banner.small ? 1.5 : 1.6) ? Math.max(0, 1 - (t - (banner.big ? 3.5 : banner.small ? 1.5 : 1.6)) / 0.3) : 1;
      var a = a0; if (a <= 0) return;
      var sc = t < 0.25 ? 0.6 + 0.4 * (1 - Math.pow(1 - t / 0.25, 3)) * 1.08 : 1, cy = banner.small ? HY + 120 : H * 0.47;
      c.save(); c.globalAlpha = a; c.translate(W / 2, cy); c.scale(sc, sc);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      var fs = banner.small ? 26 : banner.big ? 50 : 54;
      c.font = '900 ' + fs + 'px system-ui, sans-serif';
      var tw = c.measureText(banner.txt).width; if (tw > W - 40) { c.scale((W - 40) / tw, (W - 40) / tw); }
      c.lineJoin = 'round'; c.lineWidth = 8; c.strokeStyle = 'rgba(2,6,23,.85)'; c.strokeText(banner.txt, 0, 0);
      c.fillStyle = banner.col; c.fillText(banner.txt, 0, 0);
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillText(banner.txt, 0, -2);
      c.fillStyle = banner.col; c.fillText(banner.txt, 0, -1);
      if (banner.sub) { c.font = '800 15px system-ui, sans-serif'; c.lineWidth = 5; c.strokeText(banner.sub, 0, fs * 0.72); c.fillStyle = '#fff'; c.fillText(banner.sub, 0, fs * 0.72); }
      if (banner.pts) { c.font = '900 22px system-ui, sans-serif'; c.lineWidth = 5; c.strokeText(banner.pts, 0, -fs * 0.8); c.fillStyle = '#fde047'; c.fillText(banner.pts, 0, -fs * 0.8); }
      c.restore();
    }
    function drawSwipeHint(c) {
      var bp = P(0, BR, 0), t = (clock % 1.8) / 1.4;
      if (t > 1) return;
      var e = 1 - Math.pow(1 - t, 2), x0 = bp.x + 10, y0 = bp.y + 40, x1 = W / 2 + 70, y1 = bp.y - 150;
      var x = lerp(x0, x1, e) - Math.sin(e * Math.PI) * 50, y = lerp(y0, y1, e);
      c.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - t)) + ')'; c.beginPath(); c.arc(x, y, 14, 0, 6.283); c.fill();
      c.strokeStyle = 'rgba(255,255,255,' + (0.5 * (1 - t)) + ')'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath();
      for (var k = 0; k <= 10; k++) { var ee = e * k / 10, xx = lerp(x0, x1, ee) - Math.sin(ee * Math.PI) * 50, yy = lerp(y0, y1, ee); if (k) c.lineTo(xx, yy); else c.moveTo(xx, yy); }
      c.stroke(); c.lineCap = 'butt';
    }

    return {
      reset: function () {
        layout();
        res = [[], []]; sudden = false; round = 1; clock = 0; cheer = 0; net = { x: 0, y: 1, a: 0, t: 0 }; ball = null; slowK = 1; slow = 0;
        firstKick = true; shotsTaken = 0; overT = 0; hintT = 0;
        startShoot();
      },
      resize: function () { layout(); },
      idle: function (dt) { clock += dt; if (keeper) keeperUpdate(dt); },
      key: function () { },
      input: function (type, d) {
        if (phase === 'aim') {
          var bp = P(0, BR, 0);
          if (type === 'down' && d.y > bp.y - 140) { swipe = { pts: [{ x: d.x, y: d.y }], t0: Date.now(), t1: Date.now() }; keeper.pose = 'ready'; }
          else if (type === 'move' && swipe) { swipe.pts.push({ x: d.x, y: d.y }); swipe.t1 = Date.now(); if (swipe.pts.length > 60) swipe.pts.splice(1, 1); }
          else if (type === 'up' && swipe) {
            swipe.pts.push({ x: d.x, y: d.y }); swipe.t1 = Date.now();
            var ok = shoot(swipe); if (ok) firstKick = false; else keeper.pose = 'idle';
            swipe = null;
          }
          return;
        }
        if ((phase === 'crun' || phase === 'cflight') && (type === 'down') && !keeper.diving) {
          var s = F / (KZ - CAMZ), hx = (d.x - W / 2) / s, hy = CAMH - (d.y - HY) / s;
          hx = clamp(hx, -4.2, 4.2); hy = clamp(hy, 0.15, 2.7);
          if (phase === 'crun') earlyDive = true;
          startDive(hx, hy, 12, 2.9);
          api.tone(330, 0.06, 'triangle', 0.06); api.vibrate(10);
        }
      },
      update: function (rdt) {
        clock += rdt;
        if (banner) banner.t += rdt;
        if (cheer > 0) cheer -= rdt;
        // slow-mo
        var target = (slow && ball && ball.mode === 'path' && ball.u > 0.7) ? 0.28 : 1;
        slowK = lerp(slowK, target, Math.min(1, rdt * (target < 1 ? 12 : 4)));
        var dt = rdt * slowK;
        if (net.a > 0) { net.t += dt; if (net.t > 2) net.a = 0; }
        if (leg) leg.t += dt;
        if (wall && wall.jumpT != null) wall.jumpT += dt;
        keeperUpdate(dt);
        if (ball) ballUpdate(dt);
        pT += dt;
        if (phase === 'aim') { hintT += rdt; return; }
        if (phase === 'flight') {
          var pl = keeper.plan;
          if (pl && !keeper.diving && pT >= pl.t) startDive(pl.x, pl.y, pl.speed, pl.reach);
          return;
        }
        if (phase === 'crun') {
          if (leg && leg.t >= 0 && !cpuShot) cpuKick();
          if (api.diff <= 1 && leg && leg.t > -0.25 && !keeper.diving && Math.floor(pT * 8) % 2 === 0) { /* мигающая подсказка рисуется в draw */ }
          return;
        }
        if (phase === 'cflight') return;
        if (phase === 'result' || phase === 'cresult') {
          if (pT > 1.9) nextKick();
          return;
        }
        if (phase === 'end') { if (pT > 2.6 && !overT) { overT = 1; api.gameOver(); } }
      },
      draw: function (c) {
        if (!bgL || lw !== api.W || lh !== api.H) layout();
        var zoom = 1 + (1 - slowK) * 0.14, fp = ball ? P(ball.x, ball.y, ball.z) : { x: W / 2, y: HY };
        c.save();
        if (zoom > 1.001) { c.translate(fp.x, fp.y); c.scale(zoom, zoom); c.translate(-fp.x, -fp.y); }
        c.drawImage(bgL, 0, 0, W, H);
        var ch = cheer > 0 && api.quality > 0;
        if (ch) c.drawImage(crowdB, 0, Math.sin(clock * 18) * 1.5 - 1, W, standBot);
        else c.drawImage(crowdA, 0, 0, W, standBot);
        // вспышки фотокамер при голе
        if (ch) for (var i = 0; i < 6; i++) { var fx = (Math.sin(clock * 50 + i * 7.1) * 0.5 + 0.5) * W, fy = standTop + (Math.cos(clock * 37 + i * 3.3) * 0.5 + 0.5) * (standBot - standTop); c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(fx, fy, 2, 2); }
        drawNet(c);
        var inNet = ball && ball.z > GZ;
        if (inNet) drawBallAll(c);
        c.drawImage(postsL, 0, 0, W, H);
        var ballBehindKeeper = ball && ball.z > KZ && !inNet;
        if (ballBehindKeeper) drawBallAll(c);
        drawKeeper(c);
        // подсказка на лёгком: куда будет удар
        if (phase === 'cflight' && cpuShot && api.diff <= 1 && api.quality >= 0) {
          var fpp = P(cpuShot.fin.x, cpuShot.fin.y, KZ), al = api.diff === 0 ? 0.7 : 0.35;
          c.strokeStyle = 'rgba(253,224,71,' + al + ')'; c.lineWidth = 2.5; c.beginPath(); c.arc(fpp.x, fpp.y, 12 + Math.sin(clock * 20) * 2, 0, 6.283); c.stroke();
        }
        var ballBeforeWall = ball && wall && ball.z < wall.z;
        if (wall && !ballBeforeWall && !inNet && !ballBehindKeeper) drawBallAll(c);
        if (wall) drawWall(c);
        drawTrail(c);
        if (ball && !inNet && !ballBehindKeeper && (!wall || ballBeforeWall)) drawBallAll(c);
        drawLeg(c);
        // свайп
        if (swipe && swipe.pts.length > 1) {
          c.lineCap = 'round'; c.lineJoin = 'round';
          c.strokeStyle = 'rgba(253,224,71,.3)'; c.lineWidth = 14; c.beginPath();
          swipe.pts.forEach(function (p, k) { if (k) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y); }); c.stroke();
          c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 4; c.stroke();
          c.lineCap = 'butt';
        }
        c.restore();
        // slow-mo виньетка
        if (slowK < 0.95) {
          var k = (1 - slowK) / 0.72;
          c.fillStyle = 'rgba(0,0,0,' + (0.55 * k) + ')'; c.fillRect(0, 0, W, 34 * k); c.fillRect(0, H - 34 * k, W, 34 * k);
        }
        drawHud(c);
        if (phase === 'aim' && (firstKick || hintT > 4) && !swipe) {
          drawSwipeHint(c);
          c.font = '800 15px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.lineWidth = 4; c.strokeStyle = 'rgba(2,6,23,.8)'; c.strokeText(api.t('penalty.swipe'), W / 2, H - 26);
          c.fillStyle = '#fff'; c.fillText(api.t('penalty.swipe'), W / 2, H - 26);
        }
        if (phase === 'crun' && !keeper.diving) {
          c.font = '800 15px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          var txt = api.t('penalty.dive');
          c.lineWidth = 4; c.strokeStyle = 'rgba(2,6,23,.8)'; c.strokeText(txt, W / 2, H - 26);
          c.fillStyle = '#86efac'; c.fillText(txt, W / 2, H - 26);
        }
        if (earlyDive && (phase === 'cflight' || phase === 'cresult') && pT < 1.2) {
          c.font = '800 15px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 5; c.strokeStyle = 'rgba(2,6,23,.9)'; c.strokeText(api.t('penalty.early'), W / 2, HY + 85); c.fillStyle = '#fca5a5'; c.fillText(api.t('penalty.early'), W / 2, HY + 85);
        }
        drawBanner(c);
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      }
    };
  }
};
