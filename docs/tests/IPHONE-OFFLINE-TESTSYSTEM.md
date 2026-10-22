# iPhone-Prüfung außerhalb der App

Stand: 22.10.2026 · Satzkraft v0.38.0

Der frühere Testassistent ist auf Nutzerwunsch vollständig entfernt. Für die echte Durchführung gibt es nur die [kurze Handy-Checkliste](SMARTPHONE-ABNAHME.md). Kein Admin-Menü und keine Ergebnisverwaltung in der App.

## Automatisierte Simulation

`npm run test:iphone` startet einen eigenen lokalen WebKit-Browser mit dem installierten Playwright-Profil **iPhone 17 Pro**. Der Test startet seinen eigenen Server auf einem freien lokalen Port und beendet ihn anschließend. Testdaten werden nur in diesem isolierten Browser angelegt. Kein Zugriff auf den persönlichen Safari-Speicher oder die Live-Trainingsdaten.

- Profil: Bildschirm 402 × 874, Browserfläche 402 × 681 CSS-Pixel, Pixelfaktor 3, Touch aktiviert.
- Normale App per `tap()` bedienen; Touch-Ereignisse müssen tatsächlich ankommen.
- Satzwerte, Zeit mit Gewicht, Satzpause, Einstellungen und persönliche Bibliothek prüfen.
- Knöpfe auf Größe, sichtbare Lage und fremde Überdeckung prüfen; grundsätzlich mindestens 44 × 44 CSS-Pixel.
- Wenig Platz: 402 × 360 Pixel; zusätzlich Querformat 756 × 352 Pixel.
- Nicht antippbare Randflächen im Testbrowser: hochkant oben 62/unten 34 Pixel, quer seitlich 62/unten 21 Pixel. Das sind bewusst gewählte Stresswerte, keine vermessenen iOS-Systemleisten. Ausschließlich im Testbrowser werden die vorhandenen CSS-`env(safe-area-inset-...)`-Werte ersetzt, um die ausgelieferten Abstandsregeln zu prüfen. Die App erhält keinen Simulator oder versteckte Testschalter.
- Service Worker laden und Satzwerte mit abgeschalteter Browser-Netzwerkverbindung eingeben. Für den anschließenden Cache-Neustart den eigenen lokalen Server vollständig stoppen, dessen Nichterreichbarkeit unabhängig prüfen und gespeicherte Sätze sowie pausiertes Training vergleichen. Der Browser-Offlineschalter wird vor dem Reload zurückgenommen (siehe Grenze unten). Vollständiges Backup herunterladen und bei weiterhin unerreichbarem Server wiederherstellen.
- Alter Testmodus-Schalter darf keine Testdaten öffnen; Altbestand bleibt erhalten. Alte Testbackups dürfen echte Trainingsdaten nicht überschreiben.

Spezifikation: `qa/playwright/iphone17.spec.js`, eigene Konfiguration `qa/playwright/iphone17.config.cjs`. Die frühere Assistentenprüfung REG-31 und Versionsauswahl REG-32 entfallen mit der entfernten Funktion; REG-31 deckt nun Rückkehr zu echten Daten und die normale mobile Bedienung ab. Separate Node-Prüfungen sichern Ausbau, Schlüsselwahl und Importgrenze.

## Was dabei nicht simuliert wird

Playwright emuliert Geräteeigenschaften und Browserverhalten, kein vollständiges iOS. Das Profil bestimmt weder die tatsächlich installierte iOS-Version noch beweist sein User-Agent eine solche Version. Der kleinere Ausschnitt prüft Platzbedarf, nicht das genaue `visualViewport`- und Scrollverhalten der iPhone-Tastatur. Dynamische Safari-Leisten, Dynamic Island, Home-Geste, physische Trefferquote, Displaysperre und iOS-Prozessbeendigung bleiben offen.

