/* Перетягивание каната */
window.GAMES = window.GAMES || {};
window.GAMES.tug = {
  title: 'Канат',
  colors: ['#f97316', '#0891b2'],
  controls: 'none',
  modes: true,
  lan: true,
  multiTouch: true,
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="tugGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4ade80"/><stop offset="1" stop-color="#15803d"/></linearGradient>' +
    '<radialGradient id="tugMud" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#5b2a0c"/><stop offset="1" stop-color="#92400e"/></radialGradient></defs>' +
    '<rect x="4" y="4" width="92" height="92" rx="18" fill="url(#tugGrass)"/><path d="M4 30h92M4 70h92" stroke="#fff" stroke-opacity=".18" stroke-width="12"/>' +
    '<ellipse cx="50" cy="60" rx="20" ry="9" fill="url(#tugMud)"/><ellipse cx="45" cy="58" rx="6" ry="2" fill="#fff" opacity=".2"/>' +
    '<path d="M6 54 Q30 49 50 52 T94 54" stroke="#6b3d12" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M6 54 Q30 49 50 52 T94 54" stroke="#d6a35c" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="4 3"/>' +
    '<path d="M50 52 V30" stroke="#78350f" stroke-width="2.5"/><path d="M50 30 Q60 28 66 33 Q58 36 50 40z" fill="#ef4444"/>' +
    '<circle cx="20" cy="30" r="8" fill="#fde4c3"/><path d="M12 28a8 8 0 0 1 16 0z" fill="#db2777"/><rect x="14" y="38" width="12" height="16" rx="5" fill="#db2777"/><path d="M17 54l-4 12M23 54l4 12" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>' +
    '<circle cx="80" cy="30" r="8" fill="#fde4c3"/><path d="M72 28a8 8 0 0 1 16 0z" fill="#0891b2"/><rect x="74" y="38" width="12" height="16" rx="5" fill="#0891b2"/><path d="M77 54l-4 12M83 54l4 12" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/></svg>',

  create: function (api) {
    var DIFF = [
      { rate: 4.2, zone: 0.25 }, { rate: 6, zone: 0.4 }, { rate: 7.6, zone: 0.55 }, { rate: 9.2, zone: 0.7 }
    ];
    var D, pos, vel, phase, phaseT, rounds, cpuT, meters, t, parts, pops, endT, lean, taps, roundTime;
    var comboN = [0, 0]; // v2.0: 5 сильных рывков подряд — суперрывок
    // v2.5: сеть. Хозяин (side 0, низ) считает всё; гость (side 1, верх) шлёт накопительные счётчики рывков и видит себя внизу.
    var NET, GUEST, me, gTap, gSeen, rIn, sendT, seq, snap, oppTaps, overFlag, netG;
    var PH = ['count', 'go', 'roundEnd'];
    function sd(side) { return side === me ? 1 : -1; } // 1 — сторона внизу экрана
    function vpos() { return GUEST ? -pos : pos; } // позиция в координатах экрана (минус — к низу)
    // pos: -1 — победа нижних (игрок 1), +1 — победа верхних

    function newRound() {
      pos = 0; vel = 0; phase = 'count'; phaseT = 0; cpuT = 0.5; lean = [0, 0]; roundTime = 0; comboN = [0, 0];
      meters = [{ p: 0, dir: 1, sp: 1.4 }, { p: 0.5, dir: -1, sp: 1.55 }];
    }
    function inZone(m) { return Math.abs(m.p - 0.5) < 0.13; }
    function pull(side, rs) { // side 0 — низ, 1 — верх
      if (phase !== 'go') return;
      var strong, sup = false;
      if (rs) { strong = rs.s; sup = rs.u; } // рывок гостя, принятый хозяином
      else {
        strong = inZone(meters[side]);
        comboN[side] = strong ? comboN[side] + 1 : 0;
        if (comboN[side] >= 5) { comboN[side] = 0; sup = true; }
      }
      var f = strong ? 0.052 : 0.026, k = sd(side);
      if (sup) {
        f += 0.11;
        var sy = api.H / 2 - vpos() * api.H * 0.28;
        api.fx.text(api.W / 2, sy + k * 70, api.t('tug.super'), k < 0 ? '#22d3ee' : '#f472b6', 22);
        if (side === me || api.mode === 1) { api.fx.shake(6); api.sound('bonus'); api.vibrate(40); }
      }
      if (GUEST) { gTap.n++; if (strong) gTap.s++; if (sup) gTap.u++; gTap.dirty = true; }
      vel += side === 0 ? -f : f; // у гостя — локальное предсказание до прихода снимка
      lean[side] = 1; taps[side]++;
      if (strong) {
        pops.push({ side: side, text: api.t('tug.strong'), life: 0.6 });
        if (side === me || api.mode === 1) { api.sound('coin'); api.vibrate(15); }
      } else if (side === me || api.mode === 1) { api.sound('move'); api.vibrate(5); }
      var y = api.H / 2 - vpos() * api.H * 0.28;
      for (var i = 0; i < 3; i++) parts.push({ x: api.W / 2 + (Math.random() - 0.5) * 40, y: y + k * 30, vx: (Math.random() - 0.5) * 80, vy: k * Math.random() * 60, life: 0.4 });
    }
    function roundWon(winSide, r) { // и у хозяина, и у гостя (по событию)
      if (r) rounds = [r[0], r[1]]; else rounds[winSide]++;
      phase = 'roundEnd'; phaseT = 0; pos = winSide ? 1 : -1; vel = 0;
      if (winSide === me) { if (api.mode === 0) api.addScore(300 * (api.diff + 1) + Math.max(0, Math.round((20 - roundTime) * 20))); api.sound('win'); api.vibrate(80); }
      else { api.sound(api.mode !== 1 ? 'hit' : 'win'); api.vibrate(80); }
      if (api.mode === 0 && rounds[0] >= 2) api.addScore(500 * (api.diff + 1));
    }
    function hostNet(dt) { // хозяин: принять рывки гостя, разослать снимок
      if (rIn) {
        var du = Math.max(0, rIn.u - gSeen.u), ds = Math.max(0, rIn.s - gSeen.s), dn = Math.max(0, rIn.n - gSeen.n);
        gSeen = { n: rIn.n, s: rIn.s, u: rIn.u }; rIn = null;
        if (phase === 'go') {
          var i;
          for (i = 0; i < du; i++) pull(1, { s: true, u: true });
          for (i = 0; i < ds - du; i++) pull(1, { s: true, u: false });
          for (i = 0; i < dn - ds; i++) pull(1, { s: false, u: false });
        }
      }
      sendT -= dt;
      if (sendT <= 0) {
        sendT = 0.05;
        api.net.sendFast({ k: 'st', g: netG, q: ++seq, p: Math.round(pos * 1e4) / 1e4, v: Math.round(vel * 1e4) / 1e4, ph: PH.indexOf(phase), t: Math.round(phaseT * 100) / 100, r: rounds, n: taps[0] });
      }
    }
    function guestNet(dt) { // гость: отправка рывков, следование за снимком хозяина
      sendT -= dt;
      if (gTap.dirty && sendT <= 0) { sendT = 0.05; gTap.dirty = false; api.net.sendFast({ k: 'in', g: netG, n: gTap.n, s: gTap.s, u: gTap.u }); }
      if (!snap) return;
      var ph = PH[snap.ph] || 'count';
      if (ph === 'count' && phase !== 'count') { newRound(); phaseT = snap.t; }
      else if (ph === 'go' && phase === 'count') { phase = 'go'; phaseT = snap.t; api.sound('jump'); }
      else if (ph === 'roundEnd' && phase !== 'roundEnd') roundWon(snap.p > 0 ? 1 : 0, snap.r);
      if (ph === phase && Math.abs(phaseT - snap.t) > 0.4) phaseT = snap.t;
      if (snap.n > oppTaps) { lean[0] = 1; oppTaps = snap.n; }
      else if (snap.n < oppTaps) oppTaps = snap.n;
      if (phase === 'go') { // экстраполяция снимка с учётом затухания скорости и плавная подтяжка
        var age = Math.min(0.3, (Date.now() - snap.at) / 1000), dec = Math.pow(0.08, age);
        var sp = snap.p + snap.v * 6 * (1 - dec) / 2.5257, sv = snap.v * dec, a = Math.min(1, dt * 6);
        pos += (sp - pos) * a; vel += (sv - vel) * a;
        pos = Math.max(-0.995, Math.min(0.995, pos));
      }
    }
    var bgOff = null, bgKey = '';
    function mk(W, H) { var d = Math.min(2, window.devicePixelRatio || 1), cv = document.createElement('canvas'); cv.width = Math.ceil(W * d); cv.height = Math.ceil(H * d); var x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); cv.x = x; return cv; }
    function buildBg() {
      var W = api.W, H = api.H, mid = H / 2, cx = W / 2, seed = 9, i;
      function R() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      bgOff = mk(W, H); var x = bgOff.x;
      x.fillStyle = '#3fbf68'; x.fillRect(0, 0, W, H);
      var band = 44; // полосы стрижки
      for (var by = 0, k = 0; by < H; by += band, k++) { x.fillStyle = k % 2 ? 'rgba(255,255,255,.07)' : 'rgba(0,60,20,.07)'; x.fillRect(0, by, W, band); }
      x.lineCap = 'round';
      for (i = 0; i < 2600; i++) {
        var gx = R() * W, gy = R() * H, gl = 2 + R() * 4, ga = -Math.PI / 2 + (R() - 0.5) * 0.9;
        x.strokeStyle = R() < 0.55 ? 'rgba(20,100,45,' + (0.15 + R() * 0.22).toFixed(2) + ')' : 'rgba(170,240,170,' + (0.15 + R() * 0.25).toFixed(2) + ')';
        x.lineWidth = 0.8 + R() * 0.6; x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx + Math.cos(ga) * gl, gy + Math.sin(ga) * gl); x.stroke();
      }
      for (i = 0; i < 18; i++) { // цветочки/клевер
        var fx = R() * W, fy = R() * H; if (Math.abs(fy - mid) < 70) continue;
        x.fillStyle = R() < 0.5 ? 'rgba(255,255,255,.8)' : 'rgba(253,224,71,.85)';
        for (var pp = 0; pp < 5; pp++) { var pa = pp * 1.257; x.beginPath(); x.arc(fx + Math.cos(pa) * 2, fy + Math.sin(pa) * 2, 1.4, 0, 6.283); x.fill(); }
        x.fillStyle = '#f59e0b'; x.beginPath(); x.arc(fx, fy, 1, 0, 6.283); x.fill();
      }
      // зоны команд
      var zt = x.createLinearGradient(0, 0, 0, H * 0.2); zt.addColorStop(0, 'rgba(219,39,119,.55)'); zt.addColorStop(1, 'rgba(219,39,119,0)');
      x.fillStyle = zt; x.fillRect(0, 0, W, H * 0.2);
      var zb = x.createLinearGradient(0, H, 0, H * 0.8); zb.addColorStop(0, 'rgba(8,145,178,.6)'); zb.addColorStop(1, 'rgba(8,145,178,0)');
      x.fillStyle = zb; x.fillRect(0, H * 0.8, W, H * 0.2);
      // меловые линии
      [[mid - H * 0.28, '#f472b6'], [mid + H * 0.28, '#22d3ee']].forEach(function (ln) {
        x.fillStyle = 'rgba(255,255,255,.75)'; x.fillRect(0, ln[0] - 3, W, 6);
        x.fillStyle = ln[1]; for (var dx = 0; dx < W; dx += 18) x.fillRect(dx, ln[0] - 1.5, 10, 3);
        for (var cc = 0; cc < 220; cc++) { x.fillStyle = 'rgba(60,140,70,.5)'; x.fillRect(R() * W, ln[0] - 3 + R() * 6, 1.5, 1.5); }
      });
      x.fillStyle = 'rgba(255,255,255,.4)'; x.fillRect(0, mid - 1, W, 2);
      // грязевая яма неправильной формы
      function blob(rx, ry, jit, col) {
        x.fillStyle = col; x.beginPath();
        for (var a = 0; a <= 64; a++) { var an = a / 64 * 6.283, rr = 1 + Math.sin(an * 3 + jit) * 0.06 + Math.sin(an * 7 + jit * 2) * 0.04; var px = cx + Math.cos(an) * rx * rr, py = mid + Math.sin(an) * ry * rr; if (a) x.lineTo(px, py); else x.moveTo(px, py); }
        x.closePath(); x.fill();
      }
      blob(W * 0.47, 54, 1, 'rgba(60,40,10,.35)');
      blob(W * 0.44, 48, 2, '#8a4b17');
      var mg = x.createRadialGradient(cx, mid, 5, cx, mid, W * 0.42); mg.addColorStop(0, '#4a2208'); mg.addColorStop(0.75, '#6e360f'); mg.addColorStop(1, 'rgba(110,54,15,0)');
      x.save(); x.translate(cx, mid); x.scale(1, 44 / (W * 0.42)); x.translate(-cx, -mid); x.fillStyle = mg; x.beginPath(); x.arc(cx, mid, W * 0.42, 0, 6.283); x.fill(); x.restore();
      for (i = 0; i < 9; i++) { // лужицы-блики
        var lx = cx + (R() - 0.5) * W * 0.6, ly = mid + (R() - 0.5) * 40, lw = 8 + R() * 22;
        x.fillStyle = 'rgba(140,90,40,.6)'; x.beginPath(); x.ellipse(lx, ly, lw, lw * 0.3, 0, 0, 6.283); x.fill();
        x.fillStyle = 'rgba(255,255,255,.16)'; x.beginPath(); x.ellipse(lx - lw * 0.2, ly - lw * 0.06, lw * 0.45, lw * 0.08, 0, 0, 6.283); x.fill();
      }
      for (i = 0; i < 40; i++) { // брызги
        var sa = R() * 6.283, sd = 1.05 + R() * 0.35, sx = cx + Math.cos(sa) * W * 0.44 * sd, sy = mid + Math.sin(sa) * 50 * sd;
        x.fillStyle = 'rgba(110,60,20,' + (0.4 + R() * 0.4).toFixed(2) + ')'; x.beginPath(); x.arc(sx, sy, 1 + R() * 3, 0, 6.283); x.fill();
      }
      var vg = x.createRadialGradient(cx, mid, Math.min(W, H) * 0.3, cx, mid, Math.max(W, H) * 0.7);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,30,10,.4)'); x.fillStyle = vg; x.fillRect(0, 0, W, H);
    }
    function rrp(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
    function person(c, x, y, col, k, flip, idx) {
      var sway = Math.sin(t * 10 + idx) * 2 * k, dark = col === '#0891b2' ? '#0e5b70' : '#9d174d';
      c.save(); c.translate(x, y); if (flip) c.scale(1, -1);
      c.fillStyle = 'rgba(0,40,10,.25)'; c.beginPath(); c.ellipse(3, 14, 15, 7, 0, 0, 6.283); c.fill();
      c.rotate(0.35 * k + sway * 0.02);
      c.lineCap = 'round';
      c.strokeStyle = '#1e293b'; c.lineWidth = 7; // ноги
      c.beginPath(); c.moveTo(-2, 0); c.lineTo(-7, 17); c.moveTo(3, 0); c.lineTo(9, 16); c.stroke();
      c.fillStyle = '#f8fafc'; c.beginPath(); c.ellipse(-8, 19, 4.5, 3, 0.3, 0, 6.283); c.ellipse(10, 18, 4.5, 3, -0.3, 0, 6.283); c.fill();
      c.fillStyle = col; c.beginPath(); c.ellipse(-8, 20.5, 4.5, 1.4, 0.3, 0, 6.283); c.ellipse(10, 19.5, 4.5, 1.4, -0.3, 0, 6.283); c.fill();
      c.fillStyle = dark; rrp(c, -8, -25, 16, 27, 7); c.fill(); // тело
      c.fillStyle = col; rrp(c, -8, -25, 12, 27, 6); c.fill();
      c.fillStyle = 'rgba(255,255,255,.25)'; rrp(c, -6, -23, 4, 18, 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,.85)'; c.font = '900 9px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; if (flip) { c.save(); c.scale(1, -1); c.fillText(String(idx % 3 + 1), 0, 11); c.restore(); } else c.fillText(String(idx % 3 + 1), 0, -11);
      c.strokeStyle = col; c.lineWidth = 6; c.beginPath(); c.moveTo(-3, -19); c.lineTo(-9, -23); c.stroke(); // рукав
      c.strokeStyle = '#f5cfa0'; c.lineWidth = 4.5; c.beginPath(); c.moveTo(-9, -23); c.lineTo(-14, -26); c.stroke(); // предплечье
      c.fillStyle = '#f5cfa0'; c.beginPath(); c.arc(-15, -26.5, 3.4, 0, 6.283); c.fill();
      c.fillStyle = '#f5cfa0'; c.beginPath(); c.arc(0, -33, 8, 0, 6.283); c.fill(); // голова
      c.fillStyle = 'rgba(200,120,80,.25)'; c.beginPath(); c.arc(3, -31, 7, -0.6, 1.6); c.fill();
      c.fillStyle = dark; c.beginPath(); c.arc(0, -35, 8.5, Math.PI, 0); c.fill(); // кепка
      c.fillStyle = col; c.beginPath(); c.arc(-1, -35.5, 7.5, Math.PI, 0); c.fill();
      c.fillStyle = dark; c.beginPath(); c.ellipse(-6, -35, 6, 2, -0.15, 0, 6.283); c.fill(); // козырёк
      c.fillStyle = '#111'; c.beginPath(); c.arc(-3, -31, 1.4, 0, 6.283); c.arc(3, -31, 1.4, 0, 6.283); c.fill();
      c.fillStyle = 'rgba(244,114,182,.45)'; c.beginPath(); c.arc(-5, -28.5, 1.8, 0, 6.283); c.arc(5, -28.5, 1.8, 0, 6.283); c.fill();
      c.strokeStyle = '#7c2d12'; c.lineWidth = 1.2; c.beginPath(); c.arc(0, -28, 2.4, 0.2 + k * 0.5, Math.PI - 0.2 - k * 0.5); c.stroke();
      c.restore();
    }

    return {
      reset: function () {
        D = DIFF[api.diff]; rounds = [0, 0]; t = 0; parts = []; pops = []; endT = 0; taps = [0, 0];
        NET = api.mode === 2 && !!api.net; GUEST = NET && !api.net.host; me = GUEST ? 1 : 0;
        gTap = { n: 0, s: 0, u: 0, dirty: false }; gSeen = { n: 0, s: 0, u: 0 }; rIn = null; sendT = 0; seq = 0; snap = null; oppTaps = 0; overFlag = false;
        netG = NET ? (api.net.seed || 0) % 100000 : 0;
        newRound();
      },
      netMsg: function (d) {
        if (!d || d.g !== netG) return; // хвост прошлой партии после рестарта
        if (d.k === 'in' && !GUEST) { if (!rIn || d.n >= rIn.n) rIn = d; }
        else if (d.k === 'st' && GUEST) { if (!snap || d.q > snap.q) { snap = d; snap.at = Date.now(); } }
        else if (d.k === 'rd' && GUEST) { if (phase !== 'roundEnd') roundWon(d.w, d.r); else rounds = [d.r[0], d.r[1]]; }
        else if (d.k === 'ov' && GUEST) overFlag = true;
      },
      idle: function (dt) { t += dt; },
      key: function (k, down) { if (down && (k === 'a' || k === 'up')) pull(me); },
      input: function (type, d) {
        if (type !== 'press') return;
        if (d.y > api.H / 2) pull(me);
        else if (api.mode === 1) pull(1);
      },
      update: function (dt) {
        t += dt; phaseT += dt;
        parts = parts.filter(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; return p.life > 0; });
        pops = pops.filter(function (p) { p.life -= dt; return p.life > 0; });
        lean[0] = Math.max(0, lean[0] - dt * 5); lean[1] = Math.max(0, lean[1] - dt * 5);
        meters.forEach(function (m) { m.p += m.dir * m.sp * dt; if (m.p > 1) { m.p = 1; m.dir = -1; } if (m.p < 0) { m.p = 0; m.dir = 1; } });
        if (GUEST) { // гость не ведёт логику — только предсказание и следование за хозяином
          if (overFlag) { overFlag = false; api.gameOver(); return; }
          if (phase === 'count' && phaseT < 3 && Math.floor(phaseT) !== Math.floor(phaseT - dt)) api.sound('point');
          if (phase === 'go') { roundTime += dt; vel *= Math.pow(0.08, dt); pos += vel * dt * 6; }
          guestNet(dt);
          return;
        }
        if (NET) hostNet(dt);
        if (endT > 0) { endT -= dt; if (endT <= 0) { if (NET) api.net.send({ k: 'ov', g: netG }); api.gameOver(); } return; }
        if (phase === 'count') { if (phaseT > 3) { phase = 'go'; phaseT = 0; api.sound('jump'); } else if (Math.floor(phaseT) !== Math.floor(phaseT - dt)) api.sound('point'); return; }
        if (phase === 'roundEnd') { if (phaseT > 1.8) { if (rounds[0] >= 2 || rounds[1] >= 2) endT = 0.1; else newRound(); } return; }
        roundTime += dt;
        // ИИ
        if (api.mode === 0) {
          cpuT -= dt;
          if (cpuT <= 0) {
            cpuT = 1 / (D.rate * (0.8 + Math.random() * 0.4));
            if (Math.random() < D.zone && !inZone(meters[1])) cpuT = 0.02; // ждёт зелёную зону
            else pull(1);
          }
        }
        vel *= Math.pow(0.08, dt);
        pos += vel * dt * 6;
        if (Math.abs(pos) >= 1) {
          var winSide = pos <= -1 ? 0 : 1;
          roundWon(winSide);
          if (NET) { api.net.send({ k: 'rd', g: netG, w: winSide, r: rounds }); sendT = 0; }
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H, cx = W / 2, mid = H / 2, vp = vpos(), ry = mid - vp * H * 0.28;
        // поле
        var key = W + 'x' + H; if (key !== bgKey) { bgKey = key; buildBg(); }
        c.drawImage(bgOff, 0, 0, W, H);
        c.fillStyle = 'rgba(255,255,255,.14)';
        for (var b = 0; b < 6; b++) { var bp = (t * 0.7 + b * 0.37) % 1; c.beginPath(); c.arc(cx - W * 0.3 + b * W * 0.12, mid + Math.sin(t * 2 + b) * 6, 2 + bp * 3, 0, 6.283); c.fill(); }
        // канат: тень, основа, свитые пряди
        c.lineCap = 'round';
        c.strokeStyle = 'rgba(0,30,10,.3)'; c.lineWidth = 10; c.beginPath(); c.moveTo(cx + 5, 24); c.lineTo(cx + 5, H - 16); c.stroke();
        c.strokeStyle = '#7c4a1a'; c.lineWidth = 11;
        c.beginPath(); c.moveTo(cx, 20); c.lineTo(cx, H - 20); c.stroke();
        c.strokeStyle = '#d6a35c'; c.lineWidth = 8;
        c.beginPath(); c.moveTo(cx, 20); c.lineTo(cx, H - 20); c.stroke();
        var off = (vp * H * 0.28) % 10; if (off < 0) off += 10;
        c.strokeStyle = '#a8712f'; c.lineWidth = 3.2; c.lineCap = 'butt'; c.beginPath();
        for (var yy = 20 + off; yy < H - 26; yy += 10) { c.moveTo(cx - 4, yy); c.lineTo(cx + 4, yy + 6); }
        c.stroke();
        c.strokeStyle = 'rgba(255,240,200,.55)'; c.lineWidth = 1.2; c.beginPath();
        for (yy = 22 + off; yy < H - 26; yy += 10) { c.moveTo(cx - 3, yy + 0.5); c.lineTo(cx + 1, yy + 3.5); }
        c.stroke(); c.lineCap = 'round';
        // флажок-центр: узел и развевающийся флаг
        c.fillStyle = '#7c2d12'; c.beginPath(); c.ellipse(cx, ry, 8, 6, 0, 0, 6.283); c.fill();
        c.fillStyle = '#b45309'; c.beginPath(); c.ellipse(cx - 1, ry - 1, 6, 4, 0, 0, 6.283); c.fill();
        c.strokeStyle = '#e5e7eb'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(cx, ry); c.lineTo(cx, ry - 30); c.stroke();
        var wv = Math.sin(t * 6) * 3;
        c.fillStyle = '#b91c1c'; c.beginPath(); c.moveTo(cx + 1, ry - 30); c.quadraticCurveTo(cx + 14, ry - 34 + wv, cx + 30, ry - 24 + wv * 0.5); c.quadraticCurveTo(cx + 16, ry - 18 - wv, cx + 1, ry - 14); c.closePath(); c.fill();
        c.fillStyle = '#ef4444'; c.beginPath(); c.moveTo(cx + 1, ry - 30); c.quadraticCurveTo(cx + 14, ry - 34 + wv, cx + 30, ry - 24 + wv * 0.5); c.quadraticCurveTo(cx + 15, ry - 25, cx + 1, ry - 22); c.closePath(); c.fill();
        c.fillStyle = '#fde047'; c.beginPath(); c.arc(cx, ry - 31, 2.2, 0, 6.283); c.fill();
        // команды
        for (var i = 0; i < 3; i++) {
          person(c, cx + 16, ry + 70 + i * 52, '#0891b2', lean[me], false, i);
          person(c, cx + 16, ry - 70 - i * 52, '#db2777', lean[1 - me], true, i + 3);
        }
        parts.forEach(function (p) {
          c.globalAlpha = Math.min(1, p.life * 2.5); c.fillStyle = '#5b2a0c'; c.beginPath(); c.arc(p.x, p.y, 2 + p.life * 6, 0, 6.283); c.fill();
          c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.arc(p.x - 1, p.y - 1, 1 + p.life * 2, 0, 6.283); c.fill();
        });
        c.globalAlpha = 1;
        // индикаторы силы
        function meter(m, y, col) {
          var x0 = 20, w = W * 0.32, h = 14, z = inZone(m);
          c.fillStyle = 'rgba(0,0,0,.3)'; rrp(c, x0 - 3, y - 3 + 2, w + 6, h + 6, 10); c.fill();
          c.fillStyle = '#1e293b'; rrp(c, x0 - 3, y - 3, w + 6, h + 6, 10); c.fill();
          var mgr = c.createLinearGradient(x0, 0, x0 + w, 0); mgr.addColorStop(0, '#ef4444'); mgr.addColorStop(0.3, '#f59e0b'); mgr.addColorStop(0.5, '#4ade80'); mgr.addColorStop(0.7, '#f59e0b'); mgr.addColorStop(1, '#ef4444');
          c.globalAlpha = 0.45; c.fillStyle = mgr; rrp(c, x0, y, w, h, 7); c.fill(); c.globalAlpha = 1;
          c.fillStyle = z ? '#86efac' : 'rgba(74,222,128,.9)'; rrp(c, x0 + w * 0.37, y, w * 0.26, h, 4); c.fill();
          c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x0 + 4, y + 2, w - 8, 2);
          var mx = x0 + m.p * w;
          c.fillStyle = 'rgba(0,0,0,.35)'; rrp(c, mx - 3, y - 3, 8, h + 8, 3); c.fill();
          c.fillStyle = col; rrp(c, mx - 4, y - 5, 8, h + 10, 3); c.fill();
          if (z && api.quality > 0) { c.strokeStyle = 'rgba(134,239,172,.8)'; c.lineWidth = 2; rrp(c, mx - 6, y - 7, 12, h + 14, 4); c.stroke(); }
        }
        meter(meters[me], H - 40, '#fff');
        for (var cp = 0; cp < 5; cp++) { c.fillStyle = cp < comboN[me] ? '#f472b6' : 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(W / 2 + (cp - 2) * 14, H - 62, 4.5, 0, 6.283); c.fill(); }
        if (api.mode === 1) meter(meters[1], 26, '#fff');
        // табло
        [[mid - 66, '#db2777'], [mid + 8, '#0891b2']].forEach(function (bd) {
          c.fillStyle = 'rgba(0,0,0,.3)'; rrp(c, W - 58, bd[0] + 2, 50, 58, 12); c.fill();
          c.fillStyle = bd[1]; rrp(c, W - 58, bd[0], 50, 58, 12); c.fill();
          c.fillStyle = 'rgba(255,255,255,.16)'; rrp(c, W - 55, bd[0] + 2, 44, 12, 8); c.fill();
        });
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 22px system-ui, sans-serif';
        c.fillStyle = '#fff'; c.fillText(rounds[1 - me] + '', W - 33, mid - 28); c.fillText(rounds[me] + '', W - 33, mid + 28);
        c.font = '800 11px system-ui, sans-serif'; c.fillStyle = 'rgba(255,255,255,.85)';
        c.fillText(api.mode === 1 ? api.t('g.p2') : api.mode === 2 ? api.t('net.opp') : api.t('g.cpu'), W - 33, mid - 52);
        c.fillText(api.mode === 1 ? api.t('g.p1') : api.t('g.you'), W - 33, mid + 52);
        pops.forEach(function (p) {
          c.globalAlpha = p.life / 0.6; c.textAlign = 'left'; c.font = '900 16px system-ui, sans-serif'; c.fillStyle = '#fde047';
          c.fillText(p.text, 20, sd(p.side) < 0 ? 60 : H - 60);
        });
        c.globalAlpha = 1;
        c.textAlign = 'center';
        if (phase === 'count') {
          var n = Math.max(1, 3 - Math.floor(phaseT));
          c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, mid - 50, W, 100);
          c.fillStyle = '#fff'; c.font = '900 64px system-ui, sans-serif'; c.fillText(String(n), cx, mid);
        } else if (phase === 'go' && phaseT < 0.8) {
          c.fillStyle = '#fde047'; c.font = '900 48px system-ui, sans-serif'; c.fillText(api.t('tug.go'), cx, mid);
        } else if (phase === 'go' && t % 1.2 < 0.8 && roundTime < 6) {
          c.fillStyle = 'rgba(255,255,255,.9)'; c.font = '900 18px system-ui, sans-serif';
          c.fillText(api.t('tug.tap'), cx, H * 0.86);
          if (api.mode === 1) { c.save(); c.translate(cx, H * 0.14); c.rotate(Math.PI); c.fillText(api.t('tug.tap'), 0, 0); c.restore(); }
        } else if (phase === 'roundEnd') {
          var bw = vp < 0;
          c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, mid - 40, W, 80);
          c.fillStyle = bw ? '#22d3ee' : '#f472b6'; c.font = '900 30px system-ui, sans-serif';
          c.fillText(api.mode === 1 ? api.t(bw ? 'g.p1win' : 'g.p2win') : api.t(bw ? 'g.win' : 'g.lose'), cx, mid);
        }
      }
    };
  }
};
