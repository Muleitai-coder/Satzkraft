import { checkArtifact, sourceFingerprint } from './freshness.mjs';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function command(name,args) {
  try { return execFileSync(name,args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim(); }
  catch { return null; }
}
const mac = command('sw_vers',['-productVersion']);
const xcode = command('xcodebuild',['-version']);
console.log(`Node: ${process.version}`);
console.log(`macOS: ${mac || 'nicht erkannt'}`);
console.log(`Xcode: ${xcode || 'fehlt oder ist nicht als Entwicklerumgebung ausgewählt'}`);
console.log(`iPhone-Projekt: ${existsSync(fileURLToPath(new URL('../ios/App/App.xcodeproj',import.meta.url))) ? 'vorhanden' : 'fehlt'}`);
const fingerprint = await sourceFingerprint();
const fresh = await checkArtifact(fileURLToPath(new URL('../ios/App/App/public/',import.meta.url)),fingerprint);
console.log(`App-Dateien: ${fresh ? 'mit aktuellem Quellstand und Dateihashes geprüft' : 'fehlen oder sind veraltet – npm run ios:sync ausführen'}`);
if (!fresh) process.exitCode = 1;
if (!xcode) {
  console.log('Nächster Schritt: docs/IOS-START.md. Apple-Anmeldung und Gerätefreigabe erfolgen durch dich.');
  process.exitCode = 1;
} else {
  console.log('Xcode öffnen, Personal Team wählen, iPhone anschließen und starten.');
  console.log('Dieser Check bestätigt weder die Apple-Signierung noch einen erfolgreichen Gerätebuild.');
}
