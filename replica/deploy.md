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
