# Großes Update: Releases 1–4 (Spezifikation und Entscheidungsverlauf)

> **Status: UMGESETZT mit v0.26.0.** Dieses Dokument bewahrt Spezifikation und Entscheidungsverlauf der Releases 1–4. Aktuelle Produktregeln stehen in `BRIEFING-CODEX.md`. Paket N bleibt ausgeklammert; Abschnitt 6 dokumentiert nur die Vorentscheidung.

**Strategischer Rahmen:** Alle vier Pakete vertiefen die Differenzierungs-Achsen (Trainingsintelligenz, „Bring your own AI", lokal ohne Konto/Abo, deutsch & laientauglich). Die Nicht-Ziele aus Briefing Abschnitt 4 bleiben unangetastet. Der langfristige `docs/planung/AUSBAUPLAN.md` (Konten/Cloud/Desktop) ist von diesem Update unabhängig und bleibt unberührt.

---

## 1. Gesamt-Reihenfolge und Release-Schnitt

**ENTSCHIEDEN 17.07.2026 (GF-1/GF-2):**

| Schritt | Release | Inhalt | Begründung |
|---|---|---|---|
| 1 | O-Fix | O3 (Vollständigkeit einfrieren) + O6-Dialogtexte | Bugfix-nah: Editor-Änderungen können heute fertige Wochen rückwirkend „unvollständig" machen und den Blockabschluss verhindern. Schützt alles Folgende. |
| 2 | L | Programm-Bibliothek | Praktisch fertig vorbereitet (nur Studio-Abnahme offen), größter Nutzerwert pro Aufwand, unabhängig von O4. Muss nach Schritt 1 kommen, weil L neue Nutzer bringt, die Programme sofort bearbeiten. |
| 3 | O-Kern | O1, O2, O4, O5, Rest O6 | Fundament für M und N (O4 baut den Editor-Übernahme-Pfad und das Übungs-Lebenszyklus-Modell um). Je später, desto mehr Nutzerdaten entstehen im alten, verlustbehafteten Modell. |
| 4 | M | Übungs-Bibliothek light | Greift in die neuen O-Mechanismen (Tauschvorschläge münden in „Ab jetzt ersetzen", DE/EN-Namen speisen Zeitachse und Langzeit-Matching). Recherche-Vorarbeit läuft parallel ab Schritt 2–3. |
| – | N | KI-Coach 2.0 Blockbegleitung | **AUSGEKLAMMERT 17.07.:** Nicht Teil dieses Updates. Start erst nach Abschluss der Releases 1–4 und nach dem eigenen BYO-AI-Konzept-Termin (NF-1). Der Rahmen (Abschnitt 6) bleibt als Vorentscheidung dokumentiert. |

Das Update umfasst damit verbindlich die **Releases 1–4**. Jedes Release einzeln mit eigenen Feedback-IDs und Abnahme nach Briefing Abschnitt 6/10.

## 2. Abhängigkeiten zwischen den Paketen

| Abhängigkeit | Art | Konsequenz |
|---|---|---|
| N → O4 | **hart** | Der Übernahme-Pfad für Coach-Anpassungen muss die Gültig-ab-Mechanik nutzen; nur sie erzwingt „bereits trainierte Wochen bleiben unverändert" (N-E3) im Datenmodell. Der im N-Entwurf genannte H-Pfad (`migrateReplaceStore`) wird durch O4 umgebaut → N nie vor O-Kern bauen (NF-2). |
| N → M | weich | Stabile DE/EN-Namen und Aliasse machen die JSON-Runde Coach ↔ App robust (Übungen wiedererkennen statt Neuanlage). |
| M → O4/O8 | weich | Das Feld „passende Ersatzübung" der Bibliothek mündet direkt in „Ab jetzt ersetzen"; Tauschvorschläge nutzen den zweistufigen Tausch (Regel 8). |
| M → K1/J4 | vorhanden | Tauschvorschläge (Paket K) und Langzeit-Matching per Alias (J4) sind bestehende Andockpunkte. |
| L → O3 | weich (Reihenfolge) | L-Programme sind „frei bearbeitbar"; neue Nutzer sollen beim ersten Editieren nicht in den O3-Fehlzustand laufen. |
| L ⊥ O4 | keine | Bibliotheksprogramme starten frisch; Gültig-ab-Felder sind dort nie gesetzt. |
| O intern | fest | O3 → O1 → O2 → O4 → O5 → O6 (O6-Textbausteine je Paket dort mitliefern, wo sie hingehören). |
| Alle | Prozess | Vor jeder Feinspezifikation Abgleich mit dem dann aktuellen Codestand (Pakete I–K verändern Editor, Store und Trainingsansicht). |

---

## 3. Paket O – Zonenmodell „Plan · Einheit · Protokoll"

### Ziel & Nutzen

Satzkraft bekommt ein verbindliches, überall konsistentes Regelwerk dafür, wer wann was an Trainingsdaten **lesen, schreiben und ändern** darf. Heute beantwortet die App das an jeder Stelle anders (Wiederholen in jeder Woche möglich, Editor-Änderungen wirken rückwirkend, Löschen vernichtet Historie). Kernprinzip in einem Satz:

> **Satzkraft ist ein Trainingstagebuch: Was trainiert wurde, bleibt stehen. Trainiert wird immer nur vorne. Planänderungen gelten nur für Trainings, die noch kommen.**

**Marktlücke (Recherche 16.07.2026, Strong/Hevy/Liftosaur/Boostcamp/Alpha Progression):** Log-first-Apps (Strong, Hevy) haben perfekte Datensicherheit, aber keine geführte Blockstruktur. Program-first-Apps (Boostcamp, Liftosaur) haben die Struktur, sind aber mitten im Block kaum editierbar oder nur für Experten bedienbar. Geführter Block mit Phasen + volle Editierbarkeit mitten im Block + Unverlierbarkeits-Garantie – diese Kombination hat keine der verglichenen Apps.

Sichtbare Alleinstellungsmerkmale nach Umsetzung:
1. **Unverlierbarkeits-Garantie:** Keine Planänderung kann trainierte Daten vernichten („Dein Trainingstagebuch kann nicht kaputtgehen").
2. **Übungs-Zeitachse im Plan:** „Kniebeuge – seit Woche 4, davor Beinpresse" direkt am Trainingstag.
3. **Sprechende Absichten statt Edit-Knöpfen:** „Werte korrigieren" / „Training wiederholen" / „Nur heute tauschen" / „Ab jetzt ersetzen".

### Das Regelwerk (nach Freigabe verbindlich)

Drei Schichten, drei Zeitrichtungen:

| Schicht | Was sie ist | Wem sie gehört |
|---|---|---|
| **Protokoll** | Was passiert ist (Werte, Zeiten, damalige Übungen) | der Vergangenheit – unverlierbar |
| **Einheit** | Ein Platz im Raster Woche×Tag, Zustand: offen → aktiv → abgeschlossen | der Gegenwart |
| **Plan** | Was trainiert werden soll (Übungen, Tage, Satzschemata) | der Zukunft |

**A – Protokoll (Vergangenheit)**
1. **Unverlierbarkeit.** Keine Planänderung kann trainierte Daten löschen oder umdeuten. Eine ersetzte oder entfernte Übung wird nicht gelöscht, sondern *beendet* – ihre Historie bleibt unter ihrem damaligen Namen sichtbar.
2. **Korrigieren ist nicht Wiederholen.** Satzwerte jeder abgeschlossenen Einheit sind jederzeit still korrigierbar – ohne neue Trainingszeit, ohne Änderung an der Historie. Die Struktur der Einheit ist eingefroren.
3. **Abgeschlossen bleibt abgeschlossen.** Vollständigkeit wird beim Beenden festgeschrieben. Keine spätere Planänderung kann einen fertigen Tag rückwirkend „unvollständig" machen oder den Blockabschluss blockieren.

**B – Einheit (Gegenwart)**
4. **Trainiert wird vorne.** Startbar sind nur: alle Einheiten der aktuellen Woche (Reihenfolge frei) und *leere* Einheiten der direkten Vorwoche (Nachholen). Alles Ältere ist fürs Trainieren gesperrt.
5. **Wiederholen nur zuletzt.** Nur die zuletzt abgeschlossene Einheit lässt sich zurücksetzen und neu trainieren; die neue ersetzt die alte vollständig.
6. **Eine Zelle, eine Wahrheit.** Jede Einheit (Woche×Tag) existiert genau einmal. Kein Duplizieren, kein Anhängen.

**C – Plan (Zukunft)**
7. **Änderungen gelten ab der nächsten offenen Einheit – je Tag.** Ist Tag A in der aktuellen Woche schon trainiert, greift eine Änderung an Tag A erst in der Folgewoche; an noch offenem Tag B sofort. Nie rückwirkend.
8. **Tauschen ist zweistufig.** *„Nur heute":* gilt für die eine Einheit, Progression des Originals bleibt unberührt (existiert, Paket K). *„Ab jetzt":* alte Übung endet mit intakter Historie, neue startet ihre eigene Progression bei null.
9. **Struktur folgt denselben Regeln.** Tage, Reihenfolge, Satzschemata – alles „ab jetzt".

**D – Oberfläche**
10. **Jede Aktion sagt, was sie anfasst.** Benannte Absichten mit einem Satz Konsequenz statt generischer Edit-Knöpfe.
11. **Sperren sind Wegweiser.** Ein gesperrter alter Tag erklärt sich und bietet die passenden Alternativen an (Werte korrigieren / Inhalt heute trainieren / Folgeblock).
12. **Der Plan zeigt seine Geschichte.** Am Tag: „seit Woche 4", aufklappbar „davor: Beinpresse (Woche 1–3)"; vollständige Historie beendeter Übungen in der Auswertung.

### Entscheidungen

| # | Frage | Entscheidung |
|---|---|---|
| O-E1 | Nachhol-Fenster: wie weit zurück darf trainiert werden? | **ENTSCHIEDEN 17.07.:** Nur leere Einheiten der direkten Vorwoche (Plan-Position, kein Kalender). Ältere leere Tage bleiben Lücken. |
| O-E2 | Wiederholen einer Einheit mit „nur heute"-Tausch? | **ENTSCHIEDEN 17.07.:** Wiederholung startet mit der Originalübung. Der Tausch ist bewusst flüchtig. |
| O-E3 | Sichtbarkeit beendeter Übungen? | **ENTSCHIEDEN 17.07.:** Aufklappbar an der Übungskarte, vollständig in der Auswertung. Nicht permanent im Weg. |
| O-E4 | Anker für Planänderungen? | **ENTSCHIEDEN 17.07.:** Nächste offene Einheit je Tag (wird beim Speichern je Übung in eine konkrete Wochennummer aufgelöst, siehe O4). |
| O-E5 | Reihenfolge gegenüber L–N? | **Ersetzt durch GF-1** (Abschnitt 1/8). |

### Ist-Analyse: Regelwerk vs. Bestand (v0.22.3)

| Regel | Ist-Zustand | Bewertung |
|---|---|---|
| 1 Unverlierbarkeit | `migrateReplaceStore`: gelöschte Übung → Logs verworfen; Typ-Änderung → Logs zurückgesetzt | **verletzt** |
| 2 Korrigieren | Gefüllte Satzzeilen sind außerhalb des Trainings editierbar (`renderView`, ~Zeile 1372); leere gesperrt; keine benannte Aktion | **teilweise** |
| 3 Abgeschlossen bleibt | `history[].complete` wird eingefroren, Report nutzt es korrekt; aber `dayComplete`/`skippedBeforeSelection`/Blockabschluss rechnen live gegen die aktuelle Übungsliste | **verletzt (live-UI)** |
| 4 Trainiert wird vorne | `changeWeek` erlaubt jede Woche; Training überall startbar | **fehlt** |
| 5 Wiederholen nur zuletzt | `startWorkout` bietet Wiederholen auf jedem abgeschlossenen Tag an | **fehlt** |
| 6 Eine Zelle, eine Wahrheit | `resetDayLogs` + `replaceDayHistory` ersetzen sauber | **erfüllt** |
| 7 Gültig ab nächster offener Einheit | Übungen gelten immer für alle Wochen | **fehlt (Datenmodell)** |
| 8 Tauschen zweistufig | „Nur heute" vorhanden (Paket K); „dauerhaft" wirkt rückwirkend über Editor-Migration | **teilweise** |
| 9 Struktur ab jetzt | Editor wirkt auf alle Wochen | **fehlt (folgt aus 7)** |
| 10–11 Absichten/Wegweiser | Wiederholen-Dialog warnt nicht vor Neuberechnung späterer Empfehlungen; keine Sperr-Erklärungen | **teilweise** |
| 12 Zeitachse | Nicht vorhanden | **fehlt** |

**Wichtig:** `js/progression.js` und die abgeleiteten Empfehlungen bleiben unangetastet – das Zonenmodell filtert nur, welche Übungen eine Woche enthält und wann geschrieben werden darf. Dass eine wiederholte letzte Einheit die Empfehlungen der Folgewochen neu berechnet, ist erwünscht (abgeleitet statt gespeichert) und wird lediglich im Dialog benannt (O6).

### Arbeitspakete (Reihenfolge O3 → O1 → O2 → O4 → O5 → O6)

#### O1 · Schreibrechte: Trainiert wird vorne
- **Ist:** Jede Woche per `changeWeek` erreichbar, Training/Wiederholen überall startbar. `skippedBeforeSelection` warnt nur.
- **Soll:**
  1. Startbar: Einheiten der aktuellen Woche sowie leere Einheiten der Vorwoche.
  2. Wiederholbar: ausschließlich die zuletzt abgeschlossene Einheit (jüngste `history`-Session mit `complete === true`).
  3. „Aktuelle Woche" wird automatisch abgeleitet (ENTSCHIEDEN 17.07., OF-1): höchste Woche mit begonnener oder abgeschlossener Einheit; sind dort alle Einheiten abgeschlossen, rückt die Folgewoche nach (bis zur Blocklänge); ohne Trainingsdaten Woche 1. Wochen-Navigation bleibt zum Ansehen frei.
  4. Gesperrte Tage zeigen statt des Start-Buttons einen Wegweiser (O6).
- **Akzeptanz:** Mit `TESTBACKUP-AUSWERTUNG.json` (Wochen 1–7 abgeschlossen): in Woche ≤6 kein Training startbar; in Woche 7 nur die letzte Einheit wiederholbar; leere Einheit der Woche 7 bleibt startbar, wenn Woche 8 aktuell ist. `training-flow.test.cjs` erweitert.

#### O2 · Benannte Korrektur abgeschlossener Einheiten
- **Ist:** Gefüllte Satzzeilen abgeschlossener Tage sind bereits ohne Training editierbar, leere gesperrt; keine sichtbare Aktion dafür.
- **Soll:**
  1. Abgeschlossene Einheiten erhalten die sichtbare Aktion **„Werte korrigieren"**; entsperrt alle Satzzeilen der Einheit (auch leere, für vergessene Sätze). UI-Ort: **OF-2**.
  2. Korrektur ändert ausschließlich `logs`-Werte: keine neue Trainingszeit, `history` unberührt, keine Timer.
  3. Hinweis beim Einstieg: „Du bearbeitest dein Protokoll. Empfehlungen späterer Wochen rechnen mit den neuen Werten."
- **Akzeptanz:** Korrektur in Woche 1 ändert `logs`, lässt `history` unverändert, erzeugt keine Session; nachgetragener Satz macht die Einheit ggf. vollständig (mit O3 verträglich). Tests in `training-flow.test.cjs`.

#### O3 · Abgeschlossen bleibt abgeschlossen (Einfrieren der Vollständigkeit)
- **Ist:** `dayComplete()`/`weekFrac()`/`skippedBeforeSelection()` und Blockabschluss (~Zeile 1100) rechnen live gegen die aktuelle Übungsliste. Ergänzte Übung macht fertige Wochen rückwirkend „unvollständig", Block unabschließbar. Report nutzt bereits korrekt `history[].complete`.
- **Soll:** Für Einheiten mit `history`-Eintrag `complete === true` gilt dieser Zustand als Wahrheit – in Tagesanzeige, Wochenübersicht, Verpasst-Warnung und Blockabschluss. Live gerechnet wird nur für Einheiten ohne abgeschlossene Session.
- **Akzeptanz:** Block mit abgeschlossenen Wochen 1–3, Übung ergänzt → Wochen 1–3 bleiben vollständig, keine Verpasst-Warnung, Blockabschluss erreichbar. `block-lifecycle.test.cjs` erweitert.

#### O4 · Gültig-ab-Einheit: zeitlich begrenzte Übungen (Kern des Modells)
- **Ist:** Übungen gelten implizit für alle Wochen. Dauerhafter Tausch und Editor-Änderungen wirken rückwirkend; Löschen verwirft Logs.
- **Soll:**
  1. **Datenmodell:** Übungen erhalten optionale, abwärtskompatible Felder `fromWeek`/`untilWeek` (fehlend = gilt immer; Format `trainings-block` v2 bleibt gültig, `DATA_SCHEMA_VERSION` bleibt 4, alte Programme/Backups laden unverändert).
  2. **Anzeige/Logik je Woche w:** Ein Tag enthält die Übungen mit `fromWeek ≤ w ≤ untilWeek`. Alle Funktionen (Rendern, `dayComplete`, Progression, Report) arbeiten auf der gefilterten Liste; `js/progression.js` unverändert.
  3. **Editor-Speichern aufs aktive Programm:** je geändertem Tag wird der Anker „nächste offene Einheit" als Wochennummer W aufgelöst (Tag in aktueller Woche abgeschlossen → W = Folgewoche, sonst W = aktuelle Woche). Entfernte oder im Typ geänderte Übungen: `untilWeek = W−1` (Logs bleiben!). Neue/ersetzende Übungen: `fromWeek = W`. Reine Umbenennung ohne Typänderung bleibt dieselbe Übung. „Als Kopie speichern" unverändert.
  4. **Dauerhafter Tausch (Paket K):** läuft über denselben Mechanismus – Original endet, Ersatz beginnt; bereits getauschte Zellen werden wie bisher zu regulärer Historie.
  5. **Editor-Nachfrage bei Namensänderung** (Regel-1-Absicherung): „Gleiche Übung, nur umbenannt (Werte behalten) – oder andere Übung (alte endet, neue beginnt)?" Schwelle: **OF-3**.
- **Akzeptanz:** Nach „Beinpresse → Kniebeuge ab Woche 4": Wochen 1–3 zeigen Beinpresse mit allen Werten, Woche 4+ Kniebeuge ohne Vorwerte; Auswertung führt beide; Export/Reimport verlustfrei; altes Programm ohne Felder lädt identisch. `editor-replace-migration.test.cjs` umgebaut, `program-validation.test.cjs` erweitert.

#### O5 · Übungs-Zeitachse sichtbar
- **Soll:** Übungskarten mit `fromWeek > 1` zeigen dezent „seit Woche X", aufklappbar mit Vorgänger („davor: Beinpresse · Woche 1–3"). Auswertung listet beendete Übungen vollständig (Zeitraum im Titel). Vergangene Wochen zeigen automatisch die damals gültigen Übungen (folgt aus O4).
- **Akzeptanz:** Szenario aus O4 zeigt Kennzeichnung an der Kniebeuge-Karte und die Beinpresse-Karte in der Auswertung mit „Woche 1–3".

#### O6 · Sprechende Absichten & Wegweiser (Texte, Du-Form)
- **Soll:**
  1. Wiederholen-Dialog ergänzt, falls spätere Wochen Daten haben: „Empfehlungen der folgenden Wochen werden aus den neuen Werten neu berechnet. Deine eingetragenen Werte bleiben unverändert."
  2. Gesperrte alte Einheit: „Diese Einheit ist Teil deines Protokolls." + Aktionen „Werte korrigieren", „Diesen Inhalt heute trainieren" (wechselt zur aktuellen Woche, gleicher Tag), Hinweis auf Folgeblock.
  3. Durchgängige Benennung: „Werte korrigieren", „Training wiederholen (ersetzt die letzte Einheit)", „Übung nur heute tauschen", „Ab jetzt ersetzen".
  4. **Einmalige Hinweis-Box nach dem O-Kern-Update** (GF-3/GF-3a, Wortlaut ENTSCHIEDEN 17.07., erscheint einmal beim ersten Öffnen, Satzkraft-Modal-Optik):
     - Titel: „Neu: Dein Trainingstagebuch ist geschützt"
     - Untertitel: „Mit diesem Update passt Satzkraft besser auf deine Trainingsdaten auf."
     - Punkt 1 (Schloss-Symbol): „Abgeschlossene Trainings bleiben genau so, wie du sie trainiert hast."
     - Punkt 2 (Stift-Symbol): „Zahlen ausbessern geht weiterhin jederzeit – über ‚Werte korrigieren'."
     - Punkt 3 (Play-Symbol): „Trainiert und wiederholt wird vorne – in deiner aktuellen Woche, Nachholen aus der Vorwoche inklusive."
     - Schlusszeile: „Änderungen an deinem Plan gelten ab jetzt und lassen Vergangenes unverändert. Alles andere bleibt, wie du es kennst."
     - Button: „Verstanden"
- **Akzeptanz:** Alle vier Formulierungen im Quelltext; kein generischer „Bearbeiten"-Einstieg für Protokoll-Aktionen; Hinweis-Box erscheint genau einmal (Flag im Store); `ui-feedback-regressions.test.cjs` erweitert.

### Nicht-Ziele von O
- Kein chronologisches Journal / Append-only-Umbau; das Zellenmodell (Woche×Tag) bleibt.
- Keine Kalender-Semantik; Wochen bleiben Plan-Positionen.
- Keine Mehrfach-Sessions pro Zelle, keine Duplikate.
- Keine Änderung an `js/progression.js`.

### Feinspezifikation Release 1 „O-Fix" (O3 + erweiterte Wiederholen-Warnung aus O6)

**Stand 17.07.2026, abgeglichen mit v0.22.3. UMSETZUNG FREIGEGEBEN durch den Produktverantwortlichen am 17.07.2026 (im Chat), inklusive der Präzisierung der Warnbedingung in F2.3.** Alle Zeilenangaben beziehen sich auf `index.html` dieses Stands. Umfang: O3 vollständig plus O6 Punkt 1 (Wiederholen-Dialog). **Nicht enthalten:** O1-Sperren (Wiederholen bleibt in jeder Woche möglich), O2 „Werte korrigieren", O4/O5, Wegweiser- und Hinweis-Box-Texte aus O6. Keine neuen Datenfelder, keine Migration: O3 **liest ausschließlich** das vorhandene `history[].complete`; `DATA_SCHEMA_VERSION` bleibt 4, Austauschformat v2 unverändert.

#### F1 · Codestand-Abgleich (v0.22.3)

| Funktion (Zeile) | Ist-Verhalten | O-Fix |
|---|---|---|
| `cellComplete` (1149) | Live je Übung/Woche gegen `setsForExercise` und `S.logs` | **unverändert** – Progression (`nextWeight` 1189, `sessionFor`, `priorSessions`) liest bewusst live |
| `dayComplete` (1231) | Live: `day.ex.every(cellComplete)` gegen die aktuelle Übungsliste | **bleibt als Live-Funktion bestehen** (liefert beim Beenden den Einfrier-Wert); Aufrufer wechseln teilweise auf `unitComplete` (F2) |
| `weekFrac` (1230) | Live-Anteil je Woche über alle Tage/Übungen (Wochenbalken 1387, `updateProgressUI` 1408) | wird einfrier-bewusst (F3.1) |
| `dayStatus` (1078) | Live-Häkchen im Wochenstreifen (1392) | wird einfrier-bewusst (F3.2) |
| `skippedBeforeSelection` (1255) | Verpasst-Warnung live über `dayComplete` | wechselt auf `unitComplete` (F3.3) |
| `programBlockComplete` (1099) | Pure Funktion `(program, logs)`, live über alle Wochen×Tage×Übungen; Aufrufer: `maybeShowBlockSuccess` (1811), `createFollowupBlock` (2806), Abgeschlossen-Badge in `renderLib` (2812) | erhält optionalen dritten Parameter `history` (F3.8) |
| `stopWorkout` (1721, Test-Anker) | Schreibt via `replaceDayHistory` den Eintrag mit `complete: dayComplete(sessionWeek, sessionDay)` – der Einfrier-Moment | **unverändert**, ausdrücklich live (F4c) |
| `startWorkout` (1669) | Wiederholen-Dialog bei `dayComplete`, danach Verpasst-Warnung | `unitComplete` + erweiterter Dialogtext (F3.4, F5) |
| `beginWorkout` (1657) / `renderBar` (1748) | Modus-Ableitung bzw. Button-Beschriftung „wiederholen/fortsetzen/starten" über `dayComplete` | wechseln auf `unitComplete` (F3.5, F3.6) |
| `workoutProgress` (1716, Test-Anker) | Live-Zusammenfassung im Beenden-Dialog | **unverändert** – im laufenden Training ist live korrekt |
| `buildReportData` (1785) | Nutzt bereits `entry.complete === true` für `completeKeys`/Wochenraster | **unverändert** – bereits O3-konform |
| Backup-Validierung (2090) | Toleriert `complete == null` | **unverändert** (Grundlage für F4b) |

#### F2 · Neue Funktionen

Referenzimplementierungen – verbindlich im Verhalten, Formulierung darf abweichen. ES5, keine Test-Anker-Namen betroffen (Einfügungen ändern die relative Anker-Reihenfolge nicht).

1. **`historyMarksComplete(history, w, dk)`** – pure, einziger Ort der Einfrier-Wahrheit; direkt bei `dayWasInterrupted` (~1237) einfügen:
   ```js
   function historyMarksComplete(history,w,dk){
    if(!Array.isArray(history))return false;
    return history.some(function(e){return !!e&&e.week===w&&e.day===dk&&e.complete===true;});
   }
   ```
2. **`unitComplete(w, dk)`** – die O3-Wahrheit für das aktive Programm: eingefroren **oder** live vollständig:
   ```js
   function unitComplete(w,dk){return historyMarksComplete(S.history,w,dk)||dayComplete(w,dk);}
   ```
3. **`laterWeeksHaveData(w, dk)`** – Bedingung für die erweiterte Wiederholen-Warnung; direkt vor `startWorkout` einfügen:
   ```js
   function laterWeeksHaveData(w,dk){
    for(var key in S.logs){
     var parts=key.split("|");
     if(Number(parts[0])<=w||parts[1]!==dk)continue;
     var c=S.logs[key];if(!c||normalizeSwapName(c.swap)||!Array.isArray(c.sets))continue;
     for(var i=0;i<c.sets.length;i++){var s=c.sets[i];if(s&&s.reps!==""&&s.reps!=null)return true;}
    }
    return false;
   }
   ```
   **Präzisierung gegenüber O6 Punkt 1 („falls spätere Wochen Daten haben"):** Gezählt werden nur spätere Wochen **desselben Tages (`dk`)** mit mindestens einem eingetragenen Wiederholungs-/Zeitwert in nicht getauschten Zellen – exakt die Daten, aus denen `priorSessions` Empfehlungen ableitet. Daten anderer Wochentage sind von einer Wiederholung nicht betroffen; die Warnung erschiene dort grundlos. Getauschte Zellen (`swap`) fließen nicht in die Progression ein und zählen deshalb nicht.

#### F3 · Änderungen an bestehenden Funktionen

1. **`weekFrac(w)`** – je Tag zuerst Einfrier-Prüfung; eingefrorene Tage zählen mit allen aktuell geplanten Übungen als erledigt:
   ```js
   function weekFrac(w){
    var d=0,t=0,ds=PROG().days;
    for(var a=0;a<ds.length;a++){
     var n=ds[a].ex.length;t+=n;
     if(historyMarksComplete(S.history,w,ds[a].key)){d+=n;continue;}
     for(var i=0;i<n;i++)if(cellComplete(w,ds[a].key,ds[a].ex[i]))d++;
    }
    return t?d/t:0;
   }
   ```
2. **`dayStatus(d)`** – eingefrorener Tag ist abgeschlossen, auch wenn seine Übungsliste inzwischen anders (oder leer) ist:
   ```js
   function dayStatus(d){
    var all=d.ex.length;
    if(historyMarksComplete(S.history,S.week,d.key))return{dn:all,all:all,complete:true};
    var dn=0;for(var i=0;i<all;i++)if(cellComplete(S.week,d.key,d.ex[i]))dn++;
    return{dn:dn,all:all,complete:all>0&&dn===all};
   }
   ```
3. **`skippedBeforeSelection()`** (1261): `!dayComplete(w,ordered[i].key)` → `!unitComplete(w,ordered[i].key)`. Eingefrorene Einheiten erscheinen nie mehr in der Verpasst-Warnung.
4. **`startWorkout()`** (1670): Bedingung `dayComplete(S.week,S.day)` → `unitComplete(S.week,S.day)`; Dialogtext gemäß F5. Wichtig: Der Wiederholen-Dialog erscheint damit auch auf Einheiten, die nur per eingefrorenem Flag abgeschlossen sind (live „unvollständig" nach einer Editor-Ergänzung) – vorher zeigten diese fälschlich „Training starten" plus Verpasst-Warnung.
5. **`beginWorkout(mode)`** (1659): `!dayComplete(S.week,S.day)` → `!unitComplete(S.week,S.day)`. Defensiv – verhält sich heute identisch, weil `replaceDayHistory` genau einen Eintrag je Zelle hält und ein eingefrorener Eintrag (`complete === true`) nie zugleich als unterbrochen gilt.
6. **`renderBar()`** (1751): `var completed=dayComplete(S.week,S.day)` → `unitComplete(...)` – der Start-Button zeigt auf eingefrorenen Tagen „Training wiederholen".
7. **`renderView()`** (1397, Starthinweis): `!dayComplete(S.week,S.day)` → `!unitComplete(S.week,S.day)`.
8. **`programBlockComplete(program, logs, history)`** (1099): optionaler dritter Parameter, Funktion bleibt pure (keine Mutation der Argumente); Aufrufe mit zwei Argumenten verhalten sich exakt wie bisher:
   ```js
   function programBlockComplete(program,logs,history){
    if(!program||!Array.isArray(program.weeks)||!program.weeks.length||!Array.isArray(program.days)||!program.days.length)return false;
    logs=logs&&typeof logs==="object"?logs:{};if(!Array.isArray(history))history=[];
    for(var w=1;w<=program.weeks.length;w++)for(var di=0;di<program.days.length;di++){
     var day=program.days[di];
     if(historyMarksComplete(history,w,day.key))continue;
     if(!day.ex||!day.ex.length)return false;
     for(var ei=0;ei<day.ex.length;ei++){var ex=day.ex[ei],need=setsForProgramExercise(program,ex,w),cell=logs[w+"|"+day.key+"|"+ex.id];if(!need||!cell||!Array.isArray(cell.sets))return false;for(var si=0;si<need;si++)if(!cell.sets[si]||!setComplete(ex,cell.sets[si]))return false;}
    }
    return true;
   }
   ```
   Alle drei Aufrufer übergeben künftig die History: `maybeShowBlockSuccess` (1811) → `store.history`, `createFollowupBlock` (2806) → `sourceStore.history`, Abgeschlossen-Badge in `renderLib` (2812) → `store.history`.
9. **`stopWorkout()`**: **keine Änderung.** Der neue History-Eintrag erhält weiterhin `complete: dayComplete(...)` – bewusst live, gegen die dann aktuelle Übungsliste. Würde hier `unitComplete` verwendet, erbte eine unvollständig abgebrochene Wiederholung den alten `complete:true`-Eintrag (der bis `replaceDayHistory` noch existiert) und fröre einen falschen Abschluss ein.

#### F4 · Grenzfälle (verbindlich)

- **a) Einheit mit Werten, aber ohne Eintrag `complete === true`** (unterbrochene Session, Logs ohne History): kein Einfrieren, Live-Berechnung wie heute. `unitComplete` liefert `true`, solange die Live-Prüfung erfüllt ist; eine spätere Editor-Ergänzung kann eine solche Einheit wieder „öffnen" – gewollt, sie wurde nie regulär beendet. Bekannte Bestandsabweichung bleibt: Der Report zählt nur Einheiten mit Flag als abgeschlossen, die Live-Anzeige ggf. mehr – wie in v0.22.3, keine Vereinheitlichung im O-Fix.
- **b) Importierte alte Backups:** History-Einträge ohne `complete`-Flag sind laut Backup-Validierung (2090) zulässig und gelten **nicht** als eingefroren → exaktes v0.22.3-Verhalten. Keine Migration (analog OF-4); das Flag entsteht organisch beim nächsten regulären Beenden oder Wiederholen der Einheit. Backups mit Flag verhalten sich sofort O3-konform.
- **c) Laufendes Training:** Alle Anzeigen im aktiven Training (`workoutProgress`, `isDone`, `maybeAskDone`, Tageszähler) bleiben live. Während einer laufenden Wiederholung existiert der alte eingefrorene Eintrag bis zum Beenden weiter – Wochenbalken und Blockabschluss zeigen die Einheit so lange als abgeschlossen. Erst `stopWorkout` ersetzt den Eintrag durch den neuen Live-Zustand: Wird die Wiederholung unvollständig beendet, gilt die Einheit ab dann als offen/unterbrochen (selbstheilend, Regeln 5/6).
- **d) Wiederholen im O-Fix (noch ohne O1-Sperren):** weiterhin auf jeder abgeschlossenen Einheit jeder Woche möglich; erst O-Kern beschränkt auf die zuletzt abgeschlossene. Nach `resetDayLogs` + erneutem Training wird der neue `complete`-Wert live gegen die **dann aktuelle** Übungsliste berechnet – eine Wiederholung unterwirft die Einheit bewusst dem aktuellen Plan (sie wird „jetzt" trainiert, inklusive später ergänzter Übungen). Erst O4 filtert Übungen je Woche.
- **e) Editor-Ergänzung einer Übung (der eigentliche Fix-Fall):** Abgeschlossene Wochen bleiben vollständig (Balken 100 %, Häkchen, keine Verpasst-Warnung, Blockabschluss und Folgeblock erreichbar). Die neue Übung zeigt in eingefrorenen Wochen leere, gesperrte Satzzeilen (ohne O2 nicht befüllbar – konsistent mit Regel 3). Gleiches gilt für erhöhte Satzzahlen (Kategorie-Sätze im Editor).
- **f) Gelöschte Übungen / leer gewordene Tage:** `migrateReplaceStore` verwirft Logs gelöschter Übungen weiterhin – diese Regel-1-Verletzung bleibt bis O4 ausdrücklich bestehen. Eingefrorene Einheiten gelten trotzdem als abgeschlossen; ein Tag mit eingefrorenem Eintrag und inzwischen leerer Übungsliste zählt weiterhin als abgeschlossen (F3.2, F3.8).
- **g) Mehrere Programme:** `programBlockComplete` erhält je Programm dessen eigene History (Badge, Folgeblock); die `S`-gebundenen Helfer (`unitComplete`, `weekFrac`, …) betreffen nur das aktive Programm.

