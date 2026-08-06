import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./features/home/pages/home').then((m) => m.Home),
    data: { title: 'Home — Angular21Practice', description: 'Home page for Angular21Practice: signals, reactive forms, and examples.' }
  },
  {
    path: 'playground',
    loadComponent: () => import('./features/playground/pages/playground').then((m) => m.Playground),
    data: { title: 'Playground — Angular21Practice', description: 'Interactive playground for signals, forms, RxJS, and HttpClient examples.' }
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/pages/about').then((m) => m.About),
    data: { title: 'About — Angular21Practice', description: 'About this Angular21Practice project and the technologies used.' }
  },
  {
    path: '404',
    loadComponent: () => import('./shared/pages/not-found').then((m) => m.NotFound)
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: '404' }
];
