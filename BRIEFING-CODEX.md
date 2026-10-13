# Satzkraft – aktives Produkt- und Architekturbriefing

- Stand: 12.10.2026
- Veröffentlichter Stand: v0.33.4
- Arbeitsstand: v0.33.4 + Unreleased (API-Coach entfernt; Fensterschutz; Zeit mit Gewicht korrekt; optionale Übungszuordnungen)

Dieses Dokument ist die kurze, verbindliche Quelle für den aktuellen Stand. Die vollständige frühere Spezifikations- und Entscheidungshistorie liegt unter [`docs/historie/BRIEFING-CODEX-BIS-v0.32.0.md`](docs/historie/BRIEFING-CODEX-BIS-v0.32.0.md) und ist nicht mehr normativ.

## 1. Quellen und Priorität

Bei Widersprüchen gilt diese Reihenfolge:

1. die neueste ausdrückliche Entscheidung des Produktverantwortlichen,
2. dieses aktive Briefing,
3. `AGENTS.md`, `docs/DESIGN-BRIEFING.md` und `docs/TESTING.md` für Arbeitsweise, Gestaltung und Tests,
4. aktuelle Referenzdokumente und `CHANGELOG.md`,
5. historische Pläne, Testberichte und das archivierte Briefing nur als Kontext.

Keine Anforderungen, Inhalte oder Geschäftslogik ergänzen, die aus diesen Quellen nicht belastbar hervorgehen. Unklare fachliche Punkte sichtbar lassen und mit einer konkreten Entscheidungsempfehlung dokumentieren.

## 2. Produkt und Einsatz

Satzkraft ist eine deutschsprachige, mobile-first Krafttrainings-PWA ohne Konto und Abo. Hauptablauf: Programm wählen oder erstellen, nächste Einheit im Wochenplan öffnen, Training durchführen, Sätze erfassen, Empfehlungen erhalten und den Verlauf auswerten.

Der aktuelle Link wird im privaten Bekanntenkreis geteilt und ist damit extern erreichbar, aber nicht als breite oder kommerzielle Veröffentlichung vorgesehen. Ein Impressum ist nach aktueller Produktentscheidung kein Arbeitspunkt. Diese Festlegung ist keine allgemeine rechtliche Bewertung; vor einer breiten öffentlichen oder kommerziellen Veröffentlichung müssen Impressum, Datenschutzhinweise und Anbieterpflichten erneut fachlich geprüft werden.

### Daten und KI

- Programme, Trainingswerte, Protokolle und Einstellungen liegen ohne Konto im Browser.
- Der zentrale App-Zustand verwendet weiterhin `localStorage` mit Schlüssel `cali-plan-v3` und `DATA_SCHEMA_VERSION` 4.
- **Produktentscheidung 11.10.2026:** Der integrierte KI-Coach einschließlich Wizard, API-Aufrufen und Netlify-Serverfunktion wird entfernt. Eine spätere einfachere KI-Lösung benötigt einen eigenen Auftrag.
- „ChatGPT & Co.“ bleibt als lokaler Prompt-/Exportweg mit geprüftem JSON-Import erhalten. Der Nutzer entscheidet selbst über die Weitergabe an eine externe KI; Satzkraft sendet keine Trainingsdaten an eine KI-API.
- Bestehende Programme mit historischer Herkunft `source: "coach"` und alte Backups bleiben kompatibel. Gespeicherte Coach-Antworten werden beim Start der aktualisierten App entfernt, sofern der Speicherzugriff erlaubt ist; eine Löschgeneration blockiert dabei bereits offene ältere Coach-Sitzungen.
- Alle lokalen Satzkraft-Daten können weiterhin abgesichert gelöscht werden. Die Komplettlöschung darf keine fremden Origin-Daten entfernen.
- Das Backup enthält Programme und Trainingsdaten, keinen Farbmodus und keine historischen Coach-Antworten.

## 3. Architektur und technische Leitplanken

### Kernstruktur

| Bereich | Verbindliche Rolle |
|---|---|
| `index.html` | App-Oberfläche, Styles und UI-Logik |
| `js/progression.js` | isolierte Progressions- und Empfehlungslogik |
| `sw.js` | Offline-Cache der statischen App-Ressourcen |
| `programme/*.json` | mitgelieferte Programme |
| `uebungen.json` | Übungsbibliothek und Austauschvorschläge |
| `tests/` | schnelle Node-Verhaltens- und Vertragsprüfungen |
| `qa/playwright/` | funktionale und visuelle Browserprüfungen |

