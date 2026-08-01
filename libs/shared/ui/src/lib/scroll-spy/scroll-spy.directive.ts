import {
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  output,
} from '@angular/core';

@Directive({
  selector: '[appScrollSpy]',
})
export class ScrollSpyDirective {
  private readonly host = inject<ElementRef<Element>>(ElementRef);
  readonly scrolled = output<boolean>();

  constructor() {
    const observer = new IntersectionObserver(([entry]) => {
      this.scrolled.emit(!entry.isIntersecting);
    });
    observer.observe(this.host.nativeElement);
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
}
