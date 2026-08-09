import { Locator, Page } from '@playwright/test';
import { gotoReady } from '../helper/navigation.util';

export class HomePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await gotoReady(this.page, '/', this.profileName);
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

  get tabPanel(): Locator {
    return this.page.getByTestId('tab-panel');
  }

  get skillBadges(): Locator {
    return this.page.getByTestId('skill-badge');
  }

  get resumeEntries(): Locator {
    return this.page.getByTestId('resume-entry');
  }

  get resumeTitles(): Locator {
    return this.page.locator('.resume-list__title');
  }

  get cvLink(): Locator {
    return this.page.getByTestId('cv-link');
  }

  get cvIcon(): Locator {
    return this.page.locator('.profile-panel__cv-icon');
  }

  get socialLinks(): Locator {
    return this.page.getByTestId('social-link');
  }

  get availability(): Locator {
    return this.page.getByTestId('availability');
  }

  get footerLinks(): Locator {
    return this.page.getByTestId('footer-link');
  }

  get backToTop(): Locator {
    return this.page.getByTestId('back-to-top');
  }

  async selectTab(name: string): Promise<void> {
    await this.tabHeaders.filter({ hasText: name }).click();
  }
}
