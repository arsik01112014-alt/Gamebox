/* Аркада — общий движок: меню, игровой цикл, ввод, звук, рекорды */
(function () {
  'use strict';
  var GAMES = window.GAMES;
  var ORDER = ['snake', 'flappy', 'mario', 'tetris', 'g2048', 'breakout', 'space', 'dino', 'mines', 'pacman', 'match3', 'pong',
    'chess', 'checkers', 'nardy', 'billiards', 'battleship', 'ttt', 'sudoku', 'darts', 'tug', 'slither', 'tanks',
    'stack', 'jumper', 'memory', 'mole', 'simon',
    'asteroids', 'crossy', 'fruit', 'knife', 'tiles', 'bubbles', 'connect4', 'reversi',
    'puzzle15', 'blocks', 'colorjump', 'airhockey', 'racing', 'archery', 'basket', 'maze', 'solitaire', 'yahtzee',
    'sokoban', 'watersort', 'mahjong', 'gomoku', 'dots', 'bowling', 'minigolf', 'pinball', 'penalty', 'towerdef', 'numbers', 'reflex', 'dodge', 'lights', 'flood', 'hangman', 'nim', 'blackjack', 'guess', 'bulls', 'wordle', 'lines', 'blockblast', 'arrows', 'catcher', 'aim', 'clicker', 'dash', 'bricks', 'durak', 'flow', 'twocars', 'zigzag', 'mill', 'ugolki', 'rps', 'duel', 'tron', 'hex', 'dicepoker', 'mathduel', 'wordduel'].filter(function (id) { return GAMES[id]; });
  var $ = function (s) { return document.querySelector(s); };

  /* ---------- хранилище ---------- */
  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  };

  /* ---------- звук (синтез через WebAudio) ---------- */
  var Sound = {
    ctx: null,
    on: store.get('sound', true),
    init: function () {
      if (!this.ctx) {
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { }
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },
    tone: function (freq, dur, type, vol, slide, delay) {
      if (!this.on || !this.ctx) return;
      var t = this.ctx.currentTime + (delay || 0);
      var o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
      g.gain.setValueAtTime(vol || 0.06, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(t); o.stop(t + dur + 0.03);
    },
    seq: function (notes, step, type, vol, dur) {
      for (var i = 0; i < notes.length; i++) this.tone(notes[i], dur || step * 1.2, type, vol, 0, i * step);
    },
    play: function (n) {
      switch (n) {
        case 'eat': this.tone(520, 0.08, 'square', 0.05, 320); break;
        case 'bonus': this.seq([660, 880, 1175], 0.07, 'square', 0.05); break;
        case 'flap': this.tone(360, 0.12, 'triangle', 0.12, 300); break;
        case 'point': this.tone(880, 0.07, 'square', 0.04); this.tone(1320, 0.14, 'square', 0.04, 0, 0.07); break;
        case 'hit': this.tone(220, 0.3, 'sawtooth', 0.09, -160); break;
        case 'jump': this.tone(280, 0.2, 'square', 0.05, 520); break;
        case 'coin': this.tone(988, 0.07, 'square', 0.045); this.tone(1319, 0.28, 'square', 0.045, 0, 0.07); break;
        case 'stomp': this.tone(260, 0.12, 'square', 0.07, -140); break;
        case 'break': this.tone(160, 0.16, 'sawtooth', 0.08, -90); break;
        case 'move': this.tone(250, 0.03, 'square', 0.025); break;
        case 'rotate': this.tone(460, 0.05, 'triangle', 0.07); break;
        case 'drop': this.tone(150, 0.12, 'square', 0.07, -70); break;
        case 'line': this.seq([523, 659, 784, 1047], 0.06, 'square', 0.05); break;
        case 'tetris': this.seq([523, 659, 784, 1047, 1319, 1568], 0.06, 'square', 0.05); break;
        case 'win': this.seq([523, 659, 784, 1047, 784, 1047, 1319], 0.11, 'square', 0.05); break;
        case 'life': this.seq([659, 784, 1319, 1047, 1175, 1568], 0.08, 'square', 0.05); break;
        case 'over': this.seq([392, 330, 262, 196], 0.17, 'triangle', 0.1, 0.25); break;
        case 'click': this.tone(700, 0.04, 'triangle', 0.05); break;
      }
    }
  };

  /* ---------- фоновая музыка: 8-битный секвенсор, 5 мелодий ---------- */
  var TRACKS = [
    { tempo: 0.13, lw: 'square', bw: 'triangle', lv: 0.018, // «Аркада»
      LEAD: [72, 0, 76, 0, 79, 0, 76, 0, 74, 0, 77, 0, 81, 0, 77, 0, 72, 0, 76, 0, 79, 0, 84, 0, 83, 0, 79, 0, 74, 0, 0, 0,
        69, 0, 72, 0, 76, 0, 72, 0, 71, 0, 74, 0, 79, 0, 74, 0, 72, 76, 79, 84, 83, 79, 76, 74, 72, 0, 0, 0, 67, 0, 0, 0],
      BASS: [48, 48, 53, 53, 48, 48, 55, 55, 57, 57, 55, 55, 48, 48, 55, 48] },
    { tempo: 0.15, lw: 'triangle', bw: 'sine', lv: 0.03, // «Космос»
      LEAD: [69, 72, 76, 72, 69, 72, 76, 81, 67, 71, 74, 71, 67, 71, 74, 79, 65, 69, 72, 69, 65, 69, 72, 77, 64, 68, 71, 68, 64, 68, 71, 76,
        69, 72, 76, 79, 81, 79, 76, 72, 67, 71, 74, 77, 79, 77, 74, 71, 65, 69, 72, 76, 77, 76, 72, 69, 64, 0, 68, 0, 71, 0, 76, 0],
      BASS: [45, 45, 43, 43, 41, 41, 40, 40, 45, 45, 43, 43, 41, 41, 40, 40] },
    { tempo: 0.18, lw: 'sine', bw: 'triangle', lv: 0.04, // «Загадка»
      LEAD: [72, 0, 74, 0, 76, 0, 79, 0, 81, 0, 79, 0, 76, 0, 74, 0, 72, 0, 76, 0, 74, 0, 72, 0, 69, 0, 0, 0, 67, 0, 0, 0,
        72, 0, 74, 0, 76, 0, 79, 0, 84, 0, 81, 0, 79, 0, 76, 0, 74, 0, 76, 0, 79, 0, 76, 0, 72, 0, 0, 0, 0, 0, 0, 0],
      BASS: [48, 48, 45, 45, 53, 53, 43, 43, 48, 48, 45, 45, 53, 55, 48, 48] },
    { tempo: 0.11, lw: 'square', bw: 'square', lv: 0.016, bv: 0.035, // «Бодро»
      LEAD: [72, 0, 72, 74, 76, 0, 72, 0, 79, 0, 77, 76, 74, 0, 0, 0, 74, 0, 74, 76, 77, 0, 74, 0, 81, 0, 79, 77, 76, 0, 0, 0,
        72, 76, 79, 76, 72, 76, 79, 84, 83, 79, 76, 79, 83, 0, 0, 0, 81, 77, 74, 77, 81, 77, 74, 71, 72, 0, 0, 0, 72, 0, 0, 0],
      BASS: [48, 48, 43, 43, 50, 50, 45, 45, 48, 48, 52, 52, 53, 53, 48, 48] },
    { tempo: 0.2, lw: 'triangle', bw: 'sine', lv: 0.035, hat: false, // «Спокойно»
      LEAD: [76, 0, 0, 74, 0, 0, 72, 0, 74, 0, 0, 0, 0, 0, 0, 0, 72, 0, 0, 71, 0, 0, 69, 0, 71, 0, 0, 0, 0, 0, 0, 0,
        69, 0, 72, 0, 76, 0, 79, 0, 77, 0, 76, 0, 74, 0, 72, 0, 71, 0, 72, 0, 74, 0, 67, 0, 72, 0, 0, 0, 0, 0, 0, 0],
      BASS: [53, 53, 52, 52, 50, 50, 55, 55, 53, 53, 52, 52, 50, 55, 48, 48] }
  ];
  var Music = {
    on: store.get('music', false), timer: null, step: 0, next: 0, pick: store.get('track', -1), cur: TRACKS[0],
    hz: function (m) { return 440 * Math.pow(2, (m - 69) / 12); },
    note: function (m, at, dur, type, vol) {
      var c = Sound.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(this.hz(m), at);
      g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(g); g.connect(c.destination); o.start(at); o.stop(at + dur + 0.02);
    },
    // авто: у каждой игры своя мелодия
    choose: function (id) {
      var k = this.pick;
      if (!(k >= 0 && k < TRACKS.length)) {
        k = 0;
        if (id) { var h = 0; for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; k = h % TRACKS.length; }
      }
      if (this.cur !== TRACKS[k]) { this.cur = TRACKS[k]; this.step = 0; }
    },
    tick: function () {
      var c = Sound.ctx, T = this.cur;
      if (!c) return;
      if (this.next < c.currentTime - 0.1) this.next = c.currentTime + 0.02;
      while (this.next < c.currentTime + 0.25) {
        var i = this.step % T.LEAD.length, m = T.LEAD[i];
        if (m) this.note(m, this.next, T.tempo * 1.6, T.lw, T.lv);
        if (i % 4 === 0) this.note(T.BASS[i / 4], this.next, T.tempo * 3.6, T.bw, T.bv || 0.06);
        if (i % 2 === 1 && T.hat !== false) this.note(96, this.next, 0.02, 'square', 0.004);
        this.next += T.tempo; this.step++;
      }
    },
    start: function () {
      if (!this.on || this.timer) return;
      Sound.init();
      if (!Sound.ctx) return;
      this.next = Sound.ctx.currentTime + 0.05;
      var self = this;
      this.timer = setInterval(function () { self.tick(); }, 60);
    },
    stop: function () { if (this.timer) { clearInterval(this.timer); this.timer = null; } },
    preview: function () { var self = this; this.stop(); this.choose(App.id); this.start(); clearTimeout(this.pv); this.pv = setTimeout(function () { if (App.state !== 'playing') self.stop(); }, 2500); }
  };

  var vibroOn = store.get('vibro', true);

  /* ---------- графика: лимит FPS, качество, счётчик ---------- */
  var FPS_OPTS = [30, 60, 90, 120, 0]; // 0 — без ограничения (по частоте экрана)
  var QUAL_DPR = [1, 2, 3];
  var Gfx = {
    fps: store.get('fps', 60), quality: store.get('quality', 2), showFps: store.get('showFps', false),
    frames: 0, acc: 0, value: 0, lastDraw: 0
  };
  if (FPS_OPTS.indexOf(Gfx.fps) < 0) Gfx.fps = 60;
  if (!(Gfx.quality >= 0 && Gfx.quality <= 2)) Gfx.quality = 2;
  // пропуск кадра, если с прошлой отрисовки прошло меньше интервала лимита
  function frameDue(now) {
    if (!Gfx.fps) { Gfx.lastDraw = now; return true; }
    var iv = 1000 / Gfx.fps;
    if (Gfx.lastDraw && now - Gfx.lastDraw < iv - 2) return false;
    Gfx.lastDraw = Gfx.lastDraw && now - Gfx.lastDraw < iv * 2 ? Gfx.lastDraw + iv : now;
    return true;
  }
  function countFps(dt) {
    Gfx.frames++; Gfx.acc += dt;
    if (Gfx.acc >= 0.5) {
      Gfx.value = Math.round(Gfx.frames / Gfx.acc); Gfx.frames = 0; Gfx.acc = 0;
      var el = document.getElementById('fpsMeter');
      if (el) el.textContent = Gfx.value + ' FPS';
    }
  }
  function applyFpsMeter() {
    var el = document.getElementById('fpsMeter');
    if (el) el.style.display = Gfx.showFps ? 'block' : 'none';
  }
  function vibrate(ms) {
    if (!vibroOn) return;
    try {
      if (window.Android && window.Android.vibrate) window.Android.vibrate(ms);
      else if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) { }
  }

  /* ---------- эффекты поверх игры: частицы, всплывающий текст, тряска, вспышка, конфетти ---------- */
  var fxOn = store.get('fx', true);
  var FX = { parts: [], texts: [], shake: 0, power: 0, flash: 0, flashC: '#fff', dirty: false, cv: null, c: null };
  var FX_COLORS = ['#f43f5e', '#f59e0b', '#facc15', '#4ade80', '#22d3ee', '#818cf8', '#e879f9', '#ffffff'];
  function fxBurst(x, y, color, n, speed, size) {
    if (!fxOn) return;
    n = Math.min(n || 12, 80);
    for (var i = 0; i < n && FX.parts.length < 400; i++) {
      var a = Math.random() * 6.283, v = (speed || 160) * (0.35 + Math.random() * 0.8);
      FX.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (speed || 160) * 0.25, g: 380, life: 0.5 + Math.random() * 0.5, max: 1,
        r: (size || 3) * (0.6 + Math.random() * 0.8), c: color || FX_COLORS[i % FX_COLORS.length], sq: false });
    }
  }
  function fxConfetti(n) {
    if (!fxOn) return;
    var W = App.W || innerWidth;
    for (var i = 0; i < (n || 90) && FX.parts.length < 400; i++) {
      FX.parts.push({ x: Math.random() * W, y: -10 - Math.random() * 120, vx: (Math.random() - 0.5) * 120, vy: 80 + Math.random() * 160, g: 120,
        life: 2 + Math.random() * 1.2, max: 3.2, r: 3 + Math.random() * 3, c: FX_COLORS[Math.floor(Math.random() * FX_COLORS.length)], sq: true, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12 });
    }
  }
  function fxText(x, y, str, color, size) {
    if (!fxOn || FX.texts.length > 30) return;
    FX.texts.push({ x: x, y: y, s: String(str), c: color || '#fde047', size: size || 20, life: 0.9, max: 0.9 });
  }
  function fxShake(p) { if (!fxOn) return; FX.shake = Math.max(FX.shake, 0.32); FX.power = Math.max(FX.power, p || 6); }
  function fxFlash(color, a) { if (!fxOn) return; FX.flash = a || 0.35; FX.flashC = color || '#fff'; }
  function fxSize() {
    if (!FX.cv) return;
    FX.cv.width = Math.floor(App.W * App.dpr); FX.cv.height = Math.floor(App.H * App.dpr);
    FX.dirty = true;
  }
  function fxUpdate(dt) {
    var c = FX.c; if (!c) return;
    for (var i = FX.parts.length - 1; i >= 0; i--) {
      var p = FX.parts[i];
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.985; p.life -= dt;
      if (p.rot !== undefined) p.rot += p.vr * dt;
      if (p.life <= 0 || p.y > App.H + 40) FX.parts.splice(i, 1);
    }
    for (var j = FX.texts.length - 1; j >= 0; j--) {
      var tx = FX.texts[j]; tx.y -= 46 * dt; tx.life -= dt;
      if (tx.life <= 0) FX.texts.splice(j, 1);
    }
    if (FX.flash > 0) FX.flash = Math.max(0, FX.flash - dt * 1.6);
    if (FX.shake > 0) {
      FX.shake -= dt;
      var k = Math.max(0, FX.shake / 0.32) * FX.power;
      cv.style.transform = FX.shake > 0 ? 'translate(' + ((Math.random() - 0.5) * 2 * k).toFixed(1) + 'px,' + ((Math.random() - 0.5) * 2 * k).toFixed(1) + 'px)' : '';
      if (FX.shake <= 0) { FX.power = 0; cv.style.transform = ''; }
    }
    var busy = FX.parts.length || FX.texts.length || FX.flash > 0;
    if (!busy && !FX.dirty) return;
    c.setTransform(App.dpr, 0, 0, App.dpr, 0, 0);
    c.clearRect(0, 0, App.W, App.H);
    FX.dirty = !!busy;
    if (FX.flash > 0) { c.globalAlpha = FX.flash; c.fillStyle = FX.flashC; c.fillRect(0, 0, App.W, App.H); }
    for (var q = 0; q < FX.parts.length; q++) {
      var pp = FX.parts[q];
      c.globalAlpha = Math.min(1, pp.life / pp.max * 2);
      c.fillStyle = pp.c;
      if (pp.sq) { c.save(); c.translate(pp.x, pp.y); c.rotate(pp.rot); c.fillRect(-pp.r, -pp.r * 0.5, pp.r * 2, pp.r); c.restore(); }
      else { c.beginPath(); c.arc(pp.x, pp.y, pp.r, 0, 6.283); c.fill(); }
    }
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (var w = 0; w < FX.texts.length; w++) {
      var tt = FX.texts[w], kk = tt.life / tt.max, sc = kk > 0.8 ? 1 + (kk - 0.8) * 2 : 1;
      c.globalAlpha = Math.min(1, kk * 2.5);
      c.font = '900 ' + Math.round(tt.size * sc) + 'px system-ui, sans-serif';
      c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.55)'; c.strokeText(tt.s, tt.x, tt.y);
      c.fillStyle = tt.c; c.fillText(tt.s, tt.x, tt.y);
    }
    c.globalAlpha = 1; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  }
  function fxClear() { FX.parts = []; FX.texts = []; FX.flash = 0; FX.shake = 0; FX.dirty = true; cv.style.transform = ''; }

  /* ---------- прогресс игрока: опыт, уровни, медали, задание дня, статистика, избранное ---------- */
  // пороги медалей [бронза, серебро, золото] — по очкам за одну партию
  var MEDALS = {
    snake: [15, 40, 80], flappy: [5, 20, 50], mario: [2000, 8000, 20000], tetris: [2000, 10000, 30000], g2048: [2000, 8000, 20000],
    breakout: [1000, 5000, 15000], space: [2000, 10000, 30000], dino: [300, 1000, 2500], mines: [300, 1500, 4000], pacman: [1500, 5000, 12000],
    match3: [1500, 5000, 12000], pong: [300, 800, 1500], chess: [300, 1500, 3000], checkers: [300, 1500, 3000], nardy: [1000, 2500, 5000],
    billiards: [300, 1200, 3000], battleship: [1000, 2200, 3800], ttt: [150, 400, 800], sudoku: [600, 1800, 3500], darts: [300, 1200, 2500],
    tug: [300, 900, 1800], slither: [100, 400, 1000], tanks: [2000, 6000, 15000], stack: [15, 40, 80], jumper: [1000, 5000, 15000],
    memory: [1000, 2500, 4500], mole: [300, 900, 1800], simon: [100, 300, 700],
    asteroids: [2000, 8000, 20000], crossy: [20, 60, 150], fruit: [100, 400, 1000], knife: [20, 60, 120], tiles: [50, 150, 350],
    bubbles: [1000, 4000, 10000], connect4: [300, 1500, 3000], reversi: [300, 1500, 3000],
    puzzle15: [800, 2000, 3500], blocks: [300, 1000, 2500], colorjump: [5, 15, 35], airhockey: [600, 1500, 3000], racing: [150, 500, 1200],
    archery: [400, 700, 900], basket: [20, 50, 90], maze: [500, 1500, 3500], solitaire: [300, 1500, 3000], yahtzee: [150, 220, 280]
  };
  var MEDAL_IC = ['', '🥉', '🥈', '🥇'];
  var REALTIME = ['pinball', 'penalty', 'minigolf', 'bowling', 'towerdef', 'snake', 'flappy', 'mario', 'tetris', 'breakout', 'space', 'dino', 'pacman', 'pong', 'tug', 'slither', 'tanks', 'stack', 'jumper', 'mole',
    'asteroids', 'crossy', 'fruit', 'knife', 'tiles', 'colorjump', 'airhockey', 'racing', 'basket'];
  function medalsOf(id) { return (GAMES[id] && GAMES[id].medals) || MEDALS[id] || [100, 500, 2000]; }
  function medal(id) { return store.get('medal_' + id, 0); }
  function medalFor(id, sc) { var m = medalsOf(id), k = 0; for (var i = 0; i < 3; i++) if (sc >= m[i]) k = i + 1; return k; }
  function lvlNeed(n) { return 100 + (n - 1) * 60; } // опыт с уровня n до n+1
  function lvlInfo(xp) {
    var n = 1, rest = xp;
    while (rest >= lvlNeed(n)) { rest -= lvlNeed(n); n++; }
    return { n: n, cur: rest, need: lvlNeed(n), rank: n < 5 ? 0 : n < 10 ? 1 : n < 20 ? 2 : n < 35 ? 3 : 4 };
  }
  function today(off) {
    var d = new Date(Date.now() + (off || 0) * 864e5);
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function dailyInfo() {
    var key = today(), h = 7;
    for (var i = 0; i < key.length; i++) h = (h * 131 + key.charCodeAt(i)) >>> 0;
    var pool = ORDER.filter(function (id) { return !GAMES[id].noDaily && !LOCKED[id]; });
    var id = pool[h % pool.length], st = store.get('daily', {});
    return { id: id, target: medalsOf(id)[0], done: st.date === key && st.done, key: key, xp: 120 };
  }
  // у каждой вставленной копии SVG-иконки свои id, иначе url(#id) ссылается на чужую (иногда скрытую) копию
  var icoN = 0;
  function ico(svg) {
    if (!svg || svg.indexOf('id=') < 0) return svg || '';
    var sfx = '_i' + (++icoN);
    return svg.replace(/id="([^"]+)"/g, 'id="$1' + sfx + '"').replace(/url\(#([^)]+)\)/g, 'url(#$1' + sfx + ')').replace(/href="#([^"]+)"/g, 'href="#$1' + sfx + '"');
  }
  function gstat(id) { return store.get('st_' + id, { p: 0, t: 0 }); }
  function favs() { return store.get('favs', []).filter(function (id) { return GAMES[id]; }); }
  function isFav(id) { return favs().indexOf(id) >= 0; }
  function fmtTime(sec) {
    var m = Math.round(sec / 60);
    return m < 60 ? t('stat.min', m) : t('stat.hr', Math.floor(m / 60), m % 60);
  }

  /* ---------- v2.1: монеты, магазин тем и аватаров, достижения, задания дня ---------- */
  // темы оформления: бумага / карточка / углубление / чернила / приглушённый / акцент / текст на акценте / тень; neon — тёмная
  var THEMES = [
    { id: 'night', price: 0, bg: '#0b0a1f', blobs: ['124,92,255', '255,94,168', '56,189,248'], a1: '#7c5cff', a2: '#ff5ea8', v: ['#efe6d4', '#fbf6ea', '#e3d6be', '#1d1b20', '#6d6571', '#ff5b2e', '#ffffff', '#1d1b20'] },
    { id: 'ocean', price: 150, bg: '#03131f', blobs: ['14,165,233', '45,212,191', '59,130,246'], a1: '#0ea5e9', a2: '#2dd4bf', v: ['#dde8ea', '#f6fbfb', '#c6d7da', '#13232b', '#5a6d75', '#1f6feb', '#ffffff', '#13232b'] },
    { id: 'sunset', price: 250, bg: '#1c0910', blobs: ['249,115,22', '244,63,94', '250,204,21'], a1: '#f97316', a2: '#f43f5e', v: ['#f7dccb', '#fff4ec', '#edc4ab', '#2a1418', '#7d5a58', '#e8452c', '#ffffff', '#2a1418'] },
    { id: 'forest', price: 250, bg: '#04130a', blobs: ['34,197,94', '132,204,22', '20,184,166'], a1: '#22c55e', a2: '#14b8a6', v: ['#dfe5cf', '#f7f9ef', '#c8d2b2', '#172117', '#5d6b55', '#2f8f4e', '#ffffff', '#172117'] },
    { id: 'neon', price: 400, dark: true, bg: '#06010f', blobs: ['217,70,239', '34,211,238', '163,230,53'], a1: '#d946ef', a2: '#22d3ee', v: ['#17161c', '#24222b', '#312e39', '#f1e8d8', '#a39aa8', '#c6ff3d', '#17161c', '#000000'] },
    { id: 'gold', price: 800, bg: '#120e04', blobs: ['250,204,21', '245,158,11', '234,179,8'], a1: '#f59e0b', a2: '#facc15', v: ['#f1df9c', '#fff7d6', '#e3cc79', '#241c06', '#77683a', '#1d1b20', '#f1df9c', '#241c06'] },
    // новые темы: название задано прямо здесь (name), без строк перевода
    { id: 'ice', name: 'Лёд', price: 300, bg: '#04121c', blobs: ['186,230,253', '125,211,252', '224,242,254'], a1: '#38bdf8', a2: '#a5f3fc', v: ['#e2eef3', '#f8fcfd', '#cfe2ea', '#10202a', '#577080', '#0284c7', '#ffffff', '#10202a'] },
    { id: 'candy', name: 'Конфета', price: 300, bg: '#1a0613', blobs: ['244,114,182', '196,181,253', '253,186,116'], a1: '#f472b6', a2: '#c4b5fd', v: ['#f6dde9', '#fff5fa', '#ecc6d8', '#2a1220', '#7a5a6c', '#db2777', '#ffffff', '#2a1220'] },
    { id: 'mint', name: 'Мята', price: 350, bg: '#031512', blobs: ['52,211,153', '110,231,183', '45,212,191'], a1: '#10b981', a2: '#5eead4', v: ['#d9efe6', '#f4fcf8', '#c1e3d5', '#0f231c', '#557266', '#059669', '#ffffff', '#0f231c'] },
    { id: 'lava', name: 'Лава', price: 500, dark: true, bg: '#120302', blobs: ['239,68,68', '249,115,22', '234,88,12'], a1: '#ef4444', a2: '#f97316', v: ['#1a0d0b', '#2a1512', '#3a1d18', '#f7dfd6', '#b08a80', '#ff6a3d', '#1a0d0b', '#000000'] },
    { id: 'space', name: 'Космос', price: 650, dark: true, bg: '#02010a', blobs: ['99,102,241', '168,85,247', '14,165,233'], a1: '#6366f1', a2: '#a855f7', v: ['#0f0f1a', '#191a2b', '#24253a', '#e6e6f5', '#9a9ab8', '#818cf8', '#0f0f1a', '#000000'] },
    { id: 'sakura', name: 'Сакура', price: 700, bg: '#1a0a12', blobs: ['249,168,212', '253,242,248', '225,29,72'], a1: '#f472b6', a2: '#e11d48', v: ['#f9e1ec', '#fff7fb', '#f1c9dc', '#2b1220', '#7f5a6c', '#e11d48', '#ffffff', '#2b1220'] },
    { id: 'royal', name: 'Королевская', price: 1200, bg: '#0d0618', blobs: ['147,51,234', '250,204,21', '79,70,229'], a1: '#9333ea', a2: '#facc15', v: ['#e7dcf3', '#faf6ff', '#d6c6ea', '#1c1029', '#6c5a80', '#7e22ce', '#ffffff', '#1c1029'] },
    { id: 'abyss', name: 'Бездна', price: 400, dark: true, bg: '#020f1f', blobs: ['14,165,233', '6,182,212', '30,64,175'], a1: '#0ea5e9', a2: '#06b6d4', v: ['#0b1d2e', '#112a40', '#183754', '#dff3ff', '#8fb3c9', '#22d3ee', '#0b1d2e', '#000000'] },
    { id: 'jungle', name: 'Джунгли', price: 450, dark: true, bg: '#03110a', blobs: ['34,197,94', '132,204,22', '21,128,61'], a1: '#22c55e', a2: '#84cc16', v: ['#0d1f14', '#14301e', '#1b4028', '#e3f7e8', '#93b89c', '#4ade80', '#0d1f14', '#000000'] },
    { id: 'cyber', name: 'Киберпанк', price: 900, dark: true, bg: '#05000f', blobs: ['236,72,153', '34,211,238', '163,230,53'], a1: '#ec4899', a2: '#22d3ee', v: ['#120a1f', '#1c1030', '#281745', '#fdf2ff', '#b39ac9', '#f0abfc', '#120a1f', '#000000'] },
    { id: 'amber', name: 'Янтарь', price: 1800, dark: true, bg: '#0f0a00', blobs: ['250,204,21', '245,158,11', '161,98,7'], a1: '#facc15', a2: '#f59e0b', v: ['#1c1505', '#2a200a', '#3a2c10', '#fff8e1', '#c9b07a', '#facc15', '#1c1505', '#000000'] },
  ];
  var AVATARS = window.GBAV.list, avH = window.GBAV.html;
  // перенос старых эмодзи-аватарок (выбранной и купленных) на новые картинки
  (function () {
    var O = window.GBAV.old, a = store.get('avatar', '');
    if (O[a]) store.set('avatar', 'i:' + O[a]);
    var ow = store.get('owned', []), ch = false;
    ow = ow.map(function (k) { var m = k.indexOf('a:') === 0 && O[k.slice(2)]; if (m) { ch = true; return 'a:i:' + m; } return k; });
    if (ch) store.set('owned', ow);
  })();
  function coins() { return store.get('coins', 0); }
  // бустеры: [минут, цена]; конец действия хранится в store 'boostEnd'
  var BOOSTS = [[30, 250], [120, 800]];
  function boostLeft() { return Math.max(0, store.get('boostEnd', 0) - Date.now()); }
  function addCoins(n) { store.set('coins', Math.max(0, coins() + n)); }
  // игры за монеты: цена открытия, открытые хранятся в store 'unlocked'
  var LOCKED = { mario: 600, billiards: 500, towerdef: 500, pinball: 400, minigolf: 400, bowling: 300, mahjong: 300, lines: 250, wordle: 250 };
  var unlockAsk = null;
  if (!store.get('since', '')) store.set('since', new Date().toLocaleDateString('ru-RU'));
  function isLocked(id) { return !!LOCKED[id] && store.get('unlocked', []).indexOf(id) < 0; }
  // подтверждение повторным нажатием: confirm() в WebView приложения может не показываться
  function askUnlock(id) {
    var price = LOCKED[id];
    if (coins() < price) { api.toast('🔒 Нужно ' + price + ' монет, у тебя ' + coins()); return; }
    if (!unlockAsk || unlockAsk.id !== id || Date.now() - unlockAsk.t > 4000) { unlockAsk = { id: id, t: Date.now() }; api.toast('🔒 Нажми ещё раз, чтобы открыть за ' + price + ' монет'); return; }
    unlockAsk = null; addCoins(-price); store.set('unlocked', store.get('unlocked', []).concat(id));
    Sound.play('bonus'); api.toast('🔓 «' + gt(id, 'title') + '» открыта!'); renderMenu();
  }
  function favGame() {
    var id = ORDER.slice().sort(function (a, b) { return gstat(b).p - gstat(a).p; })[0];
    return id && gstat(id).p ? gt(id, 'title') : '—';
  }
  function owned(k) { return store.get('owned', []).indexOf(k) >= 0; }
  function themeOf() { var id = store.get('theme', 'night'); return THEMES.filter(function (x) { return x.id === id; })[0] || THEMES[0]; }
  function avatar() { return store.get('avatar', 'i:kid'); }
  // стили интерфейса: glass — «Стекло» (как до 2.4), paper — «Бумага» (2.4), остальные — надстройки над «Бумагой»
  var SKINS = ['glass', 'minimal', 'liquid', 'liquiddark'];
  var LQ = ['css/style.css', 'css/skin-minimal.css', 'css/skin-liquid.css']; // «Жидкое стекло» — надстройка над «Минимал»
  var SKIN_CSS = { glass: ['css/glass.css'], minimal: ['css/style.css', 'css/skin-minimal.css'], liquid: LQ, liquiddark: LQ }; // style.css — общая база для «Минимал»
  function skinOf() { var k = store.get('skin', 'glass'); return SKIN_CSS[k] ? k : 'glass'; }
  function applySkin() {
    var k = skinOf(), f = SKIN_CSS[k], b = document.getElementById('baseCss'), o = document.getElementById('skinCss');
    if (b && b.getAttribute('href') !== f[0]) b.setAttribute('href', f[0]);
    if (o) { if (f[1]) { if (o.getAttribute('href') !== f[1]) o.setAttribute('href', f[1]); o.disabled = false; } else o.disabled = true; }
    var o2 = document.getElementById('skin2Css');
    if (o2) { if (f[2]) { if (o2.getAttribute('href') !== f[2]) o2.setAttribute('href', f[2]); o2.disabled = false; } else o2.disabled = true; }
    document.documentElement.setAttribute('data-skin', k);
    applyTheme();
    if (typeof bgRaf !== 'undefined' && App.state === 'menu') startBg();
  }
  function applyTheme() {
    var T = themeOf(), el = document.getElementById('themeCss'), v = T.v;
    if (!el) { el = document.createElement('style'); el.id = 'themeCss'; document.head.appendChild(el); }
    if (skinOf() === 'glass') {
      el.textContent = 'html,body,#game{background:' + T.bg + '}' +
        '.tab.on,.sg.on,.sw.on,.sheet-card .btn,.prof .lv{background:linear-gradient(135deg,' + T.a1 + ',' + T.a2 + ')}' +
        '.lang.on{border-color:' + T.a1 + '}.top h1{text-shadow:0 2px 0 ' + T.a2 + ',0 4px 14px ' + T.a1 + '}';
      if (typeof blobs !== 'undefined' && blobs.length) blobs.forEach(function (bb, i) { bb.c = 'rgba(' + T.blobs[i] + ','; });
      return;
    }
    if (skinOf() !== 'paper') { el.textContent = ''; return; } // у остальных стилей своя палитра
    el.textContent = ':root{--paper:' + v[0] + ';--card:' + v[1] + ';--sunk:' + v[2] + ';--ink:' + v[3] + ';--mute:' + v[4] + ';--acc:' + v[5] + ';--acc-ink:' + v[6] + ';--sh:' + v[7] +
      (T.dark ? ';--hl:#3b3520;--okbg:#1f3a2c' : '') + '}' + (T.dark ? '#menu{background-image:radial-gradient(rgba(255,255,255,.06) 1px,transparent 1.2px)}' : '');
    var mc = document.querySelector('meta[name=theme-color]'); if (mc) mc.setAttribute('content', v[0]);
  }
  // достижения: проверяются по сводной статистике
  function sumStats() {
    var S = { plays: store.get('plays', 0), lvl: lvlInfo(store.get('xp', 0)).n, gold: 0, medals: 0, distinct: 0, time: 0, flags: store.get('flags', {}) };
    ORDER.forEach(function (id) { var m = medal(id); if (m >= 3) S.gold++; S.medals += m; var st = gstat(id); if (st.p) S.distinct++; S.time += st.t; });
    S.streak = (store.get('streak', {}).best) || 0; S.recs = store.get('recs', 0); S.favs = favs().length; S.coins = coins(); S.daily = store.get('dailyN', 0);
    return S;
  }
  var ACH = [
    ['first', '🎮', 20, function (S) { return S.plays >= 1; }], ['p10', '🕹️', 40, function (S) { return S.plays >= 10; }],
    ['p50', '🏃', 100, function (S) { return S.plays >= 50; }], ['p200', '🦾', 300, function (S) { return S.plays >= 200; }],
    ['l5', '⭐', 50, function (S) { return S.lvl >= 5; }], ['l10', '🌟', 120, function (S) { return S.lvl >= 10; }], ['l20', '💫', 300, function (S) { return S.lvl >= 20; }],
    ['g1', '🥇', 40, function (S) { return S.gold >= 1; }], ['g10', '🏅', 200, function (S) { return S.gold >= 10; }], ['g30', '👑', 600, function (S) { return S.gold >= 30; }],
    ['m30', '🎖️', 150, function (S) { return S.medals >= 30; }], ['half', '🧭', 100, function (S) { return S.distinct >= Math.floor(ORDER.length / 2); }],
    ['all', '🗺️', 300, function (S) { return S.distinct >= ORDER.length; }], ['d1', '📅', 30, function (S) { return S.daily >= 1; }],
    ['d7', '🔥', 250, function (S) { return S.streak >= 7; }], ['rec10', '📈', 120, function (S) { return S.recs >= 10; }],
    ['h1', '⏳', 150, function (S) { return S.time >= 3600; }], ['fav', '❤', 20, function (S) { return S.favs >= 3; }],
    ['insane', '💀', 60, function (S) { return S.flags.insane; }], ['owl', '🦉', 40, function (S) { return S.flags.owl; }],
    ['brain', '🧠', 150, function (S) { return S.flags.brain; }], ['tasks', '✅', 100, function (S) { return S.flags.tasks; }],
    ['shop', '🛍️', 30, function (S) { return S.flags.bought; }], ['rich', '💰', 0, function (S) { return S.coins >= 1000; }]
  ];
  // описание достижения и прогресс: [текст, ключ статистики, нужно]
  var ACH_INFO = {
    first: ['Сыграй свою первую партию в любой игре', 'plays', 1], p10: ['Сыграй 10 партий', 'plays', 10], p50: ['Сыграй 50 партий', 'plays', 50], p200: ['Сыграй 200 партий', 'plays', 200],
    l5: ['Дойди до 5 уровня — опыт даётся за каждую партию', 'lvl', 5], l10: ['Дойди до 10 уровня', 'lvl', 10], l20: ['Дойди до 20 уровня', 'lvl', 20],
    g1: ['Получи золотую медаль в любой игре', 'gold', 1], g10: ['Получи золото в 10 разных играх', 'gold', 10], g30: ['Получи золото в 30 разных играх', 'gold', 30],
    m30: ['Собери 30 медалей (бронза — 1, серебро — 2, золото — 3)', 'medals', 30],
    half: ['Сыграй в половину всех игр', 'distinct', function () { return Math.floor(ORDER.length / 2); }], all: ['Сыграй в каждую игру хотя бы раз', 'distinct', function () { return ORDER.length; }],
    d1: ['Выполни задание дня', 'daily', 1], d7: ['Выполняй задание дня 7 дней подряд', 'streak', 7], rec10: ['Побей свой рекорд 10 раз', 'recs', 10],
    h1: ['Проведи в играх 1 час', 'time', 3600], fav: ['Добавь 3 игры в избранное (сердечко на карточке)', 'favs', 3],
    insane: ['Сыграй на сложности «Безумно»', 'flags', 'insane'], owl: ['Сыграй ночью, с 0:00 до 5:00', 'flags', 'owl'],
    brain: ['Набери 1000 очков в шахматах, шашках, реверси, 4 в ряд или нардах на сложности «Сложно» и выше', 'flags', 'brain'],
    tasks: ['Выполни все три задания за один день', 'flags', 'tasks'], shop: ['Купи что-нибудь в магазине', 'flags', 'bought'], rich: ['Накопи 1000 монет', 'coins', 1000]
  };
  function openAch(k) {
    var a = ACH.filter(function (x) { return x[0] === k; })[0], I = ACH_INFO[k]; if (!a || !I) return;
    var on = store.get('ach', []).indexOf(k) >= 0, S = sumStats(), prog = '';
    if (I[1] === 'flags') prog = on || S.flags[I[2]] ? 'Выполнено' : 'Ещё не выполнено';
    else {
      var need = typeof I[2] === 'function' ? I[2]() : I[2], cur = Math.min(need, S[I[1]] || 0);
      if (I[1] === 'time') prog = Math.floor(cur / 60) + ' / ' + need / 60 + ' мин';
      else prog = cur + ' / ' + need;
      prog += '<span class="tbar" style="display:block;margin-top:6px"><i style="width:' + Math.round(cur / need * 100) + '%"></i></span>';
    }
    var el = document.getElementById('achModal') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'achModal' }));
    el.innerHTML = '<div class="acct-card upd-card ach-card"><button class="upd-x" data-achx="1">✕</button><div class="ach-big' + (on ? '' : ' off') + '">' + a[1] + '</div>' +
      '<h3>' + t('ach.' + k) + '</h3><p>' + I[0] + '</p><p class="ach-st">' + (on ? '✅ Получено' : '🔒 Не получено') + (a[2] ? ' · награда ' + a[2] + ' <span class="coin" style="width:14px;height:14px;vertical-align:-2px"></span>' : '') + '</p>' +
      '<div class="ach-pr">' + prog + '</div><button class="btn" data-achx="1">Закрыть</button></div>';
    Sound.play('click');
  }
  document.addEventListener('click', function (e) {
    var x = e.target.closest('[data-achx]'), m = document.getElementById('achModal');
    if (x || (m && e.target === m)) { if (m) m.remove(); return; }
    var c = e.target.closest('[data-ach]'); if (c) openAch(c.getAttribute("data-ach"));
  });
  function setFlag(k) { var fl = store.get('flags', {}); if (!fl[k]) { fl[k] = 1; store.set('flags', fl); } }
  var achQ = [], achBusy = false;
  function checkAch() {
    var got = store.get('ach', []), S = sumStats(), any = false;
    ACH.forEach(function (a) { if (got.indexOf(a[0]) < 0 && a[3](S)) { got.push(a[0]); addCoins(a[2]); achQ.push(a); any = true; } });
    if (any) { store.set('ach', got); showAch(); }
  }
  function showAch() {
    if (achBusy || !achQ.length) return;
    achBusy = true;
    var a = achQ.shift(), el = document.createElement('div');
    el.className = 'achpop'; el.innerHTML = '<span>' + a[1] + '</span><div><small>' + t('ach.unlocked') + '</small><b>' + t('ach.' + a[0]) + '</b></div>' + (a[2] ? '<i>+' + a[2] + ' 🪙</i>' : '');
    document.body.appendChild(el); Sound.play('life'); vibrate(40);
    setTimeout(function () { el.remove(); achBusy = false; showAch(); }, 2600);
  }
  // три задания дня: игра дня, 5 партий, 3 разные игры
  function dayStat() { var d = store.get('dayStat', {}); if (d.date !== today()) d = { date: today(), plays: 0, games: [], claimed: {} }; return d; }
  function dailyTasks() {
    var D = dailyInfo(), ds = dayStat();
    return [
      { k: 't1', done: !!D.done, cur: D.done ? 1 : 0, need: 1, coins: 60 },
      { k: 't2', done: ds.plays >= 5, cur: Math.min(5, ds.plays), need: 5, coins: 40, xp: 40 },
      { k: 't3', done: ds.games.length >= 3, cur: Math.min(3, ds.games.length), need: 3, coins: 40, xp: 40 }
    ];
  }

  /* ---------- иконки кнопок ---------- */
  function arrow(dir) {
    var rot = { up: 0, right: 90, down: 180, left: 270 }[dir];
    return '<svg viewBox="0 0 24 24" width="28" height="28" style="transform:rotate(' + rot + 'deg)">' +
      '<path d="M12 5l7 9H5z" fill="#fff"/></svg>';
  }
  var ICON_ROT = '<svg viewBox="0 0 24 24" width="30" height="30"><path d="M19 12a7 7 0 1 1-2.05-4.95" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/><path d="M19.5 3.5v5h-5z" fill="#fff"/></svg>';
  var ICON_DROP = '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M12 3v11" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/><path d="M6 11l6 7 6-7z" fill="#fff"/><rect x="4" y="19" width="16" height="2.6" rx="1.3" fill="#fff"/></svg>';

  var I_PLAY = '<svg class="bi" viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" fill="#fff"/></svg>';
  var I_AGAIN = '<svg class="bi" viewBox="0 0 24 24"><path d="M19 12a7 7 0 1 1-2.05-4.95" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/><path d="M19.5 3.5v5h-5z" fill="#fff"/></svg>';
  var I_MENU = '<svg class="bi" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="2.8" rx="1.4" fill="#fff"/><rect x="4" y="10.6" width="16" height="2.8" rx="1.4" fill="#fff"/><rect x="4" y="16.2" width="16" height="2.8" rx="1.4" fill="#fff"/></svg>';
  var I_TROPHY = '<svg class="ti" viewBox="0 0 24 24"><path d="M7 3h10v3h3v2a5 5 0 0 1-4.6 5A5 5 0 0 1 13 15.9V18h3v3H8v-3h3v-2.1A5 5 0 0 1 8.6 13 5 5 0 0 1 4 8V6h3zm0 5V8H6a3 3 0 0 0 1 2.2zm10 0v2.2A3 3 0 0 0 18 8z" fill="#ffd166"/></svg>';

  var CONTROL_LAYOUTS = {
    dpad: '<div class="dpad">' +
      '<button class="cbtn u" data-k="up">' + arrow('up') + '</button>' +
      '<button class="cbtn l" data-k="left">' + arrow('left') + '</button>' +
      '<button class="cbtn d" data-k="down">' + arrow('down') + '</button>' +
      '<button class="cbtn r" data-k="right">' + arrow('right') + '</button></div>',
    tank: '<div class="dpad">' +
      '<button class="cbtn u" data-k="up">' + arrow('up') + '</button>' +
      '<button class="cbtn l" data-k="left">' + arrow('left') + '</button>' +
      '<button class="cbtn d" data-k="down">' + arrow('down') + '</button>' +
      '<button class="cbtn r" data-k="right">' + arrow('right') + '</button></div>' +
      '<div class="grp"><button class="cbtn round" data-k="a">' +
      '<svg viewBox="0 0 24 24" width="34" height="34"><circle cx="12" cy="12" r="4" fill="#fff"/><circle cx="12" cy="12" r="8.5" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M12 1v5M12 18v5M1 12h5M18 12h5" stroke="#fff" stroke-width="2.4"/></svg></button></div>',
    platform: '<div class="grp"><button class="cbtn wide" data-k="left">' + arrow('left') + '</button>' +
      '<button class="cbtn wide" data-k="right">' + arrow('right') + '</button></div>' +
      '<div class="grp"><button class="cbtn round" data-k="a">A</button></div>',
    tetris: '<div class="grp"><button class="cbtn" data-k="left">' + arrow('left') + '</button>' +
      '<button class="cbtn" data-k="down">' + arrow('down') + '</button>' +
      '<button class="cbtn" data-k="right">' + arrow('right') + '</button></div>' +
      '<div class="grp"><button class="cbtn" data-k="b">' + ICON_DROP + '</button>' +
      '<button class="cbtn round" data-k="a">' + ICON_ROT + '</button></div>',
    runner: function () {
      return '<div class="grp"><button class="cbtn wide2" data-k="down">' + arrow('down') + '<span>' + I18N.t('ctl.duck') + '</span></button></div>' +
        '<div class="grp"><button class="cbtn wide2 hi" data-k="a">' + arrow('up') + '<span>' + I18N.t('ctl.jump') + '</span></button></div>';
    },
    none: ''
  };

  /* ---------- состояние ---------- */
  var t = I18N.t;
  var App = { id: null, def: null, inst: null, state: 'menu', score: 0, W: 0, H: 0, dpr: 1, raf: 0, last: 0, diff: 1, best: 0 };
  var cv = $('#cv'), ctx = cv.getContext('2d');
  FX.cv = $('#fxc'); FX.c = FX.cv.getContext('2d');
  var overlay = $('#overlay'), panel = $('#panel');
  var scoreEl = $('#gScore'), bestEl = $('#gBest');
  var DIFF_COL = ['#22c55e', '#3b82f6', '#f97316', '#ef4444'];

  function gt(id, f) { return I18N.has(id + '.' + f) ? t(id + '.' + f) : (GAMES[id][f] || ''); }
  function diffOf(id) { var d = store.get('diff_' + id, 1); return d >= 0 && d <= 3 ? d : 1; }
  function best(id, d) { return store.get('best_' + id + '_' + (d == null ? diffOf(id) : d), 0); }
  // перенос старых рекордов (до появления сложности) на «Нормально»
  ORDER.forEach(function (id) {
    var old = store.get('best_' + id, null);
    if (old !== null) {
      if (store.get('best_' + id + '_1', 0) < old) store.set('best_' + id + '_1', old);
      try { localStorage.removeItem('best_' + id); } catch (e) { }
    }
  });

  var api = {
    get W() { return App.W; },
    get H() { return App.H; },
    get quality() { return Gfx.quality; },
    get diff() { return App.diff; },
    get mode() { return App.def && App.def.modes ? App.mode : 0; },
    get net() { return App.mode === 2 ? App.net : null; },
    t: t,
    setScore: function (n) {
      var up = n > App.score;
      App.score = n;
      scoreEl.textContent = n;
      if (n > App.best && App.best > 0 && !App.beat) {
        App.beat = true; bestEl.parentNode.classList.add('beat');
        api.toast(t('toast.record')); fxConfetti(40);
      }
      if (n > App.best) bestEl.textContent = n;
      if (up) { scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump'); }
    },
    addScore: function (n) { api.setScore(App.score + n); },
    getScore: function () { return App.score; },
    gameOver: function () { if (App.state === 'playing') endGame(); },
    sound: function (n) { Sound.play(n); },
    tone: function (f, d, type, vol) { Sound.tone(f, d, type, vol); },
    toast: function (txt) {
      var el = document.createElement('div');
      el.className = 'toast'; el.textContent = txt;
      $('#stage').appendChild(el);
      setTimeout(function () { el.remove(); }, 1600);
    },
    vibrate: vibrate,
    store: store,
    // эффекты движка (рисуются поверх игры): api.fx.burst / text / shake / flash / confetti
    fx: { burst: fxBurst, text: fxText, shake: fxShake, flash: fxFlash, confetti: fxConfetti },
    get fxOn() { return fxOn; }
  };

  /* ---------- игра по локальной сети ---------- */
  // Android: TCP + UDP-маяк через мост MainActivity. В браузере — имитация через BroadcastChannel (для отладки и тестов).
  var Net = {
    kind: (window.Android && window.Android.netHost) ? 'android' : (window.BroadcastChannel ? 'bc' : null),
    state: 'idle', // idle | hosting | joining | connected
    host: false, found: {}, myIp: '', port: 0, onEvent: null,
    bc: null, bcId: 'p' + Math.random().toString(36).slice(2, 8), bcPeer: null, bcTimer: 0, game: null,
    via: store.get('netVia', 'lan'),
    available: function () { return this.via === 'online' ? Online.ok() : !!this.kind; },
    startHost: function (game, pub) {
      if (this.via === 'online') { this.stopAll(); this.game = game; this.state = 'hosting'; this.host = true; Online.host(game, !!pub); return; }
      this.stopAll(); this.game = game; this.state = 'hosting'; this.host = true;
      if (this.kind === 'android') window.Android.netHost(game, deviceName());
      else {
        this.bcOpen(); var self = this;
        this.myIp = this.bcId;
        this.bcTimer = setInterval(function () { self.bc.postMessage({ k: 'beacon', id: self.bcId, game: game, name: deviceName() }); }, 400);
        Net.emit({ type: 'hosting', ip: this.bcId, port: 0 });
      }
    },
    discover: function (game) {
      this.game = game; this.found = {};
      if (this.via === 'online') { Online.browse(game); return; }
      if (this.kind === 'android') window.Android.netDiscover(game);
      else this.bcOpen();
    },
    join: function (ip, port) {
      this.state = 'joining'; this.host = false;
      if (this.via === 'online') { Online.join(ip); return; }
      if (this.kind === 'android') window.Android.netJoin(ip, port || 47800);
      else { this.bcOpen(); this.bc.postMessage({ k: 'join', to: ip, from: this.bcId }); this.bcPeer = ip; }
    },
    send: function (obj) {
      if (this.state !== 'connected') return;
      var s = JSON.stringify(obj);
      if (this.via === 'online') Online.send(s);
      else if (this.kind === 'android') window.Android.netSend(s);
      else this.bc.postMessage({ k: 'msg', to: this.bcPeer, from: this.bcId, data: s });
    },
    sendFast: function (obj) { // последнее состояние важнее доставки каждого (LAN/TCP — обычной отправкой)
      if (this.state !== 'connected') return;
      if (this.via === 'online') Online.fast(JSON.stringify(obj)); else this.send(obj);
    },
    stopAll: function () {
      if (this.state === 'connected') try { this.send({ t: 'bye' }); } catch (e) { }
      this.state = 'idle'; this.found = {};
      Online.stop();
      if (this.kind === 'android') { try { window.Android.netStop(); } catch (e) { } }
      else { clearInterval(this.bcTimer); this.bcPeer = null; }
    },
    bcOpen: function () {
      if (this.bc) return;
      var self = this;
      this.bc = new BroadcastChannel('arcade-lan');
      this.bc.onmessage = function (e) {
        var m = e.data;
        if (m.k === 'beacon' && m.id !== self.bcId && self.state !== 'connected') Net.emit({ type: 'found', ip: m.id, port: 0, name: m.name, game: m.game });
        else if (m.k === 'join' && m.to === self.bcId && self.state === 'hosting') {
          clearInterval(self.bcTimer); self.bcPeer = m.from;
          self.bc.postMessage({ k: 'accept', to: m.from, from: self.bcId });
          Net.emit({ type: 'connected', role: 'host' });
        } else if (m.k === 'accept' && m.to === self.bcId && self.state === 'joining') Net.emit({ type: 'connected', role: 'guest' });
        else if (m.k === 'msg' && m.to === self.bcId && m.from === self.bcPeer) Net.emit({ type: 'msg', data: m.data });
      };
    },
    emit: function (ev) {
      if (ev.type === 'connected') { this.state = 'connected'; this.host = ev.role === 'host'; }
      if (ev.type === 'hosting') { this.myIp = ev.ip; this.port = ev.port; }
      if (ev.type === 'found') { if (this.game && ev.game !== this.game) return; this.found[ev.ip + ':' + ev.port] = ev; }
      if (ev.type === 'closed' || ev.type === 'error') { if (this.state === 'connected' || this.state === 'joining') this.state = 'idle'; }
      if (ev.type === 'msg') { try { ev.obj = JSON.parse(ev.data); } catch (e) { return; } }
      if (this.onEvent) this.onEvent(ev);
    }
  };
  /* ---------- онлайн через Firebase Realtime Database (REST + SSE, без SDK) ---------- */
  // Комната: rooms/{CODE} = { g: игра, h: хозяин {u,n,a}, c: гость {u,n,a}, t: время, pub: в общем списке, hb: {h,c}, m: {pushId: {f, d}} }
  var FB = { key: 'AIzaSyDglJuu3uT8vIrAsLByo8cqMWywbS1rgxw', db: 'https://gamebox-73da2-default-rtdb.europe-west1.firebasedatabase.app' };
  var Online = {
    me: null, code: null, role: null, es: null, pollT: 0, hbT: 0, wdT: 0, listT: 0, seen: {}, peerT: 0, q: [], qBusy: false, esFails: 0, gen: 0,
    test: store.get('fbTest', null), // { db: 'http://127.0.0.1:port' } — локальная имитация для автотестов
    ok: function () { return !!(window.fetch && window.JSON); },
    dbUrl: function () { return this.test ? this.test.db : FB.db; },
    auth: function (cb) {
      var self = this;
      if (this.test) { var tu = store.get('fbTestUid', ''); if (!tu) { tu = 'u' + Math.random().toString(36).slice(2, 10); store.set('fbTestUid', tu); } this.me = tu; cb('test'); return; }
      var a = store.get('fbAuth', null);
      if (a && a.tok && a.exp > Date.now() + 60000) { this.me = a.uid; cb(a.tok); return; }
      // вход уже идёт — ждём его, иначе одновременные запросы создают несколько анонимных аккаунтов (двойные профили)
      if (this.authQ) { this.authQ.push(cb); return; }
      this.authQ = [cb]; var outer = cb; cb = function (tok) { var q = self.authQ || [outer]; self.authQ = null; q.forEach(function (f) { try { f(tok); } catch (e) { } }); };
      var refresh = a && a.rt, url, body, ct;
      if (refresh) { url = 'https://securetoken.googleapis.com/v1/token?key=' + FB.key; body = 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(a.rt); ct = 'application/x-www-form-urlencoded'; }
      else { url = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + FB.key; body = '{"returnSecureToken":true}'; ct = 'application/json'; }
      fetch(url, { method: 'POST', headers: { 'Content-Type': ct }, body: body }).then(function (r) { return r.json(); }).then(function (j) {
        var tok = j.idToken || j.id_token, uid = j.localId || j.user_id;
        if (!tok) { if (refresh) { store.set('fbAuth', null); var q0 = self.authQ; self.authQ = null; self.auth(function (t2) { (q0 || []).forEach(function (f) { try { f(t2); } catch (e) { } }); }); } else cb(null); return; }
        store.set('fbAuth', { tok: tok, rt: j.refreshToken || j.refresh_token, uid: uid, exp: Date.now() + (+(j.expiresIn || j.expires_in) || 3600) * 1000 });
        self.me = uid; cb(tok);
      }).catch(function () { cb(null); });
    },
    url: function (path, tok, q) {
      var u = this.dbUrl() + path + '.json', qs = [];
      if (tok && !this.test) qs.push('auth=' + encodeURIComponent(tok));
      if (q) qs.push(q);
      return qs.length ? u + '?' + qs.join('&') : u;
    },
    req: function (method, path, body, cb, q) {
      var self = this;
      this.auth(function (tok) {
        if (!tok) { if (cb) cb('auth'); return; }
        var o = { method: method };
        if (body !== undefined) o.body = JSON.stringify(typeof body === 'function' ? body() : body);
        fetch(self.url(path, tok, q), o).then(function (r) { if (!r.ok) throw r.status; return r.json(); })
          .then(function (j) { if (cb) cb(null, j); }).catch(function (e) { if (cb) cb(e || 'net'); });
      });
    },
    who: function () { return { u: this.me, n: deviceName().slice(0, 16), a: avatar() }; },
    newCode: function () { var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', c = ''; for (var i = 0; i < 4; i++) c += A[Math.floor(Math.random() * A.length)]; return c; },
    fail: function (key) { this.stop(); Net.state = 'idle'; Net.emit({ type: 'error', msg: key || 'net.error' }); },
    // список открытых комнат игры (для «Быстрой игры» и списка в лобби)
    rooms: function (game, cb) {
      var self = this;
      this.req('GET', '/rooms', undefined, function (e, all) {
        if (e) { cb(e, []); return; }
        var now = Date.now(), out = [];
        Object.keys(all || {}).forEach(function (k) {
          var r = all[k]; if (!r || r.g !== game) return;
          var last = Math.max(r.t || 0, (r.hb && r.hb.h) || 0);
          if (now - last > 3600000 && r.h) { self.req('DELETE', '/rooms/' + k); return; } // мусор старше часа
          if (r.pub && !r.c && r.h && r.h.u !== self.me && now - last < 45000) out.push({ code: k, n: r.h.n, a: r.h.a, t: r.t || 0 });
        });
        out.sort(function (a, b) { return a.t - b.t; });
        cb(null, out);
      }, 'orderBy=%22g%22&equalTo=' + encodeURIComponent(JSON.stringify(game)));
    },
    browse: function (game) {
      var self = this, gen = this.gen;
      clearInterval(this.listT);
      var tick = function () {
        if (gen !== self.gen || Net.state !== 'idle') return;
        self.rooms(game, function (e, list) {
          if (gen !== self.gen || Net.state !== 'idle') return;
          Net.found = {};
          list.forEach(function (r) { Net.found[r.code] = { ip: r.code, port: 0, name: (window.GBAV.text(r.a) + ' ' + r.n).trim(), game: game }; });
          Net.offline = !!e;
          if (Net.onEvent) Net.onEvent({ type: 'found' });
        });
      };
      tick(); this.listT = setInterval(tick, 3000);
    },
    quick: function (game) {
      var self = this; Net.game = game; Net.state = 'joining'; Net.host = false;
      var gen = ++this.gen;
      this.rooms(game, function (e, list) {
        if (gen !== self.gen) return;
        if (e) { self.fail('on.offline'); return; }
        var i = 0;
        var next = function () {
          if (gen !== self.gen) return;
          if (i >= list.length) { Net.startHost(game, true); if (Net.onEvent) Net.onEvent({ type: 'hosting' }); return; }
          self.join(list[i++].code, next);
        };
        next();
      });
    },
    host: function (game, pub) {
      var self = this, code = this.newCode(), gen = ++this.gen;
      this.code = code; this.role = 'h'; this.seen = {};
      this.req('PUT', '/rooms/' + code, function () { return { g: game, h: self.who(), t: { '.sv': 'timestamp' }, pub: pub, v: 1 }; }, function (e) {
        if (gen !== self.gen) return;
        if (e) { self.fail('on.offline'); return; }
        Net.emit({ type: 'hosting', ip: code, port: 0 });
        self.listen(gen); self.beat(gen);
      });
    },
    join: function (code, onTaken) {
      var self = this; code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (code.length !== 4) { this.fail('on.notFound'); return; }
      var gen = onTaken ? this.gen : ++this.gen;
      Net.state = 'joining'; Net.host = false;
      var bad = function (k) { if (gen !== self.gen) return; if (onTaken) onTaken(); else self.fail(k); };
      this.req('GET', '/rooms/' + code, undefined, function (e, r) {
        if (gen !== self.gen) return;
        if (e) { bad('on.offline'); return; }
        if (!r || !r.h) { bad('on.notFound'); return; }
        if (r.g !== Net.game) { bad('on.otherGame'); return; }
        if (r.c) { bad('on.taken'); return; }
        self.req('PUT', '/rooms/' + code + '/c', function () { return self.who(); }, function (e2) {
          if (gen !== self.gen) return;
          if (e2) { bad('on.taken'); return; }
          self.code = code; self.role = 'c'; self.seen = {}; self.peer = r.h;
          self.listen(gen); self.beat(gen);
          Net.emit({ type: 'connected', role: 'guest' });
        });
      });
    },
    // события комнаты: SSE (EventSource), при неудаче — опрос раз в 1.2 с
    listen: function (gen) {
      var self = this;
      this.peerT = Date.now();
      if (!window.EventSource || this.esFails >= 3) { this.poll(gen); return; }
      this.auth(function (tok) {
        if (gen !== self.gen) return;
        var es; try { es = new EventSource(self.url('/rooms/' + self.code, tok)); } catch (e) { self.esFails = 3; self.poll(gen); return; }
        self.es = es; var opened = false;
        var on = function (ev) { if (gen !== self.gen) return; opened = true; self.esFails = 0; try { var j = JSON.parse(ev.data); self.apply(j.path, j.data, ev.type === 'patch'); } catch (x) { } };
        es.addEventListener('put', on); es.addEventListener('patch', on);
        es.addEventListener('auth_revoked', function () { if (gen !== self.gen) return; es.close(); store.set('fbAuth', null); self.listen(gen); });
        es.addEventListener('cancel', function () { if (gen !== self.gen) return; es.close(); self.esFails = 3; self.poll(gen); });
        es.onerror = function () {
          if (gen !== self.gen || opened) return;
          if (++self.esFails >= 3) { es.close(); self.poll(gen); }
        };
      });
    },
    poll: function (gen) {
      var self = this; clearInterval(this.pollT);
      this.pollT = setInterval(function () {
        if (gen !== self.gen) return;
        self.req('GET', '/rooms/' + self.code, undefined, function (e, r) { if (!e && gen === self.gen) self.apply('/', r, false); });
      }, 1200);
    },
    apply: function (path, data, patch) {
      if (patch) { for (var k in data) this.apply((path === '/' ? '' : path) + '/' + k, data[k], false); return; }
      var p = path.split('/').filter(Boolean);
      if (!p.length) {
        if (data === null) { if (Net.state === 'connected' || Net.state === 'hosting') { var w = Net.state === 'connected'; this.stop(); if (w) Net.emit({ type: 'closed' }); else this.fail('on.gone'); } return; }
        var self = this; ['c', 'hb', 'm'].forEach(function (k) { if (data[k] !== undefined) self.apply('/' + k, data[k], false); });
        return;
      }
      if (p[0] === 'c') {
        if (data && data.u && data.u !== this.me && this.role === 'h' && Net.state === 'hosting') {
          this.peer = data; this.peerT = Date.now(); Net.emit({ type: 'connected', role: 'host' });
        }
      } else if (p[0] === 'hb') {
        if (p.length === 1) { if (data && data[this.role === 'h' ? 'c' : 'h']) this.peerT = Date.now(); }
        else if (p[1] !== this.role) this.peerT = Date.now();
      } else if (p[0] === 'st') {
        if (p.length === 1) { for (var r in (data || {})) if (r !== this.role) this.apply('/st/' + r, data[r], false); }
        else if (p[1] !== this.role && data && data.n > (this.fastIn || 0)) { this.fastIn = data.n; this.peerT = Date.now(); Net.emit({ type: 'msg', data: data.d }); }
      } else if (p[0] === 'm') {
        if (p.length === 1) { var ids = Object.keys(data || {}).sort(); for (var i = 0; i < ids.length; i++) this.msg(ids[i], data[ids[i]]); }
        else if (p.length === 2) this.msg(p[1], data);
      }
    },
    msg: function (id, m) {
      if (!m || this.seen[id]) return;
      this.seen[id] = 1;
      if (m.f === this.me) return;
      this.peerT = Date.now();
      Net.emit({ type: 'msg', data: m.d });
    },
    send: function (s) {
      if (!this.code) return;
      this.q.push(s); this.flush();
    },
    flush: function () {
      if (this.qBusy || !this.q.length) return;
      var self = this, s = this.q.shift(), gen = this.gen, code = this.code;
      this.qBusy = true;
      this.req('POST', '/rooms/' + code + '/m', function () { return { f: self.me, d: s }; }, function () {
        self.qBusy = false; if (gen === self.gen) self.flush(); else self.q = [];
      });
    },
    // быстрый канал для игр в реальном времени: rooms/C/st/<роль> = {d, n} перезаписывается,
    // пока запрос в пути — новые состояния склеиваются (уходит только последнее)
    fast: function (s) { if (!this.code) return; this.fastPend = s; this.fastFlush(); },
    fastFlush: function () {
      if (this.fastBusy || this.fastPend == null || !this.code) return;
      var self = this, s = this.fastPend, gen = this.gen;
      this.fastPend = null; this.fastBusy = true; this.fastN = (this.fastN || 0) + 1;
      this.req('PUT', '/rooms/' + this.code + '/st/' + this.role, { d: s, n: this.fastN }, function () {
        self.fastBusy = false; if (gen === self.gen) self.fastFlush();
      });
    },
    // мировой рейтинг: lb/<игра>_<сложность>/<uid> = {s, n, a, t}; правила базы разрешают только повышать свой рекорд
    submit: function (game, diff, score) {
      if (store.get('lbHide', false)) return; // игрок скрыл себя из рейтинга
      var self = this;
      this.auth(function (tok) { if (!tok) return; self.req('PUT', '/lb/' + game + '_' + diff + '/' + self.me, function () { return { s: score, n: deviceName().slice(0, 16), a: avatar(), t: { '.sv': 'timestamp' } }; }); });
    },
    top: function (game, diff, cb) {
      var self = this;
      this.req('GET', '/lb/' + game + '_' + diff, undefined, function (e, all) {
        if (e) { cb(e, []); return; }
        var l = Object.keys(all || {}).map(function (k) { var r = all[k]; r.u = k; return r; }).sort(function (x, y) { return y.s - x.s; });
        cb(null, l, self.me);
      }, 'orderBy=%22s%22&limitToLast=50');
    },
    // активные матчи: открытые комнаты с публичным доступом и идущие партии
    liveRooms: function (cb) {
      var now = Date.now();
      this.req('GET', '/rooms', undefined, function (e, all) {
        if (e) { cb(e, []); return; }
        var out = [];
        Object.keys(all || {}).forEach(function (k) {
          var r = all[k], hb = (r && r.hb) || {};
          if (!r || !r.h || !r.pub || !GAMES[r.g] || !GAMES[r.g].lan) return;
          if (now - Math.max(r.t || 0, hb.h || 0, hb.c || 0) > 45000) return;
          out.push({ code: k, g: r.g, h: r.h, c: r.c || null, t: r.t || 0 });
        });
        out.sort(function (a, b) { return (a.c ? 1 : 0) - (b.c ? 1 : 0) || b.t - a.t; });
        cb(null, out);
      }, 'orderBy=%22pub%22&equalTo=true');
    },
    // пульс: свой hb каждые 4 с; соперник молчит 25 с — связь потеряна
    beat: function (gen) {
      var self = this;
      clearInterval(this.hbT); clearInterval(this.wdT);
      var b = function () { if (gen === self.gen && self.code) self.req('PUT', '/rooms/' + self.code + '/hb/' + self.role, { '.sv': 'timestamp' }); };
      b(); this.hbT = setInterval(b, 4000);
      this.wdT = setInterval(function () {
        if (gen !== self.gen) return;
        if (Net.state === 'connected' && Date.now() - self.peerT > 25000) { self.stop(); Net.emit({ type: 'closed' }); }
      }, 2000);
    },
    stop: function () {
      var code = this.code, role = this.role;
      this.gen++;
      clearInterval(this.pollT); clearInterval(this.hbT); clearInterval(this.wdT); clearInterval(this.listT);
      if (this.es) { try { this.es.close(); } catch (e) { } this.es = null; }
      var me = this.me, self = this; // недоотправленное (например «bye») отправляем напрямую
      if (code) this.q.forEach(function (x) { self.req('POST', '/rooms/' + code + '/m', { f: me, d: x }); });
      this.fastPend = null; this.fastBusy = false; this.fastN = 0; this.fastIn = 0;
      this.q = []; this.qBusy = false; this.code = null; this.role = null; this.peer = null;
      if (code && role === 'h') this.req('DELETE', '/rooms/' + code);
    }
  };
  window.__net = function (json) { try { Net.emit(typeof json === 'string' ? JSON.parse(json) : json); } catch (e) { } };
  function deviceName() {
    var n = store.get('netName', '');
    if (!n) { n = 'Player-' + Math.floor(100 + Math.random() * 900); store.set('netName', n); }
    return n;
  }

  /* ---------- экраны ---------- */
  function show(id) {
    var s = document.querySelectorAll('.screen');
    for (var i = 0; i < s.length; i++) s[i].classList.toggle('active', s[i].id === id);
  }

  function applyStaticTexts() {
    $('#appTitle').textContent = t('app.title');
    $('#appTag').textContent = t('app.tag');
    $('#bestLbl').textContent = t('hud.best');
    $('#setBtnTxt').textContent = t('menu.settings');
    $('#hello').textContent = t('menu.hello');
    $('#recentLbl').textContent = t('menu.recent');
    var cur = I18N.LANGS.filter(function (l) { return l.id === I18N.lang; })[0];
    $('#langBtnTxt').textContent = cur.name;
  }

  function buildMenu() {
    var html = '';
    ORDER.forEach(function (id, i) {
      var d = GAMES[id];
      html += '<button class="card" data-id="' + id + '" style="--c1:' + d.colors[0] + ';--c2:' + d.colors[1] + '">' +
        '<div class="cart">' + (d.isNew4 ? '<span class="new">NEW</span>' : '<span class="num">№' + (i < 9 ? '0' : '') + (i + 1) + '</span>') +
        '<div class="ic">' + ico(d.icon) + '</div></div>' +
        '<div class="lbl"><h2></h2><div class="desc"></div>' +
        '<div class="meta"><span class="best">' + I_TROPHY + '<b>0</b></span><span class="dtag"></span><span class="mdl"></span></div></div>' +
        '<span class="fv">♥</span></button>';
    });
    $('#cards').innerHTML = html;
  }
  function renderMenu() {
    applyStaticTexts();
    var plays = store.get('plays', 0), played = 0;
    ORDER.forEach(function (id) {
      var card = document.querySelector('.card[data-id="' + id + '"]');
      var dd = diffOf(id), any = false;
      for (var k = 0; k < 4; k++) if (best(id, k) > 0) any = true;
      if (any) played++;
      card.querySelector('h2').textContent = gt(id, 'title');
      card.querySelector('.desc').textContent = gt(id, 'desc');
      card.querySelector('.best b').textContent = best(id, dd);
      var tag = card.querySelector('.dtag');
      tag.textContent = t('diff.short.' + dd);
      tag.style.background = DIFF_COL[dd];
      card.querySelector('.mdl').textContent = MEDAL_IC[medal(id)];
      card.classList.toggle('isfav', isFav(id));
      card.classList.toggle('locked', isLocked(id));
      var lb = card.querySelector('.lockb');
      if (isLocked(id)) { if (!lb) { lb = document.createElement('span'); lb.className = 'lockb'; card.appendChild(lb); } lb.textContent = '🔒 ' + LOCKED[id]; }
      else if (lb) lb.remove();
    });
    $('#total').textContent = t('menu.stats', plays, played, ORDER.length);
    $('#rndTxt').textContent = t('menu.random');
    renderProfileChip();
    renderDaily();
    applySort();
    renderRecent();
    renderTabs();
  }

  /* ---------- уровень игрока и задание дня ---------- */
  function medalCount() {
    var c = [0, 0, 0, 0];
    ORDER.forEach(function (id) { var m = medal(id); for (var k = 1; k <= m; k++) c[k]++; });
    return c;
  }
  function renderProfileChip() {
    var L = lvlInfo(store.get('xp', 0)), mc = medalCount();
    $('#lvN').textContent = L.n;
    $('#lvRank').textContent = t('lvl.r' + L.rank);
    $('#lvXp').textContent = L.cur + ' / ' + L.need + ' XP';
    $('#lvBar').style.width = Math.round(L.cur / L.need * 100) + '%';
    $('#mdSum').innerHTML = '🥇<b>' + mc[3] + '</b> 🥈<b>' + mc[2] + '</b> 🥉<b>' + mc[1] + '</b>';
    $('#avEm').innerHTML = avH(avatar());
    $('#avEm').style.background = store.get('pColor', '');
    var cn = coins(); $('#coinN').textContent = cn >= 1e6 ? (Math.floor(cn / 1e5) / 10) + 'M' : cn >= 1e4 ? Math.floor(cn / 1e3) + 'K' : cn;
  }
  function renderDaily() {
    var D = dailyInfo(), g = GAMES[D.id], streak = store.get('streak', { n: 0, d: '' });
    var sn = streak.d === D.key || streak.d === today(-1) ? streak.n : 0;
    $('#daily').innerHTML = '<div class="dl' + (D.done ? ' done' : '') + '" data-id="' + D.id + '" style="--c1:' + g.colors[0] + ';--c2:' + g.colors[1] + '">' +
      '<span class="dic">' + ico(g.icon) + '</span><div class="dtx"><small>' + t('daily.title') + (sn > 0 ? ' · 🔥 ' + sn : '') + '</small>' +
      '<b>' + (D.done ? t('daily.done') : t('daily.goal', D.target, gt(D.id, 'title'))) + '</b>' +
      '<span>' + (D.done ? '✔' : '+' + D.xp + ' XP') + '</span></div>' +
      (D.done ? '' : '<span class="dgo">' + I_PLAY + '</span>') + '</div>' +
      '<div class="tasks">' + dailyTasks().slice(1).map(function (q) {
        return '<div class="task' + (q.done ? ' done' : '') + '"><span>' + t('task.' + q.k, q.need) + '</span>' +
          '<span class="tbar"><i style="width:' + Math.round(q.cur / q.need * 100) + '%"></i></span><small>' + q.cur + '/' + q.need + ' · +' + q.coins + ' <span class="coin" style="width:13px;height:13px;vertical-align:-2px"></span></small></div>';
      }).join('') + '</div>';
  }
  $('#daily').addEventListener('click', function (e) {
    var c = e.target.closest('.dl'); if (!c) return;
    Sound.init(); Sound.play('click'); startGame(c.getAttribute('data-id'));
  });
  $('#rnd').addEventListener('click', function () {
    var vis = ORDER.filter(function (id) { return inCat(id, menuCat) && !isLocked(id); });
    if (!vis.length) vis = ORDER;
    Sound.init(); Sound.play('bonus');
    startGame(vis[Math.floor(Math.random() * vis.length)]);
  });
  function renderProfile() {
    var xp = store.get('xp', 0), L = lvlInfo(xp), mc = medalCount(), tt = 0, streak = store.get('streak', { n: 0, d: '', best: 0 });
    ORDER.forEach(function (id) { tt += gstat(id).t; });
    var rows = ORDER.slice().sort(function (a, b) { return medal(b) - medal(a) || gstat(b).p - gstat(a).p; }).map(function (id) {
      var g = GAMES[id], st = gstat(id), m = medal(id), th = medalsOf(id), bb = 0;
      for (var k = 0; k < 4; k++) bb = Math.max(bb, best(id, k));
      return '<button class="pg" data-play="' + id + '" style="--c1:' + g.colors[0] + ';--c2:' + g.colors[1] + '"><span class="ri">' + ico(g.icon) + '</span>' +
        '<span class="pn"><b>' + gt(id, 'title') + '</b><small>' + I_TROPHY + bb + ' · ' + t('stat.plays', st.p) + '</small></span>' +
        '<span class="pm">' + (m ? MEDAL_IC[m] : '<i>' + (m < 3 ? th[m] : '') + '</i>') + '</span></button>';
    }).join('');
    var got = store.get('ach', []);
    var achHtml = '<div class="achs">' + ACH.map(function (a) {
      var on = got.indexOf(a[0]) >= 0;
      return '<div class="ach ' + (on ? 'on' : 'off') + '" data-ach="' + a[0] + '" style="cursor:pointer"><em>' + a[1] + '</em><small>' + t('ach.' + a[0]) + '</small></div>';
    }).join('') + '</div>';
    $('#setBody').innerHTML = '<h3>' + t('prof.title') + '</h3>' +
      '<div class="pname"><button class="av" data-shop="1">' + avH(avatar()) + '</button><input id="pnameIn" maxlength="16"' + (store.get('acct', null) ? ' readonly' : '') + ' value="' + escapeHtml(deviceName()) + '" placeholder="' + t('prof.name') + '"></div>' +
      '<div class="plv"><div class="big"><b>' + L.n + '</b><small>' + t('lvl.short') + '</small></div><div class="pr">' +
      '<b>' + t('lvl.r' + L.rank) + '</b><span class="bar"><i style="width:' + Math.round(L.cur / L.need * 100) + '%"></i></span>' +
      '<small>' + t('prof.next', L.n + 1, L.need - L.cur) + '</small></div></div>' +
      '<div class="pstats">' +
      '<div><b>' + xp + '</b><small>' + t('prof.xp') + '</small></div>' +
      '<div><b>' + store.get('plays', 0) + '</b><small>' + t('prof.plays') + '</small></div>' +
      '<div><b>' + fmtTime(tt) + '</b><small>' + t('prof.time') + '</small></div>' +
      '<div><b>🔥 ' + (streak.best || streak.n || 0) + '</b><small>' + t('prof.streak') + '</small></div></div>' +
      '<div class="bdgs">' + badgesHtml(myBadges) + '</div><button class="btn sec" data-friends="1">👥 Друзья</button>' +
      '<div class="sec">Настройки профиля</div>' +
      '<input id="pStatusIn" class="pstat-in" maxlength="40" placeholder="Статус (до 40 символов)" value="' + escapeHtml(store.get('pStatus', '')) + '">' +
      '<div class="pcolors">' + PCOLORS.map(function (c) { return '<button class="pcol' + (store.get('pColor', '') === c ? ' on' : '') + '" data-pcolor="' + c + '" style="background:' + (c || '#334155') + '"></button>'; }).join('') + '</div>' +
      '<button class="row" data-lbhide="1"><span class="rl"><em>🙈</em>Скрыть меня из рейтинга</span><span>' + (store.get('lbHide', false) ? 'Вкл' : 'Выкл') + '</span></button>' +
      '<div class="promo"><input id="promoIn" maxlength="24" placeholder="Промокод"><button class="btn" data-promo="1">OK</button></div>' +
      '<button class="row" data-copyid="1"><span class="rl"><em>🆔</em>Мой ID: ' + escapeHtml((Online.me || '—').slice(0, 10)) + '</span><span>📋</span></button>' +
      '<button class="row" data-accs="1"><span class="rl"><em>🔄</em>Сменить аккаунт</span><span>›</span></button>' +
      '<button class="row danger" data-accrm="1"><span class="rl"><em>🗑️</em>Удалить аккаунт</span><span>!</span></button>' +
      '<div class="sec">Аккаунт</div><div class="pstats">' +
      '<div><b>' + ((store.get('acct', null) || {}).type === 'google' ? 'Google' : 'Гость') + '</b><small>Вход</small></div>' +
      '<div><b>' + escapeHtml(favGame()) + '</b><small>Любимая игра</small></div>' +
      '<div><b>' + ORDER.filter(function (id) { return !isLocked(id); }).length + ' / ' + ORDER.length + '</b><small>Открыто игр</small></div>' +
      '<div><b>' + escapeHtml(store.get('since', '')) + '</b><small>Играет с</small></div></div>' +
      '<div class="sec">' + t('ach.title') + ' · ' + got.length + ' / ' + ACH.length + '</div>' + achHtml +
      '<div class="sec">' + t('prof.medals') + ' · 🥇' + mc[3] + ' 🥈' + mc[2] + ' 🥉' + mc[1] + ' / ' + ORDER.length * 3 + '</div>' +
      '<div class="note pnote">' + t('prof.medalHint') + '</div>' +
      (IS_APP || window.YANDEX ? '' : googleUser() ? '<button class="btn sec" data-glogout="1">Выйти из Google (' + escapeHtml(googleUser().n) + ')</button>' :
        '<button class="btn" data-glogin="1">Войти через Google</button>') +
      '<button class="btn sec" data-ovr="1">🏆 Общий рейтинг</button>' +
      '<div class="plist">' + rows + '</div>' +
      '<button class="btn" data-set="close">' + t('set.done') + '</button>';
  }
  // защита от случайных нажатий: после прокрутки или закрытия окна «проваливающийся» тап не открывает профиль, магазин и настройки
  var lastScrollT = 0, sheetClosedT = 0;
  window.addEventListener('scroll', function () { lastScrollT = Date.now(); }, { passive: true, capture: true });
  window.addEventListener('touchmove', function () { lastScrollT = Date.now(); }, { passive: true });
  var sheetEl = $('#settings'); // sheet объявляется ниже, здесь берём элемент напрямую
  new MutationObserver(function () { if (!sheetEl.classList.contains('show')) sheetClosedT = Date.now(); }).observe(sheetEl, { attributes: true, attributeFilter: ['class'] });
  function safeTap() { var now = Date.now(); return now - lastScrollT > 350 && now - sheetClosedT > 450; }
  $('#coinBtn').addEventListener('click', function () { if (!safeTap()) return; Sound.init(); Sound.play('click'); renderShop(); sheet.classList.add('show', 'profile'); });
  // ежедневная награда: серия из 7 дней, пропуск дня сбрасывает серию
  var GIFTS = [50, 75, 100, 150, 200, 300, 500];
  function giftState() {
    var g = store.get('dailyGift', { d: '', n: 0 }), claimed = g.d === today();
    var streak = claimed || g.d === today(-1) ? g.n : 0;
    return { claimed: claimed, streak: streak, next: claimed ? streak : streak + 1 };
  }
  function giftHtml() {
    var G = giftState(), day = (G.next - 1) % 7;
    return '<div class="sec">🎁 Ежедневная награда</div><div class="gifts">' + GIFTS.map(function (c, i) {
      var cls = i < day || (G.claimed && i === day) ? ' got' : i === day ? ' now' : '';
      return '<div class="gift' + cls + '"><small>День ' + (i + 1) + '</small><b>' + c + '</b></div>';
    }).join('') + '</div>' +
      (G.claimed ? '<div class="note pnote">Награда получена, приходи завтра. Серия: ' + G.streak + ' дн.</div>'
        : '<button class="btn" data-gift="1">Забрать ' + GIFTS[day] + ' монет</button>');
  }
  function claimGift() {
    var G = giftState(); if (G.claimed) return;
    var c = GIFTS[(G.next - 1) % 7];
    store.set('dailyGift', { d: today(), n: G.next }); addCoins(c);
    fxConfetti(40); Sound.play('bonus'); api.toast('🎁 +' + c + ' монет! Серия: ' + G.next + ' дн.');
    renderShop(); renderProfileChip();
  }
  function renderShop() {
    var cur = themeOf().id, av = avatar();
    $('#setBody').innerHTML = '<h3>🛍️ ' + t('shop.title') + '</h3>' +
      '<div class="shopbal"><span>' + t('shop.balance') + '</span><b><span class=\"coin\"></span>' + coins() + '</b></div>' +
      '<div class="note pnote">' + t('shop.hint') + '</div>' + giftHtml() +
      (window.GBAds && !noAds ? '<button class="btn sec" data-rwd="1">📺 Посмотреть рекламу: +50 монет</button>' : '') +
      '<div class="sec">' + t('shop.themes') + '</div><div class="themes">' + THEMES.map(function (T) {
        var own = T.price === 0 || owned('t:' + T.id);
        return '<button class="thm' + (T.id === cur ? ' sel' : '') + '" data-buy="t:' + T.id + '">' + (skinOf() === 'glass' ? '<i style="background:radial-gradient(circle at 30% 30%,rgba(' + T.blobs[0] + ',.9),transparent 60%),radial-gradient(circle at 80% 70%,rgba(' + T.blobs[1] + ',.9),transparent 60%),' + T.bg + '"></i>' : '<i style="background:' + T.v[0] + '"><b style="position:absolute;left:10px;top:10px;width:26px;height:26px;border-radius:7px;background:' + T.v[5] + ';border:2px solid ' + T.v[3] + ';box-shadow:3px 3px 0 ' + T.v[7] + '"></b><b style="position:absolute;right:10px;bottom:10px;width:34px;height:14px;border-radius:4px;background:' + T.v[1] + ';border:2px solid ' + T.v[3] + '"></b></i>') +
          '<span>' + (T.name || t('theme.' + T.id)) + '<br>' + (T.id === cur ? '✔' : own ? t('shop.own') : '<span class=\"coin\"></span> ' + T.price) + '</span></button>';
      }).join('') + '</div>' +
      '<div class="sec">' + t('shop.avatars') + '</div><div class="avs">' + AVATARS.map(function (A) {
        var own = A[1] === 0 || owned('a:' + A[0]);
        return '<button class="avb' + (A[0] === av ? ' sel' : '') + (own ? '' : ' lock') + '" data-buy="a:' + A[0] + '">' + avH(A[0]) + '<small>' + (own ? (A[0] === av ? '✔' : '') : A[1]) + '</small></button>';
      }).join('') + '</div>' +
      '<div class="sec">⚡ Бустеры</div>' + (boostLeft() > 0 ? '<div class="note pnote">⚡ ×2 монеты действует ещё ' + Math.ceil(boostLeft() / 60000) + ' мин.</div>' : '') +
      '<div class="themes">' + BOOSTS.map(function (B, i) {
        return '<button class="thm" data-boost="' + i + '"><i style="display:flex;align-items:center;justify-content:center;font-size:30px;background:linear-gradient(135deg,#f59e0b,#ef4444)">⚡</i><span>×2 монеты · ' + (B[0] < 60 ? B[0] + ' мин' : B[0] / 60 + ' ч') + '<br><span class="coin"></span> ' + B[1] + '</span></button>';
      }).join('') + '</div>' +
      '<button class="btn" data-set="close">' + t('set.done') + '</button>';
  }
  var boostAsk = -1;
  function buyBoost(i) {
    var B = BOOSTS[i];
    if (coins() < B[1]) { menuToast(t('shop.noMoney', B[1] - coins())); Sound.play('hit'); return; }
    if (boostAsk !== i) { boostAsk = i; menuToast('Нажми ещё раз — купить за ' + B[1]); return; }
    boostAsk = -1; addCoins(-B[1]);
    store.set('boostEnd', Math.max(Date.now(), store.get('boostEnd', 0)) + B[0] * 60000);
    Sound.play('bonus'); fxConfettiMenu(); renderShop(); renderProfileChip();
  }
  function buy(key) {
    var kind = key.slice(0, 1), id = key.slice(2), price;
    if (kind === 't') price = THEMES.filter(function (x) { return x.id === id; })[0].price;
    else price = AVATARS.filter(function (x) { return x[0] === id; })[0][1];
    if (price && !owned(key)) {
      if (coins() < price) { menuToast(t('shop.noMoney', price - coins())); Sound.play('hit'); return; }
      addCoins(-price); var ow = store.get('owned', []); ow.push(key); store.set('owned', ow); setFlag('bought');
      Sound.play('coin'); fxConfettiMenu();
    } else Sound.play('click');
    if (kind === 't') { store.set('theme', id); applyTheme(); } else store.set('avatar', id);
    renderShop(); renderProfileChip(); setTimeout(checkAch, 400);
  }
  function fxConfettiMenu() { var el = document.createElement('div'); el.className = 'toast'; el.style.position = 'fixed'; el.textContent = '🎉'; document.body.appendChild(el); setTimeout(function () { el.remove(); }, 1600); }
  $('#prof').addEventListener('click', function () { if (!safeTap()) return; Sound.init(); Sound.play('click'); renderProfile(); sheet.classList.add('show', 'profile'); });

  /* ---------- недавние игры ---------- */
  function renderRecent() {
    var rec = store.get('recent', []).filter(function (id) { return GAMES[id]; }).slice(0, 6);
    $('#recentWrap').style.display = rec.length ? '' : 'none';
    $('#recent').innerHTML = rec.map(function (id) {
      var d = GAMES[id];
      return '<button class="rc" data-id="' + id + '" style="--c1:' + d.colors[0] + ';--c2:' + d.colors[1] + '">' +
        '<span class="ri">' + ico(d.icon) + '</span><span class="rn">' + gt(id, 'title') + '</span></button>';
    }).join('');
  }
  $('#recent').addEventListener('click', function (e) {
    var c = e.target.closest('.rc'); if (!c) return;
    Sound.init(); Sound.play('click'); startGame(c.getAttribute('data-id'));
  });

  /* ---------- категории и поиск ---------- */
  var CATS = { arcade: ['snake', 'flappy', 'mario', 'breakout', 'space', 'dino', 'pacman', 'slither', 'tanks', 'stack', 'jumper', 'mole'],
    puzzle: ['tetris', 'g2048', 'mines', 'match3', 'sudoku', 'memory', 'simon', 'bubbles'],
    board: ['chess', 'checkers', 'nardy', 'billiards', 'battleship', 'ttt', 'darts', 'connect4', 'reversi'] };
  CATS.arcade.push('asteroids', 'crossy', 'fruit', 'knife', 'tiles', 'colorjump', 'airhockey', 'racing', 'archery', 'basket');
  CATS.puzzle.push('puzzle15', 'blocks', 'maze', 'solitaire');
  CATS.board.push('yahtzee');
  ORDER.forEach(function (id) { var c = GAMES[id].cat; if (CATS[c] && CATS[c].indexOf(id) < 0) CATS[c].push(id); }); // v2.4: категория из описания игры
  var TABS = ['all', 'fav', 'arcade', 'puzzle', 'board', 'duo', 'lan'];
  var menuCat = store.get('menuCat', 'all'), query = '';
  if (TABS.indexOf(menuCat) < 0) menuCat = 'all';
  function inCat(id, cat) {
    var d = GAMES[id];
    if (cat === 'all') return true;
    if (cat === 'fav') return isFav(id);
    if (cat === 'duo') return !!d.modes || id === 'pong';
    if (cat === 'lan') return !!d.lan;
    return (CATS[cat] || []).indexOf(id) >= 0;
  }
  function norm(x) { return String(x || '').toLowerCase().replace(/ё/g, 'е'); }
  var SORTS = ['def', 'pop', 'az', 'new', 'medal'], menuSort = store.get('menuSort', 'def');
  if (SORTS.indexOf(menuSort) < 0) menuSort = 'def';
  function sortedIds() {
    var ids = ORDER.slice();
    if (menuSort === 'pop') ids.sort(function (a, b) { return gstat(b).p - gstat(a).p; });
    else if (menuSort === 'az') ids.sort(function (a, b) { return String(gt(a, 'title')).localeCompare(String(gt(b, 'title'))); });
    else if (menuSort === 'new') ids.sort(function (a, b) { var A = GAMES[a], B = GAMES[b]; return (B.isNew4 ? 3 : B.isNew3 ? 2 : B.isNew2 ? 1 : 0) - (A.isNew4 ? 3 : A.isNew3 ? 2 : A.isNew2 ? 1 : 0); });
    else if (menuSort === 'medal') ids.sort(function (a, b) { return medal(b) - medal(a); });
    // закрытые игры всегда в конце списка (сортировка стабильная, порядок внутри групп сохраняется)
    return ids.filter(function (id) { return !isLocked(id); }).concat(ids.filter(isLocked));
  }
  function applySort() {
    var box = $('#cards');
    sortedIds().forEach(function (id) { box.appendChild(box.querySelector('.card[data-id="' + id + '"]')); });
    $('#sortTxt').textContent = t('sort.' + menuSort);
  }
  $('#sortBtn').addEventListener('click', function () {
    Sound.init(); Sound.play('click');
    menuSort = SORTS[(SORTS.indexOf(menuSort) + 1) % SORTS.length]; store.set('menuSort', menuSort);
    applySort(); filterMenu();
  });
  function filterMenu() {
    var q = norm(query).trim(), shown = 0;
    ORDER.forEach(function (id) {
      var card = document.querySelector('.card[data-id="' + id + '"]');
      var hay = norm([gt(id, 'title'), gt(id, 'desc'), GAMES[id].title, I18N.en(id + '.title'), id].join(' '));
      var ok = inCat(id, menuCat) && (!q || hay.indexOf(q) >= 0);
      card.style.display = ok ? '' : 'none';
      if (ok) { card.style.animationDelay = (shown * 0.05) + 's'; shown++; }
    });
    $('#empty').textContent = shown ? '' : t('menu.empty');
    $('#searchX').style.visibility = query ? 'visible' : 'hidden';
  }
  function renderTabs() {
    if (menuCat === 'fav' && !favs().length) menuCat = 'all';
    $('#tabs').innerHTML = TABS.map(function (k) {
      var n = ORDER.filter(function (id) { return inCat(id, k); }).length;
      if (k === 'fav' && !n) return '';
      return '<button class="tab' + (k === menuCat ? ' on' : '') + '" data-cat="' + k + '">' + (k === 'fav' ? '❤ ' : '') + t('cat.' + k) + '<i>' + n + '</i></button>';
    }).join('');
    $('#search').placeholder = t('menu.search');
    filterMenu();
    var tb = $('#tabs'), on = tb.querySelector('.tab.on');
    if (on) tb.scrollLeft = Math.max(0, on.offsetLeft - tb.offsetLeft - (tb.clientWidth - on.offsetWidth) / 2);
  }
  $('#tabs').addEventListener('click', function (e) {
    var b = e.target.closest('.tab'); if (!b) return;
    Sound.init(); Sound.play('click');
    menuCat = b.getAttribute('data-cat'); store.set('menuCat', menuCat);
    renderTabs();
  });
  $('#search').addEventListener('input', function () { query = this.value; filterMenu(); });
  $('#search').addEventListener('keydown', function (e) { if (e.key === 'Enter') this.blur(); });
  $('#searchX').addEventListener('click', function () { query = ''; $('#search').value = ''; filterMenu(); });

  $('#cards').addEventListener('click', function (e) {
    var c = e.target.closest('.card');
    if (!c) return;
    Sound.init(); Sound.play('click');
    startGame(c.getAttribute('data-id'));
  });

  /* ---------- настройки ---------- */
  var sheet = $('#settings'), resetArmed = 0;
  var SET_IC = { sound: '🔊', music: '🎵', vibro: '📳', showFps: '📈', reset: '🗑️', fx: '✨' };
  function toggleHtml(key, on) {
    return '<button class="row" data-set="' + key + '"><span class="rl"><em>' + SET_IC[key] + '</em>' + t('set.' + key) + '</span>' +
      '<span class="sw' + (on ? ' on' : '') + '"><i></i></span></button>';
  }
  function segHtml(attr, opts, cur, label) {
    return '<div class="seg">' + opts.map(function (v, i) {
      return '<button class="sg' + (v === cur ? ' on' : '') + '" ' + attr + '="' + v + '">' + label(v, i) + '</button>';
    }).join('') + '</div>';
  }
  function renderSettings() {
    var langs = I18N.LANGS.map(function (l) {
      return '<button class="lang' + (l.id === I18N.lang ? ' on' : '') + '" data-lang="' + l.id + '"><b>' + l.flag + '</b>' + l.name + '</button>';
    }).join('');
    $('#setBody').innerHTML =
      '<h3>' + t('set.title') + '</h3>' +
      '<div class="sec">' + t('skin.title') + '</div><div class="skins">' + SKINS.map(function (k) { return '<button class="skb' + (k === skinOf() ? ' on' : '') + '" data-skin="' + k + '"><i class="skp skp-' + k + '"></i><span>' + t('skin.' + k) + '</span></button>'; }).join('') + '</div>' +
      '<div class="sec">' + t('set.lang') + '</div><div class="langs">' + langs + '</div>' +
      '<div class="sec">' + t('set.secGraphics') + '</div>' +
      '<div class="box"><div class="bl">🎞️ ' + t('set.fps') + '<b>' + (Gfx.fps || t('set.fpsMax')) + (Gfx.fps ? ' FPS' : '') + '</b></div>' +
      segHtml('data-fps', FPS_OPTS, Gfx.fps, function (v) { return v ? String(v) : t('set.fpsMax'); }) +
      '<div class="note">' + t('set.fpsNote') + '</div>' +
      '<div class="bl">✨ ' + t('set.quality') + '</div>' +
      segHtml('data-q', [0, 1, 2], Gfx.quality, function (v) { return t('q.' + v); }) + '</div>' +
      toggleHtml('showFps', Gfx.showFps) + toggleHtml('fx', fxOn) +
      '<div class="sec">' + t('set.secSound') + '</div>' +
      toggleHtml('sound', Sound.on) + toggleHtml('music', Music.on) +
      (Music.on ? '<div class="box"><div class="bl">🎼 ' + t('set.track') + '</div>' +
        segHtml('data-track', [-1, 0, 1, 2, 3, 4], Music.pick, function (v) { return v < 0 ? t('track.auto') : String(v + 1); }) +
        '<div class="note">' + (Music.pick >= 0 ? t('track.' + Music.pick) : t('track.autoNote')) + '</div></div>' : '') +
      toggleHtml('vibro', vibroOn) +
      '<div class="sec">' + t('set.secData') + '</div>' +
      '<button class="row" data-bk="open"><span class="rl"><em>💾</em>Перенос прогресса</span><span>›</span></button>' +
      '<button class="row danger" data-set="reset"><span class="rl"><em>' + SET_IC.reset + '</em>' + (resetArmed ? t('set.resetAsk') : t('set.reset')) + '</span><span>⟲</span></button>' +
      '<button class="btn" data-set="close">' + t('set.done') + '</button>' +
      '<div class="ver">' + t('set.version') + ' ' + APP_NAME + '</div>';
  }
  var APP_NAME = '4.6', APP_CODE = 46, updInfo = null, updBarHidden = false;
  // обновление APK: в /app/latest лежит {code, name, notes, url}, админка публикует его кнопкой.
  // WebView приложения не умеет скачивать файлы сам, поэтому «Скачать» копирует ссылку для браузера
  function checkUpdate() {
    if (IS_APP === false || !Online.ok()) return; // на сайте обновлять APK не нужно
    // версия берётся с сайта (version.json обновляется вместе с APK) и из админки; показывается более новая
    function got(r) {
      if (!r || !(r.code > APP_CODE) || (updInfo && updInfo.code >= r.code)) return;
      var first = !updInfo; updInfo = r;
      if (first) (function wait() { if (document.getElementById('acctNick')) setTimeout(wait, 2000); else showUpdate(); })(); // не перекрывать окно первого входа
    }
    fetch('https://arsik01112014-alt.github.io/Gamebox/version.json?t=' + Date.now()).then(function (r) { return r.json(); }).then(got).catch(function () { });
    Online.req('GET', '/app/latest', undefined, function (e, r) { if (!e) got(r); });
  }
  function copyText(s) {
    var ta = document.createElement('textarea'); ta.value = s; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) { } ta.remove();
    try { navigator.clipboard.writeText(s); } catch (e) { }
  }
  function showUpdate() {
    var el = document.getElementById('updModal') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'updModal' }));
    el.innerHTML = '<div class="acct-card upd-card"><button class="upd-x" data-upd2="close">✕</button><h3>🚀 Доступна новая версия ' + escapeHtml(updInfo.name || '') + '</h3>' +
      (updInfo.notes ? '<p>' + escapeHtml(updInfo.notes) + '</p>' : '') +
      '<button class="btn" data-upd2="dl">⬇ Скачать</button><div class="upd-link" id="updLink"></div><button class="btn sec" data-upd2="close">Позже</button></div>';
  }
  function showUpdBar() {
    if (updBarHidden || !updInfo) return;
    var bar = document.getElementById('updBar') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'updBar' }));
    bar.innerHTML = '<span>🔔 Доступно обновление ' + escapeHtml(updInfo.name || '') + '</span><button data-upd2="dl">Скачать</button><button data-upd2="bar-x">✕</button>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-upd2]'); if (!b) return;
    var a = b.getAttribute('data-upd2');
    if (a === 'close') { var m = document.getElementById('updModal'); if (m) m.remove(); showUpdBar(); }
    else if (a === 'bar-x') { updBarHidden = true; var bar = document.getElementById('updBar'); if (bar) bar.remove(); }
    else if (a === 'dl' && updInfo) {
      copyText(updInfo.url || '');
      var l = document.getElementById('updLink');
      if (l) l.innerHTML = 'Ссылка скопирована. Откройте браузер, вставьте её в адресную строку и скачайте новую версию.<br><b>' + escapeHtml(updInfo.url || '') + '</b>';
      else api.toast('Ссылка скопирована — вставьте её в браузере и скачайте обновление');
    }
  });
  setTimeout(checkUpdate, 4000);
  var lbDiff = 1;
  function renderLb(id, d, rows, me, err) {
    var h = '<h3>🏆 ' + gt(id, 'title') + '</h3><div class="seg">' + [0, 1, 2, 3].map(function (k) { return '<button class="sg' + (k === d ? ' on' : '') + '" data-lbd="' + k + '">' + t('diff.short.' + k) + '</button>'; }).join('') + '</div><div class="plist" style="margin-top:10px">';
    if (err) h += '<div class="note pnote">' + t('on.offline') + '</div>';
    else if (rows === null) h += '<div class="lwait"><span class="spin"></span></div>';
    else if (!rows.length) h += '<div class="note pnote">' + t('lb.empty') + '</div>';
    else rows.forEach(function (r, i) { h += '<div class="pg" data-player="' + escapeHtml(r.u) + '" style="' + (r.u === me ? 'outline:2px solid #facc15' : '') + '"><span class="pm">' + (i < 3 ? ['🥇', '🥈', '🥉'][i] : '<i>' + (i + 1) + '</i>') + '</span><div class="pn"><b>' + avH(r.a) + ' ' + escapeHtml(r.n || '?') + '</b></div><b>' + r.s + '</b></div>'; });
    $('#setBody').innerHTML = h + '</div><button class="btn" data-set="close">' + t('set.done') + '</button>';
  }
  function openLb(id, d) {
    for (var k = 0; k < 4; k++) { var bs = best(id, k); if (bs > 0) Online.submit(id, k, bs); } // рекорды, поставленные до рейтинга
    lbDiff = d; renderLb(id, d, null); sheet.classList.add('show');
    setTimeout(function () { Online.top(id, d, function (e, rows, me) { if (lbDiff === d && sheet.classList.contains('show')) renderLb(id, d, rows, me, e); }); }, 700);
  }
  /* ---------- общий рейтинг: очки = сумма медалей по всем играм (🥇3 · 🥈2 · 🥉1) ---------- */
  function overallPts() { return ORDER.reduce(function (s, id) { return s + medal(id); }, 0); }
  function submitOverall() { try { Online.submit('_all', 0, overallPts()); } catch (e) { } }
  function openOverall() {
    sheet.classList.remove('profile'); renderOverall(null); sheet.classList.add('show');
    submitOverall();
    setTimeout(function () {
      Online.req('GET', '/lb', undefined, function (e, all) { if (sheet.classList.contains('show')) renderOverall(e ? [] : overallRows(all || {}), Online.me, e); });
    }, 700);
  }
  // общий рейтинг считается по таблицам всех игр: в нём есть все, у кого есть рекорд, включая гостей и игроков старой версии
  function overallRows(all) {
    var best = {}, who = {}, pts = {};
    Object.keys(all).forEach(function (key) {
      var id = key.slice(0, key.lastIndexOf('_')), board = all[key] || {};
      if (key.charAt(0) === '_' || !GAMES[id]) return;
      Object.keys(board).forEach(function (u) {
        var r = board[u] || {}, m = medalFor(id, +r.s || 0), k = u + '|' + id;
        if (m > (best[k] || 0)) best[k] = m;
        if (!who[u] || (r.t || 0) > (who[u].t || 0)) who[u] = r;
      });
    });
    Object.keys(best).forEach(function (k) { var u = k.split('|')[0]; pts[u] = (pts[u] || 0) + best[k]; });
    return Object.keys(pts).filter(function (u) { return pts[u] > 0; })
      .map(function (u) { return { u: u, n: who[u].n, a: who[u].a, s: pts[u] }; })
      .sort(function (x, y) { return y.s - x.s; }).slice(0, 50);
  }
  function renderOverall(rows, me, err) {
    var h = '<h3>🏆 Общий рейтинг</h3><div class="note pnote">Очки за медали: 🥇3 · 🥈2 · 🥉1 по каждой игре</div><div class="plist" style="margin-top:10px">';
    if (err) h += '<div class="note pnote">' + t('on.offline') + '</div>';
    else if (!rows) h += '<div class="lwait"><span class="spin"></span></div>';
    else if (!rows.length) h += '<div class="note pnote">' + t('lb.empty') + '</div>';
    else rows.forEach(function (r, i) { h += '<div class="pg" data-player="' + escapeHtml(r.u) + '" style="' + (r.u === me ? 'outline:2px solid #facc15' : '') + '"><span class="pm">' + (i < 3 ? ['🥇', '🥈', '🥉'][i] : '<i>' + (i + 1) + '</i>') + '</span><div class="pn"><b>' + avH(r.a) + ' ' + escapeHtml(r.n || '?') + '</b></div><b>' + r.s + '</b></div>'; });
    $('#setBody').innerHTML = h + '</div><button class="btn" data-set="close">' + t('set.done') + '</button>';
  }
  /* ---------- вход через Google: только на сайте, в WebView приложения Google вход запрещает ---------- */
  // токен Google-пользователя кладётся туда же, где Online хранит анонимный, поэтому рейтинг и матчи работают без изменений
  var IS_APP = !!window.Android;
  function googleUser() { return store.get('gUser', null); }
  function resubmitAll() {
    ORDER.forEach(function (id) { for (var k = 0; k < 4; k++) { var b = best(id, k); if (b > 0) Online.submit(id, k, b); } });
    submitOverall();
  }
  function googleLogin() {
    var V = 'https://www.gstatic.com/firebasejs/10.12.2/';
    Promise.all([import(V + 'firebase-app.js'), import(V + 'firebase-auth.js')]).then(function (m) {
      var app = m[0].getApps().length ? m[0].getApp() : m[0].initializeApp({ apiKey: FB.key, authDomain: 'gamebox-73da2.firebaseapp.com', databaseURL: FB.db, projectId: 'gamebox-73da2' });
      return m[1].signInWithPopup(m[1].getAuth(app), new m[1].GoogleAuthProvider());
    }).then(function (res) {
      var u = res.user, old = store.get('fbAuth', null), first = !store.get('acct', null);
      return u.getIdToken().then(function (tok) {
        // первый вход через Google: гостевой профиль, созданный до входа, больше не нужен — удаляем его, чтобы не было двойника
        if (first && old && old.uid && old.uid !== u.uid && old.tok) ['lb/_seen_0', 'profiles', 'ips'].forEach(function (r) { fetch(FB.db + '/' + r + '/' + old.uid + '.json?auth=' + encodeURIComponent(old.tok), { method: 'DELETE' }).catch(function () { }); });
        store.set('fbAuth', { tok: tok, rt: u.refreshToken, uid: u.uid, exp: Date.now() + 3300000 });
        Online.me = u.uid;
        store.set('gUser', { n: (u.displayName || u.email || 'Google').slice(0, 16) });
        store.set('netName', (u.displayName || 'Player').slice(0, 16));
        store.set('acct', { type: 'google', n: googleUser().n }); acctHide();
        resubmitAll();
        api.toast('Вы вошли: ' + googleUser().n); renderProfile();
      });
    }).catch(function () { api.toast('Не удалось войти через Google'); });
  }
  function googleLogout() {
    store.set('gUser', null); store.set('fbAuth', null); Online.me = null;
    store.set('acct', null);
    api.toast('Вы вышли из Google'); renderProfile(); acctShow();
  }
  /* ---------- промокоды и пасхалки ---------- */
  // в коде лежат только хэши промокодов; каждый код срабатывает один раз на устройстве
  var PROMO = {
    'dc3ea9ea': { c: 250 },
    '25d13f4': { c: 500 },
    '3fd1a1ed': { c: 1000 },
    '91e277b7': { u: 'all' },
    '15371b66': { u: 'mario', c: 100 },
    'd3439451': { c: 100 },
    'c67f010f': { c: 300, m: '🥚 Ты нашёл секретный код!' }
  };
  function promoHash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0; return h.toString(16); }
  function redeemPromo() {
    var el = document.getElementById('promoIn'), code = (el && el.value || '').toUpperCase().replace(/\s+/g, '');
    if (!code) return;
    var key = promoHash(code), r = PROMO[key], used = store.get('promoUsed', []);
    if (!r) { redeemServer(key); return; }
    if (used.indexOf(key) >= 0) { api.toast('Этот промокод уже активирован'); return; }
    store.set('promoUsed', used.concat(key));
    applyReward(r);
  }
  function applyReward(r) {
    if (r.u) store.set('unlocked', store.get('unlocked', []).concat(r.u === 'all' ? Object.keys(LOCKED) : [r.u]));
    if (r.c) addCoins(+r.c);
    fxConfetti(40); Sound.play('bonus');
    api.toast(r.m || ('🎁 Промокод активирован' + (r.c ? ': +' + r.c + ' монет' : '') + (r.u ? ', игры открыты' : '')));
    renderMenu(); renderProfile();
  }
  // промокоды из админки: promos/{хэш}, активации promoUses/{хэш}/{uid} — один раз на аккаунт, с лимитом max
  function redeemServer(key) {
    Online.auth(function (tok) {
      if (!tok) { api.toast('Нужен интернет'); return; }
      var me = Online.me;
      Promise.all([getJ('/promos/' + key), getJ('/promoUses/' + key)]).then(function (x) {
        var pr = x[0], uses = x[1] || {};
        if (!pr) { api.toast('Неверный промокод'); return; }
        if (uses[me]) { api.toast('Этот промокод уже активирован'); return; }
        if (pr.max && Object.keys(uses).length >= pr.max) { api.toast('Промокод закончился'); return; }
        return putJ('PUT', '/promoUses/' + key + '/' + me, true).then(function () { applyReward(pr); });
      }).catch(function () { api.toast('Не удалось активировать, попробуй ещё раз'); });
    });
  }
  function egg(key, coinsN, msg) {
    if (store.get('egg_' + key, false)) return false;
    store.set('egg_' + key, true); addCoins(coinsN); fxConfetti(50); Sound.play('bonus');
    api.toast(msg + ' +' + coinsN + ' монет'); renderProfileChip(); return true;
  }
  // пасхалка 1: код Konami на клавиатуре
  var KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'], konamiPos = 0;
  document.addEventListener('keydown', function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    konamiPos = k === KONAMI[konamiPos] ? konamiPos + 1 : (k === KONAMI[0] ? 1 : 0);
    if (konamiPos === KONAMI.length) { konamiPos = 0; egg('konami', 500, '🎮 Код Konami!'); }
  });
  // пасхалка 2: 7 быстрых нажатий на приветствие
  var helloTaps = [];
  $('#hello').addEventListener('click', function () {
    var now = Date.now(); helloTaps = helloTaps.filter(function (t) { return now - t < 3000; }).concat(now);
    if (helloTaps.length >= 7) { helloTaps = []; if (!egg('hello', 100, '🥚 Ты нашёл пасхалку!')) api.toast('👀 Тут больше ничего нет… или есть?'); }
  });
  /* ---------- первый вход: гость с уникальным ником (выбирается один раз) или Google ---------- */
  // ники лежат в lb/_nick_0/{uid} в том же виде, что рекорды, поэтому подходят текущие правила базы
  function acctShow(err, nick) {
    var el = document.getElementById('acct');
    if (!el) { el = document.createElement('div'); el.id = 'acct'; document.body.appendChild(el); }
    var val = nick != null ? nick : store.get('netName', '').replace(/^Player-\d+$/, '');
    el.innerHTML = '<div class="acct-card"><h3>🎮 GameBox</h3><p>Выбери ник. Сменить его потом нельзя.</p>' +
      '<input id="acctNick" maxlength="16" placeholder="Ник" value="' + escapeHtml(val) + '">' +
      (err ? '<div class="acct-err">' + escapeHtml(err) + '</div>' : '') +
      '<button class="btn" data-acct="guest">Играть как гость</button>' +
      Object.keys(accList()).map(function (u) { var x = accList()[u]; return '<button class="btn sec" data-acct="sw:' + u + '">' + avH(x.a || 'i:kid') + ' ' + escapeHtml(x.n || 'Игрок') + ' · войти</button>'; }).join('') +
      (IS_APP || window.YANDEX ? '' : '<button class="btn sec" data-acct="google">Войти через Google</button>') + '</div>';
  }
  function acctHide() { var el = document.getElementById('acct'); if (el) el.remove(); }
  function acctGuest() {
    var nick = (document.getElementById('acctNick').value || '').trim();
    if (!/^[A-Za-zА-Яа-яЁё0-9_\- ]{3,16}$/.test(nick)) { acctShow('Ник: от 3 до 16 символов, буквы, цифры, _ и -', nick); return; }
    acctShow('Проверяю ник…', nick);
    Online.req('GET', '/lb/_nick_0', undefined, function (e, all) {
      if (e) { acctShow('Нет связи с сервером, попробуй ещё раз', nick); return; }
      var low = nick.toLowerCase(), mine = all && all[Online.me];
      var taken = Object.keys(all || {}).some(function (u) { return u !== Online.me && all[u] && String(all[u].n).toLowerCase() === low; });
      if (taken) { acctShow('Этот ник уже занят', nick); return; }
      var done = function () { store.set('netName', nick); store.set('acct', { type: 'guest', n: nick }); acctHide(); renderMenu(); };
      if (mine && mine.n === nick) { done(); return; }
      Online.req('PUT', '/lb/_nick_0/' + Online.me, { s: 1, n: nick, a: avatar(), t: { '.sv': 'timestamp' } }, function (e2) {
        if (e2) acctShow('Не удалось сохранить ник, попробуй ещё раз', nick); else done();
      });
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-acct]'); if (!b) return;
    Sound.init(); Sound.play('click');
    var v = b.getAttribute('data-acct');
    if (v === 'guest') acctGuest(); else if (v.indexOf('sw:') === 0) switchAcc(v.slice(3)); else googleLogin();
  });
  // вошедшим через Google до появления окна входа окно не показываем
  if (!store.get('acct', null)) { if (googleUser()) store.set('acct', { type: 'google', n: googleUser().n }); else acctShow(); }
  /* ---------- «в сети», публичный профиль, баны (аккаунт и IP), значки ---------- */
  // присутствие пишется как рекорд-время в lb/_seen_0/{uid}: s только растёт, поэтому подходят правила рейтинга
  var BADGES = { creator: ['👑', 'Создатель'], admin: ['🛡️', 'Админ'], moder: ['🔨', 'Модератор'], tester: ['🧪', 'Тестер'], vip: ['💎', 'VIP'], verified: ['✅', 'Проверен'] };
  var banAcc = false, banIp = false, myBadges = {}, myIp = null, noAds = false;
  // звук на время рекламы: музыка и эффекты идут через один AudioContext
  window.GBAudio = function (on) { try { if (Sound.ctx) { if (on) Sound.ctx.resume(); else Sound.ctx.suspend(); } } catch (e) { } };
  function badgesHtml(b) {
    return Object.keys(BADGES).filter(function (k) { return b && b[k]; }).map(function (k) { return '<span class="bdg bdg-' + k + '">' + BADGES[k][0] + ' ' + BADGES[k][1] + '</span>'; }).join('');
  }
  function ipKey(ip) { return String(ip).replace(/[.:]/g, '_'); }
  function profileData() {
    var mc = medalCount(), a = store.get('acct', null) || {};
    return { n: deviceName().slice(0, 16), a: avatar(), st: store.get('pStatus', ''), c: store.get('pColor', ''), ty: googleUser() ? 'google' : (a.type || 'guest'), co: coins(),
      lv: lvlInfo(store.get('xp', 0)).n, md: [mc[3], mc[2], mc[1]], pl: store.get('plays', 0), since: store.get('since', ''), t: { '.sv': 'timestamp' } };
  }
  function beatPresence() {
    if (document.hidden || !Online.ok()) return;
    Online.auth(function (tok) {
      if (!tok) return;
      var me = Online.me;
      Online.req('PUT', '/lb/_seen_0/' + me, function () { return { s: { '.sv': 'timestamp' }, n: deviceName().slice(0, 16), a: avatar(), t: { '.sv': 'timestamp' } }; });
      Online.req('PUT', '/profiles/' + me, profileData);
      Online.req('GET', '/bans/' + me, undefined, function (e, v) { banInfo = v || null; banAcc = !e && !!v && !(v.until && v.until < Date.now()); setBanned(); }); // until — временный бан
      Online.req('GET', '/badges/' + me, undefined, function (e, v) { if (!e) myBadges = v || {}; });
      Online.req('GET', '/noads/' + me, undefined, function (e, v) { noAds = !e && !!v; }); // админ отключил рекламу этому игроку
      checkApp(); supCheck();
      // аккаунт удалён админом: снимаем метку и начинаем с чистого листа
      Online.req('GET', '/deleted/' + me, undefined, function (e, v) {
        if (e || !v) return;
        Online.req('DELETE', '/deleted/' + me, undefined, function () { forgetAcc(me); wipeLocal(); location.reload(); });
      });
      // монеты от админа: gifts/{uid}; удаляем, и только если удаление прошло, начисляем — без двойного начисления
      Online.req('GET', '/gifts/' + me, undefined, function (e, g) {
        if (e || !g) return;
        // в подарке может быть: c — монеты, m — сообщение, w — предупреждение, n — новый ник, x — опыт, un — открыть игру (all — все)
        var sum = 0, msg = '', warn = false, nn = '', xp = 0, un = [];
        Object.keys(g).forEach(function (k) {
          var v = g[k] || {}; sum += +v.c || 0; xp += +v.x || 0; msg = msg || v.m || ''; if (v.w) warn = true; if (v.n) nn = String(v.n).slice(0, 16); if (v.un) un.push(v.un);
        });
        Online.req('DELETE', '/gifts/' + me, undefined, function (e2) {
          if (e2) return;
          if (nn) { store.set('netName', nn); }
          if (xp) store.set('xp', Math.max(0, store.get('xp', 0) + xp));
          un.forEach(function (id) { var ids = id === 'all' ? Object.keys(LOCKED) : [id]; store.set('unlocked', store.get('unlocked', []).concat(ids.filter(function (x) { return LOCKED[x]; }))); });
          if (sum) { addCoins(sum); Sound.play('bonus'); if (sum > 0) fxConfetti(50); }
          renderProfileChip(); if (App.state === 'menu') renderMenu();
          var parts = [];
          if (sum) parts.push(sum > 0 ? '+' + sum + ' монет' : 'списано ' + (-sum) + ' монет');
          if (xp) parts.push('+' + xp + ' XP');
          if (un.length) parts.push('открыты игры');
          if (nn) parts.push('ник изменён на «' + nn + '»');
          if (warn || msg || parts.length) adminNote(warn ? '⚠️ Предупреждение' : '📩 Сообщение от администрации', (msg ? msg : '') + (parts.length ? (msg ? '\n\n' : '') + parts.join(', ') : ''), warn);
        });
      });
      // IP нужен только для бана по адресу; читать его может только админ (см. правила базы)
      if (myIp) checkIpBan();
      else fetch('https://api.ipify.org?format=json').then(function (r) { return r.json(); }).then(function (j) {
        myIp = j.ip; Online.req('PUT', '/ips/' + me, { ip: myIp, t: { '.sv': 'timestamp' } }); checkIpBan();
      }).catch(function () { });
    });
  }
  // окно с сообщением от администрации (подарок, предупреждение, объявление)
  var noteQ = [];
  function adminNote(title, text, warn) {
    if (document.getElementById('admNote')) { noteQ.push([title, text, warn]); return; } // показываем по очереди
    var el = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'admNote' }));
    el.innerHTML = '<div class="acct-card upd-card"><button class="upd-x" data-admx="1">✕</button><h3>' + escapeHtml(title) + '</h3><p style="white-space:pre-line">' + escapeHtml(text) + '</p>' +
      '<button class="btn' + (warn ? ' sec' : '') + '" data-admx="1">Понятно</button></div>';
    Sound.play(warn ? 'hit' : 'bonus');
  }
  document.addEventListener('click', function (e) { if (e.target.closest('[data-admx]')) { var el = document.getElementById('admNote'); if (el) el.remove(); if (noteQ.length) adminNote.apply(null, noteQ.shift()); } });
  /* ---------- чат с поддержкой: support/{uid}/msgs — сообщения, support/{uid}/meta — ua/uu: непрочитано админом/игроком ---------- */
  var supBtn = document.body.appendChild(Object.assign(document.createElement('button'), { id: 'supBtn', title: 'Поддержка', innerHTML: '💬<i></i>' }));
  var supMsgs = [], supOpen = false, supT = 0, supUnread = false;
  setInterval(function () { // кнопка видна только в меню
    var show = App.state === 'menu' && !document.getElementById('acct') && !document.querySelector('.sheet.show') && !document.getElementById('maint');
    supBtn.style.display = show ? '' : 'none'; supBtn.classList.toggle('dot', supUnread);
    if (supOpen && Date.now() - supT > 8000) supLoad();
  }, 500);
  function supLoad() {
    supT = Date.now();
    Online.req('GET', '/support/' + Online.me + '/msgs', undefined, function (e, m) {
      if (e) return;
      supMsgs = Object.keys(m || {}).map(function (k) { return m[k]; }).sort(function (a, b) { return (a.t || 0) - (b.t || 0); });
      supRender();
      if (supUnread) { supUnread = false; Online.req('PATCH', '/support/' + Online.me + '/meta', { uu: false }); }
    });
  }
  function supRender() {
    var box = document.getElementById('supList'); if (!box) return;
    var at = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
    box.innerHTML = '<div class="sup-m a">Привет! 👋 Напиши свой вопрос, предложение или сообщи об ошибке — администрация ответит здесь.</div>' +
      supMsgs.map(function (m) { return '<div class="sup-m ' + (m.f === 'a' ? 'a' : 'u') + '">' + escapeHtml(m.x) + '<small>' + (m.t ? new Date(m.t).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '…') + '</small></div>'; }).join('');
    if (at || !supRender.done) box.scrollTop = box.scrollHeight; supRender.done = true;
  }
  function supShow() {
    supOpen = true; supRender.done = false;
    var el = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'supModal' }));
    el.innerHTML = '<div class="sup-card"><div class="sup-h"><b>💬 Поддержка</b><button class="upd-x" data-sup="close">✕</button></div><div id="supList"></div>' +
      '<div class="sup-in"><textarea id="supTx" maxlength="500" rows="1" placeholder="Сообщение…"></textarea><button class="btn" data-sup="send">➤</button></div></div>';
    supRender();
    if (!Online.ok()) { api.toast('Нужен интернет'); return; }
    Online.auth(function (tok) { if (tok) supLoad(); else api.toast('Нет связи с сервером'); });
  }
  function supSend() {
    var tx = document.getElementById('supTx'), v = (tx.value || '').trim();
    if (!v) return; if (v.length > 500) v = v.slice(0, 500);
    tx.value = ''; supMsgs.push({ f: 'u', x: v }); supRender(); Sound.play('click');
    Online.req('POST', '/support/' + Online.me + '/msgs', { f: 'u', x: v, t: { '.sv': 'timestamp' } }, function (e) {
      if (e) { api.toast('Не отправилось, попробуй ещё раз'); return; }
      Online.req('PATCH', '/support/' + Online.me + '/meta', { n: deviceName().slice(0, 16), a: avatar(), ua: true, uu: false, last: { '.sv': 'timestamp' }, lx: v.slice(0, 80) });
      supLoad();
    });
  }
  supBtn.addEventListener('click', function () { Sound.init(); Sound.play('click'); supShow(); });
  document.addEventListener('click', function (e) { if (e.target.closest('[data-ban-sup]')) supShow(); }); // забаненный может обжаловать
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-sup]'), m = document.getElementById('supModal');
    if ((b && b.getAttribute('data-sup') === 'close') || (m && e.target === m)) { if (m) m.remove(); supOpen = false; return; }
    if (b && b.getAttribute('data-sup') === 'send') supSend();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && e.target && e.target.id === 'supTx') { e.preventDefault(); supSend(); } });
  function supCheck() { // ответ поддержки: точка на кнопке и уведомление
    Online.req('GET', '/support/' + Online.me + '/meta/uu', undefined, function (e, v) {
      if (e) return;
      if (v && !supUnread && !supOpen) { api.toast('💬 Новое сообщение от администрации — нажми на кнопку чата'); Sound.play('bonus'); }
      supUnread = !!v; if (v && supOpen) supLoad();
    });
  }
  // общие настройки из админки: app/news — объявление, app/event — множитель монет на время, app/maint — техработы
  var evMul = 1;
  function checkApp() {
    Online.req('GET', '/app', undefined, function (e, A) {
      if (e || !A) return;
      var N = A.news;
      if (N && N.id && N.text && store.get('newsSeen', 0) !== N.id) { store.set('newsSeen', N.id); adminNote(N.title || '📢 Объявление', N.text); }
      var E = A.event;
      evMul = E && E.mul > 1 && E.until > Date.now() ? +E.mul : 1;
      if (evMul > 1 && store.get('evSeen', 0) !== E.until) { store.set('evSeen', E.until); api.toast('🎉 ' + (E.title || 'Событие') + ': монеты ×' + evMul + ' до ' + new Date(E.until).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })); }
      var M = A.maint, el = document.getElementById('maint');
      if (M && M.on) {
        if (!el) el = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'maint' }));
        el.innerHTML = '<div class="acct-card"><div style="font-size:48px">🛠</div><h3>Технические работы</h3><p>' + escapeHtml(M.text || 'Скоро всё заработает. Загляни чуть позже!') + '</p></div>';
      } else if (el) el.remove();
    });
  }
  function checkIpBan() { Online.req('GET', '/ipbans/' + ipKey(myIp), undefined, function (e, v) { banIp = !e && !!v; setBanned(); }); }
  var banInfo = null;
  function setBanned() {
    var on = banAcc || banIp, el = document.getElementById('banned');
    if (!on) { if (el) el.remove(); return; }
    if (el) el.remove();
    el = document.createElement('div'); el.id = 'banned';
    var bi = banAcc && banInfo ? banInfo : {};
    el.innerHTML = '<div class="acct-card"><h3>🚫 Вы заблокированы</h3><p>Администратор заблокировал ' + (banAcc ? 'этот аккаунт' : 'доступ с этого адреса') + '.</p>' +
      (bi.why ? '<p>Причина: ' + escapeHtml(bi.why) + '</p>' : '') +
      '<p>' + (bi.until ? 'Бан закончится ' + new Date(bi.until).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : 'Бан бессрочный') + '</p>' +
      '<p style="font-size:13px;opacity:.75">Не согласен? Напиши в поддержку — кнопка ниже.</p><button class="btn" data-ban-sup="1">💬 Написать в поддержку</button></div>';
    document.body.appendChild(el);
  }
  /* ---------- несколько аккаунтов на устройстве и удаление аккаунта ---------- */
  // аккаунт = снимок всего localStorage (прогресс, монеты, токен входа); снимки лежат в gbAccounts по uid
  // ключ строкой, а не переменной: окно входа читает список при запуске, раньше, чем выполняется этот блок
  var delAsk = 0;
  function accList() { try { return JSON.parse(localStorage.getItem('gbAccounts')) || {}; } catch (e) { return {}; } }
  function accSaveList(l) { try { localStorage.setItem('gbAccounts', JSON.stringify(l)); return true; } catch (e) { api.toast('Не хватает памяти, чтобы сохранить аккаунт'); return false; } }
  function myUid() { return Online.me || (store.get('fbAuth', null) || {}).uid || ''; }
  function snapshot() { var o = {}; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k !== 'gbAccounts') o[k] = localStorage.getItem(k); } return o; }
  function saveCurrentAcc() {
    var uid = myUid(); if (!uid || !store.get('acct', null)) return true;
    var l = accList(); l[uid] = { n: deviceName(), a: avatar(), ty: googleUser() ? 'google' : 'guest', t: Date.now(), data: snapshot() };
    return accSaveList(l);
  }
  function wipeLocal() { var keep = localStorage.getItem('gbAccounts'); localStorage.clear(); if (keep) localStorage.setItem('gbAccounts', keep); }
  function switchAcc(uid) {
    if (!saveCurrentAcc()) return;
    var x = accList()[uid]; if (!x) return;
    wipeLocal(); Object.keys(x.data || {}).forEach(function (k) { localStorage.setItem(k, x.data[k]); });
    location.reload();
  }
  function addAcc() { if (!saveCurrentAcc()) return; wipeLocal(); location.reload(); }
  function forgetAcc(uid) { var l = accList(); delete l[uid]; accSaveList(l); }
  function openAccounts() {
    saveCurrentAcc();
    var l = accList(), cur = myUid();
    sheet.classList.remove('profile'); sheet.classList.add('show');
    $('#setBody').innerHTML = '<h3>🔄 Аккаунты на этом устройстве</h3><div class="plist">' + Object.keys(l).sort(function (a, b) { return l[b].t - l[a].t; }).map(function (u) {
      var x = l[u], now = u === cur;
      return '<div class="pg"' + (now ? '' : ' data-accsw="' + u + '"') + '><span class="pm">' + avH(x.a || 'i:kid') + '</span><div class="pn"><b>' + escapeHtml(x.n || 'Игрок') + (now ? ' · сейчас' : '') + '</b>' +
        '<small>' + (x.ty === 'google' ? 'Google' : 'Гость') + (now ? '' : ' · нажми, чтобы войти') + '</small></div>' +
        (now ? '' : '<button class="btn sec" data-accforget="' + u + '" style="width:auto;margin:0;padding:6px 10px">✕</button>') + '</div>';
    }).join('') + '</div><button class="btn" data-accadd="1">➕ Добавить аккаунт</button>' +
      '<div class="note pnote">У каждого аккаунта свой прогресс, монеты и друзья. «✕» убирает аккаунт только с этого устройства, сам аккаунт остаётся.</div>' +
      '<button class="btn sec" data-set="close">' + t('set.done') + '</button>';
  }
  // удаление своего аккаунта: рекорды, ник, профиль, друзья и прочее одним запросом, затем чистое начало
  function deleteMyAccount() {
    if (Date.now() - delAsk > 4000) { delAsk = Date.now(); api.toast('⚠️ Нажми ещё раз, чтобы удалить аккаунт навсегда'); return; }
    Online.auth(function (tok) {
      if (!tok) { api.toast('Нужен интернет'); return; }
      var me = Online.me, up = {};
      ['_nick_0', '_seen_0', '_all_0'].forEach(function (b) { up['lb/' + b + '/' + me] = null; });
      ORDER.forEach(function (id) { for (var k = 0; k < 4; k++) if (best(id, k) > 0) up['lb/' + id + '_' + k + '/' + me] = null; });
      ['profiles', 'friends', 'ips', 'gifts', 'freq'].forEach(function (r) { up[r + '/' + me] = null; });
      Online.req('PATCH', '/', up, function (e) {
        if (e) { api.toast('Не удалось удалить, попробуй ещё раз'); return; }
        forgetAcc(me); wipeLocal(); location.reload();
      });
    });
  }
  /* ---------- профиль другого игрока и друзья ---------- */
  // дружба взаимная: friends/{я}/{он} и friends/{он}/{я}; заявка лежит в freq/{кому}/{от кого}
  function getJ(path) { return new Promise(function (res) { Online.req('GET', path, undefined, function (e, v) { res(e ? null : v); }); }); }
  function putJ(method, path, body) { return new Promise(function (res, rej) { Online.req(method, path, body, function (e, v) { if (e) rej(e); else res(v); }); }); }
  function isOnline(t) { return !!t && Date.now() - t < 180000; }
  function sheetWait() { sheet.classList.remove('profile'); sheet.classList.add('show'); $('#setBody').innerHTML = '<div class="lwait"><span class="spin"></span></div>'; }
  function openPlayer(uid) {
    sheetWait();
    Online.auth(function () {
      var me = Online.me;
      Promise.all([getJ('/profiles/' + uid), getJ('/badges/' + uid), getJ('/friends/' + me + '/' + uid), getJ('/friends/' + uid + '/' + me), getJ('/freq/' + me + '/' + uid)]).then(function (r) {
        var p = r[0] || {}, md = p.md || [], fr = r[2] && r[3], out = r[2] && !r[3], inc = !!r[4];
        var act = uid === me ? '' : fr ? '<button class="btn sec" data-funf="' + uid + '">✓ В друзьях · удалить</button>' :
          out ? '<button class="btn sec" data-funf="' + uid + '">Заявка отправлена · отменить</button>' :
          '<button class="btn" data-fadd="' + uid + '">' + (inc ? '✓ Принять заявку в друзья' : '➕ Добавить в друзья') + '</button>';
        $('#setBody').innerHTML = '<h3>' + avH(p.a || 'i:kid') + ' ' + escapeHtml(p.n || 'Игрок') + '</h3>' +
          '<div class="bdgs">' + badgesHtml(r[1]) + '</div>' +
          (p.st ? '<div class="note pnote">«' + escapeHtml(p.st) + '»</div>' : '') +
          '<div class="pstats"><div><b>' + (p.lv || 1) + '</b><small>Уровень</small></div>' +
          '<div><b>🥇' + (md[0] || 0) + ' 🥈' + (md[1] || 0) + ' 🥉' + (md[2] || 0) + '</b><small>Медали</small></div>' +
          '<div><b>' + (p.pl || 0) + '</b><small>Партий</small></div>' +
          '<div><b>' + (isOnline(p.t) ? '🟢' : p.t ? new Date(p.t).toLocaleDateString('ru-RU') : '—') + '</b><small>' + (isOnline(p.t) ? 'В сети' : 'Заходил(а)') + '</small></div></div>' +
          '<div class="note pnote">' + (p.ty === 'google' ? 'Вход через Google' : 'Гость') + (p.since ? ' · играет с ' + escapeHtml(p.since) : '') + ' · ID ' + escapeHtml(uid.slice(0, 10)) + '</div>' +
          act + '<button class="btn sec" data-friends="1">👥 Мои друзья</button><button class="btn" data-set="close">' + t('set.done') + '</button>';
      });
    });
  }
  function openFriends() {
    sheetWait();
    Online.auth(function (tok) {
      if (!tok) { $('#setBody').innerHTML = '<div class="note pnote">' + t('on.offline') + '</div><button class="btn" data-set="close">' + t('set.done') + '</button>'; return; }
      var me = Online.me;
      Promise.all([getJ('/friends/' + me), getJ('/freq/' + me)]).then(function (r) {
        var mine = Object.keys(r[0] || {}).filter(function (u) { return r[0][u]; }), inc = r[1] || {};
        var ids = mine.concat(Object.keys(inc).filter(function (u) { return mine.indexOf(u) < 0; })).slice(0, 50);
        return Promise.all(ids.map(function (u) {
          return Promise.all([getJ('/profiles/' + u), mine.indexOf(u) >= 0 ? getJ('/friends/' + u + '/' + me) : null]).then(function (x) {
            return { u: u, p: x[0] || inc[u] || {}, mutual: !!x[1], mine: mine.indexOf(u) >= 0, inc: !!inc[u] };
          });
        }));
      }).then(function (list) {
        function row(f, sub) { return '<div class="pg" data-player="' + f.u + '"><span class="pm">' + (isOnline(f.p.t) ? '🟢' : '⚪') + '</span><div class="pn"><b>' + avH(f.p.a) + ' ' + escapeHtml(f.p.n || 'Игрок') + '</b><small>' + sub + '</small></div></div>'; }
        var fr = list.filter(function (f) { return f.mine && f.mutual; }), inc = list.filter(function (f) { return f.inc && !f.mine; }), out = list.filter(function (f) { return f.mine && !f.mutual; });
        $('#setBody').innerHTML = '<h3>👥 Друзья</h3>' +
          '<div class="promo"><input id="friendIn" placeholder="ID друга"><button class="btn" data-fbyid="1">Добавить</button></div>' +
          '<div class="note pnote">Свой ID копируется в профиле. Друзьями становятся, когда оба добавили друг друга.</div>' +
          (inc.length ? '<div class="sec">Заявки (' + inc.length + ')</div><div class="plist">' + inc.map(function (f) { return row(f, 'хочет дружить · нажми, чтобы ответить'); }).join('') + '</div>' : '') +
          '<div class="sec">Друзья (' + fr.length + ')</div><div class="plist">' + (fr.length ? fr.map(function (f) { return row(f, isOnline(f.p.t) ? 'в сети' : 'не в сети'); }).join('') : '<div class="note pnote">Пока никого нет.</div>') + '</div>' +
          (out.length ? '<div class="sec">Отправленные заявки</div><div class="plist">' + out.map(function (f) { return row(f, 'ждёт ответа'); }).join('') + '</div>' : '') +
          '<button class="btn" data-set="close">' + t('set.done') + '</button>';
      });
    });
  }
  function addFriend(uid) {
    var me = Online.me;
    if (!uid || uid === me) { api.toast('Это твой ID'); return; }
    putJ('PUT', '/friends/' + me + '/' + uid, true).then(function () {
      return getJ('/freq/' + me + '/' + uid).then(function (inc) {
        return inc ? putJ('DELETE', '/freq/' + me + '/' + uid) : putJ('PUT', '/freq/' + uid + '/' + me, { n: deviceName().slice(0, 16), a: avatar(), t: { '.sv': 'timestamp' } });
      });
    }).then(function () { api.toast('Готово'); openPlayer(uid); }, function () { api.toast('Не получилось, проверь интернет'); });
  }
  function removeFriend(uid) {
    var me = Online.me;
    putJ('DELETE', '/friends/' + me + '/' + uid).then(function () { return putJ('DELETE', '/freq/' + uid + '/' + me).catch(function () { }); })
      .then(function () { api.toast('Удалено'); openPlayer(uid); }, function () { api.toast('Не получилось'); });
  }
  setTimeout(beatPresence, 3000); setInterval(beatPresence, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) beatPresence(); });
  /* ---------- активные онлайн-матчи под заданиями дня ---------- */
  function renderLive(list) {
    var box = $('#live');
    if (!list.length) { box.innerHTML = ''; return; }
    var h = '<div class="ol-h"><span class="ol-dot"></span>Онлайн-матчи</div>';
    list.slice(0, 5).forEach(function (r) {
      var g = GAMES[r.g], who = avH(r.h.a) + ' ' + escapeHtml(r.h.n || '?');
      var act = r.c ? '<span class="ol-busy">Идёт матч</span>' : r.h.u === Online.me ? '<span class="ol-busy">Ваша комната</span>' :
        '<button class="ol-btn" data-join="' + r.code + '" data-game="' + r.g + '">Подключиться</button>';
      h += '<div class="ol-m" style="--c1:' + g.colors[0] + ';--c2:' + g.colors[1] + '"><span class="ol-i">' + ico(g.icon) + '</span>' +
        '<div class="ol-t"><b>' + escapeHtml(gt(r.g, 'title')) + '</b><small>' +
        (r.c ? who + ' <em>vs</em> ' + avH(r.c.a) + ' ' + escapeHtml(r.c.n || '?') : who + ' · ждёт соперника') + '</small></div>' + act + '</div>';
    });
    box.innerHTML = h;
  }
  function refreshLive() {
    if (document.hidden || !Online.ok()) return;
    Online.liveRooms(function (e, list) { if (!e) renderLive(list); });
  }
  function joinOnline(code, game) {
    Sound.init(); Sound.play('click');
    var pm = store.get('mode_' + game, 0);
    Net.stopAll(); Net.via = 'online'; store.set('netVia', 'online');
    store.set('mode_' + game, 2); startGame(game); store.set('mode_' + game, pm);
    Net.game = game; Net.join(code); refreshLobby();
  }
  $('#live').addEventListener('click', function (e) {
    var b = e.target.closest('[data-join]');
    if (b) joinOnline(b.getAttribute('data-join'), b.getAttribute('data-game'));
  });
  setInterval(refreshLive, 6000); refreshLive();
  function openSettings() { resetArmed = 0; renderSettings(); sheet.classList.add('show'); }
  var PCOLORS = ['', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
  function saveStatus() { var si = document.getElementById('pStatusIn'); if (si) store.set('pStatus', si.value.trim().slice(0, 40)); }
  function closeSettings() {
    saveStatus();
    var ni = document.getElementById('pnameIn');
    if (ni && ni.value.trim()) store.set('netName', ni.value.trim().slice(0, 16));
    sheet.classList.remove('show', 'profile'); renderMenu();
  }
  /* ---------- перенос прогресса на другое устройство: одноразовый код через сервер ----------
     Раньше код содержал все данные открытым текстом (base64): его можно было расшифровать и подделать монеты,
     а заодно он раскрывал ключ входа. Теперь данные лежат на сервере в xfer/{код} сутки и удаляются после использования */
  var XA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', bkCode = '', bkBusy = false;
  function xferData() {
    var o = {};
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k !== 'gbAccounts') o[k] = localStorage.getItem(k); } } catch (e) { }
    return JSON.stringify(o);
  }
  function renderBackup(msg) {
    $('#setBody').innerHTML = '<div class="bk"><h3>💾 Перенос прогресса</h3>' +
      '<p class="note pnote">Нужно перенести монеты, рекорды и покупки на другой телефон или в браузер? Получи код здесь и введи его на новом устройстве. Код одноразовый и действует сутки.</p>' +
      (bkCode ? '<div class="bkcode">' + bkCode + '</div><button class="btn sec" data-bk="copy">📋 Скопировать код</button>' : '<button class="btn" data-bk="make">📤 Получить код переноса</button>') +
      '<div class="sec" style="margin-top:14px">Есть код с другого устройства?</div>' +
      '<input id="bkIn" class="pstat-in" maxlength="14" placeholder="GB-XXXX-XXXX" autocomplete="off" style="text-transform:uppercase">' +
      '<button class="btn sec" data-bk="load">📥 Перенести сюда</button>' +
      (msg ? '<div class="dmark">' + msg + '</div>' : '') +
      '<p class="note pnote">⚠️ Прогресс на этом устройстве заменится перенесённым. Никому не сообщай код — по нему можно забрать твой аккаунт.</p>' +
      '<button class="btn sec" data-set="close">' + t('set.done') + '</button></div>';
  }
  function backupAct(a) {
    if (a === 'open') { renderBackup(); return; }
    if (a === 'copy') { copyText(bkCode); menuToast('Код скопирован'); return; }
    if (bkBusy) return;
    if (!Online.ok()) { renderBackup('⚠ Нужен интернет'); return; }
    if (a === 'make') {
      var code = 'GB-'; for (var i = 0; i < 8; i++) code += (i === 4 ? '-' : '') + XA[Math.floor(Math.random() * XA.length)];
      bkBusy = true; renderBackup('Создаю код…');
      Online.req('PUT', '/xfer/' + code.replace(/-/g, ''), { d: xferData(), exp: Date.now() + 86400000, t: { '.sv': 'timestamp' } }, function (e) {
        bkBusy = false;
        if (e) { renderBackup('⚠ Не удалось создать код: ' + (e === 401 || e === 403 ? 'нет доступа к серверу' : 'проверь интернет')); return; }
        bkCode = code; renderBackup();
      });
      return;
    }
    if (a === 'load') {
      var key = (document.getElementById('bkIn').value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^GB/, '');
      if (key.length !== 8) { renderBackup('⚠ Код выглядит так: GB-XXXX-XXXX'); return; }
      bkBusy = true; renderBackup('Проверяю код…');
      Online.req('GET', '/xfer/GB' + key, undefined, function (e, v) {
        if (e || !v || !v.d || !(v.exp > Date.now())) { bkBusy = false; renderBackup('⚠ Код не найден, уже использован или устарел'); return; }
        Online.req('DELETE', '/xfer/GB' + key, undefined, function () { // код одноразовый
          try {
            var o = JSON.parse(v.d), keepAcc = localStorage.getItem('gbAccounts');
            localStorage.clear(); for (var k in o) localStorage.setItem(k, o[k]);
            if (keepAcc) localStorage.setItem('gbAccounts', keepAcc);
            location.reload();
          } catch (e3) { bkBusy = false; renderBackup('⚠ Данные повреждены'); }
        });
      });
    }
  }
  $('#setBtn').addEventListener('click', function () { if (!safeTap()) return; Sound.init(); Sound.play('click'); openSettings(); });
  $('#topSet').addEventListener('click', function () { if (!safeTap()) return; Sound.init(); Sound.play('click'); openSettings(); });
  $('#langBtn').addEventListener('click', function () { if (!safeTap()) return; Sound.init(); Sound.play('click'); openSettings(); });
  sheet.addEventListener('click', function (e) {
    if (e.target === sheet) { closeSettings(); return; }
    var l = e.target.closest('[data-lang]'), s = e.target.closest('[data-set]');
    var fz = e.target.closest('[data-fps]'), qz = e.target.closest('[data-q]');
    var tz = e.target.closest('[data-track]'), pz = e.target.closest('[data-play]');
    var bz = e.target.closest('[data-buy]'), shz = e.target.closest('[data-shop]'), bk = e.target.closest('[data-bk]');
    Sound.init();
    if (bz) { buy(bz.getAttribute('data-buy')); return; }
    var bst = e.target.closest('[data-boost]'); if (bst) { buyBoost(+bst.getAttribute('data-boost')); return; }
    if (shz) { Sound.play('click'); renderShop(); return; }
    if (bk) { backupAct(bk.getAttribute('data-bk')); return; }
    var uz = e.target.closest('[data-upd]');
    if (uz && updInfo) {
      if (uz.getAttribute('data-upd') === 'copy') { var ta = document.createElement('textarea'); ta.value = updInfo.url; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e1) { } ta.remove(); try { navigator.clipboard.writeText(updInfo.url); } catch (e2) { } menuToast(t('bk.copied')); }
      else { store.set('updSkip', updInfo.code); sheet.classList.remove('show'); }
      return;
    }
    if (e.target.closest('#pnameIn')) return;
    if (pz) { Sound.play('click'); sheet.classList.remove('show', 'profile'); startGame(pz.getAttribute('data-play')); return; }
    if (tz) { Music.pick = +tz.getAttribute('data-track'); store.set('track', Music.pick); Music.preview(); renderSettings(); return; }
    if (fz) { Gfx.fps = +fz.getAttribute('data-fps'); store.set('fps', Gfx.fps); Gfx.lastDraw = 0; Sound.play('click'); renderSettings(); return; }
    var plz = e.target.closest('[data-player]');
    if (plz) { Sound.play('click'); openPlayer(plz.getAttribute('data-player')); return; }
    if (e.target.closest('[data-friends]')) { Sound.play('click'); openFriends(); return; }
    var faz = e.target.closest('[data-fadd]'); if (faz) { addFriend(faz.getAttribute('data-fadd')); return; }
    var fuz = e.target.closest('[data-funf]'); if (fuz) { removeFriend(fuz.getAttribute('data-funf')); return; }
    if (e.target.closest('[data-fbyid]')) { addFriend((document.getElementById('friendIn').value || '').trim()); return; }
    if (e.target.closest('[data-ovr]')) { Sound.play('click'); openOverall(); return; }
    var pcz = e.target.closest('[data-pcolor]');
    if (pcz) { saveStatus(); store.set('pColor', pcz.getAttribute('data-pcolor')); Sound.play('click'); renderProfile(); renderProfileChip(); return; }
    if (e.target.closest('[data-lbhide]')) { saveStatus(); store.set('lbHide', !store.get('lbHide', false)); Sound.play('click'); renderProfile(); return; }
    if (e.target.closest('[data-gift]')) { claimGift(); return; }
    if (e.target.closest('[data-rwd]') && window.GBAds) {
      window.GBAds.reward(function () { addCoins(50); fxConfetti(40); Sound.play('bonus'); api.toast('📺 +50 монет за просмотр'); renderShop(); renderProfileChip(); });
      return;
    }
    if (e.target.closest('[data-accs]')) { Sound.play('click'); openAccounts(); return; }
    var afz = e.target.closest('[data-accforget]'); if (afz) { forgetAcc(afz.getAttribute('data-accforget')); openAccounts(); return; }
    var asz = e.target.closest('[data-accsw]'); if (asz) { switchAcc(asz.getAttribute('data-accsw')); return; }
    if (e.target.closest('[data-accadd]')) { addAcc(); return; }
    if (e.target.closest('[data-accrm]')) { deleteMyAccount(); return; }
    if (e.target.closest('[data-promo]')) { saveStatus(); redeemPromo(); return; }
    if (e.target.closest('[data-copyid]')) { try { navigator.clipboard.writeText(Online.me || ''); } catch (e2) { } api.toast('ID скопирован'); return; }
    if (e.target.closest('[data-glogin]')) { Sound.play('click'); googleLogin(); return; }
    if (e.target.closest('[data-glogout]')) { Sound.play('click'); googleLogout(); return; }
    var lbz = e.target.closest('[data-lbd]');
    if (lbz) { openLb(App.id, +lbz.getAttribute('data-lbd')); return; }
    // data-skin стоит и на корне страницы: без проверки любой тап в окне считался выбором скина и открывал настройки
    var skz = e.target.closest('[data-skin]');
    if (skz && sheet.contains(skz)) { store.set('skin', skz.getAttribute('data-skin')); applySkin(); Sound.play('rotate'); renderSettings(); return; }
    if (qz) { Gfx.quality = +qz.getAttribute('data-q'); store.set('quality', Gfx.quality); sizeBg(); Sound.play('click'); renderSettings(); return; }
    if (l) { I18N.set(l.getAttribute('data-lang')); Sound.play('click'); renderSettings(); applyStaticTexts(); return; }
    if (!s) return;
    var k = s.getAttribute('data-set');
    if (k === 'sound') { Sound.on = !Sound.on; store.set('sound', Sound.on); }
    else if (k === 'music') { Music.on = !Music.on; store.set('music', Music.on); if (Music.on) Music.preview(); else Music.stop(); }
    else if (k === 'vibro') { vibroOn = !vibroOn; store.set('vibro', vibroOn); vibrate(40); }
    else if (k === 'showFps') { Gfx.showFps = !Gfx.showFps; store.set('showFps', Gfx.showFps); applyFpsMeter(); }
    else if (k === 'fx') { fxOn = !fxOn; store.set('fx', fxOn); if (fxOn) { App.W = App.W || innerWidth; menuToast('✨'); } }
    else if (k === 'reset') {
      if (!resetArmed) { resetArmed = 1; setTimeout(function () { resetArmed = 0; if (sheet.classList.contains('show')) renderSettings(); }, 2500); }
      else {
        ORDER.forEach(function (id) {
          for (var d = 0; d < 4; d++) { try { localStorage.removeItem('best_' + id + '_' + d); } catch (er) { } }
          try { localStorage.removeItem('medal_' + id); localStorage.removeItem('st_' + id); } catch (er) { }
        });
        store.set('xp', 0); store.set('streak', { n: 0, d: '', best: 0 }); store.set('daily', {});
        store.set('plays', 0); resetArmed = 0; vibrate(80);
        menuToast(t('set.resetDone'));
      }
    } else if (k === 'close') { Sound.play('click'); closeSettings(); return; }
    Sound.play('click');
    renderSettings();
  });
  function menuToast(txt) {
    var el = document.createElement('div');
    el.className = 'toast'; el.textContent = txt; el.style.position = 'fixed';
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 1600);
  }

  function resize() {
    var r = $('#stage').getBoundingClientRect();
    App.dpr = Math.min(window.devicePixelRatio || 1, QUAL_DPR[Gfx.quality]);
    App.W = Math.max(1, Math.floor(r.width));
    App.H = Math.max(1, Math.floor(r.height));
    cv.width = Math.floor(App.W * App.dpr);
    cv.height = Math.floor(App.H * App.dpr);
    fxSize();
  }

  function setHudTitle() {
    $('#gTitle').innerHTML = gt(App.id, 'title') + ' <span class="hd" style="background:' + DIFF_COL[App.diff] + '">' +
      (App.def.modes && App.mode === 1 ? '2P' : App.mode === 2 ? (Net.via === 'online' ? 'WEB' : 'LAN') : t('diff.short.' + App.diff)) + '</span>';
  }

  function startGame(id) {
    if (isLocked(id)) { askUnlock(id); return; }
    var d = GAMES[id];
    var rec = store.get('recent', []).filter(function (x) { return x !== id; });
    rec.unshift(id); store.set('recent', rec.slice(0, 6));
    App.id = id; App.def = d; App.diff = diffOf(id); App.mode = store.get('mode_' + id, 0); if (App.mode === 2 && !d.lan) App.mode = 0; App.net = null;
    $('#bestLbl').textContent = t('hud.best');
    var gs = $('#game');
    gs.style.setProperty('--c1', d.colors[0]);
    gs.style.setProperty('--c2', d.colors[1]);
    var lay = CONTROL_LAYOUTS[d.controls || 'none'];
    $('#controls').innerHTML = typeof lay === 'function' ? lay() : lay;
    $('#controls').className = 'controls ctl-' + (d.controls || 'none');
    show('game');
    stopBg();
    fxClear();
    resize();
    App.inst = d.create(api);
    newRound();
    loopStart();
  }

  function readyPanel() {
    var d = App.def, id = App.id;
    var seg = '';
    for (var i = 0; i < 4; i++) {
      seg += '<button class="dseg' + (i === App.diff ? ' on' : '') + '" data-diff="' + i + '" style="--dc:' + DIFF_COL[i] + '">' +
        '<span class="dots">' + '●●●●'.slice(0, i + 1) + '</span>' + t('diff.' + i) + '</button>';
    }
    var dly = dailyInfo(), st = gstat(id), mm = medal(id), th = medalsOf(id), single = !(d.modes && App.mode >= 1);
    var ladder = '';
    for (var mi = 0; mi < 3; mi++) ladder += '<span class="mstep' + (mm > mi ? ' on' : '') + '">' + MEDAL_IC[mi + 1] + '<b>' + th[mi] + '</b></span>';
    panelHtml('<button class="favb lbb" data-act="lb" aria-label="top" style="right:58px">🏆</button><button class="favb' + (isFav(id) ? ' on' : '') + '" data-act="fav" aria-label="fav">❤</button>' +
      '<div class="pic">' + ico(d.icon) + '</div><h3>' + gt(id, 'title') + '</h3><p>' + gt(id, 'hint') + '</p>' +
      (I18N.has(id + '.new') ? '<div class="newf">✨ ' + t(id + '.new') + '</div>' : '') +
      (dly.id === id && !dly.done && single ? '<div class="dmark">📅 ' + t('daily.goal', dly.target, gt(id, 'title')) + ' · +' + dly.xp + ' XP</div>' : '') +
      (single ? '<div class="ladder">' + ladder + '</div>' : '') +
      (st.p ? '<div class="gstat">' + t('stat.plays', st.p) + ' · ' + fmtTime(st.t) + '</div>' : '') + sparkHtml(id) +
      '<div class="dlabel">' + t('diff.label') + '</div><div class="diffs">' + seg + '</div>' +
      '<div class="ddesc" style="color:' + DIFF_COL[App.diff] + '">' + gt(id, 'd' + App.diff) +
      ' · ' + I_TROPHY + ' ' + best(id, App.diff) + '</div>' +
      (d.modes ? '<div class="dlabel">' + t('g.mode') + '</div><div class="modes">' +
        '<button class="mseg' + (App.mode === 0 ? ' on' : '') + '" data-mode="0">🤖 ' + t('g.vsCpu') + '</button>' +
        '<button class="mseg' + (App.mode === 1 ? ' on' : '') + '" data-mode="1">👥 ' + t('g.vs2p') + '</button>' +
        (d.lan ? '<button class="mseg' + (App.mode === 2 ? ' on' : '') + '" data-mode="2">🌐 ' + t('on.mode') + '</button>' : '') + '</div>' : '') +
      (App.mode === 2 && d.lan ? lobbyHtml() : '<button class="btn" data-act="play">' + I_PLAY + t('btn.play') + '</button>'));
    if (App.mode === 2 && d.lan) startLobby();
  }

  function sparkHtml(id) {
    var hs = store.get('hist_' + id, []);
    if (hs.length < 2) return '';
    var mx = Math.max.apply(null, hs), mn = Math.min.apply(null, hs), w = 120, h = 28, pts = hs.map(function (v, i) {
      return (i / (hs.length - 1) * w).toFixed(1) + ',' + (h - 3 - (mx === mn ? 0.5 : (v - mn) / (mx - mn)) * (h - 6)).toFixed(1);
    }).join(' ');
    var last = pts.split(' ').pop().split(',');
    return '<div class="spark"><span>' + t('hist.last') + '</span><svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
      '<polyline points="' + pts + '" fill="none" stroke="#a5b4fc" stroke-width="2" stroke-linejoin="round"/><circle cx="' + last[0] + '" cy="' + last[1] + '" r="3" fill="#fde047"/></svg><b>' + hs[hs.length - 1] + '</b></div>';
  }
  // лобби локальной сети
  function lobbyHtml() {
    var tabs = '<div class="ltabs"><button class="lt' + (Net.via !== 'online' ? ' on' : '') + '" data-via="lan">📶 Wi-Fi</button>' +
      '<button class="lt' + (Net.via === 'online' ? ' on' : '') + '" data-via="online">🌍 ' + t('on.tab') + '</button></div>';
    if (!Net.available()) return '<div class="lobby" id="lobby">' + tabs + '<p>' + t('net.na') + '</p></div>';
    if (Net.via === 'online') return onlineLobbyHtml(tabs);
    var h = '<div class="lobby" id="lobby">' + tabs;
    if (Net.state === 'hosting') {
      h += '<div class="lwait"><span class="spin"></span>' + t('net.waiting') + '</div>' +
        '<div class="lip">' + t('net.yourIp') + ': <b>' + (Net.myIp || '…') + '</b></div>' +
        '<button class="btn sec" data-act="netCancel">' + t('net.cancel') + '</button>';
    } else if (Net.state === 'joining') {
      h += '<div class="lwait"><span class="spin"></span>' + t('net.connecting') + '</div>' +
        '<button class="btn sec" data-act="netCancel">' + t('net.cancel') + '</button>';
    } else {
      h += '<p class="lhint">' + t('net.hint') + '</p>' +
        '<button class="btn" data-act="netHost">📡 ' + t('net.create') + '</button>' +
        '<div class="dlabel">' + t('net.found') + '</div><div class="lfound">';
      var keys = Object.keys(Net.found);
      if (!keys.length) h += '<div class="lnone"><span class="spin"></span>' + t('net.searching') + '</div>';
      keys.forEach(function (k) {
        var f = Net.found[k];
        h += '<button class="lgame" data-join="' + k + '">🎮 ' + escapeHtml(f.name) + ' <small>' + (Net.kind === 'android' ? f.ip : '') + '</small></button>';
      });
      h += '</div>' + (Net.kind === 'android' ? '<div class="lmanual"><input id="ipIn" placeholder="192.168.0.10" inputmode="decimal"><button class="pill" data-act="netIp">' + t('net.join') + '</button></div>' : '');
    }
    return h + '</div>';
  }
  function onlineLobbyHtml(tabs) {
    var h = '<div class="lobby" id="lobby">' + tabs;
    if (Net.state === 'hosting') {
      h += '<div class="lwait"><span class="spin"></span>' + t('on.waiting') + '</div>' +
        (Net.myIp ? '<div class="lcodebox"><small>' + t('on.codeIs') + '</small><b class="lcode">' + Net.myIp + '</b><small>' + t('on.tell') + '</small></div>' : '') +
        '<button class="btn sec" data-act="netCancel">' + t('net.cancel') + '</button>';
    } else if (Net.state === 'joining') {
      h += '<div class="lwait"><span class="spin"></span>' + t('on.joining') + '</div>' +
        '<button class="btn sec" data-act="netCancel">' + t('net.cancel') + '</button>';
    } else {
      h += (Net.lastErr ? '<p class="lerr">⚠ ' + escapeHtml(Net.lastErr) + '</p>' : '<p class="lhint">' + t('on.hint') + '</p>') +
        '<button class="btn" data-act="onQuick">⚡ ' + t('on.quick') + '</button>' +
        '<button class="btn sec" data-act="onCreate">🔒 ' + t('on.create') + '</button>' +
        '<div class="lmanual"><input id="codeIn" maxlength="4" placeholder="' + t('on.codePh') + '" autocapitalize="characters" autocomplete="off" spellcheck="false"><button class="pill" data-act="onCode">' + t('net.join') + '</button></div>' +
        '<div class="dlabel">' + t('on.open') + '</div><div class="lfound">';
      var keys = Object.keys(Net.found);
      if (Net.offline) h += '<div class="lnone">⚠ ' + t('on.offline') + '</div>';
      else if (!keys.length) h += '<div class="lnone"><span class="spin"></span>' + t('on.none') + '</div>';
      keys.forEach(function (k) { h += '<button class="lgame" data-join="' + k + '">🎮 ' + escapeHtml(Net.found[k].name) + ' <small>' + k + '</small></button>'; });
      h += '</div>';
    }
    return h + '</div>';
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function refreshLobby() {
    var el = document.getElementById('lobby');
    if (!el || App.state !== 'ready' || App.mode !== 2) return;
    var ae = document.activeElement, fid = ae && (ae.id === 'ipIn' || ae.id === 'codeIn') ? ae.id : null, val = fid ? ae.value : null;
    el.outerHTML = lobbyHtml();
    if (fid) { var inp = document.getElementById(fid); if (inp) { inp.value = val; inp.focus(); } }
  }
  function startLobby() {
    if (!Net.available()) return;
    Net.onEvent = netEvent;
    Net.lastErr = '';
    if (Net.state === 'idle') Net.discover(App.id);
  }
  function netEvent(ev) {
    if (ev.type === 'found' || ev.type === 'hosting' || ev.type === 'error') {
      if (ev.type === 'error') { if (Net.via !== 'online') api.toast(t(ev.msg || 'net.error')); Net.lastErr = t(ev.msg || 'net.error'); if (Net.via === 'online' && Net.state === 'idle') Net.discover(App.id); }
      refreshLobby(); return;
    }
    if (ev.type === 'connected') {
      vibrate(60); Sound.play('bonus');
      App.net = { host: Net.host, side: Net.host ? 0 : 1, online: Net.via === 'online', send: function (o) { Net.send({ t: 'g', d: o }); }, sendFast: function (o) { Net.sendFast({ t: 'g', d: o }); } };
      if (Net.host) {
        var seed = Math.floor(Math.random() * 1e9);
        Net.send({ t: 'hello', game: App.id, diff: App.diff, seed: seed, v: 1 });
        netStart(seed);
      }
      return;
    }
    if (ev.type === 'msg') {
      var m = ev.obj;
      if (m.t === 'hello' && !Net.host) {
        if (m.game !== App.id) { api.toast(t('net.error')); Net.stopAll(); return; }
        App.diff = m.diff; netStart(m.seed);
      } else if (m.t === 'g') { if (App.inst && App.inst.netMsg) App.inst.netMsg(m.d); }
      else if (m.t === 'restart') { if (App.state !== 'ready') netStart(m.seed, true); }
      else if (m.t === 'bye') netLost();
      return;
    }
    if (ev.type === 'closed') netLost();
  }
  function netStart(seed) {
    App.net.seed = seed;
    newRound(); play();
  }
  function netLost() {
    if (App.mode !== 2 || !App.net) return;
    App.net = null; Net.state = 'idle';
    if (App.state === 'playing' || App.state === 'over' || App.state === 'paused') {
      App.state = 'over'; clearKeys();
      panelHtml('<h3>' + t('net.lost') + '</h3><p>' + t('net.lostHint') + '</p>' +
        '<button class="btn sec" data-act="menu">' + I_MENU + t('btn.menu') + '</button>');
    } else { if (Net.via === 'online') Net.discover(App.id); refreshLobby(); }
  }

  function newRound() {
    flushTime();
    App.score = 0; scoreEl.textContent = '0'; App.runT = 0;
    App.best = best(App.id, App.diff); App.beat = false; App.medal0 = medal(App.id);
    bestEl.textContent = App.best;
    bestEl.parentNode.classList.remove('beat');
    setHudTitle();
    App.inst.reset();
    App.state = 'ready';
    readyPanel();
  }

  // время в игре копится в App.ptime и сбрасывается в статистику игры
  function flushTime() {
    if (!App.id || !App.ptime) return;
    var st = gstat(App.id); st.t = Math.round(st.t + App.ptime); store.set('st_' + App.id, st); App.ptime = 0;
  }
  var cdTimer = 0;
  function countdown(fn) {
    var el = $('#cd'), n = 3;
    App.state = 'countdown'; hidePanel(); clearKeys();
    (function tick() {
      if (App.state !== 'countdown') { el.className = 'cd'; return; }
      if (n === 0) { el.className = 'cd'; fn(); return; }
      el.textContent = n; el.className = 'cd'; void el.offsetWidth; el.className = 'cd show';
      Sound.tone(n === 1 ? 880 : 620, 0.1, 'square', 0.05);
      n--; cdTimer = setTimeout(tick, 650);
    })();
  }
  function play() {
    if (App.state === 'paused' && REALTIME.indexOf(App.id) >= 0 && fxOn) { countdown(startPlay); return; }
    startPlay();
  }
  function startPlay() {
    Sound.init();
    if (App.state === 'ready') {
      store.set('plays', store.get('plays', 0) + 1);
      var st = gstat(App.id); st.p++; store.set('st_' + App.id, st);
      var ds = dayStat(); ds.plays++; if (ds.games.indexOf(App.id) < 0) ds.games.push(App.id); store.set('dayStat', ds);
      if (App.diff === 3) setFlag('insane');
      var hr = new Date().getHours(); if (hr >= 0 && hr < 5) setFlag('owl');
    }
    App.state = 'playing';
    hidePanel();
    clearKeys();
    Music.choose(App.id);
    Music.start();
    if (App.inst.begin) App.inst.begin();
  }

  function pause() {
    if (App.state === 'countdown') { clearTimeout(cdTimer); $('#cd').className = 'cd'; App.state = 'playing'; }
    if (App.state !== 'playing') return;
    if (App.mode === 2 && App.net) { // по сети игра не останавливается
      panelHtml('<h3>' + t('net.lan') + '</h3><p>' + t('net.leaveQ') + '</p>' +
        '<button class="btn" data-act="hide">' + I_PLAY + t('btn.resume') + '</button>' +
        '<button class="btn sec" data-act="menu">' + I_MENU + t('btn.menu') + '</button>');
      return;
    }
    App.state = 'paused';
    clearKeys();
    Music.stop();
    panelHtml('<h3>' + t('pause.title') + '</h3><p>' + t('pause.score') + ': <b>' + App.score + '</b> · ' +
      '<span style="color:' + DIFF_COL[App.diff] + '">' + t('diff.' + App.diff) + '</span></p>' +
      qsetHtml() +
      '<button class="btn" data-act="resume">' + I_PLAY + t('btn.resume') + '</button>' +
      '<button class="btn sec" data-act="restart">' + I_AGAIN + t('btn.restart') + '</button>' +
      '<button class="btn sec" data-act="menu">' + I_MENU + t('btn.menu') + '</button>');
  }

  function qsetHtml() {
    return '<div class="qset"><button data-qt="sound" class="' + (Sound.on ? '' : 'off') + '">🔊</button><button data-qt="music" class="' + (Music.on ? '' : 'off') + '">🎵</button>' +
      '<button data-qt="vibro" class="' + (vibroOn ? '' : 'off') + '">📳</button><button data-qt="fx" class="' + (fxOn ? '' : 'off') + '">✨</button></div>';
  }
  function saveBest() {
    if (App.def.modes && App.mode >= 1) return false; // в игре вдвоём и по сети рекорды не пишем
    var b = best(App.id, App.diff);
    var m = medalFor(App.id, App.score);
    if (m > medal(App.id)) { store.set('medal_' + App.id, m); submitOverall(); }
    if (App.score > 0) { var hs = store.get('hist_' + App.id, []); hs.push(App.score); store.set('hist_' + App.id, hs.slice(-12)); }
    if (App.score > b) { store.set('best_' + App.id + '_' + App.diff, App.score); try { Online.submit(App.id, App.diff, App.score); } catch (e) { } if (b > 0) store.set('recs', store.get('recs', 0) + 1); return true; }
    return false;
  }
  // опыт за партию, медали, задание дня, серия дней
  var MEDAL_XP = [0, 20, 45, 90];
  function progress(rec, prevBest) {
    var id = App.id, sc = App.score, single = !(App.def.modes && App.mode >= 1);
    var r = { xp: 0, m0: App.medal0, m1: medal(id), daily: false, single: single };
    var played = App.runT || 0;
    if (sc > 0 || played > 8) r.xp = single ? 5 + App.diff * 3 + Math.min(30, Math.floor(played / 8)) : 10 + Math.min(20, Math.floor(played / 10));
    if (single && r.m1 > r.m0) r.xp += MEDAL_XP[r.m1] - MEDAL_XP[r.m0];
    if (single && rec && prevBest > 0 && sc > 0) r.xp += 15;
    var D = dailyInfo();
    if (single && D.id === id && !D.done && sc >= D.target) {
      r.daily = true; r.xp += D.xp;
      store.set('daily', { date: D.key, done: true });
      var sk = store.get('streak', { n: 0, d: '', best: 0 });
      sk.n = sk.d === today(-1) ? sk.n + 1 : 1; sk.d = D.key; sk.best = Math.max(sk.best || 0, sk.n);
      store.set('streak', sk);
    }
    if (r.daily) { store.set('dailyN', store.get('dailyN', 0) + 1); r.coins = 60; } else r.coins = 0;
    // задания дня 2 и 3
    var ds = dayStat(), tk = dailyTasks();
    r.tasks = [];
    [tk[1], tk[2]].forEach(function (q) { if (q.done && !ds.claimed[q.k]) { ds.claimed[q.k] = 1; r.xp += q.xp; r.coins += q.coins; r.tasks.push(q.k); } });
    store.set('dayStat', ds);
    if (dailyTasks().every(function (q) { return q.done; })) setFlag('tasks');
    if (single && ['chess', 'checkers', 'reversi', 'connect4', 'nardy'].indexOf(id) >= 0 && App.diff >= 2 && sc >= 1000) setFlag('brain');
    r.coins += Math.round(r.xp / 2);
    if (boostLeft() > 0) r.coins *= 2; // бустер «×2 монеты» из магазина
    if (evMul > 1) r.coins = Math.round(r.coins * evMul); // событие из админки
    addCoins(r.coins);
    var xp0 = store.get('xp', 0);
    r.L0 = lvlInfo(xp0); r.L1 = lvlInfo(xp0 + r.xp);
    store.set('xp', xp0 + r.xp);
    setTimeout(checkAch, 1500);
    return r;
  }

  function endGame() {
    App.state = 'over';
    clearKeys();
    Music.stop();
    // реклама Яндекса после партии (только в сборке для Яндекс Игр; не чаще раза в минуту — см. tools/yandex/yandex.js)
    if (window.GBAds && !noAds) setTimeout(function () { window.GBAds.inter(); }, 800);
    flushTime();
    var b = best(App.id, App.diff), rec = saveBest(), P = progress(rec, b);
    Sound.play(rec && App.score > 0 ? 'win' : 'over');
    vibrate(rec ? 120 : 60);
    if (rec && App.score > 0) fxConfetti(110); else { fxFlash('#ef4444', 0.22); fxShake(5); }
    setTimeout(function () {
      if (App.state !== 'over') return;
      var sc = App.score, stars = b <= 0 ? (sc > 0 ? 3 : 0) : Math.min(3, Math.floor(sc / b * 3 + 0.0001));
      if (rec && sc > 0) stars = 3;
      var st = '';
      for (var i = 0; i < 3; i++) st += '<span class="star' + (i < stars ? ' on' : '') + '" style="animation-delay:' + (0.25 + i * 0.15) + 's">★</span>';
      panelHtml('<h3>' + t('over.title') + '</h3><div class="stars">' + st + '</div>' +
        '<div class="sub">' + t('over.score') + ' · <span style="color:' + DIFF_COL[App.diff] + '">' + t('diff.' + App.diff) + '</span></div>' +
        '<div class="big" id="bigScore">0</div>' +
        (rec && sc > 0 ? '<div class="record">' + t('over.new') + '</div>' : '<div class="sub">' + t('over.best', Math.max(b, sc)) + '</div>') +
        progressHtml(P) +
        '<button class="btn" data-act="restart">' + I_AGAIN + t('btn.again') + '</button>' +
        '<button class="btn sec" data-act="menu">' + I_MENU + t('btn.menu') + '</button>');
      if (P.L1.n > P.L0.n) { setTimeout(function () { api.toast(t('toast.lvlup', P.L1.n)); fxConfetti(80); Sound.play('life'); }, 900); }
      else if (P.m1 > P.m0 && P.single) setTimeout(function () { api.toast(t('medal.got', MEDAL_IC[P.m1] + ' ' + t('medal.' + P.m1))); Sound.play('bonus'); }, 900);
      if (P.daily) setTimeout(function () { menuToast(t('daily.ok')); }, 1900);
      var bar = $('#xpBar');
      if (bar) setTimeout(function () { bar.style.width = (P.L1.n > P.L0.n ? 100 : Math.round(P.L1.cur / P.L1.need * 100)) + '%'; }, 80);
      var t0 = performance.now(), el = $('#bigScore');
      (function tick(now) {
        if (!el.isConnected) return;
        var k = Math.min(1, (now - t0) / 700);
        el.textContent = Math.round(sc * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    }, 450);
  }

  function progressHtml(P) {
    var h = '<div class="prog">';
    if (P.single) {
      var th = medalsOf(App.id), row = '';
      for (var i = 0; i < 3; i++) row += '<span class="mstep' + (P.m1 > i ? ' on' : '') + (P.m1 > i && P.m0 <= i ? ' new' : '') + '">' + MEDAL_IC[i + 1] + '<b>' + th[i] + '</b></span>';
      h += '<div class="ladder">' + row + '</div>';
      if (P.m1 < 3) h += '<div class="mnext">' + t('medal.next', t('medal.' + (P.m1 + 1)), Math.max(0, th[P.m1] - App.score)) + '</div>';
    }
    if (P.daily) h += '<div class="dmark">📅 ' + t('daily.ok') + '</div>';
    var w0 = Math.round(P.L0.cur / P.L0.need * 100);
    if (P.tasks && P.tasks.length) h += '<div class="dmark">✅ ' + P.tasks.map(function (k) { return t('task.' + k + 's'); }).join(' · ') + '</div>';
    h += '<div class="xpl"><b class="xg">+' + P.xp + ' XP · +' + P.coins + ' <span class="coin" style="width:14px;height:14px;vertical-align:-2px"></span></b><span class="bar"><i id="xpBar" style="width:' + w0 + '%"></i></span><b>' + t('lvl.short') + ' ' + P.L1.n + '</b></div>';
    return h + '</div>';
  }

  function toMenu() {
    clearTimeout(cdTimer); $('#cd').className = 'cd';
    if (App.state === 'playing' || App.state === 'paused' || App.state === 'countdown') saveBest();
    flushTime();
    fxClear();
    if (Net.state !== 'idle') Net.stopAll(); else Online.stop();
    App.net = null; Net.onEvent = null;
    Music.stop();
    App.state = 'menu';
    cancelAnimationFrame(App.raf); App.raf = 0;
    if (App.inst && App.inst.destroy) App.inst.destroy();
    App.inst = null;
    hidePanel();
    show('menu');
    renderMenu();
    startBg();
  }

  function panelHtml(h) { panel.innerHTML = h; overlay.classList.add('show'); }
  function hidePanel() { overlay.classList.remove('show'); }

  panel.addEventListener('click', function (e) {
    var qt = e.target.closest('[data-qt]');
    if (qt) {
      var k = qt.getAttribute('data-qt');
      if (k === 'sound') { Sound.on = !Sound.on; store.set('sound', Sound.on); }
      else if (k === 'music') { Music.on = !Music.on; store.set('music', Music.on); }
      else if (k === 'vibro') { vibroOn = !vibroOn; store.set('vibro', vibroOn); vibrate(30); }
      else { fxOn = !fxOn; store.set('fx', fxOn); }
      qt.classList.toggle('off'); Sound.init(); Sound.play('click');
      return;
    }
    var mz = e.target.closest('[data-mode]');
    if (mz) {
      var nm = +mz.getAttribute('data-mode');
      if (nm !== App.mode) {
        if (App.mode === 2) Net.stopAll();
        App.mode = nm; store.set('mode_' + App.id, nm); Sound.init(); Sound.play('rotate'); newRound();
      }
      return;
    }
    var dz = e.target.closest('[data-diff]');
    if (dz) {
      var nd = +dz.getAttribute('data-diff');
      if (nd !== App.diff) {
        App.diff = nd; store.set('diff_' + App.id, nd);
        Sound.init(); Sound.play('rotate'); vibrate(10);
        newRound();
      }
      return;
    }
    var vz = e.target.closest('[data-via]');
    if (vz) {
      var nv = vz.getAttribute('data-via');
      if (nv !== Net.via) { Net.stopAll(); Net.via = nv; store.set('netVia', nv); Net.offline = false; Sound.play('rotate'); Net.discover(App.id); refreshLobby(); }
      return;
    }
    var jz = e.target.closest('[data-join]');
    if (jz) { var f = Net.found[jz.getAttribute('data-join')]; if (f) { Net.join(f.ip, f.port); refreshLobby(); Sound.play('click'); } return; }
    var b = e.target.closest('[data-act]');
    if (!b) return;
    Sound.init(); Sound.play('click');
    var a = b.getAttribute('data-act');
    if (a === 'fav') {
      var fl = favs(), ix = fl.indexOf(App.id);
      if (ix >= 0) fl.splice(ix, 1); else fl.unshift(App.id);
      store.set('favs', fl); b.classList.toggle('on', ix < 0); checkAch();
      api.toast(t(ix < 0 ? 'fav.add' : 'fav.del'));
      return;
    }
    if (a === 'play' || a === 'resume') play();
    else if (a === 'restart') {
      if (App.mode === 2 && App.net) { var sd = Math.floor(Math.random() * 1e9); Net.send({ t: 'restart', seed: sd }); netStart(sd); }
      else { newRound(); play(); }
    }
    else if (a === 'lb') openLb(App.id, App.diff);
    else if (a === 'menu') toMenu();
    else if (a === 'hide') hidePanel();
    else if (a === 'netHost') { Net.startHost(App.id); refreshLobby(); }
    else if (a === 'netCancel') { Net.stopAll(); Net.discover(App.id); refreshLobby(); }
    else if (a === 'onQuick') { Net.lastErr = ''; Net.stopAll(); Online.quick(App.id); refreshLobby(); }
    else if (a === 'onCreate') { Net.lastErr = ''; Net.startHost(App.id, false); refreshLobby(); }
    else if (a === 'onCode') { Net.lastErr = '';
      var cv = ((document.getElementById('codeIn') || {}).value || '').trim();
      if (cv.length !== 4) { api.toast(t('on.notFound')); return; }
      Net.stopAll(); Net.game = App.id; Net.join(cv); refreshLobby();
    }
    else if (a === 'netIp') {
      var v = (document.getElementById('ipIn') || {}).value || '';
      var mm = v.trim().match(/^(\d+\.\d+\.\d+\.\d+)(?::(\d+))?$/);
      if (!mm) { api.toast(t('net.badIp')); return; }
      Net.join(mm[1], mm[2] ? +mm[2] : 47800); refreshLobby();
    }
  });
  $('#backBtn').addEventListener('click', function () { Sound.play('click'); toMenu(); });
  $('#pauseBtn').addEventListener('click', function () {
    Sound.play('click');
    if (App.state === 'playing') pause(); else if (App.state === 'paused') play();
  });

  /* ---------- игровой цикл ---------- */
  function loopStart() {
    cancelAnimationFrame(App.raf);
    App.last = 0; Gfx.lastDraw = 0;
    App.raf = requestAnimationFrame(frame);
  }
  function frame(t) {
    App.raf = requestAnimationFrame(frame);
    if (!frameDue(t)) return;
    var dt = App.last ? Math.min(0.05, (t - App.last) / 1000) : 0;
    App.last = t;
    if (dt) countFps(dt);
    var inst = App.inst;
    if (!inst) return;
    if (App.state === 'playing') { inst.update(dt); App.runT += dt; App.ptime = (App.ptime || 0) + dt; }
    else if (App.state === 'ready' && inst.idle) inst.idle(dt);
    ctx.setTransform(App.dpr, 0, 0, App.dpr, 0, 0);
    inst.draw(ctx);
    fxUpdate(dt);
  }

  window.addEventListener('resize', function () {
    if (App.state === 'menu') { sizeBg(); return; }
    resize();
    if (App.inst && App.inst.resize) App.inst.resize();
  });

  /* ---------- ввод ---------- */
  var touch = null;
  function canvasDown(x, y, tr) {
    touch = { x: x, y: y, t: Date.now() };
    // trusted: нажатие от человека, а не программы (нужно кликеру для защиты от автокликеров)
    if (App.state === 'playing' && App.inst.input) App.inst.input('down', { x: x, y: y, trusted: tr !== false });
  }
  function canvasUp(x, y) {
    if (!touch) return;
    var dx = x - touch.x, dy = y - touch.y, dist = Math.sqrt(dx * dx + dy * dy);
    var dtm = Date.now() - touch.t;
    touch = null;
    if (App.state !== 'playing' || !App.inst.input) return;
    if (dist < 18 && dtm < 350) App.inst.input('tap', { x: x, y: y });
    else if (dist >= 24) {
      var dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      App.inst.input('swipe', { dir: dir, dx: dx, dy: dy });
    }
  }
  function canvasMove(x, y) {
    if (!touch || App.state !== 'playing' || !App.inst.input) return;
    App.inst.input('move', { x: x, y: y });
    if (touch.locked) return;
    var dx = x - touch.x, dy = y - touch.y;
    if (App.def.liveSwipe && Math.sqrt(dx * dx + dy * dy) >= (App.def.swipeDist || 30)) {
      var dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      App.inst.input('swipe', { dir: dir, dx: dx, dy: dy });
      touch = { x: x, y: y, t: Date.now(), moved: true, locked: App.def.liveSwipe === 'once' };
    }
  }
  function local(e) {
    var r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function multi(e, start) {
    if (!App.def || !App.def.multiTouch || App.state !== 'playing' || !App.inst.input) return;
    if (start) for (var j = 0; j < e.changedTouches.length; j++) App.inst.input('press', local(e.changedTouches[j]));
    var list = [];
    for (var i = 0; i < e.touches.length; i++) list.push(local(e.touches[i]));
    App.inst.input('multi', list);
  }
  cv.addEventListener('touchstart', function (e) {
    e.preventDefault(); Sound.init(); multi(e, true);
    var p = local(e.changedTouches[0]); canvasDown(p.x, p.y, e.isTrusted);
  }, { passive: false });
  cv.addEventListener('touchmove', function (e) {
    e.preventDefault(); multi(e);
    var p = local(e.changedTouches[0]); canvasMove(p.x, p.y);
  }, { passive: false });
  cv.addEventListener('touchend', function (e) {
    e.preventDefault(); multi(e);
    var p = local(e.changedTouches[0]);
    if (touch && touch.moved) { touch = null; if (App.state === 'playing' && App.inst.input) App.inst.input('up', p); return; }
    if (App.state === 'playing' && App.inst.input) App.inst.input('up', p);
    canvasUp(p.x, p.y);
  }, { passive: false });
  cv.addEventListener('mousedown', function (e) {
    Sound.init(); var p = local(e); canvasDown(p.x, p.y, e.isTrusted);
    if (App.def && App.def.multiTouch && App.state === 'playing') App.inst.input('press', p);
  });
  cv.addEventListener('mousemove', function (e) {
    if (touch) { var p = local(e); canvasMove(p.x, p.y); if (App.def && App.def.multiTouch && App.state === 'playing') App.inst.input('multi', [p]); }
  });
  cv.addEventListener('mouseup', function (e) {
    var p = local(e);
    if (App.state === 'playing' && App.inst.input) App.inst.input('up', p);
    if (touch && touch.moved) { touch = null; return; }
    canvasUp(p.x, p.y);
  });

  /* экранные кнопки: поддержка мультитача и скольжения пальцем между кнопками */
  var ctrl = $('#controls');
  var held = {};      // pointerId -> key
  var keyCount = {};  // key -> число пальцев/клавиш
  function press(k, down) {
    var before = keyCount[k] || 0;
    keyCount[k] = Math.max(0, before + (down ? 1 : -1));
    var now = keyCount[k];
    var btn = ctrl.querySelector('[data-k="' + k + '"]');
    if (btn) btn.classList.toggle('on', now > 0);
    if (App.state !== 'playing' || !App.inst || !App.inst.key) return;
    if (before === 0 && now > 0) App.inst.key(k, true);
    else if (before > 0 && now === 0) App.inst.key(k, false);
  }
  function clearKeys() {
    for (var k in keyCount) {
      if (keyCount[k] > 0 && App.inst && App.inst.key) App.inst.key(k, false);
      keyCount[k] = 0;
    }
    held = {};
    var on = ctrl.querySelectorAll('.on');
    for (var i = 0; i < on.length; i++) on[i].classList.remove('on');
  }
  function keyAt(x, y) {
    var el = document.elementFromPoint(x, y);
    var b = el && el.closest ? el.closest('[data-k]') : null;
    return b && ctrl.contains(b) ? b.getAttribute('data-k') : null;
  }
  function ptrDown(id, x, y) {
    var k = keyAt(x, y);
    if (!k) return;
    Sound.init();
    held[id] = k; press(k, true);
    vibrate(8);
  }
  function ptrMove(id, x, y) {
    if (!(id in held)) return;
    var k = keyAt(x, y);
    if (k && k !== held[id]) {
      press(held[id], false); held[id] = k; press(k, true); vibrate(8);
    }
  }
  function ptrUp(id) {
    if (!(id in held)) return;
    press(held[id], false); delete held[id];
  }
  ctrl.addEventListener('touchstart', function (e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i]; ptrDown('t' + t.identifier, t.clientX, t.clientY);
    }
  }, { passive: false });
  ctrl.addEventListener('touchmove', function (e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i]; ptrMove('t' + t.identifier, t.clientX, t.clientY);
    }
  }, { passive: false });
  function touchEnd(e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) ptrUp('t' + e.changedTouches[i].identifier);
  }
  ctrl.addEventListener('touchend', touchEnd, { passive: false });
  ctrl.addEventListener('touchcancel', touchEnd, { passive: false });
  ctrl.addEventListener('mousedown', function (e) { ptrDown('m', e.clientX, e.clientY); });
  window.addEventListener('mouseup', function () { ptrUp('m'); });

  /* клавиатура (для отладки на ПК) */
  var KEYMAP = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    a: 'left', d: 'right', w: 'up', s: 'down', ' ': 'a', z: 'a', x: 'b', Enter: 'b'
  };
  var kbd = {};
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'p') {
      if (App.state === 'playing') pause(); else if (App.state === 'paused') play();
      return;
    }
    var k = KEYMAP[e.key];
    if (!k || App.state === 'menu') return;
    e.preventDefault();
    if (App.state === 'ready' && (k === 'a' || e.key === ' ')) { play(); return; }
    if (kbd[e.key]) return;
    kbd[e.key] = true;
    if (App.def.keyAsTap && App.state === 'playing' && App.inst.input) App.inst.input('down', {});
    press(k, true);
  });
  window.addEventListener('keyup', function (e) {
    var k = KEYMAP[e.key];
    if (!k || !kbd[e.key]) return;
    kbd[e.key] = false;
    press(k, false);
  });

  /* ---------- системные события Android ---------- */
  window.onAppPause = function () { if (App.mode !== 2) pause(); Music.stop(); };
  window.onBackButton = function () {
    if (sheet.classList.contains('show')) { closeSettings(); return true; }
    if (App.state === 'menu') return false;
    if (App.state === 'playing') pause();
    else toMenu();
    return true;
  };
  document.addEventListener('visibilitychange', function () { if (document.hidden && App.mode !== 2) pause(); });

  /* ---------- фон меню ---------- */
  var bg = $('#bg'), bctx = bg.getContext('2d'), bgRaf = 0, stars = [], blobs = [];
  function sizeBg() {
    var d = 1; // фон размытый — ретина ему не нужна, а нагрузку на GPU снижает в разы
    bg.width = innerWidth * d; bg.height = innerHeight * d;
    bctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function initBg() {
    sizeBg();
    stars = [];
    for (var i = 0; i < 60; i++) stars.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + 0.3, s: Math.random() * 0.02 + 0.004, p: Math.random() * 6 });
    blobs = [
      { c: 'rgba(124,92,255,', x: 0.2, y: 0.25, r: 0.55, p: 0 },
      { c: 'rgba(255,94,168,', x: 0.85, y: 0.6, r: 0.5, p: 2 },
      { c: 'rgba(56,189,248,', x: 0.3, y: 0.95, r: 0.45, p: 4 }
    ];
    var TB = themeOf(); blobs.forEach(function (bb, i) { bb.c = 'rgba(' + TB.blobs[i] + ','; });
  }
  var bgLast = 0;
  function drawBg(t) {
    bgRaf = requestAnimationFrame(drawBg);
    if (document.hidden || t - bgLast < 40) return; // ~24 кадра/с хватает для медленного фона
    bgLast = t;
    var w = innerWidth, h = innerHeight, s = t / 1000;
    bctx.fillStyle = themeOf().bg; bctx.fillRect(0, 0, w, h);
    blobs.forEach(function (b) {
      var x = (b.x + Math.sin(s * 0.3 + b.p) * 0.08) * w, y = (b.y + Math.cos(s * 0.25 + b.p) * 0.06) * h, r = b.r * Math.max(w, h);
      var g = bctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, b.c + '0.35)'); g.addColorStop(1, b.c + '0)');
      bctx.fillStyle = g; bctx.fillRect(0, 0, w, h);
    });
    stars.forEach(function (st) {
      st.y -= st.s * 0.05; if (st.y < 0) { st.y = 1; st.x = Math.random(); }
      bctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(s + st.p));
      bctx.fillStyle = '#fff';
      bctx.beginPath(); bctx.arc(st.x * w, st.y * h, st.r, 0, 6.283); bctx.fill();
    });
    bctx.globalAlpha = 1;
  }
  function startBg() { // анимированный фон с пятнами — только у стиля «Стекло»
    cancelAnimationFrame(bgRaf); bgRaf = 0;
    if (skinOf() !== 'glass') { bg.style.display = 'none'; return; }
    bg.style.display = 'block'; bgRaf = requestAnimationFrame(drawBg);
  }
  function stopBg() { cancelAnimationFrame(bgRaf); bgRaf = 0; bg.style.display = 'none'; }

  /* ---------- старт ---------- */
  initBg();
  applySkin();
  applyFpsMeter();
  buildMenu();
  renderMenu();
  window.__I18N = I18N;
  startBg();
  window.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.__App = App;
  if (!store.get('onboard', false)) {
    $('#setBody').innerHTML = '<div class="onb"><div class="big">🎮</div><h3>' + t('onb.title') + '</h3><p class="note pnote">' + t('onb.sub') + '</p>' +
      '<div class="pname"><button class="av" data-shop="1">' + avH(avatar()) + '</button><input id="pnameIn" maxlength="16"' + (store.get('acct', null) ? ' readonly' : '') + ' value="' + escapeHtml(deviceName()) + '" placeholder="' + t('prof.name') + '"></div>' +
      '<ul><li>' + t('onb.l1') + '</li><li>' + t('onb.l2') + '</li><li>' + t('onb.l3') + '</li><li>' + t('onb.l4') + '</li></ul>' +
      '<button class="btn" id="onbGo" data-set="close">' + t('onb.go') + '</button></div>';
    sheet.classList.add('show', 'profile'); store.set('onboard', true);
  } else setTimeout(checkAch, 800);
  window.__test = { forceOver: function () { if (App.state === 'playing') endGame(); }, api: api };
})();
