# Briefing: Satzkraft – Architektur, Produktregeln und Umsetzungsstand bis v0.17.0

**An:** Umsetzenden Entwickler / Coding-Agent (Codex)
**Von:** App-Architektur (fortlaufend gepflegt seit Review Juli 2026, ursprüngliche Basis: Satzkraft v0.14.1)
**Aktueller Produktstand:** Satzkraft v0.17.0
**Ziel:** Verbindliche Architektur- und Produktregeln sowie den umgesetzten Stand festhalten. Die App bleibt bewusst einfach – nichts hinzufügen, was nicht in diesem Briefing oder einer aktuellen Nutzerentscheidung steht.

---

## 1. Projektkontext

Satzkraft ist eine deutschsprachige Krafttrainings-PWA, komplett lokal (localStorage), ohne Konten.

| Datei | Inhalt |
|---|---|
| `index.html` | Gesamte App: CSS, HTML-Gerüst, gesamte UI-Logik (~2500 Zeilen) |
| `js/progression.js` | Reines Progressions-/Coach-Modul (UMD, von UI getrennt) |
| `netlify/functions/coach.mjs` | Serverfunktion für den KI-Coach (Anthropic-API, Key nur serverseitig) |
| `sw.js` | Service Worker, Cache-Name enthält die App-Version |
| `tests/*.test.cjs / *.mjs` | Node-Tests (`node --test tests/`), schneiden Funktionen per String-Anker aus `index.html` |
| `CHANGELOG.md` | Verbindliche Versionshistorie; laufende Änderungen zuerst unter `Unreleased` |
| `TESTPROGRAMM-ALLE-SZENARIEN.json` | Valides Importprogramm für manuelle Tests aller wichtigen Übungs- und Editorvarianten |

Kernkonzepte im Datenmodell (intern): Programm = `categories` (Trainingsgruppen mit Standardwerten), `weeks` (Phasen `aufbau|intensiv|deload`, RIR, Satzzahlen je Kategorie), `days` mit `ex` (Übungen). Übung: `w` (weighted), `bw` (bodyweight = Zusatzgewicht), `unit` (`reps|seconds`), `sets`/`reps` als eigene Vorgabe, optional `wu`/`cd` (Warm-up/Cool-down, zeitbasiert, Whitelist `WUCD_LIB`). Externes Austauschformat: `format:"trainings-block"`, `version:2` (siehe `BLANK_TEMPLATE` und `parseProgram`).

---

## 2. Verbindliche Grundregeln (Guardrails)

1. **Ein-Datei-Architektur beibehalten.** Kein Build-Tool, keine Dependencies, kein Framework. Neuer Code im vorhandenen ES5-Stil (`var`, `function`, kompakte Schreibweise wie im Bestand).
2. **Alle Nutzertexte Deutsch, Du-Form**, Ton wie im Bestand (kurz, konkret, beruhigend bei Risiko-Aktionen).
3. **HTML-Ausgaben immer über `esc()` / `attr()`** escapen. Keine Ausnahmen.
4. **Datenkompatibilität ist heilig:**
   - localStorage-Key `cali-plan-v3` und `DATA_SCHEMA_VERSION` (4) nicht ändern.
   - Austauschformat `trainings-block` Version 2 nicht brechen. Neue Felder nur optional und abwärtskompatibel; alte Programme/Backups müssen weiter laden.
5. **`js/progression.js` nicht verändern.** Die Progressionslogik (doppelte Progression, Deload 0.6, Wiedereinstieg 0.925, RIR-Logik) ist geprüft und bleibt exakt so.
6. **Test-Anker nicht umbenennen/verschieben.** Die Tests schneiden `index.html` an diesen Funktionsnamen: `reportFinite`, `reportNumber`, `catReps`, `getSets`, `onSetInput`, `onSetChange`, `workoutProgress`, `stopWorkout`, `readBackupMeta`, `confirmBackupRestore`, `validBackupNumber`, `cloneJSON`, `openProgramEditor`, `editorTargetReps`, `editorExerciseMeta`, `editorMoveExerciseToGap`, `confirmEditorDeleteWeek`. Diese Funktionsnamen müssen als Strings erhalten bleiben und ihre relative Reihenfolge behalten.
7. **Versionierung und Historie:** Jede nutzerrelevante Änderung sofort unter `Unreleased` in `CHANGELOG.md` eintragen. Bei einem Release den Abschnitt auf die neue Version mit Datum umstellen und gleichzeitig `APP_VERSION` in `index.html` sowie `CACHE` in `sw.js` synchron erhöhen (Test `version.test.cjs` prüft das). Die CSS-Klassen `appversion` und `versionfoot` müssen im Quelltext weiter vorkommen – sie dürfen aber an anderer Stelle gerendert werden. Kein Release ohne Changelog-Eintrag.
8. **Nach jedem Arbeitspaket:** `node --test tests/` grün + manuelle Checks (Abschnitt 6). Tests bei geänderten Verhalten bewusst erweitern, nicht löschen.
9. **Ein Arbeitspaket = ein Commit** (bzw. eine zusammenhängende Änderung), Reihenfolge wie unten.

---

## 3. Arbeitspakete

### Paket A – Quick Wins (Import, Texte, Auswertung, Druck)

#### A1 · „Feld leeren“-Button im Import
- **Ist:** `renderImportEntry()` zeigt Textarea `#libpaste`; der Inhalt bleibt absichtlich über `importInputText` erhalten. Es gibt keinen Weg, das Feld schnell zu leeren.
- **Soll:** Kleiner Button „✕ Leeren“ in der Ecke der Textarea (z. B. Wrapper mit `position:relative`, Button absolut oben rechts). Klick leert Textarea, `importInputText` und `importSourceName`. Button nur sichtbar, wenn das Feld Inhalt hat (bei `input` togglen).
- **Akzeptanz:** Nach Leeren und erneutem Öffnen der Import-Ansicht ist das Feld leer; Dateiname-Anzeige im `importdrop` ist zurückgesetzt.

#### A2 · Veraltete Texte korrigieren
- **Ist:** Zwei Verweise auf UI, die es nicht mehr gibt:
  1. `ANLEITUNG.anleitung`: „*Danach in der App unter dem Ordner-Symbol bei '2 Programm laden' einfuegen.*“
  2. Modal bei `expcopy`: „*… dann unter „2 · Programm laden“ einfügen.*“
- **Soll:**
  1. Neu: „*Danach in der App unter 'Programme' -> 'Neues Programm erstellen' -> 'Fertiges Programm importieren' einfuegen.*“ (ASCII beibehalten wie im Bestand der ANLEITUNG).
  2. Neu: „*… jetzt einer KI geben oder selbst bearbeiten, dann über „Fertiges Programm importieren“ wieder einfügen.*“
- **Akzeptanz:** Keine Erwähnung von „Ordner-Symbol“ oder „2 · Programm laden“ mehr im gesamten Quelltext.

