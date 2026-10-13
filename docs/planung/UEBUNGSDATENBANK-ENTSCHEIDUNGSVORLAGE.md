# Übungsdatenbank: Entscheidungsvorlage für den nächsten Schritt

Stand: 11.10.2026. **D1–D8 fachlich bestätigt mit „ja bitte“; isolierter Datenprototyp beauftragt und lokal erstellt. Keine Freigabe für produktive Migration oder neue Oberflächen.**

Diese Vorlage konkretisiert das [Fachkonzept](UEBUNGSDATENBANK-FACHKONZEPT.md) anhand des eigenen Satzkraft-Codes. Die unten genannten Empfehlungen D1–D8 wurden nach Vorbereitung von Phase A bestätigt und in das [aktive Briefing](../../BRIEFING-CODEX.md) übernommen. Das Ergebnis von Phase B steht im [isolierten Prototyp](../prototyp/uebungsdatenbank/README.md); produktive Migration, Bibliothek und neue Oberflächen benötigen anschließend eigene Verträge und Abnahmen.

## 1. Empfehlung zur Entscheidung

Den nächsten Schritt auf **klare Übungsidentität, eindeutige Eingaberegeln und unveränderte Altwerte** begrenzen. Unterstützung erhält eine eigene Bedeutung. Zeit und Gewicht bleiben zwei zusammengehörige Angaben. Persönliche Übungen und Übungsdetails werden danach in kleinen Paketen entwickelt.

| Entscheidung | Empfohlene Regel | Warum sie gebraucht wird |
| --- | --- | --- |
| D1 – Identität | Jede Bibliotheksübung erhält eine unveränderliche ID. Programmposition und ausgeführte Übung bleiben getrennte Identitäten. Namen und Aliasse dienen der Suche und einer geprüften Altzuordnung. | Umbenennen oder Tauschen darf keinen fremden Verlauf übernehmen. |
| D2 – Last | Externes Gewicht, Zusatzgewicht und Unterstützung unterscheiden. Bei Unterstützung ist eine kleinere Zahl weniger Hilfe; sie wird nicht wie angehobenes Gewicht ausgewertet. | Die heutige Klimmzug-Maschine ist lediglich als `gewicht` hinterlegt. |
| D3 – Gewichtseingabe | Langhantel: Gesamtgewicht einschließlich Stange. Kurzhantel: Gewicht einer Hantel. Maschine: angezeigter beziehungsweise bewusst vereinbarter Gerätewert. Alle Werte mit sichtbarem Hinweis; alte Einträge nicht umrechnen. | Dieselbe Zahl kann sonst unterschiedliche Leistungen bezeichnen. |
| D4 – Seiten | Für beidseitig nacheinander ausgeführte Übungen gilt ein Satzwert je Seite. Zwei Seiten nicht still addieren. Wirklich nur links oder rechts ausgeführte Sätze bleiben ein gesonderter, später zu spezifizierender Fall. | `einseitig` und `perSide` sagen bisher nichts über getrennte Links-/Rechtswerte aus. |
| D5 – Kennzahlen | Tatsächliche Satzwerte zuerst. Zeit + Gewicht ohne Gesamtscore oder Prozenttrend. Mobilität/Cardio ohne Kraftrekord; Gerätewerte nur innerhalb derselben Konvention und Gerätevariante vergleichen. | Eine verständliche Anzeige ist bereits ohne künstliche Vergleichszahl möglich. |
| D6 – Import | Bekannte ID und kompatible Erfassung übernehmen; widersprüchliche Angaben zur Prüfung vorlegen. Unbekannte oder mehrdeutige Übungen bewusst zuordnen, als eigene Übung übernehmen oder entfernen. | Ein Alias oder gleicher Name beweist weder Identität noch Erfassungsart. |
| D7 – Beziehungen | Ersatzbeziehungen gerichtet und ausdrücklich gepflegt. Keine automatisch erzeugte Gegenbeziehung. Fehlende Standardalternative ausdrücklich kennzeichnen. | Eine passende Alternative kann andere Satzfelder benötigen. |
| D8 – Erster Umfang | Nur Wiederholungen und Sekunden produktiv vorbereiten. Technik bei persönlichen Übungen optional; Taxonomie zunächst für die Referenzfälle, ohne Muskelgewichtung. Distanz/Tempo und getrennte Seitenwerte zurückstellen. | Das erste Paket bleibt prüfbar und passt zur heutigen Technik. |

