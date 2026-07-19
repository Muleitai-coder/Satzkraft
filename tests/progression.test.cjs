const test = require("node:test");
const assert = require("node:assert/strict");
const progression = require("../js/progression.js");

const settings = progression.getWorkoutSettings({});
const weighted = { w: true, inc: 2.5, cat: "strength" };

function sets(reps, weight = 80) {
  return reps.map(value => ({ reps: String(value), weight: String(weight) }));
}

test("uses stable workout defaults", () => {
  assert.equal(settings.deloadMultiplier, 0.6);
  assert.equal(settings.requireAllSetsForIncrease, true);
  assert.equal(settings.allowAutoDecrease, true);
});

test("increases only after every set reaches the upper target", () => {
  const increase = progression.calculateNextRecommendation({
    exercise: weighted,
    settings,
    repRange: [5, 7],
    currentWeight: 80,
    currentSession: sets([7, 7, 7])
  });
  assert.equal(increase.action, "increase");
  assert.equal(increase.nextWeight, 82.5);

  const hold = progression.calculateNextRecommendation({
    exercise: weighted,
    settings,
    repRange: [5, 7],
    currentWeight: 80,
    currentSession: sets([7, 7, 6])
  });
  assert.equal(hold.action, "hold");
  assert.equal(hold.nextWeight, 80);
});

test("reduces weight only after two sessions below target", () => {
  const first = progression.calculateNextRecommendation({
    exercise: weighted,
    settings,
    repRange: [5, 7],
    currentWeight: 80,
    currentSession: sets([4, 4, 4])
  });
  assert.equal(first.action, "hold");

  const second = progression.calculateNextRecommendation({
    exercise: weighted,
    settings,
    repRange: [5, 7],
    currentWeight: 80,
    currentSession: sets([4, 4, 4]),
    lastSession: sets([4, 4, 4])
  });
  assert.equal(second.action, "decrease");
  assert.equal(second.nextWeight, 77.5);
});

test("calculates deload once from the heavy base", () => {
  const deload = progression.calculateNextRecommendation({
    exercise: weighted,
    settings,
    repRange: [5, 5],
    currentWeight: 80,
    currentSession: sets([5, 5], 48),
    isDeload: true
  });
  assert.equal(deload.action, "deload");
  assert.equal(deload.nextWeight, 48);
  assert.match(deload.message, /reduziertes Gewicht/);
});

test("uses exercise-specific deload language without imaginary weight", () => {
  const seconds = progression.calculateNextRecommendation({
    exercise: { unit: "seconds", pmode: "seconds" },
    settings,
    repRange: [30, 60],
    currentSession: [{ reps: "45", weight: "" }],
    isDeload: true
  });
  assert.equal(seconds.action, "deload");
  assert.equal(seconds.nextWeight, null);
  assert.match(seconds.message, /Haltezeit reduzieren|leichtere Variante/);
  assert.doesNotMatch(`${seconds.message} ${seconds.reason}`, /Gewicht|kg/);

  const bodyweight = progression.calculateNextRecommendation({
    exercise: { unit: "reps", pmode: "reps" },
    settings,
    repRange: [8, 12],
    currentSession: sets([10, 10, 10], 0),
    isDeload: true
  });
  assert.equal(bodyweight.action, "deload");
  assert.equal(bodyweight.nextWeight, null);
  assert.match(bodyweight.message, /weniger Wiederholungen|leichtere Variante/);
  assert.doesNotMatch(`${bodyweight.message} ${bodyweight.reason}`, /Gewicht|kg/);
});

test("supports reps, seconds and skills without a fixed exercise database", () => {
  assert.equal(progression.getExerciseProgressionMode({ unit: "seconds" }), "seconds");
  assert.equal(progression.getExerciseProgressionMode({ cat: "skill" }), "progression");

  const reps = progression.calculateNextRecommendation({
    exercise: { cat: "custom", pmode: "reps", inc: 1 },
    settings,
    repRange: [8, 12],
    currentSession: sets([12, 12, 12], 0)
  });
  assert.equal(reps.action, "increase");
  assert.equal(reps.increment, 1);
});
