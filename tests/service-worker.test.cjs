const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(new URL('../sw.js', `file://${__filename}`), 'utf8');
const currentCache = source.match(/var CACHE = "([^"]+)";/)?.[1];
assert.ok(currentCache, 'aktuelle Service-Worker-Cache-Version fehlt');

function serviceWorkerContext(options = {}) {
  const handlers = {};
  const deleted = [];
  const puts = [];
  const cachedResponse = options.cachedResponse || new Response('cached');
  const cache = {
    match: async request => {
      if (request === './index.html') return cachedResponse;
      return options.cacheHit === false ? undefined : cachedResponse;
    },
    addAll: async () => {},
    put: async (request, response) => {
      puts.push({ request, response });
    }
  };
  const context = {
    self: {
      addEventListener: (type, handler) => {
        handlers[type] = handler;
      },
      skipWaiting: async () => {},
      clients: { claim: async () => {} },
      registration: { scope: 'https://satzkraft.example/' }
    },
    caches: {
      open: async name => {
        assert.equal(name, currentCache);
        return cache;
      },
      keys: async () => options.keys || [],
      delete: async name => {
        deleted.push(name);
        return true;
      }
    },
    fetch: options.fetch || (async () => new Response('network')),
    location: { origin: 'https://satzkraft.example', href: 'https://satzkraft.example/sw.js' },
    URL,
    Response,
    AbortController,
    setTimeout,
    clearTimeout
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return { handlers, deleted, puts, cachedResponse };
}

test('activation removes only current and legacy Satzkraft caches', async () => {
  const harness = serviceWorkerContext({
    keys: [
      'satzkraft-v0.31.0',
      'satzkraft-v0.32.0',
      'satzkraft-v0.33.0',
      'satzkraft-v0.33.1',
      'satzkraft-v0.33.2',
      'trainings-block-v9',
      'unrelated-app'
    ]
  });
  let lifetime;
  harness.handlers.activate({ waitUntil: promise => { lifetime = promise; } });
  await lifetime;
  assert.deepEqual(harness.deleted.sort(), ['satzkraft-v0.31.0', 'satzkraft-v0.32.0', 'satzkraft-v0.33.0', 'satzkraft-v0.33.1', 'satzkraft-v0.33.2', 'trainings-block-v9']);
});

test('asset requests read only the current cache and keep revalidation alive', async () => {
  const harness = serviceWorkerContext({ cacheHit: true });
  let responsePromise;
  let lifetime;
  const request = {
    method: 'GET',
    url: 'https://satzkraft.example/index.html',
    mode: 'same-origin'
  };
  harness.handlers.fetch({
    request,
    respondWith: promise => { responsePromise = promise; },
    waitUntil: promise => { lifetime = promise; }
  });

  assert.ok(responsePromise, 'respondWith fehlt');
  assert.ok(lifetime, 'die Hintergrundaktualisierung muss mit waitUntil am Leben bleiben');
  assert.equal(await (await responsePromise).text(), 'cached');
  await lifetime;
  assert.equal(harness.puts.length, 1);
  assert.doesNotMatch(source, /\bcaches\.match\(/, 'globale Cache-Suche könnte veraltete App-Caches lesen');
});

test('precache contains one shell copy and ignores unrelated same-origin requests', () => {
  assert.doesNotMatch(source, /var ASSETS = \["\.\/",/, 'Root und index.html würden dieselbe App-Shell doppelt vorhalten');
  const harness = serviceWorkerContext();
  let responded = false;
  let lifetime = false;
  harness.handlers.fetch({
    request: {
      method: 'GET',
      url: 'https://satzkraft.example/docs/private-audit.html',
      mode: 'same-origin'
    },
    respondWith: () => { responded = true; },
    waitUntil: () => { lifetime = true; }
  });
  assert.equal(responded, false);
  assert.equal(lifetime, false);
});

test('intercepts only the app shell as navigation', () => {
  const harness = serviceWorkerContext();
  let unrelated = false;
  harness.handlers.fetch({
    request: { method: 'GET', url: 'https://satzkraft.example/docs/', mode: 'navigate' },
    respondWith: () => { unrelated = true; },
    waitUntil: () => {}
  });
  assert.equal(unrelated, false);
});
