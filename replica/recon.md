# Satzkraft Bestandsaufnahme

Stand: 11.10.2026 · Codebasis: v0.33.4 + Unreleased (API-Coach entfernt; Fensterschutz; Zeit mit Gewicht korrekt) · Plattform: mobile-first Web-PWA.

Satzkraft besitzt bereits den vollständigen Kernablauf vom Programm bis zum Folgeblock. Der API-Coach ist nach der Produktentscheidung vom 11.10.2026 entfernt. Der Schutz lokaler Daten bei mehreren Fenstern ist anschließend lokal umgesetzt. Die falsche Auswertung von Zeitübungen mit Gewicht ist ebenfalls lokal korrigiert. Die erweiterte Übungsdatenbank ist ein anschließender, gesondert zu entscheidender Ausbau.

Diese Bestandsaufnahme wendet `replica-recon` auf das eigene Produkt an. Code und eigene Dokumentation sind die Primärquellen; Fremdprodukte, deren Inhalte und eine Neuentwicklung sind nicht Teil des Auftrags. „Workout Aoo“ bezeichnet hier das im Arbeitsverzeichnis vorhandene Produkt Satzkraft; eine Umbenennung ist nicht beschlossen.

## Quellen und Verbindlichkeit

| Quelle | Rolle |
| --- | --- |
| [Aktives Briefing](../BRIEFING-CODEX.md) | Maßgebliche Produktregeln, Datenverträge, Nicht-Ziele und offene Geräteabnahme |
| [Arbeitsregeln](../AGENTS.md), [Teststrategie](../docs/TESTING.md) | Risikobasierte Prüfungen und Arbeitsablauf |
| [Designsystem](../docs/DESIGN-BRIEFING.md) | Verbindliche Gestaltung für alle Ansichten |
| [App](../index.html), [Progression](../js/progression.js) | Tatsächlich implementierte Oberfläche und Fachlogik |
| [Entscheidung zur KI](../BRIEFING-CODEX.md) | API-Coach und Serverfunktion entfernt; externe KI über lokalen Text und Import |
| [Übungsbibliothek](../uebungen.json), [Programme](../programme/) | 200 Übungseinträge und vier mitgelieferte Vorlagen; zusätzlich eingebautes Standardprogramm |
| [Service Worker](../sw.js), [Veröffentlichung](../scripts/prepare-netlify.mjs), [Netlify](../netlify.toml) | Offline-Verhalten und Veröffentlichung über Positivliste |
| [Versionshistorie](../CHANGELOG.md) | Entwicklung und bereits erledigte Feedbackpunkte |
| [Testbericht v0.33.4](../docs/tests/TESTBERICHT-v0.33.4.md), [Tests](../tests/), [Browserfälle](../qa/playwright/update.spec.js) | Vorhandene Abdeckung und datierte Abnahme |
| [Releases 1–4](../docs/planung/GROSSES-UPDATE-RELEASES-1-4.md) | Umgesetzt mit v0.26.0; ältere Aufgabenlisten sind kein aktueller Backlog |
| [Übungsdatenbankkonzept](../docs/planung/UEBUNGSDATENBANK-FACHKONZEPT.md) | Arbeitsentwurf vom 09.08.2026, ausdrücklich noch nicht zur Umsetzung freigegeben |
| [Konten und Cloud](../docs/planung/AUSBAUPLAN.md) | Historischer Zukunftsentwurf; widerspricht als unmittelbarer Ausbau den aktuellen Nicht-Zielen |

Die neueste ausdrückliche Produktentscheidung steht über dem aktiven Briefing. Historische Abnahmekriterien dienen nur als Kontext, soweit sie nicht im aktuellen Briefing fortgelten. Auch die im Übungsdatenbankentwurf als „bereits getroffen“ bezeichneten Entscheidungen sind wegen seines Gesamtstatus keine automatische Umsetzungsfreigabe.

## Kernablauf und vorhandene Funktionen

