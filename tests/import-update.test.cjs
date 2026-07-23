// Prüft das Trainings-Update per Import (gleichnamiges Programm aktualisieren):
// 1. Zielwahl: aktives Programm hat Vorrang, archivierte werden ignoriert
// 2. Übungs-Zuordnung: Name (inkl. Alias), Positions-Fallback bei gleichem Typ, Zeitfenster-Felder entfernt
// 3. Oberfläche: Update-Knopf, Handler und Hinweistexte sind verdrahtet
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync(new URL("../index.html", `file://${__dirname}/`), "utf8");

function slice(from, to) {
  const start = html.indexOf(from);
  const end = html.indexOf(to, start);
  assert.ok(start >= 0 && end > start, `Abschnitt ${from} … ${to} nicht gefunden`);
  return html.slice(start, end);
}

const ctx = {
  S: { active: "b", programs: {}, store: {} },
  cloneJSON: v => JSON.parse(JSON.stringify(v)),
  newStore: () => ({}),
  currentTrainingWeekFor: () => 1,
  dayExercisesFor: day => day.ex,
  exerciseLibraryNamesMatch: (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase()
};
vm.createContext(ctx);
vm.runInContext(slice("function importUpdateTargetId", "function importUpdateExisting"), ctx);
vm.runInContext(slice("function editorExerciseTypeSignature", "function editorLibraryTypeSignature"), ctx);

test("Zielwahl: bevorzugt das aktive Programm, ignoriert archivierte, sonst null", () => {
  ctx.S.programs = { a: { name: "Plan" }, b: { name: "Plan" }, c: { name: "Plan", archived: true } };
  assert.equal(ctx.importUpdateTargetId({ sameNameIds: ["a", "b"] }), "b");
  assert.equal(ctx.importUpdateTargetId({ sameNameIds: ["a"] }), "a");
  assert.equal(ctx.importUpdateTargetId({ sameNameIds: ["c"] }), null);
  assert.equal(ctx.importUpdateTargetId({ sameNameIds: [] }), null);
  assert.equal(ctx.importUpdateTargetId(null), null);
});

function target() {
  return {
    id: "b",
    days: [{ key: "A", ex: [
      { id: "A_0", name: "Beinpresse", w: true, unit: "reps" },
      { id: "A_1", name: "Bankdrücken", w: true, unit: "reps" },
      { id: "A_2", name: "Plank", unit: "seconds" }
    ] }]
  };
}
function external(exercises) {
  return { _anleitung: {}, name: "Plan", days: [{ key: "A", exercises }] };
}

test("Zuordnung: gleiche Namen bekommen die alte Übungs-Referenz, angehängte neue Übungen keine", () => {
  const draft = ctx.importBuildUpdateDraft(external([
    { name: "Beinpresse", weighted: true },
    { name: "Bankdrücken", weighted: true },
    { name: "Plank", unit: "seconds" },
    { name: "Kniebeuge", weighted: true }
  ]), target());
  assert.ok(!("_anleitung" in draft));
  assert.equal(draft.days[0].exercises[0]._ref, "A_0");
  assert.equal(draft.days[0].exercises[1]._ref, "A_1");
  assert.equal(draft.days[0].exercises[2]._ref, "A_2");
  assert.equal(draft.days[0].exercises[3]._ref, undefined, "angehängte neue Übung ohne Referenz");
});

test("Zuordnung: gleiche Position + gleicher Typ gilt als Umbenennung, anderer Typ nicht", () => {
  const renamed = ctx.importBuildUpdateDraft(external([
    { name: "Beinpresse", weighted: true },
    { name: "Schrägbankdrücken", weighted: true },
    { name: "Plank", unit: "seconds" }
  ]), target());
  assert.equal(renamed.days[0].exercises[1]._ref, "A_1", "Umbenennung an gleicher Position");
  const otherType = ctx.importBuildUpdateDraft(external([
    { name: "Beinpresse", weighted: true },
    { name: "Liegestütze" },
    { name: "Plank", unit: "seconds" }
  ]), target());
  assert.equal(otherType.days[0].exercises[1]._ref, undefined, "Typwechsel ist keine Umbenennung");
});

test("Zuordnung: Zeitfenster-Felder aus dem Export werden entfernt, unbekannte Tage bleiben referenzlos", () => {
  const draft = ctx.importBuildUpdateDraft({ name: "Plan", days: [
    { key: "A", exercises: [{ name: "Beinpresse", weighted: true, fromWeek: 3, untilWeek: 6, prevId: "A_9" }] },
    { key: "Z", exercises: [{ name: "Beinpresse", weighted: true }] }
  ] }, target());
  const ex = draft.days[0].exercises[0];
  assert.equal(ex._ref, "A_0");
  assert.ok(!("fromWeek" in ex) && !("untilWeek" in ex) && !("prevId" in ex));
  assert.equal(draft.days[1].exercises[0]._ref, undefined);
});

test("Oberfläche: Update-Knopf, Klick-Handler und Hinweise sind verdrahtet", () => {
  assert.match(html, /id="importupdate">/);
  assert.match(html, /Laufendes Programm aktualisieren/);
  assert.match(html, /Vorhandenes aktualisieren/);
  assert.match(html, /b\.id==="importupdate"\)\{importUpdateExisting\(\);return;\}/);
  assert.match(html, /Fortschritt, Gewichte und Protokoll bleiben erhalten/);
  // Update läuft über die geprüfte Editor-Ersetzen-Mechanik:
  assert.match(html, /function importUpdateExisting\(\)\{[\s\S]*?editorStoreProgram\(true,"back",false\);\n\}/);
});
