import { Component, inject } from '@angular/core';
import { AboutStore } from '@portfolio-monorepo/portfolio/data';
import {
  ResumeListComponent,
  SkillListComponent,
  TabGroupComponent,
} from '@portfolio-monorepo/portfolio/ui';

@Component({
  selector: 'app-about-feature',
  imports: [TabGroupComponent, SkillListComponent, ResumeListComponent],
  templateUrl: './about-feature.component.html',
  styleUrl: './about-feature.component.scss',
})
export class AboutFeatureComponent {
  protected readonly store = inject(AboutStore);
  protected readonly tabGroup = [
    'Skills',
    'Experience',
    'Education',
    'Certificates',
  ];
}
