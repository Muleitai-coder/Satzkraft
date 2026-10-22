# Satzkraft kostenlos auf deinem iPhone testen

Stand: 22.10.2026 · Vorbereitung auf Basis von Satzkraft 0.38.0, iPhone-Build 1.

Das iPhone-Projekt ist vorbereitet. Auf dem Handy installiert ist es noch nicht. Dafür brauchst du Xcode auf deinem Mac, deinen normalen Apple Account und dein iPhone mit Kabel. Ein bezahltes Entwicklerabo ist für diesen persönlichen Test nicht nötig. TestFlight kommt gegebenenfalls später.

## 1. Xcode auf dem Mac einrichten

Dein gemeldetes Testgerät ist ein **iPhone 17 Pro mit iOS 27.0.1**. Auf dem Mac wurden **macOS 15.7.9**, Modellkennung **MacBookPro16,1** und nur die Kommandozeilenwerkzeuge gefunden; das vollständige Xcode fehlt.

Für eine Entwicklungsumgebung mit iOS-27-SDK und passendem Simulator empfehle ich **Xcode 27 oder neuer**. Xcode 27/27.1 setzt laut Apples Tabelle **macOS Tahoe 26.6 oder neuer** voraus. Dein MacBook Pro (16 Zoll, 2019) wird von Tahoe unterstützt. Die angebotene kompatible Aktualisierung findest du unter **Systemeinstellungen → Allgemein → Softwareupdate**. Vor einem Betriebssystemwechsel ein Mac-Backup erstellen. Das Projekt installiert oder aktualisiert macOS nicht selbst.

