import { SupabaseStorage } from './supabaseStorage.js';
import { InsertJob } from '../shared/schema.js';
import { readFileSync } from 'fs';
import path from 'path';

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
    } catch (readError: any) {
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
 * Seeds the Supabase database with initial test jobs
 */
async function seedJobsData() {
  try {
    console.log('Starting job data seeding...');
    
    // Load environment variables first
    loadEnvironmentVariables();
    
    // Create a storage instance for database operations
    const storage = new SupabaseStorage();
    
    // Create test jobs
    console.log('Creating test jobs...');

    const testJobs = [
      {
        title: "React Developer Needed for E-commerce Project",
        description: "Looking for an experienced React developer to build a modern e-commerce platform. The project requires expertise in React, Redux, and payment gateway integration.",
        category: "Web Development",
        skills: ["react", "redux", "javascript", "payment-processing"],
        budget: 5000,
        hourlyRate: null,
        deadlineDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      {
        title: "Mobile App Developer for iOS and Android",
        description: "Need a mobile app developer who can create a cross-platform app for both iOS and Android. The app will be for a fitness tracking service with social features.",
        category: "Mobile Development",
        skills: ["react-native", "ios", "android", "mobile"],
        budget: 8000,
        hourlyRate: null,
        deadlineDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // 45 days from now
      },
      {
        title: "Data Scientist for Machine Learning Project",
        description: "Seeking a data scientist to develop and implement machine learning models for a recommendation engine. Experience with Python, TensorFlow, and data analysis required.",
        category: "Data Science",
        skills: ["python", "machine-learning", "tensorflow", "data-analysis"],
        budget: 7500,
        hourlyRate: null,
        deadlineDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
      },
      {
        title: "UI/UX Designer for Website Redesign",
        description: "Looking for a talented UI/UX designer to redesign a corporate website. Need someone who can create modern, responsive designs with a focus on user experience.",
        category: "Design",
        skills: ["ui-design", "ux-design", "figma", "responsive-design"],
        budget: 3000,
        hourlyRate: null,
        deadlineDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) // 21 days from now
      },
      {
        title: "Backend Developer for API Development",
        description: "Seeking a backend developer to create RESTful APIs for a SaaS application. Must be proficient in Node.js, Express, and database design.",
        category: "Backend Development",
        skills: ["nodejs", "express", "api-development", "database-design"],
        budget: 4500,
        hourlyRate: null,
        deadlineDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000) // 40 days from now
      }
    ];

    // Get the client user ID (assuming ID 1 is the client from our seed data)
    const clientId = 1;
    const client = await storage.getUser(clientId);
    
    if (!client || client.role !== 'client') {
      console.error('Client user not found or not a client. Make sure to run seedSupabase.ts first.');
      return;
    }

    // Create jobs
    for (const jobData of testJobs) {
      try {
        const job = await storage.createJob(jobData as InsertJob, clientId);
        console.log(`Created job: ${job.title} with ID ${job.id}`);
      } catch (error) {
        console.error(`Error creating job ${jobData.title}:`, error);
      }
    }

    console.log('Job seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding job data:', error);
    throw error;
  }
}

// Export for importing elsewhere
export { seedJobsData };

// Auto-run when loaded as main module
if (import.meta.url === `file://${process.argv[1]}`) {
  seedJobsData().catch(console.error);
}