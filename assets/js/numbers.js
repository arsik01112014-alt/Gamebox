/* Таблица Шульте: нажимай числа по порядку */
window.GAMES = window.GAMES || {};
window.GAMES.numbers = {
  title: 'Числа по порядку', desc: 'Найди числа от 1 до конца', cat: 'puzzle', isNew4: true, medals: [1500, 4000, 8000],
  hint: 'Нажимай числа по порядку, начиная с 1. Чем быстрее закрыта таблица, тем больше очков. Ошибка — минус время; три ошибки подряд — конец. На высоких сложностях цифры перемешиваются.',
  d0: 'Поле 3×3', d1: 'Поле 4×4', d2: 'Поле 5×5', d3: 'Поле 5×5, цифры перемешиваются',
  colors: ['#0ea5e9', '#6366f1'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="12" y="12" width="76" height="76" rx="12" fill="#fff"/><g font-family="sans-serif" font-weight="800" font-size="22" fill="#4338ca" text-anchor="middle"><text x="30" y="40">3</text><text x="50" y="40" fill="#0ea5e9">1</text><text x="70" y="40">5</text><text x="30" y="66">2</text><text x="50" y="66">7</text><text x="70" y="66">4</text><text x="30" y="88" font-size="0">.</text></g></svg>',
  create: function (api) {
    var N, cells, next, t0, left, strikes, flash, gx, gy, cs;
    function shuffle() { var a = []; for (var i = 1; i <= N * N; i++) a.push(i); for (i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } cells = a; }
    function layout() { cs = Math.floor(Math.min(api.W - 24, api.H - 120) / N); gx = (api.W - cs * N) / 2; gy = 70 + (api.H - 100 - cs * N) / 2; }
    function round() { shuffle(); next = 1; t0 = left; layout(); }
    return {
      reset: function () { N = [3, 4, 5, 5][api.diff]; left = 90; strikes = 0; flash = null; round(); },
      resize: layout, idle: function () { }, key: function () { },
      input: function (type, d) {
        if (type !== 'down') return;
        var c = Math.floor((d.x - gx) / cs), r = Math.floor((d.y - gy) / cs);
        if (c < 0 || r < 0 || c >= N || r >= N) return;
        var k = r * N + c, v = cells[k];
        if (v === next) {
          api.sound('click'); flash = { k: k, ok: 1, t: 0.2 }; next++;
          if (api.diff === 3) shuffle();
          if (next > N * N) { var took = t0 - left; api.addScore(Math.max(50, Math.round(N * N * 60 - took * 12))); api.fx.confetti(30); api.sound('win'); left += 8; N = Math.min(5, N); round(); }
        } else { strikes++; left -= 4; flash = { k: k, ok: 0, t: 0.3 }; api.sound('hit'); api.vibrate(40); if (strikes >= 3) api.gameOver(); }
      },
      update: function (dt) { left -= dt; if (flash) { flash.t -= dt; if (flash.t <= 0) flash = null; } if (left <= 0) api.gameOver(); },
      draw: function (c) {
        var W = api.W; c.fillStyle = '#0f172a'; c.fillRect(0, 0, W, api.H);
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '800 18px system-ui'; c.fillStyle = left < 10 ? '#f87171' : '#e2e8f0';
        c.fillText('⏱ ' + Math.max(0, Math.ceil(left)) + '   →  ' + Math.min(next, N * N) + '/' + N * N + '   ' + '✖'.repeat(strikes), W / 2, 42);
        for (var i = 0; i < N * N; i++) {
          var x = gx + (i % N) * cs, y = gy + Math.floor(i / N) * cs, v = cells[i], done = v < next, f = flash && flash.k === i;
          c.fillStyle = f ? (flash.ok ? '#22c55e' : '#ef4444') : done ? '#1e293b' : '#e2e8f0';
          c.beginPath(); c.roundRect ? c.roundRect(x + 3, y + 3, cs - 6, cs - 6, 12) : c.rect(x + 3, y + 3, cs - 6, cs - 6); c.fill();
          if (!done) { c.fillStyle = v === next && api.diff === 0 ? '#0ea5e9' : '#0f172a'; c.font = '900 ' + Math.round(cs * 0.45) + 'px system-ui'; c.fillText(String(v), x + cs / 2, y + cs / 2 + 2); }
        }
      }
    };
  }
};
