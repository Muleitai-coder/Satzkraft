# Test-Programme für Satzkraft

Diese JSON-Dateien decken die neuen Funktionen ab. Import jeweils über
**Programme → Fertiges Programm importieren → JSON einfügen oder Datei wählen → Prüfen & Vorschau**.

Alle Dateien wurden gegen die echte Programmprüfung der App getestet.

## Reihenfolge zum Durchspielen

1. **A-basis.json** → „Speichern & aktivieren".
   - Öffne das Training. Bei **Bulgarian Split Squats**, **Kurzhantel-Rudern einarmig**
     und **Dead Bug** steht jetzt **„je Seite"** hinter den Wiederholungen.
   - Bei den Kurzhantel-Übungen steht der Hinweis **„Trag das Gewicht einer Hantel ein."**

2. **B-duplikat.json** → Popup **„Programm bereits vorhanden"** (inhaltlich identisch mit A).

3. **C-namens-update.json** → Popup **„Update erkannt"** (gleicher Name, geänderter Inhalt).
   Wählst du „Laufendes Programm aktualisieren", bleiben Fortschritt und Gewichte erhalten.

4. **E-kennung-update.json** → Popup **„Update erkannt"**, obwohl der Name anders ist
   („Ganzkörper Pro"). Die App erkennt es an der **Kennung** (`code`), nicht am Namen.

5. **D-neu.json** → normaler Import ohne Popup (eigenständiges Calisthenics-Programm).

6. **F-fehlerhaft.json** → wird **abgelehnt** mit einer verständlichen Meldung
   (verdrehter Wiederholungsbereich). Zeigt die Fehlerprüfung.

## So funktioniert die Kennung

Beim Import wird die Kennung (`code`) aus dem JSON **übernommen**, solange sie noch frei ist.
Hat eine Datei keine Kennung, bekommt sie beim ersten Import automatisch eine.
Deshalb funktioniert Datei **E** direkt: Sie trägt dieselbe Kennung wie A und wird auch nach
dem Umbenennen als Update von A erkannt.

**Stand-Warnung testen:** Importiere A, bearbeite es einmal in der App (Original ersetzen –
der Stand zählt hoch). Importiere dann E erneut → die App warnt, dass dein Programm
zwischenzeitlich geändert wurde und beim Aktualisieren die Änderungen verloren gingen.

Mit einem eigenen App-Export (Teilen → „Als Datei") geht es genauso, dann sind auch deine
aktuellen Arbeitsgewichte als Startgewichte enthalten.
