import { SupabaseStorage } from './supabaseStorage.js';
import { InsertMessage } from '../shared/schema.js';
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
 * Seeds the Supabase database with starter messages between clients and freelancers
 */
async function seedMessagesData() {
  try {
    console.log('Starting messages data seeding...');
    
    // Load environment variables first
    loadEnvironmentVariables();
    
    // Create a storage instance for database operations
    const storage = new SupabaseStorage();
    
    // Get users
    const clientUser = await storage.getUserByEmail('client@example.com');
    const freelancerUser = await storage.getUserByEmail('freelancer@example.com');
    
    if (!clientUser || !freelancerUser) {
      console.error('Client or freelancer user not found. Make sure to run seedSupabase.ts first.');
      return;
    }
    
    console.log(`Found client user with ID ${clientUser.id} and freelancer user with ID ${freelancerUser.id}`);
    
    // Get the first job (we'll associate messages with it)
    const jobs = await storage.getJobsByClient(clientUser.id);
    if (!jobs || jobs.length === 0) {
      console.error('No jobs found for the client. Make sure to run seedJobs.ts first.');
      return;
    }
    
    const job = jobs[0]; // First job
    console.log(`Found job with ID ${job.id}: ${job.title}`);
    
    // Create messages between client and freelancer
    const testMessages = [
      // Initial conversation about web development project
      {
        senderId: freelancerUser.id,
        receiverId: clientUser.id,
        content: "Hi there! I saw your job posting for the React Developer position and I'm very interested. I have 4+ years of experience with React and have built several e-commerce platforms.",
        jobId: job.id,
        read: true,
        created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      {
        senderId: clientUser.id,
        receiverId: freelancerUser.id,
        content: "Hello! Thanks for reaching out. I'm looking for someone who can start right away. What's your availability like?",
        jobId: job.id,
        read: true,
        created: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
      },
      {
        senderId: freelancerUser.id,
        receiverId: clientUser.id,
        content: "I'm available to start immediately and can commit 30-40 hours per week to your project. Would you like to see some examples of my previous e-commerce work?",
        jobId: job.id,
        read: true,
        created: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
      },
      {
        senderId: clientUser.id,
        receiverId: freelancerUser.id,
        content: "That would be great! Please share your portfolio and also let me know your thoughts on implementing a wishlist and cart feature that syncs across devices.",
        jobId: job.id,
        read: true,
        created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        senderId: freelancerUser.id,
        receiverId: clientUser.id,
        content: "Here's my portfolio: https://devportfolio.example.com. For the synced wishlist and cart, I'd recommend using Redux with localStorage and a backend database. We could also implement a real-time sync with WebSockets for instant updates across tabs/devices.",
        jobId: job.id,
        read: true,
        created: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
      },
      {
        senderId: clientUser.id,
        receiverId: freelancerUser.id,
        content: "I like your approach. What payment gateway would you recommend for an international audience? We need to support multiple currencies and have low transaction fees.",
        jobId: job.id,
        read: true,
        created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        senderId: freelancerUser.id,
        receiverId: clientUser.id,
        content: "Stripe is my top recommendation - they support 135+ currencies, have great developer docs, and reasonable fees. I've integrated it with multiple e-commerce sites and the checkout process is smooth. Alternatively, PayPal and Adyen are also good options depending on your specific needs.",
        jobId: job.id,
        read: true,
        created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        senderId: clientUser.id,
        receiverId: freelancerUser.id,
        content: "Perfect. I'd like to move forward with you on this project. Can you prepare a detailed proposal with timeline and cost breakdown based on our requirements?",
        jobId: job.id,
        read: true,
        created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        senderId: freelancerUser.id,
        receiverId: clientUser.id,
        content: "Absolutely! I'll work on the proposal today and have it to you by tomorrow. I'm excited about the opportunity to work together on this project.",
        jobId: job.id,
        read: false, // Unread message
        created: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      },
      {
        senderId: freelancerUser.id,
        receiverId: clientUser.id,
        content: "I've completed the proposal and just sent it to your email. It includes a detailed timeline, cost structure, and implementation approach. Let me know if you have any questions or would like to discuss any aspect in more detail!",
        jobId: job.id,
        read: false, // Unread message
        created: new Date() // Just now
      }
    ];
    
    // Create messages in Supabase
    console.log('Creating test messages...');
    
    for (const [index, messageData] of testMessages.entries()) {
      try {
        // The InsertMessage type doesn't have read or created fields
        // so we need to create a partial object for creation
        const insertMessage: InsertMessage = {
          senderId: messageData.senderId,
          receiverId: messageData.receiverId,
          content: messageData.content,
          jobId: messageData.jobId
        };
        
        const message = await storage.createMessage(insertMessage);
        
        // If this message should be marked as read, do so
        if (messageData.read) {
          await storage.markMessageAsRead(message.id);
        }
        
        console.log(`Created message ${index + 1}/${testMessages.length}`);
      } catch (error) {
        console.error(`Error creating message ${index + 1}:`, error);
      }
    }
    
    console.log('Message seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding message data:', error);
    throw error;
  }
}

// Export for importing elsewhere
export { seedMessagesData };

// Auto-run when loaded as main module
if (import.meta.url === `file://${process.argv[1]}`) {
  seedMessagesData().catch(console.error);
}