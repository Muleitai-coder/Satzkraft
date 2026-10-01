# Satzkraft – Fachkonzept Übungsdatenbank und Übungsdetail

> **Status: Arbeitsentwurf, noch nicht verbindlich und nicht zur Umsetzung freigegeben.**
>
> Dieses Dokument dient der fachlichen Klärung vor einem späteren Coding-Briefing. Es beschreibt Produktentscheidungen, ein vorgeschlagenes Datenmodell, Bedienabläufe und Prüffälle. Verbindliche Regeln entstehen erst nach der gemeinsamen Abnahme und Übernahme in das aktive Produktbriefing beziehungsweise ein Umsetzungsbriefing.

Stand: 09.08.2026

## 1. Zielbild

Satzkraft soll eine verlässliche Übungsbibliothek besitzen, die drei Anforderungen gleichzeitig erfüllt:

1. **Einfach:** Beim Trainieren und Erstellen eines Plans werden nur Angaben gezeigt oder abgefragt, die in diesem Moment helfen.
2. **Flexibel:** Kraft-, Körpergewichts-, Zeit-, Skill-, Mobilitäts- und später Cardioübungen lassen sich mit einer gemeinsamen, erweiterbaren Struktur abbilden.
3. **Fachlich belastbar:** Trainerlogik, Coach-Auswahl, Progression, Übungstausch, Verlauf und spätere Muskelauswertungen arbeiten mit standardisierten statt frei formulierten Metadaten.

Das Ziel ist keine möglichst große Menge an Daten. Jedes Pflichtfeld braucht mindestens einen konkreten Anwendungsfall in Suche, Editor, Training, Import, Coach, Tausch, Verlauf oder Auswertung.

## 2. Bereits getroffene Produktentscheidungen

| Frage | Entscheidung |
|---|---|
| Persönliche Übungsbibliothek | Eigene Übungen werden dauerhaft lokal gespeichert und in das vollständige Backup aufgenommen. |
| Integrierte Übungen bearbeiten | Integrierte Satzkraft-Übungen sind unveränderlich. Sie können als persönliche Variante dupliziert werden. |
| Tausch mit anderer Erfassungsart | Erlaubt, solange für die Übung in der aktuellen Einheit noch kein Satzwert eingetragen wurde. Die App erklärt die Änderung und passt die Satzfelder sichtbar an. |
| Muskel- und Bewegungsdaten | Zunächst intern für Suche, Prüfung, Coach und Tausch. Später Grundlage für eine optionale erweiterte Anzeige und Auswertung. |
| Unbekannte Übung beim JSON-Import | Keine stille automatische Anlage. Der Nutzer ordnet sie einer vorhandenen Übung zu, legt sie bewusst als eigene Übung an oder entfernt sie. |
| Übungsdetail | Antippen des Übungsnamens öffnet eine vereinfachte Vollbildansicht mit Leistung, Verlauf und wirklich hilfreichem Übungswissen. |
| Arbeitsorganisation | Konzeptphase im bestehenden Arbeitsstand. Separate Worktrees erst für später parallelisierbare Umsetzungspakete. |

## 3. Fachlicher Grundsatz: drei getrennte Ebenen

Die Übungsdatenbank darf nicht mit Trainingsvorgaben und protokollierten Leistungen vermischt werden.

### 3.1 Übungsstammdaten

Allgemeine Eigenschaften einer Bewegung:

- stabile Identität und Namen,
- Übungsart und Rolle,
- Bewegungsmuster und Zielbereiche,
- benötigtes Equipment,
- Erfassungs- und Gewichtskonvention,
- Standardprogression,
- Schwierigkeit,
- Technik und Übungsbeziehungen.

### 3.2 Trainingsvorgabe

Angaben für ein bestimmtes Programm, eine Woche oder eine Einheit:

- Trainingsgruppe,
- Sätze,
- Wiederholungs- oder Zeitbereich,
- RIR,
- Satzpause,
- Startgewicht und Steigerungsschritt,
- Reihenfolge,
- planbezogener Hinweis oder Technik-Cue.

Diese Werte dürfen Stammdaten überschreiben oder ergänzen, ohne die Übung selbst zu verändern.