### Guardrails

1. Die kompakte Ein-Datei-App bleibt bestehen. Kein Framework und keine Runtime-Abhängigkeiten einführen. Der Build ist nur ein abhängigkeitenfreies Kopieren der freigegebenen Veröffentlichungsdateien nach `dist/`.
2. Nutzertexte sind deutsch, in Du-Form, kurz und verständlich.
3. Dynamische HTML-Ausgaben über `esc()` beziehungsweise `attr()` absichern. Nutzereingaben und Importdaten validieren.
4. Datenkompatibilität erhalten: `cali-plan-v3`, Schema 4 und Austauschformat `trainings-block` Version 2 nicht brechen. Neue Felder bleiben optional und abwärtskompatibel.
5. `js/progression.js` ist fachlich sensibel. Nur bei bestätigten Rechen- oder Produktfehlern ändern und die Grenzfälle direkt testen; keine stilistischen Umbauten.
6. Von Tests verwendete String-Anker und Funktionsreihenfolgen in `index.html` nur ändern, wenn die betroffenen Tests bewusst mit angepasst werden.
7. Nutzerrelevante Änderungen unter `Unreleased` in `CHANGELOG.md` dokumentieren. Beim Release `APP_VERSION` und Service-Worker-Cache synchron erhöhen.
8. Änderungen nach `docs/TESTING.md` risikobasiert prüfen. Keine Prüfungen deaktivieren und keine fehlschlagenden Tests still entfernen.
9. Vorhandene, unfertige Änderungen bewahren. Ohne ausdrücklichen Auftrag weder committen noch pushen.

### Übungsdatenbank – bestätigter Prototypumfang

- **Produktentscheidung 11.10.2026:** Mit „ja bitte“ wurden D1–D8 der [Entscheidungsvorlage](docs/planung/UEBUNGSDATENBANK-ENTSCHEIDUNGSVORLAGE.md) und der isolierte Datenprototyp bestätigt. Der [Prototyp](docs/prototyp/uebungsdatenbank/README.md) ist lokal erstellt; dies ist keine Freigabe für produktive Migration, persönliche Bibliothek oder neue Oberflächen.
- Übungsidentität, Programmposition/Vorgabe und tatsächlich erfasste Leistung bleiben getrennt. Umbenennung und aktuelle Metadaten dürfen historische Log-Schlüssel oder Erfassungsregeln nicht überschreiben.
- Lastbedeutung und Eingabekonvention unterscheiden: externes Gewicht, Zusatzgewicht und Unterstützung; Gesamtgewicht, pro Hantel und Geräteanzeige. Unterstützung darf nicht durch gewöhnliche Laststeigerung ausgeführt werden. Alte Lastwerte nicht umrechnen.
- Für neue einseitige Vorgaben gilt ein Wert je Seite; keine erfundenen Links-/Rechtswerte. Fehlende historische Seiten-, Gewichts- oder Geräteinformation bleibt unbestätigt. Gerätevarianten nicht automatisch miteinander vergleichen.
- Zeit und Gewicht gemeinsam anzeigen, ohne universellen Bestwert. Mobilität/Cardio erhalten keine Kraftrekorde. Der Prototyp berechnet keine neuen Kennzahlen und wendet keine Progression an; bestehende Report- und Progressionslogik bleibt unverändert.
- Unbekannte oder widersprüchliche Übungen bewusst reparieren. Namen/Aliasse allein dürfen bei Mehrdeutigkeit keine Identität bestimmen. Ersatzbeziehungen sind gerichtet und ausdrücklich gepflegt; eine fehlende Standardalternative wird benannt.
- Erster Umfang: Wiederholungen und Sekunden, zwölf Referenzfälle und kleine kontrollierte Metadatenlisten. Technik persönlicher Übungen ist optional. Distanz, Tempo, Muskelgewichtung und getrennte Seitenwerte bleiben zurückgestellt. Keine KI-Anbindung oder KI-Pflichtfelder.
- Die Prototypdateien liegen ausschließlich unter `docs/prototyp/uebungsdatenbank/`; sie werden weder von der App noch vom Service Worker geladen oder veröffentlicht. `cali-plan-v3`, Schema 4 und `trainings-block` v2 bleiben unverändert. Unterstützung und verlustfreier Austausch mit älteren Apps benötigen vor produktiver Nutzung einen eigenen Vertrag.
- **Arbeitsstand 12.10.2026:** Mit „weiter machen“ wurden die [Import-/Export-/Migrationsverträge](docs/planung/UEBUNGSDATENBANK-VERTRAEGE.md) vorbereitet. Sieben neue isolierte Prüfungen am bestehenden Reader belegen Metadatenverlust, unwirksame Fähigkeitsmarker und die Grenzen des heutigen Backups. Als nächstes Umsetzungspaket ist C1 für optionale kompatible Übungsreferenzen beschrieben; C2/C3 und produktive Migration bleiben nachgelagerte Schritte. Keine neue Austausch- oder Speicherversion und keine neue App-Funktion in dieser Vertragsvorbereitung.
- **Umsetzungsauftrag 12.10.2026:** Das anschließende „ok weiter machen“ beauftragt C1. Zehn kompatible integrierte Übungen besitzen jetzt Bibliotheks-IDs; `exerciseId` bleibt optional und wird in Editor, v2-Import/-Export, Tausch/Folgeblock und Schema-4-Backup erhalten. Ein separater ID-Index und eine kleine synchron verfügbare Referenzliste prüfen bekannte Identität, Erfassung und Seitenregel, auch vor dem Bibliotheksabruf. Unbekannte/persönliche IDs und widersprüchliche Zusatzdefinitionen bleiben Fehlerfälle. Namen bleiben beim Import erhalten; Abweichungen werden gezeigt. Lösen einer Zuordnung und freie Umbenennung sind bewusste Editorentscheidungen. Kein automatisches Annotieren alter Programme/Logs, keine neue Berechnung oder Migration. [Abnahme](docs/tests/TESTBERICHT-UEBUNGSREFERENZEN.md): 88 unterschiedliche gezielte Node-Fälle und ein mobiler Browserfall bestanden; echte Geräteabnahme offen.

