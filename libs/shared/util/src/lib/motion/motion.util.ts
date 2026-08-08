export function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/*
 * Reads a duration token so JS timers stay in step with the CSS that owns them.
 * The production build rewrites `300ms` to `.3s`, so both units are handled.
 */
export function motionDurationMs(token: string, fallback: number): number {
  if (typeof getComputedStyle !== 'function') return fallback;

  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();

  if (raw.endsWith('ms')) return Number.parseFloat(raw);
  if (raw.endsWith('s')) return Number.parseFloat(raw) * 1000;
  return fallback;
}
