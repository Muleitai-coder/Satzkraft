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

function coachPreferencesContext() {
  const start = html.indexOf('// ---------- KI-Coach (Beta): Klick-Wizard ----------');
  const end = html.indexOf('var VAGUE_RE', start);
  assert.ok(start >= 0 && end > start, 'KI-Coach-Einstellungen wurden nicht gefunden');
  const storage = new Map();
  const context = {
    localStorage: {
      getItem: key => storage.has(key) ? storage.get(key) : null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key)
    }
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);
  return { context, storage };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('stores versioned coach answers under a dedicated localStorage key', () => {
  const { context, storage } = coachPreferencesContext();
  assert.match(html, /(?:var|const) COACH_PREFS_KEY="satzkraft-coach-prefs"/);
  assert.match(html, /(?:var|const) COACH_PREFS_VERSION=1/);

  context.coachAns = {
    stil: 'Gym / Gewichte',
    ziel: 'Muskelaufbau',
    limits: ['Schulter'],
    extra: 'Mehr Fokus auf den oberen Rücken'
  };
  const saved = context.saveCoachPreferences();

  assert.equal(saved, true);
  const payload = JSON.parse(storage.get('satzkraft-coach-prefs'));
  assert.equal(payload.version, 1);
  assert.deepEqual(payload.answers, {
    stil: 'Gym / Gewichte',
    ziel: 'Muskelaufbau',
    limits: ['Schulter'],
    extra: 'Mehr Fokus auf den oberen Rücken'
  });
  assert.deepEqual(plain(context.loadCoachPreferences()), payload.answers);
});

test('sanitizes saved answers exclusively against the current coach steps', () => {
  const { context, storage } = coachPreferencesContext();
  const sanitized = plain(context.sanitizeCoachAnswers({
    stil: 'Gym / Gewichte',
    ziel: 'Nicht erlaubtes Ziel',
    limits: ['Schulter', 'Schulter', 'Unbekannt'],
    wtage: 'Mo',
    extra: `  ${'x'.repeat(700)}  `,
    injected: '<script>alert(1)</script>'
  }));

  assert.equal(sanitized.stil, 'Gym / Gewichte');
  assert.deepEqual(sanitized.limits, ['Schulter']);
  assert.equal(Object.hasOwn(sanitized, 'ziel'), false);
  assert.equal(Object.hasOwn(sanitized, 'wtage'), false, 'Mehrfachauswahl braucht eine Liste');
  assert.equal(Object.hasOwn(sanitized, 'injected'), false);
  assert.equal(sanitized.extra.length, 500);

  storage.set('satzkraft-coach-prefs', '{kaputt');
  assert.deepEqual(plain(context.loadCoachPreferences() || {}), {});
  storage.set('satzkraft-coach-prefs', JSON.stringify({ version: 999, answers: { stil: 'Gym / Gewichte' } }));
  assert.deepEqual(plain(context.loadCoachPreferences() || {}), {}, 'fremde Versionen dürfen nicht übernommen werden');

  context.clearCoachPreferences();
  assert.equal(storage.has('satzkraft-coach-prefs'), false);
});

