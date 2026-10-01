# Satzkraft

Satzkraft ist eine deutschsprachige Krafttrainings-PWA ohne Konto. Programme und Trainingsdaten bleiben lokal im Browser; nur bewusst gestartete KI-Coach-Anfragen werden über eine Netlify-Funktion an Anthropic übermittelt. Lokal läuft die App ohne Kompilierung direkt aus `index.html`; für die Veröffentlichung wird eine feste Positivliste nach `dist/` kopiert.

## Projektstruktur

| Pfad | Zweck |
|---|---|
| `index.html` | Oberfläche, Styles und App-Logik |
| `js/progression.js` | getrennte Progressionslogik |
| `programme/` | offizielle Startprogramme |
| `netlify/functions/` | serverseitiger KI-Coach |
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

Danach ist die statische App unter <http://127.0.0.1:4173> erreichbar. Dieser Startweg deckt die lokale PWA ab, aber nicht die Netlify-Funktion des KI-Coachs. Für den vollständigen Coach-Pfad ist eine Netlify-Laufzeit mit dem ausschließlich serverseitig gesetzten `ANTHROPIC_API_KEY` erforderlich.

Normale Änderungen werden nur gezielt geprüft. Die verbindliche Auswahl und die bewusst nicht automatisch laufenden Kompletttests stehen in [`docs/TESTING.md`](docs/TESTING.md).

## Netlify veröffentlichen

```bash
npm run build
```

Netlify führt diesen Schritt über `netlify.toml` selbst aus und veröffentlicht ausschließlich `dist/`. Die Serverfunktion bleibt separat unter `netlify/functions/`. Bei einem manuellen Upload ebenfalls nur den erzeugten Ordner `dist/` verwenden – niemals den gesamten Repository-Ordner.

## Daten und KI-Coach

- Programme, Trainingswerte, Notizen, Protokolle und Coach-Antworten liegen im `localStorage` des verwendeten Browsers. Es gibt keine automatische Cloud-Synchronisierung.
- Erst das bewusste Erstellen eines Coach-Programms übermittelt die angezeigten Antworten über Netlify an Anthropic. Andere lokale Programme und Trainingsprotokolle werden nicht angefügt.
- „ChatGPT & Co.“ sowie Programm-Kopien und -Links werden nur lokal erzeugt; eine Weitergabe an einen externen Dienst erfolgt erst durch den Nutzer und unter dessen Datenschutzregeln.
- Strukturierte Beschwerdeangaben werden nur nach einer eigenen Bestätigung für die aktuelle Coach-Sitzung gesendet und lassen sich vorher aus dem Auftrag entfernen.
- Die App-Einstellungen erklären den Datenfluss und bieten getrennte Wege zum Löschen gespeicherter Coach-Antworten oder aller lokalen Satzkraft-Daten. Das vollständige Trainings-Backup enthält nicht den separaten Coach-Antwortschlüssel.
- Der aktuelle Link wird nur im privaten Bekanntenkreis geteilt. Ein Impressum ist nach aktueller Produktentscheidung kein Arbeitspunkt; vor einer breiteren öffentlichen oder kommerziellen Veröffentlichung muss die rechtliche Einordnung erneut geprüft werden.

## Dokumentation

- [`docs/planung/`](docs/planung/) enthält historische Ausbaupläne und längerfristige Entwürfe. Für den aktuellen Produktstand gilt vorrangig [`BRIEFING-CODEX.md`](BRIEFING-CODEX.md).
- [`docs/historie/BRIEFING-CODEX-BIS-v0.32.0.md`](docs/historie/BRIEFING-CODEX-BIS-v0.32.0.md) bewahrt das frühere vollständige Briefing als nicht normative Historie.
- [`docs/referenz/`](docs/referenz/) enthält fachliche Quelldaten.
- [`docs/tests/`](docs/tests/) enthält die Teststrategie sowie klar datierte aktuelle beziehungsweise historische Testunterlagen.
