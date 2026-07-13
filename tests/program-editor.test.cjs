const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const start = html.indexOf('function cloneJSON');
const end = html.indexOf('function openProgramEditor', start);
assert.ok(start >= 0 && end > start, 'Editor-Hilfsfunktionen wurden nicht gefunden');

const context = {};
vm.createContext(context);
vm.runInContext(html.slice(start, end), context);

test('creates stable category keys without overwriting existing categories', () => {
  assert.equal(context.editorNextCategoryKey({}), 'kategorie');
  assert.equal(context.editorNextCategoryKey({ kategorie: {}, kategorie2: {} }), 'kategorie3');
});

test('creates unique compact day keys', () => {
  assert.equal(context.editorNextDayKey([{ key: 'A' }, { key: 'C' }]), 'B');
  const alphabet = Array.from({ length: 26 }, (_, index) => ({ key: String.fromCharCode(65 + index) }));
  assert.equal(context.editorNextDayKey(alphabet), 'Tag1');
});

test('detects categories that are still used by exercises', () => {
  const draft = { days: [{ exercises: [{ category: 'kraft' }] }, { exercises: [{ category: 'core' }] }] };
  assert.equal(context.editorCategoryInUse(draft, 'kraft'), true);
  assert.equal(context.editorCategoryInUse(draft, 'mobilitaet'), false);
});

test('renumbers weeks after structural edits', () => {
  const draft = { weeks: [{ n: 1 }, { n: 3 }, { n: 8 }] };
  context.editorRenumberWeeks(draft);
  assert.deepEqual(draft.weeks.map(week => week.n), [1, 2, 3]);
});

test('keeps editor drafts deeply separated from the original program', () => {
  assert.match(html, /editorDraft=cloneJSON\(exportTranslate\(p\)\)/);
  const original = { weeks: [{ sets: { kraft: 3 } }], settings: { deloadMultiplier: 0.6 } };
  const draft = context.cloneJSON(original);
  draft.weeks[0].sets.neu = 4;
  draft.settings.deloadMultiplier = 0.5;
  assert.deepEqual(original, { weeks: [{ sets: { kraft: 3 } }], settings: { deloadMultiplier: 0.6 } });
});
