# Satzkraft – persönlicher iPhone-Pilot

Capacitor 8.5.3, iOS 15+, App 0.39.0 / Build 1. Separates npm-Projekt mit festgeschriebenem Lockfile. [Installation ohne Bezahlabo](../docs/IOS-START.md).

## Aufbau

- `ios/App/App.xcodeproj`: offizielles Capacitor-SPM-Projekt, eigenes Satzkraft-Icon, deutscher Anzeigename, iPhone-Target, Privacy Manifest. Gemeinsames `project.xcworkspace/xcshareddata/swiftpm/Package.resolved` hält Capacitor 8.5.3 und ion-ios-filesystem 2.0.1 fest. Keine Team-ID, Zertifikate oder bezahlten Capabilities eingecheckt.
- `scripts/build.mjs`: kopiert ausschließlich öffentliche App-Ressourcen nach `www/`; keine Netlify-URL, kein Live-Reload-Server, kein Service Worker. Übungsbibliothek, vier Programme und Schriften sind mitgeliefert.
- `scripts/adapt.mjs`: erhält die gemeinsamen Quellen aus `src/` über den zentralen Assembler. AST-gestützt werden Speicherzugriffe, der Einzelfenster-Lock und asynchrone Export-Aufrufer an native Fähigkeiten angebunden. `src/overrides.js` ersetzt ausschließlich benannte Plattformfunktionen. Fehlende Hooks, unerwartete Skriptstruktur oder Syntaxfehler brechen den Build ab. Das erzeugte `www/native-app.js` bleibt lesbar.
- `src/bridge.mjs`: lädt den nativen Speicher vor der App, bindet Preferences, Filesystem/Share, App-Lebenszyklus und Keyboard an. Systemleisten und Tastatur folgen dem App-Farbmodus; das aktive Feld wird nach dem Öffnen der Tastatur sichtbar gescrollt.
- Web und iPhone teilen die Quellbasis. Web Locks, Datenformat und Netlify-Publish-Liste bleiben kompatibel. Neue Plattformlogik darf nicht in die Progressionsberechnung wandern.

## Speichervertrag für den Pilot

`Preferences` speichert einen gemeinsamen Snapshot unter `Satzkraft.snapshot-v1` in iOS UserDefaults. Der Snapshot enthält `version: 1` und eine Map aus den bisherigen Speicherschlüsseln und Stringwerten. Das fachliche Trainingsformat bleibt Schema 5; Schema 4 bleibt importierbar. Safari-Speicher wird nie automatisch übernommen oder gelöscht.

Die bestehende App arbeitet synchron auf einer Speicherabbildung. Änderungen werden seriell und zusammengefasst an Preferences weitergereicht. „Gespeichert“ erscheint erst nach der nativen Bestätigung. Ein Fehler sperrt die Oberfläche mit Wiederholen/Notfallbackup, statt still weiterzumachen. Beim Hintergrundwechsel werden ausstehende App-Eingaben angestoßen. Ein erzwungener Abbruch vor dem Speichern kann die jüngsten Eingaben verlieren; dies ist kein zugesicherter Hintergrunddienst. UserDefaults bestätigt die Übernahme durch iOS, keine Garantie gegen Stromausfall. Der reale Prozessabbruch muss am Gerät geprüft werden.

Wiederherstellen und Löschen ersetzen den gesamten nativen Snapshot. Die Oberfläche wartet auf den Vorgang; der sichtbare Zustand wird erst nach erfolgreicher Bestätigung ersetzt. Eine beschädigte/unerreichbare native Speicherhülle stoppt den Start, ohne leere Daten darüberzuschreiben. Keine automatische Reparatur und kein Recovery-Import aus Safari.

Preferences ist für den kleinen privaten Pilotbestand vorgesehen. Große Trainingsarchive benötigen vor breiter Nutzung Größen-/Latenztests und gegebenenfalls einen eigenen Dateispeicher/SQLite-Vertrag. Es gibt keine neue Cloud-Synchronisation, App Group oder Analyse.

Der native Lock gilt nur für das erzeugte Target mit genau einer WKWebView und `UIApplicationSupportsMultipleScenes=false`. Bei späteren weiteren Fenstern/WebViews muss ein nativer gemeinsamer Schreibschutz eingeführt werden; die Single-View-Annahme darf nicht erweitert werden.

## Dateifreigabe und Wiederherstellung

JSON-Exporte werden temporär im App-Cache erstellt und an das iOS-Teilen-Menü gegeben. Share-Abbruch oder Fehler liefern `false`; Backup-Metadaten werden erst nach bestätigter Übergabe aktualisiert. Danach werden temporäre Dateien entfernt. Bei Prozessabbruch verbleibende temporäre Dateien liegen nur im App-Cache.

Vor Restore verlangt die Oberfläche zusätzlich die Bestätigung, dass die Sicherheitskopie geprüft wurde. Der Nutzer soll „In Dateien sichern“ wählen. Eine erfolgreiche Übergabe an eine andere Share-Erweiterung beweist keine dauerhafte Sicherung außerhalb dieser Erweiterung. Löschen bleibt bewusst bestätigt; externe Backups werden nicht entfernt.

## Prüfen und aktualisieren