Programm wählen, erstellen oder importieren → nächste Einheit im Wochenplan öffnen → Training starten → Sätze und Pausen erfassen → Training abschließen → Empfehlungen und Verlauf ansehen → nächsten Block fortführen.

Vorhanden sind Programme mit Kategorien und Wochenphasen, lokales Mehrprogramm-Management, Editor mit Rückgängig und Sortierung, JSON-Import mit Vorschau und Update-Erkennung, Export und Teilen, Training mit Gewicht/Wiederholungen/Zeit, automatische Satzpause, Ziel- und Maximalzeit-Timer, Warm-up/Cool-down, Übungstausch, Korrektur fertiger Einheiten, Progression mit Deload/Wiedereinstieg, Auswertung, druckbares Protokoll, Archiv, Folgeblöcke, Backup und Wiederherstellung sowie lokal erzeugte Texte für externe KI-Programme. Der Kern benötigt weder Konto noch Cloud-Datenbank.

## Ansichten

16 aktive fachliche Ansichten beziehungsweise Dialogoberflächen und eine stillgelegte ID S09. S01/S02 sind Zustände derselben Hauptoberfläche; S15/S16/S17 sind Dialoge. Es gibt keinen URL-Router. Der Hash `#p=` ist ein Programmimport-Einstieg.

„Zustände“ bezeichnet im Code erkennbare Zustände, keine neue visuelle Geräteabnahme.

| ID | Ansicht und Einstieg | Zweck und Komponenten | Zustände und Grenzen |
| --- | --- | --- | --- |
| S01 | Startseite, `renderView()` | Aktiver Block, Wochenfortschritt, Wochenschiene, Tage, Übungszeilen | Offen, teilweise erfasst, abgeschlossen, Ruhetag, laufendes Training |
| S02 | Training, `startWorkout()` | Live-Zeitkarte, Satzraster, Empfehlungen, Übungsaktionen, untere Timerleiste | Laufend, pausiert, Satzpause, Satzfokus, Halte-Timer, Fortsetzung, Korrektur |
| S03 | Programme, `openLib()` / `renderLib()` | Aktives/weitere Programme, vier Vorlagen, Erstellen-Kacheln, Backup | Weitere Programme eingeklappt; Programmänderungen bei laufendem Training gesperrt |
| S04 | Import, `renderImportEntry()` | JSON-Text, Datei, Prüfen, Vorlage | Leer, Text/Datei gewählt, Größen-/Lesefehler |
| S05 | Vorschau, `renderImportPreview()` | Tage, Übungen, Wochen, Speichern/Aktivieren/Bearbeiten | Neues Programm, Duplikat, Code-/Namensupdate, abweichender Revisionsstand |
| S06 | Import korrigieren, `renderImportError()` | Verständlicher Fehler, JSON-Pfad, Editor-Reparatur für Timer-Einheiten und Übungszuordnungen | Ungültiges JSON/Programm, gezielt reparierbarer Fehler; Referenz wird nicht still entfernt |
| S07 | Manuell erstellen, `renderManualCreator()` | Name, Beschreibung, Wochen und Wochentage | Unvollständige Eingabe, validierter Entwurf |
| S08 | Editor, `renderProgramEditor()` | Tabs Training/Wochen/Details, Suchvorschläge, Felder, Sortierung, Rückgängig | Neu/Kopie/Original, Feldfehler, ungespeichert, Umbenennung/Übungswechsel |
| S09 | Ehemaliger API-Coach | Entfernt am 11.10.2026; ID bleibt für historische Verweise reserviert | Alte Programme bleiben kompatibel; gespeicherte Antworten werden bereinigt |
| S10 | ChatGPT & Co., `renderExternalAiCreate()` | Wunsch, lokal erzeugte Vorlage, Rückweg zum Import | Wunsch fehlt, Kopieren erfolgreich/fehlgeschlagen |
| S11 | Archiv, `renderArchive()` | Archivierte Programme, Auswertung und Wiederaufnahme | Leer, gefüllt, Änderungen während Training gesperrt |
| S12 | Auswertung, `openReport()` | Einheiten, Dauer, bewegtes Gewicht, Übungskarten, Vorblock, Drucken | Ohne Verlauf, mit Verlauf, aktiver/archivierter Block; Zeit+Gewicht fehlerhaft |
| S13 | Protokoll, `openProtocol()` | Wochen, Sätze, Notizen und Druckansicht | Leer, gefüllt, getauschte Übung; Zeit+Gewicht fehlerhaft |
| S14 | Warm-up/Cool-down, `startWucd()` | Geführte zeitbasierte Abfolge | Laufend, nächster Schritt, Ende/Abbruch |
| S15 | Einstellungen, `showSettings()` | Hell/dunkel, Backup, Datenfluss, Coach-/Komplettlöschung | Bestätigung, Sicherheitskopie, Speicher-/Löschfehler |
| S16 | Übungsverlauf, `showHistory()` | Wochen/Sätze, Verlauf, ggf. geschätztes 1RM | Leer/gefüllt; Zeit plus Gewicht ohne 1RM/Volumen |
| S17 | Schutz bei mehreren Fenstern, `renderLocalWindowNotice()` | Warteansicht, bewusst übernehmen, Stand/Entwurf sichern | Prüfung, anderes Fenster, Fremdänderung, fehlende Koordination/Speicherzugriff |

