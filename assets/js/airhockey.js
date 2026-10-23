/* Аэрохоккей: против компьютера, вдвоём на одном экране и по сети (хост ведёт симуляцию) */
window.GAMES = window.GAMES || {};
window.GAMES.airhockey = {
  title: 'Аэрохоккей',
  desc: 'Забей шайбу в ворота',
  hint: 'Води битой по своей половине поля и отбивай шайбу в ворота соперника. До 7 голов. В режиме вдвоём второй игрок играет сверху.',
  d0: 'Медленный соперник', d1: 'Обычный соперник', d2: 'Быстрый соперник', d3: 'Профи',
  colors: ['#0ea5e9', '#ef4444'],
  controls: 'none',
  modes: true,
  lan: true,
  multiTouch: true,
  isNew3: true,
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="ahRail" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#64748b"/><stop offset=".5" stop-color="#1e293b"/><stop offset="1" stop-color="#475569"/></linearGradient>' +
    '<linearGradient id="ahIce" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfe8f9"/></linearGradient>' +
    '<radialGradient id="ahB" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#bae6fd"/><stop offset=".55" stop-color="#0ea5e9"/><stop offset="1" stop-color="#075985"/></radialGradient>' +
    '<radialGradient id="ahR" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fecaca"/><stop offset=".55" stop-color="#ef4444"/><stop offset="1" stop-color="#7f1d1d"/></radialGradient>' +
    '<pattern id="ahDots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r=".7" fill="#7896b4" opacity=".5"/></pattern></defs>' +
    '<rect x="10" y="2" width="80" height="96" rx="18" fill="url(#ahRail)"/><rect x="15" y="7" width="70" height="86" rx="14" fill="url(#ahIce)"/><rect x="15" y="7" width="70" height="86" rx="14" fill="url(#ahDots)"/>' +
    '<path d="M15 50h70" stroke="#ef4444" stroke-width="2.5"/><circle cx="50" cy="50" r="11" fill="none" stroke="#ef4444" stroke-width="2"/><circle cx="50" cy="50" r="2.5" fill="#ef4444"/>' +
    '<path d="M36 7a14 14 0 0 0 28 0M36 93a14 14 0 0 1 28 0" fill="#0ea5e9" fill-opacity=".1" stroke="#0ea5e9" stroke-width="2"/>' +
    '<rect x="37" y="4" width="26" height="6" rx="3" fill="#020617" stroke="#38bdf8" stroke-width="1.2"/><rect x="37" y="90" width="26" height="6" rx="3" fill="#020617" stroke="#f87171" stroke-width="1.2"/>' +
    '<path d="M22 28 L60 10" stroke="#fff" stroke-width="10" opacity=".35"/>' +
    '<ellipse cx="62" cy="62" rx="7" ry="6" fill="#0f172a" opacity=".2"/><circle cx="60" cy="59" r="6.5" fill="#1e293b"/><circle cx="60" cy="59" r="3.6" fill="none" stroke="#facc15" stroke-width="1.3"/>' +
    '<path d="M54 61 l-10 6 M53 58 l-10 3" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" opacity=".5"/>' +
    '<ellipse cx="53" cy="80" rx="12" ry="11" fill="#0f172a" opacity=".2"/><circle cx="50" cy="77" r="12" fill="url(#ahB)"/><circle cx="50" cy="76" r="5.5" fill="url(#ahB)" stroke="#075985" stroke-width="1"/><ellipse cx="48" cy="74" rx="2" ry="1.2" fill="#fff" opacity=".8"/>' +
    '<ellipse cx="43" cy="30" rx="12" ry="11" fill="#0f172a" opacity=".2"/><circle cx="40" cy="27" r="12" fill="url(#ahR)"/><circle cx="40" cy="26" r="5.5" fill="url(#ahR)" stroke="#7f1d1d" stroke-width="1"/><ellipse cx="38" cy="24" rx="2" ry="1.2" fill="#fff" opacity=".8"/></svg>',

  create: function (api) {
    var WIN = 7, DIFF = [{ sp: 260, react: 0.25 }, { sp: 420, react: 0.12 }, { sp: 600, react: 0.06 }, { sp: 820, react: 0.02 }];
    var D, s, me, op, puck, sc, phase, phaseT, t, goalW, bx, by, bw, bh, trail, keys;
    var tbl, tblW, tblH, puckSpr, malSpr, meGlow = 0, opGlow = 0, lastGoalMe = true;
    function mk(w, h) { var cv = document.createElement('canvas'), d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.max(1, Math.round(w * d)); cv.height = Math.max(1, Math.round(h * d)); var g = cv.getContext('2d'); g.scale(d, d); return { cv: cv, g: g }; }
    function rr(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else { c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); } }
    function buildTable() {
      var W = api.W, H = api.H; tblW = W; tblH = H;
      var o = mk(W, H), g = o.g, cx = bx + bw / 2, cy = by + bh / 2, gr;
      gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0b1220'); gr.addColorStop(1, '#111c33'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      // rail
      gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#475569'); gr.addColorStop(0.5, '#1e293b'); gr.addColorStop(1, '#334155');
      g.fillStyle = gr; rr(g, bx - 8, by - 8, bw + 16, bh + 16, 30); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1.5; rr(g, bx - 7, by - 7, bw + 14, bh + 14, 29); g.stroke();
      g.strokeStyle = '#0f172a'; g.lineWidth = 3; rr(g, bx - 1, by - 1, bw + 2, bh + 2, 25); g.stroke();
      // surface
      g.save(); rr(g, bx, by, bw, bh, 24); g.clip();
      gr = g.createLinearGradient(bx, by, bx + bw, by + bh); gr.addColorStop(0, '#f8fdff'); gr.addColorStop(0.5, '#e6f4fd'); gr.addColorStop(1, '#d4ebfa');
      g.fillStyle = gr; g.fillRect(bx, by, bw, bh);
      // air holes
      var step = Math.max(14, 18 * s), hr = Math.max(0.8, 1.1 * s);
      g.fillStyle = 'rgba(71,105,140,.28)';
      for (var yy = by + step / 2; yy < by + bh; yy += step) for (var xx = bx + step / 2 + ((Math.round((yy - by) / step) % 2) ? step / 2 : 0); xx < bx + bw; xx += step) { g.beginPath(); g.arc(xx, yy, hr, 0, 6.283); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,.7)';
      for (yy = by + step / 2; yy < by + bh; yy += step) for (xx = bx + step / 2 + ((Math.round((yy - by) / step) % 2) ? step / 2 : 0); xx < bx + bw; xx += step) g.fillRect(xx - hr, yy + hr * 0.6, hr * 2, hr * 0.7);
      // markings
      g.strokeStyle = 'rgba(14,165,233,.35)'; g.lineWidth = 2; rr(g, bx + 10 * s, by + 10 * s, bw - 20 * s, bh - 20 * s, 18); g.stroke();
      g.strokeStyle = 'rgba(239,68,68,.75)'; g.lineWidth = 4; g.beginPath(); g.moveTo(bx, cy); g.lineTo(bx + bw, cy); g.stroke();
      g.strokeStyle = 'rgba(239,68,68,.25)'; g.lineWidth = 10; g.beginPath(); g.moveTo(bx, cy); g.lineTo(bx + bw, cy); g.stroke();
      g.strokeStyle = 'rgba(239,68,68,.7)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 50 * s, 0, 6.283); g.stroke();
      g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, 44 * s, 0, 6.283); g.stroke();
      g.fillStyle = '#ef4444'; g.beginPath(); g.arc(cx, cy, 6 * s, 0, 6.283); g.fill();
      g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(cx - 1.5 * s, cy - 1.5 * s, 2 * s, 0, 6.283); g.fill();
      [cy - bh * 0.25, cy + bh * 0.25].forEach(function (fy) { [bx + bw * 0.25, bx + bw * 0.75].forEach(function (fx) {
        g.strokeStyle = 'rgba(239,68,68,.45)'; g.lineWidth = 2; g.beginPath(); g.arc(fx, fy, 16 * s, 0, 6.283); g.stroke();
        g.fillStyle = 'rgba(239,68,68,.6)'; g.beginPath(); g.arc(fx, fy, 4 * s, 0, 6.283); g.fill(); }); });
      [[by, 0, Math.PI, '14,165,233'], [by + bh, Math.PI, 6.283, '239,68,68']].forEach(function (z) {
        g.fillStyle = 'rgba(' + z[3] + ',.08)'; g.beginPath(); g.moveTo(cx - goalW * 0.6, z[0]); g.arc(cx, z[0], goalW * 0.6, z[1], z[2]); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(14,165,233,.6)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, z[0], goalW * 0.6, z[1], z[2]); g.stroke();
        g.strokeStyle = 'rgba(14,165,233,.3)'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, z[0], goalW * 0.42, z[1], z[2]); g.stroke();
      });
      // gloss
      gr = g.createLinearGradient(bx, by, bx + bw * 0.6, by + bh * 0.5);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.45, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.45)'); gr.addColorStop(0.62, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(bx, by, bw, bh);
      var v = g.createRadialGradient(cx, cy, Math.min(bw, bh) * 0.3, cx, cy, Math.max(bw, bh) * 0.7);
      v.addColorStop(0, 'rgba(15,40,70,0)'); v.addColorStop(1, 'rgba(15,40,70,.14)'); g.fillStyle = v; g.fillRect(bx, by, bw, bh);
      // inner rail shadow
      g.strokeStyle = 'rgba(15,23,42,.18)'; g.lineWidth = 8; rr(g, bx - 2, by - 2, bw + 4, bh + 4, 26); g.stroke();
      g.restore();
      // goal slots
      [by, by + bh].forEach(function (gy, i) {
        gr = g.createLinearGradient(0, gy - 6, 0, gy + 6); gr.addColorStop(0, '#020617'); gr.addColorStop(0.5, '#1e293b'); gr.addColorStop(1, '#020617');
        g.fillStyle = gr; rr(g, cx - goalW / 2, gy - 6, goalW, 12, 5); g.fill();
        g.strokeStyle = i ? 'rgba(248,113,113,.9)' : 'rgba(56,189,248,.9)'; g.lineWidth = 2; rr(g, cx - goalW / 2, gy - 6, goalW, 12, 5); g.stroke();
      });
      // rivets on rail
      g.fillStyle = 'rgba(255,255,255,.35)';
      [[bx - 4, by + bh * 0.25], [bx - 4, by + bh * 0.75], [bx + bw + 4, by + bh * 0.25], [bx + bw + 4, by + bh * 0.75], [bx - 4, cy], [bx + bw + 4, cy]].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], 1.8, 0, 6.283); g.fill(); });
      tbl = o.cv;
      // puck sprite
      var pr = puck ? puck.r : 16 * s, po = mk(pr * 2 + 4, pr * 2 + 4), pg = po.g, pc = pr + 2;
      gr = pg.createRadialGradient(pc - pr * 0.3, pc - pr * 0.3, 1, pc, pc, pr); gr.addColorStop(0, '#475569'); gr.addColorStop(1, '#0b1120');
      pg.fillStyle = gr; pg.beginPath(); pg.arc(pc, pc, pr, 0, 6.283); pg.fill();
      pg.strokeStyle = '#64748b'; pg.lineWidth = Math.max(1.5, pr * 0.12); pg.beginPath(); pg.arc(pc, pc, pr * 0.88, 0, 6.283); pg.stroke();
      pg.strokeStyle = 'rgba(250,204,21,.85)'; pg.lineWidth = Math.max(1.2, pr * 0.1); pg.beginPath(); pg.arc(pc, pc, pr * 0.55, 0, 6.283); pg.stroke();
      pg.fillStyle = '#111827'; pg.beginPath(); pg.arc(pc, pc, pr * 0.42, 0, 6.283); pg.fill();
      pg.strokeStyle = 'rgba(255,255,255,.35)'; pg.lineWidth = 1.5; pg.beginPath(); pg.arc(pc, pc, pr - 1, 3.6, 5.2); pg.stroke();
      puckSpr = po.cv;
      malSpr = [malletSpr('#0ea5e9', '#7dd3fc', '#075985'), malletSpr('#ef4444', '#fca5a5', '#7f1d1d')];
    }
    function malletSpr(col, li, dk) {
      var mr = 30 * s, o = mk(mr * 2 + 4, mr * 2 + 4), g = o.g, c0 = mr + 2, gr;
      g.fillStyle = dk; g.beginPath(); g.arc(c0, c0, mr, 0, 6.283); g.fill();
      gr = g.createRadialGradient(c0 - mr * 0.35, c0 - mr * 0.4, 1, c0, c0, mr * 0.95); gr.addColorStop(0, li); gr.addColorStop(0.55, col); gr.addColorStop(1, dk);
      g.fillStyle = gr; g.beginPath(); g.arc(c0, c0 - 1, mr * 0.94, 0, 6.283); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1.5; g.beginPath(); g.arc(c0, c0, mr * 0.72, 0, 6.283); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.beginPath(); g.arc(c0, c0 + 1, mr * 0.68, 0, 6.283); g.stroke();
      // handle knob
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.arc(c0 + mr * 0.06, c0 + mr * 0.1, mr * 0.46, 0, 6.283); g.fill();
      gr = g.createRadialGradient(c0 - mr * 0.15, c0 - mr * 0.2, 1, c0, c0, mr * 0.45); gr.addColorStop(0, '#fff'); gr.addColorStop(0.3, li); gr.addColorStop(1, dk);
      g.fillStyle = gr; g.beginPath(); g.arc(c0, c0 - mr * 0.04, mr * 0.42, 0, 6.283); g.fill();
      g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(c0 - mr * 0.14, c0 - mr * 0.2, mr * 0.15, mr * 0.09, -0.6, 0, 6.283); g.fill();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(c0 - mr * 0.45, c0 - mr * 0.5, mr * 0.22, mr * 0.1, -0.75, 0, 6.283); g.fill();
      return o.cv;
    }
    function layout() {
      s = Math.min(api.W / 400, api.H / 700);
      bx = 10; by = 10; bw = api.W - 20; bh = api.H - 20; goalW = bw * 0.36; tbl = null;
    }
    function resetPuck(toMe) {
      puck = { x: bx + bw / 2, y: by + bh / 2 + (toMe ? 60 : -60) * s, vx: 0, vy: 0, r: 16 * s };
      trail = [];
    }
    function mallet(x, y, col) { return { x: x, y: y, px: x, py: y, vx: 0, vy: 0, r: 30 * s, tx: x, ty: y, col: col }; }
    function clampMallet(m, top) {
      var minY = top ? by + m.r : by + bh / 2 + m.r, maxY = top ? by + bh / 2 - m.r : by + bh - m.r;
      m.tx = Math.max(bx + m.r, Math.min(bx + bw - m.r, m.tx)); m.ty = Math.max(minY, Math.min(maxY, m.ty));
    }
    function hit(m) {
      var dx = puck.x - m.x, dy = puck.y - m.y, d = Math.hypot(dx, dy), rr = puck.r + m.r;
      if (d < rr && d > 0) {
        var nx = dx / d, ny = dy / d;
        puck.x = m.x + nx * rr; puck.y = m.y + ny * rr;
        var rv = (puck.vx - m.vx) * nx + (puck.vy - m.vy) * ny;
        if (rv < 0) { puck.vx -= 1.9 * rv * nx; puck.vy -= 1.9 * rv * ny; }
        var sp = Math.hypot(puck.vx, puck.vy), mx = 1500 * s;
        if (sp > mx) { puck.vx *= mx / sp; puck.vy *= mx / sp; }
        api.tone(300 + Math.min(500, sp * 0.3), 0.04, 'square', 0.05); api.vibrate(8);
        return true;
      }
      return false;
    }
    function goal(meScored) {
      sc[meScored ? 0 : 1]++; phase = 'goal'; phaseT = 0; lastGoalMe = meScored; if (meScored) meGlow = 1; else opGlow = 1;
      api.sound(meScored ? 'point' : 'hit'); api.vibrate(meScored ? 40 : 120); api.fx.shake(6);
      if (api.mode === 0 && meScored) api.addScore(100 * (api.diff + 1));
      api.fx.burst(puck.x, puck.y, meScored ? '#0ea5e9' : '#ef4444', 30, 260);
      if (sc[0] >= WIN || sc[1] >= WIN) {
        phase = 'end';
        if (api.mode === 0 && sc[0] >= WIN) { api.addScore(500 * (api.diff + 1) + (WIN - sc[1]) * 60 * (api.diff + 1)); api.sound('win'); api.fx.confetti(80); }
        if (api.mode === 2 && sc[0] >= WIN) { api.sound('win'); api.fx.confetti(60); }
      }
      if (NET) { api.net.send({ k: 'gl', g: NET.g, m: meScored ? 1 : 0, sc: sc.slice(), e: phase === 'end' ? 1 : 0 }); NET.force = true; }
    }

    /* ---------- сеть: хост считает всё, гость шлёт свою биту и свои удары ----------
       Координаты в сообщениях — доли поля хоста (0..1). Гость видит поле повёрнутым на 180°.
       Удар гостя по шайбе гость обнаруживает сам (без задержки) и передаёт хосту готовую скорость шайбы,
       хост принимает её, промотав вперёд на время в пути. Пока хост не подтвердил удар — гость не принимает поправки. */
    var NET = null;
    function r4(v) { return Math.round(v * 1e4) / 1e4; }
    function nowMs() { return performance.now(); }
    function netInit() {
      NET = api.mode === 2 && api.net ? {
        host: !!api.net.host, g: (api.net.seed || 0) % 99991, seq: 0, lastQ: 0, sendT: 0, force: true, pingT: 0, pings: 0,
        rtt: 0.16, samp: [], off: null, lastHit: 0, hitN: 0, myHit: null, pendT: 0, lastGl: 0,
        om: null, omT: 0, ro: { x: 0, y: 0 }
      } : null;
    }
    function guest() { return NET && !NET.host; }
    function hostNow() { return NET && NET.off !== null ? nowMs() + NET.off : null; }
    // гость: из координат хоста (доли) в свои пиксели (поворот на 180°) и обратно
    function gx(u) { return bx + (1 - u) * bw; }
    function gy(v) { return by + (1 - v) * bh; }
    // шаг шайбы только со стенками (для предсказания); ворота пропускают шайбу
    function wallStep(p, h) {
      p.x += p.vx * h; p.y += p.vy * h;
      if (p.x < bx + p.r) { p.x = bx + p.r; p.vx = Math.abs(p.vx) * 0.9; }
      if (p.x > bx + bw - p.r) { p.x = bx + bw - p.r; p.vx = -Math.abs(p.vx) * 0.9; }
      var inG = Math.abs(p.x - (bx + bw / 2)) < goalW / 2;
      if (p.y < by + p.r && !inG) { p.y = by + p.r; p.vy = Math.abs(p.vy) * 0.9; }
      if (p.y > by + bh - p.r && !inG) { p.y = by + bh - p.r; p.vy = -Math.abs(p.vy) * 0.9; }
      if (p.y < by - p.r * 1.5 || p.y > by + bh + p.r * 1.5) { p.vx = 0; p.vy = 0; }
    }
    // столкновение шайбы с битой соперника для предсказания (без звука), как в hit()
    function softHit(p, m) {
      var dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy), rr = p.r + m.r;
      if (d >= rr || d <= 0) return false;
      var nx = dx / d, ny = dy / d; p.x = m.x + nx * rr; p.y = m.y + ny * rr;
      var rv = (p.vx - m.vx) * nx + (p.vy - m.vy) * ny;
      if (rv < 0) { p.vx -= 1.9 * rv * nx; p.vy -= 1.9 * rv * ny; }
      var sp = Math.hypot(p.vx, p.vy), mx = 1500 * s;
      if (sp > mx) { p.vx *= mx / sp; p.vy *= mx / sp; }
      return true;
    }
    function advance(p, sec, m) {
      sec = Math.max(0, Math.min(0.45, sec));
      while (sec > 1e-4) {
        var h = Math.min(1 / 120, sec); wallStep(p, h);
        if (m) { m.x += m.vx * h; m.y += m.vy * h; m.y = Math.min(m.y, by + bh / 2 - m.r); softHit(p, m); }
        p.vx *= Math.pow(0.6, h); p.vy *= Math.pow(0.6, h); sec -= h;
      }
      return p;
    }
    function snapMsg() {
      return { k: 'st', g: NET.g, q: ++NET.seq, t: Math.round(nowMs()),
        p: [r4((puck.x - bx) / bw), r4((puck.y - by) / bh), r4(puck.vx / bw), r4(puck.vy / bh)],
        m: [r4((me.x - bx) / bw), r4((me.y - by) / bh), r4(me.vx / bw), r4(me.vy / bh)],
        sc: sc.slice(), ph: phase === 'play' ? 0 : phase === 'goal' ? 1 : 2, ah: NET.lastHit };
    }
    function hostNet(dt) {
      NET.sendT -= dt;
      if (NET.sendT <= 0 || NET.force) { NET.sendT = 0.05; NET.force = false; api.net.sendFast(snapMsg()); }
    }
    function applyGuestHit(h) {
      NET.lastHit = h.i; NET.force = true;
      if (phase !== 'play') return;
      var ox = puck.x, oy = puck.y;
      puck.x = bx + h.x * bw; puck.y = by + h.y * bh; puck.vx = h.vx * bw; puck.vy = h.vy * bh;
      advance(puck, (nowMs() - h.t) / 1000);
      NET.pendT = 0;
      NET.ro.x += ox - puck.x; NET.ro.y += oy - puck.y;
      var sp = Math.hypot(puck.vx, puck.vy);
      api.tone(300 + Math.min(500, sp * 0.3), 0.04, 'square', 0.05);
    }
    function guestPing(dt) {
      NET.pingT -= dt;
      if (NET.pingT <= 0) { NET.pingT = NET.pings < 5 ? 0.3 : 1.5; NET.pings++; api.net.send({ k: 'pg', t: Math.round(nowMs() * 10) / 10 }); }
    }
    function guestSendInput(dt) {
      NET.sendT -= dt;
      if (NET.sendT > 0 && !NET.force) return;
      NET.sendT = 0.05; NET.force = false;
      var o = { k: 'in', g: NET.g, x: r4(1 - (me.x - bx) / bw), y: r4(1 - (me.y - by) / bh), r: Math.round(NET.rtt * 1000) };
      if (NET.myHit) o.h = NET.myHit.h;
      api.net.sendFast(o);
    }
    function guestUpdate(dt) {
      guestPing(dt);
      clampMallet(me, false);
      var lim = 3000 * s * dt, dx = me.tx - me.x, dy = me.ty - me.y, d = Math.hypot(dx, dy);
      if (d > lim) { dx *= lim / d; dy *= lim / d; }
      me.vx = dx / Math.max(dt, 1e-3); me.vy = dy / Math.max(dt, 1e-3); me.x += dx; me.y += dy;
      // бита соперника: из снимков, с небольшим упреждением по скорости и сглаживанием
      if (NET.om) {
        var age = Math.min(0.12, (nowMs() - NET.omT) / 1000 + 0.03);
        var tx = NET.om[0] + NET.om[2] * age, ty = NET.om[1] + NET.om[3] * age;
        tx = Math.max(bx + op.r, Math.min(bx + bw - op.r, tx)); ty = Math.max(by + op.r, Math.min(by + bh / 2 - op.r, ty));
        var k = Math.min(1, dt * 18), nx = op.x + (tx - op.x) * k, ny = op.y + (ty - op.y) * k;
        op.vx = (nx - op.x) / Math.max(dt, 1e-3); op.vy = (ny - op.y) / Math.max(dt, 1e-3); op.x = nx; op.y = ny;
      }
      if (NET.myHit && nowMs() - NET.myHit.at > 900) NET.myHit = null;
      if (phase === 'end') { if (phaseT > 1.8) { phase = 'done'; api.gameOver(); } guestSendInput(dt); return; }
      if (phase === 'play') {
        var n = 6, kk, hitNow = false;
        for (kk = 0; kk < n; kk++) { wallStep(puck, dt / n); if (hit(me)) hitNow = true; else if (!NET.myHit) softHit(puck, op); }
        puck.vx *= Math.pow(0.6, dt); puck.vy *= Math.pow(0.6, dt);
        // плавная поправка к позиции хоста
        var c = 1 - Math.exp(-dt * 9);
        puck.x += NET.ro.x * c; puck.y += NET.ro.y * c; NET.ro.x -= NET.ro.x * c; NET.ro.y -= NET.ro.y * c;
        if (hitNow) {
          var ht = hostNow();
          NET.myHit = { at: nowMs(), h: { i: ++NET.hitN, t: ht === null ? Math.round(nowMs()) : Math.round(ht),
            x: r4(1 - (puck.x - bx) / bw), y: r4(1 - (puck.y - by) / bh), vx: r4(-puck.vx / bw), vy: r4(-puck.vy / bh) } };
          NET.force = true; NET.ro.x = 0; NET.ro.y = 0;
        }
        trail.push({ x: puck.x, y: puck.y }); if (trail.length > 10) trail.shift();
      }
      guestSendInput(dt);
    }
    function guestSnap(d) {
      if (d.q <= NET.lastQ) return;
      NET.lastQ = d.q;
      var total = d.sc[0] + d.sc[1];
      if (total >= NET.lastGl) sc = [d.sc[1], d.sc[0]];
      NET.om = [gx(d.m[0]), gy(d.m[1]), -d.m[2] * bw, -d.m[3] * bh]; NET.omT = nowMs();
      if (NET.myHit && d.ah >= NET.myHit.h.i) NET.myHit = null;
      if (phase === 'end' || phase === 'done' || total < NET.lastGl) return;
      var ph = d.ph === 0 ? 'play' : d.ph === 1 ? 'goal' : 'end', ht = hostNow();
      var age = ht === null ? 0.08 : (ht - d.t) / 1000;
      var p = advance({ x: gx(d.p[0]), y: gy(d.p[1]), vx: -d.p[2] * bw, vy: -d.p[3] * bh, r: puck.r }, age,
        { x: NET.om[0], y: NET.om[1], vx: NET.om[2], vy: NET.om[3], r: op.r });
      if (ph !== phase) {
        phase = ph; phaseT = 0;
        if (ph === 'play') { puck.x = p.x; puck.y = p.y; puck.vx = p.vx; puck.vy = p.vy; NET.ro.x = 0; NET.ro.y = 0; trail = []; NET.myHit = null; }
        return;
      }
      if (ph !== 'play' || NET.myHit) return;
      puck.vx = p.vx; puck.vy = p.vy;
      var ex = p.x - puck.x, ey = p.y - puck.y;
      if (Math.hypot(ex, ey) > bh * 0.3) { puck.x = p.x; puck.y = p.y; NET.ro.x = 0; NET.ro.y = 0; trail = []; }
      else { NET.ro.x = ex; NET.ro.y = ey; }
    }
    function guestGoal(d) {
      var total = d.sc[0] + d.sc[1];
      if (total <= NET.lastGl) return;
      NET.lastGl = total; sc = [d.sc[1], d.sc[0]];
      var mine = !d.m; lastGoalMe = mine;
      if (mine) meGlow = 1; else opGlow = 1;
      api.sound(mine ? 'point' : 'hit'); api.vibrate(mine ? 40 : 120); api.fx.shake(6);
      api.fx.burst(puck.x, puck.y, mine ? '#0ea5e9' : '#ef4444', 30, 260);
      if (phase !== 'end' && phase !== 'done') { if (phase !== (d.e ? 'end' : 'goal')) phaseT = 0; phase = d.e ? 'end' : 'goal'; }
      if (d.e && sc[0] >= WIN) { api.sound('win'); api.fx.confetti(60); }
      NET.myHit = null;
    }
    return {
      reset: function () {
        D = DIFF[api.diff]; layout(); meGlow = 0; opGlow = 0; t = 0; sc = [0, 0]; phase = 'play'; phaseT = 0; keys = {};
        me = mallet(bx + bw / 2, by + bh - 90 * s, '#0ea5e9'); op = mallet(bx + bw / 2, by + 90 * s, '#ef4444');
        resetPuck(Math.random() < 0.5);
        netInit();
        if (guest()) puck.y = by + bh / 2;
      },
      // для тестов: шайба и биты в долях поля хоста
      dbg: function () {
        var gs = guest(), f = function (x, y) { return gs ? [1 - (x - bx) / bw, 1 - (y - by) / bh] : [(x - bx) / bw, (y - by) / bh]; };
        return { puck: f(puck.x, puck.y), me: f(me.x, me.y), op: f(op.x, op.y), sc: sc.slice(), phase: phase, rtt: NET && NET.rtt, off: NET && NET.off };
      },
      netMsg: function (d) {
        if (!NET || !d) return;
        if (NET.host) {
          if (d.k === 'pg') api.net.send({ k: 'po', t: d.t, h: Math.round(nowMs() * 10) / 10 });
          else if (d.k === 'in' && d.g === NET.g) {
            op.tx = bx + d.x * bw; op.ty = by + d.y * bh;
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
          else if (d.k === 'gl') guestGoal(d);
        }
      },
      resize: layout,
      idle: function (dt) { t += dt; },
      key: function (k, d) { keys[k] = d; },
      input: function (type, d) {
        if (type !== 'multi') return;
        d.forEach(function (p) {
          if (p.y > by + bh / 2) { me.tx = p.x; me.ty = p.y - 30 * s; }
          else if (api.mode === 1) { op.tx = p.x; op.ty = p.y + 30 * s; }
        });
      },
      update: function (dt) {
        t += dt; phaseT += dt; meGlow = Math.max(0, meGlow - dt * 0.8); opGlow = Math.max(0, opGlow - dt * 0.8);
        if (keys.left) me.tx -= 600 * dt; if (keys.right) me.tx += 600 * dt; if (keys.up) me.ty -= 600 * dt; if (keys.down) me.ty += 600 * dt;
        if (NET) { var c0 = 1 - Math.exp(-dt * 12); if (NET.host) { NET.ro.x -= NET.ro.x * c0; NET.ro.y -= NET.ro.y * c0; } else { guestUpdate(dt); return; } hostNet(dt); }
        if (phase === 'end') { if (phaseT > 1.8) { phase = 'done'; api.gameOver(); } return; }
        if (phase === 'goal') { if (phaseT > 1) { phase = 'play'; resetPuck(sc[0] + sc[1] > 0 && puck.y < by + bh / 2); } return; }
        // ИИ
        if (api.mode === 0) {
          var homeY = by + 90 * s;
          if (puck.y < by + bh / 2 + 40 * s && puck.vy < 120 * s) { op.tx = puck.x + (Math.random() - 0.5) * 20; op.ty = puck.y - 22 * s; }
          else { op.tx = bx + bw / 2 + (puck.x - bx - bw / 2) * 0.5; op.ty = homeY; }
          if (puck.y < op.y) { op.tx = puck.x + (puck.x < bx + bw / 2 ? 40 : -40) * s; op.ty = by + 40 * s; }
        }
        clampMallet(me, false); clampMallet(op, true);
        [me, op].forEach(function (m, i) {
          var lim = i === 1 && api.mode === 0 ? D.sp * s * dt : 3000 * s * dt;
          var dx = m.tx - m.x, dy = m.ty - m.y, d = Math.hypot(dx, dy);
          if (d > lim) { dx *= lim / d; dy *= lim / d; }
          m.vx = dx / Math.max(dt, 1e-3); m.vy = dy / Math.max(dt, 1e-3); m.x += dx; m.y += dy;
        });
        if (NET && NET.pendT > 0) { NET.pendT -= dt; if (NET.pendT <= 0) goal(true); return; }
        var n = 6;
        for (var k = 0; k < n; k++) {
          var h = dt / n;
          puck.x += puck.vx * h; puck.y += puck.vy * h;
          var inGoalX = Math.abs(puck.x - (bx + bw / 2)) < goalW / 2;
          if (puck.x < bx + puck.r) { puck.x = bx + puck.r; puck.vx = Math.abs(puck.vx) * 0.9; api.sound('move'); }
          if (puck.x > bx + bw - puck.r) { puck.x = bx + bw - puck.r; puck.vx = -Math.abs(puck.vx) * 0.9; api.sound('move'); }
          if (puck.y < by + puck.r) { if (inGoalX) { if (puck.y < by - puck.r) { if (NET) { NET.pendT = Math.max(0.1, Math.min(0.4, NET.rtt * 0.6 + 0.08)); return; } goal(true); return; } } else { puck.y = by + puck.r; puck.vy = Math.abs(puck.vy) * 0.9; api.sound('move'); } }
          if (puck.y > by + bh - puck.r) { if (inGoalX) { if (puck.y > by + bh + puck.r) { goal(false); return; } } else { puck.y = by + bh - puck.r; puck.vy = -Math.abs(puck.vy) * 0.9; api.sound('move'); } }
          if (hit(me) && NET) NET.force = true;
          if (!NET) hit(op);
        }
        puck.vx *= Math.pow(0.6, dt); puck.vy *= Math.pow(0.6, dt);
        trail.push({ x: puck.x, y: puck.y }); if (trail.length > 10) trail.shift();
      },
      draw: function (c) {
        var W = api.W, H = api.H, cx = bx + bw / 2, cy = by + bh / 2, q = api.quality;
        if (!tbl || tblW !== W || tblH !== H) buildTable();
        c.drawImage(tbl, 0, 0, W, H);
        // goal glow
        var gl = [[by, '14,165,233', meGlow], [by + bh, '239,68,68', opGlow]];
        for (var gi = 0; gi < 2; gi++) {
          var gg = gl[gi], ga = 0.18 + gg[2] * 0.7;
          if (q === 0 && gg[2] <= 0) continue;
          var rg = c.createRadialGradient(cx, gg[0], 0, cx, gg[0], goalW * (0.6 + gg[2] * 0.5));
          rg.addColorStop(0, 'rgba(' + gg[1] + ',' + ga + ')'); rg.addColorStop(1, 'rgba(' + gg[1] + ',0)');
          c.fillStyle = rg; c.fillRect(cx - goalW * 1.2, gg[0] - goalW, goalW * 2.4, goalW * 2);
        }
        // score digits
        c.font = '900 ' + Math.round(70 * s) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.lineWidth = 2; c.strokeStyle = 'rgba(239,68,68,.25)'; c.fillStyle = 'rgba(239,68,68,.12)';
        c.fillText(String(sc[1]), cx, cy - 80 * s); c.strokeText(String(sc[1]), cx, cy - 80 * s);
        c.strokeStyle = 'rgba(14,165,233,.28)'; c.fillStyle = 'rgba(14,165,233,.14)';
        c.fillText(String(sc[0]), cx, cy + 80 * s); c.strokeText(String(sc[0]), cx, cy + 80 * s);
        var pr = puck.r, rox = NET && NET.host ? NET.ro.x : 0, roy = NET && NET.host ? NET.ro.y : 0;
        if (api.mode === 2) {
          c.font = '800 ' + Math.round(13 * s) + 'px system-ui, sans-serif';
          c.fillStyle = 'rgba(239,68,68,.55)'; c.fillText(api.t('net.opp'), cx, cy - 136 * s);
          c.fillStyle = 'rgba(14,165,233,.6)'; c.fillText(api.t('g.you'), cx, cy + 136 * s);
        }
        puck.x += rox; puck.y += roy;
        if (phase === 'play') {
          // motion trail
          var sp = Math.hypot(puck.vx, puck.vy);
          for (var i = 0; i < trail.length; i++) {
            var f = (i + 1) / trail.length;
            c.globalAlpha = f * Math.min(0.35, sp / 2500); c.fillStyle = '#38bdf8';
            c.beginPath(); c.arc(trail[i].x, trail[i].y, pr * (0.55 + f * 0.4), 0, 6.283); c.fill();
          }
          c.globalAlpha = 1;
          // shadow
          c.fillStyle = 'rgba(15,23,42,.22)'; c.beginPath(); c.ellipse(puck.x + 3 * s, puck.y + 5 * s, pr * 1.05, pr * 0.95, 0, 0, 6.283); c.fill();
          c.drawImage(puckSpr, puck.x - pr - 2, puck.y - pr - 2, pr * 2 + 4, pr * 2 + 4);
        }
        puck.x -= rox; puck.y -= roy;
        [me, op].forEach(function (m, i) {
          var mr = m.r, spr = i === 0 ? malSpr[0] : malSpr[1];
          c.fillStyle = 'rgba(15,23,42,.25)'; c.beginPath(); c.ellipse(m.x + 4 * s, m.y + 7 * s, mr * 1.02, mr * 0.95, 0, 0, 6.283); c.fill();
          if (q > 0) { c.fillStyle = 'rgba(15,23,42,.12)'; c.beginPath(); c.ellipse(m.x + 7 * s, m.y + 11 * s, mr * 1.1, mr, 0, 0, 6.283); c.fill(); }
          c.drawImage(spr, m.x - mr - 2, m.y - mr - 2, mr * 2 + 4, mr * 2 + 4);
        });
        if (phase === 'goal' || phase === 'end' || phase === 'done') {
          var txt = phase === 'goal' ? api.t('ah.goal') : api.mode === 1 ? api.t(sc[0] > sc[1] ? 'g.p1win' : 'g.p2win') : api.t(sc[0] > sc[1] ? 'g.win' : 'g.lose');
          var e = Math.min(1, phaseT * 4), sc2 = 0.6 + 0.4 * (1 - Math.pow(1 - e, 3)) + (e < 1 ? 0 : Math.sin(phaseT * 6) * 0.02);
          c.font = '900 ' + Math.round(34 * s) + 'px system-ui, sans-serif';
          var tw = c.measureText(txt).width + 44 * s, th = 58 * s;
          c.save(); c.translate(cx, cy); c.scale(sc2, sc2); c.globalAlpha = e;
          c.fillStyle = 'rgba(15,23,42,.88)'; rr(c, -tw / 2, -th / 2, tw, th, th / 2); c.fill();
          c.strokeStyle = lastGoalMe ? '#38bdf8' : '#f87171'; c.lineWidth = 3; c.stroke();
          c.fillStyle = '#fff'; c.fillText(txt, 0, 2 * s);
          c.restore();
        }
        c.globalAlpha = 1; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      }
    };
  }
};
