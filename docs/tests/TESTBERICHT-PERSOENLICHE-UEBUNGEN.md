# Historische Erfassung, persönliche Übungen und Detailansicht

Stand: 13.10.2026 · Arbeitsstand v0.33.4 + Unreleased. Der Auftrag „alle 5 Punkte durcharbeiten“ erweitert den bisherigen Umfang um historische Erfassung, persönliche Bibliothek und die Detailansicht. Persönliche Bibliothek und Detailansicht werden als getrennte Arbeitspakete geführt. Eine öffentliche Veröffentlichung wurde nicht beauftragt.

## Ergebnis

- Neue Logs erhalten beim ersten vollständigen Satz `performedExercise` mit dem damals ausgeführten Namen, optionaler Übungs-ID, Wiederholungs-/Zeiteinheit, Gewicht/Zusatzgewicht, Seitenregel und Gewichtskonvention. Vorher wird der Eingabekontext in `pendingPerformedExercise` gehalten. Spätere Korrekturen erhalten den Kontext.
- Alte Logs erhalten keine geratenen Snapshots. Auswertung trennt bestätigte Identität/Erfassung und Altbestand. Protokoll und Details zeigen die wirklichen historischen Satzwerte; eine spätere geringere Satzvorgabe schneidet diese Werte nicht ab.
- Persönliche Übungen besitzen portable `custom_...`-Definitionen. Neue Erfassungsart, Gewichtskonvention oder Gerätevariante erzeugt eine neue Identität. Integrierte Übungen werden nur als eigene Variante kopiert.
- Vollständige Sicherung enthält `personalExercises`, eingebettete Programmdefinitionen und historische Erfassung. Schema 5 schützt neue Backups vor Wiederherstellung durch ältere Backup-Reader. Schema-4-Backups bleiben ladbar; keine automatische historische Anreicherung.
- Programmdateien bleiben `trainings-block` v2 mit vollständigen ausführbaren Satzfeldern und optionalen eingebetteten persönlichen Definitionen. Bereits belegte abweichende persönliche IDs werden in der Importkopie neu zugeordnet und in der Vorschau benannt. Die bestehende Bibliothek wird erst beim bewussten Speichern ergänzt.
- Vollbildansicht für Technik, letzte Leistung und Verlauf über aktive und archivierte Programme. Archivieren entfernt die persönliche Übung aus der Auswahl und bewahrt Definition und Historie.

## Gezielte Prüfungen

| Datei | Unterschiedliche erfolgreiche Fälle |
| --- | ---: |
| `tests/personal-exercise-history.test.cjs` | 18 |
| `tests/report.test.cjs` | 12 |
| `tests/archive-report.test.cjs` | 7 |
| `tests/exercise-reference.test.cjs` | 14 |
| `tests/backup.test.cjs` | 6 |
| `tests/storage-coordination.test.cjs` | 8 |
| `tests/coach-preferences.test.cjs` | 6 |
| **Summe** | **71** |

Die Fälle decken Teil-/Volleingabe, unveränderliche historische Angaben, Altbestand, Tausch, getrennte Trends, Archiv, persönliche Importkonflikte, Kataloglimits, fehlende Definitionen, Schema-Grenzen, Speicherfehler und Fensterkoordination ab. Bestehende Fixtures wurden um die tatsächlich benötigten Validatoren und Schema 5 ergänzt; historische Schema-4-Beispiele bleiben erhalten. Fehlgeschlagene Zwischenläufe durch fehlende Fixture-Abhängigkeiten wurden korrigiert, keine Prüfung entfernt. Erfolgreiche unveränderte Dateien wurden nicht pauschal erneut ausgeführt.

Browser: ein gezielter Fall **REG-30**, Projekt **mobile-webkit**, zuletzt erfolgreich mit 6,3 Sekunden Testzeit. Er prüft Erstellen, Auswahl im Editor, Speichern/Aktivieren, Satzerfassung, Hintergrundereignis, Reload mit Pause, Details, Backup-Validierung, Sicherheitsdownload und Wiederherstellung einschließlich Reload. Offline wird die Detailansicht in der bereits geladenen App geprüft. Breiten 390, 320 und 1440 CSS-Pixel; Hell/Dunkel, kein Seitenüberlauf, Navigation per Tastatur. Fünf gezielte Screenshots unter `replica/clone-screens/`; die gefüllten Ansichten wurden visuell geprüft. Keine Änderung der allgemeinen Screenshot-Baselines.

Der Standardport gehörte zu einem anderen Projekt; dessen Seite ist kein Prüfergebnis. Der eigene lokale Server auf Port 4317 wurde eng freigegeben. Ein versuchtes Offline-Neuladen endete mit einem internen WebKit-Automationsfehler und wird ausdrücklich nicht als bestanden geführt. Weitere Zwischenläufe korrigierten die Bedienung einer nach Reload eingeklappten fertigen Übung und das Abwarten der Backup-Neuladung.

## Offene Abnahme und Grenzen

- Echte iPhone-/Android-Bedienung, Tastatur/Safe Area, installierte PWA, Offline-Neustart und Betriebssystem-Beendigung bleiben offen. [Konkrete Gerätecheckliste](SMARTPHONE-ABNAHME.md).
- Kein vollständiger Node-Lauf, keine Browsermatrix und keine allgemeine visuelle Regression. Diese Läufe benötigen nach der Teststrategie einen ausdrücklichen Auftrag.
- Keine Unterstützung/Gegengewicht, neue Progressionskennzahl, Cloud oder KI-API. `js/progression.js` bleibt unverändert.
- App-Version und Service-Worker-Cache bleiben v0.33.4. Vor einem ausdrücklich beauftragten Release synchron erhöhen und die reale Geräteabnahme abschließen. Ein Git-Upload ist keine neu bestätigte Live-Abnahme.

## Nachfolgender Updateauftrag

„Einmal komplett updaten“ vom 13.10.2026 beauftragt anschließend Version v0.34.0 mit synchronem Offline-Cache und Upload des fertigen Stands nach GitHub/main. Die obigen Prüfergebnisse bleiben datierte Ergebnisse der Umsetzung; physische Geräteabnahme und vollständige Suite werden dadurch nicht nachträglich als bestanden ausgegeben. [Updatebericht](../../replica/deploy.md).
