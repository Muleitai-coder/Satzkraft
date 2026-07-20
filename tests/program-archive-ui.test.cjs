const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');

function functionSource(name) {
  const marker = `function ${name}(`;
  const start = html.indexOf(marker);
  assert.ok(start >= 0, `${name} wurde nicht gefunden`);
  const bodyStart = html.indexOf('{', start + marker.length);
  assert.ok(bodyStart > start, `${name} hat keinen Funktionsrumpf`);
  let depth = 0;
  let quote = '';
  let escaped = false;
  let regex = false;
  let regexClass = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = bodyStart; index < html.length; index++) {
    const char = html[index];
    const next = html[index + 1];
    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        index++;
      }
      continue;
    }
    if (regex) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '[') regexClass = true;
      else if (char === ']') regexClass = false;
      else if (char === '/' && !regexClass) regex = false;
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '/' && next === '/') {
      lineComment = true;
      index++;
      continue;
    }
    if (char === '/' && next === '*') {
      blockComment = true;
      index++;
      continue;
    }
    if (char === '/') {
      const before = html.slice(Math.max(bodyStart, index - 50), index).replace(/\s+$/, '');
      const previous = before[before.length - 1] || '';
      if (!previous || /[({\[=,:;!&|?+*%^~<>-]/.test(previous)
        || /\b(?:return|case|throw|delete|void|typeof|instanceof|in|of|yield)$/.test(before)) {
        regex = true;
        regexClass = false;
        continue;
      }
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return html.slice(start, index + 1);
  }
  assert.fail(`${name} konnte nicht vollständig gelesen werden`);
}

function cssBody(selector) {
  const marker = `${selector}{`;
  const start = html.indexOf(marker);
  assert.ok(start >= 0, `CSS-Regel ${selector} fehlt`);
  const end = html.indexOf('}', start + marker.length);
  assert.ok(end > start, `CSS-Regel ${selector} ist unvollständig`);
  return html.slice(start + marker.length, end);
}

function sourceBetween(startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `${startMarker} bis ${endMarker} wurde nicht gefunden`);
  return html.slice(start, end);
}

function program(id, name, overrides) {
  return Object.assign({
    id,
    name,
    createdAt: Date.UTC(2026, 6, 16, 12),
    categories: { kraft: { label: 'Kraft', color: 'amber', rest: 90 } },
    weeks: [{ n: 1, phase: 'aufbau', label: 'Aufbau', sets: { kraft: 1 } }],
    days: [{
      key: 'A',
      wd: 'Montag',
      title: 'Kraft',
      ex: [{ id: 'squat', name: 'Kniebeuge', cat: 'kraft', w: true, unit: 'reps', sets: 1 }]
    }]
  }, overrides);
}

function appContext(overrides) {
  const context = {
    APP_VERSION: 'test',
    console,
    setTimeout: callback => {
      callback();
      return 1;
    },
    clearTimeout() {},
    localStorage: { getItem: () => null, setItem() {} },
    navigator: {},
    window: { addEventListener() {}, removeEventListener() {}, print() {} },
    document: { getElementById: () => null }
  };
  vm.createContext(context);
  const names = [...html.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(match => match[1]);
  for (const name of [...new Set(names)]) vm.runInContext(functionSource(name), context);
  Object.assign(context, overrides || {});
  return context;
}

function libraryContext() {
  const library = { innerHTML: '' };
  const active = program('active', 'Kraftbasis');
  const other = program('other', 'Zweiter Plan');
  const archived = program('old', 'Alter Block', { archived: true });
  const stores = {
    active: { logs: { complete: true }, history: [], notes: {} },
    other: { logs: {}, history: [], notes: {} },
    old: { logs: { complete: true }, history: [], notes: {} }
  };
  const context = appContext({
    S: {
      active: 'active',
      programs: { active, other, old: archived },
      store: stores,
      week: 1,
      workout: null
    },
    document: { getElementById: id => id === 'lib' ? library : null },
    programWriteLocked: () => false,
    programBlockComplete: (_program, logs) => logs.complete === true,
    esc: value => String(value == null ? '' : value),
    attr: value => String(value == null ? '' : value),
    icon: name => `[${name}]`,
    themeButtonHtml: () => '<button class="linkbtn themebtn" id="themebtn">Dunkelmodus</button>',
    backupReminderHtml: () => '',
    backupStatusText: () => 'Keine Sicherung'
  });
  context.PROG = () => context.S.programs[context.S.active];
  return { context, library, active, archived };
}

test('öffnet das Archiv separat und zeigt den Farbmodus nur in den Einstellungen', () => {
  const { context, library } = libraryContext();

  context.renderLib();
  const main = library.innerHTML;
  const headerEnd = main.indexOf('</div></div>');
  const header = main.slice(0, headerEnd + 12);
  assert.match(header, /id="archivebtn"/);
  assert.match(header, /Archiv/);
  assert.doesNotMatch(main, /id="themebtn"/, 'Programme dürfen keinen Dunkelmodus-Knopf enthalten');
  assert.doesNotMatch(main, /Alter Block|programarchive|<summary>Archiv/);

  context.renderArchive();
  const archive = library.innerHTML;
  assert.match(archive, /<h1>Archiv<\/h1>/);
  assert.match(archive, /id="archiveback"[^>]+aria-label="Zurück"/);
  assert.match(archive, /Alter Block/);
  assert.doesNotMatch(archive, /Kraftbasis|Zweiter Plan/);
  assert.doesNotMatch(archive, /id="themebtn"/, 'das Archiv darf keinen Dunkelmodus-Knopf enthalten');

  const mainView = functionSource('renderView');
  const libraryFooter = functionSource('libraryFooterHtml');
  assert.match(mainView, /id="settingsbtn"/, 'die Hauptseite braucht den Einstellungen-Zahnrad');
  assert.match(functionSource('showSettings'), /data-settheme/, 'die Einstellungen müssen den Farbmodus anbieten');
  assert.doesNotMatch(libraryFooter, /themeButtonHtml\(\)|data-settheme/, 'die Programm-Fußzeile darf keinen Farbmodus enthalten');

  const libraryEvents = sourceBetween(
    'document.getElementById("lib").addEventListener("click"',
    'document.getElementById("lib").addEventListener("toggle"'
  );
  assert.match(libraryEvents, /b\.id==="archivebtn"[\s\S]{0,160}renderArchive\(\)/);
  assert.match(libraryEvents, /b\.id==="archiveback"[\s\S]{0,160}renderLib\(\)/);
});

test('zeigt Status und Datum ruhig an und hält Kartenaktionen kompakt bedienbar', () => {
  const { context, active, archived } = libraryContext();
  const activeCard = context.programItemHtml('active', active);
  const archivedCard = context.programItemHtml('old', archived);

  assert.match(activeCard, /<div class="progtopline"><span class="aktivpill">● Aktiv<\/span><span class="progweek">Woche 1 \/ 1<\/span><\/div>/, 'die aktive Karte zeigt Aktiv-Pille und Wochenstand in der Kopfzeile');
  assert.doesNotMatch(archivedCard, /aktivpill|statuspill archived|>Archiv<\/span>/);
  assert.match(
    activeCard,
    /<div class="proghead"><div class="meta"><div class="pn">Kraftbasis<\/div><div class="pm">[\s\S]*class="programdate"[\s\S]*<\/div><\/div><span class="statuspill complete">Abgeschlossen<\/span><\/div>/
  );
  const meta = activeCard.match(/<div class="pm">([\s\S]*?)<\/div>/);
  assert.ok(meta, 'Metazeile des aktiven Programms fehlt');
  assert.ok(meta[1].indexOf('1 Tag') < meta[1].indexOf('programdate'), 'Datum muss ganz rechts nach Tagen und Wochen stehen');
  assert.match(meta[1], /programdate[^>]*>Erstellt[^<]*16\.07\.2026<\/span>\s*$/);

  for (const [label, card] of [['Bearbeiten', activeCard], ['Auswertung ansehen', archivedCard], ['Aus dem Archiv holen', archivedCard]]) {
    assert.match(card, new RegExp(`<button[^>]+class="[^"]*progtextaction[^"]*"[^>]*>${label}<\\/button>`), `${label} muss ein semantischer Text-Button bleiben`);
  }

  const actionCss = cssBody('.progtextaction');
  assert.match(actionCss, /background:(?:transparent|none)/);
  assert.match(actionCss, /border:(?:0|none)/);
  assert.match(actionCss, /width:auto/);
  assert.match(actionCss, /font-size:(?:10|11|12)px/);
  assert.match(actionCss, /min-height:(?:3[2-9]|[4-9][0-9])px/, 'Klicktext braucht trotz kleiner Optik eine sichere Touchhöhe');
  assert.match(cssBody('.progactions'), /display:(?:flex|inline-flex)/);
  assert.match(cssBody('.programdate'), /margin-left:auto/);

  const completeCss = cssBody('.statuspill.complete');
  assert.match(completeCss, /background:var\(--kraftg\)/, 'Abgeschlossen-Badge muss den goldenen Kraft-Hintergrund verwenden');
  assert.match(completeCss, /color:var\(--kraft\)/, 'Abgeschlossen-Badge muss die goldene Kraft-Schriftfarbe verwenden');
  assert.match(html, /--kraft:#f4b03e/, 'der Kraft-Farbton muss golden bleiben');
});

test('kehrt aus der Auswertung eines Archivprogramms mit Zurück ins Archiv zurück', () => {
  const report = {
    innerHTML: '',
    classList: {
      values: new Set(),
      add(value) { this.values.add(value); },
      remove(value) { this.values.delete(value); },
      contains(value) { return this.values.has(value); }
    },
    focus() {}
  };
  const focusTarget = { focus() {} };
  const active = program('active', 'Kraftbasis');
  const archived = program('old', 'Alter Block', { archived: true });
  const emptyStore = () => ({ logs: {}, history: [], notes: {}, workout: null, week: 1, day: 'A' });
  const context = appContext({
    APP_VERSION: 'test',
    S: {
      active: 'active',
      programs: { active, old: archived },
      store: { active: emptyStore(), old: emptyStore() }
    },
    document: {
      activeElement: { id: 'origin' },
      title: 'Satzkraft',
      contains: () => true,
      getElementById(id) {
        if (id === 'report') return report;
        if (id === 'repback' || id === 'repclose') return focusTarget;
        return null;
      }
    },
    window: { addEventListener() {}, removeEventListener() {}, print() {} },
    lockSurfaceScroll() {},
    unlockSurfaceScroll() {},
    esc: value => String(value == null ? '' : value),
    attr: value => String(value == null ? '' : value),
    icon: name => `[${name}]`,
    fmtSeconds: value => `${value} Sek`,
    setsForExercise: exercise => exercise.sets == null ? 1 : exercise.sets,
    dDate: value => `Datum-${value}`,
    dClock: () => '12:00'
  });
  context.PROG = () => context.S.programs[context.S.active];

  context.openReport('old', 'archive');
  assert.match(report.innerHTML, /id="repback"[^>]+aria-label="Zurück/);
  assert.doesNotMatch(report.innerHTML, /id="repclose"/);
  assert.match(report.innerHTML, /Alter Block/);

  context.openReport('active');
  assert.match(report.innerHTML, /id="repclose"/);
  assert.doesNotMatch(report.innerHTML, /id="repback"/);

  const reportEvents = sourceBetween(
    'document.getElementById("report").addEventListener("click"',
    'window.addEventListener("keydown"'
  );
  assert.match(reportEvents, /b\.id==="repback"/);
  const reportNavigation = `${functionSource('openReport')}\n${functionSource('closeReport')}\n${reportEvents}`;
  assert.match(reportNavigation, /renderArchive\(\)/, 'Zurück aus dem Archivbericht muss die Archivansicht wiederherstellen');

  const libraryEvents = sourceBetween(
    'document.getElementById("lib").addEventListener("click"',
    'document.getElementById("lib").addEventListener("toggle"'
  );
  assert.match(libraryEvents, /openReport\(reportId,"archive"\)/);
});
