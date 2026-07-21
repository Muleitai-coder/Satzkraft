# Briefing: Satzkraft – Architektur, Produktregeln und Umsetzungsstand bis v0.26.0

**An:** Umsetzenden Entwickler / Coding-Agent (Codex)
**Von:** App-Architektur (fortlaufend gepflegt seit Review Juli 2026, ursprüngliche Basis: Satzkraft v0.14.1)
**Aktueller Produktstand:** Satzkraft v0.26.0
**Ziel:** Verbindliche Architektur- und Produktregeln sowie den umgesetzten Stand festhalten. Die App bleibt bewusst einfach – nichts hinzufügen, was nicht in diesem Briefing oder einer aktuellen Nutzerentscheidung steht.

**Aktuelle Prozessentscheidung (18.07.2026):** Für Prüfungen gilt ausschließlich die risikobasierte Strategie aus `docs/TESTING.md` und `AGENTS.md`. Historische Pakettexte, die vollständige Suites oder Browsermatrizen nach jeder Änderung verlangen, dokumentieren nur den damaligen Abnahmestand und lösen keine automatischen Großtests mehr aus.

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
| `TESTBACKUP-AUSWERTUNG.json` | Vollständiges, wiederherstellbares Test-Backup eines achtwöchigen Blocks; Wochen 1–7 sind mit allen Satzwerten abgeschlossen, Woche 8 ist offen |

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
8. **Nach jedem Arbeitspaket:** Kleinste passende Prüfung gemäß `docs/TESTING.md`; vollständige Suites und Browsermatrizen nur auf ausdrücklichen Nutzerbefehl. Tests bei geändertem Verhalten bewusst erweitern, nicht löschen.
9. **Ein Arbeitspaket = ein Commit** (bzw. eine zusammenhängende Änderung), Reihenfolge wie unten.

---

## Aktueller Oberflächen-Stand nach dem Redesign (Juli 2026, verbindlich)

Das komplette, vom Produktverantwortlichen abgenommene Redesign ist umgesetzt. Es ersetzt alle älteren Oberflächen-Beschreibungen in den historischen Arbeitspaketen unten; bei Widersprüchen gilt dieser Abschnitt.

- **Design-System:** CSS-Design-Tokens mit Smaragd-Akzent, vollständiges dunkles und helles Schema (`data-theme`). Schriften Hanken Grotesk und JetBrains Mono liegen lokal in `fonts/` (Latin-Subset, variable Gewichte 400–800) und stehen im Service-Worker-Precache – kein Google-CDN, die App muss offline vollständig funktionieren.
- **Startseite:** Kopfzeile mit Marke, „Programme“, „Auswertung“ und Einstellungen-Zahnrad. Wochenkarte mit Blockfortschritt (z. B. „01/08“), Phasen-Badge, RIR und Wochenschiene; darunter Tagesleiste und kompakte, aufklappbare Übungszeilen (`exrowd`, `data-expand-prev`). Fußzeile mit Versions-Knopf (`legendversion appversion`) öffnet die Versionshistorie.
- **Einstellungen (Zahnrad):** Farbmodus-Wahl (`data-settheme`) und Bereich „Datensicherung“ mit Sicherungsstand und Backup-Download (`data-settings-backup`).
- **Training:** Live-Zeitkarte im Kopf (`.livecard`) mit „Pause“/„Weiter“ und „Ende“ (`pausew`/`resumew`/`stopw`); die untere Leiste (`#bar`) zeigt nur Satzpause/Satzfokus/Halte-Timer. Übungskarte: farbiger Kategorie-Kopf (`cardcat`), Aktionen Video und Notiz plus Drei-Punkte-Menü (`data-exmenu`: Übungen neu ordnen, Übung ersetzen, Scheibenrechner, Übung entfernen nur für heute). Automatische Satzpause nach jedem vollständigen Satz.
- **Abgeschlossene Einheiten:** „Workout bearbeiten“ ersetzt „Training wiederholen“ – Leiste wechselt auf „Abbrechen“/„Speichern“, Abbrechen stellt den Sicherungsstand wieder her. Direkte Einzeländerungen außerhalb dieses Modus fragen mit „Wert übernehmen?“ nach und nennen die Neuberechnungs-Konsequenz.
- **Zeitübungen:** Eingaben und Anzeigen im Format Minuten:Sekunden (`timeInputSeconds`, `fmtClockInput`).
- **Programme-Fenster:** Vollbild-Ansicht im Stil der Startseite. Oben die aktive Programmkarte (Aktiv-Pille, „Woche 01 / 08“, Bereichs-Zeile, Tage/Wochen-Chips, „Fortsetzen“, Teilen-Knopf `proshare`), dann „Weitere Programme“, vier Erstellen-Kacheln (KI-Coach, Import, Manuell, ChatGPT & Co.), die Programmvorlagen als Karten (`tplcard`, aus `PROGRAM_LIBRARY` mit Feld `farbe`; Aktionen Laden/Bearbeiten/Teilen), Archiv-Zugang und „Daten sichern“. Der Erstellen-Hub existiert weiter als Zwischenansicht der Erstell-Flows.
- **Editor:** Tabs Training/Wochen/Details. Im Details-Tab stehen Erstell-/Änderungsdatum sowie die abgesicherten Bereiche „Fortschritt zurücksetzen“ und „Programm löschen“. Programmkarten zeigen kein Datum mehr.
- **Programmfelder:** `art` und `bereich` sind optionale Felder im Austauschformat; `bereich` ist auf die Liste `BEREICHE` beschränkt, der Import lehnt andere Werte mit klarer Fehlermeldung ab, der Export enthält beide Felder.
- **Backup:** Erinnerung erscheint nach drei abgeschlossenen Trainings seit der letzten Sicherung oder wenn die Sicherung älter als 14 Tage ist und mindestens ein neues Training vorliegt; „Später“ pausiert sieben Tage.

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
- Keine Konten/Sync (siehe `docs/planung/AUSBAUPLAN.md` – spätere Ausbaustufe).

---

## 5. Historische Reihenfolge & Versionierung

Die folgende Zuordnung dokumentiert den ursprünglichen Umsetzungsplan für v0.15.x. Die tatsächliche und fortan verbindliche Versionshistorie steht in `CHANGELOG.md`.

1. Paket A → Release **v0.15.0**
2. Paket B → v0.15.1
3. Paket C → v0.15.2
4. Paket D → v0.15.3
5. Paket E → v0.15.4

Jeweils `APP_VERSION` + `sw.js`-`CACHE` synchron erhöhen. B3 (Live-Vorschau) ist optional und darf entfallen.

## 6. Abnahme-Checkliste

Die folgenden Szenarien bilden den fachlichen Abnahmekatalog. Pro Änderung wird nur das betroffene Szenario geprüft; eine vollständige Wiederholung erfolgt ausschließlich auf ausdrücklichen Nutzerbefehl:

1. Passende einzelne Node-Testdatei bei Verhaltensänderungen.
2. Frisches Profil: App startet mit Standardprogramm, Training starten → Sätze eintragen → Pause-Timer → Training beenden → Eintrag im Verlauf.
3. Bestehende Daten: altes Backup einspielen → lädt fehlerfrei, Fortschritt vorhanden.
4. Import-Flow: Vorlage kopieren → einfügen → Prüfen & Vorschau → speichern beziehungsweise aktivieren.
5. Editor: Programm bearbeiten → als Kopie speichern → Original unverändert; „Original ersetzen“ mit Sicherheitsabfrage.
6. Auswertung und Druck/PDF im betroffenen Theme.
7. Betroffene UI im relevanten Theme und Viewport.

Auswahl, Wiederholungsregeln und große Testbefehle stehen zentral in `docs/TESTING.md`.

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
6. **Prüfen:** `git diff --check` und die kleinste passende Prüfung gemäß `docs/TESTING.md` ausführen. Vollständige Suites und Browsermatrizen nur auf ausdrücklichen Nutzerbefehl. Bei Releases ist der Versions-Test der gezielte Mindesttest.
7. **Git-Abschluss:** Zusammenhängend committen; bei echten veröffentlichten Releases künftig einen Git-Tag `vVERSION` anlegen. Historische Versionen ohne vorhandenen Tag werden nicht nachträglich als angeblich veröffentlichte Tags ausgegeben.
8. **Automatischer GitHub-Abschluss:** Nach vollständig umgesetzter und technisch erfolgreich geprüfter Arbeit die zum Auftrag gehörenden Dateien zusammenhängend committen und den Commit automatisch auf den aktuellen Arbeitsbranch von `origin` hochladen. Die Produktabnahme durch den Nutzer darf danach auf diesem hochgeladenen Arbeitsstand erfolgen; ein Push ist noch kein Merge und kein Release. Die ausführlichen Sicherheitsgrenzen stehen in `AGENTS.md`.

### 9.1 · Grenzen des automatischen Uploads

- Der Nutzer kann den Upload für jeden Auftrag mit „nicht hochladen“ oder „nur lokal“ aussetzen.
- Fehlgeschlagene Tests, unklarer Dateiumfang, mögliche Geheimnisse oder fehlende Berechtigungen stoppen Commit beziehungsweise Upload.
- Bereits vorhandene, nicht zum Auftrag gehörende Änderungen werden nicht ungefragt aufgenommen.
- Kein Force-Push, kein automatischer Wechsel auf `main`, kein Merge, kein Release und kein Tag ohne den dafür vorgesehenen Release-Schritt.
- Wird der Push wegen eines abweichenden Remote-Stands abgelehnt, wird nichts erzwungen; der Stand wird sicher geprüft und der Konflikt gemeldet.
- Der Abschlussbericht nennt Commit, Branch, Tests und den tatsächlichen Upload-Status.

---

## 10. Verbindlicher Ablauf für Fehler und Änderungswünsche

Dieser Ablauf gilt für jedes neue Feedback ab v0.17.0. Ziel ist, Beobachtung, Umsetzung, Test und Release eindeutig voneinander zu trennen. Ein neuer Hinweis wird nicht still mit einem anderen Thema vermischt.

### 10.1 · Feedback aufnehmen

Der Nutzer darf Feedback frei formulieren. Der umsetzende Agent überführt es intern in diese Struktur; fehlende, sicher aus dem Projekt ableitbare Angaben werden selbst ermittelt und nicht unnötig zurückgefragt:

