# Risikobasierter Playwright-Testplan · Großes Update Satzkraft

**Prüfstand:** Branch `agent/grosses-update-releases-1-4`, App v0.26.0 plus aktuelle `Unreleased`-UX-Korrekturen

**Updateumfang:** v0.23.0 O-Fix, v0.24.0 Programm-Bibliothek, v0.25.0 O-Kern, v0.26.0 Übungs-Bibliothek, Mehrtag-Anzeige und UX-Praxistest vom 18.07.2026

**Testziel:** Datenintegrität, verständliche Kommunikation, klare UI, keine doppelten Wege und sicherer Regressionsschutz in Chromium und WebKit auf Desktop und Mobile

## Aktualisierung 18.07.2026 · verbindlicher aktueller Stand

Dieser Block ersetzt alle früheren Annahmen zum Protokoll-Footer, zum Übungstausch und zur letzten Satzpause. Die nachfolgenden Detailmatrizen und Codebeispiele sind entsprechend aktualisiert.

### Aktueller UX-Vertrag

1. Eine alte abgeschlossene Einheit zeigt in der Fußleiste nur `Werte korrigieren`. Die Statuszeile `Diese Einheit ist Teil deines Protokolls` und die Aktion `Diesen Inhalt heute trainieren` sind entfernt.
2. Eine direkte Änderung an einem Satzwert öffnet `Wert übernehmen?`. Die App erklärt, dass Trainingszeit und Protokolleintrag unverändert bleiben und spätere Empfehlungen sowie Zielwerte neu berechnet werden.
3. Vor und während des Trainings enthält der Tauschdialog nur `Übung tauschen`, bei bereits vorhandenem Tausch zusätzlich `Original verwenden`, sowie `Abbrechen`. Eine dauerhafte Änderung wird im laufenden Training nicht angeboten.
4. Erst nach einem vollständig beendeten Training fragt die App für jeden tatsächlichen Tausch einzeln `Übung dauerhaft übernehmen?` mit `Dauerhaft übernehmen` und `Nur dieses Training`.
5. Die automatische Satzpause startet auch nach dem letzten Satz. Erst nach Ende oder Stoppen dieser Pause erscheint der Abschlussdialog.
6. Der große Button `Pause starten` ist entfernt. Die kompakte Timerleiste bleibt die einzige Pausensteuerung.
7. Progressionshinweise erscheinen in der Folgewoche mit `Empfehlung aus Woche X`. Dead Hang, Zeit- und Körpergewichtsübungen erhalten modusgerechte Erholungshinweise ohne unlogische Gewichtsangabe.
8. Die Editor-, Import- und Programm-UI ist bereinigt: keine sichtbare Garmin-Bezeichnung, kein sichtbares `Sicher automatisch bereinigt`, stabile Editorabschnitte, neutrale erste Erstellwege, vereinfachte Programmvorschau und reparierter Import von `Calisthenics Einstieg`.

### Aktuell ausgeführte Matrix

| Bereich | Logische Tests | Vier Browserprojekte | Ergebnis |
|---|---:|---:|---:|
| Texte & Kommunikation | 11 | 44 | 44/44 |
| UI/UX-Klarheit & Visual Regression | 7 | 28 | 28/28 |
| Redundanz-Check | 6 | 24 | 24/24 |
| Regression, Kernfunktion & Offline-PWA | 8 | 32 | 32/32 |
| **Playwright gesamt** | **32** | **128** | **128/128** |

Zusätzlich bestanden 164 Unit- und Integrationstests. Damit ist der aktuelle lokale Gesamtstand **292/292**. Der Funktionslauf umfasst 108/108 Browserausführungen; die fünf Screenshot-Motive ergeben weitere 20/20 visuelle Vergleiche.

## Ausgangslage und Risikologik

Verbindliche fachliche Quellen:

- `BRIEFING-CODEX.md`: Produktregelwerk, Releases 1–4, Mehrtag-Entscheidung und Feedbackblock vom 18.07.2026.
- `docs/planung/GROSSES-UPDATE-RELEASES-1-4.md`: freigegebene Feinspezifikationen und Abnahmekriterien.
- `CHANGELOG.md`: aktueller `Unreleased`-Stand plus v0.23.0–v0.26.0.
- `docs/tests/archiv/TESTBERICHT-RELEASES-1-4.md`: historischer Browserlauf und frühere Automatisierungslücken.
- `docs/referenz/UEBUNGSLISTE.md`: freigegebene Datenbasis mit 200 Übungen.
- `TESTBACKUP-AUSWERTUNG.json` und `TESTPROGRAMM-ALLE-SZENARIEN.json`: bestehende realistische Testdaten.

Die frühere Automatisierungslücke ist geschlossen: Die aktuelle `qa/playwright/update.spec.js` prüft Texte, Datenintegrität, Redundanz, Kernpfade, Offline-PWA und fünf versionierte Screenshot-Motive in Chromium und WebKit auf Desktop und Mobile. Der aktuelle Ergebnisstand steht in `docs/tests/PLAYWRIGHT-TESTBERICHT-GROSSES-UPDATE.md`.

### Produktversprechen, die als P0 behandelt werden

1. Nichts Trainiertes geht verloren.
2. Trainiert wird nur vorne: aktuelle Woche plus leere Einheit der direkten Vorwoche.
3. Nur die jüngste abgeschlossene Einheit darf wiederholt werden.
4. Korrekturen ändern Werte, aber keine Trainingszeit und keinen History-Eintrag.
5. Planänderungen gelten ab der nächsten offenen Einheit und nie rückwirkend.
6. Gleiche Übungen an verschiedenen Tagen bleiben bei Progression, Ziel, Korrektur und Verlauf getrennt.
7. Getauschte Übungen dürfen weder Originalprogression noch Mehrtag-Anzeige verfälschen.
8. Alte Backups, Austauschformat v2 und Schema 4 bleiben kompatibel.

### Prioritäten

| Priorität | Bedeutung | Gate |
|---|---|---|
| **P0** | Datenverlust, falsche Schreibrechte, unzutreffende Kernkommunikation, nicht wiederherstellbarer Zustand | Jeder Commit, vier Browserprojekte, kein Fehler zulässig |
| **P1** | wesentliche UX-, Funktions-, Layout- oder Cross-Browser-Regression | Jeder PR mindestens Desktop Chromium + Mobile WebKit; Release auf allen Projekten |
| **P2** | Politur, seltene Robustheitsfälle, redaktionelle Konsistenz | Nightly; vor Release auf allen Projekten |

Risikowert für Priorisierung: `Auswirkung 1–5 × Eintritt 1–5 × schlechte Entdeckbarkeit 1–5`. Unabhängig vom Zahlenwert wird jede mögliche Datenvernichtung P0.

### Browserprojekte

| Kürzel | Playwright-Projekt | Engine / Viewport |
|---|---|---|
| DC | `desktop-chromium` | Chromium, 1440 × 900 |
| DW | `desktop-webkit` | WebKit, 1440 × 900 |
| MC | `mobile-chromium` | Chromium, 375 × 812 |
| MW | `mobile-webkit` | WebKit, 390 × 844 |

Matrixkürzel: `ALL` = DC + DW + MC + MW, `FAST` = DC + MW, `DESK` = DC + DW, `MOB` = MC + MW. Ein einzelnes Kürzel benennt genau dieses Projekt.

WebKit ist die automatisierbare Safari-Engine, nicht der veröffentlichte Apple-Safari-Browser. Ein echter Safari-Smoke-Test auf macOS bleibt für Releases mit hohem UI-Risiko zusätzlich sinnvoll.

### Noch zu klärende Produkt- und Umgebungsrisiken

