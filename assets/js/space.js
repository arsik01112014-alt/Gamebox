/* Космос — вертикальный шутер */
window.GAMES = window.GAMES || {};
window.GAMES.space = {
  title: 'Космос',
  desc: 'Отбей атаку пришельцев',
  hint: 'Води пальцем по экрану — корабль летит за ним и стреляет сам. Сбивай врагов, уворачивайся от пуль и астероидов. Бонусы: P — мощнее пушка, + — ремонт.',
  colors: ['#4f46e5', '#0ea5e9'],
  controls: 'none',
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="spaceH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#94a3b8"/></linearGradient><linearGradient id="spaceW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dd3fc"/><stop offset="1" stop-color="#0369a1"/></linearGradient><linearGradient id="spaceC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bae6fd"/><stop offset="1" stop-color="#075985"/></linearGradient><radialGradient id="spaceF" cx=".5" cy=".2" r=".8"><stop offset="0" stop-color="#fde047"/><stop offset="1" stop-color="#f97316" stop-opacity="0"/></radialGradient></defs><circle cx="20" cy="20" r="2" fill="#fff"/><circle cx="80" cy="30" r="1.5" fill="#fff"/><circle cx="70" cy="10" r="1.2" fill="#fff"/><circle cx="12" cy="60" r="1.4" fill="#fff"/>' +
    '<path d="M50 14 L64 56 L58 70 H42 L36 56z" fill="url(#spaceH)" stroke="#0c4a6e" stroke-width="2.5"/>' +
    '<path d="M36 56 L20 70 L24 76 L42 70z M64 56 L80 70 L76 76 L58 70z" fill="url(#spaceW)" stroke="#0c4a6e" stroke-width="2.5"/>' +
    '<ellipse cx="50" cy="40" rx="6" ry="10" fill="url(#spaceC)"/><ellipse cx="48" cy="36" rx="1.8" ry="3.5" fill="#fff" opacity=".7"/>' +
    '<circle cx="50" cy="80" r="12" fill="url(#spaceF)" opacity=".7"/><path d="M44 72 Q50 94 56 72z" fill="#fb923c"/><path d="M47 72 Q50 86 53 72z" fill="#fde047"/>' +
    '<rect x="48" y="0" width="4" height="10" rx="2" fill="#f472b6"/></svg>',

  create: function (api) {
    var s, ship, bullets, ebullets, enemies, caps, parts, rings, stars, t, fireT, spawnT, anchor, keys, inv, hp, weapon, rapidT, shake, endT, waveN;

    function rnd(a, b) { return a + Math.random() * (b - a); }
    var DIFF = [
      { hp: 5, spawn: 1.45, bs: 0.75, fire: 0.6, dens: 0.75 },
      { hp: 3, spawn: 1, bs: 1, fire: 1, dens: 1 },
      { hp: 3, spawn: 0.78, bs: 1.3, fire: 1.5, dens: 1.3 },
      { hp: 1, spawn: 0.62, bs: 1.5, fire: 2.2, dens: 1.55 }
    ];
    var D = DIFF[1], shieldT = 0, bossT = 0, bossN = 0, boss = null, planet = null;
    // v2.0: супербомба (кнопка справа внизу), цепочки убийств (множитель), мины, магнит
    var bombs = 1, killsN = 0, chain = 0, chainT = 0, magnetT = 0, bombBtn = null, bombFx = 0;
    function useBomb() {
      if (bombs <= 0 || endT > 0) return;
      bombs--; bombFx = 0.6; api.fx.flash('#fff', 0.5); api.fx.shake(10); api.sound('break'); api.vibrate(120);
      ebullets = [];
      for (var i = enemies.length - 1; i >= 0; i--) {
        var e = enemies[i];
        if (e.type === 'boss') { e.hp -= Math.round(e.max * 0.15); e.flash = 0.3; if (e.hp <= 0) kill(e, i); }
        else kill(e, i);
      }
    }

    function explode(x, y, col, n, big) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.283, v = rnd(40, big ? 320 : 200) * s;
        parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rnd(0.4, 0.9), col: Math.random() < 0.3 ? '#fff' : col, sz: rnd(1.5, 4) * s });
      }
      rings.push({ x: x, y: y, r: 4 * s, life: 0.4, col: col, max: big ? 70 * s : 36 * s });
    }

    function spawnWave() {
      waveN++;
      var d = (1 + t / 40) * D.dens, W = api.W, r = Math.random();
      if (r < 0.35) { // строй дронов
        var n = Math.min(7, 3 + Math.floor(d));
        for (var i = 0; i < n; i++) enemies.push({ type: 'drone', x: W * (i + 1) / (n + 1), y: -30 * s - Math.abs(i - (n - 1) / 2) * 26 * s, hp: 1, ph: i * 0.7, vy: 70 * s * Math.min(1.8, d * 0.8), r: 15 * s });
      } else if (r < 0.55) { // пикировщики
        var m = Math.min(5, 2 + Math.floor(d));
        for (var j = 0; j < m; j++) enemies.push({ type: 'dart', x: rnd(30, W - 30), y: -40 * s - j * 60 * s, hp: 1, vy: rnd(200, 260) * s * Math.min(1.6, d * 0.7), r: 12 * s });
      } else if (r < 0.75) { // танк
        enemies.push({ type: 'tank', x: rnd(60 * s, W - 60 * s), y: -40 * s, hp: 4 + Math.floor(d), max: 4 + Math.floor(d), vy: 45 * s, r: 24 * s, shot: 1, dir: Math.random() < 0.5 ? -1 : 1 });
      } else if (r < 0.85 && waveN > 6) { // мины
        var mn = 2 + Math.floor(Math.random() * 2);
        for (var mi = 0; mi < mn; mi++) enemies.push({ type: 'mine', x: rnd(40, W - 40), y: -30 * s - mi * 70 * s, hp: 2, vy: 70 * s, r: 14 * s, ph: Math.random() * 6 });
      } else { // астероиды
        var k = 2 + Math.floor(Math.random() * 3);
        for (var q = 0; q < k; q++) {
          var pts = [], nn = 9, rr = rnd(16, 28) * s;
          for (var z = 0; z < nn; z++) pts.push(rr * rnd(0.75, 1.1));
          enemies.push({ type: 'rock', x: rnd(30, W - 30), y: -40 * s - q * 90 * s, hp: 3, vy: rnd(90, 150) * s, vx: rnd(-40, 40) * s, r: rr, rot: 0, vr: rnd(-2, 2), pts: pts });
        }
      }
    }

    function hitPlayer() {
      if (inv > 0 || endT > 0) return;
      if (shieldT > 0) { shieldT = 0; inv = 0.8; api.sound('break'); explode(ship.x, ship.y, '#38bdf8', 20); return; }
      hp--; inv = 1.6; shake = 0.35;
      api.sound('hit'); api.vibrate(140);
      explode(ship.x, ship.y, '#38bdf8', 16);
      if (weapon > 1) weapon--;
      if (hp <= 0) { endT = 1.2; explode(ship.x, ship.y, '#fb923c', 50, true); }
    }

    function kill(e, i) {
      enemies.splice(i, 1);
      var pts = { drone: 100, dart: 150, tank: 400, rock: 50, boss: 3000 }[e.type];
      if (e.type === 'boss') {
        boss = null; shake = 0.6; if (bombs < 3) bombs++;
        for (var bb = 0; bb < 5; bb++) explode(e.x + rnd(-40, 40) * s, e.y + rnd(-25, 25) * s, ['#f472b6', '#fb923c', '#facc15'][bb % 3], 30, true);
        caps.push({ x: e.x - 20 * s, y: e.y, type: 'P' }); caps.push({ x: e.x + 20 * s, y: e.y, type: 'H' }); caps.push({ x: e.x, y: e.y + 20 * s, type: 'S' });
        api.addScore(pts * (1 + bossN * 0.5) | 0); api.sound('win'); api.vibrate(200);
        return;
      }
      chain = chainT > 0 ? chain + 1 : 1; chainT = 1.6; killsN++;
      var mult = Math.min(4, 1 + Math.floor(chain / 5));
      api.addScore((pts || 100) * mult);
      if (chain % 5 === 0) api.fx.text(e.x, e.y - 20 * s, api.t('space.chain', chain) + ' x' + mult, '#fde047', 16);
      if (killsN % 40 === 0 && bombs < 3) { bombs++; api.toast(api.t('space.bombGot')); }
      if (e.type === 'mine') { for (var mb = 0; mb < 8; mb++) { var ma = mb / 8 * 6.283; ebullets.push({ x: e.x, y: e.y, vx: Math.cos(ma) * 170 * s * D.bs, vy: Math.sin(ma) * 170 * s * D.bs }); } }
      var col = { drone: '#f43f5e', dart: '#facc15', tank: '#a855f7', rock: '#a8a29e', mine: '#fb923c' }[e.type] || '#fff';
      explode(e.x, e.y, col, e.type === 'tank' ? 40 : 18, e.type === 'tank');
      api.sound(e.type === 'tank' ? 'break' : 'stomp'); api.vibrate(e.type === 'tank' ? 40 : 10);
      if (Math.random() < (e.type === 'tank' ? 0.6 : 0.07)) { var rr2 = Math.random(); caps.push({ x: e.x, y: e.y, type: rr2 < (hp < 3 ? 0.4 : 0.15) ? 'H' : rr2 < 0.6 ? 'P' : rr2 < 0.82 ? 'S' : 'M' }); }
    }

    /* ---- пререндер: фон-туманность, планета, свечения ---- */
    var bgOff = null, bgKey = '', planetOff = null, planetKey = '', gcache = {};
    function DPR() { return Math.min(2, window.devicePixelRatio || 1); }
    function mk(w, h) { var d = DPR(), o = document.createElement('canvas'); o.width = Math.ceil(w * d); o.height = Math.ceil(h * d); var q = o.getContext('2d'); q.scale(d, d); o.q = q; return o; }
    function glow(col) { // мягкий ореол вместо shadowBlur (один спрайт на цвет, масштабируется)
      var key = col, r = 32;
      if (gcache[key]) return gcache[key];
      var o = mk(r * 2, r * 2), q = o.q, g = q.createRadialGradient(r, r, 0, r, r, r);
      g.addColorStop(0, col); g.addColorStop(0.35, col.replace('rgb(', 'rgba(').replace(')', ',.35)')); g.addColorStop(1, 'rgba(0,0,0,0)');
      q.fillStyle = g; q.fillRect(0, 0, r * 2, r * 2);
      gcache[key] = o; return o;
    }
    function halo(c, x, y, col, r) { if (api.quality > 0) c.drawImage(glow(col), x - r, y - r, r * 2, r * 2); }
    function buildBg() {
      var W = api.W, H = api.H; bgKey = W + 'x' + H;
      var o = mk(W, H), c = o.q;
      var g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#070523'); g.addColorStop(0.5, '#0a0830'); g.addColorStop(1, '#120726');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      var seed = 5; function R() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      var neb = [[0.2, 0.3, 'rgba(99,102,241,'], [0.85, 0.72, 'rgba(236,72,153,'], [0.6, 0.1, 'rgba(56,189,248,'], [0.1, 0.9, 'rgba(168,85,247,']];
      neb.forEach(function (nb) {
        for (var i = 0; i < 14; i++) { // клочья туманности
          var x = (nb[0] + (R() - 0.5) * 0.5) * W, y = (nb[1] + (R() - 0.5) * 0.35) * H, r = W * (0.12 + R() * 0.28);
          var rg = c.createRadialGradient(x, y, 0, x, y, r);
          rg.addColorStop(0, nb[2] + (0.05 + R() * 0.06) + ')'); rg.addColorStop(1, nb[2] + '0)');
          c.fillStyle = rg; c.fillRect(x - r, y - r, r * 2, r * 2);
        }
      });
      // тёмные пылевые прожилки
      for (var d = 0; d < 6; d++) {
        var dx = R() * W, dy = R() * H, dr = W * (0.1 + R() * 0.15);
        var dg = c.createRadialGradient(dx, dy, 0, dx, dy, dr);
        dg.addColorStop(0, 'rgba(3,2,15,.35)'); dg.addColorStop(1, 'rgba(3,2,15,0)');
        c.fillStyle = dg; c.fillRect(dx - dr, dy - dr, dr * 2, dr * 2);
      }
      // неподвижная звёздная пыль
      for (var st = 0; st < 260; st++) {
        var a = R();
        c.fillStyle = a < 0.1 ? 'rgba(186,230,253,.9)' : a < 0.2 ? 'rgba(253,230,138,.8)' : 'rgba(255,255,255,' + (0.15 + R() * 0.45) + ')';
        c.fillRect(R() * W, R() * H, a < 0.05 ? 1.6 : 0.9, a < 0.05 ? 1.6 : 0.9);
      }
      for (var bs = 0; bs < 5; bs++) { // яркие звёзды с лучиками
        var bx = R() * W, by = R() * H, br = 3 + R() * 4;
        c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 0.8;
        c.beginPath(); c.moveTo(bx - br, by); c.lineTo(bx + br, by); c.moveTo(bx, by - br); c.lineTo(bx, by + br); c.stroke();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(bx, by, 1.1, 0, 6.283); c.fill();
      }
      bgOff = o;
    }
    function buildPlanet() {
      var pr = planet.r * s, S = pr * 4, o = mk(S, S), c = o.q, cx = S / 2, cy = S / 2;
      planetKey = planet.hue[0] + pr;
      function ring(front) {
        c.save(); c.translate(cx, cy); c.rotate(-0.35);
        c.beginPath();
        if (front) c.ellipse(0, 0, pr * 1.75, pr * 0.38, 0, 0, Math.PI); else c.ellipse(0, 0, pr * 1.75, pr * 0.38, 0, Math.PI, 6.283);
        c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = pr * 0.12; c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = pr * 0.05;
        c.beginPath();
        if (front) c.ellipse(0, 0, pr * 1.5, pr * 0.32, 0, 0, Math.PI); else c.ellipse(0, 0, pr * 1.5, pr * 0.32, 0, Math.PI, 6.283);
        c.stroke(); c.restore();
      }
      ring(false);
      var at = c.createRadialGradient(cx, cy, pr * 0.9, cx, cy, pr * 1.25);
      at.addColorStop(0, 'rgba(255,255,255,.18)'); at.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = at; c.beginPath(); c.arc(cx, cy, pr * 1.25, 0, 6.283); c.fill();
      var pg = c.createRadialGradient(cx - pr * 0.4, cy - pr * 0.4, pr * 0.1, cx, cy, pr);
      pg.addColorStop(0, planet.hue[0]); pg.addColorStop(1, planet.hue[1]);
      c.fillStyle = pg; c.beginPath(); c.arc(cx, cy, pr, 0, 6.283); c.fill();
      c.save(); c.beginPath(); c.arc(cx, cy, pr, 0, 6.283); c.clip();
      for (var b = 0; b < 7; b++) { // полосы облаков
        c.fillStyle = b % 2 ? 'rgba(255,255,255,.09)' : 'rgba(0,0,0,.12)';
        c.beginPath(); c.ellipse(cx, cy - pr + (b + 0.5) * pr * 0.29, pr * 1.2, pr * 0.07 + (b % 3) * pr * 0.02, 0.08, 0, 6.283); c.fill();
      }
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(cx + pr * 0.3, cy + pr * 0.15, pr * 0.18, pr * 0.1, 0, 0, 6.283); c.fill();
      var sh = c.createRadialGradient(cx - pr * 0.5, cy - pr * 0.5, pr * 0.6, cx - pr * 0.2, cy - pr * 0.2, pr * 1.6);
      sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(3,2,20,.85)');
      c.fillStyle = sh; c.fillRect(0, 0, S, S);
      c.restore();
      ring(true);
      planetOff = o;
    }
    function drawShip(c) {
      var x = ship.x, y = ship.y, k = s;
      if (inv > 0 && Math.floor(t * 18) % 2) c.globalAlpha = 0.35;
      // пламя
      var fl = rnd(0.8, 1.2);
      halo(c, x, y + 22 * k, 'rgb(251,146,60)', 22 * k * fl);
      c.fillStyle = '#fb923c'; c.beginPath(); c.moveTo(x - 7 * k, y + 16 * k); c.quadraticCurveTo(x, y + (40 * fl) * k, x + 7 * k, y + 16 * k); c.fill();
      c.fillStyle = '#fde047'; c.beginPath(); c.moveTo(x - 4 * k, y + 16 * k); c.quadraticCurveTo(x, y + (30 * fl) * k, x + 4 * k, y + 16 * k); c.fill();
      // крылья
      var wg = c.createLinearGradient(0, y, 0, y + 19 * k);
      wg.addColorStop(0, '#7dd3fc'); wg.addColorStop(1, '#0369a1');
      c.fillStyle = wg; c.strokeStyle = '#0c4a6e'; c.lineWidth = 2 * k; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(x - 9 * k, y); c.lineTo(x - 26 * k, y + 14 * k); c.lineTo(x - 22 * k, y + 19 * k); c.lineTo(x - 7 * k, y + 15 * k); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(x + 9 * k, y); c.lineTo(x + 26 * k, y + 14 * k); c.lineTo(x + 22 * k, y + 19 * k); c.lineTo(x + 7 * k, y + 15 * k); c.closePath(); c.fill(); c.stroke();
      // полосы на крыльях и пушки
      c.fillStyle = '#f472b6';
      c.beginPath(); c.moveTo(x - 12 * k, y + 5 * k); c.lineTo(x - 20 * k, y + 12 * k); c.lineTo(x - 18 * k, y + 14 * k); c.lineTo(x - 11 * k, y + 9 * k); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(x + 12 * k, y + 5 * k); c.lineTo(x + 20 * k, y + 12 * k); c.lineTo(x + 18 * k, y + 14 * k); c.lineTo(x + 11 * k, y + 9 * k); c.closePath(); c.fill();
      c.fillStyle = '#cbd5e1';
      c.fillRect(x - 20 * k, y + 2 * k, 2.5 * k, 9 * k); c.fillRect(x + 17.5 * k, y + 2 * k, 2.5 * k, 9 * k);
      // корпус
      var g = c.createLinearGradient(x - 10 * k, 0, x + 10 * k, 0);
      g.addColorStop(0, '#94a3b8'); g.addColorStop(0.5, '#f8fafc'); g.addColorStop(1, '#94a3b8');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(x, y - 24 * k); c.lineTo(x + 10 * k, y + 8 * k); c.lineTo(x + 7 * k, y + 17 * k); c.lineTo(x - 7 * k, y + 17 * k); c.lineTo(x - 10 * k, y + 8 * k); c.closePath(); c.fill(); c.stroke();
      var cpg = c.createLinearGradient(0, y - 12 * k, 0, y + 4 * k);
      cpg.addColorStop(0, '#bae6fd'); cpg.addColorStop(0.5, '#0ea5e9'); cpg.addColorStop(1, '#075985');
      c.fillStyle = cpg; c.beginPath(); c.ellipse(x, y - 4 * k, 4 * k, 8 * k, 0, 0, 6.283); c.fill();
      c.strokeStyle = '#0c4a6e'; c.lineWidth = 1; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(x - 1.5 * k, y - 7 * k, 1.5 * k, 3 * k, 0, 0, 6.283); c.fill();
      // боковые огни
      c.fillStyle = Math.floor(t * 4) % 2 ? '#f43f5e' : '#7f1d1d'; c.beginPath(); c.arc(x - 24 * k, y + 16 * k, 2 * k, 0, 6.283); c.fill();
      c.fillStyle = Math.floor(t * 4) % 2 ? '#22c55e' : '#14532d'; c.beginPath(); c.arc(x + 24 * k, y + 16 * k, 2 * k, 0, 6.283); c.fill();
      c.strokeStyle = 'rgba(12,74,110,.6)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x - 6 * k, y + 6 * k); c.lineTo(x + 6 * k, y + 6 * k); c.moveTo(x - 5 * k, y + 11 * k); c.lineTo(x + 5 * k, y + 11 * k); c.stroke();
      if (shieldT > 0) {
        var sa = shieldT < 2 && Math.floor(t * 10) % 2 ? 0.2 : 0.55;
        var sg = c.createRadialGradient(x, y, 20 * k, x, y, 36 * k);
        sg.addColorStop(0, 'rgba(56,189,248,0)'); sg.addColorStop(1, 'rgba(56,189,248,' + sa + ')');
        c.fillStyle = sg; c.beginPath(); c.arc(x, y, 36 * k, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(186,230,253,' + sa + ')'; c.lineWidth = 2; c.stroke();
      } else if (inv > 0) {
        c.strokeStyle = 'rgba(56,189,248,.5)'; c.lineWidth = 2;
        c.beginPath(); c.arc(x, y, 32 * k, 0, 6.283); c.stroke();
      }
      c.globalAlpha = 1;
    }

    function drawEnemy(c, e) {
      var x = e.x, y = e.y, k = s;
      c.save();
      if (e.type === 'drone') {
        halo(c, x, y, 'rgb(244,63,94)', 26 * k);
        var dgr = c.createLinearGradient(0, y - 12 * k, 0, y + 14 * k);
        dgr.addColorStop(0, '#fb7185'); dgr.addColorStop(1, '#881337');
        c.fillStyle = dgr; c.strokeStyle = '#4c0519'; c.lineWidth = 1.5 * k; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(x, y + 14 * k); c.lineTo(x - 16 * k, y - 6 * k); c.lineTo(x - 8 * k, y - 12 * k); c.lineTo(x + 8 * k, y - 12 * k); c.lineTo(x + 16 * k, y - 6 * k); c.closePath(); c.fill(); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(x - 14 * k, y - 6 * k); c.lineTo(x, y + 10 * k); c.lineTo(x + 14 * k, y - 6 * k); c.stroke();
        c.fillStyle = '#fb7185'; c.beginPath(); c.arc(x, y - 3 * k, 6 * k, 0, 6.283); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y - 3 * k, 2.5 * k, 0, 6.283); c.fill();
      } else if (e.type === 'dart') {
        halo(c, x, y, 'rgb(250,204,21)', 24 * k);
        var dtg = c.createLinearGradient(x - 11 * k, 0, x + 11 * k, 0);
        dtg.addColorStop(0, '#a16207'); dtg.addColorStop(0.5, '#fde047'); dtg.addColorStop(1, '#a16207');
        c.fillStyle = dtg; c.strokeStyle = '#713f12'; c.lineWidth = 1.5 * k; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(x, y + 16 * k); c.lineTo(x - 11 * k, y - 12 * k); c.lineTo(x, y - 5 * k); c.lineTo(x + 11 * k, y - 12 * k); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#fef08a'; c.beginPath(); c.arc(x, y + 2 * k, 3 * k, 0, 6.283); c.fill();
      } else if (e.type === 'mine') {
        halo(c, x, y, 'rgb(251,146,60)', 28 * k);
        var mng = c.createRadialGradient(x - 4 * k, y - 4 * k, 1, x, y, 11 * k);
        mng.addColorStop(0, '#c2410c'); mng.addColorStop(1, '#431407');
        c.fillStyle = mng; c.beginPath(); c.arc(x, y, 11 * k, 0, 6.283); c.fill();
        c.strokeStyle = '#fb923c'; c.lineWidth = 3 * k;
        for (var sp2 = 0; sp2 < 8; sp2++) { var sa2 = sp2 * 0.785 + e.ph * 0.3; c.beginPath(); c.moveTo(x + Math.cos(sa2) * 10 * k, y + Math.sin(sa2) * 10 * k); c.lineTo(x + Math.cos(sa2) * 16 * k, y + Math.sin(sa2) * 16 * k); c.stroke(); }
        c.fillStyle = Math.floor(e.ph * 2) % 2 ? '#fde047' : '#ef4444'; c.beginPath(); c.arc(x, y, 4 * k, 0, 6.283); c.fill();
      } else if (e.type === 'boss') {
        halo(c, x, y, 'rgb(244,114,182)', 80 * k);
        var bg = c.createLinearGradient(x - 60 * k, 0, x + 60 * k, 0);
        bg.addColorStop(0, '#4c1d95'); bg.addColorStop(0.5, '#a21caf'); bg.addColorStop(1, '#4c1d95');
        c.fillStyle = bg;
        c.beginPath(); c.moveTo(x - 60 * k, y - 10 * k); c.lineTo(x - 30 * k, y - 30 * k); c.lineTo(x + 30 * k, y - 30 * k); c.lineTo(x + 60 * k, y - 10 * k);
        c.lineTo(x + 46 * k, y + 22 * k); c.lineTo(x + 14 * k, y + 30 * k); c.lineTo(x - 14 * k, y + 30 * k); c.lineTo(x - 46 * k, y + 22 * k); c.closePath(); c.fill();
        c.strokeStyle = '#2e1065'; c.lineWidth = 2 * k; c.stroke();
        c.strokeStyle = 'rgba(240,171,252,.45)'; c.lineWidth = 1.5 * k;
        c.beginPath(); c.moveTo(x - 50 * k, y - 8 * k); c.lineTo(x - 28 * k, y - 24 * k); c.lineTo(x + 28 * k, y - 24 * k); c.lineTo(x + 50 * k, y - 8 * k); c.stroke();
        c.fillStyle = Math.floor(t * 3) % 2 ? '#fde047' : '#f97316';
        for (var bl = -2; bl <= 2; bl++) { if (!bl) continue; c.beginPath(); c.arc(x + bl * 22 * k, y + 14 * k, 2.5 * k, 0, 6.283); c.fill(); }
        c.fillStyle = '#f0abfc'; c.beginPath(); c.ellipse(x, y - 4 * k, 18 * k, 12 * k, 0, 0, 6.283); c.fill();
        var eyeX = Math.max(-8, Math.min(8, (ship.x - x) / 20)) * k;
        c.fillStyle = '#1e1b4b'; c.beginPath(); c.arc(x + eyeX, y - 3 * k, 7 * k, 0, 6.283); c.fill();
        c.fillStyle = '#f43f5e'; c.beginPath(); c.arc(x + eyeX, y - 3 * k, 3 * k, 0, 6.283); c.fill();
        c.fillStyle = '#fb923c';
        for (var g2 = -1; g2 <= 1; g2 += 2) { c.fillRect(x + g2 * 40 * k - 4 * k, y + 14 * k, 8 * k, 14 * k); }
        c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(x - 50 * k, y - 46 * k, 100 * k, 6 * k);
        c.fillStyle = '#f43f5e'; c.fillRect(x - 50 * k, y - 46 * k, 100 * k * (e.hp / e.max), 6 * k);
      } else if (e.type === 'tank') {
        halo(c, x, y, 'rgb(168,85,247)', 40 * k);
        var tg = c.createLinearGradient(0, y - 15 * k, 0, y + 15 * k);
        tg.addColorStop(0, '#a855f7'); tg.addColorStop(0.55, '#6b21a8'); tg.addColorStop(1, '#3b0764');
        c.fillStyle = tg; c.strokeStyle = '#2e1065'; c.lineWidth = 1.5 * k;
        c.beginPath(); c.ellipse(x, y, 26 * k, 15 * k, 0, 0, 6.283); c.fill(); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.ellipse(x, y - 2 * k, 22 * k, 5 * k, 0, 0, 6.283); c.fill();
        var dm = c.createRadialGradient(x - 4 * k, y - 10 * k, 1, x, y - 5 * k, 13 * k);
        dm.addColorStop(0, '#fae8ff'); dm.addColorStop(0.5, '#c084fc'); dm.addColorStop(1, '#7e22ce');
        c.fillStyle = dm; c.beginPath(); c.ellipse(x, y - 5 * k, 13 * k, 10 * k, 0, Math.PI, 0); c.ellipse(x, y - 5 * k, 13 * k, 3 * k, 0, 0, Math.PI); c.fill();
        c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(x - 5 * k, y - 10 * k, 3 * k, 1.8 * k, -0.5, 0, 6.283); c.fill();
        for (var i = -2; i <= 2; i++) { c.fillStyle = Math.floor(t * 6 + i) % 3 ? '#f0abfc' : '#fff'; c.beginPath(); c.arc(x + i * 9 * k, y + 7 * k, 2.4 * k, 0, 6.283); c.fill(); }
        c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(x - 22 * k, y - 28 * k, 44 * k, 4 * k);
        c.fillStyle = '#4ade80'; c.fillRect(x - 22 * k, y - 28 * k, 44 * k * (e.hp / e.max), 4 * k);
      } else {
        c.translate(x, y); c.rotate(e.rot);
        var rkg = c.createRadialGradient(-e.r * 0.4, -e.r * 0.4, e.r * 0.1, 0, 0, e.r * 1.1);
        rkg.addColorStop(0, '#a8a29e'); rkg.addColorStop(0.6, '#78716c'); rkg.addColorStop(1, '#3f3a36');
        c.fillStyle = rkg; c.strokeStyle = '#292524'; c.lineWidth = 2;
        c.beginPath();
        for (var p = 0; p < e.pts.length; p++) {
          var a = p / e.pts.length * 6.283;
          c.lineTo(Math.cos(a) * e.pts[p], Math.sin(a) * e.pts[p]);
        }
        c.closePath(); c.fill(); c.stroke();
        [[0.3, -0.2, 0.22], [-0.35, 0.3, 0.15], [0.1, 0.45, 0.1]].forEach(function (cr) { // кратеры с тенью и бликом
          c.fillStyle = 'rgba(41,37,36,.55)'; c.beginPath(); c.arc(e.r * cr[0], e.r * cr[1], e.r * cr[2], 0, 6.283); c.fill();
          c.strokeStyle = 'rgba(214,211,209,.35)'; c.lineWidth = 1; c.beginPath(); c.arc(e.r * cr[0], e.r * cr[1], e.r * cr[2], 0.2, 2.2); c.stroke();
        });
      }
      if (e.flash > 0) { c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(e.type === 'rock' ? 0 : x, e.type === 'rock' ? 0 : y, e.r, 0, 6.283); c.fill(); }
      c.restore();
    }

    return {
      reset: function () {
        s = Math.min(api.W / 400, api.H / 640) * 1.1;
        ship = { x: api.W / 2, y: api.H - 90 * s, tx: api.W / 2, ty: api.H - 90 * s };
        bullets = []; ebullets = []; enemies = []; caps = []; parts = []; rings = []; keys = {};
        D = DIFF[api.diff];
        shieldT = 0; bossT = 0; bossN = 0; boss = null;
        planet = { x: rnd(0.15, 0.85), y: -0.3, r: rnd(40, 70), hue: Math.random() < 0.5 ? ['#f97316', '#7c2d12'] : ['#38bdf8', '#1e3a8a'] };
        t = 0; fireT = 0; spawnT = 1.2; inv = 0; hp = D.hp; weapon = 1; rapidT = 0; shake = 0; endT = 0; waveN = 0; anchor = null;
        bombs = api.diff === 3 ? 0 : 1; killsN = 0; chain = 0; chainT = 0; magnetT = 0; bombFx = 0;
        stars = [];
        for (var i = 0; i < 110; i++) stars.push({ x: Math.random() * api.W, y: Math.random() * api.H, z: rnd(0.2, 1) });
      },
      idle: function (dt) {
        t += dt;
        stars.forEach(function (st) { st.y += st.z * 60 * s * dt; if (st.y > api.H) { st.y = 0; st.x = Math.random() * api.W; } });
      },
      key: function (k, down) { keys[k] = down; if (down && (k === 'a' || k === 'b')) useBomb(); },
      input: function (type, d) {
        if (type === 'down' && bombBtn && Math.hypot(d.x - bombBtn[0], d.y - bombBtn[1]) < bombBtn[2] + 8) { useBomb(); return; }
        if (type === 'down') anchor = { fx: d.x, fy: d.y, sx: ship.tx, sy: ship.ty };
        else if (type === 'move' && anchor) {
          ship.tx = anchor.sx + (d.x - anchor.fx) * 1.25;
          ship.ty = anchor.sy + (d.y - anchor.fy) * 1.25;
        } else if (type === 'up') anchor = null;
      },
      update: function (dt) {
        t += dt;
        var W = api.W, H = api.H;
        if (shake > 0) shake -= dt;
        if (inv > 0) inv -= dt;
        if (chainT > 0) { chainT -= dt; if (chainT <= 0) chain = 0; }
        if (magnetT > 0) magnetT -= dt;
        if (bombFx > 0) bombFx -= dt;
        stars.forEach(function (st) { st.y += st.z * 160 * s * dt; if (st.y > H) { st.y = 0; st.x = Math.random() * W; } });
        if (endT > 0) {
          endT -= dt;
          if (endT <= 0) { api.gameOver(); return; }
        } else {
          var sp = 420 * s * dt;
          if (keys.left) ship.tx -= sp; if (keys.right) ship.tx += sp;
          if (keys.up) ship.ty -= sp; if (keys.down) ship.ty += sp;
          ship.tx = Math.max(24 * s, Math.min(W - 24 * s, ship.tx));
          ship.ty = Math.max(H * 0.35, Math.min(H - 30 * s, ship.ty));
          ship.x += (ship.tx - ship.x) * Math.min(1, dt * 18);
          ship.y += (ship.ty - ship.y) * Math.min(1, dt * 18);
          // стрельба
          fireT -= dt;
          if (fireT <= 0) {
            fireT = 0.17;
            var bs = -620 * s;
            bullets.push({ x: ship.x, y: ship.y - 24 * s, vx: 0, vy: bs });
            if (weapon >= 2) { bullets.push({ x: ship.x - 14 * s, y: ship.y - 4 * s, vx: 0, vy: bs }); bullets.push({ x: ship.x + 14 * s, y: ship.y - 4 * s, vx: 0, vy: bs }); }
            if (weapon >= 3) { bullets.push({ x: ship.x - 10 * s, y: ship.y - 10 * s, vx: -160 * s, vy: bs }); bullets.push({ x: ship.x + 10 * s, y: ship.y - 10 * s, vx: 160 * s, vy: bs }); }
          }
          if (shieldT > 0) shieldT -= dt;
          bossT += dt;
          if (!boss && bossT > 60) {
            bossT = 0; bossN++;
            var bhp = Math.round((40 + bossN * 25) * (0.7 + api.diff * 0.25));
            boss = { type: 'boss', x: W / 2, y: -80 * s, hp: bhp, max: bhp, r: 50 * s, vy: 50 * s, shot: 2, ph: 0, pat: 0 };
            enemies.push(boss);
            api.toast(api.t('space.boss')); api.sound('life'); api.vibrate(100);
          }
          spawnT -= dt;
          if (spawnT <= 0 && !boss) { spawnWave(); spawnT = Math.max(1.1, 3.2 - t / 50) * D.spawn; }
        }
        bullets = bullets.filter(function (b) { b.x += b.vx * dt; b.y += b.vy * dt; return b.y > -20 && b.x > -20 && b.x < W + 20; });
        ebullets = ebullets.filter(function (b) {
          b.x += b.vx * dt; b.y += b.vy * dt;
          if (endT <= 0 && Math.abs(b.x - ship.x) < 12 * s && Math.abs(b.y - ship.y) < 18 * s) { hitPlayer(); return false; }
          return b.y < H + 20 && b.y > -20 && b.x > -20 && b.x < W + 20;
        });
        for (var i = enemies.length - 1; i >= 0; i--) {
          var e = enemies[i];
          if (e.flash > 0) e.flash -= dt;
          if (e.type === 'drone') { e.y += e.vy * dt; e.x += Math.sin(t * 2.4 + e.ph) * 90 * s * dt; }
          else if (e.type === 'dart') { e.y += e.vy * dt; e.x += (ship.x - e.x) * 0.6 * dt; }
          else if (e.type === 'tank') {
            if (e.y < H * 0.22) e.y += e.vy * dt;
            e.x += e.dir * 60 * s * dt;
            if (e.x < 40 * s || e.x > W - 40 * s) e.dir = -e.dir;
            e.shot -= dt;
            if (e.shot <= 0 && endT <= 0) {
              e.shot = Math.max(0.8, 1.8 - t / 80) / D.fire;
              var a = Math.atan2(ship.y - e.y, ship.x - e.x), v = 230 * s * D.bs;
              for (var q = -1; q <= 1; q++) ebullets.push({ x: e.x, y: e.y + 10 * s, vx: Math.cos(a + q * 0.25) * v, vy: Math.sin(a + q * 0.25) * v });
            }
          } else if (e.type === 'boss') {
            if (e.y < H * 0.17) e.y += e.vy * dt;
            e.ph += dt; e.x = W / 2 + Math.sin(e.ph * 0.8) * (W / 2 - 70 * s);
            e.shot -= dt;
            if (e.shot <= 0 && endT <= 0 && e.y > 0) {
              e.pat++;
              var bv = 210 * s * D.bs;
              if (e.pat % 3 === 0) { for (var rg = 0; rg < 14; rg++) { var ra = rg / 14 * 6.283 + e.ph; ebullets.push({ x: e.x, y: e.y, vx: Math.cos(ra) * bv, vy: Math.sin(ra) * bv }); } }
              else { var aa = Math.atan2(ship.y - e.y, ship.x - e.x); for (var q2 = -2; q2 <= 2; q2++) ebullets.push({ x: e.x + q2 * 10 * s, y: e.y + 26 * s, vx: Math.cos(aa + q2 * 0.14) * bv * 1.2, vy: Math.sin(aa + q2 * 0.14) * bv * 1.2 }); }
              e.shot = Math.max(0.6, 1.4 - bossN * 0.1) / Math.sqrt(D.fire);
            }
          } else if (e.type === 'mine') {
            e.y += e.vy * dt; e.ph += dt * 3;
            if (e.y > H * 0.6 && endT <= 0) { kill(e, i); continue; }
          } else { e.y += e.vy * dt; e.x += e.vx * dt; e.rot += e.vr * dt; }
          if (e.type === 'drone' && Math.random() < dt * 0.25 * D.fire * Math.min(2, 1 + t / 60) && e.y > 0 && endT <= 0) {
            ebullets.push({ x: e.x, y: e.y + 12 * s, vx: 0, vy: 260 * s * D.bs });
          }
          // попадания
          var dead = false;
          for (var j = bullets.length - 1; j >= 0; j--) {
            var b = bullets[j];
            if (Math.abs(b.x - e.x) < e.r * (e.type === 'boss' ? 1.2 : 1) && Math.abs(b.y - e.y) < e.r * (e.type === 'boss' ? 0.6 : 1) + 8 * s) {
              bullets.splice(j, 1); e.hp--; e.flash = 0.08;
              parts.push({ x: b.x, y: b.y, vx: rnd(-60, 60) * s, vy: rnd(-60, 60) * s, life: 0.2, col: '#fff', sz: 2 * s });
              if (e.hp <= 0) { kill(e, i); dead = true; break; }
            }
          }
          if (dead) continue;
          if (endT <= 0 && Math.hypot(e.x - ship.x, e.y - ship.y) < e.r + 14 * s) {
            hitPlayer();
            if (e.type !== 'tank' && e.type !== 'boss') { kill(e, i); continue; }
          }
          if (e.y > H + 50 * s) enemies.splice(i, 1);
        }
        for (var c2 = caps.length - 1; c2 >= 0; c2--) {
          var cp = caps[c2];
          cp.y += 110 * s * dt;
          if (magnetT > 0) { cp.x += (ship.x - cp.x) * Math.min(1, dt * 4); cp.y += (ship.y - cp.y) * Math.min(1, dt * 4); }
          if (Math.hypot(cp.x - ship.x, cp.y - ship.y) < 30 * s && endT <= 0) {
            caps.splice(c2, 1); api.sound('bonus'); api.vibrate(20); api.addScore(100);
            if (cp.type === 'H') { hp = Math.min(5, hp + 1); api.toast(api.t('space.repair')); }
            else if (cp.type === 'S') { shieldT = 10; api.toast(api.t('space.shield')); }
            else if (cp.type === 'M') { magnetT = 12; api.toast(api.t('space.magnet')); }
            else { weapon = Math.min(3, weapon + 1); api.toast(api.t(weapon === 3 ? 'space.gunMax' : 'space.gunUp')); }
          } else if (cp.y > H + 20) caps.splice(c2, 1);
        }
        parts = parts.filter(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97; p.vy *= 0.97; p.life -= dt; return p.life > 0; });
        rings = rings.filter(function (r) { r.life -= dt; r.r += (r.max - r.r) * Math.min(1, dt * 10); return r.life > 0; });
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        if (!bgOff || bgKey !== W + 'x' + H) buildBg();
        c.drawImage(bgOff, 0, 0, W, H);
        // планета
        if (planet) {
          planet.y += 0.0004 * (endT > 0 ? 0 : 1);
          if (planet.y > 1.4) { planet.y = -0.4; planet.x = rnd(0.15, 0.85); }
          var px = planet.x * W, py = planet.y * H, pr = planet.r * s;
          if (!planetOff || planetKey !== planet.hue[0] + pr) buildPlanet();
          c.globalAlpha = 0.8; c.drawImage(planetOff, px - pr * 2, py - pr * 2, pr * 4, pr * 4); c.globalAlpha = 1;
        }
        stars.forEach(function (st) {
          c.globalAlpha = st.z * 0.9; c.fillStyle = st.z > 0.75 ? '#e0f2fe' : '#fff';
          if (st.z > 0.6) { var sw = st.z * 1.6 * s; c.fillRect(st.x - sw / 2, st.y, sw, st.z * (2 + st.z * 6) * s); }
          else { c.beginPath(); c.arc(st.x, st.y, st.z * 1.3 * s, 0, 6.283); c.fill(); }
        });
        c.globalAlpha = 1;
        c.save();
        if (shake > 0) c.translate(rnd(-1, 1) * 10 * shake * s, rnd(-1, 1) * 10 * shake * s);
        // пули
        bullets.forEach(function (b) {
          if (api.quality > 0) c.drawImage(glow('rgb(244,114,182)'), b.x - 8 * s, b.y - 14 * s, 16 * s, 26 * s);
          c.fillStyle = '#f472b6'; c.beginPath(); c.ellipse(b.x, b.y - 1 * s, 2.6 * s, 8 * s, 0, 0, 6.283); c.fill();
          c.fillStyle = '#fff'; c.beginPath(); c.ellipse(b.x, b.y - 2 * s, 1.2 * s, 6 * s, 0, 0, 6.283); c.fill();
        });
        ebullets.forEach(function (b) {
          halo(c, b.x, b.y, 'rgb(249,115,22)', 12 * s);
          var eg = c.createRadialGradient(b.x - 1.5 * s, b.y - 1.5 * s, 0.5, b.x, b.y, 5 * s);
          eg.addColorStop(0, '#fff7ed'); eg.addColorStop(0.5, '#fdba74'); eg.addColorStop(1, '#ea580c');
          c.fillStyle = eg; c.beginPath(); c.arc(b.x, b.y, 5 * s, 0, 6.283); c.fill();
        });
        enemies.forEach(function (e) { drawEnemy(c, e); });
        caps.forEach(function (cp) {
          var col = cp.type === 'H' ? '#4ade80' : cp.type === 'S' ? '#38bdf8' : cp.type === 'M' ? '#c084fc' : '#f472b6';
          var rgbc = 'rgb(' + parseInt(col.slice(1, 3), 16) + ',' + parseInt(col.slice(3, 5), 16) + ',' + parseInt(col.slice(5, 7), 16) + ')';
          halo(c, cp.x, cp.y, rgbc, 26 * s);
          var cpg2 = c.createRadialGradient(cp.x - 4 * s, cp.y - 4 * s, 1, cp.x, cp.y, 13 * s);
          cpg2.addColorStop(0, '#fff'); cpg2.addColorStop(0.35, col); cpg2.addColorStop(1, 'rgba(15,23,42,.9)');
          c.fillStyle = cpg2; c.beginPath(); c.arc(cp.x, cp.y, 13 * s, 0, 6.283); c.fill();
          c.strokeStyle = '#fff'; c.globalAlpha = 0.5 + 0.4 * Math.sin(t * 6); c.lineWidth = 1.5 * s; c.beginPath(); c.arc(cp.x, cp.y, 15 * s, 0, 6.283); c.stroke(); c.globalAlpha = 1;
          c.fillStyle = '#0f172a'; c.font = '900 ' + Math.round(14 * s) + 'px system-ui, sans-serif';
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(cp.type === 'H' ? '+' : cp.type === 'S' ? '◇' : cp.type === 'M' ? 'U' : 'P', cp.x, cp.y + 1);
        });
        if (endT <= 0) drawShip(c);
        parts.forEach(function (p) { c.globalAlpha = Math.min(1, p.life * 2); c.fillStyle = p.col; c.beginPath(); c.arc(p.x + p.sz / 2, p.y + p.sz / 2, p.sz * 0.6, 0, 6.283); c.fill(); });
        rings.forEach(function (r) { c.globalAlpha = r.life * 2; c.strokeStyle = r.col; c.lineWidth = 3 * s; c.beginPath(); c.arc(r.x, r.y, r.r, 0, 6.283); c.stroke(); });
        c.globalAlpha = 1;
        c.restore();
        // HUD: корпус и оружие
        for (var i = 0; i < 5; i++) {
          var hx0 = 12 * s + i * 16 * s;
          c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.roundRect ? c.roundRect(hx0 - 1, 13 * s, 12 * s + 2, 8 * s + 2, 3 * s) : c.rect(hx0 - 1, 13 * s, 12 * s + 2, 8 * s + 2); c.fill();
          c.fillStyle = i < hp ? (hp <= 1 ? '#f87171' : '#4ade80') : 'rgba(255,255,255,.12)';
          c.beginPath(); c.roundRect ? c.roundRect(hx0, 14 * s, 12 * s, 8 * s, 2.5 * s) : c.rect(hx0, 14 * s, 12 * s, 8 * s); c.fill();
          if (i < hp) { c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(hx0 + 2 * s, 15 * s, 8 * s, 2 * s); }
        }
        c.font = '700 ' + Math.round(11 * s) + 'px system-ui, sans-serif'; c.textAlign = 'right'; c.textBaseline = 'top';
        c.fillStyle = '#f472b6'; c.fillText(api.t('space.gun') + ' ' + 'I'.repeat(weapon), W - 12 * s, 12 * s);
        c.textAlign = 'left'; c.fillStyle = 'rgba(255,255,255,.45)'; c.fillText(api.t('space.wave') + ' ' + waveN, 12 * s, 28 * s);
        if (chain >= 5) { c.fillStyle = '#fde047'; c.fillText('x' + Math.min(4, 1 + Math.floor(chain / 5)) + ' · ' + chain, 12 * s, 44 * s); }
        if (magnetT > 0) { c.fillStyle = '#c084fc'; c.textAlign = 'right'; c.fillText('U ' + Math.ceil(magnetT), W - 12 * s, 28 * s); }
        // кнопка супербомбы
        var br = 26 * s, bxp = W - br - 14 * s, byp = H - br - 14 * s;
        bombBtn = [bxp, byp, br];
        c.globalAlpha = bombs > 0 ? 0.95 : 0.3;
        var bbg = c.createRadialGradient(bxp - br * 0.3, byp - br * 0.3, 2, bxp, byp, br);
        bbg.addColorStop(0, 'rgba(124,45,18,.85)'); bbg.addColorStop(1, 'rgba(15,23,42,.85)');
        c.fillStyle = bbg; c.strokeStyle = '#fb923c'; c.lineWidth = 3 * s;
        c.beginPath(); c.arc(bxp, byp, br, 0, 6.283); c.fill(); c.stroke();
        c.strokeStyle = 'rgba(253,186,116,.35)'; c.lineWidth = 1; c.beginPath(); c.arc(bxp, byp, br - 5 * s, 0, 6.283); c.stroke();
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 ' + Math.round(20 * s) + 'px system-ui, sans-serif';
        c.fillText('✸', bxp, byp - 2 * s);
        c.font = '900 ' + Math.round(11 * s) + 'px system-ui, sans-serif'; c.fillText('×' + bombs, bxp, byp + 14 * s);
        c.globalAlpha = 1;
        if (bombFx > 0) { c.strokeStyle = 'rgba(255,255,255,' + bombFx + ')'; c.lineWidth = 8 * s; c.beginPath(); c.arc(ship.x, ship.y, (0.6 - bombFx) * Math.max(W, H) * 2, 0, 6.283); c.stroke(); }
      }
    };
  }
};
