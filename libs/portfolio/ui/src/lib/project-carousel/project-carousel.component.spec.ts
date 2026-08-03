import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Project } from '@portfolio-monorepo/portfolio/data';
import { ProjectCarouselComponent } from './project-carousel.component';

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

describe('ProjectCarouselComponent', () => {
  const originalObserver = window.IntersectionObserver;
  let fixture: ComponentFixture<ProjectCarouselComponent>;

  beforeEach(() => {
    window.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
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

  it('should re-emit a card open as select', async () => {
    setReducedMotion(true);
    create();
    const spy = vi.fn();
    fixture.componentInstance.selected.subscribe(spy);

    (
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="project-card"]',
      ) as HTMLElement
    ).click();

    expect(spy).toHaveBeenCalledWith(PROJECTS[0]);
  });

  it('should autoplay and pause on hover', async () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    create();

    await vi.advanceTimersByTimeAsync(7000);
    expect(fixture.componentInstance.index()).toBe(1);

    (fixture.nativeElement as HTMLElement)
      .querySelector('[data-testid="carousel"]')
      ?.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(7000);
    expect(fixture.componentInstance.index()).toBe(1);
  });

  it('should not autoplay when reduced motion is preferred', async () => {
    vi.useFakeTimers();
    setReducedMotion(true);
    create();

    await vi.advanceTimersByTimeAsync(21000);

    expect(fixture.componentInstance.index()).toBe(0);
  });
});
