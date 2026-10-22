# Satzkraft – zentrale Projektübersicht

Stand: 22.10.2026. Die zentrale Koordination liegt im Chat „Projektstatus zusammenfassen“. Dieser Stand ist eine Aufgabenübersicht; verbindliche Produktregeln stehen im [Briefing](../BRIEFING-CODEX.md).

| Arbeitspaket | Stand | Ergebnis / verbleibend |
| --- | --- | --- |
| 1 – Bisherigen Änderungsstand prüfen und sichern | gesichert und hochgeladen | Zwischenstand `3a631a0`, Ausbau `31397ba` und App-Update `6103451` auf GitHub/main |
| 2 – Mobile Abnahme | automatisiert geprüft; physisches Gerät offen | Ein gezielter WebKit-Ablauf mit Erstellen, Training, Reload, Backup-Restore und Offline-Bedienung. [Gerätecheckliste](tests/SMARTPHONE-ABNAHME.md) wartet auf tatsächliche Rückmeldung. |
| 3 – Historische Leistungen eindeutig halten | umgesetzt | Neue vollständige Sätze bewahren Name und Erfassung; Altbestand wird nicht nachträglich geraten. Auswertung trennt unterschiedliche Konventionen. |
| 4 – Persönliche Übungen | umgesetzt | Erstellen, Auswahl, Bearbeiten, Varianten, Archivieren; vollständige Sicherung und portable Programmdefinitionen |
| 5 – Übungsdetailansicht | umgesetzt | Technik, letzte Leistung und Verlauf aus aktiven/archivierten Blöcken; mobil und bei Desktop-Breite geprüft |

Die letzte Empfehlung hatte vier nummerierte Schritte; ihr vierter Schritt enthielt Bibliothek und Details. Diese sind hier als zwei eigenständige Pakete geführt. Der anschließende Auftrag „einmal komplett updaten“ beauftragt jetzt v0.34.0 und den Upload nach GitHub/main für den bisherigen privaten App-Einsatz.

[Prüfbericht](tests/TESTBERICHT-PERSOENLICHE-UEBUNGEN.md): 71 unterschiedliche gezielte Node-Fälle und ein gezielter Browserfall. Keine vollständige Suite oder Browsermatrix. Neue vollständige Backups verwenden Schema 5 und lesen ältere Schema-4-Backups; Programmformat bleibt v2. App-Version/Cache sind für das Update auf v0.34.0 synchron erhöht; GitHub-Upload und Live-Abnahme werden im [Updatebericht](../replica/deploy.md) festgehalten.

Nächster erforderlicher Schritt: Rückmeldung zur echten Smartphone-/PWA-Abnahme. Das beauftragte Update wird mit ausdrücklich offener physischer Geräteabnahme durchgeführt. Unterstützung/Gegengewicht und neue Kennzahlen bleiben gesonderte zukünftige Aufgaben. Konten, Cloud und KI-API gehören weiterhin nicht zum aktuellen Produktumfang.

## Neues iPhone-Offline-Testsystem v0.35.0

Einstellungen → Admin & Tests führt jetzt durch zehn Offline-Prüfschritte mit getrenntem synthetischem Training. Dein iPhone 17 Pro ist vorausgewählt; Modell, tatsächliche iOS-Version, Safari/Home-Bildschirm-App und App-Version gehören zum jeweiligen Lauf. Bereitschaftscheck und Wiederlade-Prüfpunkte ergänzen die persönliche Durchführung. Geräteberichte bleiben lokal und lassen sich zwischen iPhones per JSON-Datei vergleichen. [Verständliche Anleitung und Gerätematrix](tests/IPHONE-OFFLINE-TESTSYSTEM.md).

Gezielt geprüft: 34 unterschiedliche Node-Fälle aus Geräteassistent, Speicherkoordination, Backup, Altbereinigung, Version und Service Worker. REG-31 im Projekt mobile-chromium besteht: tatsächlicher Offline-Reload über Service Worker, Testwerte/pausiertes Training, getrennte Speicher, zweiter Test-Tab, markiertes Backup mit Wiederherstellung, Berichtimport/-export, Rücknahme eines fehlgeschlagenen Teststarts und Rückkehr zum echten Zustand. Darstellung bei 320/440/1440 px und hell/dunkel gesichtet. Build: 14 öffentliche Dateien. Keine vollständige Suite oder Browsermatrix.

v0.35.0 ist mit App-Commit `51021e8` auf GitHub/main hochgeladen und live unter https://satzkraft.netlify.app/ bestätigt. Einstellungen → Admin & Tests → iPhone-Offline-Test öffnen zeigt das vorausgewählte iPhone 17 Pro; es wurde dort kein physischer Testlauf angelegt. [Live-Nachweis](../replica/clone-screens/live-device-test-v0.35.0.jpg).

**Physische iPhone-Abnahme weiterhin offen.** Der automatisierte Browserlauf ist ausdrücklich kein bestandener iPhone-Test. Als Nächstes den Assistenten auf deinem iPhone 17 Pro zuerst in Safari, anschließend in der installierten App durchführen.

## Bisheriges Updateergebnis v0.34.0