| ID | Risiko | Behandlung im Testplan |
|---|---|---|
| OPEN-01 | Mehrere Tausche werden aktuell korrekt nacheinander und einzeln entschieden. Offen ist nur, ob später eine gemeinsame Übersicht verständlicher wäre. | Aktuellen sequenziellen Ablauf als Datenintegritäts-Contract testen; eine spätere Darstellungsänderung braucht neue Text-, Count- und Screenshot-Baselines. |
| OPEN-02 | Für `Wie soll trainiert werden?` und `Anstrengung` ist noch nicht entschieden, ob feste Presets/Datenbankwerte oder flexible Eingaben besser sind. | Aktuelles flexible Verhalten nicht versehentlich einschränken; nach Produktentscheidung Validierungs- und Migrationstests ergänzen. |
| ENV-01 | Mobile WebKit emuliert ein iPhone, ist aber kein echtes Gerät. | Vor Veröffentlichung kurzer manueller Smoke-Test auf einem echten iPhone. |
| ENV-02 | 20 geprüfte Darwin-Baselines sind vorhanden; Linux-Baselines fehlen. | Vor einem visuellen Linux-CI-Gate im gepinnten Container erzeugen, visuell prüfen und committen; CI aktualisiert niemals automatisch. |

## 1. TEXTE & KOMMUNIKATION

### Verbindlicher Copy-Contract

Bei Copy-Tests werden typografische Zeichen mitgeprüft: `„…“`, `‚…‘`, Gedankenstrich `–`, Ellipse, Groß-/Kleinschreibung und Satzzeichen.

| Oberfläche | Erwarteter Wortlaut |
|---|---|
| Intro-Titel | `Neu: Dein Trainingstagebuch ist geschützt` |
| Intro-Untertitel | `Mit diesem Update passt Satzkraft besser auf deine Trainingsdaten auf.` |
| Intro 1 | `Abgeschlossene Trainings bleiben genau so, wie du sie trainiert hast.` |
| Intro 2 | `Zahlen ausbessern geht weiterhin jederzeit – über ‚Werte korrigieren‘.` |
| Intro 3 | `Trainiert und wiederholt wird vorne – in deiner aktuellen Woche, Nachholen aus der Vorwoche inklusive.` |
| Intro-Schluss | `Änderungen an deinem Plan gelten ab jetzt und lassen Vergangenes unverändert. Alles andere bleibt, wie du es kennst.` |
| Intro-Aktion | `Verstanden` |
| Alte abgeschlossene Einheit | Kein Statussatz; in der Fußleiste ausschließlich `Werte korrigieren` |
| Korrektur-Konsequenz | `Du änderst nur die Satzwerte dieser abgeschlossenen Einheit. Trainingszeit und Protokolleintrag bleiben unverändert. Empfehlungen und Zielwerte späterer Wochen werden nach deiner Korrektur neu berechnet.` |
| Direkte Werteänderung | Titel `Wert übernehmen?`; Aktionen `Übernehmen` und `Verwerfen`; enthält die Korrektur-Konsequenz |
| Wiederholen-Basis | `Alle eingetragenen Satzwerte dieses Tages werden geleert. Beim Beenden ersetzt die neue Trainingszeit außerdem die bisher gespeicherte Zeit.` |
| Wiederholen-Zusatz | `Empfehlungen der folgenden Wochen werden aus den neuen Werten neu berechnet. Deine eingetragenen Werte bleiben unverändert.` |
| Tausch vor/während Training | `Übung tauschen`; bei vorhandenem Tausch `Original verwenden`; `Abbrechen` |
| Tausch-Konsequenz | `Für dieses Training wird nur die angezeigte Übung geändert. Nach einem vollständig beendeten Training entscheidest du für jeden Tausch einzeln, ob er künftig bleiben soll.` |
| Tausch nach Trainingsende | Titel `Übung dauerhaft übernehmen?`; Aktionen `Dauerhaft übernehmen` und `Nur dieses Training` |
| Zeitachse | `seit Woche X`; `davor: {Name} (Woche a–b)` |
| Bibliotheks-Kachel | `Fertiges Programm wählen` |
| Bibliotheks-Untertext | `Vier geprüfte Satzkraft-Programme – ansehen, übernehmen, lostrainieren.` |
| Herkunft | `Offizielles Satzkraft-Programm` |
| Kalibrierung auf Trainingskarte | `Arbeitsgewicht noch offen`; `Trag beim ersten Satz dein verwendetes Gewicht ein.`; `Startgewicht bestimmen` |
| Bibliotheksfehler | `Das Programm konnte nicht geladen werden. Öffne die Liste einmal mit Internet – danach funktioniert sie auch offline.` |
| Autocomplete-Rückfrage | `Vorhandene Angaben ersetzen?` |
| Tauschvorschläge | `Passende Vorschläge` |
| Mehrtag, vorläufig | `Letzter Wert an anderem Tag · {Tag} (W{Woche}): {Wert}` |
| Progression aus Vorwoche | `Empfehlung aus Woche X` plus modusgerechte Empfehlung |
| Dead Hang / Zeit im Deload | `Erholung: Haltezeit reduzieren oder leichtere Variante wählen` |

### Testmatrix Texte

