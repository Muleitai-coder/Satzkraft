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

test('keeps ended and successor exercises in separate week-filtered report cards', () => {
  const data = context.buildReportData(
    {
      weeks: [{ n: 1 }, { n: 2 }, { n: 3 }],
      days: [{ key: 'A', ex: [
        { id: 'old', name: 'Beinpresse', w: true, untilWeek: 2 },
        { id: 'new', name: 'Kniebeuge', w: true, fromWeek: 3, prevId: 'old' }
      ] }]
    },
    {
      '1|A|old': { sets: [{ reps: '8', weight: '80' }] },
      '3|A|old': { sets: [{ reps: '8', weight: '90' }] },
      '3|A|new': { sets: [{ reps: '8', weight: '60' }] }
    },
    []
  );
  const old = data.exercises.find(metric => metric.id === 'old');
  const successor = data.exercises.find(metric => metric.id === 'new');
  assert.deepEqual(Array.from(old.points, point => point.week), [1]);
  assert.deepEqual(Array.from(successor.points, point => point.week), [3]);
  assert.equal(old.untilWeek, 2);
  assert.match(html, /metric\.name\+period/);
  assert.match(html, /' · Woche '\+metric\.fromWeek\+'–'\+metric\.untilWeek/);
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
  assert.doesNotMatch(html, /Fortschritt im Trainingsblock/);
  assert.doesNotMatch(html, /Letzte Einheiten/);
  assert.match(html, /Fortschritt je Übung/);
  assert.match(html, /Nur lokal gespeichert/);
  assert.match(html, /id="protocol" class="overlay" role="dialog" aria-modal="true"/);
  assert.match(html, /rprotocollinktitle">Trainingsprotokoll/);
  assert.match(html, /b\.id==="repprotocol"\)openProtocol\(\)/);
  assert.match(html, /@media\(max-width:760px\).*\.rexgrid\{grid-template-columns:1fr\}/s);
  assert.match(html, /body\.protocol-open #report\{display:none !important\}/);
  assert.match(html, /\.rprotocollink\{display:none !important\}/);
  assert.match(html, /Deload-Wochen fließen nicht in den Übungstrend ein/);
  assert.match(html, /function printReport\(\)/);
  assert.match(html, /function printProtocol\(\)/);
  assert.match(html, /b\.id==="reprint"\)printReport\(\)/);
  assert.match(html, /b\.id==="protprint"\)printProtocol\(\)/);
  assert.doesNotMatch(html, /window\.open\("","_blank"\)/);
  assert.match(html, /var program=S\.programs\[reportProgramId\]\|\|PROG\(\);document\.title=\(program\.name\|\|"Satzkraft"\)\+" – Auswertung"/);
  assert.match(html, /var program=S\.programs\[protocolProgramId\]\|\|PROG\(\);document\.title=\(program\.name\|\|"Satzkraft"\)\+" – Trainingsprotokoll"/);
  assert.match(html, /e\.key!=="Escape".*closeProtocol\(\);return;.*closeReport\(\)/s);
});

