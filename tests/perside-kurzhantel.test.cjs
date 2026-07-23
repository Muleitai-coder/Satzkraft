// Prüft „je Seite“-Kennzeichnung (perSide/einseitig) und den Kurzhantel-Gewichtshinweis:
// 1. Format: perSide validiert, importiert und exportiert
// 2. Bibliothek: einseitige Übungen sind markiert, Editor übernimmt die Markierung
// 3. Anzeige: Training, Vorschau und Editor hängen „je Seite“ an
// 4. Kurzhantel-Erkennung über das Equipment-Feld der Bibliothek
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const root = new URL("../", `file://${__dirname}/`);
const html = fs.readFileSync(new URL("index.html", root), "utf8");
const library = JSON.parse(fs.readFileSync(new URL("uebungen.json", root), "utf8"));

function slice(from, to) {
  const start = html.indexOf(from);
  const end = html.indexOf(to, start);
  assert.ok(start >= 0 && end > start, `Abschnitt ${from} … ${to} nicht gefunden`);
  return html.slice(start, end);
}

/* ---------- 1. Format: Validierung + Roundtrip ---------- */

const vctx = {
  CAT_COLORS: ["amber", "emerald", "violet", "sky", "orange", "rose", "slate"],
  LIMITS: { maxDays: 7, maxWeeks: 16, maxExPerDay: 12, maxSets: 10, maxNameLen: 30, maxLabelLen: 16 },
  WD_MAP: { montag: 0, dienstag: 1, mittwoch: 2, donnerstag: 3, freitag: 4, samstag: 5, sonntag: 6 },
  WD_CANON: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
  VALID_PROGRESSION_MODES: ["weight", "added_weight", "reps", "seconds", "progression", "none"],
  ANLEITUNG: { erlaubte_werte: {} },
  esc: v => String(v == null ? "" : v),
  wucdSan: list => Array.isArray(list) ? list.map(i => ({ name: i.name, sec: i.seconds })) : [],
  S: { programs: {} }
};
vm.createContext(vctx);
vm.runInContext(slice("var BEREICHE=", "var DEFAULT_PROGRAM="), vctx);
vm.runInContext(slice("var WUCD_LIB=", "function wucdSan"), vctx);
vm.runInContext(slice("function genId()", "function setActive("), vctx);

function program(perSideValue) {
  const p = {
    format: "trainings-block", version: 2, name: "Seiten-Test",
    categories: { grund: { label: "Grund", color: "amber", rest: 120, reps: { aufbau: [8, 12] } } },
    weeks: [{ n: 1, phase: "aufbau", label: "Aufbau", rir: "3", note: "", sets: { grund: 3 } }],
    days: [{ key: "A", weekday: "Montag", title: "Tag A", exercises: [
      { name: "Ausfallschritte", category: "grund" }
    ] }]
  };
  if (perSideValue !== undefined) p.days[0].exercises[0].perSide = perSideValue;
  return p;
}

test("perSide: true und false sind gültig, andere Werte werden mit klarer Meldung abgelehnt", () => {
  assert.equal(vctx.parseProgram(JSON.stringify(program(true))).err, undefined);
  assert.equal(vctx.parseProgram(JSON.stringify(program(false))).err, undefined);
  assert.equal(vctx.parseProgram(JSON.stringify(program())).err, undefined);
  assert.match(vctx.parseProgram(JSON.stringify(program("ja"))).err, /"perSide" muss true oder false sein/);
});

test("perSide: true übersteht Import und Export, false wird beim Export weggelassen", () => {
  const outTrue = JSON.parse(JSON.stringify(vctx.exportTranslate(vctx.parseProgram(JSON.stringify(program(true))).prog)));
  assert.equal(outTrue.days[0].exercises[0].perSide, true);
  const outFalse = JSON.parse(JSON.stringify(vctx.exportTranslate(vctx.parseProgram(JSON.stringify(program(false))).prog)));
  assert.ok(!("perSide" in outFalse.days[0].exercises[0]));
});

/* ---------- 2. Bibliothek + Editor-Übernahme ---------- */

test("Bibliothek: 22 einseitige Übungen sind markiert, nur mit Wert true", () => {
  const marked = library.filter(e => "einseitig" in e);
  assert.equal(marked.length, 22);
  marked.forEach(e => assert.equal(e.einseitig, true, e.de));
  const names = new Set(marked.map(e => e.de));
  ["Ausfallschritte", "Seitstütz", "Bulgarian Split Squats", "Kurzhantel-Rudern einarmig", "Dead Bug"].forEach(n =>
    assert.ok(names.has(n), `${n} sollte als einseitig markiert sein`));
});