| ID | Pri | Setup / Aktion | Automatisierte Prüfung | Projekte |
|---|---:|---|---|---|
| TXT-01 | P0 | Leerer Storage, App öffnen | Intro-Titel, fünf Absätze und `Verstanden` exakt; nach Bestätigung + Reload nicht erneut sichtbar | ALL |
| TXT-02 | P0 | Intro noch ungesehen, Workout läuft | Intro weder während des Trainings noch spontan beim Beenden; beim nächsten App-Start ohne Workout genau einmal, nach Bestätigung nie erneut | ALL |
| TXT-03 | P0 | v0.22-Backup, alte abgeschlossene Einheit | Fußleiste enthält genau einmal `Werte korrigieren`; kein Statussatz `Diese Einheit ist Teil deines Protokolls`, kein `Diesen Inhalt heute trainieren`, kein Startbutton | ALL |
| TXT-04 | P0 | Vollständig abgeschlossener Block, alte Einheit | Zusatz `Dieser Block ist abgeschlossen. Starte deinen Folgeblock über „Programme“.` exakt | ALL |
| TXT-05 | P0 | Abgeschlossene Einheit, `Werte korrigieren` öffnen | Titel und Korrektur-Konsequenz exakt; Aktionen genau `Werte korrigieren` und `Abbrechen`; nach Einstieg Bottom-Bar ausschließlich `Fertig`; History bleibt unverändert | ALL |
| TXT-06 | P0 | Satzwert direkt im Textfeld ändern | `Wert übernehmen?`, Alt-/Neuwert, Korrektur-Konsequenz, `Übernehmen` und `Verwerfen` exakt; Verwerfen restauriert den Altwert | ALL |
| TXT-07 | P0 | Letzte Einheit, keine späteren Daten desselben Tages | Wiederholen-Modal enthält nur Basistext; Zusatzwarnung fehlt | ALL |
| TXT-08 | P0 | Letzte Einheit mit späteren Originalwerten desselben Tages | Basistext plus Zusatzwarnung exakt; Buttons exakt | ALL |
| TXT-09 | P0 | Spätere Werte nur an anderem Tag | Zusatzwarnung fehlt | ALL |
| TXT-10 | P0 | Spätere Zellen desselben Tages nur mit `swap` | Zusatzwarnung fehlt | ALL |
| TXT-11 | P0 | Umbenennung einer Übung mit Werten | `Umbenennung einordnen`; Frage mit Übungsname; drei Entscheidungsbuttons exakt | ALL |
| TXT-12 | P0 | Trainingstag mit abgeschlossener Einheit löschen | `Trainingstag bleibt erhalten` plus vollständige Schutzbegründung exakt | ALL |
| TXT-13 | P1 | Nachfolgerin ab Woche 8 | Karte `seit Woche 8`; Modal `Übungs-Zeitachse · …`; `davor: … (Woche 1–7)` | FAST |
| TXT-14 | P1 | Zeitachse ohne alte Werte | `Für die Vorgängerin wurde noch nichts eingetragen.` exakt | FAST |
| TXT-15 | P1 | Erstellen-Hub | Erste Kachel, Untertext und `aria-label` exakt | ALL |
| TXT-16 | P1 | Programmbibliothek | Vier Produktnamen und vier Metazeilen exakt; in Liste keine zusätzliche Blocklänge | FAST |
| TXT-17 | P1 | Bibliotheksvorschau | `Trainingstage`, `Wochenstruktur` und `Alle Übungen` exakt; Übungsnamen ohne Kategorien; keine Zahl fehlender Startgewichte und kein Kalibrierblock | FAST |
| TXT-18 | P1 | Noch kein Arbeitsgewicht auf Trainingskarte | kompakter Hinweis `Arbeitsgewicht noch offen`, Ein-Satz-Erklärung und `Startgewicht bestimmen`; einheitlicher Umbruch | FAST |
| TXT-19 | P1 | `programme/*.json` absichtlich nicht ladbar | Titel `Programm nicht geladen`, Fehlertext und `OK` exakt | FAST |
| TXT-20 | P1 | Gleiches Bibliotheksprogramm erneut übernehmen | Duplikatwarnung benennt, dass nichts unbemerkt doppelt gespeichert wird; drei Wege eindeutig | FAST |
| TXT-21 | P1 | Offizielles Programm übernommen | Herkunft exakt einmal; auf Kopie und Reimport nicht vorhanden | FAST |
| TXT-22 | P1 | Editor: `Bankd`, `bench`, Alias, Umlaut | DE/EN-Treffertexte korrekt; Freitext bleibt erhalten; ab 1 Zeichen keine Vorschläge | ALL |
| TXT-23 | P1 | Bibliothekstreffer überschreibt gepflegte Felder | Rückfrage und zwei Buttons exakt; Abbrechen lässt alle Felder unverändert | FAST |
| TXT-24 | P0 | Tausch vor oder während Training, noch kein Ersatz aktiv | Titel, Feldlabel, Placeholder und Konsequenz exakt; Aktionen nur `Übung tauschen` und `Abbrechen`; keine dauerhafte Aktion | ALL |
| TXT-25 | P0 | Bereits getauschte Übung vor erster Satzeingabe | Aktionen genau `Übung tauschen`, `Original verwenden`, `Abbrechen`; keine Aktion `Ab jetzt ersetzen` oder `Dauerhaft übernehmen` | ALL |
| TXT-26 | P0 | Tausch nach erster Satzeingabe | `Übung nicht mehr tauschbar` und Schutzbegründung exakt | ALL |
| TXT-27 | P0 | Mehrtag-Fixture, jüngster Originalwert anderer Tag | `.otherlast` folgt vorläufigem Copy-Contract; lokale `.last`-Zeile bleibt separat | ALL |
| TXT-28 | P1 | Report mit beendeter Übung | Zeitraum im Kartentitel; `Erster Wert · W…`, `Aktuell · W…`, `Bestwert: … · W…` | FAST |
| TXT-29 | P1 | Report geöffnet | `Drucken / PDF`, `Auswertung schließen`, Protokoll-Druckhinweis exakt | DESK |
| TXT-30 | P2 | Alle Update-Ansichten | Keine Alttexte `Ordner-Symbol`, `2 · Programm laden`, `Sicher als Kopie speichern`, `Sicher automatisch bereinigt`, sichtbares `Garmin`/`Garmin-Proxy`; keine Sie-Form | DC |
| TXT-31 | P0 | Nutzername/Notiz mit `<`, `>`, `&`, Anführungszeichen | Inhalt wortgetreu als Text, nie als HTML/Script; keine fremde Fehlermeldung | ALL |
| TXT-32 | P1 | Import mit falschem `fromWeek`, `untilWeek`, `prevId`, `origin` | Fehler nennt Feld und betroffene Übung/Programm verständlich; Storage unverändert | FAST |
| TXT-33 | P0 | Vollständig beendetes Training mit zwei Tauschen | Für jeden Tausch nacheinander Titel, Original und Ersatz; Aktionen genau `Dauerhaft übernehmen` und `Nur dieses Training`; Entscheidungen wirken unabhängig | ALL |
| TXT-34 | P1 | Folgewoche nach abgeschlossener Vorwoche | `Empfehlung aus Woche X` sichtbar; Gewichts-, Zeit- und Körpergewichtsformulierung jeweils modusgerecht | FAST |
| TXT-35 | P1 | Dead Hang in Erholungswoche | Haltezeit/leichtere Variante; kein Text `reduziertes Gewicht` und keine kg-Angabe | FAST |

Beispiel für einen exakten, kontextbezogenen Copy-Test:

```js
const modal = page.locator('#modal');

await expect(modal.locator('.mtitle')).toHaveText(
  'Neu: Dein Trainingstagebuch ist geschützt'
);

await expect(modal.locator('.mmsg > p')).toHaveText([
  'Mit diesem Update passt Satzkraft besser auf deine Trainingsdaten auf.',
  'Abgeschlossene Trainings bleiben genau so, wie du sie trainiert hast.',
  'Zahlen ausbessern geht weiterhin jederzeit – über ‚Werte korrigieren‘.',
  'Trainiert und wiederholt wird vorne – in deiner aktuellen Woche, Nachholen aus der Vorwoche inklusive.',
  'Änderungen an deinem Plan gelten ab jetzt und lassen Vergangenes unverändert. Alles andere bleibt, wie du es kennst.',
]);

await expect(modal.locator('.mbtn')).toHaveText(['Verstanden']);
```

Beispiel für den schlanken Tauschdialog und die spätere Einzelentscheidung:

```js
await page.locator('[data-swap-ex="A_0"]').click();

await expect(page.locator('#modal .mbtn')).toHaveText([
  'Übung tauschen',
  'Abbrechen',
]);
await expect(
  page.locator('#modal').getByRole('button', {
    name: /Dauerhaft übernehmen|Ab jetzt ersetzen/,
  })
).toHaveCount(0);

await page.locator('#swapname').fill('Beinpresse');
await page
  .locator('#modal')
  .getByRole('button', { name: 'Übung tauschen', exact: true })
  .click();

// Nach vollständig beendetem Training:
await expect(page.locator('#modal .mtitle')).toHaveText(
  'Übung dauerhaft übernehmen?'
);
await expect(page.locator('#modal .mbtn')).toHaveText([
  'Dauerhaft übernehmen',
  'Nur dieses Training',
]);
```

Wichtig: Text-Assertions werden stets innerhalb des relevanten Containers ausgeführt. Die Hauptansicht bleibt unter `#lib` beziehungsweise `#modal` im DOM; globale Textzähler würden deshalb falsche Doppelungen melden.

## 2. UI/UX-KLARHEIT & VISUELLE ÜBERLADUNG

### Harte Klarheitsbudgets

| Oberfläche | Grenze |
|---|---|
| Hauptkopf | genau 2 Aktionen: Programme, Auswertung |
| Normale Bottom-Bar | höchstens 2 Hauptaktionen |
| Aktives Training | genau eine Zeit, Pause/Weiter und Ende |
| Standardmodal | höchstens 3 Entscheidungsbuttons; Intro genau 1; Tausch nach Trainingsende genau 2 |
| Erstellen-Hub | genau 5 bewusst verschiedene Wege |
| Programmbibliothek | genau 4 Programme |
| Autocomplete | höchstens 6 eindeutige Treffer |
| Tauschvorschläge | höchstens 3 eindeutige Treffer |
| Horizontaler Overflow | 0 px auf 375, 390 und Desktop |
| Primäre Touch-Aktion | mindestens 44 px Höhe |
| Reiner Icon-Button | mindestens 32 px; zugänglicher Name Pflicht |
| Overlay-Stack | maximal ein interaktives Top-Overlay; Modal darf über `#lib` liegen, muss aber höheren `z-index` haben |

