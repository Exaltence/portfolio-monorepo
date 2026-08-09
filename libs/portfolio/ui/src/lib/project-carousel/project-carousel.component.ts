import { FocusKeyManager, FocusMonitor } from '@angular/cdk/a11y';
import { LEFT_ARROW, RIGHT_ARROW } from '@angular/cdk/keycodes';
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
import { toSignal } from '@angular/core/rxjs-interop';
import { Project } from '@portfolio-monorepo/portfolio/data';
import { IconComponent } from '@portfolio-monorepo/shared/ui';
import { motionDurationMs } from '@portfolio-monorepo/shared/util';
import { ProjectCardComponent } from '../project-card/project-card.component';

const AUTOPLAY_MS = 3000;
const GAP_PX = 20;
const SETTLE_FALLBACK_MS = 300;
// Deadlock net, not a timing mechanism

const SETTLE_FALLBACK_GRACE_MS = 250;

let nextId = 0;

// When both directions are the same length the choice is made explicitly: ties go forward
export function shortestWrappedDelta(diff: number, count: number): number {
  const wrapped = ((diff % count) + count) % count;
  return wrapped * 2 > count ? wrapped - count : wrapped;
}

function isCarouselArrow(event: KeyboardEvent): boolean {
  return event.keyCode === LEFT_ARROW || event.keyCode === RIGHT_ARROW;
}

interface CarouselSlide {
  readonly key: string;
  readonly project: Project;
  readonly clone: boolean;
  readonly label: string | null;
}

@Component({
  selector: 'app-project-carousel',
  imports: [ProjectCardComponent, IconComponent],
  templateUrl: './project-carousel.component.html',
  styleUrl: './project-carousel.component.scss',
  host: {
    '(document:visibilitychange)': 'onVisibilityChange()',
  },
})
export class ProjectCarouselComponent {
  readonly projects = input<readonly Project[]>([]);
  readonly paused = input(false);
  readonly selected = output<Project>();

  protected readonly helpId = `carousel-help-${nextId++}`;

  private readonly count = computed(() => this.projects().length);

