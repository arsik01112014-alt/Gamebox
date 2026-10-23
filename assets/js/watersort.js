/* Сортировка воды: разлей цветные жидкости по колбам */
window.GAMES = window.GAMES || {};
window.GAMES.watersort = {
  title: 'Цветная вода',
  desc: 'Разлей жидкости так, чтобы в каждой колбе был один цвет',
  hint: 'Тапни колбу, затем другую — жидкость перельётся, если сверху тот же цвет или колба пуста и есть место. Собери каждый цвет в отдельной колбе. ↶ — отмена (ограничена), ＋ — добавить пустую колбу, ⟲ — начать уровень заново, ⚑ — завершить. Меньше ходов — больше бонус.',
  d0: '3–6 цветов, отмена без ограничений',
  d1: '5–8 цветов, 5 отмен на уровень',
  d2: '7–10 цветов, 3 отмены на уровень',
  d3: '9–12 цветов, 2 отмены, одна запасная колба за игру',
  colors: ['#22d3ee', '#a855f7'],
  controls: 'none',
  cat: 'puzzle',
  isNew4: true,
  medals: [800, 2000, 3400],
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="watersortBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#312e81"/><stop offset="1" stop-color="#0f172a"/></linearGradient>' +
    '<linearGradient id="watersortG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".3" stop-color="#fff" stop-opacity=".05"/><stop offset=".8" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".25"/></linearGradient>' +
    '<clipPath id="watersortC1"><path d="M17 26h16v48a8 8 0 0 1-16 0z"/></clipPath><clipPath id="watersortC2"><path d="M42 26h16v48a8 8 0 0 1-16 0z"/></clipPath><clipPath id="watersortC3"><path d="M67 26h16v48a8 8 0 0 1-16 0z"/></clipPath></defs>' +
    '<rect x="4" y="4" width="92" height="92" rx="18" fill="url(#watersortBg)"/><circle cx="78" cy="20" r="14" fill="#a855f7" opacity=".18"/><circle cx="20" cy="84" r="16" fill="#22d3ee" opacity=".14"/>' +
    '<rect x="10" y="82" width="80" height="6" rx="3" fill="#7c4a2a"/><rect x="10" y="82" width="80" height="2.5" rx="1.2" fill="#b07548"/>' +
    '<g clip-path="url(#watersortC1)"><rect x="17" y="66" width="16" height="20" fill="#ef4444"/><rect x="17" y="54" width="16" height="12" fill="#22d3ee"/><rect x="17" y="42" width="16" height="12" fill="#facc15"/><path d="M17 42q4-2 8 0t8 0v3H17z" fill="#fde68a"/></g>' +
    '<g clip-path="url(#watersortC2)"><rect x="42" y="66" width="16" height="20" fill="#22d3ee"/><rect x="42" y="54" width="16" height="12" fill="#a855f7"/></g>' +
    '<g clip-path="url(#watersortC3)"><rect x="67" y="66" width="16" height="20" fill="#a855f7"/><rect x="67" y="54" width="16" height="12" fill="#ef4444"/><rect x="67" y="42" width="16" height="12" fill="#a855f7"/><rect x="67" y="30" width="16" height="12" fill="#a855f7"/></g>' +
    '<g fill="url(#watersortG)" stroke="rgba(255,255,255,.75)" stroke-width="2"><path d="M17 26h16v48a8 8 0 0 1-16 0z"/><path d="M42 26h16v48a8 8 0 0 1-16 0z"/><path d="M67 26h16v48a8 8 0 0 1-16 0z"/></g>' +
    '<g fill="#e2e8f0"><rect x="15" y="23" width="20" height="4" rx="2"/><rect x="40" y="23" width="20" height="4" rx="2"/><rect x="65" y="23" width="20" height="4" rx="2"/></g>' +
    '<path d="M50 14c-2 3-3 5-3 7a3 3 0 0 0 6 0c0-2-1-4-3-7z" fill="#22d3ee"/><circle cx="72" cy="38" r="1.6" fill="#fff" opacity=".7"/><circle cx="47" cy="62" r="1.3" fill="#fff" opacity=".6"/></svg>',

  create: function (api) {
    var CAP = 4;
    var PAL = [
      ['#ef4444', 0], ['#f97316', 0], ['#facc15', 0], ['#84cc16', 0], ['#15a34a', 0], ['#14b8a6', 0],
      ['#38bdf8', 0], ['#2563eb', 0], ['#8b5cf6', 0], ['#ec4899', 0], ['#92400e', 0], ['#cbd5e1', 0]
    ];
    var COLS = [[3, 3, 4, 4, 4, 5, 5, 5, 6, 6], [5, 5, 6, 6, 6, 7, 7, 7, 8, 8], [7, 7, 8, 8, 8, 9, 9, 9, 10, 10], [9, 9, 10, 10, 10, 11, 11, 11, 12, 12]];
    var UNDO = [99, 5, 3, 2];
    var pending = [], tubes, start, li, nCol, moves, par, undoLeft, extraLeft, extraUsed, hist, sel, pours, state, stT, t, parts, totalStars, levelScore, stars, enterT, hintT;
    var tw, iw, unit, Ltot, y0, yb, slots, rowsN, perRow, HUD = 58, BAR = 66;
    var dpr = 1, bgL = null, glassB = null, glassF = null, grads = {}, lw = 0, lh = 0, lastN = 0;

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function seedRnd(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
    function mkC(w, h) {
      var o = document.createElement('canvas');
      o.width = Math.max(1, Math.ceil(w * dpr)); o.height = Math.max(1, Math.ceil(h * dpr));
      var x = o.getContext('2d'); x.scale(dpr, dpr); return o;
    }
    function rr(c, x, y, w, h, r) {
      r = Math.max(0, Math.min(r, w / 2, h / 2));
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }

    // ---------- генерация ----------
    function runLen(a) { if (!a.length) return 0; var c = a[a.length - 1], k = 0; for (var i = a.length - 1; i >= 0 && a[i] === c; i--) k++; return k; }
    function isDone(a) { return a.length === CAP && runLen(a) === CAP; }
    function solve(T0, limit, jitter) {
      var T = T0.map(function (a) { return a.slice(); }), seen = {}, nodes = 0, path = 0;
      function key() { return T.map(function (a) { return a.join(''); }).sort().join('|'); }
      function done() { for (var i = 0; i < T.length; i++) if (T[i].length && !isDone(T[i])) return false; return true; }
      function dfs(depth) {
        if (done()) { path = depth; return true; }
        if (++nodes > limit) return false;
        var k = key(); if (seen[k]) return false; seen[k] = 1;
        var mv = [], i, j;
        for (i = 0; i < T.length; i++) {
          var A = T[i]; if (!A.length || isDone(A)) continue;
          var c = A[A.length - 1], r = runLen(A), emptyTried = false;
          for (j = 0; j < T.length; j++) {
            if (i === j) continue; var B = T[j];
            if (B.length >= CAP || (B.length && B[B.length - 1] !== c)) continue;
            if (!B.length) { if (r === A.length || emptyTried) continue; emptyTried = true; }
            var amt = Math.min(r, CAP - B.length);
            var pr = B.length ? (amt === r ? 3 : 1) + (B.length + amt === CAP && runLen(B) === B.length ? 5 : 0) : 0;
            mv.push([pr + (jitter ? Math.random() * 1.5 : 0), i, j, amt]);
          }
        }
        mv.sort(function (a, b) { return b[0] - a[0]; });
        for (var m = 0; m < mv.length; m++) {
          var x = mv[m], a = T[x[1]], b = T[x[2]], q;
          for (q = 0; q < x[3]; q++) b.push(a.pop());
          if (dfs(depth + 1)) return true;
          for (q = 0; q < x[3]; q++) a.push(b.pop());
        }
        return false;
      }
      return dfs(0) ? path : -1;
    }
    // запасной генератор: случайные обратные переливания из собранного состояния (всегда решаемо)
    function reverseGen(n) {
      var T = [], i, j, k, s;
      for (i = 0; i < n; i++) T.push([i, i, i, i]);
      T.push([]); T.push([]);
      var best = null, bestSc = -1;
      for (s = 0; s < n * 300; s++) {
        var mv = [];
        for (i = 0; i < T.length; i++) {
          var X = T[i]; if (!X.length) continue;
          var c = X[X.length - 1];
          for (k = 1; k <= X.length && X[X.length - k] === c; k++) {
            var rest = X.length - k; if (rest > 0 && X[rest - 1] !== c) continue;
            for (j = 0; j < T.length; j++) if (j !== i && CAP - T[j].length >= k && (!T[j].length || T[j][T[j].length - 1] !== c)) mv.push([i, j, k]);
          }
        }
        if (!mv.length) break;
        var m = mv[Math.floor(Math.random() * mv.length)];
        for (k = 0; k < m[2]; k++) T[m[1]].push(T[m[0]].pop());
        var full = 0, emp = 0, sc = 0;
        for (i = 0; i < T.length; i++) { if (T[i].length === CAP) full++; else if (!T[i].length) emp++; for (j = 1; j < T[i].length; j++) if (T[i][j] !== T[i][j - 1]) sc++; if (isDone(T[i])) sc -= 4; }
        if (full === n && emp === 2 && sc > bestSc) { bestSc = sc; best = T.map(function (a) { return a.slice(); }); }
      }
      return best;
    }
    function generate(n) {
      for (var tries = 0; tries < 40; tries++) {
        var bag = [], i, k;
        for (i = 0; i < n; i++) for (k = 0; k < CAP; k++) bag.push(i);
        for (i = bag.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), tt = bag[i]; bag[i] = bag[j]; bag[j] = tt; }
        var T = [], bad = false;
        for (i = 0; i < n; i++) { var a = bag.slice(i * CAP, i * CAP + CAP); T.push(a); if (runLen(a) >= 3 || (a[0] === a[1] && a[1] === a[2])) bad = true; }
        if (bad) continue;
        T.push([]); T.push([]);
        var p = solve(T, 40000, false);
        if (p < 0) continue;
        var p2 = solve(T, 20000, true); if (p2 > 0 && p2 < p) p = p2;
        return { T: T, par: p };
      }
      var R = reverseGen(n) || (function () { var x = []; for (var q = 0; q < n; q++) x.push([q, q, q, q]); x.push([]); x.push([]); return x; })();
      var pp = solve(R, 40000, false);
      return { T: R, par: pp > 0 ? pp : n * 3 };
    }

    // ---------- уровень ----------
    function loadLevel(i) {
      li = i; nCol = COLS[api.diff][i];
      var g = generate(nCol);
      // случайные цвета палитры
      var map = [], k; for (k = 0; k < PAL.length; k++) map.push(k);
      for (k = map.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)), tt = map[k]; map[k] = map[j]; map[j] = tt; }
      map = map.slice(0, nCol);
      start = g.T.map(function (a) { return a.map(function (c) { return map[c]; }); });
      par = g.par;
      tubes = start.map(mkTube);
      moves = 0; hist = []; sel = -1; pours = []; pending = []; state = 'play'; stT = 0; hintT = 0;
      undoLeft = UNDO[api.diff];
      if (api.diff < 3) extraLeft = 1;
      extraUsed = false;
      layout();
    }
    function mkTube(a) { return { c: a.slice(), lift: 0, shake: 0, cork: isDone(a) ? 1 : -1, wave: 0, bub: [], busy: 0, flash: 0 }; }
    function layout() {
      var W = api.W, H = api.H, N = tubes.length;
      rowsN = N > 7 ? 2 : 1; perRow = Math.ceil(N / rowsN);
      var colW = (W - 16) / perRow, ah = H - HUD - BAR - 20, rowH = ah / rowsN;
      tw = Math.min(58, colW * 0.64);
      unit = Math.min(tw * 1.4, (rowH - 60) / (CAP + 0.9));
      tw = Math.min(tw, unit * 1.05);
      iw = tw - 5;
      y0 = unit * 0.55; yb = y0 + unit * CAP + unit * 0.15; Ltot = yb + 3;
      slots = [];
      for (var i = 0; i < N; i++) {
        var r = Math.floor(i / perRow), inRow = Math.min(perRow, N - r * perRow), ci = i - r * perRow;
        var rowW = inRow * colW;
        var sx = (W - rowW) / 2 + colW * (ci + 0.5);
        var sy = HUD + 18 + rowH * r + (rowH - Ltot - 26) / 2 + 10;
        slots.push({ x: sx, y: sy });
      }
      build();
    }
    function tubePath(c) {
      var hw = tw / 2, r = hw;
      c.beginPath(); c.moveTo(-hw, 0); c.lineTo(-hw, Ltot - r); c.arc(0, Ltot - r, r, Math.PI, 0, true); c.lineTo(hw, 0); c.closePath();
    }
    function innerPath(c) {
      var hw = iw / 2, r = hw;
      c.beginPath(); c.moveTo(-hw, 1); c.lineTo(-hw, yb - r); c.arc(0, yb - r, r, Math.PI, 0, true); c.lineTo(hw, 1); c.closePath();
    }
    function build() {
      var W = api.W, H = api.H, c, g, i, r = seedRnd(5);
      dpr = Math.min(2, window.devicePixelRatio || 1); lw = W; lh = H; lastN = tubes.length;
      bgL = mkC(W, H); c = bgL.getContext('2d');
      g = c.createLinearGradient(0, 0, W * 0.4, H);
      g.addColorStop(0, '#1e1b4b'); g.addColorStop(0.55, '#14143a'); g.addColorStop(1, '#0b1020');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // боке
      for (i = 0; i < (api.quality ? 22 : 8); i++) {
        var x = r() * W, y = r() * H, br = 12 + r() * 60, hue = [190, 270, 320, 160][i % 4];
        g = c.createRadialGradient(x, y, 0, x, y, br);
        g.addColorStop(0, 'hsla(' + hue + ',90%,65%,' + (0.06 + r() * 0.08) + ')'); g.addColorStop(0.7, 'hsla(' + hue + ',90%,65%,' + (0.03) + ')'); g.addColorStop(1, 'hsla(' + hue + ',90%,65%,0)');
        c.fillStyle = g; c.beginPath(); c.arc(x, y, br, 0, 6.283); c.fill();
      }
      // плитка лаборатории
      c.strokeStyle = 'rgba(255,255,255,.035)'; c.lineWidth = 1;
      for (x = 0; x < W; x += 36) { c.beginPath(); c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, H); c.stroke(); }
      for (y = 0; y < H; y += 36) { c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(W, y + 0.5); c.stroke(); }
      // полки
      for (var rI = 0; rI < rowsN; rI++) {
        var first = slots[rI * perRow], last = slots[Math.min(slots.length - 1, rI * perRow + perRow - 1)];
        var shY = first.y + Ltot + 4, x1 = first.x - tw * 0.9 - 6, x2 = last.x + tw * 0.9 + 6;
        c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 14; c.shadowOffsetY = 8;
        g = c.createLinearGradient(0, shY, 0, shY + 14); g.addColorStop(0, '#a26a3f'); g.addColorStop(0.4, '#7c4a2a'); g.addColorStop(1, '#4a2a16');
        c.fillStyle = g; rr(c, x1, shY, x2 - x1, 14, 4); c.fill(); c.restore();
        c.fillStyle = 'rgba(255,220,180,.35)'; c.fillRect(x1 + 3, shY + 1, x2 - x1 - 6, 1.5);
        c.strokeStyle = 'rgba(60,30,10,.35)';
        for (i = 0; i < 6; i++) { var gy = shY + 4 + r() * 8; c.beginPath(); c.moveTo(x1 + 4, gy); c.bezierCurveTo(x1 + (x2 - x1) * 0.3, gy + rnd(-2, 2), x1 + (x2 - x1) * 0.6, gy + rnd(-2, 2), x2 - 4, gy); c.stroke(); }
        // кронштейны
        [x1 + 14, x2 - 14].forEach(function (bxx) { c.fillStyle = '#334155'; c.fillRect(bxx - 3, shY + 14, 6, 10); c.fillStyle = '#64748b'; c.fillRect(bxx - 3, shY + 14, 2, 10); });
        // гнёзда-тени под колбами
        for (i = rI * perRow; i < Math.min(slots.length, rI * perRow + perRow); i++) {
          g = c.createRadialGradient(slots[i].x, shY + 1, 0, slots[i].x, shY + 1, tw * 0.7);
          g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = g; c.fillRect(slots[i].x - tw, shY - 6, tw * 2, 10);
        }
      }
      // HUD-полосы
      g = c.createLinearGradient(0, 0, 0, HUD); g.addColorStop(0, 'rgba(0,0,0,.4)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, HUD);
      g = c.createLinearGradient(0, H - BAR - 10, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)');
      c.fillStyle = g; c.fillRect(0, H - BAR - 10, W, BAR + 10);
      g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)'); c.fillStyle = g; c.fillRect(0, 0, W, H);

      // стекло: задняя стенка и передние блики (локальные координаты: устье в (pad, pad+lip))
      var pad = 6, sw = tw + pad * 2, sh = Ltot + pad * 2 + 6;
      glassB = mkC(sw, sh); c = glassB.getContext('2d'); c.translate(sw / 2, pad + 4);
      tubePath(c); c.fillStyle = 'rgba(200,230,255,.07)'; c.fill();
      c.save(); tubePath(c); c.clip();
      g = c.createLinearGradient(-tw / 2, 0, tw / 2, 0); g.addColorStop(0, 'rgba(0,0,0,.25)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.25)');
      c.fillStyle = g; c.fillRect(-tw, 0, tw * 2, Ltot); c.restore();
      glassF = mkC(sw, sh); c = glassF.getContext('2d'); c.translate(sw / 2, pad + 4);
      c.save(); tubePath(c); c.clip();
      g = c.createLinearGradient(-tw / 2, 0, tw / 2, 0);
      g.addColorStop(0, 'rgba(255,255,255,.28)'); g.addColorStop(0.12, 'rgba(255,255,255,.42)'); g.addColorStop(0.24, 'rgba(255,255,255,.06)');
      g.addColorStop(0.7, 'rgba(255,255,255,0)'); g.addColorStop(0.86, 'rgba(255,255,255,.14)'); g.addColorStop(1, 'rgba(255,255,255,.3)');
      c.fillStyle = g; c.fillRect(-tw, 0, tw * 2, Ltot + 2);
      c.fillStyle = 'rgba(255,255,255,.55)'; rr(c, -tw * 0.32, unit * 0.8, tw * 0.09, Ltot * 0.55, tw * 0.05); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(-tw * 0.27, Ltot * 0.55 + unit * 1.1, tw * 0.05, 0, 6.283); c.fill();
      c.restore();
      tubePath(c); c.strokeStyle = 'rgba(220,240,255,.75)'; c.lineWidth = 1.6; c.stroke();
      c.save(); tubePath(c); c.clip(); c.strokeStyle = 'rgba(0,10,30,.35)'; c.lineWidth = 3; c.beginPath(); c.arc(0, Ltot - tw / 2, tw / 2 - 1.5, 0.3, Math.PI - 0.3); c.stroke(); c.restore();
      // горлышко-ободок
      g = c.createLinearGradient(-tw / 2 - 3, 0, tw / 2 + 3, 0); g.addColorStop(0, '#94a3b8'); g.addColorStop(0.3, '#f8fafc'); g.addColorStop(0.7, '#cbd5e1'); g.addColorStop(1, '#64748b');
      c.fillStyle = g; rr(c, -tw / 2 - 3, -3, tw + 6, 6, 3); c.fill();
      c.strokeStyle = 'rgba(15,23,42,.35)'; c.lineWidth = 1; c.stroke();
      // градиенты жидкостей
      grads = {};
    }
    function grad(c, ci) {
      if (grads[ci]) return grads[ci];
      var base = PAL[ci][0], g = c.createLinearGradient(-iw / 2, 0, iw / 2, 0);
      g.addColorStop(0, shade(base, -0.35)); g.addColorStop(0.25, shade(base, 0.18)); g.addColorStop(0.45, base); g.addColorStop(1, shade(base, -0.45));
      grads[ci] = g; return g;
    }
    function shade(hex, k) {
      var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
      if (k > 0) { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; } else { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
      return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
    }

    // ---------- геометрия наклонённой жидкости ----------
    function clipH(poly, nx, ny, cv, ge) {
      var out = [], n = poly.length;
      for (var i = 0; i < n; i++) {
        var a = poly[i], b = poly[(i + 1) % n], ha = a[0] * nx + a[1] * ny - cv, hb = b[0] * nx + b[1] * ny - cv;
        if (!ge) { ha = -ha; hb = -hb; }
        if (ha >= 0) out.push(a);
        if ((ha >= 0) !== (hb >= 0)) { var k = ha / (ha - hb); out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); }
      }
      return out;
    }
    function area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
    function rectP() { return [[-iw / 2, y0 - unit * 0.5], [iw / 2, y0 - unit * 0.5], [iw / 2, yb], [-iw / 2, yb]]; }
    function levelC(th, v) {
      // порог h (глубина вдоль вертикали мира), ниже которого объём v
      var nx = Math.sin(th), ny = Math.cos(th), R = rectP(), lo = 1e9, hi = -1e9;
      R.forEach(function (p) { var h = p[0] * nx + p[1] * ny; lo = Math.min(lo, h); hi = Math.max(hi, h); });
      if (v <= 0) return hi;
      for (var it = 0; it < 22; it++) { var mid = (lo + hi) / 2; if (area(clipH(R, nx, ny, mid, true)) > v) lo = mid; else hi = mid; }
      return (lo + hi) / 2;
    }
    function touchAngle(v) {
      // угол, при котором поверхность доходит до края горлышка
      var lo = 0, hi = 1.62, cx = iw / 2, cy = y0 - unit * 0.5;
      for (var it = 0; it < 16; it++) {
        var mid = (lo + hi) / 2, h = cx * Math.sin(mid) + cy * Math.cos(mid);
        if (levelC(mid, v) > h) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }
    function drawLiquid(c, layers, th, tb) {
      // layers: [{c, v}] снизу вверх, v — в долях юнита
      c.save(); innerPath(c); c.clip();
      var nx = Math.sin(th), ny = Math.cos(th), A = iw * unit, R = rectP(), cum = 0, i, tilt = Math.abs(th) > 0.01, top = 0;
      for (i = 0; i < layers.length; i++) top += layers[i].v;
      for (i = 0; i < layers.length; i++) {
        var L = layers[i]; if (L.v <= 0.001) continue;
        c.fillStyle = grad(c, L.c);
        if (!tilt) {
          var yTop = yb - (cum + L.v) * unit, yBot = yb - cum * unit + (cum === 0 ? 4 : 0.6);
          if (i === layers.length - 1 && tb) {
            // волнистая поверхность
            var amp = 0.8 + tb.wave * 3.5, ph = t * 5 + tb.ph;
            c.beginPath(); c.moveTo(-iw / 2, yBot);
            for (var x = -iw / 2; x <= iw / 2 + 0.1; x += iw / 8) c.lineTo(x, yTop + Math.sin(ph + x * 0.35) * amp);
            c.lineTo(iw / 2, yBot); c.closePath(); c.fill();
            c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.2; c.beginPath();
            for (x = -iw / 2; x <= iw / 2 + 0.1; x += iw / 8) { var yy = yTop + Math.sin(ph + x * 0.35) * amp; if (x === -iw / 2) c.moveTo(x, yy); else c.lineTo(x, yy); }
            c.stroke();
          } else c.fillRect(-iw / 2, yTop, iw, yBot - yTop);
        } else {
          var cHi = levelC(th, (cum + L.v) * A), cLo = levelC(th, cum * A);
          var poly = clipH(R, nx, ny, cHi, true);
          if (cum > 0) poly = clipH(poly, nx, ny, cLo + 0.6, false);
          if (poly.length > 2) { c.beginPath(); c.moveTo(poly[0][0], poly[0][1]); for (var k = 1; k < poly.length; k++) c.lineTo(poly[k][0], poly[k][1]); c.closePath(); c.fill(); }
          if (i === layers.length - 1) {
            // линия поверхности
            var sp = clipH(clipH(R, nx, ny, cHi - 0.8, true), nx, ny, cHi + 0.8, false);
            if (sp.length > 2) { c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.moveTo(sp[0][0], sp[0][1]); for (k = 1; k < sp.length; k++) c.lineTo(sp[k][0], sp[k][1]); c.closePath(); c.fill(); }
          }
        }
        cum += L.v;
      }
      // пузырьки
      if (tb && !tilt && api.quality > 0) {
        for (i = 0; i < tb.bub.length; i++) {
          var b = tb.bub[i], by2 = yb - b.y * unit;
          if (b.y > top - 0.1) continue;
          c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.arc(b.x * iw / 2 + Math.sin(t * 6 + b.p) * 1.5, by2, b.r, 0, 6.283); c.fill();
          c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(b.x * iw / 2 + Math.sin(t * 6 + b.p) * 1.5 - b.r * 0.3, by2 - b.r * 0.3, b.r * 0.35, 0, 6.283); c.fill();
        }
      }
      c.restore();
    }
    function layersOf(a, extraTop, extraV) {
      var out = [];
      for (var i = 0; i < a.length; i++) { var last = out[out.length - 1]; if (last && last.c === a[i]) last.v += 1; else out.push({ c: a[i], v: 1 }); }
      if (extraTop != null && extraV > 0) { var l2 = out[out.length - 1]; if (l2 && l2.c === extraTop) l2.v += extraV; else out.push({ c: extraTop, v: extraV }); }
      return out;
    }

    // ---------- логика ----------
    function canPour(i, j) {
      var A = tubes[i].c, B = tubes[j].c;
      if (i === j || !A.length || B.length >= CAP || isDone(A)) return 0;
      var c = A[A.length - 1];
      if (B.length && B[B.length - 1] !== c) return 0;
      return Math.min(runLen(A), CAP - B.length);
    }
    function pour(i, j) {
      var amt = canPour(i, j); if (!amt) return false;
      hist.push(tubes.map(function (tb) { return tb.c.slice(); }));
      var A = tubes[i], B = tubes[j], col = A.c[A.c.length - 1], volA = A.c.length;
      for (var k = 0; k < amt; k++) B.c.push(A.c.pop());
      moves++;
      A.busy++; B.busy++;
      var dir = slots[i].x < slots[j].x ? 1 : -1;
      pours.push({ a: i, b: j, col: col, amt: amt, volA: volA, t: 0, dir: dir, T1: 0.2, T2: 0.16 + amt * 0.09, T3: 0.2, done: false, sfx: 0 });
      api.tone(420, 0.06, 'sine', 0.05);
      return true;
    }
    function pourState(p) {
      // позиция, угол, прогресс налива
      var s = slots[p.a], d = slots[p.b], k, e, lift = 22;
      var px = d.x - p.dir * (tw * 0.1), py = d.y - unit * 0.9 - 18;
      var thMax = touchAngle(Math.max(0, p.volA - p.amt) * iw * unit) * p.dir, th0 = Math.max(0.2, touchAngle(p.volA * iw * unit) * 0.92) * p.dir;
      if (p.t < p.T1) { k = p.t / p.T1; e = k * k * (3 - 2 * k); return { x: s.x + (px - s.x) * e, y: s.y - lift + (py - s.y + lift) * e, th: th0 * e, f: 0 }; }
      if (p.t < p.T1 + p.T2) {
        k = (p.t - p.T1) / p.T2; var f = Math.min(1, k * 1.1);
        var curV = (p.volA - p.amt * f) * iw * unit;
        return { x: px, y: py, th: Math.max(Math.abs(th0), touchAngle(curV)) * p.dir, f: f };
      }
      k = Math.min(1, (p.t - p.T1 - p.T2) / p.T3); e = k * k * (3 - 2 * k);
      return { x: px + (s.x - px) * e, y: py + (s.y - py) * e, th: thMax * (1 - e), f: 1 };
    }
    function finishPour(p) {
      var A = tubes[p.a], B = tubes[p.b];
      A.busy--; B.busy--;
      if (isDone(B.c) && B.cork < 0) {
        B.cork = 0; B.flash = 1;
        sparkle(slots[p.b].x, slots[p.b].y + Ltot * 0.4, PAL[B.c[0]][0]);
        api.sound('coin'); api.vibrate(25);
        [523, 659, 784].forEach(function (f, n) { setTimeout(function () { api.tone(f, 0.1, 'triangle', 0.06); }, n * 70); });
      }
    }
    function allDone() { for (var i = 0; i < tubes.length; i++) if (tubes[i].c.length && !isDone(tubes[i].c)) return false; return !pours.length; }
    function anyMove() { for (var i = 0; i < tubes.length; i++) for (var j = 0; j < tubes.length; j++) if (canPour(i, j)) return true; return false; }
    function winLevel() {
      state = 'win'; stT = 0;
      stars = moves <= par ? 3 : moves <= Math.ceil(par * 1.3) ? 2 : 1;
      levelScore = 100 + nCol * 20 + Math.max(0, par - moves) * 10 + (stars === 3 ? 100 : stars === 2 ? 40 : 0) - (extraUsed ? 50 : 0);
      levelScore = Math.max(50, levelScore) * (1 + api.diff * 0.25) | 0;
      totalStars += stars;
      api.addScore(levelScore); api.sound('win'); api.fx.confetti(80);
      api.fx.text(api.W / 2, api.H / 2 - 40, '+' + levelScore, '#a5f3fc');
    }
    function undo() {
      if (pours.length || state !== 'play') return;
      if (!hist.length) { api.tone(200, 0.05, 'sine', 0.04); return; }
      if (undoLeft <= 0) { api.toast(api.t('watersort.noUndo')); api.tone(160, 0.08, 'sine', 0.05); return; }
      var s = hist.pop(); undoLeft--;
      tubes.forEach(function (tb, i) { tb.c = s[i] ? s[i].slice() : []; tb.cork = isDone(tb.c) ? 1 : -1; tb.wave = 0.6; });
      sel = -1; api.sound('click');
    }
    function addTube() {
      if (pours.length || state !== 'play') return;
      if (extraUsed || extraLeft <= 0 || tubes.length >= 16) { api.toast(api.t('watersort.noTube')); api.tone(160, 0.08, 'sine', 0.05); return; }
      extraLeft--; extraUsed = true;
      tubes.push(mkTube([])); tubes[tubes.length - 1].flash = 1;
      layout(); sel = -1; api.sound('bonus');
    }
    function restartLvl() {
      if (pours.length || state !== 'play' || !moves) return;
      tubes = start.map(mkTube); if (extraUsed) tubes.push(mkTube([]));
      moves = 0; hist = []; sel = -1; undoLeft = UNDO[api.diff]; layout(); api.sound('rotate');
    }
    function finish() { if (state === 'play' || state === 'win') { state = 'end'; api.gameOver(); } }
    function next() {
      if (li + 1 >= COLS[api.diff].length) { state = 'all'; stT = 0; api.addScore(totalStars * 25 * (api.diff + 1)); api.sound('bonus'); api.fx.confetti(140); return; }
      loadLevel(li + 1); enterT = 0.5;
    }
    function sparkle(x, y, col) {
      for (var i = 0; i < (api.quality ? 26 : 10); i++) { var a = rnd(0, 6.283), v = rnd(50, 160); parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, r: rnd(1.5, 3.5), life: rnd(0.5, 0.9), max: 0.9, c: i % 3 ? col : '#ffffff', g: 200 }); }
    }
    function hitTube(x, y) {
      var best = -1, bd = 1e9;
      for (var i = 0; i < tubes.length; i++) {
        var s = slots[i], dx = Math.abs(x - s.x), top = s.y - 30, bot = s.y + Ltot + 16;
        if (dx < Math.max(tw * 0.9, 22) && y > top && y < bot && dx < bd) { bd = dx; best = i; }
      }
      return best;
    }

    // ---------- HUD ----------
    var BTN = ['undo', 'tube', 'restart', 'finish'], press = { k: -1, t: 0 };
    function btnPos(i) { var n = BTN.length, gap = Math.min(84, (api.W - 40) / n); return { x: api.W / 2 + (i - (n - 1) / 2) * gap, y: api.H - BAR / 2 + 2, r: 22 }; }
    function icon(c, k, x, y) {
      c.strokeStyle = '#fff'; c.fillStyle = '#fff'; c.lineWidth = 2.6; c.lineCap = 'round'; c.lineJoin = 'round';
      if (k === 'undo') { c.beginPath(); c.arc(x + 1, y + 2, 7, -2.6, 1.6); c.stroke(); c.beginPath(); c.moveTo(x - 9, y - 5); c.lineTo(x - 5.5, y + 1.5); c.lineTo(x - 0.5, y - 4.5); c.closePath(); c.fill(); }
      else if (k === 'restart') { c.beginPath(); c.arc(x, y, 7.5, -1.2, 4.6); c.stroke(); c.beginPath(); c.moveTo(x + 1, y - 12); c.lineTo(x + 7, y - 7.5); c.lineTo(x + 0.5, y - 3.5); c.closePath(); c.fill(); }
      else if (k === 'tube') { c.lineWidth = 2; c.beginPath(); c.moveTo(x - 4, y - 9); c.lineTo(x - 4, y + 5); c.arc(x, y + 5, 4, Math.PI, 0, true); c.lineTo(x + 4, y - 9); c.stroke(); c.lineWidth = 2.4; c.beginPath(); c.moveTo(x + 9, y - 6); c.lineTo(x + 9, y + 2); c.moveTo(x + 5, y - 2); c.lineTo(x + 13, y - 2); c.stroke(); }
      else { c.beginPath(); c.moveTo(x - 6, y + 9); c.lineTo(x - 6, y - 9); c.stroke(); c.beginPath(); c.moveTo(x - 5, y - 9); c.lineTo(x + 8, y - 5); c.lineTo(x - 5, y - 1); c.closePath(); c.fill(); }
      c.lineCap = 'butt'; c.lineJoin = 'miter';
    }
    function pill(c, x, y, w, h) {
      var g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(255,255,255,.16)'); g.addColorStop(1, 'rgba(255,255,255,.05)');
      c.fillStyle = 'rgba(0,0,0,.35)'; rr(c, x, y + 2, w, h, h / 2); c.fill();
      c.fillStyle = g; rr(c, x, y, w, h, h / 2); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 1; c.stroke();
    }
    function star(c, x, y, r, fill) {
      c.beginPath();
      for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
      c.closePath(); c.fillStyle = fill; c.fill();
    }
    function drawHUD(c) {
      var W = api.W;
      c.textBaseline = 'middle';
      var lt = api.t('watersort.level') + ' ' + (li + 1) + '/' + COLS[api.diff].length;
      c.font = '800 15px system-ui, sans-serif'; var w1 = c.measureText(lt).width + 26;
      pill(c, 10, 10, w1, 34); c.fillStyle = '#a5f3fc'; c.textAlign = 'left'; c.fillText(lt, 23, 28);
      var mt = api.t('memory.moves') + ' ' + moves, pt = api.t('watersort.par') + ' ' + par;
      c.font = '800 15px system-ui, sans-serif'; var wm = c.measureText(mt).width;
      c.font = '700 11px system-ui, sans-serif'; var wp = c.measureText(pt).width;
      var w2 = Math.max(wm, wp) + 28, x2 = W - 10 - w2;
      pill(c, x2, 6, w2, 42); c.textAlign = 'center';
      c.font = '800 15px system-ui, sans-serif'; c.fillStyle = '#fff'; c.fillText(mt, x2 + w2 / 2, 21);
      c.font = '700 11px system-ui, sans-serif'; c.fillStyle = moves <= par ? '#86efac' : '#cbd5e1'; c.fillText(pt, x2 + w2 / 2, 37);
      var cx = (10 + w1 + x2) / 2, sp = moves <= par ? 3 : moves <= Math.ceil(par * 1.3) ? 2 : 1;
      if (cx - 30 > 10 + w1) for (var i = 0; i < 3; i++) star(c, cx - 16 + i * 16, 27, 7, i < sp ? '#facc15' : 'rgba(255,255,255,.18)');
      for (i = 0; i < BTN.length; i++) {
        var p = btnPos(i), b = BTN[i], pr = press.k === i ? press.t : 0;
        var dis = (b === 'undo' && (!hist.length || undoLeft <= 0)) || (b === 'tube' && (extraUsed || extraLeft <= 0)) || (b === 'restart' && !moves);
        c.save(); c.translate(p.x, p.y); var sc = 1 - pr * 0.6; c.scale(sc, sc);
        c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.arc(0, 3, p.r, 0, 6.283); c.fill();
        var col = b === 'finish' ? ['#fb7185', '#be123c'] : b === 'tube' ? ['#34d399', '#047857'] : ['#67e8f9', '#4f46e5'];
        if (dis) col = ['#475569', '#1e293b'];
        var g = c.createLinearGradient(0, -p.r, 0, p.r); g.addColorStop(0, col[0]); g.addColorStop(1, col[1]);
        c.fillStyle = g; c.beginPath(); c.arc(0, 0, p.r, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, p.r - 1, 3.5, 5.9); c.stroke();
        c.globalAlpha = dis ? 0.45 : 1; icon(c, b, 0, 0); c.globalAlpha = 1;
        var badge = b === 'undo' ? (undoLeft > 50 ? '∞' : String(undoLeft)) : b === 'tube' ? String(extraUsed ? 0 : extraLeft) : '';
        if (badge) {
          c.fillStyle = '#fff'; c.beginPath(); c.arc(p.r * 0.72, -p.r * 0.72, 8.5, 0, 6.283); c.fill();
          c.fillStyle = b === 'tube' ? '#047857' : '#4338ca'; c.font = '900 11px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText(badge, p.r * 0.72, -p.r * 0.72 + 0.5);
        }
        c.restore();
      }
    }
    function drawBanner(c) {
      var W = api.W, H = api.H, k = Math.min(1, stT * 3), e = 1 - Math.pow(1 - k, 3);
      c.fillStyle = 'rgba(5,6,20,' + (0.55 * k) + ')'; c.fillRect(0, 0, W, H);
      var bw = Math.min(320, W - 40), bh = 186, x = (W - bw) / 2, y = H / 2 - bh / 2 + (1 - e) * 60;
      c.globalAlpha = k;
      c.fillStyle = 'rgba(0,0,0,.5)'; rr(c, x, y + 6, bw, bh, 24); c.fill();
      var g = c.createLinearGradient(0, y, 0, y + bh); g.addColorStop(0, '#312e81'); g.addColorStop(1, '#0f172a');
      c.fillStyle = g; rr(c, x, y, bw, bh, 24); c.fill();
      c.strokeStyle = 'rgba(165,243,252,.55)'; c.lineWidth = 2; c.stroke();
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = '900 22px system-ui, sans-serif'; c.fillStyle = '#a5f3fc';
      c.fillText(state === 'all' ? api.t('watersort.all') : api.t('watersort.clear'), W / 2, y + 36);
      var ns = state === 'win' ? stars : 3;
      for (var i = 0; i < 3; i++) {
        var sk = Math.max(0, Math.min(1, (stT - 0.25 - i * 0.22) * 4)), sz = i === 1 ? 26 : 21, pop = sk < 1 ? 0.4 + sk * 0.9 : 1 + Math.sin(t * 3 + i) * 0.04;
        var sy = y + 86 - (i === 1 ? 8 : 0);
        star(c, W / 2 + (i - 1) * 56, sy + 2, sz + 3, 'rgba(0,0,0,.35)');
        star(c, W / 2 + (i - 1) * 56, sy, i < ns ? sz * pop : sz, i < ns && sk > 0 ? '#facc15' : 'rgba(255,255,255,.15)');
        if (i < ns && sk > 0) star(c, W / 2 + (i - 1) * 56 - sz * 0.15, sy - 4, sz * 0.35 * pop, 'rgba(255,255,255,.55)');
      }
      c.font = '700 14px system-ui, sans-serif'; c.fillStyle = '#e2e8f0';
      if (state === 'win') c.fillText(api.t('memory.moves') + ': ' + moves + '  ·  ' + api.t('watersort.par') + ': ' + par + '  ·  +' + levelScore, W / 2, y + 130);
      else c.fillText('★ ' + totalStars, W / 2, y + 130);
      if (stT > 0.9) { c.font = '700 13px system-ui, sans-serif'; c.fillStyle = 'rgba(255,255,255,' + (0.5 + Math.sin(t * 5) * 0.3) + ')'; c.fillText(api.t('sokoban.tapNext'), W / 2, y + 162); }
      c.globalAlpha = 1;
    }
    function drawCork(c, k) {
      var e = k < 1 ? 1 - Math.pow(1 - k, 3) : 1, yy = -unit * 1.2 * (1 - e) - 2, cw = tw * 0.62, ch = unit * 0.45;
      c.globalAlpha = Math.min(1, k * 3);
      var g = c.createLinearGradient(-cw / 2, 0, cw / 2, 0); g.addColorStop(0, '#92400e'); g.addColorStop(0.35, '#d6a066'); g.addColorStop(1, '#78350f');
      c.fillStyle = g; rr(c, -cw / 2, yy - ch * 0.6, cw, ch, 3); c.fill();
      c.fillStyle = 'rgba(60,30,10,.35)'; for (var i = 0; i < 5; i++) c.fillRect(-cw / 2 + 2 + (i * 7 % (cw - 4)), yy - ch * 0.4 + (i % 3) * 3, 1.5, 1.5);
      c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-cw / 2 + 2, yy - ch * 0.6 + 1, cw - 4, 1.5);
      c.globalAlpha = 1;
    }
    function drawTube(c, i, x, y, th, layers, tb, pourCol) {
      c.save(); c.translate(x, y); if (th) c.rotate(th);
      var pad = 6, sw = tw + pad * 2, sh = Ltot + pad * 2 + 6;
      if (tb && tb.flash > 0) { c.globalAlpha = tb.flash * 0.6; c.fillStyle = '#fff'; tubePath(c); c.fill(); c.globalAlpha = 1; }
      c.drawImage(glassB, -sw / 2, -pad - 4, sw, sh);
      drawLiquid(c, layers, th || 0, tb);
      c.drawImage(glassF, -sw / 2, -pad - 4, sw, sh);
      if (tb && tb.cork >= 0) drawCork(c, tb.cork);
      if (sel === i && !th) {
        c.strokeStyle = 'rgba(165,243,252,' + (0.6 + Math.sin(t * 6) * 0.3) + ')'; c.lineWidth = 2.5;
        c.save(); c.translate(0, 0); c.scale(1.08, 1.02); tubePath(c); c.restore(); c.stroke();
      }
      c.restore();
    }

    if (window.__test) window.__test.watersort = function () { return { li: li, tubes: tubes, slots: slots, state: state, moves: moves, pours: pours, pending: pending, solve: solve, Ltot: Ltot, sel: sel }; };
    return {
      reset: function () {
        t = 0; parts = []; totalStars = 0; extraLeft = 1; enterT = 0.5;
        loadLevel(0);
      },
      resize: layout,
      idle: function (dt) { t += dt; },
      key: function (k, d) { if (d && state !== 'play' && (k === 'a' || k === 'space')) this.input('tap', { x: 0, y: 0 }); },
      input: function (type, d) {
        if (type === 'down') {
          for (var i = 0; i < BTN.length; i++) { var p = btnPos(i), dx = d.x - p.x, dy = d.y - p.y; if (dx * dx + dy * dy < (p.r + 8) * (p.r + 8)) { press.k = i; press.t = 0.3; } }
          return;
        }
        if (type !== 'tap') return;
        if (state === 'win') { if (stT > 0.6) next(); return; }
        if (state === 'all') { if (stT > 0.8) { state = 'end'; api.gameOver(); } return; }
        if (state !== 'play') return;
        for (i = 0; i < BTN.length; i++) {
          p = btnPos(i); dx = d.x - p.x; dy = d.y - p.y;
          if (dx * dx + dy * dy < (p.r + 8) * (p.r + 8)) { var b = BTN[i]; if (b === 'undo') undo(); else if (b === 'tube') addTube(); else if (b === 'restart') restartLvl(); else finish(); return; }
        }
        var h = hitTube(d.x, d.y);
        if (h < 0) { sel = -1; return; }
        if (sel < 0) {
          if (!pending.length && !tubes[h].busy && (!tubes[h].c.length || isDone(tubes[h].c))) { tubes[h].shake = 0.3; api.tone(150, 0.05, 'sine', 0.04); return; }
          sel = h; api.tone(600, 0.04, 'triangle', 0.04); api.vibrate(5); return;
        }
        if (h === sel) { sel = -1; api.tone(480, 0.04, 'triangle', 0.03); return; }
        if (tubes[h].busy || tubes[sel].busy || pending.length) { if (pending.length < 12) pending.push([sel, h]); sel = -1; return; }
        if (pour(sel, h)) { sel = -1; api.vibrate(8); return; }
        tubes[h].shake = 0.3; api.tone(140, 0.08, 'square', 0.03);
        if (tubes[h].c.length && !isDone(tubes[h].c)) sel = h; else sel = -1;
      },
      update: function (dt) {
        t += dt;
        if (press.t > 0) press.t = Math.max(0, press.t - dt * 2); else press.k = -1;
        if (enterT > 0) enterT = Math.max(0, enterT - dt);
        tubes.forEach(function (tb, i) {
          var target = sel === i ? 1 : 0; tb.lift += (target - tb.lift) * Math.min(1, dt * 14);
          if (tb.shake > 0) tb.shake -= dt;
          if (tb.flash > 0) tb.flash = Math.max(0, tb.flash - dt * 1.6);
          if (tb.cork >= 0 && tb.cork < 1) tb.cork = Math.min(1, tb.cork + dt * 2.5);
          tb.wave = Math.max(0, tb.wave - dt * 0.8);
          if (tb.ph == null) tb.ph = Math.random() * 6;
          if (api.quality > 0 && tb.c.length && !tb.busy && Math.random() < dt * (0.25 + tb.wave * 6)) tb.bub.push({ x: rnd(-0.7, 0.7), y: 0.15, r: rnd(1, 2.4), v: rnd(0.8, 1.6), p: rnd(0, 6) });
          for (var b = tb.bub.length - 1; b >= 0; b--) { tb.bub[b].y += tb.bub[b].v * dt; if (tb.bub[b].y > tb.c.length) tb.bub.splice(b, 1); }
        });
        for (var i = pours.length - 1; i >= 0; i--) {
          var p = pours[i]; p.t += dt;
          if (p.t > p.T1 && p.t < p.T1 + p.T2) {
            tubes[p.b].wave = Math.min(1, tubes[p.b].wave + dt * 3);
            p.sfx -= dt;
            if (p.sfx <= 0) { p.sfx = 0.07; api.tone(260 + Math.random() * 120 + (tubes[p.b].c.length) * 40, 0.05, 'sine', 0.025); }
            if (api.quality > 0 && Math.random() < 0.6) {
              var d = slots[p.b], k = Math.min(1, (p.t - p.T1) / p.T2 * 1.1), lvl = tubes[p.b].c.length - p.amt * (1 - k);
              var sy = d.y + yb - lvl * unit;
              parts.push({ x: d.x + rnd(-3, 3), y: sy, vx: rnd(-60, 60), vy: rnd(-120, -40), r: rnd(1.2, 2.6), life: rnd(0.25, 0.45), max: 0.45, c: PAL[p.col][0], g: 600, clip: d });
            }
          }
          if (p.t >= p.T1 + p.T2 + p.T3) { pours.splice(i, 1); finishPour(p); }
        }
        for (i = parts.length - 1; i >= 0; i--) { var q = parts[i]; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; q.life -= dt; if (q.life <= 0) parts.splice(i, 1); }
        while (pending.length && !tubes[pending[0][0]].busy && !tubes[pending[0][1]].busy) { var pq = pending.shift(); if (state === 'play' && !pour(pq[0], pq[1])) { tubes[pq[1]].shake = 0.3; pending = []; } }
        if (state === 'play') {
          if (allDone() && !pending.length) winLevel();
          else if (!pours.length && !anyMove()) {
            hintT += dt;
            if (hintT > 1 && hintT - dt <= 1) api.toast(api.t('watersort.stuck'));
          } else hintT = 0;
        } else {
          stT += dt;
          if (state === 'win' && stT > 3) next();
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        if (!bgL || lw !== W || lh !== H || lastN !== tubes.length) layout();
        c.drawImage(bgL, 0, 0, W, H);
        var ek = enterT > 0 ? enterT / 0.5 : 0;
        c.save(); c.globalAlpha = 1 - ek * 0.8; c.translate(0, ek * ek * 40);
        var flying = {}, i, p;
        for (i = 0; i < pours.length; i++) flying[pours[i].a] = pours[i];
        // стоящие колбы
        for (i = 0; i < tubes.length; i++) {
          if (flying[i]) continue;
          var tb = tubes[i], s = slots[i], sh = tb.shake > 0 ? Math.sin(tb.shake * 60) * 4 * tb.shake / 0.3 : 0;
          var layers = layersOf(tb.c);
          // приём жидкости: верхний слой растёт
          for (var j = 0; j < pours.length; j++) if (pours[j].b === i) {
            p = pours[j]; var f = p.t < p.T1 ? 0 : Math.min(1, (p.t - p.T1) / p.T2 * 1.1);
            layers = layersOf(tb.c.slice(0, tb.c.length - p.amt), p.col, p.amt * f);
          }
          // тень при подъёме
          drawTube(c, i, s.x + sh, s.y - tb.lift * 22, 0, layers, tb);
        }
        // струи и летящие колбы
        for (i = 0; i < pours.length; i++) {
          p = pours[i]; var st = pourState(p), A = tubes[p.a];
          var remain = layersOf(A.c, p.col, p.amt * (1 - st.f));
          if (st.f > 0 && st.f < 1 || (p.t > p.T1 && p.t < p.T1 + p.T2)) {
            // точка вытекания: угол горлышка
            var cxl = p.dir * iw / 2, cyl = y0 - unit * 0.5, ca = Math.cos(st.th), sa = Math.sin(st.th);
            var ex = st.x + cxl * ca - cyl * sa, ey = st.y + cxl * sa + cyl * ca;
            var d = slots[p.b], lvl = tubes[p.b].c.length - p.amt * (1 - st.f), sy2 = d.y + yb - lvl * unit;
            var wdt = Math.max(3, iw * 0.28) * (st.f < 0.95 ? 1 : (1 - st.f) * 20);
            c.save(); c.translate(d.x, 0); c.restore();
            c.strokeStyle = PAL[p.col][0]; c.lineWidth = wdt; c.lineCap = 'round';
            c.beginPath(); c.moveTo(ex, ey); c.quadraticCurveTo(d.x + (ex - d.x) * 0.1, ey + 6, d.x + Math.sin(t * 30) * 0.8, sy2); c.stroke();
            c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = Math.max(1, wdt * 0.25);
            c.beginPath(); c.moveTo(ex - 1, ey); c.quadraticCurveTo(d.x + (ex - d.x) * 0.1 - 1, ey + 6, d.x - wdt * 0.2, sy2); c.stroke();
            c.lineCap = 'butt';
          }
          drawTube(c, p.a, st.x, st.y, st.th, remain, A);
        }
        // частицы
        for (i = 0; i < parts.length; i++) {
          var q = parts[i]; c.globalAlpha = Math.max(0, q.life / q.max) * (1 - ek * 0.8);
          c.fillStyle = q.c; c.beginPath(); c.arc(q.x, q.y, q.r, 0, 6.283); c.fill();
        }
        c.restore(); c.globalAlpha = 1;
        drawHUD(c);
        if (state === 'win' || state === 'all') drawBanner(c);
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      }
    };
  }
};
