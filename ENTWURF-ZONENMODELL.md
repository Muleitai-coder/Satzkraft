# ENTWURF · Zonenmodell „Plan · Einheit · Protokoll" (Paket O)

> **Status: ENTWURF – nicht Teil des offiziellen Briefings.** Dieses Dokument hält das am 16./17.07.2026 mit dem Produktverantwortlichen erarbeitete Regelwerk für Lesen, Schreiben und Ändern von Trainingsdaten fest und leitet daraus Arbeitspakete ab. Entscheidungen sind markiert; nach Freigabe wird das Paket als finaler Abschnitt ins `BRIEFING-CODEX.md` übernommen. Nichts hieraus ist umsetzungsreif, bevor die Reihenfolge gegenüber den Paketen L–N entschieden ist.

---

## 1. Ziel & strategischer Rahmen

Satzkraft bekommt ein verbindliches, überall konsistentes Regelwerk dafür, **wer wann was an Trainingsdaten lesen, schreiben und ändern darf**. Heute beantwortet die App diese Fragen an jeder Stelle anders (Wiederholen in jeder Woche möglich, Editor-Änderungen wirken rückwirkend, Löschen vernichtet Historie). Das Zonenmodell löst das mit einem Prinzip, das sich in einem Satz erklären lässt:

> **Satzkraft ist ein Trainingstagebuch: Was trainiert wurde, bleibt stehen. Trainiert wird immer nur vorne. Planänderungen gelten nur für Trainings, die noch kommen.**

**Marktlücke (Recherche 16.07.2026, Strong/Hevy/Liftosaur/Boostcamp/Alpha Progression):** Log-first-Apps (Strong, Hevy) haben perfekte Datensicherheit, aber keine geführte Blockstruktur. Program-first-Apps (Boostcamp, Liftosaur) haben die Struktur, sind aber mitten im Block kaum editierbar oder nur für Experten bedienbar. **Geführter Block mit Phasen + volle Editierbarkeit mitten im Block + Unverlierbarkeits-Garantie – diese Kombination hat keine der verglichenen Apps.** Das Zonenmodell zahlt damit direkt auf die Differenzierungs-Achsen aus Briefing Abschnitt 4 ein (Trainingsintelligenz, lokal ohne Konto, deutsch & laientauglich).

