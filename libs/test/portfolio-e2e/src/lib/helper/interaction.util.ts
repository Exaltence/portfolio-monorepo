import { expect, type Locator, type Page } from '@playwright/test';
import { requireBoundingBox } from './wait-for-settled-transform.util';

// Two accents on purpose: `--mc` is chrome, `--mc-text` is the only one allowed on text
export const ACCENT_COLOR = 'rgb(152, 119, 80)';
export const ACCENT_TEXT_COLOR = 'rgb(173, 138, 94)';

export const isHoverCapable = (page: Page): Promise<boolean> =>
  page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches);

export const cssOf = (
  locator: Locator,
  property: string,
  pseudo?: string,
): Promise<string> =>
  locator.evaluate(
    (el, [prop, pseudoEl]) =>
      getComputedStyle(el, pseudoEl === '' ? undefined : pseudoEl)
        .getPropertyValue(prop)
        .trim(),
    [property, pseudo ?? ''] as const,
  );

export const scaleOf = async (locator: Locator): Promise<number> => {
  const raw = await cssOf(locator, 'scale');
  if (raw === '' || raw === 'none') return 1;
  return Number.parseFloat(raw.split(/\s+/)[0]);
};

export const tokenOf = (page: Page, name: string): Promise<string> =>
  page.evaluate(
    (token) =>
      getComputedStyle(document.documentElement).getPropertyValue(token).trim(),
    name,
  );

export const expectScale = async (
  locator: Locator,
  expected: number,
): Promise<void> => {
  await expect.poll(async () => scaleOf(locator)).toBeCloseTo(expected, 2);
};

export const holdPointer = async (
  page: Page,
  locator: Locator,
): Promise<void> => {
  await locator.scrollIntoViewIfNeeded();
  const box = await requireBoundingBox(locator);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
};

// Moved off the element first: releasing on it would complete a click and open the target
export const releaseWithoutClick = async (page: Page): Promise<void> => {
  await page.mouse.move(1, 1);
  await page.mouse.up();
};

export const tabTo = async (
  page: Page,
  locator: Locator,
  maxTabs = 60,
): Promise<void> => {
  await expect(locator).toBeVisible();

  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab');
    const focused = await locator.evaluate(
      (el) => el === document.activeElement,
    );
    if (focused) return;
  }
  throw new Error(
    `element was not reachable within ${maxTabs} tab stops: ${locator}`,
  );
};

export const expectFocusRing = async (locator: Locator): Promise<void> => {
  expect(await cssOf(locator, 'outline-style')).toBe('solid');
  expect(await cssOf(locator, 'outline-width')).toBe('2px');
  expect(await cssOf(locator, 'outline-color')).toBe(ACCENT_COLOR);
};