### 3.3 Trainingsleistung

Was tatsächlich ausgeführt wurde:

- Wiederholungen, Zeit und später gegebenenfalls Distanz,
- Gewicht, Zusatzgewicht oder Unterstützung,
- verwendete Ersatzübung,
- Satz- und Einheitendaten,
- persönliche Notiz,
- später optional Ist-RIR.

Vergangene Leistungen bleiben unter der damals ausgeführten Übungsidentität erhalten.

## 4. Pflichtstufen statt unnötiger Felder

### 4.1 Technisch unverzichtbar

Ohne diese Angaben kann eine Übung nicht sicher gespeichert oder protokolliert werden:

- stabile `id`,
- deutscher Anzeigename,
- Herkunft `built_in` oder `custom`,
- primärer Messwert,
- Belastungsart,
- Gewichtskonvention, falls Gewicht erfasst wird,
- Seitigkeit und Zählweise,
- Standardprogression.

### 4.2 Für die integrierte Bibliothek fachlich verpflichtend

Alle von Satzkraft ausgelieferten Übungen benötigen zusätzlich:

- englischen Namen,
- standardisierte Aliasse, soweit gebräuchlich,
- Domäne und Übungsrolle,
- primäres Bewegungsmuster,
- mindestens einen primären Zielmuskel beziehungsweise bei Mobilität/Cardio eine Zielregion,
- standardisiertes Equipment,
- Schwierigkeitsstufe,
- kurzen Technikhinweis,
- mindestens eine bewusst geprüfte Ersatzbeziehung oder die explizite Kennzeichnung, dass keine sichere Standardalternative gepflegt ist.

### 4.3 Für persönliche Übungen

Persönliche Übungen müssen ebenfalls coach- und verlaufsfähig angelegt werden, aber der Nutzer bearbeitet keine technischen Rohwerte. Die App fragt in Alltagssprache ab und erzeugt daraus:

- Namen,
- Erfassungsart,
- Gewichtskonvention,
- Seitigkeit,
- Equipment,
- primären Zielbereich,
- grobe Schwierigkeit.

Bewegungsmuster und Standardprogression werden aus diesen Antworten vorgeschlagen und vor dem Speichern verständlich zusammengefasst. Technik, Video, sekundäre Muskeln und Ersatzübungen bleiben optional.

## 5. Vorgeschlagenes Stammdatenschema

Die Feldnamen sind Vorschläge und werden erst im Coding-Briefing technisch festgelegt.

### 5.1 Identität

| Feld | Regel | Sichtbarkeit/Nutzen |
|---|---|---|
| `id` | unveränderlich und eindeutig, z. B. `barbell_bench_press` oder `custom_a7f3k2` | nie sichtbar; Verläufe, JSON, Beziehungen, Umbenennung |
| `origin` | `built_in` oder `custom` | intern; bestimmt Bearbeitbarkeit |
| `name.de` | Pflicht | überall sichtbarer Hauptname |
| `name.en` | Pflicht für integrierte, optional für persönliche Übungen | Suche und Detail |
| `aliases` | eindeutige normalisierte Liste | Suche, Altprogramm-Auflösung |

Die ID ist maßgeblich. Namen dürfen geändert oder ergänzt werden, ohne dass eine neue Übung entsteht.

### 5.2 Fachliche Einordnung

| Feld | Vorgeschlagene Werte | Nutzen |
|---|---|---|
| `domain` | `strength`, `skill`, `mobility`, `cardio` | grobe Bibliotheks- und Editorlogik |
| `role` | `compound`, `accessory`, `isolation`, `skill`, `mobility`, `cardio` | Reihenfolge, Coach, Planprüfung |
| `movement.primary` | kontrollierter Schlüssel, z. B. `horizontal_push`, `squat`, `hinge`, `carry`, `anti_rotation` | Balance, Suche, Tausch |
| `movement.secondary` | optionale Liste weiterer Muster | genauere Einordnung |
| `difficulty` | `beginner`, `intermediate`, `advanced` | Coach-Auswahl und Bibliotheksfilter |

Die Schwierigkeit beschreibt technische und koordinative Anforderungen, nicht die Stärke des Nutzers und keine medizinische Eignung.

