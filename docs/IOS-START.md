# Satzkraft kostenlos auf deinem iPhone testen

Einrichtungsstand: 29.10.2026. Satzkraft 0.39.0 / Build 1 ist mit deinem kostenlosen Personal Team signiert und auf deinem iPhone 17 Pro mit iOS 27.0.1 installiert. Der Start wurde technisch bestätigt; du hast die normale App-Oberfläche auf dem Handy bestätigt.

Du kannst das Kabel jetzt abziehen und Satzkraft über das eigene App-Symbol öffnen. Für spätere Installationen brauchst du weiterhin Xcode auf deinem Mac, deinen normalen Apple Account und die Verbindung zum iPhone. Ein bezahltes Entwicklerabo ist für diesen persönlichen Test nicht nötig. TestFlight kommt gegebenenfalls später. Tastatur, Datenerhalt und Offline-Betrieb sind mit der kurzen Checkliste unten noch praktisch zu prüfen.

## 1. Xcode auf dem Mac einrichten

Dein gemeldetes Testgerät ist ein **iPhone 17 Pro mit iOS 27.0.1**. Dein **MacBook Pro von 2019 mit Intel Core i9** (MacBookPro16,1) läuft mit **macOS Tahoe 26.7.1**. **Xcode 26.6 Universal (Build 17F113) ist seit dem 29.10.2026 unter `/Applications/Xcode.app` installiert.** Apple-Archivsignatur, Programmsignatur, macOS-Sicherheitsbewertung und Intel-Architektur wurden geprüft; `xcodebuild -version` bestätigt die Version. `xcode-select` zeigt auf diese Installation.

**Vorbereitung, Signierung und Installation erledigt:** Grundkonfiguration, Aktualitätsprüfung und zunächst unsignierter Build bestanden. Nach deiner Team-Auswahl bestand auch der signierte Debug-Build für das angeschlossene iPhone. `codesign --verify --deep --strict` bestätigt die App-Signatur; das eingebettete Entwicklungsprofil passt zu Satzkraft und diesem Gerät. Installation und anschließender App-Start über `devicectl` waren erfolgreich.

**Von dir freigegeben:** Apple Account und Personal Team in Xcode, Kabelverbindung mit Vertrauen zum Mac, Entwicklermodus samt Neustart sowie Vertrauen zum Entwicklerprofil auf dem iPhone. Die letzte Freigabe unter **Allgemein → VPN & Geräteverwaltung** war nach der Installation noch nötig; danach startete Satzkraft. Persönliche Team-Zuordnung und Signierdaten bleiben lokal und werden nicht auf GitHub hochgeladen.

**Xcode 27 läuft ausschließlich auf Macs mit Apple-Chip.** Die frühere Empfehlung, auf diesem Intel-Mac nach dem macOS-Update Xcode 27 zu installieren, war falsch. Ein weiteres macOS-Update behebt diese Prozessorgrenze nicht.

Für diesen Mac verwenden wir **Xcode 26.6 in der Universal-Ausgabe**, die Intel unterstützt. Die macOS-Voraussetzung ab Tahoe 26.2 ist erfüllt; Capacitor 8 benötigt Xcode ab 26.0. Ältere Xcode-Versionen gibt es direkt bei Apple nach Anmeldung mit einem normalen Apple Account, ohne kostenpflichtige Mitgliedschaft.

**Bestätigte Kombination:** Xcode 26.6 mit iOS-26.5-SDK konnte Satzkraft für dein echtes iPhone mit iOS 27.0.1 signieren, installieren und starten. Es ist weiterhin kein iOS-27-Simulator vorhanden. Die sichtbare Startseite bestätigt noch keine vollständige Funktions- oder Offline-Abnahme.

