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
    APP_VERSION: '0.22.0',
    LIMITS: { maxSets: 20, maxWeeks: 20, maxNameLen: 80 },
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
      { n: 1, phase: 'aufbau', label: 'Aufbau', sets: { kraft: 1 } },
      { n: 2, phase: 'aufbau', label: 'Aufbau', sets: { kraft: 1 } },
      { n: 3, phase: 'aufbau', label: 'Aufbau', sets: { kraft: 1 } }
    ],
    days: [{
      key: 'A',
      wd: 'Montag',
      title: 'Drücken',
      ex: [{
        id: 'bench', name: 'Bankdrücken', proxy: 'Kurzhantel-Bankdrücken',
        cat: 'kraft', w: true, unit: 'reps', def: 80, inc: 2.5
      }]
    }]
  };
}

test('stores a today-only swap in the exercise log and writeSets keeps its marker', () => {
  const program = programFixture();
  const exercise = program.days[0].ex[0];
  const context = appContext();
  context.S = {
    active: 'basis', programs: { basis: program }, week: 1, day: 'A',
    logs: {}, workout: { running: true, pendingReplacements: [] }
  };
  context.PROG = () => program;
  context.dayByKey = () => program.days[0];
  context.setsForExercise = () => 1;
  context.active = () => true;
  context.save = context.renderView = context.renderBar = () => {};

  assert.equal(typeof context.swapExerciseForToday, 'function');
  assert.equal(typeof context.currentExerciseSwap, 'function');
  context.swapExerciseForToday(exercise, 'Brustpresse');

  assert.equal(context.S.logs['1|A|bench'].swap, 'Brustpresse');
  assert.equal(context.currentExerciseSwap(exercise), 'Brustpresse');

  context.writeSets(exercise, [{ reps: '8', weight: '90' }]);
  assert.equal(context.S.logs['1|A|bench'].swap, 'Brustpresse', 'Satzeingaben dürfen den Tauschvermerk nicht überschreiben');
  assert.deepEqual(Array.from(context.S.logs['1|A|bench'].sets, set => ({ ...set })), [
    { reps: '8', weight: '90' }
  ]);
  assert.equal(context.cellComplete(1, 'A', exercise), true, 'der Ersatz zählt für den Abschluss des heutigen Trainings');

  context.S.week = 2;
  assert.equal(context.currentExerciseSwap(exercise) || null, null, 'der Tausch darf nicht in die Folgewoche auslaufen');

  context.S.week = 1;
  context.S.logs['1|A|bench'] = { sets: [{ reps: '5', weight: '80' }] };
  context.swapExerciseForToday(exercise, 'Kabelzug');
  assert.equal(context.S.logs['1|A|bench'].swap, undefined, 'nach der ersten Satzeingabe darf kein Übungswechsel mehr begonnen werden');
});

test('keeps a replacement working weight out of the original exercise target', () => {
  const program = programFixture();
  const exercise = program.days[0].ex[0];
  const context = appContext();
  context.S = {
    active: 'basis', programs: { basis: program }, week: 1, day: 'A',
    tg: { '1|bench': '80' },
    logs: { '1|A|bench': { sets: [], swap: 'Brustpresse' } }
  };
  context.PROG = () => program;
  context.findEx = id => id === exercise.id ? exercise : null;
  context.active = () => true;
  context.restPhase = null;
  context.save = () => {};
  context.document.getElementById = () => null;

  context.onWwInput({ id: 'ww-bench', value: '50' });

  assert.equal(context.S.tg['1|bench'], '80', 'das Originalziel darf durch die Ersatzübung nicht überschrieben werden');
  assert.equal(context.S.logs['1|A|bench'].swapWeight, '50');
  assert.equal(context.currentExerciseSwapWeight(exercise), 50);
  assert.equal(context.targetWeight(exercise), 50, 'im heutigen Ersatztraining muss das eigene Arbeitsgewicht nutzbar sein');

  context.writeSets(exercise, [{ reps: '10', weight: '50' }]);
  assert.equal(context.S.logs['1|A|bench'].swapWeight, '50', 'Satzeingaben müssen das temporäre Ersatzgewicht erhalten');
});

