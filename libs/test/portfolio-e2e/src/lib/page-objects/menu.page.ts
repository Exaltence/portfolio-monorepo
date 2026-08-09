import { expect, Locator, Page } from '@playwright/test';
import { gotoReady } from '../helper/navigation.util';

export class MenuPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await gotoReady(this.page, '/', this.trigger);
  }

  get trigger(): Locator {
    return this.page.getByTestId('menu-trigger');
  }

  get overlay(): Locator {
    return this.page.getByTestId('nav-overlay');
  }

  get panel(): Locator {
    return this.page.locator('.site-menu__panel');
  }

  get items(): Locator {
    return this.page.getByTestId('nav-item');
  }

  get closeButton(): Locator {
    return this.page.getByTestId('nav-close');
  }

  async open(): Promise<void> {
    await this.trigger.click();
    await expect(this.items.first()).toBeVisible();
  }

  async closeViaOverlay(): Promise<void> {
    await this.overlay.click();
  }

  async navigate(name: string): Promise<void> {
    await this.items.filter({ hasText: name }).click();
  }
}
