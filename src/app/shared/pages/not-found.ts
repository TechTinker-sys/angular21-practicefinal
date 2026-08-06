import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <div class="rounded-3xl border border-slate-200 bg-white p-12 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <p class="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-400">404</p>
        <h1 class="mt-4 text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl">Page not found</h1>
        <p class="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400">
          The page you were looking for doesn’t exist or has been moved.
        </p>
        <div class="mt-8 flex justify-center">
          <a
            routerLink="/home"
            class="rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-700"
          >
            Return home
          </a>
        </div>
      </div>
    </section>
  `
})
export class NotFound {}