#### A3 · Auswertung: Kacheln reduzieren, Bestwert anzeigen
- **Ist:** 4 Summen-Kacheln (Einheiten, Trainingszeit, Arbeitssätze, bewegtes Gewicht). In `buildReportData` wird pro Übung `best` berechnet, aber nie angezeigt. Übungskarte zeigt „Erster Wert“ ohne Wochenangabe.
- **Soll:**
  1. Kachel **„Eingetragene Arbeitssätze“ ersatzlos entfernen** (3 Kacheln; CSS `rsummary` auf `repeat(3,…)`, Mobile-Breakpoint bleibt 2-spaltig).
  2. In `reportExerciseCard`: **Bestwert anzeigen** (z. B. als dritte Zeile oder Zusatz im Delta-Bereich: „Bestwert: 92,5 kg · W6“). Woche des Bestwerts mitliefern (in `buildReportData` neben `best` auch `bestWeek` erfassen).
  3. „Erster Wert“ → „Erster Wert · W{ersteWoche}“ (erste Woche mit Messpunkt ist `points[0].week`).
- **Akzeptanz:** Report zeigt 3 Kacheln; jede Übungskarte mit ≥1 Messpunkt zeigt Bestwert mit Woche; `report.test.cjs` erweitert um `best`/`bestWeek`.

#### A4 · Auswertung: Deload-Wochen verzerren den Übungstrend (Bug)
- **Ist:** `buildReportData` nimmt alle Wochen in die Messpunkte auf. In Deload-Wochen (~60 % Gewicht) stürzt das geschätzte 1RM ab → Sparkline zeigt Schein-Rückschritt; endet ein Block mit Deload, ist „Aktuell“ und das Delta falsch-negativ.
- **Soll:** Bei Übungen vom Typ `weight` (also `ex.w === true`) Wochen mit `program.weeks[w-1].phase === "deload"` **nicht als Messpunkt** aufnehmen. Für `reps`/`seconds`-Übungen bleibt alles wie bisher. `totalVolume`/`totalSets` weiterhin inkl. Deload zählen (echte Arbeit). Fußnote im Report ergänzen: „Deload-Wochen fließen nicht in den Übungstrend ein.“
- **Akzeptanz:** Testfall in `report.test.cjs`: gewichtete Übung mit Aufbau-Woche (100 kg) + Deload-Woche (60 kg) → `latest` bleibt der Aufbau-Wert, Delta nicht negativ.

#### A5 · Druckfunktion vereinfachen und fixen
- **Ist:** `printReport()` öffnet ein Popup, kopiert alle Styles per `document.write` und druckt dort. Fallback ist `window.print()` – der aber kaputt ist, weil `openReport()` `body.surface-locked` setzt (`position:fixed`) und das Print-CSS die Body-Position nicht zurücksetzt. Außerdem erzwingt das Print-CSS immer das komplette Trainingsprotokoll.
- **Soll:**
  1. **Popup-Weg komplett entfernen.** `printReport()` ruft direkt `window.print()` auf (Report ist bereits offen; das vorhandene `@media print`-CSS blendet `#app/#bar/#modal/#lib` aus und erzwingt Druckfarben – das reicht).
  2. Im `@media print`-Block ergänzen: `html,body,body.surface-locked{position:static!important;top:auto!important;overflow:visible!important;height:auto!important}` sowie `#wucd{display:none!important}`.
  3. **PDF-Dateiname:** vor `window.print()` `document.title` auf `PROG().name + " – Auswertung"` setzen und danach zurücksetzen (via `afterprint`-Event, mit `setTimeout`-Fallback).
  4. **Protokoll optional:** Die Regeln `.rdetails>summary{display:none}` und `.rdetails:not([open])>.rdetailsbody{display:block!important}` so ändern, dass der Protokoll-Inhalt **nur bei geöffnetem `<details>`** gedruckt wird (Summary im Druck weiterhin ausblenden). Summary-Text anpassen: „Vollständiges Trainingsprotokoll *(wird nur mitgedruckt, wenn geöffnet)*“.
- **Akzeptanz:** Drucken funktioniert ohne Popup aus dunklem und hellem Theme, mehrseitig, ohne abgeschnittenen Inhalt; Protokoll erscheint nur, wenn aufgeklappt; PDF-Vorschlagsname enthält den Programmnamen.

#### A6 · Kleine Text-/Hilfe-Korrekturen
1. Editor-Speichern-Button: „Sicher als Kopie speichern“ → **„Als Kopie speichern“**.
2. Die drei Editor-Hilfeboxen (`edguide`): **Nummern-Kreise (1/2/3) entfernen** – die Tabs Training/Wochen/Details sind gleichrangig, keine Schrittfolge. Titel + Text bleiben.
3. Legende unten in der Trainingsansicht (`.legend` in `renderView`) **eindampfen** auf: `<b>Satzkraft v{VERSION}</b> · Deine Trainingsdaten bleiben lokal auf diesem Gerät.` (Die Button-Erklärung „Oben rechts: Programme … Auswertung …“ entfällt.)
- **Akzeptanz:** Keine Schritt-Nummern in den edguide-Boxen; Legende einzeilig.

#### A7 · Doppelte Workout-Steuerung entfernen
- **Ist:** Während des Trainings zeigen **oberes Panel** (`workoutPanelHtml`: Zeit + „Zeit pausieren“ + „Beenden“) und **untere Leiste** (`renderBar`: Zeit + „Pause“ + „Ende“) identische Funktionen doppelt.
- **Soll:** Oberes Panel komplett entfernen (`workoutPanelHtml`, `updateWorkoutPanel` und Aufrufe). Das Info-Panel `sessionlock` (Woche/Tag) bleibt. Die untere Leiste ist die einzige Steuerung. Der Hinweis „Satzwerte können weiter bearbeitet werden“ (Pausenzustand) wandert als kleine Zeile in die untere Leiste oder entfällt.
- **Akzeptanz:** Im laufenden Training existiert genau eine Zeitanzeige und ein Satz Steuerbuttons; Pause/Fortsetzen/Beenden funktionieren unverändert (inkl. Timer-Intervall, das bisher `wtElapsed` UND `barWtElapsed` aktualisiert – Reste bereinigen).

---

### Paket B – Editor für Laien

#### B1 · „Übungstyp“-Auswahl statt Checkbox-Kombination
- **Ist:** Übungs-Einstellungen bestehen aus Dropdown „Was wird eingetragen?“ (reps/seconds) + Checkbox „Gewicht erfassen“ + Checkbox „Körpergewicht + Zusatzgewicht“. Nutzer verstehen die Kombinationen nicht.
- **Soll:** Ein Select **„Übungstyp“** mit vier Optionen, das `weighted`/`bodyweight`/`unit` intern setzt:
  1. **„Mit Gewicht (Hantel, Maschine)“** → `weighted:true`, kein `bodyweight`, `unit:"reps"`. Felder Startgewicht + Steigerung sichtbar.
  2. **„Nur Körpergewicht (z. B. Liegestütze)“** → kein `weighted`, `unit:"reps"`.
  3. **„Körpergewicht + Zusatzgewicht (z. B. Klimmzüge mit Gürtel)“** → `weighted:true`, `bodyweight:true`. Felder Startgewicht („Zusatzgewicht in kg, 0 = ohne“) + Steigerung sichtbar. Hilfetext: „Eingetragen wird nur das Zusatzgewicht.“
  4. **„Halten auf Zeit (z. B. Plank)“** → `unit:"seconds"`, kein `weighted`.
  - Beim Typwechsel sinnvolle Defaults setzen/entfernen (wie bisher der `weighted`-Toggle: `increment` 2.5, `startWeight` 0, beim Abwählen Felder löschen).
  - **Sonderfall:** Existierende Übungen mit exotischer Kombination (z. B. `weighted` + `unit:"seconds"`) bekommen eine fünfte, nur dann sichtbare Option „Individuell (aktuelle Einstellung)“, die nichts verändert – nichts darf beim bloßen Öffnen des Editors kaputtgehen.
  - Austauschformat bleibt unverändert (das Select ist reine UI über den bestehenden Feldern).
