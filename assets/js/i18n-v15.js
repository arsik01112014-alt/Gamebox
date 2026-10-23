/* Тексты v1.5: игра по локальной сети, новый морской бой, категории и поиск.
   Базовые языки — массивы [ru, en, uk, de, es]; дополнительные — объекты по языкам. */
Object.assign(window.I18N_MORE = window.I18N_MORE || {}, {
  'net.lan': ['По Wi-Fi', 'Wi-Fi', 'По Wi-Fi', 'WLAN', 'Wi-Fi'],
  'net.na': ['Игра по сети доступна только в приложении на Android.', 'Network play is only available in the Android app.', 'Гра по мережі доступна лише в застосунку на Android.', 'Netzwerkspiel gibt es nur in der Android-App.', 'El juego en red solo está disponible en la app de Android.'],
  'net.waiting': ['Ждём соперника…', 'Waiting for an opponent…', 'Чекаємо на суперника…', 'Warte auf Gegner…', 'Esperando rival…'],
  'net.yourIp': ['Ваш IP', 'Your IP', 'Ваш IP', 'Deine IP', 'Tu IP'],
  'net.cancel': ['Отмена', 'Cancel', 'Скасувати', 'Abbrechen', 'Cancelar'],
  'net.connecting': ['Подключение…', 'Connecting…', 'Підключення…', 'Verbinde…', 'Conectando…'],
  'net.hint': ['Оба телефона должны быть в одной сети Wi-Fi (или один раздаёт точку доступа). Один создаёт игру, второй подключается.', 'Both phones must be on the same Wi-Fi (or one shares a hotspot). One creates a game, the other joins.', 'Обидва телефони мають бути в одній мережі Wi-Fi (або один роздає точку доступу). Один створює гру, другий приєднується.', 'Beide Handys müssen im selben WLAN sein (oder eins macht einen Hotspot). Einer erstellt ein Spiel, der andere tritt bei.', 'Ambos teléfonos deben estar en la misma red Wi-Fi (o uno comparte punto de acceso). Uno crea la partida y el otro se une.'],
  'net.create': ['Создать игру', 'Create game', 'Створити гру', 'Spiel erstellen', 'Crear partida'],
  'net.found': ['Найденные игры', 'Games nearby', 'Знайдені ігри', 'Gefundene Spiele', 'Partidas encontradas'],
  'net.searching': ['Ищем игры в сети…', 'Looking for games…', 'Шукаємо ігри в мережі…', 'Suche Spiele…', 'Buscando partidas…'],
  'net.join': ['Подключиться', 'Join', 'Приєднатися', 'Beitreten', 'Unirse'],
  'net.error': ['Не удалось подключиться', 'Could not connect', 'Не вдалося підключитися', 'Verbindung fehlgeschlagen', 'No se pudo conectar'],
  'net.lost': ['Связь потеряна', 'Connection lost', 'Зв’язок втрачено', 'Verbindung verloren', 'Conexión perdida'],
  'net.lostHint': ['Соперник вышел или сеть пропала.', 'The opponent left or the network dropped.', 'Суперник вийшов або зникла мережа.', 'Der Gegner ist weg oder das Netz ist ausgefallen.', 'El rival salió o se cayó la red.'],
  'net.badIp': ['Неверный IP-адрес', 'Invalid IP address', 'Невірна IP-адреса', 'Ungültige IP-Adresse', 'Dirección IP no válida'],
  'net.leaveQ': ['Выйти из сетевой игры? Соперник увидит, что вы ушли.', 'Leave the network game? Your opponent will see you left.', 'Вийти з мережевої гри? Суперник побачить, що ви пішли.', 'Netzwerkspiel verlassen? Dein Gegner sieht, dass du gegangen bist.', '¿Salir de la partida en red? Tu rival verá que te fuiste.'],
  'net.opp': ['СОПЕРНИК', 'OPPONENT', 'СУПЕРНИК', 'GEGNER', 'RIVAL'],
  'net.oppTurn': ['Ход соперника', 'Opponent’s turn', 'Хід суперника', 'Gegner ist dran', 'Turno del rival'],
  'chess.promote': ['Превратить пешку в…', 'Promote pawn to…', 'Перетворити пішака на…', 'Bauer umwandeln in…', 'Promocionar peón a…'],
  'bs.deploy': ['Расставьте флот', 'Deploy your fleet', 'Розставте флот', 'Flotte aufstellen', 'Despliega tu flota'],
  'bs.deployHint': ['Тащите корабли на поле, тап — повернуть', 'Drag ships onto the grid, tap to rotate', 'Тягніть кораблі на поле, тап — повернути', 'Schiffe aufs Feld ziehen, Tippen dreht', 'Arrastra los barcos, toca para girar'],
  'bs.random': ['Случайно', 'Random', 'Випадково', 'Zufällig', 'Al azar'],
  'bs.save': ['ГОТОВО', 'SAVE', 'ГОТОВО', 'FERTIG', 'LISTO'],
  'bs.passScreen': ['Передайте телефон\nвторому игроку', 'Pass the phone\nto player 2', 'Передайте телефон\nдругому гравцю', 'Gib das Handy\nan Spieler 2', 'Pasa el teléfono\nal jugador 2'],
  'bs.waitPeer': ['Соперник расставляет флот…', 'Opponent is deploying…', 'Суперник розставляє флот…', 'Gegner stellt Flotte auf…', 'El rival despliega su flota…'],
  'battleship.hint': ['Перетащите 5 кораблей на своё поле или нажмите «Случайно», затем «Готово». Тапайте по полю соперника — пушка стреляет. Попал — стреляешь ещё. Потопи весь флот первым! Вдвоём садитесь друг напротив друга.',
    'Drag your 5 ships onto your grid or tap Random, then Save. Tap the enemy half to fire your cannon. A hit gives another shot. Sink the whole fleet first! For two players, sit facing each other.',
    'Перетягніть 5 кораблів на своє поле або натисніть «Випадково», потім «Готово». Тапайте по полю суперника — гармата стріляє. Влучив — стріляєш ще. Потопи весь флот першим! Удвох сідайте одне навпроти одного.',
    'Ziehe 5 Schiffe auf dein Feld oder tippe „Zufällig“, dann „Fertig“. Tippe auf die gegnerische Hälfte, um zu feuern. Treffer = noch ein Schuss. Versenke zuerst die ganze Flotte! Zu zweit sitzt ihr euch gegenüber.',
    'Arrastra 5 barcos a tu tablero o pulsa «Al azar» y luego «Listo». Toca la mitad enemiga para disparar el cañón. Si aciertas, disparas otra vez. ¡Hunde toda la flota primero! A dos, sentaos uno frente al otro.'],
  'cat.all': ['Все', 'All', 'Усі', 'Alle', 'Todos'],
  'cat.arcade': ['Аркады', 'Arcade', 'Аркади', 'Arcade', 'Arcade'],
  'cat.puzzle': ['Головоломки', 'Puzzles', 'Головоломки', 'Rätsel', 'Puzles'],
  'cat.board': ['Настольные', 'Board', 'Настільні', 'Brettspiele', 'De mesa'],
  'cat.duo': ['Вдвоём', 'Two players', 'Удвох', 'Zu zweit', 'Dos jugadores'],
  'cat.lan': ['По Wi-Fi', 'Wi-Fi', 'По Wi-Fi', 'WLAN', 'Wi-Fi'],
  'menu.search': ['Поиск игры', 'Search games', 'Пошук гри', 'Spiel suchen', 'Buscar juego'],
  'menu.empty': ['Ничего не найдено', 'Nothing found', 'Нічого не знайдено', 'Nichts gefunden', 'No se encontró nada']
});

