# Architektur und Weiterentwicklung

Stand: 25.10.2026. Diese Regeln gelten für Web/PWA und den iOS-Container. Die neue Quellstruktur ersetzt die bisherige Pflicht, direkt in einer HTML-Datei zu entwickeln.

## Quellen und erzeugte Dateien

| Bereich | Verantwortung |
| --- | --- |
| `src/shell.html` | Dokumentstruktur und Oberflächencontainer |
| `src/styles/tokens.css` | Zentrale Gestaltungswerte für beide Plattformen |
| `src/styles/components.css` | Bestehende Komponenten und responsive Darstellung |
| `src/styles/recovery.css` | Geschützte Datenrettung |
| `src/core/` | Plattformfreie Datenregeln; direkt in Node prüfbar |
| `js/progression.js` | Bestehender, unveränderter Fachkern für Progression |
| `src/app/` | Nach Aufgaben getrennte bestehende Anwendungslogik |
| `src/platform/theme.js` | Frühe Anwendung der gespeicherten Darstellung |
| `src/sources.json` | Explizite Reihenfolge der gemeinsamen Quellen |
| `scripts/lib/sources.mjs` | Gemeinsamer, abhängigkeitenfreier Quellassembler |
| `native/src/` | Native Speicherung, Dateifreigabe und Lebenszyklus |
| `index.html`, `dist/`, `native/www/`, `native/ios/App/App/public/` | Erzeugte Ergebnisse; niemals direkt bearbeiten |

`npm run build:source` erzeugt die versionierte `index.html`. Diese bleibt ein direkt statisch nutzbares, kompatibles Web-Artefakt; sie ist nicht mehr die Entwicklungsquelle. Der Netlify-Build regeneriert sie vor dem Kopieren. Der native Build liest dieselben Quellen direkt. `npm run check:source` erkennt abweichende Artefakte.

## Tatsächlicher Entkopplungsstand

Die Quellbereiche unter `src/app/` sind nach Verantwortung getrennte Quellbereiche, noch keine voneinander unabhängigen ES-Module. Die bestehende Anwendung teilt weiterhin ihren Zustand und Funktionsraum. Der Assembler bewahrt bewusst Reihenfolge und bestehende Funktionsverträge. Das ist eine überprüfbare Migration der Quellen, keine Behauptung, alle historischen Abhängigkeiten seien bereits beseitigt.

Neue Fachlogik gehört in `src/core/` mit expliziten Eingaben und Rückgaben, ohne DOM, Browser-Speicher, Netzwerk, Uhr oder Capacitor. Bestehende gemeinsam genutzte Zustände nicht erweitern, wenn ein expliziter Parameter genügt. Eine spätere Herauslösung einer bestehenden Funktion erfolgt zusammen mit ihren Verhaltenstests; kein gleichzeitiger Komplettumbau der Progression oder gespeicherter Formate.

## Verbindliche Entwicklungsregeln

1. **Eine fachliche Quelle:** Berechnungen, Datenvalidierung und Design werden nicht separat für iOS kopiert. Native Fähigkeiten sitzen im Adapter.
2. **Klare Verantwortung:** Darstellung erzeugt UI; Datenregeln validieren; Speicheradapter lesen/schreiben. DOM-Zugriffe und Pluginimporte bleiben außerhalb von `core`.
3. **Abhängigkeiten explizit halten:** Neue reine Funktionen erhalten ihren Kontext als Parameter. Neue globale Zustände und zyklische Beziehungen benötigen eine begründete Architekturentscheidung.
4. **Lesbarer Code:** Neue/geänderte Funktionen mit aussagekräftigen Namen, kurzen Abschnitten und dokumentierten Verträgen schreiben. Kompakten Altcode bei fachlich berührten Stellen schrittweise entflechten; keine flächige Neuformatierung zusammen mit Datenmigrationen.
5. **Fehler sind Zustände:** Laden, gesperrt, ungespeichert, gesichert und Wiederherstellung unterscheiden. Fehler dürfen keine Erfolgsmeldung auslösen. Ein Ladefehler berechtigt niemals zum Speichern eines leeren Ersatzbestands.
6. **Kompatibilität:** `cali-plan-v3`, Schema 5 samt Schema-4-Import und Programmformat v2 bleiben stabil. Formatänderungen brauchen eine Versionsentscheidung, Altbestandsfälle und einen Rückweg über Backup.
7. **Transaktionen:** Programm und Fortschritt gehören zusammen. Beim Löschen eines Vorblocks seine Verweise im gleichen Vorgang bereinigen. Nach jeder solchen Operation muss der eigene Export wieder importierbar sein.
8. **Asynchronität:** Native Datei- und Speichervorgänge abwarten; Abbruch und Ablehnung behandeln. Eine Übergabe an das Teilen-Menü ist keine zugesicherte externe Dateisicherung.
9. **Keine Geheimnisse:** Keine persönlichen Trainingsdaten, Team-IDs, Zertifikate, Tokens oder API-Schlüssel in Quellcode, Fixtures oder Build-Artefakten.
10. **Gezielte Belege:** Fehler durch einen konkreten Ablauf belegen und genau diesen Ablauf absichern. Neue Tests prüfen Verhalten statt bloß Funktionsnamen oder Quelltextformat.

