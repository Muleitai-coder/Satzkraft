# Satzkraft

Satzkraft ist eine deutschsprachige Krafttrainings-PWA ohne Konto. Programme und Trainingsdaten bleiben lokal im Browser. Der frühere API-Coach ist entfernt; „ChatGPT & Co.“ erzeugt weiterhin lokal einen Text für eine vom Nutzer gewählte externe KI. Lokal läuft die App ohne Kompilierung über einen statischen Server aus `index.html`; für die Veröffentlichung wird eine feste Positivliste nach `dist/` kopiert.

## Projektstruktur

| Pfad | Zweck |
|---|---|
| `index.html` | Oberfläche, Styles und App-Logik |
| `js/progression.js` | getrennte Progressionslogik |
| `programme/` | offizielle Startprogramme |
| `tests/` | Node-Tests |
| `qa/playwright/` | gezielte Browser- und Screenshot-Tests |
| `scripts/prepare-netlify.mjs` | erzeugt das freigegebene Netlify-Paket in `dist/` |
| `docs/` | Planung, Referenzen, Teststrategie und Testberichte |
| `BRIEFING-CODEX.md` | aktuelle Produkt- und Architekturregeln |
| `CHANGELOG.md` | Versionshistorie |

## Lokal starten

Die App kann über einen statischen Server geöffnet werden. Für die vorhandenen Browserprüfungen ist der lokale Server bereits in der Playwright-Konfiguration hinterlegt.

```bash
npm install
node qa/playwright/static-server.cjs
```

Danach ist die vollständige statische App unter <http://127.0.0.1:4173> erreichbar. Es sind keine KI-API-Schlüssel oder Serverfunktionen erforderlich.

Normale Änderungen werden nur gezielt geprüft. Die verbindliche Auswahl und die bewusst nicht automatisch laufenden Kompletttests stehen in [`docs/TESTING.md`](docs/TESTING.md).

## Netlify veröffentlichen

```bash
npm run build
```

Netlify führt diesen Schritt über `netlify.toml` selbst aus und veröffentlicht ausschließlich `dist/`. Bei einem manuellen Upload ebenfalls nur den erzeugten Ordner `dist/` verwenden – niemals den gesamten Repository-Ordner.

## Daten und externe KI

- Programme, Trainingswerte, Notizen, Protokolle und Einstellungen liegen im `localStorage` des verwendeten Browsers. Es gibt keine automatische Cloud-Synchronisierung.
- Ein aktualisiertes Fenster darf Trainingsdaten bearbeiten; weitere Fenster warten und laden vor der Übernahme den aktuellen Stand. Fremde Änderungen stoppen das Speichern und lassen sich vor dem Neuladen sichern.
- Zehn geprüfte Bibliotheksübungen besitzen optionale Zuordnungen, die Editor, Import, Export und Backup erhalten. Persönliche Übungen sind über Programme → Übungen & persönliche Bibliothek erreichbar und können im Programmeditor ausgewählt werden. Alte Pläne und freie Übungen bleiben nutzbar; bestehende Trainingswerte werden nicht automatisch umgestellt.
- Die Fensterkoordination benötigt Web Locks im Browser (HTTPS oder localhost). Ohne diese Möglichkeit bleibt die App gegen unsicheres Schreiben geschützt. Vor einem Update alte Satzkraft-Fenster schließen; die Schutzregel kann altes JavaScript nicht zur Zusammenarbeit zwingen.
- Satzkraft enthält keinen eingebauten API-Coach und sendet keine Trainingswünsche oder Trainingsdaten an einen KI-Anbieter.
- „ChatGPT & Co.“ sowie Programm-Kopien und -Links werden nur lokal erzeugt; eine Weitergabe an einen externen Dienst erfolgt erst durch den Nutzer und unter dessen Datenschutzregeln. Der Rückweg bleibt der geprüfte JSON-Import.
- Neue vollständige Backups verwenden Schema 5 und enthalten persönliche Definitionen und historische Erfassung. Schema-4-Backups bleiben importierbar; neue Schema-5-Backups benötigen diesen aktualisierten App-Stand. Programmdateien bleiben v2 und ersetzen kein vollständiges Backup.
- Alte Coach-Programme und kompatible Backups bleiben nutzbar. Die nicht mehr benötigten gespeicherten Coach-Antworten werden beim Start der aktualisierten App entfernt, sofern der Browser den Speicherzugriff erlaubt.
- Die Einstellungen erklären lokale Speicherung und bieten eine abgesicherte Komplettlöschung. Backups enthalten Programme und Trainingsdaten, keinen Farbmodus.
- Der aktuelle Link wird nur im privaten Bekanntenkreis geteilt. Ein Impressum ist nach aktueller Produktentscheidung kein Arbeitspunkt; vor einer breiteren öffentlichen oder kommerziellen Veröffentlichung muss die rechtliche Einordnung erneut geprüft werden.

## Dokumentation

- [`docs/planung/`](docs/planung/) enthält historische Ausbaupläne und längerfristige Entwürfe. Für den aktuellen Produktstand gilt vorrangig [`BRIEFING-CODEX.md`](BRIEFING-CODEX.md).
- [`docs/historie/BRIEFING-CODEX-BIS-v0.32.0.md`](docs/historie/BRIEFING-CODEX-BIS-v0.32.0.md) bewahrt das frühere vollständige Briefing als nicht normative Historie.
- [`docs/referenz/`](docs/referenz/) enthält fachliche Quelldaten.
- [`docs/tests/`](docs/tests/) enthält die Teststrategie sowie klar datierte aktuelle beziehungsweise historische Testunterlagen.
