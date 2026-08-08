import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NotesService } from '../../services/notes.service';

@Component({
  selector: 'app-note-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, NgIf, RouterLink],
  templateUrl: './note-create.html'
})
export class NoteCreate {
  private readonly notesService = inject(NotesService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly error = signal('');

  protected readonly noteForm = new FormGroup({
    title: new FormControl('', Validators.required),
    content: new FormControl('', Validators.required)
  });

  protected submitNote() {
    if (this.noteForm.invalid) {
      this.error.set('Title and content are required.');
      return;
    }

    this.submitting.set(true);
    this.error.set('');
    this.notesService.createNote({
      title: this.noteForm.value.title ?? '',
      content: this.noteForm.value.content ?? ''
    }).subscribe({
      next: () => this.router.navigate(['/notes']),
      error: () => {
        this.error.set('Unable to create note.');
        this.submitting.set(false);
      },
    });
  }
}