- **Akzeptanz:** Die zwei Checkboxen und das Einheiten-Dropdown sind durch das eine Typ-Select ersetzt; alle vier Typen speichern korrekt und laden identisch wieder; `program-editor.test.cjs` / `exercise-prescription.test.cjs` grün (ggf. erweitern).

#### B2 · Warm-up & Cool-down im Editor bearbeitbar
- **Ist:** Import/Export und Trainingsansicht unterstützen `warmup`/`cooldown` (Whitelist `WUCD_LIB`, 15–180 s, max. 8 Einträge, Validierung `validTimedBlock`). Der Editor zeigt nur „bleibt erhalten“, bearbeiten geht nicht.
- **Soll:** Im Tab „Training“ pro Tag ein aufklappbarer Bereich (Stil `edadvanced`) **„Warm-up & Cool-down“** mit zwei Listen:
  - Eintrag = Select (Übungsname aus `WUCD_LIB.warmup` bzw. `.cooldown`) + Zahlenfeld Sekunden (15–180) + Löschen-Button.
  - „+ Eintrag“-Button (deaktiviert ab 8), Reihenfolge per „Nach oben/unten“-Buttons (kein Drag nötig).
  - Kurzer Hilfetext: „Rein zeitbasiert, geführt mit Timer. Übungen stammen aus einer festen Liste.“
  - Änderungen laufen über den bestehenden Undo-Mechanismus (`editorPushUndo`).
- **Akzeptanz:** Warm-up/Cool-down anlegen, ändern, löschen; nach Speichern erscheinen die Buttons „Warm-up starten“/„Cool-down starten“ in der Trainingsansicht; Validierung greift beim Speichern (parseProgram).

#### B3 · (Optional, wenn Zeit) Live-Vorschau
- Unter der geöffneten Übung im Editor eine kompakte Vorschau der Trainingskarte („So sieht das im Training aus“): Tag-Farbe, Name, Vorgabe-Zeile (Sätze · Wdh/Sek · Ziel · Pause). Nur Anzeige, keine Interaktion.

---

### Paket C – Programm-Erstellung / KI-Flows

#### C1 · Externe-KI-Ansicht: drei echte Schritte + Kombi-Button
- **Ist:** `renderExternalAiCreate()` hat „1 · Vorlage holen“ → unnummerierter Export-Block → „2 · Ergebnis zurückladen“. Der eigentliche Hauptschritt (KI beauftragen) fehlt; was man der KI schreiben soll, steht nirgends.
- **Soll:** Umbau auf drei nummerierte Blöcke:
  1. **„1 · Auftrag + Vorlage kopieren“** – neuer Primär-Button **„Auftrag + Vorlage kopieren“**, der folgenden Text UND das Template in einem Kopiervorgang in die Zwischenablage legt (danach Bestätigungs-Modal wie bei `tplcopy`):

     ```
     Du bist ein erfahrener Krafttrainings-Coach. Erstelle mir ein Trainingsprogramm
     im Format der folgenden Vorlage (JSON). Halte dich exakt an Struktur, Feldnamen
     und die erlaubten Werte aus "_anleitung" – erfinde keine neuen Felder. Beachte
     die Trainings-Richtlinien in der Vorlage. Antworte NUR mit dem fertigen JSON,
     ohne Text davor oder danach.

     Meine Wünsche:
     - Ziel: [z. B. Muskelaufbau]
     - Trainingstage pro Woche: [z. B. 3 – Mo/Mi/Fr]
     - Dauer pro Einheit: [z. B. 60 min]
     - Equipment: [z. B. Langhantel, Kurzhanteln, Klimmzugstange]
     - Erfahrung: [z. B. 1 Jahr]
     - Einschränkungen: [z. B. keine]

     VORLAGE:
     {…BLANK_TEMPLATE als JSON…}
     ```
     Daneben sekundär: „Nur Vorlage kopieren“ und „Vorlage als Datei“.
  2. **„2 · Bei der KI einfügen und Wünsche ausfüllen“** – reiner Hinweistext: „Füge alles bei ChatGPT, Claude oder einer anderen KI ein und ersetze die Platzhalter in ‚Meine Wünsche‘.“
  3. **„3 · Ergebnis importieren“** – bestehender Button „Zum Import“.
- Der Block „Bestehendes Programm als Ausgangspunkt“ wird hier **entfernt** (siehe C3); stattdessen einzeiliger Hinweis: „Du willst dein aktuelles Programm umbauen lassen? Kopiere es unter Programme → Exportieren & Teilen.“
- **Akzeptanz:** Kompletter Flow ohne Vorwissen durchführbar: kopieren → bei KI einfügen → Ergebnis importieren.

#### C2 · Benennung im Erstellen-Hub
- „Externe KI + Vorlage“ → **„Mit ChatGPT & Co. erstellen“**, Untertext: „Auftrag und Vorlage kopieren, bei einer beliebigen KI einfügen, Ergebnis importieren.“
- „Fertiges Programm importieren“ behält den Namen; Untertext: „Programm-Datei oder kopiertes JSON einfügen. Satzkraft prüft alles vor dem Speichern.“

#### C3 · Export & Teilen aus dem Erstellen-Flow in die Bibliothek verschieben
- **Ist:** „Aktuelles kopieren / Als Datei / Link teilen“ (`expcopy`, `expfile`, `explink`) sind nur unter „Neues Programm → Externe KI“ auffindbar – wer nur teilen will, findet sie nie.
- **Soll:** In `renderLib()` eine eigene Sektion **„Exportieren & Teilen“** (Stil wie „Daten sichern“), bezogen auf das aktive Programm, mit den drei bestehenden Buttons und einem Satz Erklärung („Als Datei oder Link – ohne deinen Fortschritt.“). Die Button-Handler existieren bereits und bleiben unverändert.
- **Akzeptanz:** Teilen/Export in max. 2 Taps ab Hauptansicht erreichbar (Programme → Exportieren & Teilen).

