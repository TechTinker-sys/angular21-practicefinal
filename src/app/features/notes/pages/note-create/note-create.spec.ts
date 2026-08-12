import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NoteCreate } from './note-create';
import { Note } from '../../models/note';

describe('NoteCreate', () => {
  let fixture: ComponentFixture<NoteCreate>;
  let component: NoteCreate;
  let httpMock: HttpTestingController;
  let router: Router;

  const mockNote: Note = {
    id: 'note-1',
    title: 'New note',
    content: 'New content',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [NoteCreate],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    fixture = TestBed.createComponent(NoteCreate);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component['noteForm'].value).toEqual({ title: '', content: '' });
  });

  it('should set error when form is invalid', () => {
    (component as any).submitNote();

    expect(component['error']()).toBe('Title and content are required.');
    expect(component['submitting']()).toBe(false);
  });

  it('should create a note and navigate to /notes on success', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    component['noteForm'].setValue({ title: 'New note', content: 'New content' });
    (component as any).submitNote();

    const req = httpMock.expectOne('/api/notes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'New note', content: 'New content' });
    req.flush(mockNote);

    expect(navigateSpy).toHaveBeenCalledWith(['/notes']);
    expect(component['submitting']()).toBe(false);
  });

  it('should set error when create fails', () => {
    component['noteForm'].setValue({ title: 'New note', content: 'New content' });
    (component as any).submitNote();

    const req = httpMock.expectOne('/api/notes');
    req.flush({ error: 'Server error' }, { status: 500, statusText: 'Server Error' });

    expect(component['error']()).toBe('Unable to create note.');
    expect(component['submitting']()).toBe(false);
  });
});