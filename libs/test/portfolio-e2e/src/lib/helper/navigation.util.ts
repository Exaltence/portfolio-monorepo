import { expect, type Locator, type Page } from '@playwright/test';

// Navigates and waits for the page to be genuinely interactive before handing back
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
