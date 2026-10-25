# Teststrategie

Ziel ist schnelles Feedback ohne wiederholte Komplettabnahmen. Geprüft wird risikobasiert und nur so breit wie die aktuelle Änderung.

## Standard bei normalen Änderungen

1. Betroffene Dateien und vorhandenen Diff ansehen.
2. `git diff --check` ausführen.
3. Wenn sich Verhalten geändert hat, genau die direkt passende Testdatei ausführen, zum Beispiel:

   ```bash
   node --test tests/program-editor.test.cjs
   ```

4. Bei UI-Änderungen höchstens den betroffenen Playwright-Fall und ein Browserprojekt ausführen, sofern eine Browserprüfung wirklich nötig ist. Ein gezielter Lauf wird über `--grep` und `--project` eingeschränkt.
5. Nach einem erfolgreichen Lauf nicht unverändert erneut testen.

Reine Dokumentations-, Dateiordnungs- und Arbeitsregeländerungen benötigen keine App-Suite.

## Große Tests – nur auf ausdrücklichen Nutzerbefehl

Folgende Befehle sind absichtlich mit `all` benannt und werden nicht automatisch ausgeführt:

```bash
npm run test:all:unit
npm run test:all:e2e
npm run test:all:e2e:functional
npm run test:all:e2e:visual
npm run test:all
```

Auch `npm run test:update:visual` läuft nur auf ausdrücklichen Befehl, da es versionierte Screenshot-Baselines verändert.

## Auswahlhilfe

| Änderung | Standardprüfung |
|---|---|
| Dokumentation, Ordner, Arbeitsregeln | `git diff --check`, Pfad-/Linkprüfung |
| Einzelne pure Funktion | direkt betroffene Node-Testdatei |
| Datenformat oder Import | betroffene Validierungs-/Backup-Testdatei |
| Kleine UI-Logik | betroffene Node-Testdatei; optional ein gezielter Browserfall |
| Rein visuelle Änderung | ein Motiv, ein Browserprojekt; große Matrix nur auf Befehl |
| Releasevorbereitung | Versionsprüfung; Komplettabnahme nur auf Befehl |

Ein fehlender großer Test wird im Abschlussbericht transparent genannt, ist aber kein Grund, ihn ungefragt zu starten.

## Gezielter iPhone-Ablauf

Für das separate Capacitor-Projekt: `npm run test:ios` prüft neun native Adapter- und Paketfälle; `npm run test:ios-ui` bedient ausschließlich das zuvor erzeugte iPhone-Paket in einem WebKit-Profil mit nachgebildeten Pluginantworten. Kein Swift-Build und keine echte iOS-Abnahme. [Einrichtung und Geräteschritte](IOS-START.md), [technische Grenzen](../native/README.md).

`npm run test:iphone` führt ausschließlich den normalen App-Ablauf REG-31 im WebKit-Profil iPhone 17 Pro aus. Eigene isolierte Daten und ein kurzlebiger lokaler Server; keine Testoberfläche im Produkt und keine Erweiterung der regulären Browsermatrix. Touch, Ränder, knappe Höhe, Offline-Eingaben, Cache-Neustart bei Serverausfall und Backup. [Details und Grenzen](tests/IPHONE-OFFLINE-TESTSYSTEM.md). Dieser gezielte Lauf ist für Änderungen an der mobilen Eingabe beziehungsweise für einen ausdrücklich beauftragten iPhone-Check vorgesehen.

## Gemeinsame Quellen ab v0.39.0

Vor gezielten Verhaltenstests `npm run build:source` und `npm run check:architecture` ausführen. Die bisherigen Extraktionstests bleiben als Kompatibilitätsnetz erhalten. Neue Core-Verträge direkt aus `src/core/` prüfen; Ablaufregressionen testen die Übergänge zwischen Laden, Schreiben, Löschen und Wiederherstellen.

`qa/playwright/integrity.spec.js` prüft auf einem isolierten lokalen Ursprung den geschützten Ladefehler, Rohdatenexport, bewussten Neustart und den zweistufigen Restore. `native/tests/freshness.test.mjs` prüft veraltete sowie nachträglich veränderte native Pakete. Diese Fälle erweitern keine automatisch laufende vollständige Matrix.

## PDF und umfassender Funktionslauf vom 25.10.2026

Die reguläre funktionale Browsermatrix umfasst `update.spec.js`, `windows.spec.js` und `pdf.spec.js`. Die PDF-Fälle speichern echte PDF-Dateien in Desktop/Mobil-Chromium und -WebKit, prüfen die Ausgabe ohne Druckdialog sowie fehlende Ressourcen, Wiederholung und abgebrochene Freigabe. Gezielt: `npx playwright test --config qa/playwright/pdf.config.cjs --workers=2`. Der iPhone-Offlinefall lädt PDF-Bibliothek und Schrift nach abgeschaltetem Ursprung aus dem Service-Worker-Cache. Der native Adapterfall prüft binäre PDF-Dateien ohne UTF-8-Verfälschung.

REG-27 öffnet vier Fenster und prüft Konflikte, Entwürfe, BFCache und Backups. Dafür gilt ein 90-Sekunden-Budget. Nur dieser Fall verzichtet auf Videoaufzeichnung: die untersuchte macOS-WebKit-Testumgebung hing damit beim Erzeugen weiterer Hintergrundseiten. Assertions, Fehler-Screenshots und Traces bleiben vollständig aktiv.

Beobachtungsscreenshots werden unter den Testausgaben gespeichert, nicht in gemeinsam überschriebenen, versionierten Referenzdateien. Screenshot-Baselines werden durch funktionale Tests niemals neu geschrieben. [Vollständiger Prüfbericht](tests/FUNKTIONSPRUEFUNG-2026-10-25.md).
