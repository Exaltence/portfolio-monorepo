import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NoDragDirective } from '@portfolio-monorepo/shared/ui';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, NoDragDirective],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent {}
