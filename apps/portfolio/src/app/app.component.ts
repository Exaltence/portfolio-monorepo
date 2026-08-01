import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeStore } from '@portfolio-monorepo/shared/data';
import {
  MagicCursorDirective,
  ThemeToggleComponent,
} from '@portfolio-monorepo/shared/ui';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MagicCursorDirective, ThemeToggleComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly theme = inject(ThemeStore);
}
