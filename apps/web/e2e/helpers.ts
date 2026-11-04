import { expect, type Page } from '@playwright/test';
import type { Problem, QuestRun } from '@mathapp/engine';

/** Records what the app says, and finishes each line at once so tests don't wait on a voice. */
export async function stubSpeech(page: Page) {
  await passBadges(page);
  await page.addInitScript(() => {
    const said: string[] = [];
    (window as unknown as { __said: string[] }).__said = said;
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        cancel: () => undefined,
        getVoices: () => [],
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        speak: (u: SpeechSynthesisUtterance) => {
          if (u.text) said.push(u.text);
          setTimeout(() => u.onend?.(new Event('end') as SpeechSynthesisEvent), 0);
        },
      },
    });
  });
}

/**
 * A new badge takes the whole screen until it's tapped past. Most tests aren't about badges,
 * so whenever one is in the way it's closed the way a child would.
 */
export async function passBadges(page: Page) {
  await page.addLocatorHandler(page.getByTestId('badge-reveal'), async (dialog) => {
    await dialog.getByRole('button', { name: 'next' }).click();
  });
}

export const said = (page: Page) =>
  page.evaluate(() => (window as unknown as { __said: string[] }).__said);

/** The quest as saved on the device: the answers come from storage, not from a test hook. */
export function savedRun(page: Page): Promise<QuestRun | undefined> {
  return page.evaluate(
    () =>
      new Promise<QuestRun | undefined>((resolve, reject) => {
        const open = indexedDB.open('mathapp');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const read = open.result.transaction('sessions').objectStore('sessions').getAll();
          read.onsuccess = () => {
            open.result.close();
            const rows = read.result as { run?: QuestRun }[];
            resolve(rows.find((r) => r.run)?.run);
          };
        };
      }),
  );
}

/** Waits for storage to catch up with the problem on screen, then returns that problem. */
export async function problemOnScreen(page: Page): Promise<Problem> {
  const main = page.locator('main[data-stage]');
  await expect(main).toBeVisible();
  const section = Number(await main.getAttribute('data-section'));
  const item = Number(await main.getAttribute('data-item'));
  let problem: Problem | undefined;
  await expect
    .poll(async () => {
      const run = await savedRun(page);
      if (run?.section !== section || run.item !== item) return false;
      problem = run.quest.sections[section]?.items[item]?.problem;
      return true;
    })
    .toBe(true);
  return problem as Problem;
}

export async function answer(page: Page, problem: Problem, value: string) {
  if (problem.questionType === 'number-pad') {
    for (const digit of value) await page.getByRole('button', { name: digit, exact: true }).click();
    await page.getByRole('button', { name: 'check' }).click();
  } else if (problem.questionType === 'ten-frame') {
    const given = problem.tenFrame?.filled ?? 0;
    for (let i = 0; i < Number(value); i++) {
      await page.getByRole('button', { name: `square ${given + i + 1}`, exact: true }).click();
    }
    await page.getByRole('button', { name: 'check' }).click();
  } else {
    await page.locator(`button[data-value="${value}"]:not([disabled])`).first().click();
  }
}

/** A value that's wrong for this problem and can be entered on its screen. */
export function wrongValue(problem: Problem, avoid: string[] = []): string {
  const skip = new Set([problem.answer, ...avoid]);
  if (problem.choices) {
    const other = problem.choices.find((c) => !skip.has(c.value));
    if (other) return other.value;
    throw new Error('No wrong choice left');
  }
  if (problem.questionType === 'number-line') {
    const { min = 0, max = 10 } = problem.numberLine ?? {};
    for (let n = min; n <= max; n++) if (!skip.has(String(n))) return String(n);
  }
  const room = problem.questionType === 'ten-frame' ? 10 - (problem.tenFrame?.filled ?? 0) : 999;
  for (let n = 0; n <= room; n++) if (!skip.has(String(n))) return String(n);
  throw new Error('No wrong value available');
}

export async function setUpChild(page: Page, onSetup = false) {
  if (!onSetup) {
    await page.goto('/');
    await page.getByRole('button', { name: 'Continue in Safari for now' }).click();
  }
  await page.getByLabel("Child's name").fill('Sam');
  await page.getByRole('button', { name: 'avatar fox' }).click();
  await page.getByRole('button', { name: 'done' }).click();
  await page.getByRole('button', { name: 'start warm-up' }).click();
  // Placement ends at the first skill with two misses, so this reaches Home in a few taps.
  const start = page.getByRole('button', { name: 'start quest' });
  for (let i = 0; i < 40 && !(await start.isVisible()); i++) {
    const choice = page.locator('button[data-value]:not([disabled])').first();
    if (await choice.isVisible()) {
      await choice.click();
    } else {
      await page
        .getByRole('button', { name: 'check' })
        .click({ timeout: 500 })
        .catch(async () => {
          await page
            .getByRole('button', { name: '9', exact: true })
            .click({ timeout: 500 })
            .catch(() => undefined);
        });
    }
    await page.waitForTimeout(60);
  }
  await expect(start).toBeVisible();
  await skipTour(page);
}

