import {
  Component,
  Injector,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { AboutFeatureComponent } from '@portfolio-monorepo/portfolio/feature/about';
import { ProfilePanelFeatureComponent } from '@portfolio-monorepo/portfolio/feature/profile-panel';
import { ProjectsFeatureComponent } from '@portfolio-monorepo/portfolio/feature/projects';
import { NavItem } from '@portfolio-monorepo/shared/data';
import {
  BackToTopComponent,
  IconComponent,
  NoDragDirective,
  ScrollSpyDirective,
  SiteMenuComponent,
} from '@portfolio-monorepo/shared/ui';
import { scrollToElement } from '@portfolio-monorepo/shared/util';

@Component({
  selector: 'app-home',
  imports: [
    SiteMenuComponent,
    ScrollSpyDirective,
    BackToTopComponent,
    ProfilePanelFeatureComponent,
    AboutFeatureComponent,
    ProjectsFeatureComponent,
    IconComponent,
    NoDragDirective,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly injector = inject(Injector);
  protected readonly scrolled = signal(false);
  protected readonly menuOpen = signal(false);
  protected readonly year = new Date().getFullYear();
  protected readonly navItems: readonly NavItem[] = [
    { label: 'Home', fragment: 'home' },
    { label: 'Portfolio', fragment: 'portfolio' },
  ];

  protected onScrolled(value: boolean): void {
    this.scrolled.set(value);
  }

  protected navigate(item: NavItem): void {
    const target = document.getElementById(item.fragment);
    if (!target) {
      return;
    }
    scrollToElement(target);

    // Without this the trap restores focus to the trigger at the top of the page
    afterNextRender(() => target.focus({ preventScroll: true }), {
      injector: this.injector,
    });
  }
}
