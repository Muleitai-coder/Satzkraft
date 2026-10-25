const fs = require('node:fs');
const path = require('node:path');
const { test, expect, devices } = require('@playwright/test');
const { createStaticServer } = require('./static-server.cjs');

const retiredStateKey = 'satzkraft-device-test-v1:cali-plan-v3';
const retiredReportsKey = 'satzkraft-device-test-reports-v1';
const evidenceDir = path.resolve(__dirname, '../../replica/clone-screens');
let server, origin;
async function stopOrigin() {
  if (!server?.listening) return;
  await new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  });
}
test.beforeAll(async () => {
  server = createStaticServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  origin = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(stopOrigin);

function fixture() {
  const state = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../TESTBACKUP-AUSWERTUNG.json'), 'utf8'));
  const program = state.programs[state.active];
  program.name = 'Handyprüfung';
  program.weeks = program.weeks.slice(0, 2);
  const category = program.days[0].ex[0].cat;
  program.days = [{ key: 'A', wd: 'Montag', title: 'Bedienung prüfen', ex: [
    { id: 'press', name: 'Beinpresse', cat: category, w: true, unit: 'reps', inc: 2.5, def: 20, reps: [8, 12] },
    { id: 'carry', name: 'Gewicht halten', cat: category, w: true, unit: 'seconds', inc: 2.5, def: 12.5, reps: [30, 45], tmode: 'target' },
  ] }];
  for (const week of program.weeks) week.sets = { [category]: 2 };
  state.programs = { [state.active]: program };
  state.store = { [state.active]: { tg: {}, barw: {}, notes: {}, logs: {}, history: [], workout: null, pendingReplacements: [], week: 1, day: 'A', blockCelebrated: false } };
  return state;
}

// Test-only environment substitution. We exercise the shipped CSS declarations
// with conservative nonzero reserves; these numbers are NOT measured iOS insets.
// No simulator, screen frame or test controls are shipped with the app.
async function reserveEdges(page, insets) {
  const substitutions = await page.evaluate(insets => {
    let count = 0;
    for (const style of document.querySelectorAll('style')) {
      if (!style.dataset.originalCss) style.dataset.originalCss = style.textContent;
      style.textContent = style.dataset.originalCss.replace(/env\(safe-area-inset-(top|bottom|left|right)\)/g, (_, edge) => {
        count++;
        return `${insets[edge]}px`;
      });
    }
    document.getElementById('qa-reserved-edges')?.remove();
    const frame = document.createElement('div');
    frame.id = 'qa-reserved-edges';
    frame.setAttribute('aria-hidden', 'true');
    for (const edge of ['top', 'bottom', 'left', 'right']) {
      if (!insets[edge]) continue;
      const part = document.createElement('div');
      const horizontal = edge === 'top' || edge === 'bottom';
      part.style.cssText = `position:fixed;z-index:2147483647;${edge}:0;${horizontal ? 'left:0;right:0;height' : 'top:0;bottom:0;width'}:${insets[edge]}px;background:#333;color:white;font:10px sans-serif;display:grid;place-items:center;pointer-events:auto`;
      if (horizontal) part.textContent = 'Reservierter Rand · Simulation';
      frame.appendChild(part);
    }
    document.body.appendChild(frame);
    return count;
  }, insets);
  expect(substitutions).toBeGreaterThan(20);
}

async function reachable(page, locator, insets, minWidth = 44) {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeVisible();
  // Like a user scrolling a long page, bring controls away from reserved edges.
  // No forced tap: the hit test below must still succeed after scrolling.
  await locator.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  expect(box.width).toBeGreaterThanOrEqual(minWidth - 0.5);
  expect(box.height).toBeGreaterThanOrEqual(43.5);
  expect(box.x).toBeGreaterThanOrEqual(insets.left);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width - insets.right + 0.5);
  expect(box.y).toBeGreaterThanOrEqual(insets.top);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height - insets.bottom + 0.5);
  expect(await locator.evaluate(el => {
    const r = el.getBoundingClientRect();
    return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
  })).toBe(true);
}

async function tap(page, locator, insets, minWidth) {
  await reachable(page, locator, insets, minWidth);
  await locator.tap();
}

