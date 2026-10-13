'use strict';

// Liest ausschließlich den eigenen ausgelieferten Bestand; Ausgabe bleibt stdout.
const fs = require('node:fs');
const path = require('node:path');
const { validateCatalog, validatePerformance, describePerformance } = require('./contract.cjs');
const { createLegacyResolver } = require('./legacy-mapping.cjs');
const root = path.resolve(__dirname, '../../..');
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const local = file => JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'));
const cell = value => String(value).replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
const label = status => ({ eindeutig: 'eindeutig', bestaetigung_noetig: 'Bestätigung nötig', nicht_darstellbar: 'nicht darstellbar' })[status];

function analyse() {
  const catalog = local('referenzuebungen.json'), cases = local('referenzfaelle.json').cases;
  const validation = validateCatalog(catalog);
  if (!validation.valid) throw new Error(JSON.stringify(validation.errors));
  const resolver = createLegacyResolver(catalog), library = read('uebungen.json');
  const rows = library.map((source, index) => ({ name: source.de, sourcePath: `uebungen.json[${index}]`, mapping: resolver(source, 'library') }));
  const programs = fs.readdirSync(path.join(root, 'programme')).filter(file => file.endsWith('.json')).sort();
  const programRows = [];
  for (const file of programs) read(`programme/${file}`).days.forEach((day, dayIndex) => day.exercises.forEach((ex, index) => programRows.push({ name: ex.name, sourcePath: `programme/${file} → days[${dayIndex}].exercises[${index}]`, mapping: resolver(ex, 'external') })));
  const counts = records => ['eindeutig', 'bestaetigung_noetig', 'nicht_darstellbar'].map(status => `${label(status)}: ${records.filter(row => row.mapping.status === status).length}`).join('; ');
  const lines = [
    '# Altzuordnungsbericht: isolierter Übungsprototyp', '',
    'Stand: 11.10.2026. Erzeugt aus dem eigenen Bibliotheks- und Vorlagenbestand. Keine persönlichen Trainingsdaten, kein Browserzugriff und keine Migration.', '',
    'Dieser Bericht deckt zwölf Referenzübungen ab. „Nicht darstellbar“ bedeutet bei den übrigen Namen zunächst „außerhalb des Referenzkatalogs“, nicht „ungültige Übung“. „Eindeutig“ bestätigt nur Identität und darstellbare Alt-Erfassung. Historische Gewichtskonvention, Seitenzählung und Gerätevariante werden dadurch nicht rückwirkend bestätigt.', '',
    `Bibliothek: ${rows.length} Einträge; ${counts(rows)}.`, '',
    `Vorlagen: ${programs.length} Dateien, ${programRows.length} Übungspositionen; ${counts(programRows)}.`, '',
    '## Zwölf Definitionen und tatsächliche Beispielwerte', '',
    '| Fall | Übung | Ausgabe | Alt-Bibliothek |', '| --- | --- | --- | --- |'
  ];
  for (const item of cases) {
    const ex = catalog.exercises.find(entry => entry.id === item.exerciseId);
    const check = validatePerformance(ex, item.performance);
    if (!check.valid || item.performance.positionId !== item.programPosition.id) throw new Error(`Ungültiger Referenzfall ${item.id}`);
    const row = rows.find(entry => entry.mapping.exerciseId === ex.id);
    lines.push(`| ${item.id} | ${cell(ex.name.de)} | ${cell(describePerformance(ex, item.performance).summary)} | ${label(row.mapping.status)} |`);
  }
  lines.push('', '## Referenzzuordnung im heutigen Bibliotheksbestand', '', '| Quelle | Ziel-ID | Status | Begründung |', '| --- | --- | --- | --- |');
  for (const row of rows.filter(entry => entry.mapping.exerciseId || entry.mapping.candidates)) lines.push(`| ${cell(row.sourcePath + ' · ' + row.name)} | ${cell(row.mapping.exerciseId || row.mapping.candidates.join(', '))} | ${label(row.mapping.status)} | ${cell(row.mapping.reasons.join(' '))} |`);
  lines.push('', '## Jede Position der vier Vorlagen', '', '| Quelle | Name | Ziel-ID | Status |', '| --- | --- | --- | --- |');
  for (const row of programRows) lines.push(`| ${cell(row.sourcePath)} | ${cell(row.name)} | ${cell(row.mapping.exerciseId || '—')} | ${label(row.mapping.status)} |`);
  lines.push('', '## Konsequenz für die produktive Erweiterung', '',
    '- Klimmzug-Maschine: Unterstützung ist nicht durch ein optionales ID-Feld allein abwärtskompatibel. Alte App-Versionen würden sie weiterhin als normales Gewicht verwenden. Erst einen Erfassungs-/Austauschvertrag mit Schutz für ältere Versionen festlegen.',
    '- Couch Stretch: Seitenzählung für neue Vorgaben klar festlegen, Altwerte ohne Seitenkennzeichen separat erhalten.',
    '- Gewichtskonventionen und Gerätevarianten historischer Sätze bleiben unbestätigt. Rohwerte weder verdoppeln noch umrechnen; bestätigte Neuvorgaben ändern keine Vergangenheit.',
    '- Die übrigen 188 Bibliothekseinträge benötigen geprüfte Definitionen, bevor die vollständige Migration geplant wird. Kein automatisches Auffüllen anhand von Namen, Equipment oder Muskelgruppen.',
    '- Dieser Prototyp stellt nur Satzwerte dar. Keine automatische Progression, 1RM-, Volumen- oder Trendberechnung wird in die App eingebaut.', '',
    'Erneut erzeugen: `node docs/prototyp/uebungsdatenbank/analyse.cjs`. Der Befehl schreibt keinen Bestand um; die Berichtsausgabe erfolgt ausschließlich auf stdout.', '');
  return { markdown: lines.join('\n'), libraryRows: rows, programRows, catalogWarnings: validation.warnings };
}

if (require.main === module) process.stdout.write(analyse().markdown);
module.exports = { analyse };
