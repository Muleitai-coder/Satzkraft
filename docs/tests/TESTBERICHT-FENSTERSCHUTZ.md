# Schutz lokaler Daten bei mehreren Fenstern

Stand: 11.10.2026 · Arbeitsstand v0.33.4 + Unreleased · Umsetzung Paket A aus `replica/architecture.md`.

Ein veraltetes zweites Fenster darf neuere Satzwerte nicht ersetzen. Die aktualisierte App erlaubt genau einem Fenster Schreibzugriff je lokalem Speicherbereich. Andere Fenster warten und können den geöffneten Stand sichern; eine bewusste Übernahme lädt erst den aktuellen Speicherstand. Der integrierte API-Coach bleibt entfernt, der lokale externe KI-Weg bleibt erhalten.

## Geprüfte Änderung

- Exklusive Web Lock vor schreibbarer Bedienung, ohne Ablaufzeit oder erzwungenes Übernehmen. Hintergrundwechsel behält die Freigabe; `pagehide` speichert und gibt sie ab. Eine erhaltene Seite erwirbt sie erneut und lädt frisch.
- Gemeinsamer Schutz für verzögerte Saves, Hintergrundspeicherung, direkte Backup-Wiederherstellung und Komplettlöschung. Exakter Vergleich mit dem zuletzt geladenen beziehungsweise selbst gespeicherten Hauptzustand erkennt fremde Änderungen.
- Geschützte Warteansicht mit bestehenden hellen/dunklen Tokens, Fokusführung und bewusstem Neuladen. Hauptoberfläche und Dialoge sind währenddessen nicht bedienbar.
- Fortschritt und Editorentwurf bleiben bei Konflikten erhalten. Eine einzelne Sicherungsdatei enthält das reguläre Schema-4-Backup und bei Bedarf ein optionales `windowDraft` für die manuelle Wiederaufnahme von Editor-/Formularwerten. Dieser Entwurf wird nicht automatisch beim Restore zusammengeführt.
- Speicherfehler melden keinen erfolgreichen Blockabschluss/Folgeblock und schließen den Editor nicht als erfolgreich gespeichert. Fehlende oder abgelehnte Fensterkoordination blockiert Schreibvorgänge; Backup bleibt erreichbar.

## Tatsächlich ausgeführte Prüfungen

### Gezielte Node-Prüfungen

```bash
node --test --test-reporter=spec tests/storage-coordination.test.cjs tests/local-data-privacy.test.cjs tests/backup.test.cjs tests/program-editor.test.cjs tests/coach-preferences.test.cjs
```

**47 Tests bestanden.** Die neue Datei umfasst acht Fälle: ein Writer und veraltete Saves, Konflikt/Entwurf, Hintergrund und Seitenlebenszyklus, Restore, Komplettlöschung mit fremden Schlüsseln, Quota-Fehler, fehlende/abgelehnte Koordination und Script-/Datenkompatibilität. Die vorhandenen gezielten Verträge zu Backups, Datenschutz, Editor und früherem Coach bestehen ebenfalls.

Die isolierten Kontexte verwenden einen gemeinsamen synthetischen Speicher und einen kontrollierten Lock-Manager. Das prüft die App-Entscheidungen; die tatsächliche Browser-Lock wird zusätzlich im folgenden Fall verwendet.

### Gezielter Browserfall

```bash
./node_modules/.bin/playwright test --config qa/playwright/playwright.config.cjs --project mobile-webkit --grep 'REG-27' --update-snapshots=none
```

**Ein Fall bestanden, 7,7 Sekunden Testzeit.** Mehrere Seiten teilen einen Browserkontext und damit dieselben lokalen Daten. Geprüft wurden:

1. Ein zweites Fenster erhält keinen Schreibzugriff; auch direkte Satzänderung, `persist()` und ein ausgelöstes Hintergrundereignis ersetzen den neuen Satz nicht.
2. Eine Übernahme bei noch geöffnetem Writer erzwingt keine Freigabe. Nach dessen tatsächlichem Schließen lädt das zweite Fenster die aktuellen Satzwerte und stellt das Training pausiert wieder her.
3. Ein simulierter `pagehide`/`pageshow.persisted`-Zyklus prüft erneuten Erwerb und frisches Laden. Das ist keine vollständige reale BFCache-Abnahme.
4. Ein absichtlich nicht kooperierender Speicherzugriff simuliert altes JavaScript. Der neue Writer stoppt weitere Saves und behält seinen ungespeicherten Trainingsstand.
5. Eine tatsächliche Browser-Sicherungsdatei enthält die ungespeicherten Werte. Ein weiterer Konflikt mit einem im Editor eingegebenen Programmnamen erhält den Editorentwurf in der Datei. Bewusstes Neuladen übernimmt danach den fremden aktuellen Stand.
6. Hinweis und Fokuswechsel funktionieren bei 320 px in hellem und dunklem Schema ohne horizontalen Überlauf.
7. Ohne `navigator.locks` erscheint der Browserhinweis und Schreiben bleibt blockiert. Keine Seitenfehler im beobachteten Haupt-/Zweit-/Altkontext.

Der lokale Testserver konnte in der Sandbox zunächst nicht lauschen (`EPERM`); der eng begrenzte Browserlauf wurde anschließend mit freigegebener lokaler Serverberechtigung ausgeführt. Zwischenläufe führten zur korrekten Reihenfolge beim erneuten Lock-Erwerb und zur einzelnen Sicherungsdatei; Testfixture, kontrollierte ungespeicherte Änderungen und der Editor-Reiter wurden korrigiert. Die oben genannten finalen Läufe sind erfolgreich.

`git diff --check` und eine Syntaxprüfung der Browser-Testdatei wurden zusätzlich ausgeführt. Die unveränderte gesamte Node-Suite, Browsermatrix und visuellen Baselines wurden nicht ausgeführt oder aktualisiert.

## Grenzen und offene Abnahme

- Physisches iPhone, installierte PWA, echter BFCache, Offline-Neuladen und Betriebssystem-Beendigung sind nicht neu praktisch geprüft. Bestehende Verträge/Prüfungen ersetzen diese Geräteabnahme nicht.
- Web Locks koordinieren nur Fenster, die denselben Schutz verwenden. Altes JavaScript kann weiterhin ohne Lock schreiben; der Standvergleich erkennt fremde Änderungen, garantiert aber keine atomare Zusammenarbeit mit dieser alten Version. Vor Veröffentlichung alle alten Satzkraft-Fenster schließen beziehungsweise aktualisieren.
- Bei fehlender Web-Locks-Unterstützung bleibt Schreiben gesperrt. Regulärer Einstieg über HTTPS oder localhost; kein behaupteter sicherer Speicher-Heartbeat als Ersatz. Eine breite Geräte-/Browserfreigabe ist offen.
- Das Entwurfsfeld dient der manuellen Wiederaufnahme, nicht einem automatischen Merge oder einem neuen Programm-Austauschformat. Reguläre Programme und Backups bleiben Schema 4 beziehungsweise `trainings-block` Version 2.
- Änderungen sind lokal. Kein Commit, Push oder Deployment; App-Version und Service-Worker-Cache bleiben v0.33.4. Vor einer später beauftragten Veröffentlichung synchron erhöhen, neue statische Dateien bauen und alte API-Provider-Konfiguration im Hosting entfernen.

Nächster vorgeschlagener Entwicklungsschritt: Paket B, korrekte Auswertung gewichteter Zeitübungen. Sekunden dürfen weder als Wiederholungen für 1RM noch als kg-Volumenfaktor ausgewertet werden.
