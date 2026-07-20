# Versionshistorie

In dieser Datei werden alle nutzerrelevanten Änderungen an Satzkraft dokumentiert. Das Format orientiert sich an „Keep a Changelog“; die Versionsnummern folgen `MAJOR.MINOR.PATCH`.

> Hinweis zur Rückschau: v0.15.0 bis v0.16.0 wurden nachträglich aus `BRIEFING-CODEX.md` rekonstruiert. Für diese Zwischenstände existieren keine getrennten Git-Tags oder sicher belegten Veröffentlichungstage. Ab v0.17.0 wird jede Version zum Release-Zeitpunkt hier gepflegt.

## [Unreleased]

### Hinzugefügt

- Kommt dieselbe Übung an mehreren Trainingstagen vor, zeigt die Trainingskarte zusätzlich den jüngsten eingetragenen Wert des anderen Tages. Progression und Zielgewichte bleiben weiterhin pro Trainingstag getrennt.
- Nach einem vollständig beendeten Training fragt Satzkraft für jede getauschte Übung einzeln, ob der Tausch dauerhaft gelten oder nur im gerade beendeten Training bleiben soll. Ist im aktuellen Block keine offene Folgewoche mehr vorhanden, wird ein bestätigter Tausch in den nächsten Folgeblock übernommen.
- Die nächste Trainingswoche zeigt die aus der vorigen Einheit abgeleitete Progressionsempfehlung direkt an der jeweiligen Übung.
- Eine leicht verständliche PDF-Anleitung erklärt den Programmeditor mit seinen Bereichen Training, Wochen und Details.

### Geändert

- Während eines laufenden Trainings wird die informative Seitenfußzeile mit Versionshinweis, Entwicklerangabe und Hell-/Dunkelmodus ausgeblendet.
- Die App öffnet nach dem Update ohne zusätzlichen Start-Hinweis direkt in der Trainingsansicht.
- Beim Tauschen bleibt ein frei bearbeitbares Feld „Ersatzübung“. Während der Eingabe stehen deutsche Datenbanktreffer direkt darunter zur Auswahl; nach der Auswahl bleibt nur der Name im Feld. Ein separater Bereich zeigt zusätzlich genau eine empfohlene Ersatzübung.
- Aktionen auf Programmkarten wie „Bearbeiten“, „Aktivieren“, „Folgeblock starten“, „Archivieren“ und Archivaktionen werden einheitlich als anklickbare Textaktionen ohne Button-Fläche dargestellt.
- Der Hinweis „Arbeitsgewicht noch offen“ steht in Trainingskarten immer unter dem Verlauf und unmittelbar vor den Satzzeilen.
- Zeitvorgaben und protokollierte Zeitwerte werden einheitlich im Format Minuten:Sekunden angezeigt, beispielsweise `1:15 min` statt `75 Sek`.
- Beim Fortsetzen eines unterbrochenen Trainings gilt das dreistündige Sicherheitslimit nur für den aktuell gestarteten Abschnitt. Bereits gespeicherte Abschnitte lösen keinen sofortigen automatischen Stopp mehr aus; beim Wechsel in den Hintergrund wird die Trainingszeit pausiert.
- Die zusätzliche Zeile „Arbeitsgewicht“ in Trainingskarten entfällt. Das Ziel bleibt oben sichtbar; fehlt es, übernimmt der erste eingetragene Satz den Arbeitswert, und spätere Sätze verwenden vorrangig das zuletzt tatsächlich verwendete Gewicht.
- Empfehlungen erscheinen direkt nach den abgeschlossenen Sätzen. In der offenen Folgewoche steht nur ein kompakter Herkunfts- oder Erholungshinweis fest neben der betroffenen kg-, Wiederholungs- oder Zeitvorgabe.
- Die Fußleiste einer abgeschlossenen älteren Einheit enthält nur noch „Werte korrigieren“. Der erklärende Protokollsatz und die redundante Aktion „Diesen Inhalt heute trainieren“ entfallen.
- Direkte Änderungen und die Korrekturansicht erklären vor dem Speichern einheitlich, dass spätere Empfehlungen und Zielwerte neu berechnet werden.
- Übungstausche heißen vor und während des Trainings einheitlich „Übung tauschen“. Eine dauerhafte Entscheidung wird nicht mehr während des Trainings oder gesammelt im Editor verlangt.
- Die automatische Satzpause startet auch nach dem letzten Satz. Der zusätzliche Knopf „Pause starten“ entfällt.
- Trainingskarten, Programmeditor, Programmverwaltung und Erstellen-Auswahl wurden typografisch beruhigt und ausgerichtet. Sichtbare Garmin-Bezeichnungen entfallen; die bisherigen Datenfelder bleiben für kompatible Importe erhalten.
- Bibliotheksvorschauen zeigen Übungen ohne zusätzliche Trainingsgruppen-Zuordnung und ohne redundante Startgewicht-Zählung.

