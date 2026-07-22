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
  for (let index = bodyStart; index < html.length; index++) {
    const char = html[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
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

function freshState() {
  return {
    schemaVersion: 4,
    programs: { default: { id: 'default', name: 'Ganzkörper 3×' } },
    active: 'default',
    store: {
      default: {
        tg: {}, barw: {}, notes: {}, logs: {}, history: [],
        workout: null, pendingReplacements: [], week: 1, day: 'A'
      }
    }
  };
}

function noticeContext(overrides) {
  const stored = {};
  const context = {
    REDESIGN_NOTICE_KEY: 'satzkraft-design-update-v1',
    stored,
    localStorage: {
      getItem: (key) => (key in stored ? stored[key] : null),
      setItem: (key, value) => { stored[key] = String(value); }
    },
    loadIssueText: '',
    pendingProgramImport: null,
    resumedPendingWorkoutSwaps: false,
    modalCalls: [],
    versionInfoCalls: 0,
    S: freshState(),
    active: () => false
  };
  context.showModal = (title, msg, btns) => context.modalCalls.push({ title, msg, btns });
  context.showVersionInfo = () => { context.versionInfoCalls++; };
  vm.createContext(context);
  for (const name of [
    'hasExistingTrainingData',
    'redesignNoticeSeen',
    'markRedesignNoticeSeen',
    'showRedesignNotice',
    'maybeShowRedesignNotice'
  ]) vm.runInContext(functionSource(name), context);
  Object.assign(context, overrides || {});
  return context;
}

test('der Start-Aufruf und der eigene Speicher-Schlüssel sind verdrahtet', () => {
  assert.match(html, /var REDESIGN_NOTICE_KEY="satzkraft-design-update-v1";/);
  assert.match(html, /if\(!maybeShowRedesignNotice\(\)\)maybeShowBackupReminder\(\);/);
  assert.doesNotMatch(html, /zonesIntroSeen|showZonesIntroOnce/);
});

test('erkennt Bestandsnutzer an Trainingsdaten oder Programmen', () => {
  const context = noticeContext();
  assert.equal(context.hasExistingTrainingData(freshState()), false);
  assert.equal(context.hasExistingTrainingData(null), false);

  const withHistory = freshState();
  withHistory.store.default.history.push({ week: 1, day: 'A', complete: true });
  assert.equal(context.hasExistingTrainingData(withHistory), true);

  const withLogs = freshState();
  withLogs.store.default.logs['1|A|bench'] = { sets: [{ reps: '8', weight: '60' }] };
  assert.equal(context.hasExistingTrainingData(withLogs), true);

  const withTargets = freshState();
  withTargets.store.default.tg.bench = 60;
  assert.equal(context.hasExistingTrainingData(withTargets), true);

  const withWorkout = freshState();
  withWorkout.store.default.workout = { running: true };
  assert.equal(context.hasExistingTrainingData(withWorkout), true);

  const withSecondProgram = freshState();
  withSecondProgram.programs.eigenes = { id: 'eigenes', name: 'Eigenes Programm' };
  assert.equal(context.hasExistingTrainingData(withSecondProgram), true);

  const withOtherActive = freshState();
  withOtherActive.active = 'coach1';
  assert.equal(context.hasExistingTrainingData(withOtherActive), true);
});

test('zeigt Bestandsnutzern den Hinweis genau einmal', () => {
  const state = freshState();
  state.store.default.history.push({ week: 1, day: 'A', complete: true });
  const context = noticeContext({ S: state });

  assert.equal(context.maybeShowRedesignNotice(), true);
  assert.equal(context.modalCalls.length, 1);
  assert.match(context.modalCalls[0].title, /neues Design/);
  assert.match(context.modalCalls[0].msg, /Fortschritt bleiben dabei unverändert erhalten/);
  assert.match(context.modalCalls[0].msg, /Workout bearbeiten/);
  assert.equal(context.stored['satzkraft-design-update-v1'], '1');

  assert.equal(context.maybeShowRedesignNotice(), false);
  assert.equal(context.modalCalls.length, 1);
});

test('der Hinweis hat einen Schließen-Knopf und einen Weg zur Versionshistorie', () => {
  const state = freshState();
  state.store.default.history.push({ week: 1, day: 'A', complete: true });
  const context = noticeContext({ S: state });
  context.maybeShowRedesignNotice();

  const buttons = context.modalCalls[0].btns;
  assert.equal(buttons.length, 2);
  assert.equal(buttons[0].label, 'Alles klar');
  assert.equal(buttons[0].cls, 'primary');
  assert.equal(buttons[0].action, null);
  assert.equal(buttons[1].label, 'Alle Neuerungen ansehen');
  buttons[1].action();
  assert.equal(context.versionInfoCalls, 1);
});

test('Neuinstallationen sehen nie einen Hinweis und werden still markiert', () => {
  const context = noticeContext();
  assert.equal(context.maybeShowRedesignNotice(), false);
  assert.equal(context.modalCalls.length, 0);
  assert.equal(context.stored['satzkraft-design-update-v1'], '1');

  const trainedLater = freshState();
  trainedLater.store.default.history.push({ week: 1, day: 'A', complete: true });
  context.S = trainedLater;
  assert.equal(context.maybeShowRedesignNotice(), false);
  assert.equal(context.modalCalls.length, 0);
});

test('stört keine laufenden Abläufe und holt den Hinweis später nach', () => {
  const state = freshState();
  state.store.default.history.push({ week: 1, day: 'A', complete: true });

  const blockers = [
    { active: () => true },
    { loadIssueText: 'Die gespeicherten Trainingsdaten konnten nicht gelesen werden.' },
    { pendingProgramImport: { program: { id: 'p1' } } },
    { resumedPendingWorkoutSwaps: true }
  ];
  for (const blocker of blockers) {
    const context = noticeContext(Object.assign({ S: state }, blocker));
    assert.equal(context.maybeShowRedesignNotice(), false, JSON.stringify(blocker));
    assert.equal(context.modalCalls.length, 0);
    assert.equal(context.stored['satzkraft-design-update-v1'], undefined,
      'ohne Anzeige darf der Schlüssel nicht gesetzt werden');
  }

  const later = noticeContext({ S: state });
  assert.equal(later.maybeShowRedesignNotice(), true);
  assert.equal(later.modalCalls.length, 1);
});
