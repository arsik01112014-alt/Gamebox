/* Домино: выкладывай костяшки с совпадающими очками. Избавься от всех первым */
window.GAMES = window.GAMES || {};
window.GAMES.domino = {
  title: 'Домино', desc: 'Классика против компьютера', cat: 'board', isNew4: true, medals: [150, 400, 800],
  hint: 'Нажми на костяшку — она встанет к концу цепочки с таким же числом. Если подходит к обоим концам — выбери стрелкой. Нечем ходить — бери из базара. Кто первым выложит все костяшки, получает очки за костяшки соперника. Игра до 100 очков.',
  d0: 'Соперник ходит наугад', d1: 'Соперник сбрасывает крупные', d2: 'Соперник следит за концами', d3: 'Соперник считает костяшки',
  colors: ['#334155', '#0f172a'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#166534"/><g transform="rotate(-18 50 50)"><rect x="22" y="30" width="56" height="28" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/><path d="M50 32v24" stroke="#94a3b8" stroke-width="2"/><g fill="#0f172a"><circle cx="30" cy="38" r="3"/><circle cx="42" cy="50" r="3"/><circle cx="36" cy="44" r="3"/><circle cx="58" cy="38" r="3"/><circle cx="70" cy="38" r="3"/><circle cx="58" cy="50" r="3"/><circle cx="70" cy="50" r="3"/></g></g></svg>',
  create: function (api) {
    var K = window.GBK, hands, pile, chain, L, R, turn, sc, t, endT, thinkT, roundOver, roundT, msg, msgT, choice, passes, anim;
    function deal() {
      var all = []; for (var a = 0; a <= 6; a++) for (var b = a; b <= 6; b++) all.push([a, b]);
      for (var i = all.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = all[i]; all[i] = all[j]; all[j] = x; }
      hands = [all.slice(0, 7), all.slice(7, 14)]; pile = all.slice(14); chain = []; L = R = -1; roundOver = 0; roundT = 0; choice = null; passes = 0;
      // начинает тот, у кого самый крупный дубль
      var best = -1, who = 0; hands.forEach(function (h, p) { h.forEach(function (d) { if (d[0] === d[1] && d[0] > best) { best = d[0]; who = p; } }); });
      turn = who; thinkT = 1; sortHand();
    }
    function sortHand() { hands[0].sort(function (a, b) { return (a[0] + a[1]) - (b[0] + b[1]); }); }
    function fits(d) { if (!chain.length) return ['L']; var r = []; if (d[0] === L || d[1] === L) r.push('L'); if (d[0] === R || d[1] === R) r.push('R'); return r; }
    function canMove(p) { return hands[p].some(function (d) { return fits(d).length; }); }
    function place(p, k, side) {
      var d = hands[p].splice(k, 1)[0];
      if (!chain.length) { chain.push({ a: d[0], b: d[1] }); L = d[0]; R = d[1]; }
      else if (side === 'L') { var a = d[1] === L ? d[0] : d[1]; chain.unshift({ a: a, b: L }); L = a; }
      else { var b = d[0] === R ? d[1] : d[0]; chain.push({ a: R, b: b }); R = b; }
      anim = { side: side, t: 0.3 }; api.sound('click'); api.vibrate(8); passes = 0;
      if (!hands[p].length) return endRound(p);
      turn = 1 - turn; thinkT = 0.7 + Math.random() * 0.5;
    }
    function draw(p) { if (!pile.length) return false; hands[p].push(pile.pop()); if (p === 0) sortHand(); api.sound('move'); return true; }
    function pips(h) { return h.reduce(function (s, d) { return s + d[0] + d[1]; }, 0); }
    function endRound(w) {
      roundOver = 1; roundT = 0;
      if (w < 0) { // рыба: побеждает тот, у кого меньше очков на руках
        var a = pips(hands[0]), b = pips(hands[1]); w = a === b ? -1 : a < b ? 0 : 1; say('Рыба! ' + (w < 0 ? 'Ничья' : w === 0 ? 'У тебя меньше очков' : 'У компьютера меньше очков'));
        if (w < 0) return;
      }
      var gain = Math.max(1, pips(hands[1 - w])); sc[w] += gain;
      if (w === 0) { api.addScore(gain * (api.diff + 1)); api.sound('win'); } else api.sound('hit');
      if (!msgT || msgT < 0.5) say((w === 0 ? 'Ты выиграл кон: +' : 'Компьютер выиграл кон: +') + gain);
      if (sc[w] >= 100) { roundOver = 2; if (w === 0) { api.fx.confetti(60); api.addScore(200 * (api.diff + 1)); } endT = 3; }
    }
    function say(s) { msg = s; msgT = 2; }
    function aiMove() {
      if (!canMove(1)) { if (draw(1)) { thinkT = 0.35; return; } passes++; say('Компьютер пропускает ход'); turn = 0; if (passes >= 2) endRound(-1); return; }
      var opts = []; hands[1].forEach(function (d, k) { fits(d).forEach(function (s) { opts.push([k, s]); }); });
      var best = opts[0], bs = -1e9;
      opts.forEach(function (o) {
        var d = hands[1][o[0]], s = api.diff === 0 ? Math.random() : d[0] + d[1] + (d[0] === d[1] ? 4 : 0);
        if (api.diff >= 2) { // оставить себе концы, которыми можно ходить
          var nl = o[1] === 'L' ? (d[1] === L ? d[0] : d[1]) : L, nr = o[1] === 'R' ? (d[0] === R ? d[1] : d[0]) : R;
          var rest = hands[1].filter(function (x, i) { return i !== o[0]; }); s += rest.filter(function (x) { return x[0] === nl || x[1] === nl || x[0] === nr || x[1] === nr; }).length * 3;
          if (api.diff >= 3) { var mine = hands[0].filter(function (x) { return x[0] === nl || x[1] === nl || x[0] === nr || x[1] === nr; }).length; s -= mine * 1.5; } // «знает», чем закрыть игрока — как опытный, считающий костяшки
        }
        if (s > bs) { bs = s; best = o; }
      });
      place(1, best[0], best[1]);
    }
    // раскладка цепочки змейкой: ряды слева направо и обратно
    var TW, TH;
    function layout() { TW = Math.min(46, (api.W - 24) / 8); TH = TW / 2; }
    function chainPos() {
      var per = Math.floor((api.W - 24) / (TW + 2)), out = [], top = 120;
      chain.forEach(function (c2, i) { var row = Math.floor(i / per), k = i % per, rev = row % 2, x = rev ? api.W - 12 - (k + 1) * (TW + 2) : 12 + k * (TW + 2); out.push({ x: x, y: top + row * (TH + 14), rev: rev, d: c2 }); });
      // по вертикали — по центру поля
      var rows = Math.ceil(chain.length / per), shift = Math.max(0, (api.H * 0.52 - top - rows * (TH + 14)) / 2); out.forEach(function (o) { o.y += shift; });
      return out;
    }
    function handPos(i, n) { var w = Math.min(44, (api.W - 24) / Math.min(n, 8) - 6), rows = Math.ceil(n / 8), row = Math.floor(i / 8), inRow = row === rows - 1 ? n - row * 8 : 8, k = i - row * 8; return { x: api.W / 2 - (inRow * (w + 6) - 6) / 2 + k * (w + 6), y: api.H - 200 + row * (w * 2 + 10) - (rows - 1) * (w + 4), w: w, h: w * 2 }; }
    function pipsAt(c, cx, cy, n, s) {
      var P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[n] || [];
      c.fillStyle = '#0f172a'; P.forEach(function (p) { c.beginPath(); c.arc(cx + p[0] * s * 0.28, cy + p[1] * s * 0.28, Math.max(1.4, s * 0.09), 0, 6.283); c.fill(); });
    }
    function tile(c, x, y, w, h, a, b, vertical, glow, back) {
      c.fillStyle = 'rgba(0,0,0,.35)'; K.rr(c, x + 2, y + 3, w, h, Math.min(w, h) * 0.2); c.fill();
      if (back) { var bg = c.createLinearGradient(x, y, x + w, y + h); bg.addColorStop(0, '#475569'); bg.addColorStop(1, '#1e293b'); K.rr(c, x, y, w, h, Math.min(w, h) * 0.2); c.fillStyle = bg; c.fill(); c.strokeStyle = 'rgba(255,255,255,.15)'; c.lineWidth = 1; c.stroke(); return; }
      var g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e2e8f0');
      K.rr(c, x, y, w, h, Math.min(w, h) * 0.2); c.fillStyle = g; c.fill(); c.strokeStyle = glow ? '#facc15' : '#cbd5e1'; c.lineWidth = glow ? 3 : 1; c.stroke();
      c.strokeStyle = '#94a3b8'; c.lineWidth = 1.2; c.beginPath();
      if (vertical) { c.moveTo(x + 4, y + h / 2); c.lineTo(x + w - 4, y + h / 2); c.stroke(); pipsAt(c, x + w / 2, y + h / 4, a, w); pipsAt(c, x + w / 2, y + h * 3 / 4, b, w); }
      else { c.moveTo(x + w / 2, y + 4); c.lineTo(x + w / 2, y + h - 4); c.stroke(); pipsAt(c, x + w / 4, y + h / 2, a, h); pipsAt(c, x + w * 3 / 4, y + h / 2, b, h); }
    }
    function btnPile() { return [api.W / 2 - 80, api.H * 0.52 + 30, 160, 44]; }
    return {
      reset: function () { sc = [0, 0]; t = 0; endT = 0; msgT = 0; layout(); deal(); },
      resize: layout, idle: function (dt) { t += dt || 0; }, key: function () { },
      input: function (type, d) {
        if (type !== 'down' || roundOver || turn !== 0 || endT > 0) { if (type === 'down' && roundOver === 1 && roundT > 1) deal(); return; }
        if (choice != null) { // выбор стороны
          var cp = chainPos(), lp = cp[0], rp = cp[cp.length - 1];
          if (Math.hypot(d.x - (lp.x + TW / 2), d.y - (lp.y + TH / 2)) < 40) { place(0, choice, 'L'); choice = null; return; }
          if (Math.hypot(d.x - (rp.x + TW / 2), d.y - (rp.y + TH / 2)) < 40) { place(0, choice, 'R'); choice = null; return; }
          choice = null;
        }
        var b = btnPile();
        if (!canMove(0) && d.x > b[0] && d.x < b[0] + b[2] && d.y > b[1] && d.y < b[1] + b[3]) {
          if (!draw(0)) { passes++; say('Ты пропускаешь ход'); turn = 1; thinkT = 0.8; if (passes >= 2) endRound(-1); }
          return;
        }
        for (var i = hands[0].length - 1; i >= 0; i--) {
          var p = handPos(i, hands[0].length);
          if (d.x >= p.x && d.x <= p.x + p.w && d.y >= p.y && d.y <= p.y + p.h) {
            var f = fits(hands[0][i]); if (!f.length) { api.vibrate(25); say('Эта не подходит'); return; }
            if (f.length === 2 && L !== R) { choice = i; say('Нажми на конец цепочки'); return; }
            place(0, i, f[0]); return;
          }
        }
      },
      update: function (dt) {
        t += dt; if (msgT > 0) msgT -= dt; if (anim) { anim.t -= dt; if (anim.t <= 0) anim = null; }
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (roundOver) { roundT += dt; return; }
        if (turn === 1) { thinkT -= dt; if (thinkT <= 0) aiMove(); }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        var g = c.createRadialGradient(W / 2, H * 0.4, 20, W / 2, H * 0.4, Math.max(W, H) * 0.8); g.addColorStop(0, '#15803d'); g.addColorStop(1, '#052e16'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(0,0,0,.05)'; for (var i = 0; i < W; i += 6) c.fillRect(i, 0, 1, H);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        // соперник
        var n1 = hands[1].length, bw = Math.min(26, (W - 160) / Math.max(1, n1));
        for (var k = 0; k < n1; k++) tile(c, W / 2 - (n1 * (bw + 3)) / 2 + k * (bw + 3), 52, bw, bw * 1.8, 0, 0, true, false, !roundOver);
        if (roundOver) hands[1].forEach(function (d2, k2) { tile(c, W / 2 - (n1 * (bw + 3)) / 2 + k2 * (bw + 3), 52, bw, bw * 1.8, d2[0], d2[1], true); });
        c.fillStyle = '#bbf7d0'; c.font = '800 14px system-ui'; c.fillText('Компьютер · ' + sc[1] + ' / 100', W / 2, 26);
        // базар
        c.textAlign = 'left'; c.font = '700 12px system-ui'; c.fillStyle = '#86efac'; c.fillText('Базар: ' + pile.length, 12, 26);
        c.textAlign = 'center';
        // цепочка
        var cp = chainPos();
        cp.forEach(function (o, idx) {
          var a = o.rev ? o.d.b : o.d.a, b2 = o.rev ? o.d.a : o.d.b, dbl = o.d.a === o.d.b;
          var isEnd = choice != null && (idx === 0 || idx === cp.length - 1);
          var fresh = anim && ((anim.side === 'L' && idx === 0) || (anim.side === 'R' && idx === cp.length - 1)) ? anim.t / 0.3 : 0;
          c.save(); c.translate(0, -fresh * 20); c.globalAlpha = 1 - fresh * 0.5;
          if (dbl) tile(c, o.x + TW / 4, o.y - TH / 2, TH, TW, a, b2, true, isEnd);
          else tile(c, o.x, o.y, TW, TH, a, b2, false, isEnd);
          c.restore();
        });
        if (!chain.length) { c.fillStyle = 'rgba(255,255,255,.4)'; c.font = '700 15px system-ui'; c.fillText(turn === 0 ? 'Ходи первым: выбери костяшку' : 'Компьютер начинает…', W / 2, H * 0.3); }
        // моя рука
        hands[0].forEach(function (d2, k3) { var p = handPos(k3, hands[0].length), ok = turn === 0 && !roundOver && fits(d2).length; tile(c, p.x, p.y - (ok ? 6 : 0) - (choice === k3 ? 10 : 0), p.w, p.h, d2[0], d2[1], true, choice === k3 || (ok && Math.sin(t * 4) > 0.6)); if (!ok && turn === 0 && !roundOver) { c.fillStyle = 'rgba(0,0,0,.25)'; K.rr(c, p.x, p.y, p.w, p.h, p.w * 0.2); c.fill(); } });
        c.fillStyle = '#fde68a'; c.font = '800 14px system-ui'; c.fillText('Ты · ' + sc[0] + ' / 100', W / 2, H - 36);
        if (turn === 0 && !roundOver && !canMove(0)) { var b = btnPile(); K.key(c, b[0], b[1], b[2], b[3], pile.length ? '#b45309' : '#475569', pile.length ? '🀄 Взять из базара' : 'Пропустить ход', '800 15px system-ui'); }
        var tip = msgT > 0 ? msg : roundOver === 1 ? 'Нажми, чтобы сыграть следующий кон' : roundOver === 2 ? (sc[0] >= 100 ? api.t('g.win') : api.t('g.lose')) : turn === 1 ? 'Компьютер думает…' : '';
        if (tip) K.toast(c, W, H * 0.52 + (turn === 0 && !roundOver && !canMove(0) ? 96 : 52), tip, 1);
      }
    };
  }
};
