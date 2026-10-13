# Satzkraft – zentrale Projektübersicht

Stand: 13.10.2026. Die zentrale Koordination liegt im Chat „Projektstatus zusammenfassen“. Dieser Stand ist eine Aufgabenübersicht; verbindliche Produktregeln stehen im [Briefing](../BRIEFING-CODEX.md).

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

## Updateergebnis

v0.34.0 ist auf GitHub/main hochgeladen. Version, Offline-Cache, Pakete und Versionshistorie sind synchron; fünf gezielte Versions-/Cacheprüfungen und der Build bestehen. Ein ZIP mit genau den 13 öffentlichen Dateien liegt neben dem Repository bereit. Die Netlify-Veröffentlichung ist bestätigt: https://satzkraft.netlify.app/ zeigt v0.34.0. Übungssuche, Detailansicht und Versionshistorie wurden auf der Live-Seite geprüft; Netlify meldet null aktive Functions. Die unbenutzte Netlify-Variable `ANTHROPIC_API_KEY` wurde nach Bestätigung gelöscht; die leere Variablenliste und die weiterhin erreichbare App v0.34.0 sind geprüft. [Bereitstellungsbericht](../replica/deploy.md).