const ectx = { editorWeekIndex: 0, editorUndoStack: [], document: { getElementById: () => null } };
vm.createContext(ectx);
vm.runInContext(slice("function editorLibraryTypeSignature", "function editorExerciseLibraryWouldOverwrite"), ectx);
vm.runInContext(slice("function editorApplyExerciseLibraryEntry", "function editorChooseExerciseLibraryEntry"), ectx);
vm.runInContext(slice("function editorExerciseType(", "function editorExerciseTypeOptions"), ectx);
vm.runInContext(slice("function editorDraftSets", "function editorExerciseMeta"), ectx);
vm.runInContext(slice("function editorExerciseMeta", "function editorExerciseType("), ectx);
vm.runInContext(slice("function editorFieldValue", "function editorAddCategory"), ectx);
ectx.esc = v => String(v == null ? "" : v);
ectx.fmtSecondsRange = (a, b) => a + "–" + b + " s";

test("Editor: Bibliotheks-Übernahme setzt und entfernt die Seiten-Markierung", () => {
  const entry = library.find(e => e.de === "Ausfallschritte");
  const ex = { name: "", category: "grund" };
  ectx.editorApplyExerciseLibraryEntry(ex, JSON.parse(JSON.stringify(entry)));
  assert.equal(ex.perSide, true);
  const beidseitig = library.find(e => e.de === "Bankdrücken");
  ectx.editorApplyExerciseLibraryEntry(ex, JSON.parse(JSON.stringify(beidseitig)));
  assert.ok(!("perSide" in ex));
});

test("Editor: Häkchen 'Je Seite ausführen' setzt und löscht das Feld und aktualisiert die Ansicht", () => {
  assert.match(html, /data-ed-field="perSide"/);
  assert.match(html, /Je Seite ausführen/);
  ectx.editorDraft = { days: [{ exercises: [{ name: "Ausfallschritte", category: "grund" }] }], weeks: [{ phase: "aufbau", sets: { grund: 3 } }], categories: { grund: { reps: { aufbau: [8, 12] } } } };
  const target = val => ({ type: "checkbox", checked: val, value: "", dataset: { edDay: "0", edEx: "0", edField: "perSide" } });
  assert.equal(ectx.updateEditorInput(target(true)), true);
  assert.equal(ectx.editorDraft.days[0].exercises[0].perSide, true);
  assert.equal(ectx.updateEditorInput(target(false)), true);
  assert.ok(!("perSide" in ectx.editorDraft.days[0].exercises[0]));
});

/* ---------- 3. Anzeige „je Seite“ ---------- */

test("Anzeige: Training (Karte + Kompaktzeile), Vorschau und Editor hängen 'je Seite' an", () => {
  const matches = html.match(/ex\.perSide\?['"] je Seite['"]:/g) || [];
  assert.ok(matches.length >= 4, `nur ${matches.length} Anzeige-Stellen gefunden`);
  const meta = ectx.editorExerciseMeta(
    { name: "Ausfallschritte", category: "grund", perSide: true },
    { categories: { grund: { label: "Grund", reps: { aufbau: [8, 12] } } }, weeks: [{ phase: "aufbau", sets: { grund: 3 } }] }
  );
  assert.match(meta, /8–12 Wdh je Seite/);
});

test("Vorlagen: einseitige Übungen der vier Programme tragen perSide und laden fehlerfrei", () => {
  let marked = 0;
  for (const file of fs.readdirSync(new URL("programme/", root)).filter(n => n.endsWith(".json"))) {
    const raw = fs.readFileSync(new URL(`programme/${file}`, root), "utf8");
    assert.equal(vctx.parseProgram(raw).err, undefined, file);
    marked += (raw.match(/"perSide": true/g) || []).length;
  }
  assert.equal(marked, 12);
});

/* ---------- 4. Kurzhantel-Hinweis ---------- */

test("Kurzhantel-Erkennung nutzt das Equipment-Feld der Bibliothek (auch über Alias-Namen)", () => {
  const lctx = { EXERCISE_LIBRARY: null, EXERCISE_ALIAS_INDEX: null };
  vm.createContext(lctx);
  vm.runInContext(slice("function normalizeExerciseLibraryName", "function exerciseLibraryMatches"), lctx);
  lctx.setExerciseLibrary(JSON.parse(JSON.stringify(library)));
  assert.equal(lctx.exerciseUsesDumbbells("Kurzhantel-Bankdrücken"), true);
  assert.equal(lctx.exerciseUsesDumbbells("Dumbbell Bench Press"), true);
  assert.equal(lctx.exerciseUsesDumbbells("Bankdrücken"), false);
  assert.equal(lctx.exerciseUsesDumbbells("Unbekannte Übung"), false);
});

test("Kurzhantel-Hinweis, Startgewicht-Konventionen und Scheibenrechner-Titel sind eingebaut", () => {
  assert.match(html, /khnote">Kurzhantel-Übung: Trag das Gewicht einer Hantel ein\./);
  assert.match(html, /ex\.w&&!ex\.bw&&exerciseUsesDumbbells\(displayName\)/);
  assert.match(html, /Was zählt als Gewicht\?/);
  assert.match(html, /Scheiben pro Seite \(Langhantel\)/);
  assert.match(html, /loadExerciseLibrary\(\)\.then\(function\(\)\{renderView\(\);\}\);/);
  assert.match(html, /\.khnote\{/);
});