#### C4 · Trainings-Richtlinien in die KI-Vorlage
- **Ist:** `ANLEITUNG` erklärt nur das Dateiformat. Externe KIs bekommen keinerlei trainingswissenschaftliche Leitplanken (der interne Coach in `coach.mjs` hat sie im System-Prompt).
- **Soll:** Neues Feld `ANLEITUNG.trainings_richtlinien` (ASCII-Schreibweise wie die übrigen ANLEITUNG-Texte) mit genau diesem Inhalt:
  ```
  trainings_richtlinien: [
   "Blockaufbau: 2-3 Aufbauwochen, dann 1 Deload-Woche. Laengere Blöcke danach mit Intensivierungswochen fortsetzen. Die letzte Woche eines Blocks ist idealerweise ein Deload.",
   "Anstrengung (rir) ueber den Block absenken: Aufbau 3 -> 2, Intensiv 2 -> 1, Deload 4-5.",
   "Volumen: etwa 10-20 Arbeitssaetze pro Muskelgruppe und Woche, Einsteiger in der unteren Haelfte. Deload: etwa halbe Satzzahl.",
   "Uebungszahl an der Einheitsdauer ausrichten: ~45 min = 4-5 Uebungen, ~60 min = 5-7, ~90 min = 7-9.",
   "Wiederholungsbereiche: schwere Grunduebungen 3-7, Hypertrophie 6-12, Isolation eher 10-15.",
   "Grunduebungen an den Anfang des Tages. Druck- und Zuguebungen sowie Ober-/Unterkoerper ausgewogen verteilen.",
   "Startgewichte konservativ waehlen (lieber zu leicht als zu schwer); nur angegebenes Equipment verwenden.",
   "Bei genannten Einschraenkungen sichere Alternativen waehlen; keine Uebung doppelt am selben Tag."
  ]
  ```
- Optional-Check: `coach.mjs`-System-Prompt auf Widersprüche zu diesen Richtlinien prüfen (inhaltlich angleichen, nicht umschreiben).
- **Akzeptanz:** `BLANK_TEMPLATE._anleitung.trainings_richtlinien` ist im kopierten Template enthalten; `parseProgram` ignoriert `_anleitung` weiterhin (tut es bereits).

---

### Paket D – Training: Halte-Timer & Fokus

#### D1 · Halte-Timer für Zeit-Übungen
- **Ist:** Bei `unit:"seconds"`-Übungen (Plank, L-Sit …) tippt man Sekunden von Hand ein; es gibt keinen Timer für den Satz selbst. Vorhandene Bausteine: untere Leiste (`renderBar` mit `restPhase`-Zustandsmaschine), Piep (`beep()`), Vibration, Wake Lock.
- **Soll:** Neuer Modus der unteren Leiste („Halten“), analog zur Satzpause implementiert (neuer Phasenwert, z. B. `restPhase==="hold"`; gleiche Sperr-/Fokuslogik wie `startRest`):
  - **Auslöser:** Bei Zeit-Übungen erhält die Karte im aktiven Training zusätzlich zum Pause-Button einen Button **„⏱ Halten starten (Satz N)“** für den ersten offenen Satz (gleiche Freigabelogik wie `canStartRest`).
  - **Mit Zielbereich** (aus `catReps`/`ex.reps`, z. B. 30–60 s): Stoppuhr zählt **hoch**; Fortschrittsbalken füllt sich bis zum Maximum; beim Erreichen des Minimums wechselt die Farbe auf Grün („Zielbereich erreicht“), beim Maximum Piep + Vibration. Zählt danach weiter, bis der Nutzer stoppt.
  - **Ohne Zielbereich** („so lange wie möglich“): Stoppuhr zählt hoch; daneben steht der bisherige Bestwert der Übung („Bestwert: 42 s“, aus `S.logs` ermitteln – Maximum aller eingetragenen Sekunden dieser Übung).
  - **Buttons:** „Stopp & eintragen“ (schreibt die gemessenen ganzen Sekunden in das Satz-Eingabefeld und löst die normale `onSetInput`-Verarbeitung aus) und „Abbrechen“ (verwirft).
  - **Nach „Stopp & eintragen“:** direkt in die normale Satzpause der Übung übergehen (`startRest`), sofern noch offene Sätze existieren – Kette: Halten → Piep → Pause → nächster Satz.
- **Akzeptanz:** Wert landet im richtigen Satz, Satzreihe wird grün, Coach-Empfehlung aktualisiert sich, Pause startet automatisch; Halten und Satzpause können nie gleichzeitig laufen; funktioniert im Dunkel- und Hellmodus.

#### D2 · Erledigte Übungskarten einklappen
- **Ist:** Abgehakte Übungen bleiben im laufenden Training in voller Kartengröße stehen → viel Scrollen.
- **Soll:** Im **aktiven Training** rendern erledigte Übungen (`isDone`) als kompakte Zeile: Kategorie-Tag, Name, grünes ✓, Button „Öffnen“. Antippen klappt die volle Karte wieder auf (transienter Zustand, z. B. Set expandierter IDs; kein Persistieren). Außerhalb des Trainings bleibt alles wie heute (volle Karten).
- **Akzeptanz:** Ein 6-Übungen-Tag mit 4 erledigten Übungen ist deutlich kürzer; Aufklappen/Ändern der Werte funktioniert weiter (inkl. Korrektur-Flow).

---

### Paket E – Design-Politur

#### E1 · SVG-Icons statt Unicode-Symbole
- **Ist:** UI nutzt Unicode-Glyphen (⏱ ▶ ■ ⏸ ✎ ↗ ↓ ✦ ✕ ‹ ↶), die je Plattform unterschiedlich (teils als Emoji) rendern.
- **Soll:** Kleines Inline-SVG-Icon-Set (Funktion `icon(name)` die einen SVG-String liefert; `currentColor`, 1 Strichstärke, ~16–20 px): play, pause, stop, timer, plus, check, close, chevron-left, chevron-right, undo, edit, external, download, sparkle. Alle Buttons/Labels umstellen; `aria-label`s bleiben erhalten. Keine Emoji mehr in Buttons (in reinen Texten wie „💪“ im Modal-Titel okay, wenn gewollt).
- **Akzeptanz:** Einheitliches Icon-Rendering in Chrome/Safari, hell und dunkel.

#### E2 · Schriftgrößen in der Trainingsansicht
- **Soll (moderat, nur trainingsrelevante Elemente):** `.presc` 12→13 px, `.last` 11→12 px, `.rec` 12→13 px, `.exname` 14→15 px, `.editnote` 11→12 px. Layout-Prüfung auf 375-px-Viewport (kein Umbruch-Chaos in der Vorgabe-Zeile).

#### E3 · Kopfzeile aufräumen
- **Ist:** Oben rechts vier Elemente: Versions-Chip, Theme-Umschalter, „Programme“, „Auswertung“.
- **Soll:** Versions-Chip und Theme-Umschalter aus der Kopfzeile in die Programm-Ansicht (`renderLib`) verschieben (Chip z. B. neben die Überschrift „Programme“, Theme-Button darunter oder in eine Zeile mit dem Chip). Kopfzeile enthält nur noch **Programme** und **Auswertung**. **Achtung:** Klassen `appversion`/`versionfoot` müssen im Quelltext vorkommen (Test) – Chip in `renderLib` weiterhin mit `class="appversion"` rendern.
- **Akzeptanz:** `version.test.cjs` grün; Theme-Wechsel funktioniert aus der Programm-Ansicht (Re-Render beachten: nach Toggle `renderLib()` erneut aufrufen oder Button-Label im DOM aktualisieren).

