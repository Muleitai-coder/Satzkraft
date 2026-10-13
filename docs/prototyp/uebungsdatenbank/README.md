# Übungsdatenbank – isolierter Datenprototyp

Stand: 11.10.2026. D1–D8 der [Entscheidungsvorlage](../../planung/UEBUNGSDATENBANK-ENTSCHEIDUNGSVORLAGE.md) wurden mit „ja bitte“ bestätigt. Dieser Prototyp erfüllt das beauftragte Paket B der Konzeptphasen, nicht das zuvor abgeschlossene Fehlerpaket B zur Auswertung.

Die App lädt keine dieser Dateien. Der Service Worker und die Veröffentlichungs-Positivliste bleiben unverändert. Kein Browser-Speicher, keine privaten Backups, kein Netzwerk und keine neue Abhängigkeit werden verwendet. Das Prototypformat ist kein `trainings-block`-Export und kein Schema-4-Backup.

## Dateien und Verwendung

| Datei | Aufgabe |
| --- | --- |
| [referenzuebungen.json](referenzuebungen.json) | Zwölf Übungsdefinitionen mit stabilen IDs; eigene Namen, Aliasse und Techniktexte aus der bestehenden Bibliothek |
| [referenzfaelle.json](referenzfaelle.json) | Zwölf synthetische Fälle; Programmvorgabe und tatsächliche Leistung getrennt von den Stammdaten |
| [contract.cjs](contract.cjs) | Abhängigkeitenfreie Validierung, Darstellung tatsächlicher Satzwerte und Prüfung des Vergleichskontexts |
| [legacy-mapping.cjs](legacy-mapping.cjs) | Reine Zuordnungsanalyse für Bibliothek, externe Programmübungen und interne Programmpositionen |
| [analyse.cjs](analyse.cjs) | Liest die ausgelieferten 200 Übungen und vier Vorlagen; gibt den Bericht auf stdout aus |
| [ZUORDNUNGSBERICHT.md](ZUORDNUNGSBERICHT.md) | Gespeichertes Ergebnis der Zuordnungsanalyse |
| [Gezielte Tests](../../../tests/exercise-prototype.test.cjs) | Positive und negative Vertragsfälle einschließlich Schutz des bisherigen Datenbestands |
| [compatibility-probe.cjs](compatibility-probe.cjs) | Ergänzung vom 12.10.: isolierter Nachweis des bestehenden Import-/Export-/Backupvertrags mit synthetischen Daten |
| [KOMPATIBILITAETSBERICHT.md](KOMPATIBILITAETSBERICHT.md) | Beobachteter Referenzverlust, ignorierte Fähigkeitsmarker und unvollständige Sicherung eines Zusatzkatalogs |
| [Kompatibilitätstests](../../../tests/exercise-exchange-contract.test.cjs) | Sieben neue gezielte Prüfungen für diese Grenzen |

```bash
node docs/prototyp/uebungsdatenbank/analyse.cjs
node --test tests/exercise-prototype.test.cjs
```

Die Analyse verändert keine Datei. Ihr Ergebnis lässt sich bewusst als Zuordnungsbericht speichern. Es werden ausschließlich die öffentlichen Quelldateien des eigenen Produkts gelesen.

## 1. Festgelegter Prototypvertrag

Die erlaubten Werte stehen zentral in `VALUES` und `TRACKING_KEYS` in `contract.cjs`. Unbekannte Felder der Definition und Leistung werden zurückgewiesen, statt als bereits unterstützte Erweiterung zu erscheinen. Feldnamen und Werte sind für diesen isolierten Prototyp festgelegt; ihre Übernahme in die App benötigt einen eigenen Vertrag.

