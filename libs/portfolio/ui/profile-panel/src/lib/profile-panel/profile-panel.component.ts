import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { Profile } from '@portfolio-monorepo/portfolio/data';
import { TypingTitleDirective } from '@portfolio-monorepo/portfolio/ui/typing-title';

@Component({
  selector: 'app-profile-panel',
  imports: [NgOptimizedImage, TypingTitleDirective],
  templateUrl: './profile-panel.component.html',
  styleUrl: './profile-panel.component.scss',
})
export class ProfilePanelComponent {
  readonly profile = input.required<Profile>();
}
