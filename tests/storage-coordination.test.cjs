const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
function source(start, end) {
  const a = html.indexOf(start), b = html.indexOf(end, a);
  assert.ok(a >= 0 && b > a, start);
  return html.slice(a, b);
}
function sharedEnvironment() {
  const storage = new Map();
  const writes = [];
  let held = false, failWrite = false;
  const locks = {
    async request(name, options, callback) {
      assert.equal(name, 'satzkraft-local-writer-v1');
      assert.equal(options.mode, 'exclusive');
      assert.equal(options.ifAvailable, true);
      if (held) return callback(null);
      held = true;
      try { return await callback({ name }); } finally { held = false; }
    }
  };
  return { storage, writes, locks, fail: value => { failWrite = value; },
    localStorage: {
      getItem: key => storage.has(key) ? storage.get(key) : null,
      setItem: (key, value) => { if (failWrite) throw new Error('quota'); storage.set(key, String(value)); writes.push(key); },
      removeItem: key => { storage.delete(key); writes.push(key); }
    }
  };
}
function fixture(shared, options = {}) {
  const callbacks = {}, tasks = new Map(), dialogs = [];
  let serial = 0;
  const notice = { hidden: true, innerHTML: '', contains: () => false, focus() {}, addEventListener() {} };
  const element = { classList: { remove() {} }, style: {} };
  const body = {};
  const context = {
    KEY: 'cali-plan-v3', DATA_SCHEMA_VERSION: 5,
    RESET_GENERATION_KEY: 'satzkraft-reset-v1', localResetGeneration: '', localDataDeletionPending: false,
    THEME_KEY: 'training-theme-v1', BACKUP_META_KEY: 'satzkraft-backup-meta-v1',
    PERSIST_REQUEST_KEY: 'satzkraft-storage-persist-v1', REDESIGN_NOTICE_KEY: 'satzkraft-design-update-v1',
    localWriterState: 'pending', localWriterRelease: null, localWriterRequest: 0,
    localStoredSnapshot: null, localWriterDirty: false, localWriterDraftSecured: false,
    localWriterCompletion: Promise.resolve(), localWriterInitialized: false, storageErrorShown: false, loadIssueRaw: '', loadIssueText: '',
    pendingProgramImport: null, importIssue: null, editorDraft: null,
    navigator: { locks: options.unsupported ? undefined : shared.locks }, localStorage: shared.localStorage,
    document: {
      body, activeElement: body, visibilityState: 'hidden',
      getElementById: id => id === 'windowNotice' ? notice : element,
      querySelector: () => null, querySelectorAll: () => [],
      addEventListener: (name, callback) => { callbacks[name] = callback; }
    },
    window: { addEventListener: (name, callback) => { callbacks[name] = callback; } },
    setTimeout: callback => { tasks.set(++serial, callback); return serial; }, clearTimeout: id => tasks.delete(id),
    location: { reload() {} },
    load() {
      context.localStoredSnapshot = shared.localStorage.getItem(context.KEY);
      return context.localStoredSnapshot ? JSON.parse(context.localStoredSnapshot) : { programs: {}, active: 'default', store: {}, notes: {} };
    },
    syncStore() {}, renderView() {}, renderBar() {}, updateSurfaceIsolation() {},
    cancelWorkoutPauseHold() {}, cancelAllAutoRest() {}, clearDonePrompt() {}, releaseWakeLock() {}, resetRestState() {}, clearRestFocus() {},
    resetProgramEditorState() {}, unlockSurfaceScroll() {}, initializeWritableApp() {}, focusSurface() {},
    editorHasUnsavedChanges: () => Boolean(context.editorDraft),
    programWriteLocked: () => false, showProgramWriteLocked() {},
    showModal: (title, text, actions) => dialogs.push({ title, text, actions }),
    downloadFullBackup: () => true, downloadText: () => true, backupJSON: () => JSON.stringify(context.S),
    clone: value => JSON.parse(JSON.stringify(value)), esc: String, JSON, Date, Promise,
  };
  context.S = context.load();
  vm.createContext(context);
  vm.runInContext(source('function localWriteBlocked()', 'function currentTheme()'), context);
  vm.runInContext(source('function persist()', '// ---------- Programm-Zugriff'), context);
  vm.runInContext(source('function localAppStorageKeys()', 'function showPrivacyInfo()'), context);
  vm.runInContext(source('function confirmBackupRestore(raw)', 'function importBackup(text)'), context);
  vm.runInContext(source('function localWindowHasDraft()', '// ---------- PWA ----------'), context);
  return { context, callbacks, notice, dialogs, tasks };
}
async function settle() { for (let i = 0; i < 12; i++) await Promise.resolve(); }

test('at most one writer; a stale window cannot save through debounce, background, restore or deletion', async () => {
  const shared = sharedEnvironment(), a = fixture(shared), b = fixture(shared);
  a.context.requestLocalWriter(); b.context.requestLocalWriter(); await settle();
  assert.equal(a.context.localWriterState, 'owner'); assert.equal(b.context.localWriterState, 'other');
  a.context.S.store.default = { logs: { saved: '10 × 20 kg' } };
  assert.equal(a.context.flushSave(), true);
  const latest = shared.storage.get('cali-plan-v3');
  b.context.S.store.default = { logs: {} };
  assert.equal(b.context.save(), false); assert.equal(b.context.flushSave(), false); assert.equal(b.context.persist(), false);
  b.callbacks.visibilitychange(); b.context.confirmBackupRestore({}); assert.equal(b.dialogs.length, 0);
  assert.equal(b.context.clearLocalAppData(), false);
  assert.equal(shared.storage.get('cali-plan-v3'), latest);
  b.context.requestLocalWriter(); await settle(); assert.equal(b.context.localWriterState, 'other');
  a.context.releaseLocalWriter(); await settle(); b.context.requestLocalWriter(); await settle();
  assert.equal(b.context.localWriterState, 'owner');
  assert.equal(b.context.S.store.default.logs.saved, '10 × 20 kg');
});

