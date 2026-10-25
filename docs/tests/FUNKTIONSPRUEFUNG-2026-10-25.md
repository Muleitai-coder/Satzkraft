# Umfassende Funktionsprüfung und PDF-Reparatur

Stand: 25.10.2026, lokaler Arbeitsstand v0.39.0. Beauftragt: vorhandene Fehlerbehebungen aus dem anderen Chat integrieren, defekten PDF-Weg beheben und die Funktionen umfassend testen.

## Ergebnis

Die vorhandenen Übungs-/Verlaufskorrekturen sind in die gemeinsame Quellstruktur übernommen. Auswertung und Protokoll erzeugen jetzt eine echte PDF-Datei lokal; sie benötigen dafür keinen funktionierenden Browser-Druckdialog. Dateien sind durchsuchbar, enthalten die eingebettete Schrift und umbrechen über mehrere A4-Seiten. Web/PWA bietet Dateifreigabe beziehungsweise Download, iOS den nativen Teilen-Dialog. Backups und gespeicherte Trainingsdaten werden dabei nicht geändert.

Ein zusätzlicher iPhone-Test hat ein zu kleines PDF-Touchziel nachgewiesen (rund 38 px Breite). Die Knöpfe haben jetzt mindestens 44 × 44 px. Druckfarben im Dunkelmodus und lange Drucktitel wurden ebenfalls korrigiert.

Der genaue ursprüngliche Gerätefehler ist nicht auf dem persönlichen iPhone reproduziert: die Plattform-Rückfrage blieb unbeantwortet. Nachgewiesen war, dass der alte Knopf ausschließlich `window.print()` aufrief und die bestehenden Tests diesen Aufruf nur nachbildeten. Der neue Dateiexport wird unabhängig davon durch echte PDF-Dateien geprüft. Eine pauschale Ursache aller früheren Probleme ist daraus nicht ableitbar.

## Durchgeführte Prüfungen

| Prüfung | Ergebnis |
| --- | --- |
| Gesamte Node-Suite `npm run test:all:unit` | **345/345 bestanden**, abschließender vollständiger Lauf |
| Native Node-Suite `npm --prefix native test` | **9/9 bestanden** |
| Bestehende funktionale Browsermatrix, Chromium/WebKit, Desktop/Mobil | **160 Fälle nach Korrekturen abgedeckt**: erster Gesamtlauf 142 bestanden/18 fehlgeschlagen; danach gezielte Wiederholungen aller betroffenen Fälle |
| PDF-Matrix `pdf.config.cjs` | **8/8 bestanden**, abschließender Lauf über alle vier Browserprofile |
| iPhone-17-Pro-Profil, REG-31 | **1/1 bestanden**, einschließlich Offline-Neustart und erstmaligem PDF-Ressourcenabruf bei abgeschaltetem Testserver |
| Native WebKit-Abnahme, NATIVE-01 | **1/1 bestanden**, einschließlich PDF-Base64 ohne UTF-8-Fehler, Teilen, Abbruch, Speicherfehler und Restore; Plugins sind Test-Doubles |
| Datenrettung, DATA-01 | **1/1 bestanden**, beschädigter Speicher, Rohdatenexport, bewusster Neustart und abgesicherter Restore |
| Quellbuild, Architekturprüfung und öffentliche Positivliste | Bestanden; 17 öffentliche Dateien einschließlich vier PDF-Ressourcen/Lizenzen |
| `npm run ios:sync` | Bestanden; gemeinsame Dateien und native Plugins synchronisiert |
| `npm run ios:doctor` | Quellfingerprint und native Dateihashes aktuell; Gesamtcheck meldet fehlendes/nicht ausgewähltes Xcode |
| Neue Abhängigkeit | jsPDF 4.2.1 fest versioniert; npm meldete bei Installation 0 bekannte Schwachstellen |

Die 160 bestehenden Browserfälle wurden nach dem ersten vollständigen Lauf **gezielt** nachgeprüft, nicht als unveränderter Gesamtlauf wiederholt. 28 Fälle zu Editorzuordnung, Tauschen, Offlinebetrieb, Fensterschutz, Historie, Druck und Restore wurden erneut ausgeführt; davon bestanden 27 direkt. REG-27/Desktop-WebKit bestand anschließend isoliert ohne Videoaufzeichnung und abschließend in seiner regulären separaten Testdatei (37,1 Sekunden). Zusammen mit den acht neuen PDF-Fällen und den drei Spezialabläufen sind **171 unterschiedliche Browser-/Adapterfälle** geprüft. Native Node-Prüfungen zusätzlich zur Web-Suite: insgesamt **354 unterschiedliche Node-Fälle**.

## Gefundene Testlücken und ihre Reparatur

