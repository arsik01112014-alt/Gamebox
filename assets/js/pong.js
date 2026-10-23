/* Pong — против компьютера, вдвоём на одном экране и по сети (хост ведёт симуляцию) */
window.GAMES = window.GAMES || {};
window.GAMES.pong = {
  title: 'Pong',
  colors: ['#0891b2', '#e11d48'],
  controls: 'none',
  modes: true,
  lan: true,
  multiTouch: true,
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="pgbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b0d2e"/><stop offset=".5" stop-color="#020617"/><stop offset="1" stop-color="#062a35"/></linearGradient><radialGradient id="pgball" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#bae6fd"/></radialGradient></defs><rect x="8" y="8" width="84" height="84" rx="14" fill="url(#pgbg)"/><g stroke="#a78bfa" stroke-width=".8" opacity=".35"><path d="M50 50 L20 92 M50 50 L35 92 M50 50 L65 92 M50 50 L80 92 M50 50 L20 8 M50 50 L35 8 M50 50 L65 8 M50 50 L80 8"/><path d="M8 66 H92 M8 80 H92 M8 34 H92 M8 20 H92"/></g><path d="M10 50 H90" stroke="#fff" stroke-width="2" stroke-dasharray="5 5" opacity=".6"/><circle cx="50" cy="50" r="12" fill="none" stroke="#c4b5fd" stroke-width="1.5" opacity=".5"/><rect x="26" y="13" width="40" height="10" rx="5" fill="#f472b6" opacity=".35"/><rect x="29" y="15" width="34" height="7" rx="3.5" fill="#f472b6"/><rect x="33" y="16" width="26" height="1.6" rx=".8" fill="#fff" opacity=".7"/><rect x="34" y="77" width="40" height="10" rx="5" fill="#22d3ee" opacity=".35"/><rect x="37" y="78" width="34" height="7" rx="3.5" fill="#22d3ee"/><rect x="41" y="79" width="26" height="1.6" rx=".8" fill="#fff" opacity=".7"/><circle cx="46" cy="38" r="2.5" fill="#f472b6" opacity=".3"/><circle cx="52" cy="47" r="4" fill="#f472b6" opacity=".45"/><circle cx="60" cy="58" r="11" fill="#fff" opacity=".12"/><circle cx="60" cy="58" r="6" fill="url(#pgball)"/></svg>',

  create: function (api) {
    var WIN = 7;
    var DIFF = [
      { ai: 230, err: 60, react: 0.28, ball: 300 },
      { ai: 380, err: 32, react: 0.16, ball: 360 },
      { ai: 540, err: 16, react: 0.09, ball: 420 },
      { ai: 760, err: 6, react: 0.03, ball: 480 }
    ];
    var D, s, me, op, ball, trail, sc, phase, phaseT, two, parts, shake, t, aiTarget, aiT, hits, serveDir, keys, rally, flash;
    // v2.0: подкрутка мяча (движение ракетки при ударе) и бонусы в центре поля
    var orb = null, orbT = 6, lastHit = null;
    var ORBS = { wide: '#4ade80', shrink: '#f87171', fire: '#fb923c' };

    // v3: предрендер арены и спрайта свечения
    var courtCv = null, courtKey = '', glowCv = null;
    function mk(w, h) {
      var dpr = Math.min(2, window.devicePixelRatio || 1), o = document.createElement('canvas');
      o.width = Math.max(1, Math.ceil(w * dpr)); o.height = Math.max(1, Math.ceil(h * dpr));
      var oc = o.getContext('2d'); oc.scale(dpr, dpr); return { cv: o, c: oc };
    }
    function buildCourt() {
      var W = api.W, H = api.H, m = mk(W, H), o = m.c, i;
      courtKey = W + 'x' + H + ':' + s;
      o.fillStyle = '#020617'; o.fillRect(0, 0, W, H);
      var g1 = o.createLinearGradient(0, 0, 0, H);
      g1.addColorStop(0, 'rgba(244,114,182,.22)'); g1.addColorStop(0.42, 'rgba(76,29,149,.10)'); g1.addColorStop(0.5, 'rgba(2,6,23,0)');
      g1.addColorStop(0.58, 'rgba(14,116,144,.10)'); g1.addColorStop(1, 'rgba(34,211,238,.22)');
      o.fillStyle = g1; o.fillRect(0, 0, W, H);
      // перспективная сетка к центру (синтвейв)
      o.lineWidth = 1;
      for (var half = 0; half < 2; half++) {
        var dir = half ? 1 : -1, y0 = H / 2, col = half ? '34,211,238' : '244,114,182';
        for (i = -8; i <= 8; i++) {
          o.strokeStyle = 'rgba(' + col + ',.10)';
          o.beginPath(); o.moveTo(W / 2 + i * W * 0.03, y0); o.lineTo(W / 2 + i * W * 0.16, half ? H : 0); o.stroke();
        }
        for (i = 1; i < 12; i++) {
          var k = Math.pow(i / 11, 1.8), yy = y0 + dir * k * H / 2;
          o.strokeStyle = 'rgba(' + col + ',' + (0.04 + 0.12 * k) + ')';
          o.beginPath(); o.moveTo(0, yy); o.lineTo(W, yy); o.stroke();
        }
      }
      // боковые неоновые борта
      var gy = o.createLinearGradient(0, 0, 0, H);
      gy.addColorStop(0, '#f472b6'); gy.addColorStop(0.5, 'rgba(167,139,250,.6)'); gy.addColorStop(1, '#22d3ee');
      o.save(); o.strokeStyle = gy; o.lineWidth = 2; o.shadowColor = '#a78bfa'; o.shadowBlur = 12;
      o.beginPath(); o.moveTo(2, 0); o.lineTo(2, H); o.moveTo(W - 2, 0); o.lineTo(W - 2, H); o.stroke(); o.restore();
      // зоны ворот
      var gt = o.createLinearGradient(0, 0, 0, 70 * s); gt.addColorStop(0, 'rgba(244,114,182,.28)'); gt.addColorStop(1, 'rgba(244,114,182,0)');
      o.fillStyle = gt; o.fillRect(0, 0, W, 70 * s);
      var gb = o.createLinearGradient(0, H, 0, H - 70 * s); gb.addColorStop(0, 'rgba(34,211,238,.28)'); gb.addColorStop(1, 'rgba(34,211,238,0)');
      o.fillStyle = gb; o.fillRect(0, H - 70 * s, W, 70 * s);
      // центральная линия и круг с неоном
      o.save(); o.shadowColor = '#c4b5fd'; o.shadowBlur = 10;
      o.setLineDash([10 * s, 10 * s]); o.strokeStyle = 'rgba(255,255,255,.45)'; o.lineWidth = 3 * s;
      o.beginPath(); o.moveTo(0, H / 2); o.lineTo(W, H / 2); o.stroke(); o.setLineDash([]);
      o.strokeStyle = 'rgba(196,181,253,.35)'; o.lineWidth = 2 * s; o.beginPath(); o.arc(W / 2, H / 2, 60 * s, 0, 6.283); o.stroke();
      o.restore();
      o.fillStyle = 'rgba(196,181,253,.5)'; o.beginPath(); o.arc(W / 2, H / 2, 4 * s, 0, 6.283); o.fill();
      var v = o.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)');
      o.fillStyle = v; o.fillRect(0, 0, W, H);
      courtCv = m.cv;
      var G = 64, gm = mk(G, G), q = gm.c, gg = q.createRadialGradient(G / 2, G / 2, 0, G / 2, G / 2, G / 2);
      gg.addColorStop(0, 'rgba(255,255,255,.9)'); gg.addColorStop(0.25, 'rgba(255,255,255,.35)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
      q.fillStyle = gg; q.fillRect(0, 0, G, G); glowCv = gm.cv;
    }
    function reset2() {
      ball = { x: api.W / 2, y: api.H / 2, vx: 0, vy: 0, r: 8 * s, sp: D.ball * s, spin: 0, fire: false };
      trail = []; rally = 0;
      phase = 'serve'; phaseT = 0;
    }
    function serve() {
      var a = (Math.random() - 0.5) * 0.9;
      ball.vx = Math.sin(a) * ball.sp; ball.vy = Math.cos(a) * ball.sp * serveDir;
      phase = 'play';
    }
    function burst(x, y, col, n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.283, v = (60 + Math.random() * 240) * s;
        parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.3, col: col });
      }
    }
    function paddleHit(p, dirY) {
      var off = Math.max(-1, Math.min(1, (ball.x - p.x) / (p.w / 2)));
      ball.sp = Math.min(ball.sp * 1.06, 1100 * s);
      var a = off * 1.0;
      if (ball.fire) { ball.fire = false; ball.sp = Math.max(ball.sp / 1.4, D.ball * s); }
      if (p.fireNext) { p.fireNext = false; ball.fire = true; ball.sp = Math.min(ball.sp * 1.4, 1300 * s); api.fx.shake(4); }
      ball.vx = Math.sin(a) * ball.sp + p.vx * 0.15;
      ball.vy = Math.cos(a) * ball.sp * dirY;
      ball.spin = Math.max(-1, Math.min(1, p.vx / (900 * s))) * 520 * s;
      p.flash = 0.2; rally++; lastHit = p;
      if (rally % 10 === 0) api.fx.text(api.W / 2, api.H / 2, api.t('pong.rally', rally), '#fde047', 20);
      burst(ball.x, ball.y, p.col, 10);
      api.sound('stomp'); api.vibrate(12);
    }
    function point(bottomScored) {
      if (bottomScored) { sc[0]++; api.addScore(100 + rally * 5); serveDir = -1; }
      else { sc[1]++; serveDir = 1; }
      shake = 0.35; flash = 0.3;
      burst(ball.x, ball.y < api.H / 2 ? 0 : api.H, bottomScored ? '#22d3ee' : '#f472b6', 30);
      api.sound(bottomScored ? 'point' : 'hit'); api.vibrate(bottomScored ? 40 : 120);
      var fin = sc[0] >= WIN || sc[1] >= WIN;
      if (NET) { api.net.send({ k: 'pt', g: NET.g, b: bottomScored ? 1 : 0, sc: sc.slice(), e: fin ? 1 : 0 }); NET.force = true; NET.pendT = 0; }
      if (fin) {
        phase = 'end'; phaseT = 0;
        if (sc[0] >= WIN) { api.addScore(500 + (WIN - sc[1]) * 50 * (api.diff + 1)); api.sound('win'); }
        return;
      }
      reset2();
    }

    /* ---------- сеть: хост считает всё, гость шлёт положение своей ракетки и свои отбивания ----------
       Координаты — доли экрана хоста (0..1); гость видит поле повёрнутым на 180° (своя ракетка внизу).
       Отбивание гость обнаруживает сам (без задержки) и передаёт хосту готовое состояние мяча;
       хост принимает его, промотав вперёд на время в пути. Пока хост не подтвердил — гость не принимает поправки. */
    var NET = null, ORBK = ['wide', 'shrink', 'fire'];
    function r4(v) { return Math.round(v * 1e4) / 1e4; }
    function nowMs() { return performance.now(); }
    function netInit() {
      NET = api.mode === 2 && api.net ? {
        host: !!api.net.host, g: (api.net.seed || 0) % 99991, seq: 0, lastQ: 0, sendT: 0, force: true, pingT: 0, pings: 0,
        rtt: 0.16, samp: [], off: null, lastHit: 0, hitN: 0, myHit: null, pendT: 0, lastPt: 0, om: null, omT: 0, ro: { x: 0, y: 0 }, rally: 0
      } : null;
    }
    function guest() { return NET && !NET.host; }
    function hostNow() { return NET && NET.off !== null ? nowMs() + NET.off : null; }
    // шаг мяча без ракеток (только боковые стенки и подкрутка); pad — ракетка соперника сверху (для предсказания отскока)
    function ballStep(b, h, pad) {
      b.vx += b.spin * h; b.spin *= Math.pow(0.35, h);
      b.x += b.vx * h; b.y += b.vy * h;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); }
      if (b.x > api.W - b.r) { b.x = api.W - b.r; b.vx = -Math.abs(b.vx); }
      if (pad && b.vy < 0 && b.y - b.r <= pad.y + pad.h && b.y + b.r >= pad.y && Math.abs(b.x - pad.x) < pad.w / 2 + b.r) {
        b.y = pad.y + pad.h + b.r; reflect(b, pad, 1); return 1;
      }
      if (b.y < -b.r * 4 || b.y > api.H + b.r * 4) { b.vx = 0; b.vy = 0; b.spin = 0; }
      return 0;
    }
    function reflect(b, p, dirY) {
      var off = Math.max(-1, Math.min(1, (b.x - p.x) / (p.w / 2)));
      b.sp = Math.min(b.sp * 1.06, 1100 * s);
      if (b.fire) { b.fire = false; b.sp = Math.max(b.sp / 1.4, D.ball * s); }
      if (p.fireNext) { b.fire = true; b.sp = Math.min(b.sp * 1.4, 1300 * s); }
      b.vx = Math.sin(off) * b.sp + p.vx * 0.15; b.vy = Math.cos(off) * b.sp * dirY;
      b.spin = Math.max(-1, Math.min(1, p.vx / (900 * s))) * 520 * s;
    }
    function advance(b, sec, pad) {
      sec = Math.max(0, Math.min(0.45, sec));
      while (sec > 1e-4) { var h = Math.min(1 / 240, sec); if (pad) pad.x += pad.vx * h; if (ballStep(b, h, pad)) pad = null; sec -= h; }
      return b;
    }
    function ballMsg() { return [r4(ball.x / api.W), r4(ball.y / api.H), r4(ball.vx / api.W), r4(ball.vy / api.H), r4(ball.spin / api.W), Math.round(ball.sp / s), ball.fire ? 1 : 0]; }
    function snapMsg() {
      return { k: 'st', g: NET.g, q: ++NET.seq, t: Math.round(nowMs()), b: ballMsg(),
        m: [r4(me.x / api.W), r4(me.vx / api.W), r4(me.w / api.W), me.fireNext ? 1 : 0], o: [r4(op.w / api.W), op.fireNext ? 1 : 0],
        sc: sc.slice(), ph: phase === 'serve' ? 0 : phase === 'play' ? 1 : 2, ah: NET.lastHit, r: rally,
        ob: orb ? [ORBK.indexOf(orb.k), r4(orb.x / api.W), r4(orb.y / api.H)] : 0 };
    }
    function hostNet(dt) {
      NET.sendT -= dt;
      if (NET.sendT <= 0 || NET.force) { NET.sendT = 0.05; NET.force = false; api.net.sendFast(snapMsg()); }
    }
    function applyGuestHit(h) {
      NET.lastHit = h.i; NET.force = true;
      if (phase !== 'play') return;
      var ox = ball.x, oy = ball.y;
      ball.x = h.b[0] * api.W; ball.y = h.b[1] * api.H; ball.vx = h.b[2] * api.W; ball.vy = h.b[3] * api.H; ball.spin = h.b[4] * api.W; ball.sp = h.b[5] * s; ball.fire = !!h.b[6];
      if (h.f) op.fireNext = false;
      advance(ball, (nowMs() - h.t) / 1000);
      NET.pendT = 0; NET.ro.x += ox - ball.x; NET.ro.y += oy - ball.y; trail = [];
      op.flash = 0.2; rally++; lastHit = op;
      if (rally % 10 === 0) api.fx.text(api.W / 2, api.H / 2, api.t('pong.rally', rally), '#fde047', 20);
      burst(ball.x, ball.y, op.col, 10); api.sound('stomp');
    }
    function guestPing(dt) {
      NET.pingT -= dt;
      if (NET.pingT <= 0) { NET.pingT = NET.pings < 5 ? 0.3 : 1.5; NET.pings++; api.net.send({ k: 'pg', t: Math.round(nowMs() * 10) / 10 }); }
    }
    function guestSendInput(dt) {
      NET.sendT -= dt;
      if (NET.sendT > 0 && !NET.force) return;
      NET.sendT = 0.05; NET.force = false;
      var o = { k: 'in', g: NET.g, x: r4(1 - me.x / api.W), v: r4(-me.vx / api.W), r: Math.round(NET.rtt * 1000) };
      if (NET.myHit) o.h = NET.myHit.h;
      api.net.sendFast(o);
    }
    function mirrorBall(a) { return { x: (1 - a[0]) * api.W, y: (1 - a[1]) * api.H, vx: -a[2] * api.W, vy: -a[3] * api.H, spin: -a[4] * api.W, sp: a[5] * s, fire: !!a[6], r: ball.r }; }
    function setBall(p) { ball.x = p.x; ball.y = p.y; ball.vx = p.vx; ball.vy = p.vy; ball.spin = p.spin; ball.sp = p.sp; ball.fire = p.fire; }
    function guestUpdate(dt) {
      guestPing(dt);
      me.tx = Math.max(me.w / 2, Math.min(api.W - me.w / 2, me.tx));
      var nx = me.x + (me.tx - me.x) * Math.min(1, dt * 20);
      me.vx = (nx - me.x) / Math.max(dt, 1e-4); me.x = nx;
      if (NET.om) {
        var age = Math.min(0.12, (nowMs() - NET.omT) / 1000 + 0.03), tx = NET.om[0] + NET.om[1] * age;
        tx = Math.max(op.w / 2, Math.min(api.W - op.w / 2, tx));
        var ox = op.x + (tx - op.x) * Math.min(1, dt * 18);
        op.vx = (ox - op.x) / Math.max(dt, 1e-4); op.x = ox;
      }
      if (me.flash > 0) me.flash -= dt; if (op.flash > 0) op.flash -= dt;
      phaseT += dt;
      if (NET.myHit && nowMs() - NET.myHit.at > 900) NET.myHit = null;
      if (phase === 'end') { if (phaseT > 1.6) { phase = 'done'; api.gameOver(); } guestSendInput(dt); return; }
      if (phase === 'serve') { ball.x = api.W / 2; ball.y = api.H / 2; }
      if (phase === 'play') {
        var n = Math.ceil(Math.max(ball.sp, Math.hypot(ball.vx, ball.vy)) * dt / (ball.r * 0.6)), hitNow = false;
        for (var i = 0; i < n; i++) {
          var h = dt / n;
          if (ballStep(ball, h, NET.myHit ? null : op)) { op.flash = 0.2; api.sound('stomp'); burst(ball.x, ball.y, op.col, 10); }
          if (ball.vy > 0 && ball.y + ball.r >= me.y && ball.y - ball.r <= me.y + me.h && Math.abs(ball.x - me.x) < me.w / 2 + ball.r) {
            ball.y = me.y - ball.r; var hadFire = me.fireNext; paddleHit(me, -1); hitNow = { f: hadFire ? 1 : 0 };
          }
        }
        var c = 1 - Math.exp(-dt * 10);
        ball.x += NET.ro.x * c; ball.y += NET.ro.y * c; NET.ro.x -= NET.ro.x * c; NET.ro.y -= NET.ro.y * c;
        if (hitNow) {
          var ht = hostNow();
          NET.myHit = { at: nowMs(), h: { i: ++NET.hitN, f: hitNow.f, t: ht === null ? Math.round(nowMs()) : Math.round(ht),
            b: [r4(1 - ball.x / api.W), r4(1 - ball.y / api.H), r4(-ball.vx / api.W), r4(-ball.vy / api.H), r4(-ball.spin / api.W), Math.round(ball.sp / s), ball.fire ? 1 : 0] } };
          NET.force = true; NET.ro.x = 0; NET.ro.y = 0;
        }
        trail.push({ x: ball.x, y: ball.y }); if (trail.length > 12) trail.shift();
      }
      guestSendInput(dt);
    }
    function guestSnap(d) {
      if (d.q <= NET.lastQ) return;
      NET.lastQ = d.q;
      var total = d.sc[0] + d.sc[1];
      if (total >= NET.lastPt) sc = [d.sc[1], d.sc[0]];
      NET.om = [(1 - d.m[0]) * api.W, -d.m[1] * api.W]; NET.omT = nowMs();
      op.w = d.m[2] * api.W; op.fireNext = !!d.m[3]; me.w = d.o[0] * api.W; me.fireNext = !!d.o[1];
      orb = d.ob ? { k: ORBK[d.ob[0]], x: (1 - d.ob[1]) * api.W, y: (1 - d.ob[2]) * api.H, life: 1 } : null;
      if (NET.myHit && d.ah >= NET.myHit.h.i) NET.myHit = null;
      if (phase === 'end' || phase === 'done' || total < NET.lastPt) return;
      rally = d.r;
      var ph = d.ph === 0 ? 'serve' : d.ph === 1 ? 'play' : 'end', ht = hostNow();
      var age = ht === null ? 0.08 : (ht - d.t) / 1000;
      var pad = { x: (1 - d.m[0]) * api.W, vx: -d.m[1] * api.W, y: op.y, h: op.h, w: op.w, fireNext: op.fireNext };
      var p = advance(mirrorBall(d.b), age, pad);
      if (ph !== phase) {
        phase = ph; phaseT = 0;
        if (ph === 'play') { setBall(p); NET.ro.x = 0; NET.ro.y = 0; trail = []; NET.myHit = null; }
        return;
      }
      if (ph !== 'play' || NET.myHit) return;
      var ex = p.x - ball.x, ey = p.y - ball.y;
      ball.vx = p.vx; ball.vy = p.vy; ball.spin = p.spin; ball.sp = p.sp; ball.fire = p.fire;
      if (Math.hypot(ex, ey) > api.H * 0.3) { setBall(p); NET.ro.x = 0; NET.ro.y = 0; trail = []; }
      else { NET.ro.x = ex; NET.ro.y = ey; }
    }
    function guestPoint(d) {
      var total = d.sc[0] + d.sc[1];
      if (total <= NET.lastPt) return;
      NET.lastPt = total; sc = [d.sc[1], d.sc[0]];
      var mine = !d.b;
      shake = 0.35; flash = 0.3;
      burst(ball.x, ball.y < api.H / 2 ? 0 : api.H, mine ? '#22d3ee' : '#f472b6', 30);
      api.sound(mine ? 'point' : 'hit'); api.vibrate(mine ? 40 : 120);
      NET.myHit = null; NET.ro.x = 0; NET.ro.y = 0;
      if (d.e) { if (phase !== 'end' && phase !== 'done') { phase = 'end'; phaseT = 0; } if (sc[0] >= WIN) api.sound('win'); }
      else { ball.x = api.W / 2; ball.y = api.H / 2; ball.vx = 0; ball.vy = 0; ball.spin = 0; ball.fire = false; trail = []; rally = 0; if (phase !== 'serve') { phase = 'serve'; phaseT = 0; } }
    }
    function guestOrb(d) {
      var col = ORBS[d.o] || '#fff', x = (1 - d.x) * api.W, y = (1 - d.y) * api.H;
      api.sound('bonus'); api.fx.burst(x, y, col, 16, 180);
      api.fx.text(x, y - 20 * s, api.t('pong.' + d.o), col, 16);
      orb = null;
    }

    return {
      reset: function () {
        D = DIFF[api.diff];
        s = Math.min(api.W / 400, api.H / 700) * 1.1;
        var pw = 84 * s;
        me = { x: api.W / 2, y: api.H - 46 * s, w: pw, h: 14 * s, tx: api.W / 2, vx: 0, col: '#22d3ee', flash: 0 };
        op = { x: api.W / 2, y: 46 * s, w: pw, h: 14 * s, tx: api.W / 2, vx: 0, col: '#f472b6', flash: 0 };
        sc = [0, 0]; two = false; parts = []; shake = 0; t = 0; aiTarget = api.W / 2; aiT = 0; hits = 0; serveDir = 1; keys = {}; flash = 0;
        orb = null; orbT = 6; lastHit = null;
        two = api.mode === 1;
        reset2();
        netInit();
      },
      // для тестов: мяч в долях экрана хоста
      dbg: function () { var gs = guest(); return { game: 'pong', ball: gs ? [1 - ball.x / api.W, 1 - ball.y / api.H] : [ball.x / api.W, ball.y / api.H], sc: sc.slice(), phase: phase === 'serve' ? 'serve' : phase, rtt: NET && NET.rtt }; },
      netMsg: function (d) {
        if (!NET || !d) return;
        if (NET.host) {
          if (d.k === 'pg') api.net.send({ k: 'po', t: d.t, h: Math.round(nowMs() * 10) / 10 });
          else if (d.k === 'in' && d.g === NET.g) {
            op.tx = d.x * api.W + d.v * api.W * 0.03;
            if (d.r) NET.rtt = Math.max(0.01, Math.min(1, d.r / 1000));
            if (d.h && d.h.i > NET.lastHit) applyGuestHit(d.h);
          }
        } else {
          if (d.k === 'po') {
            var rtt = nowMs() - d.t;
            NET.samp.push({ r: rtt, o: d.h + rtt / 2 - nowMs() }); if (NET.samp.length > 8) NET.samp.shift();
            var b = NET.samp[0]; NET.samp.forEach(function (x) { if (x.r < b.r) b = x; });
            NET.off = b.o; NET.rtt = NET.rtt * 0.6 + rtt / 1000 * 0.4;
          } else if (d.g !== NET.g) return;
          else if (d.k === 'st') guestSnap(d);
          else if (d.k === 'pt') guestPoint(d);
          else if (d.k === 'ob') guestOrb(d);
        }
      },
      idle: function (dt) { t += dt; },
      key: function (k, down) { keys[k] = down; },
      input: function (type, d) {
        if (type === 'multi') {
          d.forEach(function (p) {
            if (p.y > api.H / 2) me.tx = p.x;
            else if (two) op.tx = p.x;
          });
        }
      },
      update: function (dt) {
        t += dt;
        if (shake > 0) shake -= dt;
        if (flash > 0) flash -= dt;
        parts = parts.filter(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94; p.life -= dt; return p.life > 0; });
        if (keys.left) me.tx = me.x - 900 * s * dt * 3;
        if (keys.right) me.tx = me.x + 900 * s * dt * 3;
        if (NET) {
          if (!NET.host) { guestUpdate(dt); return; }
          var c0 = 1 - Math.exp(-dt * 12); NET.ro.x -= NET.ro.x * c0; NET.ro.y -= NET.ro.y * c0;
          hostNet(dt);
        }
        // ИИ
        if (api.mode === 0) {
          aiT -= dt;
          if (aiT <= 0) {
            aiT = D.react;
            var tx = api.W / 2;
            if (ball.vy < 0 && phase === 'play') {
              // предсказание с учётом отскоков от стен
              var ty = (op.y + op.h) - ball.y, time = ty / ball.vy, px = ball.x + ball.vx * time;
              var L = ball.r, R = api.W - ball.r, span = R - L;
              var m = ((px - L) % (2 * span) + 2 * span) % (2 * span);
              px = L + (m > span ? 2 * span - m : m);
              tx = px + (Math.random() - 0.5) * 2 * D.err * s;
            } else if (phase === 'play') tx = api.W / 2 + (ball.x - api.W / 2) * 0.3;
            aiTarget = tx;
          }
          var dx = aiTarget - op.x, mv = D.ai * s * dt;
          op.tx = op.x + Math.max(-mv, Math.min(mv, dx));
        }
        [me, op].forEach(function (p) {
          p.tx = Math.max(p.w / 2, Math.min(api.W - p.w / 2, p.tx));
          var nx = p.x + (p.tx - p.x) * Math.min(1, dt * 20);
          p.vx = (nx - p.x) / Math.max(dt, 1e-4); p.x = nx;
          if (p.flash > 0) p.flash -= dt;
        });
        phaseT += dt;
        [me, op].forEach(function (p) { if (p.effT > 0) { p.effT -= dt; if (p.effT <= 0) p.w = 84 * s; } });
        if (phase === 'play') {
          orbT -= dt;
          if (!orb && orbT <= 0) { var ks = Object.keys(ORBS); orb = { k: ks[Math.floor(Math.random() * ks.length)], x: api.W * (0.2 + Math.random() * 0.6), y: api.H * (0.38 + Math.random() * 0.24), life: 8 }; }
          if (orb) { orb.life -= dt; if (orb.life <= 0) { orb = null; orbT = 5; } }
        }
        if (phase === 'serve') { ball.x = api.W / 2; ball.y = api.H / 2; if (phaseT > 0.9) serve(); return; }
        if (phase === 'end') { if (phaseT > 1.6) { phase = 'done'; api.gameOver(); } return; }
        if (phase !== 'play') return;
        if (NET && NET.pendT > 0) { NET.pendT -= dt; if (NET.pendT <= 0) point(true); return; }
        var n = Math.ceil(Math.max(ball.sp, Math.hypot(ball.vx, ball.vy)) * dt / (ball.r * 0.6));
        for (var i = 0; i < n; i++) {
          var h = dt / n;
          ball.vx += ball.spin * h; ball.spin *= Math.pow(0.35, h);
          ball.x += ball.vx * h; ball.y += ball.vy * h;
          if (orb && Math.hypot(ball.x - orb.x, ball.y - orb.y) < ball.r + 16 * s && lastHit) {
            var who = lastHit, other = who === me ? op : me;
            api.sound('bonus'); api.fx.burst(orb.x, orb.y, ORBS[orb.k], 16, 180);
            api.fx.text(orb.x, orb.y - 20 * s, api.t('pong.' + orb.k), ORBS[orb.k], 16);
            if (orb.k === 'wide') { who.w = 84 * s * 1.5; who.effT = 8; }
            else if (orb.k === 'shrink') { other.w = 84 * s * 0.62; other.effT = 8; }
            else who.fireNext = true;
            if (NET) api.net.send({ k: 'ob', g: NET.g, o: orb.k, x: r4(orb.x / api.W), y: r4(orb.y / api.H) });
            orb = null; orbT = 7 + Math.random() * 5; if (NET) NET.force = true;
          }
          if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); api.sound('move'); burst(ball.x, ball.y, '#94a3b8', 4); }
          if (ball.x > api.W - ball.r) { ball.x = api.W - ball.r; ball.vx = -Math.abs(ball.vx); api.sound('move'); burst(ball.x, ball.y, '#94a3b8', 4); }
          if (ball.vy > 0 && ball.y + ball.r >= me.y && ball.y - ball.r <= me.y + me.h && Math.abs(ball.x - me.x) < me.w / 2 + ball.r) { ball.y = me.y - ball.r; paddleHit(me, -1); api.addScore(5); if (NET) NET.force = true; }
          if (!NET && ball.vy < 0 && ball.y - ball.r <= op.y + op.h && ball.y + ball.r >= op.y && Math.abs(ball.x - op.x) < op.w / 2 + ball.r) { ball.y = op.y + op.h + ball.r; paddleHit(op, 1); }
          if (ball.y > api.H + ball.r) { point(false); return; }
          if (ball.y < -ball.r) { if (NET) { NET.pendT = Math.max(0.1, Math.min(0.4, NET.rtt * 0.6 + 0.08)); return; } point(true); return; }
        }
        trail.push({ x: ball.x, y: ball.y }); if (trail.length > 12) trail.shift();
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        if (!courtCv || courtKey !== W + 'x' + H + ':' + s) buildCourt();
        c.save();
        if (shake > 0) c.translate((Math.random() - 0.5) * 14 * shake, (Math.random() - 0.5) * 14 * shake);
        c.drawImage(courtCv, 0, 0, W, H);
        // крупный счёт на фоне
        c.font = '900 ' + Math.round(110 * s) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = 'rgba(244,114,182,.16)'; c.fillText(String(sc[1]), W / 2, H * 0.27);
        c.fillStyle = 'rgba(34,211,238,.16)'; c.fillText(String(sc[0]), W / 2, H * 0.73);
        // подписи сторон
        c.font = '800 ' + Math.round(11 * s) + 'px system-ui, sans-serif';
        c.fillStyle = 'rgba(244,114,182,.7)'; c.fillText(two ? api.t('pong.p2') : api.mode === 2 ? api.t('net.opp') : api.t('pong.cpu'), W / 2, H * 0.27 + 66 * s);
        c.fillStyle = 'rgba(34,211,238,.7)'; c.fillText(two ? api.t('pong.p1') : api.mode === 2 ? api.t('g.you') : api.t('pong.you'), W / 2, H * 0.73 - 66 * s);
        // ракетки
        [me, op].forEach(function (p) {
          var px = p.x - p.w / 2, ph = p.h, hl = p.flash > 0;
          if (api.quality > 0 && glowCv) { c.globalAlpha = hl ? 0.9 : 0.5; c.drawImage(glowCv, px - 20 * s, p.y - 26 * s, p.w + 40 * s, ph + 52 * s); c.globalAlpha = 1; }
          c.save(); if (api.quality > 0) { c.shadowColor = p.col; c.shadowBlur = 16 + (hl ? 26 : 0); }
          var pg = c.createLinearGradient(0, p.y, 0, p.y + ph);
          pg.addColorStop(0, '#ffffff'); pg.addColorStop(0.35, hl ? '#fff' : p.col); pg.addColorStop(1, hl ? '#e2e8f0' : 'rgba(15,23,42,.9)');
          c.fillStyle = pg;
          c.beginPath(); c.roundRect ? c.roundRect(px, p.y, p.w, ph, ph / 2) : c.rect(px, p.y, p.w, ph); c.fill();
          c.restore();
          c.strokeStyle = p.col; c.lineWidth = 1.5 * s;
          c.beginPath(); c.roundRect ? c.roundRect(px, p.y, p.w, ph, ph / 2) : c.rect(px, p.y, p.w, ph); c.stroke();
          c.fillStyle = 'rgba(255,255,255,.85)';
          c.beginPath(); c.arc(px + ph / 2, p.y + ph / 2, ph * 0.22, 0, 6.283); c.fill();
          c.beginPath(); c.arc(px + p.w - ph / 2, p.y + ph / 2, ph * 0.22, 0, 6.283); c.fill();
          c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(px + 10 * s, p.y + 2.5 * s, p.w - 20 * s, 1.5 * s);
          c.fillStyle = 'rgba(0,0,0,.35)'; for (var gi = 1; gi < 6; gi++) c.fillRect(px + p.w * gi / 6, p.y + ph * 0.55, 1, ph * 0.3);
        });
        if (orb) {
          var oc = ORBS[orb.k], pr = 16 * s * (1 + Math.sin(t * 5) * 0.08);
          c.save(); c.shadowColor = oc; c.shadowBlur = 18; c.strokeStyle = oc; c.lineWidth = 3 * s; c.fillStyle = 'rgba(15,23,42,.6)';
          c.beginPath(); c.arc(orb.x, orb.y, pr, 0, 6.283); c.fill(); c.stroke(); c.restore();
          c.fillStyle = oc; c.font = '900 ' + Math.round(15 * s) + 'px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(orb.k === 'wide' ? '↔' : orb.k === 'shrink' ? '→←' : '🔥', orb.x, orb.y + 1);
        }
        // мяч
        var rox = NET && NET.host ? NET.ro.x : 0, roy = NET && NET.host ? NET.ro.y : 0;
        ball.x += rox; ball.y += roy;
        for (var i = 0; i < trail.length; i++) {
          c.globalAlpha = i / trail.length * 0.4; c.fillStyle = ball.fire ? '#fb923c' : ball.vy > 0 ? '#22d3ee' : '#f472b6';
          c.beginPath(); c.arc(trail[i].x, trail[i].y, ball.r * (0.3 + i / trail.length * 0.7), 0, 6.283); c.fill();
        }
        c.globalAlpha = 1;
        if (phase !== 'end' && phase !== 'done') {
          var pulse = phase === 'serve' ? 1 + Math.sin(t * 12) * 0.15 : 1, br = ball.r * pulse;
          if (glowCv) { c.globalAlpha = 0.8; c.drawImage(glowCv, ball.x - br * 3.2, ball.y - br * 3.2, br * 6.4, br * 6.4); c.globalAlpha = 1; }
          var bgd = c.createRadialGradient(ball.x - br * 0.35, ball.y - br * 0.4, br * 0.1, ball.x, ball.y, br);
          bgd.addColorStop(0, '#ffffff'); bgd.addColorStop(0.6, ball.fire ? '#fed7aa' : '#e0f2fe'); bgd.addColorStop(1, ball.fire ? '#f97316' : '#94a3b8');
          c.fillStyle = bgd; c.beginPath(); c.arc(ball.x, ball.y, br, 0, 6.283); c.fill();
        }
        ball.x -= rox; ball.y -= roy;
        parts.forEach(function (p) {
          c.globalAlpha = Math.min(1, p.life * 2); c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, 2.2, 0, 6.283); c.fill();
          if (api.quality > 1 && glowCv) { c.globalAlpha *= 0.5; c.drawImage(glowCv, p.x - 7, p.y - 7, 14, 14); }
        });
        c.globalAlpha = 1;
        c.restore();
        if (flash > 0) { c.fillStyle = 'rgba(255,255,255,' + flash * 0.4 + ')'; c.fillRect(0, 0, W, H); }
        if (phase === 'end' || phase === 'done') {
          c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, 0, W, H);
          var won = sc[0] >= WIN;
          c.font = '900 ' + Math.round(34 * s) + 'px system-ui, sans-serif'; c.textAlign = 'center';
          c.fillStyle = won ? '#22d3ee' : '#f472b6';
          c.fillText(two ? api.t(won ? 'pong.p1win' : 'pong.p2win') : api.t(won ? 'pong.win' : 'pong.lose'), W / 2, H / 2);
          c.font = '800 ' + Math.round(20 * s) + 'px system-ui, sans-serif'; c.fillStyle = '#fff';
          c.fillText(sc[0] + ' : ' + sc[1], W / 2, H / 2 + 40 * s);
        }
      }
    };
  }
};
