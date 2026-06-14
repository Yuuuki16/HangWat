const CACHE_NAME = "hangwat-static-v1";
const CACHEABLE_DESTINATIONS = new Set([
  "font",
  "image",
  "script",
  "style",
]);
const PRECACHE_URLS = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
  "/icons/apple-touch-icon.png",
];

async function fetchOrUnavailable(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response("Network unavailable", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((error) => {
        console.error("PWAアセットの事前キャッシュに失敗しました。", error);
        throw error;
      }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !CACHEABLE_DESTINATIONS.has(request.destination)
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      let cache;
      try {
        cache = await caches.open(CACHE_NAME);
      } catch (error) {
        console.error("キャッシュを開けませんでした。", error);
        return fetchOrUnavailable(request);
      }

      let cachedResponse;
      try {
        cachedResponse = await cache.match(request);
      } catch (error) {
        console.error("キャッシュの読み込みに失敗しました。", error);
      }

      if (cachedResponse) {
        event.waitUntil(
          fetch(request)
            .then((response) => {
              if (response.ok) {
                return cache.put(request, response).catch((error) => {
                  console.error("キャッシュの更新に失敗しました。", error);
                });
              }
            })
            .catch(() => undefined),
        );

        return cachedResponse;
      }

      const networkResponse = await fetchOrUnavailable(request);

      if (networkResponse.ok) {
        event.waitUntil(
          cache.put(request, networkResponse.clone()).catch((error) => {
            console.error("レスポンスのキャッシュに失敗しました。", error);
          }),
        );
      }

      return networkResponse;
    })(),
  );
});
