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
console.log(`App-Dateien: ${existsSync(fileURLToPath(new URL('../ios/App/App/public/native-app.js',import.meta.url))) ? 'synchronisiert' : 'npm run ios:sync ausführen'}`);
if (!xcode) {
  console.log('Nächster Schritt: docs/IOS-START.md. Apple-Anmeldung und Gerätefreigabe erfolgen durch dich.');
  process.exitCode = 1;
} else {
  console.log('Xcode öffnen, Personal Team wählen, iPhone anschließen und starten.');
  console.log('Dieser Check bestätigt weder die Apple-Signierung noch einen erfolgreichen Gerätebuild.');
}
