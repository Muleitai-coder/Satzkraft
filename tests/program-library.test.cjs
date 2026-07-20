const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

function sourceBetween(startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `${startMarker} bis ${endMarker} wurde nicht gefunden`);
  return html.slice(start, end);
}

function functionSource(name) {
  const marker = `function ${name}(`;
  const start = html.indexOf(marker);
  assert.ok(start >= 0, `${name} wurde nicht gefunden`);
  const next = html.indexOf('\nfunction ', start + marker.length);
  assert.ok(next > start, `${name} konnte nicht ausgeschnitten werden`);
  return html.slice(start, next);
}

function validationContext() {
  const context = {
    CAT_COLORS: ['amber', 'emerald', 'violet', 'sky', 'orange', 'rose', 'slate'],
    LIMITS: { maxDays: 7, maxWeeks: 16, maxExPerDay: 12, maxSets: 10, maxNameLen: 30, maxLabelLen: 16 },
    WD_MAP: { montag: 0, mo: 0, monday: 0, dienstag: 1, di: 1, tuesday: 1, mittwoch: 2, mi: 2, wednesday: 2, donnerstag: 3, do: 3, thursday: 3, fr: 4, freitag: 4, friday: 4, samstag: 5, sa: 5, saturday: 5, sonntag: 6, so: 6, sunday: 6 },
    WD_CANON: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
    VALID_PROGRESSION_MODES: ['weight', 'added_weight', 'reps', 'seconds', 'progression', 'none'],
    ANLEITUNG: {},
    esc: value => String(value == null ? '' : value),
    wucdSan: list => Array.isArray(list) ? list.map(item => ({ name: item.name, sec: item.seconds })) : [],
    S: { programs: {}, store: {}, active: 'default' },
    cloneJSON: value => JSON.parse(JSON.stringify(value)),
    newStore: program => ({ week: 1, day: program.days[0].key }),
    flushSave() {},
    renderLib() {},
    closeLib() {},
    showModal() {},
    saveCoachPreferences() {},
    programWriteLocked: () => false,
    showProgramWriteLocked() {},
    setActive(id) { context.S.active = id; return true; }
  };
  vm.createContext(context);
  vm.runInContext(sourceBetween('var WUCD_LIB=', 'ANLEITUNG.erlaubte_werte'), context);
  vm.runInContext(sourceBetween('var BEREICHE=', 'var DEFAULT_PROGRAM='), context);
  vm.runInContext(sourceBetween('function genId()', 'function setActive('), context);
  vm.runInContext(sourceBetween('var pendingProgramImport=', 'function deleteProgram'), context);
  return context;
}

test('validates every bundled program and keeps the manifest in exact sync', () => {
  const context = validationContext();
  const manifest = Array.from(context.PROGRAM_LIBRARY, item => ({ ...item }));
  const files = fs.readdirSync(path.join(root, 'programme')).filter(file => file.endsWith('.json')).sort();
  const manifestFiles = manifest.map(item => path.basename(item.file)).sort();

  assert.deepEqual(manifestFiles, files);
  assert.equal(manifest.length, 4);
  for (const item of manifest) {
    const text = fs.readFileSync(path.join(root, item.file.replace(/^\.\//, '')), 'utf8');
    const checked = context.parseProgram(text);
    assert.equal(checked.err, undefined, `${item.file}: ${checked.err}`);
    assert.equal(checked.prog.name, item.name);
    assert.match(sw, new RegExp(item.file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('marks direct library imports internally without leaking origin into exports', () => {
  const context = validationContext();
  const item = context.PROGRAM_LIBRARY[0];
  const text = fs.readFileSync(path.join(root, item.file.replace(/^\.\//, '')), 'utf8');
  context.pendingProgramImport = context.prepareProgramImport(text, 'library', item.name);
  const id = context.storeImportedProgram(false, false);
  const stored = context.S.programs[id];

  assert.equal(stored.origin, 'satzkraft');
  assert.equal(context.exportTranslate(stored).origin, undefined);
  assert.equal(context.programSourceLabel('library'), 'Satzkraft-Programm');
});

test('renders the official origin line and the complete library entry points', () => {
  const context = {
    S: { active: 'official', programs: {}, store: { official: { logs: {}, history: [] } } },
    programBlockComplete: () => false,
    programWriteLocked: () => false,
    esc: value => String(value == null ? '' : value),
    attr: value => String(value == null ? '' : value),
    icon: () => ''
  };
  vm.createContext(context);
  vm.runInContext(functionSource('programItemHtml'), context);
  const card = context.programItemHtml('official', {
    name: 'Gym Ganzkörper Beginner', origin: 'satzkraft', days: [{ key: 'A' }], weeks: [{ n: 1 }]
  });

  assert.match(card, /Offizielles Satzkraft-Programm/);
  assert.match(sourceBetween('function renderCreateHub', 'function renderExternalAiCreate'), /Fertiges Programm wählen/);
  assert.match(functionSource('renderImportPreview'), /Wochenstruktur/);
  assert.match(functionSource('renderImportPreview'), /Alle Übungen/);
  assert.doesNotMatch(functionSource('renderImportPreview'), /Startgewichte finden|missingWeights|Sicher automatisch bereinigt/);
  assert.doesNotMatch(functionSource('renderImportPreview'), /category&&category\.label/);
  assert.match(functionSource('showCalibrationGuide'), /Startgewicht finden/);
  assert.match(html, /Startgewicht bestimmen/);
});
