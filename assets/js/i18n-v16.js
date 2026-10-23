/* Тексты v1.6: новые игры (башня, прыгун, пары, крот, саймон), FPS и качество графики.
   Базовые языки — массивы [ru, en, uk, de, es]; дополнительные — объекты по языкам. */
Object.assign(window.I18N_MORE = window.I18N_MORE || {}, {
  /* ---------- настройки ---------- */
  'set.secGraphics': ['Графика', 'Graphics', 'Графіка', 'Grafik', 'Gráficos'],
  'set.secSound': ['Звук и отклик', 'Sound & feedback', 'Звук і відгук', 'Ton & Feedback', 'Sonido y respuesta'],
  'set.secData': ['Данные', 'Data', 'Дані', 'Daten', 'Datos'],
  'set.fps': ['Частота кадров', 'Frame rate', 'Частота кадрів', 'Bildrate', 'Fotogramas'],
  'set.fpsMax': ['Макс', 'Max', 'Макс', 'Max', 'Máx'],
  'set.fpsNote': ['90 и 120 FPS работают только на экранах с такой частотой. 30 FPS экономит батарею.',
    '90 and 120 FPS only work on screens with that refresh rate. 30 FPS saves battery.',
    '90 і 120 FPS працюють лише на екранах з такою частотою. 30 FPS економить батарею.',
    '90 und 120 FPS gehen nur auf Displays mit dieser Bildrate. 30 FPS spart Akku.',
    '90 y 120 FPS solo funcionan en pantallas con esa frecuencia. 30 FPS ahorra batería.'],
  'set.showFps': ['Показывать счётчик FPS', 'Show FPS counter', 'Показувати лічильник FPS', 'FPS-Anzeige', 'Mostrar contador de FPS'],
  'set.quality': ['Качество графики', 'Graphics quality', 'Якість графіки', 'Grafikqualität', 'Calidad gráfica'],
  'q.0': ['Низкое', 'Low', 'Низька', 'Niedrig', 'Baja'],
  'q.1': ['Среднее', 'Medium', 'Середня', 'Mittel', 'Media'],
  'q.2': ['Высокое', 'High', 'Висока', 'Hoch', 'Alta'],
  'menu.recent': ['Недавние', 'Recent', 'Нещодавні', 'Zuletzt', 'Recientes'],
  'menu.hello': ['Во что сыграем?', 'What shall we play?', 'У що зіграємо?', 'Was spielen wir?', '¿A qué jugamos?'],

  /* ---------- Башня ---------- */
  'stack.title': ['Башня', 'Stack', 'Вежа', 'Turm', 'Torre'],
  'stack.desc': ['Строй башню до небес', 'Build a tower to the sky', 'Будуй вежу до неба', 'Bau einen Turm bis zum Himmel', 'Construye una torre hasta el cielo'],
  'stack.hint': ['Тапни, чтобы опустить блок. Всё, что свисает, отрежется. Ставь точно — за серию идеальных блоков он снова станет шире!',
    'Tap to drop the block. Any overhang gets cut off. Place blocks perfectly — a perfect streak makes the block wider again!',
    'Тапни, щоб опустити блок. Усе, що звисає, відріжеться. Став точно — за серію ідеальних блоків він знову стане ширшим!',
    'Tippe, um den Block abzusetzen. Überstand wird abgeschnitten. Triff genau — eine Perfekt-Serie macht den Block wieder breiter!',
    'Toca para soltar el bloque. Lo que sobresale se corta. ¡Coloca con precisión: una racha perfecta lo vuelve a ensanchar!'],
  'stack.d0': ['Медленно, широкие блоки', 'Slow, wide blocks', 'Повільно, широкі блоки', 'Langsam, breite Blöcke', 'Lento, bloques anchos'],
  'stack.d1': ['Обычная скорость', 'Normal speed', 'Звичайна швидкість', 'Normales Tempo', 'Velocidad normal'],
  'stack.d2': ['Быстро, узкие блоки', 'Fast, narrow blocks', 'Швидко, вузькі блоки', 'Schnell, schmale Blöcke', 'Rápido, bloques estrechos'],
  'stack.d3': ['Очень быстро', 'Very fast', 'Дуже швидко', 'Sehr schnell', 'Muy rápido'],
  'stack.grow': ['Блок шире!', 'Wider block!', 'Блок ширший!', 'Breiterer Block!', '¡Bloque más ancho!'],

  /* ---------- Прыгун ---------- */
  'jumper.title': ['Прыгун', 'Jumper', 'Стрибун', 'Hüpfer', 'Saltarín'],
  'jumper.desc': ['Прыгай всё выше', 'Jump higher and higher', 'Стрибай усе вище', 'Spring immer höher', 'Salta cada vez más alto'],
  'jumper.hint': ['Держи палец слева или справа, чтобы смещаться. Прыжки — сами. Пружины подбрасывают высоко, коричневые платформы ломаются. Не падай!',
    'Hold the left or right side to move. Jumping is automatic. Springs launch you high, brown platforms break. Don\'t fall!',
    'Тримай палець ліворуч або праворуч, щоб рухатися. Стрибки — самі. Пружини підкидають високо, коричневі платформи ламаються. Не падай!',
    'Halte links oder rechts gedrückt, um dich zu bewegen. Gesprungen wird automatisch. Federn schleudern hoch, braune Plattformen brechen. Nicht fallen!',
    'Mantén pulsado a la izquierda o derecha para moverte. Los saltos son automáticos. Los muelles te lanzan alto, las plataformas marrones se rompen. ¡No caigas!'],
  'jumper.d0': ['Много платформ', 'Lots of platforms', 'Багато платформ', 'Viele Plattformen', 'Muchas plataformas'],
  'jumper.d1': ['Обычно', 'Normal', 'Звичайно', 'Normal', 'Normal'],
  'jumper.d2': ['Больше ломких и движущихся', 'More breaking and moving', 'Більше ламких і рухомих', 'Mehr brüchige und bewegliche', 'Más frágiles y móviles'],
  'jumper.d3': ['Редкие узкие платформы', 'Sparse narrow platforms', 'Рідкі вузькі платформи', 'Wenige schmale Plattformen', 'Plataformas escasas y estrechas'],

  /* ---------- Пары ---------- */
  'memory.title': ['Пары', 'Memory', 'Пари', 'Memory', 'Parejas'],
  'memory.desc': ['Тренируй память', 'Train your memory', 'Тренуй пам\'ять', 'Trainiere dein Gedächtnis', 'Entrena tu memoria'],
  'memory.hint': ['Открывай по две карточки. Совпали — остаются открытыми. Найди все пары быстрее и с меньшим числом ходов!',
    'Flip two cards at a time. Matching pairs stay open. Find all pairs faster and in fewer moves!',
    'Відкривай по дві картки. Збіглися — лишаються відкритими. Знайди всі пари швидше і за менше ходів!',
    'Decke jeweils zwei Karten auf. Paare bleiben offen. Finde alle Paare schneller und mit weniger Zügen!',
    'Gira dos cartas a la vez. Las parejas quedan abiertas. ¡Encuentra todas más rápido y en menos jugadas!'],
  'memory.d0': ['6 пар, подсказка 2 с', '6 pairs, 2 s preview', '6 пар, підказка 2 с', '6 Paare, 2 s Vorschau', '6 parejas, vista 2 s'],
  'memory.d1': ['8 пар, подсказка 1,5 с', '8 pairs, 1.5 s preview', '8 пар, підказка 1,5 с', '8 Paare, 1,5 s Vorschau', '8 parejas, vista 1,5 s'],
  'memory.d2': ['10 пар, подсказка 1 с', '10 pairs, 1 s preview', '10 пар, підказка 1 с', '10 Paare, 1 s Vorschau', '10 parejas, vista 1 s'],
  'memory.d3': ['15 пар без подсказки', '15 pairs, no preview', '15 пар без підказки', '15 Paare ohne Vorschau', '15 parejas sin vista'],
  'memory.moves': ['Ходы', 'Moves', 'Ходи', 'Züge', 'Jugadas'],
  'memory.remember': ['Запоминай!', 'Memorize!', 'Запам\'ятовуй!', 'Merken!', '¡Memoriza!'],

  /* ---------- Крот ---------- */
  'mole.title': ['Крот', 'Whack-a-Mole', 'Кріт', 'Maulwurf', 'Topo'],
  'mole.desc': ['Бей кротов на скорость', 'Whack moles fast', 'Бий кротів на швидкість', 'Hau die Maulwürfe', 'Golpea topos rápido'],
  'mole.hint': ['Тапай по кротам, пока они не спрятались. Золотой крот — бонус и +3 секунды. Бомбы не трогай: −5 секунд! Промахи сбивают серию.',
    'Tap the moles before they hide. A golden mole gives a bonus and +3 seconds. Don\'t touch bombs: −5 seconds! Misses break your combo.',
    'Тапай по кротах, поки вони не сховалися. Золотий кріт — бонус і +3 секунди. Бомби не чіпай: −5 секунд! Промахи збивають серію.',
    'Tippe die Maulwürfe, bevor sie verschwinden. Goldener Maulwurf: Bonus und +3 Sekunden. Bomben nicht berühren: −5 Sekunden! Fehlschläge beenden die Serie.',
    'Toca los topos antes de que se escondan. El topo dorado da bonus y +3 segundos. ¡No toques las bombas: −5 segundos! Fallar rompe el combo.'],
  'mole.d0': ['45 секунд, без бомб', '45 seconds, no bombs', '45 секунд, без бомб', '45 Sekunden, keine Bomben', '45 segundos, sin bombas'],
  'mole.d1': ['40 секунд, редкие бомбы', '40 seconds, rare bombs', '40 секунд, рідкісні бомби', '40 Sekunden, seltene Bomben', '40 segundos, pocas bombas'],
  'mole.d2': ['Быстрые кроты, больше бомб', 'Fast moles, more bombs', 'Швидкі кроти, більше бомб', 'Schnelle Maulwürfe, mehr Bomben', 'Topos rápidos, más bombas'],
  'mole.d3': ['35 секунд, хаос', '35 seconds of chaos', '35 секунд хаосу', '35 Sekunden Chaos', '35 segundos de caos'],

  /* ---------- Саймон ---------- */
  'simon.title': ['Саймон', 'Simon', 'Саймон', 'Simon', 'Simón'],
  'simon.desc': ['Повтори мелодию', 'Repeat the tune', 'Повтори мелодію', 'Wiederhole die Melodie', 'Repite la melodía'],
  'simon.hint': ['Запомни, какие кнопки загорелись, и нажми их в том же порядке. С каждым раундом цепочка длиннее и быстрее.',
    'Remember which buttons light up and tap them in the same order. Each round the chain gets longer and faster.',
    'Запам\'ятай, які кнопки засвітилися, і натисни їх у тому ж порядку. З кожним раундом ланцюжок довший і швидший.',
    'Merke dir, welche Tasten aufleuchten, und tippe sie in derselben Reihenfolge. Jede Runde wird die Kette länger und schneller.',
    'Recuerda qué botones se iluminan y tócalos en el mismo orden. Cada ronda la cadena es más larga y rápida.'],
  'simon.d0': ['4 кнопки, медленно', '4 buttons, slow', '4 кнопки, повільно', '4 Tasten, langsam', '4 botones, lento'],
  'simon.d1': ['4 кнопки', '4 buttons', '4 кнопки', '4 Tasten', '4 botones'],
  'simon.d2': ['5 кнопок, быстрее', '5 buttons, faster', '5 кнопок, швидше', '5 Tasten, schneller', '5 botones, más rápido'],
  'simon.d3': ['6 кнопок, быстро', '6 buttons, fast', '6 кнопок, швидко', '6 Tasten, schnell', '6 botones, rápido'],
  'simon.watch': ['Смотри…', 'Watch…', 'Дивись…', 'Pass auf…', 'Mira…'],
  'simon.your': ['Твой ход!', 'Your turn!', 'Твій хід!', 'Du bist dran!', '¡Tu turno!'],
  'simon.good': ['Верно!', 'Correct!', 'Правильно!', 'Richtig!', '¡Correcto!'],
  'simon.wrong': ['Ошибка!', 'Wrong!', 'Помилка!', 'Falsch!', '¡Error!'],
  'simon.round': ['РАУНД', 'ROUND', 'РАУНД', 'RUNDE', 'RONDA']
});