### Testmatrix Visual Regression

| ID | Pri | Zustand | Screenshot / DOM-Prüfung | Projekte |
|---|---:|---|---|---|
| VIS-01 | P0 | Frischer Hauptscreen dunkel/hell | `main-clean-{theme}.png`; Kopf, Woche, Karten, Footer, Bar | ALL |
| VIS-02 | P1 | Intro offen | `erststart-modal-dunkel.png`; kein abgeschnittener Absatz/Button, Mobile ohne Scrollfalle | ALL |
| VIS-03 | P0 | Gesperrte alte Einheit | `protokoll-wegweiser-dunkel.png`; keine Statuszeile, nur eine vollbreite Aktion `Werte korrigieren` | ALL |
| VIS-04 | P0 | Jüngste wiederholbare Einheit | langer Wiederholen-Button ohne unschönen Umbruch; Korrigieren und Wiederholen unterscheidbar | ALL |
| VIS-05 | P1 | Korrekturmodus | alle Satzfelder nutzbar; Bottom-Bar nur `Fertig`; Hinweis nicht mit Empfehlung verwechselt | ALL |
| VIS-06 | P1 | Erstellen-Hub dunkel/hell | `erstellen-hub-hell.png`; fünf Kacheln, Bibliothek zuerst, Untertexte vollständig | ALL |
| VIS-07 | P1 | Programmbibliothek | vier Karten, Metazeilen lesbar, keine unnötigen Zusatzaktionen | ALL |
| VIS-08 | P1 | Lange Bibliotheksvorschau | Übungsnamen ohne Kategorie-Badges und ohne Startgewichts-Zähler; Sticky-Aktionen überdecken keinen Text | ALL |
| VIS-09 | P1 | Editor-Autocomplete | Dropdown bleibt im Editorcontainer; DE/EN sauber; Save-Bar bleibt erreichbar | ALL |
| VIS-10 | P1 | Überschreib-Rückfrage | langer Text und zwei Entscheidungen ohne Clipping | ALL |
| VIS-11 | P1 | Tauschmodal mit drei Vorschlägen | Vorschläge, Erklärung und Actions optisch getrennt | ALL |
| VIS-12 | P1 | Zeitachsenmodal | Tabellenzeilen und Zeitraum auf Mobile ohne horizontales Abschneiden | ALL |
| VIS-13 | P1 | Report mit beendeter Übung | eigene alte/neue Karten; drei Summary-Kacheln; Protokoll zu/auf | ALL |
| VIS-14 | P0 | Laufendes Training | genau eine Timerleiste; Karte nicht von Bar überdeckt | ALL |
| VIS-15 | P0 | Satzpause, einschließlich letztem Satz | kompakte Timerleiste mit Zeit, ±15 und Stop ohne Überlagerung; kein großer Kartenbutton; Scrollen weiter möglich | ALL |
| VIS-16 | P1 | Halte-Timer Ziel/Max | Status und Aktionen auf Mobile in zwei klaren Zeilen | ALL |
| VIS-17 | P1 | Mehrtag-Zeile kurz/lang | `mehrtag-karte.png`; `.last` und `.otherlast` getrennt, lange Werte umbrechen | ALL |
| VIS-18 | P0 | Alle obigen Zustände | `scrollWidth <= clientWidth`; keine sichtbare Aktion außerhalb Viewport | ALL |
| VIS-19 | P1 | Light/Dark | gleiche Hierarchie, Kontrast der Hinweise, keine fehlenden Theme-Overrides | ALL |
| VIS-20 | P1 | Druckansicht | A4, mehrere Seiten, kein abgeschnittener Inhalt; Protokoll nur geöffnet | DESK |
| VIS-21 | P2 | Reduced Motion | ohne Animation keine Information verloren; Screenshot stabil | ALL |
| VIS-22 | P1 | Bereits getauschte Übung im laufenden Workout | `tauschmodal-schlank.png`; genau `Übung tauschen`, `Original verwenden`, `Abbrechen`; keine dauerhafte Aktion | ALL |
| VIS-23 | P1 | Bibliothek mit darüberliegendem Bestätigungsmodal | nur das Modal interaktiv; `#modal` liegt mit höherem `z-index` über `#lib`; kein drittes Overlay | ALL |
| VIS-24 | P1 | Trainingskarte Desktop und Mobile | Video, Notiz und Übungstausch auf einer Zeile; Abstand zwischen deutschem Titel, englischem Titel und Beschreibung; kein Garmin-Text | ALL |
| VIS-25 | P1 | Editor Training und Details | Trainingstag/Name, Bezeichnung/Farbe und Startgewicht/Steigerung jeweils auf gleicher Höhe; `Eigene Vorgabe für diese Übung` in einer Zeile | ALL |
| VIS-26 | P1 | Erstellen-Hub | `Fertiges Programm wählen` und `Manuell erstellen` neutral statt grün hervorgehoben; Importweg über volle Breite | ALL |
| VIS-27 | P2 | Programmverwaltung | `Aktivieren` besitzt dieselbe neutrale visuelle Gewichtung wie `Bearbeiten`; aktive Zustände bleiben trotzdem eindeutig | ALL |

Konfiguration und Beispiele liegen in:

- `qa/playwright/playwright.config.cjs`
- `qa/playwright/update.spec.js`

Direktes Screenshot-Muster:

```js
await expect(page).toHaveScreenshot('protokoll-wegweiser-dunkel.png', {
  fullPage: false,
});

await expect(page.locator('#card-A_0')).toHaveScreenshot(
  'mehrtag-karte.png'
);
```

Zusätzliche strukturelle Prüfung gegen Überladung:

```js
const overflow = await page.evaluate(() => ({
  document: document.documentElement.scrollWidth >
    document.documentElement.clientWidth + 1,
  app: document.querySelector('#app').scrollWidth >
    document.querySelector('#app').clientWidth + 1,
  bar: document.querySelector('#bar').scrollWidth >
    document.querySelector('#bar').clientWidth + 1,
}));

expect(overflow).toEqual({ document: false, app: false, bar: false });
```

Visual-Baselines werden je Betriebssystem und Projekt getrennt gespeichert. Texte dürfen **nicht** maskiert werden. Nur tatsächlich volatile Timersekunden dürfen maskiert oder über eine feste Clock stabilisiert werden. CI darf Snapshots niemals automatisch aktualisieren.

## 3. REDUNDANZ-CHECK

### Testmatrix Anti-Doppelung

