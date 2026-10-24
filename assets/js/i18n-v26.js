/* Тексты v2.6: выбор стиля интерфейса. [ru, en, uk, de, es] */
Object.assign(window.I18N_MORE = window.I18N_MORE || {}, {
  'skin.title': ['Стиль интерфейса', 'Interface style', 'Стиль інтерфейсу', 'Oberflächenstil', 'Estilo de interfaz'],
  'skin.glass': ['Стекло', 'Glass', 'Скло', 'Glas', 'Cristal'],
  'skin.paper': ['Бумага', 'Paper', 'Папір', 'Papier', 'Papel'],
  'skin.pixel': ['Аркада', 'Arcade', 'Аркада', 'Arcade', 'Arcade'],
  'skin.minimal': ['Минимал', 'Minimal', 'Мінімал', 'Minimal', 'Minimal'],
  'skin.material': ['Мягкий', 'Soft', "М'який", 'Weich', 'Suave'],
  'skin.comic': ['Комикс', 'Comic', 'Комікс', 'Comic', 'Cómic'],
  'skin.terminal': ['Терминал', 'Terminal', 'Термінал', 'Terminal', 'Terminal'],
  'skin.liquid': ['Жидкое стекло', 'Liquid Glass', 'Рідке скло', 'Flüssigglas', 'Cristal líquido'],
  'skin.liquiddark': ['Жидкое стекло · тёмное', 'Liquid Glass · dark', 'Рідке скло · темне', 'Flüssigglas · dunkel', 'Cristal líquido · oscuro']
});
(function () {
  var X = window.I18N_EXTRA = window.I18N_EXTRA || {};
  var add = {
    kk: { 'skin.title': 'Интерфейс стилі', 'skin.glass': 'Шыны', 'skin.paper': 'Қағаз', 'skin.pixel': 'Аркада', 'skin.minimal': 'Минимал', 'skin.material': 'Жұмсақ', 'skin.comic': 'Комикс', 'skin.terminal': 'Терминал' },
    tr: { 'skin.title': 'Arayüz stili', 'skin.glass': 'Cam', 'skin.paper': 'Kâğıt', 'skin.pixel': 'Atari', 'skin.minimal': 'Minimal', 'skin.material': 'Yumuşak', 'skin.comic': 'Çizgi roman', 'skin.terminal': 'Terminal' },
    fr: { 'skin.title': "Style d'interface", 'skin.glass': 'Verre', 'skin.paper': 'Papier', 'skin.pixel': 'Arcade', 'skin.minimal': 'Minimal', 'skin.material': 'Doux', 'skin.comic': 'BD', 'skin.terminal': 'Terminal' },
    it: { 'skin.title': 'Stile interfaccia', 'skin.glass': 'Vetro', 'skin.paper': 'Carta', 'skin.pixel': 'Arcade', 'skin.minimal': 'Minimal', 'skin.material': 'Morbido', 'skin.comic': 'Fumetto', 'skin.terminal': 'Terminale' },
    pt: { 'skin.title': 'Estilo da interface', 'skin.glass': 'Vidro', 'skin.paper': 'Papel', 'skin.pixel': 'Arcade', 'skin.minimal': 'Minimal', 'skin.material': 'Suave', 'skin.comic': 'Quadrinhos', 'skin.terminal': 'Terminal' },
    pl: { 'skin.title': 'Styl interfejsu', 'skin.glass': 'Szkło', 'skin.paper': 'Papier', 'skin.pixel': 'Arcade', 'skin.minimal': 'Minimal', 'skin.material': 'Miękki', 'skin.comic': 'Komiks', 'skin.terminal': 'Terminal' }
  };
  for (var l in add) { X[l] = X[l] || {}; for (var k in add[l]) X[l][k] = add[l][k]; }
})();
