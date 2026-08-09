// src/routes/document.routes.ts
import { Router } from 'express';
import {
  createDocument,
  getAllDocuments,
  getDocumentById,
  deleteDocument,
  searchSimilar,
  getQueueStatusHandler,
} from '../controllers/document.controller.js';

const router = Router();

// Document CRUD routes
router.post('/', createDocument);
router.get('/', getAllDocuments);
router.get('/queue/status', getQueueStatusHandler);
router.post('/search', searchSimilar);
router.get('/:id', getDocumentById);
router.delete('/:id', deleteDocument);

export default router;