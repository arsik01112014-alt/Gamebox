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
    var word, used, wrong, t, popT, winT, loseT, msg, msgT, K = window.GBK;
    function pick() {
      var pool = WORDS.filter(function (w) { return w.length <= MAXLEN[api.diff]; });
      word = pool[Math.floor(Math.random() * pool.length)]; used = {}; wrong = 0; popT = {};
    }
    function geom() {
      var cell = Math.floor((api.W - 12) / PER), kh = Math.floor(cell * 1.25);
      return { cell: cell, kh: kh, x0: (api.W - cell * PER) / 2, y0: api.H - 3 * kh - 14 };
    }
    function guess(ch) {
      used[ch] = true;
      if (word.indexOf(ch) >= 0) {
        api.sound('click'); api.vibrate(10); popT[ch] = 1;
        var open = word.split('').every(function (x) { return used[x]; });
        if (!open) return;
        api.addScore(Math.round((60 + word.length * 15) * (api.diff + 1) * (1 + (MAXW - wrong) / 10)));
        api.fx.confetti(30); api.sound('win'); msg = wrong ? 'Отгадал!' : 'Без единой ошибки!'; msgT = 1.4; winT = 1.4;
        return;
      }
      wrong++; api.sound('hit'); api.vibrate(40); api.fx.shake(3);
      if (wrong >= MAXW) { loseT = 2.2; msg = 'Было слово: ' + word; msgT = 2.2; }
    }
    return {
      reset: function () { t = 0; winT = 0; loseT = 0; msg = ''; msgT = 0; pick(); },
      resize: function () { }, idle: function (dt) { t += dt || 0; }, key: function () { },
      update: function (dt) {
        t += dt; if (msgT > 0) msgT -= dt;
        for (var k in popT) if (popT[k] > 0) popT[k] = Math.max(0, popT[k] - dt * 4);
        if (winT > 0) { winT -= dt; if (winT <= 0) pick(); }
        if (loseT > 0) { loseT -= dt; if (loseT <= 0) api.gameOver(); }
      },
      input: function (type, d) {
        if (type !== 'down' || winT > 0 || loseT > 0) return;
        var g = geom(), c = Math.floor((d.x - g.x0) / g.cell), r = Math.floor((d.y - g.y0) / g.kh);
        if (c < 0 || c >= PER || r < 0 || r >= 3) return;
        var ch = ALPHA[r * PER + c];
        if (ch && !used[ch]) guess(ch);
      },
      draw: function (c) {
        var W = api.W, H = api.H, g = geom(), cx = W / 2, sceneH = Math.min(250, g.y0 - 120), gy = 30 + sceneH;
        // небо и холмы
        var sky = c.createLinearGradient(0, 0, 0, gy); sky.addColorStop(0, '#1e3a8a'); sky.addColorStop(1, '#f59e0b');
        c.fillStyle = sky; c.fillRect(0, 0, W, gy);
        c.fillStyle = 'rgba(254,243,199,.85)'; c.beginPath(); c.arc(W * 0.8, gy - sceneH * 0.45, 22, 0, 6.283); c.fill();
        c.fillStyle = '#365314'; c.beginPath(); c.moveTo(0, gy); c.quadraticCurveTo(W * 0.25, gy - 50, W * 0.5, gy - 12); c.quadraticCurveTo(W * 0.75, gy - 46, W, gy - 8); c.lineTo(W, gy); c.fill();
        c.fillStyle = '#1a2e05'; c.fillRect(0, gy, W, H - gy);
        c.fillStyle = '#0f172a'; c.fillRect(0, gy + 6, W, H - gy);
        // деревянная виселица
        var bx = cx - 90, topY = gy - sceneH + 20;
        function beam(x, y, w, h) { var wg = c.createLinearGradient(x, y, x + w, y + h); wg.addColorStop(0, '#a16207'); wg.addColorStop(1, '#713f12'); c.fillStyle = wg; c.fillRect(x, y, w, h); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
        beam(bx - 40, gy - 10, 100, 12); beam(bx - 6, topY, 12, gy - topY - 8); beam(bx - 6, topY, 112, 11);
        c.strokeStyle = '#713f12'; c.lineWidth = 8; c.beginPath(); c.moveTo(bx + 4, topY + 34); c.lineTo(bx + 30, topY + 10); c.stroke();
        // верёвка и человечек — покачиваются
        var ax = bx + 96, ay = topY + 10, sway = wrong ? Math.sin(t * 1.6) * (loseT > 0 ? 0.12 : 0.05) : 0;
        c.save(); c.translate(ax, ay); c.rotate(sway);
        c.strokeStyle = '#d6b370'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 30); c.stroke();
        var hs = Math.min(18, sceneH * 0.08), hy = 30 + hs, body = '#f8fafc';
        c.lineCap = 'round'; c.lineWidth = 5; c.strokeStyle = body;
        if (wrong > 0) {
          c.fillStyle = '#fcd9b6'; c.beginPath(); c.arc(0, hy, hs, 0, 6.283); c.fill();
          c.fillStyle = '#1f2937';
          if (loseT > 0) { c.lineWidth = 2; c.strokeStyle = '#1f2937'; [-6, 6].forEach(function (ex) { c.beginPath(); c.moveTo(ex - 3, hy - 5); c.lineTo(ex + 3, hy + 1); c.moveTo(ex + 3, hy - 5); c.lineTo(ex - 3, hy + 1); c.stroke(); }); }
          else { c.beginPath(); c.arc(-6, hy - 2, 2, 0, 6.283); c.arc(6, hy - 2, 2, 0, 6.283); c.fill(); }
          c.strokeStyle = '#1f2937'; c.lineWidth = 2; c.beginPath(); c.arc(0, hy + 9, 5, wrong >= 4 ? 1.15 * Math.PI : 0.15 * Math.PI, wrong >= 4 ? 1.85 * Math.PI : 0.85 * Math.PI); c.stroke();
          c.strokeStyle = '#d6b370'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, hy + hs - 2, hs * 0.55, 4, 0, 0, 6.283); c.stroke();
        }
        c.lineWidth = 6; c.strokeStyle = '#38bdf8';
        var ny = hy + hs, by2 = ny + hs * 2.4;
        c.beginPath();
        if (wrong > 1) { c.moveTo(0, ny); c.lineTo(0, by2); }
        if (wrong > 2) { c.moveTo(0, ny + 8); c.lineTo(-hs * 1.2, ny + hs * 1.5); }
        if (wrong > 3) { c.moveTo(0, ny + 8); c.lineTo(hs * 1.2, ny + hs * 1.5); }
        c.stroke(); c.strokeStyle = '#1e3a8a'; c.beginPath();
        if (wrong > 4) { c.moveTo(0, by2); c.lineTo(-hs, by2 + hs * 1.8); }
        if (wrong > 5) { c.moveTo(0, by2); c.lineTo(hs, by2 + hs * 1.8); }
        c.stroke(); c.restore();
        // жизни
        for (var hI = 0; hI < MAXW; hI++) K.heart(c, W - 24 - hI * 22, 22, 17, hI < MAXW - wrong ? '#f43f5e' : 'rgba(255,255,255,.25)');
        // слово
        var sp = Math.min(36, (W - 24) / word.length), wy = gy + Math.max(34, (g.y0 - gy) / 2 - 6);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        for (var j = 0; j < word.length; j++) {
          var x = cx + (j - (word.length - 1) / 2) * sp, open = used[word[j]] || loseT > 0, pp = 1 + (popT[word[j]] || 0) * 0.3;
          K.rr(c, x - sp / 2 + 2, wy - sp * 0.62, sp - 4, sp * 1.12, 6); c.fillStyle = open ? (used[word[j]] ? 'rgba(34,197,94,.22)' : 'rgba(239,68,68,.25)') : 'rgba(255,255,255,.06)'; c.fill();
          c.fillStyle = '#94a3b8'; c.fillRect(x - sp / 2 + 5, wy + sp * 0.42, sp - 10, 3);
          if (open) { c.save(); c.translate(x, wy); c.scale(pp, pp); c.fillStyle = used[word[j]] ? '#f8fafc' : '#fca5a5'; c.font = '900 ' + Math.round(sp * 0.68) + 'px system-ui'; c.fillText(word[j], 0, 0); c.restore(); }
        }
        for (var i = 0; i < ALPHA.length; i++) {
          var ch = ALPHA[i], kx = g.x0 + (i % PER) * g.cell, ky = g.y0 + Math.floor(i / PER) * g.kh;
          var col = !used[ch] ? '#334155' : word.indexOf(ch) >= 0 ? '#15803d' : '#7f1d1d';
          K.key(c, kx + 2, ky + 3, g.cell - 4, g.kh - 6, col, ch, '800 ' + Math.round(g.cell * 0.48) + 'px system-ui', used[ch] ? 'rgba(255,255,255,.55)' : '#fff', !!used[ch]);
        }
        K.toast(c, W, gy + 22, msg, msgT);
      }
    };
  }
};
