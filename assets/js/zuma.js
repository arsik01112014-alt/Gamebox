/* Зума: стреляй шариками в цепочку, собирай 3 одного цвета, не дай цепочке доползти до черепа */
window.GAMES = window.GAMES || {};
window.GAMES.zuma = {
  title: 'Зума', desc: 'Собери три шарика в цепочке', cat: 'arcade', isNew4: true, medals: [800, 2000, 4000],
  hint: 'Нажми на экран — лягушка выстрелит шариком туда. Шарик встанет в цепочку; 3 и больше одного цвета подряд исчезают. Если после этого сомкнутся шарики одного цвета — будет цепная реакция и больше очков. Нажми на лягушку, чтобы поменять шарик на запасной. Не дай цепочке доползти до черепа!',
  d0: '3 цвета, медленно', d1: '4 цвета', d2: '5 цветов', d3: '5 цветов, быстро и длинная цепочка',
  colors: ['#16a34a', '#a16207'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#a16207"/><path d="M50 50m-34 0a34 34 0 1 0 34-34" fill="none" stroke="#713f12" stroke-width="14"/><g><circle cx="16" cy="50" r="7" fill="#ef4444"/><circle cx="21" cy="68" r="7" fill="#ef4444"/><circle cx="33" cy="80" r="7" fill="#3b82f6"/><circle cx="50" cy="84" r="7" fill="#facc15"/><circle cx="67" cy="80" r="7" fill="#22c55e"/></g><circle cx="50" cy="50" r="14" fill="#16a34a"/><circle cx="45" cy="45" r="4" fill="#fff"/><circle cx="55" cy="45" r="4" fill="#fff"/><circle cx="50" cy="60" r="6" fill="#ef4444"/></svg>',
  create: function (api) {
    var PAL = ['#ef4444', '#3b82f6', '#facc15', '#22c55e', '#a855f7'];
    var NC = [3, 4, 5, 5][api.diff], TOTAL = [45, 60, 75, 100][api.diff], SPD = [26, 32, 38, 48][api.diff];
    var path, plen, D, chain, headS, spawned, shots, cur, nxt, aim, t, intro, over, overT, combo, pops, cx, cy, back;
    function buildPath() {
      cx = api.W / 2; cy = api.H * 0.47; var R0 = Math.min(api.W, api.H * 0.8) * 0.46, R1 = R0 * 0.38, turns = 2.1, pts = [], N = 1400;
      for (var i = 0; i <= N; i++) { var k = i / N, a = -Math.PI / 2 + k * turns * Math.PI * 2, r = R0 - (R0 - R1) * k; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 1.08]); }
      path = [[pts[0][0] - 200, pts[0][1]]].concat(pts); // въезд из-за края
      var acc = [0]; for (i = 1; i < path.length; i++) acc.push(acc[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
      path.acc = acc; plen = acc[acc.length - 1]; D = Math.max(18, Math.min(26, R0 * 0.13));
    }
    function at(s) {
      if (s <= 0) return path[0]; if (s >= plen) return path[path.length - 1];
      var lo = 0, hi = path.length - 1; while (hi - lo > 1) { var m = (lo + hi) >> 1; if (path.acc[m] < s) lo = m; else hi = m; }
      var k = (s - path.acc[lo]) / (path.acc[hi] - path.acc[lo] || 1); return [path[lo][0] + (path[hi][0] - path[lo][0]) * k, path[lo][1] + (path[hi][1] - path[lo][1]) * k];
    }
    function present() { var m = {}; chain.forEach(function (b) { m[b.c] = 1; }); var r = Object.keys(m).map(Number); return r.length ? r : [0]; }
    function rndCol() { var p = present(); return p[Math.floor(Math.random() * p.length)]; }
    function newCol() { // в цепочку: иногда повторяем предыдущий цвет, чтобы были пары
      var last = chain.length ? chain[chain.length - 1].c : -1;
      return last >= 0 && Math.random() < 0.38 ? last : Math.floor(Math.random() * NC);
    }
    function matchAt(i, mult) {
      if (i < 0 || i >= chain.length) return 0;
      var c = chain[i].c, a = i, b = i; while (a > 0 && chain[a - 1].c === c) a--; while (b < chain.length - 1 && chain[b + 1].c === c) b++;
      var n = b - a + 1; if (n < 3) return 0;
      for (var k = a; k <= b; k++) { var p = at(headS - k * D); pops.push({ x: p[0], y: p[1], c: PAL[c], l: 0.4 }); }
      chain.splice(a, n); if (a === 0) headS -= n * D; // голова отступает, хвост подтягивается сам
      api.addScore(n * 10 * mult); api.sound(mult > 1 ? 'bonus' : 'pop'); api.vibrate(15);
      if (mult > 1) api.fx.text && api.fx.text(cx, cy - 70, '×' + mult, '#fde68a', 30);
      back = Math.max(back, 0.4 * mult); // после попадания цепочка ненадолго откатывается
      return 1 + matchAt(a > 0 && a < chain.length && chain[a - 1].c === chain[a].c ? a : -1, mult + 1);
    }
    return {
      reset: function () { buildPath(); chain = []; headS = 0; spawned = 0; shots = []; t = 0; intro = 1.8; over = 0; overT = 0; combo = 0; pops = []; back = 0; aim = -Math.PI / 2; cur = Math.floor(Math.random() * NC); nxt = Math.floor(Math.random() * NC); },
      resize: function () { }, idle: function (dt) { t += dt || 0; }, key: function () { },
      input: function (type, d) {
        if (over) return;
        if (type === 'move' || type === 'down') aim = Math.atan2(d.y - cy, d.x - cx);
        if (type !== 'down') return;
        if (Math.hypot(d.x - cx, d.y - cy) < 34) { var x = cur; cur = nxt; nxt = x; api.sound('click'); return; }
        if (shots.length > 1) return;
        shots.push({ x: cx + Math.cos(aim) * 30, y: cy + Math.sin(aim) * 30, vx: Math.cos(aim) * 760, vy: Math.sin(aim) * 760, c: cur });
        cur = nxt; nxt = chain.length ? rndCol() : Math.floor(Math.random() * NC); api.sound('flap');
      },
      update: function (dt) {
        t += dt;
        if (over) { overT += dt; if (over === 2 && chain.length) { headS += 600 * dt; while (chain.length && headS - 0 >= plen) { chain.shift(); headS -= D; } } if (overT > 2.2) api.gameOver(); return; }
        if (intro > 0 && headS > plen * 0.3) intro = 0;
        var sp = intro > 0 ? SPD * 7 : SPD * (1 + Math.max(0, headS / plen - 0.7) * 1.2);
        if (back > 0) { back -= dt; headS -= SPD * 1.5 * dt; } else headS += sp * dt;
        while (spawned < TOTAL && headS - chain.length * D >= 0) { chain.push({ c: newCol() }); spawned++; }
        if (headS < (chain.length - 1) * D) headS = (chain.length - 1) * D;
        shots.forEach(function (s) {
          s.x += s.vx * dt; s.y += s.vy * dt;
          for (var i = 0; i < chain.length; i++) {
            var p = at(headS - i * D); if (Math.hypot(p[0] - s.x, p[1] - s.y) > D * 0.95) continue;
            // вставка: перед или после шарика, в зависимости от того, с какой стороны попали
            var pf = at(headS - i * D + D * 0.5), ins = Math.hypot(pf[0] - s.x, pf[1] - s.y) < D * 0.6 ? i : i + 1;
            if (ins === 0) headS += D;
            chain.splice(ins, 0, { c: s.c }); s.dead = true; api.sound('click');
            matchAt(ins, 1); break;
          }
          if (s.x < -40 || s.y < -40 || s.x > api.W + 40 || s.y > api.H + 40) s.dead = true;
        });
        shots = shots.filter(function (s) { return !s.dead; });
        pops.forEach(function (q) { q.l -= dt; }); pops = pops.filter(function (q) { return q.l > 0; });
        if (chain.length && headS >= plen - D * 0.5) { over = 2; api.sound('hit'); api.vibrate(100); }
        else if (!chain.length && spawned >= TOTAL) { over = 1; api.addScore(500 + api.diff * 300); api.sound('win'); api.fx.confetti(60); }
        if (chain.length && present().indexOf(cur) < 0) cur = rndCol();
        if (chain.length && present().indexOf(nxt) < 0) nxt = rndCol();
      },
      draw: function (c) {
        var W = api.W, H = api.H, g = c.createRadialGradient(cx, cy, 20, cx, cy, Math.max(W, H) * 0.7);
        g.addColorStop(0, '#ca8a04'); g.addColorStop(1, '#422006'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        // жёлоб
        c.lineCap = 'round'; c.lineJoin = 'round';
        [[D * 1.25, '#3f2a06'], [D * 0.95, '#6b4a12']].forEach(function (l) { c.strokeStyle = l[1]; c.lineWidth = l[0]; c.beginPath(); for (var i = 1; i < path.length; i += 6) c.lineTo(path[i][0], path[i][1]); c.stroke(); });
        // череп в конце
        var e = path[path.length - 1]; c.fillStyle = '#0c0a09'; c.beginPath(); c.arc(e[0], e[1], D * 0.9, 0, 6.283); c.fill(); c.font = Math.round(D * 1.1) + 'px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('💀', e[0], e[1] + 1);
        var danger = headS / plen > 0.8 && !over;
        chain.forEach(function (b, i) {
          var p = at(headS - i * D); if (headS - i * D < 0) return; var r = D * 0.48;
          var bg = c.createRadialGradient(p[0] - r * 0.35, p[1] - r * 0.4, 1, p[0], p[1], r); bg.addColorStop(0, '#fff'); bg.addColorStop(0.25, PAL[b.c]); bg.addColorStop(1, PAL[b.c]);
          c.fillStyle = bg; c.beginPath(); c.arc(p[0], p[1], r, 0, 6.283); c.fill();
        });
        if (danger) { c.fillStyle = 'rgba(239,68,68,' + (0.1 + 0.08 * Math.sin(t * 10)) + ')'; c.fillRect(0, 0, W, H); }
        pops.forEach(function (q) { c.globalAlpha = q.l / 0.4; c.strokeStyle = q.c; c.lineWidth = 3; c.beginPath(); c.arc(q.x, q.y, D * (1.2 - q.l), 0, 6.283); c.stroke(); }); c.globalAlpha = 1;
        shots.forEach(function (s) { c.fillStyle = PAL[s.c]; c.beginPath(); c.arc(s.x, s.y, D * 0.48, 0, 6.283); c.fill(); });
        // лягушка
        c.save(); c.translate(cx, cy); c.rotate(aim + Math.PI / 2);
        c.strokeStyle = 'rgba(255,255,255,.18)'; c.setLineDash([6, 8]); c.lineWidth = 2; c.beginPath(); c.moveTo(0, -36); c.lineTo(0, -320); c.stroke(); c.setLineDash([]);
        c.fillStyle = '#15803d'; c.beginPath(); c.ellipse(0, 4, 30, 34, 0, 0, 6.283); c.fill();
        c.fillStyle = '#22c55e'; c.beginPath(); c.ellipse(0, 0, 25, 28, 0, 0, 6.283); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(-11, -16, 8, 0, 6.283); c.arc(11, -16, 8, 0, 6.283); c.fill();
        c.fillStyle = '#111'; c.beginPath(); c.arc(-11, -18, 3.5, 0, 6.283); c.arc(11, -18, 3.5, 0, 6.283); c.fill();
        c.fillStyle = PAL[cur]; c.beginPath(); c.arc(0, -26, D * 0.48, 0, 6.283); c.fill();
        c.fillStyle = PAL[nxt]; c.beginPath(); c.arc(0, 16, 8, 0, 6.283); c.fill();
        c.restore();
        c.fillStyle = '#fef3c7'; c.font = '800 15px system-ui'; c.fillText('Осталось шариков: ' + (chain.length + TOTAL - spawned), W / 2, 28);
        if (over) window.GBK.toast(c, W, H - 46, over === 1 ? 'Цепочка уничтожена! 🎉' : 'Цепочка дошла до черепа', 1);
      }
    };
  }
};
