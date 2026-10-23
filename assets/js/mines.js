/* Сапёр */
window.GAMES = window.GAMES || {};
window.GAMES.mines = {
  title: 'Сапёр',
  colors: ['#64748b', '#0ea5e9'],
  controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="mnT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cbd5e1"/><stop offset="1" stop-color="#64748b"/></linearGradient><linearGradient id="mnO" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2e8f0"/><stop offset="1" stop-color="#f8fafc"/></linearGradient><radialGradient id="mnB" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#94a3b8"/><stop offset=".5" stop-color="#1e293b"/><stop offset="1" stop-color="#020617"/></radialGradient></defs><rect x="6" y="6" width="88" height="88" rx="14" fill="#334155"/><g stroke="rgba(0,0,0,.25)" stroke-width="1"><rect x="10" y="10" width="26" height="26" rx="5" fill="url(#mnT)"/><rect x="38" y="10" width="26" height="26" rx="5" fill="url(#mnO)"/><rect x="66" y="10" width="26" height="26" rx="5" fill="url(#mnO)"/><rect x="10" y="38" width="26" height="26" rx="5" fill="url(#mnO)"/><rect x="38" y="38" width="26" height="26" rx="5" fill="url(#mnO)"/><rect x="66" y="38" width="26" height="26" rx="5" fill="url(#mnT)"/><rect x="10" y="66" width="26" height="26" rx="5" fill="url(#mnT)"/><rect x="38" y="66" width="26" height="26" rx="5" fill="url(#mnT)"/><rect x="66" y="66" width="26" height="26" rx="5" fill="url(#mnT)"/></g><g fill="#fff" opacity=".35"><rect x="12" y="12" width="22" height="5" rx="2.5"/><rect x="68" y="40" width="22" height="5" rx="2.5"/><rect x="12" y="68" width="22" height="5" rx="2.5"/><rect x="40" y="68" width="22" height="5" rx="2.5"/><rect x="68" y="68" width="22" height="5" rx="2.5"/></g><g font-family="system-ui,sans-serif" font-weight="900" font-size="19" text-anchor="middle"><text x="51" y="30" fill="#2563eb">1</text><text x="79" y="30" fill="#16a34a">2</text><text x="51" y="58" fill="#dc2626">3</text></g><path d="M23 40v22M12 51h22M15 43l16 16M31 43L15 59" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/><circle cx="23" cy="51" r="7.5" fill="url(#mnB)"/><circle cx="20.5" cy="48.5" r="2" fill="#fff"/><path d="M77 72v14" stroke="#1f2937" stroke-width="2.5"/><path d="M77 72l-10 4.5 10 4.5z" fill="#ef4444"/><rect x="71" y="85" width="12" height="3" rx="1" fill="#334155"/></svg>',

  create: function (api) {
    var DIFF = [
      { c: 8, r: 10, m: 10 },
      { c: 9, r: 12, m: 18 },
      { c: 10, r: 14, m: 30 },
      { c: 11, r: 16, m: 44 }
    ];
    var NUMCOL = ['', '#2563eb', '#16a34a', '#dc2626', '#7c3aed', '#b45309', '#0891b2', '#111827', '#6b7280'];
    var D, C, R, M, grid, cs, bx, by, started, time, flags, flagMode, press, state, endT, revealQ, boomList, conf, t, btn, revealedCount;
    // v2.0: подсказки 💡 и бронежилет (одна ошибка прощается на лёгкой и нормальной сложности)
    var hints, hintBtn, vest, hintsUsed;
    function useHint() {
      if (!started || hints <= 0 || state !== 'play') return;
      var cand = [];
      for (var y = 0; y < R; y++) for (var x = 0; x < C; x++) {
        var g = grid[idx(x, y)];
        if (g.open || g.mine || g.flag) continue;
        var near = false; nbrs(x, y, function (a, b) { if (grid[idx(a, b)].open) near = true; });
        if (near) cand.push([x, y]);
      }
      if (!cand.length) return;
      var p = cand[Math.floor(Math.random() * cand.length)];
      hints--; hintsUsed++;
      api.fx.text(bx + (p[0] + 0.5) * cs, by + p[1] * cs, '💡', '#fde047', 20);
      reveal(p[0], p[1]);
    }

    function idx(x, y) { return y * C + x; }
    function inb(x, y) { return x >= 0 && y >= 0 && x < C && y < R; }
    function nbrs(x, y, fn) {
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        if ((dx || dy) && inb(x + dx, y + dy)) fn(x + dx, y + dy);
      }
    }
    function layout() {
      var top = 64;
      cs = Math.floor(Math.min((api.W - 20) / C, (api.H - top - 14) / R));
      bx = Math.floor((api.W - cs * C) / 2);
      by = Math.floor(top + (api.H - top - 4 - cs * R) / 2);
      btn = { x: api.W - 118, y: 10, w: 106, h: 42 };
      hintBtn = { x: api.W - 176, y: 10, w: 50, h: 42 };
      buildStatic();
    }
    // v3: предрендер фона, рамки поля и спрайтов клеток
    var bgL = null, spr = null;
    function mk(w, h) {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var o = document.createElement('canvas'); o.width = Math.max(1, Math.ceil(w * dpr)); o.height = Math.max(1, Math.ceil(h * dpr));
      var oc = o.getContext('2d'); oc.scale(dpr, dpr); return { cv: o, c: oc };
    }
    function buildStatic() {
      if (!C) return;
      var W = api.W, H = api.H, m = mk(W, H), o = m.c, i;
      var bg = o.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#1e293b'); bg.addColorStop(1, '#0b1120');
      o.fillStyle = bg; o.fillRect(0, 0, W, H);
      // ромбическая сетка
      o.strokeStyle = 'rgba(148,163,184,.05)'; o.lineWidth = 1;
      for (i = -H; i < W; i += 22) { o.beginPath(); o.moveTo(i, 0); o.lineTo(i + H, H); o.moveTo(i + H, 0); o.lineTo(i, H); o.stroke(); }
      var gl = o.createRadialGradient(W / 2, by + cs * R / 2, 10, W / 2, by + cs * R / 2, Math.max(W, H) * 0.7);
      gl.addColorStop(0, 'rgba(56,189,248,.10)'); gl.addColorStop(1, 'rgba(0,0,0,.45)');
      o.fillStyle = gl; o.fillRect(0, 0, W, H);
      // рамка поля: металлическая панель
      var fx = bx - 9, fy = by - 9, fw = cs * C + 18, fh = cs * R + 18;
      o.save(); o.shadowColor = 'rgba(0,0,0,.6)'; o.shadowBlur = 26; o.shadowOffsetY = 8;
      var fg = o.createLinearGradient(0, fy, 0, fy + fh);
      fg.addColorStop(0, '#64748b'); fg.addColorStop(0.5, '#475569'); fg.addColorStop(1, '#334155');
      o.fillStyle = fg; rr(o, fx, fy, fw, fh, 14); o.fill(); o.restore();
      o.strokeStyle = 'rgba(255,255,255,.25)'; o.lineWidth = 1; rr(o, fx + 0.5, fy + 0.5, fw - 1, fh - 1, 14); o.stroke();
      o.fillStyle = '#1e293b'; rr(o, bx - 3, by - 3, cs * C + 6, cs * R + 6, 8); o.fill();
      var ig = o.createLinearGradient(0, by - 3, 0, by + 8);
      ig.addColorStop(0, 'rgba(0,0,0,.5)'); ig.addColorStop(1, 'rgba(0,0,0,0)');
      o.fillStyle = ig; o.fillRect(bx - 3, by - 3, cs * C + 6, 11);
      [[fx + 5, fy + 5], [fx + fw - 5, fy + 5], [fx + 5, fy + fh - 5], [fx + fw - 5, fy + fh - 5]].forEach(function (p) {
        var rg = o.createRadialGradient(p[0] - 1, p[1] - 1, 0.3, p[0], p[1], 3);
        rg.addColorStop(0, '#f1f5f9'); rg.addColorStop(1, '#475569');
        o.fillStyle = rg; o.beginPath(); o.arc(p[0], p[1], 2.6, 0, 6.283); o.fill();
      });
      // HUD-плашка
      var hg = o.createLinearGradient(0, 10, 0, 52); hg.addColorStop(0, 'rgba(255,255,255,.09)'); hg.addColorStop(1, 'rgba(255,255,255,.03)');
      o.fillStyle = hg; rr(o, 8, 10, W - 192, 42, 14); o.fill();
      o.strokeStyle = 'rgba(255,255,255,.08)'; rr(o, 8.5, 10.5, W - 193, 41, 14); o.stroke();
      bgL = m.cv;
      spr = { closed: tile(false, false), hov: tile(false, true), o0: openT('#e2e8f0', '#cbd5e1'), o1: openT('#f1f5f9', '#dbe3ec'), hit: openT('#f87171', '#b91c1c') };
    }
    function tile(open, hov) {
      var s = cs, g1 = 1.5, m = mk(s, s), o = m.c, w = s - g1 * 2, r = s * 0.16;
      var tg = o.createLinearGradient(0, g1, 0, g1 + w);
      tg.addColorStop(0, hov ? '#cbd5e1' : '#a3b1c4'); tg.addColorStop(1, hov ? '#94a3b8' : '#64748b');
      o.fillStyle = '#334155'; rr(o, g1, g1 + 1, w, w, r); o.fill();
      o.fillStyle = tg; rr(o, g1, g1, w, w - 1.5, r); o.fill();
      // фаска: светлая сверху-слева, тёмная снизу-справа
      var b = Math.max(2, s * 0.09);
      o.save(); rr(o, g1, g1, w, w - 1.5, r); o.clip();
      o.fillStyle = 'rgba(255,255,255,.38)'; o.beginPath(); o.moveTo(g1, g1); o.lineTo(g1 + w, g1); o.lineTo(g1 + w - b, g1 + b); o.lineTo(g1 + b, g1 + b); o.lineTo(g1 + b, g1 + w - b); o.lineTo(g1, g1 + w); o.closePath(); o.fill();
      o.fillStyle = 'rgba(15,23,42,.28)'; o.beginPath(); o.moveTo(g1 + w, g1); o.lineTo(g1 + w, g1 + w); o.lineTo(g1, g1 + w); o.lineTo(g1 + b, g1 + w - b); o.lineTo(g1 + w - b, g1 + w - b); o.lineTo(g1 + w - b, g1 + b); o.closePath(); o.fill();
      var sh = o.createRadialGradient(g1 + w * 0.35, g1 + w * 0.3, 1, g1 + w * 0.35, g1 + w * 0.3, w * 0.7);
      sh.addColorStop(0, 'rgba(255,255,255,.22)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
      o.fillStyle = sh; o.fillRect(0, 0, s, s);
      o.restore();
      return m.cv;
    }
    function openT(c1, c2) {
      var s = cs, g1 = 1.5, m = mk(s, s), o = m.c, w = s - g1 * 2, r = s * 0.12;
      var g = o.createLinearGradient(0, g1, 0, g1 + w); g.addColorStop(0, c2); g.addColorStop(0.25, c1); g.addColorStop(1, c1);
      o.fillStyle = g; rr(o, g1, g1, w, w, r); o.fill();
      o.save(); rr(o, g1, g1, w, w, r); o.clip();
      var ig = o.createLinearGradient(0, g1, 0, g1 + s * 0.2); ig.addColorStop(0, 'rgba(15,23,42,.22)'); ig.addColorStop(1, 'rgba(15,23,42,0)');
      o.fillStyle = ig; o.fillRect(0, 0, s, s * 0.25);
      var lg = o.createLinearGradient(g1, 0, g1 + s * 0.15, 0); lg.addColorStop(0, 'rgba(15,23,42,.12)'); lg.addColorStop(1, 'rgba(15,23,42,0)');
      o.fillStyle = lg; o.fillRect(0, 0, s * 0.2, s);
      o.restore();
      o.strokeStyle = 'rgba(100,116,139,.35)'; o.lineWidth = 1; rr(o, g1 + 0.5, g1 + 0.5, w - 1, w - 1, r); o.stroke();
      return m.cv;
    }
    function plant(sx, sy) {
      var cells = [];
      for (var y = 0; y < R; y++) for (var x = 0; x < C; x++) {
        if (Math.abs(x - sx) <= 1 && Math.abs(y - sy) <= 1) continue;
        cells.push(idx(x, y));
      }
      for (var i = 0; i < M; i++) {
        var j = i + Math.floor(Math.random() * (cells.length - i));
        var tmp = cells[i]; cells[i] = cells[j]; cells[j] = tmp;
        grid[cells[i]].mine = true;
      }
      for (var y2 = 0; y2 < R; y2++) for (var x2 = 0; x2 < C; x2++) {
        var n = 0;
        nbrs(x2, y2, function (a, b) { if (grid[idx(a, b)].mine) n++; });
        grid[idx(x2, y2)].n = n;
      }
    }
    function reveal(sx, sy) {
      var c0 = grid[idx(sx, sy)];
      if (c0.open || c0.flag) return;
      if (!started) { started = true; plant(sx, sy); }
      if (c0.mine && vest > 0) {
        vest--; c0.flag = true; c0.anim = 0; flags++;
        api.sound('break'); api.vibrate(150); api.fx.shake(8); api.fx.flash('#f97316', 0.3);
        api.toast(api.t('mines.vest'));
        return;
      }
      if (c0.mine) { explode(sx, sy); return; }
      // заливка с задержкой по расстоянию — «волна»
      var stack = [[sx, sy]], seen = {};
      seen[idx(sx, sy)] = 1;
      var opened = 0;
      while (stack.length) {
        var p = stack.pop(), cell = grid[idx(p[0], p[1])];
        if (cell.flag) continue;
        cell.open = true; opened++;
        cell.delay = Math.hypot(p[0] - sx, p[1] - sy) * 0.03; cell.anim = 0;
        if (cell.n === 0) nbrs(p[0], p[1], function (a, b) {
          var k = idx(a, b);
          if (!seen[k] && !grid[k].open && !grid[k].mine) { seen[k] = 1; stack.push([a, b]); }
        });
      }
      revealedCount += opened;
      api.addScore(opened * 5 * (api.diff + 1));
      api.sound(opened > 5 ? 'bonus' : 'move');
      checkWin();
    }
    function chord(x, y) {
      var c0 = grid[idx(x, y)], f = 0, hidden = [];
      nbrs(x, y, function (a, b) { var g = grid[idx(a, b)]; if (g.flag) f++; else if (!g.open) hidden.push([a, b]); });
      if (f !== c0.n || !hidden.length) return;
      for (var i = 0; i < hidden.length && state === 'play'; i++) reveal(hidden[i][0], hidden[i][1]);
    }
    function toggleFlag(x, y) {
      var c0 = grid[idx(x, y)];
      if (c0.open) return;
      c0.flag = !c0.flag; c0.anim = 0; c0.delay = 0;
      flags += c0.flag ? 1 : -1;
      api.sound(c0.flag ? 'rotate' : 'move'); api.vibrate(25);
    }
    function explode(x, y) {
      state = 'boom'; endT = 1.8;
      grid[idx(x, y)].hit = true; grid[idx(x, y)].open = true;
      api.sound('hit'); api.vibrate(300);
      boomList = [];
      for (var yy = 0; yy < R; yy++) for (var xx = 0; xx < C; xx++) {
        var g = grid[idx(xx, yy)];
        if (g.mine && !(xx === x && yy === y)) boomList.push({ x: xx, y: yy, d: Math.hypot(xx - x, yy - y) * 0.05 });
        if (g.flag && !g.mine) g.wrong = true;
      }
      conf = [];
      for (var i = 0; i < 26; i++) {
        var a = Math.random() * 6.283, v = 80 + Math.random() * 260;
        conf.push({ x: bx + (x + 0.5) * cs, y: by + (y + 0.5) * cs, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.9, col: i % 2 ? '#f97316' : '#facc15' });
      }
    }
    function checkWin() {
      if (state !== 'play' || revealedCount < C * R - M) return;
      state = 'win'; endT = 2.2;
      api.addScore(Math.round((M * 20 * (api.diff + 1) + Math.max(0, 600 - Math.floor(time)) * (api.diff + 1)) * Math.max(0.5, 1 - hintsUsed * 0.1)));
      api.sound('win'); api.vibrate(120);
      api.toast(api.t('mines.win'));
      conf = [];
      for (var i = 0; i < 80; i++) conf.push({ x: Math.random() * api.W, y: -Math.random() * api.H * 0.5, vx: (Math.random() - 0.5) * 60, vy: 120 + Math.random() * 160, life: 3, col: ['#f472b6', '#facc15', '#4ade80', '#60a5fa', '#c084fc'][i % 5], rot: Math.random() * 6 });
      for (var k = 0; k < grid.length; k++) if (grid[k].mine && !grid[k].flag) { grid[k].flag = true; flags++; }
    }
    function cellAt(px, py) {
      var x = Math.floor((px - bx) / cs), y = Math.floor((py - by) / cs);
      return inb(x, y) ? { x: x, y: y } : null;
    }
    function inBtn(p) { return p.x > btn.x && p.x < btn.x + btn.w && p.y > btn.y && p.y < btn.y + btn.h; }
    function rr(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }
    function drawMine(c, cx, cy, r, hit) {
      c.strokeStyle = '#0f172a'; c.lineWidth = Math.max(1.5, r * 0.24); c.lineCap = 'round';
      for (var i = 0; i < 4; i++) {
        var a = i * Math.PI / 4;
        c.beginPath(); c.moveTo(cx - Math.cos(a) * r * 1.35, cy - Math.sin(a) * r * 1.35); c.lineTo(cx + Math.cos(a) * r * 1.35, cy + Math.sin(a) * r * 1.35); c.stroke();
      }
      c.fillStyle = '#475569';
      for (i = 0; i < 8; i++) { var b = i * Math.PI / 4; c.beginPath(); c.arc(cx + Math.cos(b) * r * 1.35, cy + Math.sin(b) * r * 1.35, Math.max(1, r * 0.16), 0, 6.283); c.fill(); }
      var g = c.createRadialGradient(cx - r * 0.4, cy - r * 0.4, r * 0.1, cx, cy, r);
      g.addColorStop(0, hit ? '#ef4444' : '#64748b'); g.addColorStop(0.55, hit ? '#7f1d1d' : '#1e293b'); g.addColorStop(1, '#020617');
      c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, 6.283); c.fill();
      c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(cx - r * 0.36, cy - r * 0.36, r * 0.2, 0, 6.283); c.fill();
      c.lineCap = 'butt';
    }
    function drawFlag(c, x, y, s, k) {
      var px = x + s * 0.42, top = y + s * 0.2 + (1 - k) * s * 0.3;
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x + s * 0.48, y + s * 0.8, s * 0.22, s * 0.06, 0, 0, 6.283); c.fill();
      c.strokeStyle = '#1f2937'; c.lineWidth = Math.max(1.5, s * 0.07);
      c.beginPath(); c.moveTo(px, top); c.lineTo(px, y + s * 0.8); c.stroke();
      var wave = Math.sin(t * 6 + x) * s * 0.03;
      var fg = c.createLinearGradient(px, top, px + s * 0.36, top + s * 0.3);
      fg.addColorStop(0, '#f87171'); fg.addColorStop(1, '#b91c1c');
      c.fillStyle = fg;
      c.beginPath(); c.moveTo(px, top); c.quadraticCurveTo(px + s * 0.2, top + s * 0.08 + wave, px + s * 0.36, top + s * 0.14);
      c.quadraticCurveTo(px + s * 0.2, top + s * 0.2 - wave, px, top + s * 0.3); c.fill();
      c.fillStyle = '#334155'; c.fillRect(x + s * 0.28, y + s * 0.76, s * 0.3, s * 0.07);
      c.fillStyle = '#94a3b8'; c.fillRect(x + s * 0.28, y + s * 0.76, s * 0.3, s * 0.02);
      c.fillStyle = '#fde047'; c.beginPath(); c.arc(px, top, Math.max(1.2, s * 0.045), 0, 6.283); c.fill();
    }

    return {
      reset: function () {
        D = DIFF[api.diff]; C = D.c; R = D.r; M = D.m;
        grid = [];
        for (var i = 0; i < C * R; i++) grid.push({ mine: false, open: false, flag: false, n: 0, anim: 1, delay: 0 });
        started = false; time = 0; flags = 0; flagMode = false; press = null; state = 'play'; endT = 0;
        boomList = []; conf = []; t = 0; revealedCount = 0;
        hints = [3, 2, 1, 0][api.diff]; hintsUsed = 0; vest = api.diff <= 1 ? 1 : 0;
        layout();
      },
      resize: layout,
      idle: function (dt) { t += dt; },
      key: function () { },
      input: function (type, d) {
        if (state !== 'play') return;
        if (type === 'down') { press = { x: d.x, y: d.y, t: 0, done: false, cell: cellAt(d.x, d.y) }; }
        else if (type === 'move' && press) { if (Math.hypot(d.x - press.x, d.y - press.y) > 16) press = null; }
        else if (type === 'up' && press) {
          var p = press; press = null;
          if (p.done) return;
          if (inBtn(p)) { flagMode = !flagMode; api.sound('click'); api.vibrate(10); return; }
          if (hints > 0 && p.x > hintBtn.x && p.x < hintBtn.x + hintBtn.w && p.y > hintBtn.y && p.y < hintBtn.y + hintBtn.h) { useHint(); return; }
          if (!p.cell) return;
          var g = grid[idx(p.cell.x, p.cell.y)];
          if (g.open) { if (g.n) chord(p.cell.x, p.cell.y); return; }
          if (flagMode) { if (started) toggleFlag(p.cell.x, p.cell.y); }
          else if (!g.flag) reveal(p.cell.x, p.cell.y);
        }
      },
      update: function (dt) {
        t += dt;
        if (state === 'play' && started) time += dt;
        if (press && !press.done && state === 'play') {
          press.t += dt;
          if (press.t > 0.38 && press.cell && started) {
            press.done = true;
            var g = grid[idx(press.cell.x, press.cell.y)];
            if (!g.open) toggleFlag(press.cell.x, press.cell.y);
          }
        }
        for (var i = 0; i < grid.length; i++) {
          var c0 = grid[i];
          if (c0.delay > 0) c0.delay -= dt; else if (c0.anim < 1) c0.anim = Math.min(1, c0.anim + dt * 6);
        }
        if (state === 'boom') {
          boomList.forEach(function (b) {
            if (b.d > 0) { b.d -= dt; if (b.d <= 0) { grid[idx(b.x, b.y)].open = true; grid[idx(b.x, b.y)].anim = 0; api.sound('stomp'); } }
          });
        }
        conf.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; if (state === 'boom') { p.vx *= 0.94; p.vy *= 0.94; } p.life -= dt; if (p.rot != null) p.rot += dt * 6; });
        conf = conf.filter(function (p) { return p.life > 0 && p.y < api.H + 20; });
        if (state !== 'play') { endT -= dt; if (endT <= 0) { state = 'done'; api.gameOver(); } }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        if (!bgL) buildStatic();
        c.drawImage(bgL, 0, 0, W, H);
        // верхняя панель
        c.font = '900 22px system-ui, sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'left';
        drawMine(c, 26, 31, 8);
        c.fillStyle = '#f8fafc'; c.fillText(String(M - flags), 44, 32);
        var sec = Math.floor(time), ts = Math.floor(sec / 60) + ':' + ('0' + sec % 60).slice(-2);
        c.fillStyle = '#94a3b8'; c.font = '700 13px system-ui, sans-serif'; c.fillText('⏱', 100, 32);
        c.fillStyle = '#f8fafc'; c.font = '900 22px system-ui, sans-serif'; c.fillText(ts, 118, 32);
        // кнопка режима флажков
        c.fillStyle = flagMode ? '#ef4444' : 'rgba(255,255,255,.1)';
        rr(c, btn.x, btn.y, btn.w, btn.h, 14); c.fill();
        drawFlag(c, btn.x + 4, btn.y + 4, 34, 1);
        c.fillStyle = '#fff'; c.font = '800 13px system-ui, sans-serif';
        c.fillText(api.t(flagMode ? 'mines.flagOn' : 'mines.flagOff'), btn.x + 42, btn.y + btn.h / 2 + 1);
        // подсказка и жилет
        if (hints > 0 || hintsUsed) {
          c.fillStyle = hints > 0 && started ? 'rgba(253,224,71,.85)' : 'rgba(255,255,255,.08)';
          rr(c, hintBtn.x, hintBtn.y, hintBtn.w, hintBtn.h, 14); c.fill();
          c.fillStyle = hints > 0 && started ? '#422006' : 'rgba(255,255,255,.4)'; c.font = '900 14px system-ui, sans-serif'; c.textAlign = 'center';
          c.fillText('💡' + hints, hintBtn.x + hintBtn.w / 2, hintBtn.y + hintBtn.h / 2 + 1); c.textAlign = 'left';
        }
        if (vest > 0) { c.font = '700 12px system-ui, sans-serif'; c.fillStyle = '#fdba74'; c.fillText('🦺', 182, 32); }
        // поле
        var g1 = 1.5;
        for (var y = 0; y < R; y++) for (var x = 0; x < C; x++) {
          var cell = grid[idx(x, y)], px = bx + x * cs, py = by + y * cs, s = cs;
          var shownOpen = cell.open && cell.delay <= 0;
          if (!shownOpen) {
            var hov = press && press.cell && press.cell.x === x && press.cell.y === y && !press.done;
            c.drawImage(hov ? spr.hov : spr.closed, px, py, s, s);
            if (cell.flag) drawFlag(c, px, py, s, cell.anim);
          } else {
            var k = cell.anim, sc = 0.7 + 0.3 * k;
            var o = s * (1 - sc) / 2;
            c.drawImage(cell.hit ? spr.hit : ((x + y) % 2 ? spr.o0 : spr.o1), px + o, py + o, s * sc, s * sc);
            if (cell.mine) drawMine(c, px + s / 2, py + s / 2, s * 0.22 * sc, cell.hit);
            else if (cell.n) {
              c.textAlign = 'center';
              c.font = '900 ' + Math.round(s * 0.56 * sc) + 'px system-ui, sans-serif';
              c.fillStyle = 'rgba(255,255,255,.9)'; c.fillText(String(cell.n), px + s / 2, py + s / 2 + 2);
              c.fillStyle = NUMCOL[cell.n];
              c.fillText(String(cell.n), px + s / 2, py + s / 2 + 1);
              c.textAlign = 'left';
            }
          }
          if (cell.wrong && state !== 'play') {
            c.strokeStyle = '#dc2626'; c.lineWidth = 3;
            c.beginPath(); c.moveTo(px + s * 0.2, py + s * 0.2); c.lineTo(px + s * 0.8, py + s * 0.8); c.moveTo(px + s * 0.8, py + s * 0.2); c.lineTo(px + s * 0.2, py + s * 0.8); c.stroke();
          }
        }
        // индикатор удержания
        if (press && !press.done && press.cell && press.t > 0.1 && started && state === 'play') {
          var pc = press.cell, cx = bx + (pc.x + 0.5) * cs, cy = by + (pc.y + 0.5) * cs;
          c.strokeStyle = '#ef4444'; c.lineWidth = 3;
          c.beginPath(); c.arc(cx, cy, cs * 0.55, -Math.PI / 2, -Math.PI / 2 + 6.283 * Math.min(1, (press.t - 0.1) / 0.28)); c.stroke();
        }
        conf.forEach(function (p) {
          c.globalAlpha = Math.min(1, p.life * 2); c.fillStyle = p.col;
          if (p.rot != null) { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillRect(-4, -2, 8, 4); c.restore(); }
          else { c.beginPath(); c.arc(p.x, p.y, 3, 0, 6.283); c.fill(); }
        });
        c.globalAlpha = 1;
        if (!started) {
          c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '700 13px system-ui, sans-serif'; c.textAlign = 'center';
          c.fillText(api.t('mines.tip'), W / 2, Math.min(H - 10, by + cs * R + 22));
        }
      }
    };
  }
};
