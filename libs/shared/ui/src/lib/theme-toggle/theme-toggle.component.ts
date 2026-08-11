import { Component, computed, input, output } from '@angular/core';
import { Theme } from '@portfolio-monorepo/shared/data';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-theme-toggle',
  imports: [IconComponent],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
})
export class ThemeToggleComponent {
  readonly theme = input.required<Theme>();
  readonly toggled = output<void>();

  protected readonly isLight = computed(() => this.theme() === 'light');
}
