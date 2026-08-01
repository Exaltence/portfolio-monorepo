import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Project } from '@portfolio-monorepo/portfolio/data';
import { ProjectCardComponent } from './project-card.component';

const PROJECT: Project = {
  id: 'matchman',
  title: 'MatchMan',
  category: 'Full-stack, Web, Angular, Java',
  thumbnailUrl: 'img/portfolio/mm-dashboard.png',
  images: ['img/portfolio/mm-dashboard.png'],
  descriptions: ['First.', 'Second.'],
};

class MockIntersectionObserver {
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();
  readonly takeRecords = vi.fn(() => []);
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: readonly number[] = [];
}

describe('ProjectCardComponent', () => {
  const originalObserver = window.IntersectionObserver;
  let fixture: ComponentFixture<ProjectCardComponent>;

  beforeEach(() => {
    window.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
    fixture = TestBed.createComponent(ProjectCardComponent);
    fixture.componentRef.setInput('project', PROJECT);
  });

  afterEach(() => {
    window.IntersectionObserver = originalObserver;
    vi.restoreAllMocks();
  });

  it('should render the category and title', async () => {
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.project-card__category')?.textContent).toContain(
      'Full-stack, Web, Angular, Java',
    );
    expect(el.querySelector('.project-card__title')?.textContent).toContain(
      'MatchMan',
    );
  });

  it('should emit open with the project when clicked', async () => {
    await fixture.whenStable();
    const spy = vi.fn();
    fixture.componentInstance.opened.subscribe(spy);

    (fixture.nativeElement as HTMLElement).click();

    expect(spy).toHaveBeenCalledWith(PROJECT);
  });
});
