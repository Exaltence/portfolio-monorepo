import { motionDurationMs, prefersReducedMotion } from './motion.util';

const stubToken = (value: string): void => {
  vi.stubGlobal(
    'getComputedStyle',
    vi.fn().mockReturnValue({ getPropertyValue: () => value }),
  );
};

const stubMatchMedia = (matches: boolean): void => {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches }));
};

describe('motion utilities', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('motionDurationMs', () => {
    it('should read a duration expressed in milliseconds', () => {
      stubToken('300ms');

      expect(motionDurationMs('--motion-duration-scene', 999)).toBe(300);
    });

    it('should read a duration the minifier rewrote to seconds', () => {
      stubToken('.3s');

      expect(motionDurationMs('--motion-duration-scene', 999)).toBe(300);
    });

    it('should read the near-zero reduced-motion duration', () => {
      stubToken('0.01ms');

      expect(motionDurationMs('--motion-duration-scene', 999)).toBe(0.01);
    });

    it('should fall back when the token is not defined', () => {
      stubToken('');

      expect(motionDurationMs('--motion-duration-scene', 999)).toBe(999);
    });

    it('should fall back when there is no styling engine', () => {
      vi.stubGlobal('getComputedStyle', undefined);

      expect(motionDurationMs('--motion-duration-scene', 999)).toBe(999);
    });
  });

  describe('prefersReducedMotion', () => {
    it('should report the preference when it is set', () => {
      stubMatchMedia(true);

      expect(prefersReducedMotion()).toBe(true);
    });

    it('should report no preference by default', () => {
      stubMatchMedia(false);

      expect(prefersReducedMotion()).toBe(false);
    });

    it('should report no preference when matchMedia is unavailable', () => {
      vi.stubGlobal('matchMedia', undefined);

      expect(prefersReducedMotion()).toBe(false);
    });
  });
});
