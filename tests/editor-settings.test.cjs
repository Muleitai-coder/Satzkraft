// Prüft die Einstellmöglichkeiten des Programm-Editors:
// 1. Abdeckungsmatrix – bewusst sichtbare vs. bewusst verborgene Felder
// 2. RIR-Auswahl mit Bereichen (wie in den mitgelieferten Vorlagen)
// 3. Untertitel („art“) und Bereich („bereich“) im Details-Tab
// 4. Live-Warnhinweise für Werte, die parseProgram beim Speichern ablehnen würde
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

/* ---------- Editor-Kontext: Helfer + Handler + Warnhinweise ---------- */

const ctx = {
  LIMITS: { maxDays: 7, maxWeeks: 16, maxExPerDay: 12, maxSets: 10, maxNameLen: 30, maxLabelLen: 16 },
  editorWeekIndex: 0,
  editorUndoStack: [],
  document: { getElementById: () => null, querySelector: () => null }
};
vm.createContext(ctx);
vm.runInContext(slice("function cloneJSON", "function editorBuildRefMap"), ctx);
vm.runInContext(slice("function editorPhaseLabel", "function editorRirOptions"), ctx);
vm.runInContext(slice("function editorDraftSets", "function editorExerciseMeta"), ctx);
vm.runInContext(slice("function editorFieldValue", "function editorAddCategory"), ctx);
ctx.editorOption = (value, label, current) => "[" + value + (String(current) === String(value) ? "*" : "") + "]";
vm.runInContext(slice("function editorRirOptions", "function editorDraftSets"), ctx);

function draft() {
  return {
    format: "trainings-block", version: 2, name: "Testplan", description: "Prüfplan",
    categories: {
      grund: { label: "Grundübungen", color: "amber", rest: 150, reps: { aufbau: [6, 10], intensiv: [5, 8], deload: [8, 10] } },
      core: { label: "Core", color: "sky", rest: 60 }
    },
    weeks: [
      { n: 1, phase: "aufbau", label: "Aufbau", rir: "3", note: "", sets: { grund: 3, core: 2 } },
      { n: 2, phase: "deload", label: "Erholungswoche", rir: "4-5", note: "", sets: { grund: 2, core: 1 } }
    ],
    days: [{
      key: "A", weekday: "Montag", title: "Ganzkörper", exercises: [
        { name: "Beinpresse", category: "grund", weighted: true, increment: 5, startWeight: 40 },
        { name: "Plank", category: "core", unit: "seconds", timerMode: "target", sets: 2, reps: [20, 45] }
      ]
    }]
  };
}
function input(dataset, value, type) {
  return { type: type || "number", value: String(value), checked: value === true, dataset };
}

/* ---------- 1. Abdeckungsmatrix ---------- */

test("Matrix: Wochen, Trainingsgruppen, Tage und Übungen bleiben vollständig einstellbar", () => {
  ["phase", "label", "rir", "note", "weekday", "title", "category", "exerciseType", "timerMode",
   "repMin", "repMax", "startWeight", "increment", "target", "cue", "video", "proxy", "rest", "color"]
    .forEach(f => assert.match(html, new RegExp(`data-ed-field="${f}"`), `Editor-Feld ${f} fehlt`));
  assert.match(html, /data-ed-set=/);
  assert.match(html, /data-ed-rep=/);
  assert.match(html, /data-ed-wucd=/);
});