### Lokale Daten bei mehreren Fenstern

- Seit dem beauftragten Ausbau vom 11.10.2026 darf je lokalem Speicherbereich nur ein aktualisiertes Satzkraft-Fenster schreiben. Eine exklusive Web Lock bleibt während der Lebensdauer dieses Fensters erhalten; ein Hintergrundwechsel gibt sie nicht frei.
- Zusätzliche Fenster zeigen eine geschützte Warteansicht. Sie können ihren geöffneten Stand sichern. Nach dem Schließen des schreibenden Fensters übernimmt „Aktuellen Stand laden“ mit frisch geladenen Daten; ein laufendes Training wird dabei weiterhin pausiert.
- Fremde Speicheränderungen stoppen weitere Hauptdaten-Schreibvorgänge. Ungespeicherte Werte und Editorentwürfe bleiben bis zur Sicherung oder bewussten Verwerfung erhalten. Die Sicherungsdatei enthält ein normales Schema-4-Backup und bei Bedarf das optionale Feld `windowDraft` für die manuelle Wiederaufnahme von Editor-/Formulareingaben; es wird nicht automatisch zusammengeführt.
- Backup-Wiederherstellung, Komplettlöschung, verzögerte Speicherung und Lebenszyklusereignisse prüfen dieselbe Schreibberechtigung. Speicherfehler dürfen keinen erfolgreichen Abschluss oder verworfenen Editorentwurf vortäuschen.
- Ohne verfügbare Web Locks bleibt die App gegen Schreiben geschützt und bietet Sicherung sowie einen verständlichen Browserhinweis. Der reguläre Einstieg erfolgt über HTTPS oder einen lokalen Server auf localhost; kein unsicherer Ersatz durch einen Speicher-Heartbeat.
- Alte App-Versionen kennen die Freigabe nicht. Vor der späteren Veröffentlichung alle alten Satzkraft-Fenster schließen beziehungsweise neu laden; der zusätzliche Standvergleich erkennt fremde Änderungen, garantiert aber keine atomare Zusammenarbeit mit altem JavaScript.
- Gezielte Prüfungen ersetzen keine Geräteabnahme: echtes iPhone/PWA, Offlinebetrieb und Betriebssystem-Beendigung bleiben vor Veröffentlichung praktisch zu prüfen. Kein Release, Versionswechsel oder Upload ist Teil dieses lokalen Ausbaus.