| ID | Pri | Risiko | Automatisierte Assertion | Projekte |
|---|---:|---|---|---|
| RED-01 | P1 | Kopf wieder überladen | `#app .topright > button:visible` exakt 2; Programme/Auswertung je einmal; Theme/Version dort 0 | ALL |
| RED-02 | P0 | Doppelte Workout-Steuerung | `#barWtElapsed`, Pause/Weiter und Ende je exakt 1; keine zweite Steuerung in `#app` | ALL |
| RED-03 | P0 | Mehrere Bar-Zustände gleichzeitig | Genau einer von Start, Fortsetzen, Wiederholen/Korrektur, Workout, Satzpause oder Hold ist sichtbar | ALL |
| RED-04 | P0 | Doppelte Protokollaktion | In einer alten abgeschlossenen Einheit genau einmal `Werte korrigieren`; `Diesen Inhalt heute trainieren` count 0 | ALL |
| RED-05 | P1 | Doppelter Bibliothekseinstieg | `#programlibrarybtn` exakt 1 und erste `.createchoice` | FAST |
| RED-06 | P1 | Zu viele oder falsch priorisierte Erstellwege | `.createchoice` exakt 5; IDs und Absichten eindeutig; erste und zweite Kachel besitzen keine Primary-Hervorhebung | ALL |
| RED-07 | P1 | Doppelte Bibliotheksprogramme | `[data-library-index]` exakt 4; Namen und Dateipfade eindeutig | FAST |
| RED-08 | P0 | Stilles Programmduplikat | Zweite identische Übernahme ändert Programmzahl erst nach explizitem Kopie-Weg | ALL |
| RED-09 | P1 | Doppelte Autocomplete-Treffer | normalisierte DE-Namen unique, Anzahl `<= 6` | FAST |
| RED-10 | P1 | Proxy und Ersatz doppelt | Tauschvorschläge normalisiert unique, Anzahl `<= 3` | FAST |
| RED-11 | P1 | Herkunft dupliziert | Original exakt eine `.programorigin`; Kopie/Reimport 0 | FAST |
| RED-12 | P1 | Alte Report-Kachel zurück | `.rsummary > .rmetric` exakt 3; `Eingetragene Arbeitssätze` count 0 | FAST |
| RED-13 | P0 | Zwei Sessions pro Woche×Tag | Nach Wiederholung genau ein History-Eintrag für die Zelle | ALL |
| RED-14 | P0 | Alte und neue Übung parallel | Je Woche×Tag nur die dort gültige Vorgänger- oder Nachfolgerkarte | ALL |
| RED-15 | P0 | Mehrtag-Wert wird zusammengeführt | Pro Karte höchstens eine `.otherlast`; `.last`, Ziel und Log-ID bleiben tagbezogen | ALL |
| RED-16 | P1 | Mehrere modale Entscheidungen | Sichtbar höchstens eine `.mbox`; Doppelklick erzeugt keine zweite Aktion | FAST |
| RED-17 | P1 | Mehrere Close-/Back-Wege | In aktiver Unteransicht genau ein sichtbarer Schließen- oder Zurückweg pro Rolle | FAST |
| RED-18 | P1 | Aktiv-/Archivstatus doppelt | Kein redundantes Aktiv-Symbol/Archiv-Badge; nur abgeschlossenes Programm mit goldenem Badge | FAST |
| RED-19 | P1 | Notiz doppelt versteckt | Report zeigt vorhandene Notiz direkt; keine zusätzliche Notiz-Aufklappaktion | FAST |
| RED-20 | P2 | Absichtslos generische Buttons | Im Protokoll kein alleinstehendes `Bearbeiten`, `Start` oder `Weiter` ohne Kontext | DC |
| RED-21 | P2 | Bewusste WUCD-Überschneidung als Fehler | Mobility/Cardio-Einträge aus dokumentierter Allowlist nicht als Duplikatfehler melden | DC |
| RED-22 | P0 | Doppelte DOM-IDs | Alle aktuell gerenderten `[id]` besitzen count 1 | ALL |
| RED-23 | P0 | Doppelte Pausensteuerung | `.pausebtn` in der Übungskarte count 0; während Satzpause genau eine kompakte `.restbar`; kein sichtbarer `Pause starten`-Button | ALL |
| RED-24 | P1 | Zu viele Hilfsaktionen auf Übungskarte | Video, Notiz und Übungstausch jeweils genau einmal und in einer Zeile; sichtbares Garmin count 0 | ALL |

Playwright-Zählmuster:

```js
await expect(page.locator('#bar #barWtElapsed:visible')).toHaveCount(1);
await expect(page.locator('#bar #barpausew:visible')).toHaveCount(1);
await expect(page.locator('#bar #barstopw:visible')).toHaveCount(1);
await expect(page.locator('#app #wtElapsed:visible')).toHaveCount(0);

const suggestions = page.locator('#modal [data-swap-suggestion]');
const labels = await suggestions.allTextContents();
expect(labels.length).toBeLessThanOrEqual(3);
expect(new Set(labels.map(normalizeName)).size).toBe(labels.length);
```

## 4. REGRESSION & FUNKTION

Login und Checkout sind **nicht anwendbar**: Satzkraft ist laut Produktbriefing lokal, kontolos und ohne Commerce. Der reale Daten-Upload besteht aus:

1. Programm-JSON per Text oder Datei.
2. Vollständige Backup-Wiederherstellung.

Beide sind P0. Paket N „KI-Coach 2.0 Blockbegleitung“ ist ausdrücklich nicht Teil dieses Updates.

### Releases 1 und 3 · Protokoll- und Zonenmodell

| ID | Pri | Szenario / Schritte | Erwartung | Projekte |
|---|---:|---|---|---|
| FUN-O3-01 | P0 | v0.22-Backup, nachträglich Übung ergänzen | Wochen 1–7 bleiben 100 %, Häkchen/Blockabschluss unverändert; neue Übung erst W8 | ALL |
| FUN-O3-02 | P0 | History `complete:false` oder Flag fehlt | Kein Einfrieren; Live-Berechnung bleibt wie Altbestand | ALL |
| FUN-O3-03 | P0 | Eingefrorener Tag später leer | Tag bleibt abgeschlossen; keine Verpasst-Warnung | ALL |
| FUN-O3-04 | P0 | Wiederholung unvollständig beenden | alter Abschluss ersetzt, jetzt `complete:false`, Bar zeigt Fortsetzen | ALL |
| FUN-O3-05 | P0 | Mehrere Programme | Abschluss/History immer aus richtigem Store | ALL |
| FUN-O1-01 | P0 | Keine Trainingsdaten | aktuelle Trainingswoche = 1 | ALL |
| FUN-O1-02 | P0 | Woche teilweise begonnen | aktuelle Woche bleibt dort | ALL |
| FUN-O1-03 | P0 | Höchste Woche komplett | rückt genau eine Woche vor, gedeckelt auf Blocklänge | ALL |
| FUN-O1-04 | P0 | v0.22-Backup W1–7 fertig | W8 startbar; W1–6 nicht startbar; Navigation lesend frei | ALL |
| FUN-O1-05 | P0 | Jüngster History-Eintrag | nur diese Einheit wiederholbar | ALL |
| FUN-O1-06 | P0 | W8 begonnen, W7-Tag vollständig leer | leerer W7-Tag nachholbar | ALL |
| FUN-O1-07 | P0 | W7 mit Satzwerten/unterbrochen | nicht als leer neu startbar; nur korrekter Fortsetzen-/Korrekturweg | ALL |
| FUN-O2-01 | P0 | W1 korrigieren, gefüllten Wert ändern | nur `logs` ändern; History byte-identisch; keine neue Session | ALL |
| FUN-O2-02 | P0 | Vergessenen leeren Satz nachtragen | Feld editierbar; Trainingszeit unverändert | ALL |
| FUN-O2-03 | P0 | Korrektur bei laufendem Workout | Einstieg blockiert | ALL |
| FUN-O4-01 | P0 | Übung auf offenem Tag ersetzen | Original `untilWeek=W−1`; neue Übung `fromWeek=W`, eigene ID, `prevId` | ALL |
| FUN-O4-02 | P0 | Tag in aktueller Woche bereits fertig | Anker = Folgewoche | ALL |
| FUN-O4-03 | P0 | Entfernte Übung | Logs bleiben vollständig erhalten | ALL |
| FUN-O4-04 | P0 | Typänderung | Original endet, Nachfolgerin startet leer; andere Übungen unverändert | ALL |
| FUN-O4-05 | P0 | Reine Umbenennung → „gleiche Übung“ | ID, Logs, Verlauf bleiben | ALL |
| FUN-O4-06 | P0 | Umbenennung → „andere Übung“ | alte endet, neue beginnt; Zeitachse korrekt | ALL |
| FUN-O4-07 | P0 | Keine offene Folgewoche im aktuellen Block | dauerhafte Tauschentscheidung wird für den nächsten Folgeblock vorgemerkt; vergangene Einheit und aktueller Block bleiben unverändert | ALL |
| FUN-O4-08 | P0 | Tag mit abgeschlossener Einheit löschen | blockiert; leerer Tag bleibt löschbar | ALL |
| FUN-O4-09 | P0 | Export/Reimport | `fromWeek`, `untilWeek`, `prevId` verlustfrei | ALL |
| FUN-O4-10 | P0 | Fremdprogramm ohne neue Felder | identisch gültig, Schema 4/Format v2 | ALL |
| FUN-O5-01 | P1 | Alte und neue Wochen ansehen | jeweils historische Übung und Werte korrekt | FAST |
| FUN-O5-02 | P1 | Report | beendete Übung eigene Karte mit Zeitraum; keine Trend-Doppelzählung | FAST |
| FUN-O6-01 | P0 | Wiederholen mit späteren Originalwerten | Empfehlungen neu berechnet; spätere eingetragene Werte unverändert | ALL |

