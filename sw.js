/* Guarda l'app a la tablet perquè funcioni sense internet.
   Quan canviïs algun fitxer, puja el número de VERSIO. */
const VERSIO = 'v25';
const FITXERS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/estil.css',
  'js/dades.js',
  'js/estat.js',
  'js/veu.js',
  'js/app.js',
  'icones/icona-192.png',
  'icones/icona-512.png',
  'icones/icona-mascara-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSIO).then(c => c.addAll(FITXERS.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(claus => Promise.all(claus.filter(k => k !== VERSIO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Si hi ha internet, agafa sempre la versió nova (i la guarda); si no n'hi ha, fa servir la còpia guardada.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(r => {
        if (r.ok) { const copia = r.clone(); caches.open(VERSIO).then(c => c.put(e.request, copia)); }
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