v0.34.0 ist auf GitHub/main hochgeladen. Version, Offline-Cache, Pakete und Versionshistorie sind synchron; fünf gezielte Versions-/Cacheprüfungen und der Build bestehen. Ein ZIP mit genau den 13 öffentlichen Dateien liegt neben dem Repository bereit. Die Netlify-Veröffentlichung ist bestätigt: https://satzkraft.netlify.app/ zeigt v0.34.0. Übungssuche, Detailansicht und Versionshistorie wurden auf der Live-Seite geprüft; Netlify meldet null aktive Functions. Die unbenutzte Netlify-Variable `ANTHROPIC_API_KEY` wurde nach Bestätigung gelöscht; die leere Variablenliste und die weiterhin erreichbare App v0.34.0 sind geprüft. [Bereitstellungsbericht](../replica/deploy.md).

## Ergänzung v0.35.1 – iOS-Auswahl

Die installierte Version ist direkt auswählbar; andere Versionen und Betas bleiben frei eingebbar. Vorhandene Angaben werden beim nächsten Lauf korrekt vorbelegt. 16 gezielte Node-Fälle (Geräteassistent, Version, Cache) und REG-32 in mobile-webkit bestanden; Build mit 14 öffentlichen Dateien. Kein großer Testlauf. Upload nach main (`60181bd`, `e2659d5`) und Live-Ansicht v0.35.1 bestätigt; [Nachweis](../replica/clone-screens/live-ios-auswahl-v0.35.1.jpg).


## Überarbeitete Gerätebegleitung v0.36.0

Auf das Feedback zur unverständlichen Testoberfläche folgen jetzt einzelne Aufgaben mit konkreten Handlungen, erwarteten Ergebnissen und einer einfachen Rückfrage. Online-Vorbereitung läuft automatisch. Der Hauptknopf bleibt auch bei 320 × 568 px sichtbar; im Training erinnert ein Hinweis an die Aufgabe. Bibliothek und Backup öffnen direkt. Unteraufgaben werden nach einem Neustart fortgesetzt. Testdaten und echte Trainingsdaten bleiben getrennt.

Geprüft: 14 gezielte Node-Fälle (Gerätetest und Version), REG-31 in mobile-chromium nach dem Umbau und nochmals nach der Verbesserung für kurze Displays erfolgreich. Der Browserfall umfasst Offline-Eingaben, Zeit/Stoppuhr, Wiederaufnahme der Teilaufgabe, atomaren Prüfpunkt/Reload, gesperrte Kaltstart-Bestätigung vor Neustart, isolierten Speicher, zweiten Tab, persönliche Testübung, geführten Backup-Download/Restore, Berichte, Abschluss und Rücknahme eines fehlgeschlagenen Teststarts. Hell/Dunkel sowie 320/440/1440 px gesichtet. Build: 14 öffentliche Dateien. Keine vollständige Suite oder Browsermatrix; physische iPhone-Abnahme weiterhin offen. REG-32 bleibt an die neue Navigation angepasst, wurde für diesen Auftrag nicht zusätzlich ausgeführt.

App-Commit `e252a00` ist nach GitHub/main hochgeladen. Die Live-Seite zeigt v0.36.0 und die neue Testführung. Ein vorhandener v0.35.1-Lauf wird korrekt als älterer Stand gekennzeichnet; „Neuen Gerätetest beginnen“ ist geöffnet. Kein neuer physischer Lauf gestartet und keine bisherigen Testdaten zurückgesetzt. [Live-Nachweis](../replica/clone-screens/live-device-guide-v0.36.0.jpg).


## Direkte Testansicht v0.37.0

Die erneute Rückmeldung „zu überladen“ und „hin und her klicken“ ist mit einer gemeinsamen Ansicht umgesetzt: kurze Stichpunkte, echte Satzfelder, „Passt · Weiter“. Nur der benötigte Satz ist sichtbar; die Sollwerte bleiben im festen Kopf. Es gibt keinen Anleitungsdialog während der Eingabe. Geräteauswahl, Berichte und Sonderaktionen liegen im Testmenü. Die Bibliothek zeigt die aktuelle Aufgabe ebenfalls kurz an.

Prüfstand: 14 gezielte Gerätetest-Fälle plus Versionsprüfung bestanden. REG-31 mobile-chromium prüft ohne Dialogwechsel Werteingabe, Zeit/Stoppuhr, Inline-Aufgabe nach Offline-Neustart, erhaltene Testwerte, echte Speichertrennung, Berichte und Backup. Mobile Ansichten bei 320 × 568 und 390 × 700 px sowie Desktopbreite dokumentiert. Eine auf 360 px reduzierte Höhe prüft sichtbaren Werthinweis und unverdecktes Feld; echte iPhone-Tastatur/OS-Abnahme bleibt offen. Keine vollständige Suite oder Browsermatrix. Build mit 14 öffentlichen Dateien erfolgreich. App-Commit `20f3c9b` nach GitHub/main hochgeladen; Live-Seite v0.37.0 und direkte Testansicht bestätigt. Der vorhandene alte Lauf bleibt erhalten; kein neuer Testlauf und kein physischer Erfolg angelegt. [Live-Nachweis](../replica/clone-screens/live-device-inline-v0.37.0.jpg).
