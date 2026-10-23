/* Тексты v2.4 (P): Сокобан и Цветная вода. Базовые языки — массивы [ru, en, uk, de, es]; дополнительные — объекты по языкам. */
Object.assign(window.I18N_MORE = window.I18N_MORE || {}, {
  'sokoban.title': ['Сокобан', 'Sokoban', 'Сокобан', 'Sokoban', 'Sokoban'],
  'sokoban.desc': ['Расставь ящики по отметкам склада', 'Push the crates onto the warehouse marks', 'Розстав ящики на позначки складу', 'Schiebe die Kisten auf die Lagermarkierungen', 'Empuja las cajas a las marcas del almacén'],
  'sokoban.hint': [
    'Свайп или крестовина — шаг кладовщика. Тап по полу — пройти туда. Ящики можно только толкать, не тянуть. Поставь все ящики на светящиеся отметки. Чем ближе к норме ходов, тем больше звёзд и очков. ↶ — отмена хода, ⟲ — заново, ⏭ — пропустить уровень, ⚑ — завершить.',
    'Swipe or use the D-pad to step. Tap the floor to walk there. Crates can only be pushed, never pulled. Get every crate onto a glowing mark. The closer to par, the more stars and points. ↶ undo, ⟲ restart, ⏭ skip level, ⚑ finish.',
    'Свайп або хрестовина — крок комірника. Тап по підлозі — пройти туди. Ящики можна лише штовхати, не тягнути. Постав усі ящики на світні позначки. Що ближче до норми ходів, то більше зірок і очок. ↶ — скасувати хід, ⟲ — заново, ⏭ — пропустити рівень, ⚑ — завершити.',
    'Wische oder nutze das Steuerkreuz für einen Schritt. Tippe auf den Boden, um dorthin zu laufen. Kisten kann man nur schieben, nicht ziehen. Bringe alle Kisten auf die leuchtenden Markierungen. Je näher am Par, desto mehr Sterne und Punkte. ↶ zurück, ⟲ neu, ⏭ Level überspringen, ⚑ beenden.',
    'Desliza o usa la cruceta para dar un paso. Toca el suelo para caminar hasta allí. Las cajas solo se empujan, nunca se arrastran. Pon todas las cajas en las marcas brillantes. Cuanto más cerca del par, más estrellas y puntos. ↶ deshacer, ⟲ reiniciar, ⏭ saltar nivel, ⚑ terminar.'],
  'sokoban.d0': ['Обучение: 1–2 ящика, маленькие склады', 'Tutorial: 1–2 crates, small rooms', 'Навчання: 1–2 ящики, малі склади', 'Tutorial: 1–2 Kisten, kleine Räume', 'Tutorial: 1–2 cajas, salas pequeñas'],
  'sokoban.d1': ['2–3 ящика, запас ходов ×3', '2–3 crates, move limit ×3 par', '2–3 ящики, запас ходів ×3', '2–3 Kisten, Zuglimit ×3 Par', '2–3 cajas, límite ×3 del par'],
  'sokoban.d2': ['3–4 ящика, запас ходов ×2,5', '3–4 crates, move limit ×2.5 par', '3–4 ящики, запас ходів ×2,5', '3–4 Kisten, Zuglimit ×2,5 Par', '3–4 cajas, límite ×2,5 del par'],
  'sokoban.d3': ['4–5 ящиков, лимит ходов ×2, 1 пропуск', '4–5 crates, move limit ×2 par, 1 skip', '4–5 ящиків, ліміт ходів ×2, 1 пропуск', '4–5 Kisten, Zuglimit ×2 Par, 1 Überspringen', '4–5 cajas, límite ×2 del par, 1 salto'],
  'sokoban.new': ['40 проверенных уровней, звёзды за норму ходов и кладовщик в каске', '40 verified levels, par stars and a hard-hat worker', '40 перевірених рівнів, зірки за норму ходів і комірник у касці', '40 geprüfte Level, Par-Sterne und ein Lagerarbeiter mit Helm', '40 niveles verificados, estrellas por par y un mozo con casco'],
  'sokoban.level': ['Уровень', 'Level', 'Рівень', 'Level', 'Nivel'],
  'sokoban.par': ['Норма', 'Par', 'Норма', 'Par', 'Par'],
  'sokoban.left': ['Осталось', 'Left', 'Лишилось', 'Übrig', 'Quedan'],
  'sokoban.clear': ['Склад разобран!', 'Warehouse sorted!', 'Склад розібрано!', 'Lager sortiert!', '¡Almacén ordenado!'],
  'sokoban.out': ['Ходы закончились', 'Out of moves', 'Ходи скінчилися', 'Keine Züge mehr', 'Sin movimientos'],
  'sokoban.all': ['Все уровни пройдены!', 'All levels cleared!', 'Усі рівні пройдено!', 'Alle Level geschafft!', '¡Todos los niveles superados!'],
  'sokoban.skip': ['Уровень пропущен', 'Level skipped', 'Рівень пропущено', 'Level übersprungen', 'Nivel saltado'],
  'sokoban.noSkip': ['Пропуски закончились', 'No skips left', 'Пропуски скінчилися', 'Kein Überspringen mehr', 'No quedan saltos'],
  'sokoban.stuck': ['Ящик застрял в углу — отмени ход', 'A crate is stuck in a corner — undo', 'Ящик застряг у куті — скасуй хід', 'Kiste steckt in der Ecke — zurücknehmen', 'Caja atascada en una esquina — deshaz'],
  'sokoban.tapNext': ['Тапни, чтобы продолжить', 'Tap to continue', 'Тапни, щоб продовжити', 'Tippen zum Fortfahren', 'Toca para continuar'],

  'watersort.title': ['Цветная вода', 'Water Sort', 'Кольорова вода', 'Wasser sortieren', 'Ordena el agua'],
  'watersort.desc': ['Разлей жидкости так, чтобы в каждой колбе был один цвет', 'Pour the liquids until every tube holds one colour', 'Розлий рідини так, щоб у кожній колбі був один колір', 'Gieße um, bis jedes Glas nur eine Farbe hat', 'Vierte los líquidos hasta que cada tubo tenga un color'],
  'watersort.hint': [
    'Тапни колбу, затем другую — жидкость перельётся, если сверху тот же цвет или колба пуста и есть место. Собери каждый цвет в отдельной колбе. ↶ — отмена (ограничена), ＋ — добавить пустую колбу, ⟲ — начать уровень заново, ⚑ — завершить. Меньше ходов — больше бонус.',
    'Tap a tube, then another — the liquid pours if the top colour matches or the tube is empty and has room. Collect each colour in its own tube. ↶ undo (limited), ＋ add an empty tube, ⟲ restart the level, ⚑ finish. Fewer moves — bigger bonus.',
    'Тапни колбу, потім іншу — рідина переллється, якщо зверху той самий колір або колба порожня і є місце. Збери кожен колір в окремій колбі. ↶ — скасування (обмежене), ＋ — додати порожню колбу, ⟲ — почати рівень заново, ⚑ — завершити. Менше ходів — більший бонус.',
    'Tippe ein Glas und dann ein anderes an — es wird umgegossen, wenn oben dieselbe Farbe ist oder das Glas leer ist und Platz hat. Sammle jede Farbe in einem eigenen Glas. ↶ zurück (begrenzt), ＋ leeres Glas, ⟲ Level neu, ⚑ beenden. Weniger Züge — mehr Bonus.',
    'Toca un tubo y luego otro: se vierte si el color de arriba coincide o el tubo está vacío y hay sitio. Reúne cada color en su propio tubo. ↶ deshacer (limitado), ＋ añadir tubo vacío, ⟲ reiniciar nivel, ⚑ terminar. Menos movimientos, más bonus.'],
  'watersort.d0': ['3–6 цветов, отмена без ограничений', '3–6 colours, unlimited undo', '3–6 кольорів, скасування без обмежень', '3–6 Farben, unbegrenztes Zurück', '3–6 colores, deshacer ilimitado'],
  'watersort.d1': ['5–8 цветов, 5 отмен на уровень', '5–8 colours, 5 undos per level', '5–8 кольорів, 5 скасувань на рівень', '5–8 Farben, 5× Zurück pro Level', '5–8 colores, 5 deshacer por nivel'],
  'watersort.d2': ['7–10 цветов, 3 отмены на уровень', '7–10 colours, 3 undos per level', '7–10 кольорів, 3 скасування на рівень', '7–10 Farben, 3× Zurück pro Level', '7–10 colores, 3 deshacer por nivel'],
  'watersort.d3': ['9–12 цветов, 2 отмены, одна запасная колба за игру', '9–12 colours, 2 undos, one spare tube per game', '9–12 кольорів, 2 скасування, одна запасна колба за гру', '9–12 Farben, 2× Zurück, ein Ersatzglas pro Spiel', '9–12 colores, 2 deshacer, un tubo extra por partida'],
  'watersort.new': ['Колбы наклоняются и льют струёй, волны, пузырьки и пробки', 'Tubes tilt and pour in a stream, with waves, bubbles and corks', 'Колби нахиляються й ллють струменем, хвилі, бульбашки та корки', 'Gläser kippen und gießen im Strahl — mit Wellen, Blasen und Korken', 'Los tubos se inclinan y vierten un chorro, con olas, burbujas y corchos'],
  'watersort.level': ['Уровень', 'Level', 'Рівень', 'Level', 'Nivel'],
  'watersort.par': ['Цель', 'Target', 'Ціль', 'Ziel', 'Meta'],
  'watersort.clear': ['Всё разлито!', 'Sorted!', 'Усе розлито!', 'Sortiert!', '¡Ordenado!'],
  'watersort.all': ['Все уровни пройдены!', 'All levels cleared!', 'Усі рівні пройдено!', 'Alle Level geschafft!', '¡Todos los niveles superados!'],
  'watersort.noUndo': ['Отмены закончились', 'No undos left', 'Скасування скінчилися', 'Kein Zurück mehr', 'No quedan deshacer'],
  'watersort.noTube': ['Запасная колба уже использована', 'Spare tube already used', 'Запасну колбу вже використано', 'Ersatzglas schon benutzt', 'Tubo extra ya usado'],
  'watersort.stuck': ['Ходов нет — отмени или начни заново ⟲', 'No moves — undo or restart ⟲', 'Ходів немає — скасуй або почни заново ⟲', 'Keine Züge — zurück oder neu ⟲', 'Sin movimientos — deshaz o reinicia ⟲']
});
(function () {
  var X = window.I18N_EXTRA = window.I18N_EXTRA || {};
  var add = {
    kk: { 'sokoban.title': 'Сокобан', 'sokoban.desc': 'Жәшіктерді қойма белгілеріне итер', 'sokoban.level': 'Деңгей', 'sokoban.par': 'Норма', 'sokoban.clear': 'Қойма реттелді!', 'sokoban.tapNext': 'Жалғастыру үшін түрт',
      'watersort.title': 'Түсті су', 'watersort.desc': 'Әр колбада бір түс қалатындай етіп құй', 'watersort.level': 'Деңгей', 'watersort.clear': 'Бәрі сұрыпталды!' },
    tr: { 'sokoban.title': 'Sokoban', 'sokoban.desc': 'Kasaları depo işaretlerine it', 'sokoban.level': 'Seviye', 'sokoban.par': 'Par', 'sokoban.clear': 'Depo düzenlendi!', 'sokoban.out': 'Hamle kalmadı', 'sokoban.tapNext': 'Devam etmek için dokun',
      'watersort.title': 'Su Sıralama', 'watersort.desc': 'Her tüpte tek renk kalana kadar sıvıları dök', 'watersort.level': 'Seviye', 'watersort.par': 'Hedef', 'watersort.clear': 'Sıralandı!' },
    fr: { 'sokoban.title': 'Sokoban', 'sokoban.desc': 'Pousse les caisses sur les marques de l’entrepôt', 'sokoban.level': 'Niveau', 'sokoban.par': 'Par', 'sokoban.clear': 'Entrepôt rangé !', 'sokoban.out': 'Plus de coups', 'sokoban.tapNext': 'Touchez pour continuer',
      'watersort.title': 'Tri de l’eau', 'watersort.desc': 'Verse les liquides jusqu’à une seule couleur par tube', 'watersort.level': 'Niveau', 'watersort.par': 'Objectif', 'watersort.clear': 'Trié !' },
    it: { 'sokoban.title': 'Sokoban', 'sokoban.desc': 'Spingi le casse sui segni del magazzino', 'sokoban.level': 'Livello', 'sokoban.par': 'Par', 'sokoban.clear': 'Magazzino in ordine!', 'sokoban.out': 'Mosse finite', 'sokoban.tapNext': 'Tocca per continuare',
      'watersort.title': 'Ordina l’acqua', 'watersort.desc': 'Versa i liquidi finché ogni provetta ha un solo colore', 'watersort.level': 'Livello', 'watersort.par': 'Obiettivo', 'watersort.clear': 'Ordinato!' },
    pt: { 'sokoban.title': 'Sokoban', 'sokoban.desc': 'Empurre as caixas para as marcas do armazém', 'sokoban.level': 'Nível', 'sokoban.par': 'Par', 'sokoban.clear': 'Armazém arrumado!', 'sokoban.out': 'Sem movimentos', 'sokoban.tapNext': 'Toque para continuar',
      'watersort.title': 'Separar Água', 'watersort.desc': 'Despeje os líquidos até cada tubo ter uma só cor', 'watersort.level': 'Nível', 'watersort.par': 'Meta', 'watersort.clear': 'Separado!' },
    pl: { 'sokoban.title': 'Sokoban', 'sokoban.desc': 'Przepchnij skrzynie na znaczniki magazynu', 'sokoban.level': 'Poziom', 'sokoban.par': 'Norma', 'sokoban.clear': 'Magazyn uporządkowany!', 'sokoban.out': 'Brak ruchów', 'sokoban.tapNext': 'Dotknij, aby kontynuować',
      'watersort.title': 'Sortowanie wody', 'watersort.desc': 'Przelewaj ciecze, aż każda probówka ma jeden kolor', 'watersort.level': 'Poziom', 'watersort.par': 'Cel', 'watersort.clear': 'Posortowane!' }
  };
  for (var l in add) { X[l] = X[l] || {}; for (var k in add[l]) X[l][k] = add[l][k]; }
})();
