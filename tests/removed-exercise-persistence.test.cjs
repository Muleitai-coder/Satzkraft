const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');

function sourceBetween(startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `${startMarker} bis ${endMarker} wurde nicht gefunden`);
  return html.slice(start, end);
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

function program(id) {
  return {
    id,
    name: id,
    weeks: [{}],
    days: [{
      key: 'push-pull',
      ex: [{ id: 'push-pull_0', name: 'Rudern' }]
    }]
  };
}

function store(removedEx) {
  return {
    tg: {},
    barw: {},
    notes: {},
    logs: {},
    history: [],
    workout: null,
    pendingReplacements: [],
    removedEx,
    week: 1,
    day: 'push-pull',
    blockCelebrated: false
  };
}

function stateContext() {
  const context = {
    DEFAULT_PROGRAM: program('default'),
    DATA_SCHEMA_VERSION: 4,
    CAT_COLORS: [],
    LIMITS: { maxExPerDay: 12 },
    localStorage: { getItem: () => null },
    clone: value => JSON.parse(JSON.stringify(value)),
    programWriteLocked: () => false,
    showProgramWriteLocked() {},
    refreshPostWorkoutReplacements() {},
    save() {},
    renderView() {},
    renderBar() {}
  };
  vm.createContext(context);
  vm.runInContext(sourceBetween('function newStore', 'function persist'), context);
  vm.runInContext(functionSource('setActive'), context);
  vm.runInContext(functionSource('exerciseRemovedFrom'), context);
  vm.runInContext(functionSource('exerciseRemovedToday'), context);
  context.PROG = () => context.S.programs[context.S.active];
  context.dayKeys = () => context.PROG().days.map(day => day.key);
  return context;
}

test('persists removed exercises through store sync and a serialized reload', () => {
  const context = stateContext();
  const programs = { first: program('first') };
  context.S = {
    schemaVersion: 4,
    programs,
    active: 'first',
    store: {
      first: store({ 'w1_push-pull': ['push-pull_0'] })
    }
  };
  context.alias(context.S);
  context.syncStore();

  const reloaded = JSON.parse(JSON.stringify(context.S));
  context.alias(reloaded);

  assert.deepEqual(
    JSON.parse(JSON.stringify(reloaded.removedEx)),
    { 'w1_push-pull': ['push-pull_0'] }
  );
});

test('keeps removed exercises isolated to their owning program', () => {
  const context = stateContext();
  const sharedExercise = { id: 'push-pull_0' };
  context.S = {
    schemaVersion: 4,
    programs: { first: program('first'), second: program('second') },
    active: 'first',
    store: {
      first: store({ 'w1_push-pull': ['push-pull_0'] }),
      second: store({})
    }
  };
  context.alias(context.S);
  assert.equal(context.exerciseRemovedToday(sharedExercise, 1, 'push-pull'), true);

  assert.equal(context.setActive('second'), true);
  assert.equal(
    context.exerciseRemovedToday(sharedExercise, 1, 'push-pull'),
    false,
    'eine Entfernung in Programm 1 darf Programm 2 nicht verändern'
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(context.S.store.first.removedEx)),
    { 'w1_push-pull': ['push-pull_0'] }
  );
});

test('initializes new program stores with an empty removal map', () => {
  const context = stateContext();
  const fresh = context.newStore(program('new'));
  assert.ok(
    fresh.removedEx && typeof fresh.removedEx === 'object' && !Array.isArray(fresh.removedEx),
    'ein neuer Programm-Store braucht eine eigene leere Entfernungskarte'
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(fresh.removedEx)),
    {}
  );
});
