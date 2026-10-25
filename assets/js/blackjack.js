/* Очко: набери как можно ближе к 21, но не больше */
window.GAMES = window.GAMES || {};
window.GAMES.blackjack = {
  title: 'Очко', desc: 'Набери 21 или ближе к нему', cat: 'arcade', isNew4: true, medals: [800, 2000, 3500],
  hint: 'Нажми «Ещё», чтобы взять карту, или «Стоп», чтобы остановиться. Больше 21 — перебор. Дилер берёт карты до 17. Сыграйте 10 раундов. Ставка растёт с уровнем сложности, а 21 с двух карт платит вдвойне.',
  d0: 'Ставка 100', d1: 'Ставка 200', d2: 'Ставка 300', d3: 'Ставка 400',
  colors: ['#15803d', '#166534'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#14532d"/><rect x="26" y="26" width="32" height="44" rx="5" fill="#fff"/><rect x="42" y="34" width="32" height="44" rx="5" fill="#fff" stroke="#14532d" stroke-width="3"/><text x="58" y="62" font-size="20" font-family="sans-serif" font-weight="800" fill="#dc2626" text-anchor="middle">21</text></svg>',
  create: function (api) {
    var hand, dealer, state, timer, msg, round, bet, t, K = window.GBK, SUITS = ['♠', '♣', '♥', '♦'], SPR = {};
    function rank() { return { r: 1 + Math.floor(Math.random() * 13), s: Math.floor(Math.random() * 4), a: 0 }; }
    function value(r) { return r === 1 ? 11 : Math.min(r, 10); }
    function score(h, upto) {
      var s = 0, aces = 0;
      h.forEach(function (c, i) { if (upto != null && i >= upto) return; s += value(c.r); if (c.r === 1) aces++; });
      while (s > 21 && aces > 0) { s -= 10; aces--; }
      return s;
    }
    function label(r) { return r === 1 ? 'A' : r === 11 ? 'J' : r === 12 ? 'Q' : r === 13 ? 'K' : String(r); }
    function deal() {
      round++;
      hand = [rank(), rank()]; dealer = [rank(), rank()];
      hand[0].a = -0.1; dealer[0].a = -0.3; hand[1].a = -0.5; dealer[1].a = -0.7;
      state = 'p'; msg = 'Ещё или стоп?'; api.sound('click');
      if (score(hand) === 21) { state = 'wait'; timer = 1; }
    }
    function stand() { state = 'd'; timer = 0.7; msg = 'Ход дилера…'; }
    function resolve() {
      var p = score(hand), d = score(dealer), blackjack = hand.length === 2 && p === 21;
      if (p > 21) { msg = 'Перебор'; api.sound('hit'); }
      else if (d > 21 || p > d) {
        var pts = bet * (blackjack ? 2 : 1);
        api.addScore(pts); api.sound('win'); if (blackjack) api.fx.confetti(40);
        msg = blackjack ? 'Очко с двух карт! +' + pts : (d > 21 ? 'У дилера перебор! +' : 'Выигрыш +') + pts;
      }
      else if (p === d) msg = 'Ничья';
      else { msg = 'Дилер выиграл'; api.sound('hit'); }
      state = 'end'; timer = 2;
    }
    var PIP = { 2: [[.5, .2], [.5, .8]], 3: [[.5, .2], [.5, .5], [.5, .8]], 4: [[.3, .2], [.7, .2], [.3, .8], [.7, .8]], 5: [[.3, .2], [.7, .2], [.5, .5], [.3, .8], [.7, .8]],
      6: [[.3, .2], [.7, .2], [.3, .5], [.7, .5], [.3, .8], [.7, .8]], 7: [[.3, .2], [.7, .2], [.5, .35], [.3, .5], [.7, .5], [.3, .8], [.7, .8]],
      8: [[.3, .2], [.7, .2], [.5, .35], [.3, .5], [.7, .5], [.5, .65], [.3, .8], [.7, .8]], 9: [[.3, .17], [.7, .17], [.3, .39], [.7, .39], [.5, .5], [.3, .61], [.7, .61], [.3, .83], [.7, .83]],
      10: [[.3, .17], [.7, .17], [.5, .28], [.3, .39], [.7, .39], [.3, .61], [.7, .61], [.5, .72], [.3, .83], [.7, .83]] };
    function cardImg(cd, w, h) {
      var key = cd.r + '_' + cd.s + '_' + w; if (SPR[key]) return SPR[key];
      var d = Math.min(2, window.devicePixelRatio || 1), cv = document.createElement('canvas'); cv.width = w * d; cv.height = h * d;
      var x = cv.getContext('2d'); x.scale(d, d);
      var red = cd.s >= 2, col = red ? '#c81e1e' : '#111827', S = SUITS[cd.s];
      var g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#fff'); g.addColorStop(1, '#eceff3');
      K.rr(x, 0.5, 0.5, w - 1, h - 1, 7); x.fillStyle = g; x.fill(); x.strokeStyle = '#9ca3af'; x.stroke();
      x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle';
      function corner() { x.font = '800 ' + Math.round(w * 0.22) + 'px Georgia, serif'; x.fillText(label(cd.r), w * 0.15, h * 0.1); x.font = Math.round(w * 0.19) + 'px system-ui'; x.fillText(S, w * 0.15, h * 0.21); }
      corner(); x.save(); x.translate(w, h); x.rotate(Math.PI); corner(); x.restore();
      var ix = w * 0.25, iy = h * 0.12, iw = w * 0.5, ih = h * 0.76;
      if (cd.r === 1) { x.font = Math.round(w * 0.6) + 'px system-ui'; x.fillText(S, w / 2, h / 2 + 2); }
      else if (cd.r <= 10) { x.font = Math.round(w * 0.19) + 'px system-ui'; PIP[cd.r].forEach(function (p) { x.save(); x.translate(ix + p[0] * iw, iy + p[1] * ih); if (p[1] > 0.55) x.rotate(Math.PI); x.fillText(S, 0, 0); x.restore(); }); }
      else {
        K.rr(x, ix - 3, iy, iw + 6, ih, 4); x.fillStyle = red ? '#fff1f2' : '#eff6ff'; x.fill(); x.strokeStyle = '#d4a017'; x.lineWidth = 1.5; x.stroke();
        x.fillStyle = red ? '#dc2626' : '#1e3a8a'; x.font = '900 ' + Math.round(w * 0.42) + 'px Georgia, serif'; x.fillText(label(cd.r), w / 2, h / 2 + 4);
        x.fillStyle = '#d4a017'; x.beginPath(); var cy = iy + ih * 0.16, cw = iw * 0.5;
        x.moveTo(w / 2 - cw / 2, cy + 6); x.lineTo(w / 2 - cw / 2, cy - 4); x.lineTo(w / 2 - cw / 4, cy + 1); x.lineTo(w / 2, cy - 7); x.lineTo(w / 2 + cw / 4, cy + 1); x.lineTo(w / 2 + cw / 2, cy - 4); x.lineTo(w / 2 + cw / 2, cy + 6); x.fill();
        x.fillStyle = col; x.font = Math.round(w * 0.16) + 'px system-ui'; x.fillText(S, w / 2, iy + ih * 0.86);
      }
      SPR[key] = { cv: cv }; return SPR[key];
    }
    function backImg(w, h) {
      var key = 'b' + w; if (SPR[key]) return SPR[key];
      var d = Math.min(2, window.devicePixelRatio || 1), cv = document.createElement('canvas'); cv.width = w * d; cv.height = h * d;
      var x = cv.getContext('2d'); x.scale(d, d);
      K.rr(x, 0.5, 0.5, w - 1, h - 1, 7); x.fillStyle = '#fff'; x.fill();
      K.rr(x, 4, 4, w - 8, h - 8, 5); x.fillStyle = '#1e3a8a'; x.fill(); x.save(); x.clip();
      x.strokeStyle = 'rgba(147,197,253,.35)'; for (var q = -h; q < w + h; q += 7) { x.beginPath(); x.moveTo(q, 0); x.lineTo(q + h, h); x.stroke(); x.beginPath(); x.moveTo(q + h, 0); x.lineTo(q, h); x.stroke(); }
      x.restore(); x.strokeStyle = '#93c5fd'; x.lineWidth = 1.5; K.rr(x, 7, 7, w - 14, h - 14, 4); x.stroke();
      SPR[key] = { cv: cv }; return SPR[key];
    }
    function drawHand(c, h, y, hideSecond) {
      var W = api.W, cw = Math.min(70, W / 5.2), ch = Math.round(cw * 1.42), cwI = Math.round(cw), step = Math.min(cw * 0.78, (W - 40 - cw) / Math.max(1, h.length - 1)), x0 = W / 2 - (step * (h.length - 1) + cw) / 2;
      h.forEach(function (cd, i) {
        if (cd.a < 1) cd.a = Math.min(1, cd.a + 0.06);
        var k = Math.max(0, cd.a), e = 1 - Math.pow(1 - k, 3);
        var tx = x0 + i * step, sx = W - 20, sy = 20, x = sx + (tx - sx) * e, yy = sy + (y - sy) * e, rot = (1 - e) * 1.2 + (i - (h.length - 1) / 2) * 0.04;
        if (k <= 0) return;
        c.save(); c.translate(x + cw / 2, yy + ch / 2); c.rotate(rot);
        c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 8; c.shadowOffsetY = 4;
        var img = hideSecond && i === 1 ? backImg(cwI, ch) : cardImg(cd, cwI, ch);
        c.drawImage(img.cv, -cw / 2, -ch / 2, cw, ch); c.restore();
      });
    }
    function chip(c, x, y, col, n) {
      for (var i = 0; i < n; i++) {
        var yy = y - i * 4;
        c.fillStyle = K.shade(col, -0.35); c.beginPath(); c.ellipse(x, yy + 2, 16, 6, 0, 0, 6.283); c.fill();
        c.fillStyle = col; c.beginPath(); c.ellipse(x, yy, 16, 6, 0, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.8)'; c.setLineDash([4, 4]); c.lineWidth = 2; c.beginPath(); c.ellipse(x, yy, 12, 4, 0, 0, 6.283); c.stroke(); c.setLineDash([]);
      }
    }
    return {
      reset: function () { round = 0; t = 0; bet = 100 * (api.diff + 1); deal(); },
      resize: function () { }, idle: function () { }, key: function () { },
      input: function (type, d) {
        if (type !== 'down' || state !== 'p' || d.y < api.H - 110) return;
        api.sound('click');
        if (d.x < api.W / 2) { var nc = rank(); hand.push(nc); if (score(hand) > 21) { state = 'wait'; timer = 0.6; } }
        else stand();
      },
      update: function (dt) {
        t += dt;
        if (state === 'wait' && (timer -= dt) <= 0) { if (score(hand) > 21) resolve(); else stand(); }
        else if (state === 'd' && (timer -= dt) <= 0) {
          // дилер открывает карту и добирает по одной до 17
          if (score(dealer) < 17 && score(hand) <= 21) { var nc = rank(); dealer.push(nc); api.sound('click'); timer = 0.7; }
          else resolve();
        }
        else if (state === 'end' && (timer -= dt) <= 0) { if (round >= 10) { state = 'over'; api.gameOver(); } else deal(); }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        var g = c.createRadialGradient(W / 2, H * 0.45, 30, W / 2, H * 0.45, Math.max(W, H) * 0.75);
        g.addColorStop(0, '#15803d'); g.addColorStop(1, '#052e16'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(250,204,21,.25)'; c.lineWidth = 2; c.beginPath(); c.ellipse(W / 2, H * 0.14, W * 0.62, H * 0.42, 0, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = 'rgba(255,255,255,.08)'; c.font = '900 30px Georgia, serif'; c.fillText('ОЧКО ПЛАТИТ 2 : 1', W / 2, H * 0.42);
        c.fillStyle = '#d1fae5'; c.font = '800 14px system-ui'; c.fillText('Раунд ' + round + ' / 10', W / 2, 22);
        // колода в углу
        var bk = backImg(46, 65); for (var q = 0; q < 4; q++) c.drawImage(bk.cv, W - 66 - q, 8 - q, 46, 65);
        var hide = state === 'p' || state === 'wait';
        var dy = 70, py = H * 0.5 - 20, cw = Math.min(70, W / 5.2);
        function badge(txt, y, col) { c.font = '900 15px system-ui'; var w = c.measureText(txt).width + 26; K.rr(c, W / 2 - w / 2, y - 14, w, 28, 14); c.fillStyle = col; c.fill(); c.fillStyle = '#fff'; c.fillText(txt, W / 2, y + 1); }
        badge('Дилер: ' + (hide ? score(dealer, 1) + ' + ?' : score(dealer)), dy - 22, 'rgba(0,0,0,.45)');
        drawHand(c, dealer, dy, hide);
        var ps = score(hand);
        badge('Вы: ' + ps, py - 22, ps > 21 ? '#b91c1c' : ps === 21 ? '#b45309' : 'rgba(0,0,0,.45)');
        drawHand(c, hand, py, false);
        // ставка фишками
        var cy = py + cw * 1.42 + 34;
        chip(c, W / 2 - 40, cy, '#dc2626', 1 + api.diff); chip(c, W / 2, cy, '#2563eb', 2); chip(c, W / 2 + 40, cy, '#16a34a', 1 + (round % 3));
        c.fillStyle = '#fde68a'; c.font = '800 13px system-ui'; c.fillText('ставка ' + bet, W / 2, cy + 22);
        c.fillStyle = '#fef3c7'; c.font = '900 19px system-ui'; c.fillText(msg, W / 2, cy + 52);
        if (state === 'p') {
          K.button(c, 20, H - 92, W / 2 - 30, 58, '#22c55e', '#15803d', 'Ещё', '900 20px system-ui');
          K.button(c, W / 2 + 10, H - 92, W / 2 - 30, 58, '#ef4444', '#b91c1c', 'Стоп', '900 20px system-ui');
        }
      }
    };
  }
};
