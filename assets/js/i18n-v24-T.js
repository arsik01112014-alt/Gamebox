/* v2.4 — пинбол и башенная защита (ru, en, uk, de, es) */
Object.assign(window.I18N_MORE = window.I18N_MORE || {}, {
  'pinball.title': ['Пинбол', 'Pinball', 'Пінбол', 'Flipper', 'Pinball'],
  'pinball.desc': ['Неоновый стол: рампа, бамперы и мультибол', 'Neon table: ramp, bumpers and multiball', 'Неоновий стіл: рампа, бампери й мультибол', 'Neon-Tisch: Rampe, Bumper und Multiball', 'Mesa de neón: rampa, bumpers y multibola'],
  'pinball.hint': [
    'Левая половина экрана — левый флиппер, правая — правый (можно держать оба). Шар в жёлобе: зажми экран и отпусти (или потяни вниз) — чем дольше, тем сильнее запуск. Попади в подсвеченную верхнюю дорожку — «скилл-шот». Верхние дорожки и все мишени поднимают множитель, 3 рампы — мультибол и джекпоты. В начале шара включено спасение. 3 шара.',
    'Left half of the screen works the left flipper, right half the right one (hold both if you like). Ball in the shooter lane: hold and release (or pull down) — the longer, the stronger. Hit the lit top lane for a skill shot. Top lanes and the full target bank raise the multiplier, 3 ramps start multiball with jackpots. Ball save is on at the start of each ball. 3 balls.',
    'Ліва половина екрана — лівий фліпер, права — правий (можна тримати обидва). Кулька в жолобі: затисни екран і відпусти (або потягни вниз) — що довше, то сильніший запуск. Влуч у підсвічену верхню доріжку — «скіл-шот». Верхні доріжки та всі мішені піднімають множник, 3 рампи — мультибол і джекпоти. На початку кульки діє порятунок. 3 кульки.',
    'Linke Bildschirmhälfte steuert den linken Flipper, rechte den rechten (beide halten geht auch). Kugel in der Abschussbahn: gedrückt halten und loslassen (oder nach unten ziehen) — je länger, desto stärker. Triff die leuchtende obere Bahn für einen Skill-Shot. Obere Bahnen und alle Fallziele erhöhen den Multiplikator, 3 Rampen starten Multiball mit Jackpots. Zu Beginn jeder Kugel gibt es Ball-Save. 3 Kugeln.',
    'La mitad izquierda de la pantalla mueve el flipper izquierdo, la derecha el derecho (puedes mantener ambos). Bola en el carril: mantén pulsado y suelta (o arrastra hacia abajo): cuanto más, más fuerte. Acierta el carril superior iluminado para un tiro de habilidad. Los carriles superiores y todas las dianas suben el multiplicador; 3 rampas activan multibola con jackpots. Al inicio de cada bola hay salvabola. 3 bolas.'],
  'pinball.d0': ['Пологий стол, сильные флипперы, узкие ауты, спасение 14 с', 'Gentle slope, strong flippers, narrow outlanes, 14 s ball save', 'Пологий стіл, сильні фліпери, вузькі аути, порятунок 14 с', 'Flache Neigung, starke Flipper, enge Outlanes, 14 s Ball-Save', 'Poca inclinación, flippers fuertes, outlanes estrechos, salvabola 14 s'],
  'pinball.d1': ['Обычный наклон, спасение 10 с', 'Normal slope, 10 s ball save', 'Звичайний нахил, порятунок 10 с', 'Normale Neigung, 10 s Ball-Save', 'Inclinación normal, salvabola 10 s'],
  'pinball.d2': ['Крутой стол, ауты шире, спасение 7 с', 'Steep table, wider outlanes, 7 s ball save', 'Крутий стіл, ширші аути, порятунок 7 с', 'Steiler Tisch, breitere Outlanes, 7 s Ball-Save', 'Mesa empinada, outlanes más anchos, salvabola 7 s'],
  'pinball.d3': ['Очень крутой стол, слабые флипперы, широкие ауты, спасение 5 с', 'Very steep, weak flippers, wide outlanes, 5 s ball save', 'Дуже крутий стіл, слабкі фліпери, широкі аути, порятунок 5 с', 'Sehr steil, schwache Flipper, weite Outlanes, 5 s Ball-Save', 'Muy empinada, flippers débiles, outlanes anchos, salvabola 5 s'],
  'pinball.new': ['Настоящая физика шара, рампа и мультибол на неоновом столе', 'Real ball physics, a wire ramp and multiball on a neon table', 'Справжня фізика кульки, рампа й мультибол на неоновому столі', 'Echte Kugelphysik, Drahtrampe und Multiball auf einem Neon-Tisch', 'Física real de la bola, rampa y multibola en una mesa de neón'],
  'pinball.ball': ['ШАР', 'BALL', 'КУЛЬКА', 'KUGEL', 'BOLA'],
  'pinball.launch': ['ЗАЖМИ И ОТПУСТИ', 'HOLD & RELEASE', 'ЗАТИСНИ Й ВІДПУСТИ', 'HALTEN & LOS', 'MANTÉN Y SUELTA'],
  'pinball.mb': ['МУЛЬТИБОЛ', 'MULTIBALL', 'МУЛЬТИБОЛ', 'MULTIBALL', 'MULTIBOLA'],
  'pinball.jackpotLit': ['РАМПА = ДЖЕКПОТ', 'RAMP = JACKPOT', 'РАМПА = ДЖЕКПОТ', 'RAMPE = JACKPOT', 'RAMPA = JACKPOT'],
  'pinball.jackpot': ['ДЖЕКПОТ!', 'JACKPOT!', 'ДЖЕКПОТ!', 'JACKPOT!', '¡JACKPOT!'],
  'pinball.saved': ['ШАР СПАСЁН', 'BALL SAVED', 'КУЛЬКУ ВРЯТОВАНО', 'BALL GERETTET', 'BOLA SALVADA'],
  'pinball.skill': ['СКИЛЛ-ШОТ!', 'SKILL SHOT!', 'СКІЛ-ШОТ!', 'SKILL-SHOT!', '¡TIRO MAESTRO!'],
  'pinball.lanes': ['ДОРОЖКИ!', 'LANES!', 'ДОРІЖКИ!', 'BAHNEN!', '¡CARRILES!'],
  'pinball.targets': ['МИШЕНИ!', 'TARGETS!', 'МІШЕНІ!', 'ZIELE!', '¡DIANAS!'],
  'pinball.ramp': ['РАМПА!', 'RAMP!', 'РАМПА!', 'RAMPE!', '¡RAMPA!'],
  'pinball.toMb': ['ДО МУЛЬТИБОЛА', 'TO MULTIBALL', 'ДО МУЛЬТИБОЛУ', 'BIS MULTIBALL', 'PARA MULTIBOLA'],
  'pinball.inlanes': ['ИНЛЕЙНЫ', 'INLANES', 'ІНЛЕЙНИ', 'INLANES', 'INLANES'],
  'pinball.combo': ['КОМБО', 'COMBO', 'КОМБО', 'KOMBO', 'COMBO'],
  'pinball.bonus': ['БОНУС', 'BONUS', 'БОНУС', 'BONUS', 'BONUS'],
  'pinball.over': ['ИГРА ОКОНЧЕНА', 'GAME OVER', 'ГРУ ЗАВЕРШЕНО', 'SPIEL AUS', 'FIN DEL JUEGO'],
  'pinball.nudge': ['ТОЛЧОК!', 'NUDGE!', 'ПОШТОВХ!', 'RÜTTELN!', '¡EMPUJÓN!'],
  'pinball.mbOver': ['МУЛЬТИБОЛ ВСЁ', 'MULTIBALL OVER', 'МУЛЬТИБОЛ ВСЕ', 'MULTIBALL VORBEI', 'FIN MULTIBOLA'],
  'pinball.tip1': ['Зажми экран и отпусти — запуск шара', 'Hold the screen and release to launch', 'Затисни екран і відпусти — запуск', 'Halten und loslassen zum Abschießen', 'Mantén pulsado y suelta para lanzar'],
  'pinball.tip2': ['◀ левый флиппер · правый флиппер ▶', '◀ left flipper · right flipper ▶', '◀ лівий фліпер · правий фліпер ▶', '◀ linker Flipper · rechter Flipper ▶', '◀ flipper izq. · flipper der. ▶'],
  'towerdef.title': ['Защита башнями', 'Tower Defense', 'Захист вежами', 'Turmverteidigung', 'Defensa de torres'],
  'towerdef.desc': ['Строй башни и сдержи волны врагов', 'Build towers and hold back the waves', 'Будуй вежі та стримай хвилі ворогів', 'Baue Türme und halte die Wellen auf', 'Construye torres y frena las oleadas'],
  'towerdef.hint': [
    'Нажми на каменную площадку, чтобы построить башню: лазер (бьёт и летающих), пушка (мощный выстрел), мороз (замедляет всех вокруг) или миномёт (урон по площади). Нажми на башню — улучшить или продать. Пушка и миномёт не достают летающих. «Следующая волна» раньше таймера — бонусное золото. Кнопка 2× ускоряет игру. Очки: убийства, пройденные волны и оставшиеся жизни.',
    'Tap a stone pad to build a tower: laser (hits flyers too), cannon (heavy shot), frost (slows everything around) or mortar (area damage). Tap a tower to upgrade or sell it. Cannon and mortar can’t hit flyers. Calling the next wave early gives bonus gold. The 2× button speeds the game up. Score: kills, waves cleared and lives left.',
    'Натисни на кам’яний майданчик, щоб збудувати вежу: лазер (б’є й летючих), гармата (потужний постріл), мороз (сповільнює всіх довкола) або міномет (шкода по площі). Натисни на вежу — покращити чи продати. Гармата й міномет не дістають летючих. «Наступна хвиля» раніше за таймер — бонусне золото. Кнопка 2× прискорює гру. Очки: вбивства, хвилі та залишені життя.',
    'Tippe auf eine Steinplattform, um einen Turm zu bauen: Laser (trifft auch Flieger), Kanone (starker Schuss), Frost (verlangsamt alles ringsum) oder Mörser (Flächenschaden). Tippe auf einen Turm zum Aufrüsten oder Verkaufen. Kanone und Mörser treffen keine Flieger. Die nächste Welle früher rufen bringt Bonusgold. Die 2×-Taste beschleunigt das Spiel. Punkte: Abschüsse, Wellen und übrige Leben.',
    'Toca una plataforma de piedra para construir una torre: láser (también da a voladores), cañón (disparo potente), hielo (ralentiza a todos alrededor) o mortero (daño en área). Toca una torre para mejorarla o venderla. Cañón y mortero no alcanzan a los voladores. Llamar antes a la siguiente oleada da oro extra. El botón 2× acelera el juego. Puntos: bajas, oleadas superadas y vidas restantes.'],
  'towerdef.d0': ['12 волн, много золота и жизней, слабые враги', '12 waves, lots of gold and lives, weak enemies', '12 хвиль, багато золота й життів, слабкі вороги', '12 Wellen, viel Gold und Leben, schwache Gegner', '12 oleadas, mucho oro y vidas, enemigos débiles'],
  'towerdef.d1': ['15 волн, обычные враги', '15 waves, normal enemies', '15 хвиль, звичайні вороги', '15 Wellen, normale Gegner', '15 oleadas, enemigos normales'],
  'towerdef.d2': ['18 волн, враги крепче, меньше жизней', '18 waves, tougher enemies, fewer lives', '18 хвиль, міцніші вороги, менше життів', '18 Wellen, zähere Gegner, weniger Leben', '18 oleadas, enemigos más duros, menos vidas'],
  'towerdef.d3': ['20 волн, очень крепкие враги, 10 жизней', '20 waves, very tough enemies, 10 lives', '20 хвиль, дуже міцні вороги, 10 життів', '20 Wellen, sehr zähe Gegner, 10 Leben', '20 oleadas, enemigos muy duros, 10 vidas'],
  'towerdef.new': ['Четыре вида башен с улучшениями, летающие враги и боссы', 'Four upgradable tower types, flying enemies and bosses', 'Чотири види веж із покращеннями, летючі вороги й боси', 'Vier ausbaubare Turmtypen, fliegende Gegner und Bosse', 'Cuatro torres mejorables, enemigos voladores y jefes'],
  'td.boss': ['Идёт босс!', 'Boss incoming!', 'Іде бос!', 'Boss im Anmarsch!', '¡Se acerca un jefe!'],
  'td.victory': ['Победа!', 'Victory!', 'Перемога!', 'Sieg!', '¡Victoria!'],
  'td.defeat': ['Крепость пала', 'The keep has fallen', 'Фортеця впала', 'Die Burg ist gefallen', 'La fortaleza ha caído'],
  'td.cleared': ['Волна отбита!', 'Wave cleared!', 'Хвилю відбито!', 'Welle geschafft!', '¡Oleada superada!'],
  'td.noGold': ['Мало золота', 'Not enough gold', 'Замало золота', 'Zu wenig Gold', 'Falta oro'],
  'td.max': ['МАКС', 'MAX', 'МАКС', 'MAX', 'MÁX'],
  'td.laser': ['Лазер', 'Laser', 'Лазер', 'Laser', 'Láser'],
  'td.cannon': ['Пушка', 'Cannon', 'Гармата', 'Kanone', 'Cañón'],
  'td.frost': ['Мороз', 'Frost', 'Мороз', 'Frost', 'Hielo'],
  'td.mortar': ['Миномёт', 'Mortar', 'Міномет', 'Mörser', 'Mortero'],
  'td.lvl': ['ур.', 'lv.', 'рів.', 'St.', 'nv.'],
  'td.build': ['Построить башню', 'Build a tower', 'Збудувати вежу', 'Turm bauen', 'Construir torre'],
  'td.wave': ['Волна', 'Wave', 'Хвиля', 'Welle', 'Oleada'],
  'td.start': ['В бой', 'Start', 'До бою', 'Los geht’s', 'Comenzar'],
  'td.next': ['Следующая волна', 'Next wave', 'Наступна хвиля', 'Nächste Welle', 'Siguiente oleada'],
  'td.sec': ['с', 's', 'с', 's', 's'],
  'td.goldEarly': ['золота за спешку', 'gold for rushing', 'золота за поспіх', 'Gold fürs Eilen', 'de oro por adelantar'],
  'td.enemies': ['врагов', 'enemies', 'ворогів', 'Gegner', 'enemigos'],
  'td.tip': ['Нажми на площадку, чтобы построить башню', 'Tap a stone pad to build a tower', 'Натисни на майданчик, щоб збудувати вежу', 'Tippe auf eine Plattform, um zu bauen', 'Toca una plataforma para construir']
});
(function () {
  var X = window.I18N_EXTRA = window.I18N_EXTRA || {};
  var add = {
    kk: {
      'towerdef.title': 'Мұнара қорғанысы', 'towerdef.desc': 'Мұнаралар салып, жау толқындарын тоқтат', 'td.wave': 'Толқын', 'td.next': 'Келесі толқын', 'td.victory': 'Жеңіс!', 'td.laser': 'Лазер', 'td.cannon': 'Зеңбірек', 'td.frost': 'Аяз', 'td.mortar': 'Миномёт', 'td.start': 'Бастау', 'td.tip': 'Мұнара салу үшін алаңды бас',
      'pinball.title': 'Пинбол', 'pinball.desc': 'Неон үстел: рампа, бамперлер және мультибол', 'pinball.ball': 'ДОП', 'pinball.over': 'ОЙЫН БІТТІ', 'pinball.jackpot': 'ДЖЕКПОТ!', 'pinball.saved': 'ДОП ҚҰТҚАРЫЛДЫ',
      'pinball.tip1': 'Экранды басып, жіберіңіз — доп ұшырылады', 'pinball.tip2': '◀ сол флиппер · оң флиппер ▶'
    },
    tr: {
      'towerdef.title': 'Kule Savunması', 'towerdef.desc': 'Kuleler kur ve dalgaları durdur', 'td.wave': 'Dalga', 'td.next': 'Sonraki dalga', 'td.victory': 'Zafer!', 'td.laser': 'Lazer', 'td.cannon': 'Top', 'td.frost': 'Buz', 'td.mortar': 'Havan', 'td.start': 'Başla', 'td.tip': 'Kule kurmak için taş platforma dokun',
      'pinball.title': 'Langırt', 'pinball.desc': 'Neon masa: rampa, tamponlar ve çoklu top', 'pinball.ball': 'TOP', 'pinball.over': 'OYUN BİTTİ', 'pinball.saved': 'TOP KURTARILDI',
      'pinball.tip1': 'Fırlatmak için basılı tut ve bırak', 'pinball.tip2': '◀ sol palet · sağ palet ▶'
    },
    fr: {
      'towerdef.title': 'Défense de tours', 'towerdef.desc': 'Construis des tours et repousse les vagues', 'td.wave': 'Vague', 'td.next': 'Vague suivante', 'td.victory': 'Victoire !', 'td.laser': 'Laser', 'td.cannon': 'Canon', 'td.frost': 'Givre', 'td.mortar': 'Mortier', 'td.start': 'Lancer', 'td.tip': 'Touche une dalle pour bâtir une tour',
      'pinball.title': 'Flipper', 'pinball.desc': 'Table néon : rampe, bumpers et multibille', 'pinball.ball': 'BILLE', 'pinball.over': 'FIN DE PARTIE', 'pinball.saved': 'BILLE SAUVÉE',
      'pinball.tip1': 'Maintiens puis relâche pour lancer', 'pinball.tip2': '◀ flip gauche · flip droit ▶'
    },
    it: {
      'towerdef.title': 'Difesa a torri', 'towerdef.desc': 'Costruisci torri e ferma le ondate', 'td.wave': 'Ondata', 'td.next': 'Prossima ondata', 'td.victory': 'Vittoria!', 'td.laser': 'Laser', 'td.cannon': 'Cannone', 'td.frost': 'Gelo', 'td.mortar': 'Mortaio', 'td.start': 'Inizia', 'td.tip': 'Tocca una piattaforma per costruire',
      'pinball.title': 'Flipper', 'pinball.desc': 'Tavolo al neon: rampa, bumper e multiball', 'pinball.ball': 'PALLA', 'pinball.over': 'FINE PARTITA', 'pinball.saved': 'PALLA SALVATA',
      'pinball.tip1': 'Tieni premuto e rilascia per lanciare', 'pinball.tip2': '◀ flipper sinistro · destro ▶'
    },
    pt: {
      'towerdef.title': 'Defesa de torres', 'towerdef.desc': 'Construa torres e segure as ondas', 'td.wave': 'Onda', 'td.next': 'Próxima onda', 'td.victory': 'Vitória!', 'td.laser': 'Laser', 'td.cannon': 'Canhão', 'td.frost': 'Gelo', 'td.mortar': 'Morteiro', 'td.start': 'Começar', 'td.tip': 'Toque numa plataforma para construir',
      'pinball.title': 'Pinball', 'pinball.desc': 'Mesa neon: rampa, bumpers e multibola', 'pinball.ball': 'BOLA', 'pinball.over': 'FIM DE JOGO', 'pinball.saved': 'BOLA SALVA',
      'pinball.tip1': 'Segure e solte para lançar', 'pinball.tip2': '◀ flipper esq. · flipper dir. ▶'
    },
    pl: {
      'towerdef.title': 'Obrona wieżami', 'towerdef.desc': 'Buduj wieże i powstrzymaj fale wrogów', 'td.wave': 'Fala', 'td.next': 'Następna fala', 'td.victory': 'Zwycięstwo!', 'td.laser': 'Laser', 'td.cannon': 'Działo', 'td.frost': 'Mróz', 'td.mortar': 'Moździerz', 'td.start': 'Start', 'td.tip': 'Dotknij platformy, by zbudować wieżę',
      'pinball.title': 'Pinball', 'pinball.desc': 'Neonowy stół: rampa, bumpery i multiball', 'pinball.ball': 'KULKA', 'pinball.over': 'KONIEC GRY', 'pinball.saved': 'KULKA URATOWANA',
      'pinball.tip1': 'Przytrzymaj i puść, by wystrzelić', 'pinball.tip2': '◀ lewy flipper · prawy flipper ▶'
    }
  };
  for (var l in add) { X[l] = X[l] || {}; for (var k in add[l]) X[l][k] = add[l][k]; }
})();
