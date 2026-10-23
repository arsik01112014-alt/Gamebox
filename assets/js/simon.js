/* Саймон: повтори последовательность */
window.GAMES = window.GAMES || {};
window.GAMES.simon = {
  title: 'Саймон',
  desc: 'Повтори мелодию',
  hint: 'Запомни, какие кнопки загорелись, и нажми их в том же порядке. С каждым раундом цепочка длиннее и быстрее.',
  colors: ['#8b5cf6', '#22c55e'],
  controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="92" rx="22" fill="#1e1a5c"/><circle cx="30" cy="26" r="30" fill="#4338ca" opacity=".35"/>' +
    '<circle cx="50" cy="53" r="44" fill="#000" opacity=".35"/><circle cx="50" cy="50" r="44" fill="#64748b"/><path d="M14 30 A44 44 0 0 1 80 18" stroke="#e2e8f0" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="50" cy="50" r="40" fill="#0b0820"/>' +
    '<path d="M52 12 A38 38 0 0 1 88 48 H64 A14 14 0 0 0 52 36z" fill="#22c55e"/><path d="M88 52 A38 38 0 0 1 52 88 V64 A14 14 0 0 0 64 52z" fill="#3b82f6"/>' +
    '<path d="M48 88 A38 38 0 0 1 12 52 H36 A14 14 0 0 0 48 64z" fill="#facc15"/><path d="M12 48 A38 38 0 0 1 48 12 V36 A14 14 0 0 0 36 48z" fill="#fca5a5"/>' +
    '<path d="M18 40 A34 34 0 0 1 40 17" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/><path d="M60 17 A34 34 0 0 1 82 38" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".35"/>' +
    '<circle cx="50" cy="50" r="13" fill="#94a3b8"/><circle cx="50" cy="50" r="11" fill="#1e1a5c"/><rect x="41" y="44.5" width="18" height="11" rx="2.5" fill="#052e16"/><text x="50" y="53.6" font-family="monospace" font-weight="bold" font-size="9.5" fill="#4ade80" text-anchor="middle">12</text></svg>',

  create: function (api) {
    var PADS = [
      { c: '#22c55e', l: '#86efac', f: 392 }, { c: '#ef4444', l: '#fca5a5', f: 330 },
      { c: '#facc15', l: '#fef08a', f: 262 }, { c: '#3b82f6', l: '#93c5fd', f: 523 },
      { c: '#ec4899', l: '#f9a8d4', f: 440 }, { c: '#f97316', l: '#fdba74', f: 294 }
    ];
    var DIFF = [{ n: 4, step: 0.75, fast: 0.015 }, { n: 4, step: 0.6, fast: 0.02 }, { n: 5, step: 0.5, fast: 0.02 }, { n: 6, step: 0.42, fast: 0.02 }];
    var D, seq, idx, phase, phaseT, showI, lit, litT, t, cx, cy, R, endT, msg;
    var lives = 0, rev = false;
    var off = null, offK = '', ripples = []; // v2.0: запасные жизни и раунды «наоборот»

    function layout() { cx = api.W / 2; cy = api.H / 2 + 10; R = Math.min(api.W, api.H - 60) * 0.42; }
    function light(i) { lit = i; litT = 0.28; ripples.push({ i: i, life: 0.45 }); api.tone(PADS[i].f, 0.3, 'triangle', 0.12); api.vibrate(8); }
    function stepT() { return Math.max(0.22, D.step - seq.length * D.fast); }
    function nextRound() {
      seq.push(Math.floor(Math.random() * D.n));
      rev = api.diff >= 1 && seq.length >= 4 && seq.length % 4 === 0;
      phase = 'show'; phaseT = 0.7; showI = 0; idx = 0; msg = api.t(rev ? 'simon.rev' : 'simon.watch');
    }
    function padAt(x, y) {
      var dx = x - cx, dy = y - cy, d = Math.sqrt(dx * dx + dy * dy);
      if (d < R * 0.3 || d > R * 1.05) return -1;
      var a = Math.atan2(dy, dx) + Math.PI / 2; // 0 сверху
      if (a < 0) a += Math.PI * 2;
      return Math.floor(a / (Math.PI * 2 / D.n)) % D.n;
    }

    return {
      reset: function () {
        D = DIFF[api.diff]; seq = []; t = 0; lit = -1; litT = 0; endT = 0; phase = 'wait'; phaseT = 0; msg = '';
        lives = [2, 1, 0, 0][api.diff]; rev = false; ripples = [];
        layout();
      },
      begin: function () { nextRound(); },
      resize: layout,
      idle: function (dt) { t += dt; },
      input: function (type, d) {
        if (type !== 'down' || phase !== 'input') return;
        var i = padAt(d.x, d.y);
        if (i < 0) return;
        light(i);
        var want = rev ? seq[seq.length - 1 - idx] : seq[idx];
        if (i === want) {
          idx++;
          if (idx === seq.length) {
            api.addScore(seq.length * (10 + api.diff * 5) * (rev ? 2 : 1));
            if (rev) api.fx.text(cx, cy - R * 0.5, '×2', '#fde047', 26);
            phase = 'ok'; phaseT = 0.8; msg = api.t('simon.good');
            if (seq.length % 5 === 0) api.sound('bonus');
          }
        } else if (lives > 0) {
          lives--; api.sound('hit'); api.vibrate(80); api.fx.shake(4);
          phase = 'show'; phaseT = 1.1; showI = 0; idx = 0; msg = api.t('simon.again');
        } else {
          phase = 'fail'; msg = api.t('simon.wrong'); endT = 1.2;
          api.sound('hit'); api.vibrate(120); api.fx.shake(6);
        }
      },
      update: function (dt) {
        t += dt;
        if (litT > 0) { litT -= dt; if (litT <= 0) lit = -1; }
        for (var ri = ripples.length - 1; ri >= 0; ri--) { ripples[ri].life -= dt; if (ripples[ri].life <= 0) ripples.splice(ri, 1); }
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        phaseT -= dt;
        if (phase === 'show' && phaseT <= 0) {
          if (showI < seq.length) { light(seq[showI]); litT = stepT() * 0.65; showI++; phaseT = stepT(); }
          else { phase = 'input'; msg = api.t(rev ? 'simon.revYour' : 'simon.your'); }
        } else if (phase === 'ok' && phaseT <= 0) nextRound();
      },
      draw: function (c) {
        var W = api.W, H = api.H, Q = api.quality;
        var key = W + 'x' + H + ':' + D.n;
        if (!off || offK !== key) { buildOff(); offK = key; }
        c.drawImage(off, 0, 0, W, H);
        var n = D.n, seg = Math.PI * 2 / n, gap = 0.05;
        // приглушение кнопок вне фазы ввода
        if (phase !== 'input') {
          c.fillStyle = 'rgba(8,5,25,' + (phase === 'fail' ? 0.5 : 0.38) + ')';
          for (var i = 0; i < n; i++) { if (i === lit) continue; padPath(c, i, 0); c.fill(); }
        }
        // горящая кнопка
        if (lit >= 0) {
          var P = PADS[lit], a0 = -Math.PI / 2 + lit * seg + gap, a1 = -Math.PI / 2 + (lit + 1) * seg - gap, am = (a0 + a1) / 2;
          var k = Math.min(1, litT / 0.12);
          if (Q > 0) {
            var gx = cx + Math.cos(am) * R * 0.7, gy = cy + Math.sin(am) * R * 0.7;
            var gg = c.createRadialGradient(gx, gy, 0, gx, gy, R * 0.95);
            gg.addColorStop(0, hexA(P.l, 0.55 * k)); gg.addColorStop(1, hexA(P.l, 0));
            c.fillStyle = gg; c.fillRect(gx - R, gy - R, R * 2, R * 2);
          }
          var lg = c.createRadialGradient(cx + Math.cos(am) * R * 0.7, cy + Math.sin(am) * R * 0.7, R * 0.02, cx + Math.cos(am) * R * 0.7, cy + Math.sin(am) * R * 0.7, R * 0.6);
          lg.addColorStop(0, '#ffffff'); lg.addColorStop(0.35, P.l); lg.addColorStop(1, P.c);
          c.save(); c.globalAlpha = 0.55 + 0.45 * k;
          if (Q > 0) { c.shadowColor = P.l; c.shadowBlur = 30; }
          c.fillStyle = lg; padPath(c, lit, 0); c.fill();
          c.restore();
          // блик поверх
          c.save(); padPath(c, lit, 0); c.clip();
          c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.arc(cx - R * 0.25, cy - R * 0.45, R * 0.95, 0, 6.283); c.arc(cx - R * 0.1, cy - R * 0.2, R * 0.95, 0, 6.283, true); c.fill();
          c.restore();
        }
        // волны от нажатия
        for (var ri = 0; ri < ripples.length; ri++) {
          var rp = ripples[ri], q = 1 - rp.life / 0.45, b0 = -Math.PI / 2 + rp.i * seg + gap, b1 = -Math.PI / 2 + (rp.i + 1) * seg - gap;
          c.strokeStyle = hexA(PADS[rp.i].l, (1 - q) * 0.8); c.lineWidth = 3 * (1 - q) + 1;
          c.beginPath(); c.arc(cx, cy, R * (1.04 + q * 0.12), b0, b1); c.stroke();
        }
        // центр: LCD-счётчик
        var lw = R * 0.42, lh = R * 0.24, lx = cx - lw / 2, ly = cy - lh / 2 - R * 0.035;
        c.font = '700 ' + Math.floor(lh * 0.82) + 'px "Courier New", ui-monospace, monospace';
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = 'rgba(74,222,128,.08)'; c.fillText('88', cx, ly + lh * 0.54);
        var on = phase === 'fail' ? '#f87171' : '#4ade80';
        var txt = (seq.length < 10 ? '0' : '') + seq.length;
        if (Q > 0) { c.save(); c.shadowColor = on; c.shadowBlur = 10; c.fillStyle = on; c.fillText(txt, cx, ly + lh * 0.54); c.restore(); }
        else { c.fillStyle = on; c.fillText(txt, cx, ly + lh * 0.54); }
        c.font = '800 ' + Math.max(9, Math.floor(R * 0.062)) + 'px system-ui, sans-serif';
        c.fillStyle = 'rgba(226,232,240,.7)'; c.fillText(api.t('simon.round').toUpperCase(), cx, cy + R * 0.16);
        // статус-светодиоды на хабе
        var ledC = phase === 'input' ? '#4ade80' : phase === 'fail' ? '#ef4444' : phase === 'ok' ? '#facc15' : '#a78bfa';
        var blinkOn = phase !== 'show' || Math.floor(t * 4) % 2;
        c.fillStyle = blinkOn ? ledC : 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(cx, cy - R * 0.235, R * 0.022, 0, 6.283); c.fill();
        // жизни — сердечки
        for (var lv = 0; lv < lives; lv++) heart(c, W - 22 - lv * 24, 22, 9);
        // сообщение
        var my = Math.max(24, cy - R * 1.08 - 26);
        var mc = phase === 'fail' ? '#f87171' : rev && phase === 'input' ? '#fde047' : phase === 'input' ? '#86efac' : '#c4b5fd';
        c.font = '900 18px system-ui, sans-serif';
        var mw = c.measureText(msg).width + 36;
        if (msg) {
          c.fillStyle = 'rgba(15,10,46,.6)'; rr(c, cx - mw / 2, my - 17, mw, 34, 17); c.fill();
          c.strokeStyle = hexA(mc, 0.55); c.lineWidth = 1.5; c.stroke();
          c.fillStyle = mc; c.fillText(msg, cx, my + 1);
        }
        if (phase === 'input') {
          var m = Math.min(seq.length, 30), dy = Math.min(H - 16, cy + R * 1.08 + 26);
          for (var d = 0; d < m; d++) {
            var dx = cx + (d - m / 2 + 0.5) * 11, done = d < idx;
            c.fillStyle = done ? PADS[rev ? seq[seq.length - 1 - d] : seq[d]].l : 'rgba(255,255,255,.18)';
            c.beginPath(); c.arc(dx, dy, done ? 4 : 3.2, 0, 6.283); c.fill();
            if (done) { c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(dx - 1.2, dy - 1.2, 1.3, 0, 6.283); c.fill(); }
          }
        }
        c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.lineWidth = 1;
      }
    };

    function hexA(h, a) {
      var v = parseInt(h.slice(1), 16);
      return 'rgba(' + (v >> 16 & 255) + ',' + (v >> 8 & 255) + ',' + (v & 255) + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
    }
    function shade(h, f) {
      var v = parseInt(h.slice(1), 16), r = v >> 16 & 255, g = v >> 8 & 255, b = v & 255;
      if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
      return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
    }
    function rr(c, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2); c.beginPath();
      c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
      c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
    }
    function heart(c, x, y, s) {
      c.save(); c.translate(x, y);
      c.fillStyle = 'rgba(0,0,0,.35)'; heartPath(c, 1, 2, s); c.fill();
      var g = c.createLinearGradient(0, -s, 0, s); g.addColorStop(0, '#f9a8d4'); g.addColorStop(1, '#db2777');
      c.fillStyle = g; heartPath(c, 0, 0, s); c.fill();
      c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(-s * 0.4, -s * 0.35, s * 0.22, s * 0.14, -0.6, 0, 6.283); c.fill();
      c.restore();
    }
    function heartPath(c, x, y, s) {
      c.beginPath(); c.moveTo(x, y + s * 0.85);
      c.bezierCurveTo(x - s * 1.3, y - s * 0.05, x - s * 0.6, y - s * 1.05, x, y - s * 0.35);
      c.bezierCurveTo(x + s * 0.6, y - s * 1.05, x + s * 1.3, y - s * 0.05, x, y + s * 0.85); c.closePath();
    }
    function padPath(c, i, inset) {
      var seg = Math.PI * 2 / D.n, gap = 0.05;
      var a0 = -Math.PI / 2 + i * seg + gap, a1 = -Math.PI / 2 + (i + 1) * seg - gap;
      var ro = R - inset, ri = R * 0.36 + inset, gi = gap * (1 / 0.36 - 1);
      c.beginPath(); c.arc(cx, cy, ro, a0, a1); c.arc(cx, cy, ri, a1 - gi, a0 + gi, true); c.closePath();
    }
    // статичный слой: фон + корпус + кнопки в выключенном состоянии
    function buildOff() {
      var W = api.W, H = api.H, dpr = Math.min(2, window.devicePixelRatio || 1), i;
      off = off || document.createElement('canvas');
      off.width = Math.max(1, Math.ceil(W * dpr)); off.height = Math.max(1, Math.ceil(H * dpr));
      var g = off.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      var bg = g.createRadialGradient(cx, cy - R * 0.3, 10, cx, cy, Math.max(W, H) * 0.8);
      bg.addColorStop(0, '#3b3399'); bg.addColorStop(0.5, '#1e1a5c'); bg.addColorStop(1, '#0a0722');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      // узор из точек
      g.fillStyle = 'rgba(255,255,255,.045)';
      for (var y = 10; y < H; y += 18) for (var x = (y / 18 % 2) * 9; x < W; x += 18) { g.beginPath(); g.arc(x, y, 1.2, 0, 6.283); g.fill(); }
      // мягкие цветные пятна
      var blobs = [[0.15, 0.15, '#7c3aed'], [0.9, 0.3, '#2563eb'], [0.2, 0.9, '#db2777'], [0.85, 0.85, '#0891b2']];
      for (i = 0; i < blobs.length; i++) {
        var bx = blobs[i][0] * W, by = blobs[i][1] * H, br = Math.max(W, H) * 0.35, bgg = g.createRadialGradient(bx, by, 0, bx, by, br);
        bgg.addColorStop(0, hexA(blobs[i][2], 0.18)); bgg.addColorStop(1, hexA(blobs[i][2], 0));
        g.fillStyle = bgg; g.fillRect(bx - br, by - br, br * 2, br * 2);
      }
      // тень корпуса
      var sg = g.createRadialGradient(cx, cy + R * 0.12, R * 0.9, cx, cy + R * 0.12, R * 1.35);
      sg.addColorStop(0, 'rgba(0,0,0,.55)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = sg; g.beginPath(); g.arc(cx, cy + R * 0.12, R * 1.35, 0, 6.283); g.fill();
      // металлический ободок
      var rim = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      rim.addColorStop(0, '#e2e8f0'); rim.addColorStop(0.3, '#94a3b8'); rim.addColorStop(0.6, '#334155'); rim.addColorStop(1, '#0f172a');
      g.fillStyle = rim; g.beginPath(); g.arc(cx, cy, R * 1.12, 0, 6.283); g.fill();
      g.fillStyle = '#0b0820'; g.beginPath(); g.arc(cx, cy, R * 1.065, 0, 6.283); g.fill();
      var inner = g.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * 1.06);
      inner.addColorStop(0, '#0b0820'); inner.addColorStop(1, '#1a1440');
      g.fillStyle = inner; g.beginPath(); g.arc(cx, cy, R * 1.06, 0, 6.283); g.fill();
      // кнопки
      var n = D.n, seg = Math.PI * 2 / n;
      for (i = 0; i < n; i++) {
        var P = PADS[i], am = -Math.PI / 2 + (i + 0.5) * seg;
        var px = cx + Math.cos(am) * R * 0.68, py = cy + Math.sin(am) * R * 0.68;
        // нижняя грань (толщина)
        g.save(); g.translate(0, R * 0.025); g.fillStyle = shade(P.c, -0.6); padPath(g, i, 0); g.fill(); g.restore();
        var pg = g.createRadialGradient(px - R * 0.1, py - R * 0.12, R * 0.05, px, py, R * 0.62);
        pg.addColorStop(0, shade(P.c, 0.18)); pg.addColorStop(0.6, P.c); pg.addColorStop(1, shade(P.c, -0.35));
        g.fillStyle = pg; padPath(g, i, 0); g.fill();
        g.save(); padPath(g, i, 0); g.clip();
        // внутренняя тень по краю
        g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = R * 0.05; padPath(g, i, 0); g.stroke();
        // глянцевый блик
        var hl = g.createRadialGradient(cx - R * 0.35, cy - R * 0.75, R * 0.05, cx - R * 0.2, cy - R * 0.5, R * 1.25);
        hl.addColorStop(0, 'rgba(255,255,255,.42)'); hl.addColorStop(0.5, 'rgba(255,255,255,.12)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = hl; g.fillRect(cx - R * 1.1, cy - R * 1.1, R * 2.2, R * 2.2);
        // текстура пластика: тонкие концентрические кольца
        g.strokeStyle = 'rgba(255,255,255,.04)'; g.lineWidth = 1;
        for (var ring = R * 0.42; ring < R; ring += 5) { g.beginPath(); g.arc(cx, cy, ring, 0, 6.283); g.stroke(); }
        g.restore();
        // фаска
        g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1.5; padPath(g, i, 2.5); g.stroke();
        g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1; padPath(g, i, 0); g.stroke();
      }
      // центральный хаб
      g.fillStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.arc(cx, cy + R * 0.02, R * 0.33, 0, 6.283); g.fill();
      var hub = g.createLinearGradient(cx - R * 0.3, cy - R * 0.3, cx + R * 0.3, cy + R * 0.3);
      hub.addColorStop(0, '#cbd5e1'); hub.addColorStop(0.45, '#64748b'); hub.addColorStop(1, '#1e293b');
      g.fillStyle = hub; g.beginPath(); g.arc(cx, cy, R * 0.31, 0, 6.283); g.fill();
      var hub2 = g.createRadialGradient(cx - R * 0.08, cy - R * 0.1, R * 0.02, cx, cy, R * 0.28);
      hub2.addColorStop(0, '#3a3270'); hub2.addColorStop(1, '#151033');
      g.fillStyle = hub2; g.beginPath(); g.arc(cx, cy, R * 0.275, 0, 6.283); g.fill();
      // винтики
      for (i = 0; i < 4; i++) {
        var sa = Math.PI / 4 + i * Math.PI / 2, sx = cx + Math.cos(sa) * R * 0.22, sy = cy + Math.sin(sa) * R * 0.22;
        g.fillStyle = '#94a3b8'; g.beginPath(); g.arc(sx, sy, R * 0.018, 0, 6.283); g.fill();
        g.strokeStyle = '#334155'; g.lineWidth = 1; g.beginPath(); g.moveTo(sx - R * 0.012, sy); g.lineTo(sx + R * 0.012, sy); g.stroke();
      }
      // LCD-окно
      var lw = R * 0.42, lh = R * 0.24, lx = cx - lw / 2, ly = cy - lh / 2 - R * 0.035;
      g.fillStyle = '#94a3b8'; rr(g, lx - 3, ly - 3, lw + 6, lh + 6, 6); g.fill();
      var lcd = g.createLinearGradient(0, ly, 0, ly + lh); lcd.addColorStop(0, '#04170c'); lcd.addColorStop(1, '#0a2a17');
      g.fillStyle = lcd; rr(g, lx, ly, lw, lh, 4); g.fill();
      g.strokeStyle = 'rgba(74,222,128,.06)'; g.lineWidth = 1;
      for (var sl = ly + 2; sl < ly + lh; sl += 3) { g.beginPath(); g.moveTo(lx + 2, sl); g.lineTo(lx + lw - 2, sl); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,.07)'; rr(g, lx + 2, ly + 2, lw - 4, lh * 0.38, 3); g.fill();
      // виньетка
      var vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
    }
  }
};