### Behoben

- Beim Öffnen eines neuen oder importierten Programms im Editor ist nicht mehr automatisch die erste Übung ausgewählt.
- Die Speicherleiste des Programmeditors deckt auf iPhones auch den Bereich unterhalb der Buttons vollständig ab; die darunterliegende Ansicht scheint nicht mehr durch.
- Auf kleinen Smartphone-Bildschirmen brechen die Protokollaktionen in der unteren Leiste sauber um und werden nicht mehr seitlich abgeschnitten.
- Das Programm „Calisthenics Einstieg“ lässt sich wieder fehlerfrei laden und bis zur Vorschau öffnen.
- Das Umschalten automatischer Wiederholungsbereiche schließt die geöffnete Trainingsgruppe im Editor nicht mehr.
- Beim verzögerten Einklappen einer erledigten Übung bleibt die folgende Karte an ihrer sichtbaren Position.
- Dead Hang sowie reine Zeit- und Körpergewichtsübungen erhalten im Deload keine unlogische Empfehlung für ein reduziertes Gewicht mehr.

### Offen

- Der detaillierte Leitfaden zur Ermittlung des ersten Arbeitsgewichts bleibt eine offene Produktentscheidung; v0.22.1 vereinheitlicht nur die bestehende Hinweisdarstellung.
- Die konkrete Darstellung der einzelnen Tauschentscheidung wird noch mit etablierten Trainingsapps verglichen; der fachliche Zeitpunkt nach Trainingsende und die Einzelentscheidung je Übung stehen bereits fest.
- Für die Wochenplanung bleibt eine Kombination aus verständlichen Vorlagen und frei änderbaren Werten die bevorzugte Richtung. Eine einschränkende feste Datenbank wird erst nach einer eigenen Produktentscheidung umgesetzt.

## [0.26.0] – 2026-07-17

### Hinzugefügt

- Eingebaute Übungsbibliothek: 200 geprüfte Übungen mit sauberen deutschen und englischen Namen – der Editor schlägt beim Tippen passende Übungen vor und füllt Typ, Technik-Hinweis und Ersatzübung automatisch aus.

### Geändert

- Bessere Tauschvorschläge: Beim Übungstausch schlägt Satzkraft gleichwertige Alternativen vor.
- Fortschritte werden über Blöcke hinweg zuverlässiger erkannt, auch wenn Übungen leicht unterschiedlich benannt sind.

## [0.25.0] – 2026-07-17

### Hinzugefügt

- Neue Aktion „Werte korrigieren“: Zahlen abgeschlossener Trainings jederzeit ausbessern oder vergessene Sätze nachtragen – ohne die Trainingszeit zu verändern.

### Geändert

- Dein Protokoll ist jetzt geschützt: Abgeschlossene Trainings bleiben unverändert, Planänderungen gelten ab jetzt und nie rückwirkend.
- Ersetzte Übungen behalten ihre Geschichte: Der Plan zeigt „seit Woche X“ samt Vorgängerin, die Auswertung führt beendete Übungen mit Zeitraum.
- Trainiert wird vorne: Neue Einheiten starten in der aktuellen Woche, Vergessenes aus der Vorwoche lässt sich nachholen.

## [0.24.0] – 2026-07-17

### Hinzugefügt

- Neue Programm-Bibliothek: Vier geprüfte Satzkraft-Programme (Gym Ganzkörper Beginner und Fortgeschritten, Calisthenics-Einstieg, Hybrid) lassen sich mit vollständiger Vorschau und Kalibrier-Anleitung direkt übernehmen.

### Geändert

- Offizielle Satzkraft-Programme sind in der Programmverwaltung gekennzeichnet.

## [0.23.0] – 2026-07-17

### Behoben

