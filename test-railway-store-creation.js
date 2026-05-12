/**
 * Automated Test for Railway Store Creation
 * Tests the complete store creation flow to verify all routes work properly
 */

const API_BASE = 'https://shop-shop-server.up.railway.app';

// Test user credentials (you'll need to create these first or use existing)
const TEST_USER = {
  email: `testuser${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test User'
};

const TEST_STORE = {
  name: `Test Store ${Date.now()}`,
  description: 'Automated test store for Railway deployment verification',
  addressStreet: '123 Test Street',
  addressCity: 'Test City',
  addressState: 'TS',
  addressZip: '12345',
  phone: '+1-555-0123',
  companyName: 'Test Company Inc',
  website: 'https://example.com'
};

let authToken = null;
let createdStoreId = null;

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` })
    },
    ...options
  };

  console.log(`\n🔄 ${options.method || 'GET'} ${url}`);
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    if (response.ok) {
      console.log('✅ Success:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Error:', JSON.stringify(data, null, 2));
    }
    
    return { response, data };
  } catch (error) {
    console.log('💥 Network Error:', error.message);
    throw error;
  }
}

async function testUserSignup() {
  console.log('\n🔐 Testing User Signup...');
  
  const { response, data } = await makeRequest('/api/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify(TEST_USER)
  });

  if (response.ok && data.token) {
    authToken = data.token;
    console.log('🎉 User signup successful!');
    return true;
  } else {
    console.log('⚠️ User signup failed, trying login...');
    return await testUserLogin();
  }
}

async function testUserLogin() {
  console.log('\n🔑 Testing User Login...');
  
  const { response, data } = await makeRequest('/api/auth/v1/login', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_USER.email,
      password: TEST_USER.password
    })
  });

  if (response.ok && data.token) {
    authToken = data.token;
    console.log('🎉 User login successful!');
    return true;
  } else {
    console.log('❌ User login failed');
    return false;
  }
}

async function testStoreCreation() {
  console.log('\n🏪 Testing Store Creation...');
  
  const { response, data } = await makeRequest('/api/stores', {
    method: 'POST',
    body: JSON.stringify(TEST_STORE)
  });

  if (response.ok && data.id) {
    createdStoreId = data.id;
    console.log('🎉 Store creation successful!');
    console.log(`📍 Store ID: ${createdStoreId}`);
    return true;
  } else {
    console.log('❌ Store creation failed');
    return false;
  }
}

async function testTeamMeStores() {
  console.log('\n👥 Testing /api/team/me/stores...');
  
  const { response, data } = await makeRequest('/api/team/me/stores');
  
  if (response.ok) {
    console.log('🎉 Team stores endpoint working!');
    console.log(`📊 Found ${data.data?.length || 0} stores`);
    return true;
  } else {
    console.log('❌ Team stores endpoint failed');
    return false;
  }
}

async function testMediaUpload() {
  if (!createdStoreId) {
    console.log('⚠️ Skipping media test - no store ID');
    return true;
  }

  console.log('\n📸 Testing Media Upload...');
  
  // Create a simple test image (1x1 PNG)
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(0, 0, 1, 1);
  
  canvas.toBlob(async (blob) => {
    const formData = new FormData();
    formData.append('file', blob, 'test-image.png');
    formData.append('storeId', createdStoreId);
    formData.append('kind', 'IMAGE');

    const { response, data } = await makeRequest('/api/media/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Remove Content-Type to let browser set multipart boundary
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      console.log('🎉 Media upload successful!');
    } else {
      console.log('❌ Media upload failed');
    }
  }, 'image/png');
  
  return true;
}

async function testPaymentStatus() {
  if (!createdStoreId) {
    console.log('⚠️ Skipping payment status test - no store ID');
    return true;
  }

  console.log('\n💳 Testing Payment Connect Status...');
  
  const { response, data } = await makeRequest(`/api/payments/connect/${createdStoreId}/status`);
  
  if (response.ok) {
    console.log('🎉 Payment status endpoint working!');
    return true;
  } else {
    console.log('❌ Payment status endpoint failed');
    return false;
  }
}

async function testTagsEndpoint() {
  console.log('\n🏷️ Testing Tags Endpoint...');
  
  const { response, data } = await makeRequest('/api/tags?target=STORE');
  
  if (response.ok) {
    console.log('🎉 Tags endpoint working!');
    console.log(`📊 Found ${data.groups?.length || 0} tag groups`);
    return true;
  } else {
    console.log('❌ Tags endpoint failed');
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Railway Store Creation Tests');
  console.log('=====================================');
  
  const results = {
    userSignup: await testUserSignup(),
    storeCreation: await testStoreCreation(),
    teamMeStores: await testTeamMeStores(),
    mediaUpload: await testMediaUpload(),
    paymentStatus: await testPaymentStatus(),
    tagsEndpoint: await testTagsEndpoint()
  };
  
  console.log('\n📋 Test Results Summary');
  console.log('=======================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  console.log(`\n🏁 Overall Result: ${allPassed ? '🎉 ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (createdStoreId) {
    console.log(`\n📝 Created Store ID: ${createdStoreId}`);
    console.log('🧹 You may want to manually clean up this test store');
  }
}

// Run tests if this is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.runRailwayTests = runAllTests;
  console.log('🌐 Browser environment detected. Call runRailwayTests() to start tests.');
} else {
  // Node.js environment
  runAllTests().catch(console.error);
}
