import { IconName } from '@portfolio-monorepo/shared/data';

export interface SocialLink {
  readonly label: string;
  readonly url: string;
  readonly icon: IconName;
}
