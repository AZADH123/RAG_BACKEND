// src/index.ts
import { createApp, initializeServices } from './app.js';
import { closeDatabase } from './db/index.js';
import { startWorker } from './queue/document.worker.js';

const PORT = process.env.PORT || 3000;

async function main() {
  try {
    // Initialize services (S3, Embedding model)
    await initializeServices();

    // Create and start Express app
    const app = await createApp();
    
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 API endpoints:`);
      console.log(`   POST   /api/documents          - Create document`);
      console.log(`   GET    /api/documents          - List all documents`);
      console.log(`   GET    /api/documents/:id      - Get document with chunks`);
      console.log(`   DELETE /api/documents/:id      - Delete document`);
      console.log(`   POST   /api/documents/search   - Search similar content`);
      console.log(`   GET    /api/documents/queue/status - Queue status`);
      console.log(`\n`);
    });

    // Note: Worker runs in a separate process
    // Run with: npm run worker

  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
const shutdown = async () => {
  console.log('\nShutting down...');
  await closeDatabase();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main();