## Speicher- und Backupvertrag

Normale vollständige Backups, eingelesene Backupdateien und neue persistierte Zustände verwenden denselben Grenzwert von 20 MB UTF-8. Die gespeicherte Momentaufnahme wird inklusive Formatierung des Exports geprüft. Es gibt keine abweichende Grenze von 50 Programmen; Archive zählen wie andere Programme. Einzelne Programmdateien behalten ihr bisheriges 5-MB-Limit.

Ein zu großer oder nicht speicherbarer Zustand bleibt im Arbeitsspeicher und erhält eine sichtbare Fehlermeldung. Rohdaten-/Notfallexporte bleiben möglich. Bei beschädigtem Hauptspeicher sperrt die Oberfläche alle normalen Schreibaktionen. Ein Neustart mit Standarddaten benötigt einen angestoßenen Rohdatenexport und eine ausdrückliche Bestätigung der geprüften Originaldatei. Das Original wird nicht automatisch repariert oder gelöscht.

## Native Grenze und nächste Ausbauschritte

Capacitor bleibt die vorhandene gemeinsame UI-Basis. Der AST-Adapter unter `native/scripts/adapt.mjs` ist eine ausdrücklich begrenzte Kompatibilitätsschicht für den synchronen Altbestand. Seine benannten Ersetzungen, asynchronen Aufrufe und Recovery-Hooks müssen geprüft werden; Änderungen daran erfordern den nativen Vertragstest. Neue Funktionen sollen keine weiteren impliziten Ersetzungen benötigen.

Native Builds erhalten Quellfingerprint und Dateihashes. `ios:doctor` unterscheidet fehlende/veraltete Pakete von wirklich aktuellen Dateien; `ios:sync` baut neu und kopiert in das Xcode-Projekt. Die einzelne WKWebView wird vom SceneDelegate erzeugt, nicht zusätzlich aus einem Scene-Storyboard.

Preferences bleibt der bestehende Pilot-Speicher. Für große Archive wäre ein versionierter SQLite-/Dateispeicheradapter mit Migration, Abbruchtests und Wiederherstellbarkeit eine eigene Änderung. Vor breiter iOS-Nutzung fehlen weiterhin belegter Swift-Build, Signierung und reale Geräteabnahme. Ein WebKit-Test mit Plugin-Doubles ersetzt diese Nachweise nicht.

## Arbeitsablauf

```sh
npm run build:source
npm run check:architecture
# Genau die betroffenen Verhaltensprüfungen gemäß docs/TESTING.md
npm run build
npm run ios:sync
npm run ios:doctor
```

`check:architecture` prüft Quellmanifest, Syntax, doppelte Funktionsdefinitionen, Größenbudget der Quellbereiche, reine Core-Grenze, zentrale Tokens und Aktualität der Web-Datei. Vollständige Testsuiten bleiben ausdrücklich beauftragten Läufen vorbehalten.

## Lokaler PDF-Export

Die Auswertung liefert bereits formatierte Werte an `src/app/pdf-export.js`; dort wird ausschließlich die geöffnete Auswertung beziehungsweise das Protokoll gelesen. Die Berechnung von Kennzahlen bleibt in `reports.js`. `src/core/pdf-document.js` übernimmt reine A4-Textanordnung und Seitenumbrüche mit explizit übergebenem PDF-Konstruktor, Schrift und Inhalten. jsPDF 4.2.1 übernimmt PDF-Kodierung und Schrifteinbettung; kein selbst entwickelter PDF-Writer.

`package-lock.json` fixiert die Abhängigkeit. `scripts/prepare-pdf-assets.mjs` erzeugt/prüft die lokalen Vendor-Dateien für Web und iOS. Schrift, Bibliothek und Lizenzen stehen auf der öffentlichen Positivliste und im Offline-Cache. Die TrueType-Datei wurde aus der vorhandenen WOFF2-Schrift mit fontTools 4.60.2, Achse `wght=400`, erzeugt; die SIL-OFL liegt unter `fonts/OFL-Hanken-Grotesk.txt`. Beim Schriftwechsel beide Formate gemeinsam erneuern.

Die optionale Fähigkeit `window.SatzkraftFiles.savePdf(name, arrayBuffer)` ist der explizite Übergang zum nativen Dateiadapter. Ohne sie nutzt die Web-App Web Share für PDF-Dateien oder einen Blob-Download. Der native Adapter kodiert binäre PDF-Bytes als Base64 ohne UTF-8-Option für Filesystem und räumt temporäre Dateien nach der Freigabe auf. Der Teilen-Dialog wird erst durch den bewussten Klick auf „PDF sichern“ geöffnet. Abbruch oder Fehler sind kein Nachweis einer extern gespeicherten Datei.
