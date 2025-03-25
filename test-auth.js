import fetch from 'node-fetch';

async function testAuthentication() {
  try {
    console.log('Testing authentication...');
    
    // Attempt login
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response status:', loginResponse.status);
    console.log('Login response data:', loginData);
    
    if (!loginResponse.ok) {
      console.error('Login failed');
      return;
    }
    
    const token = loginData.token;
    
    // Use token to get current user
    const meResponse = await fetch('http://localhost:5000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const userData = await meResponse.json();
    console.log('Me endpoint status:', meResponse.status);
    console.log('User data:', userData);
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

testAuthentication();