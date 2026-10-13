# Satzkraft – Abnahme auf dem eigenen Smartphone

Stand: 13.10.2026. **Vorbereitet, auf einem physischen Gerät noch nicht durchgeführt.** Der automatisierte WebKit-Fall und die Node-Prüfungen stehen im [Prüfbericht](TESTBERICHT-PERSOENLICHE-UEBUNGEN.md). Dieses Blatt ersetzt diese Prüfungen nicht und wird erst nach einer tatsächlichen Rückmeldung als bestanden markiert.

## Vorbereitung

- Ein vollständiges Backup der bisherigen App herunterladen und prüfen, dass die Datei vorhanden ist.
- Alle alten Satzkraft-Fenster schließen. Den neuen Arbeitsstand zuerst über eine ausdrücklich bereitgestellte Testadresse öffnen; ein bisheriger Live-Link enthält nicht automatisch die neuen Funktionen.
- Hauptgerät und Systemversion notieren: ____________________.
- Datum und verwendeten App-Stand notieren: ____________________.
- Die Fälle mit einem Testprogramm und erfundenen Satzwerten ausführen. Neue Backups verwenden Schema 5; vorhandene Schema-4-Backups bleiben importierbar. Zur Prüfung der Wiederherstellung einen getrennten Testbrowser verwenden, damit persönliche Trainingsdaten erhalten bleiben.

## Prüffälle

| Fall | Durchführung | Erwartung | Ergebnis |
| --- | --- | --- | --- |
| G01 | Programme → Übungen & persönliche Bibliothek → Eigene Übung erstellen. Name, Gerät, Technik und „pro Hantel“ speichern. | Übung erscheint mit ihren Angaben; Tastatur verdeckt die Aktion nicht dauerhaft. | offen |
| G02 | Im Programmeditor über die Namenssuche die persönliche Übung wählen, Programm speichern und Training starten. 10 Wiederholungen mit 20 kg erfassen. | Wiederholungen und Gewicht bleiben sichtbar und korrekt gespeichert. | offen |
| G03 | In eine andere App wechseln, Bildschirm sperren und nach einer Minute zurückkehren. | Satzwerte erhalten; die laufende Zeit läuft bei normalem Hintergrundwechsel weiter. | offen |
| G04 | Die App neu laden und die Übung aufklappen → Namen öffnen. | Training pausiert; Detail zeigt „10 × 20 kg · pro Hantel“ und den Verlauf. | offen |
| G05 | Online einmal vollständig laden, dann Flugmodus einschalten. Detail öffnen und App im Flugmodus neu starten. | Geöffnete Ansicht und Offline-Neustart funktionieren; Satzwerte bleiben erhalten. | offen |
| G06 | Testtraining beenden; Übung umbenennen. Danach Gerät oder Erfassungsart ändern. | Name darf dieselbe Identität behalten; andere Erfassung/Gerätevariante erzeugt eine neue Übung. Alte Werte behalten ihre ursprünglichen Angaben. | offen |
| G07 | Vollständiges Backup herunterladen, in einem getrennten Testbrowser wiederherstellen. | Persönliche Übung, Programme, Satzwerte und historische Erfassung vollständig vorhanden. Vor Wiederherstellung wird eine Sicherheitskopie angeboten. | offen |
| G08 | Eine persönliche Übung archivieren und das zugehörige Programm öffnen. | Aus der neuen Auswahl entfernt; Definition und Verlauf bleiben verfügbar. | offen |
| G09 | Zwei Satzkraft-Fenster/PWA und Browser öffnen; im ersten einen Satz speichern. | Zweites Fenster überschreibt nichts; nach Schließen des ersten wird der neueste Stand bewusst geladen. | offen |
| G10 | App im Hintergrund durch das Betriebssystem beenden lassen beziehungsweise schließen und erneut öffnen. | Letzter bestätigter Satz bleibt erhalten; Training wird beim vollständigen Neustart pausiert. | offen |
| G11 | Hell/Dunkel, lange Übungsnamen, Scrollen und Bildschirmtastatur prüfen. | Kein horizontaler Überlauf; Zurück/Schließen bleiben erreichbar und halten Abstand zur Statusleiste. | offen |

Rückmeldung je Fehler: Fallnummer, Gerät, ausgeführte Schritte und tatsächliches Ergebnis. Bis zu dieser Rückmeldung bleibt die reale Geräteabnahme offen.
