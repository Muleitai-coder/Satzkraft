// Die API-Coach-Funktion ist entfernt. Diese Tests sichern den Altbestand
// und die weiterhin vorhandenen lokalen Programmwege statt des alten Wizards.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
function between(start, end) {
  const a = html.indexOf(start), b = html.indexOf(end, a);
  assert.ok(a >= 0 && b > a, `${start} fehlt`);
  return html.slice(a, b);
}
function cleanupContext({ blocked = false, fail = false } = {}) {
  const storage = new Map([
    ['cali-plan-v3', '{"programs":{"old":{"source":"coach"}}}'],
    ['satzkraft-coach-prefs', '{"answers":{"limits":["Schulter"]}}'],
    ['unrelated-origin-key', 'keep']
  ]);
  const writes = [];
  const context = {
    localWriteBlocked: () => blocked,
    localStorage: {
      getItem: key => storage.has(key) ? storage.get(key) : null,
      setItem: (key, value) => { if (fail) throw Error('blocked'); writes.push(key); storage.set(key, value); },
      removeItem: key => { writes.push(key); storage.delete(key); }
    }
  };
  vm.createContext(context);
  vm.runInContext(between('function removeLegacyCoachAnswers()', 'function localAppStorageKeys()'), context);
  return { context, storage, writes };
}
test('removes legacy answers while preserving programs and unrelated origin data', () => {
  const { context, storage } = cleanupContext();
  const program = storage.get('cali-plan-v3');
  assert.equal(context.removeLegacyCoachAnswers(), true);
  assert.equal(storage.has('satzkraft-coach-prefs'), false);
  assert.match(storage.get('satzkraft-coach-reset-v1'), /^removed-api-/);
  assert.equal(storage.get('cali-plan-v3'), program);
  assert.equal(storage.get('unrelated-origin-key'), 'keep');
});
test('does not write again on subsequent starts without legacy answers', () => {
  const { context, writes } = cleanupContext();
  context.removeLegacyCoachAnswers();
  const first = writes.length;
  assert.equal(context.removeLegacyCoachAnswers(), true);
  assert.equal(writes.length, first);
});
test('does not purge during a reset or discard answers after a storage failure', () => {
  const blocked = cleanupContext({ blocked: true });
  assert.equal(blocked.context.removeLegacyCoachAnswers(), false);
  assert.equal(blocked.writes.length, 0);
  const failed = cleanupContext({ fail: true });
  assert.equal(failed.context.removeLegacyCoachAnswers(), false);
  assert.equal(failed.storage.has('satzkraft-coach-prefs'), true);
});
test('keeps the external AI prompt as local JSON text without fetching an API', () => {
  const context = { BLANK_TEMPLATE: { format: 'trainings-block', version: 2 }, JSON };
  vm.createContext(context);
  const source = between('function externalAiPrompt(wish)', 'function confirmReset()');
  vm.runInContext(source, context);
  assert.match(context.externalAiPrompt('3 Tage mit Kurzhanteln'), /3 Tage mit Kurzhanteln/);
  assert.match(context.externalAiPrompt('3 Tage'), /trainings-block/);
  assert.doesNotMatch(source, /fetch\(/);
  assert.match(html, /id="externalaibtn"/);
  assert.match(html, /id="importbtn"/);
  assert.doesNotMatch(html, /id="coachbtn"|function renderCoach\(|coachAbort\(|saveCoachPreferences\(/);
});
test('legacy coach programs complete a block without calling the removed coach', () => {
  let actions;
  const program = { name: 'Altes Programm', source: 'coach' };
  const store = { logs: {}, history: [] };
  const context = {
    S: { active: 'old', programs: { old: program }, store: { old: store } },
    programBlockComplete: () => true,
    flushSave() {},
    buildReportData: () => ({ exercises: [], completedSessions: 1, totalDuration: 600 }),
    topBlockImprovements: () => [],
    reportDuration: () => '10 Min',
    esc: String,
    showModal: (title, body, buttons) => { actions = buttons; }
  };
  vm.createContext(context);
  vm.runInContext(between('function maybeShowBlockSuccess(', 'function reportNumber('), context);
  assert.equal(context.maybeShowBlockSuccess('old'), true);
  assert.ok(actions.some(action => action.label === 'Folgeblock starten'));
  assert.equal(actions.some(action => /KI-Coach/.test(action.label)), false);
});
test('parses all inline scripts and keeps schema and format compatibility', () => {
  for (const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(script[1]);
  assert.match(html, /DATA_SCHEMA_VERSION=5/);
  assert.match(html, /var KEY="cali-plan-v3"/);
  assert.match(html, /program\.source!=="coach"/);
  assert.match(html, /if\(oldProg\.source\)p\.source=oldProg\.source/);
  assert.match(html, /function initializeWritableApp\(\)\{[\s\S]*removeLegacyCoachAnswers\(\);\s*renderView\(\);renderBar\(\)/);
});
