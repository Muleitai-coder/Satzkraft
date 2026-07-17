const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');

test('shows the protected-journal guide once and uses all four intent labels', () => {
  for (const text of [
    'Neu: Dein Trainingstagebuch ist geschützt',
    'Abgeschlossene Trainings bleiben genau so, wie du sie trainiert hast.',
    'Zahlen ausbessern geht weiterhin jederzeit – über ‚Werte korrigieren‘.',
    'Trainiert und wiederholt wird vorne – in deiner aktuellen Woche, Nachholen aus der Vorwoche inklusive.',
    'Änderungen an deinem Plan gelten ab jetzt und lassen Vergangenes unverändert. Alles andere bleibt, wie du es kennst.',
    'Diese Einheit ist Teil deines Protokolls.',
    'Werte korrigieren',
    'Training wiederholen (ersetzt die letzte Einheit)',
    'Übung nur heute tauschen',
    'Ab jetzt ersetzen'
  ]) assert.match(html, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(html, /if\(active\(\)\|\|S\.zonesIntroSeen===true\)return false/);
  assert.match(html, /S\.zonesIntroSeen=true;flushSave\(\)/);
  assert.match(html, /else if\(!loadIssueText&&!active\(\)&&!pendingProgramImport&&!S\.zonesIntroSeen\)/);
});

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
    APP_VERSION: 'test',
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
    categories: { kraft: { label: 'Kraft', reps: { aufbau: [5, 8] } } },
    weeks: [{ n: 1, phase: 'aufbau', label: 'Aufbau', sets: { kraft: 1 } }],
    days: [{
      key: 'A', wd: 'Montag', title: 'Drücken', ex: [
        { id: 'bench', name: 'Bankdrücken', cat: 'kraft', w: true, unit: 'reps' },
        { id: 'row', name: 'Rudern', cat: 'kraft', w: true, unit: 'reps' }
      ]
    }]
  };
}

function repeatDialogContext(extraLogs) {
  const program = programFixture();
  program.weeks.push({ n: 2, phase: 'aufbau', label: 'Aufbau', sets: { kraft: 1 } });
  const modalCalls = [];
  const context = appContext();
  context.S = {
    active: 'basis', programs: { basis: program }, week: 1, day: 'A',
    logs: extraLogs || {}, history: [{ week: 1, day: 'A', complete: true }],
    workout: null
  };
  context.PROG = () => program;
  context.showModal = (title, message, actions) => modalCalls.push({ title, message, actions });
  context.icon = () => '';
  return { context, modalCalls, program };
}

test('warnt beim Wiederholen nur vor betroffenen späteren Empfehlungen', () => {
  const withoutLater = repeatDialogContext();
  withoutLater.context.startWorkout();
  assert.equal(withoutLater.modalCalls.length, 1);
  assert.match(withoutLater.modalCalls[0].message, /Alle eingetragenen Satzwerte/);
  assert.doesNotMatch(withoutLater.modalCalls[0].message, /Empfehlungen der folgenden Wochen/);

  const sameDay = repeatDialogContext({
    '2|A|bench': { sets: [{ reps: '8', weight: '80' }] }
  });
  sameDay.context.startWorkout();
  assert.match(sameDay.modalCalls[0].message, /Empfehlungen der folgenden Wochen werden aus den neuen Werten neu berechnet/);
  assert.match(sameDay.modalCalls[0].message, /Deine eingetragenen Werte bleiben unverändert/);

  const unrelated = repeatDialogContext({
    '2|B|bench': { sets: [{ reps: '8', weight: '80' }] },
    '2|A|row': { sets: [{ reps: '8', weight: '80' }], swap: 'Kabelrudern' }
  });
  unrelated.context.startWorkout();
  assert.doesNotMatch(unrelated.modalCalls[0].message, /Empfehlungen der folgenden Wochen/);
});

test('behandelt eingefrorene Einheiten in Dialog und Startleiste als wiederholbar', () => {
  const { context, modalCalls, program } = repeatDialogContext();
  program.days[0].ex.push({
    id: 'later', name: 'Später ergänzt', cat: 'kraft', w: false, unit: 'reps'
  });
  const bar = { innerHTML: '', classList: { remove() {} } };
  context.document = {
    body: { classList: { remove() {} } },
    getElementById: id => id === 'bar' ? bar : null
  };

  context.startWorkout();
  context.renderBar();

  assert.equal(modalCalls.length, 1);
  assert.match(modalCalls[0].title, /Training wiederholen/);
  assert.match(bar.innerHTML, /Training wiederholen/);
});

