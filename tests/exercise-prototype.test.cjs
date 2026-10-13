const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const folder = path.join(root, 'docs/prototyp/uebungsdatenbank');
const contract = require(path.join(folder, 'contract.cjs'));
const { createLegacyResolver } = require(path.join(folder, 'legacy-mapping.cjs'));
const { analyse } = require(path.join(folder, 'analyse.cjs'));
const read = file => JSON.parse(fs.readFileSync(path.join(folder, file), 'utf8'));
const catalog = read('referenzuebungen.json');
const cases = read('referenzfaelle.json').cases;
const library = JSON.parse(fs.readFileSync(path.join(root, 'uebungen.json'), 'utf8'));
const copy = value => structuredClone(value);
const ex = id => catalog.exercises.find(item => item.id === id);
const performance = id => copy(cases.find(item => item.exerciseId === id).performance);
const resolve = createLegacyResolver(catalog);

test('models all twelve approved cases with distinct library identities and valid definitions', () => {
  assert.deepEqual(contract.validateCatalog(catalog), { valid: true, errors: [], warnings: [] });
  assert.equal(catalog.exercises.length, 12);
  assert.equal(cases.length, 12);
  assert.equal(new Set(catalog.exercises.map(item => item.id)).size, 12);
  cases.forEach((item, i) => {
    assert.equal(item.id, 'R' + String(i + 1).padStart(2, '0'));
    assert.ok(library.some(old => old.de === ex(item.exerciseId).name.de));
    assert.notEqual(item.exerciseId, item.programPosition.id);
    assert.equal(item.performance.positionId, item.programPosition.id);
    assert.equal(contract.validatePerformance(ex(item.exerciseId), item.performance).valid, true);
  });
});

test('rejects unknown tracking fields, distance, conflicting load and side conventions', () => {
  const base = ex('plank').tracking;
  for (const patch of [
    { metric: 'distance' }, { distance: 100 }, { loadMode: 'none', loadEntry: 'total' },
    { loadMode: 'external', loadEntry: 'not_applicable' },
    { laterality: 'single_side' }, { laterality: 'unilateral_each_side', counting: 'total' },
    { laterality: 'bilateral', counting: 'per_side' },
    { loadMode: 'added', loadEntry: 'per_implement' },
    { metric: 'seconds', loadMode: 'assistance', loadEntry: 'machine_display' }
  ]) assert.ok(contract.validateTracking({ ...base, ...patch }).length, JSON.stringify(patch));
  assert.ok(contract.validateTracking(null).length);
});

test('rejects a reversed assistance progression, duration/reps mismatch and mobility load progression', () => {
  for (const [id, primary] of [['assisted_pull_up_machine', 'load'], ['plank', 'reps'], ['barbell_back_squat', 'duration'], ['couch_stretch', 'duration']]) {
    const changed = copy(catalog);
    changed.exercises.find(item => item.id === id).progression.primary = primary;
    assert.equal(contract.validateCatalog(changed).valid, false);
  }
});

test('allows personal exercises without technique, but rejects conflicting IDs and invalid definitions', () => {
  const changed = copy(catalog);
  const custom = copy(ex('plank'));
  custom.id = 'custom_hold'; custom.origin = 'custom'; custom.name = { de: 'Mein Halten' }; custom.aliases = [];
  delete custom.technique;
  changed.exercises.push(custom);
  assert.equal(contract.validateCatalog(changed).valid, true);
  const conflicting = copy(custom); conflicting.tracking.metric = 'reps'; conflicting.progression.primary = 'reps';
  changed.exercises.push(conflicting);
  assert.ok(contract.validateCatalog(changed).errors.some(error => error.code === 'duplicate_id'));
  assert.throws(() => createLegacyResolver(changed), /Ungültiger/);
  for (const malformed of [null, {}, { format: 'satzkraft-exercise-prototype', version: 1, exercises: [null] }]) assert.equal(contract.validateCatalog(malformed).valid, false);
});

test('keeps explicitly directed relations and rejects missing or self-referencing targets', () => {
  const changed = copy(catalog), squat = changed.exercises[0];
  squat.substitutes = { status: 'maintained', relations: [{ exerciseId: 'leg_press', relation: 'equipment_alternative' }] };
  const before = JSON.stringify(changed);
  assert.equal(contract.validateCatalog(changed).valid, true);
  assert.equal(JSON.stringify(changed), before);
  assert.deepEqual(changed.exercises.find(item => item.id === 'leg_press').substitutes.relations, []);
  for (const id of ['unknown', squat.id]) {
    squat.substitutes.relations[0].exerciseId = id;
    assert.equal(contract.validateCatalog(changed).valid, false);
  }
});

