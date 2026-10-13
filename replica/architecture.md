# Satzkraft Architektur und nächste Verbesserungen

Stand: 11.10.2026 · Grundlage: [Bestandsaufnahme](recon.md), [Funktionsmatrix](features.csv), [aktives Briefing](../BRIEFING-CODEX.md).

Paket A zum Schutz lokaler Trainingsdaten bei mehreren geöffneten Fenstern ist nach „dann weiter machen“ lokal umgesetzt. Der integrierte API-Coach wurde nach der Nutzerentscheidung entfernt; die externe KI-Runde bleibt lokal. Paket B zur Korrektur gewichteter Zeitübungen in Auswertung, Verlauf und Protokoll ist nach dem erneuten „weiter machen“ ebenfalls lokal umgesetzt. Beide Verbesserungen lösen nachweisbare Probleme im bestehenden Produkt. Anschließend wurden D1–D8 der [Entscheidungsvorlage](../docs/planung/UEBUNGSDATENBANK-ENTSCHEIDUNGSVORLAGE.md) mit „ja bitte“ bestätigt. Der [isolierte Prototyp](../docs/prototyp/uebungsdatenbank/README.md) mit zwölf Definitionen, getrennten Beispielfällen und Altzuordnungsbericht ist lokal erstellt und gezielt geprüft. Produktive Migration und neue Oberflächen sind weiterhin nicht freigegeben.

Die Entfernung des API-Coachs sowie Pakete A und B sind lokal umgesetzt; Veröffentlichung und Git-Upload sind nicht beauftragt.

## Bestehende Technik beibehalten

| Schicht | Bestehende Technik und Empfehlung | Grund |
| --- | --- | --- |
| Oberfläche und UI-Logik | `index.html`, Vanilla JavaScript, CSS-Tokens | Verbindliche kompakte App; kein Nutzen eines Frameworkwechsels für die nächsten Pakete |
| Fachlogik | `js/progression.js` | Abgegrenzter sensibler Kern; für Speicherschutz und Berichtskorrektur nicht umbauen |
| Daten | `localStorage`, Hauptschlüssel `cali-plan-v3`, Schema 4 | Lokales Produkt ohne Konto; bestehende Backups erhalten |
| Austausch | JSON `trainings-block`, Version 2 | Import/Export, KI-Runde und Programmupdates bleiben kompatibel |
| Bibliotheken | Statische JSON-Dateien und Aliasindex | 200 Übungen und vier Vorlagen genügen für bestehende Abläufe |
| Backend | Keine eigenen Serverfunktionen | API-Coach samt Netlify-Funktion entfernt; spätere KI-Lösung getrennt planen |
| Offline | Service Worker und freigegebene statische Ressourcen | Kein neuer Sync-Dienst; externe KI wird vom Nutzer außerhalb der App verwendet |
| Build und Hosting | Abhängigkeitenfreier Kopierbuild → `dist/`, Netlify | Nur 13 öffentliche Dateien; keine Analyse- oder Testdateien veröffentlichen |
| Tests | Node-Vertrags-/Verhaltenstests; gezielte Playwright-Fälle | Bestehende Teststrategie weiterverwenden |

Keine neuen Konten, Zahlungen, E-Mails, Webhooks oder zeitgesteuerten Backendjobs. Der historische Supabase-Plan wird nicht reaktiviert.

## Datenvertrag statt neuer SQL-Datenbank

Es gibt derzeit **0 SQL-Tabellen**. Ein `schema.sql` wäre für diesen Auftrag eine neue, unerwünschte Architektur. Der an SQL orientierte Replica-Schritt wird deshalb auf den bestehenden JSON-Vertrag angewendet.

