/* 2048 */
window.GAMES = window.GAMES || {};
window.GAMES.g2048 = {
  title: '2048',
  desc: 'Соединяй одинаковые плитки',
  hint: 'Свайпай в любую сторону — все плитки сдвинутся. Две одинаковые сливаются в одну. Собери плитку 2048!',
  colors: ['#f59e0b', '#d946ef'],
  controls: 'none',
  liveSwipe: 'once',
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="g2048a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fef3c7"/><stop offset="1" stop-color="#fbbf24"/></linearGradient><linearGradient id="g2048b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdba74"/><stop offset="1" stop-color="#ea580c"/></linearGradient><linearGradient id="g2048c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbcfe8"/><stop offset="1" stop-color="#db2777"/></linearGradient><linearGradient id="g2048d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fef08a"/><stop offset="1" stop-color="#eab308"/></linearGradient></defs><rect x="8" y="8" width="84" height="84" rx="14" fill="#3b2f2f" opacity=".35"/>' +
    '<rect x="14" y="14" width="34" height="34" rx="8" fill="url(#g2048a)" stroke="#0002" stroke-width="1.5"/><rect x="52" y="14" width="34" height="34" rx="8" fill="url(#g2048b)" stroke="#0002" stroke-width="1.5"/>' +
    '<rect x="14" y="52" width="34" height="34" rx="8" fill="url(#g2048c)" stroke="#0002" stroke-width="1.5"/><rect x="52" y="52" width="34" height="34" rx="8" fill="url(#g2048d)" stroke="#0002" stroke-width="1.5"/>' +
    '<g font-family="system-ui,sans-serif" font-weight="900" text-anchor="middle">' +
    '<text x="31" y="38" font-size="20" fill="#78350f">2</text><text x="69" y="38" font-size="20" fill="#fff">8</text>' +
    '<text x="31" y="76" font-size="15" fill="#fff">64</text><text x="69" y="75" font-size="11" fill="#fff">2048</text></g></svg>',

  create: function (api) {
    var N = 4, ANIM = 0.11;
    // v2.0: отмены и молоток на всех сложностях (с ограничением), очки за слияния всплывают
    var DIFF = [{ n: 5, four: 0.1, undo: 99, ham: 3 }, { n: 4, four: 0.1, undo: 3, ham: 1 }, { n: 4, four: 0.4, undo: 1, ham: 1 }, { n: 3, four: 0.15, undo: 0, ham: 0 }];
    var D = DIFF[1], hist = null, moves = 0, undoRect = null, sparks = [];
    var undos, hammers, hamRect, hamMode, nextHam;
    var STYLE = {
      2: ['#fef3c7', '#78350f'], 4: ['#fde68a', '#78350f'], 8: ['#fdba74', '#fff'], 16: ['#fb923c', '#fff'],
      32: ['#f87171', '#fff'], 64: ['#ef4444', '#fff'], 128: ['#f472b6', '#fff'], 256: ['#e879f9', '#fff'],
      512: ['#c084fc', '#fff'], 1024: ['#818cf8', '#fff'], 2048: ['#facc15', '#fff'], 4096: ['#22d3ee', '#fff'],
      8192: ['#14b8a6', '#fff'], 16384: ['#0ea5e9', '#fff']
    };
    var tiles, ghosts, anim, t, uid, size, gap, cs, bx, by, won, over, overT, best, flash;

    function at(r, c) {
      for (var i = 0; i < tiles.length; i++) if (tiles[i].r === r && tiles[i].c === c) return tiles[i];
      return null;
    }
    function empty() {
      var e = [];
      for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) if (!at(r, c)) e.push([r, c]);
      return e;
    }
    function spawn(delay) {
      var e = empty();
      if (!e.length) return;
      var p = e[Math.floor(Math.random() * e.length)];
      tiles.push({ id: uid++, v: Math.random() < 1 - D.four ? 2 : 4, r: p[0], c: p[1], pr: p[0], pc: p[1], born: delay ? -ANIM / 0.15 : 0, pop: 0 });
    }
    function canMove() {
      if (empty().length) return true;
      for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
        var v = at(r, c).v;
        if (c < N - 1 && at(r, c + 1).v === v) return true;
        if (r < N - 1 && at(r + 1, c).v === v) return true;
      }
      return false;
    }
    function layout() {
      size = Math.floor(Math.min(api.W - 28, api.H - 200, 520));
      gap = Math.round(size * 0.03);
      cs = (size - gap * (N + 1)) / N;
      bx = Math.round((api.W - size) / 2);
      by = Math.round((api.H - size) / 2 + 30);
    }
    function move(dir) {
      if (over) return;
      var d = { left: [0, -1], right: [0, 1], up: [-1, 0], down: [1, 0] }[dir];
      if (!d) return;
      ghosts = [];
      tiles.forEach(function (tl) { tl.pr = tl.r; tl.pc = tl.c; tl.merged = false; tl.pop = 0; tl.born = 1; });
      var rows = [], cols = [];
      for (var q = 0; q < N; q++) { rows.push(q); cols.push(q); }
      var snap = !undos ? null : { tiles: tiles.map(function (tl) { return { id: tl.id, v: tl.v, r: tl.r, c: tl.c }; }), score: api.getScore(), best: best, moves: moves };
      if (d[0] === 1) rows.reverse();
      if (d[1] === 1) cols.reverse();
      var moved = false, gained = 0, mergesN = 0;
      rows.forEach(function (r) {
        cols.forEach(function (c) {
          var tl = at(r, c);
          if (!tl) return;
          var nr = r, nc = c;
          while (true) {
            var tr = nr + d[0], tc = nc + d[1];
            if (tr < 0 || tr >= N || tc < 0 || tc >= N) break;
            var o = at(tr, tc);
            if (!o) { nr = tr; nc = tc; continue; }
            if (o.v === tl.v && !o.merged) {
              tl.r = tr; tl.c = tc;
              tiles.splice(tiles.indexOf(tl), 1); ghosts.push(tl);
              o.v *= 2; o.merged = true; o.pop = 1; gained += o.v; mergesN++;
              var sp = pos(tr, tc);
              if (o.v >= 32) api.fx.text(sp[0] + cs / 2, sp[1] + cs * 0.2, '+' + o.v, (STYLE[o.v] || ['#fff'])[0], Math.min(24, 12 + Math.log2(o.v)));
              for (var k2 = 0; k2 < 8; k2++) { var a2 = Math.random() * 6.283; sparks.push({ x: sp[0] + cs / 2, y: sp[1] + cs / 2, vx: Math.cos(a2) * cs * 3, vy: Math.sin(a2) * cs * 3, life: 0.45, col: (STYLE[o.v] || ['#fff'])[0] }); }
              moved = true;
              return;
            }
            break;
          }
          if (nr !== r || nc !== c) { tl.r = nr; tl.c = nc; moved = true; }
        });
      });
      if (!moved) return;
      hist = snap;
      moves++;
      anim = ANIM;
      spawn(true);
      if (mergesN >= 3) { api.addScore(mergesN * 4); api.fx.text(bx + size / 2, by - 8, api.t('g2048.multi', mergesN), '#fde047', 18); }
      if (gained) {
        api.addScore(gained);
        api.sound(gained >= 128 ? 'bonus' : 'eat');
        api.vibrate(10);
      } else api.sound('move');
      tiles.forEach(function (tl) {
        if (tl.v > best && tl.v >= nextHam) { nextHam = tl.v * 2; if (D.ham) { hammers++; api.toast(api.t('g2048.hamGot')); } }
        if (tl.v > best) best = tl.v;
        if (tl.v === 2048 && !won) { won = true; flash = 1; api.toast(api.t('g2048.win')); api.sound('win'); }
      });
      if (!canMove()) { over = true; overT = 1.2; api.sound('hit'); api.vibrate(150); }
    }
    function rr(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }
    /* пререндер: фон+поле, спрайты плиток (со свечением и цифрой) */
    var tcache = {}, boardOff = null, boardKey = '';
    function DPR() { return Math.min(2, window.devicePixelRatio || 1); }
    function mk(w, h) { var d = DPR(), o = document.createElement('canvas'); o.width = Math.ceil(w * d); o.height = Math.ceil(h * d); var q = o.getContext('2d'); q.scale(d, d); o.q = q; return o; }
    function shade(hex, k) {
      var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
      function f(v) { return Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); }
      return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
    }
    function tileSprite(v) {
      if (tcache[v]) return tcache[v];
      var st = STYLE[v] || ['#0f172a', '#fff'], P = Math.round(cs * 0.25), S = cs + P * 2;
      var o = mk(S, S), c = o.q, R = cs * 0.14, dep = Math.max(2, cs * 0.05);
      if (v >= 128 && api.quality > 0) { // свечение — один раз в кэш
        c.save(); c.shadowColor = st[0]; c.shadowBlur = v >= 1024 ? cs * 0.3 : cs * 0.16;
        c.fillStyle = st[0]; rr(c, P, P, cs, cs, R); c.fill(); c.restore();
      }
      c.fillStyle = 'rgba(0,0,0,.28)'; rr(c, P, P + dep + 1.5, cs, cs - dep, R); c.fill();      // тень
      c.fillStyle = shade(st[0], -0.28); rr(c, P, P + dep, cs, cs - dep, R); c.fill();          // боковина
      var g = c.createLinearGradient(0, P, 0, P + cs - dep);
      g.addColorStop(0, shade(st[0], 0.22)); g.addColorStop(1, shade(st[0], -0.06));
      c.fillStyle = g; rr(c, P, P, cs, cs - dep, R); c.fill();
      c.fillStyle = 'rgba(255,255,255,.22)'; rr(c, P + cs * 0.05, P + cs * 0.04, cs * 0.9, cs * 0.36, R * 0.8); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1; rr(c, P + 0.5, P + 0.5, cs - 1, cs - dep - 1, R); c.stroke();
      if (v >= 2048) { // звёздочки на топовых плитках
        c.fillStyle = 'rgba(255,255,255,.75)';
        [[0.18, 0.2, 0.06], [0.82, 0.78, 0.045], [0.8, 0.22, 0.035]].forEach(function (q) { var x = P + cs * q[0], y = P + cs * q[1], r = cs * q[2]; c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.3, y - r * 0.3); c.lineTo(x + r, y); c.lineTo(x + r * 0.3, y + r * 0.3); c.lineTo(x, y + r); c.lineTo(x - r * 0.3, y + r * 0.3); c.lineTo(x - r, y); c.lineTo(x - r * 0.3, y - r * 0.3); c.fill(); });
      }
      var txt = String(v), fs = cs * (txt.length < 3 ? 0.5 : txt.length === 3 ? 0.4 : 0.3);
      c.font = '900 ' + Math.round(fs) + 'px system-ui, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      var tx = P + cs / 2, ty = P + (cs - dep) / 2 + fs * 0.05;
      c.fillStyle = st[1] === '#fff' ? 'rgba(0,0,0,.22)' : 'rgba(255,255,255,.5)'; c.fillText(txt, tx, ty + Math.max(1.5, fs * 0.05));
      c.fillStyle = st[1]; c.fillText(txt, tx, ty);
      o.P = P; o.S = S; tcache[v] = o; return o;
    }
    function drawTile(c, tl, x, y, scale) {
      var sp = tileSprite(tl.v), s = cs * scale, ox = x + (cs - s) / 2, oy = y + (cs - s) / 2;
      c.drawImage(sp, ox - sp.P * scale, oy - sp.P * scale, sp.S * scale, sp.S * scale);
    }
    function buildBoard() {
      var W = api.W, H = api.H; boardKey = W + 'x' + H + ':' + size + ':' + N; tcache = {};
      var o = mk(W, H), c = o.q;
      var g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#2d1b40'); g.addColorStop(1, '#100a1c'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      var rg = c.createRadialGradient(W / 2, by + size / 2, size * 0.2, W / 2, by + size / 2, size * 1.1);
      rg.addColorStop(0, 'rgba(232,121,249,.16)'); rg.addColorStop(1, 'rgba(232,121,249,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(255,255,255,.025)'; c.lineWidth = 14;
      for (var d2 = -H; d2 < W; d2 += 46) { c.beginPath(); c.moveTo(d2, 0); c.lineTo(d2 + H, H); c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,.05)';
      for (var i = 0; i < 40; i++) { c.beginPath(); c.arc((i * 137.5) % W, (i * 71.3) % H, 0.6 + (i % 3) * 0.5, 0, 6.283); c.fill(); }
      var v = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
      // поле
      var R = gap * 1.6;
      c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 30; c.shadowOffsetY = 10;
      c.fillStyle = '#2a1c3b'; rr(c, bx, by, size, size, R); c.fill(); c.restore();
      var bg2 = c.createLinearGradient(0, by, 0, by + size);
      bg2.addColorStop(0, '#46325d'); bg2.addColorStop(1, '#33233f');
      c.fillStyle = bg2; rr(c, bx, by, size, size, R); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1.5; rr(c, bx + 0.75, by + 0.75, size - 1.5, size - 1.5, R); c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; rr(c, bx + 3, by + 3, size - 6, size - 6, R * 0.8); c.stroke();
      for (var r = 0; r < N; r++) for (var cc = 0; cc < N; cc++) {
        var p = pos(r, cc), cr = cs * 0.14;
        c.fillStyle = 'rgba(15,8,25,.45)'; rr(c, p[0], p[1], cs, cs, cr); c.fill();
        c.fillStyle = 'rgba(255,255,255,.05)'; rr(c, p[0], p[1] + 2, cs, cs - 2, cr); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 1; rr(c, p[0] + 0.5, p[1] + 0.5, cs - 1, cs - 1, cr); c.stroke();
      }
      boardOff = o;
    }
    function pillBtn(c, x, y, w, h, top, bot, on) {
      if (on) { c.fillStyle = 'rgba(0,0,0,.35)'; rr(c, x, y + 4, w, h, h / 2); c.fill(); }
      var g = c.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, top); g.addColorStop(1, bot);
      c.fillStyle = g; rr(c, x, y, w, h, h / 2); c.fill();
      if (on) { c.fillStyle = 'rgba(255,255,255,.25)'; rr(c, x + h * 0.3, y + 3, w - h * 0.6, h * 0.32, h * 0.16); c.fill(); }
      c.strokeStyle = on ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.1)'; c.lineWidth = 1; rr(c, x + 0.5, y + 0.5, w - 1, h - 1, h / 2); c.stroke();
    }
    function pos(r, c) { return [bx + gap + c * (cs + gap), by + gap + r * (cs + gap)]; }

    return {
      reset: function () {
        D = DIFF[api.diff]; N = D.n; hist = null; moves = 0; sparks = [];
        layout();
        tiles = []; ghosts = []; anim = 0; t = 0; uid = 1; won = false; over = false; overT = 0; best = 2; flash = 0;
        undos = D.undo; hammers = D.ham; hamMode = false; nextHam = 256; hamRect = null;
        spawn(); spawn();
      },
      resize: layout,
      idle: function (dt) { t += dt; },
      key: function (k, down) { if (down) move(k); },
      input: function (type, d) {
        function inR(R) { return R && d.x > R[0] && d.x < R[0] + R[2] && d.y > R[1] && d.y < R[1] + R[3]; }
        if (type === 'swipe') { hamMode = false; move(d.dir); }
        else if (type === 'tap' && inR(undoRect) && hist && !over && undos > 0) {
          tiles = hist.tiles.map(function (o) { return { id: o.id, v: o.v, r: o.r, c: o.c, pr: o.r, pc: o.c, born: 1, pop: 0 }; });
          api.setScore(hist.score); best = hist.best; moves = hist.moves; hist = null; ghosts = []; anim = 0; undos--;
          api.sound('rotate'); api.vibrate(15);
        } else if (type === 'tap' && inR(hamRect) && hammers > 0 && !over) {
          hamMode = !hamMode; api.sound('click');
        } else if (type === 'tap' && hamMode) {
          var c0 = Math.floor((d.x - bx - gap / 2) / (cs + gap)), r0 = Math.floor((d.y - by - gap / 2) / (cs + gap));
          var tl = r0 >= 0 && r0 < N && c0 >= 0 && c0 < N ? at(r0, c0) : null;
          if (tl && tiles.length > 1) {
            tiles.splice(tiles.indexOf(tl), 1); hammers--; hamMode = false; hist = null;
            var p = pos(r0, c0);
            api.fx.burst(p[0] + cs / 2, p[1] + cs / 2, (STYLE[tl.v] || ['#fff'])[0], 18, 220, 4); api.fx.shake(5);
            api.sound('break'); api.vibrate(40);
          }
        }
      },
      update: function (dt) {
        t += dt;
        if (flash > 0) flash -= dt;
        if (anim > 0) { anim -= dt; if (anim <= 0) { anim = 0; ghosts = []; } }
        for (var q = sparks.length - 1; q >= 0; q--) { var sk = sparks[q]; sk.x += sk.vx * dt; sk.y += sk.vy * dt; sk.vx *= 0.9; sk.vy *= 0.9; sk.life -= dt; if (sk.life <= 0) sparks.splice(q, 1); }
        tiles.forEach(function (tl) {
          if (tl.born < 1) tl.born = Math.min(1, tl.born + dt / 0.15);
          if (anim === 0 && tl.pop > 0) tl.pop = Math.max(0, tl.pop - dt / 0.18);
        });
        if (over) { overT -= dt; if (overT <= 0) api.gameOver(); }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        if (!boardOff || boardKey !== W + 'x' + H + ':' + size + ':' + N) buildBoard();
        c.drawImage(boardOff, 0, 0, W, H);
        // заголовок
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        c.font = '900 ' + Math.round(size * 0.13) + 'px system-ui, sans-serif';
        var tg = c.createLinearGradient(bx, 0, bx + size * 0.5, 0);
        tg.addColorStop(0, '#fbbf24'); tg.addColorStop(1, '#e879f9');
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillText('2048', bx + 2, by - 19);
        c.fillStyle = tg; c.fillText('2048', bx, by - 22);
        c.textAlign = 'right'; c.font = '700 ' + Math.round(size * 0.04) + 'px system-ui, sans-serif';
        c.fillStyle = 'rgba(255,255,255,.55)'; c.fillText(api.t('g2048.bestTile'), bx + size, by - 50);
        c.font = '900 ' + Math.round(size * 0.07) + 'px system-ui, sans-serif';
        c.fillStyle = (STYLE[best] || ['#fff'])[0]; c.fillText(String(best), bx + size, by - 20);
        var k = anim > 0 ? 1 - anim / ANIM : 1;
        k = 1 - Math.pow(1 - k, 3);
        function lerpPos(tl) {
          var a = pos(tl.pr, tl.pc), b = pos(tl.r, tl.c);
          return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
        }
        ghosts.forEach(function (tl) { var p = lerpPos(tl); drawTile(c, tl, p[0], p[1], 1); });
        tiles.forEach(function (tl) {
          if (tl.born < 0) return;
          var p = lerpPos(tl), sc = 1;
          if (anim > 0 && tl.merged) { drawTile(c, { v: tl.v / 2 }, p[0], p[1], 1); return; }
          if (tl.born < 1) sc = 0.3 + 0.7 * tl.born;
          if (tl.pop > 0) sc = 1 + Math.sin(tl.pop * Math.PI) * 0.14;
          drawTile(c, tl, p[0], p[1], sc);
        });
        if (over) {
          c.fillStyle = 'rgba(18,11,31,' + Math.min(0.6, (1.2 - overT)) + ')';
          rr(c, bx, by, size, size, gap * 1.6); c.fill();
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.font = '900 ' + Math.round(size * 0.09) + 'px system-ui, sans-serif';
          c.fillStyle = '#fff'; c.fillText(api.t('g2048.noMoves'), bx + size / 2, by + size / 2);
        }
        if (flash > 0) { c.fillStyle = 'rgba(250,204,21,' + flash * 0.35 + ')'; c.fillRect(0, 0, W, H); }
        c.textAlign = 'center'; c.textBaseline = 'top';
        c.font = '600 13px system-ui, sans-serif'; c.fillStyle = 'rgba(255,255,255,.4)';
        c.fillText(api.t('g2048.swipe') + ' · ' + api.t('g2048.moves') + ': ' + moves, W / 2, by + size + 14);
        sparks.forEach(function (sk) { var a = Math.min(1, sk.life * 2), r = 2 + a * 3; c.globalAlpha = a; c.fillStyle = sk.col; c.beginPath(); c.moveTo(sk.x, sk.y - r); c.quadraticCurveTo(sk.x, sk.y, sk.x + r, sk.y); c.quadraticCurveTo(sk.x, sk.y, sk.x, sk.y + r); c.quadraticCurveTo(sk.x, sk.y, sk.x - r, sk.y); c.quadraticCurveTo(sk.x, sk.y, sk.x, sk.y - r); c.fill(); });
        c.globalAlpha = 1;
        undoRect = null; hamRect = null;
        var uw = 140, uh = 42, uy = by + size + 40, ux = W / 2 - uw - 6;
        if (D.undo) {
          undoRect = [ux, uy, uw, uh];
          var ua = hist && undos > 0;
          if (ua) pillBtn(c, ux, uy, uw, uh, '#fcd34d', '#d97706', true); else pillBtn(c, ux, uy, uw, uh, 'rgba(255,255,255,.08)', 'rgba(255,255,255,.04)', false);
          c.fillStyle = ua ? '#3b1d00' : 'rgba(255,255,255,.3)';
          c.font = '800 15px system-ui, sans-serif'; c.textBaseline = 'middle';
          c.fillText('↶ ' + api.t('g2048.undo') + (undos < 50 ? ' ×' + undos : ''), ux + uw / 2, uy + uh / 2 + 1);
        }
        if (D.ham) {
          var hx = D.undo ? W / 2 + 6 : W / 2 - uw / 2;
          hamRect = [hx, uy, uw, uh];
          if (hamMode) pillBtn(c, hx, uy, uw, uh, '#fca5a5', '#dc2626', true);
          else if (hammers > 0) pillBtn(c, hx, uy, uw, uh, '#c4b5fd', '#7c3aed', true);
          else pillBtn(c, hx, uy, uw, uh, 'rgba(255,255,255,.08)', 'rgba(255,255,255,.04)', false);
          c.fillStyle = hammers > 0 ? '#fff' : 'rgba(255,255,255,.3)';
          c.font = '800 15px system-ui, sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'center';
          c.fillText('🔨 ×' + hammers, hx + uw / 2, uy + uh / 2 + 1);
          if (hamMode) {
            c.fillStyle = '#fca5a5'; c.font = '800 13px system-ui, sans-serif'; c.fillText(api.t('g2048.hamTap'), W / 2, uy + uh + 18);
            c.strokeStyle = 'rgba(248,113,113,' + (0.5 + 0.4 * Math.sin(t * 8)) + ')'; c.lineWidth = 3; rr(c, bx, by, size, size, gap * 1.6); c.stroke();
          }
        }
      }
    };
  }
};
