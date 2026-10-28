// Список игр для админки: assets/games.json (id, название, раздел, цвета) в порядке меню. Запуск: node tools/games_json.js
const fs = require('fs'), path = require('path'), A = path.join(__dirname, '..', 'assets');
global.window = {};
const eng = fs.readFileSync(path.join(A, 'js/engine.js'), 'utf8');
const order = eval(eng.match(/var ORDER = (\[[\s\S]*?\])\.filter/)[1]);
fs.readdirSync(path.join(A, 'js')).filter(f => f.endsWith('.js')).forEach(f => { try { const s = fs.readFileSync(path.join(A, 'js', f), 'utf8'); if (s.includes('window.GAMES.')) eval(s); } catch (e) { } });
const out = order.filter(id => window.GAMES[id]).map(id => { const g = window.GAMES[id]; return { id, t: g.title, c: g.cat || '', col: g.colors, duo: !!g.modes }; });
fs.writeFileSync(path.join(A, 'games.json'), JSON.stringify(out));
console.log(out.length + ' игр');
