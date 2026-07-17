const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const start = html.indexOf('function editorBuildRefMap');
const end = html.indexOf('function openProgramEditor', start);
assert.ok(start >= 0 && end > start, 'Editor-Zeitachsenfunktionen wurden nicht gefunden');

const context = {
  cloneJSON: value => JSON.parse(JSON.stringify(value)),
  currentTrainingWeekFor: () => 3,
  programUnitComplete: () => false,
  exerciseValidForWeek: (ex, week) => week >= (ex.fromWeek ?? 1) && week <= (ex.untilWeek ?? Infinity),
  normalizeSwapName: value => typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, 80) : ''
};
vm.createContext(context);
vm.runInContext(html.slice(start, end), context);

function exercise(id, overrides) {
  return Object.assign({ id, name: id, cat: 'kraft', w: true, bw: false, unit: 'reps' }, overrides);
}

function program(exercises) {
  return {
    id: 'plan',
    name: 'Plan',
    categories: { kraft: { label: 'Kraft', color: 'amber', rest: 120 } },
    weeks: Array.from({ length: 6 }, (_, index) => ({ n: index + 1, sets: { kraft: 3 } })),
    days: [{ key: 'A', wd: 'Montag', title: 'A', ex: exercises }]
  };
}

function freshEdit(exercises) {
  return {
    id: 'fresh',
    name: 'Plan',
    categories: { kraft: { label: 'Kraft', color: 'amber', rest: 120 } },
    weeks: Array.from({ length: 6 }, (_, index) => ({ n: index + 1, sets: { kraft: 3 } })),
    days: [{ key: 'A', wd: 'Montag', title: 'A', ex: exercises }]
  };
}

function draft(exercises) {
  return { days: [{ key: 'A', exercises }] };
}

function store(overrides) {
  return Object.assign({
    tg: {}, barw: {}, notes: {}, logs: {}, history: [], workout: null,
    pendingReplacements: [], week: 3, day: 'A', blockCelebrated: false
  }, overrides);
}

test('builds the old-to-new exercise map from editor refs without parsing ids', () => {
  const map = context.editorBuildRefMap({
    days: [
      { key: 'Tag_mit_Unterstrich', exercises: [{ name: 'Neu' }, { name: 'Alt', _ref: 'alte_id_7' }] },
      { key: 'B', exercises: [{ name: 'Alt B', _ref: 'B_0' }] }
    ]
  });
  assert.deepEqual({ ...map.alte_id_7 }, { day: 'Tag_mit_Unterstrich', id: 'Tag_mit_Unterstrich_1' });
  assert.deepEqual({ ...map.B_0 }, { day: 'B', id: 'B_0' });
});

test('removed exercises end at the anchor while every stored value remains', () => {
  const oldProgram = program([exercise('A_0'), exercise('A_1')]);
  const oldStore = store({ logs: { '2|A|A_1': { sets: [{ reps: '8', weight: '50' }] } } });
  context.editorPendingReplacementRefs = {};
  context.editorRenameChoices = {};
  const merged = context.timelineProgramFromEdit(
    oldProgram,
    freshEdit([exercise('A_0')]),
    draft([{ name: 'A_0', weighted: true, unit: 'reps', _ref: 'A_0' }]),
    oldStore
  );
  assert.equal(merged.days[0].ex.find(ex => ex.id === 'A_1').untilWeek, 2);
  const migrated = context.migrateReplaceStore(oldProgram, oldStore, merged, {});
  assert.deepEqual(JSON.parse(JSON.stringify(migrated.logs['2|A|A_1'])), oldStore.logs['2|A|A_1']);
});

test('type changes end the old exercise and create a linked successor', () => {
  const oldProgram = program([exercise('A_0', { name: 'Beinpresse' })]);
  context.editorPendingReplacementRefs = {};
  context.editorRenameChoices = {};
  const merged = context.timelineProgramFromEdit(
    oldProgram,
    freshEdit([exercise('A_0', { name: 'Kniebeuge', w: false, unit: 'reps' })]),
    draft([{ name: 'Kniebeuge', unit: 'reps', _ref: 'A_0' }]),
    store()
  );
  const [previous, successor] = merged.days[0].ex;
  assert.equal(previous.id, 'A_0');
  assert.equal(previous.untilWeek, 2);
  assert.equal(successor.fromWeek, 3);
  assert.equal(successor.prevId, 'A_0');
  assert.notEqual(successor.id, previous.id);
});

