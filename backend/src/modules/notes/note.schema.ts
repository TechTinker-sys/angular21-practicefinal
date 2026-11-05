import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
});

export const updateNoteSchema = z
  .object({
    title: z.string().optional(),
    content: z.string().optional(),
  })
  .refine((input) => input.title !== undefined || input.content !== undefined, {
    message: 'title or content is required',
  });

export const paginationSchema = z.object({
  page: z.number().positive().optional(),
  limit: z.number().positive().optional(),
});

export interface NoteRecord {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotePage {
  notes: NoteRecord[];
  page: number;
  limit: number;
  total: number;
}