## Nutzerabläufe

Aktionszahlen sind aus den Codepfaden abgeleitet. Zifferneingaben, Scrollen und optionale Bestätigungen sind nicht mitgezählt; es sind keine gemessenen Usability-Werte.

| ID | Ziel und Weg | Typischer Umfang | Relevante Randfälle |
| --- | --- | --- | --- |
| F01 | Vorlage aktivieren: S01 → S03 → S05 → S01 | 3 Hauptaktionen: Programme, Laden, Aktivieren | Offline-Ressource fehlt, Duplikat, Training läuft |
| F02 | Eigenen Plan erstellen: S03 → S07 → S08 → S03/S01 | Variabel nach Planumfang | Name/Tag fehlt, Feldfehler, Abbrechen, Kopie statt Original |
| F03 | Plan importieren/aktualisieren: S03 → S04 → S05/S06 → S08/S01 | Ab 4 Aktionen plus Eingabe; Updates mit Bestätigung | 5-MB-Grenze, falscher Typ, Aliasse, Umbenennung, alte Revision |
| F04 | Einheit absolvieren: S01 → S02 → S01 | Start + Satzwerte + Abschlussbestätigung; ggf. Tagesauswahl | Unvollständige Einheit, Überspringen, Hintergrund, letzte Satzpause, Reload pausiert |
| F05 | Zeit erfassen: S02 → Timer/Satzfeld → S02 | Timer starten/stoppen oder Ziffern eingeben/bestätigen | Minuten:Sekunden, Zeit+Gewicht, „je Seite“, 320 px, Fokus-/Satzsperre |
| F06 | Übung tauschen/entfernen: S02 → Dialog → S02 → Abschlussdialog | Ab 3 Aktionen; dauerhafter Tausch mit Folgeentscheidung | Vor erster Satzeingabe, typkompatible Vorschläge, nur heute/dauerhaft, letzte Blockwoche |
| F07 | Fertige Einheit korrigieren: S01 → S02-Korrektur → S01 | Bearbeiten, Werte, Speichern/Abbrechen | Sicherungsstand wiederherstellen, Wirkung auf spätere Empfehlungen erklären |
| F08 | Plan ändern: S03 → S08 → Ersetzen-Dialog → S03 | Variabel; mindestens Menü/Bearbeiten und Speichern/Bestätigen | Historie erhalten, Änderung ab nächster offener Einheit je Tag, Umbenennung |
| F09 | Verlauf auswerten/drucken: S01/S11 → S12 → S13 | 1 Aktion zur Auswertung, 2 zum Protokoll, 3 zum Druck | Leer, Archivdaten, Deload, Tausch, gewichtete Zeitübungen |
| F10 | Block fortführen: Blockabschluss/S03 → Folgeblock → S01 | Je Einstieg ca. 2–3 Hauptaktionen | Empfohlenes Startgewicht, eigene Kennung, Vorblock-Verweis, Tauschvormerkung |
| F11 | Daten sichern/wiederherstellen/löschen: S03/S15 → Dialog → S01 | Download 2; Wiederherstellung mit Datei/Bestätigung | Defekte Referenzen, fremde Origin-Daten, Speicherfehler, andere offene Fenster |
| F12 | Externen KI-Plan erstellen: S03 → S10 → externe KI → S04 → S05 → S01 | Wunsch eingeben, Text kopieren, JSON zurückholen und prüfen | Nutzer entscheidet über Weitergabe; API-Coach entfällt; ungültiges JSON wird lokal abgefangen |

