# Testbericht · Satzkraft v0.33.4

**Stand:** 01.10.2026
**Branch:** `main`
**Ergebnis:** automatisch vollständig bestanden

## Zusammenfassung

| Prüfung | Ergebnis |
|---|---:|
| Unit- und Integrationstests | 273 bestanden, 0 fehlgeschlagen |
| Playwright · Desktop Chromium | 39 bestanden |
| Playwright · Desktop WebKit | 39 bestanden |
| Playwright · Mobile Chromium | 39 bestanden |
| Playwright · Mobile WebKit | 39 bestanden |
| Playwright gesamt | 156 bestanden, 0 fehlgeschlagen |
| Netlify-Build | 13 freigegebene Dateien erzeugt |
| Diff-Prüfung | bestanden |

## Besonders geprüfte Release-Punkte

- manuelle Zeiteingabe von rechts nach links einschließlich Rücktaste und mobiler Tastatur;
- gewichtete Zeitübungen, Stoppuhr und gültige Zeitbegrenzung;
- sichtbare, Safe-Area-geschützte Zurück- und Schließen-Aktionen im Programmeditor, auch nach dem Scrollen;
- iPhone-Unterkante des Programmeditors und mobile Touchziele;
- Programmimport, Editor-Speichern und automatische Reparatur fehlender Zeiteinheiten;
- Trainingsablauf, automatische Satzpause und nachgelagerte Tauschentscheidungen;
- Backup-Kompatibilität, Offline-PWA und Service-Worker-Cache;
- Coach-Abbruch, Zeitüberschreitung, Datenschutz- und Origin-Schutz;
- Darstellung ohne horizontalen Überlauf bei 320 Pixel Breite;
- visuelle Regression in fünf Motiven über alle vier Browserprojekte.

## Visuelle Kontrolle

Die 20 Darwin-Referenzbilder für Chromium und WebKit auf Desktop und Mobile wurden gemeinsam als Kontaktbogen geprüft. Karten, Zeitfelder, Programmbibliothek und Tauschdialog sind konsistent, vollständig sichtbar und ohne auffällige Überläufe.

## Verbleibende reale Geräteabnahme

Mobile WebKit ist die Safari-nahe automatisierte Prüfung, ersetzt aber kein physisches iPhone. Auf echter Hardware bleibt ein kurzer Smoke-Test sinnvoll: Programmeditor öffnen, weit nach unten scrollen, Sichtbarkeit von Zurück und X prüfen, Zeitwert über die Bildschirmtastatur eingeben und die App einmal in den Hintergrund schicken. Dieser Punkt blockiert den technisch geprüften Release nicht, ist aber als Praxisabnahme noch offen.
