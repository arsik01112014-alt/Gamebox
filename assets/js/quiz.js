/* Викторина: флаги и столицы стран мира */
window.GAMES = window.GAMES || {};
window.GAMES.quiz = {
  title: 'Флаги и столицы', desc: 'Викторина о странах мира', cat: 'puzzle', isNew4: true, medals: [500, 1000, 1600],
  hint: '15 вопросов: угадай страну по флагу или назови её столицу. На ответ 10 секунд — чем быстрее, тем больше очков. Серия правильных ответов подряд даёт бонус.',
  d0: 'Известные страны', d1: 'Больше стран', d2: 'Все страны', d3: 'Все страны, 6 секунд на ответ',
  colors: ['#2563eb', '#be123c'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#1e3a8a"/><circle cx="50" cy="50" r="30" fill="#3b82f6"/><path d="M30 40c8-4 12 4 20 0s14-6 20 2M28 58c10 4 14-4 24 0s12 6 20-2" stroke="#86efac" stroke-width="6" fill="none"/><text x="50" y="62" text-anchor="middle" font-size="34" font-weight="900" fill="#fff" font-family="sans-serif">?</text></svg>',
  create: function (api) {
    // [флаг, страна, столица, уровень известности 0..2]
    var C = [['🇷🇺', 'Россия', 'Москва', 0], ['🇺🇸', 'США', 'Вашингтон', 0], ['🇬🇧', 'Великобритания', 'Лондон', 0], ['🇫🇷', 'Франция', 'Париж', 0], ['🇩🇪', 'Германия', 'Берлин', 0],
      ['🇮🇹', 'Италия', 'Рим', 0], ['🇪🇸', 'Испания', 'Мадрид', 0], ['🇨🇳', 'Китай', 'Пекин', 0], ['🇯🇵', 'Япония', 'Токио', 0], ['🇧🇷', 'Бразилия', 'Бразилиа', 0],
      ['🇨🇦', 'Канада', 'Оттава', 0], ['🇺🇦', 'Украина', 'Киев', 0], ['🇰🇿', 'Казахстан', 'Астана', 0], ['🇧🇾', 'Беларусь', 'Минск', 0], ['🇹🇷', 'Турция', 'Анкара', 0],
      ['🇮🇳', 'Индия', 'Нью-Дели', 0], ['🇪🇬', 'Египет', 'Каир', 0], ['🇦🇺', 'Австралия', 'Канберра', 0], ['🇲🇽', 'Мексика', 'Мехико', 0], ['🇦🇷', 'Аргентина', 'Буэнос-Айрес', 0],
      ['🇵🇱', 'Польша', 'Варшава', 1], ['🇺🇿', 'Узбекистан', 'Ташкент', 1], ['🇬🇪', 'Грузия', 'Тбилиси', 1], ['🇦🇲', 'Армения', 'Ереван', 1], ['🇦🇿', 'Азербайджан', 'Баку', 1],
      ['🇰🇬', 'Киргизия', 'Бишкек', 1], ['🇹🇯', 'Таджикистан', 'Душанбе', 1], ['🇫🇮', 'Финляндия', 'Хельсинки', 1], ['🇸🇪', 'Швеция', 'Стокгольм', 1], ['🇳🇴', 'Норвегия', 'Осло', 1],
      ['🇬🇷', 'Греция', 'Афины', 1], ['🇵🇹', 'Португалия', 'Лиссабон', 1], ['🇳🇱', 'Нидерланды', 'Амстердам', 1], ['🇨🇭', 'Швейцария', 'Берн', 1], ['🇦🇹', 'Австрия', 'Вена', 1],
      ['🇨🇿', 'Чехия', 'Прага', 1], ['🇰🇷', 'Южная Корея', 'Сеул', 1], ['🇹🇭', 'Таиланд', 'Бангкок', 1], ['🇻🇳', 'Вьетнам', 'Ханой', 1], ['🇮🇩', 'Индонезия', 'Джакарта', 1],
      ['🇸🇦', 'Саудовская Аравия', 'Эр-Рияд', 1], ['🇦🇪', 'ОАЭ', 'Абу-Даби', 1], ['🇮🇷', 'Иран', 'Тегеран', 1], ['🇿🇦', 'ЮАР', 'Претория', 1], ['🇨🇺', 'Куба', 'Гавана', 1],
      ['🇮🇪', 'Ирландия', 'Дублин', 2], ['🇩🇰', 'Дания', 'Копенгаген', 2], ['🇧🇪', 'Бельгия', 'Брюссель', 2], ['🇭🇺', 'Венгрия', 'Будапешт', 2], ['🇷🇴', 'Румыния', 'Бухарест', 2],
      ['🇧🇬', 'Болгария', 'София', 2], ['🇷🇸', 'Сербия', 'Белград', 2], ['🇭🇷', 'Хорватия', 'Загреб', 2], ['🇱🇹', 'Литва', 'Вильнюс', 2], ['🇱🇻', 'Латвия', 'Рига', 2],
      ['🇪🇪', 'Эстония', 'Таллин', 2], ['🇲🇩', 'Молдавия', 'Кишинёв', 2], ['🇲🇳', 'Монголия', 'Улан-Батор', 2], ['🇹🇲', 'Туркменистан', 'Ашхабад', 2], ['🇵🇰', 'Пакистан', 'Исламабад', 2],
      ['🇳🇬', 'Нигерия', 'Абуджа', 2], ['🇰🇪', 'Кения', 'Найроби', 2], ['🇲🇦', 'Марокко', 'Рабат', 2], ['🇨🇱', 'Чили', 'Сантьяго', 2], ['🇵🇪', 'Перу', 'Лима', 2],
      ['🇨🇴', 'Колумбия', 'Богота', 2], ['🇳🇿', 'Новая Зеландия', 'Веллингтон', 2], ['🇮🇸', 'Исландия', 'Рейкьявик', 2], ['🇮🇱', 'Израиль', 'Иерусалим', 2], ['🇵🇭', 'Филиппины', 'Манила', 2]];
    var Q = 15, TL = [10, 10, 10, 6];
    var pool, qn, cur, opts, kind, timeLeft, answered, ansT, streak, right, t, endT, chosen;
    function next() {
      if (qn >= Q) { endT = 2; return; }
      qn++; var c = pool[qn - 1]; cur = c; kind = Math.random() < 0.5 ? 'flag' : 'cap';
      var lvl = [0, 1, 2, 2][api.diff], others = C.filter(function (x) { return x !== c && x[3] <= Math.max(lvl, c[3]); });
      for (var i = others.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = others[i]; others[i] = others[j]; others[j] = x; }
      opts = [c].concat(others.slice(0, 3)); for (i = 3; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); x = opts[i]; opts[i] = opts[j]; opts[j] = x; }
      timeLeft = TL[api.diff]; answered = false; ansT = 0; chosen = -1;
    }
    function optRect(i) { var w = api.W - 40, h = 62, y0 = api.H * 0.46; return [20, y0 + i * (h + 12), w, h]; }
    function answer(i) {
      if (answered) return; answered = true; chosen = i; ansT = 0;
      if (i >= 0 && opts[i] === cur) { streak++; right++; var pts = Math.round(50 + timeLeft * 10) + (streak >= 3 ? streak * 10 : 0); api.addScore(pts); api.sound('coin'); api.vibrate(10); if (streak % 5 === 0) api.fx.confetti(25); }
      else { streak = 0; api.sound('hit'); api.vibrate(50); }
    }
    return {
      reset: function () {
        var lvl = [0, 1, 2, 2][api.diff]; pool = C.filter(function (x) { return x[3] <= lvl; });
        for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = pool[i]; pool[i] = pool[j]; pool[j] = x; }
        qn = 0; streak = 0; right = 0; t = 0; endT = 0; next();
      },
      resize: function () { }, idle: function (dt) { t += dt || 0; }, key: function (k, d) { if (d && k >= '1' && k <= '4') answer(+k - 1); },
      input: function (type, d) {
        if (type !== 'down' || answered || endT > 0) return;
        for (var i = 0; i < 4; i++) { var r = optRect(i); if (d.x >= r[0] && d.x <= r[0] + r[2] && d.y >= r[1] && d.y <= r[1] + r[3]) { answer(i); return; } }
      },
      update: function (dt) {
        t += dt;
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (!answered) { timeLeft -= dt; if (timeLeft <= 0) { timeLeft = 0; answer(-1); } }
        else { ansT += dt; if (ansT > 1.3) next(); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, K = window.GBK, g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#1e3a8a'); g.addColorStop(1, '#0f172a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = '#bfdbfe'; c.font = '800 15px system-ui'; c.fillText('Вопрос ' + qn + ' из ' + Q + '   ✔ ' + right + (streak >= 3 ? '   🔥 ×' + streak : ''), W / 2, 28);
        // полоска времени
        for (var qi = 0; qi < Q; qi++) { c.fillStyle = qi < qn - 1 ? '#60a5fa' : qi === qn - 1 ? '#fde68a' : 'rgba(255,255,255,.15)'; c.beginPath(); c.arc(W / 2 + (qi - (Q - 1) / 2) * 16, 66, qi === qn - 1 ? 5 : 3.5, 0, 6.283); c.fill(); }
        K.rr(c, 20, 46, W - 40, 8, 4); c.fillStyle = 'rgba(255,255,255,.12)'; c.fill();
        K.rr(c, 20, 46, (W - 40) * Math.max(0, timeLeft / TL[api.diff]), 8, 4); c.fillStyle = timeLeft < 3 ? '#f87171' : '#60a5fa'; c.fill();
        if (endT > 0) { c.fillStyle = '#fff'; c.font = '900 28px system-ui'; c.fillText('Правильно ' + right + ' из ' + Q, W / 2, H * 0.4); return; }
        c.fillStyle = '#fff';
        if (kind === 'flag') {
          c.font = '700 17px system-ui'; c.fillText('Чей это флаг?', W / 2, 90);
          var fw = Math.min(W - 80, 240), fh2 = Math.min(H * 0.22, 170); K.rr(c, W / 2 - fw / 2, H * 0.27 - fh2 / 2, fw, fh2, 22); c.fillStyle = 'rgba(255,255,255,.08)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.15)'; c.lineWidth = 1.5; c.stroke();
          c.font = Math.round(Math.min(130, H * 0.17)) + 'px system-ui'; c.fillText(cur[0], W / 2, H * 0.27 + Math.sin(t * 2) * 3);
        } else {
          c.font = '700 17px system-ui'; c.fillText('Столица страны', W / 2, 90);
          c.font = Math.round(Math.min(80, H * 0.1)) + 'px system-ui'; c.fillText(cur[0], W / 2, H * 0.21);
          c.font = '900 28px system-ui'; c.fillText(cur[1], W / 2, H * 0.33, W - 30);
        }
        opts.forEach(function (o, i) {
          var r = optRect(i), col = '#334155';
          if (answered) { if (o === cur) col = '#16a34a'; else if (i === chosen) col = '#dc2626'; }
          K.key(c, r[0], r[1], r[2], r[3], col, kind === 'flag' ? o[1] : o[2], '800 19px system-ui');
        });
        if (answered && chosen < 0) K.toast(c, W, H - 30, 'Время вышло!', 1);
      }
    };
  }
};
