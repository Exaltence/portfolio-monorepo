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

  it('should render one link per social entry', async () => {
    await fixture.whenStable();

    expect(
      element().querySelectorAll('[data-testid="social-link"]'),
    ).toHaveLength(FAKE_PROFILE.social.length);
  });

  it('should trigger the CV download', async () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    await fixture.whenStable();

    const button = element().querySelector(
      '[data-testid="cv-link"]',
    ) as HTMLButtonElement;
    button.click();

    const anchor = createElementSpy.mock.results.at(-1)
      ?.value as HTMLAnchorElement;
    expect(anchor.href).toContain('cv-shaun-vercauteren.pdf');
    expect(anchor.download).toBe('');
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it('should open the availability url in a new tab', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    await fixture.whenStable();

    const button = element().querySelector(
      '[data-testid="availability"]',
    ) as HTMLButtonElement;
    button.click();

    expect(openSpy).toHaveBeenCalledWith(
      'https://example.com/li',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('should render the typing title host element', async () => {
    await fixture.whenStable();

    expect(element().querySelector('.profile-panel__typed')).not.toBeNull();
  });
});
