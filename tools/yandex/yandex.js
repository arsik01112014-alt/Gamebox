/* Яндекс Игры: SDK и сигнал о готовности игры. Подключается только в сборке для Яндекса (tools/build_yandex.sh) */
window.YANDEX = true; // engine.js прячет вход через Google: на Яндекс Играх он запрещён
// игра заявлена на Яндексе только на русском: язык фиксируется до загрузки переводов (скрипт стоит первым в index.html)
try { localStorage.setItem('lang', JSON.stringify('ru')); } catch (e) { }
window.addEventListener('load', function () {
  if (!window.YaGames) return;
  YaGames.init().then(function (ysdk) {
    window.ysdk = ysdk;
    if (ysdk.features && ysdk.features.LoadingAPI) ysdk.features.LoadingAPI.ready();
  }).catch(function () { });
});
