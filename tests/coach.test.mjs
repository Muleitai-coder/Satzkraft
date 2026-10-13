// Der frühere Endpoint wird nicht mehr bereitgestellt. Das Entfernen ist
// eine Produktentscheidung; statt Requests prüfen wir seine Abwesenheit.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const config = fs.readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
test('removes the deployed API function and frontend request path', () => {
  assert.equal(fs.existsSync(new URL('../netlify/functions/coach.mjs', import.meta.url)), false);
  assert.doesNotMatch(config, /\[functions\]/);
  assert.doesNotMatch(html, /fetch\([^\n]*(?:coach|anthropic)|ANTHROPIC_API_KEY|COACH_STEPS|coachCall\(/);
  assert.match(html, /fetch\("uebungen\.json"\)/);
});