test('renders all actual reference values without multiplying load, counting sides or creating metrics', () => {
  const expected = [
    '8 Wdh · 60 kg gesamt', '10 Wdh · 20 kg pro Hantel', '12 Wdh · 80 kg · Gerät A',
    '6 Wdh · +0 kg', '8 Wdh · 30 kg Unterstützung · Gerät A', '10 Wdh je Seite · 18 kg pro Hantel',
    '0:45 min', '1:00 min je Seite · 20 kg pro Hantel', '12 Wdh', '0:30 min', '0:45 min je Seite', '10:00 min'
  ];
  const before = JSON.stringify({ catalog, cases });
  cases.forEach((item, i) => {
    const result = contract.describePerformance(ex(item.exerciseId), item.performance);
    assert.equal(result.summary, expected[i]);
    assert.equal(result.e1RM, null); assert.equal(result.strengthVolume, null); assert.equal(result.trendScore, null);
  });
  assert.equal(JSON.stringify({ catalog, cases }), before);
});

test('distinguishes missing load from zero and rejects invalid numeric values at the actual app limits', () => {
  const definition = ex('pull_up_added_load'), record = performance(definition.id);
  assert.match(contract.describePerformance(definition, record).summary, /\+0 kg/);
  record.sets[0].load = null;
  const missing = contract.describePerformance(definition, record);
  assert.match(missing.summary, /Gewicht fehlt/); assert.ok(missing.warnings.some(w => w.code === 'missing_load'));
  for (const load of ['', undefined, -1, 2000.1, 1.25, Infinity, NaN]) {
    record.sets[0].load = load;
    assert.equal(contract.validatePerformance(definition, record).valid, false, String(load));
  }
  record.sets[0] = { value: 9999, load: 2000 };
  assert.equal(contract.validatePerformance(definition, record).valid, true);
  record.sets[0].value = 10000;
  assert.equal(contract.validatePerformance(definition, record).valid, false);
  const timed = performance('plank');
  timed.sets[0].value = 5999;
  assert.match(contract.describePerformance(ex('plank'), timed).summary, /99:59 min/);
  for (const value of [6000, 0, -1, 1.2, '45', null]) {
    timed.sets[0].value = value;
    assert.equal(contract.validatePerformance(ex('plank'), timed).valid, false);
  }
});

test('retains historical tracking and cannot reinterpret it through the current exercise definition', () => {
  const current = ex('couch_stretch'), older = copy(current), record = performance(current.id);
  older.tracking = { ...older.tracking, counting: 'total', laterality: 'bilateral' };
  record.trackingSnapshot = copy(older.tracking);
  record.context.countingConfirmation = 'unconfirmed';
  const before = JSON.stringify(record);
  assert.equal(contract.describePerformance(current, record).valid, false);
  assert.equal(contract.describePerformance(older, record).summary, '0:45 min · Zählweise nicht bestätigt');
  assert.equal(JSON.stringify(record), before);
  assert.equal(contract.comparisonEligibility(older, record, copy(record)).allowed, false);
  const unconfirmed = performance('dumbbell_bench_press');
  unconfirmed.context.loadEntryConfirmation = 'unconfirmed';
  assert.equal(contract.describePerformance(ex('dumbbell_bench_press'), unconfirmed).summary, '10 Wdh · 20 kg · Gewichtskonvention nicht bestätigt');
});

test('blocks comparison across devices, unknown contexts and missing load', () => {
  const definition = ex('leg_press'), first = performance(definition.id), second = copy(first);
  assert.equal(contract.comparisonEligibility(definition, first, second).allowed, true);
  second.context.deviceVariant = 'Gerät B';
  assert.equal(contract.comparisonEligibility(definition, first, second).allowed, false);
  first.context.deviceVariant = second.context.deviceVariant = null;
  assert.equal(contract.comparisonEligibility(definition, first, second).allowed, false);
  first.context.deviceVariant = second.context.deviceVariant = 'Gerät A';
  second.context.loadEntryConfirmation = 'unconfirmed';
  assert.equal(contract.comparisonEligibility(definition, first, second).allowed, false);
  second.context.loadEntryConfirmation = 'confirmed'; second.sets[0].load = null;
  assert.equal(contract.comparisonEligibility(definition, first, second).allowed, false);
});

test('provides no scalar comparison for time/load, mobility, cardio or a different variant', () => {
  for (const id of ['suitcase_carry', 'couch_stretch', 'treadmill_duration']) {
    const record = performance(id);
    assert.equal(contract.comparisonEligibility(ex(id), record, copy(record)).allowed, false);
  }
  const record = performance('wall_handstand_hold'), second = copy(record);
  second.exerciseId = 'free_handstand_hold';
  assert.equal(contract.comparisonEligibility(ex('wall_handstand_hold'), record, second).allowed, false);
});

test('preserves program positions, timeline links, original values and log keys during analysis', () => {
  const source = { id: 'A_0_v2', name: 'Langhantel-Kniebeuge', w: true, unit: 'reps', inc: 2.5, def: 60, prevId: 'A_0', fromWeek: 3, untilWeek: 8 };
  const logs = { '2|A|A_0': { sets: [{ reps: '8', weight: '60' }] } };
  const before = JSON.stringify({ source, logs });
  const result = resolve(source, 'internal');
  assert.equal(result.exerciseId, 'barbell_back_squat');
  assert.equal(result.positionId, 'A_0_v2');
  assert.deepEqual(result.legacy, source);
  assert.equal(JSON.stringify({ source, logs }), before);
  result.legacy.prevId = 'changed';
  assert.equal(source.prevId, 'A_0');
  assert.equal(result.historicalContext.loadEntryConfirmation, 'unconfirmed');
});

