import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';

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

  protected readonly project = computed(() => this.projects[this.current()]);

  protected next(): void {
    this.current.set((this.current() + 1) % this.projects.length);
    this.activeImage.set(0);
  }

  protected prev(): void {
    const count = this.projects.length;
    this.current.set((this.current() - 1 + count) % count);
    this.activeImage.set(0);
  }

  protected showImage(index: number): void {
    this.activeImage.set(index);
  }

  protected close(): void {
    this.dialogRef.close();
  }
}
