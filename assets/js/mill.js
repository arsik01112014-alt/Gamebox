/* Мельница: ставь по 9 фишек, собирай ряды из трёх («мельницы») и снимай фишки соперника.
   Режимы: против компьютера, вдвоём на одном устройстве, по сети */
window.GAMES = window.GAMES || {};
window.GAMES.mill = {
  title: 'Мельница', desc: 'Старинная игра на двоих', cat: 'board', isNew4: true, modes: true, lan: true, medals: [150, 400, 800],
  hint: 'Сначала по очереди ставьте по 9 фишек на точки. Три свои фишки в линию — «мельница»: сними любую фишку соперника. Потом фишки ходят на соседнюю свободную точку, а когда осталось 3 — прыгают куда угодно. У кого меньше 3 фишек или нет ходов — проиграл.',
  d0: 'Компьютер играет наугад', d1: 'Обычный соперник', d2: 'Хитрый соперник', d3: 'Сильный соперник',
  colors: ['#a16207', '#78350f'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#d6a461"/><g fill="none" stroke="#5b3a14" stroke-width="3.5"><rect x="16" y="16" width="68" height="68"/><rect x="29" y="29" width="42" height="42"/><rect x="41" y="41" width="18" height="18"/><path d="M50 16v25M50 59v25M16 50h25M59 50h25"/></g><circle cx="16" cy="16" r="7" fill="#f8fafc" stroke="#334155" stroke-width="2"/><circle cx="50" cy="16" r="7" fill="#f8fafc" stroke="#334155" stroke-width="2"/><circle cx="84" cy="16" r="7" fill="#f8fafc" stroke="#334155" stroke-width="2"/><circle cx="29" cy="71" r="7" fill="#1f2937"/><circle cx="59" cy="50" r="7" fill="#1f2937"/></svg>',
  create: function (api) {
    var PTS = [[0, 0], [3, 0], [6, 0], [6, 3], [6, 6], [3, 6], [0, 6], [0, 3], [1, 1], [3, 1], [5, 1], [5, 3], [5, 5], [3, 5], [1, 5], [1, 3], [2, 2], [3, 2], [4, 2], [4, 3], [4, 4], [3, 4], [2, 4], [2, 3]];
    var ADJ = [], MILLS = [], K = window.GBK;
    (function () {
      for (var i = 0; i < 24; i++) ADJ.push([]);
      for (var r = 0; r < 3; r++) for (var k = 0; k < 8; k++) {
        var a = r * 8 + k, b = r * 8 + (k + 1) % 8; ADJ[a].push(b); ADJ[b].push(a);
        if (k % 2 === 1 && r < 2) { ADJ[a].push(a + 8); ADJ[a + 8].push(a); }
        if (k % 2 === 0) MILLS.push([a, r * 8 + k + 1, r * 8 + (k + 2) % 8]);
      }
      for (var q = 1; q < 8; q += 2) MILLS.push([q, q + 8, q + 16]);
    })();
    var board, hand, turn, phase, sel, netQ, wins, endT, msg, t, thinkT, last, cs, ox, oy, roundOver, roundT, removedFx;
    function names() { return api.mode === 1 ? [api.t('g.p1'), api.t('g.p2')] : api.mode === 2 ? (api.net.side === 0 ? [api.t('g.you'), api.t('net.opp')] : [api.t('net.opp'), api.t('g.you')]) : [api.t('g.you'), api.t('g.cpu')]; }
    function me() { return api.mode === 2 ? api.net.side + 1 : 1; }
    function myTurn() { return api.mode === 1 || turn === me(); }
    function count(p) { var n = 0; for (var i = 0; i < 24; i++) if (board[i] === p) n++; return n; }
    function inMill(i, b) { b = b || board; var p = b[i]; return p && MILLS.some(function (m) { return m.indexOf(i) >= 0 && b[m[0]] === p && b[m[1]] === p && b[m[2]] === p; }); }
    function canFly(p) { return hand[p - 1] === 0 && count(p) === 3; }
    function movesOf(p) {
      var out = [];
      if (hand[p - 1] > 0) { for (var i = 0; i < 24; i++) if (!board[i]) out.push([-1, i]); return out; }
      for (var a = 0; a < 24; a++) if (board[a] === p) {
        var to = canFly(p) ? PTS.map(function (_, i2) { return i2; }) : ADJ[a];
        to.forEach(function (b) { if (!board[b]) out.push([a, b]); });
      }
      return out;
    }
    function removable(p) { // фишки игрока p, которые можно снять
      var all = [], free = [];
      for (var i = 0; i < 24; i++) if (board[i] === p) { all.push(i); if (!inMill(i)) free.push(i); }
      return free.length ? free : all;
    }
    function newRound() {
      board = []; for (var i = 0; i < 24; i++) board.push(0);
      hand = [9, 9]; turn = roundOver === 2 ? 2 : 1; phase = 'play'; sel = -1; last = null; roundOver = 0; roundT = 0; thinkT = 0.7; removedFx = [];
    }
    function nextTurn() {
      turn = 3 - turn; sel = -1;
      if (hand[0] === 0 && hand[1] === 0 && (count(turn) < 3 || !movesOf(turn).length)) finish(3 - turn);
      thinkT = 0.5 + Math.random() * 0.4;
    }
    function finish(w) {
      roundOver = w; roundT = 0; wins[w - 1]++;
      var mine = api.mode === 1 || w === me();
      api.sound(mine ? 'win' : 'hit'); if (mine) api.fx.confetti(40);
      if (api.mode === 0 && w === 1) api.addScore(100 * (api.diff + 1) + 10 * count(1));
      if (wins[w - 1] >= 2) endT = 2.2;
    }
    // ход: a — откуда (-1 — из руки), b — куда; после «мельницы» тот же игрок снимает фишку
    function doMove(a, b, remote) {
      if (api.mode === 2 && !remote) api.net.send({ k: 'm', a: a, b: b });
      if (a < 0) { board[b] = turn; hand[turn - 1]--; } else { board[a] = 0; board[b] = turn; }
      last = [a, b]; api.sound('click'); api.vibrate(8);
      if (inMill(b)) { phase = 'remove'; msg = ''; api.sound('bonus'); thinkT = 0.6; return; }
      nextTurn();
    }
    function doRemove(i, remote) {
      if (api.mode === 2 && !remote) api.net.send({ k: 'r', i: i });
      removedFx.push({ i: i, p: board[i], t: 0.5 }); board[i] = 0; phase = 'play'; api.sound('hit'); api.vibrate(20);
      if (hand[3 - turn - 1] === 0 && count(3 - turn) < 3) { finish(turn); return; }
      nextTurn();
    }
    // ---- компьютер ----
    function makesMill(p, a, b) { var s = board[b]; if (a >= 0) board[a] = 0; board[b] = p; var m = inMill(b); board[b] = s; if (a >= 0) board[a] = p; return m; }
    function aiMove() {
      var mv = movesOf(2); if (!mv.length) return;
      if (api.diff === 0) { var r = mv[Math.floor(Math.random() * mv.length)]; doMove(r[0], r[1]); return; }
      var best = null, bs = -1e9;
      mv.forEach(function (m) {
        var s = Math.random() * 3;
        if (makesMill(2, m[0], m[1])) s += 100;
        if (makesMill(1, -1, m[1]) && (hand[0] > 0 || ADJ[m[1]].some(function (n) { return board[n] === 1; }))) s += 60; // закрыть чужую мельницу
        if (api.diff >= 2) {
          s += ADJ[m[1]].filter(function (n) { return board[n] === 2; }).length * 4;
          if (m[0] >= 0 && inMill(m[0])) s += 8; // разобрать свою мельницу, чтобы собрать снова
          if (api.diff >= 3 && m[0] >= 0) { // не открывать соседу мельницу
            board[m[0]] = 0; board[m[1]] = 2; var danger = movesOf(1).some(function (q) { return makesMill(1, q[0], q[1]); }); board[m[1]] = 0; board[m[0]] = 2;
            if (danger) s -= 40;
          }
        }
        if (s > bs) { bs = s; best = m; }
      });
      doMove(best[0], best[1]);
    }
    function aiRemove() {
      var opts = removable(1), best = opts[0], bs = -1;
      opts.forEach(function (i) {
        var s = Math.random() + (api.diff > 0 ? ADJ[i].filter(function (n) { return board[n] === 1; }).length * 3 : 0);
        if (api.diff > 0 && MILLS.some(function (m) { return m.indexOf(i) >= 0 && m.filter(function (q) { return board[q] === 1; }).length === 2 && m.some(function (q) { return !board[q]; }); })) s += 20;
        if (s > bs) { bs = s; best = i; }
      });
      doRemove(best);
    }
    function layout() { var size = Math.min(api.W - 84, api.H - 280); cs = size / 6; ox = (api.W - size) / 2; oy = 120 + (api.H - 250 - size) / 2; }
    function ptXY(i) { return [ox + PTS[i][0] * cs, oy + PTS[i][1] * cs]; }
    function pointAt(x, y) { for (var i = 0; i < 24; i++) { var p = ptXY(i); if (Math.hypot(p[0] - x, p[1] - y) < cs * 0.45) return i; } return -1; }
    return {
      reset: function () { wins = [0, 0]; endT = 0; netQ = []; t = 0; msg = ''; roundOver = 0; layout(); newRound(); },
      resize: layout, idle: function (dt) { t += dt || 0; }, key: function () { },
      netMsg: function (d) { netQ.push(d); },
      input: function (type, d) {
        if (type !== 'tap' || endT > 0) return;
        if (roundOver) { if (roundT > 1 && api.mode !== 2) newRound(); return; }
        if (!myTurn() || (api.mode === 0 && turn === 2)) return;
        var i = pointAt(d.x, d.y); if (i < 0) return;
        if (phase === 'remove') {
          if (removable(3 - turn).indexOf(i) < 0) { api.sound('hit'); return; }
          doRemove(i); return;
        }
        if (hand[turn - 1] > 0) { if (!board[i]) doMove(-1, i); return; }
        if (board[i] === turn) { sel = i; api.sound('click'); return; }
        if (sel >= 0 && !board[i] && (canFly(turn) || ADJ[sel].indexOf(i) >= 0)) doMove(sel, i);
      },
      update: function (dt) {
        t += dt; removedFx.forEach(function (f) { f.t -= dt; }); removedFx = removedFx.filter(function (f) { return f.t > 0; });
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (roundOver) { roundT += dt; if (api.mode === 2 && roundT > 2.2) newRound(); return; }
        if (api.mode === 0 && turn === 2) { thinkT -= dt; if (thinkT <= 0) { if (phase === 'remove') aiRemove(); else aiMove(); } }
        if (api.mode === 2 && turn !== me() && netQ.length) {
          var m = netQ.shift();
          if (m.k === 'm') doMove(m.a, m.b, true); else if (m.k === 'r') doRemove(m.i, true);
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H, nm = names();
        var g = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, Math.max(W, H) * 0.7); g.addColorStop(0, '#3f2a14'); g.addColorStop(1, '#1c1208'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        // игроки
        [0, 1].forEach(function (p) {
          var x = p ? W - 16 : 16, al = p ? 'right' : 'left', act = !roundOver && turn === p + 1;
          c.textAlign = al; c.textBaseline = 'middle'; c.fillStyle = act ? '#fde68a' : '#d6c3a5'; c.font = '800 15px system-ui'; c.fillText(nm[p] + (act ? ' ◀' : ''), x, 30);
          c.font = '700 12px system-ui'; c.fillStyle = '#c2a37a'; c.fillText('в руке ' + hand[p] + ' · на поле ' + count(p + 1) + ' · побед ' + wins[p], x, 52);
          for (var q = 0; q < hand[p]; q++) { c.fillStyle = p ? '#1f2937' : '#f8fafc'; c.beginPath(); c.arc(p ? W - 22 - q * 13 : 22 + q * 13, 76, 5.5, 0, 6.283); c.fill(); }
        });
        // доска
        var size = cs * 6, pad = cs * 0.45;
        c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 22; c.shadowOffsetY = 8;
        var wg = c.createLinearGradient(ox, oy, ox + size, oy + size); wg.addColorStop(0, '#e6b77a'); wg.addColorStop(1, '#b07a3f');
        K.rr(c, ox - pad, oy - pad, size + pad * 2, size + pad * 2, 18); c.fillStyle = wg; c.fill(); c.restore();
        c.strokeStyle = 'rgba(92,58,20,.25)'; c.lineWidth = 1;
        for (var gr = 0; gr < 14; gr++) { c.beginPath(); c.moveTo(ox - pad, oy - pad + gr * (size + 2 * pad) / 14 + 6); c.bezierCurveTo(ox + size * 0.3, oy - pad + gr * (size + 2 * pad) / 14, ox + size * 0.7, oy - pad + gr * (size + 2 * pad) / 14 + 10, ox + size + pad, oy - pad + gr * (size + 2 * pad) / 14 + 4); c.stroke(); }
        c.strokeStyle = '#4a2e0e'; c.lineWidth = 4; c.lineCap = 'round';
        [0, 1, 2].forEach(function (r) { var a = ptXY(r * 8), b = ptXY(r * 8 + 4); c.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); });
        [1, 3, 5, 7].forEach(function (k) { var a = ptXY(k), b = ptXY(k + 16); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); });
        var targets = {};
        if (!roundOver && myTurn() && !(api.mode === 0 && turn === 2)) {
          if (phase === 'remove') removable(3 - turn).forEach(function (i) { targets[i] = 'r'; });
          else if (sel >= 0) (canFly(turn) ? PTS.map(function (_, i) { return i; }) : ADJ[sel]).forEach(function (i) { if (!board[i]) targets[i] = 'm'; });
        }
        for (var i = 0; i < 24; i++) {
          var p = ptXY(i), v = board[i], R2 = cs * 0.3;
          c.fillStyle = '#4a2e0e'; c.beginPath(); c.arc(p[0], p[1], 5, 0, 6.283); c.fill();
          if (targets[i] === 'm') { c.fillStyle = 'rgba(34,197,94,' + (0.5 + 0.3 * Math.sin(t * 6)) + ')'; c.beginPath(); c.arc(p[0], p[1], R2 * 0.55, 0, 6.283); c.fill(); }
          if (!v) continue;
          c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 8; c.shadowOffsetY = 4;
          var pg = c.createRadialGradient(p[0] - R2 * 0.35, p[1] - R2 * 0.35, 2, p[0], p[1], R2);
          if (v === 1) { pg.addColorStop(0, '#ffffff'); pg.addColorStop(1, '#cbd5e1'); } else { pg.addColorStop(0, '#64748b'); pg.addColorStop(1, '#0f172a'); }
          c.fillStyle = pg; c.beginPath(); c.arc(p[0], p[1], R2, 0, 6.283); c.fill(); c.restore();
          c.strokeStyle = v === 1 ? 'rgba(100,116,139,.6)' : 'rgba(148,163,184,.4)'; c.lineWidth = 2; c.beginPath(); c.arc(p[0], p[1], R2 * 0.62, 0, 6.283); c.stroke();
          if (inMill(i)) { c.strokeStyle = '#facc15'; c.lineWidth = 2.5; c.beginPath(); c.arc(p[0], p[1], R2 + 3, 0, 6.283); c.stroke(); }
          if (i === sel) { c.strokeStyle = '#22c55e'; c.lineWidth = 3.5; c.beginPath(); c.arc(p[0], p[1], R2 + 5, 0, 6.283); c.stroke(); }
          if (targets[i] === 'r') { c.strokeStyle = 'rgba(239,68,68,' + (0.6 + 0.4 * Math.sin(t * 8)) + ')'; c.lineWidth = 4; c.beginPath(); c.arc(p[0], p[1], R2 + 4, 0, 6.283); c.stroke(); }
          if (last && last[1] === i) { c.fillStyle = '#f59e0b'; c.beginPath(); c.arc(p[0], p[1], 3.5, 0, 6.283); c.fill(); }
        }
        removedFx.forEach(function (f) { var p = ptXY(f.i), k = f.t / 0.5; c.globalAlpha = k; c.fillStyle = f.p === 1 ? '#fff' : '#1f2937'; c.beginPath(); c.arc(p[0], p[1] - (1 - k) * 30, cs * 0.3 * k, 0, 6.283); c.fill(); c.globalAlpha = 1; });
        // подсказка
        var tip;
        if (roundOver) tip = (api.mode === 1 ? api.t(roundOver === 1 ? 'g.p1win' : 'g.p2win') : roundOver === me() ? api.t('g.win') : api.t('g.lose')) + (endT || api.mode === 2 ? '' : ' · ' + api.t('g.tapContinue'));
        else if (api.mode === 0 && turn === 2) tip = 'Компьютер думает…';
        else if (api.mode === 2 && turn !== me()) tip = api.t('net.oppTurn');
        else tip = (api.mode === 1 ? nm[turn - 1] + ': ' : '') + (phase === 'remove' ? 'Мельница! Сними фишку соперника' : hand[turn - 1] > 0 ? 'Поставь фишку' : sel < 0 ? 'Выбери свою фишку' : canFly(turn) ? 'Фишки летают — выбери любую точку' : 'Куда пойти?');
        K.toast(c, W, H - 46, tip, 1);
      }
    };
  }
};
