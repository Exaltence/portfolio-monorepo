import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Skill } from '@portfolio-monorepo/portfolio/data';
import { IconRegistryService } from '@portfolio-monorepo/shared/data';
import { SkillBadgeComponent } from './skill-badge.component';

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

const FAKE_SKILL: Skill = {
  name: 'Angular',
  icon: 'mdi--angular',
};

describe('SkillBadgeComponent', () => {
  let fixture: ComponentFixture<SkillBadgeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: IconRegistryService, useValue: iconRegistryStub }],
    });

    fixture = TestBed.createComponent(SkillBadgeComponent);
    fixture.componentRef.setInput('skill', FAKE_SKILL);
  });

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('should render the skill name', async () => {
    await fixture.whenStable();

    expect(
      element().querySelector('.skill-badge__name')?.textContent,
    ).toContain('Angular');
  });

  it('should render the inline svg icon', async () => {
    await fixture.whenStable();

    expect(
      element().querySelector('[data-testid="skill-badge"] svg'),
    ).not.toBeNull();
  });
});
