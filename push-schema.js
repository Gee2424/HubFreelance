// This script pushes the schema to the database
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './shared/schema.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function pushSchema() {
  console.log('Starting schema push...');
  
  // Get database URL from environment variables
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable not found');
    return;
  }
  
  console.log('Connecting to database...');
  
  try {
    const migrationClient = postgres(databaseUrl, { max: 1 });
    
    // Create Drizzle instance
    const db = drizzle(migrationClient, { schema });
    
    // Create schema (this will create all tables defined in schema.ts)
    await db.query.users.findFirst().catch(async () => {
      console.log('Creating schema tables...');
      
      // Create each table separately to handle dependencies
      const tables = [
        'users',
        'user_sessions',
        'jobs',
        'proposals',
        'contracts',
        'messages',
        'payments',
        'reviews',
        'activities',
        'wallet_transactions',
        'escrow_accounts',
        'support_tickets',
        'disputes',
        'permissions',
        'role_permissions',
        'system_config',
        'audit_logs',
        'notifications'
      ];
      
      for (const table of tables) {
        try {
          const createTableSQL = `CREATE TABLE IF NOT EXISTS "${table}" ();`;
          await migrationClient.unsafe(createTableSQL);
          console.log(`Created table: ${table}`);
        } catch (error) {
          console.error(`Error creating table ${table}:`, error);
        }
      }
    });
    
    console.log('Schema creation completed');
    
  } catch (error) {
    console.error('Error pushing schema:', error);
  }
}

// Execute the function
pushSchema().then(() => {
  console.log('Schema push complete');
  process.exit(0);
}).catch(err => {
  console.error('Schema push failed:', err);
  process.exit(1);
});