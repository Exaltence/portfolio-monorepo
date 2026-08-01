import { Component, input } from '@angular/core';
import { scrollToTop } from '@portfolio-monorepo/shared/util';

@Component({
  selector: 'app-back-to-top',
  templateUrl: './back-to-top.component.html',
  styleUrl: './back-to-top.component.scss',
})
export class BackToTopComponent {
  readonly visible = input(false);

  protected onClick(): void {
    scrollToTop();
  }
}
