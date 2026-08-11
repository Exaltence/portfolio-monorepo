import {
  CAREER_START_YEAR,
  resolveYearsOfExperience,
  yearsOfExperience,
} from './experience.util';

const freezeDate = (iso: string): void => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
};

describe('experience utilities', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('yearsOfExperience', () => {
    it('should count whole years since the career start year', () => {
      freezeDate('2026-08-11T12:00:00');

      expect(yearsOfExperience()).toBe(2026 - CAREER_START_YEAR);
    });

    it('should return a whole number on the first day of the year', () => {
      freezeDate('2027-01-01T00:00:00');

      expect(yearsOfExperience()).toBe(9);
    });

    it('should return a whole number on the last day of the year', () => {
      freezeDate('2026-12-31T23:59:59');

      expect(yearsOfExperience()).toBe(8);
    });
  });

  describe('resolveYearsOfExperience', () => {
    it('should replace the token with the current year count', () => {
      freezeDate('2026-08-11T12:00:00');

      expect(
        resolveYearsOfExperience(
          'a front-end web developer with {{yearsOfExperience}} years of experience',
        ),
      ).toBe('a front-end web developer with 8 years of experience');
    });

    it('should replace every occurrence of the token', () => {
      freezeDate('2026-08-11T12:00:00');

      expect(
        resolveYearsOfExperience(
          '{{yearsOfExperience}} years, {{yearsOfExperience}} years',
        ),
      ).toBe('8 years, 8 years');
    });

    it('should leave text without the token untouched', () => {
      freezeDate('2026-08-11T12:00:00');

      expect(resolveYearsOfExperience('no token here')).toBe('no token here');
    });
  });
});
