/**
 * This script sets up Supabase with initial test data
 * Run this script with: node setup-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file');
  process.exit(1);
}

// Initialize Supabase client with service role key (admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to hash a password (matching the hash used in authService.ts)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Create the database schema in Supabase
 */
async function createSchema() {
  console.log('Creating database schema...');
  
  try {
    // Create users table
    const { error: usersError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'users',
      schema: `
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        fullName TEXT,
        role TEXT NOT NULL DEFAULT 'freelancer',
        bio TEXT,
        avatar TEXT,
        skills TEXT[],
        hourlyRate DECIMAL(10,2),
        balance DECIMAL(10,2) DEFAULT 0,
        location TEXT,
        permissions TEXT[],
        status TEXT DEFAULT 'active',
        onboardingCompleted BOOLEAN DEFAULT false,
        emailVerified BOOLEAN DEFAULT false,
        lastLoginAt TIMESTAMPTZ,
        createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      `
    });
    
    if (usersError) {
      console.error('Error creating users table:', usersError);
      return;
    }
    
    // Create jobs table
    const { error: jobsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'jobs',
      schema: `
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        clientId INTEGER NOT NULL REFERENCES users(id),
        category TEXT NOT NULL,
        skills TEXT[],
        budget DECIMAL(10,2),
        hourlyRate DECIMAL(10,2),
        status TEXT DEFAULT 'open',
        location TEXT,
        deadline TIMESTAMPTZ,
        attachment TEXT,
        createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      `
    });
    
    if (jobsError) {
      console.error('Error creating jobs table:', jobsError);
      return;
    }
    
    console.log('Database schema created successfully');
  } catch (error) {
    console.error('Error setting up database schema:', error);
  }
}

/**
 * Seed initial test data
 */
async function seedData() {
  console.log('Seeding initial data...');
  
  try {
    // Create test users for each role
    const roles = ['client', 'freelancer', 'admin', 'support', 'qa', 'dispute_resolution', 'accounts'];
    
    for (const role of roles) {
      const username = `test_${role}`;
      const email = `${username}@example.com`;
      const password = hashPassword('password123');
      
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();
      
      if (!existingUser) {
        // Insert new user
        const { error } = await supabase
          .from('users')
          .insert({
            username,
            email,
            password,
            role,
            fullName: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
            status: 'active',
            balance: 1000.00,
            onboardingCompleted: true,
            emailVerified: true,
            lastLoginAt: new Date().toISOString()
          });
          
        if (error) {
          console.error(`Error creating ${role} user:`, error);
          continue;
        }
        
        console.log(`Created ${role} user: ${username}`);
      } else {
        console.log(`${role} user already exists: ${username}`);
      }
    }
    
    // Get client user for creating jobs
    const { data: clientUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'client')
      .single();
    
    if (clientUser) {
      // Create test jobs
      const jobTitles = [
        'Website Redesign for E-commerce Store',
        'Mobile App Development - Fitness Tracker',
        'Content Writing for Tech Blog',
        'Logo Design for New Startup',
        'Social Media Marketing Campaign'
      ];
      
      for (const title of jobTitles) {
        // Check if job already exists
        const { data: existingJob } = await supabase
          .from('jobs')
          .select('id')
          .eq('title', title)
          .single();
          
        if (!existingJob) {
          // Insert new job
          const { error } = await supabase
            .from('jobs')
            .insert({
              title,
              description: `This is a test job for ${title}. We need a skilled professional to help us with this project.`,
              clientId: clientUser.id,
              category: title.includes('Website') ? 'web_development' : 
                       title.includes('Mobile') ? 'mobile_development' :
                       title.includes('Content') ? 'writing' :
                       title.includes('Logo') ? 'design' : 'marketing',
              skills: ['javascript', 'react', 'node.js'],
              budget: Math.floor(Math.random() * 5000) + 1000,
              hourlyRate: Math.floor(Math.random() * 50) + 20,
              status: 'open',
              location: 'Remote',
              deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });
            
          if (error) {
            console.error(`Error creating job "${title}":`, error);
            continue;
          }
          
          console.log(`Created job: ${title}`);
        } else {
          console.log(`Job already exists: ${title}`);
        }
      }
    }
    
    console.log('Data seeding completed');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

async function main() {
  console.log('Connecting to Supabase...');
  
  try {
    // Check connection
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
      return;
    }
    
    console.log('Successfully connected to Supabase');
    
    // Set up schema and seed data
    await createSchema();
    await seedData();
    
    console.log('Supabase setup completed successfully');
  } catch (error) {
    console.error('Error setting up Supabase:', error);
  }
}

main();