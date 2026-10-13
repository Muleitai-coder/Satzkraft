# Kompatibilitätsnachweis für die Übungsdatenbank

Stand: 12.10.2026. Isolierte Prüfung des bestehenden Codes aus `index.html` mit synthetischen Daten. Kein Browserzugriff, keine Migration und keine Änderung der App.

| Fall | Tatsächlich beobachtet | Konsequenz |
| --- | --- | --- |
| V2 mit optionaler Übungs-ID und tracking | angenommen: true; ID erhalten: false; tracking erhalten: false | Älterer Import/Export verliert neue Metadaten; Alt-Rundweg als unbestätigten Altbestand behandeln. |
| Unterstützung in v2 plus requiredCapabilities | angenommen: true; Fähigkeitsmarker wirksam: false | Unbekannte Zusatzfelder schützen nicht vor gewöhnlicher gewichteter Erfassung. |
| Probe mit version:3 | abgelehnt | Eine Versionsgrenze könnte alte Apps stoppen; Einführung von v3 ist damit nicht beauftragt oder entschieden. |
| Probe mit anderem format | abgelehnt | Auch eine Formatgrenze stoppt den bisherigen Import; kein neues Produktformat eingeführt. |
| Gewichtete Zeit in v2 | unit:seconds; weighted:true; perSide:true | Die heutige Darstellung bleibt korrekt transportierbar. |
| Schema-4-Backup mit zusätzlichem Katalog und widersprüchlicher historischer Erfassung | Validierungsfehler: keiner | Bisherige Backupprüfung validiert diese neuen Felder nicht. |
| Erneute Sicherung eines solchen Schema-4-Stands | Katalog erhalten: false; verschachtelte Zusatzdaten erhalten: true | Identitäts-/Snapshotfelder müssen künftig in allen Sicherungs- und Lebenszykluspfaden ausdrücklich geprüft werden. Ein Zusatzkatalog wäre heute nicht verlustfrei. |
| Probe mit schemaVersion:5 | abgelehnt | Vor persönlicher Bibliothek und neuer Erfassungssemantik Schemaentscheidung begründen; Schema 4 bleibt jetzt bestehen. |

Originale synthetische Eingaben unverändert: Programm true, Backup true. Vorhandene Satzwerte wurden beim erneuten Backup unverändert übernommen.

Dies ist ein Nachweis des gegenwärtigen Vertrags, keine vollständige App-Abnahme. Eine spätere Änderung des Import-/Backupcodes erfordert eine neue Bewertung dieser Kompatibilitätsfälle. Die Prüfung wurde ohne Aufruf von `js/progression.js` ausgeführt.

Erneut ausgeben: `node docs/prototyp/uebungsdatenbank/compatibility-probe.cjs`. Die Ausgabe erfolgt auf stdout; keine Datei wird automatisch geschrieben.