```text
Titel:
Typ: Fehler | UX-Verbesserung | neue Funktion | Dokumentation
Betroffene App-Version:
Bereich: Training | Timer | Editor | Programme | Import/Export | Auswertung | KI-Coach | PWA
Ist-Verhalten:
Erwartetes Verhalten:
Schritte zum Nachstellen:
Gerät / Browser / Bildschirmgröße (wenn relevant):
Betroffenes Programm oder JSON (wenn relevant):
Priorität aus Nutzersicht: blockierend | störend | Wunsch
```

- Für jeden unabhängig prüfbaren Punkt wird eine kurze Feedback-ID vergeben: `FB-YYYYMMDD-01`, fortlaufend pro Tag.
- Mehrere Beobachtungen in einer Nachricht dürfen gemeinsam bearbeitet werden, bleiben aber als einzelne Feedback-Punkte nachvollziehbar.
- Zugangsdaten, API-Keys, persönliche Trainingsdaten oder andere Geheimnisse gehören nie in Briefing, Changelog, Tests oder Commits.

### 10.2 · Einordnen und priorisieren

1. **Blockierend:** Datenverlust, App startet nicht, Training kann nicht fortgesetzt werden, Import/Backup beschädigt Daten oder KI-Kosten können unkontrolliert entstehen. Sofort isoliert prüfen; keine themenfremden Erweiterungen bündeln.
2. **Störend:** Funktion arbeitet grundsätzlich, führt aber zu falschem Verhalten, unnötigen Schritten oder deutlicher Verwirrung. Im nächsten Patch oder zusammenhängenden UX-Paket beheben.
3. **Wunsch:** Neue oder alternative Bedienung ohne bestehenden Defekt. Gegen Nicht-Ziele, Datenmodell und Einfachheit der App prüfen, bevor sie eingeplant wird.

Vor der Umsetzung wird festgehalten, ob es sich um einen reproduzierbaren Fehler, eine Produktentscheidung oder eine noch zu testende UX-Hypothese handelt. Bei einer Produktentscheidung hat die aktuelle ausdrückliche Nutzerentscheidung Vorrang vor älteren Briefing-Passagen; der neue Stand wird anschließend im Briefing dokumentiert.

### 10.3 · Reproduzieren und absichern

1. Betroffene Version und aktuellen Quellstand prüfen.
2. Fehler mit möglichst kleinem Szenario nachstellen; für Programm-/Übungsfälle zuerst `TESTPROGRAMM-ALLE-SZENARIEN.json` verwenden oder gezielt erweitern.
3. Bei einem Fehler nach Möglichkeit zuerst einen Test ergänzen, der ohne Korrektur fehlschlägt. Bei rein visuellen Problemen stattdessen Ausgangszustand, Viewport und betroffene Ansicht festhalten.
4. Ursache und betroffene Daten-/UI-Pfade bestimmen. Keine Reparatur an `js/progression.js`, wenn die Ursache außerhalb der geprüften Progressionsmathematik liegt.

Kann ein gemeldeter Fehler nicht reproduziert werden, werden keine spekulativen Änderungen vorgenommen. Stattdessen werden die bereits geprüften Bedingungen und genau die noch fehlende Information genannt.

### 10.4 · Umsetzen

- Kleinste zusammenhängende Änderung wählen, die den bestätigten Punkt vollständig löst.
- Bestehende Nutzerdaten, Austauschformat Version 2 und Backups kompatibel halten.
- Verwandte Tests erweitern; bestehende sinnvolle Tests nicht abschwächen oder löschen.
- Nutzerrelevante Änderung sofort unter `CHANGELOG.md` → `Unreleased` dokumentieren und dabei die Feedback-ID nennen.
- Verbindliche Produkt- oder Architekturentscheidungen zusätzlich im aktuellen Statusabschnitt dieses Briefings festhalten.

### 10.5 · Prüfen

Die Abnahme erfolgt risikogerecht nach `docs/TESTING.md`:

1. `git diff --check`.
2. Gezielter Test für den betroffenen Bereich, sofern Verhalten geändert wurde.
3. Bei Layout, Interaktion, Fokus, Scrollen oder responsivem Verhalten höchstens die betroffene Ansicht am relevanten Viewport prüfen.
4. Bei Import-/Datenänderungen das unmittelbar betroffene Programm oder Fixture laden.
5. Bei PWA-/Release-Änderungen Versionsgleichheit von `APP_VERSION`, Service-Worker-Cache, Changelog und Briefing prüfen.
6. Vollständige Node-Suite, Playwright-Matrix, visuelle Regression und komplette manuelle Abnahme nur auf ausdrücklichen Nutzerbefehl.

### 10.6 · Ergebnis übergeben und vom Nutzer abnehmen lassen

Der Abschlussbericht nennt immer:

- gelöste Feedback-IDs und das neue Verhalten,
- betroffene Dateien,
- ausgeführte Tests und Ergebnis,
- konkrete Schritte für den manuellen Nutzertest,
- aktuelle Version sowie ausdrücklich, ob die Änderung nur lokal, committed oder zu GitHub hochgeladen ist,
- noch offene oder bewusst nicht umgesetzte Punkte.

Erst die erfolgreiche technische Prüfung beendet die Umsetzung. Die Rückmeldung des Nutzers aus dem eigenen Praxistest ist die Produktabnahme. Neue Beobachtungen daraus erhalten neue Feedback-IDs und durchlaufen denselben Ablauf.

### 10.7 · Versionsentscheidung

- Reine Fehlerkorrektur oder kleine Anpassung an bereits ausgeliefertem Verhalten: `PATCH`, z. B. v0.17.0 → v0.17.1.
- Zusammenhängendes neues UX-/Funktionspaket: `MINOR`, z. B. v0.17.x → v0.18.0.
- In Arbeit befindliche lokale Änderungen erhöhen die sichtbare App-Version erst dann, wenn der Release-Umfang feststeht und die Abnahme bestanden ist.
- Mehrere kleine Feedback-Punkte dürfen in einem Patch gebündelt werden, wenn sie gemeinsam geprüft und im Changelog einzeln nachvollziehbar sind.

## 11. Aktuelle Feedback-Runde · Kompletttest vom 15.07.2026

Die folgenden Punkte sind umgesetzt, technisch geprüft und mit Satzkraft v0.18.0 veröffentlicht.

| Feedback-ID | Priorität | Status | Verbindliches Verhalten |
|---|---|---|---|
| `FB-20260715-01` | störend | umgesetzt | Zeitübungen unterscheiden `timerMode:"target"` und `timerMode:"max"`. Zielzeit stoppt exakt am oberen Ziel automatisch; Maximalzeit läuft bis zum manuellen Stopp. Fehlt das Feld in einem alten Programm, wird aus der bestehenden Vorgabe kompatibel ein sinnvoller Modus abgeleitet. |
| `FB-20260715-02` | störend | umgesetzt | Erreicht der Nutzer bei einer Zielzeit alle Sätze am oberen Bereich, bleibt der Zeitbereich bestehen. Die UI empfiehlt stattdessen, Widerstand, Tempo oder Variante leicht zu steigern. `js/progression.js` bleibt unverändert. |
| `FB-20260715-03` | störend | umgesetzt | Zeitbereiche ab 120 Sekunden werden im Satzfeld in Minuten mit einer Nachkommastelle angezeigt; Eingaben und ±-Schritte erfolgen dort ebenfalls in Minuten. Speicherung und Austauschformat bleiben in Sekunden. |
| `FB-20260715-04` | störend | umgesetzt | Der Zielzustand des Halte-Timers ist bernsteinfarben statt grün; die Stopp-Schaltfläche bleibt kontrastreich. Auf kleinen Bildschirmen stehen Timerstatus und Aktionen in zwei klaren Zeilen. |
| `FB-20260715-05` | störend | umgesetzt | Beim Einklappen einer vorherigen erledigten Übung wird die Bildschirmposition der aktuell fokussierten Übung ausgeglichen. |
| `FB-20260715-06` | Wunsch | umgesetzt | Info-Schaltflächen verwenden ein deutliches gefülltes `i` ohne Kreis. |
| `FB-20260715-07` | Wunsch | umgesetzt/erweitert | Kein Versions-Chip mehr neben „Programme“. Die anklickbare Version steht im Fußbereich und öffnet die Versionsübersicht. Die frühere Begrenzung auf drei Höhepunkte wurde durch `FB-20260715-11` ersetzt. |
| `FB-20260715-08` | Produktentscheidung | entschieden/offen | Aktuelle Entscheidung: keine Adresse veröffentlichen. Ein vollständiges Impressum bleibt vorerst offen; keine Privatadresse oder private Kontaktdaten in App, Briefing, Changelog oder Tests aufnehmen. |
| `FB-20260715-09` | Wunsch | umgesetzt | In Trainingsfußzeile, Programmverwaltung und Versions-Popup steht „Entwickelt von Christian Woyack“. Die Nennung enthält bewusst keine Adresse oder Kontaktdaten. |
| `FB-20260715-10` | störend | umgesetzt | Timer-Modi sind in allen Erstellwegen berücksichtigt: manuelle Erstellung führt in den Editor, Zeitübungen zeigen dort die Moduswahl; externe KI-Vorlage und integrierter KI-Coach erzeugen bzw. erhalten `timerMode`. Zielzeit benötigt `sets` und `reps:[minSekunden,maxSekunden]`; Maximalzeit läuft bis zum eigenen Stopp. |
| `FB-20260715-11` | Wunsch | umgesetzt | Die anklickbare Version öffnet eine vollständige, scrollbar aufgebaute Historie: jede dokumentierte Version von v0.14.1 bis zur aktuellen v0.18.0 sowie die rekonstruierten und frühen Entwicklungsstände. Rekonstruierte Einträge sind als solche gekennzeichnet. |

## 12. Testdaten für die Auswertung · 16.07.2026

