import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotesList } from './notes-list';
import { Note } from '../../models/note';
import { User } from '../../../auth/models/auth';

describe('NotesList', () => {
  let fixture: ComponentFixture<NotesList>;
  let component: NotesList;
  let httpMock: HttpTestingController;

  const mockNotes: Note[] = [
    {
      id: 'note-1',
      title: 'First note',
      content: 'First content',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'note-2',
      title: 'Second note',
      content: 'Second content',
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    },
  ];

  const mockAdmin: User = {
    id: 'user-1',
    name: 'Admin',
    email: 'admin@example.com',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const mockViewer: User = {
    id: 'user-2',
    name: 'Viewer',
    email: 'viewer@example.com',
    role: 'viewer',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  function setup(user: User | null = null) {
    TestBed.resetTestingModule();
    localStorage.clear();

    if (user) {
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('auth_user', JSON.stringify(user));
    }

    TestBed.configureTestingModule({
      imports: [NotesList],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    fixture = TestBed.createComponent(NotesList);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpMock?.verify();
    localStorage.clear();
  });

  it('should create the component', () => {
    setup(mockViewer);
    fixture.detectChanges();
    httpMock.expectOne('/api/notes?page=1&limit=5').flush({ notes: [], total: 0 });
    expect(component).toBeTruthy();
  });

  it('should load notes on init', () => {
    setup(mockViewer);
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/notes?page=1&limit=5');
    expect(req.request.method).toBe('GET');
    req.flush({ notes: mockNotes, total: 2, page: 1, limit: 5 });

    expect(component['notes']().length).toBe(2);
    expect(component['total']()).toBe(2);
    expect(component['loading']()).toBe(false);
  });

  it('should set error when loading notes fails', () => {
    setup(mockViewer);
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/notes?page=1&limit=5');
    req.flush({ error: 'Server error' }, { status: 500, statusText: 'Server Error' });

    expect(component['error']()).toBe('Unable to load notes.');
    expect(component['loading']()).toBe(false);
  });

  it('should navigate to next page', () => {
    setup(mockViewer);
    fixture.detectChanges();

    // Initial load
    const initialReq = httpMock.expectOne('/api/notes?page=1&limit=5');
    initialReq.flush({ notes: mockNotes, total: 10, page: 1, limit: 5 });

    (component as any).nextPage();

    const nextReq = httpMock.expectOne('/api/notes?page=2&limit=5');
    expect(nextReq.request.method).toBe('GET');
    nextReq.flush({ notes: mockNotes, total: 10, page: 2, limit: 5 });

    expect(component['page']()).toBe(2);
  });

  it('should not navigate past the last page', () => {
    setup(mockViewer);
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/notes?page=1&limit=5');
    req.flush({ notes: mockNotes, total: 2, page: 1, limit: 5 });

    (component as any).nextPage();
    // No additional HTTP request should be made
    httpMock.expectNone('/api/notes?page=2&limit=5');
    expect(component['page']()).toBe(1);
  });

  it('should navigate to previous page', () => {
    setup(mockViewer);
    fixture.detectChanges();

    // Initial load
    const initialReq = httpMock.expectOne('/api/notes?page=1&limit=5');
    initialReq.flush({ notes: mockNotes, total: 10, page: 1, limit: 5 });

    // Go to page 2
    (component as any).nextPage();
    const nextReq = httpMock.expectOne('/api/notes?page=2&limit=5');
    nextReq.flush({ notes: mockNotes, total: 10, page: 2, limit: 5 });

    // Go back to page 1
    (component as any).previousPage();
    const prevReq = httpMock.expectOne('/api/notes?page=1&limit=5');
    prevReq.flush({ notes: mockNotes, total: 10, page: 1, limit: 5 });

    expect(component['page']()).toBe(1);
  });

  it('should not navigate before the first page', () => {
    setup(mockViewer);
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/notes?page=1&limit=5');
    req.flush({ notes: mockNotes, total: 10, page: 1, limit: 5 });

    (component as any).previousPage();
    httpMock.expectNone('/api/notes?page=0&limit=5');
    expect(component['page']()).toBe(1);
  });

  it('should compute totalPages correctly', () => {
    setup(mockViewer);
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/notes?page=1&limit=5');
    req.flush({ notes: mockNotes, total: 12, page: 1, limit: 5 });

    expect(component['totalPages']()).toBe(3);
  });

  it('should show admin actions for admin users', () => {
    setup(mockAdmin);
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/notes?page=1&limit=5');
    req.flush({ notes: mockNotes, total: 2, page: 1, limit: 5 });

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('a[routerLink="/notes/new"]')).toBeTruthy();
  });

  it('should hide admin actions for viewer users', () => {
    setup(mockViewer);
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/notes?page=1&limit=5');
    req.flush({ notes: mockNotes, total: 2, page: 1, limit: 5 });

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('a[routerLink="/notes/new"]')).toBeFalsy();
  });
});