Quelle: [Xcode-Systemanforderungen](https://developer.apple.com/xcode/system-requirements), [Mac-Modell erkennen](https://support.apple.com/en-euro/108052), [Tahoe-kompatible Macs](https://support.apple.com/en-mide/122867).

Xcode 26.3 läuft noch auf deinem bisherigen macOS. Apples Tabelle nennt auch dort neuere physische Geräte ohne feste Obergrenze. Ob die konkrete Verbindung mit deinem iOS 27.0.1 funktioniert, ist jedoch ungeprüft; ein iOS-27-Simulator gehört nicht zu diesem älteren Paket. Ein macOS-Upgrade ist daher Voraussetzung für den oben empfohlenen Xcode-27-Weg, nicht pauschal für jeden denkbaren Geräteversuch.

Nach der Auswahl der passenden Mac-Version:

1. **Xcode** kostenlos aus dem Mac App Store installieren.
2. Xcode einmal öffnen. Die angebotenen iOS-Komponenten laden; Apple-Bedingungen selbst prüfen und bestätigen.
3. **Xcode → Settings → Accounts / Apple Accounts → +** öffnen und mit deinem Apple Account anmelden.

## 2. Satzkraft öffnen und aufspielen

Das Projekt liegt unter `native/ios/App/App.xcodeproj` im Satzkraft-Ordner. Die App-Dateien sind im jetzigen Arbeitsstand bereits vorbereitet. Bei einem frischen Download des Projekts oder nach Änderungen zuerst den unten genannten Vorbereitungsbefehl ausführen lassen.

1. **App.xcodeproj** in Xcode öffnen. Warten, bis die Abhängigkeiten geladen sind.
2. Links das blaue Projekt **App**, dann unter Targets **App** auswählen.
3. Unter **Signing & Capabilities**: **Automatically manage signing** einschalten und als **Team** dein **Personal Team** wählen. Keine zusätzlichen Capabilities aktivieren.
4. Falls `de.satzkraft.app` für dein Team nicht verfügbar ist: eine eigene eindeutige Kennung eintragen, zum Beispiel `de.deinkuerzel.satzkraft`. Diese Kennung anschließend beibehalten und auch in der Capacitor-Konfiguration nachziehen lassen. Bei späteren Änderungen der Kennung entsteht eine separate App mit separaten Daten.
5. iPhone per Kabel anschließen, entsperren und **Diesem Computer vertrauen** bestätigen.
6. Wenn Xcode darum bittet: am iPhone unter **Einstellungen → Datenschutz & Sicherheit → Entwicklermodus** aktivieren und den verlangten Neustart bestätigen. Falls die App danach noch nicht startet, die Entwicklerfreigabe unter **Allgemein → VPN und Geräteverwaltung** prüfen.
7. Oben in Xcode dein **iPhone** als Ziel wählen und **▶︎** drücken. Satzkraft sollte anschließend als eigenes App-Symbol erscheinen.

Die Anmeldung, Apple-Bedingungen und Gerätefreigaben übernimmst du selbst. Noch kein signierter Build, keine Installation und kein echter Simulatorlauf wurden bestätigt.

## 3. Deine bisherigen Daten mitnehmen

Safari und die iPhone-App besitzen getrennte Speicher. Es erfolgt keine automatische Übernahme.

1. In der bisherigen Satzkraft-Web-App: **Einstellungen → vollständiges Backup** speichern.
2. In der iPhone-App: **Programme** öffnen, nach unten zu **Daten sichern → Backup wiederherstellen** scrollen. Die JSON-Datei auswählen.
3. Die Sicherheitskopie des bisherigen App-Stands über **In Dateien sichern** ablegen. Erst nach dem Prüfen der Datei die Wiederherstellung bestätigen.
4. Prüfen, ob Programme und letzte Trainingswerte stimmen.

Zurück nach Safari geht es genauso per vollständigem Backup.

## 4. Erster Test auf dem iPhone – etwa fünf Minuten

Beim ersten Durchlauf mit wenigen bewusst eingetragenen Probewerten arbeiten. Ergebnisse hier notieren; es gibt dafür keine zusätzliche Testoberfläche in der App.

- [ ] **Start:** Satzkraft über das neue App-Symbol öffnen. Die normale Trainingsansicht erscheint.
- [ ] **Tastatur:** Training starten, Wiederholungen und Gewicht eintragen. Das aktive Feld bleibt sichtbar, lässt sich antippen und über die Tastaturleiste wieder verlassen.
- [ ] **Bildschirmränder:** Obere Knöpfe sowie Pause/Stopp unten erreichen. Auch im Querformat prüfen. Uhrzeit, Dynamic Island und Home-Balken verdecken keine Bedienung.
- [ ] **Offline:** Flugmodus einschalten und WLAN zusätzlich ausschalten. Einen weiteren Satz eintragen und kurz auf „Gespeichert“ warten.
- [ ] **Neustart:** App über den App-Umschalter schließen und weiterhin offline neu öffnen. Die Werte sind noch vorhanden. Ein offenes Training darf wie in der Web-App pausiert wiederkehren.
- [ ] **Unterbrechung:** Handy kurz sperren, wieder entsperren und kontrollieren, dass Eingaben/Training sinnvoll weitergehen. Pausentöne im Hintergrund sind noch nicht als native Funktion zugesagt.
- [ ] **Backup:** Verbindung wieder einschalten, Backup → **In Dateien sichern**. Das Teilen einmal abbrechen: Der vorhandene Stand bleibt erhalten. Danach erfolgreich speichern und erst nach Dateiprüfung wiederherstellen.

Notizen: `Schritt · was ich erwartet habe · was tatsächlich passiert ist`. Modell und iOS-Version dazuschreiben. Die längere [Handy-Checkliste](tests/SMARTPHONE-ABNAHME.md) bleibt verfügbar.

## Wie lange funktioniert die kostenlose Installation?

Apples kostenlose Personal-Team-Profile laufen nach **sieben Tagen** ab. Danach die App erneut aus Xcode auf dasselbe iPhone installieren. App und Kennung dabei beibehalten; die App nicht vorher löschen. Ein eigenes Backup zusätzlich außerhalb der App aufbewahren. [Apple erklärt Personal Teams und die Fristen](https://developer.apple.com/help/account/basics/about-your-developer-account).

## Für die Projektbetreuung

Im Satzkraft-Hauptordner:

```sh
npm run ios:prepare
npm run ios:doctor
npm run ios:open
```

`ios:prepare` installiert die festgeschriebenen Abhängigkeiten im separaten `native/`-Ordner, erstellt die App-Dateien und synchronisiert das Xcode-Projekt. Nach späteren Änderungen genügt bei bereits installierten Abhängigkeiten `npm run ios:sync`. `ios:doctor` prüft die lokale Einrichtung, unterschreibt und installiert aber keine App.

Prüfstand: acht gezielte Node-Fälle sowie ein WebKit-Ablauf mit nachgebildeten nativen Schnittstellen bestanden. Native Speicherfreigaben, echter Dateidialog, Tastatur, Prozessabbruch und Offline-Kaltstart müssen auf dem iPhone bestätigt werden. [Technik und Grenzen](../native/README.md).
