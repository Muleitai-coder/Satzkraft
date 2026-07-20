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
    isTime: () => false,
    timeInputSeconds: input => input.value,
    setTimeInputValue: (input, _ex, value) => { input.value = String(value); },
    active: () => true,
    getSets: () => [{ reps: '', weight: '' }],
    firstOpenSet: () => 0,
    setInputLocked: () => false,
    round: value => value,
    targetWeight: () => 80,
    writeSets: (_ex, sets) => { written = sets; },
    save() {},
    setComplete: (_ex, set) => set.reps !== '' && set.weight !== '',
    scheduleAutoRest() {},
    updateCard() {},
    applyLocks() {},
    updateProgressUI() {},
    collapseDoneExcept() {},
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
    isTime: () => false,
    timeInputSeconds: input => input.value,
    setTimeInputValue: (input, _ex, value) => { input.value = String(value); },
    active: () => true,
    getSets: () => [{ reps: '', weight: '' }, { reps: '', weight: '' }],
    firstOpenSet: () => 0,
    setInputLocked: () => false,
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
    collapseDoneExcept() {},
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

test('prefers the previous set weight and keeps empty zero targets empty', () => {
  const start = html.indexOf('function onSetInput');
  const end = html.indexOf('function onSetChange', start);
  let written;
  const weightInput = { value: '' };
  const exercise = { id: 'squat', w: true };
  const sets = [{ reps: '12', weight: '80' }, { reps: '', weight: '' }];
  let plannedTarget = 95;
  const context = {
    restPhase: null,
    restExId: null,
    restNextSet: -1,
    document: { getElementById: id => id === 'wt-squat-1' ? weightInput : null },
    findEx: () => exercise,
    sanDec: value => value,
    sanInt: value => value,
    isTime: () => false,
    timeInputSeconds: input => input.value,
    setTimeInputValue: (input, _ex, value) => { input.value = String(value); },
    active: () => true,
    getSets: () => sets.map(set => ({ ...set })),
    firstOpenSet: () => 0,
    setInputLocked: () => false,
    round: value => value,
    targetWeight: () => plannedTarget,
    writeSets: (_ex, next) => { written = next; },
    save() {},
    setComplete: (_ex, set) => set.reps !== '' && set.weight !== '',
    scheduleAutoRest() {},
    updateCard() {},
    applyLocks() {},
    updateProgressUI() {},
    collapseDoneExcept() {},
    maybeAskDone() {}
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);
  context.onSetInput({ id: 'rep-squat-1', value: '12' });
  assert.equal(written[1].weight, '80');
  assert.equal(weightInput.value, '80');

  sets[0] = { reps: '', weight: '' };
  plannedTarget = 0;
  weightInput.value = '';
  context.onSetInput({ id: 'rep-squat-1', value: '12' });
  assert.equal(written[1].weight, '');
  assert.equal(weightInput.value, '');
});

test('locks focused inputs and steppers of other exercises throughout every set phase', () => {
  const start = html.indexOf('function setInputLocked');
  const end = html.indexOf('function applyAllLocks', start);
  assert.ok(start >= 0 && end > start, 'zentrale Eingabesperre wurde nicht gefunden');

  const exercise = { id: 'row', name: 'Rudern', w: true };
  const rep = { id: 'rep-row-0', disabled: false };
  const weight = { id: 'wt-row-0', disabled: false };
  const controls = new Map([
    [rep.id, rep],
    [weight.id, weight]
  ]);
  const steppers = [
    { dataset: { step: 'rep' }, disabled: false },
    { dataset: { step: 'wt' }, disabled: false }
  ];
  const context = {
    restPhase: null,
    restExId: 'plank',
    restNextSet: 0,
    active: () => true,
    getSets: () => [{ reps: '', weight: '' }],
    firstOpenSet: () => 0,
    updatePauseButton() {},
    document: {
      activeElement: rep,
      getElementById: id => controls.get(id) || null,
      querySelectorAll: selector => selector.includes('data-ex="row"') ? steppers : []
    }
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);

  for (const phase of ['countdown', 'set', 'hold']) {
    for (const focused of [rep, weight]) {
      rep.disabled = false;
      weight.disabled = false;
      steppers.forEach(button => { button.disabled = false; });
      context.restPhase = phase;
      context.document.activeElement = focused;

      context.applyLocks(exercise);

      assert.equal(rep.disabled, true, `${phase}: fokussierte fremde Wiederholungen müssen gesperrt sein`);
      assert.equal(weight.disabled, true, `${phase}: fokussiertes fremdes Satzgewicht muss gesperrt sein`);
      assert.deepEqual(steppers.map(button => button.disabled), [true, true], `${phase}: fremde Stepper müssen gesperrt sein`);
    }
  }
});

