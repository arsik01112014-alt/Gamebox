/* Три в ряд */
window.GAMES = window.GAMES || {};
window.GAMES.match3 = {
  title: 'Три в ряд',
  colors: ['#db2777', '#7c3aed'],
  controls: 'none',
  liveSwipe: 'once',
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="m3bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6d28d9"/><stop offset="1" stop-color="#2e1065"/></linearGradient><radialGradient id="m3r" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fca5a5"/><stop offset=".55" stop-color="#dc2626"/><stop offset="1" stop-color="#7f1d1d"/></radialGradient><radialGradient id="m3o" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fde68a"/><stop offset=".55" stop-color="#f59e0b"/><stop offset="1" stop-color="#92400e"/></radialGradient><radialGradient id="m3y" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fef9c3"/><stop offset=".55" stop-color="#eab308"/><stop offset="1" stop-color="#854d0e"/></radialGradient><radialGradient id="m3b" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#bfdbfe"/><stop offset=".55" stop-color="#2563eb"/><stop offset="1" stop-color="#1e3a8a"/></radialGradient><radialGradient id="m3p" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#e9d5ff"/><stop offset=".55" stop-color="#9333ea"/><stop offset="1" stop-color="#581c87"/></radialGradient></defs><rect x="6" y="6" width="88" height="88" rx="16" fill="url(#m3bg)"/><rect x="6" y="6" width="88" height="88" rx="16" fill="none" stroke="#c4b5fd" stroke-width="1.5" opacity=".6"/><polygon points="30,13 43,20.5 43,35.5 30,43 17,35.5 17,20.5" fill="url(#m3r)"/><polygon points="30,20 37,24 37,32 30,36 23,32 23,24" fill="#fff" opacity=".22"/><rect x="57" y="15" width="26" height="26" rx="7" fill="url(#m3o)"/><polygon points="30,57 45,72 30,87 15,72" fill="url(#m3y)"/><polygon points="30,64 38,72 30,80 22,72" fill="#fff" opacity=".22"/><circle cx="70" cy="72" r="14" fill="url(#m3b)"/><polygon points="50,38 63,61 37,61" fill="url(#m3p)"/><g fill="#fff"><ellipse cx="25" cy="21" rx="4" ry="2.2" transform="rotate(-35 25 21)" opacity=".85"/><ellipse cx="63" cy="21" rx="4" ry="2.2" transform="rotate(-35 63 21)" opacity=".8"/><ellipse cx="64" cy="65" rx="4.5" ry="2.5" transform="rotate(-35 64 65)" opacity=".85"/><ellipse cx="47" cy="49" rx="3" ry="1.8" transform="rotate(-50 47 49)" opacity=".8"/><path d="M84 46 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z"/><path d="M14 48 l1 2.6 2.6 1 -2.6 1 -1 2.6 -1 -2.6 -2.6 -1 2.6 -1z" opacity=".7"/></g></svg>',

  create: function (api) {
    var N = 8;
    var DIFF = [
      { types: 5, time: 120, hint: 4, bonus: 3 },
      { types: 6, time: 90, hint: 6, bonus: 2 },
      { types: 6, time: 60, hint: 9, bonus: 2 },
      { types: 7, time: 45, hint: 0, bonus: 1 }
    ];
    var GEM = [
      ['#fca5a5', '#dc2626', '#7f1d1d'], ['#fde68a', '#f59e0b', '#92400e'], ['#fef9c3', '#eab308', '#854d0e'],
      ['#bbf7d0', '#16a34a', '#14532d'], ['#bfdbfe', '#2563eb', '#1e3a8a'], ['#e9d5ff', '#9333ea', '#581c87'], ['#fbcfe8', '#ec4899', '#831843']
    ];
    var D, board, cs, bx, by, state, timeLeft, combo, sel, downCell, swapPair, clearT, idleT, hint, popups, sparks, t, endT, shuffleT;
    var fever = 0; // v2.0: часы (+5 сек) и «лихорадка» ×2 после каскада из 3+ комбо

    function rnd(n) { return Math.floor(Math.random() * n); }
    function gem(type, y) { return { t: type, sp: 0, x: 0, y: y, vy: 0, scale: 1, dying: false }; }
    function at(r, c) { return r >= 0 && c >= 0 && r < N && c < N ? board[r][c] : null; }
    function same(a, b) { return a && b && !a.dying && !b.dying && a.t === b.t; }

    function layout() {
      var top = 74;
      var size = Math.floor(Math.min(api.W - 20, api.H - top - 16));
      cs = size / N;
      bx = Math.floor((api.W - size) / 2);
      by = Math.floor(top + (api.H - top - size) / 2);
      buildStatic();
    }
    // v3: предрендер фона, доски и спрайтов камней
    var bgCv = null, gemCv = [];
    function mk(w, h) {
      var dpr = Math.min(2, window.devicePixelRatio || 1), o = document.createElement('canvas');
      o.width = Math.max(1, Math.ceil(w * dpr)); o.height = Math.max(1, Math.ceil(h * dpr));
      var oc = o.getContext('2d'); oc.scale(dpr, dpr); return { cv: o, c: oc };
    }
    function rrect(o, x, y, w, h, r) {
      o.beginPath(); o.moveTo(x + r, y); o.arcTo(x + w, y, x + w, y + h, r); o.arcTo(x + w, y + h, x, y + h, r);
      o.arcTo(x, y + h, x, y, r); o.arcTo(x, y, x + w, y, r); o.closePath();
    }
    function verts(tp, x, y, r) {
      var v = [], i, a;
      if (tp === 0) for (i = 0; i < 6; i++) { a = i * Math.PI / 3 - Math.PI / 2; v.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
      else if (tp === 2) v = [[x, y - r], [x + r * 0.85, y], [x, y + r], [x - r * 0.85, y]];
      else if (tp === 3) for (i = 0; i < 8; i++) { a = i * Math.PI / 4 + Math.PI / 8; v.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
      else if (tp === 5) v = [[x, y - r], [x + r * 0.95, y + r * 0.75], [x - r * 0.95, y + r * 0.75]];
      else if (tp === 6) for (i = 0; i < 10; i++) { a = i * Math.PI / 5 - Math.PI / 2; var q = i % 2 ? r * 0.5 : r; v.push([x + Math.cos(a) * q, y + Math.sin(a) * q]); }
      return v.length ? v : null;
    }
    function buildGem(tp) {
      var S = Math.ceil(cs), m = mk(S, S), o = m.c, x = S / 2, y = S / 2, r = cs * 0.4, col = GEM[tp];
      // мягкая тень
      o.fillStyle = 'rgba(0,0,0,.35)'; o.save(); o.translate(0, r * 0.12); shape(o, tp, x, y, r); o.fill(); o.restore();
      var gr = o.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.1);
      gr.addColorStop(0, col[0]); gr.addColorStop(0.55, col[1]); gr.addColorStop(1, col[2]);
      o.fillStyle = gr; shape(o, tp, x, y, r); o.fill();
      o.save(); shape(o, tp, x, y, r); o.clip();
      var vo = verts(tp, x, y, r), vi = verts(tp, x, y - r * 0.05, r * 0.52), i;
      if (vo) {
        // грани: чередуем светлые/тёмные сектора между внешним и внутренним контуром
        for (i = 0; i < vo.length; i++) {
          var j = (i + 1) % vo.length;
          var ang = Math.atan2((vo[i][1] + vo[j][1]) / 2 - y, (vo[i][0] + vo[j][0]) / 2 - x);
          var lit = Math.cos(ang + 2.3); // свет сверху-слева
          o.fillStyle = lit > 0 ? 'rgba(255,255,255,' + (0.28 * lit) + ')' : 'rgba(0,0,0,' + (-0.25 * lit) + ')';
          o.beginPath(); o.moveTo(vo[i][0], vo[i][1]); o.lineTo(vo[j][0], vo[j][1]); o.lineTo(vi[j][0], vi[j][1]); o.lineTo(vi[i][0], vi[i][1]); o.closePath(); o.fill();
        }
        var tg = o.createLinearGradient(x - r * 0.5, y - r * 0.5, x + r * 0.5, y + r * 0.5);
        tg.addColorStop(0, 'rgba(255,255,255,.45)'); tg.addColorStop(1, 'rgba(255,255,255,.05)');
        o.fillStyle = tg; o.beginPath(); vi.forEach(function (p, k) { if (k) o.lineTo(p[0], p[1]); else o.moveTo(p[0], p[1]); }); o.closePath(); o.fill();
        o.strokeStyle = 'rgba(255,255,255,.25)'; o.lineWidth = 0.8; o.stroke();
      } else {
        // круглый/квадратный: кольцо и купол
        var dg = o.createRadialGradient(x - r * 0.25, y - r * 0.3, 0, x, y, r * 0.65);
        dg.addColorStop(0, 'rgba(255,255,255,.5)'); dg.addColorStop(1, 'rgba(255,255,255,0)');
        o.fillStyle = dg; o.fillRect(0, 0, S, S);
        o.strokeStyle = 'rgba(255,255,255,.22)'; o.lineWidth = 1; shape(o, tp, x, y, r * 0.62); o.stroke();
      }
      // нижний рефлекс
      o.fillStyle = 'rgba(255,255,255,.18)'; o.beginPath(); o.ellipse(x + r * 0.15, y + r * 0.62, r * 0.35, r * 0.1, -0.2, 0, 6.283); o.fill();
      o.restore();
      o.strokeStyle = 'rgba(0,0,0,.35)'; o.lineWidth = 1.2; shape(o, tp, x, y, r); o.stroke();
      o.fillStyle = 'rgba(255,255,255,.9)';
      o.beginPath(); o.ellipse(x - r * 0.3, y - r * 0.4, r * 0.19, r * 0.1, -0.6, 0, 6.283); o.fill();
      o.beginPath(); o.arc(x + r * 0.32, y - r * 0.18, r * 0.05, 0, 6.283); o.fill();
      return m.cv;
    }
    function buildStatic() {
      var W = api.W, H = api.H, m = mk(W, H), o = m.c, i;
      var bg = o.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#4c0f7a'); bg.addColorStop(0.5, '#2e1065'); bg.addColorStop(1, '#1e1b4b');
      o.fillStyle = bg; o.fillRect(0, 0, W, H);
      // боке
      var sd = 11; function rn() { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }
      for (i = 0; i < 16; i++) {
        var x = rn() * W, y = rn() * H, rad = 20 + rn() * 60, hue = rn() < 0.5 ? '236,72,153' : '139,92,246';
        var g = o.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, 'rgba(' + hue + ',.16)'); g.addColorStop(1, 'rgba(' + hue + ',0)');
        o.fillStyle = g; o.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      var v = o.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.8);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)');
      o.fillStyle = v; o.fillRect(0, 0, W, H);
      // рамка доски
      var size = cs * N, fx = bx - 9, fy = by - 9, fs = size + 18;
      o.save(); o.shadowColor = 'rgba(0,0,0,.6)'; o.shadowBlur = 24; o.shadowOffsetY = 8;
      var fg = o.createLinearGradient(0, fy, 0, fy + fs);
      fg.addColorStop(0, '#c4b5fd'); fg.addColorStop(0.08, '#7c3aed'); fg.addColorStop(0.92, '#4c1d95'); fg.addColorStop(1, '#2e1065');
      o.fillStyle = fg; rrect(o, fx, fy, fs, fs, 16); o.fill(); o.restore();
      o.fillStyle = '#140a2e'; rrect(o, bx - 3, by - 3, size + 6, size + 6, 10); o.fill();
      for (var r = 0; r < N; r++) for (var cc = 0; cc < N; cc++) {
        var tx = bx + cc * cs, ty = by + r * cs;
        var tg = o.createLinearGradient(0, ty, 0, ty + cs);
        var a1 = (r + cc) % 2 ? 0.07 : 0.12;
        tg.addColorStop(0, 'rgba(255,255,255,' + (a1 * 0.6) + ')'); tg.addColorStop(1, 'rgba(255,255,255,' + a1 + ')');
        o.fillStyle = tg; rrect(o, tx + 1.5, ty + 1.5, cs - 3, cs - 3, cs * 0.16); o.fill();
        o.fillStyle = 'rgba(0,0,0,.18)'; o.fillRect(tx + cs * 0.16, ty + 1.5, cs * 0.68, 1.5);
      }
      o.strokeStyle = 'rgba(255,255,255,.35)'; o.lineWidth = 1; rrect(o, fx + 1.5, fy + 1.5, fs - 3, fs - 3, 15); o.stroke();
      bgCv = m.cv;
      gemCv = []; for (i = 0; i < GEM.length; i++) gemCv.push(buildGem(i));
    }
    function fill() {
      board = [];
      for (var r = 0; r < N; r++) {
        board.push([]);
        for (var c = 0; c < N; c++) {
          var tp;
          do { tp = rnd(D.types); } while ((c >= 2 && board[r][c - 1].t === tp && board[r][c - 2].t === tp) || (r >= 2 && board[r - 1][c].t === tp && board[r - 2][c].t === tp));
          var g = gem(tp, r - N - 1 - Math.random()); g.x = c;
          board[r].push(g);
        }
      }
      if (!findMove()) fill();
    }
    function runs() {
      var out = [];
      for (var r = 0; r < N; r++) {
        var c = 0;
        while (c < N) {
          var e = c + 1;
          while (e < N && same(board[r][c], board[r][e])) e++;
          if (e - c >= 3) { var cells = []; for (var k = c; k < e; k++) cells.push([r, k]); out.push(cells); }
          c = e;
        }
      }
      for (var c2 = 0; c2 < N; c2++) {
        var r2 = 0;
        while (r2 < N) {
          var e2 = r2 + 1;
          while (e2 < N && same(board[r2][c2], board[e2][c2])) e2++;
          if (e2 - r2 >= 3) { var cells2 = []; for (var k2 = r2; k2 < e2; k2++) cells2.push([k2, c2]); out.push(cells2); }
          r2 = e2;
        }
      }
      return out;
    }
    function lineAt(r, c) {
      var g = board[r][c], h = 1, v = 1, k;
      for (k = c - 1; k >= 0 && same(board[r][k], g); k--) h++;
      for (k = c + 1; k < N && same(board[r][k], g); k++) h++;
      for (k = r - 1; k >= 0 && same(board[k][c], g); k--) v++;
      for (k = r + 1; k < N && same(board[k][c], g); k++) v++;
      return h >= 3 || v >= 3;
    }
    function findMove() {
      for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
        var ds = [[0, 1], [1, 0]];
        for (var i = 0; i < 2; i++) {
          var r2 = r + ds[i][0], c2 = c + ds[i][1];
          if (r2 >= N || c2 >= N) continue;
          var a = board[r][c]; board[r][c] = board[r2][c2]; board[r2][c2] = a;
          var ok = lineAt(r, c) || lineAt(r2, c2);
          a = board[r][c]; board[r][c] = board[r2][c2]; board[r2][c2] = a;
          if (ok) return [[r, c], [r2, c2]];
        }
      }
      return null;
    }
    function trySwap(a, b) {
      if (state !== 'idle' || timeLeft <= 0) return;
      if (!b || b[0] < 0 || b[1] < 0 || b[0] >= N || b[1] >= N) return;
      if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) !== 1) return;
      var g = board[a[0]][a[1]]; board[a[0]][a[1]] = board[b[0]][b[1]]; board[b[0]][b[1]] = g;
      swapPair = [a, b]; state = 'swap'; sel = null; idleT = 0; hint = null;
      api.sound('rotate');
    }
    function resolve(list) {
      var kill = {}, specials = [];
      function key(r, c) { return r * N + c; }
      list.forEach(function (cells) {
        cells.forEach(function (p) { kill[key(p[0], p[1])] = p; });
        if (cells.length >= 4) {
          var spot = cells[Math.floor(cells.length / 2)];
          if (swapPair) cells.forEach(function (p) { swapPair.forEach(function (q) { if (p[0] === q[0] && p[1] === q[1]) spot = p; }); });
          specials.push({ p: spot, sp: cells.length >= 5 ? 2 : 1 });
        }
      });
      // цепная реакция бонусов
      var queue = Object.keys(kill).map(function (k) { return kill[k]; }), qi = 0;
      while (qi < queue.length) {
        var p = queue[qi++], g = board[p[0]][p[1]];
        if (!g || !g.sp) continue;
        var add = [];
        if (g.sp === 1) { for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) add.push([p[0] + dr, p[1] + dc]); }
        else { for (var i = 0; i < N; i++) { add.push([p[0], i]); add.push([i, p[1]]); } }
        burst(p[0], p[1], '#fff', 20);
        api.sound('break'); api.vibrate(40);
        add.forEach(function (q) { if (at(q[0], q[1]) && !kill[key(q[0], q[1])]) { kill[key(q[0], q[1])] = q; queue.push(q); } });
      }
      specials.forEach(function (s) { delete kill[key(s.p[0], s.p[1])]; });
      var n = 0, clocks = 0;
      Object.keys(kill).forEach(function (k) {
        var p = kill[k], g = board[p[0]][p[1]];
        g.dying = true; n++;
        if (g.clock) { clocks++; api.fx.text(bx + (p[1] + 0.5) * cs, by + p[0] * cs, '+5s', '#7dd3fc', 16); }
        burst(p[0], p[1], GEM[g.t][1], 5);
      });
      specials.forEach(function (s) {
        var g = board[s.p[0]][s.p[1]];
        g.sp = Math.max(g.sp, s.sp); g.scale = 1.5;
        timeLeft = Math.min(D.time, timeLeft + D.bonus * s.sp);
      });
      if (clocks) { timeLeft = Math.min(D.time, timeLeft + 5 * clocks); api.sound('bonus'); }
      if (combo >= 2 && fever <= 0) { fever = 7; api.toast(api.t('match3.fever')); api.fx.flash('#f472b6', 0.2); }
      var pts = n * 10 * (combo + 1) * (fever > 0 ? 2 : 1);
      api.addScore(pts);
      var cp = list[0][Math.floor(list[0].length / 2)];
      popups.push({ x: bx + (cp[1] + 0.5) * cs, y: by + (cp[0] + 0.5) * cs, text: '+' + pts, life: 0.9, big: combo > 0 });
      if (combo > 0) popups.push({ x: api.W / 2, y: by - 8, text: api.t('breakout.combo') + ' ×' + (combo + 1), life: 1.1, big: true });
      api.sound(combo > 1 ? 'coin' : 'eat'); api.vibrate(12);
      state = 'clear'; clearT = 0.22; swapPair = null;
    }
    function collapse() {
      for (var c = 0; c < N; c++) {
        var w = N - 1;
        for (var r = N - 1; r >= 0; r--) {
          var g = board[r][c];
          if (g && !g.dying) { board[w][c] = g; if (w !== r) board[r][c] = null; w--; }
          else board[r][c] = null;
        }
        var miss = w + 1;
        for (var r2 = w; r2 >= 0; r2--) { var ng = gem(rnd(D.types), r2 - miss - 0.3); ng.x = c; if (Math.random() < 0.025) ng.clock = true; board[r2][c] = ng; }
      }
      state = 'fall';
    }
    function settle(dt) {
      var done = true;
      for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
        var g = board[r][c];
        if (!g) continue;
        if (g.y < r) { g.vy += 45 * dt; g.y = Math.min(r, g.y + g.vy * dt); if (g.y < r) done = false; else g.vy = 0; }
        else if (g.y > r) { g.y = Math.max(r, g.y - 9 * dt); if (g.y > r) done = false; }
        if (g.x !== c) { g.x += Math.sign(c - g.x) * Math.min(Math.abs(c - g.x), 9 * dt); if (g.x !== c) done = false; }
        if (g.scale > 1) g.scale = Math.max(1, g.scale - dt * 3);
      }
      return done;
    }
    function burst(r, c, col, n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.283, v = (1 + Math.random() * 3) * cs;
        sparks.push({ x: bx + (c + 0.5) * cs, y: by + (r + 0.5) * cs, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.3, col: col });
      }
    }
    function cellAt(x, y) {
      var c = Math.floor((x - bx) / cs), r = Math.floor((y - by) / cs);
      return r >= 0 && c >= 0 && r < N && c < N ? [r, c] : null;
    }

    function shape(c, tp, x, y, r) {
      c.beginPath();
      var i, a;
      switch (tp) {
        case 0: for (i = 0; i < 6; i++) { a = i * Math.PI / 3 - Math.PI / 2; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } break;
        case 1: var s = r * 0.85, q = r * 0.3; c.moveTo(x - s + q, y - s); c.arcTo(x + s, y - s, x + s, y + s, q); c.arcTo(x + s, y + s, x - s, y + s, q); c.arcTo(x - s, y + s, x - s, y - s, q); c.arcTo(x - s, y - s, x + s, y - s, q); break;
        case 2: c.moveTo(x, y - r); c.lineTo(x + r * 0.85, y); c.lineTo(x, y + r); c.lineTo(x - r * 0.85, y); break;
        case 3: for (i = 0; i < 8; i++) { a = i * Math.PI / 4 + Math.PI / 8; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } break;
        case 4: c.arc(x, y, r * 0.92, 0, 6.283); break;
        case 5: c.moveTo(x, y - r); c.lineTo(x + r * 0.95, y + r * 0.75); c.lineTo(x - r * 0.95, y + r * 0.75); break;
        default: for (i = 0; i < 10; i++) { a = i * Math.PI / 5 - Math.PI / 2; var rr2 = i % 2 ? r * 0.5 : r; c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); }
      }
      c.closePath();
    }
    function drawGem(c, g, x, y, r) {
      var col = GEM[g.t];
      if (!g.sp && !g.clock && gemCv[g.t]) { var z = r / 0.4; c.drawImage(gemCv[g.t], x - z / 2, y - z / 2, z, z); return; }
      if (g.sp) {
        c.save(); c.shadowColor = g.sp === 2 ? '#fff' : col[1]; c.shadowBlur = r * (0.8 + Math.sin(t * 6) * 0.3);
      }
      var gr = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.1);
      gr.addColorStop(0, col[0]); gr.addColorStop(0.55, col[1]); gr.addColorStop(1, col[2]);
      c.fillStyle = gr; shape(c, g.t, x, y, r); c.fill();
      if (g.sp) c.restore();
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1.5; c.stroke();
      // грани
      c.save(); shape(c, g.t, x, y, r); c.clip();
      c.fillStyle = 'rgba(255,255,255,.18)';
      c.beginPath(); c.moveTo(x - r, y - r); c.lineTo(x + r * 0.2, y - r); c.lineTo(x - r, y + r * 0.2); c.fill();
      c.restore();
      c.fillStyle = 'rgba(255,255,255,.85)';
      c.beginPath(); c.ellipse(x - r * 0.3, y - r * 0.38, r * 0.2, r * 0.11, -0.6, 0, 6.283); c.fill();
      if (g.clock) {
        c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.arc(x, y, r * 0.38, 0, 6.283); c.fill();
        c.strokeStyle = '#0f172a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - r * 0.26); c.moveTo(x, y); c.lineTo(x + r * 0.18, y + r * 0.08); c.stroke();
      }
      if (g.sp === 1) {
        c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2;
        c.beginPath(); c.arc(x, y, r * (0.45 + Math.sin(t * 8) * 0.06), 0, 6.283); c.stroke();
      } else if (g.sp === 2) {
        c.save(); c.translate(x, y); c.rotate(t * 2);
        c.fillStyle = '#fff';
        for (var k = 0; k < 4; k++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(0, -r * 0.7); c.lineTo(r * 0.12, 0); c.lineTo(-r * 0.12, 0); c.fill(); }
        c.restore();
      }
    }

    return {
      reset: function () {
        D = DIFF[api.diff];
        layout();
        state = 'fall'; timeLeft = D.time; combo = 0; sel = null; downCell = null; swapPair = null; idleT = 0; hint = null; fever = 0;
        popups = []; sparks = []; t = 0; endT = 0; shuffleT = 0;
        fill();
      },
      resize: layout,
      idle: function (dt) { t += dt; settle(dt); },
      key: function () { },
      input: function (type, d) {
        if (type === 'down') downCell = cellAt(d.x, d.y);
        else if (type === 'swipe' && downCell) {
          var dir = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[d.dir];
          trySwap(downCell, [downCell[0] + dir[0], downCell[1] + dir[1]]);
          downCell = null;
        } else if (type === 'tap') {
          var cc = cellAt(d.x, d.y);
          if (!cc || state !== 'idle') return;
          if (sel && Math.abs(sel[0] - cc[0]) + Math.abs(sel[1] - cc[1]) === 1) trySwap(sel, cc);
          else { sel = cc; api.sound('move'); }
        }
      },
      update: function (dt) {
        t += dt;
        sparks = sparks.filter(function (s) { s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.92; s.vy *= 0.92; s.life -= dt; return s.life > 0; });
        popups = popups.filter(function (p) { p.y -= 30 * dt; p.life -= dt; return p.life > 0; });
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (state === 'idle' || state === 'swap') timeLeft = Math.max(0, timeLeft - dt);
        if (fever > 0) fever -= dt;
        if (shuffleT > 0) shuffleT -= dt;
        var settled = settle(dt);
        if (state === 'clear') {
          board.forEach(function (row) { row.forEach(function (g) { if (g && g.dying) g.scale = Math.max(0, g.scale - dt / 0.22); }); });
          clearT -= dt;
          if (clearT <= 0) collapse();
          return;
        }
        if (!settled) return;
        if (state === 'swap') {
          var m = runs();
          if (m.length) { combo = 0; resolve(m); }
          else {
            var a = swapPair[0], b = swapPair[1], g = board[a[0]][a[1]];
            board[a[0]][a[1]] = board[b[0]][b[1]]; board[b[0]][b[1]] = g;
            swapPair = null; state = 'back'; api.vibrate(20);
          }
        } else if (state === 'back') {
          state = 'idle';
        } else if (state === 'fall') {
          var m2 = runs();
          if (m2.length) { combo++; resolve(m2); }
          else {
            combo = 0; state = 'idle'; idleT = 0;
            if (!findMove()) { // перемешать
              var all = [];
              board.forEach(function (row) { row.forEach(function (g2) { all.push(g2.t); }); });
              do {
                for (var i = all.length - 1; i > 0; i--) { var j = rnd(i + 1), tmp = all[i]; all[i] = all[j]; all[j] = tmp; }
                for (var k = 0; k < all.length; k++) board[Math.floor(k / N)][k % N].t = all[k];
              } while (runs().length || !findMove());
              shuffleT = 1.2; api.sound('rotate');
            }
          }
        } else if (state === 'idle') {
          idleT += dt;
          if (D.hint && idleT > D.hint && !hint) hint = findMove();
          if (timeLeft <= 0) { endT = 1.2; api.sound('over'); }
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        if (!bgCv) buildStatic();
        c.drawImage(bgCv, 0, 0, W, H);
        if (fever > 0) {
          c.fillStyle = 'rgba(244,114,182,' + (0.12 + 0.08 * Math.sin(t * 8)) + ')'; c.fillRect(0, 0, W, H);
          c.fillStyle = '#f9a8d4'; c.font = '900 14px system-ui, sans-serif'; c.textAlign = 'right'; c.textBaseline = 'top';
          c.fillText('🔥 ×2 ' + Math.ceil(fever), W - 10, 8); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        }
        for (var s = 0; s < 30; s++) {
          var sx = (s * 137 + s * s * 53) % W, sy = (s * 251 + s * s * 17) % H;
          c.globalAlpha = 0.2 + 0.3 * Math.abs(Math.sin(t + s));
          c.fillStyle = '#f5d0fe'; c.fillRect(sx, sy, 2, 2);
        }
        c.globalAlpha = 1;
        // таймер
        var tw = W - 40, k = timeLeft / D.time;
        c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.roundRect ? c.roundRect(20, 22, tw, 14, 7) : c.rect(20, 22, tw, 14); c.fill();
        var tg = c.createLinearGradient(20, 0, 20 + tw, 0);
        tg.addColorStop(0, k < 0.2 ? '#ef4444' : '#f472b6'); tg.addColorStop(1, k < 0.2 ? '#f97316' : '#a78bfa');
        c.fillStyle = tg; c.beginPath(); c.roundRect ? c.roundRect(20, 22, Math.max(14, tw * k), 14, 7) : c.rect(20, 22, tw * k, 14); c.fill();
        c.fillStyle = '#fff'; c.font = '800 13px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(Math.ceil(timeLeft) + ' ' + api.t('match3.sec'), W / 2, 50);
        if (sel) {
          c.fillStyle = 'rgba(253,224,71,.16)'; c.fillRect(bx + sel[1] * cs + 2, by + sel[0] * cs + 2, cs - 4, cs - 4);
          c.strokeStyle = '#fde047'; c.lineWidth = 3;
          c.strokeRect(bx + sel[1] * cs + 2, by + sel[0] * cs + 2, cs - 4, cs - 4);
        }
        if (hint && state === 'idle') {
          c.strokeStyle = 'rgba(255,255,255,' + (0.4 + 0.4 * Math.sin(t * 6)) + ')'; c.lineWidth = 3;
          hint.forEach(function (h) { c.strokeRect(bx + h[1] * cs + 3, by + h[0] * cs + 3, cs - 6, cs - 6); });
        }
        c.save();
        c.beginPath(); c.rect(bx, by, cs * N, cs * N); c.clip();
        for (var r2 = 0; r2 < N; r2++) for (var c2 = 0; c2 < N; c2++) {
          var g = board[r2][c2];
          if (!g || g.scale <= 0) continue;
          var hop = sel && sel[0] === r2 && sel[1] === c2 ? Math.sin(t * 8) * cs * 0.04 : 0;
          drawGem(c, g, bx + (g.x + 0.5) * cs, by + (g.y + 0.5) * cs + hop, cs * 0.4 * g.scale * (shuffleT > 0 ? 1 - Math.sin(shuffleT / 1.2 * Math.PI) * 0.4 : 1));
        }
        c.restore();
        sparks.forEach(function (s2, si) {
          c.globalAlpha = Math.min(1, s2.life * 2); c.fillStyle = s2.col;
          if (si % 3 === 0 && api.quality > 0) { var sz = 5 * Math.min(1, s2.life * 2); c.beginPath(); c.moveTo(s2.x, s2.y - sz); c.lineTo(s2.x + sz * 0.3, s2.y - sz * 0.3); c.lineTo(s2.x + sz, s2.y); c.lineTo(s2.x + sz * 0.3, s2.y + sz * 0.3); c.lineTo(s2.x, s2.y + sz); c.lineTo(s2.x - sz * 0.3, s2.y + sz * 0.3); c.lineTo(s2.x - sz, s2.y); c.lineTo(s2.x - sz * 0.3, s2.y - sz * 0.3); c.closePath(); c.fill(); }
          else { c.beginPath(); c.arc(s2.x, s2.y, 3, 0, 6.283); c.fill(); }
        });
        c.globalAlpha = 1;
        popups.forEach(function (p) {
          c.globalAlpha = Math.min(1, p.life * 2);
          c.font = '900 ' + (p.big ? 24 : 17) + 'px system-ui, sans-serif'; c.textAlign = 'center';
          c.lineWidth = 4; c.lineJoin = 'round'; c.strokeStyle = 'rgba(30,10,60,.8)'; c.strokeText(p.text, p.x, p.y);
          c.fillStyle = p.big ? '#fde047' : '#fff'; c.fillText(p.text, p.x, p.y);
        });
        c.globalAlpha = 1;
        if (endT > 0) {
          c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, W, H);
          c.fillStyle = '#fff'; c.font = '900 30px system-ui, sans-serif'; c.textAlign = 'center';
          c.fillText(api.t('match3.timeUp'), W / 2, H / 2);
        }
      }
    };
  }
};
