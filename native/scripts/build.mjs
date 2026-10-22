import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { build } from 'esbuild';
import { adaptApp } from './adapt.mjs';

const root = fileURLToPath(new URL('../../',import.meta.url));
const native = join(root,'native'), output = join(native,'www');
const publicFiles = ['icon-192.png','icon-512.png','uebungen.json','js/progression.js',
  'fonts/hanken-grotesk-latin.woff2','fonts/jetbrains-mono-latin.woff2',
  'programme/gym-ganzkoerper-beginner.json','programme/gym-ganzkoerper-fortgeschritten.json',
  'programme/calisthenics-einstieg.json','programme/hybrid-gym-calisthenics.json'];
let html = await readFile(join(root,'index.html'),'utf8');
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (inline.length !== 2) throw new Error('Expected theme and application script; review native build');
const overrides = await readFile(join(native,'src/overrides.js'),'utf8');
const code = adaptApp(inline[0][1]+'\n'+inline[1][1],overrides);
html = html.replace(inline[0][0],'').replace(inline[1][0],'<script src="native-bridge.js"></script>')
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
console.log('iPhone-Paket vorbereitet: lokale App-Dateien, nativer Speicher und Dateifreigabe.');
