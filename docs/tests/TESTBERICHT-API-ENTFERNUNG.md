# Gezielte Prüfung der API Coach Entfernung

Stand: 11.10.2026 · Arbeitsstand: v0.33.4 + Unreleased.

Der integrierte API-Coach ist aus Oberfläche, App-Logik und Netlify-Konfiguration entfernt. Die Serverfunktion wurde gelöscht. Externe KI-Programme bleiben über lokal erzeugten Text und den geprüften JSON-Import möglich.

## Ergebnisse

| Prüfung | Ergebnis |
| --- | --- |
| Acht direkt betroffene Node-Testdateien | 57 unterschiedliche Tests bestanden; zwei veraltete Coach-UI-Erwartungen angepasst und die beiden betroffenen Dateien erneut erfolgreich geprüft |
| Playwright RED-06, Mobile WebKit | Ein Fall bestanden; drei Erstellen-Kacheln, Navigation, Bereinigung alter Antworten, keine Seitenfehler und keine KI-API-Anfrage im geprüften Ablauf |
| Veröffentlichungsprüfung | Build enthält weiterhin ausschließlich 13 freigegebene statische Dateien; keine Coach-Funktion oder Functions-Konfiguration |
| Syntax und Diff | Inline-JavaScript syntaktisch gültig; `git diff --check` bestanden |
| Planungsdokumente | Lokale Links und CSV-Struktur geprüft; API-Entfernung eingetragen |

Die Node-Prüfung umfasst `coach-preferences`, `coach`, `local-data-privacy`, `program-editor`, `program-lock`, `package-i`, `publish` und `backup`. Die Tests des nicht mehr vorhandenen API-Endpunkts und Frage-Wizards wurden ausdrücklich durch Prüfungen der Entfernung und Altbestandskompatibilität ersetzt. Bestehende Datenschutz-, Backup-, Editor- und Trainingssperrprüfungen bleiben erhalten.

Der erste Browserstart war durch den gesperrten lokalen Port in der Sandbox verhindert. Der eng begrenzte erneute Lauf mit freigegebenem lokalem Testserver war erfolgreich.

## Noch nicht Teil dieser Prüfung

Keine vollständige Node-Suite, Browsermatrix oder reale Smartphone-Abnahme. Screenshot-Baselines wurden gemäß Teststrategie nicht aktualisiert; das Programme-Motiv enthält im bisherigen Referenzstand noch die vierte Coach-Kachel und muss bei der nächsten ausdrücklich beauftragten visuellen Aktualisierung neu abgenommen werden.

Die Änderung ist lokal umgesetzt und noch nicht veröffentlicht. Die bisherige Produktionsbereitstellung und dort konfigurierte Anbieter-Schlüssel wurden nicht verändert. Beim nächsten beauftragten Release müssen App-Version und Service-Worker-Cache synchron erhöht, die statische App veröffentlicht und der ungenutzte API-Schlüssel in der Hosting-Verwaltung entfernt werden.