| Vertrag | Muss erhalten bleiben |
| --- | --- |
| Hauptzustand | `schemaVersion`, `programs`, `active`, `store`; Speichern darf keinen fremden neueren Stand ersetzen |
| Programmidentität | Interne `id`, externe `code`/`revision`; Kopien und Folgeblöcke mit eigener Kennung |
| Beziehungen | Fortschritt gehört zum Programm; Logschlüssel referenziert Woche/Tag/Übung; `parent` referenziert Vorblock |
| Lebenszyklus | `fromWeek`/`untilWeek`/`prevId`; vergangene Leistungen bleiben unter damaliger Übung erhalten |
| Zahlen | Wiederholungen ≤9999, Sekunden ≤5999, Gewicht ≤2000 kg; keine negativen Zusatzgewichte |
| Zeit | Satzzeit intern Sekunden in `reps`; Kalender-/Sitzungszeit als vorhandene Epoch-Millisekunden; Anzeige deutsch/lokal |
| Validierung | Bestehende Programm-/Backupvalidierung; Referenzen und erlaubte Werte vor Übernahme prüfen |
| Zugriff | Browser-Origin verwahrt lokalen Zustand; keine Benutzer-/RLS-Schicht; keine KI-API-Aufrufe |
| Löschung und Backup | Nur Satzkraft-Schlüssel löschen; Notfallsicherung und Bereinigung historischer Coach-Antworten erhalten |

Für das nächste Paket ist keine Schemaerhöhung nötig: erwarteter Speicherstand und Schreibberechtigung können zur Laufzeit verwaltet werden. Neue persistente Metadaten wären erst nach einer konkret begründeten, optionalen und rückwärtskompatiblen Spezifikation zulässig.

## Schnittstellen je Ablauf

Es gibt keinen eigenen HTTP-Fachendpunkt mehr. Die Abläufe verwenden lokale Funktionsverträge und statische Dateien.

| Ablauf | Schnittstelle | Eingabe → Ausgabe | Berechtigung und Grenze |
| --- | --- | --- | --- |
| F01 | `loadProgramLibraryItem()` → `beginProgramImport()` | Vorlagenindex → validierte Vorschau | Lokal; öffentliches statisches JSON; kein Programmwechsel bei Training |
| F02 | `createManualProgram()` → Editor | Erstellangaben → Entwurf → Programm | Validieren vor Speicherung |
| F03 | `prepareProgramImport()` / `importUpdateExisting()` | JSON → Fehler/Vorschau/Update | 5-MB-Grenze, Kennung/Revision, bestätigte Übernahme |
| F04 | `beginWorkout()` / `onSetInput()` / `stopWorkout()` | Einheit/Satzwerte → Logs und Historie | Aktive Einheit und Eingabesperren; neue fensterübergreifende Schreibprüfung |
| F05 | Zeitfeld-/Halte-Timerfunktionen | Ziffern/Timer → Sekunden | Erst bestätigte manuelle Eingabe speichern; gewichtete Zeit bleibt zweidimensional |
| F06 | `swapExerciseForToday()` / `applyPermanentExerciseReplacement()` | Übung/Entscheidung → Log/ab künftig gültiger Plan | Vor Satzeingabe, kompatibler Typ; historisches Protokoll erhalten |
| F07 | `startCorrection()` / `finishCorrection()` / `cancelCorrection()` | Sicherungsstand/Änderungen → korrigierte Logs | Bewusst bearbeiten; Abbrechen stellt Stand wieder her |
| F08 | `timelineProgramFromEdit()` / `migrateReplaceStore()` | Alt/Neu/Referenzen → Plan und fortgeführter Store | Ersetzen bestätigen; erst ab nächster offener Einheit |
| F09 | `buildReportData()` / `reportDetailedProtocol()` | Programm/Logs/Historie → Kennzahlen/HTML | Nur lesen; Archivzustand separat; typgerechte Ausgabe korrigieren |
| F10 | `buildFollowupProgram()` | Vorblock/Store → neuer Block | Nur belastbare Ausgangswerte; keine Originaltrends aus Tauscheinheiten |
| F11 | `persist()` / `confirmBackupRestore()` / `clearLocalAppData()` | Zustand/Backup → lokaler Stand | Sicherheitskopie; neue gemeinsame Schreibkontrolle für alle Hauptdatenpfade |
| F12 extern | `externalAiPrompt()` / Export / Import | Wunsch/Programm → kopierbarer Text → JSON | Nutzer übermittelt selbst an externen Dienst |