| Feedback-ID | Priorität | Status | Verbindliches Verhalten |
|---|---|---|---|
| `FB-20260716-01` | Wunsch | umgesetzt | `TESTBACKUP-AUSWERTUNG.json` lässt sich über „Programme → Daten sichern → Backup wiederherstellen“ laden. Der achtwöchige Block hat drei Trainingstage pro Woche und neun Übungen. Wochen 1–7 enthalten für jeden vorgesehenen Satz realistisch simulierte Gewichte, Wiederholungen oder Zeiten und insgesamt 21 vollständig abgeschlossene Trainingstage; Woche 8 ist noch komplett offen. Das Backup öffnet Woche 7, Freitag, damit sofort gefüllte Satzfelder sichtbar sind. Die Wiederherstellung erzeugt vorher automatisch eine Sicherheitskopie des aktuellen Gerätestands. |
| `FB-20260716-02` | blockierend | umgesetzt | Eine vollständige Backup-Wiederherstellung ersetzt exakt die im Gerät gespeicherten Programme und Fortschrittsdaten. `normalize` ergänzt das Standardprogramm nur noch bei einem wirklich leeren Programmstand. Sobald das geprüfte Backup gespeichert wird, werden ausstehender Autosave sowie `visibilitychange`-/`pagehide`-Speicherungen bis zum Neuladen blockiert, damit der alte In-Memory-Stand das Backup nicht zurücküberschreibt. |

### Sportliche Leitentscheidung für Zeitübungen

- `target` ist für feste Trainingsvorgaben wie Plank 30–60 Sekunden oder Stairmaster 20 Minuten gedacht. Das obere Ziel ist eine Grenze, kein Anlass für unbegrenzt längere Sätze.
- Nach sauberem Erreichen des oberen Ziels wird die Belastung in einem kleinen Schritt anspruchsvoller gemacht; anschließend arbeitet der Nutzer wieder innerhalb desselben Zeitbereichs.
- `max` ist für Tests wie Dead Hang oder „so lange wie möglich“ gedacht. Hier misst der Nutzer bewusst bis zum eigenen Stopp; die App zeigt den bisherigen Bestwert als Vergleich.
- Diese UX-Regel überträgt das Prinzip progressiver Belastungssteigerung auf Zeitübungen. Sie ist keine medizinische Empfehlung und ändert nicht die bestehende Progressionsmathematik.

### Abnahme für diese Runde

- Testszenarien: Plank (`target`, 30–60 Sek), Stairmaster (`target`, 20,0 min) und Dead Hang (`max`) aus `TESTPROGRAMM-ALLE-SZENARIEN.json`.
- Mobile Browserprüfung: 390 × 844 px; Minutenfeld, Timerleiste, Versions-Popup und Konsole prüfen.
- Release als zusammenhängendes UX-Paket v0.18.0; `APP_VERSION`, Service-Worker-Cache, Changelog und sichtbare Versionshistorie sind synchron.

---

## 13. Paket H – Laufende Programme bearbeiten ohne Fortschrittsverlust · Feedback-ID `FB-20260716-03`

**Status: Umgesetzt und technisch geprüft am 16.07.2026 mit v0.19.0; Produktabnahme steht noch aus.** Die Umsetzung erfolgte als eigenes, zusammenhängendes Arbeitspaket nach dem Ablauf in Abschnitt 10. Basis dieses Pakets ist der Quellstand v0.18.0.

```text
Titel: Aktives/bestehendes Programm im Editor ändern, ohne den Fortschritt zu verlieren
Typ: neue Funktion
Betroffene App-Version: 0.18.0
Bereich: Editor | Programme
Ist-Verhalten: „Original ersetzen“ setzt den Fortschritt des Programms komplett zurück.
Erwartetes Verhalten: Übungen ergänzen/ändern/verschieben im laufenden Programm; eingetragene Sätze,
Verlauf und Progression bleiben erhalten.
Priorität aus Nutzersicht: Wunsch (Kernwunsch des Betreibers)
```

### Produktentscheidungen (vom Produktverantwortlichen entschieden, nicht erneut diskutieren)

1. „Original ersetzen“ bekommt als **neuen Standardweg „Ersetzen & Fortschritt behalten“**; das bisherige Zurücksetzen bleibt als zweite, bewusst wählbare Option erhalten.
2. **Gelöschte Übungen verlieren ihre eingetragenen Werte endgültig** (sie verschwinden auch aus der Auswertung). Der Dialog sagt das klar.
3. **Typwechsel einer Übung** (Gewicht ↔ Körpergewicht ↔ Zeit, d. h. `w`/`bw`/`unit` ändern sich) setzt **nur die Werte dieser einen Übung** zurück – kg und Sekunden sind nicht vergleichbar. Änderungen an `sets`, `reps`, `timerMode`, `increment`, `startWeight`, Name oder Kategorie sind **kein** Reset.
4. **Wochen werden nicht umgemappt:** Woche 3 bleibt Woche 3. Werden Wochen entfernt, verfallen Werte jenseits der neuen Blocklänge.
5. Ersetzen des aktiven Programms **während eines laufenden Trainings ist gesperrt** („Erst Training beenden“).
6. „Als Kopie speichern“ bleibt unverändert (Kopie startet ohne Fortschritt) – das ist weiterhin der bewusste Neustart-Weg.

### Technischer Kontext (warum der Fortschritt heute verloren geht)

- Satzdaten liegen in `S.logs` unter Keys `Woche|TagKey|ÜbungsID` (`getSets`/`writeSets`); manuelle Gewichts-Overrides in `S.tg` unter `Woche|ÜbungsID` (siehe `targetWeight`).
- Übungs-IDs sind **positionsbasiert**: `importTranslate` vergibt `id = TagKey + "_" + Index`. Der Editor speichert immer über `parseProgram(JSON.stringify(editorDraft))` → IDs werden bei jedem Speichern neu vergeben. Nach einer Strukturänderung (Übung eingefügt/verschoben/gelöscht) zeigen alte Log-Keys auf die **falschen Übungen**. Deshalb setzt der Replace-Pfad in `editorStoreProgram` heute bewusst `S.store[sourceId]=newStore(p)`.
- **Stabil** sind dagegen: Tag-Keys (`editorMoveDayToWeekday` ändert nur `weekday`, nie `key`; `editorAddDay` vergibt neue eindeutige Keys; der Editor bewegt Übungen nicht zwischen Tagen), Wochen-Indizes und die `S.history`-Einträge `{week, day, start, dur}`.
- `parseProgram` validiert nur bekannte Felder und `importTranslate` übernimmt nur bekannte Felder – ein editor-internes Zusatzfeld im Entwurf ist daher format-neutral und landet **nie** im gespeicherten Programm oder im Austauschformat. **Kein Schemabruch:** `cali-plan-v3`, `DATA_SCHEMA_VERSION` 4 und `trainings-block` Version 2 bleiben unverändert; `js/progression.js` bleibt unberührt.

### H1 · Übungs-Identität im Editor verfolgen (`_ref`)

- **Ist:** `openProgramEditor` baut den Entwurf über `cloneJSON(exportTranslate(p))` – die internen Übungs-IDs gehen dabei verloren; nach dem Speichern ist keine Zuordnung alt → neu mehr möglich.
- **Soll:**
  1. In `openProgramEditor` nach dem `exportTranslate` jeder Übung im Entwurf ein Feld **`_ref`** mit der alten internen ID geben (`p.days[di].ex[i].id`; `exportTranslate` bildet 1:1 in Reihenfolge ab). `editorInitialJSON` erst **danach** bilden (sonst falscher „ungespeichert“-Zustand).
  2. `_ref` bleibt rein editor-intern: Neue Übungen (`editorAddExercise`) bekommen keins; Verschieben/Umbenennen/Undo erhalten es automatisch (Splice bewegt Objektreferenzen, Undo nutzt `cloneJSON`); `parseProgram`/`importTranslate` ignorieren es ohnehin. `openProgramDraft` (Import-Weg, neues Programm) braucht keine Refs.
  3. **Achtung:** `openProgramEditor` ist Test-Anker (Abschnitt 2, Regel 6) – Funktion ändern ja, Name und relative Reihenfolge nicht.
- **Akzeptanz:** Nach beliebiger Editor-Sitzung (Übung verschieben, umbenennen, hinzufügen, löschen, Tag verschieben, Undo) trägt jede aus dem Original stammende Übung noch ihr korrektes `_ref`; gespeicherte Programme, Exporte („Exportieren & Teilen“ nutzt `exportTranslate(PROG())`) und Backups enthalten niemals `_ref`.

### H2 · „Original ersetzen“ mit Fortschritts-Migration

- **Ist:** Der Replace-Pfad in `editorStoreProgram` zeigt „Nur der Fortschritt dieses Programms wird dabei zurückgesetzt“ mit Button „Ersetzen & Fortschritt löschen“ und setzt `newStore(p)`.
- **Soll:**
  1. **Zuordnung bauen** (kleine pure Funktion, z. B. `editorBuildRefMap(editorDraft)`): für jeden Tag mit Key `K` und jede Übung mit `_ref R` an Position `j`: `map[R] = {day: K, id: K + "_" + j}` – exakt die ID-Vergabe von `importTranslate`. `_ref` **nicht** aus der ID parsen (Tag-Keys dürfen `_` enthalten).
  2. **Migration** (pure Funktion, z. B. `migrateReplaceStore(oldProg, oldStore, newProg, map)` → neuer Store):
     - `logs`: Key `w|D|E` übernehmen, wenn `1 ≤ w ≤ newProg.weeks.length`, `map[E]` existiert und der Übungstyp unverändert ist (alte Übung per `E` in `oldProg` suchen, gegen neue Übung vergleichen: `w`/`bw`/`unit`). Neuer Key: `w|map[E].day|map[E].id`. **Alles Nicht-Zuordenbare verwerfen** – keine verwaisten Keys zurücklassen (positionsbasierte IDs könnten sonst später kollidieren, z. B. sucht `holdBestSeconds` per ID-Suffix über alle Log-Keys).
     - `tg`: Keys `w|E` analog migrieren (`w|map[E].id`), gleiche Verwerfungsregeln inkl. Typwechsel.
     - `history`: unverändert übernehmen (absolvierte Einheiten bleiben gezählt; Einträge gelöschter Tage erscheinen im Protokoll schlicht nicht mehr).
     - `week`: auf `1…weeks.length` klemmen; `day`: behalten, wenn der Key noch existiert, sonst erster Tag; `workout`: `null` (laufendes Training ist per H3 ohnehin ausgeschlossen).
  3. **Dialog neu** (ersetzt den bestehenden Bestätigungs-Modal): Titel „Original ersetzen?“, Text: „‚{Name}‘ wird durch deine bearbeitete Version ersetzt. Dein bisheriger Fortschritt bleibt dabei erhalten. Werte gelöschter Übungen gehen verloren; bei geändertem Übungstyp beginnt die Übung neu.“ Buttons: **„Ersetzen & Fortschritt behalten“** (primary), „Ersetzen & Fortschritt zurücksetzen“ (danger, bisheriges Verhalten), „Abbrechen“.
  4. **Behalten-Pfad:** `p.id=sourceId; S.programs[sourceId]=p; S.store[sourceId]=migrateReplaceStore(…)`; wenn aktiv: `alias(S)` + `renderView()`/`renderBar()`; `flushSave()`; Erfolgs-Modal nennt, dass der Fortschritt übernommen wurde. Progression funktioniert danach ohne Sonderlogik weiter, weil `targetWeight`/`lastPerf` aus den migrierten Logs rechnen.