test('rename decisions either preserve the id or begin a new exercise', () => {
  const oldProgram = program([exercise('A_0', { name: 'Alter Name' })]);
  const oldStore = store({ logs: { '2|A|A_0': { sets: [{ reps: '8', weight: '50' }] } } });
  context.editorPendingReplacementRefs = {};
  context.editorRenameChoices = { A_0: 'same' };
  let merged = context.timelineProgramFromEdit(
    oldProgram,
    freshEdit([exercise('A_0', { name: 'Neuer Name' })]),
    draft([{ name: 'Neuer Name', weighted: true, unit: 'reps', _ref: 'A_0' }]),
    oldStore
  );
  assert.equal(merged.days[0].ex.length, 1);
  assert.equal(merged.days[0].ex[0].id, 'A_0');

  context.editorRenameChoices = { A_0: 'new' };
  merged = context.timelineProgramFromEdit(
    oldProgram,
    freshEdit([exercise('A_0', { name: 'Neuer Name' })]),
    draft([{ name: 'Neuer Name', weighted: true, unit: 'reps', _ref: 'A_0' }]),
    oldStore
  );
  assert.equal(merged.days[0].ex[0].untilWeek, 2);
  assert.equal(merged.days[0].ex[1].prevId, 'A_0');
});

test('a completed day anchors ordinary edits in the following week', () => {
  context.programUnitComplete = () => true;
  context.editorPendingReplacementRefs = {};
  context.editorRenameChoices = { A_0: 'new' };
  const oldProgram = program([exercise('A_0', { name: 'Alt' })]);
  const merged = context.timelineProgramFromEdit(
    oldProgram,
    freshEdit([exercise('A_0', { name: 'Neu' })]),
    draft([{ name: 'Neu', weighted: true, unit: 'reps', _ref: 'A_0' }]),
    store()
  );
  assert.equal(merged.days[0].ex[0].untilWeek, 3);
  assert.equal(merged.days[0].ex[1].fromWeek, 4);
  context.programUnitComplete = () => false;
});

test('a confirmed permanent swap becomes regular successor history', () => {
  context.programUnitComplete = () => true;
  context.editorPendingReplacementRefs = { A_0: 'Frontkniebeuge' };
  context.editorRenameChoices = {};
  const oldProgram = program([exercise('A_0', { name: 'Kniebeuge' })]);
  const oldStore = store({ logs: { '3|A|A_0': { swap: 'Frontkniebeuge', sets: [{ reps: '8', weight: '45' }] } } });
  const merged = context.timelineProgramFromEdit(
    oldProgram,
    freshEdit([exercise('A_0', { name: 'Frontkniebeuge' })]),
    draft([{ name: 'Frontkniebeuge', weighted: true, unit: 'reps', _ref: 'A_0' }]),
    oldStore
  );
  const successor = merged.days[0].ex.find(ex => ex.prevId === 'A_0');
  assert.equal(successor.fromWeek, 3);
  const migrated = context.migrateReplaceStore(oldProgram, oldStore, merged, {});
  assert.equal(migrated.logs[`3|A|${successor.id}`].sets[0].weight, '45');
  assert.equal(migrated.logs[`3|A|${successor.id}`].swap, undefined);
  assert.equal(migrated.logs['3|A|A_0'], undefined);
  context.programUnitComplete = () => false;
});

test('keeps refs editor-only and explains the new replace behavior', () => {
  assert.match(html, /draftEx\._ref=internalEx\.id/);
  assert.match(html, /Planänderungen gelten ab jetzt/);
  assert.doesNotMatch(html.slice(html.indexOf('function exportTranslate'), html.indexOf('function plainObject')), /_ref/);
  assert.doesNotMatch(html.slice(html.indexOf('function importTranslate'), html.indexOf('function normalizeWorkout')), /_ref/);
});
