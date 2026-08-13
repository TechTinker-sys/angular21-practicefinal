export interface Note {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  approved: boolean;
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