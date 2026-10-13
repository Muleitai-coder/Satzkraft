# Altzuordnungsbericht: isolierter Übungsprototyp

Stand: 11.10.2026. Erzeugt aus dem eigenen Bibliotheks- und Vorlagenbestand. Keine persönlichen Trainingsdaten, kein Browserzugriff und keine Migration.

Dieser Bericht deckt zwölf Referenzübungen ab. „Nicht darstellbar“ bedeutet bei den übrigen Namen zunächst „außerhalb des Referenzkatalogs“, nicht „ungültige Übung“. „Eindeutig“ bestätigt nur Identität und darstellbare Alt-Erfassung. Historische Gewichtskonvention, Seitenzählung und Gerätevariante werden dadurch nicht rückwirkend bestätigt.

Bibliothek: 200 Einträge; eindeutig: 10; Bestätigung nötig: 2; nicht darstellbar: 188.

Vorlagen: 4 Dateien, 67 Übungspositionen; eindeutig: 11; Bestätigung nötig: 0; nicht darstellbar: 56.

## Zwölf Definitionen und tatsächliche Beispielwerte

| Fall | Übung | Ausgabe | Alt-Bibliothek |
| --- | --- | --- | --- |
| R01 | Langhantel-Kniebeuge | 8 Wdh · 60 kg gesamt | eindeutig |
| R02 | Kurzhantel-Bankdrücken | 10 Wdh · 20 kg pro Hantel | eindeutig |
| R03 | Beinpresse | 12 Wdh · 80 kg · Gerät A | eindeutig |
| R04 | Klimmzüge | 6 Wdh · +0 kg | eindeutig |
| R05 | Klimmzug-Maschine | 8 Wdh · 30 kg Unterstützung · Gerät A | Bestätigung nötig |
| R06 | Kurzhantel-Rudern einarmig | 10 Wdh je Seite · 18 kg pro Hantel | eindeutig |
| R07 | Plank | 0:45 min | eindeutig |
| R08 | Suitcase Carry | 1:00 min je Seite · 20 kg pro Hantel | eindeutig |
| R09 | Burpees | 12 Wdh | eindeutig |
| R10 | Handstand halten an der Wand | 0:30 min | eindeutig |
| R11 | Couch Stretch | 0:45 min je Seite | Bestätigung nötig |
| R12 | Laufband | 10:00 min | eindeutig |

## Referenzzuordnung im heutigen Bibliotheksbestand

| Quelle | Ziel-ID | Status | Begründung |
| --- | --- | --- | --- |
| uebungen.json[1] · Kurzhantel-Bankdrücken | dumbbell_bench_press | eindeutig | Identität und darstellbare Alt-Erfassung eindeutig zugeordnet. |
| uebungen.json[14] · Klimmzug-Maschine | assisted_pull_up_machine | Bestätigung nötig | Altstruktur beschreibt normales Gewicht statt Unterstützung; nicht durch gewöhnliche Lastlogik ausführen. |
| uebungen.json[21] · Kurzhantel-Rudern einarmig | one_arm_dumbbell_row | eindeutig | Identität und darstellbare Alt-Erfassung eindeutig zugeordnet. |
| uebungen.json[67] · Langhantel-Kniebeuge | barbell_back_squat | eindeutig | Identität und darstellbare Alt-Erfassung eindeutig zugeordnet. |
| uebungen.json[71] · Beinpresse | leg_press | eindeutig | Identität und darstellbare Alt-Erfassung eindeutig zugeordnet. |
| uebungen.json[100] · Handstand halten an der Wand | wall_handstand_hold | eindeutig | Identität und darstellbare Alt-Erfassung eindeutig zugeordnet. |
| uebungen.json[105] · Klimmzüge | pull_up_added_load | eindeutig | Identität und darstellbare Alt-Erfassung eindeutig zugeordnet. |
| uebungen.json[152] · Suitcase Carry | suitcase_carry | eindeutig | Identität und darstellbare Alt-Erfassung eindeutig zugeordnet. |
| uebungen.json[161] · Burpees | burpee_push_up | eindeutig | Identität und darstellbare Alt-Erfassung eindeutig zugeordnet. |
| uebungen.json[170] · Plank | plank | eindeutig | Identität und darstellbare Alt-Erfassung eindeutig zugeordnet. |
| uebungen.json[189] · Couch Stretch | couch_stretch | Bestätigung nötig | Je-Seite-Regel im Altbestand nicht bestätigt. |
| uebungen.json[195] · Laufband | treadmill_duration | eindeutig | Identität und darstellbare Alt-Erfassung eindeutig zugeordnet. |

## Jede Position der vier Vorlagen