#### E4 · Micro-Feedback beim Satz-/Übungsabschluss
- **Soll (nur CSS):** Beim Wechsel auf `.srow.full` kurzer Hintergrund-Puls; beim Wechsel auf `.chk.done` kurze Scale-Pop-Animation (~200 ms, `@keyframes`, keine JS-Änderung außer ggf. Klassen-Retrigger). Dezent halten.

---

## 4. Explizite Nicht-Ziele (nicht bauen!)

- Kein Körpergewichts-Profil / keine Körperdaten-Erfassung.
- Keine Muskelgruppen-Analytik, Heatmaps, Kalender, Streaks, Badges, Gamification.
- Keine Supersätze/Zirkel, keine Cardio-Einheiten (Meter/Kalorien) – bewusste Grenzen der Struktur.
- Keine neuen Auswertungs-Diagrammtypen oder wählbare Zeiträume.
- Keine Änderungen an `js/progression.js` oder an der Progressionsmathematik.
- Keine Konten/Sync (siehe AUSBAUPLAN.md – spätere Ausbaustufe).

---

## 5. Historische Reihenfolge & Versionierung

Die folgende Zuordnung dokumentiert den ursprünglichen Umsetzungsplan für v0.15.x. Die tatsächliche und fortan verbindliche Versionshistorie steht in `CHANGELOG.md`.

1. Paket A → Release **v0.15.0**
2. Paket B → v0.15.1
3. Paket C → v0.15.2
4. Paket D → v0.15.3
5. Paket E → v0.15.4

Jeweils `APP_VERSION` + `sw.js`-`CACHE` synchron erhöhen. B3 (Live-Vorschau) ist optional und darf entfallen.

## 6. Abnahme-Checkliste (nach jedem Paket manuell)

1. `node --test tests/` – alle Tests grün (bei Verhaltensänderung Tests erweitert, nicht entfernt).
2. Frisches Profil (localStorage leeren): App startet mit Standardprogramm, Training starten → Sätze eintragen → Pause-Timer → Training beenden → Eintrag im Verlauf.
3. Bestehende Daten: v0.14.1-Backup einspielen → lädt fehlerfrei, Fortschritt vorhanden.
4. Import-Flow: Vorlage kopieren → einfügen → Prüfen & Vorschau → „Nur speichern“ und „Speichern & aktivieren“.
5. Editor: Programm bearbeiten → als Kopie speichern → Original unverändert; „Original ersetzen“ mit Sicherheitsabfrage.
6. Auswertung öffnen → Drucken/PDF aus dunklem und hellem Theme (Desktop-Browser), Protokoll zu/auf.
7. Hell-/Dunkelmodus: alle neuen UI-Elemente in beiden Themes prüfen (Light-Theme-Overrides in CSS ergänzen!).
8. Viewport 375 px (iPhone SE/Mini): keine abgeschnittenen Buttons, Editor und Import bedienbar.

---

## 7. Status-Update (Architektur-Review, Stand v0.15.4)

Pakete A–E wurden geprüft und sind **umgesetzt und abgenommen** (B3 Live-Vorschau ist wie erlaubt entfallen). Aus dem ersten Nutzertest (Feedback des Betreibers + eines Test-Nutzers mit importiertem Programm ohne voreingestellte Arbeitsgewichte) ergibt sich **Paket F**. Ziel-Version: **v0.16.0**.

**Vom Produktverantwortlichen final entschieden (nicht erneut zur Diskussion stellen):** F3 Einklappen bleibt, mit beidseitigem Toggle. F6 Auto-Pause ist fest eingebaut, ohne Einstellungs-Schalter. F5 füllt mit dem oberen Ende des Wiederholungsbereichs (`rr[1]`, wie Platzhalter und Stepper).

---

## Paket F – Feedback-Runde 1 (Bugfixes + Trainings-Flow + Editor-Verständlichkeit)

### F1 · Editor: Verschiebe-Griff bei geöffneter Übung ausblenden
- **Ist:** In `renderEditorTraining` wird der Drag-Griff (`.eddrag`, `data-ed-drag-ex`) auch gerendert, wenn die Übung zum Bearbeiten geöffnet ist (`isOpen`). Beim Bearbeiten ist Verschieben nicht nötig und der Griff irritiert.
- **Soll:** Bei `isOpen` den Griff **nicht rendern** (nicht nur per CSS verstecken). Verschieben bleibt über die geschlossene Karte und die „Nach oben/unten“-Buttons in der geöffneten Übung möglich.
- **Akzeptanz:** Geöffnete Übung zeigt nur „Schließen“; geschlossene Karten behalten den Griff; Drag funktioniert weiter.

### F2 · Editor-Bug: Warm-up/Cool-down-Bereich klappt bei jeder Aktion zu
- **Ist:** Der Bereich liegt in `<details class="edadvanced">`. Die Handler `data-ed-wucd-add/-delete/-move` rufen `renderProgramEditor(...)` auf – das komplette Neu-Rendern verliert den `open`-Zustand, das Fenster klappt nach jedem Eintrag zu.
- **Soll:** Offen-Zustand der aufklappbaren Editor-Bereiche über Re-Renders erhalten. Empfohlene Umsetzung: Zustandsobjekt `editorOpenSections` (z. B. `{wucd:true}`); die `<details>`-Elemente bekommen `data-ed-section="wucd"` (analog für „Satzzahlen der Trainingsgruppen“ und „Trainingsgruppen“ im Details-Tab), ein `toggle`-Listener auf `#lib` aktualisiert das Objekt, beim Rendern wird `open` daraus gesetzt. Bei Tab-/Tag-Wechsel darf der Zustand erhalten bleiben (nicht zurücksetzen nötig).
- **Akzeptanz:** Eintrag hinzufügen/verschieben/löschen im Warm-up → Bereich bleibt offen; gleiches für Satzzahlen- und Trainingsgruppen-Bereich.

### F3 · Training: Eingeklappte erledigte Übungen wieder einklappbar
- **Ist:** Erledigte Übungen werden im aktiven Training kompakt gerendert; „Öffnen“ (`data-expand-done`) setzt `expandedDoneExercises[id]=true` – es gibt aber **keinen Weg zurück** zum kompakten Zustand.
- **Soll:** Die aufgeklappte, erledigte Karte erhält im Kopf (neben dem Haken) einen Button **„Einklappen“** (`data-collapse-done`), der `expandedDoneExercises[id]` löscht und die Karte kompakt neu rendert. Nur sichtbar, wenn `active() && done`.
- **Produkthinweis:** Das Feature bleibt vorerst; sollte es sich weiterhin nicht bewähren, ist die Entfernung bewusst trivial gehalten (eine Bedingung in `exCardHtml`).
- **Akzeptanz:** Öffnen ↔ Einklappen beliebig oft; Werte-Korrektur in aufgeklapptem Zustand funktioniert weiter.

