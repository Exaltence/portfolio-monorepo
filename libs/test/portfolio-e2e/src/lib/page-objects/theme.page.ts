import { Locator, Page } from '@playwright/test';

export class ThemePage {
  constructor(private readonly page: Page) {}

  get toggle(): Locator {
    return this.page.getByTestId('theme-toggle');
  }

  async toggleTheme(): Promise<void> {
    await this.toggle.click();
  }

  async isLight(): Promise<boolean> {
    return this.page.evaluate(() =>
      document.documentElement.classList.contains('light'),
    );
  }

  async storedTheme(): Promise<string | null> {
    return this.page.evaluate(() => localStorage.getItem('theme'));
  }
}
