import { computed } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { signalStore, withComputed, withProps } from '@ngrx/signals';
import { Profile } from '../models/profile.model';

export const ProfileStore = signalStore(
  { providedIn: 'root' },
  withProps(() => ({
    profile: httpResource<Profile>(() => 'content/profile.json'),
  })),
  withComputed(({ profile }) => ({
    isLoading: computed(() => profile.isLoading()),
    hasError: computed(() => profile.error() !== undefined),
  })),
);
