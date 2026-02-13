const CACHE_NAME = "renum-cache-v1";
const OFFLINE_URL = "/offline.html";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/favicon.ico",
  "/manifest.json",
];

// Install - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // ignore failures
      });
    }),
  );
  self.skipWaiting();
});

// Activate - cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
          return null;
        }),
      ),
    ),
  );
  self.clients.claim();
});

// Fetch - respond from cache first, then network, fallback to offline
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Safely parse URL and ignore non-http(s) schemes (e.g. chrome-extension://)
  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    // Invalid URL — ignore and let browser handle it
    return;
  }

  // Only handle http and https requests here
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // For cross-origin requests, don't attempt to cache — just fetch and fallback to offline
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(req)
        .then((res) => res)
        .catch(() => caches.match(OFFLINE_URL)),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          // Cache only valid, same-origin, successful responses
          if (!res || res.status !== 200 || res.type !== "basic") return res;
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, resClone).catch(() => {
              // ignore cache.put errors (e.g. quota issues)
            });
          });
          return res;
        })
        .catch(() => null);

      return cached || fetchPromise || caches.match(OFFLINE_URL);
    }),
  );
});