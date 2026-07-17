# Testbericht · Großes Update Releases 1–4 (v0.26.0)

**Datum:** 17.07.2026 · **Getesteter Stand:** `main` bis Commit `652d143` („Release 4: Übungs-Bibliothek ergänzen"), App-Version v0.26.0
**Methode:** Automatisierter End-to-End-Test mit dem Anthropic-Skill `webapp-testing` (Playwright, Chromium headless, lokaler Server über `with_server.py`). Drei Testläufe; Fehlschläge der ersten Läufe waren durchgängig Probleme der Testskripte (Klick-Timeouts, eingeklappte Editor-Karten, falsche Prüfreihenfolge) und wurden in Nachläufen mit korrigierten Skripten erneut geprüft.
**Testdaten:** Frischer Zustand (leerer localStorage) sowie `TESTBACKUP-AUSWERTUNG.json` (v0.22-Daten, Wochen 1–7 abgeschlossen, Woche 8 offen) – Letzteres prüft zugleich die Abwärtskompatibilität (OF-4).

**Gesamtergebnis: Alle App-relevanten Prüfungen bestanden. Keine Defekte gefunden. Kein einziger Konsolen-Fehler in keinem Testlauf.**

---

## 1. Testebenen (vorab festgelegt)

1. Smoke & Erststart (Laden, Version, Hinweis-Box, Konsolenfehler)
2. Zonenmodell R1/R3 aus Nutzersicht (Sperren, Wegweiser, Wiederholen, Korrektur, Gültig-ab, Zeitachse)
3. Programm-Bibliothek R2 (Kachel, Liste, Vorschau, Übernahme, Kennzeichnung, Duplikat)
4. Übungs-Bibliothek R4 (Autocomplete DE/EN, Feld-Übernahme, Tauschvorschläge)
5. UI-Konsistenz (Absichts-Benennungen, Themes, mobile Breite, keine Sackgassen)
6. Regression & Datenkompatibilität (Kernfluss Training, altes Backup)

## 2. Ergebnisse im Einzelnen

### Smoke & Erststart ✅
- App lädt fehlerfrei, Version v0.26.0 sichtbar.
- Hinweis-Box „Neu: Dein Trainingstagebuch ist geschützt" erscheint beim ersten Öffnen mit exakt dem freigegebenen Wortlaut (GF-3a) und **erscheint nach Neuladen nicht erneut**.
- Mobil (375×812): kein horizontales Scrollen, Layout intakt.
- Theme-Umschalter wechselt sauber hell ↔ dunkel; helles Theme ohne Layoutbruch. Die App folgt beim Start der System-Einstellung.

### Release 1 + 3 · Zonenmodell ✅ (mit v0.22-Testbackup)
- **Abwärtskompatibilität:** v0.22-Backup lädt ohne Fehler; keine Migration nötig (OF-4 bestätigt).
- **Aktuelle Woche:** Wochen 1–7 fertig → Woche 8 ist automatisch die trainierbare Woche („Training starten" nur dort).
- **Sperren + Wegweiser:** Wochen 1–7 zeigen statt des Start-Buttons „**Diese Einheit ist Teil deines Protokolls.**" mit den Aktionen „Werte korrigieren" und „Diesen Inhalt heute trainieren" – keine Sackgasse. Der Sprung „heute trainieren" wechselt korrekt zu Woche 8, gleicher Tag.
- **Wiederholen nur zuletzt:** In Woche 7 ist **genau eine** Einheit wiederholbar (die zeitlich letzte, Tag 3); die übrigen sind gesperrt. Der Wiederholen-Dialog warnt vor dem Leeren/Ersetzen.
- **Werte korrigieren:** Hinweis-Dialog erscheint („Du bearbeitest dein Protokoll…"), danach sind alle 14 Satzfelder der Einheit editierbar (auch leere). Nach einer Wertänderung ist die **Historie byte-identisch** – Trainingszeit und Abschlussstatus unangetastet. Genau wie spezifiziert.
- **Gilt ab jetzt (O4):** Im Editor ergänzte Übung erscheint in Woche 8, **nicht rückwirkend** in Woche 1. Abgeschlossene Tage bleiben abgeschlossen (Häkchen-Zähler vorher = nachher), keine falsche Verpasst-Warnung → der ursprüngliche O3-Bug ist nachweislich behoben.
- **Umbenennen-Nachfrage (OF-3):** Umbenennen einer Übung mit Werten öffnet „Umbenennung einordnen" mit beiden Optionen.
- **Übungs-Zeitachse (O5):** Nach „Andere Übung": neue Übung zeigt „**seit Woche 8**"; das Detail-Modal nennt „**davor: Langhantel-Kniebeuge (Woche 1–7)**" samt vollständiger Verlaufstabelle. Woche 1 zeigt weiterhin die alte Übung mit ihren Werten. Die Unverlierbarkeits-Garantie funktioniert.

### Release 2 · Programm-Bibliothek ✅
- Kachel „Fertiges Programm wählen" steht an **erster Position** im Erstellen-Hub.
- Liste zeigt alle vier Programme mit Ziel · Level · Tage · Dauer (z. B. „Kraftbasis & Muskelaufbau · Einsteiger · 3 Tage · 50–65 min"). Die Blocklänge steht spezifikationskonform erst in der Vorschau.
- Vorschau: vollständige Wochenstruktur inkl. Deload **und** Kalibrier-Anleitung („Startgewichte finden").
- Übernahme („Speichern & aktivieren") legt das Programm an; die Programmverwaltung zeigt „**Offizielles Satzkraft-Programm**".
- Erneute Übernahme desselben Programms löst die Duplikat-Nachfrage aus.

### Release 4 · Übungs-Bibliothek ✅
- **Autocomplete:** „Bankd" → 6 Treffer, „bench" → 6 Treffer (deutsch UND englisch). Übernahme setzt den deutschen Namen („Bankdrücken") und füllt Kategorie, Übungstyp, Startgewicht, Steigerung und den Technik-Hinweis automatisch aus.
- **Tauschvorschläge:** Das Tausch-Modal zeigt „Passende Vorschläge" (z. B. Beinpresse); Antippen übernimmt den Namen ins Feld.

### UI-Konsistenz ✅
- Die vier Absichts-Benennungen sind wortgleich im Einsatz: „Werte korrigieren", „Training wiederholen (ersetzt die letzte Einheit)", „Übung nur heute tauschen", „Ab jetzt ersetzen".
- Alle geprüften Dialoge in Du-Form, Ton kurz/konkret/beruhigend.
- Gesperrte Einheiten erklären sich und bieten immer zwei Auswege an.

### Regression & Kernfluss ✅
- Bibliotheksprogramm übernehmen → aktivieren → Training starten → Satz eintragen → beenden → genau ein Historie-Eintrag. Der Grundfluss ist intakt.

## 3. Beobachtungen (keine Defekte, optionale Verbesserungen)

1. **Ansichts-Woche nach Backup-Wiederherstellung:** Nach dem Einspielen startet die Ansicht auf der im Backup gespeicherten Woche (7), nicht auf der aktuellen (8). Spezifikationskonform (Ansicht ist frei), aber ein automatischer Sprung zur aktuellen Woche nach einer Wiederherstellung wäre nutzerfreundlicher.
2. **Theme-Start folgt dem System:** In heller Systemumgebung startet die App hell. Falls Dunkel als Markenauftritt gewünscht ist, wäre das eine bewusste Produktentscheidung – aktuell verhält es sich systemkonform.

## 4. Nicht automatisiert geprüft (Empfehlung: kurze manuelle Checks)

- **Nachholen eines leeren Vorwochen-Tags** – die Testdaten hatten keine Lücke in Woche 7. (Manuell: in Woche 8 einen Tag trainieren, danach prüfen, ob ein leerer Woche-7-Tag noch startbar wäre – per Konstruktion der Testdaten nicht abbildbar.)
- **Erweiterte Wiederholen-Warnung** („Empfehlungen der folgenden Wochen…") – nur in einer Spezialkonstellation erreichbar (Nachholen unterhalb bereits trainierter gleicher Tage).
- **Auswertungs-Karte beendeter Übungen mit Zeitraum im Titel** – der Einstieg wurde vom Skript nicht gefunden; das Zeitachsen-Modal zeigt die vollständige Historie aber korrekt.
- **Offline-Verhalten** (Bibliothek/`uebungen.json` nach erstem Laden offline; stiller Fallback ohne Vorschläge).
- **Tag-Löschschutz** bei Tagen mit abgeschlossenen Einheiten (K-F4.5).
- **Alias-Matching im Folgeblock-Vergleich** (nur indirekt über die Autocomplete-Aliasse belegt).

## 5. Fazit

Die vier Releases setzen die freigegebenen Feinspezifikationen aus Nutzersicht korrekt um. Die drei zentralen Versprechen des Updates sind im echten Bedienablauf nachgewiesen: **Nichts Trainiertes geht verloren, trainiert wird vorne, Änderungen gelten ab jetzt.** Aus Sicht dieses Tests spricht nichts gegen die Freigabe von v0.26.0; die sechs Punkte aus Abschnitt 4 sollten einmalig manuell gegengeprüft werden.

*Hinweis: Die Node-Testsuite (`node --test tests/`) konnte auf diesem Rechner nicht laufen (kein Node.js installiert); sie wurde laut Commit-Historie vom umsetzenden Agenten ausgeführt. Screenshots aller Kernzustände liegen im Test-Arbeitsverzeichnis vor.*
