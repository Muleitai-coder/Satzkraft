const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');

test('keeps workout controls reachable and explains partial stops', () => {
  assert.match(html, /class="barwrap/);
  assert.match(html, /class="livecard/);
  assert.match(html, /id="pausew"/);
  assert.match(html, /id="resumew"/);
  assert.match(html, /id="stopw"/);
  assert.match(html, /Alle bisherigen Eingaben bleiben erhalten/);
  assert.match(html, /Speichern & später fortsetzen/);
  assert.match(html, /Math\.max\(1,Math\.round/);
  assert.match(html, /aria-label="Satzpause beenden"/);
});

test('requires a two second hold to pause but keeps resume as a normal action', () => {
  assert.match(html, /WORKOUT_PAUSE_HOLD_MS=2000/);
  assert.match(html, /function beginWorkoutPauseHold/);
  assert.match(html, /class="bbtn pause holdpause"/);
  assert.match(html, /Pause – 2 Sekunden gedrückt halten/);
  assert.match(html, /\.holdpause\.holding:before\{animation:pauseholdfill 2s linear forwards\}/);
  assert.match(html, /if\(b\.id==="pausew"\)\{e\.preventDefault\(\);return;\}/);
  assert.match(html, /if\(b\.id==="resumew"\)\{resumeWorkout\(\);return;\}/);
});

test('keeps a running workout active when the app moves into the background', () => {
  const persistence = html.slice(
    html.indexOf('document.addEventListener("visibilitychange",function(){if(localWriteBlocked())'),
    html.indexOf('window.addEventListener("storage"', html.indexOf('document.addEventListener("visibilitychange",function(){if(localWriteBlocked())'))
  );
  assert.match(persistence, /visibilityState==="hidden"\)flushSave\(\)/);
  assert.match(persistence, /pagehide"[\s\S]*flushSave\(\)/);
  assert.doesNotMatch(persistence, /pauseWorkout\(/);
  const handlers = {};
  let saved = 0;
  const context = {
    document: {
      visibilityState: 'hidden',
      addEventListener: (type, callback) => { handlers[type] = callback; }
    },
    window: { addEventListener: (type, callback) => { handlers[type] = callback; } },
    localWriteBlocked: () => false,
    flushSave: () => { saved += 1; },
    pauseWorkout: () => assert.fail('Hintergrundwechsel darf das Training nicht pausieren')
  };
  vm.createContext(context);
  vm.runInContext(persistence, context);
  handlers.visibilitychange();
  handlers.pagehide();
  assert.equal(saved, 2);
});

test('cancels an early pause release and pauses only after the full hold', () => {
  const start = html.indexOf('var WORKOUT_PAUSE_HOLD_MS');
  const end = html.indexOf('function backupJSON', start);
  assert.ok(start >= 0 && end > start, 'Halte-Logik für Pause wurde nicht gefunden');
  let scheduled, scheduledMs, cleared = 0, paused = 0;
  const classes = new Set();
  const attributes = {};
  const button = {
    classList: {
      add: value => classes.add(value),
      remove: value => classes.delete(value)
    },
    setAttribute: (name, value) => { attributes[name] = value; },
    setPointerCapture() {}
  };
  const context = {
    S: { workout: { running: true } },
    navigator: { vibrate() {} },
    setTimeout: (callback, ms) => {
      scheduled = callback;
      scheduledMs = ms;
      return 17;
    },
    clearTimeout: id => { if (id === 17) cleared += 1; },
    pauseWorkout: () => { paused += 1; }
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);

  context.beginWorkoutPauseHold(button, 4);
  assert.equal(scheduledMs, 2000);
  assert.equal(classes.has('holding'), true);
  assert.equal(attributes['aria-pressed'], 'true');
  context.cancelWorkoutPauseHold();
  assert.equal(cleared, 1);
  assert.equal(classes.has('holding'), false);
  assert.equal(paused, 0);

  context.beginWorkoutPauseHold(button, 5);
  scheduled();
  assert.equal(paused, 1);
  assert.equal(classes.has('holding'), false);
  assert.equal(attributes['aria-pressed'], 'false');
});

test('keeps weighted repetitions, time and weight in one consistent row', () => {
  const rowSource = html.slice(
    html.indexOf('function setRowHtml'),
    html.indexOf('function exHistory')
  );
  assert.match(rowSource, /\+\(isTime\(ex\)\?" timed":""\)/);
  assert.match(rowSource, /class="setmetricgrid"/);
  assert.match(rowSource, /isTime\(ex\)\?'<div class="settimevalue">'/);
  assert.match(rowSource, /class="timefield"/);
  assert.match(rowSource, /class="swbtn rowtimer/);
  assert.match(html, /function setGridHeadHtml/);
  assert.doesNotMatch(html, /data-hold-shared="1"/);
  const headerSource = html.slice(
    html.indexOf('function setGridHeadHtml'),
    html.indexOf('function setRowHtml')
  );
  assert.match(headerSource, /<span>Set<\/span>/);
  assert.match(headerSource, /<span>Wdh<\/span>/);
  assert.match(headerSource, /<span>kg<\/span>/);
  assert.doesNotMatch(headerSource, /Gewicht · kg|timedplay|data-hold-row/);
  assert.match(rowSource, /icon\(swRunning\?"stop":"play"\)/);
  assert.match(html, /\.setgridhead,\.srow\.weighted\{display:grid;grid-template-columns:30px repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(html, /\.setheadmetric>span\{grid-column:2;text-align:center/);
  assert.match(html, /\.srow\.weighted>\.slbl,[^\{]+\{width:100%;text-align:center\}/);
  assert.match(html, /\.setmetricgrid\{display:grid;grid-template-columns:44px minmax\(0,1fr\) 44px/);
  assert.match(html, /\.setmetricgrid \.stp\{width:32px\}/);
  assert.doesNotMatch(html, /grid-template-rows:auto auto/);
  assert.match(rowSource, /maxlength="'\+\(isTime\(ex\)\?5:4\)\+'"/);
  assert.match(rowSource, /maxlength="6"/);
  assert.match(html, /übernehmen oder erhöhen/);
  assert.match(html, /if\(isW&&v>SET_WEIGHT_MAX\)v=SET_WEIGHT_MAX/);
  assert.match(html, /timeStep\?SET_TIME_MAX_SECONDS:SET_REP_MAX/);
});

test('disables page zoom without triggering iPhone input focus zoom', () => {
  assert.match(html, /name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"/);
  assert.match(html, /\.inp\{[^}]*font-size:16px/);
  assert.match(html, /\*\{[^}]*touch-action:manipulation/);
});

test('limits set weights to four integer digits, one decimal and 2000 kg', () => {
  const start = html.indexOf('var SET_REP_MAX');
  const end = html.indexOf('function fmtTime', start);
  const context = {};
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);
  assert.equal(context.sanDec('1000'), '1000');
  assert.equal(context.sanDec('62,55'), '62.5');
  assert.equal(context.sanDec('9999'), '2000');
  assert.equal(context.sanDec('2000.5'), '2000');
  assert.equal(context.sanDec('.5'), '0.5');
  assert.equal(context.sanDec('-20'), '0');
});

test('limits entered repetitions and clock values to four digits and valid time', () => {
  const start = html.indexOf('var SET_REP_MAX');
  const sanitizerEnd = html.indexOf('function fmtTime', start);
  const clockStart = html.indexOf('function fmtClockInput');
  const clockEnd = html.indexOf('function catReps', clockStart);
  const context = {
    isTime: exercise => exercise.unit === 'seconds'
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, sanitizerEnd), context);
  vm.runInContext(html.slice(clockStart, clockEnd), context);

  assert.equal(context.sanInt('899999'), '8999');
  assert.equal(context.sanInt('12x3'), '123');
  assert.equal(context.sanInt('-20'), '0');
  assert.equal(context.clockTypedFormat('0099'), '00:59');
  assert.equal(context.clockTypedFormat('9999'), '99:59');
  assert.equal(context.clockEditValue('4'), '4');
  assert.equal(context.clockEditValue('45'), '45');
  assert.equal(context.clockEditValue('00:45'), '00:45');
  assert.equal(context.clockEditValue('12345'), '1234');
  assert.equal(context.clockInputSeconds('1:05'), '65');
  assert.equal(context.clockInputSeconds('1:5'), '65');
  assert.equal(context.clockInputSeconds('9999'), '5999');
  assert.equal(context.clockInputSeconds('-20'), '0');
  assert.equal(context.timeInputSeconds({ value: '12345' }, { unit: 'reps' }), '1234');
  assert.equal(context.timeInputSeconds({ value: '12:99' }, { unit: 'seconds' }), '779');
  assert.equal(context.fmtClockInput(99999), '99:59');
});

test('normalizes legacy fantasy values already stored in workout logs', () => {
  const sanitizerStart = html.indexOf('var SET_REP_MAX');
  const sanitizerEnd = html.indexOf('function fmtTime', sanitizerStart);
  const storedStart = html.indexOf('function normalizeStoredRep');
  const storedEnd = html.indexOf('function initState', storedStart);
  const context = {
    isTime: exercise => exercise.unit === 'seconds'
  };
  vm.createContext(context);
  vm.runInContext(html.slice(sanitizerStart, sanitizerEnd), context);
  vm.runInContext(html.slice(storedStart, storedEnd), context);

  const program = {
    days: [{
      key: 'A',
      ex: [
        { id: 'reps', unit: 'reps' },
        { id: 'time', unit: 'seconds' }
      ]
    }]
  };
  const logs = {
    '1|A|reps': { sets: [{ reps: '899999', weight: '-20' }] },
    '1|A|time': { sets: [{ reps: '99999', weight: '99999' }] }
  };
  context.sanitizeStoredSetValues(program, logs);

  assert.deepEqual(
    JSON.parse(JSON.stringify(logs)),
    {
      '1|A|reps': { sets: [{ reps: '9999', weight: '0' }] },
      '1|A|time': { sets: [{ reps: '5999', weight: '2000' }] }
    }
  );
});

test('keeps the warm-up close button below the mobile safe area', () => {
  assert.match(html, /#wucdclose\{position:absolute;top:max\(16px,calc\(env\(safe-area-inset-top\) \+ 12px\)\)/);
  assert.match(html, /@media\(max-width:480px\)\{#wucdclose\{top:max\(28px,calc\(env\(safe-area-inset-top\) \+ 12px\)\)\}\}/);
  const renderSource = html.slice(
    html.indexOf('function renderWucd'),
    html.indexOf('document.getElementById("wucd").addEventListener', html.indexOf('function renderWucd'))
  );
  assert.doesNotMatch(renderSource, /style="position:absolute;top:16px/);
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
  context.onSetInput({
    id: 'rep-squat-0',
    dataset: { setKind: 'rep', ex: 'squat', i: '0' },
    value: '7'
  });
  assert.equal(written[0].reps, '7');
  assert.equal(written[0].weight, '80');
  assert.equal(weightInput.value, '80');
});

test('completes repetitions from weight input, prefers the previous set and queues automatic rest', () => {
  const start = html.indexOf('function onSetInput');
  const end = html.indexOf('function onSetChange', start);
  let written, scheduled;
  const repsInput = { value: '' };
  const exercise = { id: 'squat', w: true };
  let currentSets = [{ reps: '', weight: '' }, { reps: '', weight: '' }];
  const context = {
    restPhase: null,
    restExId: null,
    restNextSet: -1,
    S: { week: 1 },
    document: { getElementById: id => (id === 'rep-squat-0' || id === 'rep-squat-1') ? repsInput : null },
    findEx: () => exercise,
    sanDec: value => value,
    sanInt: value => value,
    isTime: () => false,
    timeInputSeconds: input => input.value,
    setTimeInputValue: (input, _ex, value) => { input.value = String(value); },
    active: () => true,
    getSets: () => currentSets.map(set => ({ ...set })),
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
  context.onSetInput({
    id: 'wt-squat-0',
    dataset: { setKind: 'wt', ex: 'squat', i: '0' },
    value: '80'
  });
  assert.equal(written[0].weight, '80');
  assert.equal(written[0].reps, '12');
  assert.equal(repsInput.value, '12');
  assert.equal(scheduled[2], false);
  assert.equal(scheduled[3], true);

  currentSets = [{ reps: '9', weight: '75' }, { reps: '', weight: '' }];
  repsInput.value = '';
  context.onSetInput({
    id: 'wt-squat-1',
    dataset: { setKind: 'wt', ex: 'squat', i: '1' },
    value: '80'
  });
  assert.equal(written[1].weight, '80');
  assert.equal(written[1].reps, '9');
  assert.equal(repsInput.value, '9');
});

test('copies the previous value on the first plus tap and increments only afterwards', () => {
  const start = html.indexOf('function previousSetValue');
  const end = html.indexOf('// ---------- Modal ----------', start);
  assert.ok(start >= 0 && end > start, 'Stepper-Logik wurde nicht gefunden');
  const repInput = { value: '', disabled: false };
  const weightInput = { value: '', disabled: false };
  const exercise = { id: 'squat', w: true, inc: 2.5 };
  const changed = [];
  const context = {
    SET_REP_MAX: 9999,
    SET_TIME_MAX_SECONDS: 5999,
    SET_WEIGHT_MAX: 2000,
    S: { week: 1 },
    document: {
      getElementById: id => ({ 'rep-squat-1': repInput, 'wt-squat-1': weightInput })[id] || null
    },
    findEx: () => exercise,
    getSets: () => [{ reps: '8', weight: '80' }, { reps: '', weight: '' }],
    isTime: () => false,
    targetWeight: () => 95,
    PROG: () => ({ weeks: [{ phase: 'aufbau' }] }),
    catReps: () => [5, 8],
    round: value => Math.round(value * 10) / 10,
    active: () => true,
    correctionActive: () => false,
    onSetInput: input => { changed.push(input.value); },
    onSetChange: () => assert.fail('Aktives Training muss direkt speichern')
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);

  context.onStep({ dataset: { step: 'rep', ex: 'squat', i: '1', d: '1' } });
  assert.equal(repInput.value, '8');
  context.onStep({ dataset: { step: 'rep', ex: 'squat', i: '1', d: '1' } });
  assert.equal(repInput.value, '9');

  context.onStep({ dataset: { step: 'wt', ex: 'squat', i: '1', d: '1' } });
  assert.equal(weightInput.value, '80');
  context.onStep({ dataset: { step: 'wt', ex: 'squat', i: '1', d: '1' } });
  assert.equal(weightInput.value, '82.5');
  assert.deepEqual(changed, ['8', '9', '80', '82.5']);
});

test('keeps manual time entry editable and commits it only after confirmation', () => {
  const start = html.indexOf('function timeFieldExercise');
  const end = html.indexOf('function onStep', start);
  assert.ok(start >= 0 && end > start, 'Manuelle Zeiteingabe wurde nicht gefunden');
  const exercise = { id: 'carry', unit: 'seconds' };
  let caret = null;
  const input = {
    dataset: { setKind: 'rep', ex: 'carry' },
    value: '',
    setSelectionRange: (start, end) => { caret = [start, end]; }
  };
  const saved = [];
  const context = {
    findEx: () => exercise,
    isTime: ex => ex.unit === 'seconds',
    clockEditValue: value => value.replace(/[^0-9:]/g, '').slice(0, 5),
    clockTypedFormat: value => {
      const digits = String(value).replace(/[^0-9]/g, '').padStart(4, '0').slice(-4);
      const seconds = String(Math.min(59, Number(digits.slice(2)))).padStart(2, '0');
      return `${digits.slice(0, 2)}:${seconds}`;
    },
    timeInputSeconds: field => field.value === '00:45' ? '45' : '',
    setTimeInputValue: (field, _ex, seconds) => { field.value = seconds === '45' ? '00:45' : ''; },
    active: () => true,
    correctionActive: () => false,
    onSetInput: field => { saved.push(field.value); },
    onSetChange: () => assert.fail('Aktive Zeiteingabe muss direkt gespeichert werden')
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);

  const typeDigit = digit => context.onTimeBeforeInput({
    inputType: 'insertText',
    data: digit,
    preventDefault() {}
  }, input);
  const backspace = () => context.onTimeBeforeInput({
    inputType: 'deleteContentBackward',
    data: null,
    preventDefault() {}
  }, input);
  const pressKey = key => context.onTimeKeyDown({
    key,
    isComposing: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    preventDefault() {}
  }, input);

  assert.equal(typeDigit('4'), true);
  assert.equal(input.value, '00:04');
  assert.deepEqual(caret, [5, 5]);
  assert.deepEqual(saved, []);
  typeDigit('5');
  assert.equal(input.value, '00:45');
  typeDigit('1');
  assert.equal(input.value, '04:51');
  backspace();
  assert.equal(input.value, '00:45');
  assert.deepEqual(saved, []);
  assert.equal(pressKey('Enter'), true);
  assert.equal(input.value, '00:45');
  assert.deepEqual(saved, ['00:45']);

  input.value = '';
  input.dataset.clockDigits = '';
  assert.equal(pressKey('9'), true);
  assert.equal(input.value, '00:09');
  assert.equal(pressKey('Backspace'), true);
  assert.equal(input.value, '');

  input.value = '12:99';
  context.onSetDraftInput(input);
  assert.equal(input.value, '12:59');

  const eventStart = html.indexOf('// ---------- Events ----------');
  const eventSource = html.slice(eventStart, html.indexOf('document.getElementById("bar")', eventStart));
  assert.match(eventSource, /addEventListener\("beforeinput"/);
  assert.match(eventSource, /addEventListener\("keydown"/);
  assert.match(eventSource, /addEventListener\("paste"/);
  assert.match(eventSource, /if\(!onSetDraftInput\(t\)\)onSetInput\(t\)/);
  assert.match(eventSource, /onSetCommit\(t\)/);
  assert.match(eventSource, /addEventListener\("focusout"/);
  assert.match(eventSource, /placeTimeCaret\(timeInput\)/);
});

test('stores set values for imported day keys containing a hyphen', () => {
  const start = html.indexOf('function onSetInput');
  const end = html.indexOf('function onSetChange', start);
  assert.ok(start >= 0 && end > start, 'Satzeingabe wurde nicht gefunden');
  const rowSource = html.slice(
    html.indexOf('function setRowHtml'),
    html.indexOf('function exHistory')
  );
  assert.match(rowSource, /data-set-kind="rep"/);
  assert.match(rowSource, /data-ex="'\+attr\(ex\.id\)\+'"/);
  const exercise = { id: 'push-pull_0', name: 'Rudern', w: false, unit: 'reps' };
  let requestedExerciseId = '';
  let written;
  const context = {
    restPhase: null,
    restExId: null,
    restNextSet: -1,
    document: { getElementById: () => null },
    findEx: id => {
      requestedExerciseId = id;
      return id === exercise.id ? exercise : null;
    },
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
    targetWeight: () => 0,
    writeSets: (_ex, sets) => { written = sets; },
    save() {},
    setComplete: (_ex, set) => set.reps !== '',
    scheduleAutoRest() {},
    updateCard() {},
    applyLocks() {},
    updateProgressUI() {},
    collapseDoneExcept() {},
    maybeAskDone() {}
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);

  context.onSetInput({
    id: 'rep-push-pull_0-0',
    dataset: { setKind: 'rep', ex: 'push-pull_0', i: '0' },
    value: '9'
  });

  assert.equal(requestedExerciseId, exercise.id);
  assert.equal(written[0].reps, '9');
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
  context.onSetInput({
    id: 'rep-squat-1',
    dataset: { setKind: 'rep', ex: 'squat', i: '1' },
    value: '12'
  });
  assert.equal(written[1].weight, '80');
  assert.equal(weightInput.value, '80');

  sets[0] = { reps: '', weight: '' };
  plannedTarget = 0;
  weightInput.value = '';
  context.onSetInput({
    id: 'rep-squat-1',
    dataset: { setKind: 'rep', ex: 'squat', i: '1' },
    value: '12'
  });
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
    const input = {
      id: 'rep-row-0',
      dataset: { setKind: 'rep', ex: 'row', i: '0' },
      value: '8'
    };
    context.restPhase = phase;
    context.onSetInput(input);

    assert.equal(input.value, '', `${phase}: der sichtbare Fremdwert muss verworfen werden`);
    assert.equal(writes, 0, `${phase}: fremde Übung darf nicht in den Store schreiben`);
    assert.equal(saves, 0, `${phase}: fremde Übung darf keinen Save auslösen`);
  }

  context.restExId = exercise.id;
  context.restPhase = 'hold';
  const runningHoldInput = {
    id: 'rep-row-0',
    dataset: { setKind: 'rep', ex: 'row', i: '0' },
    value: '8'
  };
  context.onSetInput(runningHoldInput);
  assert.equal(runningHoldInput.value, '', 'der laufende Halte-Timer muss seine eigene Satzeingabe kontrollieren');
  assert.equal(writes, 0);
  assert.equal(saves, 0);
  assert.equal(reappliedLocks, 4, 'nach jedem abgewiesenen Event muss die DOM-Sperre erneuert werden');

  context.restPhase = 'set';
  const activeSetInput = {
    id: 'rep-row-0',
    dataset: { setKind: 'rep', ex: 'row', i: '0' },
    value: '8'
  };
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
  assert.match(html, /function timeInputSeconds\(/);
  assert.match(html, /Zeit in Minuten und Sekunden/);
});

test('guards the delayed automatic rest and keeps the page scrollable', () => {
  assert.match(html, /var AUTO_REST_DELAY=0/);
  assert.match(html, /scheduleAutoRest\(ex,i,wasComplete,nowComplete\)/);
  assert.match(html, /canStartRest\(ex,current,firstOpen,true\)/);
  assert.match(html, /startRest\(catRest\(ex\),ex\.id,true\)/);
  assert.match(html, /restAfterExercise=next>=sets\.length/);
  assert.doesNotMatch(html.slice(html.indexOf('function exCardHtml'), html.indexOf('function renderView')), /class="pausebtn"/);
  assert.doesNotMatch(html, /body\.rest-lock\{position:fixed/);
  assert.match(html, /classList\.add\("rest-focus"\)/);
});

test('hides the informational page footer during an active workout', () => {
  const renderView = html.slice(
    html.indexOf('function renderView'),
    html.indexOf('function updateProgressUI')
  );
  assert.match(renderView, /if\(!active\(\)\)h\+='<div class="legend"/);
});

test('keeps training cards focused with a group heading and menu actions', () => {
  const cardSource = html.slice(
    html.indexOf('function exCardHtml'),
    html.indexOf('function renderView')
  );
  assert.match(cardSource, /class="cardcat '\+catColor\(ex\)\+'"><span>'\+esc\(catLabel\(ex\)\)/, 'die Trainingsgruppe steht als farbige Kopfzeile auf der Karte');
  assert.doesNotMatch(cardSource, /sets\.length[^;\n]*Sätze/);
  assert.doesNotMatch(cardSource, /presctarget">Ziel/);
  assert.match(cardSource, /class="presctarget"[^;\n]*progressHint/);
  assert.doesNotMatch(cardSource, /data-plates=|class="plateaction"/, 'der Scheibenrechner gehört ins Drei-Punkte-Menü statt auf die Karte');
  assert.match(html, /Scheibenrechner',cls:"menu"/);
  assert.match(cardSource, /class="cardtools"[^;]*data-exmenu=[^;]*collapseBtn/, 'Menü und Einklappen gehören in eine gemeinsame Werkzeugzeile');
  assert.doesNotMatch(cardSource, /class="exdoneactions"/);
  assert.match(html, /\.cardtop\{display:flex;align-items:flex-start/);
  assert.match(html, /\.cardtop \.exnamelink\{margin:-6px 0\}/);
  assert.match(html, /\.sharebtn \.ico\{width:11px;height:11px\}/);
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
  assert.match(html, /class="settimevalue"/);
  assert.match(html, /class="swbtn rowtimer/);
  assert.match(html, /Stoppuhr starten/);
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

test('enforces the current-week, neighbour-week and latest-repeat start matrix', () => {
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
  assert.deepEqual({ ...context.workoutAccess(4, 'A') }, { allowed: true, mode: 'start' });
  assert.deepEqual({ ...context.workoutAccess(1, 'A') }, { allowed: true, mode: 'start' });
  context.currentTrainingWeek = () => 1;
  assert.deepEqual({ ...context.workoutAccess(3, 'A') }, { allowed: false, mode: 'locked' });
  context.currentTrainingWeek = () => 3;

  context.unitEmpty = () => false;
  context.dayWasInterrupted = () => true;
  assert.deepEqual({ ...context.workoutAccess(2, 'A') }, { allowed: true, mode: 'continue' });
  assert.deepEqual({ ...context.workoutAccess(1, 'A') }, { allowed: true, mode: 'continue' });

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