function weightedTimeData() {
  const program = {
    name: 'Zeit und Last', weeks: [{ n: 1, label: 'Aufbau' }, { n: 2, phase: 'deload', label: 'Deload' }],
    days: [{ key: 'A', wd: 'Montag', ex: [
      { id: 'carry', name: 'Suitcase Carry', w: true, unit: 'seconds', sets: 1, perSide: true }
    ] }]
  };
  const logs = {
    '1|A|carry': { sets: [{ reps: '60', weight: '20' }] },
    '2|A|carry': { sets: [{ reps: '30', weight: '15' }] }
  };
  return { program, logs };
}
function renderingContext() {
  const report = { innerHTML: '' }, protocol = { innerHTML: '' };
  let modal = '';
  const ctx = {
    document: { getElementById: id => id === 'protocol' ? protocol : report },
    S: { programs: {}, store: {} }, PROG: () => null,
    dDate: () => '11.10.2026', dClock: () => '12:00', icon: () => '',
    isTime: ex => ex.unit === 'seconds', round: value => Math.round(value * 2) / 2,
    setsForExercise: ex => ex.sets || 1, currentExerciseSwap: () => '',
    normalizeSwapName: value => String(value || '').trim(),
    exerciseValidForWeek: (ex, w) => w >= (ex.fromWeek || 1) && w <= (ex.untilWeek || Infinity),
    showModal: (title, body) => { modal = body; }
  };
  vm.createContext(ctx);
  vm.runInContext(html.slice(html.indexOf('function fmtTime('), html.indexOf('function fmtSecondsRange(')), ctx);
  vm.runInContext(html.slice(html.indexOf('function esc('), html.indexOf('function icon(')), ctx);
  vm.runInContext(html.slice(start, html.indexOf('// ---------- Programm-Bibliothek', start)), ctx);
  vm.runInContext(html.slice(html.indexOf('function exHistory('), html.indexOf('function removeLegacyCoachAnswers(')), ctx);
  return { ctx, report, protocol, modal: () => modal };
}

test('weighted seconds retain both values without 1RM, repetition volume or a synthetic best', () => {
  const { program, logs } = weightedTimeData();
  const snapshot = JSON.stringify({ program, logs });
  const data = context.buildReportData(program, logs, []);
  const metric = data.exercises[0];
  assert.equal(data.totalVolume, 0);
  assert.equal(data.totalSets, 2);
  assert.equal(metric.type, 'weighted_seconds');
  assert.equal(metric.volume, 0);
  assert.equal(metric.best, null); assert.equal(metric.delta, null); assert.equal(metric.latest, null);
  assert.equal(metric.points.length, 0);
  assert.deepEqual(Array.from(metric.performances, p => ({ week: p.week, reps: p.sets[0].reps, weight: p.sets[0].weight })), [
    { week: 1, reps: 60, weight: 20 }, { week: 2, reps: 30, weight: 15 }
  ], 'Deload-Satzwerte bleiben sichtbar, ohne daraus einen Trend zu berechnen');
  assert.equal(context.topBlockImprovements(data).length, 0);
  assert.equal(JSON.stringify({ program, logs }), snapshot);
});

test('same canonical name keeps weighted seconds, seconds, reps and classic weight in separate metrics', () => {
  const { program, logs } = weightedTimeData();
  program.days[0].ex.push(
    { id: 'seconds', name: 'Suitcase Carry', unit: 'seconds' },
    { id: 'reps', name: 'Suitcase Carry', unit: 'reps' },
    { id: 'weight', name: 'Suitcase Carry', unit: 'reps', w: true }
  );
  logs['1|A|seconds'] = { sets: [{ reps: '60', weight: '' }] };
  logs['1|A|reps'] = { sets: [{ reps: '8', weight: '' }] };
  logs['1|A|weight'] = { sets: [{ reps: '8', weight: '20' }] };
  const data = context.buildReportData(program, logs, []);
  assert.equal(data.exercises.length, 4);
  assert.equal(data.totalVolume, 160);
  assert.equal(data.exercises.find(m => m.type === 'weight').best, 25.5);
  assert.equal(data.exercises.find(m => m.type === 'seconds').best, 60);
  assert.equal(data.exercises.find(m => m.type === 'reps').best, 8);
});

test('replacement work counts sets but cannot appear as performance of the original weighted hold', () => {
  const { program, logs } = weightedTimeData();
  logs['2|A|carry'].swap = 'Anderer Carry';
  logs['2|A|carry'].sets[0] = { reps: '500', weight: '200' };
  const data = context.buildReportData(program, logs, []);
  assert.equal(data.totalSets, 2); assert.equal(data.totalVolume, 0);
  assert.deepEqual(Array.from(data.exercises[0].performances, p => p.week), [1]);
});