/* Дополнительные языки: названия игр и новые пункты настроек (остальное — по-английски) */
(function () {
  var X = window.I18N_EXTRA = window.I18N_EXTRA || {};
  var add = {
    kk: { 'set.secGraphics': 'Графика', 'set.secSound': 'Дыбыс', 'set.secData': 'Деректер', 'set.fps': 'Кадр жиілігі', 'set.fpsMax': 'Макс',
      'set.showFps': 'FPS санағышын көрсету', 'set.quality': 'Графика сапасы', 'q.0': 'Төмен', 'q.1': 'Орташа', 'q.2': 'Жоғары', 'menu.recent': 'Соңғылар', 'menu.hello': 'Не ойнаймыз?',
      'stack.title': 'Мұнара', 'stack.desc': 'Аспанға дейін мұнара тұрғыз', 'jumper.title': 'Секіргіш', 'jumper.desc': 'Барған сайын биік секір',
      'memory.title': 'Жұптар', 'memory.desc': 'Есте сақтауды жаттықтыр', 'mole.title': 'Көртышқан', 'mole.desc': 'Көртышқандарды ұр', 'simon.title': 'Саймон', 'simon.desc': 'Әуенді қайтала' },
    tr: { 'set.secGraphics': 'Grafik', 'set.secSound': 'Ses ve geri bildirim', 'set.secData': 'Veriler', 'set.fps': 'Kare hızı', 'set.fpsMax': 'Maks',
      'set.showFps': 'FPS sayacını göster', 'set.quality': 'Grafik kalitesi', 'q.0': 'Düşük', 'q.1': 'Orta', 'q.2': 'Yüksek', 'menu.recent': 'Son oynananlar', 'menu.hello': 'Ne oynayalım?',
      'stack.title': 'Kule', 'stack.desc': 'Gökyüzüne kule inşa et', 'jumper.title': 'Zıplayan', 'jumper.desc': 'Daha yükseğe zıpla',
      'memory.title': 'Eşleştirme', 'memory.desc': 'Hafızanı çalıştır', 'mole.title': 'Köstebek', 'mole.desc': 'Köstebeklere vur', 'simon.title': 'Simon', 'simon.desc': 'Melodiyi tekrarla' },
    fr: { 'set.secGraphics': 'Graphismes', 'set.secSound': 'Son et retour', 'set.secData': 'Données', 'set.fps': 'Images par seconde', 'set.fpsMax': 'Max',
      'set.showFps': 'Afficher le compteur FPS', 'set.quality': 'Qualité graphique', 'q.0': 'Basse', 'q.1': 'Moyenne', 'q.2': 'Haute', 'menu.recent': 'Récents', 'menu.hello': 'On joue à quoi ?',
      'stack.title': 'Tour', 'stack.desc': 'Construis une tour jusqu\'au ciel', 'jumper.title': 'Sauteur', 'jumper.desc': 'Saute toujours plus haut',
      'memory.title': 'Mémoire', 'memory.desc': 'Entraîne ta mémoire', 'mole.title': 'Taupe', 'mole.desc': 'Tape les taupes', 'simon.title': 'Simon', 'simon.desc': 'Répète la mélodie' },
    it: { 'set.secGraphics': 'Grafica', 'set.secSound': 'Suono e feedback', 'set.secData': 'Dati', 'set.fps': 'Frequenza fotogrammi', 'set.fpsMax': 'Max',
      'set.showFps': 'Mostra contatore FPS', 'set.quality': 'Qualità grafica', 'q.0': 'Bassa', 'q.1': 'Media', 'q.2': 'Alta', 'menu.recent': 'Recenti', 'menu.hello': 'A cosa giochiamo?',
      'stack.title': 'Torre', 'stack.desc': 'Costruisci una torre fino al cielo', 'jumper.title': 'Saltatore', 'jumper.desc': 'Salta sempre più in alto',
      'memory.title': 'Memory', 'memory.desc': 'Allena la memoria', 'mole.title': 'Talpa', 'mole.desc': 'Colpisci le talpe', 'simon.title': 'Simon', 'simon.desc': 'Ripeti la melodia' },
    pt: { 'set.secGraphics': 'Gráficos', 'set.secSound': 'Som e resposta', 'set.secData': 'Dados', 'set.fps': 'Taxa de quadros', 'set.fpsMax': 'Máx',
      'set.showFps': 'Mostrar contador de FPS', 'set.quality': 'Qualidade gráfica', 'q.0': 'Baixa', 'q.1': 'Média', 'q.2': 'Alta', 'menu.recent': 'Recentes', 'menu.hello': 'Vamos jogar o quê?',
      'stack.title': 'Torre', 'stack.desc': 'Construa uma torre até o céu', 'jumper.title': 'Saltador', 'jumper.desc': 'Pule cada vez mais alto',
      'memory.title': 'Memória', 'memory.desc': 'Treine a memória', 'mole.title': 'Toupeira', 'mole.desc': 'Acerte as toupeiras', 'simon.title': 'Simon', 'simon.desc': 'Repita a melodia' },
    pl: { 'set.secGraphics': 'Grafika', 'set.secSound': 'Dźwięk i reakcje', 'set.secData': 'Dane', 'set.fps': 'Liczba klatek', 'set.fpsMax': 'Maks',
      'set.showFps': 'Pokaż licznik FPS', 'set.quality': 'Jakość grafiki', 'q.0': 'Niska', 'q.1': 'Średnia', 'q.2': 'Wysoka', 'menu.recent': 'Ostatnie', 'menu.hello': 'W co gramy?',
      'stack.title': 'Wieża', 'stack.desc': 'Zbuduj wieżę do nieba', 'jumper.title': 'Skoczek', 'jumper.desc': 'Skacz coraz wyżej',
      'memory.title': 'Pary', 'memory.desc': 'Ćwicz pamięć', 'mole.title': 'Kret', 'mole.desc': 'Uderzaj krety', 'simon.title': 'Simon', 'simon.desc': 'Powtórz melodię' }
  };
  for (var l in add) { X[l] = X[l] || {}; for (var k in add[l]) if (!X[l][k]) X[l][k] = add[l][k]; }
})();
