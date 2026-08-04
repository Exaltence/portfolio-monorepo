import { test, expect, type Page } from '@playwright/test';

import {
  ProjectsPage,
  recordIsTeleportedStep,
  recordIsInstantSnap,
  recordTrackMotion,
  requireBoundingBox,
  waitForSettledValue,
} from '@portfolio-monorepo/test/portfolio-e2e';

test.use({
  contextOptions: {
    reducedMotion: 'reduce',
  },
});

const settle = (projects: ProjectsPage): Promise<string> =>
  waitForSettledValue(() => projects.trackTransform());

const swipe = async (
  page: Page,
  projects: ProjectsPage,
  dx: number,
): Promise<{ x: number; y: number }> => {
  await projects.viewport.scrollIntoViewIfNeeded();
  const box = await requireBoundingBox(projects.viewport);
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.mouse.move(center.x + dx, center.y, { steps: 10 });
  await page.mouse.up();
  return center;
};

const openCarouselPage = async (
  page: Page,
  projects: ProjectsPage,
): Promise<void> => {
  await expect(async () => {
    await page.goto('/');
    await expect(projects.cards.first()).toBeVisible();
  }).toPass();
};

test.beforeEach(async ({ page }) => {
  const projects = new ProjectsPage(page);
  await openCarouselPage(page, projects);
});

test('reacts immediately to every click, even at the boundaries', async ({
  page,
}) => {
  const projects = new ProjectsPage(page);
  const count = await projects.cards.count();
  let previous = await settle(projects);

  for (let i = 0; i < count * 2; i++) {
    await projects.next.click();
    await expect(async () => {
      expect(await projects.trackTransform()).not.toBe(previous);
    }).toPass();
    previous = await projects.trackTransform();
  }
});

test('loops back to the start seamlessly without a reverse animation', async ({
  page,
}) => {
  const projects = new ProjectsPage(page);
  await projects.viewport.scrollIntoViewIfNeeded();

  const initialIndex = await projects.activeIndex();
  const count = await projects.cards.count();
  const step = await projects.slideStep();

  for (let i = 0; i < count * 2; i++) {
    const samples = await recordTrackMotion(page, async () => {
      await projects.next.click();
      await settle(projects);
    });

    expect(recordIsTeleportedStep(samples, step)).toBe(false);
  }

  expect(await projects.activeIndex()).toBe(initialIndex);
});

test('slides fluidly through rapid navigation across repeated loop boundaries', async ({
  page,
}) => {
  const projects = new ProjectsPage(page);
  await projects.viewport.scrollIntoViewIfNeeded();

  const count = await projects.cards.count();
  const initialIndex = await projects.activeIndex();
  const step = await projects.slideStep();
  const period = count * step;

  const samples = await recordTrackMotion(page, async () => {
    for (let i = 0; i < count * 2; i++) {
      await projects.next.dispatchEvent('click');
    }
    await settle(projects);
  });

  expect(recordIsTeleportedStep(samples, step)).toBe(false);
  expect(recordIsInstantSnap(samples, step, period)).toBe(false);
  expect(await projects.activeIndex()).toBe(initialIndex);
  expect(await projects.hasCardWithinFrame()).toBe(true);
});

test('supports drag/swipe navigation', async ({ page }) => {
  const projects = new ProjectsPage(page);
  const before = await settle(projects);

  await swipe(page, projects, -150);

  await expect(async () => {
    expect(await projects.trackTransform()).not.toBe(before);
  }).toPass();
});

test('opens the modal on a single click immediately after a drag gesture', async ({
  page,
}) => {
  const projects = new ProjectsPage(page);
  const before = await settle(projects);

  const center = await swipe(page, projects, -150);
  await expect(async () => {
    expect(await projects.trackTransform()).not.toBe(before);
  }).toPass();

  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.mouse.up();

  await expect(projects.modalTitle).toBeVisible();
});

test('keeps items visible when the navigation buttons are clicked rapidly', async ({
  page,
}) => {
  const projects = new ProjectsPage(page);
  await projects.viewport.scrollIntoViewIfNeeded();

  const count = await projects.cards.count();
  for (let i = 0; i < count * 5; i++) {
    await projects.next.dispatchEvent('click');
  }

  await expect(projects.cards).toHaveCount(count);
  await expect(async () => {
    expect(await projects.hasCardWithinFrame()).toBe(true);
  }).toPass();
});