- `O3`: Abgeschlossen bleibt abgeschlossen – Tagesanzeige, Wochenbalken, Verpasst-Warnung und Blockabschluss richten sich bei beendeten Einheiten nach dem beim Beenden gespeicherten Abschlussstatus. Nachträgliche Programmänderungen (z. B. eine ergänzte Übung oder erhöhte Satzzahlen) machen fertige Wochen nicht mehr rückwirkend unvollständig und blockieren den Blockabschluss nicht mehr.

### Geändert

- `O6`: Die Wiederholen-Abfrage warnt zusätzlich, wenn spätere Wochen desselben Trainingstags bereits Werte enthalten: Empfehlungen der folgenden Wochen werden aus den neuen Werten neu berechnet; die eingetragenen Werte bleiben unverändert.

### Daten & Kompatibilität

- Keine Formatänderung: Es wird ausschließlich der vorhandene Abschlussstatus gespeicherter Einheiten gelesen. Alte Backups ohne diesen Status laden unverändert und verhalten sich wie bisher; Schema-Version, Austauschformat und Progressionslogik bleiben unverändert.

## [0.22.3] – 2026-07-16

### Behoben

- `FB-20260716-26`: Gehört der laufende Satz-, Pausen- oder Halte-Timer zu einer Übung, sind Satz- und Arbeitsgewichtseingaben aller anderen Übungen konsequent gesperrt. Eine zusätzliche Prüfung im Speicherpfad verhindert auch über bereits fokussierte Eingabefelder fremde Einträge.

### Geändert

- `FB-20260716-27`: Vorgemerkte dauerhafte Übungstausche öffnen nach Trainingsende verpflichtend die Auswahl „Zum Editor“ oder „Vormerkungen verwerfen“. Die frühere Später-Möglichkeit entfällt; beim Verwerfen bleibt das beendete Training protokolliert, zukünftige Einheiten verwenden die Originalübungen.
- `FB-20260716-27`: Der Editor übernimmt alle Vormerkungen gemeinsam, öffnet die erste betroffene Übung und markiert sämtliche betroffenen Übungen gelb, bis die Änderungen übernommen oder verworfen wurden.
- `FB-20260716-28`: Übungsnotizen werden im vollständigen Trainingsprotokoll direkt angezeigt und nicht mehr hinter einer Aufklappaktion verborgen.
- `FB-20260716-28`: Editor-Kopien und ersetzte Programme werden nicht automatisch aktiviert; nach dem Speichern führt der Ablauf zurück in die Programmübersicht. Die ausdrückliche Aktion „Speichern & aktivieren“ für neue Programme bleibt bestehen.
- `FB-20260716-28`: Die Einstellung für den Dunkelmodus steht in der Fußzeile der Hauptseite und nicht mehr innerhalb der Programmverwaltung.

### Daten & Kompatibilität

- Bestehende Tauschprotokolle und Vormerkungen bleiben kompatibel. Bestätigte Vormerkungen werden über die vorhandene stabile Übungszuordnung übernommen; verworfene Vormerkungen ändern ausschließlich zukünftige Einheiten. Datenformat, Schema und Progressionslogik bleiben unverändert.

## [0.22.2] – 2026-07-16

### Geändert

- `FB-20260716-23`: Das Archiv öffnet als eigene Unteransicht mit Zurück-Funktion und sitzt nun in der Kopfzeile der Programmverwaltung; der Dunkelmodus ist in die Fußzeile gewandert. Eine aus dem Archiv geöffnete Auswertung verwendet ebenfalls Zurück statt Schließen.
- `FB-20260716-23`: Programmkarten verzichten auf das redundante Aktiv-Symbol. Vollständig absolvierte Programme erhalten ein goldenes „Abgeschlossen“-Badge, das Erstellungs- oder Änderungsdatum steht ganz rechts und Bearbeiten, Auswertung, Wiederherstellen sowie Archivieren erscheinen als kompakte, zugängliche Textaktionen.
- `FB-20260716-24`: Der Scheibenrechner bietet ausschließlich 10-, 15- und 20-kg-Stangen und zeigt nur das mathematische Gewicht pro Seite; freie Stangengewichte, Scheibenstücklisten und studioabhängige Beladungsvorschläge entfallen.
- `FB-20260716-25`: Eine Übung kann für die ausgewählte Einheit schon vor Trainingsbeginn getauscht und bis zur ersten Satzeingabe wieder auf das Original zurückgesetzt werden. Der dauerhafte Ersatz bleibt an ein laufendes Training und die anschließende bewusste Editor-Aktion gebunden.