| Ebene | Felder | Bedeutung |
| --- | --- | --- |
| Katalog | `format`, `version`, `exercises` | `satzkraft-exercise-prototype`, Version 1; keine Änderung der App-Schemaversion |
| Identität | `id`, `origin`, `name`, `aliases` | Stabile ID; `built_in` oder `custom`; deutsche/englische Namen und Suchnamen |
| Fachliche Einordnung | `domain`, `role`, `movement`, `targets`, `equipment` | Kleine kontrollierte Listen für die zwölf Fälle; keine vollständige Taxonomie für alle 200 Übungen |
| Erfassung | `tracking` | Messwert, Lastbedeutung, Eingabekonvention, Ausführung und Zählweise |
| Vorgeschlagene Standardprogression | `progression.primary`, optional `secondary` | Deklarative Metadaten; keine Berechnung oder Anwendung einer Empfehlung |
| Technik | `technique.cue` | Für integrierte Übungen Pflicht, bei persönlichen Übungen optional |
| Ersatzbeziehungen | `substitutes.status`, `relations` | Gepflegte gerichtete Beziehungen oder ausdrücklich `no_default_substitute` |
| Programmvorgabe im Beispiel | `programPosition.id`, `prescription` | Eigene Programmposition, Satzanzahl/Zielbereich und optional Timermodus |
| Tatsächliche Leistung | `exerciseId`, `positionId`, `trackingSnapshot`, `context`, `sets` | Eigene Identität, damals verwendete Erfassung, bestätigter/unbestätigter Kontext und unveränderte Satzwerte |

`equipment.required` benennt eine Ausstattung; jede Liste in `alternatives` ist eine vollständige alternative Ausstattung. Die Alternativen übernehmen keine Gewichtswerte oder Leistungsrekorde. Die zwölf Definitionen pflegen zunächst keine Ersatzübungen. `no_default_substitute` bedeutet „keine Standardalternative in diesem Datensatz gepflegt“, nicht „keine Alternative möglich“. Ein gerichteter Ersatz mit anderem Messwert wird durch einen gesonderten Test abgedeckt, ohne ihn ungeprüft auszuliefern.

### Erfassung

| Feld | Erlaubte Werte im ersten Prototyp |
| --- | --- |
| `metric` | `reps`, `seconds` |
| `loadMode` | `none`, `external`, `added`, `assistance` |
| `loadEntry` | `not_applicable`, `total`, `per_implement`, `machine_display` |
| `laterality` | `bilateral`, `unilateral_each_side` |
| `counting` | `total`, `per_side` |

`counting` ersetzt im Prototyp den Vorschlagsnamen `repCounting`, weil dieselbe Regel auch bei Sekunden gilt. `per_side` bedeutet einen eingetragenen Wert je Seite; es erfindet keine getrennten linken und rechten Sätze. `single_side`, abwechselnde Einzelzählung, Scheibengewicht je Geräteseite und Distanz benötigen spätere Referenzfälle und bleiben hier ausgeschlossen.

Ohne Last gilt `not_applicable`. Zusatzgewicht wird gesamt erfasst. Unterstützung ist im ersten Prototyp Wiederholungen mit Maschinenanzeige und `reduce_assistance`; gewöhnliche Laststeigerung wird dafür abgelehnt. Eine Zeitprogression benötigt Sekunden, Wiederholungsprogression benötigt Wiederholungen. Mobilität besitzt keine automatische Leistungsprogression.

### Tatsächliche Leistung und Vergleich

