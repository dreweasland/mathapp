import { expect, test, type Page } from '@playwright/test';

const GALLERY = 'http://localhost:5199/gallery.html';

/** The worst case of each answer shape, including the longest number path and largest hints. */
const CASES = [
  'skill=1.add-within-20&level=5&type=number-pad',
  'skill=1.add-within-20&level=5&type=number-line',
  'skill=1.add-within-10&level=3&type=multiple-choice',
  'skill=1.counting&level=5&type=number-line',
  'skill=1.counting&level=3&kind=numeral',
  'skill=1.ten-frame&level=2&type=ten-frame',
  'skill=1.ten-frame&level=3&type=ten-frame',
  'skill=1.ten-frame&level=3&type=number-pad',
  'skill=1.sub-within-20&level=5&kind=missing-addend',
  'skill=1.fact-families&level=3&kind=family&type=number-pad',
  'skill=1.fact-families&level=3&kind=family&type=multiple-choice',
  'skill=1.compare&level=3&type=compare',
  'skill=1.compare&level=3&type=multiple-choice',
  'skill=1.place-value&level=5&type=number-pad',
  'skill=1.add-sub-10s&level=2&type=number-pad',
  'skill=1.word-problems&level=5&type=number-pad',
  'skill=1.word-problems&level=4&type=multiple-choice',
  'skill=1.time&level=3&type=clock-face',
  'skill=1.time&level=3&type=multiple-choice',
  'skill=1.shapes&level=3&kind=shape-name',
  'skill=1.shapes&level=3&kind=shape-sides',
  'skill=1.shapes&level=5&kind=shares',
  'skill=1.measure&level=5&type=compare',
  'skill=1.measure&level=5&type=multiple-choice',
  'skill=2.place-value-1000&level=5&kind=place-value-3&type=number-pad',
  'skill=2.place-value-1000&level=5&kind=skip',
  'skill=2.compare-1000&level=5&type=compare',
  'skill=2.add-within-100&level=5&type=number-pad',
  'skill=2.sub-within-100&level=5&type=multiple-choice',
  'skill=2.add-sub-1000&level=5&type=number-pad',
  'skill=2.even-odd&level=5&kind=even-odd',
  'skill=2.even-odd&level=3&kind=skip',
  'skill=2.arrays&level=5&type=number-pad',
  'skill=2.money&level=5&kind=money&type=number-pad',
  'skill=2.money&level=5&kind=money&type=multiple-choice',
  'skill=2.money&level=5&kind=make-amount',
  'skill=2.money&level=5&kind=change&type=number-pad',
  'skill=2.time-5min&level=5&type=clock-face',
  'skill=2.time-5min&level=5&kind=am-pm',
  'skill=2.word-problems-2step&level=5&kind=two-step&type=number-pad',
  'skill=2.word-problems-2step&level=2&kind=arith&type=multiple-choice',
  'skill=2.measure-units&level=5&kind=ruler&type=number-pad',
  'skill=2.measure-units&level=5&kind=estimate',
  'skill=3.mult-concept&level=5&kind=array&type=number-pad',
  'skill=3.mult-facts&level=5&type=multiple-choice',
  'skill=3.div-concept&level=5&kind=share&type=number-pad',
  'skill=3.div-facts&level=5&type=number-pad',
  'skill=3.fact-families-md&level=5&type=number-pad',
  'skill=3.round&level=5&type=number-pad',
  'skill=3.fractions-unit&level=5&kind=fraction&type=multiple-choice',
  'skill=3.fractions-compare&level=5&type=compare',
  'skill=3.fractions-compare&level=5&kind=fraction-compare&type=multiple-choice',
  'skill=3.fractions-compare&level=5&kind=fraction-equal',
  'skill=3.time-minute&level=5&kind=elapsed&type=number-pad',
  'skill=3.time-minute&level=5&kind=elapsed&type=multiple-choice',
  'skill=3.area-perimeter&level=5&type=number-pad',
  'skill=3.word-problems-4ops&level=5&type=number-pad',
];

const VIEWPORTS = [
  { name: 'iPhone 15', width: 393, height: 660 },
  { name: 'iPhone SE', width: 375, height: 553 },
  { name: 'iPhone SE landscape', width: 667, height: 375 },
  { name: 'iPad portrait', width: 768, height: 1024 },
  { name: 'iPad landscape', width: 1024, height: 768 },
];

async function problems(page: Page) {
  return page.evaluate(() => {
    const tooSmall: string[] = [];
    const offScreen: string[] = [];
    for (const button of document.querySelectorAll('button')) {
      const box = button.getBoundingClientRect();
      const name = button.getAttribute('aria-label') ?? button.textContent ?? '?';
      if (box.width < 63.5 || box.height < 63.5) {
        tooSmall.push(`${name} ${Math.round(box.width)}x${Math.round(box.height)}`);
      }
      const inside =
        box.left >= -0.5 &&
        box.top >= -0.5 &&
        box.right <= innerWidth + 0.5 &&
        box.bottom <= innerHeight + 0.5;
      if (!inside) offScreen.push(name);
    }
    const prompt = document.querySelector('[data-testid="prompt"]')?.getBoundingClientRect();
    const scrollsSideways = document.documentElement.scrollWidth > innerWidth;
    return {
      tooSmall,
      offScreen,
      scrollsSideways,
      promptVisible: !!prompt && prompt.height > 0 && prompt.top >= 0,
    };
  });
}

for (const view of VIEWPORTS) {
  test.describe(view.name, () => {
    test.use({ viewport: { width: view.width, height: view.height } });
    for (const help of ['none', 'hint', 'reveal']) {
      test(`every question fits with help=${help}`, async ({ page }) => {
        const failures: string[] = [];
        for (const query of CASES) {
          await page.goto(`${GALLERY}?${query}&help=${help}`);
          await page.waitForSelector('main');
          if (await page.getByTestId('none').count()) {
            failures.push(`${query}: no sample`);
            continue;
          }
          const found = await problems(page);
          if (found.tooSmall.length) failures.push(`${query}: small ${found.tooSmall.join(', ')}`);
          if (found.offScreen.length) failures.push(`${query}: off ${found.offScreen.join(', ')}`);
          if (found.scrollsSideways) failures.push(`${query}: scrolls sideways`);
          if (!found.promptVisible) failures.push(`${query}: prompt hidden`);
        }
        expect(failures).toEqual([]);
      });
    }
  });
}
