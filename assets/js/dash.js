/* Прыжок куба: куб едет сам. Нажатие — прыжок, удержание — прыжки подряд.
   Шипы, платформы (на них можно стоять), шипы на платформах, батуты (высокий прыжок). Цвет мира меняется каждые 10 очков */
window.GAMES = window.GAMES || {};
window.GAMES.dash = {
  title: 'Прыжок куба', desc: 'Перепрыгивай шипы в ритме', cat: 'arcade', isNew4: true, medals: [40, 120, 300],
  hint: 'Куб едет сам. Нажми — прыжок, держи палец — куб прыгает сразу после приземления. На платформы можно запрыгивать, но не врезаться в их бок. Жёлтый батут подбрасывает высоко.',
  d0: 'Медленно, редкие шипы', d1: 'Обычно', d2: 'Быстро, двойные шипы', d3: 'Очень быстро, тройные шипы',
  colors: ['#7c3aed', '#06b6d4'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#1e1b4b"/><rect x="8" y="70" width="84" height="22" fill="#4c1d95"/><rect x="22" y="38" width="22" height="22" rx="3" fill="#facc15" transform="rotate(20 33 49)"/><path d="M56 70l8-16 8 16zM70 70l8-16 8 16z" fill="#22d3ee"/></svg>',
  create: function (api) {
    var SP = [250, 300, 350, 400], MAXS = [1, 2, 3, 3];
    var PAL = [['#1e1b4b', '#581c87', '#22d3ee'], ['#042f2e', '#065f46', '#facc15'], ['#3b0764', '#9d174d', '#f0abfc'], ['#0c0a09', '#7c2d12', '#fb923c'], ['#082f49', '#1e3a8a', '#a3e635']];
    var y, vy, rot, obs, scroll, next, dead, t, ground, parts, trail, hold, beat, attempt;
    var S = 30, G = 2700, JV = -840, PADV = -1250, X = 100;
    function gy() { return api.H * 0.72; }
    function pal() { return PAL[Math.floor(api.getScore() / 10) % PAL.length]; }
    function spawn(x) {
      var r = Math.random(), n;
      if (r < 0.5) { n = 1 + Math.floor(Math.random() * MAXS[api.diff]); obs.push({ k: 'spike', x: x, w: n * S }); return S * n; }
      if (r < 0.72) { var h = S * (Math.random() < 0.5 ? 1 : 2), w = S * (3 + Math.floor(Math.random() * 3)); obs.push({ k: 'block', x: x, w: w, h: h });
        if (api.diff > 0 && Math.random() < 0.5) obs.push({ k: 'spike', x: x + w + S * 2, w: S }); return w + S * 3; }
      if (r < 0.86) { // ступеньки
        obs.push({ k: 'block', x: x, w: S * 2, h: S }); obs.push({ k: 'block', x: x + S * 2, w: S * 2, h: S * 2 }); obs.push({ k: 'block', x: x + S * 4, w: S * 2, h: S * 3 }); return S * 6;
      }
      // батут перед длинной ямой шипов
      obs.push({ k: 'pad', x: x, w: S }); obs.push({ k: 'spike', x: x + S * 3, w: S * 5 }); return S * 8;
    }
    function floorAt(px) {
      var f = gy();
      obs.forEach(function (o) { if (o.k === 'block' && px + S / 2 > o.x - scroll + 2 && px - S / 2 < o.x - scroll + o.w - 2) f = Math.min(f, gy() - o.h); });
      return f;
    }
    function die() {
      dead = 1; api.sound('hit'); api.vibrate(150); api.fx.shake(7);
      for (var k = 0; k < 24; k++) parts.push({ x: X, y: y + S / 2, vx: (Math.random() - 0.5) * 500, vy: -Math.random() * 500, l: 0.9, c: k % 2 ? '#facc15' : pal()[2] });
    }
    function jumpNow(v) { vy = v; ground = false; api.sound('jump'); }
    return {
      reset: function () {
        y = gy() - S; vy = 0; rot = 0; obs = []; scroll = 0; next = 520; dead = 0; t = 0; ground = true; parts = []; trail = []; hold = false; beat = 0;
        attempt = (api.store.get('dashTry', 0) || 0) + 1; api.store.set('dashTry', attempt);
      },
      resize: function () { }, idle: function (dt) { t += dt; },
      key: function (k, down) { if (k === 'up' || k === 'action' || k === 'space') { hold = down; if (down && ground && !dead) jumpNow(JV); } },
      input: function (type) {
        if (type === 'down') { hold = true; if (ground && !dead) jumpNow(JV); }
        else if (type === 'up') hold = false;
      },
      update: function (dt) {
        t += dt; beat = Math.max(0, beat - dt * 3);
        for (var q = parts.length - 1; q >= 0; q--) { var p = parts[q]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.l -= dt; if (p.l <= 0) parts.splice(q, 1); }
        for (var tq = trail.length - 1; tq >= 0; tq--) { trail[tq].x -= (SP[api.diff] + scroll / 120) * dt; trail[tq].l -= dt * 2.5; if (trail[tq].l <= 0) trail.splice(tq, 1); }
        if (dead) { dead -= dt; if (dead <= 0) api.gameOver(); return; }
        var sp = SP[api.diff] + scroll / 120;
        scroll += sp * dt;
        if (Math.floor(scroll / 240) > Math.floor((scroll - sp * dt) / 240)) beat = 1;
        while (next < scroll + api.W + 200) next += spawn(next) + 200 + Math.random() * 200 - api.diff * 25;
        vy += G * dt; y += vy * dt;
        var f = floorAt(X);
        if (y + S >= f && vy >= 0 && y + S - vy * dt <= f + 8) {
          y = f - S; vy = 0;
          if (!ground) { rot = Math.round(rot / (Math.PI / 2)) * Math.PI / 2; for (var k2 = 0; k2 < 5; k2++) parts.push({ x: X - S / 2, y: f, vx: -Math.random() * 200, vy: -Math.random() * 120, l: 0.4, c: pal()[2] }); }
          ground = true;
          if (hold) jumpNow(JV);
        } else { if (y + S < f - 1) ground = false; if (!ground) rot += dt * 7; }
        if (!ground || Math.random() < 0.5) trail.push({ x: X, y: y + S / 2, l: 1 });
        if (y > api.H) return die();
        for (var i = obs.length - 1; i >= 0; i--) {
          var o = obs[i], ox = o.x - scroll;
          if (o.k === 'spike') { if (X + S / 2 - 7 > ox && X - S / 2 + 7 < ox + o.w && y + S > gy() - S * 0.65) return die(); }
          else if (o.k === 'pad') { if (X + S / 2 > ox && X - S / 2 < ox + o.w && y + S >= gy() - 8) { jumpNow(PADV); api.sound('bonus'); } }
          else if (X + S / 2 > ox + 6 && X - S / 2 < ox + o.w && y + S > gy() - o.h + 10 && y < gy()) return die();
          if (!o.done && ox + o.w < X - S / 2) { o.done = true; if (o.k !== 'pad') api.addScore(1); }
          if (ox + o.w < -60) obs.splice(i, 1);
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H, P = pal(), g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, P[0]); g.addColorStop(1, P[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
        // фон: квадраты в два слоя, пульс в такт
        for (var L = 0; L < 2; L++) {
          var k = L ? 0.5 : 0.2, sz = L ? 70 : 40; c.fillStyle = 'rgba(255,255,255,' + (L ? 0.06 : 0.04) * (1 + beat) + ')';
          for (var b = 0; b < 10; b++) { var bx = ((b * 150 + L * 70 - scroll * k) % (W + 150) + W + 150) % (W + 150) - 75; c.fillRect(bx, H * (L ? 0.38 : 0.2) + (b % 3) * 30, sz, sz); }
        }
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, gy(), W, H - gy());
        c.fillStyle = 'rgba(255,255,255,.07)';
        for (var gx = -(scroll % 60); gx < W; gx += 60) c.fillRect(gx, gy() + 4, 2, H - gy());
        c.fillStyle = P[2]; c.fillRect(0, gy(), W, 3 + beat * 2);
        obs.forEach(function (o) {
          var ox = o.x - scroll; if (ox > W + 10 || ox + o.w < -10) return;
          if (o.k === 'spike') {
            for (var s = 0; s < o.w / S; s++) { var sx = ox + s * S; c.fillStyle = '#0f172a'; c.beginPath(); c.moveTo(sx, gy()); c.lineTo(sx + S / 2, gy() - S * 0.9); c.lineTo(sx + S, gy()); c.fill(); c.strokeStyle = P[2]; c.lineWidth = 2; c.stroke(); }
          } else if (o.k === 'pad') {
            c.fillStyle = '#facc15'; c.beginPath(); c.ellipse(ox + S / 2, gy() - 4, S / 2, 6 + beat * 2, 0, Math.PI, 0); c.fill();
          } else {
            c.fillStyle = 'rgba(15,23,42,.85)'; c.fillRect(ox, gy() - o.h, o.w, o.h);
            c.strokeStyle = P[2]; c.lineWidth = 2; c.strokeRect(ox + 1, gy() - o.h + 1, o.w - 2, o.h - 2);
            c.strokeStyle = 'rgba(255,255,255,.12)'; for (var bb = S; bb < o.w; bb += S) { c.beginPath(); c.moveTo(ox + bb, gy() - o.h); c.lineTo(ox + bb, gy()); c.stroke(); }
          }
        });
        trail.forEach(function (p) { c.globalAlpha = p.l * 0.5; c.fillStyle = P[2]; c.fillRect(p.x - 4 - (1 - p.l) * 20, p.y - 4, 8 * p.l, 8 * p.l); }); c.globalAlpha = 1;
        if (!dead) {
          c.save(); c.translate(X, y + S / 2); c.rotate(rot);
          c.shadowColor = '#facc15'; c.shadowBlur = 12 + beat * 10;
          c.fillStyle = '#facc15'; c.fillRect(-S / 2, -S / 2, S, S); c.shadowBlur = 0;
          c.fillStyle = '#22d3ee'; c.fillRect(-S / 2 + 6, -S / 2 + 6, S - 12, S - 12);
          c.fillStyle = '#1f2937'; c.fillRect(-8, -5, 5, 5); c.fillRect(3, -5, 5, 5); c.fillRect(-6, 4, 12, 3);
          c.restore();
        }
        parts.forEach(function (p) { c.globalAlpha = Math.max(0, p.l); c.fillStyle = p.c; c.fillRect(p.x - 4, p.y - 4, 8, 8); }); c.globalAlpha = 1;
        c.fillStyle = 'rgba(255,255,255,.75)'; c.font = '800 14px system-ui'; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText('Попытка ' + attempt, 12, 22);
        if (scroll < 400) { c.textAlign = 'center'; c.font = '800 16px system-ui'; c.fillText('Нажми — прыжок, держи — прыжки подряд', W / 2, H * 0.4); }
      }
    };
  }
};
