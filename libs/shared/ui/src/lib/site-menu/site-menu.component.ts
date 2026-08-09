import { CdkTrapFocus } from '@angular/cdk/a11y';
import { Component, input, model, output } from '@angular/core';
import { NavItem } from '@portfolio-monorepo/shared/data';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-site-menu',
  imports: [IconComponent, CdkTrapFocus],
  templateUrl: './site-menu.component.html',
  styleUrl: './site-menu.component.scss',
  host: {
    '(keydown.escape)': 'close()',
  },
})
export class SiteMenuComponent {
  readonly open = model<boolean>(false);
  readonly items = input<readonly NavItem[]>([]);
  readonly navigate = output<NavItem>();

  protected select(item: NavItem): void {
    this.navigate.emit(item);
    this.open.set(false);
  }

  protected close(): void {
    this.open.set(false);
  }
}