## [0.22.1] – 2026-07-16

### Geändert

- `FB-20260716-14`: Ein heutiger Übungstausch kann vor der ersten Satzeingabe wieder auf das Original zurückgesetzt werden; eine zugehörige Vormerkung zur dauerhaften Ersetzung wird dabei ebenfalls entfernt.
- `FB-20260716-15`: Der Scheibenrechner erhält eine klarere visuelle Beladung pro Seite sowie die direkt sichtbare Stangenwahl 10, 15, 20 kg oder eigenes Gewicht.
- `FB-20260716-16`: „Archivieren“ wird in der Programmverwaltung als kleinere, dezente Nebenaktion dargestellt.
- `FB-20260716-17`: Das Erstellungs- beziehungsweise Änderungsdatum wandert als Nebeninformation in die Metazeile bei Tagen und Wochen; dort steht bei vollständig absolvierten Programmen auch „Abgeschlossen“.
- `FB-20260716-18`: Editor-Hinweistexte verwenden eine einheitliche Schriftgröße; der Hinweis zu fehlendem Arbeitsgewicht und die vorhandene Kalibrierinformation werden linksbündig dargestellt.
- `FB-20260716-19`: Nach dem Löschen eines Programms bleibt die App in der Programmverwaltung.
- `FB-20260716-20`: Der Abschluss und das Einklappen einer Übung bleiben ohne sichtbares Springen stabil. Die Vorgabezeile hat keinen Fade-Abschluss mehr und verwendet für die Pause ein zugänglich beschriftetes Uhrsymbol.
- `FB-20260716-21`: Das vollständige Trainingsprotokoll kennzeichnet einen Tausch als „Original → Ersatz“ und zeigt eine vorhandene Übungsnotiz aufklappbar an.

## [0.22.0] – 2026-07-16

### Hinzugefügt

- `FB-20260716-11`: Jede offene Übung kann im laufenden Training vor der ersten Satzeingabe für heute getauscht werden. Ersatzsätze zählen für Einheit, Satzsumme und Gesamtvolumen, bleiben aber aus Progression, Trend und Folgeblock-Empfehlung der Originalübung heraus.
- Dauerhafte Ersetzungen werden während des Trainings nur vorgemerkt. Nach Trainingsende führt eine bewusste Aktion zur richtigen Übung im Editor; erst „Original ersetzen“ ändert das Programm.
- `FB-20260716-12`: Der KI-Coach speichert bereinigte Wizard-Antworten versioniert in einem eigenen lokalen Schlüssel und bietet beim nächsten Start „Übernehmen“ oder „Neu starten“ an.
- Absolvierte Coach-Programme bieten eine direkte Neuplanung mit den gespeicherten Antworten an.

### Daten & Kompatibilität

- Ein heutiger Tausch liegt optional als `swap` an der vorhandenen Log-Zelle; ein abweichendes Arbeitsgewicht bleibt ausschließlich bei der Ersatzübung. Dauerhafte Vormerkungen überstehen „Später“ und einen Neustart. Alte Logs bleiben unverändert gültig, vollständige Backups prüfen die neuen optionalen Werte.
- Coach-Herkunft wird intern als `source:"coach"` erhalten, aber weder Antworten noch Herkunft werden in das Austauschformat einzelner Programme exportiert.

## [0.21.0] – 2026-07-16

### Hinzugefügt

- `FB-20260716-09`: Nach der letzten vollständig absolvierten Einheit erscheint einmalig ein Erfolgsfenster mit Block-Kennzahlen, Verbesserungen sowie direkten Wegen zum Folgeblock und zur Auswertung.
- Absolvierte Programme erhalten einen aus den vorhandenen Satzdaten berechneten Status. Ein Folgeblock übernimmt Aufbau und empfehlenswerte Startgewichte aus der letzten belastbaren Nicht-Deload-Einheit.
- `FB-20260716-10`: Die Programmverwaltung hat ein eigenes schreibgeschütztes Archiv mit vollständiger Auswertung und Wiederherstellung.
- Aktive Folgeblöcke zeigen bei gleichnamigen Übungen den letzten Vergleichswert ihres archivierten Vorblocks.

### Daten & Kompatibilität

- Die optionalen internen Felder `archived`, `parent` und `blockCelebrated` werden normalisiert und in vollständigen Backups geprüft, aber nicht in das Austauschformat einzelner Programme exportiert.