test('weighted hold history and protocol show minutes, load and side without volume or 1RM', () => {
  const { program, logs } = weightedTimeData();
  const { ctx, modal } = renderingContext();
  const exercise = program.days[0].ex[0];
  ctx.S = { day: 'A', week: 1, logs }; ctx.PROG = () => program;
  const rows = ctx.exHistory(exercise);
  assert.equal(rows[0].parts[0], '1:00 min · 20 kg · je Seite');
  assert.equal(rows[0].vol, 0); assert.equal(rows[0].e1, null);
  ctx.showHistory(exercise);
  assert.match(modal(), /Zeit · kg/); assert.match(modal(), /1:00 min · 20 kg · je Seite/);
  assert.doesNotMatch(modal(), /1RM|Vol\.|Wdh×kg|1200|1\.200/);
  const protocol = ctx.reportDetailedProtocol(program, logs, []);
  assert.match(protocol, /1:00 min · 20 kg · je Seite/);
  assert.match(protocol, /0:30 min · 15 kg · je Seite/);
  assert.match(protocol, /class="vol">–/);
  assert.doesNotMatch(protocol, /60×20|1200|1\.200/);
  logs['1|A|carry'].swap = '<Ersatz & Carry>';
  const swapped = ctx.reportDetailedProtocol(program, logs, []);
  assert.match(swapped, /&lt;Ersatz &amp; Carry&gt;/); assert.match(swapped, /Getauscht/);
  assert.match(swapped, /1:00 min · 20 kg · je Seite/);
});

test('missing weight stays missing and explicit zero is retained in all weighted-time output', () => {
  const { ctx } = renderingContext();
  const ex = { w: true };
  assert.equal(ctx.reportTimedSetText(ex, { reps: '60', weight: '' }), '1:00 min · Gewicht fehlt');
  assert.equal(ctx.reportTimedSetText(ex, { reps: '60', weight: null }), '1:00 min · Gewicht fehlt');
  assert.equal(ctx.reportTimedSetText(ex, { reps: '60', weight: '-1' }), '1:00 min · Gewicht fehlt');
  assert.equal(ctx.reportTimedSetText(ex, { reps: '60', weight: '0' }), '1:00 min · 0 kg');
});

test('active and archived reports, previous block and print sources retain typed time and load', () => {
  const { program, logs } = weightedTimeData();
  const { ctx, report, protocol } = renderingContext();
  const previous = JSON.parse(JSON.stringify(program)); previous.archived = true;
  program.parent = 'previous';
  const previousLogs = { '1|A|carry': { sets: [{ reps: '60', weight: '20' }] } };
  ctx.S = { active: 'current', programs: { current: program, previous }, store: {
    current: { logs, history: [], notes: {} }, previous: { logs: previousLogs, history: [], notes: {} }
  } };
  ctx.PROG = () => program;
  ctx.buildReport('current');
  assert.match(report.innerHTML, /Zeit &amp; Gewicht/);
  assert.match(report.innerHTML, /0:30 min · 15 kg · je Seite/);
  assert.match(report.innerHTML, /Vorblock: 1:00 min · 20 kg · je Seite/);
  assert.doesNotMatch(report.innerHTML, /rexbest|rexpill|rsparkbars|1\.200/);
  assert.equal(ctx.previousBlockMetrics('current')['Suitcase Carry|weighted_seconds'].type, 'weighted_seconds');
  ctx.buildReport('previous', 'archive');
  assert.match(report.innerHTML, /1:00 min · 20 kg · je Seite/);
  assert.doesNotMatch(report.innerHTML, /Vorblock:/);
  ctx.buildProtocol('previous');
  assert.match(protocol.innerHTML, /1:00 min · 20 kg · je Seite/);
  assert.doesNotMatch(protocol.innerHTML, /60×20|1\.200/);
});
