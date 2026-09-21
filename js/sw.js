// ==========================================
// Bondhu - Service Worker
// Network-first for JS/CSS (always fresh)
// ==========================================

const CACHE_NAME = "bondhu-v3";
const STATIC_ASSETS = [
  "/bondhu/",
  "/bondhu/index.html",
  "/bondhu/assets/icon-192.png",
  "/bondhu/assets/icon-512.png"
];

// Install
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Some assets fail:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate — purono cache delete
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network-first for JS/CSS/HTML
self.addEventListener("fetch", (e) => {
  const url = e.request.url;

  // Firebase / Cloudinary / GitHub / Google — network only
  if (
    url.includes("firebase") ||
    url.includes("cloudinary") ||
    url.includes("api.github.com") ||
    url.includes("gstatic.com") ||
    url.includes("googleapis.com")
  ) {
    return;
  }

  // JS / CSS / HTML — ALWAYS network first (notun code)
  if (
    url.endsWith(".js") ||
    url.endsWith(".css") ||
    url.endsWith(".html") ||
    e.request.mode === "navigate"
  ) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, clone).catch(() => {});
            });
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Images etc — cache first, network fallback
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res && res.status === 200 && e.request.method === "GET") {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, clone).catch(() => {});
          });
        }
        return res;
      });
    })
  );
});

// Message handler
self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
