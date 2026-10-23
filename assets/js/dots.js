/* Точки и квадраты: против компьютера, вдвоём и по сети */
window.GAMES = window.GAMES || {};
window.GAMES.dots = {
  title: 'Точки и квадраты',
  desc: 'Замыкай клетки на тетрадном листе',
  hint: 'По очереди соединяйте соседние точки линией. Кто дорисовал четвёртую сторону клетки — забирает её и ходит ещё раз. Не оставляй клеток с тремя сторонами! Побеждает тот, у кого больше клеток.',
  d0: 'Поле 4×4, компьютер-новичок', d1: 'Поле 5×5, не дарит клетки', d2: 'Поле 6×6, знает двойной крест', d3: 'Поле 7×7, считает цепочки',
  colors: ['#2563eb', '#dc2626'],
  controls: 'none',
  modes: true,
  lan: true,
  isNew4: true,
  cat: 'board',
  medals: [900, 2000, 3200],
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="dotsp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf5"/><stop offset="1" stop-color="#f1ead4"/></linearGradient>' +
    '<pattern id="dotsg" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke="#bcd3f0" stroke-width=".8"/></pattern>' +
    '<pattern id="dotsh" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V5" stroke="#2563eb" stroke-width="1.6" opacity=".45"/></pattern>' +
    '<pattern id="dotsr" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><path d="M0 0V5" stroke="#dc2626" stroke-width="1.6" opacity=".45"/></pattern></defs>' +
    '<rect x="9" y="11" width="84" height="84" rx="6" fill="rgba(0,0,0,.25)"/><rect x="6" y="6" width="86" height="86" rx="6" fill="url(#dotsp)"/><rect x="6" y="6" width="86" height="86" rx="6" fill="url(#dotsg)"/>' +
    '<path d="M18 6v86" stroke="#ef4444" stroke-width="1.4" opacity=".7"/>' +
    '<rect x="30" y="20" width="20" height="20" fill="url(#dotsh)"/><rect x="50" y="40" width="20" height="20" fill="url(#dotsr)"/><rect x="30" y="40" width="20" height="20" fill="url(#dotsh)"/>' +
    '<text x="40" y="36" font-family="Comic Sans MS,cursive" font-weight="700" font-size="13" fill="#1d4ed8" text-anchor="middle">A</text>' +
    '<text x="60" y="56" font-family="Comic Sans MS,cursive" font-weight="700" font-size="13" fill="#b91c1c" text-anchor="middle">B</text>' +
    '<g stroke-linecap="round" stroke-width="3.2" fill="none"><path d="M30 20q10-1.5 20 0M30 20q-1 10 0 20M50 20q1.5 10 0 20M30 40q10 1 20 0M30 40q1.5 10 0 20M30 60q10-1 20 0M50 40q1 10 0 20" stroke="#1d4ed8"/>' +
    '<path d="M50 40q10-1.5 20 0M70 40q1 10 0 20M50 60q10 1.5 20 0M70 60q10-1 18 0" stroke="#dc2626"/><path d="M70 20q-1 6 0 12" stroke="#dc2626" stroke-dasharray="3 3"/></g>' +
    '<g fill="#1f2937"><circle cx="30" cy="20" r="3"/><circle cx="50" cy="20" r="3"/><circle cx="70" cy="20" r="3"/><circle cx="30" cy="40" r="3"/><circle cx="50" cy="40" r="3"/><circle cx="70" cy="40" r="3"/><circle cx="30" cy="60" r="3"/><circle cx="50" cy="60" r="3"/><circle cx="70" cy="60" r="3"/><circle cx="30" cy="80" r="3"/><circle cx="50" cy="80" r="3"/><circle cx="70" cy="80" r="3"/></g>' +
    '<path d="M74 70l14-14 4 4-14 14-6 2z" fill="#facc15" stroke="#854d0e" stroke-width="1.2"/><path d="M74 70l4 4-6 2z" fill="#1f2937"/></svg>',

  create: function (api) {
    var P1 = 1, P2 = 2;
    var n, HN, NL, NB, BL, LB, lines, owner, turn, score, over, endT, thinkT, netQ, t, anim, fills, hover, lastL, result, streak;
    var sp, ox, oy;
    var INK = { 1: ['#1d4ed8', '#3b82f6', 'rgba(37,99,235,'], 2: ['#c81e1e', '#ef4444', 'rgba(220,38,38,'] };

    /* ---------- геометрия поля ---------- */
    function setup(size) {
      n = size; HN = (n + 1) * n; NL = HN * 2; NB = n * n;
      BL = []; LB = [];
      for (var l = 0; l < NL; l++) LB.push([]);
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
        var b = r * n + c, ls = [r * n + c, (r + 1) * n + c, HN + r * (n + 1) + c, HN + r * (n + 1) + c + 1];
        BL.push(ls);
        for (var k = 0; k < 4; k++) LB[ls[k]].push(b);
      }
    }
    function ends(l) { // концы линии в координатах сетки [c0,r0,c1,r1]
      if (l < HN) { var r = (l / n) | 0, c = l % n; return [c, r, c + 1, r]; }
      var k = l - HN, r2 = (k / (n + 1)) | 0, c2 = k % (n + 1); return [c2, r2, c2, r2 + 1];
    }
    function sides(L, b) { var s = 0, q = BL[b]; for (var k = 0; k < 4; k++) if (L[q[k]]) s++; return s; }

    /* ---------- ИИ ---------- */
    function capLines(L) { // линии, замыкающие клетку
      var out = [];
      for (var b = 0; b < NB; b++) if (sides(L, b) === 3) { var q = BL[b]; for (var k = 0; k < 4; k++) if (!L[q[k]] && out.indexOf(q[k]) < 0) out.push(q[k]); }
      return out;
    }
    function isSafe(L, l) { var bs = LB[l]; for (var k = 0; k < bs.length; k++) if (sides(L, bs[k]) >= 2) return false; return true; }
    function safeLines(L) { var out = []; for (var l = 0; l < NL; l++) if (!L[l] && isSafe(L, l)) out.push(l); return out; }
    // жадно забрать всё, что можно; вернуть число клеток
    function grab(L) {
      var got = 0, again = true;
      while (again) {
        again = false;
        for (var b = 0; b < NB; b++) if (sides(L, b) === 3) {
          var q = BL[b]; for (var k = 0; k < 4; k++) if (!L[q[k]]) { L[q[k]] = 9; break; }
          got++; again = true;
          var bs = LB[q[k]]; for (var j = 0; j < bs.length; j++) if (bs[j] !== b && sides(L, bs[j]) === 4) got++;
        }
      }
      return got;
    }
    // цепочки и петли из клеток с двумя сторонами
    function comps(L) {
      var seen = new Uint8Array(NB), out = [];
      for (var b = 0; b < NB; b++) {
        if (seen[b] || sides(L, b) !== 2) continue;
        var stack = [b], len = 0, open = false; seen[b] = 1;
        while (stack.length) {
          var x = stack.pop(); len++;
          var q = BL[x];
          for (var k = 0; k < 4; k++) {
            if (L[q[k]]) continue;
            var bs = LB[q[k]], nb = -1;
            for (var j = 0; j < bs.length; j++) if (bs[j] !== x) nb = bs[j];
            if (nb < 0 || sides(L, nb) !== 2) { open = true; continue; }
            if (!seen[nb]) { seen[nb] = 1; stack.push(nb); }
          }
        }
        out.push(open ? len : -len); // отрицательные — петли
      }
      return out;
    }
    var fMemo = {};
    function fval(S) { // ценность для игрока, который вынужден открыть компонент
      if (!S.length) return 0;
      S = S.slice().sort(function (a, b) { return a - b; });
      var key = S.join(',');
      if (fMemo[key] !== undefined) return fMemo[key];
      var best = -Infinity, prev = null;
      for (var i = 0; i < S.length; i++) {
        if (S[i] === prev) continue; prev = S[i];
        var rest = S.slice(0, i).concat(S.slice(i + 1)), fr = fval(rest);
        var loop = S[i] < 0, L = Math.abs(S[i]);
        var take = L + fr, keep = -Infinity;
        if (loop && L >= 4) keep = L - 8 - fr;
        else if (!loop && L >= 3) keep = L - 4 - fr;
        var v = -Math.max(take, keep);
        if (v > best) best = v;
      }
      fMemo[key] = best;
      return best;
    }
    function rnd(a) { return a[(Math.random() * a.length) | 0]; }
    // компонент клетки b (с двумя сторонами): петля ли он
    function isLoop(L, b0) {
      var seen = {}, stack = [b0]; seen[b0] = 1;
      while (stack.length) {
        var x = stack.pop(), q = BL[x];
        for (var k = 0; k < 4; k++) {
          if (L[q[k]]) continue;
          var bs = LB[q[k]], nb = -1;
          for (var j = 0; j < bs.length; j++) if (bs[j] !== x) nb = bs[j];
          if (nb < 0 || sides(L, nb) !== 2) return false;
          if (!seen[nb]) { seen[nb] = 1; stack.push(nb); }
        }
      }
      return true;
    }
    function keyOf(L) { var k = ''; for (var l = 0; l < NL; l++) k += L[l] ? '1' : '0'; return k; }
    // точная оценка эндшпиля (нет безопасных ходов) для того, кто ходит
    var eMemo = {}, deadline = 0, aborted = false;
    function endVal(L, wantMove) {
      var key = keyOf(L);
      if (!wantMove && eMemo[key] !== undefined) return eMemo[key];
      if (Date.now() > deadline) { aborted = true; return 0; }
      var best = -Infinity, bestM = -1, bestT = -Infinity, done = {};
      for (var m = 0; m < NL; m++) {
        if (L[m]) continue;
        var bs = LB[m], loop = false, three = 0, k;
        for (k = 0; k < bs.length; k++) if (sides(L, bs[k]) === 2 && isLoop(L, bs[k])) loop = true;
        var M = L.slice(); M[m] = 9;
        for (k = 0; k < bs.length; k++) if (sides(M, bs[k]) === 3) three++;
        var g = grab(M), mk = keyOf(M) + three + (loop ? 'L' : '');
        var e;
        if (done[mk] !== undefined) e = done[mk];
        else {
          var r = endVal(M, false);
          if (aborted) return 0;
          var opp = g + r;
          if (loop ? g >= 4 : (g >= 3 || (g === 2 && three === 1))) opp = Math.max(opp, g - (loop ? 8 : 4) - r);
          e = -opp; done[mk] = e;
        }
        if (e > best) { best = e; bestM = m; bestT = three - g * 4; }
        else if (wantMove && e === best && three - g * 4 > bestT) { bestM = m; bestT = three - g * 4; }
      }
      if (best === -Infinity) best = 0;
      eMemo[key] = best;
      return wantMove ? bestM : best;
    }
    // поиск в фазе безопасных ходов (Безумный)
    var memo, nodes;
    function safeSearch(L) {
      var key = keyOf(L);
      if (memo[key] !== undefined) return memo[key];
      if (aborted || Date.now() > deadline) { aborted = true; return 0; }
      var sf = safeLines(L), v;
      if (!sf.length) v = endVal(L, false);
      else {
        v = -Infinity;
        for (var k = 0; k < sf.length; k++) { L[sf[k]] = 9; var x = -safeSearch(L); L[sf[k]] = 0; if (x > v) v = x; }
      }
      memo[key] = v; return v;
    }
    function aiMove() {
      var L = lines.slice(), d = api.diff, caps = capLines(L), k;
      eMemo = {}; aborted = false; deadline = Date.now() + 120;
      if (caps.length) {
        if (d === 0 && Math.random() < 0.15) { /* «не заметил» */ }
        else {
          if (d >= 2) {
            var ho = handout(L, caps, d);
            if (ho >= 0) return ho;
          }
          return rnd(caps);
        }
      }
      var safe = safeLines(L);
      if (safe.length) {
        if (d === 0 && Math.random() < 0.3) return rnd(freeLines(L));
        if (d === 3 && safe.length <= 9) {
          memo = {}; aborted = false;
          var best = -Infinity, pick = [];
          for (k = 0; k < safe.length; k++) {
            L[safe[k]] = 9; var v = -safeSearch(L); L[safe[k]] = 0;
            if (aborted) break;
            if (v > best) { best = v; pick = [safe[k]]; } else if (v === best) pick.push(safe[k]);
          }
          if (!aborted) return rnd(pick);
        }
        return rnd(safe);
      }
      var free = freeLines(L);
      if (d === 0) return rnd(free);
      if (d === 3) {
        aborted = false;
        var em = endVal(L, true);
        if (!aborted && em >= 0) return em;
      }
      // вынужденная жертва: отдать поменьше
      var bestV = -Infinity, cand = [];
      for (k = 0; k < free.length; k++) {
        var M = L.slice(); M[free[k]] = 9;
        var three = 0, bs = LB[free[k]];
        for (var j = 0; j < bs.length; j++) if (sides(M, bs[j]) === 3) three++;
        var val = -grab(M) * 10 + (d >= 2 ? three : 0);
        if (val > bestV) { bestV = val; cand = [free[k]]; } else if (val === bestV) cand.push(free[k]);
      }
      return rnd(cand);
    }
    function freeLines(L) { var o = []; for (var l = 0; l < NL; l++) if (!L[l]) o.push(l); return o; }
    // двойной крест: оставить сопернику две последние клетки цепочки
    function handout(L, caps, d) {
      var three = [];
      for (var b = 0; b < NB; b++) if (sides(L, b) === 3) three.push(b);
      if (three.length !== 1) return -1;
      var A = three[0], q = BL[A], li = -1, k;
      for (k = 0; k < 4; k++) if (!L[q[k]]) li = q[k];
      var bs = LB[li], B = -1;
      for (k = 0; k < bs.length; k++) if (bs[k] !== A) B = bs[k];
      if (B < 0 || sides(L, B) !== 2) return -1;
      var qb = BL[B], m = -1;
      for (k = 0; k < 4; k++) if (!L[qb[k]] && qb[k] !== li) m = qb[k];
      if (m < 0) return -1;
      var mb = LB[m];
      for (k = 0; k < mb.length; k++) if (mb[k] !== B && sides(L, mb[k]) >= 2) return -1; // цепочка длиннее двух
      var P = L.slice(); P[li] = 9; P[m] = 9;
      if (capLines(P).length || safeLines(P).length) return -1;
      var f;
      if (d === 3) { aborted = false; f = endVal(P, false); if (aborted) f = fval(comps(P)); }
      else f = fval(comps(P));
      return f < -2 ? m : -1;
    }

    /* ---------- ход ---------- */
    function mySide() { return api.net && api.net.side === 1 ? P2 : P1; }
    function human() { return api.mode === 1 || (api.mode === 0 && turn === P1) || (api.mode === 2 && turn === mySide()); }
    function play(l, remote) {
      if (over || l < 0 || l >= NL || lines[l]) return false;
      if (api.mode === 2 && !remote) api.net.send({ l: l });
      lines[l] = turn; lastL = l; anim[l] = 0; hover = -1;
      api.tone(turn === P1 ? 520 : 440, 0.05, 'triangle', 0.05);
      api.tone(1800 + Math.random() * 400, 0.03, 'sawtooth', 0.012);
      api.vibrate(8);
      var got = 0, bs = LB[l];
      for (var k = 0; k < bs.length; k++) if (sides(lines, bs[k]) === 4) {
        owner[bs[k]] = turn; got++; score[turn - 1]++; fills[bs[k]] = 0;
        var cx = ox + ((bs[k] % n) + 0.5) * sp, cy = oy + (((bs[k] / n) | 0) + 0.5) * sp;
        if (api.quality > 0) api.fx.burst(cx, cy, INK[turn][1], 8, 70, 1.6);
      }
      if (got) {
        streak++;
        api.sound(streak > 2 ? 'bonus' : 'coin');
        if (api.mode === 0 && turn === P1) api.addScore(10 * got * (api.diff + 1));
        var cx2 = ox + (((ends(l)[0] + ends(l)[2]) / 2) + 0.0) * sp, cy2 = oy + ((ends(l)[1] + ends(l)[3]) / 2) * sp;
        api.fx.text(cx2, cy2 - 10, '+' + got, INK[turn][1], 20);
      } else { turn = 3 - turn; streak = 0; }
      if (score[0] + score[1] >= NB) { finish(); return true; }
      if (api.mode === 0 && turn === P2) thinkT = got ? 0.32 : 0.55 + Math.random() * 0.3;
      return true;
    }
    function finish() {
      over = true; endT = 3;
      var a = score[0], b = score[1], me = api.mode === 2 ? mySide() : P1;
      result = a > b ? P1 : b > a ? P2 : 0;
      if (api.mode === 0) {
        if (result === P1) { api.addScore(500 * (api.diff + 1) + (a - b) * 20 * (api.diff + 1)); api.sound('win'); api.fx.confetti(80); }
        else if (!result) { api.addScore(150 * (api.diff + 1)); api.sound('point'); }
        else { api.sound('over'); api.vibrate(150); }
      } else {
        if (!result) api.sound('point');
        else if (api.mode === 2 && result !== me) { api.sound('over'); api.vibrate(150); }
        else { api.sound('win'); api.fx.confetti(60); }
      }
    }
    function newGame() {
      setup(api.mode === 2 ? 5 : [4, 5, 6, 7][api.diff] || 5);
      lines = []; for (var l = 0; l < NL; l++) lines.push(0);
      owner = []; for (var b = 0; b < NB; b++) owner.push(0);
      turn = P1; score = [0, 0]; over = false; endT = 0; thinkT = 0.6; anim = {}; fills = {}; hover = -1; lastL = -1; result = 0; streak = 0;
    }

    /* ---------- графика ---------- */
    var dpr = 1, bgL = null, hatch = {}, lw = 0, lh = 0, jit = [];
    var FONT = '"Comic Sans MS", "Chalkboard SE", "Segoe Print", "Marker Felt", cursive';
    function mkC(w, h) {
      var o = document.createElement('canvas');
      o.width = Math.max(1, Math.ceil(w * dpr)); o.height = Math.max(1, Math.ceil(h * dpr));
      var x = o.getContext('2d'); x.scale(dpr, dpr); return o;
    }
    function rr(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }
    function hash(v) { var x = Math.sin(v * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
    function layout() {
      var W = api.W, H = api.H;
      sp = Math.min((W - 64) / n, (H - 250) / n, 74);
      ox = (W - sp * n) / 2 + 6;
      oy = 128 + Math.max(0, (H - 128 - 84 - sp * n) / 2);
      jit = [];
      for (var l = 0; l < NL; l++) jit.push([(hash(l * 3.7) - 0.5) * sp * 0.08, (hash(l * 9.1) - 0.5) * 0.12, (hash(l * 1.9) - 0.5) * 0.1, 0.85 + hash(l * 5.3) * 0.3]);
      build();
    }
    function build() {
      var W = api.W, H = api.H, c, g, x, y, k;
      dpr = Math.min(2, window.devicePixelRatio || 1); lw = W; lh = H;
      bgL = mkC(W, H); c = bgL.getContext('2d');
      // стол
      g = c.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#6b4423'); g.addColorStop(1, '#3f2612');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // лист
      var px = 8, py = 6, pw = W - 16, ph = H - 12;
      c.save(); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 16; c.shadowOffsetY = 6;
      c.fillStyle = '#fbf8ee'; c.fillRect(px, py, pw, ph); c.restore();
      g = c.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, '#fffdf6'); g.addColorStop(1, '#efe6cc');
      c.fillStyle = g; c.fillRect(px, py, pw, ph);
      // клетка тетради, выровненная по точкам
      var step = sp / Math.max(1, Math.round(sp / 20));
      c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
      c.strokeStyle = 'rgba(96,150,220,.28)'; c.lineWidth = 1;
      c.beginPath();
      var sx = ox - Math.ceil((ox - px) / step) * step, sy = oy - Math.ceil((oy - py) / step) * step;
      for (x = sx; x < px + pw; x += step) { c.moveTo(Math.round(x) + 0.5, py); c.lineTo(Math.round(x) + 0.5, py + ph); }
      for (y = sy; y < py + ph; y += step) { c.moveTo(px, Math.round(y) + 0.5); c.lineTo(px + pw, Math.round(y) + 0.5); }
      c.stroke();
      // поля
      c.strokeStyle = 'rgba(220,38,38,.55)'; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(px + 26, py); c.lineTo(px + 26, py + ph); c.stroke();
      // пятнышки бумаги
      for (k = 0; k < 260; k++) { c.fillStyle = 'rgba(120,100,60,' + (0.03 + hash(k) * 0.05).toFixed(3) + ')'; c.fillRect(px + hash(k * 3.3) * pw, py + hash(k * 7.1) * ph, 1 + hash(k * 2) * 1.5, 1); }
      // след от кружки
      c.save(); c.translate(px + pw - 40, py + ph - 46);
      for (k = 0; k < 3; k++) { c.strokeStyle = 'rgba(150,100,40,' + (0.08 - k * 0.02) + ')'; c.lineWidth = 3 - k; c.beginPath(); c.arc(k, -k, 34 - k * 2, 0.3, 5.6); c.stroke(); }
      c.restore();
      c.restore();
      // дырки под кольца
      for (y = py + 40; y < py + ph - 20; y += 90) {
        c.fillStyle = '#4a2d14'; c.beginPath(); c.arc(px + 12, y, 6, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.stroke();
        c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(px + 12, y + 7, 6, 0.2, 2.9); c.fill();
      }
      // штриховка клеток
      [P1, P2].forEach(function (p) {
        var S = Math.ceil(sp), o = mkC(S, S), h = o.getContext('2d');
        h.fillStyle = INK[p][2] + '.10)'; h.fillRect(0, 0, S, S);
        h.strokeStyle = INK[p][2] + '.38)'; h.lineWidth = Math.max(1, S * 0.03); h.lineCap = 'round';
        var gap = Math.max(4, S / 9), dir = p === P1 ? 1 : -1;
        for (var u = -S; u < S * 2; u += gap) {
          h.beginPath();
          var a0 = u + hash(u + p) * 2, j = (hash(u * 2 + p) - 0.5) * 2;
          if (dir > 0) { h.moveTo(a0, S + 2); h.quadraticCurveTo(a0 + S / 2 + j, S / 2 + j, a0 + S + 2, -2); }
          else { h.moveTo(a0, -2); h.quadraticCurveTo(a0 + S / 2 + j, S / 2 - j, a0 + S + 2, S + 2); }
          h.stroke();
        }
        hatch[p] = o;
      });
    }
    function linePts(l) {
      var e = ends(l), j = jit[l] || [0, 0, 0, 1];
      var x0 = ox + e[0] * sp, y0 = oy + e[1] * sp, x1 = ox + e[2] * sp, y1 = oy + e[3] * sp;
      var hor = e[1] === e[3], inset = sp * 0.09;
      if (hor) { x0 += inset; x1 -= inset; y0 += j[1] * 6; y1 += j[2] * 6; } else { y0 += inset; y1 -= inset; x0 += j[1] * 6; x1 += j[2] * 6; }
      var mx = (x0 + x1) / 2 + (hor ? 0 : j[0]), my = (y0 + y1) / 2 + (hor ? j[0] : 0);
      return [x0, y0, mx, my, x1, y1, j[3]];
    }
    function strokeLine(c, l, who, prog, alpha, width) {
      var p = linePts(l);
      c.strokeStyle = INK[who][0]; c.globalAlpha = alpha; c.lineWidth = width * p[6]; c.lineCap = 'round';
      c.beginPath(); c.moveTo(p[0], p[1]);
      if (prog >= 1) c.quadraticCurveTo(p[2], p[3], p[4], p[5]);
      else {
        var steps = 10;
        for (var s = 1; s <= steps * prog; s++) {
          var u = s / steps, a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, d = u * u;
          c.lineTo(a * p[0] + b * p[2] + d * p[4], a * p[1] + b * p[3] + d * p[5]);
        }
      }
      c.stroke();
      // клякса в начале
      if (prog >= 1) { c.fillStyle = INK[who][0]; c.beginPath(); c.arc(p[0], p[1], width * 0.42, 0, 6.283); c.fill(); }
      c.globalAlpha = 1;
    }
    function nearestLine(x, y) {
      var best = -1, bd = sp * 0.42;
      for (var l = 0; l < NL; l++) {
        if (lines[l]) continue;
        var e = ends(l), x0 = ox + e[0] * sp, y0 = oy + e[1] * sp, x1 = ox + e[2] * sp, y1 = oy + e[3] * sp;
        var dx = x1 - x0, dy = y1 - y0, u = ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy);
        u = Math.max(0.1, Math.min(0.9, u));
        var qx = x0 + dx * u - x, qy = y0 + dy * u - y, dd = Math.sqrt(qx * qx + qy * qy);
        if (dd < bd) { bd = dd; best = l; }
      }
      return best;
    }
    function names() {
      return api.mode === 1 ? [api.t('g.p1'), api.t('g.p2')] : api.mode === 2 ? (mySide() === P1 ? [api.t('g.you'), api.t('net.opp')] : [api.t('net.opp'), api.t('g.you')]) : [api.t('g.you'), api.t('g.cpu')];
    }

    return {
      reset: function () { netQ = []; t = 0; newGame(); layout(); },
      resize: layout,
      netMsg: function (d) { netQ.push(d); },
      idle: function (dt) { t += dt; },
      input: function (type, d) {
        if (over || !human()) { hover = -1; return; }
        if (type === 'down' || type === 'move') { hover = nearestLine(d.x, d.y); return; }
        if (type === 'up') return;
        if (type !== 'tap') return;
        var l = nearestLine(d.x, d.y);
        if (l >= 0) play(l); else hover = -1;
      },
      key: function (k, down) {
        if (!down || over || !human()) return;
        if (k === 'a' || k === ' ') { if (hover >= 0 && !lines[hover]) play(hover); return; }
        var free = freeLines(lines); if (!free.length) return;
        var i = free.indexOf(hover);
        if (k === 'right' || k === 'down') hover = free[(i + 1) % free.length];
        else if (k === 'left' || k === 'up') hover = free[(i - 1 + free.length) % free.length];
      },
      update: function (dt) {
        t += dt;
        var k;
        for (k in anim) { anim[k] += dt * 6; if (anim[k] >= 1) delete anim[k]; }
        for (k in fills) { fills[k] += dt * 3.5; if (fills[k] >= 1) delete fills[k]; }
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (over) return;
        if (api.mode === 0 && turn === P2) { thinkT -= dt; if (thinkT <= 0) { var m = aiMove(); if (m >= 0) play(m); } }
        if (api.mode === 2 && turn !== mySide() && netQ.length) {
          var nd = netQ.shift();
          if (nd && typeof nd.l === 'number' && nd.l >= 0 && nd.l < NL && !lines[nd.l]) play(nd.l, true);
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H, q = api.quality, l, b, k;
        if (!bgL || lw !== W || lh !== H) layout();
        c.drawImage(bgL, 0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        var nm = names();
        // карточки-стикеры со счётом
        [[0, W * 0.27, -0.05, '#fde68a'], [1, W * 0.73, 0.05, '#fbcfe8']].forEach(function (z) {
          var p = z[0] + 1, act = !over && turn === p, win = over && result === p;
          var cw = Math.min(140, W * 0.4), ch = 86;
          c.save(); c.translate(z[1], 62 + (act ? -3 : 0)); c.rotate(z[2] * (act ? 0.5 : 1));
          c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-cw / 2 + 3, -ch / 2 + 5, cw, ch);
          c.fillStyle = z[3]; c.fillRect(-cw / 2, -ch / 2, cw, ch);
          var g = c.createLinearGradient(0, -ch / 2, 0, ch / 2);
          g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(0,0,0,.06)');
          c.fillStyle = g; c.fillRect(-cw / 2, -ch / 2, cw, ch);
          // скотч
          c.fillStyle = 'rgba(255,255,255,.55)'; c.save(); c.rotate(-z[2] * 2); c.fillRect(-22, -ch / 2 - 8, 44, 15); c.restore();
          c.fillStyle = INK[p][0]; c.font = '700 13px ' + FONT;
          c.fillText(nm[z[0]], 0, -ch / 2 + 20);
          c.font = '700 38px ' + FONT; c.fillText(String(score[z[0]]), 0, 12);
          if (act || win) {
            c.strokeStyle = INK[p][0]; c.lineWidth = 2.4; c.lineCap = 'round'; c.globalAlpha = act ? 0.6 + 0.4 * Math.sin(t * 5) : 1;
            c.beginPath(); c.moveTo(-cw * 0.32, 34); c.quadraticCurveTo(0, 30 + Math.sin(t * 3), cw * 0.32, 35); c.stroke();
            if (win) { c.beginPath(); c.ellipse(0, 10, 32, 24, -0.1, 0, 6.283); c.stroke(); }
            c.globalAlpha = 1;
          }
          c.restore();
        });
        // захваченные клетки
        for (b = 0; b < NB; b++) {
          if (!owner[b]) continue;
          var bx = ox + (b % n) * sp, by = oy + ((b / n) | 0) * sp, f = fills[b], s = 1, a = 1;
          if (f !== undefined) { s = 0.4 + 0.6 * (1 - (1 - f) * (1 - f)); a = f; }
          c.globalAlpha = a;
          var pad = sp * 0.07, w = (sp - pad * 2) * s;
          c.drawImage(hatch[owner[b]], bx + sp / 2 - w / 2, by + sp / 2 - w / 2, w, w);
          c.fillStyle = INK[owner[b]][0];
          c.font = '700 ' + Math.round(sp * 0.42 * (f !== undefined ? 1 + (1 - f) * 0.6 : 1)) + 'px ' + FONT;
          c.save(); c.translate(bx + sp / 2, by + sp / 2 + 1); c.rotate((hash(b) - 0.5) * 0.4);
          c.fillText(nm[owner[b] - 1].charAt(0).toUpperCase(), 0, 0); c.restore();
          c.globalAlpha = 1;
        }
        // подсказка — клетки с тремя сторонами
        if (!over && human() && q > 0) {
          for (b = 0; b < NB; b++) if (!owner[b] && sides(lines, b) === 3) {
            c.fillStyle = 'rgba(250,204,21,' + (0.12 + 0.1 * Math.sin(t * 6)) + ')';
            c.fillRect(ox + (b % n) * sp + sp * 0.12, oy + ((b / n) | 0) * sp + sp * 0.12, sp * 0.76, sp * 0.76);
          }
        }
        // линии
        var lwid = Math.max(3, sp * 0.075);
        for (l = 0; l < NL; l++) if (lines[l]) {
          var an = anim[l];
          strokeLine(c, l, lines[l], an === undefined ? 1 : 1 - (1 - an) * (1 - an), 0.92, lwid * (l === lastL ? 1.15 : 1));
        }
        // последняя линия — мягкое свечение
        if (lastL >= 0 && !over && q > 0) {
          c.save(); c.globalAlpha = 0.18 + 0.12 * Math.sin(t * 5);
          strokeLine(c, lastL, lines[lastL], 1, 0.25, lwid * 3);
          c.restore();
        }
        // предпросмотр
        if (hover >= 0 && !lines[hover] && !over && human()) {
          c.save(); c.setLineDash([sp * 0.08, sp * 0.07]);
          strokeLine(c, hover, turn, 1, 0.55 + 0.2 * Math.sin(t * 8), lwid * 0.85);
          c.restore();
        }
        // точки
        for (var r = 0; r <= n; r++) for (var cc = 0; cc <= n; cc++) {
          var dx = ox + cc * sp, dy = oy + r * sp, rad = Math.max(3.2, sp * 0.07);
          c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.arc(dx + 0.8, dy + 1.2, rad, 0, 6.283); c.fill();
          c.fillStyle = '#1f2430'; c.beginPath(); c.arc(dx, dy, rad, 0, 6.283); c.fill();
          c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(dx - rad * 0.3, dy - rad * 0.35, rad * 0.35, 0, 6.283); c.fill();
        }
        // статус
        var msg, two = api.mode === 1;
        if (over) {
          var me = api.mode === 2 ? mySide() : P1;
          msg = !result ? api.t('g.draw') : two ? api.t(result === P1 ? 'g.p1win' : 'g.p2win') : api.t(result === me ? 'g.win' : 'g.lose');
          msg += '  ' + score[0] + ' : ' + score[1];
        } else if (streak > 0 && human()) msg = api.t('dots.again');
        else if (api.mode === 2) msg = api.t(turn === mySide() ? 'g.yourTurn' : 'net.oppTurn');
        else msg = two ? api.t(turn === P1 ? 'g.p1turn' : 'g.p2turn') : api.t(turn === P1 ? 'g.yourTurn' : 'g.thinking');
        var sy = Math.min(H - 26, oy + n * sp + 44);
        c.font = '700 19px ' + FONT;
        var mw = c.measureText(msg).width;
        c.fillStyle = over ? '#374151' : INK[turn][0];
        c.fillText(msg, W / 2, sy);
        c.strokeStyle = over ? '#374151' : INK[turn][0]; c.lineWidth = 2; c.lineCap = 'round'; c.globalAlpha = 0.7;
        c.beginPath(); c.moveTo(W / 2 - mw / 2, sy + 14); c.quadraticCurveTo(W / 2, sy + 11 + Math.sin(t * 2) * 1.5, W / 2 + mw / 2, sy + 15); c.stroke();
        c.globalAlpha = 1;
        // карандаш у статуса
        if (!over) {
          c.save(); c.translate(W / 2 - mw / 2 - 26, sy + (api.mode === 0 && turn === P2 ? Math.sin(t * 12) * 2 : 0)); c.rotate(-0.7);
          c.fillStyle = INK[turn][0]; c.fillRect(-4, -18, 8, 26);
          c.fillStyle = '#f5d0a9'; c.beginPath(); c.moveTo(-4, 8); c.lineTo(4, 8); c.lineTo(0, 17); c.closePath(); c.fill();
          c.fillStyle = '#1f2937'; c.beginPath(); c.moveTo(-1.5, 13.5); c.lineTo(1.5, 13.5); c.lineTo(0, 17); c.closePath(); c.fill();
          c.fillStyle = '#f9a8d4'; c.fillRect(-4, -22, 8, 5);
          c.restore();
        }
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      },
      _t: function () { return { lines: lines, owner: owner, score: score, turn: turn, over: over, result: result, NL: NL, mid: function (l) { var e = ends(l); return [ox + (e[0] + e[2]) / 2 * sp, oy + (e[1] + e[3]) / 2 * sp]; } }; },
      _ai: { setup: function (sz) { setup(sz); }, move: function (L) { lines = L; return aiMove(); }, sides: function (L, b) { return sides(L, b); }, LB: function () { return LB; }, NL: function () { return NL; }, NB: function () { return NB; } }
    };
  }
};