- Ältere Funktions-Extraktionstests initialisierten den lokalen Schreibkontext sowie persönliche Übungsdefinitionen nicht mehr vollständig. Die Kontexte wurden ergänzt, statt Schutzabfragen aus der App zu entfernen.
- Die bisherigen Extraktionshelfer verloren bei asynchronen Funktionen das Schlüsselwort `async`. Sie bewahren es jetzt; die neuen Exportfunktionen werden nicht zur Umgehung der Tests synchron umgeschrieben.
- Der dauerhafte Übungstausch-Test ließ das alte schreibende Fenster offen. Er schließt es jetzt vor dem erneuten Laden der gespeicherten Entscheidungen. Der eigenständige Mehrfenstertest prüft die Sperre weiterhin ausdrücklich.
- Der Wiederherstellungstest wartete nach dem Sicherheitsdownload bereits auf eine Navigation. Er bestätigt jetzt den realen zweiten Schritt „Datei geprüft – wiederherstellen“.
- Erwartungen an Übungsdetails, Autocomplete-Texte und Protokollhinweise entsprechen dem aktuellen fachlichen Stand. Assertions zu Daten, historischen Werten und Entscheidungen bleiben erhalten.
- REG-27/Desktop-WebKit hing in dieser macOS-Testumgebung beim Erzeugen zusätzlicher Hintergrundseiten. Ein 90-Sekunden-Lauf mit Video scheiterte; derselbe Test ohne Video bestand in 44,6 Sekunden. Nur dieser Fall deaktiviert Video. Fehler-Screenshots, Traces und sämtliche Assertions bleiben aktiv. Der Test hat wegen seiner vier Fenster und mehreren Speicherübergänge ein 90-Sekunden-Budget.
- Beobachtungsscreenshots aus Funktionstests werden je Testlauf abgelegt. Die vier Browserprofile überschreiben keine gemeinsamen versionierten Referenzbilder mehr.

## Tatsächliche PDF-Prüfung

Das mitgelieferte synthetische Testbackup erzeugt **zwei Seiten Auswertung** und **zehn Seiten Protokoll** in jedem Browserprofil. Die Dateien wurden mit Poppler geöffnet/gerendert und mit pypdf ausgelesen. Alle erwarteten Titel, Zusammenfassungen, Übungswerte, Notizen und letzten Protokolleinträge sind im extrahierten Text enthalten. Die Seiten wurden visuell auf abgeschnittene Inhalte, Überlappungen und leere Folgeblätter geprüft.

Zusätzlich geprüft: `%PDF-`-Dateikopf, eingebettete Schrift, Unicode-Zuordnung, Objektverzeichnis, mehrseitige lange Notizen, unveränderte Quelldaten, sichtbarer Ressourcenfehler mit anschließend erfolgreicher Wiederholung, abgebrochene Web-Freigabe und echtes binäres Schreiben im nativen Adapter. Der Offlinefall lädt Bibliothek und Schrift erst nach dem Cache-Neustart bei nicht erreichbarem Ursprung. Chromium und WebKit erzeugten die Dateien außerdem unter der echten Content-Security-Policy aus `netlify.toml`.

Die exportierte Zusammenfassung stellt die Diagramme durch benannte Vergleichswerte dar. Sie ist ein lesbarer Bericht, kein Bildschirmfoto. Die lokale Hanken-Grotesk-Latin-Schrift deckt den deutschen Bericht ab; beliebige zusätzliche Schriftsysteme und Emoji sind keine zugesicherte PDF-Schriftabdeckung.

## Verbleibende Grenzen

- Keine echte iPhone-/Safari-/Home-Screen-Abnahme und kein erfolgreicher Swift-/Xcode-Build: Xcode ist hier weiterhin nicht nutzbar ausgewählt. Signierung, tatsächlicher Teilen-/Dateidialog und Installation auf dem persönlichen Gerät bleiben offen.
- Keine neue vollständige Screenshot-Baseline-Abnahme und keine Snapshot-Updates. Funktionale Layoutprüfungen für schmale Ansichten sowie PDF-Sichtprüfung wurden ausgeführt.
- Quellbereiche teilen weiterhin globalen Anwendungszustand. Die vorherige Strukturmigration ist keine vollständige Entkopplung aller Module; der PDF-Pfad nutzt einen expliziten Dateiadapter und einen reinen Layoutkern.
- Dieser Bericht belegt den lokalen Arbeitsstand. Die frühere automatische Freigabeprüfung hat den Upload nach `origin/main` mangels ausdrücklicher Veröffentlichungsfreigabe abgelehnt. Kein erneuter Push und keine Änderung der Live-App durch diesen Auftrag.

## Nachvollziehbare Quellen

- [jsPDF: lokale PDF-Erzeugung und Schrifteinbettung](https://github.com/parallax/jsPDF)
- [MDN: `window.print()` öffnet den Druckdialog](https://developer.mozilla.org/en-US/docs/Web/API/Window/print)
- [Hanken-Grotesk-Lizenz](../../fonts/OFL-Hanken-Grotesk.txt)
- [Architekturentscheidung](../ARCHITECTURE.md#lokaler-pdf-export), [zentrale Designregeln](../DESIGN-BRIEFING.md#8-pdf-und-druck), [Teststrategie](../TESTING.md)
