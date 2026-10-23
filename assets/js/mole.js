/* Крот: бей кротов, не трогай бомбы */
window.GAMES = window.GAMES || {};
window.GAMES.mole = {
  title: 'Крот',
  desc: 'Бей кротов на скорость',
  hint: 'Тапай по кротам, пока они не спрятались. Золотой крот — бонус и +3 секунды. Бомбы не трогай! Промахи сбивают серию.',
  colors: ['#65a30d', '#a16207'],
  controls: 'none',
  multiTouch: true,
  icon: '<svg viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="92" rx="20" fill="#65b83a"/><path d="M4 60 H96 V76 Q96 96 76 96 H24 Q4 96 4 76z" fill="#4d8f26"/><path d="M8 20 l3 -6 M20 30 l2 -6 M86 70 l2 -6 M14 64 l3 -6" stroke="#9be36b" stroke-width="2" stroke-linecap="round"/>' +
    '<ellipse cx="48" cy="80" rx="40" ry="14" fill="#7a4c22"/><ellipse cx="48" cy="78" rx="31" ry="10" fill="#1c1006"/>' +
    '<circle cx="28" cy="44" r="6" fill="#92602f"/><circle cx="68" cy="44" r="6" fill="#92602f"/><circle cx="28" cy="44" r="3" fill="#e8a87c"/><circle cx="68" cy="44" r="3" fill="#e8a87c"/>' +
    '<path d="M22 80 V54 Q22 34 48 34 Q74 34 74 54 V80z" fill="#92602f" stroke="#3b2210" stroke-width="1.5"/><path d="M60 37 Q74 42 74 56 V80 H64 V56 Q64 44 60 37z" fill="#5c3a1a" opacity=".45"/>' +
    '<ellipse cx="38" cy="43" rx="8" ry="4" fill="#d69a62" transform="rotate(-25 38 43)"/>' +
    '<ellipse cx="48" cy="62" rx="14" ry="10" fill="#fde6c8"/><circle cx="39" cy="51" r="4.2" fill="#fff"/><circle cx="57" cy="51" r="4.2" fill="#fff"/>' +
    '<circle cx="39.6" cy="51.8" r="3" fill="#1c1008"/><circle cx="56.4" cy="51.8" r="3" fill="#1c1008"/><circle cx="38.6" cy="50.4" r="1" fill="#fff"/><circle cx="55.4" cy="50.4" r="1" fill="#fff"/>' +
    '<ellipse cx="48" cy="58" rx="5.5" ry="3.8" fill="#ec4899"/><ellipse cx="46.5" cy="57" rx="1.6" ry="1" fill="#fff" opacity=".8"/>' +
    '<rect x="44.3" y="64" width="3.4" height="5" rx="1" fill="#fff"/><rect x="48.3" y="64" width="3.4" height="5" rx="1" fill="#fff"/>' +
    '<path d="M14 82 Q48 98 82 82 Q80 92 48 94 Q16 92 14 82z" fill="#5c3a1a"/><path d="M14 82 Q48 96 82 82" fill="none" stroke="#c99260" stroke-width="2.5"/>' +
    '<g transform="rotate(35 70 22)"><rect x="66" y="16" width="8" height="34" rx="3" fill="#a16207"/><rect x="54" y="6" width="32" height="16" rx="5" fill="#dc2626"/><rect x="54" y="6" width="32" height="5" rx="2.5" fill="#f87171"/><rect x="54" y="6" width="4" height="16" fill="#cbd5e1"/><rect x="82" y="6" width="4" height="16" fill="#cbd5e1"/></g>' +
    '<path d="M76 40 l3 -6 M82 44 l6 -3 M70 38 l-1 -7" stroke="#fde047" stroke-width="3" stroke-linecap="round"/></svg>',

  create: function (api) {
    var DIFF = [
      { up: 1.25, gap: 0.9, bomb: 0, gold: 0.08, time: 45, multi: 1 },
      { up: 1.0, gap: 0.7, bomb: 0.1, gold: 0.08, time: 40, multi: 2 },
      { up: 0.8, gap: 0.55, bomb: 0.16, gold: 0.07, time: 40, multi: 2 },
      { up: 0.62, gap: 0.42, bomb: 0.22, gold: 0.06, time: 35, multi: 3 }
    ];
    var D, holes, timeLeft, spawnT, combo, t, pops, endT, lay, hits, shake, hammer;
    var bgL = null, fgL = null, LW = 0, LH = 0, dust = [];
    var freezeT = 0, frenzyT = 0; // v2.0: крот в каске (2 удара), ледяной крот (заморозка), «безумие» ×2 за серию 15

    function layout() {
      var cols = 3, rows = 4, top = 60;
      var cw = api.W / cols, ch = (api.H - top - 20) / rows;
      var r = Math.min(cw * 0.36, ch * 0.34);
      lay = [];
      for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) lay.push({ x: cw * (x + 0.5), y: top + ch * (y + 0.62), r: r });
      bgL = null;
    }
    function spawn() {
      var free = [];
      holes.forEach(function (h, i) { if (!h.kind) free.push(i); });
      if (!free.length) return;
      var i = free[Math.floor(Math.random() * free.length)], h = holes[i];
      var r = Math.random();
      h.kind = r < D.bomb ? 'bomb' : (r < D.bomb + D.gold ? 'gold' : 'mole');
      if (h.kind === 'mole') { var r2 = Math.random(); if (r2 < 0.12 && timeLeft < D.time - 5) h.kind = 'helmet'; else if (r2 < 0.17) h.kind = 'ice'; }
      h.hp = h.kind === 'helmet' ? 2 : 1;
      var speedUp = Math.max(0.6, 1 - (D.time - timeLeft) / 120);
      h.life = h.max = D.up * speedUp * (h.kind === 'gold' ? 0.75 : 1);
      h.p = 0; h.hit = 0;
    }
    function whack(x, y) {
      hammer = { x: x, y: y, life: 0.18 };
      for (var i = 0; i < holes.length; i++) {
        var h = holes[i], L = lay[i];
        if (!h.kind || h.hit) continue;
        var dx = x - L.x, dy = y - (L.y - L.r * 0.5 * h.p);
        if (dx * dx + dy * dy < L.r * L.r * 1.7 && h.p > 0.3) {
          if (h.kind === 'helmet' && h.hp > 1) { h.hp--; h.life = Math.max(h.life, 0.5); hitFx(x, y, 'helmet'); api.sound('break'); api.vibrate(20); pops.push({ x: L.x, y: L.y - L.r, txt: '⛑', c: '#e5e7eb', life: 0.5 }); return; }
          h.hit = 0.35; hitFx(x, y, h.kind);
          if (h.kind === 'ice') { freezeT = 3.5; api.sound('bonus'); api.fx.flash('#bae6fd', 0.25); api.toast(api.t('mole.freeze')); }
          if (h.kind === 'bomb') {
            combo = 0; timeLeft = Math.max(0, timeLeft - 5); shake = 0.4;
            api.sound('hit'); api.vibrate(120);
            pops.push({ x: L.x, y: L.y - L.r, txt: '-5s', c: '#f87171', life: 0.9 });
          } else {
            combo++; hits++;
            var pts = (h.kind === 'gold' ? 50 : h.kind === 'helmet' ? 25 : 10) * (1 + Math.min(combo, 20) * 0.1) * (frenzyT > 0 ? 2 : 1);
            pts = Math.round(pts);
            if (combo > 0 && combo % 15 === 0) { frenzyT = 6; api.toast(api.t('mole.frenzy')); api.fx.confetti(40); }
            api.addScore(pts);
            if (h.kind === 'gold') { timeLeft += 3; api.sound('bonus'); pops.push({ x: L.x, y: L.y - L.r * 1.6, txt: '+3s', c: '#fde047', life: 0.9 }); }
            else api.sound('stomp');
            api.vibrate(15);
            pops.push({ x: L.x, y: L.y - L.r, txt: '+' + pts, c: '#fff', life: 0.7 });
          }
          return;
        }
      }
      combo = 0; api.sound('move'); hitFx(x, y, null);
    }

    return {
      reset: function () {
        D = DIFF[api.diff]; t = 0; timeLeft = D.time; spawnT = 0.6; combo = 0; pops = []; endT = 0; hits = 0; shake = 0; hammer = null; dust = []; freezeT = 0; frenzyT = 0;
        holes = []; for (var i = 0; i < 12; i++) holes.push({ kind: null, p: 0, life: 0, max: 1, hit: 0 });
        layout();
      },
      resize: layout,
      idle: function (dt) { t += dt; },
      input: function (type, d) { if (type === 'press' && endT <= 0) whack(d.x, d.y); },
      update: function (dt) {
        t += dt; shake = Math.max(0, shake - dt);
        if (hammer) { hammer.life -= dt; if (hammer.life <= 0) hammer = null; }
        for (var di = dust.length - 1; di >= 0; di--) { var du = dust[di]; du.x += du.vx * dt; du.y += du.vy * dt; du.vy += 200 * dt; du.life -= dt; if (du.life <= 0) dust.splice(di, 1); }
        pops = pops.filter(function (p) { p.y -= 50 * dt; p.life -= dt; return p.life > 0; });
        holes.forEach(function (h) {
          if (!h.kind) return;
          if (h.hit) { h.hit -= dt; h.p = Math.max(0, h.p - dt * 6); if (h.hit <= 0) { h.kind = null; h.hit = 0; } return; }
          if (freezeT <= 0) h.life -= dt;
          var age = h.max - h.life;
          h.p = Math.min(1, age * 7, h.life * 7);
          if (h.life <= 0) { if (h.kind === 'mole') combo = 0; h.kind = null; h.p = 0; }
        });
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        if (freezeT > 0) freezeT -= dt;
        if (frenzyT > 0) frenzyT -= dt;
        timeLeft -= dt;
        if (timeLeft <= 0) { timeLeft = 0; endT = 0.8; api.sound('over'); return; }
        spawnT -= dt;
        if (spawnT <= 0) {
          var n = 1 + Math.floor(Math.random() * D.multi);
          for (var k = 0; k < n; k++) spawn();
          spawnT = D.gap * (0.7 + Math.random() * 0.6) * Math.max(0.55, 1 - (D.time - timeLeft) / 90);
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H, Q = api.quality;
        if (!bgL || LW !== W || LH !== H) buildLayers();
        c.save();
        if (shake > 0) c.translate((Math.random() - 0.5) * 12 * shake, (Math.random() - 0.5) * 12 * shake);
        c.fillStyle = '#3f8a24'; c.fillRect(-10, -10, W + 20, H + 20);
        c.drawImage(bgL, 0, 0, W, H);
        for (var i = 0; i < holes.length; i++) {
          var h = holes[i], L = lay[i];
          if (h.kind && h.p > 0) drawThing(c, h, L, i, Q);
        }
        c.drawImage(fgL, 0, 0, W, H);
        // искры золотого крота поверх
        for (var gi = 0; gi < holes.length; gi++) {
          var hg = holes[gi], Lg = lay[gi];
          if (hg.kind === 'gold' && hg.p > 0.5 && !hg.hit && Q > 0) {
            for (var sp = 0; sp < 3; sp++) {
              var ang = t * 2 + sp * 2.1 + gi, rad = Lg.r * (0.9 + 0.15 * Math.sin(t * 5 + sp));
              var sx = Lg.x + Math.cos(ang) * rad, sy = Lg.y - Lg.r * 0.7 * hg.p + Math.sin(ang) * rad * 0.6;
              star4(c, sx, sy, 3 + 3 * Math.abs(Math.sin(t * 6 + sp * 2)), '#fffbeb');
            }
          }
        }
        // пыль и звёзды удара
        for (var di = 0; di < dust.length; di++) {
          var d = dust[di], k = d.life / d.max;
          if (d.star) { c.globalAlpha = k; star4(c, d.x, d.y, d.r * (0.6 + (1 - k)), d.c); continue; }
          c.globalAlpha = k * 0.7; c.fillStyle = d.c;
          c.beginPath(); c.arc(d.x, d.y, d.r * (1.6 - k * 0.6), 0, 6.283); c.fill();
        }
        c.globalAlpha = 1;
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
        pops.forEach(function (p) {
          var a = Math.min(1, p.life * 2), sc = 1 + Math.max(0, p.life - 0.5) * 0.6;
          c.globalAlpha = a; c.font = '900 ' + Math.round(22 * sc) + 'px system-ui, sans-serif';
          c.lineWidth = 5; c.strokeStyle = 'rgba(40,20,5,.75)'; c.strokeText(p.txt, p.x, p.y);
          c.fillStyle = p.c; c.fillText(p.txt, p.x, p.y);
        });
        c.globalAlpha = 1;
        if (hammer) drawHammer(c, hammer);
        c.restore();
        if (freezeT > 0) {
          var fa = Math.min(1, freezeT * 0.5);
          var fg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
          fg.addColorStop(0, 'rgba(186,230,253,' + (0.08 * fa) + ')'); fg.addColorStop(1, 'rgba(224,242,254,' + (0.55 * fa) + ')');
          c.fillStyle = fg; c.fillRect(0, 0, W, H);
        }
        // HUD: таймер
        var k2 = Math.min(1, timeLeft / D.time), bx = 16, by = 16, bw = W - 32, bh = 16, low = timeLeft < 8;
        c.fillStyle = 'rgba(20,40,10,.45)'; rr(c, bx - 2, by - 2, bw + 4, bh + 4, 10); c.fill();
        if (k2 > 0) {
          var tg = c.createLinearGradient(0, by, 0, by + bh);
          if (low) { tg.addColorStop(0, '#fca5a5'); tg.addColorStop(1, '#dc2626'); } else { tg.addColorStop(0, '#fef08a'); tg.addColorStop(1, '#eab308'); }
          c.fillStyle = tg; rr(c, bx, by, Math.max(bh, bw * k2), bh, 8); c.fill();
          c.fillStyle = 'rgba(255,255,255,.45)'; rr(c, bx + 4, by + 2, Math.max(4, bw * k2 - 8), 4, 2); c.fill();
        }
        // часы
        var cx0 = 28, cy0 = 50, pulse = low ? 1 + Math.sin(t * 12) * 0.08 : 1;
        c.save(); c.translate(cx0, cy0); c.scale(pulse, pulse);
        c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.arc(1, 2, 10, 0, 6.283); c.fill();
        c.fillStyle = low ? '#fee2e2' : '#fff'; c.beginPath(); c.arc(0, 0, 10, 0, 6.283); c.fill();
        c.strokeStyle = low ? '#dc2626' : '#a16207'; c.lineWidth = 2.5; c.stroke();
        c.fillStyle = c.strokeStyle; c.fillRect(-2.5, -15, 5, 4);
        c.lineWidth = 2; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -6); c.moveTo(0, 0);
        var ha = (1 - k2) * 6.283 - Math.PI / 2; c.lineTo(Math.cos(ha) * 5, Math.sin(ha) * 5); c.stroke(); c.lineCap = 'butt';
        c.restore();
        c.textAlign = 'left'; c.textBaseline = 'middle'; c.font = '900 16px system-ui, sans-serif';
        c.lineWidth = 4; c.strokeStyle = 'rgba(20,40,10,.55)'; c.strokeText(Math.ceil(timeLeft) + 's', 44, 51);
        c.fillStyle = low ? '#fecaca' : '#fff'; c.fillText(Math.ceil(timeLeft) + 's', 44, 51);
        if (combo > 2) {
          var ct = 'COMBO ×' + combo; c.font = '900 14px system-ui, sans-serif';
          var cw = c.measureText(ct).width + 22;
          c.fillStyle = 'rgba(120,53,15,.75)'; rr(c, W - 16 - cw, 39, cw, 24, 12); c.fill();
          c.strokeStyle = '#fde047'; c.lineWidth = 1.5; c.stroke();
          c.textAlign = 'right'; c.fillStyle = '#fde047'; c.fillText(ct, W - 27, 51.5);
        }
        if (frenzyT > 0) {
          var ft = '×2  ' + Math.ceil(frenzyT); c.font = '900 15px system-ui, sans-serif'; c.textAlign = 'center';
          var fw = c.measureText(ft).width + 40, fsc = 1 + Math.sin(t * 10) * 0.05;
          c.save(); c.translate(W / 2, 51); c.scale(fsc, fsc);
          var pg = c.createLinearGradient(-fw / 2, 0, fw / 2, 0); pg.addColorStop(0, '#db2777'); pg.addColorStop(1, '#f97316');
          c.fillStyle = pg; rr(c, -fw / 2, -12, fw, 24, 12); c.fill();
          flame(c, -fw / 2 + 14, 1, 7);
          c.fillStyle = '#fff'; c.textBaseline = 'middle'; c.fillText(ft, 8, 1);
          c.restore();
        }
        c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.lineWidth = 1; c.lineJoin = 'miter';
      }
    };

    function rr(c, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2); c.beginPath();
      c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
      c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
    }
    function star4(c, x, y, s, col) {
      c.fillStyle = col; c.beginPath();
      c.moveTo(x, y - s); c.quadraticCurveTo(x, y, x + s, y); c.quadraticCurveTo(x, y, x, y + s);
      c.quadraticCurveTo(x, y, x - s, y); c.quadraticCurveTo(x, y, x, y - s); c.fill();
    }
    function star5(c, x, y, r, col) {
      c.fillStyle = col; c.beginPath();
      for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); }
      c.closePath(); c.fill();
    }
    function flame(c, x, y, s) {
      c.fillStyle = '#fde047'; c.beginPath(); c.moveTo(x, y - s * 1.3);
      c.quadraticCurveTo(x + s, y - s * 0.2, x + s * 0.6, y + s * 0.6); c.quadraticCurveTo(x, y + s, x - s * 0.6, y + s * 0.6);
      c.quadraticCurveTo(x - s, y - s * 0.2, x, y - s * 1.3); c.fill();
      c.fillStyle = '#fff7ed'; c.beginPath(); c.arc(x, y + s * 0.3, s * 0.32, 0, 6.283); c.fill();
    }
    function mkLayer() {
      var dpr = Math.min(2, window.devicePixelRatio || 1), cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.ceil(api.W * dpr)); cv.height = Math.max(1, Math.ceil(api.H * dpr));
      var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); return { cv: cv, g: g };
    }
    function srand(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
    function tuft(g, x, y, s, R) {
      for (var b = 0; b < 5; b++) {
        var ox = (b - 2) * s * 0.28, hgt = s * (0.7 + R() * 0.6), lean = (b - 2) * s * 0.18 + (R() - 0.5) * s * 0.2;
        g.fillStyle = b % 2 ? '#3f8f22' : '#5cb734';
        g.beginPath(); g.moveTo(x + ox - s * 0.12, y); g.quadraticCurveTo(x + ox + lean * 0.4, y - hgt * 0.6, x + ox + lean, y - hgt);
        g.quadraticCurveTo(x + ox + lean * 0.3, y - hgt * 0.5, x + ox + s * 0.12, y); g.fill();
      }
    }
    // статичные слои: поле + задняя часть нор (bgL) и передний бортик нор (fgL)
    function buildLayers() {
      var W = api.W, H = api.H, R = srand(1234), i, L, r;
      LW = W; LH = H;
      var b = mkLayer(), g = b.g;
      var gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#a3e06e'); gr.addColorStop(0.45, '#6cc040'); gr.addColorStop(1, '#3d8a22');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      // полосы скошенной травы
      g.save(); g.translate(W / 2, H / 2); g.rotate(-0.35);
      var D2 = Math.sqrt(W * W + H * H);
      for (i = -12; i < 12; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,.055)' : 'rgba(20,60,0,.06)'; g.fillRect(i * 46, -D2 / 2, 46, D2); }
      g.restore();
      // пятна света и тени
      for (i = 0; i < 14; i++) {
        var px = R() * W, py = R() * H, pr = 40 + R() * 90, pg = g.createRadialGradient(px, py, 0, px, py, pr);
        var lt = R() < 0.5; pg.addColorStop(0, lt ? 'rgba(220,255,160,.12)' : 'rgba(10,50,0,.1)'); pg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = pg; g.fillRect(px - pr, py - pr, pr * 2, pr * 2);
      }
      // травинки
      var greens = ['#4f9d2a', '#77c94a', '#3d8420', '#8fd65f', '#5aab31'];
      g.lineCap = 'round';
      for (i = 0; i < 1100; i++) {
        var gx = R() * W, gy = R() * H, hh = 3 + R() * 6 * (0.6 + gy / H);
        g.strokeStyle = greens[(R() * greens.length) | 0]; g.globalAlpha = 0.5 + R() * 0.5; g.lineWidth = 1 + R();
        g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + (R() - 0.5) * 4, gy - hh); g.stroke();
      }
      g.globalAlpha = 1;
      // клевер и цветы
      for (i = 0; i < 26; i++) {
        var fx = R() * W, fy = 70 + R() * (H - 70), kind = R();
        if (kind < 0.45) {
          g.fillStyle = 'rgba(46,110,20,.8)';
          for (var lf = 0; lf < 3; lf++) { var la = lf * 2.09; g.beginPath(); g.arc(fx + Math.cos(la) * 3, fy + Math.sin(la) * 3, 3, 0, 6.283); g.fill(); }
        } else {
          var pc = kind < 0.75 ? '#ffffff' : kind < 0.9 ? '#fde047' : '#f9a8d4';
          for (var pt = 0; pt < 5; pt++) { var pa = pt * 1.2566; g.fillStyle = pc; g.beginPath(); g.arc(fx + Math.cos(pa) * 3, fy + Math.sin(pa) * 3, 2.2, 0, 6.283); g.fill(); }
          g.fillStyle = kind < 0.75 ? '#facc15' : '#ea580c'; g.beginPath(); g.arc(fx, fy, 1.8, 0, 6.283); g.fill();
        }
      }
      // камешки
      for (i = 0; i < 12; i++) {
        var sx = R() * W, sy = 70 + R() * (H - 70), ss = 2 + R() * 3;
        g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(sx + 1, sy + 1.5, ss, ss * 0.6, 0, 0, 6.283); g.fill();
        g.fillStyle = '#a8a29e'; g.beginPath(); g.ellipse(sx, sy, ss, ss * 0.65, 0, 0, 6.283); g.fill();
        g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(sx - ss * 0.3, sy - ss * 0.2, ss * 0.4, ss * 0.25, 0, 0, 6.283); g.fill();
      }
      // норы: тень, насыпь, тёмная глубина
      for (i = 0; i < lay.length; i++) {
        L = lay[i]; r = L.r;
        g.fillStyle = 'rgba(20,50,5,.35)'; g.beginPath(); g.ellipse(L.x + r * 0.08, L.y + r * 0.22, r * 1.4, r * 0.62, 0, 0, 6.283); g.fill();
        var mg = g.createLinearGradient(0, L.y - r * 0.6, 0, L.y + r * 0.5);
        mg.addColorStop(0, '#b07a45'); mg.addColorStop(0.5, '#8b5a2b'); mg.addColorStop(1, '#5c3a1a');
        g.fillStyle = mg; g.beginPath(); g.ellipse(L.x, L.y - r * 0.06, r * 1.28, r * 0.58, 0, 0, 6.283); g.fill();
        // комочки земли на насыпи
        for (var cl = 0; cl < 14; cl++) {
          var ca = Math.PI + R() * Math.PI, cr = r * (1.05 + R() * 0.18);
          var clx = L.x + Math.cos(ca) * cr, cly = L.y - r * 0.06 + Math.sin(ca) * cr * 0.45;
          g.fillStyle = R() < 0.5 ? '#c08a52' : '#6e4520'; g.beginPath(); g.arc(clx, cly, 1.5 + R() * 2.5, 0, 6.283); g.fill();
        }
        var hg = g.createRadialGradient(L.x, L.y + r * 0.1, r * 0.1, L.x, L.y, r);
        hg.addColorStop(0, '#050302'); hg.addColorStop(0.7, '#1c1006'); hg.addColorStop(1, '#3a2410');
        g.fillStyle = hg; g.beginPath(); g.ellipse(L.x, L.y, r, r * 0.38, 0, 0, 6.283); g.fill();
        // светлый край задней стенки
        g.strokeStyle = 'rgba(214,170,120,.55)'; g.lineWidth = 2;
        g.beginPath(); g.ellipse(L.x, L.y, r * 0.98, r * 0.37, 0, Math.PI + 0.2, 6.283 - 0.2); g.stroke();
      }
      // виньетка
      var vg = g.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,30,0,.45)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
      bgL = b.cv;

      var f = mkLayer(), q = f.g;
      for (i = 0; i < lay.length; i++) {
        L = lay[i]; r = L.r;
        q.save();
        var lg = q.createLinearGradient(0, L.y, 0, L.y + r * 0.55);
        lg.addColorStop(0, '#a87240'); lg.addColorStop(0.55, '#7a4c22'); lg.addColorStop(1, '#4e3015');
        q.fillStyle = lg; q.beginPath(); q.ellipse(L.x, L.y - r * 0.06, r * 1.28, r * 0.58, 0, 0, 6.283); q.fill();
        q.globalCompositeOperation = 'destination-out';
        q.beginPath(); q.ellipse(L.x, L.y, r, r * 0.38, 0, 0, 6.283); q.fill();
        q.fillRect(L.x - r * 1.5, L.y - r * 1.2, r * 3, r * 1.2);
        q.globalCompositeOperation = 'source-over';
        q.restore();
        // светлая кромка бортика
        q.strokeStyle = '#c99260'; q.lineWidth = 3; q.lineCap = 'round';
        q.beginPath(); q.ellipse(L.x, L.y, r * 1.01, r * 0.39, 0, 0.12, Math.PI - 0.12); q.stroke();
        q.strokeStyle = 'rgba(255,230,190,.35)'; q.lineWidth = 1.5;
        q.beginPath(); q.ellipse(L.x, L.y + 2, r * 1.06, r * 0.42, 0, 0.3, Math.PI - 0.3); q.stroke();
        // камешки и комочки
        for (var pb = 0; pb < 10; pb++) {
          var pa2 = 0.25 + R() * (Math.PI - 0.5), pr2 = r * (1.08 + R() * 0.14);
          var pbx = L.x + Math.cos(pa2) * pr2, pby = L.y - r * 0.04 + Math.sin(pa2) * pr2 * 0.46;
          var ps = 1.5 + R() * 2.6;
          q.fillStyle = R() < 0.3 ? '#a8a29e' : (R() < 0.5 ? '#c08a52' : '#5c3a1a');
          q.beginPath(); q.ellipse(pbx, pby, ps, ps * 0.75, 0, 0, 6.283); q.fill();
          q.fillStyle = 'rgba(255,255,255,.25)'; q.beginPath(); q.arc(pbx - ps * 0.3, pby - ps * 0.3, ps * 0.35, 0, 6.283); q.fill();
        }
        // пучки травы у основания
        tuft(q, L.x - r * 1.2, L.y + r * 0.3, r * 0.32, R);
        tuft(q, L.x + r * 1.15, L.y + r * 0.25, r * 0.28, R);
        tuft(q, L.x + r * 0.35, L.y + r * 0.56, r * 0.22, R);
      }
      fgL = f.cv;
    }

    function drawThing(c, h, L, i, Q) {
      var r = L.r, x = L.x;
      c.save();
      // клип: всё выше центра норы + сама дыра
      c.beginPath(); c.rect(x - r * 1.5, L.y - r * 2.6, r * 3, r * 2.6); c.ellipse(x, L.y, r, r * 0.38, 0, 0, 6.283); c.clip();
      var top = L.y + r * 0.2 - r * 1.25 * h.p;
      // тень внутри норы
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x, L.y + r * 0.05, r * 0.8, r * 0.26, 0, 0, 6.283); c.fill();
      if (h.kind === 'bomb') drawBomb(c, x, top, r, Q);
      else drawMole(c, h, x, top, r, i, Q, L.y);
      c.restore();
    }

    function drawBomb(c, x, top, r, Q) {
      var cy = top + r * 0.62, br = r * 0.62;
      var g = c.createRadialGradient(x - br * 0.35, cy - br * 0.4, br * 0.1, x, cy, br);
      g.addColorStop(0, '#64748b'); g.addColorStop(0.45, '#1f2937'); g.addColorStop(1, '#030712');
      c.fillStyle = g; c.beginPath(); c.arc(x, cy, br, 0, 6.283); c.fill();
      // красная полоса-предупреждение
      c.save(); c.beginPath(); c.arc(x, cy, br, 0, 6.283); c.clip();
      c.fillStyle = 'rgba(220,38,38,.85)'; c.fillRect(x - br, cy + br * 0.12, br * 2, br * 0.22);
      c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x - br, cy + br * 0.3, br * 2, br * 0.04);
      c.restore();
      // череп
      c.fillStyle = 'rgba(241,245,249,.9)'; c.beginPath(); c.arc(x, cy - br * 0.12, br * 0.24, 0, 6.283); c.fill();
      c.fillRect(x - br * 0.13, cy - br * 0.02, br * 0.26, br * 0.14);
      c.fillStyle = '#111827'; c.beginPath(); c.arc(x - br * 0.09, cy - br * 0.12, br * 0.065, 0, 6.283); c.arc(x + br * 0.09, cy - br * 0.12, br * 0.065, 0, 6.283); c.fill();
      // блик
      c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(x - br * 0.45, cy - br * 0.45, br * 0.2, br * 0.12, -0.7, 0, 6.283); c.fill();
      // колпачок
      var cg = c.createLinearGradient(x - br * 0.25, 0, x + br * 0.25, 0);
      cg.addColorStop(0, '#6b7280'); cg.addColorStop(0.4, '#e5e7eb'); cg.addColorStop(1, '#4b5563');
      c.fillStyle = cg; rr(c, x - br * 0.24, top - br * 0.08, br * 0.48, br * 0.24, 3); c.fill();
      // фитиль
      var fx = x + r * 0.25, fy = top - r * 0.48;
      c.strokeStyle = '#78350f'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, top - br * 0.06); c.quadraticCurveTo(x + r * 0.32, top - r * 0.25, fx, fy); c.stroke();
      c.strokeStyle = '#d6a35c'; c.lineWidth = 1.5; c.setLineDash([2, 3]);
      c.beginPath(); c.moveTo(x, top - br * 0.06); c.quadraticCurveTo(x + r * 0.32, top - r * 0.25, fx, fy); c.stroke();
      c.setLineDash([]); c.lineCap = 'butt';
      // искра
      if (Q > 0) {
        var sg = c.createRadialGradient(fx, fy, 0, fx, fy, r * 0.35);
        sg.addColorStop(0, 'rgba(254,240,138,.9)'); sg.addColorStop(1, 'rgba(249,115,22,0)');
        c.fillStyle = sg; c.beginPath(); c.arc(fx, fy, r * 0.35, 0, 6.283); c.fill();
        c.strokeStyle = '#fde047'; c.lineWidth = 1.5;
        for (var s = 0; s < 6; s++) {
          var a = s * 1.047 + t * 9, l1 = 4, l2 = 8 + 4 * Math.sin(t * 40 + s);
          c.beginPath(); c.moveTo(fx + Math.cos(a) * l1, fy + Math.sin(a) * l1); c.lineTo(fx + Math.cos(a) * l2, fy + Math.sin(a) * l2); c.stroke();
        }
      }
      c.fillStyle = Math.sin(t * 30) > 0 ? '#fde047' : '#f97316'; c.beginPath(); c.arc(fx, fy, 4.5, 0, 6.283); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(fx, fy, 2, 0, 6.283); c.fill();
    }

    function drawMole(c, h, x, top, r, i, Q, ly) {
      var gold = h.kind === 'gold', ice = h.kind === 'ice';
      var C0 = gold ? '#fff7b0' : ice ? '#e0f2fe' : '#c58b55', C1 = gold ? '#f5c518' : ice ? '#7dd3fc' : '#8f5a2c', C2 = gold ? '#a16207' : ice ? '#0369a1' : '#4f2f12';
      var hw = r * 0.75, hy = top + r * 0.5;
      // ушки
      c.fillStyle = C1; c.beginPath(); c.arc(x - hw * 0.78, top + r * 0.2, r * 0.17, 0, 6.283); c.arc(x + hw * 0.78, top + r * 0.2, r * 0.17, 0, 6.283); c.fill();
      c.fillStyle = gold ? '#fbcfe8' : ice ? '#bae6fd' : '#e8a87c'; c.beginPath(); c.arc(x - hw * 0.78, top + r * 0.21, r * 0.09, 0, 6.283); c.arc(x + hw * 0.78, top + r * 0.21, r * 0.09, 0, 6.283); c.fill();
      // тело
      var bg = c.createRadialGradient(x - r * 0.28, top + r * 0.3, r * 0.08, x, top + r * 0.7, r * 1.25);
      bg.addColorStop(0, C0); bg.addColorStop(0.55, C1); bg.addColorStop(1, C2);
      c.fillStyle = bg;
      c.beginPath(); c.moveTo(x - hw, ly + r); c.lineTo(x - hw, top + r * 0.7);
      c.quadraticCurveTo(x - hw, top, x, top); c.quadraticCurveTo(x + hw, top, x + hw, top + r * 0.7);
      c.lineTo(x + hw, ly + r); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(40,20,5,.35)'; c.lineWidth = 1.5; c.stroke();
      // брюшко
      c.fillStyle = gold ? 'rgba(255,251,235,.55)' : ice ? 'rgba(255,255,255,.45)' : 'rgba(250,215,170,.5)';
      c.beginPath(); c.ellipse(x, top + r * 1.25, hw * 0.62, r * 0.45, 0, 0, 6.283); c.fill();
      // шерсть: короткие штрихи
      c.strokeStyle = gold ? 'rgba(161,98,7,.45)' : ice ? 'rgba(3,105,161,.35)' : 'rgba(60,30,10,.45)'; c.lineWidth = 1.2; c.lineCap = 'round';
      c.beginPath();
      for (var f = 0; f < 7; f++) {
        var fa = -2.6 + f * 0.37, fx0 = x + Math.cos(fa) * hw * 0.82, fy0 = top + r * 0.55 + Math.sin(fa) * r * 0.5;
        c.moveTo(fx0, fy0); c.lineTo(fx0 + Math.cos(fa + 0.5) * 4, fy0 + Math.sin(fa + 0.5) * 4);
      }
      c.moveTo(x - 3, top + 1); c.lineTo(x - 5, top - 4); c.moveTo(x, top); c.lineTo(x + 1, top - 6); c.moveTo(x + 3, top + 1); c.lineTo(x + 6, top - 3);
      c.stroke(); c.lineCap = 'butt';
      // блик на макушке
      c.fillStyle = 'rgba(255,255,255,' + (gold || ice ? 0.5 : 0.22) + ')';
      c.beginPath(); c.ellipse(x - hw * 0.35, top + r * 0.22, hw * 0.28, r * 0.12, -0.5, 0, 6.283); c.fill();
      // щёчки
      c.fillStyle = 'rgba(244,114,182,.35)'; c.beginPath(); c.ellipse(x - r * 0.48, top + r * 0.68, r * 0.13, r * 0.08, 0, 0, 6.283); c.ellipse(x + r * 0.48, top + r * 0.68, r * 0.13, r * 0.08, 0, 0, 6.283); c.fill();
      // мордочка
      var mg = c.createRadialGradient(x, top + r * 0.7, r * 0.05, x, top + r * 0.8, r * 0.42);
      mg.addColorStop(0, '#fff1dc'); mg.addColorStop(1, gold ? '#fcd34d' : ice ? '#dbeafe' : '#f2c393');
      c.fillStyle = mg; c.beginPath(); c.ellipse(x, top + r * 0.8, r * 0.4, r * 0.29, 0, 0, 6.283); c.fill();
      // глаза
      var ey = top + r * 0.42, ex = r * 0.28;
      if (h.hit) {
        c.strokeStyle = '#1c1008'; c.lineWidth = 3; c.lineCap = 'round';
        [-1, 1].forEach(function (sd) { var cx = x + sd * ex; c.beginPath(); c.moveTo(cx - 5, ey - 5); c.lineTo(cx + 5, ey + 5); c.moveTo(cx + 5, ey - 5); c.lineTo(cx - 5, ey + 5); c.stroke(); });
        c.lineCap = 'butt';
        // кружащиеся звёздочки
        for (var st = 0; st < 3; st++) {
          var sa = t * 7 + st * 2.094;
          star5(c, x + Math.cos(sa) * r * 0.55, top - r * 0.12 + Math.sin(sa) * r * 0.15, r * 0.13, st % 2 ? '#fde047' : '#fff');
        }
      } else {
        var blink = ((t * 0.7 + i * 0.37) % 3) < 0.08;
        if (blink) {
          c.strokeStyle = '#1c1008'; c.lineWidth = 2.5; c.lineCap = 'round';
          c.beginPath(); c.moveTo(x - ex - 5, ey); c.lineTo(x - ex + 5, ey); c.moveTo(x + ex - 5, ey); c.lineTo(x + ex + 5, ey); c.stroke(); c.lineCap = 'butt';
        } else {
          c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x - ex, ey, r * 0.12, r * 0.14, 0, 0, 6.283); c.ellipse(x + ex, ey, r * 0.12, r * 0.14, 0, 0, 6.283); c.fill();
          c.fillStyle = '#1c1008'; c.beginPath(); c.ellipse(x - ex + 1, ey + 1, r * 0.085, r * 0.105, 0, 0, 6.283); c.ellipse(x + ex - 1, ey + 1, r * 0.085, r * 0.105, 0, 0, 6.283); c.fill();
          c.fillStyle = '#fff'; c.beginPath(); c.arc(x - ex - r * 0.02, ey - r * 0.04, r * 0.035, 0, 6.283); c.arc(x + ex - r * 0.04, ey - r * 0.04, r * 0.035, 0, 6.283); c.fill();
        }
      }
      // нос
      var ng = c.createRadialGradient(x - r * 0.04, top + r * 0.64, 1, x, top + r * 0.68, r * 0.15);
      ng.addColorStop(0, '#fbcfe8'); ng.addColorStop(1, '#db2777');
      c.fillStyle = ng; c.beginPath(); c.ellipse(x, top + r * 0.68, r * 0.14, r * 0.1, 0, 0, 6.283); c.fill();
      c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.ellipse(x - r * 0.05, top + r * 0.65, r * 0.04, r * 0.025, 0, 0, 6.283); c.fill();
      // рот и усы
      c.strokeStyle = 'rgba(70,35,10,.8)'; c.lineWidth = 1.4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, top + r * 0.77); c.lineTo(x, top + r * 0.84);
      c.moveTo(x - r * 0.14, top + r * 0.86); c.quadraticCurveTo(x, top + r * 0.92, x + r * 0.14, top + r * 0.86); c.stroke();
      c.strokeStyle = 'rgba(40,20,5,.55)'; c.lineWidth = 1;
      c.beginPath();
      for (var w = -1; w <= 1; w++) {
        c.moveTo(x - r * 0.3, top + r * 0.78 + w * 3); c.lineTo(x - r * 0.62, top + r * 0.74 + w * 7);
        c.moveTo(x + r * 0.3, top + r * 0.78 + w * 3); c.lineTo(x + r * 0.62, top + r * 0.74 + w * 7);
      }
      c.stroke(); c.lineCap = 'butt';
      // зубки
      c.fillStyle = '#fff'; c.strokeStyle = 'rgba(120,80,40,.6)'; c.lineWidth = 1;
      rr(c, x - r * 0.1, top + r * 0.87, r * 0.095, r * 0.14, 2); c.fill(); c.stroke();
      rr(c, x + r * 0.005, top + r * 0.87, r * 0.095, r * 0.14, 2); c.fill(); c.stroke();
      // лапки на краю
      if (h.p > 0.75 && !h.hit) {
      c.fillStyle = gold ? '#fde68a' : ice ? '#e0f2fe' : '#f2c393';
      c.beginPath(); c.ellipse(x - hw * 1.0, ly - r * 0.02, r * 0.17, r * 0.11, 0, 0, 6.283); c.ellipse(x + hw * 1.0, ly - r * 0.02, r * 0.17, r * 0.11, 0, 0, 6.283); c.fill();
      c.strokeStyle = 'rgba(90,50,20,.5)'; c.beginPath();
      for (var cl = -1; cl <= 1; cl++) { c.moveTo(x - hw * 1.0 + cl * r * 0.06, ly - r * 0.08); c.lineTo(x - hw * 1.0 + cl * r * 0.06, ly - r * 0.02); c.moveTo(x + hw * 1.0 + cl * r * 0.06, ly - r * 0.08); c.lineTo(x + hw * 1.0 + cl * r * 0.06, ly - r * 0.02); }
      c.stroke();
      }
      if (h.kind === 'helmet' && h.hp > 1) {
        var hg = c.createLinearGradient(x - r * 0.7, 0, x + r * 0.7, 0);
        hg.addColorStop(0, '#ca8a04'); hg.addColorStop(0.35, '#fde047'); hg.addColorStop(1, '#a16207');
        c.fillStyle = hg; c.beginPath(); c.arc(x, top + r * 0.28, r * 0.68, Math.PI, 0); c.closePath(); c.fill();
        c.strokeStyle = '#854d0e'; c.lineWidth = 1.5; c.stroke();
        c.fillStyle = 'rgba(133,77,14,.6)'; c.fillRect(x - r * 0.07, top - r * 0.38, r * 0.14, r * 0.64);
        var bg2 = c.createLinearGradient(0, top + r * 0.22, 0, top + r * 0.36);
        bg2.addColorStop(0, '#facc15'); bg2.addColorStop(1, '#a16207');
        c.fillStyle = bg2; rr(c, x - r * 0.82, top + r * 0.22, r * 1.64, r * 0.13, 4); c.fill();
        c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(x - r * 0.32, top - r * 0.12, r * 0.16, r * 0.08, -0.6, 0, 6.283); c.fill();
        // лампа
        c.fillStyle = '#e5e7eb'; c.beginPath(); c.arc(x, top + r * 0.06, r * 0.13, 0, 6.283); c.fill();
        c.fillStyle = '#fef9c3'; c.beginPath(); c.arc(x, top + r * 0.06, r * 0.08, 0, 6.283); c.fill();
      }
      if (ice) {
        c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.5; c.lineCap = 'round';
        var sx = x, sy = top - r * 0.12, s = r * 0.2;
        c.beginPath();
        for (var a = 0; a < 3; a++) { var aa = a * Math.PI / 3; c.moveTo(sx - Math.cos(aa) * s, sy - Math.sin(aa) * s); c.lineTo(sx + Math.cos(aa) * s, sy + Math.sin(aa) * s); }
        c.stroke();
        // иней по краю
        c.fillStyle = 'rgba(255,255,255,.7)';
        for (var fr = 0; fr < 5; fr++) { var fa2 = Math.PI + 0.4 + fr * 0.55; c.beginPath(); c.arc(x + Math.cos(fa2) * hw * 0.9, top + r * 0.6 + Math.sin(fa2) * r * 0.55, 2, 0, 6.283); c.fill(); }
        c.lineCap = 'butt';
      }
    }

    function drawHammer(c, hm) {
      var k = 1 - hm.life / 0.18;
      c.save(); c.translate(hm.x, hm.y); c.rotate(-0.6 + k * 0.9);
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(6, 44, 16, 5, 0, 0, 6.283); c.fill();
      var hg = c.createLinearGradient(-4, 0, 4, 0); hg.addColorStop(0, '#5b2e0e'); hg.addColorStop(0.5, '#b0743a'); hg.addColorStop(1, '#5b2e0e');
      c.fillStyle = hg; rr(c, -4, -8, 8, 50, 3); c.fill();
      c.strokeStyle = 'rgba(60,25,5,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-1, 2); c.lineTo(-1, 38); c.moveTo(2, 8); c.lineTo(2, 30); c.stroke();
      c.fillStyle = '#1f2937'; c.fillRect(-4.5, 30, 9, 3); c.fillRect(-4.5, 35, 9, 3);
      var mg = c.createLinearGradient(0, -24, 0, -2); mg.addColorStop(0, '#fca5a5'); mg.addColorStop(0.35, '#ef4444'); mg.addColorStop(1, '#991b1b');
      c.fillStyle = mg; rr(c, -21, -24, 42, 22, 6); c.fill();
      c.fillStyle = '#cbd5e1'; c.fillRect(-21, -24, 5, 22); c.fillRect(16, -24, 5, 22);
      c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(-21, -22, 42, 3);
      c.strokeStyle = 'rgba(80,10,10,.6)'; c.lineWidth = 1.2; rr(c, -21, -24, 42, 22, 6); c.stroke();
      c.restore();
    }
    function hitFx(x, y, hitK) {
      var n = api.quality === 0 ? 4 : 10;
      for (var i = 0; i < n; i++) {
        var a = Math.PI + Math.random() * Math.PI, v = 40 + Math.random() * 90;
        dust.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, r: 3 + Math.random() * 4, life: 0.5, max: 0.5, c: Math.random() < 0.5 ? '#a47148' : '#d6b48c' });
      }
      if (hitK) for (var s = 0; s < 5; s++) {
        var sa = s * 1.2566 + Math.random() * 0.5, sv = 120 + Math.random() * 60;
        dust.push({ x: x, y: y - 10, vx: Math.cos(sa) * sv, vy: Math.sin(sa) * sv, r: 5, life: 0.4, max: 0.4, c: hitK === 'bomb' ? '#fb923c' : '#fde047', star: true });
      }
    }
  }
};
