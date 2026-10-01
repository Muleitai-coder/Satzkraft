var CACHE = "satzkraft-v0.33.4";
var ASSETS = ["./index.html", "./js/progression.js", "./manifest.json", "./icon-192.png", "./icon-512.png", "./uebungen.json", "./fonts/hanken-grotesk-latin.woff2", "./fonts/jetbrains-mono-latin.woff2", "./programme/gym-ganzkoerper-beginner.json", "./programme/gym-ganzkoerper-fortgeschritten.json", "./programme/calisthenics-einstieg.json", "./programme/hybrid-gym-calisthenics.json"];
var APP_SCOPE = self.registration && self.registration.scope ? self.registration.scope : new URL("./", location.href).href;

function isAppNavigation(request) {
  var url = new URL(request.url);
  return url.href === new URL("./", APP_SCOPE).href || url.href === new URL("./index.html", APP_SCOPE).href;
}

function isCacheableAsset(request) {
  var href = new URL(request.url).href;
  return ASSETS.some(function (asset) { return new URL(asset, APP_SCOPE).href === href; });
}

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k !== CACHE && (k.indexOf("satzkraft-") === 0 || k.indexOf("trainings-block-") === 0);
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function offlineNavigation(cache, cached) {
  if (cached) return Promise.resolve(cached);
  return cache.match("./index.html").then(function (fallback) {
    return fallback || new Response("Satzkraft ist gerade offline nicht verfügbar.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
  });
}

function fetchWithTimeout(request, timeoutMs) {
  if (typeof AbortController !== "function") return fetch(request);
  var controller = new AbortController();
  var timeout = setTimeout(function () { controller.abort(); }, timeoutMs);
  return fetch(request, { signal: controller.signal }).then(function (response) {
    clearTimeout(timeout);
    return response;
  }, function (error) {
    clearTimeout(timeout);
    throw error;
  });
}

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  if (e.request.mode === "navigate") {
    if (!isAppNavigation(e.request)) return;
    e.respondWith(
      caches.open(CACHE).then(function (cache) {
       return cache.match(e.request).then(function (cached) {
        return fetchWithTimeout(e.request, 5000).then(function (res) {
          if (!res || res.status >= 500) return offlineNavigation(cache, cached);
          if (!res.ok) return res;
          var clone = res.clone();
          return cache.put(e.request, clone).then(function () { return res; });
        }).catch(function () {
          return offlineNavigation(cache, cached);
        });
       });
      })
    );
    return;
  }
  if (!isCacheableAsset(e.request)) return;
  var cachePromise = caches.open(CACHE);
  var cachedPromise = cachePromise.then(function (cache) { return cache.match(e.request); });
  var networkPromise = cachePromise.then(function (cache) {
    return fetch(e.request).then(function (res) {
      if (res && res.ok) {
        var clone = res.clone();
        return cache.put(e.request, clone).then(function () { return res; });
      }
      return res;
    });
  });
  e.waitUntil(networkPromise.then(function () {}, function () {}));
  e.respondWith(
    cachedPromise.then(function (cached) {
      return cached || networkPromise.catch(function () { return cached; });
    })
  );
});
