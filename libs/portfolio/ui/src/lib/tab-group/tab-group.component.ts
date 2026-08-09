import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ElementRef,
  TemplateRef,
  contentChildren,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';

let nextId = 0;

@Component({
  selector: 'app-tab-group',
  imports: [NgTemplateOutlet],
  templateUrl: './tab-group.component.html',
  styleUrl: './tab-group.component.scss',
})
export class TabGroupComponent {
  readonly tabGroup = input<readonly string[]>([]);
  readonly activeChange = output<number>();

  protected readonly idPrefix = `tab-group-${nextId++}`;
  protected readonly active = signal(0);
  protected readonly panels = contentChildren(TemplateRef);
  private readonly tabs = viewChildren<ElementRef<HTMLButtonElement>>('tab');

  protected select(index: number): void {
    this.active.set(index);
    this.activeChange.emit(index);
  }

  /*
   * Assistive technology users can navigate the tablist with keyboard
   */
  protected onKeydown(event: KeyboardEvent): void {
    const last = this.tabGroup().length - 1;
    if (last < 0) {
      return;
    }

    const current = this.active();
    let next: number;

    switch (event.key) {
      case 'ArrowRight':
        next = current === last ? 0 : current + 1;
        break;
      case 'ArrowLeft':
        next = current === 0 ? last : current - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.select(next);
    this.tabs()[next]?.nativeElement.focus();
  }
}
