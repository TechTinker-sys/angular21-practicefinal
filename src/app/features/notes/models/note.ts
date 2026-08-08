export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotesResponse {
  notes: Note[];
  total: number;
  page?: number;
  limit?: number;
}

export interface NoteInput {
  title: string;
  content: string;
}