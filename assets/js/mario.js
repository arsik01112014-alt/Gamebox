/* Марио — платформер */
window.GAMES = window.GAMES || {};
window.GAMES.mario = {
  title: 'Марио',
  desc: 'Беги, прыгай, дойди до флага',
  hint: 'Стрелки — бег, A — прыжок (держи дольше — прыжок выше). Прыгай врагам на голову, бей блоки «?» снизу, собирай монеты и доберись до флага!',
  colors: ['#ef4444', '#f97316'],
  controls: 'platform',
  icon: '<svg viewBox="0 0 100 100"><defs><radialGradient id="marioC" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fca5a5"/><stop offset="1" stop-color="#b91c1c"/></radialGradient><linearGradient id="marioS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fef3c7"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs><path d="M14 52 C14 22 86 22 86 52 Q86 58 80 58 H20 Q14 58 14 52z" fill="url(#marioC)" stroke="#7f1d1d" stroke-width="3"/>' +
    '<circle cx="50" cy="34" r="9" fill="#fff"/><circle cx="26" cy="46" r="7" fill="#fff"/><circle cx="74" cy="46" r="7" fill="#fff"/>' +
    '<path d="M32 58 h36 v18 q0 12 -18 12 q-18 0 -18 -12z" fill="url(#marioS)" stroke="#7f1d1d" stroke-width="3"/>' +
    '<rect x="40" y="64" width="5" height="10" rx="2.5" fill="#111"/><circle cx="42" cy="66" r="1" fill="#fff"/><circle cx="57" cy="66" r="1" fill="#fff"/><path d="M22 40 q6 -8 14 -10" stroke="#fff" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/><rect x="55" y="64" width="5" height="10" rx="2.5" fill="#111"/></svg>',

  create: function (api) {
    var ROWS = 15;
    var DIFF = [
      { lives: 5, gapAdd: -1, gapCap: 3, enemyK: 0.55, espeed: 1.6, koopa: 0 },
      { lives: 3, gapAdd: 0, gapCap: 4, enemyK: 1, espeed: 2, koopa: 0.12 },
      { lives: 2, gapAdd: 0, gapCap: 4, enemyK: 1.25, espeed: 2.6, koopa: 0.4 },
      { lives: 1, gapAdd: 1, gapCap: 4, enemyK: 1.6, espeed: 3, koopa: 0.5 }
    ];
    var D = DIFF[1];
    var SOLID = { '#': 1, 'B': 1, '?': 1, 'U': 1, 'P': 1, 'S': 1 };
    var ACC = 32, AIR = 22, FRICT = 28, MAXV = 7.2, G = 58, JUMP = 22.8, MAXFALL = 19;

    // пиксельный спрайт героя 12x16
    var PAL = { R: '#e52521', S: '#ffc994', H: '#6b3a10', K: '#111', B: '#2b52d6', Y: '#ffd400', W: '#7a3d0a' };
    var STAND = [
      '...RRRRR....',
      '..RRRRRRRRR.',
      '..HHHSSKS...',
      '.HSHSSSKSSS.',
      '.HSHHSSSKSSS',
      '.HHSSSSKKKK.',
      '...SSSSSSS..',
      '..RRBRRR....',
      '.RRRBRRBRRR.',
      'RRRRBBBBRRRR',
      'SSRBYBBYBRSS',
      'SSSBBBBBBSSS',
      'SSBBBBBBBBSS',
      '..BBB..BBB..',
      '.WWW....WWW.',
      'WWWW....WWWW'
    ];
    var RUN1 = STAND.slice(0, 12).concat([
      '.BBBBBBBBB..',
      'BBBB...BBBWW',
      'WW......WWW.',
      '.WW.........'
    ]);
    var RUN2 = STAND.slice(0, 12).concat([
      '..BBBBBBB...',
      '...BBBBB....',
      '...WWWWW....',
      '...WWWW.....'
    ]);
    var JUMPS = [
      '...RRRRR..SS',
      '..RRRRRRRRSS',
      '..HHHSSKS.RR',
      '.HSHSSSKSRRR',
      '.HSHHSSSKRRR',
      '.HHSSSSKKKR.',
      '...SSSSSSRR.',
      'RRRRRBRRRB..',
      'RRRRRRBRRRB.',
      'SSRRRRBBBBY.',
      'SSS.BBYBBYB.',
      'SS.BBBBBBBB.',
      '..BBBBBBBBB.',
      '.BBBBBBBB...',
      'WWBBB.......',
      'WW..........'
    ];
    var DEAD = [
      '....RRRR....',
      '..RRRRRRRR..',
      'SSHSKSSKSHSS',
      'SSHSKSSKSHSS',
      'SSHHSSSSHHSS',
      '...SKKKKS...',
      '...SSSSSS...',
      '..RRBRRBRR..',
      '.RRRBRRBRRR.',
      'RRRRBBBBRRRR',
      'SSRBYBBYBRSS',
      'SSSBBBBBBSSS',
      'SSBBBBBBBBSS',
      '..BBB..BBB..',
      '.WWW....WWW.',
      'WWWW....WWWW'
    ];
    var MAPS = { stand: STAND, run1: RUN1, run2: RUN2, jump: JUMPS, dead: DEAD };
    var spriteCache = {};
    function sprite(name, flip) {
      var key = name + (flip ? 'f' : ''), map = MAPS[name];
      if (spriteCache[key]) return spriteCache[key];
      var cv = document.createElement('canvas'); cv.width = 12; cv.height = 16;
      var c = cv.getContext('2d');
      for (var y = 0; y < 16; y++) for (var x = 0; x < 12; x++) {
        var ch = (map[y] || '')[flip ? 11 - x : x];
        if (ch && PAL[ch]) { c.fillStyle = PAL[ch]; c.fillRect(x, y, 1, 1); }
      }
      spriteCache[key] = cv;
      return cv;
    }

    var T, OY = 0, viewW, map, L, flagX, castleX, ents0, enemies, player, camX, keys, jumpBuf, coyote, level, lives, coins,
      phase, phaseT, popups, parts, bumps, t, banner, checkpoint, flagY, tSpawn;
    var items = [], keepBig = false; // v2.0: гриб (лишний удар), звезда (неуязвимость), 1UP

    /* ---------- генерация уровня ---------- */
    function rng(seed) {
      return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        var r = Math.imul(seed ^ seed >>> 15, 1 | seed);
        r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r;
        return ((r ^ r >>> 14) >>> 0) / 4294967296;
      };
    }
    function genLevel(lv) {
      var R = rng(lv * 7919 + 13 + api.diff * 1013);
      L = 130 + lv * 25;
      var g = [];
      for (var y = 0; y < ROWS; y++) { g.push([]); for (var x = 0; x < L; x++) g[y].push(' '); }
      var ents = [];
      function ground(x) { if (x >= 0 && x < L) { g[13][x] = '#'; g[14][x] = '#'; } }
      function set(x, y, ch) { if (x >= 0 && x < L && y >= 0 && y < ROWS) g[y][x] = ch; }
      function enemy(x) { ents.push({ x: x, y: 12, type: R() < D.koopa ? 'koopa' : 'goomba' }); }
      var x = 0;
      for (; x < 14; x++) ground(x);
      set(5, 9, '?'); set(8, 9, 'B'); set(9, 9, '?'); set(10, 9, 'B');
      var maxGap = Math.max(2, Math.min(D.gapCap, 2 + Math.floor(lv / 2) + D.gapAdd));
      var enemyChance = Math.min(0.95, (0.45 + lv * 0.08) * D.enemyK);
      while (x < L - 32) {
        var r = R(), i, k;
        if (r < 0.17) { // пропасть
          var w = 2 + Math.floor(R() * (maxGap - 1));
          x += w;
          for (i = 0; i < 4; i++) ground(x++);
        } else if (r < 0.34) { // труба
          for (i = 0; i < 7; i++) ground(x + i);
          var h = 2 + (R() < 0.45 ? 1 : 0);
          for (k = 1; k <= h; k++) { set(x + 3, 13 - k, 'P'); set(x + 4, 13 - k, 'P'); }
          if (R() < enemyChance) enemy(x + 1);
          x += 7;
        } else if (r < 0.58) { // блоки
          var n = 3 + Math.floor(R() * 3);
          for (i = 0; i < n + 5; i++) ground(x + i);
          for (i = 0; i < n; i++) set(x + 2 + i, 9, R() < 0.38 ? '?' : 'B');
          if (R() < 0.5) {
            for (i = 0; i < n - 1; i++) set(x + 3 + i, 5, R() < 0.25 ? '?' : 'B');
            set(x + 3 + Math.floor((n - 1) / 2), 4, 'C');
          } else {
            for (i = 0; i < n; i++) set(x + 2 + i, 8, 'C');
          }
          if (R() < enemyChance) enemy(x + n + 2);
          if (lv > 1 && R() < enemyChance * 0.5) enemy(x + n + 3);
          x += n + 5;
        } else if (r < 0.72) { // пирамида
          var ph = 3 + Math.floor(R() * 2);
          for (i = 0; i < ph * 2 + 4; i++) ground(x + i);
          for (i = 0; i < ph; i++) for (k = 0; k <= i; k++) set(x + 1 + i, 12 - k, 'S');
          for (i = 0; i < ph; i++) for (k = 0; k < ph - i; k++) set(x + 1 + ph + i, 12 - k, 'S');
          set(x + ph, 12 - ph - 1, 'C'); set(x + ph + 1, 12 - ph - 1, 'C');
          x += ph * 2 + 4;
        } else if (r < 0.84) { // мост над пропастью
          for (i = 0; i < 2; i++) ground(x + i);
          var gw = 6 + Math.floor(R() * 2);
          var mid = x + 2 + Math.floor(gw / 2) - 1;
          set(mid - 1, 10, 'B'); set(mid, 10, '?'); set(mid + 1, 10, 'B');
          set(mid - 1, 7, 'C'); set(mid, 7, 'C'); set(mid + 1, 7, 'C');
          x += 2 + gw;
          for (i = 0; i < 4; i++) ground(x++);
        } else { // равнина с монетами и врагами
          for (i = 0; i < 12; i++) ground(x + i);
          for (i = 0; i < 5; i++) set(x + 3 + i, i === 0 || i === 4 ? 10 : 9, 'C');
          if (R() < enemyChance) enemy(x + 6);
          if (R() < enemyChance) enemy(x + 9);
          x += 12;
        }
      }
      // финальная лестница, флаг и замок
      for (; x < L; x++) ground(x);
      var sx = L - 30;
      for (i = 0; i < 8; i++) for (k = 0; k <= i; k++) set(sx + i, 12 - k, 'S');
      for (k = 0; k < 8; k++) set(sx + 8, 12 - k, 'S');
      for (i = sx - 6; i < sx; i++) { for (var yy = 0; yy < 13; yy++) if (g[yy][i] !== 'C') set(i, yy, ' '); ground(i); }
      flagX = sx + 13;
      castleX = L - 10;
      map = g; ents0 = ents;
    }

    function spawnEnemies() {
      enemies = ents0.map(function (e) {
        var k = e.type === 'koopa';
        return { type: e.type, x: e.x, y: k ? 11.7 : e.y, w: 0.85, h: k ? 1.2 : 0.85, vx: -D.espeed * (k ? 0.8 : 1) * Math.min(1.5, 1 + (level - 1) * 0.06), vy: 0, alive: true, active: false, dead: 0, flip: false };
      });
    }

    /* ---------- физика ---------- */
    function tile(tx, ty) { if (ty < 0 || ty >= ROWS || tx < 0 || tx >= L) return ' '; return map[ty][tx]; }
    function solid(tx, ty) {
      if (tx < 0 || tx >= L) return true;
      if (ty < 0 || ty >= ROWS) return false;
      return SOLID[map[ty][tx]] === 1;
    }
    function moveX(o, d) {
      o.x += d;
      var y0 = Math.floor(o.y + 0.02), y1 = Math.floor(o.y + o.h - 0.02), y;
      if (d > 0) {
        var tx = Math.floor(o.x + o.w);
        for (y = y0; y <= y1; y++) if (solid(tx, y)) { o.x = tx - o.w - 0.0001; return true; }
      } else if (d < 0) {
        var tx2 = Math.floor(o.x);
        for (y = y0; y <= y1; y++) if (solid(tx2, y)) { o.x = tx2 + 1 + 0.0001; return true; }
      }
      return false;
    }
    function moveY(o, d) {
      o.y += d;
      var x0 = Math.floor(o.x + 0.02), x1 = Math.floor(o.x + o.w - 0.02), x;
      if (d > 0) {
        var ty = Math.floor(o.y + o.h);
        for (x = x0; x <= x1; x++) if (solid(x, ty)) { o.y = ty - o.h; return { hit: true, ty: ty }; }
      } else if (d < 0) {
        var ty2 = Math.floor(o.y);
        var best = null, cx = o.x + o.w / 2;
        for (x = x0; x <= x1; x++) if (solid(x, ty2)) {
          if (best === null || Math.abs(x + 0.5 - cx) < Math.abs(best + 0.5 - cx)) best = x;
        }
        if (best !== null) { o.y = ty2 + 1; return { hit: true, tx: best, ty: ty2 }; }
      }
      return null;
    }

    function popup(x, y, text, col) { popups.push({ x: x, y: y, text: text, c: col || '#fff', life: 0.9 }); }

    function addCoin(x, y) {
      coins++; api.addScore(200); api.sound('coin');
      if (coins % 50 === 0) { lives++; api.sound('life'); popup(x, y - 1, api.t('mario.life'), '#4ade80'); }
    }

    function bumpTile(tx, ty) {
      var ch = tile(tx, ty);
      if (ch === '?') {
        map[ty][tx] = 'U';
        bumps.push({ x: tx, y: ty, t: 0 });
        var rr = Math.random(), it = null;
        if (!player.big && rr < 0.28) it = 'mush';
        else if (rr < 0.07) it = 'star';
        else if (rr < 0.12) it = 'oneup';
        else if (player.big && rr < 0.2) it = 'star';
        if (it) {
          items.push({ type: it, x: tx + 0.1, y: ty, w: 0.8, h: 0.8, vx: 0, vy: 0, rise: 0.5, ty: ty });
          api.sound('bonus');
        } else {
          parts.push({ kind: 'coin', x: tx + 0.5, y: ty - 0.5, vy: -14, life: 0.55 });
          addCoin(tx + 0.5, ty);
          popup(tx + 0.5, ty - 1, '200', '#ffd400');
        }
      } else if (ch === 'B') {
        map[ty][tx] = ' ';
        api.addScore(50); api.sound('break'); api.vibrate(20);
        for (var i = 0; i < 4; i++) {
          parts.push({ kind: 'brick', x: tx + 0.25 + (i % 2) * 0.5, y: ty + 0.25 + Math.floor(i / 2) * 0.5,
            vx: (i % 2 ? 1 : -1) * (3 + Math.random() * 2), vy: -12 + Math.floor(i / 2) * 4, life: 1.4, r: 0 });
        }
      } else {
        api.sound('move');
        if (ch === 'U') bumps.push({ x: tx, y: ty, t: 0 });
      }
      // враги на блоке погибают
      for (var e = 0; e < enemies.length; e++) {
        var en = enemies[e];
        if (en.alive && Math.abs(en.y + en.h - ty) < 0.2 && en.x + en.w > tx && en.x < tx + 1) killFlip(en);
      }
      // монета над блоком собирается
      if (tile(tx, ty - 1) === 'C') { map[ty - 1][tx] = ' '; addCoin(tx + 0.5, ty - 1); }
    }

    function killFlip(en) {
      en.alive = false; en.flip = true; en.vy = -10; en.dead = 2;
      api.addScore(100); popup(en.x + 0.4, en.y, '100');
      api.sound('stomp');
    }

    function die() {
      if (phase !== 'play') return;
      phase = 'dying'; phaseT = 0;
      player.vy = player.y > ROWS ? 0 : -17; player.vx = 0;
      api.sound('hit'); api.vibrate(250);
    }

    function respawn() {
      var sx = checkpoint;
      while (sx < L - 1 && !(map[13][sx] === '#' && map[12][sx] === ' ' && map[11][sx] === ' ')) sx++;
      player = { x: sx + 0.12, y: 0, w: 0.72, h: 0.95, vx: 0, vy: 0, onGround: false, face: 1, anim: 0, inv: 1.5, big: keepBig, star: 0 };
      keepBig = false; items = [];
      player.y = 13 - player.h - 0.001;
      camX = Math.max(0, Math.min(L - viewW, player.x - viewW * 0.35));
      spawnEnemies();
      phase = 'play'; phaseT = 0;
      jumpBuf = 0; coyote = 0;
    }

    function startLevel() {
      genLevel(level);
      checkpoint = 2;
      bumps = []; parts = []; popups = [];
      flagY = 3;
      respawn();
      player.inv = 0;
      banner = 2.0;
    }

    function layout() {
      T = Math.min(api.H / ROWS, api.W / 13);
      OY = api.H - ROWS * T;
      viewW = api.W / T;
      if (map) camX = Math.max(0, Math.min(L - viewW, camX));
    }

    /* ---------- обновление ---------- */
    function updatePlayer(h) {
      var p = player;
      var dirIn = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      if (dirIn) {
        var acc = p.onGround ? ACC : AIR;
        if (dirIn * p.vx < 0) acc *= 1.8; // разворот
        p.vx += dirIn * acc * h;
        if (Math.abs(p.vx) > MAXV) p.vx = MAXV * (p.vx > 0 ? 1 : -1);
        p.face = dirIn;
      } else if (p.onGround) {
        var f = FRICT * h;
        if (Math.abs(p.vx) <= f) p.vx = 0; else p.vx -= f * (p.vx > 0 ? 1 : -1);
      }
      // прыжок
      if (jumpBuf > 0 && (p.onGround || coyote > 0)) {
        p.vy = -JUMP - Math.abs(p.vx) * 0.25;
        p.onGround = false; coyote = 0; jumpBuf = 0;
        api.sound('jump');
      }
      var g = G;
      if (p.vy < 0 && !keys.a) g *= 2.6;
      p.vy = Math.min(MAXFALL, p.vy + g * h);

      if (moveX(p, p.vx * h)) p.vx = 0;
      if (p.x < camX) { p.x = camX; if (p.vx < 0) p.vx = 0; }
      var wasGround = p.onGround;
      p.onGround = false;
      var r = moveY(p, p.vy * h);
      if (r) {
        if (p.vy > 0) { p.onGround = true; }
        else if (p.vy < 0) { bumpTile(r.tx, r.ty); }
        p.vy = 0;
      }
      if (wasGround && !p.onGround && p.vy >= 0) coyote = 0.09;

      // монеты
      for (var yy = Math.floor(p.y); yy <= Math.floor(p.y + p.h); yy++)
        for (var xx = Math.floor(p.x); xx <= Math.floor(p.x + p.w); xx++)
          if (tile(xx, yy) === 'C') { map[yy][xx] = ' '; addCoin(xx + 0.5, yy); parts.push({ kind: 'spark', x: xx + 0.5, y: yy + 0.5, life: 0.3 }); }

      if (p.y > ROWS + 1) { p.y = ROWS + 1; die(); }
      if (p.x > L / 2 && checkpoint < L / 2) checkpoint = Math.floor(L / 2);
      if (p.x + p.w >= flagX + 0.4 && phase === 'play') {
        phase = 'flag'; phaseT = 0;
        p.x = flagX - p.w + 0.35; p.vx = 0; p.vy = 0;
        var heightBonus = Math.max(1, Math.round((13 - p.y) / 10 * 10)) * 100;
        api.addScore(heightBonus); popup(flagX + 1, p.y, String(heightBonus), '#ffd400');
        api.sound('win'); api.vibrate(60);
      }
    }

    function updateEnemies(h) {
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (!e.active) { if (e.x < camX + viewW + 2) e.active = true; else continue; }
        if (!e.alive) {
          e.dead -= h;
          if (e.flip) { e.vy += G * h; e.y += e.vy * h; }
          continue;
        }
        e.vy = Math.min(MAXFALL, e.vy + G * h);
        if (e.kickT > 0) e.kickT -= h;
        if (moveX(e, e.vx * h)) { e.vx = -e.vx; if (e.type === 'shell' && e.vx) api.sound('move'); }
        var r = moveY(e, e.vy * h);
        if (r) e.vy = 0;
        if (e.y > ROWS + 1) { e.alive = false; e.dead = 0; }
        if (e.x < camX - 6) { e.alive = false; e.dead = 0; }
        // столкновение с героем
        var p = player;
        if (phase === 'play' && p.x < e.x + e.w && p.x + p.w > e.x && p.y < e.y + e.h && p.y + p.h > e.y) {
          var stomp = p.vy > 0 && p.y + p.h - e.y < 0.55;
          if (e.type === 'shell' && !e.vx && e.kickT <= 0) { // пинок панциря
            e.vx = (e.x + e.w / 2 > p.x + p.w / 2 ? 1 : -1) * 11; e.kickT = 0.25;
            if (stomp) p.vy = -13;
            api.sound('stomp'); api.vibrate(20); api.addScore(50);
          } else if (stomp && e.kickT <= 0) {
            p.vy = keys.a ? -JUMP * 0.9 : -13;
            api.addScore(100); popup(e.x + 0.4, e.y, '100');
            api.sound('stomp'); api.vibrate(25);
            if (e.type === 'koopa') { e.type = 'shell'; e.y += e.h - 0.75; e.h = 0.75; e.vx = 0; e.kickT = 0.2; }
            else if (e.type === 'shell') { e.vx = 0; e.kickT = 0.2; }
            else { e.alive = false; e.flip = false; e.dead = 0.5; }
            for (var dd = 0; dd < 5; dd++) parts.push({ kind: 'dust', x: e.x + e.w / 2, y: e.y + e.h, vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 3, life: 0.4 });
          } else if (p.star > 0) {
            killFlip(e); api.fx.burst((e.x + e.w / 2 - camX) * T, Y(e.y), '#fde047', 10, 160);
          } else if (p.inv <= 0 && e.kickT <= 0) {
            if (p.big) { p.big = false; p.inv = 2; api.sound('break'); api.vibrate(80); api.fx.shake(5); popup(p.x + 0.4, p.y - 0.5, '-♥', '#fca5a5'); }
            else die();
          }
        }
        // летящий панцирь сбивает других врагов
        if (e.type === 'shell' && e.vx) {
          for (var o = 0; o < enemies.length; o++) {
            var en = enemies[o];
            if (en !== e && en.alive && en.active && Math.abs(en.x - e.x) < 0.9 && Math.abs(en.y + en.h - e.y - e.h) < 0.6) killFlip(en);
          }
        }
      }
      // столкновения врагов друг с другом
      for (var a = 0; a < enemies.length; a++) for (var b = a + 1; b < enemies.length; b++) {
        var A = enemies[a], B = enemies[b];
        if (!A.alive || !B.alive || !A.active || !B.active || (A.type === 'shell' && A.vx) || (B.type === 'shell' && B.vx)) continue;
        if (Math.abs(A.x - B.x) < A.w && Math.abs(A.y - B.y) < 0.5) {
          if (A.x < B.x) { A.vx = -Math.abs(A.vx); B.vx = Math.abs(B.vx); } else { A.vx = Math.abs(A.vx); B.vx = -Math.abs(B.vx); }
        }
      }
      for (var j = enemies.length - 1; j >= 0; j--) if (!enemies[j].alive && enemies[j].dead <= 0) enemies.splice(j, 1);
    }

    function updateItems(dt) {
      for (var i = items.length - 1; i >= 0; i--) {
        var it = items[i];
        if (it.rise > 0) { it.rise -= dt; it.y = it.ty - (0.5 - Math.max(0, it.rise)) / 0.5 * 0.85; if (it.rise <= 0) { it.vx = it.type === 'star' ? 4 : 3; it.vy = it.type === 'star' ? -10 : 0; } }
        else {
          var n = Math.ceil(dt / 0.01);
          for (var k = 0; k < n; k++) {
            var h = dt / n;
            it.vy = Math.min(MAXFALL, it.vy + G * 0.8 * h);
            if (moveX(it, it.vx * h)) it.vx = -it.vx;
            var r = moveY(it, it.vy * h);
            if (r && it.vy > 0) it.vy = it.type === 'star' ? -13 : 0; else if (r) it.vy = 0;
          }
        }
        if (it.y > ROWS + 1 || it.x < camX - 4) { items.splice(i, 1); continue; }
        var p = player;
        if (it.rise <= 0.25 && p.x < it.x + it.w && p.x + p.w > it.x && p.y < it.y + it.h && p.y + p.h > it.y) {
          items.splice(i, 1);
          var sx = (it.x + 0.4 - camX) * T, sy = Y(it.y);
          if (it.type === 'mush') { p.big = true; api.addScore(1000); popup(it.x + 0.4, it.y, '1000', '#f87171'); api.sound('life'); }
          else if (it.type === 'star') { p.star = 9; api.addScore(1000); popup(it.x + 0.4, it.y, '★', '#fde047'); api.sound('bonus'); api.fx.flash('#fde047', 0.2); }
          else { lives++; popup(it.x + 0.4, it.y, '1UP', '#4ade80'); api.sound('life'); }
          api.fx.burst(sx, sy, it.type === 'mush' ? '#f87171' : it.type === 'star' ? '#fde047' : '#4ade80', 14, 180);
          api.vibrate(30);
        }
      }
    }
    function drawItems(c) {
      items.forEach(function (it) {
        var x = X(it.x), y = Y(it.y), w = it.w * T, h = it.h * T;
        if (it.type === 'star') {
          c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(Math.sin(t * 6) * 0.2);
          c.fillStyle = Math.floor(t * 10) % 2 ? '#fde047' : '#facc15'; c.shadowColor = '#fde047'; c.shadowBlur = T * 0.4;
          c.beginPath(); for (var k = 0; k < 10; k++) { var rr = k % 2 ? w * 0.22 : w * 0.52, a = k * Math.PI / 5 - Math.PI / 2; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill();
          c.shadowBlur = 0; c.fillStyle = '#111'; c.fillRect(-w * 0.12, -h * 0.08, w * 0.06, h * 0.16); c.fillRect(w * 0.06, -h * 0.08, w * 0.06, h * 0.16);
          c.restore();
        } else {
          var cap = it.type === 'mush' ? '#ef4444' : '#22c55e';
          c.fillStyle = '#fef3c7'; c.fillRect(x + w * 0.25, y + h * 0.5, w * 0.5, h * 0.5);
          c.fillStyle = '#111'; c.fillRect(x + w * 0.35, y + h * 0.6, w * 0.08, h * 0.16); c.fillRect(x + w * 0.57, y + h * 0.6, w * 0.08, h * 0.16);
          c.fillStyle = cap; c.beginPath(); c.arc(x + w / 2, y + h * 0.55, w * 0.5, Math.PI, 0); c.fill();
          c.fillStyle = '#fff'; c.beginPath(); c.arc(x + w * 0.5, y + h * 0.25, w * 0.12, 0, 6.283); c.arc(x + w * 0.18, y + h * 0.42, w * 0.09, 0, 6.283); c.arc(x + w * 0.82, y + h * 0.42, w * 0.09, 0, 6.283); c.fill();
        }
      });
    }

    function updateFx(dt) {
      for (var i = parts.length - 1; i >= 0; i--) {
        var q = parts[i];
        q.life -= dt;
        if (q.kind === 'coin') { q.vy += 40 * dt; q.y += q.vy * dt; }
        else if (q.kind === 'dust') { q.x += q.vx * dt; q.y += q.vy * dt; }
        else if (q.kind === 'brick') { q.vy += G * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.r += dt * 10; }
        if (q.life <= 0) parts.splice(i, 1);
      }
      for (var j = popups.length - 1; j >= 0; j--) { popups[j].life -= dt; popups[j].y -= dt * 1.5; if (popups[j].life <= 0) popups.splice(j, 1); }
      for (var k = bumps.length - 1; k >= 0; k--) { bumps[k].t += dt; if (bumps[k].t > 0.18) bumps.splice(k, 1); }
    }

    function updateCamera(dt) {
      var target = player.x - viewW * 0.4;
      if (target > camX) camX += (target - camX) * Math.min(1, dt * 10);
      camX = Math.max(0, Math.min(L - viewW, camX));
    }

    /* ---------- отрисовка ---------- */
    function X(tx) { return Math.round((tx - camX) * T); }
    function Y(ty) { return Math.round(ty * T + OY); }

    function drawTile(c, ch, tx, ty, off) {
      var x = X(tx), y = Y(ty) + off, s = X(tx + 1) - x, sh = Y(ty + 1) - Y(ty), b = Math.max(1, Math.round(T / 16));
      switch (ch) {
        case '#':
          var top = tile(tx, ty - 1) !== '#';
          c.fillStyle = '#b4531c'; c.fillRect(x, y, s, sh);
          c.fillStyle = '#8a3a10';
          c.fillRect(x, y + sh - b * 2, s, b * 2); c.fillRect(x + s - b * 2, y, b * 2, sh);
          c.fillStyle = '#d97a3a'; c.fillRect(x + b * 3, y + sh * 0.55, b * 2, b * 2); c.fillRect(x + s * 0.6, y + sh * 0.3, b * 2, b * 2);
          if (top) {
            c.fillStyle = '#3fae2e'; c.fillRect(x, y, s, sh * 0.3);
            c.fillStyle = '#7ddc4c'; c.fillRect(x, y, s, b * 2);
            c.fillStyle = '#2f8a22'; c.fillRect(x, y + sh * 0.3 - b, s, b);
            c.fillStyle = '#3fae2e';
            for (var gb = 0; gb < 3; gb++) c.fillRect(x + s * (0.12 + gb * 0.33), y + sh * 0.3 - b, b * 2, b * 2.5);
            if (tile(tx, ty - 1) === ' ' && (tx * 13) % 7 === 2) {
              c.fillStyle = '#2f8a22'; c.fillRect(x + s * 0.48, y - sh * 0.22, b, sh * 0.22);
              c.fillStyle = ['#fde047', '#f472b6', '#fff'][tx % 3];
              c.beginPath(); c.arc(x + s * 0.5, y - sh * 0.26, sh * 0.1, 0, 6.283); c.fill();
              c.fillStyle = '#f59e0b'; c.beginPath(); c.arc(x + s * 0.5, y - sh * 0.26, sh * 0.04, 0, 6.283); c.fill();
            }
          }
          break;
        case 'B':
          c.fillStyle = '#c4581d'; c.fillRect(x, y, s, sh);
          c.fillStyle = '#5a2108';
          c.fillRect(x, y, s, b); c.fillRect(x, y + Math.round(sh / 2) - b / 2, s, b); c.fillRect(x, y + sh - b, s, b);
          c.fillRect(x + Math.round(s / 2), y, b, Math.round(sh / 2)); c.fillRect(x + Math.round(s / 4), y + Math.round(sh / 2), b, Math.round(sh / 2));
          c.fillRect(x + Math.round(s * 3 / 4), y + Math.round(sh / 2), b, Math.round(sh / 2));
          c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x, y + b, s, b);
          break;
        case '?':
          var sh2 = 0.75 + 0.25 * Math.abs(Math.sin(t * 3 + tx));
          c.fillStyle = '#7a3d0a'; c.fillRect(x, y, s, sh);
          c.fillStyle = 'rgb(' + Math.round(255 * sh2) + ',' + Math.round(190 * sh2) + ',0)'; c.fillRect(x + b, y + b, s - b * 2, sh - b * 2);
          c.fillStyle = '#7a3d0a';
          c.fillRect(x + b * 2, y + b * 2, b, b); c.fillRect(x + s - b * 3, y + b * 2, b, b);
          c.fillRect(x + b * 2, y + sh - b * 3, b, b); c.fillRect(x + s - b * 3, y + sh - b * 3, b, b);
          c.font = '900 ' + Math.round(T * 0.7) + 'px system-ui, sans-serif';
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillStyle = '#7a3d0a'; c.fillText('?', x + s / 2 + b, y + sh / 2 + b * 1.5);
          c.fillStyle = '#fff3c4'; c.fillText('?', x + s / 2, y + sh / 2 + b * 0.5);
          break;
        case 'U':
          c.fillStyle = '#4a2a0a'; c.fillRect(x, y, s, sh);
          c.fillStyle = '#9a6a3a'; c.fillRect(x + b, y + b, s - b * 2, sh - b * 2);
          c.fillStyle = '#4a2a0a';
          c.fillRect(x + b * 2, y + b * 2, b, b); c.fillRect(x + s - b * 3, y + b * 2, b, b);
          c.fillRect(x + b * 2, y + sh - b * 3, b, b); c.fillRect(x + s - b * 3, y + sh - b * 3, b, b);
          break;
        case 'S':
          c.fillStyle = '#9b4a1b'; c.fillRect(x, y, s, sh);
          c.fillStyle = '#d9894a'; c.fillRect(x, y, s, b * 2); c.fillRect(x, y, b * 2, sh);
          c.fillStyle = '#5c2a0c'; c.fillRect(x, y + sh - b * 2, s, b * 2); c.fillRect(x + s - b * 2, y, b * 2, sh);
          c.fillStyle = '#b8642c'; c.fillRect(x + b * 4, y + b * 4, s - b * 8, sh - b * 8);
          break;
        case 'P':
          var isRight = tile(tx - 1, ty) === 'P';
          var ptop = tile(tx, ty - 1) !== 'P';
          var px = isRight ? x - s : x, pw = s * 2;
          if (!isRight) {
            var g = c.createLinearGradient(px, 0, px + pw, 0);
            g.addColorStop(0, '#0f6d1f'); g.addColorStop(0.2, '#7ee26a'); g.addColorStop(0.45, '#2fb344'); g.addColorStop(1, '#0b5418');
            c.fillStyle = g;
            if (ptop) {
              c.fillRect(px - b * 2, y, pw + b * 4, sh * 0.5);
              c.fillRect(px + b, y + sh * 0.5, pw - b * 2, sh * 0.5 + 1);
              c.strokeStyle = '#063d10'; c.lineWidth = b;
              c.strokeRect(px - b * 2 + b / 2, y + b / 2, pw + b * 3, sh * 0.5 - b);
            } else {
              c.fillRect(px + b, y, pw - b * 2, sh + 1);
            }
            c.fillStyle = '#063d10';
            c.fillRect(px + b, y + (ptop ? sh * 0.5 : 0), b, sh * (ptop ? 0.5 : 1) + 1);
            c.fillRect(px + pw - b * 2, y + (ptop ? sh * 0.5 : 0), b, sh * (ptop ? 0.5 : 1) + 1);
          }
          break;
        case 'C':
          var cw = Math.abs(Math.cos(t * 4 + tx * 0.7)) * s * 0.32 + b;
          c.fillStyle = '#b07800'; c.beginPath(); c.ellipse(x + s / 2, y + sh / 2, cw + b, sh * 0.4, 0, 0, 6.283); c.fill();
          c.fillStyle = '#ffd400'; c.beginPath(); c.ellipse(x + s / 2, y + sh / 2, cw, sh * 0.36, 0, 0, 6.283); c.fill();
          c.fillStyle = '#fff6b0'; c.fillRect(x + s / 2 - b / 2, y + sh * 0.3, b, sh * 0.4);
          break;
      }
    }

    function drawGoomba(c, e) {
      var x = X(e.x), y = Y(e.y), w = e.w * T, h = e.h * T;
      c.save();
      if (e.flip) { c.translate(x + w / 2, y + h / 2); c.scale(1, -1); c.translate(-(x + w / 2), -(y + h / 2)); }
      if (!e.alive && !e.flip) { // раздавлен
        c.fillStyle = '#8b4513'; c.beginPath(); c.ellipse(x + w / 2, y + h * 0.82, w * 0.55, h * 0.2, 0, 0, 6.283); c.fill();
        c.fillStyle = '#111'; c.fillRect(x + w * 0.25, y + h * 0.78, w * 0.15, h * 0.06); c.fillRect(x + w * 0.6, y + h * 0.78, w * 0.15, h * 0.06);
        c.restore(); return;
      }
      var step = Math.floor(t * 8) % 2;
      // ноги
      c.fillStyle = '#1a1a1a';
      c.beginPath(); c.ellipse(x + w * (step ? 0.22 : 0.28), y + h * 0.9, w * 0.24, h * 0.13, 0, 0, 6.283); c.fill();
      c.beginPath(); c.ellipse(x + w * (step ? 0.72 : 0.78), y + h * 0.9, w * 0.24, h * 0.13, 0, 0, 6.283); c.fill();
      // тело
      c.fillStyle = '#f2c38a'; c.fillRect(x + w * 0.3, y + h * 0.55, w * 0.4, h * 0.3);
      c.fillStyle = '#9c4a16';
      c.beginPath(); c.moveTo(x, y + h * 0.62);
      c.quadraticCurveTo(x + w * 0.05, y - h * 0.05, x + w / 2, y);
      c.quadraticCurveTo(x + w * 0.95, y - h * 0.05, x + w, y + h * 0.62);
      c.closePath(); c.fill();
      // глаза
      c.fillStyle = '#fff';
      c.beginPath(); c.ellipse(x + w * 0.33, y + h * 0.36, w * 0.11, h * 0.15, 0, 0, 6.283); c.fill();
      c.beginPath(); c.ellipse(x + w * 0.67, y + h * 0.36, w * 0.11, h * 0.15, 0, 0, 6.283); c.fill();
      c.fillStyle = '#111';
      c.beginPath(); c.arc(x + w * 0.36, y + h * 0.4, w * 0.055, 0, 6.283); c.fill();
      c.beginPath(); c.arc(x + w * 0.64, y + h * 0.4, w * 0.055, 0, 6.283); c.fill();
      c.strokeStyle = '#111'; c.lineWidth = Math.max(1.5, T / 14);
      c.beginPath(); c.moveTo(x + w * 0.2, y + h * 0.2); c.lineTo(x + w * 0.42, y + h * 0.28);
      c.moveTo(x + w * 0.8, y + h * 0.2); c.lineTo(x + w * 0.58, y + h * 0.28); c.stroke();
      c.restore();
    }

    function drawKoopa(c, e) {
      var x = X(e.x), y = Y(e.y), w = e.w * T, h = e.h * T;
      c.save();
      if (e.flip) { c.translate(x + w / 2, y + h / 2); c.scale(1, -1); c.translate(-(x + w / 2), -(y + h / 2)); }
      var face = e.vx > 0 ? 1 : -1;
      if (e.type === 'koopa') {
        var st = Math.floor(t * 8) % 2;
        // голова и ноги
        c.fillStyle = '#fde68a';
        c.beginPath(); c.ellipse(x + w / 2 + face * w * 0.38, y + h * 0.22, w * 0.22, h * 0.17, 0, 0, 6.283); c.fill();
        c.fillStyle = '#111'; c.beginPath(); c.arc(x + w / 2 + face * w * 0.45, y + h * 0.18, w * 0.05, 0, 6.283); c.fill();
        c.fillStyle = '#fde68a';
        c.fillRect(x + w * (st ? 0.15 : 0.22), y + h * 0.8, w * 0.22, h * 0.2);
        c.fillRect(x + w * (st ? 0.62 : 0.55), y + h * 0.8, w * 0.22, h * 0.2);
        drawShell(c, x, y + h * 0.3, w, h * 0.55);
      } else {
        drawShell(c, x, y, w, h);
        if (e.vx) { c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - face * w * 0.2, y + h * 0.3); c.lineTo(x - face * w * 0.6, y + h * 0.3); c.moveTo(x - face * w * 0.1, y + h * 0.7); c.lineTo(x - face * w * 0.5, y + h * 0.7); c.stroke(); }
      }
      c.restore();
    }
    function drawShell(c, x, y, w, h) {
      var g = c.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, '#4ade80'); g.addColorStop(1, '#15803d');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(x, y + h); c.quadraticCurveTo(x, y, x + w / 2, y); c.quadraticCurveTo(x + w, y, x + w, y + h); c.closePath(); c.fill();
      c.strokeStyle = '#14532d'; c.lineWidth = Math.max(1.5, T / 18); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.55)';
      c.beginPath(); c.moveTo(x + w * 0.5, y + h * 0.15); c.lineTo(x + w * 0.5, y + h * 0.85); c.moveTo(x + w * 0.2, y + h * 0.55); c.lineTo(x + w * 0.8, y + h * 0.55); c.stroke();
      c.fillStyle = '#fef3c7'; c.fillRect(x, y + h * 0.85, w, h * 0.15);
    }

    function drawPlayer(c) {
      var p = player;
      if (p.inv > 0 && phase === 'play' && Math.floor(t * 15) % 2) return;
      var map2;
      if (phase === 'dying') map2 = 'dead';
      else if (!p.onGround && phase === 'play') map2 = 'jump';
      else if (Math.abs(p.vx) > 0.3) map2 = ['run1', 'run2', 'stand'][Math.floor(p.anim) % 3];
      else map2 = 'stand';
      var img = sprite(map2, p.face < 0);
      var dw = T * (p.big ? 1.05 : 0.9), dh = T * (p.big ? 1.6 : 1.2);
      if (p.star > 0 && phase === 'play') {
        var sx0 = (p.x + p.w / 2 - camX) * T, sy0 = Y(p.y + p.h) - dh / 2;
        c.save(); c.globalAlpha = 0.55; c.fillStyle = ['#f43f5e', '#facc15', '#22d3ee', '#a78bfa'][Math.floor(t * 12) % 4];
        c.beginPath(); c.ellipse(sx0, sy0, dw * 0.75, dh * 0.62, 0, 0, 6.283); c.fill(); c.restore();
      }
      var x = (p.x + p.w / 2 - camX) * T - dw / 2, y = Y(p.y + p.h) - dh;
      c.imageSmoothingEnabled = false;
      c.drawImage(img, Math.round(x), Math.round(y), Math.round(dw), Math.round(dh));
    }

    /* фон: небо и облако пререндерятся в offscreen */
    var skyOff = null, skyW = 0, skyH = 0, cloudOff = null;
    function mkOff(w, h) {
      var d = Math.min(2, window.devicePixelRatio || 1), o = document.createElement('canvas');
      o.width = Math.max(1, Math.ceil(w * d)); o.height = Math.max(1, Math.ceil(h * d));
      var q = o.getContext('2d'); q.scale(d, d); o.q = q; return o;
    }
    function buildSky() {
      var W = api.W, H = api.H; skyW = W; skyH = H;
      var o = mkOff(W, H), c = o.q;
      var g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#3a78f2'); g.addColorStop(0.55, '#7fb4ff'); g.addColorStop(0.85, '#bcdcff'); g.addColorStop(1, '#e3f1ff');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      var sx = W * 0.82, sy = Math.max(T * 2.2, OY * 0.45 + T), sr = T * 0.9;
      var gl = c.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 5);
      gl.addColorStop(0, 'rgba(255,248,200,.75)'); gl.addColorStop(0.3, 'rgba(255,240,180,.25)'); gl.addColorStop(1, 'rgba(255,240,180,0)');
      c.fillStyle = gl; c.fillRect(0, 0, W, H);
      c.save(); c.translate(sx, sy); c.fillStyle = 'rgba(255,250,215,.18)';
      for (var r = 0; r < 12; r++) { c.rotate(Math.PI / 6); c.beginPath(); c.moveTo(-sr * 0.18, sr * 1.15); c.lineTo(sr * 0.18, sr * 1.15); c.lineTo(0, sr * 2.4); c.closePath(); c.fill(); }
      c.restore();
      var sg = c.createRadialGradient(sx - sr * 0.3, sy - sr * 0.3, sr * 0.1, sx, sy, sr);
      sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.5, '#fff6c4'); sg.addColorStop(1, '#ffe27a');
      c.fillStyle = sg; c.beginPath(); c.arc(sx, sy, sr, 0, 6.283); c.fill();
      // лёгкая дымка у горизонта
      var hz = c.createLinearGradient(0, OY + T * 9, 0, OY + T * 13);
      hz.addColorStop(0, 'rgba(255,255,255,0)'); hz.addColorStop(1, 'rgba(255,255,255,.35)');
      c.fillStyle = hz; c.fillRect(0, OY + T * 9, W, T * 4);
      skyOff = o;
      // облако 3.2T x 1.9T
      var cw = T * 3.2, ch = T * 1.9, co = mkOff(cw, ch), q = co.q, ox = T * 0.8, oy = T * 1.05;
      function blob(k) { q.beginPath(); q.arc(ox, oy, T * 0.6 - k, 0, 6.283); q.arc(ox + T * 0.6, oy - T * 0.35, T * 0.65 - k, 0, 6.283); q.arc(ox + T * 1.15, oy - T * 0.15, T * 0.55 - k, 0, 6.283); q.arc(ox + T * 1.6, oy, T * 0.48 - k, 0, 6.283); q.rect(ox, oy, T * 1.6, T * 0.48 - k); }
      blob(0); q.fillStyle = '#7aaae8'; q.fill();
      blob(1.6); var cg = q.createLinearGradient(0, oy - T, 0, oy + T * 0.6);
      cg.addColorStop(0, '#ffffff'); cg.addColorStop(0.6, '#f4f9ff'); cg.addColorStop(1, '#cfe2fb');
      q.fillStyle = cg; q.fill();
      q.fillStyle = 'rgba(255,255,255,.95)'; q.beginPath(); q.ellipse(ox + T * 0.45, oy - T * 0.62, T * 0.22, T * 0.12, -0.4, 0, 6.283); q.fill();
      cloudOff = co;
    }
    function drawBackground(c) {
      var W = api.W, H = api.H;
      if (!skyOff || skyW !== W || skyH !== H || !cloudOff || Math.abs(cloudOff.width / Math.min(2, window.devicePixelRatio || 1) - T * 3.2) > 1) buildSky();
      c.drawImage(skyOff, 0, 0, W, H);
      // дальние облака (параллакс 0.12) — заполняют высокое небо
      var fs = camX * 0.12;
      c.fillStyle = 'rgba(255,255,255,.5)';
      for (var f = Math.floor(fs / 7) - 1; f < Math.floor((fs + viewW) / 7) + 2; f++) {
        var fx = (f * 7 + ((f * 53) % 4) - fs) * T, fy = OY * 0.25 + T * (1 + ((f * 29) % 3) * 0.9);
        c.beginPath(); c.ellipse(fx, fy, T * 1.3, T * 0.4, 0, 0, 6.283); c.ellipse(fx + T * 0.9, fy - T * 0.2, T * 0.9, T * 0.35, 0, 0, 6.283); c.fill();
        c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(fx + T * 2.2, fy + T * 0.25, T * 0.7, T * 0.18, 0, 0, 6.283); c.fill();
        c.fillStyle = 'rgba(255,255,255,.5)';
      }
      // средний ярус неба: крупные полупрозрачные облака и птицы (заполняют высокое небо)
      {
        var ms2 = camX * 0.06;
        c.globalAlpha = 0.4;
        for (var m2 = Math.floor(ms2 / 8) - 1; m2 < Math.floor((ms2 + viewW) / 8) + 2; m2++) {
          var m2x = (m2 * 8 + ((m2 * 41) % 3) - ms2) * T, m2y = Y(2.2 + ((m2 * 17) % 5) * 1.1);
          c.drawImage(cloudOff, m2x, m2y, T * 4.8, T * 2.85);
        }
        c.globalAlpha = 1;
        c.strokeStyle = 'rgba(40,70,130,.45)'; c.lineWidth = Math.max(1.2, T * 0.06); c.lineCap = 'round';
        for (var bi = 0; bi < 4; bi++) {
          var bxx = ((bi * 137 + t * (14 + bi * 3) * T / 16 - camX * T * 0.04) % (W + T * 4) + W + T * 4) % (W + T * 4) - T * 2;
          var byy = Y(2.5 + bi * 1.3) + Math.sin(t * 1.3 + bi) * T * 0.3, wf = Math.sin(t * 9 + bi * 2) * T * 0.12;
          c.beginPath(); c.moveTo(bxx - T * 0.25, byy - wf); c.quadraticCurveTo(bxx - T * 0.1, byy - T * 0.1, bxx, byy); c.quadraticCurveTo(bxx + T * 0.1, byy - T * 0.1, bxx + T * 0.25, byy - wf); c.stroke();
        }
        c.lineCap = 'butt';
      }
      // очень дальний хребет (параллакс 0.1)
      var rs = camX * 0.1, mb0 = Y(13);
      c.fillStyle = 'rgba(160,196,240,.8)';
      c.beginPath(); c.moveTo(0, mb0);
      for (var rx = -1; rx <= Math.ceil(viewW) + 2; rx++) {
        var wx = rx + Math.floor(rs), hgt = (2.5 + Math.sin(wx * 0.9) * 0.8 + Math.sin(wx * 2.3) * 0.4) * T;
        c.lineTo((wx - rs) * T, mb0 - hgt - T * 2);
      }
      c.lineTo(W, mb0); c.closePath(); c.fill();
      // дальние горы (параллакс 0.2) с освещённой и теневой гранью
      var ms = camX * 0.2;
      for (var mi = Math.floor(ms / 10) - 1; mi < Math.floor((ms + viewW) / 10) + 2; mi++) {
        var mx = (mi * 10 + 5 - ms) * T, mh = (4.5 + ((mi * 31) % 3) * 1.2) * T, mb = Y(13);
        c.fillStyle = '#93bdf2';
        c.beginPath(); c.moveTo(mx - mh * 1.1, mb); c.lineTo(mx - mh * 0.15, mb - mh); c.lineTo(mx + mh * 0.15, mb - mh); c.lineTo(mx + mh * 1.1, mb); c.fill();
        c.fillStyle = '#7aa6e2';
        c.beginPath(); c.moveTo(mx, mb - mh); c.lineTo(mx + mh * 0.15, mb - mh); c.lineTo(mx + mh * 1.1, mb); c.lineTo(mx + mh * 0.2, mb); c.closePath(); c.fill();
        c.fillStyle = '#f4f9ff';
        c.beginPath(); c.moveTo(mx - mh * 0.15, mb - mh); c.lineTo(mx + mh * 0.15, mb - mh); c.lineTo(mx + mh * 0.38, mb - mh * 0.66); c.lineTo(mx + mh * 0.18, mb - mh * 0.72); c.lineTo(mx, mb - mh * 0.62); c.lineTo(mx - mh * 0.18, mb - mh * 0.74); c.lineTo(mx - mh * 0.38, mb - mh * 0.66); c.fill();
        c.fillStyle = 'rgba(122,166,226,.45)';
        c.beginPath(); c.moveTo(mx, mb - mh); c.lineTo(mx + mh * 0.15, mb - mh); c.lineTo(mx + mh * 0.38, mb - mh * 0.66); c.lineTo(mx + mh * 0.18, mb - mh * 0.72); c.lineTo(mx, mb - mh * 0.62); c.closePath(); c.fill();
      }
      // облака (параллакс 0.3)
      var cs = camX * 0.3;
      for (var i = Math.floor(cs / 9) - 1; i < Math.floor((cs + viewW) / 9) + 2; i++) {
        var cx = (i * 9 + ((i * 37) % 5) - cs) * T, cy = Y(1.5 + ((i * 13) % 4) * 0.7) - OY * 0.5;
        c.drawImage(cloudOff, cx - T * 0.8, cy - T * 1.05, T * 3.2, T * 1.9);
      }
      // холмы (параллакс 0.5)
      var hs = camX * 0.5;
      for (var j = Math.floor(hs / 14) - 1; j < Math.floor((hs + viewW) / 14) + 2; j++) {
        var hx = (j * 14 + 2 - hs) * T, hh = (2 + (j * 7 % 3)) * T, base = Y(13);
        c.fillStyle = '#2f7d2a';
        c.beginPath(); c.moveTo(hx - hh * 1.3 - 2, base); c.quadraticCurveTo(hx, base - hh * 2 - 3, hx + hh * 1.3 + 2, base); c.fill();
        var hg = c.createLinearGradient(hx - hh, base - hh, hx + hh, base);
        hg.addColorStop(0, '#74cf5c'); hg.addColorStop(0.5, '#56b448'); hg.addColorStop(1, '#3f9a34');
        c.fillStyle = hg;
        c.beginPath(); c.moveTo(hx - hh * 1.3, base); c.quadraticCurveTo(hx, base - hh * 2, hx + hh * 1.3, base); c.fill();
        c.fillStyle = 'rgba(255,255,255,.18)';
        c.beginPath(); c.ellipse(hx - hh * 0.35, base - hh * 0.8, hh * 0.3, hh * 0.12, -0.5, 0, 6.283); c.fill();
        c.fillStyle = '#3f9a34';
        c.beginPath(); c.ellipse(hx - hh * 0.2, base - hh * 0.55, T * 0.12, T * 0.3, 0.3, 0, 6.283); c.fill();
        c.beginPath(); c.ellipse(hx + hh * 0.3, base - hh * 0.35, T * 0.12, T * 0.3, -0.3, 0, 6.283); c.fill();
        c.fillStyle = '#2f7d2a';
        c.beginPath(); c.ellipse(hx + hh * 0.05, base - hh * 0.9, T * 0.1, T * 0.24, 0.1, 0, 6.283); c.fill();
      }
    }

    function drawFlagAndCastle(c) {
      // флагшток
      var fx = X(flagX) + T / 2;
      c.fillStyle = '#d4ffd0'; c.fillRect(fx - T * 0.06, Y(2.6), T * 0.12, Y(12) - Y(2.6));
      c.fillStyle = '#1fa83a'; c.beginPath(); c.arc(fx, Y(2.4), T * 0.28, 0, 6.283); c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.moveTo(fx - T * 0.06, Y(flagY)); c.lineTo(fx - T * 1.1, Y(flagY + 0.45)); c.lineTo(fx - T * 0.06, Y(flagY + 0.9)); c.fill();
      c.fillStyle = '#1fa83a'; c.beginPath(); c.arc(fx - T * 0.45, Y(flagY + 0.45), T * 0.16, 0, 6.283); c.fill();
      // замок
      var cx = X(castleX), cy = Y(8), cw = 5 * T, ch = 5 * T;
      c.fillStyle = '#b4531c'; c.fillRect(cx, cy, cw, ch);
      c.fillRect(cx + T, cy - 2.5 * T, 3 * T, 2.5 * T);
      c.fillStyle = '#5a2108';
      for (var r = 0; r < 5; r++) for (var k = 0; k < 5; k++) c.fillRect(cx + k * T + (r % 2 ? T / 2 : 0), cy + r * T, 2, T);
      for (var r2 = 0; r2 < 5; r2++) c.fillRect(cx, cy + r2 * T, cw, 2);
      c.fillStyle = '#b4531c';
      for (var m = 0; m < 5; m++) if (m % 2 === 0) c.fillRect(cx + m * T, cy - T * 0.6, T, T * 0.6);
      for (var m2 = 0; m2 < 3; m2++) if (m2 % 2 === 0) c.fillRect(cx + T + m2 * T, cy - 3.1 * T, T, T * 0.6);
      c.fillStyle = '#111';
      c.beginPath(); c.moveTo(cx + 1.8 * T, cy + ch); c.lineTo(cx + 1.8 * T, cy + 3.2 * T); c.arc(cx + 2.5 * T, cy + 3.2 * T, 0.7 * T, Math.PI, 0); c.lineTo(cx + 3.2 * T, cy + ch); c.fill();
      c.fillRect(cx + 1.4 * T, cy - 1.8 * T, 0.5 * T, T); c.fillRect(cx + 3.1 * T, cy - 1.8 * T, 0.5 * T, T);
    }

    function hudText(c, txt, x, y, align) {
      c.textAlign = align || 'left'; c.textBaseline = 'top'; c.lineJoin = 'round';
      c.lineWidth = Math.max(3, T * 0.12); c.strokeStyle = 'rgba(0,0,0,.55)'; c.strokeText(txt, x, y);
      c.fillStyle = '#fff'; c.fillText(txt, x, y);
    }

    var self = {
      debug: function () { return { p: player, flagX: flagX, L: L, phase: phase, level: level, map: map, lives: lives }; },
      reset: function () {
        D = DIFF[api.diff];
        level = 1; lives = D.lives; coins = 0; t = 0; keys = {}; jumpBuf = 0; coyote = 0; camX = 0; map = null;
        layout();
        startLevel();
      },
      resize: function () { layout(); },
      idle: function (dt) { t += dt; },
      key: function (k, down) {
        if (k === 'up') k = 'a';
        keys[k] = down;
        if (k === 'a' && down) jumpBuf = 0.13;
      },
      input: function () { },
      update: function (dt) {
        t += dt;
        if (banner > 0) banner -= dt;
        updateFx(dt);
        if (phase === 'dying') {
          phaseT += dt;
          if (phaseT > 0.45) { player.vy += G * 0.7 * dt; player.y += player.vy * dt; }
          if (phaseT > 2.2) {
            lives--;
            if (lives <= 0) { phase = 'over'; api.gameOver(); return; }
            respawn();
          }
          return;
        }
        if (phase === 'over') return;
        if (phase === 'flag') {
          phaseT += dt;
          var p = player;
          if (p.y + p.h < 12.99) { p.y = Math.min(13 - p.h, p.y + 9 * dt); }
          flagY = Math.min(11.2, flagY + 9 * dt);
          if (phaseT > 1.0) {
            p.face = 1; p.vx = 4; p.anim += dt * 10;
            p.onGround = true;
            p.vy = Math.min(MAXFALL, p.vy + G * dt);
            moveX(p, p.vx * dt);
            var rr = moveY(p, p.vy * dt); if (rr) p.vy = 0;
          }
          if (p.x > castleX + 2) p.hidden = true;
          updateCamera(dt);
          if (phaseT > 4.2) {
            api.addScore(1000 * level);
            level++;
            keepBig = player.big;
            startLevel();
            if (level % 3 === 1) api.toast(api.t('mario.world') + ' 1-' + level + ' · ' + api.t('mario.faster'));
          }
          return;
        }
        // фиксированный подшаг физики
        jumpBuf = Math.max(0, jumpBuf - dt);
        coyote = Math.max(0, coyote - dt);
        player.inv = Math.max(0, player.inv - dt);
        if (player.star > 0) { player.star -= dt; if (Math.floor(player.star * 6) !== Math.floor((player.star + dt) * 6)) api.tone(700 + (Math.floor(player.star * 6) % 4) * 120, 0.05, 'square', 0.02); }
        updateItems(dt);
        var n = Math.ceil(dt / 0.008);
        for (var i = 0; i < n; i++) {
          var h = dt / n;
          updatePlayer(h);
          if (phase !== 'play') break;
          updateEnemies(h);
          if (phase !== 'play') break;
        }
        player.anim += Math.abs(player.vx) * dt * 1.6;
        updateCamera(dt);
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        drawBackground(c);
        var x0 = Math.max(0, Math.floor(camX) - 1), x1 = Math.min(L - 1, Math.ceil(camX + viewW) + 1);
        // деревья и заборы
        for (var dx = x0 - 2; dx <= x1; dx++) {
          var clear = tile(dx, 13) === '#' && tile(dx, 12) === ' ' && tile(dx + 1, 12) === ' ' && tile(dx + 1, 13) === '#';
          if (!clear) continue;
          var dxp = X(dx), gyp = Y(13);
          if (((dx * 7) % 17 + 17) % 17 === 3) {
            c.fillStyle = '#7c4a1e'; c.fillRect(dxp + T * 0.85, gyp - T * 1.4, T * 0.3, T * 1.4);
            c.fillStyle = '#5a3412'; c.fillRect(dxp + T * 1.03, gyp - T * 1.4, T * 0.12, T * 1.4);
            c.fillStyle = '#145c24';
            c.beginPath(); c.arc(dxp + T, gyp - T * 1.9, T * 0.75 + 2, 0, 6.283); c.arc(dxp + T * 0.5, gyp - T * 1.5, T * 0.5 + 2, 0, 6.283); c.arc(dxp + T * 1.5, gyp - T * 1.5, T * 0.5 + 2, 0, 6.283); c.fill();
            c.fillStyle = '#1f8a35';
            c.beginPath(); c.arc(dxp + T, gyp - T * 1.9, T * 0.75, 0, 6.283); c.arc(dxp + T * 0.5, gyp - T * 1.5, T * 0.5, 0, 6.283); c.arc(dxp + T * 1.5, gyp - T * 1.5, T * 0.5, 0, 6.283); c.fill();
            c.fillStyle = 'rgba(255,255,255,.15)'; c.beginPath(); c.arc(dxp + T * 0.8, gyp - T * 2.1, T * 0.3, 0, 6.283); c.fill();
            c.fillStyle = '#ef4444';
            c.beginPath(); c.arc(dxp + T * 0.7, gyp - T * 1.7, T * 0.08, 0, 6.283); c.arc(dxp + T * 1.3, gyp - T * 1.95, T * 0.08, 0, 6.283); c.fill();
          } else if (((dx * 5) % 23 + 23) % 23 === 9 && tile(dx + 2, 12) === ' ' && tile(dx + 2, 13) === '#') {
            c.fillStyle = '#f5f5f4'; c.strokeStyle = '#a8a29e'; c.lineWidth = 1;
            for (var fp = 0; fp < 4; fp++) { var fxp = dxp + fp * T * 0.7; c.fillRect(fxp, gyp - T * 0.75, T * 0.16, T * 0.75); c.strokeRect(fxp, gyp - T * 0.75, T * 0.16, T * 0.75); }
            c.fillRect(dxp, gyp - T * 0.6, T * 2.3, T * 0.1); c.fillRect(dxp, gyp - T * 0.3, T * 2.3, T * 0.1);
          }
        }
        // кусты
        for (var bx = x0; bx <= x1; bx++) {
          if (bx % 11 === 4 && tile(bx, 13) === '#' && tile(bx, 12) === ' ' && tile(bx + 1, 12) === ' ') {
            var bxp = X(bx), byp = Y(13);
            c.fillStyle = '#17641f';
            c.beginPath(); c.arc(bxp + T * 0.5, byp, T * 0.5 + 2, Math.PI, 0); c.arc(bxp + T * 1.1, byp - T * 0.15, T * 0.6 + 2, Math.PI, 0); c.arc(bxp + T * 1.7, byp, T * 0.5 + 2, Math.PI, 0); c.fill();
            c.fillStyle = '#2fa83a';
            c.beginPath(); c.arc(bxp + T * 0.5, byp, T * 0.5, Math.PI, 0); c.arc(bxp + T * 1.1, byp - T * 0.15, T * 0.6, Math.PI, 0); c.arc(bxp + T * 1.7, byp, T * 0.5, Math.PI, 0); c.fill();
            c.fillStyle = 'rgba(190,255,170,.45)';
            c.beginPath(); c.arc(bxp + T * 0.4, byp - T * 0.28, T * 0.13, 0, 6.283); c.arc(bxp + T * 1.0, byp - T * 0.5, T * 0.16, 0, 6.283); c.arc(bxp + T * 1.6, byp - T * 0.28, T * 0.12, 0, 6.283); c.fill();
          }
        }
        if (flagX - 2 < camX + viewW) drawFlagAndCastle(c);
        for (var y = 0; y < ROWS; y++) for (var x = x0; x <= x1; x++) {
          var ch = map[y][x];
          if (ch === ' ') continue;
          var off = 0;
          for (var b = 0; b < bumps.length; b++) if (bumps[b].x === x && bumps[b].y === y) off = -Math.sin(bumps[b].t / 0.18 * Math.PI) * T * 0.3;
          drawTile(c, ch, x, y, off);
        }
        // частицы
        for (var i = 0; i < parts.length; i++) {
          var q = parts[i];
          if (q.kind === 'coin') {
            c.fillStyle = '#ffd400'; c.beginPath(); c.ellipse(X(q.x), Y(q.y), T * 0.22 * Math.abs(Math.cos(t * 20)) + 2, T * 0.36, 0, 0, 6.283); c.fill();
          } else if (q.kind === 'brick') {
            c.save(); c.translate(X(q.x), Y(q.y)); c.rotate(q.r);
            c.fillStyle = '#c4581d'; c.fillRect(-T * 0.2, -T * 0.2, T * 0.4, T * 0.4);
            c.fillStyle = '#5a2108'; c.fillRect(-T * 0.2, -T * 0.02, T * 0.4, T * 0.05);
            c.restore();
          } else if (q.kind === 'dust') {
            c.fillStyle = 'rgba(255,255,255,' + q.life * 1.5 + ')';
            c.beginPath(); c.arc(X(q.x), Y(q.y), T * 0.12 * (1.4 - q.life), 0, 6.283); c.fill();
          } else if (q.kind === 'spark') {
            c.strokeStyle = 'rgba(255,240,150,' + (q.life / 0.3) + ')'; c.lineWidth = 2;
            var rr = (0.3 - q.life) * T * 3;
            c.beginPath(); c.arc(X(q.x), Y(q.y), rr, 0, 6.283); c.stroke();
          }
        }
        for (var e = 0; e < enemies.length; e++) if (enemies[e].active) { if (enemies[e].type === 'goomba') drawGoomba(c, enemies[e]); else drawKoopa(c, enemies[e]); }
        drawItems(c);
        if (!player.hidden) drawPlayer(c);
        // всплывающие очки
        c.font = '900 ' + Math.round(T * 0.5) + 'px system-ui, sans-serif';
        for (var pp = 0; pp < popups.length; pp++) {
          var po = popups[pp];
          c.globalAlpha = Math.min(1, po.life * 2);
          hudText(c, po.text, X(po.x), Y(po.y), 'center');
          c.globalAlpha = 1;
        }
        // HUD
        c.font = '800 ' + Math.round(Math.max(15, T * 0.55)) + 'px system-ui, sans-serif';
        var pad = 10;
        hudText(c, '❤ ' + lives + (player.big ? ' 🍄' : '') + (player.star > 0 ? ' ★' + Math.ceil(player.star) : ''), pad, pad);
        var fsz = Math.round(Math.max(15, T * 0.55));
        c.fillStyle = '#b07800'; c.beginPath(); c.ellipse(W / 2 - fsz * 0.9, pad + fsz * 0.55, fsz * 0.36, fsz * 0.5, 0, 0, 6.283); c.fill();
        c.fillStyle = '#ffd400'; c.beginPath(); c.ellipse(W / 2 - fsz * 0.9, pad + fsz * 0.55, fsz * 0.28, fsz * 0.42, 0, 0, 6.283); c.fill();
        hudText(c, '× ' + coins, W / 2 - fsz * 0.4, pad, 'left');
        hudText(c, api.t('mario.world') + ' 1-' + level, W - pad, pad, 'right');
        if (banner > 0) {
          c.fillStyle = 'rgba(0,0,0,' + Math.min(0.55, banner * 0.5) + ')';
          c.fillRect(0, H * 0.32, W, H * 0.16);
          c.globalAlpha = Math.min(1, banner * 1.5);
          c.font = '900 ' + Math.round(T * 1.1) + 'px system-ui, sans-serif';
          hudText(c, api.t('mario.world') + ' 1-' + level, W / 2, H * 0.35, 'center');
          c.font = '700 ' + Math.round(T * 0.5) + 'px system-ui, sans-serif';
          hudText(c, '❤ × ' + lives, W / 2, H * 0.35 + T * 1.3, 'center');
          c.globalAlpha = 1;
        }
      }
    };
    return self;
  }
};