- Satzwerte sind `value` und `load`. Bei Zeit bleibt `value` in Sekunden. Wiederholungen liegen zwischen 1 und 9999, Zeit zwischen 1 und 5999 Sekunden, Last zwischen 0 und 2000 kg mit höchstens einer Dezimalstelle. Das ist ein Vertrag für erfasste Leistungen, nicht für leere UI-Satzzeilen.
- `load:null` stellt bei einer Lastübung ein fehlendes Gewicht dar. `load:0` ist eine gültige Last; keine Konvertierung durch `Number(null)` oder leere Zeichenketten. Ohne Last muss `load:null` sein.
- `trackingSnapshot` und aktuelle Übungsdefinition müssen für eine gemeinsame Auswertung kompatibel sein. Bei Abweichung bleibt die alte Leistung gesondert erhalten; ihre damalige Definition kann sie weiter darstellen. Die Validierung migriert nichts.
- `context.loadEntryConfirmation` und `countingConfirmation` halten unbestätigte Altinformationen sichtbar. Ein unbestätigter Wert erhält weder einen erfundenen Gerätebezug noch den Hinweis „pro Hantel“ oder „je Seite“ als historische Tatsache.
- `deviceVariant` ist im Beispiel eine rein synthetische Gerätekennung. Ohne bekannte identische Gerätevariante ist bei Maschinen kein direkter Vergleich zulässig.
- `comparisonEligibility()` erlaubt allenfalls den Vergleich im selben Kontext. Es entscheidet nicht, welche Leistung besser ist, und erzeugt keine Progression. Zeit + Gewicht, Mobilität und Cardio erhalten keinen eindimensionalen Vergleich.
- `describePerformance()` stellt ausschließlich tatsächliche Sätze dar. `e1RM`, `strengthVolume` und `trendScore` bleiben `null`, auch bei gewöhnlichen Lastübungen. Die bestehenden Reportformeln werden nicht ersetzt. Das Modul gibt Text aus; eine spätere HTML-Einbindung muss weiterhin `esc()`/`attr()` verwenden.

## 2. Zuordnung der heutigen Felder

Die Analyse liefert `eindeutig`, `bestaetigung_noetig` oder `nicht_darstellbar`. Sie gibt Quellobjekte als separate Kopie zurück und schreibt keine Zielprogramme. `eindeutig` ist eine Zuordnung von Identität und darstellbarer Erfassung, keine Bestätigung aller historischen Eingabekonventionen.

| Heutiges Feld | Im Prototyp zuzuordnen | Grenze / erhaltene Information |
| --- | --- | --- |
| Bibliothek `de`, `en`, `alias` | `name`, `aliases`; geprüfter ID-Kandidat | Mehrere Treffer bleiben ein Reparaturfall; keine automatische ID-Erzeugung aus Namen |
| Bibliothek `typ:"gewicht"` | `reps + external` als Altbedeutung | Eine bekannte Unterstützungsdefinition braucht Bestätigung; keine Umdeutung alter Lasten |
| `typ:"kgz"` | `reps + added` | Zusatzgewicht bleibt von unbekanntem Körpergewicht getrennt |
| `typ:"koerpergewicht"` | `reps + none` | Keine Addition eines Körpergewichts |
| `typ:"zeit"` | `seconds + none` | Kein Distanz-/Tempowert ergänzen |
| `weightedTime:true` | `seconds + external` | Muss zu `typ:"zeit"` passen; Last und Zeit bleiben getrennt |
| `einseitig:true` / `perSide:true` | `unilateral_each_side + per_side` als vorhandene Regel | Fehlendes Kennzeichen beweist keine historische bilaterale Ausführung; neue Seitigkeit nicht rückwirkend ergänzen |
| Programm `weighted`, `bodyweight`, `unit`, `timerMode` | Darstellbare Erfassung aus expliziten Angaben | `time` wird als Einheit erkannt; Originalwert bleibt erhalten. Fehlende Zeit bei Carry wird zur Prüfung vorgelegt, nicht aus dem Namen erraten |
| Intern `w`, `bw`, `unit`, `tmode`, `perSide` | Gleiche Bedeutung wie externe Angaben | Die heute gültige Struktur bleibt unverändert |
| Programm `id`, `prevId`, `fromWeek`, `untilWeek` | Programmposition und Lebenszyklus | Kein Ersatz durch die Bibliotheks-ID; keine Änderung von Log-Schlüsseln |
| `sets`, `reps`, `startWeight`/`def`, `increment`/`inc`, `category`/`cat` | Weiterhin Programmvorgabe | Nicht in die Übungsstammdaten verschieben; Quellobjekt vollständig erhalten |
| `equipment`, `muster`, `bereich` | Manuell geprüfte Metadaten der zwölf Definitionen | Kein verlässlicher automatischer Parser; keine vollständige 200-Einträge-Umstellung |
| `technik`, `video` | Eigener Techniktext; Videos späterer Detailvertrag | Technik übernommen; keine Fremdmedien geladen und kein neues Videofeld benötigt |
| `ersatz`/`proxy` | Kandidat für später ausdrücklich geprüfte Beziehung | Nicht blind übernehmen und keine Rückbeziehung ergänzen |
| Log `sets[].reps`, `sets[].weight` | Historische Rohwerte | Dieser Prototyp liest keine privaten Logs und migriert keine Werte. Die synthetischen Tests prüfen ihre Erhaltung |

