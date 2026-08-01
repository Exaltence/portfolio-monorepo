import { FocusKeyManager } from '@angular/cdk/a11y';
import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Project } from '@portfolio-monorepo/portfolio/data';
import { ProjectCardComponent } from '../project-card/project-card.component';

const AUTOPLAY_MS = 7000;
const GAP_PX = 20;

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

  private readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  private readonly viewportWidth = signal(0);

  protected readonly columns = computed(() => {
    const width = this.viewportWidth();
    if (width >= 700) {
      return 3;
    }
    return width >= 460 ? 2 : 1;
  });

  protected readonly offset = computed(() => {
    const width = this.viewportWidth();
    const count = this.projects().length;
    const columns = Math.min(this.columns(), Math.max(count, 1));
    if (width === 0 || count === 0) {
      return 0;
    }
    const slideWidth = (width - (columns - 1) * GAP_PX) / columns;
    const step = slideWidth + GAP_PX;
    const trackWidth = count * slideWidth + (count - 1) * GAP_PX;
    const maxScroll = Math.max(0, trackWidth - width);
    return -Math.min(this._index() * step, maxScroll);
  });

  private readonly cards = viewChildren(ProjectCardComponent);
  private readonly destroyRef = inject(DestroyRef);
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

      const host = this.viewport()?.nativeElement;
      if (host && typeof ResizeObserver !== 'undefined') {
        this.viewportWidth.set(host.clientWidth);
        const observer = new ResizeObserver(() =>
          this.viewportWidth.set(host.clientWidth),
        );
        observer.observe(host);
        this.destroyRef.onDestroy(() => observer.disconnect());
      }
    });

    this.destroyRef.onDestroy(() => this.keyManager?.destroy());
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
