const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const start = html.indexOf('function reportFinite');
const end = html.indexOf('function reportNumber', start);
assert.ok(start >= 0 && end > start, 'Auswertungsfunktionen wurden nicht gefunden');

const context = {};
vm.createContext(context);
vm.runInContext(html.slice(start, end), context);

function sampleData() {
  const program = {
    weeks: [{ n: 1 }, { n: 2 }, { n: 3 }],
    days: [
      { key: 'A', wd: 'Montag', ex: [
        { id: 'squat', name: 'Kniebeuge', w: true, unit: 'reps' },
        { id: 'push', name: 'Liegestütze', w: false, unit: 'reps' },
        { id: 'plank', name: 'Plank', w: false, unit: 'seconds' }
      ] },
      { key: 'B', wd: 'Donnerstag', ex: [] }
    ]
  };
  const logs = {
    '1|A|squat': { sets: [{ reps: '5', weight: '100' }, { reps: 'unbekannt', weight: '100' }] },
    '2|A|squat': { sets: [{ reps: '6', weight: '105' }] },
    '1|A|push': { sets: [{ reps: '10', weight: '' }] },
    '2|A|push': { sets: [{ reps: '12', weight: '' }] },
    '1|A|plank': { sets: [{ reps: '30', weight: '' }] },
    '2|A|plank': { sets: [{ reps: '45', weight: '' }, { reps: '-1', weight: '' }] }
  };
  const history = [
    { week: 1, day: 'A', start: 1000, dur: 3600, complete: true },
    { week: 1, day: 'B', start: 2000, dur: 1800, complete: true },
    { week: 2, day: 'A', start: 3000, dur: 1200, complete: true },
    { week: 2, day: 'B', start: 4000, dur: 600, complete: false }
  ];
  return { program, logs, history };
}

test('calculates block completion, duration, work sets and volume without mutating input', () => {
  const input = sampleData();
  const snapshot = JSON.stringify(input);
  const data = context.buildReportData(input.program, input.logs, input.history);

  assert.equal(data.completedSessions, 3);
  assert.equal(data.totalPlanned, 6);
  assert.equal(data.completionPct, 50);
  assert.equal(data.totalDuration, 7200);
  assert.equal(data.totalSets, 6);
  assert.equal(data.totalVolume, 1130);
  assert.deepEqual(Array.from(data.weekly, week => week.completed), [2, 1, 0]);
  assert.deepEqual(Array.from(data.sessions, session => session.start), [4000, 3000, 2000, 1000]);
  assert.equal(JSON.stringify(input), snapshot);
});

test('builds separate weight, repetition and time trends', () => {
  const input = sampleData();
  const data = context.buildReportData(input.program, input.logs, input.history);
  const squat = data.exercises.find(metric => metric.id === 'squat');
  const push = data.exercises.find(metric => metric.id === 'push');
  const plank = data.exercises.find(metric => metric.id === 'plank');

  assert.equal(squat.type, 'weight');
  assert.equal(squat.first, 116.5);
  assert.equal(squat.latest, 126);
  assert.equal(squat.best, 126);
  assert.equal(squat.bestWeek, 2);
  assert.equal(squat.firstWeek, 1);
  assert.equal(squat.delta, 9.5);
  assert.equal(push.type, 'reps');
  assert.deepEqual(Array.from(push.points, point => point.value), [10, 12]);
  assert.equal(plank.type, 'seconds');
  assert.deepEqual(Array.from(plank.points, point => point.value), [30, 45]);
});

test('keeps deload work in totals but excludes weighted deload points from the trend', () => {
  const data = context.buildReportData(
    { weeks: [{ n: 1, phase: 'aufbau' }, { n: 2, phase: 'deload' }], days: [{ key: 'A', ex: [{ id: 'x', name: 'X', w: true }] }] },
    { '1|A|x': { sets: [{ reps: '5', weight: '100' }] }, '2|A|x': { sets: [{ reps: '5', weight: '60' }] } },
    []
  );
  const metric = data.exercises[0];
  assert.deepEqual(Array.from(metric.points, point => point.week), [1]);
  assert.equal(metric.latest, metric.first);
  assert.equal(metric.delta, 0);
  assert.equal(metric.bestWeek, 1);
  assert.equal(data.totalSets, 2);
  assert.equal(data.totalVolume, 800);
});

test('ignores malformed and contradictory values instead of inventing progress', () => {
  assert.equal(context.reportEstimate1RM('', 10), null);
  assert.equal(context.reportEstimate1RM(-20, 10), null);
  assert.equal(context.reportSetHasData({ reps: 'nicht numerisch' }), false);
  assert.equal(context.reportSetHasData({ reps: '-4' }), false);

  const data = context.buildReportData(
    { weeks: [{ n: 1 }], days: [{ key: 'A', ex: [{ id: 'x', name: 'X', w: true }] }] },
    { '1|A|x': { sets: [{ reps: '8', weight: 'fehlt' }] } },
    [{ week: 1, day: 'A', start: 1, dur: 'falsch', complete: false }]
  );
  assert.equal(data.completedSessions, 0);
  assert.equal(data.totalSets, 1);
  assert.equal(data.totalVolume, 0);
  assert.equal(data.exercises[0].points.length, 0);
});

test('renders a responsive and accessible report with local-data and print guidance', () => {
  assert.match(html, /id="report" class="overlay" role="dialog" aria-modal="true"/);
  assert.match(html, /Fortschritt im Trainingsblock/);
  assert.match(html, /Fortschritt je Übung/);
  assert.match(html, /Nur lokal gespeichert/);
  assert.match(html, /Vollständiges Trainingsprotokoll/);
  assert.match(html, /@media\(max-width:760px\).*\.rexgrid\{grid-template-columns:1fr\}/s);
  assert.match(html, /\.rdetails:not\(\[open\]\)\{display:none !important\}/);
  assert.match(html, /Deload-Wochen fließen nicht in den Übungstrend ein/);
  assert.match(html, /function printReport\(\)/);
  assert.match(html, /b\.id==="reprint"\)printReport\(\)/);
  assert.doesNotMatch(html, /window\.open\("","_blank"\)/);
  assert.match(html, /var program=S\.programs\[reportProgramId\]\|\|PROG\(\);document\.title=\(program\.name\|\|"Satzkraft"\)\+" – Auswertung"/);
  assert.match(html, /e\.key==="Escape".*closeReport/s);
});
