import { Component, inject } from '@angular/core';
import { AboutStore } from '@portfolio-monorepo/portfolio/data';
import {
  ResumeListComponent,
  SkillBadgeComponent,
  TabsComponent,
} from '@portfolio-monorepo/portfolio/ui';

@Component({
  selector: 'app-about-feature',
  imports: [TabsComponent, SkillBadgeComponent, ResumeListComponent],
  templateUrl: './about-feature.component.html',
  styleUrl: './about-feature.component.scss',
})
export class AboutFeatureComponent {
  protected readonly store = inject(AboutStore);
  protected readonly tabs = [
    'Skills',
    'Experience',
    'Education',
    'Certificates',
  ];
}
