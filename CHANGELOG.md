# Versionshistorie

In dieser Datei werden alle nutzerrelevanten Änderungen an Satzkraft dokumentiert. Das Format orientiert sich an „Keep a Changelog“; die Versionsnummern folgen `MAJOR.MINOR.PATCH`.

> Hinweis zur Rückschau: v0.15.0 bis v0.16.0 wurden nachträglich aus `BRIEFING-CODEX.md` rekonstruiert. Für diese Zwischenstände existieren keine getrennten Git-Tags oder sicher belegten Veröffentlichungstage. Ab v0.17.0 wird jede Version zum Release-Zeitpunkt hier gepflegt.

## [Unreleased]

Noch keine Änderungen.

## [0.17.0] – 2026-07-15

### Hinzugefügt

- Vollständiges Import-Testprogramm `TESTPROGRAMM-ALLE-SZENARIEN.json` für Gewichte, Körpergewicht, Zusatzgewicht, kurze und lange Timer, eigene Übungsvorgaben sowie Warm-up/Cool-down.
- Automatischer Test, der das vollständige Testprogramm über die echte Programmvalidierung lädt.

### Geändert

- Erledigte Übungen klappen nicht mehr sofort nach dem letzten Satz ein. Sie bleiben bis zu 12 Sekunden offen und klappen früher ein, sobald in einer anderen Übung weitertrainiert wird.
- Zeitübungen verwenden einen Timerknopf direkt im Sekundenfeld; der zusätzliche Startknopf unter den Sätzen wurde entfernt.
- Sätze, Wiederholungsziel, Gewichtsziel und Pause bleiben in der Vorgabezeile zusammen.
- Editor-Übungszeilen zeigen zuerst die Trainingsgruppe und darunter die Parameter, unabhängig von Länge und Satzzeichen des Kategorienamens.
- Aufklapp-Pfeile wurden über die verschiedenen Programm- und Editorbereiche hinweg einheitlich vertikal zentriert.
- Info-Schaltflächen zeigen nur noch ein schlichtes Info-Zeichen ohne Kreis.
- Der Ablauf „Mit ChatGPT & Co. erstellen“ besteht jetzt aus einem freien Trainingswunsch, einem fertigen Kopiertext und einem klar beschriebenen JSON-Import.
- Importhinweise erklären deutlicher, dass die vollständige JSON-Antwort benötigt und vor dem Speichern auf fehlende Felder geprüft wird.
- App-Version und PWA-Cache wurden auf v0.17.0 angehoben.

### Produktentscheidung

- Der KI-Coach bleibt ohne zusätzlichen Beta-Zugangscode. Der zwischenzeitlich erwogene Code-Schutz ist kein Bestandteil dieses Releases.

## [0.16.0] – nachträglich rekonstruiert

### Hinzugefügt

- Beidseitiges Öffnen und Einklappen erledigter Übungskarten im aktiven Training.
- Automatischer Start der Satzpause zwei Sekunden nach einem vervollständigten Satz.
- Hilfetexte und Info-Schaltflächen für Trainingsgruppen, Übungstypen, RIR, Phasen, eigene Vorgaben, Startgewichte und Warm-up/Cool-down.
- Kalibrierungs-Hinweise für importierte Programme ohne voreingestellte Arbeitsgewichte.

### Geändert

- Gewichte und Wiederholungen können sich beim ersten Eintrag sinnvoll gegenseitig ergänzen; 0 kg wird nicht mehr automatisch als Arbeitsgewicht übernommen.
- Während einer Satzpause bleibt die Trainingsansicht scrollbar.
- Lange Zeitvorgaben werden lesbar in Minuten dargestellt, während die Eingabe weiterhin in Sekunden erfolgt.
- Editorbereiche behalten ihren Aufklappzustand nach Änderungen; geöffnete Übungen zeigen keinen irritierenden Verschiebe-Griff.
- Editor-Anleitung und Programmimport wurden für Einsteiger verständlicher formuliert.

## [0.15.4] – nachträglich rekonstruiert

### Geändert

- Plattformabhängige Unicode-Symbole wurden durch ein einheitliches Inline-SVG-Icon-System ersetzt.
- Trainingsrelevante Schriftgrößen wurden moderat verbessert.
- Die Hauptkopfzeile wurde auf „Programme“ und „Auswertung“ reduziert; Version und Theme-Wechsel befinden sich in der Programmverwaltung.
- Satz- und Übungsabschlüsse erhielten dezentes visuelles Feedback.

## [0.15.3] – nachträglich rekonstruiert

### Hinzugefügt

- Geführter Halte-Timer für Zeitübungen mit Zielbereich, Bestwert, Ton/Vibration und Übergang in die Satzpause.
- Kompakte Darstellung erledigter Übungen im laufenden Training.

## [0.15.2] – nachträglich rekonstruiert

### Hinzugefügt

- Dreistufiger Übergabeprozess für die Programmerstellung mit ChatGPT und anderen externen KIs.
- Trainingswissenschaftliche Leitplanken in der exportierten KI-Vorlage.
- Zentraler Bereich „Exportieren & Teilen“ in der Programmverwaltung.

### Geändert

- Erstellen-Hub und Importwege wurden verständlicher benannt und geordnet.

## [0.15.1] – nachträglich rekonstruiert

### Hinzugefügt

- Verständliche Auswahl des Übungstyps anstelle mehrerer voneinander abhängiger Checkboxen.
- Bearbeitung von Warm-up und Cool-down mit Übungsauswahl, Sekunden, Reihenfolge und Undo im Editor.

## [0.15.0] – nachträglich rekonstruiert

### Hinzugefügt

- Direkter Leeren-Button für eingefügtes Programm-JSON.
- Bestwerte und zugehörige Wochen in der Auswertung.
- Verlässlicher direkter Druck/PDF-Export ohne separates Popup.

### Geändert

- Auswertung auf drei zentrale Kennzahlen reduziert; Deload-Wochen verzerren gewichtete Übungstrends nicht mehr.
- Veraltete Importtexte, Editor-Hilfen und die Trainingslegende wurden aktualisiert.
- Doppelte Workout-Steuerung entfernt; die untere Leiste ist die einzige laufende Trainingssteuerung.

## [0.14.1] – 2026-07-13

### Hinzugefügt

- Sicherer visueller Programmeditor mit Kopie-/Ersetzen-Ablauf.
- Vollständige Backups über alle Programme und Trainingsdaten sowie abgesicherte Wiederherstellung.
- Tests für Trainingsdaten, Editor und Backup-Verwaltung.

### Geändert

- PWA-Cache wurde für zuverlässigere Live-Aktualisierungen erneuert.

## Vor v0.14.1

- Aufbau der lokalen Satzkraft-PWA, der Programm- und Trainingslogik sowie der serverseitigen KI-Coach-Funktion.
- Diese frühen Entwicklungsstände hatten keine konsistent gepflegten App-Versionen oder Release-Tags.

