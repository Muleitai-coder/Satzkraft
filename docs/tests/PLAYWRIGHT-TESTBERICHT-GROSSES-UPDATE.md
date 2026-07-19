# Playwright-Testbericht · Großes Update

**Stand:** 18.07.2026

**Branch:** `agent/grosses-update-releases-1-4`

**Lokales Ergebnis auf macOS/Darwin:** **bestanden**

## Sehr kurze, leicht verständliche Auswertung

Die automatisierten Tests sind vollständig grün. Die überarbeitete App wurde in Chrome- und Safari-naher Technik jeweils auf Desktop und Mobile geprüft. Dabei wurden insbesondere missverständliche Texte, doppelte Aktionen, überladene Dialoge, der Übungstausch, die Satzpause nach dem letzten Satz und wichtige Trainingsabläufe kontrolliert.

**Ergebnis: 292 von 292 automatisierten Prüfungen bestanden.**

Vor einer öffentlichen Veröffentlichung bleiben drei sinnvolle Aufgaben: ein kurzer Test auf einem echten iPhone, geprüfte Linux-Screenshot-Referenzen für das CI und zwei noch offene Produktentscheidungen zur Darstellung nach Übungstauschen sowie zu festen oder flexiblen Wochenvorgaben.

## Gesamtergebnis

| Suite | Bestanden | Fehlgeschlagen |
|---|---:|---:|
| Unit- und Integrationstests | 164 | 0 |
| Playwright · funktionale Fälle | 108 | 0 |
| Playwright · visuelle Vergleiche | 20 | 0 |
| **Playwright gesamt** | **128** | **0** |
| **Alle automatisierten Ausführungen** | **292** | **0** |

Die 32 logischen Playwright-Tests laufen in vier Projekten. Dadurch entstehen 128 Browserausführungen.

## Testumgebung

- Node.js 22
- `@playwright/test` 1.61.0
- Chromium und Playwright WebKit
- Locale `de-DE`
- Zeitzone `Europe/Berlin`
- feste Desktop- und Mobile-Viewports
- reduzierte Animationen und deterministische lokale Testdaten
- keine externen Benutzerkonten oder produktiven Daten

WebKit ist die von Playwright automatisierbare Safari-nahe Browser-Engine. Sie ersetzt keinen abschließenden Test in Safari auf einem echten iPhone.

## Browser- und Gerätematrix

| Projekt | Viewport | Logische Tests | Ergebnis |
|---|---:|---:|---:|
| Desktop Chromium | 1440 × 900 | 32 | 32/32 |
| Desktop WebKit | 1440 × 900 | 32 | 32/32 |
| Mobile Chromium | 375 × 812 | 32 | 32/32 |
| Mobile WebKit · iPhone-Emulation | 390 × 844 | 32 | 32/32 |
| **Gesamt** |  | **128** | **128/128** |

## Ergebnisse nach Testbereich

| Bereich | Logische Tests | Browserausführungen | Ergebnis |
|---|---:|---:|---:|
| Texte & Kommunikation | 11 | 44 | 44/44 |
| UI/UX-Klarheit & Visual Regression | 7 | 28 | 28/28 |
| Redundanz-Check | 6 | 24 | 24/24 |
| Kernfunktion, Regression & Offline-PWA | 8 | 32 | 32/32 |
| **Gesamt** | **32** | **128** | **128/128** |

### 1. Texte & Kommunikation

Bestanden sind unter anderem:

- exakte Erststart-Texte und einmalige Anzeige;
- alte abgeschlossene Einheiten zeigen nur noch `Werte korrigieren`;
- die entfernten Texte `Diese Einheit ist Teil deines Protokolls` und `Diesen Inhalt heute trainieren` erscheinen dort nicht mehr;
- Korrekturhinweis und direkte Werteänderung erklären klar, dass Trainingszeit und Protokolleintrag unverändert bleiben, spätere Empfehlungen aber neu berechnet werden;
- direkte Änderungen lassen sich mit `Übernehmen` oder `Verwerfen` bewusst bestätigen;
- der Übungstausch vor und während des Trainings enthält nur `Übung tauschen`, optional `Original verwenden`, und `Abbrechen`;
- dauerhaftes Behalten wird erst nach einem vollständig beendeten Training für jeden Tausch einzeln gefragt;
- Mehrtag-Hinweise nennen den Ursprungstag, ohne tagfremde Werte in die Originalprogression zu übernehmen;
- Programmbibliothek, Ladefehler und Autocomplete-Rückfrage sind verständlich und eindeutig.

