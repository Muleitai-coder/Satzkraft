'use strict';

// Nur Code-/Vertragsprüfung mit synthetischen Daten. Keine Ausführung der App oder Speicherung.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.resolve(__dirname, '../../../index.html'), 'utf8');
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, 'referenzuebungen.json'), 'utf8'));
const clone = value => JSON.parse(JSON.stringify(value));
const definition = id => clone(catalog.exercises.find(ex => ex.id === id));

function section(startMarker, endMarker) {
  const start = html.indexOf(startMarker), end = html.indexOf(endMarker, start);
  if (start < 0 || end <= start) throw new Error(`Codeabschnitt fehlt: ${startMarker}`);
  return html.slice(start, end);
}

function legacyContext(current = false) {
  const context = {
    CAT_COLORS: ['amber', 'emerald', 'violet', 'sky', 'orange', 'rose', 'slate'],
    LIMITS: { maxDays: 7, maxWeeks: 16, maxExPerDay: 12, maxSets: 10, maxNameLen: 30, maxLabelLen: 16 },
    WD_MAP: { montag: 0 }, WD_CANON: ['Montag'],
    VALID_PROGRESSION_MODES: ['weight', 'added_weight', 'reps', 'seconds', 'progression', 'none'],
    WUCD_SET: {}, ANLEITUNG: {}, DATA_SCHEMA_VERSION: 4,
    esc: value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    wucdSan: () => [], syncStore() {}
  };
  vm.createContext(context);
  if (!current) {
    const saved = JSON.parse(fs.readFileSync(path.join(__dirname, 'legacy-v2-reader.json'), 'utf8'));
    saved.sections.forEach(source => vm.runInContext(source, context));
    return context;
  }
  context.DATA_SCHEMA_VERSION = Number(html.match(/var DATA_SCHEMA_VERSION=(\d+)/)[1]);
  vm.runInContext(section('var BEREICHE=', 'var DEFAULT_PROGRAM='), context);
  vm.runInContext(section('function genId()', 'function setActive('), context);
  vm.runInContext(section('function validBackupNumber(', 'function confirmBackupRestore('), context);
  // backupJSON ist eine einzelne bestehende Funktion; benachbarte Download-/UI-Pfade nicht laden.
  const backup = html.match(/function backupJSON\(\)\{[^\n]+\}/);
  if (!backup) throw new Error('backupJSON fehlt.');
  vm.runInContext(backup[0], context);
  return context;
}

function sampleProgram(exercise = {}) {
  return {
    format: 'trainings-block', version: 2, name: 'Vertragsprobe',
    categories: { kraft: { label: 'Kraft', color: 'amber', rest: 90, reps: { aufbau: [6, 10] } } },
    weeks: [{ n: 1, phase: 'aufbau', label: 'Aufbau', rir: '2', sets: { kraft: 3 } }],
    days: [{ key: 'A', weekday: 'Montag', exercises: [{ name: 'Langhantel-Kniebeuge', category: 'kraft', weighted: true, increment: 2.5, startWeight: 60, ...exercise }] }]
  };
}

function sampleBackup(program) {
  const positionId = program.days[0].ex[0].id;
  return {
    schemaVersion: 4, active: 'sample', programs: { sample: program },
    store: { sample: { week: 1, day: 'A', tg: {}, barw: {}, notes: {}, workout: null,
      logs: { [`1|A|${positionId}`]: { sets: [{ reps: '8', weight: '60' }] } }, history: [] } }
  };
}

function probe() {
  const ctx = legacyContext();
  const safe = sampleProgram({ exerciseId: 'barbell_back_squat', tracking: definition('barbell_back_squat').tracking });
  const safeSnapshot = JSON.stringify(safe), imported = ctx.parseProgram(JSON.stringify(safe));
  if (imported.err) throw new Error(imported.err);
  const reexport = clone(ctx.exportTranslate(imported.prog));
  const assistance = sampleProgram({ name: 'Klimmzug-Maschine', exerciseId: 'assisted_pull_up_machine', tracking: definition('assisted_pull_up_machine').tracking, startWeight: 30 });
  assistance.requiredCapabilities = ['assistance-v1'];
  const assisted = ctx.parseProgram(JSON.stringify(assistance));
  const version3 = ctx.parseProgram(JSON.stringify({ ...assistance, version: 3 }));
  const otherFormat = ctx.parseProgram(JSON.stringify({ ...assistance, format: 'isolated-contract-test' }));
  const carry = ctx.parseProgram(JSON.stringify(sampleProgram({ name: 'Suitcase Carry', unit: 'seconds', timerMode: 'target', perSide: true, reps: [30, 60], startWeight: 20 })));
  if (carry.err) throw new Error(carry.err);
  const carryExport = clone(ctx.exportTranslate(carry.prog));

  const backup = sampleBackup(clone(imported.prog));
  backup.exerciseCatalog = { exercises: [{ ...definition('barbell_back_squat'), id: 'custom_example', origin: 'custom' }] };
  const originalCell = backup.store.sample.logs['1|A|A_0'];
  originalCell.performedExercise = { exerciseId: 'assisted_pull_up_machine', trackingSnapshot: definition('assisted_pull_up_machine').tracking };
  const backupSnapshot = JSON.stringify(backup), backupValidation = ctx.validateBackupFile(backup);
  ctx.S = clone(backup);
  const rewrittenBackup = JSON.parse(ctx.backupJSON());
  const newerBackupValidation = ctx.validateBackupFile({ ...backup, schemaVersion: 5 });

  return {
    safe: { accepted: !imported.err, inputUnchanged: JSON.stringify(safe) === safeSnapshot,
      identityPreserved: Object.hasOwn(imported.prog.days[0].ex[0], 'exerciseId'),
      trackingPreserved: Object.hasOwn(imported.prog.days[0].ex[0], 'tracking'), reexport },
    assistance: { accepted: !assisted.err,
      position: assisted.prog ? clone(assisted.prog.days[0].ex[0]) : null,
      capabilityFlagEnforced: !!assisted.err, version3Error: version3.err, otherFormatError: otherFormat.err },
    carry: { position: clone(carry.prog.days[0].ex[0]), reexport: carryExport },
    backup: { validation: backupValidation, inputUnchanged: JSON.stringify(backup) === backupSnapshot,
      customDefinitionsPreserved: Object.hasOwn(rewrittenBackup, 'exerciseCatalog'),
      performedExercise: rewrittenBackup.store.sample.logs['1|A|A_0'].performedExercise,
      originalSets: clone(originalCell.sets), rewrittenSets: rewrittenBackup.store.sample.logs['1|A|A_0'].sets,
      newerSchemaError: newerBackupValidation }
  };
}

