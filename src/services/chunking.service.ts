// src/services/text-splitter.service.ts
import { RecursiveCharacterTextSplitter as LangChainTextSplitter } from "@langchain/textsplitters";
import { config } from '../config/index.js';

export interface Chunk {
  content: string;
  index: number;
  metadata: {
    startChar: number;
    endChar: number;
  };
}

/**
 * Wrapper around LangChain's RecursiveCharacterTextSplitter
 * that maintains the same interface as the original implementation
 */
export class RecursiveCharacterTextSplitter {
  private splitter: LangChainTextSplitter;
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(
    chunkSize: number = config.chunking.chunkSize,
    chunkOverlap: number = config.chunking.chunkOverlap
  ) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
    
    // Initialize LangChain's splitter with the same configuration
    this.splitter = new LangChainTextSplitter({
      chunkSize: chunkSize,
      chunkOverlap: chunkOverlap,
      // Same separators as your original code
      separators: ['\n\n', '\n', '. ', ' ', ''],
    });
  }

  /**
   * Split text into chunks with metadata
   * Maintains the same interface as the original implementation
   */
  async splitText(text: string): Promise<Chunk[]> {
    // Use LangChain's splitText method
    const chunks = await this.splitter.splitText(text);
    
    // Reconstruct the character positions
    let currentPosition = 0;
    const result: Chunk[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const content = chunks[i];
      
      // For overlap, adjust the start position
      const startChar = i === 0 ? 0 : Math.max(0, currentPosition - this.chunkOverlap);
      const endChar = startChar + content.length;
      
      result.push({
        content,
        index: i,
        metadata: {
          startChar,
          endChar,
        },
      });
      
      // Update position for next chunk
      currentPosition = endChar - this.chunkOverlap;
    }
    
    return result;
  }

  /**
   * Get overlap text from the end of a chunk (for compatibility)
   */
  private getOverlapText(chunk: string): string {
    if (this.chunkOverlap >= chunk.length) {
      return chunk;
    }
    return chunk.slice(-this.chunkOverlap);
  }
}

// Export a singleton instance (same as before)
export const textSplitter = new RecursiveCharacterTextSplitter();