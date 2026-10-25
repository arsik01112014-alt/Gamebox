/* Дуэль: жди сигнала «ОГОНЬ!» и жми быстрее соперника. Нажал раньше сигнала — фальстарт. До 5 побед */
window.GAMES = window.GAMES || {};
window.GAMES.duel = {
  title: 'Дуэль', desc: 'Кто быстрее нажмёт по сигналу', cat: 'arcade', isNew4: true, modes: true, lan: true, medals: [100, 250, 500],
  hint: 'Дождись надписи «ОГОНЬ!» и нажми как можно быстрее. Нажал раньше — фальстарт, раунд проигран. До 5 побед. Вдвоём на одном телефоне: верхняя половина экрана — игрок 2, нижняя — игрок 1.',
  d0: 'Медленный ковбой', d1: 'Обычный ковбой', d2: 'Быстрый ковбой', d3: 'Легенда Дикого Запада',
  colors: ['#c2410c', '#78350f'], controls: 'none', multiTouch: true,
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#fb923c"/><circle cx="50" cy="40" r="16" fill="#fde68a"/><rect x="6" y="66" width="88" height="28" fill="#92400e"/><path d="M14 66l6-22 6 22zM74 66l6-22 6 22z" fill="#1c1917"/><text x="50" y="58" font-size="12" font-weight="900" text-anchor="middle" fill="#7c2d12" font-family="system-ui">FIRE</text></svg>',
  create: function (api) {
    var CPU = [520, 400, 310, 250], K = window.GBK;
    var rdyT, wins, round, phase, phaseT, delay, times, netQ, endT, t, res, dust, sent;
    function names() { return api.mode === 1 ? [api.t('g.p1'), api.t('g.p2')] : api.mode === 2 ? [api.t('g.you'), api.t('net.opp')] : [api.t('g.you'), api.t('g.cpu')]; }
    function startRound(d) {
      phase = 'ready'; phaseT = 0; times = [null, null]; res = null; sent = false;
      delay = d != null ? d : 1.6 + Math.random() * 2.6;
    }
    function hostStart() { var d = 1.6 + Math.random() * 2.6; if (api.mode === 2) api.net.send({ k: 'go', r: round, d: d }); startRound(d); }
    function shot(p) {
      if (times[p] !== null) return;
      if (phase === 'wait' || phase === 'ready') { times[p] = -1; api.sound('hit'); api.vibrate(80); }
      else if (phase === 'fire') { times[p] = Math.round((phaseT) * 1000); api.sound('hit'); api.vibrate(30); }
      else return;
      if (api.mode === 2 && p === 0 && !sent) { sent = true; api.net.send({ k: 'shot', r: round, ms: times[0] }); }
    }
    function decide() {
      var a = times[0], b = times[1];
      if (a === -1 && b === -1) res = 0; else if (a === -1) res = 2; else if (b === -1) res = 1;
      else if (a === null && b === null) res = 0; else if (a === null) res = 2; else if (b === null) res = 1;
      else res = a < b ? 1 : b < a ? 2 : 0;
      if (res) wins[res - 1]++;
      if (api.mode === 0 && res === 1) api.addScore(Math.max(10, 600 - (a || 600)) * (api.diff + 1) / 4 | 0);
      api.sound(res === 1 || (api.mode === 1 && res) ? 'win' : res ? 'hit' : 'click');
      phase = 'result'; phaseT = 0; round++;
      if (wins[0] >= 5 || wins[1] >= 5) { if (api.mode === 0 && wins[0] >= 5) { api.addScore(150 * (api.diff + 1)); api.fx.confetti(50); } endT = 2.6; }
    }
    function cowboy(c, x, y, s, flip, col, down) {
      c.save(); c.translate(x, y); c.scale(flip ? -s : s, s);
      if (down) c.rotate(-1.3);
      c.fillStyle = '#1c1917';
      c.fillRect(-8, -40, 16, 34); // тело
      c.beginPath(); c.arc(0, -50, 9, 0, 6.283); c.fill(); // голова
      c.fillRect(-16, -60, 32, 4); c.fillRect(-9, -70, 18, 12); // шляпа
      c.fillRect(-8, -6, 6, 26); c.fillRect(2, -6, 6, 26); // ноги
      c.fillStyle = col; c.fillRect(-8, -36, 16, 4); // платок
      c.fillStyle = '#1c1917'; c.save(); c.translate(6, -34); c.rotate(phase === 'fire' || phase === 'result' ? -1.45 : 0.25); c.fillRect(0, -3, 22, 6); c.fillRect(18, -6, 12, 5); c.restore(); // рука с револьвером
      c.restore();
    }
    return {
      reset: function () { wins = [0, 0]; round = 0; netQ = []; endT = 0; t = 0; dust = []; rdyT = 0; if (api.mode === 2) { phase = 'sync'; phaseT = 0; times = [null, null]; } else hostStart(); },
      resize: function () { }, idle: function (dt) { t += dt || 0; }, key: function (k, down) { if (down) shot(0); },
      netMsg: function (d) { netQ.push(d); },
      input: function (type, d) {
        if (type !== 'press' || endT > 0) return;
        if (phase === 'result') { if (phaseT > 1 && api.mode !== 2) hostStart(); return; }
        if (api.mode === 1) shot(d.y < api.H / 2 ? 1 : 0); else shot(0);
      },
      update: function (dt) {
        t += dt; phaseT += dt;
        for (var q = dust.length - 1; q >= 0; q--) { dust[q].x += dust[q].v * dt; if (dust[q].x > api.W + 40) dust.splice(q, 1); }
        if (Math.random() < dt * 0.6) dust.push({ x: -40, y: api.H * (0.55 + Math.random() * 0.2), v: 40 + Math.random() * 60, r: 6 + Math.random() * 10 });
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (api.mode === 2) {
          for (var i = netQ.length - 1; i >= 0; i--) {
            var m = netQ[i];
            if (m.k === 'go' && m.r === round && (phase === 'sync' || phase === 'result')) { startRound(m.d); netQ.splice(i, 1); }
            else if (m.k === 'shot' && m.r === round && phase !== 'result' && phase !== 'sync') { times[1] = m.ms; netQ.splice(i, 1); }
            else if (m.r != null && m.r < round) netQ.splice(i, 1);
          }
          if (phase === 'sync') {
            if (api.net.side === 1) { rdyT -= dt; if (rdyT <= 0) { rdyT = 1; api.net.send({ k: 'rdy' }); } }
            else for (var j = 0; j < netQ.length; j++) if (netQ[j].k === 'rdy') { netQ.length = 0; hostStart(); break; }
          }
          if (phase === 'result' && phaseT > 2.2 && api.net.side === 0) hostStart();
        }
        if (phase === 'ready' && phaseT > 1.2) { phase = 'wait'; phaseT = 0; }
        else if (phase === 'wait' && phaseT > delay) { phase = 'fire'; phaseT = 0; api.sound('bonus'); api.vibrate(40); }
        if (api.mode === 0 && phase === 'fire' && times[1] === null && phaseT * 1000 > CPU[api.diff] + Math.random() * 6) times[1] = Math.round(phaseT * 1000);
        // раунд решён: оба выстрелили, кто-то сделал фальстарт или прошло 1,5 с после сигнала
        if ((phase === 'wait' || phase === 'fire' || phase === 'ready') && (times[0] === -1 || times[1] === -1 || (times[0] !== null && times[1] !== null) || (phase === 'fire' && phaseT > (api.mode === 2 ? 3 : 1.5)))) {
          if (api.mode === 2 && phase !== 'fire' && times[0] !== -1 && times[1] === -1) { decide(); return; }
          if (api.mode === 2 && times[0] !== -1 && times[1] === null && (phase !== 'fire' || phaseT < 3)) return; // ждём выстрел соперника
          decide();
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H, nm = names(), fire = phase === 'fire';
        var sky = c.createLinearGradient(0, 0, 0, H * 0.6); sky.addColorStop(0, fire ? '#7f1d1d' : '#fb923c'); sky.addColorStop(1, fire ? '#dc2626' : '#fde68a');
        c.fillStyle = sky; c.fillRect(0, 0, W, H * 0.62);
        c.fillStyle = 'rgba(255,247,237,.9)'; c.beginPath(); c.arc(W / 2, H * 0.5, Math.min(W, H) * 0.14, 0, 6.283); c.fill();
        c.fillStyle = '#9a3412'; c.beginPath(); c.moveTo(0, H * 0.58); c.lineTo(W * 0.2, H * 0.46); c.lineTo(W * 0.32, H * 0.54); c.lineTo(W * 0.5, H * 0.44); c.lineTo(W * 0.7, H * 0.55); c.lineTo(W * 0.85, H * 0.47); c.lineTo(W, H * 0.56); c.lineTo(W, H * 0.62); c.lineTo(0, H * 0.62); c.fill();
        var gg = c.createLinearGradient(0, H * 0.62, 0, H); gg.addColorStop(0, '#d97706'); gg.addColorStop(1, '#78350f'); c.fillStyle = gg; c.fillRect(0, H * 0.62, W, H);
        dust.forEach(function (d) { c.fillStyle = 'rgba(253,230,138,.25)'; c.beginPath(); c.arc(d.x, d.y, d.r, 0, 6.283); c.fill(); });
        // кактусы
        [[W * 0.08, 1], [W * 0.92, 0.8]].forEach(function (k) { c.fillStyle = '#365314'; c.fillRect(k[0] - 5 * k[1], H * 0.62 - 50 * k[1], 10 * k[1], 50 * k[1]); c.fillRect(k[0] - 16 * k[1], H * 0.62 - 38 * k[1], 8 * k[1], 18 * k[1]); c.fillRect(k[0] + 8 * k[1], H * 0.62 - 44 * k[1], 8 * k[1], 22 * k[1]); });
        var lost = phase === 'result' && res;
        cowboy(c, W * 0.22, H * 0.62 + 20, 1.5, false, '#2563eb', lost && res === 2);
        cowboy(c, W * 0.78, H * 0.62 + 20, 1.5, true, '#dc2626', lost && res === 1);
        if ((phase === 'fire' || phase === 'result') && phaseT < 0.15) { c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(0, 0, W, H); }
        c.textAlign = 'center'; c.textBaseline = 'middle';
        // счёт
        [0, 1].forEach(function (p) {
          var x = p ? W * 0.78 : W * 0.22;
          c.fillStyle = '#fff7ed'; c.font = '800 15px system-ui'; c.fillText(nm[p], x, 30);
          for (var s = 0; s < 5; s++) { c.fillStyle = s < wins[p] ? '#facc15' : 'rgba(0,0,0,.25)'; c.beginPath(); c.arc(x - 32 + s * 16, 52, 6, 0, 6.283); c.fill(); }
        });
        var big = phase === 'ready' ? 'Приготовься…' : phase === 'wait' ? 'Жди…' : phase === 'fire' ? 'ОГОНЬ!' : phase === 'sync' ? 'Ждём соперника…' : '';
        if (big) {
          c.save(); c.translate(W / 2, H * 0.22); var sc = fire ? 1 + Math.sin(t * 30) * 0.05 : 1; c.scale(sc, sc);
          c.fillStyle = fire ? '#fff' : '#7c2d12'; c.font = '900 ' + (fire ? 54 : 34) + 'px Georgia, serif'; c.fillText(big, 0, 0); c.restore();
        }
        if (phase === 'result') {
          function tt(v) { return v === -1 ? 'фальстарт' : v === null ? '—' : v + ' мс'; }
          K.rr(c, W / 2 - 140, H * 0.14, 280, 96, 18); c.fillStyle = 'rgba(28,25,23,.78)'; c.fill();
          var txt = !res ? 'Ничья' : api.mode === 1 ? (res === 1 ? 'Раунд игроку 1' : 'Раунд игроку 2') : res === 1 ? 'Ты быстрее!' : 'Соперник быстрее';
          if (endT > 0) txt = api.mode === 1 ? api.t(wins[0] >= 5 ? 'g.p1win' : 'g.p2win') : wins[0] >= 5 ? api.t('g.win') : api.t('g.lose');
          c.fillStyle = '#fde68a'; c.font = '900 22px system-ui'; c.fillText(txt, W / 2, H * 0.14 + 30);
          c.fillStyle = '#e7e5e4'; c.font = '700 14px system-ui'; c.fillText(nm[0] + ': ' + tt(times[0]) + '   ·   ' + nm[1] + ': ' + tt(times[1]), W / 2, H * 0.14 + 66);
        }
        if (api.mode === 1) {
          c.strokeStyle = 'rgba(255,255,255,.35)'; c.setLineDash([8, 8]); c.beginPath(); c.moveTo(0, H / 2); c.lineTo(W, H / 2); c.stroke(); c.setLineDash([]);
          c.save(); c.translate(W / 2, 92); c.rotate(Math.PI); c.fillStyle = 'rgba(255,255,255,.8)'; c.font = '800 14px system-ui'; c.fillText('Игрок 2 жмёт здесь', 0, 0); c.restore();
          c.fillStyle = 'rgba(255,255,255,.8)'; c.font = '800 14px system-ui'; c.fillText('Игрок 1 жмёт здесь', W / 2, H - 30);
        } else { c.fillStyle = 'rgba(255,255,255,.85)'; c.font = '800 14px system-ui'; c.fillText(phase === 'result' && api.mode !== 2 && !endT ? api.t('g.tapContinue') : 'Жми в любом месте экрана', W / 2, H - 30); }
      }
    };
  }
};
