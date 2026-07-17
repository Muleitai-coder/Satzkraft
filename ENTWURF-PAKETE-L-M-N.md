# ENTWURF · Pakete L–N (Arbeitsdokument)

> **Status: ENTWURF – nicht Teil des offiziellen Briefings.** Dieses Dokument dient der schrittweisen Detail-Ausarbeitung der nächsten Ausbaustufe nach den Paketen I–K (Briefing Abschnitt 14). Entscheidungen werden hier gesammelt und erst nach Freigabe des Produktverantwortlichen als finale Pakete ins `BRIEFING-CODEX.md` übernommen. Nichts hieraus ist umsetzungsreif.

**Beschlossene Reihenfolge:** L (Programm-Bibliothek) → M (Übungs-Bibliothek light) → N (KI-Coach 2.0 Blockbegleitung). Je ein eigenes Release, frühestens nach Abschluss von Paket K.

**Strategischer Rahmen:** Alle drei Pakete vertiefen die vier Differenzierungs-Achsen (Trainingsintelligenz, „Bring your own AI“, lokal ohne Konto/Abo, deutsch & laientauglich). Die Nicht-Ziele aus Briefing Abschnitt 4 bleiben unangetastet.

---

## Paket L – Programm-Bibliothek (kuratierte Startprogramme)

### Ziel & Nutzen
Neue Nutzer kommen heute nur über den 17-Fragen-Coach, ChatGPT oder manuelles Bauen zu einem Programm. Eine kleine, kuratierte Bibliothek fertiger Satzkraft-Programme senkt die Einstiegshürde auf unter eine Minute: öffnen → Programm wählen → Training starten. Kein Backend, alles lokal.

### Entscheidungen (werden Schritt für Schritt getroffen)

| # | Frage | Entscheidung |
|---|---|---|
| L-E1 | Welche Programme gehören in die Bibliothek? | **ENTSCHIEDEN 16.07.:** Vier Programme: 1. Gym-Ganzkörper **Beginner**, 2. Gym-Ganzkörper **Fortgeschritten** (beide zugeschnitten auf Standard-Studio-Ausstattung à la Holmes Place/SuperFit: Langhantel, Kurzhanteln, Kabelzug, gängige Maschinen, Klimmzugstange), 3. **Calisthenics-Einstieg**, 4. **Hybrid** (Gym + Calisthenics). Alle Programme wissenschaftlich fundiert (Maßstab: `trainings_richtlinien`), Übungen aufeinander abgestimmt, **jeder Tag mit passendem Warm-up & Cool-down** aus `WUCD_LIB`. |
| L-E2 | Startgewichte: leer (Kalibrierung), Vorgaben oder Abfrage? | **ENTSCHIEDEN 16.07.:** Leer + Kalibrierung (F10-Mechanik). **Zusätzlich verpflichtend:** eine verständliche, wissenschaftlich fundierte Anleitung, wie man Startgewichte richtig findet (Herantasten über Technik-Sätze → Arbeitssatz bei ~RIR 3 im Zielbereich). Ort der Anleitung: siehe L-E6. |
| L-E3 | Wie erscheint die Bibliothek im Erstellen-Hub? | **ENTSCHIEDEN 16.07.:** Eigene Kachel „Fertiges Programm wählen“ ganz oben im Erstellen-Hub → Liste mit Kurzbeschreibung → Vorschau → Übernahme als eigenes Programm (normale Programmverwaltung, frei bearbeitbar). |
| L-E4 | Blocklänge der Bibliotheksprogramme? | **ENTSCHIEDEN 16.07.:** Je Programm sportlich passend (Richtwert 8 Wochen, Einsteiger ggf. 6). |
| L-E5 | Wer erstellt und prüft die Programminhalte (Qualitätssicherung)? | **ENTSCHIEDEN 16.07.:** Entwurf durch den Architektur-Agenten streng nach `trainings_richtlinien` (Volumen 10–20 Sätze/Muskel/Woche, Blockaufbau mit Deload, RIR-Verlauf, Push/Pull-Balance, Übungsreihenfolge); **praktische Abnahme durch den Produktverantwortlichen im Studio**, bevor ein Programm in die App kommt. |
| L-E6 | Kalibrier-Anleitung: Ort und Umfang? | **ENTSCHIEDEN 16.07.:** Zweistufig. Kurzfassung auf der Übungskarte beim ersten Training (erweitert den F10-Hinweis, antippbar für Details); ausführliche Fassung in der Programm-Vorschau. Methode: Technik-Sätze mit leichtem Gewicht → 2–3 Steigerungssätze → Arbeitsgewicht = sauberes Gewicht mit ~3 Wiederholungen Reserve (RIR 3) im Zielbereich. |
| L-E7 | Ersatzübungen (proxy) für belegte/fehlende Geräte? | **ENTSCHIEDEN 16.07.:** Ja, flächendeckend – jede Geräte-/Maschinen-Übung der Gym-Programme erhält eine gleichwertige Alternative im vorhandenen `proxy`-Feld (z. B. Beinpresse → Goblet Squat). Verzahnt sich mit dem Übungstausch aus Paket K. |
| L-E8 | Vorschau vor Übernahme: Detailgrad? | **ENTSCHIEDEN 16.07.:** Vollständig scrollbar – Beschreibung (Ziel, Level, Dauer/Einheit), Wochenstruktur (Phasen/RIR), alle Tage mit allen Übungen inkl. Warm-up/Cool-down. Nutzt das vorhandene Import-Vorschau-Muster. |

