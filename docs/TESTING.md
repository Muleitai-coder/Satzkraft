# Teststrategie

Ziel ist schnelles Feedback ohne wiederholte Komplettabnahmen. Geprüft wird risikobasiert und nur so breit wie die aktuelle Änderung.

## Standard bei normalen Änderungen

1. Betroffene Dateien und vorhandenen Diff ansehen.
2. `git diff --check` ausführen.
3. Wenn sich Verhalten geändert hat, genau die direkt passende Testdatei ausführen, zum Beispiel:

   ```bash
   node --test tests/program-editor.test.cjs
   ```

4. Bei UI-Änderungen höchstens den betroffenen Playwright-Fall und ein Browserprojekt ausführen, sofern eine Browserprüfung wirklich nötig ist. Ein gezielter Lauf wird über `--grep` und `--project` eingeschränkt.
5. Nach einem erfolgreichen Lauf nicht unverändert erneut testen.

Reine Dokumentations-, Dateiordnungs- und Arbeitsregeländerungen benötigen keine App-Suite.

## Große Tests – nur auf ausdrücklichen Nutzerbefehl

Folgende Befehle sind absichtlich mit `all` benannt und werden nicht automatisch ausgeführt:

```bash
npm run test:all:unit
npm run test:all:e2e
npm run test:all:e2e:functional
npm run test:all:e2e:visual
npm run test:all
```

Auch `npm run test:update:visual` läuft nur auf ausdrücklichen Befehl, da es versionierte Screenshot-Baselines verändert.

## Auswahlhilfe

| Änderung | Standardprüfung |
|---|---|
| Dokumentation, Ordner, Arbeitsregeln | `git diff --check`, Pfad-/Linkprüfung |
| Einzelne pure Funktion | direkt betroffene Node-Testdatei |
| Datenformat oder Import | betroffene Validierungs-/Backup-Testdatei |
| Kleine UI-Logik | betroffene Node-Testdatei; optional ein gezielter Browserfall |
| Rein visuelle Änderung | ein Motiv, ein Browserprojekt; große Matrix nur auf Befehl |
| Releasevorbereitung | Versionsprüfung; Komplettabnahme nur auf Befehl |

Ein fehlender großer Test wird im Abschlussbericht transparent genannt, ist aber kein Grund, ihn ungefragt zu starten.
