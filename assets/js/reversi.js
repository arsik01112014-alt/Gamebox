/* Реверси (Отелло): против компьютера, вдвоём и по сети */
window.GAMES = window.GAMES || {};
window.GAMES.reversi = {
  title: 'Реверси',
  desc: 'Переверни фишки соперника',
  hint: 'Ставь фишку так, чтобы зажать ряд фишек соперника между своими — они перевернутся. Точки показывают возможные ходы. Нет хода — пропуск. Побеждает тот, у кого больше фишек. Углы — самые ценные клетки!',
  d0: 'Компьютер-новичок', d1: 'Компьютер знает про углы', d2: 'Думает на 3 хода', d3: 'Думает на 5 ходов',
  colors: ['#065f46', '#111827'],
  controls: 'none',
  modes: true,
  lan: true,
  isNew2: true,
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="rvf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a8672f"/><stop offset="1" stop-col' +
    'or="#5c3210"/></linearGradient><radialGradient id="rvg" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#10a674"/><stop offset="1" stop-color="#0' +
    '3583d"/></radialGradient><radialGradient id="rvw" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#94a3b8"/><' +
    '/radialGradient><radialGradient id="rvk" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#6b7280"/><stop offset=".5" stop-color="#1f2937"/><stop ' +
    'offset="1" stop-color="#030712"/></radialGradient></defs><rect x="6" y="6" width="88" height="88" rx="12" fill="url(#rvf)"/><path d="M10 20q40-4 80 0M' +
    '10 80q40 4 80 0" stroke="rgba(40,16,2,.35)" fill="none"/><rect x="14" y="14" width="72" height="72" rx="3" fill="url(#rvg)"/><path d="M32 14v72M50 14v' +
    '72M68 14v72M14 32h72M14 50h72M14 68h72" stroke="#03402c" stroke-width="1.4"/><circle cx="41.0" cy="42.3" r="8.2" fill="#111827"/><circle cx="41.0" cy=' +
    '"41.0" r="8.2" fill="url(#rvw)"/><circle cx="59.0" cy="60.3" r="8.2" fill="#111827"/><circle cx="59.0" cy="59.0" r="8.2" fill="url(#rvw)"/><circle cx=' +
    '"59.0" cy="42.3" r="8.2" fill="#e2e8f0"/><circle cx="59.0" cy="41.0" r="8.2" fill="url(#rvk)"/><circle cx="41.0" cy="60.3" r="8.2" fill="#e2e8f0"/><ci' +
    'rcle cx="41.0" cy="59.0" r="8.2" fill="url(#rvk)"/><circle cx="23.0" cy="24.3" r="8.2" fill="#e2e8f0"/><circle cx="23.0" cy="23.0" r="8.2" fill="url(#' +
    'rvk)"/><circle cx="77.0" cy="42.3" r="8.2" fill="#111827"/><circle cx="77.0" cy="41.0" r="8.2" fill="url(#rvw)"/><circle cx="59" cy="41" r="2" fill="#' +
    'f97316"/><circle cx="77" cy="77" r="2.6" fill="#f8fafc" opacity=".55"/><circle cx="23" cy="59" r="2.6" fill="#f8fafc" opacity=".55"/></svg>',

  create: function (api) {
    var N = 8, B = 1, Wt = 2;
    var WEIGHTS = [
      120, -20, 20, 5, 5, 20, -20, 120,
      -20, -40, -5, -5, -5, -5, -40, -20,
      20, -5, 15, 3, 3, 15, -5, 20,
      5, -5, 3, 3, 3, 3, -5, 5,
      5, -5, 3, 3, 3, 3, -5, 5,
      20, -5, 15, 3, 3, 15, -5, 20,
      -20, -40, -5, -5, -5, -5, -40, -20,
      120, -20, 20, 5, 5, 20, -20, 120];
    var DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    var board, flips, turn, cs, bx, by, t, thinkT, endT, netQ, last, passT, passMsg, over, wins, starter;

    function layout() {
      cs = Math.min((api.W - 44) / N, (api.H - 220) / N);
      bx = (api.W - cs * N) / 2; by = 118 + Math.max(0, (api.H - 180 - cs * N) / 2);
      build();
    }
    function opp(p) { return p === B ? Wt : B; }
    function flipsFor(b, i, p) {
      if (b[i]) return [];
      var r = Math.floor(i / N), c = i % N, out = [];
      for (var d = 0; d < 8; d++) {
        var rr = r + DIRS[d][0], cc = c + DIRS[d][1], line = [];
        while (rr >= 0 && rr < N && cc >= 0 && cc < N && b[rr * N + cc] === opp(p)) { line.push(rr * N + cc); rr += DIRS[d][0]; cc += DIRS[d][1]; }
        if (line.length && rr >= 0 && rr < N && cc >= 0 && cc < N && b[rr * N + cc] === p) out = out.concat(line);
      }
      return out;
    }
    function movesOf(b, p) { var m = []; for (var i = 0; i < N * N; i++) if (!b[i] && flipsFor(b, i, p).length) m.push(i); return m; }
    function count(b, p) { var n = 0; for (var i = 0; i < b.length; i++) if (b[i] === p) n++; return n; }
    function apply(b, i, p) { var f = flipsFor(b, i, p); b[i] = p; f.forEach(function (k) { b[k] = p; }); return f; }
    function evalB(b, me) {
      var s = 0, empty = 0;
      for (var i = 0; i < 64; i++) { if (b[i] === me) s += WEIGHTS[i]; else if (b[i]) s -= WEIGHTS[i]; else empty++; }
      var mob = movesOf(b, me).length - movesOf(b, opp(me)).length;
      s += mob * 8;
      if (empty < 12) s += (count(b, me) - count(b, opp(me))) * 6;
      return s;
    }
    function nega(b, depth, a, beta, p) {
      var ms = movesOf(b, p);
      if (depth === 0) return evalB(b, p);
      if (!ms.length) {
        if (!movesOf(b, opp(p)).length) { var d = count(b, p) - count(b, opp(p)); return d > 0 ? 10000 + d : d < 0 ? -10000 + d : 0; }
        return -nega(b, depth - 1, -beta, -a, opp(p));
      }
      ms.sort(function (x, y) { return WEIGHTS[y] - WEIGHTS[x]; });
      var best = -1e9;
      for (var k = 0; k < ms.length; k++) {
        var nb = b.slice(); apply(nb, ms[k], p);
        var v = -nega(nb, depth - 1, -beta, -a, opp(p));
        if (v > best) best = v; if (best > a) a = best; if (a >= beta) break;
      }
      return best;
    }
    function aiMove() {
      var ms = movesOf(board, Wt);
      if (!ms.length) return;
      var pick = ms[0], d = api.diff;
      if (d === 0) {
        // жадный, но с ошибками
        var bestN = -1; ms.forEach(function (m) { var n = flipsFor(board, m, Wt).length + Math.random() * 3; if (n > bestN) { bestN = n; pick = m; } });
      } else if (d === 1) {
        var bv = -1e9; ms.forEach(function (m) { var v = WEIGHTS[m] + flipsFor(board, m, Wt).length * 2 + Math.random() * 6; if (v > bv) { bv = v; pick = m; } });
      } else {
        var depth = d === 2 ? 3 : 5, bb = -1e9;
        ms.forEach(function (m) { var nb = board.slice(); apply(nb, m, Wt); var v = -nega(nb, depth - 1, -1e9, 1e9, B) + Math.random(); if (v > bb) { bb = v; pick = m; } });
      }
      place(pick);
    }
    function mySide() { return api.net && api.net.side === 1 ? Wt : B; }
    function place(i, remote) {
      if (api.mode === 2 && !remote) api.net.send({ i: i });
      var f = apply(board, i, turn);
      last = i;
      f.forEach(function (k, n) { flips[k] = { t: -n * 0.05, from: opp(turn) }; });
      flips[i] = { t: 0, from: 0 };
      api.tone(turn === B ? 300 : 420, 0.06, 'triangle', 0.07); api.vibrate(8);
      if (f.length >= 5) api.fx.shake(2);
      nextTurn();
    }
    function nextTurn() {
      var nt = opp(turn);
      if (movesOf(board, nt).length) { turn = nt; }
      else if (movesOf(board, turn).length) { passMsg = api.t('rev.pass'); passT = 1.4; api.sound('move'); }
      else { finish(); return; }
      if (api.mode === 0 && turn === Wt) thinkT = 0.55 + Math.random() * 0.3;
    }
    function finish() {
      over = true;
      var b = count(board, B), w = count(board, Wt), me = api.mode === 2 ? mySide() : B;
      var mine = me === B ? b : w, theirs = me === B ? w : b;
      if (api.mode === 0) {
        if (b > w) { api.addScore(1000 * (api.diff + 1) + b * 10 + (w === 0 ? 1000 : 0)); api.sound('win'); api.fx.confetti(80); }
        else if (b === w) { api.addScore(300 * (api.diff + 1)); api.sound('point'); }
        else { api.addScore(b * 5); api.sound('hit'); }
        endT = 2.6;
      } else {
        if (b !== w) wins[b > w ? 0 : 1]++;
        api.sound(api.mode === 2 && mine < theirs ? 'hit' : 'win');
        if (api.mode === 1 || mine > theirs) api.fx.confetti(60);
        endT = 2.6;
      }
    }
    function newBoard() {
      board = []; flips = {};
      for (var i = 0; i < 64; i++) board.push(0);
      board[27] = Wt; board[36] = Wt; board[28] = B; board[35] = B;
      turn = B; last = -1; over = false; passT = 0; endT = 0;
    }
    // ---------- графика ----------
    var dpr = 1, bgL = null, boardL = null, spr = {}, shS = null, sprS = 0, lw = 0, lh = 0, FW = 16;
    function mkC(w, h) {
      var o = document.createElement('canvas');
      o.width = Math.max(1, Math.ceil(w * dpr)); o.height = Math.max(1, Math.ceil(h * dpr));
      var x = o.getContext('2d'); x.scale(dpr, dpr); return o;
    }
    function rr(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }
    function seedRnd(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
    function makeDisc(v, S) {
      // вид сверху с толщиной: снизу видна кромка другого цвета
      var o = mkC(S, S), c = o.getContext('2d'), m = S / 2, r = S * 0.4, th = S * 0.06, g;
      var top = v === B ? ['#6b7280', '#1f2937', '#030712'] : ['#ffffff', '#f1f5f9', '#94a3b8'];
      var bot = v === B ? ['#f8fafc', '#cbd5e1'] : ['#374151', '#030712'];
      g = c.createLinearGradient(m - r, 0, m + r, 0);
      g.addColorStop(0, bot[1]); g.addColorStop(0.5, bot[0]); g.addColorStop(1, bot[1]);
      c.fillStyle = g; c.beginPath(); c.arc(m, m - th * 0.5 + th, r, 0, 6.283); c.fill();
      c.fillStyle = v === B ? '#111827' : '#e2e8f0'; c.beginPath(); c.arc(m, m - th * 0.5 + th * 0.45, r, 0, 6.283); c.fill();
      g = c.createRadialGradient(m - r * 0.35, m - th * 0.5 - r * 0.4, r * 0.05, m, m - th * 0.5, r * 1.05);
      g.addColorStop(0, top[0]); g.addColorStop(0.5, top[1]); g.addColorStop(1, top[2]);
      c.fillStyle = g; c.beginPath(); c.arc(m, m - th * 0.5, r, 0, 6.283); c.fill();
      // концентрические бороздки
      c.strokeStyle = v === B ? 'rgba(255,255,255,.07)' : 'rgba(15,23,42,.08)'; c.lineWidth = Math.max(1, S * 0.015);
      c.beginPath(); c.arc(m, m - th * 0.5, r * 0.78, 0, 6.283); c.stroke();
      c.beginPath(); c.arc(m, m - th * 0.5, r * 0.5, 0, 6.283); c.stroke();
      c.strokeStyle = v === B ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.9)'; c.lineWidth = Math.max(1, S * 0.02);
      c.beginPath(); c.arc(m, m - th * 0.5, r * 0.95, 3.6, 5.3); c.stroke();
      // блик
      c.save(); c.translate(m - r * 0.35, m - th * 0.5 - r * 0.4); c.rotate(-0.7); c.scale(1, 0.45);
      g = c.createRadialGradient(0, 0, 0, 0, 0, r * 0.45);
      g.addColorStop(0, v === B ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * 0.45, 0, 6.283); c.fill(); c.restore();
      return o;
    }
    function build() {
      var W = api.W, H = api.H, bw = cs * N, g, i, x, y, rnd = seedRnd(7);
      dpr = Math.min(2, window.devicePixelRatio || 1); lw = W; lh = H;
      bgL = mkC(W, H); var c = bgL.getContext('2d');
      g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#052e24'); g.addColorStop(0.55, '#064e3b'); g.addColorStop(1, '#021a14');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // ромбический узор
      c.strokeStyle = 'rgba(255,255,255,.035)'; c.lineWidth = 1;
      for (i = -H; i < W + H; i += 26) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + H, H); c.stroke(); c.beginPath(); c.moveTo(i, 0); c.lineTo(i - H, H); c.stroke(); }
      g = c.createRadialGradient(W / 2, by + bw / 2, bw * 0.2, W / 2, by + bw / 2, Math.max(W, H) * 0.8);
      g.addColorStop(0, 'rgba(110,231,183,.14)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.6)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);

      boardL = mkC(W, H); c = boardL.getContext('2d');
      var ox = bx - FW, oy = by - FW, ow = bw + FW * 2;
      c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 24; c.shadowOffsetY = 12;
      c.fillStyle = '#5a3210'; rr(c, ox, oy, ow, ow, 12); c.fill(); c.restore();
      // рамка из 4 планок с волокнами
      var pieces = [
        [[ox, oy], [ox + ow, oy], [bx + bw, by], [bx, by], 0],
        [[ox, oy + ow], [ox + ow, oy + ow], [bx + bw, by + bw], [bx, by + bw], 0],
        [[ox, oy], [bx, by], [bx, by + bw], [ox, oy + ow], 1],
        [[ox + ow, oy], [bx + bw, by], [bx + bw, by + bw], [ox + ow, oy + ow], 1]];
      c.save(); rr(c, ox, oy, ow, ow, 12); c.clip();
      pieces.forEach(function (p, pi) {
        c.save(); c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (var k = 1; k < 4; k++) c.lineTo(p[k][0], p[k][1]); c.closePath(); c.clip();
        var base = pi === 0 || pi === 2 ? 0 : ow - FW;
        var wg = p[4] ? c.createLinearGradient(ox + base, 0, ox + base + FW, 0) : c.createLinearGradient(0, oy + base, 0, oy + base + FW);
        wg.addColorStop(0, '#8a4f20'); wg.addColorStop(0.45, '#a8672f'); wg.addColorStop(1, '#6e3c15');
        c.fillStyle = wg; c.fillRect(ox, oy, ow, ow);
        for (var L = 0; L < 26; L++) {
          var off = base + rnd() * FW, amp = 1 + rnd() * 2.5, ph = rnd() * 6, fr = 0.02 + rnd() * 0.03;
          c.strokeStyle = rnd() < 0.5 ? 'rgba(40,18,4,' + (0.15 + rnd() * 0.25) + ')' : 'rgba(255,210,150,' + (0.05 + rnd() * 0.1) + ')';
          c.lineWidth = 0.5 + rnd() * 1.1; c.beginPath();
          for (var s = 0; s <= ow; s += 6) {
            var a = off + Math.sin(s * fr + ph) * amp;
            if (p[4]) { if (s) c.lineTo(ox + a, oy + s); else c.moveTo(ox + a, oy + s); }
            else { if (s) c.lineTo(ox + s, oy + a); else c.moveTo(ox + s, oy + a); }
          }
          c.stroke();
        }
        // свет/тень на планке
        c.fillStyle = pi === 0 || pi === 2 ? 'rgba(255,230,190,.1)' : 'rgba(0,0,0,.1)'; c.fillRect(ox, oy, ow, ow);
        c.restore();
      });
      // стыки
      c.strokeStyle = 'rgba(30,12,2,.5)'; c.lineWidth = 1;
      [[ox, oy, bx, by], [ox + ow, oy, bx + bw, by], [ox, oy + ow, bx, by + bw], [ox + ow, oy + ow, bx + bw, by + bw]].forEach(function (l) { c.beginPath(); c.moveTo(l[0], l[1]); c.lineTo(l[2], l[3]); c.stroke(); });
      c.restore();
      c.strokeStyle = 'rgba(255,220,170,.35)'; c.lineWidth = 1.2; rr(c, ox + 0.6, oy + 0.6, ow - 1.2, ow - 1.2, 12); c.stroke();
      // координаты
      c.font = '800 9px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (i = 0; i < N; i++) {
        c.fillStyle = 'rgba(255,225,180,.35)';
        c.fillText('abcdefgh'.charAt(i), bx + (i + 0.5) * cs, by + bw + FW / 2 + 0.8);
        c.fillText(String(i + 1), bx - FW / 2, by + (i + 0.5) * cs + 0.8);
        c.fillStyle = 'rgba(40,16,2,.8)';
        c.fillText('abcdefgh'.charAt(i), bx + (i + 0.5) * cs, by + bw + FW / 2);
        c.fillText(String(i + 1), bx - FW / 2, by + (i + 0.5) * cs);
      }
      // сукно
      g = c.createRadialGradient(bx + bw * 0.4, by + bw * 0.35, bw * 0.1, bx + bw / 2, by + bw / 2, bw * 0.8);
      g.addColorStop(0, '#0f9a6c'); g.addColorStop(1, '#03583d');
      c.fillStyle = g; c.fillRect(bx, by, bw, bw);
      var nDots = Math.floor(bw * bw / 5);
      for (i = 0; i < nDots; i++) {
        c.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.06)';
        c.fillRect(bx + rnd() * bw, by + rnd() * bw, 1, 1);
      }
      for (i = 0; i < 260; i++) {
        x = bx + rnd() * bw; y = by + rnd() * bw; var a2 = rnd() * 6.283, ln = 2 + rnd() * 3;
        c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a2) * ln, y + Math.sin(a2) * ln); c.stroke();
      }
      // внутренняя тень от рамки
      c.save(); c.beginPath(); c.rect(bx, by, bw, bw); c.clip();
      c.shadowColor = 'rgba(0,0,0,.7)'; c.shadowBlur = 12; c.lineWidth = 10; c.strokeStyle = '#000';
      c.strokeRect(bx - 5, by - 5, bw + 10, bw + 10); c.restore();
      // сетка-бороздки
      for (i = 1; i < N; i++) {
        c.fillStyle = 'rgba(0,30,18,.55)'; c.fillRect(bx + i * cs - 1, by, 1.5, bw); c.fillRect(bx, by + i * cs - 1, bw, 1.5);
        c.fillStyle = 'rgba(167,243,208,.12)'; c.fillRect(bx + i * cs + 0.5, by, 1, bw); c.fillRect(bx, by + i * cs + 0.5, bw, 1);
      }
      [[2, 2], [2, 6], [6, 2], [6, 6]].forEach(function (p) {
        c.fillStyle = 'rgba(0,30,18,.8)'; c.beginPath(); c.arc(bx + p[0] * cs, by + p[1] * cs, 3.5, 0, 6.283); c.fill();
        c.fillStyle = 'rgba(167,243,208,.2)'; c.beginPath(); c.arc(bx + p[0] * cs + 0.5, by + p[1] * cs + 1, 3.5, 0.3, 2.8); c.fill();
      });
      sprS = Math.max(48, Math.ceil(cs));
      spr[B] = makeDisc(B, sprS); spr[Wt] = makeDisc(Wt, sprS);
      shS = mkC(sprS, sprS); c = shS.getContext('2d');
      g = c.createRadialGradient(sprS / 2, sprS / 2, sprS * 0.2, sprS / 2, sprS / 2, sprS * 0.48);
      g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(0, 0, sprS, sprS);
    }
    function disc(c, x, y, s, v, k) {
      // k — фаза переворота 0..1 (0.5 — ребром)
      if (!spr[v]) return;
      var sx = Math.abs(Math.cos(k * Math.PI));
      var show = k < 0.5 ? (v === B ? Wt : B) : v;
      if (k >= 1) { sx = 1; show = v; }
      var lift = k < 1 ? Math.sin(k * Math.PI) : 0, sc = 1 + lift * 0.12;
      c.drawImage(shS, x - s * 0.5 + 2 + lift * 5, y - s * 0.5 + 3 + lift * 7, s, s);
      var w = s * sc * Math.max(0.08, sx);
      c.drawImage(spr[show], x - w / 2, y - s * sc / 2 - lift * s * 0.08, w, s * sc);
      if (sx < 0.35 && k < 1) {
        c.fillStyle = show === B ? '#cbd5e1' : '#374151';
        c.fillRect(x - Math.max(1, w * 0.12), y - s * 0.38 * sc - lift * s * 0.08, Math.max(2, w * 0.24), s * 0.76 * sc);
      }
    }

    return {
      reset: function () {
        netQ = []; t = 0; thinkT = 0; wins = [0, 0];
        layout(); newBoard();
      },
      resize: layout,
      netMsg: function (d) { netQ.push(d); },
      idle: function (dt) { t += dt; },
      input: function (type, d) {
        if (type !== 'tap' || over || passT > 0) return;
        if (api.mode === 0 && turn === Wt) return;
        if (api.mode === 2 && turn !== mySide()) return;
        var c = Math.floor((d.x - bx) / cs), r = Math.floor((d.y - by) / cs);
        if (c < 0 || r < 0 || c >= N || r >= N) return;
        var i = r * N + c;
        if (!flipsFor(board, i, turn).length) { api.tone(150, 0.06, 'square', 0.03); return; }
        place(i);
      },
      update: function (dt) {
        t += dt;
        for (var k in flips) { flips[k].t += dt * 3; if (flips[k].t >= 1) delete flips[k]; }
        if (endT > 0) {
          endT -= dt;
          if (endT <= 0) api.gameOver();
          return;
        }
        if (passT > 0) { passT -= dt; if (passT <= 0 && api.mode === 0 && turn === Wt) thinkT = 0.4; return; }
        if (!over && api.mode === 0 && turn === Wt) { thinkT -= dt; if (thinkT <= 0) aiMove(); }
        if (!over && api.mode === 2 && turn !== mySide() && netQ.length) { var nd = netQ.shift(); if (nd.i >= 0 && nd.i < 64 && flipsFor(board, nd.i, turn).length) place(nd.i, true); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, q = api.quality;
        if (!bgL || lw !== W || lh !== H) layout();
        c.drawImage(bgL, 0, 0, W, H);
        var nb = count(board, B), nw = count(board, Wt), two = api.mode === 1;
        var names = two ? [api.t('g.p1'), api.t('g.p2')] : api.mode === 2 ? (mySide() === B ? [api.t('g.you'), api.t('net.opp')] : [api.t('net.opp'), api.t('g.you')]) : [api.t('g.you'), api.t('g.cpu')];
        c.textAlign = 'center'; c.textBaseline = 'middle';
        [[B, W * 0.22, nb, 0], [Wt, W * 0.78, nw, 1]].forEach(function (z) {
          var act = !over && turn === z[0], px = z[1] - 70;
          var pg = c.createLinearGradient(0, 12, 0, 88);
          pg.addColorStop(0, act ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.07)'); pg.addColorStop(1, act ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.02)');
          c.fillStyle = pg; rr(c, px, 12, 140, 76, 18); c.fill();
          if (act) {
            c.strokeStyle = '#6ee7b7'; c.globalAlpha = 0.3 + 0.2 * Math.sin(t * 5); c.lineWidth = 6; c.stroke();
            c.globalAlpha = 1; c.lineWidth = 2; c.stroke();
          } else { c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 1; c.stroke(); }
          disc(c, z[1] - 38, 40, 44, z[0], 1);
          c.fillStyle = 'rgba(0,0,0,.35)'; c.font = '900 30px system-ui, sans-serif'; c.fillText(String(z[2]), z[1] + 19, 42);
          c.fillStyle = '#fff'; c.fillText(String(z[2]), z[1] + 18, 40);
          c.fillStyle = act ? '#fff' : 'rgba(255,255,255,.6)'; c.font = '800 11px system-ui, sans-serif'; c.fillText(names[z[3]].toUpperCase(), z[1], 74);
        });
        // полоса соотношения
        var tot = Math.max(1, nb + nw), barW = Math.max(24, W * 0.56 - 156), barX = W / 2 - barW / 2;
        c.fillStyle = '#e2e8f0'; rr(c, barX, 46, barW, 8, 4); c.fill();
        c.fillStyle = '#111827'; c.save(); rr(c, barX, 46, barW, 8, 4); c.clip(); c.fillRect(barX, 46, barW * nb / tot, 8); c.restore();
        c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1; rr(c, barX, 46, barW, 8, 4); c.stroke();
        c.drawImage(boardL, 0, 0, W, H);
        // последний ход
        if (last >= 0) {
          var lx0 = bx + (last % N) * cs, ly0 = by + Math.floor(last / N) * cs;
          c.fillStyle = 'rgba(253,224,71,.14)'; c.fillRect(lx0 + 1, ly0 + 1, cs - 2, cs - 2);
        }
        for (var k = 0; k < 64; k++) {
          if (!board[k]) continue;
          var x = bx + (k % N + 0.5) * cs, y = by + (Math.floor(k / N) + 0.5) * cs, f = flips[k];
          if (f && f.from === 0) {
            var e = Math.min(1, f.t), sc = 1 + (1 - e) * (1 - e) * 0.5;
            c.save(); c.globalAlpha = Math.min(1, 0.3 + e * 1.5); c.translate(x, y - (1 - e) * cs * 0.25); c.scale(sc, sc); disc(c, 0, 0, cs, board[k], 1); c.restore();
            if (q > 0 && e < 0.6) { c.strokeStyle = 'rgba(253,224,71,' + (0.6 - e) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, cs * (0.4 + e * 0.5), 0, 6.283); c.stroke(); }
          }
          else disc(c, x, y, cs, board[k], f ? Math.max(0, f.t) : 1);
        }
        if (last >= 0 && board[last]) {
          var mx = bx + (last % N + 0.5) * cs, my = by + (Math.floor(last / N) + 0.5) * cs - cs * 0.03;
          c.fillStyle = '#f97316'; c.beginPath(); c.arc(mx, my, Math.max(2.5, cs * 0.07), 0, 6.283); c.fill();
          c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(mx - 1, my - 1, Math.max(1, cs * 0.025), 0, 6.283); c.fill();
        }
        // подсказки ходов
        var canMove = !over && passT <= 0 && !(api.mode === 0 && turn === Wt) && !(api.mode === 2 && turn !== mySide());
        if (canMove) {
          var pa = 0.5 + 0.2 * Math.sin(t * 4);
          movesOf(board, turn).forEach(function (m) {
            var hx = bx + (m % N + 0.5) * cs, hy = by + (Math.floor(m / N) + 0.5) * cs;
            c.globalAlpha = pa;
            c.fillStyle = 'rgba(0,40,25,.45)'; c.beginPath(); c.arc(hx + 0.8, hy + 1.2, cs * 0.12, 0, 6.283); c.fill();
            c.fillStyle = turn === B ? '#1f2937' : '#f8fafc'; c.beginPath(); c.arc(hx, hy, cs * 0.11, 0, 6.283); c.fill();
            c.strokeStyle = turn === B ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.2)'; c.lineWidth = 1; c.beginPath(); c.arc(hx, hy, cs * 0.3, 0, 6.283); c.stroke();
            c.globalAlpha = 1;
          });
        }
        // статус
        var msg;
        if (over) {
          var me = api.mode === 2 ? mySide() : B, mine = me === B ? nb : nw, th = me === B ? nw : nb;
          msg = nb === nw ? api.t('g.draw') : two ? api.t(nb > nw ? 'g.p1win' : 'g.p2win') : api.t(mine > th ? 'g.win' : 'g.lose');
          msg += ' ' + nb + ':' + nw;
        } else if (passT > 0) msg = passMsg;
        else if (api.mode === 2) msg = api.t(turn === mySide() ? 'g.yourTurn' : 'net.oppTurn');
        else msg = two ? api.t(turn === B ? 'g.p1turn' : 'g.p2turn') : api.t(turn === B ? 'g.yourTurn' : 'g.thinking');
        var sy = Math.min(H - 20, by + N * cs + FW + 30);
        c.font = '800 16px system-ui, sans-serif';
        var mw = c.measureText(msg).width + (over ? 40 : 52);
        c.fillStyle = 'rgba(2,20,14,.7)'; rr(c, W / 2 - mw / 2, sy - 17, mw, 34, 17); c.fill();
        c.strokeStyle = passT > 0 ? '#fbbf24' : 'rgba(110,231,183,.5)'; c.lineWidth = 1.5; c.stroke();
        if (!over) disc(c, W / 2 - mw / 2 + 17, sy, 20, turn, 1);
        c.fillStyle = '#fff'; c.fillText(msg, W / 2 + (over ? 0 : 7), sy + 1);
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      }
    };
  }
};
