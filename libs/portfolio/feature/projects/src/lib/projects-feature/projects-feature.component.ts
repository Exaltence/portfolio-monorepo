import { Dialog } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { Project, ProjectsStore } from '@portfolio-monorepo/portfolio/data';
import {
  ProjectCarouselComponent,
  ProjectModalComponent,
  ProjectModalData,
} from '@portfolio-monorepo/portfolio/ui';

@Component({
  selector: 'app-projects-feature',
  imports: [ProjectCarouselComponent],
  templateUrl: './projects-feature.component.html',
  styleUrl: './projects-feature.component.scss',
})
export class ProjectsFeatureComponent {
  protected readonly store = inject(ProjectsStore);
  private readonly dialog = inject(Dialog);

  protected open(project: Project): void {
    const projects = this.store.projects.value();
    if (!projects) {
      return;
    }
    const index = projects.indexOf(project);
    this.dialog.open<unknown, ProjectModalData>(ProjectModalComponent, {
      data: { projects, index },
      autoFocus: true,
    });
  }
}
