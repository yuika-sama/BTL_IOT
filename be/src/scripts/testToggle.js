const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testToggle() {
  try {
    console.log('Testing PATCH /devices/abcde1/toggle...\n');
    
    // Try to toggle device
    const response = await axios.patch(`${API_BASE_URL}/devices/abcde1/toggle`);
    
    console.log('✅ Success!');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error!');
    console.log('Status:', error.response?.status || 'No response');
    console.log('Message:', error.message);
    console.log('URL:', error.config?.url);
    console.log('Response:', JSON.stringify(error.response?.data, null, 2));
  }
}

testToggle();
