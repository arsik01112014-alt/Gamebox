/* Пары: найди одинаковые карточки */
window.GAMES = window.GAMES || {};
window.GAMES.memory = {
  title: 'Пары',
  desc: 'Тренируй память',
  hint: 'Открывай по две карточки. Совпали — остаются открытыми. Найди все пары быстрее и с меньшим числом ошибок!',
  colors: ['#ec4899', '#f59e0b'],
  controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="memoryA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f472b6"/><stop offset="1" stop-color="#9d174d"/></linearGradient>' +
    '<linearGradient id="memoryB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fde7c7"/></linearGradient>' +
    '<pattern id="memoryP" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="none"/><path d="M0 4h8M4 0v8" stroke="#fff" stroke-opacity=".22" stroke-width="1.4"/></pattern></defs>' +
    '<g transform="rotate(-12 30 46)"><rect x="12" y="20" width="38" height="52" rx="7" fill="#0003" transform="translate(2 3)"/><rect x="12" y="20" width="38" height="52" rx="7" fill="url(#memoryA)" stroke="#fcd34d" stroke-width="2"/>' +
    '<rect x="16" y="24" width="30" height="44" rx="5" fill="url(#memoryP)"/><path d="M31 34l7 12l-7 12l-7-12z" fill="#fcd34d" stroke="#fff" stroke-width="1.5"/></g>' +
    '<g transform="rotate(10 66 50)"><rect x="47" y="22" width="38" height="52" rx="7" fill="#0003" transform="translate(2 3)"/><rect x="47" y="22" width="38" height="52" rx="7" fill="url(#memoryB)" stroke="#f59e0b" stroke-width="2.5"/>' +
    '<circle cx="66" cy="48" r="13" fill="#fbcfe8"/><text x="66" y="56" font-size="22" text-anchor="middle">🍓</text></g>' +
    '<path d="M20 84l2.5-6l2.5 6l6 2.5l-6 2.5l-2.5 6l-2.5-6l-6-2.5z" fill="#fde047"/><path d="M84 12l1.6-4l1.6 4l4 1.6l-4 1.6l-1.6 4l-1.6-4l-4-1.6z" fill="#fff"/></svg>',

  create: function (api) {
    var EMO = ['🍓', '🍋', '🍉', '🍇', '🍒', '🥝', '🍑', '🍍', '🥥', '🍌', '🍎', '🥕', '🌶️', '🍄', '🌵', '🌻', '🐱', '🐶'];
    var DIFF = [{ c: 3, r: 4, peek: 2 }, { c: 4, r: 4, peek: 1.5 }, { c: 4, r: 5, peek: 1 }, { c: 5, r: 6, peek: 0 }];
    var D, cards, open, lock, time, moves, found, combo, t, peekT, endT, lay, parts;
    // v2.0: раунды (поле растёт), лимит времени на раунд, карты-«глаз» подсвечивают всё поле
    var round = 1, limit = 0, roundT = 0, between = 0, C0, R0;
    function deal() {
      var rows = Math.min(R0 + round - 1, 7), cols = Math.min(C0 + Math.floor((round - 1) / 2), 6);
      if ((rows * cols) % 2) rows++;
      D = { c: cols, r: rows, peek: DIFF[api.diff].peek };
      var n = D.c * D.r / 2, pool = shuffle(EMO.slice()).slice(0, n);
      if (round >= 2 && n >= 6) pool[0] = '👁';
      var deck = shuffle(pool.concat(pool));
      cards = deck.map(function (e) { return { e: e, up: false, done: false, a: 0 }; });
      open = []; lock = 0; found = 0; peekT = 0;
      limit = n * [9, 7, 5.5, 4.5][api.diff] + 6; roundT = limit;
      layout();
    }

    function layout() {
      var pad = 14, top = 46;
      var cw = (api.W - pad * 2 - (D.c - 1) * 10) / D.c, ch = (api.H - top - pad - (D.r - 1) * 10) / D.r;
      var w = Math.min(cw, ch / 1.25), h = w * 1.25;
      var gw = D.c * w + (D.c - 1) * 10, gh = D.r * h + (D.r - 1) * 10;
      lay = { w: w, h: h, x: (api.W - gw) / 2, y: top + (api.H - top - pad - gh) / 2 };
      buildCards();
    }

    /* ---- визуал: пререндер фона, рубашки и лицевой стороны ---- */
    var bgOff = null, bgW = 0, bgH = 0, backOff = null, faceOff = null, doneOff = null, offKey = '';
    var PCOL = ['#fde047', '#f472b6', '#a78bfa', '#67e8f9', '#fff'];
    function dprOf() { return Math.min(2, window.devicePixelRatio || 1); }
    function rr(c, x, y, w, h, r) {
      r = Math.max(0, Math.min(r, w / 2, h / 2));
      c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
    }
    function mkOff(w, h) {
      var d = dprOf(), o = document.createElement('canvas');
      o.width = Math.max(1, Math.ceil(w * d)); o.height = Math.max(1, Math.ceil(h * d));
      var c = o.getContext('2d'); c.scale(d, d); return { o: o, c: c };
    }
    function diamond(c, x, y, rx, ry) { c.beginPath(); c.moveTo(x, y - ry); c.lineTo(x + rx, y); c.lineTo(x, y + ry); c.lineTo(x - rx, y); c.closePath(); }
    function buildBg() {
      var W = api.W, H = api.H, m = mkOff(W, H), c = m.c;
      bgW = W; bgH = H;
      var g = c.createLinearGradient(0, 0, W * 0.4, H);
      g.addColorStop(0, '#2e0657'); g.addColorStop(0.55, '#57104f'); g.addColorStop(1, '#7c1438');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // мягкие световые пятна
      var spots = [[0.2, 0.15, 0.6, 'rgba(236,72,153,.22)'], [0.85, 0.55, 0.55, 'rgba(139,92,246,.2)'], [0.3, 0.95, 0.5, 'rgba(245,158,11,.14)']];
      spots.forEach(function (sp) {
        var rg = c.createRadialGradient(W * sp[0], H * sp[1], 0, W * sp[0], H * sp[1], W * sp[2]);
        rg.addColorStop(0, sp[3]); rg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H);
      });
      // узор-ромбы (как скатерть)
      c.strokeStyle = 'rgba(255,255,255,.035)'; c.lineWidth = 1;
      for (var y = -20; y < H + 40; y += 28) for (var x = (y / 28 % 2 ? 14 : 0) - 14; x < W + 28; x += 28) { diamond(c, x, y, 10, 14); c.stroke(); }
      // зерно
      c.fillStyle = 'rgba(255,255,255,.04)';
      for (var i = 0; i < 700; i++) c.fillRect((i * 97.31) % W, (i * 57.7 + (i % 13) * 31) % H, 1, 1);
      // виньетка
      var v = c.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.max(W, H) * 0.8);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,0,20,.6)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
      bgOff = m.o;
    }
    function buildCards() {
      var w = lay.w, h = lay.h, key = w.toFixed(1) + 'x' + h.toFixed(1);
      if (key === offKey && backOff) return;
      offKey = key;
      var R = Math.min(12, w * 0.16), m, c, g, i;
      // рубашка
      m = mkOff(w, h); c = m.c;
      g = c.createLinearGradient(0, 0, w * 0.3, h);
      g.addColorStop(0, '#f472b6'); g.addColorStop(0.5, '#db2777'); g.addColorStop(1, '#9d174d');
      rr(c, 0, 0, w, h, R); c.fillStyle = g; c.fill();
      c.save(); rr(c, 0, 0, w, h, R); c.clip();
      // решётка-ромбы
      var st = Math.max(7, w / 7);
      c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 1;
      for (i = -h; i < w + h; i += st) {
        c.beginPath(); c.moveTo(i, 0); c.lineTo(i + h, h); c.stroke();
        c.beginPath(); c.moveTo(i, h); c.lineTo(i + h, 0); c.stroke();
      }
      c.fillStyle = 'rgba(255,255,255,.12)';
      for (var yy = 0; yy < h + st; yy += st) for (var xx = 0; xx < w + st; xx += st) { c.beginPath(); c.arc(xx, yy + ((xx / st) % 2 ? st / 2 : 0), 1.1, 0, 6.283); c.fill(); }
      // блик сверху
      var hl = c.createLinearGradient(0, 0, 0, h * 0.5);
      hl.addColorStop(0, 'rgba(255,255,255,.28)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = hl; c.fillRect(0, 0, w, h * 0.5);
      c.restore();
      // рамки: золотая + тонкая белая
      var ins = Math.max(4, w * 0.07);
      rr(c, ins, ins, w - ins * 2, h - ins * 2, R * 0.6);
      c.strokeStyle = '#fcd34d'; c.lineWidth = Math.max(1.5, w * 0.025); c.stroke();
      rr(c, ins + 3, ins + 3, w - ins * 2 - 6, h - ins * 2 - 6, R * 0.45);
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; c.stroke();
      // медальон
      var cx = w / 2, cy = h / 2, mr = w * 0.24;
      var mg = c.createRadialGradient(cx - mr * 0.3, cy - mr * 0.3, 1, cx, cy, mr * 1.3);
      mg.addColorStop(0, '#be185d'); mg.addColorStop(1, '#500724');
      c.beginPath(); c.arc(cx, cy, mr, 0, 6.283); c.fillStyle = mg; c.fill();
      c.lineWidth = Math.max(1.5, w * 0.03); c.strokeStyle = '#fcd34d'; c.stroke();
      diamond(c, cx, cy, mr * 0.5, mr * 0.75);
      var dg = c.createLinearGradient(cx, cy - mr, cx, cy + mr);
      dg.addColorStop(0, '#fef3c7'); dg.addColorStop(0.5, '#fbbf24'); dg.addColorStop(1, '#b45309');
      c.fillStyle = dg; c.fill();
      c.beginPath(); c.moveTo(cx, cy - mr * 0.75); c.lineTo(cx + mr * 0.5, cy); c.lineTo(cx, cy); c.closePath();
      c.fillStyle = 'rgba(255,255,255,.45)'; c.fill();
      // уголки
      c.fillStyle = '#fcd34d';
      [[ins + 6, ins + 6], [w - ins - 6, ins + 6], [ins + 6, h - ins - 6], [w - ins - 6, h - ins - 6]].forEach(function (p) { diamond(c, p[0], p[1], w * 0.04, w * 0.055); c.fill(); });
      backOff = m.o;
      // лицо (обычное и найденное)
      function face(done) {
        var f = mkOff(w, h), q = f.c;
        var fg = q.createLinearGradient(0, 0, 0, h);
        if (done) { fg.addColorStop(0, '#fffbeb'); fg.addColorStop(1, '#fde68a'); } else { fg.addColorStop(0, '#ffffff'); fg.addColorStop(1, '#f3e8ff'); }
        rr(q, 0, 0, w, h, R); q.fillStyle = fg; q.fill();
        q.save(); rr(q, 0, 0, w, h, R); q.clip();
        q.fillStyle = done ? 'rgba(217,119,6,.08)' : 'rgba(124,58,237,.06)';
        for (var yy = 4; yy < h; yy += 6) for (var xx = (yy % 12 ? 3 : 0); xx < w; xx += 6) q.fillRect(xx, yy, 1.2, 1.2);
        q.restore();
        var ci = Math.max(4, w * 0.07);
        rr(q, ci, ci, w - ci * 2, h - ci * 2, R * 0.6);
        q.strokeStyle = done ? 'rgba(217,119,6,.55)' : 'rgba(168,85,247,.3)'; q.lineWidth = 1.2; q.stroke();
        var cg = q.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w * 0.36);
        cg.addColorStop(0, done ? 'rgba(253,224,71,.85)' : 'rgba(251,207,232,.9)'); cg.addColorStop(1, done ? 'rgba(253,224,71,0)' : 'rgba(251,207,232,0)');
        q.fillStyle = cg; q.beginPath(); q.arc(w / 2, h / 2, w * 0.36, 0, 6.283); q.fill();
        q.fillStyle = done ? '#d97706' : '#c084fc';
        diamond(q, ci + 7, ci + 8, w * 0.035, w * 0.05); q.fill();
        diamond(q, w - ci - 7, h - ci - 8, w * 0.035, w * 0.05); q.fill();
        rr(q, 1, 1, w - 2, h - 2, R);
        q.strokeStyle = done ? '#f59e0b' : 'rgba(255,255,255,.9)'; q.lineWidth = done ? 3 : 1.5; q.stroke();
        return f.o;
      }
      faceOff = face(false); doneOff = face(true);
    }
    function star(c, x, y, r) {
      c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r);
      c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill();
    }
    function pill(c, x, y, w, h) {
      rr(c, x, y, w, h, h / 2); c.fillStyle = 'rgba(15,0,30,.45)'; c.fill();
      c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1; c.stroke();
    }
    function rect(i) {
      var cx = i % D.c, cy = Math.floor(i / D.c);
      return { x: lay.x + cx * (lay.w + 10), y: lay.y + cy * (lay.h + 10) };
    }
    function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }

    function flip(i) {
      var cd = cards[i];
      if (lock > 0 || peekT > 0 || cd.up || cd.done || endT > 0 || between > 0) return;
      cd.up = true; open.push(i); api.sound('rotate'); api.vibrate(6);
      if (open.length === 2) {
        moves++;
        var a = cards[open[0]], b = cards[open[1]];
        if (a.e === b.e) {
          a.done = b.done = true; a.m = b.m = t; found++; combo++;
          api.addScore(100 + combo * 25 + api.diff * 20 + (round - 1) * 20);
          if (combo >= 2) { var cr = rect(open[1]); api.fx.text(cr.x + lay.w / 2, cr.y, 'x' + combo, '#fde047', 18); }
          if (a.e === '👁') { peekT = 1.3; cards.forEach(function (q) { q.up = true; }); api.sound('bonus'); api.toast(api.t('memory.eye')); }
          api.sound(combo > 1 ? 'bonus' : 'coin'); api.vibrate(20);
          [open[0], open[1]].forEach(function (k) { var r = rect(k); for (var j = 0; j < 8; j++) parts.push({ x: r.x + lay.w / 2, y: r.y + lay.h / 2, vx: (Math.random() - 0.5) * 260, vy: (Math.random() - 0.5) * 260, life: 0.6 }); });
          open = [];
          if (found === cards.length / 2) {
            var bonus = Math.round(roundT * 10 * round) + Math.max(0, (cards.length - moves) * 15);
            api.addScore(bonus); api.sound('win'); api.fx.confetti(50);
            api.toast(api.t('memory.round', round + 1)); between = 1.6; moves = 0;
          }
        } else { combo = 0; lock = 0.75; api.sound('move'); }
      }
    }

    return {
      reset: function () {
        D = DIFF[api.diff]; t = 0; time = 0; moves = 0; found = 0; combo = 0; lock = 0; endT = 0; open = []; parts = [];
        C0 = D.c; R0 = D.r; round = 1; between = 0;
        deal();
      },
      begin: function () {
        if (D.peek) { peekT = D.peek; cards.forEach(function (c) { c.up = true; }); }
      },
      resize: layout,
      idle: function (dt) { t += dt; },
      input: function (type, d) {
        if (type !== 'down') return;
        for (var i = 0; i < cards.length; i++) {
          var r = rect(i);
          if (d.x >= r.x && d.x <= r.x + lay.w && d.y >= r.y && d.y <= r.y + lay.h) { flip(i); return; }
        }
      },
      update: function (dt) {
        t += dt;
        if (between > 0) { between -= dt; if (between <= 0) { round++; deal(); peekT = D.peek ? D.peek : 0; if (peekT) cards.forEach(function (c) { c.up = true; }); } }
        else if (peekT > 0) { peekT -= dt; if (peekT <= 0) cards.forEach(function (c) { if (!c.done) c.up = false; }); }
        else if (endT <= 0) {
          time += dt; roundT -= dt;
          if (roundT <= 0) { roundT = 0; endT = 1.2; api.sound('over'); api.toast(api.t('memory.timeUp')); cards.forEach(function (c) { c.up = true; }); }
        }
        if (lock > 0) { lock -= dt; if (lock <= 0) { open.forEach(function (k) { cards[k].up = false; }); open = []; } }
        cards.forEach(function (c) { var g = c.up || c.done ? 1 : 0; c.a += (g - c.a) * Math.min(1, dt * 12); });
        parts = parts.filter(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; return p.life > 0; });
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, q = api.quality, i;
        if (!bgOff || bgW !== W || bgH !== H) buildBg();
        if (!backOff) buildCards();
        c.save();
        c.drawImage(bgOff, 0, 0, W, H);
        // плавающие блёстки
        if (q > 0) {
          c.fillStyle = 'rgba(255,255,255,.1)';
          for (var s = 0; s < 14; s++) {
            var sx0 = (s * 173 + Math.sin(t * 0.3 + s) * 20) % W, sy0 = (s * 97 + t * 10) % H;
            c.globalAlpha = 0.25 + 0.25 * Math.sin(t * 1.7 + s * 2);
            star(c, sx0, sy0, 3 + (s % 3) * 2);
          }
          c.globalAlpha = 1;
        }
        // HUD
        c.font = '800 13px system-ui, sans-serif'; c.textBaseline = 'middle';
        var tl = '⏱ ' + Math.ceil(roundT) + 's  ·  ' + api.t('memory.r') + ' ' + round, ml = api.t('memory.moves') + ': ' + moves;
        var tw = c.measureText(tl).width + 24, mw = c.measureText(ml).width + 24;
        var kk = Math.max(0, roundT / limit), low = kk < 0.25;
        pill(c, 12, 8, tw, 24); pill(c, W - 12 - mw, 8, mw, 24);
        c.fillStyle = low ? '#fecaca' : '#fff'; c.textAlign = 'left'; c.fillText(tl, 24, 20.5);
        c.fillStyle = '#fff'; c.textAlign = 'right'; c.fillText(ml, W - 24, 20.5);
        rr(c, 14, 36, W - 28, 6, 3); c.fillStyle = 'rgba(0,0,0,.35)'; c.fill();
        if (kk > 0) {
          var bw = Math.max(6, (W - 28) * kk), bgr = c.createLinearGradient(14, 0, 14 + bw, 0);
          if (low) { bgr.addColorStop(0, '#ef4444'); bgr.addColorStop(1, '#fca5a5'); } else { bgr.addColorStop(0, '#f59e0b'); bgr.addColorStop(1, '#fde047'); }
          c.globalAlpha = low ? 0.7 + 0.3 * Math.sin(t * 12) : 1;
          rr(c, 14, 36, bw, 6, 3); c.fillStyle = bgr; c.fill();
          c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(17, 37, bw - 6, 1.5);
          c.globalAlpha = 1;
        }
        // карты
        var mis = lock > 0 && open.length === 2;
        var R = Math.min(12, lay.w * 0.16), hw = lay.w / 2, hh = lay.h / 2;
        c.textAlign = 'center';
        for (i = 0; i < cards.length; i++) {
          var cd = cards[i], r = rect(i), k = cd.a;
          var cosk = Math.cos(k * Math.PI), sxk = Math.abs(cosk), face = k > 0.5;
          var lift = Math.sin(k * Math.PI);                       // подъём в середине переворота
          var ox = 0, oy = -lift * 6, sc = 1 + lift * 0.08;
          if (mis && (open[0] === i || open[1] === i)) ox = Math.sin(t * 50) * 3 * Math.min(1, lock / 0.4);
          var since = cd.done && cd.m !== undefined ? t - cd.m : 9;
          if (since < 0.5) sc *= 1 + Math.sin(since / 0.5 * Math.PI) * 0.1;
          if (cd.done && endT <= 0) oy += Math.sin(t * 2 + i) * 1.2;
          var cx = r.x + hw + ox, cy = r.y + hh + oy;
          // тень (на столе, не масштабируется по X, растёт при подъёме)
          c.globalAlpha = 0.35 - lift * 0.12;
          c.fillStyle = '#12001f';
          rr(c, cx - hw * Math.max(0.15, sxk) + 2, r.y + 5 + lift * 4, lay.w * Math.max(0.15, sxk), lay.h, R); c.fill();
          c.globalAlpha = 1;
          c.save(); c.translate(cx, cy); c.scale(Math.max(0.02, sxk) * sc, sc);
          // свечение найденных
          if (cd.done && q > 0 && since < 1.2) {
            c.globalAlpha = Math.max(0, 1 - since / 1.2) * 0.7;
            rr(c, -hw - 5, -hh - 5, lay.w + 10, lay.h + 10, R + 4); c.fillStyle = '#fde047'; c.fill();
            c.globalAlpha = 1;
          }
          if (face) {
            c.drawImage(cd.done ? doneOff : faceOff, -hw, -hh, lay.w, lay.h);
            c.font = Math.floor(lay.w * 0.52) + 'px system-ui, sans-serif'; c.textBaseline = 'middle';
            c.globalAlpha = 0.18; c.fillStyle = '#000'; c.fillText(cd.e, 1.5, 4);
            c.globalAlpha = 1; c.fillText(cd.e, 0, 2);
            if (mis && (open[0] === i || open[1] === i)) {
              rr(c, -hw + 1, -hh + 1, lay.w - 2, lay.h - 2, R); c.strokeStyle = '#ef4444'; c.lineWidth = 3; c.stroke();
            }
            if (cd.done && q > 0) {               // бегущий блик
              var ph = ((t * 0.5 + i * 0.13) % 3) / 3;
              if (ph < 0.35) {
                c.save(); rr(c, -hw, -hh, lay.w, lay.h, R); c.clip();
                var px = -hw - lay.w + ph / 0.35 * lay.w * 3;
                c.globalAlpha = 0.35; c.fillStyle = '#fff';
                c.beginPath(); c.moveTo(px, -hh); c.lineTo(px + lay.w * 0.25, -hh); c.lineTo(px - lay.w * 0.25, hh); c.lineTo(px - lay.w * 0.5, hh); c.closePath(); c.fill();
                c.restore();
              }
            }
          } else {
            c.drawImage(backOff, -hw, -hh, lay.w, lay.h);
          }
          // затемнение кромки во время переворота
          if (sxk < 0.98) {
            c.globalAlpha = (1 - sxk) * 0.45; c.fillStyle = cosk > 0 ? '#000' : '#2e0657';
            rr(c, -hw, -hh, lay.w, lay.h, R); c.fill(); c.globalAlpha = 1;
          }
          c.restore();
        }
        // частицы-звёздочки
        for (i = 0; i < parts.length; i++) {
          var p = parts[i], a = p.life / 0.6;
          c.globalAlpha = a; c.fillStyle = PCOL[i % PCOL.length];
          star(c, p.x, p.y, 2 + a * 4);
        }
        c.globalAlpha = 1;
        if (peekT > 0) {
          var lbl = api.t('memory.remember') + ' ' + Math.ceil(peekT);
          c.font = '900 18px system-ui, sans-serif';
          var lw = c.measureText(lbl).width + 36;
          pill(c, W / 2 - lw / 2, H - 40, lw, 32);
          c.fillStyle = '#fde047'; c.textBaseline = 'middle'; c.fillText(lbl, W / 2, H - 23.5);
        }
        c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.globalAlpha = 1;
        c.restore();
      }
    };
  }
};
