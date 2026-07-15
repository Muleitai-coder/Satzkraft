# Verbindliche Arbeitsregeln für Satzkraft

Diese Regeln gelten für jede Arbeit in diesem Repository. `BRIEFING-CODEX.md` enthält die fachlichen Produkt- und Architekturregeln und muss vor Änderungen berücksichtigt werden.

## Abschluss eines Umsetzungsauftrags

Nach einer vollständig umgesetzten Änderung führt der umsetzende Agent den folgenden Ablauf selbstständig aus:

1. Die in `BRIEFING-CODEX.md` vorgeschriebenen gezielten Prüfungen, die gesamte Testsuite `node --test tests/` und `git diff --check` ausführen.
2. `git status` und den Diff prüfen. Nur Dateien aufnehmen, die zum aktuellen Auftrag gehören. Bereits vorhandene oder unklare Änderungen anderer Arbeiten nicht ungefragt committen.
3. Vor dem Commit prüfen, dass keine Zugangsdaten, API-Schlüssel, `.env`-Dateien, persönlichen Trainingsdaten, privaten Adressen oder sonstigen Geheimnisse enthalten sind.
4. Die zusammenhängende Änderung mit einer kurzen, aussagekräftigen deutschen Commit-Nachricht committen.
5. Den Commit automatisch auf den aktuellen Arbeitsbranch des eingerichteten `origin`-Repositories hochladen.
6. Im Abschlussbericht Commit, Branch, Testergebnis und Upload-Status nennen.

Der automatische Upload entfällt, wenn der Nutzer für den Auftrag ausdrücklich „nicht hochladen“ oder „nur lokal“ sagt.

## Sicherheitsgrenzen für GitHub

- Niemals `git push --force` oder `git push --force-with-lease` verwenden.
- Niemals ungefragt direkt auf einen anderen Branch wechseln, nach `main` mergen, einen Pull Request zusammenführen, einen Release erstellen oder einen Tag veröffentlichen.
- Wird ein Push wegen neuer Änderungen auf GitHub abgelehnt, nicht erzwingen: Remote-Stand sicher prüfen und den Konflikt melden.
- Bei fehlgeschlagenen Tests, unklarem Dateiumfang, möglichen Geheimnissen oder fehlender GitHub-Berechtigung nicht committen beziehungsweise nicht hochladen, sondern den Grund klar nennen.
- Keine pauschale Aufnahme aller Dateien, wenn dadurch nicht zum Auftrag gehörende Änderungen erfasst würden.
- Eine eventuell erforderliche Codex-Netzwerkfreigabe darf nur eng für den benötigten GitHub-Push erbeten werden.

## Dokumentation

- Nutzerrelevante App-Änderungen unter `Unreleased` in `CHANGELOG.md` dokumentieren.
- Neue verbindliche Produkt- oder Architekturentscheidungen in `BRIEFING-CODEX.md` ergänzen.
- Reine Arbeitsablauf-Änderungen erfordern keine neue sichtbare App-Version.