test('setzt einen heutigen Übungstausch samt passender Vormerkung zurück', () => {
  const program = programFixture();
  const exercise = program.days[0].ex[0];
  const otherRequest = { programId: 'basis', day: 'A', exId: 'row', name: 'Kabelrudern' };
  const context = appContext();
  context.S = {
    active: 'basis', programs: { basis: program }, week: 1, day: 'A',
    logs: {
      '1|A|bench': { sets: [{ reps: '', weight: '' }], swap: 'Brustpresse', swapWeight: '55' }
    },
    workout: {
      running: true,
      pendingReplacements: [
        { programId: 'basis', day: 'A', exId: 'bench', name: 'Brustpresse' },
        otherRequest
      ]
    }
  };
  context.PROG = () => program;
  context.setsForExercise = () => 1;
  context.active = () => true;
  context.save = context.renderView = () => {};

  assert.equal(typeof context.clearExerciseSwapForToday, 'function');
  assert.equal(context.clearExerciseSwapForToday(exercise), true);

  const cell = context.S.logs['1|A|bench'] || {};
  assert.equal(cell.swap, undefined);
  assert.equal(cell.swapWeight, undefined);
  assert.deepEqual(
    Array.from(context.S.workout.pendingReplacements, request => ({ ...request })),
    [otherRequest],
    'nur die Vormerkung der zurückgesetzten Übung darf entfernt werden'
  );
});

test('verweigert das Zurücksetzen eines Übungstauschs nach der ersten Satzeingabe', () => {
  const program = programFixture();
  const exercise = program.days[0].ex[0];
  const pending = { programId: 'basis', day: 'A', exId: 'bench', name: 'Brustpresse' };
  const context = appContext();
  context.S = {
    active: 'basis', programs: { basis: program }, week: 1, day: 'A',
    logs: {
      '1|A|bench': { sets: [{ reps: '10', weight: '55' }], swap: 'Brustpresse', swapWeight: '55' }
    },
    workout: { running: true, pendingReplacements: [pending] }
  };
  context.PROG = () => program;
  context.setsForExercise = () => 1;
  context.active = () => true;
  context.save = context.renderView = () => {};

  assert.equal(context.clearExerciseSwapForToday(exercise), false);
  assert.equal(context.S.logs['1|A|bench'].swap, 'Brustpresse');
  assert.equal(context.S.logs['1|A|bench'].swapWeight, '55');
  assert.deepEqual(
    Array.from(context.S.workout.pendingReplacements, request => ({ ...request })),
    [pending]
  );
});

test('berechnet das mathematische Gewicht pro Seite ohne Scheibenannahmen', () => {
  const context = appContext();
  const result = context.calculatePlateLoad(180, 20);

  assert.equal(result.side, 80);
  assert.equal(result.below, false);
  assert.equal(result.plates, undefined, 'verfügbare Scheiben unterscheiden sich je nach Studio');
});

test('zeigt ausschließlich die Stangenauswahl 10, 15 und 20 kg', () => {
  const context = appContext();
  context.S = { barw: {} };
  context.targetWeight = () => 80;
  const output = context.plateCalculatorHtml({ id: 'bench', w: true });
  const labels = [...output.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)]
    .map(match => match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());

  assert.deepEqual(labels, ['10 kg', '15 kg', '20 kg']);
  assert.doesNotMatch(output, /Anderes|Eigenes Stangengewicht|data-plate-custom/i);
  assert.match(output, /30 kg pro Seite/);
});

test('aktualisiert und speichert nur ein Standard-Stangengewicht', () => {
  const exercise = { id: 'bench', w: true };
  let saves = 0;
  let opens = 0;
  const context = appContext({
    S: { barw: {} },
    findEx: id => id === exercise.id ? exercise : null,
    save: () => { saves++; },
    showPlateCalculator: () => { opens++; }
  });

  context.selectPlateBar('bench', '15');
  assert.equal(context.S.barw.bench, 15);
  assert.equal(saves, 1);
  assert.equal(opens, 1);

  context.selectPlateBar('bench', '12.5');
  assert.equal(context.S.barw.bench, 15);
  assert.equal(saves, 1, 'ein eigenes Stangengewicht darf nicht gespeichert werden');
  assert.equal(opens, 1);
});

test('zeigt im Protokoll Original und Ersatz sowie vorhandene Notizen direkt inline', () => {
  const program = programFixture();
  const context = appContext({
    dDate: () => '16.07.2026',
    reportDuration: () => '10 min',
    fmtSeconds: seconds => `${seconds} Sek`
  });
  const logs = {
    '1|A|bench': { sets: [{ reps: '10', weight: '55' }], swap: 'Brustpresse' }
  };
  const history = [{ week: 1, day: 'A', start: 1, dur: 600, complete: true }];
  const withNote = context.reportDetailedProtocol(program, logs, history, {
    bench: 'Sitzhöhe 4 · Schulterblätter fixieren'
  });
  const withoutNote = context.reportDetailedProtocol(program, logs, history, {});

  assert.match(withNote, /Bankdrücken[\s\S]*→[\s\S]*Brustpresse/);
  assert.match(withNote, /class="[^"]*rprotocolnote[^"]*"[\s\S]*Sitzhöhe 4 · Schulterblätter fixieren/);
  assert.doesNotMatch(withNote, /<details[^>]*class="[^"]*rprotocolnote/i);
  assert.doesNotMatch(withNote, /<summary[^>]*>[\s\S]*Notiz/i);
  assert.match(withNote, /Sitzhöhe 4 · Schulterblätter fixieren/);
  assert.doesNotMatch(withoutNote, /class="[^"]*rprotocolnote[^"]*"/i);
  assert.match(
    html,
    /reportDetailedProtocol\(\s*program\s*,\s*store\.logs\s*,\s*store\.history\s*,\s*store\.notes\s*\)/,
    'die gespeicherten Übungsnotizen müssen an das echte Protokoll übergeben werden'
  );
});