test('REG-31/P0: normale App am iPhone-17-Pro-Profil – Touch, Ränder, Offline-Eingaben und Cache-Neustart', async ({ page, context }) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 500) errors.push(`HTTP ${response.status()} ${response.url()}`); });
  await page.addInitScript(({ state, retiredStateKey, retiredReportsKey }) => {
    if (!sessionStorage.getItem('qa-iphone-seeded')) {
      localStorage.setItem('cali-plan-v3', JSON.stringify(state));
      localStorage.setItem('training-theme-v1', 'dark');
      localStorage.setItem('satzkraft-design-update-v1', '1');
      localStorage.setItem('satzkraft-backup-meta-v1', JSON.stringify({ snoozeUntil: Date.now() + 86400000 }));
      // Simulates the user's previously active test mode, with distinct data.
      localStorage.setItem('satzkraft-device-test-mode-v1', '1');
      localStorage.setItem(retiredStateKey, '{"retired":"do not import or delete"}');
      localStorage.setItem(retiredReportsKey, '{"runs":[]}');
      sessionStorage.setItem('qa-iphone-seeded', '1');
    }
    window.qaTouchStarts = 0;
    document.addEventListener('touchstart', () => window.qaTouchStarts++, { passive: true });
  }, { state: fixture(), retiredStateKey, retiredReportsKey });
  await page.goto(origin + '/index.html');
  await expect.poll(() => page.evaluate(() => localWriterState)).toBe('owner');
  expect(await page.evaluate(() => KEY)).toBe('cali-plan-v3');
  await expect(page.locator('#app')).toContainText('Handyprüfung');
  await expect(page.locator('#deviceTestBar, #deviceTestTask, [data-settings-device-test]')).toHaveCount(0);
  const zero = { top: 0, bottom: 0, left: 0, right: 0 };
  await tap(page, page.locator('#settingsbtn'), zero);
  await expect(page.locator('#modal')).not.toContainText('Admin & Tests');
  await tap(page, page.getByRole('button', { name: 'Fertig', exact: true }), zero);

  const reserved = { top: 62, bottom: 34, left: 0, right: 0 };
  await reserveEdges(page, reserved);
  await tap(page, page.locator('#startw'), reserved);
  await expect(page.locator('#liveWtElapsed')).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await tap(page, page.locator('#rep-press-0'), reserved);
  await page.locator('#rep-press-0').fill('10');
  // Reduced layout viewport is a space stress test, not an OS keyboard emulator.
  await page.setViewportSize({ width: 402, height: 360 });
  await tap(page, page.locator('#wt-press-0'), reserved);
  expect(await page.locator('#wt-press-0').evaluate(el => getComputedStyle(el).fontSize)).toBe('16px');
  await page.locator('#wt-press-0').fill('20');
  fs.mkdirSync(evidenceDir, { recursive: true });
  await page.screenshot({ path: path.join(evidenceDir, 'iphone17-short-viewport-v0.38.0.png'), scale: 'css' });
  await page.locator('#wt-press-0').blur();
  await page.setViewportSize(devices['iPhone 17 Pro'].viewport);
  await tap(page, page.locator('#stopr'), reserved);
  await tap(page, page.locator('#rep-carry-0'), reserved);
  await page.locator('#rep-carry-0').fill('45');
  await page.locator('#rep-carry-0').blur();
  await tap(page, page.locator('#wt-carry-0'), reserved);
  await page.locator('#wt-carry-0').fill('12,5');
  await page.locator('#wt-carry-0').blur();
  await tap(page, page.locator('#stopr'), reserved);
  await expect.poll(() => page.evaluate(() => S.logs['1|A|press']?.sets[0]?.weight)).toBe('20');
  expect(await page.evaluate(() => S.logs['1|A|carry'].sets[0].reps)).toBe('45');
  expect(await page.evaluate(() => Number(String(S.logs['1|A|carry'].sets[0].weight).replace(',', '.')))).toBe(12.5);
  expect(await page.evaluate(() => window.qaTouchStarts)).toBeGreaterThan(8);

  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await page.evaluate(() => flushSave());
  const savedLogs = await page.evaluate(() => JSON.stringify(S.logs));
  // Playwright 1.61 WebKit's offline flag breaks SW navigations (upstream #42775).
  // For reload, stop our own origin instead. A negative control proves it is down;
  // this is server unavailability, not a claim to simulate the iOS airplane switch.
  await stopOrigin();
  await expect(fetch(origin + '/index.html')).rejects.toThrow();
  await context.setOffline(false);
  await page.reload();
  await expect.poll(() => page.evaluate(() => localWriterState)).toBe('owner');
  expect(await page.evaluate(() => JSON.stringify(S.logs))).toBe(savedLogs);
  expect(await page.evaluate(() => S.workout.running)).toBe(false);
  expect(await page.evaluate(key => localStorage.getItem(key), retiredStateKey)).toBe('{"retired":"do not import or delete"}');
  expect(await page.evaluate(key => localStorage.getItem(key), retiredReportsKey)).toBe('{"runs":[]}');
  await reserveEdges(page, reserved);
  await tap(page, page.locator('#stopw'), reserved);
  await tap(page, page.getByRole('button', { name: 'Speichern & später fortsetzen', exact: true }), reserved);
  const beforeReject = await page.evaluate(() => localStorage.getItem(KEY));
  await page.evaluate(() => importBackup(JSON.stringify({ ...JSON.parse(backupJSON()), deviceTestData: true })));
  await expect(page.locator('#modal')).toContainText('alte Testdaten');
  expect(await page.evaluate(() => localStorage.getItem(KEY))).toBe(beforeReject);
  await page.getByRole('button', { name: 'OK', exact: true }).tap();

  await tap(page, page.locator('#libbtn'), reserved);
  await tap(page, page.locator('#exercisesbtn'), reserved);
  await tap(page, page.locator('#personalnew'), reserved);
  await page.setViewportSize({ width: 402, height: 360 });
  await tap(page, page.locator('#personal-name'), reserved);
  await page.locator('#personal-name').fill('Offline-Test');
  await page.locator('#personal-name').blur();
  await tap(page, page.locator('#personalsave'), reserved);
  await expect(page.locator('#lib')).toContainText('Offline-Test');
  await tap(page, page.locator('#libclose'), reserved);

  await page.setViewportSize(devices['iPhone 17 Pro landscape'].viewport);
  const landscape = { top: 0, bottom: 21, left: 62, right: 62 };
  await reserveEdges(page, landscape);
  await tap(page, page.locator('#libbtn'), landscape);
  await page.locator('#lib').evaluate(el => { el.scrollTop = el.scrollHeight; });
  await tap(page, page.locator('#libclose'), landscape);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize(devices['iPhone 17 Pro'].viewport);
  await reserveEdges(page, reserved);
  await tap(page, page.locator('#settingsbtn'), reserved);
  await tap(page, page.getByRole('button', { name: 'Hell', exact: true }), reserved);
  await tap(page, page.getByRole('button', { name: 'Fertig', exact: true }), reserved);
  await page.screenshot({ path: path.join(evidenceDir, 'iphone17-normal-app-v0.38.0.png'), scale: 'css' });
  await tap(page, page.locator('#settingsbtn'), reserved);
  const download = page.waitForEvent('download');
  await tap(page, page.getByRole('button', { name: 'Vollständiges Backup herunterladen', exact: true }), reserved);
  const file = await download;
  const backupText = fs.readFileSync(await file.path(), 'utf8');
  const backup = JSON.parse(backupText);
  expect(backup.deviceTestData).toBeUndefined();
  expect(await page.evaluate(raw => validateBackupFile(raw), backup)).toBeNull();
  await tap(page, page.getByRole('button', { name: 'Fertig', exact: true }), reserved);
  await tap(page, page.locator('#libbtn'), reserved);
  await page.locator('#backupfile').setInputFiles({ name: 'normal-backup.json', mimeType: 'application/json', buffer: Buffer.from(backupText) });
  const safetyCopy = page.waitForEvent('download');
  const restored = page.waitForEvent('domcontentloaded');
  await tap(page, page.getByRole('button', { name: 'Sichern & wiederherstellen', exact: true }), reserved);
  await tap(page, page.getByRole('button', { name: 'Datei geprüft – wiederherstellen', exact: true }), reserved);
  await safetyCopy;
  await restored;
  await expect.poll(() => page.evaluate(() => localWriterState)).toBe('owner');
  expect(await page.evaluate(() => S.logs['1|A|press'].sets[0].weight)).toBe('20');
  expect(await page.evaluate(() => Object.values(S.personalExercises).map(item => item.name))).toContain('Offline-Test');
  await context.setOffline(false);
  expect(errors).toEqual([]);
});