### 5.3 Zielmuskeln und Zielregionen

| Feld | Regel | Nutzen |
|---|---|---|
| `targets.primaryMuscles` | bei Kraftübungen mindestens ein standardisierter Muskelgruppen-Schlüssel | Coach, Planprüfung, spätere Auswertung |
| `targets.secondaryMuscles` | optional | genauere spätere Auswertung |
| `targets.regions` | bei Mobilität/Cardio mindestens eine standardisierte Körper- oder Gelenkregion | Suche, Coach, Detailansicht |

Primäre und sekundäre Muskeln dürfen später unterschiedlich gewichtet werden. Diese Gewichtung ist nicht Teil der ersten sichtbaren Auswertung und erfordert vor Umsetzung eine eigene fachliche Entscheidung.

### 5.4 Equipment

Freitext wird durch kontrollierte Equipment-Schlüssel ersetzt, beispielsweise:

- `barbell`, `dumbbell`, `kettlebell`,
- `flat_bench`, `incline_bench`, `rack`,
- `cable`, `machine`, `resistance_band`,
- `pullup_bar`, `rings`, `suspension_trainer`,
- `box`, `wall`, `mat`, `none`.

Vorgeschlagene Struktur:

- `equipment.required`: tatsächlich benötigte Ausstattung,
- `equipment.alternatives`: ausdrücklich gleichwertige Alternativen, etwa Box oder Bank,
- `equipment.context`: optionaler kurzer sichtbarer Hinweis, wenn Gerätewerte zwischen Studios nicht direkt vergleichbar sind.

Eine Übungs-ID steht grundsätzlich für eine konkrete Variante. Wesentlich andere Geräte oder Ausführungen erhalten eigene IDs und werden über Beziehungen verbunden.

### 5.5 Erfassungsmodell

| Feld | Werte | Wirkung |
|---|---|---|
| `tracking.metric` | zunächst `reps`, `seconds`; vorbereitet für `distance` | bestimmt das primäre Satzfeld |
| `tracking.loadMode` | `none`, `external`, `added`, `assistance` | bestimmt, ob und wie Gewicht erfasst wird |
| `tracking.loadEntry` | `not_applicable`, `total`, `per_implement`, `per_side`, `machine_display` | erklärt den einzutragenden Wert |
| `tracking.laterality` | `bilateral`, `unilateral_each_side`, `alternating`, `single_side` | Anzeige und Satzlogik |
| `tracking.repCounting` | `total` oder `per_side` | verhindert unklare Wiederholungsangaben |

Beispiele:

- Langhantel-Kniebeuge: `reps + external + total + bilateral`.
- Kurzhantel-Bankdrücken: `reps + external + per_implement + bilateral`.
- Klimmzug mit Zusatzgewicht: `reps + added + total + bilateral`.
- Klimmzugmaschine: `reps + assistance + machine_display + bilateral`; kleinere Zahl bedeutet schwerer.
- Ausfallschritt: `reps + external/none + passend + unilateral_each_side + per_side`.
- Plank: `seconds + none + not_applicable + bilateral`.
- Suitcase Carry: `seconds + external + per_implement + single_side`.

Das bisherige Sonderfeld `weightedTime` wird dadurch überflüssig. Ebenso wird `einseitig:true` durch eine genauere Seitigkeits- und Zählregel ersetzt.

### 5.6 Progression

| Feld | Werte | Beispiel |
|---|---|---|
| `progression.primary` | `load`, `reps`, `duration`, `distance`, `variant`, `reduce_assistance`, `none` | Hauptregel für Empfehlungen |
| `progression.secondary` | optionaler zweiter Mechanismus | Carry: erst Zeitbereich, dann Gewicht |

Die Datenbank liefert eine fachlich passende Standardprogression. Der konkrete Trainingsplan darf sie überschreiben.

### 5.7 Technik und Medien

| Feld | Regel |
|---|---|
| `technique.cue` | kurzer, verständlicher Pflichttext für integrierte Übungen |
| `technique.setup` | optionaler Aufbau-/Einstellungshinweis |
| `technique.commonMistakes` | optionale kurze Liste |
| `media.videoQuery` | optionaler Suchbegriff; kein unkontrolliert eingebetteter Fremdinhalt |