### Ausgearbeiteter Stand (alle Entscheidungen getroffen – bereit zur Feinspezifikation)

1. **Inhalt:** Vier offizielle Programme (Gym-Ganzkörper Beginner / Gym-Ganzkörper Fortgeschritten / Calisthenics-Einstieg / Hybrid), zugeschnitten auf Standard-Studio-Ausstattung, Blocklänge je Programm passend (Richtwert 8 Wochen), jeder Tag mit Warm-up & Cool-down aus `WUCD_LIB`, alle Geräte-Übungen mit `proxy`-Ersatzübung, Startgewichte leer (Kalibrierung).
2. **UI-Flow:** Erstellen-Hub-Kachel „Fertiges Programm wählen“ (oberste Position) → Liste (Name, Ziel, Level, Tage/Woche, Dauer) → vollständige Vorschau inkl. Kalibrier-Anleitung → „Übernehmen“ legt es als eigenes, frei bearbeitbares Programm an (Herkunfts-Kennzeichnung „Offizielles Satzkraft-Programm“ in der Programmverwaltung).
3. **Kalibrier-Anleitung:** zweistufig (Karte kurz / Vorschau ausführlich), Formulierung Du-Form, sportwissenschaftlich sauber, keine medizinischen Aussagen.
4. **Technik:** Programme als statische JSON (Austauschformat v2) im Repo, vom Service Worker gecacht, Übernahme über den bestehenden `parseProgram`-Importpfad; automatischer Test lädt alle Bibliotheks-JSONs.
5. **Arbeitsteilung:** Programmentwürfe nach `trainings_richtlinien` durch den Agenten, Studio-Abnahme durch den Produktverantwortlichen vor Aufnahme.

### Stand der Vorarbeit (16.07.2026)

- **Alle vier Programmentwürfe liegen vor:** `ENTWURF-PROGRAMME/gym-ganzkoerper-beginner.json`, `gym-ganzkoerper-fortgeschritten.json`, `calisthenics-einstieg.json`, `hybrid-gym-calisthenics.json`. Jeweils 3 Tage × 8 Wochen (2×-Aufbau-Deload-Struktur, RIR 3→1), Warm-up/Cool-down je Tag aus `WUCD_LIB`, alle Geräte-Übungen mit `proxy`-Ersatzübung, alle Übungen mit englischem Namen (`en`), Startgewichte 0 (Kalibrierung).
- **Validierung:** Alle vier bestehen die echte `parseProgram`-Prüfung der App (getestet in v0.19.x) sowie einen Regel-Nachbau (Whitelist, Limits, Satz-Abdeckung je Woche).
- **Kalibrier-Anleitung (L-E6):** Textentwurf in `ENTWURF-PROGRAMME/kalibrier-anleitung.md` (Kurzfassung Karte + ausführliche Fassung).
- **Nächster Schritt:** Studio-Abnahme der vier Programme durch den Produktverantwortlichen (jede Datei lässt sich schon heute über „Fertiges Programm importieren“ in die App laden und probetrainieren).

