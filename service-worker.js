const CACHE_NAME = 'rutas-inspeccion-v13-23';
const APP_BASE = new URL('./', self.location.href).pathname;
const STATIC_FILES = [
  './', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'
];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_FILES).catch(()=>{})));
});
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const isDocument = event.request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname === APP_BASE;
  if (isDocument) {
    event.respondWith((async()=>{
      try {
        const fresh = await fetch(event.request, {cache:'no-store'});
        const cache = await caches.open(CACHE_NAME);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch(e) {
        return (await caches.match('./index.html')) || (await caches.match('./'));
      }
    })());
    return;
  }
  event.respondWith((async()=>{
    const cached = await caches.match(event.request);
    const network = fetch(event.request).then(async res=>{
      if(res && res.ok){const cache=await caches.open(CACHE_NAME);cache.put(event.request,res.clone())}
      return res;
    }).catch(()=>null);
    return cached || await network || new Response('',{status:504});
  })());
});
