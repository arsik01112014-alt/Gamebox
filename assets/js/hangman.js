/* Виселица: угадывай загаданное слово по буквам */
window.GAMES = window.GAMES || {};
window.GAMES.hangman = {
  title: 'Виселица', desc: 'Угадай слово по буквам', cat: 'puzzle', isNew4: true, medals: [400, 1000, 1800],
  hint: 'Выбирай буквы внизу. Угаданные буквы открываются в слове, ошибки рисуют виселицу. На 6 ошибках игра заканчивается. За каждое отгаданное слово даются очки, без ошибок — больше.',
  d0: 'Слова до 7 букв', d1: 'Слова до 9 букв', d2: 'Слова до 11 букв', d3: 'Любые слова, больше очков',
  colors: ['#64748b', '#334155'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#f1f5f9"/><path d="M26 84V18h38v12" fill="none" stroke="#334155" stroke-width="6" stroke-linecap="round"/><circle cx="64" cy="40" r="9" fill="none" stroke="#ef4444" stroke-width="5"/><path d="M64 49v16M64 56l-8 7M64 56l8 7M64 65l-6 12M64 65l6 12" stroke="#ef4444" stroke-width="5" stroke-linecap="round" fill="none"/></svg>',
  create: function (api) {
    var WORDS = ['КОТ', 'ДОМ', 'ЛЕС', 'ИГРА', 'МЯЧ', 'ОКНО', 'РЕКА', 'ШКОЛА', 'ЗВЕЗДА', 'ОБЛАКО', 'СОЛНЦЕ', 'ГОРОД',
      'ВЕСНА', 'КНИГА', 'ЯБЛОКО', 'ЧАЙНИК', 'ДЕРЕВО', 'ПЛАНЕТА', 'ТРАМВАЙ', 'ЗЕРКАЛО', 'ПИРАМИДА', 'ЛОДКА', 'ФОНАРЬ',
      'МАГНИТ', 'ВОДОПАД', 'ПОДАРОК', 'ТЕЛЕФОН', 'КОМПЬЮТЕР', 'МОРОЖЕНОЕ', 'БИБЛИОТЕКА', 'ШОКОЛАД', 'ВЕЛОСИПЕД', 'КАЛЕЙДОСКОП'];
    var ALPHA = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ', PER = 11, MAXW = 6, MAXLEN = [7, 9, 11, 99];
    var word, used, wrong;
    function pick() {
      var pool = WORDS.filter(function (w) { return w.length <= MAXLEN[api.diff]; });
      word = pool[Math.floor(Math.random() * pool.length)]; used = {}; wrong = 0;
    }
    function geom() {
      var cell = Math.floor((api.W - 16) / PER);
      return { cell: cell, x0: (api.W - cell * PER) / 2, y0: api.H - 3 * cell - 12 };
    }
    function guess(ch) {
      used[ch] = true;
      if (word.indexOf(ch) >= 0) {
        api.sound('click'); api.vibrate(10);
        var open = word.split('').every(function (x) { return used[x]; });
        if (!open) return;
        api.addScore(Math.round((60 + word.length * 15) * (api.diff + 1) * (1 + (MAXW - wrong) / 10)));
        api.fx.confetti(30); api.sound('win'); pick();
        return;
      }
      wrong++; api.sound('hit'); api.vibrate(40);
      if (wrong >= MAXW) api.gameOver();
    }
    return {
      reset: function () { pick(); },
      resize: function () { }, idle: function () { }, update: function () { }, key: function () { },
      input: function (type, d) {
        if (type !== 'down') return;
        var g = geom(), c = Math.floor((d.x - g.x0) / g.cell), r = Math.floor((d.y - g.y0) / g.cell);
        if (c < 0 || c >= PER || r < 0 || r >= 3) return;
        var ch = ALPHA[r * PER + c];
        if (ch && !used[ch]) guess(ch);
      },
      draw: function (c) {
        var W = api.W, H = api.H, g = geom(), cx = W / 2;
        c.fillStyle = '#0f172a'; c.fillRect(0, 0, W, H);
        c.strokeStyle = '#94a3b8'; c.lineWidth = 6; c.lineCap = 'round';
        c.beginPath();
        c.moveTo(cx - 110, 200); c.lineTo(cx - 30, 200);
        c.moveTo(cx - 70, 200); c.lineTo(cx - 70, 60); c.lineTo(cx + 10, 60); c.lineTo(cx + 10, 84);
        c.stroke();
        c.strokeStyle = '#f8fafc'; c.beginPath();
        if (wrong > 0) { c.moveTo(cx + 30, 104); c.arc(cx + 10, 104, 20, 0, 6.283); }
        if (wrong > 1) { c.moveTo(cx + 10, 124); c.lineTo(cx + 10, 160); }
        if (wrong > 2) { c.moveTo(cx + 10, 135); c.lineTo(cx - 10, 150); }
        if (wrong > 3) { c.moveTo(cx + 10, 135); c.lineTo(cx + 30, 150); }
        if (wrong > 4) { c.moveTo(cx + 10, 160); c.lineTo(cx - 10, 185); }
        if (wrong > 5) { c.moveTo(cx + 10, 160); c.lineTo(cx + 30, 185); }
        c.stroke();
        var sp = Math.min(34, (W - 24) / word.length), wy = g.y0 - 70;
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#f8fafc';
        c.font = '800 ' + Math.round(sp * 0.8) + 'px system-ui';
        for (var j = 0; j < word.length; j++) c.fillText(used[word[j]] ? word[j] : '_', cx + (j - (word.length - 1) / 2) * sp, wy);
        c.font = '700 15px system-ui'; c.fillStyle = '#cbd5e1';
        c.fillText('Ошибки: ' + wrong + ' / ' + MAXW, cx, g.y0 - 28);
        for (var i = 0; i < ALPHA.length; i++) {
          var ch = ALPHA[i], bx = g.x0 + (i % PER) * g.cell, by = g.y0 + Math.floor(i / PER) * g.cell;
          c.fillStyle = !used[ch] ? '#1e293b' : word.indexOf(ch) >= 0 ? '#166534' : '#7f1d1d';
          c.fillRect(bx + 2, by + 2, g.cell - 4, g.cell - 4);
          c.fillStyle = used[ch] ? '#64748b' : '#f8fafc';
          c.font = '700 ' + Math.round(g.cell * 0.5) + 'px system-ui';
          c.fillText(ch, bx + g.cell / 2, by + g.cell / 2 + 1);
        }
      }
    };
  }
};
