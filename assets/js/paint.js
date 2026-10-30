/* Раскраска по номерам: выбери цвет и закрась клетки с его номером — получится пиксельная картинка */
window.GAMES = window.GAMES || {};
window.GAMES.paint = {
  title: 'Раскраска по номерам', desc: 'Пиксельные картинки по цифрам', cat: 'puzzle', isNew4: true, medals: [400, 900, 1500],
  hint: 'Выбери цвет внизу — клетки с его номером подсветятся. Нажимай или веди пальцем по клеткам, чтобы закрасить. Ошибки отнимают очки. Раскрась 3 картинки — чем быстрее и точнее, тем больше очков.',
  d0: 'Картинки 12×12', d1: 'Картинки 12×12, меньше подсказок', d2: 'Картинки 16×16', d3: 'Картинки 16×16 без подсветки',
  colors: ['#f59e0b', '#7c3aed'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#fff7ed"/><g font-family="sans-serif" font-size="11" font-weight="800" fill="#a8a29e"><text x="58" y="62">2</text><text x="72" y="62">2</text><text x="58" y="76">3</text><text x="72" y="76">1</text></g><rect x="16" y="16" width="14" height="14" fill="#ef4444"/><rect x="30" y="16" width="14" height="14" fill="#ef4444"/><rect x="16" y="30" width="14" height="14" fill="#ef4444"/><rect x="30" y="30" width="14" height="14" fill="#f59e0b"/><rect x="44" y="30" width="14" height="14" fill="#ef4444"/><rect x="30" y="44" width="14" height="14" fill="#22c55e"/><path d="M70 20l12 12-30 30-14 2 2-14z" fill="#7c3aed"/></svg>',
  create: function (api) {
    // палитра: символ → цвет; '.' — фон (номер 1 у первого цвета)
    var PICS12 = [
      { n: 'Сердце', p: { '.': '#e0f2fe', r: '#ef4444', d: '#b91c1c', w: '#fff' }, g: ['............', '..rr....rr..', '.rrrr..rrrr.', 'rrwrrrrrrrrr', 'rwrrrrrrrrrd', 'rrrrrrrrrrrd', '.rrrrrrrrrd.', '..rrrrrrrd..', '...rrrrrd...', '....rrrd....', '.....rd.....', '............'] },
      { n: 'Гриб', p: { '.': '#dcfce7', r: '#dc2626', w: '#fff', s: '#fde68a', k: '#111827', g: '#16a34a' }, g: ['....rrrr....', '..rrwwrrrr..', '.rrwwrrrwwr.', '.rrrrrrrwwr.', 'rwwrrrrrrrrr', 'rwwrrwwrrrrr', 'rrrrrwwrrrrr', '..ssssssss..', '...sksskss..', '...ssssss...', 'gg.ssssss.gg', 'gggggggggggg'] },
      { n: 'Домик', p: { '.': '#bae6fd', r: '#b91c1c', y: '#fde047', b: '#92400e', w: '#fef3c7', g: '#22c55e', s: '#fff' }, g: ['..s.........', '.sss...rr...', '......rrrr..', '.....rrrrrr.', '....rrrrrrrr', '...rrrrrrrrr', '....wwwwwww.', '....wyywbbw.', '....wyywbbw.', '....wwwwbbw.', 'gggggggggggg', 'gggggggggggg'] },
      { n: 'Рыбка', p: { '.': '#0ea5e9', o: '#f97316', y: '#fde047', w: '#fff', k: '#111827', b: '#7dd3fc' }, g: ['............', '.b.....oo...', '......oooo..', 'o...oooooooo', 'oo.oooyyoowo', 'ooooooyyookw', 'ooooooyyoooo', 'oo.ooooooooo', 'o...oooooo..', '......oo....', '.b.......b..', '............'] },
      { n: 'Ёлка', p: { '.': '#1e3a8a', y: '#facc15', g: '#16a34a', d: '#14532d', r: '#ef4444', b: '#92400e', w: '#e2e8f0' }, g: ['.....y......', '....ggg.....', '...ggrgg....', '....ggg.....', '...ggggg....', '..gggggrg...', '...ggggg....', '..gggrgggg..', '.gggggggggd.', 'gggrgggggrgd', '.....bb.....', 'wwwwwwwwwwww'] },
      { n: 'Котик', p: { '.': '#fef9c3', o: '#fb923c', d: '#c2410c', w: '#fff', k: '#111827', p: '#f9a8d4' }, g: ['.o......o...', '.oo....oo...', '.ooooooooo..', '.ooooooooo..', '.okooooko...', '.ooooooooo..', '.ooopppooo..', '..ooooooo...', '..ddoooodd..', '.ooooooooo.o', '.oooowoooo.o', '.oo.oo.oo.oo'] }
    ];
    // 16×16 — увеличенные картинки 12×12 с рамкой-узором
    var pics, cur, N, G, done, colors, sel, mistakes, t, startT, solvedT, count, endT, cs, ox, oy, paintOn, flash;
    function build(P) {
      var big = api.diff >= 2, g = P.g;
      if (big) { var pad = '.'; g = []; for (var y = 0; y < 16; y++) { var row = ''; for (var x = 0; x < 16; x++) { var sx = Math.floor((x - 2) * 12 / 12), sy = Math.floor((y - 2) * 12 / 12); var ch = sx >= 0 && sy >= 0 && sx < 12 && sy < 12 ? P.g[sy][sx] : ((x + y) % 4 === 0 ? Object.keys(P.p)[1] : pad); row += ch; } g.push(row); } }
      N = g.length; colors = Object.keys(P.p); G = []; done = [];
      for (var y2 = 0; y2 < N; y2++) for (var x2 = 0; x2 < N; x2++) { G.push(colors.indexOf(g[y2][x2])); done.push(0); }
      sel = 1; mistakes = 0; startT = t; solvedT = 0; layout();
    }
    function layout() { cs = Math.min((api.W - 20) / N, (api.H - 260) / N); ox = (api.W - cs * N) / 2; oy = 70; }
    function left(ci) { var n = 0; for (var i = 0; i < G.length; i++) if (G[i] === ci && !done[i]) n++; return n; }
    function palRect(i) { var n = colors.length, w = Math.min(56, (api.W - 24) / n - 6); return [api.W / 2 - (n * (w + 6) - 6) / 2 + i * (w + 6), oy + N * cs + 26, w, w]; }
    function paintAt(x, y) {
      var cx = Math.floor((x - ox) / cs), cy = Math.floor((y - oy) / cs); if (cx < 0 || cy < 0 || cx >= N || cy >= N) return;
      var i = cy * N + cx; if (done[i]) return;
      if (G[i] === sel) { done[i] = 1; api.sound('click'); if (!left(sel)) { api.sound('coin'); var nx = colors.findIndex(function (c, k) { return left(k) > 0; }); if (nx >= 0) sel = nx; } check(); }
      else if (!flash[i] || flash[i] < 0.1) { flash[i] = 0.5; mistakes++; api.vibrate(25); }
    }
    function check() {
      if (done.every(Boolean)) {
        solvedT = 0.01; count++;
        var sec = t - startT; api.addScore(Math.max(60, Math.round(N * N * 3 - sec * 2 - mistakes * 10))); api.sound('win'); api.fx.confetti(50);
      }
    }
    return {
      reset: function () {
        t = 0; count = 0; endT = 0; flash = {}; pics = PICS12.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 3); cur = 0; build(pics[0]);
      },
      resize: function () { if (N) layout(); }, idle: function (dt) { t += dt || 0; }, key: function () { },
      input: function (type, d) {
        if (solvedT > 0 || endT > 0) return;
        if (type === 'down') {
          for (var i = 0; i < colors.length; i++) { var r = palRect(i); if (d.x >= r[0] && d.x <= r[0] + r[2] && d.y >= r[1] && d.y <= r[1] + r[3]) { if (left(i)) { sel = i; api.sound('click'); } return; } }
          paintOn = true; paintAt(d.x, d.y);
        } else if (type === 'move' && paintOn) paintAt(d.x, d.y);
        else if (type === 'up') paintOn = false;
      },
      update: function (dt) {
        t += dt; for (var k in flash) { flash[k] -= dt; if (flash[k] <= 0) delete flash[k]; }
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (solvedT > 0) { solvedT += dt; if (solvedT > 2.2) { cur++; if (cur >= pics.length) endT = 0.01; else build(pics[cur]); } }
      },
      draw: function (c) {
        var W = api.W, H = api.H, K = window.GBK, P = pics[cur].p;
        var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#fff7ed'); g.addColorStop(1, '#fde68a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#7c2d12'; c.font = '800 15px system-ui';
        c.fillText((solvedT > 0 ? '«' + pics[cur].n + '» готово!' : 'Картинка ' + (cur + 1) + ' из 3') + ' · ⏱ ' + Math.floor(t - startT) + ' с' + (mistakes ? ' · ошибок ' + mistakes : ''), W / 2, 30);
        c.save(); c.shadowColor = 'rgba(124,45,18,.3)'; c.shadowBlur = 18; c.shadowOffsetY = 6; c.fillStyle = '#fff'; c.fillRect(ox - 6, oy - 6, cs * N + 12, cs * N + 12); c.restore();
        var hl = api.diff < 3, fs = Math.max(8, cs * 0.46);
        c.font = '700 ' + fs + 'px system-ui';
        for (var i = 0; i < G.length; i++) {
          var x = ox + (i % N) * cs, y = oy + Math.floor(i / N) * cs, ci = G[i], col = P[colors[ci]];
          if (done[i]) {
            var pop = solvedT > 0 ? Math.max(0, Math.sin(Math.min(1, solvedT * 2 - ((i % N) + Math.floor(i / N)) * 0.03) * Math.PI)) * 2 : 0;
            c.fillStyle = col; c.fillRect(x - pop, y - pop, cs + 0.5 + pop * 2, cs + 0.5 + pop * 2);
          } else {
            c.fillStyle = hl && ci === sel ? 'rgba(124,58,237,.18)' : ((i % N) + Math.floor(i / N)) % 2 ? '#fafaf9' : '#f5f5f4'; c.fillRect(x, y, cs, cs);
            if (flash[i]) { c.fillStyle = 'rgba(239,68,68,' + flash[i] + ')'; c.fillRect(x, y, cs, cs); }
            if (!(api.diff === 1 && ci === 0)) { c.fillStyle = ci === sel ? '#6d28d9' : '#a8a29e'; c.fillText(ci + 1, x + cs / 2, y + cs / 2 + 1); }
          }
        }
        if (solvedT <= 0) { c.strokeStyle = 'rgba(0,0,0,.06)'; c.lineWidth = 1; for (var k = 1; k < N; k++) { c.beginPath(); c.moveTo(ox + k * cs, oy); c.lineTo(ox + k * cs, oy + N * cs); c.moveTo(ox, oy + k * cs); c.lineTo(ox + N * cs, oy + k * cs); c.stroke(); } }
        colors.forEach(function (ch, i) {
          var r = palRect(i), n = left(i), on = i === sel;
          c.save(); if (on) { c.shadowColor = P[ch]; c.shadowBlur = 14; }
          K.rr(c, r[0], r[1] - (on ? 6 : 0), r[2], r[3], r[2] * 0.3); c.fillStyle = P[ch]; c.fill(); c.restore();
          K.rr(c, r[0], r[1] - (on ? 6 : 0), r[2], r[3], r[2] * 0.3); c.strokeStyle = on ? '#6d28d9' : 'rgba(0,0,0,.15)'; c.lineWidth = on ? 3 : 1.5; c.stroke();
          var hx = P[ch].length === 4 ? '#' + P[ch][1] + P[ch][1] + P[ch][2] + P[ch][2] + P[ch][3] + P[ch][3] : P[ch];
          var lum = parseInt(hx.slice(1, 3), 16) * 0.3 + parseInt(hx.slice(3, 5), 16) * 0.59 + parseInt(hx.slice(5, 7), 16) * 0.11;
          c.fillStyle = lum > 150 ? '#1c1917' : '#fff'; c.font = '900 ' + Math.round(r[2] * 0.36) + 'px system-ui'; c.fillText(n ? i + 1 : '✓', r[0] + r[2] / 2, r[1] + r[3] / 2 - (on ? 6 : 0));
          if (n) { c.font = '700 10px system-ui'; c.fillStyle = '#78350f'; c.fillText(n, r[0] + r[2] / 2, r[1] + r[3] + 9); }
        });
      }
    };
  }
};