### F4 · Training-Bug: „0 kg“ wird automatisch eingetragen und stört die Eingabe
- **Ist:** `onSetInput` füllt beim Eintragen der Wiederholungen das Gewichtsfeld automatisch mit `round(targetWeight(ex))` – auch wenn das **0** ist (Programme ohne voreingestellte Startgewichte). Die „0“ muss dann manuell gelöscht werden, bevor man sein Gewicht eintippen kann. Zusätzlich zeigt die Vorgabe-Zeile bei `tw===0` fälschlich „Körpergew.“ auch für normale Gewichtsübungen.
- **Soll:**
  1. Auto-Ausfüllen des Gewichts **nur wenn `planned > 0`**.
  2. **Fokus-Selektion:** `focusin`-Listener auf `#app`: Bei Satz-Eingabefeldern (`rep-`/`wt-`) mit vorhandenem Wert im aktiven Training den Inhalt per `t.select()` markieren – Tippen ersetzt dann den alten Wert (betrifft auch die lästige „0“).
  3. Vorgabe-Zeile: `Ziel`-Anzeige bei `tw===0` → „Körpergew.“ nur wenn `ex.bw`, sonst „—“.
- **Akzeptanz:** Übung mit `startWeight:0` (nicht bodyweight): Wdh. eintragen → Gewichtsfeld bleibt leer; Feld mit „0“ antippen und „80“ tippen → ergibt „80“.

### F5 · Training: Wiederholungen automatisch übernehmen, wenn zuerst Gewicht eingetragen wird
- **Ist:** Wdh. zuerst → Gewicht wird automatisch gefüllt. Umgekehrt nicht: Wer (wie der Test-Nutzer) nur das Gewicht anpasst, muss die Wiederholungen jedes Mal von Hand eintragen.
- **Soll:** Symmetrisches Verhalten in `onSetInput`: Wird im aktiven Training ein **Gewicht** eingetragen und das Wdh.-Feld des Satzes ist leer, wird es mit dem oberen Ende des Wiederholungsbereichs gefüllt (`rr[1]`, entspricht dem Platzhalter). Gibt es keinen Bereich (`rr==null`), nichts füllen. Gefüllten Wert im Input-Feld sichtbar machen (analog zur bestehenden Gewichts-Logik).
- **Akzeptanz:** Bei einer Übung mit Bereich 8–12 nur „80“ ins Gewicht tippen → Wdh. springt auf 12, Satz ist vollständig; Wert bleibt normal editierbar.

### F6 · Training: Satzpause automatisch starten
- **Ist:** Nach vollständigem Satz muss die Pause separat gestartet werden („Pause starten“ bzw. „Nächste Satzpause“). Wunsch der Nutzer: Pause startet von selbst.
- **Soll:** Konstante `AUTO_REST_DELAY=2000`. Wenn im aktiven Training ein Satz durch Eingabe (Tippen oder Stepper) von unvollständig auf **vollständig** wechselt:
  - Timer über 2 s starten; jede weitere Eingabe in derselben Übung innerhalb der Frist setzt den Timer zurück; wird der Satz wieder unvollständig, abbrechen.
  - Nach Ablauf: Satzpause der Übung automatisch starten – exakt wie der manuelle Button (`startRest`), inkl. aller bestehenden Guards (`canStartRest`).
  - Gilt auch in der „set“-Phase der Pausen-Leiste (ersetzt dort das manuelle „Nächste Satzpause“; der Button bleibt als sofortige Alternative).
  - **Nicht** auto-starten: wenn es der letzte offene Satz der Übung war (Übung fertig – `canStartRest` verhindert das ohnehin), wenn bereits eine Pause/ein Halten läuft, oder außerhalb des aktiven Trainings.
- **Akzeptanz:** Satz per Gewichtseingabe vervollständigen (mit F5) → nach ~2 s startet die Pause von allein; schnelles Weitertippen innerhalb der 2 s startet nichts; manueller Start bleibt jederzeit möglich; `training-flow.test.cjs` um den Übergang erweitern, soweit ohne DOM testbar.

### F7 · Training: Scrollen während der Pause erlauben
- **Ist:** Beim Pausen-Countdown wird `body.rest-lock` gesetzt (`position:fixed`, Scroll gesperrt) und alle anderen Übungen werden auf 14 % Deckkraft gedimmt – man kann während der Pause nicht nachsehen, was noch aussteht (explizites Nutzer-Feedback).
- **Soll:**
  1. **Scroll-Sperre entfernen:** `focusRest` scrollt weiterhin zur Karte und setzt den Fokus-Rahmen, aber ohne `position:fixed`/Scroll-Lock (zugehörige Aufräumlogik in `clearRestFocus` anpassen).
  2. **Dimmen abmildern:** andere Karten während der Pause auf ca. 55 % Deckkraft ohne Blur (`body.rest-lock .ex:not(.rest-focus)` anpassen; Klassennamen ggf. in `rest-mode` umbenennen, da kein Lock mehr).
  3. Eingabesperren (`applyLocks`) bleiben unverändert – lesen ja, versehentlich tippen nein.
- **Akzeptanz:** Während laufender Pause kann frei gescrollt werden; die fokussierte Übung bleibt klar hervorgehoben; nach Pausenende kein Scroll-Sprung.

### F8 · Zeit-Übungen: Minuten statt langer Sekundenwerte anzeigen
- **Ist:** Zeit-Übungen zeigen überall rohe Sekunden („900 Sek“) – bei langen Einheiten (Stairmaster, Cardio-Halten) unleserlich (explizites Nutzer-Feedback).
- **Soll:** Anzeige-Helfer `fmtSeconds(s)`: unter 120 s → `"90 Sek"`; ab 120 s → Minuten (`"15 min"` bei vollen Minuten, sonst `"2:30 min"`). Einsatzorte: Vorgabe-Zeile (`presc`), „Zuletzt“-Zeile, Verlaufs-Tabelle (`exHistory`/`showHistory`), Auswertung (Übungskarten + Protokoll), Halte-Timer-Ziele (`holdSub`), `editorExerciseMeta`. **Eingabe bleibt in Sekunden** (kein Formatwechsel!); im Editor unter den Min./Max.-Feldern bei Zeit-Übungen Hilfstext ergänzen: „Angabe in Sekunden (900 = 15 min)“.
- **Akzeptanz:** Übung mit Bereich 780–900 zeigt „13–15 min“; Bereich 30–60 weiterhin „30–60 Sek“; gespeicherte Daten unverändert (nur Darstellung).

