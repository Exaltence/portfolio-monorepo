import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  TemplateRef,
  contentChildren,
  input,
  output,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-tab-group',
  imports: [NgTemplateOutlet],
  templateUrl: './tab-group.component.html',
  styleUrl: './tab-group.component.scss',
})
export class TabGroupComponent {
  readonly tabGroup = input<readonly string[]>([]);
  readonly activeChange = output<number>();

  protected readonly active = signal(0);
  protected readonly panels = contentChildren(TemplateRef);

  protected select(index: number): void {
    this.active.set(index);
    this.activeChange.emit(index);
  }
}
