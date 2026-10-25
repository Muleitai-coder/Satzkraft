import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { artifactHashes, checkArtifact } from '../scripts/freshness.mjs';

test('native freshness rejects source drift, changed files and missing build metadata', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'satzkraft-freshness-'));
  try {
    await writeFile(join(directory, 'native-app.js'), 'const value = 1;');
    assert.equal(await checkArtifact(directory, 'current'), false);
    await writeFile(join(directory, 'build-info.json'), JSON.stringify({ version: 1, source: 'current', files: await artifactHashes(directory) }));
    assert.equal(await checkArtifact(directory, 'current'), true);
    assert.equal(await checkArtifact(directory, 'new-source'), false);
    await writeFile(join(directory, 'native-app.js'), 'const value = 2;');
    assert.equal(await checkArtifact(directory, 'current'), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
