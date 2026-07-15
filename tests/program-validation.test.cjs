const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync(new URL("../index.html", `file://${__dirname}/`), "utf8");
const start = html.indexOf("function genId()");
const end = html.indexOf("function setActive(", start);
assert.ok(start > 0 && end > start, "validation source section must exist");

const context = {
  CAT_COLORS: ["amber", "emerald", "violet", "sky", "orange", "rose", "slate"],
  LIMITS: { maxDays: 7, maxWeeks: 16, maxExPerDay: 12, maxSets: 10, maxNameLen: 30, maxLabelLen: 16 },
  WD_MAP: { montag: 0, mo: 0, monday: 0, dienstag: 1, di: 1, tuesday: 1, mittwoch: 2, mi: 2, wednesday: 2, donnerstag: 3, do: 3, thursday: 3, freitag: 4, fr: 4, friday: 4, samstag: 5, sa: 5, saturday: 5, sonntag: 6, so: 6, sunday: 6 },
  WD_CANON: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
  VALID_PROGRESSION_MODES: ["weight", "added_weight", "reps", "seconds", "progression", "none"],
  WUCD_SET: { Armkreisen: 1, "Kniebeugen ohne Gewicht": 1, "Cat-Cow": 1, "Brustdehnung Türrahmen": 1, Kindhaltung: 1 },
  ANLEITUNG: {},
  esc: value => String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
  wucdSan: list => Array.isArray(list) ? list.map(item => ({ name: item.name, sec: item.seconds })) : [],
  S: { programs: {} },
  cloneJSON: value => JSON.parse(JSON.stringify(value)),
  newStore: program => ({ week: 1, day: program.days[0].key }),
  flushSave() {},
  renderLib() {},
  closeLib() {},
  showModal() {},
  setActive(id) { context.S.active = id; }
};
vm.createContext(context);
vm.runInContext(html.slice(start, end), context);

const importStart = html.indexOf("var pendingProgramImport=");
const importEnd = html.indexOf("function deleteProgram", importStart);
assert.ok(importStart > 0 && importEnd > importStart, "import preparation source section must exist");
vm.runInContext(html.slice(importStart, importEnd), context);

const manualStart = html.indexOf("var manualCreatorState=");
const manualEnd = html.indexOf("var surfaceScrollY", manualStart);
assert.ok(manualStart > 0 && manualEnd > manualStart, "manual creator source section must exist");
vm.runInContext(html.slice(manualStart, manualEnd), context);

function validProgram() {
  return {
    format: "trainings-block",
    version: 2,
    name: "Freier KI-Plan",
    description: "Ein frei benannter Plan aus einer beliebigen KI.",
    settings: {
      progressionSystem: "double_progression",
      deloadMultiplier: 0.6,
      requireAllSetsForIncrease: true,
      allowAutoDecrease: true,
      postDeloadReturnMultiplier: 0.925
    },
    categories: {
      frei: { label: "Freie Kategorie", color: "emerald", rest: 90, reps: { aufbau: [8, 12] } }
    },
    weeks: [{ n: 1, phase: "aufbau", label: "Aufbau", rir: "2", note: "Start", sets: { frei: 3 } }],
    days: [{
      key: "A",
      weekday: "Montag",
      title: "Freier Tag",
      exercises: [{
        name: "Mein frei erfundener Kabelzug",
        category: "frei",
        weighted: true,
        increment: 2.5,
        startWeight: 20,
        proxy: "Eigene Ersatzbewegung"
      }]
    }]
  };
}

function parse(program) {
  return context.parseProgram(JSON.stringify(program));
}

test("accepts arbitrary exercise names and preserves supported fields", () => {
  const program = validProgram();
  program.days[0].exercises[0].sets = 4;
  program.days[0].exercises[0].reps = [6, 9];
  const result = parse(program);
  assert.equal(result.err, undefined);
  assert.equal(result.prog.days[0].ex[0].name, "Mein frei erfundener Kabelzug");
  assert.equal(result.prog.days[0].ex[0].proxy, "Eigene Ersatzbewegung");
  assert.equal(result.prog.days[0].ex[0].sets, 4);
  assert.deepEqual(Array.from(result.prog.days[0].ex[0].reps), [6, 9]);
  assert.equal(result.prog.description, "Ein frei benannter Plan aus einer beliebigen KI.");
});

test("rejects invalid phases, weekdays and negative sets", () => {
  const phase = validProgram();
  phase.weeks[0].phase = "banana";
  assert.match(parse(phase).err, /unbekannte Phase/);

  const weekday = validProgram();
  weekday.days[0].weekday = "Irgendwann";
  assert.match(parse(weekday).err, /gültiger Wochentag/);

  const sets = validProgram();
  sets.weeks[0].sets.frei = -3;
  assert.match(parse(sets).err, /zwischen 1 und 10/);

  const exerciseSets = validProgram();
  exerciseSets.days[0].exercises[0].sets = 11;
  assert.match(parse(exerciseSets).err, /"sets".*zwischen 1 und 10/);

  const exerciseReps = validProgram();
  exerciseReps.days[0].exercises[0].reps = [12, 8];
  assert.match(parse(exerciseReps).err, /"reps".*\[min,max\]/);
});