Keine Diagnosen, Therapieempfehlungen oder pauschalen medizinischen Verbote in den Stammdaten.

### 5.8 Übungsbeziehungen

Das heutige einzelne Feld `ersatz` wird zu einer Liste strukturierter Beziehungen:

```json
{
  "exerciseId": "band_assisted_pull_up",
  "relation": "equipment_alternative",
  "direction": "easier"
}
```

Vorgeschlagene Relationstypen:

- `equivalent`,
- `equipment_alternative`,
- `easier`,
- `harder`,
- `progression_step`,
- `regression_step`.

Ob ein Tausch dieselben Satzfelder verwenden kann, wird aus dem Erfassungsmodell abgeleitet. Eine fachlich gute Alternative darf eine andere Erfassungsart besitzen.

## 6. Anzeige- und Nutzungsmatrix

| Information | Training | Bibliothek/Suche | Übungsdetail | Editor | interne Nutzung |
|---|---:|---:|---:|---:|---:|
| Name | ja | ja | ja | ja | Matching |
| Equipment | nur wichtiger Eingabehinweis | ja | ja | Zusammenfassung | Filter/Coach/Tausch |
| Erfassungsart | über Satzfelder | ja | ja | ja | Protokoll/Import |
| Gewichtskonvention | ja | optional | ja | ja | Vergleichbarkeit |
| Seitigkeit/Zählweise | ja | optional | ja | ja | Satzlogik |
| Bewegungsmuster | nein | kompakt/Filter | ja | automatisch | Planprüfung/Tausch |
| primäre Muskeln/Regionen | nein | kompakt/Filter | ja | Auswahl bei eigener Übung | Coach/spätere Auswertung |
| sekundäre Muskeln | nein | nein | optional | erweitert | spätere Auswertung |
| Schwierigkeit | nein | Filter/Badge | ja | bei eigener Übung | Coach |
| Progression | Empfehlung statt Schlüssel | nein | verständlicher Hinweis | erweitert | Empfehlungen |
| Technik | kurzer Hinweis | Vorschau optional | ja | optionaler Plan-Cue | Information |
| Ersatzbeziehungen | Tauschdialog | nein | ja | erweitert | Tausch/Coach |
| technische ID | nein | nein | nein | nein | überall intern |

## 7. Übungsdetailansicht

### 7.1 Einstieg und Verhalten

- Der Übungsname ist in Trainingskarte, kompakter Tagesansicht, Bibliothek, Auswertung und Protokoll antippbar.
- Die Ansicht öffnet als eigene Vollbildoberfläche im bestehenden Satzkraft-Design.
- Schließen führt exakt zum vorherigen Kontext zurück.
- Laufende Trainingszeit, Satzpause und Halte-Timer werden durch das Öffnen nicht pausiert.
- Ein einziger Detailbaustein wird kontextabhängig wiederverwendet; keine getrennten Informationswelten für Training, Bibliothek und Auswertung.

### 7.2 Navigation

Zwei Bereiche genügen:

1. **Übersicht** – Leistung, Empfehlung und Übungswissen.
2. **Verlauf** – chronologische Einheiten und Satzwerte.

Mehrere Statistik-, Rekord-, Medien- oder Muskel-Tabs sind zunächst nicht vorgesehen.

### 7.3 Übersicht

Reihenfolge:

1. letzte protokollierte Leistung,
2. aktuelle typgerechte Empfehlung, falls belastbar,
3. kompakter Verlauf der letzten Einheiten,
4. ein typgerechter persönlicher Bestwert,
5. Ausführung und Metadaten,
6. Video und passende Alternativen.

Typgerechte Hauptwerte:

| Erfassungsart | Hauptwert/Bestwert |
|---|---|
| Gewicht + Wiederholungen | bestes nachvollziehbares Satzgewicht mit Wiederholungen |
| Körpergewicht | höchste saubere Wiederholungszahl |
| Zusatzgewicht | höchstes Zusatzgewicht mit zugehörigen Wiederholungen |
| Unterstützung | geringste Unterstützung mit zugehörigen Wiederholungen |
| Zeit | längste Zeit |
| Gewicht + Zeit | zusammengehöriges Paar aus Gewicht und Zeit; kein undurchsichtiger Mischscore |
| später Cardio | typabhängig Zeit, Distanz oder Tempo |

