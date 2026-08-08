import { test, expect } from '@playwright/test';

import {
  ACCENT_COLOR,
  HomePage,
  MenuPage,
  ProjectsPage,
  ThemePage,
  cssOf,
  expectFocusRing,
  expectScale,
  holdPointer,
  isHoverCapable,
  releaseWithoutClick,
  tabTo,
  tokenOf,
} from '@portfolio-monorepo/test/portfolio-e2e';

test('applies hover affordances on a fine pointer', async ({ page }) => {
  const home = new HomePage(page);
  const projects = new ProjectsPage(page);
  const theme = new ThemePage(page);
  await home.goto();

  expect(await isHoverCapable(page)).toBe(true);

  await projects.next.hover();
  await expect(projects.next).toHaveCSS('color', ACCENT_COLOR);
  await expectScale(projects.next, 1.08);

  await theme.toggle.hover();
  await expect(theme.toggle).toHaveCSS('color', ACCENT_COLOR);
});

test('compresses on pointer press and springs back on release', async ({
  page,
}) => {
  const home = new HomePage(page);
  const projects = new ProjectsPage(page);
  await home.goto();

  await holdPointer(page, projects.next);
  await expect(projects.next).toHaveCSS('color', ACCENT_COLOR);
  await expectScale(projects.next, 0.96);

  await releaseWithoutClick(page);
  await expectScale(projects.next, 1);
});

test('grows the tab underline on press, leaving the active tab alone', async ({
  page,
}) => {
  const home = new HomePage(page);
  await home.goto();

  const activeTab = home.tabHeaders.first();
  const idleTab = home.tabHeaders.nth(1);

  expect(await cssOf(idleTab, 'width', '::before')).toBe('0px');

  await holdPointer(page, idleTab);
  await expect
    .poll(async () => cssOf(idleTab, 'width', '::before'))
    .not.toBe('0px');
  await releaseWithoutClick(page);

  await holdPointer(page, activeTab);
  await expect(activeTab).toHaveCSS('color', ACCENT_COLOR);
  await releaseWithoutClick(page);
});

test('draws a focus ring on keyboard focus', async ({ page }) => {
  const home = new HomePage(page);
  const menu = new MenuPage(page);
  const projects = new ProjectsPage(page);
  await home.goto();

  await tabTo(page, menu.trigger);
  await expectFocusRing(menu.trigger);

  await page.goto('/');
  await tabTo(page, projects.carousel);
  await expectFocusRing(projects.carousel);

  await page.goto('/');
  await menu.open();
  await tabTo(page, menu.items.first());
  await expectFocusRing(menu.items.first());
});

test.describe('reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('neutralises every scale and duration token', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    for (const token of [
      '--hover-grow-scale',
      '--hover-grow-scale-strong',
      '--hover-shrink-scale',
      '--press-scale',
      '--press-scale-deep',
    ]) {
      await expect.poll(async () => tokenOf(page, token)).toBe('1');
    }

    for (const token of [
      '--motion-duration-press',
      '--motion-duration-state',
      '--motion-duration-scene',
    ]) {
      await expect
        .poll(async () => Number.parseFloat(await tokenOf(page, token)))
        .toBeLessThan(1);
    }

    await expect
      .poll(async () =>
        Number.parseFloat(await tokenOf(page, '--motion-stagger')),
      )
      .toBe(0);
  });

  /*
   * Guards the tokens actually reaching the elements: asserting token values
   * alone passes even when a hover state hard-codes its own scale.
   */
  test('holds rendered scale at rest while hovering', async ({ page }) => {
    const home = new HomePage(page);
    const projects = new ProjectsPage(page);
    await home.goto();

    await projects.next.hover();
    await expectScale(projects.next, 1);

    await home.cvLink.hover();
    await expectScale(home.cvLink, 1);
    await expectScale(home.cvIcon, 1);
  });
});