- **Akzeptanz:**
  - Übung oben in einen Tag einfügen → alte Werte hängen weiter an den **richtigen** Übungen (nicht positionsverschoben).
  - Übung umbenennen/verschieben → Werte und „Zuletzt“-Zeile bleiben; Übung löschen → ihre Werte sind weg, Rest unverändert.
  - Typwechsel (z. B. Gewicht → Zeit) → nur diese Übung beginnt leer.
  - Wochen von 8 auf 6 kürzen bei `S.week=7` → App steht auf Woche 6, keine toten Log-Keys.
  - Auswertung nach Migration konsistent (Einheiten-Zahl unverändert, Übungstrends korrekt); Woche N+1 empfiehlt das tatsächlich gehobene Gewicht weiter.

### H3 · Sperre bei laufendem Training

- **Ist:** Der Editor ist während eines laufenden Trainings erreichbar; ein Ersetzen des aktiven Programms würde `S.workout` auf veralteten Strukturen zurücklassen.
- **Soll:** Am Anfang des Replace-Zweigs von `editorStoreProgram` (deckt Button **und** „Ungespeicherte Änderungen“-Dialog ab): wenn `editorSourceId===S.active && S.workout`, Modal „Training läuft – beende zuerst dein Training, dann kannst du das Programm ersetzen.“ (nur OK), kein Ersetzen. „Als Kopie speichern“ bleibt erlaubt.
- **Akzeptanz:** Mit laufendem Training ist Ersetzen (beide Varianten) nicht möglich; nach „Training beenden“ funktioniert es normal.

### H4 · Texte & Hilfe

- `showEditorHelp`, Absatz „Überall gilt“, ergänzen: „‚Original ersetzen‘ übernimmt deine Änderungen in das laufende Programm – dein bisheriger Fortschritt bleibt erhalten.“
- `CHANGELOG.md` → `Unreleased` bei Umsetzung mit Feedback-ID `FB-20260716-03` befüllen.

### Tests (Paket H)

- Neuer Test `editor-replace-migration.test.cjs` (Muster wie bestehende Tests: Funktionen per String-Anker aus `index.html` schneiden; `editorBuildRefMap` und `migrateReplaceStore` deshalb als eigenständige, pure Funktionen schreiben). Szenarien mindestens: einfügen, verschieben, löschen, umbenennen, Typwechsel, Wochen kürzen, `tg`-Override, Tag gelöscht.
- Bestehende Anker-Funktionen nicht umbenennen; den zugehörigen Migrationstest gezielt ausführen. Die vollständige Suite bleibt ein großer Test gemäß `docs/TESTING.md`.

### Abnahme Paket H (manuell, zusätzlich zu Abschnitt 6)

1. `TESTBACKUP-AUSWERTUNG.json` wiederherstellen (Wochen 1–7 gefüllt) → Editor → an Tag 1 eine Übung **oben** einfügen, eine umbenennen, eine löschen → „Ersetzen & Fortschritt behalten“ → Trainingsansicht Woche 7: alte Werte an den richtigen Übungen; neue Übung leer (bei `startWeight:0` greift der Kalibrier-Hinweis aus F10); Auswertung: gelöschte Übung fehlt, Rest konsistent.
2. „Ersetzen & Fortschritt zurücksetzen“ liefert weiterhin einen leeren Stand.
3. Ersetzen-Versuch während laufendem Training → Sperr-Hinweis.
4. Mobile Sichtprüfung 390 × 844 px: neuer Dialog vollständig lesbar und bedienbar.
5. Release: `APP_VERSION`, `sw.js`-`CACHE` und Changelog synchron auf **0.19.0**.

### Nicht Bestandteil von Paket H (Ausblick, separat entscheiden)

- **Folgeblock starten** (Programm duplizieren, zuletzt gehobene Gewichte als neue Startgewichte). *(Inzwischen beschlossen → Abschnitt 14, Paket J.)*
- **Übung im laufenden Training tauschen** („Bank belegt“) – baut auf der `_ref`-Identität auf, kommt frühestens danach. *(Inzwischen beschlossen → Abschnitt 14, Paket K.)*
- **Backup-Schutz** (`navigator.storage.persist()` + Hinweis „Letztes Backup vor X Tagen“). *(Inzwischen beschlossen → Abschnitt 14, Paket I.)*

### Patch v0.19.1 · Programmverwaltung während des Trainings schreibgeschützt · `FB-20260716-13`

- Solange `S.workout` gesetzt ist, sind Bearbeiten, Aktivieren, Erstellen/Importieren, Fortschritts-Reset und Backup-Wiederherstellung in der Programmverwaltung sichtbar deaktiviert.
- Ein klarer Hinweis erklärt, dass zuerst das Training beendet werden muss.
- Export/Teilen, vollständiger Backup-Download, Auswertung, Theme und Versionshistorie bleiben erlaubt.
- Die Mutationspfade prüfen den Trainingszustand zusätzlich funktional; bereits geöffnete oder veraltete Ansichten können die UI-Sperre nicht umgehen.
- Der Patch ändert weder Datenformat noch Progressionslogik und ist als v0.19.1 veröffentlicht.

---

## 14. Beschlossene Produkt-Roadmap · Pakete I–K (Stand 16.07.2026)

**Status:** Pakete I, J und K sind seit v0.20.0, v0.21.0 beziehungsweise v0.22.0 umgesetzt. Grundlage: vollständige Produktanalyse (Code-Review v0.18/0.19 + Praxis-Durchlauf auf 390 px) mit Einzelabstimmung jedes Punkts. Die verbindliche Reihenfolge **I → J → K** wurde mit jeweils eigenem Release eingehalten. K1 baut auf der `_ref`-Identität aus H auf.

**Strategische Leitlinie:** Satzkraft differenziert sich über vier Achsen – Trainingsintelligenz (Blockperiodisierung + Progression), „Bring your own AI“, komplett lokal ohne Konto/Abo, deutsch & laientauglich. Die Pakete vertiefen diese Achsen. Social Feeds, Gamification, Muskel-Heatmaps bleiben Nicht-Ziele (Abschnitt 4).

---

### Paket I – Trainings-Alltag & Vertrauen · Ziel v0.20.0

**Umgesetzt in v0.20.0 am 16.07.2026.**

#### I1 · Scheibenrechner · `FB-20260716-04`
> Historischer Stand von v0.20.0; die aktuelle, vereinfachte Produktregel aus `FB-20260716-24` in Abschnitt 16 ersetzt Auswahl und Ergebnisdarstellung.

- **Ist:** Gewichtsziele (z. B. „Ziel 43,5 kg“) müssen im Kopf in Scheiben pro Seite umgerechnet werden.
- **Soll:** Antippen des Gewichtsziels in der Vorgabezeile öffnet ein kleines Modal „Scheiben pro Seite“: Belegung aus dem Standard-Scheibensatz 25 / 20 / 15 / 10 / 5 / 2,5 / 1,25 kg, z. B. „43,5 kg · Stange 20 kg → pro Seite: 10 + 1,25“. Im Modal eine kompakte Stangen-Auswahl (20 / 15 / 10 kg / eigenes Feld); die Wahl wird **pro Übung gemerkt** (neues optionales Store-Feld, z. B. `store.barw[exId]`; Standard 20 kg). Ist das Ziel nicht exakt legbar, die nächstliegende legbare Last samt Belegung anzeigen. Rein informativ, ändert keine Daten; nur bei Gewichtsübungen (`ex.w`).
- **Datenregeln:** Neues Store-Feld optional und abwärtskompatibel; `validateBackupStore` toleriert es; in der H-Migration (`migrateReplaceStore`) wie `tg` per Übungs-ID mitmigrieren.
- **Akzeptanz:** 43,5 kg / 20-kg-Stange → „pro Seite: 10 + 1,25“; SZ-Curls einmal auf 10 kg umgestellt → bleibt beim nächsten Öffnen; hell/dunkel geprüft.

#### I2 · Übungsnotizen · `FB-20260716-05`
- **Ist:** Keine Möglichkeit, sich Geräte-Einstellungen oder Technik-Beobachtungen zu merken.
- **Soll (Nutzerentscheidung: „auf Notiz klicken und eine machen“):** Kleiner Button „Notiz“ an der Übungskarte (im und außerhalb des Trainings, Stil wie „Verlauf“). Öffnet Modal mit Textfeld (max. 500 Zeichen). Vorhandene Notiz erscheint als dezente Zeile auf der Karte (antippen = bearbeiten, leeren = löschen). Speicherort `store.notes[exId]` – persistent über Wochen, gehört zum Fortschritt (nicht zum Programm-Austauschformat). Ausgabe über `esc()`.
- **Datenregeln:** wie I1 (optional, Backup-kompatibel, H-Migration analog `tg`).
- **Akzeptanz:** Notiz anlegen/ändern/löschen; nach „Ersetzen & Fortschritt behalten“ (H) hängt die Notiz an der richtigen Übung; Backup/Restore erhält Notizen.

