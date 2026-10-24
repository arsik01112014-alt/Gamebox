/* Мишени: успей нажать на мишень, пока она не исчезла */
window.GAMES = window.GAMES || {};
window.GAMES.aim = {
  title: 'Мишени', desc: 'Попади по мишеням на скорость', cat: 'arcade', isNew4: true, medals: [800, 2000, 4000],
  hint: 'Мишени появляются и сжимаются. Нажми на мишень, пока она не исчезла: чем быстрее, тем больше очков. Пропущенная мишень отнимает жизнь, три жизни — конец игры.',
  d0: 'Мишени живут 2 секунды', d1: '1,6 секунды', d2: '1,3 секунды', d3: '1 секунда, мишени меньше',
  colors: ['#dc2626', '#9f1239'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#fee2e2"/><circle cx="50" cy="50" r="30" fill="#dc2626"/><circle cx="50" cy="50" r="20" fill="#fff"/><circle cx="50" cy="50" r="10" fill="#dc2626"/></svg>',
  create: function (api) {
    var LIFE = [2.0, 1.6, 1.3, 1.0];
    var targets, lives, t, spawnT, pops;
    function radius(tg) { return tg.r0 * (1 - 0.6 * tg.age / LIFE[api.diff]); }
    function spawn() {
      var r0 = Math.min(api.W, api.H) * (api.diff === 3 ? 0.07 : 0.09);
      targets.push({ x: r0 + Math.random() * (api.W - 2 * r0), y: 80 + r0 + Math.random() * (api.H - 120 - 2 * r0), r0: r0, age: 0 });
    }
    return {
      reset: function () { targets = []; lives = 3; t = 0; spawnT = 0.3; pops = []; },
      resize: function () { }, idle: function () { }, key: function () { },
      input: function (type, d) {
        if (type !== 'down') return;
        for (var i = targets.length - 1; i >= 0; i--) {
          var tg = targets[i], r = radius(tg);
          if (Math.hypot(d.x - tg.x, d.y - tg.y) <= r + 6) {
            var pts = Math.round(10 + 90 * (1 - tg.age / LIFE[api.diff])) * (api.diff + 1);
            api.addScore(pts); api.sound('coin'); api.vibrate(10);
            pops.push({ x: tg.x, y: tg.y, s: '+' + pts, a: 0.6 });
            targets.splice(i, 1); return;
          }
        }
        api.vibrate(20);
      },
      update: function (dt) {
        t += dt; spawnT -= dt;
        if (spawnT <= 0) { spawn(); spawnT = Math.max(0.35, 1.1 - t * 0.015); }
        for (var i = targets.length - 1; i >= 0; i--) {
          targets[i].age += dt;
          if (targets[i].age >= LIFE[api.diff]) {
            targets.splice(i, 1); lives--; api.sound('hit'); api.vibrate(40);
            if (lives <= 0) { api.gameOver(); return; }
          }
        }
        pops = pops.filter(function (p) { p.a -= dt; p.y -= 40 * dt; return p.a > 0; });
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        c.fillStyle = '#1c1917'; c.fillRect(0, 0, W, H);
        targets.forEach(function (tg) {
          var r = radius(tg);
          [['#dc2626', 1], ['#fff', 0.66], ['#dc2626', 0.33]].forEach(function (ring) {
            c.fillStyle = ring[0]; c.beginPath(); c.arc(tg.x, tg.y, r * ring[1], 0, 6.283); c.fill();
          });
        });
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = '800 20px system-ui'; c.fillStyle = '#fde68a';
        pops.forEach(function (p) { c.globalAlpha = Math.max(0, p.a / 0.6); c.fillText(p.s, p.x, p.y); });
        c.globalAlpha = 1;
        c.fillStyle = '#fff'; c.fillText('❤'.repeat(Math.max(0, lives)), W / 2, 40);
      }
    };
  }
};
