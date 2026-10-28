/* Супер крестики-нолики: 9 маленьких полей в большом. Ход в клетку отправляет соперника в такое же поле */
window.GAMES = window.GAMES || {};
window.GAMES.ultimate = {
  title: 'Супер крестики-нолики', desc: 'Крестики-нолики в крестиках-ноликах', cat: 'board', isNew4: true, modes: true, lan: true, medals: [150, 300, 500],
  hint: 'Большое поле состоит из 9 маленьких. Выиграй маленькое поле — оно станет твоим. Собери 3 своих поля в ряд — победа. Главное правило: в какую клетку маленького поля ты сходил, в то же по положению поле должен ходить соперник. Если оно уже занято, можно ходить куда угодно.',
  d0: 'Простой соперник', d1: 'Соперник внимательнее', d2: 'Думает на ход вперёд', d3: 'Сильный соперник',
  colors: ['#6366f1', '#0f172a'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#1e1b4b"/><g stroke="#818cf8" stroke-width="3"><path d="M36 12v76M64 12v76M12 36h76M12 64h76"/></g><g stroke="#f87171" stroke-width="4" stroke-linecap="round"><path d="M16 16l14 14M30 16L16 30M44 44l12 12M56 44L44 56"/></g><g stroke="#60a5fa" stroke-width="4" fill="none"><circle cx="78" cy="22" r="7"/><circle cx="22" cy="78" r="7"/></g><rect x="64" y="64" width="24" height="24" fill="#fde68a" opacity=".35"/></svg>',
  create: function (api) {
    var K = window.GBK, b, big, turn, forced, netQ, endT, t, thinkT, over, last, cs, ox, oy, wins;
    var LN = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    function names() { return api.mode === 1 ? [api.t('g.p1'), api.t('g.p2')] : api.mode === 2 ? (api.net.side === 0 ? [api.t('g.you'), api.t('net.opp')] : [api.t('net.opp'), api.t('g.you')]) : [api.t('g.you'), api.t('g.cpu')]; }
    function me() { return api.mode === 2 ? api.net.side + 1 : 1; }
    function myTurn() { return !over && (api.mode === 1 || (api.mode === 2 ? turn === me() : turn === 1)); }
    function line3(arr, p) { for (var i = 0; i < 8; i++) { var l = LN[i]; if (arr[l[0]] === p && arr[l[1]] === p && arr[l[2]] === p) return l; } return null; }
    function full(g) { for (var k = 0; k < 9; k++) if (!b[g * 9 + k]) return false; return true; }
    function legal() { var r = []; for (var g = 0; g < 9; g++) { if (big[g] || (forced >= 0 && g !== forced)) continue; for (var k = 0; k < 9; k++) if (!b[g * 9 + k]) r.push(g * 9 + k); } return r; }
    function newGame() { b = new Array(81).fill(0); big = new Array(9).fill(0); turn = 1; forced = -1; over = 0; last = -1; thinkT = 0.7; layout(); }
    function play(i, remote) {
      if (api.mode === 2 && !remote) api.net.send({ i: i });
      var g = Math.floor(i / 9), k = i % 9; b[i] = turn; last = i; api.sound('click'); api.vibrate(6);
      var small = b.slice(g * 9, g * 9 + 9);
      if (line3(small, turn)) { big[g] = turn; api.sound('coin'); } else if (full(g)) big[g] = 3;
      forced = big[k] ? -1 : k;
      var w = line3(big, turn);
      if (w || big.every(Boolean)) {
        over = w ? turn : 3; if (over === 3) { var c1 = big.filter(function (x) { return x === 1; }).length, c2 = big.filter(function (x) { return x === 2; }).length; if (c1 !== c2) over = c1 > c2 ? 1 : 2; }
        var mine = api.mode === 1 ? over !== 3 : over === me(); api.sound(mine ? 'win' : over === 3 ? 'click' : 'hit'); if (mine) api.fx.confetti(50);
        if (api.mode === 0 && over === 1) api.addScore(200 + api.diff * 100 + b.filter(function (x) { return !x; }).length * 3);
        if (over !== 3) wins[over - 1]++;
        endT = 3; return;
      }
      turn = 3 - turn; thinkT = 0.4 + Math.random() * 0.5;
    }
    function score(i, p) { // оценка хода для бота
      var g = Math.floor(i / 9), k = i % 9, s = 0, small = b.slice(g * 9, g * 9 + 9);
      small[k] = p; if (line3(small, p)) { s += 60; var bg = big.slice(); bg[g] = p; if (line3(bg, p)) s += 1000; }
      small[k] = 3 - p; if (line3(small, 3 - p)) s += 40; small[k] = 0;
      if (k === 4) s += 3; if (g === 4) s += 3;
      // куда отправляем соперника: свободное поле хуже, поле, где он выигрывает, — очень плохо
      if (api.diff >= 1) {
        if (big[k] || (k === g && full(g))) s -= 25;
        else { var tg = b.slice(k * 9, k * 9 + 9); for (var q = 0; q < 9; q++) if (!tg[q]) { tg[q] = 3 - p; if (line3(tg, 3 - p)) { s -= 30; var bb = big.slice(); bb[k] = 3 - p; if (line3(bb, 3 - p)) s -= 900; } tg[q] = 0; } }
      }
      return s + Math.random() * [30, 8, 3, 1][api.diff];
    }
    function aiMove() { var ms = legal(), best = ms[0], bs = -1e9; ms.forEach(function (i) { var s = score(i, 2); if (s > bs) { bs = s; best = i; } }); play(best); }
    function layout() { cs = Math.min((api.W - 24) / 9, (api.H - 220) / 9); ox = (api.W - cs * 9) / 2; oy = 90 + Math.max(0, (api.H - 220 - cs * 9) / 2); }
    function cellXY(i) { var g = Math.floor(i / 9), k = i % 9; return [ox + ((g % 3) * 3 + k % 3) * cs, oy + (Math.floor(g / 3) * 3 + Math.floor(k / 3)) * cs]; }
    function mark(c, p, x, y, s, a) {
      c.globalAlpha = a == null ? 1 : a; c.lineWidth = Math.max(2, s * 0.13); c.lineCap = 'round';
      if (p === 1) { c.strokeStyle = '#f87171'; c.beginPath(); c.moveTo(x + s * 0.25, y + s * 0.25); c.lineTo(x + s * 0.75, y + s * 0.75); c.moveTo(x + s * 0.75, y + s * 0.25); c.lineTo(x + s * 0.25, y + s * 0.75); c.stroke(); }
      else if (p === 2) { c.strokeStyle = '#60a5fa'; c.beginPath(); c.arc(x + s / 2, y + s / 2, s * 0.27, 0, 6.283); c.stroke(); }
      c.globalAlpha = 1;
    }
    return {
      reset: function () { netQ = []; endT = 0; t = 0; wins = [0, 0]; newGame(); },
      resize: function () { if (b) layout(); }, idle: function (dt) { t += dt || 0; }, key: function () { },
      netMsg: function (d) { netQ.push(d); },
      input: function (type, d) {
        if (type !== 'down' || !myTurn()) return;
        var c = Math.floor((d.x - ox) / cs), r = Math.floor((d.y - oy) / cs); if (c < 0 || r < 0 || c > 8 || r > 8) return;
        var i = (Math.floor(r / 3) * 3 + Math.floor(c / 3)) * 9 + (r % 3) * 3 + c % 3;
        if (legal().indexOf(i) >= 0) play(i); else { api.vibrate(20); }
      },
      update: function (dt) {
        t += dt;
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (over) return;
        if (api.mode === 0 && turn === 2) { thinkT -= dt; if (thinkT <= 0) aiMove(); }
        if (api.mode === 2 && turn !== me() && netQ.length) { var m = netQ.shift(); if (legal().indexOf(m.i) >= 0) play(m.i, true); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, nm = names(), COL = ['#f87171', '#60a5fa'];
        K.bg(c, W, H, '#1e1b4b', '#0b0a1f', 'rgba(99,102,241,.14)');
        c.textAlign = 'center'; c.textBaseline = 'middle';
        [0, 1].forEach(function (p) { var x = p ? W * 0.75 : W * 0.25, act = !over && turn === p + 1; c.fillStyle = act ? '#fde68a' : COL[p]; c.font = '800 15px system-ui'; c.fillText((act ? '▶ ' : '') + (p ? '○ ' : '✕ ') + nm[p], x, 34); });
        var lg = myTurn() ? legal() : [], av = {}; lg.forEach(function (i) { av[Math.floor(i / 9)] = 1; });
        for (var g = 0; g < 9; g++) {
          var gx = ox + (g % 3) * 3 * cs, gy = oy + Math.floor(g / 3) * 3 * cs;
          K.rr(c, gx + 3, gy + 3, cs * 3 - 6, cs * 3 - 6, 10); c.fillStyle = av[g] ? 'rgba(253,230,138,' + (0.18 + 0.08 * Math.sin(t * 4)) + ')' : 'rgba(255,255,255,.05)'; c.fill();
          c.strokeStyle = 'rgba(165,180,252,.35)'; c.lineWidth = 1.5;
          for (var q = 1; q < 3; q++) { c.beginPath(); c.moveTo(gx + q * cs, gy + 8); c.lineTo(gx + q * cs, gy + cs * 3 - 8); c.moveTo(gx + 8, gy + q * cs); c.lineTo(gx + cs * 3 - 8, gy + q * cs); c.stroke(); }
        }
        for (var i = 0; i < 81; i++) if (b[i]) { var p = cellXY(i); mark(c, b[i], p[0], p[1], cs, big[Math.floor(i / 9)] ? 0.35 : 1); if (i === last) { c.fillStyle = 'rgba(253,230,138,.3)'; c.fillRect(p[0] + 2, p[1] + 2, cs - 4, cs - 4); } }
        for (g = 0; g < 9; g++) if (big[g] === 1 || big[g] === 2) mark(c, big[g], ox + (g % 3) * 3 * cs, oy + Math.floor(g / 3) * 3 * cs, cs * 3);
        c.strokeStyle = '#a5b4fc'; c.lineWidth = 3;
        for (q = 1; q < 3; q++) { c.beginPath(); c.moveTo(ox + q * 3 * cs, oy); c.lineTo(ox + q * 3 * cs, oy + 9 * cs); c.moveTo(ox, oy + q * 3 * cs); c.lineTo(ox + 9 * cs, oy + q * 3 * cs); c.stroke(); }
        var tip;
        if (over) tip = over === 3 ? 'Ничья!' : api.mode === 1 ? api.t(over === 1 ? 'g.p1win' : 'g.p2win') : over === me() ? api.t('g.win') : api.t('g.lose');
        else if (api.mode === 0 && turn === 2) tip = 'Компьютер думает…';
        else if (api.mode === 2 && turn !== me()) tip = api.t('net.oppTurn');
        else tip = (api.mode === 1 ? nm[turn - 1] + ', ' : '') + (forced >= 0 ? 'ходи в подсвеченное поле' : 'ходи в любое поле');
        K.toast(c, W, H - 46, tip, 1);
      }
    };
  }
};
