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
import {
  shortestWrappedDelta,
  wrapIndex,
} from '@portfolio-monorepo/portfolio/util';
import { IconComponent } from '@portfolio-monorepo/shared/ui';
import {
  motionDurationMs,
  prefersReducedMotion,
} from '@portfolio-monorepo/shared/util';
import { ProjectCardComponent } from '../project-card/project-card.component';

const AUTOPLAY_MS = 3000;
// Must match the track's `gap` in the stylesheet; the step maths cannot read it back from layout
const GAP_PX = 20;
// Deadlock net, not a timing mechanism: a lost `transitionend` would strand `busy` forever
const SETTLE_FALLBACK_MS = 300;
const SETTLE_FALLBACK_GRACE_MS = 250;

let nextId = 0;

// `keyCode` rather than `key` because that is what CDK's `FocusKeyManager` matches on
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

  // The track holds three copies of the list, so the real slides start one full copy in
  private readonly firstRealSlide = computed(() => this.count());

  // `logical` counts moves and drives the index, `render` is the track; both re-seed on a new list
  private readonly logical = linkedSignal(() => this.firstRealSlide());
  private readonly render = linkedSignal(() => this.firstRealSlide());
  // Moves requested mid-transition queue here instead of fighting the one already in flight
  private readonly pending = signal(0);
  private readonly busy = signal(false);
  // Kills the CSS transition for the frame the snap-back happens in, so it is invisible
  private readonly instant = signal(false);
  private settleFallback: ReturnType<typeof setTimeout> | undefined;
  private netSettled = false;

  readonly index = computed(() => {
    const count = this.count();
    return count === 0 ? 0 : wrapIndex(this.logical(), count);
  });

  protected readonly slides = computed<readonly CarouselSlide[]>(() => {
    const items = this.projects();
    const count = items.length;
    if (count === 0) {
      return [];
    }
    // Tripled so there is a full copy of runway each side; the track never reveals an edge
    return Array.from({ length: count * 3 }, (_, i) => {
      const project = items[i % count];
      const clone = i < count || i >= count * 2;
      return {
        key: `${i}-${project.id}`,
        project,
        clone,
        // Clones are hidden from assistive tech, so only the middle copy carries a position
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
  private readonly reducedMotion = prefersReducedMotion();

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

  // Nothing rotates under reduced motion, so the pause button would have nothing to pause
  protected readonly rotates = computed(
    () => !this.reducedMotion && this.count() > 1,
  );

  private readonly root = viewChild<ElementRef<HTMLElement>>('root');
  private readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  private readonly viewportWidth = signal(0);

  // These thresholds mirror the `@container` queries in the stylesheet and must move with them
  private readonly columns = computed(() => {
    const width = this.viewportWidth();
    if (width >= 700) {
      return 3;
    }
    return width >= 460 ? 2 : 1;
  });

  // Re-derives the width the stylesheet's `flex-basis` produces; a slide plus a gap is one move
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
      // Read for its dependency alone: bumping it restarts the interval with a full delay
      this.autoplayNonce();
      if (!this.canAutoplay()) {
        return;
      }
      const id = setInterval(() => this.move(1), AUTOPLAY_MS);
      onCleanup(() => clearInterval(id));
    });

    // An overlay under the pointer swallows `pointerleave`, leaving the hover pause stuck on
    effect((onCleanup) => {
      if (!this.paused()) {
        return;
      }
      onCleanup(() => this.pointerPaused.set(false));
    });

    afterNextRender(() => {
      const count = this.count();
      // Only the middle copy is focusable; the clones are hidden duplicates of these same cards
      const homeCards = this.cards().slice(count, count * 2);

      // Vertical arrows are off so they still scroll the page rather than moving the track
      this.keyManager = new FocusKeyManager<ProjectCardComponent>(homeCards)
        .withHorizontalOrientation('ltr')
        .withVerticalOrientation(false)
        .withWrap();

      const host = this.viewport()?.nativeElement;
      if (host && typeof ResizeObserver !== 'undefined') {
        // Fractional on purpose: `clientWidth` rounds, and the drift shows after a lap
        this.viewportWidth.set(host.getBoundingClientRect().width);
        const observer = new ResizeObserver(([entry]) =>
          this.viewportWidth.set(entry.contentBoxSize[0].inlineSize),
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

  // A click can land on a clone the key manager does not track; re-point it and take focus back
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
    // Late event from a move the net already closed; `busy` is true again so it cannot gate this
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

    // The first arrow only moves focus in; letting it through would skip a project as well
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

  // Focus wraps, so take the short way round; stepping one at a time keeps every move queued
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

  // One move in flight at a time, so a held arrow queues instead of restarting the transition
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

  // Reduced motion zeroes the transition and a backgrounded tab drops the event; this ends the move
  private armSettleFallback(): void {
    clearTimeout(this.settleFallback);
    const duration = motionDurationMs(
      '--motion-duration-scene',
      SETTLE_FALLBACK_MS,
    );
    this.settleFallback = setTimeout(
      () => {
        // Usually late rather than lost, so mark the event still to come as already handled
        this.netSettled = true;
        this.settle();
      },
      Math.max(duration * 2, duration + SETTLE_FALLBACK_GRACE_MS),
    );
  }

  // The only path that clears `busy`, so a dropped event cannot strand `render` outside the middle
  private settle(): void {
    if (!this.busy()) {
      return;
    }
    clearTimeout(this.settleFallback);
    const count = this.count();
    const render = this.render();

    // Drifted into a clone: teleport to the identical middle slide and buy another copy of runway
    if (count > 0 && (render < count || render >= count * 2)) {
      this.instant.set(true);
      this.render.set(count + wrapIndex(render - count, count));
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          // Two frames: the first paints the jump untransitioned, the second re-enables safely
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
