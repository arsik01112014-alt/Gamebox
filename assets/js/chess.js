/* Шахматы */
window.GAMES = window.GAMES || {};

/* ---------- движок: генерация ходов и поиск (без привязки к отрисовке) ---------- */
window.ChessCore = (function () {
  var VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  var PST = {
    p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
    n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
    b: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
    r: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
    q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
    k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20]
  };
  var KN = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  var KG = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  var DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]], ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  function isW(p) { return p && p === p.toUpperCase(); }
  function colorOf(p) { return !p ? null : isW(p) ? 'w' : 'b'; }

  function Pos() {
    this.b = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r', 'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'];
    for (var i = 0; i < 32; i++) this.b.push('');
    this.b = this.b.concat(['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']);
    this.side = 'w'; this.cr = { K: 1, Q: 1, k: 1, q: 1 }; this.ep = -1; this.half = 0;
  }
  Pos.prototype.fromFEN = function (fen) {
    var parts = fen.split(' '), rows = parts[0].split('/'), b = [];
    rows.forEach(function (r) { for (var i = 0; i < r.length; i++) { var ch = r[i]; if (/\d/.test(ch)) for (var k = 0; k < +ch; k++) b.push(''); else b.push(ch); } });
    this.b = b; this.side = parts[1];
    this.cr = { K: 0, Q: 0, k: 0, q: 0 };
    if (parts[2] !== '-') for (var j = 0; j < parts[2].length; j++) this.cr[parts[2][j]] = 1;
    this.ep = parts[3] === '-' ? -1 : (8 - +parts[3][1]) * 8 + parts[3].charCodeAt(0) - 97;
    this.half = +(parts[4] || 0);
    return this;
  };
  Pos.prototype.attacked = function (sq, by) {
    var b = this.b, r = sq >> 3, c = sq & 7, i, rr, cc, p;
    var pr = by === 'w' ? r + 1 : r - 1, pawn = by === 'w' ? 'P' : 'p';
    if (pr >= 0 && pr < 8) { if (c > 0 && b[pr * 8 + c - 1] === pawn) return true; if (c < 7 && b[pr * 8 + c + 1] === pawn) return true; }
    var kn = by === 'w' ? 'N' : 'n', kg = by === 'w' ? 'K' : 'k';
    for (i = 0; i < 8; i++) {
      rr = r + KN[i][0]; cc = c + KN[i][1];
      if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === kn) return true;
      rr = r + KG[i][0]; cc = c + KG[i][1];
      if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === kg) return true;
    }
    var bq = by === 'w' ? 'BQ' : 'bq', rq = by === 'w' ? 'RQ' : 'rq';
    for (i = 0; i < 4; i++) {
      rr = r + DIAG[i][0]; cc = c + DIAG[i][1];
      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { p = b[rr * 8 + cc]; if (p) { if (bq.indexOf(p) >= 0) return true; break; } rr += DIAG[i][0]; cc += DIAG[i][1]; }
      rr = r + ORTH[i][0]; cc = c + ORTH[i][1];
      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { p = b[rr * 8 + cc]; if (p) { if (rq.indexOf(p) >= 0) return true; break; } rr += ORTH[i][0]; cc += ORTH[i][1]; }
    }
    return false;
  };
  Pos.prototype.kingSq = function (side) { var k = side === 'w' ? 'K' : 'k'; return this.b.indexOf(k); };
  Pos.prototype.inCheck = function (side) { return this.attacked(this.kingSq(side), side === 'w' ? 'b' : 'w'); };
  Pos.prototype.pseudo = function (capsOnly) {
    var b = this.b, side = this.side, out = [], self = this;
    function add(f, t, extra) {
      var m = { f: f, t: t, p: b[f], cap: b[t] };
      if (extra) for (var k in extra) m[k] = extra[k];
      out.push(m);
    }
    for (var sq = 0; sq < 64; sq++) {
      var p = b[sq];
      if (!p || colorOf(p) !== side) continue;
      var r = sq >> 3, c = sq & 7, t = p.toLowerCase(), i, rr, cc, to;
      if (t === 'p') {
        var dir = side === 'w' ? -1 : 1, startR = side === 'w' ? 6 : 1, promR = side === 'w' ? 0 : 7;
        rr = r + dir;
        if (rr >= 0 && rr < 8) {
          to = rr * 8 + c;
          if (!b[to] && (!capsOnly || rr === promR)) {
            if (rr === promR) ['q', 'r', 'b', 'n'].forEach(function (pp) { add(sq, to, { promo: side === 'w' ? pp.toUpperCase() : pp }); });
            else {
              add(sq, to);
              if (r === startR && !b[(r + 2 * dir) * 8 + c]) add(sq, (r + 2 * dir) * 8 + c, { dbl: 1 });
            }
          }
          for (var dc = -1; dc <= 1; dc += 2) {
            cc = c + dc; if (cc < 0 || cc > 7) continue;
            to = rr * 8 + cc;
            if (b[to] && colorOf(b[to]) !== side) {
              if (rr === promR) ['q', 'r', 'b', 'n'].forEach(function (pp) { add(sq, to, { promo: side === 'w' ? pp.toUpperCase() : pp }); });
              else add(sq, to);
            } else if (to === self.ep) add(sq, to, { ep: 1, cap: side === 'w' ? 'p' : 'P' });
          }
        }
      } else if (t === 'n' || t === 'k') {
        var offs = t === 'n' ? KN : KG;
        for (i = 0; i < 8; i++) {
          rr = r + offs[i][0]; cc = c + offs[i][1];
          if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
          to = rr * 8 + cc;
          if (b[to] && colorOf(b[to]) === side) continue;
          if (capsOnly && !b[to]) continue;
          add(sq, to);
        }
        if (t === 'k' && !capsOnly) {
          var opp = side === 'w' ? 'b' : 'w', home = side === 'w' ? 60 : 4;
          if (sq === home && !this.attacked(home, opp)) {
            if (this.cr[side === 'w' ? 'K' : 'k'] && !b[home + 1] && !b[home + 2] && b[home + 3] === (side === 'w' ? 'R' : 'r') && !this.attacked(home + 1, opp) && !this.attacked(home + 2, opp)) add(sq, home + 2, { castle: 1 });
            if (this.cr[side === 'w' ? 'Q' : 'q'] && !b[home - 1] && !b[home - 2] && !b[home - 3] && b[home - 4] === (side === 'w' ? 'R' : 'r') && !this.attacked(home - 1, opp) && !this.attacked(home - 2, opp)) add(sq, home - 2, { castle: 1 });
          }
        }
      } else {
        var dirs = t === 'b' ? DIAG : t === 'r' ? ORTH : DIAG.concat(ORTH);
        for (i = 0; i < dirs.length; i++) {
          rr = r + dirs[i][0]; cc = c + dirs[i][1];
          while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
            to = rr * 8 + cc;
            if (b[to]) { if (colorOf(b[to]) !== side) add(sq, to); break; }
            if (!capsOnly) add(sq, to);
            rr += dirs[i][0]; cc += dirs[i][1];
          }
        }
      }
    }
    return out;
  };
  Pos.prototype.make = function (m) {
    var b = this.b;
    var u = { cr: { K: this.cr.K, Q: this.cr.Q, k: this.cr.k, q: this.cr.q }, ep: this.ep, half: this.half, capSq: m.t, capP: b[m.t] };
    b[m.t] = m.promo || b[m.f]; b[m.f] = '';
    if (m.ep) { u.capSq = m.t + (this.side === 'w' ? 8 : -8); u.capP = b[u.capSq]; b[u.capSq] = ''; }
    if (m.castle) {
      if (m.t > m.f) { b[m.f + 1] = b[m.f + 3]; b[m.f + 3] = ''; } else { b[m.f - 1] = b[m.f - 4]; b[m.f - 4] = ''; }
    }
    var pc = m.p;
    if (pc === 'K') { this.cr.K = 0; this.cr.Q = 0; } if (pc === 'k') { this.cr.k = 0; this.cr.q = 0; }
    if (m.f === 63 || m.t === 63) this.cr.K = 0; if (m.f === 56 || m.t === 56) this.cr.Q = 0;
    if (m.f === 7 || m.t === 7) this.cr.k = 0; if (m.f === 0 || m.t === 0) this.cr.q = 0;
    this.ep = m.dbl ? (m.f + m.t) / 2 : -1;
    this.half = (pc === 'P' || pc === 'p' || m.cap) ? 0 : this.half + 1;
    this.side = this.side === 'w' ? 'b' : 'w';
    return u;
  };
  Pos.prototype.unmake = function (m, u) {
    var b = this.b;
    this.side = this.side === 'w' ? 'b' : 'w';
    b[m.f] = m.p; b[m.t] = '';
    b[u.capSq] = u.capP;
    if (m.castle) {
      if (m.t > m.f) { b[m.f + 3] = b[m.f + 1]; b[m.f + 1] = ''; } else { b[m.f - 4] = b[m.f - 1]; b[m.f - 1] = ''; }
    }
    this.cr = u.cr; this.ep = u.ep; this.half = u.half;
  };
  Pos.prototype.legal = function (capsOnly) {
    var ps = this.pseudo(capsOnly), out = [], me = this.side;
    for (var i = 0; i < ps.length; i++) {
      var u = this.make(ps[i]);
      if (!this.inCheck(me)) out.push(ps[i]);
      this.unmake(ps[i], u);
    }
    return out;
  };
  Pos.prototype.evaluate = function () { // с точки зрения стороны, которая ходит
    var s = 0, b = this.b, bishops = [0, 0];
    for (var i = 0; i < 64; i++) {
      var p = b[i]; if (!p) continue;
      var t = p.toLowerCase(), w = p !== t, idx = w ? i : (7 - (i >> 3)) * 8 + (i & 7);
      var v = VAL[t] + PST[t][idx];
      s += w ? v : -v;
      if (t === 'b') bishops[w ? 0 : 1]++;
    }
    if (bishops[0] >= 2) s += 30; if (bishops[1] >= 2) s -= 30;
    return this.side === 'w' ? s : -s;
  };
  Pos.prototype.insufficient = function () {
    var minor = 0;
    for (var i = 0; i < 64; i++) {
      var p = this.b[i]; if (!p) continue;
      var t = p.toLowerCase();
      if (t === 'p' || t === 'r' || t === 'q') return false;
      if (t === 'n' || t === 'b') minor++;
    }
    return minor <= 1;
  };
  function perft(pos, d) {
    if (d === 0) return 1;
    var ms = pos.legal(), n = 0;
    for (var i = 0; i < ms.length; i++) { var u = pos.make(ms[i]); n += perft(pos, d - 1); pos.unmake(ms[i], u); }
    return n;
  }
  function order(ms) {
    ms.forEach(function (m) { m.o = (m.cap ? 10 * VAL[m.cap.toLowerCase()] - VAL[m.p.toLowerCase()] / 10 + 1000 : 0) + (m.promo ? 800 : 0); });
    ms.sort(function (a, b) { return b.o - a.o; });
    return ms;
  }
  // поиск: альфа-бета + форсированные взятия, с ограничением по времени
  function search(pos, maxDepth, timeMs, noise) {
    var deadline = Date.now() + timeMs, nodes = 0, stop = false;
    function quiesce(alpha, beta, qd) {
      nodes++;
      var stand = pos.evaluate();
      if (stand >= beta) return beta;
      if (stand > alpha) alpha = stand;
      if (qd > 6) return alpha;
      var ms = order(pos.legal(true));
      for (var i = 0; i < ms.length; i++) {
        var u = pos.make(ms[i]); var v = -quiesce(-beta, -alpha, qd + 1); pos.unmake(ms[i], u);
        if (v >= beta) return beta;
        if (v > alpha) alpha = v;
      }
      return alpha;
    }
    function nega(depth, alpha, beta, ply) {
      if ((++nodes & 1023) === 0 && Date.now() > deadline) stop = true;
      if (stop) return 0;
      if (depth <= 0) return quiesce(alpha, beta, 0);
      var ms = order(pos.legal());
      if (!ms.length) return pos.inCheck(pos.side) ? -100000 + ply : 0;
      if (pos.half >= 100) return 0;
      for (var i = 0; i < ms.length; i++) {
        var u = pos.make(ms[i]); var v = -nega(depth - 1, -beta, -alpha, ply + 1); pos.unmake(ms[i], u);
        if (stop) return 0;
        if (v >= beta) return beta;
        if (v > alpha) alpha = v;
      }
      return alpha;
    }
    var root = order(pos.legal()), best = root[0], bestScores = null;
    if (!root.length) return null;
    for (var d = 1; d <= maxDepth; d++) {
      var scored = [], alpha = -1e9;
      for (var i = 0; i < root.length; i++) {
        var u = pos.make(root[i]);
        var v = -nega(d - 1, -1e9, -alpha + (noise ? noise : 0), 1);
        pos.unmake(root[i], u);
        if (stop) break;
        scored.push({ m: root[i], v: v });
        if (v > alpha) alpha = v;
      }
      if (stop && d > 1) break;
      if (scored.length === root.length) bestScores = scored;
      if (bestScores) {
        bestScores.sort(function (a, b) { return b.v - a.v; });
        root = bestScores.map(function (s) { return s.m; });
      }
      if (Date.now() > deadline) break;
    }
    if (!bestScores) return best;
    if (noise) {
      var top = bestScores[0].v, pool = bestScores.filter(function (s) { return s.v >= top - noise; });
      return pool[Math.floor(Math.random() * pool.length)].m;
    }
    return bestScores[0].m;
  }
  return { Pos: Pos, perft: perft, search: search, VAL: VAL };
})();

