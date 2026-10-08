const APP_VERSION = '0.33.4';
const CACHE_NAME = `repasos-${APP_VERSION}`;
const AUDIO_CACHE_NAME = 'aprendizaje-audio-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest-v5.webmanifest',
  './music-catalog.json',
  './demo-data.js',
  './fonts/Perfect-DOS-VGA-437.ttf',
  './fonts/m04.TTF',
  './fonts/Minecraft.ttf',
  './fonts/PokemonGb-RAeo.ttf',
  './assets/pokemon/bonus.mp3',
  './assets/pokemon/clic.mp3',
  './assets/pokemon/fallo.mp3',
  './assets/pokemon/juego-1.mp3',
  './assets/pokemon/nivel-juego.mp3',
  './assets/pokemon/nivel-app.mp3',
  './assets/pokemon/opening.mp3',
  './assets/pokemon/portada-inicial.mp3',
  './assets/pokemon/relampago.mp3',
  './assets/pokemon/repaso-terminado.mp3',
  './assets/pokemon/salir-juego.mp3',
  './assets/pokemon/salir-menu.mp3',
  './assets/pokemon/transicion.mp3',
  './assets/pokemon/fondo-rojo.png',
  './assets/pokemon/fondo-verde.png',
  './assets/pokemon/fondo-moderno.png',
  './icon-192-v5.png',
  './icon-192-maskable-v5.png',
  './icon-512-v5.png',
  './icon-512-maskable-v5.png',
  './icon-1024-v5.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME && key !== AUDIO_CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then(cached => {
        if (cached) return cached;
        return fetch(event.request)
          .then(response => {
            if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put('./index.html', response.clone()));
            return response;
          })
          .catch(() => caches.match('./'));
      })
    );
    return;
  }

  if (/\/music\/.*\.(?:mp3|ogg)$/i.test(url.pathname)) {
    event.respondWith((async () => {
      const audioCache = await caches.open(AUDIO_CACHE_NAME);
      const cached = await audioCache.match(event.request);
      if (cached) {
        const range = event.request.headers.get('range');
        if (!range) return cached;
        const buffer = await cached.arrayBuffer();
        const match = /bytes=(\d+)-(\d*)/i.exec(range);
        if (!match) return cached;
        const start = Number(match[1]), end = match[2] ? Number(match[2]) : buffer.byteLength - 1;
        const safeEnd = Math.min(end, buffer.byteLength - 1);
        if (start > safeEnd) return new Response(null, {status:416,headers:{'Content-Range':`bytes */${buffer.byteLength}`}});
        return new Response(buffer.slice(start,safeEnd+1), {status:206,headers:{
          'Content-Type': cached.headers.get('Content-Type') || (/\.ogg$/i.test(url.pathname)?'audio/ogg':'audio/mpeg'),
          'Content-Length': String(safeEnd-start+1),
          'Content-Range': `bytes ${start}-${safeEnd}/${buffer.byteLength}`,
          'Accept-Ranges':'bytes'
        }});
      }
      const response = await fetch(event.request);
      if (response.ok && response.status === 200) audioCache.put(event.request, response.clone());
      return response;
    })());
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fresh = fetch(event.request).then(response => {
        if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        return response;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
