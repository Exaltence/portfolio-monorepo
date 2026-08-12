import { Directive } from '@angular/core';

// Native link dragging captures the pointer, so `pointerup` never arrives and hover latches on
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector -- unprefixed on purpose; an opt-in attribute can be forgotten on a new anchor.
  selector: 'a[href], a[routerLink]',
  host: {
    draggable: 'false',
    '(dragstart)': '$event.preventDefault()',
  },
})
export class NoDragDirective {}
