import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative } from 'node:path';
import { Script } from 'node:vm';

export const root = fileURLToPath(new URL('../../', import.meta.url));

// The manifest is ordered because the compatibility application still shares
// one scope. No implicit filesystem traversal or extra publishable files.
export async function readApplication() {
  const manifest = JSON.parse(await readFile(resolve(root, 'src/sources.json'), 'utf8'));
  const paths = ['src/shell.html', manifest.theme, ...manifest.styles, ...manifest.scripts];
  if (new Set(paths).size !== paths.length) throw new Error('Duplicate source in manifest');
  const sources = new Map();
  for (const path of paths) {
    if (!path.startsWith('src/') || relative(root, resolve(root, path)).startsWith('..')) {
      throw new Error(`Source outside src/: ${path}`);
    }
    sources.set(path, await readFile(resolve(root, path), 'utf8'));
  }
  const theme = sources.get(manifest.theme);
  const code = manifest.scripts.map(path => sources.get(path)).join('\n');
  const css = manifest.styles.map(path => sources.get(path)).join('\n');
  new Script(theme, { filename: manifest.theme });
  new Script(code, { filename: 'assembled-app.js' });
  let html = sources.get('src/shell.html');
  for (const [token, replacement] of Object.entries({
    '{{STYLES}}': `<style>\n${css}</style>`,
    '{{THEME}}': `<script>\n${theme}</script>`,
    '{{APP}}': `<script>\n${code}</script>`,
  })) {
    if (html.split(token).length !== 2) throw new Error(`Expected one ${token}`);
    html = html.replace(token, () => replacement);
  }
  return { html, code, css, theme, manifest, sources };
}
