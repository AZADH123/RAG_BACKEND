import { config } from '../config/index.js';

export interface Chunk {
  content: string;
  index: number;
  metadata: {
    startChar: number;
    endChar: number;
  };
}


export class RecursiveCharacterTextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];

  constructor(
    chunkSize: number = config.chunking.chunkSize,
    chunkOverlap: number = config.chunking.chunkOverlap
  ) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
    // Order of separators to try (most specific first)
    this.separators = ['\n\n', '\n', '. ', ' ', ''];
  }


  splitText(text: string): Chunk[] {
    const finalChunks: Chunk[] = this.splitRecursive(text, this.separators);
    
    // Add index to each chunk
    return finalChunks.map((chunk, index) => ({
      content: chunk.content,
      index,
      metadata: chunk.metadata,
    }));
  }

  /**
   * Recursively split text using separators
   */
  private splitRecursive(text: string, separators: string[]): Chunk[] {
    const finalChunks: Chunk[] = [];
    let currentOffset = 0;

    // Find a separator that actually splits the text
    let separator = separators[separators.length - 1];
    for (const sep of separators) {
      if (text.includes(sep)) {
        separator = sep;
        break;
      }
    }

    // Split by the chosen separator
    let splits: string[];
    if (separator === '') {
      // If no separator works, split by character
      splits = text.split('');
    } else {
      splits = text.split(separator);
    }

    // Merge splits into chunks of appropriate size
    let currentChunk = '';
    let chunkStartOffset = 0;

    for (const split of splits) {
      const newChunk = currentChunk ? currentChunk + separator + split : split;

      // If adding this split exceeds chunk size, save current chunk
      if (newChunk.length > this.chunkSize && currentChunk) {
        finalChunks.push({
          index: finalChunks.length,
          content: currentChunk.trim(),
          metadata: {
            startChar: chunkStartOffset,
            endChar: chunkStartOffset + currentChunk.length,
          },
        });

        // Start new chunk with overlap
        const overlapText = this.getOverlapText(currentChunk);
        currentChunk = overlapText ? overlapText + separator + split : split;
        chunkStartOffset = currentOffset - overlapText.length;
      } else if (newChunk.length > this.chunkSize && !currentChunk) {
        // Single split is larger than chunk size - need to split further
        if (separators.length > 1) {
          const subChunks = this.splitRecursive(split, separators.slice(1));
          for (const subChunk of subChunks) {
            finalChunks.push({
              index: finalChunks.length,
              content: subChunk.content,
              metadata: {
                startChar: currentOffset + subChunk.metadata.startChar,
                endChar: currentOffset + subChunk.metadata.endChar,
              },
            });
          }
          currentOffset += split.length + separator.length;
          currentChunk = '';
          chunkStartOffset = currentOffset;
        } else {
          // Can't split further, just add as is
          finalChunks.push({
            index: finalChunks.length,
            content: split.trim(),
            metadata: {
              startChar: currentOffset,
              endChar: currentOffset + split.length,
            },
          });
          currentOffset += split.length + separator.length;
          chunkStartOffset = currentOffset;
          currentChunk = '';
        }
      } else {
        currentChunk = newChunk;
      }

      currentOffset += split.length + separator.length;
    }

    // Don't forget the last chunk
    if (currentChunk.trim()) {
      finalChunks.push({
        index: finalChunks.length,
        content: currentChunk.trim(),
        metadata: {
          startChar: chunkStartOffset,
          endChar: chunkStartOffset + currentChunk.length,
        },
      });
    }

    return finalChunks;
  }

  /**
   * Get overlap text from the end of a chunk
   */
  private getOverlapText(chunk: string): string {
    if (this.chunkOverlap >= chunk.length) {
      return chunk;
    }
    return chunk.slice(-this.chunkOverlap);
  }
}

// Export a singleton instance
export const textSplitter = new RecursiveCharacterTextSplitter();