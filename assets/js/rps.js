/* Камень, ножницы, бумага: до трёх побед. Вдвоём на одном телефоне выбор делается по очереди втайне */
window.GAMES = window.GAMES || {};
window.GAMES.rps = {
  title: 'Камень, ножницы, бумага', desc: 'Классика до трёх побед', cat: 'board', isNew4: true, modes: true, lan: true, medals: [100, 250, 500],
  hint: 'Выбери камень, ножницы или бумагу. Камень бьёт ножницы, ножницы режут бумагу, бумага накрывает камень. До трёх побед. Вдвоём на одном телефоне: первый выбирает, отдаёт телефон, потом выбирает второй.',
  d0: 'Компьютер выбирает случайно', d1: 'Обычный соперник', d2: 'Ищет закономерности', d3: 'Читает тебя как книгу',
  colors: ['#e11d48', '#7c3aed'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#fdf2f8"/><text x="30" y="46" font-size="30" text-anchor="middle">✊</text><text x="70" y="46" font-size="30" text-anchor="middle">✌️</text><text x="50" y="84" font-size="30" text-anchor="middle">✋</text></svg>',
  create: function (api) {
    var IC = ['✊', '✌️', '✋'], NM = ['Камень', 'Ножницы', 'Бумага'], K = window.GBK;
    var wins, round, picks, phase, phaseT, netQ, hist, endT, t, res, streak;
    function names() { return api.mode === 1 ? [api.t('g.p1'), api.t('g.p2')] : api.mode === 2 ? [api.t('g.you'), api.t('net.opp')] : [api.t('g.you'), api.t('g.cpu')]; }
    function beats(a, b) { return (a === 0 && b === 1) || (a === 1 && b === 2) || (a === 2 && b === 0); }
    function cpuPick() {
      if (api.diff === 0 || hist.length < 2) return Math.floor(Math.random() * 3);
      var cnt = [0, 0, 0], h = hist.slice(-(api.diff === 1 ? 3 : 6));
      if (api.diff >= 3 && hist.length >= 2) { // что игрок выбирает после своего прошлого хода
        var lastP = hist[hist.length - 1];
        for (var i = 1; i < hist.length; i++) if (hist[i - 1] === lastP) cnt[hist[i]] += 2;
      }
      h.forEach(function (x) { cnt[x]++; });
      var fav = cnt.indexOf(Math.max.apply(null, cnt));
      return Math.random() < (api.diff === 1 ? 0.45 : 0.7) ? (fav + 2) % 3 : Math.floor(Math.random() * 3); // то, что бьёт любимый ход
    }
    function newRound() { picks = [-1, -1]; phase = api.mode === 1 ? 'p1' : 'pick'; phaseT = 0; res = null; }
    function reveal() {
      phase = 'shake'; phaseT = 0; api.sound('click');
    }
    function judge() {
      var a = picks[0], b = picks[1];
      res = a === b ? 0 : beats(a, b) ? 1 : 2;
      if (res) wins[res - 1]++;
      var mine = res === 1 || (api.mode === 1 && res);
      api.sound(!res ? 'click' : mine ? 'win' : 'hit');
      if (api.mode === 0) { hist.push(a); if (res === 1) { streak++; api.addScore(20 * (api.diff + 1) * streak); } else if (res === 2) streak = 0; }
      phase = 'result'; phaseT = 0; round++;
      if (wins[0] >= 3 || wins[1] >= 3) { if (api.mode === 0 && wins[0] >= 3) { api.addScore(100 * (api.diff + 1)); api.fx.confetti(50); } endT = 2.4; }
    }
    function pick(k) {
      if (phase === 'pick') {
        picks[0] = k; api.sound('click'); api.vibrate(10);
        if (api.mode === 2) { api.net.send({ r: round, p: k }); phase = 'wait'; }
        else { picks[1] = cpuPick(); reveal(); }
      } else if (phase === 'p1') { picks[0] = k; phase = 'pass'; phaseT = 0; api.sound('click'); }
      else if (phase === 'p2') { picks[1] = k; reveal(); }
    }
    function btns() { var W = api.W, H = api.H, bw = Math.min(110, (W - 48) / 3); return [0, 1, 2].map(function (k) { return { k: k, x: W / 2 - bw * 1.5 - 8 + k * (bw + 8), y: H - bw - 70, w: bw, h: bw }; }); }
    return {
      reset: function () { wins = [0, 0]; round = 0; hist = []; netQ = []; endT = 0; t = 0; streak = 0; newRound(); },
      resize: function () { }, idle: function (dt) { t += dt || 0; }, key: function () { },
      netMsg: function (d) { netQ.push(d); },
      input: function (type, d) {
        if (type !== 'tap' || endT > 0) return;
        if (phase === 'pass') { phase = 'p2'; api.sound('click'); return; }
        if (phase === 'result' && phaseT > 0.8 && api.mode !== 2) { newRound(); return; }
        if (phase !== 'pick' && phase !== 'p1' && phase !== 'p2') return;
        btns().forEach(function (b) { if (d.x > b.x && d.x < b.x + b.w && d.y > b.y && d.y < b.y + b.h) pick(b.k); });
      },
      update: function (dt) {
        t += dt; phaseT += dt;
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (api.mode === 2) {
          for (var i = 0; i < netQ.length; i++) if (netQ[i].r === round) { picks[1] = netQ[i].p; netQ.splice(i, 1); break; }
          if (phase === 'wait' && picks[1] >= 0) reveal();
          if (phase === 'result' && phaseT > 2) newRound();
        }
        if (phase === 'shake' && phaseT > 1.5) judge();
      },
      draw: function (c) {
        var W = api.W, H = api.H, nm = names(), hide = phase === 'p2' || phase === 'pass';
        K.bg(c, W, H, '#2e1065', '#0f0a24', 'rgba(244,63,94,.16)');
        c.textAlign = 'center'; c.textBaseline = 'middle';
        // счёт
        [0, 1].forEach(function (p) {
          var x = p ? W * 0.75 : W * 0.25;
          c.fillStyle = '#e9d5ff'; c.font = '800 15px system-ui'; c.fillText(nm[p], x, 30);
          for (var s = 0; s < 3; s++) { c.fillStyle = s < wins[p] ? '#facc15' : 'rgba(255,255,255,.15)'; c.font = '20px system-ui'; c.fillText('★', x - 24 + s * 24, 56); }
        });
        c.fillStyle = '#a78bfa'; c.font = '900 22px system-ui'; c.fillText(':', W / 2, 44);
        // руки
        var cy = H * 0.36, sz = Math.min(110, W * 0.28);
        function hand(x, flip, k, shake) {
          c.save(); c.translate(x, cy + shake); if (flip) c.scale(-1, 1);
          c.font = sz + 'px system-ui'; c.fillText(k, 0, 0); c.restore();
        }
        if (phase === 'shake') {
          var sh = Math.abs(Math.sin(phaseT * 9)) * -40, word = ['Камень…', 'Ножницы…', 'Бумага…', 'Раз!'][Math.min(3, Math.floor(phaseT / 0.38))];
          hand(W * 0.25, false, '✊', sh); hand(W * 0.75, true, '✊', sh);
          c.fillStyle = '#fde68a'; c.font = '900 26px system-ui'; c.fillText(word, W / 2, cy + sz * 0.9);
        } else if (phase === 'result') {
          var k = Math.min(1, phaseT * 4);
          c.globalAlpha = k; hand(W * 0.25, false, IC[picks[0]], 0); hand(W * 0.75, true, IC[picks[1]], 0); c.globalAlpha = 1;
          c.fillStyle = '#c4b5fd'; c.font = '700 14px system-ui'; c.fillText(NM[picks[0]], W * 0.25, cy + sz * 0.7); c.fillText(NM[picks[1]], W * 0.75, cy + sz * 0.7);
          var txt = !res ? 'Ничья' : api.mode === 1 ? (res === 1 ? 'Очко игроку 1' : 'Очко игроку 2') : res === 1 ? 'Ты выиграл раунд!' : 'Раунд за соперником';
          if (endT > 0) txt = api.mode === 1 ? api.t(wins[0] >= 3 ? 'g.p1win' : 'g.p2win') : wins[0] >= 3 ? api.t('g.win') : api.t('g.lose');
          c.save(); c.translate(W / 2, cy + sz * 1.15); c.scale(0.8 + k * 0.2, 0.8 + k * 0.2);
          c.fillStyle = !res ? '#e2e8f0' : (res === 1 || api.mode === 1) ? '#86efac' : '#fca5a5'; c.font = '900 26px system-ui'; c.fillText(txt, 0, 0); c.restore();
          if (api.mode !== 2 && !endT && phaseT > 0.8) { c.fillStyle = '#a78bfa'; c.font = '700 13px system-ui'; c.fillText(api.t('g.tapContinue'), W / 2, cy + sz * 1.5); }
        } else if (phase === 'pass') {
          c.fillStyle = '#fde68a'; c.font = '900 22px system-ui'; c.fillText('Игрок 1 выбрал 🤫', W / 2, cy - 20);
          c.fillStyle = '#e9d5ff'; c.font = '700 16px system-ui'; c.fillText('Передай телефон игроку 2', W / 2, cy + 20); c.fillText('и нажми на экран', W / 2, cy + 44);
        } else if (phase === 'wait') {
          hand(W * 0.25, false, IC[picks[0]], 0);
          c.fillStyle = '#e9d5ff'; c.font = '800 16px system-ui'; c.fillText('Ждём выбор соперника' + '...'.slice(0, 1 + Math.floor(t * 2) % 3), W / 2, cy + sz);
        } else {
          c.fillStyle = '#f5f3ff'; c.font = '900 22px system-ui';
          c.fillText(phase === 'p1' ? 'Игрок 1, выбирай (второй не смотрит!)' : phase === 'p2' ? 'Игрок 2, выбирай' : 'Твой выбор?', W / 2, cy);
        }
        if (phase === 'pick' || phase === 'p1' || phase === 'p2') btns().forEach(function (b) {
          K.key(c, b.x, b.y, b.w, b.h, ['#be123c', '#6d28d9', '#0369a1'][b.k], null);
          c.font = Math.round(b.w * 0.45) + 'px system-ui'; c.fillText(IC[b.k], b.x + b.w / 2, b.y + b.h * 0.42);
          c.fillStyle = '#fff'; c.font = '800 13px system-ui'; c.fillText(NM[b.k], b.x + b.w / 2, b.y + b.h * 0.8);
        });
        if (hide && phase === 'p2') { c.fillStyle = '#a78bfa'; c.font = '700 13px system-ui'; c.fillText('Выбор игрока 1 скрыт', W / 2, H * 0.48); }
      }
    };
  }
};
