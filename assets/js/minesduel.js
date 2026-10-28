/* Сапёр-дуэль: по очереди открывайте клетки. Кто найдёт больше мин — победил */
window.GAMES = window.GAMES || {};
window.GAMES.minesduel = {
  title: 'Сапёр-дуэль', desc: 'Найди больше мин, чем соперник', cat: 'board', isNew4: true, modes: true, lan: true, medals: [150, 300, 500],
  hint: 'Наоборот от обычного сапёра: мины здесь нужно находить! Ходите по очереди и открывайте клетки. Нашёл мину — она твоя, ходишь ещё раз. Открыл пустую — ход переходит сопернику. Числа подсказывают, сколько мин рядом. На поле 25 мин: кто первым соберёт 13, тот победил.',
  d0: 'Соперник угадывает', d1: 'Соперник считает простые случаи', d2: 'Соперник считает вероятности', d3: 'Соперник почти не ошибается',
  colors: ['#0d9488', '#134e4a'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#134e4a"/><g fill="#2dd4bf"><rect x="14" y="14" width="22" height="22" rx="4"/><rect x="64" y="64" width="22" height="22" rx="4"/><rect x="14" y="64" width="22" height="22" rx="4"/></g><g fill="#ccfbf1"><rect x="39" y="14" width="22" height="22" rx="4"/><rect x="39" y="39" width="22" height="22" rx="4"/><rect x="64" y="14" width="22" height="22" rx="4"/></g><circle cx="25" cy="50" r="8" fill="#ef4444"/><circle cx="75" cy="50" r="8" fill="#3b82f6"/><text x="46" y="31" font-family="sans-serif" font-weight="900" font-size="14" fill="#0f766e">2</text></svg>',
  create: function (api) {
    var K = window.GBK, W0 = 10, H0 = 12, M = 25, mine, open, owner, num, turn, found, netQ, endT, t, thinkT, over, last, cs, ox, oy, phase, rdyT, seed;
    function names() { return api.mode === 1 ? [api.t('g.p1'), api.t('g.p2')] : api.mode === 2 ? (api.net.side === 0 ? [api.t('g.you'), api.t('net.opp')] : [api.t('net.opp'), api.t('g.you')]) : [api.t('g.you'), api.t('g.cpu')]; }
    function me() { return api.mode === 2 ? api.net.side + 1 : 1; }
    function myTurn() { return phase === 'play' && !over && (api.mode === 1 || (api.mode === 2 ? turn === me() : turn === 1)); }
    function rng(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var x = Math.imul(s ^ s >>> 15, 1 | s); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
    function nbs(i) { var r = Math.floor(i / W0), c = i % W0, a = []; for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; var nr = r + dr, nc = c + dc; if (nr >= 0 && nc >= 0 && nr < H0 && nc < W0) a.push(nr * W0 + nc); } return a; }
    function build(s) {
      seed = s; var R = rng(s), n = W0 * H0; mine = new Array(n).fill(0); open = new Array(n).fill(0); owner = new Array(n).fill(0); num = [];
      var k = 0; while (k < M) { var i = Math.floor(R() * n); if (!mine[i]) { mine[i] = 1; k++; } }
      for (var j = 0; j < n; j++) num.push(nbs(j).filter(function (v) { return mine[v]; }).length);
      turn = 1; found = [0, 0]; over = 0; last = -1; thinkT = 0.8; phase = 'play'; layout();
    }
    function reveal(i, remote) {
      if (open[i] || over) return;
      if (api.mode === 2 && !remote) api.net.send({ i: i });
      last = i;
      if (mine[i]) {
        open[i] = 1; owner[i] = turn; found[turn - 1]++; api.sound('coin'); api.vibrate(20);
        if (found[turn - 1] > M / 2) {
          over = turn; var mineW = api.mode === 1 || over === me(); api.sound(mineW ? 'win' : 'hit'); if (mineW) api.fx.confetti(50);
          if (api.mode === 0 && over === 1) api.addScore(200 + api.diff * 100 + (found[0] - found[1]) * 15);
          endT = 3;
        }
        thinkT = 0.6; return; // нашёл мину — ходит ещё
      }
      var st = [i]; open[i] = 1;
      while (st.length) { var u = st.pop(); if (num[u]) continue; nbs(u).forEach(function (v) { if (!open[v] && !mine[v]) { open[v] = 1; st.push(v); } }); }
      api.sound('click'); turn = 3 - turn; thinkT = 0.6 + Math.random() * 0.5;
    }
    function aiMove() {
      var n = W0 * H0, prob = new Array(n).fill(-1), sure = [];
      var unk = 0, left = M - found[0] - found[1]; for (var i = 0; i < n; i++) if (!open[i]) unk++;
      for (i = 0; i < n; i++) {
        if (!open[i] || mine[i] || !num[i]) continue;
        var ns = nbs(i), hid = ns.filter(function (v) { return !open[v]; }), got = ns.filter(function (v) { return open[v] && mine[v]; }).length, need = num[i] - got;
        if (!hid.length) continue;
        var p = need / hid.length; hid.forEach(function (v) { prob[v] = Math.max(prob[v], p); if (p >= 1) sure.push(v); });
      }
      if (sure.length && Math.random() < [0.4, 0.95, 1, 1][api.diff]) return reveal(sure[Math.floor(Math.random() * sure.length)]);
      var cand = [], base = left / Math.max(1, unk);
      for (i = 0; i < n; i++) if (!open[i]) cand.push([i, (prob[i] < 0 ? base : prob[i]) + Math.random() * [0.8, 0.35, 0.08, 0.02][api.diff]]);
      cand.sort(function (a, b2) { return b2[1] - a[1]; });
      reveal(cand[0][0]);
    }
    function layout() { cs = Math.min((api.W - 20) / W0, (api.H - 200) / H0); ox = (api.W - cs * W0) / 2; oy = 84 + Math.max(0, (api.H - 200 - cs * H0) / 2); }
    return {
      reset: function () {
        netQ = []; endT = 0; t = 0; rdyT = 0;
        if (api.mode === 2) { phase = 'sync'; mine = null; if (api.net.side === 0) { build(Math.floor(Math.random() * 2e9)); api.net.send({ seed: seed }); } }
        else build(Math.floor(Math.random() * 2e9));
      },
      resize: function () { if (mine) layout(); }, idle: function (dt) { t += dt || 0; }, key: function () { },
      netMsg: function (d) {
        if (d.k === 'rdy') { if (api.net.side === 0 && seed != null) api.net.send({ seed: seed }); return; }
        if (d.seed != null) { if (api.net.side === 1 && phase === 'sync') build(d.seed); return; }
        netQ.push(d);
      },
      input: function (type, d) {
        if (type !== 'down' || !myTurn()) return;
        var c = Math.floor((d.x - ox) / cs), r = Math.floor((d.y - oy) / cs); if (c < 0 || r < 0 || c >= W0 || r >= H0) return;
        reveal(r * W0 + c);
      },
      update: function (dt) {
        t += dt;
        if (phase === 'sync') { rdyT -= dt; if (rdyT <= 0) { rdyT = 1; api.net.send({ k: 'rdy' }); } return; }
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (over) return;
        if (api.mode === 0 && turn === 2) { thinkT -= dt; if (thinkT <= 0) aiMove(); }
        if (api.mode === 2 && turn !== me() && netQ.length) { var m = netQ.shift(); if (m.i >= 0 && m.i < W0 * H0 && !open[m.i]) reveal(m.i, true); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, nm = names(), COL = ['#ef4444', '#3b82f6'];
        K.bg(c, W, H, '#134e4a', '#042f2e', 'rgba(45,212,191,.12)');
        c.textAlign = 'center'; c.textBaseline = 'middle';
        if (phase === 'sync') { K.toast(c, W, H / 2, 'Соединение…', 1); return; }
        [0, 1].forEach(function (p) { var x = p ? W * 0.75 : W * 0.25, act = !over && turn === p + 1; c.fillStyle = act ? '#fde68a' : COL[p]; c.font = '800 15px system-ui'; c.fillText((act ? '▶ ' : '') + nm[p], x, 28); c.font = '900 20px system-ui'; c.fillStyle = '#fff'; c.fillText('💣 ' + found[p], x, 54); });
        var NC = ['', '#2563eb', '#16a34a', '#dc2626', '#7c3aed', '#b45309', '#0891b2', '#111', '#666'];
        for (var i = 0; i < W0 * H0; i++) {
          var x = ox + (i % W0) * cs, y = oy + Math.floor(i / W0) * cs;
          if (!open[i]) { K.rr(c, x + 1, y + 1, cs - 2, cs - 2, cs * 0.18); c.fillStyle = (Math.floor(i / W0) + i) % 2 ? '#2dd4bf' : '#14b8a6'; c.fill(); continue; }
          K.rr(c, x + 1, y + 1, cs - 2, cs - 2, cs * 0.18); c.fillStyle = '#ccfbf1'; c.fill();
          if (mine[i]) {
            c.fillStyle = COL[owner[i] - 1]; c.beginPath(); c.arc(x + cs / 2, y + cs / 2, cs * 0.3, 0, 6.283); c.fill();
            c.fillStyle = '#fff'; c.font = Math.round(cs * 0.4) + 'px system-ui'; c.fillText('💣', x + cs / 2, y + cs / 2 + 1);
          } else if (num[i]) { c.fillStyle = NC[num[i]]; c.font = '900 ' + Math.round(cs * 0.55) + 'px system-ui'; c.fillText(num[i], x + cs / 2, y + cs / 2 + 1); }
          if (i === last) { c.strokeStyle = '#fde68a'; c.lineWidth = 2.5; c.strokeRect(x + 2, y + 2, cs - 4, cs - 4); }
        }
        var tip;
        if (over) tip = api.mode === 1 ? api.t(over === 1 ? 'g.p1win' : 'g.p2win') : over === me() ? api.t('g.win') : api.t('g.lose');
        else if (api.mode === 0 && turn === 2) tip = 'Компьютер ищет мину…';
        else if (api.mode === 2 && turn !== me()) tip = api.t('net.oppTurn');
        else tip = (api.mode === 1 ? nm[turn - 1] + ', ' : '') + 'найди мину! Осталось ' + (M - found[0] - found[1]);
        K.toast(c, W, H - 40, tip, 1);
      }
    };
  }
};