test('offers an explicit reuse choice and persists answers on every wizard exit', () => {
  assert.match(html, /Antworten vom letzten Mal übernehmen\?/);
  assert.match(html, /id="coachreuse"[^>]*>Übernehmen<\/button>/);
  assert.match(html, /id="coachnew"[^>]*>Neu starten<\/button>/);

  const eventsStart = html.indexOf('document.getElementById("lib").addEventListener("click"');
  const eventsEnd = html.indexOf('document.getElementById("lib").addEventListener("toggle"', eventsStart);
  assert.ok(eventsStart >= 0 && eventsEnd > eventsStart, 'Programmverwaltungs-Ereignisse wurden nicht gefunden');
  const events = html.slice(eventsStart, eventsEnd);
  const openBranch = events.slice(events.indexOf('if(b.id==="coachbtn")'), events.indexOf('if(b.id==="coachback")'));
  const backBranch = events.slice(events.indexOf('if(b.id==="coachback")'), events.indexOf('if(b.dataset.opt)'));
  const reuseBranch = events.slice(events.indexOf('if(b.id==="coachreuse")'), events.indexOf('if(b.dataset.opt)'));

  assert.match(openBranch, /coachStart|coachOpen|openCoach/);
  assert.doesNotMatch(openBranch, /coachReset\(\);renderCoach\(\)/, 'Öffnen darf gespeicherte Antworten nicht sofort verwerfen');
  assert.match(backBranch, /saveCoachPreferences|coachAbort|coachExit/);
  assert.match(reuseBranch, /loadCoachPreferences/);
  assert.match(reuseBranch, /clearCoachPreferences/);

  const closeSource = functionSource('closeLib');
  assert.match(closeSource, /saveCoachPreferences|coachAbort|coachExit/, 'Schließen über X muss Wizard-Antworten sichern');
});

test('marks coach imports internally, saves their answers and keeps source out of single-program exports', () => {
  let saveCoachPreferencesCalls = 0;
  const context = {
    pendingProgramImport: {
      origin: 'coach',
      program: { id: 'incoming', name: 'Coach-Plan', categories: {}, weeks: [], days: [] }
    },
    importIssue: null,
    S: { programs: {}, store: {} },
    programWriteLocked: () => false,
    cloneJSON: value => JSON.parse(JSON.stringify(value)),
    genId: () => 'coach-plan',
    genProgramCode: () => 'sk-coach1',
    newStore: () => ({}),
    flushSave() {},
    renderLib() {},
    showModal() {},
    esc: value => String(value),
    saveCoachPreferences: () => { saveCoachPreferencesCalls++; }
  };
  vm.createContext(context);
  vm.runInContext(functionSource('storeImportedProgram'), context);
  context.storeImportedProgram(false, false);

  assert.equal(context.S.programs['coach-plan'].source, 'coach');
  assert.equal(saveCoachPreferencesCalls, 1);

  const exportContext = { ANLEITUNG: {} };
  vm.createContext(exportContext);
  vm.runInContext(functionSource('exportTranslate'), exportContext);
  const exported = plain(exportContext.exportTranslate({
    source: 'coach',
    name: 'Coach-Plan',
    categories: {},
    weeks: [],
    days: []
  }));
  assert.equal(Object.hasOwn(exported, 'source'), false);
});

test('adds coach replanning only to the success modal of a coach program', () => {
  let buttons;
  const program = { id: 'coach-plan', name: 'Coach-Plan', source: 'coach' };
  const store = { logs: {}, history: [], blockCelebrated: false };
  const context = {
    S: {
      active: 'coach-plan',
      programs: { 'coach-plan': program },
      store: { 'coach-plan': store },
      blockCelebrated: false
    },
    programBlockComplete: () => true,
    flushSave() {},
    buildReportData: () => ({ completedSessions: 4, totalDuration: 3600, exercises: [] }),
    topBlockImprovements: () => [],
    esc: value => String(value),
    reportDuration: () => '1 Std',
    fmtSeconds: value => `${value} Sek`,
    reportNumber: value => String(value),
    reportMetricUnit: () => 'kg',
    showModal: (_title, _message, actions) => { buttons = actions; }
  };
  vm.createContext(context);
  vm.runInContext(functionSource('maybeShowBlockSuccess'), context);

  assert.equal(context.maybeShowBlockSuccess('coach-plan'), true);
  assert.ok(buttons.some(button => button.label === 'Mit KI-Coach neu planen'));

  store.blockCelebrated = false;
  delete program.source;
  context.maybeShowBlockSuccess('coach-plan');
  assert.equal(buttons.some(button => button.label === 'Mit KI-Coach neu planen'), false);
});