Der Resolver liest ausdrücklich `exerciseId` als mögliche Bibliotheksreferenz. Ein internes `id` ist eine Programmposition. Bei unbekannter `exerciseId` erfolgt kein stiller Namens-Fallback. Widersprüchlicher Messwert oder Lasttyp bleibt gesperrt bis zur fachlichen Reparatur. Ein abweichender Name bei bekannter, kompatibler ID wird nur als Vorschauhinweis dokumentiert; das Original wird nicht überschrieben.

## 3. Tatsächliches Ergebnis und verbleibende Verträge

Die [Analyse](ZUORDNUNGSBERICHT.md) erfasst 200 Bibliothekseinträge und 67 Positionen aus vier ausgelieferten Programmvorlagen:

- Zehn der zwölf Bibliotheksreferenzen sind nach Identität und Alt-Erfassung eindeutig. Klimmzug-Maschine und Couch Stretch benötigen die erwartete fachliche Behandlung.
- 188 Bibliothekseinträge und 56 Vorlagenpositionen sind außerhalb des zwölfteiligen Referenzkatalogs. Das ist die geplante Begrenzung des Prototyps.
- Elf Vorlagenpositionen lassen sich eindeutig zuordnen. Bei den Vorlagen trat unter diesen Referenztreffern kein zusätzlicher Typkonflikt auf.

| Austauschrichtung | Ergebnis der Code-/Vertragsprüfung | Noch zu spezifizieren |
| --- | --- | --- |
| Heutige v2-Datei → spätere App | Identität lässt sich für geprüfte Referenzfälle ergänzen; aktuelle Daten bleiben unangetastet | Reparatur, unbekannte Namen und unbestätigte Alt-Erfassung vollständig regeln |
| Datei mit neuer Identität → heutige App | Zusätzliche Referenz allein ist kein vollständiger Vertrag. Die heutigen Import-/Exportfunktionen bilden Übungen aus expliziten Feldern neu und erhalten keine Bibliotheksreferenz | Verlustfreiheit beziehungsweise verständliche Ablehnung für ältere Apps nachweisen |
| Neue Unterstützung → heutige App | Heutiger Gewichtstyp kann die entgegengesetzte Unterstützungsbedeutung nicht ausführen | Schutz vor falscher Progression; Format-/Fähigkeitsentscheidung vor Veröffentlichung |
| Export durch heutige App → spätere App | Neue Metadaten dürfen nicht als erhalten vorausgesetzt werden | Erneuter Export muss ohne erfundene historische Kontextbestätigung auflösbar sein |
| Backup mit persönlicher Bibliothek | Nicht Bestandteil dieses Prototyps | Definitionen, Referenzen, historische Erfassung, Wiederherstellung und Konflikte gemeinsam absichern |

Ein optionales `exerciseId` erscheint als künftige Referenz möglich, reicht für Unterstützung und historische Vergleichbarkeit aber nicht aus. Deshalb jetzt weder produktive Zusatzfelder einführen noch eine andere Austauschversion beschließen. Der nächste Entwicklungsschritt ist ein konkretes Coding-Briefing für Identität, historische Erfassung, Import/Export und Migration. Erst danach App-Einbindung und persönliche Bibliothek.

### Ergänzung vom 12.10.2026

Das [Coding-Briefing für Import, Export und Migration](../../planung/UEBUNGSDATENBANK-VERTRAEGE.md) ist vorbereitet. Der [Kompatibilitätsbericht](KOMPATIBILITAETSBERICHT.md) belegt die oben genannten Grenzen mit den tatsächlichen gegenwärtigen Funktionen und synthetischen Daten. Sieben neue gezielte Tests bestehen; die ursprünglichen 18 unveränderten Prototyptests wurden nicht erneut ausgeführt.

