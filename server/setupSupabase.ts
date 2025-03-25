import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { seedSupabaseData } from './seedSupabase';

// Load environment variables
dotenv.config();

/**
 * Sets up Supabase credentials in the .env file
 * @param supabaseUrl The Supabase project URL
 * @param supabaseAnonKey The Supabase anonymous key
 * @param supabaseServiceKey The Supabase service role key
 * @returns A confirmation message
 */
export async function setupSupabaseCredentials(
  supabaseUrl: string,
  supabaseAnonKey: string,
  supabaseServiceKey: string
): Promise<string> {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    
    // Read existing .env file
    let envContent = '';
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch (error) {
      console.warn('No existing .env file found, creating a new one.');
    }
    
    // Update the Supabase credentials in the environment content
    const envLines = envContent.split('\n');
    const updatedLines = envLines.map(line => {
      if (line.startsWith('SUPABASE_URL=')) {
        return `SUPABASE_URL=${supabaseUrl}`;
      }
      if (line.startsWith('SUPABASE_ANON_KEY=')) {
        return `SUPABASE_ANON_KEY=${supabaseAnonKey}`;
      }
      if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
        return `SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}`;
      }
      if (line.startsWith('VITE_SUPABASE_URL=')) {
        return `VITE_SUPABASE_URL=${supabaseUrl}`;
      }
      if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
        return `VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}`;
      }
      return line;
    });
    
    // Write the updated content back to the .env file
    fs.writeFileSync(envPath, updatedLines.join('\n'));
    
    // Set environment variables for the current process
    process.env.SUPABASE_URL = supabaseUrl;
    process.env.SUPABASE_ANON_KEY = supabaseAnonKey;
    process.env.SUPABASE_SERVICE_ROLE_KEY = supabaseServiceKey;
    process.env.VITE_SUPABASE_URL = supabaseUrl;
    process.env.VITE_SUPABASE_ANON_KEY = supabaseAnonKey;
    
    // Seed test data in Supabase
    try {
      await seedSupabaseData();
      return 'Supabase credentials configured successfully and test data seeded.';
    } catch (seedError) {
      console.error('Error seeding data:', seedError);
      return 'Supabase credentials configured successfully, but there was an error seeding test data.';
    }
  } catch (error) {
    console.error('Error setting up Supabase credentials:', error);
    throw new Error('Failed to configure Supabase credentials: ' + (error instanceof Error ? error.message : String(error)));
  }
}