Quellen: [Apples Hinweis zu Xcode auf Intel-Macs](https://developer.apple.com/documentation/apple-silicon/porting-just-in-time-compilers-to-apple-silicon), [Xcode-Systemanforderungen](https://developer.apple.com/xcode/system-requirements), [ältere Versionen ohne Bezahlabo](https://developer.apple.com/xcode/resources/), [Capacitor-8-Voraussetzungen](https://capacitorjs.com/docs/ios).

Die folgenden Schritte sind auf diesem Mac erledigt. Bei einer erneuten Einrichtung:

1. Die [Apple-Downloads für Xcode 26.6](https://developer.apple.com/download/all/?q=Xcode%2026.6) öffnen und selbst bei Apple anmelden.
2. Das vollständige **Xcode 26.6** herunterladen. Bei mehreren Ausgaben **Universal** wählen; die nur für Apple-Chips angebotene Ausgabe läuft auf diesem Mac nicht. Die „Command Line Tools“ allein reichen nicht.
3. Das Apple-Archiv entpacken und Xcode im Programme-Ordner installieren lassen.
4. Xcode einmal öffnen. Benötigte iOS-Komponenten laden; Apple-Bedingungen selbst prüfen und bestätigen.
5. **Xcode → Settings → Accounts / Apple Accounts → +** öffnen und mit deinem Apple Account anmelden.

## 2. Satzkraft öffnen und aufspielen

Das Projekt liegt unter `native/ios/App/App.xcodeproj` im Satzkraft-Ordner. Die App-Dateien sind im jetzigen Arbeitsstand bereits vorbereitet. Bei einem frischen Download des Projekts oder nach Änderungen zuerst den unten genannten Vorbereitungsbefehl ausführen lassen.

1. **App.xcodeproj** in Xcode öffnen. Warten, bis die Abhängigkeiten geladen sind.
2. Links das blaue Projekt **App**, dann unter Targets **App** auswählen.
3. Unter **Signing & Capabilities**: **Automatically manage signing** einschalten und als **Team** dein **Personal Team** wählen. Keine zusätzlichen Capabilities aktivieren.
4. Falls `de.satzkraft.app` für dein Team nicht verfügbar ist: eine eigene eindeutige Kennung eintragen, zum Beispiel `de.deinkuerzel.satzkraft`. Diese Kennung anschließend beibehalten und auch in der Capacitor-Konfiguration nachziehen lassen. Bei späteren Änderungen der Kennung entsteht eine separate App mit separaten Daten.
5. iPhone per Kabel anschließen, entsperren und **Diesem Computer vertrauen** bestätigen.
6. Wenn Xcode darum bittet: am iPhone unter **Einstellungen → Datenschutz & Sicherheit → Entwicklermodus** aktivieren, den verlangten Neustart bestätigen und anschließend nochmals aktivieren.
7. Oben in Xcode dein **iPhone** als Ziel wählen und **▶︎** drücken. Satzkraft sollte anschließend als eigenes App-Symbol erscheinen.
8. Falls iOS den Start wegen des Entwicklerprofils blockiert: **Einstellungen → Allgemein → VPN & Geräteverwaltung** öffnen, unter **Entwickler-App** deinen Apple Account auswählen und die Vertrauensfreigabe bestätigen. Danach Satzkraft erneut öffnen. [Apple beschreibt diesen Schritt für Personal Teams](https://developer.apple.com/documentation/swiftui/food-truck-building-a-swiftui-multiplatform-app).

Die Anmeldung, Apple-Bedingungen und Gerätefreigaben übernimmst du selbst. Signierter Build, Installation und sichtbarer Start auf deinem iPhone sind bestätigt. Ein echter Simulatorlauf wurde nicht durchgeführt.

## 3. Deine bisherigen Daten mitnehmen

Safari und die iPhone-App besitzen getrennte Speicher. Es erfolgt keine automatische Übernahme.

1. In der bisherigen Satzkraft-Web-App: **Einstellungen → vollständiges Backup** speichern.
2. In der iPhone-App: **Programme** öffnen, nach unten zu **Daten sichern → Backup wiederherstellen** scrollen. Die JSON-Datei auswählen.
3. Die Sicherheitskopie des bisherigen App-Stands über **In Dateien sichern** ablegen. Erst nach dem Prüfen der Datei die Wiederherstellung bestätigen.
4. Prüfen, ob Programme und letzte Trainingswerte stimmen.

Zurück nach Safari geht es genauso per vollständigem Backup.

## 4. Erster Test auf dem iPhone – etwa fünf Minuten

Beim ersten Durchlauf mit wenigen bewusst eingetragenen Probewerten arbeiten. Ergebnisse hier notieren; es gibt dafür keine zusätzliche Testoberfläche in der App.

- [x] **Start:** Installation und App-Start erfolgreich; normale Satzkraft-Oberfläche am 29.10.2026 vom Nutzer auf dem iPhone bestätigt.
- [ ] **Tastatur:** Training starten, Wiederholungen und Gewicht eintragen. Das aktive Feld bleibt sichtbar, lässt sich antippen und über die Tastaturleiste wieder verlassen.
- [ ] **Bildschirmränder:** Obere Knöpfe sowie Pause/Stopp unten erreichen. Auch im Querformat prüfen. Uhrzeit, Dynamic Island und Home-Balken verdecken keine Bedienung.
- [ ] **Offline:** Flugmodus einschalten und WLAN zusätzlich ausschalten. Einen weiteren Satz eintragen und kurz auf „Gespeichert“ warten.
- [ ] **Neustart:** App über den App-Umschalter schließen und weiterhin offline neu öffnen. Die Werte sind noch vorhanden. Ein offenes Training darf wie in der Web-App pausiert wiederkehren.
- [ ] **Unterbrechung:** Handy kurz sperren, wieder entsperren und kontrollieren, dass Eingaben/Training sinnvoll weitergehen. Pausentöne im Hintergrund sind noch nicht als native Funktion zugesagt.
- [ ] **Backup:** Verbindung wieder einschalten, Backup → **In Dateien sichern**. Das Teilen einmal abbrechen: Der vorhandene Stand bleibt erhalten. Danach erfolgreich speichern und erst nach Dateiprüfung wiederherstellen.

Notizen: `Schritt · was ich erwartet habe · was tatsächlich passiert ist`. Modell und iOS-Version dazuschreiben. Die längere [Handy-Checkliste](tests/SMARTPHONE-ABNAHME.md) bleibt verfügbar.

## Wie lange funktioniert die kostenlose Installation?

Apples kostenlose Personal-Team-Profile laufen nach **sieben Tagen** ab. Danach die App erneut aus Xcode auf dasselbe iPhone installieren. App und Kennung dabei beibehalten; die App nicht vorher löschen. Ein eigenes Backup zusätzlich außerhalb der App aufbewahren. [Apple erklärt Personal Teams und die Fristen](https://developer.apple.com/help/account/basics/about-your-developer-account).

Das tatsächlich installierte Profil läuft am **05.11.2026 um 23:25 Uhr (Europe/Berlin)** ab. Für einen weiteren Test dann erneut signieren und auf dasselbe iPhone aufspielen.

## Für die Projektbetreuung

Im Satzkraft-Hauptordner:

```sh
npm run ios:prepare
npm run ios:doctor
npm run ios:open
```

`ios:prepare` installiert die festgeschriebenen Abhängigkeiten im separaten `native/`-Ordner, erstellt die App-Dateien und synchronisiert das Xcode-Projekt. Nach späteren Änderungen genügt bei bereits installierten Abhängigkeiten `npm run ios:sync`. `ios:doctor` prüft die lokale Einrichtung, unterschreibt und installiert aber keine App.

Prüfstand: neun gezielte Node-Fälle sowie ein WebKit-Ablauf mit nachgebildeten nativen Schnittstellen bestanden bereits vor der Xcode-Einrichtung. Am 29.10.2026 zusätzlich bestätigt: Grundkonfiguration, Aktualität des nativen Pakets, unsignierter und signierter Debug-Build, Signatur und Gerätezuordnung des Entwicklungsprofils, Installation, technischer App-Start und sichtbare Oberfläche auf dem echten iPhone. Keine unveränderte App-Suite erneut ausgeführt. Native Speicherfreigaben, echter Dateidialog, Tastatur, Prozessabbruch und Offline-Kaltstart müssen auf dem iPhone bestätigt werden. [Technik und Grenzen](../native/README.md).
