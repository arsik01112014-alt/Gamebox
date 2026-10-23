/* Пятнашки: собери плитки по порядку */
window.GAMES = window.GAMES || {};
window.GAMES.puzzle15 = {
  title: 'Пятнашки',
  desc: 'Расставь плитки по порядку',
  hint: 'Тапни по плитке рядом с пустой клеткой или в том же ряду/столбце — плитки сдвинутся. Собери числа по порядку слева направо, сверху вниз. Чем быстрее и меньше ходов — тем больше очков.',
  d0: 'Поле 3×3', d1: 'Поле 4×4', d2: 'Поле 4×4, без подсказок цветом', d3: 'Поле 5×5',
  colors: ['#0ea5e9', '#6366f1'],
  controls: 'none',
  isNew3: true,
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="p15t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#475569"/><stop offset="1" stop-co' +
    'lor="#1e293b"/></linearGradient></defs><rect x="6" y="6" width="88" height="88" rx="14" fill="url(#p15t)"/><rect x="11" y="11" width="78" height="78" ' +
    'rx="8" fill="#0b1020"/><g font-family="system-ui,sans-serif" font-weight="900" font-size="15" text-anchor="middle"><rect x="13" y="13" width="22" heig' +
    'ht="22" rx="5" fill="hsl(200,75%,36%)"/><rect x="13" y="13" width="22" height="19" rx="5" fill="hsl(200,75%,62%)"/><rect x="13.5" y="13.5" width="21" ' +
    'height="18" rx="4.5" fill="none" stroke="rgba(255,255,255,.45)"/><text x="24" y="29" fill="rgba(255,255,255,.5)">1</text><text x="24" y="28" fill="hsl' +
    '(200,75%,20%)">1</text><rect x="39" y="13" width="22" height="22" rx="5" fill="hsl(200,75%,36%)"/><rect x="39" y="13" width="22" height="19" rx="5" fi' +
    'll="hsl(200,75%,62%)"/><rect x="39.5" y="13.5" width="21" height="18" rx="4.5" fill="none" stroke="rgba(255,255,255,.45)"/><text x="50" y="29" fill="r' +
    'gba(255,255,255,.5)">2</text><text x="50" y="28" fill="hsl(200,75%,20%)">2</text><rect x="65" y="13" width="22" height="22" rx="5" fill="hsl(200,75%,3' +
    '6%)"/><rect x="65" y="13" width="22" height="19" rx="5" fill="hsl(200,75%,62%)"/><rect x="65.5" y="13.5" width="21" height="18" rx="4.5" fill="none" s' +
    'troke="rgba(255,255,255,.45)"/><text x="76" y="29" fill="rgba(255,255,255,.5)">3</text><text x="76" y="28" fill="hsl(200,75%,20%)">3</text><rect x="13' +
    '" y="39" width="22" height="22" rx="5" fill="hsl(225,75%,30%)"/><rect x="13" y="39" width="22" height="19" rx="5" fill="hsl(225,75%,56%)"/><rect x="13' +
    '.5" y="39.5" width="21" height="18" rx="4.5" fill="none" stroke="rgba(255,255,255,.45)"/><text x="24" y="55" fill="rgba(255,255,255,.5)">4</text><text' +
    ' x="24" y="54" fill="hsl(225,75%,20%)">4</text><rect x="39" y="39" width="22" height="22" rx="5" fill="hsl(225,75%,30%)"/><rect x="39" y="39" width="2' +
    '2" height="19" rx="5" fill="hsl(225,75%,56%)"/><rect x="39.5" y="39.5" width="21" height="18" rx="4.5" fill="none" stroke="rgba(255,255,255,.45)"/><te' +
    'xt x="50" y="55" fill="rgba(255,255,255,.5)">5</text><text x="50" y="54" fill="hsl(225,75%,20%)">5</text><rect x="13" y="65" width="22" height="22" rx' +
    '="5" fill="hsl(250,75%,30%)"/><rect x="13" y="65" width="22" height="19" rx="5" fill="hsl(250,75%,56%)"/><rect x="13.5" y="65.5" width="21" height="18' +
    '" rx="4.5" fill="none" stroke="rgba(255,255,255,.45)"/><text x="24" y="81" fill="rgba(255,255,255,.5)">7</text><text x="24" y="80" fill="hsl(250,75%,2' +
    '0%)">7</text><rect x="65" y="65" width="22" height="22" rx="5" fill="hsl(250,75%,30%)"/><rect x="65" y="65" width="22" height="19" rx="5" fill="hsl(25' +
    '0,75%,56%)"/><rect x="65.5" y="65.5" width="21" height="18" rx="4.5" fill="none" stroke="rgba(255,255,255,.45)"/><text x="76" y="81" fill="rgba(255,25' +
    '5,255,.5)">8</text><text x="76" y="80" fill="hsl(250,75%,20%)">8</text></g><circle cx="10" cy="10" r="1.6" fill="#cbd5e1"/><circle cx="90" cy="10" r="' +
    '1.6" fill="#cbd5e1"/><circle cx="10" cy="90" r="1.6" fill="#cbd5e1"/><circle cx="90" cy="90" r="1.6" fill="#cbd5e1"/></svg>',

  create: function (api) {
    var N, tiles, empty, moves, time, done, endT, cs, bx, by, t, anim, solvedOnce;
    function layout() {
      var size = Math.min(api.W - 44, api.H - 160);
      cs = size / N; bx = (api.W - size) / 2; by = 84 + (api.H - 130 - size) / 2;
      build();
    }
    // ---------- графика ----------
    var dpr = 1, bgL = null, trayL = null, tileC = {}, lw = 0, lh = 0, PAD = 12;
    function mkC(w, h) {
      var o = document.createElement('canvas');
      o.width = Math.max(1, Math.ceil(w * dpr)); o.height = Math.max(1, Math.ceil(h * dpr));
      var x = o.getContext('2d'); x.scale(dpr, dpr); return o;
    }
    function rr(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }
    function seedRnd(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
    function build() {
      var W = api.W, H = api.H, sz = cs * N, g, i, rnd = seedRnd(11);
      dpr = Math.min(2, window.devicePixelRatio || 1); lw = W; lh = H; tileC = {};
      bgL = mkC(W, H); var c = bgL.getContext('2d');
      g = c.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#0b1736'); g.addColorStop(0.5, '#1a1650'); g.addColorStop(1, '#0a0a24');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (i = 0; i < 18; i++) {
        var bxx = rnd() * W, byy = rnd() * H, br = 20 + rnd() * 70;
        g = c.createRadialGradient(bxx, byy, 0, bxx, byy, br);
        var hue = 200 + rnd() * 80;
        g.addColorStop(0, 'hsla(' + hue + ',80%,60%,' + (0.05 + rnd() * 0.07) + ')'); g.addColorStop(1, 'hsla(' + hue + ',80%,60%,0)');
        c.fillStyle = g; c.beginPath(); c.arc(bxx, byy, br, 0, 6.283); c.fill();
      }
      c.strokeStyle = 'rgba(255,255,255,.03)'; c.lineWidth = 1;
      for (i = 0; i < W; i += 24) { c.beginPath(); c.moveTo(i + 0.5, 0); c.lineTo(i + 0.5, H); c.stroke(); }
      for (i = 0; i < H; i += 24) { c.beginPath(); c.moveTo(0, i + 0.5); c.lineTo(W, i + 0.5); c.stroke(); }
      g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.6)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // лоток
      trayL = mkC(W, H); c = trayL.getContext('2d');
      var ox = bx - PAD, oy = by - PAD, ow = sz + PAD * 2;
      c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 26; c.shadowOffsetY = 14;
      g = c.createLinearGradient(0, oy, 0, oy + ow);
      g.addColorStop(0, '#475569'); g.addColorStop(0.5, '#334155'); g.addColorStop(1, '#1e293b');
      c.fillStyle = g; rr(c, ox, oy, ow, ow, 20); c.fill(); c.restore();
      // матовая текстура
      c.save(); rr(c, ox, oy, ow, ow, 20); c.clip();
      for (i = 0; i < ow * ow / 14; i++) { c.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.08)'; c.fillRect(ox + rnd() * ow, oy + rnd() * ow, 1, 1); }
      c.restore();
      g = c.createLinearGradient(0, oy, 0, oy + ow);
      g.addColorStop(0, 'rgba(255,255,255,.4)'); g.addColorStop(0.3, 'rgba(255,255,255,.05)'); g.addColorStop(1, 'rgba(0,0,0,.4)');
      c.strokeStyle = g; c.lineWidth = 1.5; rr(c, ox + 0.75, oy + 0.75, ow - 1.5, ow - 1.5, 20); c.stroke();
      // углубление
      var ix = bx - 3, iy = by - 3, iw = sz + 6;
      c.fillStyle = '#0b1020'; rr(c, ix, iy, iw, iw, 12); c.fill();
      c.save(); rr(c, ix, iy, iw, iw, 12); c.clip();
      g = c.createLinearGradient(0, iy, 0, iy + iw); g.addColorStop(0, '#0a0f1e'); g.addColorStop(1, '#151d33');
      c.fillStyle = g; c.fillRect(ix, iy, iw, iw);
      c.strokeStyle = 'rgba(255,255,255,.035)';
      for (i = 1; i < N; i++) { c.beginPath(); c.moveTo(bx + i * cs, by); c.lineTo(bx + i * cs, by + sz); c.stroke(); c.beginPath(); c.moveTo(bx, by + i * cs); c.lineTo(bx + sz, by + i * cs); c.stroke(); }
      c.shadowColor = 'rgba(0,0,0,.9)'; c.shadowBlur = 14; c.shadowOffsetY = 5; c.lineWidth = 12; c.strokeStyle = '#000';
      rr(c, ix - 6, iy - 6, iw + 12, iw + 12, 16); c.stroke(); c.restore();
      c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1; rr(c, ix - 0.5, iy - 0.5, iw + 1, iw + 1, 12.5); c.stroke();
      // винты
      [[ox + 8, oy + 8], [ox + ow - 8, oy + 8], [ox + 8, oy + ow - 8], [ox + ow - 8, oy + ow - 8]].forEach(function (p) {
        var sg = c.createRadialGradient(p[0] - 1, p[1] - 1, 0.3, p[0], p[1], 3);
        sg.addColorStop(0, '#e2e8f0'); sg.addColorStop(1, '#475569');
        c.fillStyle = sg; c.beginPath(); c.arc(p[0], p[1], 2.8, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(15,23,42,.7)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(p[0] - 1.8, p[1] - 1.8); c.lineTo(p[0] + 1.8, p[1] + 1.8); c.stroke();
      });
    }
    function tileSprite(v, hue, L, sat, ok) {
      var key = v + '|' + hue + '|' + L + '|' + ok;
      if (tileC[key]) return tileC[key];
      var o = mkC(cs, cs), c = o.getContext('2d'), m = 3, w = cs - 6, rad = cs * 0.14, dep = Math.max(3, cs * 0.06), g;
      c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 6; c.shadowOffsetY = 3;
      c.fillStyle = 'hsl(' + hue + ',' + sat + '%,' + (L - 22) + '%)'; rr(c, m, m, w, w, rad); c.fill(); c.restore();
      // лицевая сторона
      g = c.createLinearGradient(0, m, 0, m + w - dep);
      g.addColorStop(0, 'hsl(' + hue + ',' + sat + '%,' + (L + 12) + '%)'); g.addColorStop(1, 'hsl(' + hue + ',' + sat + '%,' + (L - 6) + '%)');
      c.fillStyle = g; rr(c, m, m, w, w - dep, rad); c.fill();
      // фаска
      var fi = Math.max(2.5, cs * 0.07);
      g = c.createLinearGradient(0, m + fi, 0, m + w - dep - fi);
      g.addColorStop(0, 'hsl(' + hue + ',' + sat + '%,' + (L + 4) + '%)'); g.addColorStop(1, 'hsl(' + hue + ',' + sat + '%,' + (L - 2) + '%)');
      c.fillStyle = g; rr(c, m + fi, m + fi, w - fi * 2, w - dep - fi * 2, rad * 0.7); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.2; rr(c, m + 0.6, m + 0.6, w - 1.2, w - dep - 1.2, rad); c.stroke();
      // глазурь
      c.save(); rr(c, m + fi, m + fi, w - fi * 2, w - dep - fi * 2, rad * 0.7); c.clip();
      g = c.createLinearGradient(0, m, 0, m + w * 0.5);
      g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.beginPath(); c.ellipse(m + w * 0.35, m, w * 0.7, w * 0.42, 0, 0, 6.283); c.fill(); c.restore();
      // гравированная цифра
      var fs = Math.round(cs * (v > 9 ? 0.38 : 0.44)), tx = cs / 2, ty = m + (w - dep) / 2 + 1;
      c.font = '900 ' + fs + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = 'rgba(255,255,255,.55)'; c.fillText(String(v), tx, ty + 1.5);
      c.fillStyle = 'hsl(' + hue + ',' + sat + '%,' + Math.max(10, L - 30) + '%)'; c.fillText(String(v), tx, ty);
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillText(String(v), tx, ty - 0.8);
      if (ok) { c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(m + w - fi - 5, m + fi + 5, 2.6, 0, 6.283); c.fill(); }
      c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      tileC[key] = o; return o;
    }
    function solved() { for (var i = 0; i < N * N - 1; i++) if (tiles[i] !== i + 1) return false; return true; }
    function shuffle() {
      tiles = []; for (var i = 1; i < N * N; i++) tiles.push(i); tiles.push(0);
      empty = N * N - 1;
      var last = -1, steps = N * N * 40;
      for (var k = 0; k < steps; k++) {
        var er = Math.floor(empty / N), ec = empty % N, opts = [];
        [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(function (d) { var r = er + d[0], c = ec + d[1]; if (r >= 0 && c >= 0 && r < N && c < N && r * N + c !== last) opts.push(r * N + c); });
        var nx = opts[Math.floor(Math.random() * opts.length)];
        tiles[empty] = tiles[nx]; tiles[nx] = 0; last = empty; empty = nx;
      }
      if (solved()) shuffle();
    }
    function slide(i) {
      var r = Math.floor(i / N), c = i % N, er = Math.floor(empty / N), ec = empty % N;
      if (r !== er && c !== ec) return false;
      if (i === empty) return false;
      var step = r === er ? (c > ec ? 1 : -1) : (r > er ? N : -N);
      while (empty !== i) {
        var nx = empty + step;
        tiles[empty] = tiles[nx]; anim[empty] = { from: nx, k: 0 }; tiles[nx] = 0; empty = nx;
      }
      moves++;
      api.tone(520 + Math.random() * 80, 0.04, 'triangle', 0.05); api.vibrate(6);
      if (solved()) {
        done = true; endT = 2;
        var base = [600, 1500, 2000, 3500][api.diff];
        api.addScore(Math.max(100, base + Math.max(0, 300 - Math.floor(time)) * (api.diff + 1) * 3 - moves * 2));
        api.sound('win'); api.fx.confetti(100);
      }
      return true;
    }
    return {
      reset: function () {
        N = [3, 4, 4, 5][api.diff]; moves = 0; time = 0; done = false; endT = 0; t = 0; anim = {};
        shuffle(); layout();
      },
      resize: layout,
      idle: function (dt) { t += dt; },
      key: function (k, d) {
        if (!d || done) return;
        var er = Math.floor(empty / N), ec = empty % N, target = -1;
        if (k === 'left' && ec < N - 1) target = empty + 1;
        if (k === 'right' && ec > 0) target = empty - 1;
        if (k === 'up' && er < N - 1) target = empty + N;
        if (k === 'down' && er > 0) target = empty - N;
        if (target >= 0) slide(target);
      },
      input: function (type, d) {
        if (done) return;
        if (type === 'tap' || type === 'down') {
          if (type === 'tap') return;
          var c = Math.floor((d.x - bx) / cs), r = Math.floor((d.y - by) / cs);
          if (r < 0 || c < 0 || r >= N || c >= N) return;
          slide(r * N + c);
        }
      },
      update: function (dt) {
        t += dt;
        for (var k in anim) { anim[k].k += dt * 10; if (anim[k].k >= 1) delete anim[k]; }
        if (done) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        time += dt;
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        if (!bgL || lw !== W || lh !== H) layout();
        c.drawImage(bgL, 0, 0, W, H);
        // HUD
        var tm = Math.floor(time / 60) + ':' + ('0' + Math.floor(time % 60)).slice(-2), mv = api.t('memory.moves') + ': ' + moves;
        c.font = '800 16px system-ui, sans-serif'; c.textBaseline = 'middle';
        var w1 = c.measureText(tm).width + 46, w2 = c.measureText(mv).width + 30;
        [[12, w1], [W - 12 - w2, w2]].forEach(function (p) {
          var pg = c.createLinearGradient(0, 10, 0, 46); pg.addColorStop(0, 'rgba(255,255,255,.14)'); pg.addColorStop(1, 'rgba(255,255,255,.04)');
          c.fillStyle = pg; rr(c, p[0], 10, p[1], 36, 18); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.15)'; c.lineWidth = 1; c.stroke();
        });
        // часики
        var cx = 12 + 20, cy = 28;
        c.strokeStyle = '#7dd3fc'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, 8, 0, 6.283); c.stroke();
        c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, cy - 5); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(time * 2) * 4, cy + Math.sin(time * 2) * 4); c.stroke(); c.lineCap = 'butt';
        c.fillStyle = '#fff'; c.textAlign = 'left'; c.fillText(tm, 12 + 34, 29);
        c.textAlign = 'center'; c.fillText(mv, W - 12 - w2 / 2, 29);
        c.drawImage(trayL, 0, 0, W, H);
        for (var i = 0; i < N * N; i++) {
          var v = tiles[i]; if (!v) continue;
          var r = Math.floor(i / N), cc = i % N, x = bx + cc * cs, y = by + r * cs;
          if (anim[i]) {
            var f = anim[i].from, a = Math.min(1, anim[i].k), k2 = 1 + 2.2 * Math.pow(a - 1, 3) + 1.2 * Math.pow(a - 1, 2);
            x = bx + (f % N + (cc - f % N) * k2) * cs; y = by + (Math.floor(f / N) + (r - Math.floor(f / N)) * k2) * cs;
          }
          var right = v === i + 1, row = Math.floor((v - 1) / N);
          var hue = done ? 142 : api.diff === 2 ? 230 : 200 + row * 25;
          var L = done ? 50 : right && api.diff !== 2 ? 60 : 48;
          c.drawImage(tileSprite(v, hue, L, done ? 70 : 75, right && api.diff !== 2 && !done), x, y, cs, cs);
        }
        // блеск при сборке
        if (done) {
          var sz = cs * N, sp = ((2 - endT) * 1.2) % 1.4 - 0.2;
          c.save(); c.beginPath(); c.rect(bx, by, sz, sz); c.clip();
          var sg = c.createLinearGradient(bx + sz * (sp - 0.2), by, bx + sz * (sp + 0.2), by + sz);
          sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,.35)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
          c.fillStyle = sg; c.fillRect(bx, by, sz, sz); c.restore();
        }
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      }
    };
  }
};
