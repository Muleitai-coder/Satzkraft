# Prüfbericht C1: optionale Übungszuordnungen

Stand: 12.10.2026. Auftrag: „ok weiter machen“ nach dem [Coding-Briefing](../planung/UEBUNGSDATENBANK-VERTRAEGE.md). Lokal umgesetzt; keine Veröffentlichung und kein Versionswechsel.

## Ergebnis

Zehn kompatible integrierte Übungen besitzen stabile Bibliotheks-IDs. Auswahl, Editor, v2-Import/-Export und Schema-4-Backup erhalten das optionale Feld `exerciseId`. Die vorhandene Programmpositions-ID und Log-Schlüssel bleiben getrennt davon. Es gibt keine automatische Anreicherung alter Programme oder Umrechnung historischer Satzwerte.

Klimmzug-Maschine und Couch Stretch erhalten keine neue Unterstützungs-/Seitenregel. Die übrigen 188 Bibliothekseinträge bleiben ebenfalls im bisherigen Format. Erweiterte Erfassung, persönliche Definitionen, historische Snapshots und eine neue Austausch-/Speicherversion gehören zu C2/C3.

Die App prüft die zehn Referenzen auch vor dem asynchronen Bibliotheksabruf anhand einer kompakten, mit dem ausgelieferten Datensatz geprüften Referenzliste. Der separate ID-Index prüft Duplikate und übernimmt einen ungültigen Katalog nicht teilweise. Freie Namen ohne ID bleiben nutzbar. Widersprüchliche oder unbekannte IDs werden mit einem Fehlerpfad gemeldet und können bewusst im Editor neu zugeordnet oder gelöst werden.

## Tatsächlich ausgeführte Prüfungen

**88 unterschiedliche gezielte Node-Prüfungen bestanden**, aus acht direkt betroffenen Dateien:

| Datei | Fälle | Zweck |
| --- | ---: | --- |
| `tests/exercise-reference.test.cjs` | 14 | Referenzen, Konflikte, Editorentscheidungen, Timeline, Ersatz/Folgeblock, Backup, alter Rundweg, Schreibsperre und Speicherfehler |
| `tests/exercise-library.test.cjs` | 8 | Bibliotheksbestand, Namensauflösung und Auswahlmetadaten |
| `tests/program-validation.test.cjs` | 13 | Bestehende Importverträge und manuelle Pläne |
| `tests/backup.test.cjs` | 6 | Strukturprüfung, Wiederherstellung und Backup-Lebenszyklus |
| `tests/editor-replace-migration.test.cjs` | 7 | Bestehende Positions-/Timeline-Erhaltung |
| `tests/import-update.test.cjs` | 15 | Update-Zuordnung und Programmexport |
| `tests/exercise-exchange-contract.test.cjs` | 7 | Rundweg durch den gesicherten Reader vor C1; Metadatenverlust und Versionsgrenzen |
| `tests/exercise-prototype.test.cjs` | 18 | Unveränderte fachliche Referenzfälle gegen den um IDs ergänzten Bibliotheksbestand |

Die Tests wurden gezielt ausgeführt, nicht als vollständige Suite. Nach Änderungen an betroffenen Prüfdateien beziehungsweise am Referenzvalidator wurden nur diese Dateien erneut geprüft; die Zahl 88 zählt unterschiedliche Fälle, keine Wiederholungen.

Zwei Prüfumfelder mussten ergänzt werden: Der isolierte Backup-Validator lädt jetzt den echten Referenzvalidator; der Importtest bildet den booleschen Erfolg von `setActive()` korrekt ab. Die Prüfungen bleiben erhalten. Ein zunächst falsch erwarteter Browser-Seitentitel wurde auf den bestehenden Text „Deine Bibliothek“ korrigiert.

**Ein Browserfall bestanden:** `REG-29/P1`, ausschließlich `mobile-webkit`, ohne Snapshot-Updates. Geprüft wurden:

