import { test, expect } from '@playwright/test';

import { HomePage } from '@portfolio-monorepo/test/portfolio-e2e';

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
