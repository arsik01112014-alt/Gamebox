/* 4 в ряд: против компьютера, вдвоём и по сети */
window.GAMES = window.GAMES || {};
window.GAMES.connect4 = {
  title: '4 в ряд',
  desc: 'Собери четыре фишки в линию',
  hint: 'Тапни по столбцу — фишка упадёт вниз. Собери 4 своих фишки в ряд по горизонтали, вертикали или диагонали. Против компьютера: победы подряд копят очки, проигрыш — конец игры.',
  d0: 'Компьютер ошибается', d1: 'Думает на 3 хода', d2: 'Думает на 5 ходов', d3: 'Почти без ошибок',
  colors: ['#2563eb', '#eab308'],
  controls: 'none',
  modes: true,
  lan: true,
  isNew2: true,
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="c4b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset=".5" stop-co' +
    'lor="#2563eb"/><stop offset="1" stop-color="#1e3a8a"/></linearGradient><linearGradient id="c4h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-colo' +
    'r="#0b1a5c"/><stop offset="1" stop-color="#bfdbfe"/></linearGradient><radialGradient id="c4r" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fe' +
    'e2e2"/><stop offset=".45" stop-color="#ef4444"/><stop offset="1" stop-color="#7f1d1d"/></radialGradient><radialGradient id="c4y" cx=".35" cy=".3" r=".' +
    '8"><stop offset="0" stop-color="#fef9c3"/><stop offset=".45" stop-color="#facc15"/><stop offset="1" stop-color="#854d0e"/></radialGradient></defs><pat' +
    'h d="M14 84l-4 10h14l-2-10zM78 84l-2 10h14l-4-10z" fill="#1e3a8a"/><rect x="8" y="12" width="84" height="76" rx="11" fill="url(#c4b)"/><rect x="9" y="' +
    '13" width="82" height="74" rx="10" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1"/><circle cx="22.0" cy="27.0" r="7" fill="#0b1440"/><circ' +
    'le cx="22.0" cy="27.0" r="7.6" fill="none" stroke="url(#c4h)" stroke-width="1.4"/><circle cx="40.7" cy="27.0" r="7" fill="#0b1440"/><circle cx="40.7" ' +
    'cy="27.0" r="7.6" fill="none" stroke="url(#c4h)" stroke-width="1.4"/><circle cx="59.4" cy="27.0" r="7" fill="#0b1440"/><circle cx="59.4" cy="27.0" r="' +
    '7.6" fill="none" stroke="url(#c4h)" stroke-width="1.4"/><circle cx="78.1" cy="27.0" r="7" fill="#0b1440"/><circle cx="78.1" cy="27.0" r="7.6" fill="no' +
    'ne" stroke="url(#c4h)" stroke-width="1.4"/><circle cx="22.0" cy="44.0" r="7" fill="#0b1440"/><circle cx="22.0" cy="44.0" r="7.6" fill="none" stroke="u' +
    'rl(#c4h)" stroke-width="1.4"/><circle cx="40.7" cy="44.0" r="7" fill="url(#c4y)" stroke="rgba(0,0,0,.35)"/><circle cx="40.7" cy="44.0" r="4.4" fill="n' +
    'one" stroke="rgba(0,0,0,.18)"/><circle cx="40.7" cy="44.0" r="7.6" fill="none" stroke="url(#c4h)" stroke-width="1.4"/><circle cx="59.4" cy="44.0" r="7' +
    '" fill="url(#c4y)" stroke="rgba(0,0,0,.35)"/><circle cx="59.4" cy="44.0" r="4.4" fill="none" stroke="rgba(0,0,0,.18)"/><circle cx="59.4" cy="44.0" r="' +
    '7.6" fill="none" stroke="url(#c4h)" stroke-width="1.4"/><circle cx="78.1" cy="44.0" r="7" fill="#0b1440"/><circle cx="78.1" cy="44.0" r="7.6" fill="no' +
    'ne" stroke="url(#c4h)" stroke-width="1.4"/><circle cx="22.0" cy="61.0" r="7" fill="url(#c4r)" stroke="rgba(0,0,0,.35)"/><circle cx="22.0" cy="61.0" r=' +
    '"4.4" fill="none" stroke="rgba(0,0,0,.18)"/><circle cx="22.0" cy="61.0" r="7.6" fill="none" stroke="url(#c4h)" stroke-width="1.4"/><circle cx="40.7" c' +
    'y="61.0" r="7" fill="url(#c4r)" stroke="rgba(0,0,0,.35)"/><circle cx="40.7" cy="61.0" r="4.4" fill="none" stroke="rgba(0,0,0,.18)"/><circle cx="40.7" ' +
    'cy="61.0" r="7.6" fill="none" stroke="url(#c4h)" stroke-width="1.4"/><circle cx="59.4" cy="61.0" r="7" fill="url(#c4r)" stroke="rgba(0,0,0,.35)"/><cir' +
    'cle cx="59.4" cy="61.0" r="4.4" fill="none" stroke="rgba(0,0,0,.18)"/><circle cx="59.4" cy="61.0" r="7.6" fill="none" stroke="url(#c4h)" stroke-width=' +
    '"1.4"/><circle cx="78.1" cy="61.0" r="7" fill="url(#c4y)" stroke="rgba(0,0,0,.35)"/><circle cx="78.1" cy="61.0" r="4.4" fill="none" stroke="rgba(0,0,0' +
    ',.18)"/><circle cx="78.1" cy="61.0" r="7.6" fill="none" stroke="url(#c4h)" stroke-width="1.4"/><circle cx="22.0" cy="78.0" r="7" fill="url(#c4y)" stro' +
    'ke="rgba(0,0,0,.35)"/><circle cx="22.0" cy="78.0" r="4.4" fill="none" stroke="rgba(0,0,0,.18)"/><circle cx="22.0" cy="78.0" r="7.6" fill="none" stroke' +
    '="url(#c4h)" stroke-width="1.4"/><circle cx="40.7" cy="78.0" r="7" fill="url(#c4r)" stroke="rgba(0,0,0,.35)"/><circle cx="40.7" cy="78.0" r="4.4" fill' +
    '="none" stroke="rgba(0,0,0,.18)"/><circle cx="40.7" cy="78.0" r="7.6" fill="none" stroke="url(#c4h)" stroke-width="1.4"/><circle cx="59.4" cy="78.0" r' +
    '="7" fill="url(#c4r)" stroke="rgba(0,0,0,.35)"/><circle cx="59.4" cy="78.0" r="4.4" fill="none" stroke="rgba(0,0,0,.18)"/><circle cx="59.4" cy="78.0" ' +
    'r="7.6" fill="none" stroke="url(#c4h)" stroke-width="1.4"/><circle cx="78.1" cy="78.0" r="7" fill="url(#c4y)" stroke="rgba(0,0,0,.35)"/><circle cx="78' +
    '.1" cy="78.0" r="4.4" fill="none" stroke="rgba(0,0,0,.18)"/><circle cx="78.1" cy="78.0" r="7.6" fill="none" stroke="url(#c4h)" stroke-width="1.4"/><pa' +
    'th d="M12 22q38-12 76 0" stroke="rgba(255,255,255,.25)" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',

  create: function (api) {
    var C = 7, R = 6, P1 = 1, P2 = 2;
    var board, falls, turn, starter, wins, line, phase, phaseT, cs, bx, by, t, thinkT, endT, netQ, hover, moves;
    var COL = { 1: ['#ef4444', '#fca5a5'], 2: ['#facc15', '#fef08a'] };

    function layout() {
      cs = Math.min((api.W - 40) / C, (api.H - 200) / R);
      bx = (api.W - cs * C) / 2; by = 120 + Math.max(0, (api.H - 160 - cs * R) / 2);
      build();
    }
    function drop(b, c) { for (var r = R - 1; r >= 0; r--) if (!b[r * C + c]) return r; return -1; }
    function winLine(b) {
      var D = [[0, 1], [1, 0], [1, 1], [1, -1]];
      for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) {
        var v = b[r * C + c]; if (!v) continue;
        for (var k = 0; k < 4; k++) {
          var ok = true, cells = [r * C + c];
          for (var i = 1; i < 4; i++) {
            var rr = r + D[k][0] * i, cc = c + D[k][1] * i;
            if (rr < 0 || rr >= R || cc < 0 || cc >= C || b[rr * C + cc] !== v) { ok = false; break; }
            cells.push(rr * C + cc);
          }
          if (ok) return { v: v, l: cells };
        }
      }
      return null;
    }
    function full(b) { for (var c = 0; c < C; c++) if (!b[c]) return false; return true; }
    // оценка позиции для компьютера
    function evalWin(w, me) {
      var m = 0, o = 0, e = 0;
      for (var i = 0; i < 4; i++) if (w[i] === me) m++; else if (w[i]) o++; else e++;
      if (m === 4) return 100000; if (o === 4) return -100000;
      if (m === 3 && e === 1) return 50; if (m === 2 && e === 2) return 8;
      if (o === 3 && e === 1) return -60; if (o === 2 && e === 2) return -6;
      return 0;
    }
    function score(b, me) {
      var s = 0, r, c;
      for (r = 0; r < R; r++) if (b[r * C + 3] === me) s += 6; else if (b[r * C + 3]) s -= 6;
      for (r = 0; r < R; r++) for (c = 0; c < C; c++) {
        if (c + 3 < C) s += evalWin([b[r * C + c], b[r * C + c + 1], b[r * C + c + 2], b[r * C + c + 3]], me);
        if (r + 3 < R) s += evalWin([b[r * C + c], b[(r + 1) * C + c], b[(r + 2) * C + c], b[(r + 3) * C + c]], me);
        if (r + 3 < R && c + 3 < C) s += evalWin([b[r * C + c], b[(r + 1) * C + c + 1], b[(r + 2) * C + c + 2], b[(r + 3) * C + c + 3]], me);
        if (r + 3 < R && c - 3 >= 0) s += evalWin([b[r * C + c], b[(r + 1) * C + c - 1], b[(r + 2) * C + c - 2], b[(r + 3) * C + c - 3]], me);
      }
      return s;
    }
    var ORDER = [3, 2, 4, 1, 5, 0, 6];
    function negamax(b, depth, a, beta, me) {
      var w = winLine(b);
      if (w) return w.v === me ? 100000 + depth : -100000 - depth;
      if (full(b)) return 0;
      if (depth === 0) return score(b, me);
      var op = me === P1 ? P2 : P1, best = -1e9;
      for (var i = 0; i < C; i++) {
        var c = ORDER[i], r = drop(b, c); if (r < 0) continue;
        b[r * C + c] = me;
        var v = -negamax(b, depth - 1, -beta, -a, op);
        b[r * C + c] = 0;
        if (v > best) best = v;
        if (best > a) a = best;
        if (a >= beta) break;
      }
      return best;
    }
    function aiMove() {
      var depth = [1, 3, 5, 6][api.diff], b = board.slice(), best = -1e9, cands = [];
      // быстрые проверки: выиграть или не дать выиграть
      for (var c = 0; c < C; c++) {
        var r = drop(b, c); if (r < 0) continue;
        b[r * C + c] = P2; if (winLine(b)) { b[r * C + c] = 0; return play(c); } b[r * C + c] = 0;
      }
      if (api.diff >= 1 || Math.random() < 0.5) {
        for (var c2 = 0; c2 < C; c2++) {
          var r2 = drop(b, c2); if (r2 < 0) continue;
          b[r2 * C + c2] = P1; var w = winLine(b); b[r2 * C + c2] = 0; if (w) return play(c2);
        }
      }
      for (var i = 0; i < C; i++) {
        var cc = ORDER[i], rr = drop(b, cc); if (rr < 0) continue;
        b[rr * C + cc] = P2;
        var v = -negamax(b, depth - 1, -1e9, 1e9, P1) + (api.diff === 0 ? Math.random() * 120 : Math.random() * 2);
        b[rr * C + cc] = 0;
        if (v > best) { best = v; cands = [cc]; }
      }
      play(cands[0]);
    }
    function mySide() { return api.net && api.net.side === 1 ? P2 : P1; }
    function play(c, remote) {
      var r = drop(board, c); if (r < 0) return false;
      if (api.mode === 2 && !remote) api.net.send({ c: c });
      board[r * C + c] = turn; moves++;
      falls.push({ i: r * C + c, y: -1, v: 0, tr: r });
      api.tone(turn === P1 ? 330 : 440, 0.07, 'triangle', 0.07); api.vibrate(10);
      var w = winLine(board);
      if (w) {
        line = w.l; phase = 'roundEnd'; phaseT = 0;
        if (api.mode === 0) {
          if (w.v === P1) { wins[0]++; api.addScore(300 * (api.diff + 1) + Math.max(0, 30 - moves) * 10 * (api.diff + 1)); api.sound('win'); api.fx.confetti(50); }
          else { wins[1]++; api.sound('hit'); api.vibrate(150); endT = 2; }
        } else {
          wins[w.v - 1]++;
          api.sound(api.mode === 2 && w.v !== mySide() ? 'hit' : 'win');
          if (api.mode !== 2 || w.v === mySide()) api.fx.confetti(40);
          if (wins[w.v - 1] >= 3) endT = 2;
        }
        return true;
      }
      if (full(board)) { wins[2]++; phase = 'roundEnd'; phaseT = 0; line = null; if (api.mode === 0) api.addScore(100 * (api.diff + 1)); api.sound('point'); return true; }
      turn = turn === P1 ? P2 : P1;
      if (api.mode === 0 && turn === P2) thinkT = 0.5 + Math.random() * 0.3;
      return true;
    }
    function newBoard() {
      board = []; for (var i = 0; i < C * R; i++) board.push(0);
      falls = []; line = null; phase = 'play'; phaseT = 0; moves = 0;
      turn = starter; starter = starter === P1 ? P2 : P1;
      if (api.mode === 0 && turn === P2) thinkT = 0.7;
    }
    // ---------- графика ----------
    var dpr = 1, bgL = null, boardL = null, spr = {}, glowS = null, sprS = 0, lw = 0, lh = 0;
    var COL3 = { 1: ['#fee2e2', '#ef4444', '#7f1d1d'], 2: ['#fef9c3', '#facc15', '#854d0e'] };
    function mkC(w, h) {
      var o = document.createElement('canvas');
      o.width = Math.max(1, Math.ceil(w * dpr)); o.height = Math.max(1, Math.ceil(h * dpr));
      var x = o.getContext('2d'); x.scale(dpr, dpr); return o;
    }
    function rr(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }
    function makeDisc(v, S) {
      var o = mkC(S, S), c = o.getContext('2d'), m = S / 2, r = S * 0.385, col = COL3[v];
      var g = c.createRadialGradient(m - r * 0.35, m - r * 0.4, r * 0.05, m, m, r);
      g.addColorStop(0, col[0]); g.addColorStop(0.45, col[1]); g.addColorStop(1, col[2]);
      c.fillStyle = g; c.beginPath(); c.arc(m, m, r, 0, 6.283); c.fill();
      // рифлёный обод
      c.lineWidth = Math.max(1, S * 0.022); c.lineCap = 'round';
      for (var i = 0; i < 40; i++) {
        var a = i / 40 * 6.283, ca = Math.cos(a), sa = Math.sin(a);
        c.strokeStyle = i % 2 ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.22)';
        c.beginPath(); c.moveTo(m + ca * r * 0.8, m + sa * r * 0.8); c.lineTo(m + ca * r * 0.96, m + sa * r * 0.96); c.stroke();
      }
      // утопленная середина
      var g2 = c.createLinearGradient(m - r, m - r, m + r, m + r);
      g2.addColorStop(0, col[2]); g2.addColorStop(0.5, col[1]); g2.addColorStop(1, col[0]);
      c.fillStyle = g2; c.beginPath(); c.arc(m, m, r * 0.74, 0, 6.283); c.fill();
      var g3 = c.createRadialGradient(m - r * 0.2, m - r * 0.2, r * 0.05, m, m, r * 0.64);
      g3.addColorStop(0, col[0]); g3.addColorStop(0.6, col[1]); g3.addColorStop(1, col[2]);
      c.fillStyle = g3; c.beginPath(); c.arc(m, m, r * 0.64, 0, 6.283); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = Math.max(1, S * 0.012);
      c.beginPath(); c.arc(m, m, r * 0.74, 0, 6.283); c.stroke();
      c.beginPath(); c.arc(m, m, r, 0, 6.283); c.stroke();
      // блик
      c.save(); c.translate(m - r * 0.38, m - r * 0.42); c.rotate(-0.7);
      var g4 = c.createRadialGradient(0, 0, 0, 0, 0, r * 0.4);
      g4.addColorStop(0, 'rgba(255,255,255,.75)'); g4.addColorStop(1, 'rgba(255,255,255,0)');
      c.scale(1, 0.45); c.fillStyle = g4; c.beginPath(); c.arc(0, 0, r * 0.4, 0, 6.283); c.fill(); c.restore();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(m + r * 0.42, m + r * 0.46, r * 0.06, 0, 6.283); c.fill();
      return o;
    }
    function build() {
      var W = api.W, H = api.H;
      dpr = Math.min(2, window.devicePixelRatio || 1); lw = W; lh = H;
      var bw = cs * C, bh = cs * R, i, r, cc, x, y;
      // фон
      bgL = mkC(W, H); var c = bgL.getContext('2d');
      var g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0a1038'); g.addColorStop(0.5, '#142266'); g.addColorStop(1, '#070b2a');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      g = c.createRadialGradient(W / 2, by, 10, W / 2, by, W * 0.9);
      g.addColorStop(0, 'rgba(96,165,250,.28)'); g.addColorStop(1, 'rgba(96,165,250,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,.035)';
      for (y = 8; y < H; y += 18) for (x = (y / 18 % 2) * 9 + 4; x < W; x += 18) { c.beginPath(); c.arc(x, y, 1.1, 0, 6.283); c.fill(); }
      // пол и тень от доски
      var fy = by + bh + 22;
      g = c.createLinearGradient(0, fy - 10, 0, H);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.35)');
      c.fillStyle = g; c.fillRect(0, fy - 10, W, H - fy + 10);
      c.save(); c.translate(W / 2, fy + 4); c.scale(1, 0.12);
      g = c.createRadialGradient(0, 0, 0, 0, 0, bw * 0.62);
      g.addColorStop(0, 'rgba(0,0,0,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, bw * 0.62, 0, 6.283); c.fill(); c.restore();
      g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // задняя стенка за лунками
      g = c.createLinearGradient(0, by, 0, by + bh);
      g.addColorStop(0, 'rgba(4,8,36,.82)'); g.addColorStop(1, 'rgba(10,20,70,.72)');
      c.fillStyle = g; rr(c, bx - 4, by - 4, bw + 8, bh + 8, 12); c.fill();

      // доска
      boardL = mkC(W, H); c = boardL.getContext('2d');
      // ножки
      [bx - 6, bx + bw - 22].forEach(function (lx) {
        var lg = c.createLinearGradient(lx, 0, lx + 28, 0);
        lg.addColorStop(0, '#1e3a8a'); lg.addColorStop(0.5, '#3b82f6'); lg.addColorStop(1, '#1e3a8a');
        c.fillStyle = lg; c.beginPath(); c.moveTo(lx + 4, by + bh); c.lineTo(lx + 24, by + bh); c.lineTo(lx + 28, fy + 4); c.lineTo(lx, fy + 4); c.closePath(); c.fill();
      });
      c.save();
      c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 22; c.shadowOffsetY = 10;
      g = c.createLinearGradient(0, by - 12, 0, by + bh + 12);
      g.addColorStop(0, '#60a5fa'); g.addColorStop(0.12, '#3b82f6'); g.addColorStop(0.7, '#2563eb'); g.addColorStop(1, '#1e3a8a');
      c.fillStyle = g; rr(c, bx - 12, by - 12, bw + 24, bh + 24, 20); c.fill();
      c.restore();
      // глянец сверху
      c.save(); rr(c, bx - 12, by - 12, bw + 24, bh + 24, 20); c.clip();
      g = c.createLinearGradient(0, by - 12, 0, by + bh * 0.5);
      g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(bx - 12, by - 12, bw + 24, bh * 0.5 + 12);
      g = c.createLinearGradient(bx - 12, 0, bx + bw + 12, 0);
      g.addColorStop(0, 'rgba(0,0,0,.18)'); g.addColorStop(0.08, 'rgba(0,0,0,0)'); g.addColorStop(0.92, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.22)');
      c.fillStyle = g; c.fillRect(bx - 12, by - 12, bw + 24, bh + 24);
      c.restore();
      // вырезы
      c.globalCompositeOperation = 'destination-out'; c.beginPath();
      for (r = 0; r < R; r++) for (cc = 0; cc < C; cc++) { x = bx + (cc + 0.5) * cs; y = by + (r + 0.5) * cs; c.moveTo(x + cs * 0.4, y); c.arc(x, y, cs * 0.4, 0, 6.283); }
      c.fill(); c.globalCompositeOperation = 'source-over';
      for (r = 0; r < R; r++) for (cc = 0; cc < C; cc++) {
        x = bx + (cc + 0.5) * cs; y = by + (r + 0.5) * cs;
        // фаска вокруг лунки
        g = c.createLinearGradient(x, y - cs * 0.45, x, y + cs * 0.45);
        g.addColorStop(0, 'rgba(8,20,80,.6)'); g.addColorStop(0.5, 'rgba(30,64,175,.1)'); g.addColorStop(1, 'rgba(191,219,254,.55)');
        c.strokeStyle = g; c.lineWidth = cs * 0.06; c.beginPath(); c.arc(x, y, cs * 0.43, 0, 6.283); c.stroke();
        // тень на фишке от края лунки
        c.save(); c.beginPath(); c.arc(x, y, cs * 0.4, 0, 6.283); c.clip();
        g = c.createRadialGradient(x + cs * 0.04, y + cs * 0.07, cs * 0.26, x, y, cs * 0.42);
        g.addColorStop(0, 'rgba(0,0,20,0)'); g.addColorStop(1, 'rgba(0,0,20,.55)');
        c.fillStyle = g; c.fillRect(x - cs * 0.5, y - cs * 0.5, cs, cs); c.restore();
      }
      // кромка
      g = c.createLinearGradient(0, by - 12, 0, by + bh + 12);
      g.addColorStop(0, 'rgba(255,255,255,.65)'); g.addColorStop(0.5, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(0,0,30,.5)');
      c.strokeStyle = g; c.lineWidth = 2; rr(c, bx - 11, by - 11, bw + 22, bh + 22, 19); c.stroke();
      // винты по углам
      [[bx - 4, by - 4], [bx + bw + 4, by - 4], [bx - 4, by + bh + 4], [bx + bw + 4, by + bh + 4]].forEach(function (p) {
        var sg = c.createRadialGradient(p[0] - 1, p[1] - 1, 0.3, p[0], p[1], 3.2);
        sg.addColorStop(0, '#e0f2fe'); sg.addColorStop(1, '#1e3a8a');
        c.fillStyle = sg; c.beginPath(); c.arc(p[0], p[1], 3, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(15,23,42,.6)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(p[0] - 2, p[1] + 1); c.lineTo(p[0] + 2, p[1] - 1); c.stroke();
      });
      // спрайты фишек
      sprS = Math.max(48, Math.ceil(cs));
      spr[1] = makeDisc(1, sprS); spr[2] = makeDisc(2, sprS);
      glowS = mkC(sprS * 1.6, sprS * 1.6); c = glowS.getContext('2d');
      g = c.createRadialGradient(sprS * 0.8, sprS * 0.8, 0, sprS * 0.8, sprS * 0.8, sprS * 0.8);
      g.addColorStop(0, 'rgba(255,255,220,.9)'); g.addColorStop(0.4, 'rgba(255,240,180,.35)'); g.addColorStop(1, 'rgba(255,240,180,0)');
      c.fillStyle = g; c.fillRect(0, 0, sprS * 1.6, sprS * 1.6);
    }
    function disc(c, x, y, s, v, sx, sy) {
      if (!spr[v]) return;
      sx = sx || 1; sy = sy || 1;
      c.drawImage(spr[v], x - s * sx / 2, y - s * sy / 2, s * sx, s * sy);
    }

    return {
      reset: function () {
        wins = [0, 0, 0]; starter = P1; netQ = []; t = 0; thinkT = 0; endT = 0; hover = -1;
        if (api.mode === 2 && api.net) starter = P1;
        layout(); newBoard();
      },
      resize: layout,
      netMsg: function (d) { netQ.push(d); },
      idle: function (dt) { t += dt; },
      input: function (type, d) {
        if (endT > 0) return;
        if (type === 'move' || type === 'down') { var hc = Math.floor((d.x - bx) / cs); hover = hc >= 0 && hc < C ? hc : -1; }
        if (type !== 'tap') return;
        if (phase === 'roundEnd') { if (phaseT > 0.8 && api.mode === 1) newBoard(); return; }
        if (api.mode === 0 && turn === P2) return;
        if (api.mode === 2 && turn !== mySide()) return;
        var c = Math.floor((d.x - bx) / cs);
        if (c < 0 || c >= C) return;
        play(c); hover = -1;
      },
      key: function (k, down) {
        if (!down || endT > 0) return;
        if (k === 'left') hover = Math.max(0, (hover < 0 ? 3 : hover) - 1);
        else if (k === 'right') hover = Math.min(C - 1, (hover < 0 ? 3 : hover) + 1);
        else if ((k === 'a' || k === 'down') && hover >= 0 && phase === 'play' && !(api.mode === 0 && turn === P2) && !(api.mode === 2 && turn !== mySide())) play(hover);
      },
      update: function (dt) {
        t += dt; phaseT += dt;
        falls.forEach(function (f) {
          if (f.sq > 0) f.sq -= dt;
          if (f.y >= f.tr) return;
          f.v += 40 * dt; f.y += f.v * dt;
          if (f.y >= f.tr) { f.y = f.tr; if (f.v > 6) { f.sq = 0.16; if (api.quality > 0 && f.v > 12) api.fx.burst(bx + (f.i % C + 0.5) * cs, by + (f.tr + 0.88) * cs, COL3[board[f.i]][0], 5, 60, 1.6); } if (f.v > 4) { f.v = -f.v * 0.25; f.y = f.tr - 0.001; } }
        });
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (phase === 'play' && api.mode === 0 && turn === P2) { thinkT -= dt; if (thinkT <= 0) aiMove(); }
        if (phase === 'play' && api.mode === 2 && turn !== mySide() && netQ.length) { var nd = netQ.shift(); if (nd.c >= 0 && nd.c < C) play(nd.c, true); }
        if (phase === 'roundEnd' && phaseT > 2 && api.mode !== 1 && !endT) newBoard();
      },
      draw: function (c) {
        var W = api.W, H = api.H, q = api.quality;
        if (!bgL || lw !== W || lh !== H) { layout(); }
        c.drawImage(bgL, 0, 0, W, H);
        // табло
        var two = api.mode === 1;
        var names = two ? [api.t('g.p1'), api.t('g.p2')] : api.mode === 2 ? (mySide() === P1 ? [api.t('g.you'), api.t('net.opp')] : [api.t('net.opp'), api.t('g.you')]) : [api.t('g.you'), api.t('g.cpu')];
        c.textAlign = 'center'; c.textBaseline = 'middle';
        [[0, W * 0.22], [1, W * 0.78]].forEach(function (z) {
          var act = phase === 'play' && turn === z[0] + 1, px = z[1] - 70, ac = COL3[z[0] + 1][1];
          var pg = c.createLinearGradient(0, 14, 0, 90);
          pg.addColorStop(0, act ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.08)'); pg.addColorStop(1, act ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.02)');
          c.fillStyle = pg; rr(c, px, 14, 140, 76, 18); c.fill();
          if (act) {
            c.strokeStyle = ac; c.globalAlpha = 0.35 + 0.25 * Math.sin(t * 5); c.lineWidth = 6; c.stroke();
            c.globalAlpha = 1; c.lineWidth = 2; c.stroke();
          } else { c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 1; c.stroke(); }
          disc(c, z[1] - 38, 42 + (act ? Math.sin(t * 4) * 2 : 0), 46, z[0] + 1);
          c.fillStyle = 'rgba(0,0,0,.35)'; c.font = '900 30px system-ui, sans-serif'; c.fillText(String(wins[z[0]]), z[1] + 19, 44);
          c.fillStyle = '#fff'; c.fillText(String(wins[z[0]]), z[1] + 18, 42);
          c.fillStyle = act ? '#fff' : 'rgba(255,255,255,.6)'; c.font = '800 11px system-ui, sans-serif'; c.fillText(names[z[0]].toUpperCase(), z[1], 76);
        });
        c.fillStyle = 'rgba(255,255,255,.08)'; rr(c, W / 2 - 20, 30, 40, 24, 12); c.fill();
        c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '800 12px system-ui, sans-serif'; c.fillText('= ' + wins[2], W / 2, 42);
        // подсветка столбца и фишка над ним
        var canMove = phase === 'play' && !(api.mode === 0 && turn === P2) && !(api.mode === 2 && turn !== mySide());
        if (canMove && hover >= 0) {
          var hx = bx + hover * cs, hg = c.createLinearGradient(0, by - cs, 0, by + cs * R);
          hg.addColorStop(0, 'rgba(255,255,255,0)'); hg.addColorStop(0.3, 'rgba(255,255,255,.08)'); hg.addColorStop(1, 'rgba(255,255,255,.02)');
          c.fillStyle = hg; c.fillRect(hx, by - cs, cs, cs * (R + 1));
        }
        // фишки (за доской, видны через лунки)
        for (var fi = 0; fi < falls.length; fi++) {
          var f = falls[fi], col = f.i % C, sq = f.sq > 0 ? Math.sin(f.sq / 0.16 * Math.PI) * 0.1 : 0;
          disc(c, bx + (col + 0.5) * cs, by + (f.y + 0.5) * cs + sq * cs * 0.3, cs, board[f.i], 1 + sq, 1 - sq);
        }
        c.drawImage(boardL, 0, 0, W, H);
        if (canMove && hover >= 0) {
          var dx = bx + (hover + 0.5) * cs, dy = by - cs * 0.55 + Math.sin(t * 5) * 2;
          c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(dx, by - 6, cs * 0.3, 3, 0, 0, 6.283); c.fill();
          disc(c, dx, dy, cs, turn);
          c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath();
          c.moveTo(dx - 6, by - cs * 1.12); c.lineTo(dx + 6, by - cs * 1.12); c.lineTo(dx, by - cs * 1.0); c.closePath();
          if (by - cs * 1.12 > 96) c.fill();
        }
        // выигрышная линия
        if (line && phase === 'roundEnd') {
          var pulse = 0.5 + 0.5 * Math.sin(t * 7), lc = COL3[board[line[0]]];
          var x0 = bx + (line[0] % C + 0.5) * cs, y0 = by + (Math.floor(line[0] / C) + 0.5) * cs;
          var x1 = bx + (line[3] % C + 0.5) * cs, y1 = by + (Math.floor(line[3] / C) + 0.5) * cs;
          c.save();
          if (q > 0) {
            c.globalCompositeOperation = 'lighter';
            c.globalAlpha = 0.45 + 0.4 * pulse;
            for (var li = 0; li < 4; li++) {
              var lx = bx + (line[li] % C + 0.5) * cs, ly = by + (Math.floor(line[li] / C) + 0.5) * cs;
              c.drawImage(glowS, lx - cs * 0.8, ly - cs * 0.8, cs * 1.6, cs * 1.6);
            }
            c.globalCompositeOperation = 'source-over';
          }
          c.globalAlpha = 1; c.lineCap = 'round';
          c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = cs * 0.16; c.beginPath(); c.moveTo(x0, y0 + 2); c.lineTo(x1, y1 + 2); c.stroke();
          c.strokeStyle = lc[0]; c.globalAlpha = 0.6 + 0.4 * pulse; c.lineWidth = cs * 0.1; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
          c.strokeStyle = '#fff'; c.lineWidth = cs * 0.035; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
          c.globalAlpha = 1;
          for (var lj = 0; lj < 4; lj++) {
            c.strokeStyle = '#fff'; c.globalAlpha = 0.5 + 0.5 * pulse; c.lineWidth = 3;
            c.beginPath(); c.arc(bx + (line[lj] % C + 0.5) * cs, by + (Math.floor(line[lj] / C) + 0.5) * cs, cs * 0.41, 0, 6.283); c.stroke();
          }
          c.restore();
        }
        // статус
        var msg;
        if (phase === 'roundEnd') {
          var w = winLine(board);
          msg = !w ? api.t('g.draw') : two ? api.t(w.v === P1 ? 'g.p1win' : 'g.p2win') : api.t(w.v === (api.mode === 2 ? mySide() : P1) ? 'g.win' : 'g.lose');
          if (two && !endT) msg += ' · ' + api.t('g.tapContinue');
        } else if (api.mode === 2) msg = api.t(turn === mySide() ? 'g.yourTurn' : 'net.oppTurn');
        else msg = two ? api.t(turn === P1 ? 'g.p1turn' : 'g.p2turn') : api.t(turn === P1 ? 'g.yourTurn' : 'g.thinking');
        var sy = Math.min(H - 20, by + R * cs + 46);
        c.font = '800 16px system-ui, sans-serif';
        var mw = c.measureText(msg).width + 44;
        c.fillStyle = 'rgba(8,12,40,.65)'; rr(c, W / 2 - mw / 2, sy - 17, mw, 34, 17); c.fill();
        c.strokeStyle = phase === 'play' ? COL3[turn][1] : 'rgba(255,255,255,.3)'; c.lineWidth = 1.5; c.stroke();
        if (phase === 'play') disc(c, W / 2 - mw / 2 + 16, sy, 18, turn);
        c.fillStyle = '#fff'; c.fillText(msg, W / 2 + (phase === 'play' ? 6 : 0), sy + 1);
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      }
    };
  }
};