test('excludes swapped work from original progression, history trend and follow-up recommendations', () => {
  const program = programFixture();
  const exercise = program.days[0].ex[0];
  const logs = {
    '1|A|bench': { sets: [{ reps: '8', weight: '80' }] },
    '2|A|bench': { sets: [{ reps: '12', weight: '120' }], swap: 'Brustpresse' }
  };
  const context = appContext();
  context.S = { week: 3, day: 'A', logs };
  context.PROG = () => program;
  context.dayByKey = () => program.days[0];
  context.setsForExercise = () => 1;
  context.isTime = ex => ex.unit === 'seconds';
  context.round = value => Math.round(Number(value) * 2) / 2;

  assert.equal(context.sessionFor(exercise, 2), null, 'eine Ersatzübung ist keine Session der Original-Übung');
  assert.deepEqual(Array.from(context.priorSessions(exercise, 3), session => Array.from(session, set => ({ ...set }))), [
    [{ reps: '8', weight: '80' }]
  ]);
  assert.equal(context.actualMinWeight(exercise, 2), null, 'Ersatzgewicht darf keine Empfehlung der Original-Übung speisen');
  assert.equal(context.lastPerf(exercise).week, 1, '„Zuletzt“ muss die letzte Original-Session zeigen');
  assert.deepEqual(Array.from(context.exHistory(exercise), row => row.w), [1], 'der Übungsverlauf muss getauschte Wochen auslassen');

  const followup = context.followupExerciseSessions(program, { logs }, program.days[0], exercise);
  assert.deepEqual(Array.from(followup, session => session.week), [1], 'Folgeblock-Startwerte dürfen Ersatzwerte nicht verwenden');
  assert.equal(followup[0].sets[0].weight, '80');
});

test('ignores swapped holds when calculating the original exercise best time', () => {
  const exercise = { id: 'hang', unit: 'seconds' };
  const context = appContext();
  context.S = {
    logs: {
      '1|A|hang': { sets: [{ reps: '45', weight: '' }] },
      '2|A|hang': { sets: [{ reps: '120', weight: '' }], swap: 'Unterarmstütz' }
    }
  };

  assert.equal(context.holdBestSeconds(exercise), 45);
});

test('counts swapped sets in report totals but not in the original exercise trend', () => {
  const program = programFixture();
  const logs = {
    '1|A|bench': { sets: [{ reps: '5', weight: '80' }] },
    '2|A|bench': { sets: [{ reps: '10', weight: '100' }], swap: 'Brustpresse' }
  };
  const context = appContext();
  const data = context.buildReportData(program, logs, []);
  const metric = data.exercises.find(entry => entry.id === 'bench');

  assert.equal(data.totalSets, 2);
  assert.equal(data.totalVolume, 1400, 'Ersatzarbeit bleibt Teil der Trainings-Gesamtsumme');
  assert.ok(metric, 'die Original-Übung mit echter Session bleibt im Bericht');
  assert.deepEqual(Array.from(metric.points, point => point.week), [1]);
  assert.equal(metric.latest, 93.5, 'der hohe Ersatzwert darf den Originaltrend nicht verändern');
});

test('shows the original and replacement names in the detailed training protocol', () => {
  const program = programFixture();
  const context = appContext({
    dDate: () => '16.07.2026',
    reportDuration: () => '10 min',
    fmtSeconds: seconds => `${seconds} Sek`
  });
  const protocol = context.reportDetailedProtocol(program, {
    '1|A|bench': { sets: [{ reps: '10', weight: '100' }], swap: 'Brustpresse' }
  }, [{ week: 1, day: 'A', start: 1, dur: 600, complete: true }]);

  assert.match(protocol, /Bankdrücken<\/span>.*→.*<b>Brustpresse<\/b>/);
  assert.match(protocol, /Getauscht/);
  assert.match(protocol, /10×100/);
});

