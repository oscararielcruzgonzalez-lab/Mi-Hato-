const V = 'mihato-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
const EXT = [
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=Bitter:wght@600;800&family=Nunito+Sans:wght@400;600;700&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    await c.addAll(SHELL);
    await Promise.all(EXT.map(u => fetch(u, { mode: 'no-cors' }).then(r => c.put(u, r)).catch(() => {})));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== V) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const same = new URL(e.request.url).origin === location.origin;
  e.respondWith((async () => {
    const hit = await caches.match(e.request, { ignoreVary: true });
    const net = fetch(e.request).then(r => {
      if (r && (r.ok || r.type === 'opaque')) {
        const copy = r.clone();
        caches.open(V).then(c => c.put(e.request, copy));
      }
      return r;
    }).catch(() => null);
    if (hit) { if (same) e.waitUntil(net); return hit; }
    return (await net) || (await caches.match('index.html')) || Response.error();
  })());
});
