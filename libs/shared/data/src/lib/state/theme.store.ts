import { computed, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { motionDurationMs } from '@portfolio-monorepo/shared/util';
import { Theme } from '../models/theme/theme.model';

const STORAGE_KEY = 'theme';
const TRANSITION_CLASS = 'theme-transition';
const TRANSITION_DURATION_FALLBACK_MS = 300;

export const ThemeStore = signalStore(
  { providedIn: 'root' },
  withState({ theme: 'dark' as Theme }),
  withComputed(({ theme }) => ({
    isLight: computed(() => theme() === 'light'),
  })),
  withMethods((store, doc = inject(DOCUMENT)) => {
    let transitionTimeout: ReturnType<typeof setTimeout> | undefined;

    const apply = (theme: Theme): void => {
      const root = doc.documentElement;
      clearTimeout(transitionTimeout);
      root.classList.add(TRANSITION_CLASS);
      root.classList.toggle('light', theme === 'light');
      transitionTimeout = setTimeout(
        () => {
          root.classList.remove(TRANSITION_CLASS);
        },
        motionDurationMs(
          '--motion-duration-scene',
          TRANSITION_DURATION_FALLBACK_MS,
        ),
      );
    };
    const setTheme = (theme: Theme): void => {
      patchState(store, { theme });
      localStorage.setItem(STORAGE_KEY, theme);
      apply(theme);
    };
    return {
      setTheme,
      toggle(): void {
        setTheme(store.theme() === 'light' ? 'dark' : 'light');
      },
    };
  }),
  withHooks({
    onInit(store) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        store.setTheme(saved);
      }
    },
  }),
);