#### I3 · Backup-Schutz · `FB-20260716-06`
- **Ist:** localStorage kann vom Browser bei langer Nichtnutzung geräumt werden; Erinnerung ans Backup gibt es nicht (nur Statustext in der Programmverwaltung).
- **Soll (Nutzerentscheidung: „muss einfach sein, kein Aufwand“):**
  1. `navigator.storage.persist()` **einmalig still im Hintergrund** anfragen, sobald erste echte Trainingsdaten existieren (erster abgeschlossener Satz). Kein eigener Dialog, Ergebnis nur intern merken.
  2. Erinnerung nur, wenn das letzte Backup älter als **14 Tage** ist UND seither mindestens eine Einheit abgeschlossen wurde: dezente Zeile nach Trainingsende und in der Programmverwaltung mit **genau zwei Aktionen**: „Backup herunterladen“ (ein Klick = `downloadFullBackup()`, Meta aktualisiert, Zeile verschwindet) und „Später“ (7 Tage Ruhe). Kein Modal-Zwang, kein Formular.
- **Akzeptanz:** Frisches Profil → keine Erinnerung; simuliertes altes Backup-Datum → Zeile erscheint; Ein-Klick-Download beendet sie; „Später“ pausiert 7 Tage.

#### I4 · Politur · `FB-20260716-07`
1. **Info-Interaktion neu (Nutzerentscheidung):** Die ⓘ-Knöpfe entfallen. Stattdessen ist der **Begriff selbst antippbar** (dezente gepunktete Unterstreichung, ausreichend große Touch-Fläche, tastaturbedienbar, `aria-label="Erklärung: …"`). Die `EDITOR_INFO`-Texte bleiben unverändert. Ersetzt die Optik aus `FB-20260715-06`/G3.
2. **Timer-Farbe (Nutzerentscheidung):** Der Fortschrittsbalken des Halte-Timers behält durchgehend **eine** Farbe; Erreichen von Ziel/Maximum wird nur über Text, Ton und Vibration kommuniziert. Revidiert den Bernstein-Wechsel aus `FB-20260715-04`.
3. **Accessible Names:** Erstellen-Hub-Karten, Verlauf-Chevron und alle unbenannten Icon-Buttons erhalten `aria-label`s (Satz-Eingaben sind bereits vorbildlich beschriftet).
4. **Vorgabezeile 390 px:** Hartes Abschneiden („Pause 2:3…“) entschärfen – Fade-Kante als Scroll-Hinweis oder kompaktere Abstände. Einzeilig-scrollbar (G3) bleibt gültig.

#### I5 · Eindeutige Programmnamen bei Kopien · `FB-20260716-08`
- **Ist:** „Als Kopie speichern“ erzeugt namensgleiche Programme – nicht unterscheidbar.
- **Soll (Nutzerentscheidung: „Datums-Schlüssel oder sowas“):** Automatische Kopien erhalten eindeutige Namen mit Datum, z. B. „Name (Kopie 16.07.)“; bei Namenskollision zusätzlich Zähler. Namenslimit (30 Zeichen) beachten: Basisname wird gekürzt, das Suffix nie. Gilt für Editor-Kopien; Folgeblöcke nutzen das eigene Schema aus J2 („… · Block 2“).
- **Akzeptanz:** Zwei Kopien nacheinander → eindeutig unterscheidbare Namen ≤ 30 Zeichen.

---

### Paket J – Block-Lebenszyklus · Ziel v0.21.0

**Umgesetzt in v0.21.0 am 16.07.2026.**

**Produktentscheidungen (16.07.2026):** Erfolgs-Fenster beim Blockabschluss; „Absolviert“-Markierung am Programm; Folgeblock-Namen als „… · Block 2“; Archiv schreibgeschützt mit einsehbarer Auswertung.

#### J1 · Block-Abschluss & Absolviert-Status · `FB-20260716-09`
- **Ist:** Nach der letzten Einheit des Blocks passiert nichts – kein Abschluss, kein Übergang.
- **Soll:** Wird mit dem Beenden eines Trainings die letzte offene Einheit des Blocks abgeschlossen (alle vorgesehenen Einheiten aller Wochen komplett), erscheint ein **Erfolgs-Modal**: Glückwunsch, Kernzahlen (Einheiten, Trainingszeit, 2–3 größte Verbesserungen aus `buildReportData`) und die Buttons „Folgeblock starten“ (→ J2), „Auswertung ansehen“, „Später“. In der Programmverwaltung erhält das Programm ein Badge **„✓ Absolviert“** (Zustand aus den Logs berechnen, nicht separat speichern).
- **Akzeptanz:** Testbackup: Woche 8 zu Ende trainieren → Modal erscheint genau einmal; Badge sichtbar; „Später“ erlaubt jederzeit „Folgeblock starten“ aus der Programmverwaltung.

#### J2 · Folgeblock starten · `FB-20260716-09`
- **Soll:** Erzeugt eine Kopie des Programms als neuen Block: Name „… · Block 2“ (Zähler erhöhen, Namenslimit beachten). **Startgewichte** je Gewichts-Übung = Empfehlung der Progression auf Basis der letzten Nicht-Deload-Woche mit Daten (bestehende `calculateNextRecommendation`-Logik: letztes Arbeitsgewicht, bei erreichtem oberen Wiederholungsziel + Steigerung). Reine Wiederholungs-/Zeit-Übungen bleiben unverändert. Das neue Programm wird aktiv; das alte wird automatisch archiviert (J3) – mitsamt Fortschritt. Internes optionales Feld `parent` (Programm-ID des Vorblocks) für J4; nicht Teil des Austauschformats.
- **Akzeptanz:** 8-Wochen-Testblock → Folgeblock: Kniebeuge-Startgewicht entspricht dem letzten Aufbau-Arbeitsgewicht (+ Steigerung, wenn oben erreicht); alter Block im Archiv, Auswertung dort intakt; `js/progression.js` unverändert.

#### J3 · Block-Archiv · `FB-20260716-10`
> Historischer Stand von v0.21.0; die aktuelle Navigation und Kartendarstellung aus `FB-20260716-23` in Abschnitt 16 ersetzt die eingebettete Archivsektion.

- **Soll:** Optionales Flag `archived` am Programm (abwärtskompatibel, `normalize` toleriert es). Programmverwaltung: eigene Sektion „Archiv (n)“ unter „Weitere Programme“. Archivierte Programme sind nicht aktivierbar und nicht bearbeitbar, bieten aber „Auswertung ansehen“ (bestehender Report, read-only gegen deren Store) und „Aus dem Archiv holen“. Manuelles Archivieren ist auch ohne Folgeblock möglich. Backups enthalten Archiv-Programme automatisch (gleiche Struktur).
- **Akzeptanz:** Archivieren → erscheint in Sektion, Training/Editor gesperrt, Auswertung vollständig; „Aus dem Archiv holen“ stellt Normalzustand her.

#### J4 · Langzeit-Blick (bewusst klein) · `FB-20260716-10`
- **Soll:** Hat das aktive Programm über die `parent`-Kette archivierte Vorblöcke, zeigt jede Übungskarte der Auswertung bei Namensübereinstimmung **eine** Zusatzzeile: „Vorblock: 82,5 kg“ (letzter Trend-Wert des Vorblocks). Keine neuen Diagrammtypen, keine wählbaren Zeiträume – das Nicht-Ziel aus Abschnitt 4 bleibt bestehen.
- **Akzeptanz:** Block 2 aktiv → Kniebeuge-Karte zeigt Vorblock-Wert; Übungen ohne Namens-Match zeigen nichts.

---

### Paket K – Flexibilität · Ziel v0.22.0

**Umgesetzt in v0.22.0 am 16.07.2026.**

#### K1 · Übung heute tauschen · `FB-20260716-11`
> Historischer Stand von v0.22.0; `FB-20260716-25` in Abschnitt 16 erweitert den temporären Tausch auf die Vorbereitung vor Trainingsbeginn.

- **Kontext:** Häufigster Realitätsbruch im Gym („Bank ist belegt“). Baut auf der `_ref`-Identität aus Paket H auf; Detailregeln beim Paketstart gegen die dann aktuelle Codebasis prüfen.
- **Soll:** Im aktiven Training bietet jede offene Übungskarte „Übung tauschen“: Feld für den Namen der Ersatzübung (vorbelegt mit dem gepflegten Feld „Ersatzübung“/`proxy`, falls vorhanden) und zwei Wege:
  1. **„Nur heute“:** Karte zeigt den Ersatznamen mit Vermerk „getauscht“. Eingetragene Sätze werden im Log der Übung mit Vermerk (z. B. `swap:"Name"`) gespeichert; diese Einheit zählt **nicht** in Progressionsempfehlung und Übungstrend der Original-Übung, erscheint aber im Trainingsprotokoll mit Ersatznamen. Nächste Woche gilt wieder das Original.
  2. **„Dauerhaft ersetzen“:** führt in den Editor zur geöffneten Übung; über den H-Pfad „Ersetzen & Fortschritt behalten“ bleibt bei gleichem Übungstyp der Fortschritt erhalten.
- **Abstimmung mit `FB-20260716-13` (Trainings-Schreibschutz):** Der Schreibschutz bleibt unangetastet – im aktiven Training ist nur „Nur heute“ direkt ausführbar. „Dauerhaft ersetzen“ wird im Training lediglich vorgemerkt und nach Trainingsende im Editor ausgeführt (Hinweis an der Karte, kein stiller Automatismus).
- **Akzeptanz:** „Nur heute“-Tausch → Werte im Protokoll unter Ersatznamen, Empfehlung der Original-Übung unbeeinflusst, Folgewoche wieder Original; „Dauerhaft“ → wie H-Abnahme.

#### K2 · KI-Coach-Antworten speichern · `FB-20260716-12`
- **Ist:** Abbruch des 17-Fragen-Wizards verwirft alle Antworten (`coachReset`).
- **Soll:** Antworten (`coachAns`) lokal speichern (eigener localStorage-Key, z. B. `satzkraft-coach-prefs`) – bei Abbruch und nach Programm-Übernahme. Beim nächsten Wizard-Start: Hinweiszeile „Antworten vom letzten Mal übernehmen?“ [Übernehmen / Neu starten]; übernommene Antworten sind normal änderbar. Verzahnung mit J1: Stammt das absolvierte Programm vom Coach, bietet das Erfolgs-Modal zusätzlich „Mit KI-Coach neu planen“ (Wizard vorausgefüllt). Alles bleibt lokal; keine Übertragung außerhalb des bestehenden Coach-Aufrufs.
- **Akzeptanz:** Wizard abbrechen → erneut öffnen → Antworten vorhanden; „Neu starten“ leert sie; Erfolgs-Modal-Weg funktioniert vorausgefüllt.