### Release 2 · Programm-Bibliothek

| ID | Pri | Szenario | Erwartung | Projekte |
|---|---:|---|---|---|
| FUN-L-01 | P1 | Erstellen-Hub öffnen | Bibliothek erste Kachel | ALL |
| FUN-L-02 | P1 | Liste öffnen | exakt vier Programme, richtige Reihenfolge und Metadaten | FAST |
| FUN-L-03 | P0 | Jedes Programm laden | echte `parseProgram`-Prüfung besteht | FAST |
| FUN-L-04 | P1 | Vorschau komplett scrollen | alle Wochen, Deload, Tage, Übungsnamen und WU/CD; keine Kategorie-Badges und kein unnötiger Startgewichts-Zähler | ALL |
| FUN-L-05 | P0 | Speichern & aktivieren | Programm aktiv; Training startbar; genau ein neuer Store | ALL |
| FUN-L-06 | P1 | Nur speichern | aktives Programm unverändert | FAST |
| FUN-L-07 | P0 | Identisches Programm erneut | Duplikatdialog; kein stilles Duplikat | ALL |
| FUN-L-08 | P1 | Kopie/Export/Reimport | `origin` wird nicht übertragen | FAST |
| FUN-L-09 | P1 | Erstes Laden offline | freundliche Fehlermeldung; Zustand unverändert | ALL |
| FUN-L-10 | P1 | Einmal online, danach offline | Service Worker liefert alle vier Dateien | ALL |
| FUN-L-11 | P0 | Workout läuft | Kachel und Übernahme sichtbar/funktional gesperrt | ALL |
| FUN-L-12 | P1 | Startgewicht leer | in der Trainingskarte kompakter Hinweis und `Startgewicht bestimmen`; Vorschau bleibt davon unbelastet; Training erlaubt Kalibrierung | FAST |
| FUN-L-13 | P0 | `Calisthenics Einstieg` laden | Importprüfung besteht; korrigierte Warm-up-/Cool-down-Namen werden erkannt | ALL |

### Release 4 · Übungs-Bibliothek

| ID | Pri | Szenario | Erwartung | Projekte |
|---|---:|---|---|---|
| FUN-M-01 | P1 | `uebungen.json` laden | 200 Einträge; Pflichtfelder; Ersatz existiert; Alias kollisionsfrei | DC |
| FUN-M-02 | P1 | 1 Zeichen tippen | keine Vorschläge | ALL |
| FUN-M-03 | P1 | 2+ Zeichen DE/EN/Alias | höchstens 6 relevante, eindeutige Treffer | ALL |
| FUN-M-04 | P1 | Umlaut/Großschreibung | `ä→ae`, `ö→oe`, `ü→ue`, `ß→ss` konsistent | FAST |
| FUN-M-05 | P1 | Treffer übernehmen | DE, EN, Typ, Technik, Video, Proxy korrekt befüllt | ALL |
| FUN-M-06 | P1 | Typ `gewicht` | weighted, reps, Startgewicht/Steigerung | FAST |
| FUN-M-07 | P1 | Typ `koerpergewicht` | kein Gewicht, reps | FAST |
| FUN-M-08 | P1 | Typ `kgz` | weighted + bodyweight, nur Zusatzgewicht | FAST |
| FUN-M-09 | P1 | Typ `zeit` | seconds + sinnvoller Timer-Modus | FAST |
| FUN-M-10 | P1 | Vorhandene Felder | erst nach Bestätigung überschrieben | FAST |
| FUN-M-11 | P1 | Unbekannter Freitext | frei speicherbar, keine Validierungsblockade | ALL |
| FUN-M-12 | P1 | Tauschmodal | Proxy, Bibliotheksersatz, Muster/Equipment-Alternative; max. 3 | ALL |
| FUN-M-13 | P1 | `uebungen.json` offline nicht geladen | Editor/Tausch bleiben ohne Vorschläge bedienbar; kein störender Fehler | ALL |
| FUN-M-14 | P1 | Vorblockname `Bench Press`, aktuell `Bankdrücken` | Alias-Matching liefert Vergleich/Startwert | FAST |
| FUN-M-15 | P1 | Unbekannte ähnliche Namen | kein falsches Fuzzy-Matching | FAST |

### Unreleased · Mehrtag-Anzeige

| ID | Pri | Szenario | Erwartung | Projekte |
|---|---:|---|---|---|
| FUN-X-01 | P0 | Gleicher exakter Name an A/B, getrennte IDs | A zeigt jüngsten B-Originalwert; IDs/Stores bleiben getrennt | ALL |
| FUN-X-02 | P0 | Gleiche Übung an drei Tagen | zeitlich jüngster gültiger andere Tag gewinnt; Tie-Break sichtbar dokumentieren | ALL |
| FUN-X-03 | P0 | Jüngste andere Zelle hat `swap` | Zelle wird übersprungen; nächster Originalwert oder keine Zeile | ALL |
| FUN-X-04 | P0 | Aktueller Trainingstag | wird immer ausgeschlossen | ALL |
| FUN-X-05 | P0 | Keine Reps-/Zeitwerte | `.otherlast` count 0 | ALL |
| FUN-X-06 | P0 | Gewicht, Bodyweight, KG+Zusatz, Sekunden | korrekte, eindeutige Formatierung | ALL |
| FUN-X-07 | P0 | Wert an A ändern | B-Logs, B-Ziel, B-Verlauf byte-identisch | ALL |
| FUN-X-08 | P0 | Hinweis nur rendern/reload | `tg`, Logs, History und Empfehlungen unverändert | ALL |
| FUN-X-09 | P1 | Aliasname nach geladener Bibliothek | aktuelles Verhalten explizit festhalten; keine falsche Kollision | FAST |
| FUN-X-10 | P1 | Sehr lange Zahlen-/Zeitreihe Mobile | sauberer Umbruch, kein Overflow | MOB |

### Zwingende Kernregressionen

