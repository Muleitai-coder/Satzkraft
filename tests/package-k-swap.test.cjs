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
    S: {},
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

  context.S.logs['1|A|bench'].swapDecision = 'pending';
  context.writeSets(exercise, [{ reps: '8', weight: '90' }]);
  assert.equal(context.S.logs['1|A|bench'].swap, 'Brustpresse', 'Satzeingaben dürfen den Tauschvermerk nicht überschreiben');
  assert.equal(context.S.logs['1|A|bench'].swapDecision, 'pending', 'eine offene Abschlussentscheidung darf beim Schreiben der Satzwerte nicht verloren gehen');
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

test('uses the replacement first-set weight without changing the original exercise target', () => {
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
  assert.equal(context.targetWeight(exercise), 0, 'eine neue Ersatzübung startet ohne das Zielgewicht der Originalübung');
  context.writeSets(exercise, [{ reps: '10', weight: '50' }]);
  assert.equal(context.S.tg['1|bench'], '80', 'das Originalziel darf durch die Ersatzübung nicht überschrieben werden');
  assert.equal(context.currentExerciseSwapWeight(exercise), null);
  assert.equal(context.targetWeight(exercise), 50, 'der erste Satz wird zum Arbeitswert der heutigen Ersatzübung');
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

test('shows the latest matching exercise value from another day without merging progression', () => {
  const program = programFixture();
  const exercise = program.days[0].ex[0];
  program.days.push({
    key: 'B',
    wd: 'Freitag',
    title: 'Drücken 2',
    ex: [{
      id: 'bench-friday', name: 'Bankdrücken',
      cat: 'kraft', w: true, unit: 'reps', def: 70, inc: 2.5
    }]
  });
  const context = appContext();
  context.S = {
    week: 3,
    day: 'A',
    logs: {
      '1|A|bench': { sets: [{ reps: '5', weight: '80' }] },
      '2|B|bench-friday': { sets: [{ reps: '8', weight: '70' }] },
      '3|B|bench-friday': { sets: [{ reps: '12', weight: '120' }], swap: 'Brustpresse' }
    },
    history: [
      { week: 3, day: 'B', start: 300, end: 400, complete: true },
      { week: 2, day: 'B', start: 100, end: 200, complete: true }
    ]
  };
  context.PROG = () => program;
  context.setsForExercise = () => 1;

  const otherDay = context.latestOtherDayPerf(exercise);

  assert.equal(otherDay.day.key, 'B');
  assert.equal(otherDay.week, 2, 'ein Übungstausch darf nicht als Wert der Originalübung erscheinen');
  assert.equal(otherDay.exercise.id, 'bench-friday');
  assert.equal(context.performanceSummary(otherDay.exercise, otherDay.sets), '8×70 kg');
  assert.equal(context.lastPerf(exercise).week, 1, '„Zuletzt“ bleibt auf den ausgewählten Trainingstag begrenzt');
  assert.equal(context.sessionFor(exercise, 2), null, 'die Progression darf den anderen Trainingstag nicht übernehmen');
  assert.match(functionSource('exCardHtml'), /Anderer Tag \u00b7 /);
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

test('applies an accepted post-workout swap at the next open week without changing its protocol', () => {
  const program = programFixture();
  const context = appContext();
  context.setExerciseLibrary([
    {
      de: 'Kurzhantel-Bankdrücken',
      en: 'Dumbbell Bench Press',
      alias: [],
      typ: 'gewicht',
      equipment: 'Kurzhanteln, Flachbank',
      muster: 'Horizontal drücken · Brust',
      technik: 'Kurzhanteln kontrolliert absenken.',
      video: 'Dumbbell Bench Press Technik',
      ersatz: 'Liegestütze'
    },
    {
      de: 'Liegestütze',
      en: 'Push-Up',
      alias: [],
      typ: 'koerpergewicht',
      equipment: 'keine',
      muster: 'Horizontal drücken · Brust',
      technik: 'Körper in einer Linie halten.',
      video: 'Push-Up Technik',
      ersatz: 'Erhöhte Liegestütze'
    }
  ]);
  Object.assign(program.days[0].ex[0], {
    en: 'Barbell Bench Press',
    sub: 'Alte Bankdrück-Technik',
    q: 'Barbell Bench Press Technik',
    gname: 'Bench Press'
  });
  const store = {
    tg: {}, barw: {}, notes: {},
    logs: { '1|A|bench': { sets: [{ reps: '8', weight: '62.5' }], swap: 'Kurzhantel-Bankdrücken', swapWeight: '80' } },
    history: [{ week: 1, day: 'A', start: 1, end: 2, dur: 1, complete: true }],
    workout: null, pendingReplacements: [], week: 1, day: 'A', blockCelebrated: false
  };
  context.S = {
    active: 'basis', programs: { basis: program }, store: { basis: store },
    week: 1, day: 'A', logs: store.logs, history: store.history,
    pendingReplacements: [], workout: null
  };
  context.syncStore = () => {};
  context.flushSave = () => {};
  context.refreshPostWorkoutReplacements = () => [];

  const request = context.completedWorkoutSwaps('basis', 1, 'A')[0];
  assert.deepEqual({ ...request }, {
    programId: 'basis', week: 1, day: 'A', exId: 'bench',
    name: 'Kurzhantel-Bankdrücken', original: 'Bankdrücken'
  });
  assert.equal(context.nextOpenReplacementWeek(program, store, request), 2);
  assert.equal(context.nextOpenReplacementWeek(program, {
    ...store,
    logs: {
      ...store.logs,
      '2|A|bench': { sets: [{ reps: '5', weight: '60' }] }
    }
  }, request), 3, 'eine teilweise begonnene Folgewoche darf nicht überschrieben werden');
  assert.equal(context.nextOpenReplacementWeek(program, {
    ...store,
    logs: {
      ...store.logs,
      '2|A|bench': { sets: [], swap: 'Liegestütze' }
    }
  }, request), 3, 'auch ein vorbereiteter Tausch macht die Folgewoche belegt');

  const result = context.applyPermanentExerciseReplacement(request);
  assert.deepEqual({ ...result }, { followup: false, anchor: 2 });
  assert.equal(program.days[0].ex[0].untilWeek, 1);
  const successor = program.days[0].ex[1];
  assert.equal(successor.name, 'Kurzhantel-Bankdrücken');
  assert.equal(successor.en, 'Dumbbell Bench Press');
  assert.equal(successor.sub, 'Kurzhanteln kontrolliert absenken.');
  assert.equal(successor.q, 'Dumbbell Bench Press Technik');
  assert.equal(successor.proxy, 'Liegestütze');
  assert.equal(successor.gname, undefined);
  assert.equal(successor.def, 62.5, 'die neue Übung startet mit ihrem tatsächlich verwendeten Gewicht statt dem Ziel der Originalübung');
  assert.equal(successor.fromWeek, 2);
  assert.equal(successor.prevId, 'bench');
  assert.deepEqual({ ...store.logs['1|A|bench'] }, {
    sets: [{ reps: '8', weight: '62.5' }], swap: 'Kurzhantel-Bankdrücken', swapWeight: '80'
  }, 'das abgeschlossene Training bleibt als Tausch protokolliert');

  const bodyweight = context.applyPermanentReplacementMetadata({
    name: 'Bankdrücken', en: 'Alt', sub: 'Alt', q: 'Alt', proxy: 'Alt',
    gname: 'Alt', w: true, bw: false, unit: 'reps', pmode: 'weight',
    def: 80, inc: 2.5
  }, 'Liegestütze');
  assert.equal(bodyweight.en, 'Push-Up');
  assert.equal(bodyweight.sub, 'Körper in einer Linie halten.');
  assert.equal(bodyweight.w, false);
  assert.equal(bodyweight.unit, 'reps');
  assert.equal(bodyweight.pmode, 'reps');
  assert.equal(bodyweight.def, undefined);
  assert.equal(bodyweight.inc, undefined);
  assert.equal(bodyweight.gname, undefined);

  const unknown = context.applyPermanentReplacementMetadata({
    name: 'Bankdrücken', en: 'Falscher englischer Name', sub: 'Falscher Hinweis',
    q: 'Falsches Video', proxy: 'Falscher Ersatz', gname: 'Alt', w: true
  }, 'Eigene Ersatzübung');
  assert.equal(unknown.name, 'Eigene Ersatzübung');
  assert.equal(unknown.en, undefined);
  assert.equal(unknown.sub, undefined);
  assert.equal(unknown.q, undefined);
  assert.equal(unknown.proxy, undefined);
  assert.equal(unknown.gname, undefined);
});

test('turns a matching today-only swap into normal history when the replacement is saved permanently', () => {
  const oldProgram = programFixture();
  const newProgram = JSON.parse(JSON.stringify(oldProgram));
  newProgram.days[0].ex[0].untilWeek = 0;
  newProgram.days[0].ex.push({
    ...newProgram.days[0].ex[0],
    id: 'bench_v1',
    name: 'Brustpresse',
    fromWeek: 1,
    prevId: 'bench'
  });
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

  assert.deepEqual(Array.from(migrated.logs['1|A|bench_v1'].sets, set => ({ ...set })), [
    { reps: '10', weight: '100' }
  ]);
  assert.equal(migrated.logs['1|A|bench_v1'].swap, undefined, 'nach der dauerhaften Übernahme ist die Ersatzübung die reguläre Übung');
  assert.equal(migrated.logs['1|A|bench_v1'].swapWeight, undefined, 'das temporäre Ersatzgewicht darf keine eigene Programmlogik behalten');
  assert.equal(migrated.logs['1|A|bench'], undefined);
  assert.match(html, /if\(pendingContext\)migrated\.pendingReplacements=\[\]/);
});

test('defers a last-week replacement to the follow-up block', () => {
  const program = programFixture();
  program.weeks = program.weeks.slice(0, 1);
  const store = {
    logs: { '1|A|bench': { sets: [{ reps: '8', weight: '55' }], swap: 'Kurzhantel-Bankdrücken' } },
    history: [{ week: 1, day: 'A', complete: true }],
    pendingReplacements: []
  };
  const context = appContext();
  context.S = {
    active: 'basis', programs: { basis: program }, store: { basis: store },
    logs: store.logs, history: store.history, pendingReplacements: []
  };
  context.syncStore = () => {};
  context.flushSave = () => {};
  context.refreshPostWorkoutReplacements = () => context.S.pendingReplacements;
  context.genId = () => 'followup';
  context.setExerciseLibrary([{
    de: 'Kurzhantel-Bankdrücken',
    en: 'Dumbbell Bench Press',
    alias: [],
    typ: 'gewicht',
    equipment: 'Kurzhanteln, Flachbank',
    muster: 'Horizontal drücken · Brust',
    technik: 'Kurzhanteln kontrolliert absenken.',
    video: 'Dumbbell Bench Press Technik',
    ersatz: 'Liegestütze'
  }]);

  const request = context.completedWorkoutSwaps('basis', 1, 'A')[0];
  const result = context.applyPermanentExerciseReplacement(request);

  assert.deepEqual({ ...result }, { followup: true, anchor: null });
  assert.deepEqual(Array.from(context.S.pendingReplacements, item => ({ ...item })), [{
    programId: 'basis', day: 'A', exId: 'bench', name: 'Kurzhantel-Bankdrücken'
  }]);
  store.pendingReplacements = context.S.pendingReplacements;
  const followup = context.buildFollowupProgram(program, store, { basis: program });
  assert.equal(followup.days[0].ex[0].name, 'Kurzhantel-Bankdrücken');
  assert.equal(followup.days[0].ex[0].en, 'Dumbbell Bench Press');
  assert.equal(followup.days[0].ex[0].sub, 'Kurzhanteln kontrolliert absenken.');
  assert.equal(followup.days[0].ex[0].q, 'Dumbbell Bench Press Technik');
  assert.equal(followup.days[0].ex[0].def, 55);
  assert.equal(followup.days[0].ex[0].fromWeek, undefined);
});

test('asks for every completed swap separately after the workout', () => {
  const program = programFixture();
  program.days[0].ex.push({
    id: 'row', name: 'Rudern', proxy: 'Kabelrudern',
    cat: 'kraft', w: true, unit: 'reps', def: 60, inc: 2.5
  });
  const store = {
    logs: {
      '1|A|bench': { sets: [{ reps: '8', weight: '80' }], swap: 'Brustpresse', swapDecision: 'pending' },
      '1|A|row': { sets: [{ reps: '8', weight: '60' }], swap: 'Kabelrudern', swapDecision: 'pending' }
    },
    history: [{ week: 1, day: 'A', complete: true }],
    pendingReplacements: []
  };
  const context = appContext();
  context.S = {
    active: 'basis', programs: { basis: program }, store: { basis: store },
    week: 1, day: 'A', logs: store.logs, history: store.history,
    pendingReplacements: [], workout: null
  };
  const modals = [];
  context.active = () => false;
  context.syncStore = context.flushSave = context.renderView = context.renderBar = () => {};
  context.refreshPostWorkoutReplacements = () => [];
  context.maybeShowBlockSuccess = () => false;
  context.showModal = (title, message, actions) => modals.push({ title, message, actions });
  context.postWorkoutSwapProgramId = null;
  context.postWorkoutSwapQueue = [];
  assert.equal(
    context.resumePendingWorkoutSwapFlow('basis'),
    true,
    'offene Einzelentscheidungen müssen nach einem Reload wieder erscheinen'
  );

  assert.equal(modals.length, 1);
  assert.equal(modals[0].title, 'Übung dauerhaft übernehmen?');
  assert.match(modals[0].message, /Bankdrücken.*Brustpresse/s);
  assert.deepEqual(Array.from(modals[0].actions, action => action.label), [
    'Dauerhaft übernehmen', 'Nur dieses Training'
  ]);
  modals[0].actions[0].action();
  assert.equal(modals.length, 2);
  assert.match(modals[1].message, /Rudern.*Kabelrudern/s);
  modals[1].actions[1].action();

  assert.equal(context.postWorkoutSwapQueue.length, 0);
  assert.equal(store.logs['1|A|bench'].swapDecision, 'permanent');
  assert.equal(store.logs['1|A|row'].swapDecision, 'training');
  assert.equal(program.days[0].ex.some(ex => ex.name === 'Brustpresse' && ex.fromWeek === 2), true);
  assert.equal(program.days[0].ex.some(ex => ex.name === 'Kabelrudern' && ex.fromWeek === 2), false);
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
  valid.logs['1|A|bench'].swapDecision = 'pending';
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

  const invalidDecision = JSON.parse(JSON.stringify(baseStore));
  invalidDecision.logs['1|A|bench'].swap = 'Brustpresse';
  invalidDecision.logs['1|A|bench'].swapDecision = 'später';
  assert.match(context.validateBackupStore(invalidDecision, 'basis', program), /Tauschstatus/);

  const stalePending = JSON.parse(JSON.stringify(baseStore));
  stalePending.pendingReplacements = [{ programId: 'basis', day: 'A', exId: 'fehlt', name: 'Brustpresse' }];
  assert.match(context.validateBackupStore(stalePending, 'basis', program), /vorgemerkte Übungstausche/);
});

test('renders one simple temporary action and defers permanence until completion', () => {
  assert.match(html, /Übung tauschen/);
  assert.match(html, /Für dieses Training/);
  assert.doesNotMatch(functionSource('showExerciseSwap'), /Ab jetzt ersetzen/);
  assert.match(functionSource('showNextPostWorkoutSwapDecision'), /Dauerhaft übernehmen/);
  assert.match(functionSource('showNextPostWorkoutSwapDecision'), /Nur dieses Training/);
  const cardSource = functionSource('exCardHtml');
  assert.match(cardSource, /currentExerciseSwap\(ex\)/);
  assert.match(cardSource, /getauscht/);
  assert.doesNotMatch(cardSource, /Übung nur heute tauschen/);
  assert.doesNotMatch(cardSource, /swapqueued/);
});