test('queues permanent replacements during training and opens every exact _ref only after explicit action', () => {
  const program = programFixture();
  program.days[0].ex.push(
    { id: 'row', name: 'Langhantelrudern', cat: 'kraft', w: true, unit: 'reps', def: 60, inc: 2.5 },
    { id: 'press', name: 'Schulterdrücken', cat: 'kraft', w: true, unit: 'reps', def: 40, inc: 2.5 }
  );
  const exercise = program.days[0].ex[0];
  const context = appContext();
  context.S = {
    active: 'basis', programs: { basis: program }, week: 1, day: 'A', logs: {},
    workout: { running: true, pendingReplacements: [] }
  };
  context.postWorkoutReplacements = [];
  let editorOpened = 0;
  let saved = 0;
  context.active = () => !!context.S.workout;
  context.save = () => { saved++; };
  context.renderView = () => {};
  context.openLib = () => {};
  context.openProgramEditor = id => {
    editorOpened++;
    assert.equal(id, 'basis');
    context.editorDraft = {
      name: 'Kraftbasis',
      categories: { kraft: { label: 'Kraft', color: 'amber', rest: 90, reps: { aufbau: [5, 8] } } },
      weeks: [{ n: 1, phase: 'aufbau', label: 'Aufbau', sets: { kraft: 1 } }],
      days: [{
        key: 'A', weekday: 'Montag', title: 'Drücken',
        exercises: [
          { _ref: 'bench', name: 'Bankdrücken', category: 'kraft', weighted: true, unit: 'reps', startWeight: 80, increment: 2.5 },
          { _ref: 'row', name: 'Langhantelrudern', category: 'kraft', weighted: true, unit: 'reps', startWeight: 60, increment: 2.5 },
          { _ref: 'press', name: 'Schulterdrücken', category: 'kraft', weighted: true, unit: 'reps', startWeight: 40, increment: 2.5 }
        ]
      }]
    };
  };
  let undoSteps = 0;
  context.editorPushUndo = () => { undoSteps++; };
  context.renderProgramEditor = () => {};

  assert.equal(typeof context.queuePermanentExerciseReplacement, 'function');
  assert.equal(typeof context.workoutPendingReplacements, 'function');
  assert.equal(typeof context.openPendingReplacement, 'function');
  const before = JSON.stringify(program);
  context.queuePermanentExerciseReplacement(exercise, 'Brustpresse');
  const pending = context.workoutPendingReplacements();

  assert.equal(editorOpened, 0, 'der Trainings-Schreibschutz darf nicht übergangen werden');
  assert.equal(JSON.stringify(program), before, 'das laufende Training darf das Programm nicht still verändern');
  assert.equal(pending.length, 1);
  assert.match(JSON.stringify(pending[0]), /bench/);
  assert.match(JSON.stringify(pending[0]), /Brustpresse/);
  assert.equal(saved > 0, true, 'die Vormerkung muss mit dem laufenden Training gespeichert werden');

  const requests = pending.concat([
    { programId: 'basis', day: 'A', exId: 'row', name: 'Kabelrudern' }
  ]);
  context.S.workout = null;
  context.openPendingReplacementsInEditor(requests);
  assert.equal(editorOpened, 1, 'erst die bewusste Folgeaktion öffnet den Editor');
  assert.equal(context.editorDraft.days[0].exercises[0]._ref, 'bench');
  assert.equal(context.editorDraft.days[0].exercises[0].name, 'Brustpresse');
  assert.equal(context.editorDraft.days[0].exercises[1]._ref, 'row');
  assert.equal(context.editorDraft.days[0].exercises[1].name, 'Kabelrudern');
  assert.equal(context.editorDraft.days[0].exercises[2].name, 'Schulterdrücken');
  assert.deepEqual({ ...context.editorPendingReplacementRefs }, {
    bench: 'Brustpresse',
    row: 'Kabelrudern'
  });
  assert.equal(undoSteps, 1, 'alle Vormerkungen müssen einen gemeinsamen Rückgängig-Schritt bilden');
  assert.equal(context.editorExerciseIndex, 0);

  context.EDITOR_WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  context.WD_ABBR = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  context.WUCD_LIB = { warmup: [], cooldown: [] };
  context.editorWeekIndex = 0;
  context.editorOpenSections = {};
  context.LIMITS.maxDays = 7;
  context.LIMITS.maxExPerDay = 20;
  const editorTraining = context.renderEditorTraining(context.editorDraft, ['kraft']);
  assert.equal((editorTraining.match(/class="edexercise[^"]*pendingreplacement/g) || []).length, 2, 'jede vorgemerkte _ref muss eine gelbe Karte erhalten');
  assert.equal((editorTraining.match(/class="pendingreplacementbadge"/g) || []).length, 2);
  const untouchedCard = editorTraining.match(/<div class="edexercise([^"]*)" data-ed-ex-card="2">/);
  assert.ok(untouchedCard, 'nicht vorgemerkte Vergleichsübung fehlt');
  assert.doesNotMatch(untouchedCard[1], /pendingreplacement/);

  const editorRoot = { innerHTML: '' };
  context.document = { getElementById: id => id === 'lib' ? editorRoot : null };
  context.editorSourceId = 'basis';
  context.editorView = 'training';
  context.editorUndoStack = [];
  vm.runInContext(`renderProgramEditor = ${functionSource('renderProgramEditor')}`, context);
  context.renderProgramEditor('training', 0, 0);
  assert.match(editorRoot.innerHTML, /editorpendingnotice/);
  assert.match(editorRoot.innerHTML, /id="edreplace">Vorgemerkte Tausche übernehmen/);
  assert.doesNotMatch(editorRoot.innerHTML, /id="edsavecopy"/);
});

