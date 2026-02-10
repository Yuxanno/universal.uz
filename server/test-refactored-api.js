/**
 * Quick Test Script for Refactored API
 * Run with: node test-refactored-api.js
 */

const config = {
  baseUrl: 'http://localhost:5050',
  // Add your JWT token here after logging in
  token: 'YOUR_JWT_TOKEN_HERE',
};

async function testEndpoint(method, path, data = null) {
  const url = `${config.baseUrl}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(config.token !== 'YOUR_JWT_TOKEN_HERE' && {
        Authorization: `Bearer ${config.token}`,
      }),
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    console.log(`\n✅ ${method} ${path}`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error(`\n❌ ${method} ${path}`);
    console.error('Error:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Testing Refactored API\n');
  console.log('=' .repeat(50));

  // Test 1: Health Check
  console.log('\n📋 Test 1: Health Check');
  await testEndpoint('GET', '/health');

  // Test 2: Get Products (Old Endpoint)
  console.log('\n📋 Test 2: Get Products (Old Endpoint)');
  await testEndpoint('GET', '/api/products');

  // Test 3: Get Products (New Endpoint)
  console.log('\n📋 Test 3: Get Products (New v2 Endpoint)');
  await testEndpoint('GET', '/api/v2/products');

  // Test 4: Get Products with Search
  console.log('\n📋 Test 4: Get Products with Search');
  await testEndpoint('GET', '/api/v2/products?search=test');

  // Test 5: Get Next Code
  console.log('\n📋 Test 5: Get Next Product Code');
  await testEndpoint('GET', '/api/v2/products/next-code');

  // Test 6: 404 Error
  console.log('\n📋 Test 6: 404 Not Found');
  await testEndpoint('GET', '/api/v2/nonexistent');

  // Test 7: Validation Error (if authenticated)
  if (config.token !== 'YOUR_JWT_TOKEN_HERE') {
    console.log('\n📋 Test 7: Validation Error');
    await testEndpoint('POST', '/api/v2/products', {
      // Missing required fields
      name: 'Test',
    });
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Tests completed!\n');
  
  if (config.token === 'YOUR_JWT_TOKEN_HERE') {
    console.log('⚠️  Note: Some tests were skipped because no JWT token was provided.');
    console.log('To test authenticated endpoints:');
    console.log('1. Login to get a JWT token');
    console.log('2. Update the token in this file');
    console.log('3. Run the tests again\n');
  }
}

// Run tests
runTests().catch(console.error);
