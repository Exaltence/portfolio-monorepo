import { computed } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { signalStore, withComputed, withProps } from '@ngrx/signals';
import { About } from '../models/about.model';

export const AboutStore = signalStore(
  { providedIn: 'root' },
  withProps(() => ({
    about: httpResource<About>(() => 'content/about.json'),
  })),
  withComputed(({ about }) => ({
    isLoading: computed(() => about.isLoading()),
    hasError: computed(() => about.error() !== undefined),
  })),
);
