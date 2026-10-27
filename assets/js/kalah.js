/* Калах (манкала): сей камни по лункам, собери больше в свой амбар */
window.GAMES = window.GAMES || {};
window.GAMES.kalah = {
  title: 'Калах', desc: 'Древняя игра с камнями', cat: 'board', isNew4: true, modes: true, lan: true, medals: [150, 300, 500],
  hint: 'Нажми на свою лунку — камни разложатся по одному против часовой стрелки. Последний камень в своём амбаре — ходишь ещё раз. Последний камень в пустой своей лунке — забираешь его и все камни напротив. У кого в амбаре больше камней, тот победил.',
  d0: '4 камня в лунке, простой соперник', d1: '4 камня, соперник жадный', d2: '5 камней, думает на 4 хода', d3: '6 камней, думает на 6 ходов',
  colors: ['#b45309', '#78350f'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="22" width="84" height="56" rx="26" fill="#92400e"/><rect x="12" y="26" width="76" height="48" rx="22" fill="#b45309"/><g fill="#78350f"><ellipse cx="22" cy="50" rx="7" ry="18"/><ellipse cx="78" cy="50" rx="7" ry="18"/><circle cx="38" cy="38" r="7"/><circle cx="50" cy="38" r="7"/><circle cx="62" cy="38" r="7"/><circle cx="38" cy="62" r="7"/><circle cx="50" cy="62" r="7"/><circle cx="62" cy="62" r="7"/></g><g fill="#a7f3d0"><circle cx="37" cy="37" r="2.5"/><circle cx="51" cy="63" r="2.5"/><circle cx="21" cy="46" r="2.5"/></g><g fill="#fca5a5"><circle cx="40" cy="40" r="2.5"/><circle cx="62" cy="61" r="2.5"/><circle cx="78" cy="55" r="2.5"/></g></svg>',
  create: function (api) {
    // лунки 0..5 и амбар 6 — первого игрока, 7..12 и амбар 13 — второго
    var K = window.GBK, b, turn, netQ, endT, t, thinkT, over, last, anim, flash, msg, msgT;
    var STONE = ['#fca5a5', '#a7f3d0', '#93c5fd', '#fde68a', '#f0abfc', '#fdba74'];
    function names() { return api.mode === 1 ? [api.t('g.p1'), api.t('g.p2')] : api.mode === 2 ? (api.net.side === 0 ? [api.t('g.you'), api.t('net.opp')] : [api.t('net.opp'), api.t('g.you')]) : [api.t('g.you'), api.t('g.cpu')]; }
    function me() { return api.mode === 2 ? api.net.side + 1 : 1; }
    function own(i, p) { return p === 1 ? i >= 0 && i <= 5 : i >= 7 && i <= 12; }
    function store(p) { return p === 1 ? 6 : 13; }
    // один ход на доске bb; возвращает, ходит ли игрок ещё раз
    function sow(bb, i, p, trace) {
      var n = bb[i]; bb[i] = 0; var k = i;
      while (n > 0) { k = (k + 1) % 14; if (k === store(3 - p)) continue; bb[k]++; n--; if (trace) trace.push(k); }
      if (own(k, p) && bb[k] === 1 && bb[12 - k] > 0) { bb[store(p)] += bb[12 - k] + 1; bb[k] = 0; bb[12 - k] = 0; if (trace) trace.cap = [k, 12 - k]; }
      return k === store(p);
    }
    function sideEmpty(bb, p) { for (var i = p === 1 ? 0 : 7, e = i + 6; i < e; i++) if (bb[i]) return false; return true; }
    function finish(bb) {
      if (!sideEmpty(bb, 1) && !sideEmpty(bb, 2)) return false;
      for (var i = 0; i < 6; i++) { bb[6] += bb[i]; bb[i] = 0; bb[13] += bb[i + 7]; bb[i + 7] = 0; }
      return true;
    }
    function moves(bb, p) { var r = []; for (var i = 0; i < 6; i++) { var k = p === 1 ? i : i + 7; if (bb[k]) r.push(k); } return r; }
    function search(bb, p, depth, a, be) {
      if (finish(bb) || depth === 0) return bb[13] - bb[6];
      var ms = moves(bb, p), best = p === 2 ? -1e9 : 1e9;
      for (var j = 0; j < ms.length; j++) {
        var nb = bb.slice(), again = sow(nb, ms[j], p);
        var v = search(nb, again ? p : 3 - p, again ? depth : depth - 1, a, be);
        if (p === 2) { if (v > best) best = v; if (best > a) a = best; } else { if (v < best) best = v; if (best < be) be = best; }
        if (a >= be) break;
      }
      return best;
    }
    function aiMove() {
      var ms = moves(b, 2); if (!ms.length) return;
      if (api.diff === 0 && Math.random() < 0.6) return play(ms[Math.floor(Math.random() * ms.length)]);
      var depth = [1, 1, 4, 6][api.diff], best = ms[0], bs = -1e9;
      ms.forEach(function (m) { var nb = b.slice(), again = sow(nb, m, 2); var v = search(nb, again ? 2 : 1, again ? depth : depth - 1, -1e9, 1e9) + Math.random() * 0.3; if (v > bs) { bs = v; best = m; } });
      play(best);
    }
    function play(i, remote) {
      if (over || anim || !own(i, turn) || !b[i]) return;
      if (api.mode === 2 && !remote) api.net.send({ i: i });
      var tr = []; var nb = b.slice(); var again = sow(nb, i, turn, tr);
      anim = { from: i, path: tr, k: 0, tm: 0, res: nb, again: again, cap: tr.cap, p: turn, start: b[i] };
      b[i] = 0; api.sound('click');
    }
    function stepAnim(dt) {
      anim.tm += dt; var spd = anim.path.length > 12 ? 0.05 : 0.09;
      while (anim.tm > spd && anim.k < anim.path.length) { anim.tm -= spd; b[anim.path[anim.k]]++; anim.k++; api.tone && api.tone(300 + anim.k * 30, 0.03); }
      if (anim.k < anim.path.length || anim.tm < 0.15) return;
      var a = anim; anim = null; b = a.res;
      if (a.cap) { flash = { i: a.cap, t: 0.8 }; api.sound('coin'); say('Захват!'); api.vibrate(20); }
      if (finish(b)) return end();
      if (a.again) { say(a.p === me() || api.mode === 1 ? 'Ещё ход!' : 'Соперник ходит ещё'); }
      else turn = 3 - turn;
      thinkT = 0.5 + Math.random() * 0.4;
    }
    function say(s) { msg = s; msgT = 1.6; }
    function end() {
      over = b[6] > b[13] ? 1 : b[13] > b[6] ? 2 : 3;
      var mine = api.mode === 1 ? over !== 3 : over === me();
      api.sound(mine ? 'win' : over === 3 ? 'click' : 'hit'); if (mine) api.fx.confetti(50);
      if (api.mode === 0 && over === 1) api.addScore(100 + (b[6] - b[13]) * 10 + api.diff * 80);
      endT = 3;
    }
    // раскладка: доска вертикально, свои лунки — справа сверху вниз, свой амбар — снизу
    var L = {};
    function layout() {
      var bw = Math.min(api.W - 40, 300), bh = Math.min(api.H - 210, 560);
      L.x = (api.W - bw) / 2; L.y = 96; L.w = bw; L.h = bh; L.r = Math.min(bw * 0.18, (bh - bh * 0.3) / 6 * 0.42);
    }
    function flip() { return api.mode === 2 && api.net.side === 1; }
    function pos(i) {
      var x, y, colL = L.x + L.w * 0.27, colR = L.x + L.w * 0.73, top = L.y + L.h * 0.17, step = (L.h * 0.66) / 5;
      if (i === 6) { x = L.x + L.w / 2; y = L.y + L.h * 0.925; }
      else if (i === 13) { x = L.x + L.w / 2; y = L.y + L.h * 0.075; }
      else if (i < 6) { x = colR; y = top + i * step; }
      else { x = colL; y = top + (12 - i) * step; }
      return flip() ? [api.W - x, 2 * L.y + L.h - y] : [x, y];
    }
    function drawStones(c, x, y, n, rad, seed) {
      var show = Math.min(n, 18), sr = Math.max(3, rad * 0.22);
      for (var s = 0; s < show; s++) {
        var a = s * 2.4 + seed, d = s === 0 ? 0 : rad * 0.25 * Math.sqrt(s) * 0.62;
        var sx = x + Math.cos(a) * d, sy = y + Math.sin(a) * d * (rad > L.r * 1.5 ? 2.2 : 1);
        c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(sx + 1, sy + 1.5, sr, 0, 6.283); c.fill();
        c.fillStyle = STONE[(s + seed) % 6]; c.beginPath(); c.arc(sx, sy, sr, 0, 6.283); c.fill();
        c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(sx - sr * 0.3, sy - sr * 0.35, sr * 0.35, 0, 6.283); c.fill();
      }
    }
    return {
      reset: function () {
        var s = [4, 4, 5, 6][api.mode === 0 ? api.diff : 1]; b = []; for (var i = 0; i < 14; i++) b[i] = i === 6 || i === 13 ? 0 : s;
        turn = 1; netQ = []; endT = 0; t = 0; over = 0; anim = null; flash = null; msgT = 0; thinkT = 0.8; layout();
      },
      resize: layout, idle: function (dt) { t += dt || 0; }, key: function () { },
      netMsg: function (d) { netQ.push(d); },
      input: function (type, d) {
        if (type !== 'down' || over || anim) return;
        if (api.mode === 0 && turn === 2) return;
        if (api.mode === 2 && turn !== me()) return;
        for (var i = 0; i < 13; i++) { if (i === 6 || !own(i, turn)) continue; var p = pos(i); if (Math.hypot(p[0] - d.x, p[1] - d.y) < L.r * 1.25) { if (b[i]) play(i); return; } }
      },
      update: function (dt) {
        t += dt; if (msgT > 0) msgT -= dt; if (flash) { flash.t -= dt; if (flash.t <= 0) flash = null; }
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (over) return;
        if (anim) { stepAnim(dt); return; }
        if (api.mode === 0 && turn === 2) { thinkT -= dt; if (thinkT <= 0) aiMove(); }
        if (api.mode === 2 && turn !== me() && netQ.length) { var m = netQ.shift(); if (m.i >= 0 && m.i < 13) play(m.i, true); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, nm = names();
        K.bg(c, W, H, '#1c1917', '#0c0a09', 'rgba(217,119,6,.14)');
        c.textAlign = 'center'; c.textBaseline = 'middle';
        // подписи игроков: сверху — соперник, снизу — я
        var topP = flip() ? 1 : 2, botP = 3 - topP;
        [[topP, 30], [botP, H - 92]].forEach(function (q) {
          var p = q[0], act = !over && turn === p;
          c.fillStyle = act ? '#fde68a' : '#d6d3d1'; c.font = '800 16px system-ui';
          c.fillText((act ? '▶ ' : '') + nm[p - 1] + ' · ' + b[store(p)], W / 2, q[1] + (p === topP ? 36 : 0));
        });
        // доска
        c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 18; c.shadowOffsetY = 8;
        var g = c.createLinearGradient(L.x, 0, L.x + L.w, 0); g.addColorStop(0, '#92400e'); g.addColorStop(0.5, '#b45309'); g.addColorStop(1, '#92400e');
        K.rr(c, L.x, L.y, L.w, L.h, L.w * 0.3); c.fillStyle = g; c.fill(); c.restore();
        c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1;
        for (var w = 1; w < 9; w++) { c.beginPath(); c.moveTo(L.x + L.w * w / 9, L.y + 20); c.bezierCurveTo(L.x + L.w * w / 9 + 6, L.y + L.h / 3, L.x + L.w * w / 9 - 6, L.y + L.h * 2 / 3, L.x + L.w * w / 9, L.y + L.h - 20); c.stroke(); }
        for (var i = 0; i < 14; i++) {
          var p = pos(i), big = i === 6 || i === 13, rx = big ? L.w * 0.36 : L.r, ry = big ? L.h * 0.055 : L.r;
          var hl = !over && !anim && own(i, turn) && b[i] > 0 && (api.mode === 1 || turn === me());
          c.fillStyle = '#5b2d0a'; c.beginPath(); c.ellipse(p[0], p[1], rx, ry, 0, 0, 6.283); c.fill();
          var ig = c.createRadialGradient(p[0], p[1] - ry * 0.4, 1, p[0], p[1], Math.max(rx, ry)); ig.addColorStop(0, '#3f1d06'); ig.addColorStop(1, '#6b3410');
          c.fillStyle = ig; c.beginPath(); c.ellipse(p[0], p[1] + 2, rx - 3, ry - 3, 0, 0, 6.283); c.fill();
          if (hl) { c.strokeStyle = 'rgba(253,230,138,' + (0.5 + 0.4 * Math.sin(t * 5)) + ')'; c.lineWidth = 3; c.beginPath(); c.ellipse(p[0], p[1], rx + 2, ry + 2, 0, 0, 6.283); c.stroke(); }
          if (flash && flash.i.indexOf(i) >= 0) { c.fillStyle = 'rgba(250,204,21,' + flash.t * 0.6 + ')'; c.beginPath(); c.ellipse(p[0], p[1], rx, ry, 0, 0, 6.283); c.fill(); }
          if (big) {
            var sc = Math.min(b[i], 30); for (var s = 0; s < sc; s++) {
              var sx = p[0] + ((s % 10) - 4.5) * rx * 0.17, sy = p[1] + (((s / 10) | 0) - 1) * ry * 0.5;
              c.fillStyle = STONE[s % 6]; c.beginPath(); c.arc(sx, sy, Math.max(3, L.r * 0.2), 0, 6.283); c.fill();
            }
          } else drawStones(c, p[0], p[1], b[i], L.r, i);
          // число камней
          var lx = p[0] + (big ? rx + 16 : (p[0] < W / 2 ? -L.r - 16 : L.r + 16)), ly = p[1];
          if (big) lx = p[0] + rx * 0.75 + 4;
          c.fillStyle = '#fef3c7'; c.font = '800 ' + (big ? 18 : 15) + 'px system-ui';
          if (big) { c.fillStyle = 'rgba(0,0,0,.45)'; K.rr(c, lx - 16, ly - 12, 32, 24, 12); c.fill(); c.fillStyle = '#fef3c7'; }
          c.fillText(b[i], lx, ly);
        }
        var tip;
        if (over) tip = over === 3 ? 'Ничья!' : api.mode === 1 ? api.t(over === 1 ? 'g.p1win' : 'g.p2win') : over === me() ? api.t('g.win') : api.t('g.lose');
        else if (msgT > 0) tip = msg;
        else if (anim) tip = '';
        else if (api.mode === 0 && turn === 2) tip = 'Компьютер думает…';
        else if (api.mode === 2 && turn !== me()) tip = api.t('net.oppTurn');
        else tip = (api.mode === 1 ? nm[turn - 1] + ', ' : '') + 'выбери лунку';
        K.toast(c, W, H - 46, tip, 1);
      }
    };
  }
};
