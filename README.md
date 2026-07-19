# Satzkraft

Satzkraft ist eine deutschsprachige Krafttrainings-PWA ohne Konto. Programme und Trainingsdaten bleiben lokal im Browser; die App wird ohne Build-Schritt direkt aus `index.html` geladen.

## Projektstruktur

| Pfad | Zweck |
|---|---|
| `index.html` | Oberfläche, Styles und App-Logik |
| `js/progression.js` | getrennte Progressionslogik |
| `programme/` | offizielle Startprogramme |
| `netlify/functions/` | serverseitiger KI-Coach |
| `tests/` | Node-Tests |
| `qa/playwright/` | gezielte Browser- und Screenshot-Tests |
| `docs/` | Planung, Referenzen, Teststrategie und Testberichte |
| `BRIEFING-CODEX.md` | aktuelle Produkt- und Architekturregeln |
| `CHANGELOG.md` | Versionshistorie |

## Lokal starten

Die App kann über einen statischen Server geöffnet werden. Für die vorhandenen Browserprüfungen ist der lokale Server bereits in der Playwright-Konfiguration hinterlegt.

```bash
npm install
```

Normale Änderungen werden nur gezielt geprüft. Die verbindliche Auswahl und die bewusst nicht automatisch laufenden Kompletttests stehen in [`docs/TESTING.md`](docs/TESTING.md).

## Dokumentation

- [`docs/planung/`](docs/planung/) enthält langfristige und bereits beschlossene Planungsunterlagen.
- [`docs/referenz/`](docs/referenz/) enthält fachliche Quelldaten.
- [`docs/tests/`](docs/tests/) enthält den Playwright-Testplan und aktuelle beziehungsweise historische Berichte.
