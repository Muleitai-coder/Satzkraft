const { test, expect } = require('@playwright/test');
const { createStaticServer } = require('./static-server.cjs');
const fs = require('node:fs/promises');
let server, origin;
test.beforeAll(async () => {
  server = createStaticServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  origin = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => {
  await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
});

test('DATA-01: damaged data survives reload; recovery and restore require deliberate file confirmation', async ({ page, context }, testInfo) => {
  const original = '{"schemaVersion":5,"original":"broken but valuable';
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await context.addInitScript(raw => {
    if (!sessionStorage.getItem('qa-initialized')) {
      localStorage.setItem('cali-plan-v3', raw);
      sessionStorage.setItem('qa-initialized', '1');
    }
  }, original);
  await page.goto(origin);
  await expect(page.getByRole('heading', { name: 'Trainingsdaten geschützt' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('cali-plan-v3'))).toBe(original);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Trainingsdaten geschützt' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('cali-plan-v3'))).toBe(original);
  await expect(page.getByRole('button', { name: 'Nach Sicherung neu beginnen' })).toBeDisabled();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Originaldaten sichern', exact: true }).tap();
  const download = await downloadPromise;
  expect(await fs.readFile(await download.path(), 'utf8')).toBe(original);
  await page.getByRole('button', { name: 'Nach Sicherung neu beginnen' }).tap();
  expect(await page.evaluate(() => localStorage.getItem('cali-plan-v3'))).toBe(original);
  await page.screenshot({ path: testInfo.outputPath('recovery-confirmation.png') });
  await page.getByRole('button', { name: 'Originaldatei geprüft – Daten ersetzen' }).tap();
  await expect(page.getByRole('button', { name: 'Training starten', exact: true })).toBeVisible();
  const before = await page.evaluate(() => localStorage.getItem('cali-plan-v3'));
  await page.getByRole('button', { name: 'Programme', exact: true }).tap();
  await page.locator('#backupfile').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(before) });
  await expect(page.getByRole('button', { name: 'Sichern & wiederherstellen', exact: true })).toBeVisible();
  const safetyPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Sichern & wiederherstellen', exact: true }).tap();
  await safetyPromise;
  await expect(page.getByRole('button', { name: 'Datei geprüft – wiederherstellen' })).toBeVisible();
  expect(await page.evaluate(() => backupRestorePending)).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem('cali-plan-v3'))).toBe(before);
  await page.getByRole('button', { name: 'Abbrechen', exact: true }).tap();
  expect(await page.evaluate(() => localStorage.getItem('cali-plan-v3'))).toBe(before);
  expect(errors).toEqual([]);
});
