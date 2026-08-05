import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-child',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900/60 dark:bg-sky-950/40 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm font-medium text-sky-800 dark:text-sky-300">
        Message from parent: <span class="font-semibold">{{ message() }}</span>
      </p>
      <button
        type="button"
        (click)="sendClick()"
        class="inline-flex shrink-0 items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.98]"
      >
        Click Me
      </button>
    </div>
  `
})
export class Child {
  message = input.required<string>();
  notify = output<string>();

  sendClick() {
    this.notify.emit('Child button was clicked!');
  }
}
