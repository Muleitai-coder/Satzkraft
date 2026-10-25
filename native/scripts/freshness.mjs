import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { root, readApplication } from '../../scripts/lib/sources.mjs';

export const publicFiles = ['icon-192.png', 'icon-512.png', 'uebungen.json', 'js/progression.js',
  'fonts/hanken-grotesk-latin.woff2', 'fonts/jetbrains-mono-latin.woff2',
  'programme/gym-ganzkoerper-beginner.json', 'programme/gym-ganzkoerper-fortgeschritten.json',
  'programme/calisthenics-einstieg.json', 'programme/hybrid-gym-calisthenics.json'];
const digest = data => createHash('sha256').update(data).digest('hex');
export async function sourceFingerprint() {
  const { sources } = await readApplication();
  const files = [...sources.keys(), 'src/sources.json', 'scripts/lib/sources.mjs',
    'native/scripts/build.mjs', 'native/scripts/adapt.mjs', 'native/scripts/freshness.mjs',
    'native/src/overrides.js', 'native/src/bridge.mjs', 'native/src/storage.mjs', 'native/src/native.css',
    'native/package-lock.json', 'native/capacitor.config.json', ...publicFiles];
  const hash = createHash('sha256');
  for (const path of files.sort()) hash.update(path + '\0').update(await readFile(join(root, path))).update('\0');
  return hash.digest('hex');
}
export async function artifactHashes(directory) {
  const files = {};
  async function visit(path) {
    for (const entry of (await readdir(path, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
      const full = join(path, entry.name);
      if (entry.isDirectory()) await visit(full);
      else if (entry.name !== 'build-info.json') files[relative(directory, full)] = digest(await readFile(full));
    }
  }
  await visit(directory);
  return files;
}
export async function checkArtifact(directory, expectedFingerprint = null) {
  try {
    const info = JSON.parse(await readFile(join(directory, 'build-info.json'), 'utf8'));
    if (info.version !== 1 || info.source !== (expectedFingerprint || await sourceFingerprint())) return false;
    if (!info.files || !Object.keys(info.files).length) return false;
    for (const [path, hash] of Object.entries(info.files)) {
      if (path.includes('..') || path.startsWith('/') || digest(await readFile(join(directory, path))) !== hash) return false;
    }
    return true;
  } catch { return false; }
}
