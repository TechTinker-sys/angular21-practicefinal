import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NoteEdit } from './note-edit';
import { Note } from '../../models/note';

describe('NoteEdit', () => {
  let fixture: ComponentFixture<NoteEdit>;
  let component: NoteEdit;
  let httpMock: HttpTestingController;
  let router: Router;

  const mockNote: Note = {
    id: 'note-1',
    title: 'Existing note',
    content: 'Existing content',
    authorId: 'user-1',
    authorName: 'Admin',
    approved: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  function setup(id: string | null = 'note-1') {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [NoteEdit],
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

    fixture = TestBed.createComponent(NoteEdit);
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

    it('should load the note and populate the form', () => {
      const req = httpMock.expectOne('/api/notes/note-1');
      expect(req.request.method).toBe('GET');
      req.flush(mockNote);

      expect(component['note']()).toEqual(mockNote);
      expect(component['loading']()).toBe(false);
      expect(component['noteForm'].value).toEqual({
        title: 'Existing note',
        content: 'Existing content',
      });
    });

    it('should set error when loading fails', () => {
      const req = httpMock.expectOne('/api/notes/note-1');
      req.flush({ error: 'Not found' }, { status: 404, statusText: 'Not Found' });

      expect(component['error']()).toBe('Unable to load note.');
      expect(component['loading']()).toBe(false);
      expect(component['note']()).toBeNull();
    });

    it('should update note and navigate to /notes on success', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');

      // Load the note first
      const loadReq = httpMock.expectOne('/api/notes/note-1');
      loadReq.flush(mockNote);

      // Modify and submit
      component['noteForm'].setValue({ title: 'Updated title', content: 'Updated content' });
      (component as any).submitNote();

      const updateReq = httpMock.expectOne('/api/notes/note-1');
      expect(updateReq.request.method).toBe('PUT');
      expect(updateReq.request.body).toEqual({ title: 'Updated title', content: 'Updated content' });
      updateReq.flush({ ...mockNote, title: 'Updated title', content: 'Updated content' });

      expect(navigateSpy).toHaveBeenCalledWith(['/notes']);
      expect(component['submitting']()).toBe(false);
    });

    it('should set error when update fails', () => {
      // Load the note first
      const loadReq = httpMock.expectOne('/api/notes/note-1');
      loadReq.flush(mockNote);

      component['noteForm'].setValue({ title: 'Updated title', content: 'Updated content' });
      (component as any).submitNote();

      const updateReq = httpMock.expectOne('/api/notes/note-1');
      updateReq.flush({ error: 'Server error' }, { status: 500, statusText: 'Server Error' });

      expect(component['error']()).toBe('Unable to update note.');
      expect(component['submitting']()).toBe(false);
    });

    it('should set error when form is invalid', () => {
      const loadReq = httpMock.expectOne('/api/notes/note-1');
      loadReq.flush(mockNote);

      component['noteForm'].setValue({ title: '', content: '' });
      (component as any).submitNote();

      expect(component['error']()).toBe('Title and content are required.');
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