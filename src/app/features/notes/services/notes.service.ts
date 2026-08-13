import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Note, NotesResponse, NoteInput } from '../models/note';

@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/notes';

  getNotes(page = 1, limit = 5): Observable<NotesResponse> {
    return this.http.get<NotesResponse>(`${this.apiUrl}?page=${page}&limit=${limit}`);
  }

  getNote(id: string): Observable<Note> {
    return this.http.get<Note>(`${this.apiUrl}/${id}`);
  }

  createNote(input: NoteInput): Observable<Note> {
    return this.http.post<Note>(this.apiUrl, input);
  }

  updateNote(id: string, input: NoteInput): Observable<Note> {
    return this.http.put<Note>(`${this.apiUrl}/${id}`, input);
  }

  deleteNote(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  approveNote(id: string): Observable<Note> {
    return this.http.put<Note>(`${this.apiUrl}/${id}/approve`, {});
  }
}
