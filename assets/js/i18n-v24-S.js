/* Тексты v2.4 (S): боулинг и мини-гольф. Базовые языки — массивы [ru, en, uk, de, es]; дополнительные — объекты по языкам. */
Object.assign(window.I18N_MORE = window.I18N_MORE || {}, {
  'bowling.title': ['Боулинг', 'Bowling', 'Боулінг', 'Bowling', 'Bolos'],
  'bowling.desc': ['Страйки, спэры и подкрутка', 'Strikes, spares and hook shots', 'Страйки, спери та підкрутка', 'Strikes, Spares und Hook-Würfe', 'Plenos, semiplenos y efecto'],
  'bowling.hint': [
    'Смахни вверх от шара — бросок. Направление свайпа задаёт прицел, скорость — силу, а изгиб в конце свайпа закручивает шар (хук). Проведи пальцем вбок, чтобы сдвинуть шар перед броском. 10 фреймов, настоящий подсчёт очков: страйк — 10 + два следующих броска, спэр — 10 + один. Максимум 300.',
    'Swipe up from the ball to roll. The swipe direction aims, its speed sets power, and curving the end of the swipe adds hook. Drag sideways to move the ball before rolling. 10 frames with real scoring: a strike is 10 + the next two balls, a spare is 10 + the next one. Max 300.',
    'Змахни вгору від кулі — кидок. Напрямок свайпу задає приціл, швидкість — силу, а вигин наприкінці свайпу закручує кулю (хук). Проведи пальцем убік, щоб зсунути кулю перед кидком. 10 фреймів, справжній підрахунок: страйк — 10 + два наступні кидки, спер — 10 + один. Максимум 300.',
    'Wische vom Ball nach oben, um zu werfen. Die Richtung zielt, das Tempo bestimmt die Kraft, eine Kurve am Ende gibt Hook. Seitlich ziehen verschiebt den Ball. 10 Frames mit echter Wertung: Strike = 10 + die nächsten zwei Würfe, Spare = 10 + der nächste. Maximum 300.',
    'Desliza hacia arriba desde la bola para lanzar. La dirección apunta, la velocidad da fuerza y curvar el final añade efecto. Arrastra de lado para mover la bola. 10 frames con puntuación real: pleno = 10 + dos tiros siguientes, semipleno = 10 + uno. Máximo 300.'],
  'bowling.d0': ['Точный прицел, линия траектории', 'Gentle aim, full path preview', 'Точний приціл, лінія траєкторії', 'Sanftes Zielen, volle Bahnvorschau', 'Puntería suave, trayectoria completa'],
  'bowling.d1': ['Подсказка начала пути', 'Short path hint', 'Підказка початку шляху', 'Kurzer Bahnhinweis', 'Pista corta de trayectoria'],
  'bowling.d2': ['Без подсказок, масло меняется', 'No hints, changing oil', 'Без підказок, мастило змінюється', 'Ohne Hilfe, wechselndes Öl', 'Sin ayudas, aceite variable'],
  'bowling.d3': ['Разброс, непредсказуемое масло', 'Drift and unpredictable oil', 'Розкид, непередбачуване мастило', 'Streuung und unberechenbares Öl', 'Desvío y aceite impredecible'],
  'bowling.new': ['Настоящая физика кеглей и хук-броски', 'Real pin physics and hook shots', 'Справжня фізика кеглів і хук-кидки', 'Echte Pin-Physik und Hook-Würfe', 'Física real de bolos y tiros con efecto'],
  'bowl.strike': ['СТРАЙК!', 'STRIKE!', 'СТРАЙК!', 'STRIKE!', '¡PLENO!'],
  'bowl.double': ['ДУБЛЬ!', 'DOUBLE!', 'ДУБЛЬ!', 'DOUBLE!', '¡DOBLE!'],
  'bowl.turkey': ['ТЁРКИ!', 'TURKEY!', 'ТЕРКІ!', 'TURKEY!', '¡TURKEY!'],
  'bowl.spare': ['СПЭР!', 'SPARE!', 'СПЕР!', 'SPARE!', '¡SEMIPLENO!'],
  'bowl.split': ['СПЛИТ', 'SPLIT', 'СПЛІТ', 'SPLIT', 'SPLIT'],
  'bowl.gutter': ['В жёлоб', 'Gutter ball', 'У жолоб', 'Rinne', 'Al canal'],
  'bowl.miss': ['Мимо', 'Miss', 'Повз', 'Daneben', 'Fallo'],
  'bowl.pins': ['Сбито: {0}', '{0} pins', 'Збито: {0}', '{0} Pins', '{0} bolos'],
  'bowl.tip': ['Смахни вверх, чтобы бросить', 'Swipe up to roll', 'Змахни вгору, щоб кинути', 'Nach oben wischen zum Werfen', 'Desliza hacia arriba para lanzar'],
  'bowl.move': ['Изогни свайп — подкрутка · вбок — сдвинуть шар', 'Curve the swipe to hook · drag sideways to move', 'Вигни свайп — підкрутка · убік — зсунути кулю', 'Kurve = Hook · seitlich ziehen = verschieben', 'Curva = efecto · de lado = mover la bola'],
  'bowl.frame': ['Фрейм {0}', 'Frame {0}', 'Фрейм {0}', 'Frame {0}', 'Frame {0}'],
  'bowl.ball': ['бросок {0}', 'ball {0}', 'кидок {0}', 'Wurf {0}', 'tiro {0}'],
  'bowl.kmh': ['{0} км/ч', '{0} km/h', '{0} км/год', '{0} km/h', '{0} km/h'],
  'bowl.perfect': ['ИДЕАЛЬНО!', 'PERFECT!', 'ІДЕАЛЬНО!', 'PERFEKT!', '¡PERFECTO!'],
  'bowl.final': ['Итог игры', 'Final score', 'Підсумок гри', 'Endstand', 'Resultado final'],
  'minigolf.title': ['Мини-гольф', 'Mini Golf', 'Міні-гольф', 'Minigolf', 'Minigolf'],
  'minigolf.desc': ['9 лунок с мельницами и телепортами', '9 holes with windmills and teleports', '9 лунок з млинами й телепортами', '9 Bahnen mit Windmühlen und Teleportern', '9 hoyos con molinos y teletransportes'],
  'minigolf.hint': [
    'Потяни назад от мяча и отпусти — чем дальше тянешь, тем сильнее удар. Отскакивай от бортиков, обходи мельницу, избегай воды (+1 удар) и песка (тормозит). Стрелки на газоне — уклон, порталы переносят мяч. Очки за лунку: пар — 50, бёрди — 75, игл — 100, с одного удара — 150.',
    'Drag back from the ball and release — the further you pull, the harder the shot. Bank off the walls, time the windmill, avoid water (+1 stroke) and sand (slows the ball). Arrows on the turf show slopes, portals teleport the ball. Points per hole: par 50, birdie 75, eagle 100, hole-in-one 150.',
    'Потягни назад від м’яча й відпусти — що далі тягнеш, то сильніший удар. Відбивайся від бортиків, обходь млин, уникай води (+1 удар) і піску (гальмує). Стрілки на газоні — схил, портали переносять м’яч. Очки за лунку: пар — 50, бьорді — 75, ігл — 100, з одного удару — 150.',
    'Vom Ball zurückziehen und loslassen — je weiter, desto fester der Schlag. Nutze die Banden, pass die Windmühle ab, meide Wasser (+1 Schlag) und Sand (bremst). Pfeile zeigen Gefälle, Portale teleportieren den Ball. Punkte: Par 50, Birdie 75, Eagle 100, Ass 150.',
    'Tira hacia atrás desde la bola y suelta: cuanto más tiras, más fuerte el golpe. Rebota en las paredes, sincroniza el molino, evita el agua (+1 golpe) y la arena (frena). Las flechas marcan pendientes, los portales teletransportan. Puntos: par 50, birdie 75, eagle 100, hoyo en uno 150.'],
  'minigolf.d0': ['Большая лунка, линия траектории', 'Big cup, full path preview', 'Велика лунка, лінія траєкторії', 'Großes Loch, volle Bahnvorschau', 'Hoyo grande, trayectoria completa'],
  'minigolf.d1': ['Короткая подсказка прицела', 'Short aim preview', 'Коротка підказка прицілу', 'Kurze Zielhilfe', 'Ayuda de puntería corta'],
  'minigolf.d2': ['Без подсказок, препятствия быстрее', 'No preview, faster obstacles', 'Без підказок, перешкоди швидші', 'Ohne Vorschau, schnellere Hindernisse', 'Sin ayuda, obstáculos más rápidos'],
  'minigolf.d3': ['Маленькая лунка, быстрый газон', 'Small cup, fast greens', 'Мала лунка, швидкий газон', 'Kleines Loch, schnelles Grün', 'Hoyo pequeño, green rápido'],
  'minigolf.new': ['Мельницы, порталы, горки и вода', 'Windmills, portals, slopes and water', 'Млини, портали, схили й вода', 'Windmühlen, Portale, Hänge und Wasser', 'Molinos, portales, pendientes y agua'],
  'golf.hole': ['Лунка {0}/{1}', 'Hole {0}/{1}', 'Лунка {0}/{1}', 'Bahn {0}/{1}', 'Hoyo {0}/{1}'],
  'golf.parN': ['Пар {0}', 'Par {0}', 'Пар {0}', 'Par {0}', 'Par {0}'],
  'golf.strokes': ['Удары: {0}', 'Strokes: {0}', 'Удари: {0}', 'Schläge: {0}', 'Golpes: {0}'],
  'golf.tip': ['Потяни назад от мяча и отпусти', 'Pull back from the ball and release', 'Потягни назад від м’яча й відпусти', 'Vom Ball zurückziehen und loslassen', 'Tira hacia atrás y suelta'],
  'golf.water': ['В воду! +1', 'Splash! +1', 'У воду! +1', 'Wasser! +1', '¡Al agua! +1'],
  'golf.ace': ['С ОДНОГО УДАРА!', 'HOLE IN ONE!', 'З ОДНОГО УДАРУ!', 'ASS!', '¡HOYO EN UNO!'],
  'golf.eagle': ['ИГЛ!', 'EAGLE!', 'ІГЛ!', 'EAGLE!', '¡EAGLE!'],
  'golf.birdie': ['БЁРДИ!', 'BIRDIE!', 'БЬОРДІ!', 'BIRDIE!', '¡BIRDIE!'],
  'golf.par': ['ПАР', 'PAR', 'ПАР', 'PAR', 'PAR'],
  'golf.bogey': ['Боги', 'Bogey', 'Богі', 'Bogey', 'Bogey'],
  'golf.dbogey': ['+{0} к пару', '+{0} over par', '+{0} понад пар', '+{0} über Par', '+{0} sobre par'],
  'golf.pickup': ['Лимит ударов', 'Stroke limit', 'Ліміт ударів', 'Schlaglimit', 'Límite de golpes'],
  'golf.total': ['Итого очков', 'Total points', 'Усього очок', 'Gesamtpunkte', 'Puntos totales']
});
(function () {
  var X = window.I18N_EXTRA = window.I18N_EXTRA || {};
  var add = {
    kk: { 'bowling.title': 'Боулинг', 'bowling.desc': 'Страйктар, спэрлер және бұрау', 'minigolf.title': 'Мини-гольф', 'minigolf.desc': 'Диірмендер мен телепорттары бар 9 шұңқыр' },
    tr: { 'bowling.title': 'Bowling', 'bowling.desc': 'Strike, spare ve falsolu atışlar', 'minigolf.title': 'Mini Golf', 'minigolf.desc': 'Yel değirmenleri ve ışınlayıcılarla 9 delik' },
    fr: { 'bowling.title': 'Bowling', 'bowling.desc': 'Strikes, spares et effets', 'minigolf.title': 'Mini-golf', 'minigolf.desc': '9 trous avec moulins et téléporteurs' },
    it: { 'bowling.title': 'Bowling', 'bowling.desc': 'Strike, spare e tiri ad effetto', 'minigolf.title': 'Minigolf', 'minigolf.desc': '9 buche con mulini e teletrasporti' },
    pt: { 'bowling.title': 'Boliche', 'bowling.desc': 'Strikes, spares e efeito', 'minigolf.title': 'Minigolfe', 'minigolf.desc': '9 buracos com moinhos e teletransportes' },
    pl: { 'bowling.title': 'Kręgle', 'bowling.desc': 'Strike’i, spare’y i podkręcone rzuty', 'minigolf.title': 'Minigolf', 'minigolf.desc': '9 dołków z wiatrakami i teleportami' }
  };
  for (var l in add) { X[l] = X[l] || {}; for (var k in add[l]) X[l][k] = add[l][k]; }
})();
