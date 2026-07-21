# Design-Briefing Satzkraft (Redesign 2026)

Verbindliche Gestaltungsregeln für alle Ansichten. Referenz ist die **neue Startseite** (Aktiver Block mit Wochenkarte und Übungszeilen). Jede neue oder überarbeitete Ansicht muss sich an diesem Briefing messen lassen; Abweichungen brauchen eine dokumentierte Produktentscheidung.

## 1. Grundprinzipien

1. **Ruhe vor Dichte.** Wenige, klar getrennte Karten pro Bildschirm. Informationen, die nicht sofort gebraucht werden, liegen hinter aufklappbaren Zeilen (`<details>`) oder dem Drei-Punkte-Menü – nicht dauerhaft sichtbar.
2. **Eine Hierarchie pro Ansicht.** Genau ein Eyebrow + eine große Überschrift oben, danach Karten. Keine konkurrierenden Hero-Boxen oder Statistik-Kacheln.
3. **Text statt Buttonflächen für Nebenaktionen.** Primäraktion als gefüllter Akzent-Button, alles Weitere als Textaktion oder Icon.
4. **Beide Farbschemata.** Jede Änderung muss im dunklen und hellen Schema funktionieren (`html[data-theme]`). Nur Tokens verwenden, nie Rohfarben.

## 2. Design-Tokens (Quelle: `index.html`, Block „Satzkraft Redesign 2026“)

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
