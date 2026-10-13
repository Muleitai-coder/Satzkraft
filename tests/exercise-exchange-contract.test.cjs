const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const folder = path.resolve(__dirname, '../docs/prototyp/uebungsdatenbank');
const { probe, report } = require(path.join(folder, 'compatibility-probe.cjs'));
const result = probe();

test('documents metadata loss through the actual legacy v2 import and export', () => {
  assert.equal(result.safe.accepted, true);
  assert.equal(result.safe.identityPreserved, false);
  assert.equal(result.safe.trackingPreserved, false);
  assert.equal(result.safe.inputUnchanged, true);
  const exercise = result.safe.reexport.days[0].exercises[0];
  assert.equal(exercise.exerciseId, undefined); assert.equal(exercise.tracking, undefined);
  assert.equal(exercise.weighted, true); assert.equal(exercise.startWeight, 60);
});

test('demonstrates why unknown capability flags cannot protect assistance semantics in v2', () => {
  assert.equal(result.assistance.accepted, true);
  assert.equal(result.assistance.capabilityFlagEnforced, false);
  assert.equal(result.assistance.position.w, true);
  assert.equal(result.assistance.position.bw, false);
  assert.equal(result.assistance.position.unit, 'reps');
  assert.equal(result.assistance.position.def, 30);
  assert.equal(result.assistance.position.tracking, undefined);
});

test('proves legacy rejection at an unsupported format/version boundary without introducing either', () => {
  assert.match(result.assistance.version3Error, /Nicht unterstützte Programmversion/);
  assert.match(result.assistance.otherFormatError, /format/);
});

test('preserves the supported v2 weighted-time contract through the actual legacy roundtrip', () => {
  assert.equal(result.carry.position.unit, 'seconds');
  assert.equal(result.carry.position.w, true);
  const exercise = result.carry.reexport.days[0].exercises[0];
  assert.equal(exercise.unit, 'seconds'); assert.equal(exercise.weighted, true);
  assert.equal(exercise.perSide, true); assert.equal(exercise.timerMode, 'target');
  assert.deepEqual(exercise.reps, [30, 60]); assert.equal(exercise.startWeight, 20);
});

test('detects unvalidated new metadata and catalog loss in the actual schema-4 backup path', () => {
  assert.equal(result.backup.validation, null);
  assert.equal(result.backup.customDefinitionsPreserved, false);
  assert.equal(result.backup.performedExercise.exerciseId, 'assisted_pull_up_machine');
  assert.equal(result.backup.performedExercise.trackingSnapshot.loadMode, 'assistance');
  assert.deepEqual(result.backup.rewrittenSets, result.backup.originalSets);
  assert.equal(result.backup.inputUnchanged, true);
});

test('proves the old backup validator rejects a higher data schema', () => {
  assert.match(result.backup.newerSchemaError, /neueren oder unbekannten Datenversion/);
});

test('keeps the saved compatibility evidence consistent with the actual synthetic probe', () => {
  assert.equal(report(result), fs.readFileSync(path.join(folder, 'KOMPATIBILITAETSBERICHT.md'), 'utf8'));
});
