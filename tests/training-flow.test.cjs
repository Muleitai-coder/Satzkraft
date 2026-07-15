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
    scheduleAutoRest() {},
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

test('completes repetitions from weight input and queues automatic rest', () => {
  const start = html.indexOf('function onSetInput');
  const end = html.indexOf('function onSetChange', start);
  let written, scheduled;
  const repsInput = { value: '' };
  const exercise = { id: 'squat', w: true };
  const context = {
    restPhase: null,
    restExId: null,
    restNextSet: -1,
    S: { week: 1 },
    document: { getElementById: id => id === 'rep-squat-0' ? repsInput : null },
    findEx: () => exercise,
    sanDec: value => value,
    sanInt: value => value,
    active: () => true,
    getSets: () => [{ reps: '', weight: '' }, { reps: '', weight: '' }],
    round: value => value,
    targetWeight: () => 0,
    catReps: () => [8, 12],
    PROG: () => ({ weeks: [{ phase: 'aufbau' }] }),
    writeSets: (_ex, sets) => { written = sets; },
    save() {},
    setComplete: (_ex, set) => set.reps !== '' && set.weight !== '',
    scheduleAutoRest: (...args) => { scheduled = args; },
    updateCard() {},
    applyLocks() {},
    updateProgressUI() {},
    maybeAskDone() {}
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);
  context.onSetInput({ id: 'wt-squat-0', value: '80' });
  assert.equal(written[0].weight, '80');
  assert.equal(written[0].reps, '12');
  assert.equal(repsInput.value, '12');
  assert.equal(scheduled[2], false);
  assert.equal(scheduled[3], true);
});

test('keeps zero targets empty and reuses a previous calibration weight', () => {
  const start = html.indexOf('function onSetInput');
  const end = html.indexOf('function onSetChange', start);
  let written;
  const weightInput = { value: '' };
  const exercise = { id: 'squat', w: true };
  const sets = [{ reps: '12', weight: '80' }, { reps: '', weight: '' }];
  const context = {
    restPhase: null,
    restExId: null,
    restNextSet: -1,
    document: { getElementById: id => id === 'wt-squat-1' ? weightInput : null },
    findEx: () => exercise,
    sanDec: value => value,
    sanInt: value => value,
    active: () => true,
    getSets: () => sets.map(set => ({ ...set })),
    round: value => value,
    targetWeight: () => 0,
    writeSets: (_ex, next) => { written = next; },
    save() {},
    setComplete: (_ex, set) => set.reps !== '' && set.weight !== '',
    scheduleAutoRest() {},
    updateCard() {},
    applyLocks() {},
    updateProgressUI() {},
    maybeAskDone() {}
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);
  context.onSetInput({ id: 'rep-squat-1', value: '12' });
  assert.equal(written[1].weight, '80');
  assert.equal(weightInput.value, '80');

  sets[0] = { reps: '', weight: '' };
  weightInput.value = '';
  context.onSetInput({ id: 'rep-squat-1', value: '12' });
  assert.equal(written[1].weight, '');
  assert.equal(weightInput.value, '');
});

test('formats long time prescriptions in minutes without changing stored seconds', () => {
  const start = html.indexOf('function fmtSeconds');
  const end = html.indexOf('function dDate', start);
  const context = {};
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);
  assert.equal(context.fmtSeconds(90), '90 Sek');
  assert.equal(context.fmtSeconds(150), '2:30 min');
  assert.equal(context.fmtSeconds(900), '15 min');
  assert.equal(context.fmtSecondsRange(30, 60), '30–60 Sek');
  assert.equal(context.fmtSecondsRange(780, 900), '13–15 min');
});

test('guards the delayed automatic rest and keeps the page scrollable', () => {
  assert.match(html, /var AUTO_REST_DELAY=2000/);
  assert.match(html, /scheduleAutoRest\(ex,i,wasComplete,nowComplete\)/);
  assert.match(html, /canStartRest\(ex,current,firstOpen\)/);
  assert.match(html, /startRest\(catRest\(ex\),ex\.id\)/);
  assert.doesNotMatch(html, /body\.rest-lock\{position:fixed/);
  assert.match(html, /body\.rest-lock \.ex:not\(\.rest-focus\)\{opacity:\.55/);
});

test('explains calibration programs in training and import preview', () => {
  assert.match(html, /Noch kein Arbeitsgewicht: Trag beim ersten Satz dein Gewicht ein/);
  assert.match(html, /missingWeights/);
  assert.match(html, /Übungen ohne Startgewicht/);
  assert.match(html, /tw>0\?tw\+" kg":\(ex\.bw\?"Körpergew\.":"—"\)/);
});

test('runs timed holds in the shared bar and records them before the set rest', () => {
  assert.match(html, /function startHold\(exid\)/);
  assert.match(html, /restPhase="hold"/);
  assert.match(html, /Halten starten \(Satz /);
  assert.match(html, /Stopp &amp; eintragen/);
  assert.match(html, /Zielbereich erreicht/);
  assert.match(html, /Bestwert: /);
  assert.match(html, /if\(next<sets\.length\)startRest\(pause,exid\)/);
  assert.match(html, /holdMaxAlerted=true;beep\(\)/);
});

test('compacts completed exercise cards only during an active workout', () => {
  assert.match(html, /active\(\)&&done&&!expandedDoneExercises\[ex\.id\]/);
  assert.match(html, /class="ex done excompact"/);
  assert.match(html, /data-expand-done=/);
  assert.match(html, /expandedDoneExercises\[expanded\.id\]=true/);
  assert.match(html, /data-collapse-done=/);
  assert.match(html, /delete expandedDoneExercises\[collapsed\.id\]/);
});

test('uses one SVG icon system, larger training text and subtle completion feedback', () => {
  assert.match(html, /function icon\(name\)/);
  for (const name of ['play', 'pause', 'stop', 'timer', 'plus', 'check', 'close', 'info', 'chevron-left', 'chevron-right', 'undo', 'edit', 'external', 'download', 'sparkle']) {
    assert.match(html, new RegExp(`["']?${name.replace('-', '\\-')}["']?`));
  }
  assert.match(html, /\.presc\{[^}]*font-size:13px/);
  assert.match(html, /\.last\{[^}]*font-size:12px/);
  assert.match(html, /\.rec\{[^}]*font-size:13px/);
  assert.match(html, /\.exname\{[^}]*font-size:15px/);
  assert.match(html, /\.editnote\{[^}]*font-size:12px/);
  assert.match(html, /@keyframes setpulse/);
  assert.match(html, /@keyframes checkpop/);
  assert.doesNotMatch(html, /workoutPanelHtml/);
});
