import { SocialLink } from './social-link.model';

export interface Profile {
  readonly greeting: string;
  readonly name: string;
  readonly roles: readonly string[];
  readonly avatarUrl: string;
  readonly available: boolean;
  readonly availabilityUrl: string;
  readonly cvUrl: string;
  readonly social: readonly SocialLink[];
}
