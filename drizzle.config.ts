// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';
import process from 'node:process'; // Explicit import to fix the global namespace error

dotenv.config();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/document_db',
  },
});
