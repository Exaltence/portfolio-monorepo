import { Dialog } from '@angular/cdk/dialog';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { Project, ProjectsStore } from '@portfolio-monorepo/portfolio/data';
import { ProjectModalComponent } from '@portfolio-monorepo/portfolio/ui';
import { IconRegistryService } from '@portfolio-monorepo/shared/data';
import { ProjectsFeatureComponent } from './projects-feature.component';

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

interface ResourceStub {
  hasValue: ReturnType<typeof vi.fn>;
  value: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  isLoading: ReturnType<typeof vi.fn>;
}

describe('ProjectsFeatureComponent', () => {
  const originalObserver = window.IntersectionObserver;
  let projects: ResourceStub;
  let dialog: {
    open: ReturnType<typeof vi.fn>;
    afterOpened: Subject<void>;
    afterAllClosed: Subject<void>;
    openDialogs: unknown[];
  };
  let fixture: ComponentFixture<ProjectsFeatureComponent>;

  beforeEach(() => {
    window.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
    window.matchMedia = vi
      .fn()
      .mockReturnValue({ matches: true } as unknown as MediaQueryList);

    projects = {
      hasValue: vi.fn(() => true),
      value: vi.fn(() => PROJECTS),
      error: vi.fn(() => undefined),
      isLoading: vi.fn(() => false),
    };
    dialog = {
      open: vi.fn(),
      afterOpened: new Subject<void>(),
      afterAllClosed: new Subject<void>(),
      openDialogs: [],
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ProjectsStore, useValue: { projects } },
        { provide: Dialog, useValue: dialog },
        { provide: IconRegistryService, useValue: iconRegistryStub },
      ],
    });
    fixture = TestBed.createComponent(ProjectsFeatureComponent);
  });

  afterEach(() => {
    window.IntersectionObserver = originalObserver;
    vi.restoreAllMocks();
  });

  it('should open the modal for the selected project', async () => {
    await fixture.whenStable();

    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-testid="project-card"]',
    );
    (cards[1] as HTMLElement).click();

    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect(dialog.open).toHaveBeenCalledWith(ProjectModalComponent, {
      data: { projects: PROJECTS, index: 1 },
      autoFocus: true,
      ariaLabel: 'Project details',
      backdropClass: 'project-modal-backdrop',
    });
  });

  it('should pause the carousel while a dialog is open and resume once it closes', async () => {
    await fixture.whenStable();
    const carousel = fixture.debugElement.children[0].query(
      (node) => node.name === 'app-project-carousel',
    ).componentInstance as { paused: () => boolean };

    expect(carousel.paused()).toBe(false);

    dialog.openDialogs = [{}];
    dialog.afterOpened.next();
    fixture.detectChanges();
    expect(carousel.paused()).toBe(true);

    dialog.openDialogs = [];
    dialog.afterAllClosed.next();
    fixture.detectChanges();
    expect(carousel.paused()).toBe(false);
  });

  it('should render the loading state when the store has no value', async () => {
    projects.hasValue.mockReturnValue(false);
    projects.error.mockReturnValue(undefined);
    fixture = TestBed.createComponent(ProjectsFeatureComponent);
    await fixture.whenStable();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="projects-loading"]',
      ),
    ).not.toBeNull();
  });

  it('should announce the failure state through a live region', async () => {
    projects.hasValue.mockReturnValue(false);
    projects.error.mockReturnValue(new Error('offline'));
    fixture = TestBed.createComponent(ProjectsFeatureComponent);
    await fixture.whenStable();

    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('[data-testid="projects-error"]')
        ?.getAttribute('role'),
    ).toBe('alert');
  });
});
