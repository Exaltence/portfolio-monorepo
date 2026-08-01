import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Skill } from '@portfolio-monorepo/portfolio/data';
import { SkillBadgeComponent } from './skill-badge.component';

const FAKE_SKILL: Skill = {
  name: 'Angular',
  icon: '<svg data-testid="skill-icon"><path d="M0 0h24"></path></svg>',
};

describe('SkillBadgeComponent', () => {
  let fixture: ComponentFixture<SkillBadgeComponent>;

  beforeEach(() => {
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
