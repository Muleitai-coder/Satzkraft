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

function coachPreferencesContext(sharedStorage) {
  const start = html.indexOf('// ---------- KI-Coach (Beta): Klick-Wizard ----------');
  const end = html.indexOf('var VAGUE_RE', start);
  assert.ok(start >= 0 && end > start, 'KI-Coach-Einstellungen wurden nicht gefunden');
  const storage = sharedStorage || new Map();
  let storageHandler = null;
  const context = {
    localStorage: {
      getItem: key => storage.has(key) ? storage.get(key) : null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key)
    },
    window: {
      addEventListener: (type, handler) => {
        if (type === 'storage') storageHandler = handler;
      }
    },
    renderCoach() {},
    showModal() {}
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);
  return {
    context,
    storage,
    dispatchStorage: event => {
      assert.equal(typeof storageHandler, 'function');
      storageHandler(event);
    }
  };
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

  const noComplaint = plain(context.sanitizeCoachAnswers({ limits: ['Keine'], severity: 'Stark' }));
  assert.deepEqual(noComplaint.limits, ['Keine']);
  assert.equal(Object.hasOwn(noComplaint, 'severity'), false, 'verdeckte Beschwerdestärke darf nicht gespeichert bleiben');

  storage.set('satzkraft-coach-prefs', '{kaputt');
  assert.deepEqual(plain(context.loadCoachPreferences() || {}), {});
  storage.set('satzkraft-coach-prefs', JSON.stringify({ version: 999, answers: { stil: 'Gym / Gewichte' } }));
  assert.deepEqual(plain(context.loadCoachPreferences() || {}), {}, 'fremde Versionen dürfen nicht übernommen werden');

  context.clearCoachPreferences();
  assert.equal(storage.has('satzkraft-coach-prefs'), false);
});

test('requires a fresh explicit choice before sending structured complaint data', () => {
  const { context, storage } = coachPreferencesContext();
  context.coachAns = {
    stil: 'Gym / Gewichte',
    ziel: 'Muskelaufbau',
    limits: ['Schulter'],
    severity: 'Mittel'
  };

  assert.equal(context.coachHasHealthAnswers(context.coachAns), true);
  context.coachHealthConsent = true;
  assert.equal(context.saveCoachPreferences(), true);
  const stored = JSON.parse(storage.get('satzkraft-coach-prefs'));
  assert.equal(Object.hasOwn(stored, 'consent'), false, 'die Sitzungsentscheidung darf nicht gespeichert werden');
  assert.equal(Object.hasOwn(stored.answers, 'consent'), false);

  context.coachRemoveHealthAnswers();
  assert.equal(Object.hasOwn(context.coachAns, 'limits'), false);
  assert.equal(Object.hasOwn(context.coachAns, 'severity'), false);
  assert.equal(context.coachHealthConsent, false);
  assert.equal(context.coachHasHealthAnswers(context.coachAns), false);
  vm.runInContext(functionSource('coachBrief'), context);
  assert.doesNotMatch(context.coachBrief(), /Beschwerden:/, 'entfernte Beschwerdeangaben dürfen auch nicht als „keine“ übertragen werden');

  assert.match(html, /id="coachhealthconsent"/);
  assert.match(html, /Ohne Beschwerdeangaben fortfahren/);
  assert.match(html, /An Anthropic senden &amp; Plan erstellen/);
  assert.match(html, /hasHealth&&!coachHealthConsent\?" disabled":""/);
  assert.match(functionSource('coachCreate'), /coachHasHealthAnswers\(coachAns\)&&!coachHealthConsent/);
  assert.match(functionSource('coachReset'), /coachHealthConsent=false/);
  assert.match(functionSource('coachSummary'), /COACH_STEPS\.filter\(stepVisible\)/);
});

test('starts no coach request until structured complaint data is explicitly approved', () => {
  let calls = 0;
  let renders = 0;
  let focused = 0;
  const context = {
    coachAns: { limits: ['Schulter'], severity: 'Mittel' },
    coachHealthConsent: false,
    coachHealthIssue: '',
    coachDaySelectionIssue: () => '',
    coachHasHealthAnswers: answers => answers.limits.some(value => value !== 'Keine'),
    COACH_STEPS: [],
    coachStep: 0,
    renderCoach: () => { renders++; },
    document: {
      getElementById: id => id === 'coachhealthconsent'
        ? { focus: () => { focused++; } }
        : null
    },
    coachBusy: false,
    coachErr: 'old',
    coachProgram: 'old',
    coachProgObj: { old: true },
    coachDesc: 'old',
    coachRetried: true,
    coachVagueRetried: true,
    coachMsgs: [],
    coachBrief: () => 'privacy-checked brief',
    coachCall: () => { calls++; }
  };
  vm.createContext(context);
  vm.runInContext(functionSource('coachCreate'), context);

  context.coachCreate();
  assert.equal(calls, 0);
  assert.equal(context.coachBusy, false);
  assert.match(context.coachHealthIssue, /Bestätige die Übermittlung/);
  assert.equal(focused, 1);

  context.coachHealthConsent = true;
  context.coachCreate();
  assert.equal(calls, 1);
  assert.equal(context.coachBusy, true);
  assert.deepEqual(plain(context.coachMsgs), [{ role: 'user', content: 'privacy-checked brief' }]);
  assert.equal(renders, 2);
});

