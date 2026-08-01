import { test, expect } from '@playwright/test';

test('renders the portfolio shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('app-root')).toBeVisible();
});