Dies sind bestätigte Produktregeln für den Prototyp, keine neue Trainingsempfehlung. Die spätere Standardprogression muss separat für jeden Typ geprüft werden. Diese Vorlage beauftragt keine Änderung von `js/progression.js`.

## 2. Was im eigenen Code bereits vorhanden ist

Geprüfte Quellen: [Bibliothek](../../uebungen.json), [UI und Austauschlogik](../../index.html), [Progression](../../js/progression.js), [aktives Briefing](../../BRIEFING-CODEX.md) und [Designsystem](../DESIGN-BRIEFING.md).

- Die Bibliothek enthält 200 Einträge: 119 `gewicht`, 10 `kgz`, 45 `koerpergewicht` und 26 `zeit`. Sechs der Zeitübungen besitzen zusätzlich `weightedTime:true`.
- Die Bibliothek hat keine stabilen Übungs-IDs. `findExerciseLibraryEntry()` und `canonicalExerciseName()` lösen Namen/Aliasse auf. Die heutigen `ex.id`-Werte kennzeichnen dagegen Positionen beziehungsweise Nachfolger im Programm und werden in Log-Schlüsseln verwendet.
- `exerciseLibraryTypeSignature()` unterscheidet Gewicht, Zusatzgewicht, Körpergewicht, Zeit und gewichtete Zeit. Unterstützung ist kein eigener Typ. `editorApplyExerciseLibraryType()` behandelt die Klimmzug-Maschine daher wie eine gewöhnliche gewichtete Übung. Das ist ein fehlender fachlicher Vertrag, noch kein hier korrigierter Rechenfehler.
- Kurzhantelübungen besitzen bereits den Trainingshinweis „Trag das Gewicht einer Hantel ein.“ Die Erkennung hängt am Equipment-Text. Eine neue Datenbank muss diesen vorhandenen Nutzervertrag ausdrücklich erhalten.
- `einseitig:true` wird als `perSide:true` übernommen. Das aktuelle Satzmodell speichert einen Wert je Seite, keine getrennten linken und rechten Leistungen.
- Suitcase Carry ist bereits Zeit + Gewicht und `einseitig:true`. Couch Stretch ist eine Zeitübung ohne dieses Seitenkennzeichen. Handstand ist konkret „Handstand halten an der Wand“. Klimmzüge verwenden `kgz`, auch wenn tatsächlich 0 kg Zusatzgewicht eingetragen werden.
- Der aktuelle Tausch erlaubt kompatible Typen und gleiches Seitenkennzeichen. Ein Tausch mit anderen Feldern ist eine spätere Funktion aus dem Entwurf, kein bereits vorhandenes Verhalten.
- Paket B zeigt Zeit und Gewicht korrekt gemeinsam und hält Sekunden aus 1RM und Wiederholungsvolumen heraus. Die derzeitige Auswertung anderer gewichteter Wiederholungsübungen bleibt unverändert.

Die folgenden Fälle übernehmen vorhandene Namen, ohne die heutige Bibliothek als bereits normalisiert zu behandeln.

## 3. Zwölf konkrete Referenzfälle

Alle Satzwerte sind synthetische Prüfbeispiele, keine Zielvorgaben. Die späteren IDs werden erst im Prototyp festgelegt. Erfassung, Programmvorgabe und tatsächliche Leistung bleiben getrennt.