Geschätztes 1RM, Strength Level, soziale Vergleiche, Ranglisten und mehrere gleichzeitig konkurrierende Rekorde sind kein Bestandteil der ersten Ausbaustufe.

### 7.4 Verlauf

Jeder Eintrag zeigt:

- Datum,
- Programm, Woche und Trainingstag,
- Satzwerte in der damaligen Erfassungsart,
- Tauschkennzeichnung, falls zutreffend,
- persönliche Notiz, falls vorhanden.

Antippen öffnet das vollständige Trainingsprotokoll der Einheit.

### 7.5 Übungswissen

Sichtbar, aber kompakt:

- benötigtes Equipment,
- primäre Zielmuskeln oder Zielregion,
- Bewegungsmuster,
- Schwierigkeit,
- eindeutige Eingabekonvention,
- Technik-Cue und optional Setup/Fehler,
- Video,
- fachlich passende Alternativen.

Interne IDs, Rohschlüssel, Metadatenversionen und für den Nutzer bedeutungslose Tags bleiben verborgen.

## 8. Persönliche Übungen

### 8.1 Speicherung

- Persönliche Übungen liegen getrennt von den integrierten 200 Übungen im lokalen App-Zustand.
- Sie erhalten automatisch eine stabile `custom_...`-ID.
- Programme verweisen auf diese ID.
- Vollständiges Backup und Wiederherstellung umfassen persönliche Übungen.
- Ein Programmexport mit persönlicher Übung enthält zusätzlich die notwendige Übungsdefinition, damit sie auf einem anderen Gerät bewusst importiert werden kann.

### 8.2 Bearbeitungsregeln

- Integrierte Übung: nur ansehen oder „Als eigene Variante duplizieren“.
- Persönliche Übung ohne Verlauf: alle Stammdaten bearbeitbar.
- Persönliche Übung mit Verlauf: Name, Technik, Aliasse und optionale Informationen dürfen aktualisiert werden.
- Änderung von Erfassungsart, Gewichtskonvention oder grundlegender Identität erzeugt eine neue Variante mit neuer ID; der bestehende Verlauf bleibt bei der alten Übung.
- Löschen einer persönlichen Übung mit Verlauf bedeutet Archivieren, nicht Entfernen der Historie.

## 9. Benutzerfreundlicher Editor

### 9.1 Bekannte Übung hinzufügen

1. „Übung hinzufügen“ öffnet zuerst die Bibliothekssuche.
2. Treffer zeigen Name, Equipment, primären Zielbereich und Erfassungsart.
3. Optionale Filter: Equipment und Zielbereich; keine Taxonomie-Rohwerte.
4. Auswahl übernimmt alle Stammdaten über die Übungs-ID.
5. Danach bearbeitet der Nutzer nur die Vorgabe im aktuellen Plan.

Die Trainingsgruppe wird passend vorgeschlagen. Der Nutzer kann sie ändern, muss das Gruppensystem aber nicht verstehen, um eine Übung korrekt hinzuzufügen.

### 9.2 Vorgabe einer bekannten Übung

Im einfachen Bereich:

- Sätze,
- Wiederholungen oder Zeit,
- Startgewicht beziehungsweise Unterstützung,
- gegebenenfalls RIR oder Satzpause.

Unter „Weitere Einstellungen“:

- Plan-Cue,
- Progressions-Override,
- eigene Satzpause,
- Ersatzpräferenz,
- weitere heute bereits vorhandene Spezialfelder.

Bibliotheksstammdaten werden nur zusammengefasst, nicht als editierbare Formularwand wiederholt.

### 9.3 Eigene Übung erstellen

Geführte Fragen in Alltagssprache:

