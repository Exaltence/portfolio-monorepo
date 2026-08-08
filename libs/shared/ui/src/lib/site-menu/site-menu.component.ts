import { Component, input, model, output } from '@angular/core';
import { NavItem } from '@portfolio-monorepo/shared/data';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-site-menu',
  imports: [IconComponent],
  templateUrl: './site-menu.component.html',
  styleUrl: './site-menu.component.scss',
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