#### F5 · Nutzertexte (Wiederholen-Dialog)

Titel und Buttons unverändert: **„Training wiederholen?"**, primär „Zurücksetzen & wiederholen", sekundär „Abbrechen". Beide Texte sind statisch (kein Nutzerinhalt, kein zusätzliches Escaping nötig).

- **Ohne spätere Daten** (Basistext, unverändert):
  > Alle eingetragenen Satzwerte dieses Tages werden geleert. Beim Beenden ersetzt die neue Trainingszeit außerdem die bisher gespeicherte Zeit.
- **Mit späteren Daten desselben Tages** (`laterWeeksHaveData(S.week,S.day)`), als eigener Absatz (`<br><br>`) angehängt:
  > Alle eingetragenen Satzwerte dieses Tages werden geleert. Beim Beenden ersetzt die neue Trainingszeit außerdem die bisher gespeicherte Zeit.
  >
  > Empfehlungen der folgenden Wochen werden aus den neuen Werten neu berechnet. Deine eingetragenen Werte bleiben unverändert.

#### F6 · Test- und Abnahmeplan

`node --test tests/` muss bei der Umsetzung grün laufen (auf dem Rechner des Produktverantwortlichen ist Node.js nicht installiert – die Suite läuft beim umsetzenden Agenten).