### Technische Eckpunkte (Empfehlung der Architektur, noch zu bestätigen)
- Programme als statische JSON-Dateien im Austauschformat `trainings-block` v2 (z. B. `programme/*.json`), vom Service Worker mitgecacht → offline verfügbar. Kein Build-Tool, keine Abhängigkeiten; `js/progression.js` zeigt, dass Zusatzdateien die Ein-Datei-Regel für die UI nicht verletzen.
- Übernahme läuft durch den bestehenden `parseProgram`-Pfad (gleiche Validierung wie jeder Import) – die Bibliothek ist technisch „nur“ ein bequemer Import.
- Jedes Bibliotheksprogramm muss `TESTPROGRAMM`-Qualität haben: valide gegen `program-validation.test.cjs`-Muster, ein automatischer Test lädt alle Bibliotheks-JSONs über `parseProgram`.

---

## Paket M – Übungs-Bibliothek light

### Ziel & Nutzen
Kuratierte, deutsche Übungsliste als Unterbau – **keine** Riesen-Datenbank. Drei Einsatzorte: Autocomplete im Editor (weniger Tippfehler), Vorschläge beim Übungstausch (K1), stabile Namen/Aliasse für den Langzeit-Vergleich über Blöcke (J4 matcht per Name). Freie eigene Übungsnamen bleiben immer erlaubt.

### Entscheidungen (werden Schritt für Schritt getroffen)

| # | Frage | Entscheidung |
|---|---|---|
| M-E1 | Umfang (Auswahlprinzip)? | **ENTSCHIEDEN 16.07.:** Abdeckung statt Zielzahl – drei Bereiche: 1. die gängigsten **Studio-Geräte-Übungen** (Standard-Ausstattung gängiger Sportclubs), 2. die gängigsten **Kettlebell-Übungen**, 3. die gängigsten **Calisthenics-Übungen**. **Kernanspruch: saubere deutsche UND englische Bezeichnungen** – hierfür ist gründliche Recherche verpflichtend, weil genau das die größte Schwachstelle anderer Apps ist. (Das vorhandene `en`-Feld je Übung trägt die englische Bezeichnung.) |
| M-E2 | Welche Felder pro Übung? | **ENTSCHIEDEN 16.07.:** Standard-Set: Name (DE), englischer Name, Alias-Namen, Übungstyp (Gewicht/Körpergewicht/Zeit), Equipment, Bewegungsmuster/Muskel (nur intern für Tauschvorschläge), Technik-Hinweis (1 Satz), Video-Suchbegriff, passende Ersatzübung. |
| M-E3 | Alias-Matching für J4? | **ENTSCHIEDEN 16.07.:** Automatisch – bekannte Namen (inkl. DE/EN-Varianten) werden über die Alias-Liste still normalisiert; unbekannte Namen matchen weiterhin nur exakt. |
| M-E4 | Einsatzorte im UI? | **ENTSCHIEDEN 16.07.:** Drei Orte: Editor-Autocomplete (Übernahme füllt Typ, Technik-Hinweis, Video, Ersatzübung mit aus), Tauschvorschläge in K1, Langzeit-Matching J4. Die „Schnellwahl statt leerer Karte“ beim Übung-Hinzufügen wurde bewusst **nicht** übernommen. |

### Technische Eckpunkte (bestätigt durch M-E1–E4)
- Struktur analog `WUCD_LIB`: kuratierte Liste als Daten (im Quellcode oder separate gecachte JSON – Entscheidung bei Feinspezifikation nach Größe der Liste).
- Muskel-/Bewegungsmuster-Zuordnung bleibt ein internes Matching-Feld; ausdrücklich **keine** Muskelgruppen-Analytik im UI (Nicht-Ziel aus Briefing Abschnitt 4).
- Freie eigene Übungsnamen bleiben uneingeschränkt erlaubt – die Bibliothek ist Komfort, nie Pflicht.
- Recherche-Arbeitspaket vor der Umsetzung: Übungsliste mit DE/EN-Namen und Aliassen als eigenes Review-Dokument, Abnahme durch den Produktverantwortlichen (analog L-E5).

---

## Paket N – KI-Coach 2.0: Blockbegleitung

