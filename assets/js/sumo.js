/* Сумо: вытолкни соперника с круглой арены. Вдвоём на одном телефоне или против компьютера */
window.GAMES = window.GAMES || {};
window.GAMES.sumo = {
  title: 'Сумо', desc: 'Вытолкни соперника с арены', cat: 'arcade', isNew4: true, modes: true, multiTouch: true, medals: [300, 600, 1000],
  hint: 'Держи палец в своей половине экрана — твой борец катится к пальцу. Разгонись и толкни соперника за край круга! Нажми второй рукой быстро — рывок (раз в 2 секунды). Игра до 3 побед. Вдвоём: нижний игрок — нижняя половина экрана, верхний — верхняя.',
  d0: 'Слабый соперник', d1: 'Обычный', d2: 'Сильный', d3: 'Чемпион',
  colors: ['#dc2626', '#1d4ed8'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#fde68a"/><circle cx="50" cy="50" r="38" fill="#e7c48a" stroke="#92400e" stroke-width="4"/><circle cx="50" cy="50" r="30" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/><circle cx="38" cy="58" r="13" fill="#dc2626"/><circle cx="62" cy="42" r="13" fill="#1d4ed8"/><path d="M48 50l4-4" stroke="#fff" stroke-width="3"/></svg>',
  create: function (api) {
    var K = window.GBK, A, B, R, cx, cy, wins, phase, phaseT, t, aiT, parts, shake, endT, lastPress;
    function names() { return api.mode === 1 ? [api.t('g.p1'), api.t('g.p2')] : [api.t('g.you'), api.t('g.cpu')]; }
    function layout() { R = Math.min(api.W * 0.44, api.H * 0.3); cx = api.W / 2; cy = api.H / 2 + 10; }
    function newRound() {
      A = { x: cx, y: cy + R * 0.5, vx: 0, vy: 0, tx: null, ty: null, dashT: 0, col: '#dc2626', face: 0 };
      B = { x: cx, y: cy - R * 0.5, vx: 0, vy: 0, tx: null, ty: null, dashT: 0, col: '#1d4ed8', face: 0 };
      phase = 'ready'; phaseT = 0; parts = [];
    }
    function dash(P) { if (P.dashT > 0 || P.tx == null) return; var dx = P.tx - P.x, dy = P.ty - P.y, d = Math.hypot(dx, dy) || 1; P.vx += dx / d * 420; P.vy += dy / d * 420; P.dashT = 2; api.sound('jump'); }
    function steer(P, dt, acc) {
      if (P.dashT > 0) P.dashT -= dt;
      if (P.tx != null) { var dx = P.tx - P.x, dy = P.ty - P.y, d = Math.hypot(dx, dy); if (d > 6) { P.vx += dx / d * acc * dt; P.vy += dy / d * acc * dt; } }
      P.vx *= Math.pow(0.35, dt); P.vy *= Math.pow(0.35, dt);
      var sp = Math.hypot(P.vx, P.vy), mx = 420; if (sp > mx && P.dashT < 1.8) { P.vx *= mx / sp; P.vy *= mx / sp; }
      P.x += P.vx * dt; P.y += P.vy * dt; P.face = Math.atan2(P.vy, P.vx);
    }
    function ai(dt) {
      aiT -= dt; if (aiT > 0) return; aiT = [0.35, 0.22, 0.12, 0.06][api.diff];
      // встать между соперником и центром, потом толкать к краю
      var dxc = A.x - cx, dyc = A.y - cy, dA = Math.hypot(dxc, dyc) || 1, myC = Math.hypot(B.x - cx, B.y - cy);
      var behindX = A.x - dxc / dA * 40, behindY = A.y - dyc / dA * 40;
      if (myC > R * 0.7) { B.tx = cx; B.ty = cy; } // далеко от центра — вернуться
      else { B.tx = A.x + (A.x - behindX) * 0.5; B.ty = A.y + (A.y - behindY) * 0.5; }
      B.tx += (Math.random() - 0.5) * [80, 40, 15, 5][api.diff]; B.ty += (Math.random() - 0.5) * [80, 40, 15, 5][api.diff];
      if (api.diff >= 1 && Math.hypot(A.x - B.x, A.y - B.y) < 90 && Math.random() < [0, 0.2, 0.35, 0.5][api.diff]) dash(B);
    }
    function burst(x, y, col, n) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = 60 + Math.random() * 160; parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 0.5 + Math.random() * 0.3, c: col }); } }
    return {
      reset: function () { layout(); wins = [0, 0]; t = 0; aiT = 0; shake = 0; endT = 0; lastPress = [0, 0]; newRound(); },
      resize: layout, idle: function (dt) { t += dt || 0; }, key: function () { },
      input: function (type, d) {
        if (type === 'multi') {
          var a = null, b = null; d.forEach(function (p) { if (p.y > api.H / 2) a = p; else if (api.mode === 1) b = p; });
          A.tx = a ? a.x : null; A.ty = a ? a.y : null; if (api.mode === 1) { B.tx = b ? b.x : null; B.ty = b ? b.y : null; }
        } else if (type === 'press') {
          var who = d.y > api.H / 2 ? 0 : 1; if (who === 1 && api.mode !== 1) return;
          var P = who ? B : A, now = t;
          if (now - lastPress[who] < 0.3) dash(P); lastPress[who] = now;
        } else if (type === 'down' || type === 'move') { if (d.y > api.H / 2 || api.mode !== 1) { A.tx = d.x; A.ty = d.y; } }
        else if (type === 'up' && api.mode !== 1) { A.tx = null; }
      },
      update: function (dt) {
        t += dt; phaseT += dt; if (shake > 0) shake -= dt;
        parts.forEach(function (q) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.94; q.vy *= 0.94; q.l -= dt; }); parts = parts.filter(function (q) { return q.l > 0; });
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (phase === 'ready') { if (phaseT > 1.4) { phase = 'play'; api.sound('click'); } return; }
        if (phase === 'out') { steer(A, dt, 0); steer(B, dt, 0); if (phaseT > 1.6) { if (wins[0] >= 3 || wins[1] >= 3) endT = 0.01; else newRound(); } return; }
        if (api.mode === 0) ai(dt);
        var acc = 900;
        steer(A, dt, acc); steer(B, dt, api.mode === 0 ? acc * [0.7, 0.85, 1, 1.12][api.diff] : acc);
        // столкновение
        var dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy), rr = 52;
        if (d < rr && d > 0) {
          var nx = dx / d, ny = dy / d, ov = rr - d; A.x -= nx * ov / 2; A.y -= ny * ov / 2; B.x += nx * ov / 2; B.y += ny * ov / 2;
          var rv = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
          if (rv < 0) { var imp = -rv * 1.6; A.vx -= nx * imp / 2; A.vy -= ny * imp / 2; B.vx += nx * imp / 2; B.vy += ny * imp / 2; if (-rv > 150) { api.sound('hit'); api.vibrate(25); shake = 0.15; burst((A.x + B.x) / 2, (A.y + B.y) / 2, '#fde68a', 10); } }
        }
        [[A, 1], [B, 0]].forEach(function (q) {
          if (phase !== 'play') return;
          if (Math.hypot(q[0].x - cx, q[0].y - cy) > R + 4) {
            phase = 'out'; phaseT = 0; wins[q[1]]++; burst(q[0].x, q[0].y, q[0].col, 26); api.vibrate(60);
            var mine = api.mode === 1 || q[1] === 0; api.sound(mine ? 'win' : 'over');
            if (api.mode === 0 && q[1] === 0) api.addScore(100 + api.diff * 60);
            if (api.mode === 0 && wins[0] >= 3) { api.addScore(150 * (api.diff + 1)); api.fx.confetti(60); }
          }
        });
      },
      draw: function (c) {
        var W = api.W, H = api.H, nm = names();
        c.save(); if (shake > 0) c.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
        var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1e1b4b'); g.addColorStop(1, '#312e81'); c.fillStyle = g; c.fillRect(-10, -10, W + 20, H + 20);
        // зрители по краям
        for (var i = 0; i < 26; i++) { var x = (i * 41) % W, y = i % 2 ? 30 + (i % 3) * 14 : H - 40 - (i % 3) * 14; c.fillStyle = ['#f59e0b', '#ec4899', '#22c55e', '#38bdf8', '#e2e8f0'][i % 5]; c.globalAlpha = 0.35; c.beginPath(); c.arc(x, y + Math.sin(t * 6 + i) * 2, 9, 0, 6.283); c.fill(); }
        c.globalAlpha = 1;
        // помост
        c.fillStyle = '#78350f'; c.beginPath(); c.ellipse(cx, cy + 16, R + 30, R + 30, 0, 0, 6.283); c.fill();
        var ag = c.createRadialGradient(cx, cy - R * 0.3, 10, cx, cy, R + 26); ag.addColorStop(0, '#f5deb3'); ag.addColorStop(1, '#d4a373'); c.fillStyle = ag; c.beginPath(); c.arc(cx, cy, R + 26, 0, 6.283); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, R, 0, 6.283); c.stroke();
        c.strokeStyle = 'rgba(146,64,14,.5)'; c.lineWidth = 8; c.beginPath(); c.arc(cx, cy, R + 8, 0, 6.283); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(cx - 34, cy - R * 0.5 - 3, 20, 5); c.fillRect(cx + 14, cy + R * 0.5 - 2, 20, 5);
        // подсказка-разделитель для двоих
        if (api.mode === 1) { c.strokeStyle = 'rgba(255,255,255,.08)'; c.setLineDash([10, 10]); c.beginPath(); c.moveTo(0, H / 2); c.lineTo(W, H / 2); c.stroke(); c.setLineDash([]); }
        [A, B].forEach(function (P, k) {
          if (P.tx != null) { c.strokeStyle = k ? 'rgba(96,165,250,.4)' : 'rgba(248,113,113,.4)'; c.lineWidth = 2; c.beginPath(); c.arc(P.tx, P.ty, 16, 0, 6.283); c.stroke(); }
          var out = Math.hypot(P.x - cx, P.y - cy) > R + 4, s = out && phase === 'out' ? Math.max(0.3, 1 - phaseT) : 1;
          c.save(); c.translate(P.x, P.y); c.scale(s, s);
          c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(3, 10, 28, 14, 0, 0, 6.283); c.fill();
          var bg = c.createRadialGradient(-8, -10, 4, 0, 0, 28); bg.addColorStop(0, '#fde2c4'); bg.addColorStop(1, '#e8b48a'); c.fillStyle = bg; c.beginPath(); c.arc(0, 0, 26, 0, 6.283); c.fill();
          c.rotate(P.face); c.fillStyle = P.col; c.fillRect(-24, -8, 48, 16); // пояс-маваси
          c.fillStyle = '#111'; c.beginPath(); c.arc(12, -9, 3, 0, 6.283); c.arc(12, 9, 3, 0, 6.283); c.fill(); // глаза по направлению
          c.fillStyle = '#1f2937'; c.beginPath(); c.arc(-14, 0, 7, 0, 6.283); c.fill(); // пучок
          c.restore();
          if (P.dashT > 0) { c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 3; c.beginPath(); c.arc(P.x, P.y, 32, -Math.PI / 2, -Math.PI / 2 + (1 - P.dashT / 2) * 6.283); c.stroke(); }
        });
        parts.forEach(function (q) { c.fillStyle = q.c; c.globalAlpha = Math.min(1, q.l * 2); c.beginPath(); c.arc(q.x, q.y, 4, 0, 6.283); c.fill(); }); c.globalAlpha = 1;
        c.restore();
        c.textAlign = 'center'; c.textBaseline = 'middle';
                c.font = '800 14px system-ui'; c.fillStyle = '#93c5fd'; c.fillText(nm[1], W / 2, 18); c.fillStyle = '#fca5a5'; c.fillText(nm[0], W / 2, H - 14);
        for (var w = 0; w < 3; w++) { c.fillStyle = w < wins[1] ? '#60a5fa' : 'rgba(255,255,255,.15)'; c.beginPath(); c.arc(W / 2 - 20 + w * 20, 36, 6, 0, 6.283); c.fill(); c.fillStyle = w < wins[0] ? '#f87171' : 'rgba(255,255,255,.15)'; c.beginPath(); c.arc(W / 2 - 20 + w * 20, H - 32, 6, 0, 6.283); c.fill(); }
        if (phase === 'ready') K.toast(c, W, cy, phaseT < 0.7 ? 'Приготовились…' : 'Хаккэёй!', 1);
        else if (phase === 'out') K.toast(c, W, cy, wins[0] >= 3 || wins[1] >= 3 ? (api.mode === 1 ? api.t(wins[0] >= 3 ? 'g.p1win' : 'g.p2win') : wins[0] >= 3 ? api.t('g.win') : api.t('g.lose')) : 'Счёт ' + wins[0] + ' : ' + wins[1], 1);
      }
    };
  }
};
