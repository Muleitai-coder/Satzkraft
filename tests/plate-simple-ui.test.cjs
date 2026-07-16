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
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return html.slice(start, index + 1);
  }
  assert.fail(`${name} konnte nicht vollständig gelesen werden`);
}

function appContext(target, bar) {
  const context = {
    console,
    S: { barw: { bench: bar } },
    targetWeight: () => target,
    attr: value => String(value == null ? '' : value),
    fmtKg: value => Number(value).toLocaleString('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
  };
  vm.createContext(context);
  const calculatorFunctions = [
    'calculatePlateLoad', 'plateListLabel', 'plateVisualHtml',
    'plateResultHtml', 'plateCalculatorHtml'
  ];
  for (const name of calculatorFunctions) {
    if (html.includes(`function ${name}(`)) vm.runInContext(functionSource(name), context);
  }
  assert.equal(typeof context.plateCalculatorHtml, 'function', 'Scheibenrechner wurde nicht gefunden');
  return context;
}

function calculatorText(target, bar) {
  const context = appContext(target, bar);
  const output = context.plateCalculatorHtml({ id: 'bench', name: 'Bankdrücken', w: true });
  return {
    output,
    text: output.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  };
}

test('bietet ausschließlich 10, 15 und 20 kg als Stangengewicht an', () => {
  const { output } = calculatorText(70, 20);
  const choices = [...output.matchAll(/<button\b[^>]*data-plate-bar="([^"]+)"[^>]*>/g)]
    .map(match => Number(match[1]));

  assert.deepEqual(choices, [10, 15, 20]);
  assert.doesNotMatch(output, /data-plate-custom|data-plate-custom-open/i);
  assert.doesNotMatch(output, /Anderes|Eigenes Stangengewicht/i);
});

test('zeigt nur das rechnerische Gewicht pro Seite ohne Scheibenaufteilung', () => {
  const expected = [
    { bar: 10, side: '30' },
    { bar: 15, side: '27,5' },
    { bar: 20, side: '25' }
  ];

  for (const item of expected) {
    const { output, text } = calculatorText(70, item.bar);
    assert.match(text, new RegExp(`${item.side} kg pro Seite`, 'i'));
    assert.doesNotMatch(output, /platevisual|platebarsleeve|platevisualplate/i);
    assert.doesNotMatch(text, /\b\d+\s*[×x]\s*\d/i, 'keine einzelnen Scheiben oder Kontrollgleichung anzeigen');
    assert.doesNotMatch(text, /JE SEITE/i, 'das Ergebnis soll als schlichter Satz erscheinen');
  }
});

test('liefert bei Zielgewicht auf oder unter der Stange nie ein negatives Seitengewicht', () => {
  const equal = calculatorText(20, 20).text;
  const below = calculatorText(15, 20).text;

  assert.match(equal, /0 kg pro Seite/i);
  assert.match(below, /0 kg pro Seite/i);
  assert.doesNotMatch(below, /-\s*\d/);
  assert.match(below, /Zielgewicht[^.]*Stange|Stange[^.]*Zielgewicht/i,
    'bei einem zu kleinen Zielgewicht braucht es einen verständlichen Hinweis');
});
