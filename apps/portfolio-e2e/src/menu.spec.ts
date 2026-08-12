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

test('holds the scroll position while tabbing past the end of the menu', async ({
  page,
}) => {
  const menu = new MenuPage(page);
  await menu.goto();
  await page.evaluate(() => window.scrollTo(0, 800));
  await menu.open();

  const opened = await page.evaluate(() => window.scrollY);
  expect(opened).toBeGreaterThan(0);

  // Enough passes to wrap twice
  for (let i = 1; i <= 8; i++) {
    await page.keyboard.press('Tab');
    expect(
      await page.evaluate(() => Math.round(window.scrollY)),
      `tab stop ${i} moved the page`,
    ).toBe(opened);
  }
});

// Clicking the panel's padding used to drop focus to `<body>`, losing the trap and Escape
test('survives a click on dead space inside the panel', async ({ page }) => {
  const menu = new MenuPage(page);
  await menu.goto();
  await menu.open();

  await menu.panel.click({ position: { x: 4, y: 4 } });
  await expect(menu.items.first()).toBeVisible();

  expect(
    await page.evaluate(
      () => document.activeElement?.closest('.site-menu') != null,
    ),
    'focus left the menu',
  ).toBe(true);

  await page.keyboard.press('Tab');
  expect(
    await page.evaluate(
      () => document.activeElement?.closest('.site-menu') != null,
    ),
    'Tab escaped the focus trap',
  ).toBe(true);

  await page.keyboard.press('Escape');
  await expect(menu.items.first()).toBeHidden();
});

test('closes on Escape and hands focus back to the trigger', async ({
  page,
}) => {
  const menu = new MenuPage(page);
  await menu.goto();

  // Opened from the keyboard because WebKit does not focus a button on click
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

  await expect(page.locator('#portfolio')).toBeFocused();
});
