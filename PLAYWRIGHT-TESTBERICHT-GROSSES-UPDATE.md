# Playwright-Testbericht · Großes Update

**Stand:** 18.07.2026

**Ergebnis auf macOS/Darwin:** **bestanden**

**Branch:** `agent/grosses-update-releases-1-4`

## Kurzfazit

Der korrigierte Gesamtlauf ist lokal vollständig grün:

| Suite | Bestanden | Fehlgeschlagen |
|---|---:|---:|
| Bestehende Unit- und Integrationstests | 163 | 0 |
| Playwright · funktionale Fälle | 84 | 0 |
| Playwright · visuelle Vergleiche | 20 | 0 |
| **Playwright gesamt** | **104** | **0** |
| **Alle automatisierten Ausführungen** | **267** | **0** |

Playwright hat zunächst einen echten Mobile-Fehler gefunden: Die untere Protokollleiste war breiter als der Bildschirm und schnitt die Aktionen ab. Nach der responsiven Korrektur passen Leiste und Buttons in Chromium und WebKit vollständig in den Viewport.

## Testumgebung

- Node.js `22.23.1`
- npm `10.9.8`
- `@playwright/test` `1.61.0`
- Chromium und Playwright WebKit
- Locale `de-DE`
- Zeitzone `Europe/Berlin`
- reduzierte Animationen und feste Viewports
- lokale, deterministische Testdaten ohne externes Benutzerkonto

WebKit ist die von Playwright automatisierte Safari-nahe Engine. Es ist nicht identisch mit der veröffentlichten Safari-App oder echtem iOS.

## Browser- und Gerätematrix

| Projekt | Viewport | Ergebnis |
|---|---:|---:|
| Desktop Chromium | 1440 × 900 | 26/26 |
| Desktop WebKit | 1440 × 900 | 26/26 |
| Mobile Chromium | 375 × 812 | 26/26 |
| Mobile WebKit · iPhone-Emulation | 390 × 844 | 26/26 |
| **Gesamt** |  | **104/104** |

## Ergebnisse nach Testbereich

| Bereich | Logische Tests | Browserausführungen | Ergebnis |
|---|---:|---:|---:|
| Texte & Kommunikation | 10 | 40 | 40/40 |
| UI/UX-Klarheit & Visual Regression | 7 | 28 | 28/28 |
| Redundanz-Check | 5 | 20 | 20/20 |
| Kernfunktion, Regression & Offline-PWA | 4 | 16 | 16/16 |
| **Gesamt** | **26** | **104** | **104/104** |

### 1. Texte & Kommunikation

Bestanden sind unter anderem:

- Erststart-Hinweis mit exaktem Titel, allen freigegebenen Absätzen und einmaliger Anzeige;
- Protokoll-, Korrektur- und Wiederholen-Texte samt exakter Konsequenzbeschreibung;
- Programmbibliothek mit Namen, Metadaten und verständlicher Offline-Fehlermeldung;
- Autocomplete-Rückfrage vor dem Überschreiben vorhandener Angaben;
- Tauschmodal mit klaren Absichten und begrenzten Vorschlägen;
- Mehrtag-Hinweis mit korrektem Herkunftstag;
- Ausschluss getauschter Fremdwerte aus der Originalprogression.

### 2. UI/UX-Klarheit und Visual Regression

Bestanden sind:

- Erststart-Modal auf Desktop und Mobile;
- gesperrte Protokolleinheit mit lesbarer Aktionsleiste;
- Erstellen-Hub im Hellmodus;
- Mehrtag-Trainingskarte ohne unschöne Textverschiebung;
- kein horizontaler Overflow in Dokument, App, Bottom-Bar und Programmverwaltung;
- korrekte Overlay-Hierarchie zwischen Bibliothek und Modal;
- stabiler Screenshot des aktuell vierteiligen Tauschdialogs.

Es existieren 20 geprüfte Darwin-Baselines: fünf Motive für jeweils vier Projekte. Der abschließende Vergleichslauf verwendete `--update-snapshots=none` und durfte die Referenzen nicht verändern.

### 3. Redundanz-Check

Bestanden sind:

- keine doppelten DOM-IDs;
- genau zwei Kopfzeilenaktionen: `Programme` und `Auswertung`;
- genau eine Workout-Zeit- und Steuerleiste;
- fünf eindeutige Wege im Erstellen-Hub, Programmbibliothek an erster Stelle;
- deduplizierte und begrenzte Bibliotheks- und Tauschvorschläge.

### 4. Regression, Kernfunktion und Offline-PWA

Bestanden sind:

