import { prefersReducedMotion } from '../motion/motion.util';

// Checked per call: `scroll-behavior` in a media query cannot override the `behavior` option
function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth';
}

export function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: scrollBehavior() });
}

export function scrollToElement(element: Element): void {
  element.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
}

export function scrollElementToTop(element: Element): void {
  element.scrollTo({ top: 0, behavior: scrollBehavior() });
}
