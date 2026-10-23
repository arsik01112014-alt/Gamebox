/* Судоку */
window.GAMES = window.GAMES || {};
window.GAMES.sudoku = {
  title: 'Судоку',
  colors: ['#0ea5e9', '#6366f1'],
  controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="sudPaper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf5"/><stop offset="1" stop-color="#efe6cf"/></linearGradient></defs>' +
    '<rect x="13" y="13" width="80" height="80" rx="6" fill="#000" opacity=".25"/><rect x="9" y="9" width="80" height="80" rx="6" fill="url(#sudPaper)"/>' +
    '<path d="M22.3 9v80M49 9v80M75.7 9v80M9 22.3h80M9 49h80M9 75.7h80" stroke="#93c5fd" stroke-width="1" opacity=".7"/>' +
    '<path d="M35.7 9v80M62.3 9v80M9 35.7h80M9 62.3h80" stroke="#1e3a5f" stroke-width="2.6"/><rect x="9" y="9" width="80" height="80" rx="6" fill="none" stroke="#1e3a5f" stroke-width="3"/>' +
    '<rect x="36.5" y="36.5" width="25" height="25" fill="#fde047" opacity=".55"/>' +
    '<g font-family="Georgia,serif" font-weight="700" font-size="17" text-anchor="middle" fill="#1e293b"><text x="22" y="28">5</text><text x="49" y="55">7</text><text x="76" y="82">1</text></g>' +
    '<g font-family="Comic Sans MS,cursive" font-weight="700" font-size="17" text-anchor="middle" fill="#2563eb"><text x="76" y="28">3</text><text x="22" y="82">9</text></g>' +
    '<path d="M60 96 L94 62 L99 67 L65 101z" fill="#f59e0b"/><path d="M94 62l4-4 5 5-4 4z" fill="#f472b6"/></svg>',

  create: function (api) {
    var DIFF = [
      { clues: 42, maxErr: 99, hints: 99 },
      { clues: 34, maxErr: 3, hints: 3 },
      { clues: 29, maxErr: 3, hints: 1 },
      { clues: 25, maxErr: 3, hints: 0 }
    ];
    var D, sol, given, val, notes, sel, notesMode, errs, hintsLeft, time, done, endT, cs, bx, by, pad, acts, t, history, flashCells, conf, wrong;

    function rows(i) { return Math.floor(i / 9); }
    function cols(i) { return i % 9; }
    function boxOf(i) { return Math.floor(rows(i) / 3) * 3 + Math.floor(cols(i) / 3); }
    var PEERS = [];
    for (var i0 = 0; i0 < 81; i0++) {
      var pp = [];
      for (var j0 = 0; j0 < 81; j0++) if (j0 !== i0 && (rows(j0) === rows(i0) || cols(j0) === cols(i0) || boxOf(j0) === boxOf(i0))) pp.push(j0);
      PEERS.push(pp);
    }
    function candMask(g, i) {
      var m = 0x3FE;
      var p = PEERS[i];
      for (var k = 0; k < p.length; k++) if (g[p[k]]) m &= ~(1 << g[p[k]]);
      return m;
    }
    function bits(m) { var a = []; for (var d = 1; d <= 9; d++) if (m & (1 << d)) a.push(d); return a; }
    function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
    // решатель с выбором клетки с минимумом кандидатов; считает решения до limit
    function solve(g, limit, randomize) {
      var best = -1, bestM = 0, bestC = 10;
      for (var i = 0; i < 81; i++) {
        if (g[i]) continue;
        var m = candMask(g, i), c = 0;
        for (var d = 1; d <= 9; d++) if (m & (1 << d)) c++;
        if (c === 0) return 0;
        if (c < bestC) { bestC = c; best = i; bestM = m; if (c === 1) break; }
      }
      if (best < 0) return 1;
      var ds = bits(bestM); if (randomize) shuffle(ds);
      var cnt = 0;
      for (var k = 0; k < ds.length; k++) {
        g[best] = ds[k];
        cnt += solve(g, limit - cnt, randomize);
        if (cnt >= limit) { if (!randomize) g[best] = 0; return cnt; }
        g[best] = 0;
      }
      return cnt;
    }
    function generate() {
      var g = []; for (var i = 0; i < 81; i++) g.push(0);
      solve(g, 1, true);
      sol = g.slice();
      var puzzle = g.slice(), order = shuffle(Array.apply(null, Array(81)).map(function (_, k) { return k; }));
      var filled = 81, start = Date.now();
      for (var o = 0; o < order.length && filled > D.clues; o++) {
        var idx = order[o], keep = puzzle[idx];
        puzzle[idx] = 0;
        var copy = puzzle.slice();
        if (solve(copy, 2, false) !== 1) puzzle[idx] = keep; else filled--;
        if (Date.now() - start > 1500) break;
      }
      return puzzle;
    }
    function layout() {
      var size = Math.floor(Math.min(api.W - 16, api.H - 200) / 9) * 9;
      cs = size / 9; bx = Math.floor((api.W - size) / 2); by = 46;
      var py = by + size + 14, pw = (api.W - 16) / 9;
      pad = []; for (var d = 1; d <= 9; d++) pad.push({ d: d, x: 8 + (d - 1) * pw, y: py, w: pw - 4, h: 54 });
      var ay = py + 64, aw = (api.W - 16) / 5;
      acts = ['undo', 'erase', 'notes', 'auto', 'hint'].map(function (a, k) { return { a: a, x: 8 + k * aw, y: ay, w: aw - 6, h: 44 }; });
      buildBg();
    }
    var bgOff = null, gridOff = null;
    var HAND = '"Segoe Print","Bradley Hand","Comic Sans MS","Comic Neue",cursive,system-ui,sans-serif', PRINT = 'Georgia,"Times New Roman",serif';
    function rrp(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
    function mk(W, H) { var d = Math.min(2, window.devicePixelRatio || 1), cv = document.createElement('canvas'); cv.width = Math.ceil(W * d); cv.height = Math.ceil(H * d); var x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); cv.x = x; return cv; }
    function buildBg() {
      var W = api.W, H = api.H, size = cs * 9, seed = 5, i;
      function R() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      bgOff = mk(W, H); var x = bgOff.x;
      // деревянный стол
      var g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#5b3a22'); g.addColorStop(0.5, '#4a2e1a'); g.addColorStop(1, '#3a2213');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (i = 0; i < 70; i++) {
        var yy = R() * H, amp = 2 + R() * 6, ph = R() * 6;
        x.strokeStyle = R() < 0.5 ? 'rgba(20,8,0,' + (0.08 + R() * 0.12).toFixed(3) + ')' : 'rgba(255,210,160,' + (0.03 + R() * 0.05).toFixed(3) + ')';
        x.lineWidth = 0.6 + R() * 1.6; x.beginPath(); x.moveTo(0, yy);
        for (var xx = 0; xx <= W; xx += 16) x.lineTo(xx, yy + Math.sin(xx * 0.012 + ph) * amp);
        x.stroke();
      }
      for (i = 0; i < 6; i++) { // сучки
        var kx = R() * W, ky = R() * H; x.strokeStyle = 'rgba(30,12,2,.18)'; x.lineWidth = 1.2;
        for (var kr = 1; kr < 4; kr++) { x.beginPath(); x.ellipse(kx, ky, kr * 5, kr * 2, 0, 0, 6.283); x.stroke(); }
      }
      var vg = x.createRadialGradient(W / 2, H * 0.4, W * 0.2, W / 2, H * 0.4, Math.max(W, H) * 0.8);
      vg.addColorStop(0, 'rgba(255,220,170,.08)'); vg.addColorStop(1, 'rgba(0,0,0,.5)'); x.fillStyle = vg; x.fillRect(0, 0, W, H);
      // лист бумаги
      var px0 = bx - 6, py0 = by - 6, pw = size + 12, ph2 = size + 12;
      x.save(); x.translate(px0 + pw / 2, py0 + ph2 / 2); x.rotate(-0.012);
      x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(-pw / 2 + 3, -ph2 / 2 + 6, pw, ph2);
      x.fillStyle = '#efe7d2'; x.fillRect(-pw / 2, -ph2 / 2, pw, ph2); x.restore();
      x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(bx + 2, by + 4, size, size);
      var pg = x.createLinearGradient(bx, by, bx + size, by + size); pg.addColorStop(0, '#fffdf6'); pg.addColorStop(1, '#f4ecd8');
      x.fillStyle = pg; x.fillRect(bx, by, size, size);
      for (i = 0; i < 81; i++) {
        var r = Math.floor(i / 9), q = i % 9;
        if ((Math.floor(r / 3) + Math.floor(q / 3)) % 2) { x.fillStyle = 'rgba(120,100,60,.06)'; x.fillRect(bx + q * cs, by + r * cs, cs, cs); }
      }
      for (i = 0; i < 1800; i++) { x.fillStyle = R() < 0.5 ? 'rgba(120,90,40,.06)' : 'rgba(255,255,255,.5)'; x.fillRect(bx + R() * size, by + R() * size, 1, 1); }
      // декоративные элементы на столе
      var top = by + size + 14 + 64 + 44 + 10;
      if (H - top > 46) {
        var py = top + (H - top) * 0.5, L = Math.min(W * 0.7, 300), sx = (W - L) / 2;
        x.save(); x.translate(sx + L / 2, py); x.rotate(-0.06); x.translate(-L / 2, 0);
        x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(10, 7, L - 24, 9);
        var bg2 = x.createLinearGradient(0, -7, 0, 7); bg2.addColorStop(0, '#fcd34d'); bg2.addColorStop(0.5, '#f59e0b'); bg2.addColorStop(1, '#b45309');
        x.fillStyle = bg2; x.fillRect(30, -7, L - 70, 14);
        x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(30, -2.5, L - 70, 1.2); x.fillRect(30, 2.5, L - 70, 1.2);
        x.fillStyle = '#e8c9a0'; x.beginPath(); x.moveTo(30, -7); x.lineTo(4, 0); x.lineTo(30, 7); x.closePath(); x.fill();
        x.fillStyle = '#334155'; x.beginPath(); x.moveTo(11, -2.6); x.lineTo(2, 0); x.lineTo(11, 2.6); x.closePath(); x.fill();
        var mg = x.createLinearGradient(0, -7, 0, 7); mg.addColorStop(0, '#e5e7eb'); mg.addColorStop(0.5, '#9ca3af'); mg.addColorStop(1, '#6b7280');
        x.fillStyle = mg; x.fillRect(L - 40, -7.5, 14, 15);
        x.fillStyle = '#f472b6'; rrp(x, L - 27, -7, 20, 14, 4); x.fill();
        x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(32, -6, L - 74, 2);
        x.restore();
      }
      // сетка — отдельный прозрачный слой поверх подсветки
      gridOff = mk(W, H); var y = gridOff.x;
      y.strokeStyle = 'rgba(59,90,140,.35)'; y.lineWidth = 1;
      for (var gl = 1; gl < 9; gl++) if (gl % 3) {
        y.beginPath(); y.moveTo(bx + gl * cs + 0.5, by); y.lineTo(bx + gl * cs + 0.5, by + size); y.stroke();
        y.beginPath(); y.moveTo(bx, by + gl * cs + 0.5); y.lineTo(bx + size, by + gl * cs + 0.5); y.stroke();
      }
      y.strokeStyle = '#1e3a5f'; y.lineWidth = 2.4; y.lineCap = 'round';
      for (gl = 0; gl <= 9; gl += 3) {
        y.beginPath(); y.moveTo(bx + gl * cs, by); y.lineTo(bx + gl * cs, by + size); y.stroke();
        y.beginPath(); y.moveTo(bx, by + gl * cs); y.lineTo(bx + size, by + gl * cs); y.stroke();
      }
    }
    function keycap(c, x, y, w, h, r, grad, edge, on) {
      c.fillStyle = edge; rrp(c, x, y + 3, w, h, r); c.fill();
      c.fillStyle = grad; rrp(c, x, y + (on ? 2 : 0), w, h, r); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x + r, y + (on ? 3 : 1), w - 2 * r, 1);
    }
    function inR(p, r) { return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }
    function setVal(i, d) {
      if (given[i] || done) return;
      history.push({ i: i, v: val[i], n: notes[i] });
      if (notesMode && d) {
        if (val[i]) return;
        notes[i] ^= (1 << d); api.sound('move');
        return;
      }
      val[i] = d; notes[i] = 0;
      if (!d) { api.sound('move'); return; }
      if (d !== sol[i]) {
        errs++; wrong[i] = 1; api.sound('hit'); api.vibrate(120);
        if (errs >= D.maxErr) { done = true; endT = 1.6; }
        return;
      }
      wrong[i] = 0;
      PEERS[i].forEach(function (p) { notes[p] &= ~(1 << d); });
      api.sound('rotate'); api.vibrate(8);
      // вспышка заполненных групп
      [rows, cols, boxOf].forEach(function (fn) {
        var grp = [], ok = true;
        for (var k = 0; k < 81; k++) if (fn(k) === fn(i)) { grp.push(k); if (val[k] !== sol[k]) ok = false; }
        if (ok) { grp.forEach(function (k2) { flashCells[k2] = 0.6; }); api.sound('point'); }
      });
      var solved = true;
      for (var k3 = 0; k3 < 81; k3++) if (val[k3] !== sol[k3]) { solved = false; break; }
      if (solved) {
        done = true; endT = 2.6;
        var used = (DIFF[api.diff].hints - hintsLeft);
        api.addScore(Math.max(100, (api.diff + 1) * 1000 + Math.max(0, 900 - Math.floor(time)) * (api.diff + 1) - errs * 100 - used * 150));
        api.sound('win'); api.vibrate(120);
        api.toast(api.t('sudoku.solved'));
        conf = [];
        for (var q = 0; q < 90; q++) conf.push({ x: Math.random() * api.W, y: -Math.random() * api.H * 0.6, vx: (Math.random() - 0.5) * 60, vy: 120 + Math.random() * 160, rot: Math.random() * 6, col: ['#38bdf8', '#a78bfa', '#f472b6', '#facc15', '#4ade80'][q % 5] });
      }
    }
    function action(a) {
      if (done) return;
      if (a === 'notes') { notesMode = !notesMode; api.sound('click'); }
      else if (a === 'auto') { // v2.0: автозаметки — кандидаты во все пустые клетки
        var any = false;
        for (var q = 0; q < 81; q++) if (!val[q]) { var m = candMask(val, q); if (m !== notes[q]) any = true; notes[q] = m; }
        if (any) { api.sound('bonus'); api.fx.text(bx + cs * 4.5, by + cs * 4.5, '✎✨', '#a78bfa', 24); }
      }
      else if (a === 'erase') { if (sel >= 0 && !given[sel]) { setVal(sel, 0); wrong[sel] = 0; } }
      else if (a === 'undo') {
        var h = history.pop();
        if (h) { val[h.i] = h.v; notes[h.i] = h.n; wrong[h.i] = h.v && h.v !== sol[h.i] ? 1 : 0; sel = h.i; api.sound('move'); }
      } else if (a === 'hint') {
        if (hintsLeft <= 0) { api.sound('hit'); return; }
        var target = sel >= 0 && val[sel] !== sol[sel] ? sel : -1;
        if (target < 0) { var em = []; for (var k = 0; k < 81; k++) if (val[k] !== sol[k]) em.push(k); target = em[Math.floor(Math.random() * em.length)]; }
        if (target == null) return;
        hintsLeft--; sel = target;
        var nm = notesMode; notesMode = false; setVal(target, sol[target]); notesMode = nm;
        given[target] = 2;
      }
    }

    return {
      reset: function () {
        D = DIFF[api.diff];
        var p = generate();
        given = p.map(function (v) { return v ? 1 : 0; });
        val = p.slice(); notes = p.map(function () { return 0; }); wrong = p.map(function () { return 0; });
        sel = -1; notesMode = false; errs = 0; hintsLeft = D.hints; time = 0; done = false; endT = 0; t = 0;
        history = []; flashCells = {}; conf = [];
        layout();
      },
      resize: layout,
      idle: function (dt) { t += dt; },
      key: function (k, down) {
        if (!down) return;
        if (sel < 0) sel = 40;
        if (k === 'left') sel = sel % 9 ? sel - 1 : sel; else if (k === 'right') sel = sel % 9 < 8 ? sel + 1 : sel;
        else if (k === 'up') sel = sel >= 9 ? sel - 9 : sel; else if (k === 'down') sel = sel < 72 ? sel + 9 : sel;
      },
      input: function (type, d) {
        if (type !== 'tap') return;
        var c = Math.floor((d.x - bx) / cs), r = Math.floor((d.y - by) / cs);
        if (c >= 0 && r >= 0 && c < 9 && r < 9) { sel = r * 9 + c; api.sound('click'); return; }
        for (var i = 0; i < pad.length; i++) if (inR(d, pad[i])) { if (sel >= 0) setVal(sel, pad[i].d); return; }
        for (var j = 0; j < acts.length; j++) if (inR(d, acts[j])) { action(acts[j].a); return; }
      },
      update: function (dt) {
        t += dt; if (!done) time += dt;
        for (var k in flashCells) { flashCells[k] -= dt; if (flashCells[k] <= 0) delete flashCells[k]; }
        conf.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.rot += dt * 5; });
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        if (bgOff) c.drawImage(bgOff, 0, 0, W, H);
        // верхняя строка — бумажные ярлычки
        c.font = '800 14px system-ui, sans-serif'; c.textBaseline = 'middle';
        var sec = Math.floor(time), tl = '⏱ ' + Math.floor(sec / 60) + ':' + ('0' + sec % 60).slice(-2);
        var ml = api.t('sudoku.mistakes') + ': ' + errs + (D.maxErr < 99 ? '/' + D.maxErr : '');
        var w1 = c.measureText(tl).width + 22, w2 = c.measureText(ml).width + 22;
        c.fillStyle = 'rgba(0,0,0,.3)'; rrp(c, 8, 9, w1, 28, 14); c.fill(); rrp(c, W - 8 - w2, 9, w2, 28, 14); c.fill();
        c.fillStyle = 'rgba(255,248,230,.92)'; rrp(c, 8, 7, w1, 28, 14); c.fill();
        c.fillStyle = errs ? 'rgba(254,226,226,.95)' : 'rgba(255,248,230,.92)'; rrp(c, W - 8 - w2, 7, w2, 28, 14); c.fill();
        c.textAlign = 'left'; c.fillStyle = '#3f2a14'; c.fillText(tl, 19, 22);
        c.textAlign = 'right'; c.fillStyle = errs ? '#b91c1c' : '#3f2a14'; c.fillText(ml, W - 19, 22);
        // клетки
        var sv = sel >= 0 ? val[sel] : 0;
        for (var i = 0; i < 81; i++) {
          var x = bx + cols(i) * cs, y = by + rows(i) * cs, fc = null;
          var hl = sel >= 0 && (rows(i) === rows(sel) || cols(i) === cols(sel) || boxOf(i) === boxOf(sel));
          if (i === sel) fc = 'rgba(250,204,21,.55)';
          else if (sv && val[i] === sv) fc = 'rgba(59,130,246,.22)';
          else if (hl) fc = 'rgba(59,130,246,.08)';
          if (fc) { c.fillStyle = fc; c.fillRect(x, y, cs, cs); }
          if (flashCells[i]) { c.fillStyle = 'rgba(250,204,21,' + flashCells[i] * 0.8 + ')'; c.fillRect(x, y, cs, cs); }
          if (wrong[i] && val[i]) { c.fillStyle = 'rgba(248,113,113,.25)'; c.fillRect(x, y, cs, cs); }
        }
        if (gridOff) c.drawImage(gridOff, 0, 0, W, H);
        if (sel >= 0) { c.strokeStyle = '#ca8a04'; c.lineWidth = 2; c.strokeRect(bx + cols(sel) * cs + 1.5, by + rows(sel) * cs + 1.5, cs - 3, cs - 3); }
        c.textAlign = 'center';
        for (i = 0; i < 81; i++) {
          x = bx + cols(i) * cs; y = by + rows(i) * cs;
          if (val[i]) {
            if (given[i] === 1) { c.font = '700 ' + Math.round(cs * 0.62) + 'px ' + PRINT; c.fillStyle = '#1c1917'; c.fillText(String(val[i]), x + cs / 2, y + cs / 2 + 2); }
            else {
              c.font = '700 ' + Math.round(cs * 0.64) + 'px ' + HAND;
              c.fillStyle = wrong[i] ? '#dc2626' : given[i] === 2 ? '#7c3aed' : '#1d4ed8';
              c.fillText(String(val[i]), x + cs / 2 + ((i * 7) % 3 - 1) * 0.6, y + cs / 2 + 2);
            }
          } else if (notes[i]) {
            c.font = '600 ' + Math.round(cs * 0.26) + 'px ' + HAND; c.fillStyle = '#6b7280';
            for (var d = 1; d <= 9; d++) if (notes[i] & (1 << d)) c.fillText(String(d), x + ((d - 1) % 3 + 0.5) * cs / 3, y + (Math.floor((d - 1) / 3) + 0.5) * cs / 3 + 1);
          }
        }
        // цифровая панель
        var count = {}; for (var k = 0; k < 81; k++) if (val[k] && val[k] === sol[k]) count[val[k]] = (count[val[k]] || 0) + 1;
        if (pad.length) {
          var py0 = pad[0].y, ph = pad[0].h;
          var kg = c.createLinearGradient(0, py0, 0, py0 + ph); kg.addColorStop(0, '#fffaf0'); kg.addColorStop(1, '#e7dcc3');
          var kgN = c.createLinearGradient(0, py0, 0, py0 + ph); kgN.addColorStop(0, '#ede9fe'); kgN.addColorStop(1, '#c4b5fd');
          pad.forEach(function (p) {
            var fin = count[p.d] >= 9;
            c.globalAlpha = fin ? 0.35 : 1;
            keycap(c, p.x, p.y, p.w, p.h, 10, notesMode ? kgN : kg, notesMode ? '#6d28d9' : '#8b6b43', false);
            c.textAlign = 'center'; c.fillStyle = notesMode ? '#4c1d95' : '#1e3a5f';
            c.font = '700 ' + Math.round(Math.min(26, p.w * 0.6)) + 'px ' + PRINT; c.fillText(String(p.d), p.x + p.w / 2, p.y + p.h * 0.42);
            c.font = '700 10px system-ui, sans-serif'; c.fillStyle = 'rgba(30,58,95,.5)';
            if (!fin) c.fillText(String(9 - (count[p.d] || 0)), p.x + p.w / 2, p.y + p.h * 0.8);
            c.globalAlpha = 1;
          });
        }
        if (acts.length) {
          var ay0 = acts[0].y, ah = acts[0].h;
          var ag = c.createLinearGradient(0, ay0, 0, ay0 + ah); ag.addColorStop(0, '#475569'); ag.addColorStop(1, '#1e293b');
          var agOn = c.createLinearGradient(0, ay0, 0, ay0 + ah); agOn.addColorStop(0, '#a78bfa'); agOn.addColorStop(1, '#6d28d9');
          var agA = c.createLinearGradient(0, ay0, 0, ay0 + ah); agA.addColorStop(0, '#6366f1'); agA.addColorStop(1, '#3730a3');
          acts.forEach(function (a) {
            var on = a.a === 'notes' && notesMode, dis = a.a === 'hint' && hintsLeft <= 0;
            keycap(c, a.x, a.y, a.w, a.h, 12, on ? agOn : a.a === 'auto' ? agA : ag, '#0b1220', on);
            c.fillStyle = dis ? 'rgba(255,255,255,.3)' : '#f1f5f9'; c.font = '800 12px system-ui, sans-serif'; c.textAlign = 'center';
            var label = { undo: '↶', erase: '⌫', notes: '✎ ' + api.t('sudoku.notes'), auto: '✎✨ ' + api.t('sudoku.auto'), hint: '💡' + (hintsLeft < 20 ? ' ' + hintsLeft : '') }[a.a];
            c.fillText(label, a.x + a.w / 2, a.y + a.h / 2 + 1 + (on ? 2 : 0));
          });
        }
        conf.forEach(function (p) { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.col; c.fillRect(-4, -2, 8, 4); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(-4, -2, 8, 1.3); c.restore(); });
      }
    };
  }
};
