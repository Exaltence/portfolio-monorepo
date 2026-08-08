import { test, expect, devices } from '@playwright/test';

import {
  ACCENT_COLOR,
  HomePage,
  ProjectsPage,
  cssOf,
  expectScale,
  holdPointer,
  isHoverCapable,
  releaseWithoutClick,
} from '@portfolio-monorepo/test/portfolio-e2e';

/*
 * Coarse-pointer emulation, which makes `(hover: hover) and (pointer: fine)`
 * evaluate false.
 */
test.use({ ...devices['Pixel 5'] });

test('reports a coarse pointer so the hover guard stays inert', async ({
  page,
}) => {
  const home = new HomePage(page);
  await home.goto();

  expect(await isHoverCapable(page)).toBe(false);
});

test('does not latch hover after a tap', async ({ page }) => {
  const home = new HomePage(page);
  const projects = new ProjectsPage(page);
  await home.goto();

  const resting = await cssOf(projects.next, 'color');
  await projects.next.tap();

  await expect(projects.next).toHaveCSS('color', resting);
  await expectScale(projects.next, 1);
});

test('still gives press feedback on a coarse pointer', async ({ page }) => {
  const home = new HomePage(page);
  const projects = new ProjectsPage(page);
  await home.goto();

  await holdPointer(page, projects.next);
  await expect(projects.next).toHaveCSS('color', ACCENT_COLOR);
  await expectScale(projects.next, 0.96);

  await releaseWithoutClick(page);
});