  private readonly logical = linkedSignal(() => this.count());
  private readonly render = linkedSignal(() => this.count());
  private readonly pending = signal(0);
  private readonly busy = signal(false);
  private readonly instant = signal(false);
  private settleFallback: ReturnType<typeof setTimeout> | undefined;
  private netSettled = false;

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
      const clone = i < count || i >= count * 2;
      return {
        key: `${i}-${project.id}`,
        project,
        clone,
        // Only the real slide is announced
        label: clone ? null : `${i - count + 1} of ${count}`,
      };
    });
  });

  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly focusMonitor = inject(FocusMonitor);

  private readonly pointerPaused = signal(false);
  // Scoped to keyboard focus on purpose, mouse is already covered by the hover pause
  private readonly focusOrigin = toSignal(
    this.focusMonitor.monitor(this.hostEl.nativeElement, true),
  );
  private readonly focusPaused = computed(
    () => this.focusOrigin() === 'keyboard',
  );
  private readonly hidden = signal(document.hidden);
  private readonly reducedMotion = matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  protected readonly userPaused = signal(false);

  private readonly canAutoplay = computed(
    () =>
      !this.reducedMotion &&
      !this.userPaused() &&
      !this.paused() &&
      !this.pointerPaused() &&
      !this.focusPaused() &&
      !this.hidden() &&
      this.count() > 1,
  );

  // Remove pause button under reduced motion
  protected readonly rotates = computed(
    () => !this.reducedMotion && this.count() > 1,
  );

  private readonly root = viewChild<ElementRef<HTMLElement>>('root');
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

  protected readonly offset = computed(() => -(this.render() * this.step()));
  protected readonly animate = computed(() => !this.instant());

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

    // `pointerleave` fix for a pointer that was over the carousel when an overlay covers it
    effect((onCleanup) => {
      if (!this.paused()) {
        return;
      }
      onCleanup(() => this.pointerPaused.set(false));
    });

    afterNextRender(() => {
      const count = this.count();
      const homeCards = this.cards().slice(count, count * 2);

      // Vertical ArrowUp/ArrowDown off explicitly
      this.keyManager = new FocusKeyManager<ProjectCardComponent>(homeCards)
        .withHorizontalOrientation('ltr')
        .withVerticalOrientation(false)
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
    this.destroyRef.onDestroy(() => clearTimeout(this.settleFallback));
    this.destroyRef.onDestroy(() =>
      this.focusMonitor.stopMonitoring(this.hostEl.nativeElement),
    );
  }

  next(): void {
    this.move(1);
    this.resetAutoplay();
  }

  prev(): void {
    this.move(-1);
    this.resetAutoplay();
  }

  protected toggleRotation(): void {
    this.userPaused.update((paused) => !paused);
  }

  /*
   * `slideIndex` is the index of the slide that was clicked, which may be a clone.
   * The `project` is the original project associated with that slide
   */
  protected onSelect(project: Project, slideIndex: number): void {
    const count = this.count();
    if (count > 0 && (slideIndex < count || slideIndex >= count * 2)) {
      this.keyManager?.updateActiveItem(slideIndex % count);
      this.root()?.nativeElement.focus({ preventScroll: true });
    }
    this.selected.emit(project);
  }

  protected onPointerActive(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      this.pointerPaused.set(true);
    }
  }

  protected onPointerLeave(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      this.pointerPaused.set(false);
    }
  }

  protected onVisibilityChange(): void {
    this.hidden.set(document.hidden);
  }

  protected onTransitionEnd(event: TransitionEvent): void {
    if (event.propertyName !== 'transform') {
      return;
    }
    // Late event from a netted move; `busy` is already true again for the next one, so it cannot gate this
    if (this.netSettled) {
      this.netSettled = false;
      return;
    }
    this.settle();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const manager = this.keyManager;
    if (!manager) {
      return;
    }

    const before = manager.activeItemIndex;

    // Prevent the first arrow from moving the track if no card is active, but still let it move the focus into the slides
    if ((before == null || before < 0) && isCarouselArrow(event)) {
      manager.setActiveItem(this.index());
      event.preventDefault();
      return;
    }

    manager.onKeydown(event);
    const after = manager.activeItemIndex;
    if (after != null && after >= 0 && after !== before) {
      this.goTo(after);
    }
  }

  // Calculates the shortest wrapped delta between the current index and the target index avoiding clones and moves the carousel accordingly
  private goTo(target: number): void {
    const count = this.count();
    if (count < 2) {
      return;
    }
    const delta = shortestWrappedDelta(target - this.index(), count);
    for (let i = 0; i < Math.abs(delta); i++) {
      this.move(delta > 0 ? 1 : -1);
    }
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
    this.armSettleFallback();
  }

  // Under reduced motion turns the `transitionend` deadlock into a dropped frame, otherwise arms a net to catch a dropped event
  private armSettleFallback(): void {
    clearTimeout(this.settleFallback);
    const duration = motionDurationMs(
      '--motion-duration-scene',
      SETTLE_FALLBACK_MS,
    );
    this.settleFallback = setTimeout(
      () => {
        // Usually late rather than lost, so flag the event still to come as belonging to a finished move
        this.netSettled = true;
        this.settle();
      },
      Math.max(duration * 2, duration + SETTLE_FALLBACK_GRACE_MS),
    );
  }

  // Single end-of-move path to normalize `render` and clear `busy` (prevents drift on dropped events)
  private settle(): void {
    if (!this.busy()) {
      return;
    }
    clearTimeout(this.settleFallback);
    const count = this.count();
    const render = this.render();

    if (count > 0 && (render < count || render >= count * 2)) {
      this.instant.set(true);
      this.render.set(count + ((((render - count) % count) + count) % count));
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          this.instant.set(false);
          this.release();
        }),
      );
      return;
    }
    this.release();
  }

  private release(): void {
    this.busy.set(false);
    this.pump();
  }

  private resetAutoplay(): void {
    this.autoplayNonce.update((value) => value + 1);
  }
}
