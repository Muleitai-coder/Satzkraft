var CACHE = "satzkraft-v0.32.0";
var ASSETS = ["./", "./index.html", "./js/progression.js", "./manifest.json", "./icon-192.png", "./icon-512.png", "./uebungen.json", "./fonts/hanken-grotesk-latin.woff2", "./fonts/jetbrains-mono-latin.woff2", "./programme/gym-ganzkoerper-beginner.json", "./programme/gym-ganzkoerper-fortgeschritten.json", "./programme/calisthenics-einstieg.json", "./programme/hybrid-gym-calisthenics.json"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var clone = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        }
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (cached) { return cached || caches.match("./index.html"); });
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      var network = fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var clone = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
