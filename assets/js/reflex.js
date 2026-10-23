/* Рефлекс: жми, когда зелёное */
window.GAMES = window.GAMES || {};
window.GAMES.reflex = {
  title: 'Рефлекс', desc: 'Проверь скорость реакции', cat: 'arcade', isNew4: true, medals: [2500, 3800, 4600],
  hint: 'Жди, пока круг станет ЗЕЛЁНЫМ, и сразу нажми. Чем быстрее, тем больше очков. Нажал раньше времени или на красный — штраф. 10 попыток.',
  d0: 'Только зелёный', d1: 'Бывают красные обманки', d2: 'Больше обманок, короче окно', d3: 'Много обманок и жёлтые ловушки',
  colors: ['#16a34a', '#0f766e'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="#22c55e"/><circle cx="50" cy="50" r="38" fill="none" stroke="#fff" stroke-width="5"/><path d="M52 22 34 54h14l-4 24 22-34H52z" fill="#fff"/></svg>',
  create: function (api) {
    var rnd, st, t, wait, col, ms, msg, shown, total;
    function nextRound() {
      if (rnd >= 10) { api.gameOver(); return; }
      rnd++; st = 'wait'; t = 0; wait = 1 + Math.random() * 2.5;
      var r = Math.random(), fake = [0, 0.25, 0.4, 0.5][api.diff];
      col = r < fake ? (api.diff === 3 && Math.random() < 0.5 ? 'y' : 'r') : 'g';
    }
    return {
      reset: function () { rnd = 0; total = 0; msg = ''; ms = 0; nextRound(); },
      idle: function () { }, resize: function () { }, key: function (k, d) { if (d) this.input('down', {}); },
      input: function (type) {
        if (type !== 'down') return;
        if (st === 'wait') { if (col === 'g' && shown) return; msg = 'Рано!'; api.sound('hit'); api.vibrate(40); st = 'res'; t = 0; return; }
        if (st === 'go') {
          if (col === 'g') { ms = Math.round(t * 1000); var p = Math.max(0, 1000 - ms * 2); api.addScore(p); msg = ms + ' мс'; api.sound(p > 500 ? 'win' : 'coin'); }
          else { msg = 'Ловушка!'; api.sound('hit'); }
          st = 'res'; t = 0;
        }
      },
      update: function (dt) {
        t += dt;
        if (st === 'wait' && t >= wait) { st = 'go'; t = 0; shown = true; }
        if (st === 'go') { if (col !== 'g' && t > 0.9) { msg = 'Верно, ждал'; api.addScore(80 * (api.diff + 1)); st = 'res'; t = 0; } else if (col === 'g' && t > [1.4, 1.1, 0.9, 0.7][api.diff]) { msg = 'Медленно'; st = 'res'; t = 0; } }
        if (st === 'res' && t > 0.9) { shown = false; nextRound(); }
      },
      draw: function (c) {
        var W = api.W, H = api.H; c.fillStyle = '#052e16'; c.fillRect(0, 0, W, H);
        var colr = st === 'go' || st === 'res' && shown ? (col === 'g' ? '#22c55e' : col === 'r' ? '#ef4444' : '#eab308') : '#334155';
        c.fillStyle = colr; c.beginPath(); c.arc(W / 2, H * 0.42, Math.min(W, H) * 0.28, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 6; c.stroke();
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 28px system-ui';
        c.fillText(st === 'wait' ? '…' : st === 'go' ? (col === 'g' ? 'ЖМИ!' : 'ЖДИ') : msg, W / 2, H * 0.42);
        c.font = '700 16px system-ui'; c.fillText(rnd + ' / 10', W / 2, H * 0.78);
      }
    };
  }
};
