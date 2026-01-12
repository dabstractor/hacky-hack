/**
 * Domain-specific validation test: AUTH_TOKEN -> API_KEY mapping
 */

// Save original values
const originalApiKey = process.env.ANTHROPIC_API_KEY;
const originalAuthToken = process.env.ANTHROPIC_AUTH_TOKEN;
const originalBaseURL = process.env.ANTHROPIC_BASE_URL;

console.log('=== Domain-Specific Validation Tests ===\n');

// Test 1: Verify mapping works when only AUTH_TOKEN is set
console.log('Test 1: AUTH_TOKEN -> API_KEY mapping');
delete process.env.ANTHROPIC_API_KEY;
process.env.ANTHROPIC_AUTH_TOKEN = 'test-token-12345';

import('../../src/config/environment.js').then(m => {
  m.configureEnvironment();
  if (process.env.ANTHROPIC_API_KEY === 'test-token-12345') {
    console.log('✓ Test 1 passed: API_KEY set from AUTH_TOKEN');
  } else {
    console.log('✗ Test 1 failed: API_KEY not set correctly');
  }

  // Test 2: Verify existing API_KEY is not overwritten
  console.log('\nTest 2: Existing API_KEY preserved');
  process.env.ANTHROPIC_API_KEY = 'original-key';
  process.env.ANTHROPIC_AUTH_TOKEN = 'different-key';
  
  // Reset and configure again
  m.configureEnvironment();
  if (process.env.ANTHROPIC_API_KEY === 'original-key') {
    console.log('✓ Test 2 passed: Existing API_KEY not overwritten');
  } else {
    console.log('✗ Test 2 failed: API_KEY was overwritten');
  }

  // Test 3: Verify BASE_URL default is set
  console.log('\nTest 3: BASE_URL default');
  delete process.env.ANTHROPIC_BASE_URL;
  m.configureEnvironment();
  if (process.env.ANTHROPIC_BASE_URL === 'https://api.z.ai/api/anthropic') {
    console.log('✓ Test 3 passed: BASE_URL set to correct default');
  } else {
    console.log('✗ Test 3 failed: BASE_URL not set correctly');
  }

  // Restore original values
  if (originalApiKey) process.env.ANTHROPIC_API_KEY = originalApiKey;
  else delete process.env.ANTHROPIC_API_KEY;
  if (originalAuthToken) process.env.ANTHROPIC_AUTH_TOKEN = originalAuthToken;
  else delete process.env.ANTHROPIC_AUTH_TOKEN;
  if (originalBaseURL) process.env.ANTHROPIC_BASE_URL = originalBaseURL;
  else delete process.env.ANTHROPIC_BASE_URL;

  console.log('\n=== Domain Tests Complete ===');
});
