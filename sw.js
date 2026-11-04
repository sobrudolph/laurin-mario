// Service worker – offline hra + automatické aktualizácie.
// VERZIA mení tools/nasad.py; zmena tohto súboru spustí aktualizáciu u všetkých hráčov.
const VERZIA = '0.04';
const CACHE = 'laurinka-' + VERZIA;
const SUBORY = [
  './', 'index.html', 'style.css', 'manifest.webmanifest',
  'js/verzia.js', 'js/level1.js', 'js/zvuky.js', 'js/foto.js', 'js/hra.js',
  'assets/hrac.png', 'assets/hrac_foto.png', 'assets/macka.png', 'assets/hrib.png', 'assets/korytnacka.png',
  'assets/sprites.json', 'assets/ikony/ikona-192.png', 'assets/ikony/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SUBORY.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(n => n.startsWith('laurinka-') && n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Najprv sieť (vždy najnovšia verzia), bez internetu sa použije uložená kópia.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    // podľa URL (nie podľa req) – navigačné požiadavky sa nedajú klonovať s inými voľbami
    fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
      .then(res => {
        if (res.ok) {
          const kopia = res.clone();
          caches.open(CACHE).then(c => c.put(req, kopia));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
