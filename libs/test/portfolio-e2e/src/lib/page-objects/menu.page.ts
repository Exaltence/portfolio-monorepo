import { Locator, Page } from '@playwright/test';

export class MenuPage {
  constructor(private readonly page: Page) {}

  get trigger(): Locator {
    return this.page.getByTestId('menu-trigger');
  }

  get overlay(): Locator {
    return this.page.getByTestId('nav-overlay');
  }

  get items(): Locator {
    return this.page.getByTestId('nav-item');
  }

  get closeButton(): Locator {
    return this.page.getByTestId('nav-close');
  }

  async open(): Promise<void> {
    await this.trigger.click();
  }

  async closeViaOverlay(): Promise<void> {
    await this.overlay.click();
  }

  async navigate(name: string): Promise<void> {
    await this.items.filter({ hasText: name }).click();
  }
}
