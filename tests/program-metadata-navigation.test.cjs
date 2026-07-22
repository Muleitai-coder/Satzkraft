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
  const activations = [];
  const editorExits = [];
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
    setActive(id) { activations.push(id); context.S.active = id; return true; },
    flushSave() {},
    genId: () => 'generated',
    finishEditorSave(exitMode) { editorExits.push(exitMode); },
    saveCoachPreferences() {},
    editorHasPendingReplacements: () => false,
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
  return { context, modals, activations, editorExits };
}

test('stores timestamps while copies and replacements return to the list without activating themselves', () => {
  const source = internalProgram('source', 'Kraftbasis');
  source.origin = 'satzkraft';
  source.createdAt = NOW - 10_000;
  source.updatedAt = NOW - 5_000;
  const active = internalProgram('active', 'Aktiver Plan');

  const copyRun = loadEditorStoreContext(JSON.parse(JSON.stringify(source)));
  copyRun.context.S.programs.active = active;
  copyRun.context.S.store.active = { logs: {} };
  copyRun.context.S.active = 'active';
  copyRun.context.editorStoreProgram(false, 'back', false);
  const copy = copyRun.context.S.programs.copy;
  assert.ok(copy, 'Programmkopie wurde nicht gespeichert');
  assert.match(copy.name, / \(Kopie\)$/);
  assert.equal(copy.createdAt, NOW);
  assert.equal(copy.updatedAt, NOW);
  assert.equal(copy.origin, undefined, 'eine Editor-Kopie ist kein offizielles Satzkraft-Programm');
  assert.equal(copyRun.context.S.active, 'active', 'eine Editor-Kopie darf das aktive Programm nicht wechseln');
  assert.deepEqual(copyRun.activations, []);
  assert.deepEqual(copyRun.editorExits, ['back'], 'nach dem Speichern der Kopie muss die Programmübersicht folgen');
  assert.match(copyRun.modals.at(-1).message, /aktives Programm bleibt unverändert/);

  const replaceRun = loadEditorStoreContext(JSON.parse(JSON.stringify(source)));
  replaceRun.context.S.programs.active = active;
  replaceRun.context.S.store.active = { logs: {} };
  replaceRun.context.S.active = 'active';
  replaceRun.context.editorStoreProgram(true, 'back', false);
  const replacementPrompt = replaceRun.modals.find(modal => modal.title === 'Original ersetzen?');
  assert.ok(replacementPrompt, 'Ersetzen-Rückfrage fehlt');
  replacementPrompt.actions[0].action();
  const replaced = replaceRun.context.S.programs.source;
  assert.equal(replaced.createdAt, source.createdAt, 'Erstellungsdatum des Originals muss erhalten bleiben');
  assert.equal(replaced.updatedAt, NOW, 'Änderungsdatum muss beim Ersetzen erneuert werden');
  assert.equal(replaced.origin, 'satzkraft', 'Bearbeiten des Originals erhält dessen Herkunft');
  assert.equal(replaceRun.context.S.active, 'active', 'das Ersetzen eines anderen Programms darf es nicht aktivieren');
  assert.deepEqual(replaceRun.activations, []);
  assert.deepEqual(replaceRun.editorExits, ['back'], 'nach dem Ersetzen muss die Programmübersicht folgen');
});

test('wires copy and replace actions to the non-activating back path', () => {
  const events = sourceBetween(
    'document.getElementById("lib").addEventListener("click"',
    'document.getElementById("lib").addEventListener("toggle"'
  );
  assert.match(events, /b\.id==="edsavecopy"\)\{editorStoreProgram\(false,"back",false\)/);
  assert.match(events, /b\.id==="edreplace"\)\{editorStoreProgram\(true,"back",false\)/);

  const navigation = sourceBetween('function resetProgramEditorState', 'function discardEditorAndReturn');
  assert.match(navigation, /function finishEditorSave\(exitMode\).*exitMode==="back".*renderLib\(\)/s);
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

test('deleting from the program card keeps the program list open', () => {
  const confirmSource = sourceBetween('function confirmDeleteProgram', 'function showShareModal');
  assert.doesNotMatch(confirmSource, /\bcloseLib\s*\(/);

  let overlayOpen = true;
  let listRendered = 0;
  const deleted = [];
  const modals = [];
  const context = {
    S: { programs: { plan: { name: 'Mein Plan' } }, active: 'plan' },
    esc: value => String(value == null ? '' : value),
    programWriteLocked: () => false,
    showProgramWriteLocked() {},
    closeLib() { overlayOpen = false; },
    deleteProgram(id) { deleted.push(id); listRendered++; return true; },
    showModal(title, message, actions) { modals.push({ title, message, actions }); }
  };
  vm.createContext(context);
  vm.runInContext(confirmSource, context);

  context.confirmDeleteProgram('plan');
  const confirmation = modals[0];
  assert.equal(confirmation.title, 'Programm wirklich löschen?');
  confirmation.actions[0].action();

  assert.equal(overlayOpen, true, 'Programme-Overlay darf beim Löschen nicht geschlossen werden');
  assert.deepEqual(deleted, ['plan']);
  assert.ok(listRendered >= 1, 'Programmliste muss nach dem Löschen sichtbar neu gerendert werden');
  assert.equal(modals[1].title, 'Programm gelöscht');
});
