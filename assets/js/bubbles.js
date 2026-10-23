/* Шарики: стреляй и собирай по три одного цвета */
window.GAMES = window.GAMES || {};
window.GAMES.bubbles = {
  title: 'Шарики',
  desc: 'Собери три одного цвета',
  hint: 'Веди пальцем, чтобы прицелиться, отпусти — выстрел. Три и больше шариков одного цвета лопаются, а всё, что ни на чём не держится, падает. Отскоки от стен помогают. После промахов потолок опускается! 💣 взрывает всё вокруг, 🌈 подходит к любому цвету.',
  d0: '4 цвета, потолок медленно', d1: '5 цветов', d2: '6 цветов, потолок быстрее', d3: '6 цветов, потолок после каждых 3 промахов',
  colors: ['#ec4899', '#3b82f6'],
  controls: 'none',
  isNew2: true,
  icon: '<svg viewBox="0 0 100 100"><defs><radialGradient id="bubblesGR" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".2" stop-color="#fca5a5"/><stop offset=".65" stop-color="#ef4444"/><stop offset="1" stop-color="#7f1d1d"/></radialGradient><radialGradient id="bubblesGB" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".2" stop-color="#93c5fd"/><stop offset=".65" stop-color="#3b82f6"/><stop offset="1" stop-color="#1e3a8a"/></radialGradient><radialGradient id="bubblesGG" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".2" stop-color="#86efac"/><stop offset=".65" stop-color="#22c55e"/><stop offset="1" stop-color="#14532d"/></radialGradient><radialGradient id="bubblesGY" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".2" stop-color="#fef08a"/><stop offset=".65" stop-color="#facc15"/><stop offset="1" stop-color="#854d0e"/></radialGradient><radialGradient id="bubblesGP" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".2" stop-color="#d8b4fe"/><stop offset=".65" stop-color="#a855f7"/><stop offset="1" stop-color="#4c1d95"/></radialGradient><linearGradient id="bubblesGc" x1="0" x2="1"><stop offset="0" stop-color="#3b0764"/><stop offset=".45" stop-color="#c4b5fd"/><stop offset="1" stop-color="#2e1065"/></linearGradient></defs>' +
    '<circle cx="20" cy="20" r="10" fill="url(#bubblesGR)"/><circle cx="40" cy="20" r="10" fill="url(#bubblesGB)"/><circle cx="60" cy="20" r="10" fill="url(#bubblesGB)"/><circle cx="80" cy="20" r="10" fill="url(#bubblesGG)"/><circle cx="30" cy="37" r="10" fill="url(#bubblesGY)"/><circle cx="50" cy="37" r="10" fill="url(#bubblesGB)"/><circle cx="70" cy="37" r="10" fill="url(#bubblesGP)"/>' +
    '<g fill="#fff" opacity=".8"><ellipse cx="16" cy="15" rx="3.6" ry="2" transform="rotate(-35 16 15)"/><ellipse cx="36" cy="15" rx="3.6" ry="2" transform="rotate(-35 36 15)"/><ellipse cx="56" cy="15" rx="3.6" ry="2" transform="rotate(-35 56 15)"/><ellipse cx="76" cy="15" rx="3.6" ry="2" transform="rotate(-35 76 15)"/><ellipse cx="26" cy="32" rx="3.6" ry="2" transform="rotate(-35 26 32)"/><ellipse cx="46" cy="32" rx="3.6" ry="2" transform="rotate(-35 46 32)"/><ellipse cx="66" cy="32" rx="3.6" ry="2" transform="rotate(-35 66 32)"/></g>' +
    '<g fill="#3b82f6" opacity=".9"><circle cx="50" cy="66" r="2.6"/><circle cx="50" cy="57" r="2.1"/><circle cx="50" cy="49.5" r="1.6"/></g>' +
    '<path d="M42 90 L45 70 H55 L58 90z" fill="url(#bubblesGc)"/><rect x="43" y="68" width="14" height="4" rx="2" fill="#fbbf24"/>' +
    '<path d="M28 98 a22 22 0 0 1 44 0z" fill="#4c1d95"/><path d="M31 97 a19 19 0 0 1 38 0" fill="none" stroke="#c4b5fd" stroke-width="1.5"/>' +
    '<circle cx="50" cy="86" r="9.5" fill="url(#bubblesGB)"/><ellipse cx="46.5" cy="82.5" rx="3.4" ry="1.9" fill="#fff" opacity=".8" transform="rotate(-35 46.5 82.5)"/>' +
    '<circle cx="82" cy="88" r="6" fill="url(#bubblesGY)"/></svg>',

  create: function (api) {
    var PAL = [['#ef4444', '#fca5a5'], ['#3b82f6', '#93c5fd'], ['#22c55e', '#86efac'], ['#facc15', '#fef08a'], ['#a855f7', '#d8b4fe'], ['#f97316', '#fdba74']];
    var DIFF = [{ n: 4, miss: 7 }, { n: 5, miss: 6 }, { n: 6, miss: 5 }, { n: 6, miss: 3 }];
    var SPR = {};
    var COLS = 9, D, R, grid, rowsN, ox, oy, shooter, cur, nxt, shot, aim, aiming, misses, drop, falling, pops, t, deadT, swapT, combo, cleared;

    function layout() {
      R = Math.min(api.W / (COLS * 2 + 1), 22);
      ox = (api.W - (COLS * 2 + 1) * R) / 2 + R;
      shooter = { x: api.W / 2, y: api.H - 60 };
    }
    function rowW(r) { return (r + drop) % 2 ? COLS - 1 : COLS; }
    function pos(r, c) { return { x: ox + c * R * 2 + ((r + drop) % 2 ? R : 0), y: oy + r * R * 1.74 + R }; }
    function cell(r, c) { return grid[r] && grid[r][c]; }
    function colorsLeft() {
      var s = {};
      for (var r = 0; r < grid.length; r++) for (var c = 0; c < grid[r].length; c++) if (grid[r][c] && grid[r][c].c >= 0) s[grid[r][c].c] = 1;
      var a = Object.keys(s).map(Number);
      return a.length ? a : [0];
    }
    function rndBall() {
      var r = Math.random();
      if (r < 0.04) return { c: -1, sp: 'bomb' };
      if (r < 0.08) return { c: -2, sp: 'rainbow' };
      var cs = colorsLeft();
      return { c: cs[Math.floor(Math.random() * cs.length)] };
    }
    function newRow() {
      var row = [];
      for (var c = 0; c < COLS; c++) row.push({ c: Math.floor(Math.random() * D.n) });
      return row;
    }
    function neighbors(r, c) {
      var odd = (r + drop) % 2, L = [[r, c - 1], [r, c + 1]];
      if (odd) L.push([r - 1, c], [r - 1, c + 1], [r + 1, c], [r + 1, c + 1]);
      else L.push([r - 1, c - 1], [r - 1, c], [r + 1, c - 1], [r + 1, c]);
      return L.filter(function (p) { return p[0] >= 0 && p[1] >= 0 && p[1] < rowW(p[0]); });
    }
    function ensureRow(r) { while (grid.length <= r) { var row = []; for (var i = 0; i < COLS; i++) row.push(null); grid.push(row); } }
    function snap(x, y) {
      var best = null, bd = 1e9;
      var r0 = Math.max(0, Math.floor((y - oy - R) / (R * 1.74)) - 1);
      for (var r = r0; r <= r0 + 2; r++) {
        for (var c = 0; c < rowW(r); c++) {
          if (cell(r, c)) continue;
          var p = pos(r, c), d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
          if (d < bd) { bd = d; best = [r, c]; }
        }
      }
      return best;
    }
    function flood(r, c, test) {
      var seen = {}, out = [], st = [[r, c]];
      while (st.length) {
        var p = st.pop(), k = p[0] + ',' + p[1];
        if (seen[k]) continue; seen[k] = 1;
        var b = cell(p[0], p[1]); if (!b || !test(b)) continue;
        out.push(p);
        neighbors(p[0], p[1]).forEach(function (q) { st.push(q); });
      }
      return out;
    }
    function popAt(list, kind) {
      list.forEach(function (p) {
        var b = grid[p[0]][p[1]], q = pos(p[0], p[1]);
        if (!b) return; // бомба может дать дубликаты клеток
        pops.push({ x: q.x, y: q.y, c: b.c, life: 0.3 });
        api.fx.burst(q.x, q.y, b.c >= 0 ? PAL[b.c][0] : '#fff', 5, 140, 2.5);
        grid[p[0]][p[1]] = null;
      });
    }
    function dropFloating() {
      var keep = {};
      for (var c = 0; c < rowW(0); c++) if (cell(0, c)) flood(0, c, function () { return true; }).forEach(function (p) { keep[p[0] + ',' + p[1]] = 1; });
      var n = 0;
      for (var r = 0; r < grid.length; r++) for (var cc = 0; cc < grid[r].length; cc++) {
        if (grid[r][cc] && !keep[r + ',' + cc]) {
          var q = pos(r, cc);
          falling.push({ x: q.x, y: q.y, vx: (Math.random() - 0.5) * 80, vy: -Math.random() * 120, c: grid[r][cc].c });
          grid[r][cc] = null; n++;
        }
      }
      return n;
    }
    function lowestRow() { for (var r = grid.length - 1; r >= 0; r--) for (var c = 0; c < grid[r].length; c++) if (grid[r][c]) return r; return -1; }
    function land(r, c, ball) {
      ensureRow(r);
      grid[r][c] = { c: ball.c, sp: ball.sp };
      var popped = 0, q = pos(r, c);
      if (ball.sp === 'bomb') {
        var list = [[r, c]];
        neighbors(r, c).forEach(function (p) { if (cell(p[0], p[1])) list.push(p); neighbors(p[0], p[1]).forEach(function (p2) { if (cell(p2[0], p2[1]) && list.every(function (z) { return z[0] !== p2[0] || z[1] !== p2[1]; })) list.push(p2); }); });
        popAt(list); popped = list.length;
        api.fx.shake(7); api.fx.flash('#fb923c', 0.2); api.sound('break');
      } else {
        var col = ball.c;
        if (ball.sp === 'rainbow') {
          // радуга становится цветом самого частого соседа
          var cnt = {};
          neighbors(r, c).forEach(function (p) { var b = cell(p[0], p[1]); if (b && b.c >= 0) cnt[b.c] = (cnt[b.c] || 0) + 1; });
          var bk = -1, bv = 0; for (var k in cnt) if (cnt[k] > bv) { bv = cnt[k]; bk = +k; }
          col = bk >= 0 ? bk : colorsLeft()[0];
          grid[r][c] = { c: col };
        }
        var same = flood(r, c, function (b) { return b.c === col; });
        if (same.length >= 3) { popAt(same); popped = same.length; }
      }
      if (popped) {
        combo++;
        var fell = dropFloating();
        var pts = popped * 10 + fell * 20 * (1 + Math.floor(fell / 5));
        pts *= Math.min(4, combo);
        api.addScore(pts);
        api.fx.text(q.x, q.y - 10, '+' + pts + (combo > 1 ? ' x' + Math.min(4, combo) : ''), combo > 1 ? '#f472b6' : '#fde047', 16 + Math.min(8, popped));
        api.sound(fell ? 'bonus' : 'point'); api.vibrate(15);
        if (fell >= 6) { api.fx.shake(4); api.toast(api.t('bub.avalanche')); }
        if (lowestRow() < 0) {
          cleared++; api.addScore(1000 * cleared); api.sound('win'); api.fx.confetti(60); api.toast(api.t('bub.clear'));
          fillStart(4 + Math.min(4, cleared));
        }
      } else {
        combo = 0; misses++;
        api.sound('drop');
        if (misses >= D.miss) { misses = 0; pushCeiling(); }
      }
      checkDead();
    }
    function pushCeiling() {
      drop = (drop + 1) % 2;
      grid.unshift(newRow());
      if (grid[0].length > rowW(0)) grid[0].length = rowW(0);
      // ряды под новым верхним меняют чётность — укорачиваем при необходимости
      for (var r = 1; r < grid.length; r++) if (grid[r].length > rowW(r)) { var ex = grid[r].splice(rowW(r)); }
      api.fx.shake(5); api.sound('stomp');
    }
    function checkDead() {
      var lr = lowestRow();
      if (lr >= 0 && pos(lr, 0).y + R > shooter.y - R * 3) { deadT = 1.4; api.sound('hit'); api.vibrate(200); api.fx.flash('#ef4444', 0.3); }
    }
    function fillStart(n) {
      grid = [];
      for (var r = 0; r < n; r++) { var row = []; for (var c = 0; c < rowW(r); c++) row.push({ c: Math.floor(Math.random() * D.n) }); while (row.length < COLS) row.push(null); grid.push(row); }
    }
    function fire() {
      if (shot || deadT > 0 || !aim) return;
      var a = Math.atan2(aim.y - shooter.y, aim.x - shooter.x);
      a = Math.max(-Math.PI + 0.12, Math.min(-0.12, a));
      shot = { x: shooter.x, y: shooter.y, vx: Math.cos(a) * 900, vy: Math.sin(a) * 900, b: cur };
      cur = nxt; nxt = rndBall(); swapT = 0.15;
      api.tone(440, 0.06, 'triangle', 0.05);
    }
    function guide() {
      if (!aim) return [];
      var a = Math.atan2(aim.y - shooter.y, aim.x - shooter.x);
      a = Math.max(-Math.PI + 0.12, Math.min(-0.12, a));
      var x = shooter.x, y = shooter.y, vx = Math.cos(a), vy = Math.sin(a), pts = [[x, y]], L = ox, Rr = ox + (COLS * 2 - 2) * R;
      for (var s = 0; s < 400; s++) {
        x += vx * 6; y += vy * 6;
        if (x < L) { x = L; vx = -vx; pts.push([x, y]); }
        if (x > Rr) { x = Rr; vx = -vx; pts.push([x, y]); }
        if (y < oy + R) { pts.push([x, y]); break; }
        var hit = false;
        for (var r = Math.max(0, Math.floor((y - oy) / (R * 1.74)) - 1); r < grid.length && !hit; r++) for (var c = 0; c < grid[r].length; c++) {
          if (!grid[r][c]) continue; var p = pos(r, c); if ((p.x - x) * (p.x - x) + (p.y - y) * (p.y - y) < R * R * 3.2) { hit = true; break; }
        }
        if (hit) { pts.push([x, y]); break; }
      }
      return pts;
    }
    function DPR() { return Math.min(2, window.devicePixelRatio || 1); }
    function mkCanvas(w, h) { var cv = document.createElement('canvas'), d = DPR(); cv.width = Math.max(1, Math.ceil(w * d)); cv.height = Math.max(1, Math.ceil(h * d)); var x = cv.getContext('2d'); x.scale(d, d); return { cv: cv, x: x, w: w, h: h }; }
    function rrect(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
    function darker(hex, k) { var n = parseInt(hex.slice(1), 16); return 'rgb(' + Math.round((n >> 16) * k) + ',' + Math.round((n >> 8 & 255) * k) + ',' + Math.round((n & 255) * k) + ')'; }
    function ballSpr(kind, r) {
      var key = kind + '_' + Math.round(r * 2);
      if (SPR[key]) return SPR[key];
      var S = Math.ceil(r * 2 + 6), o = mkCanvas(S, S), x = o.x, rr = r * 0.94; x.translate(S / 2, S / 2);
      if (kind === 'bomb') {
        var bg = x.createRadialGradient(-rr * 0.35, -rr * 0.4, rr * 0.05, 0, 0, rr);
        bg.addColorStop(0, '#6b7280'); bg.addColorStop(0.5, '#1f2937'); bg.addColorStop(1, '#030712');
        x.fillStyle = bg; x.beginPath(); x.arc(0, 0, rr, 0, 6.283); x.fill();
        x.strokeStyle = 'rgba(239,68,68,.8)'; x.lineWidth = Math.max(1.5, r * 0.12); x.beginPath(); x.arc(0, 0, rr * 0.9, 0, 6.283); x.stroke();
        x.fillStyle = '#9ca3af'; x.fillRect(-rr * 0.22, -rr * 1.0, rr * 0.44, rr * 0.22);
        x.strokeStyle = '#a16207'; x.lineWidth = 2; x.lineCap = 'round'; x.beginPath(); x.moveTo(0, -rr * 0.95); x.quadraticCurveTo(rr * 0.4, -rr * 1.2, rr * 0.42, -rr * 0.62); x.stroke(); x.lineCap = 'butt';
        x.fillStyle = '#fca5a5'; x.beginPath();
        for (var i = 0; i < 16; i++) { var a = i * 0.3927, q = i % 2 ? rr * 0.22 : rr * 0.5; x.lineTo(Math.cos(a) * q, Math.sin(a) * q + rr * 0.08); }
        x.closePath(); x.fill();
        x.fillStyle = 'rgba(255,255,255,.4)'; x.beginPath(); x.ellipse(-rr * 0.38, -rr * 0.42, rr * 0.22, rr * 0.12, -0.7, 0, 6.283); x.fill();
        SPR[key] = o; return o;
      }
      var base, light, dark;
      if (kind === 'rainbow') {
        if (x.createConicGradient) { var cg = x.createConicGradient(0, 0, 0); PAL.forEach(function (p, i) { cg.addColorStop(i / PAL.length, p[0]); }); cg.addColorStop(1, PAL[0][0]); x.fillStyle = cg; }
        else x.fillStyle = '#e879f9';
        x.beginPath(); x.arc(0, 0, rr, 0, 6.283); x.fill();
        var wg = x.createRadialGradient(0, 0, 0, 0, 0, rr); wg.addColorStop(0, 'rgba(255,255,255,.85)'); wg.addColorStop(0.35, 'rgba(255,255,255,.15)'); wg.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = wg; x.beginPath(); x.arc(0, 0, rr, 0, 6.283); x.fill();
      } else {
        var P = PAL[kind] || PAL[0]; base = P[0]; light = P[1]; dark = darker(base, 0.55);
        var g = x.createRadialGradient(-rr * 0.35, -rr * 0.4, rr * 0.05, 0, 0, rr * 1.02);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.18, light); g.addColorStop(0.6, base); g.addColorStop(1, dark);
        x.fillStyle = g; x.beginPath(); x.arc(0, 0, rr, 0, 6.283); x.fill();
        // отражённый свет снизу
        var rg = x.createRadialGradient(rr * 0.25, rr * 0.45, 0, rr * 0.25, rr * 0.45, rr * 0.6);
        rg.addColorStop(0, 'rgba(255,255,255,.28)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = rg; x.beginPath(); x.arc(0, 0, rr, 0, 6.283); x.fill();
      }
      // ободок
      x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 1.2; x.beginPath(); x.arc(0, 0, rr - 0.3, 0, 6.283); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 1; x.beginPath(); x.arc(0, 0, rr * 0.86, 0.3, 1.6); x.stroke();
      // блик
      x.fillStyle = 'rgba(255,255,255,.75)'; x.beginPath(); x.ellipse(-rr * 0.34, -rr * 0.42, rr * 0.3, rr * 0.16, -0.65, 0, 6.283); x.fill();
      x.fillStyle = '#fff'; x.beginPath(); x.arc(-rr * 0.08, -rr * 0.58, rr * 0.07, 0, 6.283); x.fill();
      SPR[key] = o; return o;
    }
    function ball(c, x, y, b, r) {
      r = r || R;
      var kind = b.sp === 'bomb' ? 'bomb' : (b.sp === 'rainbow' || b.c === -2) ? 'rainbow' : (PAL[b.c] ? b.c : 0);
      var s = ballSpr(kind, R), sc = r / R;
      if (kind === 'rainbow') { c.save(); c.translate(x, y); c.rotate(t * 2); c.drawImage(s.cv, -s.w / 2 * sc, -s.h / 2 * sc, s.w * sc, s.h * sc); c.restore(); }
      else c.drawImage(s.cv, x - s.w / 2 * sc, y - s.h / 2 * sc, s.w * sc, s.h * sc);
      if (kind === 'bomb') {
        var fx = x + r * 0.4, fy = y - r * 0.6, fl = 0.6 + Math.random() * 0.5;
        c.fillStyle = Math.floor(t * 8) % 2 ? '#fde047' : '#f97316'; c.beginPath(); c.arc(fx, fy, r * 0.2 * fl + 1, 0, 6.283); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(fx, fy, r * 0.08 + 0.5, 0, 6.283); c.fill();
      }
    }
    function getBg(W, H) {
      var key = 'bg' + W + 'x' + H + '_' + Math.round(R);
      if (SPR[key]) return SPR[key];
      for (var k in SPR) if (k.indexOf('bg') === 0) delete SPR[k];
      var o = mkCanvas(W, H), x = o.x;
      var g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1e1b4b'); g.addColorStop(0.55, '#312e81'); g.addColorStop(1, '#1e1b4b');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      var seed = 3; function rn() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      // боке-пузыри
      for (var i = 0; i < 30; i++) {
        var bx = rn() * W, by = rn() * H, br = 3 + rn() * 18;
        x.strokeStyle = 'rgba(196,181,253,' + (0.05 + rn() * 0.1) + ')'; x.lineWidth = 1; x.beginPath(); x.arc(bx, by, br, 0, 6.283); x.stroke();
        x.fillStyle = 'rgba(196,181,253,' + (0.02 + rn() * 0.04) + ')'; x.fill();
        x.fillStyle = 'rgba(255,255,255,.12)'; x.beginPath(); x.arc(bx - br * 0.35, by - br * 0.35, br * 0.15, 0, 6.283); x.fill();
      }
      // поле — тёмное стекло
      var fx0 = ox - R - 2, fw = COLS * 2 * R + 4;
      var fg = x.createLinearGradient(0, 0, 0, H);
      fg.addColorStop(0, 'rgba(10,8,40,.55)'); fg.addColorStop(1, 'rgba(10,8,40,.35)');
      x.fillStyle = fg; x.fillRect(fx0, 0, fw, H);
      // гексагональный узор
      x.strokeStyle = 'rgba(165,180,252,.05)'; x.lineWidth = 1;
      for (var hy = 0; hy < H; hy += R * 1.74) for (var hx = fx0 + ((Math.round(hy / (R * 1.74)) % 2) ? R : 0); hx < fx0 + fw; hx += R * 2) { x.beginPath(); x.arc(hx, hy, R * 0.9, 0, 6.283); x.stroke(); }
      // боковые рейки
      [Math.max(0, fx0 - 5), Math.min(W - 6, fx0 + fw - 1)].forEach(function (rx) {
        var rg = x.createLinearGradient(rx, 0, rx + 6, 0); rg.addColorStop(0, '#4c1d95'); rg.addColorStop(0.5, '#c4b5fd'); rg.addColorStop(1, '#4c1d95');
        x.fillStyle = rg; x.fillRect(rx, 0, 6, H);
        for (var ry = 30; ry < H; ry += 60) { x.fillStyle = '#ede9fe'; x.beginPath(); x.arc(rx + 3, ry, 1.6, 0, 6.283); x.fill(); }
      });
      // потолочная балка
      var cg = x.createLinearGradient(0, 0, 0, 8); cg.addColorStop(0, '#a78bfa'); cg.addColorStop(1, '#3b0764');
      x.fillStyle = cg; x.fillRect(fx0 - 5, 0, fw + 10, 8);
      // виньетка
      var vg = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)');
      x.fillStyle = vg; x.fillRect(0, 0, W, H);
      // подиум пушки
      var py = shooter.y + 8, pg = x.createLinearGradient(0, py - 10, 0, H);
      pg.addColorStop(0, 'rgba(76,29,149,.0)'); pg.addColorStop(0.3, 'rgba(76,29,149,.45)'); pg.addColorStop(1, 'rgba(15,10,40,.9)');
      x.fillStyle = pg; x.fillRect(fx0, py - 10, fw, H - py + 10);
      SPR[key] = o; return o;
    }

    return {
      reset: function () {
        D = DIFF[api.diff]; layout();
        oy = 8; drop = 0; misses = 0; falling = []; pops = []; t = 0; deadT = 0; swapT = 0; combo = 0; cleared = 0; shot = null; aim = null;
        fillStart(6);
        cur = rndBall(); nxt = rndBall(); if (cur.sp) cur = { c: 0 }; if (nxt.sp) nxt = { c: 1 % D.n };
      },
      resize: layout,
      idle: function (dt) { t += dt; },
      input: function (type, d) {
        if (deadT > 0) return;
        if (type === 'down' || type === 'move') {
          // тап по шарику-«следующему» меняет местами
          if (type === 'down' && Math.hypot(d.x - (shooter.x + 60), d.y - shooter.y) < R * 1.6) { var tmp = cur; cur = nxt; nxt = tmp; swapT = 0.15; api.sound('rotate'); aim = null; return; }
          if (d.y < shooter.y - 20) aim = { x: d.x, y: d.y };
        } else if (type === 'up') { if (aim) fire(); aim = null; }
      },
      key: function (k, down) {
        if (!down) return;
        if (!aim) aim = { x: shooter.x, y: shooter.y - 200 };
        var a = Math.atan2(aim.y - shooter.y, aim.x - shooter.x);
        if (k === 'left') a -= 0.08; else if (k === 'right') a += 0.08; else if (k === 'a' || k === 'up') { fire(); return; } else if (k === 'b') { var tmp = cur; cur = nxt; nxt = tmp; return; }
        a = Math.max(-Math.PI + 0.12, Math.min(-0.12, a));
        aim = { x: shooter.x + Math.cos(a) * 200, y: shooter.y + Math.sin(a) * 200 };
      },
      update: function (dt) {
        t += dt;
        if (swapT > 0) swapT -= dt;
        for (var i = falling.length - 1; i >= 0; i--) { var f = falling[i]; f.vy += 1400 * dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.y > api.H + 30) falling.splice(i, 1); }
        for (var p = pops.length - 1; p >= 0; p--) { pops[p].life -= dt; if (pops[p].life <= 0) pops.splice(p, 1); }
        if (deadT > 0) { deadT -= dt; if (deadT <= 0) api.gameOver(); return; }
        if (shot) {
          var steps = 4;
          for (var s = 0; s < steps && shot; s++) {
            shot.x += shot.vx * dt / steps; shot.y += shot.vy * dt / steps;
            var L = ox, Rr = ox + (COLS * 2 - 2) * R;
            if (shot.x < L) { shot.x = L; shot.vx = -shot.vx; api.tone(300, 0.03, 'square', 0.02); }
            if (shot.x > Rr) { shot.x = Rr; shot.vx = -shot.vx; api.tone(300, 0.03, 'square', 0.02); }
            var hit = shot.y <= oy + R;
            if (!hit) {
              for (var r = 0; r < grid.length && !hit; r++) for (var c = 0; c < grid[r].length; c++) {
                if (!grid[r][c]) continue; var q = pos(r, c);
                if ((q.x - shot.x) * (q.x - shot.x) + (q.y - shot.y) * (q.y - shot.y) < R * R * 3.0) { hit = true; break; }
              }
            }
            if (hit) {
              var sp = snap(shot.x, shot.y);
              var b = shot.b; shot = null;
              if (sp) land(sp[0], sp[1], b);
            }
          }
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H, Q = api.quality;
        c.drawImage(getBg(W, H).cv, 0, 0, W, H);
        // линия опасности
        var dy = shooter.y - R * 3, lr = lowestRow(), near = lr >= 0 ? Math.max(0, 1 - (dy - (pos(lr, 0).y + R)) / (R * 6)) : 0;
        c.strokeStyle = 'rgba(239,68,68,' + (0.35 + near * 0.5 * (0.5 + 0.5 * Math.sin(t * 8))) + ')'; c.setLineDash([8, 6]); c.lineWidth = 2; c.lineDashOffset = -t * 20;
        c.beginPath(); c.moveTo(ox - R, dy); c.lineTo(ox + (COLS * 2 - 1) * R, dy); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0;
        if (near > 0 && Q > 0) { var dg = c.createLinearGradient(0, dy - R * 2, 0, dy); dg.addColorStop(0, 'rgba(239,68,68,0)'); dg.addColorStop(1, 'rgba(239,68,68,' + near * 0.25 + ')'); c.fillStyle = dg; c.fillRect(ox - R, dy - R * 2, COLS * 2 * R, R * 2); }
        // счётчик до опускания потолка
        c.textAlign = 'center'; c.textBaseline = 'middle';
        var mw = D.miss * 12 + 14;
        c.fillStyle = 'rgba(10,8,40,.6)'; rrect(c, W / 2 - mw / 2, H - 23, mw, 18, 9); c.fill();
        for (var m = 0; m < D.miss; m++) {
          var ok = m < D.miss - misses, mx = W / 2 + (m - (D.miss - 1) / 2) * 12;
          c.fillStyle = ok ? '#e0e7ff' : '#ef4444'; c.beginPath(); c.arc(mx, H - 14, 3.5, 0, 6.283); c.fill();
          if (ok) { c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(mx - 1, H - 15, 1.2, 0, 6.283); c.fill(); }
        }
        // сетка шариков
        for (var r = 0; r < grid.length; r++) for (var cc = 0; cc < grid[r].length; cc++) {
          var b = grid[r][cc]; if (!b) continue;
          var p = pos(r, cc); ball(c, p.x, p.y, b);
        }
        // лопание: кольцо, вспышка, брызги
        pops.forEach(function (pp) {
          var k = pp.life / 0.3, col = pp.c >= 0 ? PAL[pp.c][1] : '#fff';
          c.globalAlpha = k; c.strokeStyle = col; c.lineWidth = 3 * k + 1; c.beginPath(); c.arc(pp.x, pp.y, R * (1.6 - pp.life * 2), 0, 6.283); c.stroke();
          c.fillStyle = 'rgba(255,255,255,' + (k * 0.6) + ')'; c.beginPath(); c.arc(pp.x, pp.y, R * 0.9 * k, 0, 6.283); c.fill();
          c.fillStyle = col;
          for (var s = 0; s < 6; s++) { var a = s * 1.047 + pp.x * 0.1, d = R * (0.6 + (1 - k) * 1.4); c.beginPath(); c.arc(pp.x + Math.cos(a) * d, pp.y + Math.sin(a) * d, R * 0.16 * k + 0.5, 0, 6.283); c.fill(); }
        });
        c.globalAlpha = 1;
        falling.forEach(function (f) { c.globalAlpha = Math.max(0.3, Math.min(1, (api.H + 30 - f.y) / 200)); ball(c, f.x, f.y, { c: f.c }); });
        c.globalAlpha = 1;
        // прицел: точки по траектории
        var gp = guide();
        if (gp.length > 1) {
          var acol = cur.c >= 0 ? PAL[cur.c][1] : '#fff', step = 16, ph = (t * 40) % step, total = 0, idx = 0, dots = [];
          for (var k = 1; k < gp.length; k++) {
            var x0 = gp[k - 1][0], y0 = gp[k - 1][1], x1 = gp[k][0], y1 = gp[k][1], L = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
            for (var dd = (step - (total % step)) % step + ph; dd < L; dd += step) dots.push([x0 + (x1 - x0) * dd / L, y0 + (y1 - y0) * dd / L, total + dd]);
            total += L;
          }
          c.fillStyle = acol;
          for (var di = 0; di < dots.length; di++) {
            var dk = 1 - dots[di][2] / (total + 1);
            if (dots[di][2] < R * 1.5) continue;
            c.globalAlpha = 0.25 + dk * 0.7; c.beginPath(); c.arc(dots[di][0], dots[di][1], 1.6 + dk * 2.2, 0, 6.283); c.fill();
          }
          c.globalAlpha = 1;
          var end = gp[gp.length - 1];
          c.strokeStyle = acol; c.lineWidth = 2; c.globalAlpha = 0.5 + 0.3 * Math.sin(t * 8); c.setLineDash([4, 4]);
          c.beginPath(); c.arc(end[0], end[1], R * 0.9, 0, 6.283); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
        }
        // пушка
        var aa = aim ? Math.atan2(aim.y - shooter.y, aim.x - shooter.x) : -Math.PI / 2;
        aa = Math.max(-Math.PI + 0.12, Math.min(-0.12, aa));
        c.save(); c.translate(shooter.x, shooter.y); c.rotate(aa + Math.PI / 2);
        var bl = R * 2.3, bw0 = R * 0.78, bw1 = R * 0.5;
        var brg = c.createLinearGradient(-bw0, 0, bw0, 0); brg.addColorStop(0, '#3b0764'); brg.addColorStop(0.4, '#c4b5fd'); brg.addColorStop(0.55, '#8b5cf6'); brg.addColorStop(1, '#2e1065');
        c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.moveTo(-bw0 + 3, 3); c.lineTo(-bw1 + 3, -bl + 3); c.lineTo(bw1 + 3, -bl + 3); c.lineTo(bw0 + 3, 3); c.closePath(); c.fill();
        c.fillStyle = brg; c.beginPath(); c.moveTo(-bw0, 0); c.lineTo(-bw1, -bl); c.lineTo(bw1, -bl); c.lineTo(bw0, 0); c.closePath(); c.fill();
        var mg = c.createLinearGradient(-bw1, 0, bw1, 0); mg.addColorStop(0, '#92400e'); mg.addColorStop(0.45, '#fde68a'); mg.addColorStop(1, '#92400e');
        c.fillStyle = mg; rrect(c, -bw1 - 2.5, -bl - 2, bw1 * 2 + 5, 6, 2.5); c.fill();
        c.fillStyle = 'rgba(253,230,138,.8)'; c.fillRect(-(bw0 + bw1) / 2, -bl * 0.5, bw0 + bw1, 2);
        c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(-bw0 * 0.5, -4); c.lineTo(-bw1 * 0.45, -bl + 6); c.lineTo(-bw1 * 0.2, -bl + 6); c.lineTo(-bw0 * 0.25, -4); c.closePath(); c.fill();
        c.restore();
        // основание
        var bR = R * 1.7, by0 = shooter.y + 10;
        var dg2 = c.createLinearGradient(0, by0 - bR, 0, by0);
        dg2.addColorStop(0, '#7c3aed'); dg2.addColorStop(0.5, '#4c1d95'); dg2.addColorStop(1, '#1e1b4b');
        c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(shooter.x, by0 + 2, bR * 1.15, 6, 0, 0, 6.283); c.fill();
        c.fillStyle = dg2; c.beginPath(); c.arc(shooter.x, by0, bR, Math.PI, 0); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(196,181,253,.7)'; c.lineWidth = 1.5; c.beginPath(); c.arc(shooter.x, by0, bR - 1, Math.PI + 0.2, -0.2); c.stroke();
        for (var rv = 0; rv < 5; rv++) { var ra = Math.PI + 0.35 + rv * (Math.PI - 0.7) / 4; c.fillStyle = '#ddd6fe'; c.beginPath(); c.arc(shooter.x + Math.cos(ra) * (bR - 5), by0 + Math.sin(ra) * (bR - 5), 1.6, 0, 6.283); c.fill(); }
        c.fillStyle = '#1e1b4b'; c.fillRect(shooter.x - bR - 4, by0, bR * 2 + 8, 5);
        // гнездо и текущий шарик
        c.strokeStyle = cur.c >= 0 ? PAL[cur.c][0] : '#fde047'; c.globalAlpha = 0.55 + 0.25 * Math.sin(t * 4); c.lineWidth = 2;
        c.beginPath(); c.arc(shooter.x, shooter.y, R * 1.18, 0, 6.283); c.stroke(); c.globalAlpha = 1;
        if (!shot) ball(c, shooter.x, shooter.y, cur, R * (swapT > 0 ? 1 - swapT * 2 : 1));
        if (shot) {
          if (Q > 0) { var sp0 = Math.sqrt(shot.vx * shot.vx + shot.vy * shot.vy) || 1; for (var tr = 3; tr >= 1; tr--) { c.globalAlpha = 0.12 * (4 - tr); ball(c, shot.x - shot.vx / sp0 * R * 0.9 * tr, shot.y - shot.vy / sp0 * R * 0.9 * tr, shot.b, R * (1 - tr * 0.12)); } c.globalAlpha = 1; }
          ball(c, shot.x, shot.y, shot.b);
        }
        // следующий
        var nx = shooter.x + 60;
        c.fillStyle = 'rgba(10,8,40,.65)'; c.beginPath(); c.arc(nx, shooter.y, R * 0.98, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(196,181,253,.5)'; c.lineWidth = 1.5; c.stroke();
        ball(c, nx, shooter.y, nxt, R * 0.75);
        c.fillStyle = 'rgba(221,214,254,.75)'; c.font = '800 11px system-ui, sans-serif'; c.fillText('⇄', nx, shooter.y + R * 1.45);
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      }
    };
  }
};
