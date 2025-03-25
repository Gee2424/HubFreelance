import { SupabaseStorage } from './supabaseStorage.js';
import { InsertUser, users } from '../shared/schema.js';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { seedJobsData } from './seedJobs.js';
import { seedMessagesData } from './seedMessages.js';

/**
 * Loads environment variables from the .env file or sets defaults
 */
function loadEnvironmentVariables() {
  try {
    // Load from .env file
    const envPath = path.resolve('/home/runner/workspace/.env');
    console.log('Attempting to load environment variables from:', envPath);
    
    try {
      const envContent = readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      
      for (const line of envLines) {
        if (line.trim() && !line.startsWith('#')) {
          const [key, value] = line.split('=');
          if (key && value) {
            process.env[key.trim()] = value.trim();
          }
        }
      }
      console.log('Loaded environment variables from file');
    } catch (readError) {
      console.warn('Error reading .env file:', readError.message);
    }
    
    // Set required Supabase environment variables if not defined
    if (!process.env.SUPABASE_URL) {
      process.env.SUPABASE_URL = 'https://dzpaupkksrrvbuxtraal.supabase.co';
      console.log('Set SUPABASE_URL manually');
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6cGF1cGtrc3JydmJ1eHRyYWFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODYzMjQ3NywiZXhwIjoyMDI0MjA4NDc3fQ.bzXOYw_PI09Pd9FnQeQ1fG28UyNy4XYDxxYmgqYrjAM';
      console.log('Set SUPABASE_SERVICE_ROLE_KEY manually');
    }
    
    if (!process.env.SUPABASE_ANON_KEY) {
      process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6cGF1cGtrc3JydmJ1eHRyYWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MzIwNzQsImV4cCI6MjA1ODMwODA3NH0.PnqZ_4sLveIngGoH7ar4e0izBUTyqIrucJYchuRO4d8';
      console.log('Set SUPABASE_ANON_KEY manually');
    }

    // Check for DATABASE_URL
    if (!process.env.DATABASE_URL) {
      try {
        const dbUrlFromEnv = execSync('echo $DATABASE_URL').toString().trim();
        if (dbUrlFromEnv) {
          process.env.DATABASE_URL = dbUrlFromEnv;
          console.log('Set DATABASE_URL from environment');
        } else {
          // Attempt to construct from PGUSER, PGPASSWORD, etc.
          const pgHost = process.env.PGHOST;
          const pgPort = process.env.PGPORT;
          const pgUser = process.env.PGUSER;
          const pgPassword = process.env.PGPASSWORD;
          const pgDatabase = process.env.PGDATABASE;
          
          if (pgHost && pgPort && pgUser && pgPassword && pgDatabase) {
            process.env.DATABASE_URL = `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}`;
            console.log('Constructed DATABASE_URL from PG* variables');
          } else {
            // Use a fallback
            process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/postgres';
            console.log('Using fallback DATABASE_URL');
          }
        }
      } catch (execError) {
        console.warn('Error executing command to get DATABASE_URL:', execError.message);
        // Set a fallback
        process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/postgres';
        console.log('Using fallback DATABASE_URL after error');
      }
    }
    
    // Log status after setting all variables
    console.log('Environment variables status:');
    console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? 'SET' : 'MISSING'}`);
    console.log(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING'}`);
    console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'}`);
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'MISSING'}`);
    
  } catch (error) {
    console.error('Error in loadEnvironmentVariables:', error);
  }
}

/**
 * Seeds the Supabase database with initial test data
 */
async function seedSupabaseData() {
  try {
    console.log('Starting Supabase data seeding...');
    
    // Load environment variables first
    loadEnvironmentVariables();
    
    // Create a storage instance for database operations
    const storage = new SupabaseStorage();
    
    // Create a direct Supabase client for auth operations
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials for seeding data');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create test users both in auth and database
    console.log('Creating test users...');

    const testUsers = [
      {
        email: 'client@example.com',
        username: 'testclient',
        password: 'password123',
        fullName: 'Test Client',
        role: 'client',
        bio: 'I need talented freelancers for my projects',
        avatar: 'https://i.pravatar.cc/150?u=client',
        skills: ['business', 'marketing'],
        hourlyRate: null,
        location: 'New York, USA'
      },
      {
        email: 'freelancer@example.com',
        username: 'freelanceruser',
        password: 'password123',
        fullName: 'Test Freelancer',
        role: 'freelancer',
        bio: 'Experienced web developer',
        avatar: 'https://i.pravatar.cc/150?u=freelancer',
        skills: ['react', 'nodejs', 'typescript'],
        hourlyRate: 50,
        location: 'San Francisco, USA'
      },
      {
        email: 'admin@example.com',
        username: 'adminuser',
        password: 'password123',
        fullName: 'Admin User',
        role: 'admin',
        bio: 'Platform administrator',
        avatar: 'https://i.pravatar.cc/150?u=admin',
        skills: ['management'],
        hourlyRate: null,
        location: 'Chicago, USA'
      },
      {
        email: 'qa@example.com',
        username: 'qauser', 
        password: 'password123',
        fullName: 'QA Specialist',
        role: 'qa',
        bio: 'Quality assurance specialist',
        avatar: 'https://i.pravatar.cc/150?u=qa',
        skills: ['testing'],
        hourlyRate: null,
        location: 'Remote'
      },
      {
        email: 'support@example.com',
        username: 'supportuser',
        password: 'password123',
        fullName: 'Support Agent',
        role: 'support',
        bio: 'Customer support specialist',
        avatar: 'https://i.pravatar.cc/150?u=support',
        skills: ['customer service'],
        hourlyRate: null,
        location: 'Remote'
      }
    ];

    for (const userData of testUsers) {
      try {
        // Try to create auth user in Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              role: userData.role,
              username: userData.username,
              full_name: userData.fullName
            }
          }
        });

        if (authError && authError.message !== 'User already registered') {
          throw authError;
        }
        
        // Check if user already exists in our database
        const existingUser = await storage.getUserByEmail(userData.email);
        
        if (existingUser) {
          console.log(`User ${userData.email} already exists in database, skipping insert`);
        } else {
          try {
            // Insert directly into the database instead of using storage.createUser()
            // This avoids a second Supabase Auth signup attempt for users that already exist
            const queryClient = postgres(process.env.DATABASE_URL || '');
            const db = drizzle(queryClient);
            
            const result = await db.insert(users).values({
              email: userData.email,
              username: userData.username,
              password: userData.password, // In a real app, this would be hashed
              fullName: userData.fullName,
              bio: userData.bio,
              avatar: userData.avatar,
              role: userData.role as "client" | "freelancer" | "admin" | "qa" | "support",
              skills: userData.skills,
              hourlyRate: userData.hourlyRate,
              location: userData.location
            }).returning();
            
            console.log(`Created database user ${userData.email} with ID ${result[0].id}`);
          } catch (dbError) {
            console.error(`Error inserting user ${userData.email} into database:`, dbError);
          }
        }
      } catch (error) {
        console.error(`Error processing user ${userData.email}:`, error);
      }
    }

    // After users are created, seed jobs and messages
    try {
      console.log('Seeding jobs data...');
      await seedJobsData();
    } catch (jobError) {
      console.error('Error seeding jobs:', jobError);
    }

    try {
      console.log('Seeding messages data...');
      await seedMessagesData();
    } catch (messageError) {
      console.error('Error seeding messages:', messageError);
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
}

// Export for importing elsewhere
export { seedSupabaseData };

// Auto-run when loaded as main module
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSupabaseData().catch(console.error);
}