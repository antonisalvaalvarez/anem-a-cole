/* Guarda l'app a la tablet perquè funcioni sense internet.
   Quan canviïs algun fitxer, puja el número de VERSIO. */
const VERSIO = 'v13';
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

// Primer mira la còpia guardada; si no hi és, la demana a internet.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request))
  );
});
