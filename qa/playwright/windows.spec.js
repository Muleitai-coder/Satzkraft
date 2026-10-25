const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {compactWorkoutState,openWithPersistedState}=require('./helpers/workout-fixtures.cjs');
// WebKit on macOS can stall background-page creation during video recording.
// Keep all assertions, failure screenshots and traces for this multiwindow case.
test.use({video:'off'});

test('REG-27/P0: zwei Fenster schützen Satzwerte, Übernahme und ungesicherte Entwürfe', async ({ page, context }) => {
  test.slow(); // Four WebKit pages plus lifecycle and download transitions.
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const seeded = compactWorkoutState();
  const exercise = seeded.programs[seeded.active].days[0].ex[0];
  await openWithPersistedState(page, seeded);
  await expect.poll(() => page.evaluate(() => localWriterState)).toBe('owner');
  const second = await context.newPage();
  second.on('pageerror', error => errors.push(error.message));
  await second.setViewportSize({ width: 320, height: 720 });
  await second.goto('/index.html');
  await expect(second.locator('#windowNotice')).toBeVisible();
  await expect.poll(() => second.evaluate(() => localWriterState)).toBe('other');
  await expect(second.locator('#windowNotice')).toContainText('in einem anderen Fenster');
  expect(await second.locator('#app').evaluate(node => node.inert)).toBe(true);
  await page.locator('#startw').click();
  if (exercise.w) await page.locator(`#wt-${exercise.id}-0`).fill('20');
  await page.locator(`#rep-${exercise.id}-0`).fill('10');
  await page.locator(`#rep-${exercise.id}-0`).blur();
  await expect.poll(() => page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return saved.store[saved.active].logs[exerciseLogKey(PROG().days[0].ex[0])]?.sets[0].reps;
  })).toBe('10');
  const latest = await page.evaluate(() => localStorage.getItem(KEY));
  expect(await second.evaluate(() => {
    const ex = PROG().days[0].ex[0];
    writeSets(ex, [{ reps: '999', weight: '999' }]);
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new PageTransitionEvent('pagehide'));
    return persist();
  })).toBe(false);
  expect(await second.evaluate(() => localStorage.getItem(KEY))).toBe(latest);
  // Übernahme gibt niemals die Freigabe eines laufenden anderen Fensters gewaltsam frei.
  await second.locator('#windowReload').click();
  await expect.poll(() => second.evaluate(() => localWriterState)).toBe('other');
  for (const theme of ['light', 'dark']) {
    await second.evaluate(value => applyTheme(value, false), theme);
    expect(await second.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await second.locator('#windowReload').focus();
    await second.keyboard.press('Shift+Tab');
    await expect(second.locator('#windowBackup')).toBeFocused();
  }
  await page.close();
  await expect.poll(() => second.evaluate(async () => (await navigator.locks.query()).held.length)).toBe(0);
  await second.locator('#windowReload').click();
  await expect.poll(() => second.evaluate(() => localWriterState)).toBe('owner');
  await expect(second.locator('#windowNotice')).toBeHidden();
  expect(await second.evaluate(() => S.workout.running)).toBe(false);
  expect(await second.evaluate(() => getSets(PROG().days[0].ex[0])[0].reps)).toBe('10');
  // Erhaltener Seitenkontext (BFCache) muss die Freigabe erneut erwerben und frisch laden.
  await second.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  await expect.poll(() => second.evaluate(() => localWriterState)).toBe('suspended');
  await second.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await expect.poll(() => second.evaluate(() => localWriterState)).toBe('owner');
  // Eine alte, nicht kooperierende App-Version wird als Konflikt erkannt; kein stiller Merge.
  const legacy = await context.newPage();
  legacy.on('pageerror', error => errors.push(error.message));
  await legacy.goto('/index.html');
  await second.evaluate(() => { S.notes['unsaved-test'] = 'Ungesicherter Entwurf'; save(); clearTimeout(saveT); });
  await legacy.evaluate(() => {
    const state = JSON.parse(localStorage.getItem(KEY));
    state.store[state.active].notes['legacy-test'] = 'Fremder neuer Stand';
    localStorage.setItem(KEY, JSON.stringify(state));
  });
  await expect.poll(() => second.evaluate(() => localWriterState)).toBe('conflict');
  await expect(second.locator('#windowNotice')).toContainText('ungespeicherten Änderungen');
  expect(await second.evaluate(() => flushSave())).toBe(false);
  expect(await second.evaluate(() => S.notes['unsaved-test'])).toBe('Ungesicherter Entwurf');
  expect(await second.evaluate(() => JSON.parse(localStorage.getItem(KEY)).store[S.active].notes['legacy-test'])).toBe('Fremder neuer Stand');
  const download = second.waitForEvent('download');
  await second.locator('#windowBackup').click();
  const rescued = await download;
  expect(rescued.suggestedFilename()).toBe('satzkraft-fenster-backup.json');
  const rescuedData = JSON.parse(fs.readFileSync(await rescued.path(), 'utf8'));
  expect(rescuedData.store[seeded.active].notes['unsaved-test']).toBe('Ungesicherter Entwurf');
  expect(rescuedData.windowDraft.format).toBe('satzkraft-fenster-entwurf');
  await expect(second.locator('#windowFeedback')).toContainText('Prüfe die heruntergeladene Datei');
  await second.locator('#windowReload').click();
  await expect.poll(() => second.evaluate(() => localWriterState)).toBe('owner');
  expect(await second.evaluate(() => S.notes['legacy-test'])).toBe('Fremder neuer Stand');
  expect(await second.evaluate(() => S.notes['unsaved-test'])).toBeUndefined();
  await second.evaluate(() => { stopWorkout(true); hideModal(); openLib(); openProgramEditor(S.active); });
  await second.locator('[data-ed-tab="details"]').click();
  await second.locator('[data-ed-program="name"]').fill('Mein Entwurf');
  await legacy.evaluate(() => {
    const state = JSON.parse(localStorage.getItem(KEY));
    state.store[state.active].notes['legacy-test'] = 'Weiterer neuer Stand';
    localStorage.setItem(KEY, JSON.stringify(state));
  });
  await expect.poll(() => second.evaluate(() => localWriterState)).toBe('conflict');
  expect(await second.evaluate(() => editorDraft.name)).toBe('Mein Entwurf');
  const editorDownload = second.waitForEvent('download');
  await second.locator('#windowBackup').click();
  const editorRescue = JSON.parse(fs.readFileSync(await (await editorDownload).path(), 'utf8'));
  expect(editorRescue.windowDraft.program.name).toBe('Mein Entwurf');
  await second.locator('#windowReload').click();
  await expect.poll(() => second.evaluate(() => localWriterState)).toBe('owner');
  expect(await second.evaluate(() => S.notes['legacy-test'])).toBe('Weiterer neuer Stand');
  const unsupported = await context.newPage();
  await unsupported.addInitScript(() => Object.defineProperty(navigator, 'locks', { value: undefined }));
  await unsupported.goto('/index.html');
  await expect.poll(() => unsupported.evaluate(() => localWriterState)).toBe('unsupported');
  await expect(unsupported.locator('#windowNotice')).toContainText('aktuellen Browser');
  expect(await unsupported.evaluate(() => flushSave())).toBe(false);
  expect(errors).toEqual([]);
});

