# Übungsdatenbank – Verträge für Import, Export und Migration

Historischer Vertragsstand: 12.10.2026. **C1 mit „ok weiter machen“ beauftragt und lokal umgesetzt. C2/C3 bleiben nachgelagerte Pakete. Keine produktive Datenmigration und keine neue Austausch-/Speicherversion eingeführt.**

Grundlage sind D1–D8 der bestätigten [Entscheidungsvorlage](UEBUNGSDATENBANK-ENTSCHEIDUNGSVORLAGE.md), der [Datenprototyp](../prototyp/uebungsdatenbank/README.md) und die tatsächlichen Import-/Backupfunktionen in [index.html](../../index.html). „Weiter machen“ beauftragt diesen nächsten Vorbereitungsschritt. Die folgenden Pakete begrenzen die spätere Umsetzung; nicht beauftragte Funktionen bleiben zurückgestellt.

## 1. Ergebnis und nächster sinnvoller Schritt

Zuerst **optionale Bibliotheksidentitäten für bereits kompatible Übungen** durch Editor, Import, Export und Backup transportieren. Die bestehende Programmposition bleibt erhalten; alte Programme funktionieren weiter ohne Bibliotheks-ID. In diesem ersten Paket steuert die neue ID keine andere Erfassung, Empfehlung oder Auswertung.

Unterstützung, persönliche Definitionen und historische Erfassung benötigen anschließend einen erweiterten Vertrag. Sie lassen sich nicht sicher als unbekannte Zusatzfelder in die alte App einschleusen. Diese Trennung erlaubt einen kleinen ersten Ausbau ohne Versionswechsel und schützt vor einer scheinbar kompatiblen, fachlich falschen Migration.

## 2. Nachweis am bestehenden Code

Die [isolierte Kompatibilitätsprüfung](../prototyp/uebungsdatenbank/KOMPATIBILITAETSBERICHT.md) verwendet den tatsächlichen Code von `parseProgram()`, `importTranslate()`, `exportTranslate()`, `validateBackupFile()` und `backupJSON()` mit synthetischen Daten. Die UI, Speicherung im Browser und Progression werden nicht ausgeführt. Für den Backup-Aufruf ist `syncStore()` im Prüfumfeld neutralisiert; der Nachweis bezieht sich auf Validierung und Zusammensetzung des Backups, nicht auf den ganzen App-Lebenszyklus.

| Beobachtung | Konsequenz |
| --- | --- |
| V2 wird mit zusätzlicher `exerciseId` und `tracking` angenommen; Import/erneuter Export verlieren beide Felder | Zusätzliche Metadaten müssen künftig ausdrücklich in beide Übersetzungsrichtungen aufgenommen werden. Ein Export durch den bisherigen Reader erzeugt wieder unbestätigten Altbestand. |
| Eine v2-Unterstützungsübung mit `requiredCapabilities` wird als gewöhnliche gewichtete Wiederholungsübung angenommen | Ein Fähigkeitsmarker schützt ältere Reader nicht. Unterstützung in einem solchen v2-Dokument nicht als korrekt abwärtskompatibel ausgeben. |
| Der geprüfte Reader lehnt `version:3` beziehungsweise ein fremdes `format` ab | Eine harte Grenze könnte schützen; damit ist noch keine neue Produktversion entschieden oder implementiert. |
| Gewicht + Sekunden + `perSide` bleibt im v2-Rundweg erhalten | Der heutige Carry-Vertrag benötigt keine neue Version. |
| Schema-4-Backup mit Zusatzkatalog und widersprüchlicher `performedExercise`-Metainformation wird angenommen | Der heutige Validator prüft diese neuen Felder nicht. „Backup akzeptiert“ beweist nicht deren Integrität. |
| Ein Zusatzkatalog an der Zustandswurzel verschwindet bei `backupJSON()` | Neue persönliche Definitionen brauchen zusammenhängende Speicherung, Sicherung und Wiederherstellung. |
| `schemaVersion:5` wird abgelehnt | Eine spätere Semantikgrenze braucht eine bewusste Schemaentscheidung. Schema 4 bleibt jetzt bestehen. |