test('keeps the original briefing while compacting long coach conversations', () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(functionSource('coachMessagesForRequest'), context);
  const messages = [
    { role: 'user', content: 'ORIGINAL: Schulter, keine Langhantel' },
    { role: 'assistant', content: 'Plan 1' },
    { role: 'user', content: 'Änderung 1' },
    { role: 'assistant', content: 'Plan 2' },
    { role: 'user', content: 'Änderung 2' },
    { role: 'assistant', content: 'Plan 3' },
    { role: 'user', content: 'Änderung 3' },
    { role: 'assistant', content: 'Plan 4' },
    { role: 'user', content: 'Änderung 4' },
    { role: 'assistant', content: 'Plan 5' },
    { role: 'user', content: 'Aktuelle Änderung' }
  ];

  assert.deepEqual(plain(context.coachMessagesForRequest(messages)), [
    messages[0],
    messages[9],
    messages[10]
  ]);
  assert.match(functionSource('coachCall'), /coachMsgs=coachMessagesForRequest\(coachMsgs\)/);
});

test('ends a stalled coach request with a user-facing timeout', async () => {
  let timeoutCallback = null;
  let clears = 0;
  let renders = 0;
  const context = {
    coachMsgs: [{ role: 'user', content: 'Briefing' }],
    coachRequestSerial: 0,
    coachRequestController: null,
    coachSessionActive: true,
    coachBusy: true,
    coachErr: null,
    COACH_CLIENT_TIMEOUT_MS: 52000,
    AbortController,
    DOMException,
    JSON,
    setTimeout: callback => { timeoutCallback = callback; return 77; },
    clearTimeout: id => { if (id === 77) clears++; },
    fetch: (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    }),
    renderCoach: () => { renders++; }
  };
  vm.createContext(context);
  vm.runInContext(`${functionSource('coachMessagesForRequest')}\n${functionSource('coachCall')}`, context);

  context.coachCall();
  assert.equal(typeof timeoutCallback, 'function');
  timeoutCallback();
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(context.coachBusy, false);
  assert.match(context.coachErr, /zu lange gedauert/);
  assert.equal(context.coachErr.includes('Function mit deployed'), false);
  assert.equal(context.coachRequestController, null);
  assert.equal(clears, 1);
  assert.equal(renders, 1);
});

test('keeps the timeout message when response body parsing stalls', async () => {
  let timeoutCallback = null;
  let renders = 0;
  const context = {
    coachMsgs: [{ role: 'user', content: 'Briefing' }],
    coachRequestSerial: 0,
    coachRequestController: null,
    coachSessionActive: true,
    coachBusy: true,
    coachErr: null,
    COACH_CLIENT_TIMEOUT_MS: 52000,
    AbortController,
    DOMException,
    JSON,
    setTimeout: callback => { timeoutCallback = callback; return 78; },
    clearTimeout() {},
    fetch: async (_url, options) => ({
      status: 200,
      ok: true,
      json: () => new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
      })
    }),
    renderCoach: () => { renders++; }
  };
  vm.createContext(context);
  vm.runInContext(`${functionSource('coachMessagesForRequest')}\n${functionSource('coachCall')}`, context);

  context.coachCall();
  await new Promise(resolve => setImmediate(resolve));
  timeoutCallback();
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(context.coachBusy, false);
  assert.match(context.coachErr, /zu lange gedauert/);
  assert.equal(context.coachErr.includes('Ungültige Antwort'), false);
  assert.equal(renders, 1);
});

test('rejects a malformed successful coach response without an automatic retry', async () => {
  let calls = 0;
  let renders = 0;
  const context = {
    coachMsgs: [{ role: 'user', content: 'Briefing' }],
    coachRequestSerial: 0,
    coachRequestController: null,
    coachSessionActive: true,
    coachBusy: true,
    coachErr: null,
    COACH_CLIENT_TIMEOUT_MS: 52000,
    AbortController,
    JSON,
    setTimeout: () => 88,
    clearTimeout() {},
    fetch: async () => {
      calls++;
      return { status: 200, ok: true, json: async () => null };
    },
    renderCoach: () => { renders++; }
  };
  vm.createContext(context);
  vm.runInContext(`${functionSource('coachMessagesForRequest')}\n${functionSource('coachCall')}`, context);

  context.coachCall();
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(calls, 1);
  assert.equal(context.coachBusy, false);
  assert.match(context.coachErr, /Ungültige Antwort vom Server/);
  assert.equal(renders, 1);
});

test('announces asynchronous coach states and restores a logical focus target', () => {
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /id="coachstatus" role="status" aria-live="polite" tabindex="-1"/);
  assert.match(html, /id="coachstatus" role="alert" tabindex="-1"/);
  assert.match(functionSource('renderCoach'), /coachStatus\.focus\(\)/);
});