test("rejects unsafe category keys and incomplete week mappings", () => {
  const unsafe = validProgram();
  unsafe.categories = JSON.parse('{"__proto__":{"label":"X","color":"amber","rest":90}}');
  unsafe.days[0].exercises[0].category = "__proto__";
  assert.match(parse(unsafe).err, /Ungültiger Kategorie-Schlüssel/);

  const incomplete = validProgram();
  incomplete.weeks[0].sets = { other: 3 };
  assert.match(parse(incomplete).err, /unbekannte Kategorie|fehlt die verwendete Kategorie/);
});

test("prepares fenced and accompanied AI JSON without saving anything", () => {
  const program = validProgram();
  delete program.days[0].exercises[0].weighted;
  delete program.days[0].exercises[0].increment;
  delete program.days[0].exercises[0].startWeight;
  program.days[0].weekday = "monday";
  program.days[0].exercises[0].unit = "time";
  const before = JSON.stringify(context.S);
  const fenced = `\uFEFF  \n\`\`\`json\n${JSON.stringify(program)}\n\`\`\`  `;
  const prepared = context.prepareProgramImport(fenced, "json", "KI-Antwort");
  assert.equal(prepared.error, undefined);
  assert.equal(prepared.external.days[0].weekday, "Montag");
  assert.equal(prepared.external.days[0].exercises[0].unit, "seconds");
  assert.ok(Array.from(prepared.corrections).some(item => /Codeblock/.test(item)));
  assert.ok(Array.from(prepared.corrections).some(item => /Wochentage/.test(item)));
  assert.equal(JSON.stringify(context.S), before, "preview preparation must not mutate state");

  const accompanied = context.prepareProgramImport(`Hier ist dein Plan:\n${JSON.stringify(program)}\nViel Erfolg!`, "json", "KI-Antwort");
  assert.equal(accompanied.error, undefined);
  assert.ok(Array.from(accompanied.corrections).some(item => /Begleittext/.test(item)));
});

test("returns structured, actionable import errors without guessing missing fields", () => {
  const broken = validProgram();
  delete broken.categories;
  const prepared = context.prepareProgramImport(JSON.stringify(broken), "json", "Fehlerdatei");
  assert.ok(prepared.error);
  assert.equal(typeof prepared.error.area, "string");
  assert.match(prepared.error.remedy, /Trainingsgruppe|Vorlage/);
  assert.match(prepared.error.technical, /categories/);
});

test("detects exact duplicates separately from same-name variants", () => {
  context.S.programs = {};
  const first = context.prepareProgramImport(JSON.stringify(validProgram()), "json", "Erster Import");
  context.S.programs.existing = first.program;
  const duplicate = context.prepareProgramImport(JSON.stringify(validProgram()), "json", "Zweiter Import");
  assert.equal(duplicate.duplicateId, "existing");

  const variant = validProgram();
  variant.days[0].exercises[0].name = "Andere freie Übung";
  const sameName = context.prepareProgramImport(JSON.stringify(variant), "json", "Variante");
  assert.equal(sameName.duplicateId, null);
  assert.deepEqual(Array.from(sameName.sameNameIds), ["existing"]);
});

test("stores previews without activation or activates only on explicit choice", () => {
  context.S = { programs: {}, store: {}, active: "base" };
  const saveOnly = context.prepareProgramImport(JSON.stringify(validProgram()), "json", "Speichern");
  context.pendingProgramImport = saveOnly;
  const savedId = context.storeImportedProgram(false, false);
  assert.ok(context.S.programs[savedId]);
  assert.equal(context.S.active, "base");

  const secondProgram = validProgram();
  secondProgram.name = "Aktivierter Plan";
  const activate = context.prepareProgramImport(JSON.stringify(secondProgram), "json", "Aktivieren");
  context.pendingProgramImport = activate;
  const activeId = context.storeImportedProgram(true, false);
  assert.equal(context.S.active, activeId);
});

test("creates a valid neutral manual draft with a final recovery week", () => {
  const draft = context.createManualProgram({ name: "Mein Plan", description: "Manuell", weeks: 8, days: [4, 0, 2] });
  const checked = context.parseProgram(JSON.stringify(draft));
  assert.equal(checked.err, undefined);
  assert.deepEqual(Array.from(draft.days, day => day.weekday), ["Montag", "Mittwoch", "Freitag"]);
  assert.equal(draft.weeks[0].sets.allgemein, 3);
  assert.equal(draft.weeks[7].phase, "deload");
  assert.equal(draft.weeks[7].sets.allgemein, 2);
  assert.deepEqual(Array.from(draft.categories.allgemein.reps.aufbau), [8, 12]);
});

test("loads the complete manual test program with all exercise scenarios", () => {
  const file = fs.readFileSync(new URL("../TESTPROGRAMM-ALLE-SZENARIEN.json", `file://${__dirname}/`), "utf8");
  const checked = context.parseProgram(file);
  assert.equal(checked.err, undefined);
  const exercises = checked.prog.days.flatMap(day => day.ex);
  assert.ok(exercises.some(ex => ex.name === "Stairmaster" && ex.unit === "seconds" && ex.reps[0] === 1200));
  assert.ok(exercises.some(ex => ex.w && ex.bw));
  assert.ok(exercises.some(ex => ex.w && ex.def === 0 && !ex.bw));
  assert.ok(exercises.some(ex => ex.pmode === "reps"));
  assert.ok(exercises.some(ex => ex.sets === 4 && ex.reps[0] === 6));
});
