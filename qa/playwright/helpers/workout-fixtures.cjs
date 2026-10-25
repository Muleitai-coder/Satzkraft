const fs=require('node:fs');
const path=require('node:path');
const {expect}=require('@playwright/test');
const APP_STATE_KEY = 'cali-plan-v3';
const THEME_KEY = 'training-theme-v1';
const REDESIGN_NOTICE_KEY = 'satzkraft-design-update-v1';
const BACKUP_META_KEY = 'satzkraft-backup-meta-v1';
const REPORT_BACKUP = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../../../TESTBACKUP-AUSWERTUNG.json'),
    'utf8'
  )
);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function reportState(mutator) {
  const state = clone(REPORT_BACKUP);
  if (mutator) mutator(state, state.programs[state.active], state.store[state.active]);
  return state;
}

function compactWorkoutState(exerciseCount = 1) {
  return reportState((state, program, store) => {
    program.weeks = program.weeks.slice(0, 2);
    program.days = [program.days[0]];
    program.days[0].ex = program.days[0].ex.slice(0, exerciseCount);
    const usedCategories = new Set(
      program.days[0].ex.map((exercise) => exercise.cat)
    );
    for (const week of program.weeks) {
      week.sets = {};
      for (const category of usedCategories) week.sets[category] = 1;
    }
    store.tg = {};
    store.barw = {};
    store.notes = {};
    store.logs = {};
    store.history = [];
    store.workout = null;
    store.pendingReplacements = [];
    store.week = 1;
    store.day = program.days[0].key;
    store.blockCelebrated = false;
  });
}

async function openWithPersistedState(page, state, options = {}) {
  const theme = options.theme || 'dark';
  await page.addInitScript(
    ({ appStateKey, themeKey, noticeKey, backupKey, seededState, seededTheme, showUpdateNotice, showBackupReminder }) => {
      const seedMarker = 'satzkraft-playwright-persisted-seed';
      if (sessionStorage.getItem(seedMarker)) return;
      localStorage.clear();
      localStorage.setItem(themeKey, seededTheme);
      if (!showUpdateNotice) localStorage.setItem(noticeKey, '1');
      if (!showBackupReminder)
        localStorage.setItem(
          backupKey,
          JSON.stringify({ snoozeUntil: Date.now() + 365 * 86400000 })
        );
      localStorage.setItem(appStateKey, JSON.stringify(seededState));
      sessionStorage.setItem(seedMarker, '1');
    },
    {
      appStateKey: APP_STATE_KEY,
      themeKey: THEME_KEY,
      noticeKey: REDESIGN_NOTICE_KEY,
      backupKey: BACKUP_META_KEY,
      seededState: state,
      seededTheme: theme,
      showUpdateNotice: options.updateNotice === true,
      showBackupReminder: options.backupReminder === true,
    }
  );
  await page.goto('/index.html');
  await expect(page.locator('#app .ptitle')).toBeVisible();
}


module.exports={clone,reportState,compactWorkoutState,openWithPersistedState};
