import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Profile } from '@portfolio-monorepo/portfolio/data';
import { ProfilePanelComponent } from './profile-panel.component';

const FAKE_PROFILE: Profile = {
  greeting: 'Hi There! I am',
  name: 'Shaun Vercauteren',
  roles: ['Shaun Vercauteren', 'Web Developer'],
  avatarUrl: 'img/img-profile.jpg',
  available: true,
  availabilityUrl: 'https://example.com/li',
  cvUrl: 'cv-shaun-vercauteren.pdf',
  social: [
    { label: 'LinkedIn', url: 'https://example.com/li', icon: 'linkedin' },
    { label: 'Discord', url: 'https://example.com/dc', icon: 'discord' },
    { label: 'GitHub', url: 'https://example.com/gh', icon: 'github' },
  ],
};

describe('ProfilePanelComponent', () => {
  let fixture: ComponentFixture<ProfilePanelComponent>;

  beforeEach(() => {
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

  it('should link the CV download to the cv url', async () => {
    await fixture.whenStable();

    expect(
      element().querySelector('[data-testid="cv-link"]')?.getAttribute('href'),
    ).toBe('cv-shaun-vercauteren.pdf');
  });

  it('should render the typing title host element', async () => {
    await fixture.whenStable();

    expect(element().querySelector('.profile-panel__typed')).not.toBeNull();
  });
});
