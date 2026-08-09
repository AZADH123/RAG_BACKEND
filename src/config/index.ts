export const config = {
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/document_db',
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  s3: {
    endPoint: process.env.S3_ENDPOINT || 'localhost',
    port: parseInt(process.env.S3_PORT || '9000'),
    accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY || 'minioadmin123',
    bucket: process.env.S3_BUCKET || 'documents',
    useSSL: false,
  },
  
  chunking: {
    chunkSize: parseInt(process.env.CHUNK_SIZE || '500'),
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '50'),
  },
  
  embedding: {
    modelName: 'Xenova/all-MiniLM-L6-v2',
    dimensions: 384,
  },
  
  queue: {
    documentQueue: 'document-processing',
  },
} as const;