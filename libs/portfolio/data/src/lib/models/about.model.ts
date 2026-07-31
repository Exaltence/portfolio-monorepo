import { ResumeEntry } from './resume-entry.model';
import { Skill } from './skill.model';

export interface About {
  readonly subtitle: string;
  readonly title: string;
  readonly intro: string;
  readonly skills: readonly Skill[];
  readonly experience: readonly ResumeEntry[];
  readonly education: readonly ResumeEntry[];
  readonly certificates: readonly ResumeEntry[];
}
