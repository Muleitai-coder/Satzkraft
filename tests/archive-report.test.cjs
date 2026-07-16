const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const reportStart = html.indexOf('function reportFinite');
const reportEnd = html.indexOf('// ---------- Programm-Bibliothek', reportStart);
assert.ok(reportStart >= 0 && reportEnd > reportStart, 'Auswertungsfunktionen wurden nicht gefunden');

function weightedProgram(name, exerciseName, overrides) {
  return Object.assign({
    name,
    categories: { kraft: { label: 'Kraft', color: 'amber', rest: 90 } },
    weeks: [{ n: 1, phase: 'aufbau', label: 'Aufbau', sets: { kraft: 1 } }],
    days: [{
      key: 'A',
      wd: 'Montag',
      title: 'Kraft',
      ex: [{ id: 'squat', name: exerciseName, cat: 'kraft', w: true, unit: 'reps', sets: 1 }]
    }]
  }, overrides);
}

function reportStore(weight, start) {
  return {
    tg: {},
    logs: { '1|A|squat': { sets: [{ reps: '3', weight: String(weight) }] } },
    history: [{ week: 1, day: 'A', start, dur: 600, complete: true }],
    workout: null,
    week: 1,
    day: 'A'
  };
}

function loadReportContext() {
  const report = {
    innerHTML: '',
    classList: {
      values: new Set(),
      add(value) { this.values.add(value); },
      remove(value) { this.values.delete(value); },
      contains(value) { return this.values.has(value); }
    },
    focus() {}
  };
  const close = { focus() {} };
  const activeProgram = weightedProgram('Aktivblock', 'Aktive Übung');
  const archivedProgram = weightedProgram('Archivblock', 'Archiv-Kniebeuge', { archived: true });
  const context = {
    APP_VERSION: 'test',
    S: {
      active: 'active',
      programs: { active: activeProgram, archive: archivedProgram },
      store: { active: reportStore(999, 9999), archive: reportStore(40, 1111) },
      // Absichtlich widersprüchliche aktive Aliasse: Archivberichte dürfen sie nicht verwenden.
      logs: reportStore(999, 9999).logs,
      history: reportStore(999, 9999).history
    },
    esc: value => String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;'),
    attr: value => String(value == null ? '' : value).replace(/"/g, '&quot;'),
    icon: name => `[${name}]`,
    fmtSeconds: value => `${value} Sek`,
    setsForExercise: exercise => exercise.sets == null ? 1 : exercise.sets,
    dDate: value => `Datum-${value}`,
    dClock: () => '12:00',
    lockSurfaceScroll() {},
    unlockSurfaceScroll() {},
    document: {
      activeElement: { id: 'origin' },
      title: 'Satzkraft',
      contains: () => true,
      getElementById(id) {
        if (id === 'report') return report;
        if (id === 'repclose') return close;
        return null;
      }
    },
    window: {
      addEventListener() {},
      removeEventListener() {},
      print() {}
    },
    setTimeout() {}
  };
  context.PROG = () => context.S.programs[context.S.active];
  vm.createContext(context);
  vm.runInContext(html.slice(reportStart, reportEnd), context);
  return { context, report };
}

test('buildReport resolves an archived program and its own store instead of active aliases', () => {
  const { context, report } = loadReportContext();
  context.buildReport('archive');

  assert.match(report.innerHTML, /Archivblock/);
  assert.match(report.innerHTML, /Archiv-Kniebeuge/);
  assert.match(report.innerHTML, /Datum-1111/);
  assert.doesNotMatch(report.innerHTML, /Aktivblock|Aktive Übung|999/);
});

test('openReport forwards the requested program id through the read-only report path', () => {
  const { context, report } = loadReportContext();
  context.openReport('archive');

  assert.equal(report.classList.contains('open'), true);
  assert.match(report.innerHTML, /Archivblock/);
  assert.doesNotMatch(report.innerHTML, /Aktivblock/);
});

test('reportDetailedProtocol uses the supplied logs and history for arbitrary programs', () => {
  const { context } = loadReportContext();
  const program = weightedProgram('Fremder Block', 'Fremde Kniebeuge');
  const logs = { '1|A|squat': { sets: [{ reps: '5', weight: '70' }] } };
  const history = [{ week: 1, day: 'A', start: 4242, dur: 900, complete: true }];
  const protocol = context.reportDetailedProtocol(program, logs, history);

  assert.match(protocol, /Fremde Kniebeuge/);
  assert.match(protocol, /5×70/);
  assert.match(protocol, /Datum-4242/);
  assert.doesNotMatch(protocol, /999/);
});

test('previousBlockMetrics follows archived parents by exact exercise name and renders the last trend value', () => {
  const { context } = loadReportContext();
  const oldest = weightedProgram('Block 0', 'Kniebeuge', { archived: true });
  const previous = weightedProgram('Block 1', 'Kniebeuge', { archived: true, parent: 'oldest' });
  const current = weightedProgram('Block 2', 'Kniebeuge', { parent: 'previous' });
  current.days[0].ex.push({ id: 'lowercase', name: 'kniebeuge', cat: 'kraft', w: true, unit: 'reps', sets: 1 });
  context.S.programs = { oldest, previous, current };
  context.S.store = {
    oldest: reportStore(60, 1000),
    previous: reportStore(75, 2000), // 75 kg × 3 Wdh. = 82,5 kg geschätztes 1RM
    current: reportStore(80, 3000)
  };
  context.S.active = 'current';

  const metrics = context.previousBlockMetrics('current');
  assert.equal(metrics.Kniebeuge.latest, 82.5);
  assert.equal(metrics.kniebeuge, undefined, 'Namensabgleich muss exakt bleiben');

  const currentMetric = context.buildReportData(current, context.S.store.current.logs, context.S.store.current.history)
    .exercises.find(metric => metric.name === 'Kniebeuge');
  const card = context.reportExerciseCard(currentMetric, metrics.Kniebeuge);
  assert.match(card, /Vorblock: 82,5 kg/);
});

test('exportTranslate never exposes internal archive or parent-chain metadata', () => {
  const start = html.indexOf('function exportTranslate');
  const end = html.indexOf('function plainObject', start);
  assert.ok(start >= 0 && end > start, 'Exportfunktion wurde nicht gefunden');
  const source = html.slice(start, end);

  assert.doesNotMatch(source, /\barchived\b/);
  assert.doesNotMatch(source, /\bparent\b/);
});
