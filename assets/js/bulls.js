/* Быки и коровы: угадай 4 разные цифры по подсказкам «быков» и «коров» */
window.GAMES = window.GAMES || {};
window.GAMES.bulls = {
  title: 'Быки и коровы', desc: 'Угадай 4 цифры', cat: 'puzzle', isNew4: true, medals: [600, 1500, 2500],
  hint: 'Загадано 4 разные цифры. Введи 4 цифры и нажми OK. Бык — цифра на своём месте, корова — цифра есть, но стоит не там. Угадай число за оставшиеся попытки. Три раунда подряд.',
  d0: '10 попыток', d1: '8 попыток', d2: '7 попыток', d3: '6 попыток',
  colors: ['#b45309', '#78350f'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#fef3c7"/><text x="50" y="58" font-size="26" font-family="sans-serif" font-weight="800" fill="#b45309" text-anchor="middle">4 1 7</text><text x="50" y="78" font-size="13" font-family="sans-serif" font-weight="700" fill="#78350f" text-anchor="middle">Б·К</text></svg>',
  create: function (api) {
    var TRIES = [10, 8, 7, 6], KEYS = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['⌫', '0', 'OK']];
    var secret, input, tries, round, log, cell, x0, y0;
    function layout() { cell = Math.floor(Math.min(api.W / 3, api.H * 0.4 / 4)) - 6; x0 = (api.W - 3 * cell) / 2; y0 = api.H - 4 * cell - 10; }
    function newSecret() {
      var d = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], s = '';
      for (var i = 0; i < 4; i++) { var j = Math.floor(Math.random() * d.length); s += d[j]; d.splice(j, 1); }
      secret = s; tries = TRIES[api.diff]; input = ''; log = [];
    }
    function score(g) {
      var bulls = 0, cows = 0;
      for (var i = 0; i < 4; i++) {
        if (g[i] === secret[i]) bulls++;
        else if (secret.indexOf(g[i]) >= 0) cows++;
      }
      return { bulls: bulls, cows: cows };
    }
    function submit() {
      if (input.length !== 4 || new Set(input.split('')).size !== 4) return;
      var r = score(input);
      log.unshift(input + '  ' + r.bulls + 'Б ' + r.cows + 'К');
      log = log.slice(0, 5);
      input = '';
      if (r.bulls === 4) {
        api.addScore(Math.round(100 * (api.diff + 1) * (tries + 1)));
        api.fx.confetti(30); api.sound('win'); round++;
        if (round >= 3) { api.gameOver(); return; }
        newSecret(); return;
      }
      tries--; api.sound('click');
      if (tries <= 0) { api.sound('hit'); api.gameOver(); }
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
        else if (input.length < 4 && input.indexOf(k) < 0) input += k;
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        c.fillStyle = '#451a03'; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = '#fde68a'; c.font = '800 18px system-ui';
        c.fillText('Раунд ' + (round + 1) + ' / 3   ·   попыток: ' + tries, W / 2, 40);
        c.fillStyle = '#fff'; c.font = '900 48px system-ui';
        c.fillText((input + '____').slice(0, 4).split('').join(' '), W / 2, H * 0.3);
        c.font = '700 15px system-ui'; c.fillStyle = '#fef3c7';
        log.forEach(function (l, i) { c.fillText(l, W / 2, H * 0.4 + i * 24); });
        for (var r = 0; r < KEYS.length; r++) for (var q = 0; q < 3; q++) {
          var k = KEYS[r][q], bx = x0 + q * cell, by = y0 + r * cell;
          c.fillStyle = k === 'OK' ? '#16a34a' : '#78350f';
          c.fillRect(bx + 3, by + 3, cell - 6, cell - 6);
          c.fillStyle = '#fff'; c.font = '800 ' + Math.round(cell * 0.4) + 'px system-ui';
          c.fillText(k, bx + cell / 2, by + cell / 2 + 1);
        }
      }
    };
  }
};