| ID | Pri | Nutzerpfad / Falscheingabe | Erwartung | Projekte |
|---|---:|---|---|---|
| REG-01 | P0 | Frischer Start | Standardprogramm, keine Console-/Page-Errors | ALL |
| REG-02 | P0 | Training starten → letzten Satz erfassen → automatische Pause stoppen → beenden | Pause startet auch nach dem letzten Satz; Abschlussdialog erst danach; genau ein History-Eintrag, Reload erhält Zustand | ALL |
| REG-03 | P1 | Gewicht zuerst | Wiederholungen sinnvoll vorbelegt; 0 kg stört nicht | FAST |
| REG-04 | P1 | negative, NaN, sehr große, Dezimal-Eingaben | sanitisiert/abgewiesen, keine kaputten Logs | FAST |
| REG-05 | P1 | Zielzeit 30–60 s | korrekter Timer, oberes Ziel, Wert in Sekunden | FAST |
| REG-06 | P1 | Zielzeit 20 min | UI in Minuten, Storage in Sekunden | FAST |
| REG-07 | P1 | Maximalzeit | läuft bis eigenem Stopp, Bestwert sichtbar | FAST |
| REG-08 | P1 | Warm-up/Cool-down | Timerfluss, 15–180 s, max. 8, Reihenfolge | FAST |
| REG-09 | P0 | Satz-/Timerfokus | andere Übungen vollständig schreibgeschützt | ALL |
| REG-10 | P0 | Programm-JSON Text/Datei gültig | Vorschau vor Mutation; speichern/aktivieren korrekt | ALL |
| REG-11 | P0 | leeres/kaputtes/falsches/zu großes JSON | klare Meldung; aktiver State byte-identisch | ALL |
| REG-12 | P0 | vollständiges Backup wiederherstellen | atomar; Sicherheitskopie; alle Programme/Logs/History | ALL |
| REG-13 | P0 | ungültiges/neueres/zu großes Backup | keine Mutation | ALL |
| REG-14 | P0 | Workout läuft, Programme öffnen | Mutationen gesperrt; Export/Backup-Download/Report erlaubt | ALL |
| REG-15 | P1 | Editor als Kopie | Original und aktiver Status unverändert | FAST |
| REG-16 | P0 | Original ersetzen | Gültig-ab-Regeln; kein Datenverlust | ALL |
| REG-17 | P1 | `Übung tauschen` vor/während Training | Protokoll mit Original → Ersatz; im laufenden Training keine Dauerhaft-Aktion; Originalprogression unverändert | ALL |
| REG-18 | P0 | Zwei Übungen tauschen, Training vollständig beenden | zwei sequenzielle Einzelentscheidungen; erste `Dauerhaft übernehmen`, zweite `Nur dieses Training`; beide Protokolltausche bleiben dokumentiert, nur die erste Nachfolgerin wird angelegt | ALL |
| REG-19 | P1 | Report | drei Kennzahlen, Deloadfilter, Bestwert, Zeitraum | FAST |
| REG-20 | P1 | Druck dunkel/hell, Details zu/auf | Titel temporär, Protokoll nur geöffnet, keine abgeschnittenen Seiten | DESK |
| REG-21 | P1 | Block abschließen/Folgeblock | Erfolg einmal; nur aktive Endübungen übernommen; Archiv intakt | FAST |
| REG-22 | P1 | Theme/Version/Archiv | je ein Zugang, korrekte Zurück-Navigation | ALL |
| REG-23 | P1 | PWA offline nach Priming | Shell, Programme, Übungsbibliothek verfügbar | ALL |
| REG-24 | P0 | XSS-Strings in Programm/Übung/Notiz | escaped, kein Script/Event/unerwarteter Request | ALL |
| REG-25 | P1 | KI-Coach UI | Netlify-Aufruf stubben; kein Secret/externes Netz im CI | FAST |
| REG-26 | P0 | Alle P0-Flows | keine unerwarteten `console.error`, `pageerror`, 404 | ALL |
| REG-27 | P0 | Letzter Satz einer Übung und des gesamten Trainings | kompakte Satzpause startet; kein Abschlussmodal gleichzeitig; nach Stop erscheint genau ein Abschlussdialog | ALL |
| REG-28 | P1 | Dead Hang / Zeitübung in Erholungswoche | Haltezeit oder Variante statt kg reduzieren; keine unlogische Gewichtsempfehlung | FAST |
| REG-29 | P1 | Nächste Woche nach fertiger Einheit öffnen | Progressionskarte zeigt Herkunftswoche; Zielwert bleibt fachlich korrekt | ALL |
| REG-30 | P1 | Übung abschließen, nächste öffnen, vorherige einklappen | Viewportanker bleibt stabil; kein harter Sprung zwischen Karten | MOB |
| REG-31 | P0 | Automatische Wiederholungsbereiche im geöffneten Editorabschnitt umschalten | Trainingsgruppe und konkrete Kategorie bleiben geöffnet; Werte werden aktualisiert | ALL |
| REG-32 | P1 | Importvorschau mit intern bereinigbaren Feldern | Bereinigung erfolgt, aber kein sichtbares `Sicher automatisch bereinigt`; Vorschau bleibt verständlich | FAST |

Playwright-Muster für die letzte Satzpause:

```js
await page.locator('#rep-A_0-0').fill('8');

await expect(page.locator('#bar .restbar .subline')).toHaveText(
  'Satzpause'
);
await expect(page.locator('#modal')).toBeHidden();
await expect(page.locator('#app .pausebtn')).toHaveCount(0);

await page.locator('#stopr').click();
await expect(page.locator('#modal .mtitle')).toHaveText(
  'Alle Übungen erledigt 💪'
);
```

Integritätsmuster: Vor und nach jeder Risikoaktion werden relevante Teilbäume verglichen.

```js
const historyBefore = await page.evaluate(() =>
  JSON.parse(JSON.stringify(window.S.history))
);

await page.getByRole('button', {
  name: 'Werte korrigieren',
  exact: true,
}).click();
await expect(page.locator('#modal .mmsg')).toHaveText(
  'Du änderst nur die Satzwerte dieser abgeschlossenen Einheit. Trainingszeit und Protokolleintrag bleiben unverändert. Empfehlungen und Zielwerte späterer Wochen werden nach deiner Korrektur neu berechnet.'
);
await page
  .locator('#modal')
  .getByRole('button', { name: 'Werte korrigieren', exact: true })
  .click();
await page.locator('#rep-A_0-0').fill('9');
await page.getByRole('button', { name: 'Fertig', exact: true }).click();

const historyAfter = await page.evaluate(() =>
  JSON.parse(JSON.stringify(window.S.history))
);
expect(historyAfter).toEqual(historyBefore);
```

## 5. IMPLEMENTIERUNGS-LEITFADEN

### Empfohlene Struktur

Playwright ist als reine Dev-Abhängigkeit installiert. Die statische Produkt-App bleibt ohne Runtime-Abhängigkeit und Build-Schritt; eine CI-Konfiguration ist weiterhin als direkt übernehmbares Beispiel enthalten:

```text
Satzkraft/
├── package.json
├── package-lock.json
├── index.html
├── TESTBACKUP-AUSWERTUNG.json
├── qa/
│   └── playwright/
│       ├── playwright.config.cjs
│       ├── static-server.cjs
│       ├── update.spec.js
│       ├── __screenshots__/
│       │   ├── darwin/
│       │   │   ├── desktop-chromium/
│       │   │   ├── desktop-webkit/
│       │   │   ├── mobile-chromium/
│       │   │   └── mobile-webkit/
│       │   └── linux/           # in der gepinnten CI-Umgebung erzeugen
│       ├── playwright-report/
│       └── test-results/
└── tests/                       # vorhandene node:test-Suite
```

`testDir` zeigt ausschließlich auf `qa/playwright`, damit Playwright die vorhandenen `tests/*.test.cjs` nicht fälschlich einsammelt.

### Aufbau einer `update.spec.js`

Die mitgelieferte Datei enthält die vier zentralen Ebenen:

1. **Arrange:** deterministischen lokalen State vor `page.goto()` setzen.
2. **Act:** nur über sichtbare Nutzeraktionen navigieren.
3. **Assert UI:** exakter Text, Kontext, Anzahl und Screenshot.
4. **Assert Daten:** gezielter Vorher-/Nachher-Vergleich von Logs, History, Workout und Zielen.