### 2. UI/UX-Klarheit und Visual Regression

Fünf Screenshot-Motive wurden in allen vier Projekten geprüft, also 20 visuelle Vergleiche:

- Erststart-Modal;
- schlanke Fußleiste einer abgeschlossenen Einheit;
- neutral priorisierter Erstellen-Hub;
- Mehrtag-Trainingskarte;
- schlanker Tauschdialog mit höchstens drei Aktionen.

Zusätzlich bestanden:

- kein horizontaler Overflow auf 375 px, 390 px oder Desktop;
- keine verdeckten Aktionen in Fußleiste und Programmverwaltung;
- höchstens eine interaktive Entscheidungsebene;
- stabile Overlay-Reihenfolge;
- Video, Notiz und Übungstausch liegen in einer Zeile;
- kein großer `Pause starten`-Button mehr in der Übungskarte.

Die 20 geprüften Darwin-Baselines liegen getrennt nach Browserprojekt vor. Reguläre Vergleiche laufen mit `--update-snapshots=none`; nur der ausdrücklich dafür vorgesehene Update-Befehl darf Referenzbilder verändern.

### 3. Redundanz-Check

Bestanden sind:

- keine doppelten DOM-IDs;
- genau zwei Kopfzeilenaktionen: `Programme` und `Auswertung`;
- genau eine Workout-Zeit- und Steuerleiste;
- genau fünf eindeutige Erstellwege, ohne farbliche Bevorzugung der ersten beiden;
- vier eindeutige Bibliotheksprogramme;
- höchstens drei deduplizierte Tauschvorschläge;
- pro Übung nur die drei kompakten Hilfsaktionen Video, Notiz und Tausch;
- keine sichtbare Garmin-Bezeichnung und keine zusätzliche große Pausensteuerung.

### 4. Regression, Kernfunktion und Offline-PWA

Bestanden sind:

- alle vier offiziellen Programme lassen sich vollständig prüfen, einschließlich des reparierten Imports von `Calisthenics Einstieg`;
- automatische Wiederholungsbereiche schließen die geöffnete Trainingsgruppe im Editor nicht mehr;
- die Satzpause startet auch nach dem letzten Satz und der Abschlussdialog erscheint erst danach;
- zwei getauschte Übungen werden nach Trainingsende nacheinander und unabhängig entschieden: eine kann dauerhaft übernommen werden, die andere nur für dieses Training gelten;
- Training starten, Werte speichern und ein unterbrochenes Training beenden;
- vollständige Kompatibilität des v0.22-Backups und trainierbare Woche 8;
- Offline-PWA mit Shell, Programmen und Übungsbibliothek nach vorherigem Online-Laden;
- keine unerwarteten Konsolenfehler in den abgesicherten Zuständen.

Bei Chromium enthält der Test einen echten Offline-Reload. Playwright WebKit kann diese Navigation intern abbrechen; dort werden deshalb Cache Storage und die weiterhin verfügbare Offline-Oberfläche kontrolliert.

## Konkret behobene Fehler und UX-Probleme

