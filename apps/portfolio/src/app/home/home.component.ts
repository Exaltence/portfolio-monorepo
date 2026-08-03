import { Component, signal } from '@angular/core';
import { AboutFeatureComponent } from '@portfolio-monorepo/portfolio/feature/about';
import { ProfilePanelFeatureComponent } from '@portfolio-monorepo/portfolio/feature/profile-panel';
import { ProjectsFeatureComponent } from '@portfolio-monorepo/portfolio/feature/projects';
import {
  BackToTopComponent,
  ScrollSpyDirective,
  SiteMenuComponent,
} from '@portfolio-monorepo/shared/ui';
import { NavItem, scrollToElement } from '@portfolio-monorepo/shared/util';

@Component({
  selector: 'app-home',
  imports: [
    SiteMenuComponent,
    ScrollSpyDirective,
    BackToTopComponent,
    ProfilePanelFeatureComponent,
    AboutFeatureComponent,
    ProjectsFeatureComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
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
    if (target) {
      scrollToElement(target);
    }
  }

  protected openLink(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