Sichtbare Alleinstellungsmerkmale nach Umsetzung:
1. **Unverlierbarkeits-Garantie:** Keine Planänderung kann trainierte Daten vernichten („Dein Trainingstagebuch kann nicht kaputtgehen").
2. **Übungs-Zeitachse im Plan:** „Kniebeuge – seit Woche 4, davor Beinpresse" direkt am Trainingstag.
3. **Sprechende Absichten statt Edit-Knöpfen:** „Werte korrigieren" / „Training wiederholen" / „Nur heute tauschen" / „Ab jetzt ersetzen" – vier benannte Türen, keine generischen Bearbeiten-Stifte.

---

## 2. Das Regelwerk (nach Freigabe verbindlich)

Drei Schichten, drei Zeitrichtungen:

| Schicht | Was sie ist | Wem sie gehört |
|---|---|---|
| **Protokoll** | Was passiert ist (Werte, Zeiten, damalige Übungen) | der Vergangenheit – unverlierbar |
| **Einheit** | Ein Platz im Raster Woche×Tag, Zustand: offen → aktiv → abgeschlossen | der Gegenwart |
| **Plan** | Was trainiert werden soll (Übungen, Tage, Satzschemata) | der Zukunft |

### A – Protokoll (Vergangenheit)

1. **Unverlierbarkeit.** Keine Planänderung kann trainierte Daten löschen oder umdeuten. Eine ersetzte oder entfernte Übung wird nicht gelöscht, sondern *beendet* – ihre Historie bleibt unter ihrem damaligen Namen sichtbar (Trainingsansicht vergangener Wochen, Auswertung, Langzeit-Vergleich).
2. **Korrigieren ist nicht Wiederholen.** Satzwerte jeder abgeschlossenen Einheit sind jederzeit still korrigierbar – ohne neue Trainingszeit, ohne Änderung an der Historie. Die Struktur der Einheit (welche Übungen, wann trainiert) ist eingefroren.
3. **Abgeschlossen bleibt abgeschlossen.** Vollständigkeit wird beim Beenden festgeschrieben. Keine spätere Planänderung kann einen fertigen Tag rückwirkend „unvollständig" machen, als „übersprungen" melden oder den Blockabschluss blockieren.

### B – Einheit (Gegenwart)

4. **Trainiert wird vorne.** Startbar sind nur: alle Einheiten der aktuellen Woche (Reihenfolge frei) und *leere* Einheiten der direkten Vorwoche (Nachholen). Alles Ältere ist fürs Trainieren gesperrt.
5. **Wiederholen nur zuletzt.** Nur die zuletzt abgeschlossene Einheit lässt sich zurücksetzen und neu trainieren; die neue ersetzt die alte vollständig. Wer weiter zurück will, will in Wahrheit korrigieren (Regel 2) oder neu starten (Folgeblock).
6. **Eine Zelle, eine Wahrheit.** Jede Einheit (Woche×Tag) existiert genau einmal. Kein Duplizieren, kein Anhängen – die Progression braucht pro Zelle genau eine Session.

### C – Plan (Zukunft)

7. **Änderungen gelten ab der nächsten offenen Einheit – je Tag.** Nicht pauschal „ab Woche X": Ist Tag A in der aktuellen Woche schon trainiert, greift eine Änderung an Tag A erst in der Folgewoche; an noch offenem Tag B sofort. Nie rückwirkend.
8. **Tauschen ist zweistufig.** *„Nur heute":* gilt für die eine Einheit, Progression des Originals bleibt unberührt (existiert, Paket K). *„Ab jetzt":* alte Übung endet mit intakter Historie, neue startet ihre eigene Progression bei null.
9. **Struktur folgt denselben Regeln.** Tage hinzufügen, Reihenfolge ändern, Satzschemata anpassen – alles „ab jetzt"; die Vergangenheit zeigt weiter, wie es damals war.

### D – Oberfläche

10. **Jede Aktion sagt, was sie anfasst.** Benannte Absichten mit einem Satz Konsequenz statt generischer Edit-Knöpfe.
11. **Sperren sind Wegweiser.** Ein gesperrter alter Tag graut nicht stumm aus, sondern erklärt sich und bietet die passenden Alternativen an (Werte korrigieren / Inhalt heute trainieren / Folgeblock).
12. **Der Plan zeigt seine Geschichte.** Am Tag sichtbar: „seit Woche 4", aufklappbar „davor: Beinpresse (Woche 1–3)"; vollständige Historie beendeter Übungen in der Auswertung.

---

## 3. Entscheidungen

| # | Frage | Entscheidung |
|---|---|---|
| O-E1 | Nachhol-Fenster: wie weit zurück darf trainiert werden? | **ENTSCHIEDEN 17.07.:** Nur leere Einheiten der direkten Vorwoche (Plan-Position, kein Kalender). Ältere leere Tage bleiben Lücken – wer den Inhalt will, trainiert ihn als aktuellen Tag. |
| O-E2 | Wiederholen einer Einheit, die einen „nur heute"-Tausch enthielt? | **ENTSCHIEDEN 17.07.:** Wiederholung startet mit der Originalübung. Der Tausch ist bewusst flüchtig. |
| O-E3 | Sichtbarkeit beendeter Übungen? | **ENTSCHIEDEN 17.07.:** Aufklappbar an der Übungskarte („seit Woche X / davor …"), vollständig in der Auswertung. Nicht permanent im Weg. |
| O-E4 | Anker für Planänderungen? | **ENTSCHIEDEN 17.07.:** Nächste offene Einheit je Tag (wird beim Speichern je Übung in eine konkrete Wochennummer aufgelöst, siehe O4). |
| O-E5 | Reihenfolge gegenüber Paketen L–N? | **OFFEN:** Entscheidet der Produktverantwortliche. Empfehlung der Architektur: O3 (Einfrieren) und die Dialog-Texte aus O6 sind bugfix-nah und können vorgezogen werden; der Rest als eigenes Release nach klarer Priorisierung. |

---

## 4. Ist-Analyse: Regelwerk vs. Bestand (v0.22.3)

| Regel | Ist-Zustand | Bewertung |
|---|---|---|
| 1 Unverlierbarkeit | `migrateReplaceStore`: gelöschte Übung → Logs werden verworfen; Typ-Änderung → Logs zurückgesetzt | **verletzt** |
| 2 Korrigieren | Gefüllte Satzzeilen sind außerhalb des Trainings editierbar (`renderView`, Zeile ~1372); leere Zeilen gesperrt; keine benannte Aktion, kein Nachtragen vergessener Sätze | **teilweise** |
| 3 Abgeschlossen bleibt | `history[].complete` wird beim Beenden eingefroren, Report nutzt es korrekt; aber `dayComplete`/`skippedBeforeSelection`/Blockabschluss rechnen live gegen die aktuelle Übungsliste → neue Übung macht fertige Tage rückwirkend „unvollständig", Block wird unabschließbar | **verletzt (live-UI)** |
| 4 Trainiert wird vorne | `changeWeek` erlaubt jede Woche; Training in jeder Woche startbar | **fehlt** |
| 5 Wiederholen nur zuletzt | `startWorkout` bietet Wiederholen auf *jedem* abgeschlossenen Tag an | **fehlt** |
| 6 Eine Zelle, eine Wahrheit | `resetDayLogs` + `replaceDayHistory` ersetzen sauber | **erfüllt** |
| 7 Gültig ab nächster offener Einheit | Übungen gelten immer für alle Wochen (Tage sind wochenübergreifend definiert) | **fehlt (Datenmodell)** |
| 8 Tauschen zweistufig | „Nur heute" vorhanden (Paket K, Swap je Zelle, Progression sauber getrennt); „dauerhaft" läuft über Editor-Migration und wirkt rückwirkend (Umbenennung trägt alte Werte auf neue Übung) | **teilweise** |
| 9 Struktur ab jetzt | Editor-Änderungen wirken auf alle Wochen | **fehlt (folgt aus 7)** |
| 10–11 Absichten/Wegweiser | Wiederholen-Dialog vorhanden, warnt aber nicht vor Neuberechnung späterer Empfehlungen; keine Sperr-Erklärungen (es gibt keine Sperren) | **teilweise** |
| 12 Zeitachse | Nicht vorhanden | **fehlt** |

**Wichtig:** Die Progressionslogik selbst (`js/progression.js`, abgeleitete Empfehlungen aus der Wochenkette) bleibt unangetastet – das Zonenmodell filtert nur, *welche Übungen* eine Woche enthält und *wann geschrieben* werden darf. Dass eine wiederholte letzte Einheit die Empfehlungen der Folgewochen neu berechnet, ist erwünschtes Verhalten (abgeleitet statt gespeichert) und wird lediglich im Dialog benannt (O6).

---

## 5. Arbeitspakete

Empfohlene Reihenfolge: **O3 → O1 → O2 → O4 → O5 → O6** (O6-Textbausteine je Paket mitliefern, wo sie hingehören). O3 zuerst, weil es heute reale Fehlzustände erzeugt; O4 ist die größte Änderung und braucht O1–O3 als stabile Basis.

### O1 · Schreibrechte: Trainiert wird vorne

- **Ist:** Jede Woche per `changeWeek` erreichbar, Training/Wiederholen überall startbar. `skippedBeforeSelection` warnt nur.
- **Soll:**
  1. Startbar (Training starten): Einheiten der aktuellen Woche (`S.week`-Vergleich zur höchsten Woche mit Trainingsdaten, siehe 3.) sowie leere Einheiten der Vorwoche.
  2. Wiederholbar: ausschließlich die zuletzt abgeschlossene Einheit (bestimmt über die jüngste `history`-Session mit `complete === true`).
  3. „Aktuelle Woche" ist die höchste Woche, die eine begonnene oder abgeschlossene Einheit enthält (bzw. Woche 1); die Wochen-Navigation bleibt zum *Ansehen* frei.
  4. Gesperrte Tage zeigen statt des Start-Buttons einen Wegweiser (siehe O6): Erklärung + Alternativen.
- **Akzeptanz:** In einem Bestand mit Wochen 1–7 abgeschlossen (Testdaten `TESTBACKUP-AUSWERTUNG.json`) ist in Woche ≤6 kein Training startbar; in Woche 7 ist nur die letzte Einheit wiederholbar; eine leere Einheit in Woche 7 bleibt startbar, wenn Woche 8 die aktuelle ist. `training-flow.test.cjs` erweitert.

### O2 · Benannte Korrektur abgeschlossener Einheiten

- **Ist:** Gefüllte Satzzeilen abgeschlossener Tage sind bereits ohne laufendes Training editierbar, leere Zeilen gesperrt. Es gibt keine sichtbare Aktion dafür; Nutzer entdecken es zufällig oder greifen fälschlich zu „Wiederholen".
- **Soll:**
  1. Abgeschlossene Einheiten erhalten die sichtbare Aktion **„Werte korrigieren"**; sie entsperrt alle Satzzeilen der Einheit (auch leere, um vergessene Sätze nachzutragen).
  2. Korrektur ändert ausschließlich `logs`-Werte: keine neue Trainingszeit, `history` unberührt, kein Neustart von Timern.
  3. Kurzer Hinweis beim Einstieg: „Du bearbeitest dein Protokoll. Empfehlungen späterer Wochen rechnen mit den neuen Werten."
- **Akzeptanz:** Korrektur in Woche 1 ändert `logs`, lässt `history` byte-identisch und erzeugt keine Workout-Session; nachgetragener Satz macht die Einheit ggf. vollständig (mit O3 verträglich). Neue Testfälle in `training-flow.test.cjs`.

### O3 · Abgeschlossen bleibt abgeschlossen (Einfrieren der Vollständigkeit)

- **Ist:** `dayComplete()`/`weekFrac()`/`skippedBeforeSelection()` und der Blockabschluss (`Zeile ~1100`) rechnen live gegen die aktuelle Übungsliste. Eine im Editor ergänzte Übung macht fertige Wochen rückwirkend „unvollständig" und den Block unabschließbar. Der Report nutzt bereits korrekt das eingefrorene `history[].complete`.
- **Soll:** Für Einheiten mit abgeschlossener Session (`history`-Eintrag `complete === true`) gilt dieser Zustand als Wahrheit – in Tagesanzeige, Wochenübersicht, Verpasst-Warnung und Blockabschluss. Live gerechnet wird nur für Einheiten ohne abgeschlossene Session.
- **Akzeptanz:** Testfall: Block mit abgeschlossenen Wochen 1–3, dann Übung ergänzt → Wochen 1–3 bleiben vollständig, keine Verpasst-Warnung, Blockabschluss weiterhin erreichbar, sobald alle Einheiten je einmal abgeschlossen sind. `block-lifecycle.test.cjs` erweitert.

### O4 · Gültig-ab-Einheit: zeitlich begrenzte Übungen (Kern des Modells)

- **Ist:** Übungen gelten implizit für alle Wochen. Dauerhafter Tausch und Editor-Änderungen wirken rückwirkend; Löschen verwirft Logs (Verstoß gegen Regel 1).
- **Soll:**
  1. **Datenmodell:** Übungen erhalten zwei optionale, abwärtskompatible Felder `fromWeek` und `untilWeek` (fehlend = gilt immer; Format `trainings-block` v2 bleibt gültig, `DATA_SCHEMA_VERSION` bleibt 4, alte Programme/Backups laden unverändert).
  2. **Anzeige/Logik je Woche w:** Ein Tag enthält die Übungen mit `fromWeek ≤ w ≤ untilWeek`. Alle bestehenden Funktionen (Rendern, `dayComplete`, Progression, Report) arbeiten auf der gefilterten Liste; `js/progression.js` bleibt unverändert.
  3. **Editor-Speichern aufs aktive Programm:** Statt der bisherigen Ersetz-Migration wird je geändertem Tag der Anker „nächste offene Einheit" als Wochennummer W aufgelöst (Tag in aktueller Woche schon abgeschlossen → W = Folgewoche, sonst W = aktuelle Woche). Entfernte oder im Typ geänderte Übungen bekommen `untilWeek = W−1` (Logs bleiben!), neue/ersetzende Übungen `fromWeek = W`. Reine Umbenennung ohne Typänderung bleibt dieselbe Übung (Werte behalten). „Als Kopie speichern" bleibt unverändert (neues Programm, kein Anker nötig).
  4. **Dauerhafter Tausch (Paket K):** läuft über denselben Mechanismus – Original endet, Ersatz beginnt; bereits getauschte Zellen der neuen Übung werden wie bisher zu regulärer Historie.
  5. **Editor-Nachfrage bei starker Namensänderung** (Regel-1-Absicherung): „Gleiche Übung, nur umbenannt (Werte behalten) – oder andere Übung (alte endet, neue beginnt)?"
- **Akzeptanz:** Nach „Beinpresse → Kniebeuge ab Woche 4": Wochen 1–3 zeigen Beinpresse mit allen Werten, Woche 4+ Kniebeuge ohne Vorwerte; Auswertung führt beide; Export/Reimport verlustfrei; altes Programm ohne die Felder lädt identisch. `editor-replace-migration.test.cjs` wird zum zentralen Testort umgebaut, `program-validation.test.cjs` um die Felder erweitert.

### O5 · Übungs-Zeitachse sichtbar

- **Ist:** Nicht vorhanden.
- **Soll:** Übungskarten mit `fromWeek > 1` zeigen dezent „seit Woche X", aufklappbar mit Vorgänger („davor: Beinpresse · Woche 1–3") inkl. Sprung zur Historie. Auswertung listet beendete Übungen vollständig (eigene Karte, Zeitraum im Titel). Trainingsansicht vergangener Wochen zeigt automatisch die damals gültigen Übungen (folgt aus O4).
- **Akzeptanz:** Szenario aus O4 zeigt die Kennzeichnung an der Kniebeuge-Karte und die Beinpresse-Karte in der Auswertung mit Zeitraum „Woche 1–3".

### O6 · Sprechende Absichten & Wegweiser (Texte, Du-Form)

- **Ist:** Wiederholen-Dialog warnt nur vor dem Leeren des Tages; keine Sperr-Erklärungen; generische Editor-Semantik.
- **Soll:**
  1. Wiederholen-Dialog ergänzt, falls spätere Wochen Daten haben: „Empfehlungen der folgenden Wochen werden aus den neuen Werten neu berechnet. Deine eingetragenen Werte bleiben unverändert."
  2. Gesperrte alte Einheit (O1): „Diese Einheit ist Teil deines Protokolls." + Aktionen **„Werte korrigieren"**, **„Diesen Inhalt heute trainieren"** (wechselt zur aktuellen Woche, gleicher Tag), bei Wunsch nach Neustart Hinweis auf den Folgeblock.
  3. Durchgängige Benennung der vier Absichten in allen Dialogen/Buttons: „Werte korrigieren", „Training wiederholen (ersetzt die letzte Einheit)", „Übung nur heute tauschen", „Ab jetzt ersetzen".
- **Akzeptanz:** Alle vier Formulierungen kommen im Quelltext vor; kein generischer „Bearbeiten"-Einstieg für Protokoll-Aktionen; `ui-feedback-regressions.test.cjs` erweitert.

---

## 6. Nicht-Ziele (bewusst ausgeschlossen)

- **Kein chronologisches Journal / Append-only-Umbau** à la Strong/Hevy. Das Zellenmodell (Woche×Tag) bleibt; es ist die Grundlage der abgeleiteten Progression.
- **Keine Kalender-Semantik.** Wochen bleiben Plan-Positionen, die der Nutzer selbst weiterschaltet; kein Datum-Zwang, keine „verpasste Woche"-Automatik.
- **Keine Mehrfach-Sessions pro Zelle**, keine Einheiten-Duplikate, kein freies Nachtrainieren beliebig alter Wochen.
- **Keine Änderung an `js/progression.js`** und keine neue Progressions-Mechanik.

## 7. Guardrail-Check (Briefing Abschnitt 2)

- Ein-Datei-Architektur, ES5-Stil, `esc()`/`attr()`: unberührt, alle Änderungen in `index.html`.
- Datenkompatibilität: `cali-plan-v3` und `DATA_SCHEMA_VERSION` 4 bleiben; `fromWeek`/`untilWeek` sind optionale Felder im bestehenden Format v2 (Guardrail 4 konform, alte Backups laden).
- `js/progression.js`: unverändert (Zonenmodell filtert Eingaben, ändert keine Berechnung).
- Test-Anker: bleiben erhalten; betroffene Tests werden erweitert, nicht gelöscht.
- Manuelle Prüfbasis: `TESTBACKUP-AUSWERTUNG.json` (Wochen 1–7 abgeschlossen, Woche 8 offen) deckt alle Zonen-Szenarien ab; `TESTPROGRAMM-ALLE-SZENARIEN.json` für Editor-Fälle.
