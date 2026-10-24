/* Бегун: три дорожки-рельсы в перспективе. Свайп влево/вправо — дорожка, вверх — прыжок, вниз — подкат.
   Бонусы: магнит (притягивает монеты), ×2 (двойные очки), щит (одно столкновение без проигрыша).
   Препятствия и вагоны — объёмные коробки; всё, что проехало, уезжает вниз за край экрана */
window.GAMES = window.GAMES || {};
window.GAMES.runner = {
  title: 'Бегун', desc: 'Беги по дорожкам и собирай монеты', cat: 'arcade', isNew4: true, medals: [400, 1200, 3000],
  hint: 'Свайп влево или вправо — сменить дорожку, вверх — прыжок через низкий барьер, вниз — подкат под высокий. Поезд нужно обойти. Бонусы: 🧲 магнит, ×2 очки, 🛡 щит спасает от одного удара.',
  d0: 'Медленно', d1: 'Обычно', d2: 'Быстро', d3: 'Очень быстро',
  colors: ['#0ea5e9', '#f59e0b'], controls: 'none', liveSwipe: 'once',
  icon: '<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#38bdf8"/><path d="M42 30h16l26 62H16z" fill="#475569"/><path d="M47 30l-9 62M53 30l9 62" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="5 5"/><rect x="56" y="40" width="10" height="14" rx="2" fill="#ef4444"/><circle cx="46" cy="62" r="6" fill="#fcd9b6"/><rect x="40" y="68" width="12" height="15" rx="4" fill="#f59e0b"/><circle cx="34" cy="48" r="4" fill="#facc15"/></svg>',
  create: function (api) {
    var SP = [520, 640, 760, 880], FAR = 1700, D = 260, NEAR = -D * 0.42, HW = 0.4;
    var TRAIN = [['#dc2626', '#991b1b', '#7f1d1d'], ['#2563eb', '#1d4ed8', '#1e3a8a'], ['#16a34a', '#15803d', '#14532d'], ['#f59e0b', '#d97706', '#92400e']];
    var lane, lx, jump, slide, items, dist, sp, spawnZ, dead, deadT, t, coinsN, magnet, dbl, shield, hitT, hintT, sparks, flash;
    function hor() { return api.H * 0.3; }
    function baseY() { return api.H - 120; }
    // точка мира: xl — сдвиг в дорожках от центра, z — расстояние впереди игрока, h — высота в пикселях (при s = 1)
    function P(xl, z, h) { var s = D / (D + Math.max(NEAR, z)); return { x: api.W / 2 + xl * api.W * 0.3 * s, y: hor() + (baseY() - hor()) * s - (h || 0) * s, s: s }; }
    function quad(c, a, b, d, e, fill) { c.fillStyle = fill; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(d.x, d.y); c.lineTo(e.x, e.y); c.closePath(); c.fill(); }
    // объёмная коробка: видимые боковые стенки, крыша и передняя стенка
    function box(c, l, z0, z1, h, col, front) {
      z0 = Math.max(z0, NEAR); if (z1 <= z0) return;
      var x0 = l - HW, x1 = l + HW;
      var f0 = P(x0, z0, 0), f1 = P(x1, z0, 0), f2 = P(x1, z0, h), f3 = P(x0, z0, h), b0 = P(x0, z1, 0), b1 = P(x1, z1, 0), b2 = P(x1, z1, h), b3 = P(x0, z1, h);
      if (x0 > 0) quad(c, f0, b0, b3, f3, col[1]);
      if (x1 < 0) quad(c, f1, b1, b2, f2, col[1]);
      quad(c, f3, f2, b2, b3, col[2]);
      quad(c, f0, f1, f2, f3, col[0]);
      if (front) front(f0, f1, f2, f3, z0, z1);
    }
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
        else if (r < 0.85) items.push({ l: l, z: z, k: 'train', len: 300 + Math.floor(Math.random() * 2) * 200, col: TRAIN[Math.floor(Math.random() * TRAIN.length)] });
        else for (var j = 0; j < 4; j++) items.push({ l: l, z: z + j * 70, k: 'coin' });
      }
    }
    function hit(o) {
      if (shield > 0) { shield = 0; hitT = 1; api.sound('bonus'); api.vibrate(60); api.toast('🛡 Щит спас!'); return false; }
      // мир сразу встаёт, препятствие остаётся перед бегуном, а не проезжает сквозь него
      dead = o.k; deadT = 0; flash = 0.5; sp = 0; o.z = Math.max(o.z, 28); api.sound('hit'); api.vibrate(250); api.fx.shake(10); return true;
    }
    function spark(x, y, col) { for (var i = 0; i < 6; i++) sparks.push({ x: x, y: y, vx: (Math.random() - 0.5) * 220, vy: -60 - Math.random() * 180, l: 0.5, c: col }); }
    function drawItem(c, o, W) {
      var p, s, w;
      if (o.k === 'train') {
        box(c, o.l, o.z, o.z + o.len, 150, o.col, function (f0, f1, f2, f3, z0) {
          var fw = f1.x - f0.x, fh = f0.y - f3.y;
          if (z0 > NEAR + 1) {
            c.fillStyle = '#bae6fd'; c.fillRect(f3.x + fw * 0.12, f3.y + fh * 0.12, fw * 0.76, fh * 0.3);
            c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(f3.x + fw * 0.15, f3.y + fh * 0.14, fw * 0.2, fh * 0.26);
            c.fillStyle = '#fde68a'; c.beginPath(); c.arc(f0.x + fw * 0.2, f0.y - fh * 0.16, fw * 0.07, 0, 6.283); c.arc(f1.x - fw * 0.2, f0.y - fh * 0.16, fw * 0.07, 0, 6.283); c.fill();
            c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(f3.x, f0.y - fh * 0.06, fw, fh * 0.06);
            c.fillStyle = '#fff'; c.fillRect(f3.x + fw * 0.3, f3.y + fh * 0.55, fw * 0.4, fh * 0.07);
          }
        });
        // окна на видимом боку
        var sx = o.l - HW > 0 ? o.l - HW : o.l + HW < 0 ? o.l + HW : null;
        if (sx !== null) for (var wz = Math.max(o.z, NEAR) + 40; wz < o.z + o.len - 30; wz += 60) {
          var a = P(sx, wz, 110), b = P(sx, wz + 36, 110), e = P(sx, wz + 36, 70), f = P(sx, wz, 70);
          quad(c, a, b, e, f, 'rgba(186,230,253,.85)');
        }
        return;
      }
      if (o.k === 'low') {
        box(c, o.l, o.z, o.z + 14, 36, ['#f97316', '#c2410c', '#fdba74'], function (f0, f1, f2, f3) {
          var fw = f1.x - f0.x, fh = f0.y - f3.y;
          c.fillStyle = '#fff'; for (var st = 0; st < 4; st++) { c.beginPath(); c.moveTo(f3.x + fw * (st / 4 + 0.05), f3.y); c.lineTo(f3.x + fw * (st / 4 + 0.15), f3.y); c.lineTo(f3.x + fw * (st / 4 + 0.05), f0.y); c.lineTo(f3.x + fw * (st / 4 - 0.05), f0.y); c.fill(); }
        });
        return;
      }
      if (o.k === 'high') {
        var zz = Math.max(o.z, NEAR);
        [o.l - HW + 0.04, o.l + HW - 0.04].forEach(function (px2) { var a = P(px2, zz, 0), b = P(px2, zz, 120); c.strokeStyle = '#334155'; c.lineWidth = Math.max(2, 7 * a.s); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); });
        var t0 = P(o.l - HW, zz, 120), t1 = P(o.l + HW, zz, 120), t2 = P(o.l + HW, zz, 90), t3 = P(o.l - HW, zz, 90);
        quad(c, t0, t1, t2, t3, '#ef4444');
        c.fillStyle = '#fff'; var bw = (t1.x - t0.x) / 6; for (var q = 0; q < 6; q += 2) c.fillRect(t0.x + q * bw, t0.y, bw, t3.y - t0.y);
        return;
      }
      p = P(o.l, o.z, 0); s = p.s;
      if (o.k === 'coin') {
        var sw = Math.abs(Math.cos(t * 5 + o.z * 0.01)), cy = p.y - 40 * s;
        c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(p.x, p.y, 12 * s, 4 * s, 0, 0, 6.283); c.fill();
        c.fillStyle = '#b45309'; c.beginPath(); c.ellipse(p.x + 2 * s, cy, 14 * s * sw + 2 * s, 14 * s, 0, 0, 6.283); c.fill();
        c.fillStyle = '#facc15'; c.beginPath(); c.ellipse(p.x, cy, 14 * s * sw + 1.5 * s, 14 * s, 0, 0, 6.283); c.fill();
        c.fillStyle = '#fef08a'; c.beginPath(); c.ellipse(p.x - 4 * s * sw, cy - 4 * s, 4 * s * sw + 0.5, 4 * s, 0, 0, 6.283); c.fill();
        return;
      }
      var ic = { magnet: '🧲', x2: '×2', shield: '🛡' }[o.k], bob = Math.sin(t * 4) * 6 * s;
      c.fillStyle = 'rgba(167,139,250,.35)'; c.beginPath(); c.arc(p.x, p.y - 50 * s + bob, 30 * s, 0, 6.283); c.fill();
      c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.arc(p.x, p.y - 50 * s + bob, 22 * s, 0, 6.283); c.fill();
      c.fillStyle = '#7c3aed'; c.font = '900 ' + Math.round(24 * s) + 'px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ic, p.x, p.y - 50 * s + bob);
    }
    function drawRunner(c) {
      var pp = P(lx, 0, 0), jh = jump > 0 ? Math.sin((0.65 - jump) / 0.65 * Math.PI) * 90 : 0, sl = slide > 0 && !dead;
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(pp.x, pp.y, 26 - jh * 0.1, 8, 0, 0, 6.283); c.fill();
      c.save();
      if (dead) {
        // отброшен назад и падает на спину
        var k = Math.min(1, deadT / 0.45), bounce = Math.sin(Math.min(1, deadT / 0.6) * Math.PI) * 40;
        c.translate(pp.x, pp.y + k * 20 - bounce); c.rotate(-k * Math.PI / 2 * (dead === 'train' ? 1 : 0.9));
      } else c.translate(pp.x, pp.y - jh);
      if (hitT > 0 && Math.floor(t * 12) % 2) c.globalAlpha = 0.4;
      if (shield > 0) { c.strokeStyle = 'rgba(56,189,248,.8)'; c.lineWidth = 4; c.beginPath(); c.arc(0, -40, 46, 0, 6.283); c.stroke(); c.fillStyle = 'rgba(56,189,248,.12)'; c.fill(); }
      var run = dead ? 0 : 1, leg = Math.sin(t * 18) * 11 * run, arm = Math.cos(t * 18) * 12 * run;
      c.lineCap = 'round'; c.lineJoin = 'round';
      if (sl) {
        c.fillStyle = '#1e3a8a'; c.fillRect(6, -14, 30, 10);
        c.fillStyle = '#f8fafc'; c.fillRect(32, -16, 10, 12);
        c.fillStyle = '#f59e0b'; c.beginPath(); c.ellipse(-6, -18, 22, 11, 0, 0, 6.283); c.fill();
        c.fillStyle = '#7c3aed'; c.fillRect(-20, -32, 18, 14);
        c.fillStyle = '#fcd9b6'; c.beginPath(); c.arc(-30, -14, 11, 0, 6.283); c.fill(); c.fillStyle = '#ef4444'; c.beginPath(); c.arc(-30, -18, 11, Math.PI, 0); c.fill();
      } else {
        // ноги в кедах
        c.strokeStyle = '#1e3a8a'; c.lineWidth = 10;
        c.beginPath(); c.moveTo(-6, -30); c.lineTo(-7 + leg, -6); c.moveTo(6, -30); c.lineTo(7 - leg, -6); c.stroke();
        c.fillStyle = '#f8fafc'; c.fillRect(-14 + leg, -8, 14, 8); c.fillRect(0 - leg, -8, 14, 8);
        c.fillStyle = '#ef4444'; c.fillRect(-14 + leg, -3, 14, 3); c.fillRect(0 - leg, -3, 14, 3);
        // рюкзак и куртка
        c.fillStyle = '#7c3aed'; c.beginPath(); c.roundRect ? c.roundRect(-13, -64, 26, 26, 6) : c.rect(-13, -64, 26, 26); c.fill();
        c.fillStyle = '#f59e0b'; c.beginPath(); c.roundRect ? c.roundRect(-15, -66, 30, 38, 9) : c.rect(-15, -66, 30, 38); c.fill();
        c.fillStyle = '#a855f7'; c.fillRect(-11, -64, 5, 30); c.fillRect(6, -64, 5, 30);
        c.strokeStyle = '#fcd9b6'; c.lineWidth = 7;
        c.beginPath(); c.moveTo(-13, -58); c.lineTo(-20 - arm * 0.6, -40); c.moveTo(13, -58); c.lineTo(20 + arm * 0.6, -40); c.stroke();
        // голова, затылок и кепка (вид сзади)
        c.fillStyle = '#fcd9b6'; c.beginPath(); c.arc(0, -78, 13, 0, 6.283); c.fill();
        c.fillStyle = '#7c2d12'; c.beginPath(); c.arc(0, -79, 13, Math.PI * 0.95, Math.PI * 2.05); c.fill();
        c.fillStyle = '#ef4444'; c.beginPath(); c.arc(0, -82, 13.5, Math.PI, 0); c.fill(); c.fillRect(-13.5, -83, 27, 4);
        c.fillStyle = '#fff'; c.fillRect(-3, -94, 6, 3);
      }
      c.restore(); c.globalAlpha = 1;
      if (dead && deadT > 0.35) { // звёздочки над головой
        for (var i = 0; i < 3; i++) { var a = t * 5 + i * 2.1; c.fillStyle = '#facc15'; c.font = '900 16px system-ui'; c.textAlign = 'center'; c.fillText('★', pp.x - 60 + Math.cos(a) * 22, pp.y - 30 + Math.sin(a) * 7); }
      }
    }
    return {
      reset: function () { lane = 0; lx = 0; jump = 0; slide = 0; items = []; dist = 0; sp = SP[api.diff]; spawnZ = 500; dead = null; deadT = 0; t = 0; coinsN = 0; magnet = 0; dbl = 0; shield = 0; hitT = 0; hintT = 3; sparks = []; flash = 0; },
      resize: function () { }, idle: function (dt) { t += dt; },
      key: function (k, down) { if (down) move(k); },
      input: function (type, d) {
        if (type === 'swipe') move(d.dir);
        else if (type === 'tap') move(d.x < api.W / 2 ? 'left' : 'right');
      },
      update: function (dt) {
        t += dt; if (hintT > 0) hintT -= dt; if (flash > 0) flash -= dt;
        for (var q = sparks.length - 1; q >= 0; q--) { var sk = sparks[q]; sk.x += sk.vx * dt; sk.y += sk.vy * dt; sk.vy += 500 * dt; sk.l -= dt; if (sk.l <= 0) sparks.splice(q, 1); }
        if (dead) {
          // мир плавно останавливается, бегун падает
          deadT += dt; sp = Math.max(0, sp - sp * 4 * dt); dist += sp * dt;
          items.forEach(function (o) { o.z -= sp * dt; });
          if (deadT > 1.5) api.gameOver();
          return;
        }
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
            var pp = P(o.l, 0, 40);
            if (o.k === 'coin') { items.splice(i, 1); coinsN++; api.addScore(dbl > 0 ? 20 : 10); api.sound('coin'); spark(pp.x, pp.y - 40, '#facc15'); continue; }
            if (o.k === 'magnet' || o.k === 'x2' || o.k === 'shield') {
              items.splice(i, 1); api.sound('bonus'); spark(pp.x, pp.y - 50, '#a78bfa');
              if (o.k === 'magnet') magnet = 8; else if (o.k === 'x2') dbl = 10; else shield = 1;
              api.toast({ magnet: '🧲 Магнит!', x2: '×2 очки!', shield: '🛡 Щит!' }[o.k]); continue;
            }
            if (hitT <= 0 && !(o.k === 'low' && air) && !(o.k === 'high' && low)) { if (hit(o)) return; }
          }
          if (o.z + (o.len || 0) < NEAR) items.splice(i, 1);
        }
        if (Math.floor(dist / 150) > Math.floor((dist - sp * dt) / 150)) api.addScore(dbl > 0 ? 2 : 1);
      },
      draw: function (c) {
        var W = api.W, H = api.H, hy = hor();
        var sky = c.createLinearGradient(0, 0, 0, hy);
        sky.addColorStop(0, '#38bdf8'); sky.addColorStop(1, '#e0f2fe'); c.fillStyle = sky; c.fillRect(0, 0, W, hy + 1);
        // облака
        c.fillStyle = 'rgba(255,255,255,.9)';
        for (var cl = 0; cl < 4; cl++) { var cx = ((cl * 170 + t * 8) % (W + 200)) - 100, cy = 30 + (cl * 53 % 70); c.beginPath(); c.arc(cx, cy, 16, 0, 6.283); c.arc(cx + 18, cy - 8, 20, 0, 6.283); c.arc(cx + 40, cy, 15, 0, 6.283); c.fill(); }
        // город на горизонте
        for (var b = 0; b < 16; b++) {
          var bw = W / 11, bx = ((b * bw * 1.2 - dist * 0.015) % (W + bw * 2) + W + bw * 2) % (W + bw * 2) - bw, bh = 28 + (b * 37 % 64);
          c.fillStyle = ['#64748b', '#7c8da3', '#94a3b8'][b % 3]; c.fillRect(bx, hy - bh, bw - 2, bh);
          c.fillStyle = 'rgba(254,240,138,.7)'; for (var wy = hy - bh + 6; wy < hy - 6; wy += 10) { c.fillRect(bx + 5, wy, 4, 4); c.fillRect(bx + bw - 11, wy, 4, 4); }
        }
        // трава с полосами
        c.fillStyle = '#65a30d'; c.fillRect(0, hy, W, H - hy);
        c.fillStyle = '#4d7c0f';
        for (var gz = -(dist % 200); gz < FAR; gz += 200) { var g0 = P(-6, gz, 0), g1 = P(6, gz, 0), g2 = P(6, gz + 100, 0), g3 = P(-6, gz + 100, 0); quad(c, g0, g1, g2, g3, '#5b8f0f'); }
        // насыпь и бордюры
        quad(c, P(-1.75, FAR), P(1.75, FAR), P(1.75, NEAR), P(-1.75, NEAR), '#78716c');
        quad(c, P(-1.75, FAR), P(-1.6, FAR), P(-1.6, NEAR), P(-1.75, NEAR), '#d6d3d1');
        quad(c, P(1.6, FAR), P(1.75, FAR), P(1.75, NEAR), P(1.6, NEAR), '#d6d3d1');
        // шпалы и рельсы на каждой дорожке
        for (var z = -(dist % 60); z < FAR; z += 60) for (var ln = -1; ln <= 1; ln++) { var s0 = P(ln - 0.42, z), s1 = P(ln + 0.42, z), s2 = P(ln + 0.42, z + 18), s3 = P(ln - 0.42, z + 18); quad(c, s0, s1, s2, s3, '#57412c'); }
        c.strokeStyle = '#cbd5e1';
        for (var rl = -1; rl <= 1; rl++) [-0.26, 0.26].forEach(function (k) { var f = P(rl + k, FAR), n = P(rl + k, NEAR); c.lineWidth = 4; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(n.x, n.y); c.stroke(); });
        // фонари вдоль дороги
        for (var lz = -(dist % 400) + 200; lz < FAR; lz += 400) [-2.1, 2.1].forEach(function (lxp) {
          var a = P(lxp, lz, 0), bb = P(lxp, lz, 170), hd = P(lxp * 0.92, lz, 170);
          c.strokeStyle = '#334155'; c.lineWidth = Math.max(1.5, 6 * a.s); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(bb.x, bb.y); c.lineTo(hd.x, hd.y); c.stroke();
          c.fillStyle = '#fef08a'; c.beginPath(); c.arc(hd.x, hd.y + 4 * a.s, 6 * a.s, 0, 6.283); c.fill();
        });
        // деревья
        for (var tz = -(dist % 330) + 90; tz < FAR; tz += 330) [-3, 3.3].forEach(function (txp) {
          var a = P(txp, tz, 0), s = a.s;
          c.fillStyle = '#78350f'; c.fillRect(a.x - 5 * s, a.y - 50 * s, 10 * s, 50 * s);
          c.fillStyle = '#166534'; c.beginPath(); c.arc(a.x, a.y - 70 * s, 32 * s, 0, 6.283); c.fill();
          c.fillStyle = '#22c55e'; c.beginPath(); c.arc(a.x - 9 * s, a.y - 78 * s, 18 * s, 0, 6.283); c.fill();
        });
        // предметы: впереди игрока — до него, проехавшие — после
        var sorted = items.slice().sort(function (p2, q2) { return (q2.z + (q2.len || 0) / 2) - (p2.z + (p2.len || 0) / 2); });
        var after = [];
        sorted.forEach(function (o) {
          if (o.z > FAR) return;
          var behind = o.k === 'train' ? (o.z < 0 && Math.abs(o.l - lx) < 0.6) : o.z < -10;
          if (behind) after.push(o); else drawItem(c, o, W);
        });
        drawRunner(c);
        after.forEach(function (o) { drawItem(c, o, W); });
        sparks.forEach(function (p3) { c.globalAlpha = Math.max(0, p3.l * 2); c.fillStyle = p3.c; c.fillRect(p3.x - 3, p3.y - 3, 6, 6); }); c.globalAlpha = 1;
        if (flash > 0) { c.fillStyle = 'rgba(239,68,68,' + flash * 0.8 + ')'; c.fillRect(0, 0, W, H); }
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