| Thema | Behobener Zustand | Absicherung |
|---|---|---|
| Fußleiste alter Einheit | erklärende Statuszeile und `Diesen Inhalt heute trainieren` entfernt; nur `Werte korrigieren` bleibt | Text-, Redundanz- und Screenshot-Test |
| Direkte Werteänderung | verständliche Rückfrage `Wert übernehmen?` mit Hinweis auf spätere Berechnungen | Text- und Datenintegritätstest |
| Übungstausch | vor/während Training maximal drei klare Aktionen; keine Dauerhaft-Entscheidung im laufenden Training | Text-, Count- und Screenshot-Test |
| Dauerhafter Tausch | erst nach vollständig beendetem Training; jeder Tausch einzeln mit `Dauerhaft übernehmen` oder `Nur dieses Training` | vollständiger E2E-Test mit zwei Tauschen |
| Letzter Satz | automatische Satzpause läuft vor dem Abschlussdialog | E2E-Timing- und Zustandsprüfung |
| Pausensteuerung | großer `Pause starten`-Button entfernt; kompakte Timerleiste bleibt | DOM-Count und Kernfluss |
| Progressionshinweis | Empfehlung wird in der Folgewoche mit Herkunftswoche gezeigt | Unit-/Integrationstests |
| Dead Hang | kein unlogischer Hinweis auf reduziertes Gewicht; Hinweise sind übungsmodusabhängig | Unit-/Integrationstests |
| Scrollsprung | Wechsel und Einklappen von Übungskarten hält den sichtbaren Bereich stabiler | Unit-/UI-Regressionsschutz |
| Editor | Ausrichtungen vereinheitlicht; eigene Vorgabe verständlicher; Auto-Wiederholungsbereiche lassen Abschnitte offen | Playwright- und Unit-Tests |
| Programme erstellen | erste zwei Wege nicht mehr farblich bevorzugt; Importweg klar angeordnet | Screenshot- und Count-Test |
| Programmvorschau | Kategorien und unnötiger Startgewichts-Hinweis entfernt | Playwright- und Unit-Tests |
| Importhinweise | sichtbares `Sicher automatisch bereinigt` entfernt; Bereinigung bleibt intern | Unit-/Quelltest |
| Calisthenics-Import | ungültige Warm-up-/Cool-down-Bezeichnungen korrigiert | alle vier Programmvorschauen |
| Garmin | sichtbare Garmin-/Proxy-Bezeichnung entfernt | Text- und Redundanztest |

## Verbleibende Risiken und offene Entscheidungen

### R-01 · Echtes iPhone

Mobile Chromium und Mobile WebKit sind vollständig grün. Vor Veröffentlichung bleibt trotzdem ein kurzer manueller Smoke-Test auf einem echten iPhone sinnvoll: App öffnen, Training starten, Werte ändern, letzten Satz abschließen, Übung tauschen und Offline-Neuladen prüfen.

### R-02 · Linux-Screenshot-Baselines

Die 20 Darwin-Baselines sind geprüft. Für ein vollständiges visuelles Linux-CI-Gate fehlen noch 20 geprüfte Baselines aus dem gepinnten Playwright-Container. Sie müssen einmalig erzeugt, von einem Menschen visuell geprüft und committed werden. Reguläre CI-Läufe dürfen sie nicht automatisch aktualisieren.

### R-03 · Darstellung der Tauschentscheidungen nach Trainingsende

Der aktuelle Ablauf ist fachlich eindeutig und getestet: Jeder Tausch wird einzeln entschieden. Offen ist nur noch die Darstellungsfrage, ob mehrere Tausche langfristig weiterhin als aufeinanderfolgende Einzelmodalfenster oder in einer gemeinsamen Übersicht mit einer Entscheidung pro Zeile präsentiert werden sollen.

### R-04 · Wochenvorgaben

Noch offen ist die Produktentscheidung, ob Vorgaben wie Trainingsart und Anstrengung als feste Presets beziehungsweise Datenbankwerte oder bewusst flexibel gepflegt werden. Das aktuelle Verhalten bleibt bis zu dieser Entscheidung unverändert.

## Reproduzierbare Befehle

Installation:

```bash
npm ci
npx playwright install chromium webkit
```

Unit- und Integrationstests:

```bash
npm run test:all:unit
```

Nur funktionale Playwright-Tests:

```bash
npm run test:all:e2e:functional
```

Nur visuelle Vergleiche ohne Baseline-Änderung:

```bash
npm run test:all:e2e:visual
```

Gesamter Playwright-Lauf:

```bash
npm run test:all:e2e
```

Vollständiger lokaler/CI-Testlauf:

```bash
npm run test:all
```

Referenzbilder ausschließlich nach bewusster visueller Prüfung aktualisieren:

```bash
npm run test:update:visual
```

Direkter Vergleich ohne jede Snapshot-Aktualisierung:

```bash
npx playwright test \
  --config qa/playwright/playwright.config.cjs \
  --update-snapshots=none
```

## Freigabebewertung

Der lokale Darwin-Teststand ist technisch grün: **164/164 Unit- und Integrationstests sowie 128/128 Playwright-Ausführungen bestanden.** Für die Veröffentlichung wird zusätzlich der echte iPhone-Smoke empfohlen. Ein automatisches visuelles Linux-Gate setzt die einmalig geprüften Linux-Baselines voraus. Die beiden offenen Produktfragen betreffen die spätere Darstellung mehrerer Tauschentscheidungen und die Modellierung der Wochenvorgaben, nicht die getestete Datenintegrität des aktuellen Ablaufs.
