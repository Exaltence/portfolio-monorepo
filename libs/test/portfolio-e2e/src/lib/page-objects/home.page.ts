import { Locator, Page } from '@playwright/test';

export class HomePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  get homeSection(): Locator {
    return this.page.locator('#home');
  }

  get portfolioSection(): Locator {
    return this.page.locator('#portfolio');
  }

  get profileName(): Locator {
    return this.page.getByTestId('profile-name');
  }

  get tabHeaders(): Locator {
    return this.page.getByTestId('tab-header');
  }

  get skillBadges(): Locator {
    return this.page.getByTestId('skill-badge');
  }

  get resumeEntries(): Locator {
    return this.page.getByTestId('resume-entry');
  }

  get cvLink(): Locator {
    return this.page.getByTestId('cv-link');
  }

  async selectTab(name: string): Promise<void> {
    await this.tabHeaders.filter({ hasText: name }).click();
  }
}
