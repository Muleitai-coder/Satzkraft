const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const start = html.indexOf('function editorBuildRefMap');
const end = html.indexOf('function openProgramEditor', start);
assert.ok(start >= 0 && end > start, 'Editor-Migrationsfunktionen wurden nicht gefunden');

const context = {};
vm.createContext(context);
vm.runInContext(html.slice(start, end), context);

function exercise(id, overrides) {
  return Object.assign({ id, name: id, w: true, bw: false, unit: 'reps' }, overrides);
}

function program(weeks, days) {
  return {
    weeks: Array.from({ length: weeks }, (_, index) => ({ n: index + 1 })),
    days
  };
}

function store(overrides) {
  return Object.assign({ tg: {}, logs: {}, history: [], workout: null, week: 1, day: 'A' }, overrides);
}

test('builds the old-to-new exercise map from editor refs without parsing ids', () => {
  const draft = {
    days: [
      { key: 'Tag_mit_Unterstrich', exercises: [{ name: 'Neu' }, { name: 'Alt', _ref: 'alte_id_7' }] },
      { key: 'B', exercises: [{ name: 'Alt B', _ref: 'B_0' }] }
    ]
  };
  const map = context.editorBuildRefMap(draft);
  assert.deepEqual({ ...map.alte_id_7 }, { day: 'Tag_mit_Unterstrich', id: 'Tag_mit_Unterstrich_1' });
  assert.deepEqual({ ...map.B_0 }, { day: 'B', id: 'B_0' });
  assert.equal(Object.keys(map).length, 2);
});

test('keeps logs on the correct exercises after inserting, moving and renaming', () => {
  const oldProgram = program(2, [{ key: 'A', ex: [exercise('A_0'), exercise('A_1'), exercise('A_2')] }]);
  const newProgram = program(2, [{ key: 'A', ex: [
    exercise('A_0', { name: 'Neu' }),
    exercise('A_1', { name: 'Umbenannt' }),
    exercise('A_2'),
    exercise('A_3')
  ] }]);
  const oldStore = store({
    logs: {
      '1|A|A_0': { sets: [{ reps: '8', weight: '50' }] },
      '1|A|A_1': { sets: [{ reps: '9', weight: '60' }] },
      '2|A|A_2': { sets: [{ reps: '10', weight: '70' }] }
    },
    history: [{ week: 1, day: 'A', start: 100, dur: 50 }]
  });
  const map = {
    A_0: { day: 'A', id: 'A_1' },
    A_1: { day: 'A', id: 'A_3' },
    A_2: { day: 'A', id: 'A_2' }
  };
  const migrated = context.migrateReplaceStore(oldProgram, oldStore, newProgram, map);
  assert.equal(migrated.logs['1|A|A_1'].sets[0].weight, '50');
  assert.equal(migrated.logs['1|A|A_3'].sets[0].weight, '60');
  assert.equal(migrated.logs['2|A|A_2'].sets[0].weight, '70');
  assert.equal(migrated.logs['1|A|A_0'], undefined);
  assert.deepEqual(Array.from(migrated.history, entry => ({ ...entry })), [{ week: 1, day: 'A', start: 100, dur: 50 }]);
});

test('drops deleted exercises and resets only exercises whose type changed', () => {
  const oldProgram = program(2, [{ key: 'A', ex: [
    exercise('A_0'),
    exercise('A_1'),
    exercise('A_2', { w: false, unit: 'reps' })
  ] }]);
  const newProgram = program(2, [{ key: 'A', ex: [
    exercise('A_0', { w: false, unit: 'seconds' }),
    exercise('A_1', { name: 'Nur umbenannt' })
  ] }]);
  const oldStore = store({ logs: {
    '1|A|A_0': { sets: [{ reps: '8', weight: '50' }] },
    '1|A|A_1': { sets: [{ reps: '9', weight: '60' }] },
    '1|A|A_2': { sets: [{ reps: '12', weight: '' }] }
  } });
  const migrated = context.migrateReplaceStore(oldProgram, oldStore, newProgram, {
    A_0: { day: 'A', id: 'A_0' },
    A_1: { day: 'A', id: 'A_1' }
  });
  assert.deepEqual(Object.keys(migrated.logs), ['1|A|A_1']);
  assert.equal(migrated.logs['1|A|A_1'].sets[0].weight, '60');
});

test('migrates target overrides and removes values beyond shortened weeks', () => {
  const oldProgram = program(8, [{ key: 'A', ex: [exercise('A_0')] }]);
  const newProgram = program(6, [{ key: 'A', ex: [exercise('A_0')] }]);
  const oldStore = store({
    week: 7,
    tg: { '5|A_0': '82.5', '7|A_0': '90' },
    logs: { '6|A|A_0': { sets: [{ reps: '8', weight: '80' }] }, '7|A|A_0': { sets: [{ reps: '8', weight: '90' }] } }
  });
  const migrated = context.migrateReplaceStore(oldProgram, oldStore, newProgram, { A_0: { day: 'A', id: 'A_0' } });
  assert.equal(migrated.week, 6);
  assert.deepEqual({ ...migrated.tg }, { '5|A_0': '82.5' });
  assert.deepEqual(Object.keys(migrated.logs), ['6|A|A_0']);
});

test('drops values from deleted days, selects the first remaining day and clears workouts', () => {
  const oldProgram = program(2, [
    { key: 'A', ex: [exercise('A_0')] },
    { key: 'B', ex: [exercise('B_0')] }
  ]);
  const newProgram = program(2, [{ key: 'B', ex: [exercise('B_0')] }]);
  const oldStore = store({
    day: 'A',
    workout: { start: 123 },
    logs: { '1|A|A_0': { sets: [{ reps: '8' }] }, '1|B|B_0': { sets: [{ reps: '9' }] } },
    tg: { '1|A_0': '50', '1|B_0': '60' }
  });
  const migrated = context.migrateReplaceStore(oldProgram, oldStore, newProgram, { B_0: { day: 'B', id: 'B_0' } });
  assert.equal(migrated.day, 'B');
  assert.equal(migrated.workout, null);
  assert.deepEqual(Object.keys(migrated.logs), ['1|B|B_0']);
  assert.deepEqual({ ...migrated.tg }, { '1|B_0': '60' });
});

test('exposes the keep-progress dialog and blocks replacing the active program during training', () => {
  assert.match(html, /Ersetzen & Fortschritt behalten/);
  assert.match(html, /Ersetzen & Fortschritt zurücksetzen/);
  assert.match(html, /function programWriteLocked\(\)\{return !!S\.workout;\}/);
  assert.match(html, /if\(programWriteLocked\(\)\)\{showProgramWriteLocked\(\);return;\}/);
});

test('keeps refs editor-only and documents the replace behavior in the help text', () => {
  assert.match(html, /draftEx\._ref=internalDay\.ex\[ei\]\.id/);
  assert.match(html, /„Original ersetzen“ übernimmt deine Änderungen in das laufende Programm/);
  assert.doesNotMatch(html.slice(html.indexOf('function exportTranslate'), html.indexOf('function plainObject')), /_ref/);
  assert.doesNotMatch(html.slice(html.indexOf('function importTranslate'), html.indexOf('function normalizeWorkout')), /_ref/);
});
