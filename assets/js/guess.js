/* Угадай число: вводи число, игра подсказывает «больше» или «меньше» */
window.GAMES = window.GAMES || {};
window.GAMES.guess = {
  title: 'Угадай число', desc: 'Найди загаданное число', cat: 'puzzle', isNew4: true, medals: [500, 1200, 2000],
  hint: 'Введи число на клавиатуре и нажми OK. Игра скажет, загаданное число больше или меньше. Угадай за оставшиеся попытки. Пять раундов подряд: чем меньше попыток потрачено, тем больше очков.',
  d0: 'Числа до 50, 10 попыток', d1: 'Числа до 100, 9 попыток', d2: 'Числа до 200, 8 попыток', d3: 'Числа до 500, 7 попыток',
  colors: ['#7c3aed', '#4c1d95'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#ede9fe"/><text x="50" y="62" font-size="36" font-family="sans-serif" font-weight="800" fill="#7c3aed" text-anchor="middle">?</text></svg>',
  create: function (api) {
    var MAX = [50, 100, 200, 500], TRIES = [10, 9, 8, 7], KEYS = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['⌫', '0', 'OK']];
    var secret, input, tries, round, hint, cell, x0, y0, lo, hi, hist, shakeT, winT, pulse, K = window.GBK;
    function layout() { cell = Math.floor(Math.min(api.W / 3 - 4, api.H * 0.38 / 4)); x0 = (api.W - 3 * cell) / 2; y0 = api.H - 4 * cell - 14; }
    function newSecret() { secret = 1 + Math.floor(Math.random() * MAX[api.diff]); tries = TRIES[api.diff]; input = ''; lo = 1; hi = MAX[api.diff]; hist = []; hint = 'Загадано число от 1 до ' + MAX[api.diff]; }
    function heat(n) { var d = Math.abs(n - secret) / MAX[api.diff]; return d < 0.03 ? ['🔥 Горячо!', '#ef4444'] : d < 0.1 ? ['Тепло', '#f97316'] : d < 0.25 ? ['Прохладно', '#38bdf8'] : ['❄ Холодно', '#60a5fa']; }
    function submit() {
      var n = parseInt(input, 10);
      if (isNaN(n)) return;
      input = '';
      if (n === secret) {
        api.addScore(Math.round(100 * (api.diff + 1) * (tries + 1) / TRIES[api.diff] * 3));
        api.fx.confetti(40); api.sound('win'); round++; hint = 'Верно! Это ' + secret; winT = 1.4; hist.push({ n: n, d: 0 });
        return;
      }
      tries--; api.sound('hit'); api.vibrate(20); shakeT = 0.35;
      if (n < secret) lo = Math.max(lo, n + 1); else hi = Math.min(hi, n - 1);
      hist.push({ n: n, d: n < secret ? 1 : -1 });
      var h = heat(n); hint = (n < secret ? 'Больше, чем ' : 'Меньше, чем ') + n + ' · ' + h[0];
      if (tries <= 0) { hint = 'Было загадано ' + secret; winT = -1.6; }
    }
    return {
      reset: function () { round = 0; shakeT = 0; winT = 0; pulse = 0; layout(); newSecret(); },
      resize: function () { layout(); }, idle: function () { }, key: function () { },
      update: function (dt) {
        pulse += dt; if (shakeT > 0) shakeT -= dt;
        if (winT > 0) { winT -= dt; if (winT <= 0) { winT = 0; if (round >= 5) api.gameOver(); else newSecret(); } }
        else if (winT < 0) { winT += dt; if (winT >= 0) { winT = 0; api.gameOver(); } }
      },
      input: function (type, d) {
        if (type !== 'down' || d.y < y0 || winT) return;
        var c = Math.floor((d.x - x0) / cell), r = Math.floor((d.y - y0) / cell), k = KEYS[r] && KEYS[r][c];
        if (!k) return;
        api.sound('click'); api.vibrate(5);
        if (k === 'OK') submit();
        else if (k === '⌫') input = input.slice(0, -1);
        else if (input.length < 3) input += k;
      },
      draw: function (c) {
        var W = api.W, H = api.H, M = MAX[api.diff];
        K.bg(c, W, H, '#1e1b4b', '#0f0a24', 'rgba(167,139,250,.18)');
        c.textAlign = 'center'; c.textBaseline = 'middle';
        // раунды кружками и попытки
        for (var q = 0; q < 5; q++) { c.fillStyle = q < round ? '#a78bfa' : 'rgba(167,139,250,.25)'; c.beginPath(); c.arc(W / 2 - 48 + q * 24, 28, 7, 0, 6.283); c.fill(); }
        c.fillStyle = '#c4b5fd'; c.font = '700 13px system-ui'; c.fillText('Попыток: ' + tries + ' из ' + TRIES[api.diff], W / 2, 52);
        // шкала с найденным диапазоном
        var bx = 24, bw = W - 48, by = 78;
        K.rr(c, bx, by, bw, 12, 6); c.fillStyle = 'rgba(255,255,255,.08)'; c.fill();
        var l = bx + bw * (lo - 1) / M, r2 = bx + bw * hi / M;
        var g = c.createLinearGradient(l, 0, r2, 0); g.addColorStop(0, '#8b5cf6'); g.addColorStop(1, '#ec4899');
        K.rr(c, l, by, Math.max(6, r2 - l), 12, 6); c.fillStyle = g; c.fill();
        c.fillStyle = '#ddd6fe'; c.font = '800 12px system-ui'; c.fillText(lo, l, by + 26); c.fillText(hi, r2, by + 26);
        hist.forEach(function (h) { var hx = bx + bw * (h.n - 0.5) / M; c.fillStyle = h.d ? '#fbbf24' : '#22c55e'; c.fillRect(hx - 1, by - 4, 2, 20); });
        // подсказка
        c.fillStyle = '#f5f3ff'; c.font = '800 17px system-ui'; c.fillText(hint, W / 2, by + 56);
        // экран ввода
        var sx = shakeT > 0 ? Math.sin(shakeT * 70) * 10 * shakeT / 0.35 : 0, dw = Math.min(240, W - 60), dh = 86, dy = H * 0.3;
        c.save(); c.translate(sx, 0);
        c.shadowColor = winT > 0 ? '#22c55e' : '#8b5cf6'; c.shadowBlur = 18 + Math.sin(pulse * 3) * 6;
        K.rr(c, W / 2 - dw / 2, dy, dw, dh, 20); c.fillStyle = '#0b0820'; c.fill(); c.shadowBlur = 0;
        c.strokeStyle = winT > 0 ? '#22c55e' : '#7c3aed'; c.lineWidth = 2.5; c.stroke();
        c.fillStyle = '#fff'; c.font = '900 52px system-ui';
        c.fillText(winT > 0 ? secret : input || (Math.floor(pulse * 2) % 2 ? '_' : ' '), W / 2, dy + dh / 2 + 2);
        c.restore();
        // история попыток
        var chips = hist.slice(-6), cw2 = 54, cx0 = W / 2 - (chips.length * (cw2 + 6) - 6) / 2;
        chips.forEach(function (h, i2) {
          var x = cx0 + i2 * (cw2 + 6), y = dy + dh + 18;
          K.rr(c, x, y, cw2, 28, 14); c.fillStyle = h.d ? 'rgba(251,191,36,.18)' : 'rgba(34,197,94,.25)'; c.fill();
          c.fillStyle = h.d ? '#fde68a' : '#86efac'; c.font = '800 13px system-ui'; c.fillText(h.n + (h.d > 0 ? ' ↑' : h.d < 0 ? ' ↓' : ' ✓'), x + cw2 / 2, y + 15);
        });
        for (var r = 0; r < KEYS.length; r++) for (var q2 = 0; q2 < 3; q2++) {
          var k = KEYS[r][q2], kx = x0 + q2 * cell, ky = y0 + r * cell;
          K.key(c, kx + 4, ky + 4, cell - 8, cell - 8, k === 'OK' ? '#16a34a' : k === '⌫' ? '#9f1239' : '#4c1d95', k, '900 ' + Math.round(cell * 0.36) + 'px system-ui');
        }
      }
    };
  }
};