## [0.20.0] – 2026-07-16

### Hinzugefügt

- `FB-20260716-04`: Antippbare Gewichtsziele öffnen einen Scheibenrechner mit Standard-Scheiben und einer pro Übung gespeicherten Stangenauswahl.
- `FB-20260716-05`: Übungsnotizen speichern bis zu 500 Zeichen für Geräte-Einstellungen und Technik-Beobachtungen direkt am lokalen Fortschritt.
- `FB-20260716-06`: Nach dem ersten vollständigen Satz fragt Satzkraft den Browser still nach dauerhaftem Speicher. Eine dezente Backup-Zeile erinnert erst nach 14 Tagen und einer weiteren Einheit; „Später“ pausiert sieben Tage.

### Geändert

- `FB-20260716-07`: Erklärbegriffe im Editor sind selbst antippbar, der Halte-Timer behält durchgehend dieselbe Farbe, wichtige Bedienelemente haben eindeutige zugängliche Namen und die mobile Vorgabezeile zeigt ihre horizontale Scrollbarkeit deutlicher.
- `FB-20260716-08`: Editor-Kopien erhalten automatisch einen eindeutigen Datumsnamen mit Kollisionszähler und bleiben innerhalb des 30-Zeichen-Limits.

### Daten & Kompatibilität

- Die optionalen lokalen Felder `barw` und `notes` werden in Backups validiert und beim Ersetzen eines Programms anhand der stabilen Übungsidentität mitgenommen.

## [0.19.1] – 2026-07-16

### Geändert

- `FB-20260716-13`: Während eines laufenden Trainings ist die Programmverwaltung für strukturelle Änderungen schreibgeschützt. Bearbeiten, Aktivieren, Erstellen/Importieren, Fortschritts-Reset und Backup-Wiederherstellung sind sichtbar deaktiviert.
- Exportieren und Teilen, vollständiger Backup-Download, Auswertung, Theme und Versionshistorie bleiben während des Trainings erreichbar.

### Sicherheit

- Die gesperrten Aktionen prüfen den Trainingszustand zusätzlich in ihren Funktionspfaden. Dadurch können bereits geöffnete oder veraltete Ansichten den Schreibschutz nicht umgehen.

## [0.19.0] – 2026-07-16

### Hinzugefügt

- `FB-20260716-03`: „Original ersetzen“ übernimmt standardmäßig den bisherigen Fortschritt eines bestehenden Programms. Eingetragene Sätze, Trainingsverlauf und manuelle Gewichtsziele bleiben beim Einfügen, Verschieben und Umbenennen von Übungen korrekt zugeordnet.
- Der bisherige vollständige Fortschritts-Reset bleibt im Ersetzen-Dialog als bewusst wählbare Alternative erhalten.

### Geändert

- Gelöschte Übungen verlieren ihre Werte; bei einem Wechsel zwischen Gewichts-, Körpergewichts- und Zeitübung beginnt nur die betroffene Übung neu.
- Beim Kürzen eines Trainingsblocks werden Werte entfallener Wochen entfernt und die aktuelle Woche auf den verbleibenden Bereich begrenzt.
- Die Editor-Hilfe erklärt den Unterschied zwischen „Als Kopie speichern“ und „Original ersetzen“.

### Sicherheit

- Das aktive Programm kann während eines laufenden Trainings nicht ersetzt werden. Der Editor fordert zuerst zum Beenden des Trainings auf.

## [0.18.0] – 2026-07-16

### Hinzugefügt

- `FB-20260715-01`: Zeitübungen unterstützen jetzt die Modi `target` (automatischer Stopp am oberen Ziel) und `max` (manueller Stopp). Der Modus kann im Programmeditor gewählt und im JSON mit `timerMode` importiert/exportiert werden.
- `FB-20260715-07`: Ein Klick auf die Versionsnummer in der Fußzeile öffnet die Versionsübersicht.
- `FB-20260715-09`: Fußbereiche und Versions-Popup nennen Christian Woyack als Entwickler, ohne Adresse oder Kontaktdaten zu veröffentlichen.
- `FB-20260715-11`: Die Versionsübersicht zeigt für Tester und Dritte die vollständige dokumentierte Historie von den frühen Entwicklungsständen bis zur aktuellen unveröffentlichten Testfassung.

### Geändert

