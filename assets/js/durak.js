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
    var discard, bubble, bubbleT, SPR = {};
    var deck, hands, trump, trumpCard, att, table, phase, takeMode, botT, msg, msgT, over, sel;
    function red(c) { return c.s >= 2; }
    function name(c) { return RANKS[c.r] + SUITS[c.s]; }
    function beats(d, a) { return (d.s === a.s && d.r > a.r) || (d.s === trump && a.s !== trump); }
    function val(c) { return c.r + (c.s === trump ? 10 : 0); }
    function sortHand(h) { h.sort(function (a, b) { return (a.s === trump) - (b.s === trump) || a.s - b.s || a.r - b.r; }); }
    function say(s) { msg = s; msgT = 2; }
    function botSay(s) { bubble = s; bubbleT = 1.6; }
    function draw(i) { while (hands[i].length < 6 && deck.length) hands[i].push(deck.pop()); sortHand(hands[i]); }
    function ranksOnTable() { var r = {}; table.forEach(function (p) { r[p.a.r] = 1; if (p.d) r[p.d.r] = 1; }); return r; }
    function canAdd(c) { return !table.length || ranksOnTable()[c.r]; }
    function limit() { return Math.min(6, table.limit); }
    function undefended() { return table.filter(function (p) { return !p.d; }); }
    function deal() {
      deck = []; for (var s = 0; s < 4; s++) for (var r = 0; r < 9; r++) deck.push({ s: s, r: r });
      for (var i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = deck[i]; deck[i] = deck[j]; deck[j] = x; }
      trumpCard = deck[0]; trump = trumpCard.s; hands = [[], []]; discard = [];
      deck.forEach(function (cd) { cd.p = null; cd.flip = 0; }); draw(0); draw(1);
      // первым ходит тот, у кого младший козырь
      function low(h) { var m = 99; h.forEach(function (c) { if (c.s === trump) m = Math.min(m, c.r); }); return m; }
      att = low(hands[1]) < low(hands[0]) ? 1 : 0;
      newRound();
    }
    function newRound() { table = []; table.limit = hands[1 - att].length; takeMode = false; phase = att === 0 ? 'attack' : 'bot'; botT = 0.8; }
    function endRound(taken) {
      var def = 1 - att;
      if (taken) { table.forEach(function (p) { hands[def].push(p.a); if (p.d) hands[def].push(p.d); }); sortHand(hands[def]); say(def === 0 ? 'Ты взял карты' : 'Соперник взял карты'); if (def === 1) botSay('Беру…'); }
      else { table.forEach(function (p) { discard.push(p.a); if (p.d) discard.push(p.d); }); say('Бито'); }
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
        if (table.length && !undefended().length) { botSay('Бито'); endRound(false); return; }
        phase = 'defend'; return;
      }
      if (phase === 'botdef') {
        var u = undefended();
        if (!u.length) { phase = 'attack'; return; }
        var d = botDefendCard(u[0]);
        if (!d) { takeMode = true; botSay('Беру!'); say('Можешь подкинуть'); phase = 'attack'; return; }
        remove(hands[1], d); u[0].d = d; api.sound('click');
        botT = 0.5; if (undefended().length) return;
        phase = 'attack';
      }
    }
    // ---- раскладка ----
    function CW() { return Math.min(66, (api.W - 20) / 6.6); }
    function CH() { return CW() * 1.42; }
    // веер карт игрока; больше 14 — в два ряда
    function handPos(i, n) {
      var cw = CW(), ch = CH(), rows = n > 14 ? 2 : 1, per = Math.ceil(n / rows), row = Math.floor(i / per), j = i - row * per, m = row ? n - per : per;
      var span = Math.min(api.W - 24 - cw, (m - 1) * cw * 0.7), x0 = (api.W - span - cw) / 2, k = m > 1 ? j / (m - 1) - 0.5 : 0;
      return { x: x0 + (m > 1 ? span * j / (m - 1) : span / 2), y: api.H - ch - 82 - (rows - 1 - row) * ch * 0.5 + k * k * 34, w: cw, h: ch, r: k * 0.32 };
    }
    function botPos(i, n) {
      var cw = CW() * 0.62, span = Math.min(api.W - 150, (n - 1) * cw * 0.5), x0 = api.W / 2 - span / 2 + 34, k = n > 1 ? i / (n - 1) - 0.5 : 0;
      return { x: x0 + (n > 1 ? span * i / (n - 1) : 0) - cw / 2, y: 40 - k * k * 16, w: cw, h: cw * 1.42, r: -k * 0.4 };
    }
    function deckPos() { return { x: 18, y: api.H * 0.56 - CH() / 2, w: CW(), h: CH(), r: 0 }; }
    function discardPos(i) { var a = ((i * 37) % 21 - 10) / 40; return { x: api.W - CW() - 22, y: api.H * 0.56 - CH() / 2 + (i % 3), w: CW(), h: CH(), r: a }; }
    function tablePos(k, def) {
      var cw = CW(), ch = CH(), tw = cw * 1.32, cols = 3, x0 = api.W / 2 - (cols * tw) / 2 - cw * 0.12, row = Math.floor(k / cols);
      var x = x0 + (k % cols) * tw, y = api.H * 0.22 + row * (ch + 22);
      return def ? { x: x + cw * 0.26, y: y + ch * 0.2, w: cw, h: ch, r: 0.16 } : { x: x, y: y, w: cw, h: ch, r: -0.05 };
    }
    // целевое положение каждой карты; карты плавно летят к нему
    function targets() {
      var T = [], i;
      for (i = 0; i < deck.length; i++) {
        var dp = deckPos();
        if (deck[i] === trumpCard) T.push([deck[i], { x: dp.x + CH() * 0.2, y: dp.y + (CH() - CW()) / 2, w: dp.w, h: dp.h, r: Math.PI / 2 }, 1, 0]);
        else T.push([deck[i], { x: dp.x - i * 0.25, y: dp.y - i * 0.35, w: dp.w, h: dp.h, r: 0 }, 0, 1]);
      }
      discard.forEach(function (cd, k) { T.push([cd, discardPos(k), 0, 2]); });
      hands[1].forEach(function (cd, k) { T.push([cd, botPos(k, hands[1].length), over ? 1 : 0, 3]); });
      table.forEach(function (p, k) { T.push([p.a, tablePos(k, false), 1, 4]); if (p.d) T.push([p.d, tablePos(k, true), 1, 5]); });
      hands[0].forEach(function (cd, k) { T.push([cd, handPos(k, hands[0].length), 1, 6]); });
      return T;
    }
    function playable(cd) {
      if (phase === 'attack') return canAdd(cd) && table.length < limit();
      if (phase === 'defend') return undefended().some(function (a) { return beats(cd, a); });
      return false;
    }
    function buttons() {
      var b = [], y = api.H - 62, w = 150;
      if (phase === 'defend') b.push({ k: 'take', t: 'Беру', x: api.W / 2 - w / 2, y: y, w: w, c: ['#ef4444', '#b91c1c'] });
      if (phase === 'attack' && table.length && (takeMode || !undefended().length)) b.push({ k: 'done', t: takeMode ? 'Хватит' : 'Бито', x: api.W / 2 - w / 2, y: y, w: w, c: ['#3b82f6', '#1d4ed8'] });
      return b;
    }
    function playHuman(i) {
      var c = hands[0][i];
      if (phase === 'attack') {
        if (!canAdd(c)) { say('Подкидывать можно только карты того же достоинства'); api.sound('hit'); return; }
        if (table.length >= limit()) { say('Больше подкинуть нельзя'); return; }
        remove(hands[0], c); table.push({ a: c, d: null }); api.sound('click');
        if (!takeMode) { phase = 'botdef'; botT = 0.8; }
        return;
      }
      if (phase === 'defend') {
        var u = undefended(), tgt = null;
        for (var k = 0; k < u.length; k++) if (beats(c, u[k])) { tgt = u[k]; break; }
        if (!tgt) { say('Этой картой не побить'); api.sound('hit'); return; }
        remove(hands[0], c); tgt.d = c; api.sound('click');
        if (!undefended().length) { phase = 'bot'; botT = 0.8; }
      }
    }
    // ---- рисование карт (заготовки на отдельных холстах) ----
    function DPR() { return Math.min(2, window.devicePixelRatio || 1); }
    function mk(w, h) { var cv = document.createElement('canvas'), d = DPR(); cv.width = Math.ceil(w * d); cv.height = Math.ceil(h * d); var x = cv.getContext('2d'); x.scale(d, d); return { cv: cv, x: x }; }
    function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
    var PIPS = {
      0: [[.3, .2], [.7, .2], [.3, .5], [.7, .5], [.3, .8], [.7, .8]],
      1: [[.3, .2], [.7, .2], [.5, .35], [.3, .5], [.7, .5], [.3, .8], [.7, .8]],
      2: [[.3, .2], [.7, .2], [.5, .35], [.3, .5], [.7, .5], [.5, .65], [.3, .8], [.7, .8]],
      3: [[.3, .17], [.7, .17], [.3, .39], [.7, .39], [.5, .5], [.3, .61], [.7, .61], [.3, .83], [.7, .83]],
      4: [[.3, .17], [.7, .17], [.5, .28], [.3, .39], [.7, .39], [.3, .61], [.7, .61], [.5, .72], [.3, .83], [.7, .83]]
    };
    function face(cd, w, h) {
      var key = cd.s + '_' + cd.r + '_' + Math.round(w);
      if (SPR[key]) return SPR[key];
      var o = mk(w, h), x = o.x, col = red(cd) ? '#c81e1e' : '#111827', S = SUITS[cd.s], R = Math.max(5, w * 0.1);
      var g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#eef0f4');
      rr(x, 0.5, 0.5, w - 1, h - 1, R); x.fillStyle = g; x.fill(); x.strokeStyle = '#9ca3af'; x.lineWidth = 1; x.stroke();
      x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle';
      function corner() {
        x.font = '800 ' + Math.round(w * 0.24) + 'px Georgia, "Times New Roman", serif'; x.fillText(RANKS[cd.r], w * 0.15, h * 0.1);
        x.font = Math.round(w * 0.2) + 'px system-ui'; x.fillText(S, w * 0.15, h * 0.22);
      }
      corner(); x.save(); x.translate(w, h); x.rotate(Math.PI); corner(); x.restore();
      var ix = w * 0.24, iy = h * 0.12, iw = w * 0.52, ih = h * 0.76;
      if (cd.r <= 4) { // 6–10: масти по схеме, нижние перевёрнуты
        x.font = Math.round(w * 0.2) + 'px system-ui';
        PIPS[cd.r].forEach(function (p) {
          x.save(); x.translate(ix + p[0] * iw, iy + p[1] * ih); if (p[1] > 0.55) x.rotate(Math.PI); x.fillText(S, 0, 0); x.restore();
        });
      } else if (cd.r === 8) { // туз
        x.font = Math.round(w * 0.62) + 'px system-ui'; x.fillText(S, w / 2, h / 2 + 2);
        if (cd.s === 0) { x.strokeStyle = col; x.lineWidth = 1; x.strokeRect(w * 0.3, h * 0.3, w * 0.4, h * 0.4); }
      } else { // валет, дама, король: рамка и зеркальный портрет
        rr(x, ix - w * 0.04, iy, iw + w * 0.08, ih, 4); x.fillStyle = red(cd) ? '#fff1f2' : '#f1f5f9'; x.fill(); x.strokeStyle = '#d4a017'; x.lineWidth = 1.5; x.stroke();
        x.save(); x.beginPath(); x.rect(ix - w * 0.04, iy, iw + w * 0.08, ih); x.clip();
        function half() {
          var cx = w / 2, top = iy + ih * 0.1, body = red(cd) ? '#dc2626' : '#1e3a8a', trim = '#facc15';
          // плечи и одежда
          x.fillStyle = body; x.beginPath(); x.moveTo(cx - iw * 0.48, iy + ih * 0.5); x.quadraticCurveTo(cx - iw * 0.4, top + ih * 0.22, cx, top + ih * 0.24); x.quadraticCurveTo(cx + iw * 0.4, top + ih * 0.22, cx + iw * 0.48, iy + ih * 0.5); x.fill();
          x.strokeStyle = trim; x.lineWidth = 1.5; x.beginPath(); x.moveTo(cx, top + ih * 0.25); x.lineTo(cx, iy + ih * 0.5); x.stroke();
          // лицо
          x.fillStyle = '#fcd9b6'; x.beginPath(); x.arc(cx, top + ih * 0.13, iw * 0.15, 0, 6.283); x.fill();
          x.fillStyle = '#1f2937'; x.beginPath(); x.arc(cx - iw * 0.05, top + ih * 0.12, 1, 0, 6.283); x.arc(cx + iw * 0.05, top + ih * 0.12, 1, 0, 6.283); x.fill();
          // головной убор
          x.fillStyle = trim;
          if (cd.r === 7) { x.beginPath(); x.moveTo(cx - iw * 0.17, top + ih * 0.04); x.lineTo(cx - iw * 0.17, top - ih * 0.06); x.lineTo(cx - iw * 0.08, top); x.lineTo(cx, top - ih * 0.08); x.lineTo(cx + iw * 0.08, top); x.lineTo(cx + iw * 0.17, top - ih * 0.06); x.lineTo(cx + iw * 0.17, top + ih * 0.04); x.fill(); }
          else if (cd.r === 6) { x.beginPath(); x.ellipse(cx, top + ih * 0.02, iw * 0.17, ih * 0.035, 0, Math.PI, 0); x.fill(); x.beginPath(); x.arc(cx, top - ih * 0.03, 2, 0, 6.283); x.fill(); x.fillStyle = '#7c2d12'; x.fillRect(cx - iw * 0.2, top + ih * 0.05, iw * 0.06, ih * 0.16); x.fillRect(cx + iw * 0.14, top + ih * 0.05, iw * 0.06, ih * 0.16); }
          else { x.fillStyle = body; x.beginPath(); x.ellipse(cx, top + ih * 0.02, iw * 0.22, ih * 0.04, -0.2, 0, 6.283); x.fill(); x.fillStyle = trim; x.fillRect(cx + iw * 0.1, top - ih * 0.06, 2, ih * 0.07); }
          x.fillStyle = col; x.font = Math.round(w * 0.15) + 'px system-ui'; x.fillText(S, cx + iw * 0.3, iy + ih * 0.1);
        }
        half(); x.save(); x.translate(w, h); x.rotate(Math.PI); half(); x.restore();
        x.strokeStyle = 'rgba(0,0,0,.15)'; x.beginPath(); x.moveTo(ix, iy + ih / 2); x.lineTo(ix + iw, iy + ih / 2); x.stroke();
        x.restore();
      }
      SPR[key] = o; return o;
    }
    function back(w, h) {
      var key = 'back' + Math.round(w);
      if (SPR[key]) return SPR[key];
      var o = mk(w, h), x = o.x, R = Math.max(5, w * 0.1);
      rr(x, 0.5, 0.5, w - 1, h - 1, R); x.fillStyle = '#fff'; x.fill(); x.strokeStyle = '#9ca3af'; x.stroke();
      rr(x, 4, 4, w - 8, h - 8, R * 0.6); x.fillStyle = '#7f1d1d'; x.fill();
      x.save(); x.clip(); x.strokeStyle = 'rgba(251,191,36,.35)'; x.lineWidth = 1;
      for (var d = -h; d < w + h; d += 7) { x.beginPath(); x.moveTo(d, 0); x.lineTo(d + h, h); x.stroke(); x.beginPath(); x.moveTo(d + h, 0); x.lineTo(d, h); x.stroke(); }
      x.restore();
      x.strokeStyle = '#fbbf24'; x.lineWidth = 1.5; rr(x, 7, 7, w - 14, h - 14, R * 0.4); x.stroke();
      x.fillStyle = '#7f1d1d'; x.beginPath(); x.arc(w / 2, h / 2, w * 0.2, 0, 6.283); x.fill(); x.stroke();
      x.fillStyle = '#fbbf24'; x.font = '900 ' + Math.round(w * 0.2) + 'px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('GB', w / 2, h / 2 + 1);
      SPR[key] = o; return o;
    }
    function felt(W, H) {
      var key = 'felt' + W + 'x' + H; if (SPR[key]) return SPR[key];
      for (var k in SPR) if (k.indexOf('felt') === 0) delete SPR[k];
      var o = mk(W, H), x = o.x, g = x.createRadialGradient(W / 2, H * 0.42, 30, W / 2, H * 0.42, Math.max(W, H) * 0.75);
      g.addColorStop(0, '#1f8a4c'); g.addColorStop(0.6, '#136b37'); g.addColorStop(1, '#063d1e'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      var seed = 3; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      for (var i = 0; i < W * H / 60; i++) { x.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.05)'; x.fillRect(rnd() * W, rnd() * H, 1.5, 1.5); }
      x.strokeStyle = 'rgba(250,204,21,.18)'; x.lineWidth = 2; rr(x, 10, H * 0.17, W - 20, H * 0.52, 26); x.stroke();
      x.fillStyle = 'rgba(255,255,255,.05)'; x.font = '900 46px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ДУРАК', W / 2, H * 0.57);
      SPR[key] = o; return o;
    }
    return {
      reset: function () { over = null; msg = ''; msgT = 0; sel = -1; bubble = ''; bubbleT = 0; deal(); botT = 1.6; },
      resize: function () { }, idle: function () { }, key: function () { },
      input: function (type, d) {
        if (type !== 'tap' || phase === 'over' || phase === 'done') return;
        var b = buttons();
        for (var q = 0; q < b.length; q++) if (d.x > b[q].x && d.x < b[q].x + b[q].w && d.y > b[q].y && d.y < b[q].y + 46) {
          if (b[q].k === 'take') { takeMode = true; phase = 'bot'; botT = 0.6; say('Беру'); }
          else { if (!takeMode) botSay('Эх…'); endRound(takeMode); }
          api.sound('click'); return;
        }
        if (phase !== 'attack' && phase !== 'defend') return;
        var h = hands[0];
        for (var i = h.length - 1; i >= 0; i--) { var p = handPos(i, h.length); if (d.x > p.x && d.x < p.x + p.w && d.y > p.y - 10 && d.y < p.y + p.h) { playHuman(i); return; } }
      },
      update: function (dt) {
        if (msgT > 0) msgT -= dt; if (bubbleT > 0) bubbleT -= dt;
        // карты летят к своим местам
        targets().forEach(function (T) {
          var cd = T[0], g = T[1];
          if (!cd.p) { var dp = deckPos(); cd.p = { x: dp.x, y: dp.y, r: 0, w: g.w, h: g.h }; }
          var k = Math.min(1, dt * 9);
          cd.p.x += (g.x - cd.p.x) * k; cd.p.y += (g.y - cd.p.y) * k; cd.p.r += (g.r - cd.p.r) * k; cd.p.w += (g.w - cd.p.w) * k; cd.p.h += (g.h - cd.p.h) * k;
          cd.flip += ((T[2] ? 1 : 0) - cd.flip) * Math.min(1, dt * 10);
        });
        if (phase === 'over') { botT -= dt; if (botT <= 0) { phase = 'done'; api.gameOver(); } return; }
        if (phase === 'bot' || phase === 'botdef') { botT -= dt; if (botT <= 0) { botT = 0.7; botStep(); } }
        if (phase !== 'over' && phase !== 'done') checkEnd();
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        c.drawImage(felt(W, H).cv, 0, 0, W, H);
        // соперник
        var thinking = phase === 'bot' || phase === 'botdef';
        c.save(); c.translate(36, 46);
        if (thinking) { c.strokeStyle = 'rgba(250,204,21,' + (0.6 + 0.4 * Math.sin(Date.now() / 150)) + ')'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 25, 0, 6.283); c.stroke(); }
        c.fillStyle = '#334155'; c.beginPath(); c.arc(0, 0, 22, 0, 6.283); c.fill();
        c.fillStyle = '#cbd5e1'; c.fillRect(-12, -10, 24, 18); c.fillStyle = '#22d3ee'; c.fillRect(-8, -5, 5, 5); c.fillRect(3, -5, 5, 5);
        c.fillStyle = '#ef4444'; c.beginPath(); c.arc(0, -16, 3, 0, 6.283); c.fill(); c.fillStyle = '#64748b'; c.fillRect(-1, -14, 2, 4);
        c.restore();
        c.fillStyle = '#ecfdf5'; c.font = '700 12px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('Бот · ' + hands[1].length, 36, 82);
        // козырь и колода — подписи
        var dp = deckPos();
        c.fillStyle = '#ecfdf5'; c.font = '700 12px system-ui';
        c.fillText(deck.length ? deck.length + ' в колоде' : 'колода пуста', dp.x + dp.w / 2 + 8, dp.y + dp.h + 18);
        c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.roundRect ? c.roundRect(W - 92, 92, 80, 26, 13) : c.rect(W - 92, 92, 80, 26); c.fill();
        c.fillStyle = red({ s: trump }) ? '#fca5a5' : '#fff'; c.font = '800 13px system-ui'; c.fillText('Козырь ' + SUITS[trump], W - 52, 105);
        if (discard.length) { c.fillStyle = '#ecfdf5'; c.font = '700 12px system-ui'; c.fillText('бито', W - CW() / 2 - 16, dp.y + dp.h + 18); }
        // карты: по слоям, летящие — поверх
        var T = targets(), moving = [];
        T.sort(function (a, b) { return a[3] - b[3]; });
        function drawCard(e) {
          var cd = e[0], p = cd.p; if (!p) return;
          var sc = Math.abs(cd.flip * 2 - 1), up = cd.flip > 0.5;
          var lift = e[3] === 6 && playable(cd) ? -10 : 0, dim = e[3] === 6 && (phase === 'attack' || phase === 'defend') && !playable(cd);
          c.save(); c.translate(p.x + p.w / 2, p.y + p.h / 2 + lift); c.rotate(p.r); c.scale(Math.max(0.04, sc), 1);
          c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 6; c.shadowOffsetY = 3;
          var img = up ? face(cd, Math.round(CW()), Math.round(CH())) : back(Math.round(CW()), Math.round(CH()));
          c.drawImage(img.cv, -p.w / 2, -p.h / 2, p.w, p.h);
          c.shadowColor = 'transparent';
          if (lift) { c.strokeStyle = '#facc15'; c.lineWidth = 2.5; rr(c, -p.w / 2, -p.h / 2, p.w, p.h, 6); c.stroke(); }
          if (dim) { c.fillStyle = 'rgba(15,23,42,.28)'; rr(c, -p.w / 2, -p.h / 2, p.w, p.h, 6); c.fill(); }
          c.restore();
        }
        T.forEach(function (e) { var p = e[0].p, g = e[1]; if (p && Math.abs(p.x - g.x) + Math.abs(p.y - g.y) > 12) moving.push(e); else drawCard(e); });
        moving.forEach(drawCard);
        // реплика соперника
        if (bubbleT > 0) {
          c.globalAlpha = Math.min(1, bubbleT * 3); c.font = '800 14px system-ui';
          var bw = c.measureText(bubble).width + 24;
          c.fillStyle = '#fff'; c.beginPath(); c.roundRect ? c.roundRect(64, 20, bw, 30, 15) : c.rect(64, 20, bw, 30); c.fill();
          c.beginPath(); c.moveTo(66, 36); c.lineTo(56, 44); c.lineTo(74, 40); c.fill();
          c.fillStyle = '#111827'; c.textAlign = 'left'; c.fillText(bubble, 76, 35); c.globalAlpha = 1;
        }
        // подсказка хода и кнопки
        var who = phase === 'attack' ? (takeMode ? 'Подкидывай или «Хватит»' : table.length ? 'Подкинь или нажми «Бито»' : 'Твой ход') : phase === 'defend' ? 'Отбивайся!' : thinking ? 'Бот думает…' : '';
        var hy = handPos(0, Math.max(1, hands[0].length)).y - (hands[0].length > 14 ? CH() * 0.5 : 0) - 26;
        c.fillStyle = '#fef08a'; c.font = '800 15px system-ui'; c.textAlign = 'center'; c.fillText(who, W / 2, hy);
        buttons().forEach(function (b) {
          var g = c.createLinearGradient(0, b.y, 0, b.y + 46); g.addColorStop(0, b.c[0]); g.addColorStop(1, b.c[1]);
          c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 10; c.shadowOffsetY = 4;
          c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(b.x, b.y, b.w, 46, 23) : c.rect(b.x, b.y, b.w, 46); c.fill();
          c.shadowColor = 'transparent'; c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(b.x + 20, b.y + 4, b.w - 40, 2);
          c.fillStyle = '#fff'; c.font = '800 18px system-ui'; c.fillText(b.t, b.x + b.w / 2, b.y + 24);
        });
        if (msgT > 0) {
          c.globalAlpha = Math.min(1, msgT * 2); c.font = '800 15px system-ui';
          var mw = Math.min(W - 20, c.measureText(msg).width + 40);
          c.fillStyle = 'rgba(0,0,0,.72)'; c.beginPath(); c.roundRect ? c.roundRect(W / 2 - mw / 2, H * 0.155 - 18, mw, 36, 18) : c.rect(W / 2 - mw / 2, H * 0.155 - 18, mw, 36); c.fill();
          c.fillStyle = '#fff'; c.fillText(msg, W / 2, H * 0.155); c.globalAlpha = 1;
        }
      }
    };
  }
};
