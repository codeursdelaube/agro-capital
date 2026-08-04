const CACHE_NAME = "agrocapital-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/illustartion1.png",
  "/illustartion2.png",
  "/illustartion3.png",
];

// Installation : pré-mise en cache des fichiers essentiels
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name.startsWith("agrocapital-") && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Interception des requêtes HTTP : Caching optimisé
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore les requêtes non-GET et les requêtes Chrome extensions / dev
  if (request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // 1. Ressources statiques (images, polices, CSS, JS) : Cache First -> Network Fallback
  if (
    request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "style" ||
    request.destination === "script" ||
    url.pathname.startsWith("/_next/static")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Met à jour silencieusement le cache en arrière-plan (Stale While Revalidate)
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. Navigation et API Routes : Network First -> Cache Fallback (pour fonctionnement hors-ligne)
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si page HTML introuvable en cache, retourne la page d'accueil en cache
          if (request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response(
            JSON.stringify({ error: "Vous êtes actuellement hors-ligne." }),
            { headers: { "Content-Type": "application/json" } }
          );
        });
      })
  );
});
