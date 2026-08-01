import { Locator, Page } from '@playwright/test';

export class ProjectsPage {
  constructor(private readonly page: Page) {}

  get cards(): Locator {
    return this.page.getByTestId('project-card');
  }

  get next(): Locator {
    return this.page.getByTestId('carousel-next');
  }

  get prev(): Locator {
    return this.page.getByTestId('carousel-prev');
  }

  get modalTitle(): Locator {
    return this.page.getByTestId('modal-title');
  }

  get modalClose(): Locator {
    return this.page.getByTestId('modal-close');
  }

  get modalNext(): Locator {
    return this.page.getByTestId('modal-next');
  }

  get modalPrev(): Locator {
    return this.page.getByTestId('modal-prev');
  }

  get modalMainImage(): Locator {
    return this.page.getByTestId('modal-main-image');
  }

  modalImage(index: number): Locator {
    return this.page.getByTestId(`modal-image-${index}`);
  }

  async openModal(index = 0): Promise<void> {
    await this.cards.nth(index).click();
  }
}