---

### Abnahme-Grundsatz Pakete I–K

Jedes Paket einzeln nach Abschnitt 6 und 10.5 prüfen und vom Nutzer abnehmen; Versionsziele I = 0.20.0, J = 0.21.0, K = 0.22.0 (verschieben sich entsprechend, falls dazwischen Patches nötig werden). Neue Store-Felder (`barw`, `notes`) müssen in Backup-Validierung und H-Migration berücksichtigt sein, bevor das jeweilige Paket released wird.

---

## 15. Patch-Runde nach dem Praxistest von v0.22.0 · v0.22.1

**Status:** Die beschlossenen Korrekturen `FB-20260716-14` bis `FB-20260716-21` sind in v0.22.1 umgesetzt und technisch geprüft. `FB-20260716-22` war in dieser Runde noch offen und wurde später durch `FB-20260716-27` in v0.22.3 entschieden. Der ausführliche Leitfaden zum ersten Arbeitsgewicht bleibt eine spätere Produktentscheidung.

| Feedback-ID | Status | Verbindliches Verhalten |
|---|---|---|
| `FB-20260716-14` | beschlossen | Ein für heute gesetzter Übungstausch lässt sich zurücksetzen, solange für diese Übung noch kein Satzwert eingetragen wurde. Die Karte kehrt vollständig zur Originalübung zurück. Gehört zum Tausch eine Vormerkung „Dauerhaft ersetzen“, wird auch diese Vormerkung entfernt. |
| `FB-20260716-15` | beschlossen | Das Modal „Scheiben pro Seite“ stellt die Beladung visuell und zusätzlich als eindeutige Stückliste je Seite dar. Die Stangenwahl 10 kg, 15 kg und 20 kg sowie „Eigenes Gewicht“ ist ohne Umweg sichtbar; 20 kg bleibt der Standard. Bei eigenem Gewicht erscheint direkt ein numerisches Eingabefeld. Zielgesamtgewicht, Stangengewicht und tatsächlich legbares Gewicht bleiben klar unterscheidbar; eine nur näherungsweise mögliche Last wird ausdrücklich gekennzeichnet. Das Modal bleibt auf kleinen Bildschirmen kompakt und ohne horizontales Abschneiden bedienbar. |
| `FB-20260716-16` | beschlossen | „Archivieren“ bleibt verfügbar, wird auf Programmkarten aber als kleine, visuell zurückgenommene Nebenaktion statt als großer, aufdringlicher Button dargestellt. |
| `FB-20260716-17` | beschlossen | Das bei einer Kopie oder Änderung ergänzte Datum steht nicht mehr im Namensbereich. Es erscheint als sekundäre Metainformation in derselben Zeile wie Tage und Wochen und ist dort rechts angeordnet. Ist ein Programm vollständig absolviert, steht in dieser Metazeile ebenfalls der Status „Abgeschlossen“. |
| `FB-20260716-18` | beschlossen mit offener Detailfrage | Der Informationstext zu „Eigene Vorgabe“ verwendet dieselbe zurückgenommene Schriftgröße wie vergleichbare Editorhinweise. Der Hinweis „Noch kein Arbeitsgewicht“ und die vorhandene Kalibrierinformation sind linksbündig. Der genaue Inhalt eines weiterführenden Leitfadens zur Ermittlung des ersten Arbeitsgewichts ist noch nicht beschlossen und darf in diesem Patch nicht vorweggenommen werden. |
| `FB-20260716-19` | beschlossen | Nach dem bestätigten Löschen eines Programms führt der Ablauf in die Programmverwaltung beziehungsweise bleibt dort; die App wechselt nicht ungefragt in eine andere Hauptansicht. |
| `FB-20260716-20` | beschlossen | Beim Abschließen einer Übung, beim Wechsel zur nächsten Karte und beim späteren Einklappen bleibt die sichtbare Position stabil; es gibt kein wahrnehmbares Hin-und-her-Springen. Das Erscheinen des Einklapp-Symbols darf die Vorgabezeile auch vorübergehend nicht umformatieren. Die Zeile „Sätze · Wdh. · Ziel · Pause“ endet ohne Fade oder verschwommenen Rand. Anstelle des ausgeschriebenen Pausenworts steht ein Uhrsymbol mit eindeutigem zugänglichem Namen; Spalten und Abstände bleiben vor und nach dem Übungsabschluss identisch. |
| `FB-20260716-21` | beschlossen | Im vollständigen Trainingsprotokoll wird ein heutiger Übungstausch in einer eindeutigen Zeile als „Original → Ersatz“ gekennzeichnet; die ausgeführten Sätze gehören sichtbar zum Ersatz. Existiert eine Übungsnotiz, bietet die Zeile eine klar beschriftete Aufklappaktion und zeigt die Notiz nach dem Öffnen inline. Ohne Notiz erscheint keine leere Notizaktion. Die bestehende Regel, Tauschwerte nicht in Progression und Trend der Originalübung einzurechnen, bleibt bestehen. |
| `FB-20260716-22` | historisch offen; in v0.22.3 entschieden | In v0.22.1 war die Darstellung nach Trainingsende noch nicht festgelegt. `FB-20260716-27` ersetzt diesen offenen Stand durch einen verbindlichen Abschlussdialog. Eine darüber hinausgehende Reportstruktur außerhalb des vollständigen Protokolls ist weiterhin nicht beschlossen. |

### Abgrenzung dieser Patch-Runde

- `FB-20260716-14` bis `FB-20260716-21` sind als einzeln prüfbare UX-Korrekturen in v0.22.1 umgesetzt.
- Der damalige offene Punkt `FB-20260716-22` wurde erst in v0.22.3 durch `FB-20260716-27` verbindlich entschieden.
- Auch der detaillierte Kalibrier-Leitfaden ist nicht Teil des beschlossenen Patch-Umfangs. Festgelegt sind bei `FB-20260716-18` ausschließlich Typografie und linksbündige Darstellung der bereits vorhandenen Hinweise.

---

## 16. Kleine Oberflächenrunde · v0.22.2

**Status:** Die Entscheidungen `FB-20260716-23` bis `FB-20260716-25` sind in v0.22.2 umgesetzt und geprüft. Sie ersetzen in den genannten Punkten die frühere Darstellung aus den Paketen I, J und K, ohne das Datenformat zu ändern.

| Feedback-ID | Status | Verbindliches Verhalten |
|---|---|---|
| `FB-20260716-23` | umgesetzt | Die Programmverwaltung zeigt den Archivzugang anstelle des früheren Theme-Knopfs in der Kopfzeile. Das Archiv ist eine eigene Unteransicht mit Zurück-Funktion; eine dort geöffnete Auswertung hat ebenfalls Zurück statt Kreuz und kehrt ins Archiv zurück. Der Theme-Knopf steht in der Fußzeile. Programmkarten zeigen kein zusätzliches Aktiv-Symbol und kein Archiv-Badge. Nur vollständig absolvierte Programme erhalten ein goldenes „Abgeschlossen“-Badge. Das Erstellungs- beziehungsweise Änderungsdatum steht in der Metazeile ganz rechts. Bearbeiten, Archivieren, Auswertung ansehen und Aus dem Archiv holen bleiben semantische, ausreichend große Buttons, erscheinen aber als zurückgenommener klickbarer Text. |
| `FB-20260716-24` | umgesetzt; ersetzt `FB-20260716-15` | „Scheiben pro Seite“ zeigt das Zielgesamtgewicht, genau die Stangenwahl 10 kg, 15 kg oder 20 kg und das Ergebnis `(Zielgewicht − Stangengewicht) ÷ 2` als Gewicht pro Seite. Ein eigenes Stangengewicht, einzelne Scheiben, eine Stückliste und ein Beladungsvorschlag entfallen bewusst, weil die vorhandenen Scheiben je Studio variieren. Die Wahl bleibt wie bisher pro Übung gespeichert; alte freie Werte fallen beim Öffnen auf den Standard 20 kg zurück. |
| `FB-20260716-25` | umgesetzt; erweitert `FB-20260716-11` | „Übung tauschen“ ist für die aktuell ausgewählte Woche, den ausgewählten Trainingstag und eine offene Übung auch ohne laufendes Training verfügbar. Der temporäre Tausch lässt sich bis zur ersten Satzeingabe über „Original verwenden“ zurücksetzen. Während eines laufenden Trainings bleibt „Dauerhaft ersetzen“ eine Vormerkung für die spätere bewusste Editor-Aktion; vor Trainingsstart wird kein dauerhafter Ersatz angeboten. |

### Weiterhin offen

- Der ausführliche Leitfaden zur Ermittlung des ersten Arbeitsgewichts.

---

## 17. Trainingssicherheit und Abschlussfluss · v0.22.3

**Status:** `FB-20260716-26` bis `FB-20260716-28` sind in v0.22.3 umgesetzt. `FB-20260716-27` entscheidet den zuvor offenen Teil von `FB-20260716-22` zum Umgang mit dauerhaften Tauschvormerkungen nach Trainingsende. Datenformat, `DATA_SCHEMA_VERSION` und Progressionsmodul bleiben unverändert.

