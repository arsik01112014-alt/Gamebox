/* Тексты v2.4 (R): Гомоку, Точки и квадраты. Базовые языки — массивы [ru, en, uk, de, es]; дополнительные — объекты по языкам. */
Object.assign(window.I18N_MORE = window.I18N_MORE || {}, {
  'gomoku.title': ['Гомоку', 'Gomoku', 'Гомоку', 'Gomoku', 'Gomoku'],
  'gomoku.desc': ['Пять камней в ряд на доске го', 'Five stones in a row on a go board', 'П’ять каменів у ряд на дошці го', 'Fünf Steine in einer Reihe auf dem Go-Brett', 'Cinco piedras en línea sobre un tablero de go'],
  'gomoku.hint': [
    'Ставь камни по очереди на пересечения линий. Первый, кто выстроит пять своих камней подряд по горизонтали, вертикали или диагонали, побеждает. Тап — примерка камня, второй тап туда же — ход. Чёрные ходят первыми.',
    'Take turns placing stones on the intersections. The first to line up five of their stones horizontally, vertically or diagonally wins. Tap to preview a stone, tap the same spot again to place it. Black moves first.',
    'Ставте камені по черзі на перетини ліній. Перший, хто вишикує п’ять своїх каменів поспіль по горизонталі, вертикалі чи діагоналі, перемагає. Тап — приміряти камінь, другий тап туди ж — хід. Чорні ходять першими.',
    'Setzt abwechselnd Steine auf die Schnittpunkte. Wer zuerst fünf eigene Steine waagerecht, senkrecht oder diagonal in eine Reihe bringt, gewinnt. Tippen zeigt eine Vorschau, erneutes Tippen auf dieselbe Stelle setzt den Stein. Schwarz beginnt.',
    'Colocad piedras por turnos en las intersecciones. Gana quien primero alinee cinco piedras propias en horizontal, vertical o diagonal. Toca para previsualizar la piedra y vuelve a tocar el mismo punto para colocarla. Empiezan las negras.'],
  'gomoku.d0': ['Доска 13×13, компьютер ошибается', '13×13 board, the CPU makes mistakes', 'Дошка 13×13, комп’ютер помиляється', '13×13-Brett, der Computer macht Fehler', 'Tablero 13×13, la CPU se equivoca'],
  'gomoku.d1': ['Доска 15×15, видит угрозы', '15×15 board, spots threats', 'Дошка 15×15, бачить загрози', '15×15-Brett, erkennt Drohungen', 'Tablero 15×15, ve las amenazas'],
  'gomoku.d2': ['Ищет форсированные победы', 'Hunts for forced wins', 'Шукає форсовані перемоги', 'Sucht erzwungene Siege', 'Busca victorias forzadas'],
  'gomoku.d3': ['Думает на несколько ходов вперёд', 'Thinks several moves ahead', 'Думає на кілька ходів уперед', 'Denkt mehrere Züge voraus', 'Piensa varias jugadas por delante'],
  'gomoku.new': ['Лакированная доска кая и камни-ракушки', 'Lacquered kaya board and clamshell stones', 'Лакована дошка кая і камені-мушлі', 'Lackiertes Kaya-Brett und Muschelsteine', 'Tablero de kaya lacado y piedras de concha'],
  'gomoku.stones': ['камней', 'stones', 'каменів', 'Steine', 'piedras'],
  'gomoku.confirm': ['Тапни ещё раз — поставить', 'Tap again to place', 'Тапни ще раз — поставити', 'Nochmal tippen zum Setzen', 'Toca otra vez para colocar'],

  'dots.title': ['Точки и квадраты', 'Dots and Boxes', 'Крапки і квадрати', 'Käsekästchen', 'Timbiriche'],
  'dots.desc': ['Замыкай клетки на тетрадном листе', 'Close boxes on a notebook page', 'Замикай клітинки на зошитовому аркуші', 'Schließe Kästchen auf dem Karopapier', 'Cierra cuadros en una hoja de cuaderno'],
  'dots.hint': [
    'По очереди соединяйте соседние точки линией. Кто дорисовал четвёртую сторону клетки — забирает её и ходит ещё раз. Не оставляй клеток с тремя сторонами! Побеждает тот, у кого больше клеток.',
    'Take turns joining two neighbouring dots with a line. Whoever draws the fourth side of a box claims it and moves again. Don’t leave boxes with three sides! Most boxes wins.',
    'По черзі з’єднуйте сусідні крапки лінією. Хто домалював четверту сторону клітинки — забирає її і ходить ще раз. Не залишай клітинок із трьома сторонами! Перемагає той, у кого більше клітинок.',
    'Verbindet abwechselnd zwei benachbarte Punkte mit einer Linie. Wer die vierte Seite eines Kästchens zieht, bekommt es und ist noch einmal dran. Lass keine Kästchen mit drei Seiten offen! Die meisten Kästchen gewinnen.',
    'Por turnos, unid dos puntos vecinos con una línea. Quien traza el cuarto lado de un cuadro se lo queda y vuelve a jugar. ¡No dejes cuadros con tres lados! Gana quien tenga más cuadros.'],
  'dots.d0': ['Поле 4×4, компьютер-новичок', '4×4 grid, beginner CPU', 'Поле 4×4, комп’ютер-новачок', '4×4-Feld, Anfänger-Computer', 'Cuadrícula 4×4, CPU novata'],
  'dots.d1': ['Поле 5×5, не дарит клетки', '5×5 grid, gives nothing away', 'Поле 5×5, не дарує клітинки', '5×5-Feld, verschenkt nichts', 'Cuadrícula 5×5, no regala cuadros'],
  'dots.d2': ['Поле 6×6, знает двойной крест', '6×6 grid, knows the double-cross', 'Поле 6×6, знає подвійний хрест', '6×6-Feld, kennt das Doppelkreuz', 'Cuadrícula 6×6, conoce la doble cruz'],
  'dots.d3': ['Поле 7×7, считает цепочки', '7×7 grid, counts chains', 'Поле 7×7, рахує ланцюжки', '7×7-Feld, zählt Ketten', 'Cuadrícula 7×7, cuenta cadenas'],
  'dots.new': ['Тетрадь в клетку, чернила и штриховка от руки', 'Squared notebook, ink lines and hand-drawn hatching', 'Зошит у клітинку, чорнило й штрихування від руки', 'Karoheft, Tintenlinien und handgezeichnete Schraffur', 'Cuaderno cuadriculado, tinta y sombreado a mano'],
  'dots.again': ['Клетка твоя — ходи ещё!', 'Box is yours — go again!', 'Клітинка твоя — ходи ще!', 'Kästchen gehört dir – nochmal!', '¡Cuadro tuyo, juega otra vez!']
});
(function () {
  var X = window.I18N_EXTRA = window.I18N_EXTRA || {};
  var add = {
    kk: { 'gomoku.title': 'Гомоку', 'gomoku.desc': 'Го тақтасында қатарынан бес тас', 'gomoku.stones': 'тас', 'gomoku.confirm': 'Қою үшін тағы бас',
      'dots.title': 'Нүктелер мен шаршылар', 'dots.desc': 'Дәптер парағында торкөздерді тұйықта', 'dots.again': 'Шаршы сенікі — тағы жүр!' },
    tr: { 'gomoku.title': 'Gomoku', 'gomoku.desc': 'Go tahtasında beş taş yan yana', 'gomoku.stones': 'taş', 'gomoku.confirm': 'Koymak için tekrar dokun',
      'dots.title': 'Noktalar ve Kutular', 'dots.desc': 'Kareli defterde kutuları kapat', 'dots.again': 'Kutu senin — tekrar oyna!' },
    fr: { 'gomoku.title': 'Gomoku', 'gomoku.desc': 'Cinq pierres alignées sur un goban', 'gomoku.stones': 'pierres', 'gomoku.confirm': 'Touchez encore pour poser',
      'dots.title': 'Pipopipette', 'dots.desc': 'Fermez des cases sur une page de cahier', 'dots.again': 'Case gagnée — rejouez !' },
    it: { 'gomoku.title': 'Gomoku', 'gomoku.desc': 'Cinque pietre in fila sul goban', 'gomoku.stones': 'pietre', 'gomoku.confirm': 'Tocca di nuovo per posare',
      'dots.title': 'Punti e quadrati', 'dots.desc': 'Chiudi i quadrati su un foglio a quadretti', 'dots.again': 'Quadrato tuo — gioca ancora!' },
    pt: { 'gomoku.title': 'Gomoku', 'gomoku.desc': 'Cinco pedras em linha no tabuleiro de go', 'gomoku.stones': 'pedras', 'gomoku.confirm': 'Toque de novo para colocar',
      'dots.title': 'Pontinhos', 'dots.desc': 'Feche quadrados numa folha de caderno', 'dots.again': 'Quadrado seu — jogue de novo!' },
    pl: { 'gomoku.title': 'Gomoku', 'gomoku.desc': 'Pięć kamieni w rzędzie na planszy go', 'gomoku.stones': 'kamienie', 'gomoku.confirm': 'Stuknij ponownie, aby postawić',
      'dots.title': 'Kropki i kwadraty', 'dots.desc': 'Zamykaj kwadraty na kartce w kratkę', 'dots.again': 'Kwadrat twój — graj dalej!' }
  };
  for (var l in add) { X[l] = X[l] || {}; for (var k in add[l]) X[l][k] = add[l][k]; }
})();
