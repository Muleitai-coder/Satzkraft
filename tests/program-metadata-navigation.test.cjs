const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const NOW = Date.UTC(2026, 6, 17, 12);

class FixedDate extends Date {
  constructor(...args) {
    super(...(args.length ? args : [NOW]));
  }

  static now() {
    return NOW;
  }
}

function sourceBetween(startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `${startMarker} bis ${endMarker} wurde nicht gefunden`);
  return html.slice(start, end);
}

function internalProgram(id, name) {
  return {
    id,
    name,
    categories: { kraft: { label: 'Kraft', color: 'amber', rest: 120 } },
    weeks: [{ n: 1, phase: 'aufbau', label: 'Aufbau', rir: '2', sets: { kraft: 3 }, note: '' }],
    days: [{
      key: 'A',
      wd: 'Montag',
      title: 'Ganzkörper',
      ex: [{ id: 'A_0', name: 'Kniebeuge', cat: 'kraft', w: true, inc: 2.5, def: 40, unit: 'reps' }]
    }]
  };
}

function loadEditorStoreContext(sourceProgram) {
  const modals = [];
  const parsedProgram = internalProgram('copy', sourceProgram.name);
  const context = {
    Date: FixedDate,
    LIMITS: { maxNameLen: 30 },
    editorDraft: { name: sourceProgram.name },
    editorSourceId: sourceProgram.id,
    editorProgramSource: null,
    editorUnsavedDraft: true,
    editorInitialJSON: '',
    S: {
      active: sourceProgram.id,
      programs: { [sourceProgram.id]: sourceProgram },
      store: { [sourceProgram.id]: { logs: {} } }
    },
    syncEditorForm() {},
    programWriteLocked: () => false,
    showProgramWriteLocked() {},
    parseProgram: () => ({ prog: JSON.parse(JSON.stringify(parsedProgram)) }),
    showModal(title, message, actions) { modals.push({ title, message, actions }); },
    esc: value => String(value == null ? '' : value),
    newStore: () => ({ logs: {} }),
    setActive(id) { context.S.active = id; return true; },
    flushSave() {},
    genId: () => 'generated',
    finishEditorSave() {},
    saveCoachPreferences() {},
    editorBuildRefMap: () => ({}),
    migrateReplaceStore: () => ({ logs: { migrated: true } }),
    alias() {},
    refreshPostWorkoutReplacements() {},
    renderView() {},
    renderBar() {},
    editorHasUnsavedChanges: () => false,
    discardEditorAndReturn() {}
  };
  vm.createContext(context);
  vm.runInContext(sourceBetween('function programNameWithSuffix', 'function programWriteLocked'), context);
  return { context, modals };
}

test('stores local creation and update timestamps for copies and replacements', () => {
  const source = internalProgram('source', 'Kraftbasis');
  source.createdAt = NOW - 10_000;
  source.updatedAt = NOW - 5_000;

  const copyRun = loadEditorStoreContext(JSON.parse(JSON.stringify(source)));
  copyRun.context.editorStoreProgram(false);
  const copy = copyRun.context.S.programs.copy;
  assert.ok(copy, 'Programmkopie wurde nicht gespeichert');
  assert.match(copy.name, / \(Kopie\)$/);
  assert.equal(copy.createdAt, NOW);
  assert.equal(copy.updatedAt, NOW);

  const replaceRun = loadEditorStoreContext(JSON.parse(JSON.stringify(source)));
  replaceRun.context.editorStoreProgram(true);
  const replacementPrompt = replaceRun.modals.find(modal => modal.title === 'Original ersetzen?');
  assert.ok(replacementPrompt, 'Ersetzen-Rückfrage fehlt');
  replacementPrompt.actions[0].action();
  const replaced = replaceRun.context.S.programs.source;
  assert.equal(replaced.createdAt, source.createdAt, 'Erstellungsdatum des Originals muss erhalten bleiben');
  assert.equal(replaced.updatedAt, NOW, 'Änderungsdatum muss beim Ersetzen erneuert werden');
});

test('keeps local program timestamps out of the version-2 exchange format', () => {
  const context = { ANLEITUNG: {} };
  vm.createContext(context);
  vm.runInContext(sourceBetween('function exportTranslate', 'function plainObject'), context);

  const program = internalProgram('source', 'Kraftbasis');
  program.createdAt = NOW - 10_000;
  program.updatedAt = NOW;
  const exported = context.exportTranslate(program);

  assert.equal(exported.format, 'trainings-block');
  assert.equal(exported.version, 2);
  assert.equal(exported.createdAt, undefined);
  assert.equal(exported.updatedAt, undefined);
});

test('deleting from the editor keeps the program list open and clears editor state', () => {
  const confirmSource = sourceBetween('function confirmEditorDeleteProgram', 'function clearEditorDropTargets');
  assert.doesNotMatch(confirmSource, /\bcloseLib\s*\(\s*true\s*\)/);

  let overlayOpen = true;
  let editorReset = 0;
  let listRendered = 0;
  const deleted = [];
  const modals = [];
  const context = {
    editorSourceId: 'plan',
    S: { programs: { plan: { name: 'Mein Plan' } } },
    esc: value => String(value == null ? '' : value),
    closeLib() { overlayOpen = false; },
    openLib() { overlayOpen = true; listRendered++; },
    resetProgramEditorState() { editorReset++; },
    renderLib() { listRendered++; },
    deleteProgram(id) { deleted.push(id); listRendered++; return true; },
    showModal(title, message, actions) { modals.push({ title, message, actions }); }
  };
  vm.createContext(context);
  vm.runInContext(confirmSource, context);

  context.confirmEditorDeleteProgram();
  const confirmation = modals[0];
  assert.equal(confirmation.title, 'Programm wirklich löschen?');
  confirmation.actions[0].action();

  assert.equal(overlayOpen, true, 'Programme-Overlay darf beim Löschen nicht geschlossen werden');
  assert.deepEqual(deleted, ['plan']);
  assert.equal(editorReset, 1, 'Gelöschter Editorentwurf muss verworfen werden');
  assert.ok(listRendered >= 1, 'Programmliste muss nach dem Löschen sichtbar neu gerendert werden');
});
