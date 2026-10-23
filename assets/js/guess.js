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
    var secret, input, tries, round, hint, cell, x0, y0;
    function layout() { cell = Math.floor(Math.min(api.W / 3, api.H * 0.4 / 4)) - 6; x0 = (api.W - 3 * cell) / 2; y0 = api.H - 4 * cell - 10; }
    function newSecret() { secret = 1 + Math.floor(Math.random() * MAX[api.diff]); tries = TRIES[api.diff]; input = ''; hint = 'Введи число от 1 до ' + MAX[api.diff]; }
    function submit() {
      var n = parseInt(input, 10);
      if (isNaN(n)) return;
      input = '';
      if (n === secret) {
        api.addScore(Math.round(100 * (api.diff + 1) * (tries + 1) / TRIES[api.diff] * 3));
        api.fx.confetti(30); api.sound('win'); round++;
        if (round >= 5) { api.gameOver(); return; }
        newSecret(); return;
      }
      tries--; api.sound('hit'); api.vibrate(20);
      hint = n < secret ? 'Больше, чем ' + n : 'Меньше, чем ' + n;
      if (tries <= 0) api.gameOver();
    }
    return {
      reset: function () { round = 0; layout(); newSecret(); },
      resize: function () { layout(); }, idle: function () { }, update: function () { }, key: function () { },
      input: function (type, d) {
        if (type !== 'down' || d.y < y0) return;
        var c = Math.floor((d.x - x0) / cell), r = Math.floor((d.y - y0) / cell), k = KEYS[r] && KEYS[r][c];
        if (!k) return;
        api.sound('click');
        if (k === 'OK') submit();
        else if (k === '⌫') input = input.slice(0, -1);
        else if (input.length < 3) input += k;
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        c.fillStyle = '#1e1b4b'; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = '#e9d5ff'; c.font = '800 18px system-ui';
        c.fillText('Раунд ' + (round + 1) + ' / 5   ·   попыток: ' + tries, W / 2, 40);
        c.font = '700 16px system-ui'; c.fillText(hint, W / 2, 80);
        c.fillStyle = '#fff'; c.font = '900 56px system-ui';
        c.fillText(input || '·', W / 2, H * 0.35);
        for (var r = 0; r < KEYS.length; r++) for (var q = 0; q < 3; q++) {
          var k = KEYS[r][q], bx = x0 + q * cell, by = y0 + r * cell;
          c.fillStyle = k === 'OK' ? '#16a34a' : '#4c1d95';
          c.fillRect(bx + 3, by + 3, cell - 6, cell - 6);
          c.fillStyle = '#fff'; c.font = '800 ' + Math.round(cell * 0.4) + 'px system-ui';
          c.fillText(k, bx + cell / 2, by + cell / 2 + 1);
        }
      }
    };
  }
};