test('turns a matching today-only swap into normal history when the replacement is saved permanently', () => {
  const oldProgram = programFixture();
  const newProgram = JSON.parse(JSON.stringify(oldProgram));
  newProgram.days[0].ex[0].id = 'A_0';
  newProgram.days[0].ex[0].name = 'Brustpresse';
  const oldStore = {
    tg: {}, barw: {}, notes: {},
    logs: { '1|A|bench': { sets: [{ reps: '10', weight: '100' }], swap: 'Brustpresse', swapWeight: '100' } },
    history: [], workout: null,
    pendingReplacements: [{ programId: 'basis', day: 'A', exId: 'bench', name: 'Brustpresse' }],
    week: 1, day: 'A', blockCelebrated: false
  };
  const context = appContext();
  const migrated = context.migrateReplaceStore(oldProgram, oldStore, newProgram, {
    bench: { day: 'A', id: 'A_0' }
  });

  assert.deepEqual(Array.from(migrated.logs['1|A|A_0'].sets, set => ({ ...set })), [
    { reps: '10', weight: '100' }
  ]);
  assert.equal(migrated.logs['1|A|A_0'].swap, undefined, 'nach der dauerhaften Übernahme ist die Ersatzübung die reguläre Übung');
  assert.equal(migrated.logs['1|A|A_0'].swapWeight, undefined, 'das temporäre Ersatzgewicht darf keine eigene Programmlogik behalten');
  assert.deepEqual(Array.from(migrated.pendingReplacements), [], 'die erfolgreich übernommene Vormerkung muss erledigt sein');
});

test('keeps deferred permanent replacements in the persisted program store', () => {
  const program = programFixture();
  const pending = [{ programId: 'basis', day: 'A', exId: 'bench', name: 'Brustpresse' }];
  const context = appContext();
  context.S = {
    active: 'basis', programs: { basis: program }, pendingReplacements: []
  };
  context.postWorkoutReplacements = [];

  assert.equal(context.offerPendingReplacements(pending), true);
  assert.deepEqual(Array.from(context.S.pendingReplacements, request => ({ ...request })), pending);

  context.postWorkoutReplacements = [];
  assert.equal(context.offerPendingReplacements([]), true, 'eine spätere Anzeige darf die gespeicherte Vormerkung nicht verlieren');
  assert.deepEqual(Array.from(context.postWorkoutReplacements, request => ({ ...request })), pending);
});

