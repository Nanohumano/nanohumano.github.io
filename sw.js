/* ============================================================
   NANOHUMANO LABS · Service Worker (lo que convierte la web en app)
   - La página se pide siempre a internet primero, para que la app
     tenga siempre los productos y enlaces nuevos.
   - Si no hay conexión, enseña la última versión guardada.
   - Si cambias este archivo, sube el número de VERSION.
   ============================================================ */
const VERSION = 'nh-v2';
const BASICOS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.webmanifest',
  '/iconos/icono-192.png',
  '/iconos/icono-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASICOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(claves => Promise.all(claves.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Fotos de AliExpress, fuentes, enlaces de afiliado...: que los gestione el navegador
  if (url.origin !== location.origin) return;

  // La página: primero internet, si falla la copia guardada
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => { const copia = r.clone(); caches.open(VERSION).then(c => c.put('/index.html', copia)); return r; })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Logos e iconos: la copia guardada y se actualiza por detrás
  e.respondWith(
    caches.match(req).then(guardado => {
      const red = fetch(req).then(r => {
        if (r.ok) { const copia = r.clone(); caches.open(VERSION).then(c => c.put(req, copia)); }
        return r;
      }).catch(() => guardado);
      return guardado || red;
    })
  );
});
