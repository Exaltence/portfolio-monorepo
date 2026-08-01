import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResumeEntry } from '@portfolio-monorepo/portfolio/data';
import { ResumeListComponent } from './resume-list.component';

const ENTRIES: readonly ResumeEntry[] = [
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
];

describe('ResumeListComponent', () => {
  let fixture: ComponentFixture<ResumeListComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ResumeListComponent);
  });

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('should render one row per entry', async () => {
    fixture.componentRef.setInput('entries', ENTRIES);
    await fixture.whenStable();

    const rows = element().querySelectorAll('[data-testid="resume-entry"]');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('Renson');
    expect(rows[0].textContent).toContain('2019 — Today');
    expect(rows[0].textContent).toContain('Angular Web Developer');
  });

  it('should render the empty state when there are no entries', async () => {
    fixture.componentRef.setInput('entries', []);
    await fixture.whenStable();

    expect(
      element().querySelectorAll('[data-testid="resume-entry"]'),
    ).toHaveLength(0);
    expect(
      element().querySelector('[data-testid="resume-empty"]'),
    ).not.toBeNull();
  });
});
