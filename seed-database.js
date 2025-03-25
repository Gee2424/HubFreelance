import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Database connection
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = postgres(DATABASE_URL);

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Utility function to hash passwords
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Main seed function
async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    // Create test users
    console.log('Creating test users...');

    // Admin user
    const adminUser = {
      role: 'admin',
      email: 'admin@example.com',
      username: 'admin',
      password: hashPassword('password123'),
      full_name: 'Admin User',
      bio: 'Platform administrator with full access.',
      avatar: null,
      skills: null,
      hourly_rate: null,
      location: 'Remote',
      wallet_balance: 2000,
      permissions: { isAdmin: true },
      created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      last_login: null,
      active: true
    };

    // Client user
    const clientUser = {
      role: 'client',
      email: 'client@example.com',
      username: 'testclient',
      password: hashPassword('password123'),
      full_name: 'Test Client',
      bio: "I'm a client looking for freelancers for my projects.",
      avatar: null,
      skills: null,
      hourly_rate: null,
      location: 'New York, USA',
      wallet_balance: 1000,
      permissions: {},
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      last_login: null,
      active: true
    };

    // Freelancer user
    const freelancerUser = {
      role: 'freelancer',
      email: 'freelancer@example.com',
      username: 'testfreelancer',
      password: hashPassword('password123'),
      full_name: 'Test Freelancer',
      bio: 'Experienced developer specializing in full-stack development.',
      avatar: null,
      skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
      hourly_rate: 45,
      location: 'San Francisco, USA',
      wallet_balance: 500,
      permissions: {},
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      last_login: null,
      active: true
    };

    // Insert users to database
    const { error: adminError } = await sql`
      INSERT INTO users ${sql(adminUser)}
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;
    if (adminError) console.error('Error inserting admin user:', adminError);
    
    const { error: clientError } = await sql`
      INSERT INTO users ${sql(clientUser)}
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;
    if (clientError) console.error('Error inserting client user:', clientError);
    
    const { error: freelancerError } = await sql`
      INSERT INTO users ${sql(freelancerUser)}
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;
    if (freelancerError) console.error('Error inserting freelancer user:', freelancerError);

    // Retrieve client and freelancer IDs for future references
    const [clientUserData] = await sql`SELECT id FROM users WHERE email = ${clientUser.email}`;
    const [freelancerUserData] = await sql`SELECT id FROM users WHERE email = ${freelancerUser.email}`;
    
    if (clientUserData && freelancerUserData) {
      const clientId = clientUserData.id;
      const freelancerId = freelancerUserData.id;
      
      // Create jobs
      console.log('Creating test jobs...');
      
      const job1 = {
        title: 'Build a responsive e-commerce website',
        category: 'Web Development',
        description: 'Looking for an experienced developer to build a responsive e-commerce website with product catalog, shopping cart, and payment integration.',
        skills: ['JavaScript', 'React', 'CSS', 'Node.js'],
        hourly_rate: null,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        client_id: clientId,
        budget: 2500,
        status: 'open',
        deadline_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };
      
      const job2 = {
        title: 'Mobile App Development - Fitness Tracker',
        category: 'Mobile Development',
        description: 'Need a freelancer to build a fitness tracking mobile app with workout plans, progress tracking, and social features.',
        skills: ['React Native', 'Firebase', 'UI/UX Design'],
        hourly_rate: 40,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        client_id: clientId,
        budget: null,
        status: 'open',
        deadline_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
      };
      
      const { error: job1Error } = await sql`
        INSERT INTO jobs ${sql(job1)}
        RETURNING id
      `;
      if (job1Error) console.error('Error inserting job 1:', job1Error);
      
      const { error: job2Error } = await sql`
        INSERT INTO jobs ${sql(job2)}
        RETURNING id
      `;
      if (job2Error) console.error('Error inserting job 2:', job2Error);
      
      // Get job IDs
      const [job1Data] = await sql`SELECT id FROM jobs WHERE title = ${job1.title}`;
      
      if (job1Data) {
        const job1Id = job1Data.id;
        
        // Create a proposal
        console.log('Creating test proposal...');
        
        const proposal1 = {
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          status: 'pending',
          job_id: job1Id,
          freelancer_id: freelancerId,
          cover_letter: 'I have extensive experience building e-commerce websites and would love to work on your project. I can deliver a high-quality solution within your timeframe and budget.',
          bid_amount: 2200,
          estimated_duration: 21
        };
        
        const { error: proposalError } = await sql`
          INSERT INTO proposals ${sql(proposal1)}
          RETURNING id
        `;
        if (proposalError) console.error('Error inserting proposal:', proposalError);
        
        // Add some messages
        console.log('Creating test messages...');
        
        const message1 = {
          content: "Hi, I'm interested in your e-commerce website project. Do you have any specific design requirements?",
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          job_id: job1Id,
          sender_id: freelancerId,
          receiver_id: clientId,
          read: true
        };
        
        const message2 = {
          content: "Hello! Thanks for reaching out. I'm looking for a modern and clean design with an emphasis on product images. Our target audience is young professionals interested in sustainable fashion.",
          created_at: new Date(Date.now() - 6.9 * 24 * 60 * 60 * 1000),
          job_id: job1Id,
          sender_id: clientId,
          receiver_id: freelancerId,
          read: true
        };
        
        const { error: message1Error } = await sql`
          INSERT INTO messages ${sql(message1)}
        `;
        if (message1Error) console.error('Error inserting message 1:', message1Error);
        
        const { error: message2Error } = await sql`
          INSERT INTO messages ${sql(message2)}
        `;
        if (message2Error) console.error('Error inserting message 2:', message2Error);
      }
    }
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
  } finally {
    // Close database connection
    await sql.end();
  }
}

// Run the seed function
seedDatabase();