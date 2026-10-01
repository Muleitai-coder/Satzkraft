const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const APP_STATE_KEY = 'cali-plan-v3';
const THEME_KEY = 'training-theme-v1';
const REDESIGN_NOTICE_KEY = 'satzkraft-design-update-v1';
const BACKUP_META_KEY = 'satzkraft-backup-meta-v1';
const REPORT_BACKUP = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../../TESTBACKUP-AUSWERTUNG.json'),
    'utf8'
  )
);

const CORRECTION_EFFECT_COPY =
  'Du änderst nur die Satzwerte dieser abgeschlossenen Einheit. Trainingszeit und Protokolleintrag bleiben unverändert. Empfehlungen und Zielwerte späterer Wochen werden nach deiner Korrektur neu berechnet.';

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

function weightedTimedWorkoutState() {
  return reportState((state, program, store) => {
    program.weeks = program.weeks.slice(0, 2);
    program.days = [program.days[0]];
    const category = program.days[0].ex[0].cat;
    program.days[0].ex = [
      {
        id: 'carry',
        name: 'Suitcase Carry',
        en: 'Suitcase Carry',
        cat: category,
        w: true,
        bw: false,
        unit: 'seconds',
        inc: 2.5,
        def: 20,
        reps: [30, 45],
        tmode: 'target',
        perSide: true,
        sub: 'Aufrecht gehen und den Rumpf stabil halten.',
      },
    ];
    for (const week of program.weeks) week.sets = { [category]: 2 };
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

function weightedRepWorkoutState() {
  const state = weightedTimedWorkoutState();
  const exercise = state.programs[state.active].days[0].ex[0];
  exercise.id = 'press';
  exercise.name = 'Beinpresse';
  exercise.en = 'Leg Press';
  exercise.unit = 'reps';
  exercise.reps = [8, 12];
  exercise.perSide = false;
  delete exercise.tmode;
  return state;
}

function weightedRepHistoryWorkoutState() {
  const state = weightedRepWorkoutState();
  const program = state.programs[state.active];
  const store = state.store[state.active];
  const dayKey = program.days[0].key;
  store.week = 2;
  store.logs[`1|${dayKey}|press`] = {
    sets: [
      { reps: '10', weight: '20' },
      { reps: '10', weight: '20' },
    ],
  };
  return state;
}

async function openWithState(page, state, options = {}) {
  const theme = options.theme || 'dark';
  await page.addInitScript(
    ({ appStateKey, themeKey, noticeKey, backupKey, seededState, seededTheme, showUpdateNotice, showBackupReminder }) => {
      localStorage.clear();
      localStorage.setItem(themeKey, seededTheme);
      if (!showUpdateNotice) localStorage.setItem(noticeKey, '1');
      if (!showBackupReminder)
        localStorage.setItem(
          backupKey,
          JSON.stringify({ snoozeUntil: Date.now() + 365 * 86400000 })
        );
      localStorage.setItem(appStateKey, JSON.stringify(seededState));
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

async function openPrograms(page) {
  await page.locator('#libbtn').click();
  await expect(page.locator('#lib.open')).toBeVisible();
}

async function openProgramLibrary(page) {
  await openPrograms(page);
  await expect(page.locator('#lib .tplcard')).toHaveCount(4);
}

async function openFirstExerciseInEditor(page) {
  await openActiveProgramInEditor(page);
  await page.locator('#lib [data-ed-openex="0"]').click();
  await expect(page.locator('#lib [data-ed-ex-card="0"]')).toHaveClass(
    /open/
  );
}

async function openActiveProgramInEditor(page) {
  await openPrograms(page);
  await page.locator('#lib .progitem.active [data-edit]').click();
  await expect(page.locator('#lib h1')).toHaveText('Programm bearbeiten');
}

async function waitForFonts(page) {
  await page.evaluate(() => document.fonts && document.fonts.ready);
}

async function visibleOverlayIds(page) {
  return page.evaluate(() => {
    const selectors = ['#modal', '#lib', '#report', '#wucd'];
    return selectors
      .map((selector) => document.querySelector(selector))
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 0
        );
      })
      .map((element) => element.id);
  });
}

async function horizontalOverflow(page, selectors) {
  return page.evaluate((targets) => {
    return targets
      .map((selector) => {
        const element = document.querySelector(selector);
        if (!element) return { selector, missing: true };
        return {
          selector,
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
        };
      })
      .filter(
        (entry) =>
          entry.missing || entry.scrollWidth > entry.clientWidth + 1
      );
  }, selectors);
}

test.describe('1 · Texte & Kommunikation', () => {
  test('TXT-03/P0: alte abgeschlossene Einheit zeigt nur die eindeutige Korrekturaktion', async ({
    page,
  }) => {
    await openWithState(
      page,
      reportState((state, program, store) => {
        store.week = 1;
        store.day = 'A';
      })
    );

    const bar = page.locator('#bar');
    await expect(bar.locator('button')).toHaveCount(1);
    await expect(bar.locator('#correctvalues')).toHaveText(
      'Workout bearbeiten'
    );
    await expect(bar).not.toContainText(
      'Diese Einheit ist Teil deines Protokolls'
    );
    await expect(bar.locator('#traintoday')).toHaveCount(0);
    await expect(bar.locator('#startw')).toHaveCount(0);
  });

  test('TXT-05/P0: Workout bearbeiten ändert Werte mit Sicherungsstand und verändert keine History', async ({
    page,
  }) => {
    await openWithState(
      page,
      reportState((state, program, store) => {
        store.week = 1;
        store.day = 'A';
      })
    );

    const historyBefore = await page.evaluate(() =>
      JSON.parse(JSON.stringify(window.S.history))
    );

    await page.locator('#correctvalues').click();
    await expect(page.locator('#bar #finishcorrection')).toHaveText(
      'Speichern'
    );
    await expect(page.locator('#bar #cancelcorrection')).toHaveText(
      'Abbrechen'
    );
    await expect(page.locator('#card-A_0 .editnote')).toHaveCount(0);

    await page.locator('#rep-A_0-0').fill('9');
    await page.locator('#cancelcorrection').click();
    await expect(page.locator('#bar #correctvalues')).toBeVisible();
    expect(
      await page.evaluate(() => window.S.logs['1|A|A_0'].sets[0].reps)
    ).toBe('8');

    await page.locator('#correctvalues').click();
    await page.locator('#rep-A_0-0').fill('9');
    await page.locator('#finishcorrection').click();

    const result = await page.evaluate(() => ({
      history: JSON.parse(JSON.stringify(window.S.history)),
      reps: window.S.logs['1|A|A_0'].sets[0].reps,
      workout: window.S.workout,
    }));
    expect(result.history).toEqual(historyBefore);
    expect(result.reps).toBe('9');
    expect(result.workout).toBeNull();
  });

  test('TXT-06/P0: direkte Textänderung lässt sich verwerfen und bewusst übernehmen', async ({
    page,
  }) => {
    await openWithState(
      page,
      reportState((state, program, store) => {
        store.week = 1;
        store.day = 'A';
        store.logs['1|A|A_0'].swap = 'Beinpresse';
        store.logs['1|A|A_0'].swapDecision = 'training';
      })
    );

    const historyBefore = await page.evaluate(() =>
      JSON.parse(JSON.stringify(window.S.history))
    );
    await page.locator('[data-expand-prev="A_0"]').click();
    const input = page.locator('#rep-A_0-0');
    const modal = page.locator('#modal');
    await expect(input).toHaveValue('8');

    await input.fill('9');
    await input.press('Tab');
    await expect(modal.locator('.mtitle')).toHaveText('Wert übernehmen?');
    await expect(modal.locator('.mmsg')).toContainText('Beinpresse');
    await expect(modal.locator('.mmsg')).not.toContainText(
      'Langhantel-Kniebeuge'
    );
    await expect(modal.locator('.mmsg')).toContainText('Satz 1: 8 → 9 Wdh');
    await expect(modal.locator('.mmsg')).toContainText(
      CORRECTION_EFFECT_COPY
    );
    await expect(modal.locator('.mbtn')).toHaveText([
      'Übernehmen',
      'Verwerfen',
    ]);
    await modal
      .getByRole('button', { name: 'Verwerfen', exact: true })
      .click();
    await expect(input).toHaveValue('8');
    expect(
      await page.evaluate(() => window.S.logs['1|A|A_0'].sets[0].reps)
    ).toBe('8');

    await input.fill('9');
    await input.press('Tab');
    await modal
      .getByRole('button', { name: 'Übernehmen', exact: true })
      .click();
    await expect(input).toHaveValue('9');

    const result = await page.evaluate(() => ({
      history: JSON.parse(JSON.stringify(window.S.history)),
      reps: window.S.logs['1|A|A_0'].sets[0].reps,
      workout: window.S.workout,
    }));
    expect(result.history).toEqual(historyBefore);
    expect(result.reps).toBe('9');
    expect(result.workout).toBeNull();
  });

  test('TXT-08/P0: Workout bearbeiten ersetzt den Wiederholen-Knopf und warnt vor neu berechneten Empfehlungen', async ({
    page,
  }) => {
    await openWithState(
      page,
      reportState((state, program, store) => {
        store.week = 3;
        store.day = 'A';
        const newest =
          Math.max(
            ...store.history.map((entry) => entry.end || entry.start || 0)
          ) + 60_000;
        const selected = store.history.find(
          (entry) => entry.week === 3 && entry.day === 'A'
        );
        selected.start = newest - selected.dur * 1000;
        selected.end = newest;
      })
    );

    const bar = page.locator('#bar');
    await expect(bar.locator('#correctvalues')).toHaveText(
      'Workout bearbeiten'
    );
    await expect(bar.locator('#startw')).toHaveCount(0);
    await expect(bar).not.toContainText('Training wiederholen');

    await page.locator('[data-expand-prev="A_0"]').click();
    const input = page.locator('#rep-A_0-0');
    await input.fill('10');
    await input.press('Tab');

    const modal = page.locator('#modal');
    await expect(modal.locator('.mtitle')).toHaveText('Wert übernehmen?');
    await expect(modal.locator('.mmsg')).toContainText(
      CORRECTION_EFFECT_COPY
    );
    await expect(modal.locator('.mbtn')).toHaveText([
      'Übernehmen',
      'Verwerfen',
    ]);
  });

  test('TXT-16/P1: Programmbibliothek kommuniziert Umfang und Metadaten konsistent', async ({
    page,
  }) => {
    await openWithState(page, reportState());
    await openPrograms(page);

    const templates = page.locator('#lib .tplcard');
    await expect(templates).toHaveCount(4);
    await expect(templates.locator('.tplname')).toHaveText([
      'Gym Ganzkörper',
      'Gym Ganzkörper',
      'Calisthenics',
      'Hybrid: Gym + Calisthenics',
    ]);
    await expect(templates.locator('.tplmeta')).toHaveText([
      '3 Tage · 50–65 min',
      '3 Tage · 65–80 min',
      '3 Tage · 40–50 min',
      '3 Tage · 60–75 min',
    ]);
    await expect(templates.locator('.tpllevel')).toHaveText([
      'Einsteiger',
      'Fortgeschritten',
      'Einsteiger',
      'Grundlagenerfahrung',
    ]);
    await page.locator('#libclose').click();
  });

  test('TXT-19/P1: Ladefehler der Programmbibliothek ist kurz, konkret und handlungsorientiert', async ({
    page,
  }) => {
    await page.route(
      '**/programme/gym-ganzkoerper-beginner.json',
      (route) => route.abort()
    );
    await openWithState(page, reportState());
    await openProgramLibrary(page);
    await page.locator('#lib [data-library-index="0"]').click();

    const modal = page.locator('#modal');
    await expect(modal.locator('.mtitle')).toHaveText(
      'Programm nicht geladen'
    );
    await expect(modal.locator('.mmsg')).toHaveText(
      'Das Programm konnte nicht geladen werden. Öffne die Liste einmal mit Internet – danach funktioniert sie auch offline.'
    );
    await expect(modal.locator('.mbtn')).toHaveText(['OK']);
  });

  test('TXT-23/P1: Autocomplete überschreibt vorhandene Angaben nur nach klarer Rückfrage', async ({
    page,
  }) => {
    await openWithState(
      page,
      reportState((state, program) => {
        program.days[0].ex[0].en = 'Bestehender englischer Name';
      })
    );
    await openFirstExerciseInEditor(page);

    const nameInput = page.locator(
      '#lib [data-ed-field="name"][data-ed-day="0"][data-ed-ex="0"]'
    );
    await nameInput.fill('bench');

    const options = page.locator('#exerciseautocomplete-0-0 [role="option"]');
    await expect(options).toHaveCount(6);
    const optionNames = await options
      .locator('span')
      .evaluateAll((nodes) => nodes.map((node) => node.textContent.trim()));
    expect(new Set(optionNames).size).toBe(optionNames.length);

    await page
      .locator(
        '#exerciseautocomplete-0-0 [data-exercise-suggestion="Bankdrücken"]'
      )
      .click();

    const modal = page.locator('#modal');
    await expect(modal.locator('.mtitle')).toHaveText(
      'Vorhandene Angaben ersetzen?'
    );
    await expect(modal.locator('.mmsg')).toHaveText(
      'Für diese Übung sind bereits Angaben hinterlegt. Soll Satzkraft Typ, englischen Namen, Technik-Hinweis, Video-Suchbegriff und Ersatzübung mit den Bibliothekswerten überschreiben?'
    );
    await expect(modal.locator('.mbtn')).toHaveText([
      'Bibliothekswerte übernehmen',
      'Abbrechen',
    ]);
    await modal
      .getByRole('button', {
        name: 'Bibliothekswerte übernehmen',
        exact: true,
      })
      .click();

    await expect(
      page.locator(
        '#lib [data-ed-field="name"][data-ed-day="0"][data-ed-ex="0"]'
      )
    ).toHaveValue('Bankdrücken');
    await expect(
      page.locator(
        '#lib [data-ed-field="exerciseType"][data-ed-day="0"][data-ed-ex="0"]'
      )
    ).toHaveValue('weight');
  });

  test('TXT-24/P0: Tauschmodal trennt Aktion, Konsequenz und Vorschläge', async ({
    page,
  }) => {
    await openWithState(
      page,
      reportState((state, program, store) => {
        store.week = 8;
        store.day = 'A';
      })
    );

    await page.locator('[data-expand-prev="A_0"]').click();
    await page.locator('[data-exmenu="A_0"]').click();
    const modal = page.locator('#modal');
    await modal.getByRole('button', { name: 'Übung ersetzen' }).click();

    await expect(modal.locator('.mtitle')).toHaveText('Übung tauschen');
    await expect(modal.locator('.edlabel')).toHaveText('Ersatzübung');
    await expect(modal.locator('#swapname')).toHaveAttribute(
      'placeholder',
      'Übungsname eingeben'
    );
    await expect(modal.locator('.swapsuggestions > span')).toHaveText(
      'Empfohlene Ersatzübung'
    );

    const suggestions = modal.locator('[data-swap-suggestion]');
    const count = await suggestions.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(3);
    const labels = await suggestions.evaluateAll((nodes) =>
      nodes.map((node) => node.textContent.trim())
    );
    expect(new Set(labels).size).toBe(labels.length);

    await expect(modal.locator('.muted')).toHaveText(
      'Für dieses Training wird nur die angezeigte Übung geändert. Nach einem vollständig beendeten Training entscheidest du für jeden Tausch einzeln, ob er künftig bleiben soll.'
    );
    await expect(modal.locator('.mbtn')).toHaveText([
      'Übung tauschen',
      'Abbrechen',
    ]);
    await expect(
      modal.getByRole('button', { name: /Dauerhaft|Ab jetzt/ })
    ).toHaveCount(0);
  });

  test('TXT-27/P0: Mehrtag-Hinweis nennt Herkunft, behält Ziel und Progression aber taggetrennt', async ({
    page,
  }) => {
    await openWithState(
      page,
      reportState((state, program, store) => {
        store.week = 7;
        store.day = 'A';
        program.days.find((day) => day.key === 'B').ex[0].name =
          'Langhantel-Kniebeuge';
      })
    );

    await page.locator('[data-expand-prev="A_0"]').click();
    await expect(page.locator('#card-A_0 .otherlast')).toHaveText(
      'Anderer Tag · Mi (W7): 6×90 kg · 6×90 kg · 5×90 kg'
    );
    await expect(page.locator('#card-A_0 .last')).toContainText(
      'Zuletzt (W6):'
    );
    await expect(page.locator('#wt-A_0-0')).not.toHaveValue('90');
    await expect(page.locator('#wt-A_0-0')).not.toHaveAttribute(
      'placeholder',
      '90'
    );
  });

  test('FUN-X-03/P0: getauschter Fremdwert zählt nicht als Originalwert', async ({
    page,
  }) => {
    await openWithState(
      page,
      reportState((state, program, store) => {
        store.week = 7;
        store.day = 'A';
        program.days.find((day) => day.key === 'B').ex[0].name =
          'Langhantel-Kniebeuge';
        store.logs['7|B|B_0'].swap = 'Beinpresse';
      })
    );

    await page.locator('[data-expand-prev="A_0"]').click();
    await expect(page.locator('#card-A_0 .otherlast')).toHaveText(
      'Anderer Tag · Mi (W6): 10×87.5 kg · 9×87.5 kg · 9×87.5 kg'
    );
    await expect(page.locator('#card-A_0 .otherlast')).not.toContainText(
      '90 kg'
    );
  });
});

test.describe('2 · UI/UX-Klarheit & Visual Regression', () => {
  test('@visual VIS-03/P1: gesperrte Einheit zeigt keine überladene Aktionsleiste', async ({
    page,
  }) => {
    await openWithState(
      page,
      reportState((state, program, store) => {
        store.week = 1;
        store.day = 'A';
      })
    );
    await waitForFonts(page);
    await expect(page).toHaveScreenshot('protokoll-wegweiser-dunkel.png');
  });

  test('@visual VIS-06/P1: Programme-Ansicht bleibt auch im Hellmodus klar priorisiert', async ({
    page,
  }) => {
    await openWithState(page, reportState(), { theme: 'light' });
    await openPrograms(page);
    await waitForFonts(page);
    await expect(page).toHaveScreenshot('programme-hell.png');
  });

  test('@visual VIS-17/P1: Mehrtag-Zeile bricht bei Mobile ohne Verschiebung um', async ({
    page,
  }) => {
    await openWithState(
      page,
      reportState((state, program, store) => {
        store.week = 7;
        store.day = 'A';
        program.days.find((day) => day.key === 'B').ex[0].name =
          'Langhantel-Kniebeuge';
      })
    );
    await waitForFonts(page);
    await expect(page.locator('#card-A_0')).toHaveScreenshot(
      'mehrtag-karte.png'
    );
  });

  test('VIS-18/P0: zentrale Oberflächen haben keinen horizontalen Overflow', async ({
    page,
  }) => {
    await openWithState(page, reportState());
    expect(
      await horizontalOverflow(page, [
        'html',
        'body',
        '#app',
        '#bar',
        '.wrap',
      ])
    ).toEqual([]);

    await openPrograms(page);
    expect(
      await horizontalOverflow(page, ['html', 'body', '#lib', '#lib .libbox'])
    ).toEqual([]);
  });

  test('VIS-24/P0: 320-px-Ansicht behält lesbare Satzfelder und ausreichend große Touch-Ziele', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await openWithState(page, compactWorkoutState(1));
    await page.locator('[data-expand-prev]').click();

    const documentWidth = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth
      ),
    }));
    expect(documentWidth.content).toBeLessThanOrEqual(
      documentWidth.viewport + 1
    );

    const inputWidths = await page
      .locator('#app .srow input.inp')
      .evaluateAll((inputs) =>
        inputs
          .filter((input) => {
            const rect = input.getBoundingClientRect();
            const style = getComputedStyle(input);
            return (
              style.display !== 'none' &&
              style.visibility !== 'hidden' &&
              rect.width > 0 &&
              rect.height > 0
            );
          })
          .map((input) =>
            Math.round(input.getBoundingClientRect().width * 100) / 100
          )
      );
    expect(inputWidths.length).toBeGreaterThan(0);
    expect(inputWidths.filter((width) => width < 42)).toEqual([]);

    const touchTargets = await page.evaluate((targets) => {
      return targets.flatMap(({ name, selector }) => {
        const visible = [...document.querySelectorAll(selector)].filter(
          (element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return (
              style.display !== 'none' &&
              style.visibility !== 'hidden' &&
              rect.width > 0 &&
              rect.height > 0
            );
          }
        );
        if (!visible.length) return [{ name, selector, missing: true }];
        return visible.map((element, index) => ({
          name,
          selector,
          index,
          width:
            Math.round(element.getBoundingClientRect().width * 100) / 100,
          height:
            Math.round(element.getBoundingClientRect().height * 100) / 100,
        }));
      });
    }, [
      { name: 'Programme', selector: '#libbtn' },
      { name: 'Auswertung', selector: '#pdf' },
      { name: 'Einstellungen', selector: '#settingsbtn' },
      { name: 'Übungsverlauf', selector: '.exnamelink' },
      { name: 'Video', selector: '.links a' },
      { name: 'Notiz', selector: '.notebtn' },
      { name: 'Übungsaktionen', selector: '.kebab' },
      { name: 'Satzschritt', selector: '.stp' },
    ]);
    expect(touchTargets.filter((target) => target.missing)).toEqual([]);
    expect(
      touchTargets.filter(
        (target) =>
          !target.missing &&
          (target.width < (target.selector === '.stp' ? 32 : 44) ||
            target.height < 44)
      )
    ).toEqual([]);
  });

  test('VIS-24b/P0: gewichtete Zeitübung bleibt bei 320 px klar bedienbar', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await openWithState(page, weightedTimedWorkoutState());
    await page.locator('[data-expand-prev]').click();

    const row = page.locator('.srow.weighted.timed').first();
    const header = page.locator('.setgridhead');
    await expect(row).toBeVisible();
    await expect(header.locator(':scope > span')).toHaveText([
      'Set',
      'Zeit · min',
      'kg',
    ]);
    await expect(header.locator('button')).toHaveCount(0);
    await expect(row.locator('.rowtimer[data-i="0"]')).toBeVisible();

    await page.evaluate(() => {
      document.querySelector('#rep-carry-0').value = '00:00';
      document.querySelector('#wt-carry-0').value = '1000';
    });

    const measurements = await row.evaluate((element) => ({
      rowWidth: element.getBoundingClientRect().width,
      viewportWidth: document.documentElement.clientWidth,
      overflow: element.scrollWidth - element.clientWidth,
      timeWidth: element.querySelector('.settimevalue .inp').getBoundingClientRect().width,
      controls: [...element.querySelectorAll('.setmetricgrid')].map(
        (control) => ({
          width: control.getBoundingClientRect().width,
          buttons: [...control.querySelectorAll('button')].map((button) => ({
            width: button.getBoundingClientRect().width,
            height: button.getBoundingClientRect().height,
          })),
        })
      ),
    }));
    expect(measurements.rowWidth).toBeLessThanOrEqual(
      measurements.viewportWidth
    );
    expect(measurements.overflow).toBeLessThanOrEqual(1);
    expect(measurements.timeWidth).toBeGreaterThanOrEqual(42);
    expect(measurements.controls).toHaveLength(1);
    expect(
      measurements.controls.flatMap((control) => control.buttons).filter(
        (button) => button.width < 32 || button.height < 44
      )
    ).toEqual([]);
    const playSize = await row.locator('.rowtimer[data-i="0"]').evaluate((button) => ({
      width: button.getBoundingClientRect().width,
      height: button.getBoundingClientRect().height,
    }));
    expect(playSize.width).toBeGreaterThanOrEqual(32);
    expect(playSize.height).toBeGreaterThanOrEqual(44);

    await waitForFonts(page);
    await expect(page.locator('#card-carry')).toHaveScreenshot(
      'gewichtete-zeit-320.png'
    );

    await page.locator('#startw').click();
    const timeInput = page.locator('#rep-carry-0');
    await timeInput.click();
    await page.keyboard.type('45');
    await expect(timeInput).toHaveValue('00:45');
    await page.keyboard.press('Backspace');
    await expect(timeInput).toHaveValue('00:04');
    await page.keyboard.type('5');
    await expect(timeInput).toHaveValue('00:45');
    await timeInput.evaluate((input) => {
      input.value = '';
      delete input.dataset.clockDigits;
      delete input.dataset.timeDraft;
    });
    const stopwatch = page.locator('.rowtimer[data-i="0"]');
    await expect(stopwatch).toBeEnabled();
    await stopwatch.click();
    await expect(stopwatch).toHaveClass(/running/);
    await stopwatch.click();
    await expect(timeInput).toHaveValue('00:01');
    await expect(timeInput).toHaveAttribute('maxlength', '5');
    await timeInput.evaluate((input) => {
      input.value = '12:99';
      input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    });
    await expect(timeInput).toHaveValue('12:59');
    await timeInput.evaluate((input) => {
      input.value = '999999';
      input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    });
    await expect(timeInput).toHaveValue('99:59');
  });

  test('VIS-24c/P0: Wiederholungen und Gewicht bleiben bei 320 px in einer Zeile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await openWithState(page, weightedRepWorkoutState());
    await page.locator('[data-expand-prev]').click();

    const row = page.locator('.srow.weighted:not(.timed)').first();
    const header = page.locator('.setgridhead');
    await expect(header.locator(':scope > span')).toHaveText([
      'Set',
      'Wdh',
      'kg',
    ]);
    await page.evaluate(() => {
      document.querySelector('#rep-press-0').value = '0000';
      document.querySelector('#wt-press-0').value = '1000';
    });

    const layout = await row.evaluate((element) => {
      const groups = [...element.querySelectorAll('.setmetricgrid')];
      const boxes = groups.map((group) => group.getBoundingClientRect());
      return {
        overflow: element.scrollWidth - element.clientWidth,
        groupCount: groups.length,
        sameLine: boxes.every((box) => Math.abs(box.top - boxes[0].top) <= 1),
        inputWidths: groups.map(
          (group) => group.querySelector('.inp').getBoundingClientRect().width
        ),
      };
    });
    expect(layout.overflow).toBeLessThanOrEqual(1);
    expect(layout.groupCount).toBe(2);
    expect(layout.sameLine).toBe(true);
    expect(layout.inputWidths.filter((width) => width < 42)).toEqual([]);

    await page.setViewportSize({ width: 393, height: 852 });
    const alignment = await page.evaluate(() => {
      const header = document.querySelector('.setgridhead');
      const row = document.querySelector('.srow.weighted:not(.timed)');
      const headerCells = [...header.children];
      const groups = [...row.querySelectorAll('.setmetricgrid')];
      const center = (element) => {
        const rect = element.getBoundingClientRect();
        return rect.left + rect.width / 2;
      };
      return {
        set: Math.abs(center(headerCells[0]) - center(row.querySelector('.slbl'))),
        reps: Math.abs(
          center(headerCells[1].querySelector('span')) -
            center(groups[0].querySelector('.inp'))
        ),
        weight: Math.abs(
          center(headerCells[2].querySelector('span')) -
            center(groups[1].querySelector('.inp'))
        ),
        prescriptionGap:
          header.getBoundingClientRect().top -
          document.querySelector('#card-press .presc').getBoundingClientRect().bottom,
        rowGap:
          row.getBoundingClientRect().top - header.getBoundingClientRect().bottom,
      };
    });
    expect(alignment.set).toBeLessThanOrEqual(1);
    expect(alignment.reps).toBeLessThanOrEqual(1);
    expect(alignment.weight).toBeLessThanOrEqual(1);
    expect(alignment.prescriptionGap).toBeGreaterThanOrEqual(3);
    expect(alignment.prescriptionGap).toBeLessThanOrEqual(5);
    expect(alignment.rowGap).toBeGreaterThanOrEqual(6);
    expect(alignment.rowGap).toBeLessThanOrEqual(10);

    await page.locator('#startw').click();
    const repetitions = page.locator('#rep-press-0');
    const weight = page.locator('#wt-press-0');
    await expect(repetitions).toHaveAttribute('maxlength', '4');
    await repetitions.evaluate((input) => {
      input.value = '899999';
      input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    });
    await expect(repetitions).toHaveValue('8999');
    await repetitions.fill('9999');
    await row.locator('.setmetricgrid').first().locator('[data-d="1"]').click();
    await expect(repetitions).toHaveValue('9999');
    await weight.evaluate((input) => {
      input.value = '99999';
      input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    });
    await expect(weight).toHaveValue('2000');
    await row.locator('.setmetricgrid').nth(1).locator('[data-d="1"]').click();
    await expect(weight).toHaveValue('2000');
  });

  test('VIS-24d/P1: Aktions-, Vorgabe- und Verlaufszeilen stehen kompakt zusammen', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await openWithState(page, weightedRepHistoryWorkoutState());
    await page.locator('[data-expand-prev]').click();

    const card = page.locator('#card-press');
    await expect(card.locator('.last')).toBeVisible();
    const gaps = await card.evaluate((element) => {
      const links = element.querySelector('.links');
      const prescription = element.querySelector('.presc');
      const history = element.querySelector('.last');
      const rows = element.querySelector('.srows');
      return {
        linksToPrescription:
          prescription.getBoundingClientRect().top - links.getBoundingClientRect().bottom,
        historyToHeaders:
          rows.getBoundingClientRect().top - history.getBoundingClientRect().bottom,
      };
    });
    expect(gaps.linksToPrescription).toBeGreaterThanOrEqual(0);
    expect(gaps.linksToPrescription).toBeLessThanOrEqual(1);
    expect(gaps.historyToHeaders).toBeGreaterThanOrEqual(3);
    expect(gaps.historyToHeaders).toBeLessThanOrEqual(5);
  });

  test('VIS-25/P0: Escape trifft nie still eine Pflicht- oder Risikoentscheidung', async ({
    page,
  }) => {
    await openWithState(page, compactWorkoutState(1));
    await page.evaluate(() => {
      window.__modalDecisions = [];
      showModal('Verbindliche Auswahl', 'Triff eine bewusste Entscheidung.', [
        {
          label: 'Dauerhaft übernehmen',
          cls: 'primary',
          action: () => window.__modalDecisions.push('permanent'),
        },
        {
          label: 'Nur dieses Training',
          action: () => window.__modalDecisions.push('training'),
        },
      ]);
    });

    await expect(page.locator('#modal')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#modal')).toBeVisible();
    expect(await page.evaluate(() => window.__modalDecisions)).toEqual([]);

    await page.evaluate(() => {
      hideModal();
      showModal('Programm löschen?', 'Diese Aktion braucht eine Bestätigung.', [
        {
          label: 'Programm löschen',
          cls: 'danger',
          action: () => window.__modalDecisions.push('deleted'),
        },
        { label: 'Abbrechen', action: null },
      ]);
    });
    await expect(
      page.locator('#modal').getByRole('button', { name: 'Abbrechen' })
    ).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#modal')).toBeHidden();
    expect(await page.evaluate(() => window.__modalDecisions)).toEqual([]);
  });

  test('VIS-19/P0: neuer Editor startet geschlossen und deckt den unteren iPhone-Rand ab', async ({
    page,
  }) => {
    await openWithState(page, reportState());
    await page.evaluate(() => {
      openProgramDraft(exportTranslate(PROG()), 'create');
      document.querySelector('#lib').classList.add('open');
    });

    await expect(page.locator('#lib h1')).toHaveText('Programm erstellen');
    await expect(page.locator('#lib .editorbox')).not.toHaveClass(
      /editing-exercise/
    );
    await expect(page.locator('#lib .edexercise.open')).toHaveCount(0);
    await expect(page.locator('#lib .edsticky button')).toHaveText([
      'Nur speichern',
      'Speichern & aktivieren',
    ]);

    const editorCoverage = await page.locator('#lib').evaluate((lib) => {
      lib.scrollTop = lib.scrollHeight;
      const footer = lib.querySelector('.edsticky');
      const footerRect = footer.getBoundingClientRect();
      const style = getComputedStyle(footer);
      const box = lib.querySelector('.libbox');
      const boxStyle = getComputedStyle(box);
      const header = lib.querySelector('.ohdr');
      const headerRect = header.getBoundingClientRect();
      const backRect = lib.querySelector('#editorback').getBoundingClientRect();
      const closeRect = lib.querySelector('#libclose').getBoundingClientRect();
      const libRect = lib.getBoundingClientRect();
      const restGap =
        parseFloat(boxStyle.paddingBottom) + parseFloat(style.bottom);
      return {
        footer: {
          background: style.backgroundColor,
          paddingBottom: parseFloat(style.paddingBottom),
          bottom: footerRect.bottom,
          scrollportBottom: libRect.bottom - restGap,
        },
        header: {
          top: headerRect.top,
          configuredTop: parseFloat(getComputedStyle(header).top) || 0,
          backTop: backRect.top,
          closeTop: closeRect.top,
          closeBottom: closeRect.bottom,
          scrollportTop: libRect.top,
          scrollportBottom: libRect.bottom,
        },
      };
    });
    expect(editorCoverage.footer.background).toBe('rgba(8, 9, 11, 0.92)');
    expect(editorCoverage.footer.paddingBottom).toBeGreaterThanOrEqual(12);
    expect(editorCoverage.footer.bottom).toBeGreaterThanOrEqual(
      editorCoverage.footer.scrollportBottom - 2
    );
    expect(editorCoverage.header.top).toBeGreaterThanOrEqual(
      editorCoverage.header.scrollportTop + editorCoverage.header.configuredTop - 1
    );
    expect(editorCoverage.header.backTop).toBeGreaterThanOrEqual(
      editorCoverage.header.scrollportTop + editorCoverage.header.configuredTop
    );
    expect(editorCoverage.header.closeTop).toBeGreaterThanOrEqual(
      editorCoverage.header.scrollportTop + editorCoverage.header.configuredTop
    );
    expect(editorCoverage.header.closeBottom).toBeLessThanOrEqual(
      editorCoverage.header.scrollportBottom
    );
  });

  test('VIS-23/P1: höchstens eine Entscheidungsebene liegt sichtbar über der App', async ({
    page,
  }) => {
    await openWithState(page, reportState());
    expect(await visibleOverlayIds(page)).toEqual([]);

    await openPrograms(page);
    expect(await visibleOverlayIds(page)).toEqual(['lib']);

    await page.locator('#lib .progitem.active [data-progmenu]').click();
    await page
      .locator('#modal .mbtn', { hasText: 'Fortschritt zurücksetzen' })
      .click();
    expect(await visibleOverlayIds(page)).toEqual(['modal', 'lib']);
    await expect(page.locator('#modal .mtitle')).toHaveText(
      'Fortschritt zurücksetzen?'
    );
    // #lib bleibt als Hintergrundfläche sichtbar; nur #modal ist interaktiv.
    await expect(page.locator('#modal')).toHaveCSS('z-index', '95');
    await expect(page.locator('#lib')).toHaveCSS('z-index', '85');
  });

  test('@visual VIS-22/P1: Tauschdialog im Training bleibt auf drei eindeutige Aktionen begrenzt', async ({
    page,
  }) => {
    await openWithState(
      page,
      reportState((state, program, store) => {
        store.week = 8;
        store.day = 'A';
      })
    );

    await page.locator('[data-expand-prev="A_0"]').click();
    await page.locator('[data-exmenu="A_0"]').click();
    await page
      .locator('#modal')
      .getByRole('button', { name: 'Übung ersetzen' })
      .click();
    await page.locator('#swapname').fill('Beinpresse');
    await page
      .getByRole('button', {
        name: 'Übung tauschen',
        exact: true,
      })
      .click();
    await expect(page.locator('#card-A_0 .exname')).toHaveText('Beinpresse');
    await page.locator('#startw').click();
    await page.locator('[data-exmenu="A_0"]').click();
    await page
      .locator('#modal')
      .getByRole('button', { name: 'Übung ersetzen' })
      .click();

    const actions = page.locator('#modal .mbtn');
    await expect(actions).toHaveCount(3);
    await expect(actions).toHaveText([
      'Übung tauschen',
      'Original verwenden',
      'Abbrechen',
    ]);
    await expect(
      page.locator('#modal').getByRole('button', {
        name: /Dauerhaft übernehmen|Ab jetzt ersetzen/,
      })
    ).toHaveCount(0);
    await waitForFonts(page);
    await expect(page.locator('#modal .mbox')).toHaveScreenshot(
      'tauschmodal-schlank.png'
    );
  });
});

