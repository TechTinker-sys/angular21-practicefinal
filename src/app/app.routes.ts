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
    path: 'notes',
    data: { title: 'Notes — Angular21Practice', description: 'Create, read, update, and delete notes against the Express API.' },
    children: [
      {
        path: '',
        loadComponent: () => import('./features/notes/pages/notes-list/notes-list').then((m) => m.NotesList),
        data: { title: 'Notes — Angular21Practice', description: 'Browse all notes from the Express API.' }
      },
      {
        path: 'new',
        loadComponent: () => import('./features/notes/pages/note-create/note-create').then((m) => m.NoteCreate),
        data: { title: 'New Note — Angular21Practice', description: 'Create a new note.' }
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./features/notes/pages/note-edit/note-edit').then((m) => m.NoteEdit),
        data: { title: 'Edit Note — Angular21Practice', description: 'Update an existing note.' }
      },
      {
        path: ':id/delete',
        loadComponent: () => import('./features/notes/pages/note-delete/note-delete').then((m) => m.NoteDelete),
        data: { title: 'Delete Note — Angular21Practice', description: 'Delete an existing note.' }
      }
    ]
  },
  {
    path: '404',
    loadComponent: () => import('./shared/pages/not-found').then((m) => m.NotFound)
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: '404' }
];
