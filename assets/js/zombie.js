/* Зомби: двигайся джойстиком, герой стреляет сам. Продержись как можно дольше */
window.GAMES = window.GAMES || {};
window.GAMES.zombie = {
  title: 'Зомби', desc: 'Отстреливайся от толпы', cat: 'arcade', isNew4: true, medals: [50, 150, 350],
  hint: 'Веди пальцем по экрану — герой бежит в эту сторону (палец работает как джойстик). Стрельба автоматическая по ближайшему зомби. Подбирай аптечки ❤ и усиления ⚡. Волны становятся всё сильнее.',
  d0: 'Медленные зомби', d1: 'Обычно', d2: 'Быстрые и много', d3: 'Орда',
  colors: ['#65a30d', '#1c1917'], controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="14" fill="#1c1917"/><circle cx="50" cy="56" r="12" fill="#3b82f6"/><rect x="58" y="52" width="18" height="6" rx="2" fill="#94a3b8"/><circle cx="22" cy="26" r="10" fill="#65a30d"/><circle cx="80" cy="22" r="9" fill="#65a30d"/><circle cx="24" cy="80" r="9" fill="#65a30d"/><g fill="#fef08a"><circle cx="19" cy="24" r="2"/><circle cx="25" cy="24" r="2"/></g><circle cx="84" cy="54" r="3" fill="#fde047"/></svg>',
  create: function (api) {
    var P, zs, bullets, items, parts, t, wave, waveT, spawnLeft, spawnT, joy, fireT, hurtT, kills, power, MW, MH, cam;
    var ZSP = [45, 60, 78, 90], ZN = [6, 8, 11, 14];
    function startWave() { wave++; spawnLeft = ZN[api.diff] + wave * 3; spawnT = 0; waveT = 2; if (wave > 1) { api.sound('bonus'); } }
    function spawn() {
      var side = Math.floor(Math.random() * 4), x, y;
      if (side === 0) { x = Math.random() * MW; y = -20; } else if (side === 1) { x = MW + 20; y = Math.random() * MH; } else if (side === 2) { x = Math.random() * MW; y = MH + 20; } else { x = -20; y = Math.random() * MH; }
      var big = wave > 2 && Math.random() < 0.15, fast = !big && wave > 1 && Math.random() < 0.2;
      zs.push({ x: x, y: y, hp: big ? 5 + wave : 1 + Math.floor(wave / 3), r: big ? 20 : 13, sp: ZSP[api.diff] * (big ? 0.6 : fast ? 1.7 : 1) * (0.9 + Math.random() * 0.2), big: big, fast: fast, hit: 0, ph: Math.random() * 6 });
    }
    function boom(x, y, col, n) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = 40 + Math.random() * 120; parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 0.5, c: col }); } }
    return {
      reset: function () {
        MW = api.W; MH = api.H; P = { x: MW / 2, y: MH / 2, hp: 5, ang: 0 }; zs = []; bullets = []; items = []; parts = []; t = 0; wave = 0; joy = null; fireT = 0; hurtT = 0; kills = 0; power = 0; startWave();
      },
      resize: function () { MW = api.W; MH = api.H; }, idle: function (dt) { t += dt || 0; }, key: function () { },
      input: function (type, d) {
        if (type === 'down') joy = { ox: d.x, oy: d.y, x: d.x, y: d.y };
        else if (type === 'move' && joy) { joy.x = d.x; joy.y = d.y; }
        else if (type === 'up') joy = null;
      },
      update: function (dt) {
        if (P.hp <= 0) return;
        t += dt; if (hurtT > 0) hurtT -= dt; if (power > 0) power -= dt;
        if (joy) {
          var dx = joy.x - joy.ox, dy = joy.y - joy.oy, d = Math.hypot(dx, dy);
          if (d > 8) { var k = Math.min(1, d / 50) * 170; P.x += dx / d * k * dt; P.y += dy / d * k * dt; }
          P.x = Math.max(16, Math.min(MW - 16, P.x)); P.y = Math.max(60, Math.min(MH - 16, P.y));
        }
        if (waveT > 0) waveT -= dt;
        if (spawnLeft > 0) { spawnT -= dt; if (spawnT <= 0) { spawn(); spawnLeft--; spawnT = Math.max(0.25, 1.1 - wave * 0.08) * (api.diff >= 3 ? 0.6 : 1); } }
        else if (!zs.length) startWave();
        // ближайший зомби — цель
        var tg = null, td = 1e9; zs.forEach(function (z) { var d2 = Math.hypot(z.x - P.x, z.y - P.y); if (d2 < td) { td = d2; tg = z; } });
        fireT -= dt;
        if (tg && td < 330) {
          P.ang = Math.atan2(tg.y - P.y, tg.x - P.x);
          if (fireT <= 0) {
            fireT = power > 0 ? 0.09 : 0.28; var sp = power > 0 ? 3 : 1;
            for (var s = 0; s < sp; s++) { var a = P.ang + (s - (sp - 1) / 2) * 0.15; bullets.push({ x: P.x + Math.cos(a) * 18, y: P.y + Math.sin(a) * 18, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, l: 0.8 }); }
            api.tone && api.tone(900, 0.02);
          }
        }
        bullets.forEach(function (b) { b.x += b.vx * dt; b.y += b.vy * dt; b.l -= dt; });
        zs.forEach(function (z) {
          var a = Math.atan2(P.y - z.y, P.x - z.x); z.x += Math.cos(a) * z.sp * dt; z.y += Math.sin(a) * z.sp * dt; z.ph += dt * 8; if (z.hit > 0) z.hit -= dt;
          bullets.forEach(function (b) { if (b.l > 0 && Math.hypot(b.x - z.x, b.y - z.y) < z.r + 3) { b.l = 0; z.hp--; z.hit = 0.1; z.x -= Math.cos(a) * 6; z.y -= Math.sin(a) * 6; boom(b.x, b.y, '#84cc16', 3); } });
          if (Math.hypot(P.x - z.x, P.y - z.y) < z.r + 12 && hurtT <= 0) { P.hp--; hurtT = 1; api.sound('hit'); api.vibrate(60); api.fx.shake && api.fx.shake(8); if (P.hp <= 0) { api.gameOver(); } }
        });
        for (var i = zs.length - 1; i >= 0; i--) if (zs[i].hp <= 0) {
          var z = zs[i]; kills++; api.addScore(z.big ? 5 : z.fast ? 2 : 1); boom(z.x, z.y, '#65a30d', 12); api.sound('break');
          if (Math.random() < (z.big ? 0.6 : 0.06)) items.push({ x: z.x, y: z.y, k: Math.random() < 0.5 ? 'hp' : 'pw', l: 9 });
          zs.splice(i, 1);
        }
        bullets = bullets.filter(function (b) { return b.l > 0; });
        items.forEach(function (it) { it.l -= dt; if (Math.hypot(it.x - P.x, it.y - P.y) < 26) { it.l = 0; if (it.k === 'hp') P.hp = Math.min(5, P.hp + 1); else power = 6; api.sound('coin'); } });
        items = items.filter(function (it) { return it.l > 0; });
        parts.forEach(function (q) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.92; q.vy *= 0.92; q.l -= dt; }); parts = parts.filter(function (q) { return q.l > 0; });
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        c.fillStyle = '#3f3a2e'; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(0,0,0,.12)'; for (var gx = 0; gx < W; gx += 48) for (var gy = 0; gy < H; gy += 48) if (((gx + gy) / 48) % 2) c.fillRect(gx, gy, 48, 48);
        items.forEach(function (it) { c.font = '22px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.globalAlpha = it.l < 2 ? (Math.sin(t * 20) > 0 ? 1 : 0.3) : 1; c.fillText(it.k === 'hp' ? '❤️' : '⚡', it.x, it.y); c.globalAlpha = 1; });
        parts.forEach(function (q) { c.fillStyle = q.c; c.globalAlpha = q.l * 2; c.fillRect(q.x - 2, q.y - 2, 4, 4); }); c.globalAlpha = 1;
        zs.forEach(function (z) {
          var wob = Math.sin(z.ph) * 2;
          c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(z.x, z.y + z.r * 0.8, z.r, z.r * 0.35, 0, 0, 6.283); c.fill();
          c.fillStyle = z.hit > 0 ? '#fff' : z.big ? '#4d7c0f' : z.fast ? '#a3e635' : '#65a30d';
          c.beginPath(); c.arc(z.x + wob, z.y, z.r, 0, 6.283); c.fill();
          var a = Math.atan2(P.y - z.y, P.x - z.x);
          c.fillStyle = '#ef4444'; c.beginPath(); c.arc(z.x + wob + Math.cos(a - 0.4) * z.r * 0.5, z.y + Math.sin(a - 0.4) * z.r * 0.5, z.r * 0.16, 0, 6.283); c.arc(z.x + wob + Math.cos(a + 0.4) * z.r * 0.5, z.y + Math.sin(a + 0.4) * z.r * 0.5, z.r * 0.16, 0, 6.283); c.fill();
          c.strokeStyle = c.fillStyle = '#65a30d'; c.lineWidth = 5; c.lineCap = 'round';
          c.beginPath(); c.moveTo(z.x + Math.cos(a - 0.9) * z.r, z.y + Math.sin(a - 0.9) * z.r); c.lineTo(z.x + Math.cos(a - 0.5) * z.r * 1.7, z.y + Math.sin(a - 0.5) * z.r * 1.7); c.moveTo(z.x + Math.cos(a + 0.9) * z.r, z.y + Math.sin(a + 0.9) * z.r); c.lineTo(z.x + Math.cos(a + 0.5) * z.r * 1.7, z.y + Math.sin(a + 0.5) * z.r * 1.7); c.stroke();
        });
        bullets.forEach(function (b) { c.strokeStyle = '#fde047'; c.lineWidth = 3; c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02); c.stroke(); });
        // герой
        c.save(); c.translate(P.x, P.y); c.globalAlpha = hurtT > 0 && Math.sin(t * 30) > 0 ? 0.4 : 1;
        c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, 11, 14, 5, 0, 0, 6.283); c.fill();
        c.rotate(P.ang); c.fillStyle = '#475569'; c.fillRect(6, -4, 18, 8);
        c.fillStyle = power > 0 ? '#f59e0b' : '#3b82f6'; c.beginPath(); c.arc(0, 0, 13, 0, 6.283); c.fill();
        c.fillStyle = '#fcd9b6'; c.beginPath(); c.arc(2, 0, 7, 0, 6.283); c.fill(); c.restore(); c.globalAlpha = 1;
        if (joy) { c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 3; c.beginPath(); c.arc(joy.ox, joy.oy, 46, 0, 6.283); c.stroke(); var jx = joy.x - joy.ox, jy = joy.y - joy.oy, jd = Math.hypot(jx, jy), m = Math.min(1, 46 / (jd || 1)); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(joy.ox + jx * m, joy.oy + jy * m, 20, 0, 6.283); c.fill(); }
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '800 15px system-ui'; c.fillStyle = '#fff';
        c.fillText('❤'.repeat(Math.max(0, P.hp)) + '   Волна ' + wave + '   💀 ' + kills + (power > 0 ? '   ⚡' : ''), W / 2, 28);
        if (waveT > 0) { c.globalAlpha = Math.min(1, waveT); c.font = '900 34px system-ui'; c.fillText('ВОЛНА ' + wave, W / 2, H * 0.4); c.globalAlpha = 1; }
      }
    };
  }
};
