// src/services/embedding.service.ts
import { pipeline, Tensor } from '@xenova/transformers'; // FIX: Replaced EmbeddingOutput with Tensor
import { config } from '../config/index.js';

let embeddingPipeline: Awaited<ReturnType<typeof pipeline>> | null = null;

/**
 * Initialize the embedding model
 * Call this once at startup
 */
export async function initializeEmbeddingModel(): Promise<void> {
  if (embeddingPipeline) {
    return; // Already initialized
  }

  console.log(`Loading embedding model: ${config.embedding.modelName}...`);
  console.log('This may take a few minutes on first run (downloading model)...');

  embeddingPipeline = await pipeline(
    'feature-extraction',
    config.embedding.modelName,
    {
      quantized: true, // Use quantized model for faster inference
    }
  );

  console.log('Embedding model loaded successfully!');
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!embeddingPipeline) {
    throw new Error('Embedding model not initialized. Call initializeEmbeddingModel() first.');
  }

  // FIX: Typecast as Tensor instead of the non-existent EmbeddingOutput
   const output = (await embeddingPipeline(text, {
  pooling: 'mean',
  normalize: true,
} as any)) as Tensor;
  // Convert to array and ensure it's the right dimension
  const embedding = Array.from(output.data as Float32Array);
  
  if (embedding.length !== config.embedding.dimensions) {
    throw new Error(
      `Embedding dimension mismatch. Expected ${config.embedding.dimensions}, got ${embedding.length}`
    );
  }

  return embedding;
}

/**
 * Generate embeddings for multiple texts (batch processing)
 */
export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  // Process in batches to avoid memory issues
  const batchSize = 8;
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchEmbeddings = await Promise.all(
      batch.map((text) => generateEmbedding(text))
    );
    embeddings.push(...batchEmbeddings);
    
    console.log(`Processed ${Math.min(i + batchSize, texts.length)}/${texts.length} embeddings`);
  }

  return embeddings;
}

/**
 * Check if embedding model is ready
 */
export function isModelReady(): boolean {
  return embeddingPipeline !== null;
}
