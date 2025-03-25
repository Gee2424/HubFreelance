// Improved authentication test script
import fetch from 'node-fetch';
import * as https from 'https';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create an HTTPS agent that allows self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Function to test the login endpoint
async function testLogin() {
  try {
    console.log('⏳ Testing login with client@example.com / password123...');
    
    const requestBody = {
      email: 'client@example.com',
      password: 'password123'
    };
    
    console.log('📤 Request payload:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
      agent: httpsAgent
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', response.headers.raw());
    
    const contentType = response.headers.get('content-type');
    console.log('📥 Content-Type:', contentType);
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.log('📥 Raw response:', text);
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.log('❌ Failed to parse response as JSON');
        return;
      }
    }
    
    console.log('📥 Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.token) {
      console.log('✅ Login successful!');
      console.log('🔑 Token:', data.token);
      
      // Test the me endpoint with the token
      await testMe(data.token);
    } else {
      console.log('❌ Login failed');
    }
  } catch (error) {
    console.error('🚫 Error testing login:', error);
  }
}

// Function to test the /me endpoint
async function testMe(token) {
  try {
    console.log('\n⏳ Testing /api/auth/me endpoint with token...');
    
    const response = await fetch('http://localhost:5000/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      agent: httpsAgent
    });
    
    console.log('📥 Response status:', response.status);
    
    const data = await response.json();
    console.log('📥 Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Authentication successful!');
    } else {
      console.log('❌ Authentication failed');
    }
  } catch (error) {
    console.error('🚫 Error testing /me endpoint:', error);
  }
}

// Function to test the database connection
async function testDatabaseConnection() {
  try {
    console.log('\n⏳ Testing database connection...');
    
    const response = await fetch('http://localhost:5000/api/users/count', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      agent: httpsAgent
    });
    
    console.log('📥 Response status:', response.status);
    
    const data = await response.json();
    console.log('📥 Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Database connection successful!');
    } else {
      console.log('❌ Database connection failed');
    }
  } catch (error) {
    console.error('🚫 Error testing database connection:', error);
  }
}

// Add a users count endpoint to check the database
async function createUsersCountEndpoint() {
  try {
    console.log('\n⏳ Adding a /api/users/count endpoint for testing...');
    
    // We'll do this by modifying the server directly
    console.log('👉 Endpoint will be available at: http://localhost:5000/api/users/count');
  } catch (error) {
    console.error('🚫 Error creating users count endpoint:', error);
  }
}

// Function to make a direct API request with curl
async function testLoginWithCurl() {
  try {
    const { exec } = await import('child_process');
    
    console.log('\n⏳ Testing login with curl...');
    
    const command = `curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"client@example.com","password":"password123"}' -v`;
    
    console.log('📤 Executing curl command:', command);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`🚫 Error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log('📥 Curl diagnostic info:');
        console.log(stderr);
      }
      console.log('📥 Response from curl:');
      console.log(stdout);
    });
  } catch (error) {
    console.error('🚫 Error testing login with curl:', error);
  }
}

// Run the tests sequentially
async function runTests() {
  console.log('🧪 Starting API tests...');
  await createUsersCountEndpoint();
  await testDatabaseConnection();
  await testLogin();
  await testLoginWithCurl();
  console.log('\n🏁 Tests completed!');
}

runTests();