test('keeps tab focus inside a surface after focusing a live status', () => {
  let focused = '';
  let prevented = 0;
  const visible = { getBoundingClientRect: () => ({ width: 10, height: 10 }) };
  const first = { ...visible, focus: () => { focused = 'first'; } };
  const last = { ...visible, focus: () => { focused = 'last'; } };
  const status = { ...visible };
  const root = {
    querySelectorAll: () => [first, last],
    contains: element => element === first || element === last || element === status,
    focus: () => { focused = 'root'; }
  };
  const context = {
    document: { activeElement: status },
    getComputedStyle: () => ({ visibility: 'visible', display: 'block' })
  };
  vm.createContext(context);
  vm.runInContext(`${functionSource('surfaceFocusables')}\n${functionSource('trapSurfaceFocus')}`, context);

  context.trapSurfaceFocus({ shiftKey: false, preventDefault: () => { prevented++; } }, root);
  assert.equal(focused, 'first');
  context.document.activeElement = status;
  context.trapSurfaceFocus({ shiftKey: true, preventDefault: () => { prevented++; } }, root);
  assert.equal(focused, 'last');
  assert.equal(prevented, 2);
});

test('prevents another open tab from restoring deleted coach answers', () => {
  const storage = new Map();
  const deletingTab = coachPreferencesContext(storage);
  const staleTab = coachPreferencesContext(storage);
  staleTab.context.coachAns = {
    stil: 'Gym / Gewichte',
    ziel: 'Muskelaufbau',
    limits: ['Schulter'],
    severity: 'Mittel'
  };

  assert.equal(staleTab.context.saveCoachPreferences(), true);
  assert.equal(storage.has('satzkraft-coach-prefs'), true);
  assert.equal(deletingTab.context.clearCoachPreferences(), true);
  assert.equal(storage.has('satzkraft-coach-prefs'), false);

  assert.equal(staleTab.context.saveCoachPreferences(), false, 'der veraltete Tab muss schon vor seinem storage-Event blockiert werden');
  assert.equal(storage.has('satzkraft-coach-prefs'), false);

  const newGeneration = storage.get('satzkraft-coach-reset-v1');
  staleTab.dispatchStorage({ key: 'satzkraft-coach-reset-v1', newValue: newGeneration });
  assert.deepEqual(plain(staleTab.context.coachAns), {});
  assert.equal(staleTab.context.coachPrefsResetGeneration, newGeneration);
});

test('does not restore coach answers when another tab resets data during serialization', () => {
  let blocked = false;
  let writes = 0;
  const context = {
    coachAns: { limits: ['Schulter'], severity: 'Mittel' },
    sanitizeCoachAnswers: answers => answers,
    coachPreferencesWriteBlocked: () => blocked,
    COACH_PREFS_VERSION: 1,
    COACH_PREFS_KEY: 'satzkraft-coach-prefs',
    localStorage: { setItem: () => { writes++; } },
    JSON: {
      stringify: () => {
        blocked = true;
        return '{"serialized":true}';
      }
    },
    Object
  };
  vm.createContext(context);
  vm.runInContext(functionSource('saveCoachPreferences'), context);

  assert.equal(context.saveCoachPreferences(), false);
  assert.equal(writes, 0);
});

test('describes the complete coach data path before transmission', () => {
  assert.match(html, /Daten an KI übermitteln/);
  assert.match(html, /über Netlify an Anthropic \(Claude\)/);
  assert.match(html, /Technische Korrekturversuche und spätere Änderungswünsche/);
  assert.match(html, /keine übrigen Programme oder Trainingsprotokolle/);
  assert.match(html, /Beschwerden und ihrer Stärke für diese Coach-Sitzung/);
});

test('keeps coach frequency and exercise choices internally consistent', () => {
  const { context } = coachPreferencesContext();

  context.coachAns = { tage: '2×', wtage: ['Mo'] };
  assert.equal(context.coachDaySelectionIssue(), 'Wähle genau 2 Trainingstage oder „Egal“.');
  context.coachAns.wtage = ['Mo', 'Do'];
  assert.equal(context.coachDaySelectionIssue(), '');
  context.coachAns.wtage = ['Egal'];
  assert.equal(context.coachDaySelectionIssue(), '');

  context.coachAns = {
    likes: ['Kreuzheben', 'Bankdrücken'],
    dislikes: ['Keine']
  };
  context.coachReconcileExerciseChoice('dislikes', 'Schweres Heben vom Boden');
  assert.deepEqual(plain(context.coachAns.likes), ['Bankdrücken']);

  context.coachAns = {
    likes: ['Schulterdrücken'],
    dislikes: ['Überkopfdrücken', 'Dips']
  };
  context.coachReconcileExerciseChoice('likes', 'Schulterdrücken');
  assert.deepEqual(plain(context.coachAns.dislikes), ['Dips']);

  assert.match(html, /selectionIssue=st\.k==="wtage"\?coachDaySelectionIssue\(\):""/);
  assert.match(html, /if\(selectedNow\)coachReconcileExerciseChoice\(mst\.k,b\.dataset\.optm\)/);
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
