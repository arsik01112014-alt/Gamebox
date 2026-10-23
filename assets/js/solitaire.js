/* Пасьянс «Косынка» (Klondike): управление тапами */
window.GAMES = window.GAMES || {};
window.GAMES.solitaire = {
  title: 'Косынка',
  desc: 'Классический пасьянс',
  hint: 'Тапни по карте — она сама перейдёт в лучшее место: в «дом» (по мастям от туза до короля) или на столбец (по убыванию, чередуя цвет). Тап по колоде открывает карты. Собери все 52 карты в дом! Кнопка ⚑ завершает партию.',
  d0: 'По 1 карте, отмена без ограничений', d1: 'По 1 карте', d2: 'По 3 карты', d3: 'По 3 карты, 3 прохода колоды, без отмены',
  colors: ['#15803d', '#1e3a8a'],
  controls: 'none',
  isNew3: true,
  icon: '<svg viewBox="0 0 100 100"><defs><radialGradient id="solitaireF" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#22a055"/><stop offset="1" stop-color="#0b4a29"/></radialGradient>' +
    '<linearGradient id="solitaireK" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b4fb8"/><stop offset="1" stop-color="#172554"/></linearGradient></defs>' +
    '<rect x="6" y="6" width="88" height="88" rx="14" fill="url(#solitaireF)"/><rect x="10" y="10" width="80" height="80" rx="11" fill="none" stroke="#facc15" stroke-opacity=".3"/>' +
    '<g transform="rotate(-14 30 52)"><rect x="15" y="30" width="30" height="42" rx="4" fill="#fff"/><rect x="18" y="33" width="24" height="36" rx="2" fill="url(#solitaireK)"/><path d="M18 33l24 36M42 33l-24 36" stroke="#bfdbfe" stroke-opacity=".35"/></g>' +
    '<g><rect x="35" y="22" width="30" height="42" rx="4" fill="#000" opacity=".25" transform="translate(1 2)"/><rect x="35" y="22" width="30" height="42" rx="4" fill="#fff"/>' +
    '<text x="38" y="34" font-size="11" font-weight="900" fill="#d61f2c" font-family="system-ui,sans-serif">A</text>' +
    '<path d="M50 54c-7-5-8-9-6-11.5 2-2.5 5-1 6 1 1-2 4-3.5 6-1 2 2.5 1 6.5-6 11.5z" fill="#d61f2c"/></g>' +
    '<g transform="rotate(12 70 56)"><rect x="55" y="34" width="30" height="42" rx="4" fill="#000" opacity=".25" transform="translate(1 2)"/><rect x="55" y="34" width="30" height="42" rx="4" fill="#fff"/>' +
    '<text x="58" y="46" font-size="11" font-weight="900" fill="#151a2b" font-family="system-ui,sans-serif">K</text>' +
    '<path d="M70 50l-8 10c-2 4 3 6 6 3l-2 5h8l-2-5c3 3 8 1 6-3z" fill="#151a2b"/></g></svg>',

  create: function (api) {
    var SUITS = ['♠', '♥', '♦', '♣'], RANK = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    var D, stock, waste, found, tab, hist, undos, passes, cw, ch, gap, top, t, endT, won, moves, time, shakeC, flyQ, autoT, btns, sel;
    function red(c) { return c.s === 1 || c.s === 2; }
    function deal() {
      var deck = [];
      for (var s = 0; s < 4; s++) for (var r = 1; r <= 13; r++) deck.push({ s: s, r: r, up: false });
      for (var i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = deck[i]; deck[i] = deck[j]; deck[j] = x; }
      tab = [];
      for (var p = 0; p < 7; p++) { tab.push([]); for (var k = 0; k <= p; k++) { var cd = deck.pop(); cd.up = k === p; tab[p].push(cd); } }
      stock = deck; waste = []; found = [[], [], [], []];
    }
    function layout() {
      gap = Math.max(4, api.W * 0.012);
      cw = (api.W - gap * 8) / 7; ch = cw * 1.42; top = 12;
    }
    function snap() { return JSON.stringify({ s: stock, w: waste, f: found, t: tab, sc: api.getScore() }); }
    function save() { if (undos <= 0) return; hist.push(snap()); if (hist.length > 60) hist.shift(); }
    function undo() {
      if (!hist.length || undos <= 0) return;
      var o = JSON.parse(hist.pop()); stock = o.s; waste = o.w; found = o.f; tab = o.t; api.setScore(o.sc); undos--; api.sound('rotate');
    }
    function canFound(c) { var f = found[c.s]; return f.length ? f[f.length - 1].r === c.r - 1 : c.r === 1; }
    function canTab(c, p) { var pile = tab[p]; if (!pile.length) return c.r === 13; var tp = pile[pile.length - 1]; return tp.up && red(tp) !== red(c) && tp.r === c.r + 1; }
    function flipTops() { tab.forEach(function (pile) { var tp = pile[pile.length - 1]; if (tp && !tp.up) { tp.up = true; api.addScore(5); } }); }
    function afterMove() {
      moves++; flipTops();
      if (found.every(function (f) { return f.length === 13; })) { won = true; endT = 2.5; api.addScore(1000 * (api.diff + 1) + Math.max(0, 600 - Math.floor(time)) * 2); api.sound('win'); api.fx.confetti(140); }
    }
    function tryMove(src, idx) { // src: {type:'w'} | {type:'t', p} | {type:'f', s}
      var cards;
      if (src.type === 'w') cards = [waste[waste.length - 1]];
      else if (src.type === 'f') cards = [found[src.s][found[src.s].length - 1]];
      else cards = tab[src.p].slice(idx);
      var c0 = cards[0];
      if (!c0 || !c0.up) return false;
      // в дом
      if (cards.length === 1 && src.type !== 'f' && canFound(c0)) {
        save(); remove(src, idx); found[c0.s].push(c0); api.addScore(10); api.sound('coin'); afterMove(); return true;
      }
      // на столбец: сперва непустые
      var order = [0, 1, 2, 3, 4, 5, 6].sort(function (a, b) { return (tab[a].length ? 0 : 1) - (tab[b].length ? 0 : 1); });
      for (var k = 0; k < 7; k++) {
        var p = order[k]; if (src.type === 't' && src.p === p) continue;
        if (canTab(c0, p)) {
          if (src.type === 't' && idx === 0 && !tab[p].length && c0.r === 13) continue; // король с пустого на пустое
          save(); remove(src, idx); tab[p] = tab[p].concat(cards);
          if (src.type === 'w') api.addScore(5); if (src.type === 'f') api.setScore(Math.max(0, api.getScore() - 15));
          api.sound('move'); afterMove(); return true;
        }
      }
      return false;
    }
    function remove(src, idx) {
      if (src.type === 'w') waste.pop();
      else if (src.type === 'f') found[src.s].pop();
      else tab[src.p].splice(idx);
    }
    function drawStock() {
      if (!stock.length) {
        if (!waste.length) return;
        if (api.diff === 3 && passes >= 2) { api.toast(api.t('sol.noPass')); return; }
        save(); passes++; stock = waste.reverse().map(function (c) { c.up = false; return c; }); waste = [];
        if (api.diff >= 2) api.setScore(Math.max(0, api.getScore() - 50));
        api.sound('rotate'); return;
      }
      save();
      var n = api.diff >= 2 ? 3 : 1;
      for (var i = 0; i < n && stock.length; i++) { var c = stock.pop(); c.up = true; waste.push(c); }
      api.tone(500, 0.04, 'triangle', 0.05);
    }
    function canAuto() { return !stock.length && !waste.length && tab.every(function (p) { return p.every(function (c) { return c.up; }); }); }
    function autoStep() {
      for (var p = 0; p < 7; p++) { var pile = tab[p]; if (pile.length && canFound(pile[pile.length - 1])) { var c = pile.pop(); found[c.s].push(c); api.addScore(10); api.tone(700 + found[c.s].length * 30, 0.05, 'square', 0.03); afterMove(); return true; } }
      return false;
    }
    function fanY(pile, i) {
      var maxH = api.H - (top + ch + gap * 2) - 70, y = 0, down = ch * 0.16, up = ch * 0.3;
      var total = 0; for (var k = 0; k < pile.length - 1; k++) total += pile[k].up ? up : down;
      var sc = total > maxH - ch ? (maxH - ch) / total : 1;
      for (var j = 0; j < i; j++) y += (pile[j].up ? up : down) * sc;
      return y;
    }
    function colX(p) { return gap + p * (cw + gap); }
    function tabTop() { return top + ch + gap * 2; }
    var spr = {}, sprKey = 0, SP = 4, felt = null, feltW = 0, feltH = 0;
    function DPR() { return Math.min(2, window.devicePixelRatio || 1); }
    function mkC(w, h) {
      var d = DPR(), cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w * d)); cv.height = Math.max(1, Math.ceil(h * d));
      var x = cv.getContext('2d'); x.scale(d, d); return { cv: cv, x: x };
    }
    function rr(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
    }
    // масть, нарисованная путём (без эмодзи-глифов); (x,y) — центр, z — размер
    function suitPath(c, s, x, y, z) {
      var h = z / 2;
      c.beginPath();
      if (s === 1) { // ♥
        c.moveTo(x, y + h); c.bezierCurveTo(x - h * 1.1, y + h * 0.1, x - h * 1.05, y - h * 0.95, x - h * 0.5, y - h * 0.95);
        c.bezierCurveTo(x - h * 0.15, y - h * 0.95, x, y - h * 0.65, x, y - h * 0.45);
        c.bezierCurveTo(x, y - h * 0.65, x + h * 0.15, y - h * 0.95, x + h * 0.5, y - h * 0.95);
        c.bezierCurveTo(x + h * 1.05, y - h * 0.95, x + h * 1.1, y + h * 0.1, x, y + h); c.closePath();
      } else if (s === 2) { // ♦
        c.moveTo(x, y - h); c.quadraticCurveTo(x + h * 0.35, y - h * 0.35, x + h * 0.78, y); c.quadraticCurveTo(x + h * 0.35, y + h * 0.35, x, y + h);
        c.quadraticCurveTo(x - h * 0.35, y + h * 0.35, x - h * 0.78, y); c.quadraticCurveTo(x - h * 0.35, y - h * 0.35, x, y - h); c.closePath();
      } else if (s === 0) { // ♠
        c.moveTo(x, y - h); c.bezierCurveTo(x - h * 0.3, y - h * 0.5, x - h * 1.05, y - h * 0.15, x - h * 0.95, y + h * 0.3);
        c.bezierCurveTo(x - h * 0.85, y + h * 0.7, x - h * 0.3, y + h * 0.65, x - h * 0.08, y + h * 0.35);
        c.quadraticCurveTo(x - h * 0.15, y + h * 0.8, x - h * 0.45, y + h); c.lineTo(x + h * 0.45, y + h);
        c.quadraticCurveTo(x + h * 0.15, y + h * 0.8, x + h * 0.08, y + h * 0.35);
        c.bezierCurveTo(x + h * 0.3, y + h * 0.65, x + h * 0.85, y + h * 0.7, x + h * 0.95, y + h * 0.3);
        c.bezierCurveTo(x + h * 1.05, y - h * 0.15, x + h * 0.3, y - h * 0.5, x, y - h); c.closePath();
      } else { // ♣
        var q = h * 0.46;
        c.moveTo(x + q, y - h * 0.5); c.arc(x, y - h * 0.5, q, 0, 6.283);
        c.moveTo(x - h * 0.5 + q, y + h * 0.12); c.arc(x - h * 0.5, y + h * 0.12, q, 0, 6.283);
        c.moveTo(x + h * 0.5 + q, y + h * 0.12); c.arc(x + h * 0.5, y + h * 0.12, q, 0, 6.283);
        c.moveTo(x - h * 0.2, y); c.lineTo(x + h * 0.2, y); c.lineTo(x + h * 0.12, y + h * 0.4);
        c.quadraticCurveTo(x + h * 0.18, y + h * 0.85, x + h * 0.45, y + h); c.lineTo(x - h * 0.45, y + h);
        c.quadraticCurveTo(x - h * 0.18, y + h * 0.85, x - h * 0.12, y + h * 0.4); c.closePath();
      }
    }
    function suitCol(s) { return s === 1 || s === 2 ? '#d61f2c' : '#151a2b'; }
    var PIPS = {
      2: [[0, 0], [0, 1]], 3: [[0, 0], [0, 0.5], [0, 1]], 4: [[-1, 0], [1, 0], [-1, 1], [1, 1]],
      5: [[-1, 0], [1, 0], [0, 0.5], [-1, 1], [1, 1]], 6: [[-1, 0], [1, 0], [-1, 0.5], [1, 0.5], [-1, 1], [1, 1]],
      7: [[-1, 0], [1, 0], [0, 0.25], [-1, 0.5], [1, 0.5], [-1, 1], [1, 1]],
      8: [[-1, 0], [1, 0], [0, 0.25], [-1, 0.5], [1, 0.5], [0, 0.75], [-1, 1], [1, 1]],
      9: [[-1, 0], [1, 0], [-1, 1 / 3], [1, 1 / 3], [0, 0.5], [-1, 2 / 3], [1, 2 / 3], [-1, 1], [1, 1]],
      10: [[-1, 0], [1, 0], [0, 1 / 6], [-1, 1 / 3], [1, 1 / 3], [-1, 2 / 3], [1, 2 / 3], [0, 5 / 6], [-1, 1], [1, 1]]
    };
    function cardBase(c, w, h, rad) {
      c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 4; c.shadowOffsetY = 1.5;
      c.fillStyle = '#fff'; rr(c, SP, SP, w, h, rad); c.fill(); c.restore();
    }
    function buildFace(s, r) {
      var w = cw, h = ch, rad = Math.max(3, w * 0.09), o = mkC(w + SP * 2, h + SP * 2), c = o.x, col = suitCol(s), i;
      cardBase(c, w, h, rad);
      var g = c.createLinearGradient(0, SP, 0, SP + h); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#f1ede4');
      c.fillStyle = g; rr(c, SP, SP, w, h, rad); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 0.8; rr(c, SP + 0.4, SP + 0.4, w - 0.8, h - 0.8, rad); c.stroke();
      c.translate(SP, SP);
      // угол: ранг и масть
      c.fillStyle = col; c.textBaseline = 'top'; c.textAlign = 'left';
      var fs = Math.round(w * 0.31);
      c.font = '800 ' + fs + 'px system-ui, sans-serif';
      if (r === 10) { c.save(); c.translate(w * 0.05, h * 0.035); c.scale(0.82, 1); c.fillText('10', 0, 0); c.restore(); }
      else c.fillText(RANK[r], w * 0.07, h * 0.035);
      suitPath(c, s, w - w * 0.17, h * 0.035 + fs * 0.5, w * 0.22); c.fill();
      // нижний угол (перевёрнутый): маленькая масть
      if (r === 1) { suitPath(c, s, w - w * 0.13, h - h * 0.065, w * 0.12); c.fill(); }
      var ax = w / 2, y0 = h * 0.38, y1 = h * 0.86;
      if (r === 1) {
        var az = w * (s === 0 ? 0.5 : 0.42);
        suitPath(c, s, ax, (y0 + y1) / 2, az); c.fill();
        if (s === 0) { c.strokeStyle = '#fff'; c.lineWidth = 0.8; suitPath(c, s, ax, (y0 + y1) / 2, az * 0.62); c.stroke(); }
      } else if (r <= 10) {
        var pz = w * (r >= 9 ? 0.17 : 0.2), P = PIPS[r];
        for (i = 0; i < P.length; i++) {
          var px = ax + P[i][0] * w * 0.22, py = y0 + P[i][1] * (y1 - y0);
          c.save(); c.translate(px, py); if (P[i][1] > 0.5) c.rotate(Math.PI); suitPath(c, s, 0, 0, pz); c.fill(); c.restore();
        }
      } else face(c, s, r, w, h);
      return o.cv;
    }
    function face(c, s, r, w, h) {
      var fx = w * 0.13, fy = h * 0.3, fw = w * 0.74, fh = h * 0.64, hh = fh / 2, red2 = s === 1 || s === 2;
      var robe = r === 13 ? (red2 ? '#b91c1c' : '#1e3a8a') : r === 12 ? (red2 ? '#be185d' : '#6d28d9') : (red2 ? '#c2410c' : '#047857');
      var bg = c.createLinearGradient(0, fy, 0, fy + fh); bg.addColorStop(0, red2 ? '#fff1e6' : '#eef2ff'); bg.addColorStop(0.5, red2 ? '#fde2cf' : '#dbe3fb'); bg.addColorStop(1, red2 ? '#fff1e6' : '#eef2ff');
      c.fillStyle = bg; c.fillRect(fx, fy, fw, fh);
      c.save(); c.beginPath(); c.rect(fx, fy, fw, fh); c.clip();
      function half() {
        var cx = fx + fw / 2, hy = fy + hh * 0.5, hr = fw * 0.17;
        // мантия
        c.fillStyle = robe; c.beginPath(); c.moveTo(fx + fw * 0.06, fy + hh); c.lineTo(fx + fw * 0.16, fy + hh * 0.78);
        c.quadraticCurveTo(cx, fy + hh * 0.6, fx + fw * 0.84, fy + hh * 0.78); c.lineTo(fx + fw * 0.94, fy + hh); c.fill();
        c.fillStyle = '#facc15'; c.fillRect(cx - fw * 0.05, fy + hh * 0.72, fw * 0.1, hh * 0.28);
        c.strokeStyle = '#facc15'; c.lineWidth = Math.max(0.8, fw * 0.03);
        c.beginPath(); c.moveTo(fx + fw * 0.16, fy + hh * 0.8); c.quadraticCurveTo(cx, fy + hh * 0.62, fx + fw * 0.84, fy + hh * 0.8); c.stroke();
        // волосы/борода
        if (r === 12) { c.fillStyle = '#eab308'; c.beginPath(); c.ellipse(cx, hy + hr * 0.4, hr * 1.35, hr * 1.5, 0, 0, 6.283); c.fill(); }
        if (r === 13) { c.fillStyle = '#e5e7eb'; c.beginPath(); c.ellipse(cx, hy + hr * 0.75, hr * 0.95, hr * 0.9, 0, 0, Math.PI); c.fill(); }
        // лицо
        c.fillStyle = '#fcd7b4'; c.beginPath(); c.arc(cx, hy, hr, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(120,60,20,.5)'; c.lineWidth = 0.6; c.stroke();
        if (r === 13) { c.fillStyle = '#e5e7eb'; c.beginPath(); c.ellipse(cx, hy + hr * 0.55, hr * 0.85, hr * 0.55, 0, 0, Math.PI); c.fill(); c.fillRect(cx - hr * 0.5, hy + hr * 0.35, hr, hr * 0.18); }
        if (r === 11) { c.fillStyle = '#7c2d12'; c.beginPath(); c.arc(cx, hy - hr * 0.1, hr * 1.02, Math.PI * 1.05, Math.PI * 1.95); c.fill(); }
        c.fillStyle = '#1f2937';
        c.beginPath(); c.arc(cx - hr * 0.38, hy - hr * 0.05, Math.max(0.6, hr * 0.12), 0, 6.283); c.arc(cx + hr * 0.38, hy - hr * 0.05, Math.max(0.6, hr * 0.12), 0, 6.283); c.fill();
        c.fillStyle = '#e11d48'; c.fillRect(cx - hr * 0.22, hy + hr * 0.35, hr * 0.44, Math.max(0.6, hr * 0.12));
        // корона / диадема / берет
        if (r === 13) {
          c.fillStyle = '#facc15'; c.beginPath();
          c.moveTo(cx - hr * 1.05, hy - hr * 0.6); c.lineTo(cx - hr * 1.15, hy - hr * 1.75); c.lineTo(cx - hr * 0.55, hy - hr * 1.15); c.lineTo(cx, hy - hr * 1.95);
          c.lineTo(cx + hr * 0.55, hy - hr * 1.15); c.lineTo(cx + hr * 1.15, hy - hr * 1.75); c.lineTo(cx + hr * 1.05, hy - hr * 0.6); c.fill();
          c.strokeStyle = '#a16207'; c.lineWidth = 0.6; c.stroke();
          c.fillStyle = '#dc2626'; c.beginPath(); c.arc(cx, hy - hr * 1.0, hr * 0.18, 0, 6.283); c.fill();
        } else if (r === 12) {
          c.fillStyle = '#facc15'; c.beginPath(); c.moveTo(cx - hr * 0.9, hy - hr * 0.7);
          c.quadraticCurveTo(cx - hr * 0.5, hy - hr * 1.5, cx, hy - hr * 1.6); c.quadraticCurveTo(cx + hr * 0.5, hy - hr * 1.5, cx + hr * 0.9, hy - hr * 0.7); c.fill();
          c.fillStyle = '#38bdf8'; c.beginPath(); c.arc(cx, hy - hr * 1.15, hr * 0.2, 0, 6.283); c.fill();
          c.fillStyle = '#fff'; [-0.5, 0.5].forEach(function (k) { c.beginPath(); c.arc(cx + hr * k, hy - hr * 1.0, hr * 0.1, 0, 6.283); c.fill(); });
        } else {
          c.fillStyle = robe; c.beginPath(); c.ellipse(cx + hr * 0.1, hy - hr * 0.85, hr * 1.25, hr * 0.5, -0.15, 0, 6.283); c.fill();
          c.strokeStyle = '#facc15'; c.lineWidth = Math.max(0.8, hr * 0.15); c.beginPath(); c.moveTo(cx + hr * 0.6, hy - hr * 1.1); c.quadraticCurveTo(cx + hr * 1.6, hy - hr * 1.9, cx + hr * 1.9, hy - hr * 1.2); c.stroke();
        }
        // масть у плеча
        c.fillStyle = suitCol(s); suitPath(c, s, fx + fw * 0.16, fy + hh * 0.22, fw * 0.17); c.fill();
      }
      half();
      c.save(); c.translate(fx * 2 + fw, fy * 2 + fh); c.rotate(Math.PI); half(); c.restore();
      c.restore();
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(fx, fy + fh * 0.55); c.lineTo(fx + fw, fy + fh * 0.45); c.stroke();
      c.strokeStyle = '#c8a24a'; c.lineWidth = 1.2; c.strokeRect(fx, fy, fw, fh);
      c.strokeStyle = suitCol(s); c.lineWidth = 0.6; c.strokeRect(fx + 1.6, fy + 1.6, fw - 3.2, fh - 3.2);
    }
    function buildBack() {
      var w = cw, h = ch, rad = Math.max(3, w * 0.09), o = mkC(w + SP * 2, h + SP * 2), c = o.x;
      cardBase(c, w, h, rad);
      c.translate(SP, SP);
      c.fillStyle = '#fbfaf6'; rr(c, 0, 0, w, h, rad); c.fill();
      var m = Math.max(2.5, w * 0.07), g = c.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#2b4fb8'); g.addColorStop(0.5, '#1e3a8a'); g.addColorStop(1, '#172554');
      c.fillStyle = g; rr(c, m, m, w - m * 2, h - m * 2, rad * 0.6); c.fill();
      c.save(); rr(c, m, m, w - m * 2, h - m * 2, rad * 0.6); c.clip();
      c.strokeStyle = 'rgba(191,219,254,.28)'; c.lineWidth = 0.8;
      var step = w * 0.16;
      for (var k = -h; k < w + h; k += step) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k + h, h); c.moveTo(k + h, 0); c.lineTo(k, h); c.stroke(); }
      c.fillStyle = 'rgba(191,219,254,.35)';
      for (var yy = m; yy < h; yy += step) for (var xx = m; xx < w; xx += step) { c.beginPath(); c.arc(xx + step / 2, yy, 0.8, 0, 6.283); c.fill(); }
      // эмблема
      var cx = w / 2, cy = h / 2, er = w * 0.22;
      c.fillStyle = '#1e3a8a'; c.beginPath(); c.ellipse(cx, cy, er, er * 1.3, 0, 0, 6.283); c.fill();
      c.strokeStyle = '#fcd34d'; c.lineWidth = 1.2; c.stroke();
      c.lineWidth = 0.6; c.beginPath(); c.ellipse(cx, cy, er * 0.75, er * 1.0, 0, 0, 6.283); c.stroke();
      c.fillStyle = '#fcd34d'; suitPath(c, 0, cx, cy, er * 0.9); c.fill();
      var sh = c.createLinearGradient(0, 0, w, h); sh.addColorStop(0, 'rgba(255,255,255,.18)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)');
      c.fillStyle = sh; c.fillRect(0, 0, w, h);
      c.restore();
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 0.8; rr(c, 0.4, 0.4, w - 0.8, h - 0.8, rad); c.stroke();
      return o.cv;
    }
    function sprite(k) {
      if (sprKey !== cw) { spr = {}; sprKey = cw; }
      if (!spr[k]) spr[k] = k === 'back' ? buildBack() : buildFace(Math.floor(k / 13), (k % 13) + 1);
      return spr[k];
    }
    function buildFelt() {
      var W = api.W, H = api.H, o = mkC(W, H), c = o.x; felt = o.cv; feltW = W; feltH = H;
      var g = c.createRadialGradient(W / 2, H * 0.4, 30, W / 2, H * 0.45, Math.max(W, H) * 0.8);
      g.addColorStop(0, '#1f8a4c'); g.addColorStop(0.6, '#13693a'); g.addColorStop(1, '#0a4024');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // шум сукна (тайл)
      var tile = document.createElement('canvas'); tile.width = tile.height = 96;
      var tc = tile.getContext('2d'), id = tc.createImageData(96, 96), dd = id.data;
      for (var i = 0; i < dd.length; i += 4) { var v = Math.random(); var a = v < 0.5 ? 0 : 255; dd[i] = dd[i + 1] = dd[i + 2] = a; dd[i + 3] = Math.floor(Math.random() * 22); }
      tc.putImageData(id, 0, 0);
      tc.strokeStyle = 'rgba(0,0,0,.06)'; tc.lineWidth = 0.6;
      for (i = 0; i < 40; i++) { var x0 = Math.random() * 96, y0 = Math.random() * 96, an = Math.random() * 6.28; tc.beginPath(); tc.moveTo(x0, y0); tc.lineTo(x0 + Math.cos(an) * 5, y0 + Math.sin(an) * 5); tc.stroke(); }
      var pat = c.createPattern(tile, 'repeat'); c.fillStyle = pat; c.fillRect(0, 0, W, H);
      // тонкая золотая окантовка
      c.strokeStyle = 'rgba(250,204,21,.18)'; c.lineWidth = 1; rr(c, 4, 4, W - 8, H - 8, 14); c.stroke();
      var vg = c.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.4, W / 2, H * 0.45, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    }
    function drawCard(c, x, y, cd, hl) {
      var im = cd.up ? sprite(cd.s * 13 + cd.r - 1) : sprite('back');
      c.drawImage(im, x - SP, y - SP, cw + SP * 2, ch + SP * 2);
      if (hl) { c.fillStyle = 'rgba(253,224,71,.3)'; rr(c, x, y, cw, ch, Math.max(3, cw * 0.09)); c.fill(); }
    }
    function slot(c, x, y, label) {
      var rad = Math.max(3, cw * 0.09);
      c.fillStyle = 'rgba(0,0,0,.18)'; rr(c, x, y, cw, ch, rad); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2; rr(c, x + 1, y + 1.5, cw - 2, ch - 2, rad); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1.5; rr(c, x + 0.75, y + 0.75, cw - 1.5, ch - 1.5, rad); c.stroke();
      if (!label) return;
      var si = SUITS.indexOf(label), cx = x + cw / 2, cy = y + ch / 2;
      if (si >= 0) {
        suitPath(c, si, cx, cy, cw * 0.45); c.fillStyle = 'rgba(255,255,255,.08)'; c.fill();
        c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.5; c.stroke();
        c.fillStyle = 'rgba(255,255,255,.35)'; c.font = '800 ' + Math.round(cw * 0.22) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('A', cx, y + ch * 0.86);
      } else if (label === '↻') {
        c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 3; c.lineCap = 'round';
        c.beginPath(); c.arc(cx, cy, cw * 0.2, -0.3, 4.4); c.stroke();
        var ea = -0.3, ex = cx + Math.cos(ea) * cw * 0.2, ey = cy + Math.sin(ea) * cw * 0.2;
        c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(ex + 6, ey - 1); c.lineTo(ex - 3, ey - 6); c.lineTo(ex - 1, ey + 4); c.fill();
        c.lineCap = 'butt';
      } else {
        c.fillStyle = 'rgba(255,255,255,.22)'; c.font = '900 ' + Math.round(cw * 0.42) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(label, cx, cy);
      }
    }
    return {
      reset: function () {
        D = api.diff; layout(); deal(); hist = []; undos = [999, 5, 3, 0][api.diff]; passes = 0; t = 0; endT = 0; won = false; moves = 0; time = 0; shakeC = null; autoT = 0; sel = null; btns = [];
      },
      resize: layout,
      idle: function (dt) { t += dt; },
      input: function (type, d) {
        if (type !== 'down' || endT > 0) return;
        var x = d.x, y = d.y;
        // кнопки
        for (var b = 0; b < btns.length; b++) { var B = btns[b]; if (x > B.x && x < B.x + B.w && y > B.y && y < B.y + B.h) { B.fn(); return; } }
        if (y >= top && y <= top + ch) {
          var col = Math.floor((x - gap / 2) / (cw + gap));
          if (col === 0) { drawStock(); return; }
          if (col === 1 || (col === 2 && api.diff >= 2 && waste.length)) { if (waste.length && !tryMove({ type: 'w' })) shakeC = { k: 'w', t: 0.3 }; return; }
          if (col >= 3) { var s = col - 3; if (found[s].length && !tryMove({ type: 'f', s: s })) shakeC = { k: 'f' + s, t: 0.3 }; return; }
        }
        var p = Math.floor((x - gap / 2) / (cw + gap));
        if (p < 0 || p > 6 || y < tabTop()) return;
        var pile = tab[p];
        for (var i = pile.length - 1; i >= 0; i--) {
          var cy = tabTop() + fanY(pile, i);
          if (y >= cy && y <= cy + ch) {
            if (!pile[i].up) { if (i === pile.length - 1) { pile[i].up = true; api.sound('click'); } return; }
            if (!tryMove({ type: 't', p: p }, i)) { shakeC = { k: 't' + p + '_' + i, t: 0.3 }; api.tone(160, 0.05, 'square', 0.03); }
            return;
          }
        }
      },
      update: function (dt) {
        t += dt;
        if (shakeC) { shakeC.t -= dt; if (shakeC.t <= 0) shakeC = null; }
        if (endT > 0) { endT -= dt; if (endT <= 0) api.gameOver(); return; }
        time += dt;
        if (canAuto()) { autoT -= dt; if (autoT <= 0) { autoT = 0.08; autoStep(); } }
      },
      draw: function (c) {
        var W = api.W, H = api.H;
        if (!felt || feltW !== W || feltH !== H) buildFelt();
        c.save();
        c.drawImage(felt, 0, 0, W, H);
        function sx(k) { return shakeC && shakeC.k === k ? Math.sin(shakeC.t * 60) * 4 : 0; }
        // колода
        if (!stock.length) slot(c, colX(0), top, waste.length ? '↻' : '');
        if (stock.length) {
          if (stock.length > 1) drawCard(c, colX(0) - 1.5, top - 1.5, { up: false });
          drawCard(c, colX(0), top, { up: false });
          var bdx = colX(0) + cw / 2, bdy = top + ch - 9;
          c.fillStyle = 'rgba(15,23,42,.85)'; rr(c, bdx - 13, bdy - 7, 26, 14, 7); c.fill();
          c.strokeStyle = 'rgba(252,211,77,.8)'; c.lineWidth = 1; c.stroke();
          c.fillStyle = '#fff'; c.font = '800 10px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(stock.length, bdx, bdy + 0.5);
        }
        // сброс
        var wn = api.diff >= 2 ? Math.min(3, waste.length) : Math.min(1, waste.length);
        if (!waste.length) slot(c, colX(1), top, '');
        for (var i = 0; i < wn; i++) { var cd = waste[waste.length - wn + i]; drawCard(c, colX(1) + i * cw * 0.3 + (i === wn - 1 ? sx('w') : 0), top, cd); }
        // дом
        for (var s = 0; s < 4; s++) { var f = found[s]; if (f.length) drawCard(c, colX(3 + s) + sx('f' + s), top, f[f.length - 1]); else slot(c, colX(3 + s), top, SUITS[s]); }
        // столбцы
        for (var p = 0; p < 7; p++) {
          var pile = tab[p];
          if (!pile.length) slot(c, colX(p), tabTop(), 'K');
          for (var j = 0; j < pile.length; j++) {
            var shk = shakeC && shakeC.k.indexOf('t' + p + '_') === 0 && j >= +shakeC.k.split('_')[1] ? Math.sin(shakeC.t * 60) * 4 : 0;
            drawCard(c, colX(p) + shk, tabTop() + fanY(pile, j), pile[j]);
          }
        }
        // кнопки
        btns = [];
        var by = H - 54, bw = (W - 40) / 3;
        var defs = [
          { label: '↶ ' + (undos > 99 ? '' : undos), on: undos > 0 && hist.length, fn: undo },
          { label: '⏱ ' + Math.floor(time / 60) + ':' + ('0' + Math.floor(time % 60)).slice(-2), on: false, fn: function () { } },
          { label: '⚑ ' + api.t('sol.end'), on: true, fn: function () { if (endT <= 0) { endT = 0.5; api.sound('over'); } } }
        ];
        defs.forEach(function (df, k) {
          var bx = 10 + k * (bw + 10);
          c.fillStyle = 'rgba(0,0,0,.3)'; rr(c, bx, by + 2, bw, 42, 21); c.fill();
          if (k === 1) c.fillStyle = 'rgba(4,30,16,.55)';
          else if (df.on) { var bgr = c.createLinearGradient(0, by, 0, by + 42); bgr.addColorStop(0, 'rgba(255,255,255,.26)'); bgr.addColorStop(1, 'rgba(255,255,255,.1)'); c.fillStyle = bgr; }
          else c.fillStyle = 'rgba(0,0,0,.22)';
          rr(c, bx, by, bw, 42, 21); c.fill();
          c.strokeStyle = k === 1 ? 'rgba(250,204,21,.35)' : df.on ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.08)'; c.lineWidth = 1; rr(c, bx + 0.5, by + 0.5, bw - 1, 41, 20.5); c.stroke();
          c.fillStyle = k === 1 ? '#fde68a' : df.on ? '#fff' : 'rgba(255,255,255,.4)'; c.font = '800 14px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(df.label, bx + bw / 2, by + 21);
          if (k !== 1) btns.push({ x: bx, y: by, w: bw, h: 42, fn: df.fn });
        });
        c.restore();
        c.globalAlpha = 1; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      }
    };
  }
};
