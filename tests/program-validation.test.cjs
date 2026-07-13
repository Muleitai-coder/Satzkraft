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
  WD_MAP: { montag: 0, dienstag: 1, mittwoch: 2, donnerstag: 3, freitag: 4, samstag: 5, sonntag: 6 },
  VALID_PROGRESSION_MODES: ["weight", "added_weight", "reps", "seconds", "progression", "none"],
  WUCD_SET: { Armkreisen: 1, Kindhaltung: 1 },
  ANLEITUNG: {},
  esc: value => String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
  wucdSan: list => Array.isArray(list) ? list.map(item => ({ name: item.name, sec: item.seconds })) : []
};
vm.createContext(context);
vm.runInContext(html.slice(start, end), context);

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
  const result = parse(validProgram());
  assert.equal(result.err, undefined);
  assert.equal(result.prog.days[0].ex[0].name, "Mein frei erfundener Kabelzug");
  assert.equal(result.prog.days[0].ex[0].proxy, "Eigene Ersatzbewegung");
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
