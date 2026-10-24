// Печатает пороги медалей всех игр {id: [бронза, серебро, золото]} — для рейтинга в админке.
// Запуск: node tools/gen_medals.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', 'assets');
const ctx = { window: {}, document: { addEventListener() {} } }; ctx.window.GAMES = {}; vm.createContext(ctx);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const m of html.matchAll(/<script src="js\/([a-z0-9]+)\.js"><\/script>/g)) {
  if (m[1] === 'engine' || m[1] === 'i18n') continue;
  try { vm.runInContext(fs.readFileSync(path.join(root, 'js', m[1] + '.js'), 'utf8'), ctx); } catch (e) { }
}
const eng = fs.readFileSync(path.join(root, 'js', 'engine.js'), 'utf8');
const MEDALS = vm.runInNewContext('(' + eng.match(/var MEDALS = (\{[\s\S]*?\});/)[1] + ')');
const out = {};
for (const id of Object.keys(ctx.window.GAMES)) out[id] = ctx.window.GAMES[id].medals || MEDALS[id] || [100, 500, 2000];
process.stdout.write(JSON.stringify(out));