Statische GETs betreffen `uebungen.json` und vier Programmdateien. Webhooks und geplante Serverjobs: 0. Der 250-ms-UI-Takt für Timer ist kein Backendjob.

## Priorisierung nach Nutzen und Aufwand

Nutzen 1–5: 5 schützt Kernfunktionen oder Daten; 1 wäre wenig relevanter Zusatz. Aufwand sind grobe Entwicklungstage einer mit dem Projekt vertrauten Person einschließlich gezielter Prüfungen. Hardwarewartezeit und spätere große Kompletttests sind nicht enthalten. Die Reihenfolge berücksichtigt Schadensschwere und Entscheidungsreife, nicht nur einen rechnerischen Quotienten.

| Rang | Verbesserung | Nutzen | Aufwand | Entscheidung und Abhängigkeit |
| --- | --- | ---: | --- | --- |
| 1 | **Paket A: Schutz vor veralteten/konkurrierenden App-Fenstern** | 5 | 2–4 Tage | Lokal umgesetzt und gezielt geprüft; reale PWA-/Geräteabnahme bleibt offen |
| 2 | **Paket B: Zeit+Gewicht typgerecht auswerten** | 4 | 1–2 Tage | Lokal umgesetzt; gemeinsame Trendkennzahl bleibt fachlich offen |
| Parallel zu A/B | Reale Smartphone-Abnahme abschließen | 4 | 30–60 Min. | Hauptgerät nötig; Tastatur/Safe Area/lange Einheit; vorhandene Anforderung O03 |
| 3 | Übungsdatenbankkonzept und 12 Referenzfälle fachlich entscheiden | 3 | 1–2 Tage | D1–D8 bestätigt; übrige umfassende Konzeptideen weiterhin Entwurf |
| 4 | Isolierter Datenprototyp und Mapping der heutigen Felder | 3 | 3–5 Tage | Lokal erstellt und gezielt geprüft; Coding-Briefing C1–C3 vom 12.10. vorbereitet, produktive Einbindung noch offen |
| 5 | Persönliche Übungsbibliothek mit Backup/Import | 3 | 8–15 Tage | Neue Nutzerfunktion; stabile Identitäten und Migrationsvertrag vorausgesetzt |
| 6 | Einfache Vollbild-Übungsdetails mit Verlauf | 3 | 4–7 Tage | Nach Identitäts-/Messwertvertrag; vorhandene Karten/Tokens nutzen |
| 7 | KI-Blockbegleitung oder erweiterter Desktop-Editor | 2 | Vor Schätzung Bedarf klären | Historische Entwürfe; kein bestätigter nächster Bedarf |
| Zurückgestellt | Konten/Cloud, Zahlungen, Social, Frameworkwechsel | — | Nicht schätzen | Aktuelle Nicht-Ziele; eigener neuer Produktauftrag erforderlich |

Die Reihenfolge A vor B schützte zuerst Trainingswerte und korrigierte anschließend die Darstellung. Beide Pakete, der isolierte Übungsprototyp und nun C1 für zehn optionale Übungsreferenzen sind lokal umgesetzt. Das Coding-Briefing beschreibt C2 für historische Erfassung und C3 für persönliche Definitionen/Unterstützung als nächste getrennte Pakete; die echte Geräteabnahme bleibt parallel offen.

## Paket A als konkreter nächster Entwicklungsschritt

### Ziel und sichtbares Verhalten

