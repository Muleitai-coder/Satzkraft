const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const sw = fs.readFileSync(new URL('../sw.js', `file://${__filename}`), 'utf8');

test('shows one app version and uses it for the service-worker cache', () => {
  const match = html.match(/var APP_VERSION="([^"]+)"/);
  assert.ok(match, 'APP_VERSION fehlt');
  const version = match[1];
  assert.match(html, /class="appversion"/);
  assert.match(html, /class="versionfoot"/);
  assert.match(html, /document\.title="Satzkraft · v"\+APP_VERSION/);
  assert.ok(sw.includes(`satzkraft-v${version}`), 'Cache-Version stimmt nicht mit APP_VERSION überein');
});
