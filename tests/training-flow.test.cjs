const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');

test('keeps workout controls reachable and explains partial stops', () => {
  assert.match(html, /class="workoutbar/);
  assert.match(html, /id="barpausew"/);
  assert.match(html, /id="barresumew"/);
  assert.match(html, /id="barstopw"/);
  assert.match(html, /Alle bisherigen Eingaben bleiben erhalten/);
  assert.match(html, /Speichern & später fortsetzen/);
  assert.match(html, /Math\.max\(1,Math\.round/);
  assert.match(html, /aria-label="Satzpause beenden"/);
});

test('counts completed sets and exercises for the stop summary', () => {
  const start = html.indexOf('function workoutProgress');
  const end = html.indexOf('function stopWorkout', start);
  assert.ok(start >= 0 && end > start, 'Fortschrittsfunktion wurde nicht gefunden');
  const exercises = [{ id: 'body', w: false }, { id: 'squat', w: true }];
  const context = {
    S: { logs: {
      '1|A|body': { sets: [{ reps: '10', weight: '' }, { reps: '', weight: '' }] },
      '1|A|squat': { sets: [{ reps: '7', weight: '80' }] }
    } },
    dayByKey: () => ({ ex: exercises }),
    setsForExercise: ex => ex.id === 'body' ? 2 : 1,
    setComplete: (ex, set) => ex.w ? set.reps !== '' && set.weight !== '' : set.reps !== ''
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);
  assert.deepEqual({ ...context.workoutProgress(1, 'A') }, {
    completedSets: 2,
    totalSets: 3,
    completedExercises: 1,
    totalExercises: 2,
    complete: false
  });
});

test('copies the planned weight when repetitions are entered', () => {
  const start = html.indexOf('function onSetInput');
  const end = html.indexOf('function onSetChange', start);
  assert.ok(start >= 0 && end > start, 'Satzeingabe wurde nicht gefunden');
  let written;
  const weightInput = { value: '' };
  const context = {
    restPhase: null,
    restExId: null,
    restNextSet: -1,
    document: { getElementById: id => id === 'wt-squat-0' ? weightInput : null },
    findEx: () => ({ id: 'squat', w: true }),
    sanDec: value => value,
    sanInt: value => value,
    active: () => true,
    getSets: () => [{ reps: '', weight: '' }],
    round: value => value,
    targetWeight: () => 80,
    writeSets: (_ex, sets) => { written = sets; },
    save() {},
    setComplete: (_ex, set) => set.reps !== '' && set.weight !== '',
    updateCard() {},
    applyLocks() {},
    updateProgressUI() {},
    maybeAskDone() {}
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);
  context.onSetInput({ id: 'rep-squat-0', value: '7' });
  assert.equal(written[0].reps, '7');
  assert.equal(written[0].weight, '80');
  assert.equal(weightInput.value, '80');
});
