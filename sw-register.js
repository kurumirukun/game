/* register the offline worker; harmless where service workers are unavailable */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function () {});
  });
}