| Quelle | Name | Ziel-ID | Status |
| --- | --- | --- | --- |
| programme/calisthenics-einstieg.json → days[0].exercises[0] | Erhöhte Liegestütze | — | nicht darstellbar |
| programme/calisthenics-einstieg.json → days[0].exercises[1] | Rudern an der Stange | — | nicht darstellbar |
| programme/calisthenics-einstieg.json → days[0].exercises[2] | Kniebeugen | — | nicht darstellbar |
| programme/calisthenics-einstieg.json → days[0].exercises[3] | Dead Bug | — | nicht darstellbar |
| programme/calisthenics-einstieg.json → days[1].exercises[0] | Erhöhte Pike Liegestütze | — | nicht darstellbar |
| programme/calisthenics-einstieg.json → days[1].exercises[1] | Band-Klimmzüge | — | nicht darstellbar |
| programme/calisthenics-einstieg.json → days[1].exercises[2] | Ausfallschritte rückwärts | — | nicht darstellbar |
| programme/calisthenics-einstieg.json → days[1].exercises[3] | Seitstütz | — | nicht darstellbar |
| programme/calisthenics-einstieg.json → days[2].exercises[0] | Liegestütze | — | nicht darstellbar |
| programme/calisthenics-einstieg.json → days[2].exercises[1] | Negative Klimmzüge | — | nicht darstellbar |
| programme/calisthenics-einstieg.json → days[2].exercises[2] | Glute Bridge | — | nicht darstellbar |
| programme/calisthenics-einstieg.json → days[2].exercises[3] | Wadenheben einbeinig | — | nicht darstellbar |
| programme/calisthenics-einstieg.json → days[2].exercises[4] | Bird Dog | — | nicht darstellbar |
| programme/gym-ganzkoerper-beginner.json → days[0].exercises[0] | Beinpresse | leg_press | eindeutig |
| programme/gym-ganzkoerper-beginner.json → days[0].exercises[1] | Brustpresse-Maschine | — | nicht darstellbar |
| programme/gym-ganzkoerper-beginner.json → days[0].exercises[2] | Latzug breit | — | nicht darstellbar |
| programme/gym-ganzkoerper-beginner.json → days[0].exercises[3] | Beinbeuger liegend | — | nicht darstellbar |
| programme/gym-ganzkoerper-beginner.json → days[0].exercises[4] | Kurzhantel-Seitheben | — | nicht darstellbar |
| programme/gym-ganzkoerper-beginner.json → days[0].exercises[5] | Plank | plank | eindeutig |
| programme/gym-ganzkoerper-beginner.json → days[1].exercises[0] | Goblet Squat | — | nicht darstellbar |
| programme/gym-ganzkoerper-beginner.json → days[1].exercises[1] | Rudern am Kabel | — | nicht darstellbar |
| programme/gym-ganzkoerper-beginner.json → days[1].exercises[2] | Schulterdrücken-Maschine | — | nicht darstellbar |
| programme/gym-ganzkoerper-beginner.json → days[1].exercises[3] | Beinstrecker | — | nicht darstellbar |
| programme/gym-ganzkoerper-beginner.json → days[1].exercises[4] | Kabel-Curls | — | nicht darstellbar |
| programme/gym-ganzkoerper-beginner.json → days[1].exercises[5] | Dead Bug | — | nicht darstellbar |
| programme/gym-ganzkoerper-beginner.json → days[2].exercises[0] | Rumänisches Kreuzheben (KH) | — | nicht darstellbar |
| programme/gym-ganzkoerper-beginner.json → days[2].exercises[1] | Kurzhantel-Bankdrücken | dumbbell_bench_press | eindeutig |
| programme/gym-ganzkoerper-beginner.json → days[2].exercises[2] | Brustgestütztes Rudern-Maschine | — | nicht darstellbar |
| programme/gym-ganzkoerper-beginner.json → days[2].exercises[3] | Wadenheben stehend | — | nicht darstellbar |
| programme/gym-ganzkoerper-beginner.json → days[2].exercises[4] | Trizepsdrücken am Kabel | — | nicht darstellbar |
| programme/gym-ganzkoerper-beginner.json → days[2].exercises[5] | Seitstütz | — | nicht darstellbar |
| programme/gym-ganzkoerper-fortgeschritten.json → days[0].exercises[0] | Langhantel-Kniebeuge | barbell_back_squat | eindeutig |
| programme/gym-ganzkoerper-fortgeschritten.json → days[0].exercises[1] | Bankdrücken | — | nicht darstellbar |
| programme/gym-ganzkoerper-fortgeschritten.json → days[0].exercises[2] | Langhantel-Rudern | — | nicht darstellbar |
| programme/gym-ganzkoerper-fortgeschritten.json → days[0].exercises[3] | Beinbeuger liegend | — | nicht darstellbar |
| programme/gym-ganzkoerper-fortgeschritten.json → days[0].exercises[4] | Kurzhantel-Seitheben | — | nicht darstellbar |
| programme/gym-ganzkoerper-fortgeschritten.json → days[0].exercises[5] | Plank | plank | eindeutig |
| programme/gym-ganzkoerper-fortgeschritten.json → days[1].exercises[0] | Kreuzheben | — | nicht darstellbar |
| programme/gym-ganzkoerper-fortgeschritten.json → days[1].exercises[1] | Klimmzüge | pull_up_added_load | eindeutig |
| programme/gym-ganzkoerper-fortgeschritten.json → days[1].exercises[2] | Schulterdrücken Langhantel | — | nicht darstellbar |
| programme/gym-ganzkoerper-fortgeschritten.json → days[1].exercises[3] | Beinpresse | leg_press | eindeutig |
| programme/gym-ganzkoerper-fortgeschritten.json → days[1].exercises[4] | Kurzhantel-Curls | — | nicht darstellbar |
| programme/gym-ganzkoerper-fortgeschritten.json → days[1].exercises[5] | Knieheben hängend | — | nicht darstellbar |
| programme/gym-ganzkoerper-fortgeschritten.json → days[2].exercises[0] | Bulgarian Split Squats | — | nicht darstellbar |
| programme/gym-ganzkoerper-fortgeschritten.json → days[2].exercises[1] | Schrägbankdrücken (KH) | — | nicht darstellbar |
| programme/gym-ganzkoerper-fortgeschritten.json → days[2].exercises[2] | Rudern am Kabel | — | nicht darstellbar |
| programme/gym-ganzkoerper-fortgeschritten.json → days[2].exercises[3] | Rumänisches Kreuzheben | — | nicht darstellbar |
| programme/gym-ganzkoerper-fortgeschritten.json → days[2].exercises[4] | Wadenheben stehend | — | nicht darstellbar |
| programme/gym-ganzkoerper-fortgeschritten.json → days[2].exercises[5] | Seitstütz | — | nicht darstellbar |
| programme/hybrid-gym-calisthenics.json → days[0].exercises[0] | Langhantel-Kniebeuge | barbell_back_squat | eindeutig |
| programme/hybrid-gym-calisthenics.json → days[0].exercises[1] | Dips am Barren | — | nicht darstellbar |
| programme/hybrid-gym-calisthenics.json → days[0].exercises[2] | Kurzhantel-Schulterdrücken | — | nicht darstellbar |
| programme/hybrid-gym-calisthenics.json → days[0].exercises[3] | Ausfallschritte (KH) | — | nicht darstellbar |
| programme/hybrid-gym-calisthenics.json → days[0].exercises[4] | Kurzhantel-Seitheben | — | nicht darstellbar |
| programme/hybrid-gym-calisthenics.json → days[0].exercises[5] | Plank | plank | eindeutig |
| programme/hybrid-gym-calisthenics.json → days[1].exercises[0] | Kreuzheben | — | nicht darstellbar |
| programme/hybrid-gym-calisthenics.json → days[1].exercises[1] | Klimmzüge | pull_up_added_load | eindeutig |
| programme/hybrid-gym-calisthenics.json → days[1].exercises[2] | Kurzhantel-Rudern einarmig | one_arm_dumbbell_row | eindeutig |
| programme/hybrid-gym-calisthenics.json → days[1].exercises[3] | Step-ups mit Kurzhanteln | — | nicht darstellbar |
| programme/hybrid-gym-calisthenics.json → days[1].exercises[4] | Face Pulls am Kabel | — | nicht darstellbar |
| programme/hybrid-gym-calisthenics.json → days[1].exercises[5] | Pallof Press | — | nicht darstellbar |
| programme/hybrid-gym-calisthenics.json → days[2].exercises[0] | Bankdrücken | — | nicht darstellbar |
| programme/hybrid-gym-calisthenics.json → days[2].exercises[1] | Bulgarian Split Squats | — | nicht darstellbar |
| programme/hybrid-gym-calisthenics.json → days[2].exercises[2] | Rudern an der Stange | — | nicht darstellbar |
| programme/hybrid-gym-calisthenics.json → days[2].exercises[3] | Pike Liegestütze | — | nicht darstellbar |
| programme/hybrid-gym-calisthenics.json → days[2].exercises[4] | Wadenheben stehend | — | nicht darstellbar |
| programme/hybrid-gym-calisthenics.json → days[2].exercises[5] | Hollow Body Hold | — | nicht darstellbar |

