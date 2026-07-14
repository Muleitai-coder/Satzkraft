# Satzkraft – Ausbauplan für Konten, Datenbank und Desktop-Editor

Stand: Satzkraft v0.12.0. Die aktuelle App speichert Programme und Trainingsfortschritt lokal im Browser. Das bleibt zunächst als Gastmodus erhalten.

## Empfohlene Zielarchitektur

Als nächster technischer Schritt bietet sich Supabase an: PostgreSQL-Datenbank, Anmeldung und Zugriffsregeln kommen aus einer Plattform. Die App darf im Browser nur den öffentlichen Schlüssel verwenden. Alle persönlichen Tabellen werden mit Row Level Security geschützt; ein geheimer Service-Schlüssel gehört niemals in `index.html`.

Quellen: [Supabase Auth](https://supabase.com/docs/guides/auth), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Daten im Frontend absichern](https://supabase.com/docs/guides/database/secure-data).

## Datenmodell

- `profiles`: Benutzername und persönliche Einstellungen; verweist auf den geschützten Auth-Benutzer.
- `programs`: Programmkopf mit Besitzer, Herkunft (`official` oder `user`) und Sichtbarkeit.
- `program_versions`: unveränderliche Versionen des eigentlichen Programm-JSON. So überschreibt ein Update von Satzkraft keine private Anpassung.
- `user_programs`: Zuordnung eines Benutzers zu einem Programm, aktive Version und persönliche Programmeinstellungen.
- `training_sessions`: einzelne absolvierte Trainingseinheiten.
- `set_entries`: Sätze, Wiederholungen, Gewicht, RIR und Zeit je Einheit.

Offizielle Satzkraft-Programme haben keinen privaten Besitzer und werden nur durch einen Admin-Prozess veröffentlicht. Selbst erstellte Programme gehören immer dem angemeldeten Benutzer. Eine Kopie eines offiziellen Programms wird als neues privates Programm gespeichert und behält optional eine Referenz auf die Vorlage.

## Umsetzung in sicheren Etappen

1. Datenmodell und Anmeldung in einer getrennten Entwicklungsumgebung aufbauen. E-Mail-Code oder Magic Link hält den Einstieg einfacher als ein zusätzliches Passwort.
2. Gastmodus erhalten und lokale Daten erst nach ausdrücklicher Bestätigung mit einem Konto verbinden. Vor der ersten Synchronisierung automatisch ein Backup anbieten.
3. Persönliche Programme und Fortschritt synchronisieren. Konflikte niemals still überschreiben; „lokale Version“, „Cloud-Version“ oder „als Kopie behalten“ anbieten.
4. Offizielle Programmbibliothek ergänzen: Suche, Ziel, Erfahrungsstufe, Trainingstage und Equipment als Filter. Import mit KI und JSON bleibt vollständig erhalten.
5. Erst danach Freigaben, Trainer-Zugriff oder Teilen zwischen Benutzern planen.

## Sicherheitsregeln

- Jede persönliche Tabelle erhält eine Regel nach dem Prinzip `auth.uid() = owner_id`.
- Rollen und Berechtigungen nicht aus frei bearbeitbaren Benutzer-Metadaten ableiten.
- KI-Aufrufe bleiben in einer Server-Funktion; API-Schlüssel dürfen nie an den Browser ausgeliefert werden.
- Backups bleiben auch mit Cloud-Konto verfügbar.
- Löschen eines Kontos und Export aller persönlichen Daten von Beginn an mitplanen.

## Laptop- und Desktop-Editor

Die Daten und Editor-Funktionen bleiben identisch. Ab einer größeren Breite kann eine eigene Anordnung zugeschaltet werden: links Tage und Übungen, rechts die Einstellungen der gewählten Übung; Wochen als kompakte Seitenleiste. Damit wird das Erstellen am Laptop schneller, ohne zwei verschiedene Apps pflegen zu müssen. Mobile bleibt einspaltig und für Training sowie kleine Korrekturen optimiert.

Das ist bewusst eine spätere Ausbaustufe. Zuerst sollten mobile Sortierung, Editor-Verständlichkeit und Datensicherheit stabil sein.
