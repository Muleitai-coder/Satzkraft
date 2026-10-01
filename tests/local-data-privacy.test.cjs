const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const APP_KEYS = [
  'cali-plan-v3',
  'cali-plan-v2',
  'training-theme-v1',
  'satzkraft-training-view-v1',
  'satzkraft-backup-meta-v1',
  'satzkraft-storage-persist-v1',
  'satzkraft-design-update-v1',
  'satzkraft-coach-prefs'
];

function privacyContext({ failGetKey = '', failRemoveKey = '' } = {}) {
  const start = html.indexOf('function localAppStorageKeys()');
  const end = html.indexOf('function showSettings()', start);
  assert.ok(start >= 0 && end > start, 'Datenschutz-Funktionen wurden nicht gefunden');

  const storage = new Map(APP_KEYS.map(key => [key, `value:${key}`]));
  storage.set('satzkraft-reset-v1', 'old-generation');
  storage.set('unrelated-origin-key', 'keep');
  let failed = false;
  let clearedTimer = null;
  let reloadTask = null;
  let reloads = 0;
  let cancelled = 0;
  let saveCalls = 0;
  let getFailed = false;
  const setCalls = [];
  const removeCalls = [];
  const context = {
    KEY: 'cali-plan-v3',
    THEME_KEY: 'training-theme-v1',
    BACKUP_META_KEY: 'satzkraft-backup-meta-v1',
    PERSIST_REQUEST_KEY: 'satzkraft-storage-persist-v1',
    REDESIGN_NOTICE_KEY: 'satzkraft-design-update-v1',
    COACH_PREFS_KEY: 'satzkraft-coach-prefs',
    RESET_GENERATION_KEY: 'satzkraft-reset-v1',
    localResetGeneration: 'old-generation',
    localDataDeletionPending: false,
    backupRestorePending: false,
    saveT: 77,
    localStorage: {
      getItem(key) {
        if (!getFailed && key === failGetKey) {
          getFailed = true;
          throw new Error('read blocked');
        }
        return storage.has(key) ? storage.get(key) : null;
      },
      setItem(key, value) {
        setCalls.push(key);
        storage.set(key, String(value));
      },
      removeItem(key) {
        removeCalls.push(key);
        if (!failed && key === failRemoveKey) {
          failed = true;
          throw new Error('remove blocked');
        }
        storage.delete(key);
      }
    },
    clearTimeout: value => { clearedTimer = value; },
    setTimeout: callback => { reloadTask = callback; return 1; },
    location: { reload: () => { reloads++; } },
    coachCancelRequest: () => { cancelled++; },
    save: () => { saveCalls++; },
    showModal() {},
    showSettings() {},
    clearCoachPreferences: () => true,
    downloadFullBackup: () => true
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);
  return {
    context,
    storage,
    state: () => ({ clearedTimer, reloadTask, reloads, cancelled, saveCalls, setCalls, removeCalls })
  };
}

