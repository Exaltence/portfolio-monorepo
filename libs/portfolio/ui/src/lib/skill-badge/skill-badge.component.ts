import { Component, input } from '@angular/core';
import { Skill } from '@portfolio-monorepo/portfolio/data';
import { IconComponent } from '@portfolio-monorepo/shared/ui';

@Component({
  selector: 'app-skill-badge',
  imports: [IconComponent],
  templateUrl: './skill-badge.component.html',
  styleUrl: './skill-badge.component.scss',
})
export class SkillBadgeComponent {
  readonly skill = input.required<Skill>();
}