```js
const { test, expect } = require('@playwright/test');
const backup = require('../../TESTBACKUP-AUSWERTUNG.json');

async function openWithState(page, source) {
  const state = JSON.parse(JSON.stringify(source));
  state.store[state.active].zonesIntroSeen = true;

  await page.addInitScript(({ state }) => {
    localStorage.clear();
    localStorage.setItem('training-theme-v1', 'dark');
    localStorage.setItem('cali-plan-v3', JSON.stringify(state));
  }, { state });

  await page.goto('/index.html');
}

test('alte Einheit zeigt nur die eindeutige Korrekturaktion', async ({ page }) => {
  await openWithState(page, backup);

  const bar = page.locator('#bar');
  await expect(bar.locator('button')).toHaveCount(1);
  await expect(bar.locator('#correctvalues')).toHaveText('Werte korrigieren');
  await expect(bar).not.toContainText(
    'Diese Einheit ist Teil deines Protokolls'
  );
  await expect(bar.locator('#traintoday')).toHaveCount(0);
  await expect(bar.locator('#startw')).toHaveCount(0);
});
```

Die vollständigen Beispiele in `qa/playwright/update.spec.js` decken bereits ab:

- exakten Intro-Contract und Einmaligkeit;
- die einzige Korrekturaktion in alten abgeschlossenen Einheiten;
- History-invariante Korrektur;
- bewusste Rückfrage bei direkten Satzwertänderungen;
- erweiterte Wiederholen-Warnung;
- Programmbibliotheks-Texte und Ladefehler;
- Autocomplete-Überschreibschutz;
- schlanke Tauschtexte, deduplizierte Vorschläge und sequenzielle Einzelentscheidungen nach Trainingsende;
- die bislang nicht E2E-getestete Mehrtag-Anzeige;
- Screenshots, Overflow und Overlay-Hierarchie;
- doppelte IDs und doppelte Workout-Steuerung;
- einen echten Start-/Eingabe-/Pausen-/Beenden-Kernfluss einschließlich letzter Satzpause;
- den reparierten Calisthenics-Import und stabile Editorabschnitte;
- den offline neu geladenen PWA-Shell samt Programm- und Übungsbibliothek.

Normale Text-, Funktions- und Screenshot-Tests blockieren Service Worker bewusst, damit kein veralteter Cache den Testzustand verfälscht. Der Offline-Test steht deshalb in einem eigenen `test.describe` mit `test.use({ serviceWorkers: 'allow' })`. Chromium prüft nach dem Online-Priming einen echten Offline-Reload. Playwright-WebKit bricht bei dieser Navigation intern ab; dort werden Cache Storage und die weiter bedienbare Offline-Oberfläche direkt geprüft. Ein echter Safari-Offline-Smoke bleibt zusätzlich erforderlich.

### Selektorstrategie

1. Sichtbare fachliche Aktionen: `getByRole(..., { name, exact: true })`.
2. Dynamische Eingabefelder: stabile IDs wie `#rep-A_0-0`.
3. Generierte Listen: vorhandene `data-*`-Attribute.
4. Immer auf `#modal`, `#lib`, `#bar`, `#report` oder eine Übungskarte scopen.
5. Keine zeitbasierten Programm-IDs erraten.
6. Keine Positionsselektoren, wenn eine fachliche ID oder ein Accessible Name existiert.

Aktuelle Accessibility-Risiken, die Playwright sichtbar machen sollte:

- `#modal` und `#lib` besitzen noch kein `role="dialog"`/`aria-modal`.
- Autocomplete besitzt `listbox`/`option`, aber keine vollständige Pfeiltastensteuerung und kein `aria-activedescendant`.
- Escape-Schließen ist nur für die Auswertung klar implementiert.
- Tagesbuttons haben keine eindeutige `aria-current`-/`aria-pressed`-Semantik.

Diese Punkte sind P1-Verbesserungen; Tests sollten sie nicht durch fragile Selektoren verdecken.

### Lokale Terminal-Befehle

Reproduzierbare Einrichtung ab Repositorywurzel; Playwright ist auf dem Prüfgerät bereits mit Node 22 installiert:

```bash
npm ci
npx playwright install chromium webkit
```

`package-lock.json` pinnt `@playwright/test` auf 1.61.0. Produktiv bleibt die App ohne Runtime-Dependency und ohne Build-Schritt.

Vorhandene Unit-Suite:

```bash
npm run test:all:unit
```

Alle Update-E2E-Tests, headless:

```bash
npm run test:all:e2e
```

Nur funktionale Fälle ohne Screenshot-Baselines:

```bash
npm run test:all:e2e:functional
```

Gezielt nach Projekt:

```bash
npx playwright test \
  --config qa/playwright/playwright.config.cjs \
  --project=mobile-webkit
```

Nur Visual-Fälle:

```bash
npm run test:all:e2e:visual
```

Interaktiv beziehungsweise headed:

```bash
npx playwright test \
  --config qa/playwright/playwright.config.cjs \
  --ui

npx playwright test \
  --config qa/playwright/playwright.config.cjs \
  --headed \
  --project=desktop-chromium
```

Baselines einmalig bewusst in derselben OS-/Browserumgebung wie CI erzeugen:

```bash
npm run test:update:visual
```

CI darf Baselines nicht aktualisieren:

```bash
npx playwright test \
  --config qa/playwright/playwright.config.cjs \
  --update-snapshots=none
```

### CI/CD ohne manuelle Laufzeitfreigabe

Vor Aktivierung des Linux-Gates müssen die 20 `linux`-Baselines einmalig im unten gepinnten Container erzeugt, visuell geprüft und committed werden. Der reguläre Workflow vergleicht anschließend ausschließlich und aktualisiert niemals Referenzbilder.

```yaml
name: QA

on:
  push:
  pull_request:

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-24.04
    container:
      image: mcr.microsoft.com/playwright:v1.61.0-noble
      options: --ipc=host
    timeout-minutes: 30
    env:
      CI: "true"

    steps:
      - uses: actions/checkout@v5

      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm

      - name: Dependencies
        run: npm ci

      - name: Unit- und Playwright-Tests
        run: npm run test:all

      - name: Artefakte sichern
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@v5
        with:
          name: playwright-report
          path: |
            qa/playwright/playwright-report/
            qa/playwright/test-results/
          if-no-files-found: ignore
          retention-days: 14
```

Der Workflow läuft bei Push und Pull Request automatisch, headless und ohne GitHub-Environment oder Deployment-Approval. Ein späterer Deploy-Job erhält zwingend `needs: test`.

Offizielle Referenzen:

- [Playwright-Konfiguration und Projekte](https://playwright.dev/docs/test-configuration)
- [Lokaler Webserver über `webServer`](https://playwright.dev/docs/test-webserver)
- [CI-Einrichtung](https://playwright.dev/docs/ci)
- [Browser, WebKit und mobile Emulation](https://playwright.dev/docs/browsers)
- [CLI und Snapshot-Modi](https://playwright.dev/docs/test-cli)

### Release-Gate

Ein Update darf nur freigegeben werden, wenn:

- alle P0- und P1-Tests grün sind;
- `npm run test:all:unit` grün ist;
- Chromium und WebKit auf Desktop und Mobile grün sind;
- keine unerwarteten Console-/Page-Errors auftreten;
- keine nicht geprüfte Screenshot-Differenz existiert;
- kein horizontaler Overflow und keine doppelte Steuerung existieren;
- Backup/Import/Export und Altbestand kompatibel bleiben;
- die Mehrtag-Anzeige nachweislich keinerlei tagübergreifende Progressionsmutation verursacht;
- ein echter iPhone-Smoke erfolgt ist;
- für ein visuelles Linux-CI-Gate geprüfte Linux-Baselines vorliegen;
- OPEN-01 und OPEN-02 entweder entschieden oder als bewusst offene Darstellungs-/Produktfragen dokumentiert sind.
