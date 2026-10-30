/* Покер (техасский холдем) против трёх ботов: собери лучшую комбинацию из 5 карт */
window.GAMES = window.GAMES || {};
window.GAMES.poker = {
  title: 'Покер', desc: 'Техасский холдем против ботов', cat: 'board', isNew4: true, medals: [500, 1500, 3000],
  hint: 'У каждого 2 карты, на стол выкладываются 5 общих. Ставь, уравнивай или сбрасывай. Побеждает лучшая комбинация из 5 карт: пара, две пары, сет, стрит, флеш, фулл-хаус, каре, стрит-флеш. Очки — за выигранные банки. Обыграй всех трёх ботов!',
  d0: 'Боты-новички', d1: 'Обычные боты', d2: 'Хитрые боты', d3: 'Профи, блайнды растут быстрее',
  colors: ['#15803d', '#7f1d1d'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#14532d"/><g transform="rotate(-12 40 52)"><rect x="18" y="26" width="34" height="48" rx="5" fill="#fff"/><text x="23" y="44" font-family="sans-serif" font-size="15" font-weight="900" fill="#111">A</text><text x="27" y="64" font-size="20" fill="#111">♠</text></g><g transform="rotate(12 62 52)"><rect x="46" y="26" width="34" height="48" rx="5" fill="#fff"/><text x="51" y="44" font-family="sans-serif" font-size="15" font-weight="900" fill="#dc2626">K</text><text x="55" y="64" font-size="20" fill="#dc2626">♥</text></g><circle cx="76" cy="80" r="9" fill="#dc2626" stroke="#fff" stroke-width="3" stroke-dasharray="4 3"/></svg>',
  create: function (api) {
    var K = window.GBK, RN = '23456789TJQKA', SU = '♠♥♦♣';
    var P, deck, board, pot, dealer, street, toAct, maxBet, minRaise, lastRaiser, actedSince, hand, t, endT, phase, phaseT, msg, msgT, sb, bb, showdown, winners, thinkT, raiseOpen;
    var NAMES = ['Ты', 'Бот Саня', 'Бот Лиза', 'Бот Гоша'];
    function card(r, s) { return { r: r, s: s }; }
    function shuffle() { deck = []; for (var s = 0; s < 4; s++) for (var r = 0; r < 13; r++) deck.push(card(r, s)); for (var i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = deck[i]; deck[i] = deck[j]; deck[j] = x; } }
    // оценка 5 карт: число, больше — сильнее
    function eval5(cs) {
      var rs = cs.map(function (c) { return c.r; }).sort(function (a, b) { return b - a; }), fl = cs.every(function (c) { return c.s === cs[0].s; });
      var cnt = {}; rs.forEach(function (r) { cnt[r] = (cnt[r] || 0) + 1; });
      var groups = Object.keys(cnt).map(Number).sort(function (a, b) { return cnt[b] - cnt[a] || b - a; });
      var uniq = rs.filter(function (r, i) { return rs.indexOf(r) === i; }), st = -1;
      if (uniq.length === 5) { if (uniq[0] - uniq[4] === 4) st = uniq[0]; else if (uniq.join() === '12,3,2,1,0') st = 3; }
      var cat, tb;
      if (st >= 0 && fl) { cat = 8; tb = [st]; }
      else if (cnt[groups[0]] === 4) { cat = 7; tb = groups; }
      else if (cnt[groups[0]] === 3 && cnt[groups[1]] === 2) { cat = 6; tb = groups; }
      else if (fl) { cat = 5; tb = rs; }
      else if (st >= 0) { cat = 4; tb = [st]; }
      else if (cnt[groups[0]] === 3) { cat = 3; tb = groups; }
      else if (cnt[groups[0]] === 2 && cnt[groups[1]] === 2) { cat = 2; tb = groups; }
      else if (cnt[groups[0]] === 2) { cat = 1; tb = groups; }
      else { cat = 0; tb = rs; }
      var v = cat; for (var i = 0; i < 5; i++) v = v * 14 + (tb[i] != null ? tb[i] + 1 : 0);
      return v;
    }
    function best7(cs) { var b = -1; for (var a = 0; a < cs.length; a++) for (var c = a + 1; c < cs.length; c++) { var five = cs.filter(function (x, i) { return i !== a && i !== c; }); if (five.length === 5) { var v = eval5(five); if (v > b) b = v; } } if (cs.length === 5) b = eval5(cs); return b; }
    var CATN = ['Старшая карта', 'Пара', 'Две пары', 'Сет', 'Стрит', 'Флеш', 'Фулл-хаус', 'Каре', 'Стрит-флеш'];
    function catOf(v) { return Math.floor(v / Math.pow(14, 5)); }
    function equity(p, opp, iters) { // Монте-Карло: шанс выиграть против opp случайных рук
      var known = p.cards.concat(board), rest = deck.slice(), win = 0;
      for (var it = 0; it < iters; it++) {
        for (var i = rest.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = rest[i]; rest[i] = rest[j]; rest[j] = x; }
        var k = 0, bd = board.slice(); while (bd.length < 5) bd.push(rest[k++]);
        var me = best7(p.cards.concat(bd)), ok = 1;
        for (var o = 0; o < opp; o++) { var v = best7([rest[k++], rest[k++]].concat(bd)); if (v > me) { ok = 0; break; } if (v === me) ok = 0.5; }
        win += ok;
      }
      return win / iters;
    }
    function preflop(p) { var a = p.cards[0], b = p.cards[1], hi = Math.max(a.r, b.r), lo = Math.min(a.r, b.r), s = hi / 12 * 0.5 + lo / 12 * 0.2; if (a.r === b.r) s += 0.35 + a.r / 40; if (a.s === b.s) s += 0.06; if (hi - lo === 1) s += 0.05; return Math.min(1, s); }
    function active() { return P.filter(function (p) { return !p.out && !p.fold; }); }
    function canAct(p) { return !p.out && !p.fold && !p.allin; }
    function newHand() {
      hand++; if (hand > 1 && hand % [10, 9, 8, 6][api.diff] === 1) { sb = Math.round(sb * 1.5); bb = sb * 2; say('Блайнды выросли: ' + sb + '/' + bb); }
      shuffle(); board = []; pot = 0; showdown = false; winners = []; raiseOpen = false;
      P.forEach(function (p) { p.cards = []; p.bet = 0; p.total = 0; p.fold = !!p.out; p.allin = false; p.last = ''; });
      do { dealer = (dealer + 1) % 4; } while (P[dealer].out);
      P.forEach(function (p) { if (!p.out) p.cards = [deck.pop(), deck.pop()]; });
      var s = nextSeat(dealer), b2 = nextSeat(s); if (active().length === 2) { s = dealer; b2 = nextSeat(dealer); }
      putIn(P[s], sb); P[s].last = 'SB'; putIn(P[b2], bb); P[b2].last = 'BB';
      maxBet = bb; minRaise = bb; street = 0; lastRaiser = b2; actedSince = {}; toAct = nextSeat(b2); phase = 'bet'; thinkT = 0.8; api.sound('move');
      skipIfCant();
    }
    function nextSeat(i) { for (var k = 1; k <= 4; k++) { var j = (i + k) % 4; if (!P[j].out && !P[j].fold) return j; } return i; }
    function putIn(p, x) { x = Math.min(x, p.chips); p.chips -= x; p.bet += x; p.total += x; pot += x; if (p.chips === 0) p.allin = true; }
    function act(i, kind, amt) {
      var p = P[i], call = maxBet - p.bet;
      if (kind === 'fold') { p.fold = true; p.last = 'Пас'; api.sound('click'); }
      else if (kind === 'call') { putIn(p, call); p.last = call > 0 ? (p.allin ? 'Ва-банк' : 'Колл ' + call) : 'Чек'; api.sound(call > 0 ? 'coin' : 'click'); }
      else { // рейз до amt
        var to = Math.min(amt, p.bet + p.chips), add = to - p.bet;
        if (to - maxBet >= minRaise || to === p.bet + p.chips) { if (to - maxBet > minRaise) minRaise = to - maxBet; if (to > maxBet) { maxBet = to; lastRaiser = i; actedSince = {}; } }
        putIn(p, add); p.last = p.allin ? 'Ва-банк!' : 'Рейз до ' + to; api.sound('coin');
      }
      actedSince[i] = 1; raiseOpen = false;
      if (active().length === 1) return finishHand();
      advance(i);
    }
    function roundDone() { return P.every(function (p, i) { return !canAct(p) || (actedSince[i] && p.bet === maxBet); }); }
    function advance(i) {
      if (roundDone()) return nextStreet();
      toAct = nextSeat(i); skipIfCant(); thinkT = 0.6 + Math.random() * 0.6;
    }
    function skipIfCant() { var g = 0; while (!canAct(P[toAct]) && g++ < 5) toAct = nextSeat(toAct); if (roundDone()) nextStreet(); }
    function nextStreet() {
      P.forEach(function (p) { p.bet = 0; }); maxBet = 0; minRaise = bb; actedSince = {};
      street++;
      if (street === 1) { deck.pop(); board.push(deck.pop(), deck.pop(), deck.pop()); }
      else if (street <= 3) { deck.pop(); board.push(deck.pop()); }
      if (street > 3) return finishHand();
      api.sound('move');
      var can = P.filter(canAct).length;
      if (can <= 1) { phase = 'run'; phaseT = 0; return; } // все в олл-ине — докладываем карты
      toAct = nextSeat(dealer); skipIfCant(); thinkT = 0.9;
    }
    function finishHand() {
      phase = 'show'; phaseT = 0; showdown = active().length > 1;
      var live = active(), myGain = 0, before = P[0].chips;
      if (live.length === 1) { live[0].chips += pot; winners = [live.indexOf(live[0]) >= 0 ? P.indexOf(live[0]) : -1]; say(live[0].name + ' забирает банк ' + pot); }
      else {
        while (board.length < 5) board.push(deck.pop());
        live.forEach(function (p) { p.val = best7(p.cards.concat(board)); });
        // побочные банки по уровням вложений
        var levels = P.map(function (p) { return p.total; }).filter(function (x) { return x > 0; }).sort(function (a, b) { return a - b; }).filter(function (x, i, a) { return a.indexOf(x) === i; }), prev = 0, wset = {};
        levels.forEach(function (lv) {
          var part = 0; P.forEach(function (p) { part += Math.max(0, Math.min(p.total, lv) - prev); });
          var elig = live.filter(function (p) { return p.total >= lv; }); if (!elig.length) { prev = lv; return; }
          var bv = Math.max.apply(null, elig.map(function (p) { return p.val; })), ws = elig.filter(function (p) { return p.val === bv; });
          ws.forEach(function (w) { w.chips += Math.floor(part / ws.length); wset[P.indexOf(w)] = 1; }); prev = lv;
        });
        winners = Object.keys(wset).map(Number);
        var w0 = P[winners[0]]; say((winners.length > 1 ? 'Делёж банка' : w0.name + ' выигрывает') + ': ' + CATN[catOf(w0.val)]);
      }
      myGain = P[0].chips - before;
      if (myGain > P[0].total) { api.addScore(Math.round((myGain - P[0].total) / 5)); api.sound('win'); if (myGain > 300) api.fx.confetti(30); } else if (winners.indexOf(0) < 0) api.sound('hit');
      pot = 0;
    }
    function afterShow() {
      P.forEach(function (p, i) { if (!p.out && p.chips <= 0) { p.out = true; if (i) { say(p.name + ' выбывает!'); api.addScore(100 * (api.diff + 1)); } } });
      if (P[0].out) { endT = 2; say('У тебя закончились фишки'); api.sound('over'); return; }
      if (P.every(function (p, i) { return !i || p.out; })) { endT = 2.5; say('Ты обыграл всех! 🏆'); api.addScore(500 * (api.diff + 1)); api.fx.confetti(80); api.sound('win'); return; }
      newHand();
    }
    function bot(i) {
      var p = P[i], call = maxBet - p.bet, opp = active().length - 1, e = street === 0 ? preflop(p) : equity(p, opp, [40, 80, 140, 200][api.diff]);
      e += (Math.random() - 0.5) * [0.35, 0.2, 0.12, 0.06][api.diff];
      var potOdds = call / (pot + call || 1), fair = 1 / (opp + 1), strong = e > fair * 1.9 || e > 0.75;
      if (call === 0) { if (strong || Math.random() < [0.15, 0.1, 0.12, 0.1][api.diff]) act(i, 'raise', maxBet + Math.max(bb, Math.round(pot * (0.5 + Math.random() * 0.4) / bb) * bb)); else act(i, 'call'); return; }
      if (strong && Math.random() < 0.7) { act(i, 'raise', maxBet + Math.max(minRaise, Math.round(pot * 0.7 / bb) * bb)); return; }
      if (e > potOdds + (api.diff >= 2 ? 0.05 : 0) || (call <= bb && e > fair * 0.7)) act(i, 'call'); else act(i, 'fold');
    }
    function say(s) { msg = s; msgT = 2.2; }
    // раскладка мест: я снизу, боты слева, сверху, справа
    function seat(i) { var W = api.W, H = api.H; return [[W / 2, H * 0.66], [W * 0.14, H * 0.27], [W / 2, H * 0.13], [W * 0.86, H * 0.27]][i]; }
    function btns() { var y = api.H - 76, w = (api.W - 40) / 3; return [['fold', 12, y, w, 52, 'Пас', '#475569'], ['call', 20 + w, y, w, 52, '', '#2563eb'], ['raise', 28 + w * 2, y, w, 52, 'Рейз', '#16a34a']]; }
    function raiseBtns() { var y = api.H - 136, w = (api.W - 40) / 3, p = P[0], half = maxBet + Math.max(minRaise, Math.round(pot / 2 / bb) * bb), full = maxBet + Math.max(minRaise, Math.round(pot / bb) * bb); return [[half, '½ банка ' + Math.min(half, p.bet + p.chips)], [full, 'Банк ' + Math.min(full, p.bet + p.chips)], [p.bet + p.chips, 'Ва-банк ' + (p.bet + p.chips)]].map(function (r, k) { return [r[0], 12 + k * (w + 8), y, w, 48, r[1]]; }); }
    function hit(b, d, o) { o = o || 1; return d.x >= b[o] && d.x <= b[o] + b[o + 2] && d.y >= b[o + 1] && d.y <= b[o + 1] + b[o + 3]; }
    function drawCard(c, x, y, w, cd, hidden, glow) {
      var h = w * 1.4;
      c.fillStyle = 'rgba(0,0,0,.35)'; K.rr(c, x + 2, y + 3, w, h, w * 0.14); c.fill();
      if (hidden) { var g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#b91c1c'); g.addColorStop(1, '#7f1d1d'); K.rr(c, x, y, w, h, w * 0.14); c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.5; K.rr(c, x + 3, y + 3, w - 6, h - 6, w * 0.1); c.stroke(); return; }
      K.rr(c, x, y, w, h, w * 0.14); c.fillStyle = '#fff'; c.fill(); if (glow) { c.strokeStyle = '#facc15'; c.lineWidth = 3; c.stroke(); }
      var red = cd.s === 1 || cd.s === 2; c.fillStyle = red ? '#dc2626' : '#111827';
      c.font = '900 ' + Math.round(w * 0.42) + 'px system-ui'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(RN[cd.r] === 'T' ? '10' : RN[cd.r], x + w * 0.1, y + w * 0.06);
      c.font = Math.round(w * 0.55) + 'px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(SU[cd.s], x + w / 2, y + h * 0.64);
    }
    return {
      reset: function () {
        P = NAMES.map(function (n) { return { name: n, chips: 1000, cards: [], bet: 0, total: 0 }; }); dealer = 0; hand = 0; t = 0; endT = 0; msgT = 0; sb = 10; bb = 20; newHand();
      },
      resize: function () { }, idle: function (dt) { t += dt || 0; }, key: function () { },
      input: function (type, d) {
        if (type !== 'down' || endT > 0) return;
        if (phase === 'show') { if (phaseT > 1.2) afterShow(); return; }
        if (phase !== 'bet' || toAct !== 0) return;
        if (raiseOpen) { var rb = raiseBtns(); for (var k = 0; k < rb.length; k++) if (hit(rb[k], d)) { act(0, 'raise', rb[k][0]); return; } }
        var B = btns();
        for (var j = 0; j < B.length; j++) if (hit(B[j], d)) {
          if (B[j][0] === 'fold') { if (maxBet - P[0].bet === 0) act(0, 'call'); else act(0, 'fold'); }
          else if (B[j][0] === 'call') act(0, 'call');
          else raiseOpen = !raiseOpen;
          return;
        }
        raiseOpen = false;
      },
      update: function (dt) {
        t += dt; phaseT += dt; if (msgT > 0) msgT -= dt;
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (phase === 'run') { if (phaseT > 0.9) { phaseT = 0; if (board.length < 5) { deck.pop(); board.push(deck.pop()); api.sound('move'); } else finishHand(); } return; }
        if (phase === 'show') { if (phaseT > 4) afterShow(); return; }
        if (phase === 'bet' && toAct !== 0) { thinkT -= dt; if (thinkT <= 0) bot(toAct); }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        c.fillStyle = '#1c1917'; c.fillRect(0, 0, W, H);
        // стол
        var tw = W * 0.92, th = H * 0.62, tx = W / 2, ty = H * 0.4;
        c.fillStyle = '#78350f'; c.beginPath(); c.ellipse(tx, ty, tw / 2 + 10, th / 2 + 10, 0, 0, 6.283); c.fill();
        var fg = c.createRadialGradient(tx, ty - th * 0.2, 20, tx, ty, tw / 2); fg.addColorStop(0, '#16a34a'); fg.addColorStop(1, '#14532d'); c.fillStyle = fg; c.beginPath(); c.ellipse(tx, ty, tw / 2, th / 2, 0, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2; c.beginPath(); c.ellipse(tx, ty, tw / 2 - 18, th / 2 - 18, 0, 0, 6.283); c.stroke();
        // общие карты и банк
        var cw = Math.min(46, (W - 60) / 5.6);
        for (var i = 0; i < 5; i++) { var x = W / 2 - (5 * (cw + 6) - 6) / 2 + i * (cw + 6); if (board[i]) drawCard(c, x, ty - cw * 0.9, cw, board[i]); else { c.strokeStyle = 'rgba(255,255,255,.15)'; c.setLineDash([4, 4]); K.rr(c, x, ty - cw * 0.9, cw, cw * 1.4, cw * 0.14); c.stroke(); c.setLineDash([]); } }
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fde68a'; c.font = '900 16px system-ui'; c.fillText('Банк: ' + pot, W / 2, ty - cw * 0.9 - 30);
        c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '700 11px system-ui'; c.fillText('Блайнды ' + sb + '/' + bb + ' · раздача ' + hand, W / 2, ty - cw * 0.9 - 12);
        P.forEach(function (p, k) {
          var s = seat(k), isMe = k === 0, turn = phase === 'bet' && toAct === k, won = phase === 'show' && winners.indexOf(k) >= 0;
          c.globalAlpha = p.out ? 0.3 : p.fold ? 0.55 : 1;
          var pw = isMe ? Math.min(62, W * 0.16) : 30;
          if (p.cards.length) p.cards.forEach(function (cd, j) { drawCard(c, s[0] - pw - 3 + j * (pw + 6) + (isMe ? 0 : pw / 2 + 2), s[1] - (isMe ? pw * 1.6 : 52), pw, cd, !isMe && !(phase === 'show' && showdown && !p.fold), won); });
          // табличка игрока
          K.rr(c, s[0] - 52, s[1] + (isMe ? 8 : -6), 104, 40, 12); c.fillStyle = turn ? 'rgba(250,204,21,.9)' : won ? 'rgba(34,197,94,.9)' : 'rgba(15,23,42,.85)'; c.fill();
          c.fillStyle = turn ? '#111' : '#fff'; c.font = '800 12px system-ui'; c.fillText(p.name + (k === dealer ? ' Ⓓ' : ''), s[0], s[1] + (isMe ? 20 : 6));
          c.font = '900 13px system-ui'; c.fillStyle = turn ? '#111' : '#fde68a'; c.fillText('🪙 ' + p.chips, s[0], s[1] + (isMe ? 37 : 23));
          if (p.last && !p.out) { c.font = '800 11px system-ui'; c.fillStyle = p.fold ? '#fca5a5' : '#bbf7d0'; c.fillText(p.last + (p.bet ? ' · ' + p.bet : ''), s[0], s[1] + (isMe ? 58 : 44)); }
          if (phase === 'show' && showdown && !p.fold && p.val != null) { c.font = '800 11px system-ui'; c.fillStyle = '#fef3c7'; c.fillText(CATN[catOf(p.val)], s[0], s[1] + (isMe ? -pw * 1.6 - 12 : -60)); }
          c.globalAlpha = 1;
        });
        // кнопки
        if (phase === 'bet' && toAct === 0) {
          var call = maxBet - P[0].bet, B = btns();
          B.forEach(function (b) { var label = b[0] === 'call' ? (call > 0 ? (call >= P[0].chips ? 'Ва-банк ' + P[0].chips : 'Колл ' + call) : 'Чек') : b[0] === 'fold' ? (call > 0 ? 'Пас' : 'Чек') : (raiseOpen ? '✕ Рейз' : 'Рейз ▲'); K.key(c, b[1], b[2], b[3], b[4], b[6], label, '900 16px system-ui'); });
          if (raiseOpen) raiseBtns().forEach(function (r) { K.key(c, r[1], r[2], r[3], r[4], '#15803d', r[5], '800 12px system-ui'); });
          var e = board.length ? best7(P[0].cards.concat(board)) : -1;
          if (e >= 0) { c.fillStyle = '#86efac'; c.font = '800 12px system-ui'; c.fillText('У тебя: ' + CATN[catOf(e)], W / 2, H - 92 - (raiseOpen ? 62 : 0)); }
        }
        if (msgT > 0) K.toast(c, W, H * 0.06 + 4, msg, Math.min(1, msgT * 2));
        else if (phase === 'show') K.toast(c, W, H - 50, 'Нажми — следующая раздача', 1);
      }
    };
  }
};