Die Probe lädt einzelne Funktionen aus `index.html` in ein isoliertes Prüfumfeld. Sie greift nicht auf Browserdaten zu; `syncStore()` bleibt beim Backup-Aufruf neutralisiert. Dieser Nachweis beschreibt den heutigen Reader, nicht sämtliche früheren Releases. Bei späterer Änderung der betroffenen App-Funktionen den Nachweis neu bewerten und die dokumentierten Erwartungen bewusst aktualisieren. Die v3-/Schema-5-Werte im Test sind Gegenproben, keine eingeführten Produktversionen.

### Anschließende C1-Umsetzung

C1 wurde mit „ok weiter machen“ beauftragt und [lokal umgesetzt](../../tests/TESTBERICHT-UEBUNGSREFERENZEN.md). Zehn passende Einträge der bisherigen Bibliothek besitzen jetzt optionale IDs; die zwei fachlich abweichenden Referenzfälle bleiben zurückgestellt. Die Prototypdefinitionen werden weiterhin nicht von der App geladen.

Der Vor-C1-Reader ist jetzt als eigener geprüfter Ausschnitt in [legacy-v2-reader.json](legacy-v2-reader.json) mit Quellhash und Stand gesichert. `compatibility-probe.cjs` nutzt diesen Ausschnitt für den alten Rundweg; `legacyContext(true)` lädt für C1-Prüfungen stattdessen die aktuellen Funktionen. Das erhält den alten Nachweis, ohne die neue App fälschlich weiterhin als verlustbehafteten Reader zu testen. Es ist eigener Code, keine Fremd-App. Sieben Kompatibilitätsfälle und die 18 ursprünglichen Prototypfälle bestehen auch im neuen Arbeitsstand; die ursprünglichen Fälle wurden wegen der veränderten Bibliothek erneut geprüft.

Nächstes beschriebenes Paket: C1 transportiert ausschließlich kompatible optionale Übungsreferenzen. Snapshots, Unterstützung und persönliche Definitionen folgen in C2/C3 auf eigenen vollständigen Verträgen. In diesem Vorbereitungsschritt bleiben App, bestehender Datensatz und Veröffentlichungsdateien unverändert.

## 4. Abnahme

| Kriterium | Nachweis im Prototyp |
| --- | --- |
| P01 | Zwölf Definitionen, zwölf konkrete Satzbeispiele; aktive Taxonomie und zurückgestellte Fälle dokumentiert |
| P02 | Bibliotheks- und Programmpositions-ID getrennt; Test erhält `prevId`, Wochen-Gültigkeit und Log-Schlüssel |
| P03 | Vier Lastbedeutungen; fehlende Last gegenüber 0 kg geprüft |
| P04 | Keine Umrechnung von Hanteln/Gesamtlast; Seitenregel und unbestätigter Kontext geprüft |
| P05 | Keine 1RM-, Volumen- oder Gesamtscoreberechnung; Carry-Vergleich ausdrücklich gesperrt |
| P06 | Unbekannte ID, Typkonflikt und Alias-Kollision sind sichtbare Prüf-/Reparaturfälle |
| P07 | Falsche Unterstützungsprogression und Gerätewechsel im Vergleich werden zurückgewiesen |
| P08 | App, Service Worker, öffentliche Positivliste und Abhängigkeiten bleiben unverändert; gezielt geprüft |

Tatsächlich ausgeführt: 18 gezielte Tests in `tests/exercise-prototype.test.cjs`, alle bestanden. Dazu Berichtserzeugung, Syntax-/Pfad-/Diffprüfung und Vergleich der bestehenden App-/Veröffentlichungsdateien. Keine App-Gesamttests oder Browserläufe für diesen isolierten Prototyp. Echte Smartphone-/PWA-Abnahme der früheren App-Änderungen bleibt offen.
