import { test, expect } from '@playwright/test';

import { ProjectsPage } from '@portfolio-monorepo/test/portfolio-e2e';

test.use({
  contextOptions: {
    reducedMotion: 'reduce',
  },
});

test('navigates the carousel and project modal', async ({ page }) => {
  const projects = new ProjectsPage(page);
  await page.goto('/');

  await expect(projects.cards.first()).toBeVisible();
  await projects.next.click();
  await projects.prev.click();

  await projects.openModal(0);
  await expect(projects.modalTitle).toHaveText('MES-MII Outdoor');

  await projects.modalNext.click();
  await expect(projects.modalTitle).toHaveText('Warmste Hackathon');

  await expect(projects.modalMainImage).toHaveAttribute(
    'src',
    /warmstehackathon-team/,
  );
  await projects.modalImage(1).click();
  await expect(projects.modalMainImage).toHaveAttribute(
    'src',
    /warmstehackathon-admin-users/,
  );

  await projects.modalClose.click();
  await expect(projects.modalTitle).toHaveCount(0);
});
