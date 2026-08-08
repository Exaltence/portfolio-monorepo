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

  it('should autoplay and pause while a mouse hovers the carousel', async () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    create();

    await vi.advanceTimersByTimeAsync(3000);
    expect(fixture.componentInstance.index()).toBe(1);

    const carouselEl = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="carousel"]',
    ) as HTMLElement;
    firePointerEvent(carouselEl, 'pointerenter', { pointerType: 'mouse' });
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(3000);
    expect(fixture.componentInstance.index()).toBe(1);
  });

  it('should not pause when a touch pointer enters the carousel', async () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    create();

    const carouselEl = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="carousel"]',
    ) as HTMLElement;
    firePointerEvent(carouselEl, 'pointerenter', { pointerType: 'touch' });
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(3000);
    expect(fixture.componentInstance.index()).toBe(1);
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
