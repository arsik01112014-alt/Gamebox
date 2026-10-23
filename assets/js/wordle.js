/* Пять букв: угадай слово из 5 букв по цветным подсказкам */
window.GAMES = window.GAMES || {};
window.GAMES.wordle = {
  title: 'Пять букв', desc: 'Угадай слово из 5 букв', cat: 'puzzle', isNew4: true, medals: [500, 1500, 3000],
  hint: 'Набери слово из 5 букв и нажми OK. Зелёная буква стоит на своём месте, жёлтая есть в слове, но в другом месте, серой нет совсем. Угадал — следующее слово, не угадал за отведённые попытки — конец игры.',
  d0: '7 попыток', d1: '6 попыток', d2: '5 попыток', d3: '4 попытки',
  colors: ['#16a34a', '#ca8a04'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#1f2937"/><rect x="16" y="38" width="20" height="24" rx="3" fill="#16a34a"/><rect x="40" y="38" width="20" height="24" rx="3" fill="#ca8a04"/><rect x="64" y="38" width="20" height="24" rx="3" fill="#6b7280"/></svg>',
  create: function (api) {
    var WORDS = ['КНИГА', 'ЛАМПА', 'ПЕСОК', 'ВОЛНА', 'РУЧКА', 'СТЕНА', 'ГОРОД', 'КОШКА', 'ЗЕБРА', 'ЖИРАФ', 'ПОЕЗД', 'МЕТРО',
      'ОКЕАН', 'ЛИМОН', 'БАНАН', 'ГРУША', 'ВИШНЯ', 'СЛИВА', 'ТЫКВА', 'ПОВАР', 'ПИЛОТ', 'ШКОЛА', 'ПАРТА', 'РЕЧКА', 'ТУЧКА',
      'ВЕТЕР', 'ВЕСНА', 'ОСЕНЬ', 'ЛОДКА', 'БАШНЯ', 'ЗАМОК', 'ПРИНЦ', 'КАРТА', 'ИГРОК', 'ФИШКА', 'КУБИК', 'МЯЧИК', 'ФЕРЗЬ',
      'ПЕШКА', 'ЛАДЬЯ'].filter(function (w) { return w.length === 5; });
    var ALPHA = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ', PER = 11, TRIES = [7, 6, 5, 4];
    var COL = ['#374151', '#ca8a04', '#16a34a'];
    var word, rows, marks, cur, keys, msg;
    function newWord() { word = WORDS[Math.floor(Math.random() * WORDS.length)]; rows = []; marks = []; cur = ''; keys = {}; msg = ''; }
    function grade(g) {
      var res = [0, 0, 0, 0, 0], left = {}, i;
      for (i = 0; i < 5; i++) { if (g[i] === word[i]) res[i] = 2; else left[word[i]] = (left[word[i]] || 0) + 1; }
      for (i = 0; i < 5; i++) if (res[i] !== 2 && left[g[i]] > 0) { res[i] = 1; left[g[i]]--; }
      return res;
    }
    function kb() {
      var cell = Math.floor((api.W - 16) / PER);
      return { cell: cell, x0: (api.W - cell * PER) / 2, y0: api.H - 4 * cell - 12 };
    }
    function board() {
      var n = TRIES[api.diff], k = kb(), s = Math.floor(Math.min(56, (api.W - 40) / 5, (k.y0 - 80) / n));
      return { s: s, x0: (api.W - s * 5) / 2, y0: 60 };
    }
    function submit() {
      if (cur.length !== 5) { msg = 'Нужно 5 букв'; return; }
      var m = grade(cur);
      rows.push(cur); marks.push(m);
      for (var i = 0; i < 5; i++) keys[cur[i]] = Math.max(keys[cur[i]] === undefined ? -1 : keys[cur[i]], m[i]);
      if (cur === word) {
        api.addScore(100 * (api.diff + 1) * (TRIES[api.diff] - rows.length + 1));
        api.fx.confetti(30); api.sound('win'); newWord(); msg = 'Верно! Новое слово'; return;
      }
      cur = ''; api.sound('click');
      if (rows.length >= TRIES[api.diff]) { msg = 'Было слово: ' + word; api.sound('hit'); api.gameOver(); }
    }
    return {
      reset: function () { newWord(); },
      resize: function () { }, idle: function () { }, update: function () { }, key: function () { },
      input: function (type, d) {
        if (type !== 'down') return;
        var k = kb(), c = Math.floor((d.x - k.x0) / k.cell), r = Math.floor((d.y - k.y0) / k.cell);
        if (r < 0 || r > 3 || c < 0 || c >= PER) return;
        if (r === 3) { if (c < PER / 2) cur = cur.slice(0, -1); else submit(); return; }
        var ch = ALPHA[r * PER + c];
        if (ch && cur.length < 5) { cur += ch; msg = ''; api.sound('click'); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, b = board(), k = kb(), n = TRIES[api.diff];
        c.fillStyle = '#111827'; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = '#f9fafb'; c.font = '700 16px system-ui'; c.fillText(msg || 'Угадай слово', W / 2, 30);
        for (var r = 0; r < n; r++) for (var i = 0; i < 5; i++) {
          var x = b.x0 + i * b.s, y = b.y0 + r * b.s, ch = r < rows.length ? rows[r][i] : r === rows.length ? cur[i] : '';
          c.fillStyle = r < rows.length ? COL[marks[r][i]] : '#1f2937';
          c.fillRect(x + 3, y + 3, b.s - 6, b.s - 6);
          if (ch) { c.fillStyle = '#fff'; c.font = '800 ' + Math.round(b.s * 0.5) + 'px system-ui'; c.fillText(ch, x + b.s / 2, y + b.s / 2 + 1); }
        }
        for (var j = 0; j < ALPHA.length; j++) {
          var L = ALPHA[j], bx = k.x0 + (j % PER) * k.cell, by = k.y0 + Math.floor(j / PER) * k.cell;
          c.fillStyle = keys[L] === undefined ? '#4b5563' : keys[L] < 0 ? '#4b5563' : keys[L] === 0 ? '#1f2937' : COL[keys[L]];
          c.fillRect(bx + 2, by + 2, k.cell - 4, k.cell - 4);
          c.fillStyle = '#fff'; c.font = '700 ' + Math.round(k.cell * 0.45) + 'px system-ui';
          c.fillText(L, bx + k.cell / 2, by + k.cell / 2 + 1);
        }
        var yb = k.y0 + 3 * k.cell, half = k.cell * PER / 2;
        c.fillStyle = '#7f1d1d'; c.fillRect(k.x0 + 2, yb + 2, half - 4, k.cell - 4);
        c.fillStyle = '#15803d'; c.fillRect(k.x0 + half + 2, yb + 2, half - 4, k.cell - 4);
        c.fillStyle = '#fff'; c.font = '800 16px system-ui';
        c.fillText('⌫ Стереть', k.x0 + half / 2, yb + k.cell / 2); c.fillText('OK', k.x0 + half * 1.5, yb + k.cell / 2);
      }
    };
  }
};
