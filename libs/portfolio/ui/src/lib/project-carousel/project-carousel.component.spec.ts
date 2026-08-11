import { FocusMonitor, FocusOrigin } from '@angular/cdk/a11y';
import { DOWN_ARROW, RIGHT_ARROW, UP_ARROW } from '@angular/cdk/keycodes';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Project } from '@portfolio-monorepo/portfolio/data';
import { IconRegistryService } from '@portfolio-monorepo/shared/data';
import { ProjectCarouselComponent } from './project-carousel.component';

const iconRegistryStub: Pick<IconRegistryService, 'get'> = {
  get: () => signal(null),
};

function makeProject(id: string): Project {
  return {
    id,
    title: `Project ${id}`,
    category: 'Web, Angular',
    thumbnailUrl: `img/portfolio/${id}.png`,
    images: [`img/portfolio/${id}.png`],
    descriptions: ['First.', 'Second.'],
  };
}

const PROJECTS: readonly Project[] = [
  makeProject('a'),
  makeProject('b'),
  makeProject('c'),
  makeProject('d'),
];

class MockIntersectionObserver {
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();
  readonly takeRecords = vi.fn(() => []);
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: readonly number[] = [];
}

function firePointerEvent(
  target: EventTarget,
  type: string,
  init: { pointerType?: string; clientX?: number; pointerId?: number } = {},
): void {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  }) as PointerEvent;
  Object.defineProperty(event, 'pointerType', {
    value: init.pointerType ?? 'mouse',
  });
  Object.defineProperty(event, 'clientX', { value: init.clientX ?? 0 });
  Object.defineProperty(event, 'pointerId', { value: init.pointerId ?? 1 });
  Object.defineProperty(event, 'button', { value: 0 });
  target.dispatchEvent(event);
}