Sieben neue gezielte Tests bestätigen diese Beobachtungen. Es ist kein Test sämtlicher früherer Releases, kein Browserlauf und keine reale Wiederherstellung persönlicher Daten. Der isolierte Nachweis beschreibt den aktuell vorhandenen v2-/Schema-4-Reader.

## 3. Verbindliche Invarianten aus D1–D8

1. Eine Bibliotheks-ID bezeichnet eine Übung; `program.id` einen Trainingsblock und `day.ex[].id` eine Programmposition. Diese Kennungen niemals gegeneinander austauschen.
2. Log-Schlüssel bleiben `Woche|Tag|Programmpositions-ID`. `prevId`, `fromWeek`, `untilWeek`, aktive/archivierte Blöcke und Vorblockbeziehungen bleiben erhalten.
3. Namen/Aliasse bestimmen nur bei eindeutiger und kompatibler Zuordnung einen Kandidaten. Unbekannte ID, Typkonflikt und Namensmehrdeutigkeit nicht still reparieren.
4. Historische Rohwerte, Namen von Ersatzübungen und Erfassungsregeln bleiben erhalten. Neue Metadaten erklären keine fehlenden alten Informationen.
5. 0 kg und fehlende Last unterscheiden. Seiten, Hanteln und Gerätewerte nicht nachträglich verdoppeln, teilen oder schätzen.
6. Unterstützung hat eine eigene Bedeutung. Eine kleinere Unterstützung ist nicht gewöhnlich angehobenes Gewicht; Empfehlungen und Auswertung erst nach eigenem Vertrag erweitern.
7. Bibliotheksstammdaten, Programmvorgabe und erfasste Leistung bleiben getrennt. Vollständiges Backup muss später alle zum Verständnis erforderlichen Definitionen und historischen Angaben zusammen enthalten.
8. API-Coach bleibt entfernt. Keine neue Cloud, Laufzeitabhängigkeit oder KI-Anforderung aus diesen Verträgen ableiten.

## 4. Paket C1 – optionaler Identitätstransport

### Umfang und Felder

Für das erste Umsetzungspaket ist genau ein optionales Referenzfeld vorgesehen:

| Ort | Vorgesehenes Feld | Wirkung |
| --- | --- | --- |
| Bibliothek | `id` für bewusst geprüfte integrierte Einträge | Unveränderliche Identität; bestehende Namen, Typen und Aliasse bleiben kompatibel |
| Externe v2-Programmübung | `exerciseId?: string` | Referenz auf eine bekannte integrierte Übung; keine neue Erfassungssemantik |
| Interne Programmposition | `exerciseId?: string`, neben unverändertem `id` | Dieselbe Referenz transportieren; Logs bleiben an der Positions-ID |
| Schema-4-Backup | Referenz innerhalb der bestehenden Programmposition | Keine neue Zustandswurzel, kein persönlicher Katalog, kein neuer Erfassungssnapshot in C1 |

IDs des Prototyps sind konkrete Kandidaten. Ihre Aufnahme in die öffentliche Bibliothek erfolgt erst im Umsetzungspaket, nicht durch Kopieren der Prototypdatei in den Build. C1 verwendet nur geprüft kompatible Referenzfälle. Klimmzug-Maschine und Couch Stretch bleiben in ihrer heutigen Erfassung nutzbar, erhalten aber keine automatisch bestätigte neue Unterstützungs-/Seitenregel. Die restlichen 188 Einträge bleiben zunächst im bestehenden Bibliotheksformat; daraus keinen Freibrief für automatisch erzeugte IDs ableiten.

### Validierung und Auflösung

