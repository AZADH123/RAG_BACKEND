// src/validators/document.validator.ts
import { z } from 'zod';

// Schema for creating a document
export const createDocumentSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be less than 500 characters'),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(1000000, 'Content must be less than 1MB'),
});

// Schema for search query
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(1000, 'Query must be less than 1000 characters'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(5),
});

// Schema for document ID parameter
export const documentIdSchema = z.object({
  id: z.string().uuid('Invalid document ID format'),
});

// Infer types from schemas
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type DocumentIdInput = z.infer<typeof documentIdSchema>;