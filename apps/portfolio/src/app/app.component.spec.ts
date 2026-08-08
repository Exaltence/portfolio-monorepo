import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import {
  IconRegistryService,
  ThemeStore,
} from '@portfolio-monorepo/shared/data';
import { AppComponent } from './app.component';

const iconRegistryStub: Pick<IconRegistryService, 'get'> = {
  get: () => signal(null),
};

describe('AppComponent', () => {
  beforeEach(() => {
    window.matchMedia = vi
      .fn()
      .mockReturnValue({ matches: false } as unknown as MediaQueryList);
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: IconRegistryService, useValue: iconRegistryStub },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the router outlet', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('router-outlet'),
    ).not.toBeNull();
  });

  it('should toggle the theme when the toggle button emits', async () => {
    const store = TestBed.inject(ThemeStore);
    const toggleSpy = vi.spyOn(store, 'toggle');
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();

    (
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="theme-toggle"]',
      ) as HTMLElement
    ).click();

    expect(toggleSpy).toHaveBeenCalled();
  });
});
