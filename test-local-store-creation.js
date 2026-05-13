#!/usr/bin/env node

/**
 * Automated Test for Local Store Creation
 * Tests the complete store creation flow to verify all routes work properly locally
 */

const API_BASE = 'http://localhost:3005';

// Test user credentials
const TEST_USER = {
  email: `testuser${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test User',
  role: 'USER'
};

const TEST_STORE = {
  name: `Test Store ${Date.now()}`,
  slug: `test-store-${Date.now()}`,
  description: 'Automated test store for local development verification',
  addressStreet: '123 Test Street',
  addressCity: 'Test City',
  addressState: 'TS',
  addressZip: '12345',
  phone: '+1-555-0123',
  email: `test-store-${Date.now()}@example.com`,
  companyName: 'Test Company Inc',
  website: 'https://example.com',
  category: 'RESTAURANT'
};

let authToken = null;
let createdStoreId = null;

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type] || '📋';
  
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` })
    },
    ...options
  };

  log(`${options.method || 'GET'} ${url}`, 'info');
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    log(`Status: ${response.status}`, response.ok ? 'success' : 'error');
    
    if (!response.ok) {
      log(`Error: ${JSON.stringify(data, null, 2)}`, 'error');
    } else if (options.method !== 'GET') {
      log(`Response: ${JSON.stringify(data, null, 2)}`, 'success');
    }
    
    return { response, data };
  } catch (error) {
    log(`Network Error: ${error.message}`, 'error');
    throw error;
  }
}

async function checkServerStatus() {
  log('Checking server status...', 'info');
  
  try {
    const { response, data } = await makeRequest('/healthz');
    
    if (response.ok) {
      log(`Server is running! Version: ${data.version || 'unknown'}`, 'success');
      return true;
    } else {
      log(`Server returned HTTP ${response.status}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Server not accessible: ${error.message}`, 'error');
    return false;
  }
}

async function testUserSignup() {
  log('\nTesting User Signup...', 'info');
  
  const { response, data } = await makeRequest('/api/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify(TEST_USER)
  });

  if (response.ok && data.token) {
    authToken = data.token;
    log('User signup successful!', 'success');
    return true;
  } else {
    log('User signup failed, trying login...', 'warning');
    return await testUserLogin();
  }
}

async function testUserLogin() {
  log('\nTesting User Login...', 'info');
  
  const { response, data } = await makeRequest('/api/auth/v1/login', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_USER.email,
      password: TEST_USER.password
    })
  });

  if (response.ok && data.token) {
    authToken = data.token;
    log('User login successful!', 'success');
    return true;
  } else {
    log('User login failed', 'error');
    return false;
  }
}

async function testStoreCreation() {
  log('\nTesting Store Creation...', 'info');
  
  const { response, data } = await makeRequest('/api/stores', {
    method: 'POST',
    body: JSON.stringify(TEST_STORE)
  });

  if (response.ok && data.id) {
    createdStoreId = data.id;
    log(`Store creation successful! Store ID: ${createdStoreId}`, 'success');
    return true;
  } else {
    log('Store creation failed', 'error');
    return false;
  }
}

async function testTeamMeStores() {
  log('\nTesting /api/team/me/stores...', 'info');
  
  const { response, data } = await makeRequest('/api/team/me/stores');
  
  if (response.ok) {
    log(`Team stores endpoint working! Found ${data.data?.length || 0} stores`, 'success');
    return true;
  } else {
    log('Team stores endpoint failed', 'error');
    return false;
  }
}

async function testStoresList() {
  log('\nTesting /api/stores list...', 'info');
  
  const { response, data } = await makeRequest('/api/stores?page=1&limit=10');
  
  if (response.ok) {
    log(`Stores list endpoint working! Found ${data.data?.length || 0} stores`, 'success');
    return true;
  } else {
    log('Stores list endpoint failed', 'error');
    return false;
  }
}

async function testTagsEndpoint() {
  log('\nTesting Tags Endpoint...', 'info');
  
  const { response, data } = await makeRequest('/api/tags?target=STORE');
  
  if (response.ok) {
    log(`Tags endpoint working! Found ${data.groups?.length || 0} tag groups`, 'success');
    return true;
  } else {
    log('Tags endpoint failed', 'error');
    return false;
  }
}

async function testMediaUpload() {
  if (!createdStoreId) {
    log('Skipping media test - no store ID', 'warning');
    return true;
  }

  log('\nTesting Media Upload...', 'info');
  
  // Create a simple test image (1x1 PNG pixel)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk start
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // 8-bit, RGB
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk start
    0x54, 0x08, 0x99, 0x01, 0x01, 0x01, 0x00, 0x00, // Image data
    0xFE, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // CRC
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
    0xAE, 0x42, 0x60, 0x82 // IEND CRC
  ]);

  // Create form data
  const boundary = '----formdata-boundary-' + Date.now();
  let formData = '';

  formData += `--${boundary}\r\n`;
  formData += `Content-Disposition: form-data; name="file"; filename="test.png"\r\n`;
  formData += `Content-Type: image/png\r\n\r\n`;
  formData += pngData.toString('binary') + '\r\n';
  formData += `--${boundary}\r\n`;
  formData += `Content-Disposition: form-data; name="storeId"\r\n\r\n`;
  formData += createdStoreId + '\r\n';
  formData += `--${boundary}\r\n`;
  formData += `Content-Disposition: form-data; name="kind"\r\n\r\n`;
  formData += 'IMAGE\r\n';
  formData += `--${boundary}--\r\n`;

  try {
    const response = await fetch(`${API_BASE}/api/media/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    const data = await response.json();
    
    if (response.ok) {
      log('Media upload successful!', 'success');
      return true;
    } else {
      log('Media upload failed', 'error');
      log(`Error: ${JSON.stringify(data, null, 2)}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Media upload error: ${error.message}`, 'error');
    return false;
  }
}

async function runAllTests() {
  log('Starting Local Store Creation Tests', 'info');
  log('=====================================', 'info');
  
  const results = {
    serverStatus: await checkServerStatus(),
    userSignup: await testUserSignup(),
    storesList: await testStoresList(),
    storeCreation: await testStoreCreation(),
    teamMeStores: await testTeamMeStores(),
    tagsEndpoint: await testTagsEndpoint(),
    mediaUpload: await testMediaUpload()
  };
  
  log('\nTest Results Summary', 'info');
  log('=======================', 'info');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? 'PASSED' : 'FAILED';
    const icon = passed ? '✅' : '❌';
    log(`${icon} ${test}: ${status}`, passed ? 'success' : 'error');
  });
  
  const allPassed = Object.values(results).every(result => result);
  log(`\nOverall Result: ${allPassed ? '🎉 ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`, allPassed ? 'success' : 'error');
  
  if (createdStoreId) {
    log(`\nCreated Store ID: ${createdStoreId}`, 'info');
    log('You may want to manually clean up this test store', 'warning');
  }
  
  return allPassed;
}

// Check if this is run directly
if (require.main === module) {
  runAllTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  checkServerStatus,
  testUserSignup,
  testStoreCreation,
  testTeamMeStores,
  testTagsEndpoint,
  testMediaUpload
};
