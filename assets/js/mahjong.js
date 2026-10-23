/* Маджонг: пасьянс из костей — убирай пары одинаковых свободных костей */
window.GAMES = window.GAMES || {};
window.GAMES.mahjong = {
  title: 'Маджонг',
  desc: 'Убирай пары одинаковых свободных костей',
  hint: 'Тапни две одинаковые свободные кости — они исчезнут. Свободна кость, на которой ничего не лежит и у которой открыт левый или правый край. Зажатые кости затемнены. Быстрые пары подряд дают комбо, остаток времени — бонус. Застрял — жми «Перемешать» или «Подсказку».',
  d0: 'Маленькие раскладки, много времени и подсказок',
  d1: 'Средние раскладки, 3 подсказки',
  d2: 'Большие раскладки, больше одинаковых костей, меньше времени',
  d3: 'Огромные раскладки, жёсткий таймер, 1 подсказка',
  colors: ['#0f766e', '#7f1d1d'],
  controls: 'none',
  isNew4: true,
  cat: 'puzzle',
  medals: [800, 2600, 6500],
  icon: '<svg viewBox="0 0 100 100"><defs><linearGradient id="mahjongBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#115e59"/><stop offset="1" stop-color="#042f2e"/></linearGradient>' +
    '<linearGradient id="mahjongF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf4"/><stop offset="1" stop-color="#e9dfc4"/></linearGradient>' +
    '<linearGradient id="mahjongS" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#065f46"/><stop offset="1" stop-color="#10b981"/></linearGradient></defs>' +
    '<rect x="4" y="4" width="92" height="92" rx="20" fill="url(#mahjongBg)"/>' +
    '<g transform="translate(14 22) rotate(-10)"><rect x="-4" y="6" width="34" height="46" rx="6" fill="url(#mahjongS)"/><rect x="-2" y="3" width="34" height="46" rx="6" fill="#d6c9a6"/><rect x="0" y="0" width="34" height="46" rx="6" fill="url(#mahjongF)"/>' +
    '<g stroke="#b91c1c" stroke-width="3.4" stroke-linecap="round" fill="none"><rect x="9" y="15" width="16" height="12" rx="1.5"/><path d="M17 8V38"/></g></g>' +
    '<g transform="translate(50 28) rotate(9)"><rect x="-4" y="6" width="34" height="46" rx="6" fill="url(#mahjongS)"/><rect x="-2" y="3" width="34" height="46" rx="6" fill="#d6c9a6"/><rect x="0" y="0" width="34" height="46" rx="6" fill="url(#mahjongF)"/>' +
    '<circle cx="17" cy="23" r="11" fill="#1d4ed8"/><circle cx="17" cy="23" r="7.5" fill="#fff"/><circle cx="17" cy="23" r="5" fill="#b91c1c"/><circle cx="17" cy="23" r="2" fill="#fde68a"/></g>' +
    '<circle cx="80" cy="16" r="3" fill="#fde68a" opacity=".8"/><circle cx="18" cy="84" r="2.2" fill="#fde68a" opacity=".6"/></svg>',

  create: function (api) {
    var NF = 42;
    var tiles = [], order = [], level, timeLeft, timeMax, hints, shuffles, combo, lastMatch, sel, flying, hintPair, hintT;
    var blockedTips = 0, phase, phaseT, clock, avail, layoutIdx, dealT, stuckMsg, boardTime;
    var TW = 40, TH = 52, EX = 5, EY = 5, OX = 0, OY = 0;
    var dpr = 1, bgL = null, barL = null, faceS = [], dimS = null, selS = null, hintS = null, lw = 0, lh = 0, curLayout = null;
    var btnH = { x: 0, y: 0, w: 0, h: 0 }, btnS = { x: 0, y: 0, w: 0, h: 0 }, press = null;
    var LAYOUTS = ['pyramid', 'turtle', 'fortress', 'butterfly', 'cross'];

    function rr(c, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }
    function mkC(w, h) {
      var o = document.createElement('canvas');
      o.width = Math.max(1, Math.ceil(w * dpr)); o.height = Math.max(1, Math.ceil(h * dpr));
      var x = o.getContext('2d'); x.scale(dpr, dpr); return o;
    }
    function shuf(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

    /* ---------- раскладки (координаты в половинах кости) ---------- */
    function buildLayout(name, s) {
      var P = [], key = {};
      function add(x, y, z) { var k = x + ',' + y + ',' + z; if (key[k]) return; key[k] = 1; P.push({ x: x, y: y, z: z }); }
      function rect(cols, rows, z, ox, oy) { ox = ox || 0; oy = oy || 0; for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) add(-cols + i * 2 + ox, -rows + j * 2 + oy, z); }
      var i, j, z, c, r;
      if (name === 'pyramid') {
        c = [6, 6, 7, 8][s]; r = [6, 8, 9, 9][s]; z = 0;
        while (c > 0 && r > 0) { rect(c, r, z); c -= 2; r -= 2; z++; }
      } else if (name === 'turtle') {
        var Wb = [4, 6, 6, 6][s], R = [6, 7, 8, 8][s];
        for (j = 0; j < R; j++) { var w = (j === 0 || j === R - 1) ? Wb - 2 : Wb; for (i = 0; i < w; i++) add(-w + i * 2, -R + j * 2, 0); }
        add(-1, -R - 2, 0); add(-1, R, 0);
        add(-Wb - 2, -R + 2, 0); add(Wb, -R + 2, 0); add(-Wb - 2, R - 4, 0); add(Wb, R - 4, 0);
        c = Wb - 2; r = R - 2; z = 1;
        while (c > 0 && r > 0) { rect(c, r, z); c -= 2; r -= 2; z++; }
        add(-1, -1, z);
      } else if (name === 'fortress') {
        c = [6, 6, 8, 8][s]; r = [6, 8, 8, 10][s];
        rect(c, r, 0);
        for (i = 0; i < c; i++) for (j = 0; j < r; j++) {
          if (i === 0 || j === 0 || i === c - 1 || j === r - 1) add(-c + i * 2, -r + j * 2, 1);
        }
        rect(c - 4, r - 4, 1); if (c > 6 && r > 6) rect(c - 6, r - 6, 2);
        [[0, 0], [c - 1, 0], [0, r - 1], [c - 1, r - 1]].forEach(function (p) { add(-c + p[0] * 2, -r + p[1] * 2, 2); if (s >= 2) add(-c + p[0] * 2, -r + p[1] * 2, 3); });
        add(-1, -1, (c > 6 && r > 6) ? 3 : 2);
      } else if (name === 'butterfly') {
        R = [6, 7, 8, 9][s];
        var wing = [[2, 3, 3, 2, 2, 3], [3, 3, 3, 2, 2, 3, 2], [3, 3, 3, 2, 2, 3, 3, 2], [3, 3, 3, 2, 1, 2, 3, 3, 2]][s];
        for (j = 0; j < R; j++) {
          var y = -R + j * 2, ww = wing[j];
          for (i = 0; i < ww; i++) { add(-3 - i * 2, y, 0); add(1 + i * 2, y, 0); }
          if (j > 0 && j < R - 1) { add(-1, y, 0); add(-1, y, 1); if (j > 1 && j < R - 2) add(-1, y, 2); }
          if (ww >= 2) { add(-5, y, 1); add(3, y, 1); }
          if (ww >= 3 && s >= 1) { add(-5, y, 2); add(3, y, 2); }
        }
        add(-3, -R - 2, 0); add(1, -R - 2, 0);
      } else { // cross
        var arm = [6, 8, 8, 8][s], th = [2, 2, 2, 4][s];
        rect(arm, 2, 0); rect(2, arm, 0); rect(4, 4, 0);
        if (th > 2) { rect(arm - 2, 4, 0); rect(4, arm - 2, 0); }
        z = 1; var k2 = arm - 2;
        while (k2 >= 2) { rect(k2, 2, z); rect(2, k2, z); z++; k2 -= 2; }
        add(-1, -1, z);
        if (arm === 6) { add(-arm - 2, -1, 0); add(arm, -1, 0); add(-1, -arm - 2, 0); add(-1, arm, 0); }
      }
      if (P.length % 2) {
        var top = 0; for (i = 1; i < P.length; i++) if (P[i].z > P[top].z || (P[i].z === P[top].z && Math.abs(P[i].x) + Math.abs(P[i].y) < Math.abs(P[top].x) + Math.abs(P[top].y))) top = i;
        P.splice(top, 1);
      }
      return P;
    }

    /* ---------- решаемая раздача: кладём пары в обратном порядке ---------- */
    function genOrder(pos) {
      var n = pos.length, below = [], above = [], left = [], right = [], band = [], i, j;
      for (i = 0; i < n; i++) { below.push([]); above.push([]); left.push([]); right.push([]); band.push([]); }
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
        if (i === j) continue;
        var a = pos[i], b = pos[j], dx = b.x - a.x, dy = b.y - a.y;
        if (Math.abs(dx) < 2 && Math.abs(dy) < 2) { if (b.z === a.z - 1) below[i].push(j); if (b.z === a.z + 1) above[i].push(j); }
        if (b.z === a.z && Math.abs(dy) < 2) { if (dx === -2) left[i].push(j); if (dx === 2) right[i].push(j); }
      }
      // сегменты рядов: связные по соседству слева/справа
      for (i = 0; i < n; i++) {
        var seen = {}, st = [i]; seen[i] = 1;
        while (st.length) { var q = st.pop(), nb = left[q].concat(right[q]); for (j = 0; j < nb.length; j++) if (!seen[nb[j]]) { seen[nb[j]] = 1; st.push(nb[j]); } }
        for (var kk in seen) if (+kk !== i) band[i].push(+kk);
      }
      function any(list, pl) { for (var k = 0; k < list.length; k++) if (pl[list[k]]) return true; return false; }
      function valid(k, pl) {
        if (pl[k]) return false;
        for (var q = 0; q < below[k].length; q++) if (!pl[below[k][q]]) return false;
        var L = any(left[k], pl), Rr = any(right[k], pl);
        if (L && Rr) return false;
        if (!L && !Rr && any(band[k], pl)) return false;
        return true;
      }
      for (var attempt = 0; attempt < 400; attempt++) {
        var pl = new Uint8Array(n), cnt = 0, pairs = [], ok = true;
        while (cnt < n) {
          var c = [];
          for (i = 0; i < n; i++) if (valid(i, pl)) c.push(i);
          if (c.length < 2) { ok = false; break; }
          shuf(c);
          var got = false;
          for (var ai = 0; ai < c.length && ai < 10 && !got; ai++) {
            var A = c[ai]; pl[A] = 1;
            var c2 = [];
            for (i = 0; i < n; i++) if (valid(i, pl) && above[A].indexOf(i) < 0) {
              pl[i] = 1; var fa = !(any(left[A], pl) && any(right[A], pl)); pl[i] = 0;
              if (fa) c2.push(i);
            }
            if (c2.length) {
              // предпочитаем кости подальше друг от друга — интереснее
              var B = c2[Math.floor(Math.random() * c2.length)];
              if (c2.length > 2 && Math.random() < 0.5) { var B2 = c2[Math.floor(Math.random() * c2.length)]; if (Math.abs(pos[B2].x - pos[A].x) + Math.abs(pos[B2].y - pos[A].y) > Math.abs(pos[B].x - pos[A].x) + Math.abs(pos[B].y - pos[A].y)) B = B2; }
              pl[B] = 1; pairs.push([A, B]); cnt += 2; got = true;
            } else pl[A] = 0;
          }
          if (!got) { ok = false; break; }
        }
        if (ok) return pairs;
      }
      return null;
    }

    function facePool(nPairs) {
      var div = [1, 1.25, 1.6, 2][api.diff], fc = Math.min(NF, Math.max(10, Math.ceil(nPairs / div)));
      var all = []; for (var i = 0; i < NF; i++) all.push(i);
      shuf(all); all = all.slice(0, fc);
      var list = []; for (i = 0; i < nPairs; i++) list.push(all[i % fc]);
      return shuf(list);
    }

    function deal() {
      var name = LAYOUTS[layoutIdx % LAYOUTS.length];
      var s = Math.min(3, api.diff + (level > 3 ? 1 : 0));
      if (api.diff === 0) s = level > 2 ? 1 : 0;
      var pos = buildLayout(name, s), pairs = genOrder(pos), i;
      tiles = [];
      for (i = 0; i < pos.length; i++) tiles.push({ x: pos[i].x, y: pos[i].y, z: pos[i].z, f: 0, alive: true, free: false, shake: 0, drop: 0, flip: 0 });
      var faces = facePool(pos.length / 2);
      if (pairs) for (i = 0; i < pairs.length; i++) { tiles[pairs[i][0]].f = faces[i]; tiles[pairs[i][1]].f = faces[i]; }
      else { var fl = []; for (i = 0; i < faces.length; i++) fl.push(faces[i], faces[i]); shuf(fl); for (i = 0; i < tiles.length; i++) tiles[i].f = fl[i]; }
      curLayout = name;
      // анимация раздачи
      var mx = 0; tiles.forEach(function (t) { mx = Math.max(mx, t.z); });
      tiles.forEach(function (t) { t.drop = 0.25 + t.z * 0.22 + ((t.y + 20) * 0.012 + (t.x + 20) * 0.004) + Math.random() * 0.05; });
      dealT = 0;
      timeMax = Math.round(tiles.length * [5, 3.4, 2.6, 2.0][api.diff] + 25);
      timeLeft = timeMax; boardTime = 0;
      sel = -1; hintPair = null; flying = []; combo = 0; lastMatch = -99;
      phase = 'deal'; phaseT = 0;
      layout(); refresh();
    }

    /* ---------- логика свободы ---------- */
    function refresh() {
      var n = tiles.length, i, j;
      for (i = 0; i < n; i++) {
        var a = tiles[i]; if (!a.alive) continue;
        var up = false, L = false, R = false;
        for (j = 0; j < n && !up; j++) {
          if (i === j) continue; var b = tiles[j]; if (!b.alive) continue;
          var dx = b.x - a.x, dy = b.y - a.y;
          if (b.z === a.z + 1 && Math.abs(dx) < 2 && Math.abs(dy) < 2) up = true;
          else if (b.z === a.z && Math.abs(dy) < 2) { if (dx === -2) L = true; else if (dx === 2) R = true; }
        }
        a.free = !up && !(L && R);
      }
      order = [];
      for (i = 0; i < n; i++) if (tiles[i].alive) order.push(i);
      order.sort(function (p, q) { var a = tiles[p], b = tiles[q]; return a.z - b.z || a.y - b.y || b.x - a.x; });
      avail = findPairs();
    }
    function findPairs() {
      var by = {}, cnt = 0, first = null;
      for (var i = 0; i < tiles.length; i++) { var t = tiles[i]; if (t.alive && t.free) (by[t.f] = by[t.f] || []).push(i); }
      for (var f in by) { var k = by[f].length; if (k >= 2) { cnt += k * (k - 1) / 2; if (!first) first = [by[f][0], by[f][1]]; } }
      return { n: cnt, first: first };
    }
    function aliveCount() { var c = 0; for (var i = 0; i < tiles.length; i++) if (tiles[i].alive) c++; return c; }

    function doShuffle(auto) {
      var idx = [], pos = [], i;
      for (i = 0; i < tiles.length; i++) if (tiles[i].alive) { idx.push(i); pos.push(tiles[i]); }
      if (idx.length < 2) return;
      var pairs = genOrder(pos), cnt = {}, fl = [];
      idx.forEach(function (k) { cnt[tiles[k].f] = (cnt[tiles[k].f] || 0) + 1; });
      for (var f in cnt) for (i = 0; i < cnt[f]; i += 2) fl.push(+f);
      shuf(fl);
      if (pairs) for (i = 0; i < pairs.length; i++) { tiles[idx[pairs[i][0]]].f = fl[i]; tiles[idx[pairs[i][1]]].f = fl[i]; }
      else { var all = []; fl.forEach(function (f) { all.push(f, f); }); shuf(all); idx.forEach(function (k, j) { tiles[k].f = all[j]; }); }
      idx.forEach(function (k) { tiles[k].flip = 0.5 + Math.random() * 0.25; });
      sel = -1; hintPair = null;
      api.sound('rotate'); api.tone(300, 0.25, 'sine', 0.05, 300);
      if (!auto) api.toast(api.t('mahjong.shuffled'));
      refresh();
      if (!avail.n && phase === 'play') stuck();
    }

    /* ---------- графика ---------- */
    function layout() {
      var W = api.W, H = api.H;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      var mnx = 99, mxx = -99, mny = 99, mxy = -99, mz = 0;
      tiles.forEach(function (t) { mnx = Math.min(mnx, t.x); mxx = Math.max(mxx, t.x + 2); mny = Math.min(mny, t.y); mxy = Math.max(mxy, t.y + 2); mz = Math.max(mz, t.z); });
      if (!tiles.length) { mnx = -8; mxx = 8; mny = -10; mxy = 10; }
      var top = 66, bot = 86, aw = W - 14, ah = H - top - bot - 8;
      var cw = (mxx - mnx) / 2, ch = (mxy - mny) / 2, k = 0.15, AR = 1.3;
      var tw1 = aw / (cw + k + mz * k), tw2 = ah / (ch * AR + k + mz * k);
      TW = Math.floor(Math.min(tw1, tw2, 66)); TH = Math.round(TW * AR);
      EX = Math.max(4, Math.round(TW * 0.15)); EY = EX;
      var fullW = cw * TW + EX * (mz + 1), fullH = ch * TH + EY * (mz + 1);
      OX = (W - fullW) / 2 - mnx * TW / 2;
      OY = top + 4 + (ah - fullH) / 2 + mz * EY - mny * TH / 2;
      buildArt();
    }
    function buildArt() {
      var W = api.W, H = api.H, c, g, i;
      lw = W; lh = H;
      // фон: нефритовое сукно с узором облаков
      bgL = mkC(W, H); c = bgL.getContext('2d');
      g = c.createRadialGradient(W / 2, H * 0.45, 20, W / 2, H * 0.45, Math.max(W, H) * 0.8);
      g.addColorStop(0, '#13786c'); g.addColorStop(0.55, '#0b4f48'); g.addColorStop(1, '#03201e');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      var s = 1234567; function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
      if (api.quality > 0) {
        for (i = 0; i < W * H / 9; i++) { c.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.05)'; c.fillRect(rnd() * W, rnd() * H, 1, 1); }
      }
      // узор «облака»
      c.strokeStyle = 'rgba(253,230,138,.07)'; c.lineWidth = 1.5;
      for (var yy = 30; yy < H; yy += 70) for (var xx = ((yy / 70) % 2) * 45; xx < W + 40; xx += 90) {
        c.beginPath(); c.arc(xx, yy, 12, Math.PI, 0); c.arc(xx + 16, yy, 8, Math.PI, 0); c.moveTo(xx - 12, yy); c.arc(xx - 4, yy, 8, Math.PI, Math.PI * 2, true); c.stroke();
        c.beginPath(); c.arc(xx, yy, 5, Math.PI, 0); c.stroke();
      }
      // рамка-орнамент
      c.strokeStyle = 'rgba(253,224,71,.22)'; c.lineWidth = 2; rr(c, 6, 6, W - 12, H - 12, 14); c.stroke();
      c.strokeStyle = 'rgba(253,224,71,.1)'; c.lineWidth = 1; rr(c, 11, 11, W - 22, H - 22, 10); c.stroke();
      [[14, 14, 1, 1], [W - 14, 14, -1, 1], [14, H - 14, 1, -1], [W - 14, H - 14, -1, -1]].forEach(function (p) {
        c.strokeStyle = 'rgba(253,224,71,.35)'; c.lineWidth = 2; c.beginPath();
        c.moveTo(p[0], p[1] + p[3] * 22); c.lineTo(p[0], p[1]); c.lineTo(p[0] + p[2] * 22, p[1]);
        c.moveTo(p[0] + p[2] * 6, p[1] + p[3] * 14); c.lineTo(p[0] + p[2] * 6, p[1] + p[3] * 6); c.lineTo(p[0] + p[2] * 14, p[1] + p[3] * 6); c.stroke();
      });
      g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // нижняя панель
      barL = mkC(W, 90); c = barL.getContext('2d');
      var bw = Math.min(170, (W - 48) / 2), bh = 54, by = 18;
      btnH = { x: W / 2 - bw - 8, y: H - 90 + by, w: bw, h: bh };
      btnS = { x: W / 2 + 8, y: H - 90 + by, w: bw, h: bh };
      [[btnH.x, '#f59e0b', '#b45309'], [btnS.x, '#0ea5e9', '#1d4ed8']].forEach(function (b, k) {
        c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 10; c.shadowOffsetY = 4;
        c.fillStyle = b[2]; rr(c, b[0], by + 4, bw, bh - 4, 16); c.fill(); c.restore();
        g = c.createLinearGradient(0, by, 0, by + bh - 6); g.addColorStop(0, b[1]); g.addColorStop(1, b[2]);
        c.fillStyle = g; rr(c, b[0], by, bw, bh - 6, 16); c.fill();
        g = c.createLinearGradient(0, by, 0, by + 22); g.addColorStop(0, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; rr(c, b[0] + 3, by + 2, bw - 6, 20, 13); c.fill();
        // иконки
        var ix = b[0] + 26, iy = by + (bh - 6) / 2;
        c.lineCap = 'round'; c.lineJoin = 'round';
        if (k === 0) {
          c.fillStyle = '#fffbeb'; c.beginPath(); c.arc(ix, iy - 3, 9, Math.PI * 0.8, Math.PI * 2.2); c.lineTo(ix + 4, iy + 8); c.lineTo(ix - 4, iy + 8); c.closePath(); c.fill();
          c.fillStyle = '#78350f'; c.fillRect(ix - 4, iy + 9, 8, 2); c.fillRect(ix - 3, iy + 12, 6, 2);
          c.strokeStyle = 'rgba(255,251,235,.8)'; c.lineWidth = 2; c.beginPath();
          c.moveTo(ix - 15, iy - 8); c.lineTo(ix - 12, iy - 6); c.moveTo(ix + 15, iy - 8); c.lineTo(ix + 12, iy - 6); c.moveTo(ix, iy - 18); c.lineTo(ix, iy - 15); c.stroke();
        } else {
          c.strokeStyle = '#eff6ff'; c.lineWidth = 3; c.beginPath();
          c.moveTo(ix - 11, iy - 6); c.lineTo(ix - 4, iy - 6); c.bezierCurveTo(ix + 2, iy - 6, ix + 2, iy + 6, ix + 8, iy + 6); c.lineTo(ix + 11, iy + 6);
          c.moveTo(ix - 11, iy + 6); c.lineTo(ix - 4, iy + 6); c.bezierCurveTo(ix + 2, iy + 6, ix + 2, iy - 6, ix + 8, iy - 6); c.lineTo(ix + 11, iy - 6);
          c.moveTo(ix + 8, iy - 10); c.lineTo(ix + 12, iy - 6); c.lineTo(ix + 8, iy - 2); c.moveTo(ix + 8, iy + 2); c.lineTo(ix + 12, iy + 6); c.lineTo(ix + 8, iy + 10); c.stroke();
        }
      });
      buildTiles();
    }

    // ---- символы костей ----
    function dot(c, x, y, r, col, big) {
      c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
      c.fillStyle = '#fffdf4'; c.beginPath(); c.arc(x, y, r * 0.7, 0, 6.283); c.fill();
      c.fillStyle = col; c.beginPath(); c.arc(x, y, r * 0.5, 0, 6.283); c.fill();
      if (big) {
        c.strokeStyle = '#fffdf4'; c.lineWidth = Math.max(1, r * 0.08);
        for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.75); c.lineTo(x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95); c.stroke(); }
        c.fillStyle = '#15803d'; c.beginPath(); c.arc(x, y, r * 0.3, 0, 6.283); c.fill();
      }
      c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(x - r * 0.18, y - r * 0.18, r * 0.16, 0, 6.283); c.fill();
    }
    function stick(c, x, y, len, w, col) {
      var dark = col === 'r' ? '#7f1d1d' : col === 'b' ? '#1e3a8a' : '#14532d', mid = col === 'r' ? '#dc2626' : col === 'b' ? '#2563eb' : '#16a34a', lt = col === 'r' ? '#fca5a5' : col === 'b' ? '#93c5fd' : '#86efac';
      var g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      g.addColorStop(0, dark); g.addColorStop(0.35, lt); g.addColorStop(0.6, mid); g.addColorStop(1, dark);
      c.fillStyle = g; rr(c, x - w / 2, y - len / 2, w, len, w / 2); c.fill();
      c.fillStyle = dark;
      c.fillRect(x - w / 2 - 0.6, y - 0.8, w + 1.2, 1.6);
      c.fillRect(x - w / 2 - 0.4, y - len / 2 + 1, w + 0.8, 1.2); c.fillRect(x - w / 2 - 0.4, y + len / 2 - 2.2, w + 0.8, 1.2);
    }
    function strokeSet(c, col, lw) { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; }
    function drawFace(c, f, bx, by, bw, bh) {
      var cx = bx + bw / 2, cy = by + bh / 2, i, u = Math.min(bw, bh);
      var B = '#1d4ed8', G = '#15803d', R = '#b91c1c';
      function P(px, py) { return [bx + px * bw, by + py * bh]; }
      if (f < 9) { // кружки
        var n = f + 1, pts = [], r = bw * [0.42, 0.2, 0.17, 0.19, 0.17, 0.165, 0.14, 0.14, 0.135][f], cols = [];
        if (n === 1) { dot(c, cx, cy, r, R, true); dot(c, cx, cy, r * 0.42, B); return; }
        if (n === 2) { pts = [[0.5, 0.27], [0.5, 0.73]]; cols = [B, G]; }
        if (n === 3) { pts = [[0.23, 0.2], [0.5, 0.5], [0.77, 0.8]]; cols = [B, R, G]; }
        if (n === 4) { pts = [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]]; cols = [B, G, G, B]; }
        if (n === 5) { pts = [[0.24, 0.22], [0.76, 0.22], [0.5, 0.5], [0.24, 0.78], [0.76, 0.78]]; cols = [B, G, R, G, B]; }
        if (n === 6) { pts = [[0.28, 0.17], [0.72, 0.17], [0.28, 0.55], [0.72, 0.55], [0.28, 0.84], [0.72, 0.84]]; cols = [G, G, R, R, R, R]; }
        if (n === 7) { pts = [[0.2, 0.1], [0.5, 0.2], [0.8, 0.3], [0.28, 0.6], [0.72, 0.6], [0.28, 0.86], [0.72, 0.86]]; cols = [G, G, G, R, R, R, R]; }
        if (n === 8) { for (i = 0; i < 4; i++) { pts.push([0.28, 0.12 + i * 0.255], [0.72, 0.12 + i * 0.255]); cols.push(B, B); } }
        if (n === 9) { for (i = 0; i < 9; i++) { pts.push([0.2 + (i % 3) * 0.3, 0.17 + Math.floor(i / 3) * 0.33]); cols.push([B, R, G][Math.floor(i / 3)]); } }
        for (i = 0; i < pts.length; i++) { var p = P(pts[i][0], pts[i][1]); dot(c, p[0], p[1], r, cols[i]); }
        return;
      }
      if (f < 18) { // бамбук
        n = f - 8;
        var sw = Math.max(3, bw * 0.17);
        if (n === 1) { // птица на ветке
          c.save(); c.translate(cx, cy + bh * 0.05);
          c.fillStyle = '#1d4ed8'; for (i = -2; i <= 2; i++) { c.save(); c.rotate(i * 0.32 + 0.4); c.beginPath(); c.ellipse(0, bh * 0.25, bw * 0.08, bh * 0.2, 0, 0, 6.283); c.fill(); c.restore(); }
          c.fillStyle = '#15803d'; c.beginPath(); c.ellipse(0, -bh * 0.02, bw * 0.24, bh * 0.16, -0.5, 0, 6.283); c.fill();
          c.fillStyle = '#16a34a'; c.beginPath(); c.ellipse(-bw * 0.05, bh * 0.02, bw * 0.16, bh * 0.08, -0.7, 0, 6.283); c.fill();
          c.fillStyle = '#b91c1c'; c.beginPath(); c.arc(bw * 0.18, -bh * 0.2, bw * 0.12, 0, 6.283); c.fill();
          c.fillStyle = '#f59e0b'; c.beginPath(); c.moveTo(bw * 0.28, -bh * 0.22); c.lineTo(bw * 0.42, -bh * 0.18); c.lineTo(bw * 0.28, -bh * 0.15); c.fill();
          c.fillStyle = '#fff'; c.beginPath(); c.arc(bw * 0.2, -bh * 0.22, bw * 0.035, 0, 6.283); c.fill();
          c.fillStyle = '#b91c1c'; c.beginPath(); c.moveTo(bw * 0.12, -bh * 0.3); c.lineTo(bw * 0.1, -bh * 0.42); c.lineTo(bw * 0.2, -bh * 0.32); c.fill();
          c.restore(); return;
        }
        var rows, L2;
        if (n === 2) { L2 = bh * 0.4; stick(c, cx, by + bh * 0.25, L2, sw, 'b'); stick(c, cx, by + bh * 0.75, L2, sw, 'g'); return; }
        if (n === 3) { L2 = bh * 0.4; stick(c, cx, by + bh * 0.25, L2, sw, 'b'); stick(c, bx + bw * 0.28, by + bh * 0.75, L2, sw, 'g'); stick(c, bx + bw * 0.72, by + bh * 0.75, L2, sw, 'g'); return; }
        if (n === 4 || n === 5) {
          L2 = bh * 0.4;
          stick(c, bx + bw * 0.24, by + bh * 0.25, L2, sw, 'g'); stick(c, bx + bw * 0.76, by + bh * 0.25, L2, sw, 'b');
          stick(c, bx + bw * 0.24, by + bh * 0.75, L2, sw, 'b'); stick(c, bx + bw * 0.76, by + bh * 0.75, L2, sw, 'g');
          if (n === 5) stick(c, cx, cy, L2, sw, 'r'); return;
        }
        if (n === 6) { L2 = bh * 0.4; for (i = 0; i < 3; i++) { stick(c, bx + bw * (0.2 + i * 0.3), by + bh * 0.25, L2, sw, 'g'); stick(c, bx + bw * (0.2 + i * 0.3), by + bh * 0.75, L2, sw, 'b'); } return; }
        if (n === 7) { L2 = bh * 0.28; stick(c, cx, by + bh * 0.16, L2, sw, 'r'); for (i = 0; i < 3; i++) { stick(c, bx + bw * (0.2 + i * 0.3), by + bh * 0.5, L2, sw, 'g'); stick(c, bx + bw * (0.2 + i * 0.3), by + bh * 0.84, L2, sw, 'b'); } return; }
        if (n === 8) {
          L2 = bh * 0.4; sw = Math.max(3, bw * 0.14);
          for (i = 0; i < 2; i++) {
            var yy = by + bh * (0.25 + i * 0.5);
            c.save(); c.translate(bx + bw * 0.22, yy); c.rotate(i ? 0.35 : -0.35); stick(c, 0, 0, L2, sw, 'g'); c.restore();
            c.save(); c.translate(bx + bw * 0.42, yy); c.rotate(i ? -0.35 : 0.35); stick(c, 0, 0, L2, sw, 'g'); c.restore();
            c.save(); c.translate(bx + bw * 0.58, yy); c.rotate(i ? 0.35 : -0.35); stick(c, 0, 0, L2, sw, 'b'); c.restore();
            c.save(); c.translate(bx + bw * 0.78, yy); c.rotate(i ? -0.35 : 0.35); stick(c, 0, 0, L2, sw, 'b'); c.restore();
          }
          return;
        }
        L2 = bh * 0.28; for (i = 0; i < 9; i++) stick(c, bx + bw * (0.2 + (i % 3) * 0.3), by + bh * (0.16 + Math.floor(i / 3) * 0.34), L2, sw, (i % 3) === 1 ? 'r' : (i % 3) === 0 ? 'g' : 'b');
        return;
      }
      if (f < 27) { // иероглифы: число + знак «десять тысяч»
        n = f - 17;
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = '900 ' + Math.round(bh * 0.42) + 'px Georgia, "Times New Roman", serif';
        c.fillStyle = '#0f172a'; c.fillText(String(n), cx, by + bh * 0.25);
        var lwd = Math.max(1.6, bw * 0.085); strokeSet(c, R, lwd);
        var x0 = bx + bw * 0.12, w0 = bw * 0.76, y0 = by + bh * 0.5, h0 = bh * 0.48;
        function Lp(a, b2, cc, d) { c.beginPath(); c.moveTo(x0 + a * w0, y0 + b2 * h0); c.lineTo(x0 + cc * w0, y0 + d * h0); c.stroke(); }
        Lp(0.08, 0.1, 0.92, 0.1); Lp(0.3, 0, 0.3, 0.22); Lp(0.7, 0, 0.7, 0.22);
        c.strokeRect(x0 + 0.24 * w0, y0 + 0.3 * h0, 0.52 * w0, 0.26 * h0); Lp(0.5, 0.3, 0.5, 0.56); Lp(0.24, 0.43, 0.76, 0.43);
        Lp(0.5, 0.56, 0.5, 0.74);
        c.beginPath(); c.moveTo(x0 + 0.14 * w0, y0 + h0); c.lineTo(x0 + 0.14 * w0, y0 + 0.72 * h0); c.lineTo(x0 + 0.86 * w0, y0 + 0.72 * h0); c.lineTo(x0 + 0.86 * w0, y0 + 0.96 * h0); c.lineTo(x0 + 0.76 * w0, y0 + h0); c.stroke();
        Lp(0.36, 0.95, 0.56, 0.8); Lp(0.5, 0.88, 0.62, 0.96);
        return;
      }
      if (f < 31) { // ветра
        var lt = ['E', 'S', 'W', 'N'][f - 27];
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.strokeStyle = 'rgba(30,58,138,.35)'; c.lineWidth = Math.max(1, bw * 0.04);
        c.beginPath(); c.arc(cx, cy, u * 0.44, 0, 6.283); c.stroke();
        var ang = [0, Math.PI / 2, Math.PI, -Math.PI / 2][f - 27];
        c.fillStyle = 'rgba(185,28,28,.85)'; c.save(); c.translate(cx, cy); c.rotate(ang);
        c.beginPath(); c.moveTo(u * 0.5, 0); c.lineTo(u * 0.36, -u * 0.07); c.lineTo(u * 0.36, u * 0.07); c.fill(); c.restore();
        c.font = '900 ' + Math.round(bh * 0.55) + 'px Georgia, "Times New Roman", serif';
        c.fillStyle = '#0f172a'; c.fillText(lt, cx, cy + bh * 0.03);
        return;
      }
      if (f === 31) { // красный дракон 中
        strokeSet(c, R, Math.max(2.4, bw * 0.13));
        c.strokeRect(bx + bw * 0.16, by + bh * 0.32, bw * 0.68, bh * 0.3);
        c.beginPath(); c.moveTo(cx, by + bh * 0.08); c.lineTo(cx, by + bh * 0.94); c.stroke();
        return;
      }
      if (f === 32) { // зелёный дракон — стилизованный знак
        strokeSet(c, G, Math.max(2, bw * 0.1));
        c.beginPath(); c.moveTo(bx + bw * 0.15, by + bh * 0.12); c.lineTo(bx + bw * 0.38, by + bh * 0.24); c.lineTo(bx + bw * 0.22, by + bh * 0.34);
        c.moveTo(bx + bw * 0.85, by + bh * 0.12); c.lineTo(bx + bw * 0.62, by + bh * 0.24); c.lineTo(bx + bw * 0.78, by + bh * 0.34);
        c.moveTo(bx + bw * 0.12, by + bh * 0.42); c.lineTo(bx + bw * 0.88, by + bh * 0.42);
        c.moveTo(bx + bw * 0.22, by + bh * 0.52); c.lineTo(bx + bw * 0.45, by + bh * 0.52); c.lineTo(bx + bw * 0.42, by + bh * 0.66); c.lineTo(bx + bw * 0.2, by + bh * 0.66); c.lineTo(bx + bw * 0.22, by + bh * 0.8); c.lineTo(bx + bw * 0.42, by + bh * 0.8); c.quadraticCurveTo(bx + bw * 0.42, by + bh * 0.93, bx + bw * 0.3, by + bh * 0.92);
        c.moveTo(bx + bw * 0.6, by + bh * 0.52); c.lineTo(bx + bw * 0.8, by + bh * 0.52); c.lineTo(bx + bw * 0.8, by + bh * 0.64);
        c.moveTo(bx + bw * 0.58, by + bh * 0.7); c.lineTo(bx + bw * 0.84, by + bh * 0.92); c.moveTo(bx + bw * 0.84, by + bh * 0.7); c.lineTo(bx + bw * 0.56, by + bh * 0.92);
        c.stroke(); return;
      }
      if (f === 33) { // белый дракон — синяя рамка
        strokeSet(c, B, Math.max(2, bw * 0.08));
        c.strokeRect(bx + bw * 0.12, by + bh * 0.1, bw * 0.76, bh * 0.8);
        c.lineWidth = Math.max(1, bw * 0.035); c.strokeRect(bx + bw * 0.24, by + bh * 0.2, bw * 0.52, bh * 0.6);
        return;
      }
      // цветы и времена года
      var k = f - 34, flower = k < 4;
      c.save(); c.translate(cx, cy + bh * 0.04);
      var rad = u * 0.36;
      if (flower) {
        var pc = ['#ec4899', '#a855f7', '#f59e0b', '#f472b6'][k], np = [5, 3, 14, 8][k];
        strokeSet(c, '#15803d', Math.max(1.5, bw * 0.06));
        c.beginPath(); c.moveTo(0, rad * 0.3); c.quadraticCurveTo(-rad * 0.2, rad * 1.1, rad * 0.1, rad * 1.35); c.stroke();
        c.fillStyle = '#16a34a'; c.beginPath(); c.ellipse(rad * 0.35, rad * 0.95, rad * 0.32, rad * 0.12, -0.6, 0, 6.283); c.fill();
        c.translate(0, -rad * 0.2);
        c.fillStyle = pc;
        for (i = 0; i < np; i++) {
          c.save(); c.rotate(i * 6.283 / np + (k === 1 ? -Math.PI / 2 : 0));
          c.beginPath();
          if (k === 2) c.ellipse(rad * 0.48, 0, rad * 0.45, rad * 0.1, 0, 0, 6.283);
          else if (k === 1) c.ellipse(rad * 0.48, 0, rad * 0.55, rad * 0.2, 0, 0, 6.283);
          else if (k === 3) c.ellipse(rad * 0.45, 0, rad * 0.42, rad * 0.2, 0, 0, 6.283);
          else c.arc(rad * 0.48, 0, rad * 0.38, 0, 6.283);
          c.fill(); c.restore();
        }
        c.fillStyle = k === 2 ? '#b45309' : '#fde047'; c.beginPath(); c.arc(0, 0, rad * 0.22, 0, 6.283); c.fill();
      } else if (k === 4) { // весна — росток
        strokeSet(c, '#15803d', Math.max(2, bw * 0.08));
        c.beginPath(); c.moveTo(0, rad * 1.1); c.lineTo(0, -rad * 0.3); c.stroke();
        c.fillStyle = '#22c55e';
        c.beginPath(); c.ellipse(-rad * 0.45, -rad * 0.2, rad * 0.5, rad * 0.22, 0.5, 0, 6.283); c.fill();
        c.beginPath(); c.ellipse(rad * 0.45, -rad * 0.55, rad * 0.5, rad * 0.22, -0.5, 0, 6.283); c.fill();
        c.fillStyle = '#92400e'; rr(c, -rad * 0.7, rad * 0.9, rad * 1.4, rad * 0.35, rad * 0.1); c.fill();
      } else if (k === 5) { // лето — солнце
        c.fillStyle = '#f97316';
        for (i = 0; i < 12; i++) { c.save(); c.rotate(i * Math.PI / 6); c.beginPath(); c.moveTo(rad * 0.55, -rad * 0.12); c.lineTo(rad * 1.0, 0); c.lineTo(rad * 0.55, rad * 0.12); c.fill(); c.restore(); }
        c.fillStyle = '#fbbf24'; c.beginPath(); c.arc(0, 0, rad * 0.55, 0, 6.283); c.fill();
        c.fillStyle = '#dc2626'; c.beginPath(); c.arc(0, 0, rad * 0.3, 0, 6.283); c.fill();
      } else if (k === 6) { // осень — клён
        c.fillStyle = '#dc2626'; c.beginPath();
        for (i = 0; i < 10; i++) { var aa = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? rad * 0.45 : rad; if (i === 5) rr2 = rad * 0.6; c.lineTo(Math.cos(aa) * rr2, Math.sin(aa) * rr2); }
        c.closePath(); c.fill();
        strokeSet(c, '#7f1d1d', Math.max(1, bw * 0.04)); c.beginPath(); c.moveTo(0, rad * 1.2); c.lineTo(0, -rad * 0.6); c.stroke();
      } else { // зима — снежинка
        strokeSet(c, '#2563eb', Math.max(1.6, bw * 0.065));
        for (i = 0; i < 6; i++) {
          c.save(); c.rotate(i * Math.PI / 3); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -rad);
          c.moveTo(0, -rad * 0.55); c.lineTo(-rad * 0.25, -rad * 0.78); c.moveTo(0, -rad * 0.55); c.lineTo(rad * 0.25, -rad * 0.78); c.stroke(); c.restore();
        }
      }
      c.restore();
      // номер в уголке
      c.font = '800 ' + Math.max(8, Math.round(bh * 0.17)) + 'px system-ui, sans-serif'; c.textAlign = 'right'; c.textBaseline = 'top';
      c.fillStyle = flower ? '#b91c1c' : '#1d4ed8'; c.fillText(String((k % 4) + 1), bx + bw + 1, by - 1);
    }

    function buildTiles() {
      var PAD = 10, sw = TW + EX + PAD * 2, sh = TH + EY + PAD * 2, i, g, c;
      faceS = [];
      function body(c, steps) {
        var n = 5;
        for (var k = 0; k <= n; k++) {
          var fx = PAD + EX * k / n, fy = PAD + EY * (1 - k / n), col;
          if (k <= 1) col = '#065f46'; else if (k === 2) col = '#0f766e'; else if (k === 3) col = '#bfb08a'; else if (k === 4) col = '#d8caa4'; else col = null;
          if (!col) break;
          c.fillStyle = col; rr(c, fx, fy, TW, TH, TW * 0.13); c.fill();
        }
      }
      for (i = 0; i < NF; i++) {
        var o = mkC(sw, sh); c = o.getContext('2d');
        c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 9; c.shadowOffsetX = -3; c.shadowOffsetY = 4;
        c.fillStyle = '#065f46'; rr(c, PAD, PAD + EY, TW, TH, TW * 0.13); c.fill(); c.restore();
        body(c);
        var fx = PAD + EX, fy = PAD;
        g = c.createLinearGradient(fx, fy, fx + TW * 0.4, fy + TH);
        g.addColorStop(0, '#fffef8'); g.addColorStop(0.6, '#f6efdc'); g.addColorStop(1, '#e6d9b8');
        c.fillStyle = g; rr(c, fx, fy, TW, TH, TW * 0.13); c.fill();
        // фаска
        c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 1.2; rr(c, fx + 1, fy + 1, TW - 2, TH - 2, TW * 0.11); c.stroke();
        c.strokeStyle = 'rgba(120,100,60,.35)'; c.lineWidth = 1; rr(c, fx + 0.5, fy + 0.5, TW - 1, TH - 1, TW * 0.13); c.stroke();
        var m = TW * 0.11;
        c.save(); drawFace(c, i, fx + m, fy + m * 1.05, TW - m * 2, TH - m * 2.1); c.restore();
        // блик
        g = c.createLinearGradient(fx, fy, fx, fy + TH * 0.45);
        g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; rr(c, fx + 2, fy + 2, TW - 4, TH * 0.4, TW * 0.1); c.fill();
        faceS.push(o);
      }
      dimS = mkC(sw, sh); c = dimS.getContext('2d');
      c.fillStyle = 'rgba(28,20,6,.36)'; rr(c, PAD + EX, PAD, TW, TH, TW * 0.13); c.fill();
      selS = mkC(sw, sh); c = selS.getContext('2d');
      c.save(); c.shadowColor = '#fde047'; c.shadowBlur = 8; c.strokeStyle = '#facc15'; c.lineWidth = 3;
      rr(c, PAD + EX - 0.5, PAD - 0.5, TW + 1, TH + 1, TW * 0.14); c.stroke(); c.restore();
      c.fillStyle = 'rgba(253,224,71,.22)'; rr(c, PAD + EX, PAD, TW, TH, TW * 0.13); c.fill();
      hintS = mkC(sw, sh); c = hintS.getContext('2d');
      c.save(); c.shadowColor = '#22d3ee'; c.shadowBlur = 10; c.strokeStyle = '#67e8f9'; c.lineWidth = 3;
      rr(c, PAD + EX - 0.5, PAD - 0.5, TW + 1, TH + 1, TW * 0.14); c.stroke(); c.restore();
      c.fillStyle = 'rgba(103,232,249,.2)'; rr(c, PAD + EX, PAD, TW, TH, TW * 0.13); c.fill();
    }
    function tilePos(t) { return { x: OX + t.x * TW / 2 + t.z * EX, y: OY + t.y * TH / 2 - t.z * EY }; } // левый верх лицевой стороны = x+EX
    function hitTile(px, py) {
      for (var k = order.length - 1; k >= 0; k--) {
        var t = tiles[order[k]], p = tilePos(t);
        if (px >= p.x + EX && px <= p.x + EX + TW && py >= p.y && py <= p.y + TH) return order[k];
      }
      return -1;
    }

    /* ---------- ход ---------- */
    function tapTile(i) {
      var t = tiles[i];
      if (!t.free) { t.shake = 0.35; api.tone(150, 0.08, 'square', 0.04); api.vibrate(15); if (blockedTips < 2) { blockedTips++; api.toast(api.t('mahjong.blocked')); } return; }
      if (sel === i) { sel = -1; api.tone(420, 0.04, 'triangle', 0.04); return; }
      if (sel >= 0 && tiles[sel].f === t.f) { match(sel, i); return; }
      if (sel >= 0) tiles[sel].shake = 0.2;
      sel = i; api.tone(660, 0.05, 'triangle', 0.06); api.vibrate(6);
    }
    function match(a, b) {
      var A = tiles[a], B = tiles[b], pa = tilePos(A), pb = tilePos(B);
      A.alive = false; B.alive = false; sel = -1; hintPair = null;
      var mx = (pa.x + pb.x) / 2 + EX + TW / 2, my = (pa.y + pb.y) / 2 + TH / 2;
      flying.push({ f: A.f, x: pa.x, y: pa.y, tx: mx - EX - TW / 2 - TW * 0.3, ty: my - TH / 2, t: 0 });
      flying.push({ f: B.f, x: pb.x, y: pb.y, tx: mx - EX - TW / 2 + TW * 0.3, ty: my - TH / 2, t: 0 });
      if (clock - lastMatch < 4.5) combo = Math.min(combo + 1, 9); else combo = 0;
      lastMatch = clock;
      var pts = 10 + Math.max(A.z, B.z) * 2 + combo * 5;
      api.addScore(pts);
      setTimeout(function () {
        api.fx.burst(mx, my, '#fde047', api.quality ? 16 : 8, 170, 3);
        api.fx.text(mx, my - 16, '+' + pts, combo >= 2 ? '#fb923c' : '#fde047', combo >= 2 ? 22 : 18);
      }, 220);
      api.tone(880 + combo * 60, 0.08, 'triangle', 0.07);
      setTimeout(function () { api.tone(1175 + combo * 60, 0.1, 'triangle', 0.06); }, 70);
      if (combo >= 2) api.toast(api.t('mahjong.combo', combo + 1));
      api.vibrate(12);
      refresh();
      if (!aliveCount()) { boardClear(); return; }
      if (!avail.n) stuck();
    }
    function stuck() {
      if (shuffles > 0) { shuffles--; stuckMsg = 2; api.toast(api.t('mahjong.noMoves')); setTimeout(function () { if (phase === 'play') doShuffle(true); }, 600); }
      else { phase = 'over'; phaseT = 0; api.toast(api.t('mahjong.stuck')); api.sound('over'); }
    }
    function boardClear() {
      phase = 'clear'; phaseT = 0;
      var bonus = Math.round(timeLeft * [3, 4, 5, 6][api.diff]) + 150 * level;
      api.addScore(bonus);
      api.sound('win'); api.fx.confetti(api.quality ? 110 : 50); api.fx.flash('#fde68a', 0.25);
      api.fx.text(api.W / 2, api.H * 0.45, api.t('mahjong.clear'), '#fde047', 30);
      setTimeout(function () { api.fx.text(api.W / 2, api.H * 0.45 + 38, '+' + bonus, '#fff', 24); }, 300);
    }

    return {
      reset: function () {
        level = 1; layoutIdx = Math.floor(Math.random() * LAYOUTS.length); clock = 0; stuckMsg = 0;
        hints = [6, 3, 2, 1][api.diff]; shuffles = [4, 2, 1, 1][api.diff];
        deal();
      },
      resize: function () { layout(); },
      idle: function (dt) { clock += dt; if (phase === 'deal') { dealT += dt; } },
      key: function (k, d) {
        if (!d || phase !== 'play') return;
        if (k === ' ' || k === 'action' || k === 'a') useHint();
      },
      input: function (type, d) {
        if (type === 'down') { press = null; if (inBtn(btnH, d)) press = 'h'; else if (inBtn(btnS, d)) press = 's'; }
        if (type === 'up') { setTimeout(function () { press = null; }, 80); }
        if (type !== 'tap') return;
        if (phase !== 'play') return;
        if (inBtn(btnH, d)) { useHint(); return; }
        if (inBtn(btnS, d)) {
          if (shuffles > 0) { shuffles--; doShuffle(false); } else { api.tone(140, 0.1, 'square', 0.04); }
          return;
        }
        var i = hitTile(d.x, d.y);
        if (i >= 0) tapTile(i);
        else if (sel >= 0) { sel = -1; }
      },
      update: function (dt) {
        clock += dt;
        for (var i = 0; i < tiles.length; i++) { var t = tiles[i]; if (t.shake > 0) t.shake -= dt; if (t.flip > 0) t.flip -= dt; }
        for (i = flying.length - 1; i >= 0; i--) { flying[i].t += dt / 0.32; if (flying[i].t >= 1) flying.splice(i, 1); }
        if (hintT > 0) { hintT -= dt; if (hintT <= 0) hintPair = null; }
        if (stuckMsg > 0) stuckMsg -= dt;
        if (phase === 'deal') {
          dealT += dt;
          var mxd = 0; tiles.forEach(function (t) { mxd = Math.max(mxd, t.drop); });
          if (Math.floor((dealT - dt) * 14) !== Math.floor(dealT * 14) && dealT < mxd) api.tone(500 + Math.random() * 300, 0.025, 'triangle', 0.02);
          if (dealT > mxd + 0.35) { phase = 'play'; if (!avail.n) stuck(); }
          return;
        }
        if (phase === 'play') {
          timeLeft -= dt; boardTime += dt;
          if (timeLeft <= 10 && Math.floor(timeLeft + dt) !== Math.floor(timeLeft) && timeLeft > 0) api.tone(timeLeft < 5 ? 990 : 760, 0.05, 'square', 0.04);
          if (timeLeft <= 0) { timeLeft = 0; phase = 'over'; phaseT = 0; api.toast(api.t('mahjong.timeUp')); api.sound('over'); api.fx.shake(6); }
          return;
        }
        phaseT += dt;
        if (phase === 'clear' && phaseT > 2.2) { level++; layoutIdx++; if (api.diff < 3 || level % 2) hints++; if (level % 2 === 0) shuffles++; deal(); }
        if (phase === 'over' && phaseT > 1.4) { phase = 'done'; api.gameOver(); }
      },
      draw: function (c) {
        var W = api.W, H = api.H, i;
        if (!bgL || lw !== W || lh !== H) layout();
        c.drawImage(bgL, 0, 0, W, H);
        // кости
        var PAD = 10, sw = TW + EX + PAD * 2, sh = TH + EY + PAD * 2, pulse = 0.55 + 0.45 * Math.sin(clock * 7);
        for (var k = 0; k < order.length; k++) {
          var idx = order[k], t = tiles[idx], p = tilePos(t), x = p.x - PAD, y = p.y - PAD, a = 1;
          if (phase === 'deal') {
            var q = (dealT - t.drop) / 0.35;
            if (q < 0) continue;
            if (q < 1) { var e = 1 - Math.pow(1 - q, 3); y -= (1 - e) * 140; a = q; }
          }
          if (t.shake > 0) x += Math.sin(t.shake * 60) * 3 * (t.shake / 0.35);
          if (a < 1) c.globalAlpha = a;
          if (t.flip > 0 && t.flip < 0.5) {
            var sx = Math.abs(Math.cos(t.flip / 0.5 * Math.PI));
            c.drawImage(faceS[t.f], x + sw * (1 - sx) / 2, y, sw * sx, sh);
          } else {
            var lift = (idx === sel) ? 3 : 0;
            c.drawImage(faceS[t.f], x + lift * 0.3, y - lift, sw, sh);
            if (!t.free && phase !== 'deal') c.drawImage(dimS, x, y, sw, sh);
            if (idx === sel) c.drawImage(selS, x + lift * 0.3, y - lift, sw, sh);
            if (hintPair && (hintPair[0] === idx || hintPair[1] === idx)) { c.globalAlpha = pulse; c.drawImage(hintS, x, y, sw, sh); c.globalAlpha = 1; }
          }
          if (a < 1) c.globalAlpha = 1;
        }
        // улетающие пары
        for (i = 0; i < flying.length; i++) {
          var fl = flying[i], u = fl.t, eo = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
          var fx = fl.x + (fl.tx - fl.x) * eo, fy = fl.y + (fl.ty - fl.y) * eo - Math.sin(u * Math.PI) * 24, sc = 1 + Math.sin(u * Math.PI) * 0.18;
          c.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1;
          c.drawImage(faceS[fl.f], fx - PAD - sw * (sc - 1) / 2, fy - PAD - sh * (sc - 1) / 2, sw * sc, sh * sc);
          c.globalAlpha = 1;
        }
        // верхняя панель
        drawHud(c, W, H);
        // нижние кнопки
        c.drawImage(barL, 0, H - 90, W, 90);
        drawBtn(c, btnH, api.t('mahjong.hintB'), hints, press === 'h');
        drawBtn(c, btnS, api.t('mahjong.shuf'), shuffles, press === 's');
        if (phase === 'over' || phase === 'done') {
          c.fillStyle = 'rgba(0,0,0,' + Math.min(0.5, (phaseT || 0) * 0.6) + ')'; c.fillRect(0, 0, W, H);
        }
      }
    };

    function inBtn(b, d) { return d.x >= b.x && d.x <= b.x + b.w && d.y >= b.y - 4 && d.y <= b.y + b.h + 4; }
    function drawBtn(c, b, label, n, down) {
      c.save();
      if (down) { c.translate(0, 2); }
      if (n <= 0) c.globalAlpha = 0.45;
      c.fillStyle = '#fff'; c.font = '800 15px system-ui, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle';
      var lbl = label; while (c.measureText(lbl).width > b.w - 84 && lbl.length > 3) lbl = lbl.slice(0, -1);
      if (lbl !== label) lbl += '…';
      c.fillText(lbl, b.x + 46, b.y + (b.h - 6) / 2);
      // бейдж
      var bx = b.x + b.w - 22, by = b.y + (b.h - 6) / 2;
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.arc(bx, by, 13, 0, 6.283); c.fill();
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '900 15px system-ui, sans-serif'; c.fillText(String(n), bx, by + 1);
      c.restore();
    }
    function useHint() {
      if (phase !== 'play') return;
      if (hints <= 0) { api.tone(140, 0.1, 'square', 0.04); return; }
      if (!avail.first) { stuck(); return; }
      hints--; hintPair = avail.first; hintT = 3;
      api.sound('bonus');
    }
    function drawHud(c, W, H) {
      var g, y = 10, h = 46;
      g = c.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, 'rgba(10,30,28,.85)'); g.addColorStop(1, 'rgba(4,20,18,.85)');
      c.fillStyle = g; rr(c, 10, y, W - 20, h, 16); c.fill();
      c.strokeStyle = 'rgba(253,224,71,.35)'; c.lineWidth = 1; rr(c, 10.5, y + 0.5, W - 21, h - 1, 16); c.stroke();
      c.textBaseline = 'middle'; c.textAlign = 'left';
      c.fillStyle = '#fde68a'; c.font = '900 14px system-ui, sans-serif';
      c.fillText(api.t('mahjong.lvl', level), 22, y + 15);
      c.fillStyle = 'rgba(255,255,255,.7)'; c.font = '700 11px system-ui, sans-serif';
      c.fillText(api.t('mahjong.L_' + curLayout), 22, y + 32);
      // таймер
      var tx = W * 0.36, tw = W * 0.36, frac = Math.max(0, timeLeft / timeMax), low = timeLeft < 15;
      c.fillStyle = 'rgba(0,0,0,.45)'; rr(c, tx, y + 26, tw, 10, 5); c.fill();
      g = c.createLinearGradient(tx, 0, tx + tw, 0);
      if (low) { g.addColorStop(0, '#ef4444'); g.addColorStop(1, '#f97316'); } else { g.addColorStop(0, '#10b981'); g.addColorStop(1, '#fde047'); }
      c.fillStyle = g; if (frac > 0) { rr(c, tx, y + 26, Math.max(10, tw * frac), 10, 5); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,.3)'; if (frac > 0) { rr(c, tx + 2, y + 27, Math.max(6, tw * frac - 4), 3, 1.5); c.fill(); }
      var tl = Math.ceil(timeLeft), ts = Math.floor(tl / 60) + ':' + ('0' + (tl % 60)).slice(-2);
      c.textAlign = 'center'; c.font = '900 15px system-ui, sans-serif';
      c.fillStyle = low && Math.sin(clock * 10) > 0 ? '#fca5a5' : '#fff'; c.fillText(ts, tx + tw / 2, y + 14);
      // пары
      var left = Math.floor(aliveCount() / 2);
      c.textAlign = 'right'; c.fillStyle = '#fff'; c.font = '900 15px system-ui, sans-serif';
      c.fillText(api.t('mahjong.pairs', left), W - 22, y + 15);
      c.fillStyle = avail && avail.n ? 'rgba(167,243,208,.85)' : '#fca5a5'; c.font = '700 11px system-ui, sans-serif';
      c.fillText(api.t('mahjong.moves', avail ? avail.n : 0), W - 22, y + 32);
      if (combo >= 1 && clock - lastMatch < 4.5) {
        var cf = 1 - (clock - lastMatch) / 4.5;
        c.fillStyle = 'rgba(251,146,60,' + (0.4 + cf * 0.6) + ')'; c.font = '900 13px system-ui, sans-serif'; c.textAlign = 'center';
        c.fillText(api.t('mahjong.combo', combo + 1), W / 2, y + h + 12);
        c.fillStyle = 'rgba(251,146,60,.8)'; c.fillRect(W / 2 - 40, y + h + 22, 80 * cf, 3);
      }
      c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    }
  }
};
