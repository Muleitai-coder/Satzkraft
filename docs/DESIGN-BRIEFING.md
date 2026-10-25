# Design-Briefing Satzkraft (Redesign 2026)

Verbindliche Gestaltungsregeln für alle Ansichten. Referenz ist die **neue Startseite** (Aktiver Block mit Wochenkarte und Übungszeilen). Jede neue oder überarbeitete Ansicht muss sich an diesem Briefing messen lassen; Abweichungen brauchen eine dokumentierte Produktentscheidung.

## 1. Grundprinzipien

1. **Ruhe vor Dichte.** Wenige, klar getrennte Karten pro Bildschirm. Informationen, die nicht sofort gebraucht werden, liegen hinter aufklappbaren Zeilen (`<details>`) oder dem Drei-Punkte-Menü – nicht dauerhaft sichtbar.
2. **Eine Hierarchie pro Ansicht.** Genau ein Eyebrow + eine große Überschrift oben, danach Karten. Keine konkurrierenden Hero-Boxen oder Statistik-Kacheln.
3. **Text statt Buttonflächen für Nebenaktionen.** Primäraktion als gefüllter Akzent-Button, alles Weitere als Textaktion oder Icon.
4. **Beide Farbschemata.** Jede Änderung muss im dunklen und hellen Schema funktionieren (`html[data-theme]`). Nur Tokens verwenden, nie Rohfarben.

## 2. Design-Tokens (Quelle: `src/styles/tokens.css`)

| Token | Bedeutung |
| --- | --- |
| `--font` | Hanken Grotesk – aller Fließtext, Titel, Buttons, Eingaben |
| `--mono` | JetBrains Mono – Eyebrows, Zähler, Kennzahlen, Meta-Zeilen |
| `--bg` / `--panel` / `--panel2` / `--up` | Flächen von Seite bis erhabenem Element |
| `--hair` / `--hair2` | Trennlinien und Ränder (nie deckende Grautöne) |
| `--ink` / `--ink2` / `--muted` / `--faint` | Textstufen von Titel bis Nebenangabe |
| `--acc` (+ `--accd`, `--accg`, `--accl`, `--onacc`) | Smaragd-Akzent: Primäraktionen, Erledigt-Status, aktive Zustände |
| `--kraft`, `--hyp`, `--skill`, `--core`, `--orange`, `--danger` | Kategoriefarben (amber, emerald, violet, sky, orange, rose) |

Schriften liegen lokal in `fonts/` und stehen im Service-Worker-Precache. Kein CDN.

## 3. Typografie-Regeln

- **Eyebrow:** `--mono`, 9–10,5 px, `uppercase`, `letter-spacing ≥ .12em`, Farbe `--muted` oder `--acc` (Beispiel: `heroeyebrow`, `rowcat`, `pvwd`).
- **Seitentitel:** `--font`, 22–29 px, Gewicht 800, `letter-spacing -.02em` (`ptitle`).
- **Kartentitel:** 13,5–14,5 px, Gewicht 700, einzeilig mit Ellipsis (`rowname`).
- **Meta/Kennzahlen:** `--mono`, 10–11 px, Farbe `--muted` (`rowpresc`, `chip`, `pvmeta`).
- **Formularelemente und Buttons erben `--font`** (globale Regel `button,input,select,textarea{font-family:var(--font)}`). Zahlen-Eingaben nutzen bewusst `--mono` (`.inp`).
- Zeitwerte immer im Format `m:ss min` (z. B. `1:15 min`), nie „75 Sek“.

## 4. Komponenten-Bausteine

- **Seitenkopf:** `heroeyebrow` → `ptitle` → `chiprow` mit `chip`-Angaben (z. B. „6 Tage“, „4 Wochen“). Quelle: Startseite.
- **Karte:** `--panel`, Radius 16 px, Rand `--hair`, Innenabstand 14–16 px. Kategorie-Farbbalken links (3 px, Kategoriefarbe).
- **Übungszeile (Listenform):** Farbbalken · Eyebrow (Kategorie) · Name · Mono-Meta („3 × 8–12 · 5 kg · 1:30“) · Index/Haken rechts (`exrowd`, `pvrow`).
- **Aufklappzeile:** `<details>`-Karte mit Summary im Zeilenlayout und Chevron rechts, der sich beim Öffnen dreht (`pvday`, `pvweeks`).
- **Chips/Pills:** Rahmen `--hair`, Radius 8–999 px, Mono-Schrift, Uppercase (`chip`, `badge`, `phasepill`).
- **Primär-Button:** gefüllt `--acc` auf `--onacc`, Gewicht 700–800, Radius 12–14 px, min. 44 px Höhe. Sekundär: Rahmen `--hair2` auf `--panel`. Gefahr: `--dangerg`/`--danger`.
- **Modale Hinweisfenster:** `mbox` auf `--panel`, Radius 20 px, Titel 17 px/800, Nachricht `--ink2`, Buttons gestapelt in voller Breite. Gleiche Schriften und Tokens wie die App – keine Systemschrift-Ausnahmen.
- **Drei-Punkte-Menü (`kebab`):** für alle Nebenaktionen einer Karte.

## 5. Interaktion und Zustände

