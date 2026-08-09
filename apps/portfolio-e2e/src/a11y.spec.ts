import { test, expect } from '@playwright/test';

import {
  HomePage,
  ProjectsPage,
  ThemePage,
  gotoReady,
  requireBoundingBox,
  tokenOf,
  waitForSettledValue,
} from '@portfolio-monorepo/test/portfolio-e2e';

test.use({
  contextOptions: {
    reducedMotion: 'reduce',
  },
});

test('moves the track with arrow-key focus instead of scrolling the viewport', async ({
  page,
}) => {
  const projects = new ProjectsPage(page);
  await gotoReady(page, '/', projects.cards.first());
  await projects.viewport.scrollIntoViewIfNeeded();

  await projects.carousel.focus();
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('ArrowRight');
  }

  await expect.poll(() => projects.viewportScrollLeft()).toBe(0);
  await expect.poll(() => projects.focusedCardIsWithinFrame()).toBe(true);
});

test('restores focus outside the aria-hidden clones after closing a project', async ({
  page,
}) => {
  const projects = new ProjectsPage(page);
  await gotoReady(page, '/', projects.cards.first());
  await projects.viewport.scrollIntoViewIfNeeded();

  const count = await projects.cards.count();
  for (let i = 0; i < count - 1; i++) {
    await projects.next.click();
    await waitForSettledValue(() => projects.trackTransform());
  }

  const clone = await projects.visibleCloneIndex();
  expect(clone).toBeGreaterThanOrEqual(0);

  const parked = await projects.trackTransform();
  const index = await projects.activeIndex();

  await projects.cloneCards.nth(clone).click();
  await expect(projects.modalTitle).toBeVisible();

  await projects.modalClose.click();
  await expect(projects.modalTitle).toHaveCount(0);

  await expect.poll(() => projects.focusIsInsideHiddenSubtree()).toBe(false);

  expect(await projects.trackTransform()).toBe(parked);
  expect(await projects.activeIndex()).toBe(index);
});

test('announces each real slide with its position in the collection', async ({
  page,
}) => {
  const projects = new ProjectsPage(page);
  await gotoReady(page, '/', projects.cards.first());

  const count = await projects.cards.count();
  await expect(projects.slides).toHaveCount(count);

  for (let i = 0; i < count; i++) {
    await expect(projects.slides.nth(i)).toHaveAttribute(
      'aria-roledescription',
      'slide',
    );
    await expect(projects.slides.nth(i)).toHaveAttribute(
      'aria-label',
      `${i + 1} of ${count}`,
    );
  }
});

test('names each tab from its visible text alone', async ({ page }) => {
  const home = new HomePage(page);
  await home.goto();

  const tabs = home.tabHeaders;
  await expect(tabs.first()).toBeVisible();
  const total = await tabs.count();
  expect(total).toBeGreaterThan(0);

  for (let i = 0; i < total; i++) {
    const tab = tabs.nth(i);
    expect(await tab.getAttribute('aria-label')).toBeNull();

    expect((await tab.textContent())?.trim()).toBeTruthy();
  }
});

test('exposes external navigation as real links', async ({ page }) => {
  const home = new HomePage(page);
  await home.goto();

  const outbound = [home.footerLinks, home.socialLinks, home.availability];

  for (const links of outbound) {
    const total = await links.count();
    expect(total).toBeGreaterThan(0);

    for (let i = 0; i < total; i++) {
      const link = links.nth(i);
      await expect(link).toHaveJSProperty('tagName', 'A');
      await expect(link).toHaveAttribute('href', /^https?:\/\//);
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(link).toHaveAttribute('draggable', 'false');
    }
  }

  await expect(home.cvLink).toHaveJSProperty('tagName', 'A');
  await expect(home.cvLink).toHaveAttribute('download', '');
});

test.describe('forced colors', () => {
  test.use({ contextOptions: { forcedColors: 'active' } });

  test('maps both accent tokens onto a system colour', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    for (const token of ['--mc', '--mc-text']) {
      await expect.poll(() => tokenOf(page, token)).toBe('CanvasText');
    }
  });
});

test('does not latch interaction state after a click-hold-drag on a link', async ({
  page,
}) => {
  const home = new HomePage(page);
  const theme = new ThemePage(page);
  await home.goto();

  const link = home.footerLinks.first();
  await link.scrollIntoViewIfNeeded();
  const box = await requireBoundingBox(link);

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 120,
    box.y + box.height / 2 + 60,
    {
      steps: 12,
    },
  );
  await page.mouse.up();
  await page.mouse.move(2, 2);

  await expect
    .poll(() =>
      page.evaluate(() => document.querySelectorAll(':active').length),
    )
    .toBe(0);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.querySelectorAll('.home__footer-link:hover').length,
      ),
    )
    .toBe(0);

  const before = await theme.isLight();
  await theme.toggleTheme();
  await expect.poll(() => theme.isLight()).toBe(!before);
});
