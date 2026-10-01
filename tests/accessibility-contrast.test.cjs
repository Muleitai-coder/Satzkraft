const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');

function tokensFor(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`${escaped}\\{([^}]+)\\}`));
  assert.ok(match, `${selector} wurde nicht gefunden`);
  const tokens = {};
  for (const item of match[1].matchAll(/(--[a-z0-9]+):\s*([^;]+)/gi)) {
    tokens[item[1]] = item[2].trim();
  }
  return tokens;
}

function luminance(hex) {
  const rgb = hex.match(/[a-f0-9]{2}/gi).map(value => parseInt(value, 16) / 255);
  const linear = rgb.map(value =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground, background) {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function assertContrast(tokens, foreground, background, minimum = 4.5) {
  const ratio = contrast(tokens[foreground], tokens[background]);
  assert.ok(
    ratio >= minimum,
    `${foreground} auf ${background}: ${ratio.toFixed(2)} statt mindestens ${minimum}`
  );
}

test('small design-token text meets WCAG AA in dark and light surfaces', () => {
  const dark = tokensFor(':root');
  const light = { ...dark, ...tokensFor('html[data-theme="light"]') };

  for (const theme of [dark, light]) {
    for (const foreground of ['--muted', '--faint']) {
      for (const background of ['--bg', '--panel', '--panel2', '--up']) {
        assertContrast(theme, foreground, background);
      }
    }
  }
});

test('accent and category text keeps AA contrast in both themes', () => {
  const dark = tokensFor(':root');
  const light = { ...dark, ...tokensFor('html[data-theme="light"]') };

  assertContrast(dark, '--onacc', '--acc');
  assertContrast(light, '--onacc', '--acc');
  for (const token of ['--kraft', '--hyp', '--skill', '--core', '--orange', '--danger']) {
    assertContrast(dark, token, '--panel2');
    assertContrast(light, token, '--panel');
  }
});
