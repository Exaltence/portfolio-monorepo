import { FocusKeyManager } from '@angular/cdk/a11y';
import {
  Component,
  DestroyRef,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { Project } from '@portfolio-monorepo/portfolio/data';
import { ProjectCardComponent } from '@portfolio-monorepo/portfolio/ui/project-card';

const AUTOPLAY_MS = 7000;

@Component({
  selector: 'app-project-carousel',
  imports: [ProjectCardComponent],
  templateUrl: './project-carousel.component.html',
  styleUrl: './project-carousel.component.scss',
})
export class ProjectCarouselComponent {
  readonly projects = input<readonly Project[]>([]);
  readonly selected = output<Project>();

  private readonly _index = signal(0);
  readonly index = this._index.asReadonly();

  protected readonly paused = signal(false);
  private readonly reducedMotion = matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  private readonly cards = viewChildren(ProjectCardComponent);
  private keyManager: FocusKeyManager<ProjectCardComponent> | undefined;

  constructor() {
    effect((onCleanup) => {
      const count = this.projects().length;
      if (this.reducedMotion || this.paused() || count <= 1) {
        return;
      }
      const timer = setInterval(() => this.next(), AUTOPLAY_MS);
      onCleanup(() => clearInterval(timer));
    });

    afterNextRender(() => {
      this.keyManager = new FocusKeyManager<ProjectCardComponent>([
        ...this.cards(),
      ])
        .withHorizontalOrientation('ltr')
        .withWrap();
    });

    inject(DestroyRef).onDestroy(() => this.keyManager?.destroy());
  }

  next(): void {
    const count = this.projects().length;
    if (count === 0) {
      return;
    }
    this._index.set((this._index() + 1) % count);
  }

  prev(): void {
    const count = this.projects().length;
    if (count === 0) {
      return;
    }
    this._index.set((this._index() - 1 + count) % count);
  }

  protected onSelect(project: Project): void {
    this.selected.emit(project);
  }

  protected pause(): void {
    this.paused.set(true);
  }

  protected resume(): void {
    this.paused.set(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    this.keyManager?.onKeydown(event);
  }
}
