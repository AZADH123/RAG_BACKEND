// src/queue/document.queue.ts
import { Queue } from 'bullmq';
import { config } from '../config/index.js';
import IORedis from 'ioredis';

// Create Redis connection for Queue
const connection = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null, // Required for BullMQ
});

// Create the document processing queue
export const documentQueue = new Queue(config.queue.documentQueue, {
  connection,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5 second delay, then exponential
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs
    },
  },
});

/**
 * Add a document processing job to the queue
 */
export async function addDocumentJob(documentId: string): Promise<string> {
  const job = await documentQueue.add(
    'process-document',
    { documentId },
    {
      jobId: `doc-${documentId}`, // Prevent duplicate jobs for same document
    }
  );
  
  console.log(`Added job ${job.id} for document ${documentId}`);
  return job.id || '';
}

/**
 * Get queue status
 */
export async function getQueueStatus() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    documentQueue.getWaitingCount(),
    documentQueue.getActiveCount(),
    documentQueue.getCompletedCount(),
    documentQueue.getFailedCount(),
    documentQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
  };
}

export { connection };