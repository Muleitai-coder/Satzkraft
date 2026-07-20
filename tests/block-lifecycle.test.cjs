const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const progression = require('../js/progression.js');

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
      if (!previous || /[({\[=,:;!&|?+*%^~<>-]/.test(previous) || /\b(?:return|case|throw|delete|void|typeof|instanceof|in|of|yield)$/.test(before)) {
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
    APP_VERSION: '0.21.0',
    LIMITS: { maxNameLen: 30 },
    S: {},
    PROGRESSION: progression,
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

function blockProgram() {
  return {
    id: 'basis',
    name: 'Kraftbasis',
    categories: {
      strength: {
        label: 'Kraft',
        reps: { aufbau: [5, 7], deload: [5, 5] }
      }
    },
    settings: {
      progressionSystem: 'double_progression',
      requireAllSetsForIncrease: true,
      allowAutoDecrease: true,
      deloadMultiplier: 0.6,
      postDeloadReturnMultiplier: 0.925
    },
    weeks: [
      { n: 1, phase: 'aufbau', sets: { strength: 2 } },
      { n: 2, phase: 'aufbau', sets: { strength: 2 } },
      { n: 3, phase: 'deload', sets: { strength: 1 } }
    ],
    days: [{
      key: 'A',
      wd: 'Montag',
      ex: [
        { id: 'squat', name: 'Kniebeuge', cat: 'strength', w: true, unit: 'reps', def: 80, inc: 2.5 },
        { id: 'row', name: 'Rudern', cat: 'strength', w: true, unit: 'reps', def: 40, inc: 2.5 },
        { id: 'push', name: 'Liegestütze', cat: 'strength', w: false, unit: 'reps', target: 'sauber' }
      ]
    }]
  };
}

function completeLogs(program) {
  const logs = {};
  for (let week = 1; week <= program.weeks.length; week++) {
    const count = program.weeks[week - 1].sets.strength;
    for (const exercise of program.days[0].ex) {
      logs[`${week}|A|${exercise.id}`] = {
        sets: Array.from({ length: count }, () => exercise.w
          ? { reps: '7', weight: week === 3 ? '50' : '82.5' }
          : { reps: '12', weight: '' })
      };
    }
  }
  return logs;
}

test('computes block completion live for units without a frozen completion state', () => {
  const context = appContext();
  const program = blockProgram();
  const logs = completeLogs(program);
  const snapshot = JSON.stringify({ program, logs });

  assert.equal(context.programBlockComplete(program, logs), true);
  assert.equal(JSON.stringify({ program, logs }), snapshot, 'Prüfung darf Programm und Logs nicht verändern');

  const missingUnit = JSON.parse(JSON.stringify(logs));
  delete missingUnit['2|A|push'];
  assert.equal(context.programBlockComplete(program, missingUnit), false);

  const incompleteWeightedSet = JSON.parse(JSON.stringify(logs));
  incompleteWeightedSet['1|A|squat'].sets[0].weight = '';
  assert.equal(context.programBlockComplete(program, incompleteWeightedSet), false);
});

test('keeps regularly completed units complete after later plan additions', () => {
  const context = appContext();
  const program = blockProgram();
  const logs = completeLogs(program);
  const history = program.weeks.map((_, index) => ({
    week: index + 1, day: 'A', complete: true
  }));
  const snapshot = JSON.stringify({ program, logs, history });
  program.days[0].ex.push({
    id: 'later', name: 'Später ergänzt', cat: 'strength', w: false, unit: 'reps'
  });

  assert.equal(context.programBlockComplete(program, logs), false);
  assert.equal(context.programBlockComplete(program, logs, history), true);
  assert.equal(context.programBlockComplete(program, logs, history.map(entry => ({ ...entry, complete: false }))), false);
  assert.equal(context.programBlockComplete(program, logs, history.map(({ complete, ...entry }) => entry)), false);
  assert.equal(
    JSON.stringify({ program: blockProgram(), logs, history }),
    snapshot,
    'Abschlussprüfung darf Logs und History nicht verändern'
  );
});

test('uses frozen completion for day status, week progress and skipped-unit checks', () => {
  const context = appContext();
  const program = blockProgram();
  program.weeks = program.weeks.slice(0, 1);
  const logs = completeLogs(program);
  program.days[0].ex.push({
    id: 'later', name: 'Später ergänzt', cat: 'strength', w: false, unit: 'reps'
  });
  const history = [{ week: 1, day: 'A', complete: true }];
  context.S = {
    active: 'basis', programs: { basis: program }, logs, history, week: 1, day: 'A'
  };
  context.PROG = () => program;

  assert.equal(context.historyMarksComplete(history, 1, 'A'), true);
  assert.equal(context.unitComplete(1, 'A'), true);
  assert.equal(context.weekFrac(1), 1);
  assert.equal(context.dayStatus(program.days[0]).complete, true);
  program.days.push({ key: 'B', wd: 'Mittwoch', ex: [] });
  context.S.day = 'B';
  context.weekLayout = () => program.days;
  assert.deepEqual(Array.from(context.skippedBeforeSelection()), []);
  program.days.pop();
  context.S.day = 'A';

  history[0].complete = false;
  assert.equal(context.historyMarksComplete(history, 1, 'A'), false);
  assert.equal(context.unitComplete(1, 'A'), false);
  assert.equal(context.weekFrac(1) < 1, true);
  assert.equal(context.dayStatus(program.days[0]).complete, false);
});

test('derives the current training week from begun and completed units', () => {
  const context = appContext();
  const program = blockProgram();
  assert.equal(context.currentTrainingWeekFor(program, { logs: {}, history: [] }), 1);
  assert.equal(context.currentTrainingWeekFor(program, {
    logs: {},
    history: [{ week: 1, day: 'A', complete: true }]
  }), 2);
  assert.equal(context.currentTrainingWeekFor(program, {
    logs: { '3|A|squat': { sets: [{ reps: '5', weight: '50' }] } },
    history: [{ week: 1, day: 'A', complete: true }]
  }), 3);
});

test('creates incrementing follow-up names and never truncates the block suffix', () => {
  const context = appContext();
  assert.equal(context.followupBlockName('Kraftbasis', {
    basis: { name: 'Kraftbasis' }
  }), 'Kraftbasis · Block 2');
  assert.equal(context.followupBlockName('Kraftbasis · Block 2', {
    basis: { name: 'Kraftbasis' },
    block2: { name: 'Kraftbasis · Block 2' },
    block3: { name: 'Kraftbasis · Block 3' }
  }), 'Kraftbasis · Block 4');

  const longName = context.followupBlockName('Ein außergewöhnlich langes Kraftprogramm', {});
  assert.equal(longName.length <= 30, true);
  assert.match(longName, / · Block 2$/);
  assert.equal(context.programNameWithSuffix('Sehr langer Basisname', ' · Block 12').endsWith(' · Block 12'), true);
});

test('builds a fresh follow-up program from the last non-deload work and leaves the source untouched', () => {
  const context = appContext();
  const source = blockProgram();
  const logs = completeLogs(source);
  delete logs['1|A|row'];
  delete logs['2|A|row'];
  const sourceSnapshot = JSON.stringify(source);
  const programs = { basis: source };
  const next = context.buildFollowupProgram(source, { logs }, programs, Date.UTC(2026, 6, 16));

  assert.notEqual(next, source);
  assert.notEqual(next.id, source.id);
  assert.equal(typeof next.id, 'string');
  assert.equal(next.parent, 'basis');
  assert.equal(next.name, 'Kraftbasis · Block 2');
  assert.notEqual(next.archived, true);
  assert.equal(next.days[0].ex[0].def, 85, 'oberes Wiederholungsziel erhöht 82,5 kg um 2,5 kg');
  assert.equal(next.days[0].ex[1].def, 40, 'ohne belastbare Daten bleibt das Startgewicht erhalten');
  assert.equal(next.days[0].ex[2].target, 'sauber', 'reine Wiederholungsübungen bleiben unverändert');
  assert.equal(JSON.stringify(source), sourceSnapshot);

  next.days[0].ex[0].name = 'Geändert';
  assert.equal(source.days[0].ex[0].name, 'Kniebeuge', 'Folgeblock muss eine tiefe Kopie sein');
});

test('follow-up blocks keep only exercises active at the end of the block', () => {
  const context = appContext();
  const source = blockProgram();
  source.days[0].ex[0].untilWeek = 2;
  source.days[0].ex[1].fromWeek = 3;
  source.days[0].ex[1].prevId = 'squat';
  const next = context.buildFollowupProgram(source, { logs: completeLogs(source) }, { basis: source });
  assert.deepEqual(Array.from(next.days[0].ex, ex => ex.id), ['row', 'push']);
  assert.equal(next.days[0].ex[0].fromWeek, undefined);
  assert.equal(next.days[0].ex[0].prevId, undefined);
});

test('activates a fresh follow-up block while archiving the source with all progress intact', () => {
  const context = appContext();
  const source = blockProgram();
  const sourceStore = {
    tg: {}, barw: {}, notes: {}, logs: completeLogs(source),
    history: [{ week: 1, day: 'A', complete: true, start: 1, dur: 100 }],
    workout: null, week: 3, day: 'A', blockCelebrated: true
  };
  const sourceStoreSnapshot = JSON.stringify(sourceStore);
  const state = {
    active: 'basis',
    programs: { basis: source },
    store: { basis: sourceStore },
    tg: sourceStore.tg,
    barw: sourceStore.barw,
    notes: sourceStore.notes,
    logs: sourceStore.logs,
    history: sourceStore.history,
    workout: null,
    week: 3,
    day: 'A',
    blockCelebrated: true
  };
  context.S = state;
  context.programWriteLocked = () => false;
  context.buildFollowupProgram = () => {
    const next = JSON.parse(JSON.stringify(source));
    next.id = 'block2';
    next.name = 'Kraftbasis · Block 2';
    next.parent = 'basis';
    delete next.archived;
    return next;
  };
  context.newStore = () => ({
    tg: {}, barw: {}, notes: {}, logs: {}, history: [], workout: null,
    week: 1, day: 'A', blockCelebrated: false
  });
  context.setActive = id => {
    state.active = id;
    return true;
  };
  context.save = context.flushSave = context.renderView = context.renderBar = context.renderLib = context.closeLib = () => {};
  context.showModal = () => {};

  context.createFollowupBlock('basis');

  assert.equal(state.programs.basis.archived, true);
  assert.equal(JSON.stringify(state.store.basis), sourceStoreSnapshot);
  assert.equal(state.store.basis.logs['2|A|squat'].sets[0].weight, '82.5');
  assert.equal(state.programs.block2.parent, 'basis');
  assert.equal(state.store.block2.history.length, 0);
  assert.equal(state.store.block2.blockCelebrated, false);
  assert.equal(state.active, 'block2');
});

test('shows block success exactly once and persists only the celebration marker', () => {
  const context = appContext();
  const program = blockProgram();
  const logs = completeLogs(program);
  const store = {
    tg: {}, barw: {}, notes: {}, logs,
    history: program.weeks.map((_, index) => ({
      week: index + 1, day: 'A', complete: true, start: 1000 + index, dur: 600
    })),
    workout: null, week: 3, day: 'A', blockCelebrated: false
  };
  context.S = {
    active: 'basis', programs: { basis: program }, store: { basis: store },
    tg: store.tg, barw: store.barw, notes: store.notes, logs: store.logs,
    history: store.history, workout: null, week: 3, day: 'A', blockCelebrated: false
  };
  const modals = [];
  context.showModal = (title, message, actions) => modals.push({ title, message, actions });
  context.save = context.flushSave = context.renderView = context.renderBar = context.renderLib = () => {};
  context.openReport = context.createFollowupBlock = () => {};
  context.esc = value => String(value == null ? '' : value);

  context.maybeShowBlockSuccess('basis');
  context.maybeShowBlockSuccess('basis');

  assert.equal(modals.length, 1);
  assert.equal(store.blockCelebrated, true);
  assert.equal(context.S.blockCelebrated, true);
  assert.match(`${modals[0].title} ${modals[0].message}`, /Glückwunsch|geschafft/i);
  assert.match(modals[0].message, /Kniebeuge|Verbesserung/i);
  assert.deepEqual(Array.from(modals[0].actions, action => action.label), [
    'Folgeblock starten', 'Auswertung ansehen', 'Später'
  ]);
  assert.match(functionSource('stopWorkout'), /continuePostWorkoutFlow\(/);
  assert.match(functionSource('continuePostWorkoutFlow'), /showNextPostWorkoutSwapDecision\(\).*maybeShowBlockSuccess\(programId\)/s);
  assert.match(functionSource('newStore'), /blockCelebrated:false/);
  assert.match(functionSource('syncStore'), /blockCelebrated:S\.blockCelebrated===true/);
});

test('celebrates a frozen block even when the current plan has a later exercise', () => {
  const context = appContext();
  const program = blockProgram();
  const logs = completeLogs(program);
  const history = program.weeks.map((_, index) => ({
    week: index + 1, day: 'A', complete: true, start: 1000 + index, dur: 600
  }));
  program.days[0].ex.push({
    id: 'later', name: 'Später ergänzt', cat: 'strength', w: false, unit: 'reps'
  });
  const store = {
    tg: {}, barw: {}, notes: {}, logs, history,
    workout: null, week: 3, day: 'A', blockCelebrated: false
  };
  context.S = {
    active: 'basis', programs: { basis: program }, store: { basis: store },
    tg: store.tg, barw: store.barw, notes: store.notes, logs,
    history, workout: null, week: 3, day: 'A', blockCelebrated: false
  };
  const modals = [];
  context.showModal = (title, message, actions) => modals.push({ title, message, actions });
  context.save = context.flushSave = () => {};
  context.openReport = context.createFollowupBlock = () => {};
  context.esc = value => String(value == null ? '' : value);

  assert.equal(context.maybeShowBlockSuccess('basis'), true);
  assert.equal(context.maybeShowBlockSuccess('basis'), false);
  assert.equal(modals.length, 1);
});

test('separates archived programs, exposes read-only actions and blocks stale activation/edit paths', () => {
  const context = appContext();
  const active = blockProgram();
  active.createdAt = Date.UTC(2026, 6, 15, 12);
  active.updatedAt = Date.UTC(2026, 6, 16, 12);
  const other = Object.assign({}, blockProgram(), { id: 'other', name: 'Noch offen' });
  const archived = Object.assign({}, blockProgram(), { id: 'old', name: 'Alter Block', archived: true });
  const activeStore = { logs: completeLogs(active), history: [], tg: {}, barw: {}, notes: {}, workout: null, week: 1, day: 'A', blockCelebrated: false };
  const library = { innerHTML: '', classList: { contains: () => true } };
  context.S = {
    active: 'basis', programs: { basis: active, other, old: archived },
    store: { basis: activeStore, other: { logs: {} }, old: { logs: completeLogs(archived) } },
    tg: activeStore.tg, barw: activeStore.barw, notes: activeStore.notes,
    logs: activeStore.logs, history: activeStore.history, workout: null, week: 1, day: 'A', blockCelebrated: false
  };
  context.document = { getElementById: id => id === 'lib' ? library : null };
  context.programWriteLocked = () => false;
  context.themeButtonHtml = context.backupReminderHtml = context.icon = () => '';
  context.backupStatusText = () => 'Keine Sicherung';
  context.esc = context.attr = value => String(value == null ? '' : value);

  context.renderLib();
  assert.match(library.innerHTML, /Weitere Programme \(1\)/);
  assert.match(library.innerHTML, /Archiv \(1\)/);

  const archivedCard = context.programItemHtml('old', archived);
  assert.match(archivedCard, /Auswertung ansehen/);
  assert.match(archivedCard, /Aus dem Archiv holen/);
  assert.doesNotMatch(archivedCard, /data-sel=/);
  assert.doesNotMatch(archivedCard, /data-edit=/);

  const activeCard = context.programItemHtml('basis', active);
  assert.match(activeCard, /Abgeschlossen/);
  assert.doesNotMatch(activeCard, /Absolviert/);
  const programNameEnd = activeCard.indexOf('</div>', activeCard.indexOf('class="pn"'));
  const programActionsStart = activeCard.indexOf('class="progactions"');
  const secondaryMeta = activeCard.slice(programNameEnd, programActionsStart);
  assert.match(secondaryMeta, /1 Tag(?:e)? · 3 Wochen/);
  assert.match(secondaryMeta, /16\.07\.2026/);
  assert.doesNotMatch(secondaryMeta, /15\.07\.2026/);
  assert.match(secondaryMeta, /Abgeschlossen/);

  const copyWithoutUpdate = Object.assign({}, other, { createdAt: Date.UTC(2026, 6, 14, 12) });
  const copyCard = context.programItemHtml('other', copyWithoutUpdate);
  assert.match(copyCard, /14\.07\.2026/);

  const legacyCard = context.programItemHtml('other', other);
  assert.doesNotMatch(legacyCard, /Invalid Date|01\.01\.1970/);

  const programMetaCss = html.match(/\.progitem \.pm\{([^}]*)\}/);
  assert.ok(programMetaCss, 'Metazeile der Programmkarte fehlt');
  assert.match(programMetaCss[1], /display:flex/);
  const programDateCss = html.match(/\.programdate\{([^}]*)\}/);
  assert.ok(programDateCss, 'Datumsregel der Programmkarte fehlt');
  assert.match(programDateCss[1], /margin-left:auto/);
  assert.equal(context.setActive('old'), false);
  assert.equal(context.S.active, 'basis');
  assert.match(functionSource('openProgramEditor'), /archived/);
  assert.match(html, /data-archive=/);
  assert.match(html, /data-unarchive=/);
  assert.match(html, /function archiveProgram\(/);
  assert.match(html, /function unarchiveProgram\(/);
});

test('connects archived parent data to the existing exercise report without exporting internal links', () => {
  assert.match(html, /function previousBlockMetrics\(/);
  assert.match(functionSource('buildReport'), /previousBlockMetrics/);
  assert.match(functionSource('reportExerciseCard'), /Vorblock:/);
  const exportSource = functionSource('exportTranslate');
  assert.doesNotMatch(exportSource, /(?:archived|parent)\s*:/);
});
