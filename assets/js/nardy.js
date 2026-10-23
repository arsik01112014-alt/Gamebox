/* Нарды (короткие, правила бэкгаммона) */
window.GAMES = window.GAMES || {};
window.NardyCore = (function () {
  // состояние: pts[1..24] (+ белые, − чёрные), bar[0] белые, bar[1] чёрные, off[0], off[1]
  // белые идут 24 → 1, чёрные 1 → 24. Ход: {f, t, d}; f=25/0 — с бара, t=0/25 — выброс
  function initial() {
    var p = []; for (var i = 0; i <= 25; i++) p.push(0);
    p[24] = 2; p[13] = 5; p[8] = 3; p[6] = 5;
    p[1] = -2; p[12] = -5; p[17] = -3; p[19] = -5;
    return { p: p, bar: [0, 0], off: [0, 0] };
  }
  function clone(s) { return { p: s.p.slice(), bar: s.bar.slice(), off: s.off.slice() }; }
  function allHome(s, w) {
    if (s.bar[w ? 0 : 1]) return false;
    for (var i = 1; i <= 24; i++) {
      if (w && s.p[i] > 0 && i > 6) return false;
      if (!w && s.p[i] < 0 && i < 19) return false;
    }
    return true;
  }
  function singleMoves(s, w, d) {
    var out = [], sg = w ? 1 : -1;
    if (s.bar[w ? 0 : 1] > 0) {
      var to = w ? 25 - d : d;
      if (s.p[to] * sg >= -1) out.push({ f: w ? 25 : 0, t: to, d: d });
      return out;
    }
    var home = allHome(s, w);
    for (var f = 1; f <= 24; f++) {
      if (s.p[f] * sg <= 0) continue;
      var t = w ? f - d : f + d;
      if (t >= 1 && t <= 24) { if (s.p[t] * sg >= -1) out.push({ f: f, t: t, d: d }); }
      else if (home) {
        var exact = w ? t === 0 : t === 25, ok = exact;
        if (!exact) { // можно выбросить с меньшим числом, только если нет шашек дальше
          ok = true;
          if (w) { for (var k = f + 1; k <= 6; k++) if (s.p[k] > 0) ok = false; }
          else { for (var k2 = f - 1; k2 >= 19; k2--) if (s.p[k2] < 0) ok = false; }
        }
        if (ok) out.push({ f: f, t: w ? 0 : 25, d: d });
      }
    }
    return out;
  }
  function apply(s, m, w) {
    var n = clone(s), sg = w ? 1 : -1;
    if (m.f === 25 || (m.f === 0 && !w)) n.bar[w ? 0 : 1]--; else n.p[m.f] -= sg;
    if (m.t === 0 || m.t === 25) { n.off[w ? 0 : 1]++; return n; }
    if (n.p[m.t] === -sg) { n.p[m.t] = 0; n.bar[w ? 1 : 0]++; m.hit = true; }
    n.p[m.t] += sg;
    return n;
  }
  // все допустимые последовательности (по правилу максимального использования костей)
  function sequences(s, w, dice) {
    var ds = dice[0] === dice[1] ? [dice[0], dice[0], dice[0], dice[0]] : dice.slice();
    var res = [], seen = {};
    function rec(st, remaining, seq) {
      var any = false, tried = {};
      for (var i = 0; i < remaining.length; i++) {
        var d = remaining[i];
        if (tried[d]) continue; tried[d] = 1;
        var ms = singleMoves(st, w, d);
        for (var j = 0; j < ms.length; j++) {
          any = true;
          var m = ms[j], ns = apply(st, m, w), rest = remaining.slice(); rest.splice(i, 1);
          rec(ns, rest, seq.concat([m]));
        }
      }
      if (!any) {
        var key = seq.map(function (m) { return m.f + '>' + m.t; }).join(',');
        if (!seen[key]) { seen[key] = 1; res.push({ seq: seq, st: st }); }
      }
    }
    rec(s, ds, []);
    var max = 0; res.forEach(function (r) { max = Math.max(max, r.seq.length); });
    res = res.filter(function (r) { return r.seq.length === max; });
    if (max === 1 && dice[0] !== dice[1]) {
      var big = Math.max(dice[0], dice[1]);
      if (res.some(function (r) { return r.seq[0].d === big; })) res = res.filter(function (r) { return r.seq[0].d === big; });
    }
    return res;
  }
  function pips(s, w) {
    var n = 0;
    for (var i = 1; i <= 24; i++) { if (w && s.p[i] > 0) n += s.p[i] * i; if (!w && s.p[i] < 0) n += -s.p[i] * (25 - i); }
    return n + s.bar[w ? 0 : 1] * 25;
  }
  function evaluate(s, w, strong) { // больше — лучше для w
    var me = w, sg = w ? 1 : -1, v = 0;
    v += (pips(s, !me) - pips(s, me)) * 1.0;
    v += (s.off[me ? 0 : 1] - s.off[me ? 1 : 0]) * 12;
    v += s.bar[me ? 1 : 0] * 22 - s.bar[me ? 0 : 1] * 22;
    var oppBehind = function (pt) { // есть ли у соперника шашки, которые могут ударить
      for (var i = 1; i <= 24; i++) {
        var c = s.p[i];
        if (c * sg < 0) { var dist = me ? i - pt : pt - i; if (dist < 0 && -dist <= 12) return true; }
      }
      return s.bar[me ? 1 : 0] > 0;
    };
    var run = 0, prime = 0;
    for (var p = 1; p <= 24; p++) {
      var c = s.p[p] * sg;
      if (c === 1 && oppBehind(p)) v -= strong ? 14 : 8;
      if (c >= 2) {
        run++; prime = Math.max(prime, run);
        var homePt = me ? p <= 6 : p >= 19;
        v += homePt ? (strong ? 9 : 6) : 3;
      } else run = 0;
    }
    v += prime * prime * (strong ? 2 : 1);
    return v;
  }
  return { initial: initial, sequences: sequences, apply: apply, singleMoves: singleMoves, evaluate: evaluate, pips: pips, allHome: allHome };
})();

