
import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Get database configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// For client-side, we don't need to directly access the database
// We'll use the API endpoints, but Drizzle may be useful for types
let supabase: any;
let queryClient: any;
let db: any;

try {
  // Initialize Supabase client if credentials are available
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized');
  } else {
    console.warn('Supabase credentials not found, some functionality may be limited');
    // Create a minimal client that won't throw errors
    supabase = {
      auth: { 
        signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        signIn: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      },
      from: () => ({ 
        select: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) 
      })
    };
  }

  // Initialize Drizzle if needed
  // This is mostly for type definitions as we won't directly query the DB from the client
  const databaseUrl = import.meta.env.VITE_DATABASE_URL;
  if (databaseUrl) {
    queryClient = postgres(databaseUrl);
    db = drizzle(queryClient);
  }
} catch (error) {
  console.error('Error initializing database connections:', error);
}

export { supabase, db };
