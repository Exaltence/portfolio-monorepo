import { Project } from '@portfolio-monorepo/portfolio/data';

export interface ProjectModalData {
  readonly projects: readonly Project[];
  readonly index: number;
}
