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
    var word, rows, marks, cur, keys, msg, msgT, pops, flipT, flipRow, shakeT, endT;
    var K = window.GBK;
    function newWord() { word = WORDS[Math.floor(Math.random() * WORDS.length)]; rows = []; marks = []; cur = ''; keys = {}; pops = [0, 0, 0, 0, 0]; flipRow = -1; flipT = 0; }
    function say(s) { msg = s; msgT = 2.2; }
    function grade(g) {
      var res = [0, 0, 0, 0, 0], left = {}, i;
      for (i = 0; i < 5; i++) { if (g[i] === word[i]) res[i] = 2; else left[word[i]] = (left[word[i]] || 0) + 1; }
      for (i = 0; i < 5; i++) if (res[i] !== 2 && left[g[i]] > 0) { res[i] = 1; left[g[i]]--; }
      return res;
    }
    function kb() {
      var cell = Math.floor((api.W - 12) / PER), kh = Math.floor(cell * 1.3);
      return { cell: cell, kh: kh, x0: (api.W - cell * PER) / 2, y0: api.H - 4 * kh - 14 };
    }
    function board() {
      var n = TRIES[api.diff], k = kb(), s = Math.floor(Math.min(62, (api.W - 40) / 5, (k.y0 - 110) / n));
      return { s: s, x0: (api.W - s * 5) / 2, y0: 86 };
    }
    function submit() {
      if (cur.length !== 5) { say('Нужно 5 букв'); shakeT = 0.4; api.sound('hit'); return; }
      var m = grade(cur);
      rows.push(cur); marks.push(m); flipRow = rows.length - 1; flipT = 0;
      for (var i = 0; i < 5; i++) keys[cur[i]] = Math.max(keys[cur[i]] === undefined ? -1 : keys[cur[i]], m[i]);
      if (cur === word) {
        api.addScore(100 * (api.diff + 1) * (TRIES[api.diff] - rows.length + 1));
        api.sound('win'); say('Верно! ' + word); cur = ''; winT = 1.6; return;
      }
      cur = ''; api.sound('click');
      if (rows.length >= TRIES[api.diff]) { say('Было слово: ' + word); api.sound('hit'); loseT = 2; }
    }
    var winT = 0, loseT = 0;
    return {
      reset: function () { newWord(); msg = ''; msgT = 0; shakeT = 0; winT = 0; loseT = 0; },
      resize: function () { }, idle: function () { }, key: function () { },
      update: function (dt) {
        if (msgT > 0) msgT -= dt; if (shakeT > 0) shakeT -= dt; flipT += dt;
        for (var i = 0; i < 5; i++) if (pops[i] > 0) pops[i] = Math.max(0, pops[i] - dt * 5);
        if (winT > 0) { winT -= dt; if (winT <= 0) { api.fx.confetti(30); newWord(); } }
        if (loseT > 0) { loseT -= dt; if (loseT <= 0) api.gameOver(); }
      },
      input: function (type, d) {
        if (type !== 'down' || winT > 0 || loseT > 0) return;
        var k = kb(), c = Math.floor((d.x - k.x0) / k.cell), r = Math.floor((d.y - k.y0) / k.kh);
        if (r < 0 || r > 3 || c < 0 || c >= PER) return;
        if (r === 3) { if (c < PER / 2) { cur = cur.slice(0, -1); api.sound('click'); } else submit(); return; }
        var ch = ALPHA[r * PER + c];
        if (ch && cur.length < 5) { pops[cur.length] = 1; cur += ch; api.sound('click'); api.vibrate(6); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, b = board(), k = kb(), n = TRIES[api.diff];
        K.bg(c, W, H, '#0f172a', '#1e1b4b', 'rgba(34,197,94,.10)');
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = '#e2e8f0'; c.font = '900 22px system-ui'; c.fillText('ПЯТЬ БУКВ', W / 2, 34);
        c.fillStyle = '#94a3b8'; c.font = '700 13px system-ui'; c.fillText('Попыток осталось: ' + (n - rows.length), W / 2, 60);
        for (var r = 0; r < n; r++) {
          var sx = r === rows.length && shakeT > 0 ? Math.sin(shakeT * 60) * 8 * shakeT / 0.4 : 0;
          for (var i = 0; i < 5; i++) {
            var x = b.x0 + i * b.s + sx, y = b.y0 + r * b.s, done = r < rows.length, ch = done ? rows[r][i] : r === rows.length ? cur[i] : '';
            // переворот плитки при проверке, по очереди слева направо
            var sc = 1, showCol = done;
            if (done && r === flipRow) { var ft = Math.max(0, Math.min(1, (flipT - i * 0.18) / 0.3)); sc = Math.abs(Math.cos(ft * Math.PI)); showCol = ft > 0.5; }
            var pp = r === rows.length && pops[i] ? 1 + pops[i] * 0.12 : 1;
            c.save(); c.translate(x + b.s / 2, y + b.s / 2); c.scale(pp, Math.max(0.05, sc) * pp);
            var s2 = b.s - 7;
            if (showCol) {
              var col = ['#3f3f46', '#d4a017', '#22a052'][marks[r][i]];
              K.rr(c, -s2 / 2, -s2 / 2, s2, s2, 8); c.fillStyle = col; c.fill();
              c.fillStyle = 'rgba(255,255,255,.16)'; K.rr(c, -s2 / 2 + 3, -s2 / 2 + 3, s2 - 6, s2 * 0.3, 5); c.fill();
            } else {
              K.rr(c, -s2 / 2, -s2 / 2, s2, s2, 8); c.fillStyle = ch ? '#1e293b' : 'rgba(30,41,59,.55)'; c.fill();
              c.strokeStyle = ch ? '#64748b' : '#334155'; c.lineWidth = 2; c.stroke();
            }
            if (ch) { c.fillStyle = '#fff'; c.font = '900 ' + Math.round(b.s * 0.5) + 'px system-ui'; c.fillText(ch, 0, 2); }
            c.restore();
          }
        }
        for (var j = 0; j < ALPHA.length; j++) {
          var L = ALPHA[j], bx = k.x0 + (j % PER) * k.cell, by = k.y0 + Math.floor(j / PER) * k.kh, st = keys[L];
          var kc = st === undefined || st < 0 ? '#475569' : st === 0 ? '#27272a' : st === 1 ? '#b8860b' : '#16a34a';
          K.key(c, bx + 2, by + 3, k.cell - 4, k.kh - 6, kc, L, '800 ' + Math.round(k.cell * 0.46) + 'px system-ui', st === 0 ? '#71717a' : '#fff');
        }
        var yb = k.y0 + 3 * k.kh, half = k.cell * PER / 2;
        K.key(c, k.x0 + 2, yb + 3, half - 4, k.kh - 6, '#9f1239', '⌫  Стереть', '800 16px system-ui');
        K.key(c, k.x0 + half + 2, yb + 3, half - 4, k.kh - 6, '#15803d', 'Проверить', '800 16px system-ui');
        K.toast(c, W, b.y0 + n * b.s + 22, msg, msgT);
      }
    };
  }
};
