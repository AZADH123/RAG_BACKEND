// src/app.ts
import express from 'express';
import documentRoutes from './routes/document.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeBucket } from './services/s3.service.js';
import { initializeEmbeddingModel } from './services/embedding.service.js';

export async function createApp() {
  const app = express();

  // Middleware
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/documents', documentRoutes);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Initialize all services
 */
export async function initializeServices(): Promise<void> {
  console.log('Initializing services...');

  // Initialize MinIO bucket
  console.log('Initializing MinIO bucket...');
  await initializeBucket();

  // Initialize embedding model (loads model into memory)
  console.log('Initializing embedding model...');
  await initializeEmbeddingModel();

  console.log('All services initialized!');
}