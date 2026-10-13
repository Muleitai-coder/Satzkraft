const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { legacyContext, sampleProgram, sampleBackup } = require('../docs/prototyp/uebungsdatenbank/compatibility-probe.cjs');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const library = JSON.parse(fs.readFileSync(path.join(__dirname, '../uebungen.json'), 'utf8'));
const copy = value => JSON.parse(JSON.stringify(value));
function section(a, b) {
  const i = html.indexOf(a), j = html.indexOf(b, i);
  assert.ok(i >= 0 && j > i, a);
  return html.slice(i, j);
}
function context() {
  const c = legacyContext(true);
  Object.assign(c, { cloneJSON: copy, editorPendingReplacementRefs: {}, editorRenameChoices: {},
    currentTrainingWeekFor: () => 2, programUnitComplete: () => false,
    exerciseValidForWeek: (ex, week) => week >= (ex.fromWeek || 1) && week <= (ex.untilWeek || Infinity),
    normalizeSwapName: name => String(name || '').trim(), renderProgramEditor() {}, editorPushUndo() {},
    normalizeSwapWeight: value => value, modal: null, showModal: (title, text, actions) => { c.modal = { title, text, actions }; }
  });
  vm.runInContext(section('var EXERCISE_LIBRARY=', 'function loadExerciseLibrary('), c);
  vm.runInContext(section('function exerciseLibraryTypeSignature(', 'function exerciseSwapSuggestions('), c);
  vm.runInContext(section('function findExerciseLibraryEntry(', 'function canonicalExerciseName('), c);
  vm.runInContext(section('function editorLibraryTypeSignature(', 'function editorPhaseLabel('), c);
  vm.runInContext(section('function editorExerciseType(', 'function editorExerciseTypeOptions('), c);
  vm.runInContext(section('function editorBuildRefMap(', 'function openProgramEditor('), c);
  vm.runInContext(section('function applyPermanentReplacementMetadata(', 'function applyPermanentExerciseReplacement('), c);
  c.setExerciseLibrary(copy(library));
  return c;
}

test('keeps exactly ten approved IDs, excludes new assistance/sides and rejects duplicate catalog IDs atomically', () => {
  const c = context();
  assert.equal(library.filter(entry => entry.id).length, 10);
  assert.equal(library.find(entry => entry.de === 'Klimmzug-Maschine').id, undefined);
  assert.equal(library.find(entry => entry.de === 'Couch Stretch').id, undefined);
  assert.equal(c.findExerciseLibraryEntryById('plank').de, 'Plank');
  const malformed = copy(library); malformed.find(e => e.id === 'burpee_push_up').typ = 'unknown';
  assert.throws(() => c.setExerciseLibrary(malformed), /reference/);
  assert.throws(() => c.setExerciseLibrary([...copy(library), copy(library.find(e => e.id === 'plank'))]), /reference/);
  assert.equal(c.EXERCISE_LIBRARY.length, 200);
  assert.equal(c.findExerciseLibraryEntryById('plank').de, 'Plank');
});

test('preserves known optional identity and explicit prescription through v2 import/export while leaving free legacy names valid', () => {
  const c = context(), source = sampleProgram({ exerciseId: 'barbell_back_squat' });
  const before = JSON.stringify(source), parsed = c.parseProgram(before);
  assert.equal(parsed.err, undefined);
  assert.equal(parsed.prog.days[0].ex[0].exerciseId, 'barbell_back_squat');
  assert.equal(parsed.prog.days[0].ex[0].id, 'A_0');
  const exported = c.exportTranslate(parsed.prog);
  assert.equal(exported.version, 2);
  assert.equal(exported.days[0].exercises[0].exerciseId, 'barbell_back_squat');
  assert.equal(c.parseProgram(JSON.stringify(exported)).prog.days[0].ex[0].exerciseId, 'barbell_back_squat');
  assert.equal(JSON.stringify(source), before);
  assert.equal(c.parseProgram(JSON.stringify(sampleProgram({ name: 'Meine freie Übung' }))).err, undefined);
});

test('validates all ten supported identities even before the asynchronous library is available', () => {
  const c = legacyContext(true);
  for (const entry of library.filter(e => e.id)) {
    const timed = entry.typ === 'zeit', weighted = entry.typ === 'gewicht' || entry.typ === 'kgz' || entry.weightedTime;
    const exercise = { name: entry.de, exerciseId: entry.id, unit: timed ? 'seconds' : 'reps', perSide: !!entry.einseitig };
    if (weighted) Object.assign(exercise, { weighted: true, increment: 2.5, startWeight: 0 });
    else Object.assign(exercise, { weighted: false, increment: undefined, startWeight: undefined });
    if (entry.typ === 'kgz') exercise.bodyweight = true;
    assert.equal(c.parseProgram(JSON.stringify(sampleProgram(exercise))).err, undefined, entry.de);
  }
});

