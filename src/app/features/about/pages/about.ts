import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <p class="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-400">About</p>
      <h1 class="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
        Angular21Practice
      </h1>
      <p class="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">
        A hands-on practice project generated with the Angular CLI, used to explore modern Angular
        patterns &mdash; standalone components, signals, typed reactive forms, RxJS, and HttpClient &mdash;
        inside a clean, enterprise-style Tailwind interface.
      </p>

      <div class="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Built with</h2>
        <div class="mt-4 flex flex-wrap gap-2">
          @for (tech of stack; track tech) {
            <span class="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {{ tech }}
            </span>
          }
        </div>
      </div>

      <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">What's inside</h2>
        <ul class="mt-4 space-y-2.5 text-sm leading-6 text-slate-600 dark:text-slate-400">
          <li>&bull; Signal-based counter with a derived computed value</li>
          <li>&bull; Parent &rarr; child component communication with content projection</li>
          <li>&bull; Typed reactive forms with validation</li>
          <li>&bull; Debounced RxJS search</li>
          <li>&bull; Live HttpClient data fetching</li>
          <li>&bull; Full create / update / delete flow against a REST API</li>
        </ul>
      </div>
    </section>
  `
})
export class About {
  protected readonly stack = [
    'Angular 21',
    'Signals',
    'Standalone Components',
    'Tailwind CSS v4',
    'Reactive Forms',
    'RxJS',
    'HttpClient'
  ];
}
