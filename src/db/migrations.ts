import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './index.js';

export async function runMigrations(): Promise<void> {
  console.log('⏳ Initiating database migrations...');

  try {
    console.log(' Tracking changes inside the local ./drizzle/ directory...');
    
    await migrate(db as any, { migrationsFolder: './drizzle'  });

    console.log('Migrations applied successfully!');
  } catch (error) {
    console.error(' Migration execution sequence failed:', error);
    throw error;
  }
}
runMigrations()
  .then(() => {
    console.log(' Process finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error(' Process crashed:', err);
    process.exit(1);
  });
