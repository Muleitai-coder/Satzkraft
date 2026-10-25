import { preparePdfAssets } from './prepare-pdf-assets.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readApplication, root } from './lib/sources.mjs';

export async function buildSource({ check = false } = {}) {
  await preparePdfAssets({ check });
  const { html } = await readApplication();
  const target = resolve(root, 'index.html');
  if (check) {
    if (await readFile(target, 'utf8') !== html) {
      throw new Error('index.html is stale. Run npm run build:source and include the generated file.');
    }
  } else {
    await writeFile(target, html);
  }
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(root, 'scripts/build-source.mjs')) {
  await buildSource({ check: process.argv.includes('--check') });
  console.log('Web source assembly verified.');
}
