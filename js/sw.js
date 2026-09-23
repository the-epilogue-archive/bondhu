// ==========================================
// Bondhu Service Worker v4
// ==========================================
const CACHE_NAME = "bondhu-v4";
const STATIC_ASSETS = [
  "/bondhu/",
  "/bondhu/index.html",
  "/bondhu/assets/icon-192.png",
  "/bondhu/assets/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => console.warn(err));
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => { if (k !== CACHE_NAME) return caches.delete(k); })
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = e.request.url;
  if (
    url.includes("firebase") || url.includes("cloudinary") ||
    url.includes("api.github.com") || url.includes("gstatic.com") ||
    url.includes("googleapis.com")
  ) return;

  if (
    url.endsWith(".js") || url.endsWith(".css") ||
    url.endsWith(".html") || e.request.mode === "navigate"
  ) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone).catch(() => {}));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res && res.status === 200 && e.request.method === "GET") {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone).catch(() => {}));
        }
        return res;
      });
    })
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});
