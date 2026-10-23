/* Гомоку (пять в ряд): против компьютера, вдвоём и по сети */
window.GAMES = window.GAMES || {};
window.GAMES.gomoku = {
  title: 'Гомоку',
  desc: 'Пять камней в ряд на доске го',
  hint: 'Ставь камни по очереди на пересечения линий. Первый, кто выстроит пять своих камней подряд по горизонтали, вертикали или диагонали, побеждает. Тап — примерка камня, второй тап туда же — ход. Чёрные ходят первыми.',
  d0: 'Доска 13×13, компьютер ошибается', d1: 'Доска 15×15, видит угрозы', d2: 'Ищет форсированные победы', d3: 'Думает на несколько ходов вперёд',
  colors: ['#b45309', '#1c1917'],
  controls: 'none',
  modes: true,
  lan: true,
  isNew4: true,
  cat: 'board',
  medals: [1800, 3500, 5000],
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="gmkw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3c77e"/><stop offset=".55" stop-color="#d9a04f"/><stop offset="1" stop-color="#a86b2a"/></linearGradient>' +
    '<linearGradient id="gmke" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5220"/><stop offset="1" stop-color="#4a2a0e"/></linearGradient>' +
    '<radialGradient id="gmkb" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#6b7280"/><stop offset=".45" stop-color="#1f2937"/><stop offset="1" stop-color="#030712"/></radialGradient>' +
    '<radialGradient id="gmkl" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#e7e5e4"/><stop offset="1" stop-color="#a8a29e"/></radialGradient>' +
    '<radialGradient id="gmkg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="rgba(255,236,150,.9)"/><stop offset="1" stop-color="rgba(255,236,150,0)"/></radialGradient></defs>' +
    '<rect x="7" y="12" width="86" height="84" rx="9" fill="url(#gmke)"/><rect x="7" y="6" width="86" height="84" rx="9" fill="url(#gmkw)"/>' +
    '<path d="M12 22q30 4 76-2M12 46q36-5 76 3M12 70q40 4 76-3" stroke="rgba(120,60,10,.22)" stroke-width="2" fill="none"/>' +
    '<path d="M18 17v62M34 17v62M50 17v62M66 17v62M82 17v62M18 17h64M18 32.5h64M18 48h64M18 63.5h64M18 79h64" stroke="#4a2a0e" stroke-width="1.3" opacity=".75"/>' +
    '<circle cx="34" cy="32.5" r="2" fill="#4a2a0e"/><circle cx="66" cy="63.5" r="2" fill="#4a2a0e"/>' +
    '<path d="M18 79L82 17" stroke="url(#gmkg)" stroke-width="16" stroke-linecap="round" opacity=".8"/>' +
    '<g fill="rgba(0,0,0,.35)"><circle cx="20" cy="82" r="7"/><circle cx="36" cy="66.5" r="7"/><circle cx="52" cy="51" r="7"/><circle cx="68" cy="35.5" r="7"/><circle cx="84" cy="20" r="7"/><circle cx="36" cy="35.5" r="7"/><circle cx="68" cy="66.5" r="7"/><circle cx="52" cy="82" r="7"/></g>' +
    '<g fill="url(#gmkb)"><circle cx="18" cy="79" r="7"/><circle cx="34" cy="63.5" r="7"/><circle cx="50" cy="48" r="7"/><circle cx="66" cy="32.5" r="7"/><circle cx="82" cy="17" r="7"/></g>' +
    '<g fill="url(#gmkl)"><circle cx="34" cy="32.5" r="7"/><circle cx="66" cy="63.5" r="7"/><circle cx="50" cy="79" r="7"/></g>' +
    '<circle cx="50" cy="48" r="2.2" fill="#ef4444"/></svg>',

  create: function (api) {
    var BL = 1, WH = 2;
    var N = 15, board, turn, moves, last, wline, over, endT, thinkT, netQ, t, anim, ghost, drag, result, myCnt;
    var cs, bx, by, gx, gy, mg;

    /* ---------- оценка линий: таблица по 8 соседям (0 пусто, 1 свой, 2 чужой/край) ---------- */
    var FIVE = 7, OPEN4 = 6, FOUR = 5, OPEN3 = 4, THREE = 3, OPEN2 = 2, TWO = 1;
    var TAB = null;
    function covers(s, p) { var i = -1; while ((i = s.indexOf(p, i + 1)) >= 0) if (i <= 4 && i + p.length > 4) return true; return false; }
    function anyCover(s, list) { for (var k = 0; k < list.length; k++) if (covers(s, list[k])) return true; return false; }
    var P_FOUR = ['11110', '01111', '11101', '11011', '10111'];
    var P_OPEN3 = ['011100', '001110', '011010', '010110'];
    var P_THREE = ['11100', '00111', '11010', '01011', '10110', '01101', '10011', '11001', '10101', '01110'];
    var P_OPEN2 = ['001100', '011000', '000110', '010100', '001010', '010010'];
    var P_TWO = ['11000', '00011', '10100', '00101', '01100', '00110', '10010', '01001', '10001'];
    function classify(s) {
      if (covers(s, '11111')) return FIVE;
      if (covers(s, '011110')) return OPEN4;
      if (anyCover(s, P_FOUR)) return FOUR;
      if (anyCover(s, P_OPEN3)) return OPEN3;
      if (anyCover(s, P_THREE)) return THREE;
      if (anyCover(s, P_OPEN2)) return OPEN2;
      if (anyCover(s, P_TWO)) return TWO;
      return 0;
    }
    function buildTab() {
      if (TAB) return;
      TAB = new Int8Array(6561);
      for (var code = 0; code < 6561; code++) {
        var s = '', x = code;
        for (var k = 0; k < 8; k++) { s += String(x % 3); x = Math.floor(x / 3); if (k === 3) s += '1'; }
        TAB[code] = classify(s);
      }
    }
    var DX = [1, 0, 1, 1], DY = [0, 1, 1, -1];
    var cnt = [0, 0, 0, 0, 0, 0, 0, 0];
    // оценка хода i для игрока who (камень ещё не поставлен)
    function moveScore(b, i, who) {
      var r = (i / N) | 0, c = i - r * N, d, k;
      cnt[1] = cnt[2] = cnt[3] = cnt[4] = cnt[5] = cnt[6] = cnt[7] = 0;
      for (d = 0; d < 4; d++) {
        var code = 0, mul = 1, dx = DX[d], dy = DY[d];
        for (k = -4; k <= 4; k++) {
          if (k === 0) continue;
          var rr = r + dy * k, cc = c + dx * k, v;
          if (rr < 0 || rr >= N || cc < 0 || cc >= N) v = 2;
          else { v = b[rr * N + cc]; v = v === 0 ? 0 : v === who ? 1 : 2; }
          code += v * mul; mul *= 3;
        }
        cnt[TAB[code]]++;
      }
      if (cnt[FIVE]) return 10000000;
      if (cnt[OPEN4] || cnt[FOUR] >= 2) return 1000000;
      if (cnt[FOUR] && cnt[OPEN3]) return 500000;
      if (cnt[OPEN3] >= 2) return 100000;
      var s = cnt[FOUR] * 4000 + cnt[OPEN3] * 2500 + cnt[THREE] * 300 + cnt[OPEN2] * 260 + cnt[TWO] * 40;
      if (cnt[OPEN3] && cnt[THREE]) s += 1500;
      if (cnt[FOUR] && cnt[THREE]) s += 1500;
      if (cnt[OPEN2] >= 2) s += 400;
      return s;
    }
    function cands(b) {
      var out = [], NN = N * N, i, r, c, rr, cc, any = false;
      var mark = new Uint8Array(NN);
      for (i = 0; i < NN; i++) {
        if (!b[i]) continue; any = true;
        r = (i / N) | 0; c = i - r * N;
        for (rr = Math.max(0, r - 2); rr <= Math.min(N - 1, r + 2); rr++)
          for (cc = Math.max(0, c - 2); cc <= Math.min(N - 1, c + 2); cc++) {
            var j = rr * N + cc;
            if (!b[j] && !mark[j]) { mark[j] = 1; out.push(j); }
          }
      }
      if (!any) out.push(((N / 2) | 0) * N + ((N / 2) | 0));
      return out;
    }
    function center(i) { var r = (i / N) | 0, c = i - r * N, h = (N - 1) / 2; return -(Math.abs(r - h) + Math.abs(c - h)); }
    function scored(b, who) {
      var list = cands(b), op = 3 - who, out = [];
      for (var k = 0; k < list.length; k++) {
        var i = list[k], a = moveScore(b, i, who), d = moveScore(b, i, op);
        out.push({ i: i, a: a, d: d, s: a * 1.1 + d + center(i) });
      }
      out.sort(function (x, y) { return y.s - x.s; });
      return out;
    }
    // ход-победа (пятёрка) для who
    function winCell(b, who) {
      var list = cands(b);
      for (var k = 0; k < list.length; k++) if (moveScore(b, list[k], who) >= 10000000) return list[k];
      return -1;
    }
    // VCF — победа непрерывными четвёрками
    var vNodes = 0, deadline = 0, aborted = false;
    function vcf(b, who, depth) {
      if (++vNodes > 6000 || Date.now() > deadline) { aborted = true; return -1; }
      var op = 3 - who, list = cands(b), k, i, s;
      for (k = 0; k < list.length; k++) if (moveScore(b, list[k], who) >= 10000000) return list[k];
      if (depth <= 0) return -1;
      if (winCell(b, op) >= 0) return -1; // у соперника своя четвёрка
      var fours = [];
      for (k = 0; k < list.length; k++) {
        i = list[k];
        b[i] = who; var w = winCell(b, who); b[i] = 0;
        if (w >= 0) fours.push(i);
      }
      for (k = 0; k < fours.length; k++) {
        i = fours[k]; b[i] = who;
        // все клетки, где получается пятёрка
        var wins = [], l2 = cands(b);
        for (var m = 0; m < l2.length; m++) if (moveScore(b, l2[m], who) >= 10000000) wins.push(l2[m]);
        if (wins.length >= 2) { b[i] = 0; return i; }
        var blk = wins[0];
        b[blk] = op;
        var res = moveScore(b, blk, op) >= 10000000 ? -1 : vcf(b, who, depth - 1);
        b[blk] = 0; b[i] = 0;
        if (res >= 0) return i;
        if (aborted) return -1;
      }
      return -1;
    }
    // негамакс с альфа-бета по кандидатам
    var WIN = 50000000, sNodes = 0;
    function leaf(list) {
      var A = 0, D = 0, sa = 0, sd = 0;
      for (var k = 0; k < list.length && k < 12; k++) {
        var e = list[k];
        if (e.a > A) A = e.a; if (e.d > D) D = e.d;
        sa += Math.min(e.a, 5000); sd += Math.min(e.d, 5000);
      }
      if (A >= 1000000) return 2000000;
      return A - D * 0.55 + (sa - sd) * 0.15;
    }
    function nega(b, depth, alpha, beta, who, K) {
      sNodes++;
      if ((sNodes & 63) === 0 && Date.now() > deadline) aborted = true;
      if (aborted) return 0;
      var list = scored(b, who);
      if (!list.length) return 0;
      for (var q = 0; q < list.length; q++) if (list[q].a >= 10000000) return WIN + depth;
      if (depth <= 0) return leaf(list);
      var forced = list.filter(function (e) { return e.d >= 10000000; });
      if (forced.length) list = forced.slice(0, 1);
      else {
        var opThreat = false, k;
        for (k = 0; k < list.length; k++) if (list[k].d >= 500000) { opThreat = true; break; }
        if (opThreat) list = list.filter(function (e) { return e.d >= 100000 || e.a >= 4000; });
      }
      var best = -Infinity, n = Math.min(K, list.length);
      for (var j = 0; j < n; j++) {
        var i = list[j].i;
        b[i] = who;
        var v = -nega(b, depth - 1, -beta, -alpha, 3 - who, K);
        b[i] = 0;
        if (aborted) return best === -Infinity ? 0 : best;
        if (v > best) best = v;
        if (best > alpha) alpha = best;
        if (alpha >= beta) break;
      }
      return best;
    }
    function rootSearch(b, who, list, depth, K) {
      var bestV = -Infinity, bestI = list[0].i, alpha = -Infinity;
      for (var j = 0; j < list.length; j++) {
        var i = list[j].i;
        b[i] = who;
        var v = -nega(b, depth - 1, -Infinity, -alpha, 3 - who, K);
        b[i] = 0;
        if (aborted) return null;
        if (v > bestV) { bestV = v; bestI = i; }
        if (v > alpha) alpha = v;
      }
      return { i: bestI, v: bestV };
    }
    function think(b, who, diff) {
      buildTab();
      var op = 3 - who, list = scored(b, who), k;
      if (!list.length) return -1;
      // 1. своя пятёрка
      for (k = 0; k < list.length; k++) if (list[k].a >= 10000000) return list[k].i;
      // 2. блок пятёрки соперника (лёгкий уровень иногда «зевает»)
      var block = -1;
      for (k = 0; k < list.length; k++) if (list[k].d >= 10000000) { block = list[k].i; break; }
      if (block >= 0 && !(diff === 0 && Math.random() < 0.15)) return block;
      if (diff === 0) {
        // жадный ход с шумом; открытую тройку соперника иногда не замечает
        var pool = list.slice(0, 6), bv = -Infinity, pick = list[0].i;
        for (k = 0; k < pool.length; k++) {
          var e = pool[k], dd = e.d;
          if (dd >= 100000 && dd < 10000000 && Math.random() < 0.4) dd = 2000;
          var v = e.a * 1.1 + dd * (0.4 + Math.random() * 0.4) + Math.random() * 1500;
          if (v > bv) { bv = v; pick = e.i; }
        }
        return pick;
      }
      if (list[0].a >= 1000000) return list[0].i; // открытая четвёрка / вилка
      if (diff === 1) {
        var top = list[0].s, opts = [];
        for (k = 0; k < list.length && k < 4; k++) if (list[k].s >= top * 0.9) opts.push(list[k].i);
        return opts[(Math.random() * opts.length) | 0];
      }
      var t0 = Date.now();
      deadline = t0 + (diff === 2 ? 70 : 130);
      // 3. своя победа четвёрками
      aborted = false; vNodes = 0;
      var w = vcf(b, who, diff === 2 ? 6 : 10);
      if (w >= 0) return w;
      // 4. поиск
      var oppHas4 = false;
      for (k = 0; k < list.length; k++) if (list[k].d >= 500000) { oppHas4 = true; break; }
      var rl = list;
      if (oppHas4) rl = list.filter(function (e) { return e.d >= 100000 || e.a >= 4000; });
      rl = rl.slice(0, diff === 2 ? 8 : 10);
      var best = { i: rl[0].i, v: 0 }, maxD = diff === 2 ? 2 : 6;
      for (var depth = 2; depth <= maxD; depth += 1) {
        aborted = false; sNodes = 0;
        var r = rootSearch(b, who, rl, depth, diff === 2 ? 7 : 9);
        if (!r) break;
        best = r;
        if (r.v >= WIN) break;
        // лучший ход — первым на следующей итерации
        for (k = 0; k < rl.length; k++) if (rl[k].i === r.i) { rl.unshift(rl.splice(k, 1)[0]); break; }
      }
      // 5. Безумный: не даём сопернику победу четвёрками
      if (diff === 3 && Date.now() < t0 + 125) {
        deadline = t0 + 140;
        var order = [best.i].concat(rl.map(function (e) { return e.i; }).filter(function (i) { return i !== best.i; }));
        for (k = 0; k < order.length && k < 6; k++) {
          b[order[k]] = who; aborted = false; vNodes = 0;
          var ov = vcf(b, op, 8);
          b[order[k]] = 0;
          if (ov < 0 || aborted) { return order[k]; }
          if (Date.now() > deadline) break;
        }
      }
      return best.i;
    }

    /* ---------- правила ---------- */
    function fiveAt(b, i) {
      var who = b[i], r = (i / N) | 0, c = i - r * N;
      for (var d = 0; d < 4; d++) {
        var cells = [i], k, rr, cc;
        for (k = 1; ; k++) { rr = r + DY[d] * k; cc = c + DX[d] * k; if (rr < 0 || rr >= N || cc < 0 || cc >= N || b[rr * N + cc] !== who) break; cells.push(rr * N + cc); }
        for (k = 1; ; k++) { rr = r - DY[d] * k; cc = c - DX[d] * k; if (rr < 0 || rr >= N || cc < 0 || cc >= N || b[rr * N + cc] !== who) break; cells.unshift(rr * N + cc); }
        if (cells.length >= 5) return cells;
      }
      return null;
    }
    function mySide() { return api.net && api.net.side === 1 ? WH : BL; }
    function human() { return api.mode === 1 || (api.mode === 0 && turn === BL) || (api.mode === 2 && turn === mySide()); }
    function place(i, remote) {
      if (over || i < 0 || i >= N * N || board[i]) return false;
      if (api.mode === 2 && !remote) api.net.send({ i: i });
      board[i] = turn; moves++; last = i; ghost = -1;
      if (turn === BL) myCnt++;
      anim[i] = 0;
      api.sound('click'); api.tone(turn === BL ? 520 : 600, 0.04, 'square', 0.04); api.vibrate(12);
      var w = fiveAt(board, i);
      if (w) { finish(turn, w); return true; }
      if (moves >= N * N) { finish(0, null); return true; }
      turn = 3 - turn;
      if (api.mode === 0 && turn === WH) thinkT = 0.35 + Math.random() * 0.25;
      return true;
    }
    function finish(winner, cells) {
      over = true; wline = cells; result = winner; endT = 3.2;
      var me = api.mode === 2 ? mySide() : BL;
      if (api.mode === 0) {
        if (winner === BL) {
          api.addScore(1000 * (api.diff + 1) + Math.max(0, 50 - myCnt) * 15 * (api.diff + 1));
          api.sound('win'); api.fx.confetti(80);
        } else if (!winner) { api.addScore(300 * (api.diff + 1)); api.sound('point'); }
        else { api.addScore(Math.min(400, myCnt * 8)); api.sound('over'); api.vibrate(150); }
      } else {
        if (!winner) api.sound('point');
        else if (api.mode === 2 && winner !== me) { api.sound('over'); api.vibrate(150); }
        else { api.sound('win'); api.fx.confetti(60); }
      }
      if (cells && api.quality > 0) {
        for (var k = 0; k < cells.length; k++) {
          var p = pos(cells[k]);
          api.fx.burst(p[0], p[1], winner === BL ? '#fde68a' : '#fff7d6', 6, 70, 1.4);
        }
      }
    }
    function newGame() {
      N = (api.mode === 0 && api.diff === 0) ? 13 : 15;
      board = []; for (var i = 0; i < N * N; i++) board.push(0);
      turn = BL; moves = 0; last = -1; wline = null; over = false; endT = 0; thinkT = 0; anim = {}; ghost = -1; drag = false; result = 0; myCnt = 0;
    }

    /* ---------- графика ---------- */
    var dpr = 1, bgL = null, boardL = null, spr = {}, shS = null, glowS = null, lw = 0, lh = 0;
    function mkC(w, h) {
      var o = document.createElement('canvas');
      o.width = Math.max(1, Math.ceil(w * dpr)); o.height = Math.max(1, Math.ceil(h * dpr));
      var x = o.getContext('2d'); x.scale(dpr, dpr); return o;
    }
    function rr(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }
    function pos(i) { var r = (i / N) | 0, c = i - r * N; return [gx + c * cs, gy + r * cs]; }
    function layout() {
      var W = api.W, H = api.H;
      var S = Math.min(W - 16, H - 200);
      cs = S / (N - 1 + 2);
      mg = cs;
      var bw = cs * (N - 1) + mg * 2;
      bx = (W - bw) / 2;
      by = 104 + Math.max(0, (H - 104 - 70 - bw) * 0.35);
      gx = bx + mg; gy = by + mg;
      build();
    }
    function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
    function makeStone(v, S) {
      var o = mkC(S, S), c = o.getContext('2d'), m = S / 2, r = S * 0.46, g;
      if (v === BL) {
        g = c.createRadialGradient(m - r * 0.35, m - r * 0.42, r * 0.05, m, m, r);
        g.addColorStop(0, '#6b7280'); g.addColorStop(0.35, '#27272a'); g.addColorStop(1, '#050505');
        c.fillStyle = g; c.beginPath(); c.arc(m, m, r, 0, 6.283); c.fill();
        g = c.createRadialGradient(m + r * 0.3, m + r * 0.45, 0, m + r * 0.3, m + r * 0.45, r * 0.6);
        g.addColorStop(0, 'rgba(120,130,150,.25)'); g.addColorStop(1, 'rgba(120,130,150,0)');
        c.fillStyle = g; c.beginPath(); c.arc(m, m, r, 0, 6.283); c.fill();
      } else {
        g = c.createRadialGradient(m - r * 0.35, m - r * 0.42, r * 0.05, m, m, r);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, '#f1efe9'); g.addColorStop(1, '#b8b2a7');
        c.fillStyle = g; c.beginPath(); c.arc(m, m, r, 0, 6.283); c.fill();
        // прожилки ракушки
        c.save(); c.beginPath(); c.arc(m, m, r, 0, 6.283); c.clip();
        c.strokeStyle = 'rgba(160,150,130,.13)'; c.lineWidth = Math.max(0.6, S * 0.012);
        for (var k = -4; k <= 4; k++) { c.beginPath(); c.ellipse(m + r * 0.1, m + r * 1.3, r * (1.2 + k * 0.12), r * (0.9 + k * 0.1), 0, 3.6, 5.8); c.stroke(); }
        c.restore();
        c.strokeStyle = 'rgba(90,80,60,.25)'; c.lineWidth = Math.max(0.6, S * 0.01); c.beginPath(); c.arc(m, m, r - 0.5, 0, 6.283); c.stroke();
      }
      // блик
      c.save(); c.translate(m - r * 0.36, m - r * 0.44); c.rotate(-0.6); c.scale(1, 0.55);
      g = c.createRadialGradient(0, 0, 0, 0, 0, r * 0.42);
      g.addColorStop(0, v === BL ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * 0.42, 0, 6.283); c.fill(); c.restore();
      return o;
    }
    function build() {
      var W = api.W, H = api.H, i, k, g, c;
      dpr = Math.min(2, window.devicePixelRatio || 1); lw = W; lh = H;
      var bw = cs * (N - 1) + mg * 2, th = Math.max(6, cs * 0.35);
      // фон: тёмное дерево/татами
      bgL = mkC(W, H); c = bgL.getContext('2d');
      g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#2b1d14'); g.addColorStop(0.5, '#3a2718'); g.addColorStop(1, '#1a110b');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // татами: соломенные полосы
      for (var y = 0; y < H; y += 3) {
        c.fillStyle = 'rgba(255,220,150,' + (0.012 + hash(y) * 0.025).toFixed(3) + ')';
        c.fillRect(0, y, W, 1.5);
      }
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(0, H * 0.33); c.lineTo(W, H * 0.33); c.moveTo(W * 0.5, H * 0.33); c.lineTo(W * 0.5, H); c.stroke();
      c.strokeStyle = 'rgba(255,220,150,.06)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(0, H * 0.33 + 2); c.lineTo(W, H * 0.33 + 2); c.stroke();
      g = c.createRadialGradient(W / 2, by + bw / 2, bw * 0.3, W / 2, by + bw / 2, Math.max(W, H) * 0.8);
      g.addColorStop(0, 'rgba(255,190,110,.18)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // тень доски
      c.save(); c.shadowColor = 'rgba(0,0,0,.7)'; c.shadowBlur = 30; c.shadowOffsetY = 16;
      c.fillStyle = '#2a1608'; rr(c, bx, by + th, bw, bw, 6); c.fill(); c.restore();

      // доска
      boardL = mkC(W, H); c = boardL.getContext('2d');
      // торец (толщина)
      g = c.createLinearGradient(0, by + bw - 4, 0, by + bw + th);
      g.addColorStop(0, '#9a5f25'); g.addColorStop(1, '#5a3410');
      c.fillStyle = g; rr(c, bx, by + 6, bw, bw + th - 6, 7); c.fill();
      for (k = 0; k < 6; k++) { c.fillStyle = 'rgba(60,30,8,.25)'; c.fillRect(bx + 4, by + bw + th * (0.25 + k * 0.12), bw - 8, 1); }
      // верх
      c.save(); rr(c, bx, by, bw, bw, 6); c.clip();
      g = c.createLinearGradient(bx, by, bx + bw, by + bw);
      g.addColorStop(0, '#f2c27a'); g.addColorStop(0.5, '#dfa65a'); g.addColorStop(1, '#c58841');
      c.fillStyle = g; c.fillRect(bx, by, bw, bw);
      // волокна
      var seed = 1;
      for (k = 0; k < 70; k++) {
        var yy = by + hash(k * 3.1) * bw, amp = 2 + hash(k * 7.7) * 6, fr = 0.01 + hash(k * 1.3) * 0.02;
        c.strokeStyle = hash(k * 5.3) < 0.5 ? 'rgba(130,70,20,' + (0.06 + hash(k) * 0.12).toFixed(3) + ')' : 'rgba(255,235,190,' + (0.05 + hash(k) * 0.08).toFixed(3) + ')';
        c.lineWidth = 0.6 + hash(k * 2.2) * 1.6;
        c.beginPath();
        for (var x = bx - 4; x <= bx + bw + 4; x += 6) {
          var yv = yy + Math.sin((x + k * 37) * fr) * amp + Math.sin((x - k * 11) * fr * 2.7) * amp * 0.3;
          if (x === bx - 4) c.moveTo(x, yv); else c.lineTo(x, yv);
        }
        c.stroke();
      }
      // сучок
      c.save(); c.translate(bx + bw * 0.78, by + bw * 0.22); c.scale(1.8, 0.7);
      for (k = 6; k > 0; k--) { c.strokeStyle = 'rgba(120,60,15,' + (0.05 + k * 0.015) + ')'; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, k * 3.2, 0, 6.283); c.stroke(); }
      c.restore();
      // блик лака
      g = c.createLinearGradient(bx, by, bx + bw * 0.6, by + bw * 0.6);
      g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(0.5, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(bx, by, bw, bw);
      c.restore();
      // фаска
      c.strokeStyle = 'rgba(255,240,200,.55)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(bx + 2, by + bw - 6); c.lineTo(bx + 2, by + 6); c.quadraticCurveTo(bx + 2, by + 2, bx + 6, by + 2); c.lineTo(bx + bw - 6, by + 2); c.stroke();
      c.strokeStyle = 'rgba(80,40,10,.5)'; c.beginPath(); c.moveTo(bx + bw - 1, by + 6); c.lineTo(bx + bw - 1, by + bw - 1); c.lineTo(bx + 6, by + bw - 1); c.stroke();
      // сетка
      c.strokeStyle = 'rgba(40,20,5,.78)'; c.lineWidth = Math.max(0.8, cs * 0.04);
      c.beginPath();
      for (k = 0; k < N; k++) {
        c.moveTo(gx, gy + k * cs); c.lineTo(gx + (N - 1) * cs, gy + k * cs);
        c.moveTo(gx + k * cs, gy); c.lineTo(gx + k * cs, gy + (N - 1) * cs);
      }
      c.stroke();
      c.lineWidth = Math.max(1.4, cs * 0.08); c.strokeRect(gx, gy, (N - 1) * cs, (N - 1) * cs);
      // звёздочки
      var st = N === 15 ? [3, 7, 11] : [3, 6, 9];
      c.fillStyle = 'rgba(40,20,5,.9)';
      for (i = 0; i < 3; i++) for (k = 0; k < 3; k++) {
        if ((i === 1) !== (k === 1)) continue;
        c.beginPath(); c.arc(gx + st[i] * cs, gy + st[k] * cs, Math.max(2, cs * 0.12), 0, 6.283); c.fill();
      }
      // координаты
      var fs = Math.max(7, Math.min(11, mg * 0.4));
      c.font = '700 ' + fs + 'px system-ui, sans-serif'; c.fillStyle = 'rgba(70,35,8,.55)'; c.textAlign = 'center'; c.textBaseline = 'middle';
      var L = 'ABCDEFGHJKLMNOP';
      for (k = 0; k < N; k++) {
        c.fillText(L[k], gx + k * cs, by + mg * 0.27);
        c.fillText(String(N - k), bx + mg * 0.27, gy + k * cs);
      }
      // спрайты
      var S = Math.ceil(cs);
      spr[BL] = makeStone(BL, S); spr[WH] = makeStone(WH, S);
      shS = mkC(S * 1.4, S * 1.4); c = shS.getContext('2d');
      g = c.createRadialGradient(S * 0.7, S * 0.7, S * 0.2, S * 0.7, S * 0.7, S * 0.62);
      g.addColorStop(0, 'rgba(30,12,0,.55)'); g.addColorStop(1, 'rgba(30,12,0,0)');
      c.fillStyle = g; c.fillRect(0, 0, S * 1.4, S * 1.4);
      glowS = mkC(S * 2, S * 2); c = glowS.getContext('2d');
      g = c.createRadialGradient(S, S, 0, S, S, S);
      g.addColorStop(0, 'rgba(255,240,170,.95)'); g.addColorStop(0.4, 'rgba(255,200,90,.4)'); g.addColorStop(1, 'rgba(255,200,90,0)');
      c.fillStyle = g; c.fillRect(0, 0, S * 2, S * 2);
    }
    function stone(c, x, y, s, v, a) {
      if (!spr[v]) return;
      if (a !== undefined) c.globalAlpha = a;
      c.drawImage(spr[v], x - s / 2, y - s / 2, s, s);
      if (a !== undefined) c.globalAlpha = 1;
    }
    function cellAt(x, y) {
      var c = Math.round((x - gx) / cs), r = Math.round((y - gy) / cs);
      if (c < 0 || r < 0 || c >= N || r >= N) return -1;
      if (Math.abs(x - (gx + c * cs)) > cs * 0.75 || Math.abs(y - (gy + r * cs)) > cs * 0.75) return -1;
      return r * N + c;
    }
    function names() {
      return api.mode === 1 ? [api.t('g.p1'), api.t('g.p2')] : api.mode === 2 ? (mySide() === BL ? [api.t('g.you'), api.t('net.opp')] : [api.t('net.opp'), api.t('g.you')]) : [api.t('g.you'), api.t('g.cpu')];
    }

    return {
      reset: function () {
        netQ = []; t = 0;
        newGame(); buildTab(); layout();
      },
      resize: layout,
      netMsg: function (d) { netQ.push(d); },
      idle: function (dt) { t += dt; },
      input: function (type, d) {
        if (over || !human()) return;
        var i;
        if (type === 'down') { drag = false; return; }
        if (type === 'move') {
          i = cellAt(d.x, d.y);
          if (i >= 0 && !board[i] && i !== ghost) { ghost = i; drag = true; api.tone(900, 0.015, 'sine', 0.02); }
          return;
        }
        if (type !== 'tap') return;
        i = cellAt(d.x, d.y);
        if (i < 0) { ghost = -1; return; }
        if (board[i]) { api.tone(150, 0.06, 'square', 0.03); return; }
        if (i === ghost) place(i);
        else { ghost = i; api.tone(880, 0.03, 'sine', 0.04); }
      },
      key: function (k, down) {
        if (!down || over || !human()) return;
        var h = (N / 2) | 0;
        if (ghost < 0) ghost = h * N + h;
        var r = (ghost / N) | 0, c = ghost % N;
        if (k === 'left') c = Math.max(0, c - 1); else if (k === 'right') c = Math.min(N - 1, c + 1);
        else if (k === 'up') r = Math.max(0, r - 1); else if (k === 'down') r = Math.min(N - 1, r + 1);
        else if (k === 'a' || k === ' ') { if (!board[ghost]) place(ghost); return; }
        ghost = r * N + c;
      },
      update: function (dt) {
        t += dt;
        for (var k in anim) { anim[k] += dt * 5; if (anim[k] >= 1) delete anim[k]; }
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (over) return;
        if (api.mode === 0 && turn === WH) {
          thinkT -= dt;
          if (thinkT <= 0) { var m = think(board.slice(), WH, api.diff); if (m >= 0 && !board[m]) place(m); }
        }
        if (api.mode === 2 && turn !== mySide() && netQ.length) {
          var nd = netQ.shift();
          if (nd && typeof nd.i === 'number' && nd.i >= 0 && nd.i < N * N && !board[nd.i]) place(nd.i, true);
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H, q = api.quality, i, p, k;
        if (!bgL || lw !== W || lh !== H) layout();
        c.drawImage(bgL, 0, 0, W, H);
        c.drawImage(boardL, 0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        // табло
        var nm = names(), cntS = [0, 0];
        for (i = 0; i < N * N; i++) if (board[i]) cntS[board[i] - 1]++;
        [[0, W * 0.25], [1, W * 0.75]].forEach(function (z) {
          var v = z[0] + 1, act = !over && turn === v, pw = Math.min(150, W * 0.44), px = z[1] - pw / 2;
          var win = over && result === v;
          c.fillStyle = act || win ? 'rgba(255,214,150,.16)' : 'rgba(255,255,255,.06)'; rr(c, px, 14, pw, 74, 16); c.fill();
          if (act || win) {
            c.strokeStyle = win ? '#fde68a' : '#f59e0b'; c.globalAlpha = 0.35 + 0.25 * Math.sin(t * 5); c.lineWidth = 6; c.stroke();
            c.globalAlpha = 1; c.lineWidth = 2; c.stroke();
          } else { c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 1; c.stroke(); }
          // чаша с камнями
          var cx = px + 30, cy = 46;
          c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(cx, cy + 14, 19, 5, 0, 0, 6.283); c.fill();
          var bg = c.createLinearGradient(cx - 20, 0, cx + 20, 0);
          bg.addColorStop(0, '#5a3410'); bg.addColorStop(0.45, '#b7793a'); bg.addColorStop(1, '#4a2a0e');
          c.fillStyle = bg; c.beginPath(); c.ellipse(cx, cy, 20, 8, 0, 0, 3.1416); c.lineTo(cx - 20, cy); c.fill();
          c.beginPath(); c.moveTo(cx - 20, cy); c.quadraticCurveTo(cx - 19, cy + 16, cx, cy + 16); c.quadraticCurveTo(cx + 19, cy + 16, cx + 20, cy); c.fill();
          c.fillStyle = '#2a1608'; c.beginPath(); c.ellipse(cx, cy, 18, 6, 0, 0, 6.283); c.fill();
          stone(c, cx - 7, cy - 2, 13, v); stone(c, cx + 6, cy - 1, 13, v); stone(c, cx, cy - 6 + (act ? Math.sin(t * 4) * 1.5 : 0), 14, v);
          c.fillStyle = act || win ? '#fff' : 'rgba(255,255,255,.65)'; c.font = '800 11px system-ui, sans-serif';
          c.fillText(nm[z[0]].toUpperCase(), px + pw * 0.66, 34);
          c.font = '900 24px system-ui, sans-serif'; c.fillStyle = 'rgba(0,0,0,.35)'; c.fillText(String(cntS[z[0]]), px + pw * 0.66 + 1, 60);
          c.fillStyle = '#fff'; c.fillText(String(cntS[z[0]]), px + pw * 0.66, 58);
          c.font = '700 9px system-ui, sans-serif'; c.fillStyle = 'rgba(255,255,255,.45)'; c.fillText(api.t('gomoku.stones'), px + pw * 0.66, 77);
        });
        // направляющие и призрак
        if (ghost >= 0 && !over && human() && !board[ghost]) {
          p = pos(ghost);
          c.strokeStyle = 'rgba(255,250,220,.35)'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(gx, p[1]); c.lineTo(gx + (N - 1) * cs, p[1]); c.moveTo(p[0], gy); c.lineTo(p[0], gy + (N - 1) * cs); c.stroke();
          stone(c, p[0], p[1], cs * (0.95 + Math.sin(t * 6) * 0.03), turn, 0.55);
          c.strokeStyle = turn === BL ? 'rgba(0,0,0,.6)' : 'rgba(255,255,255,.85)'; c.lineWidth = 1.5;
          c.beginPath(); c.arc(p[0], p[1], cs * 0.55, 0, 6.283); c.stroke();
        }
        // тени
        var sh = cs * 1.4;
        for (i = 0; i < N * N; i++) if (board[i]) {
          p = pos(i); var a = anim[i], lift = a !== undefined ? (1 - a) * cs * 0.35 : 0;
          c.drawImage(shS, p[0] - sh / 2 + cs * 0.08 + lift * 0.6, p[1] - sh / 2 + cs * 0.12 + lift, sh, sh);
        }
        // камни
        for (i = 0; i < N * N; i++) if (board[i]) {
          p = pos(i); var an = anim[i], sc = 1, dy = 0;
          if (an !== undefined) { var e = 1 - an; sc = 1 + e * e * 0.35; dy = -e * e * cs * 0.3; }
          stone(c, p[0], p[1] + dy, cs * 0.98 * sc, board[i]);
        }
        // последний ход
        if (last >= 0 && !over) {
          p = pos(last);
          c.fillStyle = '#ef4444'; c.beginPath(); c.arc(p[0], p[1], Math.max(2.5, cs * 0.13), 0, 6.283); c.fill();
          c.strokeStyle = board[last] === BL ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.stroke();
        }
        // выигрышная линия
        if (wline) {
          var pulse = 0.5 + 0.5 * Math.sin(t * 6), p0 = pos(wline[0]), p1 = pos(wline[wline.length - 1]);
          c.save();
          if (q > 0) {
            c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + 0.35 * pulse;
            for (k = 0; k < wline.length; k++) { p = pos(wline[k]); c.drawImage(glowS, p[0] - cs, p[1] - cs, cs * 2, cs * 2); }
            c.globalCompositeOperation = 'source-over';
          }
          c.globalAlpha = 1; c.lineCap = 'round';
          c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = cs * 0.22; c.beginPath(); c.moveTo(p0[0], p0[1] + 2); c.lineTo(p1[0], p1[1] + 2); c.stroke();
          c.strokeStyle = '#f59e0b'; c.globalAlpha = 0.7 + 0.3 * pulse; c.lineWidth = cs * 0.14; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke();
          c.strokeStyle = '#fff7d6'; c.lineWidth = cs * 0.05; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke();
          c.globalAlpha = 1;
          for (k = 0; k < wline.length; k++) {
            p = pos(wline[k]); c.strokeStyle = '#fde68a'; c.globalAlpha = 0.5 + 0.5 * pulse; c.lineWidth = 2;
            c.beginPath(); c.arc(p[0], p[1], cs * 0.52, 0, 6.283); c.stroke();
          }
          c.restore();
        }
        // статус
        var msg, two = api.mode === 1;
        if (over) {
          var me = api.mode === 2 ? mySide() : BL;
          msg = !result ? api.t('g.draw') : two ? api.t(result === BL ? 'g.p1win' : 'g.p2win') : api.t(result === me ? 'g.win' : 'g.lose');
        } else if (human() && ghost >= 0 && !board[ghost]) msg = api.t('gomoku.confirm');
        else if (api.mode === 2) msg = api.t(turn === mySide() ? 'g.yourTurn' : 'net.oppTurn');
        else msg = two ? api.t(turn === BL ? 'g.p1turn' : 'g.p2turn') : api.t(turn === BL ? 'g.yourTurn' : 'g.thinking');
        var bw = cs * (N - 1) + mg * 2, sy = Math.min(H - 22, by + bw + Math.max(6, cs * 0.35) + 30);
        c.font = '800 15px system-ui, sans-serif';
        var mw = c.measureText(msg).width + (over ? 40 : 54);
        c.fillStyle = 'rgba(20,10,4,.72)'; rr(c, W / 2 - mw / 2, sy - 17, mw, 34, 17); c.fill();
        c.strokeStyle = over ? 'rgba(253,230,138,.6)' : 'rgba(245,158,11,.55)'; c.lineWidth = 1.5; c.stroke();
        if (!over) stone(c, W / 2 - mw / 2 + 18, sy, 20, turn);
        if (!over && api.mode === 0 && turn === WH) {
          for (k = 0; k < 3; k++) { c.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.7 * Math.max(0, Math.sin(t * 6 - k))) + ')'; c.beginPath(); c.arc(W / 2 + mw / 2 - 26 + k * 7, sy + 1, 2, 0, 6.283); c.fill(); }
        }
        c.fillStyle = '#fff'; c.fillText(msg, W / 2 + (over ? 0 : 8), sy + 1);
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      },
      _t: function () { return { board: board, turn: turn, over: over, result: result, pos: pos, N: N }; },
      _ai: { think: function (b, who, diff, n) { N = n; buildTab(); return think(b, who, diff); }, five: function (b, i, n) { N = n; return fiveAt(b, i); } }
    };
  }
};
