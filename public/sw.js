// Cleanup-only service worker.
// The old PWA worker cached broken checkout/admin builds in some browsers.
// This version deletes all Lunaris caches, then unregisters itself.

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("lunaris")).map((key) => caches.delete(key)))),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("lunaris")).map((key) => caches.delete(key))))
      .then(() => self.registration.unregister()),
  );
});

self.addEventListener("fetch", () => {
  // No caching. Let the browser hit the network normally.
});
