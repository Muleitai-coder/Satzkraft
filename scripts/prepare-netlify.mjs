import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = join(root, "dist");
const publicFiles = [
  "index.html",
  "sw.js",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "uebungen.json",
  "js/progression.js",
  "fonts/hanken-grotesk-latin.woff2",
  "fonts/jetbrains-mono-latin.woff2",
  "programme/gym-ganzkoerper-beginner.json",
  "programme/gym-ganzkoerper-fortgeschritten.json",
  "programme/calisthenics-einstieg.json",
  "programme/hybrid-gym-calisthenics.json"
];

await rm(output, { recursive: true, force: true });
for (const relativePath of publicFiles) {
  const target = join(output, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await cp(join(root, relativePath), target);
}

console.log(`Netlify-Publish-Verzeichnis vorbereitet: ${publicFiles.length} Dateien`);
