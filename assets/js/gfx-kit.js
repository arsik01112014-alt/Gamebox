/* Общие приёмы рисования для игр: скруглённые прямоугольники, объёмные клавиши и кнопки, фон со звёздами */
window.GBK = (function () {
  function rr(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function shade(hex, k) { // k > 0 — светлее, k < 0 — темнее
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function f(v) { return Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)); }
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  }
  // объёмная клавиша: нижняя грань, градиент, блик
  function key(c, x, y, w, h, col, text, font, txtCol, pressed) {
    var r = Math.min(10, h * 0.22), d = pressed ? 1 : 3;
    rr(c, x, y + d, w, h - d, r); c.fillStyle = shade(col, -0.45); c.fill();
    var g = c.createLinearGradient(0, y, 0, y + h - d); g.addColorStop(0, shade(col, 0.18)); g.addColorStop(1, col);
    rr(c, x, y + (pressed ? 2 : 0), w, h - d, r); c.fillStyle = g; c.fill();
    c.fillStyle = 'rgba(255,255,255,.18)'; rr(c, x + 3, y + 2 + (pressed ? 2 : 0), w - 6, Math.max(2, (h - d) * 0.3), r * 0.7); c.fill();
    if (text != null) { c.fillStyle = txtCol || '#fff'; c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x + w / 2, y + (h - d) / 2 + 1 + (pressed ? 2 : 0)); }
  }
  // большая кнопка-пилюля с тенью
  function button(c, x, y, w, h, c1, c2, text, font) {
    c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 12; c.shadowOffsetY = 5;
    var g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, c1); g.addColorStop(1, c2);
    rr(c, x, y, w, h, h / 2); c.fillStyle = g; c.fill(); c.restore();
    c.fillStyle = 'rgba(255,255,255,.22)'; rr(c, x + h * 0.4, y + 3, w - h * 0.8, h * 0.18, h * 0.09); c.fill();
    c.fillStyle = '#fff'; c.font = font || '800 18px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x + w / 2, y + h / 2 + 1);
  }
  // фон: вертикальный градиент + мягкое свечение
  function bg(c, W, H, top, bottom, glow) {
    var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bottom); c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (glow) { var r = c.createRadialGradient(W / 2, H * 0.3, 10, W / 2, H * 0.3, Math.max(W, H) * 0.6); r.addColorStop(0, glow); r.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = r; c.fillRect(0, 0, W, H); }
  }
  // всплывающая подпись с плашкой
  function toast(c, W, y, text, a) {
    if (!text || a <= 0) return;
    c.globalAlpha = Math.min(1, a); c.font = '800 15px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
    var w = Math.min(W - 20, c.measureText(text).width + 36);
    rr(c, W / 2 - w / 2, y - 18, w, 36, 18); c.fillStyle = 'rgba(15,23,42,.82)'; c.fill();
    c.fillStyle = '#fff'; c.fillText(text, W / 2, y + 1); c.globalAlpha = 1;
  }
  function heart(c, x, y, s, col) {
    c.fillStyle = col; c.beginPath(); c.moveTo(x, y + s * 0.35);
    c.bezierCurveTo(x - s * 0.1, y + s * 0.2, x - s * 0.55, y + s * 0.05, x - s * 0.5, y - s * 0.22);
    c.bezierCurveTo(x - s * 0.45, y - s * 0.5, x - s * 0.08, y - s * 0.5, x, y - s * 0.22);
    c.bezierCurveTo(x + s * 0.08, y - s * 0.5, x + s * 0.45, y - s * 0.5, x + s * 0.5, y - s * 0.22);
    c.bezierCurveTo(x + s * 0.55, y + s * 0.05, x + s * 0.1, y + s * 0.2, x, y + s * 0.35); c.fill();
  }
  return { rr: rr, shade: shade, key: key, button: button, bg: bg, toast: toast, heart: heart };
})();