1. „Wie heißt die Übung?“
2. „Was trägst du pro Satz ein?“ – Wiederholungen, Zeit, Gewicht + Wiederholungen, Gewicht + Zeit; später Distanz.
3. Nur bei Gewicht: „Welches Gewicht trägst du ein?“ – gesamt, eine Hantel, je Seite, Zusatzgewicht oder Unterstützung.
4. „Wie wird die Übung ausgeführt?“ – gemeinsam, je Seite, abwechselnd oder nur eine Seite.
5. „Was brauchst du dafür?“ – suchbare Equipment-Chips.
6. „Was trainiert die Übung hauptsächlich?“ – verständliche Zielbereiche.
7. „Wie anspruchsvoll ist die Technik?“ – Einsteiger, Erfahrung hilfreich, anspruchsvoll.

Die App zeigt danach eine kurze Zusammenfassung und einen vorgeschlagenen Progressionsweg. Technik, Video, sekundäre Ziele und Alternativen sind freiwillig unter „Details ergänzen“.

### 9.4 Zwei getrennte Bearbeitungsaktionen

- **„Vorgabe in diesem Plan bearbeiten“** verändert Sätze, Wiederholungen, RIR, Gewicht und Pause.
- **„Übungsdaten bearbeiten“** erscheint nur bei persönlichen Übungen und verändert die Stammdaten.

Diese Trennung schützt Verlauf und verhindert, dass Nutzer unbemerkt eine Übung in eine andere umdeuten.

## 10. JSON-Import und Qualitätsprüfung

### 10.1 Referenz bekannter Übungen

Neue Exporte enthalten zusätzlich eine stabile ID:

```json
{
  "exerciseId": "barbell_bench_press",
  "name": "Bankdrücken",
  "category": "kraft",
  "weighted": true,
  "increment": 2.5,
  "startWeight": 40
}
```

`exerciseId` ist maßgeblich, `name` bleibt menschenlesbar und dient als Fallback für alte Apps beziehungsweise alte Dateien.

### 10.2 Abwärtskompatibilität

1. Bekannte ID: Stammdaten aus der Bibliothek verwenden.
2. Keine ID, aber eindeutiger Name oder Alias: ID automatisch ergänzen und in der Vorschau als Vereinheitlichung nennen.
3. ID und Name widersprechen sich: ID gewinnt, Widerspruch sichtbar machen.
4. Unbekannter Name: Reparaturansicht statt stiller Standardannahme.
5. Alte `trainings-block`-v2-Dateien bleiben ladbar; neue Felder werden zunächst optional und abwärtskompatibel ergänzt.

Ob langfristig eine neue Austauschformat-Version nötig wird, wird erst nach dem Schema-Prototyp entschieden.

### 10.3 Persönliche Übung im Programmexport

Eine persönliche Übung benötigt neben der Referenz eine eingebettete Definition. Beim Import wird sie nicht automatisch gespeichert. Die Vorschau zeigt:

- Name und Herkunft,
- Erfassungsart,
- Equipment und Zielbereich,
- mögliche Übereinstimmungen mit vorhandenen Übungen,
- Aktion „Als eigene Übung übernehmen“.

### 10.4 Drei Prüfstufen

#### Fehler – Import blockieren

- Übung nicht auflösbar und keine bestätigte persönliche Definition,
- fehlende oder widersprüchliche Erfassungsart,
- Gewicht ohne passende Gewichtskonvention,
- ungültige Seitigkeit/Zählweise,
- Timer ohne passende Zeitvorgabe,
- Progression unvereinbar mit den Satzfeldern,
- weder direkte noch geerbte Satz-/Wiederholungs-/Zeitvorgabe.

#### Warnung – bewusste Prüfung, Import grundsätzlich möglich

- doppelte Übung am selben Tag,
- kein gepflegter Ersatz,
- auffällige Übungsreihenfolge oder auffälliges Volumen,
- Übungsschwierigkeit passt möglicherweise nicht zum angegebenen Level,
- benötigtes Equipment passt möglicherweise nicht zum Coach-Briefing.

Warnungen dürfen nicht als scheinbar objektive medizinische oder sportwissenschaftliche Verbote formuliert werden.

#### Automatische, sichtbare Vereinheitlichung

- Alias auf kanonische ID und Namen abbilden,
- alte Namen aktualisieren,
- `time` als `seconds` übernehmen,
- eindeutig migrierbare Altfelder in das neue Erfassungsmodell übersetzen.

### 10.5 Reparaturansicht

