const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const start = html.indexOf('var REC_COLOR=');
const end = html.indexOf('function stpBtn', start);
assert.ok(start >= 0 && end > start, 'Empfehlungsdarstellung wurde nicht gefunden');

function contextFor({ week = 2, phase = 'aufbau', previousPhase = 'aufbau', recommendation, done = false } = {}) {
  const context = {
    S: { week, tg: {} },
    PROG: () => ({ weeks: [{ phase: previousPhase }, { phase }] }),
    currentExerciseSwap: () => null,
    isDone: () => done,
    lastPerf: () => ({ week: 1, sets: [] }),
    recommendForWeek: () => recommendation || {
      action: 'increase',
      mode: 'weight',
      increment: 2.5,
      nextWeight: 55,
      message: 'Steigern: nächstes Mal +2.5 kg',
      reason: 'Alle Arbeitssätze erreicht.'
    },
    getExerciseProgressionMode: ex => ex.mode || (ex.w ? 'weight' : ex.unit === 'seconds' ? 'seconds' : 'reps'),
    isTime: ex => ex.unit === 'seconds',
    timeMode: ex => ex.tmode || 'target',
    wfOf: currentWeek => currentWeek.phase === 'deload' ? 0.6 : 1,
    round: value => Math.round(value * 2) / 2,
    fmtKg: value => String(value).replace('.', ','),
    attr: value => String(value),
    esc: value => String(value),
    icon: () => ''
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);
  return context;
}

test('shows only the compact weight origin beside the open target', () => {
  const context = contextFor();
  const exercise = { id: 'press', w: true };

  assert.match(context.progressContextHtml(exercise, { week: 1 }, false, 55), /↑ 2,5 kg aus W1/);
  assert.equal(context.recHtml(exercise), '');
});

test('keeps the recovery-week reason fixed at every affected open target', () => {
  const weighted = contextFor({ phase: 'deload' });
  assert.match(weighted.progressContextHtml({ id: 'squat', w: true }, null, false, 48), /Erholungswoche/);
  assert.equal(weighted.recHtml({ id: 'squat', w: true }), '');

  const timed = contextFor({ phase: 'deload' });
  assert.match(
    timed.progressContextHtml({ id: 'plank', unit: 'seconds', mode: 'seconds' }, null, false, null),
    /Erholungswoche/
  );
  assert.equal(timed.recHtml({ id: 'plank', unit: 'seconds', mode: 'seconds' }), '');

  const completed = contextFor({
    phase: 'deload',
    done: true,
    recommendation: {
      action: 'deload',
      mode: 'seconds',
      increment: 5,
      nextWeight: null,
      message: 'Erholung',
      reason: 'Belastung reduziert.'
    }
  });
  const guidance = completed.recHtml({ id: 'plank', unit: 'seconds', mode: 'seconds' });
  assert.match(guidance, /Empfehlung nach dieser Einheit/);
  assert.match(guidance, /Erholungswoche/);
});

test('moves rep advice from the completed-set card to the next week target', () => {
  const recommendation = {
    action: 'increase',
    mode: 'reps',
    increment: 1,
    nextWeight: null,
    message: 'Steigern: nächstes Mal +1 Wiederholung(en)',
    reason: 'Oberes Ziel erreicht – nächstes Mal etwas mehr.'
  };
  const open = contextFor({ recommendation });
  const exercise = { id: 'pushup', mode: 'reps' };

  assert.match(open.progressContextHtml(exercise, { week: 1 }, false, null), /↑ Wdh. aus W1/);
  assert.equal(open.recHtml(exercise), '');

  const completed = contextFor({ done: true, recommendation });
  const guidance = completed.recHtml(exercise);
  assert.match(guidance, /Empfehlung nach dieser Einheit/);
  assert.match(guidance, /Nächste Einheit: Wiederholungen leicht steigern/);
});
