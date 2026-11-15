// Minimal service worker: exists so the diary can be installed to a phone's
// home screen. It is a network passthrough — the app stores all data locally,
// so there is nothing worth precaching and nothing to intercept.
const CACHE = "know-thyself-shell";
self.addEventListener("install", (event) => { event.waitUntil(self.skipWaiting()); });
self.addEventListener("activate", (event) => { event.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((hit) => hit ?? Response.error()))
  );
});
