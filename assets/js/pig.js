/* Свинья: бросай кубик и копи очки, но выпала единица — всё сгорело. Кто первым наберёт 100 */
window.GAMES = window.GAMES || {};
window.GAMES.pig = {
  title: 'Свинья', desc: 'Кости: рискни или остановись', cat: 'board', isNew4: true, modes: true, lan: true, medals: [150, 300, 500],
  hint: 'В свой ход бросай кубик сколько хочешь раз — очки копятся. Выпала 1 — очки этого хода сгорают и ход переходит. Нажми «Забрать», чтобы сохранить накопленное. Кто первым наберёт 100 — победил.',
  d0: 'Осторожный соперник', d1: 'Обычный', d2: 'Расчётливый', d3: 'Профи',
  colors: ['#ec4899', '#831843'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#fbcfe8"/><circle cx="46" cy="56" r="28" fill="#f9a8d4"/><ellipse cx="46" cy="64" rx="12" ry="8" fill="#ec4899"/><circle cx="42" cy="64" r="2.5" fill="#831843"/><circle cx="50" cy="64" r="2.5" fill="#831843"/><circle cx="36" cy="48" r="3" fill="#111"/><circle cx="56" cy="48" r="3" fill="#111"/><path d="M26 34l-6-10 12 4zM66 34l6-10-12 4z" fill="#f472b6"/><rect x="62" y="12" width="26" height="26" rx="6" fill="#fff" stroke="#831843" stroke-width="2"/><circle cx="69" cy="19" r="2.6" fill="#831843"/><circle cx="75" cy="25" r="2.6" fill="#831843"/><circle cx="81" cy="31" r="2.6" fill="#831843"/></svg>',
  create: function (api) {
    var K = window.GBK, sc, turn, pot, die, rollT, netQ, endT, t, thinkT, over, msg, msgT, hist, pending;
    var GOAL = 100;
    function names() { return api.mode === 1 ? [api.t('g.p1'), api.t('g.p2')] : api.mode === 2 ? (api.net.side === 0 ? [api.t('g.you'), api.t('net.opp')] : [api.t('net.opp'), api.t('g.you')]) : [api.t('g.you'), api.t('g.cpu')]; }
    function me() { return api.mode === 2 ? api.net.side : 0; }
    function myTurn() { return !over && rollT <= 0 && (api.mode === 1 || turn === me()); }
    function roll(v, remote) { // v — заранее известный результат (из сети) или выпадет случайно
      if (v == null) v = 1 + Math.floor(Math.random() * 6);
      if (api.mode === 2 && !remote) api.net.send({ r: v });
      pending = v; rollT = 0.6; api.sound('click'); api.vibrate(8);
    }
    function settle() {
      var v = pending; pending = null; die = v; hist.unshift(v); if (hist.length > 8) hist.pop();
      if (v === 1) { pot = 0; say('Единица! Очки хода сгорели 🐷'); api.sound('hit'); api.vibrate(40); next(); }
      else { pot += v; api.sound('coin'); if (sc[turn] + pot >= GOAL) hold(true); }
    }
    function hold(remote) {
      if (api.mode === 2 && remote !== true && !remote) api.net.send({ h: 1 });
      sc[turn] += pot; pot = 0; api.sound('bonus');
      if (sc[turn] >= GOAL) {
        over = turn + 1; var mine = api.mode === 1 || turn === me(); api.sound(mine ? 'win' : 'hit'); if (mine) api.fx.confetti(60);
        if (api.mode === 0 && turn === 0) api.addScore(150 + api.diff * 80 + (sc[0] - sc[1]));
        endT = 3; return;
      }
      next();
    }
    function next() { turn = 1 - turn; pot = 0; thinkT = 0.9; hist = []; }
    function say(s) { msg = s; msgT = 1.6; }
    function aiStep() { // сколько копить: от сложности и от того, кто впереди
      var lim = [12, 18, 21, 20][api.diff], behind = sc[0] - sc[1];
      if (api.diff >= 2) { if (behind > 25) lim = 26; if (sc[0] >= 80) lim = 100; if (GOAL - sc[1] <= lim) lim = GOAL - sc[1]; }
      if (pot >= lim || (api.diff === 0 && pot > 0 && Math.random() < 0.25)) hold(); else roll();
    }
    function btns() { var y = api.H - 150, w = (api.W - 52) / 2; return { roll: [18, y, w, 64], hold: [34 + w, y, w, 64] }; }
    function hit(b, d) { return d.x >= b[0] && d.x <= b[0] + b[2] && d.y >= b[1] && d.y <= b[1] + b[3]; }
    function drawDie(c, x, y, s, v, rot) {
      c.save(); c.translate(x, y); c.rotate(rot || 0);
      c.fillStyle = 'rgba(0,0,0,.3)'; K.rr(c, -s / 2 + 4, -s / 2 + 8, s, s, s * 0.2); c.fill();
      var g = c.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2); g.addColorStop(0, '#fff'); g.addColorStop(1, '#fbcfe8');
      K.rr(c, -s / 2, -s / 2, s, s, s * 0.2); c.fillStyle = g; c.fill(); c.strokeStyle = '#f9a8d4'; c.lineWidth = 2; c.stroke();
      var P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[v] || [];
      c.fillStyle = v === 1 ? '#dc2626' : '#831843'; P.forEach(function (p) { c.beginPath(); c.arc(p[0] * s * 0.26, p[1] * s * 0.26, s * (v === 1 ? 0.12 : 0.085), 0, 6.283); c.fill(); });
      c.restore();
    }
    return {
      reset: function () { sc = [0, 0]; turn = 0; pot = 0; die = 6; rollT = 0; netQ = []; endT = 0; t = 0; thinkT = 1; over = 0; msgT = 0; hist = []; pending = null; },
      resize: function () { }, idle: function (dt) { t += dt || 0; }, key: function () { },
      netMsg: function (d) { netQ.push(d); },
      input: function (type, d) {
        if (type !== 'down' || !myTurn()) return;
        var B = btns();
        if (hit(B.roll, d)) roll(); else if (hit(B.hold, d) && pot > 0) hold();
      },
      update: function (dt) {
        t += dt; if (msgT > 0) msgT -= dt;
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (rollT > 0) { rollT -= dt; if (rollT <= 0) settle(); return; }
        if (over) return;
        if (api.mode === 0 && turn === 1) { thinkT -= dt; if (thinkT <= 0) { thinkT = 0.7; aiStep(); } }
        if (api.mode === 2 && turn !== me() && netQ.length) { var m = netQ.shift(); if (m.r >= 1 && m.r <= 6) roll(m.r, true); else if (m.h && pot > 0) hold(true); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, nm = names();
        K.bg(c, W, H, '#500724', '#1e0510', 'rgba(236,72,153,.18)');
        c.textAlign = 'center'; c.textBaseline = 'middle';
        // табло игроков с полосками до 100
        [0, 1].forEach(function (p) {
          var y = p ? 40 : 110, act = !over && turn === p, col = p ? '#60a5fa' : '#f472b6';
          K.rr(c, 16, y - 24, W - 32, 56, 18); c.fillStyle = act ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.06)'; c.fill(); if (act) { c.strokeStyle = col; c.lineWidth = 2; c.stroke(); }
          c.textAlign = 'left'; c.fillStyle = '#fff'; c.font = '800 15px system-ui'; c.fillText((act ? '▶ ' : '') + nm[p], 30, y - 6);
          c.textAlign = 'right'; c.font = '900 22px system-ui'; c.fillText(sc[p] + (act && pot ? ' +' + pot : ''), W - 30, y - 4);
          K.rr(c, 30, y + 14, W - 60, 8, 4); c.fillStyle = 'rgba(255,255,255,.1)'; c.fill();
          K.rr(c, 30, y + 14, (W - 60) * Math.min(1, sc[p] / GOAL), 8, 4); c.fillStyle = col; c.fill();
          if (act && pot) { c.fillStyle = 'rgba(253,224,71,.6)'; c.fillRect(30 + (W - 60) * Math.min(1, sc[p] / GOAL), y + 14, (W - 60) * Math.min(1 - sc[p] / GOAL, pot / GOAL), 8); }
        });
        c.textAlign = 'center';
        // кубик
        var spin = rollT > 0, v = spin ? 1 + Math.floor(t * 20) % 6 : die;
        drawDie(c, W / 2, H * 0.43 + (spin ? -Math.sin(rollT / 0.6 * Math.PI) * 60 : 0), Math.min(140, W * 0.36), v, spin ? rollT * 12 : 0);
        c.fillStyle = '#fbcfe8'; c.font = '800 16px system-ui'; c.fillText('Копится: ' + pot, W / 2, H * 0.43 + Math.min(140, W * 0.36) / 2 + 36);
        // история бросков хода
        hist.forEach(function (h, i) { drawDie(c, W / 2 - (hist.length - 1) * 17 + i * 34, H * 0.43 + Math.min(140, W * 0.36) / 2 + 72, 26, h, 0); });
        if (myTurn()) { var B = btns(); K.key(c, B.roll[0], B.roll[1], B.roll[2], B.roll[3], '#ec4899', '🎲 Бросить', '900 19px system-ui'); K.key(c, B.hold[0], B.hold[1], B.hold[2], B.hold[3], pot > 0 ? '#16a34a' : '#475569', '💰 Забрать', '900 19px system-ui'); }
        var tip;
        if (over) tip = api.mode === 1 ? api.t(over === 1 ? 'g.p1win' : 'g.p2win') : over - 1 === me() ? api.t('g.win') : api.t('g.lose');
        else if (msgT > 0) tip = msg;
        else if (api.mode === 0 && turn === 1) tip = 'Компьютер бросает…';
        else if (api.mode === 2 && turn !== me()) tip = api.t('net.oppTurn');
        else tip = (api.mode === 1 ? nm[turn] + ', ' : '') + 'бросай или забирай';
        K.toast(c, W, H - 46, tip, 1);
      }
    };
  }
};
