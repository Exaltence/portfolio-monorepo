import { httpResource } from '@angular/common/http';
import { signalStore, withProps } from '@ngrx/signals';
import { Profile } from '../models/profile.model';

export const ProfileStore = signalStore(
  { providedIn: 'root' },
  withProps(() => ({
    profile: httpResource<Profile>(() => 'content/profile.json'),
  })),
);
