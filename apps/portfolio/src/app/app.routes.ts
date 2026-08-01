import { Route } from '@angular/router';
import { NotFoundComponent } from './not-found/not-found.component';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];
