/* Улов: лови падающие фрукты корзиной, уворачивайся от бомб */
window.GAMES = window.GAMES || {};
window.GAMES.catcher = {
  title: 'Улов', desc: 'Лови фрукты, избегай бомб', cat: 'arcade', isNew4: true, medals: [300, 800, 1600],
  hint: 'Води пальцем по экрану — корзина поедет за ним. Лови фрукты и уворачивайся от бомб. Бомба отнимает жизнь, три жизни — конец игры. Чем дольше играешь, тем быстрее падают предметы.',
  d0: 'Медленно', d1: 'Обычно', d2: 'Быстро, пропущенный фрукт — минус жизнь', d3: 'Очень быстро, много бомб',
  colors: ['#16a34a', '#0d9488'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#dcfce7"/><circle cx="34" cy="30" r="10" fill="#ef4444"/><circle cx="64" cy="22" r="9" fill="#f59e0b"/><path d="M22 60h56l-8 24H30z" fill="#a16207"/><path d="M22 60h56" stroke="#713f12" stroke-width="5" stroke-linecap="round"/></svg>',
  create: function (api) {
    var FRUITS = ['🍎', '🍊', '🍌', '🍇', '🍓', '🍒', '🍐', '🍉'];
    var BOMB = [0.12, 0.18, 0.22, 0.3], SPEED = [150, 190, 240, 290];
    var bx, items, t, lives, spawnT, flash;
    return {
      reset: function () { bx = api.W / 2; items = []; t = 0; lives = 3; spawnT = 0.5; flash = 0; },
      resize: function () { }, idle: function () { }, key: function () { },
      input: function (type, d) { if ((type === 'down' || type === 'move') && d && d.x != null) bx = Math.max(40, Math.min(api.W - 40, d.x)); },
      update: function (dt) {
        t += dt; spawnT -= dt; if (flash > 0) flash -= dt;
        if (spawnT <= 0) {
          var bomb = Math.random() < BOMB[api.diff] && (api.diff > 0 || t > 6);
          items.push({ x: 30 + Math.random() * (api.W - 60), y: -30, bomb: bomb, e: bomb ? '💣' : FRUITS[Math.floor(Math.random() * FRUITS.length)] });
          spawnT = Math.max(0.3, 1.0 - t * 0.012);
        }
        var v = SPEED[api.diff] + t * 4, by = api.H - 80;
        for (var i = items.length - 1; i >= 0; i--) {
          var it = items[i];
          it.y += v * dt;
          if (it.y > by - 30 && it.y < by + 20 && Math.abs(it.x - bx) < 52) {
            items.splice(i, 1);
            if (it.bomb) { lives--; flash = 0.3; api.sound('hit'); api.vibrate(60); if (lives <= 0) { api.gameOver(); return; } }
            else { api.addScore(10 * (api.diff + 1)); api.sound('coin'); }
          } else if (it.y > api.H + 30) {
            items.splice(i, 1);
            if (!it.bomb && api.diff >= 2) { lives--; flash = 0.3; api.sound('hit'); if (lives <= 0) { api.gameOver(); return; } }
          }
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H, g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#0ea5e9'); g.addColorStop(1, '#bbf7d0');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        if (flash > 0) { c.fillStyle = 'rgba(239,68,68,.35)'; c.fillRect(0, 0, W, H); }
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = '40px system-ui';
        items.forEach(function (it) { c.fillText(it.e, it.x, it.y); });
        c.font = '64px system-ui'; c.fillText('🧺', bx, H - 80);
        c.font = '800 20px system-ui'; c.fillStyle = '#fff';
        c.fillText('❤'.repeat(Math.max(0, lives)), W / 2, 40);
      }
    };
  }
};
