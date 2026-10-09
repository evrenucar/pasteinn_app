const CACHE='pasteinn-core-v1';
const SHELL=['concept.html','concept.css','concept.js','capture.js','drawing.js','local-core.js','sync.js','sync-protocol.js','install.js','vendor/lucide-1.53.0.min.js','vendor/fflate-0.8.3.min.js','vendor/ocr/tesseract.min.js','assets/a-little-space.png','assets/paste-inn-wordmark.png','assets/paper-grain.svg','manifest.webmanifest','assets/app-icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pasteinn-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==location.origin||url.pathname.startsWith('/api/'))return;
  event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)))}return response}).catch(async()=>{
    const cached=await caches.match(event.request,{ignoreSearch:event.request.mode==='navigate'});return cached||(event.request.mode==='navigate'?await caches.match('concept.html'):null)||new Response('Unavailable offline',{status:503});
  }));
});