- Training starten, Satzwerte speichern und Training kontrolliert beenden;
- vollständige Kompatibilität des v0.22-Backups und trainierbare Woche 8;
- keine unerwarteten Browser-Konsolenfehler in den abgesicherten Zuständen;
- PWA-Shell, 200 Übungen und offizielles Programm nach Online-Priming offline verfügbar.

Bei Chromium enthält der Test einen echten Offline-Reload. Playwright WebKit bricht diese Navigation intern ab; dort werden deshalb der Cache Storage und die weiterhin verfügbare Offline-Oberfläche direkt geprüft.

## Gefundene und behobene Fehler

### F-01 · Mobile Bottom-Bar war zu breit

**Vorher**

- Mobile Chromium: `428 px` Inhalt bei `375 px` Viewport
- Mobile WebKit: `441 px` Inhalt bei `390 px` Viewport
- `Werte korrigieren` und der zweite Protokollbutton wurden seitlich abgeschnitten.

**Korrektur**

- Mobile Aktionsleiste bis 430 px als zweispaltiges Raster;
- lange Buttontexte dürfen sauber umbrechen;
- einzelne Aktionen bleiben über die volle Breite;
- zusätzlicher unterer Scrollraum für den höchsten Leisten-Zustand.

**Nachher**

- Mobile Chromium: `375/375 px`
- Mobile WebKit: `390/390 px`
- gezielter Re-Test: 4/4 bestanden
- vollständige funktionale Matrix: 84/84 bestanden

### F-02 · Falsche Vorbedingung im visuellen Tauschtest

Der Test klickte zunächst auf „Übung nur heute tauschen“, ohne einen Ersatznamen einzutragen. Dadurch entstand der erwartete Zustand mit vorhandenem Tausch nicht. Der Test trägt nun bewusst `Beinpresse` ein, prüft die sichtbare Übernahme und öffnet erst danach den Zustand mit allen vier Aktionen.

### F-03 · Zu große Screenshot-Ausschnitte

Feste Modale und Bottom-Bars wurden anfangs zusammen mit der gesamten langen Seite aufgenommen. Die Vergleiche prüfen jetzt den sichtbaren Viewport beziehungsweise das relevante UI-Element. Dadurch reagieren die Baselines auf echte Layout- und Textänderungen statt auf irrelevanten Inhalt unterhalb eines Overlays.

### F-04 · Betriebssysteme teilten denselben Baseline-Pfad

Der Snapshot-Pfad enthält jetzt `{platform}`. Darwin- und Linux-Baselines können sich deshalb nicht mehr gegenseitig überschreiben. Reguläre Testbefehle verwenden ausdrücklich `--update-snapshots=none`; nur `npm run test:e2e:visual:update` darf Referenzen bewusst aktualisieren.

## Verbleibende Risiken und Grenzen

### R-01 · Vier Entscheidungen im laufenden Tauschdialog

Ein bereits getauschter Eintrag zeigt während eines laufenden Trainings weiterhin:

1. `Übung nur heute tauschen`
2. `Ab jetzt ersetzen`
3. `Original verwenden`
4. `Abbrechen`

Der Zustand ist funktional korrekt und visuell abgesichert, bleibt aber eine dokumentierte P1-Entscheidung zur UI-Klarheit. Vor Release sollte entweder eine dreistufige Alternative beschlossen oder der Viererzustand ausdrücklich akzeptiert werden.

### R-02 · Linux-Baselines fehlen noch

Die 20 lokalen Darwin-Baselines sind vorhanden und bestanden. Für das geplante Linux-CI müssen zusätzlich 20 Baselines im gepinnten Container `mcr.microsoft.com/playwright:v1.61.0-noble` erzeugt, visuell geprüft und committed werden. Reguläre CI-Läufe dürfen sie niemals automatisch aktualisieren.

### R-03 · Echtes Safari und echtes iOS

Desktop und Mobile WebKit sind bestanden. Vor einem öffentlichen Release bleibt ein kurzer manueller Smoke-Test in der veröffentlichten Safari-App beziehungsweise auf einem echten iPhone sinnvoll.

## Reproduzierbare Befehle

```bash
npm ci
npx playwright install chromium webkit
npm run test:unit
npm run test:e2e:functional
npm run test:e2e:visual
npm run test:e2e
npm run test:ci
```

Referenzbilder dürfen nur bewusst aktualisiert werden:

```bash
npm run test:e2e:visual:update
```

## Freigabebewertung

Der lokale Darwin-Teststand ist technisch grün. Für ein vollständiges automatisches Linux-CI-Gate fehlen ausschließlich die geprüften Linux-Baselines. Die vier gleichzeitigen Tauschentscheidungen bleiben eine bewusste UX-Freigabeentscheidung, kein unbemerkter Testfehler.
