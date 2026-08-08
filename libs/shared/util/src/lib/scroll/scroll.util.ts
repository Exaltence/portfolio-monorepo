import { prefersReducedMotion } from '../motion/motion.util';

/*
 * Checked per call rather than cached: `scroll-behavior: auto` in a media query
 * cannot override the `behavior` option, so the guard has to live here.
 */
function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth';
}

export function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: scrollBehavior() });
}

export function scrollToElement(element: Element): void {
  element.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
}
