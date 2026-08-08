import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Skill } from '@portfolio-monorepo/portfolio/data';
import { IconRegistryService } from '@portfolio-monorepo/shared/data';
import { SkillListComponent } from './skill-list.component';

function createSvg(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.appendChild(
    document.createElementNS('http://www.w3.org/2000/svg', 'path'),
  );

  return svg;
}

const iconRegistryStub: Pick<IconRegistryService, 'get'> = {
  get: () => signal(createSvg()),
};

const SKILLS: readonly Skill[] = [
  { name: 'Angular', icon: 'mdi--angular' },
  { name: 'TypeScript', icon: 'mdi--language-typescript' },
  { name: 'Nx', icon: 'simple-icons--nx' },
];

describe('SkillListComponent', () => {
  let fixture: ComponentFixture<SkillListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: IconRegistryService, useValue: iconRegistryStub }],
    });

    fixture = TestBed.createComponent(SkillListComponent);
  });

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('should render one badge per skill', async () => {
    fixture.componentRef.setInput('skills', SKILLS);
    await fixture.whenStable();

    const badges = element().querySelectorAll('[data-testid="skill-badge"]');
    expect(badges).toHaveLength(3);
    expect(badges[0].textContent).toContain('Angular');
    expect(badges[2].textContent).toContain('Nx');
  });

  it('should render the empty state when there are no skills', async () => {
    fixture.componentRef.setInput('skills', []);
    await fixture.whenStable();

    expect(
      element().querySelectorAll('[data-testid="skill-badge"]'),
    ).toHaveLength(0);
    expect(
      element().querySelector('[data-testid="skill-empty"]'),
    ).not.toBeNull();
  });
});
