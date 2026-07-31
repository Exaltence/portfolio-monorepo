import { TestBed } from '@angular/core/testing';

import { ThemeStore } from './theme.store';

describe('ThemeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should default to the dark theme', () => {
    const store = TestBed.inject(ThemeStore);

    expect(store.theme()).toBe('dark');
    expect(store.isLight()).toBe(false);
  });

  it('should switch to light when toggled from dark', () => {
    const store = TestBed.inject(ThemeStore);

    store.toggle();

    expect(store.theme()).toBe('light');
    expect(store.isLight()).toBe(true);
  });

  it('should persist and apply the theme when set', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const store = TestBed.inject(ThemeStore);

    store.setTheme('light');

    expect(setItemSpy).toHaveBeenCalledWith('theme', 'light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('should restore a persisted theme on init', () => {
    localStorage.setItem('theme', 'light');

    const store = TestBed.inject(ThemeStore);

    expect(store.theme()).toBe('light');
    expect(store.isLight()).toBe(true);
  });
});
