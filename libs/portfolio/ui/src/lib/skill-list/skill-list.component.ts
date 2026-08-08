import { Component, input } from '@angular/core';
import { Skill } from '@portfolio-monorepo/portfolio/data';
import { SkillBadgeComponent } from '../skill-badge/skill-badge.component';

@Component({
  selector: 'app-skill-list',
  imports: [SkillBadgeComponent],
  templateUrl: './skill-list.component.html',
  styleUrl: './skill-list.component.scss',
})
export class SkillListComponent {
  readonly skills = input<readonly Skill[]>([]);
}