### Ziel & Nutzen
Der Coach erstellt heute nur das Programm. Ausbaustufe: Mitten im Block kann der Nutzer eine Anpassung anfragen („Woche 3 lief schlecht, Schulter zwickt“). Der Coach erhält Programm + relevante Fortschrittsdaten, antwortet mit angepasstem Programm-JSON, und die Übernahme läuft über den H-Pfad „Ersetzen & Fortschritt behalten“. Alleinstellungsmerkmal gegenüber allen Wettbewerbern außer Juggernaut AI (Abo).

### Entscheidungen (werden Schritt für Schritt getroffen)

| # | Frage | Entscheidung |
|---|---|---|
| N-E1 | Einstiegspunkt(e) im UI? | **ENTSCHIEDEN 16.07.:** Zwei Einstiege: 1. Button „Coach fragen“ beim aktiven Programm in der Programmverwaltung; 2. dezenter proaktiver Hinweis bei auffälligen Daten (z. B. Übung zweimal in Folge unter dem Zielbereich) – nur Hinweis, nie automatische Änderung. |
| N-E2 | Welche Daten gehen an die KI? | **ENTSCHIEDEN 16.07.:** Programm-JSON + je Übung eine kompakte aggregierte Fortschritts-Zeile (z. B. „Bankdrücken: W1 60 kg → W3 65 kg, zuletzt 2× unter Zielbereich“) + Freitext des Nutzers. Keine Datums-/Uhrzeitangaben, keine einzelnen Satzlisten, keine Gerätedaten. |
| N-E3 | Was darf der Coach ändern? | **ENTSCHIEDEN 16.07.:** Nur kommende Wochen; Übungen tauschen/ergänzen/streichen, Volumen, RIR, Zielbereiche, Gewichtsziele. Tage-Anzahl, Wochen-Anzahl und bereits trainierte Wochen bleiben unverändert. Übernahme über den H-Pfad (Fortschritt bleibt). |
| N-E4 | Vorschau/Bestätigung vor Übernahme? | **ENTSCHIEDEN 16.07.:** Zweiteilig: klare Änderungs-Liste („Was ändert sich + Warum“, vom Coach begründet) über der vollständigen Programm-Vorschau; Übernahme nur per explizitem „Übernehmen & Fortschritt behalten“. |
| N-E5 | Kosten-/Nutzungsrahmen? | **RICHTUNG ENTSCHIEDEN 16.07., Details offen:** Zukünftiges Zugangsmodell: kostenloses Kontingent für die Programm-Erstellung (Größenordnung 1–3 Programme); die laufende Block-Begleitung über Credits/Bezahlsystem **oder** – bevorzugt zu prüfen – als „Bring your own AI“-Weg: Anpassungs-Anfrage als Kopiertext für die eigene KI des Nutzers (analog „Mit ChatGPT & Co.“), Antwort-JSON zurück in die App, Übernahme über denselben Änderungs-Vorschau-Pfad. Nutzt vorhandene KI-Abos der Nutzer, kostet den Betreiber nichts. **Detail-Ausarbeitung als eigener Termin vor Paket-N-Start.** |

### Technische Eckpunkte (Empfehlung, noch zu bestätigen)
- Wiederverwendung: `coach.mjs`-Serverfunktion (Key bleibt serverseitig), `extractProgram`, `parseProgram`, H-Migration (`editorBuildRefMap`/`migrateReplaceStore`) für fortschrittserhaltende Übernahme.
- Vergangene, bereits trainierte Wochen dürfen inhaltlich nie verändert werden (Datenwahrheit); Änderungen wirken ab der aktuellen/kommenden Woche.
- Trainings-Schreibschutz (`FB-20260716-13`) gilt: keine Programmänderung während eines laufenden Trainings.

---

## Querschnitt (gilt für alle drei Pakete)
- Datenkompatibilität: Austauschformat v2 und `DATA_SCHEMA_VERSION` 4 bleiben unverändert; neue Felder nur optional.
- Jedes Paket einzeln: eigene Feedback-IDs, eigener Release, Abnahme nach Briefing Abschnitt 6/10.
- Vor Übernahme ins Briefing: Abgleich mit dem dann aktuellen Codestand (I–K verändern Editor, Store und Trainingsansicht).