**`block-lifecycle.test.cjs`** (Fixtures `blockProgram`/`completeLogs` wiederverwenden):
1. Bestehenden Test „computes the completed badge …" beibehalten und umbenennen (z. B. „… live für Einheiten ohne eingefrorenen Abschluss"): Die 2-Argument-Aufrufe müssen sich weiterhin exakt wie bisher verhalten.
2. Neu `programBlockComplete` mit History: vollständige Logs, dann Übung ergänzt (Logs der neuen Übung fehlen) → mit `complete:true`-Einträgen je (Woche, Tag) `true`, ohne Einträge `false`.
3. Neu: Einträge mit `complete:false` oder ohne Flag zählen nicht als eingefroren; Purity-Check (Snapshot von `program`/`logs`/`history` unverändert, wie im Bestandstest).
4. Neu `historyMarksComplete`/`unitComplete`/`weekFrac`/`dayStatus`/`skippedBeforeSelection` mit `S`-Mock: eingefrorene Einheit bleibt nach Editor-Ergänzung abgeschlossen (`unitComplete` `true`, `weekFrac` 1, `dayStatus.complete` `true`, nicht in `skippedBeforeSelection`); dieselbe Einheit ohne Flag gilt als offen.
5. Neu: `maybeShowBlockSuccess` feiert einen Block mit eingefrorenen Wochen trotz nachträglich ergänzter Übung genau einmal (Vorlage: „shows block success exactly once …").

**`ui-feedback-regressions.test.cjs`** (`showModal`-Mock fängt Titel/Text):
1. Neu: Wiederholen-Dialog ohne spätere Daten → Basistext, Warnabsatz fehlt.
2. Neu: mit eingetragenen Werten desselben Tages in einer späteren Woche → Text enthält „Empfehlungen der folgenden Wochen werden aus den neuen Werten neu berechnet." und „Deine eingetragenen Werte bleiben unverändert."
3. Neu: Daten nur an einem anderen Wochentag bzw. nur in getauschten Zellen (`swap`) → keine Warnung.
4. Neu: Dialog erscheint auch, wenn die Einheit nur per eingefrorenem Flag abgeschlossen ist (live unvollständig); `renderBar` zeigt dann „Training wiederholen".

**Manuelle Checks mit `TESTBACKUP-AUSWERTUNG.json`** (Wochen 1–7 abgeschlossen, Woche 8 offen):
1. Backup einspielen, im Editor eine Übung an Tag A ergänzen, „Original ersetzen": Wochen 1–7 bleiben vollständig (Balken 100 %, Häkchen im Wochenstreifen), Startleiste zeigt dort „Training wiederholen"; die neue Übung zeigt in Woche 1–7 leere, gesperrte Satzzeilen.
2. Woche 8 auswählen und Training starten: keine Verpasst-Warnung für die Wochen 1–7.
3. Woche 8 komplett abschließen: Blockabschluss-Glückwunsch erscheint, „Folgeblock starten" funktioniert, Programmkarte zeigt „Abgeschlossen".
4. Wiederholen-Dialog in Woche 3 öffnen (spätere Wochen desselben Tages haben Werte) → erweiterter Text; in Woche 7, Tag C (keine späteren Daten) → nur Basistext.
5. Wiederholung in Woche 7, Tag C starten und unvollständig beenden → Einheit gilt als offen/unterbrochen („Training fortsetzen"), Woche-7-Balken unter 100 % (Selbstheilung).
6. Auswertung öffnen: Wochenraster und Einheitenliste unverändert korrekt (Report nutzte das Flag schon vorher).
7. Backup-Variante, bei der alle `complete`-Flags aus der History entfernt wurden, einspielen: lädt fehlerfrei, Verhalten wie v0.22.3 (rein live).

**Abnahme:** O3-Akzeptanzkriterium erfüllt (abgeschlossene Wochen bleiben nach Editor-Ergänzung vollständig, keine Verpasst-Warnung, Blockabschluss erreichbar) und beide Dialogvarianten im Quelltext nachweisbar.

#### F7 · Changelog-Eintrag (Unreleased, vorformuliert)

Bei der Umsetzung unter `## [Unreleased]` in `CHANGELOG.md` einfügen (O-Fix trägt Paket-Kürzel statt Feedback-ID; Release-Vorschlag danach: v0.23.0 mit synchronem `APP_VERSION`-/`sw.js`-`CACHE`-Bump gemäß Guardrail 7):

> ### Behoben
>
> - `O3`: Abgeschlossen bleibt abgeschlossen – Tagesanzeige, Wochenbalken, Verpasst-Warnung und Blockabschluss richten sich bei beendeten Einheiten nach dem beim Beenden gespeicherten Abschlussstatus. Nachträgliche Programmänderungen (z. B. eine ergänzte Übung oder erhöhte Satzzahlen) machen fertige Wochen nicht mehr rückwirkend unvollständig und blockieren den Blockabschluss nicht mehr.
>
> ### Geändert
>
> - `O6`: Die Wiederholen-Abfrage warnt zusätzlich, wenn spätere Wochen desselben Trainingstags bereits Werte enthalten: Empfehlungen der folgenden Wochen werden aus den neuen Werten neu berechnet; die eingetragenen Werte bleiben unverändert.
>
> ### Daten & Kompatibilität
>
> - Keine Formatänderung: Es wird ausschließlich der vorhandene Abschlussstatus gespeicherter Einheiten gelesen. Alte Backups ohne diesen Status laden unverändert und verhalten sich wie bisher; Schema-Version, Austauschformat und Progressionslogik bleiben unverändert.

#### F8 · Guardrail-Prüfung

- Test-Anker (`stopWorkout`, `workoutProgress`, `getSets`, …) werden weder umbenannt noch verschoben; neue Funktionen sind reine Einfügungen, die relative Anker-Reihenfolge bleibt.
- `esc()`/`attr()`: keine neuen dynamischen HTML-Ausgaben; die Dialogtexte sind statisch.
- ES5-Stil (`var`, `function`), Ein-Datei-Architektur unangetastet.
- `js/progression.js` unberührt; `cellComplete`/`sessionFor`/`priorSessions` bleiben live, Empfehlungen ändern sich nicht.
- `DATA_SCHEMA_VERSION` 4, localStorage-Key und Austauschformat v2 unverändert; keine neuen Felder.

---

### Feinspezifikation Release 3 „O-Kern" (O1, O2, O4, O5, Rest O6) · FREIGEGEBEN 17.07.2026

**Stand 17.07.2026, abgeglichen mit v0.22.3; setzt das umgesetzte Release 1 (O-Fix, `unitComplete`/eingefrorene Vollständigkeit) voraus.** Zeilenangaben verschieben sich durch Release 1/2 – Anker sind die Funktionsnamen.

#### K-F1 · Datenmodell
1. **Übungsfelder `fromWeek`/`untilWeek`** (optional, ganzzahlig, 1 ≤ fromWeek ≤ untilWeek ≤ Wochenzahl; fehlend = gilt immer). Aufnahme in `parseProgram` (Validierung) und Export (Roundtrip verlustfrei); alte Programme/Backups ohne Felder laden unverändert (OF-4). Zusätzlich optionales internes Feld `prevId` an einer Nachfolge-Übung (Verweis auf die beendete Vorgängerin desselben Tages, für O5). `DATA_SCHEMA_VERSION` bleibt 4.
2. **Zentrale Filterfunktion** `dayExercisesFor(day, w)` → Übungen des Tages mit `fromWeek ≤ w ≤ untilWeek`. Alle wochenbezogenen Verwender werden auf die gefilterte Liste umgestellt: `renderView`, Live-Anteil von `unitComplete`, `weekFrac`, Blockabschluss, Report (`buildReportData` je Woche), `weekLayout`-Zähler, `findEx` (Woche der Ansicht). `js/progression.js` bleibt unangetastet – es erhält wie bisher nur Logs/Parameter der jeweiligen Übung.
3. **Abgeleitete aktuelle Woche** `currentTrainingWeek()` (OF-1): höchste Woche mit begonnener (History-Eintrag oder Satzwerte) oder abgeschlossener Einheit; sind dort alle Einheiten abgeschlossen (`unitComplete`), rückt die Folgewoche nach (gedeckelt auf die Wochenzahl); ohne Daten Woche 1. `S.week` bleibt reine Ansichts-Auswahl.

#### K-F2 · O1: Schreibrechte
1. **Startbar:** Einheiten mit `w === currentTrainingWeek()` (Reihenfolge frei) sowie **leere** Einheiten der Woche davor (leer = keine Satzwerte, kein History-Eintrag).
2. **Wiederholbar:** ausschließlich die Einheit des jüngsten History-Eintrags mit `complete === true` des aktiven Programms.
3. Der Start-Button (`renderBar`, „Training starten/wiederholen/fortsetzen", ~1751) prüft diese Rechte; auf gesperrten Einheiten erscheint stattdessen der Wegweiser (K-F6). `changeWeek`/`changeDay` bleiben zum Ansehen frei.
4. `skippedBeforeSelection` warnt nur noch innerhalb des erlaubten Bereichs (aktuelle Woche + nachholbare Vorwoche); Älteres ist Protokoll, keine „verpassten" Tage.

#### K-F3 · O2: Werte korrigieren
1. Auf abgeschlossenen Einheiten ersetzt **„Werte korrigieren"** den Start-Button (OF-2). Antippen zeigt einmalig den Hinweis „Du bearbeitest dein Protokoll. Empfehlungen späterer Wochen rechnen mit den neuen Werten." und aktiviert den Korrektur-Modus für genau diese Einheit (Merker z. B. `correctionCell={week,day}`, nicht persistiert).
2. Im Korrektur-Modus sind **alle** Satzzeilen der Einheit editierbar (auch leere – Nachtragen vergessener Sätze; Entsperr-Logik in `renderView` ~1372 erweitern). Kein Timer, keine Satzpause, kein `history`-Eintrag, keine Trainingszeit-Änderung; „Fertig" beendet den Modus.
3. Nur ohne laufendes Training verfügbar; `active()` blockiert den Einstieg.

#### K-F4 · O4: Editor „gilt ab jetzt" (ersetzt die bisherige Ersetz-Migration)
1. **Anker je Tag** beim Speichern aufs aktive Programm (`editorStoreProgram` mit `replaceOriginal`): W = `currentTrainingWeek()`; ist die Einheit dieses Tages in W bereits abgeschlossen, W = Folgewoche.
2. **Regeln:** Entfernte Übung → `untilWeek = W−1`, **Logs bleiben** (Regel 1; `migrateReplaceStore` verwirft nichts mehr). Typ-Änderung → alte Übung endet (`untilWeek = W−1`), neue beginnt (`fromWeek = W`, neue ID, `prevId` auf die alte). Neue Übung → `fromWeek = W`. Reine Umbenennung ohne Typ-Änderung bei vorhandenen Werten → **Nachfrage** (OF-3): „Gleiche Übung, nur umbenannt (Werte behalten)" (ID bleibt) oder „Andere Übung (alte endet, neue beginnt)". „Als Kopie speichern" bleibt unverändert (frisches Programm ohne Anker).
3. **Dauerhafter Tausch** (Paket K) läuft über denselben Mechanismus: Original endet, Ersatz beginnt ab Anker; zu diesem Namen passende „nur heute"-Tauschzellen werden wie bisher reguläre Historie der neuen Übung.
4. **Bewusste Vereinfachung (verbindlich):** Versioniert wird die Übungs-Ebene, nicht Tages-Reihenfolge oder Tages-Layout – vergangene Wochen zeigen ihre damaligen Übungen (gefiltert), aber in der aktuellen Anordnung. Reihenfolge ist Darstellung, kein Protokoll-Fakt.
5. **Schutzregel Tage:** Ein Tag mit mindestens einer abgeschlossenen Einheit kann nicht gelöscht werden (Editor-Meldung mit Begründung); leere Tage bleiben löschbar.

#### K-F5 · O5: Übungs-Zeitachse
1. Übungskarte mit `fromWeek > 1`: dezente Zeile „seit Woche X", antippbar → Modal „davor: {Name} (Woche a–b)" über `prevId`, inkl. Verlauf (`exHistory`) der Vorgängerin.
2. Vergangene Wochen zeigen automatisch die damals gültigen Übungen (folgt aus K-F1.2), inklusive beendeter Übungen mit ihren Werten.
3. Auswertung: beendete Übungen erhalten eigene Karten mit Zeitraum im Titel („Beinpresse · Woche 1–3").

#### K-F6 · O6: Wegweiser, Hinweis-Box, Benennungen
1. **Wegweiser** auf gesperrter alter Einheit: Titel „Diese Einheit ist Teil deines Protokolls.", Aktionen „Werte korrigieren", „Diesen Inhalt heute trainieren" (springt zu `currentTrainingWeek()`, gleicher Tag), bei komplett abgeschlossenem Block Hinweis auf den Folgeblock.
2. **Einmalige Hinweis-Box** beim ersten Öffnen nach dem Update, ohne laufendes Training (Wortlaut verbindlich aus O6 Punkt 4; einmaligkeits-Flag als optionales Store-Feld, z. B. `zonesIntroSeen`).
3. **Benennungen** durchgängig: „Werte korrigieren", „Training wiederholen (ersetzt die letzte Einheit)", „Übung nur heute tauschen", „Ab jetzt ersetzen".

#### K-F7 · Grenzfälle (verbindlich)
- **Bestand ohne neue Felder** verhält sich exakt wie vorher, bis zur ersten Editor-Änderung (OF-4).
- **Wiederholen** der letzten Einheit verwendet die für ihre Woche gültige Übungsliste; die Wiederholen-Warnung aus Release 1 bleibt.
- **Folgeblock** (`createFollowupBlock`): übernimmt nur die am Blockende aktiven Übungen (ohne `untilWeek` bzw. `untilWeek` = letzte Woche); beendete Übungen wandern nicht mit, ihre Historie bleibt im archivierten Block.
- **Export/Reimport und Backups** erhalten `fromWeek`/`untilWeek`/`prevId` verlustfrei; Fremd-JSON ohne Felder bleibt gültig.
- **Coach-/Import-Übernahmen** („Ersetzen & Fortschritt behalten", H-Pfad) laufen ab diesem Release über K-F4 – Grundlage für das spätere Paket N (NF-2).
- **Leere Vorwoche-Definition:** Eine Einheit mit Satzwerten, aber ohne History-Eintrag (unterbrochen) gilt als begonnen, nicht als leer – sie ist in der Vorwoche nicht neu startbar, sondern über „fortsetzen" in der aktuellen Logik bzw. Korrektur erreichbar.

#### K-F8 · Test- und Abnahmeplan
- `editor-replace-migration.test.cjs`: Umbau auf Enden/Beginnen-Semantik (Logs bleiben bei Entfernen; Typ-Änderung erzeugt Nachfolgerin mit `prevId`; Umbenennungs-Nachfrage-Pfade).
- `training-flow.test.cjs`: Startrechte (Matrix aus K-F2 mit `TESTBACKUP-AUSWERTUNG.json`-Konstellation), Korrektur-Modus (kein History-/Zeit-Effekt, leere Zeilen editierbar).
- `block-lifecycle.test.cjs`: `currentTrainingWeek()`-Ableitung inkl. Nachrücken, Folgeblock ohne beendete Übungen.
- `program-validation.test.cjs`: neue optionale Felder (Grenzwerte, Roundtrip).
- `package-k-swap.test.cjs`/`preworkout-swap.test.cjs`: dauerhafter Tausch über K-F4.
- `ui-feedback-regressions.test.cjs`: Wegweiser-Texte, Hinweis-Box einmalig, vier Benennungen.
- **Manuell** mit `TESTBACKUP-AUSWERTUNG.json`: Sperren in Woche ≤6, Wiederholen nur letzte Einheit, Nachholen leerer Vorwochen-Tag, Korrektur in Woche 1, Übung ersetzen → Zeitachse prüfen („seit Woche X"/Report-Zeitraum), Export/Reimport.

#### K-F9 · Changelog (Unreleased, vorformuliert)
- „Dein Protokoll ist jetzt geschützt: Abgeschlossene Trainings bleiben unverändert, Planänderungen gelten ab jetzt und nie rückwirkend."
- „Neue Aktion ‚Werte korrigieren': Zahlen abgeschlossener Trainings jederzeit ausbessern oder vergessene Sätze nachtragen – ohne die Trainingszeit zu verändern."
- „Ersetzte Übungen behalten ihre Geschichte: Der Plan zeigt ‚seit Woche X' samt Vorgängerin, die Auswertung führt beendete Übungen mit Zeitraum."
- „Trainiert wird vorne: Neue Einheiten starten in der aktuellen Woche, Vergessenes aus der Vorwoche lässt sich nachholen."

---

## 4. Paket L – Programm-Bibliothek (kuratierte Startprogramme)

### Ziel & Nutzen
Neue Nutzer kommen heute nur über den 17-Fragen-Coach, ChatGPT oder manuelles Bauen zu einem Programm. Eine kleine, kuratierte Bibliothek fertiger Satzkraft-Programme senkt die Einstiegshürde auf unter eine Minute: öffnen → Programm wählen → Training starten. Kein Backend, alles lokal.

### Entscheidungen

| # | Frage | Entscheidung |
|---|---|---|
| L-E1 | Welche Programme? | **ENTSCHIEDEN 16.07.:** Vier Programme: 1. Gym-Ganzkörper **Beginner**, 2. Gym-Ganzkörper **Fortgeschritten** (Standard-Studio-Ausstattung à la Holmes Place/SuperFit), 3. **Calisthenics-Einstieg**, 4. **Hybrid** (Gym + Calisthenics). Wissenschaftlich fundiert (Maßstab: `trainings_richtlinien`), jeder Tag mit Warm-up & Cool-down aus `WUCD_LIB`. |
| L-E2 | Startgewichte? | **ENTSCHIEDEN 16.07.:** Leer + Kalibrierung (F10-Mechanik), plus verpflichtende verständliche Anleitung zum Finden der Startgewichte (Technik-Sätze → Arbeitssatz bei ~RIR 3). Ort: L-E6. |
| L-E3 | Erscheinung im Erstellen-Hub? | **ENTSCHIEDEN 16.07.:** Eigene Kachel „Fertiges Programm wählen" ganz oben → Liste mit Kurzbeschreibung → Vorschau → Übernahme als eigenes, frei bearbeitbares Programm. |
| L-E4 | Blocklänge? | **ENTSCHIEDEN 16.07.:** Je Programm sportlich passend (Richtwert 8 Wochen, Einsteiger ggf. 6). |
| L-E5 | Qualitätssicherung? | **ENTSCHIEDEN 16.07.:** Entwurf durch Architektur-Agenten streng nach `trainings_richtlinien` (Volumen 10–20 Sätze/Muskel/Woche, Blockaufbau mit Deload, RIR-Verlauf, Push/Pull-Balance); **praktische Abnahme durch den Produktverantwortlichen im Studio**. |
| L-E6 | Kalibrier-Anleitung? | **ENTSCHIEDEN 16.07.:** Zweistufig: Kurzfassung auf der Übungskarte beim ersten Training (antippbar für Details); ausführliche Fassung in der Programm-Vorschau. |
| L-E7 | Ersatzübungen? | **ENTSCHIEDEN 16.07.:** Ja, flächendeckend – jede Geräte-Übung erhält eine gleichwertige Alternative im `proxy`-Feld. Verzahnt mit Übungstausch (Paket K). |
| L-E8 | Vorschau-Detailgrad? | **ENTSCHIEDEN 16.07.:** Vollständig scrollbar – Beschreibung, Wochenstruktur (Phasen/RIR), alle Tage mit allen Übungen inkl. Warm-up/Cool-down. Nutzt das Import-Vorschau-Muster. |

### Stand der Vorarbeit (16.07.2026)
- **Alle vier Programme liegen vor:** `programme/gym-ganzkoerper-beginner.json`, `gym-ganzkoerper-fortgeschritten.json`, `calisthenics-einstieg.json`, `hybrid-gym-calisthenics.json`. Je 3 Tage × 8 Wochen (2×-Aufbau-Deload, RIR 3→1), Warm-up/Cool-down je Tag, alle Geräte-Übungen mit `proxy`, englische Namen (`en`), Startgewichte 0.
- **Validierung:** Alle vier bestehen die echte `parseProgram`-Prüfung (getestet in v0.19.x) sowie einen Regel-Nachbau (Whitelist, Limits, Satz-Abdeckung je Woche).
- **Kalibrier-Anleitung:** Der frühere Textentwurf wurde in die App-Texte übernommen.
- **Freigabe (17.07.2026):** Die vier Programme wurden vom Produktverantwortlichen überarbeitet und freigegeben (LF-1 erledigt). Erneute Vollvalidierung über den `parseProgram`-Test ist Teil der L-Umsetzung.

### Technische Eckpunkte (ENTSCHIEDEN 17.07., LF-2/LF-3)
- Programme als statische JSON im Austauschformat `trainings-block` v2 (z. B. `programme/*.json`), vom Service Worker gecacht → offline verfügbar. Kein Build-Tool; `js/progression.js` zeigt, dass Zusatzdateien die Ein-Datei-Regel für die UI nicht verletzen.
- Übernahme durch den bestehenden `parseProgram`-Pfad (gleiche Validierung wie jeder Import).
- Jedes Bibliotheksprogramm mit `TESTPROGRAMM`-Qualität; automatischer Test lädt alle Bibliotheks-JSONs über `parseProgram`.
- Herkunfts-Kennzeichnung „Offizielles Satzkraft-Programm" in der Programmverwaltung (Ort/Wortlaut: **LF-3**).

---

### Feinspezifikation Release 2 „L" (Programm-Bibliothek) · FREIGEGEBEN 17.07.2026

**Stand 17.07.2026, abgeglichen mit v0.22.3.** Zeilenangaben beziehen sich auf `index.html`; der umsetzende Agent verifiziert Anker über die Funktionsnamen.

#### L-F1 · Codestand-Abgleich
- `renderCreateHub()` (~2841): Erstellen-Hub mit `creategrid`-Kacheln – hier kommt die neue Bibliotheks-Kachel als **erste** Kachel hin (L-E3). `createhubbtn` in der Programmverwaltung (~2823) bleibt unverändert.
- Import-Pfad: `parseProgram` (~1944, Format `trainings-block` v2), `renderImportPreview()` (~2206), `storeImportedProgram(activate,allowDuplicate)` (~2208) – die Bibliothek nutzt exakt diesen Pfad, keine eigene Validierung.
- `programItemHtml` (~2811): Programmkarte der Verwaltung – Ort der Herkunfts-Zeile (LF-3).
- Kalibrier-Hinweis existiert: `calibrationhint` (~1366, erscheint bei `ex.w && !ex.bw` ohne Arbeitsgewicht) – wird um den antippbaren Detail-Einstieg erweitert (L-E6).
- Schreibschutz: `programWriteLocked()` gilt; die neue Kachel erhält dasselbe `lockedAttr`-Muster wie `createhubbtn`.

#### L-F2 · Dateien & Auslieferung
1. Verzeichnis `programme/` mit den vier freigegebenen JSONs. Die frühere Kalibrier-Anleitung ist in die App-Texte übernommen; der Entwurfsordner wurde wie geplant entfernt.
2. `sw.js`: die vier JSONs in die Cache-Liste aufnehmen (offline verfügbar; `CACHE`-Version steigt mit dem Release ohnehin, `version.test.cjs`).
3. Konstante `PROGRAM_LIBRARY` in `index.html`: je Programm Datei-Pfad, Name, Ziel, Level, Tage/Woche, Dauer je Einheit, Kurzbeschreibung (bestimmt die Listen-Reihenfolge). Laden per `fetch` beim Öffnen der Liste.

#### L-F3 · UI-Flow
1. Kachel „Fertiges Programm wählen" (Untertext: „Vier geprüfte Satzkraft-Programme – ansehen, übernehmen, lostrainieren.") als erste `createchoice` in `renderCreateHub()`.
2. Neue Unteransicht `renderProgramLibrary()` im `subviewbox`-Muster (wie „Mit ChatGPT & Co.", ~2850): Liste der vier Programme mit Name, Ziel, Level, Tage/Woche, Dauer.
3. Antippen → JSON laden → `parseProgram` → bestehende Import-Vorschau `renderImportPreview()` (vollständig scrollbar, L-E8) mit zusätzlichem aufklappbarem Abschnitt „Startgewichte finden" (L-F4). Übernahme über `storeImportedProgram` – Duplikat-Dialog wie beim Import.
4. **Herkunft:** Übernommene Programme erhalten das optionale interne Feld `origin:"satzkraft"` am Programmobjekt. `programItemHtml` zeigt dann „Offizielles Satzkraft-Programm" in der Metazeile (LF-3). Das Feld wird beim **Export bewusst nicht mitgeschrieben** (bearbeitete Re-Importe sind keine offiziellen Programme mehr) und bei „Als Kopie speichern" nicht auf die Kopie übertragen. `DATA_SCHEMA_VERSION` bleibt 4.

#### L-F4 · Kalibrier-Anleitung (zweistufig, L-E6)
- **Kurzfassung:** `calibrationhint` erhält den antippbaren Zusatz „Wie finde ich mein Startgewicht?" → Modal mit der Kurzanleitung (Technik-Sätze mit leichtem Gewicht → 2–3 Steigerungssätze → Arbeitsgewicht = sauberes Gewicht mit ~3 Wiederholungen Reserve im Zielbereich).
- **Ausführliche Fassung:** aufklappbarer Abschnitt in der Bibliotheks-Vorschau; Texte aus `kalibrier-anleitung.md`, redaktionell im App-Ton (Du-Form, keine medizinischen Aussagen).

#### L-F5 · Grenzfälle
- **fetch schlägt fehl** (offline vor dem ersten Laden): freundliche Meldung „Das Programm konnte nicht geladen werden. Öffne die Liste einmal mit Internet – danach funktioniert sie auch offline."
- **JSON besteht `parseProgram` nicht:** gleiche Fehlermeldung wie beim Import; der automatische Test (L-F6) verhindert diesen Fall im Release.
- **Duplikat:** bestehende `allowDuplicate`-Behandlung des Imports.
- **Training läuft:** Kachel und Übernahme über `programWriteLocked()`/`lockedAttr` gesperrt (bestehendes Muster).

#### L-F6 · Test- und Abnahmeplan
- **Neuer Test `program-library.test.cjs`:** lädt alle `programme/*.json` durch den echten `parseProgram`-Schnitt (Muster `program-validation.test.cjs`); prüft, dass `PROGRAM_LIBRARY` und Dateien 1:1 übereinstimmen; prüft die `origin`-Zeile in `programItemHtml`.
- Bestehende Tests unverändert grün; `version.test.cjs` (Version+Cache synchron).
- **Manuell:** Kachel ganz oben; Liste; Vorschau vollständig inkl. Kalibrier-Abschnitt; Übernahme → aktivieren → Training starten; Offline-Fall nach erstem Laden; Duplikat-Fall; Herkunfts-Zeile sichtbar, auf Kopien nicht.

#### L-F7 · Changelog (Unreleased, vorformuliert)
- „Neue Programm-Bibliothek: Vier geprüfte Satzkraft-Programme (Gym Ganzkörper Beginner und Fortgeschritten, Calisthenics-Einstieg, Hybrid) lassen sich mit vollständiger Vorschau und Kalibrier-Anleitung direkt übernehmen."
- „Offizielle Satzkraft-Programme sind in der Programmverwaltung gekennzeichnet."

---

## 5. Paket M – Übungs-Bibliothek light

### Ziel & Nutzen
Kuratierte, deutsche Übungsliste als Unterbau – **keine** Riesen-Datenbank. Drei Einsatzorte: Autocomplete im Editor (weniger Tippfehler), Vorschläge beim Übungstausch (K1), stabile Namen/Aliasse für den Langzeit-Vergleich über Blöcke (J4 matcht per Name). Freie eigene Übungsnamen bleiben immer erlaubt.

### Entscheidungen

| # | Frage | Entscheidung |
|---|---|---|
| M-E1 | Umfang (Auswahlprinzip)? | **ENTSCHIEDEN 16.07., ERWEITERT 17.07. (MF-2):** Sieben Bereiche mit Zielumfang ~200 Übungen: **Gym/Studio-Geräte 90, Calisthenics 40, Kettlebell 25, Functional 15, Core 15, Mobility 10, Cardio 5.** Kernanspruch unverändert: saubere deutsche UND englische Bezeichnungen (gründliche Recherche verpflichtend – größte Schwachstelle anderer Apps; `en`-Feld vorhanden). **Prüfpunkt Feinspezifikation:** Abgrenzung Mobility/Cardio zur bestehenden Warm-up/Cool-down-Bibliothek (`WUCD_LIB`) – was ist reguläre Übung im Trainingstag, was gehört in Warm-up/Cool-down. |
| M-E2 | Felder pro Übung? | **ENTSCHIEDEN 16.07., ERWEITERT 17.07.:** Name (DE), englischer Name, Alias-Namen, Übungstyp (Gewicht/Körpergewicht/**Körpergewicht+Zusatzgewicht**/Zeit), Equipment, Bewegungsmuster/Muskel (nur intern für Tauschvorschläge), Technik-Hinweis (1 Satz), Video-Suchbegriff, passende Ersatzübung. Erweiterung: vierter Übungstyp für Übungen wie Klimmzüge/Dips vom Produktverantwortlichen bestätigt (17.07., siehe `docs/referenz/UEBUNGSLISTE.md` Abschnitt 14). |
| M-E3 | Alias-Matching für J4? | **ENTSCHIEDEN 16.07.:** Automatisch – bekannte Namen (DE/EN-Varianten) werden über die Alias-Liste still normalisiert; unbekannte matchen weiter nur exakt. |
| M-E4 | Einsatzorte im UI? | **ENTSCHIEDEN 16.07.:** Drei Orte: Editor-Autocomplete (Übernahme füllt Typ, Technik-Hinweis, Video, Ersatzübung mit aus), Tauschvorschläge in K1, Langzeit-Matching J4. „Schnellwahl statt leerer Karte" beim Übung-Hinzufügen bewusst **nicht** übernommen. |

### Technische Eckpunkte
- Struktur analog `WUCD_LIB`: kuratierte Liste als Daten – im Quellcode oder separate gecachte JSON (**MF-1**, Entscheidung nach Größe der Liste).
- Muskel-/Bewegungsmuster bleibt internes Matching-Feld; ausdrücklich **keine** Muskelgruppen-Analytik im UI (Nicht-Ziel, Briefing Abschnitt 4).
- Freie eigene Übungsnamen bleiben uneingeschränkt erlaubt – die Bibliothek ist Komfort, nie Pflicht.
- Recherche-Arbeitspaket vor der Umsetzung: Übungsliste mit DE/EN-Namen und Aliassen als eigenes Review-Dokument, Abnahme durch den Produktverantwortlichen (analog L-E5). Umfangsrichtwert: **MF-2**; Quelle/QS der Technik-Hinweise: **MF-3**; Startzeitpunkt: **MF-4**.
- **Neu (Verzahnung mit O):** Das Feld „passende Ersatzübung" speist die Vorschläge für „Nur heute tauschen" und „Ab jetzt ersetzen" (Regel 8); DE/EN-Namen und Aliasse speisen die Übungs-Zeitachse (O5) und das Langzeit-Matching.

### Stand der Vorarbeit (17.07.2026)
- **Recherche-Dokument liegt vor:** `docs/referenz/UEBUNGSLISTE.md` – 200 Übungen in sieben Bereichen (Gym 90, Calisthenics 40, Kettlebell 25, Functional 15, Core 15, Mobility 10, Cardio 5), DE/EN-Namen recherchiert (Übersetzungsfallen mit Quellen dokumentiert), Ersatzübungen flächendeckend, alle 50 Übungsnamen der freigegebenen L-Programme abgedeckt, WUCD-Abgrenzung gekennzeichnet.
- **Freigabe (17.07.2026):** Liste vom Produktverantwortlichen abgenommen und freigegeben (Status in `docs/referenz/UEBUNGSLISTE.md` entsprechend gesetzt). Die inhaltliche M-Vorarbeit ist damit abgeschlossen; offen bleibt nur noch die technische Feinspezifikation der M-Umsetzung (Autocomplete, Tauschvorschläge, Alias-Matching).
- **Entscheidungen des Produktverantwortlichen (17.07.):** 1. Vierter Übungstyp „Körpergewicht+Zusatzgewicht" wird übernommen (M-E2 erweitert). 2. WUCD-Überschneidungen bleiben in beiden Bibliotheken (mit Kennzeichnung). 3. Bei Trage-/Schlitten-Übungen sollen Gewicht **und** Zeit erfassbar sein – Datenmodell/UI in der M-Feinspezifikation. 4. QS der Technik-Hinweise und Video-Suchbegriffe (MF-3) erfolgt später als eigener Schritt; Priorität ist die saubere Datenbasis. 5. Alias-Ergänzungen aus der Studio-Praxis folgen später.
- **Status:** Liste bleibt ENTWURF bis zur MF-3-Freigabe; nichts davon ist in der App.

---

### Feinspezifikation Release 4 „M" (Übungs-Bibliothek light) · FREIGEGEBEN 17.07.2026

**Stand 17.07.2026, abgeglichen mit v0.22.3; setzt Release 3 voraus** (Tauschvorschläge münden in die „Ab jetzt ersetzen"-Mechanik). Inhaltliche Grundlage ist die **freigegebene** `docs/referenz/UEBUNGSLISTE.md`.

#### M-F1 · Codestand-Abgleich
- Editor-Übungsfelder: `editorExerciseMeta` (~2566), Namensfeld `edexname`-Karten – Andockpunkt fürs Autocomplete.
- Tausch-Modal (~1125): Eingabefeld mit `ex.proxy` als Vorbelegung – Andockpunkt für Vorschläge.
- Namens-Matching über Blöcke (J4): Folgeblock-/Archiv-Vergleich matcht per Übungsname – Andockpunkt fürs Alias-Matching.
- `WUCD_LIB` (~2234) bleibt getrennt; als WUCD-nah gekennzeichnete Einträge der Liste werden **nicht** in die Übungs-Bibliothek aufgenommen.

#### M-F2 · Datei & Struktur
1. Neue Datei `uebungen.json`, generiert aus der freigegebenen `docs/referenz/UEBUNGSLISTE.md`: je Eintrag `de`, `en`, `alias[]`, `typ` (`gewicht|koerpergewicht|kgz|zeit`), `equipment`, `muster` (intern), `technik` (1 Satz), `video`, `ersatz`. Bereichszuordnung bleibt als Feld erhalten (nur intern, keine Muskel-Analytik im UI).
2. `sw.js`: Datei in die Cache-Liste. Laden „lazy" beim ersten Öffnen von Editor oder Tausch-Modal; danach im Speicher.
3. Typ-Mapping in App-Felder: `gewicht`→`w:true`; `koerpergewicht`→`w:false`; `kgz`→`w:true,bw:true`; `zeit`→`unit:"seconds"`.

#### M-F3 · Editor-Autocomplete
1. Das Übungs-Namensfeld im Editor zeigt ab 2 Zeichen Treffer über `de`/`en`/`alias` (Umlaut- und Groß/Klein-normalisiert, ES5-eigenes Dropdown im bestehenden Editor-Stil).
2. Übernahme eines Treffers füllt: Name (DE), `en`, Übungstyp (Typ-Mapping), Technik-Hinweis (`sub`), Video-Suchbegriff (`q`), Ersatzübung (`proxy`). Bereits gefüllte Felder werden nur nach Rückfrage überschrieben.
3. Freitext bleibt uneingeschränkt erlaubt (M-E4); kein Zwang, keine Validierung gegen die Liste.

#### M-F4 · Tauschvorschläge
Im Tausch-Modal erscheinen unter dem Eingabefeld bis zu drei antippbare Vorschläge: 1. `ex.proxy` der Übung, 2. `ersatz` des Bibliothekseintrags (falls die Übung per Name/Alias erkannt wird), 3. eine Alternative mit gleichem `muster` und verfügbarem `equipment`. Antippen übernimmt den Namen ins Feld; Rest des Tausch-Flows unverändert.

#### M-F5 · Alias-Matching (J4, M-E3)
Beim Vergleich über Blöcke (Folgeblock-Startgewichte, Archiv-Vergleich in der Auswertung) werden Übungsnamen still über die Alias-Tabelle kanonisiert (`de`/`en`/`alias` → `de`). Unbekannte Namen matchen weiterhin nur exakt. Keine sichtbare UI-Änderung – nur mehr Treffer.

#### M-F6 · Grenzfälle
- Datei nicht ladbar (offline vor erstem Cache): Editor und Tausch funktionieren ohne Vorschläge – stiller Fallback, keine Fehlermeldung im Weg.
- Alias-Kollisionen sind per Test ausgeschlossen (M-F7); Normalisierung: Kleinschreibung, ä→ae usw. konsistent an Matching- und Autocomplete-Stellen.
- Bestehende Programme bleiben beim Update unberührt – die Bibliothek ist reiner Komfort.

#### M-F7 · Test- und Abnahmeplan
- **Neuer Test `exercise-library.test.cjs`:** `uebungen.json` lädt; Pflichtfelder je Eintrag; jeder `ersatz` existiert als Eintrag; kein Alias zeigt auf zwei Übungen; alle 50 Übungsnamen der Bibliotheksprogramme werden erkannt (Konsistenz zu Abschnitt 12 der Übungsliste).
- Editor-Test: Treffer-Übernahme füllt Typ/`en`/`sub`/`q`/`proxy` korrekt (inkl. `kgz`).
- Alias-Normalisierung als Unit-Test; Tausch-Vorschläge in `ui-feedback-regressions.test.cjs`.
- **Manuell:** DE- und EN-Tippen im Editor, Übernahme, Tauschvorschläge an einer Geräte-Übung, Folgeblock-Vergleich mit Alias-Schreibweise, Offline-Fallback.

#### M-F8 · Changelog (Unreleased, vorformuliert)
- „Eingebaute Übungsbibliothek: 200 geprüfte Übungen mit sauberen deutschen und englischen Namen – der Editor schlägt beim Tippen passende Übungen vor und füllt Typ, Technik-Hinweis und Ersatzübung automatisch aus."
- „Bessere Tauschvorschläge: Beim Übungstausch schlägt Satzkraft gleichwertige Alternativen vor."
- „Fortschritte werden über Blöcke hinweg zuverlässiger erkannt, auch wenn Übungen leicht unterschiedlich benannt sind."

---

## 6. Paket N – KI-Coach 2.0: Blockbegleitung

### Ziel & Nutzen
Der Coach erstellt heute nur das Programm. Ausbaustufe: Mitten im Block kann der Nutzer eine Anpassung anfragen („Woche 3 lief schlecht, Schulter zwickt"). Der Coach erhält Programm + relevante Fortschrittsdaten, antwortet mit angepasstem Programm-JSON, die Übernahme erhält den Fortschritt. Alleinstellungsmerkmal gegenüber allen Wettbewerbern außer Juggernaut AI (Abo).

### Entscheidungen

| # | Frage | Entscheidung |
|---|---|---|
| N-E1 | Einstiegspunkte im UI? | **ENTSCHIEDEN 16.07.:** 1. Button „Coach fragen" beim aktiven Programm in der Programmverwaltung; 2. dezenter proaktiver Hinweis bei auffälligen Daten (z. B. Übung zweimal in Folge unter Zielbereich) – nur Hinweis, nie automatische Änderung. Schwellen-Feinspezifikation: **NF-3**. |
| N-E2 | Welche Daten an die KI? | **ENTSCHIEDEN 16.07.:** Programm-JSON + je Übung eine kompakte aggregierte Fortschritts-Zeile („Bankdrücken: W1 60 kg → W3 65 kg, zuletzt 2× unter Zielbereich") + Freitext. Keine Datums-/Uhrzeitangaben, keine einzelnen Satzlisten, keine Gerätedaten. |
| N-E3 | Was darf der Coach ändern? | **ENTSCHIEDEN 16.07.:** Nur kommende Wochen; Übungen tauschen/ergänzen/streichen, Volumen, RIR, Zielbereiche, Gewichtsziele. Tage-Anzahl, Wochen-Anzahl und bereits trainierte Wochen bleiben unverändert. |
| N-E4 | Vorschau/Bestätigung? | **ENTSCHIEDEN 16.07.:** Zweiteilig: Änderungs-Liste („Was ändert sich + Warum", vom Coach begründet) über der vollständigen Programm-Vorschau; Übernahme nur per explizitem „Übernehmen & Fortschritt behalten". |
| N-E5 | Kosten-/Nutzungsrahmen? | **RICHTUNG ENTSCHIEDEN 16.07., Details offen (NF-1):** Kostenloses Kontingent für Programm-Erstellung (1–3 Programme); laufende Begleitung über Credits/Bezahlsystem **oder** – bevorzugt zu prüfen – „Bring your own AI": Anfrage als Kopiertext für die eigene KI, Antwort-JSON zurück in die App, Übernahme über denselben Vorschau-Pfad. Detail-Ausarbeitung als eigener Termin vor Paket-N-Start. |

### Technische Eckpunkte (aktualisiert 17.07. wegen Paket O)
- Wiederverwendung: `coach.mjs`-Serverfunktion (Key serverseitig), `extractProgram`, `parseProgram`.
- **Geändert gegenüber dem Ursprungsentwurf (NF-2 bestätigen):** Die fortschrittserhaltende Übernahme läuft **nicht** mehr über die alte H-Migration (`editorBuildRefMap`/`migrateReplaceStore`), sondern über den O4-Mechanismus (Gültig-ab-Einheit). Nur er erzwingt N-E3 („bereits trainierte Wochen nie verändern") im Datenmodell statt per Konvention. Coach-Änderungen an bestehenden Übungen werden zu „Original endet / Ersatz beginnt ab Anker".
- Trainings-Schreibschutz (`FB-20260716-13`) gilt: keine Programmänderung während eines laufenden Trainings.

---

## 7. Querschnitt (gilt für alle Pakete)

- **Datenkompatibilität:** Austauschformat v2 und `DATA_SCHEMA_VERSION` 4 bleiben unverändert; neue Felder (`fromWeek`/`untilWeek`, Bibliotheks-Metadaten) nur optional und abwärtskompatibel; alte Programme/Backups laden unverändert.
- **Guardrails (Briefing Abschnitt 2):** Ein-Datei-Architektur, ES5-Stil, `esc()`/`attr()`, Test-Anker, `js/progression.js` unangetastet.
- **Jedes Paket einzeln:** eigene Feedback-IDs, eigener Release, Abnahme nach Briefing Abschnitt 6/10; O in zwei Releases (O-Fix, O-Kern, siehe GF-2).
- **Manuelle Prüfbasis:** `TESTBACKUP-AUSWERTUNG.json` (Wochen 1–7 abgeschlossen, Woche 8 offen) für alle Zonen-Szenarien; `TESTPROGRAMM-ALLE-SZENARIEN.json` für Editor-Fälle.
- **Vor jeder Feinspezifikation:** Abgleich mit dem dann aktuellen Codestand (I–K verändern Editor, Store und Trainingsansicht).

---

## 8. Offene Fragen (vor Übernahme ins Briefing alle entscheiden)

### Global
| # | Frage | Vorschlag der Architektur |
|---|---|---|
| GF-1 | Gesamt-Reihenfolge bestätigen? | **ENTSCHIEDEN 17.07.:** O-Fix → L → O-Kern → M → N (Abschnitt 1). |
| GF-2 | Release-Schnitt: O in zwei Releases (Fix vorgezogen + Kern)? | **ENTSCHIEDEN 17.07.:** Ja, zwei Releases – der Fix-Teil ist klein und schützt L-Neunutzer. |
| GF-3 | Bestandsnutzer-Kommunikation: Nutzer mitten im Block erleben nach dem O-Kern-Update neue Sperren. Einmaliger Hinweis beim ersten Öffnen? | **ENTSCHIEDEN 17.07.:** Ja, einmaliges Info-Panel, kurz und beruhigend. **GF-3a ENTSCHIEDEN 17.07.:** Wortlaut und Aufbau vom Produktverantwortlichen freigegeben – finale Fassung siehe O6, Punkt 4. |

### Paket L
| # | Frage | Vorschlag |
|---|---|---|
| LF-1 | Studio-Abnahme der vier Programme (Gate, keine Designfrage). | **ERLEDIGT 17.07.:** Programme vom Produktverantwortlichen überarbeitet, freigegeben und nach `programme/` übernommen. JSON-Syntax und `parseProgram`-Validierung wurden bei der L-Umsetzung geprüft. |
| LF-2 | Technische Eckpunkte bestätigen (statische JSONs `programme/*.json`, SW-Cache, `parseProgram`-Pfad)? | **ENTSCHIEDEN 17.07.:** Separate mitgelieferte JSON-Dateien, offline gecacht, Übernahme über den `parseProgram`-Pfad. |
| LF-3 | Herkunfts-Kennzeichnung: Ort und Wortlaut? | **ENTSCHIEDEN 17.07.:** Kleine Zeile „Offizielles Satzkraft-Programm" auf der Programmkarte in der Verwaltung; kein Kennzeichen im Training. |

### Paket M
| # | Frage | Vorschlag |
|---|---|---|
| MF-1 | Speicherort der Liste? | **ENTSCHIEDEN 17.07.:** Separate mitgelieferte JSON-Datei, offline gecacht (bei ~200 Übungen ohnehin geboten; konsistent mit LF-2). |
| MF-2 | Zielumfang je Bereich? | **ENTSCHIEDEN 17.07.:** ~200 Übungen: Gym 90, Calisthenics 40, Kettlebell 25, Functional 15, Core 15, Mobility 10, Cardio 5 (siehe M-E1, erweitert). |
| MF-3 | Qualitätssicherung der Technik-Hinweise und Video-Suchbegriffe? | **ENTSCHIEDEN 17.07.:** Komplette Liste als Review-Dokument (Formulierung durch Agenten nach `trainings_richtlinien`), Abnahme durch den Produktverantwortlichen vor Aufnahme in die App. |
| MF-4 | Startzeitpunkt des Recherche-Dokuments? | **ENTSCHIEDEN 17.07.:** Parallel zu Schritt 2–3 (reine Dokumentenarbeit, kein Code). Start am 17.07. freigegeben. |

### Paket N
| # | Frage | Vorschlag |
|---|---|---|
| NF-1 | Kostenmodell / „Bring your own AI" (aus N-E5). | **RICHTUNG ENTSCHIEDEN 17.07.:** BYO-AI ist die bevorzugte Richtung. **Ausdrücklicher Wunsch des Produktverantwortlichen:** Paket N bleibt bewusst ganz am Ende der Reihenfolge; das Detailkonzept (Ablauf, Kopiertext, Antwort-Einfügen, Fehlerfälle) wird **am Ende als eigener Chat/Termin** ausgearbeitet, bevor N startet. Keine N-Umsetzung ohne dieses Konzept und dessen Freigabe. |
| NF-2 | Übernahme-Pfad auf O4-Mechanik umstellen (statt H-Migration)? | **ENTSCHIEDEN 17.07.:** Ja – die Garantie „trainierte Wochen bleiben unberührt" wird vom Datenmodell erzwungen. |
| NF-3 | Schwelle für den proaktiven Hinweis? | **ENTSCHIEDEN 17.07.:** „Übung zweimal in Folge unter Zielbereich" als Startdefinition; Feinjustierung bei der N-Feinspezifikation. |

### Paket O
| # | Frage | Vorschlag |
|---|---|---|
| OF-1 | Definition „aktuelle Woche"? | **ENTSCHIEDEN 17.07.:** Automatisch abgeleitet – höchste Woche mit begonnener/abgeschlossener Einheit; sind dort alle Einheiten abgeschlossen, rückt die Folgewoche nach (bis zur Blocklänge); ohne Trainingsdaten Woche 1. Unabhängig von der Navigations-Auswahl (`S.week` bleibt reine Ansicht). |
| OF-2 | UI-Ort der Aktion „Werte korrigieren"? | **ENTSCHIEDEN 17.07.:** Auf abgeschlossenen Tageskarten anstelle des Start-Buttons (zusammen mit dem O6-Wegweiser). |
| OF-3 | Editor-Nachfrage bei Namensänderung: ab welcher Schwelle? | **ENTSCHIEDEN 17.07.:** Immer fragen, wenn der Name geändert wird UND bereits Werte existieren. Ein Tap mehr beim Tippfehler-Fix, dafür landet nie stillschweigend Historie an der falschen Übung. |
| OF-4 | Bestandsdaten beim O-Kern-Update? | **ENTSCHIEDEN 17.07.:** Nichts wird migriert – `fromWeek`/`untilWeek` fehlen bei Bestandsübungen (= gelten immer), Sperren und neue Aktionen greifen ab sofort, alte Lücken bleiben Lücken. |

---

## 9. Weg ins Briefing (Abschlusskriterien)

Erst wenn alle Punkte abgehakt sind, wird dieses Dokument als neuer Abschnitt („Großes Update: Pakete L–O") ins `BRIEFING-CODEX.md` übernommen und dort verbindlich:

1. [x] Alle offenen Fragen aus Abschnitt 8 entschieden und dokumentiert (GF, LF, MF, NF, OF) – erledigt 17.07.2026.
2. [x] Studio-Abnahme der vier L-Programme erfolgt (LF-1) – erledigt 17.07.2026.
3. [x] Paket N ausgeklammert (17.07.2026): kein Teil dieses Updates. NF-1-Detailkonzept (BYO-AI) als eigener Chat/Termin vor einem späteren N-Start.
4. [x] Feinspezifikationen der Releases 1–4 erstellt und freigegeben (17.07.2026), jeweils abgeglichen mit v0.22.3; Anker sind Funktionsnamen (Zeilen bei der Umsetzung neu verifizieren).
5. [x] Test- und Abnahmeplan je Release benannt (in den Feinspezifikationen: F6, L-F6, K-F8, M-F7).
6. [x] Reihenfolge und Release-Schnitt im Briefing verankert (`BRIEFING-CODEX.md` Abschnitt 18, 17.07.2026).