- Ohne `exerciseId`: v2 bleibt wie bisher ladbar, auch bei eigenen freien Namen. Eine neue stabile Identität wird nicht still erfunden. Eine spätere Reparaturansicht für vollständig identitätsgebundene Imports ist damit noch nicht eingeführt.
- Mit `exerciseId`: nur vorhandene integrierte ID übernehmen. Zeichensatz/Länge wie im geprüften Prototyp, eindeutige Katalog-ID und vorhandene Referenz verlangen. `custom_...` bleibt in C1 nicht unterstützt, weil die persönliche Bibliothek noch fehlt.
- Die ID muss zu expliziter Einheit, Lastart und Seitenregel passen. Bibliotheksauswahl darf Satzwerte nicht aufgrund eines Namens umstellen. Fehlende Angaben mit unklarer Erfassung sind ein sichtbarer Prüfpunkt.
- Bekannte ID mit abweichendem Namen: bei kompatibler Erfassung die Abweichung in der Vorschau nennen; keine stillen Änderungen bestehender Programm-/Lognamen. Eine vereinheitlichte neue Vorgabe braucht eine bewusste Übernahme.
- Unbekannte ID oder Konflikt: Fehler mit `days[i].exercises[j].exerciseId` beziehungsweise dem widersprüchlichen Feld liefern. Abbrechen erhält den geöffneten Stand. Reparatur muss die Referenz ausdrücklich neu wählen oder entfernen; ein Editor darf sie nicht bereits beim Öffnen verwerfen.
- Eine bewusst entfernte Referenz stellt den bisherigen freien v2-Plan wieder her. Sie behauptet keine persönliche Bibliotheksübung und keine bestätigte historische Identität. Den Referenzverlust vor Übernahme verständlich zeigen.

### Übergänge, die C1 vollständig abdecken muss

| Codepfad | Erforderliche Änderung / Nachweis |
| --- | --- |
| `setExerciseLibrary()` / Suche / `findExerciseLibraryEntry()` | Separater ID-Index mit Duplicate-Prüfung; Alias-Index allein bleibt keine eindeutige Identitätsprüfung |
| `parseProgram()` | Optionales Feld validieren; bestehende v2-Dateien ohne Feld weiter akzeptieren |
| `importTranslate()` / `exportTranslate()` | Referenz ausdrücklich übernehmen und erneut ausgeben; Positions-ID/Timeline unverändert |
| `editorApplyExerciseLibraryEntry()` / Editorentwurf | Auswahl erhält Referenz. Freie Umbenennung darf keine fremde Identität erzeugen; referenzierte Entwürfe nicht beim Öffnen verlieren |
| `timelineProgramFromEdit()` | Gleiche bestätigte Übung behält Positions-ID. Wechsel zu anderer Referenz benötigt den bestehenden Nachfolgerablauf; historische Position erhalten |
| `applyPermanentReplacementMetadata()` / Tausch | Referenz bewusst zur ausgeführten Ersatzübung ändern oder bei unbestätigtem Ersatz entfernen; keine Original-ID am Ersatz stehen lassen |
| `buildFollowupProgram()` / Kopie | Bekannte gleiche Übung behält Bibliotheksreferenz, Block bekommt weiterhin eigene Kennungen; Ersatz aktualisiert Referenz |
| `validateBackupFile()` | Referenzen vor Wiederherstellung prüfen. Prüfung darf nicht allein vom heute verlustbehafteten Export/Import-Rundweg abhängen |
| `load()` / `normalize()` / `persist()` / `backupJSON()` | Optionales Feld erhalten; keine automatische Massenanreicherung alter Programme beim Start |
| Report und `js/progression.js` | In C1 keine neue Zusammenführung oder Berechnung nach ID; bestehendes Verhalten beibehalten |

### Kompatibilität

Eine alte App darf ein C1-v2-Dokument trotz Referenzverlust nur dann fachlich gleich ausführen können, wenn sämtliche maßgeblichen Satzfelder im bestehenden Vertrag vollständig enthalten sind. Daher keine Unterstützung, Gerätevergleich, neue Zählweise oder persönliche Definition hinter einer nur optionalen ID verstecken.

Bei einem Export durch den geprüften alten Reader gehen neue Referenzen verloren. Die spätere App liest diesen Rückweg als freien Altplan; sie darf keine zuvor bestätigte historische Konvention aus dem Namen rekonstruieren. C1 ist deshalb bei alten Readern fachlich ausführbar, aber hinsichtlich der neuen ID nicht verlustfrei. Diese Grenze ausdrücklich kommunizieren, statt einen vollständigen Rundweg zu versprechen.

