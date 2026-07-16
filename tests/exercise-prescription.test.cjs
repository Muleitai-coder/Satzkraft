const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const start = html.indexOf('function catReps');
const end = html.indexOf('function getSets', start);
assert.ok(start >= 0 && end > start, 'Trainingsvorgaben-Funktionen wurden nicht gefunden');

const context = {
  catOf: () => ({ reps: { aufbau: [5, 7], intensiv: [3, 5] } }),
  PROG: () => ({ weeks: [{ sets: { kraft: 3 } }] })
};
vm.createContext(context);
vm.runInContext(html.slice(start, end), context);

test('uses an exercise-specific prescription before group defaults', () => {
  assert.deepEqual(Array.from(context.catReps({ reps: [6, 9] }, 'aufbau')), [6, 9]);
  assert.equal(context.setsForExercise({ cat: 'kraft', sets: 4 }, 1), 4);
});

test('keeps imported programs compatible with group and week defaults', () => {
  assert.deepEqual(Array.from(context.catReps({ cat: 'kraft' }, 'aufbau')), [5, 7]);
  assert.equal(context.setsForExercise({ cat: 'kraft' }, 1), 3);
});
