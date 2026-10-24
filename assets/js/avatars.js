/* Аватарки-иллюстрации (SVG). Ключ хранится как 'i:<id>'; старые эмодзи-аватарки переводятся на похожие новые */
(function () {
  function bg(a, b) { return '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient></defs><circle cx="32" cy="32" r="32" fill="url(#g)"/>'; }
  function eyes(y, c, s) { s = s || 3.2; return '<circle cx="24" cy="' + y + '" r="' + s + '" fill="' + (c || '#1f2937') + '"/><circle cx="40" cy="' + y + '" r="' + s + '" fill="' + (c || '#1f2937') + '"/><circle cx="25" cy="' + (y - 1.2) + '" r="1" fill="#fff"/><circle cx="41" cy="' + (y - 1.2) + '" r="1" fill="#fff"/>'; }
  function smile(y, c) { return '<path d="M26 ' + y + 'q6 5 12 0" stroke="' + (c || '#1f2937') + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>'; }
  function cheeks(y) { return '<circle cx="19" cy="' + y + '" r="3" fill="#fb7185" opacity=".45"/><circle cx="45" cy="' + y + '" r="3" fill="#fb7185" opacity=".45"/>'; }
  function animal(head, ear, inner, extra) {
    return ear + '<circle cx="32" cy="35" r="17" fill="' + head + '"/>' + (inner || '') + eyes(33) + (extra || '<ellipse cx="32" cy="39" rx="2.4" ry="1.8" fill="#1f2937"/>' + smile(41)) + cheeks(39);
  }
  function person(skin, hair, extra) {
    return '<circle cx="32" cy="35" r="16" fill="' + skin + '"/>' + hair + eyes(34) + smile(41) + cheeks(39) + (extra || '');
  }
  var A = {
    kid: ['#60a5fa', '#2563eb', person('#fcd9b6', '<path d="M16 32q0-15 16-15t16 15q-6-7-16-7t-16 7z" fill="#7c2d12"/>')],
    cool: ['#f472b6', '#9333ea', person('#e8b48a', '<path d="M16 31q1-14 16-14t16 14q-4-4-9-5l-3 4-4-4q-9 1-16 5z" fill="#111827"/>',
      '<rect x="18" y="30" width="12" height="7" rx="3" fill="#111827"/><rect x="34" y="30" width="12" height="7" rx="3" fill="#111827"/><path d="M30 32h4" stroke="#111827" stroke-width="2"/>')],
    cat: ['#fde68a', '#f59e0b', animal('#94a3b8', '<path d="M17 30l3-16 10 8zM47 30l-3-16-10 8z" fill="#94a3b8"/><path d="M20 24l1-7 5 4zM44 24l-1-7-5 4z" fill="#fda4af"/>', '',
      '<ellipse cx="32" cy="39" rx="2.2" ry="1.6" fill="#f472b6"/>' + smile(41) + '<path d="M14 38h9M14 42l9-2M50 38h-9M50 42l-9-2" stroke="#475569" stroke-width="1.2"/>')],
    fox: ['#fed7aa', '#fb923c', animal('#f97316', '<path d="M16 32l2-19 12 10zM48 32l-2-19-12 10z" fill="#f97316"/><path d="M19 26l1-9 6 5zM45 26l-1-9-6 5z" fill="#1f2937"/>',
      '<path d="M15 36q8 2 17 14q9-12 17-14q-4 15-17 16q-13-1-17-16z" fill="#fff"/>')],
    panda: ['#bbf7d0', '#22c55e', animal('#fff', '<circle cx="18" cy="21" r="6" fill="#1f2937"/><circle cx="46" cy="21" r="6" fill="#1f2937"/>',
      '<ellipse cx="24" cy="33" rx="5" ry="6" fill="#1f2937" transform="rotate(-20 24 33)"/><ellipse cx="40" cy="33" rx="5" ry="6" fill="#1f2937" transform="rotate(20 40 33)"/>')],
    frog: ['#a7f3d0', '#10b981', '<circle cx="22" cy="22" r="7" fill="#4ade80"/><circle cx="42" cy="22" r="7" fill="#4ade80"/><ellipse cx="32" cy="38" rx="19" ry="14" fill="#4ade80"/>' +
      '<circle cx="22" cy="22" r="4" fill="#fff"/><circle cx="42" cy="22" r="4" fill="#fff"/><circle cx="22" cy="22" r="2" fill="#1f2937"/><circle cx="42" cy="22" r="2" fill="#1f2937"/>' +
      '<path d="M20 40q12 9 24 0" stroke="#166534" stroke-width="2.4" fill="none" stroke-linecap="round"/>' + cheeks(37)],
    lion: ['#fef08a', '#eab308', '<g fill="#b45309">' + [0, 45, 90, 135, 180, 225, 270, 315].map(function (r) { return '<circle cx="32" cy="15" r="7" transform="rotate(' + r + ' 32 34)"/>'; }).join('') + '</g>' +
      animal('#fbbf24', '<circle cx="19" cy="22" r="5" fill="#fbbf24"/><circle cx="45" cy="22" r="5" fill="#fbbf24"/>')],
    octo: ['#c4b5fd', '#7c3aed', '<path d="M14 36q0-20 18-20t18 20v6q-3 6-6 0-3 6-6 0-3 6-6 0-3 6-6 0-3 6-6 0-3 6-6 0z" fill="#f472b6"/>' + eyes(32) + smile(38) + cheeks(36)],
    robot: ['#a5f3fc', '#0891b2', '<path d="M32 10v7" stroke="#64748b" stroke-width="2.5"/><circle cx="32" cy="9" r="3" fill="#ef4444"/><rect x="15" y="17" width="34" height="32" rx="8" fill="#cbd5e1"/>' +
      '<rect x="19" y="23" width="26" height="14" rx="5" fill="#0f172a"/><circle cx="26" cy="30" r="3" fill="#22d3ee"/><circle cx="38" cy="30" r="3" fill="#22d3ee"/>' +
      '<path d="M24 43h16" stroke="#64748b" stroke-width="2.5" stroke-dasharray="3 2"/><rect x="11" y="27" width="4" height="10" rx="2" fill="#94a3b8"/><rect x="49" y="27" width="4" height="10" rx="2" fill="#94a3b8"/>'],
    alien: ['#312e81', '#0f172a', '<ellipse cx="32" cy="34" rx="16" ry="19" fill="#86efac"/><ellipse cx="24" cy="33" rx="6" ry="4" fill="#111827" transform="rotate(25 24 33)"/>' +
      '<ellipse cx="40" cy="33" rx="6" ry="4" fill="#111827" transform="rotate(-25 40 33)"/><path d="M28 44q4 2 8 0" stroke="#166534" stroke-width="2" fill="none"/><circle cx="12" cy="14" r="1.5" fill="#fff"/><circle cx="52" cy="50" r="1.2" fill="#fff"/><circle cx="50" cy="12" r="1" fill="#fff"/>'],
    dragon: ['#fecaca', '#dc2626', '<path d="M20 24l-4-12 10 8zM44 24l4-12-10 8z" fill="#fbbf24"/>' + animal('#22c55e', '', '<ellipse cx="32" cy="42" rx="10" ry="7" fill="#86efac"/>',
      '<circle cx="29" cy="40" r="1.3" fill="#166534"/><circle cx="35" cy="40" r="1.3" fill="#166534"/>' + smile(44, '#166534'))],
    crown: ['#7c3aed', '#312e81', '<path d="M12 44l3-22 10 10 7-15 7 15 10-10 3 22z" fill="#facc15" stroke="#ca8a04" stroke-width="2" stroke-linejoin="round"/>' +
      '<rect x="12" y="44" width="40" height="7" rx="2" fill="#eab308"/><circle cx="22" cy="47.5" r="2" fill="#ef4444"/><circle cx="32" cy="47.5" r="2" fill="#22d3ee"/><circle cx="42" cy="47.5" r="2" fill="#22c55e"/>'],
    penguin: ['#bae6fd', '#0284c7', '<ellipse cx="32" cy="36" rx="18" ry="19" fill="#1f2937"/><path d="M18 38q0-14 14-14t14 14q0 12-14 13t-14-13z" fill="#fff"/>' + eyes(33) + '<path d="M28 39h8l-4 5z" fill="#f97316"/>' + cheeks(40)],
    monkey: ['#fde68a', '#b45309', animal('#92400e', '<circle cx="15" cy="34" r="6" fill="#92400e"/><circle cx="49" cy="34" r="6" fill="#fcd9b6"/><circle cx="15" cy="34" r="3.5" fill="#fcd9b6"/>',
      '<path d="M18 34q0-10 7-10q7 0 7 5q0-5 7-5q7 0 7 10q0 14-14 14t-14-14z" fill="#fcd9b6"/>')],
    bear: ['#fed7aa', '#c2410c', animal('#a16207', '<circle cx="18" cy="21" r="6" fill="#a16207"/><circle cx="46" cy="21" r="6" fill="#a16207"/><circle cx="18" cy="21" r="3" fill="#fcd34d"/><circle cx="46" cy="21" r="3" fill="#fcd34d"/>',
      '<ellipse cx="32" cy="41" rx="7" ry="5.5" fill="#fde68a"/>')],
    butterfly: ['#fbcfe8', '#db2777', '<path d="M32 32q-10-18-20-12t6 14q-12 6-4 12t18-12z" fill="#a855f7"/><path d="M32 32q10-18 20-12t-6 14q12 6 4 12t-18-12z" fill="#ec4899"/>' +
      '<circle cx="20" cy="26" r="3" fill="#fde68a"/><circle cx="44" cy="26" r="3" fill="#fde68a"/><rect x="30" y="20" width="4" height="26" rx="2" fill="#1f2937"/><path d="M31 20l-4-6M33 20l4-6" stroke="#1f2937" stroke-width="1.5"/>'],
    bee: ['#fef9c3', '#facc15', '<ellipse cx="22" cy="20" rx="7" ry="5" fill="#e0f2fe" opacity=".9"/><ellipse cx="42" cy="20" rx="7" ry="5" fill="#e0f2fe" opacity=".9"/><circle cx="32" cy="36" r="16" fill="#facc15"/>' +
      '<path d="M17 31h30M16 40h32" stroke="#1f2937" stroke-width="4"/>' + eyes(35, '#1f2937', 3) + smile(44)],
    tiger: ['#fed7aa', '#ea580c', animal('#fb923c', '<circle cx="18" cy="21" r="5.5" fill="#fb923c"/><circle cx="46" cy="21" r="5.5" fill="#fb923c"/>',
      '<path d="M32 18v6M26 19l2 5M38 19l-2 5M15 33h6M15 38h5M49 33h-6M49 38h-5" stroke="#1f2937" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="32" cy="42" rx="8" ry="6" fill="#fff"/>')],
    unicorn: ['#fae8ff', '#c084fc', '<path d="M32 4l4 16h-8z" fill="#facc15"/><path d="M17 26l4-12 7 8zM47 26l-4-12-7 8z" fill="#fff"/>' +
      animal('#fff', '', '<path d="M18 22q4-8 14-6q-6 4-6 12q-6-2-8-6z" fill="#f472b6"/>')],
    pumpkin: ['#1e1b4b', '#4c1d95', '<path d="M32 18q0-6 5-8" stroke="#16a34a" stroke-width="3" fill="none"/><ellipse cx="32" cy="36" rx="20" ry="16" fill="#f97316"/><path d="M32 20v32M22 22q-4 14 0 28M42 22q4 14 0 28" stroke="#c2410c" stroke-width="1.5" fill="none"/>' +
      '<path d="M21 31l5-4 2 5zM43 31l-5-4-2 5z" fill="#fde047"/><path d="M22 41l4 3 3-3 3 3 3-3 3 3 4-3q-2 7-10 7t-10-7z" fill="#fde047"/>'],
    ghost: ['#6366f1', '#1e1b4b', '<path d="M16 50V32q0-16 16-16t16 16v18l-4-4-4 4-4-4-4 4-4-4-4 4-4-4z" fill="#f8fafc"/>' + eyes(32, '#1e1b4b', 3.6) + '<ellipse cx="32" cy="41" rx="3" ry="4" fill="#1e1b4b"/>' + cheeks(37)],
    cowboy: ['#fde68a', '#d97706', person('#e8b48a', '', '<path d="M8 25q24 8 48 0q-4 6-12 6h-24q-8 0-12-6z" fill="#92400e"/><path d="M20 26q0-14 12-14t12 14z" fill="#a16207"/><path d="M20 23h24" stroke="#451a03" stroke-width="2.5"/>')],
    dino: ['#d9f99d', '#65a30d', '<path d="M20 22l4-6 4 5 4-6 4 6 4-5 4 6" fill="#f97316"/><rect x="14" y="20" width="36" height="32" rx="14" fill="#84cc16"/>' + eyes(32) +
      '<path d="M22 43h20" stroke="#365314" stroke-width="2.2" stroke-linecap="round"/><path d="M25 43v3M31 43v3M37 43v3" stroke="#fff" stroke-width="2"/>'],
    skull: ['#334155', '#020617', '<path d="M14 32q0-17 18-17t18 17q0 9-6 12v6H20v-6q-6-3-6-12z" fill="#f1f5f9"/><circle cx="24" cy="32" r="5" fill="#0f172a"/><circle cx="40" cy="32" r="5" fill="#0f172a"/>' +
      '<path d="M32 37l-3 5h6z" fill="#0f172a"/><path d="M25 50v-4M30 50v-4M35 50v-4M40 50v-4" stroke="#475569" stroke-width="1.5"/>'],
    ninja: ['#fca5a5', '#b91c1c', '<circle cx="32" cy="34" r="17" fill="#1f2937"/><rect x="16" y="28" width="32" height="10" rx="5" fill="#fcd9b6"/>' + eyes(33) +
      '<path d="M48 30l10-6M48 34l10 2" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/><rect x="15" y="25" width="34" height="3" fill="#ef4444"/>'],
    wizard: ['#a5b4fc', '#4338ca', person('#fcd9b6', '', '<path d="M14 26L32 2l18 24z" fill="#4c1d95"/><rect x="12" y="24" width="40" height="5" rx="2.5" fill="#6d28d9"/><path d="M30 12l1.5 3 3 .5-2 2 .5 3-3-1.5-3 1.5.5-3-2-2 3-.5z" fill="#facc15"/>' +
      '<path d="M20 44q12 14 24 0q-2 10-12 12q-10-2-12-12z" fill="#e2e8f0"/>')],
    hero: ['#93c5fd', '#1d4ed8', '<path d="M10 56q4-16 22-16t22 16z" fill="#ef4444"/>' + person('#fcd9b6', '<path d="M16 30q0-14 16-14t16 14q-2-6-8-7q-4 3-8 3t-8-3q-6 1-8 7z" fill="#1f2937"/>',
      '<path d="M16 31h32l-3 7H19z" fill="#2563eb" opacity=".85"/>' + eyes(34, '#fff', 2.4))],
    diamond: ['#0e7490', '#082f49', '<path d="M16 26l8-10h16l8 10-16 24z" fill="#67e8f9"/><path d="M16 26h32M24 16l8 10 8-10M24 26l8 24 8-24" stroke="#0891b2" stroke-width="1.5" fill="none"/>' +
      '<path d="M24 16l-8 10h8z" fill="#a5f3fc"/><circle cx="46" cy="14" r="2" fill="#fff"/><path d="M46 9v10M41 14h10" stroke="#fff" stroke-width="1"/>'],
    // новые
    astro: ['#1e293b', '#020617', '<circle cx="32" cy="34" r="19" fill="#e2e8f0"/><rect x="19" y="24" width="26" height="20" rx="10" fill="#0ea5e9"/><path d="M23 30q4-4 10-4" stroke="#bae6fd" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
      '<rect x="12" y="30" width="4" height="10" rx="2" fill="#94a3b8"/><rect x="48" y="30" width="4" height="10" rx="2" fill="#94a3b8"/><circle cx="10" cy="12" r="1.5" fill="#fff"/><circle cx="54" cy="10" r="1" fill="#fff"/>'],
    knight: ['#cbd5e1', '#475569', '<path d="M32 6q8 2 10 10q-8-2-10-10z" fill="#ef4444"/><path d="M14 34q0-18 18-18t18 18v14H14z" fill="#94a3b8"/><path d="M14 34h36" stroke="#64748b" stroke-width="2"/>' +
      '<rect x="18" y="32" width="28" height="5" rx="2" fill="#0f172a"/><path d="M32 37v11M26 42h2M36 42h2" stroke="#64748b" stroke-width="2"/>'],
    owl: ['#e9d5ff', '#7e22ce', '<path d="M16 22l6 6M48 22l-6 6" stroke="#78350f" stroke-width="4" stroke-linecap="round"/><ellipse cx="32" cy="37" rx="18" ry="17" fill="#a16207"/><ellipse cx="32" cy="43" rx="10" ry="10" fill="#fde68a"/>' +
      '<circle cx="24" cy="32" r="7" fill="#fff"/><circle cx="40" cy="32" r="7" fill="#fff"/><circle cx="24" cy="32" r="3.5" fill="#1f2937"/><circle cx="40" cy="32" r="3.5" fill="#1f2937"/><path d="M29 37h6l-3 5z" fill="#f97316"/>'],
    rabbit: ['#fbcfe8', '#ec4899', '<ellipse cx="24" cy="15" rx="5" ry="12" fill="#f8fafc"/><ellipse cx="40" cy="15" rx="5" ry="12" fill="#f8fafc"/><ellipse cx="24" cy="15" rx="2.5" ry="8" fill="#fda4af"/><ellipse cx="40" cy="15" rx="2.5" ry="8" fill="#fda4af"/>' +
      animal('#f8fafc', '', '', '<ellipse cx="32" cy="39" rx="2.2" ry="1.6" fill="#f472b6"/>' + smile(41) + '<rect x="30" y="42" width="4" height="4" rx="1" fill="#fff" stroke="#cbd5e1"/>')],
    pig: ['#fecdd3', '#e11d48', animal('#fda4af', '<path d="M17 26l2-10 8 6zM47 26l-2-10-8 6z" fill="#fb7185"/>', '',
      '<ellipse cx="32" cy="41" rx="7" ry="5" fill="#fb7185"/><circle cx="29.5" cy="41" r="1.4" fill="#9f1239"/><circle cx="34.5" cy="41" r="1.4" fill="#9f1239"/>')],
    shark: ['#bae6fd', '#0369a1', '<path d="M32 8l8 14H24z" fill="#64748b"/><ellipse cx="32" cy="36" rx="20" ry="16" fill="#64748b"/><path d="M14 40q18 16 36 0q-6 10-18 10t-18-10z" fill="#f1f5f9"/>' +
      eyes(31) + '<path d="M20 41l3 3 3-3 3 3 3-3 3 3 3-3 3 3 3-3" stroke="#fff" stroke-width="2" fill="none"/>'],
    cyber: ['#f0abfc', '#0f172a', '<circle cx="32" cy="35" r="16" fill="#a78bfa"/><path d="M16 30q0-14 16-14t16 14l-4-6-4 4-4-6-4 6-4-6-4 4z" fill="#22d3ee"/>' +
      '<rect x="17" y="30" width="30" height="7" rx="3.5" fill="#0f172a"/><rect x="19" y="32" width="26" height="3" rx="1.5" fill="#f0abfc"/>' + smile(42, '#4c1d95')],
    phoenix: ['#fde047', '#dc2626', '<path d="M32 52q-20-6-20-26q8 8 12 8q-4-10 2-20q2 10 6 12q4-2 6-12q6 10 2 20q4 0 12-8q0 20-20 26z" fill="#f97316"/>' +
      '<path d="M32 48q-10-4-10-16q6 6 10 6q4 0 10-6q0 12-10 16z" fill="#fde047"/><circle cx="27" cy="33" r="2" fill="#7c2d12"/><circle cx="37" cy="33" r="2" fill="#7c2d12"/><path d="M30 38h4l-2 4z" fill="#7c2d12"/>']
  };
  // [id, цена]
  var LIST = [['kid', 0], ['cool', 0], ['cat', 50], ['fox', 50], ['panda', 80], ['frog', 80], ['lion', 120], ['octo', 120], ['robot', 200], ['alien', 200], ['dragon', 350], ['crown', 600],
    ['penguin', 60], ['monkey', 60], ['bear', 80], ['butterfly', 100], ['bee', 100], ['tiger', 120], ['unicorn', 150], ['pumpkin', 150], ['ghost', 150],
    ['cowboy', 200], ['dino', 250], ['skull', 300], ['ninja', 400], ['wizard', 400], ['hero', 500], ['diamond', 1000],
    ['rabbit', 90], ['pig', 90], ['owl', 160], ['shark', 220], ['astro', 300], ['knight', 450], ['cyber', 700], ['phoenix', 1500]];
  var OLD = { '😀': 'kid', '😎': 'cool', '🐱': 'cat', '🦊': 'fox', '🐼': 'panda', '🐸': 'frog', '🦁': 'lion', '🐙': 'octo', '🤖': 'robot', '👽': 'alien', '🐲': 'dragon', '👑': 'crown',
    '🐧': 'penguin', '🐵': 'monkey', '🐻': 'bear', '🦋': 'butterfly', '🐝': 'bee', '🐯': 'tiger', '🦄': 'unicorn', '🎃': 'pumpkin', '👻': 'ghost',
    '🤠': 'cowboy', '🦖': 'dino', '💀': 'skull', '🥷': 'ninja', '🧙': 'wizard', '🦸': 'hero', '💎': 'diamond' };
  var n = 0;
  function svg(id) {
    var a = A[id]; if (!a) return '';
    // у каждой копии свой id градиента, иначе на странице все возьмут первый
    var gid = 'avg' + (n++);
    return '<svg class="avi" viewBox="0 0 64 64" style="width:1.3em;height:1.3em;vertical-align:-.32em;flex:none">' + bg(a[0], a[1]).replace('id="g"', 'id="' + gid + '"').replace('url(#g)', 'url(#' + gid + ')') + a[2] + '</svg>';
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  window.GBAV = {
    list: LIST.map(function (x) { return ['i:' + x[0], x[1]]; }),
    old: OLD,
    // HTML аватарки: старые эмодзи (у игроков со старой версией) тоже показываются новой картинкой
    html: function (a) { a = a || ''; if (a.indexOf('i:') === 0) return svg(a.slice(2)) || '🙂'; return OLD[a] ? svg(OLD[a]) : esc(a); },
    // для простого текста (холст, названия комнат): картинку не вставить, остаётся пусто
    text: function (a) { a = a || ''; return a.indexOf('i:') === 0 ? '' : a; }
  };
})();