| Fall | Heutiger Bibliotheksname | Vorgeschlagene Erfassung | Beispielsatz und sichtbarer Text | Entscheidender Prüffall |
| --- | --- | --- | --- | --- |
| R01 | Langhantel-Kniebeuge | Wiederholungen; extern; Gesamtgewicht; gemeinsam | 8 Wdh · 60 kg gesamt | 60 bleibt 60; Stangengewicht nicht nachträglich addieren. |
| R02 | Kurzhantel-Bankdrücken | Wiederholungen; extern; pro Hantel; gemeinsam | 10 Wdh · 20 kg pro Hantel | Zwei Hanteln machen aus der gespeicherten 20 keine 40. |
| R03 | Beinpresse | Wiederholungen; extern; Gerätewert; gemeinsam | 12 Wdh · 80 kg · Gerät A | Wechsel zu Gerät B darf keine automatische Steigerung gegenüber A behaupten. |
| R04 | Klimmzüge | Wiederholungen; Zusatzgewicht; gesamt; gemeinsam | 6 Wdh · +0 kg; später 6 Wdh · +5 kg | 0 kg ist eine gültige Ausführung. Fehlender Wert wird nicht als 0 gelesen; Körpergewicht nicht schätzen. |
| R05 | Klimmzug-Maschine | Wiederholungen; Unterstützung; Geräteanzeige; gemeinsam | 8 Wdh · 30 kg Unterstützung | 25 kg Unterstützung bei gleicher Wiederholungszahl bedeutet weniger Hilfe. Kein gewöhnlicher Lastanstieg, kein 1RM und kein bewegtes Kraftvolumen aus dem Gegengewicht. |
| R06 | Kurzhantel-Rudern einarmig | Wiederholungen je Seite; extern; pro Hantel | 10 Wdh je Seite · 18 kg pro Hantel | Kein Verdoppeln auf 20 Wiederholungen; keine erfundenen Links-/Rechtswerte. |
| R07 | Plank | Sekunden; ohne Last; gemeinsam | 0:45 min | Ziel-/Maximaltimer ist Programmvorgabe. Keine Gewichtsfelder; Zeitwert bleibt intern 45 Sekunden. |
| R08 | Suitcase Carry | Sekunden je Seite; extern; eine Hantel/Kettlebell | 1:00 min je Seite · 20 kg | 1:00 min/20 kg und 0:45 min/24 kg sind zwei Leistungen ohne eindeutigen gemeinsamen „Bestwert“. Keine kg-Sekunden als Kraftvolumen. |
| R09 | Burpees | Wiederholungen; ohne Last; Gesamtzählung | 12 Wdh | Ein vollständiger Burpee zählt einmal; vorhandene Ausführung mit Liegestütz von einer neuen Variante unterscheiden. |
| R10 | Handstand halten an der Wand | Sekunden; ohne Last; Skill; gemeinsam | 0:30 min · an der Wand | Ein freier Handstand ist eine eigene Variante; Zeiten nicht automatisch zu einem Rekord zusammenführen. |
| R11 | Couch Stretch | Für neue Vorgaben: Sekunden je Seite; ohne Last; Mobilität | 0:45 min je Seite | Alte Werte ohne Seitenangabe unverändert mit „Zählweise nicht bestätigt“ führen. Keine nachträgliche Behauptung, beide Seiten seien ausgeführt worden. |
| R12 | Laufband | Vorerst Sekunden; ohne Last; Cardio | 10:00 min | Keine erfundene Distanz oder Geschwindigkeit, kein Kraftvolumen. Zeit ohne Tempo/Steigung begründet keinen Leistungsrekord. |

### Vergleich und kompakte Anzeige

| Typ | Empfehlung für die spätere Detailanzeige | Grenze |
| --- | --- | --- |
| Externes Gewicht + Wiederholungen | Letzte Sätze, Last jeweils mit zugehörigen Wiederholungen und Eingabekonvention | Keine neue globale Kennzahl im Prototyp. Bestehende Reportberechnung nicht still ersetzen. |
| Zusatzgewicht + Wiederholungen | Last als Zusatzgewicht kennzeichnen; 0 kg zulassen | Keine Addition eines unbekannten Körpergewichts. |
| Unterstützung + Wiederholungen | Unterstützung mit Wiederholungen anzeigen; Vergleich nur bei gleicher Variante und Konvention | „Weniger Hilfe“ allein ist bei zugleich weniger Wiederholungen keine eindeutige Verbesserung. |
| Kraftübung ohne Last | Wiederholungen bei gleicher Variante und Zählweise | Kein Vergleich unterschiedlich ausgeführter Varianten. |
| Reine Zeit | Zeit bei gleicher Variante; bei Skill Variante ergänzen | Bei Mobilität und Cardio bedeutet längere Zeit nicht automatisch bessere Leistung; keine Kraftrekorde daraus ableiten. |
| Zeit + Gewicht | Satzpaare beziehungsweise letzte Ausführung, wie in Paket B | Kein eindimensionales Ranking; zwei Progressionsdimensionen bedeuten noch keine freigegebene automatische Regel. |