### F9 · Editor: Info-Knöpfe + überarbeitete Anleitung
- **Ist:** Fachbegriffe (Trainingsgruppe, RIR, Phase …) werden Laien nirgends am Ort der Einstellung erklärt; die Editor-Anleitung (`showEditorHelp`) nummeriert die Tabs als Schritte und erwähnt die neuen Funktionen (Übungstyp, Warm-up/Cool-down) nicht.
- **Soll:**
  1. **Info-Knopf-Muster:** kleiner runder ⓘ-Button (`.infobtn`, eigenes SVG-Icon `info`, min. 24 px Touch-Fläche, `aria-label="Erklärung: …"`) neben dem Label der jeweiligen Einstellung; Klick öffnet `showModal(titel, text, [OK])`. Zentrale Map `EDITOR_INFO={key:{t:…,m:…}}`, Buttons mit `data-info="key"`, ein Handler.
  2. **Folgende Info-Texte wörtlich übernehmen** (Titel / Text):
     - `gruppe` · **Trainingsgruppe** / „Eine Trainingsgruppe fasst ähnliche Übungen zusammen und gibt ihnen gemeinsame Standardwerte: Wiederholungsbereich, Satzpause und Farbe. Beispiel: Alle ‚Kraft‘-Übungen nutzen 5–7 Wiederholungen und 2,5 Minuten Pause. So stellst du das einmal ein statt bei jeder Übung einzeln. Eine Übung kann diese Werte mit einer ‚Eigenen Vorgabe‘ überschreiben.“ → an „Trainingsgruppe“ (geöffnete Übung) und an der Überschrift „Trainingsgruppen“ im Details-Tab.
     - `typ` · **Übungstyp** / „Legt fest, was du im Training einträgst. Mit Gewicht: volle kg-Angabe (Hantel, Maschine). Nur Körpergewicht: nur Wiederholungen. Körpergewicht + Zusatzgewicht: du trägst nur das Extra-Gewicht ein (z. B. Dip-Gürtel), 0 kg heißt ohne Zusatz. Halten auf Zeit: Sekunden statt Wiederholungen (z. B. Plank).“
     - `rir` · **Anstrengung (RIR)** / „RIR heißt ‚Reps in Reserve‘: wie viele saubere Wiederholungen du am Satzende noch schaffen könntest. RIR 2 bedeutet: aufhören, wenn noch etwa 2 gehen würden. Je kleiner die Zahl, desto härter die Woche. Erholungswochen nutzen RIR 4–5.“
     - `phase` · **Wie soll trainiert werden?** / „Aufbau: normal trainieren und Gewichte schrittweise steigern. Intensiv: schwerer, meist weniger Wiederholungen – für spätere Wochen im Block. Erholungswoche: bewusst leichter (etwa 60 % Gewicht, weniger Sätze), damit der Körper den Fortschritt verarbeitet. Üblich sind 2–3 Aufbauwochen, dann 1 Erholungswoche.“
     - `vorgabe` · **Eigene Vorgabe** / „Normalerweise bekommt die Übung Sätze und Wiederholungen von ihrer Trainingsgruppe und der jeweiligen Woche. Mit einer eigenen Vorgabe legst du beides nur für diese Übung fest – gleich in allen Wochen.“
     - `gewicht` · **Startgewicht & Steigerung** / „Startgewicht: damit beginnt Woche 1 – lieber zu leicht als zu schwer. Steigerung: um so viele kg erhöht die App, wenn du alle Sätze am oberen Wiederholungsende schaffst. Üblich: 2,5 kg bei Langhanteln, 1–2 kg bei Kurzhanteln.“
     - `wucd` · **Warm-up & Cool-down** / „Optionale geführte Timer vor und nach dem Training – rein zeitbasiert, nichts einzutragen. Die Übungen stammen aus einer festen Liste, damit die Timer-Ansicht sie kennt.“
  3. **`showEditorHelp` neu** (Titel „So funktioniert der Editor“): „<b>Training:</b> Hier baust du die Trainingstage. Tag oben auswählen, Übung mit ‚Bearbeiten‘ öffnen, Werte einstellen. Reihenfolge ändern: Punkt-Griff rechts halten und ziehen – oder ‚Nach oben/unten‘ in der geöffneten Übung. Einen Tag verschiebst du, indem du ihn in der Wochenleiste hältst und auf einen anderen Wochentag ziehst.<br><br><b>Wochen:</b> Jede Woche hat einen Schwerpunkt (Aufbau, Intensiv, Erholung) und eine Anstrengung (RIR). Die Satzzahlen der Trainingsgruppen brauchst du nur, wenn Wochen unterschiedlich viele Sätze haben sollen.<br><br><b>Details:</b> Name, Beschreibung und die Trainingsgruppen des Programms.<br><br><b>Überall gilt:</b> ⓘ-Knöpfe erklären die jeweilige Einstellung. ‚Rückgängig‘ oben nimmt jeden Schritt zurück. Mit ‚Als Kopie speichern‘ bleiben Original und bisheriger Fortschritt unangetastet.“
- **Akzeptanz:** Jeder ⓘ-Knopf öffnet den richtigen Text; Tastatur-bedienbar; Light-Theme-Styles vorhanden; keine Layout-Sprünge in den `edgrid`-Zeilen.

### F10 · Programme ohne voreingestellte Arbeitsgewichte (Kalibrierungswoche)
- **Kontext:** Gewichtsübungen mit `startWeight:0` (ohne `bodyweight`) sind legitim – z. B. übersetzte/importierte Programme, bei denen der Autor die Gewichte nicht kennt. Die Architektur trägt das bereits: Die Progression rechnet ab der ersten vollständig eingetragenen Einheit mit dem tatsächlich gehobenen Gewicht weiter; das Startgewicht ist nur der Einstiegspunkt. Was fehlt, ist die Kommunikation und Komfort in der ersten Einheit. Drei Ergänzungen (bauen auf F4 auf):
  1. **Kalibrier-Hinweis auf der Übungskarte:** Wenn `ex.w && !ex.bw` und `targetWeight(ex)<=0` und in der aktuellen Woche noch kein Satzgewicht eingetragen ist, eine kleine Hinweiszeile unter der Vorgabe-Zeile rendern (Stil wie `.editnote`/`.libnote`): „Noch kein Arbeitsgewicht: Trag beim ersten Satz dein Gewicht ein – ab dann rechnet Satzkraft automatisch damit weiter.“ Der Hinweis verschwindet, sobald ein Gewicht eingetragen ist.
  2. **Gewicht vom vorherigen Satz übernehmen:** In `onSetInput` beim Auto-Ausfüllen des Gewichts (F4: nur wenn `planned>0`) einen Fallback ergänzen: Ist `planned<=0`, aber in **derselben Einheit** wurde bei einem früheren Satz dieser Übung bereits ein Gewicht > 0 eingetragen, dieses Gewicht übernehmen (rückwärts den letzten Satz mit Gewicht suchen). Damit tippt man das Gewicht in der Kalibrierungs-Einheit genau einmal.
  3. **Import-Vorschau informiert:** In `renderImportPreview` zählen, wie viele Übungen `weighted:true` ohne `bodyweight` mit `startWeight:0` haben. Wenn > 0, Hinweis-Box (Stil `importnotice`, neutral): „**X Übungen ohne Startgewicht** – kein Problem: Beim ersten Training trägst du dein Gewicht ein, danach rechnet die Progression automatisch. Alternativ kannst du Startgewichte vorher unter ‚Vorher bearbeiten‘ ergänzen.“
- **Akzeptanz:** Programm mit `startWeight:0`-Übungen importieren → Hinweis in der Vorschau; erste Einheit: Hinweis auf der Karte, Gewicht bei Satz 1 eintragen → Satz 2 übernimmt es automatisch; Woche 2 zeigt das gehobene Gewicht als Ziel; bei Übungen mit gesetztem Startgewicht ändert sich nichts.

### Abnahme Paket F (zusätzlich zur Checkliste in Abschnitt 6)
- Test-Programm ohne Startgewichte importieren (weighted-Übungen mit `startWeight:0`): kein 0-kg-Autofill, „Ziel —“ statt „Körpergew.“.
- Kompletter Satz-Flow nur über Gewichtseingabe: Gewicht tippen → Wdh. füllt sich → nach 2 s startet Pause → während Pause scrollen → nächster Satz.
- Editor: Warm-up-Eintrag anlegen, verschieben, löschen – Bereich bleibt offen; geöffnete Übung ohne Drag-Griff.
- Zeit-Übung mit 900 s anlegen → überall „15 min“-Darstellung, Eingabe weiter in Sekunden.
- Version auf **0.16.0** heben (`APP_VERSION` + `sw.js`-Cache).

