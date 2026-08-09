import { Locator, Page } from '@playwright/test';

export class ProjectsPage {
  constructor(private readonly page: Page) {}

  get carousel(): Locator {
    return this.page.getByTestId('carousel');
  }

  get cards(): Locator {
    return this.page.locator(
      '.carousel__slide:not([aria-hidden]) [data-testid="project-card"]',
    );
  }

  get next(): Locator {
    return this.page.getByTestId('carousel-next');
  }

  get prev(): Locator {
    return this.page.getByTestId('carousel-prev');
  }

  get rotation(): Locator {
    return this.page.getByTestId('carousel-rotation');
  }

  get slides(): Locator {
    return this.page.locator('.carousel__slide[role="group"]');
  }

  get viewport(): Locator {
    return this.page.getByTestId('carousel-viewport');
  }

  get track(): Locator {
    return this.page.locator('.carousel__track');
  }

  async trackTransform(): Promise<string> {
    return this.track.evaluate((el) => getComputedStyle(el).transform);
  }

  async activeIndex(): Promise<number> {
    const raw = await this.carousel.getAttribute('data-active-index');
    const index = Number(raw);
    return Number.isNaN(index) ? 0 : index;
  }

  async slideStep(): Promise<number> {
    return this.track.evaluate((el) => {
      const slides = el.querySelectorAll<HTMLElement>('.carousel__slide');
      return (
        slides[1].getBoundingClientRect().left -
        slides[0].getBoundingClientRect().left
      );
    });
  }

  get cloneCards(): Locator {
    return this.page.locator(
      '.carousel__slide[aria-hidden="true"] [data-testid="project-card"]',
    );
  }

  async viewportScrollLeft(): Promise<number> {
    return this.viewport.evaluate((el) => el.scrollLeft);
  }

  async focusedCardIsWithinFrame(): Promise<boolean> {
    return this.viewport.evaluate((viewportEl) => {
      const active = document.activeElement as HTMLElement | null;
      if (!active || !viewportEl.contains(active)) {
        return false;
      }
      const frame = viewportEl.getBoundingClientRect();
      const rect = active.getBoundingClientRect();
      return rect.left >= frame.left - 1 && rect.right <= frame.right + 1;
    });
  }

  async focusIsInsideHiddenSubtree(): Promise<boolean> {
    return this.page.evaluate(
      () => document.activeElement?.closest('[aria-hidden="true"]') != null,
    );
  }

  /*
   * Index into `cloneCards`, Which slides are clones depends on where the track has
   * settled, so this has to be measured rather than assumed.
   */
  async visibleCloneIndex(): Promise<number> {
    return this.viewport.evaluate((viewportEl) => {
      const frame = viewportEl.getBoundingClientRect();
      const clones = Array.from(
        document.querySelectorAll<HTMLElement>(
          '.carousel__slide[aria-hidden="true"] [data-testid="project-card"]',
        ),
      );
      return clones.findIndex((card) => {
        const rect = card.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.left >= frame.left - 1 &&
          rect.right <= frame.right + 1
        );
      });
    });
  }

  get modalTitle(): Locator {
    return this.page.getByTestId('modal-title').last();
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
    return this.page.getByTestId('modal-main-image').last();
  }

  modalImage(index: number): Locator {
    return this.page.getByTestId(`modal-image-${index}`);
  }

  async openModal(index = 0): Promise<void> {
    await this.cards.nth(index).click();
  }

  async hasCardWithinFrame(): Promise<boolean> {
    return this.viewport.evaluate((viewportEl) => {
      const frame = viewportEl.getBoundingClientRect();
      const cards = Array.from(
        viewportEl.querySelectorAll<HTMLElement>(
          '.carousel__slide [data-testid="project-card"]',
        ),
      );
      return cards.some((card) => {
        const rect = card.getBoundingClientRect();
        return rect.right > frame.left && rect.left < frame.right;
      });
    });
  }
}