window.GAMES.chess = {
  title: 'Шахматы',
  colors: ['#78716c', '#1c1917'],
  controls: 'none',
  modes: true,
  lan: true,
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="chW" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9cdb4"/><stop offset=".35" stop-color="#ffffff"/><stop offset="1" stop-color="#b8a988"/></linearGradient><linearGradient id="chB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a4520"/><stop offset="1" stop-color="#3b1f0e"/></linearGradient></defs><rect x="6" y="6" width="88" height="88" rx="12" fill="url(#chB)"/><rect x="12" y="12" width="76" height="76" rx="3" fill="#f3e2bf"/><path d="M12 12h19v19H12zM50 12h19v19H50zM31 31h19v19H31zM69 31h19v19H69zM12 50h19v19H12zM50 50h19v19H50zM31 69h19v19H31zM69 69h19v19H69z" fill="#b07c4f"/><rect x="12" y="12" width="76" height="76" rx="3" fill="none" stroke="#c9a24a" stroke-width="1.5"/><ellipse cx="52" cy="87" rx="20" ry="4" fill="#000" opacity=".3"/><g fill="url(#chW)" stroke="#3b2a1a" stroke-width="2.6" stroke-linejoin="round"><path d="M30 86h40l-4-10H34z"/><path d="M36 76 L40 46 H60 L64 76z"/><path d="M38 46 L34 30 L42 36 L50 24 L58 36 L66 30 L62 46z"/><circle cx="50" cy="18" r="5"/><path d="M50 8v8M46 12h8"/></g><path d="M41 74 L44 49" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".7"/></svg>',

  create: function (api) {
    var CC = window.ChessCore;
    var DIFF = [
      { depth: 1, time: 300, noise: 140 }, { depth: 2, time: 700, noise: 30 },
      { depth: 4, time: 1500, noise: 0 }, { depth: 6, time: 3000, noise: 0 }
    ];
    var promo = null, netQ = [], pos, sel, targets, last, animM, phase, msg, thinking, token = 0, hist, capW, capB, sprites, cs, bx, by, t, endT, result, checkSq;
    // v2.0: подсказки 💡 и отмена хода на лёгкой и нормальной сложности
    var hints = 0, undos = 0, hintM = null;
    // v4.8: отмена/возврат хода, ничья, сдаться. ask — запрос, на который отвечают «Принять/Отклонить»; fut — отменённые ходы для «Вперёд»
    var fut = [], ask = null, askT = 0, note = '', noteT = 0;
    function say(s2) { note = s2; noteT = 2.2; }
    function canUndo() { return api.mode !== 2 && undos > 0 && hist.length >= (api.mode === 0 ? 2 : 1) && phase === 'play' && !thinking && !ask; }
    function canHint() { return api.mode === 0 && hints > 0 && phase === 'play' && !thinking && pos.side === 'w'; }
    function giveHint() {
      if (!canHint()) return;
      hints--; api.sound('bonus');
      var m = CC.search(pos, 3, 700, 0);
      if (m) { hintM = { f: m.f, t: m.t, life: 4 }; sel = m.f; targets = pos.legal().filter(function (q) { return q.f === m.f; }); }
    }

    function layout() {
      var size = Math.floor(Math.min(api.W - 28, api.H - 150) / 8) * 8;
      cs = size / 8; bx = Math.floor((api.W - size) / 2); by = Math.floor(64 + (api.H - 130 - size) / 2);
      sprites = {}; boardCv = null;
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
    var boardCv = null, boardKey = '';
    function rrp(o, x, y, w, h, r) {
      o.beginPath(); o.moveTo(x + r, y); o.arcTo(x + w, y, x + w, y + h, r); o.arcTo(x + w, y + h, x, y + h, r);
      o.arcTo(x, y + h, x, y, r); o.arcTo(x, y, x + w, y, r); o.closePath();
    }
    function buildBoard() {
      var W = api.W, H = api.H, dpr = Math.min(2, window.devicePixelRatio || 1), fl = flipped();
      boardKey = W + 'x' + H + ':' + cs + ':' + fl;
      var cv = document.createElement('canvas'); cv.width = Math.ceil(W * dpr); cv.height = Math.ceil(H * dpr);
      var o = cv.getContext('2d'); o.scale(dpr, dpr);
      // стол: тёмное дерево + виньетка
      woodFill(o, 0, 0, W, H, '#2a1a10', '#3a2416', 3, false, 0.8);
      var v = o.createRadialGradient(W / 2, by + cs * 4, cs * 2, W / 2, by + cs * 4, Math.max(W, H) * 0.8);
      v.addColorStop(0, 'rgba(255,200,140,.06)'); v.addColorStop(1, 'rgba(0,0,0,.6)');
      o.fillStyle = v; o.fillRect(0, 0, W, H);
      var S = cs * 8, F = Math.max(6, Math.min(Math.round(cs * 0.28), bx - 1)), fx = bx - F, fy = by - F, fs = S + F * 2;
      // рамка
      o.save(); o.shadowColor = 'rgba(0,0,0,.7)'; o.shadowBlur = 22; o.shadowOffsetY = 8;
      o.fillStyle = '#3b1f0e'; rrp(o, fx, fy, fs, fs, 8); o.fill(); o.restore();
      o.save(); rrp(o, fx, fy, fs, fs, 8); o.clip();
      woodFill(o, fx, fy, fs, fs, '#4a2612', '#6b3a1c', 17, false, 1.2);
      var bev = o.createLinearGradient(fx, fy, fx + fs, fy + fs);
      bev.addColorStop(0, 'rgba(255,220,170,.22)'); bev.addColorStop(0.5, 'rgba(0,0,0,0)'); bev.addColorStop(1, 'rgba(0,0,0,.35)');
      o.fillStyle = bev; o.fillRect(fx, fy, fs, fs);
      o.restore();
      o.strokeStyle = 'rgba(255,225,180,.3)'; o.lineWidth = 1; rrp(o, fx + 0.5, fy + 0.5, fs - 1, fs - 1, 8); o.stroke();
      // золотая инкрустация
      o.strokeStyle = '#c9a24a'; o.lineWidth = 1.5; o.strokeRect(bx - 4.5, by - 4.5, S + 9, S + 9);
      o.strokeStyle = 'rgba(0,0,0,.5)'; o.lineWidth = 1; o.strokeRect(bx - 1.5, by - 1.5, S + 3, S + 3);
      // клетки: клён и орех с волокнами
      var lightTex = document.createElement('canvas'), darkTex = document.createElement('canvas');
      [lightTex, darkTex].forEach(function (tc, n) {
        tc.width = Math.ceil(S * dpr); tc.height = Math.ceil(S * dpr);
        var q = tc.getContext('2d'); q.scale(dpr, dpr);
        if (n) woodFill(q, 0, 0, S, S, '#9c6a40', '#b07c4f', 41, false, 1.1, 0);
        else woodFill(q, 0, 0, S, S, '#e8d2a6', '#f3e2bf', 29, false, 0.7, 0);
      });
      for (var i = 0; i < 64; i++) {
        var r = i >> 3, f = i & 7, light = (r + f) % 2 === 0, x0 = bx + f * cs, y0 = by + r * cs;
        var tex = light ? lightTex : darkTex;
        // для живости — каждой клетке свой участок текстуры, тёмные повернуты
        o.save(); o.beginPath(); o.rect(x0, y0, cs, cs); o.clip();
        if (!light && (i % 3 === 0)) { o.translate(x0 + cs / 2, y0 + cs / 2); o.rotate(Math.PI); o.translate(-(x0 + cs / 2), -(y0 + cs / 2)); }
        o.drawImage(tex, ((f * 3 + r * 5) % 8) * cs * dpr, ((r * 3 + f) % 8) * cs * dpr, cs * dpr, cs * dpr, x0, y0, cs, cs);
        o.restore();
        var sg = o.createLinearGradient(x0, y0, x0 + cs, y0 + cs);
        sg.addColorStop(0, 'rgba(255,255,255,.07)'); sg.addColorStop(1, 'rgba(0,0,0,.07)');
        o.fillStyle = sg; o.fillRect(x0, y0, cs, cs);
      }
      var ins = o.createLinearGradient(0, by, 0, by + cs * 0.3);
      ins.addColorStop(0, 'rgba(0,0,0,.25)'); ins.addColorStop(1, 'rgba(0,0,0,0)'); o.fillStyle = ins; o.fillRect(bx, by, S, cs * 0.3);
      // координаты на рамке
      o.font = '700 ' + Math.max(8, Math.round(F * 0.62)) + 'px system-ui, sans-serif'; o.fillStyle = 'rgba(245,222,179,.8)';
      o.textAlign = 'center'; o.textBaseline = 'middle';
      for (var k = 0; k < 8; k++) {
        o.fillText(String(fl ? k + 1 : 8 - k), bx - F / 2 - 1, by + k * cs + cs / 2);
        o.fillText((fl ? 'hgfedcba' : 'abcdefgh')[k], bx + k * cs + cs / 2, by + S + F / 2 + 1);
      }
      boardCv = cv;
    }
    function pieceSprite(p) {
      if (sprites[p]) return sprites[p];
      var dpr = Math.min(window.devicePixelRatio || 1, 2), s = Math.ceil(cs * dpr), cv = document.createElement('canvas');
      cv.width = s; cv.height = s;
      var c = cv.getContext('2d'); c.scale(s, s);
      var white = p === p.toUpperCase(), t2 = p.toLowerCase();
      var g = c.createLinearGradient(0, 0, 1, 1);
      if (white) { g.addColorStop(0, '#fffdf7'); g.addColorStop(1, '#d9cdb4'); } else { g.addColorStop(0, '#57504a'); g.addColorStop(1, '#0c0a09'); }
      c.fillStyle = g; c.strokeStyle = white ? '#3b2a1a' : '#c8b89a'; c.lineWidth = 0.035; c.lineJoin = 'round'; c.lineCap = 'round';
      function base() { c.beginPath(); c.moveTo(0.22, 0.88); c.lineTo(0.78, 0.88); c.lineTo(0.72, 0.78); c.lineTo(0.28, 0.78); c.closePath(); c.fill(); c.stroke(); }
      c.beginPath();
      switch (t2) {
        case 'p':
          base();
          c.beginPath(); c.moveTo(0.33, 0.78); c.quadraticCurveTo(0.36, 0.5, 0.44, 0.44); c.lineTo(0.56, 0.44); c.quadraticCurveTo(0.64, 0.5, 0.67, 0.78); c.closePath(); c.fill(); c.stroke();
          c.beginPath(); c.arc(0.5, 0.33, 0.13, 0, 6.283); c.fill(); c.stroke();
          break;
        case 'r':
          base();
          c.beginPath(); c.rect(0.32, 0.36, 0.36, 0.42); c.fill(); c.stroke();
          c.beginPath(); c.moveTo(0.27, 0.36); c.lineTo(0.27, 0.16); c.lineTo(0.36, 0.16); c.lineTo(0.36, 0.23); c.lineTo(0.45, 0.23); c.lineTo(0.45, 0.16);
          c.lineTo(0.55, 0.16); c.lineTo(0.55, 0.23); c.lineTo(0.64, 0.23); c.lineTo(0.64, 0.16); c.lineTo(0.73, 0.16); c.lineTo(0.73, 0.36); c.closePath(); c.fill(); c.stroke();
          break;
        case 'n':
          base();
          c.beginPath(); c.moveTo(0.3, 0.78); c.lineTo(0.36, 0.56); c.quadraticCurveTo(0.24, 0.48, 0.3, 0.38); c.lineTo(0.42, 0.22); c.lineTo(0.46, 0.12); c.lineTo(0.52, 0.2);
          c.quadraticCurveTo(0.72, 0.26, 0.72, 0.5); c.lineTo(0.7, 0.78); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = white ? '#1e293b' : '#e2e8f0'; c.beginPath(); c.arc(0.44, 0.32, 0.03, 0, 6.283); c.fill();
          c.strokeStyle = white ? '#1e293b' : '#e2e8f0'; c.beginPath(); c.moveTo(0.58, 0.28); c.quadraticCurveTo(0.66, 0.44, 0.6, 0.62); c.stroke();
          break;
        case 'b':
          base();
          c.beginPath(); c.moveTo(0.36, 0.78); c.lineTo(0.4, 0.62); c.lineTo(0.6, 0.62); c.lineTo(0.64, 0.78); c.closePath(); c.fill(); c.stroke();
          c.beginPath(); c.ellipse(0.5, 0.44, 0.15, 0.2, 0, 0, 6.283); c.fill(); c.stroke();
          c.beginPath(); c.arc(0.5, 0.18, 0.05, 0, 6.283); c.fill(); c.stroke();
          c.beginPath(); c.moveTo(0.46, 0.36); c.lineTo(0.56, 0.48); c.stroke();
          break;
        case 'q':
          base();
          c.beginPath(); c.moveTo(0.3, 0.78); c.lineTo(0.22, 0.3); c.lineTo(0.36, 0.5); c.lineTo(0.42, 0.24); c.lineTo(0.5, 0.48); c.lineTo(0.58, 0.24); c.lineTo(0.64, 0.5); c.lineTo(0.78, 0.3); c.lineTo(0.7, 0.78); c.closePath(); c.fill(); c.stroke();
          [[0.22, 0.27], [0.42, 0.21], [0.58, 0.21], [0.78, 0.27]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], 0.045, 0, 6.283); c.fill(); c.stroke(); });
          break;
        case 'k':
          base();
          c.beginPath(); c.moveTo(0.3, 0.78); c.quadraticCurveTo(0.2, 0.42, 0.36, 0.36); c.lineTo(0.64, 0.36); c.quadraticCurveTo(0.8, 0.42, 0.7, 0.78); c.closePath(); c.fill(); c.stroke();
          c.beginPath(); c.rect(0.46, 0.12, 0.08, 0.24); c.fill(); c.stroke();
          c.beginPath(); c.rect(0.39, 0.18, 0.22, 0.07); c.fill(); c.stroke();
          break;
      }
      // объём: цилиндрическая подсветка поверх фигуры
      c.globalCompositeOperation = 'source-atop';
      var sh = c.createLinearGradient(0.2, 0, 0.8, 0);
      sh.addColorStop(0, white ? 'rgba(120,90,50,.25)' : 'rgba(0,0,0,.2)');
      sh.addColorStop(0.32, white ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.28)');
      sh.addColorStop(0.45, 'rgba(255,255,255,0)');
      sh.addColorStop(1, white ? 'rgba(90,60,30,.35)' : 'rgba(0,0,0,.45)');
      c.fillStyle = sh; c.fillRect(0, 0, 1, 1);
      var top = c.createLinearGradient(0, 0.1, 0, 0.9);
      top.addColorStop(0, 'rgba(255,255,255,.12)'); top.addColorStop(1, 'rgba(0,0,0,.15)');
      c.fillStyle = top; c.fillRect(0, 0, 1, 1);
      c.globalCompositeOperation = 'source-over';
      // блик на основании
      c.strokeStyle = white ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.25)'; c.lineWidth = 0.018;
      c.beginPath(); c.moveTo(0.3, 0.805); c.lineTo(0.62, 0.805); c.stroke();
      sprites[p] = cv;
      return cv;
    }
    function flipped() { return api.mode === 2 && api.net && api.net.side === 1; }
    function myColor() { return api.mode === 2 && api.net ? (api.net.side === 1 ? 'b' : 'w') : 'w'; }
    function sqXY(i) { if (flipped()) i = 63 - i; return [bx + (i & 7) * cs, by + (i >> 3) * cs]; }
    function remoteTurn() { return api.mode === 2 && pos.side !== myColor() && phase === 'play'; }
    function status() {
      var ms = pos.legal();
      checkSq = pos.inCheck(pos.side) ? pos.kingSq(pos.side) : -1;
      if (!ms.length) {
        phase = 'over';
        if (checkSq >= 0) { result = pos.side === 'w' ? 'b' : 'w'; msg = api.t('chess.mate'); }
        else { result = 'd'; msg = api.t('chess.stalemate'); }
      } else if (pos.half >= 100 || pos.insufficient()) { phase = 'over'; result = 'd'; msg = api.t('g.draw'); }
      else msg = checkSq >= 0 ? api.t('chess.check') : '';
      if (phase === 'over') {
        endT = 2.6;
        if (api.mode === 2) api.sound(result === myColor() ? 'win' : result === 'd' ? 'point' : 'over');
        else if (api.mode === 0) {
          if (result === 'w') { api.addScore(1000 * (api.diff + 1) + Math.max(0, 80 - hist.length) * 10); api.sound('win'); }
          else if (result === 'd') { api.addScore(300 * (api.diff + 1)); api.sound('point'); }
          else api.sound('over');
        } else if (api.mode === 1) api.sound('win');
      } else if (checkSq >= 0) { api.sound('bonus'); api.vibrate(40); }
    }
    function doMove(m, remote, keepFut) {
      if (!keepFut) fut = [];
      if (api.mode === 2 && !remote) api.net.send({ f: m.f, t: m.t, p: m.promo || '' });
      var u = pos.make(m);
      hist.push({ m: m, u: u });
      if (m.cap) (colorOf(m.cap) === 'w' ? capW : capB).push(m.cap);
      last = m; animM = { m: m, k: 0 };
      sel = -1; targets = [];
      api.sound(m.cap ? 'stomp' : 'move'); api.vibrate(m.cap ? 25 : 8);
      status();
    }
    function colorOf(p) { return p === p.toUpperCase() ? 'w' : 'b'; }
    function cpuTurn() { return api.mode === 0 && pos.side === 'b' && phase === 'play'; }
    function startThink() {
      thinking = true; var my = ++token;
      setTimeout(function () {
        if (my !== token) return;
        var d = DIFF[api.diff];
        var m = CC.search(pos, d.depth, d.time, d.noise);
        thinking = false;
        if (my !== token || !m) return;
        doMove(m);
      }, 60);
    }
    function promoRects() {
      var s2 = cs * 1.15, gap = 8, total = s2 * 4 + gap * 3, x0 = (api.W - total) / 2, y0 = by + cs * 4 - s2 / 2;
      return ['q', 'r', 'b', 'n'].map(function (p, k) { return { p: p, x: x0 + k * (s2 + gap), y: y0, s: s2 }; });
    }
    function back(n) { // снять n последних ходов
      for (var k = 0; k < n && hist.length; k++) {
        var h = hist.pop(); pos.unmake(h.m, h.u); fut.push(h.m);
        if (h.m.cap) (colorOf(h.m.cap) === 'w' ? capW : capB).pop();
      }
      last = hist.length ? hist[hist.length - 1].m : null; sel = -1; targets = []; animM = null; phase = 'play'; promo = null; hintM = null;
      status(); api.sound('rotate');
    }
    function undo() { if (!canUndo()) return; undos--; back(api.mode === 0 ? (pos.side === 'w' ? 2 : 1) : 1); }
    function canRedo() { return api.mode !== 2 && fut.length > 0 && phase === 'play' && !thinking && !ask; }
    function redo() { // вернуть отменённый ход (против компьютера — вместе с его ответом)
      if (!canRedo()) return;
      var n = api.mode === 0 ? Math.min(2, fut.length) : 1, keep = fut;
      for (var k = 0; k < n; k++) { var m = keep.pop(), lm = pos.legal().filter(function (q) { return q.f === m.f && q.t === m.t && (q.promo || '') === (m.promo || ''); })[0]; if (!lm) { keep.length = 0; break; } fut = keep; doMove(lm, false, true); }
      fut = keep;
    }
    function finish(res, why) { // ничья по согласию или сдача
      phase = 'over'; result = res; msg = why; endT = 2.6; ask = null; sel = -1; targets = [];
      if (api.mode === 0 && res === 'd') { api.addScore(300 * (api.diff + 1)); api.sound('point'); }
      else api.sound(api.mode === 1 ? 'win' : res === myColor() ? 'win' : res === 'd' ? 'point' : 'over');
    }
    function offerDraw() {
      if (phase !== 'play' || ask || thinking) return;
      if (api.mode === 0) { // компьютер соглашается, только если ему хуже или позиция давно равная
        var v = pos.evaluate() * (pos.side === 'b' ? 1 : -1);
        if (v < -150 || (Math.abs(v) < 60 && hist.length > 60)) finish('d', 'Ничья по согласию'); else say('Компьютер отказался от ничьей');
        return;
      }
      if (api.mode === 2) { api.net.send({ k: 'draw' }); say('Ничья предложена, ждём ответа…'); return; }
      ask = { k: 'draw', from: pos.side, txt: (pos.side === 'w' ? 'Белые' : 'Чёрные') + ' предлагают ничью' };
    }
    function resign() {
      if (phase !== 'play') return;
      if (Date.now() - (resign.t || 0) > 3000) { resign.t = Date.now(); say('Нажми ещё раз, чтобы сдаться'); return; }
      var loser = api.mode === 2 ? myColor() : api.mode === 0 ? 'w' : pos.side;
      if (api.mode === 2) api.net.send({ k: 'resign' });
      finish(loser === 'w' ? 'b' : 'w', (loser === 'w' ? 'Белые' : 'Чёрные') + ' сдались');
    }
    function askTakeback() { if (phase !== 'play' || !hist.length || ask) return; api.net.send({ k: 'tb' }); say('Просьба вернуть ход отправлена…'); }
    function answer(yes) {
      var a = ask; ask = null; if (!a) return;
      if (a.k === 'draw') { if (api.mode === 2) api.net.send({ k: yes ? 'drawok' : 'drawno' }); if (yes) finish('d', 'Ничья по согласию'); else say('Ничья отклонена'); }
      if (a.k === 'tb') {
        // если сейчас ход того, кто просит, — снимаем и его ход, и ответ
        var n = pos.side === myColor() ? 1 : 2; n = Math.min(n, hist.length);
        api.net.send({ k: yes ? 'tbok' : 'tbno', n: n }); if (yes) back(n); else say('Возврат хода отклонён');
      }
    }
    function bar() { // кнопки под доской
      var L = api.mode === 0 ? ['undo', 'redo', 'hint', 'draw', 'resign'] : api.mode === 1 ? ['undo', 'redo', 'draw', 'resign'] : ['tb', 'draw', 'resign'];
      var w = (api.W - 24 - (L.length - 1) * 6) / L.length, y = by + 8 * cs + 22;
      return L.map(function (k, i) { return { k: k, x: 12 + i * (w + 6), y: y, w: w, h: 36 }; });
    }
    function btnLabel(k) {
      return k === 'undo' ? '↶ Назад' + (api.mode === 0 && undos < 50 ? ' ' + undos : '') : k === 'redo' ? '↷ Вперёд' : k === 'hint' ? '💡 ' + hints : k === 'draw' ? '½ Ничья' : k === 'resign' ? '🏳 Сдаться' : '↶ Вернуть ход';
    }
    function btnOn(k) { return k === 'undo' ? canUndo() : k === 'redo' ? canRedo() : k === 'hint' ? canHint() : k === 'tb' ? phase === 'play' && hist.length > 0 && !ask : phase === 'play' && !thinking && !ask; }
    function askRects() { var w = Math.min(300, api.W - 40), x = (api.W - w) / 2, y = by + cs * 4 - 60; return { box: [x, y, w, 120], yes: [x + 12, y + 64, w / 2 - 18, 42], no: [x + w / 2 + 6, y + 64, w / 2 - 18, 42] }; }
    function hit(r, d) { return d.x >= r[0] && d.x <= r[0] + r[2] && d.y >= r[1] && d.y <= r[1] + r[3]; }

    return {
      reset: function () {
        token++;
        pos = new CC.Pos(); sel = -1; targets = []; last = null; animM = null; phase = 'play'; msg = ''; thinking = false;
        hist = []; capW = []; capB = []; t = 0; endT = 0; result = null; checkSq = -1; promo = null; netQ = [];
        hints = [5, 3, 1, 0][api.diff]; undos = api.mode === 0 ? [99, 99, 5, 3][api.diff] : 999; hintM = null; fut = []; ask = null; note = ''; noteT = 0;
        layout();
      },
      destroy: function () { token++; },
      netMsg: function (d) { netQ.push(d); },
      debug: function () { return { pos: pos, set: function (fen) { pos = new CC.Pos().fromFEN(fen); status(); } }; },
      resize: layout,
      idle: function (dt) { t += dt; },
      key: function () { },
      input: function (type, d) {
        if (type !== 'tap' || phase !== 'play') return;
        if (ask) { var ar = askRects(); if (hit(ar.yes, d)) answer(true); else if (hit(ar.no, d)) answer(false); return; }
        var bb = bar().filter(function (b) { return hit([b.x, b.y, b.w, b.h], d); })[0];
        if (bb) {
          if (!btnOn(bb.k)) return; api.sound('click');
          if (bb.k === 'undo') undo(); else if (bb.k === 'redo') redo(); else if (bb.k === 'hint') giveHint(); else if (bb.k === 'draw') offerDraw(); else if (bb.k === 'resign') resign(); else askTakeback();
          return;
        }
        if (thinking || cpuTurn() || remoteTurn()) return;
        if (promo) { // выбор фигуры для превращения
          var pk = promoRects().filter(function (q) { return d.x >= q.x && d.x <= q.x + q.s && d.y >= q.y && d.y <= q.y + q.s; })[0];
          if (pk) doMove(promo.moves.filter(function (m) { return m.promo.toLowerCase() === pk.p; })[0]);
          promo = null; return;
        }
        var c = Math.floor((d.x - bx) / cs), r = Math.floor((d.y - by) / cs);
        if (c < 0 || r < 0 || c > 7 || r > 7) return;
        var i = r * 8 + c; if (flipped()) i = 63 - i;
        var p = pos.b[i];
        if (sel >= 0) {
          var mv = targets.filter(function (m) { return m.t === i; });
          if (mv.length > 1 && mv[0].promo) { promo = { moves: mv, sq: i }; api.sound('click'); return; }
          if (mv.length) { doMove(mv[0]); return; }
        }
        if (p && colorOf(p) === pos.side) {
          sel = i; targets = pos.legal().filter(function (m) { return m.f === i; });
          api.sound('click');
        } else { sel = -1; targets = []; }
      },
      update: function (dt) {
        if (hintM) { hintM.life -= dt; if (hintM.life <= 0 || pos.side !== 'w') hintM = null; }
        t += dt;
        if (animM) { animM.k += dt / 0.18; if (animM.k >= 1) animM = null; }
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (cpuTurn() && !thinking && !animM) startThink();
        if (noteT > 0) noteT -= dt;
        // служебные сообщения соперника (ничья, возврат хода, сдача) обрабатываем в любой момент
        for (var qi = netQ.length - 1; qi >= 0; qi--) {
          var cm = netQ[qi]; if (!cm.k) continue; netQ.splice(qi, 1);
          if (phase !== 'play') continue;
          if (cm.k === 'draw') ask = { k: 'draw', txt: 'Соперник предлагает ничью' };
          else if (cm.k === 'tb') ask = { k: 'tb', txt: 'Соперник просит вернуть ход' };
          else if (cm.k === 'drawok') finish('d', 'Ничья по согласию');
          else if (cm.k === 'drawno') say('Соперник отказался от ничьей');
          else if (cm.k === 'tbok') back(cm.n || 1);
          else if (cm.k === 'tbno') say('Соперник не разрешил вернуть ход');
          else if (cm.k === 'resign') finish(myColor(), 'Соперник сдался');
        }
        if (remoteTurn() && netQ.length && !animM) {
          var nd = netQ.shift(), lm = pos.legal().filter(function (m) { return m.f === nd.f && m.t === nd.t && (m.promo || '') === nd.p; })[0];
          if (lm) doMove(lm, true);
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        if (!boardCv || boardKey !== W + 'x' + H + ':' + cs + ':' + flipped()) buildBoard();
        c.drawImage(boardCv, 0, 0, W, H);
        for (var i = 0; i < 64; i++) {
          var xy = sqXY(i);
          if (last && (i === last.f || i === last.t)) { c.fillStyle = 'rgba(250,204,21,.32)'; c.fillRect(xy[0], xy[1], cs, cs); }
          if (i === sel) { c.fillStyle = 'rgba(34,197,94,.42)'; c.fillRect(xy[0], xy[1], cs, cs); c.strokeStyle = 'rgba(187,247,208,.8)'; c.lineWidth = 2; c.strokeRect(xy[0] + 1, xy[1] + 1, cs - 2, cs - 2); }
          if (i === checkSq) {
            var rg = c.createRadialGradient(xy[0] + cs / 2, xy[1] + cs / 2, 2, xy[0] + cs / 2, xy[1] + cs / 2, cs * 0.7);
            rg.addColorStop(0, 'rgba(239,68,68,.95)'); rg.addColorStop(1, 'rgba(239,68,68,0)');
            c.fillStyle = rg; c.fillRect(xy[0], xy[1], cs, cs);
          }
        }
        var fl = flipped();
        // фигуры
        for (var j = 0; j < 64; j++) {
          var p = pos.b[j]; if (!p) continue;
          var q = sqXY(j);
          if (animM && animM.m.t === j) {
            var f = sqXY(animM.m.f), e = 1 - Math.pow(1 - animM.k, 3);
            q = [f[0] + (q[0] - f[0]) * e, f[1] + (q[1] - f[1]) * e];
          }
          c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(q[0] + cs * 0.54, q[1] + cs * 0.87, cs * 0.3, cs * 0.075, 0, 0, 6.283); c.fill();
          c.drawImage(pieceSprite(p), q[0], q[1], cs, cs);
        }
        targets.forEach(function (m) {
          var z = sqXY(m.t);
          c.fillStyle = 'rgba(21,128,61,.55)';
          if (pos.b[m.t] || m.ep) { c.strokeStyle = 'rgba(21,128,61,.75)'; c.lineWidth = cs * 0.08; c.beginPath(); c.arc(z[0] + cs / 2, z[1] + cs / 2, cs * 0.44, 0, 6.283); c.stroke(); }
          else { c.beginPath(); c.arc(z[0] + cs / 2, z[1] + cs / 2, cs * 0.15, 0, 6.283); c.fill(); }
        });
        // взятые фигуры
        function caps(list, y) {
          var sorted = list.slice().sort(function (a, b) { return CC.VAL[b.toLowerCase()] - CC.VAL[a.toLowerCase()]; });
          sorted.forEach(function (pc, n) { c.drawImage(pieceSprite(pc), 10 + n * cs * 0.38, y, cs * 0.5, cs * 0.5); });
        }
        caps(fl ? capB : capW, by - 12 - cs * 0.5 - 8);
        caps(fl ? capW : capB, by + 8 * cs + 14);
        // статус
        var two = api.mode === 1, turnTxt;
        if (phase === 'over') turnTxt = msg + ' · ' + (result === 'd' ? api.t('g.draw') : two ? api.t(result === 'w' ? 'g.p1win' : 'g.p2win') : api.t(result === myColor() ? 'g.win' : 'g.lose'));
        else if (thinking) turnTxt = api.t('g.thinking');
        else if (api.mode === 2) turnTxt = api.t(pos.side === myColor() ? 'g.yourTurn' : 'net.oppTurn') + (msg ? ' · ' + msg : '');
        else turnTxt = (two ? api.t(pos.side === 'w' ? 'chess.white' : 'chess.black') : api.t(pos.side === 'w' ? 'g.yourTurn' : 'g.cpuTurn')) + (msg ? ' · ' + msg : '');
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '800 16px system-ui, sans-serif';
        c.fillStyle = phase === 'over' ? '#fde047' : checkSq >= 0 ? '#f87171' : '#e7e5e4';
        c.fillText(turnTxt, W / 2, 22);
        if (thinking) {
          for (var dd = 0; dd < 3; dd++) { c.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * 4 + dd)); c.beginPath(); c.arc(W / 2 - 12 + dd * 12, 42, 3.5, 0, 6.283); c.fill(); }
          c.globalAlpha = 1;
        }
        if (promo) { // окно выбора фигуры
          c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(bx, by, cs * 8, cs * 8);
          var rs = promoRects(), col = pos.side;
          c.fillStyle = '#f5f5f4'; c.beginPath(); c.roundRect ? c.roundRect(rs[0].x - 12, rs[0].y - 34, rs[3].x + rs[3].s - rs[0].x + 24, rs[0].s + 46, 16) : c.rect(rs[0].x - 12, rs[0].y - 34, rs[3].x + rs[3].s - rs[0].x + 24, rs[0].s + 46); c.fill();
          c.fillStyle = '#1c1917'; c.font = '800 13px system-ui, sans-serif'; c.textAlign = 'center';
          c.fillText(api.t('chess.promote'), W / 2, rs[0].y - 18);
          rs.forEach(function (q) {
            c.fillStyle = '#e7d3ac'; c.fillRect(q.x, q.y, q.s, q.s);
            c.drawImage(pieceSprite(col === 'w' ? q.p.toUpperCase() : q.p), q.x, q.y, q.s, q.s);
          });
        }
        bar().forEach(function (b) {
          var on = btnOn(b.k), warm = b.k === 'resign' ? 'rgba(239,68,68,.25)' : b.k === 'hint' ? 'rgba(253,224,71,.2)' : 'rgba(255,255,255,.12)';
          c.globalAlpha = on ? 1 : 0.35; c.fillStyle = warm; c.beginPath(); c.roundRect ? c.roundRect(b.x, b.y, b.w, b.h, 18) : c.rect(b.x, b.y, b.w, b.h); c.fill();
          c.fillStyle = b.k === 'hint' ? '#fde047' : b.k === 'resign' ? '#fca5a5' : '#e7e5e4'; c.font = '800 ' + (b.w < 80 ? 12 : 13) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(btnLabel(b.k), b.x + b.w / 2, b.y + b.h / 2 + 1); c.globalAlpha = 1;
        });
        if (noteT > 0) { c.globalAlpha = Math.min(1, noteT * 2); c.font = '800 14px system-ui, sans-serif'; var nw = c.measureText(note).width + 30; c.fillStyle = 'rgba(0,0,0,.75)'; c.beginPath(); c.roundRect ? c.roundRect(W / 2 - nw / 2, by + cs * 4 - 18, nw, 36, 18) : c.rect(W / 2 - nw / 2, by + cs * 4 - 18, nw, 36); c.fill(); c.fillStyle = '#fff'; c.fillText(note, W / 2, by + cs * 4 + 1); c.globalAlpha = 1; }
        if (ask) {
          var ar = askRects(); c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(bx, by, cs * 8, cs * 8);
          c.fillStyle = '#f5f5f4'; c.beginPath(); c.roundRect ? c.roundRect(ar.box[0], ar.box[1], ar.box[2], ar.box[3], 16) : c.rect(ar.box[0], ar.box[1], ar.box[2], ar.box[3]); c.fill();
          c.fillStyle = '#1c1917'; c.font = '800 16px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText(ask.txt, W / 2, ar.box[1] + 34);
          [[ar.yes, '#16a34a', 'Принять'], [ar.no, '#dc2626', 'Отклонить']].forEach(function (q) { c.fillStyle = q[1]; c.beginPath(); c.roundRect ? c.roundRect(q[0][0], q[0][1], q[0][2], q[0][3], 12) : c.rect(q[0][0], q[0][1], q[0][2], q[0][3]); c.fill(); c.fillStyle = '#fff'; c.fillText(q[2], q[0][0] + q[0][2] / 2, q[0][1] + q[0][3] / 2 + 1); });
        }
        if (false) {
          c.fillStyle = 'rgba(255,255,255,.1)'; c.beginPath(); c.roundRect ? c.roundRect(W - 116, by + 8 * cs + 12, 104, 34, 17) : c.rect(W - 116, by + 8 * cs + 12, 104, 34); c.fill();
          c.fillStyle = '#e7e5e4'; c.font = '800 13px system-ui, sans-serif'; c.fillText('↶ ' + api.t('g.undo') + (undos < 50 ? ' ' + undos : ''), W - 64, by + 8 * cs + 29);
        }
        if (false) {
          c.fillStyle = 'rgba(253,224,71,.2)'; c.beginPath(); c.roundRect ? c.roundRect(12, by + 8 * cs + 12, 104, 34, 17) : c.rect(12, by + 8 * cs + 12, 104, 34); c.fill();
          c.fillStyle = '#fde047'; c.font = '800 13px system-ui, sans-serif'; c.fillText('💡 ' + api.t('g.hint') + ' ' + hints, 64, by + 8 * cs + 29);
        }
        if (hintM && hintM.life > 0) {
          [hintM.f, hintM.t].forEach(function (sq, n) {
            var xy = sqXY(sq);
            c.strokeStyle = 'rgba(253,224,71,' + Math.min(1, hintM.life) + ')'; c.lineWidth = 4;
            c.strokeRect(xy[0] + 2, xy[1] + 2, cs - 4, cs - 4);
            if (n) { c.fillStyle = 'rgba(253,224,71,' + Math.min(0.35, hintM.life * 0.2) + ')'; c.fillRect(xy[0], xy[1], cs, cs); }
          });
        }
      }
    };
  }
};