test('rejects unknown, personal, empty and conflicting references with an actionable JSON path', () => {
  const c = context();
  for (const patch of [
    { exerciseId: 'custom_test' }, { exerciseId: 'unknown' }, { exerciseId: null }, { exerciseId: '' },
    { exerciseId: 'plank' }, { exerciseId: 'barbell_back_squat', perSide: true },
    { exerciseId: 'barbell_back_squat', weighted: 'true' },
    { exerciseId: 'barbell_back_squat', tracking: { loadMode: 'assistance' } },
    { exerciseId: 'assisted_pull_up_machine' }, { exerciseId: 'couch_stretch' }
  ]) {
    const result = c.parseProgram(JSON.stringify(sampleProgram(patch)));
    assert.ok(result.err, JSON.stringify(patch));
    assert.equal(result.path, 'days[0].exercises[0].exerciseId');
  }
});

test('does not infer seconds for a referenced carry or silently change a mismatched timer', () => {
  const c = context();
  const base = { name: 'Suitcase Carry', exerciseId: 'suitcase_carry', perSide: true };
  assert.ok(c.parseProgram(JSON.stringify(sampleProgram(base))).err);
  assert.ok(c.parseProgram(JSON.stringify(sampleProgram({ ...base, unit: 'reps', timerMode: 'target' }))).err);
  const parsed = c.parseProgram(JSON.stringify(sampleProgram({ ...base, unit: 'time', timerMode: 'target', reps: [30, 60] })));
  assert.equal(parsed.err, undefined);
  assert.equal(parsed.prog.days[0].ex[0].unit, 'seconds');
  assert.ok(c.parseProgram(JSON.stringify(sampleProgram({ ...base, unit: 'time', reps: [30, 6000] }))).err);
});

test('selection binds identity, reference removal needs confirmation and preserves the other fields', () => {
  const c = context(), draft = sampleProgram();
  c.editorDraft = draft;
  const ex = draft.days[0].exercises[0];
  c.editorApplyExerciseLibraryEntry(ex, library.find(e => e.id === 'barbell_back_squat'));
  assert.equal(ex.exerciseId, 'barbell_back_squat');
  const before = copy(ex);
  assert.equal(c.editorReleaseReference(0, 0, false), false);
  assert.deepEqual(ex, before);
  c.modal.actions[0].action();
  delete before.exerciseId; delete before._referenceName;
  assert.deepEqual(ex, before);
  assert.equal(ex.startWeight, 60);
});

test('free renaming explicitly retains or releases identity; cancel preserves the original draft', () => {
  const c = context(); c.editorDraft = sampleProgram({ exerciseId: 'barbell_back_squat', _referenceName: 'Langhantel-Kniebeuge', _ref: 'A_0', name: 'Mein Name' });
  let continued = 0;
  assert.equal(c.editorConfirmReferenceNames(() => continued++), false);
  assert.equal(c.editorDraft.days[0].exercises[0].exerciseId, 'barbell_back_squat');
  assert.equal(c.modal.actions[2].action, null);
  c.modal.actions[0].action();
  assert.equal(continued, 1);
  assert.equal(c.editorRenameChoices.A_0, 'same');
  assert.equal(c.editorConfirmReferenceNames(() => continued++), true);
  c.editorDraft.days[0].exercises[0].name = 'Andere Übung';
  c.editorConfirmReferenceNames(() => continued++); c.modal.actions[1].action();
  assert.equal(c.editorDraft.days[0].exercises[0].exerciseId, undefined);
});

test('identity change creates a timeline successor even with unchanged display name and type', () => {
  const c = context(), old = c.parseProgram(JSON.stringify(sampleProgram({ exerciseId: 'barbell_back_squat' }))).prog;
  old.weeks = [{ n: 1, sets: { kraft: 3 } }, { n: 2, sets: { kraft: 3 } }, { n: 3, sets: { kraft: 3 } }];
  const fresh = copy(old); fresh.days[0].ex[0].exerciseId = 'dumbbell_bench_press';
  const draft = { days: [{ key: 'A', exercises: [{ _ref: 'A_0' }] }] };
  const logs = { '1|A|A_0': { sets: [{ reps: '8', weight: '60' }] } };
  const result = c.timelineProgramFromEdit(old, fresh, draft, { logs });
  assert.equal(result.days[0].ex.length, 2);
  assert.equal(result.days[0].ex[0].exerciseId, 'barbell_back_squat');
  assert.equal(result.days[0].ex[0].untilWeek, 1);
  assert.equal(result.days[0].ex[1].exerciseId, 'dumbbell_bench_press');
  assert.equal(result.days[0].ex[1].prevId, 'A_0');
  assert.deepEqual(logs, { '1|A|A_0': { sets: [{ reps: '8', weight: '60' }] } });
});

test('same reference retains position, and permanent replacement updates or clears the original identity', () => {
  const c = context(), old = c.parseProgram(JSON.stringify(sampleProgram({ exerciseId: 'barbell_back_squat' }))).prog;
  old.weeks.push(copy(old.weeks[0]));
  const same = c.timelineProgramFromEdit(old, copy(old), { days: [{ key: 'A', exercises: [{ _ref: 'A_0' }] }] }, { logs: {} });
  assert.equal(same.days[0].ex[0].id, 'A_0');
  const replacement = copy(old.days[0].ex[0]);
  c.applyPermanentReplacementMetadata(replacement, 'Kurzhantel-Bankdrücken');
  assert.equal(replacement.exerciseId, 'dumbbell_bench_press');
  c.applyPermanentReplacementMetadata(replacement, 'Eigener Ersatz');
  assert.equal(replacement.exerciseId, undefined);
});

