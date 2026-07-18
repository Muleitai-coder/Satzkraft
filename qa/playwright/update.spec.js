const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const APP_STATE_KEY = 'cali-plan-v3';
const THEME_KEY = 'training-theme-v1';
const REPORT_BACKUP = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../../TESTBACKUP-AUSWERTUNG.json'),
    'utf8'
  )
);

const INTRO_COPY = [
  'Mit diesem Update passt Satzkraft besser auf deine Trainingsdaten auf.',
  'Abgeschlossene Trainings bleiben genau so, wie du sie trainiert hast.',
  'Zahlen ausbessern geht weiterhin jederzeit – über ‚Werte korrigieren‘.',
  'Trainiert und wiederholt wird vorne – in deiner aktuellen Woche, Nachholen aus der Vorwoche inklusive.',
  'Änderungen an deinem Plan gelten ab jetzt und lassen Vergangenes unverändert. Alles andere bleibt, wie du es kennst.',
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function reportState(mutator) {
  const state = clone(REPORT_BACKUP);
  state.store[state.active].zonesIntroSeen = true;
  if (mutator) mutator(state, state.programs[state.active], state.store[state.active]);
  return state;
}

async function openWithState(page, state, options = {}) {
  const theme = options.theme || 'dark';
  await page.addInitScript(
    ({ appStateKey, themeKey, seededState, seededTheme }) => {
      localStorage.clear();
      localStorage.setItem(themeKey, seededTheme);
      localStorage.setItem(appStateKey, JSON.stringify(seededState));
    },
    {
      appStateKey: APP_STATE_KEY,
      themeKey: THEME_KEY,
      seededState: state,
      seededTheme: theme,
    }
  );
  await page.goto('/index.html');
  await expect(page.locator('#app .ptitle')).toBeVisible();
}

async function openPrograms(page) {
  await page.locator('#libbtn').click();
  await expect(page.locator('#lib.open')).toBeVisible();
}

async function openCreateHub(page) {
  await openPrograms(page);
  await page.locator('#createhubbtn').click();
  await expect(page.locator('#lib h1')).toHaveText('Neues Programm');
}

async function openProgramLibrary(page) {
  await openCreateHub(page);
  await page.locator('#programlibrarybtn').click();
  await expect(page.locator('#lib h1')).toHaveText('Fertige Programme');
}

async function openFirstExerciseInEditor(page) {
  await openPrograms(page);
  await page.locator('#lib .progitem.active [data-edit]').click();
  await expect(page.locator('#lib h1')).toHaveText('Programm bearbeiten');
  await page.locator('#lib [data-ed-openex="0"]').click();
  await expect(page.locator('#lib [data-ed-ex-card="0"]')).toHaveClass(
    /open/
  );
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
  test('TXT-01/P0: Erststart erklärt das Zonenmodell wortgleich und genau einmal', async ({
    page,
  }) => {
    await page.goto('/index.html');

    const modal = page.locator('#modal');
    await expect(modal.locator('.mtitle')).toHaveText(
      'Neu: Dein Trainingstagebuch ist geschützt'
    );
    await expect(modal.locator('.mmsg > p')).toHaveText(INTRO_COPY);
    await expect(modal.locator('.mbtn')).toHaveText(['Verstanden']);

    await modal
      .getByRole('button', { name: 'Verstanden', exact: true })
      .click();
    await expect(modal).toBeHidden();

    await page.reload();
    await expect(
      page.locator('#modal .mtitle', {
        hasText: 'Neu: Dein Trainingstagebuch ist geschützt',
      })
    ).toHaveCount(0);
  });

  test('TXT-02/P0: alte abgeschlossene Einheit ist Protokoll mit zwei klaren Auswegen', async ({
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
    await expect(bar.locator('b')).toHaveText(
      'Diese Einheit ist Teil deines Protokolls.'
    );
    await expect(bar.locator('button')).toHaveText([
      'Werte korrigieren',
      'Diesen Inhalt heute trainieren',
    ]);
    await expect(bar.locator('#startw')).toHaveCount(0);
  });

  test('TXT-03/P0: Korrektur benennt die Konsequenz und verändert keine History', async ({
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
    const modal = page.locator('#modal');
    await expect(modal.locator('.mtitle')).toHaveText('Werte korrigieren');
    await expect(modal.locator('.mmsg')).toHaveText(
      'Du bearbeitest dein Protokoll. Empfehlungen späterer Wochen rechnen mit den neuen Werten.'
    );
    await expect(modal.locator('.mbtn')).toHaveText([
      'Weiter',
      'Abbrechen',
    ]);
    await modal.getByRole('button', { name: 'Weiter', exact: true }).click();

    await expect(page.locator('#bar #finishcorrection')).toHaveText('Fertig');
    await expect(page.locator('#card-A_0 .editnote')).toHaveText(
      'Du korrigierst nur die Satzwerte. Trainingszeit und Protokolleintrag bleiben unverändert.'
    );
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

  test('TXT-04/P0: Wiederholen warnt exakt vor neu berechneten Empfehlungen', async ({
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

    await expect(page.locator('#startw')).toHaveText(
      'Training wiederholen (ersetzt die letzte Einheit)'
    );
    await page.locator('#startw').click();

    const modal = page.locator('#modal');
    await expect(modal.locator('.mtitle')).toHaveText(
      'Training wiederholen?'
    );
    await expect(modal.locator('.mmsg')).toHaveText(
      'Alle eingetragenen Satzwerte dieses Tages werden geleert. Beim Beenden ersetzt die neue Trainingszeit außerdem die bisher gespeicherte Zeit. Empfehlungen der folgenden Wochen werden aus den neuen Werten neu berechnet. Deine eingetragenen Werte bleiben unverändert.'
    );
    await expect(modal.locator('.mbtn')).toHaveText([
      'Zurücksetzen & wiederholen',
      'Abbrechen',
    ]);
  });

  test('TXT-05/P1: Programmbibliothek kommuniziert Umfang und Metadaten konsistent', async ({
    page,
  }) => {
    await openWithState(page, reportState());
    await openProgramLibrary(page);

    await expect(page.locator('#lib .subviewlead')).toHaveText(
      'Vier geprüfte Programme mit passenden Trainingswochen, Warm-up und Cool-down. Du kannst jedes Programm vor dem Speichern vollständig ansehen.'
    );
    const items = page.locator('#lib [data-library-index]');
    await expect(items).toHaveCount(4);
    await expect(items.locator('b')).toHaveText([
      'Gym Ganzkörper Beginner',
      'Gym Ganzkörper Fortgeschritten',
      'Calisthenics Einstieg',
      'Hybrid: Gym + Calisthenics',
    ]);
    await expect(items.locator('.libraryprogrammeta')).toHaveText([
      'Kraftbasis & Muskelaufbau · Einsteiger · 3 Tage · 50–65 min',
      'Kraft & Muskelaufbau · Fortgeschritten · 3 Tage · 65–80 min',
      'Körpergewichtskraft · Einsteiger · 3 Tage · 40–50 min',
      'Kraft & Körperkontrolle · Grundlagenerfahrung · 3 Tage · 60–75 min',
    ]);
  });

  test('TXT-06/P1: Ladefehler der Programmbibliothek ist kurz, konkret und handlungsorientiert', async ({
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

  test('TXT-07/P1: Autocomplete überschreibt vorhandene Angaben nur nach klarer Rückfrage', async ({
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

  test('TXT-08/P1: Tauschmodal trennt Aktion, Konsequenz und Vorschläge', async ({
    page,
  }) => {
    await openWithState(
      page,
      reportState((state, program, store) => {
        store.week = 8;
        store.day = 'A';
      })
    );

    await page.locator('[data-swap-ex="A_0"]').click();
    const modal = page.locator('#modal');
    await expect(modal.locator('.mtitle')).toHaveText('Übung tauschen');
    await expect(modal.locator('.edlabel')).toHaveText(
      'Ersatzübung für dieses Training'
    );
    await expect(modal.locator('#swapname')).toHaveAttribute(
      'placeholder',
      'Zum Beispiel Kurzhantel-Bankdrücken'
    );
    await expect(modal.locator('.swapsuggestions > span')).toHaveText(
      'Passende Vorschläge'
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
      'Der Tausch gilt für die ausgewählte Einheit und verändert nicht die Progression der Originalübung. Du kannst ihn schon vor dem Trainingsstart vorbereiten.'
    );
    await expect(modal.locator('.mbtn')).toHaveText([
      'Übung nur heute tauschen',
      'Abbrechen',
    ]);
  });

  test('TXT-09/P0: Mehrtag-Hinweis nennt Herkunft, behält Ziel und Progression aber taggetrennt', async ({
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

    await expect(page.locator('#card-A_0 .otherlast')).toHaveText(
      'Letzter Wert an anderem Tag · Mittwoch (W7): 6×90 kg · 6×90 kg · 5×90 kg'
    );
    await expect(page.locator('#card-A_0 .last')).toContainText(
      'Zuletzt (W6):'
    );
    await expect(page.locator('#ww-A_0')).not.toHaveValue('90');
  });

  test('TXT-10/P0: getauschter Fremdwert zählt nicht als Originalwert', async ({
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

    await expect(page.locator('#card-A_0 .otherlast')).toHaveText(
      'Letzter Wert an anderem Tag · Mittwoch (W6): 10×87.5 kg · 9×87.5 kg · 9×87.5 kg'
    );
    await expect(page.locator('#card-A_0 .otherlast')).not.toContainText(
      '90 kg'
    );
  });
});

test.describe('2 · UI/UX-Klarheit & Visual Regression', () => {
  test('@visual VS-01/P1: Erststart-Modal bleibt auf allen Projekten klar lesbar', async ({
    page,
  }) => {
    await page.goto('/index.html');
    await expect(page.locator('#modal .mtitle')).toHaveText(
      'Neu: Dein Trainingstagebuch ist geschützt'
    );
    await waitForFonts(page);
    await expect(page).toHaveScreenshot('erststart-modal-dunkel.png', {
      fullPage: true,
    });
  });

  test('@visual VS-02/P1: gesperrte Einheit zeigt keine überladene Aktionsleiste', async ({
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
    await expect(page).toHaveScreenshot('protokoll-wegweiser-dunkel.png', {
      fullPage: true,
    });
  });

  test('@visual VS-03/P1: Erstellen-Hub bleibt auch im Hellmodus klar priorisiert', async ({
    page,
  }) => {
    await openWithState(page, reportState(), { theme: 'light' });
    await openCreateHub(page);
    await waitForFonts(page);
    await expect(page).toHaveScreenshot('erstellen-hub-hell.png', {
      fullPage: true,
    });
  });

  test('@visual VS-04/P1: Mehrtag-Zeile bricht bei Mobile ohne Verschiebung um', async ({
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

  test('VIS-05/P0: zentrale Oberflächen haben keinen horizontalen Overflow', async ({
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

    await openCreateHub(page);
    expect(
      await horizontalOverflow(page, ['html', 'body', '#lib', '#lib .libbox'])
    ).toEqual([]);
  });

  test('VIS-06/P1: höchstens eine Entscheidungsebene liegt sichtbar über der App', async ({
    page,
  }) => {
    await openWithState(page, reportState());
    expect(await visibleOverlayIds(page)).toEqual([]);

    await openPrograms(page);
    expect(await visibleOverlayIds(page)).toEqual(['lib']);

    await page.locator('#libreset').click();
    expect(await visibleOverlayIds(page)).toEqual(['modal', 'lib']);
    await expect(page.locator('#modal .mtitle')).toHaveText(
      'Fortschritt zurücksetzen?'
    );
    // #lib bleibt als Hintergrundfläche sichtbar; nur #modal ist interaktiv.
    await expect(page.locator('#modal')).toHaveCSS('z-index', '95');
    await expect(page.locator('#lib')).toHaveCSS('z-index', '85');
  });

  test('@visual VIS-22/P1: vier Tauschentscheidungen werden als bekannte Überladungsgrenze eingefroren', async ({
    page,
  }) => {
    await openWithState(
      page,
      reportState((state, program, store) => {
        store.week = 8;
        store.day = 'A';
      })
    );

    await page.locator('[data-swap-ex="A_0"]').click();
    await page
      .getByRole('button', {
        name: 'Übung nur heute tauschen',
        exact: true,
      })
      .click();
    await page.locator('#startw').click();
    await page.locator('[data-swap-ex="A_0"]').click();

    const actions = page.locator('#modal .mbtn');
    await expect(actions).toHaveCount(4);
    await expect(actions).toHaveText([
      'Übung nur heute tauschen',
      'Ab jetzt ersetzen',
      'Original verwenden',
      'Abbrechen',
    ]);
    await waitForFonts(page);
    await expect(page.locator('#modal .mbox')).toHaveScreenshot(
      'tauschmodal-vier-entscheidungen.png'
    );
  });
});

test.describe('3 · Redundanz-Check', () => {
  test('RED-01/P0: gerenderter DOM enthält keine doppelten IDs', async ({
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

  test('RED-02/P1: Kopfzeile enthält nur Programme und Auswertung', async ({
    page,
  }) => {
    await openWithState(page, reportState());
    const buttons = page.locator('#app .topright > button');
    await expect(buttons).toHaveCount(2);
    await expect(buttons).toHaveText(['Programme', 'Auswertung']);
    await expect(page.locator('#app .topright #themebtn')).toHaveCount(0);
    await expect(page.locator('#app .topright .appversion')).toHaveCount(0);
  });

  test('RED-03/P0: laufendes Training hat genau eine Zeit- und Steuerleiste', async ({
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

    await expect(page.locator('#bar .workoutbar')).toHaveCount(1);
    await expect(page.locator('#bar #barWtElapsed')).toHaveCount(1);
    await expect(page.locator('#bar #barpausew')).toHaveCount(1);
    await expect(page.locator('#bar #barstopw')).toHaveCount(1);
    await expect(page.locator('#app #wtElapsed')).toHaveCount(0);
    await expect(page.locator('#app .workoutpanel')).toHaveCount(0);
    await expect(page.locator('#bar .workoutbar button')).toHaveText([
      'Pause',
      'Ende',
    ]);
  });

  test('RED-04/P1: Erstellen-Hub hat fünf eindeutige Wege und Bibliothek zuerst', async ({
    page,
  }) => {
    await openWithState(page, reportState());
    await openCreateHub(page);

    const choices = page.locator('#lib .createchoice');
    await expect(choices).toHaveCount(5);
    await expect(choices.locator('b')).toHaveText([
      'Fertiges Programm wählen',
      'Manuell erstellen',
      'Satzkraft KI-Coach Beta',
      'Mit ChatGPT & Co. erstellen',
      'Fertiges Programm importieren',
    ]);
    const ids = await choices.evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe('programlibrarybtn');
  });

  test('RED-05/P1: Bibliotheken begrenzen und deduplizieren Auswahlmengen', async ({
    page,
  }) => {
    await openWithState(page, reportState());
    await openProgramLibrary(page);
    const programs = page.locator('#lib [data-library-index]');
    await expect(programs).toHaveCount(4);
    const programNames = await programs
      .locator('b')
      .evaluateAll((nodes) => nodes.map((node) => node.textContent.trim()));
    expect(new Set(programNames).size).toBe(4);
  });
});

test.describe('4 · Regression & Offline-PWA', () => {
  test.use({ serviceWorkers: 'allow' });

  test('REG-23/P1: Shell, Programme und Übungsbibliothek funktionieren nach dem Priming offline', async ({
    page,
    context,
  }) => {
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
    await page.reload();
    await expect(page.locator('#app .ptitle')).toHaveText(
      'Satzkraft 8-Wochen-Test'
    );

    const cachedAssets = await page.evaluate(async () => {
      const [exercises, program] = await Promise.all([
        fetch('/uebungen.json').then((response) => response.json()),
        fetch('/programme/gym-ganzkoerper-beginner.json').then((response) =>
          response.json()
        ),
      ]);
      return {
        exerciseCount: exercises.length,
        programName: program.name,
      };
    });
    expect(cachedAssets).toEqual({
      exerciseCount: 200,
      programName: 'Gym Ganzkörper Beginner',
    });

    await openProgramLibrary(page);
    await page.locator('#lib [data-library-index="0"]').click();
    await expect(page.locator('#lib .libsec')).toHaveText([
      'Wochenstruktur',
      'Alle Übungen',
    ]);
    await expect(page.locator('#lib .calibrationguide summary')).toHaveText(
      'Startgewichte finden'
    );
  });
});

test.describe('4 · Regression & Kernfunktion', () => {
  test('REG-01/P0: Training starten, Satz speichern und unterbrochen beenden', async ({
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
    await expect(page.locator('#bar')).toContainText('Training läuft');

    await page.locator('#rep-A_0-0').fill('8');
    await page.locator('#wt-A_0-0').fill('60');
    await page.locator('#barstopw').click();

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
  });

  test('REG-02/P0: v0.22-Backup bleibt vollständig und Woche 8 trainierbar', async ({
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

  test('REG-03/P0: abgesicherte Zustände erzeugen keine Konsolenfehler', async ({
    page,
  }) => {
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await openWithState(page, reportState());
    await openProgramLibrary(page);
    await page.locator('#createhubback').click();
    await page.locator('#createback').click();
    await page.locator('#libclose').click();
    await page.locator('#pdf').click();
    await expect(page.locator('#report.open')).toBeVisible();
    expect(errors).toEqual([]);
  });
});