## 5. Paket C2 – historische Erfassung und Migration

Dieses Paket benötigt vor App-Einbindung einen gesonderten technischen Vertrag. Es ist keine automatische Folge von optionalen IDs. Vorgesehene Regeln:

- Neue Logs erhalten beim ersten bestätigten Satz einen unveränderlichen Snapshot der wirklich ausgeführten Übung und Erfassung. Im Prototyp sind dies `exerciseId`, `trackingSnapshot` und `context`; ihre produktiven Feldnamen und Grenzen werden vor Implementierung festgelegt.
- Stammdatenänderung oder Neuabruf der Bibliothek ersetzt keinen bestehenden Snapshot. Ein echter Übungs-/Erfassungswechsel erzeugt eine neue Variante/Position; reine Metadatenpflege kann dieselbe Übungs-ID erhalten.
- Ein Satztausch bindet den Snapshot an die Ersatzübung, nicht an den Originalnamen. Wenn die Ersatzidentität unklar ist, bleiben Rohname und damalige Erfassung gesondert erhalten; keine erzwungene Originalreferenz.
- Alte Logs ohne Snapshot bleiben Legacy-Logs. Sie erhalten keine nachträglich als sicher ausgegebene Gerätevariante, Hantelzahl, Lastbedeutung oder Seitenregel. Spätere Bestätigung neuer Vorgaben verändert keine alten Sätze.
- Die bisherige Typsignatur prüft Gewicht/Zusatzgewicht/Einheit. Für eine neue Erfassungssemantik reichen diese drei Werte nicht: Seitigkeit, Zählweise, Lastkonvention und Gerätebezug müssen vor Zusammenführung oder Fortführung ebenfalls berücksichtigt werden.
- Auswertung und Vorblockvergleich trennen unterschiedliche Identitäten/Erfassungen; neue Vergleiche verlangen bestätigten kompatiblen Kontext. Legacy-Ansicht erhalten, ohne aktuelle Stammdaten rückwirkend als historische Tatsache zu benutzen.

### Ablauf einer späteren Migration

1. Nur mit gültigem, unverändertem Ausgangsstand und exklusiver Schreibberechtigung beginnen. Bei laufendem Training oder offenem ungesichertem Editor keine Datenumstellung.
2. Alle Programme und Stores einschließlich archivierter Blöcke prüfen. Normalisierung ist keine Migration; sie darf fehlende historische Fakten nicht ergänzen.
3. Auf einer getrennten Kopie einen Änderungsplan mit „eindeutig“, „Bestätigung nötig“ und „unaufgelöst“ erstellen. Namen, Positions-IDs, Timeline und Rohwerte der Quelle erhalten.
4. Konflikte separat zeigen. Der Nutzer kann die Umstellung abbrechen oder offene Fälle weiter als Legacy behandeln; keine Löschung unaufgelöster Übungs- oder Logwerte.
5. Vor einer produktiven Übernahme ein vollständiges Backup einschließlich neu benötigter Definitionen erzeugen und dessen Struktur prüfen. Fehlgeschlagene Sicherung blockiert die Übernahme.
6. Zielzustand, Referenzen und alle bestehenden Werte validieren. Den erwarteten Rohspeicherstand unmittelbar vor dem einzigen Hauptdaten-Schreibvorgang erneut prüfen. Speicherfehler lassen Quelle und Entwurf verfügbar und dürfen keinen Erfolg melden.
7. Wiederholung der gleichen Migration ist idempotent: keine neuen IDs, keine neuen Duplikate, keine erneute Umrechnung. Ein Neustart darf keinen teilweise umgestellten Zustand vorfinden.
8. Wiederherstellung aus dem vorherigen Backup bleibt möglich. Eine Migration liefert einen Prüfnachweis; sie ist kein Ersatz für eine reale Wiederherstellungsabnahme.

