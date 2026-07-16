const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const backup = JSON.parse(fs.readFileSync(new URL('../TESTBACKUP-AUSWERTUNG.json', `file://${__filename}`), 'utf8'));
const start = html.indexOf('function reportFinite');
const end = html.indexOf('function reportNumber', start);
assert.ok(start >= 0 && end > start, 'Auswertungsfunktionen wurden nicht gefunden');

const context = {};
vm.createContext(context);
vm.runInContext(html.slice(start, end), context);

test('report example backup produces useful weight, repetition and time trends', () => {
  const program = backup.programs[backup.active];
  const store = backup.store[backup.active];
  const data = context.buildReportData(program, store.logs, store.history);

  assert.equal(data.completedSessions, 7);
  assert.equal(data.totalPlanned, 8);
  assert.equal(data.completionPct, 88);
  assert.ok(data.totalDuration > 0);
  assert.ok(data.totalVolume > 0);

  const squat = data.exercises.find(metric => metric.id === 'A_0');
  const pushups = data.exercises.find(metric => metric.id === 'A_1');
  const plank = data.exercises.find(metric => metric.id === 'A_2');
  const stairmaster = data.exercises.find(metric => metric.id === 'B_1');
  const deadHang = data.exercises.find(metric => metric.id === 'B_2');

  assert.deepEqual(Array.from(squat.points, point => point.week), [1, 2, 3]);
  assert.equal(squat.bestWeek, 3);
  assert.deepEqual(Array.from(pushups.points, point => point.value), [12, 15, 18, 18]);
  assert.deepEqual(Array.from(plank.points, point => point.value), [40, 50, 60, 60]);
  assert.deepEqual(Array.from(stairmaster.points, point => point.value), [1200, 1200, 1200, 1200]);
  assert.deepEqual(Array.from(deadHang.points, point => point.value), [42, 50, 60, 65]);
});
