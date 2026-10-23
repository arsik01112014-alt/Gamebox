/* Очко: набери как можно ближе к 21, но не больше */
window.GAMES = window.GAMES || {};
window.GAMES.blackjack = {
  title: 'Очко', desc: 'Набери 21 или ближе к нему', cat: 'arcade', isNew4: true, medals: [800, 2000, 3500],
  hint: 'Нажми «Ещё», чтобы взять карту, или «Стоп», чтобы остановиться. Больше 21 — перебор. Дилер берёт карты до 17. Сыграйте 10 раундов. Ставка растёт с уровнем сложности, а 21 с двух карт платит вдвойне.',
  d0: 'Ставка 100', d1: 'Ставка 200', d2: 'Ставка 300', d3: 'Ставка 400',
  colors: ['#15803d', '#166534'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#14532d"/><rect x="26" y="26" width="32" height="44" rx="5" fill="#fff"/><rect x="42" y="34" width="32" height="44" rx="5" fill="#fff" stroke="#14532d" stroke-width="3"/><text x="58" y="62" font-size="20" font-family="sans-serif" font-weight="800" fill="#dc2626" text-anchor="middle">21</text></svg>',
  create: function (api) {
    var hand, dealer, state, timer, msg, round, bet;
    function rank() { return 1 + Math.floor(Math.random() * 13); }
    function value(r) { return r === 1 ? 11 : Math.min(r, 10); }
    function score(h) {
      var s = 0, aces = 0;
      h.forEach(function (r) { s += value(r); if (r === 1) aces++; });
      while (s > 21 && aces > 0) { s -= 10; aces--; }
      return s;
    }
    function label(r) { return r === 1 ? 'A' : r === 11 ? 'J' : r === 12 ? 'Q' : r === 13 ? 'K' : String(r); }
    function deal() {
      round++;
      hand = [rank(), rank()]; dealer = [rank()];
      state = 'p'; msg = 'Ещё или стоп?';
      if (score(hand) === 21) stand();
    }
    function stand() {
      while (score(dealer) < 17) dealer.push(rank());
      var p = score(hand), d = score(dealer), blackjack = hand.length === 2 && p === 21;
      if (p > 21) { msg = 'Перебор'; api.sound('hit'); }
      else if (d > 21 || p > d) {
        var pts = bet * (blackjack ? 2 : 1);
        api.addScore(pts); api.sound('win');
        msg = blackjack ? 'Очко с двух карт! +' + pts : 'Выигрыш +' + pts;
      }
      else if (p === d) msg = 'Ничья';
      else { msg = 'Дилер выиграл'; api.sound('hit'); }
      state = 'end'; timer = 1.8;
    }
    function drawCard(c, r, x, y) {
      c.fillStyle = '#fff'; c.fillRect(x, y, 56, 80);
      c.fillStyle = r === 1 || r > 10 ? '#dc2626' : '#0f172a';
      c.font = '800 20px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(label(r), x + 28, y + 40);
    }
    return {
      reset: function () { round = 0; bet = 100 * (api.diff + 1); deal(); },
      resize: function () { }, idle: function () { }, key: function () { },
      input: function (type, d) {
        if (type !== 'down' || state !== 'p' || d.y < api.H - 110) return;
        if (d.x < api.W / 2) { hand.push(rank()); if (score(hand) > 21) stand(); }
        else stand();
      },
      update: function (dt) {
        if (state === 'end' && (timer -= dt) <= 0) {
          if (round >= 10) api.gameOver(); else deal();
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        c.fillStyle = '#052e16'; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = '#e2e8f0'; c.font = '800 16px system-ui';
        c.fillText('Раунд ' + round + ' / 10   ·   ставка ' + bet, W / 2, 30);
        c.fillText('Дилер: ' + (state === 'p' ? '?' : score(dealer)), W / 2, 70);
        dealer.forEach(function (r, i) { drawCard(c, r, W / 2 - 30 * dealer.length + i * 62, 90); });
        c.fillText('Вы: ' + score(hand), W / 2, H * 0.5 - 60);
        hand.forEach(function (r, i) { drawCard(c, r, W / 2 - 30 * hand.length + i * 62, H * 0.5 - 30); });
        c.fillStyle = '#fde68a'; c.font = '800 18px system-ui';
        c.fillText(msg, W / 2, H * 0.5 + 80);
        if (state === 'p') {
          c.fillStyle = '#16a34a'; c.fillRect(20, H - 90, W / 2 - 30, 56);
          c.fillStyle = '#dc2626'; c.fillRect(W / 2 + 10, H - 90, W / 2 - 30, 56);
          c.fillStyle = '#fff'; c.font = '800 18px system-ui';
          c.fillText('Ещё', W / 4 + 5, H - 62); c.fillText('Стоп', W * 3 / 4 - 5, H - 62);
        }
      }
    };
  }
};