test("Matrix: Progressions-Settings, progressionMode und fromWeek/untilWeek bleiben bewusst ohne Editor-Oberfläche", () => {
  assert.ok(!/data-ed-(field|program)="?(deloadMultiplier|postDeloadReturnMultiplier|requireAllSetsForIncrease|allowAutoDecrease|progressionSystem|progressionMode|fromWeek|untilWeek)/.test(html));
  // Das Format kann sie weiterhin (Validierung vorhanden), Import-Werte bleiben also erhalten:
  assert.match(html, /"deloadMultiplier" muss zwischen 0\.1 und 1 liegen/);
  assert.match(html, /unbekannter "progressionMode"/);
});

/* ---------- 2. RIR-Auswahl mit Bereichen ---------- */

test("RIR: Einzelwerte 0–4 und Bereiche 4-5, 3-4, 2-3, 1-2 sind wählbar; unbekannte Werte bleiben erhalten", () => {
  const options = ctx.editorRirOptions("3-4");
  ["[4-5]", "[4]", "[3-4*]", "[3]", "[2-3]", "[2]", "[1-2]", "[1]", "[0]"].forEach(o =>
    assert.ok(options.indexOf(o) >= 0, `RIR-Option ${o} fehlt: ${options}`));
  assert.ok(ctx.editorRirOptions("5-6").indexOf("[5-6*]") >= 0, "Bisheriger unbekannter Wert bleibt wählbar");
});

test("RIR: Vorlagen-Werte sind jetzt ohne Umweg im Editor wählbar", () => {
  const vorlage = JSON.parse(fs.readFileSync(new URL("../programme/gym-ganzkoerper-beginner.json", `file://${__dirname}/`), "utf8"));
  const alleRir = vorlage.weeks.map(w => String(w.rir));
  const options = ctx.editorRirOptions("");
  alleRir.forEach(r => assert.ok(options.indexOf("[" + r + "]") >= 0, `Vorlagen-RIR ${r} nicht wählbar`));
});

/* ---------- 3. Untertitel und Bereich im Details-Tab ---------- */

test("Details-Tab rendert Untertitel- und Bereichs-Feld", () => {
  assert.match(html, /data-ed-program="art"/);
  assert.match(html, /<select data-ed-program="bereich">/);
  assert.match(html, />Kein Bereich</);
});

test("Handler: Untertitel und Bereich werden gesetzt und bei Leerung wieder entfernt", () => {
  ctx.editorDraft = draft();
  ctx.updateEditorInput(input({ edProgram: "art" }, "Einsteiger", "text"));
  ctx.updateEditorInput(input({ edProgram: "bereich" }, "Ganzkörper", "select"));
  assert.equal(ctx.editorDraft.art, "Einsteiger");
  assert.equal(ctx.editorDraft.bereich, "Ganzkörper");
  ctx.updateEditorInput(input({ edProgram: "art" }, "  ", "text"));
  ctx.updateEditorInput(input({ edProgram: "bereich" }, "", "select"));
  assert.ok(!("art" in ctx.editorDraft), "leerer Untertitel wird entfernt (sonst Speicherfehler)");
  assert.ok(!("bereich" in ctx.editorDraft), "leerer Bereich wird entfernt (sonst Speicherfehler)");
});

/* ---------- 4. Live-Warnhinweise ---------- */

test("Warnung: verdrehter Wiederholungsbereich einer Übung wird sofort gemeldet", () => {
  ctx.editorDraft = draft();
  ctx.editorDraft.days[0].exercises[1].reps = [45, 20];
  const warn = ctx.editorFieldWarning(input({ edDay: "0", edEx: "1", edField: "repMin" }, 45));
  assert.match(warn, /Min\. ist größer als Max\./);
  ctx.editorDraft.days[0].exercises[1].reps = [20, 45];
  assert.equal(ctx.editorFieldWarning(input({ edDay: "0", edEx: "1", edField: "repMin" }, 20)), "");
});

test("Warnung: Gruppen-Wiederholungsbereich und Satzpause außerhalb der Speichergrenzen", () => {
  ctx.editorDraft = draft();
  ctx.editorDraft.categories.grund.reps.aufbau = [12, 8];
  assert.match(ctx.editorFieldWarning(input({ edCat: "grund", edRep: "aufbau", edRange: "0" }, 12)), /Min\. ist größer als Max\./);
  ctx.editorDraft.categories.grund.rest = 5;
  assert.match(ctx.editorFieldWarning(input({ edCat: "grund", edField: "rest" }, 5)), /15 und 600/);
  ctx.editorDraft.categories.grund.rest = 180;
  assert.equal(ctx.editorFieldWarning(input({ edCat: "grund", edField: "rest" }, 180)), "");
});

test("Warnung: Satzzahlen prüfen Grenzen und fehlende Werte benutzter Gruppen", () => {
  ctx.editorDraft = draft();
  ctx.editorDraft.weeks[0].sets.grund = 0;
  assert.match(ctx.editorFieldWarning(input({ edWeek: "0", edSet: "grund" }, 0)), /1 bis 10/);
  ctx.editorDraft.weeks[0].sets.grund = "";
  assert.match(ctx.editorFieldWarning(input({ edWeek: "0", edSet: "grund" }, "")), /braucht hier eine Satzzahl/);
  ctx.editorDraft.weeks[0].sets.grund = 3;
  assert.equal(ctx.editorFieldWarning(input({ edWeek: "0", edSet: "grund" }, 3)), "");
});

test("Warnung: Startgewicht und Steigerung entsprechen den Speichergrenzen", () => {
  ctx.editorDraft = draft();
  ctx.editorDraft.days[0].exercises[0].startWeight = 2500;
  assert.match(ctx.editorFieldWarning(input({ edDay: "0", edEx: "0", edField: "startWeight" }, 2500)), /0 und 2000/);
  ctx.editorDraft.days[0].exercises[0].startWeight = 40;
  ctx.editorDraft.days[0].exercises[0].increment = 0;
  assert.match(ctx.editorFieldWarning(input({ edDay: "0", edEx: "0", edField: "increment" }, 0)), /0,1 bis 100/);
  ctx.editorDraft.days[0].exercises[0].increment = 2.5;
  assert.equal(ctx.editorFieldWarning(input({ edDay: "0", edEx: "0", edField: "increment" }, 2.5)), "");
});

test("Warnhinweise sind nach jedem Editor-Aufbau und bei jeder Eingabe eingehängt", () => {
  assert.match(html, /editorApplyAllFieldWarnings\(\);\n}\nfunction showEditorHelp/);
  assert.match(html, /updateEditorInput\(t\);editorRefreshFieldWarnings\(t\);/);
  assert.match(html, /\.edfieldwarn\{[^}]*var\(--danger\)/);
});

/* ---------- Speichern: neue Felder überstehen parseProgram ---------- */

const vctx = {
  CAT_COLORS: ["amber", "emerald", "violet", "sky", "orange", "rose", "slate"],
  LIMITS: ctx.LIMITS,
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

test("Im Editor gesetzte Untertitel/Bereiche passieren die Speicher-Validierung und den Export", () => {
  ctx.editorDraft = draft();
  ctx.updateEditorInput(input({ edProgram: "art" }, "Einsteiger", "text"));
  ctx.updateEditorInput(input({ edProgram: "bereich" }, "Ganzkörper", "select"));
  ctx.updateEditorInput(input({ edWeek: "0", edField: "rir" }, "2-3", "select"));
  const checked = vctx.parseProgram(JSON.stringify(ctx.editorDraft));
  assert.equal(checked.err, undefined);
  const out = JSON.parse(JSON.stringify(vctx.exportTranslate(checked.prog)));
  assert.equal(out.art, "Einsteiger");
  assert.equal(out.bereich, "Ganzkörper");
  assert.equal(out.weeks[0].rir, "2-3");
});
