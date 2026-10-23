/* Пианино: жми на чёрные плитки и играй мелодию */
window.GAMES = window.GAMES || {};
window.GAMES.tiles = {
  title: 'Пианино',
  desc: 'Не пропусти ни одной ноты',
  hint: 'Нажимай на чёрные плитки снизу вверх — каждая играет ноту мелодии. Длинные плитки надо удерживать. Не жми на белое и не пропускай плитки! Скорость постоянно растёт.',
  d0: 'Медленно, 3 ошибки', d1: 'Обычная скорость', d2: 'Быстро', d3: 'Очень быстро',
  colors: ['#0f172a', '#6366f1'],
  controls: 'none',
  multiTouch: true,
  isNew2: true,
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="tilesG1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#312e81"/><stop offset="1" stop-color="#0f172a"/></linearGradient>' +
    '<linearGradient id="tilesG2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#475569"/><stop offset=".55" stop-color="#111827"/><stop offset="1" stop-color="#020617"/></linearGradient>' +
    '<linearGradient id="tilesG3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#818cf8"/><stop offset="1" stop-color="#1e1b4b"/></linearGradient>' +
    '<linearGradient id="tilesG4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0e7ff" stop-opacity=".75"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>' +
    '<rect x="8" y="8" width="84" height="84" rx="14" fill="url(#tilesG1)"/><path d="M30 8 L18 92 H44z" fill="#ec4899" opacity=".35"/><path d="M70 8 L56 92 H84z" fill="#38bdf8" opacity=".35"/>' +
    '<rect x="11" y="11" width="78" height="78" rx="11" fill="url(#tilesG4)"/><path d="M30.5 11v78M50 11v78M69.5 11v78" stroke="#a5b4fc" stroke-width="1.6"/>' +
    '<rect x="12.5" y="56" width="16.5" height="31" rx="3.5" fill="url(#tilesG2)"/><rect x="51.5" y="31" width="16.5" height="26" rx="3.5" fill="url(#tilesG2)"/>' +
    '<rect x="32" y="13" width="16.5" height="24" rx="3.5" fill="url(#tilesG2)"/><rect x="71" y="44" width="16.5" height="43" rx="3.5" fill="url(#tilesG3)"/>' +
    '<g fill="#fff" opacity=".25"><rect x="14.5" y="57.5" width="12.5" height="6" rx="3"/><rect x="53.5" y="32.5" width="12.5" height="6" rx="3"/><rect x="34" y="14.5" width="12.5" height="6" rx="3"/><rect x="73" y="45.5" width="12.5" height="7" rx="3"/></g>' +
    '<path d="M79.25 52 v28" stroke="#c7d2fe" stroke-width="2" stroke-dasharray="2 4"/><circle cx="79.25" cy="80" r="4" fill="#c7d2fe"/>' +
    '<circle cx="21" cy="72" r="9" fill="none" stroke="#818cf8" stroke-width="2.5" opacity=".8"/><path d="M58 50 v-12 l8 -2.5 v12" stroke="#fff" stroke-width="2" fill="none" opacity=".85"/><circle cx="56.5" cy="50.5" r="2.4" fill="#fff" opacity=".85"/><circle cx="64.5" cy="48" r="2.4" fill="#fff" opacity=".85"/></svg>',

  create: function (api) {
    // мелодии (народные/классические — общественное достояние), MIDI-ноты
    var SONGS = [
      [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62, 0, 64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 62, 60, 60, 0,
        62, 62, 64, 60, 62, 64, 65, 64, 60, 62, 64, 65, 64, 62, 60, 62, 55, 0], // Ода к радости
      [60, 60, 67, 67, 69, 69, 67, 0, 65, 65, 64, 64, 62, 62, 60, 0, 67, 67, 65, 65, 64, 64, 62, 0, 67, 67, 65, 65, 64, 64, 62, 0,
        60, 60, 67, 67, 69, 69, 67, 0, 65, 65, 64, 64, 62, 62, 60, 0], // Мерцай, звёздочка
      [76, 75, 76, 75, 76, 71, 74, 72, 69, 0, 60, 64, 69, 71, 0, 64, 68, 71, 72, 0, 64, 76, 75, 76, 75, 76, 71, 74, 72, 69, 0,
        60, 64, 69, 71, 0, 64, 72, 71, 69, 0], // К Элизе
      [67, 64, 64, 65, 62, 62, 60, 62, 64, 65, 67, 67, 67, 0, 67, 64, 64, 65, 62, 62, 60, 64, 67, 67, 60, 0], // Весёлые гуси
      [62, 67, 67, 69, 67, 66, 64, 64, 64, 69, 69, 71, 69, 67, 66, 62, 62, 71, 71, 72, 71, 69, 67, 64, 62, 62, 64, 69, 66, 67, 0] // Рождественская
    ];
    var DIFF = [{ sp: 1.6, acc: 0.012, miss: 3 }, { sp: 2.1, acc: 0.016, miss: 1 }, { sp: 2.7, acc: 0.02, miss: 1 }, { sp: 3.4, acc: 0.024, miss: 1 }];
    var D, rows, speed, scroll, nextRow, song, noteI, t, deadT, missLeft, flashCol, flashRow, flashT, holds, lastCol, started, ripple, hitCount;
    var COLS = 4, RH;
    var SPR = {};

    function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function playNote(m) {
      if (!m) return;
      api.tone(hz(m), 0.45, 'triangle', 0.12);
      api.tone(hz(m) * 2, 0.25, 'sine', 0.03);
    }
    function layout() { RH = Math.max(90, Math.floor(api.H / 4.2)); }
    function addRow() {
      var col;
      do { col = Math.floor(Math.random() * COLS); } while (col === lastCol && Math.random() < 0.7);
      lastCol = col;
      var long = noteI > 6 && Math.random() < 0.12 ? 2 : 1;
      rows.push({ y: nextRow, col: col, len: long, hit: false, held: 0, done: false });
      nextRow += long;
    }
    function rowTop(r) { return api.H - (r.y + r.len - scroll) * RH; }
    function nextNote() {
      var s = SONGS[song], m = s[noteI % s.length];
      noteI++;
      if (!m) { m = s[noteI % s.length]; noteI++; }
      if (noteI >= s.length * 2 && noteI % s.length === 0) song = (song + 1) % SONGS.length;
      return m;
    }
    function fail(col, y) {
      flashCol = col; flashRow = y; flashT = 0.9;
      api.sound('hit'); api.vibrate(220); api.fx.shake(6);
      missLeft--;
      if (missLeft <= 0) deadT = 1.2;
      else api.toast(api.t('tiles.oops', missLeft));
    }

    return {
      reset: function () {
        D = DIFF[api.diff]; layout();
        rows = []; speed = D.sp; scroll = 0; nextRow = 1; noteI = 0; t = 0; deadT = 0; missLeft = D.miss; flashT = 0; holds = {}; lastCol = -1; started = false; ripple = []; hitCount = 0;
        song = Math.floor(Math.random() * SONGS.length);
        for (var i = 0; i < 8; i++) addRow();
      },
      resize: layout,
      idle: function (dt) { t += dt; },
      input: function (type, d) {
        if (deadT > 0) return;
        if (type === 'press') {
          var col = Math.floor(d.x / (api.W / COLS));
          var yRow = scroll + (api.H - d.y) / RH; // строка под пальцем
          // ближайшая неотыгранная плитка
          var target = null;
          for (var i = 0; i < rows.length; i++) if (!rows[i].hit) { target = rows[i]; break; }
          if (!target) return;
          if (target.col === col && yRow >= target.y - 0.35 && yRow <= target.y + target.len + 0.6) {
            target.hit = true; started = true; hitCount++;
            playNote(nextNote());
            api.addScore(1); api.vibrate(8);
            ripple.push({ x: (col + 0.5) * api.W / COLS, y: d.y, life: 0.4 });
            if (target.len > 1) { target.holding = true; holds.cur = target; }
            else target.done = true;
            if (hitCount % 50 === 0) { api.sound('bonus'); api.fx.text(api.W / 2, api.H * 0.3, hitCount + '!', '#a5b4fc', 30); }
          } else {
            // нажатие мимо: на белую плитку
            var other = false;
            for (var j = 0; j < rows.length; j++) { var r = rows[j]; if (!r.hit && r.col === col && yRow >= r.y && yRow <= r.y + r.len) other = true; }
            if (!other) fail(col, Math.floor(yRow));
          }
        } else if (type === 'up' || type === 'multi') {
          var list = type === 'multi' ? d : [];
          if (holds.cur) {
            var h = holds.cur, still = false;
            for (var k = 0; k < list.length; k++) if (Math.floor(list[k].x / (api.W / COLS)) === h.col) still = true;
            if (!still) { h.holding = false; h.done = true; holds.cur = null; }
          }
        }
      },
      update: function (dt) {
        t += dt;
        if (flashT > 0) flashT -= dt;
        for (var q = ripple.length - 1; q >= 0; q--) { ripple[q].life -= dt; if (ripple[q].life <= 0) ripple.splice(q, 1); }
        if (deadT > 0) { deadT -= dt; if (deadT <= 0) api.gameOver(); return; }
        if (!started) return;
        speed += D.acc * dt * 2;
        scroll += speed * dt;
        // удержание длинной плитки
        if (holds.cur) {
          var h = holds.cur;
          h.held = Math.min(h.len, scroll - h.y + 0.5);
          if (Math.floor(h.held * 4) > (h.tick || 0)) { h.tick = Math.floor(h.held * 4); api.addScore(1); }
          if (h.held >= h.len - 0.05) { h.done = true; h.holding = false; holds.cur = null; api.sound('point'); }
        }
        while (nextRow < scroll + 8) addRow();
        for (var i = rows.length - 1; i >= 0; i--) {
          var r = rows[i];
          if (!r.hit && r.y + 0.5 < scroll) { // плитка ушла вниз
            r.hit = true; r.missed = true;
            fail(r.col, r.y);
            scroll -= 1.2; // отмотать, чтобы было видно ошибку
            if (deadT > 0) return;
          }
          if (r.y + r.len < scroll - 2) rows.splice(i, 1);
        }
      },
      draw: function (c) {
        var W = api.W, H = api.H, cw = W / COLS, Q = api.quality;
        c.drawImage(getBg(W, H).cv, 0, 0, W, H);
        // движущиеся огни сцены
        if (Q > 0) {
          c.save(); c.globalCompositeOperation = 'lighter';
          var gs = glowSpr();
          for (var li = 0; li < 3; li++) {
            var lx = W * (0.2 + 0.3 * li) + Math.sin(t * 0.6 + li * 2) * W * 0.12, ly = H * 0.12 + Math.cos(t * 0.5 + li) * 20;
            c.globalAlpha = 0.16 + 0.06 * Math.sin(t * 1.3 + li);
            c.drawImage(gs[li].cv, lx - 120, ly - 120, 240, 240);
          }
          c.restore();
        }
        // линии строк (бегут вместе с плитками)
        var off = ((scroll % 1) + 1) % 1;
        c.fillStyle = 'rgba(100,116,139,.16)';
        for (var y = H + off * RH; y > -RH; y -= RH) c.fillRect(0, Math.round(y) - 0.5, W, 1);
        // плитки
        for (var ri = 0; ri < rows.length; ri++) {
          var r = rows[ri], top = rowTop(r), h = r.len * RH;
          if (top > H || top + h < 0) continue;
          var x = r.col * cw;
          if (r.missed) {
            var on = Math.floor(t * 8) % 2;
            c.fillStyle = on ? '#ef4444' : '#7f1d1d'; rrect(c, x + 3, top + 3, cw - 6, h - 6, 8); c.fill();
            c.fillStyle = 'rgba(255,255,255,.18)'; rrect(c, x + 6, top + 6, cw - 12, (h - 12) * 0.35, 6); c.fill();
            continue;
          }
          if (r.done && r.len === 1) {
            var ps = tileSpr(cw, RH, 'done');
            c.drawImage(ps.cv, x, top, ps.w, ps.h);
            continue;
          }
          var spr = tileSpr(cw, h, r.len > 1 ? 'long' : 'tap');
          c.drawImage(spr.cv, x, top, spr.w, spr.h);
          if (r.len > 1) {
            if (r.held > 0) {
              var fh = Math.min(h - 6, r.held / r.len * h);
              var hg = c.createLinearGradient(0, top + h - fh, 0, top + h);
              hg.addColorStop(0, 'rgba(165,180,252,.95)'); hg.addColorStop(1, 'rgba(99,102,241,.55)');
              c.fillStyle = hg; rrect(c, x + 3, top + h - 3 - fh, cw - 6, fh, 8); c.fill();
              c.fillStyle = '#fff'; c.fillRect(x + 6, top + h - 3 - fh, cw - 12, 2.5);
              if (Q > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8; var g0 = glowSpr()[1]; c.drawImage(g0.cv, x + cw / 2 - cw * 0.6, top + h - fh - cw * 0.6, cw * 1.2, cw * 1.2); c.restore(); }
            }
            var py = top + h - 22 - (r.held > 0 ? Math.min(h - 44, r.held / r.len * h) : 0);
            c.fillStyle = r.holding ? '#fff' : '#a5b4fc'; c.beginPath(); c.arc(x + cw / 2, py, 8, 0, 6.283); c.fill();
            c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2; c.beginPath(); c.arc(x + cw / 2, py, 11 + (r.holding ? Math.sin(t * 12) * 2 : 0), 0, 6.283); c.stroke();
          }
          if (!started && r === rows[0]) {
            var pulse = 1 + Math.sin(t * 5) * 0.05;
            c.save(); c.translate(x + cw / 2, top + h / 2); c.scale(pulse, pulse);
            c.fillStyle = '#fff'; c.font = '900 ' + Math.round(cw * 0.2) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
            c.fillText(api.t('tiles.start'), 0, 0);
            c.restore();
          }
        }
        if (flashT > 0 && flashRow !== undefined) {
          var fy = H - (flashRow + 1 - scroll) * RH;
          c.fillStyle = Math.floor(flashT * 10) % 2 ? 'rgba(239,68,68,.85)' : 'rgba(239,68,68,.35)';
          rrect(c, flashCol * cw + 3, fy + 3, cw - 6, RH - 6, 8); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3;
          var mx = flashCol * cw + cw / 2, my = fy + RH / 2, ms = Math.min(cw, RH) * 0.18;
          c.beginPath(); c.moveTo(mx - ms, my - ms); c.lineTo(mx + ms, my + ms); c.moveTo(mx + ms, my - ms); c.lineTo(mx - ms, my + ms); c.stroke();
        }
        // отклик нажатия
        for (var pi = 0; pi < ripple.length; pi++) {
          var p = ripple[pi], k = p.life / 0.4;
          c.strokeStyle = 'rgba(129,140,248,' + k + ')'; c.lineWidth = 2 + k * 4;
          c.beginPath(); c.arc(p.x, p.y, (0.4 - p.life) * 220 + 10, 0, 6.283); c.stroke();
          if (Q > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = k * 0.9; var g1 = glowSpr()[1]; c.drawImage(g1.cv, p.x - 50, p.y - 50, 100, 100); c.restore(); }
          // ноты улетают вверх
          c.globalAlpha = k; c.fillStyle = '#fff'; c.font = '900 ' + Math.round(16 + (1 - k) * 8) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('♪', p.x + (1 - k) * 18, p.y - (1 - k) * 70); c.fillText('♫', p.x - (1 - k) * 22, p.y - (1 - k) * 50);
          c.globalAlpha = 1;
        }
        // HUD: скорость и жизни
        var sp = speed.toFixed(1) + ' ♪/s';
        c.font = '900 13px system-ui, sans-serif'; c.textAlign = 'right'; c.textBaseline = 'middle';
        var sw = c.measureText(sp).width + 20;
        c.fillStyle = 'rgba(15,23,42,.7)'; pill(c, W - 8 - sw, 8, sw, 24); c.fill();
        c.strokeStyle = 'rgba(165,180,252,.5)'; c.lineWidth = 1; c.stroke();
        c.fillStyle = '#c7d2fe'; c.fillText(sp, W - 18, 20.5);
        if (D.miss > 1) {
          c.fillStyle = 'rgba(15,23,42,.7)'; pill(c, 8, 8, D.miss * 20 + 10, 24); c.fill();
          for (var hm = 0; hm < D.miss; hm++) {
            heart(c, 23 + hm * 20, 20, 15);
            c.fillStyle = hm < missLeft ? '#f43f5e' : 'rgba(255,255,255,.15)'; c.fill();
            if (hm < missLeft) { c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(20 + hm * 20, 17, 1.8, 0, 6.283); c.fill(); }
          }
        }
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      }
    };
    function rrect(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
    function pill(c, x, y, w, h) { rrect(c, x, y, w, h, h / 2); }
    function heart(c, x, y, s) {
      c.beginPath(); c.moveTo(x, y + s * 0.35);
      c.bezierCurveTo(x - s * 0.1, y + s * 0.2, x - s * 0.55, y + s * 0.05, x - s * 0.5, y - s * 0.22);
      c.bezierCurveTo(x - s * 0.45, y - s * 0.5, x - s * 0.08, y - s * 0.5, x, y - s * 0.22);
      c.bezierCurveTo(x + s * 0.08, y - s * 0.5, x + s * 0.45, y - s * 0.5, x + s * 0.5, y - s * 0.22);
      c.bezierCurveTo(x + s * 0.55, y + s * 0.05, x + s * 0.1, y + s * 0.2, x, y + s * 0.35); c.closePath();
    }
    function DPR() { return Math.min(2, window.devicePixelRatio || 1); }
    function mkCanvas(w, h) { var cv = document.createElement('canvas'), d = DPR(); cv.width = Math.max(1, Math.ceil(w * d)); cv.height = Math.max(1, Math.ceil(h * d)); var x = cv.getContext('2d'); x.scale(d, d); return { cv: cv, x: x, w: w, h: h }; }
    function glowSpr() {
      if (SPR.glow) return SPR.glow;
      var cols = ['rgba(236,72,153,1)', 'rgba(129,140,248,1)', 'rgba(56,189,248,1)'], out = [];
      for (var i = 0; i < 3; i++) { var o = mkCanvas(64, 64), g = o.x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, cols[i]); g.addColorStop(1, 'rgba(0,0,0,0)'); o.x.fillStyle = g; o.x.fillRect(0, 0, 64, 64); out.push(o); }
      SPR.glow = out; return out;
    }
    function getBg(W, H) {
      var key = 'bg' + W + 'x' + H;
      if (SPR[key]) return SPR[key];
      for (var k in SPR) if (k.indexOf('bg') === 0) delete SPR[k];
      var o = mkCanvas(W, H), x = o.x, cw = W / COLS;
      // сцена позади клавиш
      var g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1e1b4b'); g.addColorStop(0.5, '#312e81'); g.addColorStop(1, '#0f172a');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.save(); x.globalCompositeOperation = 'lighter';
      var beams = [[0.15, '236,72,153'], [0.5, '129,140,248'], [0.85, '56,189,248']];
      beams.forEach(function (b) {
        var bx = W * b[0], bg = x.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, 'rgba(' + b[1] + ',.45)'); bg.addColorStop(1, 'rgba(' + b[1] + ',0)');
        x.fillStyle = bg; x.beginPath(); x.moveTo(bx - 12, 0); x.lineTo(bx + 12, 0); x.lineTo(bx + W * 0.35, H); x.lineTo(bx - W * 0.35, H); x.closePath(); x.fill();
      });
      var seed = 7; function R() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      for (var i = 0; i < 26; i++) { var bx2 = R() * W, by2 = R() * H, br = 4 + R() * 16; x.fillStyle = 'rgba(199,210,254,' + (0.04 + R() * 0.08) + ')'; x.beginPath(); x.arc(bx2, by2, br, 0, 6.283); x.fill(); }
      x.restore();
      // клавиши-дорожки: слоновая кость поверх сцены
      for (var cI = 0; cI < COLS; cI++) {
        var lx = cI * cw, lg = x.createLinearGradient(0, 0, 0, H);
        lg.addColorStop(0, 'rgba(238,242,255,.62)'); lg.addColorStop(0.4, 'rgba(244,246,255,.84)'); lg.addColorStop(1, 'rgba(255,255,255,.95)');
        x.fillStyle = lg; x.fillRect(lx, 0, cw, H);
        var sg = x.createLinearGradient(lx, 0, lx + cw, 0);
        sg.addColorStop(0, 'rgba(255,255,255,.6)'); sg.addColorStop(0.12, 'rgba(255,255,255,0)'); sg.addColorStop(0.88, 'rgba(15,23,42,0)'); sg.addColorStop(1, 'rgba(15,23,42,.10)');
        x.fillStyle = sg; x.fillRect(lx, 0, cw, H);
      }
      // разделители дорожек с фаской
      for (var s = 1; s < COLS; s++) {
        var sx = Math.round(s * cw);
        x.fillStyle = 'rgba(30,27,75,.45)'; x.fillRect(sx - 1, 0, 2, H);
        x.fillStyle = 'rgba(255,255,255,.9)'; x.fillRect(sx + 1, 0, 1, H);
      }
      // зона нажатия внизу и затемнение сверху
      var bz = x.createLinearGradient(0, H - RH * 1.2, 0, H);
      bz.addColorStop(0, 'rgba(129,140,248,0)'); bz.addColorStop(1, 'rgba(129,140,248,.16)');
      x.fillStyle = bz; x.fillRect(0, H - RH * 1.2, W, RH * 1.2);
      var tz = x.createLinearGradient(0, 0, 0, RH);
      tz.addColorStop(0, 'rgba(30,27,75,.35)'); tz.addColorStop(1, 'rgba(30,27,75,0)');
      x.fillStyle = tz; x.fillRect(0, 0, W, RH);
      SPR[key] = o; return o;
    }
    function tileSpr(cw, h, kind) {
      var key = kind + Math.round(cw) + 'x' + Math.round(h);
      if (SPR[key]) return SPR[key];
      var o = mkCanvas(cw, h), x = o.x, p = 3, w = cw - p * 2, hh = h - p * 2, rad = 8;
      if (kind === 'done') {
        rrect(x, p, p, w, hh, rad); x.fillStyle = 'rgba(148,163,184,.28)'; x.fill();
        var ig = x.createLinearGradient(0, p, 0, p + 14); ig.addColorStop(0, 'rgba(15,23,42,.18)'); ig.addColorStop(1, 'rgba(15,23,42,0)');
        x.save(); rrect(x, p, p, w, hh, rad); x.clip(); x.fillStyle = ig; x.fillRect(p, p, w, 14); x.restore();
        x.strokeStyle = 'rgba(100,116,139,.25)'; x.lineWidth = 1; rrect(x, p + 0.5, p + 0.5, w - 1, hh - 1, rad); x.stroke();
        SPR[key] = o; return o;
      }
      // тень
      x.fillStyle = 'rgba(15,23,42,.25)'; rrect(x, p + 1, p + 3, w, hh, rad); x.fill();
      var g = x.createLinearGradient(0, p, 0, p + hh);
      if (kind === 'long') { g.addColorStop(0, '#6366f1'); g.addColorStop(0.5, '#312e81'); g.addColorStop(1, '#0f0c29'); }
      else { g.addColorStop(0, '#334155'); g.addColorStop(0.55, '#111827'); g.addColorStop(1, '#020617'); }
      x.fillStyle = g; rrect(x, p, p, w, hh, rad); x.fill();
      x.save(); rrect(x, p, p, w, hh, rad); x.clip();
      // глянцевый блик
      var gl = x.createLinearGradient(0, p, 0, p + Math.min(hh * 0.45, 60));
      gl.addColorStop(0, 'rgba(255,255,255,.28)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = gl; rrect(x, p + 4, p + 3, w - 8, Math.min(hh * 0.45, 60), rad - 2); x.fill();
      // боковой блик
      x.fillStyle = 'rgba(255,255,255,.07)'; x.fillRect(p + 3, p, 3, hh);
      // нижняя фаска
      x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(p, p + hh - 6, w, 6);
      x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(p, p + hh - 7, w, 1);
      if (kind === 'long') {
        x.fillStyle = 'rgba(165,180,252,.55)'; x.fillRect(p + w / 2 - 2, p + 14, 4, hh - 40);
        x.fillStyle = 'rgba(199,210,254,.8)'; for (var d = p + 20; d < p + hh - 30; d += 22) { x.beginPath(); x.arc(p + w / 2, d, 3, 0, 6.283); x.fill(); }
      } else {
        x.fillStyle = 'rgba(148,163,184,.14)'; x.font = '900 ' + Math.round(Math.min(w, hh) * 0.36) + 'px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('♪', p + w / 2, p + hh * 0.55);
      }
      x.restore();
      x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 1; rrect(x, p + 0.5, p + 0.5, w - 1, hh - 1, rad); x.stroke();
      SPR[key] = o; return o;
    }
  }
};
