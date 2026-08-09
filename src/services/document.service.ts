// src/services/document.service.ts
import { eq, desc, sql } from 'drizzle-orm'; // Added sql import
import { db } from '../db/index.js';
import { documents, documentChunks, type Document } from '../db/schema.js';
import { uploadDocument, downloadDocument, deleteDocument as deleteFromS3 } from './s3.service.js';
import { textSplitter, type Chunk } from './chunking.service.js';
import { generateEmbedding } from './embedding.service.js';

// Define the precise return structure for vector queries
// Define the precise return structure with a string index signature for Drizzle compatibility
type VectorSearchResult = {
  content: string;
  documentId: string;
  documentTitle: string;
  similarity: number;
  [key: string]: unknown; // FIX: This satisfies the Record<string, unknown> constraint
};

/**
 * Create a new document and upload to S3
 */
export async function createDocument(
  title: string,
  content: string
): Promise<Document> {
  const s3Key = await uploadDocument({ title, content });

  const [document] = await db
    .insert(documents)
    .values({
      title,
      s3Key,
      status: 'pending',
    })
    .returning();

  return document;
}

/**
 * Get all documents
 */
export async function getAllDocuments(): Promise<Document[]> {
  return db
    .select()
    .from(documents)
    .orderBy(desc(documents.createdAt));
}

/**
 * Get document by ID
 */
export async function getDocumentById(id: string): Promise<Document | undefined> {
  const [document] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);

  return document;
}

/**
 * Get document with its chunks
 */
export async function getDocumentWithChunks(id: string) {
  const document = await getDocumentById(id);
  if (!document) {
    return null;
  }

  const chunks = await db
    .select()
    .from(documentChunks)
    .where(eq(documentChunks.documentId, id))
    .orderBy(documentChunks.chunkIndex);

  return {
    ...document,
    chunks,
  };
}

/**
 * Process document: chunk, embed, and store
 * This is called by the worker
 */
export async function processDocument(documentId: string): Promise<void> {
  await db
    .update(documents)
    .set({ status: 'processing', updatedAt: new Date() })
    .where(eq(documents.id, documentId));

  try {
    const document = await getDocumentById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    const docContent = await downloadDocument(document.s3Key);

    console.log(`Splitting document "${document.title}" into chunks...`);
    const chunks: Chunk[] = await textSplitter.splitText(docContent.content);
    console.log(`Created ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);

      const embedding = await generateEmbedding(chunk.content);

      await db.insert(documentChunks).values({
        documentId,
        chunkIndex: chunk.index,
        content: chunk.content,
        embedding,
        metadata: {
          title: document.title,
          charStart: chunk.metadata.startChar,
          charEnd: chunk.metadata.endChar,
        },
      });
    }

    await db
      .update(documents)
      .set({
        status: 'completed',
        chunkCount: chunks.length,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));

    console.log(`Document "${document.title}" processed successfully!`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await db
      .update(documents)
      .set({
        status: 'failed',
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));

    console.error(`Failed to process document ${documentId}:`, error);
    throw error;
  }
}

/**
 * Delete document and all its chunks
 */
export async function deleteDocument(id: string): Promise<boolean> {
  const document = await getDocumentById(id);
  if (!document) {
    return false;
  }

  await deleteFromS3(document.s3Key);
  await db.delete(documents).where(eq(documents.id, id));

  return true;
}

/**
 * Search similar chunks using vector similarity
 */
export async function searchSimilar(
  query: string,
  limit: number = 5
): Promise<VectorSearchResult[]> {
  const queryEmbedding = await generateEmbedding(query);

  // Format array to safe postgres string representation '[0.12,0.45,-0.02,...]'
  const embeddingString = `[${queryEmbedding.join(',')}]`;

  // FIX: Wrapped in db.execute() and tagged with sql`...` template literal
  const response = await db.execute<VectorSearchResult>(sql`
    SELECT 
      dc.content,
      dc.document_id as "documentId",
      d.title as "documentTitle",
      (1 - (dc.embedding <=> ${embeddingString}::vector))::float as similarity
    FROM document_chunks dc
    JOIN documents d ON dc.document_id = d.id
    WHERE d.status = 'completed'
    ORDER BY dc.embedding <=> ${embeddingString}::vector
    LIMIT ${limit}
  `);

  return response.rows;
}
