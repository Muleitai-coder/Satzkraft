const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const root = new URL('../', `file://${__filename}`);
const library = JSON.parse(fs.readFileSync(new URL('uebungen.json', root), 'utf8'));
const html = fs.readFileSync(new URL('index.html', root), 'utf8');

function normalize(value) {
  return String(value).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '').trim();
}

function functionSource(name) {
  const marker = `function ${name}(`;
  const start = html.indexOf(marker);
  assert.ok(start >= 0, `${name} wurde nicht gefunden`);
  const bodyStart = html.indexOf('{', start + marker.length);
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = bodyStart; index < html.length; index++) {
    const char = html[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return html.slice(start, index + 1);
  }
  assert.fail(`${name} konnte nicht vollständig gelesen werden`);
}

function libraryContext() {
  const context = {
    EXERCISE_LIBRARY: null,
    EXERCISE_ALIAS_INDEX: null,
    Object,
    Array,
    String,
    Number
  };
  vm.createContext(context);
  for (const name of [
    'normalizeExerciseLibraryName',
    'exerciseLibraryEntryNames',
    'setExerciseLibrary',
    'findExerciseLibraryEntry',
    'canonicalExerciseName',
    'exerciseLibraryNamesMatch',
    'exerciseLibraryMatches',
    'exerciseLibraryTypeSignature',
    'editorExerciseType',
    'editorLibraryTypeSignature',
    'editorApplyExerciseLibraryType',
    'editorApplyExerciseLibraryEntry'
  ]) vm.runInContext(functionSource(name), context);
  context.setExerciseLibrary(JSON.parse(JSON.stringify(library)));
  return context;
}

test('loads the approved 200-entry exercise library with every required field', () => {
  assert.equal(library.length, 200);
  const requiredStrings = ['de', 'en', 'equipment', 'muster', 'technik', 'video', 'ersatz', 'bereich'];
  const types = new Set(['gewicht', 'koerpergewicht', 'kgz', 'zeit']);
  for (const [index, entry] of library.entries()) {
    for (const field of requiredStrings) assert.equal(typeof entry[field], 'string', `Eintrag ${index + 1}: ${field}`);
    assert.ok(requiredStrings.every(field => entry[field].trim()), `Eintrag ${index + 1}: leeres Pflichtfeld`);
    assert.ok(Array.isArray(entry.alias), `Eintrag ${index + 1}: alias`);
    assert.ok(types.has(entry.typ), `Eintrag ${index + 1}: typ`);
    if ('weightedTime' in entry) assert.equal(entry.weightedTime, true, `Eintrag ${index + 1}: weightedTime`);
  }
  assert.deepEqual(
    Object.fromEntries([...new Set(library.map(entry => entry.bereich))].map(area => [
      area,
      library.filter(entry => entry.bereich === area).length
    ])),
    { gym: 90, calisthenics: 40, kettlebell: 25, functional: 15, core: 15, mobility: 10, cardio: 5 }
  );
});

test('keeps every replacement resolvable and every normalized name collision-free', () => {
  const primary = new Set(library.map(entry => entry.de));
  const aliases = new Map();
  library.forEach((entry, entryIndex) => {
    assert.ok(primary.has(entry.ersatz), `${entry.de}: Ersatz ${entry.ersatz} fehlt`);
    for (const name of [entry.de, entry.en, ...entry.alias]) {
      const key = normalize(name);
      const previous = aliases.get(key);
      assert.ok(previous == null || previous === entryIndex, `${name} kollidiert zwischen ${previous == null ? 'niemandem' : library[previous].de} und ${entry.de}`);
      aliases.set(key, entryIndex);
    }
  });
});

test('recognizes all 49 unique exercise names used by the official programs', () => {
  const aliases = new Set();
  library.forEach(entry => [entry.de, entry.en, ...entry.alias].forEach(name => aliases.add(normalize(name))));
  const names = new Set();
  for (const file of fs.readdirSync(new URL('programme/', root)).filter(name => name.endsWith('.json'))) {
    const program = JSON.parse(fs.readFileSync(new URL(`programme/${file}`, root), 'utf8'));
    program.days.forEach(day => day.exercises.forEach(exercise => names.add(exercise.name)));
  }
  assert.equal(names.size, 49);
  for (const name of names) assert.ok(aliases.has(normalize(name)), `Programmübung nicht erkannt: ${name}`);
});

