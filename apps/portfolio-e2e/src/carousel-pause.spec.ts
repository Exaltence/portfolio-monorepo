import { test, expect, type Page } from '@playwright/test';

import {
  ProjectsPage,
  gotoReady,
  requireBoundingBox,
  waitForSettledValue,
} from '@portfolio-monorepo/test/portfolio-e2e';

/*
 * Deliberately not under reduced motion: these specs measure autoplay, which the
 * carousel gates on `prefers-reduced-motion` at construction.
 */

const AUTOPLAY_MS = 3000;
const PARKED = { x: 5, y: 5 };

const expectRotationResumes = async (
  page: Page,
  projects: ProjectsPage,
  from: number,
): Promise<void> => {
  await expect
    .poll(
      async () => {
        await page.evaluate(() =>
          (document.activeElement as HTMLElement | null)?.blur(),
        );
        return projects.activeIndex();
      },
      { timeout: AUTOPLAY_MS * 4 },
    )
    .not.toBe(from);
};

test.describe('the explicit pause control', () => {
  test.slow();

  test('stops rotation on demand and starts it again', async ({ page }) => {
    const projects = new ProjectsPage(page);
    await gotoReady(page, '/', projects.cards.first());
    await projects.viewport.scrollIntoViewIfNeeded();
    await page.mouse.move(PARKED.x, PARKED.y);

    await expect(projects.rotation).toHaveAttribute(
      'aria-label',
      'Pause automatic rotation',
    );

    await projects.rotation.dispatchEvent('click');
    await expect(projects.rotation).toHaveAttribute(
      'aria-label',
      'Resume automatic rotation',
    );

    const held = await projects.activeIndex();
    await new Promise((resolve) => setTimeout(resolve, AUTOPLAY_MS * 2 + 500));
    expect(await projects.activeIndex()).toBe(held);

    await projects.rotation.dispatchEvent('click');
    await expect(projects.rotation).toHaveAttribute(
      'aria-label',
      'Pause automatic rotation',
    );

    await expect
      .poll(() => projects.activeIndex(), { timeout: AUTOPLAY_MS * 3 })
      .not.toBe(held);
  });
});

test.describe('carousel autoplay around the project modal', () => {
  test.slow();

  const openAndAssertPaused = async (
    projects: ProjectsPage,
    open: () => Promise<void>,
  ): Promise<void> => {
    await open();
    await expect(projects.modalTitle).toBeVisible();

    const held = await projects.activeIndex();
    await new Promise((resolve) => setTimeout(resolve, AUTOPLAY_MS * 2 + 500));
    expect(await projects.activeIndex()).toBe(held);
  };

  test('stops while a project opened by mouse is showing, and resumes after', async ({
    page,
  }) => {
    const projects = new ProjectsPage(page);
    await gotoReady(page, '/', projects.cards.first());
    await projects.viewport.scrollIntoViewIfNeeded();

    await projects.carousel.hover();
    await waitForSettledValue(() => projects.trackTransform());

    const box = await requireBoundingBox(projects.cards.first());
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await openAndAssertPaused(projects, async () => {
      await page.mouse.down();
      await page.mouse.up();
    });

    await page.mouse.move(PARKED.x, PARKED.y);

    await page.keyboard.press('Escape');
    await expect(projects.modalTitle).toHaveCount(0);

    await expectRotationResumes(page, projects, await projects.activeIndex());
  });

  test('stops while a project opened by keyboard is showing, and resumes after', async ({
    page,
  }) => {
    const projects = new ProjectsPage(page);
    await gotoReady(page, '/', projects.cards.first());
    await projects.viewport.scrollIntoViewIfNeeded();
    await page.mouse.move(PARKED.x, PARKED.y);

    await projects.carousel.focus();
    await page.keyboard.press('ArrowRight');

    await openAndAssertPaused(projects, () => page.keyboard.press('Enter'));

    await page.keyboard.press('Escape');
    await expect(projects.modalTitle).toHaveCount(0);

    await expectRotationResumes(page, projects, await projects.activeIndex());
  });
});
