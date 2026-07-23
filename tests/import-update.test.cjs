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

/* ---------- Programm-Kennung (code) und Stand (revision) ---------- */

const vctx = {
  CAT_COLORS: ["amber", "emerald", "violet", "sky", "orange", "rose", "slate"],
  LIMITS: { maxDays: 7, maxWeeks: 16, maxExPerDay: 12, maxSets: 10, maxNameLen: 30, maxLabelLen: 16 },
  WD_MAP: { montag: 0, dienstag: 1, mittwoch: 2, donnerstag: 3, freitag: 4, samstag: 5, sonntag: 6 },
  WD_CANON: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
  VALID_PROGRESSION_MODES: ["weight", "added_weight", "reps", "seconds", "progression", "none"],
  WUCD_SET: {}, ANLEITUNG: {},
  esc: v => String(v == null ? "" : v),
  wucdSan: list => Array.isArray(list) ? list.map(i => ({ name: i.name, sec: i.seconds })) : [],
  S: { programs: {} }
};
vm.createContext(vctx);
vm.runInContext(slice("var BEREICHE=", "var DEFAULT_PROGRAM="), vctx);
vm.runInContext(slice("function genId()", "function setActive("), vctx);

test("Format: code und revision sind optional, ungültige Werte werden abgelehnt", () => {
  const base = { format: "trainings-block", version: 2, name: "Code-Test",
    categories: { grund: { label: "Grund", color: "amber", rest: 120 } },
    weeks: [{ n: 1, phase: "aufbau", label: "Aufbau", rir: "3", note: "", sets: { grund: 3 } }],
    days: [{ key: "A", weekday: "Montag", title: "Tag A", exercises: [{ name: "Kniebeuge", category: "grund", weighted: true, increment: 2.5, startWeight: 60 }] }] };
  assert.equal(vctx.parseProgram(JSON.stringify({ ...base, code: "sk-abc123", revision: 3 })).err, undefined);
  assert.match(vctx.parseProgram(JSON.stringify({ ...base, code: "x" })).err, /"code" muss 4 bis 24 Zeichen/);
  assert.match(vctx.parseProgram(JSON.stringify({ ...base, revision: 0 })).err, /"revision" muss eine ganze Zahl ab 1/);
  const out = JSON.parse(JSON.stringify(vctx.exportTranslate(vctx.parseProgram(JSON.stringify({ ...base, code: "sk-abc123", revision: 3 })).prog)));
  assert.equal(out.code, "sk-abc123");
  assert.equal(out.revision, 3);
});

test("Duplikat-Erkennung ignoriert code und revision (Inhalt zählt)", () => {
  const sigSlice = slice("function stableStringify", "function prepareProgramImport");
  vm.runInContext(sigSlice, vctx);
  const mk = code => vctx.parseProgram(JSON.stringify({ format: "trainings-block", version: 2, name: "Sig-Test", code,
    categories: { grund: { label: "Grund", color: "amber", rest: 120 } },
    weeks: [{ n: 1, phase: "aufbau", label: "Aufbau", rir: "3", note: "", sets: { grund: 3 } }],
    days: [{ key: "A", weekday: "Montag", title: "Tag A", exercises: [{ name: "Kniebeuge", category: "grund", weighted: true, increment: 2.5, startWeight: 60 }] }] })).prog;
  assert.equal(vctx.programSignature(mk("sk-eins11")), vctx.programSignature(mk("sk-zwei22")));
});

test("Zielwahl: Code-Treffer haben Vorrang vor Namens-Treffern", () => {
  ctx.S.programs = { a: { name: "Anders" }, b: { name: "Plan" } };
  ctx.S.active = "b";
  assert.equal(ctx.importUpdateTargetId({ codeIds: ["a"], sameNameIds: ["b"] }), "a");
  assert.equal(ctx.importUpdateTargetId({ codeIds: [], sameNameIds: ["b"] }), "b");
});

test("Kennungs-Vergabe: neue Programme frisch, Ersetzen behält Code und zählt den Stand hoch", () => {
  assert.match(html, /function genProgramCode\(\)/);
  assert.match(html, /p\.id=genId\(\);while\(S\.programs\[p\.id\]\)p\.id=genId\(\);p\.code=genProgramCode\(\);p\.rev=1;/, "Import vergibt frische Kennung");
  assert.match(html, /while\(S\.programs\[p\.id\]\)p\.id=genId\(\);p\.code=genProgramCode\(\);p\.rev=1;p\.createdAt/, "Editor-Kopie vergibt frische Kennung");
  assert.match(html, /next\.id=genId\(\);next\.code=genProgramCode\(\);next\.rev=1;/, "Folgeblock vergibt frische Kennung");
  const keepMatches = html.match(/p\.code=oldProg\.code\|\|p\.code;p\.rev=\(Number\(oldProg\.rev\)\|\|1\)\+1;/g) || [];
  assert.equal(keepMatches.length, 2, "beide Ersetzen-Wege behalten Code und erhöhen den Stand");
  assert.match(html, /ensureProgramCode\(p\);var out=exportTranslate\(p\)/, "Export stellt die Kennung sicher");
});

test("Popup: Duplikat und Update-Erkennung melden sich als Modal mit den richtigen Aktionen", () => {
  assert.match(html, /matchPopupShown/);
  assert.match(html, /showModal\("Programm bereits vorhanden"/);
  assert.match(html, /showModal\("Update erkannt"/);
  assert.match(html, /gleiche Kennung/);
  assert.match(html, /wird es in „"\+esc\(p\.name\)\+"“ umbenannt/);
  assert.match(html, /Dein Programm wurde seit diesem Export geändert/);
  assert.match(html, /\{label:"Erst ansehen",action:null\}/);
});

/* ---------- Export mit aktuellen Arbeitsgewichten ---------- */

test("Export: Gewichtsübungen bekommen das aktuelle Arbeitsgewicht als Startgewicht, andere bleiben unberührt", () => {
  const xctx = {
    S: { active: "x", store: { x: { logs: {} } } },
    newStore: () => ({}),
    PROG: () => ({ days: [{ key: "A", ex: [
      { id: "A_0", name: "Beinpresse", w: true, def: 40 },
      { id: "A_1", name: "Plank", unit: "seconds" }
    ] }] }),
    exportTranslate: () => ({ name: "Plan", days: [{ key: "A", exercises: [
      { name: "Beinpresse", weighted: true, startWeight: 40, increment: 5 },
      { name: "Plank", unit: "seconds" }
    ] }] }),
    followupStartWeight: (p, s, d, ex) => (ex.id === "A_0" ? 55 : null),
    ensureProgramCode: () => "sk-test"
  };
  vm.createContext(xctx);
  vm.runInContext(slice("function exportCurrentJSON", "function externalAiPrompt"), xctx);
  const out = JSON.parse(xctx.exportCurrentJSON());
  assert.equal(out.days[0].exercises[0].startWeight, 55, "aktuelles Gewicht statt Woche-1-Wert");
  assert.ok(!("startWeight" in out.days[0].exercises[1]), "Zeitübung bleibt ohne Gewicht");
});

test("Export: Hinweistext nennt die aktuellen Arbeitsgewichte, Link-Teilen bleibt ohne sie", () => {
  assert.match(html, /mit deinen aktuellen Arbeitsgewichten als Startgewichte/);
  assert.match(html, /function exportCurrentJSON\(\)\{[\s\S]*?followupStartWeight\(p,store,day,ex\)/);
  // Link teilen exportiert weiterhin direkt (ohne followupStartWeight):
  assert.match(html, /Link teilen[\s\S]{0,200}?exportTranslate\(PROG\(\)\)/);
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
