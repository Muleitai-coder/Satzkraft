# Prüfbericht v0.39.0 – 25.10.2026

## Umfang

Datenrettung bei nicht lesbarem Hauptspeicher, Backup-Verträge, gemeinsame Quellstruktur, Designvertrag und native Build-Aktualität. Keine Änderung an Progressionsberechnungen oder gespeicherten Schema-/Programmversionen.

## Ausgeführt

| Prüfung | Ergebnis |
| --- | --- |
| `tests/backup.test.cjs`, `tests/storage-coordination.test.cjs`, `tests/local-data-privacy.test.cjs` | 25 Fälle bestanden |
| `native/tests/native.test.mjs`, `native/tests/freshness.test.mjs` | 9 Fälle bestanden |
| `tests/publish.test.cjs`, `tests/version.test.cjs` | 3 Fälle bestanden; 13 veröffentlichte Dateien |
| `tests/training-flow.test.cjs`, nur „allows page zoom …“ | 1 Fall bestanden |
| WebKit, nur DATA-01 unter `integrity.config.cjs` | Bestanden: beschädigter Speicher bleibt über Reload erhalten; Rohdatei stimmt bytegenau; Neustart erst nach Bestätigung; Restore-Abbruch bewahrt aktuellen Stand |
| WebKit, nur NATIVE-01 unter `native.config.cjs` | Bestanden: Training, native Speicherabbildung, abgebrochene Dateifreigabe, Fehler/Wiederholen, bestätigter Restore |
| Quellassembler und `check:architecture` | Syntax, Manifest, Core-Grenze, Tokens und Artefaktgleichheit geprüft |
| `ios:sync` | Paket aufgebaut und in Xcode-Projekt kopiert |
| Native Quell- und Dateihashes | Xcode-App-Dateien stimmen mit gemeinsamem Quellstand überein |
| `plutil -lint native/ios/App/App/Info.plist` | Bestanden |

38 gezielte Node-Fälle und zwei gezielte Browserabläufe, keine vollständige Suite. Ein älterer Datenschutztest erwartete noch neun Speicherschlüssel; seine Erwartung umfasst nun auch den bereits zuvor ausdrücklich zur Komplettlöschung gehörenden Testaltbestand. Kein fachlicher Schutz wurde entfernt.

## Grenzen

Der native Browserlauf nutzt Plugin-Doubles und belegt keinen Swift-Build oder dauerhafte Speicherung auf Hardware. `ios:doctor` bestätigt aktuelle Assets, meldet aber fehlendes beziehungsweise nicht ausgewähltes Xcode; sein Exitcode bleibt deshalb 1. Signierung, echte Dateidialoge, VoiceOver, Tastatur, Offline-Kaltstart und Prozessbeendigung am iPhone sind weiterhin offen.

Der Auftrag lief neben Änderungen an Übungsverläufen. Diese wurden beim Umzug in die Quellbereiche erhalten, bleiben aber getrennte uncommittete Änderungen. Der eigene Commit enthält die Fehlerbehebung und Architekturgrundlage mit dem zuvor bestehenden Verlaufsstand. Die vorhandenen Quelltext-Extraktionstests bleiben erhalten; die UI-Einheiten sind noch im gemeinsamen Funktionsraum, wie im Architekturvertrag dokumentiert.
