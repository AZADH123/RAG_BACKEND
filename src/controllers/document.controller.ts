// src/controllers/document.controller.ts
import { Request, Response, NextFunction } from 'express';
import { createDocumentSchema, searchSchema, documentIdSchema } from '../validators/document.validator.js';
import * as documentService from '../services/document.service.js';
import { addDocumentJob, getQueueStatus } from '../queue/document.queue.js';

/**
 * Create a new document
 * POST /api/documents
 */
export async function createDocument(req: Request,res: Response,next: NextFunction): Promise<void> {
  try {
    const data = createDocumentSchema.parse(req.body);

    const document = await documentService.createDocument(data.title, data.content);

    // Add processing job to queue
    await addDocumentJob(document.id);

    res.status(201).json({
      success: true,
      data: document,
      message: 'Document created and queued for processing',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all documents
 * GET /api/documents
 */
export async function getAllDocuments(req: Request,res: Response,next: NextFunction): Promise<void> {
  try {
    const documents = await documentService.getAllDocuments();

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get document by ID
 * GET /api/documents/:id
 */
export async function getDocumentById(req: Request,res: Response,next: NextFunction): Promise<void> {
  try {
    // Validate params
    const { id } = documentIdSchema.parse({ id: req.params.id });

    const documentWithChunks = await documentService.getDocumentWithChunks(id);

    if (!documentWithChunks) {
      res.status(404).json({
        success: false,
        message: 'Document not found',
      });
      return;
    }

    res.json({
      success: true,
      data: documentWithChunks,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete document
 * DELETE /api/documents/:id
 */
export async function deleteDocument(req: Request,res: Response,next: NextFunction): Promise<void> {
  try {
    const { id } = documentIdSchema.parse({ id: req.params.id });

    const deleted = await documentService.deleteDocument(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Document not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Search similar content
 * POST /api/documents/search
 */
export async function searchSimilar(req: Request,res: Response,next: NextFunction): Promise<void> {
  try {
    const data = searchSchema.parse(req.body);

    const results = await documentService.searchSimilar(data.query, data.limit);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
}
/**
 * Get queue status
 * GET /api/documents/queue/status
 */
export async function getQueueStatusHandler(req: Request,res: Response,next: NextFunction
): Promise<void> {
  try {
    const status = await getQueueStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
}