test('foreign changes stop delayed writes and retain the local draft until a conscious decision', async () => {
  const shared = sharedEnvironment(), a = fixture(shared);
  a.context.requestLocalWriter(); await settle();
  a.context.S.notes = { own: 'retain draft' }; a.context.save();
  shared.storage.set('cali-plan-v3', '{"programs":{},"active":"default","store":{},"notes":{"foreign":"new"}}');
  const pending = Array.from(a.tasks.values())[0]; pending();
  assert.equal(a.context.localWriterState, 'conflict');
  assert.equal(a.context.S.notes.own, 'retain draft'); assert.equal(a.context.localWindowHasDraft(), true);
  assert.equal(JSON.parse(shared.storage.get('cali-plan-v3')).notes.foreign, 'new');
  a.context.requestLocalWriter(); await settle(); assert.equal(a.context.S.notes.own, 'retain draft');
  a.context.requestLocalWriter(true); await settle(); assert.equal(a.context.localWriterState, 'owner');
  assert.equal(a.context.S.notes.foreign, 'new');
});

test('pagehide releases, background retains; BFCache pageshow reacquires and reloads', async () => {
  const shared = sharedEnvironment(), a = fixture(shared), b = fixture(shared);
  a.context.requestLocalWriter(); await settle(); a.callbacks.visibilitychange();
  b.context.requestLocalWriter(); await settle(); assert.equal(b.context.localWriterState, 'other');
  a.callbacks.pagehide(); await settle(); b.context.requestLocalWriter(); await settle();
  assert.equal(b.context.localWriterState, 'owner');
  a.callbacks.pageshow({ persisted: true }); await settle(); assert.equal(a.context.localWriterState, 'other');
  b.callbacks.pagehide(); await settle(); a.callbacks.pageshow({ persisted: true }); await settle();
  assert.equal(a.context.localWriterState, 'owner');
});

test('restore updates the expected snapshot; stale windows cannot undo the restored backup', async () => {
  const shared = sharedEnvironment(), a = fixture(shared), b = fixture(shared);
  a.context.requestLocalWriter(); b.context.requestLocalWriter(); await settle();
  a.context.confirmBackupRestore({ programs: { restored: {} }, active: 'restored', store: { restored: { logs: { value: 'saved' } } } });
  a.dialogs[0].actions[0].action();
  const restored = shared.storage.get('cali-plan-v3');
  assert.equal(a.context.localStoredSnapshot, restored);
  assert.equal(JSON.parse(restored).store.restored.logs.value, 'saved');
  assert.equal(b.context.persist(), false); assert.equal(shared.storage.get('cali-plan-v3'), restored);
});

test('deletion preserves unrelated keys and synchronously blocks stale writers', async () => {
  const shared = sharedEnvironment(), a = fixture(shared), b = fixture(shared);
  shared.storage.set('foreign-origin-data', 'retain');
  a.context.requestLocalWriter(); b.context.requestLocalWriter(); await settle(); a.context.flushSave();
  assert.equal(a.context.clearLocalAppData(), true);
  assert.equal(b.context.persist(), false); assert.equal(shared.storage.has('cali-plan-v3'), false);
  assert.equal(shared.storage.get('foreign-origin-data'), 'retain');
  assert.ok(shared.storage.get('satzkraft-reset-v1'));
});

test('quota failures retain unsaved values and report no success', async () => {
  const shared = sharedEnvironment(), a = fixture(shared);
  a.context.requestLocalWriter(); await settle(); a.context.S.notes = { own: 'not lost' }; shared.fail(true);
  assert.equal(a.context.flushSave(), false); assert.equal(a.context.localWriterDirty, true);
  assert.equal(a.context.S.notes.own, 'not lost'); assert.equal(shared.storage.has('cali-plan-v3'), false);
  for (const task of a.tasks.values()) task();
  assert.equal(a.dialogs[0].title, 'Speichern fehlgeschlagen');
});

test('unsupported or rejected coordination fails closed without fallback writes', async () => {
  const shared = sharedEnvironment(), a = fixture(shared, { unsupported: true });
  a.context.requestLocalWriter(); assert.equal(a.context.localWriterState, 'unsupported');
  assert.equal(a.context.flushSave(), false); assert.equal(a.context.clearLocalAppData(), false); assert.deepEqual(shared.writes, []);
  const b = fixture(shared); b.context.navigator.locks = { request: () => Promise.reject(new Error('denied')) };
  b.context.requestLocalWriter(); await settle(); assert.equal(b.context.localWriterState, 'unavailable');
  assert.equal(b.context.persist(), false); assert.deepEqual(shared.writes, []);
});

test('all inline scripts parse; schema and exchange format stay compatible', () => {
  for (const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(script[1]);
  assert.match(html, /DATA_SCHEMA_VERSION=5/); assert.match(html, /var KEY="cali-plan-v3"/);
  assert.match(html, /version:2/);
});
