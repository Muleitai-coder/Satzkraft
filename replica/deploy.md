# Satzkraft – Update auf v0.34.0

Datum: 13.10.2026. Freigabe: „einmal komplett updaten“ als Antwort auf die konkrete Frage zum Upload nach `Muleitai-coder/Satzkraft`, Branch `main`. Dieses eigene bestehende Produkt wird am bisherigen privaten App-Einsatz aktualisiert; keine Store-Veröffentlichung, neue Domain oder neue Dienste.

## Prüfung vor dem Update

| Prüfung | Ergebnis |
| --- | --- |
| App-Version / Offline-Cache / Pakete / Historie | v0.34.0 synchron; `tests/version.test.cjs` bestanden |
| Service Worker | Vier gezielte Fälle bestanden: Cachewechsel, Revalidierung, Positivliste und App-Navigation |
| Neue Produktfunktionen | Vorherige Abnahme: 71 unterschiedliche gezielte Node-Fälle und REG-30 mobile-webkit erfolgreich; [Ergebnisbericht](../docs/tests/TESTBERICHT-PERSOENLICHE-UEBUNGEN.md) |
| Vollständige Tests / Browsermatrix | Nicht neu ausgeführt; der Updateauftrag ist nach `AGENTS.md` kein konkreter Auftrag für diese großen Läufe |
| Funktionsmatrix | 22 von 22 Pflichtfunktionen umgesetzt; 98,2/100 im vorhandenen gewichteten Funktionsbestand. Kein Ersatz für reale Geräteabnahme. |
| Eigene Marke / Assets | Eigenes bestehendes Satzkraft-Produkt; Name, Icons und lokale Schriften bleiben bestehen; kein fremdes Zielprodukt oder Store-Listing |
| Build | Erfolgreich; ausschließlich 13 freigegebene statische Dateien in `dist/` |
| Lokale alte Functions-Artefakte | Generierte Coach-ZIP, Functions-Manifest und veraltete generierte Netlify-Konfiguration entfernt; aktuelle Quellkonfiguration enthält keine Functions |
| Zugangsdaten / private Trainingsdaten | Vor dem Commit nur Auftragsdateien prüfen; keine `.env`, privaten Backups oder Zugangsdaten veröffentlichen |
| Physisches Smartphone / Offline-Neustart / OS-Beendigung | Weiterhin offen; [Checkliste](../docs/tests/SMARTPHONE-ABNAHME.md) vorbereitet |

## Daten und Rollout

Vollständige Backups verwenden Schema 5 und enthalten persönliche Übungen sowie historische Erfassung. Schema-4-Backups bleiben importierbar, Programme bleiben v2. Vor der Aktualisierung ein vollständiges Backup herunterladen und alte Satzkraft-Fenster schließen. Nach dem Update den neuen Stand im Versionsdialog kontrollieren; neue Schema-5-Backups benötigen die aktualisierte App.

Die früher verwendeten KI-Provider-Schlüssel werden nicht mehr vom Code verwendet. Die Hosting-Variable `ANTHROPIC_API_KEY` wurde am 13.10.2026 nach der ausdrücklichen Antwort „ja bitte“ im Netlify-Löschdialog endgültig aus allen Deploy-Kontexten entfernt. Der Schlüsselwert wurde nicht aufgedeckt oder kopiert. Netlify zeigt „No environment variables set for this project“. Die App wurde danach neu geladen und zeigt weiterhin v0.34.0. Es werden keine neuen Schlüssel, Konten, Zahlungsdienste, OAuth-Anbieter, Maildienste oder Datenbanken eingerichtet.

## Bereitstellung

