# ENTWURF · Großes Update: Pakete L, M, N, O (Arbeitsdokument)

> **Status: ENTWURF – nicht Teil des offiziellen Briefings.** Dieses Dokument konsolidiert die bisherigen Entwürfe `ENTWURF-PAKETE-L-M-N.md` und `ENTWURF-ZONENMODELL.md` in eine Datei und ersetzt beide. Es ist die Arbeitsgrundlage für die schrittweise Ausarbeitung bis zur Übernahme ins `BRIEFING-CODEX.md` als ein größeres, zusammenhängendes Update. Getroffene Entscheidungen sind mit Datum markiert; **alle offenen Fragen sind in Abschnitt 8 gesammelt** und werden vor der Übernahme einzeln entschieden. Nichts hieraus ist umsetzungsreif, solange Abschnitt 9 (Weg ins Briefing) nicht abgehakt ist.

**Strategischer Rahmen:** Alle vier Pakete vertiefen die Differenzierungs-Achsen (Trainingsintelligenz, „Bring your own AI", lokal ohne Konto/Abo, deutsch & laientauglich). Die Nicht-Ziele aus Briefing Abschnitt 4 bleiben unangetastet. Der langfristige `AUSBAUPLAN.md` (Konten/Cloud/Desktop) ist von diesem Update unabhängig und bleibt unberührt.

---

## 1. Gesamt-Reihenfolge und Release-Schnitt

**Empfehlung der Architektur (17.07.2026, Bestätigung offen → GF-1/GF-2):**

| Schritt | Release | Inhalt | Begründung |
|---|---|---|---|
| 1 | O-Fix | O3 (Vollständigkeit einfrieren) + O6-Dialogtexte | Bugfix-nah: Editor-Änderungen können heute fertige Wochen rückwirkend „unvollständig" machen und den Blockabschluss verhindern. Schützt alles Folgende. |
| 2 | L | Programm-Bibliothek | Praktisch fertig vorbereitet (nur Studio-Abnahme offen), größter Nutzerwert pro Aufwand, unabhängig von O4. Muss nach Schritt 1 kommen, weil L neue Nutzer bringt, die Programme sofort bearbeiten. |
| 3 | O-Kern | O1, O2, O4, O5, Rest O6 | Fundament für M und N (O4 baut den Editor-Übernahme-Pfad und das Übungs-Lebenszyklus-Modell um). Je später, desto mehr Nutzerdaten entstehen im alten, verlustbehafteten Modell. |
| 4 | M | Übungs-Bibliothek light | Greift in die neuen O-Mechanismen (Tauschvorschläge münden in „Ab jetzt ersetzen", DE/EN-Namen speisen Zeitachse und Langzeit-Matching). Recherche-Vorarbeit läuft parallel ab Schritt 2–3. |
| 5 | N | KI-Coach 2.0 Blockbegleitung | Braucht O4 zwingend (Garantie „Coach ändert nur Zukunft"), profitiert von M (stabile Namen für die JSON-Runde), und N-E5 (Kostenmodell) braucht vorher einen eigenen Termin. |

Die ursprünglich beschlossene Reihenfolge L → M → N bleibt erhalten; O schiebt sich in zwei Teilen dazwischen (Fix vorgezogen, Kern zwischen L und M). Jedes Release einzeln mit eigenen Feedback-IDs und Abnahme nach Briefing Abschnitt 6/10.

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
  3. „Aktuelle Woche" = höchste Woche mit begonnener oder abgeschlossener Einheit, mindestens Woche 1 (**OF-1 bestätigen**); Wochen-Navigation bleibt zum Ansehen frei.
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
- **Akzeptanz:** Alle vier Formulierungen im Quelltext; kein generischer „Bearbeiten"-Einstieg für Protokoll-Aktionen; `ui-feedback-regressions.test.cjs` erweitert.

### Nicht-Ziele von O
- Kein chronologisches Journal / Append-only-Umbau; das Zellenmodell (Woche×Tag) bleibt.
- Keine Kalender-Semantik; Wochen bleiben Plan-Positionen.
- Keine Mehrfach-Sessions pro Zelle, keine Duplikate.
- Keine Änderung an `js/progression.js`.

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
- **Alle vier Programmentwürfe liegen vor:** `ENTWURF-PROGRAMME/gym-ganzkoerper-beginner.json`, `gym-ganzkoerper-fortgeschritten.json`, `calisthenics-einstieg.json`, `hybrid-gym-calisthenics.json`. Je 3 Tage × 8 Wochen (2×-Aufbau-Deload, RIR 3→1), Warm-up/Cool-down je Tag, alle Geräte-Übungen mit `proxy`, englische Namen (`en`), Startgewichte 0.
- **Validierung:** Alle vier bestehen die echte `parseProgram`-Prüfung (getestet in v0.19.x) sowie einen Regel-Nachbau (Whitelist, Limits, Satz-Abdeckung je Woche).
- **Kalibrier-Anleitung:** Textentwurf in `ENTWURF-PROGRAMME/kalibrier-anleitung.md`.
- **Nächster Schritt:** Studio-Abnahme durch den Produktverantwortlichen (**LF-1**, jede Datei lässt sich über „Fertiges Programm importieren" probetrainieren).

### Technische Eckpunkte (zu bestätigen → LF-2)
- Programme als statische JSON im Austauschformat `trainings-block` v2 (z. B. `programme/*.json`), vom Service Worker gecacht → offline verfügbar. Kein Build-Tool; `js/progression.js` zeigt, dass Zusatzdateien die Ein-Datei-Regel für die UI nicht verletzen.
- Übernahme durch den bestehenden `parseProgram`-Pfad (gleiche Validierung wie jeder Import).
- Jedes Bibliotheksprogramm mit `TESTPROGRAMM`-Qualität; automatischer Test lädt alle Bibliotheks-JSONs über `parseProgram`.
- Herkunfts-Kennzeichnung „Offizielles Satzkraft-Programm" in der Programmverwaltung (Ort/Wortlaut: **LF-3**).

---

## 5. Paket M – Übungs-Bibliothek light

### Ziel & Nutzen
Kuratierte, deutsche Übungsliste als Unterbau – **keine** Riesen-Datenbank. Drei Einsatzorte: Autocomplete im Editor (weniger Tippfehler), Vorschläge beim Übungstausch (K1), stabile Namen/Aliasse für den Langzeit-Vergleich über Blöcke (J4 matcht per Name). Freie eigene Übungsnamen bleiben immer erlaubt.

### Entscheidungen

| # | Frage | Entscheidung |
|---|---|---|
| M-E1 | Umfang (Auswahlprinzip)? | **ENTSCHIEDEN 16.07.:** Abdeckung statt Zielzahl – drei Bereiche: gängigste **Studio-Geräte-Übungen**, gängigste **Kettlebell-Übungen**, gängigste **Calisthenics-Übungen**. Kernanspruch: saubere deutsche UND englische Bezeichnungen (gründliche Recherche verpflichtend – größte Schwachstelle anderer Apps; `en`-Feld vorhanden). |
| M-E2 | Felder pro Übung? | **ENTSCHIEDEN 16.07.:** Name (DE), englischer Name, Alias-Namen, Übungstyp (Gewicht/Körpergewicht/Zeit), Equipment, Bewegungsmuster/Muskel (nur intern für Tauschvorschläge), Technik-Hinweis (1 Satz), Video-Suchbegriff, passende Ersatzübung. |
| M-E3 | Alias-Matching für J4? | **ENTSCHIEDEN 16.07.:** Automatisch – bekannte Namen (DE/EN-Varianten) werden über die Alias-Liste still normalisiert; unbekannte matchen weiter nur exakt. |
| M-E4 | Einsatzorte im UI? | **ENTSCHIEDEN 16.07.:** Drei Orte: Editor-Autocomplete (Übernahme füllt Typ, Technik-Hinweis, Video, Ersatzübung mit aus), Tauschvorschläge in K1, Langzeit-Matching J4. „Schnellwahl statt leerer Karte" beim Übung-Hinzufügen bewusst **nicht** übernommen. |

### Technische Eckpunkte
- Struktur analog `WUCD_LIB`: kuratierte Liste als Daten – im Quellcode oder separate gecachte JSON (**MF-1**, Entscheidung nach Größe der Liste).
- Muskel-/Bewegungsmuster bleibt internes Matching-Feld; ausdrücklich **keine** Muskelgruppen-Analytik im UI (Nicht-Ziel, Briefing Abschnitt 4).
- Freie eigene Übungsnamen bleiben uneingeschränkt erlaubt – die Bibliothek ist Komfort, nie Pflicht.
- Recherche-Arbeitspaket vor der Umsetzung: Übungsliste mit DE/EN-Namen und Aliassen als eigenes Review-Dokument, Abnahme durch den Produktverantwortlichen (analog L-E5). Umfangsrichtwert: **MF-2**; Quelle/QS der Technik-Hinweise: **MF-3**; Startzeitpunkt: **MF-4**.
- **Neu (Verzahnung mit O):** Das Feld „passende Ersatzübung" speist die Vorschläge für „Nur heute tauschen" und „Ab jetzt ersetzen" (Regel 8); DE/EN-Namen und Aliasse speisen die Übungs-Zeitachse (O5) und das Langzeit-Matching.

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
| GF-1 | Gesamt-Reihenfolge bestätigen? | O-Fix → L → O-Kern → M → N (Abschnitt 1). |
| GF-2 | Release-Schnitt: O in zwei Releases (Fix vorgezogen + Kern)? | Ja – der Fix-Teil ist klein und schützt L-Neunutzer. |
| GF-3 | Bestandsnutzer-Kommunikation: Nutzer mitten im Block erleben nach dem O-Kern-Update neue Sperren. Einmaliger Hinweis beim ersten Öffnen („Neu: Dein Protokoll ist jetzt geschützt…")? | Ja, einmaliges Info-Panel, kurz und beruhigend. |

### Paket L
| # | Frage | Vorschlag |
|---|---|---|
| LF-1 | Studio-Abnahme der vier Programme (Gate, keine Designfrage). | Aktion beim Produktverantwortlichen; Programme sind importierbar und probetrainierbar. |
| LF-2 | Technische Eckpunkte bestätigen (statische JSONs `programme/*.json`, SW-Cache, `parseProgram`-Pfad)? | Bestätigen wie beschrieben. |
| LF-3 | Herkunfts-Kennzeichnung: Ort und Wortlaut („Offizielles Satzkraft-Programm")? | Kleine Zeile in der Programmkarte der Verwaltung; kein Badge im Training. |

### Paket M
| # | Frage | Vorschlag |
|---|---|---|
| MF-1 | Speicherort der Liste: im Quellcode (wie `WUCD_LIB`) oder separate gecachte JSON? | Nach Listengröße entscheiden; Richtwert: bis ~50 Übungen inline, darüber separate JSON. |
| MF-2 | Zielumfang je Bereich für das Recherche-Paket? | Richtwert: ~25 Studio-Geräte, ~15 Kettlebell, ~20 Calisthenics (= ~60 gesamt); Abdeckung vor Vollständigkeit. |
| MF-3 | Quelle/Qualitätssicherung der Technik-Hinweise und Video-Suchbegriffe? | Formulierung durch Agenten nach `trainings_richtlinien`, Review im selben Abnahme-Dokument wie die Namen (L-E5-analog). |
| MF-4 | Startzeitpunkt des Recherche-Dokuments? | Parallel zu Schritt 2–3 (reine Dokumentenarbeit, kein Code). |

### Paket N
| # | Frage | Vorschlag |
|---|---|---|
| NF-1 | Kostenmodell / „Bring your own AI" (aus N-E5). | Eigener Termin vor N-Start; BYO-AI bevorzugt prüfen (kostet Betreiber nichts, passt zur Achse „Bring your own AI"). |
| NF-2 | Übernahme-Pfad auf O4-Mechanik umstellen (statt H-Migration)? | Ja – zwingend für N-E3 (Abschnitt 6, technische Eckpunkte). |
| NF-3 | Schwelle für den proaktiven Hinweis? | „Übung zweimal in Folge unter Zielbereich" als Startdefinition; Feinspezifikation bei N. |

### Paket O
| # | Frage | Vorschlag |
|---|---|---|
| OF-1 | Definition „aktuelle Woche": höchste Woche mit begonnener/abgeschlossener Einheit (statt frei gewählter `S.week`)? | Ja – macht die Sperren manipulationssicher und unabhängig von der Navigations-Auswahl. |
| OF-2 | UI-Ort der Aktion „Werte korrigieren"? | Auf abgeschlossenen Tageskarten anstelle des Start-Buttons (zusammen mit dem O6-Wegweiser). |
| OF-3 | Editor-Nachfrage bei Namensänderung: ab welcher Schwelle? | Immer fragen, wenn der Name geändert wird UND bereits Werte existieren; reine Tippfehler-Korrekturen (kleine Änderung) ohne Nachfrage durchlassen ist fehleranfällig – lieber immer fragen, Dialog ist ein Tap. |
| OF-4 | Bestandsdaten beim O-Kern-Update: Sperren greifen sofort, alte Lücken bleiben Lücken, nichts wird migriert? | Ja – `fromWeek`/`untilWeek` fehlen bei Bestandsübungen (= gelten immer), Verhalten bleibt identisch bis zur ersten Editor-Änderung. |

---

## 9. Weg ins Briefing (Abschlusskriterien)

Erst wenn alle Punkte abgehakt sind, wird dieses Dokument als neuer Abschnitt („Großes Update: Pakete L–O") ins `BRIEFING-CODEX.md` übernommen und dort verbindlich:

1. [ ] Alle offenen Fragen aus Abschnitt 8 entschieden und hier dokumentiert (GF, LF, MF, NF, OF).
2. [ ] Studio-Abnahme der vier L-Programme erfolgt (LF-1).
3. [ ] N-E5/NF-1-Termin (Kostenmodell/BYO-AI) durchgeführt und Ergebnis dokumentiert.
4. [ ] Je Paket Feinspezifikation gegen den dann aktuellen Codestand abgeglichen (I–K-Änderungen an Editor/Store/Trainingsansicht).
5. [ ] Test- und Abnahmeplan je Release benannt (betroffene Testdateien, manuelle Checks, Testdaten).
6. [ ] Reihenfolge und Release-Schnitt final im Briefing verankert (GF-1/GF-2).
