/* Башенная защита: строй и улучшай башни на площадках вдоль извилистой дороги, отбивай волны врагов */
window.GAMES = window.GAMES || {};
window.GAMES.towerdef = {
  title: 'Защита башнями',
  desc: 'Строй башни и сдержи волны врагов',
  hint: 'Нажми на каменную площадку, чтобы построить башню: лазер (бьёт и летающих), пушка (мощный выстрел), мороз (замедляет всех вокруг) или миномёт (урон по площади). Нажми на башню — улучшить или продать. Пушка и миномёт не достают летающих. «Следующая волна» раньше таймера — бонусное золото. Кнопка 2× ускоряет игру. Очки: убийства, пройденные волны и оставшиеся жизни.',
  d0: '12 волн, много золота и жизней, слабые враги',
  d1: '15 волн, обычные враги',
  d2: '18 волн, враги крепче, меньше жизней',
  d3: '20 волн, очень крепкие враги, 10 жизней',
  colors: ['#65a30d', '#1c1917'],
  controls: 'none',
  isNew4: true,
  cat: 'arcade',
  medals: [2500, 8000, 14000],
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="towerdefG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#84cc16"/><stop offset="1" stop-color="#3f6212"/></linearGradient>' +
    '<linearGradient id="towerdefS" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e7e5e4"/><stop offset="1" stop-color="#57534e"/></linearGradient>' +
    '<radialGradient id="towerdefL" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#67e8f9"/><stop offset="1" stop-color="#0891b2" stop-opacity="0"/></radialGradient></defs>' +
    '<rect x="4" y="4" width="92" height="92" rx="18" fill="url(#towerdefG)"/>' +
    '<path d="M4 30 H62 V62 H30 V96" fill="none" stroke="#78350f" stroke-width="20" stroke-linejoin="round"/>' +
    '<path d="M4 30 H62 V62 H30 V96" fill="none" stroke="#b45309" stroke-width="14" stroke-linejoin="round"/>' +
    '<circle cx="20" cy="30" r="2" fill="#78716c"/><circle cx="58" cy="44" r="2.5" fill="#78716c"/><circle cx="36" cy="80" r="2" fill="#78716c"/>' +
    '<circle cx="80" cy="76" r="15" fill="#292524" opacity=".4"/><circle cx="78" cy="74" r="14" fill="url(#towerdefS)"/><circle cx="78" cy="74" r="9" fill="#44403c"/>' +
    '<path d="M78 74 L56 60" stroke="#1c1917" stroke-width="7" stroke-linecap="round"/><path d="M78 74 L56 60" stroke="#57534e" stroke-width="3" stroke-linecap="round"/>' +
    '<circle cx="80" cy="22" r="11" fill="#1e3a8a" opacity=".35"/><circle cx="78" cy="20" r="10" fill="url(#towerdefS)"/><circle cx="78" cy="20" r="5" fill="#0e7490"/>' +
    '<path d="M74 22 L44 32" stroke="url(#towerdefL)" stroke-width="5"/><path d="M74 22 L44 32" stroke="#ecfeff" stroke-width="1.5"/>' +
    '<circle cx="40" cy="32" r="7" fill="#16a34a"/><circle cx="40" cy="28" r="5" fill="#22c55e"/><circle cx="38" cy="27" r="1.3" fill="#fff"/><circle cx="42" cy="27" r="1.3" fill="#fff"/>' +
    '<rect x="33" y="21" width="14" height="2.5" rx="1" fill="#dc2626"/></svg>',

  create: function (api) {
    var COLS = 8, ROWS = 14, PI = Math.PI;
    var PATH = [[1, -1.2], [1, 2], [6, 2], [6, 5], [1, 5], [1, 8], [6, 8], [6, 11], [3, 11], [3, 14.8]];
    var SPOTS = [[0, 1], [3, 1], [5, 1], [7, 3], [2, 3], [4, 4], [0, 6], [3, 6], [5, 7], [7, 6], [4, 9], [2, 10], [5, 10], [7, 10], [2, 12], [1, 13], [5, 12]];
    var TT = {
      laser: { cost: 70, col: '#22d3ee', range: [2.2, 2.45, 2.75], dps: [15, 28, 50], air: true },
      cannon: { cost: 90, col: '#f97316', range: [2.0, 2.2, 2.4], dmg: [26, 48, 85], rate: [1.0, 0.9, 0.8], air: false },
      frost: { cost: 80, col: '#93c5fd', range: [1.7, 1.9, 2.15], slow: [0.4, 0.5, 0.6], dmg: [3, 6, 11], rate: [1.2, 1.1, 1.0], air: true },
      mortar: { cost: 120, col: '#facc15', range: [2.8, 3.1, 3.45], dmg: [18, 34, 60], splash: [0.9, 1.0, 1.15], rate: [1.7, 1.6, 1.45], air: false }
    };
    var TORD = ['laser', 'cannon', 'frost', 'mortar'];
    var ET = {
      grunt: { hp: 34, spd: 1.0, armor: 0, gold: 5, lives: 1, sz: 0.34, pts: 10 },
      fast: { hp: 20, spd: 1.85, armor: 0, gold: 4, lives: 1, sz: 0.3, pts: 10 },
      armored: { hp: 80, spd: 0.7, armor: 5, gold: 9, lives: 1, sz: 0.38, pts: 15 },
      flyer: { hp: 28, spd: 1.25, armor: 0, gold: 6, lives: 1, sz: 0.32, pts: 12, fly: true },
      boss: { hp: 420, spd: 0.5, armor: 3, gold: 80, lives: 5, sz: 0.6, pts: 150 }
    };
    var DIFF = [
      { waves: 12, gold: 260, lives: 25, hp: 0.75 },
      { waves: 15, gold: 220, lives: 20, hp: 1.1 },
      { waves: 18, gold: 210, lives: 15, hp: 1.2 },
      { waves: 20, gold: 200, lives: 10, hp: 1.36 }];
    var D, gold, lives, wave, phase, countdown, spawnQ, spawnT, enemies, towers, shots, parts, decals, sel, speed, kills, endT, t, simT, built, coinSnd;
    var TS = 40, MX = 0, MY = 44, TOPH = 44, BOTH = 70, layout = '', mapC = null, spr = null, segs = [], pathLen = 0, btns = [];

    // ---------- путь ----------
    (function () {
      pathLen = 0;
      for (var i = 0; i < PATH.length - 1; i++) {
        var a = PATH[i], b = PATH[i + 1], l = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
        segs.push({ x: a[0] + 0.5, y: a[1] + 0.5, dx: Math.sign(b[0] - a[0]), dy: Math.sign(b[1] - a[1]), l: l, s: pathLen });
        pathLen += l;
      }
    })();
    function posAt(d) {
      for (var i = 0; i < segs.length; i++) {
        var s = segs[i];
        if (d <= s.s + s.l || i === segs.length - 1) { var u = d - s.s; return { x: s.x + s.dx * u, y: s.y + s.dy * u, dx: s.dx, dy: s.dy }; }
      }
    }
    function isPath(x, y) {
      for (var i = 0; i < PATH.length - 1; i++) {
        var a = PATH[i], b = PATH[i + 1];
        if (a[0] === b[0] && x === a[0] && y >= Math.min(a[1], b[1]) - 0.01 && y <= Math.max(a[1], b[1]) + 0.01) return true;
        if (a[1] === b[1] && y === a[1] && x >= Math.min(a[0], b[0]) && x <= Math.max(a[0], b[0])) return true;
      }
      return false;
    }
    function spotAt(x, y) { for (var i = 0; i < SPOTS.length; i++) if (SPOTS[i][0] === x && SPOTS[i][1] === y) return i; return -1; }

    // ---------- волны ----------
    function makeWave(n) {
      var q = [], c = 5 + Math.floor(n * 1.6), k = (n - 1) % 5, i;
      function add(type, cnt, gap) { for (i = 0; i < Math.max(1, Math.round(cnt)); i++) q.push({ type: type, gap: gap }); }
      if (k === 0) { add('grunt', c, 0.8); if (n > 5) add('armored', Math.floor(n / 3), 1.2); }
      else if (k === 1) { add('grunt', c / 2, 0.7); add('fast', c, 0.42); }
      else if (k === 2) { add('armored', Math.ceil(c / 2), 1.1); add('grunt', c / 2, 0.7); }
      else if (k === 3) { add('flyer', c, 0.7); if (n > 5) add('fast', c / 2, 0.45); }
      else { add('grunt', c / 2, 0.6); add('boss', 1 + Math.floor(n / 10), 2.4); add('fast', c / 3, 0.5); if (n > 9) add('flyer', c / 3, 0.6); }
      return q;
    }
    function hpMul(n) { return D.hp * (1 + 0.15 * (n - 1) + 0.012 * (n - 1) * (n - 1)); }
    function startWave() {
      if (phase !== 'build') return;
      wave++; phase = 'wave'; spawnQ = makeWave(wave); spawnT = 0.3;
      api.sound('rotate'); api.tone(220, 0.25, 'sawtooth', 0.05);
      if ((wave - 1) % 5 === 4) { api.toast(api.t('td.boss')); api.vibrate(60); }
    }
    function waveClear() {
      var bonus = 20 + wave * 4;
      gold += bonus; api.addScore(50 * wave);
      if (wave >= D.waves) {
        phase = 'won'; endT = 2.6; api.addScore(lives * 40);
        api.sound('win'); api.fx.confetti(90); api.toast(api.t('td.victory'));
        return;
      }
      phase = 'build'; countdown = 14;
      api.sound('bonus'); api.fx.text(api.W / 2, api.H * 0.42, api.t('td.cleared') + ' +' + bonus, '#fde047', 22);
    }
    function spawn(type) {
      var et = ET[type], m = hpMul(wave), hp = Math.round(et.hp * m);
      enemies.push({ type: type, hp: hp, max: hp, spd: et.spd * (0.95 + Math.random() * 0.1), armor: et.armor + (type !== 'flyer' && et.armor ? Math.floor(wave / 6) : 0), d: 0, slow: 0, slowT: 0, fly: !!et.fly,
        walk: Math.random(), x: 0, y: 0, face: 1, hit: 0, gold: et.gold, lives: et.lives, sz: et.sz, pts: et.pts, off: (Math.random() - 0.5) * 0.25, bob: Math.random() * 6 });
    }

    // ---------- бой ----------
    function hurt(e, dmg, laser) {
      if (e.dead) return;
      if (!laser) dmg = Math.max(dmg * 0.25, dmg - e.armor); else dmg *= Math.max(0.4, 1 - e.armor * 0.06);
      e.hp -= dmg; e.hit = 0.08;
      if (e.hp <= 0) kill(e);
    }
    function kill(e) {
      e.dead = true; kills++; gold += e.gold; api.addScore(e.pts);
      var p = scr(e.x, e.y);
      if (e.gold >= 9) api.fx.text(p.x, p.y - TS * 0.4, '+' + e.gold, '#fde047', 13);
      burst(e.x, e.y - (e.fly ? 0.35 : 0.1), e.type === 'boss' ? 30 : 12, e.type === 'flyer' ? '#c084fc' : e.type === 'armored' ? '#cbd5e1' : e.type === 'fast' ? '#fb923c' : '#86efac', e.type === 'boss' ? 2.2 : 1.3);
      if (e.type === 'boss') { api.fx.shake(8); api.sound('win'); api.vibrate(70); }
      else if (coinSnd <= 0) { api.sound('coin'); coinSnd = 0.08; }
    }
    function burst(x, y, n, col, sp) {
      if (api.quality === 0) n = Math.ceil(n / 2);
      for (var i = 0; i < n && parts.length < 260; i++) {
        var a = Math.random() * 6.283, v = (sp || 1) * (0.4 + Math.random());
        parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.6, g: 3, life: 0.35 + Math.random() * 0.4, max: 0.75, col: col, r: 0.04 + Math.random() * 0.05 });
      }
    }
    function boom(x, y, rad) {
      if (api.quality === 0) { burst(x, y, 8, '#fb923c', 2); return; }
      parts.push({ x: x, y: y, vx: 0, vy: 0, g: 0, life: 0.35, max: 0.35, ring: rad, col: '#fde68a' });
      for (var i = 0; i < 14 && parts.length < 260; i++) {
        var a = Math.random() * 6.283, v = 0.6 + Math.random() * 1.6;
        parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - 0.4, g: 1.2, life: 0.3 + Math.random() * 0.35, max: 0.65, col: i % 3 ? '#f97316' : '#fde047', r: 0.06 + Math.random() * 0.07 });
      }
      for (i = 0; i < 5; i++) parts.push({ x: x + (Math.random() - 0.5) * 0.4, y: y + (Math.random() - 0.5) * 0.3, vx: (Math.random() - 0.5) * 0.3, vy: -0.4 - Math.random() * 0.3, g: 0, life: 0.8 + Math.random() * 0.5, max: 1.3, col: 'smoke', r: 0.16 + Math.random() * 0.12 });
      if (decals.length > 18) decals.shift();
      decals.push({ x: x, y: y, r: rad * 0.55, a: 1 });
    }
    function inRange(tw, e, r) { var dx = e.x - tw.x, dy = e.y - tw.y; return dx * dx + dy * dy <= r * r; }
    function findTarget(tw, r, air) {
      var best = null;
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (e.dead || e.d < 0.6 || (e.fly && !air)) continue;
        if (inRange(tw, e, r) && (!best || e.d > best.d)) best = e;
      }
      return best;
    }
    function towerStep(tw, h) {
      var T = TT[tw.type], L = tw.lvl, r = T.range[L], tg;
      if (tw.recoil > 0) tw.recoil = Math.max(0, tw.recoil - h * 5);
      if (tw.cd > 0) tw.cd -= h;
      if (tw.type === 'frost') {
        tw.ang += h * 0.8;
        if (tw.cd <= 0) {
          var any = false;
          for (var i = 0; i < enemies.length; i++) {
            var e = enemies[i];
            if (!e.dead && e.d > 0.6 && inRange(tw, e, r)) { any = true; e.slow = Math.max(e.slow, T.slow[L]); e.slowT = 1.6; hurt(e, T.dmg[L]); }
          }
          if (any) { tw.cd = T.rate[L]; tw.pulse = 1; api.tone(1300 + Math.random() * 200, 0.08, 'sine', 0.025); }
        }
        if (tw.pulse > 0) tw.pulse = Math.max(0, tw.pulse - h * 2.2);
        return;
      }
      tg = findTarget(tw, r, T.air);
      if (tw.type === 'laser') {
        if (tg) {
          if (tw.beam !== tg) api.tone(900, 0.05, 'sawtooth', 0.02);
          tw.beam = tg; aim(tw, tg, h, 14); hurt(tg, T.dps[L] * h, true); tw.heat = Math.min(1, tw.heat + h * 4);
        } else { tw.beam = null; tw.heat = Math.max(0, tw.heat - h * 3); }
        return;
      }
      if (!tg) return;
      aim(tw, tg, h, 7);
      if (tw.cd <= 0) {
        tw.cd = T.rate[L]; tw.recoil = 1;
        var bx = tw.x + Math.cos(tw.ang) * 0.4, by = tw.y + Math.sin(tw.ang) * 0.4;
        if (tw.type === 'cannon') {
          shots.push({ k: 'ball', x: bx, y: by, tg: tg, dmg: T.dmg[L], spd: 8, lvl: L });
          api.tone(110, 0.08, 'square', 0.05);
          burst(bx, by, 3, '#e5e7eb', 0.6);
        } else {
          var fl = 0.9, fp = posAt(Math.min(pathLen, tg.d + tg.spd * (tg.slowT > 0 ? 1 - tg.slow : 1) * fl));
          shots.push({ k: 'shell', x0: bx, y0: by, x1: fp.x + tg.off * 0.5, y1: fp.y, t: 0, T: fl, dmg: T.dmg[L], sp: T.splash[L] });
          api.tone(70, 0.12, 'triangle', 0.07);
        }
      }
    }
    function aim(tw, tg, h, k) {
      var want = Math.atan2(tg.y - tw.y, tg.x - tw.x), d = want - tw.ang;
      while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI;
      tw.ang += d * Math.min(1, h * k);
    }
    function sim(h) {
      var i;
      if (coinSnd > 0) coinSnd -= h;
      if (phase === 'build') { countdown -= h; if (countdown <= 0) startWave(); }
      else if (phase === 'wave') {
        if (spawnQ.length) { spawnT -= h; if (spawnT <= 0) { var it = spawnQ.shift(); spawn(it.type); spawnT = it.gap; } }
        else if (!enemies.length) waveClear();
      }
      // враги
      for (i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (e.slowT > 0) { e.slowT -= h; if (e.slowT <= 0) e.slow = 0; }
        var v = e.spd * (1 - e.slow);
        e.d += v * h; e.walk += v * h * 1.6; if (e.hit > 0) e.hit -= h;
        var p = posAt(e.d), ox = -p.dy * e.off, oy = p.dx * e.off;
        e.x = p.x + ox; e.y = p.y + oy; if (p.dx) e.face = p.dx;
        if (e.d >= pathLen - 0.2 && !e.dead) {
          e.dead = true; e.leaked = true; lives = Math.max(0, lives - e.lives);
          api.sound('hit'); api.vibrate(40); api.fx.flash('#ef4444', 0.18);
          if (lives <= 0 && phase !== 'lost') { phase = 'lost'; endT = 2; api.sound('over'); api.fx.shake(10); }
        }
      }
      // башни
      for (var k in towers) towerStep(towers[k], h);
      // снаряды
      for (i = shots.length - 1; i >= 0; i--) {
        var s = shots[i];
        if (s.k === 'ball') {
          var tx = s.tg.x, ty = s.tg.y - (s.tg.fly ? 0.35 : 0.12), dx = tx - s.x, dy = ty - s.y, dd = Math.sqrt(dx * dx + dy * dy), st = s.spd * h;
          if (dd <= st || s.tg.dead) {
            if (!s.tg.dead) { hurt(s.tg, s.dmg); burst(tx, ty, 5, '#fdba74', 1); api.tone(160, 0.04, 'square', 0.03); }
            shots.splice(i, 1); continue;
          }
          s.x += dx / dd * st; s.y += dy / dd * st;
        } else {
          s.t += h;
          if (s.t >= s.T) {
            for (var j = 0; j < enemies.length; j++) {
              var en = enemies[j]; if (en.dead || en.fly) continue;
              var ex = en.x - s.x1, ey = en.y - s.y1, ed = Math.sqrt(ex * ex + ey * ey);
              if (ed <= s.sp) hurt(en, s.dmg * (ed < s.sp * 0.4 ? 1 : 0.65));
            }
            boom(s.x1, s.y1, s.sp); api.tone(60, 0.2, 'sawtooth', 0.06); api.fx.shake(2);
            shots.splice(i, 1);
          }
        }
      }
      enemies = enemies.filter(function (q) { return !q.dead; });
      for (i = parts.length - 1; i >= 0; i--) {
        var pt = parts[i]; pt.life -= h; if (pt.life <= 0) { parts.splice(i, 1); continue; }
        pt.x += pt.vx * h; pt.y += pt.vy * h; pt.vy += pt.g * h;
      }
      for (i = decals.length - 1; i >= 0; i--) { decals[i].a -= h * 0.08; if (decals[i].a <= 0) decals.splice(i, 1); }
    }

    // ---------- управление ----------
    function upCost(tw) { return tw.lvl >= 2 ? 0 : Math.round(TT[tw.type].cost * (tw.lvl ? 1.25 : 0.75) / 5) * 5; }
    function sellVal(tw) { return Math.round(tw.spent * 0.7); }
    function build(si, type) {
      var T = TT[type];
      if (gold < T.cost) { api.sound('hit'); api.toast(api.t('td.noGold')); return; }
      gold -= T.cost; built++;
      towers[si] = { type: type, lvl: 0, x: SPOTS[si][0] + 0.5, y: SPOTS[si][1] + 0.5, ang: -PI / 2, cd: 0, recoil: 0, spent: T.cost, beam: null, heat: 0, pulse: 0, pop: 1 };
      api.sound('click'); api.tone(520, 0.08, 'triangle', 0.05); burst(SPOTS[si][0] + 0.5, SPOTS[si][1] + 0.6, 10, '#e7e5e4', 1);
      sel = -1;
    }
    function upgrade(si) {
      var tw = towers[si], c = upCost(tw);
      if (!c) return;
      if (gold < c) { api.sound('hit'); api.toast(api.t('td.noGold')); return; }
      gold -= c; tw.spent += c; tw.lvl++; tw.pop = 1;
      api.sound('bonus'); burst(tw.x, tw.y, 14, '#fde047', 1.4); sel = -1;
    }
    function sell(si) {
      var tw = towers[si]; gold += sellVal(tw); delete towers[si];
      api.sound('coin'); burst(SPOTS[si][0] + 0.5, SPOTS[si][1] + 0.5, 10, '#fde047', 1.2); sel = -1;
    }
    function scr(x, y) { return { x: MX + x * TS, y: MY + y * TS }; }
    function menuButtons() {
      var out = [];
      if (sel < 0) return out;
      var sp = SPOTS[sel], c = scr(sp[0] + 0.5, sp[1] + 0.5), r = Math.max(19, TS * 0.46), off = Math.max(TS * 1.05, r * 2.3);
      function clampB(x, y) { return { x: Math.max(r + 4, Math.min(api.W - r - 4, x)), y: Math.max(TOPH + r + 4, Math.min(api.H - BOTH - r - 14, y)) }; }
      if (!towers[sel]) {
        var gap = Math.min((api.W - 16) / 4, r * 2 + 30), x0 = Math.max(gap / 2 + 8, Math.min(api.W - 8 - gap * 3.5, c.x - gap * 1.5));
        var ry = c.y - TS * 0.5 - r - 26;
        if (ry < TOPH + r + 22) ry = c.y + TS * 0.5 + r + 22;
        for (var i = 0; i < 4; i++) out.push({ x: x0 + i * gap, y: ry, r: r, act: 'build', type: TORD[i], cost: TT[TORD[i]].cost });
      } else {
        var tw = towers[sel], pu = clampB(c.x, c.y - off), ps = clampB(c.x, c.y + off);
        if (Math.abs(pu.y - ps.y) < r * 2) { pu = clampB(c.x - off, c.y); ps = clampB(c.x + off, c.y); }
        out.push({ x: pu.x, y: pu.y, r: r, act: 'up', cost: upCost(tw) });
        out.push({ x: ps.x, y: ps.y, r: r, act: 'sell', cost: sellVal(tw) });
      }
      return out;
    }
    function barButtons() {
      var y = api.H - BOTH + 10, h = BOTH - 20;
      return { next: { x: 12, y: y, w: api.W - 24 - 72, h: h }, spd: { x: api.W - 12 - 62, y: y, w: 62, h: h } };
    }
    function hitRect(b, x, y) { return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }

    var self = {
      reset: function () {
        D = DIFF[api.diff] || DIFF[1];
        gold = D.gold; lives = D.lives; wave = 0; phase = 'build'; countdown = 30; spawnQ = []; spawnT = 0;
        enemies = []; towers = {}; shots = []; parts = []; decals = []; sel = -1; speed = 1; kills = 0; endT = 0; t = 0; simT = 0; built = 0; coinSnd = 0;
        api.setScore(0);
      },
      resize: function () { layout = ''; },
      idle: function (dt) { t += dt; },
      input: function (type, d) {
        if (type !== 'tap' || endT > 0) return;
        var mb = menuButtons(), i;
        for (i = 0; i < mb.length; i++) {
          var b = mb[i];
          if (Math.hypot(d.x - b.x, d.y - b.y) <= b.r + 6) {
            if (b.act === 'build') build(sel, b.type); else if (b.act === 'up') upgrade(sel); else sell(sel);
            return;
          }
        }
        var bb = barButtons();
        if (hitRect(bb.spd, d.x, d.y)) { speed = speed === 1 ? 2 : 1; api.sound('click'); return; }
        if (hitRect(bb.next, d.x, d.y)) {
          if (phase === 'build') {
            var bonus = Math.ceil(countdown * (wave === 0 ? 0 : 1.5));
            if (bonus > 0) { gold += bonus; api.fx.text(d.x, d.y - 20, '+' + bonus, '#fde047', 16); }
            startWave(); sel = -1;
          }
          return;
        }
        var tx = Math.floor((d.x - MX) / TS), ty = Math.floor((d.y - MY) / TS), si = spotAt(tx, ty);
        if (si >= 0 && si !== sel) { sel = si; api.sound('click'); } else sel = -1;
      },
      key: function (k, down) {
        if (!down) return;
        if (k === 'b' || k === 'a') { if (phase === 'build') startWave(); }
      },
      update: function (dt) {
        t += dt;
        if (endT > 0) { endT -= dt; sim(dt * 0.5); if (endT <= 0) api.gameOver(); return; }
        var sdt = dt * speed, n = Math.max(1, Math.ceil(sdt / 0.02)), h = sdt / n;
        for (var i = 0; i < n; i++) sim(h);
        simT += sdt;
        for (var k in towers) if (towers[k].pop > 0) towers[k].pop = Math.max(0, towers[k].pop - dt * 3);
      },
      draw: function (c) { draw(c); }
    };

    /* ===================== графика ===================== */
    function mkC(w, h) {
      var dpr = Math.min(2, window.devicePixelRatio || 1), cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.ceil(w * dpr)); cv.height = Math.max(1, Math.ceil(h * dpr));
      var x = cv.getContext('2d'); x.scale(dpr, dpr); return { cv: cv, x: x };
    }
    function rrect(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
    }
    function circ(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, 6.283); }
    function rg(c, x, y, r, c0, c1, ox, oy) { var g = c.createRadialGradient(x + (ox || -0.3) * r, y + (oy || -0.35) * r, r * 0.05, x, y, r); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; }

    function buildAll() {
      var W = api.W, H = api.H, i, j, x, y;
      TS = Math.floor(Math.min(W / COLS, (H - TOPH - BOTH) / ROWS));
      MX = Math.round((W - COLS * TS) / 2); MY = Math.round(TOPH + ((H - TOPH - BOTH) - ROWS * TS) / 2);
      layout = W + 'x' + H;
      var seed = 3; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      var o = mkC(W, H), c = o.x;
      // трава
      var gg = c.createLinearGradient(0, 0, 0, H); gg.addColorStop(0, '#3f7a2d'); gg.addColorStop(1, '#356a26');
      c.fillStyle = gg; c.fillRect(0, 0, W, H);
      var c0 = Math.floor(-MX / TS) - 1, c1 = Math.ceil((W - MX) / TS) + 1, r0 = Math.floor(-MY / TS) - 1, r1 = Math.ceil((H - MY) / TS) + 1;
      for (j = r0; j < r1; j++) for (i = c0; i < c1; i++) {
        c.fillStyle = (i + j) % 2 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.035)';
        c.fillRect(MX + i * TS, MY + j * TS, TS, TS);
      }
      // пятна и травинки
      for (i = 0; i < 40; i++) { var px = rnd() * W, py = rnd() * H, pr = TS * (0.6 + rnd() * 1.4); c.fillStyle = rnd() < 0.5 ? 'rgba(132,204,22,.07)' : 'rgba(20,60,10,.08)'; circ(c, px, py, pr); c.fill(); }
      c.lineCap = 'round';
      for (i = 0; i < W * H / 90; i++) {
        x = rnd() * W; y = rnd() * H; var bl = 2 + rnd() * 4;
        c.strokeStyle = rnd() < 0.5 ? 'rgba(163,230,53,.35)' : 'rgba(22,78,16,.4)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + (rnd() - 0.5) * 3, y - bl); c.stroke();
      }
      for (i = 0; i < 70; i++) { x = rnd() * W; y = rnd() * H; c.fillStyle = ['#fef9c3', '#fde047', '#f9a8d4', '#ffffff', '#c4b5fd'][Math.floor(rnd() * 5)]; for (j = 0; j < 4; j++) { circ(c, x + Math.cos(j * 1.57) * 1.6, y + Math.sin(j * 1.57) * 1.6, 1.3); c.fill(); } c.fillStyle = '#ca8a04'; circ(c, x, y, 0.9); c.fill(); }
      // дорога
      var pts = PATH.map(function (p) { return [MX + (p[0] + 0.5) * TS, MY + (p[1] + 0.5) * TS]; });
      function pathStroke(w, col, dx, dy) { c.strokeStyle = col; c.lineWidth = w; c.lineJoin = 'round'; c.lineCap = 'butt'; c.beginPath(); c.moveTo(pts[0][0] + (dx || 0), pts[0][1] + (dy || 0)); for (var k = 1; k < pts.length; k++) c.lineTo(pts[k][0] + (dx || 0), pts[k][1] + (dy || 0)); c.stroke(); }
      pathStroke(TS * 0.98, 'rgba(0,0,0,.22)', 0, TS * 0.06);
      pathStroke(TS * 0.9, '#6b4423');
      pathStroke(TS * 0.8, '#9a6b3c');
      pathStroke(TS * 0.5, 'rgba(196,148,94,.45)');
      // колеи
      c.setLineDash([TS * 0.5, TS * 0.25]);
      pathStroke(TS * 0.05, 'rgba(80,50,25,.35)', -TS * 0.18, 0); pathStroke(TS * 0.05, 'rgba(80,50,25,.35)', TS * 0.18, 0);
      c.setLineDash([]);
      // камешки и крапинки по дороге
      c.save(); c.beginPath();
      for (i = 0; i < PATH.length - 1; i++) {
        var a = pts[i], b = pts[i + 1], hw = TS * 0.4;
        c.rect(Math.min(a[0], b[0]) - hw, Math.min(a[1], b[1]) - hw, Math.abs(b[0] - a[0]) + hw * 2, Math.abs(b[1] - a[1]) + hw * 2);
      }
      c.clip();
      for (i = 0; i < 900; i++) { x = MX - TS + rnd() * (COLS + 2) * TS; y = MY - TS + rnd() * (ROWS + 2) * TS; c.fillStyle = rnd() < 0.5 ? 'rgba(60,35,15,.35)' : 'rgba(230,190,140,.3)'; c.fillRect(x, y, 1.4, 1.4); }
      for (i = 0; i < 160; i++) {
        x = MX - TS + rnd() * (COLS + 2) * TS; y = MY - TS + rnd() * (ROWS + 2) * TS; var sr = TS * (0.035 + rnd() * 0.05);
        c.fillStyle = 'rgba(40,25,10,.4)'; c.beginPath(); c.ellipse(x + 1, y + 1.5, sr, sr * 0.7, 0, 0, 6.283); c.fill();
        c.fillStyle = ['#a8a29e', '#78716c', '#d6d3d1', '#8b7355'][Math.floor(rnd() * 4)]; c.beginPath(); c.ellipse(x, y, sr, sr * 0.7, rnd() * 3, 0, 6.283); c.fill();
        c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(x - sr * 0.3, y - sr * 0.25, sr * 0.35, sr * 0.2, 0, 0, 6.283); c.fill();
      }
      c.restore();
      // травяные кромки дороги
      for (i = 0; i < PATH.length - 1; i++) {
        var A = pts[i], B = pts[i + 1], len = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / len, uy = (B[1] - A[1]) / len;
        for (var s = 0; s < len; s += 5) for (var sd = -1; sd <= 1; sd += 2) {
          var ex = A[0] + ux * s - uy * sd * TS * 0.41, ey = A[1] + uy * s + ux * sd * TS * 0.41;
          if (rnd() < 0.6) { c.strokeStyle = rnd() < 0.5 ? '#4d8c35' : '#3b7327'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex - uy * sd * -TS * 0.07 + (rnd() - 0.5) * 3, ey + ux * sd * -TS * 0.07 - 2); c.stroke(); }
        }
      }
      // вход-пещера и замок на выходе
      var en = pts[0];
      var cx0 = en[0], cy0 = MY + TS * 0.3;
      c.fillStyle = '#44403c'; c.beginPath(); c.ellipse(cx0, cy0, TS * 0.85, TS * 0.7, 0, PI, 2 * PI); c.lineTo(cx0 + TS * 0.85, cy0 + TS * 0.12); c.lineTo(cx0 - TS * 0.85, cy0 + TS * 0.12); c.fill();
      c.fillStyle = '#1c1917'; c.beginPath(); c.ellipse(cx0, cy0 + TS * 0.12, TS * 0.5, TS * 0.5, 0, PI, 2 * PI); c.fill();
      for (i = 0; i < 7; i++) { var ra = PI + i / 6 * PI; c.fillStyle = i % 2 ? '#78716c' : '#57534e'; circ(c, cx0 + Math.cos(ra) * TS * 0.68, cy0 + TS * 0.08 + Math.sin(ra) * TS * 0.6, TS * 0.16); c.fill(); }
      c.fillStyle = 'rgba(168,85,247,.25)'; circ(c, cx0, cy0, TS * 0.3); c.fill();
      var ex0 = pts[pts.length - 1][0], ey0 = MY + ROWS * TS - TS * 0.05;
      // замок
      c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(ex0 - TS * 1.05, ey0 - TS * 0.05, TS * 2.2, TS * 0.35);
      var wg = c.createLinearGradient(0, ey0 - TS * 0.7, 0, ey0 + TS * 0.3); wg.addColorStop(0, '#d6d3d1'); wg.addColorStop(1, '#78716c');
      c.fillStyle = wg; c.fillRect(ex0 - TS * 1.0, ey0 - TS * 0.55, TS * 2.0, TS * 0.85);
      for (i = 0; i < 6; i++) c.fillRect(ex0 - TS * 1.0 + i * TS * 0.36, ey0 - TS * 0.72, TS * 0.22, TS * 0.2);
      c.strokeStyle = 'rgba(68,64,60,.5)'; c.lineWidth = 1;
      for (j = 0; j < 4; j++) for (i = 0; i < 6; i++) c.strokeRect(ex0 - TS * 1.0 + i * TS * 0.34 + (j % 2) * TS * 0.17, ey0 - TS * 0.55 + j * TS * 0.21, TS * 0.34, TS * 0.21);
      c.fillStyle = '#292524'; c.beginPath(); c.moveTo(ex0 - TS * 0.32, ey0 + TS * 0.3); c.lineTo(ex0 - TS * 0.32, ey0 - TS * 0.2); c.arc(ex0, ey0 - TS * 0.2, TS * 0.32, PI, 0); c.lineTo(ex0 + TS * 0.32, ey0 + TS * 0.3); c.fill();
      c.strokeStyle = '#92400e'; c.lineWidth = 1.5; for (i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(ex0 + i * TS * 0.12, ey0 - TS * 0.4); c.lineTo(ex0 + i * TS * 0.12, ey0 + TS * 0.3); c.stroke(); }
      [[-1, '#dc2626'], [1, '#2563eb']].forEach(function (f) { var fx = ex0 + f[0] * TS * 0.75; c.strokeStyle = '#44403c'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(fx, ey0 - TS * 0.7); c.lineTo(fx, ey0 - TS * 1.2); c.stroke(); c.fillStyle = f[1]; c.beginPath(); c.moveTo(fx, ey0 - TS * 1.2); c.lineTo(fx + TS * 0.3, ey0 - TS * 1.1); c.lineTo(fx, ey0 - TS * 1.0); c.fill(); });
      // площадки
      for (i = 0; i < SPOTS.length; i++) {
        var sx = MX + (SPOTS[i][0] + 0.5) * TS, sy = MY + (SPOTS[i][1] + 0.5) * TS, pr2 = TS * 0.43;
        c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(sx + 1, sy + TS * 0.06, pr2 * 1.05, pr2 * 0.98, 0, 0, 6.283); c.fill();
        c.fillStyle = rg(c, sx, sy, pr2, '#d6d3d1', '#57534e'); circ(c, sx, sy, pr2); c.fill();
        c.strokeStyle = '#44403c'; c.lineWidth = 1.2; c.stroke();
        for (j = 0; j < 8; j++) { var ba = j * PI / 4 + 0.2; c.strokeStyle = 'rgba(68,64,60,.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(sx + Math.cos(ba) * pr2 * 0.62, sy + Math.sin(ba) * pr2 * 0.62); c.lineTo(sx + Math.cos(ba) * pr2, sy + Math.sin(ba) * pr2); c.stroke(); }
        c.strokeStyle = 'rgba(68,64,60,.6)'; circ(c, sx, sy, pr2 * 0.62); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(sx - pr2 * 0.3, sy - pr2 * 0.35, pr2 * 0.35, pr2 * 0.18, -0.5, 0, 6.283); c.fill();
      }
      // деревья, кусты, камни
      var occ = {};
      SPOTS.forEach(function (s) { occ[s[0] + ',' + s[1]] = 1; });
      var deco = [];
      for (j = r0; j < r1; j++) for (i = c0; i < c1; i++) {
        if (occ[i + ',' + j] || isPath(i, j)) continue;
        if ((j >= ROWS - 1 && Math.abs(i - 3) <= 1) || (j <= 0 && Math.abs(i - 1) <= 1)) continue;
        var near = false;
        for (var a2 = -1; a2 <= 1 && !near; a2++) for (var b2 = -1; b2 <= 1; b2++) if (isPath(i + a2, j + b2) || occ[(i + a2) + ',' + (j + b2)]) near = true;
        var rr = rnd();
        if (!near && rr < 0.75) deco.push({ k: 'tree', x: MX + (i + 0.3 + rnd() * 0.4) * TS, y: MY + (j + 0.35 + rnd() * 0.4) * TS, s: 0.75 + rnd() * 0.45 });
        else if (rr < 0.28) deco.push({ k: rnd() < 0.5 ? 'bush' : 'rock', x: MX + (i + 0.2 + rnd() * 0.6) * TS, y: MY + (j + 0.25 + rnd() * 0.6) * TS, s: 0.6 + rnd() * 0.5 });
      }
      deco.sort(function (p, q) { return p.y - q.y; });
      deco.forEach(function (d) {
        var R = TS * 0.38 * d.s;
        if (d.k === 'tree') {
          c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(d.x + R * 0.3, d.y + R * 0.75, R * 1.0, R * 0.45, 0, 0, 6.283); c.fill();
          c.fillStyle = '#5b3a1e'; c.fillRect(d.x - R * 0.13, d.y, R * 0.26, R * 0.8);
          var leaves = [[-0.45, 0.05, 0.62], [0.45, 0.05, 0.62], [0, -0.35, 0.72], [0, 0.15, 0.7]];
          leaves.forEach(function (l) { c.fillStyle = rg(c, d.x + l[0] * R, d.y + l[1] * R - R * 0.2, l[2] * R, '#65a30d', '#14532d'); circ(c, d.x + l[0] * R, d.y + l[1] * R - R * 0.2, l[2] * R); c.fill(); });
          c.fillStyle = 'rgba(190,242,100,.35)'; circ(c, d.x - R * 0.25, d.y - R * 0.75, R * 0.22); c.fill();
          if (rnd() < 0.3) { c.fillStyle = '#dc2626'; for (var q = 0; q < 3; q++) { circ(c, d.x + (rnd() - 0.5) * R, d.y - R * 0.3 + (rnd() - 0.5) * R * 0.6, R * 0.07); c.fill(); } }
        } else if (d.k === 'bush') {
          c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(d.x + 2, d.y + R * 0.4, R * 0.9, R * 0.35, 0, 0, 6.283); c.fill();
          [[-0.4, 0, 0.5], [0.4, 0, 0.5], [0, -0.2, 0.6]].forEach(function (l) { c.fillStyle = rg(c, d.x + l[0] * R, d.y + l[1] * R, l[2] * R, '#4ade80', '#166534'); circ(c, d.x + l[0] * R, d.y + l[1] * R, l[2] * R); c.fill(); });
        } else {
          c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(d.x + 2, d.y + R * 0.3, R * 0.7, R * 0.3, 0, 0, 6.283); c.fill();
          c.fillStyle = rg(c, d.x, d.y, R * 0.6, '#e7e5e4', '#57534e'); c.beginPath(); c.moveTo(d.x - R * 0.6, d.y + R * 0.25); c.lineTo(d.x - R * 0.45, d.y - R * 0.3); c.lineTo(d.x + R * 0.1, d.y - R * 0.5); c.lineTo(d.x + R * 0.6, d.y - R * 0.1); c.lineTo(d.x + R * 0.55, d.y + R * 0.3); c.closePath(); c.fill();
          c.fillStyle = 'rgba(101,163,13,.5)'; c.beginPath(); c.ellipse(d.x - R * 0.1, d.y - R * 0.38, R * 0.25, R * 0.08, 0, 0, 6.283); c.fill();
        }
      });
      // виньетка
      var vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
      mapC = o.cv;
      buildSprites();
    }

    function buildSprites() {
      spr = { base: {}, head: {}, en: {}, glow: {} };
      var S = TS, i, L;
      TORD.forEach(function (type) {
        spr.base[type] = []; spr.head[type] = [];
        var col = TT[type].col;
        for (L = 0; L < 3; L++) {
          // основание
          var o = mkC(S, S), c = o.x, cx = S / 2, cy = S / 2, R = S * 0.4;
          c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(cx + 1.5, cy + S * 0.07, R * 1.02, R * 0.95, 0, 0, 6.283); c.fill();
          var sides = 8;
          c.beginPath(); for (i = 0; i < sides; i++) { var a = i * 2 * PI / sides + PI / 8; c.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); } c.closePath();
          c.fillStyle = rg(c, cx, cy, R, L === 2 ? '#fef3c7' : '#e7e5e4', L === 2 ? '#78716c' : '#44403c'); c.fill();
          c.strokeStyle = L === 0 ? '#292524' : L === 1 ? '#94a3b8' : '#eab308'; c.lineWidth = L ? 2 : 1.2; c.stroke();
          c.strokeStyle = col; c.globalAlpha = 0.8; c.lineWidth = 2; circ(c, cx, cy, R * 0.72); c.stroke(); c.globalAlpha = 1;
          for (i = 0; i < 4; i++) { var ba = PI / 4 + i * PI / 2; c.fillStyle = L === 2 ? '#fde047' : '#a8a29e'; circ(c, cx + Math.cos(ba) * R * 0.83, cy + Math.sin(ba) * R * 0.83, S * 0.03 + L * 0.5); c.fill(); }
          spr.base[type].push(o.cv);
          // голова (смотрит вдоль +x)
          var h = mkC(S * 1.4, S * 1.4), hc = h.x, hx = S * 0.7, hy = S * 0.7, k = 1 + L * 0.12;
          if (type === 'laser') {
            hc.fillStyle = '#1f2937'; hc.fillRect(hx, hy - S * 0.07 * k, S * 0.42 * k, S * 0.14 * k);
            hc.fillStyle = '#64748b'; hc.fillRect(hx, hy - S * 0.04 * k, S * 0.4 * k, S * 0.03 * k);
            for (i = 0; i < L + 1; i++) { hc.fillStyle = col; hc.fillRect(hx + S * (0.12 + i * 0.08), hy - S * 0.075 * k, S * 0.03, S * 0.15 * k); }
            hc.fillStyle = rg(hc, hx, hy, S * 0.2 * k, '#cbd5e1', '#1e293b'); circ(hc, hx, hy, S * 0.2 * k); hc.fill();
            hc.fillStyle = rg(hc, hx, hy, S * 0.1 * k, '#ecfeff', '#0891b2', 0, 0); circ(hc, hx, hy, S * 0.1 * k); hc.fill();
            hc.fillStyle = rg(hc, hx + S * 0.43 * k, hy, S * 0.07 * k, '#ffffff', col, 0, 0); circ(hc, hx + S * 0.43 * k, hy, S * 0.065 * k); hc.fill();
          } else if (type === 'cannon') {
            var nb = L === 0 ? 1 : L === 1 ? 2 : 2, bw = S * (0.13 + L * 0.02);
            for (i = 0; i < nb; i++) {
              var oy = nb === 1 ? 0 : (i ? 1 : -1) * S * 0.09;
              var bg = hc.createLinearGradient(0, hy + oy - bw / 2, 0, hy + oy + bw / 2); bg.addColorStop(0, '#57534e'); bg.addColorStop(0.4, '#a8a29e'); bg.addColorStop(1, '#1c1917');
              hc.fillStyle = bg; hc.fillRect(hx, hy + oy - bw / 2, S * (0.42 + L * 0.04), bw);
              hc.fillStyle = '#1c1917'; hc.fillRect(hx + S * (0.38 + L * 0.04), hy + oy - bw / 2 - 1, S * 0.07, bw + 2);
              if (L === 2) { hc.fillStyle = '#ca8a04'; hc.fillRect(hx + S * 0.2, hy + oy - bw / 2 - 0.5, S * 0.04, bw + 1); }
            }
            hc.fillStyle = rg(hc, hx, hy, S * 0.23 * k, '#a8a29e', '#1c1917'); circ(hc, hx, hy, S * 0.23 * k); hc.fill();
            hc.strokeStyle = col; hc.lineWidth = 1.5; circ(hc, hx, hy, S * 0.16 * k); hc.stroke();
            hc.fillStyle = 'rgba(255,255,255,.35)'; circ(hc, hx - S * 0.07, hy - S * 0.08, S * 0.06); hc.fill();
          } else if (type === 'frost') {
            var n = 5 + L * 2;
            for (i = 0; i < n; i++) {
              var fa = i * 2 * PI / n, fl = S * (0.2 + (i % 2) * 0.08 + L * 0.03), fw = S * 0.06;
              hc.save(); hc.translate(hx, hy); hc.rotate(fa);
              hc.fillStyle = i % 2 ? '#bfdbfe' : '#60a5fa'; hc.beginPath(); hc.moveTo(0, -fw); hc.lineTo(fl, 0); hc.lineTo(0, fw); hc.closePath(); hc.fill();
              hc.fillStyle = 'rgba(255,255,255,.7)'; hc.beginPath(); hc.moveTo(0, -fw * 0.4); hc.lineTo(fl * 0.85, 0); hc.lineTo(0, 0); hc.closePath(); hc.fill();
              hc.restore();
            }
            hc.fillStyle = rg(hc, hx, hy, S * 0.14, '#ffffff', '#3b82f6'); circ(hc, hx, hy, S * 0.13); hc.fill();
          } else {
            hc.fillStyle = rg(hc, hx, hy, S * 0.26 * k, '#a8a29e', '#292524'); circ(hc, hx, hy, S * 0.26 * k); hc.fill();
            var mg = hc.createLinearGradient(0, hy - S * 0.13, 0, hy + S * 0.13); mg.addColorStop(0, '#78716c'); mg.addColorStop(0.5, '#d6d3d1'); mg.addColorStop(1, '#292524');
            hc.fillStyle = mg; hc.fillRect(hx, hy - S * 0.12 * k, S * 0.26 * k, S * 0.24 * k);
            hc.fillStyle = '#0c0a09'; hc.beginPath(); hc.ellipse(hx + S * 0.26 * k, hy, S * 0.05, S * 0.11 * k, 0, 0, 6.283); hc.fill();
            hc.strokeStyle = col; hc.lineWidth = 2; hc.beginPath(); hc.moveTo(hx + S * 0.12, hy - S * 0.12 * k); hc.lineTo(hx + S * 0.12, hy + S * 0.12 * k); hc.stroke();
            if (L > 0) { hc.fillStyle = '#facc15'; circ(hc, hx - S * 0.1, hy, S * 0.04 + L); hc.fill(); }
          }
          spr.head[type].push(h.cv);
        }
      });
      // враги: 4 кадра, вид сбоку, смотрят вправо
      ['grunt', 'fast', 'armored', 'flyer', 'boss'].forEach(function (type) {
        var sz = ET[type].sz * S * 2.6, fr = [];
        for (var f = 0; f < 4; f++) { var o = mkC(sz, sz), c = o.x; drawEnemyArt(c, type, sz / 2, sz / 2, ET[type].sz * S, f); fr.push(o.cv); }
        spr.en[type] = { fr: fr, sz: sz };
      });
    }
    function drawEnemyArt(c, type, x, y, r, f) {
      var sw = Math.sin(f * PI / 2), i;
      c.lineCap = 'round'; c.lineJoin = 'round';
      if (type === 'grunt') {
        c.strokeStyle = '#14532d'; c.lineWidth = r * 0.22;
        c.beginPath(); c.moveTo(x - r * 0.2, y + r * 0.35); c.lineTo(x - r * 0.2 + sw * r * 0.3, y + r * 0.85); c.moveTo(x + r * 0.2, y + r * 0.35); c.lineTo(x + r * 0.2 - sw * r * 0.3, y + r * 0.85); c.stroke();
        c.fillStyle = rg(c, x, y + r * 0.1, r * 0.55, '#4ade80', '#15803d'); c.beginPath(); c.ellipse(x, y + r * 0.1, r * 0.5, r * 0.45, 0, 0, 6.283); c.fill();
        c.fillStyle = '#78350f'; c.fillRect(x - r * 0.48, y + r * 0.2, r * 0.96, r * 0.16);
        c.fillStyle = rg(c, x + r * 0.15, y - r * 0.45, r * 0.38, '#86efac', '#16a34a'); circ(c, x + r * 0.15, y - r * 0.42, r * 0.36); c.fill();
        c.fillStyle = '#16a34a'; c.beginPath(); c.moveTo(x - r * 0.12, y - r * 0.5); c.lineTo(x - r * 0.5, y - r * 0.75); c.lineTo(x - r * 0.08, y - r * 0.3); c.fill();
        c.fillStyle = '#fff'; circ(c, x + r * 0.3, y - r * 0.48, r * 0.1); c.fill(); c.fillStyle = '#111'; circ(c, x + r * 0.33, y - r * 0.48, r * 0.05); c.fill();
        c.strokeStyle = '#7c2d12'; c.lineWidth = r * 0.16; c.beginPath(); c.moveTo(x + r * 0.35, y + r * 0.1); c.lineTo(x + r * 0.7, y - r * 0.25 + sw * r * 0.1); c.stroke();
        c.fillStyle = '#57534e'; circ(c, x + r * 0.72, y - r * 0.3 + sw * r * 0.1, r * 0.15); c.fill();
      } else if (type === 'fast') {
        c.strokeStyle = '#7c2d12'; c.lineWidth = r * 0.16;
        for (i = 0; i < 2; i++) { var lx = x + (i ? r * 0.4 : -r * 0.4), s2 = i ? sw : -sw; c.beginPath(); c.moveTo(lx, y + r * 0.15); c.lineTo(lx + s2 * r * 0.35, y + r * 0.7); c.moveTo(lx, y + r * 0.15); c.lineTo(lx - s2 * r * 0.3, y + r * 0.7); c.stroke(); }
        c.fillStyle = rg(c, x, y, r * 0.7, '#fdba74', '#c2410c'); c.beginPath(); c.ellipse(x, y, r * 0.7, r * 0.35, 0, 0, 6.283); c.fill();
        c.fillStyle = '#9a3412'; for (i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x - r * 0.4 + i * r * 0.3, y - r * 0.3); c.lineTo(x - r * 0.3 + i * r * 0.3, y - r * 0.55); c.lineTo(x - r * 0.2 + i * r * 0.3, y - r * 0.3); c.fill(); }
        c.fillStyle = rg(c, x + r * 0.7, y - r * 0.15, r * 0.3, '#fed7aa', '#ea580c'); c.beginPath(); c.ellipse(x + r * 0.72, y - r * 0.12, r * 0.32, r * 0.24, 0.2, 0, 6.283); c.fill();
        c.fillStyle = '#fef08a'; circ(c, x + r * 0.82, y - r * 0.2, r * 0.07); c.fill();
        c.strokeStyle = '#c2410c'; c.lineWidth = r * 0.12; c.beginPath(); c.moveTo(x - r * 0.65, y - r * 0.05); c.quadraticCurveTo(x - r * 1.0, y - r * 0.2 - sw * r * 0.2, x - r * 1.1, y - r * 0.45); c.stroke();
      } else if (type === 'armored') {
        c.strokeStyle = '#334155'; c.lineWidth = r * 0.24;
        c.beginPath(); c.moveTo(x - r * 0.18, y + r * 0.35); c.lineTo(x - r * 0.18 + sw * r * 0.22, y + r * 0.85); c.moveTo(x + r * 0.18, y + r * 0.35); c.lineTo(x + r * 0.18 - sw * r * 0.22, y + r * 0.85); c.stroke();
        c.fillStyle = rg(c, x, y, r * 0.6, '#e2e8f0', '#475569'); rrect(c, x - r * 0.45, y - r * 0.35, r * 0.9, r * 0.8, r * 0.2); c.fill();
        c.strokeStyle = '#334155'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - r * 0.45, y + r * 0.05); c.lineTo(x + r * 0.45, y + r * 0.05); c.stroke();
        c.fillStyle = rg(c, x, y - r * 0.6, r * 0.38, '#f8fafc', '#64748b'); c.beginPath(); c.arc(x, y - r * 0.5, r * 0.34, PI, 0); c.lineTo(x + r * 0.34, y - r * 0.3); c.lineTo(x - r * 0.34, y - r * 0.3); c.fill();
        c.fillStyle = '#0f172a'; c.fillRect(x + r * 0.02, y - r * 0.56, r * 0.3, r * 0.08);
        c.fillStyle = '#dc2626'; c.beginPath(); c.moveTo(x - r * 0.1, y - r * 0.84); c.quadraticCurveTo(x - r * 0.5, y - r * 1.0, x - r * 0.55, y - r * 0.6); c.lineTo(x - r * 0.1, y - r * 0.7); c.fill();
        c.fillStyle = rg(c, x + r * 0.5, y, r * 0.42, '#60a5fa', '#1e3a8a'); c.beginPath(); c.moveTo(x + r * 0.35, y - r * 0.35); c.lineTo(x + r * 0.75, y - r * 0.35); c.lineTo(x + r * 0.75, y + r * 0.15); c.quadraticCurveTo(x + r * 0.55, y + r * 0.55, x + r * 0.35, y + r * 0.15); c.closePath(); c.fill();
        c.strokeStyle = '#fde047'; c.lineWidth = 1.2; c.stroke();
        c.fillStyle = '#fde047'; c.fillRect(x + r * 0.53, y - r * 0.25, r * 0.04, r * 0.35); c.fillRect(x + r * 0.43, y - r * 0.12, r * 0.24, r * 0.04);
      } else if (type === 'flyer') {
        var wy = [-0.75, -0.25, 0.25, -0.25][f];
        c.fillStyle = '#581c87';
        c.beginPath(); c.moveTo(x - r * 0.1, y - r * 0.05); c.quadraticCurveTo(x - r * 0.7, y + wy * r - r * 0.2, x - r * 1.0, y + wy * r); c.quadraticCurveTo(x - r * 0.75, y + wy * r * 0.5 + r * 0.15, x - r * 0.55, y + r * 0.1); c.quadraticCurveTo(x - r * 0.35, y + r * 0.0, x - r * 0.1, y + r * 0.1); c.fill();
        c.fillStyle = '#7e22ce';
        c.beginPath(); c.moveTo(x + r * 0.1, y - r * 0.05); c.quadraticCurveTo(x + r * 0.7, y + wy * r - r * 0.2, x + r * 1.0, y + wy * r); c.quadraticCurveTo(x + r * 0.75, y + wy * r * 0.5 + r * 0.15, x + r * 0.55, y + r * 0.1); c.quadraticCurveTo(x + r * 0.35, y + r * 0.0, x + r * 0.1, y + r * 0.1); c.fill();
        c.fillStyle = rg(c, x, y, r * 0.38, '#d8b4fe', '#6b21a8'); c.beginPath(); c.ellipse(x, y + r * 0.02, r * 0.3, r * 0.36, 0, 0, 6.283); c.fill();
        c.fillStyle = '#6b21a8'; c.beginPath(); c.moveTo(x - r * 0.2, y - r * 0.2); c.lineTo(x - r * 0.15, y - r * 0.5); c.lineTo(x - r * 0.02, y - r * 0.28); c.moveTo(x + r * 0.2, y - r * 0.2); c.lineTo(x + r * 0.15, y - r * 0.5); c.lineTo(x + r * 0.02, y - r * 0.28); c.fill();
        c.fillStyle = '#fef08a'; circ(c, x - r * 0.1, y - r * 0.08, r * 0.07); c.fill(); circ(c, x + r * 0.12, y - r * 0.08, r * 0.07); c.fill();
      } else {
        c.strokeStyle = '#431407'; c.lineWidth = r * 0.26;
        c.beginPath(); c.moveTo(x - r * 0.25, y + r * 0.3); c.lineTo(x - r * 0.25 + sw * r * 0.2, y + r * 0.88); c.moveTo(x + r * 0.25, y + r * 0.3); c.lineTo(x + r * 0.25 - sw * r * 0.2, y + r * 0.88); c.stroke();
        c.fillStyle = rg(c, x, y, r * 0.75, '#c2410c', '#450a0a'); c.beginPath(); c.ellipse(x, y, r * 0.62, r * 0.55, 0, 0, 6.283); c.fill();
        c.fillStyle = '#7c2d12'; c.beginPath(); c.ellipse(x - r * 0.05, y + r * 0.15, r * 0.4, r * 0.3, 0, 0, 6.283); c.fill();
        c.fillStyle = rg(c, x + r * 0.2, y - r * 0.55, r * 0.35, '#ea580c', '#7c2d12'); circ(c, x + r * 0.2, y - r * 0.5, r * 0.32); c.fill();
        c.fillStyle = '#f5f5f4'; c.beginPath(); c.moveTo(x + r * 0.0, y - r * 0.72); c.quadraticCurveTo(x - r * 0.3, y - r * 0.9, x - r * 0.25, y - r * 1.05); c.quadraticCurveTo(x - r * 0.05, y - r * 0.95, x + r * 0.1, y - r * 0.78); c.fill();
        c.beginPath(); c.moveTo(x + r * 0.35, y - r * 0.75); c.quadraticCurveTo(x + r * 0.6, y - r * 0.95, x + r * 0.62, y - r * 1.05); c.quadraticCurveTo(x + r * 0.45, y - r * 0.85, x + r * 0.28, y - r * 0.7); c.fill();
        c.fillStyle = '#fde047'; c.beginPath(); c.moveTo(x + r * 0.02, y - r * 0.78); c.lineTo(x + r * 0.08, y - r * 0.98); c.lineTo(x + r * 0.17, y - r * 0.84); c.lineTo(x + r * 0.24, y - r * 1.0); c.lineTo(x + r * 0.3, y - r * 0.84); c.lineTo(x + r * 0.38, y - r * 0.96); c.lineTo(x + r * 0.42, y - r * 0.76); c.closePath(); c.fill();
        c.fillStyle = '#fef08a'; circ(c, x + r * 0.35, y - r * 0.52, r * 0.07); c.fill();
        c.strokeStyle = '#57534e'; c.lineWidth = r * 0.2; c.beginPath(); c.moveTo(x + r * 0.45, y + r * 0.1); c.lineTo(x + r * 0.95, y - r * 0.55 + sw * r * 0.1); c.stroke();
        c.fillStyle = '#44403c'; circ(c, x + r * 0.98, y - r * 0.62 + sw * r * 0.1, r * 0.2); c.fill();
        c.fillStyle = '#a8a29e'; for (i = 0; i < 4; i++) { circ(c, x + r * 0.98 + Math.cos(i * 1.6) * r * 0.2, y - r * 0.62 + sw * r * 0.1 + Math.sin(i * 1.6) * r * 0.2, r * 0.05); c.fill(); }
      }
    }
    function glowSpr(col) {
      if (spr.glow[col]) return spr.glow[col];
      var o = mkC(64, 64), c = o.x, n = parseInt(col.slice(1), 16), rgb = (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
      var g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(' + rgb + ',.9)'); g.addColorStop(0.4, 'rgba(' + rgb + ',.3)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
      c.fillStyle = g; c.fillRect(0, 0, 64, 64); spr.glow[col] = o.cv; return o.cv;
    }

    function drawTowerIcon(c, type, x, y, s, alpha) {
      c.globalAlpha = alpha;
      c.drawImage(spr.base[type][0], x - s / 2, y - s / 2, s, s);
      c.save(); c.translate(x, y); c.rotate(-PI / 4);
      c.drawImage(spr.head[type][0], -s * 0.7, -s * 0.7, s * 1.4, s * 1.4); c.restore();
      c.globalAlpha = 1;
    }
    function coinIcon(c, x, y, r) {
      c.fillStyle = '#a16207'; circ(c, x, y + 1, r); c.fill();
      c.fillStyle = '#facc15'; circ(c, x, y, r); c.fill();
      c.strokeStyle = '#ca8a04'; c.lineWidth = 1.2; circ(c, x, y, r * 0.65); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.6)'; circ(c, x - r * 0.35, y - r * 0.35, r * 0.25); c.fill();
    }
    function heartIcon(c, x, y, r) {
      c.fillStyle = '#ef4444'; c.beginPath(); c.moveTo(x, y + r * 0.9); c.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.6, y - r * 1.1, x, y - r * 0.35); c.bezierCurveTo(x + r * 0.6, y - r * 1.1, x + r * 1.4, y - r * 0.1, x, y + r * 0.9); c.fill();
      c.fillStyle = 'rgba(255,255,255,.5)'; circ(c, x - r * 0.45, y - r * 0.35, r * 0.2); c.fill();
    }

    function draw(c) {
      var W = api.W, H = api.H, Q = api.quality, i, k;
      if (!mapC || layout !== W + 'x' + H) buildAll();
      c.drawImage(mapC, 0, 0, W, H);
      // следы взрывов
      for (i = 0; i < decals.length; i++) { var dc = decals[i], dp = scr(dc.x, dc.y); c.fillStyle = 'rgba(30,20,10,' + 0.35 * dc.a + ')'; c.beginPath(); c.ellipse(dp.x, dp.y, dc.r * TS, dc.r * TS * 0.7, 0, 0, 6.283); c.fill(); }
      // подсветка выбранной площадки и пустых площадок
      for (i = 0; i < SPOTS.length; i++) {
        if (towers[i]) continue;
        var sp = scr(SPOTS[i][0] + 0.5, SPOTS[i][1] + 0.5), cheap = gold >= 70;
        if (cheap || sel === i) {
          var pa = sel === i ? 0.9 : 0.25 + 0.2 * Math.sin(t * 3 + i);
          c.strokeStyle = 'rgba(253,224,71,' + pa + ')'; c.lineWidth = 2; circ(c, sp.x, sp.y, TS * 0.36); c.stroke();
          c.strokeStyle = 'rgba(255,255,255,' + pa * 0.8 + ')'; c.lineWidth = 2.2; c.lineCap = 'round';
          c.beginPath(); c.moveTo(sp.x - TS * 0.1, sp.y); c.lineTo(sp.x + TS * 0.1, sp.y); c.moveTo(sp.x, sp.y - TS * 0.1); c.lineTo(sp.x, sp.y + TS * 0.1); c.stroke();
        }
      }
      // сортировка по Y: башни и враги
      var list = [];
      for (k in towers) list.push({ y: towers[k].y, tw: towers[k], id: +k });
      for (i = 0; i < enemies.length; i++) list.push({ y: enemies[i].y + (enemies[i].fly ? 0.6 : 0), en: enemies[i] });
      list.sort(function (a, b) { return a.y - b.y; });
      // тени врагов
      for (i = 0; i < enemies.length; i++) {
        var e0 = enemies[i], ep = scr(e0.x, e0.y), es = e0.sz * TS;
        c.fillStyle = 'rgba(0,0,0,' + (e0.fly ? 0.18 : 0.3) + ')'; c.beginPath(); c.ellipse(ep.x, ep.y + es * (e0.fly ? 0.5 : 0.75), es * 0.6, es * 0.22, 0, 0, 6.283); c.fill();
      }
      for (i = 0; i < list.length; i++) {
        if (list[i].tw) drawTower(c, list[i].tw, list[i].id); else drawEnemy(c, list[i].en);
      }
      // лазеры
      c.lineCap = 'round';
      for (k in towers) {
        var tw = towers[k];
        if (tw.type === 'laser' && tw.beam && !tw.beam.dead) {
          var a0 = scr(tw.x + Math.cos(tw.ang) * 0.42 * (1 + tw.lvl * 0.12), tw.y - 0.12 + Math.sin(tw.ang) * 0.42 * (1 + tw.lvl * 0.12)), b0 = scr(tw.beam.x, tw.beam.y - (tw.beam.fly ? 0.45 : 0.15));
          var fl2 = 0.75 + Math.random() * 0.25, wdt = (2 + tw.lvl * 1.2) * fl2;
          c.globalCompositeOperation = 'lighter';
          c.strokeStyle = 'rgba(34,211,238,.45)'; c.lineWidth = wdt * 2.6; c.beginPath(); c.moveTo(a0.x, a0.y); c.lineTo(b0.x, b0.y); c.stroke();
          c.strokeStyle = '#ecfeff'; c.lineWidth = wdt * 0.8; c.stroke();
          if (Q > 0) { var gsz = TS * 0.9; c.drawImage(glowSpr('#22d3ee'), b0.x - gsz / 2, b0.y - gsz / 2, gsz, gsz); c.drawImage(glowSpr('#22d3ee'), a0.x - gsz / 3, a0.y - gsz / 3, gsz / 1.5, gsz / 1.5); }
          c.globalCompositeOperation = 'source-over';
        }
      }
      // снаряды
      for (i = 0; i < shots.length; i++) {
        var s = shots[i];
        if (s.k === 'ball') {
          var bp = scr(s.x, s.y), br = TS * (0.07 + s.lvl * 0.012);
          c.fillStyle = '#0c0a09'; circ(c, bp.x, bp.y, br); c.fill();
          c.fillStyle = 'rgba(255,255,255,.5)'; circ(c, bp.x - br * 0.35, bp.y - br * 0.35, br * 0.35); c.fill();
        } else {
          var u = s.t / s.T, sx = s.x0 + (s.x1 - s.x0) * u, sy = s.y0 + (s.y1 - s.y0) * u, z = Math.sin(u * PI) * 1.6;
          var sh = scr(sx, sy), sp2 = scr(sx, sy - z), rr = TS * (0.09 + z * 0.025);
          c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(sh.x, sh.y, TS * 0.08, TS * 0.04, 0, 0, 6.283); c.fill();
          c.fillStyle = '#1c1917'; circ(c, sp2.x, sp2.y, rr); c.fill();
          c.fillStyle = '#facc15'; circ(c, sp2.x + rr * 0.5, sp2.y - rr * 0.6, rr * 0.3); c.fill();
          if (Q > 0) { c.globalCompositeOperation = 'lighter'; c.drawImage(glowSpr('#f97316'), sp2.x + rr * 0.5 - 5, sp2.y - rr * 0.6 - 5, 10, 10); c.globalCompositeOperation = 'source-over'; }
        }
      }
      // частицы
      for (i = 0; i < parts.length; i++) {
        var p = parts[i], pp = scr(p.x, p.y), al = Math.max(0, p.life / p.max);
        if (p.ring) { c.strokeStyle = 'rgba(253,230,138,' + al + ')'; c.lineWidth = 3 * al + 1; circ(c, pp.x, pp.y, p.ring * TS * (1.1 - al * 0.7)); c.stroke(); continue; }
        if (p.col === 'smoke') { c.fillStyle = 'rgba(87,83,78,' + al * 0.45 + ')'; circ(c, pp.x, pp.y, p.r * TS * (1.6 - al * 0.6)); c.fill(); continue; }
        c.globalAlpha = al; c.fillStyle = p.col; circ(c, pp.x, pp.y, p.r * TS); c.fill(); c.globalAlpha = 1;
      }
      drawMenu(c);
      drawHud(c);
    }

    function drawTower(c, tw, id) {
      var p = scr(tw.x, tw.y), S = TS * (1 + tw.pop * 0.25 * Math.sin(tw.pop * PI));
      if (tw.type === 'frost' && tw.pulse > 0) {
        var rr = TT.frost.range[tw.lvl] * TS * (1 - tw.pulse * 0.85);
        c.fillStyle = 'rgba(147,197,253,' + tw.pulse * 0.18 + ')'; circ(c, p.x, p.y, rr); c.fill();
        c.strokeStyle = 'rgba(219,234,254,' + tw.pulse * 0.9 + ')'; c.lineWidth = 2.5; c.stroke();
      }
      c.drawImage(spr.base[tw.type][tw.lvl], p.x - S / 2, p.y - S / 2, S, S);
      var rec = tw.recoil * TS * 0.08, hx = p.x - Math.cos(tw.ang) * rec, hy = p.y - TS * 0.12 - Math.sin(tw.ang) * rec;
      c.save(); c.translate(hx, hy); c.rotate(tw.type === 'frost' ? tw.ang : tw.ang);
      c.drawImage(spr.head[tw.type][tw.lvl], -S * 0.7, -S * 0.7, S * 1.4, S * 1.4);
      c.restore();
      if (tw.type === 'cannon' && tw.recoil > 0.7 && api.quality > 0) {
        var mx2 = hx + Math.cos(tw.ang) * TS * 0.5, my2 = hy + Math.sin(tw.ang) * TS * 0.5;
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = (tw.recoil - 0.7) / 0.3; c.drawImage(glowSpr('#fbbf24'), mx2 - TS * 0.3, my2 - TS * 0.3, TS * 0.6, TS * 0.6); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      }
      if (tw.type === 'laser' && tw.heat > 0 && api.quality > 0) {
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = tw.heat * 0.7; c.drawImage(glowSpr('#22d3ee'), hx - TS * 0.3, hy - TS * 0.3, TS * 0.6, TS * 0.6); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      }
      // звёзды уровня
      for (var i = 0; i < tw.lvl; i++) {
        var sx = p.x - (tw.lvl - 1) * TS * 0.1 + i * TS * 0.2, sy = p.y + TS * 0.38;
        c.fillStyle = '#fde047'; c.strokeStyle = '#713f12'; c.lineWidth = 1; c.beginPath();
        for (var j = 0; j < 10; j++) { var a = -PI / 2 + j * PI / 5, r = j % 2 ? TS * 0.04 : TS * 0.09; c.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); }
        c.closePath(); c.fill(); c.stroke();
      }
      void id;
    }
    function drawEnemy(c, e) {
      var p = scr(e.x, e.y), sp = spr.en[e.type], f = Math.floor(e.walk * (e.fly ? 3 : 2.2)) % 4, sz = sp.sz;
      var bob = e.fly ? Math.sin(t * 5 + e.bob) * TS * 0.05 - TS * 0.45 : -Math.abs(Math.sin(e.walk * PI * 1.1)) * TS * 0.05 - TS * 0.12;
      c.save(); c.translate(p.x, p.y + bob);
      if (e.face < 0) c.scale(-1, 1);
      c.drawImage(sp.fr[f], -sz / 2, -sz / 2, sz, sz);
      c.restore();
      if (e.hit > 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; c.drawImage(glowSpr('#ffffff'), p.x - sz * 0.35, p.y + bob - sz * 0.35, sz * 0.7, sz * 0.7); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
      if (e.slowT > 0) {
        c.fillStyle = 'rgba(147,197,253,.35)'; circ(c, p.x, p.y + bob, e.sz * TS * 0.8); c.fill();
        c.fillStyle = '#e0f2fe'; for (var i = 0; i < 3; i++) { var a = t * 2 + i * 2.1; c.fillRect(p.x + Math.cos(a) * e.sz * TS * 0.8 - 1, p.y + bob + Math.sin(a) * e.sz * TS * 0.5 - 1, 2.5, 2.5); }
      }
      if (e.hp < e.max) {
        var bw = Math.max(TS * 0.6, e.sz * TS * 1.6), bh = Math.max(3, TS * 0.08), bx = p.x - bw / 2, by = p.y + bob - e.sz * TS * 1.15 - bh;
        c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
        var fr = Math.max(0, e.hp / e.max);
        c.fillStyle = fr > 0.5 ? '#22c55e' : fr > 0.25 ? '#eab308' : '#ef4444'; c.fillRect(bx, by, bw * fr, bh);
        c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(bx, by, bw * fr, bh * 0.4);
        if (e.armor > 0) { c.fillStyle = '#94a3b8'; c.fillRect(bx - 5, by - 1, 4, bh + 2); }
      }
    }

    function drawMenu(c) {
      if (sel < 0) return;
      var sp = SPOTS[sel], cp = scr(sp[0] + 0.5, sp[1] + 0.5), tw = towers[sel], mb = menuButtons(), i;
      // радиус
      var rng = tw ? TT[tw.type].range[tw.lvl] : 0;
      if (tw) {
        c.fillStyle = 'rgba(255,255,255,.08)'; circ(c, cp.x, cp.y, rng * TS); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.55)'; c.setLineDash([6, 5]); c.lineWidth = 1.5; c.stroke(); c.setLineDash([]);
        if (tw.lvl < 2) { c.strokeStyle = 'rgba(253,224,71,.5)'; c.setLineDash([3, 6]); circ(c, cp.x, cp.y, TT[tw.type].range[tw.lvl + 1] * TS); c.stroke(); c.setLineDash([]); }
      }
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 0, 0, 0);
      if (tw) for (i = 0; i < mb.length; i++) drawBtn(c, mb[i]);
      function drawBtn(c, b) {
        var ok = b.act === 'sell' || (b.cost > 0 && gold >= b.cost);
        c.fillStyle = 'rgba(0,0,0,.35)'; circ(c, b.x + 1, b.y + 3, b.r + 2); c.fill();
        var bgc = b.act === 'sell' ? ['#7f1d1d', '#dc2626'] : ok ? ['#1e3a8a', '#3b82f6'] : ['#27272a', '#52525b'];
        c.fillStyle = rg(c, b.x, b.y, b.r + 2, bgc[1], bgc[0]); circ(c, b.x, b.y, b.r + 2); c.fill();
        c.strokeStyle = ok ? '#fde047' : '#a1a1aa'; c.lineWidth = 2; c.stroke();
        if (b.act === 'build') drawTowerIcon(c, b.type, b.x, b.y - 2, b.r * 1.45, ok ? 1 : 0.45);
        else if (b.act === 'up') {
          c.fillStyle = b.cost ? (ok ? '#fde047' : '#a1a1aa') : '#a1a1aa';
          c.beginPath(); c.moveTo(b.x, b.y - b.r * 0.6); c.lineTo(b.x + b.r * 0.5, b.y - b.r * 0.05); c.lineTo(b.x + b.r * 0.2, b.y - b.r * 0.05); c.lineTo(b.x + b.r * 0.2, b.y + b.r * 0.35); c.lineTo(b.x - b.r * 0.2, b.y + b.r * 0.35); c.lineTo(b.x - b.r * 0.2, b.y - b.r * 0.05); c.lineTo(b.x - b.r * 0.5, b.y - b.r * 0.05); c.closePath(); c.fill();
        } else { coinIcon(c, b.x, b.y - 2, b.r * 0.42); }
        // цена
        var lbl = b.act === 'up' && !b.cost ? api.t('td.max') : (b.act === 'sell' ? '+' : '') + b.cost;
        c.font = '800 ' + Math.max(11, Math.round(TS * 0.27)) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        var lw = c.measureText(lbl).width + 10, ly = b.y + b.r + 6;
        c.fillStyle = 'rgba(0,0,0,.75)'; rrect(c, b.x - lw / 2, ly - 8, lw, 16, 8); c.fill();
        c.fillStyle = b.act === 'sell' ? '#fde047' : ok ? '#fde047' : '#f87171'; c.fillText(lbl, b.x, ly + 0.5);
      }
      if (!tw) { // подложка панели и указатель
        var px0 = mb[0].x - mb[0].r - 10, px1 = mb[3].x + mb[3].r + 10, py0 = mb[0].y - mb[0].r - 22, py1 = mb[0].y + mb[0].r + 18;
        c.fillStyle = 'rgba(12,10,9,.55)'; rrect(c, px0, py0, px1 - px0, py1 - py0, 16); c.fill();
        c.strokeStyle = 'rgba(253,224,71,.45)'; c.lineWidth = 1.5; c.stroke();
        var up = mb[0].y < cp.y, ay = up ? py1 : py0, ax = Math.max(px0 + 16, Math.min(px1 - 16, cp.x));
        c.fillStyle = 'rgba(12,10,9,.55)'; c.beginPath(); c.moveTo(ax - 9, ay); c.lineTo(ax + 9, ay); c.lineTo(ax, ay + (up ? 10 : -10)); c.closePath(); c.fill();
        for (var q = 0; q < mb.length; q++) drawBtn(c, mb[q]);
        for (q = 0; q < mb.length; q++) {
          var b2 = mb[q], nm = api.t('td.' + b2.type) + (TT[b2.type].air ? ' ✈' : '');
          c.font = '700 10px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillStyle = TT[b2.type].col; c.fillText(nm, b2.x, b2.y - b2.r - 11, mb.length > 1 ? (mb[1].x - mb[0].x) - 4 : 80);
        }
        return;
      }
      // название башни
      var name = tw ? api.t('td.' + tw.type) + ' · ' + api.t('td.lvl') + ' ' + (tw.lvl + 1) : api.t('td.build');
      c.font = '800 12px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      var nw = c.measureText(name).width + 16, ny = Math.max(TOPH + 14, cp.y - TS * 0.5 - (tw ? 0 : TS * 0.0));
      var nx = Math.max(nw / 2 + 4, Math.min(api.W - nw / 2 - 4, cp.x));
      if (!tw) ny = cp.y;
      if (tw) { ny = cp.y + TS * 0.62; }
      c.fillStyle = 'rgba(15,23,42,.85)'; rrect(c, nx - nw / 2, ny - 10, nw, 20, 10); c.fill();
      c.fillStyle = '#f8fafc'; c.fillText(name, nx, ny + 0.5);
    }

    function drawHud(c) {
      var W = api.W, H = api.H;
      // верх
      var tg = c.createLinearGradient(0, 0, 0, TOPH); tg.addColorStop(0, 'rgba(12,10,9,.85)'); tg.addColorStop(1, 'rgba(12,10,9,.55)');
      c.fillStyle = tg; c.fillRect(0, 0, W, TOPH);
      c.fillStyle = 'rgba(253,224,71,.35)'; c.fillRect(0, TOPH - 1, W, 1);
      c.textBaseline = 'middle'; c.textAlign = 'left'; c.font = '900 17px system-ui, sans-serif';
      heartIcon(c, 22, TOPH / 2, 9); c.fillStyle = lives <= 3 ? '#fca5a5' : '#fff'; c.fillText(String(lives), 36, TOPH / 2 + 1);
      coinIcon(c, 92, TOPH / 2, 9); c.fillStyle = '#fde047'; c.fillText(String(gold), 106, TOPH / 2 + 1);
      c.textAlign = 'right'; c.fillStyle = '#e7e5e4'; c.font = '800 15px system-ui, sans-serif';
      c.fillText(api.t('td.wave') + ' ' + Math.max(1, Math.min(D.waves, wave + (phase === 'build' ? 1 : 0))) + '/' + D.waves, W - 12, TOPH / 2 + 1);
      // низ
      var by = H - BOTH, bb = barButtons();
      var bg = c.createLinearGradient(0, by, 0, H); bg.addColorStop(0, 'rgba(12,10,9,.6)'); bg.addColorStop(1, 'rgba(12,10,9,.9)');
      c.fillStyle = bg; c.fillRect(0, by, W, BOTH);
      var nb = bb.next, ready = phase === 'build';
      c.fillStyle = 'rgba(0,0,0,.4)'; rrect(c, nb.x, nb.y + 3, nb.w, nb.h, 14); c.fill();
      var ng = c.createLinearGradient(0, nb.y, 0, nb.y + nb.h);
      if (ready) { ng.addColorStop(0, '#84cc16'); ng.addColorStop(1, '#3f6212'); } else { ng.addColorStop(0, '#44403c'); ng.addColorStop(1, '#1c1917'); }
      c.fillStyle = ng; rrect(c, nb.x, nb.y, nb.w, nb.h, 14); c.fill();
      c.strokeStyle = ready ? '#d9f99d' : '#57534e'; c.lineWidth = 1.5; c.stroke();
      c.textAlign = 'center'; c.fillStyle = '#fff';
      if (ready) {
        var lbl = (wave === 0 ? api.t('td.start') : api.t('td.next')) + ' ▶';
        c.font = '900 16px system-ui, sans-serif'; c.fillText(lbl, nb.x + nb.w / 2, nb.y + nb.h / 2 - (wave ? 6 : 0));
        if (wave > 0) { c.font = '700 11px system-ui, sans-serif'; c.fillStyle = '#ecfccb'; c.fillText(Math.ceil(countdown) + ' ' + api.t('td.sec') + ' · +' + Math.ceil(countdown * 1.5) + ' ' + api.t('td.goldEarly'), nb.x + nb.w / 2, nb.y + nb.h / 2 + 10); }
        // кольцо таймера
        var cx = nb.x + 22, cy = nb.y + nb.h / 2, maxC = wave === 0 ? 30 : 14;
        c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 3; circ(c, cx, cy, 11); c.stroke();
        c.strokeStyle = '#fef08a'; c.beginPath(); c.arc(cx, cy, 11, -PI / 2, -PI / 2 + 6.283 * Math.max(0, countdown / maxC)); c.stroke();
      } else if (phase === 'wave') {
        var left = spawnQ.length + enemies.length, tot = Math.max(left, 1);
        c.font = '800 14px system-ui, sans-serif'; c.fillStyle = '#e7e5e4';
        c.fillText(api.t('td.wave') + ' ' + wave + ' · ' + api.t('td.enemies') + ': ' + left, nb.x + nb.w / 2, nb.y + nb.h / 2 - 5);
        var pw = nb.w - 40, pr = Math.min(1, spawnQ.length / Math.max(1, makeWaveLen()));
        c.fillStyle = 'rgba(0,0,0,.5)'; rrect(c, nb.x + 20, nb.y + nb.h / 2 + 7, pw, 6, 3); c.fill();
        c.fillStyle = '#f87171'; rrect(c, nb.x + 20, nb.y + nb.h / 2 + 7, Math.max(6, pw * (1 - pr)), 6, 3); c.fill();
        void tot;
      } else {
        c.font = '900 17px system-ui, sans-serif'; c.fillStyle = phase === 'won' ? '#fde047' : '#fca5a5';
        c.fillText(phase === 'won' ? api.t('td.victory') : api.t('td.defeat'), nb.x + nb.w / 2, nb.y + nb.h / 2 + 1);
      }
      // скорость
      var sb = bb.spd, on = speed === 2;
      c.fillStyle = 'rgba(0,0,0,.4)'; rrect(c, sb.x, sb.y + 3, sb.w, sb.h, 14); c.fill();
      var sg = c.createLinearGradient(0, sb.y, 0, sb.y + sb.h); sg.addColorStop(0, on ? '#f59e0b' : '#57534e'); sg.addColorStop(1, on ? '#b45309' : '#292524');
      c.fillStyle = sg; rrect(c, sb.x, sb.y, sb.w, sb.h, 14); c.fill(); c.strokeStyle = on ? '#fde68a' : '#78716c'; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = '#fff'; var ax = sb.x + sb.w / 2 - 12, ay = sb.y + sb.h / 2 - 8;
      for (var q = 0; q < 2; q++) { c.beginPath(); c.moveTo(ax + q * 11, ay); c.lineTo(ax + q * 11 + 11, ay + 8); c.lineTo(ax + q * 11, ay + 16); c.closePath(); c.fill(); }
      c.font = '800 10px system-ui, sans-serif'; c.fillText(on ? '2×' : '1×', sb.x + sb.w / 2, sb.y + sb.h - 7);
      // подсказка
      if (built === 0 && sel < 0 && phase === 'build') {
        var tip = api.t('td.tip'), a = 0.75 + 0.25 * Math.sin(t * 4);
        c.font = '800 14px system-ui, sans-serif'; var tw2 = Math.min(W - 20, c.measureText(tip).width + 28), ty = H - BOTH - 34;
        c.globalAlpha = a; c.fillStyle = 'rgba(12,10,9,.8)'; rrect(c, W / 2 - tw2 / 2, ty - 16, tw2, 32, 16); c.fill();
        c.strokeStyle = 'rgba(253,224,71,.7)'; c.lineWidth = 1.5; c.stroke();
        c.fillStyle = '#fef9c3'; c.fillText(tip, W / 2, ty + 1, W - 40); c.globalAlpha = 1;
      }
      c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    }
    var wlCache = {};
    function makeWaveLen() { if (!wlCache[wave]) wlCache[wave] = makeWave(wave).length; return wlCache[wave]; }

    self._dbg = function () { return { st: function () { return { gold: gold, lives: lives, wave: wave, phase: phase, kills: kills, towers: towers, enemies: enemies.length }; }, build: build, upgrade: upgrade, startWave: startWave, SPOTS: SPOTS, sim: sim, setSel: function (i) { sel = i; } }; };
    return self;
  }
};
