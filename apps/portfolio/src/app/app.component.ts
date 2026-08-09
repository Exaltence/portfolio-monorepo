import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeStore } from '@portfolio-monorepo/shared/data';
import { ThemeToggleComponent } from '@portfolio-monorepo/shared/ui';
// TODO: Fix styling & enable Magic Cursor
// import {
//   MagicCursorDirective,
//   ThemeToggleComponent,
// } from '@portfolio-monorepo/shared/ui';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ThemeToggleComponent],
  //  imports: [RouterOutlet, MagicCursorDirective, ThemeToggleComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly theme = inject(ThemeStore);
}
