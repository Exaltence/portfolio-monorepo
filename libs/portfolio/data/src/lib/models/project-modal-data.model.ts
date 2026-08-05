import { Project } from './project.model';

export interface ProjectModalData {
  readonly projects: readonly Project[];
  readonly index: number;
}
