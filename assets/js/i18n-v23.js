/* Тексты v2.3: игра онлайн через интернет. Базовые языки — массивы [ru, en, uk, de, es]; дополнительные — объекты по языкам. */
Object.assign(window.I18N_MORE = window.I18N_MORE || {}, {
  'on.mode': ['По сети', 'Online', 'По мережі', 'Online', 'En línea'],
  'on.tab': ['Онлайн', 'Online', 'Онлайн', 'Online', 'En línea'],
  'on.hint': ['Играй с другом или случайным соперником через интернет.', 'Play a friend or a random opponent over the internet.', 'Грай з другом або випадковим суперником через інтернет.', 'Spiele über das Internet gegen Freunde oder zufällige Gegner.', 'Juega con un amigo o un rival al azar por internet.'],
  'on.quick': ['Быстрая игра', 'Quick match', 'Швидка гра', 'Schnelles Spiel', 'Partida rápida'],
  'on.create': ['Комната для друга', 'Room for a friend', 'Кімната для друга', 'Raum für Freunde', 'Sala para un amigo'],
  'on.codePh': ['Код комнаты', 'Room code', 'Код кімнати', 'Raumcode', 'Código de sala'],
  'on.open': ['Ждут соперника', 'Waiting for an opponent', 'Чекають суперника', 'Warten auf Gegner', 'Esperando rival'],
  'on.none': ['Пока никого — нажми «Быстрая игра»', 'Nobody yet — tap “Quick match”', 'Поки нікого — натисни «Швидка гра»', 'Noch niemand – tippe auf „Schnelles Spiel“', 'Nadie aún: toca «Partida rápida»'],
  'on.waiting': ['Ждём соперника…', 'Waiting for an opponent…', 'Чекаємо суперника…', 'Warte auf Gegner…', 'Esperando rival…'],
  'on.codeIs': ['Код комнаты', 'Room code', 'Код кімнати', 'Raumcode', 'Código de sala'],
  'on.tell': ['Скажи этот код другу', 'Tell this code to your friend', 'Скажи цей код другові', 'Sag diesen Code deinem Freund', 'Dile este código a tu amigo'],
  'on.joining': ['Подключаемся…', 'Connecting…', 'Підключаємося…', 'Verbinde…', 'Conectando…'],
  'on.offline': ['Нет связи с сервером. Проверь интернет.', 'No connection to the server. Check your internet.', 'Немає зв’язку із сервером. Перевір інтернет.', 'Keine Verbindung zum Server. Prüfe dein Internet.', 'Sin conexión con el servidor. Revisa internet.'],
  'on.notFound': ['Комната не найдена', 'Room not found', 'Кімнату не знайдено', 'Raum nicht gefunden', 'Sala no encontrada'],
  'on.taken': ['Комната уже занята', 'The room is already full', 'Кімната вже зайнята', 'Der Raum ist schon voll', 'La sala ya está llena'],
  'on.otherGame': ['Эта комната для другой игры', 'That room is for another game', 'Ця кімната для іншої гри', 'Dieser Raum ist für ein anderes Spiel', 'Esa sala es de otro juego'],
  'on.gone': ['Комната закрыта', 'The room was closed', 'Кімнату закрито', 'Der Raum wurde geschlossen', 'La sala se cerró']
});

(function () {
  var X = window.I18N_EXTRA = window.I18N_EXTRA || {};
  var add = {
    kk: { 'on.mode': 'Желі арқылы', 'on.tab': 'Онлайн', 'on.quick': 'Жылдам ойын', 'on.create': 'Досқа бөлме', 'on.codePh': 'Бөлме коды', 'on.codeIs': 'Бөлме коды', 'on.open': 'Қарсылас күтуде', 'on.waiting': 'Қарсылас күтілуде…', 'on.joining': 'Қосылуда…', 'on.notFound': 'Бөлме табылмады', 'on.taken': 'Бөлме бос емес' },
    tr: { 'on.mode': 'Çevrimiçi', 'on.tab': 'Çevrimiçi', 'on.quick': 'Hızlı maç', 'on.create': 'Arkadaş odası', 'on.codePh': 'Oda kodu', 'on.codeIs': 'Oda kodu', 'on.open': 'Rakip bekleyenler', 'on.waiting': 'Rakip bekleniyor…', 'on.joining': 'Bağlanıyor…', 'on.notFound': 'Oda bulunamadı', 'on.taken': 'Oda dolu' },
    fr: { 'on.mode': 'En ligne', 'on.tab': 'En ligne', 'on.quick': 'Partie rapide', 'on.create': 'Salon pour un ami', 'on.codePh': 'Code du salon', 'on.codeIs': 'Code du salon', 'on.open': 'En attente d’adversaire', 'on.waiting': 'En attente d’un adversaire…', 'on.joining': 'Connexion…', 'on.notFound': 'Salon introuvable', 'on.taken': 'Le salon est complet' },
    it: { 'on.mode': 'Online', 'on.tab': 'Online', 'on.quick': 'Partita rapida', 'on.create': 'Stanza per un amico', 'on.codePh': 'Codice stanza', 'on.codeIs': 'Codice stanza', 'on.open': 'In attesa di avversario', 'on.waiting': 'In attesa di un avversario…', 'on.joining': 'Connessione…', 'on.notFound': 'Stanza non trovata', 'on.taken': 'La stanza è piena' },
    pt: { 'on.mode': 'Online', 'on.tab': 'Online', 'on.quick': 'Partida rápida', 'on.create': 'Sala para um amigo', 'on.codePh': 'Código da sala', 'on.codeIs': 'Código da sala', 'on.open': 'Aguardando adversário', 'on.waiting': 'Aguardando adversário…', 'on.joining': 'Conectando…', 'on.notFound': 'Sala não encontrada', 'on.taken': 'A sala está cheia' },
    pl: { 'on.mode': 'Online', 'on.tab': 'Online', 'on.quick': 'Szybka gra', 'on.create': 'Pokój dla znajomego', 'on.codePh': 'Kod pokoju', 'on.codeIs': 'Kod pokoju', 'on.open': 'Czekają na rywala', 'on.waiting': 'Czekamy na rywala…', 'on.joining': 'Łączenie…', 'on.notFound': 'Nie znaleziono pokoju', 'on.taken': 'Pokój jest pełny' }
  };
  Object.keys(add).forEach(function (l) { X[l] = Object.assign(X[l] || {}, add[l]); });
})();
