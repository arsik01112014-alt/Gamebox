/* Пентаго: поставь шарик и поверни четверть доски, собери 5 в ряд */
window.GAMES = window.GAMES || {};
window.GAMES.pentago = {
  title: 'Пентаго', desc: 'Пять в ряд с поворотом', cat: 'board', isNew4: true, modes: true, lan: true, medals: [150, 300, 500],
  hint: 'Каждый ход из двух частей: поставь шарик на свободную клетку, затем поверни любую из четырёх четвертей доски на 90° стрелкой. Собери 5 своих шариков в ряд — по горизонтали, вертикали или диагонали.',
  d0: 'Простой соперник', d1: 'Соперник видит угрозы', d2: 'Соперник сильнее', d3: 'Сильный соперник',
  colors: ['#be123c', '#4c0519'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#7f1d1d"/><g fill="#991b1b"><rect x="10" y="10" width="38" height="38" rx="6"/><rect x="52" y="10" width="38" height="38" rx="6"/><rect x="10" y="52" width="38" height="38" rx="6"/><rect x="52" y="52" width="38" height="38" rx="6"/></g><g fill="#f8fafc"><circle cx="22" cy="22" r="5"/><circle cx="36" cy="36" r="5"/><circle cx="64" cy="64" r="5"/><circle cx="78" cy="78" r="5"/></g><g fill="#111827"><circle cx="64" cy="22" r="5"/><circle cx="22" cy="64" r="5"/><circle cx="36" cy="78" r="5"/></g><path d="M58 4a40 40 0 0 1 38 38" fill="none" stroke="#fbbf24" stroke-width="4"/><path d="M90 34l6 8 6-8" fill="#fbbf24"/></svg>',
  create: function (api) {
    var K = window.GBK, b, turn, netQ, endT, t, thinkT, over, phase, placed, cs, ox, oy, rotAnim, winCells, msg, msgT;
    function names() { return api.mode === 1 ? [api.t('g.p1'), api.t('g.p2')] : api.mode === 2 ? (api.net.side === 0 ? [api.t('g.you'), api.t('net.opp')] : [api.t('net.opp'), api.t('g.you')]) : [api.t('g.you'), api.t('g.cpu')]; }
    function me() { return api.mode === 2 ? api.net.side + 1 : 1; }
    function myTurn() { return !over && !rotAnim && (api.mode === 1 || (api.mode === 2 ? turn === me() : turn === 1)); }
    function rotate(bb, q, dir) { // q: 0..3 четверть, dir 1 — по часовой
      var r0 = (q >> 1) * 3, c0 = (q & 1) * 3, tmp = [];
      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) tmp[r * 3 + c] = bb[(r0 + r) * 6 + c0 + c];
      for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) bb[(r0 + r) * 6 + c0 + c] = dir > 0 ? tmp[(2 - c) * 3 + r] : tmp[c * 3 + 2 - r];
    }
    var LINES = (function () {
      var L = [], d = [[0, 1], [1, 0], [1, 1], [1, -1]];
      for (var r = 0; r < 6; r++) for (var c = 0; c < 6; c++) d.forEach(function (v) {
        var er = r + v[0] * 4, ec = c + v[1] * 4; if (er < 0 || er > 5 || ec < 0 || ec > 5) return;
        var l = []; for (var k = 0; k < 5; k++) l.push((r + v[0] * k) * 6 + c + v[1] * k); L.push(l);
      });
      return L;
    })();
    function five(bb, p) { for (var i = 0; i < LINES.length; i++) if (LINES[i].every(function (k) { return bb[k] === p; })) return LINES[i]; return null; }
    function evalB(bb, p) {
      var s = 0;
      LINES.forEach(function (l) { var a = 0, o = 0; l.forEach(function (k) { if (bb[k] === p) a++; else if (bb[k]) o++; }); if (!o) s += [0, 1, 4, 20, 120, 10000][a]; if (!a) s -= [0, 1, 5, 30, 400, 10000][o]; });
      return s;
    }
    function allMoves(bb) { var r = []; for (var i = 0; i < 36; i++) if (!bb[i]) for (var q = 0; q < 4; q++) { r.push([i, q, 1]); r.push([i, q, -1]); } return r; }
    function result(bb) { var a = five(bb, 1), c = five(bb, 2); return a && c ? 3 : a ? 1 : c ? 2 : bb.indexOf(0) < 0 ? 3 : 0; }
    function aiMove() {
      var ms = allMoves(b).map(function (m) {
        var nb = b.slice(); nb[m[0]] = 2; rotate(nb, m[1], m[2]); var r = result(nb);
        var s = r === 2 ? 1e6 : r === 1 ? -1e6 : r === 3 ? -10 : evalB(nb, 2);
        return { m: m, nb: nb, s: s + Math.random() * [400, 40, 8, 2][api.diff] };
      }).sort(function (x, y) { return y.s - x.s; });
      // сильный соперник проверяет лучшие ходы: не даёт ли он выигрыш следующим ходом
      if (api.diff >= 2) for (var i = 0; i < Math.min(ms.length, api.diff === 3 ? 24 : 12); i++) {
        var nb = ms[i].nb, mm = allMoves(nb), danger = false;
        if (ms[i].s >= 1e6) break;
        for (var j = 0; j < mm.length && !danger; j++) { var b2 = nb.slice(); b2[mm[j][0]] = 1; rotate(b2, mm[j][1], mm[j][2]); if (five(b2, 1) && !five(b2, 2)) danger = true; }
        if (!danger) { ms = [ms[i]]; break; }
      }
      var best = ms[0].m;
      doMove(best);
    }
    function doMove(m, remote) {
      if (api.mode === 2 && !remote) api.net.send({ m: m });
      b[m[0]] = turn; placed = m[0]; api.sound('click');
      rotAnim = { q: m[1], dir: m[2], k: 0 };
    }
    function finishRot() {
      rotate(b, rotAnim.q, rotAnim.dir); rotAnim = null; phase = 'place'; placed = -1; api.sound('hit');
      var r = result(b);
      if (r) {
        over = r; winCells = r === 3 ? five(b, 1) || five(b, 2) : five(b, r);
        var mine = api.mode === 1 ? r !== 3 : r === me(); api.sound(mine ? 'win' : r === 3 ? 'click' : 'hit'); if (mine) api.fx.confetti(50);
        if (api.mode === 0 && r === 1) api.addScore(150 + api.diff * 100 + b.filter(function (v) { return !v; }).length * 6);
        endT = 2.8; return;
      }
      turn = 3 - turn; thinkT = 0.6 + Math.random() * 0.4;
    }
    function layout() { cs = Math.min((api.W - 24) / 6.6, (api.H - 280) / 7.6); var s = cs * 6.4; ox = (api.W - s) / 2; oy = Math.max(76 + cs, (api.H - s) / 2 - 30); }
    function flip() { return api.mode === 2 && api.net.side === 1; }
    function qBox(q) { var s = cs * 3.1, g = cs * 0.2; return [ox + (q & 1) * (s + g), oy + (q >> 1) * (s + g), s]; } // экранная четверть
    function sq(q) { return flip() ? 3 - q : q; } // экранная ↔ настоящая
    function cellXY(i) {
      var r = (i / 6) | 0, c = i % 6; if (flip()) { r = 5 - r; c = 5 - c; }
      var q = (r >= 3 ? 2 : 0) + (c >= 3 ? 1 : 0), B = qBox(q); return [B[0] + (c % 3 + 0.5) * cs * 1.0333, B[1] + (r % 3 + 0.5) * cs * 1.0333, q];
    }
    function arrows() { // у каждой четверти две стрелки с внешней стороны: ↺ и ↻
      var res = [];
      for (var q = 0; q < 4; q++) {
        var B = qBox(q), y = q >> 1 ? B[1] + B[2] + cs * 0.62 : B[1] - cs * 0.62;
        res.push({ q: q, x: B[0] + B[2] * 0.28, y: y, dir: -1 }); res.push({ q: q, x: B[0] + B[2] * 0.72, y: y, dir: 1 });
      }
      return res;
    }
    function say(s) { msg = s; msgT = 1.4; }
    function ball(c, x, y, p, r) {
      var g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, 1, x, y, r);
      if (p === 1) { g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cbd5e1'); } else { g.addColorStop(0, '#64748b'); g.addColorStop(1, '#0f172a'); }
      c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.arc(x + 1, y + 2.5, r, 0, 6.283); c.fill();
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
    }
    return {
      reset: function () { b = new Array(36).fill(0); turn = 1; netQ = []; endT = 0; t = 0; over = 0; phase = 'place'; placed = -1; rotAnim = null; winCells = null; msgT = 0; thinkT = 0.8; layout(); },
      resize: layout, idle: function (dt) { t += dt || 0; }, key: function () { },
      netMsg: function (d) { netQ.push(d); },
      input: function (type, d) {
        if (type !== 'down' || !myTurn()) return;
        if (phase === 'rot') {
          var A = arrows();
          for (var j = 0; j < A.length; j++) if (Math.hypot(A[j].x - d.x, A[j].y - d.y) < cs * 0.6) { var m = [placed, sq(A[j].q), A[j].dir]; b[placed] = 0; doMove(m); return; }
          // повторный тап по поставленному шарику — отменить
          var p0 = cellXY(placed); if (Math.hypot(p0[0] - d.x, p0[1] - d.y) < cs * 0.5) { b[placed] = 0; placed = -1; phase = 'place'; }
          return;
        }
        for (var i = 0; i < 36; i++) { var p = cellXY(i); if (!b[i] && Math.hypot(p[0] - d.x, p[1] - d.y) < cs * 0.5) { b[i] = turn; placed = i; phase = 'rot'; api.sound('click'); say('Теперь поверни четверть'); return; } }
      },
      update: function (dt) {
        t += dt; if (msgT > 0) msgT -= dt;
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (rotAnim) { rotAnim.k += dt / 0.35; if (rotAnim.k >= 1) finishRot(); return; }
        if (over) return;
        if (api.mode === 0 && turn === 2) { thinkT -= dt; if (thinkT <= 0) aiMove(); }
        if (api.mode === 2 && turn !== me() && netQ.length) { var m = netQ.shift().m; if (m && m[0] >= 0 && m[0] < 36 && !b[m[0]] && m[1] >= 0 && m[1] < 4) doMove(m, true); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, nm = names();
        K.bg(c, W, H, '#3f0d1a', '#12030a', 'rgba(244,63,94,.12)');
        c.textAlign = 'center'; c.textBaseline = 'middle';
        [0, 1].forEach(function (p) {
          var x = p ? W * 0.75 : W * 0.25, act = !over && turn === p + 1;
          ball(c, x - 52, 34, p + 1, 9);
          c.fillStyle = act ? '#fde68a' : '#fecdd3'; c.font = '800 15px system-ui'; c.fillText((act ? '▶ ' : '') + nm[p], x + 6, 34);
        });
        var onWin = {}; (winCells || []).forEach(function (k) { onWin[k] = 1; });
        for (var q = 0; q < 4; q++) {
          var B = qBox(q), rq = sq(q), ang = 0;
          if (rotAnim && rotAnim.q === rq) { var e = rotAnim.k; ang = (e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2) * Math.PI / 2 * rotAnim.dir; }
          c.save(); c.translate(B[0] + B[2] / 2, B[1] + B[2] / 2); c.rotate(ang); c.translate(-B[0] - B[2] / 2, -B[1] - B[2] / 2);
          var g = c.createLinearGradient(B[0], B[1], B[0] + B[2], B[1] + B[2]); g.addColorStop(0, '#be123c'); g.addColorStop(1, '#881337');
          K.rr(c, B[0], B[1], B[2], B[2], cs * 0.3); c.fillStyle = g; c.fill();
          c.strokeStyle = 'rgba(255,255,255,.15)'; c.lineWidth = 2; c.stroke();
          for (var i = 0; i < 36; i++) {
            var p = cellXY(i); if (p[2] !== q) continue;
            c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(p[0], p[1], cs * 0.36, 0, 6.283); c.fill();
            if (b[i]) ball(c, p[0], p[1], b[i], cs * 0.34);
            if (onWin[i]) { c.strokeStyle = 'rgba(250,204,21,' + (0.6 + 0.4 * Math.sin(t * 7)) + ')'; c.lineWidth = 4; c.beginPath(); c.arc(p[0], p[1], cs * 0.4, 0, 6.283); c.stroke(); }
            if (i === placed && phase === 'rot') { c.strokeStyle = '#fde68a'; c.lineWidth = 2; c.beginPath(); c.arc(p[0], p[1], cs * 0.42, 0, 6.283); c.stroke(); }
          }
          c.restore();
        }
        if (phase === 'rot' && myTurn()) arrows().forEach(function (a) {
          c.save(); c.translate(a.x, a.y);
          c.fillStyle = 'rgba(250,204,21,' + (0.75 + 0.25 * Math.sin(t * 6)) + ')'; c.beginPath(); c.arc(0, 0, cs * 0.42, 0, 6.283); c.fill();
          c.fillStyle = '#422006'; c.font = '900 ' + Math.round(cs * 0.5) + 'px system-ui'; c.fillText(a.dir > 0 ? '↻' : '↺', 0, 1);
          c.restore();
        });
        var tip;
        if (over) tip = over === 3 ? 'Ничья!' : api.mode === 1 ? api.t(over === 1 ? 'g.p1win' : 'g.p2win') : over === me() ? api.t('g.win') : api.t('g.lose');
        else if (msgT > 0) tip = msg;
        else if (rotAnim) tip = '';
        else if (api.mode === 0 && turn === 2) tip = 'Компьютер думает…';
        else if (api.mode === 2 && turn !== me()) tip = api.t('net.oppTurn');
        else tip = (api.mode === 1 ? nm[turn - 1] + ', ' : '') + (phase === 'rot' ? 'поверни четверть ↻ ↺' : 'поставь шарик');
        K.toast(c, W, H - 46, tip, 1);
      }
    };
  }
};
