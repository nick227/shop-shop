const http = require('http');

// Simple test to isolate analytics endpoint issue
const testData = {
  storeId: '182584b6-1b7d-4168-b68c-29acab85f764',
  period: '30d',
  sortBy: 'revenue',
  sortOrder: 'desc',
  limit: 100
};

const queryString = new URLSearchParams(testData).toString();
const options = {
  hostname: 'localhost',
  port: 3005,
  path: `/api/items/analytics?${queryString}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'test-auth=true' // Simulate auth
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    console.log('Response:', data);
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
});

req.end();