Ein Diagramm ist keine Voraussetzung für die erste Detailansicht. Neue Rekord-/Trendregeln werden erst in einem späteren Auswertungspaket verbindlich beschlossen.

## 4. Drei Stellen, an denen der Entwurf genauer werden muss

### Gewichtsbedeutung und Eingabekonvention trennen

Die Frage „Welches Gewicht trägst du ein?“ im bisherigen Editorentwurf vermischt Zusatzgewicht/Unterstützung mit pro Hantel/gesamt. Empfohlen sind zwei kurze Fragen, wobei unpassende Optionen entfallen:

1. „Was bedeutet der Gewichtswert?“ – verwendetes Gewicht, zusätzliches Gewicht oder Unterstützung.
2. „Wie gibst du es ein?“ – gesamt, eine Hantel oder Geräteanzeige.

„Je Körperseite“ gehört zur Ausführung/Zählweise. „Scheiben je Geräteseite“ wäre eine andere Gewichtskonvention und bleibt außerhalb des ersten Umfangs. Gemeinsame Ausführung kann trotzdem zwei Hanteln mit Eingabe pro Hantel verwenden.

### Suitcase Carry und Couch Stretch

Der Entwurf nennt beim Carry `single_side`; der heutige Code nennt ausdrücklich „je Seite“. Empfohlen ist für neue Vorgaben `unilateral_each_side`. `single_side` wird erst nutzbar, wenn ein gesonderter Satz tatsächlich links oder rechts kennzeichnen kann. Ein fehlendes Altkennzeichen darf nicht als Beweis für bilaterale Ausführung gelten.

Beim Couch Stretch ist „je Seite“ eine vorgeschlagene neue Vorgaberegel. Sie darf bestehende Protokolle ohne diese Information nicht umdeuten.

### Bekannte ID mit widersprüchlichen Feldern

„ID gewinnt“ darf nur den Namen vereinheitlichen, wenn die Erfassung kompatibel ist. Verweist die ID auf Plank, während der Import Gewicht + Wiederholungen vorgibt, bleibt die betroffene Übung bis zur Reparatur gesperrt. Eine Vorschau zeigt den Konflikt, statt Felder oder vorhandene Satzwerte still umzuschreiben. Andere valide Importinhalte bleiben erhalten.

## 5. Sicherer Vertrag für Altbestand und Import

Die App bleibt lokal; `cali-plan-v3`, Schema 4 und `trainings-block` v2 gelten weiter. In dieser Konzeptphase werden keine Felder eingeführt, keine Backups neu geschrieben und keine Daten beim Start migriert.

Für den späteren Vertrag gelten folgende Empfehlungen:

1. **Zwei Identitäten:** Eine neue Bibliotheksreferenz darf die heutige Programmpositions-ID nicht ersetzen. Historische Log-Schlüssel, `prevId` und Wochen-Gültigkeit bleiben erhalten.
2. **Gespeicherte Realität:** Vergangene Werte bleiben ihrer damals verwendeten Erfassung zugeordnet. Aktuelle Stammdaten dürfen Zeit, Lastbedeutung, Seitigkeit oder Gerätezuordnung vergangener Sätze nicht überschreiben. Wie die damalige Erfassung gesichert wird, ist im Migrationsvertrag zu entscheiden.
3. **Eindeutiges Matching:** Name/Alias darf nur bei genau einem passenden Kandidaten und kompatibler Erfassung zugeordnet werden. Unbekannter Name, Alias-Kollision und widersprüchliche Felder ergeben einen Reparaturfall. Keine Zuordnung nur aufgrund derselben Muskelgruppe oder desselben Equipments.
4. **Unvollständige Altinformationen:** Rohwerte erhalten. Unbekannte Eingabekonvention beziehungsweise Gerätevariante als unbestätigt behandeln; eine heutige Nutzerbestätigung erklärt nicht automatisch sämtliche alten Sätze.
5. **Maschinenvarianten:** Bewegung als Bibliotheksidentität; konkrete Gerätevariante als gesonderter Vergleichskontext. Wesentlich andere Bewegung erhält eine neue Übungs-ID. Ein bisher unbekanntes Gerät wird nicht nachträglich benannt. Gerätevergleich bleibt aus, bis dieser Vertrag besteht.
6. **Persönliche Definitionen:** Eingebettete Definition validieren und vor dauerhafter Übernahme bestätigen. Eine bereits belegte persönliche ID mit abweichender Erfassung darf keine bestehende Definition überschreiben; neue ID und Referenzzuordnung bewusst wählen.
7. **Backup vollständig:** Persönliche Definitionen, ihre Referenzen und später notwendige historische Erfassungsdaten müssen gemeinsam sicherbar sein. Fehlende Referenzen sind ein sichtbarer Reparaturfall; kein Löschen verwaister Trainingswerte.
8. **Alte App berücksichtigen:** Optionale Felder allein garantieren keinen verlustfreien Export durch ältere Versionen. Vor Umsetzung eine Kompatibilitätsmatrix festlegen: Altdatei → neue App, neue Datei → alte App, erneuter Alt-Export → neue App. Unterstützungslogik kann eine alte App nicht durch ein unbekanntes Zusatzfeld korrekt erlernen.

Der heutige Wiederholungs-/Zeitwert in `sets[].reps` und der Lastwert in `sets[].weight` sind Altbestand, keine ausreichende neue Erfassungsdefinition. Eine spätere Interpretation braucht zusätzlich die verlässlich bekannte Übung und Konvention.

## 6. Umgang mit weiteren offenen Punkten

| Punkt aus dem Fachkonzept | Vorschlag für den nächsten Schritt |
| --- | --- |
| Bewegungsmuster, Equipment und Muskelgruppen | Die zwölf Fälle mit kleinen kontrollierten Listen beschreiben; erst vor der 200-Einträge-Migration eine vollständige Taxonomie entscheiden. Bestehende Techniktexte als Bestand behandeln. |
| Muskelbeteiligung | Nur qualitative Zielbereiche; keine Prozentwerte, Gewichtungsformeln oder neue Muskeloberfläche. |
| Technik bei eigener Übung | Optional. Name und klare Erfassung sind Pflicht; weiterführende Metadaten verständlich ergänzen. Keine Voraussetzung „coachfähig“, solange kein integrierter Coach besteht. |
| Maschinen zwischen Studios | Gerätekontext ausdrücklich unterscheiden, statt aufgrund gleichen Namens automatisch vergleichen; konkrete Speicherung erst im Vertrag. |
| Distanz | Als spätere Erweiterung dokumentieren; kein aktives Distanzfeld und keine Tempoauswertung im ersten Paket. |
| Kompakte Kennzahl | Keine universelle Zahl verlangen. Bei Mehrdimensionalität die tatsächlichen Satzwerte anzeigen. |
| Sportfachliche Importwarnungen | Technische Fehler blockieren; keine neuen Volumen-, Level- oder medizinischen Verbote. Weitere Plausibilitätshinweise separat begründen. |
| Ersatzrichtung | Nur ausdrücklich gepflegte Richtung, keine automatische Rückkante. Typwechsel braucht sichtbare Anpassung vor Satzeingabe. |
| Keine Standardalternative | Expliziter Zustand; keine zufällig gewählte Ersatzübung. |

Verweise auf Coach-Auswahl im ursprünglichen Entwurf sind Zukunftsideen. Sie rechtfertigen nach der Entscheidung zur API-Entfernung weder eine neue API noch KI-Pflichtfelder.

## 7. Bestätigtes Entwicklungspaket

**Phase B: zwölf isolierte Übungsdefinitionen und ein prüfbarer Altzuordnungsbericht.** Grober Aufwand laut Architekturplan: 3–5 Entwicklungstage einschließlich gezielter Prüfungen; kein Fertigstellungstermin.

