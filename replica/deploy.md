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

Die früher verwendeten KI-Provider-Schlüssel werden nicht mehr vom Code verwendet. Ihre Entfernung aus der Netlify-Verwaltung ist ohne angemeldeten Hosting-Zugriff noch nicht bestätigt. Es werden keine neuen Schlüssel, Konten, Zahlungsdienste, OAuth-Anbieter, Maildienste oder Datenbanken eingerichtet.

## Bereitstellung

- Ziel: bestehendes Repository `https://github.com/Muleitai-coder/Satzkraft`, Branch `main`.
- GitHub-Upload: ausstehend; wird nach dem tatsächlichen Ergebnis ergänzt.
- Hosting: bestehendes Netlify, Build `npm run build`, Publish-Verzeichnis ausschließlich `dist/`.
- Netlify-Tab: Login erforderlich. Die bisherige App-Webadresse ist im zugänglichen Projektstand nicht vorhanden und wurde beim Nutzer angefragt.
- Live-Version und HTTPS: noch nicht bestätigt. GitHub-Upload ist kein Nachweis eines abgeschlossenen Netlify-Deployments.
- DNS: unverändert; keine neue Domain erforderlich.

Nach dem Update auf dem Hauptgerät: Versionsstand, erster Trainingseintrag, Hintergrundwechsel, Offline-Neustart und Backup-Wiederherstellung anhand der Checkliste bestätigen. Es wurde kein automatischer Monitor eingerichtet.