test.describe('3 · Redundanz-Check', () => {
  test('RED-22/P0: gerenderter DOM enthält keine doppelten IDs', async ({
    page,
  }) => {
    await openWithState(page, reportState());
    const duplicates = await page.locator('[id]').evaluateAll((elements) => {
      const counts = new Map();
      for (const element of elements) {
        counts.set(element.id, (counts.get(element.id) || 0) + 1);
      }
      return [...counts.entries()].filter(([, count]) => count > 1);
    });
    expect(duplicates).toEqual([]);
  });

  test('RED-01/P1: Kopfzeile enthält nur Programme, Auswertung und Einstellungen', async ({
    page,
  }) => {
    await openWithState(page, reportState());
    const buttons = page.locator('#app .topright > button');
    await expect(buttons).toHaveCount(3);
    await expect(buttons.nth(0)).toHaveText('Programme');
    await expect(buttons.nth(1)).toHaveText('Auswertung');
    await expect(buttons.nth(2)).toHaveAttribute(
      'aria-label',
      'Einstellungen'
    );
    await expect(page.locator('#app .topright #themebtn')).toHaveCount(0);
    await expect(page.locator('#app .topright .appversion')).toHaveCount(0);
  });

  test('RED-03/P0: Trainingskarten zeigen keine redundante Klasse, Satzanzahl oder Zielzeile', async ({
    page,
  }) => {
    await openWithState(
      page,
      reportState((state, program, store) => {
        store.week = 8;
        store.day = 'A';
      })
    );
    await page.locator('[data-expand-prev="A_0"]').click();
    const card = page.locator('#app .ex:has(.presc)').first();
    await expect(card).toBeVisible();
    await expect(card.locator('.tag')).toHaveCount(0);
    await expect(card.locator('.presc')).not.toContainText('Sätze');
    await expect(card.locator('.presc')).not.toContainText('Ziel');
    await expect(card.locator('[data-plates]')).toHaveCount(0);
    await expect(card.locator('[data-exmenu]')).toHaveCount(1);
    await expect(card.locator('input[id^="wt-"]').first()).toHaveAttribute(
      'placeholder',
      /\d/
    );
  });

  test('RED-02/P0: laufendes Training hat genau eine Zeit- und Steuerleiste', async ({
    page,
  }) => {
    await openWithState(
      page,
      reportState((state, program, store) => {
        store.week = 8;
        store.day = 'A';
      })
    );
    await page.locator('#startw').click();

    const livecard = page.locator('#app .livecard');
    await expect(livecard).toHaveCount(1);
    await expect(livecard.locator('#liveWtElapsed')).toHaveCount(1);
    await expect(livecard.locator('#pausew')).toHaveCount(1);
    await expect(livecard.locator('#stopw')).toHaveCount(1);
    await expect(livecard.locator('button')).toHaveText(['Pause', 'Ende']);
    await expect(page.locator('#bar .restbar')).toHaveCount(0);
    await expect(page.locator('#app .workoutpanel')).toHaveCount(0);
    await expect(page.locator('#app .legend')).toHaveCount(0);
  });

  test('RED-06/P1: Erstellen-Kacheln führen direkt und ohne alten Zwischen-Hub', async ({
    page,
  }) => {
    await openWithState(page, reportState());
    await openPrograms(page);

    const tiles = page.locator('#lib .createtile');
    await expect(tiles).toHaveCount(4);
    await expect(tiles.locator('b')).toHaveText([
      'KI-Coach',
      'Import',
      'Manuell',
      'ChatGPT & Co.',
    ]);
    await expect(page.locator('#lib .tplcard')).toHaveCount(4);
    const ids = await tiles.evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(new Set(ids).size).toBe(ids.length);

    await page.locator('#manualcreate').click();
    await expect(page.locator('#lib h1')).toHaveText('Manuell erstellen');
    await page.locator('#createhubback').click();
    await expect(page.locator('#lib h1')).toHaveText('Deine Bibliothek');
    await expect(page.locator('#lib .createchoice')).toHaveCount(0);

    await page.locator('#externalaibtn').click();
    await expect(page.locator('#lib h1')).toHaveText('Mit ChatGPT & Co.');
    await page.locator('#subclose').click();
    await expect(page.locator('#lib h1')).toHaveText('Deine Bibliothek');
  });

  test('RED-07/P1: Bibliotheken begrenzen und deduplizieren Auswahlmengen', async ({
    page,
  }) => {
    await openWithState(page, reportState());
    await openProgramLibrary(page);
    const programs = page.locator('#lib .tplcard');
    await expect(programs).toHaveCount(4);
    const programIdentities = await programs.evaluateAll((cards) =>
      cards.map((card) =>
        [
          card.querySelector('.tplname')?.textContent.trim(),
          card.querySelector('.tpllevel')?.textContent.trim(),
        ].join(' · ')
      )
    );
    expect(new Set(programIdentities).size).toBe(4);
  });

  test('RED-08/P0: Übungskarte zeigt nur zwei Hilfsaktionen plus Menü und keinen alten Ballast', async ({
    page,
  }) => {
    await openWithState(
      page,
      reportState((state, program, store) => {
        store.week = 8;
        store.day = 'A';
      })
    );

    await page.locator('[data-expand-prev="A_0"]').click();
    const actions = page.locator('#card-A_0 .links > a, #card-A_0 .links > button');
    await expect(actions).toHaveCount(2);
    await expect(actions).toHaveText(['Video', 'Notiz']);
    await expect(page.locator('#card-A_0 [data-exmenu]')).toHaveCount(1);
    const actionTops = await actions.evaluateAll((nodes) =>
      nodes.map((node) => Math.round(node.getBoundingClientRect().top))
    );
    expect(new Set(actionTops).size).toBe(1);
    await expect(page.locator('#app')).not.toContainText('Garmin');
    await expect(page.locator('#app .pausebtn')).toHaveCount(0);

    await page.locator('#startw').click();
    await expect(
      page.getByRole('button', { name: /Pause starten/i })
    ).toHaveCount(0);
    await expect(page.locator('#app .pausebtn')).toHaveCount(0);
  });
});

