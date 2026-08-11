import { httpResource } from '@angular/common/http';
import { signalStore, withProps } from '@ngrx/signals';
import { Project } from '../models/project.model';

export const ProjectsStore = signalStore(
  { providedIn: 'root' },
  withProps(() => ({
    projects: httpResource<readonly Project[]>(() => 'content/projects.json'),
  })),
);
