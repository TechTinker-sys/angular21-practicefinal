import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotesService } from '../../services/notes.service';
import { Note } from '../../models/note';

@Component({
  selector: 'app-note-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, NgIf, RouterLink],
  templateUrl: './note-edit.html'
})
export class NoteEdit {
  private readonly notesService = inject(NotesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly note = signal<Note | null>(null);
  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');

  protected readonly noteForm = new FormGroup({
    title: new FormControl('', Validators.required),
    content: new FormControl('', Validators.required)
  });

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
        this.noteForm.setValue({ title: note.title, content: note.content });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load note.');
        this.loading.set(false);
      },
    });
  }

  protected submitNote() {
    if (this.noteForm.invalid) {
      this.error.set('Title and content are required.');
      return;
    }

    const id = this.note()?.id;
    if (!id) {
      this.error.set('Note id is missing.');
      return;
    }

    this.submitting.set(true);
    this.error.set('');
    this.notesService.updateNote(id, {
      title: this.noteForm.value.title ?? '',
      content: this.noteForm.value.content ?? ''
    }).subscribe({
      next: () => this.router.navigate(['/notes']),
      error: () => {
        this.error.set('Unable to update note.');
        this.submitting.set(false);
      },
    });
  }
}