Die installierte Playwright-Version 1.61.0 bricht einen WebKit-Neustart bei gesetztem Offline-Schalter intern ab. Das entspricht dem [dokumentierten Automatisierungsfehler](https://github.com/microsoft/playwright/issues/42775). Der Test umgeht ihn durch einen wirklich abgeschalteten lokalen Server; das prüft Cache-Fallback bei Serverausfall, nicht den iOS-Flugmodus. Es wird kein fehlerhafter Reload als bestanden gezählt.

Auf diesem Mac sind nur die Apple Command Line Tools vorhanden; `xcrun simctl` ist nicht verfügbar. Ein echter Apple-Simulator benötigt eine eingerichtete Xcode-Installation mit passender iOS-Laufzeit. Das wurde nicht installiert und nicht als durchgeführt ausgegeben.

Quellen: [Playwright-Geräteemulation](https://playwright.dev/docs/emulation), [Apple: iPhone 17 Pro](https://support.apple.com/en-us/125090). Apple nennt 1206 × 2622 physische Pixel; das verwendete CSS-Profil stammt aus der lokal installierten Playwright-Version 1.61.0.

## Prüfstand

- **Bestanden:** zehn gezielte Node-Fälle (Ausbau/Datenschutzgrenze, Version und Cache) und ein kompletter REG-31-Lauf im Projekt `iphone-17-pro` (WebKit, 8,7 Sekunden).
- **Im Browser bestätigt:** normale Daten trotz altem Testschalter; keine Testoberfläche; echte Touch-Ereignisse; offline 10 Wiederholungen/20 kg und 45 Sekunden/12,5 kg; Eingabe bei 402 × 360 Pixeln; Satzpause; gespeicherte Werte und pausiertes Training nach Cache-Neustart; alte Testdatei abgewiesen; persönliche Übung; Querformat; Schließen nach Scrollen; Hell/Dunkel; vollständiger Backup-Download, Sicherheitskopie und Wiederherstellung bei weiterhin abgeschaltetem Server. Keine JavaScript- oder HTTP-5xx-Fehler.
- **Gefunden und korrigiert:** Stoppknopf der Satzpause war nur etwa 29 px breit; untere Leistenknöpfe haben jetzt mindestens 44 px. Die kompakte Feldregel überschrieb die Eingabeschrift mit 13 px; fokussierte Satzfelder verwenden jetzt 16 px.
- **Gesichtet:** [Normale App](../../replica/clone-screens/iphone17-normal-app-v0.38.0.png) und [wenig Platz beim Eingeben](../../replica/clone-screens/iphone17-short-viewport-v0.38.0.png). Ausschließlich synthetische Trainingsdaten.
- **Build:** 13 öffentliche Dateien, kein Testmodul; Diff- und Syntaxprüfung bestanden.
- **Offen:** physisches iPhone 17 Pro, echte Tastatur, Safari-Leisten und Flugmodus-Neustart. Keine vollständige App-Suite ausgeführt.

Beim ersten Einrichten erbte die neue Konfiguration versehentlich vier weitere Browserprojekte. Der neue einzelne Fall scheiterte dort früh; der Lauf wurde abgebrochen und die Konfiguration anschließend auf genau ein Projekt begrenzt. Weitere Fehlläufe dienten der Korrektur der genannten UI-Befunde, der Testreihenfolge und des WebKit-Offline-Harness. Nur der abschließende erfolgreiche Lauf ist als bestanden ausgewiesen. Bestehende App-Suite und Screenshot-Baselines wurden nicht ausgeführt beziehungsweise aktualisiert.

## Bestehende Testdaten

Alte getrennte Testdaten und Berichte werden nicht automatisch gelöscht oder übernommen. Sie sind aus der normalen App nicht zugänglich und nicht Teil eines Trainingsbackups. Die bewusst bestätigte Funktion „Alle lokalen App-Daten löschen“ umfasst diesen Altbestand weiterhin. Alte markierte Testbackups werden mit verständlichem Hinweis abgelehnt.
