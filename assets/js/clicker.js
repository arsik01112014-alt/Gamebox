/* Кликер: каждое нажатие на монету — 0,25 монеты. Защита от автокликеров: только настоящие нажатия,
   не больше 12 в секунду, слишком ровный ритм или клики в одну и ту же точку — пауза. Дневной лимит. */
window.GAMES = window.GAMES || {};
window.GAMES.clicker = {
  title: 'Кликер', desc: 'Жми на монету — зарабатывай монеты', cat: 'arcade', isNew4: true, medals: [200, 600, 1500],
  hint: 'Каждое нажатие на большую монету приносит 0,25 монеты (4 нажатия — 1 монета). Автокликеры не работают: при подозрительно ровных нажатиях заработок ставится на паузу. В день можно заработать до 300 монет.',
  d0: '0,25 монеты за клик', d1: '0,25 монеты за клик', d2: '0,25 монеты за клик', d3: '0,25 монеты за клик',
  colors: ['#f59e0b', '#b45309'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#451a03"/><circle cx="50" cy="48" r="28" fill="#fbbf24" stroke="#b45309" stroke-width="5"/><circle cx="50" cy="48" r="18" fill="none" stroke="#fde68a" stroke-width="3"/><path d="M62 62l14 6-6 3 6 8-4 3-6-8-4 5z" fill="#fff" stroke="#1f2937" stroke-width="2"/></svg>',
  create: function (api) {
    var CAP = 300, PER = 0.25, MAXCPS = 12;
    var clicks, times, pts, pops, pulse, blockT, msg, msgT, t;
    function day() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
    function today() { var s = api.store.get('clkDay', null); return s && s.d === day() ? s.n : 0; }
    function R() { return Math.min(api.W, api.H) * 0.28; }
    function cy() { return api.H * 0.5; }
    function say(s, d) { msg = s; msgT = d || 2.5; }
    function block(why) { blockT = 30; times = []; pts = []; say(why, 4); api.sound('hit'); api.vibrate(200); }
    // ровный ритм: у человека интервалы между нажатиями заметно «гуляют»
    function robotic() {
      if (times.length < 20) return false;
      var iv = []; for (var i = times.length - 19; i < times.length; i++) iv.push(times[i] - times[i - 1]);
      var m = iv.reduce(function (a, b) { return a + b; }, 0) / iv.length;
      var sd = Math.sqrt(iv.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / iv.length);
      return m < 400 && sd < 6;
    }
    // все последние нажатия в одну точку — так жмёт программа
    function samePoint() {
      if (pts.length < 25) return false;
      var p0 = pts[pts.length - 1];
      return pts.slice(-25).every(function (p) { return Math.abs(p.x - p0.x) < 1.5 && Math.abs(p.y - p0.y) < 1.5; });
    }
    return {
      reset: function () { clicks = 0; times = []; pts = []; pops = []; pulse = 0; blockT = 0; msg = ''; msgT = 0; t = 0; },
      resize: function () { }, idle: function (dt) { t += dt; }, key: function () { },
      input: function (type, d) {
        if (type !== 'down') return;
        if (Math.hypot(d.x - api.W / 2, d.y - cy()) > R() * 1.1) return;
        if (d.trusted === false) { block('🤖 Нажатия не от пальца не считаются'); return; }
        if (blockT > 0) { say('⏸ Пауза: ' + Math.ceil(blockT) + ' с', 1); return; }
        var now = performance.now();
        times.push(now); pts.push({ x: d.x, y: d.y });
        if (times.length > 40) { times.shift(); pts.shift(); }
        var last1 = times.filter(function (x) { return now - x < 1000; }).length;
        if (last1 > MAXCPS) { say('Слишком быстро! Не больше ' + MAXCPS + ' кликов в секунду', 1.2); return; }
        if (robotic() || samePoint()) { block('🤖 Похоже на автокликер — пауза 30 с'); return; }
        var n = today();
        if (n >= CAP) { say('Дневной лимит ' + CAP + ' монет. Приходи завтра!', 2); return; }
        clicks++; pulse = 1; api.addScore(1); api.vibrate(5);
        var frac = (api.store.get('clkFrac', 0) || 0) + PER;
        if (frac >= 1) {
          frac -= 1; api.store.set('coins', api.store.get('coins', 0) + 1);
          api.store.set('clkDay', { d: day(), n: n + 1 }); api.sound('coin');
        } else api.sound('click');
        api.store.set('clkFrac', frac);
        pops.push({ x: d.x + (Math.random() - 0.5) * 30, y: d.y - 20, a: 0.9 });
      },
      update: function (dt) {
        t += dt; pulse = Math.max(0, pulse - dt * 6);
        if (blockT > 0) blockT -= dt;
        if (msgT > 0) msgT -= dt;
        pops = pops.filter(function (p) { p.a -= dt; p.y -= 70 * dt; return p.a > 0; });
      },
      draw: function (c) {
        var W = api.W, H = api.H, r = R() * (1 - pulse * 0.06), x = W / 2, y = cy();
        var g = c.createRadialGradient(x, y, 10, x, y, Math.max(W, H) * 0.7);
        g.addColorStop(0, '#78350f'); g.addColorStop(1, '#1c0a02');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        // лучи за монетой
        c.save(); c.translate(x, y); c.rotate(t * 0.3); c.fillStyle = 'rgba(251,191,36,.08)';
        for (var i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.beginPath(); c.moveTo(0, 0); c.lineTo(-r * 0.3, -r * 2.2); c.lineTo(r * 0.3, -r * 2.2); c.fill(); }
        c.restore();
        var cg = c.createLinearGradient(x - r, y - r, x + r, y + r);
        cg.addColorStop(0, '#fde68a'); cg.addColorStop(0.5, '#f59e0b'); cg.addColorStop(1, '#b45309');
        c.fillStyle = blockT > 0 ? '#57534e' : cg; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
        c.strokeStyle = blockT > 0 ? '#44403c' : '#92400e'; c.lineWidth = r * 0.08; c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = r * 0.04; c.beginPath(); c.arc(x, y, r * 0.75, 0, 6.283); c.stroke();
        c.fillStyle = blockT > 0 ? '#a8a29e' : '#7c2d12'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = '900 ' + Math.round(r * 0.7) + 'px system-ui'; c.fillText(blockT > 0 ? '⏸' : '₵', x, y + r * 0.04);
        var n = today(), frac = api.store.get('clkFrac', 0) || 0;
        c.fillStyle = '#fde68a'; c.font = '800 18px system-ui';
        c.fillText('Сегодня: ' + n + ' / ' + CAP + ' монет', W / 2, 46);
        c.font = '700 14px system-ui'; c.fillStyle = '#fcd34d';
        c.fillText('Баланс: ' + api.store.get('coins', 0) + ' + ' + frac.toFixed(2), W / 2, 72);
        // полоска до следующей монеты
        var bw = Math.min(260, W - 60);
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(W / 2 - bw / 2, y + r + 30, bw, 10);
        c.fillStyle = '#fbbf24'; c.fillRect(W / 2 - bw / 2, y + r + 30, bw * frac, 10);
        c.fillStyle = '#fde68a'; c.font = '700 13px system-ui'; c.fillText('0,25 монеты за клик', W / 2, y + r + 58);
        c.font = '800 20px system-ui';
        pops.forEach(function (p) { c.globalAlpha = Math.max(0, p.a / 0.9); c.fillStyle = '#fef3c7'; c.fillText('+0,25', p.x, p.y); });
        c.globalAlpha = 1;
        if (msgT > 0) {
          c.font = '800 15px system-ui'; var w = Math.min(W - 20, c.measureText(msg).width + 30);
          c.fillStyle = 'rgba(0,0,0,.7)'; c.fillRect(W / 2 - w / 2, H - 110, w, 40);
          c.fillStyle = '#fff'; c.fillText(msg, W / 2, H - 90);
        }
      }
    };
  }
};
