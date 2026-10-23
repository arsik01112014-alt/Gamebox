/* Крестики-нолики */
window.GAMES = window.GAMES || {};
window.GAMES.ttt = {
  title: 'Крестики-нолики',
  colors: ['#06b6d4', '#ec4899'],
  controls: 'none',
  modes: true,
  lan: true,
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="tttWood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b7793f"/><stop offset="1" stop-color="#6b3f1d"/></linearGradient>' +
    '<radialGradient id="tttSlate" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#3b6352"/><stop offset="1" stop-color="#1c352b"/></radialGradient></defs>' +
    '<rect x="4" y="4" width="92" height="92" rx="14" fill="url(#tttWood)"/><rect x="11" y="11" width="78" height="78" rx="6" fill="url(#tttSlate)"/>' +
    '<path d="M38 17q-1 33 1 66M62 16q2 34-1 67M17 38q33 2 66-1M16 62q34-2 67 1" stroke="#f1f5f9" stroke-opacity=".85" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    '<path d="M19 20l13 13M32 19L20 32M68 68l13 13M81 67L69 81" stroke="#67e8f9" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M50 41a9 9 0 1 1-3 1" stroke="#f9a8d4" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M75 17a8 8 0 1 1-3 1" stroke="#f9a8d4" stroke-width="5" fill="none" stroke-linecap="round"/></svg>',

  create: function (api) {
    var netQ = [], N, K, board, anim, turn, starter, wins, line, phase, phaseT, cs, bx, by, t, thinkT, scores, endT;
    var X = 1, O = 2, streak = 0; // v2.0: серия побед умножает очки

    var bgOff = null, CX = '#67e8f9', CO = '#f9a8d4', SLATE = '#24443a';
    var CHALK_FONT = '"Chalkboard SE","Comic Sans MS","Comic Neue","Segoe Print",cursive,system-ui,sans-serif';
    function layout() {
      var size = Math.min(api.W - 30, api.H - 170);
      cs = size / N; bx = (api.W - size) / 2; by = 110 + (api.H - 140 - size) / 2;
      buildBg();
    }
    function rng(seed) { var s0 = (seed * 9301 + 49297) % 233280 + 1; return function () { s0 = (s0 * 16807) % 2147483647; return s0 / 2147483647; }; }
    // мел: несколько дрожащих проходов + «зерно» (выщербины цвета доски)
    function chalk(c, pts, k, col, w, seed, grain) {
      var n = Math.max(2, Math.min(pts.length, Math.ceil(pts.length * k))), R = rng(seed), hq = api.quality > 0;
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = col;
      var passes = hq ? [[w, 0.88, 0], [w * 0.5, 0.55, w * 0.22], [w * 0.38, 0.5, -w * 0.24]] : [[w, 0.9, 0]];
      for (var p = 0; p < passes.length; p++) {
        var pw = passes[p], ox = pw[2] * (R() - 0.3), oy = pw[2] * (R() - 0.7);
        c.globalAlpha *= 1; c.lineWidth = pw[0];
        var ga = c.globalAlpha; c.globalAlpha = ga * pw[1];
        c.beginPath(); c.moveTo(pts[0][0] + ox, pts[0][1] + oy);
        for (var i = 1; i < n; i++) c.lineTo(pts[i][0] + ox, pts[i][1] + oy);
        c.stroke(); c.globalAlpha = ga;
      }
      if (hq && grain !== false) {
        c.fillStyle = SLATE; var ga2 = c.globalAlpha; c.globalAlpha = ga2 * 0.4;
        for (var j = 0; j < n - 1; j++) for (var q = 0; q < 3; q++) {
          var f = R(), gx2 = pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f + (R() - 0.5) * w * 0.9, gy2 = pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f + (R() - 0.5) * w * 0.9;
          c.fillRect(gx2, gy2, 1 + R() * 1.4, 1 + R() * 1.2);
        }
        c.globalAlpha = ga2;
      }
      c.restore();
    }
    function linePts(x1, y1, x2, y2, seg, wob, seed) {
      var R = rng(seed), out = [], dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / L, ny = dx / L, bow = (R() - 0.5) * wob * 2;
      for (var i = 0; i <= seg; i++) { var f = i / seg, o = Math.sin(f * Math.PI) * bow + (R() - 0.5) * wob * 0.5; out.push([x1 + dx * f + nx * o, y1 + dy * f + ny * o]); }
      return out;
    }
    function buildBg() {
      var W = api.W, H = api.H, d = Math.min(2, window.devicePixelRatio || 1), R = rng(11);
      bgOff = document.createElement('canvas'); bgOff.width = Math.ceil(W * d); bgOff.height = Math.ceil(H * d);
      var x = bgOff.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0);
      var g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#2f5345'); g.addColorStop(0.5, '#264639'); g.addColorStop(1, '#1b3329');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (var i = 0; i < 22; i++) { // разводы от тряпки
        var sx = R() * W, sy = R() * H, sr = 40 + R() * 110;
        x.save(); x.translate(sx, sy); x.scale(1.8, 0.6); x.rotate((R() - 0.5) * 0.6);
        var rg = x.createRadialGradient(0, 0, 0, 0, 0, sr); rg.addColorStop(0, 'rgba(255,255,255,' + (0.025 + R() * 0.03).toFixed(3) + ')'); rg.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = rg; x.fillRect(-sr, -sr, sr * 2, sr * 2); x.restore();
      }
      x.lineCap = 'round';
      for (i = 0; i < 7; i++) { x.strokeStyle = 'rgba(255,255,255,.03)'; x.lineWidth = 18 + R() * 20; x.beginPath(); var ay = R() * H; x.moveTo(-20, ay); x.bezierCurveTo(W * 0.3, ay + (R() - 0.5) * 80, W * 0.7, ay + (R() - 0.5) * 80, W + 20, ay + (R() - 0.5) * 40); x.stroke(); }
      for (i = 0; i < 2200; i++) { x.fillStyle = R() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.08)'; x.fillRect(R() * W, R() * H, 1, 1); }
      var vg = x.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.3, W / 2, H * 0.45, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); x.fillStyle = vg; x.fillRect(0, 0, W, H);
      // деревянная полочка с мелом
      var lh = 24, ly = H - lh, wg = x.createLinearGradient(0, ly, 0, H); wg.addColorStop(0, '#c08a52'); wg.addColorStop(0.25, '#9a6634'); wg.addColorStop(1, '#5c3818');
      x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, ly - 5, W, 5);
      x.fillStyle = wg; x.fillRect(0, ly, W, lh);
      x.strokeStyle = 'rgba(60,30,10,.35)'; x.lineWidth = 1;
      for (i = 0; i < 6; i++) { var wy = ly + 5 + i * 3.2; x.beginPath(); x.moveTo(0, wy); for (var wx = 0; wx <= W; wx += 20) x.lineTo(wx, wy + Math.sin(wx * 0.03 + i) * 1.2); x.stroke(); }
      x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(0, ly, W, 1);
      [[W * 0.12, '#f8fafc', 34], [W * 0.24, CO, 22], [W * 0.31, CX, 26]].forEach(function (cp) {
        x.fillStyle = 'rgba(0,0,0,.3)'; rrect(x, cp[0] + 2, ly - 6, cp[2], 8, 4); x.fill();
        x.fillStyle = cp[1]; rrect(x, cp[0], ly - 9, cp[2], 8, 4); x.fill();
        x.fillStyle = 'rgba(255,255,255,.45)'; x.fillRect(cp[0] + 3, ly - 8, cp[2] - 6, 2);
      });
      var ex = W * 0.7; x.fillStyle = 'rgba(0,0,0,.35)'; rrect(x, ex + 3, ly - 12, 66, 14, 4); x.fill();
      x.fillStyle = '#7c4a24'; rrect(x, ex, ly - 16, 66, 10, 3); x.fill();
      x.fillStyle = '#475569'; rrect(x, ex, ly - 8, 66, 8, 2); x.fill();
      x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(ex + 3, ly - 7, 60, 2);
      // сетка мелом
      for (i = 1; i < N; i++) {
        chalk(x, linePts(bx + i * cs, by + 8, bx + i * cs, by + N * cs - 8, 14, 4, 30 + i), 1, '#eef2f7', Math.max(3.5, cs * 0.045), 50 + i);
        chalk(x, linePts(bx + 8, by + i * cs, bx + N * cs - 8, by + i * cs, 14, 4, 70 + i), 1, '#eef2f7', Math.max(3.5, cs * 0.045), 90 + i);
      }
    }
    function rrect(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
    function lines() {
      var L = [], r, c, k;
      for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
        var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
        for (k = 0; k < 4; k++) {
          var d = dirs[k], er = r + d[0] * (K - 1), ec = c + d[1] * (K - 1);
          if (er < 0 || er >= N || ec < 0 || ec >= N) continue;
          var cells = [];
          for (var i = 0; i < K; i++) cells.push((r + d[0] * i) * N + c + d[1] * i);
          L.push(cells);
        }
      }
      return L;
    }
    var LINES;
    function winner(b) {
      for (var i = 0; i < LINES.length; i++) {
        var l = LINES[i], v = b[l[0]];
        if (!v) continue;
        var ok = true;
        for (var j = 1; j < l.length; j++) if (b[l[j]] !== v) { ok = false; break; }
        if (ok) return { v: v, l: l };
      }
      return null;
    }
    function full(b) { for (var i = 0; i < b.length; i++) if (!b[i]) return false; return true; }
    function minimax(b, p, depth) {
      var w = winner(b);
      if (w) return w.v === O ? 10 - depth : depth - 10;
      if (full(b)) return 0;
      var best = p === O ? -99 : 99;
      for (var i = 0; i < b.length; i++) if (!b[i]) {
        b[i] = p; var v = minimax(b, p === O ? X : O, depth + 1); b[i] = 0;
        best = p === O ? Math.max(best, v) : Math.min(best, v);
      }
      return best;
    }
    function heur(b, i, me) {
      var op = me === X ? O : X, sc = 0;
      LINES.forEach(function (l) {
        if (l.indexOf(i) < 0) return;
        var m = 0, o = 0;
        l.forEach(function (k) { if (b[k] === me) m++; else if (b[k] === op) o++; });
        if (o === 0) sc += [1, 12, 90, 1e6][m] || 0;
        if (m === 0) sc += [1, 10, 70, 5e5][o] || 0;
      });
      return sc;
    }
    function aiMove() {
      var empty = [];
      for (var i = 0; i < board.length; i++) if (!board[i]) empty.push(i);
      var d = api.diff, pick = empty[Math.floor(Math.random() * empty.length)];
      function finds(p) {
        for (var k = 0; k < empty.length; k++) { board[empty[k]] = p; var w = winner(board); board[empty[k]] = 0; if (w) return empty[k]; }
        return -1;
      }
      if (N === 3) {
        if (d === 0) { var w0 = finds(O); if (w0 >= 0 && Math.random() < 0.6) pick = w0; }
        else if (d === 1) { var w1 = finds(O), b1 = finds(X); if (w1 >= 0) pick = w1; else if (b1 >= 0 && Math.random() < 0.85) pick = b1; else if (!board[4] && Math.random() < 0.5) pick = 4; }
        else {
          var bv = -99, cands = [];
          empty.forEach(function (i2) {
            board[i2] = O; var v = minimax(board, X, 1); board[i2] = 0;
            if (v > bv) { bv = v; cands = [i2]; } else if (v === bv) cands.push(i2);
          });
          pick = cands[Math.floor(Math.random() * cands.length)];
        }
      } else {
        var bs = -1, list = [];
        empty.forEach(function (i3) {
          var v = heur(board, i3, O) * (1 + Math.random() * 0.1);
          if (v > bs) { bs = v; list = [i3]; }
        });
        pick = list[0];
      }
      place(pick);
    }
    function mySym() { return api.net && api.net.side === 1 ? O : X; }
    function place(i, remote) {
      if (api.mode === 2 && !remote) api.net.send({ i: i });
      board[i] = turn; anim[i] = 0;
      api.sound(turn === X ? 'move' : 'rotate'); api.vibrate(10);
      var w = winner(board);
      if (w) {
        line = w.l; phase = 'roundEnd'; phaseT = 0;
        if (api.mode === 0) {
          if (w.v === X) {
            wins[0]++; streak++;
            api.addScore(100 * (api.diff + 1) * Math.min(5, streak)); api.sound('win'); api.fx.confetti(40);
            if (streak >= 2) api.toast(api.t('ttt.streak', streak) + ' ×' + Math.min(5, streak));
          }
          else { wins[1]++; api.sound('hit'); api.vibrate(150); endT = 1.6; api.fx.shake(5); }
        } else { wins[w.v - 1]++; api.sound(api.mode === 2 && w.v !== mySym() ? 'hit' : 'win'); if (wins[w.v - 1] >= 3) endT = 1.8; }
        return;
      }
      if (full(board)) {
        wins[2]++; phase = 'roundEnd'; phaseT = 0; line = null;
        if (api.mode === 0) { api.addScore(25 * (api.diff + 1)); streak = 0; }
        api.sound('point');
        return;
      }
      turn = turn === X ? O : X;
      if (api.mode === 0 && turn === O) thinkT = 0.45 + Math.random() * 0.35;
    }
    function newBoard() {
      board = []; anim = [];
      for (var i = 0; i < N * N; i++) { board.push(0); anim.push(1); }
      line = null; phase = 'play'; phaseT = 0;
      turn = starter;
      starter = starter === X ? O : X;
      if (api.mode === 0 && turn === O) thinkT = 0.6;
    }
    function drawX(c, x, y, s, k, col, seed) {
      seed = seed || 1;
      var a = s * 0.28, k1 = Math.min(1, k * 2), k2 = Math.max(0, k * 2 - 1), w = Math.max(3, s * 0.1), R = rng(seed);
      var j = function () { return (R() - 0.5) * s * 0.06; };
      chalk(c, linePts(x - a + j(), y - a + j(), x + a + j(), y + a + j(), 9, s * 0.04, seed + 3), k1, col, w, seed + 5);
      if (k2 > 0) chalk(c, linePts(x + a + j(), y - a + j(), x - a + j(), y + a + j(), 9, s * 0.04, seed + 7), k2, col, w, seed + 9);
    }
    function drawO(c, x, y, s, k, col, seed) {
      seed = seed || 1;
      var R = rng(seed), r = s * 0.29, a0 = -Math.PI / 2 - 0.4 + (R() - 0.5) * 0.4, span = 6.283 + 0.5, pts = [], n = 30, sq = 0.92 + R() * 0.12;
      for (var i = 0; i <= n; i++) { var f = i / n, an = a0 + span * f, rr2 = r * (1 + Math.sin(f * 9 + seed) * 0.025 + (f - 0.5) * 0.08); pts.push([x + Math.cos(an) * rr2 * sq, y + Math.sin(an) * rr2 / sq]); }
      chalk(c, pts, k, col, Math.max(3, s * 0.1), seed + 11);
    }

    return {
      reset: function () {
        N = api.diff === 3 ? 5 : 3; K = N === 5 ? 4 : 3;
        LINES = lines();
        wins = [0, 0, 0]; starter = X; netQ = []; t = 0; thinkT = 0; endT = 0; streak = 0;
        layout(); newBoard();
      },
      resize: layout,
      netMsg: function (d) { netQ.push(d); },
      idle: function (dt) { t += dt; },
      key: function () { },
      input: function (type, d) {
        if (type !== 'tap' || endT > 0) return;
        if (phase === 'roundEnd') { if (phaseT > 0.6) newBoard(); return; }
        if (api.mode === 0 && turn === O) return;
        if (api.mode === 2 && turn !== mySym()) return;
        var c = Math.floor((d.x - bx) / cs), r = Math.floor((d.y - by) / cs);
        if (c < 0 || r < 0 || c >= N || r >= N || board[r * N + c]) return;
        place(r * N + c);
      },
      update: function (dt) {
        t += dt; phaseT += dt;
        for (var i = 0; i < anim.length; i++) if (anim[i] < 1) anim[i] = Math.min(1, anim[i] + dt * 4);
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (phase === 'play' && api.mode === 0 && turn === O) { thinkT -= dt; if (thinkT <= 0) aiMove(); }
        if (phase === 'play' && api.mode === 2 && turn !== mySym() && netQ.length) { var nd = netQ.shift(); if (nd.i >= 0 && nd.i < board.length && !board[nd.i]) place(nd.i, true); }
        if (phase === 'roundEnd' && phaseT > 1.6 && api.mode !== 1 && !endT) newBoard();
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        if (bgOff) c.drawImage(bgOff, 0, 0, W, H); else { c.fillStyle = '#264639'; c.fillRect(0, 0, W, H); }
        // табло
        var two = api.mode === 1;
        var names = two ? [api.t('g.p1'), api.t('g.p2')] : api.mode === 2 ? (mySym() === X ? [api.t('g.you'), api.t('net.opp')] : [api.t('net.opp'), api.t('g.you')]) : [api.t('g.you'), api.t('g.cpu')];
        c.textAlign = 'center'; c.textBaseline = 'middle';
        [[0, CX, W * 0.22], [1, CO, W * 0.78]].forEach(function (z) {
          var act = phase === 'play' && turn === z[0] + 1, x0 = z[2] - 70, y0 = 14, bw = 140, bh = 76;
          c.fillStyle = act ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.12)'; rrect(c, x0, y0, bw, bh, 16); c.fill();
          var box = [[x0 + 10, y0 + 2], [x0 + bw - 8, y0 + 1], [x0 + bw - 1, y0 + 12], [x0 + bw, y0 + bh - 10], [x0 + bw - 10, y0 + bh], [x0 + 9, y0 + bh - 1], [x0 + 1, y0 + bh - 11], [x0, y0 + 11], [x0 + 12, y0 + 3]];
          c.globalAlpha = act ? 1 : 0.28; chalk(c, box, 1, act ? z[1] : '#e2e8f0', 2.5, 200 + z[0], false); c.globalAlpha = 1;
          if (z[0] === 0) drawX(c, z[2] - 40, 42, 40, 1, z[1], 301); else drawO(c, z[2] - 40, 42, 40, 1, z[1], 302);
          c.font = '900 30px ' + CHALK_FONT;
          c.fillStyle = 'rgba(255,255,255,.35)'; c.fillText(String(wins[z[0]]), z[2] + 17, 43);
          c.fillStyle = '#f8fafc'; c.fillText(String(wins[z[0]]), z[2] + 16, 42);
          c.fillStyle = 'rgba(241,245,249,.7)'; c.font = '700 12px ' + CHALK_FONT; c.fillText(names[z[0]], z[2], 74);
        });
        c.fillStyle = 'rgba(241,245,249,.55)'; c.font = '700 14px ' + CHALK_FONT;
        c.fillText('= ' + wins[2], W / 2, 42);
        for (var k = 0; k < board.length; k++) {
          if (!board[k]) continue;
          var x = bx + (k % N + 0.5) * cs, y = by + (Math.floor(k / N) + 0.5) * cs;
          var dim = line && line.indexOf(k) < 0 ? 0.35 : 1;
          c.globalAlpha = dim;
          var pop = anim[k] < 1 ? 1 + Math.sin(anim[k] * Math.PI) * 0.06 : 1;
          if (board[k] === X) drawX(c, x, y, cs * pop, anim[k], CX, k * 13 + 1); else drawO(c, x, y, cs * pop, anim[k], CO, k * 13 + 2);
          if (anim[k] < 1 && api.quality > 0) { // меловая пыль
            c.fillStyle = 'rgba(255,255,255,' + ((1 - anim[k]) * 0.5).toFixed(3) + ')';
            for (var dq = 0; dq < 6; dq++) { var da = dq * 1.05 + k, dr = cs * (0.25 + anim[k] * 0.2); c.fillRect(x + Math.cos(da) * dr, y + Math.sin(da) * dr + anim[k] * 8, 2, 2); }
          }
          c.globalAlpha = 1;
        }
        if (line) {
          var a = line[0], b = line[line.length - 1], kk = Math.min(1, phaseT * 3);
          var x1 = bx + (a % N + 0.5) * cs, y1 = by + (Math.floor(a / N) + 0.5) * cs, x2 = bx + (b % N + 0.5) * cs, y2 = by + (Math.floor(b / N) + 0.5) * cs;
          var ex = (x2 - x1) * 0.12, ey = (y2 - y1) * 0.12;
          chalk(c, linePts(x1 - ex, y1 - ey, x2 + ex, y2 + ey, 16, cs * 0.05, 777), kk, '#fde047', cs * 0.09, 778);
        }
        // статус
        var msg = '';
        if (phase === 'roundEnd') {
          var w = winner(board);
          msg = !w ? api.t('g.draw') : two ? api.t(w.v === X ? 'g.p1win' : 'g.p2win') : api.t(w.v === (api.mode === 2 ? mySym() : X) ? 'g.win' : 'g.lose');
          if (two && !endT) msg += ' · ' + api.t('g.tapContinue');
        } else if (api.mode === 2) msg = api.t(turn === mySym() ? 'g.yourTurn' : 'net.oppTurn');
        else msg = two ? api.t(turn === X ? 'g.p1turn' : 'g.p2turn') : api.t(turn === X ? 'g.yourTurn' : 'g.thinking');
        var my = Math.min(H - 40, by + N * cs + 26);
        c.font = '800 18px ' + CHALK_FONT;
        c.fillStyle = 'rgba(255,255,255,.3)'; c.fillText(msg, W / 2 + 1, my + 1);
        c.fillStyle = '#f8fafc'; c.fillText(msg, W / 2, my);
        var tw = c.measureText(msg).width;
        c.globalAlpha = 0.5; chalk(c, linePts(W / 2 - tw / 2, my + 14, W / 2 + tw / 2, my + 13, 8, 2, 555), 1, turn === X || phase === 'roundEnd' ? CX : CO, 2, 556, false); c.globalAlpha = 1;
      }
    };
  }
};