- Ziel: bestehendes Repository `https://github.com/Muleitai-coder/Satzkraft`, Branch `main`.
- GitHub-Upload: erfolgreich. App-Commit `61034513d58d17105cca2638d9eb80733c3ffe7e` auf `main`, einschließlich der vorherigen Commits `3a631a0` und `31397ba`. Lokaler Branch und `origin/main` sind synchron.
- Hosting: bestehendes Netlify, Build `npm run build`, Publish-Verzeichnis ausschließlich `dist/`.
- Netlify-Zugriff: Nutzer hat den angemeldeten Projektzugang bereitgestellt. Bestehendes Projekt `satzkraft` mit GitHub-Verknüpfung zu `Muleitai-coder/Satzkraft`.
- Live-Version und HTTPS: bestätigt am 13.10.2026. https://satzkraft.netlify.app/ zeigt im Seitentitel und Versionsdialog v0.34.0.
- Netlify bestätigt den veröffentlichten Produktionsdeploy von `main` mit Commit `9d3ac99514ddfe75735c4083597f0d91a81c79c0`, veröffentlicht am 13.10.2026 um 22:07 Uhr (Europe/Berlin). [Deploynachweis](https://app.netlify.com/projects/satzkraft/deploys/6ace8f8b1e611a8e9f6b99e9).
- Functions: Netlify zeigt „0 functions actively running in production“. Der frühere Coach ist nicht mehr bereitgestellt.
- Live-Prüfung: Programme → persönliche Übungsbibliothek → Suche nach Kurzhantel-Bankdrücken → Detail mit Technik-/Verlaufsansicht → Versionsdialog. Ohne Eintragen persönlicher Testtrainingsdaten. [Screenshot des Live-Versionsdialogs](clone-screens/live-v0.34.0.jpg).
- Ein manueller Upload oder erneuter Deploy war nicht nötig: Der vorhandene GitHub-Workflow hatte das Update bereits automatisch veröffentlicht. Keine Hosting-Verbindung, Sichtbarkeit oder Berechtigung geändert.
- DNS: unverändert; keine neue Domain erforderlich.

Nach dem Update auf dem Hauptgerät: Versionsstand, erster Trainingseintrag, Hintergrundwechsel, Offline-Neustart und Backup-Wiederherstellung anhand der Checkliste bestätigen. Es wurde kein automatischer Monitor eingerichtet.

Für einen manuellen Upload ist außerdem `../satzkraft-v0.34.0.zip` neben dem Repository vorbereitet. Das ZIP enthält nur die 13 öffentlichen Build-Dateien, keine Tests, Dokumente, Functions, Zugangsdaten oder Trainingsbackups. Es wurde nicht ohne Hosting-Zugriff an einen anderen Dienst hochgeladen.


## 21.10.2026 – v0.35.0 Geräteassistent

Gezielte Vorbereitung bestanden: 34 unterschiedliche Node-Fälle und ein REG-31-Browserlauf in mobile-chromium. Tatsächlicher Offline-Reload über Service Worker, getrennter Testzustand, pausiertes Training, Testbackup-Restore, zweites Testfenster, Berichtimport/-export, Speicherfehler-Rücknahme und Rückkehr zu unveränderten echten Test-Fixturedaten geprüft. Screenshots bei 320/440/1440 px in hell/dunkel gesichtet. Kein physisches iPhone als getestet markiert; keine große Suite/Browsermatrix. App/Cache/Pakete v0.35.0; Build genau 14 öffentliche Dateien. Der neue Geräteassistent wird ebenfalls offline vorgehalten.

App-Commit `51021e8c5e49e7054d2779d73f11a1752666957a` wurde erfolgreich nach GitHub/main hochgeladen. Die automatische Veröffentlichung ist am 21.10.2026 auf https://satzkraft.netlify.app/ bestätigt: Seitentitel v0.35.0; neuer Einstieg unter Admin & Tests; Testassistent mit vorausgewähltem iPhone 17 Pro. Kein physischer Lauf angelegt, keine echten Trainingswerte verändert. [Live-Screenshot](clone-screens/live-device-test-v0.35.0.jpg). [Bedienungsanleitung](../docs/tests/IPHONE-OFFLINE-TESTSYSTEM.md).

## 21.10.2026 – v0.35.1 iOS-Auswahl

Direkte Versionsauswahl, freie Beta-/Sonderversionen und Vorbelegung gezielt geprüft: 16 unterschiedliche Node-Fälle und REG-32 mobile-webkit bestanden; keine vollständige Suite. Nach der Live-Prüfung wurde der Geräteassistent versionsgebunden geladen, damit kein altes Formular aus dem Cache erscheint. `60181bd` und `e2659d5` erfolgreich nach main hochgeladen. Live-Seitentitel v0.35.1 und native Versionsauswahl bestätigt. Kein realer Gerätetest angelegt. [Live-Nachweis](clone-screens/live-ios-auswahl-v0.35.1.jpg).


## 22.10.2026 – v0.36.0 verständliche Gerätebegleitung

App/Cache/versionierte Geräteassistent-URL/Pakete/Historie auf v0.36.0 synchron. Gezielte Prüfung: 14 Node-Fälle und REG-31 mobile-chromium erfolgreich, einschließlich tatsächlichem Offline-Reload, Teilaufgaben-Fortsetzung und Backup-Wiederherstellung. Hauptaktion bei 320 × 568 px sichtbar. Build: ausschließlich 14 freigegebene Dateien. Keine vollständige Suite/Browsermatrix und kein physisches iPhone als getestet markiert. App-Commit `e252a00` erfolgreich nach GitHub/main hochgeladen. Automatische Netlify-Veröffentlichung am 22.10.2026 bestätigt: Seitentitel v0.36.0 und neue Testführung. Der vorhandene ältere Testlauf bleibt erhalten; nur der Einstieg für einen neuen geführten Test wurde aufgeklappt. Kein physisches Testergebnis erzeugt und kein Teststand ersetzt. [Live-Nachweis](clone-screens/live-device-guide-v0.36.0.jpg).


## 22.10.2026 – v0.37.0 direkte Testansicht

App/Cache/versionierte Modul-URL/Pakete/Historie synchron. 14 gezielte Gerätetestfälle, eine Versionsprüfung und REG-31 mobile-chromium erfolgreich. Aufgabe, Feld und Weiter-Aktion bei 320 × 568 px gemeinsam sichtbar; auf 390 × 360 px bleibt das Eingabefeld unverdeckt und die Sollwertzeile sichtbar. Der Browserlauf prüft Offline-Neustart, Wiederaufnahme, Bibliothek, Backup, Berichte, Fensterschutz und Datentrennung. Build: 14 öffentliche Dateien. Keine vollständige Suite/Browsermatrix; echte iPhone-Tastatur und OS-Abnahme offen. App-Commit `20f3c9b` nach GitHub/main hochgeladen. Netlify-Veröffentlichung am 22.10.2026 bestätigt: Seitentitel v0.37.0, direkte Testansicht und klarer Einstieg für einen neuen Lauf. Der bereits vorhandene ältere Bericht bleibt erhalten; kein Lauf zurückgesetzt oder automatisch als bestanden markiert. [Live-Nachweis](clone-screens/live-device-inline-v0.37.0.jpg).


## 22.10.2026 – v0.38.0 Testbereich entfernt

Skript, Styles, Einstiege und Testmodus aus der App, dem Offline-Cache und der Build-Positivliste entfernt. Echte Daten werden auch nach einem alten aktiven Testmodus wieder normal geladen; alte markierte Testbackups bleiben gesperrt. Externe kurze Checkliste und isolierter iPhone-17-Pro-WebKit-Test eingerichtet. Zehn gezielte Node-Fälle und der neue REG-31-Lauf bestanden; Eingaben offline, Cache-Neustart bei Serverausfall, Touch/Ränder/kurzer Bildschirm/Querformat und Backup geprüft. Reale iOS-Abnahme offen; keine vollständige App-Suite. [Detaillierter Prüfbericht einschließlich Grenzen und Fehlläufen](../docs/tests/IPHONE-OFFLINE-TESTSYSTEM.md). Build: ausschließlich 13 öffentliche Dateien. Upload und Live-Nachweis folgen.