## Wiederverwendete Komponenten und Gestaltung

| Baustein | Varianten und Zustände | Verwendung |
| --- | --- | --- |
| Seitenkopf und Navigation | Eyebrow/Titel/Chips, Zurück/X, Safe Area, Fokusführung | S01, S03–S13 |
| Karten und Übungszeilen | Kategoriebalken, Meta, Haken, Ellipsis, eingeklappt | S01–S03, S05, S08, S11–S12 |
| Buttons und Menüs | Smaragd-Primäraktion, Text/Icon-Nebenaktion, Gefahr, gesperrt | Alle |
| Dialog `mbox` | Bestätigung, Hinweis, Fehler, Fokusfalle, Hintergrund isoliert | Training, Import, Tausch, Backup, Einstellungen |
| Satzraster | Wiederholungen, Zeit, Gewicht, Stepper, Play, deaktiviert | S02 |
| Timer | Live-Zeit, Pause nach 2 s Halten; Satzpause/Fokus/Haltezeit | S02, S14 |
| Formfelder und Suche | Inline-Fehler, Suchvorschlagsliste, Tastaturauswahl | S04, S07–S10 |
| Aufklappkarten, Chips, Tabs | Auswahl, `aria-pressed`, zusätzliche Infos eingeklappt | Programme, Vorschau, Editor |
| Verlauf und Drucktabelle | 12 Balkenplätze, Bestwert, Vorblock, Protokoll | S12, S13, S16 |

Tokens und lokale Schriften bleiben maßgeblich: Hanken Grotesk, JetBrains Mono, Smaragd-Akzent, Hell/Dunkel, eine klare Hierarchie und eine Primäraktion je Ansicht. Touchziele grundsätzlich 44 × 44 px; die explizite Ausnahme für enge Satz-Stepper beträgt 32 × 44 px. Der aktive Stand deaktiviert Seitenzoom; ältere Changelog-Aussagen über erlaubten Zoom sind überholt.

## Tatsächliches Datenmodell

Das Modell ist im Code belegt, nicht aus einer Referenz-App vermutet. Acht zentrale Strukturen:

| Struktur | Felder und Beziehungen | Beleg |
| --- | --- | --- |
| App-Zustand | `schemaVersion`, `programs`, `active`, `store`; Browser ist Datenbesitzer | `initState()`, `persist()` |
| Programm | `id`, `name`, `description`, optional `art`, `bereich`, `code`, `rev`, `parent`, Herkunft, Zeitstempel, Archivstatus | `importTranslate()`, `editorStoreProgram()` |
| Kategorie | Schlüssel → Label/Farbe/Pause/Wiederholungsbereiche je Phase | `categories`, `catOf()` |
| Woche | `n`, `phase`, `label`, `rir`, `sets`, `note` | `parseProgram()`, Editor |
| Trainingstag | `key`, `wd`, `title`, `ex`, optional `wu`/`cd` | `importTranslate()`, `dayByKey()` |
| Programmübung | `id`, `name`, `cat`, `w`, `bw`, `unit`, `tmode`, `perSide`, Vorgaben, Startgewicht/Schritt; `fromWeek`, `untilWeek`, `prevId` | Übersetzung, Zeitachsenmigration |
| Programm-Fortschritt | Je Programm `tg`, `barw`, `notes`, `logs`, `history`, `workout`, Tauschvormerkungen, entfernte Übungen, gewählte Woche/Tag | `newStore()`, `syncStore()` |
| Bibliothekseintrag | `de`, `en`, `alias`, `typ`, `equipment`, `muster`, `technik`, `video`, `ersatz`, `bereich`; optional `weightedTime`, `einseitig` | `uebungen.json`, Aliasindex |