Noch festzulegen sind die genaue Repräsentation unveränderlicher Snapshots, Zugriff und Grenzen ihrer historischen Definitionen sowie das Verhalten bei korrigierten Altsätzen. Die bisherigen `sets[].reps`/`weight` werden nicht im ersten Paket in andere Feldnamen migriert.

## 6. Paket C3 – persönliche Bibliothek und Unterstützung

### Persönliche Definitionen

- Eigene Übungen erhalten stabile `custom_...`-IDs. Integrierte Definitionen bleiben unveränderlich; Duplizieren erzeugt eine neue persönliche Identität.
- Umbenennung/Technikpflege darf die ID erhalten. Neue Erfassungsart, Gewichtskonvention oder tatsächliche Variante mit vorhandenem Verlauf benötigt eine neue ID.
- Definitionen dürfen nicht isoliert in ein neues Feld der Zustandswurzel geschrieben werden: `persist()` und `backupJSON()` erstellen ihren Inhalt heute ausdrücklich aus Programmen und Stores. `syncStore()` ersetzt zudem einen Store aus einer festen Feldliste. Alle diese Pfade und die Wiederherstellung müssen zusammen erweitert werden.
- Definition, Programmreferenz und historische Erfassung gemeinsam validieren. Fehlende Definition ist ein Reparaturfall, kein Auftrag zum Löschen der Trainingswerte.
- Importierter identischer Inhalt unter derselben persönlichen ID darf nach Prüfung wiederverwendet werden. Abweichender Inhalt unter belegter ID darf nichts überschreiben: bewusste neue ID, Referenzen der Importkopie anpassen, bestehende Programme/Logs erhalten.
- Alle bestätigten Definitionswerte benötigen Längen-/Mengen-/Zahlenlimits, vollständige Backup-Abdeckung und Schutz beim bewussten Löschen/Archivieren. Die vollständige 200-Einträge-Taxonomie bleibt eine eigene Datenprüfung.

### Unterstützung und ältere Reader

Eine Unterstützungsübung darf nicht als neue, automatisch korrekt gesteuerte gewöhnliche v2-Gewichtsübung exportiert werden. Weder `exerciseId` noch `tracking.loadMode` noch `requiredCapabilities` stoppen den geprüften alten Reader. Gleiches gilt für Backups, deren Verständnis neue Definitionen oder historische Semantik voraussetzt.

Vor C3 sind konkret zu entscheiden:

1. Harte Versions-/Formatgrenze für nicht abwärtskompatible Erfassung oder bewusste Zurückstellung solcher Exporte. V2 bleibt für bereits darstellbare Pläne verfügbar.
2. Ob eine neue Daten-Schemaversion für persönliche Definitionen/Erfassung benötigt wird; klare Ablehnung durch ältere Apps, Import alter Schema-4-Backups weiterhin möglich.
3. Ob eine verlustbehaftete v2-Kopie überhaupt angeboten wird. Falls ja, nur mit klarer Vorschau und ohne die Behauptung, Unterstützung/Bestwerte seien unverändert transportierbar. Kein automatischer Ersatz durch eine andere Übung.

Empfehlung: Unterstützung und persönliche Bibliothek erst nach dieser Entscheidung produktiv ausliefern. **In diesem Auftrag keine v3-Datei, kein Schema-5-Backup und keine neue API implementieren.** Die im Kompatibilitätstest verwendeten Versionszahlen sind synthetische Gegenproben.

## 7. Konkrete Abnahme für das erste Umsetzungspaket C1

