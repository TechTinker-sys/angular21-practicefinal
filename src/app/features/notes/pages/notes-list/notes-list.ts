import { Component, ChangeDetectionStrategy, computed, signal, inject } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotesService } from '../../services/notes.service';
import { Note } from '../../models/note';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-notes-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NgFor, NgIf, RouterLink],
  templateUrl: './notes-list.html'
})
export class NotesList {
  private readonly notesService = inject(NotesService);
  private readonly authService = inject(AuthService);

  protected readonly isAdmin = this.authService.isAdmin;
  protected readonly currentUser = this.authService.user;

  protected readonly notes = signal<Note[]>([]);
  protected readonly page = signal(1);
  protected readonly limit = signal(5);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly approving = signal<string | null>(null);

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));

  constructor() {
    this.loadNotes();
  }

  protected loadNotes(page = this.page(), limit = this.limit()) {
    this.loading.set(true);
    this.error.set('');
    this.notesService.getNotes(page, limit).subscribe({
      next: (result) => {
        this.notes.set(result.notes);
        this.total.set(result.total);
        this.page.set(result.page ?? page);
        this.limit.set(result.limit ?? limit);
      },
      error: () => {
        this.error.set('Unable to load notes.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  protected canModify(note: Note): boolean {
    return this.isAdmin() || note.authorId === this.currentUser()?.id;
  }

  protected approve(note: Note) {
    this.approving.set(note.id);
    this.notesService.approveNote(note.id).subscribe({
      next: (updated) => {
        this.notes.update((notes) => notes.map((n) => (n.id === updated.id ? updated : n)));
        this.approving.set(null);
      },
      error: () => {
        this.error.set('Unable to approve note.');
        this.approving.set(null);
      },
    });
  }

  protected nextPage() {
    if (this.page() >= this.totalPages()) {
      return;
    }
    const nextPage = this.page() + 1;
    this.page.set(nextPage);
    this.loadNotes(nextPage, this.limit());
  }

  protected previousPage() {
    if (this.page() <= 1) {
      return;
    }
    const prevPage = this.page() - 1;
    this.page.set(prevPage);
    this.loadNotes(prevPage, this.limit());
  }
}