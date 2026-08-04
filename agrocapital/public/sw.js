const CACHE_NAME = "agrocapital-v2";
const STATIC_ASSETS = [
  "/",
  "/fr",
  "/en",
  "/offline.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo-agrocapital.png",
  "/icon-192.png",
  "/icon-512.png",
  "/illustartion1.png",
  "/illustartion2.png",
  "/illustartion3.png",
];

// Installation : pré-mise en cache immédiate des fichiers essentiels & de la page offline
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activation : suppression stricte des anciens caches v1
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

// Interception des requêtes HTTP : Caching optimisé & Protection Hors-Ligne
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore les requêtes non-GET et les schémas non-http (ex: chrome-extension)
  if (request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // 1. Navigation de pages HTML : Network First -> Cache Fallback -> Offline Page Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // 1. Cherche la page exacte demandée dans le cache (ex: /fr/sante-culture)
          const cachedRequest = await caches.match(request);
          if (cachedRequest) return cachedRequest;

          // 2. Cherche la page d'accueil bilingue en cache
          const cachedHomeFr = await caches.match("/fr");
          if (cachedHomeFr) return cachedHomeFr;

          const cachedHomeRoot = await caches.match("/");
          if (cachedHomeRoot) return cachedHomeRoot;

          // 3. Fallback ultime : Affiche la page offline personnalisée d'Agro-Capital (JAMAIS la page noire de Chrome !)
          const offlinePage = await caches.match("/offline.html");
          if (offlinePage) return offlinePage;

          return new Response(
            "<!DOCTYPE html><html><body><h1>Hors connexion</h1></body></html>",
            { headers: { "Content-Type": "text/html" } }
          );
        })
    );
    return;
  }

  // 2. Ressources statiques (images, polices, CSS, scripts JS, Next static) : Cache First / Stale While Revalidate
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
          // Met à jour silencieusement le cache en arrière-plan
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

  // 3. Requetes API : Network First -> Cache Fallback
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
          return new Response(
            JSON.stringify({ error: "Vous êtes actuellement hors-ligne." }),
            { headers: { "Content-Type": "application/json" } }
          );
        });
      })
  );
});
