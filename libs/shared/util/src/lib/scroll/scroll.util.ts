export function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function scrollToElement(element: Element): void {
  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