### Veröffentlichung

- Netlify führt `npm run build` aus und veröffentlicht ausschließlich `dist/`.
- `scripts/prepare-netlify.mjs` verwendet eine Positivliste der öffentlichen Dateien. Repository-Dokumente, Testdaten, Git-Inhalte, lokale Backups und Quellhilfen dürfen nicht im öffentlichen Verzeichnis landen.
- Es werden keine Netlify Functions bereitgestellt; die frühere Coach-Funktion und ihre Konfiguration sind entfernt. Vorhandene Provider-Schlüssel werden im Code nicht mehr verwendet; ihre Entfernung aus der Hosting-Verwaltung gehört zur nächsten ausdrücklich beauftragten Veröffentlichung.
- Bei manueller Bereitstellung zuerst `npm run build` ausführen und ausschließlich `dist/` hochladen. Niemals den Repository-Ordner als Publish-Verzeichnis verwenden.

## 4. Verbindlicher Oberflächen- und Funktionsstand

### Design und Navigation

- Das Redesign mit Smaragd-Akzent, lokal eingebundenen Schriften sowie hellem und dunklem Schema ist verbindlich. Detailregeln stehen in `docs/DESIGN-BRIEFING.md`.
- Mobile-first: keine horizontalen Überläufe; Touchziele grundsätzlich mindestens 44 × 44 CSS-Pixel. Die eng gerasterten `− / +`-Stepper in einzeiligen gewichteten Satzzeilen sind die bewusst gewählte Ausnahme: mindestens 32 × 44 Pixel, damit bei 320 px vierstellige Werte sichtbar bleiben. Safe Areas, Bildschirmtastatur und lange Inhalte berücksichtigen. Seitenzoom ist in der App deaktiviert; Satzfelder bleiben mit 16 px Schriftgröße gegen automatischen iPhone-Fokuszoom abgesichert.
- Obere Zurück- und Schließen-Aktionen in Programmeditor und Unteransichten bleiben beim Scrollen sichtbar und halten auf iPhones dauerhaft Abstand zur Statusleiste beziehungsweise Dynamic Island.
- Startseite: Der aktive Trainingsblock zeigt Wochenfortschritt, Wochenschiene und die auf Wochentage verteilten Einheiten. Programme, Auswertung und Einstellungen liegen in der Kopfzeile.
- Programme, Auswertung, Protokoll, Editor und Einstellungen verwenden die gemeinsame Designsprache statt lokaler Sonderlösungen.

### Training

- Die Live-Zeitkarte im Kopf ist die einzige Steuerung für Trainingszeit: Pause erfordert zwei Sekunden Gedrückthalten, Weiter und Ende sind direkte Aktionen.
- Eine laufende Trainingszeit läuft beim Wechsel in eine andere App, in den Hintergrund oder auf eine andere sichtbare App-Oberfläche weiter. `visibilitychange` und `pagehide` speichern nur; pausiert wird ausschließlich durch die Pause-Aktion oder das Trainingsende.
- Ein vollständiges Neuladen stellt ein zuvor laufendes Training aus Sicherheitsgründen pausiert wieder her. Eine Änderung dieses Verhaltens erfordert eine eigene Produktentscheidung, weil sonst lange Abwesenheiten als Trainingszeit zählen könnten.
- Die untere Leiste steuert Satzpause, Satzfokus und Halte-Timer. Die automatische Satzpause startet nach jedem vollständigen Satz, auch nach dem letzten Satz einer Übung oder des Tages.
- Satzwerte anderer Übungen sind während Countdown, Satzfokus und Halte-Timer gegen versehentliche Eingaben gesperrt.
- Zeitwerte werden als Minuten:Sekunden angezeigt und intern weiter in Sekunden gespeichert. Die manuelle Eingabe funktioniert wie bei einem Timer von rechts nach links: Der Cursor bleibt am Feldende, `4` ergibt `00:04`, danach `5` ergibt `00:45`; weitere Ziffern schieben die vorhandenen Stellen nach links und die Rücktaste entsprechend zurück. Erst beim Verlassen beziehungsweise Bestätigen des Feldes wird gespeichert und gegebenenfalls die Satzpause gestartet. Die Stoppuhr schreibt weiterhin direkt den fertigen Zeitwert.
- Satzfelder bleiben auch auf 320-px-Smartphones einzeilig: `SET`, `WDH` beziehungsweise `ZEIT · MIN` und `KG` bilden ein zentriertes Spaltenraster; `WDH` und `KG` stehen jeweils über dem eigentlichen Eingabefeld. Zeitfelder haben keine `− / +`-Tasten und tragen ihre Play-Taste links im jeweiligen Feld. Wiederholungen sind auf vier Ziffern und höchstens `9999`, Zeitwerte auf das gültige Format `00:00` bis `99:59` und Satzgewichte auf höchstens 2000 kg mit einer Dezimalstelle begrenzt. Dieselben Grenzen gelten für Tastatureingabe, Einfügen, Stepper, Programmeditor und Backup-Import. Der erste `+`-Tipp in einem leeren Folgesatz übernimmt den zuletzt eingetragenen Satzwert unverändert; bei gewichteten Übungen wird der zugehörige Wiederholungs-/Zeit- beziehungsweise Gewichtswert mit übernommen. Erst weitere Tipps erhöhen den Wert.
- Übungsaktionen, Vorgabe, letzter Verlauf und Satzraster stehen als kompakter Informationsblock zusammen. Zwischen Video/Notiz und Vorgabe entsteht kein zusätzlicher Außenabstand; zwischen Verlauf und Spaltenüberschriften bleiben 4 px.
- Abgeschlossene Einheiten lassen sich bewusst bearbeiten. Abbrechen stellt den Sicherungsstand wieder her; Einzeländerungen erklären vor dem Übernehmen die Auswirkung auf spätere Empfehlungen.

