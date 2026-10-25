/* Световые мотоциклы: мотоцикл оставляет светящийся след. Врезался в след или стену — проиграл раунд. До 3 побед.
   По сети считает хост: гость шлёт повороты, хост — положения мотоциклов */
window.GAMES = window.GAMES || {};
window.GAMES.tron = {
  title: 'Световые мотоциклы', desc: 'Запри соперника своим следом', cat: 'arcade', isNew4: true, modes: true, lan: true, medals: [100, 250, 500],
  hint: 'Мотоцикл едет сам и оставляет стену света. Поворачивай кнопками ⟲ и ⟳ или свайпом. Врежешься в стену или след — раунд проигран. До 3 побед. Вдвоём на одном телефоне: у игрока 1 кнопки внизу, у игрока 2 — вверху.',
  d0: 'Медленно, простой соперник', d1: 'Обычно', d2: 'Быстро, хитрый соперник', d3: 'Очень быстро, сильный соперник',
  colors: ['#06b6d4', '#f43f5e'], controls: 'none', multiTouch: true, liveSwipe: 'once',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#020617"/><path d="M16 80V50h30V24h30" stroke="#22d3ee" stroke-width="5" fill="none"/><path d="M84 20v34H58v28H30" stroke="#f43f5e" stroke-width="5" fill="none"/><circle cx="76" cy="24" r="5" fill="#a5f3fc"/><circle cx="30" cy="82" r="5" fill="#fecdd3"/></svg>',
  create: function (api) {
    var TICK = [0.085, 0.07, 0.058, 0.05], DX = [1, 0, -1, 0], DY = [0, 1, 0, -1], COL = ['#22d3ee', '#f43f5e'], K = window.GBK;
    var cols, rows, cs, ox, oy, grid, bikes, wins, phase, phaseT, acc, netQ, endT, t, res, pend, step, sparks, bh;
    function names() { return api.mode === 1 ? [api.t('g.p1'), api.t('g.p2')] : api.mode === 2 ? (api.net.side === 0 ? [api.t('g.you'), api.t('net.opp')] : [api.t('net.opp'), api.t('g.you')]) : [api.t('g.you'), api.t('g.cpu')]; }
    function me() { return api.mode === 2 ? api.net.side : 0; }
    function host() { return api.mode !== 2 || api.net.side === 0; }
    function layout() {
      bh = api.mode === 1 ? 64 : 0;
      cs = Math.max(6, Math.floor(Math.min(api.W / 46, (api.H - 150 - bh * 2) / 64)));
      cols = Math.floor((api.W - 16) / cs); rows = Math.floor((api.H - 150 - bh * 2) / cs);
      ox = (api.W - cols * cs) / 2; oy = 70 + bh;
    }
    function newRound() {
      layout(); grid = new Uint8Array(cols * rows);
      bikes = [{ x: Math.floor(cols / 2), y: rows - 4, d: 3, alive: true }, { x: Math.floor(cols / 2), y: 3, d: 1, alive: true }];
      bikes.forEach(function (b, i) { grid[b.y * cols + b.x] = i + 1; });
      phase = 'count'; phaseT = 0; acc = 0; res = 0; pend = [null, null]; step = 0;
    }
    function turnBike(p, rel, abs) {
      if (phase === 'over' || !bikes) return;
      var b = bikes[p], nd = abs != null ? abs : (b.d + rel + 4) % 4;
      if (nd === (b.d + 2) % 4) return; // разворот на месте запрещён
      if (api.mode === 2 && p === me() && !host()) { api.net.send({ k: 'd', d: nd }); pend[p] = nd; return; }
      pend[p] = nd;
    }
    function free(x, y) { return x >= 0 && y >= 0 && x < cols && y < rows && !grid[y * cols + x]; }
    function space(x, y, lim) { // сколько клеток доступно отсюда (обход в ширину с пределом)
      if (!free(x, y)) return 0;
      var seen = {}, q = [y * cols + x], n = 0; seen[q[0]] = 1;
      while (q.length && n < lim) { var k = q.shift(), cx = k % cols, cy = (k / cols) | 0; n++;
        for (var d = 0; d < 4; d++) { var nx = cx + DX[d], ny = cy + DY[d], nk = ny * cols + nx; if (free(nx, ny) && !seen[nk]) { seen[nk] = 1; q.push(nk); } } }
      return n;
    }
    function ai() {
      var b = bikes[1], best = b.d, bs = -1e9, lim = [30, 120, 300, 600][api.diff];
      [b.d, (b.d + 1) % 4, (b.d + 3) % 4].forEach(function (d) {
        var nx = b.x + DX[d], ny = b.y + DY[d];
        if (!free(nx, ny)) return;
        var s = space(nx, ny, lim) + (d === b.d ? 2 : 0) + Math.random() * (api.diff === 0 ? 40 : 3);
        if (api.diff >= 2) { var o = bikes[0], dist = Math.abs(nx - o.x - DX[o.d] * 3) + Math.abs(ny - o.y - DY[o.d] * 3); s -= dist * 0.15; } // подрезать соперника
        if (s > bs) { bs = s; best = d; }
      });
      if (api.diff === 0 && Math.random() < 0.1) return;
      pend[1] = best;
    }
    function tick() {
      if (api.mode === 0) ai();
      bikes.forEach(function (b, i) { if (pend[i] != null && pend[i] !== (b.d + 2) % 4) b.d = pend[i]; pend[i] = null; });
      var nxt = bikes.map(function (b) { return [b.x + DX[b.d], b.y + DY[b.d]]; });
      var head = nxt[0][0] === nxt[1][0] && nxt[0][1] === nxt[1][1];
      bikes.forEach(function (b, i) { if (!free(nxt[i][0], nxt[i][1]) || head) b.alive = false; });
      bikes.forEach(function (b, i) { if (b.alive) { b.x = nxt[i][0]; b.y = nxt[i][1]; grid[b.y * cols + b.x] = i + 1; } else boom(b, i); });
      step++;
      if (api.mode === 2) api.net.sendFast({ k: 's', s: step, b: bikes.map(function (b) { return [b.x, b.y, b.d, b.alive ? 1 : 0]; }) });
      if (!bikes[0].alive || !bikes[1].alive) endRound(!bikes[0].alive && !bikes[1].alive ? 0 : bikes[0].alive ? 1 : 2);
    }
    function boom(b, i) { for (var q = 0; q < 24; q++) { var a = Math.random() * 6.283, v = 40 + Math.random() * 200; sparks.push({ x: ox + (b.x + 0.5) * cs, y: oy + (b.y + 0.5) * cs, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 0.8, c: COL[i] }); } }
    function endRound(w) {
      if (phase === 'over') return;
      res = w; phase = 'over'; phaseT = 0; if (w) wins[w - 1]++;
      var mine = api.mode === 1 ? w > 0 : w === me() + 1;
      api.sound(mine ? 'win' : 'hit'); api.vibrate(150); api.fx.shake(6);
      if (api.mode === 0 && w === 1) api.addScore(60 * (api.diff + 1) + step);
      if (api.mode === 2 && host()) api.net.send({ k: 'e', w: w });
      if (wins[0] >= 3 || wins[1] >= 3) { if (api.mode === 0 && wins[0] >= 3) { api.addScore(150 * (api.diff + 1)); api.fx.confetti(50); } }
    }
    function buttons() {
      var W = api.W, H = api.H, w = W / 2 - 12, h = 52, B = [];
      if (api.mode === 1) { B.push({ p: 1, r: 1, x: 8, y: 8, w: w, h: h, flip: 1 }, { p: 1, r: -1, x: W / 2 + 4, y: 8, w: w, h: h, flip: 1 }); }
      B.push({ p: api.mode === 2 ? me() : 0, r: -1, x: 8, y: H - h - 10, w: w, h: h }, { p: api.mode === 2 ? me() : 0, r: 1, x: W / 2 + 4, y: H - h - 10, w: w, h: h });
      return B;
    }
    return {
      reset: function () { wins = [0, 0]; netQ = []; endT = 0; t = 0; sparks = []; newRound(); },
      resize: function () { }, idle: function (dt) { t += dt || 0; },
      key: function (k, down) {
        if (!down) return; var p = api.mode === 2 ? me() : 0;
        if (k === 'left') turnBike(p, 0, 2); else if (k === 'right') turnBike(p, 0, 0); else if (k === 'up') turnBike(p, 0, 3); else if (k === 'down') turnBike(p, 0, 1);
      },
      netMsg: function (d) { netQ.push(d); },
      input: function (type, d) {
        if (endT > 0) return;
        if (type === 'press') {
          if (phase === 'over') { if (phaseT > 1 && api.mode !== 2 && wins[0] < 3 && wins[1] < 3) newRound(); return; }
          buttons().forEach(function (b) { if (d.x > b.x && d.x < b.x + b.w && d.y > b.y && d.y < b.y + b.h) { turnBike(b.p, b.r); api.sound('click'); } });
        } else if (type === 'swipe' && api.mode !== 1) {
          turnBike(api.mode === 2 ? me() : 0, 0, { right: 0, down: 1, left: 2, up: 3 }[d.dir]);
        }
      },
      update: function (dt) {
        t += dt; phaseT += dt;
        for (var q = sparks.length - 1; q >= 0; q--) { var s = sparks[q]; s.x += s.vx * dt; s.y += s.vy * dt; s.l -= dt; if (s.l <= 0) sparks.splice(q, 1); }
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        // сеть: гость принимает состояние от хоста, хост — повороты гостя
        while (netQ.length) {
          var m = netQ.shift();
          if (m.k === 'd' && host()) pend[1] = m.d;
          else if (m.k === 's' && !host()) {
            if (phase === 'count') { phase = 'run'; phaseT = 0; }
            m.b.forEach(function (v, i) { var b = bikes[i];
              // закрашиваем путь от прошлой точки (пакеты могли потеряться)
              var gx = b.x, gy = b.y, guard = 0;
              while ((gx !== v[0] || gy !== v[1]) && guard++ < 50) { gx += Math.sign(v[0] - gx); if (gx === v[0]) gy += Math.sign(v[1] - gy); if (gx >= 0 && gy >= 0 && gx < cols && gy < rows) grid[gy * cols + gx] = i + 1; }
              b.x = v[0]; b.y = v[1]; b.d = v[2]; if (!v[3] && b.alive) { b.alive = false; boom(b, i); } });
            step = m.s;
          }
          else if (m.k === 'e' && !host()) endRound(m.w);
          else if (m.k === 'n' && !host() && phase === 'over') newRound();
        }
        if (phase === 'count') { if (host() && phaseT > 2) { phase = 'run'; phaseT = 0; } return; }
        if (phase === 'run' && host()) { acc += dt; var T = TICK[api.mode === 0 ? api.diff : 1]; while (acc >= T && phase === 'run') { acc -= T; tick(); } }
        if (phase === 'over' && (wins[0] >= 3 || wins[1] >= 3) && phaseT > 0.5 && !endT) endT = 2.2;
        if (phase === 'over' && api.mode === 2 && host() && phaseT > 2.4 && wins[0] < 3 && wins[1] < 3) { api.net.send({ k: 'n' }); newRound(); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, nm = names();
        c.fillStyle = '#020617'; c.fillRect(0, 0, W, H);
        // поле с сеткой
        c.fillStyle = '#050b1f'; c.fillRect(ox, oy, cols * cs, rows * cs);
        c.strokeStyle = 'rgba(56,189,248,.07)'; c.lineWidth = 1; c.beginPath();
        for (var gx = 0; gx <= cols; gx += 4) { c.moveTo(ox + gx * cs, oy); c.lineTo(ox + gx * cs, oy + rows * cs); }
        for (var gy = 0; gy <= rows; gy += 4) { c.moveTo(ox, oy + gy * cs); c.lineTo(ox + cols * cs, oy + gy * cs); }
        c.stroke();
        c.strokeStyle = 'rgba(148,163,184,.5)'; c.lineWidth = 2; c.strokeRect(ox - 1, oy - 1, cols * cs + 2, rows * cs + 2);
        for (var i = 0; i < grid.length; i++) if (grid[i]) { c.fillStyle = COL[grid[i] - 1]; c.globalAlpha = 0.85; c.fillRect(ox + (i % cols) * cs + 1, oy + ((i / cols) | 0) * cs + 1, cs - 2, cs - 2); }
        c.globalAlpha = 1;
        bikes.forEach(function (b, k) {
          if (!b.alive) return;
          var x = ox + (b.x + 0.5) * cs, y = oy + (b.y + 0.5) * cs;
          c.save(); c.shadowColor = COL[k]; c.shadowBlur = 18; c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, cs * 0.7, 0, 6.283); c.fill(); c.restore();
          c.fillStyle = COL[k]; c.beginPath(); c.arc(x, y, cs * 0.45, 0, 6.283); c.fill();
        });
        sparks.forEach(function (s) { c.globalAlpha = Math.max(0, s.l); c.fillStyle = s.c; c.fillRect(s.x - 2, s.y - 2, 4, 4); }); c.globalAlpha = 1;
        c.textAlign = 'center'; c.textBaseline = 'middle';
        var sy = api.mode === 1 ? 70 + bh * 0 - 0 : 30;
        [0, 1].forEach(function (p) {
          var x = p ? W * 0.75 : W * 0.25, y = api.mode === 1 ? bh + 30 : 30;
          c.fillStyle = COL[p]; c.font = '800 14px system-ui'; c.fillText(nm[p], x, y - 8);
          for (var s = 0; s < 3; s++) { c.fillStyle = s < wins[p] ? COL[p] : 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(x - 14 + s * 14, y + 10, 5, 0, 6.283); c.fill(); }
        });
        if (phase === 'count') { var n = 3 - Math.floor(phaseT / 0.67); c.fillStyle = '#fff'; c.font = '900 64px system-ui'; c.fillText(n > 0 ? n : 'Старт!', W / 2, H / 2); }
        if (phase === 'over') {
          var txt = !res ? api.t('g.draw') : api.mode === 1 ? api.t(res === 1 ? 'g.p1win' : 'g.p2win') : res === me() + 1 ? 'Раунд твой!' : 'Раунд проигран';
          if (wins[0] >= 3 || wins[1] >= 3) txt = api.mode === 1 ? api.t(wins[0] >= 3 ? 'g.p1win' : 'g.p2win') : wins[me()] >= 3 ? api.t('g.win') : api.t('g.lose');
          K.toast(c, W, H / 2, txt + (api.mode !== 2 && !endT && wins[0] < 3 && wins[1] < 3 && phaseT > 1 ? ' · ' + api.t('g.tapContinue') : ''), 1);
        }
        buttons().forEach(function (b) {
          c.save(); if (b.flip) { c.translate(b.x + b.w / 2, b.y + b.h / 2); c.rotate(Math.PI); c.translate(-(b.x + b.w / 2), -(b.y + b.h / 2)); }
          K.key(c, b.x, b.y, b.w, b.h, b.p === 1 ? '#9f1239' : '#0e7490', b.r < 0 ? '⟲' : '⟳', '900 26px system-ui'); c.restore();
        });
      }
    };
  }
};