test('detects explicit ID/type conflicts and normalizes only compatible name discrepancies', () => {
  const conflict = { exerciseId: 'plank', name: 'Plank', weighted: true, unit: 'reps', startWeight: 20 };
  const result = resolve(conflict, 'external');
  assert.equal(result.status, 'bestaetigung_noetig');
  assert.deepEqual(result.legacy, conflict);
  const renamed = resolve({ exerciseId: 'plank', name: 'Alter Name', unit: 'seconds' }, 'external');
  assert.equal(renamed.status, 'eindeutig'); assert.equal(renamed.warnings.length, 1);
  assert.equal(renamed.legacy.name, 'Alter Name');
});

test('does not fall back from unknown IDs or accept distance, invalid flags and conflicting timers', () => {
  for (const source of [
    { exerciseId: 'unknown', name: 'Plank', unit: 'seconds' }, { name: 'Unbekannt' },
    { name: 'Laufband', unit: 'distance', distance: 1000 }, { name: 'Plank', weighted: 'false' },
    { name: 'Plank', unit: 'reps', timerMode: 'max' }, { name: 'Klimmzüge', bodyweight: true },
    { name: 'Plank', unit: 'seconds', leftSets: [] }
  ]) assert.equal(resolve(source, 'external').status, 'nicht_darstellbar');
  assert.equal(resolve(null, 'external').status, 'nicht_darstellbar');
});

test('requires review for alias collisions without guessing from the desired tracking type', () => {
  const changed = copy(catalog), variant = copy(ex('plank'));
  variant.id = 'custom_plank_variant'; variant.origin = 'custom'; variant.tracking.metric = 'reps'; variant.progression.primary = 'reps';
  changed.exercises.push(variant);
  const validation = contract.validateCatalog(changed);
  assert.equal(validation.valid, true); assert.ok(validation.warnings.some(w => w.code === 'ambiguous_name'));
  const result = createLegacyResolver(changed)({ name: 'Unterarmstütz', unit: 'seconds' }, 'external');
  assert.equal(result.status, 'bestaetigung_noetig'); assert.equal(result.candidates.length, 2);
  assert.equal(resolve({ name: 'LANGHANTEL-KNIEBEUGE', weighted: true }, 'external').exerciseId, 'barbell_back_squat');
});

test('requires review for assistance and unconfirmed Couch Stretch sides in the real legacy library', () => {
  for (const name of ['Klimmzug-Maschine', 'Couch Stretch']) {
    const source = library.find(item => item.de === name), before = JSON.stringify(source);
    const result = resolve(source, 'library');
    assert.equal(result.status, 'bestaetigung_noetig');
    assert.equal(JSON.stringify(source), before);
  }
  const carry = resolve(library.find(item => item.de === 'Suitcase Carry'), 'library');
  assert.equal(carry.status, 'eindeutig');
  assert.equal(carry.legacyTracking.metric, 'seconds');
  assert.equal(carry.historicalContext.loadEntryConfirmation, 'unconfirmed');
});

test('retains explicit time, treats ambiguous omissions as review and accepts time as an alias', () => {
  const source = { name: 'Suitcase Carry', weighted: true, perSide: true };
  assert.equal(resolve(source, 'external').status, 'bestaetigung_noetig');
  for (const unit of ['seconds', 'time']) {
    const result = resolve({ ...source, unit }, 'external');
    assert.equal(result.status, 'eindeutig'); assert.equal(result.legacy.unit, unit);
  }
});

test('analyses all delivered library entries and program positions without rewriting sources', () => {
  const inputs = ['uebungen.json', ...fs.readdirSync(path.join(root, 'programme')).filter(file => file.endsWith('.json')).map(file => 'programme/' + file)];
  const before = inputs.map(file => fs.readFileSync(path.join(root, file), 'utf8'));
  const result = analyse();
  assert.equal(result.libraryRows.length, 200);
  assert.equal(result.libraryRows.filter(row => row.mapping.status === 'eindeutig').length, 10);
  assert.equal(result.libraryRows.filter(row => row.mapping.status === 'bestaetigung_noetig').length, 2);
  assert.equal(result.libraryRows.filter(row => row.mapping.status === 'nicht_darstellbar').length, 188);
  assert.ok(result.programRows.length > 0);
  assert.deepEqual(inputs.map(file => fs.readFileSync(path.join(root, file), 'utf8')), before);
  assert.equal(result.markdown, fs.readFileSync(path.join(folder, 'ZUORDNUNGSBERICHT.md'), 'utf8'));
});

test('keeps prototype definitions and code outside runtime, service worker and public file list', () => {
  for (const file of ['index.html', 'sw.js', 'scripts/prepare-netlify.mjs']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.equal(source.includes('docs/prototyp/'), false);
    assert.equal(source.includes('referenzuebungen.json'), false);
    assert.equal(source.includes('referenzfaelle.json'), false);
  }
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(packageJson.scripts.build, 'node scripts/prepare-netlify.mjs');
});
