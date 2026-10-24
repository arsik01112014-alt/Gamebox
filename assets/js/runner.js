/* Бегун: три дорожки в перспективе. Свайп влево/вправо — дорожка, вверх — прыжок, вниз — подкат.
   Бонусы: магнит (притягивает монеты), ×2 (двойные очки), щит (одно столкновение без проигрыша) */
window.GAMES = window.GAMES || {};
window.GAMES.runner = {
  title: 'Бегун', desc: 'Беги по дорожкам и собирай монеты', cat: 'arcade', isNew4: true, medals: [400, 1200, 3000],
  hint: 'Свайп влево или вправо — сменить дорожку, вверх — прыжок через низкий барьер, вниз — подкат под высокий. Поезд нужно обойти. Бонусы: 🧲 магнит, ×2 очки, 🛡 щит спасает от одного удара.',
  d0: 'Медленно', d1: 'Обычно', d2: 'Быстро', d3: 'Очень быстро',
  colors: ['#0ea5e9', '#f59e0b'], controls: 'none', liveSwipe: 'once',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#38bdf8"/><path d="M42 30h16l26 62H16z" fill="#475569"/><path d="M47 30l-9 62M53 30l9 62" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="5 5"/><rect x="56" y="40" width="10" height="14" rx="2" fill="#ef4444"/><circle cx="46" cy="62" r="6" fill="#fcd9b6"/><rect x="40" y="68" width="12" height="15" rx="4" fill="#f59e0b"/><circle cx="34" cy="48" r="4" fill="#facc15"/></svg>',
  create: function (api) {
    var SP = [520, 640, 760, 880], FAR = 1600, D = 260;
    var lane, lx, jump, slide, items, dist, sp, spawnZ, dead, t, coinsN, magnet, dbl, shield, hitT, hintT;
    function hor() { return api.H * 0.3; }
    function baseY() { return api.H - 120; }
    // перспектива: z — расстояние впереди игрока
    function proj(l, z) { var s = D / (D + Math.max(-D * 0.6, z)); return { x: api.W / 2 + l * api.W * 0.3 * s, y: hor() + (baseY() - hor()) * s, s: s }; }
    function move(dir) {
      if (dead) return;
      if (dir === 'left' && lane > -1) lane--;
      else if (dir === 'right' && lane < 1) lane++;
      else if (dir === 'up' && jump <= 0) { jump = 0.65; slide = 0; api.sound('jump'); }
      else if (dir === 'down') { slide = 0.65; jump = Math.min(jump, 0.1); }
      else return;
      api.vibrate(8);
    }
    function spawn(z) {
      var free = Math.floor(Math.random() * 3) - 1, r;
      for (var l = -1; l <= 1; l++) {
        if (l === free) {
          r = Math.random();
          if (r < 0.55) for (var k = 0; k < 5; k++) items.push({ l: l, z: z + k * 70, k: 'coin' });
          else if (r < 0.63) items.push({ l: l, z: z, k: ['magnet', 'x2', 'shield'][Math.floor(Math.random() * 3)] });
          continue;
        }
        r = Math.random();
        if (r < 0.32) items.push({ l: l, z: z, k: 'low' });
        else if (r < 0.6) items.push({ l: l, z: z, k: 'high' });
        else if (r < 0.85) items.push({ l: l, z: z, k: 'train', len: 260 });
        else for (var j = 0; j < 4; j++) items.push({ l: l, z: z + j * 70, k: 'coin' });
      }
    }
    function hit() {
      if (shield > 0) { shield = 0; hitT = 1; api.sound('bonus'); api.vibrate(60); api.toast('🛡 Щит спас!'); return false; }
      dead = 0.9; api.sound('hit'); api.vibrate(200); api.fx.shake(8); return true;
    }
    return {
      reset: function () { lane = 0; lx = 0; jump = 0; slide = 0; items = []; dist = 0; sp = SP[api.diff]; spawnZ = 500; dead = 0; t = 0; coinsN = 0; magnet = 0; dbl = 0; shield = 0; hitT = 0; hintT = 3; },
      resize: function () { }, idle: function (dt) { t += dt; },
      key: function (k, down) { if (down) move(k); },
      input: function (type, d) {
        if (type === 'swipe') move(d.dir);
        else if (type === 'tap') move(d.x < api.W / 2 ? 'left' : 'right');
      },
      update: function (dt) {
        t += dt; if (hintT > 0) hintT -= dt;
        if (dead) { dead -= dt; if (dead <= 0) api.gameOver(); return; }
        sp += dt * 9; dist += sp * dt;
        lx += (lane - lx) * Math.min(1, dt * 14);
        if (jump > 0) jump -= dt; if (slide > 0) slide -= dt;
        if (magnet > 0) magnet -= dt; if (dbl > 0) dbl -= dt; if (hitT > 0) hitT -= dt;
        spawnZ -= sp * dt;
        if (spawnZ <= FAR) { spawn(spawnZ); spawnZ += Math.max(300, 520 - dist / 150); }
        var air = jump > 0.08 && jump < 0.57, low = slide > 0;
        for (var i = items.length - 1; i >= 0; i--) {
          var o = items[i]; o.z -= sp * dt;
          if (o.k === 'coin' && magnet > 0 && o.z < 500 && o.z > -20) o.l += (Math.round(lx) - o.l) * Math.min(1, dt * 8);
          var near = o.z < 24 && o.z + (o.len || 0) > -24, same = Math.abs(o.l - lx) < 0.45;
          if (near && same) {
            if (o.k === 'coin') { items.splice(i, 1); coinsN++; api.addScore(dbl > 0 ? 20 : 10); api.sound('coin'); continue; }
            if (o.k === 'magnet' || o.k === 'x2' || o.k === 'shield') {
              items.splice(i, 1); api.sound('bonus');
              if (o.k === 'magnet') magnet = 8; else if (o.k === 'x2') dbl = 10; else shield = 1;
              api.toast({ magnet: '🧲 Магнит!', x2: '×2 очки!', shield: '🛡 Щит!' }[o.k]); continue;
            }
            if (hitT <= 0 && !(o.k === 'low' && air) && !(o.k === 'high' && low)) { if (hit()) return; }
          }
          if (o.z + (o.len || 0) < -D * 0.5) items.splice(i, 1);
        }
        if (Math.floor(dist / 150) > Math.floor((dist - sp * dt) / 150)) api.addScore(dbl > 0 ? 2 : 1);
      },
      draw: function (c) {
        var W = api.W, H = api.H, hy = hor();
        var sky = c.createLinearGradient(0, 0, 0, hy);
        sky.addColorStop(0, '#0ea5e9'); sky.addColorStop(1, '#bae6fd'); c.fillStyle = sky; c.fillRect(0, 0, W, hy + 1);
        // город на горизонте
        for (var b = 0; b < 14; b++) {
          var bw = W / 10, bx = ((b * bw * 1.3 - dist * 0.02) % (W + bw * 2) + W + bw * 2) % (W + bw * 2) - bw, bh = 30 + (b * 37 % 60);
          c.fillStyle = b % 2 ? '#64748b' : '#7c8da3'; c.fillRect(bx, hy - bh, bw, bh);
          c.fillStyle = 'rgba(254,240,138,.7)'; for (var wy = hy - bh + 6; wy < hy - 6; wy += 10) c.fillRect(bx + 5, wy, 4, 4), c.fillRect(bx + bw - 9, wy, 4, 4);
        }
        c.fillStyle = '#4d7c0f'; c.fillRect(0, hy, W, H - hy);
        // дорога
        var a = proj(-1.6, FAR), b2 = proj(1.6, FAR), cc = proj(1.6, -D * 0.5), d2 = proj(-1.6, -D * 0.5);
        c.fillStyle = '#57534e'; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b2.x, b2.y); c.lineTo(cc.x, cc.y); c.lineTo(d2.x, d2.y); c.fill();
        // шпалы бегут к игроку
        c.fillStyle = 'rgba(0,0,0,.18)';
        for (var z = -(dist % 120); z < FAR; z += 120) { var p1 = proj(-1.6, z), p2 = proj(1.6, z), th = 10 * p1.s; c.fillRect(p1.x, p1.y - th / 2, p2.x - p1.x, th); }
        c.strokeStyle = '#e7e5e4'; c.lineWidth = 2;
        [-0.5, 0.5].forEach(function (k) { var f = proj(k, FAR), n = proj(k, -D * 0.5); c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(n.x, n.y); c.stroke(); });
        // предметы — от дальних к ближним
        items.slice().sort(function (p, q) { return q.z - p.z; }).forEach(function (o) {
          if (o.z > FAR) return;
          var p = proj(o.l, o.z), s = p.s, w = W * 0.25 * s;
          if (o.k === 'coin') {
            var sw = Math.abs(Math.cos(t * 5 + o.z * 0.01));
            c.fillStyle = '#facc15'; c.beginPath(); c.ellipse(p.x, p.y - 40 * s, 14 * s * sw + 2 * s, 14 * s, 0, 0, 6.283); c.fill();
            c.strokeStyle = '#b45309'; c.lineWidth = 2 * s; c.stroke();
          } else if (o.k === 'low') {
            c.fillStyle = '#f97316'; c.fillRect(p.x - w / 2, p.y - 40 * s, w, 34 * s);
            c.fillStyle = '#fff'; for (var st = 0; st < 4; st++) c.fillRect(p.x - w / 2 + st * w / 4 + 3 * s, p.y - 36 * s, w / 8, 26 * s);
          } else if (o.k === 'high') {
            c.fillStyle = '#334155'; c.fillRect(p.x - w / 2, p.y - 110 * s, 6 * s, 110 * s); c.fillRect(p.x + w / 2 - 6 * s, p.y - 110 * s, 6 * s, 110 * s);
            c.fillStyle = '#ef4444'; c.fillRect(p.x - w / 2, p.y - 110 * s, w, 26 * s); c.fillStyle = '#fff'; c.fillRect(p.x - w / 2 + 6 * s, p.y - 100 * s, w - 12 * s, 6 * s);
          } else if (o.k === 'train') {
            var e = proj(o.l, o.z + o.len), we = W * 0.25 * e.s;
            c.fillStyle = '#991b1b'; c.beginPath(); c.moveTo(e.x - we / 2, e.y - 150 * e.s); c.lineTo(e.x + we / 2, e.y - 150 * e.s); c.lineTo(p.x + w / 2, p.y - 150 * s); c.lineTo(p.x - w / 2, p.y - 150 * s); c.fill();
            c.fillStyle = '#dc2626'; c.fillRect(p.x - w / 2, p.y - 150 * s, w, 150 * s);
            c.fillStyle = '#bae6fd'; c.fillRect(p.x - w / 2 + 8 * s, p.y - 136 * s, w - 16 * s, 40 * s);
            c.fillStyle = '#fde68a'; c.fillRect(p.x - w / 2 + 8 * s, p.y - 24 * s, 14 * s, 10 * s); c.fillRect(p.x + w / 2 - 22 * s, p.y - 24 * s, 14 * s, 10 * s);
          } else {
            var ic = { magnet: '🧲', x2: '×2', shield: '🛡' }[o.k], bob = Math.sin(t * 4) * 6 * s;
            c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(p.x, p.y - 50 * s + bob, 22 * s, 0, 6.283); c.fill();
            c.fillStyle = '#7c3aed'; c.font = '900 ' + Math.round(24 * s) + 'px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ic, p.x, p.y - 50 * s + bob);
          }
        });
        // бегун
        var pp = proj(lx, 0), jh = jump > 0 ? Math.sin((0.65 - jump) / 0.65 * Math.PI) * 90 : 0, sl = slide > 0;
        c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(pp.x, pp.y, 24 - jh * 0.08, 8, 0, 0, 6.283); c.fill();
        c.save(); c.translate(pp.x, pp.y - jh);
        if (dead) c.rotate(0.9);
        if (hitT > 0 && Math.floor(t * 12) % 2) c.globalAlpha = 0.4;
        if (shield > 0) { c.strokeStyle = 'rgba(56,189,248,.8)'; c.lineWidth = 4; c.beginPath(); c.arc(0, -36, 42, 0, 6.283); c.stroke(); }
        var leg = Math.sin(t * 18) * 10, arm = Math.cos(t * 18) * 10;
        c.lineCap = 'round';
        if (sl) {
          c.fillStyle = '#f59e0b'; c.fillRect(-22, -22, 40, 18); c.fillStyle = '#1e3a8a'; c.fillRect(14, -14, 18, 10);
          c.fillStyle = '#fcd9b6'; c.beginPath(); c.arc(-26, -16, 11, 0, 6.283); c.fill(); c.fillStyle = '#ef4444'; c.fillRect(-36, -28, 18, 6);
        } else {
          c.strokeStyle = '#1e3a8a'; c.lineWidth = 9;
          c.beginPath(); c.moveTo(-5, -26); c.lineTo(-7 + leg, -2); c.moveTo(5, -26); c.lineTo(7 - leg, -2); c.stroke();
          c.fillStyle = '#f59e0b'; c.beginPath(); c.roundRect ? c.roundRect(-14, -60, 28, 36, 8) : c.rect(-14, -60, 28, 36); c.fill();
          c.strokeStyle = '#fcd9b6'; c.lineWidth = 7;
          c.beginPath(); c.moveTo(-12, -54); c.lineTo(-18 - arm * 0.6, -36); c.moveTo(12, -54); c.lineTo(18 + arm * 0.6, -36); c.stroke();
          c.fillStyle = '#fcd9b6'; c.beginPath(); c.arc(0, -72, 13, 0, 6.283); c.fill();
          c.fillStyle = '#ef4444'; c.beginPath(); c.arc(0, -76, 13, Math.PI, 0); c.fill(); c.fillRect(0, -78, 18, 5);
        }
        c.restore(); c.globalAlpha = 1;
        // панель: монеты и бонусы
        c.textAlign = 'left'; c.textBaseline = 'middle'; c.font = '800 16px system-ui';
        c.fillStyle = 'rgba(15,23,42,.6)'; c.fillRect(8, 8, 96, 30); c.fillStyle = '#facc15'; c.fillText('● ' + coinsN, 18, 24);
        var bx2 = W - 8;
        [[magnet, '🧲', 8], [dbl, '×2', 10], [shield, '🛡', 1]].forEach(function (B) {
          if (B[0] <= 0) return; bx2 -= 44;
          c.fillStyle = 'rgba(15,23,42,.6)'; c.fillRect(bx2, 8, 40, 30); c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(B[1], bx2 + 20, 22);
          if (B[2] > 1) { c.fillStyle = '#22c55e'; c.fillRect(bx2 + 3, 33, 34 * B[0] / B[2], 3); }
        });
        if (hintT > 0) {
          c.globalAlpha = Math.min(1, hintT); c.fillStyle = 'rgba(15,23,42,.75)'; c.fillRect(W / 2 - 150, H * 0.42, 300, 40);
          c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '800 15px system-ui'; c.fillText('Свайпай ← → ↑ ↓', W / 2, H * 0.42 + 20); c.globalAlpha = 1;
        }
      }
    };
  }
};
