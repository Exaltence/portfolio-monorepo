import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Skill } from '@portfolio-monorepo/portfolio/data';

@Component({
  selector: 'app-skill-badge',
  templateUrl: './skill-badge.component.html',
  styleUrl: './skill-badge.component.scss',
})
export class SkillBadgeComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly skill = input.required<Skill>();

  protected readonly safeIcon = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.skill().icon),
  );
}