test('stopWorkout requires Editor or Verwerfen for pending replacements and offers no Später path', () => {
  const program = programFixture();
  const pending = [{ programId: 'basis', day: 'A', exId: 'bench', name: 'Brustpresse' }];
  const context = appContext();
  context.S = {
    active: 'basis', programs: { basis: program }, week: 1, day: 'A', logs: {}, pendingReplacements: [],
    workout: {
      running: false, accrued: 60, firstStart: 1, week: 1, day: 'A',
      segmentsBase: 0, pendingReplacements: pending
    }
  };
  context.postWorkoutReplacements = [];
  context.pendingReplacementCompletionProgramId = null;
  context.PROG = () => program;
  context.active = () => !!context.S.workout;
  const modals = [];
  let flushed = 0;
  let editorOpened = 0;
  let completedFlow = 0;
  let rendered = 0;
  context.clearDonePrompt = context.cancelAllAutoRest = context.resetRestState = () => {};
  context.clearRestFocus = context.releaseWakeLock = context.cancelAllDoneCollapse = () => {};
  context.replaceDayHistory = context.renderBar = () => {};
  context.renderView = () => { rendered++; };
  context.flushSave = () => { flushed++; };
  context.dayComplete = () => false;
  context.maybeShowBlockSuccess = () => { completedFlow++; return false; };
  context.showModal = (title, message, actions) => modals.push({ title, message, actions });
  let editorRequests = null;
  context.openPendingReplacementsInEditor = requests => {
    editorOpened++;
    editorRequests = requests;
    return true;
  };

  context.stopWorkout();

  assert.equal(context.S.workout, null);
  assert.equal(editorOpened, 0, 'Trainingsende darf den Editor nicht automatisch öffnen');
  assert.deepEqual(Array.from(context.S.pendingReplacements, request => ({ ...request })), pending);
  assert.ok(flushed >= 1, 'Vormerkungen müssen vor der Entscheidung dauerhaft gespeichert sein');
  assert.equal(modals.length, 1);
  assert.match(modals[0].title, /Dauerhafte Übungstausche prüfen/);
  assert.match(modals[0].message, /Bankdrücken.*Brustpresse/s);
  assert.deepEqual(Array.from(modals[0].actions, action => action.label), [
    'Zum Editor', 'Vormerkungen verwerfen'
  ]);
  assert.doesNotMatch(JSON.stringify(modals[0]), /Später/);

  modals[0].actions[0].action();
  assert.equal(editorOpened, 1);
  assert.deepEqual(Array.from(editorRequests, request => ({ ...request })), pending);

  modals[0].actions[1].action();
  assert.deepEqual(Array.from(context.S.pendingReplacements), []);
  assert.deepEqual(Array.from(context.postWorkoutReplacements), []);
  assert.ok(rendered >= 2);
  assert.equal(completedFlow, 1, 'erst nach der Entscheidung darf der übrige Abschlussfluss weiterlaufen');
});

test('validates optional swap markers in backups without breaking older logs', () => {
  const program = programFixture();
  const baseStore = {
    tg: {}, barw: {}, notes: {},
    logs: { '1|A|bench': { sets: [{ reps: '8', weight: '80' }] } },
    history: [], workout: null, week: 1, day: 'A', blockCelebrated: false
  };
  const context = appContext();

  assert.equal(context.validateBackupStore(baseStore, 'basis', program), null, 'alte Logs ohne swap bleiben gültig');

  const valid = JSON.parse(JSON.stringify(baseStore));
  valid.logs['1|A|bench'].swap = 'B'.repeat(80);
  valid.logs['1|A|bench'].swapWeight = '45';
  valid.pendingReplacements = [{ programId: 'basis', day: 'A', exId: 'bench', name: 'Brustpresse' }];
  assert.equal(context.validateBackupStore(valid, 'basis', program), null);

  const tooLong = JSON.parse(JSON.stringify(baseStore));
  tooLong.logs['1|A|bench'].swap = 'B'.repeat(81);
  assert.match(context.validateBackupStore(tooLong, 'basis', program), /[Tt]ausch|Ersatzübung/);

  const wrongType = JSON.parse(JSON.stringify(baseStore));
  wrongType.logs['1|A|bench'].swap = { name: 'Brustpresse' };
  assert.match(context.validateBackupStore(wrongType, 'basis', program), /[Tt]ausch|Ersatzübung/);

  const orphanWeight = JSON.parse(JSON.stringify(baseStore));
  orphanWeight.logs['1|A|bench'].swapWeight = '50';
  assert.match(context.validateBackupStore(orphanWeight, 'basis', program), /Ersatzgewicht/);

  const stalePending = JSON.parse(JSON.stringify(baseStore));
  stalePending.pendingReplacements = [{ programId: 'basis', day: 'A', exId: 'fehlt', name: 'Brustpresse' }];
  assert.match(context.validateBackupStore(stalePending, 'basis', program), /vorgemerkte Übungstausche/);
});

test('renders the temporary swap before and during training while permanent replacement stays workout-only', () => {
  assert.match(html, /Übung tauschen/);
  assert.match(html, /Für dieses Training/);
  assert.match(html, /Dauerhaft ersetzen/);
  const cardSource = functionSource('exCardHtml');
  assert.match(cardSource, /currentExerciseSwap\(ex\)/);
  assert.match(cardSource, /getauscht/);
  assert.doesNotMatch(cardSource, /if\(active\(\)&&!done&&!hasEntered\)/);
  assert.match(functionSource('showExerciseSwap'), /if\(active\(\)\)actions\.push/);
});
