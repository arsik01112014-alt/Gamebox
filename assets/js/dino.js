/* Дино — бесконечный раннер */
window.GAMES = window.GAMES || {};
window.GAMES.dino = {
  title: 'Дино',
  desc: 'Беги и перепрыгивай кактусы',
  hint: 'Тап по экрану или кнопка «Прыжок» — прыжок (держи дольше — выше). «Пригнуться» — проскочить под птицей. Скорость всё время растёт!',
  colors: ['#84cc16', '#ea580c'],
  controls: 'runner',
  icon: '<svg viewBox="0 0 100 100"><defs><radialGradient id="dinoS" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fffbeb"/><stop offset="1" stop-color="#fbbf24"/></radialGradient><linearGradient id="dinoB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86efac"/><stop offset="1" stop-color="#16a34a"/></linearGradient><linearGradient id="dinoC" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4ade80"/><stop offset="1" stop-color="#14532d"/></linearGradient><linearGradient id="dinoG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d97706"/><stop offset="1" stop-color="#78350f"/></linearGradient></defs><circle cx="78" cy="22" r="16" fill="#fde68a" opacity=".3"/><circle cx="78" cy="22" r="11" fill="url(#dinoS)"/><rect x="0" y="82" width="100" height="18" fill="url(#dinoG)" opacity=".55"/>' +
    '<path d="M0 82 H100" stroke="#78350f" stroke-width="4"/>' +
    '<rect x="70" y="52" width="9" height="30" rx="4" fill="url(#dinoC)"/><rect x="62" y="58" width="6" height="12" rx="3" fill="url(#dinoC)"/><rect x="81" y="56" width="6" height="12" rx="3" fill="url(#dinoC)"/>' +
    '<g fill="url(#dinoB)" stroke="#14532d" stroke-width="1.2"><rect x="30" y="20" width="26" height="18" rx="4"/><rect x="18" y="36" width="26" height="26" rx="6"/>' +
    '<rect x="6" y="40" width="14" height="8" rx="4"/><rect x="22" y="60" width="7" height="16" rx="3"/><rect x="34" y="60" width="7" height="16" rx="3"/>' +
    '<rect x="42" y="44" width="10" height="5" rx="2.5"/></g><rect x="38" y="25" width="5" height="5" fill="#111"/>' +
    '<rect x="44" y="33" width="10" height="2.5" fill="#166534"/></svg>',

  create: function (api) {
    var DINO = [
      '.........GGGGGG.',
      '........GGWKGGGG',
      '........GGWWGGGG',
      '........GGGGGGGG',
      '........GGGGG...',
      '........GGGGGGG.',
      'G......GGGGG....',
      'G.....GGGGGG....',
      'GG...GGGGGGGGG..',
      'GGG.GGGGGGGG.G..',
      'GGGGGGGGGGGG....',
      '.GGGGLLLLGGG....',
      '..GGGLLLLGG.....',
      '...GGGGGGG......',
      '....GG..GG......',
      '....G....G......'
    ];
    var LEG1 = ['....GG...GG.....', '....G......G....'];
    var LEG2 = ['....GG.GG.......', '.....G.G........'];
    var PAL = { G: '#4ade80', L: '#bbf7d0', W: '#fff', K: '#111' };
    var cache = {};
    function sprite(frame) {
      if (cache[frame]) return cache[frame];
      var rows = DINO.slice(0, 14).concat(frame === 1 ? LEG1 : frame === 2 ? LEG2 : DINO.slice(14));
      var cv = document.createElement('canvas'); cv.width = 16; cv.height = 16;
      var c = cv.getContext('2d');
      for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) {
        var ch = rows[y][x];
        if (PAL[ch]) { c.fillStyle = PAL[ch]; c.fillRect(x, y, 1, 1); }
        if (ch === 'G' && (y > 10 || x < 4)) { c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(x, y, 1, 1); }
      }
      cache[frame] = cv;
      return cv;
    }

    var s, gy, dino, obs, clouds, dust, dist, speed, t, nextT, holdJump, duckKey, deadT, dead, cycle, mileT, hills;

    function rnd(a, b) { return a + Math.random() * (b - a); }
    var DIFF = [
      { start: 280, max: 620, acc: 5, bird: 1e9, group: 0.6 },
      { start: 340, max: 820, acc: 7, bird: 250, group: 1 },
      { start: 420, max: 880, acc: 9, bird: 0, group: 1.3 },
      { start: 480, max: 960, acc: 11, bird: 0, group: 1.8 }
    ];
    var D = DIFF[1], decor = [], weed = null, hiScore = 0;
    // v2.0: монеты над кактусами, щит и крылья (двойной прыжок)
    var bonus = 0, items = [], shieldOn = false, wingsT = 0, airJ = 1;

    function jump() {
      if (dead) return;
      if (dino.y < gy - 0.5 && wingsT > 0 && airJ > 0) {
        airJ--; dino.vy = -720 * s; api.sound('flap');
        for (var w = 0; w < 8; w++) dust.push({ x: dino.x + 20 * s, y: dino.y - 20 * s, vx: rnd(-120, 40) * s, vy: rnd(20, 120) * s, life: 0.4 });
        return;
      }
      if (dino.y >= gy - 0.5) {
        dino.vy = -820 * s; dino.y = gy - 1; airJ = 1;
        api.sound('jump');
        for (var i = 0; i < 6; i++) dust.push({ x: dino.x + rnd(0, 30) * s, y: gy, vx: rnd(-80, 20) * s, vy: rnd(-90, -20) * s, life: 0.4 });
      }
    }

    function spawn() {
      var W = api.W, score = dist / 10;
      if (score > D.bird && Math.random() < 0.3) {
        var lvls = [gy - 30 * s, gy - 62 * s, gy - 100 * s];
        obs.push({ type: 'bird', x: W + 40 * s, y: lvls[Math.floor(Math.random() * 3)], w: 44 * s, h: 26 * s });
      } else {
        var n = 1 + (Math.random() < Math.min(0.55 * D.group, score / 1200 * D.group + (api.diff >= 2 ? 0.15 : 0)) ? 1 + Math.floor(Math.random() * 2) : 0);
        var big = Math.random() < 0.45;
        var w = (big ? 24 : 18) * s, h = (big ? 58 : 42) * s;
        for (var i = 0; i < n; i++) obs.push({ type: 'cactus', x: W + 20 * s + i * (w + 6 * s), y: gy - h, w: w, h: h, arms: [rnd(0.25, 0.5), rnd(0.3, 0.6)] });
        var cx0 = W + 20 * s + n * (w + 6 * s) / 2;
        if (Math.random() < 0.35) for (var k = -1; k <= 1; k++) items.push({ type: 'coin', x: cx0 + k * 26 * s, y: gy - h - (k ? 46 : 62) * s });
        else if (Math.random() < 0.07 && score > 80) items.push({ type: Math.random() < 0.5 ? 'shield' : 'wings', x: cx0 + 140 * s, y: gy - 60 * s });
      }
      var gapT = rnd(0.75, 1.6) * Math.max(0.6, 1 - score / 3000);
      nextT = gapT + 220 * s / speed;
    }

    function hitbox() {
      var duck = duckKey && dino.y >= gy - 0.5;
      var w = (duck ? 68 : 52) * s, h = (duck ? 32 : 56) * s;
      return { x: dino.x + 8 * s, y: dino.y - h + 4 * s, w: w - 16 * s, h: h - 8 * s, duck: duck };
    }

    function drawCactus(c, o) {
      var x = o.x, y = o.y, w = o.w, h = o.h, r = w / 2;
      var g = c.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, '#166534'); g.addColorStop(0.4, '#22c55e'); g.addColorStop(1, '#14532d');
      function capsule(cx, cy, cw, ch) {
        c.beginPath(); c.moveTo(cx, cy + cw / 2); c.arc(cx + cw / 2, cy + cw / 2, cw / 2, Math.PI, 0); c.lineTo(cx + cw, cy + ch); c.lineTo(cx, cy + ch); c.closePath(); c.fill();
      }
      var aw = w * 0.32, ol = 1.5 * s;
      c.fillStyle = '#052e16'; // контур
      capsule(x + w * 0.25 - ol, y - ol, w * 0.5 + ol * 2, h + ol);
      capsule(x - aw * 0.3 - ol, y + h * o.arms[0] - ol, aw + ol * 2, h * 0.28 + ol); c.fillRect(x - aw * 0.3 - ol, y + h * (o.arms[0] + 0.2) - ol, w * 0.6 + ol, aw * 0.8 + ol * 2);
      capsule(x + w - aw * 0.7 - ol, y + h * o.arms[1] - h * 0.08 - ol, aw + ol * 2, h * 0.28 + ol); c.fillRect(x + w * 0.5, y + h * (o.arms[1] + 0.12) - ol, w * 0.5 + ol, aw * 0.8 + ol * 2);
      c.fillStyle = g;
      capsule(x + w * 0.25, y, w * 0.5, h);
      capsule(x - aw * 0.3, y + h * o.arms[0], aw, h * 0.28); c.fillRect(x - aw * 0.3, y + h * (o.arms[0] + 0.2), w * 0.6, aw * 0.8);
      capsule(x + w - aw * 0.7, y + h * o.arms[1] - h * 0.08, aw, h * 0.28); c.fillRect(x + w * 0.5, y + h * (o.arms[1] + 0.12), w * 0.5, aw * 0.8);
      c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x + w / 2, y + 4 * s); c.lineTo(x + w / 2, y + h - 2); c.stroke();
      c.fillStyle = '#f472b6'; c.beginPath(); c.arc(x + w / 2, y + 2 * s, 3 * s, 0, 6.283); c.fill();
      // колючки
      c.fillStyle = 'rgba(254,249,195,.85)';
      for (var sy = y + 8 * s; sy < y + h - 4 * s; sy += 7 * s) {
        c.fillRect(x + w * 0.25 - 2 * s, sy, 2 * s, 1); c.fillRect(x + w * 0.75, sy + 3 * s, 2 * s, 1);
      }
      c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(x + w / 2, y + h, w * 0.6, 2.5 * s, 0, 0, 6.283); c.fill();
    }

    function drawBird(c, o) {
      var x = o.x, y = o.y, f = Math.floor(t * 8) % 2;
      var bgd = c.createLinearGradient(0, y + o.h * 0.3, 0, y + o.h * 0.8);
      bgd.addColorStop(0, '#8b5cf6'); bgd.addColorStop(1, '#5b21b6');
      c.fillStyle = bgd; c.strokeStyle = '#3b0764'; c.lineWidth = 1.5 * s;
      c.beginPath(); c.ellipse(x + o.w * 0.5, y + o.h * 0.55, o.w * 0.32, o.h * 0.22, 0, 0, 6.283); c.fill(); c.stroke();
      c.fillStyle = 'rgba(237,233,254,.55)'; c.beginPath(); c.ellipse(x + o.w * 0.45, y + o.h * 0.64, o.w * 0.18, o.h * 0.08, 0, 0, 6.283); c.fill();
      c.fillStyle = bgd;
      c.beginPath(); c.moveTo(x + o.w * 0.75, y + o.h * 0.45); c.lineTo(x + o.w, y + o.h * 0.5); c.lineTo(x + o.w * 0.75, y + o.h * 0.62); c.fill();
      c.fillStyle = '#facc15'; c.beginPath(); c.moveTo(x + o.w * 0.18, y + o.h * 0.5); c.lineTo(x, y + o.h * 0.58); c.lineTo(x + o.w * 0.18, y + o.h * 0.64); c.fill();
      c.fillStyle = '#a78bfa'; c.strokeStyle = '#4c1d95'; c.lineWidth = 1.2 * s; c.lineJoin = 'round';
      c.beginPath();
      if (f) { c.moveTo(x + o.w * 0.3, y + o.h * 0.5); c.lineTo(x + o.w * 0.55, y - o.h * 0.25); c.lineTo(x + o.w * 0.65, y + o.h * 0.5); }
      else { c.moveTo(x + o.w * 0.3, y + o.h * 0.6); c.lineTo(x + o.w * 0.55, y + o.h * 1.25); c.lineTo(x + o.w * 0.65, y + o.h * 0.6); }
      c.fill(); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x + o.w * 0.3, y + o.h * 0.48, 2.5 * s, 0, 6.283); c.fill();
      c.fillStyle = '#111'; c.beginPath(); c.arc(x + o.w * 0.29, y + o.h * 0.48, 1.2 * s, 0, 6.283); c.fill();
    }

    var cloudOff = null;
    function buildCloud() { // облако 60x36 при масштабе 1, рисуется в 3x
      var d = Math.min(2, window.devicePixelRatio || 1) * 1.5, o = document.createElement('canvas');
      o.width = Math.ceil(60 * d * 1.5); o.height = Math.ceil(42 * d * 1.5);
      var q = o.getContext('2d'); q.scale(d * 1.5, d * 1.5);
      function blob(dy) { dy += 6; q.beginPath(); q.arc(14, 22 + dy, 12, 0, 6.283); q.arc(28, 14 + dy, 15, 0, 6.283); q.arc(44, 21 + dy, 11, 0, 6.283); q.rect(14, 21 + dy, 30, 12); }
      blob(0); q.fillStyle = 'rgba(203,213,225,.95)'; q.fill();
      blob(-2.5); var g = q.createLinearGradient(0, 4, 0, 38); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#eef2ff'); q.fillStyle = g; q.fill();
      q.fillStyle = 'rgba(255,255,255,.95)'; q.beginPath(); q.ellipse(24, 11, 6, 3, -0.3, 0, 6.283); q.fill();
      cloudOff = o;
    }
    function mixC(a, b, k) {
      var pa = [parseInt(a.substr(1, 2), 16), parseInt(a.substr(3, 2), 16), parseInt(a.substr(5, 2), 16)];
      var pb = [parseInt(b.substr(1, 2), 16), parseInt(b.substr(3, 2), 16), parseInt(b.substr(5, 2), 16)];
      return 'rgb(' + Math.round(pa[0] + (pb[0] - pa[0]) * k) + ',' + Math.round(pa[1] + (pb[1] - pa[1]) * k) + ',' + Math.round(pa[2] + (pb[2] - pa[2]) * k) + ')';
    }

    return {
      reset: function () {
        s = Math.min(api.W / 400, api.H / 560) * 1.05;
        gy = Math.round(api.H * 0.74);
        dino = { x: 40 * s, y: gy, vy: 0, anim: 0 };
        D = DIFF[api.diff];
        hiScore = api.store.get('best_dino_' + api.diff, 0);
        decor = []; weed = null;
        for (var dc = 0; dc < 14; dc++) decor.push({ x: rnd(0, api.W), y: rnd(6, 60), k: Math.floor(rnd(0, 4)) });
        obs = []; dust = []; dist = 0; speed = D.start * s; t = 0; nextT = 1.2; holdJump = false; duckKey = false;
        dead = false; deadT = 0; cycle = 0; mileT = 0;
        bonus = 0; items = []; shieldOn = false; wingsT = 0; airJ = 1;
        clouds = []; for (var i = 0; i < 5; i++) clouds.push({ x: rnd(0, api.W), y: rnd(0.08, 0.4) * api.H, k: rnd(0.6, 1.3) });
        hills = 0;
      },
      idle: function (dt) { t += dt; dino.anim += dt * 4; },
      begin: function () { },
      key: function (k, down) {
        if (k === 'a' || k === 'up') { holdJump = down; if (down) jump(); }
        if (k === 'down') duckKey = down;
      },
      input: function (type) {
        if (type === 'down') { holdJump = true; jump(); }
        else if (type === 'up') holdJump = false;
      },
      update: function (dt) {
        t += dt;
        if (dead) {
          deadT -= dt;
          dino.vy += 2600 * s * dt; dino.y = Math.min(gy, dino.y + dino.vy * dt);
          if (deadT <= 0) api.gameOver();
          return;
        }
        speed = Math.min(D.max * s, speed + D.acc * s * dt);
        decor.forEach(function (d) {
          d.x -= speed * dt * (0.8 + d.y / 120);
          if (d.x < -30 * s) { d.x = api.W + rnd(0, 60) * s; d.y = rnd(6, 60); d.k = Math.floor(rnd(0, 4)); }
        });
        if (!weed && Math.random() < dt * 0.08) weed = { x: api.W + 30 * s, r: 0, vy: 0, y: 0 };
        if (weed) {
          weed.x -= speed * dt * 1.25; weed.r -= dt * 8; weed.vy += 1400 * s * dt; weed.y += weed.vy * dt;
          if (weed.y > 0) { weed.y = 0; weed.vy = -rnd(150, 320) * s; }
          if (weed.x < -40 * s) weed = null;
        }
        dist += speed * dt / s / 6;
        var sc = Math.floor(dist / 10) + bonus;
        if (sc !== api.getScore()) api.setScore(sc);
        if (Math.floor(sc / 100) > mileT) { mileT = Math.floor(sc / 100); api.sound('point'); }
        cycle = (sc % 1400) / 1400;
        hills += speed * dt;
        // физика дино
        if (dino.y < gy || dino.vy < 0) {
          var g = 2500 * s;
          if (dino.vy < 0 && !holdJump) g *= 2.1;
          if (duckKey) g *= 2.4;
          dino.vy += g * dt; dino.y += dino.vy * dt;
          if (dino.y >= gy) { dino.y = gy; dino.vy = 0; }
        }
        dino.anim += dt * speed / (28 * s);
        if (dino.y >= gy) airJ = 1;
        if (wingsT > 0) wingsT -= dt;
        var hb0 = hitbox();
        for (var it = items.length - 1; it >= 0; it--) {
          var o2 = items[it]; o2.x -= speed * dt;
          if (o2.x < -30 * s) { items.splice(it, 1); continue; }
          if (Math.abs(o2.x - (hb0.x + hb0.w / 2)) < hb0.w / 2 + 12 * s && o2.y > hb0.y - 12 * s && o2.y < hb0.y + hb0.h + 12 * s) {
            items.splice(it, 1);
            if (o2.type === 'coin') { bonus += 5; api.sound('coin'); api.fx.text(o2.x, o2.y - 14 * s, '+5', '#fde047', 15); }
            else if (o2.type === 'shield') { shieldOn = true; api.sound('bonus'); api.fx.text(o2.x, o2.y - 16 * s, api.t('dino.shield'), '#7dd3fc', 16); }
            else { wingsT = 10; airJ = 1; api.sound('bonus'); api.fx.text(o2.x, o2.y - 16 * s, api.t('dino.wings'), '#f9a8d4', 16); }
            api.vibrate(12);
          }
        }
        // препятствия
        nextT -= dt;
        if (nextT <= 0) spawn();
        var hb = hitbox();
        for (var i = obs.length - 1; i >= 0; i--) {
          var o = obs[i];
          o.x -= speed * dt * (o.type === 'bird' ? 1.12 : 1);
          if (o.x + o.w < -20) { obs.splice(i, 1); continue; }
          var ix = o.x + 4 * s, iy = o.y + 4 * s, iw = o.w - 8 * s, ih = o.h - 6 * s;
          if (hb.x < ix + iw && hb.x + hb.w > ix && hb.y < iy + ih && hb.y + hb.h > iy && shieldOn) {
            shieldOn = false; obs.splice(i, 1); api.sound('break'); api.vibrate(50); api.fx.shake(5);
            api.fx.burst(o.x + o.w / 2, o.y + o.h / 2, o.type === 'bird' ? '#a8a29e' : '#4ade80', 18, 200);
            continue;
          }
          if (hb.x < ix + iw && hb.x + hb.w > ix && hb.y < iy + ih && hb.y + hb.h > iy) {
            dead = true; api.fx.shake(6); deadT = 1.0; dino.vy = -400 * s;
            api.sound('hit'); api.vibrate(200);
          }
        }
        for (var c2 = 0; c2 < clouds.length; c2++) {
          var cl = clouds[c2]; cl.x -= speed * 0.12 * cl.k * dt;
          if (cl.x < -120 * s) { cl.x = api.W + rnd(0, 80); cl.y = rnd(0.08, 0.4) * api.H; }
        }
        if (dino.y >= gy && Math.random() < dt * 14) dust.push({ x: dino.x + 6 * s, y: gy, vx: -speed * 0.3, vy: rnd(-40, -10) * s, life: 0.3 });
        dust = dust.filter(function (d) { d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt; return d.life > 0; });
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        // день → закат → ночь → рассвет
        var ph = cycle * 4, k = ph % 1, idx = Math.floor(ph);
        var TOP = ['#38bdf8', '#f97316', '#0f172a', '#c084fc'], BOT = ['#bae6fd', '#fde68a', '#312e81', '#fbcfe8'];
        var night = idx === 2 ? 1 : idx === 1 ? k : idx === 3 ? 1 - k : 0;
        var sky = c.createLinearGradient(0, 0, 0, gy);
        sky.addColorStop(0, mixC(TOP[idx], TOP[(idx + 1) % 4], k)); sky.addColorStop(1, mixC(BOT[idx], BOT[(idx + 1) % 4], k));
        c.fillStyle = sky; c.fillRect(0, 0, W, gy);
        // звёзды ночью
        if (night > 0.05) {
          c.fillStyle = 'rgba(255,255,255,' + night * 0.8 + ')';
          for (var i = 0; i < 40; i++) c.fillRect((i * 97 + 13) % W, (i * 53 + 7) % (gy * 0.6), 2, 2);
        }
        // солнце / луна
        var sunY = gy * (0.2 + night * 0.15);
        var sxp = W * 0.78, isN = night > 0.5;
        var sgl = c.createRadialGradient(sxp, sunY, 10 * s, sxp, sunY, 80 * s);
        sgl.addColorStop(0, isN ? 'rgba(241,245,249,.28)' : 'rgba(254,240,138,.55)'); sgl.addColorStop(1, 'rgba(254,240,138,0)');
        c.fillStyle = sgl; c.fillRect(sxp - 80 * s, sunY - 80 * s, 160 * s, 160 * s);
        var sbd = c.createRadialGradient(sxp - 8 * s, sunY - 8 * s, 2 * s, sxp, sunY, 26 * s);
        if (isN) { sbd.addColorStop(0, '#ffffff'); sbd.addColorStop(1, '#cbd5e1'); } else { sbd.addColorStop(0, '#fffbeb'); sbd.addColorStop(0.6, '#fde047'); sbd.addColorStop(1, '#f59e0b'); }
        c.fillStyle = sbd; c.beginPath(); c.arc(sxp, sunY, 26 * s, 0, 6.283); c.fill();
        if (isN) {
          c.fillStyle = 'rgba(148,163,184,.45)';
          c.beginPath(); c.arc(sxp - 9 * s, sunY + 6 * s, 4 * s, 0, 6.283); c.arc(sxp - 2 * s, sunY - 12 * s, 3 * s, 0, 6.283); c.arc(sxp - 14 * s, sunY - 4 * s, 2.5 * s, 0, 6.283); c.fill();
          c.fillStyle = mixC(TOP[idx], TOP[(idx + 1) % 4], k); c.beginPath(); c.arc(sxp + 10 * s, sunY - 6 * s, 22 * s, 0, 6.283); c.fill();
        }
        // облака
        if (!cloudOff) buildCloud();
        c.globalAlpha = 0.95 - night * 0.65;
        clouds.forEach(function (cl) {
          var q = cl.k * s * 1.2;
          c.drawImage(cloudOff, cl.x - 14 * q, cl.y - 28 * q, 60 * q, 42 * q);
        });
        c.globalAlpha = 1;
        // горы
        function range(par, h, col, step, snow) {
          var off = (hills * par) % (step * s), x, ph2;
          c.fillStyle = col; c.beginPath(); c.moveTo(0, gy);
          for (x = -off - step * s; x < W + step * s; x += step * s) {
            c.lineTo(x + step * s * 0.5, gy - h * s * (0.7 + 0.3 * Math.abs(Math.sin((x + hills * par - off) * 0.01)))); c.lineTo(x + step * s, gy);
          }
          c.fill();
          // теневые склоны и снежные шапки
          c.fillStyle = 'rgba(15,10,40,.16)';
          c.beginPath();
          for (x = -off - step * s; x < W + step * s; x += step * s) {
            ph2 = gy - h * s * (0.7 + 0.3 * Math.abs(Math.sin((x + hills * par - off) * 0.01)));
            c.moveTo(x + step * s * 0.5, ph2); c.lineTo(x + step * s, gy); c.lineTo(x + step * s * 0.62, gy); c.closePath();
          }
          c.fill();
          if (snow) {
            c.fillStyle = 'rgba(255,255,255,' + (0.75 - night * 0.45) + ')';
            c.beginPath();
            for (x = -off - step * s; x < W + step * s; x += step * s) {
              ph2 = gy - h * s * (0.7 + 0.3 * Math.abs(Math.sin((x + hills * par - off) * 0.01)));
              var px2 = x + step * s * 0.5, dd = (gy - ph2) * 0.2, sl = step * s * 0.5 * 0.2;
              c.moveTo(px2, ph2); c.lineTo(px2 + sl, ph2 + dd); c.lineTo(px2 + sl * 0.3, ph2 + dd * 0.8); c.lineTo(px2 - sl * 0.3, ph2 + dd * 1.05); c.lineTo(px2 - sl, ph2 + dd); c.closePath();
            }
            c.fill();
          }
        }
        range(0.05, 150, mixC('#c4b5fd', '#1e1b4b', Math.min(1, night * 1.1)), 210, true);
        range(0.1, 120, mixC('#a78bfa', '#1e1b4b', night), 160, false);
        var hzg = c.createLinearGradient(0, gy - 60 * s, 0, gy);
        hzg.addColorStop(0, 'rgba(255,255,255,0)'); hzg.addColorStop(1, night > 0.5 ? 'rgba(49,46,129,.35)' : 'rgba(254,243,199,.35)');
        c.fillStyle = hzg; c.fillRect(0, gy - 60 * s, W, 60 * s);
        range(0.25, 70, mixC('#f9a8d4', '#312e81', night), 110, false);
        // земля
        var gg = c.createLinearGradient(0, gy, 0, H);
        gg.addColorStop(0, mixC('#fbbf24', '#78350f', night)); gg.addColorStop(1, mixC('#b45309', '#451a03', night));
        c.fillStyle = gg; c.fillRect(0, gy, W, H - gy);
        c.fillStyle = 'rgba(255,255,255,' + (0.25 - night * 0.18) + ')'; c.fillRect(0, gy + 3 * s, W, 2 * s);
        c.fillStyle = 'rgba(120,53,15,.1)'; c.fillRect(0, gy + 40 * s, W, 3 * s); c.fillRect(0, gy + 75 * s, W, 4 * s);
        c.fillStyle = mixC('#92400e', '#1c0a00', night); c.fillRect(0, gy, W, 3 * s);
        var off2 = hills % (40 * s);
        c.fillStyle = 'rgba(120,53,15,.45)';
        for (var x2 = -off2; x2 < W; x2 += 40 * s) { c.fillRect(x2, gy + 12 * s, 10 * s, 2 * s); c.fillRect(x2 + 22 * s, gy + 26 * s, 6 * s, 2 * s); }
        // камни, кости, ростки на земле
        decor.forEach(function (d) {
          var dx = d.x, dy = gy + d.y * s;
          if (d.k === 0) { c.fillStyle = mixC('#a16207', '#3f1d0b', night); c.beginPath(); c.ellipse(dx, dy, 6 * s, 3.5 * s, 0, 0, 6.283); c.fill(); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(dx - 3 * s, dy - 2 * s, 3 * s, 1.2 * s); }
          else if (d.k === 1) { c.fillStyle = mixC('#fef3c7', '#78716c', night); c.fillRect(dx - 6 * s, dy - 1 * s, 12 * s, 2 * s); c.beginPath(); c.arc(dx - 6 * s, dy - 1.5 * s, 2 * s, 0, 6.283); c.arc(dx - 6 * s, dy + 1.5 * s, 2 * s, 0, 6.283); c.arc(dx + 6 * s, dy - 1.5 * s, 2 * s, 0, 6.283); c.arc(dx + 6 * s, dy + 1.5 * s, 2 * s, 0, 6.283); c.fill(); }
          else if (d.k === 2) { c.strokeStyle = mixC('#65a30d', '#1a2e05', night); c.lineWidth = 2 * s; c.beginPath(); c.moveTo(dx, dy); c.lineTo(dx - 3 * s, dy - 7 * s); c.moveTo(dx, dy); c.lineTo(dx + 1 * s, dy - 9 * s); c.moveTo(dx, dy); c.lineTo(dx + 4 * s, dy - 6 * s); c.stroke(); }
          else { c.fillStyle = 'rgba(120,53,15,.35)'; c.beginPath(); c.arc(dx, dy, 1.5 * s, 0, 6.283); c.arc(dx + 5 * s, dy + 2 * s, 1.2 * s, 0, 6.283); c.fill(); }
        });
        // перекати-поле
        if (weed) {
          c.save(); c.translate(weed.x, gy - 12 * s + weed.y); c.rotate(weed.r);
          c.strokeStyle = mixC('#a16207', '#422006', night); c.lineWidth = 1.5 * s;
          for (var wi = 0; wi < 7; wi++) { c.beginPath(); c.arc(0, 0, 11 * s, wi, wi + 2.2); c.stroke(); c.beginPath(); c.arc(2 * s, -1 * s, 7 * s, wi * 1.3, wi * 1.3 + 1.8); c.stroke(); }
          c.restore();
        }
        // препятствия
        obs.forEach(function (o) { if (o.type === 'cactus') drawCactus(c, o); else drawBird(c, o); });
        // пыль
        dust.forEach(function (d) { c.globalAlpha = Math.min(1, d.life * 2); c.fillStyle = '#fde68a'; c.beginPath(); c.arc(d.x + 2 * s, d.y, (2 + (1 - Math.min(1, d.life * 2)) * 3) * s, 0, 6.283); c.fill(); });
        c.globalAlpha = 1;
        items.forEach(function (o) {
          if (o.type === 'coin') {
            var ws = Math.abs(Math.cos(t * 5 + o.x * 0.02));
            var cw2 = 9 * s * Math.max(0.15, ws);
            c.fillStyle = '#b45309'; c.beginPath(); c.ellipse(o.x + 1.5 * s * (1 - ws), o.y, cw2, 9 * s, 0, 0, 6.283); c.fill();
            var cgd = c.createLinearGradient(o.x, o.y - 9 * s, o.x, o.y + 9 * s);
            cgd.addColorStop(0, '#fef08a'); cgd.addColorStop(0.5, '#facc15'); cgd.addColorStop(1, '#ca8a04');
            c.fillStyle = cgd; c.strokeStyle = '#a16207'; c.lineWidth = 1.5 * s;
            c.beginPath(); c.ellipse(o.x, o.y, cw2, 9 * s, 0, 0, 6.283); c.fill(); c.stroke();
            c.beginPath(); c.ellipse(o.x, o.y, cw2 * 0.62, 5.6 * s, 0, 0, 6.283); c.stroke();
            c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(o.x - cw2 * 0.45, o.y - 4.5 * s, 2.2 * s * ws, 9 * s);
          } else {
            var col = o.type === 'shield' ? '#7dd3fc' : '#f9a8d4';
            var oyb = o.y + Math.sin(t * 4) * 4 * s;
            var igl = c.createRadialGradient(o.x, oyb, 10 * s, o.x, oyb, 24 * s);
            igl.addColorStop(0, o.type === 'shield' ? 'rgba(125,211,252,.45)' : 'rgba(249,168,212,.45)'); igl.addColorStop(1, 'rgba(0,0,0,0)');
            c.fillStyle = igl; c.beginPath(); c.arc(o.x, oyb, 24 * s, 0, 6.283); c.fill();
            c.fillStyle = 'rgba(15,23,42,.65)'; c.strokeStyle = col; c.lineWidth = 2.5 * s;
            c.beginPath(); c.arc(o.x, oyb, 14 * s, 0, 6.283); c.fill(); c.stroke();
            c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(o.x - 4 * s, oyb - 7 * s, 5 * s, 2.5 * s, -0.4, 0, 6.283); c.fill();
            c.fillStyle = col; c.font = '900 ' + Math.round(14 * s) + 'px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
            c.fillText(o.type === 'shield' ? '◈' : '⋎', o.x, o.y + Math.sin(t * 4) * 4 * s + 1);
          }
        });
        c.globalAlpha = 1;
        // дино
        var hb = hitbox(), frame = dino.y < gy - 0.5 ? 0 : (Math.floor(dino.anim) % 2) + 1;
        if (dead) frame = 0;
        var dw = 56 * s, dh = 56 * s;
        if (hb.duck) { dw = 70 * s; dh = 34 * s; }
        c.fillStyle = 'rgba(0,0,0,.18)';
        c.beginPath(); c.ellipse(dino.x + dw * 0.45, gy + 2 * s, dw * 0.35 * Math.max(0.4, 1 - (gy - dino.y) / (200 * s)), 4 * s, 0, 0, 6.283); c.fill();
        c.imageSmoothingEnabled = false;
        c.save();
        if (dead) { c.translate(dino.x + dw / 2, dino.y - dh / 2); c.rotate(-0.4); c.translate(-(dino.x + dw / 2), -(dino.y - dh / 2)); }
        if (wingsT > 0 && !dead) {
          var fl = Math.sin(t * (dino.y < gy - 1 ? 30 : 8)) * 0.4;
          c.fillStyle = wingsT < 2 && Math.floor(t * 8) % 2 ? 'rgba(249,168,212,.4)' : '#fbcfe8';
          c.save(); c.translate(dino.x + dw * 0.35, dino.y - dh * 0.6); c.rotate(-0.6 + fl);
          c.beginPath(); c.ellipse(-10 * s, 0, 16 * s, 7 * s, 0, 0, 6.283); c.fill(); c.restore();
        }
        c.drawImage(sprite(frame), Math.round(dino.x), Math.round(dino.y - dh), Math.round(dw), Math.round(dh));
        if (shieldOn && !dead) {
          c.strokeStyle = 'rgba(125,211,252,' + (0.55 + 0.3 * Math.sin(t * 6)) + ')'; c.lineWidth = 3 * s;
          c.beginPath(); c.ellipse(dino.x + dw / 2, dino.y - dh / 2, dw * 0.72, dh * 0.7, 0, 0, 6.283); c.stroke();
        }
        if (!dead && !hb.duck && t % 3.5 < 0.12) { c.fillStyle = PAL.G; c.fillRect(Math.round(dino.x + dw * 10 / 16), Math.round(dino.y - dh + dh / 16), Math.round(dw * 2 / 16), Math.round(dh * 2 / 16)); }
        if (dead) {
          c.fillStyle = '#111'; c.font = '900 ' + Math.round(12 * s) + 'px system-ui, sans-serif';
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('×', dino.x + dw * 0.66, dino.y - dh * 0.88);
        }
        c.restore();
        // большой счёт
        c.font = '900 ' + Math.round(26 * s) + 'px system-ui, sans-serif'; c.textAlign = 'right'; c.textBaseline = 'top';
        c.fillStyle = night > 0.5 ? 'rgba(255,255,255,.85)' : 'rgba(30,27,75,.75)';
        var str = String(api.getScore()); while (str.length < 5) str = '0' + str;
        if (hiScore > 0) {
          var hs = String(hiScore); while (hs.length < 5) hs = '0' + hs;
          str = api.t('dino.hi') + ' ' + hs + '  ' + str;
        }
        c.fillText(str, W - 14 * s, 12 * s);
      }
    };
  }
};
