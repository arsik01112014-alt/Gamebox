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
// реклама Яндекса: полноэкранная после партии (не чаще раза в минуту) и за награду; звук на время показа выключается
function gbAudio(on) { if (window.GBAudio) window.GBAudio(on); }
window.GBAds = {
  last: 0,
  inter: function () {
    if (!window.ysdk || Date.now() - this.last < 60000) return;
    this.last = Date.now();
    ysdk.adv.showFullscreenAdv({ callbacks: { onOpen: function () { gbAudio(false); }, onClose: function () { gbAudio(true); }, onError: function () { gbAudio(true); } } });
  },
  reward: function (onReward) {
    if (!window.ysdk) return;
    ysdk.adv.showRewardedVideo({ callbacks: { onOpen: function () { gbAudio(false); }, onRewarded: onReward, onClose: function () { gbAudio(true); }, onError: function () { gbAudio(true); } } });
  }
};
