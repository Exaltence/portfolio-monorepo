import { Component, inject } from '@angular/core';
import { ProfileStore } from '@portfolio-monorepo/portfolio/data';
import { ProfilePanelComponent } from '@portfolio-monorepo/portfolio/ui';

@Component({
  selector: 'app-profile-panel-feature',
  imports: [ProfilePanelComponent],
  templateUrl: './profile-panel-feature.component.html',
  styleUrl: './profile-panel-feature.component.scss',
})
export class ProfilePanelFeatureComponent {
  protected readonly store = inject(ProfileStore);
}
