const CACHE_NAME = "agrocapital-v4";
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

// Activation : prise de contrôle immédiate & nettoyage des anciens caches (v1, v2, v3)
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

// Interception des requêtes HTTP : Caching optimisé & Navigation Hors-Ligne Propre
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
          const cachedRequest = await caches.match(request, { ignoreSearch: true });
          if (cachedRequest) return cachedRequest;

          // B. Cherche la page demandée sans le pathname de locale ou paramètres
          const cachedUrl = await caches.match(url.pathname, { ignoreSearch: true });
          if (cachedUrl) return cachedUrl;

          // C. Fallback ultime : Affiche la page offline dédiée d'Agro-Capital (Ne redirige PAS vers l'accueil !)
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

  // 2. Requêtes RSC (React Server Components Next.js ?_rsc=...) & Données de navigation Next.js
  if (url.searchParams.has("_rsc") || request.headers.get("RSC")) {
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
          const cachedRsc = await caches.match(request, { ignoreSearch: true });
          if (cachedRsc) return cachedRsc;

          const cachedUrlRsc = await caches.match(url.pathname, { ignoreSearch: true });
          if (cachedUrlRsc) return cachedUrlRsc;

          // Si payload RSC introuvable hors-ligne, retourne une réponse vide ou le fallback offline
          const offlinePage = await caches.match("/offline.html");
          if (offlinePage) return offlinePage;

          return new Response(JSON.stringify({ offline: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
          });
        })
    );
    return;
  }

  // 3. Ressources statiques (images, polices, CSS, scripts JS, Next static) : Stale While Revalidate / Cache First
  if (
    request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "style" ||
    request.destination === "script" ||
    url.pathname.startsWith("/_next/static")
  ) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
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

  // 4. Requêtes API : Network First -> Cache Fallback
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
        return caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
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
