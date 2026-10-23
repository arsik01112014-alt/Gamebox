/* Дартс — 301 */
window.GAMES = window.GAMES || {};
window.GAMES.darts = {
  title: 'Дартс',
  colors: ['#16a34a', '#b91c1c'],
  controls: 'none',
  modes: true,
  lan: true,
  icon: '<svg viewBox="0 0 100 100"><defs><radialGradient id="dartsRim" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#3f3f46"/><stop offset="1" stop-color="#09090b"/></radialGradient>' +
    '<linearGradient id="dartsBar" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1f5f9"/><stop offset="1" stop-color="#64748b"/></linearGradient></defs>' +
    '<circle cx="50" cy="52" r="44" fill="#000" opacity=".3"/><circle cx="48" cy="50" r="44" fill="url(#dartsRim)"/><circle cx="48" cy="50" r="34" fill="#f1e3c3"/>' +
    '<g fill="#1a1a1a"><path d="M48 50L42.7 16.4A34 34 0 0 1 53.3 16.4z"/><path d="M48 50L81.6 44.7A34 34 0 0 1 81.6 55.3z"/><path d="M48 50L53.3 83.6A34 34 0 0 1 42.7 83.6z"/><path d="M48 50L14.4 55.3A34 34 0 0 1 14.4 44.7z"/>' +
    '<path d="M48 50L71.8 26.2A34 34 0 0 1 77.6 32.2z"/><path d="M48 50L71.8 73.8A34 34 0 0 1 65.8 79.6z"/><path d="M48 50L24.2 73.8A34 34 0 0 1 18.4 67.8z"/><path d="M48 50L24.2 26.2A34 34 0 0 1 30.2 20.4z"/></g>' +
    '<circle cx="48" cy="50" r="32" fill="none" stroke="#c81e1e" stroke-width="4" stroke-dasharray="5.2 4.8"/><circle cx="48" cy="50" r="20" fill="none" stroke="#15803d" stroke-width="3.5" stroke-dasharray="3.3 3"/>' +
    '<circle cx="48" cy="50" r="34" fill="none" stroke="#cbd5e1" stroke-width="1"/><circle cx="48" cy="50" r="5.5" fill="#15803d" stroke="#cbd5e1" stroke-width=".8"/><circle cx="48" cy="50" r="2.6" fill="#c81e1e"/>' +
    '<path d="M51 47 L60 38" stroke="#cbd5e1" stroke-width="1.6"/><path d="M60 38 L72 26" stroke="url(#dartsBar)" stroke-width="5" stroke-linecap="round"/><path d="M72 26 L78 20" stroke="#1e293b" stroke-width="2"/>' +
    '<path d="M77 21 L95 17 L88 24z M77 21 L81 3 L74 10z" fill="#22d3ee" stroke="#0e7490" stroke-width="1"/></svg>',

  create: function (api) {
    var ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
    var DIFF = [
      { start: 201, wob: 0.03, ai: 0.2 }, { start: 301, wob: 0.06, ai: 0.12 },
      { start: 301, wob: 0.09, ai: 0.075 }, { start: 501, wob: 0.12, ai: 0.045 }
    ];
    var D, R, cx, cy, left, turn, dartsLeft, turnStart, thrown, stuck, aim, aiming, flying, phase, phaseT, t, aiPlan, pops, endT, turns;
    // v2.5: сеть. Бросает только тот, чей ход: send({k:'th'}) с итоговой точкой, обе стороны симулируют полёт, затем бросавший шлёт
    // авторитетный итог ({k:'sy'}). Живой прицел соперника — sendFast({k:'a'}). Колебание прицела — от общего зерна (api.net.seed).
    var NET, me, netQ, oppAim, aimT, netG, wobPh, nThrow;
    function myTurn() { return !NET || turn === me; }

    function layout() {
      R = Math.min(api.W * 0.43, (api.H - 230) * 0.5);
      cx = api.W / 2; cy = 120 + R + 10;
      buildOff();
    }
    var bgOff = null, boardOff = null, BO = 0;
    function mk(W, H) { var d = Math.min(2, window.devicePixelRatio || 1), cv = document.createElement('canvas'); cv.width = Math.ceil(W * d); cv.height = Math.ceil(H * d); var x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); cv.x = x; return cv; }
    function buildOff() {
      var W = api.W, H = api.H, seed = 3, i;
      function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      // стена из досок
      bgOff = mk(W, H); var x = bgOff.x, pw = 46;
      for (var p = 0, n = 0; p < W; p += pw, n++) {
        var tone = 0.85 + rnd() * 0.3, g = x.createLinearGradient(p, 0, p + pw, 0);
        g.addColorStop(0, 'rgb(' + Math.round(70 * tone) + ',' + Math.round(46 * tone) + ',' + Math.round(30 * tone) + ')');
        g.addColorStop(1, 'rgb(' + Math.round(56 * tone) + ',' + Math.round(36 * tone) + ',' + Math.round(23 * tone) + ')');
        x.fillStyle = g; x.fillRect(p, 0, pw, H);
        for (i = 0; i < 9; i++) {
          var gx = p + 3 + rnd() * (pw - 6), ph = rnd() * 6;
          x.strokeStyle = rnd() < 0.5 ? 'rgba(20,10,4,.25)' : 'rgba(255,200,150,.06)'; x.lineWidth = 0.6 + rnd();
          x.beginPath(); x.moveTo(gx, 0); for (var yy = 0; yy <= H; yy += 18) x.lineTo(gx + Math.sin(yy * 0.01 + ph) * 2.5, yy); x.stroke();
        }
        x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(p, 0, 2, H); x.fillStyle = 'rgba(255,220,180,.07)'; x.fillRect(p + 2, 0, 1, H);
        [H * 0.08, H * 0.92].forEach(function (ny) { x.fillStyle = '#1c1917'; x.beginPath(); x.arc(p + pw / 2, ny, 2.4, 0, 6.283); x.fill(); x.fillStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.arc(p + pw / 2 - 0.7, ny - 0.7, 0.9, 0, 6.283); x.fill(); });
      }
      var spot = x.createRadialGradient(cx, cy - R * 0.3, R * 0.2, cx, cy, R * 2.1);
      spot.addColorStop(0, 'rgba(255,230,170,.28)'); spot.addColorStop(1, 'rgba(255,230,170,0)'); x.fillStyle = spot; x.fillRect(0, 0, W, H);
      var vg = x.createLinearGradient(0, 0, 0, H); vg.addColorStop(0, 'rgba(0,0,0,.25)'); vg.addColorStop(0.5, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
      x.fillStyle = vg; x.fillRect(0, 0, W, H);
      // тень доски на стене
      x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.arc(cx + 7, cy + 12, R * 1.2, 0, 6.283); x.fill();
      // доска
      BO = R * 1.24; boardOff = mk(BO * 2, BO * 2); var b = boardOff.x; b.translate(BO, BO);
      var rim = b.createRadialGradient(-R * 0.3, -R * 0.4, R * 0.2, 0, 0, R * 1.2); rim.addColorStop(0, '#2a2a2e'); rim.addColorStop(1, '#0a0a0b');
      b.fillStyle = rim; b.beginPath(); b.arc(0, 0, R * 1.18, 0, 6.283); b.fill();
      var mr = b.createLinearGradient(-R, -R, R, R); mr.addColorStop(0, '#e5e7eb'); mr.addColorStop(0.5, '#6b7280'); mr.addColorStop(1, '#d1d5db');
      b.strokeStyle = mr; b.lineWidth = 3; b.beginPath(); b.arc(0, 0, R * 1.18 - 1.5, 0, 6.283); b.stroke();
      for (i = 0; i < 20; i++) {
        var a0 = (i * 18 - 9 - 90) * Math.PI / 180, a1 = (i * 18 + 9 - 90) * Math.PI / 180, dark = i % 2 === 0;
        var rings = [[0.094, 0.582, dark ? '#1c1c1c' : '#efe0bd'], [0.582, 0.629, dark ? '#c81e1e' : '#15803d'], [0.629, 0.953, dark ? '#1c1c1c' : '#efe0bd'], [0.953, 1, dark ? '#c81e1e' : '#15803d']];
        rings.forEach(function (rg) { b.fillStyle = rg[2]; b.beginPath(); b.arc(0, 0, R * rg[1], a0, a1); b.arc(0, 0, R * rg[0], a1, a0, true); b.closePath(); b.fill(); });
      }
      b.fillStyle = '#15803d'; b.beginPath(); b.arc(0, 0, R * 0.094, 0, 6.283); b.fill();
      b.fillStyle = '#c81e1e'; b.beginPath(); b.arc(0, 0, R * 0.037, 0, 6.283); b.fill();
      // волокна сизаля
      b.save(); b.beginPath(); b.arc(0, 0, R, 0, 6.283); b.clip(); b.lineCap = 'round';
      for (i = 0; i < 3200; i++) {
        var ra = rnd() * 6.283, rr2 = Math.sqrt(rnd()) * R, fx0 = Math.cos(ra) * rr2, fy0 = Math.sin(ra) * rr2, fl = 1 + rnd() * 2.2, fa = rnd() * 6.283;
        b.strokeStyle = rnd() < 0.5 ? 'rgba(0,0,0,.16)' : 'rgba(255,255,255,.1)'; b.lineWidth = 0.7;
        b.beginPath(); b.moveTo(fx0, fy0); b.lineTo(fx0 + Math.cos(fa) * fl, fy0 + Math.sin(fa) * fl); b.stroke();
      }
      b.restore();
      // проволока: тень + металл
      function wires(off, col, lw) {
        b.strokeStyle = col; b.lineWidth = lw;
        [0.094, 0.582, 0.629, 0.953, 1].forEach(function (r) { b.beginPath(); b.arc(off, off, R * r, 0, 6.283); b.stroke(); });
        b.beginPath(); b.arc(off, off, R * 0.037, 0, 6.283); b.stroke();
        for (var k = 0; k < 20; k++) {
          var a = (k * 18 - 9 - 90) * Math.PI / 180;
          b.beginPath(); b.moveTo(off + Math.cos(a) * R * 0.094, off + Math.sin(a) * R * 0.094); b.lineTo(off + Math.cos(a) * R, off + Math.sin(a) * R); b.stroke();
        }
      }
      wires(1, 'rgba(0,0,0,.45)', 1.6); wires(0, 'rgba(203,213,225,.9)', 1.1); wires(-0.4, 'rgba(255,255,255,.35)', 0.5);
      // номера на кольце
      b.strokeStyle = 'rgba(203,213,225,.55)'; b.lineWidth = 1; b.beginPath(); b.arc(0, 0, R * 1.005, 0, 6.283); b.stroke();
      b.font = '800 ' + Math.round(R * 0.1) + 'px system-ui, sans-serif'; b.textAlign = 'center'; b.textBaseline = 'middle';
      for (i = 0; i < 20; i++) {
        var am = (i * 18 - 90) * Math.PI / 180, nx = Math.cos(am) * R * 1.09, ny = Math.sin(am) * R * 1.09;
        b.save(); b.translate(nx, ny);
        b.fillStyle = 'rgba(0,0,0,.6)'; b.fillText(String(ORDER[i]), 1, 1.2);
        b.fillStyle = '#f1f5f9'; b.fillText(String(ORDER[i]), 0, 0); b.restore();
      }
      // купол-блик
      var gl = b.createRadialGradient(-R * 0.45, -R * 0.55, 0, -R * 0.2, -R * 0.2, R * 1.3);
      gl.addColorStop(0, 'rgba(255,255,255,.16)'); gl.addColorStop(0.6, 'rgba(255,255,255,.02)'); gl.addColorStop(1, 'rgba(0,0,0,.2)');
      b.fillStyle = gl; b.beginPath(); b.arc(0, 0, R * 1.18, 0, 6.283); b.fill();
      b.fillStyle = 'rgba(255,255,255,.35)'; b.beginPath(); b.arc(-R * 0.012, -R * 0.012, R * 0.015, 0, 6.283); b.fill();
    }
    function scoreAt(x, y) { // нормированные координаты (в радиусах доски)
      var r = Math.hypot(x, y);
      if (r > 1) return { v: 0, m: 0, txt: api.t('darts.miss') };
      if (r < 0.037) return { v: 50, m: 2, txt: 'BULL' };
      if (r < 0.094) return { v: 25, m: 1, txt: '25' };
      var ang = Math.atan2(x, -y) * 180 / Math.PI; if (ang < 0) ang += 360;
      var seg = ORDER[Math.floor(((ang + 9) % 360) / 18)];
      if (r > 0.582 && r < 0.629) return { v: seg * 3, m: 3, txt: 'T' + seg };
      if (r > 0.953) return { v: seg * 2, m: 2, txt: 'D' + seg };
      return { v: seg, m: 1, txt: String(seg) };
    }
    function segCenter(num, ring) { // ring: 1 одинарный, 2 двойной, 3 тройной
      var idx = ORDER.indexOf(num), a = idx * 18 * Math.PI / 180;
      var rr = ring === 3 ? 0.605 : ring === 2 ? 0.976 : 0.78;
      return { x: Math.sin(a) * rr, y: -Math.cos(a) * rr };
    }
    function chooseTarget(rem) {
      if (rem === 50) return { x: 0, y: 0 };
      if (rem <= 20) return segCenter(rem, 1);
      if (rem <= 40 && rem % 2 === 0) return segCenter(rem / 2, 2);
      if (rem <= 60 && rem % 3 === 0) return segCenter(rem / 3, 3);
      if (rem < 60) { // оставить удобный остаток
        for (var n = 20; n >= 1; n--) if (rem - n <= 40 && (rem - n) % 2 === 0) return segCenter(n, 1);
        return segCenter(Math.min(20, rem - 1), 1);
      }
      return segCenter(rem > 160 || Math.random() < 0.7 ? 20 : 19, 3);
    }
    // v2.0: подсказка «добивания» (как закрыть остаток за оставшиеся дротики) и праздник за 180
    var THROWS = (function () {
      var a = [{ v: 50, t: 'BULL' }, { v: 25, t: '25' }];
      for (var n = 20; n >= 1; n--) { a.push({ v: n * 3, t: 'T' + n }); a.push({ v: n * 2, t: 'D' + n }); a.push({ v: n, t: String(n) }); }
      return a.sort(function (x, y) { return y.v - x.v; });
    })();
    var coCache = {};
    function checkout(rem, darts) {
      var key = rem + ':' + darts;
      if (key in coCache) return coCache[key];
      var res = null;
      if (rem <= 0 || darts <= 0) res = null;
      else {
        for (var i = 0; i < THROWS.length && !res; i++) if (THROWS[i].v === rem) res = [THROWS[i].t];
        for (var j = 0; j < THROWS.length && !res && darts > 1; j++) {
          if (THROWS[j].v >= rem) continue;
          var sub = checkout(rem - THROWS[j].v, darts - 1);
          if (sub) res = [THROWS[j].t].concat(sub);
        }
      }
      coCache[key] = res;
      return res;
    }
    function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) / 0.5 * 0.5; }
    function wobble() { var k = D.wob * (1 + (3 - dartsLeft) * 0.15), tt = t + wobPh; return { x: Math.sin(tt * 2.3) * k + Math.sin(tt * 5.1) * k * 0.4, y: Math.cos(tt * 1.9) * k + Math.sin(tt * 4.3) * k * 0.4 }; }
    function throwDart(tx, ty, remote) {
      if (NET && !remote) { // точку попадания считает бросающий; JSON передаёт double без потерь — посадка у обоих одинакова
        nThrow++; api.net.send({ k: 'th', g: netG, i: nThrow, x: tx, y: ty });
      }
      flying = { x: tx, y: ty, t: 0, who: turn, mine: NET && !remote };
      dartsLeft--;
      api.sound('flap');
    }
    function land() {
      var f = flying; flying = null;
      var s = scoreAt(f.x, f.y);
      if (f.mine) setTimeout(function () { sendSync(); }, 0); // после применения итога
      stuck.push({ x: f.x, y: f.y, who: f.who, wob: 0.3 });
      thrown.push(s);
      api.vibrate(15);
      var newLeft = left[turn] - s.v;
      pops.push({ text: s.v ? s.txt + (s.m > 1 && s.v !== 50 ? '' : '') : api.t('darts.miss'), life: 1, big: s.m === 3 || s.v === 50 });
      if (newLeft < 0 || newLeft === 1 && false) {
        left[turn] = turnStart; pops.push({ text: api.t('darts.bust'), life: 1.3, big: true, bad: true });
        api.sound('hit'); endTurn(); return;
      }
      left[turn] = newLeft;
      if (s.v) api.sound(s.m === 3 || s.v >= 50 ? 'coin' : 'stomp');
      if (turn === 0 && api.mode === 0) api.addScore(s.v);
      if (newLeft === 0) {
        phase = 'won'; phaseT = 0; api.sound(NET && turn !== me ? 'hit' : 'win'); api.vibrate(120);
        if (api.mode === 0 && turn === 0) api.addScore(500 * (api.diff + 1) + Math.max(0, 20 - turns) * 40);
        endT = 2.2; return;
      }
      if (s.v === 50) { api.fx.flash('#fde047', 0.25); api.fx.burst(cx, cy, '#fde047', 20, 220); }
      if (thrown.length === 3) {
        var sum = thrown.reduce(function (a, z) { return a + z.v; }, 0);
        if (sum === 180) { api.toast('180!'); api.fx.confetti(90); api.sound('win'); if (turn === 0 && api.mode === 0) api.addScore(300); }
        else if (sum >= 100) api.fx.text(cx, cy - R - 10, sum + '!', '#fde047', 26);
      }
      if (dartsLeft === 0) endTurn();
    }
    function endTurn() { phase = 'switch'; phaseT = 0; }
    function sendSync() {
      if (!NET || !api.net) return;
      api.net.send({ k: 'sy', g: netG, i: nThrow, l: [left[0], left[1]], tu: turn, dl: dartsLeft, ts: turnStart, ph: phase, tr: thrown.map(function (z) { return [z.v, z.m, z.txt]; }), st: stuck.map(function (z) { return [Math.round(z.x * 1e4) / 1e4, Math.round(z.y * 1e4) / 1e4, z.who]; }) });
    }
    function applySync(d) { // авторитетный итог броска соперника: подтянуть счёт (дрейфа быть не должно, но на всякий случай)
      left = [d.l[0], d.l[1]];
      if (d.tu === turn) {
        dartsLeft = d.dl; turnStart = d.ts;
        thrown = d.tr.map(function (z) { return { v: z[0], m: z[1], txt: z[2] }; });
        if (stuck.length === d.st.length) stuck.forEach(function (z, i) { z.x = d.st[i][0]; z.y = d.st[i][1]; });
        if (d.ph === 'won' && phase !== 'won') { phase = 'won'; phaseT = 0; endT = 2.2; }
      }
    }
    function netStep() { // обработать очередь сообщений по порядку, когда сторона готова
      while (netQ.length) {
        var d = netQ[0];
        if (d.k === 'th') {
          if (flying || phase !== 'aim' || turn === me) return; // ещё доигрывается прошлый дротик / смена хода
          netQ.shift(); oppAim = null; throwDart(d.x, d.y, true); return;
        }
        if (d.k === 'sy') { if (flying) return; netQ.shift(); applySync(d); continue; }
        netQ.shift();
      }
    }
    function nextTurn() {
      turn = 1 - turn; dartsLeft = 3; turnStart = left[turn]; thrown = []; stuck = []; phase = 'aim'; aiPlan = null;
      if (turn === 0) turns++;
    }
    function drawBoard(c) {
      if (boardOff) c.drawImage(boardOff, cx - BO, cy - BO, BO * 2, BO * 2);
    }
    function drawDart(c, x, y, sc, col, ang, noShadow) {
      c.save(); c.translate(x, y); c.rotate(ang || -0.6); c.scale(sc, sc);
      if (!noShadow) { c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.moveTo(3, 4); c.lineTo(7, 30); c.lineTo(14, 44); c.lineTo(4, 40); c.closePath(); c.fill(); }
      c.strokeStyle = '#e2e8f0'; c.lineWidth = 1.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0.5); c.lineTo(0, 10); c.stroke(); // игла
      var bg = c.createLinearGradient(-3, 0, 3, 0); bg.addColorStop(0, '#64748b'); bg.addColorStop(0.35, '#f8fafc'); bg.addColorStop(1, '#334155');
      c.fillStyle = bg; c.beginPath(); c.moveTo(-1.6, 10); c.lineTo(1.6, 10); c.lineTo(3, 14); c.lineTo(3, 22); c.lineTo(1.4, 25); c.lineTo(-1.4, 25); c.lineTo(-3, 22); c.lineTo(-3, 14); c.closePath(); c.fill();
      c.fillStyle = 'rgba(15,23,42,.55)'; for (var i = 0; i < 5; i++) c.fillRect(-3, 14 + i * 1.7, 6, 0.7); // насечка
      c.fillStyle = col; c.fillRect(-1, 25, 2, 8); // хвостовик
      c.fillStyle = col; c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 0.8; c.lineJoin = 'round'; // оперение
      c.beginPath(); c.moveTo(0, 28); c.lineTo(-8, 36); c.lineTo(-7, 41); c.lineTo(0, 37); c.lineTo(7, 41); c.lineTo(8, 36); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(0, 29); c.lineTo(-6, 36); c.lineTo(-5, 38.5); c.lineTo(0, 35.5); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.moveTo(0, 28); c.lineTo(0, 38); c.stroke();
      c.restore();
    }

    return {
      reset: function () {
        D = DIFF[api.diff]; layout();
        left = [D.start, D.start]; turn = 1; turns = 0; t = 0; pops = []; endT = 0; flying = null; aim = null; aiming = false;
        NET = api.mode === 2 && !!api.net; me = NET && !api.net.host ? 1 : 0; netQ = []; oppAim = null; aimT = 0; nThrow = 0;
        netG = NET ? (api.net.seed || 0) % 100000 : 0;
        wobPh = NET ? ((api.net.seed || 0) % 1000) / 37 : 0; // общий сдвиг фазы колебаний прицела
        nextTurn();
      },
      netMsg: function (d) {
        if (!d || d.g !== netG) return;
        if (d.k === 'a') { oppAim = d.h ? null : { x: d.x, y: d.y }; return; }
        if (d.k === 'th' || d.k === 'sy') netQ.push(d);
      },
      resize: layout,
      idle: function (dt) { t += dt; },
      key: function () { },
      input: function (type, d) {
        if (phase !== 'aim' || flying || (api.mode === 0 && turn === 1) || !myTurn()) return;
        var nx = (d.x - cx) / R, ny = (d.y - 70 - cy) / R; // прицел чуть выше пальца
        if (type === 'down') { aiming = true; aim = { x: nx, y: ny }; }
        else if (type === 'move' && aiming) aim = { x: nx, y: ny };
        else if (type === 'up' && aiming) {
          aiming = false;
          var w = wobble();
          if (NET) api.net.sendFast({ k: 'a', g: netG, h: 1 });
          throwDart(aim.x + w.x, aim.y + w.y);
          aim = null;
        }
      },
      update: function (dt) {
        t += dt; phaseT += dt;
        pops = pops.filter(function (p) { p.life -= dt; return p.life > 0; });
        stuck.forEach(function (s) { if (s.wob > 0) s.wob -= dt; });
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (NET) {
          netStep();
          if (aim && aiming && myTurn()) { aimT -= dt; if (aimT <= 0) { aimT = 0.06; var wv = wobble(); api.net.sendFast({ k: 'a', g: netG, x: Math.round((aim.x + wv.x) * 1000) / 1000, y: Math.round((aim.y + wv.y) * 1000) / 1000 }); } }
          if (oppAim && oppAim.dx !== undefined) { oppAim.dx += (oppAim.x - oppAim.dx) * Math.min(1, dt * 12); oppAim.dy += (oppAim.y - oppAim.dy) * Math.min(1, dt * 12); }
          else if (oppAim) { oppAim.dx = oppAim.x; oppAim.dy = oppAim.y; }
        }
        if (flying) { flying.t += dt / 0.28; if (flying.t >= 1) land(); return; }
        if (phase === 'switch') { if (phaseT > 1.2) nextTurn(); return; }
        if (phase === 'aim' && api.mode === 0 && turn === 1) {
          if (!aiPlan) { var tg = chooseTarget(left[1]); aiPlan = { tg: tg, cur: { x: (Math.random() - 0.5) * 1.4, y: 0.9 }, t: 0 }; }
          aiPlan.t += dt;
          aiPlan.cur.x += (aiPlan.tg.x - aiPlan.cur.x) * Math.min(1, dt * 4);
          aiPlan.cur.y += (aiPlan.tg.y - aiPlan.cur.y) * Math.min(1, dt * 4);
          if (aiPlan.t > 0.9) {
            throwDart(aiPlan.tg.x + gauss() * D.ai, aiPlan.tg.y + gauss() * D.ai);
            aiPlan = null;
          }
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        if (bgOff) c.drawImage(bgOff, 0, 0, W, H);
        // табло
        var two = api.mode === 1, names = two ? [api.t('g.p1'), api.t('g.p2')] : NET ? (me === 0 ? [api.t('g.you'), api.t('net.opp')] : [api.t('net.opp'), api.t('g.you')]) : [api.t('g.you'), api.t('g.cpu')], cols = ['#22d3ee', '#f472b6'];
        for (var s = 0; s < 2; s++) {
          var x = s === 0 ? 14 : W / 2 + 7, act = turn === s;
          c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.roundRect ? c.roundRect(x + 2, 13, W / 2 - 21, 78, 16) : c.rect(x + 2, 13, W / 2 - 21, 78); c.fill();
          var pg = c.createLinearGradient(0, 10, 0, 88); pg.addColorStop(0, act ? '#2b3a2f' : '#1f2420'); pg.addColorStop(1, act ? '#17221a' : '#121513');
          c.fillStyle = pg; c.beginPath(); c.roundRect ? c.roundRect(x, 10, W / 2 - 21, 78, 16) : c.rect(x, 10, W / 2 - 21, 78); c.fill();
          c.strokeStyle = act ? cols[s] : 'rgba(180,140,90,.45)'; c.lineWidth = act ? 2.5 : 2; c.stroke();
          c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(x + 10, 12, W / 2 - 41, 2);
          c.textAlign = 'left'; c.textBaseline = 'middle';
          c.fillStyle = cols[s]; c.font = '800 12px system-ui, sans-serif'; c.fillText(names[s], x + 12, 26);
          c.fillStyle = '#fff'; c.font = '900 34px system-ui, sans-serif'; c.fillText(String(left[s]), x + 12, 58);
          if (act) for (var dd = 0; dd < 3; dd++) drawDart(c, x + W / 2 - 50 + dd * 11, 30, 0.55, dd < dartsLeft ? cols[s] : 'rgba(255,255,255,.2)', 0.5);
        }
        drawBoard(c);
        stuck.forEach(function (sd) {
          var wob = sd.wob > 0 ? Math.sin(sd.wob * 60) * sd.wob * 0.3 : 0;
          drawDart(c, cx + sd.x * R, cy + sd.y * R, 1, cols[sd.who], -0.6 + wob);
        });
        if (flying) {
          var k = flying.t, sc = 2.6 - 1.6 * k;
          var sx = cx + flying.x * R * k + (1 - k) * 40, sy = cy + flying.y * R * k + (1 - k) * (H - cy);
          if (api.quality > 0) { c.strokeStyle = 'rgba(255,255,255,' + (0.25 * (1 - k)).toFixed(3) + ')'; c.lineWidth = 2; c.beginPath(); for (var tl = 0; tl < 3; tl++) { c.moveTo(sx + 10 * sc + tl * 6, sy + 30 * sc); c.lineTo(sx + 26 * sc + tl * 6, sy + 70 * sc); } c.stroke(); }
          drawDart(c, sx, sy, sc, cols[flying.who], -0.6);
        }
        // прицел
        var aimP = aim ? { x: aim.x + wobble().x, y: aim.y + wobble().y } : (aiPlan ? aiPlan.cur : (NET && !myTurn() && oppAim && !flying && oppAim.dx !== undefined ? { x: oppAim.dx, y: oppAim.dy } : null));
        if (aimP && phase === 'aim') {
          var ax = cx + aimP.x * R, ay = cy + aimP.y * R;
          c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 4.5;
          c.beginPath(); c.arc(ax, ay, 12, 0, 6.283); c.moveTo(ax - 20, ay); c.lineTo(ax - 6, ay); c.moveTo(ax + 6, ay); c.lineTo(ax + 20, ay);
          c.moveTo(ax, ay - 20); c.lineTo(ax, ay - 6); c.moveTo(ax, ay + 6); c.lineTo(ax, ay + 20); c.stroke();
          c.fillStyle = turn === 0 ? '#22d3ee' : '#f472b6'; c.beginPath(); c.arc(ax, ay, 2, 0, 6.283); c.fill();
          c.strokeStyle = turn === 0 ? '#22d3ee' : '#f472b6'; c.lineWidth = 2.5;
          c.beginPath(); c.arc(ax, ay, 12, 0, 6.283); c.moveTo(ax - 20, ay); c.lineTo(ax - 6, ay); c.moveTo(ax + 6, ay); c.lineTo(ax + 20, ay);
          c.moveTo(ax, ay - 20); c.lineTo(ax, ay - 6); c.moveTo(ax, ay + 6); c.lineTo(ax, ay + 20); c.stroke();
          var sc2 = scoreAt(aimP.x, aimP.y);
          c.fillStyle = '#fff'; c.font = '800 13px system-ui, sans-serif'; c.textAlign = 'center';
          c.fillText(sc2.v ? sc2.txt : '', ax, ay - 30);
        }
        // броски хода
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '800 16px system-ui, sans-serif';
        var row = thrown.map(function (z) { return z.v ? z.txt : '—'; }).join('   ');
        var tot = thrown.reduce(function (a, z) { return a + z.v; }, 0);
        c.fillStyle = 'rgba(255,255,255,.85)';
        c.fillText(row + (thrown.length ? '   = ' + tot : ''), W / 2, Math.min(H - 54, cy + R * 1.18 + 26));
        var msg = phase === 'won' ? (two ? api.t(turn === 0 ? 'g.p1win' : 'g.p2win') : api.t(turn === me ? 'g.win' : 'g.lose'))
          : (api.mode === 0 && turn === 1) ? api.t('g.cpuTurn') : NET ? api.t(turn === me ? 'g.yourTurn' : oppAim && api.t('darts.oppAim') !== 'darts.oppAim' ? 'darts.oppAim' : 'net.oppTurn') + (turn === me ? ' · ' + api.t('darts.aim') : '') : api.t('darts.aim');
        c.fillStyle = phase === 'won' ? '#fde047' : 'rgba(255,255,255,.6)'; c.font = (phase === 'won' ? '900 26px' : '700 13px') + ' system-ui, sans-serif';
        c.fillText(msg, W / 2, H - 24);
        // подсказка добивания для игрока
        if (phase === 'aim' && !(api.mode === 0 && turn === 1) && myTurn() && api.diff <= 2 && left[turn] <= 170) {
          var co = checkout(left[turn], dartsLeft);
          if (co) {
            c.font = '800 13px system-ui, sans-serif'; c.fillStyle = '#86efac';
            c.fillText('💡 ' + api.t('darts.out') + ': ' + co.join(' · '), W / 2, Math.min(H - 54, cy + R * 1.18 + 26) + 22);
          }
        }
        pops.forEach(function (pp, i) {
          c.globalAlpha = Math.min(1, pp.life * 2);
          c.font = '900 ' + (pp.big ? 34 : 24) + 'px system-ui, sans-serif';
          c.lineWidth = 5; c.lineJoin = 'round'; c.strokeStyle = 'rgba(0,0,0,.6)';
          var yy = cy - R * 0.2 - (1 - pp.life) * 40 - i * 34;
          c.strokeText(pp.text, W / 2, yy); c.fillStyle = pp.bad ? '#f87171' : pp.big ? '#fde047' : '#fff'; c.fillText(pp.text, W / 2, yy);
        });
        c.globalAlpha = 1;
      }
    };
  }
};
