import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NoteDelete } from './note-delete';
import { Note } from '../../models/note';

describe('NoteDelete', () => {
  let fixture: ComponentFixture<NoteDelete>;
  let component: NoteDelete;
  let httpMock: HttpTestingController;
  let router: Router;

  const mockNote: Note = {
    id: 'note-1',
    title: 'Delete me',
    content: 'Content to delete',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  function setup(id: string | null = 'note-1') {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [NoteDelete],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(id ? { id } : {}),
            },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(NoteDelete);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }

  afterEach(() => {
    httpMock?.verify();
  });

  describe('with valid id', () => {
    beforeEach(() => setup('note-1'));

    it('should create the component', () => {
      httpMock.expectOne('/api/notes/note-1').flush(mockNote);
      expect(component).toBeTruthy();
    });

    it('should load the note for confirmation', () => {
      const req = httpMock.expectOne('/api/notes/note-1');
      expect(req.request.method).toBe('GET');
      req.flush(mockNote);

      expect(component['note']()).toEqual(mockNote);
      expect(component['loading']()).toBe(false);
    });

    it('should set error when loading fails', () => {
      const req = httpMock.expectOne('/api/notes/note-1');
      req.flush({ error: 'Not found' }, { status: 404, statusText: 'Not Found' });

      expect(component['error']()).toBe('Unable to load note.');
      expect(component['loading']()).toBe(false);
    });

    it('should delete note and navigate to /notes on success', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');

      // Load the note first
      const loadReq = httpMock.expectOne('/api/notes/note-1');
      loadReq.flush(mockNote);

      (component as any).deleteNote();

      const deleteReq = httpMock.expectOne('/api/notes/note-1');
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush(null);

      expect(navigateSpy).toHaveBeenCalledWith(['/notes']);
      expect(component['deleting']()).toBe(false);
    });

    it('should set error when delete fails', () => {
      // Load the note first
      const loadReq = httpMock.expectOne('/api/notes/note-1');
      loadReq.flush(mockNote);

      (component as any).deleteNote();

      const deleteReq = httpMock.expectOne('/api/notes/note-1');
      deleteReq.flush({ error: 'Server error' }, { status: 500, statusText: 'Server Error' });

      expect(component['error']()).toBe('Unable to delete note.');
      expect(component['deleting']()).toBe(false);
    });
  });

  describe('with missing id', () => {
    it('should set error when id is missing', () => {
      setup(null);
      expect(component['error']()).toBe('Note id is missing.');
      expect(component['loading']()).toBe(false);
    });
  });
});