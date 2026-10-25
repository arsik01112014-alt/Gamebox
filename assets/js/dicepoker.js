/* Покер на костях: до трёх бросков пяти костей, между бросками можно оставлять кости. У кого комбинация сильнее — раунд его. До 3 побед */
window.GAMES = window.GAMES || {};
window.GAMES.dicepoker = {
  title: 'Покер на костях', desc: 'Собери лучшую комбинацию', cat: 'board', isNew4: true, modes: true, lan: true, medals: [100, 250, 500],
  hint: 'Бросай 5 костей до трёх раз. Нажми на кость, чтобы оставить её (она подсветится), и бросай остальные. Комбинации от слабой к сильной: пара, две пары, тройка, малый стрит (1–5), большой стрит (2–6), фулл-хаус, каре, покер (пять одинаковых). До 3 побед.',
  d0: 'Компьютер играет небрежно', d1: 'Обычный соперник', d2: 'Опытный соперник', d3: 'Профи',
  colors: ['#b91c1c', '#065f46'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#065f46"/><rect x="16" y="24" width="32" height="32" rx="7" fill="#fff" transform="rotate(-12 32 40)"/><rect x="52" y="44" width="32" height="32" rx="7" fill="#fff" transform="rotate(10 68 60)"/><g fill="#b91c1c"><circle cx="26" cy="34" r="3.5"/><circle cx="32" cy="40" r="3.5"/><circle cx="38" cy="46" r="3.5"/><circle cx="62" cy="52" r="3.5"/><circle cx="74" cy="54" r="3.5"/><circle cx="61" cy="66" r="3.5"/><circle cx="73" cy="68" r="3.5"/></g></svg>',
  create: function (api) {
    var K = window.GBK, NAMES = ['Ничего', 'Пара', 'Две пары', 'Тройка', 'Малый стрит', 'Большой стрит', 'Фулл-хаус', 'Каре', 'Покер!'];
    var wins, round, cur, dice, hold, rolls, phase, phaseT, res, netQ, endT, t, rollT, oppRolling, sent;
    function names() { return api.mode === 1 ? [api.t('g.p1'), api.t('g.p2')] : api.mode === 2 ? [api.t('g.you'), api.t('net.opp')] : [api.t('g.you'), api.t('g.cpu')]; }
    // оценка: [ранг, значения для сравнения]
    function rank(d) {
      var cnt = [0, 0, 0, 0, 0, 0, 0]; d.forEach(function (v) { cnt[v]++; });
      var groups = []; for (var v = 6; v >= 1; v--) if (cnt[v]) groups.push([cnt[v], v]);
      groups.sort(function (a, b) { return b[0] - a[0] || b[1] - a[1]; });
      var s = d.slice().sort().join(''), r;
      if (groups[0][0] === 5) r = 8; else if (groups[0][0] === 4) r = 7; else if (groups[0][0] === 3 && groups[1][0] === 2) r = 6;
      else if (s === '23456') r = 5; else if (s === '12345') r = 4; else if (groups[0][0] === 3) r = 3; else if (groups[0][0] === 2 && groups[1][0] === 2) r = 2; else if (groups[0][0] === 2) r = 1; else r = 0;
      return [r].concat(groups.map(function (g) { return g[1]; }));
    }
    function cmp(a, b) { var A = rank(a), B = rank(b); for (var i = 0; i < Math.max(A.length, B.length); i++) { var x = A[i] || 0, y = B[i] || 0; if (x !== y) return x > y ? 1 : 2; } return 0; }
    function newRound() { cur = 0; dice = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]]; hold = [false, false, false, false, false]; rolls = [0, 0]; phase = 'turn'; phaseT = 0; res = null; oppRolling = 0; sent = false; }
    function roll(p) {
      if (rolls[p] >= 3) return;
      for (var i = 0; i < 5; i++) if (!hold[i] || !rolls[p]) dice[p][i] = 1 + Math.floor(Math.random() * 6);
      rolls[p]++; rollT = 0.5; api.sound('click'); api.vibrate(15);
      if (api.mode === 2 && p === 0) api.net.send({ k: 'roll', r: round, d: dice[0], n: rolls[0] });
    }
    function stand(p) {
      if (!rolls[p]) return;
      hold = [false, false, false, false, false];
      if (api.mode === 2) { if (!sent) { sent = true; api.net.send({ k: 'done', r: round, d: dice[0] }); } phase = 'wait'; return; }
      if (p === 0) { cur = 1; phaseT = 0; if (api.mode === 0) cpuT = 0.8; } else finish();
    }
    var cpuT = 0;
    function cpuStep() { // компьютер: оставляет самые частые значения или стрит
      var d = dice[1];
      if (rolls[1] === 0) { roll(1); return; }
      var rk = rank(d)[0], target = [0, 0, 1, 2, 2, 3][1 + api.diff] || 2;
      if (rolls[1] >= 3 || rk >= 6 || (rk >= target + 2 && api.diff < 3) || (api.diff === 0 && Math.random() < 0.35)) { finish(); return; }
      var cnt = [0, 0, 0, 0, 0, 0, 0]; d.forEach(function (v) { cnt[v]++; });
      var best = 1; for (var v = 1; v <= 6; v++) if (cnt[v] > cnt[best] || (cnt[v] === cnt[best] && v > best)) best = v;
      var uniq = cnt.filter(function (x) { return x === 1; }).length;
      if (api.diff >= 2 && cnt[best] === 1 && uniq >= 4) { // охота за стритом
        var need = cnt[1] && !cnt[6] ? [1, 2, 3, 4, 5] : [2, 3, 4, 5, 6], used = {};
        hold = d.map(function (x) { if (need.indexOf(x) >= 0 && !used[x]) { used[x] = 1; return true; } return false; });
      } else hold = d.map(function (x) { return x === best || (api.diff >= 1 && cnt[x] === 2 && rk === 2); });
      roll(1);
    }
    function finish() {
      res = cmp(dice[0], dice[1]); if (res) wins[res - 1]++;
      var mine = res === 1 || (api.mode === 1 && res);
      api.sound(!res ? 'click' : mine ? 'win' : 'hit'); if (res === 1 && api.mode === 0) api.addScore((rank(dice[0])[0] + 1) * 15 * (api.diff + 1));
      phase = 'result'; phaseT = 0; round++;
      if (wins[0] >= 3 || wins[1] >= 3) { if (api.mode === 0 && wins[0] >= 3) { api.addScore(100 * (api.diff + 1)); api.fx.confetti(50); } endT = 2.6; }
    }
    function layoutDice(p) { // кости игрока p: ряд
      var W = api.W, H = api.H, s = Math.min(58, (W - 60) / 5), y = p === 0 ? H * 0.58 : H * 0.2 + 30;
      return [0, 1, 2, 3, 4].map(function (i) { return { x: W / 2 - (s + 8) * 2.5 + 4 + i * (s + 8), y: y, s: s }; });
    }
    function btns() { var W = api.W, H = api.H, w = (W - 48) / 2; return [{ k: 'roll', x: 16, y: H - 86, w: w, h: 56 }, { k: 'stand', x: W / 2 + 8, y: H - 86, w: w, h: 56 }]; }
    function drawDie(c, x, y, s, v, held, rot) {
      c.save(); c.translate(x + s / 2, y + s / 2); c.rotate(rot || 0);
      c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 8; c.shadowOffsetY = 4;
      var g = c.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e2e8f0');
      K.rr(c, -s / 2, -s / 2, s, s, s * 0.18); c.fillStyle = g; c.fill(); c.shadowBlur = 0;
      if (held) { c.strokeStyle = '#facc15'; c.lineWidth = 4; K.rr(c, -s / 2 - 2, -s / 2 - 2, s + 4, s + 4, s * 0.2); c.stroke(); }
      var P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[v] || [];
      c.fillStyle = v === 1 ? '#dc2626' : '#111827';
      P.forEach(function (q) { c.beginPath(); c.arc(q[0] * s * 0.26, q[1] * s * 0.26, s * (v === 1 ? 0.13 : 0.09), 0, 6.283); c.fill(); });
      c.restore();
    }
    return {
      reset: function () { wins = [0, 0]; round = 0; netQ = []; endT = 0; t = 0; rollT = 0; newRound(); },
      resize: function () { }, idle: function (dt) { t += dt || 0; }, key: function () { },
      netMsg: function (d) { netQ.push(d); },
      input: function (type, d) {
        if (type !== 'tap' || endT > 0) return;
        if (phase === 'result') { if (phaseT > 1 && api.mode !== 2) newRound(); return; }
        if (phase !== 'turn') return;
        var p = api.mode === 1 ? cur : 0;
        if (api.mode === 0 && cur === 1) return;
        btns().forEach(function (b) { if (d.x > b.x && d.x < b.x + b.w && d.y > b.y && d.y < b.y + b.h) { if (b.k === 'roll') roll(p); else stand(p); } });
        if (rolls[p] && rolls[p] < 3) layoutDice(api.mode === 1 ? 0 : 0).forEach(function (q, i) { if (d.x > q.x && d.x < q.x + q.s && d.y > q.y && d.y < q.y + q.s) { hold[i] = !hold[i]; api.sound('click'); } });
      },
      update: function (dt) {
        t += dt; phaseT += dt; if (rollT > 0) rollT -= dt; if (oppRolling > 0) oppRolling -= dt;
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (api.mode === 0 && phase === 'turn' && cur === 1) { cpuT -= dt; if (cpuT <= 0) { cpuT = 0.9; cpuStep(); } }
        if (api.mode === 2) {
          for (var i = netQ.length - 1; i >= 0; i--) {
            var m = netQ[i];
            if (m.r !== round) { if (m.r < round) netQ.splice(i, 1); continue; }
            if (m.k === 'roll') { dice[1] = m.d; rolls[1] = m.n; oppRolling = 0.5; netQ.splice(i, 1); }
            else if (m.k === 'done' && (phase === 'wait' || phase === 'turn')) { dice[1] = m.d; rolls[1] = 9; netQ.splice(i, 1); }
          }
          if (phase === 'wait' && rolls[1] === 9) finish();
          if (phase === 'result' && phaseT > 2.4) newRound();
        }
        // авто-стоп после третьего броска
        if (phase === 'turn' && rollT <= 0) { var p = api.mode === 1 ? cur : 0; if (rolls[p] >= 3 && !(api.mode === 0 && cur === 1)) stand(p); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, nm = names();
        var g = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, Math.max(W, H) * 0.75); g.addColorStop(0, '#047857'); g.addColorStop(1, '#022c22'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(250,204,21,.25)'; c.lineWidth = 2; K.rr(c, 10, 70, W - 20, H - 170, 26); c.stroke();
        c.textAlign = 'center'; c.textBaseline = 'middle';
        [0, 1].forEach(function (p) { var x = p ? W * 0.75 : W * 0.25; c.fillStyle = '#d1fae5'; c.font = '800 15px system-ui'; c.fillText(nm[p], x, 26); for (var s = 0; s < 3; s++) { c.fillStyle = s < wins[p] ? '#facc15' : 'rgba(255,255,255,.15)'; c.beginPath(); c.arc(x - 16 + s * 16, 48, 6, 0, 6.283); c.fill(); } });
        // в режиме вдвоём текущий игрок всегда внизу
        var bottom = api.mode === 1 ? cur : 0, top = 1 - bottom;
        [[top, 1], [bottom, 0]].forEach(function (pp) {
          var p = pp[0], L = layoutDice(pp[1]), shake = (p === bottom && rollT > 0) || (p === 1 && api.mode !== 1 && (oppRolling > 0 || (api.mode === 0 && cur === 1 && rollT > 0)));
          c.fillStyle = '#a7f3d0'; c.font = '800 13px system-ui';
          c.fillText(nm[p] + (rolls[p] ? ' · ' + NAMES[rank(dice[p])[0]] + (rolls[p] < 9 ? ' · бросок ' + Math.min(3, rolls[p]) + '/3' : '') : ' · ещё не бросал'), W / 2, L[0].y - 18);
          L.forEach(function (q, i) {
            var v = dice[p][i]; if (!v) { c.strokeStyle = 'rgba(255,255,255,.2)'; c.setLineDash([5, 5]); K.rr(c, q.x, q.y, q.s, q.s, 10); c.stroke(); c.setLineDash([]); return; }
            var vv = shake ? 1 + Math.floor(Math.random() * 6) : v;
            drawDie(c, q.x, q.y, q.s, vv, p === bottom && hold[i] && phase === 'turn', shake ? (Math.random() - 0.5) * 0.6 : (i - 2) * 0.03);
          });
        });
        var msg;
        if (phase === 'result') {
          msg = !res ? 'Ничья' : api.mode === 1 ? (res === 1 ? 'Раунд игроку 1' : 'Раунд игроку 2') : res === 1 ? 'Раунд твой!' : 'Раунд за соперником';
          if (endT > 0) msg = api.mode === 1 ? api.t(wins[0] >= 3 ? 'g.p1win' : 'g.p2win') : wins[0] >= 3 ? api.t('g.win') : api.t('g.lose');
          K.toast(c, W, H * 0.45, msg + (api.mode !== 2 && !endT && phaseT > 1 ? ' · ' + api.t('g.tapContinue') : ''), 1);
        } else if (phase === 'wait') K.toast(c, W, H * 0.45, 'Ждём соперника…', 1);
        else if (api.mode === 0 && cur === 1) K.toast(c, W, H * 0.45, 'Компьютер бросает…', 1);
        else {
          var p2 = api.mode === 1 ? cur : 0;
          K.toast(c, W, H * 0.45, (api.mode === 1 ? nm[cur] + ': ' : '') + (!rolls[p2] ? 'бросай кости' : rolls[p2] < 3 ? 'нажми на кости, которые оставить' : ''), 1);
          btns().forEach(function (b) {
            if (b.k === 'roll') K.button(c, b.x, b.y, b.w, b.h, rolls[p2] >= 3 ? '#475569' : '#22c55e', rolls[p2] >= 3 ? '#334155' : '#15803d', '🎲 Бросить' + (rolls[p2] ? ' (' + (3 - rolls[p2]) + ')' : ''), '900 17px system-ui');
            else K.button(c, b.x, b.y, b.w, b.h, rolls[p2] ? '#f59e0b' : '#475569', rolls[p2] ? '#b45309' : '#334155', '✋ Хватит', '900 17px system-ui');
          });
        }
      }
    };
  }
};
