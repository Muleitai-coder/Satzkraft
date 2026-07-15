const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const sw = fs.readFileSync(new URL('../sw.js', `file://${__filename}`), 'utf8');
const changelog = fs.readFileSync(new URL('../CHANGELOG.md', `file://${__filename}`), 'utf8');
const briefing = fs.readFileSync(new URL('../BRIEFING-CODEX.md', `file://${__filename}`), 'utf8');

test('shows one app version and uses it for the service-worker cache', () => {
  const match = html.match(/var APP_VERSION="([^"]+)"/);
  assert.ok(match, 'APP_VERSION fehlt');
  const version = match[1];
  assert.match(html, /class="[^"]*appversion[^"]*"/);
  assert.match(html, /class="[^"]*versionfoot[^"]*"/);
  assert.match(html, /function showVersionInfo\(\)/);
  assert.doesNotMatch(html, /<h1>Programme<\/h1>[^\n]*<span class="appversion"/);
  assert.match(html, /Entwickelt von Christian Woyack/);
  assert.match(html, /document\.title="Satzkraft · v"\+APP_VERSION/);
  assert.ok(sw.includes(`satzkraft-v${version}`), 'Cache-Version stimmt nicht mit APP_VERSION überein');
  assert.ok(changelog.includes(`## [${version}]`), 'Aktuelle Version fehlt in CHANGELOG.md');
  assert.ok(briefing.includes(`v${version}`), 'Aktuelle Version fehlt in BRIEFING-CODEX.md');
});
