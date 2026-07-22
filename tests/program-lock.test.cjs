const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const start = html.indexOf('function programWriteLocked');
const end = html.indexOf('function renderLib', start);
assert.ok(start >= 0 && end > start, 'Programm-Schreibschutz wurde nicht gefunden');

function loadItemContext(workout) {
  const context = {
    S: { active: 'active', workout },
    esc: value => String(value == null ? '' : value),
    attr: value => String(value == null ? '' : value),
    icon: () => '',
    artSubtitleHtml: () => ''
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end), context);
  return context;
}

const activeProgram = { name: 'Aktiv', days: [{}, {}], weeks: [{}, {}, {}] };
const otherProgram = { name: 'Anderes', days: [{}], weeks: [{}] };

test('disables editing and activation while a training is running', () => {
  const context = loadItemContext({ start: 123 });
  const active = context.programItemHtml('active', activeProgram);
  const other = context.programItemHtml('other', otherProgram);

  assert.match(active, /data-edit="active"[^>]* disabled/);
  assert.match(other, /data-sel="other"[^>]* disabled/);
  assert.match(other, /data-edit="other"[^>]* disabled/);
  assert.match(active, /Training läuft – zuerst beenden/);
});

test('keeps program actions enabled outside a training', () => {
  const context = loadItemContext(null);
  const active = context.programItemHtml('active', activeProgram);
  const other = context.programItemHtml('other', otherProgram);

  assert.doesNotMatch(active, / disabled/);
  assert.doesNotMatch(other, / disabled/);
});

test('renders a clear read-only notice and disables all structural library actions', () => {
  assert.match(html, /Training läuft[^<]*<\/strong>Beende zuerst dein Training, um Programme zu ändern/);
  assert.match(html, /id="coachbtn"[^>]*'\+lockedAttr/);
  assert.match(html, /id="importbtn"[^>]*'\+lockedAttr/);
  assert.match(html, /id="manualcreate"[^>]*'\+lockedAttr/);
  assert.match(html, /id="externalaibtn"[^>]*'\+lockedAttr/);
  assert.match(html, /data-library-index="'\+index\+'"'\+lockedAttr/);
  assert.match(html, /data-library-edit="'\+index\+'"'\+lockedAttr/);
  assert.match(html, /id="backupfile"[^>]*\+lockedAttr/);
  assert.match(html, /function confirmReset\(\)\{\s*if\(programWriteLocked\(\)\)/);
  assert.match(html, /function confirmDeleteProgram\(id\)\{\s*if\(programWriteLocked\(\)\)/);
  assert.match(html, /data-progmenu=/);
});

test('guards stale or indirect mutation paths in addition to disabled controls', () => {
  assert.match(html, /function setActive\(id\)\{\s*if\(!S\.programs\[id\]\)return false;\s*if\(S\.programs\[id\]\.archived===true\)return false;\s*if\(programWriteLocked\(\)&&id!==S\.active\)/);
  assert.match(html, /function openProgramEditor\(id\)\{\s*if\(programWriteLocked\(\)\)/);
  assert.match(html, /function storeImportedProgram\(activate,allowDuplicate\)\{\s*if\(programWriteLocked\(\)\)/);
  assert.match(html, /function importBackup\(text\)\{\s*if\(programWriteLocked\(\)\)/);
  assert.match(html, /function confirmReset\(\)\{\s*if\(programWriteLocked\(\)\)/);
  assert.match(html, /function editorStoreProgram\(replaceOriginal,exitMode,activateNew\)\{\s*syncEditorForm\(\);\s*if\(programWriteLocked\(\)\)/);
});

test('keeps safe read-only and backup-download actions available', () => {
  assert.doesNotMatch(html, /id="(?:proshare|libbackup)"[^>]*\+lockedAttr/);
  assert.doesNotMatch(html, /data-library-share="'\+index\+'"[^>]*lockedAttr/);
  assert.match(html, /id="proshare"/);
  assert.match(html, /id="libbackup"/);
});
