/* Прыжок куба: куб сам едет вперёд, нажатие — прыжок через шипы и на платформы */
window.GAMES = window.GAMES || {};
window.GAMES.dash = {
  title: 'Прыжок куба', desc: 'Перепрыгивай шипы в ритме', cat: 'arcade', isNew4: true, medals: [50, 150, 400],
  hint: 'Куб едет сам. Нажимай, чтобы прыгнуть через шипы. На платформы можно запрыгивать, но врезаться в их бок нельзя. Очко за каждое препятствие.',
  d0: 'Медленно, редкие шипы', d1: 'Обычно', d2: 'Быстро, двойные шипы', d3: 'Очень быстро, тройные шипы',
  colors: ['#7c3aed', '#06b6d4'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#1e1b4b"/><rect x="8" y="70" width="84" height="22" fill="#4c1d95"/><rect x="22" y="38" width="22" height="22" rx="3" fill="#facc15" transform="rotate(20 33 49)"/><path d="M56 70l8-16 8 16zM70 70l8-16 8 16z" fill="#22d3ee"/></svg>',
  create: function (api) {
    var SP = [240, 290, 340, 390], MAXS = [1, 2, 3, 3];
    var y, vy, rot, obs, scroll, next, dead, t, ground, parts;
    var S = 30, G = 2600, JV = -820, X = 90;
    function gy() { return api.H * 0.72; }
    function spawn(x) {
      var r = Math.random();
      if (r < 0.65) { var n = 1 + Math.floor(Math.random() * MAXS[api.diff]); obs.push({ k: 'spike', x: x, w: n * S, done: false }); }
      else obs.push({ k: 'block', x: x, w: S * (2 + Math.floor(Math.random() * 3)), h: S * (Math.random() < 0.5 ? 1 : 2), done: false });
    }
    function floorAt(px) {
      var f = gy();
      obs.forEach(function (o) { if (o.k === 'block' && px + S / 2 > o.x - scroll && px - S / 2 < o.x - scroll + o.w) f = Math.min(f, gy() - o.h); });
      return f;
    }
    return {
      reset: function () { y = gy() - S; vy = 0; rot = 0; obs = []; scroll = 0; next = 500; dead = 0; t = 0; ground = true; parts = []; },
      resize: function () { }, idle: function (dt) { t += dt; },
      key: function (k, down) { if (down && (k === 'up' || k === 'action')) this.input('down'); },
      input: function (type) { if (type === 'down' && ground && !dead) { vy = JV; ground = false; api.sound('jump'); } },
      update: function (dt) {
        t += dt;
        for (var q = parts.length - 1; q >= 0; q--) { var p = parts[q]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.l -= dt; if (p.l <= 0) parts.splice(q, 1); }
        if (dead) { dead -= dt; if (dead <= 0) api.gameOver(); return; }
        var sp = SP[api.diff] + scroll / 100;
        scroll += sp * dt;
        while (next < scroll + api.W + 100) { spawn(next); next += 260 + Math.random() * 220; }
        vy += G * dt; y += vy * dt;
        var f = floorAt(X);
        if (y + S >= f && vy >= 0 && y + S - vy * dt <= f + 6) { y = f - S; vy = 0; ground = true; rot = Math.round(rot / (Math.PI / 2)) * Math.PI / 2; }
        else { if (y + S < f) ground = false; rot += dt * 6; }
        for (var i = obs.length - 1; i >= 0; i--) {
          var o = obs[i], ox = o.x - scroll;
          if (o.k === 'spike') {
            if (X + S / 2 - 6 > ox && X - S / 2 + 6 < ox + o.w && y + S > gy() - S * 0.7) return die();
          } else if (X + S / 2 > ox + 4 && X - S / 2 < ox + o.w && y + S > gy() - o.h + 8 && y < gy()) return die();
          if (!o.done && ox + o.w < X - S / 2) { o.done = true; api.addScore(1); }
          if (ox + o.w < -50) obs.splice(i, 1);
        }
        function die() {
          dead = 0.9; api.sound('hit'); api.vibrate(150); api.fx.shake(6);
          for (var k = 0; k < 18; k++) parts.push({ x: X, y: y + S / 2, vx: (Math.random() - 0.5) * 400, vy: -Math.random() * 400, l: 0.8 });
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H, g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#1e1b4b'); g.addColorStop(1, '#581c87'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,255,255,.05)';
        for (var b = 0; b < 8; b++) { var bx = ((b * 160 - scroll * 0.3) % (W + 160) + W + 160) % (W + 160) - 80; c.fillRect(bx, H * 0.3, 60, H * 0.42); }
        c.fillStyle = '#4c1d95'; c.fillRect(0, gy(), W, H - gy());
        c.fillStyle = '#22d3ee'; c.fillRect(0, gy(), W, 3);
        obs.forEach(function (o) {
          var ox = o.x - scroll;
          if (o.k === 'spike') { c.fillStyle = '#22d3ee'; for (var s = 0; s < o.w / S; s++) { c.beginPath(); c.moveTo(ox + s * S, gy()); c.lineTo(ox + s * S + S / 2, gy() - S * 0.9); c.lineTo(ox + s * S + S, gy()); c.fill(); } }
          else { c.fillStyle = '#312e81'; c.fillRect(ox, gy() - o.h, o.w, o.h); c.strokeStyle = '#a78bfa'; c.lineWidth = 2; c.strokeRect(ox + 1, gy() - o.h + 1, o.w - 2, o.h - 2); }
        });
        if (!dead) {
          c.save(); c.translate(X, y + S / 2); c.rotate(rot);
          c.fillStyle = '#facc15'; c.fillRect(-S / 2, -S / 2, S, S); c.strokeStyle = '#a16207'; c.lineWidth = 3; c.strokeRect(-S / 2 + 1.5, -S / 2 + 1.5, S - 3, S - 3);
          c.fillStyle = '#1f2937'; c.fillRect(-8, -6, 5, 5); c.fillRect(3, -6, 5, 5); c.fillRect(-7, 5, 14, 3);
          c.restore();
        }
        c.fillStyle = '#facc15'; parts.forEach(function (p) { c.globalAlpha = Math.max(0, p.l); c.fillRect(p.x - 4, p.y - 4, 8, 8); }); c.globalAlpha = 1;
      }
    };
  }
};