| Feedback-ID | Status | Verbindliches Verhalten |
|---|---|---|
| `FB-20260716-26` | umgesetzt | Während eine Satzpause, ein fokussierter Folgesatz oder ein Halte-Timer einer Übung aktiv ist, können nur Werte dieser Übung erfasst werden. Satzfelder, Stepper und Arbeitsgewicht aller anderen Übungen sind gesperrt. Die Sperre wird zusätzlich im Schreibpfad geprüft, damit ein zuvor fokussiertes oder veraltetes Eingabefeld keine fremden Werte speichern kann. |
| `FB-20260716-27` | umgesetzt; entscheidet `FB-20260716-22` | Nach Trainingsende erscheint bei dauerhaften Tauschvormerkungen zwingend ein Dialog mit genau den Wegen „Zum Editor“ und „Vormerkungen verwerfen“; eine Später-Funktion gibt es nicht. Verwerfen entfernt nur die dauerhafte Änderung für kommende Einheiten, nicht den Tausch im abgeschlossenen Trainingsprotokoll. Der Editor übernimmt alle Vormerkungen gemeinsam und markiert jede betroffene Übung gelb, bis die Änderung gespeichert oder bewusst verworfen wurde. Ausstehende Vormerkungen überstehen einen Neustart. Erst nach dieser Entscheidung folgt gegebenenfalls der Blockabschluss. |
| `FB-20260716-28` | umgesetzt | Eine vorhandene Übungsnotiz steht im vollständigen Trainingsprotokoll direkt unter der Übung und benötigt keine Aufklappaktion. Beim Speichern einer Editor-Kopie oder beim Ersetzen eines bestehenden Programms bleibt der bisherige Aktivstatus unverändert; der Ablauf führt in die Programmübersicht zurück. Nur die ausdrücklich benannte Aktion für ein neues Programm darf dieses aktivieren. Die Theme-Einstellung steht ausschließlich in der Fußzeile der Hauptseite, nicht in Programme oder Archiv. |

### Abgrenzung

- Tausch- und Notizdetails werden in v0.22.3 im vollständigen Trainingsprotokoll eindeutig dargestellt. Neue Kennzahlen oder zusätzliche Darstellungen im Bereich „Fortschritt im Trainingsblock“ sind nicht beschlossen.
- Das Verwerfen einer dauerhaften Vormerkung darf den bereits dokumentierten Ersatznamen und dessen Sätze im beendeten Training nicht verändern.
- Der ausführliche Leitfaden zur Ermittlung des ersten Arbeitsgewichts bleibt offen.

---

## 18. Großes Update · Zonenmodell, Programm-Bibliothek, Übungs-Bibliothek · Releases 1–4 (beschlossen 17.07.2026)

**Status:** Vom Produktverantwortlichen beschlossen, umgesetzt und abgenommen. Die vollständigen Spezifikationen stehen in `docs/planung/GROSSES-UPDATE-RELEASES-1-4.md`. Alle Guardrails aus Abschnitt 2 gelten unverändert. Paket N (KI-Coach-Blockbegleitung) ist **ausgeklammert** und nicht Teil dieses Updates.

### Verbindliches Produkt-Regelwerk „Plan · Einheit · Protokoll"

Grundprinzip: *Satzkraft ist ein Trainingstagebuch – was trainiert wurde, bleibt stehen; trainiert wird immer nur vorne; Planänderungen gelten nur für Trainings, die noch kommen.* Daraus folgen zwölf Regeln (Langfassung in `docs/planung/GROSSES-UPDATE-RELEASES-1-4.md`, Abschnitt 3):

1. **Unverlierbarkeit:** Keine Planänderung löscht trainierte Daten; entfernte/ersetzte Übungen *enden* (`untilWeek`), ihre Historie bleibt.
2. **Korrigieren ist nicht Wiederholen:** Satzwerte abgeschlossener Einheiten sind jederzeit still korrigierbar; Struktur und Trainingszeit sind eingefroren.
3. **Abgeschlossen bleibt abgeschlossen:** Vollständigkeit wird beim Beenden festgeschrieben (`history[].complete`).
4. **Trainiert wird vorne:** Startbar sind nur die aktuelle Woche und leere Einheiten der Vorwoche.
5. **Wiederholen nur zuletzt:** Nur die zuletzt abgeschlossene Einheit ist wiederholbar; die neue ersetzt die alte.
6. **Eine Zelle, eine Wahrheit:** Je Woche×Tag genau eine Einheit.
7. **Planänderungen gelten ab der nächsten offenen Einheit je Tag** – nie rückwirkend.
8. **Tauschen ist zweistufig:** „nur heute" (Zelle) oder „ab jetzt" (alte endet, neue beginnt).
9. **Struktur folgt denselben Regeln** (mit der in K-F4 dokumentierten Vereinfachung: Reihenfolge ist Darstellung).
10. **Benannte Absichten statt Edit-Knöpfen.** 11. **Sperren sind Wegweiser.** 12. **Der Plan zeigt seine Geschichte.**

### Release-Plan (ein Release = ein eigenes Update mit Version + Changelog)

| Release | Inhalt | Arbeitsanweisung | Status |
|---|---|---|---|
| 1 „O-Fix" | Vollständigkeit abgeschlossener Einheiten einfrieren + erweiterte Wiederholen-Warnung | Feinspezifikation Release 1 (F1–F8) | umgesetzt |
| 2 „L" | Programm-Bibliothek: vier freigegebene Startprogramme in `programme/`, Kachel, Vorschau, Kalibrier-Anleitung, Herkunfts-Kennzeichnung | Feinspezifikation Release 2 (L-F1–L-F7) | umgesetzt |
| 3 „O-Kern" | Zonenmodell komplett: Schreibrechte, „Werte korrigieren", Gültig-ab-Mechanik (`fromWeek`/`untilWeek`), Übungs-Zeitachse, Wegweiser + einmalige Hinweis-Box | Feinspezifikation Release 3 (K-F1–K-F9) | umgesetzt |
| 4 „M" | Übungs-Bibliothek light: `uebungen.json` aus der freigegebenen Referenz, Editor-Autocomplete, Tauschvorschläge, Alias-Matching | Feinspezifikation Release 4 (M-F1–M-F8) | umgesetzt |

**Verbindliche Umsetzungsregeln:**
- Reihenfolge strikt 1 → 2 → 3 → 4; Release 3 setzt 1 voraus, Release 4 setzt 3 voraus.
- Je Release nichts umsetzen, was über die jeweilige Feinspezifikation hinausgeht (insbesondere keine O-Kern-Teile im O-Fix vorziehen).
- Datenkompatibilität: `cali-plan-v3`, `DATA_SCHEMA_VERSION` 4 und Austauschformat v2 bleiben; die neuen Felder (`fromWeek`, `untilWeek`, `prevId`, `origin`) sind optional und abwärtskompatibel.
- `js/progression.js` bleibt unangetastet; Test-Anker aus Abschnitt 2 Punkt 6 bleiben erhalten.
- Freigegebene Inhalts-Artefakte: `programme/*.json` (vier Programme) und `docs/referenz/UEBUNGSLISTE.md` (200 Übungen), jeweils Freigabe 17.07.2026.

### Ergänzende Produktentscheidung · Gleiche Übung an mehreren Trainingstagen (18.07.2026)

- Jede Planposition bleibt über ihre eigene Übungs-ID und den Trainingstag getrennt. Progression, Zielgewicht, Korrekturen und Verlauf werden nicht zwischen Tagen zusammengeführt.
- Die Trainingskarte zeigt rein informativ den jüngsten eingetragenen Originalwert derselben Übung von einem anderen Trainingstag, sofern ein solcher Wert vorhanden ist.
- Getauschte Übungen zählen nicht als Wert der Originalübung. Die Anzeige verändert weder gespeicherte Daten noch Empfehlungen.

### Ausgeklammert

Paket N (KI-Coach 2.0 Blockbegleitung) startet erst nach Abschluss der Releases 1–4 und nach einem eigenen Konzept-Termin zu „Bring your own AI" (Vorentscheidungen in `docs/planung/GROSSES-UPDATE-RELEASES-1-4.md`, Abschnitt 6). Bis dahin: keine N-Umsetzung, auch nicht teilweise.

---

## 19. UX-Nachschärfung nach dem Praxistest · 18.07.2026

**Status:** Die folgenden Regeln sind für den unveröffentlichten Folgestand beschlossen. Sie ersetzen in den jeweils genannten Punkten die historischen Regeln aus `FB-20260716-25`, `FB-20260716-27`, Paket K1 und dem Regelwerk aus Abschnitt 18. Datenformat, `DATA_SCHEMA_VERSION`, localStorage-Schlüssel sowie die Trennung von Plan, Einheit und Protokoll bleiben unverändert.