test.describe('4 · Regression & Offline-PWA', () => {
  test.use({ serviceWorkers: 'allow' });

  test('REG-23/P1: Shell, Programme und Übungsbibliothek funktionieren nach dem Priming offline', async ({
    page,
    context,
    browserName,
  }, testInfo) => {
    await openWithState(page, reportState());
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect(page.locator('#app .ptitle')).toBeVisible();
    expect(
      await page.evaluate(() => Boolean(navigator.serviceWorker.controller))
    ).toBe(true);

    await context.setOffline(true);
    if (browserName === 'webkit') {
      testInfo.annotations.push({
        type: 'WebKit',
        description:
          'Playwright WebKit kann beim Offline-Reload intern abbrechen; Cache und Offline-UI werden deshalb im kontrollierten Dokument geprüft.',
      });
    } else {
      await page.reload();
      await expect(page.locator('#app .ptitle')).toHaveText(
        'Satzkraft 8-Wochen-Test'
      );
    }

    const cachedAssets = await page.evaluate(async ({ directCache }) => {
      const read = async (assetPath) => {
        if (!directCache) return fetch(assetPath);
        const cached = await caches.match(
          new URL(assetPath, window.location.href).href
        );
        if (!cached) throw new Error(`Nicht im PWA-Cache: ${assetPath}`);
        return cached;
      };
      const [shellResponse, exercisesResponse, programResponse] =
        await Promise.all([
          read('/index.html'),
          read('/uebungen.json'),
          read('/programme/gym-ganzkoerper-beginner.json'),
        ]);
      const [shell, exercises, program] = await Promise.all([
        shellResponse.text(),
        exercisesResponse.json(),
        programResponse.json(),
      ]);
      return {
        shellReady: shell.includes('<title>Satzkraft</title>'),
        exerciseCount: exercises.length,
        programName: program.name,
      };
    }, { directCache: browserName === 'webkit' });
    expect(cachedAssets).toEqual({
      shellReady: true,
      exerciseCount: 200,
      programName: 'Gym Ganzkörper',
    });

    await openProgramLibrary(page);
    if (browserName === 'webkit') {
      await expect(page.locator('#lib [data-library-index]')).toHaveCount(4);
      return;
    }
    await page.locator('#lib [data-library-index="0"]').click();
    await expect(page.locator('#lib h1')).toHaveText('Programm prüfen');
    await expect(page.locator('#lib .pvday')).toHaveCount(3);
    await expect(page.locator('#lib .pvweeks')).toBeVisible();
    await expect(page.locator('#lib .calibrationguide')).toHaveCount(0);
  });
});

