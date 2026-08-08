import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  AboutStore,
  ProfileStore,
  ProjectsStore,
} from '@portfolio-monorepo/portfolio/data';
import { IconRegistryService } from '@portfolio-monorepo/shared/data';
import { HomeComponent } from './home.component';

const iconRegistryStub: Pick<IconRegistryService, 'get'> = {
  get: () => signal(null),
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

function loadingResource() {
  return {
    hasValue: vi.fn(() => false),
    value: vi.fn(() => undefined),
    error: vi.fn(() => undefined),
    isLoading: vi.fn(() => true),
  };
}

describe('HomeComponent', () => {
  const originalObserver = window.IntersectionObserver;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(() => {
    window.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
    TestBed.configureTestingModule({
      providers: [
        { provide: ProfileStore, useValue: { profile: loadingResource() } },
        { provide: AboutStore, useValue: { about: loadingResource() } },
        { provide: ProjectsStore, useValue: { projects: loadingResource() } },
        { provide: IconRegistryService, useValue: iconRegistryStub },
      ],
    });
    fixture = TestBed.createComponent(HomeComponent);
  });

  afterEach(() => {
    window.IntersectionObserver = originalObserver;
    vi.restoreAllMocks();
  });

  it('should render the home and portfolio sections with chrome', async () => {
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#home')).not.toBeNull();
    expect(el.querySelector('#portfolio')).not.toBeNull();
    expect(el.querySelector('app-site-menu')).not.toBeNull();
    expect(el.querySelector('app-back-to-top')).not.toBeNull();
    expect(el.querySelector('app-profile-panel-feature')).not.toBeNull();
  });
});