describe('ProjectCarouselComponent', () => {
  const originalObserver = window.IntersectionObserver;
  let fixture: ComponentFixture<ProjectCarouselComponent>;

  beforeEach(() => {
    window.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    TestBed.configureTestingModule({
      providers: [{ provide: IconRegistryService, useValue: iconRegistryStub }],
    });
  });

  afterEach(() => {
    window.IntersectionObserver = originalObserver;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function setReducedMotion(matches: boolean): void {
    window.matchMedia = vi
      .fn()
      .mockReturnValue({ matches } as unknown as MediaQueryList);
  }

  function create(): void {
    fixture = TestBed.createComponent(ProjectCarouselComponent);
    fixture.componentRef.setInput('projects', PROJECTS);
    fixture.detectChanges();
  }

  function carouselEl(): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="carousel"]',
    ) as HTMLElement;
  }

  function focusVia(element: HTMLElement, origin: FocusOrigin): void {
    TestBed.inject(FocusMonitor).focusVia(element, origin);
    fixture.detectChanges();
  }

  function blur(element: HTMLElement): void {
    element.blur();
    fixture.detectChanges();
  }

  function fireTransitionEnd(): void {
    const track = (fixture.nativeElement as HTMLElement).querySelector(
      '.carousel__track',
    ) as HTMLElement;
    const event = new Event('transitionend', { bubbles: true });
    Object.defineProperty(event, 'propertyName', { value: 'transform' });
    track.dispatchEvent(event);
    fixture.detectChanges();
  }

  function pressKey(
    element: HTMLElement,
    key: string,
    keyCode: number,
  ): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, bubbles: true });
    Object.defineProperty(event, 'keyCode', { value: keyCode });
    element.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  }

  function pressArrowRight(element: HTMLElement): void {
    pressKey(element, 'ArrowRight', RIGHT_ARROW);
  }

  it('should advance and wrap the index with next and prev', async () => {
    setReducedMotion(true);
    create();

    expect(fixture.componentInstance.index()).toBe(0);

    fixture.componentInstance.next();
    expect(fixture.componentInstance.index()).toBe(1);

    fixture.componentInstance.prev();
    fixture.componentInstance.prev();
    expect(fixture.componentInstance.index()).toBe(3);

    fixture.componentInstance.next();
    expect(fixture.componentInstance.index()).toBe(0);
  });

  it('should react immediately to every click at the carousel boundaries', () => {
    setReducedMotion(true);
    create();
    const carousel = fixture.componentInstance;

    for (let i = 0; i < PROJECTS.length * 2; i++) {
      const before = carousel.index();
      carousel.next();
      expect(carousel.index()).toBe((before + 1) % PROJECTS.length);
    }
  });

  it('should keep the render window inside the tripled array when transitionend never arrives', async () => {
    vi.useFakeTimers();
    setReducedMotion(true);
    create();
    await fixture.whenStable();

    const carousel = fixture.componentInstance;
    const renderIndex = (): number => carousel['render']();
    const count = PROJECTS.length;

    for (let i = 0; i < count * 3; i++) {
      carousel.next();
      await vi.advanceTimersByTimeAsync(1000);

      expect(renderIndex()).toBeGreaterThanOrEqual(count);
      expect(renderIndex()).toBeLessThan(count * 2);
    }

    expect(carousel.index()).toBe(0);
  });

  /*
   * A late `transitionend` belongs to the move the net already finished, not to
   * the one now running. Acting on it would clear the running move's own net
   * and release `busy` mid-animation, leaving that move with no way to recover
   * if its event is dropped too.
   */
  it('should not let a late transitionend cut the following move short', async () => {
    vi.useFakeTimers();
    setReducedMotion(true);
    create();
    await fixture.whenStable();

    const carousel = fixture.componentInstance;
    const busy = (): boolean => carousel['busy']();

    carousel.next();
    await vi.advanceTimersByTimeAsync(1000);
    expect(busy()).toBe(false);

    carousel.next();
    expect(busy()).toBe(true);

    fireTransitionEnd();
    expect(busy()).toBe(true);

    fireTransitionEnd();
    expect(busy()).toBe(false);
  });

  it('should ignore a transform transition that ends while no move is running', async () => {
    setReducedMotion(true);
    create();
    await fixture.whenStable();

    const carousel = fixture.componentInstance;
    const before = carousel.index();

    fireTransitionEnd();

    expect(carousel['busy']()).toBe(false);
    expect(carousel.index()).toBe(before);
  });

  it('should re-emit a card open as select', async () => {
    setReducedMotion(true);
    create();
    const spy = vi.fn();
    fixture.componentInstance.selected.subscribe(spy);

    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-testid="project-card"]',
    );

    (cards[PROJECTS.length] as HTMLElement).click();

    expect(spy).toHaveBeenCalledWith(PROJECTS[0]);
  });

  it('should step into the slides at the leading card rather than rewinding to the first', async () => {
    setReducedMotion(true);
    create();
    await fixture.whenStable();

    const carousel = fixture.componentInstance;
    carousel.next();
    carousel.next();
    expect(carousel.index()).toBe(2);

    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-testid="project-card"]',
    );
    const el = carouselEl();
    focusVia(el, 'keyboard');

    pressArrowRight(el);
    expect(carousel.index()).toBe(2);
    expect(document.activeElement).toBe(cards[PROJECTS.length + 2]);

    pressArrowRight(el);
    expect(carousel.index()).toBe(3);
    expect(document.activeElement).toBe(cards[PROJECTS.length + 3]);
  });

  it('should follow arrow-key focus with the track instead of scrolling the viewport', async () => {
    setReducedMotion(true);
    create();
    await fixture.whenStable();

    const el = carouselEl();
    focusVia(el, 'keyboard');
    pressArrowRight(el);
    pressArrowRight(el);
    pressArrowRight(el);

    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-testid="project-card"]',
    );

    expect(fixture.componentInstance.index()).toBe(2);
    expect(document.activeElement).toBe(cards[PROJECTS.length + 2]);
  });

  it('should leave the vertical arrows to the page', async () => {
    setReducedMotion(true);
    create();
    await fixture.whenStable();

    const el = carouselEl();
    focusVia(el, 'keyboard');

    for (const [key, code] of [
      ['ArrowDown', DOWN_ARROW],
      ['ArrowUp', UP_ARROW],
    ] as const) {
      const event = pressKey(el, key, code);
      expect(event.defaultPrevented, `${key} was swallowed`).toBe(false);
      expect(fixture.componentInstance.index()).toBe(0);
    }
  });

  it('should hand the carousel itself to a select made from an aria-hidden clone', async () => {
    setReducedMotion(true);
    create();
    await fixture.whenStable();

    const spy = vi.fn();
    fixture.componentInstance.selected.subscribe(spy);

    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-testid="project-card"]',
    );
    const clone = cards[PROJECTS.length * 2 + 1] as HTMLElement;
    expect(clone.closest('[aria-hidden="true"]')).not.toBeNull();

    const before = fixture.componentInstance.index();
    clone.click();

    expect(spy).toHaveBeenCalledWith(PROJECTS[1]);
    expect(document.activeElement).toBe(carouselEl());
    expect(
      (document.activeElement as HTMLElement).closest('[aria-hidden="true"]'),
    ).toBeNull();
    expect(fixture.componentInstance.index()).toBe(before);
  });

  it('should leave focus on a real card so the modal restores the reader in place', async () => {
    setReducedMotion(true);
    create();
    await fixture.whenStable();

    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-testid="project-card"]',
    );
    const real = cards[PROJECTS.length + 1] as HTMLElement;
    expect(real.closest('[aria-hidden="true"]')).toBeNull();

    const before = fixture.componentInstance.index();
    real.focus();
    real.click();

    expect(document.activeElement).toBe(real);
    expect(fixture.componentInstance.index()).toBe(before);
  });

  it('should autoplay and pause while a mouse hovers the carousel', async () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    create();

    await vi.advanceTimersByTimeAsync(3000);
    expect(fixture.componentInstance.index()).toBe(1);

    firePointerEvent(carouselEl(), 'pointerover', { pointerType: 'mouse' });
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(3000);
    expect(fixture.componentInstance.index()).toBe(1);
  });

  it('should not pause when a touch pointer enters the carousel', async () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    create();

    firePointerEvent(carouselEl(), 'pointerover', { pointerType: 'touch' });
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(3000);
    expect(fixture.componentInstance.index()).toBe(1);
  });

  it('should pause autoplay while keyboard focus is inside the carousel', async () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    create();

    focusVia(carouselEl(), 'keyboard');

    await vi.advanceTimersByTimeAsync(9000);

    expect(fixture.componentInstance.index()).toBe(0);
  });

  it('should keep autoplay paused while keyboard focus moves between cards', async () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    create();

    const card = carouselEl().querySelector(
      '[data-testid="project-card"]',
    ) as HTMLElement;

    focusVia(carouselEl(), 'keyboard');
    focusVia(card, 'keyboard');

    await vi.advanceTimersByTimeAsync(9000);

    expect(fixture.componentInstance.index()).toBe(0);
  });

  it('should resume autoplay once focus leaves the carousel', async () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    create();

    focusVia(carouselEl(), 'keyboard');
    blur(carouselEl());

    await vi.advanceTimersByTimeAsync(3000);

    expect(fixture.componentInstance.index()).toBe(1);
  });

  it('should not pause when a mouse click focuses a control inside the carousel', async () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    create();

    focusVia(carouselEl(), 'mouse');

    await vi.advanceTimersByTimeAsync(3000);

    expect(fixture.componentInstance.index()).toBe(1);
  });

  it('should not pause when a touch focuses a control inside the carousel', async () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    create();

    focusVia(carouselEl(), 'touch');

    await vi.advanceTimersByTimeAsync(3000);

    expect(fixture.componentInstance.index()).toBe(1);
  });

  it('should hold the track still while paused and resume a full interval after', async () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    create();

    fixture.componentRef.setInput('paused', true);
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(9000);
    expect(fixture.componentInstance.index()).toBe(0);

    fixture.componentRef.setInput('paused', false);
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(2000);
    expect(fixture.componentInstance.index()).toBe(0);

    await vi.advanceTimersByTimeAsync(1000);
    expect(fixture.componentInstance.index()).toBe(1);
  });

  it('should drop a hover pause that outlived an overlay rather than trusting pointerleave', async () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    create();

    firePointerEvent(carouselEl(), 'pointerover', { pointerType: 'mouse' });
    fixture.componentRef.setInput('paused', true);
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(3000);
    expect(fixture.componentInstance.index()).toBe(0);

    fixture.componentRef.setInput('paused', false);
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(3000);
    expect(fixture.componentInstance.index()).toBe(1);
  });

  it('should let a pointer crossing the carousel re-establish the pause', async () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    create();

    fixture.componentRef.setInput('paused', true);
    fixture.detectChanges();
    fixture.componentRef.setInput('paused', false);
    fixture.detectChanges();

    firePointerEvent(carouselEl(), 'pointerover', { pointerType: 'mouse' });
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(9000);
    expect(fixture.componentInstance.index()).toBe(0);
  });

  it('should stop and restart rotation from the pause control', async () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    create();

    const control = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="carousel-rotation"]',
    ) as HTMLButtonElement;
    expect(control.getAttribute('aria-label')).toBe('Pause automatic rotation');

    control.click();
    fixture.detectChanges();
    expect(control.getAttribute('aria-label')).toBe(
      'Resume automatic rotation',
    );

    await vi.advanceTimersByTimeAsync(9000);
    expect(fixture.componentInstance.index()).toBe(0);

    control.click();
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(3000);
    expect(fixture.componentInstance.index()).toBe(1);
  });

  it('should keep the pause control showing intent while a pointer pauses rotation', async () => {
    setReducedMotion(false);
    create();

    firePointerEvent(carouselEl(), 'pointerover', { pointerType: 'mouse' });
    fixture.detectChanges();

    const control = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="carousel-rotation"]',
    ) as HTMLButtonElement;
    expect(control.getAttribute('aria-label')).toBe('Pause automatic rotation');
  });

  it('should not offer a pause control when nothing rotates', async () => {
    setReducedMotion(true);
    create();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="carousel-rotation"]',
      ),
    ).toBeNull();
  });

  it('should announce each real slide as a numbered slide and leave clones out', async () => {
    setReducedMotion(true);
    create();

    const slides = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll(
        '.carousel__slide',
      ),
    ];
    const announced = slides.filter(
      (slide) => slide.getAttribute('role') === 'group',
    );

    expect(announced).toHaveLength(PROJECTS.length);
    expect(announced.map((slide) => slide.getAttribute('aria-label'))).toEqual([
      '1 of 4',
      '2 of 4',
      '3 of 4',
      '4 of 4',
    ]);
    expect(
      announced.every(
        (slide) => slide.getAttribute('aria-roledescription') === 'slide',
      ),
    ).toBe(true);
    expect(
      slides.filter((slide) => slide.getAttribute('aria-hidden') === 'true'),
    ).toHaveLength(PROJECTS.length * 2);
  });

  it('should reset the autoplay timer to a full interval after manual navigation', async () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    create();

    await vi.advanceTimersByTimeAsync(2000);
    fixture.componentInstance.next();
    fixture.detectChanges();
    expect(fixture.componentInstance.index()).toBe(1);

    await vi.advanceTimersByTimeAsync(2000);
    expect(fixture.componentInstance.index()).toBe(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(fixture.componentInstance.index()).toBe(2);
  });

  it('should not autoplay when reduced motion is preferred', async () => {
    vi.useFakeTimers();
    setReducedMotion(true);
    create();

    await vi.advanceTimersByTimeAsync(21000);

    expect(fixture.componentInstance.index()).toBe(0);
  });
});