Ein Logschlüssel ist `Woche|Tag|Übungs-ID`; seine Sätze enthalten `reps` und `weight`. Bei Zeitübungen speichert **`reps` Sekunden**, keine Wiederholungen. Der Logeintrag kann `swap`, `swapWeight` und `swapDecision` tragen. Historie enthält Start/Ende, Dauer, Woche/Tag, Abschluss und Segmente. Das laufende Training ist davon getrennt.

Der Hauptschlüssel bleibt `cali-plan-v3`, Schema 4. Theme, Backup-Metadaten und Löschgenerationen sind getrennte lokale Schlüssel. Historische Coach-Antworten (`satzkraft-coach-prefs`) werden beim Start entfernt, soweit der Speicher zugänglich ist. Backups enthalten den Hauptzustand, keine Coach-Antworten und keinen Farbmodus. Das Austauschformat bleibt `trainings-block`, Version 2; externe Feldnamen unterscheiden sich teilweise von internen (`weighted`/`w`, `revision`/`rev`). Programmrevisionen erkennen Programmupdates, aber keine konkurrierenden Schreibzugriffe auf den Gesamtzustand.

## Konkrete offene Punkte

| ID | Befund | Evidenz und Status |
| --- | --- | --- |
| O01, lokal behoben | Ein veraltetes zweites Fenster konnte neuere Trainingsdaten überschreiben | `persist()` ersetzt den ganzen Hauptzustand. Der `storage`-Listener reagiert nur auf Komplettlöschung. Mit zwei isolierten Kontexten der Originalfunktionen reproduziert: A speichert einen Satz; B speichert seinen älteren leeren Stand; der Satz verschwindet. Die Hintergrundspeicherung kann denselben Schreibpfad auslösen. Anschließend lokal mit Web Lock, gemeinsamem Schreibschutz und Standvergleich behoben. Gezielte Prüfungen: [Fensterschutz](../docs/tests/TESTBERICHT-FENSTERSCHUTZ.md). Echtes Gerät/PWA und Mischversion-Rollout bleiben offen. |
| O02, lokal behoben | Gewichtete Zeitübungen erhielten Wiederholungs-Kennzahlen | `buildReportData()` priorisiert `ex.w` vor `unit`. Reproduktion: Suitcase Carry, 60 s bei 20 kg → Typ `weight`, geschätztes 1RM 40 kg, Gesamtvolumen 1.200 kg. `reportDetailedProtocol()` zeigt `60×20` und 1.200 kg. Das sind Sekunden, keine Wiederholungen. Auch der Übungsverlauf war betroffen. Jetzt eigener Berichtstyp, kein 1RM/Wiederholungsvolumen, tatsächliche Zeit/Last in Bericht, Verlauf und Protokoll sowie typgebundener Vorblockvergleich. [Gezielter Prüfbericht](../docs/tests/TESTBERICHT-ZEIT-GEWICHT.md). |
| O03 | Reale Smartphone-Abnahme bleibt offen | Aktives Briefing und Bericht v0.33.4: Tastatur, lange Einheit, Safe Area, Hintergrundwechsel auf dem Hauptgerät prüfen. Automatisierte WebKit-Prüfung ersetzt dies nicht. |
| O04 | C1 lokal umgesetzt; C2/C3 offen | D1–D8 bestätigt; [Prototyp](../docs/prototyp/uebungsdatenbank/README.md) und [Verträge](../docs/planung/UEBUNGSDATENBANK-VERTRAEGE.md) erstellt. Zehn geprüfte Referenzen werden jetzt in Auswahl/Editor/Import/Export/Backup erhalten; [Abnahme](../docs/tests/TESTBERICHT-UEBUNGSREFERENZEN.md) mit 88 gezielten Node-Fällen und einem mobilen Browserfall. Historische Snapshots und Versionsentscheidung für Unterstützung/persönliche Definitionen stehen noch aus. |
| O05 | Reload-Verhalten benötigt nur bei Änderungswunsch eine Entscheidung | Aktuell wird laufendes Training pausiert wiederhergestellt. Das ist beabsichtigt und kein Fehler. |
| O06 | Größere öffentliche/kommerzielle Veröffentlichung ist eigener Produktpfad | Aktuell private Nutzung; Anbieter-/Datenschutzhinweise vor geänderter Nutzung neu prüfen. Kein aktueller Implementierungsauftrag. |