- `FB-20260715-02`: Nach vollständig erreichter Zielzeit empfiehlt Satzkraft eine leichte Steigerung von Widerstand, Tempo oder Übungsvariante; die Zeitvorgabe wird nicht endlos verlängert.
- `FB-20260715-03`: Zeitvorgaben ab zwei Minuten werden in Satzfeldern als Minuten mit einer Nachkommastelle angezeigt und eingegeben; intern und in vorhandenen Trainingsdaten bleiben die Werte kompatibel in Sekunden gespeichert.
- `FB-20260715-04`: Die Halte-Timerleiste verwendet nach Erreichen des Zielbereichs einen bernsteinfarbenen Fortschritt und eine kontrastreiche Stopp-Schaltfläche. Das mobile Layout der Leiste wurde entzerrt.
- `FB-20260715-06`: Das bisherige dünne Info-Zeichen wurde durch ein deutliches, gefülltes Info-Symbol ohne umgebenden Kreis ersetzt.
- `FB-20260715-07`: Die Versionsnummer neben der Überschrift „Programme“ wurde entfernt; sie steht nur noch in den Fußbereichen.
- `FB-20260715-10`: Auch der integrierte KI-Coach erhält verbindliche Regeln für `timerMode:"target"` inklusive Sekundenbereich und `timerMode:"max"`. Manuelle Erstellung, Editor und externe KI-Vorlage verwenden dieselben Timer-Modi.

### Behoben

- `FB-20260715-05`: Beim automatischen Einklappen einer erledigten Übung wird die Position der aktuell bearbeiteten Übung erhalten, sodass der Bildschirm nicht mehr springt.
- `FB-20260716-02`: Eine vollständige Backup-Wiederherstellung ersetzt jetzt tatsächlich alle vorhandenen Programme und Fortschrittsdaten. Das Standardprogramm wird nicht mehr ungefragt ergänzt, und ein ausstehender Autosave kann das gerade eingespielte Backup nicht mehr mit dem alten Stand überschreiben.

### Offen

- `FB-20260715-08`: Vorerst wird keine Adresse veröffentlicht. Ein mögliches vollständiges Impressum bleibt bis zur späteren rechtlichen und produktseitigen Entscheidung offen; persönliche Adressdaten stehen nicht im Repository.

### Dokumentation

- Fester Ablauf für neue Fehler und Änderungswünsche im Projektbriefing definiert: strukturierte Aufnahme mit Feedback-ID, Priorisierung, Reproduktion, Umsetzung, Prüfung, Nutzerabnahme und Versionsentscheidung.

## [0.17.0] – 2026-07-15

### Hinzugefügt

- Vollständiges Import-Testprogramm `TESTPROGRAMM-ALLE-SZENARIEN.json` für Gewichte, Körpergewicht, Zusatzgewicht, kurze und lange Timer, eigene Übungsvorgaben sowie Warm-up/Cool-down.
- Automatischer Test, der das vollständige Testprogramm über die echte Programmvalidierung lädt.

### Geändert

- Erledigte Übungen klappen nicht mehr sofort nach dem letzten Satz ein. Sie bleiben bis zu 12 Sekunden offen und klappen früher ein, sobald in einer anderen Übung weitertrainiert wird.
- Zeitübungen verwenden einen Timerknopf direkt im Sekundenfeld; der zusätzliche Startknopf unter den Sätzen wurde entfernt.
- Sätze, Wiederholungsziel, Gewichtsziel und Pause bleiben in der Vorgabezeile zusammen.
- Editor-Übungszeilen zeigen zuerst die Trainingsgruppe und darunter die Parameter, unabhängig von Länge und Satzzeichen des Kategorienamens.
- Aufklapp-Pfeile wurden über die verschiedenen Programm- und Editorbereiche hinweg einheitlich vertikal zentriert.
- Info-Schaltflächen zeigen nur noch ein schlichtes Info-Zeichen ohne Kreis.
- Der Ablauf „Mit ChatGPT & Co. erstellen“ besteht jetzt aus einem freien Trainingswunsch, einem fertigen Kopiertext und einem klar beschriebenen JSON-Import.
- Importhinweise erklären deutlicher, dass die vollständige JSON-Antwort benötigt und vor dem Speichern auf fehlende Felder geprüft wird.
- App-Version und PWA-Cache wurden auf v0.17.0 angehoben.

### Produktentscheidung

