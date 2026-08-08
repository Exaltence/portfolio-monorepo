import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { About, AboutStore } from '@portfolio-monorepo/portfolio/data';
import { IconRegistryService } from '@portfolio-monorepo/shared/data';
import { AboutFeatureComponent } from './about-feature.component';

const iconRegistryStub: Pick<IconRegistryService, 'get'> = {
  get: () => signal(null),
};

const FAKE_ABOUT: About = {
  subtitle: 'Introduction',
  title: 'About Me',
  intro: 'I build things.',
  skills: [
    { name: 'Angular', icon: 'mdi--angular' },
    { name: 'TypeScript', icon: 'mdi--language-typescript' },
    { name: 'Nx', icon: 'simple-icons--nx' },
  ],
  experience: [
    {
      organization: 'Renson',
      period: '2019 — Today',
      title: 'Angular Web Developer',
      description: 'MES application.',
    },
    {
      organization: 'Realdolmen',
      period: '2018 — 2019',
      title: 'Full-Stack Consultant',
      description: 'Various projects.',
    },
  ],
  education: [
    {
      organization: 'Vives',
      period: '2014 — 2018',
      title: "Associate's degree",
      description: 'Computer science programming',
    },
  ],
  certificates: [
    {
      organization: 'Oracle',
      period: 'January 2019',
      title: 'OCA',
      description: 'Java 8.',
    },
  ],
};

interface ResourceStub {
  hasValue: ReturnType<typeof vi.fn>;
  value: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  isLoading: ReturnType<typeof vi.fn>;
}

describe('AboutFeatureComponent', () => {
  let about: ResourceStub;
  let fixture: ComponentFixture<AboutFeatureComponent>;

  beforeEach(() => {
    about = {
      hasValue: vi.fn(() => true),
      value: vi.fn(() => FAKE_ABOUT),
      error: vi.fn(() => undefined),
      isLoading: vi.fn(() => false),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: AboutStore, useValue: { about } },
        { provide: IconRegistryService, useValue: iconRegistryStub },
      ],
    });
    fixture = TestBed.createComponent(AboutFeatureComponent);
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function headers(): HTMLButtonElement[] {
    return Array.from(el().querySelectorAll('[data-testid="tab-header"]'));
  }

  it('should render the intro and all four tab headers', async () => {
    await fixture.whenStable();

    expect(
      el().querySelector('[data-testid="about-intro"]')?.textContent,
    ).toContain('I build things.');
    expect(headers().map((h) => h.textContent?.trim())).toEqual([
      'Skills',
      'Experience',
      'Education',
      'Certificates',
    ]);
  });

  it('should show one skill badge per skill on the Skills tab', async () => {
    await fixture.whenStable();

    expect(el().querySelectorAll('app-skill-badge')).toHaveLength(
      FAKE_ABOUT.skills.length,
    );
  });

  it('should show experience entries when the Experience tab is selected', async () => {
    await fixture.whenStable();

    headers()[1].click();
    await fixture.whenStable();

    const rows = el().querySelectorAll('[data-testid="resume-entry"]');
    expect(rows).toHaveLength(FAKE_ABOUT.experience.length);
    expect(rows[0].textContent).toContain('Renson');
    expect(el().querySelectorAll('app-skill-badge')).toHaveLength(0);
  });
});
