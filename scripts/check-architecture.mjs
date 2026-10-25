import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { readApplication, root } from './lib/sources.mjs';
import { buildSource } from './build-source.mjs';

await buildSource({ check: true });
const { sources, manifest } = await readApplication();
const declared = new Set(sources.keys());
async function checkDirectory(path) {
  for (const entry of await readdir(join(root, path), { withFileTypes: true })) {
    const file = `${path}/${entry.name}`;
    if (entry.isDirectory()) await checkDirectory(file);
    else if (/\.(js|css|html)$/.test(file)) assert.ok(declared.has(file), `${file} missing from source manifest`);
  }
}
await checkDirectory('src');
const names = new Map();
for (const path of manifest.scripts) {
  const text = sources.get(path);
  assert.ok(Buffer.byteLength(text) < 125_000, `${path}: split the responsibility before adding more code`);
  if (path.startsWith('src/core/')) {
    assert.doesNotMatch(text, /\b(?:window|document|navigator|localStorage)\s*[.[]/, `${path}: platform access in core`);
  }
  for (const match of text.matchAll(/^function\s+(\w+)\s*\(/gm)) {
    assert.ok(!names.has(match[1]), `${match[1]} duplicated in ${path} and ${names.get(match[1])}`);
    names.set(match[1], path);
  }
}
const tokens = sources.get('src/styles/tokens.css');
for (const token of ['--font', '--mono', '--bg', '--panel', '--ink', '--acc', '--danger', '--touch-target', '--radius-card', '--pdf-ink', '--pdf-muted', '--pdf-accent']) {
  assert.ok(tokens.includes(`${token}:`), `Missing design token ${token}`);
}
const pkg = JSON.parse(await readFile(join(root, 'package.json')));
assert.deepEqual(pkg.dependencies, { jspdf: '4.2.1' }, 'Web runtime dependencies require an architecture decision');
console.log(`Architecture checked: ${manifest.scripts.length} source units, pure core boundary, design tokens, source freshness.`);
