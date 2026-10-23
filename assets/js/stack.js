/* Башня: ставь блоки точно друг на друга */
window.GAMES = window.GAMES || {};
window.GAMES.stack = {
  title: 'Башня',
  desc: 'Строй башню до небес',
  hint: 'Тапни, чтобы опустить блок. Всё, что свисает, отрежется. Ставь точно — за серию идеальных блоков он снова станет шире!',
  colors: ['#06b6d4', '#6366f1'],
  controls: 'none',
  keyAsTap: true,
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="stSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e1b4b"/><stop offset="1" stop-color="#0e7490"/></linearGradient></defs><rect x="4" y="4" width="92" height="92" rx="18" fill="url(#stSky)"/><circle cx="20" cy="20" r="9" fill="#fde047" opacity=".25"/><circle cx="20" cy="20" r="4.5" fill="#fef9c3"/><circle cx="12" cy="40" r="1.5" fill="#fff" opacity=".7"/><circle cx="34" cy="12" r="1.2" fill="#fff" opacity=".6"/><path d="M4 88 L20 74 L32 80 L50 68 L68 78 L96 66 V96 H4z" fill="#000" opacity=".2"/><g><path d="M20 74 h52 l6 -5 h-52z" fill="#a5b4fc"/><path d="M72 74 v14 l6 -5 v-14z" fill="#3730a3"/><rect x="20" y="74" width="52" height="14" fill="#6366f1"/><path d="M24 58 h46 l6 -5 h-46z" fill="#c4b5fd"/><path d="M70 58 v14 l6 -5 v-14z" fill="#5b21b6"/><rect x="24" y="58" width="46" height="14" fill="#8b5cf6"/><path d="M28 42 h42 l6 -5 h-42z" fill="#f0abfc"/><path d="M70 42 v14 l6 -5 v-14z" fill="#86198f"/><rect x="28" y="42" width="42" height="14" fill="#d946ef"/><path d="M40 22 h42 l6 -5 h-42z" fill="#fbcfe8"/><path d="M82 22 v14 l6 -5 v-14z" fill="#9d174d"/><rect x="40" y="22" width="42" height="14" fill="#f472b6"/></g><g fill="#fff" opacity=".3"><rect x="20" y="74" width="52" height="2"/><rect x="24" y="58" width="46" height="2"/><rect x="28" y="42" width="42" height="2"/><rect x="40" y="22" width="42" height="2"/></g><path d="M40 38 v3 M82 38 v3" stroke="#fff" stroke-width="1.5" opacity=".6"/></svg>',

  create: function (api) {
    var DIFF = [
      { speed: 150, acc: 3, w: 0.62, perfect: 7 },
      { speed: 190, acc: 4, w: 0.55, perfect: 5 },
      { speed: 240, acc: 5, w: 0.5, perfect: 4 },
      { speed: 290, acc: 6, w: 0.44, perfect: 3 }
    ];
    var D, blocks, cur, dir, speed, cam, camT, chips, combo, dead, deadT, t, hue0, flash, rings;
    var BH = 28;

    function col(i, l) { return 'hsl(' + ((hue0 + i * 9) % 360) + ',78%,' + (l || 60) + '%)'; }
    function baseY() { return api.H - 70; }
    function yOf(i) { return baseY() - i * BH; }

    function spawn() {
      var top = blocks[blocks.length - 1];
      dir = blocks.length % 2 ? 1 : -1;
      cur = { x: dir > 0 ? -top.w * 0.3 : api.W - top.w * 0.7, w: top.w, i: blocks.length, gold: blocks.length % 10 === 9 }; // v2.0: каждый 10-й блок золотой
      speed = D.speed + blocks.length * D.acc;
    }
    function drop() {
      if (dead || !cur) return;
      var top = blocks[blocks.length - 1];
      var l = Math.max(cur.x, top.x), r = Math.min(cur.x + cur.w, top.x + top.w), w = r - l;
      if (w <= 0) { // промах
        chips.push({ x: cur.x, y: yOf(cur.i), w: cur.w, vy: 0, vx: dir * 60, r: 0, c: col(cur.i) });
        cur = null; dead = true; deadT = 1.1; api.sound('hit'); api.vibrate(90); return;
      }
      var diff = Math.abs(cur.x - top.x);
      if (diff < 5) { // идеально
        combo++;
        cur.x = top.x; w = top.w; l = top.x;
        rings.push({ x: l, w: w, y: yOf(cur.i), life: 0.6 });
        if (combo >= D.perfect) { // расширение за серию
          var grow = Math.min(api.W * D.w, w + 16) - w;
          l -= grow / 2; w += grow;
          api.toast(api.t('stack.grow'));
        }
        api.sound(combo > 2 ? 'coin' : 'point'); api.vibrate(20);
        api.addScore(2 + Math.min(combo, 10));
        if (cur.gold) {
          api.addScore(10); var gg = Math.min(api.W * D.w, w + 24) - w; l -= gg / 2; w += gg;
          api.fx.text(api.W / 2, yOf(cur.i) + cam - 40, api.t('stack.gold'), '#fde047', 20); api.sound('bonus');
        }
      } else {
        combo = 0;
        var cutX = cur.x < top.x ? cur.x : r, cutW = cur.w - w;
        chips.push({ x: cutX, y: yOf(cur.i), w: cutW, vy: 0, vx: (cur.x < top.x ? -1 : 1) * 80, r: 0, c: col(cur.i) });
        api.sound('drop'); api.vibrate(10);
        api.addScore(1);
      }
      blocks.push({ x: l, w: w, i: cur.i, gold: cur.gold });
      flash = 0.15;
      if (blocks.length % 25 === 1 && blocks.length > 1) { api.fx.confetti(50); api.toast(api.t('stack.height', blocks.length - 1)); api.sound('win'); }
      spawn();
    }

    var DX = 9, DY = 7; // псевдо-3D глубина блока
    var bgOff = null, bgW = 0, bgH = 0, cloud = null, vig = null;
    function mkCanvas(w, h) {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var o = document.createElement('canvas'); o.width = Math.ceil(w * dpr); o.height = Math.ceil(h * dpr);
      var oc = o.getContext('2d'); oc.scale(dpr, dpr); return { cv: o, c: oc };
    }
    function buildBg() {
      var W = api.W, H = api.H; bgW = W; bgH = H;
      // силуэты гор и города (тонируются фоном за счёт полупрозрачности)
      var m = mkCanvas(W, H), o = m.c, k, x;
      var rnd = (function () { var sd = 7; return function () { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }; })();
      o.fillStyle = 'rgba(255,255,255,.07)';
      o.beginPath(); o.moveTo(0, H);
      for (x = 0; x <= W; x += 20) o.lineTo(x, H - 250 - Math.sin(x * 0.012) * 50 - Math.sin(x * 0.031 + 1) * 25 - rnd() * 10);
      o.lineTo(W, H); o.closePath(); o.fill();
      o.fillStyle = 'rgba(0,0,0,.16)';
      o.beginPath(); o.moveTo(0, H);
      for (x = 0; x <= W; x += 16) o.lineTo(x, H - 170 - Math.sin(x * 0.02 + 2) * 34 - rnd() * 12);
      o.lineTo(W, H); o.closePath(); o.fill();
      // город
      o.fillStyle = 'rgba(0,0,0,.22)';
      for (x = -10; x < W; x += 0) {
        var bw = 16 + rnd() * 26, bh = 40 + rnd() * 80;
        o.fillRect(x, H - 70 - bh, bw, bh + 70);
        if (rnd() < 0.4) o.fillRect(x + bw * 0.4, H - 70 - bh - 14, 3, 14);
        x += bw + 2;
      }
      o.fillStyle = 'rgba(255,240,180,.22)';
      for (k = 0; k < 90; k++) o.fillRect(rnd() * W, H - 70 - rnd() * 110, 3, 4);
      bgOff = m.cv;
      var vm = mkCanvas(W, H), vc = vm.c, vg = vc.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); vc.fillStyle = vg; vc.fillRect(0, 0, W, H); vig = vm.cv;
      // облако-спрайт
      var cm = mkCanvas(140, 60), cc = cm.c;
      var cg = cc.createLinearGradient(0, 10, 0, 56);
      cg.addColorStop(0, 'rgba(255,255,255,.55)'); cg.addColorStop(1, 'rgba(255,255,255,.12)');
      cc.fillStyle = cg; cc.beginPath();
      cc.arc(40, 38, 18, 0, 7); cc.arc(66, 28, 22, 0, 7); cc.arc(94, 36, 18, 0, 7); cc.arc(112, 44, 12, 0, 7); cc.rect(28, 38, 88, 18);
      cc.fill();
      cloud = cm.cv;
    }

    function block(c, x, y, w, i, a, gold) {
      var top = y - BH;
      c.globalAlpha = a == null ? 1 : a;
      // правая грань
      c.fillStyle = gold ? '#a16207' : col(i, 36);
      c.beginPath(); c.moveTo(x + w, top); c.lineTo(x + w + DX, top - DY); c.lineTo(x + w + DX, y - DY); c.lineTo(x + w, y); c.closePath(); c.fill();
      // верхняя грань
      c.fillStyle = gold ? '#fef3c7' : col(i, 76);
      c.beginPath(); c.moveTo(x, top); c.lineTo(x + DX, top - DY); c.lineTo(x + w + DX, top - DY); c.lineTo(x + w, top); c.closePath(); c.fill();
      // фронт
      var g = c.createLinearGradient(x, top, x + w, y);
      if (gold) { g.addColorStop(0, '#fde68a'); g.addColorStop(0.5, '#f59e0b'); g.addColorStop(1, '#b45309'); }
      else { g.addColorStop(0, col(i, 64)); g.addColorStop(1, col(i, 47)); }
      c.fillStyle = g; c.fillRect(x, top, w, BH);
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x, top, w, 2);
      c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x, top, 2, BH);
      c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(x, y - 3, w, 3);
      // фаска-блик
      if (api.quality > 0 && w > 24) {
        c.fillStyle = 'rgba(255,255,255,.12)';
        c.beginPath(); c.moveTo(x + w * 0.12, top + 2); c.lineTo(x + w * 0.3, top + 2); c.lineTo(x + w * 0.22, y - 3); c.lineTo(x + w * 0.04, y - 3); c.closePath(); c.fill();
      }
      if (gold) { c.fillStyle = 'rgba(255,255,255,.7)'; c.font = '900 14px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('★', x + w / 2, top + BH / 2 + 1); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; }
      c.globalAlpha = 1;
    }

    return {
      reset: function () {
        D = DIFF[api.diff]; t = 0; combo = 0; dead = false; deadT = 0; chips = []; rings = []; flash = 0;
        hue0 = Math.floor(Math.random() * 360);
        var w = api.W * D.w;
        blocks = [{ x: (api.W - w) / 2, w: w, i: 0 }];
        cam = 0; camT = 0; cur = null; spawn();
        if (!bgOff || bgW !== api.W || bgH !== api.H) buildBg();
      },
      resize: function () { buildBg(); },
      idle: function (dt) {
        t += dt;
        if (cur) { cur.x += dir * D.speed * 0.5 * dt; if (cur.x > api.W - cur.w * 0.3 || cur.x < -cur.w * 0.7) dir = -dir; }
      },
      input: function (type) { if (type === 'down') drop(); },
      key: function (k, down) { if (down && (k === 'a' || k === 'b')) drop(); },
      update: function (dt) {
        t += dt; flash = Math.max(0, flash - dt);
        if (cur) {
          cur.x += dir * speed * dt;
          var top = blocks[blocks.length - 1];
          if (dir > 0 && cur.x > top.x + top.w + 30) dir = -1;
          if (dir < 0 && cur.x + cur.w < top.x - 30) dir = 1;
        }
        camT = Math.max(0, (blocks.length - 7) * BH);
        cam += (camT - cam) * Math.min(1, dt * 6);
        chips = chips.filter(function (p) { p.vy += 1400 * dt; p.y += p.vy * dt; p.x += p.vx * dt; p.r += dt * p.vx * 0.02; return p.y < api.H + cam + 200; });
        rings = rings.filter(function (r) { r.life -= dt; return r.life > 0; });
        if (dead) { deadT -= dt; if (deadT <= 0) api.gameOver(); }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        var h = blocks.length;
        var g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, 'hsl(' + ((hue0 + 200 + h * 3) % 360) + ',55%,' + Math.max(8, 30 - h * 0.25) + '%)');
        g.addColorStop(1, 'hsl(' + ((hue0 + 240 + h * 3) % 360) + ',60%,' + Math.max(14, 48 - h * 0.3) + '%)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        if (!bgOff || bgW !== W || bgH !== H) buildBg();
        // солнце / свечение
        var sunA = Math.max(0, 1 - h / 60);
        if (sunA > 0) {
          var sg = c.createRadialGradient(W * 0.78, 150 + cam * 0.05, 4, W * 0.78, 150 + cam * 0.05, 120);
          sg.addColorStop(0, 'rgba(255,250,220,' + 0.9 * sunA + ')'); sg.addColorStop(0.18, 'rgba(255,230,170,' + 0.45 * sunA + ')'); sg.addColorStop(1, 'rgba(255,200,150,0)');
          c.fillStyle = sg; c.fillRect(0, 0, W, H);
        }
        // звёзды выше
        c.fillStyle = '#fff';
        for (var s = 0; s < 50; s++) {
          var sy = ((s * 97 + cam * 0.3) % (H + 40)) - 20;
          c.globalAlpha = Math.min(1, h / 40) * (0.3 + 0.7 * Math.abs(Math.sin(t + s)));
          c.fillRect((s * 131) % W, sy, s % 5 ? 1.5 : 2.5, s % 5 ? 1.5 : 2.5);
        }
        c.globalAlpha = 1;
        // параллакс: горы и город уезжают вниз
        if (cam * 0.25 < H) c.drawImage(bgOff, 0, cam * 0.25, W, H);
        // облака
        if (cloud) {
          for (var q = 0; q < 6; q++) {
            var cy = ((q * 173 + cam * 0.55) % (H + 300)) - 120;
            var cx = ((q * 89 + t * (6 + q * 2)) % (W + 160)) - 140;
            c.globalAlpha = 0.6 - q * 0.05; c.drawImage(cloud, cx, cy, 140 - q * 8, 60 - q * 3);
          }
          c.globalAlpha = 1;
        }
        c.save(); c.translate(0, cam);
        // земля / постамент
        var by = baseY();
        var gg2 = c.createLinearGradient(0, by, 0, by + 70);
        gg2.addColorStop(0, 'rgba(0,0,0,.30)'); gg2.addColorStop(1, 'rgba(0,0,0,.55)');
        c.fillStyle = gg2; c.fillRect(0, by, W, H);
        c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(0, by, W, 1.5);
        var b0 = blocks[0];
        c.fillStyle = 'rgba(0,0,0,.35)';
        c.beginPath(); c.ellipse ? c.ellipse(b0.x + b0.w / 2 + 6, by + 6, b0.w * 0.62, 9, 0, 0, 7) : c.rect(b0.x - 10, by, b0.w + 20, 12); c.fill();
        for (var i = 0; i < blocks.length; i++) {
          var b = blocks[i], y = yOf(b.i);
          if (y + cam < -BH || y + cam > H + BH) continue;
          block(c, b.x, y, b.w, b.i, 1, b.gold);
        }
        if (cur) {
          block(c, cur.x, yOf(cur.i), cur.w, cur.i, 1, cur.gold);
          if (cur.gold) { c.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.3 * Math.sin(t * 10)) + ')'; c.fillRect(cur.x, yOf(cur.i) - BH, cur.w, BH); }
        }
        // отметки высоты
        c.fillStyle = 'rgba(255,255,255,.35)'; c.font = '800 10px system-ui, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle';
        for (var m = 10; m <= blocks.length + 12; m += 10) { var my = yOf(m); c.fillRect(0, my, 10, 2); c.fillText(String(m), 13, my); }
        chips.forEach(function (p) {
          c.save(); c.translate(p.x + p.w / 2, p.y - BH / 2); c.rotate(p.r);
          c.globalAlpha = 0.95; c.fillStyle = p.c; c.fillRect(-p.w / 2, -BH / 2, p.w, BH);
          c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-p.w / 2, -BH / 2, p.w, 2); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-p.w / 2, BH / 2 - 3, p.w, 3); c.restore();
        });
        rings.forEach(function (r) {
          var k = 1 - r.life / 0.6, pad = k * 22;
          c.strokeStyle = 'rgba(255,255,255,' + (1 - k) + ')'; c.lineWidth = 3;
          c.strokeRect(r.x - pad, r.y - BH - pad, r.w + pad * 2, BH + pad * 2);
          if (api.quality > 0) { c.fillStyle = 'rgba(255,255,255,' + 0.35 * (1 - k) + ')'; c.fillRect(r.x, r.y - BH, r.w, BH); }
        });
        c.restore();
        if (vig) c.drawImage(vig, 0, 0, W, H);
        if (flash > 0) { c.fillStyle = 'rgba(255,255,255,' + flash * 0.6 + ')'; c.fillRect(0, 0, W, H); }
        // счёт по центру
        c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'center';
        c.font = '900 64px system-ui, sans-serif'; c.fillStyle = 'rgba(0,0,0,.25)'; c.fillText(blocks.length - 1, W / 2 + 2, 99); c.fillStyle = 'rgba(255,255,255,.95)'; c.fillText(blocks.length - 1, W / 2, 96);
        if (combo > 1) { c.font = '800 16px system-ui, sans-serif'; c.fillStyle = '#fde047'; c.fillText('PERFECT ×' + combo, W / 2, 124); }
        c.textAlign = 'left';
      }
    };
  }
};