test('löscht ausschließlich die acht lokalen Satzkraft-Datenschlüssel', () => {
  const { context, storage, state } = privacyContext();

  assert.deepEqual(Array.from(context.localAppStorageKeys()), APP_KEYS);
  assert.equal(context.clearLocalAppData(), true);
  APP_KEYS.forEach(key => assert.equal(storage.has(key), false, `${key} wurde nicht gelöscht`));
  assert.equal(storage.get('unrelated-origin-key'), 'keep');
  assert.ok(storage.get('satzkraft-reset-v1'), 'technische Reset-Generation fehlt');
  assert.equal(context.localDataDeletionPending, true);
  assert.equal(context.backupRestorePending, true);
  assert.equal(state().clearedTimer, 77);
  assert.equal(state().cancelled, 1);
  assert.equal(state().reloads, 0);
  state().reloadTask();
  assert.equal(state().reloads, 1);
  assert.doesNotMatch(html, /localStorage\.clear\s*\(/);
});

test('stellt bei einem Löschfehler den vorherigen Stand wieder her', () => {
  const { context, storage, state } = privacyContext({ failRemoveKey: 'training-theme-v1' });

  assert.equal(context.clearLocalAppData(), false);
  APP_KEYS.forEach(key => assert.equal(storage.get(key), `value:${key}`));
  assert.equal(storage.get('unrelated-origin-key'), 'keep');
  assert.equal(storage.get('satzkraft-reset-v1'), 'old-generation');
  assert.equal(context.localDataDeletionPending, false);
  assert.equal(context.backupRestorePending, false);
  assert.equal(state().saveCalls, 1, 'der beim Löschversuch gestoppte Autosave muss neu geplant werden');
});

test('verändert bei einem fehlgeschlagenen Snapshot keine unbekannten Daten', () => {
  const { context, storage, state } = privacyContext({ failGetKey: 'training-theme-v1' });

  assert.equal(context.clearLocalAppData(), false);
  APP_KEYS.forEach(key => assert.equal(storage.get(key), `value:${key}`));
  assert.equal(storage.get('unrelated-origin-key'), 'keep');
  assert.equal(storage.get('satzkraft-reset-v1'), 'old-generation');
  assert.deepEqual(state().setCalls, []);
  assert.deepEqual(state().removeCalls, []);
  assert.equal(state().clearedTimer, null);
  assert.equal(state().cancelled, 0);
  assert.equal(state().saveCalls, 0);
});

test('schützt die Löschung vor Autosave und weiteren offenen Tabs', () => {
  const start = html.indexOf('function localWriteBlocked()');
  const end = html.indexOf('function currentTheme()', start);
  const sharedStorage = new Map([['satzkraft-reset-v1', 'old-generation']]);
  const context = {
    localDataDeletionPending: false,
    localResetGeneration: 'old-generation',
    RESET_GENERATION_KEY: 'satzkraft-reset-v1',
    localStorage: { getItem: key => sharedStorage.has(key) ? sharedStorage.get(key) : null }
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);

  assert.equal(context.localWriteBlocked(), false);
  sharedStorage.set('satzkraft-reset-v1', 'new-generation');
  assert.equal(context.localWriteBlocked(), true, 'ein alter Tab muss vor seinem storage-Event synchron blockiert werden');
  context.localResetGeneration = 'new-generation';
  assert.equal(context.localWriteBlocked(), false);
  context.localDataDeletionPending = true;
  assert.equal(context.localWriteBlocked(), true);
  context.localDataDeletionPending = false;
  context.localStorage.getItem = () => { throw new Error('storage unavailable'); };
  assert.equal(context.localWriteBlocked(), true, 'ein nicht verifizierbarer Reset-Stand darf keine Schreibvorgänge erlauben');

  assert.match(html, /function persist\(\)\{\s*if\(localWriteBlocked\(\)\)return false/);
  assert.match(html, /function save\(\)\{if\(backupRestorePending\|\|localWriteBlocked\(\)\)return/);
  assert.match(html, /function flushSave\(\)\{if\(backupRestorePending\|\|localWriteBlocked\(\)\)return/);
  assert.match(html, /addEventListener\("storage"[\s\S]*RESET_GENERATION_KEY[\s\S]*localDataDeletionPending=true/);
  assert.match(html, /\(event\.newValue\|\|""\)===localResetGeneration/);
  assert.match(html, /beforeunload"[\s\S]*if\(localWriteBlocked\(\)\|\|!editorHasUnsavedChanges\(\)\)return/);
});

test('schreibt Hauptdaten und Backup-Metadaten nicht nach einem Reset während der Serialisierung', () => {
  const guardStart = html.indexOf('function localWriteBlocked()');
  const guardEnd = html.indexOf('function currentTheme()', guardStart);

  function raceContext() {
    const sharedStorage = new Map([['satzkraft-reset-v1', 'old-generation']]);
    let writes = 0;
    let stringifies = 0;
    const context = {
      localDataDeletionPending: false,
      localResetGeneration: 'old-generation',
      RESET_GENERATION_KEY: 'satzkraft-reset-v1',
      localStorage: {
        getItem: key => sharedStorage.has(key) ? sharedStorage.get(key) : null,
        setItem: () => { writes++; }
      },
      JSON: {
        stringify: () => {
          stringifies++;
          sharedStorage.set('satzkraft-reset-v1', 'new-generation');
          return '{"serialized":true}';
        }
      }
    };
    vm.createContext(context);
    vm.runInContext(html.slice(guardStart, guardEnd), context);
    return { context, state: () => ({ writes, stringifies }) };
  }

  const main = raceContext();
  Object.assign(main.context, {
    DATA_SCHEMA_VERSION: 4,
    KEY: 'cali-plan-v3',
    S: { programs: {}, active: 'default', store: {} },
    storageErrorShown: false,
    setTimeout() {},
    showModal() {}
  });
  const persistStart = html.indexOf('function persist()');
  const persistEnd = html.indexOf('var saveT', persistStart);
  vm.runInContext(html.slice(persistStart, persistEnd), main.context);
  assert.equal(main.context.persist(), false);
  assert.deepEqual(main.state(), { writes: 0, stringifies: 1 });

  const meta = raceContext();
  Object.assign(meta.context, { BACKUP_META_KEY: 'satzkraft-backup-meta-v1' });
  const metaStart = html.indexOf('function writeBackupMeta(m)');
  const metaEnd = html.indexOf('function totalCompletedTrainings()', metaStart);
  vm.runInContext(html.slice(metaStart, metaEnd), meta.context);
  assert.equal(meta.context.writeBackupMeta({ lastAt: 1 }), false);
  assert.deepEqual(meta.state(), { writes: 0, stringifies: 1 });
});

test('prüft einen bereits geöffneten Backup-Restore unmittelbar vor dem Schreiben erneut', () => {
  const start = html.indexOf('function confirmBackupRestore(raw)');
  const end = html.indexOf('function importBackup(text)', start);
  let blocked = false;
  let dialog = null;
  let downloads = 0;
  let writes = 0;
  let blockDuringDownload = false;
  let throwOnWrite = false;
  let saveCalls = 0;
  const context = {
    localWriteBlocked: () => blocked,
    programWriteLocked: () => false,
    showProgramWriteLocked() {},
    showModal: (title, body, actions) => { dialog = { title, body, actions }; },
    downloadFullBackup: () => {
      downloads++;
      if (blockDuringDownload) blocked = true;
      return true;
    },
    clone: value => JSON.parse(JSON.stringify(value)),
    DATA_SCHEMA_VERSION: 4,
    clearTimeout() {},
    saveT: 1,
    backupRestorePending: false,
    localStorage: {
      setItem: () => {
        writes++;
        if (throwOnWrite) throw new Error('quota exceeded');
      }
    },
    KEY: 'cali-plan-v3',
    setTimeout() {},
    location: { reload() {} },
    save: () => { saveCalls++; },
    JSON
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);

  context.confirmBackupRestore({ programs: {}, store: {} });
  const restoreAction = dialog.actions[0].action;
  blocked = true;
  restoreAction();
  assert.equal(downloads, 0);
  assert.equal(writes, 0);
  assert.equal(dialog.title, 'Wiederherstellung abgebrochen');

  blocked = false;
  blockDuringDownload = true;
  context.confirmBackupRestore({ programs: {}, store: {} });
  dialog.actions[0].action();
  assert.equal(downloads, 1);
  assert.equal(writes, 0, 'ein Reset während der Sicherung darf nicht überschrieben werden');
  assert.equal(dialog.title, 'Wiederherstellung abgebrochen');

  blocked = false;
  blockDuringDownload = false;
  throwOnWrite = true;
  context.confirmBackupRestore({ programs: {}, store: {} });
  dialog.actions[0].action();
  assert.equal(writes, 1);
  assert.equal(context.backupRestorePending, false);
  assert.equal(saveCalls, 1, 'ein beim Restore gestoppter Autosave muss nach dem Speicherfehler neu geplant werden');
  assert.equal(dialog.title, 'Wiederherstellung fehlgeschlagen');
});

test('macht Datenfluss und sichere Löschwege in den Einstellungen sichtbar', () => {
  assert.match(html, /data-settings-privacy="1"/);
  assert.match(html, /data-settings-clear-coach="1"/);
  assert.match(html, /data-settings-clear-all="1"/);
  assert.match(html, /Programme, Satzwerte, Notizen, Verläufe und gespeicherte Coach-Antworten/);
  assert.match(html, /über eine Netlify-Serverfunktion an Anthropic/);
  assert.match(html, /Bei „ChatGPT &amp; Co\.“ sowie beim Kopieren oder Teilen/);
  assert.match(html, /keine Werbe-, Tracking- oder Analysedienste/);
  assert.match(html, /Backup herunterladen/);
  assert.match(html, /Backup gespeichert\?/);
  assert.match(html, /Backup geprüft – Daten löschen/);
  assert.match(html, /Ohne Backup löschen/);
  assert.match(html, /Backup sichert Programme und Trainingsdaten, aber nicht Coach-Antworten/);
});