window.GAMES.nardy = {
  title: 'Нарды',
  colors: ['#92400e', '#065f46'],
  controls: 'none',
  modes: true,
  lan: true,
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="ndF" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a5228"/><stop offset="1" stop-color="#4a2812"/></linearGradient><linearGradient id="ndR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5f1414"/><stop offset="1" stop-color="#9b2a22"/></linearGradient><linearGradient id="ndG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04402f"/><stop offset="1" stop-color="#0b7a58"/></linearGradient><linearGradient id="ndD" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#cfc6b4"/></linearGradient></defs><rect x="8" y="12" width="84" height="76" rx="8" fill="url(#ndF)"/><rect x="14" y="18" width="72" height="64" rx="3" fill="#ecd3a2"/><path d="M14 18l6 28 6-28zM38 18l6 28 6-28zM62 18l6 28 6-28zM20 82l6-28 6 28zM68 82l6-28 6 28z" fill="url(#ndG)"/><path d="M26 18l6 28 6-28zM74 18l6 28 6-28zM32 82l6-28 6 28zM56 82l6-28 6 28z" fill="url(#ndR)"/><rect x="48" y="18" width="4" height="64" fill="#5e3417"/><rect x="48" y="18" width="1" height="64" fill="#fff" opacity=".2"/><rect x="35" y="42" width="14" height="14" rx="3" fill="#000" opacity=".35"/><rect x="33" y="40" width="14" height="14" rx="3" fill="url(#ndD)" stroke="#8c8270" stroke-width=".8"/><rect x="56" y="46" width="14" height="14" rx="3" fill="#000" opacity=".35"/><rect x="54" y="44" width="14" height="14" rx="3" fill="url(#ndD)" stroke="#8c8270" stroke-width=".8"/><circle cx="40" cy="47" r="2" fill="#dc2626"/><circle cx="58" cy="48" r="1.7" fill="#111"/><circle cx="64" cy="54" r="1.7" fill="#111"/><circle cx="20" cy="74" r="5.5" fill="#fffdf6" stroke="#8c7350"/><circle cx="18.5" cy="72.5" r="1.8" fill="#fff"/><circle cx="80" cy="26" r="5.5" fill="#2c2824" stroke="#000"/><circle cx="78.5" cy="24.5" r="1.6" fill="#6b645c"/></svg>',

  create: function (api) {
    var N = window.NardyCore;
    var netQ = [], s, white, dice, rolled, seqs, played, sel, phase, endT, t, cpuT, cpuQ, anim, msgT, rollAnim, winner, geo;
    // v2.0: подсказка лучшего хода против компьютера
    var hints = 0, hintM = null, hbtn = null;
    function canHint() { return api.mode === 0 && hints > 0 && white && rolled && phase === 'play' && !anim && nextOptions().length; }
    function giveHint() {
      var k = played.length, best = null, bv = -1e9;
      seqs.forEach(function (r) {
        for (var i = 0; i < k; i++) if (r.seq[i].f !== played[i].f || r.seq[i].t !== played[i].t || r.seq[i].d !== played[i].d) return;
        if (!r.seq[k]) return;
        var v = N.evaluate(r.st, true, true);
        if (v > bv) { bv = v; best = r.seq[k]; }
      });
      if (!best) return;
      hints--; hintM = { m: best, life: 4 }; sel = best.f; api.sound('bonus');
    }
    // геометрия: правый столбец — пункты 1..12 снизу вверх, левый — 13..24 сверху вниз
    function layout() {
      var W = api.W, H = api.H, top = 52, bottom = 92;
      var bw = W - 16, bh = H - top - bottom;
      geo = { x: 8, y: top, w: bw, h: bh, bar: 40 };
      geo.ph = (bh - geo.bar) / 12;
      geo.cw = bw / 2;
      geo.r = Math.min(geo.ph * 0.46, geo.cw / 12.5);
      boardCv = null; chk = {};
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
    var boardCv = null, boardKey = '', chk = {};
    function mkc(w, h) {
      var dpr = Math.min(2, window.devicePixelRatio || 1), o = document.createElement('canvas');
      o.width = Math.max(1, Math.ceil(w * dpr)); o.height = Math.max(1, Math.ceil(h * dpr));
      var oc = o.getContext('2d'); oc.scale(dpr, dpr); return { cv: o, c: oc };
    }
    function buildBoard() {
      var W = api.W, H = api.H, g = geo, m = mkc(W, H), o = m.c, p;
      boardKey = W + 'x' + H;
      woodFill(o, 0, 0, W, H, '#26170c', '#352113', 9, false, 0.8);
      var v = o.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); o.fillStyle = v; o.fillRect(0, 0, W, H);
      // корпус
      o.save(); o.shadowColor = 'rgba(0,0,0,.7)'; o.shadowBlur = 20; o.shadowOffsetY = 6;
      o.fillStyle = '#4a2812'; o.fillRect(g.x - 7, g.y - 7, g.w + 14, g.h + 14); o.restore();
      woodFill(o, g.x - 7, g.y - 7, g.w + 14, g.h + 14, '#5e3417', '#7d4822', 13, true, 1.2);
      var bev = o.createLinearGradient(g.x - 7, g.y - 7, g.x + g.w + 7, g.y + g.h + 7);
      bev.addColorStop(0, 'rgba(255,220,170,.22)'); bev.addColorStop(0.5, 'rgba(0,0,0,0)'); bev.addColorStop(1, 'rgba(0,0,0,.35)');
      o.fillStyle = bev; o.fillRect(g.x - 7, g.y - 7, g.w + 14, g.h + 14);
      // игровое поле: светлое дерево
      woodFill(o, g.x, g.y, g.w, g.h, '#e3c58e', '#efd6a6', 19, true, 0.8, 0);
      var ins = o.createLinearGradient(g.x, 0, g.x + 10, 0); ins.addColorStop(0, 'rgba(0,0,0,.25)'); ins.addColorStop(1, 'rgba(0,0,0,0)');
      o.fillStyle = ins; o.fillRect(g.x, g.y, 10, g.h);
      var ins2 = o.createLinearGradient(0, g.y, 0, g.y + 8); ins2.addColorStop(0, 'rgba(0,0,0,.25)'); ins2.addColorStop(1, 'rgba(0,0,0,0)');
      o.fillStyle = ins2; o.fillRect(g.x, g.y, g.w, 8);
      // пункты-треугольники
      for (p = 1; p <= 24; p++) {
        var rc = ptRect(p), dark = p % 2 === 0, tip = rc.right ? rc.x + rc.w * 0.12 : rc.x + rc.w * 0.88, base = rc.right ? rc.x + rc.w : rc.x;
        var tg = o.createLinearGradient(base, 0, tip, 0);
        if (dark) { tg.addColorStop(0, '#5f1414'); tg.addColorStop(1, '#9b2a22'); } else { tg.addColorStop(0, '#04402f'); tg.addColorStop(1, '#0b7a58'); }
        o.fillStyle = tg;
        o.beginPath(); o.moveTo(base, rc.y + 1); o.lineTo(tip, rc.y + rc.h / 2); o.lineTo(base, rc.y + rc.h - 1); o.closePath(); o.fill();
        o.strokeStyle = 'rgba(212,160,86,.55)'; o.lineWidth = 0.8; o.stroke();
        // центральная прожилка
        o.strokeStyle = 'rgba(255,255,255,.08)'; o.beginPath(); o.moveTo(base, rc.y + rc.h / 2); o.lineTo(tip, rc.y + rc.h / 2); o.stroke();
      }
      // бар и ось
      var byy = g.y + 6 * g.ph;
      o.save(); o.shadowColor = 'rgba(0,0,0,.5)'; o.shadowBlur = 8;
      woodFill(o, g.x, byy, g.w, g.bar, '#5a3216', '#7a4520', 27, false, 1.1);
      o.restore();
      var bg2 = o.createLinearGradient(0, byy, 0, byy + g.bar);
      bg2.addColorStop(0, 'rgba(255,220,170,.25)'); bg2.addColorStop(0.15, 'rgba(0,0,0,0)'); bg2.addColorStop(0.85, 'rgba(0,0,0,0)'); bg2.addColorStop(1, 'rgba(0,0,0,.4)');
      o.fillStyle = bg2; o.fillRect(g.x, byy, g.w, g.bar);
      o.fillStyle = 'rgba(0,0,0,.35)'; o.fillRect(g.x + g.cw - 2, g.y, 4, g.h);
      o.fillStyle = 'rgba(255,220,170,.18)'; o.fillRect(g.x + g.cw - 2, g.y, 1, g.h);
      // латунные петли
      [g.x + 18, g.x + g.w - 18].forEach(function (hx) {
        var hg = o.createLinearGradient(0, byy + 8, 0, byy + g.bar - 8);
        hg.addColorStop(0, '#fde68a'); hg.addColorStop(0.5, '#b8862b'); hg.addColorStop(1, '#6b4a12');
        o.fillStyle = hg; o.fillRect(hx - 6, byy + 8, 12, g.bar - 16);
        o.fillStyle = 'rgba(0,0,0,.4)'; o.beginPath(); o.arc(hx, byy + 12, 1.3, 0, 6.283); o.arc(hx, byy + g.bar - 12, 1.3, 0, 6.283); o.fill();
      });
      // лоток выброса
      var ty = g.y + g.h + 10;
      o.fillStyle = '#2a170b'; o.fillRect(g.x, ty, g.w, 42);
      woodFill(o, g.x + 3, ty + 3, g.w - 6, 36, '#3a2010', '#4a2a15', 33, false, 0.9, 0);
      var tsh = o.createLinearGradient(0, ty + 3, 0, ty + 14); tsh.addColorStop(0, 'rgba(0,0,0,.5)'); tsh.addColorStop(1, 'rgba(0,0,0,0)');
      o.fillStyle = tsh; o.fillRect(g.x + 3, ty + 3, g.w - 6, 11);
      boardCv = m.cv;
    }
    function checkerCv(w) {
      var k = w ? 'w' : 'b'; if (chk[k]) return chk[k];
      var r = geo.r, S = Math.ceil(r * 2 + 8), mm = mkc(S, S), o = mm.c, x = S / 2 - 1, y = S / 2 - 1;
      o.fillStyle = 'rgba(0,0,0,.4)'; o.beginPath(); o.arc(x + 1.5, y + 2.2, r, 0, 6.283); o.fill();
      var g = o.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.05, x, y, r);
      if (w) { g.addColorStop(0, '#fffdf6'); g.addColorStop(0.65, '#ece2cc'); g.addColorStop(1, '#bfae8c'); }
      else { g.addColorStop(0, '#6b645c'); g.addColorStop(0.6, '#2c2824'); g.addColorStop(1, '#0c0a09'); }
      o.fillStyle = g; o.beginPath(); o.arc(x, y, r, 0, 6.283); o.fill();
      o.strokeStyle = w ? 'rgba(120,95,60,.6)' : 'rgba(0,0,0,.7)'; o.lineWidth = 1; o.beginPath(); o.arc(x, y, r - 0.5, 0, 6.283); o.stroke();
      [0.68, 0.38].forEach(function (q) {
        o.strokeStyle = w ? 'rgba(140,115,80,.55)' : 'rgba(0,0,0,.6)'; o.lineWidth = 1.1; o.beginPath(); o.arc(x, y, r * q, 0, 6.283); o.stroke();
        o.strokeStyle = w ? 'rgba(255,255,255,.75)' : 'rgba(255,240,220,.16)'; o.lineWidth = 0.8; o.beginPath(); o.arc(x, y + 0.8, r * q, 0.3, Math.PI - 0.3); o.stroke();
      });
      var hl = o.createRadialGradient(x - r * 0.4, y - r * 0.45, 0, x - r * 0.4, y - r * 0.45, r * 0.6);
      hl.addColorStop(0, 'rgba(255,255,255,' + (w ? 0.75 : 0.35) + ')'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      o.fillStyle = hl; o.beginPath(); o.arc(x, y, r, 0, 6.283); o.fill();
      chk[k] = { cv: mm.cv, S: S };
      return chk[k];
    }
    function ptRect(p) { // прямоугольник ряда пункта
      var g = geo, right = p <= 12, k = right ? p - 1 : 24 - p; // k: 0 — снизу
      var row = 11 - k; // строка сверху
      var y = g.y + row * g.ph + (row >= 6 ? g.bar : 0);
      return { x: right ? g.x + g.cw : g.x, y: y, w: g.cw, h: g.ph, right: right };
    }
    function checkerPos(p, idx, count) {
      var rc = ptRect(p), step = Math.min(geo.r * 2, (geo.cw - geo.r * 2 - 6) / Math.max(1, count - 1));
      var x = rc.right ? rc.x + rc.w - geo.r - 3 - idx * step : rc.x + geo.r + 3 + idx * step;
      return { x: x, y: rc.y + rc.h / 2 };
    }
    function turnSide() { return white ? 0 : 1; }
    function isCpu() { return api.mode === 0 && !white; }
    function myWhite() { return !(api.mode === 2 && api.net && api.net.side === 1); }
    function remoteTurn() { return api.mode === 2 && white !== myWhite(); }
    function roll(forced) {
      dice = forced || [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
      if (api.mode === 2 && !forced) api.net.send({ k: 'roll', d: dice });
      rolled = true; rollAnim = 0.5; played = [];
      seqs = N.sequences(s, white, dice);
      api.sound('rotate'); api.vibrate(15);
      if (!seqs.length || !seqs[0].seq.length) { msgT = 1.4; phase = 'nomove'; }
      else if (isCpu()) planCpu();
    }
    function remainingDice() {
      var ds = dice[0] === dice[1] ? [dice[0], dice[0], dice[0], dice[0]] : dice.slice();
      played.forEach(function (m) { var i = ds.indexOf(m.d); if (i >= 0) ds.splice(i, 1); });
      return ds;
    }
    function nextOptions() {
      var k = played.length, opts = [];
      seqs.forEach(function (r) {
        for (var i = 0; i < k; i++) if (r.seq[i].f !== played[i].f || r.seq[i].t !== played[i].t || r.seq[i].d !== played[i].d) return;
        if (r.seq[k]) opts.push(r.seq[k]);
      });
      return opts;
    }
    function doMove(m, remote) {
      if (api.mode === 2 && !remote) api.net.send({ k: 'mv', f: m.f, t: m.t, d: m.d });
      var from = m.f, before = s; hintM = null;
      s = N.apply(s, m, white);
      played.push(m);
      anim = { m: m, k: 0, w: white };
      api.sound(m.hit ? 'stomp' : m.t === 0 || m.t === 25 ? 'coin' : 'move'); api.vibrate(m.hit ? 30 : 8);
      sel = null;
      if (s.off[turnSide()] >= 15) { phase = 'over'; winner = white; endT = 2.6; finish(); return; }
      if (!nextOptions().length) { phase = 'wait'; msgT = 0.5; }
    }
    function finish() {
      var loserOff = s.off[white ? 1 : 0], gammon = loserOff === 0 ? 2 : 1;
      if (api.mode === 2) { api.sound(winner === myWhite() ? 'win' : 'over'); return; }
      if (api.mode === 0) {
        if (winner) { api.addScore((1000 * (api.diff + 1) + N.pips(s, false) * 3) * gammon); api.sound('win'); if (gammon > 1) api.toast(api.t('nardy.mars')); }
        else api.sound('over');
      } else api.sound('win');
    }
    function endTurn() { white = !white; rolled = false; played = []; seqs = null; sel = null; phase = 'play'; if (isCpu()) cpuT = 0.7; }
    function planCpu() {
      var best = null, bv = -1e9, strong = api.diff >= 2, noise = [60, 18, 4, 0][api.diff];
      seqs.forEach(function (r) {
        var v = N.evaluate(r.st, false, strong) + (Math.random() - 0.5) * noise;
        if (v > bv) { bv = v; best = r; }
      });
      cpuQ = best.seq.slice(); cpuT = 0.6;
    }
    function hitTest(x, y) {
      for (var p = 1; p <= 24; p++) { var rc = ptRect(p); if (x >= rc.x && x <= rc.x + rc.w && y >= rc.y && y <= rc.y + rc.h) return p; }
      var g = geo;
      if (y > g.y + g.h + 4 && y < g.y + g.h + 54) return 'off';
      if (y > g.y + 6 * g.ph && y < g.y + 6 * g.ph + g.bar) return 'bar';
      return null;
    }
    function drawChecker(c, x, y, w, glow) {
      var r = geo.r, sp = checkerCv(w);
      c.drawImage(sp.cv, x - sp.S / 2 + 1, y - sp.S / 2 + 1, sp.S, sp.S);
      if (glow) { c.strokeStyle = '#22c55e'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r + 2, 0, 6.283); c.stroke(); }
    }
    function drawDie(c, x, y, sz, v, used) {
      c.save(); c.globalAlpha = used ? 0.35 : 1;
      var rr = sz * 0.2;
      function dp() { c.beginPath(); c.moveTo(x + rr, y); c.arcTo(x + sz, y, x + sz, y + sz, rr); c.arcTo(x + sz, y + sz, x, y + sz, rr); c.arcTo(x, y + sz, x, y, rr); c.arcTo(x, y, x + sz, y, rr); c.closePath(); }
      c.fillStyle = 'rgba(0,0,0,.4)'; c.save(); c.translate(2, 3); dp(); c.fill(); c.restore();
      var dg = c.createLinearGradient(x, y, x + sz, y + sz);
      dg.addColorStop(0, '#ffffff'); dg.addColorStop(0.6, '#f1ece2'); dg.addColorStop(1, '#cfc6b4');
      c.fillStyle = dg; c.strokeStyle = '#8c8270'; c.lineWidth = 1; dp(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(x + rr, y + 1.5, sz - rr * 2, 1.5);
      var P = { 1: [[0.5, 0.5]], 2: [[0.28, 0.28], [0.72, 0.72]], 3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]], 4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
        5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]], 6: [[0.28, 0.22], [0.72, 0.22], [0.28, 0.5], [0.72, 0.5], [0.28, 0.78], [0.72, 0.78]] }[v];
      c.fillStyle = v === 1 ? '#dc2626' : '#1c1917';
      P.forEach(function (q) { c.beginPath(); c.arc(x + q[0] * sz, y + q[1] * sz, sz * 0.09, 0, 6.283); c.fill(); });
      c.fillStyle = 'rgba(255,255,255,.55)';
      P.forEach(function (q) { c.beginPath(); c.arc(x + q[0] * sz + sz * 0.02, y + q[1] * sz + sz * 0.035, sz * 0.04, 0, 6.283); c.fill(); });
      c.restore();
    }

    return {
      reset: function () {
        s = N.initial(); white = true; dice = [0, 0]; rolled = false; seqs = null; played = []; sel = null;
        phase = 'play'; endT = 0; t = 0; cpuT = 0; cpuQ = null; anim = null; msgT = 0; rollAnim = 0; winner = null; netQ = [];
        hints = [99, 5, 2, 0][api.diff]; hintM = null;
        layout();
      },
      resize: layout,
      netMsg: function (d) { netQ.push(d); },
      debug: function () { return { s: s, white: white, phase: phase, auto: function () { if (api.mode !== 2 || remoteTurn() || anim || phase !== 'play') return; if (!rolled) { roll(); return; } var o = nextOptions(); if (o.length) doMove(o[0]); } }; },
      idle: function (dt) { t += dt; },
      key: function () { },
      input: function (type, d) {
        if (type !== 'tap' || phase !== 'play' || isCpu() || remoteTurn() || anim) return;
        if (hbtn && canHint() && d.x > hbtn[0] && d.x < hbtn[0] + hbtn[2] && d.y > hbtn[1] && d.y < hbtn[1] + hbtn[3]) { giveHint(); return; }
        if (!rolled) { roll(); return; }
        var h = hitTest(d.x, d.y), opts = nextOptions();
        if (h == null) { sel = null; return; }
        var fromKey = h === 'bar' ? (white ? 25 : 0) : h;
        if (sel != null) {
          var to = h === 'off' ? (white ? 0 : 25) : h;
          var cand = opts.filter(function (m) { return m.f === sel && m.t === to; });
          if (cand.length) { cand.sort(function (a, b) { return a.d - b.d; }); doMove(cand[0]); return; }
        }
        if (opts.some(function (m) { return m.f === fromKey; })) { sel = fromKey; api.sound('click'); }
        else sel = null;
      },
      update: function (dt) {
        t += dt;
        if (rollAnim > 0) rollAnim -= dt;
        if (hintM) { hintM.life -= dt; if (hintM.life <= 0) hintM = null; }
        if (anim) { anim.k += dt / 0.25; if (anim.k >= 1) anim = null; }
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (phase === 'nomove' || phase === 'wait') { msgT -= dt; if (msgT <= 0 && !anim) endTurn(); return; }
        if (remoteTurn() && phase === 'play' && !anim && netQ.length) {
          var nd = netQ[0];
          if (nd.k === 'roll' && !rolled) { netQ.shift(); roll(nd.d); }
          else if (nd.k === 'mv' && rolled) {
            netQ.shift();
            var lm = nextOptions().filter(function (m) { return m.f === nd.f && m.t === nd.t && m.d === nd.d; })[0];
            if (lm) doMove(lm, true);
          } else netQ.shift();
        }
        if (isCpu() && phase === 'play' && !anim) {
          cpuT -= dt;
          if (cpuT > 0) return;
          if (!rolled) { roll(); cpuT = 0.7; return; }
          if (cpuQ && cpuQ.length) { doMove(cpuQ.shift()); cpuT = 0.45; }
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H, g = geo;
        if (!boardCv || boardKey !== W + 'x' + H) buildBoard();
        c.drawImage(boardCv, 0, 0, W, H);
        var opts = rolled && !isCpu() && phase === 'play' ? nextOptions() : [];
        var dests = sel != null ? opts.filter(function (m) { return m.f === sel; }).map(function (m) { return m.t; }) : [];
        for (var p = 1; p <= 24; p++) {
          var rc = ptRect(p);
          if (dests.indexOf(p) >= 0) { c.fillStyle = 'rgba(34,197,94,.35)'; c.fillRect(rc.x, rc.y, rc.w, rc.h); }
          if (hintM && (hintM.m.t === p || hintM.m.f === p)) { c.strokeStyle = 'rgba(253,224,71,' + Math.min(1, hintM.life) + ')'; c.lineWidth = 3; c.strokeRect(rc.x + 1.5, rc.y + 1.5, rc.w - 3, rc.h - 3); }
          c.fillStyle = 'rgba(68,40,20,.55)'; c.font = '700 9px system-ui, sans-serif'; c.textBaseline = 'middle';
          c.textAlign = rc.right ? 'left' : 'right';
          c.fillText(String(white || api.mode === 0 ? p : 25 - p), rc.right ? rc.x + 2 : rc.x + rc.w - 2, rc.y + rc.h / 2);
        }
        // центральная перегородка (бар) и вертикальная ось
        // шашки
        var movingTo = anim ? anim.m.t : -1;
        for (var q = 1; q <= 24; q++) {
          var n = Math.abs(s.p[q]); if (!n) continue;
          var wSide = s.p[q] > 0, shown = n - (q === movingTo ? 1 : 0);
          for (var i = 0; i < shown; i++) {
            var cp = checkerPos(q, i, n);
            drawChecker(c, cp.x, cp.y, wSide, sel === q && i === shown - 1);
          }
          if (n > 6) { var cp2 = checkerPos(q, n - 1, n); c.fillStyle = wSide ? '#1c1917' : '#fff'; c.font = '900 11px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText(String(n), cp2.x, cp2.y + 1); }
        }
        // бар
        var by = g.y + 6 * g.ph + g.bar / 2;
        for (var b0 = 0; b0 < s.bar[0]; b0++) drawChecker(c, g.x + g.cw + 20 + b0 * 10, by, true, sel === 25 && b0 === s.bar[0] - 1);
        for (var b1 = 0; b1 < s.bar[1]; b1++) drawChecker(c, g.x + g.cw - 20 - b1 * 10, by, false, sel === 0 && b1 === s.bar[1] - 1);
        // анимация
        if (anim) {
          var m = anim.m, a0 = m.f === 25 || m.f === 0 ? { x: g.x + g.cw, y: by } : checkerPos(m.f, Math.abs(s.p[m.f]), Math.abs(s.p[m.f]) + 1);
          var a1 = m.t === 0 || m.t === 25 ? { x: anim.w ? g.x + g.w - 30 : g.x + 30, y: g.y + g.h + 26 } : checkerPos(m.t, Math.abs(s.p[m.t]) - 1, Math.abs(s.p[m.t]));
          var e = 1 - Math.pow(1 - anim.k, 3);
          drawChecker(c, a0.x + (a1.x - a0.x) * e, a0.y + (a1.y - a0.y) * e - Math.sin(e * Math.PI) * 20, anim.w);
        }
        // кости
        if (rolled || isCpu()) {
          var rem = rolled ? remainingDice() : [], sz = 30;
          var dv = rollAnim > 0 ? [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)] : dice;
          if (dv[0]) {
            var used0 = rolled && rem.indexOf(dice[0]) < 0, used1 = rolled && (dice[0] === dice[1] ? rem.length < 2 : rem.indexOf(dice[1]) < 0);
            drawDie(c, W / 2 - sz - 6 + (white ? 60 : -60), by - sz / 2, sz, dv[0], rollAnim <= 0 && used0);
            drawDie(c, W / 2 + 6 + (white ? 60 : -60), by - sz / 2, sz, dv[1], rollAnim <= 0 && used1);
          }
        }
        // лоток выброса
        var ty = g.y + g.h + 10;
        if (dests.indexOf(0) >= 0 || dests.indexOf(25) >= 0) { c.fillStyle = 'rgba(34,197,94,.35)'; c.fillRect(g.x, ty, g.w, 42); }
        for (var o0 = 0; o0 < s.off[0]; o0++) { var ox0 = g.x + g.w - 12 - o0 * 7; c.fillStyle = '#d6cbb3'; c.fillRect(ox0, ty + 6, 5, 30); c.fillStyle = '#fffdf6'; c.fillRect(ox0 + 1, ty + 6, 2, 30); }
        for (var o1 = 0; o1 < s.off[1]; o1++) { var ox1 = g.x + 8 + o1 * 7; c.fillStyle = '#0c0a09'; c.fillRect(ox1, ty + 6, 5, 30); c.fillStyle = '#57534e'; c.fillRect(ox1 + 1, ty + 6, 1.5, 30); }
        c.fillStyle = 'rgba(255,255,255,.6)'; c.font = '700 11px system-ui, sans-serif'; c.textAlign = 'center';
        c.fillText(api.t('nardy.off') + '  ' + s.off[1] + ' : ' + s.off[0], W / 2, ty + 21);
        // статус
        var two = api.mode === 1, msg;
        if (phase === 'over') msg = two ? api.t(winner ? 'g.p1win' : 'g.p2win') : api.t(winner === myWhite() ? 'g.win' : 'g.lose');
        else if (remoteTurn() && phase === 'play') msg = api.t('net.oppTurn');
        else if (phase === 'nomove') msg = api.t('nardy.noMoves');
        else if (isCpu()) msg = api.t('g.cpuTurn');
        else if (!rolled) msg = api.t('nardy.roll');
        else msg = two ? api.t(white ? 'chess.white' : 'chess.black') : api.t('g.yourTurn');
        c.fillStyle = phase === 'over' ? '#fde047' : '#fde68a'; c.font = '800 15px system-ui, sans-serif';
        c.fillText(msg, W / 2, 24);
        c.font = '700 11px system-ui, sans-serif'; c.fillStyle = 'rgba(255,255,255,.55)';
        c.textAlign = 'left'; c.fillText('⚪ ' + N.pips(s, true), 10, 24);
        c.textAlign = 'right'; c.fillText(N.pips(s, false) + ' ⚫', W - 10, 24);
        if (!rolled && !isCpu() && !remoteTurn() && phase === 'play') {
          c.fillStyle = 'rgba(250,204,21,' + (0.6 + 0.4 * Math.sin(t * 5)) + ')'; c.font = '900 14px system-ui, sans-serif'; c.textAlign = 'center';
          c.fillText('🎲 ' + api.t('nardy.tapRoll'), W / 2, by);
        }
        hbtn = null;
        if (canHint()) {
          hbtn = [10, H - 42, 70, 34];
          c.fillStyle = 'rgba(253,224,71,.22)'; c.beginPath(); c.roundRect ? c.roundRect(hbtn[0], hbtn[1], hbtn[2], hbtn[3], 17) : c.rect(hbtn[0], hbtn[1], hbtn[2], hbtn[3]); c.fill();
          c.fillStyle = '#fde047'; c.font = '800 13px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('💡' + (hints < 50 ? ' ' + hints : ''), hbtn[0] + hbtn[2] / 2, hbtn[1] + hbtn[3] / 2 + 1);
        }
      }
    };
  }
};