test.describe('4 · Regression & Kernfunktion', () => {
  test('REG-01/P0: alle vier Bibliotheksprogramme erreichen eine vollständige Vorschau', async ({
    page,
  }) => {
    await openWithState(page, reportState());
    await openProgramLibrary(page);

    const programNames = [
      'Gym Ganzkörper',
      'Gym Ganzkörper',
      'Calisthenics',
      'Hybrid: Gym + Calisthenics',
    ];

    for (let index = 0; index < programNames.length; index += 1) {
      await page.locator(`#lib [data-library-index="${index}"]`).click();
      await expect(page.locator('#lib h1')).toHaveText('Programm prüfen');
      await expect(page.locator('#lib .pvhdr .ptitle')).toHaveText(
        programNames[index]
      );
      await expect(page.locator('#lib .pvday')).toHaveCount(3);
      await expect(page.locator('#lib .pvweeks')).toBeVisible();
      await expect(page.locator('#lib .calibrationguide')).toHaveCount(0);

      await page.locator('#importpreviewback').click();
      await expect(page.locator('#lib h1')).toHaveText('Deine Bibliothek');
      await expect(page.locator('#lib [data-library-index]')).toHaveCount(4);
    }
  });

  test('REG-03/P0: Auto-Wiederholungsbereiche lassen die geöffnete Trainingsgruppe offen', async ({
    page,
  }) => {
    await openWithState(page, reportState());
    await openActiveProgramInEditor(page);

    await page.locator('#lib [data-ed-tab="details"]').click();

    const groups = page.locator(
      '#lib details[data-ed-section="groups"]'
    );
    await groups.locator('summary').first().click();
    await expect(groups).toHaveAttribute('open', '');

    const category = page
      .locator('#lib details[data-ed-section^="category-"]')
      .first();
    const section = await category.getAttribute('data-ed-section');
    await category.locator('summary').first().click();
    await expect(category).toHaveAttribute('open', '');

    const automaticRanges = category.locator('[data-ed-reps]');
    if (await automaticRanges.isChecked()) {
      await automaticRanges.uncheck();
    } else {
      await automaticRanges.check();
    }

    await expect(
      page.locator('#lib details[data-ed-section="groups"]')
    ).toHaveAttribute('open', '');
    await expect(
      page.locator(
        `#lib details[data-ed-section="${section}"]`
      )
    ).toHaveAttribute('open', '');
  });

  test('REG-04/P0: die automatische Pause startet nach dem letzten Satz vor dem Abschlussdialog', async ({
    page,
  }) => {
    await openWithState(page, compactWorkoutState(1));
    await page.evaluate(() => {
      window.AUTO_REST_DELAY = 0;
      window.DONE_PROMPT_DELAY = 0;
    });

    await page.locator('#startw').click();
    await page.locator('#rep-A_0-0').fill('8');

    await expect(page.locator('#bar .restbar .subline')).toHaveText(
      'Satzpause'
    );
    await expect(page.locator('#modal')).toBeHidden();
    await expect(page.locator('#app .pausebtn')).toHaveCount(0);

    await page.locator('#stopr').click();
    await expect(page.locator('#modal .mtitle')).toHaveText(
      'Alle Übungen erledigt 💪'
    );
  });

  test('REG-05/P0: zwei Tausche werden nach Trainingsende einzeln und unabhängig entschieden', async ({
    page,
  }) => {
    test.slow();
    await openWithState(page, compactWorkoutState(2));
    await page.evaluate(() => {
      window.AUTO_REST_DELAY = 0;
      window.DONE_PROMPT_DELAY = 0;
    });

    for (const [exerciseId, replacement] of [
      ['A_0', 'Beinpresse'],
      ['A_1', 'Kurzhantel-Bankdrücken'],
    ]) {
      await page.locator(`[data-expand-prev="${exerciseId}"]`).click();
      await page.locator(`[data-exmenu="${exerciseId}"]`).click();
      await page
        .locator('#modal')
        .getByRole('button', { name: 'Übung ersetzen' })
        .click();
      await page.locator('#swapname').fill(replacement);
      await page
        .getByRole('button', { name: 'Übung tauschen', exact: true })
        .click();
    }

    await page.locator('#startw').click();
    await page.locator('#rep-A_0-0').fill('8');
    await page.locator('#wt-A_0-0').fill('60');
    await expect(page.locator('#bar .restbar .subline')).toHaveText(
      'Satzpause'
    );
    await page.locator('#stopr').click();

    await page.locator('#rep-A_1-0').fill('8');
    await page.locator('#wt-A_1-0').fill('40');
    await expect(page.locator('#bar .restbar .subline')).toHaveText(
      'Satzpause'
    );
    await page.locator('#stopr').click();
    await expect(page.locator('#modal .mtitle')).toHaveText(
      'Alle Übungen erledigt 💪'
    );
    await page
      .getByRole('button', { name: 'Training beenden', exact: true })
      .click();

    const decisionPage = await page.context().newPage();
    await decisionPage.goto('/index.html');
    await expect(decisionPage.locator('#app .ptitle')).toBeVisible();
    const modal = decisionPage.locator('#modal');
    await expect(modal.locator('.mtitle')).toHaveText(
      'Übung dauerhaft übernehmen?'
    );
    await expect(modal.locator('.mmsg')).toContainText(
      'Langhantel-Kniebeuge wurde in diesem Training durch Beinpresse ersetzt.'
    );
    await expect(modal.locator('.mbtn')).toHaveText([
      'Dauerhaft übernehmen',
      'Nur dieses Training',
    ]);
    await modal
      .getByRole('button', { name: 'Dauerhaft übernehmen', exact: true })
      .click();

    await expect(modal.locator('.mmsg')).toContainText(
      'Bankdrücken wurde in diesem Training durch Kurzhantel-Bankdrücken ersetzt.'
    );
    await modal
      .getByRole('button', { name: 'Nur dieses Training', exact: true })
      .click();

    const result = await decisionPage.evaluate(() => {
      const day = window.S.programs[window.S.active].days[0];
      return {
        exercises: day.ex.map((exercise) => ({
          name: exercise.name,
          en: exercise.en,
          sub: exercise.sub,
          video: exercise.q,
          proxy: exercise.proxy,
          fromWeek: exercise.fromWeek,
          untilWeek: exercise.untilWeek,
        })),
        firstSwap: window.S.logs['1|A|A_0'].swap,
        firstDecision: window.S.logs['1|A|A_0'].swapDecision,
        secondSwap: window.S.logs['1|A|A_1'].swap,
        secondDecision: window.S.logs['1|A|A_1'].swapDecision,
      };
    });
    expect(result.exercises).toContainEqual({
      name: 'Beinpresse',
      en: 'Leg Press',
      sub: expect.stringContaining('untere Rücken'),
      video: 'Leg Press Technik',
      proxy: 'Goblet Squat',
      fromWeek: 2,
      untilWeek: undefined,
    });
    expect(result.exercises).not.toContainEqual(
      expect.objectContaining({
        name: 'Kurzhantel-Bankdrücken',
        fromWeek: 2,
      })
    );
    expect(result.firstSwap).toBe('Beinpresse');
    expect(result.firstDecision).toBe('permanent');
    expect(result.secondSwap).toBe('Kurzhantel-Bankdrücken');
    expect(result.secondDecision).toBe('training');
    await decisionPage.close();
  });

  test('REG-02/P0: Training starten, Satz speichern und unterbrochen beenden', async ({
    page,
  }) => {
    await openWithPersistedState(
      page,
      reportState((state, program, store) => {
        store.week = 8;
        store.day = 'A';
      })
    );

    await page.locator('#startw').click();
    await expect(page.locator('#app .livecard')).toContainText(
      'Training läuft'
    );

    await page.locator('#rep-A_0-0').fill('8');
    await page.locator('#wt-A_0-0').fill('60');
    await page.locator('#stopw').click();

    const modal = page.locator('#modal');
    await expect(modal.locator('.mtitle')).toHaveText('Training beenden?');
    await modal
      .getByRole('button', {
        name: 'Speichern & später fortsetzen',
        exact: true,
      })
      .click();

    const stored = await page.evaluate(() => ({
      reps: window.S.logs['8|A|A_0'].sets[0].reps,
      weight: window.S.logs['8|A|A_0'].sets[0].weight,
      workout: window.S.workout,
      sessions: window.S.history.filter(
        (entry) => entry.week === 8 && entry.day === 'A'
      ),
    }));
    expect(stored.reps).toBe('8');
    expect(stored.weight).toBe('60');
    expect(stored.workout).toBeNull();
    expect(stored.sessions).toHaveLength(1);
    expect(stored.sessions[0].complete).toBe(false);

    await page.reload();
    await expect(page.locator('#app .ptitle')).toBeVisible();
    await expect(page.locator('#startw')).toHaveText('Training fortsetzen');

    const reloaded = await page.evaluate(() => ({
      reps: window.S.logs['8|A|A_0'].sets[0].reps,
      weight: window.S.logs['8|A|A_0'].sets[0].weight,
      workout: window.S.workout,
      sessions: window.S.history.filter(
        (entry) => entry.week === 8 && entry.day === 'A'
      ),
    }));
    expect(reloaded).toEqual(stored);
    expect(reloaded.workout).toBeNull();
    expect(reloaded.sessions).toHaveLength(1);
    expect(reloaded.sessions[0].complete).toBe(false);
  });

  test('FUN-O1-04/P0: v0.22-Backup bleibt vollständig und Woche 8 trainierbar', async ({
    page,
  }) => {
    await openWithState(
      page,
      reportState((state, program, store) => {
        store.week = 8;
        store.day = 'A';
      })
    );

    await expect(page.locator('[data-week="1"]')).toHaveAttribute(
      'aria-label',
      /100 % abgeschlossen/
    );
    await expect(page.locator('[data-week="7"]')).toHaveAttribute(
      'aria-label',
      /100 % abgeschlossen/
    );
    await expect(page.locator('#startw')).toHaveText('Training starten');
    await expect(page.locator('#card-A_0')).toBeVisible();
  });

  test('REG-26/P0: abgesicherte Zustände erzeugen keine Konsolenfehler', async ({
    page,
  }) => {
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await openWithState(page, reportState());
    await openPrograms(page);
    await page.locator('#manualcreate').click();
    await page.locator('#createhubback').click();
    await page.locator('#coachbtn').click();
    await page.locator('#subclose').click();
    await page.locator('#libclose').click();
    await page.locator('#pdf').click();
    await expect(page.locator('#report.open')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('UPD-01/P0: Bestandsnutzer sehen den Design-Update-Hinweis genau einmal', async ({
    page,
  }) => {
    await openWithState(page, reportState(), { updateNotice: true });

    const modal = page.locator('#modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.mtitle')).toContainText('neues Design');
    await expect(modal.locator('.updatelist li')).toHaveCount(4);
    await expect(
      modal.getByRole('button', { name: 'Alle Neuerungen ansehen' })
    ).toBeVisible();

    await modal.getByRole('button', { name: 'Alles klar' }).click();
    await expect(modal).toBeHidden();
    expect(
      await page.evaluate(
        (key) => localStorage.getItem(key),
        REDESIGN_NOTICE_KEY
      )
    ).toBe('1');
  });

  test('UPD-02/P0: Neuinstallation startet ohne Design-Update-Hinweis', async ({
    page,
  }) => {
    await page.goto('/index.html');
    await expect(page.locator('#app .ptitle')).toBeVisible();
    await expect(page.locator('#modal')).toBeHidden();
    expect(
      await page.evaluate(
        (key) => localStorage.getItem(key),
        REDESIGN_NOTICE_KEY
      )
    ).toBe('1');
  });
});