Bei einer unbekannten Übung stehen genau drei Wege zur Verfügung:

1. „Vorhandene Übung auswählen“,
2. „Als eigene Übung anlegen“,
3. „Aus dem Plan entfernen“.

Die App zeigt immer Tag, Übungsname und betroffenen JSON-Pfad. Andere valide Inhalte des Imports bleiben erhalten.

## 11. Tausch mit anderer Erfassungsart

Beispiel Latzug → Band-Klimmzüge:

1. Die Beziehung ist fachlich als Alternative gepflegt.
2. Die App erkennt unterschiedliche Satzfelder.
3. Vor der ersten Eingabe erscheint: „Die Ersatzübung verwendet Wiederholungen ohne Maschinengewicht. Die Satzfelder werden angepasst.“
4. Nach Bestätigung erhält die Ersatzübung ihre eigene Erfassungsart und einen eigenen Verlauf.
5. Nach der ersten Satzangabe ist der Tausch für die aktuelle Einheit fest.

Ein direkter Tausch ohne Hinweis ist nur zulässig, wenn Messwert, Belastungsart, Gewichtskonvention und Zählweise kompatibel sind.

## 12. Prüfung an zwölf Referenzübungen

Diese Fälle bilden die Mindestabdeckung des späteren Schemas und der Bedienabläufe:

| # | Referenzübung | Kritischer Modellfall | Erwartete Kerndaten |
|---:|---|---|---|
| 1 | Langhantel-Kniebeuge | klassische gewichtete Grundübung | Reps, externes Gesamtgewicht, bilateral, Squat, Lastprogression |
| 2 | Kurzhantel-Bankdrücken | zwei Hanteln, aber Eingabe pro Hantel | Reps, extern, pro Gerät, bilateral, horizontaler Druck |
| 3 | Beinpresse | maschinenabhängiger Anzeigewert | Reps, extern, Maschinenanzeige, Gerätehinweis |
| 4 | Klimmzüge mit Zusatzgewicht | Körpergewicht plus Last | Reps, Zusatzgewicht, bilateral, Lastprogression |
| 5 | Klimmzugmaschine mit Gegengewicht | kleinere Last ist schwerer | Reps, Unterstützung, Maschinenanzeige, Unterstützung reduzieren |
| 6 | Kurzhantel-Rudern einarmig | je Seite und pro Hantel | Reps je Seite, extern pro Gerät, einseitig |
| 7 | Plank | reine Ziel- oder Maximalzeit | Sekunden, keine Last, Timer-Modus, Zeitprogression |
| 8 | Suitcase Carry | Gewicht plus Zeit und eine Seite | Sekunden, extern pro Gerät, einzelne Seite, zweistufige Progression |
| 9 | Burpees | Ganzkörper-Reps ohne Last | Reps, Körpergewicht, Gesamtzählung, Kondition |
| 10 | Handstand halten | Skill statt Laststeigerung | Sekunden, Skill, Variantenprogression |
| 11 | Couch Stretch | Mobilität je Seite | Sekunden je Seite, Zielregion Hüftbeuger, keine Leistungswertung wie Kraftübung |
| 12 | Laufband | späterer Cardio-Ausbau | Zeit und vorbereitet Distanz/Tempo; keine Kraftvolumenlogik |

### 12.1 Vorläufiges Ergebnis der Referenzprüfung

- Das vorgeschlagene Erfassungsmodell deckt alle heutigen Typen ohne Sonderfelder wie `weightedTime` ab.
- Unterstützung benötigt eine eigene Belastungsart, weil eine Verringerung schwerer statt leichter wird.
- „Pro Hantel“, „gesamt“ und „Maschinenanzeige“ müssen getrennt sein, sonst sind Verläufe missverständlich.
- Zeit + Gewicht benötigt zwei Progressionsdimensionen; ein einzelner Progressionswert reicht für Carries nicht immer.
- Mobilität und Cardio dürfen nicht dieselben Bestwert- und Volumenregeln wie Kraftübungen erhalten.
- Distanz ist noch kein heutiges Satzkraft-Eingabefeld, sollte aber im Schema nicht verbaut werden.

## 13. Nicht-Ziele der ersten Umsetzung

