import { Directive, signal } from '@angular/core';

@Directive({
  selector: '[appMagicCursor]',
  host: {
    '[style.--cursor-x.px]': 'x()',
    '[style.--cursor-y.px]': 'y()',
    '(window:pointermove)': 'onMove($event)',
  },
})
export class MagicCursorDirective {
  private readonly enabled = matchMedia('(pointer: fine)').matches;
  protected readonly x = signal(0);
  protected readonly y = signal(0);

  protected onMove(event: PointerEvent): void {
    if (!this.enabled) {
      return;
    }
    this.x.set(event.clientX);
    this.y.set(event.clientY);
  }
}