- Der KI-Coach bleibt ohne zusätzlichen Beta-Zugangscode. Der zwischenzeitlich erwogene Code-Schutz ist kein Bestandteil dieses Releases.

## [0.16.0] – nachträglich rekonstruiert

### Hinzugefügt

- Beidseitiges Öffnen und Einklappen erledigter Übungskarten im aktiven Training.
- Automatischer Start der Satzpause zwei Sekunden nach einem vervollständigten Satz.
- Hilfetexte und Info-Schaltflächen für Trainingsgruppen, Übungstypen, RIR, Phasen, eigene Vorgaben, Startgewichte und Warm-up/Cool-down.
- Kalibrierungs-Hinweise für importierte Programme ohne voreingestellte Arbeitsgewichte.

### Geändert

- Gewichte und Wiederholungen können sich beim ersten Eintrag sinnvoll gegenseitig ergänzen; 0 kg wird nicht mehr automatisch als Arbeitsgewicht übernommen.
- Während einer Satzpause bleibt die Trainingsansicht scrollbar.
- Lange Zeitvorgaben werden lesbar in Minuten dargestellt, während die Eingabe weiterhin in Sekunden erfolgt.
- Editorbereiche behalten ihren Aufklappzustand nach Änderungen; geöffnete Übungen zeigen keinen irritierenden Verschiebe-Griff.
- Editor-Anleitung und Programmimport wurden für Einsteiger verständlicher formuliert.

## [0.15.4] – nachträglich rekonstruiert

### Geändert

- Plattformabhängige Unicode-Symbole wurden durch ein einheitliches Inline-SVG-Icon-System ersetzt.
- Trainingsrelevante Schriftgrößen wurden moderat verbessert.
- Die Hauptkopfzeile wurde auf „Programme“ und „Auswertung“ reduziert; Version und Theme-Wechsel befinden sich in der Programmverwaltung.
- Satz- und Übungsabschlüsse erhielten dezentes visuelles Feedback.

## [0.15.3] – nachträglich rekonstruiert

### Hinzugefügt

- Geführter Halte-Timer für Zeitübungen mit Zielbereich, Bestwert, Ton/Vibration und Übergang in die Satzpause.
- Kompakte Darstellung erledigter Übungen im laufenden Training.

## [0.15.2] – nachträglich rekonstruiert

### Hinzugefügt

- Dreistufiger Übergabeprozess für die Programmerstellung mit ChatGPT und anderen externen KIs.
- Trainingswissenschaftliche Leitplanken in der exportierten KI-Vorlage.
- Zentraler Bereich „Exportieren & Teilen“ in der Programmverwaltung.

### Geändert

- Erstellen-Hub und Importwege wurden verständlicher benannt und geordnet.

## [0.15.1] – nachträglich rekonstruiert

### Hinzugefügt

- Verständliche Auswahl des Übungstyps anstelle mehrerer voneinander abhängiger Checkboxen.
- Bearbeitung von Warm-up und Cool-down mit Übungsauswahl, Sekunden, Reihenfolge und Undo im Editor.

## [0.15.0] – nachträglich rekonstruiert

### Hinzugefügt

- Direkter Leeren-Button für eingefügtes Programm-JSON.
- Bestwerte und zugehörige Wochen in der Auswertung.
- Verlässlicher direkter Druck/PDF-Export ohne separates Popup.

### Geändert

- Auswertung auf drei zentrale Kennzahlen reduziert; Deload-Wochen verzerren gewichtete Übungstrends nicht mehr.
- Veraltete Importtexte, Editor-Hilfen und die Trainingslegende wurden aktualisiert.
- Doppelte Workout-Steuerung entfernt; die untere Leiste ist die einzige laufende Trainingssteuerung.

## [0.14.1] – 2026-07-13

### Hinzugefügt

- Sicherer visueller Programmeditor mit Kopie-/Ersetzen-Ablauf.
- Vollständige Backups über alle Programme und Trainingsdaten sowie abgesicherte Wiederherstellung.
- Tests für Trainingsdaten, Editor und Backup-Verwaltung.

### Geändert

- PWA-Cache wurde für zuverlässigere Live-Aktualisierungen erneuert.

## Vor v0.14.1

- Aufbau der lokalen Satzkraft-PWA, der Programm- und Trainingslogik sowie der serverseitigen KI-Coach-Funktion.
- Diese frühen Entwicklungsstände hatten keine konsistent gepflegten App-Versionen oder Release-Tags.
