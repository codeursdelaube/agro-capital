const CACHE_NAME = "agrocapital-v3";
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
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch((err) => console.warn("SW install cache error:", err))
  );
});

// Activation : prise de contrôle immédiate & nettoyage des anciens caches
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

// Écoute des messages du client (déclenchement de la mise à jour 1-clic)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Interception des requêtes HTTP : Caching optimisé & Protection Hors-Ligne Infaillible
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore les requêtes non-GET et les schémas non-http (ex: chrome-extension)
  if (request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // 1. Navigation de pages HTML (request.mode === "navigate")
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // A. Cherche la page exacte demandée dans le cache (ex: /fr/sante-culture)
          const cachedRequest = await caches.match(request);
          if (cachedRequest) return cachedRequest;

          // B. Cherche la page demandée sans la chaîne de requête
          const cachedUrl = await caches.match(url.pathname);
          if (cachedUrl) return cachedUrl;

          // C. Cherche la page d'accueil bilingue en cache
          const cachedHomeFr = await caches.match("/fr");
          if (cachedHomeFr) return cachedHomeFr;

          const cachedHomeRoot = await caches.match("/");
          if (cachedHomeRoot) return cachedHomeRoot;

          // D. Fallback ultime : Affiche la page offline personnalisée d'Agro-Capital (JAMAIS l'écran noir de Chrome !)
          const offlinePage = await caches.match("/offline.html");
          if (offlinePage) return offlinePage;

          return new Response(
            `<!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><title>Mode Hors-Ligne</title></head>
            <body style="background:#022c22;color:#fff;text-align:center;padding:3rem;font-family:sans-serif;">
              <h1>AgroCapital — Mode Hors-Ligne</h1>
              <p>Vous êtes hors connexion. Veuillez vous reconnecter à internet.</p>
              <button onclick="location.reload()" style="background:#059669;color:#fff;border:none;padding:10px 20px;border-radius:10px;font-weight:bold;cursor:pointer;">Réessayer</button>
            </body>
            </html>`,
            { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 }
          );
        })
    );
    return;
  }

  // 2. Ressources statiques (images, polices, CSS, scripts JS, Next static) : Stale While Revalidate / Cache First
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
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. Requêtes API : Network First -> Cache Fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
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
            JSON.stringify({ error: "Vous êtes actuellement hors-ligne.", offline: true }),
            { headers: { "Content-Type": "application/json" }, status: 200 }
          );
        });
      })
  );
});
