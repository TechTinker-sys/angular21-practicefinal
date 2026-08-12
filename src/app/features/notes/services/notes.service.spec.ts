import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotesService } from './notes.service';
import { Note, NotesResponse } from '../models/note';

describe('NotesService', () => {
  let service: NotesService;
  let httpMock: HttpTestingController;

  const mockNote: Note = {
    id: 'note-1',
    title: 'Test note',
    content: 'Test content',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getNotes', () => {
    it('should fetch notes with pagination params', () => {
      const mockResponse: NotesResponse = {
        notes: [mockNote],
        total: 1,
        page: 1,
        limit: 5,
      };

      service.getNotes(1, 5).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/notes?page=1&limit=5');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should use default pagination values', () => {
      service.getNotes().subscribe();

      const req = httpMock.expectOne('/api/notes?page=1&limit=5');
      expect(req.request.method).toBe('GET');
      req.flush({ notes: [], total: 0 });
    });
  });

  describe('getNote', () => {
    it('should fetch a single note by id', () => {
      service.getNote('note-1').subscribe((note) => {
        expect(note).toEqual(mockNote);
      });

      const req = httpMock.expectOne('/api/notes/note-1');
      expect(req.request.method).toBe('GET');
      req.flush(mockNote);
    });
  });

  describe('createNote', () => {
    it('should POST a new note', () => {
      service.createNote({ title: 'New note', content: 'New content' }).subscribe((note) => {
        expect(note).toEqual(mockNote);
      });

      const req = httpMock.expectOne('/api/notes');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ title: 'New note', content: 'New content' });
      req.flush(mockNote);
    });
  });

  describe('updateNote', () => {
    it('should PUT updated note', () => {
      service.updateNote('note-1', { title: 'Updated', content: 'Updated content' }).subscribe((note) => {
        expect(note).toEqual(mockNote);
      });

      const req = httpMock.expectOne('/api/notes/note-1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ title: 'Updated', content: 'Updated content' });
      req.flush(mockNote);
    });
  });

  describe('deleteNote', () => {
    it('should DELETE a note', () => {
      service.deleteNote('note-1').subscribe();

      const req = httpMock.expectOne('/api/notes/note-1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});