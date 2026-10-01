const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');

function sourceBetween(startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `${startMarker} bis ${endMarker} wurde nicht gefunden`);
  return html.slice(start, end);
}

function functionSource(name) {
  const marker = `function ${name}(`;
  const start = html.indexOf(marker);
  assert.ok(start >= 0, `${name} wurde nicht gefunden`);
  const bodyStart = html.indexOf('{', start + marker.length);
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = bodyStart; index < html.length; index++) {
    const char = html[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return html.slice(start, index + 1);
  }
  assert.fail(`${name} konnte nicht vollständig gelesen werden`);
}

test('escapes importable names and internal IDs before placing them in HTML attributes', () => {
  const payload = 'X" onfocus="globalThis.x=1';
  const context = {
    restPhase: null,
    restExId: null,
    restNextSet: -1,
    setComplete: () => false,
    isTime: () => false,
    SET_REP_MAX: 9999,
    fmtClockInput: () => '',
    timeInputValue: value => String(value == null ? '' : value),
    icon: () => ''
  };
  vm.createContext(context);
  vm.runInContext(sourceBetween('function esc', 'function icon'), context);
  for (const name of [
    'sanInt',
    'stpBtn',
    'setRowHtml',
    'editorInfoButton',
    'editorLabel',
    'editorInput'
  ]) {
    vm.runInContext(functionSource(name), context);
  }

  const renderedSet = context.setRowHtml(
    { id: payload, name: payload, w: true, unit: 'reps' },
    0,
    { reps: '8', weight: '20' },
    [8, 12],
    20,
    '',
    0,
    false
  );
  const renderedLabel = context.editorInput(
    'Bezeichnung',
    payload,
    'data-ed-program="name"',
    {}
  );
  const rendered = renderedSet + renderedLabel;

  assert.doesNotMatch(
    rendered,
    /"\s+on(?:focus|click|error|load|pointerenter)\s*=/i,
    'dynamische Werte dürfen kein separates Eventhandler-Attribut erzeugen'
  );
  assert.match(rendered, /&quot;/, 'Anführungszeichen müssen im Attributwert codiert sein');
});

test('constrains imported category and day IDs to non-executable characters', () => {
  assert.match(
    html,
    /\^\[A-Za-z0-9_-\]\{1,32\}\$/,
    'Kategorie-Schlüssel brauchen eine enge Zeichen-Whitelist'
  );
  assert.match(
    html,
    /\^\[A-Za-z0-9_-\]\{1,12\}\$/,
    'Tag-Schlüssel brauchen eine enge Zeichen-Whitelist'
  );
});
