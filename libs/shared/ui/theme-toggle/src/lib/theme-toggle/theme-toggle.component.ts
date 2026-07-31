import { Component, input, output } from '@angular/core';
import { Theme } from '@portfolio-monorepo/shared/util';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
})
export class ThemeToggleComponent {
  readonly theme = input.required<Theme>();
  readonly toggled = output<void>();
}
