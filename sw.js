/* El Apuntador: funciona sin conexión. La página se pide siempre a la red primero
   (así las actualizaciones llegan enseguida) y, si no hay internet, se usa la copia guardada. */
const CACHE = "apuntador-v2";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  const isPage = r.mode === "navigate" || (u.origin === location.origin && (u.pathname.endsWith("/") || u.pathname.endsWith(".html")));
  if (isPage){
    e.respondWith(
      fetch(r).then(res => { if (res.ok){ const cp = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", cp)); } return res; })
              .catch(() => caches.match("./index.html").then(x => x || caches.match("./")))
    );
    return;
  }
  e.respondWith(
    caches.match(r).then(hit => hit || fetch(r).then(res => {
      if (res && (res.ok || res.type === "opaque")){ const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
      return res;
    }))
  );
});
