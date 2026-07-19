const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');

function functionSource(name) {
  const marker = `function ${name}(`;
  const start = html.indexOf(marker);
  assert.ok(start >= 0, `${name} wurde nicht gefunden`);
  const bodyStart = html.indexOf('{', start + marker.length);
  assert.ok(bodyStart > start, `${name} hat keinen Funktionsrumpf`);
  let depth = 0;
  let quote = '';
  let escaped = false;
  let regex = false;
  let regexClass = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = bodyStart; index < html.length; index++) {
    const char = html[index];
    const next = html[index + 1];
    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        index++;
      }
      continue;
    }
    if (regex) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '[') regexClass = true;
      else if (char === ']') regexClass = false;
      else if (char === '/' && !regexClass) regex = false;
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '/' && next === '/') {
      lineComment = true;
      index++;
      continue;
    }
    if (char === '/' && next === '*') {
      blockComment = true;
      index++;
      continue;
    }
    if (char === '/') {
      const before = html.slice(Math.max(bodyStart, index - 50), index).replace(/\s+$/, '');
      const previous = before[before.length - 1] || '';
      if (!previous || /[({\[=,:;!&|?+*%^~<>-]/.test(previous)
        || /\b(?:return|case|throw|delete|void|typeof|instanceof|in|of|yield)$/.test(before)) {
        regex = true;
        regexClass = false;
        continue;
      }
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return html.slice(start, index + 1);
  }
  assert.fail(`${name} konnte nicht vollständig gelesen werden`);
}

function appContext(overrides) {
  const context = {
    console,
    setTimeout: callback => {
      callback();
      return 1;
    },
    clearTimeout() {},
    localStorage: { getItem: () => null, setItem() {} },
    navigator: {},
    window: { addEventListener() {}, removeEventListener() {} },
    document: { getElementById: () => null }
  };
  vm.createContext(context);
  const names = [...html.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(match => match[1]);
  for (const name of [...new Set(names)]) vm.runInContext(functionSource(name), context);
  Object.assign(context, overrides || {});
  return context;
}

function programFixture() {
  return {
    id: 'basis',
    name: 'Kraftbasis',
    categories: {
      kraft: { label: 'Kraft', reps: { aufbau: [5, 8] } }
    },
    weeks: [
      { n: 1, phase: 'aufbau', sets: { kraft: 1 } },
      { n: 2, phase: 'aufbau', sets: { kraft: 1 } }
    ],
    days: [
      {
        key: 'A', wd: 'Montag', title: 'Drücken',
        ex: [{ id: 'bench', name: 'Bankdrücken', proxy: 'Brustpresse', cat: 'kraft', w: true, unit: 'reps' }]
      },
      {
        key: 'B', wd: 'Donnerstag', title: 'Beine',
        ex: [{ id: 'squat', name: 'Kniebeuge', proxy: 'Beinpresse', cat: 'kraft', w: true, unit: 'reps' }]
      }
    ]
  };
}

function preWorkoutContext(program) {
  const modals = [];
  const context = appContext();
  context.S = {
    active: 'basis', programs: { basis: program }, week: 2, day: 'B',
    logs: {}, workout: null, pendingReplacements: []
  };
  context.pendingExerciseSwapName = '';
  context.PROG = () => program;
  context.dayByKey = key => program.days.find(day => day.key === key);
  context.setsForExercise = () => 1;
  context.save = context.renderView = () => {};
  context.showModal = (title, body, actions) => modals.push({ title, body, actions });
  return { context, modals };
}

test('tauscht und verwirft eine Übung für die ausgewählte Einheit schon vor Trainingsstart', () => {
  const program = programFixture();
  const exercise = program.days[1].ex[0];
  const { context, modals } = preWorkoutContext(program);

  assert.equal(context.active(), false, 'der Test muss den Zustand vor Trainingsstart abbilden');
  context.showExerciseSwap(exercise);
  assert.equal(modals.length, 1, 'der Tauschdialog muss auch ohne Workout geöffnet werden');

  const todayAction = modals[0].actions.find(action => action.label === 'Übung tauschen');
  assert.ok(todayAction, 'die ausgewählte Einheit braucht eine temporäre Tauschaktion');
  todayAction.action();

  assert.equal(context.S.logs['2|B|squat'].swap, 'Beinpresse');
  assert.equal(context.S.logs['1|A|bench'], undefined, 'andere Woche, anderer Tag und andere Übung müssen unberührt bleiben');

  context.showExerciseSwap(exercise);
  const resetAction = modals.at(-1).actions.find(action => action.label === 'Original verwenden');
  assert.ok(resetAction, 'ein vorab gewählter Tausch muss vor der ersten Satzeingabe zurücksetzbar sein');
  resetAction.action();

  assert.equal(context.S.logs['2|B|squat'], undefined, 'ein leerer Vorab-Tausch darf keinen verwaisten Logeintrag hinterlassen');
});

test('sperrt Tausch und Rücksetzen vor Trainingsstart bereits nach einem einzelnen Satzwert', () => {
  const program = programFixture();
  const exercise = program.days[1].ex[0];
  const { context } = preWorkoutContext(program);

  context.S.logs['2|B|squat'] = { sets: [{ reps: '', weight: '80' }] };
  assert.equal(context.swapExerciseForToday(exercise, 'Beinpresse'), false);
  assert.equal(context.S.logs['2|B|squat'].swap, undefined);

  context.S.logs['2|B|squat'] = {
    sets: [{ reps: '8', weight: '' }],
    swap: 'Beinpresse',
    swapWeight: '70'
  };
  assert.equal(context.clearExerciseSwapForToday(exercise), false);
  assert.equal(context.S.logs['2|B|squat'].swap, 'Beinpresse');
  assert.equal(context.S.logs['2|B|squat'].swapWeight, '70');
});

test('bietet vor dem Training keinen dauerhaften Ersatz an', () => {
  const program = programFixture();
  const exercise = program.days[1].ex[0];
  const { context, modals } = preWorkoutContext(program);

  context.showExerciseSwap(exercise);
  assert.deepEqual(Array.from(modals[0].actions, action => action.label), [
    'Übung tauschen', 'Abbrechen'
  ]);
  assert.equal(context.S.workout, null);
  assert.deepEqual(Array.from(context.S.pendingReplacements), []);
  assert.equal(context.S.logs['2|B|squat'], undefined);
});
