/* Математическая дуэль: один и тот же пример у обоих, кто первым выбрал верный ответ — получает очко. 10 примеров.
   По сети примеры одинаковые (общее зерно), а кто был первым, решает хост */
window.GAMES = window.GAMES || {};
window.GAMES.mathduel = {
  title: 'Математическая дуэль', desc: 'Кто быстрее решит пример', cat: 'puzzle', isNew4: true, modes: true, lan: true, medals: [60, 150, 300],
  hint: 'На экране пример и четыре ответа. Кто первым нажмёт верный — получает очко. Ошибся — до следующего примера ходить нельзя. 10 примеров. Вдвоём на одном телефоне: верхние кнопки — игрок 2, нижние — игрок 1.',
  d0: 'Сложение до 20', d1: 'Сложение и вычитание до 100', d2: 'Плюс умножение', d3: 'Все действия, большие числа',
  colors: ['#4f46e5', '#0891b2'], controls: 'none', multiTouch: true,
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#312e81"/><text x="50" y="46" font-size="22" font-weight="900" text-anchor="middle" fill="#fff" font-family="system-ui">7×8</text><g font-size="14" font-weight="800" text-anchor="middle" font-family="system-ui"><rect x="14" y="58" width="32" height="24" rx="6" fill="#22c55e"/><text x="30" y="75" fill="#fff">56</text><rect x="54" y="58" width="32" height="24" rx="6" fill="#6366f1"/><text x="70" y="75" fill="#fff">54</text></g></svg>',
  create: function (api) {
    var K = window.GBK, TOTAL = 10;
    var seed, qi, Q, scores, locked, phase, phaseT, netQ, endT, t, lastW, flash, rdyT, cpuAt, resolved, level;
    function names() { return api.mode === 1 ? [api.t('g.p1'), api.t('g.p2')] : api.mode === 2 ? [api.t('g.you'), api.t('net.opp')] : [api.t('g.you'), api.t('g.cpu')]; }
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
    function make() { // пример и 4 варианта
      var d = level, a, b, op, ans;
      var ops = d === 0 ? ['+'] : d === 1 ? ['+', '−'] : d === 2 ? ['+', '−', '×'] : ['+', '−', '×', '÷'];
      op = ops[ri(0, ops.length - 1)];
      if (op === '+') { a = ri(d ? 10 : 1, d ? (d === 3 ? 500 : 99) : 12); b = ri(1, d ? (d === 3 ? 500 : 99) : 9); ans = a + b; }
      else if (op === '−') { a = ri(10, d === 3 ? 500 : 99); b = ri(1, a); ans = a - b; }
      else if (op === '×') { a = ri(2, d === 3 ? 19 : 10); b = ri(2, 10); ans = a * b; }
      else { b = ri(2, 12); ans = ri(2, 15); a = b * ans; }
      var opts = [ans], guard = 0;
      while (opts.length < 4 && guard++ < 50) { var w = ans + (ri(0, 1) ? 1 : -1) * ri(1, Math.max(3, Math.round(Math.abs(ans) * 0.15))); if (w >= 0 && opts.indexOf(w) < 0) opts.push(w); }
      for (var i = opts.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), x = opts[i]; opts[i] = opts[j]; opts[j] = x; }
      return { text: a + ' ' + op + ' ' + b, ans: ans, opts: opts };
    }
    function startGame(s) { seed = s; qi = 0; scores = [0, 0]; next(); }
    function next() {
      if (qi >= TOTAL) { phase = 'end'; phaseT = 0; endT = 2.8; var mine = api.mode === 1 || scores[0] > scores[1]; api.sound(scores[0] === scores[1] ? 'click' : mine ? 'win' : 'hit'); if (api.mode === 0 && scores[0] > scores[1]) { api.addScore(80 * (api.diff + 1)); api.fx.confetti(50); } return; }
      Q = make(); qi++; locked = [false, false]; phase = 'q'; phaseT = 0; resolved = false; lastW = -1;
      cpuAt = [3.4, 2.6, 2.0, 1.5][api.diff] * (0.75 + Math.random() * 0.6);
    }
    // игрок p (0 — я/игрок 1, 1 — соперник/игрок 2) правильно ответил
    function win(p) {
      if (resolved) return; resolved = true; lastW = p; scores[p]++;
      if (api.mode === 0 && p === 0) api.addScore(Math.max(5, Math.round(30 - phaseT * 5)) * (api.diff + 1));
      api.sound(p === 0 || api.mode === 1 ? 'coin' : 'hit'); api.vibrate(20); phase = 'shown'; phaseT = 0;
    }
    function answer(p, k) {
      if (phase !== 'q' || locked[p]) return;
      if (Q.opts[k] === Q.ans) {
        if (api.mode === 2) {
          if (api.net.side === 0) { win(0); api.net.send({ k: 'w', q: qi, w: 1 }); } // для гостя победил «соперник» — хост
          else { api.net.send({ k: 'a', q: qi }); locked[0] = true; flash = { p: 0, k: k, ok: true, t: 0.4 }; }
          return;
        }
        flash = { p: p, k: k, ok: true, t: 0.4 }; win(p);
      } else { locked[p] = true; flash = { p: p, k: k, ok: false, t: 0.5 }; api.sound('hit'); api.vibrate(60); if (locked[0] && locked[1] && api.mode !== 2) { resolved = true; phase = 'shown'; phaseT = 0; } }
    }
    function boxes(p) { // кнопки ответов: p=0 снизу, p=1 сверху (в режиме вдвоём)
      var W = api.W, H = api.H, bw = (W - 36) / 2, bh = Math.min(64, H * 0.08), out = [];
      for (var k = 0; k < 4; k++) {
        var col = k % 2, row = (k / 2) | 0;
        out.push(p === 0 ? { x: 12 + col * (bw + 12), y: H - 2 * (bh + 10) - 16 + row * (bh + 10), w: bw, h: bh, k: k } : { x: 12 + col * (bw + 12), y: 16 + row * (bh + 10), w: bw, h: bh, k: k });
      }
      return out;
    }
    return {
      reset: function () {
        level = api.mode === 0 ? api.diff : 1; netQ = []; endT = 0; t = 0; rdyT = 0; flash = null; scores = [0, 0]; qi = 0;
        if (api.mode === 2) { phase = 'sync'; phaseT = 0; } else startGame(1 + Math.floor(Math.random() * 2147483000));
      },
      resize: function () { }, idle: function (dt) { t += dt || 0; }, key: function () { },
      netMsg: function (d) { netQ.push(d); },
      input: function (type, d) {
        if (type !== 'press' || endT > 0) return;
        var ps = api.mode === 1 ? [0, 1] : [0];
        ps.forEach(function (p) { boxes(p).forEach(function (b) { if (d.x > b.x && d.x < b.x + b.w && d.y > b.y && d.y < b.y + b.h) answer(p, b.k); }); });
      },
      update: function (dt) {
        t += dt; phaseT += dt; if (flash && (flash.t -= dt) <= 0) flash = null;
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (api.mode === 2) {
          if (phase === 'sync') {
            if (api.net.side === 1) { rdyT -= dt; if (rdyT <= 0) { rdyT = 1; api.net.send({ k: 'rdy' }); } }
          }
          while (netQ.length) {
            var m = netQ.shift();
            if (m.k === 'rdy' && api.net.side === 0 && phase === 'sync') { var s = 1 + Math.floor(Math.random() * 2147483000); api.net.send({ k: 'seed', s: s }); startGame(s); }
            else if (m.k === 'seed' && api.net.side === 1 && phase === 'sync') startGame(m.s);
            else if (m.k === 'a' && api.net.side === 0 && m.q === qi && !resolved) { win(1); api.net.send({ k: 'w', q: qi, w: 0 }); } // гость ответил первым
            else if (m.k === 'w' && api.net.side === 1 && m.q >= qi) { // гость всегда следует за хостом
              while (qi < m.q && phase !== 'end') next();
              if (!resolved) { if (m.w === -1) { resolved = true; phase = 'shown'; phaseT = 0; } else win(m.w === 0 ? 0 : 1); }
            }
          }
        }
        if (api.mode === 0 && phase === 'q' && phaseT > cpuAt && !locked[1]) { if (Math.random() < [0.7, 0.8, 0.88, 0.95][api.diff]) win(1); else locked[1] = true; }
        if (phase === 'q' && phaseT > 12 && !(api.mode === 2 && api.net.side === 1)) { resolved = true; phase = 'shown'; phaseT = 0; if (api.mode === 2) api.net.send({ k: 'w', q: qi, w: -1 }); }
        if (phase === 'shown' && phaseT > 1.2) next();
      },
      draw: function (c) {
        var W = api.W, H = api.H, nm = names(), two = api.mode === 1;
        K.bg(c, W, H, '#1e1b4b', '#0f172a', 'rgba(99,102,241,.2)');
        c.textAlign = 'center'; c.textBaseline = 'middle';
        if (phase === 'sync') { K.toast(c, W, H / 2, 'Ждём соперника…', 1); return; }
        var cy = H / 2;
        // счёт
        function score(p, y, rot) { c.save(); c.translate(W / 2, y); if (rot) c.rotate(Math.PI); c.fillStyle = p ? '#67e8f9' : '#a5b4fc'; c.font = '800 15px system-ui'; c.fillText(nm[p] + ': ' + scores[p], 0, 0); c.restore(); }
        if (two) { score(1, 16 + 2 * (Math.min(64, H * 0.08) + 10) + 18, true); score(0, H - 2 * (Math.min(64, H * 0.08) + 10) - 34, false); }
        else { c.fillStyle = '#c7d2fe'; c.font = '800 16px system-ui'; c.fillText(nm[0] + '  ' + scores[0] + ' : ' + scores[1] + '  ' + nm[1], W / 2, 30); }
        c.fillStyle = '#818cf8'; c.font = '700 13px system-ui'; c.fillText('Пример ' + Math.min(qi, TOTAL) + ' из ' + TOTAL, W / 2, cy - 70);
        if (phase === 'end') {
          var txt = scores[0] === scores[1] ? api.t('g.draw') : two ? api.t(scores[0] > scores[1] ? 'g.p1win' : 'g.p2win') : scores[0] > scores[1] ? api.t('g.win') : api.t('g.lose');
          c.fillStyle = '#fde68a'; c.font = '900 30px system-ui'; c.fillText(txt, W / 2, cy); return;
        }
        // пример (в режиме вдвоём — два раза: для каждого игрока своей стороной)
        function ex(y, rot) {
          c.save(); c.translate(W / 2, y); if (rot) c.rotate(Math.PI);
          K.rr(c, -W * 0.4, -38, W * 0.8, 76, 22); c.fillStyle = 'rgba(15,23,42,.75)'; c.fill(); c.strokeStyle = '#6366f1'; c.lineWidth = 2; c.stroke();
          c.fillStyle = '#fff'; c.font = '900 40px system-ui'; c.fillText(Q.text + ' = ' + (phase === 'shown' ? Q.ans : '?'), 0, 2); c.restore();
        }
        if (two) { ex(cy - 48, true); ex(cy + 48, false); } else ex(cy, false);
        if (phase === 'shown') { var who = lastW < 0 ? 'Никто не успел' : two ? (lastW ? 'Очко игроку 2' : 'Очко игроку 1') : lastW === 0 ? 'Ты первый! +1' : 'Соперник быстрее'; K.toast(c, W, two ? cy : cy + 70, who, 1); }
        (two ? [0, 1] : [0]).forEach(function (p) {
          boxes(p).forEach(function (b) {
            var col = '#4338ca';
            if (phase === 'shown' && Q.opts[b.k] === Q.ans) col = '#16a34a';
            else if (flash && flash.p === p && flash.k === b.k) col = flash.ok ? '#16a34a' : '#b91c1c';
            else if (locked[p]) col = '#334155';
            c.save(); if (p === 1) { c.translate(b.x + b.w / 2, b.y + b.h / 2); c.rotate(Math.PI); c.translate(-(b.x + b.w / 2), -(b.y + b.h / 2)); }
            K.key(c, b.x, b.y, b.w, b.h, col, String(Q.opts[b.k]), '900 24px system-ui'); c.restore();
          });
        });
      }
    };
  }
};
