// This script will seed the database with test users for all roles
import { createHash } from 'crypto';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Hash password using SHA-256
function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

// Main function to seed users
async function seedUsers() {
  try {
    console.log('Starting user seeding process...');
    
    // Get database URL from environment variables
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('DATABASE_URL environment variable not found');
      return;
    }
    
    console.log('Connecting to database...');
    const sql = postgres(databaseUrl, { 
      connect_timeout: 10,
      idle_timeout: 30,
      max: 10
    });
    
    // Create Drizzle ORM client
    const db = drizzle(sql);
    
    // Define the test users for each role
    const testUsers = [
      {
        email: 'client@example.com',
        username: 'testclient',
        password: hashPassword('password123'),
        fullName: 'Test Client',
        role: 'client',
        bio: 'A business owner looking for talented freelancers.',
        avatar: null,
        skills: [],
        hourlyRate: null,
        location: 'New York, USA',
        walletBalance: 1000,
        permissions: {},
        active: true
      },
      {
        email: 'freelancer@example.com',
        username: 'testfreelancer',
        password: hashPassword('password123'),
        fullName: 'Test Freelancer',
        role: 'freelancer',
        bio: 'Experienced developer specializing in full-stack development.',
        avatar: null,
        skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
        hourlyRate: 45,
        location: 'San Francisco, USA',
        walletBalance: 500,
        permissions: {},
        active: true
      },
      {
        email: 'admin@example.com',
        username: 'admin',
        password: hashPassword('password123'),
        fullName: 'Admin User',
        role: 'admin',
        bio: 'Platform administrator with full access.',
        avatar: null,
        skills: null,
        hourlyRate: null,
        location: 'Remote',
        walletBalance: 2000,
        permissions: { isAdmin: true },
        active: true
      },
      {
        email: 'support@example.com',
        username: 'support',
        password: hashPassword('password123'),
        fullName: 'Support Agent',
        role: 'support',
        bio: 'Customer support specialist.',
        avatar: null,
        skills: null,
        hourlyRate: null,
        location: 'Remote',
        walletBalance: 0,
        permissions: {},
        active: true
      },
      {
        email: 'qa@example.com',
        username: 'qa',
        password: hashPassword('password123'),
        fullName: 'QA Specialist',
        role: 'qa',
        bio: 'Quality assurance and content reviewer.',
        avatar: null,
        skills: null,
        hourlyRate: null,
        location: 'Remote',
        walletBalance: 0,
        permissions: {},
        active: true
      }
    ];
    
    // Check if users already exist to avoid duplicates
    for (const user of testUsers) {
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, user.email)
      });
      
      if (existingUser) {
        console.log(`User ${user.email} already exists, skipping...`);
        continue;
      }
      
      // Insert user into database
      try {
        await db.insert(users).values(user);
        console.log(`Created ${user.role} user: ${user.email}`);
      } catch (error) {
        console.error(`Error creating ${user.role} user:`, error);
      }
    }
    
    console.log('User seeding completed successfully');
  } catch (error) {
    console.error('Error seeding users:', error);
  }
}

// Run the seed function
seedUsers();