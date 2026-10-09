if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
const shared=new URLSearchParams(location.search);if(shared.has('share')){
  const text=[shared.get('text'),shared.get('url')].filter(Boolean).join('\n');
  if(text){$('capture').value=text;schedulePreview();$('capture').focus()}
  history.replaceState(null,'',location.pathname);
}