### Empfehlungen und Progression

- Empfehlungen sind typgerecht. Gewicht, Wiederholungen, Zeit oder Übungsvariante dürfen nicht vermischt oder erfunden werden.
- Zusatzgewicht kann nie unter 0 kg sinken. Ist bereits 0 kg eingetragen, darf weder „auf 0 kg reduzieren“ noch eine rechnerische Verringerung erscheinen. Stattdessen wird ohne Zusatzgewicht weitertrainiert und saubere Wiederholungen beziehungsweise eine leichtere Variante empfohlen.
- Deload- und Wiedereinstiegslogik sowie doppelte Progression bleiben erhalten. Getauschte Einheiten verfälschen die Empfehlung des Originals nicht.
- Zielwerte stehen in der passenden Vorgabeposition beziehungsweise im Eingabefeld; redundante Arbeitsgewichtszeilen entfallen.

### Programme und Editor

- Programme können aus Vorlagen geladen, manuell erstellt, importiert, geteilt, bearbeitet, archiviert und als Folgeblock fortgeführt werden.
- Austauschformat bleibt `format: "trainings-block"`, `version: 2`; `art` und `bereich` sind optional, `bereich` wird gegen `BEREICHE` validiert.
- Der Editor gliedert sich in Training, Wochen und Details. Zusammengehörige Felder liegen auf derselben visuellen Ebene.
- Übungstausch kann nur für das aktuelle Training oder dauerhaft ab der nächsten offenen Einheit übernommen werden. Das beendete Protokoll bleibt unverändert.
- Entfernte oder getauschte Übungen und bereits erfasste Werte dürfen durch Navigation, Reload oder spätere Programmänderungen nicht unbemerkt verloren gehen.

### Auswertung, Protokoll und Backup

- Auswertung zeigt Einheiten, Trainingszeit und bewegtes Gewicht sowie den Verlauf je Übung. Deload-Wochen verzerren gewichtete Trends nicht.
- Gleiche kanonische Übungsnamen werden typgerecht zusammengeführt; getauschte Übungen bleiben vom Originaltrend getrennt.
- Zeitübungen mit Gewicht bilden in der Auswertung einen eigenen Typ: Zeit und Last der zuletzt erfassten Ausführung gemeinsam anzeigen, einschließlich 0 kg beziehungsweise „Gewicht fehlt“. Sekunden dürfen weder in die 1RM-Schätzung noch in das kg-Wiederholungsvolumen eingehen. Verlauf und Protokoll zeigen beispielsweise „1:00 min · 20 kg · je Seite“.
- Für Zeit plus Gewicht bleiben eindimensionale Bestwerte, Prozenttrends und Abschluss-Highlights aus, bis eine eigene fachliche Kennzahl beschlossen ist. Vorblockwerte werden nur bei gleichem kanonischen Namen und gleichem Typ gezeigt; tatsächliche Deload-Satzwerte bleiben im Protokoll und in der letzten Ausführung erhalten.
- Das Trainingsprotokoll ist eine eigene Vollbildansicht und kann separat gedruckt werden.
- Backup-Erinnerung erscheint nach fünf abgeschlossenen Trainings seit der letzten Sicherung oder bei einer über 14 Tage alten Sicherung mit neuem Training; „Später“ pausiert sieben Tage.
- Offline-Betrieb, lokaler Datenbestand und Wiederherstellung aus kompatiblen Backups sind Kernfunktionen.