- Ein Beispieldatensatz unter einem getrennten Planungs-/Prototypverzeichnis. Die App und die Veröffentlichungs-Positivliste laden ihn nicht.
- Festgelegte Feldnamen und erlaubte Kombinationen für Identität, Erfassung, Seiten und Standardprogression. Noch keine automatische Anwendung dieser Progression.
- Ein Mapping für die heutigen Bibliotheksfelder und Programmfelder mit den Ergebnissen „eindeutig“, „Bestätigung nötig“ oder „nicht darstellbar“. Mehrdeutige Fälle und Unterstützung bleiben sichtbar.
- Gezielt geprüfte positive und negative Fälle, darunter fehlendes Gewicht gegenüber 0 kg, widersprüchliche ID/Erfassung, gleichnamige Varianten, Carry ohne Gesamtscore und unbestätigte Altseitigkeit.
- Ein Ergebnisbericht entscheidet, welche kompatiblen Zusatzfelder möglich sind und wo vor produktiver Nutzung ein eigener Vertrag erforderlich ist.

### Abnahmekriterien des Prototyps

| ID | Nachweis |
| --- | --- |
| P01 | Alle zwölf Fälle sind modelliert; nötige Altinformationen und zurückgestellte Funktionen sind ausdrücklich benannt. |
| P02 | Bibliotheksidentität und Programmposition sind getrennt; Umbenennung und Tausch verändern keine Log-Schlüssel. |
| P03 | `none`, externes Gewicht, Zusatzgewicht und Unterstützung sind unterscheidbar. 0 kg und fehlende Last sind unterschiedliche Zustände. |
| P04 | Pro Hantel, gesamt und Gerätewert werden nicht still ineinander umgerechnet; Seitenzählung bleibt explizit. |
| P05 | Zeit + Gewicht erzeugt weder 1RM noch kg-Wiederholungsvolumen noch künstlichen Bestwert. |
| P06 | Unbekannte oder widersprüchliche Zuordnung ergibt einen Reparaturfall, keine automatische Übernahme. |
| P07 | Unterstützung und Gerätewechsel werden nicht durch die heutige gewöhnliche Lastlogik ausgeführt. |
| P08 | Kein App-Ladepfad, keine Laufzeitabhängigkeit, keine Speicher-/Austauschversion und keine Veröffentlichungsdatei wird verändert. |

Danach folgt ein eigenes Coding-Briefing. Die erste produktive Erweiterung sollte den Ablauf **bekannte Übung auswählen → Vorgabe erhalten → Satz erfassen → dieselbe Übung im Verlauf wiederfinden → Backup wiederherstellen** vollständig sichern. Persönliche Bibliothek und Vollbilddetails folgen auf diesem Vertrag.

Die spätere Oberfläche nutzt bestehende Karten, Typografie und Farbrollen, eine klare Primäraktion und sichtbare Zurück-/Schließen-Aktionen. Tastatur, Safe Areas, 320 px, beide Farbschemata und die ununterbrochene laufende Trainingszeit bleiben Abnahmekriterien; diese Vorlage enthält noch keine neue Oberfläche.

## 8. Status und Prüfung dieser Vorlage

- Fachlich bestätigt: D1–D8, zwölf Referenzfälle und der auf den isolierten Prototyp begrenzte Folgeauftrag.
- Lokal erstellt: zwölf Definitionen, getrennte Beispielfälle, Validierung und Altzuordnungsbericht. [Ergebnis und Abnahme](../prototyp/uebungsdatenbank/README.md) dokumentieren P01–P08 und die verbliebenen Verträge.
- Tatsächlich geprüft: eigener Bibliotheksbestand und betroffene Codepfade; im Prototyp 18 gezielte Tests, Berichtserzeugung und Syntax-/Pfad-/Diffprüfung. Keine App-Gesamttests oder Browserläufe für diesen isolierten Schritt.
- Unverändert offen: praktische Smartphone-/PWA-Abnahme der bestehenden Änderungen. Die Referenzfälle ersetzen diese nicht.
- Keine Veröffentlichung, Versionsänderung, produktive Migration oder neue KI-Anbindung.
