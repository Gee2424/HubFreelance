// Authentication test script
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Function to test the login endpoint
async function testLogin() {
  try {
    console.log('Testing login with client@example.com / password123...');
    
    const response = await fetch('http://0.0.0.0:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'client@example.com',
        password: 'password123'
      })
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Login successful!');
      if (data.token) {
        console.log('Token:', data.token);
        
        // Test the me endpoint with the token
        await testMe(data.token);
      } else {
        console.log('Note: No token was returned in the response.');
      }
    } else {
      console.log('❌ Login failed');
    }
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

// Function to test the /me endpoint
async function testMe(token) {
  try {
    console.log('\nTesting /api/auth/me endpoint with token...');
    
    const response = await fetch('http://0.0.0.0:5000/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Authentication successful!');
    } else {
      console.log('❌ Authentication failed');
    }
  } catch (error) {
    console.error('Error testing /me endpoint:', error);
  }
}

// Function to test login with various credentials
async function testMultipleLogins() {
  const credentials = [
    { email: 'client@example.com', password: 'password123', role: 'Client' },
    { email: 'freelancer@example.com', password: 'password123', role: 'Freelancer' },
    { email: 'admin@example.com', password: 'password123', role: 'Admin' },
    { email: 'support@example.com', password: 'password123', role: 'Support' },
    { email: 'qa@example.com', password: 'password123', role: 'QA' }
  ];

  for (const cred of credentials) {
    try {
      console.log(`\nTesting login with ${cred.role} (${cred.email}) / ${cred.password}...`);
      
      const response = await fetch('http://0.0.0.0:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: cred.email,
          password: cred.password
        })
      });
      
      const data = await response.json();
      
      console.log('Response status:', response.status);
      console.log('Response data (partial):', {
        id: data.id,
        email: data.email,
        role: data.role,
        message: data.message
      });
      
      if (response.ok) {
        console.log(`✅ ${cred.role} login successful!`);
      } else {
        console.log(`❌ ${cred.role} login failed`);
      }
    } catch (error) {
      console.error(`Error testing ${cred.role} login:`, error);
    }
  }
}

// Run the tests
testMultipleLogins();