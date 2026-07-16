const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');

function finiteNumber(value, min, max, integer) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max && (!integer || Math.floor(value) === value);
}

function loadRealBackupValidator() {
  const context = {
    DATA_SCHEMA_VERSION: 4,
    CAT_COLORS: ['amber', 'emerald', 'violet', 'sky', 'orange', 'rose', 'slate'],
    LIMITS: { maxDays: 7, maxWeeks: 16, maxExPerDay: 12, maxSets: 10, maxNameLen: 30, maxLabelLen: 16 },
    WD_MAP: { montag: 0, dienstag: 1, mittwoch: 2, donnerstag: 3, freitag: 4, samstag: 5, sonntag: 6 },
    VALID_PROGRESSION_MODES: ['weight', 'added_weight', 'reps', 'seconds', 'progression', 'none'],
    WUCD_SET: {},
    ANLEITUNG: {},
    esc: value => String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    wucdSan: list => Array.isArray(list) ? list.map(item => ({ name: item.name, sec: item.seconds })) : []
  };
  vm.createContext(context);
  const programStart = html.indexOf('function genId()');
  const programEnd = html.indexOf('function setActive(', programStart);
  const backupStart = html.indexOf('function validBackupNumber');
  const backupEnd = html.indexOf('function confirmBackupRestore', backupStart);
  assert.ok(programStart >= 0 && programEnd > programStart, 'Programmvalidierung wurde nicht gefunden');
  assert.ok(backupStart >= 0 && backupEnd > backupStart, 'Backup-Validierung wurde nicht gefunden');
  vm.runInContext(html.slice(programStart, programEnd), context);
  vm.runInContext(html.slice(backupStart, backupEnd), context);
  return context;
}

test('records full backups across all programs', () => {
  const storage = new Map();
  const start = html.indexOf('function readBackupMeta');
  const end = html.indexOf('function stopWorkout', start);
  assert.ok(start >= 0 && end > start, 'Backup-Hilfsfunktionen wurden nicht gefunden');
  let downloadedName = '';
  const context = {
    BACKUP_META_KEY: 'backup-meta',
    S: {
      store: {
        first: { history: [{ complete: true }, { complete: false }] },
        second: { history: [{ complete: true }] }
      }
    },
    localStorage: {
      getItem: key => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value)
    },
    finiteNumber,
    syncStore() {},
    backupJSON: () => '{"backup":true}',
    downloadText: name => { downloadedName = name; return true; },
    showModal() {}
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);

  assert.equal(context.totalCompletedTrainings(), 2);
  assert.equal(context.downloadFullBackup('satzkraft-test'), true);
  assert.match(downloadedName, /^satzkraft-test-\d{4}-\d{2}-\d{2}\.json$/);
  const meta = JSON.parse(storage.get('backup-meta'));
  assert.equal(meta.historyCount, 2);
  assert.equal(meta.remindedAt, 2);
  assert.ok(meta.lastAt > 0);
});

function validBackup() {
  return {
    schemaVersion: 4,
    active: 'default',
    programs: {
      default: { name: 'Testplan', weeks: [{}], days: [{ key: 'A' }] }
    },
    store: {
      default: {
        tg: { '1|a1': '20' },
        logs: { '1|A|a1': { sets: [{ reps: '10', weight: '20' }] } },
        history: [{ week: 1, day: 'A', start: 100, end: 200, dur: 100, complete: true }],
        workout: null,
        week: 1,
        day: 'A'
      }
    }
  };
}

test('validates full backup structure and recorded values', () => {
  const start = html.indexOf('function validBackupNumber');
  const end = html.indexOf('function confirmBackupRestore', start);
  assert.ok(start >= 0 && end > start, 'Backup-Validierung wurde nicht gefunden');
  const context = {
    DATA_SCHEMA_VERSION: 4,
    LIMITS: { maxSets: 10, maxWeeks: 16 },
    plainObject: value => !!value && typeof value === 'object' && !Array.isArray(value),
    finiteNumber,
    esc: value => String(value == null ? '' : value),
    exportTranslate: value => value,
    parseProgram: () => ({ prog: {} })
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);

  assert.equal(context.validateBackupFile(validBackup()), null);

  const invalidValue = validBackup();
  invalidValue.store.default.logs['1|A|a1'].sets[0].weight = '-20';
  assert.match(context.validateBackupFile(invalidValue), /ungültige Wiederholungs- oder Gewichtswerte/);

  const invalidDay = validBackup();
  invalidDay.store.default.day = 'Z';
  assert.match(context.validateBackupFile(invalidDay), /ungültige Woche oder einen ungültigen Tag/);

  const unsafeId = validBackup();
  unsafeId.programs = JSON.parse('{"__proto__":{"name":"X","weeks":[{}],"days":[{"key":"A"}]}}');
  unsafeId.active = '__proto__';
  unsafeId.store = JSON.parse('{"__proto__":{"tg":{},"logs":{},"history":[],"week":1,"day":"A"}}');
  assert.match(context.validateBackupFile(unsafeId), /ungültigen Programm-Schlüssel|aktuelle Programm/);
});

test('restore flow always creates a safety backup first', () => {
  assert.match(html, /downloadFullBackup\("satzkraft-vor-wiederherstellung"\)/);
  assert.match(html, /Sichern &amp; wiederherstellen|Sichern & wiederherstellen/);
});

test('accepts the complete report example backup with recorded training values', () => {
  const backup = JSON.parse(fs.readFileSync(new URL('../TESTBACKUP-AUSWERTUNG.json', `file://${__filename}`), 'utf8'));
  const context = loadRealBackupValidator();
  assert.equal(context.validateBackupFile(backup), null);
  const store = backup.store[backup.active];
  assert.equal(backup.programs[backup.active].weeks.length, 4);
  assert.equal(store.history.length, 8);
  assert.ok(Object.keys(store.logs).length >= 20);
  assert.ok(store.history.some(entry => entry.complete === false));
});
