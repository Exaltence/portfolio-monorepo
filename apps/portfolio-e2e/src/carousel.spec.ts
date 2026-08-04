import { test, expect, type Page } from '@playwright/test';

import {
  ProjectsPage,
  recordIsTeleportedStep,
  recordIsInstantSnap,
  recordTrackMotion,
  waitForSettledValue,
} from '@portfolio-monorepo/test/portfolio-e2e';

test.use({
  contextOptions: {
    reducedMotion: 'reduce',
  },
});

const settle = (projects: ProjectsPage): Promise<string> =>
  waitForSettledValue(() => projects.trackTransform());

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