test('backup keeps compatible references, validates archived programs and rejects raw mismatches independently', () => {
  const c = context(), parsed = c.parseProgram(JSON.stringify(sampleProgram({ exerciseId: 'barbell_back_squat' }))).prog;
  const backup = sampleBackup(copy(parsed));
  assert.equal(c.validateBackupFile(backup), null);
  for (const malformedDays of ['broken', [null], [{ ex: 'broken' }]]) {
    const broken = copy(backup); broken.programs.sample.days = malformedDays;
    assert.ok(c.validateBackupFile(broken));
  }
  c.S = copy(backup);
  assert.equal(JSON.parse(c.backupJSON()).programs.sample.days[0].ex[0].exerciseId, 'barbell_back_squat');
  const archive = copy(parsed); archive.archived = true; archive.days[0].ex[0].exerciseId = 'unknown';
  backup.programs.archived = archive; backup.store.archived = copy(backup.store.sample);
  assert.ok(c.validateBackupFile(backup));
  delete backup.programs.archived; delete backup.store.archived;
  backup.programs.sample.days[0].ex[0].w = 'true';
  assert.ok(c.validateBackupFile(backup));
});

test('an old-reader roundtrip drops only optional identity and does not reacquire it from the name', () => {
  const c = context(), old = legacyContext();
  const source = sampleProgram({ exerciseId: 'barbell_back_squat' });
  const legacy = old.parseProgram(JSON.stringify(source));
  const exported = old.exportTranslate(legacy.prog);
  assert.equal(exported.days[0].exercises[0].exerciseId, undefined);
  assert.equal(exported.days[0].exercises[0].startWeight, 60);
  assert.equal(c.parseProgram(JSON.stringify(exported)).prog.days[0].ex[0].exerciseId, undefined);
});

test('followup copies keep identity and queued replacements receive the replacement identity', () => {
  const c = context(), program = c.parseProgram(JSON.stringify(sampleProgram({ exerciseId: 'barbell_back_squat' }))).prog;
  Object.assign(c, { sanitizePendingReplacements: pending => pending || [], followupBlockName: () => 'Folgeblock',
    dayExercisesFor: day => day.ex, followupStartWeight: () => 60, replacementStartWeight: () => 20, round: value => value });
  vm.runInContext(section('function buildFollowupProgram(', 'function editorUniqueCopyName('), c);
  const before = JSON.stringify(program);
  const same = c.buildFollowupProgram(program, { pendingReplacements: [] }, {});
  assert.equal(same.days[0].ex[0].exerciseId, 'barbell_back_squat');
  const changed = c.buildFollowupProgram(program, { pendingReplacements: [{ day: 'A', exId: 'A_0', name: 'Kurzhantel-Bankdrücken' }] }, {});
  assert.equal(changed.days[0].ex[0].exerciseId, 'dumbbell_bench_press');
  assert.equal(JSON.stringify(program), before);
});

test('reference repair opens the untouched imported fields rather than silently removing the failed identity', () => {
  const c = context(); c.S = { programs: {} };
  vm.runInContext(section('var pendingProgramImport=', 'function importUpdateTargetId('), c);
  const source = sampleProgram({ exerciseId: 'unknown', startWeight: 20 });
  const prepared = c.prepareProgramImport(JSON.stringify(source), 'json', 'Probe');
  assert.equal(prepared.repair.kind, 'exercise-reference');
  c.importIssue = prepared;
  let opened;
  c.openProgramDraft = raw => { opened = raw; };
  c.repairImportInEditor();
  assert.equal(opened.days[0].exercises[0].exerciseId, 'unknown');
  assert.equal(opened.days[0].exercises[0].startWeight, 20);
});

test('owner restriction and storage failure preserve identified program drafts and report no success', () => {
  const c = context(); c.editorDraft = sampleProgram({ exerciseId: 'barbell_back_squat' });
  c.localWriteBlocked = () => true;
  vm.runInContext(section('function editorStoreProgram(', 'function programWriteLocked('), c);
  assert.equal(c.editorStoreProgram(false, 'back', false), false);
  assert.equal(c.editorDraft.days[0].exercises[0].exerciseId, 'barbell_back_squat');
  c.localWriteBlocked = () => false; c.S = sampleBackup(c.parseProgram(JSON.stringify(c.editorDraft)).prog);
  c.localStorage = { setItem() { throw new Error('quota'); } }; c.KEY = 'test'; c.storageErrorShown = false; c.setTimeout = () => 1;
  vm.runInContext(section('function persist()', 'var saveT,'), c);
  const before = JSON.stringify(c.S);
  assert.equal(c.persist(), false); assert.equal(JSON.stringify(c.S), before);
});
