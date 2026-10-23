/* Бильярд — восьмёрка */
window.GAMES = window.GAMES || {};
window.GAMES.billiards = {
  title: 'Бильярд',
  colors: ['#15803d', '#0f766e'],
  controls: 'none',
  modes: true,
  lan: true,
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="bdW" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5b2a10"/><stop offset=".5" stop-color="#9a5524"/><stop offset="1" stop-color="#5b2a10"/></linearGradient><radialGradient id="bdF" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#2fc46a"/><stop offset="1" stop-color="#0f6332"/></radialGradient><radialGradient id="bdS" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient></defs><rect x="14" y="6" width="72" height="88" rx="10" fill="url(#bdW)"/><rect x="20" y="12" width="60" height="76" rx="3" fill="url(#bdF)"/><g fill="#b8862b"><circle cx="21" cy="13" r="6.5"/><circle cx="79" cy="13" r="6.5"/><circle cx="21" cy="87" r="6.5"/><circle cx="79" cy="87" r="6.5"/></g><g fill="#050505"><circle cx="21" cy="13" r="4.6"/><circle cx="79" cy="13" r="4.6"/><circle cx="21" cy="87" r="4.6"/><circle cx="79" cy="87" r="4.6"/></g><g fill="#000" opacity=".3"><circle cx="52" cy="36" r="6"/><circle cx="46" cy="28" r="6"/><circle cx="58" cy="28" r="6"/><circle cx="52" cy="72" r="6"/></g><circle cx="50" cy="34" r="6" fill="#facc15"/><circle cx="44" cy="26" r="6" fill="#dc2626"/><circle cx="56" cy="26" r="6" fill="#111"/><circle cx="50" cy="70" r="6" fill="#f5f3ee"/><g fill="url(#bdS)"><circle cx="50" cy="34" r="6"/><circle cx="44" cy="26" r="6"/><circle cx="56" cy="26" r="6"/><circle cx="50" cy="70" r="6"/></g><circle cx="56" cy="26" r="2.6" fill="#fff"/><text x="56" y="27.8" font-family="system-ui,sans-serif" font-size="4.5" font-weight="900" text-anchor="middle" fill="#111">8</text><path d="M55 77 L82 98" stroke="#e7c58e" stroke-width="4.5" stroke-linecap="round"/><path d="M55 77 L58 79.3" stroke="#3b82f6" stroke-width="4.5" stroke-linecap="round"/><path d="M72 90 L82 98" stroke="#1c1917" stroke-width="4.8" stroke-linecap="round"/></svg>',

  create: function (api) {
    var COLORS = { 1: '#facc15', 2: '#2563eb', 3: '#dc2626', 4: '#7c3aed', 5: '#f97316', 6: '#16a34a', 7: '#7f1d1d', 8: '#111111' };
    var DIFF = [{ guide: 3, err: 0.07 }, { guide: 2, err: 0.035 }, { guide: 1, err: 0.016 }, { guide: 0, err: 0.006 }];
    var T, R, balls, pockets, pr, turn, groups, phase, aim, drag, potted, firstHit, cueScratched, msg, msgT, endT, winner, t, aiT, aiShot, pottedList, shotsN;
    // v2.0: вращение битка — накат (вверх) и оттяжка (вниз); срабатывает при первом касании
    var spin = 0, spinShot = null, spinW = null;
    // v2.5: игра по сети. Авторитет — бьющий: он решает фолы/смену хода/группы/победу и рассылает итоговую расстановку.
    var netN = 0, shooter = 0, inHand = false, acc = 0, snapT = 0, aimSendT = 0, aimTo = null, lastAimKey = '';
    var NET_H = 1 / 360;

    function colorOf(n) { return COLORS[n > 8 ? n - 8 : n]; }
    function layout() {
      var W = api.W, H = api.H, mh = H - 110, mw = W - 36;
      var tw = Math.min(mw, mh / 1.9), th = tw * 1.9;
      T = { x: (W - tw) / 2, y: 60 + (mh - th) / 2, w: tw, h: th, rail: Math.max(14, tw * 0.07) };
      R = tw / 26;
      pr = R * 1.75;
      pockets = [[T.x, T.y], [T.x + T.w, T.y], [T.x, T.y + T.h / 2], [T.x + T.w, T.y + T.h / 2], [T.x, T.y + T.h], [T.x + T.w, T.y + T.h]]
        .map(function (p) { return { x: p[0], y: p[1] }; });
      tableCv = null;
    }
    // v3: процедурная текстура дерева (волокна, сучки)
    function woodFill(o, x, y, w, h, c1, c2, seed, vert, amt, kn) {
      var sd = seed || 1; function rn() { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }
      amt = amt || 1;
      o.save(); o.beginPath(); o.rect(x, y, w, h); o.clip();
      var g = vert ? o.createLinearGradient(x, y, x + w, y) : o.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, c1); g.addColorStop(0.5, c2); g.addColorStop(1, c1);
      o.fillStyle = g; o.fillRect(x, y, w, h);
      var L = vert ? w : h, S = vert ? h : w, n = Math.max(8, Math.floor(L / 3)), i, k;
      o.lineWidth = 1;
      for (i = 0; i < n; i++) {
        var p = rn() * L, a = (0.05 + rn() * 0.12) * amt, ph = rn() * 6, fr = 0.01 + rn() * 0.03, am = 1 + rn() * 3;
        o.strokeStyle = rn() < 0.5 ? 'rgba(60,30,10,' + a + ')' : 'rgba(255,235,200,' + a * 0.6 + ')';
        o.lineWidth = 0.6 + rn() * 1.4;
        o.beginPath();
        for (k = 0; k <= S; k += 6) {
          var off = p + Math.sin(k * fr + ph) * am;
          if (vert) { if (k) o.lineTo(x + off, y + k); else o.moveTo(x + off, y + k); }
          else { if (k) o.lineTo(x + k, y + off); else o.moveTo(x + k, y + off); }
        }
        o.stroke();
      }
      var knots = kn != null ? kn : Math.floor(rn() * 2 + (w * h > 40000 ? 2 : 0));
      for (i = 0; i < knots; i++) {
        var kx = x + rn() * w, ky = y + rn() * h, kr = 3 + rn() * 6;
        for (k = 3; k > 0; k--) {
          o.strokeStyle = 'rgba(60,30,10,' + 0.12 * amt + ')'; o.lineWidth = 1;
          o.beginPath(); o.ellipse ? o.ellipse(kx, ky, kr * k * (vert ? 0.6 : 1.6), kr * k * (vert ? 1.6 : 0.6), 0, 0, 6.283) : o.arc(kx, ky, kr * k, 0, 6.283); o.stroke();
        }
      }
      o.restore();
    }
    var tableCv = null, tableKey = '';
    function rrp(o, x, y, w, h, r) {
      o.beginPath(); o.moveTo(x + r, y); o.arcTo(x + w, y, x + w, y + h, r); o.arcTo(x + w, y + h, x, y + h, r);
      o.arcTo(x, y + h, x, y, r); o.arcTo(x, y, x + w, y, r); o.closePath();
    }
    function buildTable() {
      var W = api.W, H = api.H, dpr = Math.min(2, window.devicePixelRatio || 1), i;
      tableKey = W + 'x' + H + ':' + T.w;
      var cv = document.createElement('canvas'); cv.width = Math.ceil(W * dpr); cv.height = Math.ceil(H * dpr);
      var o = cv.getContext('2d'); o.scale(dpr, dpr);
      // комната: тёмный пол + световое пятно от лампы
      woodFill(o, 0, 0, W, H, '#1e140d', '#2a1b11', 7, true, 0.7);
      var lamp = o.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, H * 0.75);
      lamp.addColorStop(0, 'rgba(255,214,150,.12)'); lamp.addColorStop(0.6, 'rgba(0,0,0,.2)'); lamp.addColorStop(1, 'rgba(0,0,0,.7)');
      o.fillStyle = lamp; o.fillRect(0, 0, W, H);
      var rl = T.rail, ox = T.x - rl, oy = T.y - rl, ow = T.w + 2 * rl, oh = T.h + 2 * rl;
      // тень стола
      o.save(); o.shadowColor = 'rgba(0,0,0,.75)'; o.shadowBlur = 30; o.shadowOffsetY = 10;
      o.fillStyle = '#3b1a08'; rrp(o, ox, oy, ow, oh, rl * 0.8); o.fill(); o.restore();
      // деревянный борт
      o.save(); rrp(o, ox, oy, ow, oh, rl * 0.8); o.clip();
      woodFill(o, ox, oy, ow, oh, '#5b2a10', '#8a4a1f', 21, true, 1.3);
      var bev = o.createLinearGradient(ox, oy, ox + ow, oy + oh);
      bev.addColorStop(0, 'rgba(255,220,170,.28)'); bev.addColorStop(0.5, 'rgba(255,255,255,0)'); bev.addColorStop(1, 'rgba(0,0,0,.35)');
      o.fillStyle = bev; o.fillRect(ox, oy, ow, oh);
      o.restore();
      o.strokeStyle = 'rgba(255,230,190,.35)'; o.lineWidth = 1; rrp(o, ox + 1, oy + 1, ow - 2, oh - 2, rl * 0.75); o.stroke();
      o.strokeStyle = 'rgba(0,0,0,.5)'; o.lineWidth = 1.5; o.strokeRect(T.x - 1.5, T.y - 1.5, T.w + 3, T.h + 3);
      // сукно с текстурой
      var cl = o.createRadialGradient(T.x + T.w / 2, T.y + T.h * 0.45, 10, T.x + T.w / 2, T.y + T.h / 2, T.h * 0.7);
      cl.addColorStop(0, '#27b05c'); cl.addColorStop(0.6, '#1a8a45'); cl.addColorStop(1, '#0f6332');
      o.fillStyle = cl; o.fillRect(T.x, T.y, T.w, T.h);
      var nz = document.createElement('canvas'); nz.width = nz.height = 64;
      var nc = nz.getContext('2d'), sd = 77; function rn() { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }
      for (i = 0; i < 700; i++) { nc.fillStyle = rn() < 0.5 ? 'rgba(0,0,0,.10)' : 'rgba(255,255,255,.06)'; nc.fillRect(Math.floor(rn() * 64), Math.floor(rn() * 64), 1, 1); }
      var pat = o.createPattern(nz, 'repeat');
      if (pat) { o.save(); o.scale(1 / dpr, 1 / dpr); o.fillStyle = pat; o.fillRect(T.x * dpr, T.y * dpr, T.w * dpr, T.h * dpr); o.restore(); }
      // резиновые борта (cushions) с зазорами у луз
      var cw = Math.min(R * 0.9, T.rail * 0.55), gap = pr * 1.05;
      function cush(x1, y1, x2, y2, nx, ny) { // отрезок вдоль борта, внутрь на (nx,ny)
        var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, k = cw * 0.9;
        // борт выступает наружу от кромки поля (на дерево), скос к лузам
        o.beginPath(); o.moveTo(x1 + ux * k, y1 + uy * k); o.lineTo(x2 - ux * k, y2 - uy * k); o.lineTo(x2 - nx * cw, y2 - ny * cw); o.lineTo(x1 - nx * cw, y1 - ny * cw); o.closePath();
        var cg = o.createLinearGradient(x1, y1, x1 - nx * cw, y1 - ny * cw);
        cg.addColorStop(0, '#2fc46a'); cg.addColorStop(0.35, '#178a44'); cg.addColorStop(1, '#0a4a24');
        o.fillStyle = cg; o.fill();
        o.strokeStyle = 'rgba(190,255,210,.35)'; o.lineWidth = 1; o.beginPath(); o.moveTo(x1 + ux * k, y1 + uy * k); o.lineTo(x2 - ux * k, y2 - uy * k); o.stroke();
      }
      var X0 = T.x, X1 = T.x + T.w, Y0 = T.y, Ym = T.y + T.h / 2, Y1 = T.y + T.h;
      cush(X0 + gap, Y0, X1 - gap, Y0, 0, 1);
      cush(X1 - gap, Y1, X0 + gap, Y1, 0, -1);
      cush(X0, Ym - gap * 0.85, X0, Y0 + gap, 1, 0);
      cush(X0, Y1 - gap, X0, Ym + gap * 0.85, 1, 0);
      cush(X1, Y0 + gap, X1, Ym - gap * 0.85, -1, 0);
      cush(X1, Ym + gap * 0.85, X1, Y1 - gap, -1, 0);
      // мягкая тень от бортов на сукно
      [[X0, Y0, T.w, 10, 0, 1], [X0, Y1 - 10, T.w, 10, 0, -1]].forEach(function (q) {
        var sg = o.createLinearGradient(0, q[5] > 0 ? q[1] : q[1] + q[3], 0, q[5] > 0 ? q[1] + q[3] : q[1]);
        sg.addColorStop(0, 'rgba(0,0,0,.25)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); o.fillStyle = sg; o.fillRect(q[0], q[1], q[2], q[3]);
      });
      // разметка
      o.strokeStyle = 'rgba(255,255,255,.14)'; o.lineWidth = 1;
      o.beginPath(); o.moveTo(T.x + cw, T.y + T.h * 0.78); o.lineTo(T.x + T.w - cw, T.y + T.h * 0.78); o.stroke();
      o.fillStyle = 'rgba(255,255,255,.3)'; o.beginPath(); o.arc(T.x + T.w / 2, T.y + T.h * 0.25, 2.2, 0, 6.283); o.fill();
      o.beginPath(); o.arc(T.x + T.w / 2, T.y + T.h * 0.78, 1.8, 0, 6.283); o.fill();
      // перламутровые ромбики-диаманты
      function diamond(x, y) {
        var dg = o.createLinearGradient(x - 3, y - 3, x + 3, y + 3); dg.addColorStop(0, '#ffffff'); dg.addColorStop(1, '#b6c2cc');
        o.fillStyle = dg; o.beginPath(); o.moveTo(x, y - 3.2); o.lineTo(x + 2.2, y); o.lineTo(x, y + 3.2); o.lineTo(x - 2.2, y); o.closePath(); o.fill();
      }
      [0.125, 0.25, 0.375, 0.625, 0.75, 0.875].forEach(function (f) { diamond(T.x - rl * 0.78, T.y + T.h * f); diamond(T.x + T.w + rl * 0.78, T.y + T.h * f); });
      [0.25, 0.5, 0.75].forEach(function (f) { diamond(T.x + T.w * f, T.y - rl * 0.78); diamond(T.x + T.w * f, T.y + T.h + rl * 0.78); });
      // лузы: латунная накладка + глубина
      pockets.forEach(function (pk, n) {
        var corner = n !== 2 && n !== 3;
        var bg = o.createRadialGradient(pk.x - pr * 0.3, pk.y - pr * 0.3, pr * 0.2, pk.x, pk.y, pr * 1.45);
        bg.addColorStop(0, '#fde68a'); bg.addColorStop(0.5, '#b8862b'); bg.addColorStop(1, '#5c3d0c');
        o.fillStyle = bg; o.beginPath(); o.arc(pk.x, pk.y, pr * (corner ? 1.26 : 1.18), 0, 6.283); o.fill();
        o.strokeStyle = 'rgba(0,0,0,.4)'; o.lineWidth = 1; o.stroke();
        var hg = o.createRadialGradient(pk.x, pk.y + pr * 0.15, pr * 0.1, pk.x, pk.y, pr);
        hg.addColorStop(0, '#000'); hg.addColorStop(0.75, '#0a0a0a'); hg.addColorStop(1, '#2b2b2b');
        o.fillStyle = hg; o.beginPath(); o.arc(pk.x, pk.y, pr, 0, 6.283); o.fill();
        o.strokeStyle = 'rgba(255,255,255,.12)'; o.lineWidth = 1; o.beginPath(); o.arc(pk.x, pk.y, pr - 1, Math.PI * 0.15, Math.PI * 0.85); o.stroke();
      });
      tableCv = cv;
    }
    function rack() {
      balls = [];
      var cx = T.x + T.w / 2, top = T.y + T.h * 0.25, order = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15], k = 0;
      // 8 в центре треугольника
      var arr = order.slice();
      for (var row = 0; row < 5; row++) for (var i = 0; i <= row; i++) {
        var n = arr[k++];
        balls.push({ n: n, x: cx + (i - row / 2) * R * 2.02, y: top - row * R * 1.76, vx: 0, vy: 0, in: false, rot: Math.random() * 6 });
      }
      var b8 = balls.filter(function (b) { return b.n === 8; })[0], mid = balls[4];
      var tx = b8.x, ty = b8.y; b8.x = mid.x; b8.y = mid.y; mid.x = tx; mid.y = ty;
      balls.unshift({ n: 0, x: cx, y: T.y + T.h * 0.78, vx: 0, vy: 0, in: false, rot: 0 });
    }
    function cue() { return balls[0]; }
    function moving() { for (var i = 0; i < balls.length; i++) if (!balls[i].in && (balls[i].vx || balls[i].vy)) return true; return false; }
    function step(h) {
      var i, j, b, a;
      for (i = 0; i < balls.length; i++) {
        b = balls[i]; if (b.in) continue;
        b.x += b.vx * h; b.y += b.vy * h;
        var sp = Math.hypot(b.vx, b.vy);
        if (sp > 0) {
          var dec = (T.w * 0.32 + sp * 0.55) * h, ns = Math.max(0, sp - dec);
          b.vx *= ns / sp; b.vy *= ns / sp; b.rot += sp * h / R;
          if (ns < T.w * 0.004) { b.vx = 0; b.vy = 0; }
        }
        // лузы
        for (var p = 0; p < pockets.length; p++) {
          if (Math.hypot(b.x - pockets[p].x, b.y - pockets[p].y) < pr) {
            b.in = true; b.vx = b.vy = 0; pottedList.push(b.n);
            api.sound(b.n === 0 ? 'hit' : 'coin'); api.vibrate(20);
            break;
          }
        }
        if (b.in) continue;
        // борта (в районе луз борт отсутствует)
        var nearPocket = pockets.some(function (pk) { return Math.hypot(b.x - pk.x, b.y - pk.y) < pr * 1.6; });
        if (!nearPocket) {
          if (b.x < T.x + R) { b.x = T.x + R; b.vx = Math.abs(b.vx) * 0.78; api.sound('move'); }
          if (b.x > T.x + T.w - R) { b.x = T.x + T.w - R; b.vx = -Math.abs(b.vx) * 0.78; api.sound('move'); }
          if (b.y < T.y + R) { b.y = T.y + R; b.vy = Math.abs(b.vy) * 0.78; api.sound('move'); }
          if (b.y > T.y + T.h - R) { b.y = T.y + T.h - R; b.vy = -Math.abs(b.vy) * 0.78; api.sound('move'); }
        } else if (b.x < T.x - R || b.x > T.x + T.w + R || b.y < T.y - R || b.y > T.y + T.h + R) { b.in = true; b.vx = b.vy = 0; pottedList.push(b.n); }
      }
      // шар-шар
      for (i = 0; i < balls.length; i++) {
        a = balls[i]; if (a.in) continue;
        for (j = i + 1; j < balls.length; j++) {
          b = balls[j]; if (b.in) continue;
          var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
          if (d < 2 * R && d > 0) {
            var nx = dx / d, ny = dy / d, ov = 2 * R - d;
            a.x -= nx * ov / 2; a.y -= ny * ov / 2; b.x += nx * ov / 2; b.y += ny * ov / 2;
            var rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
            if (rel > 0) {
              var imp = rel * 0.97;
              a.vx -= imp * nx; a.vy -= imp * ny; b.vx += imp * nx; b.vy += imp * ny;
              if (i === 0 && firstHit == null) {
                firstHit = b.n;
                if (spinShot && spinShot.k) {
                  a.vx += spinShot.dx * spinShot.sp * spinShot.k * 0.45; a.vy += spinShot.dy * spinShot.sp * spinShot.k * 0.45;
                  spinShot = null;
                }
              }
              if (rel > T.w * 0.2) api.sound('stomp');
            }
          }
        }
      }
    }
    function groupOf(n) { return n === 8 ? 'eight' : n < 8 ? 'solid' : 'stripe'; }
    function remaining(g) { return balls.filter(function (b) { return !b.in && b.n !== 0 && b.n !== 8 && groupOf(b.n) === g; }).length; }
    function shoot(ang, power, sk) {
      var c = cue(), sp = power * T.w * 4.2;
      c.vx = Math.cos(ang) * sp; c.vy = Math.sin(ang) * sp;
      spinShot = isCpu() ? null : { dx: Math.cos(ang), dy: Math.sin(ang), sp: sp, k: sk == null ? spin : sk };
      phase = 'roll'; firstHit = null; pottedList = []; shotsN[turn]++; acc = 0; shooter = turn; inHand = false; snapT = 0;
      api.sound('jump'); api.vibrate(20);
    }
    function say(m) { msg = m; msgT = 1.6; }
    function resolve() {
      var me = turn, myG = groups[me], foul = false, keep = false;
      var scratch = pottedList.indexOf(0) >= 0, eight = pottedList.indexOf(8) >= 0;
      if (firstHit == null) foul = true;
      else if (myG && firstHit !== 8 && groupOf(firstHit) !== myG) foul = true;
      else if (myG && firstHit === 8 && remaining(myG) > 0) foul = true;
      else if (!myG && firstHit === 8) foul = true;
      if (scratch) foul = true;
      if (eight) {
        var cleared = myG && remaining(myG) === 0;
        winner = cleared && !scratch ? me : 1 - me;
        phase = 'over'; endT = 2.8; finish();
        if (api.mode === 2) sendRes(foul, false);
        return;
      }
      var pots = pottedList.filter(function (n) { return n !== 0 && n !== 8; }), assigned = false;
      if (!myG && pots.length && !foul) {
        groups[me] = groupOf(pots[0]); groups[1 - me] = groups[me] === 'solid' ? 'stripe' : 'solid';
        say(api.t(groups[me] === 'solid' ? 'bil.solids' : 'bil.stripes'));
        myG = groups[me]; assigned = true;
      }
      if (!foul && pots.some(function (n) { return !myG || groupOf(n) === myG; })) keep = true;
      if (api.mode === 0 && me === 0) pots.forEach(function (n) { if (groupOf(n) === groups[0]) api.addScore(50); });
      if (scratch) { var c0 = cue(); c0.in = false; c0.x = T.x + T.w / 2; c0.y = T.y + T.h * 0.78; c0.vx = c0.vy = 0; placeFree(c0); }
      if (foul) say(api.t('bil.foul'));
      if (!keep) turn = 1 - turn;
      phase = 'aim'; aimInit();
      if (api.mode === 2) { inHand = scratch; sendRes(foul, assigned); }
    }
    // ---- сеть ----
    function myIdx() { return api.net ? api.net.side : 0; }
    function myTurnNet() { return api.mode === 2 && api.net && turn === myIdx(); }
    function oppTurnNet() { return api.mode === 2 && turn !== myIdx(); }
    function r4(v) { return Math.round(v * 1e4) / 1e4; }
    function nX(x) { return r4((x - T.x) / T.w); }
    function nY(y) { return r4((y - T.y) / T.w); }
    function dX(u) { return T.x + u * T.w; }
    function dY(u) { return T.y + u * T.w; }
    function gEnc(g) { return g === 'solid' ? 's' : g === 'stripe' ? 't' : 0; }
    function gDec(g) { return g === 's' ? 'solid' : g === 't' ? 'stripe' : null; }
    // бьющий: итог удара — авторитетная расстановка и правила; у себя тоже округляем, чтобы стороны совпадали бит в бит
    function sendRes(foul, assigned) {
      if (!api.net) return;
      var b = balls.map(function (o) {
        if (o.in) return 0;
        var u = nX(o.x), v = nY(o.y); o.x = dX(u); o.y = dY(v); return [u, v];
      });
      api.net.send({ k: 'res', n: netN, b: b, tu: turn, g: [gEnc(groups[0]), gEnc(groups[1])], w: winner == null ? -1 : winner,
        f: foul ? 1 : 0, as: assigned ? 1 : 0, ih: inHand ? 1 : 0, sh: shooter });
    }
    function netShoot(ang, power) {
      var c0 = cue();
      ang = r4(ang); power = r4(power);
      var cx = nX(c0.x), cy = nY(c0.y); c0.x = dX(cx); c0.y = dY(cy);
      netN++;
      api.net.send({ k: 'shot', n: netN, a: ang, p: power, s: spin, cx: cx, cy: cy });
      shoot(ang, power);
    }
    function applyShot(d) {
      if (d.n !== netN + 1 || phase !== 'aim' || !oppTurnNet()) return;
      netN = d.n; snapT = 0;
      var c0 = cue(); c0.in = false; c0.x = dX(d.cx); c0.y = dY(d.cy); c0.vx = c0.vy = 0; c0.ox = c0.oy = 0;
      aim.ang = d.a; aimTo = null;
      shoot(d.a, d.p, d.s || 0);
    }
    function applyRes(d) {
      if (d.n !== netN || shooter === myIdx() || (phase !== 'roll' && phase !== 'wait')) return;
      balls.forEach(function (o, i) {
        var q = d.b[i]; o.vx = o.vy = 0;
        if (!q) { o.in = true; return; }
        var nx = dX(q[0]), ny = dY(q[1]);
        if (o.in) { o.ox = o.oy = 0; } else { o.ox = o.x - nx; o.oy = o.y - ny; }
        o.in = false; o.x = nx; o.y = ny;
      });
      snapT = 0.35; spinShot = null;
      groups = [gDec(d.g[0]), gDec(d.g[1])];
      turn = d.tu; inHand = !!d.ih;
      if (d.w >= 0) { winner = d.w; phase = 'over'; endT = 2.8; finish(); return; }
      if (d.as) { var og = groups[d.sh]; say(api.t(og === 'solid' ? 'bil.oppSolids' : 'bil.oppStripes')); }
      if (d.f) say(api.t('bil.foul'));
      phase = 'aim'; aimInit();
    }
    function cueFree(x, y) {
      var c0 = cue();
      return !balls.some(function (b) { return b !== c0 && !b.in && Math.hypot(b.x - x, b.y - y) < 2.05 * R; });
    }
    function placeCue(x, y) {
      var c0 = cue();
      x = Math.max(T.x + R, Math.min(T.x + T.w - R, x));
      y = Math.max(T.y + T.h * 0.78, Math.min(T.y + T.h - R, y));
      if (cueFree(x, y)) { c0.x = x; c0.y = y; }
    }
    function placeFree(c0) {
      for (var tries = 0; tries < 40; tries++) {
        var clash = balls.some(function (b) { return b !== c0 && !b.in && Math.hypot(b.x - c0.x, b.y - c0.y) < 2.1 * R; });
        if (!clash) return;
        c0.x = T.x + R * 2 + Math.random() * (T.w - R * 4); c0.y = T.y + T.h * (0.65 + Math.random() * 0.25);
      }
    }
    function finish() {
      if (api.mode === 0) {
        if (winner === 0) { api.addScore(1000 * (api.diff + 1)); api.sound('win'); }
        else api.sound('over');
      } else if (api.mode === 2) api.sound(winner === myIdx() ? 'win' : 'over');
      else api.sound('win');
    }
    function aimInit() { aim = { ang: -Math.PI / 2, power: 0 }; drag = null; aiShot = null; aiT = 0.9; }
    function isCpu() { return api.mode === 0 && turn === 1; }
    // трассировка луча прицела до первого шара/борта
    function trace(x, y, ang) {
      var dx = Math.cos(ang), dy = Math.sin(ang), best = 1e9, hit = null;
      balls.forEach(function (b) {
        if (b.n === 0 || b.in) return;
        var fx = b.x - x, fy = b.y - y, proj = fx * dx + fy * dy;
        if (proj <= 0) return;
        var perp2 = fx * fx + fy * fy - proj * proj, rr = 4 * R * R;
        if (perp2 > rr) return;
        var d = proj - Math.sqrt(rr - perp2);
        if (d < best) { best = d; hit = b; }
      });
      var wallD = 1e9;
      if (dx > 0) wallD = Math.min(wallD, (T.x + T.w - R - x) / dx); if (dx < 0) wallD = Math.min(wallD, (T.x + R - x) / dx);
      if (dy > 0) wallD = Math.min(wallD, (T.y + T.h - R - y) / dy); if (dy < 0) wallD = Math.min(wallD, (T.y + R - y) / dy);
      if (best < wallD) return { d: best, ball: hit, gx: x + dx * best, gy: y + dy * best };
      return { d: wallD, ball: null, gx: x + dx * wallD, gy: y + dy * wallD };
    }
    function clearPath(x1, y1, x2, y2, ignore) {
      var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
      return !balls.some(function (b) {
        if (b.in || ignore.indexOf(b) >= 0) return false;
        var t2 = ((b.x - x1) * dx + (b.y - y1) * dy) / (L * L);
        if (t2 < 0 || t2 > 1) return false;
        return Math.hypot(x1 + dx * t2 - b.x, y1 + dy * t2 - b.y) < 2 * R;
      });
    }
    function planAi() {
      var c = cue(), myG = groups[1], best = null;
      var targets = balls.filter(function (b) { return !b.in && b.n !== 0 && (myG ? (remaining(myG) ? groupOf(b.n) === myG : b.n === 8) : b.n !== 8); });
      targets.forEach(function (b) {
        pockets.forEach(function (pk) {
          var tx = pk.x - b.x, ty = pk.y - b.y, tl = Math.hypot(tx, ty);
          var gx = b.x - tx / tl * 2 * R, gy = b.y - ty / tl * 2 * R;
          var ax = gx - c.x, ay = gy - c.y, al = Math.hypot(ax, ay);
          var cos = (ax * tx + ay * ty) / (al * tl);
          if (cos < 0.3) return;
          if (!clearPath(c.x, c.y, gx, gy, [c, b]) || !clearPath(b.x, b.y, pk.x, pk.y, [b])) return;
          var score = cos * 2 - (al + tl) / T.h;
          if (!best || score > best.score) best = { score: score, ang: Math.atan2(ay, ax), power: Math.min(1, 0.35 + (al + tl / Math.max(0.35, cos)) / (T.h * 1.6)) };
        });
      });
      if (!best) {
        var near = targets.sort(function (a, b) { return Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y); })[0];
        best = near ? { ang: Math.atan2(near.y - c.y, near.x - c.x), power: 0.6 } : { ang: -Math.PI / 2, power: 0.5 };
      }
      if (groups[0] == null && groups[1] == null && pottedList.length === 0 && shotsN[0] + shotsN[1] === 0) best = { ang: -Math.PI / 2 + (Math.random() - 0.5) * 0.04, power: 1 };
      best.ang += (Math.random() - 0.5) * 2 * DIFF[api.diff].err;
      return best;
    }
    function drawBall(c, b, x, y) {
      var col = b.n === 0 ? '#f8fafc' : colorOf(b.n);
      c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(x + R * 0.3, y + R * 0.38, R * 0.95, R * 0.8, 0, 0, 6.283); c.fill();
      c.save(); c.beginPath(); c.arc(x, y, R, 0, 6.283); c.clip();
      c.fillStyle = b.n > 8 || b.n === 0 ? '#f5f3ee' : col; c.fillRect(x - R, y - R, 2 * R, 2 * R);
      if (b.n > 8) { var off = Math.sin(b.rot) * R * 0.25; c.fillStyle = col; c.fillRect(x - R, y - R * 0.5 + off, 2 * R, R); }
      if (b.n) {
        var nx = x + Math.cos(b.rot) * R * 0.2, ny = y + Math.sin(b.rot * 0.7) * R * 0.15;
        c.fillStyle = '#fffef8'; c.beginPath(); c.arc(nx, ny, R * 0.46, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 0.8; c.stroke();
        c.fillStyle = '#111'; c.font = '800 ' + Math.round(R * 0.62) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(String(b.n), nx, ny + 1);
      } else {
        c.fillStyle = 'rgba(220,38,38,.55)'; c.beginPath(); c.arc(x + Math.cos(b.rot) * R * 0.3, y + Math.sin(b.rot * 0.7) * R * 0.25, R * 0.12, 0, 6.283); c.fill();
      }
      var g = c.createRadialGradient(x - R * 0.35, y - R * 0.4, R * 0.05, x, y, R * 1.05);
      g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(0.3, 'rgba(255,255,255,.06)'); g.addColorStop(0.75, 'rgba(0,0,0,.12)'); g.addColorStop(1, 'rgba(0,0,0,.5)');
      c.fillStyle = g; c.fillRect(x - R, y - R, 2 * R, 2 * R);
      // отражённый свет снизу и резкий блик
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(x + R * 0.35, y + R * 0.5, R * 0.3, 0, 6.283); c.fill();
      c.restore();
      c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.ellipse(x - R * 0.38, y - R * 0.42, R * 0.2, R * 0.13, -0.7, 0, 6.283); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 0.7; c.beginPath(); c.arc(x, y, R - 0.3, 0, 6.283); c.stroke();
    }

    return {
      reset: function () {
        layout(); rack();
        turn = 0; groups = [null, null]; phase = 'aim'; msg = ''; msgT = 0; endT = 0; winner = null; t = 0; pottedList = []; shotsN = [0, 0];
        netN = 0; shooter = 0; inHand = false; acc = 0; snapT = 0; aimSendT = 0; aimTo = null; lastAimKey = '';
        if (api.mode === 2) spin = 0;
        aimInit();
      },
      netMsg: function (d) {
        if (!d || !balls || api.mode !== 2) return;
        if (d.k === 'shot') applyShot(d);
        else if (d.k === 'res') applyRes(d);
        else if (d.k === 'aim') {
          // живой прицел соперника (latest-wins); устаревшие (с прошлого удара) отбрасываем
          if (d.n !== netN || phase !== 'aim' || !oppTurnNet() || endT > 0) return;
          aimTo = { a: d.a, p: d.p };
          if (inHand && d.cx != null) { var c0 = cue(); c0.x = dX(d.cx); c0.y = dY(d.cy); }
        }
      },
      resize: function () { layout(); },
      idle: function (dt) { t += dt; },
      key: function () { },
      input: function (type, d) {
        if (phase !== 'aim' || isCpu() || endT > 0) return;
        if (api.mode === 2 && !myTurnNet()) return;
        var c0 = cue();
        // v2.5 (сеть): шар с руки после того, как соперник забил биток — тащи биток за линией дома
        if (api.mode === 2 && inHand) {
          if (type === 'down' && Math.hypot(d.x - c0.x, d.y - c0.y) < R * 2.6) { drag = { place: true }; return; }
          if (drag && drag.place) {
            if (type === 'move') placeCue(d.x, d.y);
            else if (type === 'up') drag = null;
            return;
          }
          if (type === 'tap' && Math.hypot(d.x - c0.x, d.y - c0.y) < R * 2.6) return;
        }
        if (type === 'down' && spinW && Math.hypot(d.x - spinW.x, d.y - spinW.y) < spinW.r + 10) {
          spin = Math.max(-1, Math.min(1, -(d.y - spinW.y) / spinW.r)); if (Math.abs(spin) < 0.2) spin = 0;
          api.sound('click'); drag = null; return;
        }
        if (type === 'down') drag = { x: d.x, y: d.y, cx: d.x, cy: d.y };
        else if (type === 'move' && drag) {
          drag.cx = d.x; drag.cy = d.y;
          var vx = drag.x - d.x, vy = drag.y - d.y, L = Math.hypot(vx, vy);
          if (L > 8) { aim.ang = Math.atan2(vy, vx); aim.power = Math.min(1, L / (api.H * 0.35)); }
        } else if (type === 'up' && drag) {
          if (aim.power > 0.05) { if (api.mode === 2) netShoot(aim.ang, aim.power); else shoot(aim.ang, aim.power); }
          drag = null; aim.power = 0;
        } else if (type === 'tap') {
          if (spinW && Math.hypot(d.x - spinW.x, d.y - spinW.y) < spinW.r + 10) return;
          aim.ang = Math.atan2(d.y - c0.y, d.x - c0.x); // тап — повернуть кий к точке
        }
      },
      update: function (dt) {
        t += dt;
        if (msgT > 0) msgT -= dt;
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); }
        if (snapT > 0) {
          snapT = Math.max(0, snapT - dt);
          if (snapT === 0) balls.forEach(function (o) { o.ox = o.oy = 0; });
        }
        if (phase === 'roll' && api.mode === 2) {
          // сеть: фиксированный шаг — обе стороны считают удар одинаково; итог всё равно решает бьющий
          acc += Math.min(dt, 0.1); var ns = 0;
          while (acc >= NET_H && ns < 80) { step(NET_H); acc -= NET_H; ns++; }
          if (!moving()) { if (shooter === myIdx()) resolve(); else phase = 'wait'; }
          return;
        }
        if (phase === 'roll') {
          var n = 6;
          for (var i = 0; i < n; i++) step(dt / n);
          if (!moving()) resolve();
          return;
        }
        if (phase === 'aim' && api.mode === 2 && endT <= 0) {
          if (myTurnNet()) {
            aimSendT -= dt;
            var c1 = cue(), key = r4(aim.ang) + ':' + Math.round(aim.power * 100) + (inHand ? ':' + nX(c1.x) + ',' + nY(c1.y) : '');
            if (aimSendT <= 0 && (key !== lastAimKey || aimSendT < -0.5)) {
              var o = { k: 'aim', n: netN, a: r4(aim.ang), p: Math.round(aim.power * 100) / 100 };
              if (inHand) { o.cx = nX(c1.x); o.cy = nY(c1.y); }
              api.net.sendFast(o); lastAimKey = key; aimSendT = 1 / 15;
            }
          } else if (aimTo) {
            var da = aimTo.a - aim.ang; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
            aim.ang += da * Math.min(1, dt * 12);
            aim.power += (aimTo.p - aim.power) * Math.min(1, dt * 12);
          }
        }
        if (phase === 'aim' && isCpu() && endT <= 0) {
          if (!aiShot) aiShot = planAi();
          aiT -= dt;
          var k = Math.max(0, 1 - aiT / 0.9);
          aim.ang = aim.ang + (aiShot.ang - aim.ang) * Math.min(1, dt * 6);
          aim.power = aiShot.power * k;
          if (aiT <= 0) { aim.ang = aiShot.ang; shoot(aiShot.ang, aiShot.power); }
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        if (!tableCv || tableKey !== W + 'x' + H + ':' + T.w) buildTable();
        c.drawImage(tableCv, 0, 0, W, H);
        // прицел
        var c0 = cue();
        if (phase === 'aim' && !c0.in && endT <= 0) {
          var tr = trace(c0.x, c0.y, aim.ang), lvl = isCpu() ? 0 : DIFF[api.diff].guide;
          var len = lvl >= 2 ? tr.d : Math.min(tr.d, [T.w * 0.25, T.w * 0.5][lvl]);
          c.setLineDash([6, 6]); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(c0.x, c0.y); c.lineTo(c0.x + Math.cos(aim.ang) * len, c0.y + Math.sin(aim.ang) * len); c.stroke();
          c.setLineDash([]);
          if (lvl >= 2 && tr.ball) {
            c.strokeStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(tr.gx, tr.gy, R, 0, 6.283); c.stroke();
            if (lvl >= 3) {
              var ox = tr.ball.x - tr.gx, oy = tr.ball.y - tr.gy, ol = Math.hypot(ox, oy);
              c.strokeStyle = 'rgba(250,204,21,.8)'; c.beginPath(); c.moveTo(tr.ball.x, tr.ball.y); c.lineTo(tr.ball.x + ox / ol * T.w * 0.4, tr.ball.y + oy / ol * T.w * 0.4); c.stroke();
            }
          }
        }
        var sk = snapT > 0 ? snapT / 0.35 : 0;
        if (api.mode === 2 && inHand && phase === 'aim' && endT <= 0) { // зона шара с руки
          c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(T.x, T.y + T.h * 0.78, T.w, T.h * 0.22);
          c.strokeStyle = 'rgba(253,224,71,' + (0.5 + 0.3 * Math.sin(t * 6)) + ')'; c.lineWidth = 2;
          c.beginPath(); c.arc(c0.x, c0.y, R * 1.6, 0, 6.283); c.stroke();
        }
        balls.forEach(function (b) { if (!b.in) drawBall(c, b, b.x + (b.ox || 0) * sk, b.y + (b.oy || 0) * sk); });
        // кий
        if (phase === 'aim' && !c0.in && endT <= 0) {
          var back = R * 1.6 + aim.power * T.w * 0.35, ca = Math.cos(aim.ang), sa = Math.sin(aim.ang);
          var sx = c0.x - ca * back, sy = c0.y - sa * back, ex = sx - ca * T.h * 0.75, ey = sy - sa * T.h * 0.75;
          var cg = c.createLinearGradient(sx, sy, ex, ey);
          cg.addColorStop(0, '#f5f5f4'); cg.addColorStop(0.04, '#3b82f6'); cg.addColorStop(0.06, '#e7c58e'); cg.addColorStop(0.7, '#a16207'); cg.addColorStop(1, '#1c1917');
          c.lineCap = 'round';
          c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = R * 0.6; c.beginPath(); c.moveTo(sx + R * 0.5, sy + R * 0.7); c.lineTo(ex + R * 0.5, ey + R * 0.7); c.stroke();
          c.strokeStyle = cg; c.lineWidth = R * 0.55;
          c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.stroke();
          // обмотка рукояти и блик вдоль кия
          c.strokeStyle = '#111827'; c.lineWidth = R * 0.62; c.beginPath(); c.moveTo(sx - ca * T.h * 0.52, sy - sa * T.h * 0.52); c.lineTo(sx - ca * T.h * 0.68, sy - sa * T.h * 0.68); c.stroke();
          c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = R * 0.12; c.beginPath(); c.moveTo(sx - ca * R * 0.6 - sa * R * 0.12, sy - sa * R * 0.6 + ca * R * 0.12); c.lineTo(ex - sa * R * 0.12, ey + ca * R * 0.12); c.stroke();
          c.lineCap = 'butt';
        }
        // индикатор силы
        if (phase === 'aim' && aim.power > 0) {
          c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(W - 18, T.y, 8, T.h);
          var pg = c.createLinearGradient(0, T.y + T.h, 0, T.y);
          pg.addColorStop(0, '#22c55e'); pg.addColorStop(0.6, '#facc15'); pg.addColorStop(1, '#ef4444');
          c.fillStyle = pg; c.fillRect(W - 18, T.y + T.h * (1 - aim.power), 8, T.h * aim.power);
        }
        // табло
        var two = api.mode === 1, net = api.mode === 2;
        var names = two ? [api.t('g.p1'), api.t('g.p2')] : net ? (myIdx() === 0 ? [api.t('g.you'), api.t('net.opp')] : [api.t('net.opp'), api.t('g.you')]) : [api.t('g.you'), api.t('g.cpu')];
        c.textBaseline = 'middle';
        for (var p = 0; p < 2; p++) {
          var x = p === 0 ? 10 : W / 2 + 5, act = turn === p && phase !== 'over';
          c.fillStyle = act ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.3)';
          c.beginPath(); c.roundRect ? c.roundRect(x, 6, W / 2 - 15, 44, 12) : c.rect(x, 6, W / 2 - 15, 44); c.fill();
          c.fillStyle = act ? '#fde047' : '#e7e5e4'; c.font = '800 12px system-ui, sans-serif'; c.textAlign = 'left';
          c.fillText(names[p], x + 8, 18);
          var g2 = groups[p];
          if (g2) {
            var mine = balls.filter(function (b) { return b.n && b.n !== 8 && groupOf(b.n) === g2; });
            mine.forEach(function (b, k) {
              var bx2 = x + 12 + k * (R * 1.4 + 2), by2 = 37;
              c.globalAlpha = b.in ? 0.25 : 1; c.fillStyle = colorOf(b.n); c.beginPath(); c.arc(bx2, by2, R * 0.7, 0, 6.283); c.fill();
              if (b.n > 8) { c.fillStyle = '#fff'; c.fillRect(bx2 - R * 0.7, by2 - R * 0.7, R * 1.4, R * 0.35); c.fillRect(bx2 - R * 0.7, by2 + R * 0.35, R * 1.4, R * 0.35); }
              c.globalAlpha = 1;
            });
          } else { c.fillStyle = 'rgba(255,255,255,.4)'; c.font = '700 11px system-ui, sans-serif'; c.fillText(api.t('bil.open'), x + 8, 37); }
        }
        c.textAlign = 'center';
        if (phase === 'over') {
          c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, H / 2 - 36, W, 72);
          c.fillStyle = '#fde047'; c.font = '900 28px system-ui, sans-serif';
          c.fillText(two ? api.t(winner === 0 ? 'g.p1win' : 'g.p2win') : api.t(winner === (net ? myIdx() : 0) ? 'g.win' : 'g.lose'), W / 2, H / 2);
        } else if (msgT > 0) {
          c.globalAlpha = Math.min(1, msgT * 2); c.fillStyle = '#fff'; c.font = '900 22px system-ui, sans-serif';
          c.lineWidth = 5; c.lineJoin = 'round'; c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeText(msg, W / 2, T.y + T.h * 0.5); c.fillText(msg, W / 2, T.y + T.h * 0.5);
          c.globalAlpha = 1;
        } else if (net) {
          c.fillStyle = 'rgba(255,255,255,.6)'; c.font = '700 12px system-ui, sans-serif';
          c.fillText(myTurnNet() && (phase === 'aim') ? (inHand ? api.t('bil.inHand') : t < 8 ? api.t('bil.tip') : api.t('g.yourTurn')) : api.t('net.oppTurn'), W / 2, H - 14);
        } else if (phase === 'aim' && !isCpu() && t < 8) {
          c.fillStyle = 'rgba(255,255,255,.5)'; c.font = '700 12px system-ui, sans-serif';
          c.fillText(api.t('bil.tip'), W / 2, H - 14);
        }
        // регулятор вращения битка
        spinW = null;
        if (phase === 'aim' && !isCpu() && endT <= 0 && !(net && !myTurnNet())) {
          var sr = 20, sx = W - sr - 12, sy = H - sr - 12;
          spinW = { x: sx, y: sy, r: sr };
          c.fillStyle = '#f8fafc'; c.beginPath(); c.arc(sx, sy, sr, 0, 6.283); c.fill();
          c.strokeStyle = 'rgba(15,23,42,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(sx, sy - sr); c.lineTo(sx, sy + sr); c.stroke();
          c.fillStyle = spin > 0 ? '#16a34a' : spin < 0 ? '#dc2626' : '#0f172a';
          c.beginPath(); c.arc(sx, sy - spin * sr * 0.7, 5, 0, 6.283); c.fill();
          c.fillStyle = 'rgba(255,255,255,.75)'; c.font = '800 10px system-ui, sans-serif'; c.textAlign = 'right'; c.textBaseline = 'middle';
          c.fillText(spin > 0 ? api.t('bil.follow') : spin < 0 ? api.t('bil.draw') : api.t('bil.spin'), sx - sr - 6, sy);
          c.textAlign = 'left';
        }
      }
    };
  }
};
