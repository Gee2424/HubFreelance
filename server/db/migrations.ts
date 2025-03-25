
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../../shared/schema';

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in environment variables');
    return;
  }

  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(sql);

  try {
    console.log('Creating database tables...');
    // Create tables in order due to foreign key dependencies
    await db.execute(sql`CREATE TABLE IF NOT EXISTS users ${schema.users}`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS jobs ${schema.jobs}`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS proposals ${schema.proposals}`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS contracts ${schema.contracts}`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS messages ${schema.messages}`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS payments ${schema.payments}`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS reviews ${schema.reviews}`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS activities ${schema.activities}`);
    
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Migration error:', error);
  }
  
  await sql.end();
}

runMigrations();