## 5. Nicht-Ziele des aktuellen Produkts

- Konten, Cloud-Synchronisation, soziale Funktionen oder eine zentrale Trainingsdatenbank
- Abo-, Zahlungs- oder Vermarktungsfunktionen
- medizinische Diagnosen oder Therapieempfehlungen
- Muskelgruppen-Analytik als zusätzliche Produktoberfläche
- ein Framework-Umbau oder eine Aufteilung nur aus Stilgründen
- neue Funktionen ohne bestätigten Nutzerbedarf

Langfristige Ideen stehen in `docs/planung/AUSBAUPLAN.md` und werden erst nach einer eigenen Entscheidung verbindlich.

## 6. Aktuelle Feedbackpunkte

| Feedback-ID | Status | Ergebnis / nächste Abnahme |
|---|---|---|
| `FB-20260808-01` | umgesetzt, reale Geräteabnahme offen | Wiederholungen beziehungsweise Zeit und Gewicht bleiben auch auf ≤480 px in einer gemeinsamen Satzzeile. Automatisch bei 320 px in Chromium und WebKit geprüft; Bediengefühl auf einem echten Smartphone noch einmal praktisch bestätigen. |
| `FB-20260808-02` | umgesetzt | Hintergrund- und Seitenwechsel speichern das laufende Training, pausieren es aber nicht. |
| `FB-20260808-03` | umgesetzt | Bei 0 kg Zusatzgewicht erscheint keine unmögliche oder widersprüchliche Reduktion mehr. |
| `FB-20260808-04` | umgesetzt | Netlify veröffentlicht über eine Positivliste ausschließlich den erzeugten Ordner `dist/`; API-Coach und Functions sind im neuen Arbeitsstand entfernt. |
| `FB-20260808-05` | umgesetzt | Das aktive Briefing wurde auf den aktuellen verbindlichen Stand verdichtet; die vollständige Historie bleibt archiviert erhalten. |

## 7. Noch offene Entscheidungen und Risiken

1. **Echtes Smartphone:** Die neue einzeilige Satzwerterfassung ist automatisiert bei 320 px in Chromium und WebKit geprüft. Eine kurze praktische Abnahme auf dem hauptsächlich verwendeten Gerät bleibt sinnvoll, insbesondere mit Bildschirmtastatur und längerer Trainingseinheit.
2. **Breitere Veröffentlichung:** Vor öffentlicher Bewerbung, kommerzieller Nutzung oder deutlich größerem Nutzerkreis rechtliche Anbieter- und Datenschutzhinweise fachlich neu bewerten.
3. **Vollständiger Reload eines laufenden Trainings:** Der aktuelle Sicherheitskompromiss stellt das Training pausiert wieder her. Nur ändern, wenn die gewünschte Behandlung langer Abwesenheiten ausdrücklich festgelegt ist.

## 8. Arbeits- und Abnahmehinweise

- Vor Änderungen `git status`, dieses Briefing, `AGENTS.md` und die direkt betroffenen Dokumente lesen.
- Erst den Fehler oder Ablauf reproduzieren, dann die kleinste belastbare Korrektur umsetzen.
- Kritische Pfade umfassen Datenlöschung und -wiederherstellung, Import, Training, Progression, Programmtausch, Offline-Cache, externe KI-Importe und Netlify-Veröffentlichung.
- Abschlussberichte unterscheiden zwischen automatisch getestet, visuell geprüft, manuell auf echter Hardware geprüft, nicht verifizierbar und offen.
- Historische Feedback-IDs und Releases sind im archivierten Briefing und in `CHANGELOG.md` nachvollziehbar; sie müssen nicht erneut in diesem aktiven Dokument dupliziert werden.