**Ein zweites Fenster darf den neueren Trainingsstand nicht unbemerkt ersetzen.** Beispiel: Im ersten Fenster wird ein Satz gespeichert. Ein zuvor geöffnetes zweites Fenster wird in den Hintergrund geschickt. Heute kann dessen `flushSave()` den alten Gesamtzustand zurückschreiben. Künftig bleibt der Satz erhalten.

Vorgeschlagene Produktregel: Ein Fenster darf Hauptdaten bearbeiten; zusätzliche Fenster zeigen einen klaren Lesezustand. Es gibt keinen automatischen Merge von Sätzen, keine Übernahme fremder laufender Timer und kein stilles Verwerfen eines Entwurfs.

Ein kompakter Hinweis verwendet bestehende Karten und Tokens: „Satzkraft ist in einem anderen Fenster geöffnet. Dort kannst du weitertrainieren.“ Sobald eine sichere Übernahme möglich ist, heißt die Primäraktion „Aktuellen Stand laden“. Bei lokalen ungespeicherten Änderungen wird davor „Entwurf sichern“ angeboten. Die Formulierungen enthalten keine technischen Fensterkennungen oder Sperrbegriffe.

### Technischer Schnitt

Betroffen: S01/S02/S03/S08/S15; F02–F08/F10/F11. Keine neuen Tabellen oder HTTP-Routen. Änderungen bleiben in `index.html` und direkt betroffenen Tests/Dokumenten.

