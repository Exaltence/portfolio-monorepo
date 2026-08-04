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
  linkedSignal,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Project } from '@portfolio-monorepo/portfolio/data';
import { ProjectCardComponent } from '../project-card/project-card.component';

const AUTOPLAY_MS = 3000;
const GAP_PX = 20;
const DRAG_THRESHOLD_PX = 5;

interface CarouselSlide {
  readonly key: string;
  readonly project: Project;
  readonly clone: boolean;
}

@Component({
  selector: 'app-project-carousel',
  imports: [ProjectCardComponent],
  templateUrl: './project-carousel.component.html',
  styleUrl: './project-carousel.component.scss',
})
export class ProjectCarouselComponent {
  readonly projects = input<readonly Project[]>([]);
  readonly selected = output<Project>();

  private readonly count = computed(() => this.projects().length);

  private readonly logical = linkedSignal(() => this.count());
  private readonly render = linkedSignal(() => this.count());
  private readonly pending = signal(0);
  private readonly busy = signal(false);
  private readonly instant = signal(false);

  readonly index = computed(() => {
    const count = this.count();
    return count === 0 ? 0 : ((this.logical() % count) + count) % count;
  });

  protected readonly slides = computed<readonly CarouselSlide[]>(() => {
    const items = this.projects();
    const count = items.length;
    if (count === 0) {
      return [];
    }
    return Array.from({ length: count * 3 }, (_, i) => {
      const project = items[i % count];
      return {
        key: `${i}-${project.id}`,
        project,
        clone: i < count || i >= count * 2,
      };
    });
  });

  protected readonly dragging = signal(false);
  private readonly paused = signal(false);
  private readonly reducedMotion = matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  private readonly canAutoplay = computed(
    () =>
      !this.reducedMotion &&
      !this.paused() &&
      !this.dragging() &&
      this.count() > 1,
  );

  private readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  private readonly viewportWidth = signal(0);

  protected readonly columns = computed(() => {
    const width = this.viewportWidth();
    if (width >= 700) {
      return 3;
    }
    return width >= 460 ? 2 : 1;
  });

  private readonly step = computed(() => {
    const width = this.viewportWidth();
    const count = this.count();
    if (width === 0 || count === 0) {
      return 0;
    }
    const columns = Math.min(this.columns(), count);
    return (width - (columns - 1) * GAP_PX) / columns + GAP_PX;
  });

  private readonly dragStartX = signal<number | null>(null);
  private readonly dragDelta = signal(0);
  private suppressNextSelect = false;

  protected readonly offset = computed(
    () => -(this.render() * this.step()) + this.dragDelta(),
  );
  protected readonly animate = computed(
    () => !this.instant() && !this.dragging(),
  );

  private readonly cards = viewChildren(ProjectCardComponent);
  private readonly destroyRef = inject(DestroyRef);
  private readonly autoplayNonce = signal(0);
  private keyManager: FocusKeyManager<ProjectCardComponent> | undefined;

  constructor() {
    effect((onCleanup) => {
      this.autoplayNonce();
      if (!this.canAutoplay()) {
        return;
      }
      const id = setInterval(() => this.move(1), AUTOPLAY_MS);
      onCleanup(() => clearInterval(id));
    });

    afterNextRender(() => {
      const count = this.count();
      const homeCards = this.cards().slice(count, count * 2);
      this.keyManager = new FocusKeyManager<ProjectCardComponent>(homeCards)
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
    this.move(1);
    this.resetAutoplay();
  }

  prev(): void {
    this.move(-1);
    this.resetAutoplay();
  }

  protected onSelect(project: Project): void {
    if (this.suppressNextSelect) {
      this.suppressNextSelect = false;
      return;
    }
    this.selected.emit(project);
  }

  protected onPointerEnter(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      this.paused.set(true);
    }
  }

  protected onPointerLeave(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      this.paused.set(false);
    }
  }

  protected onFocusIn(): void {
    this.resetAutoplay();
  }

  protected onTransitionEnd(event: TransitionEvent): void {
    if (event.propertyName !== 'transform') {
      return;
    }
    const count = this.count();
    const render = this.render();
    if (count > 0 && (render < count || render >= count * 2)) {
      this.instant.set(true);
      this.render.set(count + ((((render - count) % count) + count) % count));
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          this.instant.set(false);
          this.busy.set(false);
          this.pump();
        }),
      );
      return;
    }
    this.busy.set(false);
    this.pump();
  }

  protected onDragStart(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    this.suppressNextSelect = false;
    this.dragStartX.set(event.clientX);
  }

  protected onDragMove(event: PointerEvent): void {
    const start = this.dragStartX();
    if (start === null) {
      return;
    }
    const delta = event.clientX - start;
    this.dragDelta.set(delta);
    if (!this.dragging() && Math.abs(delta) > DRAG_THRESHOLD_PX) {
      this.dragging.set(true);
      (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    }
  }

  protected onDragEnd(): void {
    const start = this.dragStartX();
    if (start === null) {
      return;
    }
    const delta = this.dragDelta();
    const threshold = Math.max(this.step() / 4, DRAG_THRESHOLD_PX * 4);
    if (Math.abs(delta) > DRAG_THRESHOLD_PX) {
      this.suppressNextSelect = true;
    }
    if (delta <= -threshold) {
      this.next();
    } else if (delta >= threshold) {
      this.prev();
    } else {
      this.resetAutoplay();
    }
    this.dragStartX.set(null);
    this.dragDelta.set(0);
    this.dragging.set(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    this.keyManager?.onKeydown(event);
  }

  private move(dir: 1 | -1): void {
    if (this.count() < 2) {
      return;
    }
    this.logical.update((value) => value + dir);
    this.pending.update((value) => value + dir);
    this.pump();
  }

  private pump(): void {
    if (this.busy() || this.pending() === 0) {
      return;
    }
    const dir = this.pending() > 0 ? 1 : -1;
    this.pending.update((value) => value - dir);
    this.busy.set(true);
    this.render.update((value) => value + dir);
  }

  private resetAutoplay(): void {
    this.autoplayNonce.update((value) => value + 1);
  }
}
