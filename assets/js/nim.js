/* Ним: по очереди забирай камни, кто возьмёт последний — выиграл раунд */
window.GAMES = window.GAMES || {};
window.GAMES.nim = {
  title: 'Ним', desc: 'Возьми последний камень', cat: 'puzzle', isNew4: true, medals: [600, 1500, 3000],
  hint: 'Нажми на камень: он и все камни над ним в этой кучке заберутся. Кто возьмёт последний камень, выигрывает раунд. Три проигранных раунда — конец игры.',
  d0: '3 кучки, соперник ошибается', d1: '3 кучки', d2: '4 кучки', d3: '4 кучки, умный соперник',
  colors: ['#0891b2', '#1e3a8a'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#e0f2fe"/><circle cx="30" cy="68" r="11" fill="#0891b2"/><circle cx="30" cy="46" r="11" fill="#0891b2"/><circle cx="70" cy="68" r="11" fill="#1e3a8a"/></svg>',
  create: function (api) {
    var PILES = [[2, 3, 4], [3, 5, 7], [2, 4, 6, 8], [3, 5, 7, 9]];
    var SMART = [0.3, 0.6, 0.8, 1];
    var piles, lives, state, timer, msg, sr, base;
    function total() { return piles.reduce(function (a, b) { return a + b; }, 0); }
    function layout() {
      sr = Math.min(22, api.W / (piles.length + 1) / 2.6);
      base = api.H * 0.78;
    }
    function newRound() { piles = PILES[api.diff].slice(); layout(); state = 'p'; msg = 'Твой ход'; }
    function endRound(won) {
      state = 'end'; timer = 1.6;
      if (won) { api.addScore(150 * (api.diff + 1) + lives * 50); api.fx.confetti(30); api.sound('win'); msg = 'Ты победил в раунде!'; }
      else { lives--; api.sound('hit'); api.vibrate(40); msg = 'Соперник забрал последний'; }
    }
    function aiMove() {
      var x = piles.reduce(function (a, b) { return a ^ b; }, 0), idx = -1, to = 0;
      if (x && Math.random() < SMART[api.diff]) {
        for (var i = 0; i < piles.length; i++) if ((piles[i] ^ x) < piles[i]) { idx = i; to = piles[i] ^ x; break; }
      }
      if (idx < 0) {
        var cand = [];
        piles.forEach(function (n, i) { if (n) cand.push(i); });
        idx = cand[Math.floor(Math.random() * cand.length)]; to = piles[idx] - 1;
      }
      piles[idx] = to;
    }
    return {
      reset: function () { lives = 3; newRound(); },
      resize: function () { if (piles) layout(); }, idle: function () { }, key: function () { },
      input: function (type, d) {
        if (type !== 'down' || state !== 'p') return;
        var sx = api.W / (piles.length + 1);
        for (var p = 0; p < piles.length; p++) {
          var x = sx * (p + 1);
          if (Math.abs(d.x - x) > sr * 1.3) continue;
          var k = Math.round((base - d.y) / (sr * 2));
          if (k < 0 || k >= piles[p]) return;
          piles[p] = k; api.sound('click'); api.vibrate(10);
          if (total() === 0) endRound(true);
          else { state = 'ai'; timer = 0.7; msg = 'Ход соперника'; }
          return;
        }
      },
      update: function (dt) {
        if (state === 'ai' && (timer -= dt) <= 0) {
          aiMove(); layout();
          if (total() === 0) endRound(false); else { state = 'p'; msg = 'Твой ход'; }
        }
        if (state === 'end' && (timer -= dt) <= 0) {
          if (lives <= 0) api.gameOver(); else newRound();
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        c.fillStyle = '#082f49'; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = '#e0f2fe'; c.font = '800 18px system-ui';
        c.fillText(msg, W / 2, 40);
        c.font = '700 16px system-ui'; c.fillText('Жизни: ' + '♥'.repeat(Math.max(0, lives)), W / 2, 66);
        var sx = W / (piles.length + 1);
        for (var p = 0; p < piles.length; p++) {
          for (var k = 0; k < piles[p]; k++) {
            c.fillStyle = p % 2 ? '#38bdf8' : '#f59e0b';
            c.beginPath(); c.arc(sx * (p + 1), base - k * sr * 2, sr, 0, 6.283); c.fill();
          }
        }
      }
    };
  }
};
