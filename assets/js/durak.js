/* Дурак (подкидной) против компьютера: 36 карт, козырь — масть последней карты колоды */
window.GAMES = window.GAMES || {};
window.GAMES.durak = {
  title: 'Дурак', desc: 'Подкидной дурак против компьютера', cat: 'board', isNew4: true, medals: [100, 160, 240],
  hint: 'Нажми на карту, чтобы походить или отбиться. Подкидывать можно карты того же достоинства, что уже на столе. Не можешь отбиться — «Беру». Всё отбито — «Бито». Кто первым избавится от карт после конца колоды — победил, оставшийся — дурак.',
  d0: 'Компьютер играет наугад', d1: 'Обычный соперник', d2: 'Бережёт козыри', d3: 'Сильный соперник',
  colors: ['#166534', '#14532d'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#166534"/><g transform="rotate(-14 50 55)"><rect x="22" y="26" width="34" height="48" rx="5" fill="#fff" stroke="#1f2937" stroke-width="1.5"/><text x="30" y="44" font-size="14" font-weight="900" fill="#dc2626" font-family="system-ui">A</text><text x="34" y="66" font-size="18" fill="#dc2626">♥</text></g><g transform="rotate(12 50 55)"><rect x="44" y="26" width="34" height="48" rx="5" fill="#fff" stroke="#1f2937" stroke-width="1.5"/><text x="52" y="44" font-size="14" font-weight="900" fill="#111827" font-family="system-ui">K</text><text x="56" y="66" font-size="18" fill="#111827">♠</text></g></svg>',
  create: function (api) {
    var SUITS = ['♠', '♣', '♥', '♦'], RANKS = ['6', '7', '8', '9', '10', 'В', 'Д', 'К', 'Т'];
    var deck, hands, trump, trumpCard, att, table, phase, takeMode, botT, msg, msgT, over, sel;
    function red(c) { return c.s >= 2; }
    function name(c) { return RANKS[c.r] + SUITS[c.s]; }
    function beats(d, a) { return (d.s === a.s && d.r > a.r) || (d.s === trump && a.s !== trump); }
    function val(c) { return c.r + (c.s === trump ? 10 : 0); }
    function sortHand(h) { h.sort(function (a, b) { return (a.s === trump) - (b.s === trump) || a.s - b.s || a.r - b.r; }); }
    function say(s) { msg = s; msgT = 2; }
    function draw(i) { while (hands[i].length < 6 && deck.length) hands[i].push(deck.pop()); sortHand(hands[i]); }
    function ranksOnTable() { var r = {}; table.forEach(function (p) { r[p.a.r] = 1; if (p.d) r[p.d.r] = 1; }); return r; }
    function canAdd(c) { return !table.length || ranksOnTable()[c.r]; }
    function limit() { return Math.min(6, table.limit); }
    function undefended() { return table.filter(function (p) { return !p.d; }); }
    function deal() {
      deck = []; for (var s = 0; s < 4; s++) for (var r = 0; r < 9; r++) deck.push({ s: s, r: r });
      for (var i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = deck[i]; deck[i] = deck[j]; deck[j] = x; }
      trumpCard = deck[0]; trump = trumpCard.s; hands = [[], []]; draw(0); draw(1);
      // первым ходит тот, у кого младший козырь
      function low(h) { var m = 99; h.forEach(function (c) { if (c.s === trump) m = Math.min(m, c.r); }); return m; }
      att = low(hands[1]) < low(hands[0]) ? 1 : 0;
      newRound();
    }
    function newRound() { table = []; table.limit = hands[1 - att].length; takeMode = false; phase = att === 0 ? 'attack' : 'bot'; botT = 0.8; }
    function endRound(taken) {
      var def = 1 - att;
      if (taken) { table.forEach(function (p) { hands[def].push(p.a); if (p.d) hands[def].push(p.d); }); sortHand(hands[def]); say(def === 0 ? 'Ты взял карты' : 'Соперник взял карты'); }
      else { say('Бито'); }
      draw(att); draw(def);
      if (!taken) att = def;
      if (checkEnd()) return;
      newRound();
    }
    function checkEnd() {
      if (deck.length) return false;
      var e0 = !hands[0].length, e1 = !hands[1].length;
      if (!e0 && !e1) return false;
      over = e0 && e1 ? 'draw' : e0 ? 'win' : 'lose'; phase = 'over'; botT = 1.6;
      if (over === 'win') { api.addScore(100 + 20 * hands[1].length); api.sound('win'); api.fx.confetti(60); say('Победа! Соперник — дурак'); }
      else if (over === 'draw') { api.addScore(50); say('Ничья'); }
      else { api.sound('hit'); say('Ты остался дураком'); }
      return true;
    }
    // ---- ход компьютера ----
    function botAttackCard() {
      var h = hands[1], ok = h.filter(canAdd);
      if (!ok.length) return null;
      if (api.diff === 0) return ok[Math.floor(Math.random() * ok.length)];
      ok.sort(function (a, b) { return val(a) - val(b); });
      var c = ok[0];
      if (table.length && c.s === trump && deck.length > 4 && api.diff >= 2) return null; // не подкидывать козыри рано
      if (table.length && val(c) > 8 && deck.length > 8) return null;
      return c;
    }
    function botDefendCard(a) {
      var h = hands[1].filter(function (c) { return beats(c, a); });
      if (!h.length) return null;
      if (api.diff === 0) return h[Math.floor(Math.random() * h.length)];
      h.sort(function (x, y) { return val(x) - val(y); });
      var c = h[0];
      if (api.diff >= 2 && c.s === trump && c.r >= 6 && deck.length > 10 && table.length <= 1) return null; // старший козырь не тратить на мелочь
      return c;
    }
    function remove(h, c) { h.splice(h.indexOf(c), 1); }
    function botStep() {
      if (phase === 'bot') { // компьютер атакует или подкидывает
        var c = table.length < limit() ? botAttackCard() : null;
        if (takeMode) {
          if (c && table.length < limit()) { remove(hands[1], c); table.push({ a: c, d: null }); api.sound('click'); botT = 0.5; return; }
          endRound(true); return;
        }
        if (c && (table.length === 0 || undefended().length === 0)) { remove(hands[1], c); table.push({ a: c, d: null }); api.sound('click'); phase = 'defend'; return; }
        if (table.length && !undefended().length) { endRound(false); return; }
        phase = 'defend'; return;
      }
      if (phase === 'botdef') {
        var u = undefended();
        if (!u.length) { phase = 'attack'; return; }
        var d = botDefendCard(u[0]);
        if (!d) { takeMode = true; say('Соперник берёт — можешь подкинуть'); phase = 'attack'; return; }
        remove(hands[1], d); u[0].d = d; api.sound('click');
        botT = 0.5; if (undefended().length) return;
        phase = 'attack';
      }
    }
    // ---- раскладка ----
    function CW() { return Math.min(64, (api.W - 20) / 7); }
    // больше 12 карт — в два ряда, иначе их не различить
    function handPos(i, n) {
      var cw = CW(), ch = cw * 1.42, rows = n > 12 ? 2 : 1, per = Math.ceil(n / rows), row = Math.floor(i / per), j = i - row * per, m = row ? n - per : per;
      var span = Math.min(api.W - 20 - cw, (m - 1) * cw * 0.95), x0 = (api.W - span - cw) / 2;
      return { x: x0 + (m > 1 ? span * j / (m - 1) : span / 2), y: api.H - ch - 76 - (rows - 1 - row) * ch * 0.55, w: cw, h: ch };
    }
    function buttons() {
      var b = [], y = api.H - 60, w = 140;
      if (phase === 'defend') b.push({ k: 'take', t: 'Беру', x: api.W / 2 - w / 2, y: y, w: w });
      if (phase === 'attack' && table.length && (takeMode || !undefended().length)) b.push({ k: 'done', t: takeMode ? 'Хватит' : 'Бито', x: api.W / 2 - w / 2, y: y, w: w });
      return b;
    }
    function playHuman(i) {
      var c = hands[0][i];
      if (phase === 'attack') {
        if (!canAdd(c)) { say('Подкидывать можно только карты того же достоинства'); api.sound('hit'); return; }
        if (table.length >= limit()) { say('Больше подкинуть нельзя'); return; }
        remove(hands[0], c); table.push({ a: c, d: null }); api.sound('click');
        if (!takeMode) { phase = 'botdef'; botT = 0.7; }
        return;
      }
      if (phase === 'defend') {
        var u = undefended(), tgt = null;
        for (var k = 0; k < u.length; k++) if (beats(c, u[k])) { tgt = u[k]; break; }
        if (!tgt) { say('Этой картой не побить'); api.sound('hit'); return; }
        remove(hands[0], c); tgt.d = c; api.sound('click');
        if (!undefended().length) { phase = 'bot'; botT = 0.7; }
      }
    }
    return {
      reset: function () { over = null; msg = ''; msgT = 0; sel = -1; deal(); },
      resize: function () { }, idle: function () { }, key: function () { },
      input: function (type, d) {
        if (type !== 'tap' || phase === 'over') return;
        var b = buttons();
        for (var q = 0; q < b.length; q++) if (d.x > b[q].x && d.x < b[q].x + b[q].w && d.y > b[q].y && d.y < b[q].y + 44) {
          if (b[q].k === 'take') { takeMode = true; phase = 'bot'; botT = 0.6; say('Беру'); }
          else endRound(takeMode);
          return;
        }
        if (phase !== 'attack' && phase !== 'defend') return;
        var h = hands[0];
        for (var i = h.length - 1; i >= 0; i--) { var p = handPos(i, h.length); if (d.x > p.x && d.x < p.x + p.w && d.y > p.y && d.y < p.y + p.h) { playHuman(i); return; } }
      },
      update: function (dt) {
        if (msgT > 0) msgT -= dt;
        if (phase === 'over') { botT -= dt; if (botT <= 0) { phase = 'done'; api.gameOver(); } return; }
        if (phase === 'bot' || phase === 'botdef') { botT -= dt; if (botT <= 0) { botT = 0.6; botStep(); } }
        if (phase !== 'over' && phase !== 'done') checkEnd();
      },
      draw: function (c) {
        var W = api.W, H = api.H, cw = CW(), ch = cw * 1.42;
        var g = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, Math.max(W, H) * 0.7);
        g.addColorStop(0, '#15803d'); g.addColorStop(1, '#052e16'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        function card(x, y, cd, back, w, h) {
          w = w || cw; h = h || ch;
          c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x + 2, y + 3, w, h);
          if (back) { c.fillStyle = '#1e3a8a'; c.fillRect(x, y, w, h); c.strokeStyle = '#93c5fd'; c.lineWidth = 2; c.strokeRect(x + 4, y + 4, w - 8, h - 8); return; }
          c.fillStyle = '#fff'; c.fillRect(x, y, w, h); c.strokeStyle = cd.s === trump ? '#facc15' : '#cbd5e1'; c.lineWidth = cd.s === trump ? 2.5 : 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
          c.fillStyle = red(cd) ? '#dc2626' : '#111827'; c.textAlign = 'left'; c.textBaseline = 'top';
          c.font = '800 ' + Math.round(w * 0.3) + 'px system-ui'; c.fillText(RANKS[cd.r], x + 4, y + 3);
          c.font = Math.round(w * 0.28) + 'px system-ui'; c.fillText(SUITS[cd.s], x + 4, y + 3 + w * 0.32);
          c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = Math.round(w * 0.55) + 'px system-ui'; c.fillText(SUITS[cd.s], x + w / 2, y + h * 0.62);
        }
        // рука соперника
        var n1 = hands[1].length, sp1 = Math.min(W - 40 - cw * 0.7, n1 * cw * 0.35);
        for (var i = 0; i < n1; i++) card((W - sp1 - cw * 0.7) / 2 + (n1 > 1 ? sp1 * i / (n1 - 1) : 0), 46, null, true, cw * 0.7, ch * 0.7);
        c.fillStyle = '#d1fae5'; c.font = '700 13px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Соперник: ' + n1, W / 2, 34);
        // колода и козырь
        var dy = H * 0.36 - ch / 2;
        if (deck.length) { c.save(); c.translate(14 + ch / 2, dy + ch / 2 + 6); c.rotate(Math.PI / 2); card(-cw / 2, -ch / 2, trumpCard); c.restore(); if (deck.length > 1) card(10, dy, null, true); }
        c.fillStyle = '#fff'; c.font = '800 13px system-ui'; c.fillText(deck.length ? deck.length + ' в колоде' : 'колода пуста', 10 + cw / 2 + 10, dy + ch + 20);
        c.fillStyle = red({ s: trump }) ? '#fca5a5' : '#fff'; c.font = '800 15px system-ui'; c.fillText('Козырь ' + SUITS[trump], W - 50, 34);
        // стол
        var tw = cw * 1.25, cols = Math.min(3, Math.max(1, table.length)), x0 = W / 2 - (cols * tw) / 2 + 20 + (deck.length ? 20 : 0);
        table.forEach(function (p, k) {
          var x = x0 + (k % 3) * tw, y = H * 0.27 + Math.floor(k / 3) * (ch + 18);
          card(x, y, p.a); if (p.d) card(x + cw * 0.28, y + ch * 0.22, p.d);
        });
        // рука игрока
        var h0 = hands[0];
        h0.forEach(function (cd, i) { var p = handPos(i, h0.length); card(p.x, p.y, cd); });
        var who = phase === 'attack' ? (takeMode ? 'Подкидывай или «Хватит»' : table.length ? 'Подкидывай или «Бито»' : 'Твой ход') : phase === 'defend' ? 'Отбивайся' : phase === 'bot' || phase === 'botdef' ? 'Ходит соперник…' : '';
        c.fillStyle = '#fef08a'; c.font = '800 15px system-ui'; c.fillText(who, W / 2, H - ch - 100 - (h0.length > 12 ? ch * 0.55 : 0));
        buttons().forEach(function (b) {
          c.fillStyle = b.k === 'take' ? '#dc2626' : '#2563eb'; c.beginPath(); c.roundRect ? c.roundRect(b.x, b.y, b.w, 44, 22) : c.rect(b.x, b.y, b.w, 44); c.fill();
          c.fillStyle = '#fff'; c.font = '800 17px system-ui'; c.fillText(b.t, b.x + b.w / 2, b.y + 22);
        });
        if (msgT > 0) { c.globalAlpha = Math.min(1, msgT * 2); c.fillStyle = 'rgba(0,0,0,.7)'; var mw = Math.min(W - 20, c.measureText(msg).width + 40); c.fillRect(W / 2 - mw / 2, H * 0.2 - 18, mw, 36); c.fillStyle = '#fff'; c.fillText(msg, W / 2, H * 0.2); c.globalAlpha = 1; }
      }
    };
  }
};
