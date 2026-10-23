/* Боулинг: 10 фреймов, свайп с подкруткой, физика кеглей */
window.GAMES = window.GAMES || {};
window.GAMES.bowling = {
  title: 'Боулинг',
  desc: 'Страйки, спэры и подкрутка',
  hint: 'Смахни вверх от шара — бросок. Направление свайпа задаёт прицел, скорость — силу, а изгиб в конце свайпа закручивает шар (хук). Проведи пальцем вбок, чтобы сдвинуть шар перед броском. 10 фреймов, настоящий подсчёт очков: страйк — 10 + два следующих броска, спэр — 10 + один. Максимум 300.',
  d0: 'Точный прицел, линия траектории', d1: 'Подсказка начала пути', d2: 'Без подсказок, масло меняется', d3: 'Разброс, непредсказуемое масло',
  colors: ['#7c3aed', '#0f172a'],
  controls: 'none',
  isNew4: true,
  cat: 'arcade',
  medals: [90, 150, 210],
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="bowlingL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b7793f"/><stop offset="1" stop-color="#f3c98b"/></linearGradient>' +
    '<linearGradient id="bowlingP" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cbd5e1"/><stop offset=".4" stop-color="#fff"/><stop offset="1" stop-color="#94a3b8"/></linearGradient>' +
    '<radialGradient id="bowlingB" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#c4b5fd"/><stop offset=".45" stop-color="#6d28d9"/><stop offset="1" stop-color="#1e1b4b"/></radialGradient>' +
    '<linearGradient id="bowlingS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e1b4b"/><stop offset="1" stop-color="#4c1d95"/></linearGradient></defs>' +
    '<rect width="100" height="100" rx="18" fill="url(#bowlingS)"/><path d="M38 30h24l30 70H8z" fill="url(#bowlingL)"/><path d="M38 30h24l2 4H36z" fill="#3b2108" opacity=".5"/>' +
    '<path d="M44 30L30 100M50 30v70M56 30l14 70" stroke="#8a5a2b" stroke-width=".8" opacity=".6"/><path d="M45 62l2-5 2 5zM51 62l2-5 2 5z" fill="#3b2108"/>' +
    '<g fill="url(#bowlingP)" stroke="#64748b" stroke-width=".6"><path d="M50 12c-2 0-2.6 3-2 5 .5 2-1.8 4-1.8 8 0 3 1 4.5 1.5 6h4.6c.5-1.5 1.5-3 1.5-6 0-4-2.3-6-1.8-8 .6-2 0-5-2-5z"/>' +
    '<path d="M41 15c-2 0-2.6 3-2 5 .5 2-1.8 4-1.8 8 0 3 1 4.5 1.5 6h4.6c.5-1.5 1.5-3 1.5-6 0-4-2.3-6-1.8-8 .6-2 0-5-2-5z"/><path d="M59 15c-2 0-2.6 3-2 5 .5 2-1.8 4-1.8 8 0 3 1 4.5 1.5 6h4.6c.5-1.5 1.5-3 1.5-6 0-4-2.3-6-1.8-8 .6-2 0-5-2-5z"/></g>' +
    '<path d="M48.3 17.6h3.4M39.3 20.6h3.4M57.3 20.6h3.4" stroke="#dc2626" stroke-width="1.4"/>' +
    '<ellipse cx="54" cy="91" rx="17" ry="4" fill="#000" opacity=".35"/><circle cx="52" cy="74" r="17" fill="url(#bowlingB)"/>' +
    '<circle cx="47" cy="68" r="2.3" fill="#0b0720"/><circle cx="54" cy="67" r="2.3" fill="#0b0720"/><circle cx="51" cy="76" r="2.8" fill="#0b0720"/><ellipse cx="45" cy="63" rx="5" ry="2.6" fill="#fff" opacity=".45" transform="rotate(-30 45 63)"/></svg>',

  create: function (api) {
    var L = 18.29, LHW = 0.527, GW = 0.235, GO = LHW + GW, PIT = L + 1.0, MOD = 1.724, BR = 0.109, PR = 0.06, PH = 0.381, ZC = 7, MB = 7, MP = 1.55, Z0 = -2.2;
    var SPOTS = [[0, 0], [-0.5, 1], [0.5, 1], [-1, 2], [0, 2], [1, 2], [-1.5, 3], [-0.5, 3], [0.5, 3], [1.5, 3]];
    var DIFF = [
      { drift: 0, oil: 11, oilVar: 0, hookVar: 0, guide: 2, sens: 0.55, thr: 0.26 },
      { drift: 0.0022, oil: 11, oilVar: 0.8, hookVar: 0.08, guide: 1, sens: 0.72, thr: 0.3 },
      { drift: 0.0045, oil: 11.5, oilVar: 2, hookVar: 0.18, guide: 0, sens: 0.88, thr: 0.34 },
      { drift: 0.0075, oil: 12, oilVar: 3, hookVar: 0.3, guide: 0, sens: 1, thr: 0.38 }
    ];
    var D, cam = { F: 1, hy: 0, camH: 2, cx: 0, syL: 0 }, laneC = null, laneKey = '', pinSpr = null, ballSpr = null, ballShade = null, cardC = null, cardKey = '';
    var pins, ball, rolls, frame, ballN, tenStart, state, stT, gest, label, oilLen, hookMul, zoomK, rake, newRack, strikeRun, lastSpeed, t, clackT, impact, startUp, preview, firstThrow, endT, rumbleT;

    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function now() { return Date.now() / 1000; }
    function mkC(w, h, s) {
      var cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.ceil(w * s)); cv.height = Math.max(1, Math.ceil(h * s));
      var x = cv.getContext('2d'); if (s !== 1) x.scale(s, s); return { cv: cv, x: x };
    }
    function rrect(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
    }
    function seeded(s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

    /* ---------- камера ---------- */
    function setupCam() {
      var W = api.W, H = api.H, nearW = Math.min(W * 0.8, H * 0.46);
      cam.F = nearW * ZC / (2 * LHW); cam.cx = W / 2;
      var syF = H * 0.935, syHd = Math.max(H * 0.3, 140), r = ZC / (L + ZC), A = (syF - syHd) / (1 - r);
      cam.hy = syF - A; cam.camH = A * ZC / cam.F; cam.syL = syHd;
    }
    function proj(x, y, z) {
      var d = Math.max(0.3, z + ZC), s = cam.F / d;
      return { x: cam.cx + x * s, y: cam.hy + (cam.camH - y) * s, s: s };
    }
    function unprojX(sx, z) { return (sx - cam.cx) * (z + ZC) / cam.F; }

    /* ---------- текстура дорожки (вид сверху) ---------- */
    function paintTex(c, X0, X1, ppx, ppz, hi) {
      var rnd = seeded(hi ? 77 : 13), TH = (PIT - Z0) * ppz, BW = 2 * LHW / 39, m, i, s;
      function X(x) { return (x - X0) * ppx; }
      function Y(z) { return (z - Z0) * ppz; }
      c.fillStyle = '#0d0f19'; c.fillRect(0, 0, (X1 - X0) * ppx, TH);
      for (m = -2; m <= 2; m++) {
        var cm = m * MOD;
        if (cm + MOD / 2 < X0 || cm - MOD / 2 > X1) continue;
        // подход (до линии заступа)
        c.fillStyle = '#d9b27a'; c.fillRect(X(cm - MOD / 2), 0, MOD * ppx, Y(0));
        for (i = 0; i < 16; i++) {
          var ax = cm - MOD / 2 + i * MOD / 16;
          c.fillStyle = 'hsl(' + (33 + rnd() * 5) + ',' + (45 + rnd() * 12) + '%,' + (66 + rnd() * 9) + '%)';
          c.fillRect(X(ax), 0, MOD / 16 * ppx, Y(0));
          c.fillStyle = 'rgba(90,50,15,.25)'; c.fillRect(X(ax), 0, Math.max(0.6, ppx * 0.002), Y(0));
        }
        // разделитель между дорожками
        c.fillStyle = '#121522'; c.fillRect(X(cm - MOD / 2), Y(0), MOD * ppx, TH - Y(0));
        for (s = -1; s <= 1; s += 2) {
          var e1 = cm + s * (GO + 0.012), e2 = cm + s * (MOD / 2 - 0.004);
          c.fillStyle = '#2b3150'; c.fillRect(X(Math.min(e1, e2)), Y(0), Math.max(1, 0.012 * ppx), TH - Y(0));
          // жёлоб: вогнутый металлопластик
          var g0 = cm + s * LHW, g1 = cm + s * GO, gg = c.createLinearGradient(X(g0), 0, X(g1), 0);
          gg.addColorStop(0, '#5b6075'); gg.addColorStop(0.1, '#262a38'); gg.addColorStop(0.5, '#0c0e15'); gg.addColorStop(0.85, '#2a2f40'); gg.addColorStop(1, '#6b7290');
          c.fillStyle = gg; c.fillRect(Math.min(X(g0), X(g1)), Y(0), Math.abs(X(g1) - X(g0)), TH - Y(0));
        }
        // доски
        for (i = 0; i < 39; i++) {
          var bx = cm - LHW + i * BW, secs = [[0, 4.88, 34, 70], [4.88, L - 0.75, 29, 63], [L - 0.75, PIT, 35, 72]];
          for (var k = 0; k < 3; k++) {
            var sc = secs[k];
            c.fillStyle = 'hsl(' + (sc[2] + rnd() * 5) + ',' + (48 + rnd() * 14) + '%,' + (sc[3] - 4 + rnd() * 8) + '%)';
            c.fillRect(X(bx), Y(sc[0]), BW * ppx + 0.5, Y(sc[1]) - Y(sc[0]));
          }
          var ng = hi ? 26 : 8;
          for (k = 0; k < ng; k++) {
            var gz = rnd() * PIT, gl = 0.4 + rnd() * 3, gx = bx + BW * (0.1 + rnd() * 0.8);
            c.strokeStyle = rnd() < 0.7 ? 'rgba(120,62,18,' + (0.05 + rnd() * 0.12) + ')' : 'rgba(255,236,200,' + (0.06 + rnd() * 0.1) + ')';
            c.lineWidth = Math.max(0.5, ppx * (0.0012 + rnd() * 0.002));
            c.beginPath(); c.moveTo(X(gx), Y(gz)); c.quadraticCurveTo(X(gx + (rnd() - 0.5) * BW * 0.4), Y(gz + gl / 2), X(gx + (rnd() - 0.5) * BW * 0.3), Y(Math.min(PIT, gz + gl))); c.stroke();
          }
          // торцевые стыки досок
          c.fillStyle = 'rgba(70,35,8,.35)';
          for (k = 0; k < 3; k++) { var jz = 5 + rnd() * (L - 6.5); c.fillRect(X(bx), Y(jz), BW * ppx, Math.max(0.6, ppz * 0.006)); }
          c.fillStyle = 'rgba(80,40,10,.38)'; c.fillRect(X(bx), Y(0), Math.max(0.5, ppx * 0.0018), TH - Y(0));
        }
        // переход секций
        c.fillStyle = 'rgba(60,30,8,.4)'; c.fillRect(X(cm - LHW), Y(4.88), 2 * LHW * ppx, Math.max(0.8, ppz * 0.008));
        c.fillRect(X(cm - LHW), Y(L - 0.75), 2 * LHW * ppx, Math.max(0.8, ppz * 0.008));
        // стрелки
        var arr = [[5, 4.42], [10, 4.57], [15, 4.72], [20, 4.88], [25, 4.72], [30, 4.57], [35, 4.42]];
        for (i = 0; i < arr.length; i++) {
          var ac = cm - LHW + (arr[i][0] - 0.5) * BW, az = arr[i][1];
          c.fillStyle = '#2a1408'; c.beginPath(); c.moveTo(X(ac - BW * 0.55), Y(az - 0.17)); c.lineTo(X(ac + BW * 0.55), Y(az - 0.17)); c.lineTo(X(ac), Y(az)); c.closePath(); c.fill();
          c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(X(ac - BW * 0.35), Y(az - 0.155)); c.lineTo(X(ac - BW * 0.05), Y(az - 0.155)); c.lineTo(X(ac - 0.003), Y(az - 0.03)); c.closePath(); c.fill();
        }
        // точки дальности и точки подхода
        var dots = [3, 5, 8, 11, 14, 26, 29, 32, 35, 37];
        c.fillStyle = '#2a1408';
        for (i = 0; i < dots.length; i++) { c.beginPath(); c.ellipse(X(cm - LHW + (dots[i] - 0.5) * BW), Y(2.13), 0.011 * ppx, 0.011 * ppz, 0, 0, 6.283); c.fill(); }
        for (i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(X(cm + i * 0.2), Y(-0.6), 0.014 * ppx, 0.014 * ppz, 0, 0, 6.283); c.fill(); c.beginPath(); c.ellipse(X(cm + i * 0.2), Y(-1.8), 0.014 * ppx, 0.014 * ppz, 0, 0, 6.283); c.fill(); }
        // точки установки кеглей
        for (i = 0; i < 10; i++) {
          var px = cm + SPOTS[i][0] * 0.3048, pz = L + SPOTS[i][1] * 0.2639;
          c.fillStyle = 'rgba(60,25,5,.55)'; c.beginPath(); c.ellipse(X(px), Y(pz), 0.028 * ppx, 0.028 * ppz, 0, 0, 6.283); c.fill();
        }
        // линия заступа
        c.fillStyle = '#1a0d05'; c.fillRect(X(cm - GO), Y(0) - Math.max(1, ppz * 0.012), 2 * GO * ppx, Math.max(1.5, ppz * 0.024));
        c.fillStyle = '#ef4444'; c.fillRect(X(cm - GO - 0.03), Y(0) - Math.max(1, ppz * 0.02), Math.max(2, 0.04 * ppx), Math.max(2, ppz * 0.04));
        c.fillRect(X(cm + GO - 0.01), Y(0) - Math.max(1, ppz * 0.02), Math.max(2, 0.04 * ppx), Math.max(2, ppz * 0.04));
        if (m !== 0) { c.fillStyle = 'rgba(6,4,18,.42)'; c.fillRect(X(cm - MOD / 2), 0, MOD * ppx, TH); }
      }
    }

    /* ---------- спрайты ---------- */
    function buildSprites() {
      // кегля
      var PW = 52, PHs = 160, o = mkC(PW, PHs, 1), c = o.x, i;
      var prof = [[0, 0.55], [0.06, 0.78], [0.26, 1], [0.42, 0.9], [0.56, 0.58], [0.64, 0.42], [0.7, 0.4], [0.8, 0.5], [0.88, 0.55], [0.95, 0.44], [1, 0.04]];
      function path() {
        c.beginPath(); c.moveTo(PW / 2 - prof[0][1] * PW / 2, PHs);
        for (i = 1; i < prof.length; i++) {
          var a = prof[i - 1], b = prof[i];
          c.quadraticCurveTo(PW / 2 - a[1] * PW / 2, PHs - a[0] * PHs, PW / 2 - (a[1] + b[1]) / 2 * PW / 2, PHs - (a[0] + b[0]) / 2 * PHs);
        }
        c.lineTo(PW / 2, 0);
        for (i = prof.length - 1; i > 0; i--) {
          var a2 = prof[i], b2 = prof[i - 1];
          c.quadraticCurveTo(PW / 2 + a2[1] * PW / 2, PHs - a2[0] * PHs, PW / 2 + (a2[1] + b2[1]) / 2 * PW / 2, PHs - (a2[0] + b2[0]) / 2 * PHs);
        }
        c.lineTo(PW / 2 + prof[0][1] * PW / 2, PHs); c.closePath();
      }
      path();
      var g = c.createLinearGradient(0, 0, PW, 0);
      g.addColorStop(0, '#a5abbb'); g.addColorStop(0.3, '#ffffff'); g.addColorStop(0.55, '#f4f5f8'); g.addColorStop(0.85, '#c3c8d4'); g.addColorStop(1, '#8b91a3');
      c.fillStyle = g; c.fill();
      c.save(); path(); c.clip();
      var rg = c.createLinearGradient(0, 0, PW, 0); rg.addColorStop(0, '#7f1d1d'); rg.addColorStop(0.35, '#ef4444'); rg.addColorStop(1, '#7f1d1d');
      c.fillStyle = rg; c.fillRect(0, PHs * (1 - 0.725), PW, PHs * 0.03); c.fillRect(0, PHs * (1 - 0.672), PW, PHs * 0.03);
      c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(PW * 0.3, 0, PW * 0.08, PHs);
      var bg = c.createLinearGradient(0, PHs, 0, PHs * 0.85); bg.addColorStop(0, 'rgba(60,60,80,.35)'); bg.addColorStop(1, 'rgba(60,60,80,0)');
      c.fillStyle = bg; c.fillRect(0, PHs * 0.85, PW, PHs * 0.15);
      c.restore();
      c.strokeStyle = 'rgba(70,78,100,.55)'; c.lineWidth = 1.5; path(); c.stroke();
      pinSpr = o.cv;
      // шар
      var S = 140, R = S / 2 - 1, b = mkC(S, S, 1), bc = b.x, rnd = seeded(5);
      bc.save(); bc.beginPath(); bc.arc(S / 2, S / 2, R, 0, 6.283); bc.clip();
      var bgr = bc.createRadialGradient(S * 0.4, S * 0.4, 4, S / 2, S / 2, R); bgr.addColorStop(0, '#7c3aed'); bgr.addColorStop(0.6, '#4c1d95'); bgr.addColorStop(1, '#1e1046');
      bc.fillStyle = bgr; bc.fillRect(0, 0, S, S);
      var cols = ['rgba(167,139,250,', 'rgba(34,211,238,', 'rgba(244,114,182,', 'rgba(30,16,70,'];
      for (i = 0; i < 46; i++) {
        bc.strokeStyle = cols[i % 4] + (0.18 + rnd() * 0.35) + ')'; bc.lineWidth = 1.5 + rnd() * 7;
        var x0 = rnd() * S, y0 = rnd() * S;
        bc.beginPath(); bc.moveTo(x0, y0); bc.bezierCurveTo(rnd() * S, rnd() * S, rnd() * S, rnd() * S, rnd() * S, rnd() * S); bc.stroke();
      }
      bc.restore(); ballSpr = b.cv;
      var sh = mkC(S, S, 1), sc2 = sh.x;
      var g1 = sc2.createRadialGradient(S * 0.36, S * 0.3, 2, S / 2, S / 2, R);
      g1.addColorStop(0, 'rgba(255,255,255,.55)'); g1.addColorStop(0.25, 'rgba(255,255,255,.08)'); g1.addColorStop(0.7, 'rgba(0,0,0,0)'); g1.addColorStop(1, 'rgba(0,0,10,.7)');
      sc2.fillStyle = g1; sc2.beginPath(); sc2.arc(S / 2, S / 2, R, 0, 6.283); sc2.fill();
      sc2.fillStyle = 'rgba(255,255,255,.75)'; sc2.beginPath(); sc2.ellipse(S * 0.36, S * 0.27, S * 0.1, S * 0.05, -0.6, 0, 6.283); sc2.fill();
      sc2.strokeStyle = 'rgba(190,170,255,.35)'; sc2.lineWidth = 2; sc2.beginPath(); sc2.arc(S / 2, S / 2, R - 2, 0.5, 2.2); sc2.stroke();
      ballShade = sh.cv;
    }

    /* ---------- статичный слой: зал и дорожка ---------- */
    function buildLane() {
      var W = api.W, H = api.H, Q = api.quality, dpr = Math.min(2, window.devicePixelRatio || 1), cs = Math.min(3, dpr * (Q > 0 ? 1.5 : 1));
      laneKey = W + 'x' + H + 'q' + Q;
      var o = mkC(W, H, cs), c = o.x, i, m, F = cam.F;
      laneC = o.cv;
      var bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#07051a'); bg.addColorStop(0.4, '#140c33'); bg.addColorStop(1, '#0b0820');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      // текстуры
      var hiX = MOD / 2, tw = mkC(5 * MOD * 90, (PIT - Z0) * 40, 1), th = mkC(2 * hiX * (Q > 0 ? 520 : 300), (PIT - Z0) * (Q > 0 ? 110 : 60), 1);
      paintTex(tw.x, -2.5 * MOD, 2.5 * MOD, 90, 40, false);
      paintTex(th.x, -hiX, hiX, Q > 0 ? 520 : 300, Q > 0 ? 110 : 60, true);
      function quad(a, b, cc, dd) { c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(cc.x, cc.y); c.lineTo(dd.x, dd.y); c.closePath(); }
      // яма и занавес
      c.fillStyle = '#030208'; quad(proj(-5, -0.3, PIT), proj(5, -0.3, PIT), proj(5, -0.3, PIT + 0.9), proj(-5, -0.3, PIT + 0.9)); c.fill();
      var cB = proj(0, -0.3, PIT + 0.9).y, cT = proj(0, 1.05, PIT + 0.9).y, xL = proj(-5, 0, PIT + 0.9).x, xR = proj(5, 0, PIT + 0.9).x;
      var cg = c.createLinearGradient(xL, 0, xR, 0);
      cg.addColorStop(0, '#07060f'); cg.addColorStop(0.42, '#140f2a'); cg.addColorStop(0.5, '#231b44'); cg.addColorStop(0.58, '#140f2a'); cg.addColorStop(1, '#07060f');
      c.fillStyle = cg; c.fillRect(xL, cT, xR - xL, cB - cT);
      var fs = proj(0, 0, PIT + 0.9).s;
      for (var fx = -5; fx < 5; fx += 0.09) {
        var sx = proj(fx, 0, PIT + 0.9).x;
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(sx, cT, 0.03 * fs, cB - cT);
        c.fillStyle = 'rgba(255,255,255,.035)'; c.fillRect(sx + 0.045 * fs, cT, 0.02 * fs, cB - cT);
      }
      // «mode 7»: строка экрана -> срез текстуры
      c.setTransform(1, 0, 0, 1, 0, 0);
      var top = Math.floor(proj(0, 0, PIT).y * cs), rows = Math.ceil(H * cs);
      function row(tex, X0, X1, ppx, ppz, a, b, z, r, d) {
        a = Math.max(a, X0); b = Math.min(b, X1); if (b <= a) return;
        var sv = Math.min(tex.height - 1, Math.max(0, Math.floor((z - Z0) * ppz)));
        c.drawImage(tex, (a - X0) * ppx, sv, (b - a) * ppx, 1, (cam.cx + F * a / d) * cs, r, F * (b - a) / d * cs, 1);
      }
      for (var r = Math.max(0, top); r < rows; r++) {
        var sy = (r + 0.5) / cs, den = sy - cam.hy; if (den <= 0) continue;
        var d = F * cam.camH / den, z = d - ZC; if (z > PIT || z < Z0) continue;
        var xl = (0 - cam.cx) * d / F - 0.01, xr = (W - cam.cx) * d / F + 0.01;
        row(tw.cv, -2.5 * MOD, 2.5 * MOD, 90, 40, xl, xr, z, r, d);
        row(th.cv, -hiX, hiX, th.cv.width / (2 * hiX), th.cv.height / (PIT - Z0), xl, xr, z, r, d);
      }
      c.setTransform(cs, 0, 0, cs, 0, 0);
      var pTop = proj(0, 0, PIT).y;
      // туман вдали + свет над кеглями
      var fg = c.createLinearGradient(0, pTop, 0, proj(0, 0, 7).y); fg.addColorStop(0, 'rgba(10,4,30,.45)'); fg.addColorStop(1, 'rgba(10,4,30,0)');
      c.fillStyle = fg; c.fillRect(0, pTop, W, proj(0, 0, 7).y - pTop);
      c.globalCompositeOperation = 'lighter';
      var dk = proj(0, 0, L + 0.4), rw = GO * dk.s * 1.6;
      c.save(); c.translate(dk.x, dk.y); c.scale(1, 0.35);
      var sg = c.createRadialGradient(0, 0, 0, 0, 0, rw); sg.addColorStop(0, 'rgba(255,226,180,.32)'); sg.addColorStop(1, 'rgba(255,226,180,0)');
      c.fillStyle = sg; c.fillRect(-rw, -rw, rw * 2, rw * 2); c.restore();
      // отражения ламп на лаке
      var zs = [1.2, 3.6, 6.8, 10.5, 14.6];
      for (i = 0; i < zs.length; i++) {
        var p = proj(0, 0, zs[i]), ex = 0.42 * p.s;
        c.save(); c.translate(p.x, p.y); c.scale(1, 0.16);
        var lg = c.createRadialGradient(0, 0, 0, 0, 0, ex); lg.addColorStop(0, 'rgba(255,250,235,.16)'); lg.addColorStop(1, 'rgba(255,250,235,0)');
        c.fillStyle = lg; c.fillRect(-ex, -ex, ex * 2, ex * 2); c.restore();
      }
      // длинный блик лака и неоновые отсветы
      var gl = c.createLinearGradient(0, H, 0, pTop); gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(0.6, 'rgba(255,255,255,.05)'); gl.addColorStop(1, 'rgba(255,255,255,.1)');
      c.fillStyle = gl; quad(proj(-0.16, 0, -0.5), proj(0.16, 0, -0.5), proj(0.07, 0, L), proj(-0.07, 0, L)); c.fill();
      var ng = c.createLinearGradient(0, H, 0, pTop); ng.addColorStop(0, 'rgba(236,72,153,0)'); ng.addColorStop(1, 'rgba(236,72,153,.14)');
      c.fillStyle = ng; quad(proj(-0.4, 0, 6), proj(-0.34, 0, 6), proj(-0.34, 0, L), proj(-0.4, 0, L)); c.fill();
      var ng2 = c.createLinearGradient(0, H, 0, pTop); ng2.addColorStop(0, 'rgba(34,211,238,0)'); ng2.addColorStop(1, 'rgba(34,211,238,.14)');
      c.fillStyle = ng2; quad(proj(0.34, 0, 6), proj(0.4, 0, 6), proj(0.4, 0, L), proj(0.34, 0, L)); c.fill();
      c.globalCompositeOperation = 'source-over';
      // кромка ямы
      for (m = -2; m <= 2; m++) {
        var e0 = proj(m * MOD - GO, 0, PIT), e1 = proj(m * MOD + GO, 0, PIT);
        c.fillStyle = m === 0 ? '#5a3a1e' : '#2a1d14'; c.fillRect(e0.x, e0.y - 1, e1.x - e0.x, 2);
      }
      // боковые отбойники (kickbacks)
      var walls = [];
      for (m = -2; m <= 2; m++) { walls.push(m * MOD - GO); walls.push(m * MOD + GO); }
      walls.sort(function (a, b) { return Math.abs(b) - Math.abs(a); });
      for (i = 0; i < walls.length; i++) {
        var wx = walls[i], zA = L - 0.95, zB = PIT + 0.9;
        var a1 = proj(wx, 0, zA), a2 = proj(wx, 0, zB), a3 = proj(wx, 0.62, zB), a4 = proj(wx, 0.62, zA);
        var wg = c.createLinearGradient(a1.x, 0, a2.x, 0); wg.addColorStop(0, '#272c45'); wg.addColorStop(1, '#0c0d18');
        c.fillStyle = wg; quad(a1, a2, a3, a4); c.fill();
        c.strokeStyle = '#4b5378'; c.lineWidth = 1; c.beginPath(); c.moveTo(a4.x, a4.y); c.lineTo(a3.x, a3.y); c.stroke();
        var s1 = proj(wx, 0.36, zA), s2 = proj(wx, 0.36, zB);
        c.strokeStyle = wx < 0 ? 'rgba(236,72,153,.75)' : 'rgba(34,211,238,.75)'; c.lineWidth = Math.max(1, 0.025 * a1.s);
        c.beginPath(); c.moveTo(s1.x, s1.y); c.lineTo(s2.x, s2.y); c.stroke();
      }
      // кегли соседних дорожек
      if (Q > 0) {
        var list = [];
        for (m = -2; m <= 2; m++) if (m) for (i = 9; i >= 0; i--) list.push([m * MOD + SPOTS[i][0] * 0.3048, L + SPOTS[i][1] * 0.2639]);
        list.sort(function (a, b) { return b[1] - a[1]; });
        c.globalAlpha = 0.75;
        for (i = 0; i < list.length; i++) {
          var B = proj(list[i][0], 0, list[i][1]), T = proj(list[i][0], PH, list[i][1]), w = 0.121 * B.s;
          c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(B.x, B.y, w * 0.7, w * 0.25, 0, 0, 6.283); c.fill();
          c.drawImage(pinSpr, B.x - w / 2, T.y, w, B.y - T.y);
        }
        c.globalAlpha = 1;
      }
      // маскировочная панель над кеглями
      var mz = PIT + 0.55, mB = proj(0, 1.0, mz), mT = proj(0, 2.7, mz), ms = mB.s;
      var mg = c.createLinearGradient(0, mT.y, 0, mB.y); mg.addColorStop(0, '#2e1065'); mg.addColorStop(0.55, '#5b21b6'); mg.addColorStop(1, '#1e1046');
      c.fillStyle = mg; c.fillRect(0, mT.y, W, mB.y - mT.y);
      c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(0, mB.y - 0.05 * ms, W, 0.02 * ms);
      for (m = -3; m <= 3; m++) {
        var cx = proj(m * MOD, 1.6, mz), rr = 0.3 * ms;
        c.lineWidth = Math.max(1.2, 0.035 * ms);
        c.strokeStyle = m % 2 ? 'rgba(34,211,238,.9)' : 'rgba(244,114,182,.9)';
        c.beginPath(); c.arc(cx.x, cx.y, rr, 0, 6.283); c.stroke();
        c.strokeStyle = 'rgba(253,224,71,.9)';
        for (i = -1; i <= 1; i++) {
          var px2 = cx.x + i * rr * 0.4, py2 = cx.y + rr * 0.15;
          c.beginPath(); c.ellipse(px2, py2, rr * 0.1, rr * 0.28, 0, 0, 6.283); c.stroke();
          c.beginPath(); c.arc(px2, py2 - rr * 0.38, rr * 0.07, 0, 6.283); c.stroke();
        }
        c.fillStyle = 'rgba(255,255,255,.75)'; c.font = '800 ' + Math.max(7, 0.2 * ms) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(String(17 + m), cx.x + MOD * 0.33 * ms, cx.y - rr * 0.6);
      }
      for (var lx = -6; lx <= 6; lx += 0.22) {
        var lp = proj(lx, 1.06, mz);
        c.fillStyle = 'rgba(255,240,200,.95)'; c.beginPath(); c.arc(lp.x, lp.y, Math.max(0.8, 0.018 * lp.s), 0, 6.283); c.fill();
        if (Q > 0) { var bl = c.createRadialGradient(lp.x, lp.y, 0, lp.x, lp.y, 0.09 * lp.s); bl.addColorStop(0, 'rgba(255,220,150,.35)'); bl.addColorStop(1, 'rgba(255,220,150,0)'); c.fillStyle = bl; c.fillRect(lp.x - 0.09 * lp.s, lp.y - 0.09 * lp.s, 0.18 * lp.s, 0.18 * lp.s); }
      }
      // виньетка
      var vg = c.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.3, W / 2, H * 0.55, Math.max(W, H) * 0.8);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
      tw.cv.width = 1; th.cv.width = 1;
    }

    /* ---------- табло ---------- */
    function calc() {
      var fr = [], i = 0, cum = 0, f, j;
      for (f = 0; f < 10; f++) {
        var o = { m: [], c: null };
        if (i >= rolls.length) { fr.push(o); continue; }
        if (f < 9) {
          var a = rolls[i];
          if (a === 10) { o.m = ['', 'X']; if (rolls.length > i + 2) { cum += 10 + rolls[i + 1] + rolls[i + 2]; o.c = cum; } i += 1; }
          else {
            o.m = [a ? String(a) : '-'];
            if (rolls.length > i + 1) {
              var b = rolls[i + 1];
              o.m.push(a + b === 10 ? '/' : (b ? String(b) : '-'));
              if (a + b === 10) { if (rolls.length > i + 2) { cum += 10 + rolls[i + 2]; o.c = cum; } }
              else { cum += a + b; o.c = cum; }
            }
            i += 2;
          }
        } else {
          var r = rolls.slice(i);
          for (j = 0; j < r.length; j++) {
            var v = r[j], fresh = j === 0 || (j === 1 && r[0] === 10) || (j === 2 && (r[1] === 10 || (r[0] !== 10 && r[0] + r[1] === 10)));
            if (v === 10 && fresh) o.m.push('X');
            else if (!fresh && r[j - 1] + v === 10) o.m.push('/');
            else o.m.push(v ? String(v) : '-');
          }
          if (r.length === 3 || (r.length === 2 && r[0] + r[1] < 10)) { cum += r[0] + r[1] + (r[2] || 0); o.c = cum; }
        }
        fr.push(o);
      }
      return { fr: fr, total: cum };
    }
    function buildCard() {
      var W = api.W, dpr = Math.min(2, window.devicePixelRatio || 1), CH = 62, o = mkC(W, CH, dpr), c = o.x, res = calc(), i, k;
      cardC = o.cv; cardKey = rolls.join(',') + '|' + frame + '|' + W;
      var x0 = 8, fw = (W - 16) / 10.5, y0 = 4;
      c.fillStyle = 'rgba(6,3,20,.72)'; rrect(c, 4, 2, W - 8, CH - 4, 10); c.fill();
      c.strokeStyle = 'rgba(167,139,250,.35)'; c.lineWidth = 1; c.stroke();
      for (i = 0; i < 10; i++) {
        var w = i === 9 ? fw * 1.5 : fw, x = x0 + i * fw, cur = i === frame && state !== 'end', f = res.fr[i], nb = i === 9 ? 3 : 2;
        c.fillStyle = cur ? 'rgba(253,224,71,.16)' : 'rgba(255,255,255,.05)'; rrect(c, x + 1, y0 + 12, w - 2, CH - 22, 4); c.fill();
        c.strokeStyle = cur ? 'rgba(253,224,71,.85)' : 'rgba(255,255,255,.16)'; c.lineWidth = cur ? 1.5 : 1; c.stroke();
        c.fillStyle = cur ? '#fde047' : 'rgba(226,232,240,.55)'; c.font = '700 9px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(String(i + 1), x + w / 2, y0 + 6);
        var bw = Math.min(14, (w - 4) / nb), by = y0 + 13;
        for (k = 0; k < nb; k++) {
          var bx = x + w - 2 - (nb - k) * bw;
          c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1; c.strokeRect(bx + 0.5, by + 0.5, bw - 1, 14);
          var mk = f.m[k];
          if (mk) {
            c.font = '900 11px system-ui, sans-serif';
            c.fillStyle = mk === 'X' ? '#f472b6' : mk === '/' ? '#22d3ee' : mk === '-' ? 'rgba(226,232,240,.5)' : '#f1f5f9';
            c.fillText(mk, bx + bw / 2, by + 8);
          }
        }
        if (f.c !== null) { c.fillStyle = '#fff'; c.font = '800 ' + (fw < 34 ? 12 : 14) + 'px system-ui, sans-serif'; c.fillText(String(f.c), x + w / 2, y0 + 41); }
      }
    }

    /* ---------- кегли и шар ---------- */
    function mkPin(i, lift) {
      return { i: i, x: SPOTS[i][0] * 0.3048, z: L + SPOTS[i][1] * 0.2639, vx: 0, vz: 0, st: 0, tilt: 0, tv: 0, dx: 0, dz: 1, wob: 0, wph: 0, wdx: 0, wdz: 1, spin: 0, lift: lift || 0, drop: 0, gut: false, up: true, rem: false };
    }
    function newBall() {
      var x = ball ? ball.x : 0;
      ball = { x: x, z: 0.42, vx: 0, vz: 0, hook: 0, live: false, gone: false, gutter: false, roll: 0, spin: 0, app: 0, hitT: -1 };
    }
    function hookAt(z) { return z < oilLen ? 0.12 : z < oilLen + 1.2 ? 0.12 + 0.88 * (z - oilLen) / 1.2 : 1; }
    function aimFrom(g) {
      var p = g.pts, a = p[0], b = p[p.length - 1], dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy);
      if (len < 40 || dy > -25) return null;
      var B = proj(ball.x, 0, ball.z), tt = (cam.syL - B.y) / dy, xs = B.x + dx * tt, xT = unprojX(xs, L);
      var ang = clamp(Math.atan2(xT - ball.x, L - ball.z) * D.sens, -0.075, 0.075);
      var hk = 0;
      if (p.length >= 4) {
        var k = Math.floor(p.length * 0.6), q = p[Math.min(k, p.length - 2)], a1 = Math.atan2(b.x - q.x, -(b.y - q.y)), a0 = Math.atan2(dx, -dy);
        var da = a1 - a0; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283;
        hk = clamp(da * 2.2, -1, 1); hk = Math.abs(hk) < 0.1 ? 0 : (hk - (hk > 0 ? 0.1 : -0.1)) / 0.9;
      }
      var dur = Math.max(0.06, b.t - a.t), pxs = len / dur;
      for (var i = p.length - 2; i >= 0; i--) if (b.t - p[i].t >= 0.09) { var dd = Math.hypot(b.x - p[i].x, b.y - p[i].y) / (b.t - p[i].t); pxs = Math.max(pxs, dd); break; }
      var sp = clamp(5.2 + (pxs - 400) / 1800 * 4.8, 5.2, 10);
      return { ang: ang, hook: hk, speed: sp };
    }
    function simPath(a) {
      var x = ball.x, z = ball.z, vx = a.speed * Math.sin(a.ang), vz = a.speed * Math.cos(a.ang), H = a.hook * 1.25 * 8 / a.speed, pts = [], h = 0.02;
      for (var i = 0; i < 300 && z < L + 0.6; i++) {
        vx += H * hookAt(z) * h; vz = Math.max(1, vz - 0.12 * h); x += vx * h; z += vz * h;
        if (i % 2 === 0) pts.push([x, z]);
        if (Math.abs(x) > LHW) break;
      }
      return pts;
    }
    function release(a) {
      var ang = a.ang + (Math.random() * 2 - 1) * D.drift;
      ball.vx = a.speed * Math.sin(ang); ball.vz = a.speed * Math.cos(ang);
      ball.hook = a.hook * 1.25 * 8 / a.speed * hookMul;
      ball.live = true; lastSpeed = a.speed; state = 'roll'; stT = 0; impact = false; firstThrow = true; rumbleT = 0;
      startUp = 0; for (var i = 0; i < pins.length; i++) { pins[i].up = pins[i].st === 0 && !pins[i].rem; if (pins[i].up) startUp++; }
      api.sound('move'); api.vibrate(15);
    }
    function clack(v) {
      if (clackT > 0) return; clackT = 0.035;
      api.tone(900 + Math.random() * 900, 0.05 + Math.random() * 0.03, 'triangle', Math.min(0.09, 0.025 + v * 0.012));
    }
    function hitPin(p, dv, nx, nz) {
      if (p.st === 0) {
        if (dv > D.thr) topple(p, nx, nz, dv);
        else if (dv > 0.06) {
          p.wob = Math.min(0.32, p.wob + dv * 0.9); p.wdx = nx; p.wdz = nz;
          if (p.wob > 0.24 && Math.random() < 0.5) topple(p, nx, nz, dv + 0.3);
        }
      } else if (p.st === 1) p.tv += dv * 2;
      if (dv > 0.15) clack(dv);
    }
    function topple(p, nx, nz, dv) {
      var sp = Math.hypot(p.vx, p.vz), dx = nx, dz = nz;
      if (sp > 0.05) { dx = dx * 0.4 + p.vx / sp * 0.6; dz = dz * 0.4 + p.vz / sp * 0.6; }
      var a = Math.atan2(dx, dz) + (Math.random() - 0.5) * 0.7;
      p.st = 1; p.dx = Math.sin(a); p.dz = Math.cos(a); p.tilt = Math.max(p.tilt, 0.05); p.tv = Math.min(9, 1.2 + dv * 1.3); p.spin = (Math.random() - 0.5) * Math.min(8, dv * 3); p.wob = 0;
    }
    function colls(p) {
      if (p.st === 0) return [[p.x, p.z, PR, 0]];
      var s = Math.sin(p.tilt);
      return [[p.x + p.dx * s * 0.08, p.z + p.dz * s * 0.08, 0.06, 0.08], [p.x + p.dx * s * 0.2, p.z + p.dz * s * 0.2, 0.055, 0.2], [p.x + p.dx * s * 0.32, p.z + p.dz * s * 0.32, 0.042, 0.32]];
    }
    function step(h) {
      var i, j, p, q, a, b;
      if (ball.live) {
        if (!ball.gutter) ball.vx += ball.hook * hookAt(ball.z) * (ball.hitT >= 0 ? 0.3 : 1) * h;
        ball.vz = Math.max(0.8, ball.vz - 0.12 * h);
        ball.x += ball.vx * h; ball.z += ball.vz * h; ball.roll += Math.hypot(ball.vx, ball.vz) * h / BR; ball.spin += ball.hook * h * 2;
        if (!ball.gutter && Math.abs(ball.x) > LHW + 0.005 && ball.z < PIT) {
          ball.gutter = true; api.tone(150, 0.3, 'sawtooth', 0.035);
        }
        if (ball.gutter) { var gx = (ball.x > 0 ? 1 : -1) * (LHW + GW * 0.5); ball.x += (gx - ball.x) * Math.min(1, h * 14); ball.vx = 0; }
        if (Math.abs(ball.x) > GO - BR) { ball.x = (ball.x > 0 ? 1 : -1) * (GO - BR); ball.vx = -ball.vx * 0.3; }
        if (ball.z > PIT + 0.25) { ball.live = false; ball.gone = true; api.tone(70, 0.25, 'sine', 0.06); }
        if (!ball.gutter && ball.z > L - 0.6) {
          for (i = 0; i < pins.length; i++) {
            p = pins[i]; if (p.st === 3 || p.rem || p.lift > 0) continue;
            var cs = colls(p);
            for (j = 0; j < cs.length; j++) {
              var cc = cs[j], dx = cc[0] - ball.x, dz = cc[1] - ball.z, dist = Math.sqrt(dx * dx + dz * dz), mn = BR + cc[2];
              if (dist < mn && dist > 1e-6) {
                var nx = dx / dist, nz = dz / dist, ov = mn - dist;
                p.x += nx * ov * 0.82; p.z += nz * ov * 0.82; ball.x -= nx * ov * 0.18; ball.z -= nz * ov * 0.18;
                var pvx = p.vx + (p.st === 1 ? p.dx * Math.cos(p.tilt) * p.tv * cc[3] : 0), pvz = p.vz + (p.st === 1 ? p.dz * Math.cos(p.tilt) * p.tv * cc[3] : 0);
                var rel = (ball.vx - pvx) * nx + (ball.vz - pvz) * nz;
                if (rel > 0) {
                  var J = 1.3 * rel / (1 / MB + 1 / MP);
                  ball.vx -= J / MB * nx; ball.vz -= J / MB * nz; p.vx += J / MP * nx; p.vz += J / MP * nz;
                  if (ball.hitT < 0) { ball.hitT = 0; impact = true; api.sound('hit'); api.vibrate(30); if (api.fx) api.fx.shake(4); }
                  hitPin(p, J / MP, nx, nz);
                }
                break;
              }
            }
          }
        }
      }
      // кегля-кегля
      for (i = 0; i < pins.length; i++) {
        p = pins[i]; if (p.st === 3 || p.rem || p.lift > 0) continue;
        var ca = colls(p);
        for (j = i + 1; j < pins.length; j++) {
          q = pins[j]; if (q.st === 3 || q.rem || q.lift > 0) continue;
          if (Math.abs(p.x - q.x) > 0.8 || Math.abs(p.z - q.z) > 0.8) continue;
          if (p.st === 0 && q.st === 0 && Math.abs(p.vx) + Math.abs(p.vz) + Math.abs(q.vx) + Math.abs(q.vz) < 0.01) continue;
          var cb = colls(q), done = false;
          for (a = 0; a < ca.length && !done; a++) for (b = 0; b < cb.length && !done; b++) {
            var A = ca[a], Bq = cb[b], ddx = Bq[0] - A[0], ddz = Bq[1] - A[1], dd = Math.sqrt(ddx * ddx + ddz * ddz), mm = A[2] + Bq[2];
            if (dd < mm && dd > 1e-6) {
              var nnx = ddx / dd, nnz = ddz / dd, ovl = (mm - dd) * 0.5;
              p.x -= nnx * ovl; p.z -= nnz * ovl; q.x += nnx * ovl; q.z += nnz * ovl;
              var hx = p.st === 1 ? Math.cos(p.tilt) * p.tv * A[3] : 0, hq = q.st === 1 ? Math.cos(q.tilt) * q.tv * Bq[3] : 0;
              var rv = (p.vx + p.dx * hx - q.vx - q.dx * hq) * nnx + (p.vz + p.dz * hx - q.vz - q.dz * hq) * nnz;
              if (rv > 0) {
                var Jp = 1.4 * rv / 2;
                p.vx -= Jp * nnx; p.vz -= Jp * nnz; q.vx += Jp * nnx; q.vz += Jp * nnz;
                if (p.st === 1) p.tv *= 0.82; if (q.st === 1) q.tv *= 0.82;
                hitPin(q, Jp, nnx, nnz); hitPin(p, Jp * 0.6, -nnx, -nnz);
              }
              done = true;
            }
          }
        }
      }
      // движение кеглей
      for (i = 0; i < pins.length; i++) {
        p = pins[i]; if (p.rem) continue;
        if (p.st === 3) { p.drop += h * 2.2; continue; }
        if (p.st === 1) {
          p.tv += (18 * Math.sin(p.tilt) + 2) * h; p.tilt += p.tv * h;
          if (p.tilt >= Math.PI / 2) { p.tilt = Math.PI / 2; p.st = 2; if (p.tv > 3) clack(p.tv * 0.2); p.tv = 0; }
        }
        if (p.wob > 0) { p.wph += h * 24; p.wob = Math.max(0, p.wob - h * 0.3); }
        var sp = Math.sqrt(p.vx * p.vx + p.vz * p.vz);
        if (sp > 0) { var ns = Math.max(0, Math.min(6, sp) - (p.st === 0 ? 3.5 : 3.5) * h) / sp; p.vx *= ns; p.vz *= ns; }
        p.x += p.vx * h; p.z += p.vz * h;
        if (p.st >= 1 && p.spin) { var ang = Math.atan2(p.dx, p.dz) + p.spin * h; p.dx = Math.sin(ang); p.dz = Math.cos(ang); p.spin *= 1 - h * 1.5; }
        if (Math.abs(p.x) > GO - 0.05) { p.x = (p.x > 0 ? 1 : -1) * (GO - 0.05); p.vx = -p.vx * 0.5; clack(Math.abs(p.vx)); }
        if (Math.abs(p.x) > LHW + 0.01) {
          if (p.st === 0) topple(p, p.x > 0 ? 1 : -1, 0, 1);
          p.gut = true;
        }
        if (p.z > PIT + 0.02) { p.st = 3; p.drop = 0; }
        if (p.z < L - 4) { p.z = L - 4; p.vz = 0; }
      }
    }
    function settled() {
      if (!ball.gone) return false;
      for (var i = 0; i < pins.length; i++) {
        var p = pins[i]; if (p.rem || p.st === 3) continue;
        if (p.st === 1 || p.wob > 0.03 || Math.abs(p.vx) + Math.abs(p.vz) > 0.04) return false;
      }
      return true;
    }
    function isSplit() {
      var up = [], i, j;
      for (i = 0; i < pins.length; i++) if (pins[i].st === 0 && !pins[i].rem) up.push(pins[i].i);
      if (up.length < 2 || up.indexOf(0) >= 0) return false;
      var comp = [up[0]], seen = {}; seen[up[0]] = 1;
      for (i = 0; i < comp.length; i++) for (j = 0; j < up.length; j++) {
        if (seen[up[j]]) continue;
        var a = SPOTS[comp[i]], b = SPOTS[up[j]];
        if (Math.hypot((a[0] - b[0]) * 0.3048, (a[1] - b[1]) * 0.2639) < 0.32) { seen[up[j]] = 1; comp.push(up[j]); }
      }
      return comp.length < up.length;
    }
    function setLabel(txt, col, big, sub) { label = { s: txt, c: col, big: big, sub: sub || '', t: 0 }; }
    function evaluate() {
      var k = 0, i, left = 0;
      for (i = 0; i < pins.length; i++) { var p = pins[i]; if (p.up && p.st !== 0) k++; if (p.st === 0 && !p.rem) left++; }
      var full = startUp === 10, W = api.W, H = api.H;
      rolls.push(k);
      if (full && k === 10) {
        strikeRun++;
        setLabel(strikeRun >= 3 ? api.t('bowl.turkey') : strikeRun === 2 ? api.t('bowl.double') : api.t('bowl.strike'), '#f472b6', true);
        api.sound('win'); api.fx.confetti(70); api.fx.flash('#f0abfc', 0.3); api.vibrate(60);
      } else if (!full && left === 0) {
        strikeRun = 0; setLabel(api.t('bowl.spare'), '#22d3ee', true); api.sound('bonus'); api.fx.flash('#a5f3fc', 0.22); api.fx.burst(W / 2, H * 0.4, '#22d3ee', 30, 260, 4);
      } else {
        strikeRun = 0;
        if (k === 0 && ball.gutter) { setLabel(api.t('bowl.gutter'), '#94a3b8', false); api.sound('life'); }
        else if (k === 0) { setLabel(api.t('bowl.miss'), '#94a3b8', false); }
        else if (full && isSplit()) { setLabel(api.t('bowl.split'), '#fb923c', false, api.t('bowl.pins', k)); api.sound('point'); }
        else { setLabel(api.t('bowl.pins', k), '#fde047', false); api.sound(k >= 7 ? 'coin' : 'point'); }
      }
      // следующий бросок
      var over = false;
      if (frame < 9) {
        if (ballN === 0 && k === 10) { frame++; ballN = 0; newRack = true; }
        else if (ballN === 0) { ballN = 1; newRack = false; }
        else { frame++; ballN = 0; newRack = true; }
        if (frame === 9) tenStart = rolls.length;
      } else {
        var r = rolls.slice(tenStart);
        if (ballN === 0) { ballN = 1; newRack = r[0] === 10; }
        else if (ballN === 1) {
          if (r[0] === 10 || r[0] + r[1] === 10) { ballN = 2; newRack = r[0] === 10 ? r[1] === 10 : true; }
          else over = true;
        } else over = true;
      }
      var res = calc(); api.setScore(res.total);
      cardKey = '';
      if (over) {
        state = 'end'; endT = 0;
        if (res.total === 300) { setLabel(api.t('bowl.perfect'), '#fde047', true); api.fx.confetti(140); }
      } else { state = 'result'; stT = 0; }
    }
    function startSweep() {
      state = 'sweep'; stT = 0; rake = { z: L - 0.4, y: 0.7 };
      for (var i = 0; i < pins.length; i++) { var p = pins[i]; p.vx = p.vz = 0; p.wob = 0; p.spin = 0; }
    }
    function nextRoll() {
      if (newRack) { pins = []; for (var i = 0; i < 10; i++) pins.push(mkPin(i, 0.6)); state = 'rack'; stT = 0; api.sound('rotate'); }
      else { pins = pins.filter(function (p) { return p.st === 0 && !p.rem; }); state = 'aim'; }
      if (D.oilVar && (api.diff >= 3 || newRack)) oilLen = D.oil + (Math.random() - 0.5) * D.oilVar;
      if (D.hookVar) hookMul = 1 + (Math.random() * 2 - 1) * D.hookVar;
      newBall(); cardKey = '';
    }

    /* ---------- рисование ---------- */
    function drawPin(c, p) {
      var s, dx, dz;
      if (p.st === 0) { var w = p.wob * Math.sin(p.wph); s = Math.abs(w); dx = w >= 0 ? p.wdx : -p.wdx; dz = w >= 0 ? p.wdz : -p.wdz; }
      else { s = p.tilt; dx = p.dx; dz = p.dz; }
      var sn = Math.sin(s), co = Math.cos(s), y0 = p.lift - p.drop + (p.gut ? -0.07 : 0) + sn * 0.055;
      var B = proj(p.x, y0, p.z), T = proj(p.x + dx * sn * PH, y0 + co * PH, p.z + dz * sn * PH);
      var wd = 0.121 * B.s, ang = Math.atan2(T.x - B.x, B.y - T.y), len = Math.max(wd * 0.9, Math.hypot(T.x - B.x, T.y - B.y));
      c.save(); c.translate(B.x, B.y); c.rotate(ang); c.drawImage(pinSpr, -wd / 2, -len, wd, len); c.restore();
    }
    function pinShadow(c, p) {
      if (p.st === 3 || p.lift > 0.3) return;
      var a = 0.32 * (1 - p.lift / 0.3);
      if (p.st === 0) {
        var B = proj(p.x + 0.025, 0, p.z + 0.03), r = 0.08 * B.s;
        c.fillStyle = 'rgba(20,8,0,' + a + ')'; c.beginPath(); c.ellipse(B.x, B.y, r, r * 0.38, 0, 0, 6.283); c.fill();
      } else {
        var sn = Math.sin(p.tilt), B1 = proj(p.x, 0, p.z), B2 = proj(p.x + p.dx * (sn * PH + 0.04), 0, p.z + p.dz * (sn * PH + 0.04));
        c.strokeStyle = 'rgba(20,8,0,' + a * 0.8 + ')'; c.lineCap = 'round'; c.lineWidth = 0.1 * B1.s;
        c.beginPath(); c.moveTo(B1.x, B1.y); c.lineTo(B2.x, B2.y); c.stroke(); c.lineCap = 'butt';
      }
    }
    function drawBall(c, refl) {
      var y = ball.gutter ? BR - 0.075 : BR, P = proj(ball.x, refl ? -y : y, ball.z), r = BR * P.s * (0.4 + 0.6 * ball.app);
      if (ball.gone || r < 0.5) return;
      c.save(); c.translate(P.x, P.y);
      if (refl) { c.globalAlpha = 0.1; c.scale(1, -0.6); }
      c.save(); c.rotate(ball.spin); c.drawImage(ballSpr, -r, -r, r * 2, r * 2); c.restore();
      // отверстия для пальцев (вращаются при качении)
      var el = Math.atan2(cam.camH - BR, ball.z + ZC), ce = Math.cos(el), se = Math.sin(el), th = ball.roll;
      var holes = [[-0.2, 0.55, -0.81, 0.12], [0.2, 0.55, -0.81, 0.12], [0, 0.05, -1, 0.15]];
      for (var i = 0; i < holes.length; i++) {
        var hx = holes[i][0], hy = holes[i][1], hz = holes[i][2], n = Math.sqrt(hx * hx + hy * hy + hz * hz);
        hx /= n; hy /= n; hz /= n;
        var ry = hy * Math.cos(th) - hz * Math.sin(th), rz = hy * Math.sin(th) + hz * Math.cos(th);
        var vis = ry * se - rz * ce; if (vis < 0.15) continue;
        var sx = hx * r, sy = -(ry * ce + rz * se) * r, hr = holes[i][3] * r;
        c.fillStyle = 'rgba(5,3,15,.9)'; c.beginPath(); c.ellipse(sx, sy, hr, hr * vis, Math.atan2(sy, sx) + Math.PI / 2, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(200,190,255,.35)'; c.lineWidth = 1; c.stroke();
      }
      c.drawImage(ballShade, -r, -r, r * 2, r * 2);
      c.restore();
    }
    function view() {
      var k = zoomK, ZM = 1.95, s = 1 + k * (ZM - 1), P = proj(0, 0.2, L + 0.4), fx = P.x + (api.W / 2 - P.x) * k, fy = P.y + (api.H * 0.46 - P.y) * k;
      return { s: s, tx: fx - s * P.x, ty: fy - s * P.y };
    }

    return {
      reset: function () {
        D = DIFF[api.diff]; setupCam();
        rolls = []; frame = 0; ballN = 0; tenStart = -1; strikeRun = 0; lastSpeed = 0; t = 0; clackT = 0; label = null; gest = null; preview = null; firstThrow = false; endT = 0; zoomK = 0; rake = null;
        oilLen = D.oil + (Math.random() - 0.5) * D.oilVar; hookMul = 1;
        ball = null; newBall(); newRack = true; pins = []; nextRoll(); cardKey = '';
      },
      resize: function () { setupCam(); laneKey = ''; cardKey = ''; },
      idle: function (dt) { t += dt; },
      input: function (type, d) {
        if (state !== 'aim') { gest = null; preview = null; return; }
        if (type === 'down') { gest = { pts: [{ x: d.x, y: d.y, t: now() }], mode: '', bx: ball.x }; return; }
        if (!gest) return;
        if (type === 'move') {
          gest.pts.push({ x: d.x, y: d.y, t: now() }); if (gest.pts.length > 80) gest.pts.splice(1, 1);
          var dx = d.x - gest.pts[0].x, dy = d.y - gest.pts[0].y;
          if (!gest.mode && dx * dx + dy * dy > 196) gest.mode = (dy < 0 && -dy > Math.abs(dx) * 0.7) ? 'throw' : 'pos';
          if (gest.mode === 'pos') { var s = cam.F / (ball.z + ZC); ball.x = clamp(gest.bx + dx / s, -LHW + BR + 0.02, LHW - BR - 0.02); }
          if (gest.mode === 'throw') { var a = aimFrom(gest); preview = a && D.guide ? simPath(a) : null; }
        } else if (type === 'up') {
          if (gest.mode === 'throw') { gest.pts.push({ x: d.x, y: d.y, t: now() }); var a2 = aimFrom(gest); if (a2) release(a2); }
          gest = null; preview = null;
        }
      },
      update: function (dt) {
        t += dt; stT += dt; if (clackT > 0) clackT -= dt;
        if (label) label.t += dt;
        if (ball.app < 1) ball.app = Math.min(1, ball.app + dt * 3);
        var kT = 0;
        if (state === 'rack') {
          for (var i = 0; i < pins.length; i++) pins[i].lift = Math.max(0, 0.6 * (1 - stT / 0.55));
          if (stT > 0.6) { for (i = 0; i < pins.length; i++) pins[i].lift = 0; state = 'aim'; api.tone(520, 0.06, 'triangle', 0.04); }
        } else if (state === 'roll') {
          var n = Math.ceil(dt / 0.0025); n = Math.min(n, 16);
          for (i = 0; i < n; i++) step(dt / n);
          if (ball.hitT >= 0) ball.hitT += dt;
          kT = ball.live ? clamp((ball.z - 4) / 9, 0, 1) : 1;
          if (ball.live && !ball.gone) { rumbleT -= dt; if (rumbleT <= 0) { rumbleT = 0.11; api.tone(110 + Math.random() * 25, 0.12, 'triangle', 0.018 + lastSpeed * 0.002); } }
          if (settled() || stT > 9) { for (i = 0; i < pins.length; i++) if (pins[i].st === 1) { pins[i].st = 2; pins[i].tilt = Math.PI / 2; } evaluate(); }
        } else if (state === 'result') {
          kT = 1;
          if (stT > (label && label.big ? 1.5 : 1.1)) startSweep();
        } else if (state === 'sweep') {
          var u = stT;
          kT = u < 0.9 ? 1 : 0;
          for (i = 0; i < pins.length; i++) {
            var p = pins[i];
            if (p.st === 0 && !p.rem) p.lift = newRack ? Math.min(0.9, u * 1.6) : u < 0.3 ? u / 0.3 * 0.5 : u < 0.75 ? 0.5 : Math.max(0, 0.5 * (1 - (u - 0.75) / 0.25));
            if (newRack && p.st === 0 && p.lift >= 0.9) p.rem = true;
          }
          rake.y = u < 0.25 ? 0.7 * (1 - u / 0.25) + 0.05 : u < 0.75 ? 0.05 : 0.05 + (u - 0.75) / 0.25 * 0.7;
          if (u > 0.25 && u < 0.75) rake.z = L - 0.4 + (PIT + 0.15 - L + 0.4) * (u - 0.25) / 0.5;
          for (i = 0; i < pins.length; i++) {
            var q = pins[i];
            if (q.st === 1 || q.st === 2) { if (q.z < rake.z + 0.08 && u > 0.25) q.z = rake.z + 0.08; if (q.z > PIT + 0.02) { q.st = 3; q.drop = 0; } }
            if (q.st === 3) q.drop += dt * 2.2;
          }
          if (u > 1.05) { rake = null; nextRoll(); }
        } else if (state === 'end') {
          kT = 0.6; endT += dt;
          if (endT > 2.2) { api.gameOver(); endT = -99; }
        }
        zoomK += (kT - zoomK) * Math.min(1, dt * (kT > zoomK ? 2.2 : 3));
      },
      draw: function (c) {
        var W = api.W, H = api.H, Q = api.quality, i;
        if (!pinSpr) buildSprites();
        if (laneKey !== W + 'x' + H + 'q' + Q) { setupCam(); buildLane(); }
        if (!cardC || cardKey !== rolls.join(',') + '|' + frame + '|' + W) buildCard();
        c.save();
        c.fillStyle = '#07051a'; c.fillRect(0, 0, W, H);
        var v = view();
        c.save(); c.translate(v.tx, v.ty); c.scale(v.s, v.s);
        c.drawImage(laneC, 0, 0, W, H);
        // траектория-подсказка
        if (preview && preview.length > 1) {
          var lim = D.guide === 1 ? 7 : 99;
          for (i = 0; i < preview.length; i += 2) {
            var pp = preview[i]; if (pp[1] > lim) break;
            var P = proj(pp[0], 0.01, pp[1]), al = D.guide === 1 ? 0.9 * (1 - pp[1] / lim) : 0.85 - pp[1] / L * 0.4;
            c.fillStyle = 'rgba(253,224,71,' + al.toFixed(3) + ')'; c.beginPath(); c.ellipse(P.x, P.y, Math.max(1, 0.025 * P.s), Math.max(0.6, 0.009 * P.s), 0, 0, 6.283); c.fill();
          }
        }
        // тени и отражение
        for (i = 0; i < pins.length; i++) if (!pins[i].rem) pinShadow(c, pins[i]);
        if (!ball.gone && ball.z < PIT) {
          var BS = proj(ball.x + 0.03, ball.gutter ? -0.07 : 0, ball.z + 0.06), br = BR * BS.s;
          c.fillStyle = 'rgba(10,4,0,.42)'; c.beginPath(); c.ellipse(BS.x, BS.y, br * 1.05, br * 0.36, 0, 0, 6.283); c.fill();
          if (Q > 0 && !ball.gutter) drawBall(c, true);
        }
        // кегли и шар по глубине
        var items = [];
        for (i = 0; i < pins.length; i++) { var p = pins[i]; if (!p.rem && !(p.st === 3 && p.drop > 0.6)) items.push({ z: p.z + (p.st ? Math.sin(p.tilt) * p.dz * 0.18 : 0), p: p }); }
        if (!ball.gone) items.push({ z: ball.z, b: 1 });
        items.sort(function (a, b) { return b.z - a.z; });
        var pitY = proj(0, 0, PIT).y;
        for (i = 0; i < items.length; i++) {
          var it = items[i], inPit = it.b ? ball.z > PIT : it.p.st === 3;
          if (inPit) { c.save(); c.beginPath(); c.rect(-W, -H, W * 3, pitY + H); c.clip(); }
          if (it.b) drawBall(c, false); else drawPin(c, it.p);
          if (inPit) c.restore();
        }
        // грабли пинсеттера
        if (rake) {
          var r1 = proj(-GO, rake.y + 0.12, rake.z), r2 = proj(GO, rake.y, rake.z);
          var rg = c.createLinearGradient(0, r1.y, 0, r2.y); rg.addColorStop(0, '#94a3b8'); rg.addColorStop(0.5, '#e2e8f0'); rg.addColorStop(1, '#475569');
          c.fillStyle = 'rgba(0,0,0,.3)'; var r3 = proj(-GO, 0, rake.z), r4 = proj(GO, 0, rake.z); c.fillRect(r3.x, r3.y - 2, r4.x - r3.x, 3);
          c.fillStyle = rg; c.fillRect(r1.x, r1.y, r2.x - r1.x, r2.y - r1.y);
          c.fillStyle = '#facc15'; for (i = 0; i < 6; i++) c.fillRect(r1.x + (r2.x - r1.x) * (i / 6 + 0.02), r1.y, (r2.x - r1.x) / 12, (r2.y - r1.y) * 0.4);
        }
        c.restore();
        // свайп
        if (gest && gest.pts.length > 1 && gest.mode === 'throw') {
          c.lineCap = 'round'; c.lineJoin = 'round';
          for (var pass = 0; pass < 2; pass++) {
            c.strokeStyle = pass ? 'rgba(255,255,255,.9)' : 'rgba(167,139,250,.45)'; c.lineWidth = pass ? 3 : 10;
            c.beginPath(); c.moveTo(gest.pts[0].x, gest.pts[0].y); for (i = 1; i < gest.pts.length; i++) c.lineTo(gest.pts[i].x, gest.pts[i].y); c.stroke();
          }
          c.lineCap = 'butt'; c.lineJoin = 'miter';
        }
        // HUD
        c.drawImage(cardC, 0, 0, W, 62);
        function pill(x, y, w, h) { c.fillStyle = 'rgba(6,3,20,.62)'; rrect(c, x, y, w, h, h / 2); c.fill(); c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1; c.stroke(); }
        c.textBaseline = 'middle'; c.font = '800 13px system-ui, sans-serif'; c.textAlign = 'left';
        if (state !== 'end') {
          var fl = api.t('bowl.frame', frame + 1) + ' · ' + api.t('bowl.ball', ballN + 1), fw = c.measureText(fl).width + 22;
          pill(8, 68, fw, 26); c.fillStyle = '#e9d5ff'; c.fillText(fl, 19, 81.5);
        }
        if (lastSpeed && state !== 'aim') {
          var ks = api.t('bowl.kmh', Math.round(lastSpeed * 3.6)), kw = c.measureText(ks).width + 22;
          pill(W - 8 - kw, 68, kw, 26); c.fillStyle = '#a5f3fc'; c.fillText(ks, W - 8 - kw + 11, 81.5);
        }
        if (state === 'aim' && !gest) {
          var B0 = proj(ball.x, 0, ball.z), al2 = 0.5 + 0.3 * Math.sin(t * 4), ar = BR * B0.s;
          c.fillStyle = 'rgba(255,255,255,' + al2 + ')';
          for (var sgn = -1; sgn <= 1; sgn += 2) {
            var ax = B0.x + sgn * (ar + 14 + Math.sin(t * 4) * 3), ay = B0.y - ar * 0.4;
            c.beginPath(); c.moveTo(ax + sgn * 8, ay); c.lineTo(ax, ay - 7); c.lineTo(ax, ay + 7); c.closePath(); c.fill();
          }
          if (!firstThrow) {
            c.textAlign = 'center'; c.font = '800 14px system-ui, sans-serif';
            var tip = api.t('bowl.tip'), tip2 = api.t('bowl.move'), ty0 = H * 0.55;
            c.font = '700 12px system-ui, sans-serif'; var tw2 = c.measureText(tip2).width;
            c.font = '800 15px system-ui, sans-serif'; var tw = Math.min(W - 16, Math.max(c.measureText(tip).width, tw2) + 30);
            c.fillStyle = 'rgba(6,3,20,.7)'; rrect(c, W / 2 - tw / 2, ty0, tw, 52, 14); c.fill(); c.strokeStyle = 'rgba(167,139,250,.45)'; c.lineWidth = 1; c.stroke();
            c.fillStyle = '#fff'; c.fillText(tip, W / 2, ty0 + 17, W - 30);
            c.font = '700 12px system-ui, sans-serif'; c.fillStyle = '#d8b4fe'; c.fillText(tip2, W / 2, ty0 + 37, W - 30);
            // анимированный палец
            var ph = (t % 1.6) / 1.6, fx2 = W / 2 + Math.sin(ph * 3) * 10, fy2 = B0.y - ar - ph * H * 0.22;
            c.globalAlpha = Math.sin(ph * Math.PI) * 0.8; c.fillStyle = '#fff'; c.beginPath(); c.arc(fx2, fy2, 9, 0, 6.283); c.fill();
            c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(fx2, fy2, 14, 0, 6.283); c.stroke(); c.globalAlpha = 1;
          }
        }
        // надпись броска
        if (label && label.t < 2.2) {
          var lt = label.t, sc = lt < 0.25 ? 0.4 + (lt / 0.25) * 0.8 : lt < 0.4 ? 1.2 - (lt - 0.25) / 0.15 * 0.2 : 1, fa = lt > 1.6 ? Math.max(0, 1 - (lt - 1.6) / 0.6) : 1;
          var ly = H * 0.58, fsz = label.big ? Math.min(58, W * 0.14) : Math.min(36, W * 0.09);
          c.save(); c.globalAlpha = fa; c.translate(W / 2, ly); c.scale(sc, sc);
          if (label.big && Q > 0) {
            c.save(); c.rotate(t * 0.6); c.globalCompositeOperation = 'lighter';
            for (i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.fillStyle = 'rgba(253,224,71,.08)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-18, -W * 0.6); c.lineTo(18, -W * 0.6); c.closePath(); c.fill(); }
            c.restore();
          }
          c.textAlign = 'center'; c.font = '900 italic ' + fsz + 'px system-ui, sans-serif';
          c.lineJoin = 'round'; c.lineWidth = fsz * 0.16; c.strokeStyle = 'rgba(20,6,40,.9)'; c.strokeText(label.s, 0, 0);
          var tg = c.createLinearGradient(0, -fsz / 2, 0, fsz / 2); tg.addColorStop(0, '#fff'); tg.addColorStop(0.5, label.c); tg.addColorStop(1, label.c);
          c.fillStyle = tg; c.fillText(label.s, 0, 0);
          if (label.sub) { c.font = '800 ' + Math.round(fsz * 0.45) + 'px system-ui, sans-serif'; c.lineWidth = 4; c.strokeText(label.sub, 0, fsz * 0.75); c.fillStyle = '#fff'; c.fillText(label.sub, 0, fsz * 0.75); }
          c.restore(); c.lineJoin = 'miter';
        }
        if (state === 'end') {
          var tot = calc().total, a3 = Math.min(1, endT * 2);
          c.globalAlpha = a3; c.textAlign = 'center';
          pill(W / 2 - 90, H * 0.5 - 34, 180, 68);
          c.fillStyle = '#e9d5ff'; c.font = '700 13px system-ui, sans-serif'; c.fillText(api.t('bowl.final'), W / 2, H * 0.5 - 14);
          c.fillStyle = '#fde047'; c.font = '900 30px system-ui, sans-serif'; c.fillText(String(tot), W / 2, H * 0.5 + 12);
          c.globalAlpha = 1;
        }
        c.restore();
        c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      }
    };
  }
};
