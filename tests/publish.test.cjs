const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const netlifyConfig = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const expected = [
  'fonts/hanken-grotesk-latin.woff2',
  'fonts/jetbrains-mono-latin.woff2',
  'icon-192.png',
  'icon-512.png',
  'index.html',
  'js/progression.js',
  'manifest.json',
  'programme/calisthenics-einstieg.json',
  'programme/gym-ganzkoerper-beginner.json',
  'programme/gym-ganzkoerper-fortgeschritten.json',
  'programme/hybrid-gym-calisthenics.json',
  'sw.js',
  'uebungen.json'
];

function filesBelow(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const relative = path.posix.join(prefix, entry.name);
    return entry.isDirectory() ? filesBelow(path.join(directory, entry.name), relative) : [relative];
  });
}

test('creates a minimal Netlify publish directory without repository internals', () => {
  execFileSync(process.execPath, ['scripts/prepare-netlify.mjs'], { cwd: root });
  assert.deepEqual(filesBelow(output).sort(), expected);
  for (const excluded of ['README.md', 'BRIEFING-CODEX.md', 'docs', 'tests', 'test-programme', 'package.json', 'netlify']) {
    assert.equal(fs.existsSync(path.join(output, excluded)), false, `${excluded} darf nicht veröffentlicht werden`);
  }
  for (const relative of expected) {
    assert.deepEqual(fs.readFileSync(path.join(output, relative)), fs.readFileSync(path.join(root, relative)), `${relative} muss bytegleich kopiert werden`);
  }
  const serviceWorker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  for (const relative of expected.filter(file => !['sw.js'].includes(file))) {
    if (relative === 'index.html') assert.match(serviceWorker, /\.\/index\.html/);
    else assert.ok(serviceWorker.includes(`./${relative}`), `${relative} fehlt im Offline-Cache`);
  }
});

test('publishes only dist and keeps server functions outside the public directory', () => {
  assert.equal(packageJson.scripts.build, 'node scripts/prepare-netlify.mjs');
  assert.match(netlifyConfig, /\[build\][\s\S]*command = "npm run build"[\s\S]*publish = "dist"/);
  assert.match(netlifyConfig, /\[functions\][\s\S]*directory = "netlify\/functions"/);
  assert.doesNotMatch(netlifyConfig, /publish = "\."/);
});
