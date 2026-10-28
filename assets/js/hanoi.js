/* Ханойская башня: перенеси все диски на правый стержень */
window.GAMES = window.GAMES || {};
window.GAMES.hanoi = {
  title: 'Ханойская башня', desc: 'Перенеси пирамидку', cat: 'puzzle', isNew4: true, medals: [300, 700, 1300],
  hint: 'Нажми на стержень — возьмёшь верхний диск, нажми на другой — положишь. Большой диск нельзя класть на меньший. Перенеси всю пирамиду на правый стержень. Чем ближе число ходов к минимальному, тем больше очков. 3 уровня, дисков всё больше.',
  d0: 'С 3 дисков', d1: 'С 4 дисков', d2: 'С 5 дисков', d3: 'С 6 дисков',
  colors: ['#d97706', '#7c2d12'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#fef3c7"/><rect x="10" y="80" width="80" height="6" rx="3" fill="#92400e"/><g fill="#b45309"><rect x="22" y="30" width="5" height="50"/><rect x="48" y="30" width="5" height="50"/><rect x="74" y="30" width="5" height="50"/></g><rect x="10" y="70" width="30" height="10" rx="5" fill="#ef4444"/><rect x="14" y="60" width="22" height="10" rx="5" fill="#f59e0b"/><rect x="18" y="50" width="14" height="10" rx="5" fill="#22c55e"/><rect x="64" y="70" width="26" height="10" rx="5" fill="#3b82f6"/></svg>',
  create: function (api) {
    var pegs, n, held, heldFrom, moves, lvl, winT, endT, t, fly, lastBad;
    var COLS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'];
    function start() { n = 3 + api.diff + lvl; pegs = [[], [], []]; for (var i = n; i >= 1; i--) pegs[0].push(i); held = 0; heldFrom = -1; moves = 0; winT = 0; lastBad = 0; }
    function pegX(p) { return api.W * (0.18 + p * 0.32); }
    function baseY() { return api.H * 0.72; }
    function dh() { return Math.min(30, (api.H * 0.45) / (n + 1)); }
    function dw(s) { return (api.W * 0.29) * (0.3 + 0.7 * s / n); }
    return {
      reset: function () { lvl = 0; t = 0; endT = 0; start(); },
      resize: function () { }, idle: function (dt) { t += dt || 0; }, key: function () { },
      input: function (type, d) {
        if (type !== 'down' || winT > 0 || endT > 0) return;
        var p = Math.max(0, Math.min(2, Math.floor(d.x / (api.W / 3))));
        if (!held) { if (pegs[p].length) { held = pegs[p].pop(); heldFrom = p; api.sound('click'); } return; }
        var top = pegs[p][pegs[p].length - 1];
        if (top && top < held) { lastBad = 0.5; api.sound('hit'); api.vibrate(40); return; }
        pegs[p].push(held); if (p !== heldFrom) moves++; held = 0; api.sound('click'); api.vibrate(6);
        if (pegs[2].length === n) {
          var opt = Math.pow(2, n) - 1; lvl++; winT = 1.8;
          api.addScore(Math.round(n * 60 * Math.min(1, opt / moves) + (moves === opt ? n * 40 : 0))); api.sound('win'); api.fx.confetti(40);
        }
      },
      update: function (dt) {
        t += dt; if (lastBad > 0) lastBad -= dt;
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (winT > 0) { winT -= dt; if (winT <= 0) { if (lvl >= 3) endT = 0.01; else start(); } }
      },
      draw: function (c) {
        var W = api.W, H = api.H, by = baseY(), h = dh(), g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#fef3c7'); g.addColorStop(1, '#fde68a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#78350f'; c.font = '800 15px system-ui';
        c.fillText('Уровень ' + Math.min(3, lvl + (winT > 0 ? 0 : 1)) + ' из 3 · ходов ' + moves + ' (минимум ' + (Math.pow(2, n) - 1) + ')', W / 2, 30);
        window.GBK.rr(c, 8, by, W - 16, 16, 8); c.fillStyle = '#92400e'; c.fill();
        for (var p = 0; p < 3; p++) {
          var x = pegX(p); window.GBK.rr(c, x - 5, by - h * (n + 1.5), 10, h * (n + 1.5), 5); c.fillStyle = p === 2 ? '#b45309' : '#a16207'; c.fill();
          if (p === 2) { c.fillStyle = '#92400e'; c.font = '700 12px system-ui'; c.fillText('сюда', x, by + 30); }
          pegs[p].forEach(function (s, k) {
            var w = dw(s), y = by - (k + 1) * h; window.GBK.rr(c, x - w / 2, y + 1, w, h - 2, (h - 2) / 2);
            var dg = c.createLinearGradient(0, y, 0, y + h); dg.addColorStop(0, '#fff'); dg.addColorStop(0.15, COLS[(s - 1) % 9]); dg.addColorStop(1, COLS[(s - 1) % 9]);
            c.fillStyle = dg; c.fill();
          });
        }
        if (held) {
          var hx = pegX(heldFrom), w = dw(held), y = by - h * (n + 2.6) + Math.sin(t * 5) * 4;
          c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(hx, by - h * (pegs[heldFrom].length) - 4, w / 2, 4, 0, 0, 6.283); c.fill();
          window.GBK.rr(c, hx - w / 2, y, w, h - 2, (h - 2) / 2); c.fillStyle = COLS[(held - 1) % 9]; c.fill();
          c.strokeStyle = lastBad > 0 ? '#dc2626' : '#fff'; c.lineWidth = 3; c.stroke();
          c.fillStyle = '#78350f'; c.font = '700 13px system-ui'; c.fillText('Нажми на стержень, куда положить', W / 2, H - 80);
        }
        if (winT > 0) window.GBK.toast(c, W, H - 46, lvl >= 3 ? 'Все башни перенесены! 🎉' : 'Готово! Дальше больше дисков…', 1);
      }
    };
  }
};
