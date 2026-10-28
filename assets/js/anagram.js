/* Слова из слова: собери как можно больше слов из букв длинного слова */
window.GAMES = window.GAMES || {};
window.GAMES.anagram = {
  title: 'Слова из слова', desc: 'Составь слова из букв', cat: 'puzzle', isNew4: true, medals: [150, 400, 800],
  hint: 'Нажимай на буквы, чтобы составить слово, затем «✓». Подходят существительные в начальной форме из 3 и более букв. Каждую букву можно взять столько раз, сколько она встречается в слове. Чем длиннее слово, тем больше очков. Время ограничено!',
  d0: '3 минуты', d1: '2 минуты', d2: '90 секунд', d3: '60 секунд',
  colors: ['#9333ea', '#4c1d95'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#4c1d95"/><g fill="#f5f3ff"><rect x="12" y="20" width="16" height="18" rx="4"/><rect x="31" y="20" width="16" height="18" rx="4"/><rect x="50" y="20" width="16" height="18" rx="4"/><rect x="69" y="20" width="16" height="18" rx="4"/></g><g fill="#4c1d95" font-family="sans-serif" font-weight="900" font-size="13"><text x="15" y="34">К</text><text x="34" y="34">О</text><text x="53" y="34">Ш</text><text x="72" y="34">А</text></g><rect x="20" y="56" width="60" height="22" rx="8" fill="#a855f7"/><text x="28" y="72" fill="#fff" font-family="sans-serif" font-weight="900" font-size="14">КОТ ✓</text></svg>',
  create: function (api) {
    var BASE = ['ПРОГРАММИСТ', 'АПЕЛЬСИН', 'КАРАНДАШ', 'ВЕЛОСИПЕД', 'ПОДСОЛНУХ', 'КРОКОДИЛ', 'ТЕЛЕСКОП', 'ПАРАШЮТИСТ', 'ЧЕМОДАН', 'ЛАБИРИНТ', 'СНЕГОВИК', 'МОРОЖЕНОЕ', 'КОСМОНАВТ', 'ТРАМПЛИН', 'ПЕРЕКРЁСТОК', 'ЛОКОМОТИВ', 'ГОЛОВОЛОМКА', 'ПУТЕШЕСТВИЕ', 'КОНСТРУКТОР', 'КЛАВИАТУРА', 'ПРИКЛЮЧЕНИЕ', 'АВТОМОБИЛЬ', 'ЭЛЕКТРИЧКА', 'ВОДОПРОВОД'].map(function (w) { return w.replace(/Ё/g, 'Е'); });
    var TIME = [180, 120, 90, 60];
    var base, letters, pick, found, all, timeLeft, msg, msgT, t, shake, loading, endT;
    function dict() {
      if (window.RU_SET) return window.RU_SET;
      if (window.RU_WORDS) { window.RU_SET = new Set(window.RU_WORDS.split('\n')); window.RU_WORDS = null; return window.RU_SET; }
      if (!window.RU_LOADING) { window.RU_LOADING = true; var sc = document.createElement('script'); sc.src = 'js/data/ru-words.js'; sc.onerror = function () { window.RU_LOADING = false; }; document.head.appendChild(sc); }
      return null;
    }
    function count(w) { var m = {}; for (var i = 0; i < w.length; i++) m[w[i]] = (m[w[i]] || 0) + 1; return m; }
    function fits(w, bc) { var m = count(w); for (var k in m) if (!(bc[k] >= m[k])) return false; return true; }
    function computeAll() { var D = dict(); if (!D) return; var bc = count(base); all = []; D.forEach(function (w) { if (w.length >= 3 && w !== base && w.length <= base.length && fits(w.replace(/Ё/g, 'Е'), bc)) all.push(w.replace(/Ё/g, 'Е')); }); }
    function shuffle() { for (var i = letters.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = letters[i]; letters[i] = letters[j]; letters[j] = x; } pick = []; }
    function say(s) { msg = s; msgT = 1.4; }
    function word() { return pick.map(function (i) { return letters[i]; }).join(''); }
    function L() { // раскладка плиток
      var n = letters.length, per = n > 6 ? Math.ceil(n / 2) : n, s = Math.min(54, (api.W - 24) / per - 6);
      return { n: n, per: per, s: s, y0: api.H - 250 };
    }
    function tileXY(i) { var l = L(), row = Math.floor(i / l.per), m = row ? l.n - l.per : Math.min(l.n, l.per), k = i - row * l.per, w = m * (l.s + 6) - 6; return [(api.W - w) / 2 + k * (l.s + 6), l.y0 + row * (l.s + 8), l.s]; }
    function btns() { var y = api.H - 112, w = (api.W - 48) / 3; return [['clr', 16, y, w, 48, '⌫'], ['mix', 24 + w, y, w, 48, '🔀'], ['ok', 32 + w * 2, y, w, 48, '✓']]; }
    function submit() {
      var w = word(); if (w.length < 3) { say('Нужно хотя бы 3 буквы'); return; }
      if (found.indexOf(w) >= 0) { say('Уже было'); shake = 0.3; return; }
      var D = dict(); if (!D) { say('Словарь загружается…'); return; }
      if (!(D.has(w) || D.has(w.replace(/Е/g, 'Ё')))) { say('Нет такого слова'); shake = 0.3; api.sound('hit'); api.vibrate(30); pick = []; return; }
      found.unshift(w); pick = []; var pts = (w.length - 2) * (w.length - 2) * 5; api.addScore(pts); say('+' + pts + ' · ' + w); api.sound('coin'); api.vibrate(10);
      if (w.length >= 6) api.fx.confetti(20);
    }
    return {
      reset: function () {
        base = BASE[Math.floor(Math.random() * BASE.length)]; letters = base.split(''); shuffle(); found = []; all = null; timeLeft = TIME[api.diff]; endT = 0; msgT = 0; t = 0; shake = 0; loading = !dict();
      },
      resize: function () { }, idle: function (dt) { t += dt || 0; }, key: function (k, d) { if (!d) return; if (k === 'enter') submit(); if (k === 'backspace') pick.pop(); },
      input: function (type, d) {
        if (type !== 'down' || timeLeft <= 0) return;
        for (var i = 0; i < letters.length; i++) { var p = tileXY(i); if (pick.indexOf(i) < 0 && d.x >= p[0] && d.x <= p[0] + p[2] && d.y >= p[1] && d.y <= p[1] + p[2]) { pick.push(i); api.sound('click'); return; } }
        btns().forEach(function (b) { if (d.x >= b[1] && d.x <= b[1] + b[3] && d.y >= b[2] && d.y <= b[2] + b[4]) { if (b[0] === 'clr') pick.pop(); else if (b[0] === 'mix') shuffle(); else submit(); api.sound('click'); } });
        // нажатие на собранное слово сверху — стереть всё
        if (d.y > api.H - 330 && d.y < api.H - 270) pick = [];
      },
      update: function (dt) {
        t += dt; if (msgT > 0) msgT -= dt; if (shake > 0) shake -= dt;
        if (loading && dict()) { loading = false; }
        if (!all && dict()) computeAll();
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (timeLeft > 0) { timeLeft -= dt; if (timeLeft <= 0) { timeLeft = 0; api.sound('win'); endT = 3; } }
      },
      draw: function (c) {
        var W = api.W, H = api.H, K = window.GBK, g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#2e1065'); g.addColorStop(1, '#4c1d95'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = '#e9d5ff'; c.font = '700 13px system-ui'; c.fillText('Слово', W / 2, 22);
        c.fillStyle = '#fff'; c.font = '900 ' + Math.min(30, (W - 30) / base.length * 1.4) + 'px system-ui'; c.fillText(base, W / 2, 50);
        var tl = Math.ceil(timeLeft); c.font = '800 15px system-ui'; c.fillStyle = timeLeft < 10 ? '#fca5a5' : '#c4b5fd';
        c.fillText('⏱ ' + Math.floor(tl / 60) + ':' + ('0' + tl % 60).slice(-2) + '   найдено ' + found.length + (all ? ' из ' + all.length : ''), W / 2, 82);
        // найденные слова
        c.font = '700 14px system-ui'; var x = 16, y = 116, lh = 28;
        c.textAlign = 'left';
        for (var i = 0; i < found.length && y < H - 350; i++) {
          var w = c.measureText(found[i]).width + 20; if (x + w > W - 12) { x = 16; y += lh; if (y >= H - 350) break; }
          K.rr(c, x, y - 11, w, 24, 12); c.fillStyle = i === 0 && msgT > 0 ? '#a855f7' : 'rgba(255,255,255,.12)'; c.fill(); c.fillStyle = '#fff'; c.fillText(found[i], x + 10, y + 1); x += w + 6;
        }
        c.textAlign = 'center';
        if (timeLeft <= 0 && all) {
          var miss = all.filter(function (w) { return found.indexOf(w) < 0; }).sort(function (a, b) { return b.length - a.length; }).slice(0, 6);
          if (miss.length) { c.fillStyle = '#c4b5fd'; c.font = '700 13px system-ui'; c.fillText('Можно было: ' + miss.join(', '), W / 2, H - 340, W - 20); }
        }
        // собранное слово
        var cw = word(), sx = shake > 0 ? Math.sin(t * 60) * 6 : 0;
        K.rr(c, 20 + sx, H - 324, W - 40, 50, 16); c.fillStyle = 'rgba(0,0,0,.3)'; c.fill();
        c.fillStyle = '#fff'; c.font = '900 26px system-ui'; c.fillText(cw || (loading ? 'загрузка словаря…' : ''), W / 2 + sx, H - 298);
        letters.forEach(function (ch, i) {
          var p = tileXY(i), used = pick.indexOf(i) >= 0;
          K.key(c, p[0], p[1], p[2], p[2], used ? '#4c1d95' : '#f5f3ff', ch, '900 ' + Math.round(p[2] * 0.5) + 'px system-ui', used ? '#6d28d9' : '#4c1d95', used);
        });
        btns().forEach(function (b) { K.key(c, b[1], b[2], b[3], b[4], b[0] === 'ok' ? '#22c55e' : '#7c3aed', b[5], '900 20px system-ui'); });
        if (msgT > 0) K.toast(c, W, H - 30, msg, Math.min(1, msgT * 2));
        else if (timeLeft <= 0) K.toast(c, W, H - 30, 'Время вышло!', 1);
      }
    };
  }
};
