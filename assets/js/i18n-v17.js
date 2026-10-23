/* Тексты v1.7: новое название и новое управление (змейка, змейка.io, прыгун).
   Базовые языки — массивы [ru, en, uk, de, es]; дополнительные — объекты по языкам.
   В отличие от прошлых файлов, значения здесь перекрывают старые. */
Object.assign(window.I18N_MORE = window.I18N_MORE || {}, {
  'app.title': ['GAMEBOX', 'GAMEBOX', 'GAMEBOX', 'GAMEBOX', 'GAMEBOX'],
  'snake.hint': ['Свайпай по полю, тапай в сторону поворота или жми стрелки. Ешь яблоки, лови золотые звёзды за бонус. Не врезайся в себя!',
    'Swipe on the field, tap where you want to turn or use the arrows. Eat apples, catch golden stars for a bonus. Don\'t bite yourself!',
    'Свайпай по полю, тапай у бік повороту або тисни стрілки. Їж яблука, лови золоті зірки за бонус. Не вріжся в себе!',
    'Wische über das Feld, tippe in Abbiegerichtung oder nutze die Pfeile. Iss Äpfel, fang goldene Sterne für Bonuspunkte. Beiß dich nicht selbst!',
    'Desliza por el campo, toca hacia donde quieras girar o usa las flechas. Come manzanas, atrapa estrellas doradas. ¡No te muerdas!'],
  'slither.hint': ['Коснись экрана и веди пальцем, как джойстиком, — змейка ползёт в ту сторону. ⚡ — ускорение (тратит длину). Ешь светящиеся шарики и не врезайся головой в чужие тела. Окружай ботов!',
    'Touch and drag like a joystick — the snake slithers that way. ⚡ is a speed boost (costs length). Eat glowing orbs and never hit other bodies with your head. Coil around the bots!',
    'Торкнись екрана і веди пальцем, як джойстиком, — змійка повзе в той бік. ⚡ — прискорення (витрачає довжину). Їж кульки, що світяться, і не врізайся головою в чужі тіла. Оточуй ботів!',
    'Berühren und wie einen Joystick ziehen — die Schlange kriecht in diese Richtung. ⚡ ist ein Boost (kostet Länge). Friss leuchtende Kugeln und stoße nie mit dem Kopf gegen andere Körper!',
    'Toca y arrastra como un joystick: la serpiente va hacia allí. ⚡ acelera (cuesta longitud). Come orbes brillantes y no choques la cabeza contra otros cuerpos. ¡Rodea a los bots!'],
  'slither.tip': ['веди пальцем, как джойстиком · ⚡ — ускорение', 'drag like a joystick · ⚡ boost', 'веди пальцем, як джойстиком · ⚡ — прискорення', 'wie ein Joystick ziehen · ⚡ Boost', 'arrastra como un joystick · ⚡ acelera'],
  'jumper.hint': ['Веди пальцем по экрану — герой бежит под палец. Можно и наклонять телефон. Прыжки — сами. Пружины подбрасывают высоко, коричневые платформы ломаются. Не падай!',
    'Drag your finger — the hero runs under it. You can also tilt the phone. Jumping is automatic. Springs launch you high, brown platforms break. Don\'t fall!',
    'Веди пальцем по екрану — герой біжить під палець. Можна й нахиляти телефон. Стрибки — самі. Пружини підкидають високо, коричневі платформи ламаються. Не падай!',
    'Zieh den Finger — der Held läuft darunter. Du kannst das Handy auch neigen. Gesprungen wird automatisch. Federn schleudern hoch, braune Plattformen brechen. Nicht fallen!',
    'Arrastra el dedo: el héroe corre bajo él. También puedes inclinar el móvil. Los saltos son automáticos. Los muelles te lanzan alto, las plataformas marrones se rompen. ¡No caigas!'],
  'jumper.tip': ['веди пальцем или наклоняй телефон', 'drag your finger or tilt the phone', 'веди пальцем або нахиляй телефон', 'Finger ziehen oder Handy neigen', 'arrastra el dedo o inclina el móvil']
});

