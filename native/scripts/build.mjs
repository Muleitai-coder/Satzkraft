import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { build } from 'esbuild';
import { preparePdfAssets } from '../../scripts/prepare-pdf-assets.mjs';
import { adaptApp } from './adapt.mjs';
import { readApplication } from '../../scripts/lib/sources.mjs';
import { publicFiles, sourceFingerprint, artifactHashes } from './freshness.mjs';

const root = fileURLToPath(new URL('../../',import.meta.url));
const native = join(root,'native'), output = join(native,'www');
await preparePdfAssets();
const shared = await readApplication();
const overrides = await readFile(join(native,'src/overrides.js'),'utf8');
const code = adaptApp(shared.theme+'\n'+shared.code,overrides);
let html = shared.html
  .replace('<script>\n'+shared.theme+'</script>','')
  .replace('<script>\n'+shared.code+'</script>','<script src="native-bridge.js"></script>')
  .replace('<link rel="manifest" href="manifest.json">','')
  .replace('</head>','<link rel="stylesheet" href="native.css">\n</head>');
await rm(output,{ recursive:true,force:true });
await mkdir(output,{ recursive:true });
for (const file of publicFiles) {
  await mkdir(dirname(join(output,file)),{ recursive:true });
  await cp(join(root,file),join(output,file));
}
await writeFile(join(output,'index.html'),html);
await writeFile(join(output,'native-app.js'),code);
await cp(join(native,'src/native.css'),join(output,'native.css'));
await build({ entryPoints:[join(native,'src/bridge.mjs')], bundle:true, outfile:join(output,'native-bridge.js'),
  format:'iife', platform:'browser', target:'safari15', legalComments:'eof' });
await writeFile(join(output,'build-info.json'),JSON.stringify({ version:1, source:await sourceFingerprint(), files:await artifactHashes(output) },null,2)+'\n');
console.log('iPhone-Paket vorbereitet: lokale App-Dateien, nativer Speicher und Dateifreigabe.');