test('onSetInput rejects stale writes from other exercises during countdown, set and hold', () => {
  const lockStart = html.indexOf('function setInputLocked');
  const lockEnd = html.indexOf('function applyLocks', lockStart);
  const inputStart = html.indexOf('function onSetInput');
  const inputEnd = html.indexOf('function onSetChange', inputStart);
  assert.ok(lockStart >= 0 && lockEnd > lockStart, 'zentrale Eingabesperre wurde nicht gefunden');
  assert.ok(inputStart >= 0 && inputEnd > inputStart, 'Satzeingabe wurde nicht gefunden');

  const exercise = { id: 'row', name: 'Rudern', w: false, unit: 'reps' };
  const storedSets = [{ reps: '', weight: '' }];
  let writes = 0;
  let saves = 0;
  let reappliedLocks = 0;
  const context = {
    restPhase: null,
    restExId: 'plank',
    restNextSet: 0,
    active: () => true,
    findEx: id => id === exercise.id ? exercise : null,
    getSets: () => storedSets.map(set => ({ ...set })),
    firstOpenSet: () => 0,
    sanDec: value => value,
    timeInputSeconds: input => input.value,
    isTime: () => false,
    setTimeInputValue: (input, _exercise, value) => { input.value = String(value); },
    applyLocks: () => { reappliedLocks++; },
    writeSets: () => { writes++; },
    save: () => { saves++; },
    collapseDoneExcept() {},
    setComplete: (_exercise, set) => set.reps !== '',
    round: value => value,
    targetWeight: () => 0,
    scheduleAutoRest() {},
    updateCard() {},
    updateProgressUI() {},
    renderBar() {},
    maybeAskDone() {},
    document: { getElementById: () => null }
  };
  vm.createContext(context);
  vm.runInContext(html.slice(lockStart, lockEnd), context);
  vm.runInContext(html.slice(inputStart, inputEnd), context);

  for (const phase of ['countdown', 'set', 'hold']) {
    const input = { id: 'rep-row-0', value: '8' };
    context.restPhase = phase;
    context.onSetInput(input);

    assert.equal(input.value, '', `${phase}: der sichtbare Fremdwert muss verworfen werden`);
    assert.equal(writes, 0, `${phase}: fremde Übung darf nicht in den Store schreiben`);
    assert.equal(saves, 0, `${phase}: fremde Übung darf keinen Save auslösen`);
  }

  context.restExId = exercise.id;
  context.restPhase = 'hold';
  const runningHoldInput = { id: 'rep-row-0', value: '8' };
  context.onSetInput(runningHoldInput);
  assert.equal(runningHoldInput.value, '', 'der laufende Halte-Timer muss seine eigene Satzeingabe kontrollieren');
  assert.equal(writes, 0);
  assert.equal(saves, 0);
  assert.equal(reappliedLocks, 4, 'nach jedem abgewiesenen Event muss die DOM-Sperre erneuert werden');

  context.restPhase = 'set';
  const activeSetInput = { id: 'rep-row-0', value: '8' };
  context.onSetInput(activeSetInput);
  assert.equal(writes, 1, 'der freigegebene Satz der aktiven Übung muss beschreibbar bleiben');
  assert.equal(saves, 1);
});

