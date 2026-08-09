import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { Profile } from '@portfolio-monorepo/portfolio/data';
import { TypingTitleDirective } from '../typing-title/typing-title.directive';
import { IconComponent, NoDragDirective } from '@portfolio-monorepo/shared/ui';

@Component({
  selector: 'app-profile-panel',
  imports: [
    IconComponent,
    NgOptimizedImage,
    NoDragDirective,
    TypingTitleDirective,
  ],
  templateUrl: './profile-panel.component.html',
  styleUrl: './profile-panel.component.scss',
})
export class ProfilePanelComponent {
  readonly profile = input.required<Profile>();
}