| Feedback-ID | Status | Verbindliches Verhalten |
|---|---|---|
| `FB-20260718-01` | umgesetzt | Eine abgeschlossene ältere Einheit zeigt in der Fußleiste ausschließlich „Werte korrigieren“. Der Satz „Diese Einheit ist Teil deines Protokolls“ und die Aktion „Diesen Inhalt heute trainieren“ entfallen. Eine zulässige Wiederholung der neuesten Einheit bleibt ein eigener, klar benannter Weg. |
| `FB-20260718-02` | umgesetzt | Direkte Änderungen an Satzwerten sowie der Einstieg über „Werte korrigieren“ verwenden dieselbe Wirkungsbeschreibung: Nur Satzwerte der abgeschlossenen Einheit ändern sich; Trainingszeit und Protokolleintrag bleiben bestehen; Empfehlungen und Zielwerte späterer Wochen werden nach der Korrektur neu berechnet. Stepper und Texteingabe führen bei einer abgeschlossenen Einheit in denselben Bestätigungsweg. |
| `FB-20260718-03` | umgesetzt; ersetzt die Vormerkungs-/Bulk-Editor-Regel | Vor und während des Trainings heißt die Aktion nur „Übung tauschen“. Der Tausch gilt zunächst für die ausgewählte Einheit. Vor der ersten Satzeingabe kann mit „Original verwenden“ zurückgekehrt werden. Während des Trainings gibt es weder „Ab jetzt ersetzen“ noch eine dauerhafte Vormerkung im Editor. |
| `FB-20260718-04` | umgesetzt; ersetzt `FB-20260716-27` | Erst nach einem vollständig beendeten Training wird für jede tatsächlich getauschte Übung ein eigener Entscheidungsdialog angezeigt: „Dauerhaft übernehmen“ oder „Nur dieses Training“. Mehrere Tausche werden einzeln und nacheinander entschieden. Das gerade beendete Protokoll bleibt bei beiden Entscheidungen unverändert. Eine dauerhafte Wahl beginnt an der nächsten offenen Einheit des betroffenen Tages. Bei gewichteten Ersatzübungen wird dafür das tatsächlich trainierte Ersatzgewicht statt des alten Zielgewichts übernommen. Gibt es im Block keine offene Folgewoche mehr, wird sie im nächsten Folgeblock angewendet; der frühere Editorfehler „keine offene Folgewoche“ darf nicht mehr entstehen. |
| `FB-20260718-05` | umgesetzt | Die automatische Satzpause startet auch nach dem letzten Satz einer Übung und nach dem letzten Satz des Trainingstags. Ein Abschlussdialog wartet, bis die Pause beendet oder abgebrochen wurde. Der zusätzliche Kartenknopf „Pause starten“ entfällt, weil er neben der zuverlässigen Automatik redundant ist. |
| `FB-20260718-06` | umgesetzt | Vor einer neuen Einheit zeigt die Trainingskarte die aus der letzten passenden Originaleinheit abgeleitete Progressionsempfehlung. Getauschte Einheiten bleiben ausgeschlossen. Empfehlungen sind typgerecht: gewichtete Übungen dürfen Gewichtsangaben nutzen; Zeit-, Progressions- und reine Körpergewichtsübungen erhalten Zeit-, Wiederholungs- oder Variantenhinweise, niemals ein erfundenes Gewicht. |
| `FB-20260718-07` | umgesetzt | Das verzögerte Einklappen einer erledigten Übung bewahrt die sichtbare Position der folgenden Karte. Fokus und Scrollposition dürfen nicht wahrnehmbar hin und her springen. |
| `FB-20260718-08` | umgesetzt | Sichtbare Garmin- und Garmin-Proxy-Bezeichnungen entfallen vollständig. Vorhandene Import-/Exportfelder dürfen intern aus Kompatibilitätsgründen bestehen bleiben. Video, Notiz und Übung tauschen bilden eine gemeinsame Aktionszeile; deutscher Titel, englischer Titel und Beschreibung sind klar voneinander getrennt. |
| `FB-20260718-09` | umgesetzt | Importnormalisierungen bleiben intern, werden aber nicht als „Sicher automatisch bereinigt“ kommuniziert. Das offizielle Programm „Calisthenics Einstieg“ muss denselben echten Prüf- und Vorschaupfad wie die anderen Bibliotheksprogramme fehlerfrei durchlaufen. |
| `FB-20260718-10` | umgesetzt | In der Programmverwaltung hat „Aktivieren“ dieselbe zurückgenommene Hierarchie wie „Bearbeiten“. Im Erstellen-Hub sind „Fertiges Programm wählen“ und „Manuell erstellen“ nicht dauerhaft farblich hervorgehoben. Bibliotheksvorschauen zeigen Übungsnamen ohne Trainingsgruppen-Suffix und keine redundante Zahl fehlender Startgewichte. |
| `FB-20260718-11` | umgesetzt | Der Programmeditor richtet zusammengehörige Felder auf derselben Ebene aus: Trainingstag/Name des Tages, Bezeichnung/Farbe sowie Checkbox/Text der eigenen Vorgabe. Das Umschalten automatischer Wiederholungsbereiche hält die betroffene Trainingsgruppe geöffnet. |
| `FB-20260718-12` | umgesetzt | Die Editor-Anleitung ist zusätzlich als leicht verständliche PDF verfügbar. Sie erklärt Training, Wochen, Details, Trainingsgruppen, eigene Vorgaben, Gültigkeit, Rückgängig sowie Kopie gegenüber Original ersetzen ohne internes Vorwissen vorauszusetzen. |

### Weiterhin offene Produktentscheidungen

- **Darstellung der Tauschentscheidungen:** Der fachliche Lebenszyklus aus `FB-20260718-03/04` ist fest. Wortlaut und visuelle Form werden mit etablierten Trainingsapps verglichen; die App darf dafür später von sequenziellen Dialogen auf eine gleichwertige Einzelentscheidung je Zeile in einer Zusammenfassung wechseln.
- **Wochen als Datenbank:** Bis zu einer eigenen Entscheidung bleibt der Editor flexibel. Bevorzugte Richtung ist ein Hybrid: verständliche Vorlagen für häufige Aufbau-, Intensiv- und Erholungswochen, deren RIR-, Satz- und Textwerte anschließend frei änderbar bleiben. Eine starre Datenbank oder Einschränkung bestehender Importe ist nicht beschlossen.
- **Startgewicht-Hilfe:** Die redundante Zählung in der Programmvorschau entfällt. Der genaue Umfang eines weiterführenden Leitfadens bleibt offen; die Trainingskarte darf einen einzigen kompakten Einstieg zur bestehenden Hilfe anbieten.

### Test- und Dokumentationspflichten

- Der vorhandene Playwright-Testbestand deckt Chromium und WebKit auf Desktop und Smartphone ab.
- Verbindliche Copy wird wortgleich getestet; veraltete Texte und Aktionen sind zusätzlich mit Anzahl `0` abgesichert.
- Visuelle Baselines decken die reduzierte Protokollleiste, den neutralen Erstellen-Hub und den neuen schlanken Tauschdialog ab.
- Die vier offiziellen Bibliotheksprogramme sind im Browserpfad bis zur Vorschau abgedeckt.
- Die PDF wird bei inhaltlichen oder Layoutänderungen vor Übergabe gezielt gerendert und geprüft.
- Die Ausführung vollständiger Matrizen richtet sich ausschließlich nach `docs/TESTING.md`.

---

## 20. Empfehlungen in Trainingskarten · 19.07.2026

| Feedback-ID | Status | Verbindliches Verhalten |
|---|---|---|
| `FB-20260719-01` | umgesetzt | Nach vollständigen Sätzen zeigt die Karte die daraus berechnete Empfehlung direkt unter den Satzzeilen. In einer offenen Folgewoche wird diese Karte nicht wiederholt; stattdessen steht ein kompakter Hinweis fest in der passenden Vorgabeposition (kg, Wdh., Zeit oder Variante). Auch `Erholungswoche` und `Wiedereinstieg` bleiben an dieser Position, damit die Erklärung nicht zwischen den Bereichen springt. |
| `FB-20260719-02` | umgesetzt | Die separate Zeile „Arbeitsgewicht“ entfällt. Das empfohlene Ziel bleibt in der Vorgabezeile sichtbar. Fehlt ein Ziel, erklärt der bestehende Kalibrierungshinweis die Eingabe im ersten Satz; dieser Wert wird anschließend als Arbeitswert angezeigt. Für weitere Sätze hat das zuletzt tatsächlich verwendete Gewicht Vorrang vor dem ursprünglichen Ziel. Dasselbe gilt für getauschte Übungen, ohne deren Gewicht in das Originalziel zu schreiben. |
| `FB-20260719-03` | umgesetzt | Das dreistündige Sicherheitslimit wird beim Fortsetzen nur gegen den neu gestarteten Trainingsabschnitt gerechnet, nicht gegen die Summe bereits gespeicherter Abschnitte. Beim Verlassen beziehungsweise Wechseln der App in den Hintergrund wird eine laufende Trainingszeit automatisch pausiert und gespeichert, damit Abwesenheit nicht als Trainingsdauer zählt. |
| `FB-20260719-04` | umgesetzt | Zeitvorgaben und protokollierte Zeitwerte werden unabhängig von ihrer Länge als Minuten:Sekunden dargestellt. Beispiel: Plank mit 75 Sekunden erscheint als `1:15 min`, ein Bereich von 30 bis 75 Sekunden als `0:30–1:15 min`. Die intern gespeicherten Sekunden und die Eingabelogik bleiben unverändert. |
| `FB-20260719-05` | umgesetzt | Der Kalibrierungshinweis „Arbeitsgewicht noch offen“ erhält eine feste Position unter dem Verlauf beziehungsweise unter einem zusätzlichen Vergleichswert eines anderen Tages und direkt vor den Satzzeilen. |
| `FB-20260719-06` | umgesetzt | Alle Aktionen innerhalb einer Programmkarte werden wie das frühere „Bearbeiten“ als anklickbare, unterstrichene Textaktionen ohne Button-Fläche dargestellt. Dazu gehören insbesondere „Aktivieren“, „Bearbeiten“, „Folgeblock starten“, „Archivieren“, „Auswertung ansehen“ und „Aus dem Archiv holen“. |
| `FB-20260719-07` | umgesetzt | Der Dialog „Übung tauschen“ verwendet oben das frei bearbeitbare Feld „Ersatzübung“. Beim Tippen erscheinen deutsche Datenbanktreffer ohne englische Bezeichnungen oder Zusatzinformationen direkt unter dem Feld. Nach der Auswahl verschwindet die Trefferliste und der Name bleibt im Feld; er kann erneut verändert oder durch einen eigenen Namen ersetzt werden. Darunter zeigt der Dialog separat „Empfohlene Ersatzübung“ mit genau einer passenden Auswahl. |
| `FB-20260719-08` | umgesetzt | Beim Start nach dem Update erscheint kein zusätzlicher Hinweisdialog. Die frühere einmalige Meldung „Neu: Dein Trainingstagebuch ist geschützt“ und ihr gespeicherter Gesehen-Status entfallen vollständig; die App öffnet direkt in der Trainingsansicht. |

---

## 21. Trainingsfokus · 20.07.2026

| Feedback-ID | Status | Verbindliches Verhalten |
|---|---|---|
| `FB-20260720-01` | umgesetzt | Während eines laufenden Trainings wird die informative Seitenfußzeile vollständig ausgeblendet. Versions- und Lokalhinweis, Entwicklerangabe sowie Hell-/Dunkelmodus bleiben außerhalb des Trainings unverändert verfügbar. |
| `FB-20260720-02` | umgesetzt; präzisiert `FB-20260718-10` und `FB-20260719-02` | Die eigentliche Trainingskarte zeigt weder Trainingsgruppe noch Satzanzahl noch eine separate Zielgewichtsangabe. Zielgewichte bleiben direkt in den Gewichtsfeldern der Satzzeilen sichtbar; Wiederholungs-/Zeitvorgabe, Pause und Progressionskontext bleiben erhalten. Der Scheibenrechner bleibt als Kartenaktion verfügbar. Im Programmeditor und in der Programmvorschau wird die Trainingsgruppe als Orientierung weiterhin angezeigt. |
| `FB-20260720-03` | umgesetzt; ersetzt die sichtbare Ausgestaltung aus `FB-20260719-05` | Bei fehlendem Arbeitsgewicht entfallen der Titel „Arbeitsgewicht noch offen“ und der erklärende Satz in der Trainingskarte. An derselben Stelle bleibt ausschließlich die dezente Aktion „Startgewicht bestimmen“, die den vorhandenen Leitfaden öffnet. |