test('formats long time prescriptions in minutes without changing stored seconds', () => {
  const start = html.indexOf('function fmtTime');
  const end = html.indexOf('function dDate', start);
  const context = {};
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);
  assert.equal(context.fmtSeconds(90), '1:30 min');
  assert.equal(context.fmtSeconds(150), '2:30 min');
  assert.equal(context.fmtSeconds(900), '15:00 min');
  assert.equal(context.fmtSecondsRange(30, 75), '0:30–1:15 min');
  assert.equal(context.fmtSecondsRange(780, 900), '13:00–15:00 min');
  assert.equal(context.fmtMinuteInput(1200), '20,0');
  assert.match(html, /data-time-scale="60"/);
  assert.match(html, /minuteStep\?\.5:1/);
});

test('guards the delayed automatic rest and keeps the page scrollable', () => {
  assert.match(html, /var AUTO_REST_DELAY=2000/);
  assert.match(html, /scheduleAutoRest\(ex,i,wasComplete,nowComplete\)/);
  assert.match(html, /canStartRest\(ex,current,firstOpen,true\)/);
  assert.match(html, /startRest\(catRest\(ex\),ex\.id,true\)/);
  assert.match(html, /restAfterExercise=next>=sets\.length/);
  assert.doesNotMatch(html.slice(html.indexOf('function exCardHtml'), html.indexOf('function renderView')), /class="pausebtn"/);
  assert.doesNotMatch(html, /body\.rest-lock\{position:fixed/);
  assert.match(html, /body\.rest-lock \.ex:not\(\.rest-focus\)\{opacity:\.55/);
});

test('hides the informational page footer during an active workout', () => {
  const renderView = html.slice(
    html.indexOf('function renderView'),
    html.indexOf('function updateProgressUI')
  );
  assert.match(renderView, /if\(!active\(\)\)h\+='<div class="legend"/);
});

test('keeps training cards focused on the set rows and prescription', () => {
  const cardSource = html.slice(
    html.indexOf('function exCardHtml'),
    html.indexOf('function renderView')
  );
  assert.doesNotMatch(cardSource, /catLabel\(ex\)|catColor\(ex\)/);
  assert.doesNotMatch(cardSource, /sets\.length[^;\n]*Sätze/);
  assert.doesNotMatch(cardSource, /presctarget">Ziel/);
  assert.match(cardSource, /class="presctarget"[^;\n]*progressHint/);
  assert.match(cardSource, /class="plateaction" data-plates=/);
});

test('keeps the calibration entry compact and removes it from program previews', () => {
  assert.doesNotMatch(html, /Arbeitsgewicht noch offen|Trag beim ersten Satz dein verwendetes Gewicht ein/);
  assert.match(html, /Startgewicht bestimmen/);
  assert.match(html, /class="editnote calibrationhint"[^;]*><button type="button" class="calibrationmore"/);
  assert.doesNotMatch(html, /class="wwrow"/);
  assert.doesNotMatch(html.slice(html.indexOf('function renderImportPreview'), html.indexOf('function returnFromImportFlow')), /missingWeights|Übungen ohne Startgewicht|Startgewichte finden/);
  assert.match(html, /var wPH=tw>0\?\(""\+tw\):""/);
  assert.match(html, /if\(input&&input\.value===""\)input\.placeholder=tw>0\?tw:""/);
});

test('runs timed holds in the shared bar and records them before the set rest', () => {
  assert.match(html, /function startHold\(exid\)/);
  assert.match(html, /restPhase="hold"/);
  assert.match(html, /class="timefield"/);
  assert.match(html, /Timer starten/);
  assert.doesNotMatch(html, /class="holdbtn"/);
  assert.match(html, /Stopp &amp; eintragen/);
  assert.match(html, /Ziel erreicht · Ende bei/);
  assert.match(html, /Maximalzeit · Bestwert/);
  assert.match(html.slice(html.indexOf('function finishHold'), html.indexOf('function adjustRest')), /startRest\(pause,exid,true\)/);
  assert.match(html, /holdMaxAlerted=true;beep\(\)/);
  assert.match(html, /holdTimerMode==="target"/);
  assert.match(html, /finishHold\(holdMax\)/);
  assert.match(html, /timerMode:\["target","max"\]/);
});

test('compacts completed exercise cards only during an active workout', () => {
  assert.match(html, /DONE_COLLAPSE_DELAY=12000/);
  assert.match(html, /scheduleDoneCollapse\(ex\)/);
  assert.match(html, /collapseDoneExcept\(exid\)/);
  assert.match(html, /active\(\)&&done&&!expandedDoneExercises\[ex\.id\]/);
  assert.match(html, /class="ex done excompact"/);
  assert.match(html, /data-expand-done=/);
  assert.match(html, /expandedDoneExercises\[expanded\.id\]=true/);
  assert.match(html, /data-collapse-done=/);
  assert.match(html, /delete expandedDoneExercises\[collapsed\.id\]/);
  assert.match(html, /function replaceCardKeepingViewport\(card,html\)/);
  assert.match(html, /window\.scrollBy\(0,delta\)/);
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

test('enforces the current-week, previous-week and latest-repeat start matrix', () => {
  const start = html.indexOf('function unitHasSetValues');
  const end = html.indexOf('var REC_COLOR', start);
  const context = {
    S: { history: [], logs: {}, workout: null, week: 3, day: 'A' },
    PROG: () => ({ weeks: [{}, {}, {}, {}], days: [{ key: 'A', ex: [] }] }),
    renderView() {},
    renderBar() {},
    showModal() {}
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);
  context.currentTrainingWeek = () => 3;
  context.unitComplete = () => false;
  context.dayWasInterrupted = () => false;
  context.unitEmpty = () => true;
  context.isLatestCompletedUnit = () => false;

  assert.deepEqual({ ...context.workoutAccess(3, 'A') }, { allowed: true, mode: 'start' });
  assert.deepEqual({ ...context.workoutAccess(2, 'A') }, { allowed: true, mode: 'start' });
  assert.deepEqual({ ...context.workoutAccess(1, 'A') }, { allowed: false, mode: 'locked' });

  context.unitEmpty = () => false;
  context.dayWasInterrupted = () => true;
  assert.deepEqual({ ...context.workoutAccess(2, 'A') }, { allowed: true, mode: 'continue' });

  context.unitComplete = () => true;
  assert.deepEqual({ ...context.workoutAccess(2, 'A') }, { allowed: false, mode: 'complete' });
  context.isLatestCompletedUnit = () => true;
  assert.deepEqual({ ...context.workoutAccess(2, 'A') }, { allowed: true, mode: 'repeat' });
});

test('correction mode is transient and exposes empty set rows without touching history or time', () => {
  const start = html.indexOf('function unitHasSetValues');
  const end = html.indexOf('var REC_COLOR', start);
  const history = [{ week: 1, day: 'A', complete: true, dur: 600 }];
  const context = {
    S: { history, logs: {}, workout: null, week: 1, day: 'A' },
    PROG: () => ({ weeks: [{}], days: [{ key: 'A', ex: [] }] }),
    renderView() {},
    renderBar() {},
    showModal(title, message, actions) {
      assert.equal(title, 'Werte korrigieren');
      assert.equal(
        message,
        'Du änderst nur die Satzwerte dieser abgeschlossenen Einheit. Trainingszeit und Protokolleintrag bleiben unverändert. Empfehlungen und Zielwerte späterer Wochen werden nach deiner Korrektur neu berechnet.'
      );
      assert.equal(actions[0].label, 'Werte korrigieren');
      actions[0].action();
    }
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);
  context.unitComplete = () => true;
  context.startCorrection();
  assert.equal(context.correctionActive(), true);
  assert.deepEqual(context.S.history, history);
  assert.equal(context.S.workout, null);
  context.finishCorrection();
  assert.equal(context.correctionActive(), false);
  assert.match(html, /else if\(correctionActive\(\)\)\{rdis="";\}/);
  assert.match(html, /if\(correctionActive\(\)\)\{[\s\S]*writeSets\(ex,corrected\)/);
});