- Referenz nach Öffnen des bestehenden Editors;
- Abbrechen und bewusstes Lösen der Zuordnung;
- erneute Bibliotheksauswahl einschließlich Ersetzen vorhandener Metadaten;
- Kopie speichern, Referenz im v2-Export und Backup erhalten;
- gespeicherte Referenz nach Neuladen;
- ursprünglicher aktiver Store unverändert, keine Referenzen nachträglich in Logs;
- unbekannte ID im Import über „Im Editor beheben“ öffnen, erhalten und bewusst lösen;
- 320 px, beide Farbschemata, kein horizontaler Überlauf und keine JavaScript-Seitenfehler.

Die [helle Editoraufnahme](../../replica/clone-screens/C1-editor-light.png) und [dunkle Editoraufnahme](../../replica/clone-screens/C1-editor-dark.png) wurden visuell geprüft. Vorhandene Komponenten und Tokens werden verwendet; technische IDs erscheinen nicht als Nutzertext.

Zusätzlich: Syntaxprüfung der Inline-Skripte und neuer Prüfdateien, JSON-/Dokumentpfade sowie `git diff --check`. `js/progression.js`, Service Worker, App-Version, Schema 4, v2-Austausch und öffentliche Positivliste wurden nicht geändert.

## Abnahme A01–A10

| Kriterium | Ergebnis |
| --- | --- |
| A01 | Alte v2-Dateien und freie Übungsnamen bleiben ladbar; vorhandene Vertragsprüfungen bestehen |
| A02 | Bekannte ID über Import/Export und Editor/Kopie/Reload erhalten |
| A03 | Positions-ID und Log-Schlüssel bleiben erhalten; Identitätswechsel erzeugt einen Timeline-Nachfolger |
| A04 | Unbekannte, persönliche, leere und unpassende IDs abgelehnt; neue Erfassungsdefinitionen hinter Referenzen nicht still ignoriert |
| A05 | Öffnen erhält Referenz; Lösen/Umbenennen erfordert bewusste Entscheidung; Abbrechen bewahrt Entwurf |
| A06 | Ersatz aktualisiert oder löst Referenz; Folgeblock erhält korrekte Identität, Original bleibt unverändert |
| A07 | Kompatible Referenz im Backup erhalten; Rohreferenzen auch bei archivierten Programmen ausdrücklich geprüft; beschädigte Strukturen geben Fehler zurück |
| A08 | Gesicherter Reader vor C1 verliert optionale ID; bisherige Satzfelder bleiben erhalten; Rückimport vergibt keine neue ID aufgrund des Namens |
| A09 | Schreibsperre und fehlgeschlagene Speicherung geben keinen Erfolg aus; Referenz bleibt im Entwurf/Programm verfügbar. Keine neue vollständige Mehrfensterprüfung |
| A10 | Keine Unterstützung nach neuer Logik, neuen Rekorde, persönlichen Definitionen, Snapshots oder KI eingeführt |

## Grenzen und nächster Schritt

Kein Test auf echtem iPhone/PWA, keine vollständige Browsermatrix und kein Release. Der gesicherte alte Reader ist ein Ausschnitt des eigenen Codes vor C1; er wurde für die Kompatibilitätsprüfung isoliert ausgeführt und bildet nicht sämtliche früheren Releases ab. Die Prototyp-/Readerdateien werden nicht von der App geladen oder veröffentlicht.

Alte Apps verlieren beim Import/erneuten Export die optionalen Referenzen. Dies bleibt ein dokumentierter Verlust der Metadaten, keine neue semantische Steuerung einer Übung. Historische Gewichts-, Seiten- und Geräteinformationen bleiben unbestätigt.

Nächster Schritt: C2 für unveränderliche historische Erfassung konkretisieren. Persönliche Bibliothek und Unterstützung folgen erst mit einem vollständigen Backup-/Austauschvertrag. Vor einer späteren Veröffentlichung Version/Cache synchron erhöhen und die offene echte Geräteabnahme abschließen.
