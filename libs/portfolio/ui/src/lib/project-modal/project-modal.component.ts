import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AnimationCallbackEvent,
  Component,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { filter } from 'rxjs';
import { ProjectModalData } from '@portfolio-monorepo/portfolio/data';
import { IconComponent } from '@portfolio-monorepo/shared/ui';
import {
  motionDurationMs,
  scrollElementToTop,
} from '@portfolio-monorepo/shared/util';

const LEAVE_MS = 300;
// Deadlock guard like the carousel's settle net: a lost `animationend` would strand the dialog
const LEAVE_FALLBACK_GRACE_MS = 250;

@Component({
  selector: 'app-project-modal',
  imports: [IconComponent],
  templateUrl: './project-modal.component.html',
  styleUrl: './project-modal.component.scss',
})
export class ProjectModalComponent {
  private readonly data = inject<ProjectModalData>(DIALOG_DATA);
  private readonly dialogRef = inject<DialogRef<void>>(DialogRef);

  protected readonly projects = this.data.projects;
  protected readonly current = signal(this.data.index);
  protected readonly activeImage = signal(0);
  // Removes the surface from the template, which is what fires the leave animation
  protected readonly closing = signal(false);
  // Fed to the stylesheet so the content slides out towards the side it is being replaced from
  protected readonly direction = signal<1 | -1>(1);

  private readonly surface = viewChild<ElementRef<HTMLElement>>('surface');

  private readonly backdropClicked = toSignal(this.dialogRef.backdropClick);
  private readonly escapePressed = toSignal(
    this.dialogRef.keydownEvents.pipe(
      filter((event) => event.key === 'Escape'),
    ),
  );

  constructor() {
    // CDK's own backdrop and Escape close skips the leave animation; route both through `close()`
    this.dialogRef.disableClose = true;
    effect(() => {
      if (this.backdropClicked()) {
        this.close();
      }
    });
    effect(() => {
      if (this.escapePressed()) {
        this.close();
      }
    });
  }

  protected next(): void {
    this.direction.set(1);
    this.current.set((this.current() + 1) % this.projects.length);
    this.activeImage.set(0);
    this.resetScroll();
  }

  protected prev(): void {
    this.direction.set(-1);
    const count = this.projects.length;
    this.current.set((this.current() - 1 + count) % count);
    this.activeImage.set(0);
    this.resetScroll();
  }

  // The surface is reused across projects, so the next one would open at the previous scroll
  private resetScroll(): void {
    const surface = this.surface()?.nativeElement;
    if (surface && surface.scrollTop > 0) {
      scrollElementToTop(surface);
    }
  }

  protected showImage(index: number): void {
    this.activeImage.set(index);
  }

  protected close(): void {
    this.closing.set(true);
  }

  // Holds the removal open so the fade/scale-down can play before CDK tears the dialog down
  protected onLeave(event: AnimationCallbackEvent): void {
    const element = event.target as HTMLElement;
    const duration = motionDurationMs('--motion-duration-scene', LEAVE_MS);
    // The event and the fallback race, and whichever loses would otherwise close a second time
    let finished = false;

    const finish = (): void => {
      if (finished) {
        return;
      }
      finished = true;
      clearTimeout(fallback);
      element.removeEventListener('animationend', handleAnimationEnd);
      event.animationComplete();

      // CDK dialog (Angular v22) has no hook for animating the backdrop out, so it is done by hand
      document
        .querySelector('.project-modal-backdrop')
        ?.classList.add('closing');
      setTimeout(() => this.dialogRef.close(), duration);
    };

    const handleAnimationEnd = (e: AnimationEvent): void => {
      if (e.target !== element) {
        return;
      }
      finish();
    };

    element.addEventListener('animationend', handleAnimationEnd);
    const fallback = setTimeout(
      finish,
      Math.max(duration * 2, duration + LEAVE_FALLBACK_GRACE_MS),
    );
  }
}
