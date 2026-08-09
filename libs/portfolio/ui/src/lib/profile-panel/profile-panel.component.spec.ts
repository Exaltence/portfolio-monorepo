import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Profile } from '@portfolio-monorepo/portfolio/data';
import { IconRegistryService } from '@portfolio-monorepo/shared/data';
import { ProfilePanelComponent } from './profile-panel.component';

const iconRegistryStub: Pick<IconRegistryService, 'get'> = {
  get: () => signal(null),
};

const FAKE_PROFILE: Profile = {
  greeting: 'Hi There! I am',
  name: 'Shaun Vercauteren',
  roles: ['Shaun Vercauteren', 'Web Developer'],
  avatarUrl: 'img/img-profile.jpg',
  available: true,
  availabilityUrl: 'https://example.com/li',
  cvUrl: 'cv-shaun-vercauteren.pdf',
  social: [
    { label: 'LinkedIn', url: 'https://example.com/li', icon: 'mdi--linkedin' },
    {
      label: 'Discord',
      url: 'https://example.com/dc',
      icon: 'simple-icons--discord',
    },
    { label: 'GitHub', url: 'https://example.com/gh', icon: 'mdi--github' },
  ],
};

describe('ProfilePanelComponent', () => {
  let fixture: ComponentFixture<ProfilePanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: IconRegistryService, useValue: iconRegistryStub }],
    });

    window.matchMedia = vi
      .fn()
      .mockReturnValue({ matches: true } as unknown as MediaQueryList);
    fixture = TestBed.createComponent(ProfilePanelComponent);
    fixture.componentRef.setInput('profile', FAKE_PROFILE);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('should render the greeting and name', async () => {
    await fixture.whenStable();

    expect(
      element().querySelector('[data-testid="profile-name"]')?.textContent,
    ).toContain('Shaun Vercauteren');
    expect(
      element().querySelector('.profile-panel__greeting')?.textContent,
    ).toContain('Hi There! I am');
  });

  function anchor(testId: string): HTMLAnchorElement {
    return element().querySelector(
      `[data-testid="${testId}"]`,
    ) as HTMLAnchorElement;
  }

  it('should render one link per social entry', async () => {
    await fixture.whenStable();

    const links = [
      ...element().querySelectorAll<HTMLAnchorElement>(
        '[data-testid="social-link"]',
      ),
    ];

    expect(links).toHaveLength(FAKE_PROFILE.social.length);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      FAKE_PROFILE.social.map((entry) => entry.url),
    );
    expect(links.map((link) => link.getAttribute('aria-label'))).toEqual(
      FAKE_PROFILE.social.map((entry) => `${entry.label} (opens in a new tab)`),
    );
  });

  it('should expose the CV as a downloadable link rather than a synthesised click', async () => {
    await fixture.whenStable();

    const cv = anchor('cv-link');
    expect(cv.tagName).toBe('A');
    expect(cv.getAttribute('href')).toBe(FAKE_PROFILE.cvUrl);
    expect(cv.hasAttribute('download')).toBe(true);
  });

  it('should expose the availability url as a safe external link', async () => {
    await fixture.whenStable();

    const availability = anchor('availability');
    expect(availability.getAttribute('href')).toBe(
      FAKE_PROFILE.availabilityUrl,
    );
    expect(availability.getAttribute('target')).toBe('_blank');
    expect(availability.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('should suppress native dragging on every outbound link', async () => {
    await fixture.whenStable();

    const links = [...element().querySelectorAll<HTMLAnchorElement>('a[href]')];
    expect(links.length).toBeGreaterThan(0);

    for (const link of links) {
      expect(link.getAttribute('draggable')).toBe('false');

      const dragstart = new Event('dragstart', {
        bubbles: true,
        cancelable: true,
      });
      link.dispatchEvent(dragstart);
      expect(dragstart.defaultPrevented).toBe(true);
    }
  });

  it('should render the typing title host element', async () => {
    await fixture.whenStable();

    expect(element().querySelector('.profile-panel__typed')).not.toBeNull();
  });
});
