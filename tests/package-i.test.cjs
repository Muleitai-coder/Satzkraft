const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');

test('calculates the mathematical weight per side without assuming available plates', () => {
  const start = html.indexOf('function calculatePlateLoad');
  const end = html.indexOf('function plateCalculatorHtml', start);
  assert.ok(start >= 0 && end > start, 'Scheibenrechner wurde nicht gefunden');
  const context = {};
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);

  const result = context.calculatePlateLoad(43.5, 20);
  assert.equal(result.side, 11.75);
  assert.equal(result.below, false);
  assert.equal(result.plates, undefined);

  const belowBar = context.calculatePlateLoad(15, 20);
  assert.equal(belowBar.side, 0);
  assert.equal(belowBar.below, true);
});

test('keeps bar weights and notes in every store lifecycle path', () => {
  assert.match(html, /function newStore\(prog\)\{return\{tg:\{\},barw:\{\},notes:\{\}/);
  assert.match(html, /function syncStore\(\)\{S\.store\[S\.active\]=\{tg:S\.tg,barw:S\.barw,notes:S\.notes/);
  assert.match(html, /S\.tg=st\.tg;S\.barw=st\.barw;S\.notes=st\.notes/);
  assert.match(html, /function migrateReplaceStore[\s\S]*JSON\.parse\(JSON\.stringify\(oldStore/);
  assert.match(html, /st\.barw!=null&&!plainObject\(st\.barw\)/);
  assert.match(html, /notes\[noteKeys\[ni\]\]\.length>500/);
});

test('renders accessible plate and note actions and escapes stored notes', () => {
  assert.match(html, /data-plates=/);
  assert.match(html, /Scheiben pro Seite/);
  assert.match(html, /data-note=/);
  assert.match(html, /maxlength="500"/);
  assert.match(html, /Notiz: '\+esc\(S\.notes\[ex\.id\]\)/);
  assert.match(html, /aria-label="Verlauf für/);
});

test('shows the backup reminder only after fourteen days and a newer unit', () => {
  const start = html.indexOf('function readBackupMeta');
  const end = html.indexOf('function workoutProgress', start);
  assert.ok(start >= 0 && end > start, 'Backup-Erinnerung wurde nicht gefunden');
  const now = Date.now();
  const storage = new Map();
  const context = {
    BACKUP_META_KEY: 'backup-meta',
    S: { store: { active: { history: [] } } },
    localStorage: {
      getItem: key => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value)
    },
    finiteNumber: (value, min, max, integer) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max && (!integer || Number.isInteger(value)),
    syncStore() {},
    backupJSON: () => '{}',
    downloadText: () => true,
    document: { getElementById: () => ({ classList: { contains: () => false } }) },
    renderLib() {},
    renderView() {}
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);

  assert.equal(context.backupReminderDue(now), false, 'frisches Profil darf nicht erinnern');
  context.S.store.active.history.push({ complete: true, start: now, end: now });
  storage.set('backup-meta', JSON.stringify({ lastAt: now - 15 * 86400000, historyCount: 0 }));
  assert.equal(context.backupReminderDue(now), true);
  storage.set('backup-meta', JSON.stringify({ lastAt: now - 15 * 86400000, historyCount: 1 }));
  assert.equal(context.backupReminderDue(now), false, 'ohne neue Einheit keine Erinnerung');
  storage.set('backup-meta', JSON.stringify({ lastAt: now - 15 * 86400000, historyCount: 0, snoozeUntil: now + 6 * 86400000 }));
  assert.equal(context.backupReminderDue(now), false, 'Snooze muss die Erinnerung ausblenden');
  storage.set('backup-meta', JSON.stringify({ lastAt: now - 15 * 86400000, historyCount: 0 }));
  assert.match(context.backupReminderHtml(), /Backup herunterladen/);
  assert.match(context.backupReminderHtml(), /Später/);
});

test('requests persistent browser storage only once', async () => {
  const start = html.indexOf('function requestPersistentStorageOnce');
  const end = html.indexOf('function onSetInput', start);
  const storage = new Map();
  let calls = 0;
  const context = {
    PERSIST_REQUEST_KEY: 'persist-key',
    localStorage: {
      getItem: key => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value)
    },
    navigator: { storage: { persist: async () => { calls++; return true; } } }
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);
  context.requestPersistentStorageOnce();
  context.requestPersistentStorageOnce();
  await Promise.resolve();
  assert.equal(calls, 1);
  assert.equal(storage.get('persist-key'), 'granted');
});

test('uses one hold-timer color and tappable explanation terms', () => {
  assert.doesNotMatch(html, /\.restbar\.holdmode\.target/);
  assert.doesNotMatch(html, /classList\.add\("target"\)/);
  assert.match(html, /class="infoterm" data-info=/);
  assert.doesNotMatch(html, /class="infobtn"/);
  assert.match(html, /aria-label="Erklärung:/);
  assert.match(html, /id="manualcreate" aria-label=/);
  assert.match(html, /id="coachbtn" aria-label=/);
});

test('creates unique copy names without putting the date into the title', () => {
  const start = html.indexOf('function programNameWithSuffix');
  const end = html.indexOf('function returnToProgramList', start);
  const context = { LIMITS: { maxNameLen: 30 } };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);
  const first = context.editorUniqueCopyName('Sehr langes Trainingsprogramm', {});
  assert.equal(first.length <= 30, true);
  assert.match(first, / \(Kopie\)$/);
  assert.doesNotMatch(first, /\d{2}\.\d{2}/);
  const second = context.editorUniqueCopyName('Sehr langes Trainingsprogramm', { one: { name: first } });
  assert.notEqual(second, first);
  assert.equal(second.length <= 30, true);
  assert.match(second, / \(Kopie 2\)$/);
  assert.doesNotMatch(second, /\d{2}\.\d{2}/);
});
