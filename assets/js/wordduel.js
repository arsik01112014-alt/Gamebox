/* Загадай слово: один загадывает слово, другой отгадывает по буквам (6 ошибок). Роли меняются, 4 раунда.
   Против компьютера — он загадывает слова из списка и отгадывает твои */
window.GAMES = window.GAMES || {};
window.GAMES.wordduel = {
  title: 'Загадай слово', desc: 'Виселица вдвоём', cat: 'puzzle', isNew4: true, modes: true, lan: true, medals: [100, 250, 450],
  hint: 'По очереди: один загадывает слово (от 3 до 12 букв), другой угадывает его по буквам. 6 ошибок — слово не угадано. Угадал — очки по числу оставшихся попыток. Всего 4 раунда, роли меняются. Вдвоём на одном телефоне загадывающий вводит слово, пока второй не смотрит.',
  d0: 'Компьютер угадывает плохо', d1: 'Обычный соперник', d2: 'Умный соперник', d3: 'Знает частоту букв',
  colors: ['#0f766e', '#7c3aed'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#134e4a"/><g fill="#ccfbf1" font-size="18" font-weight="900" font-family="system-ui" text-anchor="middle"><text x="26" y="58">С</text><text x="44" y="58">_</text><text x="62" y="58">О</text><text x="80" y="58">_</text></g><path d="M18 66h70" stroke="#5eead4" stroke-width="3"/><text x="50" y="34" font-size="20" text-anchor="middle">🤫</text></svg>',
  create: function (api) {
    var K = window.GBK, ALPHA = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ', PER = 11, MAXW = 6, ROUNDS = 4;
    var WORDS = ['КОМПОТ', 'ЖИРАФ', 'ПАРАШЮТ', 'ЧЕМОДАН', 'ВЕРТОЛЁТ', 'АПЕЛЬСИН', 'ГИТАРА', 'ПИНГВИН', 'КАРАНДАШ', 'ВУЛКАН', 'РАКЕТА', 'ФУТБОЛ', 'ШОКОЛАД', 'ДИНОЗАВР',
      'ЛАБИРИНТ', 'МАЯК', 'ПОДСОЛНУХ', 'КРОКОДИЛ', 'СНЕГОВИК', 'ТЕЛЕСКОП', 'БАРАБАН', 'ВЕЛОСИПЕД', 'КЕНГУРУ', 'КАКТУС', 'ОСЬМИНОГ', 'ПЫЛЕСОС', 'РЮКЗАК', 'ЧЕРЕПАХА'].map(function (w) { return w.replace('Ё', 'Е'); });
    var FREQ = 'ОЕАИНТСРВЛКМДПУЯЫЬГЗБЧЙХЖШЮЦЩЭФЪ';
    // словарь подгружается только для этой игры (2 МБ): загаданное слово должно быть настоящим
    function dict() {
      if (window.RU_SET) return window.RU_SET;
      if (window.RU_WORDS) { window.RU_SET = new Set(window.RU_WORDS.split('\n')); window.RU_WORDS = null; return window.RU_SET; }
      if (!window.RU_LOADING) { window.RU_LOADING = true; var sc = document.createElement('script'); sc.src = 'js/data/ru-words.js'; sc.onerror = function () { window.RU_LOADING = false; }; document.head.appendChild(sc); }
      return null;
    }
    dict();
    var round, roles, word, used, wrong, phase, phaseT, typed, scores, netQ, endT, t, aiT, msg;
    function names() { return api.mode === 1 ? [api.t('g.p1'), api.t('g.p2')] : api.mode === 2 ? [api.t('g.you'), api.t('net.opp')] : [api.t('g.you'), api.t('g.cpu')]; }
    // кто загадывает в раунде: чётные раунды — игрок 2 (соперник), нечётные — игрок 1
    // по сети индексы свои у каждого (0 — я): переводим «абсолютного» игрока (0 — хост) в свой индекс
    function setter() { var abs = round % 2 ? 0 : 1; return api.mode === 2 ? (abs === api.net.side ? 0 : 1) : abs; }
    function guesser() { return 1 - setter(); }
    function iAmGuesser() { return api.mode === 1 || guesser() === 0; }
    function newRound() {
      word = ''; used = {}; wrong = 0; typed = ''; phaseT = 0; msg = '';
      if (api.mode === 0 && setter() === 1) { word = WORDS[Math.floor(Math.random() * WORDS.length)]; phase = 'guess'; }
      else if (api.mode === 2 && setter() === 1) phase = 'waitword';
      else phase = 'type';
      aiT = 1;
    }
    function geom() { var cell = Math.floor((api.W - 12) / PER), kh = Math.floor(cell * 1.25); return { cell: cell, kh: kh, x0: (api.W - cell * PER) / 2, y0: api.H - 4 * kh - 14 }; }
    function setWord(w, remote) {
      word = w; phase = api.mode === 1 ? 'pass' : 'guess'; phaseT = 0; used = {}; wrong = 0;
      if (api.mode === 2 && !remote) api.net.send({ k: 'word', r: round, w: w });
    }
    function guess(ch, remote) {
      if (used[ch] || phase !== 'guess') return;
      if (api.mode === 2 && !remote) api.net.send({ k: 'g', r: round, c: ch });
      used[ch] = true;
      if (word.indexOf(ch) < 0) { wrong++; api.sound('hit'); api.vibrate(30); }
      else api.sound('click');
      var open = word.split('').every(function (x) { return used[x]; });
      if (open || wrong >= MAXW) {
        var g = guesser(), pts = open ? (MAXW - wrong + 1) * 10 + word.length * 2 : 0;
        if (open) scores[g] += pts; else scores[setter()] += 20;
        msg = open ? nm()[g] + ' угадал! +' + pts : 'Не угадано: ' + word + ' · +20 ' + nm()[setter()];
        if (api.mode === 0 && open && g === 0) api.addScore(pts * (api.diff + 1));
        if (api.mode === 0 && !open && setter() === 0) api.addScore(20 * (api.diff + 1));
        api.sound(open ? 'win' : 'hit'); phase = 'result'; phaseT = 0; round++;
        if (round >= ROUNDS) { endT = 3; if (api.mode === 0 && scores[0] > scores[1]) api.fx.confetti(50); }
      }
    }
    function nm() { return names(); }
    function aiGuess() { // компьютер угадывает по частоте букв и подходящим словам из списка
      var mask = word.split('').map(function (x) { return used[x] ? x : '.'; }).join('');
      var cands = WORDS.filter(function (w) { if (w.length !== word.length) return false; for (var i = 0; i < w.length; i++) { if (mask[i] !== '.' && mask[i] !== w[i]) return false; if (mask[i] === '.' && used[w[i]]) return false; } return true; });
      var order = FREQ.split('');
      if (api.diff >= 2 && cands.length) { var cnt = {}; cands.forEach(function (w) { w.split('').forEach(function (x) { cnt[x] = (cnt[x] || 0) + 1; }); }); order.sort(function (a, b) { return (cnt[b] || 0) - (cnt[a] || 0); }); }
      var pool = order.filter(function (x) { return !used[x]; });
      var pick = api.diff === 0 ? pool[Math.floor(Math.random() * Math.min(pool.length, 14))] : api.diff === 1 ? pool[Math.floor(Math.random() * Math.min(pool.length, 5))] : pool[0];
      guess(pick);
    }
    return {
      reset: function () { round = 0; scores = [0, 0]; netQ = []; endT = 0; t = 0; newRound(); },
      resize: function () { }, idle: function (dt) { t += dt || 0; }, key: function () { },
      netMsg: function (d) { netQ.push(d); },
      input: function (type, d) {
        if (type !== 'down' || endT > 0) return;
        if (phase === 'pass') { phase = 'guess'; api.sound('click'); return; }
        if (phase === 'result') { if (phaseT > 1 && api.mode !== 2) newRound(); return; }
        var g = geom(), c = Math.floor((d.x - g.x0) / g.cell), r = Math.floor((d.y - g.y0) / g.kh);
        if (c < 0 || c >= PER || r < 0 || r > 3) return;
        if (phase === 'type') {
          if (r === 3) { if (c < PER / 2) typed = typed.slice(0, -1); else if (typed.length < 3) { msg = 'Минимум 3 буквы'; phaseT = 0; }
            else { var D = dict(); if (!D) { msg = 'Словарь загружается, нажми ещё раз через секунду'; phaseT = 0; } else if (!D.has(typed)) { msg = 'Такого слова нет в словаре'; phaseT = 0; api.sound('hit'); api.vibrate(40); } else setWord(typed); } api.sound('click'); return; }
          var ch = ALPHA[r * PER + c]; if (ch && typed.length < 12) { typed += ch; api.sound('click'); }
        } else if (phase === 'guess' && iAmGuesser() && !(api.mode === 0 && guesser() === 1) && r < 3) { var ch2 = ALPHA[r * PER + c]; if (ch2) guess(ch2); }
      },
      update: function (dt) {
        t += dt; phaseT += dt;
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (api.mode === 0 && phase === 'guess' && guesser() === 1) { aiT -= dt; if (aiT <= 0) { aiT = 0.9; aiGuess(); } }
        if (api.mode === 2) {
          for (var i = netQ.length - 1; i >= 0; i--) {
            var m = netQ[i];
            if (m.r !== round) { if (m.r < round) netQ.splice(i, 1); continue; }
            if (m.k === 'word' && phase === 'waitword') { setWord(m.w, true); netQ.splice(i, 1); }
            else if (m.k === 'g' && phase === 'guess' && !iAmGuesser()) { guess(m.c, true); netQ.splice(i, 1); }
          }
          if (phase === 'result' && phaseT > 2.6) newRound();
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H, n = names(), g = geom();
        K.bg(c, W, H, '#134e4a', '#042f2e', 'rgba(167,139,250,.14)');
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = '#ccfbf1'; c.font = '800 15px system-ui'; c.fillText(n[0] + '  ' + scores[0] + ' : ' + scores[1] + '  ' + n[1], W / 2, 26);
        c.fillStyle = '#5eead4'; c.font = '700 12px system-ui'; c.fillText('Раунд ' + Math.min(round + 1, ROUNDS) + ' из ' + ROUNDS + ' · загадывает ' + n[setter()] + ', угадывает ' + n[guesser()], W / 2, 48);
        var midY = (60 + g.y0) / 2;
        if (endT > 0) {
          var txt = scores[0] === scores[1] ? api.t('g.draw') : api.mode === 1 ? api.t(scores[0] > scores[1] ? 'g.p1win' : 'g.p2win') : scores[0] > scores[1] ? api.t('g.win') : api.t('g.lose');
          K.toast(c, W, midY - 40, msg, 1); c.fillStyle = '#fde68a'; c.font = '900 30px system-ui'; c.fillText(txt, W / 2, midY + 10); return;
        }
        if (phase === 'type') {
          c.fillStyle = '#f0fdfa'; c.font = '800 18px system-ui'; c.fillText((api.mode === 1 ? n[setter()] + ', загадай' : 'Загадай') + ' слово', W / 2, midY - 62);
          c.fillStyle = 'rgba(204,251,241,.7)'; c.font = '600 13px system-ui'; c.fillText('соперник не смотрит! · только настоящие слова', W / 2, midY - 40);
          K.rr(c, 20, midY - 26, W - 40, 56, 16); c.fillStyle = 'rgba(0,0,0,.35)'; c.fill();
          c.fillStyle = '#fff'; c.font = '900 28px system-ui'; c.fillText(typed.split('').join(' ') || '…', W / 2, midY + 2);
          if (msg && phaseT < 2.5) K.toast(c, W, midY + 56, msg, 1);
        } else if (phase === 'pass') {
          c.fillStyle = '#fde68a'; c.font = '900 22px system-ui'; c.fillText('Слово загадано 🤫', W / 2, midY - 20);
          c.fillStyle = '#ccfbf1'; c.font = '700 16px system-ui'; c.fillText('Передай телефон: ' + n[guesser()] + ' угадывает', W / 2, midY + 16); c.fillText('Нажми на экран', W / 2, midY + 40);
        } else if (phase === 'waitword') K.toast(c, W, midY, 'Соперник загадывает слово…', 1);
        else {
          // попытки и слово
          for (var h = 0; h < MAXW; h++) K.heart(c, W / 2 - (MAXW - 1) * 13 + h * 26, midY - 70, 20, h < MAXW - wrong ? '#f43f5e' : 'rgba(255,255,255,.18)');
          var sp = Math.min(34, (W - 24) / Math.max(1, word.length)), showAll = phase === 'result' || (api.mode === 2 && !iAmGuesser());
          for (var j = 0; j < word.length; j++) {
            var x = W / 2 + (j - (word.length - 1) / 2) * sp, open = used[word[j]];
            K.rr(c, x - sp / 2 + 2, midY - sp * 0.6, sp - 4, sp * 1.1, 6); c.fillStyle = open ? 'rgba(34,197,94,.25)' : 'rgba(255,255,255,.07)'; c.fill();
            if (open || showAll) { c.fillStyle = open ? '#fff' : 'rgba(252,165,165,.85)'; c.font = '900 ' + Math.round(sp * 0.66) + 'px system-ui'; c.fillText(word[j], x, midY); }
          }
          if (phase === 'result') K.toast(c, W, midY + 56, msg + (api.mode !== 2 && phaseT > 1 ? ' · ' + api.t('g.tapContinue') : ''), 1);
          else if (!iAmGuesser() || (api.mode === 0 && guesser() === 1)) K.toast(c, W, midY + 56, (api.mode === 0 ? 'Компьютер' : 'Соперник') + ' угадывает твоё слово…', 1);
        }
        // клавиатура
        var typing = phase === 'type';
        for (var i = 0; i < ALPHA.length; i++) {
          var ch = ALPHA[i], kx = g.x0 + (i % PER) * g.cell, ky = g.y0 + Math.floor(i / PER) * g.kh, st = used[ch];
          var col = typing ? '#0f766e' : !st ? '#334155' : word.indexOf(ch) >= 0 ? '#15803d' : '#7f1d1d';
          K.key(c, kx + 2, ky + 3, g.cell - 4, g.kh - 6, col, ch, '800 ' + Math.round(g.cell * 0.48) + 'px system-ui', st && !typing ? 'rgba(255,255,255,.55)' : '#fff', !!st && !typing);
        }
        if (typing) {
          var yb = g.y0 + 3 * g.kh, half = g.cell * PER / 2;
          K.key(c, g.x0 + 2, yb + 3, half - 4, g.kh - 6, '#9f1239', '⌫  Стереть', '800 15px system-ui');
          K.key(c, g.x0 + half + 2, yb + 3, half - 4, g.kh - 6, '#15803d', 'Загадать ✓', '800 15px system-ui');
        }
      }
    };
  }
};