| Fall | Erwartung |
| --- | --- |
| A01 – Altdatei | Bestehende v2-Vorlage ohne IDs bleibt ladbar; Satzfelder und Erfassung bleiben identisch |
| A02 – Neue Referenz | Bekannte kompatible ID wird durch Import → Editor → Export → erneuten Import erhalten |
| A03 – Position | Log-Schlüssel, `prevId` und Wochen-Gültigkeit verändern sich durch Referenzergänzung nicht |
| A04 – Konflikt | Plank-ID mit Gewicht/Wiederholungen, unbekannte ID oder persönliche ID ohne Definition ergibt konkreten Fehlerpfad; kein stiller Fallback |
| A05 – Editor | Bloßes Öffnen verliert keine Referenz. Bewusstes Entfernen/Ändern bestätigt die Auswirkung; Abbrechen behält den Entwurf |
| A06 – Ersatz | Permanenter Tausch und Folgeblock tragen die korrekte Ersatzreferenz; bisheriger Verlauf bleibt unverändert |
| A07 – Sicherung | Schema-4-Backup erhält kompatible Referenzen; Validator prüft sie unabhängig vom früheren Verlustpfad |
| A08 – Alter Rundweg | Der geprüfte alte Reader verliert nur optionale Identität; ausführbare Satzfelder bleiben erhalten. Keine rückwirkende Kontextbestätigung beim Rückimport |
| A09 – Speicherproblem | Zweites Fenster, Fremdänderung und Speicherfehler blockieren Übernahme; kein Entwurfsverlust oder falscher Erfolg |
| A10 – Grenzen | Keine Unterstützung nach neuer Logik, neuen Rekorde, Snapshots, persönliche Definitionen, Cloud oder KI in C1 |

Gezielt zu prüfende Dateien bei späterer Umsetzung: Import/Validierung, Übungsbibliothek, Editor/Timeline, Tausch/Folgeblock und Backup jeweils nach tatsächlich betroffenem Verhalten. Nur der benötigte Browserfall für Auswahl/Importvorschau, nicht die ganze Matrix. Bereits erfolgreiche unveränderte Prüfungen nicht wiederholen.

## 8. Arbeitsstand und nächste Umsetzung

Dieser Auftrag hat Verträge und Grenzen vorbereitet und sieben isolierte Kompatibilitätsfälle am bestehenden Code geprüft. Der ursprüngliche Datenprototyp mit seinen 18 Tests wurde nicht verändert und nicht erneut getestet. App, Bibliothek, Programmvorlagen, Service Worker, Versionen und Build bleiben im bisherigen Arbeitsstand. Keine privaten Daten gelesen, keine Veröffentlichung und kein Git-Upload.

C1 ist anschließend lokal umgesetzt und nach A01–A10 gezielt geprüft: [Ergebnisbericht](../tests/TESTBERICHT-UEBUNGSREFERENZEN.md). Nächster Schritt: C2 spezifizieren und C3 einschließlich der nötigen Versionsentscheidung separat freigeben. Die echte Smartphone-/PWA-Abnahme bleibt parallel offen. Der vorherige Kompatibilitätsnachweis verwendet jetzt einen gesicherten Ausschnitt des eigenen Readers vor C1, damit der dokumentierte alte Rundweg trotz neuer Implementierung weiterhin prüfbar bleibt.

## Fortschreibung nach erweitertem Auftrag vom 13.10.2026

Der neue Auftrag beauftragt C2 sowie persönliche Bibliothek und Detailansicht. Die frühere Begrenzung „keine Schema-5-Implementierung in diesem Auftrag“ bezog sich auf die Vertragsvorbereitung/C1 und wird durch den neuen Umfang abgelöst. Schema 5 ist für vollständige neue Backups implementiert; Schema-4-Import und v2-Programme bleiben erhalten. Unterstützung und nicht abwärtskompatible neue Erfassungsarten sind weiterhin nicht beauftragt und bleiben offen.

Konkrete produktive Felder: `personalExercises` an der Zustandswurzel; optionale `exerciseDefinition`/`weightConvention` an Programmpositionen; `pendingPerformedExercise` bei neuer Teileingabe und `performedExercise` beim ersten vollständigen Satz. Schnappschüsse werden nicht an bestehenden Legacy-Werten ergänzt. Korrigierte neue Logs behalten ihre Erfassung. Historische Mengen werden nicht abgeschnitten oder umgerechnet. Definition, Programm und historische Erfassung sind gemeinsam sicherbar. [Aktuelle Regeln](../../BRIEFING-CODEX.md) und [gezielte Abnahme](../tests/TESTBERICHT-PERSOENLICHE-UEBUNGEN.md).
