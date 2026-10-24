/* Бегун: три дорожки, свайпы влево/вправо — смена дорожки, вверх — прыжок, вниз — подкат */
window.GAMES = window.GAMES || {};
window.GAMES.runner = {
  title: 'Бегун', desc: 'Беги по дорожкам и собирай монеты', cat: 'arcade', isNew4: true, medals: [300, 900, 2000],
  hint: 'Свайп влево или вправо — сменить дорожку, вверх — прыжок через низкий барьер, вниз — подкат под высокий. Поезд можно только обойти. Собирай монетки!',
  d0: 'Медленно', d1: 'Обычно', d2: 'Быстро', d3: 'Очень быстро',
  colors: ['#0ea5e9', '#f59e0b'], controls: 'none', liveSwipe: 'once',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#0369a1"/><path d="M40 8L20 92M60 8l20 84" stroke="#bae6fd" stroke-width="3"/><path d="M50 8v84" stroke="#bae6fd" stroke-width="2" stroke-dasharray="6 6"/><rect x="58" y="22" width="18" height="26" rx="4" fill="#ef4444"/><circle cx="46" cy="58" r="7" fill="#fcd9b6"/><rect x="40" y="65" width="12" height="16" rx="4" fill="#f59e0b"/><circle cx="30" cy="40" r="5" fill="#facc15"/></svg>',
  create: function (api) {
    var SP = [260, 330, 400, 470];
    var lane, lx, jump, slide, obs, coins, dist, sp, spawnZ, dead, t;
    function laneX(l) { return api.W / 2 + (l - 1) * api.W * 0.28; }
    function px() { return api.H - 130; }
    function move(dir) {
      if (dead) return;
      if (dir === 'left' && lane > 0) lane--;
      else if (dir === 'right' && lane < 2) lane++;
      else if (dir === 'up' && jump <= 0 && slide <= 0) { jump = 0.7; api.sound('jump'); }
      else if (dir === 'down' && jump <= 0) { slide = 0.7; }
      else return;
      api.vibrate(8);
    }
    function spawn() {
      // в каждом ряду хотя бы одна свободная дорожка
      var free = Math.floor(Math.random() * 3);
      for (var l = 0; l < 3; l++) {
        if (l === free) { if (Math.random() < 0.6) for (var k = 0; k < 4; k++) coins.push({ l: l, y: -40 - k * 46 }); continue; }
        var r = Math.random();
        if (r < 0.35) obs.push({ l: l, y: -60, k: 'low' }); else if (r < 0.65) obs.push({ l: l, y: -60, k: 'high' }); else if (r < 0.85) obs.push({ l: l, y: -140, k: 'train' });
      }
    }
    return {
      reset: function () { lane = 1; lx = laneX(1); jump = 0; slide = 0; obs = []; coins = []; dist = 0; sp = SP[api.diff]; spawnZ = 0; dead = 0; t = 0; },
      resize: function () { lx = laneX(lane); }, idle: function (dt) { t += dt; },
      key: function (k, down) { if (down) move(k); },
      input: function (type, d) {
        if (type === 'swipe') move(d.dir);
        else if (type === 'tap') move(d.x < api.W / 2 ? 'left' : 'right');
      },
      update: function (dt) {
        t += dt;
        if (dead) { dead -= dt; if (dead <= 0) api.gameOver(); return; }
        sp += dt * 6; dist += sp * dt;
        lx += (laneX(lane) - lx) * Math.min(1, dt * 14);
        if (jump > 0) jump -= dt; if (slide > 0) slide -= dt;
        spawnZ -= sp * dt;
        if (spawnZ <= 0) { spawn(); spawnZ = Math.max(220, 380 - dist / 200); }
        var py = px(), air = jump > 0.1 && jump < 0.6, low = slide > 0;
        for (var i = obs.length - 1; i >= 0; i--) {
          var o = obs[i]; o.y += sp * dt;
          var h = o.k === 'train' ? 140 : 30;
          if (o.l === lane && o.y + h > py - 20 && o.y < py + 20) {
            if ((o.k === 'low' && air) || (o.k === 'high' && low)) continue;
            dead = 0.8; api.sound('hit'); api.vibrate(200); api.fx.shake(8); return;
          }
          if (o.y > api.H + 160) obs.splice(i, 1);
        }
        for (var j = coins.length - 1; j >= 0; j--) {
          var c = coins[j]; c.y += sp * dt;
          if (c.l === lane && Math.abs(c.y - py) < 26) { coins.splice(j, 1); api.addScore(10 * (api.diff + 1)); api.sound('coin'); continue; }
          if (c.y > api.H + 40) coins.splice(j, 1);
        }
        if (Math.floor(dist / 100) > Math.floor((dist - sp * dt) / 100)) api.addScore(1);
      },
      draw: function (c) {
        var W = api.W, H = api.H, lw = W * 0.28;
        c.fillStyle = '#0c4a6e'; c.fillRect(0, 0, W, H);
        c.fillStyle = '#475569'; c.fillRect(W / 2 - lw * 1.5, 0, lw * 3, H);
        c.strokeStyle = '#cbd5e1'; c.lineWidth = 3; c.setLineDash([24, 18]); c.lineDashOffset = -dist % 42;
        [-0.5, 0.5].forEach(function (k) { c.beginPath(); c.moveTo(W / 2 + k * lw, 0); c.lineTo(W / 2 + k * lw, H); c.stroke(); });
        c.setLineDash([]);
        c.fillStyle = '#65a30d'; c.fillRect(0, 0, W / 2 - lw * 1.5, H); c.fillRect(W / 2 + lw * 1.5, 0, W, H);
        coins.forEach(function (o) { var x = laneX(o.l); c.fillStyle = '#facc15'; c.beginPath(); c.arc(x, o.y, 11, 0, 6.283); c.fill(); c.strokeStyle = '#b45309'; c.lineWidth = 2; c.stroke(); });
        obs.forEach(function (o) {
          var x = laneX(o.l) - lw * 0.42, w = lw * 0.84;
          if (o.k === 'low') { c.fillStyle = '#f97316'; c.fillRect(x, o.y, w, 30); c.fillStyle = '#fff'; for (var s = 0; s < 4; s++) c.fillRect(x + s * w / 4 + 4, o.y + 4, w / 8, 22); }
          else if (o.k === 'high') { c.fillStyle = '#334155'; c.fillRect(x, o.y - 6, 6, 36); c.fillRect(x + w - 6, o.y - 6, 6, 36); c.fillStyle = '#ef4444'; c.fillRect(x, o.y - 6, w, 14); c.fillStyle = '#fff'; c.fillRect(x + 6, o.y - 2, w - 12, 4); }
          else { c.fillStyle = '#dc2626'; c.fillRect(x, o.y, w, 140); c.fillStyle = '#bae6fd'; c.fillRect(x + 8, o.y + 12, w - 16, 26); c.fillStyle = '#fde68a'; c.fillRect(x + 8, o.y + 120, 10, 8); c.fillRect(x + w - 18, o.y + 120, 10, 8); }
        });
        // бегун
        var py = px(), jh = jump > 0 ? Math.sin((0.7 - jump) / 0.7 * Math.PI) * 50 : 0, sl = slide > 0;
        c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(lx, py + 22, 16, 6, 0, 0, 6.283); c.fill();
        c.save(); c.translate(lx, py - jh);
        if (dead) c.rotate(0.6);
        var leg = Math.sin(t * 16) * 6;
        if (sl) { c.fillStyle = '#f59e0b'; c.fillRect(-16, 0, 32, 14); c.fillStyle = '#fcd9b6'; c.beginPath(); c.arc(-18, 4, 9, 0, 6.283); c.fill(); }
        else {
          c.strokeStyle = '#1e3a8a'; c.lineWidth = 6; c.lineCap = 'round';
          c.beginPath(); c.moveTo(-4, 6); c.lineTo(-6 + leg, 20); c.moveTo(4, 6); c.lineTo(6 - leg, 20); c.stroke();
          c.fillStyle = '#f59e0b'; c.fillRect(-10, -18, 20, 26);
          c.fillStyle = '#fcd9b6'; c.beginPath(); c.arc(0, -26, 10, 0, 6.283); c.fill();
          c.fillStyle = '#ef4444'; c.fillRect(-10, -36, 20, 6);
        }
        c.restore();
      }
    };
  }
};
