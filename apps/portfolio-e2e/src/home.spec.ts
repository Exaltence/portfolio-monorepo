import { test, expect } from '@playwright/test';

import { HomePage } from '@portfolio-monorepo/test/portfolio-e2e';

test('shows the home and portfolio sections on load', async ({ page }) => {
  const home = new HomePage(page);
  await home.goto();

  await expect(home.homeSection).toBeVisible();
  await expect(home.portfolioSection).toBeVisible();
  await expect(home.profileName).toContainText('Shaun Vercauteren');
});