---

## 8. Status-Update: Feedback-Runde 2, Stand v0.17.0

Die folgenden Punkte sind **umgesetzt und abgenommen**. Bei Widersprüchen zu älteren Soll-Beschreibungen in den Paketen A–F gilt dieser aktuelle Stand.

### G1 · Erledigte Übungen klappen verzögert ein
- Die volle Karte bleibt nach dem letzten Satz zunächst sichtbar.
- Automatisches Einklappen nach `DONE_COLLAPSE_DELAY=12000` (12 Sekunden).
- Wird währenddessen in einer anderen Übung weitertrainiert oder deren Pause/Timer gestartet, klappt die zuvor erledigte Übung direkt ein.
- Solange der Eingabefokus noch in der erledigten Karte liegt, wird das Einklappen verschoben. Manuelles Öffnen/Einklappen bleibt möglich.

### G2 · Timerbedienung für Zeitübungen vereinfacht
- Kein separater Vollbreiten-Button „Halten starten“ mehr.
- Der Timerknopf befindet sich direkt im Sekunden-Eingabefeld des ersten offenen Satzes und liegt vor dem Pause-Button.
- Nutzertexte verwenden „Timer starten“ bzw. „Stopp & eintragen“; intern darf der bestehende Phasenname `hold` erhalten bleiben.
- Für lange Zeitübungen wie Stairmaster bleibt die Eingabe in Sekunden, während Vorgaben lesbar in Minuten erscheinen.

### G3 · Trainings- und Editorlayout vereinheitlicht
- Die Vorgabezeile aus Sätzen, Wiederholungs-/Zeitziel, Gewichtsziel und Pause bleibt einzeilig und darf bei sehr kleinen Breiten horizontal scrollen.
- Geschlossene Editor-Übungen zeigen die Trainingsgruppe in einer eigenen oberen Metazeile und die Parameter darunter. Unterschiedliche Kategorienamen und Satzzeichen dürfen die Parameterzeile nicht verschieben.
- Aufklapp-Pfeile in Editor, Programmverwaltung und Auswertung sind nach einem gemeinsamen Muster vertikal zentriert.
- Info-Schaltflächen behalten eine ausreichende unsichtbare Touch-Fläche, zeigen visuell aber nur das Info-Zeichen ohne umgebenden Kreis. Damit ersetzt G3 die ältere Kreis-Vorgabe aus F9.

### G4 · „Mit ChatGPT & Co.“ ohne Fachbegriffe
- Schritt 1: Nutzer schreibt seinen Trainingswunsch frei in ein Textfeld.
- Schritt 2: „Text für ChatGPT kopieren“ verbindet den Wunsch automatisch mit Anweisung und vollständiger `BLANK_TEMPLATE`-Vorlage. Es gibt keine separaten Begriffe „Auftrag“, „Meine Wünsche“ oder „Nur Vorlage“ in diesem Flow.
- Schritt 3: Die vollständige JSON-Antwort wird geprüft und importiert. Der Hinweis erklärt ausdrücklich den Bereich vom ersten `{` bis zum letzten `}` und die Prüfung fehlender Felder.
- Der allgemeine Import darf weiterhin Markdown-Codeblöcke und eindeutigen Begleittext sicher entfernen; strukturelle Lücken werden nicht erraten.

### G5 · Vollständiges manuelles Testprogramm
- `TESTPROGRAMM-ALLE-SZENARIEN.json` ist Bestandteil des Projekts und muss valide bleiben.
- Abgedeckt sind mindestens: normales Gewicht mit und ohne Startgewicht, Körpergewicht, Körpergewicht plus Zusatzgewicht, reine Wiederholungsprogression, kurze Zeitvorgaben, Stairmaster 20 Minuten, eigene Satz-/Wiederholungsvorgaben, unterschiedliche Kategorienamen sowie Warm-up/Cool-down.
- `program-validation.test.cjs` lädt diese Datei über `parseProgram`; Änderungen am Austauschformat dürfen diesen Test nicht brechen.

### G6 · KI-Coach-Zugang
- Der KI-Coach bleibt in der Oberfläche als Beta gekennzeichnet, erhält aber **keinen zusätzlichen Zugangscode**.
- Es gibt weder einen Code im Frontend noch eine Umgebungsvariable `COACH_BETA_CODE` in der Serverfunktion.
- Der Anthropic-Key bleibt ausschließlich serverseitig; Same-Origin-Prüfung, Größenlimits, Eingabevalidierung, generische Fehlermeldungen und das Netlify-Rate-Limit bleiben verbindlich.

### Abnahme v0.17.0
- `APP_VERSION` und Service-Worker-Cache stehen beide auf **0.17.0**.
- Automatisierte Abnahme nach Rücknahme des Zugangscodes: **60 Tests grün**.
- Mobile Sichtprüfung bei 390 × 844 px: Timerfeld, Editor-Metadaten, Pfeile und Info-Zeichen ohne Browserfehler.
- Die nutzerrelevanten Änderungen stehen in `CHANGELOG.md`.

---

## 9. Verbindlicher Release- und Dokumentationsprozess ab v0.17.0

1. **Während der Umsetzung:** Jede nutzerrelevante Ergänzung, Änderung, Fehlerbehebung oder Produktentscheidung unter `CHANGELOG.md` → `Unreleased` eintragen.
2. **Vor dem Release:** Semantische Version festlegen. Solange die App vor v1.0 ist, bedeutet üblicherweise:
   - `MINOR` für ein größeres UX-/Funktionspaket, z. B. 0.17.0 → 0.18.0.
   - `PATCH` für reine Korrekturen ohne neues größeres Paket, z. B. 0.17.0 → 0.17.1.
3. **Synchron erhöhen:** `APP_VERSION` in `index.html` und `CACHE` in `sw.js` auf dieselbe Version setzen.
4. **Changelog abschließen:** `Unreleased`-Einträge unter eine Überschrift `[VERSION] – YYYY-MM-DD` verschieben; leeren `Unreleased`-Abschnitt oben stehen lassen.
5. **Briefing pflegen:** Bei neuen verbindlichen Produktentscheidungen oder Architekturregeln diesen aktuellen Statusabschnitt erweitern. Detailtickets gehören ins Briefing, nutzerorientierte Zusammenfassungen ins Changelog.
6. **Prüfen:** Gesamte Node-Testsuite, `git diff --check` und risikogerechte manuelle Browserprüfung ausführen. Der aktuelle Versions-Test muss zusätzlich sicherstellen, dass die Version im Changelog vorkommt.
7. **Git-Abschluss:** Zusammenhängend committen; bei echten veröffentlichten Releases künftig einen Git-Tag `vVERSION` anlegen. Historische Versionen ohne vorhandenen Tag werden nicht nachträglich als angeblich veröffentlichte Tags ausgegeben.
