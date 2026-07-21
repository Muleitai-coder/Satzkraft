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

const typeStart = html.indexOf('function editorExerciseType');
const typeEnd = html.indexOf('function renderEditorTraining', typeStart);
assert.ok(typeStart >= 0 && typeEnd > typeStart, 'Übungstyp-Hilfsfunktionen wurden nicht gefunden');
vm.runInContext(html.slice(typeStart, typeEnd), context);

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
  assert.match(html, /var exported=cloneJSON\(exportTranslate\(p\)\)/);
  const original = { weeks: [{ sets: { kraft: 3 } }], settings: { deloadMultiplier: 0.6 } };
  const draft = context.cloneJSON(original);
  draft.weeks[0].sets.neu = 4;
  draft.settings.deloadMultiplier = 0.5;
  assert.deepEqual(original, { weeks: [{ sets: { kraft: 3 } }], settings: { deloadMultiplier: 0.6 } });
});

test('starts in the familiar training view and separates novice from expert settings', () => {
  assert.match(html, /editorView="training"/);
  assert.match(
    html,
    /function openProgramDraft[\s\S]*?editorExerciseIndex=null;[\s\S]*?renderProgramEditor\(\);/
  );
  assert.match(html, />Training<\/button>.*>Wochen<\/button>.*>Details<\/button>/s);
  assert.match(html, /Anstrengung/);
  assert.match(html, /Satzzahlen der Trainingsgruppen/);
  assert.match(html, /Trainingsgruppen \('/);
  assert.match(html, /So funktioniert der Editor/);
  assert.match(html, /EDITOR_INFO=/);
  assert.match(html, /data-ed-section=/);
});

test('covers the iPhone safe area below the editor actions', () => {
  assert.match(html, /\.edsticky\{[^}]*padding:12px 18px calc\(12px \+ env\(safe-area-inset-bottom\)\)[^}]*background:var\(--barbg\)/);
  assert.match(html, /--barbg:rgba\(8,9,11,\.92\)/);
  assert.match(html, /--barbg:rgba\(239,236,229,\.92\)/);
  assert.match(html, /\.edsticky\{margin-bottom:-14px\}/);
});

test('uses one clear rename path and compact program actions', () => {
  assert.doesNotMatch(html, /data-ren=/);
  assert.doesNotMatch(html, /libRenameId/);
  assert.match(html, /data-edit=/);
  assert.match(html, /progtextaction/);
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

test('uses a flat secondary program list and compact flexible actions', () => {
  assert.match(html, /\.programothersbody \.progitem\{border:0/);
  assert.match(html, /\.progitem\.active\{[^}]*background:var\(--panel\)/);
  assert.match(html, /\.progactions\{display:flex/);
  assert.match(html, /\.progtextaction\{[^}]*background:transparent/);
  assert.match(html, /html\[data-theme="light"\] \.progitem\.active/);
  assert.match(html, /id="coachbtn"/);
  assert.match(html, /id="importbtn"/);
  assert.match(html, /id="manualcreate"/);
  assert.match(html, /id="externalaibtn"/);
  assert.match(html, /Manuell erstellen/);
  assert.match(html, /Satzkraft KI-Coach/);
  assert.match(html, /Mit ChatGPT &amp; Co\. erstellen/);
  assert.match(html, /Fertiges Programm importieren/);
});

test('uses a shared preview and a dedicated unsaved draft mode', () => {
  assert.match(html, /function prepareProgramImport/);
  assert.match(html, /function renderImportPreview/);
  assert.match(html, /Speichern &amp; aktivieren/);
  assert.match(html, /Nur speichern/);
  assert.match(html, /Vorher bearbeiten/);
  assert.match(html, /editorUnsavedDraft/);
  assert.match(html, /id="edsavenew"/);
  assert.match(html, /id="edsavenewactive"/);
  assert.match(html, /Plan prüfen &amp; speichern/);
  assert.match(html, /class="librarypreviewexercise"/);
  assert.match(html, /class="tag '\+color/);
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
  assert.match(html, /\(isOpen\?'':'<button class="eddrag" data-ed-drag-ex=/);
  assert.match(html, /Date\.now\(\)<editorSuppressClickUntil/);
});

test('reuses a numeric exercise hint when enabling an explicit prescription', () => {
  assert.deepEqual(Array.from(context.editorTargetReps({ target: '3–5 explosive Reps' })), [3, 5]);
  assert.deepEqual(Array.from(context.editorTargetReps({ target: '45 Sekunden' })), [45, 45]);
  assert.equal(context.editorTargetReps({ target: 'sauber und kontrolliert' }), null);
});

test('maps the four novice exercise types without rewriting exotic settings', () => {
  assert.equal(context.editorExerciseType({ weighted: true, unit: 'reps' }), 'weight');
  assert.equal(context.editorExerciseType({ unit: 'reps' }), 'bodyweight');
  assert.equal(context.editorExerciseType({ weighted: true, bodyweight: true, unit: 'reps' }), 'added_weight');
  assert.equal(context.editorExerciseType({ unit: 'seconds' }), 'seconds');
  assert.equal(context.editorExerciseType({ weighted: true, unit: 'seconds' }), 'custom');
  assert.match(html, /Individuell \(aktuelle Einstellung\)/);
  assert.doesNotMatch(html, /Was wird eingetragen\?/);
  assert.doesNotMatch(html, /> Gewicht erfassen</);
});

test('offers target and maximum timer modes while creating time exercises', () => {
  assert.match(html, /Timer-Modus/);
  assert.match(html, /Zielzeit · stoppt am oberen Ziel automatisch/);
  assert.match(html, /Maximalzeit · läuft bis zu meinem Stopp/);
  assert.match(html, /if\(ex\.unit==="seconds"&&!ex\.timerMode\)ex\.timerMode="target"/);
});

test('edits guided warm-up and cool-down blocks with undo and limits', () => {
  assert.match(html, /Warm-up &amp; Cool-down/);
  assert.match(html, /Rein zeitbasiert, geführt mit Timer/);
  assert.match(html, /data-ed-wucd-add=/);
  assert.match(html, /data-ed-wucd-move=/);
  assert.match(html, /data-ed-wucd-delete=/);
  assert.match(html, /list\.length>=8/);
  assert.match(html, /Math\.max\(15,Math\.min\(180/);
});

test('centers disclosure arrows and uses a plain information glyph', () => {
  assert.match(html, /\.edadvanced>summary:after\{[^}]*top:50%[^}]*translateY\(-50%\)/);
  assert.match(html, /info:'<path fill="currentColor" stroke="none" d="[^"]+"\/>/);
  assert.doesNotMatch(html, /info:'<circle/);
});

test('offers a complete external-AI handoff and exports from the program library', () => {
  assert.match(html, /1 · Trainingswunsch eintragen/);
  assert.match(html, /2 · Text für ChatGPT kopieren/);
  assert.match(html, /3 · Ergebnis importieren/);
  assert.match(html, /function externalAiPrompt\(wish\)/);
  assert.match(html, /Antworte NUR mit dem/);
  assert.match(html, /vollständigen fertigen JSON/);
  assert.match(html, /id="externalwish"/);
  assert.match(html, /id="tplpromptcopy"/);
  assert.match(html, /Exportieren &amp; Teilen/);
  assert.match(html, /trainings_richtlinien/);
  assert.match(html, /Startgewichte konservativ waehlen/);
});
