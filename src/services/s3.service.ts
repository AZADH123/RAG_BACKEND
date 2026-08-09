// src/services/s3.service.ts
import { Client } from 'minio';
import { config } from '../config/index.js';
import { v4 as uuidv4 } from 'uuid';

// Initialize MinIO client
const minioClient = new Client({
  endPoint: config.s3.endPoint,
  port: config.s3.port,
  accessKey: config.s3.accessKey,
  secretKey: config.s3.secretKey,
  useSSL: config.s3.useSSL,
});

const BUCKET_NAME = config.s3.bucket;

// Initialize bucket (create if not exists)
export async function initializeBucket(): Promise<void> {
  const exists = await minioClient.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
    console.log(`Bucket '${BUCKET_NAME}' created successfully`);
  }
}

// Upload document JSON to MinIO
export async function uploadDocument(
  document: { title: string; content: string }
): Promise<string> {
  const key = `documents/${uuidv4()}.json`;
  const content = JSON.stringify(document, null, 2);
  
  await minioClient.putObject(
    BUCKET_NAME,
    key,
    content,
    { 'Content-Type': 'application/json' }
  );
  
  return key;
}

// Download document from MinIO
export async function downloadDocument(key: string): Promise<{ title: string; content: string }> {
  return new Promise((resolve, reject) => {
    let data = '';
    
    minioClient.getObject(BUCKET_NAME, key, (err, stream) => {
      if (err) {
        reject(new Error(`Failed to download document: ${err.message}`));
        return;
      }
      
      stream?.on('data', (chunk) => {
        data += chunk.toString();
      });
      
      stream?.on('end', () => {
        try {
          const document = JSON.parse(data);
          resolve(document);
        } catch (parseError) {
          reject(new Error('Failed to parse document JSON'));
        }
      });
      
      stream?.on('error', (error) => {
        reject(new Error(`Stream error: ${error.message}`));
      });
    });
  });
}

// Delete document from MinIO
export async function deleteDocument(key: string): Promise<void> {
  await minioClient.removeObject(BUCKET_NAME, key);
}

export { minioClient, BUCKET_NAME };