import { cp, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { root } from './lib/sources.mjs';

// Only the pinned UMD build is shipped. HTML conversion and remote resources are unused.
export async function preparePdfAssets({ check = false } = {}) {
  const files = [['node_modules/jspdf/dist/jspdf.umd.min.js', 'vendor/jspdf.umd.min.js'],
    ['node_modules/jspdf/LICENSE', 'vendor/LICENSE-jsPDF.txt']];
  for (const [source, target] of files) {
    if (check) {
      if (!(await readFile(join(root, source))).equals(await readFile(join(root, target)))) {
        throw new Error(`${target} is stale. Run npm run build:source.`);
      }
    } else {
      await mkdir(join(root, 'vendor'), { recursive: true });
      await cp(join(root, source), join(root, target));
    }
  }
}
