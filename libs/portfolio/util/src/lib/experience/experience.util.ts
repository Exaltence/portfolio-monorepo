export const CAREER_START_YEAR = 2018;

export const YEARS_OF_EXPERIENCE_TOKEN = '{{yearsOfExperience}}';

export function yearsOfExperience(): number {
  return new Date().getFullYear() - CAREER_START_YEAR;
}

export function resolveYearsOfExperience(text: string): string {
  return text.replaceAll(YEARS_OF_EXPERIENCE_TOKEN, `${yearsOfExperience()}`);
}
