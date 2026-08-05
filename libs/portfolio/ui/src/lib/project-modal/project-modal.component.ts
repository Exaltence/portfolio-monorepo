import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AnimationCallbackEvent,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { filter } from 'rxjs';

import { ProjectModalData } from './project-modal-data.model';

@Component({
  selector: 'app-project-modal',
  templateUrl: './project-modal.component.html',
  styleUrl: './project-modal.component.scss',
})
export class ProjectModalComponent {
  private readonly data = inject<ProjectModalData>(DIALOG_DATA);
  private readonly dialogRef = inject<DialogRef<void>>(DialogRef);

  protected readonly projects = this.data.projects;
  protected readonly current = signal(this.data.index);
  protected readonly activeImage = signal(0);
  protected readonly closing = signal(false);
  protected readonly direction = signal<1 | -1>(1);

  private readonly backdropClicked = toSignal(this.dialogRef.backdropClick);
  private readonly escapePressed = toSignal(
    this.dialogRef.keydownEvents.pipe(
      filter((event) => event.key === 'Escape'),
    ),
  );

  constructor() {
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
  }

  protected prev(): void {
    this.direction.set(-1);
    const count = this.projects.length;
    this.current.set((this.current() - 1 + count) % count);
    this.activeImage.set(0);
  }

  protected showImage(index: number): void {
    this.activeImage.set(index);
  }

  protected close(): void {
    this.closing.set(true);
  }

  // deferred so the fade/scale-down leave animation can play before CDK tears down the dialog
  protected onLeave(event: AnimationCallbackEvent): void {
    const element = event.target;
    const handleAnimationEnd = (): void => {
      element.removeEventListener('animationend', handleAnimationEnd);
      event.animationComplete();
      this.dialogRef.close();
    };
    element.addEventListener('animationend', handleAnimationEnd);
    element.classList.add('project-modal-leave');
  }
}
