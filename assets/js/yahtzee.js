/* Покер на костях (Yahtzee): 13 раундов, 3 броска за ход */
window.GAMES = window.GAMES || {};
window.GAMES.yahtzee = {
  title: 'Покер на костях',
  desc: 'Собери лучшие комбинации',
  hint: 'Бросай 5 кубиков до 3 раз за ход. Тапни кубик, чтобы оставить его. Потом выбери строку в таблице — очки за комбинацию. 13 ходов. Сумма 1–6 от 63 даёт +35 бонус. Пять одинаковых — «Покер» (50)!',
  d0: 'Подсказка лучших очков', d1: 'Подсказка очков', d2: 'Без подсказок', d3: 'Без подсказок, 2 броска за ход',
  colors: ['#b91c1c', '#7c2d12'],
  controls: 'none',
  isNew3: true,
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="yahtzeeD" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#f1f3f7"/><stop offset="1" stop-color="#cfd4de"/></linearGradient>' +
    '<radialGradient id="yahtzeeF" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#1f8f50"/><stop offset="1" stop-color="#0d5a2f"/></radialGradient></defs>' +
    '<rect x="4" y="4" width="92" height="92" rx="16" fill="#6b3b1f"/><rect x="9" y="9" width="82" height="82" rx="12" fill="url(#yahtzeeF)"/>' +
    '<ellipse cx="32" cy="74" rx="18" ry="4" fill="#000" opacity=".35"/><ellipse cx="70" cy="70" rx="18" ry="4" fill="#000" opacity=".35"/>' +
    '<g transform="rotate(-12 31 52)"><rect x="12" y="34" width="38" height="38" rx="8" fill="#b9bfcc"/><rect x="12" y="31" width="38" height="37" rx="8" fill="url(#yahtzeeD)"/>' +
    '<g fill="#b91c1c"><circle cx="21" cy="40" r="4"/><circle cx="31" cy="50" r="4"/><circle cx="41" cy="60" r="4"/></g></g>' +
    '<g transform="rotate(10 69 47)"><rect x="50" y="30" width="38" height="38" rx="8" fill="#b9bfcc"/><rect x="50" y="27" width="38" height="37" rx="8" fill="url(#yahtzeeD)"/>' +
    '<g fill="#b91c1c"><circle cx="59" cy="36" r="4"/><circle cx="79" cy="36" r="4"/><circle cx="59" cy="55" r="4"/><circle cx="79" cy="55" r="4"/><circle cx="69" cy="45.5" r="4"/></g></g></svg>',

  create: function (api) {
    var CATS = ['1', '2', '3', '4', '5', '6', 'k3', 'k4', 'full', 'sm', 'lg', 'yz', 'ch'];
    var dice, keep, rolls, maxRolls, used, scores, round, rollAnim, t, endT, rows, rollBtn, yzBonus;
    function counts() { var c = [0, 0, 0, 0, 0, 0, 0]; dice.forEach(function (d) { c[d]++; }); return c; }
    function sum() { return dice.reduce(function (a, b) { return a + b; }, 0); }
    function scoreFor(cat) {
      var c = counts(), s = sum(), max = Math.max.apply(null, c);
      var has = function (seq) { return seq.every(function (v) { return c[v] > 0; }); };
      switch (cat) {
        case 'k3': return max >= 3 ? s : 0;
        case 'k4': return max >= 4 ? s : 0;
        case 'full': return (c.indexOf(3) > 0 && c.indexOf(2) > 0) || max === 5 ? 25 : 0;
        case 'sm': return has([1, 2, 3, 4]) || has([2, 3, 4, 5]) || has([3, 4, 5, 6]) ? 30 : 0;
        case 'lg': return has([1, 2, 3, 4, 5]) || has([2, 3, 4, 5, 6]) ? 40 : 0;
        case 'yz': return max === 5 ? 50 : 0;
        case 'ch': return s;
        default: var v = +cat; return c[v] * v;
      }
    }
    function upper() { var u = 0; for (var i = 0; i < 6; i++) if (used[CATS[i]]) u += scores[CATS[i]]; return u; }
    function total() { var tt = 0; CATS.forEach(function (k) { if (used[k]) tt += scores[k]; }); return tt + (upper() >= 63 ? 35 : 0) + yzBonus; }
    function roll() {
      if (rolls >= maxRolls || endT > 0) return;
      for (var i = 0; i < 5; i++) if (!keep[i]) dice[i] = 1 + Math.floor(Math.random() * 6);
      rolls++; rollAnim = 0.45; api.sound('rotate'); api.vibrate(15);
      if (counts().indexOf(5) > 0) { api.fx.confetti(50); api.toast(api.t('yz.yahtzee')); if (used.yz && scores.yz === 50) { yzBonus += 100; } }
    }
    function choose(cat) {
      if (!rolls || used[cat] || endT > 0) return;
      used[cat] = true; scores[cat] = scoreFor(cat);
      api.setScore(total());
      api.sound(scores[cat] ? 'coin' : 'move');
      if (scores[cat] >= 30) api.fx.text(api.W / 2, api.H * 0.2, '+' + scores[cat], '#fde047', 26);
      round++; rolls = 0; keep = [false, false, false, false, false];
      if (round > 13) { endT = 2; api.sound('win'); if (upper() >= 63) api.toast(api.t('yz.bonus')); }
    }
    var bgC = null, bgW = 0, bgH = 0, dieS = {}, dieKey = 0;
    var PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
    function mkC(w, h) {
      var d = Math.min(2, window.devicePixelRatio || 1), cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w * d)); cv.height = Math.max(1, Math.ceil(h * d));
      var x = cv.getContext('2d'); x.scale(d, d); return { cv: cv, x: x };
    }
    function rr(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
    }
    function geo() {
      var W = api.W, H = api.H, ds = Math.min(60, (W - 60) / 5), dy0 = 30, byy = dy0 + ds + 20, ty = byy + 58, rh = Math.min(44, (H - ty - 60) / 7);
      return { ds: ds, dx0: (W - ds * 5 - 32) / 2, dy0: dy0, byy: byy, ty: ty, rh: rh, colW: (W - 24) / 2 };
    }
    function buildBg() {
      var W = api.W, H = api.H, o = mkC(W, H), c = o.x, G = geo(), i;
      bgC = o.cv; bgW = W; bgH = H;
      var seed = 3; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      // деревянный стол
      var wg = c.createLinearGradient(0, 0, W, 0); wg.addColorStop(0, '#4a2a17'); wg.addColorStop(0.5, '#5d3520'); wg.addColorStop(1, '#43261a');
      c.fillStyle = wg; c.fillRect(0, 0, W, H);
      var pw = W / 4;
      for (i = 0; i < 4; i++) {
        c.fillStyle = 'rgba(' + (rnd() < 0.5 ? '255,200,150,' : '0,0,0,') + (rnd() * 0.07) + ')'; c.fillRect(i * pw, 0, pw, H);
        for (var k = 0; k < 26; k++) {
          var gx = i * pw + rnd() * pw; c.strokeStyle = 'rgba(30,12,4,' + (0.08 + rnd() * 0.14) + ')'; c.lineWidth = 0.6 + rnd();
          c.beginPath(); c.moveTo(gx, 0);
          for (var y = 0; y <= H; y += 40) c.lineTo(gx + Math.sin(y * 0.01 + k) * 3 + (rnd() - 0.5) * 1.5, y);
          c.stroke();
        }
        c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(i * pw, 0, 1.5, H);
        c.fillStyle = 'rgba(255,220,180,.06)'; c.fillRect(i * pw + 1.5, 0, 1, H);
      }
      // лоток для костей
      var tx = 6, ty0 = 2, tw = W - 12, th = G.dy0 + G.ds + 14;
      c.fillStyle = 'rgba(0,0,0,.45)'; rr(c, tx, ty0 + 3, tw, th, 14); c.fill();
      var rim = c.createLinearGradient(0, ty0, 0, ty0 + th); rim.addColorStop(0, '#9a6236'); rim.addColorStop(1, '#5b3218');
      c.fillStyle = rim; rr(c, tx, ty0, tw, th, 14); c.fill();
      var m = 5, fg = c.createRadialGradient(W / 2, ty0 + th * 0.5, 10, W / 2, ty0 + th * 0.5, tw * 0.6);
      fg.addColorStop(0, '#1f8f50'); fg.addColorStop(1, '#0d5a2f');
      c.fillStyle = fg; rr(c, tx + m, ty0 + m, tw - m * 2, th - m * 2, 10); c.fill();
      c.save(); rr(c, tx + m, ty0 + m, tw - m * 2, th - m * 2, 10); c.clip();
      for (i = 0; i < 2600; i++) { c.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.08)'; c.fillRect(tx + rnd() * tw, ty0 + rnd() * th, 1, 1); }
      c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 6; rr(c, tx + m - 3, ty0 + m - 3, tw - m * 2 + 6, th - m * 2 + 6, 12); c.stroke();
      c.restore();
      c.strokeStyle = 'rgba(255,220,170,.35)'; c.lineWidth = 1; rr(c, tx + 0.5, ty0 + 0.5, tw - 1, th - 1, 14); c.stroke();
      // бумажный бланк
      var sx = 6, sy = G.ty - 9, sw = W - 12, sh = G.rh * 7 + 16;
      c.fillStyle = 'rgba(0,0,0,.45)'; rr(c, sx + 2, sy + 5, sw, sh, 10); c.fill();
      var pg = c.createLinearGradient(0, sy, 0, sy + sh); pg.addColorStop(0, '#fffaf0'); pg.addColorStop(1, '#f3e7cf');
      c.fillStyle = pg; rr(c, sx, sy, sw, sh, 10); c.fill();
      c.save(); rr(c, sx, sy, sw, sh, 10); c.clip();
      for (i = 0; i < 1800; i++) { c.fillStyle = 'rgba(120,90,40,' + rnd() * 0.06 + ')'; c.fillRect(sx + rnd() * sw, sy + rnd() * sh, 1, 1); }
      c.fillStyle = 'rgba(220,38,38,.25)'; c.fillRect(W / 2 - 3, sy, 1, sh);
      c.restore();
      c.strokeStyle = 'rgba(120,80,30,.3)'; c.lineWidth = 1; rr(c, sx + 0.5, sy + 0.5, sw - 1, sh - 1, 10); c.stroke();
      // карандаш на столе
      var free = H - 28 - (sy + sh);
      if (free > 50) {
        var pcx = W * 0.55, pcy = sy + sh + free * 0.5, pl = Math.min(W * 0.6, 220), pw2 = 9;
        c.save(); c.translate(pcx, pcy); c.rotate(-0.18);
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(-pl / 2 + 4, -pw2 / 2 + 5, pl, pw2);
        var pb = c.createLinearGradient(0, -pw2 / 2, 0, pw2 / 2); pb.addColorStop(0, '#fde047'); pb.addColorStop(0.5, '#eab308'); pb.addColorStop(1, '#a16207');
        c.fillStyle = pb; c.fillRect(-pl / 2 + 16, -pw2 / 2, pl - 34, pw2);
        c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(-pl / 2 + 16, -0.5, pl - 34, 1);
        c.fillStyle = '#f5d0a9'; c.beginPath(); c.moveTo(pl / 2 - 18, -pw2 / 2); c.lineTo(pl / 2, 0); c.lineTo(pl / 2 - 18, pw2 / 2); c.fill();
        c.fillStyle = '#334155'; c.beginPath(); c.moveTo(pl / 2 - 6, -pw2 / 6); c.lineTo(pl / 2, 0); c.lineTo(pl / 2 - 6, pw2 / 6); c.fill();
        c.fillStyle = '#cbd5e1'; c.fillRect(-pl / 2 + 8, -pw2 / 2, 9, pw2);
        c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(-pl / 2 + 10, -pw2 / 2, 1, pw2); c.fillRect(-pl / 2 + 14, -pw2 / 2, 1, pw2);
        c.fillStyle = '#f472b6'; rr(c, -pl / 2, -pw2 / 2, 10, pw2, 3); c.fill();
        c.restore();
      }
      // виньетка
      var vg = c.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.4, W / 2, H * 0.45, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    }
    function buildDie(v, kept) {
      var ds = dieKey, P = 4, o = mkC(ds + P * 2, ds + P * 2), c = o.x, r = ds * 0.2;
      c.translate(P, P);
      // боковая грань (объём)
      c.fillStyle = kept ? '#d6a72c' : '#b9bfcc'; rr(c, 0, ds * 0.06, ds, ds * 0.94, r); c.fill();
      var g = c.createLinearGradient(0, 0, ds, ds);
      g.addColorStop(0, kept ? '#fff7d6' : '#ffffff'); g.addColorStop(0.6, kept ? '#fde68a' : '#f1f3f7'); g.addColorStop(1, kept ? '#f2c94c' : '#d9dde6');
      c.fillStyle = g; rr(c, 0, 0, ds, ds * 0.93, r); c.fill();
      // фаска
      var hl = c.createRadialGradient(ds * 0.3, ds * 0.22, 1, ds * 0.45, ds * 0.42, ds * 0.75);
      hl.addColorStop(0, 'rgba(255,255,255,.9)'); hl.addColorStop(0.5, 'rgba(255,255,255,0)');
      c.fillStyle = hl; rr(c, 0, 0, ds, ds * 0.93, r); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.2; rr(c, 1.5, 1.5, ds - 3, ds * 0.93 - 3, r * 0.85); c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1; rr(c, 0.5, 0.5, ds - 1, ds - 1, r); c.stroke();
      if (!v) {
        c.fillStyle = '#c3c9d6'; c.font = '900 ' + Math.round(ds * 0.5) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('?', ds / 2, ds * 0.48);
        return o.cv;
      }
      var cx = ds / 2, cy = ds * 0.465, pr = ds * 0.088;
      PIPS[v].forEach(function (p) {
        var px = cx + p[0] * ds * 0.25, py = cy + p[1] * ds * 0.25;
        var pg2 = c.createRadialGradient(px - pr * 0.3, py - pr * 0.3, pr * 0.1, px, py, pr);
        pg2.addColorStop(0, v === 1 ? '#7f1d1d' : '#450a0a'); pg2.addColorStop(1, v === 1 ? '#dc2626' : '#b91c1c');
        c.fillStyle = pg2; c.beginPath(); c.arc(px, py, v === 1 ? pr * 1.35 : pr, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 0.8; c.beginPath(); c.arc(px, py, (v === 1 ? pr * 1.35 : pr) + 0.3, 0.3, 2.2); c.stroke();
      });
      return o.cv;
    }
    function die(v, kept) {
      var ds = geo().ds; if (dieKey !== ds) { dieS = {}; dieKey = ds; }
      var k = v + (kept ? 'k' : ''); if (!dieS[k]) dieS[k] = buildDie(v, kept); return dieS[k];
    }
    function miniDie(c, x, y, z, v, col) {
      c.fillStyle = col; rr(c, x, y, z, z, z * 0.22); c.fill();
      c.fillStyle = '#fffaf0';
      PIPS[v].forEach(function (p) { c.beginPath(); c.arc(x + z / 2 + p[0] * z * 0.26, y + z / 2 + p[1] * z * 0.26, z * 0.1, 0, 6.283); c.fill(); });
    }
    return {
      reset: function () {
        dice = [1, 2, 3, 4, 5]; keep = [false, false, false, false, false]; rolls = 0; maxRolls = api.diff === 3 ? 2 : 3;
        used = {}; scores = {}; round = 1; rollAnim = 0; t = 0; endT = 0; rows = []; rollBtn = null; yzBonus = 0;
      },
      idle: function (dt) { t += dt; },
      input: function (type, d) {
        if (type !== 'down') return;
        var x = d.x, y = d.y;
        if (rollBtn && x > rollBtn.x && x < rollBtn.x + rollBtn.w && y > rollBtn.y && y < rollBtn.y + rollBtn.h) { roll(); return; }
        var ds = Math.min(60, (api.W - 60) / 5), dy0 = 30;
        if (y > dy0 && y < dy0 + ds && rolls) { var i = Math.floor((x - (api.W - ds * 5 - 32) / 2) / (ds + 8)); if (i >= 0 && i < 5) { keep[i] = !keep[i]; api.sound('click'); } return; }
        for (var r = 0; r < rows.length; r++) { var R = rows[r]; if (x > R.x && x < R.x + R.w && y > R.y && y < R.y + R.h) { choose(R.cat); return; } }
      },
      key: function (k, dn) { if (dn && (k === 'a' || k === 'up')) roll(); },
      update: function (dt) { t += dt; if (rollAnim > 0) rollAnim -= dt; if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); } },
      draw: function (c) {
        var W = api.W, H = api.H, Q = api.quality, G = geo();
        if (!bgC || bgW !== W || bgH !== H) buildBg();
        c.save();
        c.drawImage(bgC, 0, 0, W, H);
        var ds = G.ds, dx0 = G.dx0, dy0 = G.dy0;
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = 'rgba(255,255,255,.82)'; c.font = '800 13px system-ui, sans-serif';
        c.fillText(api.t('yz.turn') + ' ' + Math.min(13, round) + '/13 · ' + api.t('yz.rolls') + ' ' + (maxRolls - rolls), W / 2, 16);
        var pk = rollAnim > 0 ? rollAnim / 0.45 : 0;
        for (var i = 0; i < 5; i++) {
          var x = dx0 + i * (ds + 8), y = dy0 + (keep[i] ? 6 : 0), v = rolls ? dice[i] : 0, sp = rollAnim > 0 && !keep[i];
          var hop = 0, ang = 0, sq = 1;
          if (sp) {
            v = 1 + (Math.floor(rollAnim * 28 + i * 3.7) % 6);
            hop = Math.abs(Math.sin(pk * 9 + i * 1.3)) * ds * 0.3 * pk;
            ang = Math.sin(pk * 7 + i) * 0.6 * pk + (i % 2 ? 1 : -1) * pk * 0.6;
            sq = 1 + Math.sin(pk * 18 + i) * 0.06 * pk;
          }
          // тень
          var sa = 0.4 - hop / ds * 0.5;
          c.fillStyle = 'rgba(0,0,0,' + Math.max(0.12, sa) + ')';
          c.beginPath(); c.ellipse(x + ds / 2 + 3, y + ds * 0.98, ds * (0.5 - hop / ds * 0.25), ds * 0.11, 0, 0, 6.283); c.fill();
          if (keep[i] && Q > 0) {
            var kg = c.createRadialGradient(x + ds / 2, y + ds / 2, ds * 0.3, x + ds / 2, y + ds / 2, ds * 0.85);
            kg.addColorStop(0, 'rgba(253,224,71,.45)'); kg.addColorStop(1, 'rgba(253,224,71,0)');
            c.fillStyle = kg; c.fillRect(x - ds * 0.35, y - ds * 0.35, ds * 1.7, ds * 1.7);
          }
          c.save(); c.translate(x + ds / 2, y + ds / 2 - hop); c.rotate(ang); c.scale(1 / sq, sq);
          c.drawImage(die(v, keep[i]), -ds / 2 - 4, -ds / 2 - 4, ds + 8, ds + 8);
          c.restore();
          if (keep[i]) {
            c.strokeStyle = '#f59e0b'; c.lineWidth = 2.5; rr(c, x - 2, y - 2, ds + 4, ds + 4, ds * 0.22); c.stroke();
            // замочек
            var lx = x + ds - 6, ly = y - 4;
            c.fillStyle = '#b45309'; rr(c, lx - 6, ly - 1, 12, 9, 2); c.fill();
            c.strokeStyle = '#b45309'; c.lineWidth = 2; c.beginPath(); c.arc(lx, ly - 1, 3.5, Math.PI, 0); c.stroke();
            c.fillStyle = '#fde68a'; c.fillRect(lx - 1, ly + 2, 2, 3);
          }
        }
        // кнопка броска
        var bw = Math.min(260, W - 40), byy = G.byy;
        rollBtn = { x: (W - bw) / 2, y: byy, w: bw, h: 44 };
        var can = rolls < maxRolls && endT <= 0, bxx = rollBtn.x;
        c.fillStyle = can ? '#7f1d1d' : 'rgba(0,0,0,.35)'; rr(c, bxx, byy + 4, bw, 44, 22); c.fill();
        if (can) { var bg = c.createLinearGradient(0, byy, 0, byy + 44); bg.addColorStop(0, '#f87171'); bg.addColorStop(0.5, '#dc2626'); bg.addColorStop(1, '#b91c1c'); c.fillStyle = bg; }
        else c.fillStyle = 'rgba(80,50,35,.85)';
        rr(c, bxx, byy, bw, 44, 22); c.fill();
        c.fillStyle = 'rgba(255,255,255,' + (can ? 0.25 : 0.06) + ')'; rr(c, bxx + 8, byy + 3, bw - 16, 14, 7); c.fill();
        c.font = '900 16px system-ui, sans-serif';
        var lab = api.t('yz.roll'), lw = c.measureText(lab).width, ix = W / 2 - (lw + 26) / 2;
        c.save(); c.translate(ix + 9, byy + 22); c.rotate(can ? Math.sin(t * 3) * 0.15 : 0);
        miniDie(c, -9, -9, 18, 5, can ? '#fff' : 'rgba(255,255,255,.4)');
        c.fillStyle = can ? '#dc2626' : 'rgba(80,50,35,1)';
        PIPS[5].forEach(function (p) { c.beginPath(); c.arc(p[0] * 18 * 0.26, p[1] * 18 * 0.26, 1.8, 0, 6.283); c.fill(); });
        c.restore();
        c.fillStyle = can ? '#fff' : 'rgba(255,255,255,.45)'; c.textAlign = 'left'; c.fillText(lab, ix + 26, byy + 22.5);
        for (var rd = 0; rd < maxRolls; rd++) {
          c.fillStyle = rd < maxRolls - rolls ? '#fde68a' : 'rgba(0,0,0,.3)';
          c.beginPath(); c.arc(bxx + bw - 20 - rd * 11, byy + 22, 3.5, 0, 6.283); c.fill();
        }
        // таблица
        var ty = G.ty, rh = G.rh, colW = G.colW;
        rows = [];
        var best = -1, bestCat = null;
        if (rolls && api.diff === 0) CATS.forEach(function (k) { if (!used[k]) { var v2 = scoreFor(k); if (v2 > best) { best = v2; bestCat = k; } } });
        CATS.forEach(function (k, n) {
          var colI = n < 6 ? 0 : 1, rowI = n < 6 ? n : n - 6, rx = 12 + colI * colW, ry = ty + rowI * rh, rw = colW - 6, rhh = rh - 3;
          rows.push({ x: rx, y: ry, w: rw, h: rhh, cat: k });
          var u = used[k], isBest = k === bestCat;
          if (isBest) {
            var pul = 0.5 + Math.sin(t * 5) * 0.2;
            c.fillStyle = 'rgba(253,224,71,' + (0.35 + pul * 0.3) + ')'; rr(c, rx, ry, rw, rhh, 8); c.fill();
            c.strokeStyle = '#d97706'; c.lineWidth = 2; rr(c, rx + 1, ry + 1, rw - 2, rhh - 2, 7); c.stroke();
          } else {
            c.fillStyle = u ? 'rgba(120,90,50,.12)' : 'rgba(255,255,255,.55)'; rr(c, rx, ry, rw, rhh, 8); c.fill();
            c.strokeStyle = 'rgba(120,80,30,.18)'; c.lineWidth = 1; rr(c, rx + 0.5, ry + 0.5, rw - 1, rhh - 1, 8); c.stroke();
          }
          var fs = Math.round(rh * 0.4), tx = rx + 8;
          c.textAlign = 'left'; c.font = '700 ' + fs + 'px system-ui, sans-serif';
          if (n < 6) { var mz = Math.round(rh * 0.46); miniDie(c, rx + 7, ry + rhh / 2 - mz / 2, mz, n + 1, u ? '#a8a29e' : '#b91c1c'); tx = rx + 13 + mz; }
          c.fillStyle = u ? 'rgba(68,52,36,.45)' : '#3b2a1a';
          c.fillText(api.t('yz.c' + k), tx, ry + rhh / 2 + 0.5);
          c.textAlign = 'right';
          if (u) {
            c.fillStyle = '#1d4ed8'; c.font = 'italic 800 ' + Math.round(rh * 0.46) + 'px Georgia, serif';
            c.fillText(String(scores[k]), rx + rw - 10, ry + rhh / 2 + 1);
            c.strokeStyle = 'rgba(29,78,216,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(rx + rw - 40, ry + rhh - 6); c.lineTo(rx + rw - 8, ry + rhh - 7); c.stroke();
          } else if (rolls && api.diff <= 1) {
            var pv = scoreFor(k);
            c.font = '800 ' + fs + 'px system-ui, sans-serif';
            c.fillStyle = pv ? (isBest ? '#92400e' : '#15803d') : 'rgba(68,52,36,.3)';
            c.fillText(String(pv), rx + rw - 10, ry + rhh / 2 + 0.5);
          }
        });
        // итог
        var up = upper(), fy = ty + 6 * rh + 4, pbx = 16, pbw = colW - 30;
        c.textAlign = 'left'; c.fillStyle = up >= 63 ? '#15803d' : 'rgba(68,52,36,.75)'; c.font = '700 12px system-ui, sans-serif';
        c.fillText(api.t('yz.upper') + ': ' + up + '/63' + (up >= 63 ? ' +35' : ''), pbx, fy + 7);
        c.fillStyle = 'rgba(120,80,30,.18)'; rr(c, pbx, fy + 15, pbw, 4, 2); c.fill();
        c.fillStyle = up >= 63 ? '#16a34a' : '#d97706'; rr(c, pbx, fy + 15, Math.max(4, pbw * Math.min(1, up / 63)), 4, 2); c.fill();
        c.fillStyle = '#b91c1c'; c.font = '900 17px system-ui, sans-serif'; c.fillText(api.t('yz.total') + ': ' + total(), pbx, fy + 32);
        if (!rolls && round <= 13) {
          c.textAlign = 'center'; c.font = '700 13px system-ui, sans-serif';
          c.globalAlpha = 0.65 + Math.sin(t * 3) * 0.25; c.fillStyle = '#fde68a'; c.fillText(api.t('yz.tapRoll'), W / 2, H - 12); c.globalAlpha = 1;
        }
        c.restore();
        c.globalAlpha = 1; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      }
    };
  }
};
