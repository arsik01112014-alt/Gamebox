/* Переводы. Порядок значений: ru, en, uk, de, es */
(function () {
  'use strict';
  var LANGS = [
    { id: 'ru', name: 'Русский', flag: 'RU' },
    { id: 'en', name: 'English', flag: 'EN' },
    { id: 'uk', name: 'Українська', flag: 'UA' },
    { id: 'de', name: 'Deutsch', flag: 'DE' },
    { id: 'es', name: 'Español', flag: 'ES' },
    { id: 'kk', name: 'Қазақша', flag: 'KZ' },
    { id: 'tr', name: 'Türkçe', flag: 'TR' },
    { id: 'fr', name: 'Français', flag: 'FR' },
    { id: 'it', name: 'Italiano', flag: 'IT' },
    { id: 'pt', name: 'Português', flag: 'PT' },
    { id: 'pl', name: 'Polski', flag: 'PL' }
  ];
  var EXTRA = window.I18N_EXTRA || {};
  function known(l) { return IDX[l] !== undefined || !!EXTRA[l]; }
  var IDX = { ru: 0, en: 1, uk: 2, de: 3, es: 4 };

  var D = {
    /* ---------- общее ---------- */
    'app.title': ['АРКАДА', 'ARCADE', 'АРКАДА', 'ARCADE', 'ARCADE'],
    'app.tag': ['Классические мини-игры в одном приложении', 'Classic mini-games in one app', 'Класичні міні-ігри в одному застосунку', 'Klassische Minispiele in einer App', 'Minijuegos clásicos en una sola app'],
    'menu.settings': ['Настройки', 'Settings', 'Налаштування', 'Einstellungen', 'Ajustes'],
    'menu.stats': ['Сыграно партий: {0} · игр с рекордом: {1} из {2}', 'Games played: {0} · with a record: {1} of {2}', 'Зіграно партій: {0} · ігор з рекордом: {1} з {2}', 'Gespielte Runden: {0} · mit Rekord: {1} von {2}', 'Partidas jugadas: {0} · con récord: {1} de {2}'],
    'set.title': ['Настройки', 'Settings', 'Налаштування', 'Einstellungen', 'Ajustes'],
    'set.lang': ['Язык', 'Language', 'Мова', 'Sprache', 'Idioma'],
    'set.sound': ['Звуки', 'Sound effects', 'Звуки', 'Soundeffekte', 'Sonidos'],
    'set.music': ['Музыка', 'Music', 'Музика', 'Musik', 'Música'],
    'set.vibro': ['Вибрация', 'Vibration', 'Вібрація', 'Vibration', 'Vibración'],
    'set.fx': ['Частицы и эффекты', 'Particles & effects', 'Частинки та ефекти', 'Partikel & Effekte', 'Partículas y efectos'],
    'set.reset': ['Сбросить рекорды', 'Reset records', 'Скинути рекорди', 'Rekorde zurücksetzen', 'Borrar récords'],
    'set.resetAsk': ['Нажми ещё раз для подтверждения', 'Tap again to confirm', 'Натисни ще раз для підтвердження', 'Zum Bestätigen erneut tippen', 'Toca otra vez para confirmar'],
    'set.resetDone': ['Рекорды сброшены', 'Records cleared', 'Рекорди скинуто', 'Rekorde gelöscht', 'Récords borrados'],
    'set.done': ['Готово', 'Done', 'Готово', 'Fertig', 'Listo'],
    'set.version': ['Версия', 'Version', 'Версія', 'Version', 'Versión'],
    'hud.best': ['РЕКОРД', 'BEST', 'РЕКОРД', 'REKORD', 'RÉCORD'],
    'btn.play': ['Играть', 'Play', 'Грати', 'Spielen', 'Jugar'],
    'btn.resume': ['Продолжить', 'Resume', 'Продовжити', 'Weiter', 'Continuar'],
    'btn.restart': ['Заново', 'Restart', 'Заново', 'Neustart', 'Reiniciar'],
    'btn.again': ['Ещё раз', 'Play again', 'Ще раз', 'Nochmal', 'Otra vez'],
    'btn.menu': ['В меню', 'Menu', 'До меню', 'Menü', 'Menú'],
    'pause.title': ['Пауза', 'Paused', 'Пауза', 'Pause', 'Pausa'],
    'pause.score': ['Счёт', 'Score', 'Рахунок', 'Punkte', 'Puntos'],
    'over.title': ['Игра окончена', 'Game over', 'Гру завершено', 'Spiel vorbei', 'Fin del juego'],
    'over.score': ['ваш счёт', 'your score', 'ваш рахунок', 'deine Punkte', 'tu puntuación'],
    'over.best': ['рекорд: {0}', 'best: {0}', 'рекорд: {0}', 'Rekord: {0}', 'récord: {0}'],
    'over.new': ['НОВЫЙ РЕКОРД!', 'NEW RECORD!', 'НОВИЙ РЕКОРД!', 'NEUER REKORD!', '¡NUEVO RÉCORD!'],
    'toast.record': ['Новый рекорд!', 'New record!', 'Новий рекорд!', 'Neuer Rekord!', '¡Nuevo récord!'],
    'toast.level': ['Уровень {0}', 'Level {0}', 'Рівень {0}', 'Level {0}', 'Nivel {0}'],
    'diff.label': ['Сложность', 'Difficulty', 'Складність', 'Schwierigkeit', 'Dificultad'],
    'diff.0': ['Легко', 'Easy', 'Легко', 'Leicht', 'Fácil'],
    'diff.1': ['Нормально', 'Normal', 'Нормально', 'Normal', 'Normal'],
    'diff.2': ['Сложно', 'Hard', 'Складно', 'Schwer', 'Difícil'],
    'diff.3': ['Безумие', 'Insane', 'Божевілля', 'Wahnsinn', 'Locura'],
    'diff.short.0': ['ЛЕГ', 'EASY', 'ЛЕГ', 'LEICHT', 'FÁCIL'],
    'diff.short.1': ['НОРМ', 'NORM', 'НОРМ', 'NORM', 'NORM'],
    'diff.short.2': ['СЛОЖ', 'HARD', 'СКЛ', 'SCHWER', 'DIFÍC'],
    'diff.short.3': ['БЕЗУМ', 'INSANE', 'БОЖЕВ', 'IRRE', 'LOCO'],
    'ctl.duck': ['ПРИГНУТЬСЯ', 'DUCK', 'ПРИГНУТИСЬ', 'DUCKEN', 'AGACHAR'],
    'ctl.jump': ['ПРЫЖОК', 'JUMP', 'СТРИБОК', 'SPRUNG', 'SALTAR'],

    /* ---------- Змейка ---------- */
    'snake.title': ['Змейка', 'Snake', 'Змійка', 'Snake', 'Serpiente'],
    'snake.desc': ['Собирай яблоки и расти', 'Eat apples and grow', 'Збирай яблука й рости', 'Iss Äpfel und wachse', 'Come manzanas y crece'],
    'snake.hint': ['Свайпай по полю или жми стрелки. Ешь яблоки, лови золотые звёзды за бонус. Не врезайся в себя!',
      'Swipe on the field or use the arrows. Eat apples, catch golden stars for a bonus. Don\'t bite yourself!',
      'Свайпай по полю або тисни стрілки. Їж яблука, лови золоті зірки за бонус. Не вріжся в себе!',
      'Wische über das Feld oder nutze die Pfeile. Iss Äpfel, fang goldene Sterne für Bonuspunkte. Beiß dich nicht selbst!',
      'Desliza por el campo o usa las flechas. Come manzanas y atrapa estrellas doradas. ¡No te muerdas!'],
    'snake.d0': ['Медленно, проходишь сквозь стены', 'Slow, pass through walls', 'Повільно, проходиш крізь стіни', 'Langsam, durch Wände gehen', 'Lento, atraviesas paredes'],
    'snake.d1': ['Стены опасны, обычная скорость', 'Walls kill, normal speed', 'Стіни небезпечні, звичайна швидкість', 'Wände sind tödlich, normales Tempo', 'Las paredes matan, velocidad normal'],
    'snake.d2': ['Быстрее, на поле камни', 'Faster, rocks on the field', 'Швидше, на полі каміння', 'Schneller, Steine auf dem Feld', 'Más rápido, rocas en el campo'],
    'snake.d3': ['Очень быстро, много камней', 'Very fast, many rocks', 'Дуже швидко, багато каміння', 'Sehr schnell, viele Steine', 'Muy rápido, muchas rocas'],

    /* ---------- Flappy ---------- */
    'flappy.title': ['Flappy Bird', 'Flappy Bird', 'Flappy Bird', 'Flappy Bird', 'Flappy Bird'],
    'flappy.desc': ['Пролети между трубами', 'Fly between the pipes', 'Пролети між трубами', 'Flieg zwischen den Rohren', 'Vuela entre las tuberías'],
    'flappy.hint': ['Тапай по экрану, чтобы птичка взмахнула крыльями. Пролетай между трубами и не касайся земли!',
      'Tap the screen to flap. Fly between the pipes and don\'t touch the ground!',
      'Тапай по екрану, щоб пташка змахнула крилами. Пролітай між трубами й не торкайся землі!',
      'Tippe, um zu flattern. Flieg durch die Rohre und berühre nicht den Boden!',
      'Toca la pantalla para aletear. ¡Vuela entre las tuberías y no toques el suelo!'],
    'flappy.d0': ['Широкие проходы, медленно', 'Wide gaps, slow', 'Широкі проходи, повільно', 'Breite Lücken, langsam', 'Huecos amplios, lento'],
    'flappy.d1': ['Классика', 'Classic', 'Класика', 'Klassisch', 'Clásico'],
    'flappy.d2': ['Узкие проходы, быстрее', 'Narrow gaps, faster', 'Вузькі проходи, швидше', 'Enge Lücken, schneller', 'Huecos estrechos, más rápido'],
    'flappy.d3': ['Трубы двигаются вверх-вниз', 'Pipes move up and down', 'Труби рухаються вгору-вниз', 'Rohre bewegen sich auf und ab', 'Las tuberías se mueven'],

    /* ---------- Марио ---------- */
    'mario.title': ['Марио', 'Mario', 'Маріо', 'Mario', 'Mario'],
    'mario.desc': ['Беги, прыгай, дойди до флага', 'Run, jump, reach the flag', 'Біжи, стрибай, дійди до прапора', 'Lauf, spring, erreiche die Flagge', 'Corre, salta y llega a la bandera'],
    'mario.hint': ['Стрелки — бег, A — прыжок (держи дольше — прыжок выше). Прыгай врагам на голову, бей блоки «?» снизу, собирай монеты и доберись до флага!',
      'Arrows to run, A to jump (hold for higher). Stomp enemies, hit "?" blocks from below, collect coins and reach the flag!',
      'Стрілки — біг, A — стрибок (тримай довше — вище). Стрибай ворогам на голову, бий блоки «?» знизу, збирай монети й дійди до прапора!',
      'Pfeile zum Laufen, A zum Springen (länger halten = höher). Spring auf Gegner, schlag „?“-Blöcke von unten, sammle Münzen und erreiche die Flagge!',
      'Flechas para correr, A para saltar (mantén para saltar más). ¡Pisa enemigos, golpea bloques «?» desde abajo, junta monedas y llega a la bandera!'],
    'mario.d0': ['5 жизней, мало врагов, узкие ямы', '5 lives, few enemies, small pits', '5 життів, мало ворогів, вузькі ями', '5 Leben, wenige Gegner, kleine Gruben', '5 vidas, pocos enemigos, fosos pequeños'],
    'mario.d1': ['3 жизни, классический баланс', '3 lives, classic balance', '3 життя, класичний баланс', '3 Leben, klassische Balance', '3 vidas, equilibrio clásico'],
    'mario.d2': ['2 жизни, черепахи и быстрые враги', '2 lives, turtles and fast enemies', '2 життя, черепахи й швидкі вороги', '2 Leben, Schildkröten und schnelle Gegner', '2 vidas, tortugas y enemigos rápidos'],
    'mario.d3': ['1 жизнь, широкие ямы, толпы врагов', '1 life, wide pits, crowds of enemies', '1 життя, широкі ями, натовпи ворогів', '1 Leben, breite Gruben, viele Gegner', '1 vida, fosos anchos, hordas de enemigos'],
    'mario.world': ['МИР', 'WORLD', 'СВІТ', 'WELT', 'MUNDO'],
    'mario.life': ['+1 ЖИЗНЬ', '+1 LIFE', '+1 ЖИТТЯ', '+1 LEBEN', '+1 VIDA'],
    'mario.time': ['ВРЕМЯ', 'TIME', 'ЧАС', 'ZEIT', 'TIEMPO'],

    /* ---------- Тетрис ---------- */
    'tetris.title': ['Тетрис', 'Tetris', 'Тетріс', 'Tetris', 'Tetris'],
    'tetris.desc': ['Собирай целые линии', 'Complete full lines', 'Збирай повні лінії', 'Fülle ganze Reihen', 'Completa líneas'],
    'tetris.hint': ['Стрелки влево/вправо — сдвиг, вниз — ускорить, круглая кнопка — поворот, кнопка с чертой — сбросить вниз. Жесты: тап — поворот, свайп — сдвиг, свайп вниз — сброс.',
      'Left/right arrows move, down speeds up, round button rotates, the bar button hard-drops. Gestures: tap rotates, swipe moves, swipe down drops.',
      'Стрілки вліво/вправо — зсув, вниз — пришвидшити, кругла кнопка — поворот, кнопка з рискою — скинути вниз. Жести: тап — поворот, свайп — зсув, свайп вниз — скидання.',
      'Pfeile links/rechts bewegen, runter beschleunigt, runde Taste dreht, Balken-Taste lässt fallen. Gesten: Tippen dreht, Wischen bewegt, nach unten wischen lässt fallen.',
      'Flechas izquierda/derecha mueven, abajo acelera, el botón redondo gira, el de la barra deja caer. Gestos: toque gira, deslizar mueve, deslizar abajo deja caer.'],
    'tetris.d0': ['Медленно, тень фигуры', 'Slow, ghost piece', 'Повільно, тінь фігури', 'Langsam, Schattenstein', 'Lento, pieza fantasma'],
    'tetris.d1': ['Старт с 1 уровня', 'Start at level 1', 'Старт з 1 рівня', 'Start auf Level 1', 'Empieza en nivel 1'],
    'tetris.d2': ['Старт с 5 уровня, мусор снизу', 'Start at level 5, garbage rows', 'Старт з 5 рівня, сміття знизу', 'Start auf Level 5, Müllreihen', 'Nivel 5, filas de basura'],
    'tetris.d3': ['Уровень 10, без тени', 'Level 10, no ghost', 'Рівень 10, без тіні', 'Level 10, kein Schatten', 'Nivel 10, sin fantasma'],
    'tetris.next': ['ДАЛЕЕ', 'NEXT', 'ДАЛІ', 'NÄCHSTER', 'SIGUIENTE'],
    'tetris.level': ['УРОВЕНЬ', 'LEVEL', 'РІВЕНЬ', 'LEVEL', 'NIVEL'],
    'tetris.lines': ['ЛИНИИ', 'LINES', 'ЛІНІЇ', 'REIHEN', 'LÍNEAS'],
    'tetris.score': ['ОЧКИ', 'SCORE', 'ОЧКИ', 'PUNKTE', 'PUNTOS'],
    'tetris.l2': ['Двойная!', 'Double!', 'Подвійна!', 'Doppel!', '¡Doble!'],
    'tetris.l3': ['Тройная!', 'Triple!', 'Потрійна!', 'Dreifach!', '¡Triple!'],
    'tetris.l4': ['ТЕТРИС!', 'TETRIS!', 'ТЕТРІС!', 'TETRIS!', '¡TETRIS!'],

    /* ---------- 2048 ---------- */
    'g2048.title': ['2048', '2048', '2048', '2048', '2048'],
    'g2048.desc': ['Соединяй одинаковые плитки', 'Merge matching tiles', 'Поєднуй однакові плитки', 'Verbinde gleiche Kacheln', 'Une fichas iguales'],
    'g2048.hint': ['Свайпай в любую сторону — все плитки сдвинутся. Две одинаковые сливаются в одну. Собери плитку 2048!',
      'Swipe in any direction to slide all tiles. Two equal tiles merge into one. Reach the 2048 tile!',
      'Свайпай у будь-який бік — усі плитки зсунуться. Дві однакові зливаються в одну. Збери плитку 2048!',
      'Wische in eine Richtung, um alle Kacheln zu schieben. Zwei gleiche verschmelzen. Erreiche 2048!',
      'Desliza en cualquier dirección. Dos fichas iguales se unen. ¡Llega a 2048!'],
    'g2048.d0': ['Поле 5×5, есть отмена хода', '5×5 board, undo available', 'Поле 5×5, є скасування ходу', '5×5-Feld, Rückgängig möglich', 'Tablero 5×5, deshacer'],
    'g2048.d1': ['Классическое поле 4×4', 'Classic 4×4 board', 'Класичне поле 4×4', 'Klassisches 4×4-Feld', 'Tablero clásico 4×4'],
    'g2048.d2': ['4×4, часто выпадают четвёрки', '4×4, more 4s spawn', '4×4, часто випадають четвірки', '4×4, öfter Vierer', '4×4, salen más cuatros'],
    'g2048.d3': ['Тесное поле 3×3', 'Tiny 3×3 board', 'Тісне поле 3×3', 'Enges 3×3-Feld', 'Tablero diminuto 3×3'],
    'g2048.bestTile': ['ЛУЧШАЯ ПЛИТКА', 'BEST TILE', 'НАЙКРАЩА ПЛИТКА', 'BESTE KACHEL', 'MEJOR FICHA'],
    'g2048.noMoves': ['Ходов нет!', 'No moves left!', 'Ходів немає!', 'Keine Züge mehr!', '¡Sin movimientos!'],
    'g2048.swipe': ['свайпай по экрану', 'swipe on the screen', 'свайпай по екрану', 'über den Bildschirm wischen', 'desliza por la pantalla'],
    'g2048.win': ['2048! Победа! Играем дальше', '2048! You win! Keep going', '2048! Перемога! Граємо далі', '2048! Gewonnen! Weiter geht\'s', '¡2048! ¡Ganaste! Sigue'],
    'g2048.undo': ['ОТМЕНА', 'UNDO', 'СКАСУВАТИ', 'ZURÜCK', 'DESHACER'],
    'g2048.moves': ['ХОДЫ', 'MOVES', 'ХОДИ', 'ZÜGE', 'MOVIM.'],

    /* ---------- Арканоид ---------- */
    'breakout.title': ['Арканоид', 'Breakout', 'Арканоїд', 'Breakout', 'Arkanoid'],
    'breakout.desc': ['Разбей все кирпичи', 'Smash all the bricks', 'Розбий усі цеглини', 'Zerschlage alle Steine', 'Rompe todos los ladrillos'],
    'breakout.hint': ['Води пальцем по экрану — платформа двигается за ним. Отпусти палец, чтобы запустить мяч. Лови бонусы: W — шире, M — мульти-мяч, S — медленнее, L — лазер, ♥ — жизнь.',
      'Drag your finger — the paddle follows. Release to launch the ball. Catch bonuses: W wider, M multi-ball, S slower, L laser, ♥ life.',
      'Води пальцем по екрану — платформа рухається за ним. Відпусти палець, щоб запустити м\'яч. Бонуси: W — ширше, M — мульти-м\'яч, S — повільніше, L — лазер, ♥ — життя.',
      'Zieh mit dem Finger — der Schläger folgt. Loslassen startet den Ball. Boni: W breiter, M Multiball, S langsamer, L Laser, ♥ Leben.',
      'Arrastra el dedo y la paleta lo sigue. Suelta para lanzar la bola. Bonos: W más ancha, M multibola, S más lenta, L láser, ♥ vida.'],
    'breakout.d0': ['Широкая платформа, 5 жизней', 'Wide paddle, 5 lives', 'Широка платформа, 5 життів', 'Breiter Schläger, 5 Leben', 'Paleta ancha, 5 vidas'],
    'breakout.d1': ['3 жизни, обычный мяч', '3 lives, normal ball', '3 життя, звичайний м\'яч', '3 Leben, normaler Ball', '3 vidas, bola normal'],
    'breakout.d2': ['Быстрый мяч, прочные кирпичи', 'Fast ball, tough bricks', 'Швидкий м\'яч, міцні цеглини', 'Schneller Ball, harte Steine', 'Bola rápida, ladrillos duros'],
    'breakout.d3': ['1 жизнь, узкая платформа', '1 life, narrow paddle', '1 життя, вузька платформа', '1 Leben, schmaler Schläger', '1 vida, paleta estrecha'],
    'breakout.level': ['УРОВЕНЬ', 'LEVEL', 'РІВЕНЬ', 'LEVEL', 'NIVEL'],
    'breakout.combo': ['КОМБО', 'COMBO', 'КОМБО', 'COMBO', 'COMBO'],
    'breakout.release': ['отпусти палец — запуск', 'release to launch', 'відпусти палець — запуск', 'loslassen zum Starten', 'suelta para lanzar'],
    'breakout.wide': ['Широкая платформа!', 'Wide paddle!', 'Широка платформа!', 'Breiter Schläger!', '¡Paleta ancha!'],
    'breakout.slow': ['Замедление!', 'Slow ball!', 'Сповільнення!', 'Zeitlupe!', '¡Bola lenta!'],
    'breakout.life': ['+1 жизнь', '+1 life', '+1 життя', '+1 Leben', '+1 vida'],
    'breakout.multi': ['Мульти-мяч!', 'Multi-ball!', 'Мульти-м\'яч!', 'Multiball!', '¡Multibola!'],
    'breakout.laser': ['Лазер!', 'Laser!', 'Лазер!', 'Laser!', '¡Láser!'],

    /* ---------- Космос ---------- */
    'space.title': ['Космос', 'Space', 'Космос', 'Weltraum', 'Espacio'],
    'space.desc': ['Отбей атаку пришельцев', 'Repel the alien attack', 'Відбий атаку прибульців', 'Wehre die Aliens ab', 'Repele a los alienígenas'],
    'space.hint': ['Води пальцем по экрану — корабль летит за ним и стреляет сам. Сбивай врагов, уворачивайся от пуль и астероидов. Бонусы: P — мощнее пушка, + — ремонт, щит — защита.',
      'Drag your finger — the ship follows and fires on its own. Shoot enemies, dodge bullets and asteroids. Bonuses: P stronger gun, + repair, shield — protection.',
      'Води пальцем по екрану — корабель летить за ним і стріляє сам. Збивай ворогів, ухиляйся від куль і астероїдів. Бонуси: P — потужніша гармата, + — ремонт, щит — захист.',
      'Zieh mit dem Finger — das Schiff folgt und feuert selbst. Triff Gegner, weiche Kugeln und Asteroiden aus. Boni: P stärkere Kanone, + Reparatur, Schild.',
      'Arrastra el dedo: la nave te sigue y dispara sola. Derriba enemigos, esquiva balas y asteroides. Bonos: P más potencia, + reparar, escudo.'],
    'space.d0': ['Мало врагов, 5 ячеек брони', 'Few enemies, 5 armor', 'Мало ворогів, 5 броні', 'Wenige Gegner, 5 Panzerung', 'Pocos enemigos, 5 de blindaje'],
    'space.d1': ['Обычные волны, 3 брони', 'Normal waves, 3 armor', 'Звичайні хвилі, 3 броні', 'Normale Wellen, 3 Panzerung', 'Oleadas normales, 3 de blindaje'],
    'space.d2': ['Плотные волны, быстрые пули', 'Dense waves, fast bullets', 'Щільні хвилі, швидкі кулі', 'Dichte Wellen, schnelle Kugeln', 'Oleadas densas, balas rápidas'],
    'space.d3': ['Шквал пуль, 1 броня', 'Bullet hell, 1 armor', 'Шквал куль, 1 броня', 'Kugelhagel, 1 Panzerung', 'Lluvia de balas, 1 de blindaje'],
    'space.gun': ['ПУШКА', 'GUN', 'ГАРМАТА', 'KANONE', 'CAÑÓN'],
    'space.repair': ['Ремонт +1', 'Repair +1', 'Ремонт +1', 'Reparatur +1', 'Reparación +1'],
    'space.gunUp': ['Пушка усилена!', 'Gun upgraded!', 'Гармату посилено!', 'Kanone verbessert!', '¡Cañón mejorado!'],
    'space.gunMax': ['Пушка: максимум!', 'Gun maxed!', 'Гармата: максимум!', 'Kanone: Maximum!', '¡Cañón al máximo!'],
    'space.shield': ['Щит!', 'Shield!', 'Щит!', 'Schild!', '¡Escudo!'],
    'space.boss': ['БОСС!', 'BOSS!', 'БОС!', 'BOSS!', '¡JEFE!'],
    'space.wave': ['ВОЛНА', 'WAVE', 'ХВИЛЯ', 'WELLE', 'OLEADA'],


    /* ---------- Сапёр ---------- */
    'mines.title': ['Сапёр', 'Minesweeper', 'Сапер', 'Minesweeper', 'Buscaminas'],
    'mines.desc': ['Найди все мины', 'Find all the mines', 'Знайди всі міни', 'Finde alle Minen', 'Encuentra todas las minas'],
    'mines.hint': ['Тап — открыть клетку, удержание — поставить флажок (или включи режим флажков). Цифра показывает, сколько мин рядом. Тап по цифре с флажками вокруг открывает соседей.',
      'Tap to open a cell, hold to place a flag (or switch on flag mode). A number shows how many mines are nearby. Tap a number with all flags placed to open its neighbours.',
      'Тап — відкрити клітинку, утримання — поставити прапорець (або увімкни режим прапорців). Цифра показує, скільки мін поруч. Тап по цифрі з прапорцями відкриває сусідів.',
      'Tippen öffnet ein Feld, Halten setzt eine Flagge (oder Flaggenmodus einschalten). Die Zahl zeigt die Minen in der Nähe. Tippe auf eine Zahl mit allen Flaggen, um Nachbarn zu öffnen.',
      'Toca para abrir una casilla, mantén para poner bandera (o activa el modo bandera). El número indica cuántas minas hay cerca. Toca un número con todas sus banderas para abrir los vecinos.'],
    'mines.d0': ['Поле 8×10, 10 мин', '8×10 field, 10 mines', 'Поле 8×10, 10 мін', '8×10-Feld, 10 Minen', 'Campo 8×10, 10 minas'],
    'mines.d1': ['Поле 9×12, 18 мин', '9×12 field, 18 mines', 'Поле 9×12, 18 мін', '9×12-Feld, 18 Minen', 'Campo 9×12, 18 minas'],
    'mines.d2': ['Поле 10×14, 30 мин', '10×14 field, 30 mines', 'Поле 10×14, 30 мін', '10×14-Feld, 30 Minen', 'Campo 10×14, 30 minas'],
    'mines.d3': ['Поле 11×16, 44 мины', '11×16 field, 44 mines', 'Поле 11×16, 44 міни', '11×16-Feld, 44 Minen', 'Campo 11×16, 44 minas'],
    'mines.win': ['Все мины найдены!', 'All mines found!', 'Усі міни знайдено!', 'Alle Minen gefunden!', '¡Todas las minas encontradas!'],
    'mines.flagOn': ['Флажки', 'Flags', 'Прапорці', 'Flaggen', 'Banderas'],
    'mines.flagOff': ['Копать', 'Dig', 'Копати', 'Graben', 'Cavar'],
    'mines.tip': ['Первый ход всегда безопасен', 'The first move is always safe', 'Перший хід завжди безпечний', 'Der erste Zug ist immer sicher', 'El primer movimiento siempre es seguro'],

    /* ---------- Пакман ---------- */
    'pacman.title': ['Пакман', 'Pac-Man', 'Пакмен', 'Pac-Man', 'Pac-Man'],
    'pacman.desc': ['Съешь все точки в лабиринте', 'Eat every dot in the maze', 'З\'їж усі крапки в лабіринті', 'Friss alle Punkte im Labyrinth', 'Come todos los puntos del laberinto'],
    'pacman.hint': ['Свайпай или жми стрелки — Пакман повернёт на ближайшем перекрёстке. Большая точка пугает призраков — тогда их можно съесть!',
      'Swipe or use the arrows — Pac-Man turns at the next junction. A big dot scares the ghosts — then you can eat them!',
      'Свайпай або тисни стрілки — Пакмен поверне на найближчому перехресті. Велика крапка лякає привидів — тоді їх можна з\'їсти!',
      'Wische oder nutze die Pfeile — Pac-Man biegt an der nächsten Kreuzung ab. Ein großer Punkt erschreckt die Geister — dann kannst du sie fressen!',
      'Desliza o usa las flechas: Pac-Man gira en el siguiente cruce. Un punto grande asusta a los fantasmas y entonces puedes comértelos.'],
    'pacman.d0': ['2 медленных призрака, 4 жизни', '2 slow ghosts, 4 lives', '2 повільні привиди, 4 життя', '2 langsame Geister, 4 Leben', '2 fantasmas lentos, 4 vidas'],
    'pacman.d1': ['4 призрака, классика', '4 ghosts, classic', '4 привиди, класика', '4 Geister, klassisch', '4 fantasmas, clásico'],
    'pacman.d2': ['Быстрые призраки, короткий испуг', 'Fast ghosts, short fright', 'Швидкі привиди, короткий переляк', 'Schnelle Geister, kurze Angst', 'Fantasmas rápidos, susto corto'],
    'pacman.d3': ['Очень быстрые, 2 жизни', 'Very fast, 2 lives', 'Дуже швидкі, 2 життя', 'Sehr schnell, 2 Leben', 'Muy rápidos, 2 vidas'],
    'pacman.ready': ['ГОТОВ!', 'READY!', 'ГОТОВИЙ!', 'BEREIT!', '¡LISTO!'],

    /* ---------- Три в ряд ---------- */
    'match3.title': ['Три в ряд', 'Match 3', 'Три в ряд', 'Drei gewinnt', 'Tres en raya'],
    'match3.desc': ['Собирай самоцветы в ряды', 'Line up the gems', 'Збирай самоцвіти в ряди', 'Reihe Edelsteine auf', 'Alinea las gemas'],
    'match3.hint': ['Проведи пальцем по камню, чтобы поменять его с соседним. Три и больше одинаковых в ряд исчезают. 4 в ряд — бомба, 5 — молния. Успей до конца времени!',
      'Swipe a gem to swap it with a neighbour. Three or more in a row vanish. 4 in a row makes a bomb, 5 makes lightning. Beat the clock!',
      'Проведи пальцем по каменю, щоб поміняти його з сусіднім. Три й більше однакових у ряд зникають. 4 в ряд — бомба, 5 — блискавка. Встигни до кінця часу!',
      'Wische über einen Stein, um ihn zu tauschen. Drei oder mehr gleiche in einer Reihe verschwinden. 4 ergeben eine Bombe, 5 einen Blitz. Schlag die Uhr!',
      'Desliza una gema para cambiarla con la vecina. Tres o más iguales en línea desaparecen. 4 crean una bomba, 5 un rayo. ¡Gana al reloj!'],
    'match3.d0': ['5 цветов, 120 секунд', '5 colours, 120 seconds', '5 кольорів, 120 секунд', '5 Farben, 120 Sekunden', '5 colores, 120 segundos'],
    'match3.d1': ['6 цветов, 90 секунд', '6 colours, 90 seconds', '6 кольорів, 90 секунд', '6 Farben, 90 Sekunden', '6 colores, 90 segundos'],
    'match3.d2': ['6 цветов, 60 секунд', '6 colours, 60 seconds', '6 кольорів, 60 секунд', '6 Farben, 60 Sekunden', '6 colores, 60 segundos'],
    'match3.d3': ['7 цветов, 45 секунд, без подсказок', '7 colours, 45 s, no hints', '7 кольорів, 45 с, без підказок', '7 Farben, 45 s, keine Tipps', '7 colores, 45 s, sin pistas'],
    'match3.sec': ['сек', 'sec', 'сек', 's', 's'],
    'match3.timeUp': ['Время вышло!', 'Time\'s up!', 'Час вийшов!', 'Zeit ist um!', '¡Se acabó el tiempo!'],

    /* ---------- Pong ---------- */
    'pong.title': ['Pong', 'Pong', 'Pong', 'Pong', 'Pong'],
    'pong.desc': ['Против компьютера или вдвоём', 'Vs computer or two players', 'Проти комп\'ютера або вдвох', 'Gegen CPU oder zu zweit', 'Contra la CPU o a dos'],
    'pong.hint': ['Води пальцем внизу экрана — двигай свою ракетку. Не пропусти мяч! Чтобы играть вдвоём, второй игрок просто касается верхней половины. Игра до 7 очков.',
      'Drag along the bottom of the screen to move your paddle. Don\'t miss the ball! For two players, the second player just touches the top half. First to 7 wins.',
      'Води пальцем унизу екрана — рухай свою ракетку. Не пропусти м\'яч! Щоб грати вдвох, другий гравець просто торкається верхньої половини. Гра до 7 очок.',
      'Zieh unten am Bildschirm, um deinen Schläger zu bewegen. Verpass den Ball nicht! Zu zweit tippt der zweite Spieler einfach in die obere Hälfte. Bis 7 Punkte.',
      'Arrastra en la parte inferior para mover tu pala. ¡No dejes pasar la bola! Para jugar a dos, el segundo jugador toca la mitad superior. Gana quien llegue a 7.'],
    'pong.d0': ['Медленный соперник', 'Slow opponent', 'Повільний суперник', 'Langsamer Gegner', 'Rival lento'],
    'pong.d1': ['Обычный соперник', 'Normal opponent', 'Звичайний суперник', 'Normaler Gegner', 'Rival normal'],
    'pong.d2': ['Ловкий соперник, быстрый мяч', 'Skilled opponent, fast ball', 'Спритний суперник, швидкий м\'яч', 'Geschickter Gegner, schneller Ball', 'Rival hábil, bola rápida'],
    'pong.d3': ['Почти непобедимый', 'Nearly unbeatable', 'Майже непереможний', 'Fast unschlagbar', 'Casi invencible'],
    'pong.two': ['Режим на двоих!', 'Two-player mode!', 'Режим на двох!', 'Zwei-Spieler-Modus!', '¡Modo dos jugadores!'],
    'pong.p1': ['ИГРОК 1', 'PLAYER 1', 'ГРАВЕЦЬ 1', 'SPIELER 1', 'JUGADOR 1'],
    'pong.p2': ['ИГРОК 2', 'PLAYER 2', 'ГРАВЕЦЬ 2', 'SPIELER 2', 'JUGADOR 2'],
    'pong.cpu': ['КОМПЬЮТЕР', 'COMPUTER', 'КОМП\'ЮТЕР', 'COMPUTER', 'CPU'],
    'pong.you': ['ВЫ', 'YOU', 'ВИ', 'DU', 'TÚ'],
    'pong.win': ['Победа!', 'You win!', 'Перемога!', 'Gewonnen!', '¡Victoria!'],
    'pong.lose': ['Поражение', 'You lose', 'Поразка', 'Verloren', 'Derrota'],
    'pong.p1win': ['Игрок 1 победил!', 'Player 1 wins!', 'Гравець 1 переміг!', 'Spieler 1 gewinnt!', '¡Gana el jugador 1!'],
    'pong.p2win': ['Игрок 2 победил!', 'Player 2 wins!', 'Гравець 2 переміг!', 'Spieler 2 gewinnt!', '¡Gana el jugador 2!'],
    'pong.tip': ['коснись верха — играть вдвоём', 'touch the top to play with two', 'торкнись верху — грати вдвох', 'oben tippen für zwei Spieler', 'toca arriba para jugar a dos'],

    /* ---------- Дино ---------- */
    'dino.title': ['Дино', 'Dino', 'Діно', 'Dino', 'Dino'],
    'dino.desc': ['Беги и перепрыгивай кактусы', 'Run and jump over cacti', 'Біжи й перестрибуй кактуси', 'Lauf und spring über Kakteen', 'Corre y salta los cactus'],
    'dino.hint': ['Тап по экрану или кнопка «Прыжок» — прыжок (держи дольше — выше). «Пригнуться» — проскочить под птицей. Скорость всё время растёт!',
      'Tap the screen or JUMP to jump (hold for higher). DUCK to slip under birds. The speed keeps rising!',
      'Тап по екрану або «Стрибок» — стрибок (тримай довше — вище). «Пригнутись» — проскочити під птахом. Швидкість постійно зростає!',
      'Tippe oder SPRUNG zum Springen (halten = höher). DUCKEN, um unter Vögeln durchzukommen. Das Tempo steigt ständig!',
      'Toca la pantalla o SALTAR (mantén para más altura). AGACHAR para pasar bajo los pájaros. ¡La velocidad no para de subir!'],
    'dino.d0': ['Медленно, только кактусы', 'Slow, cacti only', 'Повільно, лише кактуси', 'Langsam, nur Kakteen', 'Lento, solo cactus'],
    'dino.d1': ['Птицы с 250 очков', 'Birds from 250 points', 'Птахи з 250 очок', 'Vögel ab 250 Punkten', 'Pájaros desde 250 puntos'],
    'dino.d2': ['Быстрый старт, птицы сразу', 'Fast start, birds at once', 'Швидкий старт, птахи одразу', 'Schneller Start, sofort Vögel', 'Inicio rápido, pájaros ya'],
    'dino.d3': ['Максимальный разгон и группы', 'Top speed and big groups', 'Максимальний розгін і групи', 'Höchsttempo und Gruppen', 'Velocidad máxima y grupos'],
    'dino.hi': ['РЕК', 'HI', 'РЕК', 'HI', 'MÁX']
  };

  var MORE = window.I18N_MORE || {};
  for (var mk in MORE) D[mk] = MORE[mk];

  var lang = 'ru';
  try {
    var saved = JSON.parse(localStorage.getItem('lang'));
    if (saved && known(saved)) lang = saved;
    else {
      var nav = (navigator.language || 'ru').slice(0, 2).toLowerCase();
      if (known(nav)) lang = nav;
    }
  } catch (e) { }

  function t(key) {
    var row = D[key], s;
    if (EXTRA[lang] && EXTRA[lang][key]) s = EXTRA[lang][key];
    else if (!row) s = key;
    else if (IDX[lang] !== undefined) s = row[IDX[lang]] || row[0];
    else s = row[1];
    for (var i = 1; i < arguments.length; i++) s = s.split('{' + (i - 1) + '}').join(arguments[i]);
    return s;
  }

  window.I18N = {
    LANGS: LANGS,
    t: t,
    get lang() { return lang; },
    set: function (l) {
      if (!known(l)) return;
      lang = l;
      try { localStorage.setItem('lang', JSON.stringify(l)); } catch (e) { }
      document.documentElement.lang = l;
    },
    has: function (key) { return !!D[key]; },
    keys: function () { return Object.keys(D); },
    en: function (key) { return D[key] ? D[key][1] : ''; }
  };
  document.documentElement.lang = lang;
})();
