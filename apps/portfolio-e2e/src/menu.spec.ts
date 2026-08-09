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

test('keeps keyboard focus inside the open menu', async ({ page }) => {
  const menu = new MenuPage(page);
  await menu.goto();
  await menu.open();

  for (let i = 1; i <= 8; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(
      () => !!document.activeElement?.closest('.site-menu'),
    );
    expect(inside, `tab stop ${i} left the menu`).toBe(true);
  }
});

test('closes on Escape and hands focus back to the trigger', async ({
  page,
}) => {
  const menu = new MenuPage(page);
  await menu.goto();

  /*
   * Opened from the keyboard because WebKit does not focus a button on click
   */
  await menu.trigger.focus();
  await page.keyboard.press('Enter');
  await expect(menu.items.first()).toBeVisible();
  await expect(menu.trigger).toHaveAttribute('aria-expanded', 'true');

  await page.keyboard.press('Escape');

  await expect(menu.items.first()).toBeHidden();
  await expect(menu.trigger).toBeFocused();
  await expect(menu.trigger).toHaveAttribute('aria-expanded', 'false');
});

test('navigates to the portfolio section from the menu', async ({ page }) => {
  const menu = new MenuPage(page);
  await menu.goto();

  await menu.open();
  await menu.navigate('Portfolio');

  await expect(menu.items.first()).toBeHidden();
  await expect(page.locator('#portfolio')).toBeInViewport();
});
