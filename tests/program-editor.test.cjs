const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const start = html.indexOf('function cloneJSON');
const end = html.indexOf('function openProgramEditor', start);
assert.ok(start >= 0 && end > start, 'Editor-Hilfsfunktionen wurden nicht gefunden');

const context = {};
vm.createContext(context);
vm.runInContext(html.slice(start, end), context);

const targetStart = html.indexOf('function editorTargetReps');
const targetEnd = html.indexOf('function editorExerciseMeta', targetStart);
assert.ok(targetStart >= 0 && targetEnd > targetStart, 'Zielbereich-Erkennung wurde nicht gefunden');
vm.runInContext(html.slice(targetStart, targetEnd), context);

const moveStart = html.indexOf('function editorMoveExerciseToGap');
const moveEnd = html.indexOf('function confirmEditorDeleteWeek', moveStart);
assert.ok(moveStart >= 0 && moveEnd > moveStart, 'Drag-and-drop-Hilfsfunktionen wurden nicht gefunden');
context.EDITOR_WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
vm.runInContext(html.slice(moveStart, moveEnd), context);

test('creates stable category keys without overwriting existing categories', () => {
  assert.equal(context.editorNextCategoryKey({}), 'kategorie');
  assert.equal(context.editorNextCategoryKey({ kategorie: {}, kategorie2: {} }), 'kategorie3');
});

test('creates unique compact day keys', () => {
  assert.equal(context.editorNextDayKey([{ key: 'A' }, { key: 'C' }]), 'B');
  const alphabet = Array.from({ length: 26 }, (_, index) => ({ key: String.fromCharCode(65 + index) }));
  assert.equal(context.editorNextDayKey(alphabet), 'Tag1');
});

test('detects categories that are still used by exercises', () => {
  const draft = { days: [{ exercises: [{ category: 'kraft' }] }, { exercises: [{ category: 'core' }] }] };
  assert.equal(context.editorCategoryInUse(draft, 'kraft'), true);
  assert.equal(context.editorCategoryInUse(draft, 'mobilitaet'), false);
});

test('renumbers weeks after structural edits', () => {
  const draft = { weeks: [{ n: 1 }, { n: 3 }, { n: 8 }] };
  context.editorRenumberWeeks(draft);
  assert.deepEqual(draft.weeks.map(week => week.n), [1, 2, 3]);
});

test('keeps editor drafts deeply separated from the original program', () => {
  assert.match(html, /editorDraft=cloneJSON\(exportTranslate\(p\)\)/);
  const original = { weeks: [{ sets: { kraft: 3 } }], settings: { deloadMultiplier: 0.6 } };
  const draft = context.cloneJSON(original);
  draft.weeks[0].sets.neu = 4;
  draft.settings.deloadMultiplier = 0.5;
  assert.deepEqual(original, { weeks: [{ sets: { kraft: 3 } }], settings: { deloadMultiplier: 0.6 } });
});

test('starts in the familiar training view and separates novice from expert settings', () => {
  assert.match(html, /editorView="training"/);
  assert.match(html, />Training<\/button>.*>Wochen<\/button>.*>Details<\/button>/s);
  assert.match(html, /Anstrengung/);
  assert.match(html, /Satzzahlen der Trainingsgruppen/);
  assert.match(html, /Trainingsgruppen \('/);
  assert.match(html, /Editor-Anleitung/);
});

test('uses one clear rename path and compact program actions', () => {
  assert.doesNotMatch(html, /data-ren=/);
  assert.doesNotMatch(html, /libRenameId/);
  assert.match(html, /Name und Löschen findest du gesammelt unter „Bearbeiten“/);
  assert.match(html, /data-edit=/);
  assert.match(html, /edit-only/);
  assert.match(html, /Weitere Programme \('/);
  assert.doesNotMatch(html, /class="progaction del"/);
});

test('supports explicit prescriptions, undo, guarded deletes and accessible reordering', () => {
  assert.match(html, /Trainingsvorgabe/);
  assert.match(html, /data-ed-own=/);
  assert.match(html, /data-ed-field="sets"/);
  assert.match(html, /data-ed-field="repMin"/);
  assert.match(html, /id="editorundo"/);
  assert.match(html, /Woche wirklich löschen/);
  assert.match(html, /Trainingstag wirklich löschen/);
  assert.match(html, /data-ed-drag-ex=/);
  assert.match(html, /data-ed-drag-day=/);
  assert.match(html, /data-ed-moveex=/);
});

test('warns about unsaved changes and locks the page behind the editor', () => {
  assert.match(html, /Änderungen noch nicht gespeichert/);
  assert.match(html, /editorHasUnsavedChanges/);
  assert.match(html, /beforeunload/);
  assert.match(html, /body\.surface-locked/);
  assert.match(html, /lockSurfaceScroll/);
});

test('uses a flat secondary program list and a stronger active state', () => {
  assert.match(html, /\.programothersbody \.progitem\{border:0/);
  assert.match(html, /\.progitem\.active\{[^}]*background:linear-gradient/);
  assert.match(html, /\.progactions\{display:grid;grid-template-columns:repeat\(2/);
  assert.match(html, /html\[data-theme="light"\] \.progitem\.active/);
  assert.match(html, /<details class="programcreate">/);
  assert.match(html, /Neues Programm erstellen/);
  assert.match(html, /KI-Coach, Vorlage oder fertige Datei/);
});

test('applies the live preview order and requires approval before swapping occupied days', () => {
  context.editorDraft = { days: [{ exercises: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }] }] };
  assert.equal(context.editorApplyExerciseOrder(0, [1, 2, 0, 3]), true);
  assert.deepEqual(context.editorDraft.days[0].exercises.map(ex => ex.name), ['B', 'C', 'A', 'D']);
  assert.equal(context.editorApplyExerciseOrder(0, [0, 1, 2, 3]), false);

  context.editorDraft = { days: [
    { weekday: 'Montag', title: 'Oberkörper', exercises: [] },
    { weekday: 'Mittwoch', title: 'Unterkörper', exercises: [] }
  ] };
  assert.equal(context.editorMoveDayToWeekday(0, 2, false), false);
  assert.deepEqual(context.editorDraft.days.map(day => day.weekday), ['Montag', 'Mittwoch']);
  assert.equal(context.editorMoveDayToWeekday(0, 2, true), true);
  assert.deepEqual(context.editorDraft.days.map(day => day.weekday), ['Mittwoch', 'Montag']);
  assert.match(html, /Trainingstage tauschen\?/);
  assert.match(html, /editorPreviewExerciseMove/);
  assert.match(html, /previewOrder/);
  assert.match(html, /edordernum/);
  assert.doesNotMatch(html, /insert-before/);
  assert.doesNotMatch(html, /insert-after/);
  assert.match(html, /dragging-source/);
  assert.match(html, /data-ed-openex=.*data-ed-drag-ex=/s);
  assert.match(html, /Date\.now\(\)<editorSuppressClickUntil/);
});

test('reuses a numeric exercise hint when enabling an explicit prescription', () => {
  assert.deepEqual(Array.from(context.editorTargetReps({ target: '3–5 explosive Reps' })), [3, 5]);
  assert.deepEqual(Array.from(context.editorTargetReps({ target: '45 Sekunden' })), [45, 45]);
  assert.equal(context.editorTargetReps({ target: 'sauber und kontrolliert' }), null);
});
