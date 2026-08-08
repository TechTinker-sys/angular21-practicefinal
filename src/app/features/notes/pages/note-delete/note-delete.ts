import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotesService } from '../../services/notes.service';
import { Note } from '../../models/note';

@Component({
  selector: 'app-note-delete',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NgIf, RouterLink],
  templateUrl: './note-delete.html'
})
export class NoteDelete {
  private readonly notesService = inject(NotesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly note = signal<Note | null>(null);
  protected readonly loading = signal(true);
  protected readonly deleting = signal(false);
  protected readonly error = signal('');

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Note id is missing.');
      this.loading.set(false);
      return;
    }

    this.notesService.getNote(id).subscribe({
      next: (note) => {
        this.note.set(note);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load note.');
        this.loading.set(false);
      },
    });
  }

  protected deleteNote() {
    const id = this.note()?.id;
    if (!id) {
      this.error.set('Note id is missing.');
      return;
    }

    this.deleting.set(true);
    this.error.set('');
    this.notesService.deleteNote(id).subscribe({
      next: () => this.router.navigate(['/notes']),
      error: () => {
        this.error.set('Unable to delete note.');
        this.deleting.set(false);
      },
    });
  }
}