- keine medizinische Eignungs- oder Verletzungsdiagnostik,
- keine automatische Therapie- oder Reha-Auswahl,
- keine soziale Übungsstatistik oder Rangliste,
- keine Strength-Level-Vergleiche,
- keine komplexe Muskelgrafik in der ersten Oberfläche,
- keine vollständige Cardio-Plattform,
- keine Bearbeitung der integrierten Bibliothek durch Nutzer,
- keine verpflichtenden Tempo-, ROM- oder RPE-Felder ohne konkreten Produktnutzen,
- kein Framework- oder Cloud-Umbau.

## 14. Vorgeschlagene Arbeitsphasen

### Phase A – Fachkonzept abnehmen

- Feldkatalog und erlaubte Werte bestätigen,
- Referenzübungen vervollständigen,
- Detailansicht und Editorabläufe als Text/Wireframe abnehmen,
- Import- und Migrationsregeln entscheiden.

### Phase B – Datenprototyp

- zwölf Referenzübungen in einem isolierten Beispieldatensatz modellieren,
- Validierungsregeln gegen diese Fälle entwerfen,
- alte Felder eindeutig auf neue Felder abbilden,
- offene Sonderfälle dokumentieren.

### Phase C – verbindliches Coding-Briefing

- Datenmigration,
- persönliche Bibliothek,
- Import/Export,
- Übungsdetail,
- Editor,
- Tausch/Progression,
- Tests und Abnahme in getrennte Pakete schneiden.

### Phase D – Umsetzung mit Worktrees

Worktrees sind erst hier sinnvoll. Mögliche unabhängige Stränge nach festgelegten Verträgen:

1. **Daten und Migration** – Bibliotheksschema, IDs, 200 Einträge, Validierung.
2. **Import und persönliche Bibliothek** – Auflösung, Reparatur, Backup.
3. **Übungsdetail und Editor-UX** – Oberflächen auf Basis des feststehenden Schemas.

Zusammenführung erst nach Vertrags- und Migrationstests. Progressionslogik bleibt ein besonders sensibler gemeinsamer Bereich und wird nicht parallel widersprüchlich geändert.

## 15. Noch offene Konzeptentscheidungen

Diese Punkte werden vor dem Coding-Briefing geklärt:

1. abschließende Liste der Bewegungsmuster und Muskelgruppen,
2. genaue Darstellung einer Muskelbeteiligung ohne falsche wissenschaftliche Präzision,
3. ob persönliche Übungen zwingend eine Technikangabe benötigen,
4. wie Maschinenvarianten zwischen verschiedenen Studios getrennt oder gekennzeichnet werden,
5. ob `distance` schon in der ersten Datenmigration oder nur als reservierte spätere Erweiterung enthalten ist,
6. welche eine Kennzahl pro Übungstyp im kompakten Diagramm verwendet wird,
7. wie stark der Import sportfachliche Warnungen aussprechen darf, ohne individuelle Trainerentscheidungen zu blockieren,
8. ob eine Ersatzbeziehung gerichtet oder automatisch in beide Richtungen ergänzt wird,
9. ob integrierte Übungen ohne sinnvolle Standardalternative ausdrücklich `no_default_substitute` tragen.

## 16. Fachliche Quellen und Produktreferenz

- American College of Sports Medicine: *Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews*, 2026, <https://pubmed.ncbi.nlm.nih.gov/41843416/>.
- Lovegrove et al.: *Repetitions in Reserve Is a Reliable Tool for Prescribing Resistance Training Load*, 2022, <https://pubmed.ncbi.nlm.nih.gov/36135029/>.
- Hughes et al.: *Estimating Repetitions in Reserve in Four Commonly Used Resistance Exercises*, <https://pubmed.ncbi.nlm.nih.gov/33337690/>.
- Hevy: öffentlich dokumentierte Übungsbibliothek und typabhängige Übungsverläufe als Produktreferenz, nicht als zu kopierende Vollfunktion, <https://www.hevyapp.com/features/exercise-library/> und <https://help.hevyapp.com/hc/en-us/articles/35382889578135-Exercise-Performance-Tracking-in-Library-Weight-Bodyweight-Cardio-and-Duration-Based-Exercises>.
