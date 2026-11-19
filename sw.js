const CACHE_NAME = "rihlah-umrah-shell-2df4c01990c3";
const APP_ROOT = new URL("./", self.registration.scope);
const APP_ROOT_URL = APP_ROOT.href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const response = await fetch(APP_ROOT_URL);
      if (!response.ok) throw new Error(`App shell responded with HTTP ${response.status}`);
      await cache.put(APP_ROOT_URL, response.clone());

      const html = await response.text();
      const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)]
        .map((match) => new URL(match[1], APP_ROOT).href)
        .filter((url) => new URL(url).origin === self.location.origin);
      const stylesheetAssets = await Promise.all(
        assets
          .filter((url) => new URL(url).pathname.endsWith(".css"))
          .map(async (url) => {
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`Stylesheet responded with HTTP ${response.status}`);
            }
            const stylesheet = await response.text();
            return [...stylesheet.matchAll(/url\(\s*["']?([^)"']+)["']?\s*\)/g)]
              .map((match) => new URL(match[1], url).href)
              .filter((assetUrl) => new URL(assetUrl).origin === self.location.origin);
          }),
      );
      const staticFiles = [
        new URL("manifest.webmanifest", APP_ROOT).href,
        new URL("rihlah-icon.png", APP_ROOT).href,
        new URL("rihlah-icon-192.png", APP_ROOT).href,
        ...assets,
        ...stylesheetAssets.flat(),
      ];

      await cache.addAll([...new Set(staticFiles)]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("rihlah-umrah-") && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cachedShell = await caches.match(APP_ROOT_URL);
        return cachedShell || Response.error();
      }),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(request, { ignoreVary: true });
      if (cachedResponse) return cachedResponse;

      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    })(),
  );
});
