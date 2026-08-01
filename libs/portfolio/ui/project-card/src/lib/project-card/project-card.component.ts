import { NgOptimizedImage } from '@angular/common';
import { Component, ElementRef, inject, input, output } from '@angular/core';
import { FocusableOption } from '@angular/cdk/a11y';
import { Project } from '@portfolio-monorepo/portfolio/data';

@Component({
  selector: 'app-project-card',
  imports: [NgOptimizedImage],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss',
  host: {
    'data-testid': 'project-card',
    role: 'button',
    tabindex: '-1',
    '[attr.aria-label]': 'project().title',
    '(click)': 'emitOpen()',
    '(keydown.enter)': 'emitOpen()',
    '(keydown.space)': 'emitOpen()',
  },
})
export class ProjectCardComponent implements FocusableOption {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly project = input.required<Project>();
  readonly opened = output<Project>();

  focus(): void {
    this.host.nativeElement.focus();
  }

  protected emitOpen(): void {
    this.opened.emit(this.project());
  }
}
