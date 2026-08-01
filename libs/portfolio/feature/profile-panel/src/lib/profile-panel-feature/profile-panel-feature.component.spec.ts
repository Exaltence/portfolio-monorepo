import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Profile, ProfileStore } from '@portfolio-monorepo/portfolio/data';
import { ProfilePanelFeatureComponent } from './profile-panel-feature.component';

const FAKE_PROFILE: Profile = {
  greeting: 'Hi There! I am',
  name: 'Shaun Vercauteren',
  roles: ['Shaun Vercauteren', 'Web Developer'],
  avatarUrl: 'img/img-profile.jpg',
  available: true,
  availabilityUrl: 'https://example.com/li',
  cvUrl: 'cv-shaun-vercauteren.pdf',
  social: [],
};

interface ResourceStub {
  hasValue: ReturnType<typeof vi.fn>;
  value: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  isLoading: ReturnType<typeof vi.fn>;
}

describe('ProfilePanelFeatureComponent', () => {
  let profile: ResourceStub;

  beforeEach(() => {
    window.matchMedia = vi
      .fn()
      .mockReturnValue({ matches: true } as unknown as MediaQueryList);
    profile = {
      hasValue: vi.fn(() => true),
      value: vi.fn(() => FAKE_PROFILE),
      error: vi.fn(() => undefined),
      isLoading: vi.fn(() => false),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createFixture(): ComponentFixture<ProfilePanelFeatureComponent> {
    TestBed.configureTestingModule({
      providers: [{ provide: ProfileStore, useValue: { profile } }],
    });
    return TestBed.createComponent(ProfilePanelFeatureComponent);
  }

  it('should render the dumb panel with the profile when loaded', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-profile-panel')).not.toBeNull();
    expect(
      el.querySelector('[data-testid="profile-name"]')?.textContent,
    ).toContain('Shaun Vercauteren');
  });

  it('should render the error state', async () => {
    profile.hasValue.mockReturnValue(false);
    profile.error.mockReturnValue(new Error('boom'));
    const fixture = createFixture();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="profile-error"]')).not.toBeNull();
    expect(el.querySelector('app-profile-panel')).toBeNull();
  });

  it('should render the loading state', async () => {
    profile.hasValue.mockReturnValue(false);
    profile.error.mockReturnValue(undefined);
    const fixture = createFixture();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="profile-loading"]')).not.toBeNull();
  });
});
