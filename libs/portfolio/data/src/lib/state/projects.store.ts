import { computed } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { signalStore, withComputed, withProps } from '@ngrx/signals';
import { Project } from '../models/project.model';

export const ProjectsStore = signalStore(
  { providedIn: 'root' },
  withProps(() => ({
    projects: httpResource<readonly Project[]>(() => 'content/projects.json'),
  })),
  withComputed(({ projects }) => ({
    isLoading: computed(() => projects.isLoading()),
    hasError: computed(() => projects.error() !== undefined),
  })),
);
