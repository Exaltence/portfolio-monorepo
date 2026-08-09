import { test, expect } from '@playwright/test';

import { HomePage, tabTo } from '@portfolio-monorepo/test/portfolio-e2e';

test('switches across all four about tabs', async ({ page }) => {
  const home = new HomePage(page);
  await home.goto();

  await expect(home.tabHeaders).toHaveCount(4);
  await expect(home.skillBadges.first()).toBeVisible();

  for (const tab of ['Experience', 'Education', 'Certificates']) {
    await home.selectTab(tab);
    await expect(home.resumeEntries.first()).toBeVisible();
  }

  await home.selectTab('Skills');
  await expect(home.skillBadges.first()).toBeVisible();
});

test('reaches every tab from the keyboard via the arrow keys', async ({
  page,
}) => {
  const home = new HomePage(page);
  await home.goto();

  const tabs = home.tabHeaders;
  const count = await tabs.count();

  await tabTo(page, tabs.first());
  await expect(tabs.first()).toBeFocused();

  for (let i = 1; i < count; i++) {
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(i)).toBeFocused();
    await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true');
  }

  await page.keyboard.press('ArrowRight');
  await expect(tabs.first()).toBeFocused();

  await page.keyboard.press('End');
  await expect(tabs.nth(count - 1)).toBeFocused();

  await page.keyboard.press('Home');
  await expect(tabs.first()).toBeFocused();
  await expect(home.skillBadges.first()).toBeVisible();

  await expect(tabs.first()).toHaveAttribute('tabindex', '0');
  await expect(tabs.nth(count - 1)).toHaveAttribute('tabindex', '-1');

  await page.keyboard.press('Tab');
  await expect(home.tabPanel).toBeFocused();
});
