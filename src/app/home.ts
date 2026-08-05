import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div class="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-sky-50 p-8 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/30 sm:p-12">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-400">Angular 21 &middot; Signals &middot; Tailwind</p>
        <h1 class="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
          A modern, enterprise-grade Angular practice workspace
        </h1>
        <p class="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-400">
          Explore signals, reactive forms, RxJS, component composition, and full CRUD over HTTP &mdash;
          all rebuilt with a clean, professional interface.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a
            routerLink="/playground"
            class="inline-flex items-center gap-2 rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-700"
          >
            Open Playground
            <span aria-hidden="true">→</span>
          </a>
          <a
            routerLink="/about"
            class="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            About this project
          </a>
        </div>
      </div>

      <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        @for (feature of features; track feature.title) {
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-slate-800">
              {{ feature.icon }}
            </div>
            <h2 class="mt-4 text-base font-semibold text-slate-900 dark:text-white">{{ feature.title }}</h2>
            <p class="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-400">{{ feature.description }}</p>
          </div>
        }
      </div>
    </section>
  `
})
export class Home {
  protected readonly features = [
    { icon: '🔢', title: 'Signals & Computed', description: 'Reactive state with signal() and computed(), no zone.js boilerplate.' },
    { icon: '🧩', title: 'Component Composition', description: 'Parent/child communication with input(), output(), and content projection.' },
    { icon: '📝', title: 'Reactive Forms', description: 'Typed FormGroup / FormControl with validation.' },
    { icon: '🔍', title: 'RxJS Search', description: 'Debounced search input backed by a Subject and operators.' },
    { icon: '🌐', title: 'HttpClient', description: 'Fetching live data from a REST API.' },
    { icon: '🗂️', title: 'Full CRUD', description: 'Create, read, update, and delete posts against a live API.' }
  ];
}