- Erledigt = Smaragd-Haken, nie zusätzliche Grau-Dimmung erledigter Inhalte in aktiv bearbeitbaren Ansichten. Deckkraft-Reduktion (`opacity < 1`) ist Sperr-/Vorschauzuständen vorbehalten (z. B. gesperrte Karten während der Satzpause).
- Einzeilige Meta- und Verlaufszeilen: `white-space:nowrap` + `text-overflow:ellipsis`, keine Zeilenumbrüche in Zeilenkomponenten.
- Navigation in Vollbild-Ansichten: Zurück-Chevron links, Titel mittig/links, X rechts. X führt in Untersichten des Programme-Bereichs immer zurück zur Programme-Vollbildansicht, nicht in Zwischen-Hubs.
- Mindestens 44 px Touch-Höhe für alle Bedienelemente.

## 6. Anwendung

Vor jedem UI-Merge prüfen:

1. Nutzt die Ansicht Seitenkopf + Karten statt eigener Sonderlayouts?
2. Stimmen Schrift (Fließtext `--font`, Meta `--mono`) und Tokens in hell und dunkel?
3. Sind Nebeninformationen eingeklappt statt dauerhaft sichtbar?
4. Gibt es genau eine Primäraktion?

## 7. Zentrale Quelle für Web und iOS (25.10.2026)

Dieses Dokument ist der verbindliche Designvertrag. Die technische Quelle der Tokens ist **`src/styles/tokens.css`**; sie ersetzt den früheren Verweis auf einen manuell gepflegten Block in `index.html`. Beide Plattformen erhalten die gleiche CSS-Basis aus dem gemeinsamen Build. `native/src/native.css` ergänzt nur Plattformzustände und Safe Areas.

- **Abstände:** `--space-1/2/3/4/6` = 4/8/12/16/24 px.
- **Radien:** `--radius-control` = 12 px, `--radius-card` = 16 px, `--radius-dialog` = 20 px.
- **Bedienziele:** `--touch-target` = 44 px, `--touch-native` = 48 px. Die bestehende schmale Satz-Stepper-Ausnahme bleibt dokumentiert; keine weiteren Ausnahmen ohne Entscheidung.
- **Ebenen:** `--layer-notice`, `--layer-native-status`, `--layer-native-guard` ordnen Schreibschutz und native Fehleroberflächen eindeutig.
- **Neue Oberflächen:** Bestehende Farben, Typografie, Abstände und Komponenten verwenden. Keine neuen lokalen Paletten, Schriften oder Schatten ohne begründete Ergänzung dieses Vertrags.
- **Altbestand:** Bestehende feste Abstände werden bei einer fachlichen Überarbeitung auf die Tokens umgestellt. Die Einführung der Tokens behauptet keine vollständige Vereinheitlichung sämtlicher alter CSS-Regeln.

## 8. Barrierearme Zustände und Abnahme

- Seitenzoom bleibt erlaubt. Die ältere Entscheidung zur Zoomsperre ist aufgehoben; fokussierte Satzfelder behalten mindestens 16 px Schriftgröße.
- Jede Aktion erhält einen verständlichen zugänglichen Namen. Dialoge benennen Titel, halten den Fokus und geben ihn beim Schließen zurück.
- Fortschritt und Fehler dürfen nicht ausschließlich über Farbe vermittelt werden. Fehlermeldungen nennen die nächste mögliche Handlung.
- Datenrettung und laufende Speichervorgänge sperren die übrige Oberfläche. Sicherung, Bestätigung und tatsächliches Ersetzen bleiben getrennte Schritte.
- Für neue/überarbeitete Ansichten: hell/dunkel, schmale Breite, lange deutsche Texte, Tastaturbedienung, Fokus, Safe Areas und Fehlersituation gezielt prüfen. Keine neuen Screenshot-Baselines ohne Auftrag.
- Auf dem echten iPhone müssen Tastatur, Textvergrößerung, VoiceOver und Betriebssystem-Unterbrechung zusätzlich praktisch geprüft werden. Browsersimulationen werden als solche benannt.

## 9. Änderung des Designvertrags

Eine neue wiederverwendbare Komponente erhält hier Zweck, Zustände, Tokens und Bedienregeln. Abweichungen werden hier begründet, nicht nur in einzelnen CSS-Dateien. Eine echte native UI kann diese semantischen Rollen später übernehmen; sie erfindet keine zweite Designsprache.

## 8. PDF und Druck

- A4 mit 44 pt Rand, weißem Hintergrund, eingebetteter Hanken Grotesk und durchsuchbarem Text. Fester heller Export unabhängig vom App-Farbmodus.
- Farben ausschließlich aus `--pdf-ink`, `--pdf-muted` und `--pdf-accent` in `src/styles/tokens.css`.
- Titel 22 pt, Abschnitt 15 pt, Übung 12 pt, Inhalt 10 pt, Metadaten 9 pt und Seitenfuß 8 pt. Die Anordnung liegt in `src/core/pdf-document.js`. Lange Namen und Notizen umbrechen; Inhalte und letzte Protokollwochen nicht abschneiden.
- Der Dateiexport enthält Zusammenfassung und Übungswerte beziehungsweise das vollständige Protokoll. Die interaktiven Balken der App werden durch benannte Vergleichswerte dargestellt.
- Im Exportdialog genau eine Primäraktion: „PDF sichern“. „Drucken“ bleibt eine Web-Nebenaktion. Exportknöpfe auch mobil mindestens 44 × 44 px.