O01 und O02 wurden am 11.10.2026 durch kurze Node-Ausführungen der vorhandenen Funktionen mit synthetischen Daten nachvollzogen. Keine persönlichen Browserdaten wurden gelesen. Dies belegt die Funktionsbefunde, keine vollständige Browserabnahme. Bei diesen isolierten Reproduktionen wurde die App nicht verändert; die nachfolgenden Korrekturen von O01/O02 sind gesondert geprüft.

## Funktionsmatrix und Abnahmebasis

[features.csv](features.csv) verwendet die Replica-Spalten für das bestehende eigene Produkt: `original` bedeutet Anforderungsquelle (`active`, `draft`, `non_goal`), `clone` den tatsächlichen Implementierungsstand (`yes`, `partial`, `no`, `skip`). Vorhandene Funktionen werden nicht künstlich auf „noch nicht gebaut“ gesetzt. `must`/`should`/`could` bewertet ihre Bedeutung, nicht eine neue Freigabe; Entwurfsfunktionen bleiben ausdrücklich unbeschlossen.

Die Matrix enthält 35 Positionen: 22 `must`, sieben `should`, sechs `could`. Davon sind 28 umgesetzt, eine teilweise umgesetzt, drei Entwurfsfunktionen nicht umgesetzt und drei Gruppen als Nicht-Ziele ausgeklammert. Die teilweise umgesetzte Position umfasst C1 für zehn Bibliotheksidentitäten; erweitertes Erfassungsmodell und vollständige Bibliothek bleiben offen. Ein „umgesetzt“ ist ein Codebefund, keine neue Zusicherung fehlerfreier Gesamtfunktion.

36 Node-Testdateien und die Playwright-Fälle sind vorhanden. Der Bericht vom 01.10.2026 dokumentiert 273 bestandene Unit-/Integrationstests und 156 Browserausführungen. Diese Zahlen stammen aus der früheren Abnahme, nicht aus einem neuen Komplettlauf. Die ursprünglichen beiden Befunde zeigten konkrete Lücken trotz dieser dokumentierten Abdeckung.

## Umfang und nächste Planung

Der vorhandene Produktumfang ist insgesamt L: 16 aktive fachliche Oberflächen, 12 Hauptabläufe, acht zentrale Datenstrukturen. Die schwierigsten Teile sind verlustfreie Planänderungen mit Historie, lokale Persistenz/Offline über Lebenszyklus und Fenster hinweg sowie typgerechte Progression/Auswertung. Der nächste Schritt ist ein kleines, abgegrenztes Paket; Aufwand und Abnahmekriterien stehen in [architecture.md](architecture.md).

Konten, Cloud-Synchronisierung, Zahlung, soziale Funktionen, medizinische Diagnostik, Muskelgruppen-Oberfläche und Framework-Umbau bleiben außerhalb des aktuellen Umfangs. Eigene Assets und eigener Code können weiterverwendet werden; die auf Fremdprodukte bezogenen Clean-Room-Schritte sind hier nicht einschlägig.