(function () {
  var X = window.I18N_EXTRA = window.I18N_EXTRA || {};
  var add = {
    kk: {
      'snake.hint': 'Алаңды сипаңыз, бұрылатын жаққа түртіңіз немесе көрсеткіштерді басыңыз. Алма жеңіз, бонус үшін алтын жұлдыздарды ұстаңыз. Өзіңізді тістемеңіз!',
      'slither.hint': 'Экранға тиіп, саусақты джойстик сияқты жүргізіңіз — жылан сол жаққа жорғалайды. ⚡ — үдеу (ұзындықты жұмсайды). Басыңызбен басқалардың денесіне соқпаңыз!',
      'slither.tip': 'джойстик сияқты жүргіз · ⚡ — үдеу',
      'jumper.hint': 'Саусақты жүргізіңіз — кейіпкер саусақтың астына жүгіреді. Телефонды еңкейтуге де болады. Секіру — автоматты. Құлама!',
      'jumper.tip': 'саусақпен жүргіз немесе телефонды еңкейт'
    },
    tr: {
      'snake.hint': 'Alanda kaydır, dönmek istediğin yere dokun ya da okları kullan. Elma ye, bonus için altın yıldızları yakala. Kendini ısırma!',
      'slither.hint': 'Dokun ve joystick gibi sürükle — yılan o yöne gider. ⚡ hızlanma (uzunluk harcar). Başınla başka gövdelere çarpma. Botların etrafını sar!',
      'slither.tip': 'joystick gibi sürükle · ⚡ hızlan',
      'jumper.hint': 'Parmağını sürükle — kahraman parmağının altına koşar. Telefonu eğebilirsin de. Zıplama otomatik. Düşme!',
      'jumper.tip': 'parmağını sürükle ya da telefonu eğ'
    },
    fr: {
      'snake.hint': 'Glissez sur le terrain, touchez du côté où tourner ou utilisez les flèches. Mangez les pommes, attrapez les étoiles dorées. Ne vous mordez pas !',
      'slither.hint': 'Touchez et glissez comme un joystick : le serpent part dans cette direction. ⚡ accélère (coûte de la longueur). Ne heurtez jamais d\'autres corps avec la tête !',
      'slither.tip': 'glissez comme un joystick · ⚡ accélère',
      'jumper.hint': 'Glissez le doigt : le héros court dessous. Vous pouvez aussi incliner le téléphone. Les sauts sont automatiques. Ne tombez pas !',
      'jumper.tip': 'glissez le doigt ou inclinez le téléphone'
    },
    it: {
      'snake.hint': 'Scorri sul campo, tocca dove vuoi girare o usa le frecce. Mangia le mele, prendi le stelle d\'oro per un bonus. Non morderti!',
      'slither.hint': 'Tocca e trascina come un joystick: il serpente va in quella direzione. ⚡ accelera (costa lunghezza). Non sbattere la testa contro altri corpi!',
      'slither.tip': 'trascina come un joystick · ⚡ accelera',
      'jumper.hint': 'Trascina il dito: l\'eroe corre sotto di esso. Puoi anche inclinare il telefono. I salti sono automatici. Non cadere!',
      'jumper.tip': 'trascina il dito o inclina il telefono'
    },
    pt: {
      'snake.hint': 'Deslize no campo, toque para onde quer virar ou use as setas. Coma maçãs, pegue estrelas douradas para bônus. Não se morda!',
      'slither.hint': 'Toque e arraste como um joystick: a cobra vai nessa direção. ⚡ acelera (gasta comprimento). Não bata a cabeça em outros corpos!',
      'slither.tip': 'arraste como um joystick · ⚡ acelera',
      'jumper.hint': 'Arraste o dedo: o herói corre por baixo dele. Também pode inclinar o telemóvel. Os saltos são automáticos. Não caia!',
      'jumper.tip': 'arraste o dedo ou incline o telefone'
    },
    pl: {
      'snake.hint': 'Przesuwaj palcem po polu, stuknij w stronę skrętu lub używaj strzałek. Jedz jabłka, łap złote gwiazdy za bonus. Nie ugryź się!',
      'slither.hint': 'Dotknij i prowadź palcem jak joystickiem — wąż pełznie w tę stronę. ⚡ przyspiesza (kosztem długości). Nie uderzaj głową w cudze ciała!',
      'slither.tip': 'prowadź jak joystick · ⚡ przyspiesz',
      'jumper.hint': 'Prowadź palcem — bohater biegnie pod nim. Możesz też przechylać telefon. Skoki są automatyczne. Nie spadnij!',
      'jumper.tip': 'prowadź palcem lub przechyl telefon'
    }
  };
  for (var l in add) { X[l] = X[l] || {}; for (var k in add[l]) X[l][k] = add[l][k]; }
  for (var l2 in X) X[l2]['app.title'] = 'GAMEBOX';
})();
