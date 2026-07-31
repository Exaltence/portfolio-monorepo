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
import { Theme } from '@portfolio-monorepo/shared/util';

const STORAGE_KEY = 'theme';

export const ThemeStore = signalStore(
  { providedIn: 'root' },
  withState({ theme: 'dark' as Theme }),
  withComputed(({ theme }) => ({
    isLight: computed(() => theme() === 'light'),
  })),
  withMethods((store, doc = inject(DOCUMENT)) => {
    const apply = (theme: Theme): void => {
      doc.documentElement.classList.toggle('light', theme === 'light');
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