(function () {
  var X = window.I18N_EXTRA = window.I18N_EXTRA || {};
  function add(l, o) { X[l] = Object.assign(X[l] || {}, o); }
  add('kk', {
    'net.lan': 'Wi-Fi арқылы', 'net.na': 'Желілік ойын тек Android қолданбасында қолжетімді.', 'net.waiting': 'Қарсыласты күтудеміз…', 'net.yourIp': 'Сіздің IP',
    'net.cancel': 'Болдырмау', 'net.connecting': 'Қосылуда…', 'net.hint': 'Екі телефон бір Wi-Fi желісінде болуы керек (немесе біреуі хотспот таратады). Біреуі ойын жасайды, екіншісі қосылады.',
    'net.create': 'Ойын жасау', 'net.found': 'Табылған ойындар', 'net.searching': 'Желіден ойын іздеудеміз…', 'net.join': 'Қосылу', 'net.error': 'Қосылу мүмкін болмады',
    'net.lost': 'Байланыс үзілді', 'net.lostHint': 'Қарсылас шығып кетті немесе желі жоғалды.', 'net.badIp': 'IP мекенжайы қате', 'net.leaveQ': 'Желілік ойыннан шығасыз ба? Қарсылас кеткеніңізді көреді.',
    'net.opp': 'ҚАРСЫЛАС', 'net.oppTurn': 'Қарсыластың жүрісі', 'chess.promote': 'Пешканы айналдыру…',
    'bs.deploy': 'Флотты орналастырыңыз', 'bs.deployHint': 'Кемелерді өріске сүйреңіз, басу — бұру', 'bs.random': 'Кездейсоқ', 'bs.save': 'ДАЙЫН',
    'bs.passScreen': 'Телефонды\nекінші ойыншыға беріңіз', 'bs.waitPeer': 'Қарсылас флотын орналастыруда…',
    'battleship.hint': '5 кемені өз өрісіңізге сүйреңіз немесе «Кездейсоқ», сосын «Дайын» басыңыз. Қарсылас өрісін басыңыз — зеңбірек атады. Тигізсең — тағы атасың. Бүкіл флотты бірінші батыр! Екеуіңіз қарама-қарсы отырыңыз.',
    'cat.all': 'Барлығы', 'cat.arcade': 'Аркадалар', 'cat.puzzle': 'Жұмбақтар', 'cat.board': 'Үстел ойындары', 'cat.duo': 'Екеуара', 'cat.lan': 'Wi-Fi арқылы',
    'menu.search': 'Ойын іздеу', 'menu.empty': 'Ештеңе табылмады'
  });
  add('tr', {
    'net.lan': 'Wi-Fi', 'net.na': 'Ağ oyunu yalnızca Android uygulamasında kullanılabilir.', 'net.waiting': 'Rakip bekleniyor…', 'net.yourIp': 'IP adresin',
    'net.cancel': 'İptal', 'net.connecting': 'Bağlanıyor…', 'net.hint': 'İki telefon da aynı Wi-Fi ağında olmalı (ya da biri hotspot açmalı). Biri oyun kurar, diğeri katılır.',
    'net.create': 'Oyun kur', 'net.found': 'Bulunan oyunlar', 'net.searching': 'Ağda oyun aranıyor…', 'net.join': 'Katıl', 'net.error': 'Bağlanılamadı',
    'net.lost': 'Bağlantı koptu', 'net.lostHint': 'Rakip ayrıldı ya da ağ kesildi.', 'net.badIp': 'Geçersiz IP adresi', 'net.leaveQ': 'Ağ oyunundan çıkılsın mı? Rakibin ayrıldığını görecek.',
    'net.opp': 'RAKİP', 'net.oppTurn': 'Rakibin sırası', 'chess.promote': 'Piyonu terfi ettir…',
    'bs.deploy': 'Filonu yerleştir', 'bs.deployHint': 'Gemileri sürükle, döndürmek için dokun', 'bs.random': 'Rastgele', 'bs.save': 'HAZIR',
    'bs.passScreen': 'Telefonu\n2. oyuncuya ver', 'bs.waitPeer': 'Rakip filosunu yerleştiriyor…',
    'battleship.hint': '5 gemiyi alanına sürükle ya da «Rastgele»ye, sonra «Hazır»a dokun. Ateş etmek için rakip yarıya dokun. İsabet edersen tekrar atarsın. Tüm filoyu ilk sen batır! İki kişiyken karşılıklı oturun.',
    'cat.all': 'Tümü', 'cat.arcade': 'Arcade', 'cat.puzzle': 'Bulmaca', 'cat.board': 'Masa oyunları', 'cat.duo': 'İki kişilik', 'cat.lan': 'Wi-Fi',
    'menu.search': 'Oyun ara', 'menu.empty': 'Hiçbir şey bulunamadı'
  });
  add('fr', {
    'net.lan': 'Wi-Fi', 'net.na': 'Le jeu en réseau n’est disponible que dans l’application Android.', 'net.waiting': 'En attente d’un adversaire…', 'net.yourIp': 'Ton IP',
    'net.cancel': 'Annuler', 'net.connecting': 'Connexion…', 'net.hint': 'Les deux téléphones doivent être sur le même Wi-Fi (ou l’un partage sa connexion). L’un crée la partie, l’autre la rejoint.',
    'net.create': 'Créer une partie', 'net.found': 'Parties trouvées', 'net.searching': 'Recherche de parties…', 'net.join': 'Rejoindre', 'net.error': 'Connexion impossible',
    'net.lost': 'Connexion perdue', 'net.lostHint': 'L’adversaire est parti ou le réseau a coupé.', 'net.badIp': 'Adresse IP invalide', 'net.leaveQ': 'Quitter la partie en réseau ? Ton adversaire verra que tu es parti.',
    'net.opp': 'ADVERSAIRE', 'net.oppTurn': 'Tour de l’adversaire', 'chess.promote': 'Promouvoir le pion en…',
    'bs.deploy': 'Place ta flotte', 'bs.deployHint': 'Glisse les navires, touche pour pivoter', 'bs.random': 'Au hasard', 'bs.save': 'PRÊT',
    'bs.passScreen': 'Passe le téléphone\nau joueur 2', 'bs.waitPeer': 'L’adversaire place sa flotte…',
    'battleship.hint': 'Glisse tes 5 navires sur ta grille ou touche « Au hasard », puis « Prêt ». Touche la moitié ennemie pour tirer au canon. Touché = un tir de plus. Coule toute la flotte en premier ! À deux, asseyez-vous face à face.',
    'cat.all': 'Tous', 'cat.arcade': 'Arcade', 'cat.puzzle': 'Réflexion', 'cat.board': 'Plateau', 'cat.duo': 'À deux', 'cat.lan': 'Wi-Fi',
    'menu.search': 'Chercher un jeu', 'menu.empty': 'Aucun résultat'
  });
  add('it', {
    'net.lan': 'Wi-Fi', 'net.na': 'Il gioco in rete è disponibile solo nell’app Android.', 'net.waiting': 'In attesa di un avversario…', 'net.yourIp': 'Il tuo IP',
    'net.cancel': 'Annulla', 'net.connecting': 'Connessione…', 'net.hint': 'Entrambi i telefoni devono essere sulla stessa rete Wi-Fi (o uno condivide l’hotspot). Uno crea la partita, l’altro si unisce.',
    'net.create': 'Crea partita', 'net.found': 'Partite trovate', 'net.searching': 'Ricerca partite…', 'net.join': 'Unisciti', 'net.error': 'Connessione non riuscita',
    'net.lost': 'Connessione persa', 'net.lostHint': 'L’avversario è uscito o la rete è caduta.', 'net.badIp': 'Indirizzo IP non valido', 'net.leaveQ': 'Uscire dalla partita in rete? L’avversario vedrà che sei uscito.',
    'net.opp': 'AVVERSARIO', 'net.oppTurn': 'Turno dell’avversario', 'chess.promote': 'Promuovi il pedone a…',
    'bs.deploy': 'Schiera la flotta', 'bs.deployHint': 'Trascina le navi, tocca per ruotare', 'bs.random': 'Casuale', 'bs.save': 'PRONTO',
    'bs.passScreen': 'Passa il telefono\nal giocatore 2', 'bs.waitPeer': 'L’avversario schiera la flotta…',
    'battleship.hint': 'Trascina le 5 navi sulla tua griglia o tocca «Casuale», poi «Pronto». Tocca la metà nemica per sparare col cannone. Colpito = un altro tiro. Affonda tutta la flotta per primo! In due, sedetevi uno di fronte all’altro.',
    'cat.all': 'Tutti', 'cat.arcade': 'Arcade', 'cat.puzzle': 'Rompicapi', 'cat.board': 'Da tavolo', 'cat.duo': 'In due', 'cat.lan': 'Wi-Fi',
    'menu.search': 'Cerca un gioco', 'menu.empty': 'Nessun risultato'
  });
  add('pt', {
    'net.lan': 'Wi-Fi', 'net.na': 'O jogo em rede só está disponível no app Android.', 'net.waiting': 'Aguardando adversário…', 'net.yourIp': 'Seu IP',
    'net.cancel': 'Cancelar', 'net.connecting': 'Conectando…', 'net.hint': 'Os dois telefones precisam estar no mesmo Wi-Fi (ou um compartilha o hotspot). Um cria o jogo, o outro entra.',
    'net.create': 'Criar jogo', 'net.found': 'Jogos encontrados', 'net.searching': 'Procurando jogos…', 'net.join': 'Entrar', 'net.error': 'Não foi possível conectar',
    'net.lost': 'Conexão perdida', 'net.lostHint': 'O adversário saiu ou a rede caiu.', 'net.badIp': 'Endereço IP inválido', 'net.leaveQ': 'Sair do jogo em rede? O adversário verá que você saiu.',
    'net.opp': 'ADVERSÁRIO', 'net.oppTurn': 'Vez do adversário', 'chess.promote': 'Promover o peão a…',
    'bs.deploy': 'Posicione a frota', 'bs.deployHint': 'Arraste os navios, toque para girar', 'bs.random': 'Aleatório', 'bs.save': 'PRONTO',
    'bs.passScreen': 'Passe o telefone\npara o jogador 2', 'bs.waitPeer': 'O adversário posiciona a frota…',
    'battleship.hint': 'Arraste os 5 navios para o seu tabuleiro ou toque em «Aleatório» e depois «Pronto». Toque na metade inimiga para disparar o canhão. Acertou, atira de novo. Afunde toda a frota primeiro! A dois, sentem-se frente a frente.',
    'cat.all': 'Todos', 'cat.arcade': 'Arcade', 'cat.puzzle': 'Quebra-cabeças', 'cat.board': 'Tabuleiro', 'cat.duo': 'A dois', 'cat.lan': 'Wi-Fi',
    'menu.search': 'Buscar jogo', 'menu.empty': 'Nada encontrado'
  });
  add('pl', {
    'net.lan': 'Wi-Fi', 'net.na': 'Gra sieciowa jest dostępna tylko w aplikacji na Androida.', 'net.waiting': 'Czekam na rywala…', 'net.yourIp': 'Twoje IP',
    'net.cancel': 'Anuluj', 'net.connecting': 'Łączenie…', 'net.hint': 'Oba telefony muszą być w tej samej sieci Wi-Fi (lub jeden udostępnia hotspot). Jeden tworzy grę, drugi dołącza.',
    'net.create': 'Utwórz grę', 'net.found': 'Znalezione gry', 'net.searching': 'Szukam gier w sieci…', 'net.join': 'Dołącz', 'net.error': 'Nie udało się połączyć',
    'net.lost': 'Utracono połączenie', 'net.lostHint': 'Rywal wyszedł lub sieć zniknęła.', 'net.badIp': 'Nieprawidłowy adres IP', 'net.leaveQ': 'Opuścić grę sieciową? Rywal zobaczy, że wyszedłeś.',
    'net.opp': 'RYWAL', 'net.oppTurn': 'Ruch rywala', 'chess.promote': 'Promuj piona na…',
    'bs.deploy': 'Rozstaw flotę', 'bs.deployHint': 'Przeciągnij statki, dotknij, by obrócić', 'bs.random': 'Losowo', 'bs.save': 'GOTOWE',
    'bs.passScreen': 'Przekaż telefon\ngraczowi 2', 'bs.waitPeer': 'Rywal rozstawia flotę…',
    'battleship.hint': 'Przeciągnij 5 statków na swoją planszę lub dotknij «Losowo», potem «Gotowe». Dotknij połowy wroga, by strzelić z działa. Trafienie = kolejny strzał. Zatop całą flotę pierwszy! We dwoje usiądźcie naprzeciw siebie.',
    'cat.all': 'Wszystkie', 'cat.arcade': 'Zręcznościowe', 'cat.puzzle': 'Łamigłówki', 'cat.board': 'Planszowe', 'cat.duo': 'We dwoje', 'cat.lan': 'Wi-Fi',
    'menu.search': 'Szukaj gry', 'menu.empty': 'Nic nie znaleziono'
  });
})();
