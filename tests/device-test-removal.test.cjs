const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html', 'utf8');

test('retired test UI and runtime are absent from app, build and offline cache', () => {
  assert.doesNotMatch(html, /DEVICE_TEST_MODE|SatzkraftDeviceTest|deviceTestBar|device-test-guided|settings-device-test|Admin &amp; Tests/);
  assert.equal(fs.existsSync('js/device-test.js'), false);
  for (const file of ['sw.js', 'scripts/prepare-netlify.mjs'])
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /device-test/);
});

test('storage constants always use normal data even with a stale mode flag', () => {
  const reads = [];
  const context = { Promise, localStorage: { getItem(key) { reads.push(key); return key === 'satzkraft-device-test-mode-v1' ? '1' : null; } } };
  vm.createContext(context);
  vm.runInContext(html.slice(html.indexOf('var KEY="cali-plan-v3"'), html.indexOf('function localWriteBlocked()')), context);
  assert.equal(context.KEY, 'cali-plan-v3');
  assert.equal(context.THEME_KEY, 'training-theme-v1');
  for (const key of ['BACKUP_META_KEY', 'PERSIST_REQUEST_KEY', 'REDESIGN_NOTICE_KEY', 'RESET_GENERATION_KEY'])
    assert.equal(context[key].startsWith('satzkraft-device-test-v1:'), false);
  assert.equal(reads.includes('satzkraft-device-test-mode-v1'), false);
  assert.match(html, /navigator\.locks\.request\("satzkraft-local-writer-v1"/);
});

test('old test backup is rejected before any state access or further validation', () => {
  const start = html.indexOf('function validateBackupFile(raw){');
  const context = {};
  vm.createContext(context);
  vm.runInContext(html.slice(start, html.indexOf('\nfunction ', start + 20)), context);
  assert.match(context.validateBackupFile({ deviceTestData: true }), /alte Testdaten/);
});

test('ordinary backups retain real training and do not carry a test marker', () => {
  const context = { DATA_SCHEMA_VERSION: 5, S: { programs: { normal: { name: 'Mein Training' } }, store: { normal: { logs: { example: { sets: [{ reps: '10', weight: '20' }] } } } }, active: 'normal' }, syncStore() {} };
  vm.createContext(context);
  vm.runInContext(html.slice(html.indexOf('function backupJSON()'), html.indexOf('function readBackupMeta()')), context);
  const backup = JSON.parse(context.backupJSON());
  assert.equal(backup.schemaVersion, 5);
  assert.equal(backup.deviceTestData, undefined);
  assert.deepEqual(backup.store, context.S.store);
});

test('explicit complete deletion still includes dormant test data and reports', () => {
  const context = { KEY: 'real:state', THEME_KEY: 'real:theme', BACKUP_META_KEY: 'real:backup', PERSIST_REQUEST_KEY: 'real:persist', REDESIGN_NOTICE_KEY: 'real:notice' };
  vm.createContext(context);
  vm.runInContext(html.slice(html.indexOf('function localAppStorageKeys()'), html.indexOf('function clearLocalAppData()')), context);
  const keys = Array.from(context.localAppStorageKeys());
  for (const key of ['satzkraft-device-test-reports-v1', 'satzkraft-device-test-mode-v1', 'satzkraft-device-test-v1:cali-plan-v3']) assert.ok(keys.includes(key));
  assert.equal(keys.some(key => key.includes('unrelated')), false);
});