test('hält die kompakte Vorgabezeile scharf, kurz und zugänglich', () => {
  const prescRule = html.match(/\.presc\{([^}]*)\}/);
  assert.ok(prescRule, '.presc-Regel fehlt');
  assert.doesNotMatch(prescRule[1], /mask-image/, 'die Vorgabezeile darf rechts nicht künstlich ausgeblendet werden');

  const source = functionSource('exCardHtml');
  const start = source.indexOf("h+='<div class=\"presc\"");
  const end = source.indexOf('if(ex.w&&!ex.bw', start);
  assert.ok(start >= 0 && end > start, 'Vorgabezeile in exCardHtml wurde nicht gefunden');
  const prescriptionSource = source.slice(start, end);
  assert.match(prescriptionSource, /icon\(["']timer["']\)/, 'die Satzpause braucht das Timer-Symbol');
  assert.doesNotMatch(prescriptionSource, />Pause\s/, 'das ausgeschriebene Wort Pause kostet unnötig Platz');
});

test('richtet den Kalibrierhinweis links aus', () => {
  const calibrationIsLeftAligned = [
    /\.calibrationhint\s*\{[^}]*text-align\s*:\s*left/i,
    /\.editnote\s*\[id\^=["']calib-["']\]\s*\{[^}]*text-align\s*:\s*left/i,
    /\[id\^=["']calib-["']\]\s*\{[^}]*text-align\s*:\s*left/i
  ].some(pattern => pattern.test(html));

  assert.equal(calibrationIsLeftAligned, true);
});

test('reserviert einen kompakten Iconplatz für das Einklappen ohne Layoutsprung', () => {
  const source = functionSource('exCardHtml');
  const marker = source.indexOf('data-collapse-done');
  assert.ok(marker >= 0, 'Einklapp-Aktion fehlt');
  const fragment = source.slice(Math.max(0, marker - 260), marker + 520);

  assert.match(fragment, /aria-label=[^>\n]*einklappen/i);
  assert.match(fragment, /icon\(["']chevron-(?:left|right)["']\)/);
  assert.doesNotMatch(fragment, />Einklappen<\/button>/);
  assert.doesNotMatch(fragment, /\shidden(?:[\s'"+>]|$)/, 'display:none darf den Platz nicht plötzlich entfernen');

  const cssRules = [...html.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(match => /collapse|exdoneactions|data-collapse-done/i.test(match[1]));
  assert.equal(
    cssRules.some(match => /(?:width|min-width|flex-basis)\s*:/i.test(match[2])),
    true,
    'der Einklapp-Iconplatz braucht eine feste Breite'
  );
  assert.equal(
    cssRules.some(match => /visibility\s*:\s*hidden|opacity\s*:\s*0/i.test(match[2])),
    true,
    'der reservierte Platz soll unsichtbar statt aus dem Layout entfernt werden'
  );
});

test('stellt Scroll-Anker auch nach zwei schnellen Kartenersetzungen wieder her', () => {
  const callbacks = [];
  const nodes = Object.create(null);
  const root = { style: { overflowAnchor: 'auto' } };
  const body = {
    style: { overflowAnchor: 'contain' },
    contains: node => Object.values(nodes).includes(node)
  };
  const makeCard = (id, before, after) => {
    const card = { id, getBoundingClientRect: () => ({ top: before }) };
    Object.defineProperty(card, 'outerHTML', {
      set() { nodes[id] = { id, getBoundingClientRect: () => ({ top: after }) }; }
    });
    nodes[id] = card;
    return card;
  };
  const context = appContext({
    cardViewportAnchorState: null,
    cardViewportAnchorVersion: 0,
    document: {
      documentElement: root,
      body,
      activeElement: null,
      getElementById: id => nodes[id]
    },
    window: {
      requestAnimationFrame(callback) { callbacks.push(callback); return callbacks.length; },
      scrollBy() {}
    }
  });
  const first = makeCard('card-first', 100, 92);
  const second = makeCard('card-second', 220, 205);

  context.replaceCardKeepingViewport(first, '<div></div>', first);
  context.replaceCardKeepingViewport(second, '<div></div>', second);
  assert.equal(root.style.overflowAnchor, 'none');
  assert.equal(body.style.overflowAnchor, 'none');

  callbacks.forEach(callback => callback());
  assert.equal(root.style.overflowAnchor, 'auto');
  assert.equal(body.style.overflowAnchor, 'contain');
});