## Konsequenz für die produktive Erweiterung

- Klimmzug-Maschine: Unterstützung ist nicht durch ein optionales ID-Feld allein abwärtskompatibel. Alte App-Versionen würden sie weiterhin als normales Gewicht verwenden. Erst einen Erfassungs-/Austauschvertrag mit Schutz für ältere Versionen festlegen.
- Couch Stretch: Seitenzählung für neue Vorgaben klar festlegen, Altwerte ohne Seitenkennzeichen separat erhalten.
- Gewichtskonventionen und Gerätevarianten historischer Sätze bleiben unbestätigt. Rohwerte weder verdoppeln noch umrechnen; bestätigte Neuvorgaben ändern keine Vergangenheit.
- Die übrigen 188 Bibliothekseinträge benötigen geprüfte Definitionen, bevor die vollständige Migration geplant wird. Kein automatisches Auffüllen anhand von Namen, Equipment oder Muskelgruppen.
- Dieser Prototyp stellt nur Satzwerte dar. Keine automatische Progression, 1RM-, Volumen- oder Trendberechnung wird in die App eingebaut.

Erneut erzeugen: `node docs/prototyp/uebungsdatenbank/analyse.cjs`. Der Befehl schreibt keinen Bestand um; die Berichtsausgabe erfolgt ausschließlich auf stdout.
