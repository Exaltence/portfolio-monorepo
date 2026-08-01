import { test, expect } from '@playwright/test';

import { ThemePage } from '@portfolio-monorepo/test/portfolio-e2e';

test('persists the theme across a reload', async ({ page }) => {
  const theme = new ThemePage(page);
  await page.goto('/');

  const initiallyLight = await theme.isLight();
  await theme.toggleTheme();

  const nowLight = await theme.isLight();
  expect(nowLight).toBe(!initiallyLight);
  const stored = await theme.storedTheme();
  expect(stored).toBe(nowLight ? 'light' : 'dark');

  await page.reload();

  expect(await theme.isLight()).toBe(nowLight);
  expect(await theme.storedTheme()).toBe(stored);
});
