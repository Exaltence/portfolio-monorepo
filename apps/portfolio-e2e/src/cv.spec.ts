import { test, expect } from '@playwright/test';

import { HomePage } from '@portfolio-monorepo/test/portfolio-e2e';

test('exposes a resolvable CV download link', async ({ page }) => {
  const home = new HomePage(page);
  await home.goto();

  await expect(home.cvLink).toBeVisible();
  await expect(home.cvLink).toHaveAttribute('href', 'cv-shaun-vercauteren.pdf');

  const resolved = new URL('cv-shaun-vercauteren.pdf', page.url()).toString();
  const response = await page.request.get(resolved);
  expect(response.ok()).toBeTruthy();
});
