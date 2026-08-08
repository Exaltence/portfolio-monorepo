import { test, expect } from '@playwright/test';

import { MenuPage } from '@portfolio-monorepo/test/portfolio-e2e';

test('opens and closes the menu via the overlay', async ({ page }) => {
  const menu = new MenuPage(page);
  await menu.goto();

  await menu.open();
  await expect(menu.items.first()).toBeVisible();

  await menu.closeViaOverlay();
  await expect(menu.items.first()).toBeHidden();
});

test('navigates to the portfolio section from the menu', async ({ page }) => {
  const menu = new MenuPage(page);
  await menu.goto();

  await menu.open();
  await menu.navigate('Portfolio');

  await expect(menu.items.first()).toBeHidden();
  await expect(page.locator('#portfolio')).toBeInViewport();
});
