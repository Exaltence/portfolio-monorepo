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
  selector: 'app-tabs',
  imports: [NgTemplateOutlet],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
})
export class TabsComponent {
  readonly tabs = input<readonly string[]>([]);
  readonly activeChange = output<number>();

  protected readonly active = signal(0);
  protected readonly panels = contentChildren(TemplateRef);

  protected select(index: number): void {
    this.active.set(index);
    this.activeChange.emit(index);
  }
}