test('normalizes aliases, keeps unknown names exact and searches DE/EN names', () => {
  const context = libraryContext();
  assert.equal(context.canonicalExerciseName('Bench Press'), 'Bankdrücken');
  assert.equal(context.canonicalExerciseName('SCHRAEGBANKDRUECKEN MIT LANGHANTEL'), 'Schrägbankdrücken Langhantel');
  assert.equal(context.exerciseLibraryNamesMatch('Pull-Up', 'Klimmzüge'), true);
  assert.equal(context.exerciseLibraryNamesMatch('Eigene Übung', 'eigene übung'), false);
  assert.equal(context.exerciseLibraryMatches('dumbbell bench', 6)[0].de, 'Kurzhantel-Bankdrücken');
});

test('fills editor metadata and maps all four exercise types including added weight', () => {
  const context = libraryContext();
  const pullUp = {};
  context.editorApplyExerciseLibraryEntry(pullUp, context.findExerciseLibraryEntry('Pull-Up'));
  assert.equal(pullUp.name, 'Klimmzüge');
  assert.equal(pullUp.en, 'Pull-Up');
  assert.equal(pullUp.weighted, true);
  assert.equal(pullUp.bodyweight, true);
  assert.equal(pullUp.startWeight, 0);
  assert.equal(pullUp.cue, context.findExerciseLibraryEntry('Pull-Up').technik);
  assert.equal(pullUp.video, context.findExerciseLibraryEntry('Pull-Up').video);
  assert.equal(pullUp.proxy, context.findExerciseLibraryEntry('Pull-Up').ersatz);

  const timed = { weighted: true, bodyweight: true, startWeight: 10, increment: 2.5 };
  context.editorApplyExerciseLibraryEntry(timed, context.findExerciseLibraryEntry('Plank'));
  assert.equal(timed.unit, 'seconds');
  assert.equal(timed.weighted, undefined);
  assert.equal(timed.bodyweight, undefined);
  assert.equal(timed.startWeight, undefined);

  const carry = {};
  context.editorApplyExerciseLibraryEntry(carry, context.findExerciseLibraryEntry('Suitcase Carry'));
  assert.equal(carry.unit, 'seconds');
  assert.equal(carry.weighted, true);
  assert.equal(carry.startWeight, 0);
  assert.equal(carry.increment, 2.5);
  assert.equal(carry.perSide, true);
});

test('marks exactly the approved carry and sled entries as weighted time exercises', () => {
  assert.deepEqual(
    library.filter(entry => entry.weightedTime === true).map(entry => entry.de),
    ['Suitcase Carry', 'Racked Carry', 'Overhead Carry', "Farmer's Walk", 'Sled Push', 'Sled Pull']
  );
});

test('wires lazy loading, autocomplete and the cached JSON asset', () => {
  assert.match(html, /fetch\("uebungen\.json"\)/);
  assert.match(html, /loadExerciseLibraryForEditor\(\)/);
  assert.match(html, /data-exercise-suggestion=/);
  assert.match(html, /Vorhandene Angaben ersetzen\?/);
  const sw = fs.readFileSync(new URL('sw.js', root), 'utf8');
  assert.match(sw, /\.\/uebungen\.json/);
});

test('allows a later retry when the exercise library is temporarily unavailable', async () => {
  let calls = 0;
  const expected = [{ de: 'Testübung' }];
  const context = {
    EXERCISE_LIBRARY: null,
    EXERCISE_LIBRARY_PROMISE: null,
    fetch: async () => {
      calls++;
      if (calls === 1) throw new Error('offline');
      return { ok: true, json: async () => expected };
    },
    setExerciseLibrary: list => {
      context.EXERCISE_LIBRARY = list;
      return list;
    },
    Promise,
    Error
  };
  vm.createContext(context);
  vm.runInContext(functionSource('loadExerciseLibrary'), context);

  assert.equal((await context.loadExerciseLibrary()).length, 0);
  assert.equal(context.EXERCISE_LIBRARY, null);
  assert.equal(context.EXERCISE_LIBRARY_PROMISE, null);
  assert.equal(JSON.stringify(await context.loadExerciseLibrary()), JSON.stringify(expected));
  assert.equal(calls, 2);
});
