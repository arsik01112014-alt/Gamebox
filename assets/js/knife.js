/* Ножи: метай ножи во вращающееся бревно, не попади в свои */
window.GAMES = window.GAMES || {};
window.GAMES.knife = {
  title: 'Ножи',
  desc: 'Меткий бросок в цель',
  hint: 'Тапни, чтобы метнуть нож в крутящееся бревно. Нельзя попадать в уже воткнутые ножи! Сбивай яблоки за бонус. Каждый 5-й уровень — босс с хитрым вращением.',
  d0: 'Медленное вращение', d1: 'Обычное вращение', d2: 'Быстрее и с рывками', d3: 'Безумные боссы',
  colors: ['#b45309', '#334155'],
  controls: 'none',
  isNew2: true,
  icon: '<svg viewBox="0 0 100 100"><defs><radialGradient id="knifeG1" cx=".45" cy=".45" r=".6"><stop offset="0" stop-color="#f6cf92"/><stop offset=".7" stop-color="#dfa35f"/><stop offset="1" stop-color="#b8733a"/></radialGradient>' +
    '<linearGradient id="knifeG2" x1="0" x2="1"><stop offset="0" stop-color="#64748b"/><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#475569"/></linearGradient>' +
    '<linearGradient id="knifeG3" x1="0" x2="1"><stop offset="0" stop-color="#92400e"/><stop offset=".5" stop-color="#fde68a"/><stop offset="1" stop-color="#92400e"/></linearGradient></defs>' +
    '<g transform="rotate(140 50 40)"><path d="M50 4 q4 5 4 10 v16 h-7 v-17 q0-5 3-9z" fill="url(#knifeG2)"/><rect x="44" y="29" width="12" height="3.5" rx="1.5" fill="url(#knifeG3)"/></g>' +
    '<ellipse cx="53" cy="44" rx="29" ry="29" fill="#000" opacity=".3"/><circle cx="50" cy="40" r="29" fill="#3b1a08"/><circle cx="50" cy="40" r="25" fill="url(#knifeG1)"/>' +
    '<g fill="none" stroke="#7c3a12" stroke-opacity=".5" stroke-width="1.3"><circle cx="50" cy="40" r="20"/><circle cx="50" cy="40" r="15"/><circle cx="50" cy="40" r="10"/><circle cx="50" cy="40" r="5"/></g>' +
    '<path d="M50 40 l9 -12 M50 40 l-12 6" stroke="#5b2a0c" stroke-width="1.4" stroke-linecap="round"/><circle cx="50" cy="40" r="2.5" fill="#6b3410"/>' +
    '<path d="M50 70 q-3-4-3-9 h6 q0 5-3 9z" fill="url(#knifeG2)" transform="rotate(180 50 66)"/>' +
    '<rect x="43" y="69" width="14" height="4" rx="2" fill="url(#knifeG3)"/><rect x="46.5" y="73" width="7" height="18" rx="3" fill="#292524"/><path d="M46.5 77 l7 2 M46.5 81 l7 2 M46.5 85 l7 2" stroke="#000" stroke-width="1.2"/><rect x="45.5" y="90" width="9" height="4" rx="2" fill="url(#knifeG3)"/>' +
    '<path d="M50 61 v8" stroke="#fff" stroke-width="1"/>' +
    '<path d="M76 19 c4-4 10-3 11 2 c1 6-4 12-9 11 c-5 1-10-5-9-11 c1-5 7-6 7-2z" fill="#e11d48"/><path d="M77 18 q1-5 4-6" stroke="#57311a" stroke-width="1.8" fill="none"/><path d="M78 15 q5-5 8-1 q-4 3-8 1z" fill="#22c55e"/><ellipse cx="73" cy="22" rx="2" ry="1.2" fill="#fff" opacity=".6"/></svg>',

  create: function (api) {
    var DIFF = [{ sp: 0.7, jerk: 0 }, { sp: 1, jerk: 0.2 }, { sp: 1.25, jerk: 0.5 }, { sp: 1.5, jerk: 0.8 }];
    var D, stage, need, left, stuck, apples, ang, vel, tgt, mode, modeT, flying, cx, cy, R, t, deadT, hitT, clearT, flyKnife, broken, parts, boss, apCount;
    var KL = 64; // длина ножа
    var bgCache = {}, SPR = {};

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function layout() { cx = api.W / 2; cy = api.H * 0.33; R = Math.min(api.W * 0.27, api.H * 0.17); }
    function setupStage() {
      boss = stage % 5 === 0;
      need = Math.min(14, 5 + Math.floor(stage * 0.7) + (boss ? 2 : 0));
      left = need; stuck = []; apples = []; broken = null; flying = null;
      var pre = Math.min(6, Math.floor(stage / 2) + (boss ? 2 : 0));
      for (var i = 0; i < pre; i++) stuck.push(rnd(0, 6.283));
      var na = Math.random() < 0.7 ? 1 + Math.floor(Math.random() * (boss ? 3 : 2)) : 0;
      for (var j = 0; j < na; j++) apples.push({ a: rnd(0, 6.283), hit: false });
      ang = 0; vel = (1.6 + stage * 0.05) * D.sp; tgt = vel; mode = 0; modeT = 2;
      api.fx.text(cx, cy + R + 60, (boss ? '👑 ' + api.t('knife.boss') + ' · ' : '') + api.t('knife.stage') + ' ' + stage, boss ? '#f87171' : '#fde047', 22);
    }
    function angClose(a, b, tol) { var d = Math.abs(((a - b) % 6.283 + 6.283) % 6.283); return d < tol || d > 6.283 - tol; }

    return {
      reset: function () {
        D = DIFF[api.diff]; layout();
        stage = 1; t = 0; deadT = 0; hitT = 0; clearT = 0; parts = []; flyKnife = []; apCount = 0;
        setupStage();
      },
      resize: layout,
      idle: function (dt) { t += dt; ang += 0.8 * dt; },
      input: function (type) {
        if (type !== 'down' || deadT > 0 || clearT > 0 || flying || left <= 0) return;
        flying = { y: api.H - 90, v: 2600 };
        left--; api.tone(300, 0.05, 'triangle', 0.06);
      },
      key: function (k, d) { if (d && (k === 'a' || k === 'up')) this.input('down'); },
      update: function (dt) {
        t += dt;
        for (var i = parts.length - 1; i >= 0; i--) { var p = parts[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.a += p.va * dt; p.life -= dt; if (p.life <= 0) parts.splice(i, 1); }
        if (hitT > 0) hitT -= dt;
        if (deadT > 0) { deadT -= dt; if (broken) { broken.y += broken.vy * dt; broken.vy += 1200 * dt; broken.a += 9 * dt; } if (deadT <= 0) api.gameOver(); return; }
        if (clearT > 0) { clearT -= dt; if (clearT <= 0) { stage++; setupStage(); } return; }
        // вращение: плавные смены скорости и рывки у боссов
        modeT -= dt;
        if (modeT <= 0) {
          modeT = rnd(1, 2.6);
          var base = (1.6 + stage * 0.05) * D.sp;
          if (stage >= 3 && Math.random() < 0.35 + D.jerk * 0.3) tgt = -tgt;
          else tgt = Math.sign(tgt || 1) * base * rnd(0.6, 1.4);
          if (boss && Math.random() < 0.5 + D.jerk * 0.4) { tgt = Math.sign(tgt) * base * rnd(1.6, 2.3); modeT = rnd(0.4, 0.9); }
        }
        vel += (tgt - vel) * Math.min(1, dt * (boss ? 5 : 2.5));
        ang += vel * dt;
        if (flying) {
          flying.y -= flying.v * dt;
          var tip = cy + R;
          if (flying.y - KL / 2 <= tip) {
            var hitA = Math.PI / 2 - ang; // угол в системе бревна
            var bad = false;
            for (var k = 0; k < stuck.length; k++) if (angClose(stuck[k], hitA, 0.2)) { bad = true; break; }
            if (bad) {
              broken = { x: cx, y: tip + KL / 2, vy: -300, a: 0 };
              flying = null; deadT = 1.2;
              api.sound('hit'); api.vibrate(250); api.fx.shake(8); api.fx.flash('#ef4444', 0.25);
              return;
            }
            stuck.push(hitA); flying = null; hitT = 0.12;
            api.addScore(1); api.sound('stomp'); api.vibrate(15);
            for (var w = 0; w < (api.quality === 0 ? 5 : 9); w++) parts.push({ x: cx + rnd(-8, 8), y: tip, vx: rnd(-160, 160), vy: rnd(-240, -40), life: rnd(0.45, 0.8), c: Math.random() < 0.5 ? '#f3c58a' : '#c27c3e', a: rnd(0, 6), va: rnd(-14, 14), s: rnd(2.5, 4.5), chip: 1 });
            apples.forEach(function (ap) {
              if (!ap.hit && angClose(ap.a, hitA, 0.24)) {
                ap.hit = true; apCount++; api.addScore(3); api.sound('coin');
                api.fx.text(cx, tip + 30, '+3 🍎', '#f87171', 18);
                for (var q = 0; q < 2; q++) parts.push({ x: cx + Math.cos(ap.a + ang) * (R + 12), y: cy + Math.sin(ap.a + ang) * (R + 12), vx: (q ? 1 : -1) * 120, vy: -260, life: 1.2, c: '#ef4444', a: 0, va: (q ? 1 : -1) * 8, s: 9, half: q });
              }
            });
            if (left <= 0) {
              clearT = 1.1; api.sound(boss ? 'win' : 'bonus'); api.addScore(boss ? 10 : 2);
              api.fx.shake(6); api.fx.burst(cx, cy, '#d97706', 36, 380, 4);
              for (var ch = 0; ch < (api.quality === 0 ? 6 : 12); ch++) { var ca = ch / 12 * 6.283 + rnd(-0.2, 0.2); parts.push({ x: cx + Math.cos(ca) * R * 0.5, y: cy + Math.sin(ca) * R * 0.5, vx: Math.cos(ca) * rnd(150, 320), vy: Math.sin(ca) * rnd(150, 320) - 220, life: 1.1, c: boss ? '#57534e' : '#b45309', a: ca, va: rnd(-6, 6), s: R * rnd(0.32, 0.45), chunk: 1 }); }
              for (var b = 0; b < stuck.length; b++) { var sa = stuck[b] + ang; flyKnife.push({ x: cx + Math.cos(sa) * (R + KL / 2), y: cy + Math.sin(sa) * (R + KL / 2), vx: Math.cos(sa) * 260, vy: Math.sin(sa) * 260 - 200, a: sa + Math.PI / 2, va: rnd(-8, 8), life: 1.2 }); }
            }
          }
        }
        for (var f = flyKnife.length - 1; f >= 0; f--) { var fk = flyKnife[f]; fk.x += fk.vx * dt; fk.y += fk.vy * dt; fk.vy += 900 * dt; fk.a += fk.va * dt; fk.life -= dt; if (fk.life <= 0) flyKnife.splice(f, 1); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, Q = api.quality;
        c.drawImage(getBg(W, H, boss), 0, 0, W, H);
        // пылинки в луче света
        if (Q > 0) {
          c.fillStyle = 'rgba(255,236,200,.35)';
          for (var m = 0; m < 22; m++) {
            var mx = ((m * 97.3 + t * (6 + m % 5 * 2)) % (W + 20)) - 10, my = (m * 53.7 % (H * 0.7)) + Math.sin(t * 0.7 + m) * 12;
            c.globalAlpha = 0.25 + 0.25 * Math.sin(t * 1.3 + m * 1.7); c.beginPath(); c.arc(mx, my, 1 + m % 3 * 0.5, 0, 6.283); c.fill();
          }
          c.globalAlpha = 1;
        }
        // уровень и прогресс
        c.textAlign = 'center'; c.textBaseline = 'middle';
        var label = (boss ? '👑 ' + api.t('knife.boss') + ' · ' : '') + api.t('knife.stage') + ' ' + stage;
        c.font = '900 15px system-ui, sans-serif';
        var lw = c.measureText(label).width + 28;
        c.fillStyle = boss ? 'rgba(127,29,29,.6)' : 'rgba(15,23,42,.55)'; pill(c, W / 2 - lw / 2, 9, lw, 26); c.fill();
        c.strokeStyle = boss ? 'rgba(252,165,165,.45)' : 'rgba(255,255,255,.14)'; c.lineWidth = 1; c.stroke();
        c.fillStyle = boss ? '#fecaca' : '#f1f5f9'; c.fillText(label, W / 2, 22.5);
        for (var s = 0; s < 5; s++) {
          var sx = W / 2 + (s - 2) * 20, st = ((stage - 1) % 5), rr0 = s === 4 ? 7 : 5;
          var col = s < st ? '#fbbf24' : s === st ? (s === 4 ? '#ef4444' : '#f8fafc') : 'rgba(255,255,255,.16)';
          if (s === st && Q > 0) { c.fillStyle = s === 4 ? 'rgba(239,68,68,.3)' : 'rgba(255,255,255,.2)'; c.beginPath(); c.arc(sx, 48, rr0 + 3 + Math.sin(t * 5), 0, 6.283); c.fill(); }
          c.fillStyle = col; c.beginPath(); if (s === 4) { c.moveTo(sx, 48 - rr0); c.lineTo(sx + rr0, 48); c.lineTo(sx, 48 + rr0); c.lineTo(sx - rr0, 48); c.closePath(); } else c.arc(sx, 48, rr0, 0, 6.283); c.fill();
          if (s <= st) { c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(sx - rr0 * 0.3, 48 - rr0 * 0.35, rr0 * 0.3, 0, 6.283); c.fill(); }
          if (s < 4) { c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(sx + rr0 + 1, 47, 20 - rr0 * 2 - 2 - (s === 3 ? 2 : 0), 2); }
        }
        // счётчик яблок
        c.fillStyle = 'rgba(15,23,42,.55)'; pill(c, 8, 9, 58, 26); c.fill();
        c.save(); c.translate(22, 22); c.scale(0.8, 0.8); c.drawImage(appleSpr().cv, -appleSpr().w / 2, -appleSpr().h / 2, appleSpr().w, appleSpr().h); c.restore();
        c.fillStyle = '#fecaca'; c.font = '800 14px system-ui, sans-serif'; c.textAlign = 'left'; c.fillText('' + apCount, 36, 22.5);
        // бревно
        var shake = hitT > 0 ? hitT * 40 : 0;
        if (clearT <= 0) {
          // тень
          c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(cx + 6, cy + R * 0.12 + 10 - shake, R * 1.02, R * 1.0, 0, 0, 6.283); c.fill();
          c.save(); c.translate(cx, cy - shake); c.rotate(ang);
          // ножи в бревне
          var ks = knifeSpr();
          stuck.forEach(function (a) { c.save(); c.rotate(a); c.translate(R + KL / 2 - 10, 0); c.rotate(Math.PI / 2); c.drawImage(ks.cv, -ks.w / 2, -ks.h / 2, ks.w, ks.h); c.restore(); });
          // яблоки
          var as = appleSpr();
          apples.forEach(function (ap) {
            if (ap.hit) return;
            c.save(); c.rotate(ap.a); c.translate(R + 10, 0); c.rotate(Math.PI / 2);
            c.drawImage(as.cv, -as.w / 2, -as.h / 2, as.w, as.h);
            c.restore();
          });
          var lgs = logSpr(boss);
          c.drawImage(lgs.cv, -lgs.w / 2, -lgs.h / 2, lgs.w, lgs.h);
          // места входа ножей
          c.fillStyle = 'rgba(40,15,3,.55)';
          for (var e = 0; e < stuck.length; e++) { c.save(); c.rotate(stuck[e]); c.beginPath(); c.ellipse(R - 3, 0, 4, 6.5, 0, 0, 6.283); c.fill(); c.restore(); }
          if (boss) { c.fillStyle = '#fbbf24'; for (var sp = 0; sp < 8; sp++) { c.save(); c.rotate(sp * 0.785); c.beginPath(); c.moveTo(R - 2, -5); c.lineTo(R + 7, 0); c.lineTo(R - 2, 5); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(R - 2, -5); c.lineTo(R + 7, 0); c.lineTo(R - 2, 0); c.closePath(); c.fill(); c.fillStyle = '#fbbf24'; c.restore(); } }
          c.restore();
          // блик (не вращается)
          c.fillStyle = 'rgba(255,240,210,.10)'; c.beginPath(); c.ellipse(cx - R * 0.3, cy - shake - R * 0.35, R * 0.55, R * 0.3, -0.6, 0, 6.283); c.fill();
          if (hitT > 0) { c.strokeStyle = 'rgba(255,255,255,' + Math.min(0.8, hitT * 6) + ')'; c.lineWidth = 4; c.beginPath(); c.arc(cx, cy - shake, R + 3 + (0.12 - hitT) * 60, 0, 6.283); c.stroke(); }
        }
        // разлетающиеся ножи и куски
        var ks2 = knifeSpr();
        flyKnife.forEach(function (fk) { c.save(); c.translate(fk.x, fk.y); c.rotate(fk.a); c.globalAlpha = Math.min(1, fk.life * 2); c.drawImage(ks2.cv, -ks2.w / 2, -ks2.h / 2, ks2.w, ks2.h); c.restore(); });
        c.globalAlpha = 1;
        parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
          if (p.chunk) {
            c.save(); c.translate(p.x, p.y); c.rotate(p.a);
            c.fillStyle = p.c; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, p.s, -0.35, 0.35); c.closePath(); c.fill();
            c.fillStyle = boss ? '#a8a29e' : '#e9b071'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, p.s * 0.82, -0.33, 0.33); c.closePath(); c.fill();
            c.strokeStyle = 'rgba(120,60,20,.5)'; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, p.s * 0.55, -0.3, 0.3); c.stroke();
            c.restore();
          } else if (p.chip) {
            c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.fillStyle = p.c;
            c.beginPath(); c.moveTo(-p.s, -p.s * 0.4); c.lineTo(p.s, -p.s * 0.2); c.lineTo(p.s * 0.6, p.s * 0.5); c.lineTo(-p.s * 0.8, p.s * 0.3); c.closePath(); c.fill();
            c.restore();
          } else if (p.s > 5) {
            c.save(); c.translate(p.x, p.y); c.rotate(p.a);
            var a0 = p.half ? 0 : Math.PI, a1 = p.half ? Math.PI : 6.283;
            c.fillStyle = '#dc2626'; c.beginPath(); c.arc(0, 0, p.s + 1.5, a0, a1); c.closePath(); c.fill();
            c.fillStyle = '#fef3c7'; c.beginPath(); c.arc(0, 0, p.s, a0, a1); c.closePath(); c.fill();
            c.fillStyle = '#422006'; c.beginPath(); c.ellipse(-2.5, (p.half ? 1 : -1) * 3, 1.2, 2, 0, 0, 6.283); c.ellipse(2.5, (p.half ? 1 : -1) * 3, 1.2, 2, 0, 0, 6.283); c.fill();
            c.restore();
          }
          else { c.fillStyle = p.c; c.fillRect(p.x, p.y, p.s, p.s); }
        });
        c.globalAlpha = 1;
        // летящий нож со шлейфом и сломанный
        if (flying) {
          if (Q > 0) { var tg = c.createLinearGradient(0, flying.y, 0, flying.y + 120); tg.addColorStop(0, 'rgba(226,232,240,.5)'); tg.addColorStop(1, 'rgba(226,232,240,0)'); c.fillStyle = tg; c.fillRect(cx - 4, flying.y, 8, 120); }
          c.save(); c.translate(cx, flying.y); c.drawImage(ks2.cv, -ks2.w / 2, -ks2.h / 2, ks2.w, ks2.h); c.restore();
        }
        if (broken) { c.save(); c.translate(broken.x, broken.y); c.rotate(broken.a); c.drawImage(ks2.cv, -ks2.w / 2, -ks2.h / 2, ks2.w, ks2.h); c.restore(); }
        // нож наготове и запас
        if (!flying && left > 0 && deadT <= 0 && clearT <= 0) {
          var by = H - 90 + Math.sin(t * 3) * 2;
          c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(cx, H - 90 + KL / 2 + 10, 14, 4, 0, 0, 6.283); c.fill();
          if (Q > 0) { var gl = glowSpr(); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + 0.15 * Math.sin(t * 3); c.drawImage(gl.cv, cx - 30, by - KL * 0.75, 60, KL * 1.5); c.restore(); }
          c.save(); c.translate(cx, by); c.drawImage(ks2.cv, -ks2.w / 2, -ks2.h / 2, ks2.w, ks2.h); c.restore();
        }
        for (var k = 0; k < need; k++) {
          var used = k >= left;
          c.save(); c.translate(22, H - 30 - k * 22); c.rotate(-Math.PI / 4); c.scale(0.42, 0.42);
          c.globalAlpha = used ? 0.18 : 0.95;
          c.drawImage(ks2.cv, -ks2.w / 2, -ks2.h / 2, ks2.w, ks2.h);
          c.restore();
        }
        c.globalAlpha = 1; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      }
    };
    /* ---------- графика ---------- */
    function DPR() { return Math.min(2, window.devicePixelRatio || 1); }
    function mkCanvas(w, h) { var cv = document.createElement('canvas'), d = DPR(); cv.width = Math.max(1, Math.ceil(w * d)); cv.height = Math.max(1, Math.ceil(h * d)); var x = cv.getContext('2d'); x.scale(d, d); return { cv: cv, x: x, w: w, h: h }; }
    function prng(seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
    function pill(c, x, y, w, h) { var r = h / 2; c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.arc(x + w - r, y + r, r, -1.571, 1.571); c.lineTo(x + r, y + h); c.arc(x + r, y + r, r, 1.571, 4.712); c.closePath(); }
    function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
    function getBg(W, H, isBoss) {
      var key = W + 'x' + H + (isBoss ? 'b' : '');
      if (bgCache[key]) return bgCache[key];
      bgCache = {}; // при смене размера сбрасываем
      var o = mkCanvas(W, H), x = o.x, R = prng(isBoss ? 9 : 4);
      var g = x.createLinearGradient(0, 0, 0, H);
      if (isBoss) { g.addColorStop(0, '#3b0a0a'); g.addColorStop(0.6, '#1f0606'); g.addColorStop(1, '#0c0303'); }
      else { g.addColorStop(0, '#24324a'); g.addColorStop(0.6, '#141c2e'); g.addColorStop(1, '#0a0f1c'); }
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      // кирпичная кладка
      var bh = 26, bw = 58;
      for (var row = 0, y = 0; y < H * 0.82; row++, y += bh) {
        for (var bx = (row % 2 ? -bw / 2 : 0); bx < W; bx += bw) {
          var v = R() * 0.05;
          x.fillStyle = isBoss ? 'rgba(255,120,90,' + (0.02 + v) + ')' : 'rgba(170,190,230,' + (0.02 + v) + ')';
          rrect(x, bx + 1.5, y + 1.5, bw - 3, bh - 3, 3); x.fill();
          x.fillStyle = 'rgba(255,255,255,.03)'; x.fillRect(bx + 3, y + 2, bw - 6, 1.5);
        }
      }
      // пол
      var fy = H * 0.82, fg = x.createLinearGradient(0, fy, 0, H);
      fg.addColorStop(0, isBoss ? '#2a0b07' : '#1a1410'); fg.addColorStop(1, '#050302');
      x.fillStyle = fg; x.fillRect(0, fy, W, H - fy);
      x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(0, fy, W, 1.5);
      for (var pl = 0; pl < W; pl += 46) { x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(pl, fy, 1, H - fy); }
      // луч прожектора
      var sy = H * 0.33, sr = Math.min(W * 0.27, H * 0.17);
      x.save(); x.globalCompositeOperation = 'lighter';
      var bg = x.createLinearGradient(0, 0, 0, sy + sr * 2);
      bg.addColorStop(0, isBoss ? 'rgba(255,100,80,.10)' : 'rgba(255,230,180,.10)'); bg.addColorStop(1, 'rgba(255,230,180,0)');
      x.fillStyle = bg; x.beginPath(); x.moveTo(W * 0.42, 0); x.lineTo(W * 0.58, 0); x.lineTo(W / 2 + sr * 1.9, sy + sr * 1.8); x.lineTo(W / 2 - sr * 1.9, sy + sr * 1.8); x.closePath(); x.fill();
      var sg = x.createRadialGradient(W / 2, sy, sr * 0.6, W / 2, sy, sr * 2.4);
      sg.addColorStop(0, isBoss ? 'rgba(255,90,60,.22)' : 'rgba(255,214,150,.18)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = sg; x.fillRect(0, 0, W, H);
      x.restore();
      // виньетка
      var vg = x.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)');
      x.fillStyle = vg; x.fillRect(0, 0, W, H);
      bgCache[key] = o.cv; return o.cv;
    }
    function knifeSpr() {
      if (SPR.knife) return SPR.knife;
      var o = mkCanvas(26, KL + 6), x = o.x; x.translate(13, KL / 2 + 3);
      var h = KL / 2;
      // клинок
      x.beginPath(); x.moveTo(0, -h); x.quadraticCurveTo(6.5, -h + 8, 6.5, -h + 16); x.lineTo(6.5, 2); x.lineTo(-5, 2); x.lineTo(-5, -h + 14); x.quadraticCurveTo(-4, -h + 6, 0, -h); x.closePath();
      var bg = x.createLinearGradient(-5, 0, 6.5, 0);
      bg.addColorStop(0, '#64748b'); bg.addColorStop(0.35, '#e2e8f0'); bg.addColorStop(0.5, '#ffffff'); bg.addColorStop(0.62, '#cbd5e1'); bg.addColorStop(1, '#475569');
      x.fillStyle = bg; x.fill(); x.strokeStyle = 'rgba(15,23,42,.55)'; x.lineWidth = 0.8; x.stroke();
      // режущая кромка
      x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 1; x.beginPath(); x.moveTo(5.6, 1); x.lineTo(5.6, -h + 16); x.quadraticCurveTo(5.6, -h + 8, 0.5, -h + 1.5); x.stroke();
      // дол
      x.strokeStyle = 'rgba(51,65,85,.55)'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(-1.6, -h + 14); x.lineTo(-1.6, -1); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(-0.5, -h + 14); x.lineTo(-0.5, -1); x.stroke();
      // гарда
      var gg = x.createLinearGradient(0, 2, 0, 7); gg.addColorStop(0, '#fde68a'); gg.addColorStop(0.5, '#d97706'); gg.addColorStop(1, '#78350f');
      x.fillStyle = gg; rrect(x, -10, 2, 20, 5, 2); x.fill();
      x.fillStyle = '#fbbf24'; x.beginPath(); x.arc(-10, 4.5, 2.6, 0, 6.283); x.arc(10, 4.5, 2.6, 0, 6.283); x.fill();
      // рукоять
      var hg = x.createLinearGradient(-5, 0, 5, 0); hg.addColorStop(0, '#1c1917'); hg.addColorStop(0.4, '#57534e'); hg.addColorStop(1, '#0c0a09');
      x.fillStyle = hg; rrect(x, -5, 7, 10, h - 9, 3); x.fill();
      x.save(); rrect(x, -5, 7, 10, h - 9, 3); x.clip();
      x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 1.2;
      for (var wy = 8; wy < h; wy += 3.4) { x.beginPath(); x.moveTo(-6, wy); x.lineTo(6, wy + 3); x.stroke(); }
      x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 0.8;
      for (var wy2 = 9; wy2 < h; wy2 += 3.4) { x.beginPath(); x.moveTo(-6, wy2); x.lineTo(6, wy2 + 3); x.stroke(); }
      x.restore();
      // навершие
      var pg = x.createLinearGradient(-6, 0, 6, 0); pg.addColorStop(0, '#92400e'); pg.addColorStop(0.45, '#fde68a'); pg.addColorStop(1, '#92400e');
      x.fillStyle = pg; rrect(x, -6, h - 3, 12, 5, 2.5); x.fill();
      SPR.knife = o; return o;
    }
    function glowSpr() {
      if (SPR.glow) return SPR.glow;
      var o = mkCanvas(64, 64), g = o.x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(253,230,138,.55)'); g.addColorStop(1, 'rgba(253,230,138,0)');
      o.x.fillStyle = g; o.x.fillRect(0, 0, 64, 64); SPR.glow = o; return o;
    }
    function appleSpr() {
      if (SPR.apple) return SPR.apple;
      var r = 11, o = mkCanvas(30, 30), x = o.x; x.translate(15, 16);
      x.beginPath(); x.moveTo(0, -r * 0.72);
      x.bezierCurveTo(r * 0.55, -r * 1.12, r * 1.18, -r * 0.62, r * 0.98, r * 0.22); x.bezierCurveTo(r * 0.85, r * 0.85, r * 0.38, r * 1.05, 0, r * 0.88);
      x.bezierCurveTo(-r * 0.38, r * 1.05, -r * 0.85, r * 0.85, -r * 0.98, r * 0.22); x.bezierCurveTo(-r * 1.18, -r * 0.62, -r * 0.55, -r * 1.12, 0, -r * 0.72); x.closePath();
      var g = x.createRadialGradient(-r * 0.35, -r * 0.4, 1, 0, 0, r * 1.1); g.addColorStop(0, '#fda4af'); g.addColorStop(0.45, '#e11d48'); g.addColorStop(1, '#7f1d1d');
      x.fillStyle = g; x.fill(); x.strokeStyle = 'rgba(69,10,10,.5)'; x.lineWidth = 0.8; x.stroke();
      x.strokeStyle = '#57311a'; x.lineWidth = 2; x.lineCap = 'round'; x.beginPath(); x.moveTo(0, -r * 0.66); x.quadraticCurveTo(1, -r * 0.9, 1.5, -r * 1.15); x.stroke();
      x.fillStyle = '#22c55e'; x.beginPath(); x.moveTo(1, -r * 0.9); x.quadraticCurveTo(5, -r * 1.4, 9, -r * 1.0); x.quadraticCurveTo(5, -r * 0.7, 1, -r * 0.9); x.fill();
      x.fillStyle = 'rgba(255,255,255,.6)'; x.beginPath(); x.ellipse(-r * 0.4, -r * 0.3, r * 0.22, r * 0.13, -0.7, 0, 6.283); x.fill();
      SPR.apple = o; return o;
    }
    function logSpr(isBoss) {
      var key = 'log' + Math.round(R) + (isBoss ? 'b' : '');
      if (SPR[key]) return SPR[key];
      var S = Math.ceil(R * 2 + 12), o = mkCanvas(S, S), x = o.x, Rr = prng(isBoss ? 31 : 17); x.translate(S / 2, S / 2);
      // кора
      x.beginPath();
      for (var i = 0; i <= 72; i++) { var a = i / 72 * 6.283, rr = R * (1 + (Rr() - 0.5) * 0.035); if (i === 0) x.moveTo(rr, 0); else x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      x.closePath();
      var bk = x.createRadialGradient(0, 0, R * 0.85, 0, 0, R);
      bk.addColorStop(0, isBoss ? '#292524' : '#5b2e12'); bk.addColorStop(1, isBoss ? '#0c0a09' : '#2a1206');
      x.fillStyle = bk; x.fill();
      x.lineWidth = 1.2;
      for (var b = 0; b < 90; b++) { var ba = Rr() * 6.283, r0 = R * (0.88 + Rr() * 0.04), r1 = R * (0.96 + Rr() * 0.04);
        x.strokeStyle = Rr() < 0.5 ? 'rgba(0,0,0,.45)' : (isBoss ? 'rgba(168,162,158,.18)' : 'rgba(180,110,60,.35)');
        x.beginPath(); x.moveTo(Math.cos(ba) * r0, Math.sin(ba) * r0); x.lineTo(Math.cos(ba + 0.02) * r1, Math.sin(ba + 0.02) * r1); x.stroke(); }
      // срез
      var fr = R * 0.86;
      var fg = x.createRadialGradient(-R * 0.1, -R * 0.1, R * 0.05, 0, 0, fr);
      if (isBoss) { fg.addColorStop(0, '#a8a29e'); fg.addColorStop(0.7, '#78716c'); fg.addColorStop(1, '#44403c'); }
      else { fg.addColorStop(0, '#f6cf92'); fg.addColorStop(0.65, '#dfa35f'); fg.addColorStop(1, '#b8733a'); }
      x.fillStyle = fg; x.beginPath(); x.arc(0, 0, fr, 0, 6.283); x.fill();
      // годовые кольца
      var nr = 8;
      for (var ri = 1; ri <= nr; ri++) {
        var base = fr * ri / (nr + 0.6), ph = Rr() * 6;
        x.strokeStyle = isBoss ? 'rgba(28,25,23,' + (0.22 + Rr() * 0.2) + ')' : 'rgba(124,58,18,' + (0.22 + Rr() * 0.25) + ')';
        x.lineWidth = 0.8 + Rr() * 1.4;
        x.beginPath();
        for (var j = 0; j <= 48; j++) { var aj = j / 48 * 6.283, rj = base * (1 + Math.sin(aj * 3 + ph) * 0.025 + Math.sin(aj * 7 + ph * 2) * 0.012); if (j === 0) x.moveTo(rj, 0); else x.lineTo(Math.cos(aj) * rj, Math.sin(aj) * rj); }
        x.closePath(); x.stroke();
      }
      // трещины
      x.strokeStyle = isBoss ? 'rgba(0,0,0,.45)' : 'rgba(70,30,8,.55)'; x.lineWidth = 1.6; x.lineCap = 'round';
      for (var cr = 0; cr < 3; cr++) {
        var ca = Rr() * 6.283, cl = fr * (0.35 + Rr() * 0.5), rs = fr * (0.12 + Rr() * 0.2);
        x.beginPath(); x.moveTo(Math.cos(ca) * rs, Math.sin(ca) * rs);
        for (var q = 1; q <= 5; q++) { var rq = rs + (cl - rs) * q / 5, aq = ca + (Rr() - 0.5) * 0.12; x.lineTo(Math.cos(aq) * rq, Math.sin(aq) * rq); }
        x.stroke();
      }
      x.lineCap = 'butt';
      x.fillStyle = isBoss ? '#1c1917' : '#6b3410'; x.beginPath(); x.arc(0, 0, R * 0.045 + 1.5, 0, 6.283); x.fill();
      if (isBoss) {
        // стальной обод с заклёпками
        x.strokeStyle = '#57534e'; x.lineWidth = 5; x.beginPath(); x.arc(0, 0, fr - 1, 0, 6.283); x.stroke();
        x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 1; x.beginPath(); x.arc(0, 0, fr - 2.5, 3.4, 5.6); x.stroke();
        for (var rv = 0; rv < 12; rv++) { var va = rv * 0.5236; x.fillStyle = '#d6d3d1'; x.beginPath(); x.arc(Math.cos(va) * (fr - 1), Math.sin(va) * (fr - 1), 1.8, 0, 6.283); x.fill(); }
        x.strokeStyle = 'rgba(220,38,38,.55)'; x.lineWidth = 2.5; x.beginPath(); x.arc(0, 0, fr * 0.35, 0, 6.283); x.stroke();
      }
      // объём: тень снизу справа
      var sh = x.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.4, 0, 0, R * 1.05);
      sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.28)');
      x.fillStyle = sh; x.beginPath(); x.arc(0, 0, R * 1.02, 0, 6.283); x.fill();
      SPR[key] = o; return o;
    }
  }
};
