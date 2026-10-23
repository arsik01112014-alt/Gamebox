/* Шашки (русские правила) */
window.GAMES = window.GAMES || {};
window.CheckersCore = (function () {
  // доска: массив 64; 0 — пусто, 1 — белая, 2 — белая дамка, -1 — чёрная, -2 — чёрная дамка
  var DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  function initial() {
    var b = [];
    for (var i = 0; i < 64; i++) {
      var r = i >> 3, c = i & 7, dark = (r + c) % 2 === 1;
      b.push(dark && r < 3 ? -1 : dark && r > 4 ? 1 : 0);
    }
    return b;
  }
  function inb(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
  // все ходы стороны side (1 белые, -1 чёрные); ход = {path:[...], caps:[...], promo}
  function moves(b, side) {
    var caps = [], quiet = [];
    for (var sq = 0; sq < 64; sq++) {
      var p = b[sq];
      if (p * side <= 0) continue;
      var king = Math.abs(p) === 2;
      capturesFrom(b, sq, side, king, [sq], [], caps);
      if (caps.length) continue;
      var r = sq >> 3, c = sq & 7;
      for (var d = 0; d < 4; d++) {
        var dr = DIRS[d][0], dc = DIRS[d][1];
        if (!king && dr !== -side) continue;
        var rr = r + dr, cc = c + dc;
        while (inb(rr, cc) && b[rr * 8 + cc] === 0) {
          var to = rr * 8 + cc;
          quiet.push({ path: [sq, to], caps: [], promo: !king && ((side === 1 && rr === 0) || (side === -1 && rr === 7)) });
          if (!king) break;
          rr += dr; cc += dc;
        }
      }
    }
    return caps.length ? caps : quiet;
  }
  function capturesFrom(b, sq, side, king, path, capd, out) {
    var r = sq >> 3, c = sq & 7, found = false;
    function empty(x) { return b[x] === 0 || x === path[0]; }
    for (var d = 0; d < 4; d++) {
      var dr = DIRS[d][0], dc = DIRS[d][1], rr = r + dr, cc = c + dc;
      if (king) while (inb(rr, cc) && empty(rr * 8 + cc)) { rr += dr; cc += dc; }
      if (!inb(rr, cc)) continue;
      var mid = rr * 8 + cc;
      if (empty(mid) || b[mid] * side > 0 || capd.indexOf(mid) >= 0) continue;
      var lr = rr + dr, lc = cc + dc, lands = [];
      while (inb(lr, lc) && empty(lr * 8 + lc)) {
        lands.push(lr * 8 + lc);
        if (!king) break;
        lr += dr; lc += dc;
      }
      if (!lands.length) continue;
      // для дамки: если с каких-то полей можно бить дальше — разрешены только они
      var cont = [], ends = [];
      lands.forEach(function (l) {
        var lr2 = l >> 3, promote = !king && ((side === 1 && lr2 === 0) || (side === -1 && lr2 === 7));
        var sub = [];
        capturesFrom(b, l, side, king || promote, path.concat([l]), capd.concat([mid]), sub);
        if (sub.length) cont.push(sub); else ends.push({ l: l, promote: promote });
      });
      found = true;
      if (cont.length) cont.forEach(function (sub) { sub.forEach(function (m) { out.push(m); }); });
      else ends.forEach(function (e) { out.push({ path: path.concat([e.l]), caps: capd.concat([mid]), promo: !king && (e.promote || false) }); });
    }
    return found;
  }
  function apply(b, m) {
    var nb = b.slice(), f = m.path[0], t = m.path[m.path.length - 1], p = nb[f];
    nb[f] = 0; m.caps.forEach(function (s) { nb[s] = 0; });
    var tr = t >> 3;
    if (Math.abs(p) === 1 && (m.promo || (p === 1 && tr === 0) || (p === -1 && tr === 7) || passedPromo(m, p))) p *= 2;
    nb[t] = p;
    return nb;
  }
  function passedPromo(m, p) {
    for (var i = 1; i < m.path.length; i++) { var r = m.path[i] >> 3; if ((p === 1 && r === 0) || (p === -1 && r === 7)) return true; }
    return false;
  }
  function evaluate(b, side) {
    var s = 0;
    for (var i = 0; i < 64; i++) {
      var p = b[i]; if (!p) continue;
      var r = i >> 3, c = i & 7, v;
      if (Math.abs(p) === 2) v = 320;
      else v = 100 + (p > 0 ? (7 - r) : r) * 6 + ((c > 1 && c < 6) ? 5 : 0) + ((p > 0 && r === 7) || (p < 0 && r === 0) ? 8 : 0);
      s += p > 0 ? v : -v;
    }
    return s * side;
  }
  function search(b, side, maxDepth, timeMs, noise) {
    var deadline = Date.now() + timeMs, stop = false, nodes = 0;
    function nega(bb, sd, depth, alpha, beta) {
      if ((++nodes & 511) === 0 && Date.now() > deadline) stop = true;
      if (stop) return 0;
      var ms = moves(bb, sd);
      if (!ms.length) return -100000 - depth;
      if (depth <= 0 && !ms[0].caps.length) return evaluate(bb, sd);
      if (depth <= -6) return evaluate(bb, sd);
      ms.sort(function (x, y) { return y.caps.length - x.caps.length; });
      for (var i = 0; i < ms.length; i++) {
        var v = -nega(apply(bb, ms[i]), -sd, depth - 1, -beta, -alpha);
        if (stop) return 0;
        if (v >= beta) return beta;
        if (v > alpha) alpha = v;
      }
      return alpha;
    }
    var root = moves(b, side), scored = null;
    if (!root.length) return null;
    if (root.length === 1) return root[0];
    for (var d = 1; d <= maxDepth; d++) {
      var cur = [], alpha = -1e9;
      for (var i = 0; i < root.length; i++) {
        var v = -nega(apply(b, root[i]), -side, d - 1, -1e9, -alpha + (noise || 0));
        if (stop) break;
        cur.push({ m: root[i], v: v }); if (v > alpha) alpha = v;
      }
      if (stop) break;
      cur.sort(function (x, y) { return y.v - x.v; });
      scored = cur; root = cur.map(function (s) { return s.m; });
      if (Date.now() > deadline) break;
    }
    if (!scored) return root[0];
    var top = scored[0].v, pool = scored.filter(function (s) { return s.v >= top - (noise || 0); });
    return pool[Math.floor(Math.random() * pool.length)].m;
  }
  return { initial: initial, moves: moves, apply: apply, search: search };
})();

window.GAMES.checkers = {
  title: 'Шашки',
  colors: ['#b45309', '#7f1d1d'],
  controls: 'none',
  modes: true,
  lan: true,
  icon: '<svg viewBox="0 0 100 100"><defs><radialGradient id="ckW" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fffdf6"/><stop offset=".65" stop-color="#ece2cc"/><stop offset="1" stop-color="#bfae8c"/></radialGradient><radialGradient id="ckB" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#6b645c"/><stop offset=".6" stop-color="#2c2824"/><stop offset="1" stop-color="#0c0a09"/></radialGradient><linearGradient id="ckF" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a5228"/><stop offset="1" stop-color="#4a2812"/></linearGradient></defs><rect x="6" y="6" width="88" height="88" rx="10" fill="url(#ckF)"/><rect x="11" y="11" width="78" height="78" rx="2" fill="#f0dcb3"/><path d="M11 11h19.5v19.5H11zM50 11h19.5v19.5H50zM30.5 30.5H50V50H30.5zM69.5 30.5H89V50H69.5zM11 50h19.5v19.5H11zM50 50h19.5v19.5H50zM30.5 69.5H50V89H30.5zM69.5 69.5H89V89H69.5z" fill="#8b5a2b"/><g><circle cx="41" cy="42" r="9" fill="#000" opacity=".35"/><circle cx="40" cy="40" r="8.5" fill="url(#ckB)"/><circle cx="40" cy="40" r="5" fill="none" stroke="#000" opacity=".5"/><circle cx="61" cy="62" r="9" fill="#000" opacity=".35"/><circle cx="60" cy="60" r="8.5" fill="url(#ckW)"/><circle cx="60" cy="60" r="5" fill="none" stroke="#8c7350" opacity=".6"/><circle cx="21" cy="82" r="9" fill="#000" opacity=".35"/><circle cx="20" cy="80" r="8.5" fill="url(#ckW)"/><path d="M15 82l1-6 2.5 3 1.5-4 1.5 4 2.5-3 1 6z" fill="#eab308" stroke="#713f12" stroke-width=".8"/></g></svg>',

  create: function (api) {
    var K = window.CheckersCore;
    var DIFF = [{ depth: 2, time: 300, noise: 60 }, { depth: 4, time: 800, noise: 10 }, { depth: 6, time: 1600, noise: 0 }, { depth: 9, time: 3000, noise: 0 }];
    var netQ = [], b, side, all, sel, seqs, step, cs, bx, by, t, anim, thinking, token = 0, phase, endT, quiet, last, winner;
    // v2.0: отмена хода и подсказка против компьютера
    var hist = [], undos = 0, hints = 0, hintM = null, ubtn = null, hbtn = null;
    function canUndo() { return api.mode === 0 && undos > 0 && hist.length && side === 1 && !thinking && !anim && phase === 'play'; }
    function canHint() { return api.mode === 0 && hints > 0 && side === 1 && !thinking && !anim && phase === 'play'; }

    function layout() {
      var size = Math.floor(Math.min(api.W - 28, api.H - 120) / 8) * 8;
      cs = size / 8; bx = Math.floor((api.W - size) / 2); by = Math.floor(56 + (api.H - 90 - size) / 2);
      boardCv = null; pcs = {};
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
    var boardCv = null, boardKey = '', pcs = {};
    function mkc(w, h) {
      var dpr = Math.min(2, window.devicePixelRatio || 1), o = document.createElement('canvas');
      o.width = Math.max(1, Math.ceil(w * dpr)); o.height = Math.max(1, Math.ceil(h * dpr));
      var oc = o.getContext('2d'); oc.scale(dpr, dpr); return { cv: o, c: oc, dpr: dpr };
    }
    function rrp(o, x, y, w, h, r) {
      o.beginPath(); o.moveTo(x + r, y); o.arcTo(x + w, y, x + w, y + h, r); o.arcTo(x + w, y + h, x, y + h, r);
      o.arcTo(x, y + h, x, y, r); o.arcTo(x, y, x + w, y, r); o.closePath();
    }
    function buildBoard() {
      var W = api.W, H = api.H, m = mkc(W, H), o = m.c, dpr = m.dpr, fl = flipped();
      boardKey = W + 'x' + H + ':' + cs + ':' + fl;
      woodFill(o, 0, 0, W, H, '#24150c', '#342011', 5, false, 0.8);
      var v = o.createRadialGradient(W / 2, by + cs * 4, cs * 2, W / 2, by + cs * 4, Math.max(W, H) * 0.8);
      v.addColorStop(0, 'rgba(255,190,120,.07)'); v.addColorStop(1, 'rgba(0,0,0,.6)');
      o.fillStyle = v; o.fillRect(0, 0, W, H);
      var S = cs * 8, F = Math.max(6, Math.min(Math.round(cs * 0.3), bx - 1)), fx = bx - F, fy = by - F, fs = S + F * 2;
      o.save(); o.shadowColor = 'rgba(0,0,0,.7)'; o.shadowBlur = 22; o.shadowOffsetY = 8;
      o.fillStyle = '#3b1f0e'; rrp(o, fx, fy, fs, fs, 8); o.fill(); o.restore();
      o.save(); rrp(o, fx, fy, fs, fs, 8); o.clip();
      woodFill(o, fx, fy, fs, fs, '#5a3016', '#7a4520', 23, false, 1.2);
      var bev = o.createLinearGradient(fx, fy, fx + fs, fy + fs);
      bev.addColorStop(0, 'rgba(255,220,170,.25)'); bev.addColorStop(0.5, 'rgba(0,0,0,0)'); bev.addColorStop(1, 'rgba(0,0,0,.35)');
      o.fillStyle = bev; o.fillRect(fx, fy, fs, fs); o.restore();
      o.strokeStyle = 'rgba(255,225,180,.3)'; o.lineWidth = 1; rrp(o, fx + 0.5, fy + 0.5, fs - 1, fs - 1, 8); o.stroke();
      o.strokeStyle = '#d4a056'; o.lineWidth = 1.5; o.strokeRect(bx - Math.min(4.5, F - 1.5), by - Math.min(4.5, F - 1.5), S + Math.min(9, F * 2 - 3), S + Math.min(9, F * 2 - 3));
      o.strokeStyle = 'rgba(0,0,0,.5)'; o.lineWidth = 1; o.strokeRect(bx - 0.5, by - 0.5, S + 1, S + 1);
      var tl = mkc(S, S), td = mkc(S, S);
      woodFill(tl.c, 0, 0, S, S, '#ead0a2', '#f5e1bb', 31, false, 0.7, 0);
      woodFill(td.c, 0, 0, S, S, '#7a4a22', '#94592a', 43, false, 1.2, 0);
      for (var i = 0; i < 64; i++) {
        var r = i >> 3, f = i & 7, dark = (r + f) % 2 === 1, x0 = bx + f * cs, y0 = by + r * cs;
        o.drawImage(dark ? td.cv : tl.cv, ((f * 3 + r * 5) % 8) * cs * dpr, ((r * 3 + f) % 8) * cs * dpr, cs * dpr, cs * dpr, x0, y0, cs, cs);
        var sg = o.createLinearGradient(x0, y0, x0 + cs, y0 + cs);
        sg.addColorStop(0, 'rgba(255,255,255,.07)'); sg.addColorStop(1, 'rgba(0,0,0,.08)');
        o.fillStyle = sg; o.fillRect(x0, y0, cs, cs);
      }
      var ins = o.createLinearGradient(0, by, 0, by + cs * 0.3);
      ins.addColorStop(0, 'rgba(0,0,0,.25)'); ins.addColorStop(1, 'rgba(0,0,0,0)'); o.fillStyle = ins; o.fillRect(bx, by, S, cs * 0.3);
      boardCv = m.cv;
    }
    function pieceCv(p) {
      if (pcs[p]) return pcs[p];
      var S = Math.ceil(cs * 1.1), m = mkc(S, S), o = m.c, x = S / 2, y = S / 2 - cs * 0.04, r = cs * 0.38, white = p > 0, i;
      // тень
      var sh = o.createRadialGradient(x + r * 0.08, y + r * 0.3, r * 0.5, x + r * 0.08, y + r * 0.3, r * 1.15);
      sh.addColorStop(0, 'rgba(0,0,0,.45)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
      o.fillStyle = sh; o.fillRect(0, 0, S, S);
      // бортик (толщина)
      var sd = o.createLinearGradient(x - r, 0, x + r, 0);
      if (white) { sd.addColorStop(0, '#d6c7a8'); sd.addColorStop(0.4, '#efe3c8'); sd.addColorStop(1, '#a8957a'); }
      else { sd.addColorStop(0, '#1c1917'); sd.addColorStop(0.4, '#3a3530'); sd.addColorStop(1, '#050404'); }
      o.fillStyle = sd; o.beginPath(); o.arc(x, y + r * 0.16, r, 0, 6.283); o.fill();
      o.fillRect(x - r, y, r * 2, r * 0.16);
      // насечки на бортике
      o.strokeStyle = white ? 'rgba(120,100,70,.45)' : 'rgba(0,0,0,.45)'; o.lineWidth = 1;
      for (i = 0; i < 18; i++) { var a = Math.PI * (i + 0.5) / 18; o.beginPath(); o.moveTo(x + Math.cos(a) * r * 0.98, y + Math.sin(a) * r * 0.98 + r * 0.02); o.lineTo(x + Math.cos(a) * r * 0.98, y + Math.sin(a) * r * 0.98 + r * 0.15); o.stroke(); }
      // верх
      var g = o.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r * 1.05);
      if (white) { g.addColorStop(0, '#fffdf6'); g.addColorStop(0.6, '#f1e6cf'); g.addColorStop(1, '#cdbb98'); }
      else { g.addColorStop(0, '#6b645c'); g.addColorStop(0.55, '#2c2824'); g.addColorStop(1, '#0c0a09'); }
      o.fillStyle = g; o.beginPath(); o.arc(x, y, r, 0, 6.283); o.fill();
      // кольца-канавки
      [0.74, 0.5].forEach(function (k) {
        o.strokeStyle = white ? 'rgba(140,115,80,.55)' : 'rgba(20,5,3,.6)'; o.lineWidth = 1.4;
        o.beginPath(); o.arc(x, y, r * k, 0, 6.283); o.stroke();
        o.strokeStyle = white ? 'rgba(255,255,255,.8)' : 'rgba(255,240,220,.18)'; o.lineWidth = 1;
        o.beginPath(); o.arc(x, y + 1, r * k, 0.2, Math.PI - 0.2); o.stroke();
      });
      // блик
      var hl = o.createRadialGradient(x - r * 0.4, y - r * 0.45, 0, x - r * 0.4, y - r * 0.45, r * 0.55);
      hl.addColorStop(0, 'rgba(255,255,255,' + (white ? 0.8 : 0.4) + ')'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      o.fillStyle = hl; o.beginPath(); o.arc(x, y, r, 0, 6.283); o.fill();
      o.strokeStyle = white ? 'rgba(90,70,40,.5)' : 'rgba(0,0,0,.6)'; o.lineWidth = 1; o.beginPath(); o.arc(x, y, r - 0.5, 0, 6.283); o.stroke();
      if (Math.abs(p) === 2) {
        var cg = o.createLinearGradient(0, y - r * 0.42, 0, y + r * 0.25);
        cg.addColorStop(0, '#fef08a'); cg.addColorStop(0.5, '#eab308'); cg.addColorStop(1, '#a16207');
        o.fillStyle = cg; o.strokeStyle = '#713f12'; o.lineWidth = 1.2; o.lineJoin = 'round';
        o.beginPath(); o.moveTo(x - r * 0.5, y + r * 0.25); o.lineTo(x - r * 0.55, y - r * 0.3); o.lineTo(x - r * 0.25, y - r * 0.05); o.lineTo(x, y - r * 0.42);
        o.lineTo(x + r * 0.25, y - r * 0.05); o.lineTo(x + r * 0.55, y - r * 0.3); o.lineTo(x + r * 0.5, y + r * 0.25); o.closePath(); o.fill(); o.stroke();
        o.fillStyle = '#ef4444'; o.beginPath(); o.arc(x, y + r * 0.06, r * 0.07, 0, 6.283); o.fill();
        o.fillStyle = '#fff'; [[-0.55, -0.3], [0, -0.42], [0.55, -0.3]].forEach(function (q) { o.beginPath(); o.arc(x + q[0] * r, y + q[1] * r, r * 0.05, 0, 6.283); o.fill(); });
      }
      pcs[p] = { cv: m.cv, S: S, oy: cs * 0.04 };
      return pcs[p];
    }
    function refresh() {
      all = K.moves(b, side);
      if (!all.length) { phase = 'over'; winner = -side; endT = 2.4; finish(); }
      else if (quiet >= 40) { phase = 'over'; winner = 0; endT = 2.4; finish(); }
    }
    function mySide() { return api.mode === 2 && api.net && api.net.side === 1 ? -1 : 1; }
    function flipped() { return mySide() === -1; }
    function remoteTurn() { return api.mode === 2 && side !== mySide() && phase === 'play'; }
    function finish() {
      if (api.mode === 2) { api.sound(winner === mySide() ? 'win' : winner === 0 ? 'point' : 'over'); return; }
      if (api.mode === 0) {
        if (winner === 1) { var left = b.filter(function (p) { return p > 0; }).length; api.addScore(1000 * (api.diff + 1) + left * 50); api.sound('win'); }
        else if (winner === 0) { api.addScore(300 * (api.diff + 1)); api.sound('point'); }
        else api.sound('over');
      } else api.sound('win');
    }
    function play(m, remote) {
      if (api.mode === 2 && !remote) api.net.send({ p: m.path });
      if (api.mode === 0 && side === 1) { hist.push({ b: b.slice(), quiet: quiet, last: last }); if (hist.length > 30) hist.shift(); }
      hintM = null;
      anim = { m: m, k: 0, piece: b[m.path[0]] };
      var nb = K.apply(b, m);
      quiet = m.caps.length || Math.abs(b[m.path[0]]) === 1 ? 0 : quiet + 1;
      b = nb; last = m;
      api.sound(m.caps.length ? 'stomp' : 'move'); api.vibrate(m.caps.length ? 25 : 8);
      if (m.caps.length > 1) api.toast('×' + m.caps.length);
      side = -side; sel = -1; seqs = null; step = 0;
      refresh();
    }
    function cpuTurn() { return api.mode === 0 && side === -1 && phase === 'play'; }
    function think() {
      thinking = true; var my = ++token;
      setTimeout(function () {
        if (my !== token) return;
        var d = DIFF[api.diff], m = K.search(b, -1, d.depth, d.time, d.noise);
        thinking = false;
        if (my === token && m) play(m);
      }, 80);
    }
    function sqXY(i) { if (flipped()) i = 63 - i; return [bx + (i & 7) * cs, by + (i >> 3) * cs]; }
    function drawPiece(c, x, y, p, alpha) {
      var pc = pieceCv(p);
      c.globalAlpha = alpha == null ? 1 : alpha;
      c.drawImage(pc.cv, x - pc.S / 2, y - pc.S / 2 + pc.oy, pc.S, pc.S);
      c.globalAlpha = 1;
    }

    return {
      reset: function () {
        token++;
        b = K.initial(); side = 1; sel = -1; seqs = null; step = 0; t = 0; anim = null; thinking = false; phase = 'play'; endT = 0; quiet = 0; last = null; winner = null; netQ = [];
        hist = []; undos = [99, 3, 1, 0][api.diff]; hints = [5, 3, 1, 0][api.diff]; hintM = null;
        layout(); refresh();
      },
      destroy: function () { token++; },
      debug: function () { return { b: b, side: side, phase: phase, auto: function () { if (api.mode === 2 && !remoteTurn() && phase === 'play' && !anim && all.length) play(all[Math.floor(Math.random() * all.length)]); } }; },
      netMsg: function (d) { netQ.push(d); },
      resize: layout,
      idle: function (dt) { t += dt; },
      key: function () { },
      input: function (type, d) {
        if (type !== 'tap' || phase !== 'play' || thinking || anim || cpuTurn() || remoteTurn()) return;
        function inR(R) { return R && d.x > R[0] && d.x < R[0] + R[2] && d.y > R[1] && d.y < R[1] + R[3]; }
        if (canUndo() && inR(ubtn)) {
          var h = hist.pop(); b = h.b; quiet = h.quiet; last = h.last; side = 1; sel = -1; seqs = null; step = 0; undos--; hintM = null;
          refresh(); api.sound('rotate'); return;
        }
        if (canHint() && inR(hbtn)) {
          hints--; api.sound('bonus');
          var hm = K.search(b, 1, 5, 600, 0);
          if (hm) { hintM = { m: hm, life: 4 }; sel = hm.path[0]; seqs = all.filter(function (q) { return q.path[0] === sel; }); step = 0; }
          return;
        }
        var c = Math.floor((d.x - bx) / cs), r = Math.floor((d.y - by) / cs);
        if (c < 0 || r < 0 || c > 7 || r > 7) return;
        var i = r * 8 + c; if (flipped()) i = 63 - i;
        if (seqs) {
          var nx = seqs.filter(function (m) { return m.path[step + 1] === i; });
          if (nx.length) {
            step++; seqs = nx;
            var done = seqs.filter(function (m) { return m.path.length === step + 1; });
            if (done.length) play(done[0]); else api.sound('move');
            return;
          }
          if (step > 0) return; // посреди серии взятий выбор фигуры не меняем
        }
        var mine = all.filter(function (m) { return m.path[0] === i; });
        if (mine.length) { sel = i; seqs = mine; step = 0; api.sound('click'); }
        else if (b[i] * side > 0 && all[0].caps.length) { api.toast(api.t('checkers.must')); api.sound('hit'); }
        else { sel = -1; seqs = null; }
      },
      update: function (dt) {
        t += dt;
        if (anim) { anim.k += dt / (0.16 * (anim.m.path.length - 1)); if (anim.k >= 1) anim = null; }
        if (hintM) { hintM.life -= dt; if (hintM.life <= 0) hintM = null; }
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (cpuTurn() && !thinking && !anim) think();
        if (remoteTurn() && netQ.length && !anim) {
          var nd = netQ.shift(), key = nd.p.join(',');
          var lm = all.filter(function (m) { return m.path.join(',') === key; })[0];
          if (lm) play(lm, true);
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        if (!boardCv || boardKey !== W + 'x' + H + ':' + cs + ':' + flipped()) buildBoard();
        c.drawImage(boardCv, 0, 0, W, H);
        if (last) for (var i = 0; i < 64; i++) if (last.path.indexOf(i) >= 0) { var xy = sqXY(i); c.fillStyle = 'rgba(250,204,21,.25)'; c.fillRect(xy[0], xy[1], cs, cs); }
        // кто может ходить
        if (!cpuTurn() && phase === 'play' && !seqs && all.length && all[0].caps.length) {
          all.forEach(function (m) { var z = sqXY(m.path[0]); c.strokeStyle = 'rgba(239,68,68,' + (0.5 + 0.4 * Math.sin(t * 6)) + ')'; c.lineWidth = 3; c.strokeRect(z[0] + 2, z[1] + 2, cs - 4, cs - 4); });
        }
        var hideFrom = anim ? anim.m.path[anim.m.path.length - 1] : -1;
        var curCaps = seqs && step > 0 ? seqs[0].caps.slice(0, step) : [];
        var movingFrom = seqs && step > 0 ? sel : -1;
        for (var j = 0; j < 64; j++) {
          if (!b[j] || j === hideFrom || j === movingFrom) continue;
          var q = sqXY(j);
          drawPiece(c, q[0] + cs / 2, q[1] + cs / 2, b[j], curCaps.indexOf(j) >= 0 ? 0.35 : 1);
        }
        if (seqs && step > 0) { var sp = sqXY(seqs[0].path[step]); drawPiece(c, sp[0] + cs / 2, sp[1] + cs / 2, b[sel]); }
        if (anim) {
          var path = anim.m.path, segs = path.length - 1, kk = Math.min(0.999, anim.k) * segs, si = Math.floor(kk), f = kk - si;
          var a = sqXY(path[si]), z2 = sqXY(path[si + 1]);
          var lift = Math.sin(f * Math.PI) * cs * 0.25;
          drawPiece(c, a[0] + (z2[0] - a[0]) * f + cs / 2, a[1] + (z2[1] - a[1]) * f + cs / 2 - lift, b[path[path.length - 1]]);
        }
        if (sel >= 0 && seqs) {
          var z = sqXY(seqs[0].path[step]);
          c.strokeStyle = '#22c55e'; c.lineWidth = 3; c.strokeRect(z[0] + 2, z[1] + 2, cs - 4, cs - 4);
          var shown = {};
          seqs.forEach(function (m) {
            var nx = m.path[step + 1]; if (nx == null || shown[nx]) return; shown[nx] = 1;
            var p2 = sqXY(nx);
            c.fillStyle = 'rgba(34,197,94,.6)'; c.beginPath(); c.arc(p2[0] + cs / 2, p2[1] + cs / 2, cs * 0.16, 0, 6.283); c.fill();
          });
        }
        // счёт фигур и статус
        var wN = b.filter(function (p) { return p > 0; }).length, bN = b.filter(function (p) { return p < 0; }).length;
        var two = api.mode === 1;
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '800 16px system-ui, sans-serif';
        var msg;
        if (phase === 'over') msg = winner === 0 ? api.t('g.draw') : two ? api.t(winner === 1 ? 'g.p1win' : 'g.p2win') : api.t(winner === mySide() ? 'g.win' : 'g.lose');
        else if (api.mode === 2) msg = api.t(side === mySide() ? 'g.yourTurn' : 'net.oppTurn');
        else if (thinking) msg = api.t('g.thinking');
        else msg = two ? api.t(side === 1 ? 'chess.white' : 'chess.black') : api.t(side === 1 ? 'g.yourTurn' : 'g.cpuTurn');
        c.fillStyle = phase === 'over' ? '#fde047' : '#fde68a'; c.fillText(msg, W / 2, 24);
        c.font = '800 14px system-ui, sans-serif';
        drawPiece(c, 26, H - 22, 1); c.fillStyle = '#fff'; c.textAlign = 'left'; c.fillText('× ' + wN, 44, H - 22);
        drawPiece(c, W - 70, H - 22, -1); c.fillText('× ' + bN, W - 52, H - 22);
        if (hintM) {
          hintM.m.path.forEach(function (sq, n) {
            var z = sqXY(sq); c.strokeStyle = 'rgba(253,224,71,' + Math.min(1, hintM.life) + ')'; c.lineWidth = 4; c.strokeRect(z[0] + 2, z[1] + 2, cs - 4, cs - 4);
          });
        }
        ubtn = hbtn = null;
        c.textAlign = 'center'; c.font = '800 13px system-ui, sans-serif';
        if (canUndo()) {
          ubtn = [W / 2 + 6, H - 40, 96, 34];
          c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.roundRect ? c.roundRect(ubtn[0], ubtn[1], ubtn[2], ubtn[3], 17) : c.rect(ubtn[0], ubtn[1], ubtn[2], ubtn[3]); c.fill();
          c.fillStyle = '#fde68a'; c.fillText('↶ ' + (undos < 50 ? undos : ''), ubtn[0] + ubtn[2] / 2, ubtn[1] + 18);
        }
        if (canHint()) {
          hbtn = [W / 2 - 102, H - 40, 96, 34];
          c.fillStyle = 'rgba(253,224,71,.2)'; c.beginPath(); c.roundRect ? c.roundRect(hbtn[0], hbtn[1], hbtn[2], hbtn[3], 17) : c.rect(hbtn[0], hbtn[1], hbtn[2], hbtn[3]); c.fill();
          c.fillStyle = '#fde047'; c.fillText('💡 ' + hints, hbtn[0] + hbtn[2] / 2, hbtn[1] + 18);
        }
      }
    };
  }
};