Im Repository-Hauptordner:

```sh
npm run ios:prepare
npm run test:ios
npm run test:ios-ui
npm run ios:doctor
npm run ios:open
```

Die beiden Testbefehle sind gezielt für diesen Adapter, keine vollständige App-Suite. `test:ios-ui` benötigt den zuvor gebauten Stand. Er verwendet isolierte Werte und simulierte Capacitor-Pluginantworten; er kompiliert kein Swift, bedient keine echte iOS-Tastatur und bestätigt keine native Persistenz. Der Screenshot liegt lokal unter `qa/playwright/test-results/` und wird nicht veröffentlicht.

Vorliegende Prüfung: neun Node-Fälle, ein WebKit-Fall, Plist-/Projekt-Syntax und `cap sync ios` erfolgreich. Xcode 26.6 Universal (Build 17F113) ist seit dem 29.10.2026 auf dem Arbeits-Mac eingerichtet. `xcodebuild -checkFirstLaunchStatus` und `npm run ios:doctor` bestehen. Nach Installation der iOS-26.5-Plattform bestehen sowohl der unsignierte generische Gerätebuild als auch der signierte Debug-Build für das echte iPhone 17 Pro mit iOS 27.0.1. Satzkraft 0.39.0 / Build 1 enthält Swift-Plugins, Assets und lokale Web-Dateien. Die einzige Build-Warnung betrifft übersprungene AppIntents-Metadaten; Satzkraft bindet dieses Framework nicht ein.

`codesign --verify --deep --strict`, Bundle-ID und Gerätezuordnung im eingebetteten Entwicklungsprofil sind geprüft. `devicectl device install app` bestätigt die Installation; nach Vertrauensfreigabe des Profils bestätigt `devicectl device process launch` einen erfolgreichen Start. Die normale Oberfläche ist vom Nutzer auf dem iPhone bestätigt. Das kostenlose Profil läuft am 05.11.2026 um 23:25 Uhr (Europe/Berlin) ab. Tatsächlicher Datenerhalt, Dateifreigabe, Tastatur und Offline-Kaltstart bleiben praktisch zu prüfen. Details in `docs/IOS-START.md`.

Die vom Nutzer gewählte Team-Zuordnung bleibt als lokale Änderung in `project.pbxproj` erhalten. Diese Datei mit persönlicher Team-ID nicht zusammen mit allgemeinen Projektänderungen committen. Zertifikate, Provisionierungsprofile, Gerätekennungen und vollständige Signierprotokolle bleiben außerhalb des versionierten Projekts.

Unsignierte Kompilierungsprüfung im Repository-Hauptordner (installierte iOS-Plattform erforderlich):

```sh
xcodebuild -project native/ios/App/App.xcodeproj -scheme App -configuration Debug \
  -sdk iphoneos -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO build
```

Das Nachladen meldete beim Abschluss einen doppelten Runtime-Eintrag. `simctl` bestätigt eine verifizierte iOS-26.5-Runtime mit Status `Ready` und `isAvailable: true`; der anschließende Build bestand. Keine Runtime-Dateien manuell gelöscht.

Bei späterer Veröffentlichung native Versionsnummer und Buildnummer bewusst erhöhen. Bundle-ID nach erster Geräteinstallation stabil halten. `www/`, `ios/App/App/public`, persönliche Xcode-Dateien und Zertifikate bleiben unversioniert. Der bestehende Netlify-Build veröffentlicht ausschließlich `dist/`.

Das Icon wird aus `assets/app-icon.svg` (bestehendes Satzkraft-Vektormotiv) mit 1024 × 1024 Pixeln auf deckendem Hintergrund exportiert. Keine fremden Capacitor-Demosymbole in der App.

### Gemeinsamer Stand und Aktualität

`scripts/freshness.mjs` erfasst gemeinsame Quellen, Buildwerkzeuge, Native-Adapter, Lockfile und eingebettete Ressourcen. Das erzeugte `build-info.json` enthält den Quellfingerprint sowie Hashes sämtlicher Paketdateien. `ios:doctor` verifiziert diese gegen das aktuelle Projekt. Bloße Dateiexistenz gilt nicht mehr als Synchronisierungsnachweis. Vor dem Gerätebuild `npm run ios:sync` ausführen.

Der SceneDelegate erzeugt das einzige Fenster samt Bridge-Controller. Die parallele Scene-/Main-Storyboard-Zuordnung ist entfernt; der LaunchScreen bleibt bestehen. Der signierte Gerätebuild und der sichtbare Start auf dem iPhone bestehen. Die einzelnen nativen Plugin-Abläufe bleiben Teil der praktischen Abnahme.

### PDF und gemeinsame Build-Abhängigkeiten

Vor dem nativen Build auch im Repository-Stamm `npm ci` ausführen. Der gemeinsame PDF-Export benötigt dort jsPDF 4.2.1; `npm run ios:sync` übernimmt dessen lokale Dateien und Schrift in das native Paket. PDF-Bytes werden binär geschrieben und über den nativen Teilen-Dialog übergeben. Die JS-/WebKit-Abnahme verwendet Plugin-Doubles; eine erfolgreiche echte Dateisicherung auf dem iPhone bleibt Teil der physischen Abnahme.