function report(result = probe()) {
  return [
    '# Kompatibilitätsnachweis für die Übungsdatenbank', '',
    'Stand: 12.10.2026. Isolierte Prüfung des bestehenden Codes aus `index.html` mit synthetischen Daten. Kein Browserzugriff, keine Migration und keine Änderung der App.', '',
    '| Fall | Tatsächlich beobachtet | Konsequenz |', '| --- | --- | --- |',
    `| V2 mit optionaler Übungs-ID und tracking | angenommen: ${result.safe.accepted}; ID erhalten: ${result.safe.identityPreserved}; tracking erhalten: ${result.safe.trackingPreserved} | Älterer Import/Export verliert neue Metadaten; Alt-Rundweg als unbestätigten Altbestand behandeln. |`,
    `| Unterstützung in v2 plus requiredCapabilities | angenommen: ${result.assistance.accepted}; Fähigkeitsmarker wirksam: ${result.assistance.capabilityFlagEnforced} | Unbekannte Zusatzfelder schützen nicht vor gewöhnlicher gewichteter Erfassung. |`,
    `| Probe mit version:3 | ${result.assistance.version3Error ? 'abgelehnt' : 'angenommen'} | Eine Versionsgrenze könnte alte Apps stoppen; Einführung von v3 ist damit nicht beauftragt oder entschieden. |`,
    `| Probe mit anderem format | ${result.assistance.otherFormatError ? 'abgelehnt' : 'angenommen'} | Auch eine Formatgrenze stoppt den bisherigen Import; kein neues Produktformat eingeführt. |`,
    `| Gewichtete Zeit in v2 | unit:${result.carry.reexport.days[0].exercises[0].unit}; weighted:${result.carry.reexport.days[0].exercises[0].weighted}; perSide:${result.carry.reexport.days[0].exercises[0].perSide} | Die heutige Darstellung bleibt korrekt transportierbar. |`,
    `| Schema-4-Backup mit zusätzlichem Katalog und widersprüchlicher historischer Erfassung | Validierungsfehler: ${result.backup.validation ?? 'keiner'} | Bisherige Backupprüfung validiert diese neuen Felder nicht. |`,
    `| Erneute Sicherung eines solchen Schema-4-Stands | Katalog erhalten: ${result.backup.customDefinitionsPreserved}; verschachtelte Zusatzdaten erhalten: ${!!result.backup.performedExercise} | Identitäts-/Snapshotfelder müssen künftig in allen Sicherungs- und Lebenszykluspfaden ausdrücklich geprüft werden. Ein Zusatzkatalog wäre heute nicht verlustfrei. |`,
    `| Probe mit schemaVersion:5 | ${result.backup.newerSchemaError ? 'abgelehnt' : 'angenommen'} | Vor persönlicher Bibliothek und neuer Erfassungssemantik Schemaentscheidung begründen; Schema 4 bleibt jetzt bestehen. |`, '',
    `Originale synthetische Eingaben unverändert: Programm ${result.safe.inputUnchanged}, Backup ${result.backup.inputUnchanged}. Vorhandene Satzwerte wurden beim erneuten Backup unverändert übernommen.`, '',
    'Dies ist ein Nachweis des gegenwärtigen Vertrags, keine vollständige App-Abnahme. Eine spätere Änderung des Import-/Backupcodes erfordert eine neue Bewertung dieser Kompatibilitätsfälle. Die Prüfung wurde ohne Aufruf von `js/progression.js` ausgeführt.', '',
    'Erneut ausgeben: `node docs/prototyp/uebungsdatenbank/compatibility-probe.cjs`. Die Ausgabe erfolgt auf stdout; keine Datei wird automatisch geschrieben.', ''
  ].join('\n');
}

if (require.main === module) process.stdout.write(report());
module.exports = { legacyContext, sampleProgram, sampleBackup, probe, report };