/** A new child's first Home opens with a guided tour; most tests start after it. */
export async function skipTour(page: Page) {
  await page.getByRole('button', { name: 'Skip tour' }).click();
  await expect(page.getByTestId('tour')).toHaveCount(0);
}

/** Changes one saved row, to set up a state that would take weeks to reach by playing. */
export async function patchRow(page: Page, table: string, changes: Record<string, unknown>) {
  await page.evaluate(
    ({ table, changes }) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('mathapp');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction(table, 'readwrite');
          const store = tx.objectStore(table);
          const all = store.getAll();
          all.onsuccess = () => {
            for (const row of all.result) store.put({ ...row, ...changes });
          };
          tx.oncomplete = () => {
            open.result.close();
            resolve();
          };
        };
      }),
    { table, changes },
  );
}

/** Opens every chest waiting on the current screen. */
export async function openChests(page: Page) {
  const chest = page.getByRole('button', { name: 'open chest' });
  while (await chest.isVisible()) {
    await chest.click();
    await page.getByTestId('chest-reveal').getByRole('button', { name: 'next' }).click();
  }
}

export async function waitForServiceWorker(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }),
      );
    }
  });
}

/** Answers everything correctly until the quest offers the challenge or celebrates. */
export async function playUntilBreak(page: Page) {
  const go = page.getByRole('button', { name: "Let's go", exact: true });
  const offer = page.getByRole('button', { name: "I'm done" });
  const celebrate = page.getByTestId('celebrate');
  const next = page.getByRole('button', { name: 'next' });
  const problemMain = page.locator('main[data-stage="answering"]');
  const worked = page.locator('main[data-stage="worked-example"]');
  for (let i = 0; i < 80; i++) {
    await expect(go.or(offer).or(celebrate).or(problemMain).or(worked).first()).toBeVisible();
    if ((await offer.isVisible()) || (await celebrate.isVisible())) return;
    if (await go.isVisible()) {
      await go.click();
    } else if (await worked.isVisible()) {
      await expect(page.getByTestId('hint')).toBeVisible();
      await next.click();
    } else {
      const before = await problemMain.getAttribute('data-item');
      const section = await problemMain.getAttribute('data-section');
      await answer(page, await problemOnScreen(page), (await problemOnScreen(page)).answer);
      await expect(
        page.locator(
          `main[data-stage="answering"][data-section="${section}"][data-item="${before}"]`,
        ),
      ).toHaveCount(0);
    }
  }
  throw new Error('Quest did not finish');
}

export const PIN = ['1', '2', '3', '4'];

export async function tapPin(page: Page, digits: string[]) {
  const pad = page.getByTestId('pin-pad');
  for (const digit of digits) await pad.getByRole('button', { name: digit, exact: true }).click();
}

/** Answers the grown-up question shown on screen, then sets the PIN. */
export async function createPin(page: Page) {
  const question = await page.getByText(/What is \d+ × \d+\?/).textContent();
  const [, a, b] = /(\d+) × (\d+)/.exec(question ?? '') as RegExpExecArray;
  await tapPin(page, String(Number(a) * Number(b)).split(''));
  await expect(page.getByRole('heading', { name: 'Make a 4-digit PIN' })).toBeVisible();
  await tapPin(page, PIN);
  await expect(page.getByRole('heading', { name: 'Enter it again' })).toBeVisible();
  await tapPin(page, PIN);
}

export async function openGate(page: Page) {
  await page.getByRole('button', { name: 'Sam' }).click();
  await page.getByRole('button', { name: 'grown-ups' }).click();
}

export async function openDashboard(page: Page) {
  await openGate(page);
  await createPin(page);
  await expect(page.getByTestId('parent')).toBeVisible();
}

export async function finishQuest(page: Page) {
  await page.getByRole('button', { name: 'start quest' }).click();
  await playUntilBreak(page);
  const skip = page.getByRole('button', { name: "I'm done" });
  if (await skip.isVisible()) await skip.click();
  await expect(page.getByTestId('celebrate')).toBeVisible();
  await openChests(page);
  await page.getByRole('button', { name: 'home' }).click();
}
