/* Тексты v2.4: новый дизайн меню. Базовые языки — [ru, en, uk, de, es]. Игровые тексты новых игр — в i18n-v24-*.js */
Object.assign(window.I18N_MORE = window.I18N_MORE || {}, {
  'theme.night': ['Классика', 'Classic', 'Класика', 'Klassisch', 'Clásico'],
  'theme.neon': ['Ночь', 'Night', 'Ніч', 'Nacht', 'Noche'],
  'theme.gold': ['Горчица', 'Mustard', 'Гірчиця', 'Senf', 'Mostaza'],
  'theme.ocean': ['Море', 'Sea', 'Море', 'Meer', 'Mar'],
  'theme.sunset': ['Персик', 'Peach', 'Персик', 'Pfirsich', 'Melocotón'],
  'theme.forest': ['Шалфей', 'Sage', 'Шавлія', 'Salbei', 'Salvia'],
  'app.tag': ['56 игр в одной коробке', '56 games in one box', '56 ігор в одній коробці', '56 Spiele in einer Box', '56 juegos en una caja']
});
(function () {
  var X = window.I18N_EXTRA = window.I18N_EXTRA || {};
  var add = {
    kk: { 'theme.night': 'Классика', 'theme.neon': 'Түн', 'theme.gold': 'Қыша', 'theme.ocean': 'Теңіз', 'theme.sunset': 'Шабдалы', 'theme.forest': 'Шалфей', 'app.tag': 'Бір қорапта 56 ойын' },
    tr: { 'theme.night': 'Klasik', 'theme.neon': 'Gece', 'theme.gold': 'Hardal', 'theme.ocean': 'Deniz', 'theme.sunset': 'Şeftali', 'theme.forest': 'Adaçayı', 'app.tag': 'Bir kutuda 56 oyun' },
    fr: { 'theme.night': 'Classique', 'theme.neon': 'Nuit', 'theme.gold': 'Moutarde', 'theme.ocean': 'Mer', 'theme.sunset': 'Pêche', 'theme.forest': 'Sauge', 'app.tag': '56 jeux dans une boîte' },
    it: { 'theme.night': 'Classico', 'theme.neon': 'Notte', 'theme.gold': 'Senape', 'theme.ocean': 'Mare', 'theme.sunset': 'Pesca', 'theme.forest': 'Salvia', 'app.tag': '56 giochi in una scatola' },
    pt: { 'theme.night': 'Clássico', 'theme.neon': 'Noite', 'theme.gold': 'Mostarda', 'theme.ocean': 'Mar', 'theme.sunset': 'Pêssego', 'theme.forest': 'Sálvia', 'app.tag': '56 jogos numa caixa' },
    pl: { 'theme.night': 'Klasyczny', 'theme.neon': 'Noc', 'theme.gold': 'Musztarda', 'theme.ocean': 'Morze', 'theme.sunset': 'Brzoskwinia', 'theme.forest': 'Szałwia', 'app.tag': '56 gier w jednym pudełku' }
  };
  for (var l in add) { X[l] = X[l] || {}; for (var k in add[l]) X[l][k] = add[l][k]; }
})();
