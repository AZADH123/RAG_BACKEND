// src/queue/document.worker.ts
import { Worker, Job } from 'bullmq';
import { config } from '../config/index.js';
import { processDocument } from '../services/document.service.js';
import { initializeEmbeddingModel } from '../services/embedding.service.js';
import IORedis from 'ioredis';
import { Redis } from 'ioredis';

// Create Redis connection for Worker
const connection = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
});

// Job data type
interface DocumentJobData {
  documentId: string;
}

/**
 * Process a single document job
 */
async function processJob(job: Job<DocumentJobData>): Promise<void> {
  const { documentId } = job.data;
  console.log(`Processing job ${job.id} for document ${documentId}`);

  // Process the document
  await processDocument(documentId);

  console.log(`Job ${job.id} completed successfully`);
}

/**
 * Start the worker
 */
async function startWorker(): Promise<void> {
  console.log('Initializing embedding model...');
  await initializeEmbeddingModel();

  console.log('Starting document processing worker...');

  const worker = new Worker<DocumentJobData>(
    config.queue.documentQueue,
    processJob,
    {
      connection,
      concurrency: 1, // Process one document at a time (embedding is CPU intensive)
    }
  );

  // Event listeners
  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  worker.on('ready', () => {
    console.log('Worker is ready to process jobs');
  });

  worker.on('closing', () => {
    console.log('Worker is closing...');
  });

  worker.on('closed', () => {
    console.log('Worker has closed');
  });

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down worker...');
    await worker.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  console.log('Worker started. Waiting for jobs...');
}

// Start the worker if this file is run directly
startWorker().catch(console.error);

export { startWorker };