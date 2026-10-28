/* Го 9×9: окружай территорию и захватывай камни соперника */
window.GAMES = window.GAMES || {};
window.GAMES.go = {
  title: 'Го', desc: 'Древняя игра о территории', cat: 'board', isNew4: true, modes: true, lan: true, medals: [150, 300, 500],
  hint: 'Ставьте камни на пересечения по очереди, чёрные первые. Камни, у которых не осталось свободных соседних точек, снимаются с доски. Нельзя сразу отыгрывать только что взятый камень (правило ко). Когда ходить некуда, нажмите «Пас»; два паса подряд — конец. Очки: свои камни + окружённая пустая территория, белым +6,5 за второй ход.',
  d0: 'Новичок', d1: 'Любитель', d2: 'Опытный', d3: 'Сильный',
  colors: ['#ca8a04', '#422006'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#e3b04b"/><g stroke="#7c4a0e" stroke-width="2"><path d="M20 20v60M40 20v60M60 20v60M80 20v60M20 20h60M20 40h60M20 60h60M20 80h60"/></g><circle cx="40" cy="40" r="9" fill="#111"/><circle cx="60" cy="40" r="9" fill="#111"/><circle cx="40" cy="60" r="9" fill="#f8fafc"/><circle cx="60" cy="60" r="9" fill="#f8fafc"/><circle cx="60" cy="80" r="9" fill="#111"/></svg>',
  create: function (api) {
    var K = window.GBK, N = 9, b, prev, turn, passes, caps, netQ, endT, t, thinkT, over, last, cs, ox, oy, res, msg, msgT, moveN;
    function names() { return api.mode === 1 ? [api.t('g.p1'), api.t('g.p2')] : api.mode === 2 ? (api.net.side === 0 ? [api.t('g.you'), api.t('net.opp')] : [api.t('net.opp'), api.t('g.you')]) : [api.t('g.you'), api.t('g.cpu')]; }
    function me() { return api.mode === 2 ? api.net.side + 1 : 1; }
    function myTurn() { return !over && (api.mode === 1 || (api.mode === 2 ? turn === me() : turn === 1)); }
    function nb(i) { var r = Math.floor(i / N), c = i % N, a = []; if (r > 0) a.push(i - N); if (r < N - 1) a.push(i + N); if (c > 0) a.push(i - 1); if (c < N - 1) a.push(i + 1); return a; }
    function group(bb, i) { var col = bb[i], st = [i], seen = {}, libs = {}, g = []; seen[i] = 1; while (st.length) { var u = st.pop(); g.push(u); nb(u).forEach(function (v) { if (!bb[v]) libs[v] = 1; else if (bb[v] === col && !seen[v]) { seen[v] = 1; st.push(v); } }); } return { g: g, libs: Object.keys(libs).length }; }
    function tryMove(bb, i, p) { // новая доска и число взятых камней или null
      if (bb[i]) return null; var nbd = bb.slice(); nbd[i] = p; var cap = 0;
      nb(i).forEach(function (v) { if (nbd[v] === 3 - p) { var G = group(nbd, v); if (!G.libs) { G.g.forEach(function (u) { nbd[u] = 0; }); cap += G.g.length; } } });
      if (!group(nbd, i).libs) return null; // самоубийство
      if (prev && nbd.join('') === prev) return null; // ко
      return { b: nbd, cap: cap };
    }
    function score() {
      var s = [0, 0], seen = {};
      for (var i = 0; i < N * N; i++) {
        if (b[i]) { s[b[i] - 1]++; continue; } if (seen[i]) continue;
        var st = [i], area = 0, border = {}; seen[i] = 1;
        while (st.length) { var u = st.pop(); area++; nb(u).forEach(function (v) { if (!b[v] && !seen[v]) { seen[v] = 1; st.push(v); } else if (b[v]) border[b[v]] = 1; }); }
        if (border[1] && !border[2]) s[0] += area; else if (border[2] && !border[1]) s[1] += area;
      }
      s[1] += 6.5; return s;
    }
    function newGame() { b = new Array(N * N).fill(0); prev = null; turn = 1; passes = 0; caps = [0, 0]; over = 0; last = -1; thinkT = 0.8; res = null; msgT = 0; moveN = 0; layout(); }
    function play(i, remote) {
      if (api.mode === 2 && !remote) api.net.send({ i: i });
      moveN++;
      if (i < 0) { passes++; last = -1; say((turn === 1 ? 'Чёрные' : 'Белые') + ' пасуют'); api.sound('click'); if (passes >= 2) return finish(); turn = 3 - turn; thinkT = 0.6; return; }
      var r = tryMove(b, i, turn); if (!r) return;
      prev = b.join(''); b = r.b; caps[turn - 1] += r.cap; passes = 0; last = i;
      api.sound(r.cap ? 'coin' : 'click'); api.vibrate(r.cap ? 20 : 6);
      turn = 3 - turn; thinkT = 0.4 + Math.random() * 0.5;
    }
    function finish() {
      res = score(); over = res[0] > res[1] ? 1 : 2;
      var mine = api.mode === 1 || over === me(); api.sound(mine ? 'win' : 'hit'); if (mine) api.fx.confetti(50);
      if (api.mode === 0 && over === 1) api.addScore(200 + api.diff * 120 + Math.round((res[0] - res[1]) * 5));
      endT = 4.5;
    }
    function say(s) { msg = s; msgT = 1.6; }
    function aiMove() {
      var best = -1, bs = -1e9, p = 2;
      for (var i = 0; i < N * N; i++) {
        var r = tryMove(b, i, p); if (!r) continue;
        var ns = nb(i), own = ns.filter(function (v) { return b[v] === p; }).length;
        if (own === ns.length) continue; // не заполнять свой глаз
        var s = r.cap * 30, G = group(r.b, i);
        if (G.libs === 1) s -= 40 + G.g.length * 8; else s += Math.min(G.libs, 4) * 2;
        // спасение своих групп в атари и атака групп соперника
        ns.forEach(function (v) { if (b[v] === p && group(b, v).libs === 1) s += 25; if (b[v] === 3 - p) { var og = group(r.b, v); if (og.libs === 1) s += 12; if (og.libs === 2) s += 3; } });
        var rr = Math.floor(i / N), cc = i % N, edge = Math.min(rr, cc, N - 1 - rr, N - 1 - cc);
        s += moveN < 10 ? (edge === 2 ? 8 : edge === 0 ? -8 : 0) : (edge === 0 ? -3 : 0);
        if (ns.some(function (v) { return b[v]; })) s += 2;
        s += Math.random() * [25, 10, 4, 1.5][api.diff];
        if (s > bs) { bs = s; best = i; }
      }
      // пас, если хороших ходов нет, или соперник спасовал и доска поделена
      if (best < 0 || (moveN > 40 && bs < 4) || (passes && moveN > 30 && bs < 10)) play(-1); else play(best);
    }
    function layout() { cs = Math.min((api.W - 30) / N, (api.H - 260) / N); ox = (api.W - cs * (N - 1)) / 2; oy = 110 + cs / 2; }
    function passBtn() { return [api.W / 2 - 70, oy + cs * (N - 1) + cs / 2 + 22, 140, 44]; }
    return {
      reset: function () { netQ = []; endT = 0; t = 0; newGame(); },
      resize: function () { if (b) layout(); }, idle: function (dt) { t += dt || 0; }, key: function () { },
      netMsg: function (d) { netQ.push(d); },
      input: function (type, d) {
        if (type !== 'down' || !myTurn()) return;
        var pb = passBtn(); if (d.x > pb[0] && d.x < pb[0] + pb[2] && d.y > pb[1] && d.y < pb[1] + pb[3]) { play(-1); return; }
        var c = Math.round((d.x - ox) / cs), r = Math.round((d.y - oy) / cs); if (c < 0 || r < 0 || c >= N || r >= N) return;
        var i = r * N + c; if (tryMove(b, i, turn)) play(i); else if (!b[i]) { say('Сюда нельзя: ко или нет свободных точек'); api.vibrate(30); }
      },
      update: function (dt) {
        t += dt; if (msgT > 0) msgT -= dt;
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (over) return;
        if (api.mode === 0 && turn === 2) { thinkT -= dt; if (thinkT <= 0) aiMove(); }
        if (api.mode === 2 && turn !== me() && netQ.length) { var m = netQ.shift(); if (m.i === -1 || (m.i >= 0 && tryMove(b, m.i, turn))) play(m.i, true); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, nm = names();
        K.bg(c, W, H, '#292524', '#0c0a09', 'rgba(202,138,4,.12)');
        c.textAlign = 'center'; c.textBaseline = 'middle';
        [0, 1].forEach(function (p) {
          var x = p ? W * 0.75 : W * 0.25, act = !over && turn === p + 1;
          c.fillStyle = p ? '#f8fafc' : '#111'; c.beginPath(); c.arc(x - 60, 32, 9, 0, 6.283); c.fill(); c.strokeStyle = '#78716c'; c.lineWidth = 1; c.stroke();
          c.fillStyle = act ? '#fde68a' : '#e7e5e4'; c.font = '800 15px system-ui'; c.fillText((act ? '▶ ' : '') + nm[p], x + 4, 32);
          c.fillStyle = '#a8a29e'; c.font = '700 12px system-ui'; c.fillText('взято: ' + caps[p], x, 54);
        });
        var bx = ox - cs / 2 - 6, by = oy - cs / 2 - 6, bw = cs * N + 12;
        K.rr(c, bx, by, bw, bw, 12); var g = c.createLinearGradient(bx, by, bx + bw, by + bw); g.addColorStop(0, '#f2c46d'); g.addColorStop(1, '#d9a441'); c.fillStyle = g; c.fill();
        c.strokeStyle = '#6b4211'; c.lineWidth = 1.3;
        for (var k = 0; k < N; k++) { c.beginPath(); c.moveTo(ox, oy + k * cs); c.lineTo(ox + (N - 1) * cs, oy + k * cs); c.moveTo(ox + k * cs, oy); c.lineTo(ox + k * cs, oy + (N - 1) * cs); c.stroke(); }
        [[2, 2], [2, 6], [6, 2], [6, 6], [4, 4]].forEach(function (q) { c.fillStyle = '#6b4211'; c.beginPath(); c.arc(ox + q[1] * cs, oy + q[0] * cs, 3.5, 0, 6.283); c.fill(); });
        for (var i = 0; i < N * N; i++) {
          if (!b[i]) continue; var x = ox + (i % N) * cs, y = oy + Math.floor(i / N) * cs, rr = cs * 0.46;
          c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.arc(x + 1.5, y + 2, rr, 0, 6.283); c.fill();
          var sg = c.createRadialGradient(x - rr * 0.35, y - rr * 0.4, 1, x, y, rr); if (b[i] === 1) { sg.addColorStop(0, '#666'); sg.addColorStop(1, '#0a0a0a'); } else { sg.addColorStop(0, '#fff'); sg.addColorStop(1, '#cbd5e1'); }
          c.fillStyle = sg; c.beginPath(); c.arc(x, y, rr, 0, 6.283); c.fill();
          if (i === last) { c.strokeStyle = b[i] === 1 ? '#fff' : '#111'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, rr * 0.4, 0, 6.283); c.stroke(); }
        }
        if (myTurn()) { var pb = passBtn(); K.key(c, pb[0], pb[1], pb[2], pb[3], '#57534e', 'Пас', '800 16px system-ui'); }
        var tip;
        if (over) tip = 'Чёрные ' + res[0] + ' : ' + res[1] + ' белые · ' + (api.mode === 1 ? api.t(over === 1 ? 'g.p1win' : 'g.p2win') : over === me() ? api.t('g.win') : api.t('g.lose'));
        else if (msgT > 0) tip = msg;
        else if (api.mode === 0 && turn === 2) tip = 'Компьютер думает…';
        else if (api.mode === 2 && turn !== me()) tip = api.t('net.oppTurn');
        else tip = (api.mode === 1 ? nm[turn - 1] + ', ' : '') + 'твой ход';
        K.toast(c, W, H - 46, tip, 1);
      }
    };
  }
};
