import { Component, input } from '@angular/core';
import { ResumeEntry } from '@portfolio-monorepo/portfolio/data';

@Component({
  selector: 'app-resume-list',
  templateUrl: './resume-list.component.html',
  styleUrl: './resume-list.component.scss',
})
export class ResumeListComponent {
  readonly entries = input<readonly ResumeEntry[]>([]);
}