1. **Reproduktion als gezielten Vertragstest sichern.** Zwei unabhängige App-Kontexte teilen einen synthetischen Speicher. A speichert, B hat einen älteren Stand. Der Test erfasst auch die Schreibwege bei Hintergrundwechsel und Backup-Wiederherstellung.
2. **Koordination vor schreibbarer Bedienung erwerben.** Als erste technische Option eine exklusive, während der Fensterlebensdauer gehaltene Web-Lock untersuchen. Sie koordiniert kooperierende Kontexte desselben Speicherbereichs; die [W3C-Spezifikation](https://www.w3.org/TR/web-locks/) beschreibt diesen Einsatz. Tatsächliche Unterstützung und Lebenszyklusverhalten auf den Zielbrowsern prüfen, bevor diese Option festgelegt wird. Keine Sperre nach kurzem Hintergrundwechsel gewaltsam übernehmen.
3. **Aktuellen Zustand nach Erhalt der Berechtigung laden.** Ein zuvor geladener alter Zustand darf nicht beim späteren Erwerb der Schreibberechtigung gespeichert werden. Wiederherstellung eines laufenden Trainings bleibt gemäß Briefing pausiert.
4. **Alle Hauptdatenmutationen absichern.** `save()`/`flushSave()`/`persist()` sowie direkte Speicherung bei Backup-Restore und Komplettlöschung müssen denselben Schutz nutzen. Timer, verzögerte Saves und `pagehide` dürfen ihn nicht umgehen. Erfolgs-/Abschlussmeldungen erst nach tatsächlich erfolgreicher Speicherung.
5. **Zusätzlich erwarteten Speicherstand vergleichen.** Vor dem Schreiben muss der zuletzt geladene/selbst gespeicherte Stand noch aktuell sein. Fremde Änderung stoppt die Übernahme, erhält den Entwurf für eine Sicherung und bietet bewusstes Neuladen an. Ein Vergleich allein ist keine atomare Sperre gegen gleichzeitige Zugriffe.
6. **Kompatibilität und Fallback zuerst klären.** Bei fehlender Koordinations-API darf keine scheinbar sichere `localStorage`-Heartbeat-Sperre eingeführt werden. Entweder einen nachgewiesen atomaren Fallback spezifizieren oder die betreffende Umgebung mit verständlichem Hinweis gegen unsicheres Schreiben schützen. Falls dies den bisherigen unterstützten Geräteumfang einschränkt, ist die Produktentscheidung vor Umsetzung erforderlich; Paket B bleibt unabhängig möglich.

Die Lock gilt nur zwischen Fenstern, die den neuen Schutz kennen. Ein noch laufendes Fenster mit altem JavaScript kann sie umgehen. Der Rollout braucht deshalb einen verständlichen Hinweis zum Schließen/Neuladen anderer Satzkraft-Fenster und einen gezielten Mischversionstest. Ein einfacher Versions-/Snapshotvergleich kann fremde Änderungen erkennen, macht alte Software aber nicht automatisch kooperativ.

### Abnahmekriterien

| ID | Prüffall | Erwartung |
| --- | --- | --- |
| A01 | A und B starten mit gleichem Stand; A speichert einen Satz; B navigiert/verschwindet in Hintergrund | Satz bleibt gespeichert; B überschreibt nichts |
| A02 | Beide Fenster versuchen gleichzeitig zu bearbeiten/speichern | Höchstens ein schreibbarer Kontext; keine verlorenen Änderungen durch konkurrierendes Schreiben |
| A03 | Zweites Fenster öffnet Programme/Editor während A trainiert | Kein Umgehen der Trainings-/Programmsperre über den zweiten Kontext |
| A04 | Schreibendes Fenster schließen; anderes Fenster bewusst übernehmen | Neuester Stand laden, dann bearbeiten; laufendes Training gemäß bestehender Reload-Regel pausieren |
| A05 | Neuer Speicherstand bei lokalem Entwurf | Kein stiller Merge/Discard; Entwurf sichern oder bewusst verwerfen und neu laden |
| A06 | Backup-Restore oder Komplettlöschung mit zweitem Fenster | Alter Zustand darf weder Backup noch Löschung rückgängig machen; fremde Origin-Daten unberührt |
| A07 | Quota-/Speicherfehler oder gescheiterte Koordination | Keine Erfolgsmeldung; vorhandener Notfall-Backup-Pfad; kein verlorener Entwurf |
| A08 | Einzelnes Fenster offline, Reload und alte Backups | Training weiter möglich; Schlüssel/Schema 4/Format 2 bleiben kompatibel |
| A09 | Helles/dunkles Schema und 320 px, Tastatur/Fokus | Bestehende Tokens, lesbarer Hinweis, passende Fokusführung, kein Überlauf |
| A10 | Aktualisierte App neben noch offenem alten Fenster | Restrisiko eindeutig erkannt/behandelt; keine Behauptung vollständiger Sicherheit zwischen unkooperativen Versionen |

Diese Kriterien ergänzen die bestehenden Abnahmen zu Historie, Zeit, Tausch, Backup, Datenschutz und Offline. Sie ersetzen sie nicht.

### Gezielte Prüfungen für eine spätere Umsetzung

Zuerst die direkt passende neue Node-Testdatei für Speicherkoordination; zusätzlich höchstens ein gezielter Playwright-Fall mit zwei Seiten in **einem** Browserkontext. Getrennte Browserkontexte teilen gewöhnlich nicht dieselben lokalen Daten und würden den Fehlerfall verfehlen. Tatsächliche Koordinations- und Hintergrundgrenzen auf dem hauptsächlich verwendeten Smartphone anschließend praktisch prüfen.

Die gesamte Node-Suite, Playwright-Matrix und Screenshot-Updates bleiben nach `docs/TESTING.md` ausdrücklich beauftragte große Prüfungen. Für die vorliegende Planung wurden sie nicht gestartet.

## Umsetzungsstand Paket A

Die exklusive Web Lock ist in `index.html` umgesetzt. Der aktuelle Stand wird erst nach ihrem Erwerb geladen. Weitere Fenster zeigen eine geschützte Warteansicht statt einer frei navigierbaren Leseoberfläche; das verhindert auch ein Umgehen laufender Trainings- und Editorsperren. Die Freigabe bleibt im Hintergrund erhalten, wird bei `pagehide` nach der Speicherung abgegeben und bei einer erhaltenen Seite (`pageshow.persisted`) neu erworben. Eine Übernahme erzwingt niemals die Freigabe eines anderen Fensters.

Hauptdaten-Saves, direkte Backup-Wiederherstellung und Komplettlöschung prüfen denselben Schutz. Ein zusätzlicher exakter Standvergleich stoppt fremde Änderungen. Lokaler Fortschritt und Editorentwürfe bleiben zur Sicherung erhalten. Das optionale `windowDraft` im normalen Notfall-Backup hält Editor-/Formularwerte zur manuellen Wiederaufnahme fest; kein automatischer Merge. Nach der Sicherung bestätigt der Nutzer, dass die Datei angekommen ist; ungesicherte Verwerfung braucht eine zweite bewusste Aktion.

Ohne Web Locks bleibt Schreiben blockiert. Der reguläre sichere Origin-Einstieg ist HTTPS beziehungsweise localhost. Aktueller mobiler WebKit wurde gezielt geprüft; eine pauschale Freigabe alter Browser, echter PWA-Lebenszyklen oder physischer Geräte erfolgt daraus nicht. Beim Rollout müssen alte Fenster geschlossen/aktualisiert werden. [Prüfbericht und offene Abnahmen](../docs/tests/TESTBERICHT-FENSTERSCHUTZ.md).

## Paket B als anschließende kleine Korrektur

`unit:seconds` und `w:true` müssen gemeinsam interpretiert werden. Sekunden sind weder Wiederholungen für die 1RM-Schätzung noch ein Faktor für die als kg beschriftete Kennzahl „Gewicht × Wiederholungen“.

Minimaler Schnitt: `buildReportData()`, `reportDetailedProtocol()`, `exHistory()`/`showHistory()` und ihre Beschriftungen. Gewichtete Zeitübungen aus Wiederholungsvolumen und geschätztem 1RM ausschließen. Im Protokoll beide Werte anzeigen, beispielsweise **„1:00 min · 20 kg · je Seite“**. Archivbericht, Vorblockvergleich, Druck und Abschluss-Highlights mitprüfen; Typen dürfen nicht wegen gleichen Namens falsch zusammengeführt werden.

Die endgültige kompakte Trendkennzahl für Zeit+Gewicht ist im Übungsdatenbankentwurf noch offen. Bis zu dieser Entscheidung ist die sichere Empfehlung: echte Satzwerte anzeigen und für diese Kombination keinen erfundenen eindimensionalen Bestwert darstellen. Keine neue Doppelprogression und keine Änderung von `js/progression.js` in dieses Fehlerpaket aufnehmen.

Abnahme: 60 s bei 20 kg erzeugen weder 40 kg 1RM noch 1.200 kg Wiederholungsvolumen; Zeit und Last bleiben sichtbar. Klassische Gewicht/Wiederholungs-, reine Wiederholungs- und reine Zeitübungen behalten ihre korrekten Werte. Tausch-, Deload- und Archivregeln bleiben wirksam. Direkt betroffene Berichtstests erweitern; keine gesamte Matrix ohne Auftrag.

### Umsetzungsstand Paket B

Der Bericht unterscheidet jetzt `weighted_seconds` von `weight`, `seconds` und `reps`. Diese Einordnung ist ein zur Laufzeit berechnetes Berichtsmodell und ändert weder gespeicherte Programme noch Schema oder Austauschformat. Zeitübungen mit Gewicht liefern Satzanzahl und tatsächliche Ausführungen, aber keine 1RM-/Volumenpunkte, Bestwerte oder Fortschrittsprozente. Die Karte zeigt die zuletzt erfassten Satzwerte gemeinsam; das Protokoll und der Übungsverlauf behalten Minuten, Last und „je Seite“. 0 kg bleibt sichtbar, fehlende Last wird ausdrücklich benannt. Ein Tausch erscheint im Protokoll, fließt aber nicht in die Leistung des Originals ein.

Vorblockkennzahlen werden über kanonischen Namen **und Typ** zugeordnet. Damit können selbst gleichnamige Wiederholungs-, reine Zeit- und gewichtete Zeitübungen nicht gegenseitig ihre Werte übernehmen. Tatsächliche Deload-Werte werden gezeigt, ohne daraus einen neuen Trend für Zeit plus Gewicht zu berechnen. Der bestehende Druckweg verwendet denselben korrigierten Inhalt.

[Prüfbericht](../docs/tests/TESTBERICHT-ZEIT-GEWICHT.md): gezielte Berechnungs-/Archivtests und ein mobiler Browserfall; keine vollständige Geräte-, Browser- oder visuelle Abnahme. `js/progression.js` bleibt unverändert. Die konkrete Trendkennzahl für Zeit plus Gewicht ist weiterhin eine fachliche Entscheidung im Übungsdatenbankkonzept.

## Danach das Übungsdatenbankkonzept in kleinen Paketen weiterführen

Die im Entwurf vorgesehene Reihenfolge bleibt sinnvoll: Fachkonzept abnehmen → zwölf Referenzübungen als isolierter Datenprototyp → verbindliche Verträge → erst dann Migration, persönliche Bibliothek und Übungsdetail. Stammdaten, Programmvorgabe und tatsächliche Leistung müssen getrennt bleiben. Die bestehenden Bibliotheksnamen/Aliasse allein sind kein dauerhaft stabiler Identitätsschlüssel.

Zuerst entscheiden: Kennzahl je Übungstyp, Unterstützung versus Zusatzgewicht, Gewicht pro Gerät/Gesamtlast, Maschinenvarianten und Zuordnung unbekannter Importübungen. Änderungen am Austauschvertrag erst konkret und kompatibel spezifizieren. Keine Muskelgrafik, zusätzliche Cardio-Oberfläche oder parallele Implementierung vor feststehenden Verträgen beginnen.

### Vorbereiteter Entscheidungsstand vom 11.10.2026

Die bestätigte [Entscheidungsvorlage](../docs/planung/UEBUNGSDATENBANK-ENTSCHEIDUNGSVORLAGE.md) wendet die eigenen Anforderungen auf zwölf vorhandene Bibliotheksübungen an. Sie trennt Gewichtsbedeutung von Eingabekonvention, konkretisiert die Carry-Einordnung als „je Seite“ und verlangt eine Reparatur bei widersprüchlicher ID/Erfassung. Unbestätigte Altwerte bleiben erhalten; aktuelle Metadaten dürfen historische Leistungen nicht umdeuten.

Der bestätigte Folgeauftrag ist lokal abgeschlossen: zwölf Definitionen, Validierungsfälle und [Altzuordnungsbericht](../docs/prototyp/uebungsdatenbank/ZUORDNUNGSBERICHT.md). 18 gezielte Tests bestehen. Zehn Referenzdefinitionen sind im Bibliotheksbestand eindeutig zuzuordnen, zwei benötigen die erwartete Bestätigung; die übrigen 188 Einträge liegen außerhalb des Prototyps. Unter 67 Vorlagenpositionen sind elf Referenztreffer eindeutig und 56 außerhalb des Prototyps. Keine App-Einbindung, Migration, neue Speicher-/Austauschversion, automatische Progression oder neue KI. Die acht Kriterien P01–P08 sind im [Ergebnisbericht](../docs/prototyp/uebungsdatenbank/README.md) nachgewiesen.

Nächster Schritt: konkrete Verträge für Bibliotheksreferenz versus Programmposition, historische Erfassung, persönliche Definitionen und Austausch mit älteren Apps. Der heutige Import-/Exportpfad erhält keine neue Übungsreferenz; Unterstützung lässt sich durch ein optionales Feld allein nicht vor alter Lastlogik schützen. Eine produktive Migration erst auf diesen Verträgen aufbauen, ohne bestehende Schema-4-Backups oder v2-Dateien still umzudeuten.

### Vertragsvorbereitung vom 12.10.2026

Das [Coding-Briefing](../docs/planung/UEBUNGSDATENBANK-VERTRAEGE.md) konkretisiert drei Pakete: C1 transportiert optionale kompatible Übungsreferenzen, C2 regelt historische Erfassung/Migration und C3 persönliche Definitionen/Unterstützung. C1 hat zehn konkrete Abnahmekriterien und benannte Übergänge von Editor, Import, Export, Timeline, Tausch/Folgeblock und Backup. Es verändert keine Progression oder Auswertungskennzahl.

Sieben neue gezielte Prüfungen des bestehenden Codes bestätigen im [Kompatibilitätsbericht](../docs/prototyp/uebungsdatenbank/KOMPATIBILITAETSBERICHT.md): v2-Zusatzfelder werden ignoriert oder verloren; Fähigkeitsmarker schützen Unterstützung nicht; ein Zusatzkatalog an der Zustandswurzel ist heute nicht vollständig sicherbar. Neue Erfassung darf deshalb nicht unter dem bisherigen Vertrag als fachlich kompatibel ausgegeben werden. Versions-/Formatgrenzen wurden nur synthetisch geprüft, nicht eingeführt. Die ursprünglichen 18 unveränderten Prototyptests wurden nicht erneut ausgeführt; keine Browser- oder Gesamtabnahme.

### C1 lokal umgesetzt nach „ok weiter machen“

Zehn geprüfte Übungen erhalten Bibliotheks-IDs. Ein synchroner Referenzvertrag und separater ID-Index prüfen optionale Zuordnungen; v2-Import/-Export, Editor, Timeline, Tausch/Folgeblock und Schema-4-Backup erhalten sie. Fehlerhafte Referenzen bleiben bei der Editorreparatur erhalten, bis der Nutzer sie bewusst ersetzt oder löst. Namen bleiben sichtbar unverändert; die Auswahl einer anderen Referenz erzeugt bei bestehender Timeline einen Nachfolger. Kein Annotieren historischer Logs, keine neue Erfassung oder Berechnung.

[Abnahme](../docs/tests/TESTBERICHT-UEBUNGSREFERENZEN.md): 88 unterschiedliche gezielte Node-Fälle und ein mobiler WebKit-Fall bestanden. Die 18 Prototypfälle wurden wegen des jetzt um IDs ergänzten Bibliotheksbestands erneut geprüft. Der alte Kompatibilitätsnachweis verwendet einen gesicherten Reader-Ausschnitt vor C1; die App lädt diese Prüfdatei nicht. [Build-Log](build-log.md) und Featurematrix markieren die Identitäts-/Erfassungsposition als teilweise umgesetzt. Keine Veröffentlichung oder Versionsänderung; C2/C3 und echte Geräteabnahme bleiben offen.

## Einordnung dieser Planung

Die ursprüngliche Bestandsaufnahme umfasst Code-/Dokumentanalyse und zwei isolierte Reproduktionen mit synthetischen Daten. Die anschließende Entfernung der API-Anbindung ist ein gesonderter Umsetzungsauftrag. Sie ist keine neue vollständige Produktabnahme. Physische Smartphone-Prüfung, die externe KI-Runde mit echtem Anbieter und aktuelle Produktionsbereitstellung sind nicht neu verifiziert.

Die vorhandene Teststrategie verlangt für Dokumentation nur Diff- und Pfadprüfung. Für die spätere Veröffentlichung müssen App-Version und Service-Worker-Cache synchron erhöht werden. Die Entfernung des API-Coachs steht bereits unter Unreleased und als Produktentscheidung im Briefing. Der Auftrag wurde mit „dann weiter machen“ auf Paket A und mit dem anschließenden „weiter machen“ auf Paket B erweitert. Entsprechend dem höher priorisierten aktiven Briefing erfolgt ohne ausdrücklichen Git-Auftrag kein Commit oder Push.
