import { expect, type Locator, type Page } from '@playwright/test';

// The navigation is inside the retry because a cold dev server can drop the very first request
export const gotoReady = async (
  page: Page,
  path = '/',
  ready?: Locator,
): Promise<void> => {
  await expect(async () => {
    await page.goto(path);
    if (ready) {
      await expect(ready).toBeVisible();
    }
  }).toPass();
};
