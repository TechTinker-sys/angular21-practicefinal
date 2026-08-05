import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home').then((m) => m.Home)
  },
  {
    path: 'playground',
    loadComponent: () => import('./playground').then((m) => m.Playground)
  },
  {
    path: 'about',
    loadComponent: () => import('./about').then((m) => m.About)
  },
  {
    path: '404',
    loadComponent: () => import('./not-found').then((m) => m.NotFound)
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: '404' }
];
