// src/db/schema.ts
import { pgTable, uuid, varchar, text, timestamp, vector, jsonb, integer, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enum for document status
export const documentStatusEnum = pgEnum('document_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);

// Documents table - stores metadata
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  status: documentStatusEnum('status').default('pending').notNull(),
  s3Key: varchar('s3_key').notNull(), // Key to fetch document from MinIO
  chunkCount: integer('chunk_count').default(0),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Document chunks table - stores chunks and embeddings
export const documentChunks = pgTable('document_chunks', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  chunkIndex: integer('chunk_index').notNull(), // Order of chunk in document
  content: text('content').notNull(), // The actual chunk text
  embedding: vector('embedding', { dimensions: 384 }), // pgvector embedding
  metadata: jsonb('metadata'), // Additional metadata (page number, etc.)
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Types
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;