# Korrekte Auswertung von Zeitübungen mit Gewicht

Stand: 11.10.2026 · Arbeitsstand v0.33.4 + Unreleased · Paket B aus `replica/architecture.md`.

60 Sekunden bei 20 kg wurden zuvor als 60 Wiederholungen behandelt: 40 kg geschätztes 1RM im Bericht und 1.200 kg Wiederholungsvolumen. Bericht, Übungsverlauf und Protokoll zeigen jetzt tatsächliche Zeit und Last, beispielsweise **1:00 min · 20 kg · je Seite**. Zeitübungen gehen nicht mehr in 1RM oder Wiederholungsvolumen ein.

## Verhalten und Umfang

- Eigener zur Laufzeit berechneter Berichtstyp `weighted_seconds`. Klassische Gewicht/Wiederholungs-, reine Wiederholungs- und reine Zeitübungen behalten ihre Kennzahlen.
- Die Karte für Zeit plus Gewicht zeigt die Satzwerte der zuletzt erfassten Ausführung. Kein erfundener eindimensionaler Bestwert, Prozenttrend, Balkentrend oder Abschluss-Highlight. Der vollständige Verlauf steht weiter im Trainingsprotokoll und Übungsverlauf.
- 0 kg wird ausdrücklich gezeigt; eine fehlende oder ungültige Last erscheint als „Gewicht fehlt“. „Je Seite“ bleibt erhalten. Zeit wird im bestehenden Minutenformat dargestellt.
- Gleiche kanonische Namen werden nur innerhalb desselben Typs zusammengeführt. Vorblockwerte verwenden ebenfalls Namen und Typ. Dadurch bleiben gleichnamige klassische Gewichts-, reine Zeit- und gewichtete Zeitübungen getrennt.
- Getauschte Übungen erscheinen mit Original und Ersatz im Protokoll, verfälschen aber nicht die erfasste Leistung des Originals. Tatsächliche Deload-Sätze bleiben sichtbar; für Zeit plus Gewicht wird daraus kein Trend errechnet.
- Bestehende Karten und Design-Tokens bleiben erhalten. Neue Satzwerte erhalten im Druckmodus die vorhandene dunkle Druckfarbe auf Weiß.
- `js/progression.js`, Schema 4, `cali-plan-v3`, Austauschformat Version 2 sowie bestehende Backup- und Speicherschutzregeln bleiben unverändert. Das neue Berichtsmodell wird nicht als neues Datenformat gespeichert.

## Tatsächliche Prüfungen

### Gezielte Berechnungs- und Archivtests

```bash
node --test --test-reporter=spec tests/report.test.cjs tests/archive-report.test.cjs
```

Dieser Lauf bestand mit 18 Tests. Anschließend wurde der gezielte Archivfall um gleichnamige Übungen verschiedener Typen erweitert; nur die geänderte Datei wurde erneut geprüft:

```bash
node --test --test-reporter=spec tests/archive-report.test.cjs
```

Sieben Archivtests bestanden. Zusammen sind **19 unterschiedliche Tests erfolgreich**: zwölf Berichtstests und sieben Archivtests. Unveränderte erfolgreiche Berichtstests wurden nicht erneut ausgeführt.

Die Prüfungen erfassen unter anderem:

- 60 s bei 20 kg: kein 1RM, kein Wiederholungsvolumen, beide Originalwerte erhalten.
- Normale Gewichts-, Wiederholungs- und Zeitkennzahlen, Abschlusszählung und Trainingszeit bleiben korrekt; Eingaben werden nicht verändert.
- Gemischte gleichnamige Typen, aktive und archivierte Programme sowie typgebundener Vorblockvergleich.
- Deload-Werte, Übungsnachfolger mit Gültigkeitswochen und Ersatzübungen.
- Fehlende Last und ausdrücklich eingetragene 0 kg.
- Bericht, Verlaufsdialog und vollständiges Protokoll einschließlich HTML-Escaping des Ersatznamens.

### Gezielter mobiler Browserfall

```bash
./node_modules/.bin/playwright test --config qa/playwright/playwright.config.cjs --project mobile-webkit --grep 'REG-28' --update-snapshots=none
```

**Ein Fall erfolgreich.** Der Test öffnet eine gewichtete Zeitübung über die bestehende Vorschau und anschließend den Verlaufsdialog, die Auswertung und das Trainingsprotokoll. Er prüft Minuten/Last/Seitenangabe und 0 kg, fehlende 1RM-/Bestwertdarstellung, nicht berechnetes Zeit-Volumen sowie beide Farbschemata bei 320 px ohne horizontalen Seitenüberlauf.

Der Browser prüft außerdem die Sichtbarkeit und Textfarbe der neuen Berichtswerte mit emuliertem Druckmedium. Die beiden vorhandenen Druckschaltflächen werden mit einer beobachteten `window.print`-Funktion geprüft; dabei enthält der übergebene Seiteninhalt die richtigen Werte. Ein tatsächlicher Betriebssystem-Druckdialog beziehungsweise eine exportierte PDF-Datei ist nicht Teil dieser Prüfung.

Programme und Trainingsspeicher sind nach Navigation und Druckaktionen unverändert; keine Seitenfehler. Ein früher Zwischenlauf suchte den Verlauf vor dem Öffnen der Vorschau. Nach Korrektur des Testwegs und des Auswertungsselektors lief der Fall erfolgreich. Die abschließende Wiederholung erfolgte wegen der zusätzlich abgesicherten Druckfarbe und der erweiterten Druckprüfung.

Zusätzlich: Syntaxprüfung der Browser-Testdatei und aller Inline-Scripts, `git diff --check`, Kontrolle der Dokumentverweise. Keine vollständige Node-Suite, Browsermatrix oder visuellen Snapshot-Updates.

## Offene Entscheidungen und Veröffentlichung

Die passende gemeinsame Trendkennzahl für Zeit und Last bleibt im Übungsdatenbankkonzept offen. Diese Korrektur führt weder eine neue Progressionsregel noch eine neue Bewertung ein. Eine praktische Abnahme auf einem physischen Smartphone und ein echter PDF-Export sind weiterhin offen.

Die Änderungen bleiben lokal und unveröffentlicht. Kein Commit, Push oder Deployment; Version und Service-Worker-Cache bleiben v0.33.4. Der spätere Release muss alle vorherigen lokalen Änderungen einschließlich API-Entfernung und Fensterschutz berücksichtigen.
