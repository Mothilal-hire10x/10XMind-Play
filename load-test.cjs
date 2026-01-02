/**
 * Load Test for 10XMind-Play
 * Tests 300 concurrent users signing up and logging in
 * 
 * Usage: node load-test.js
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'https://10xmindplay.mothilal.xyz';
const NUM_USERS = 300;
const CONCURRENCY = 300; // Process all 300 users simultaneously

// Parse URL
const url = new URL(BASE_URL);
const isHttps = url.protocol === 'https:';
const httpModule = isHttps ? https : http;

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = httpModule.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Signup function
async function signup(userId) {
  const email = `loadtest_user_${userId}_${Date.now()}@test.com`;
  const password = `TestPass${userId}!`;
  const name = `Load Test User ${userId}`;
  const dob = '2000-01-01';

  const options = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: '/api/auth/signup',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000
  };

  const startTime = Date.now();
  try {
    const response = await makeRequest(options, { email, password, name, dob });
    const duration = Date.now() - startTime;
    
    if (response.status === 201 && response.data.token) {
      return { success: true, userId, email, token: response.data.token, duration };
    } else {
      return { success: false, userId, email, error: response.data.error || 'Signup failed', duration };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    return { success: false, userId, email, error: error.message, duration };
  }
}

// Login function
async function login(email, password) {
  const options = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000
  };

  const startTime = Date.now();
  try {
    const response = await makeRequest(options, { email, password });
    const duration = Date.now() - startTime;
    
    if (response.status === 200 && response.data.token) {
      return { success: true, email, token: response.data.token, duration };
    } else {
      return { success: false, email, error: response.data.error || 'Login failed', duration };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    return { success: false, email, error: error.message, duration };
  }
}

// Process users in batches
async function processBatch(userIds) {
  const promises = userIds.map(async (userId) => {
    // Signup
    const signupResult = await signup(userId);
    
    if (!signupResult.success) {
      return { userId, signup: signupResult, login: null };
    }

    // Extract credentials
    const email = signupResult.email;
    const password = `TestPass${userId}!`;
    
    // Wait a bit before login (simulate real user behavior)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Login
    const loginResult = await login(email, password);
    
    return { userId, signup: signupResult, login: loginResult };
  });

  return Promise.all(promises);
}

// Main load test function
async function runLoadTest() {
  console.log('🚀 Starting Load Test for 10XMind-Play');
  console.log(`📊 Testing ${NUM_USERS} concurrent users (signup + login)`);
  console.log(`🌐 Target: ${BASE_URL}`);
  console.log(`⚡ Concurrency: ${CONCURRENCY} users per batch\n`);

  const startTime = Date.now();
  const allResults = [];

  // Create user IDs
  const userIds = Array.from({ length: NUM_USERS }, (_, i) => i + 1);

  // Process in batches
  for (let i = 0; i < userIds.length; i += CONCURRENCY) {
    const batch = userIds.slice(i, i + CONCURRENCY);
    const batchNum = Math.floor(i / CONCURRENCY) + 1;
    const totalBatches = Math.ceil(NUM_USERS / CONCURRENCY);
    
    console.log(`📦 Processing batch ${batchNum}/${totalBatches} (users ${i + 1}-${Math.min(i + CONCURRENCY, NUM_USERS)})...`);
    
    const batchStartTime = Date.now();
    const results = await processBatch(batch);
    const batchDuration = Date.now() - batchStartTime;
    
    allResults.push(...results);
    
    console.log(`   ✅ Batch completed in ${batchDuration}ms`);
  }

  const totalDuration = Date.now() - startTime;

  // Calculate statistics
  const signupStats = {
    total: allResults.length,
    success: allResults.filter(r => r.signup.success).length,
    failed: allResults.filter(r => !r.signup.success).length,
    durations: allResults.filter(r => r.signup.success).map(r => r.signup.duration)
  };

  const loginStats = {
    total: allResults.filter(r => r.login).length,
    success: allResults.filter(r => r.login && r.login.success).length,
    failed: allResults.filter(r => r.login && !r.login.success).length,
    durations: allResults.filter(r => r.login && r.login.success).map(r => r.login.duration)
  };

  // Calculate percentiles
  function percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  function average(arr) {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('📈 LOAD TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`\n⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`👥 Total Users: ${NUM_USERS}`);
  console.log(`🔄 Throughput: ${(NUM_USERS / (totalDuration / 1000)).toFixed(2)} operations/sec`);

  console.log('\n📝 SIGNUP RESULTS:');
  console.log(`   ✅ Successful: ${signupStats.success}/${signupStats.total} (${((signupStats.success / signupStats.total) * 100).toFixed(1)}%)`);
  console.log(`   ❌ Failed: ${signupStats.failed}/${signupStats.total} (${((signupStats.failed / signupStats.total) * 100).toFixed(1)}%)`);
  
  if (signupStats.durations.length > 0) {
    console.log(`   ⚡ Response Times:`);
    console.log(`      Average: ${average(signupStats.durations).toFixed(0)}ms`);
    console.log(`      Median (P50): ${percentile(signupStats.durations, 50).toFixed(0)}ms`);
    console.log(`      P95: ${percentile(signupStats.durations, 95).toFixed(0)}ms`);
    console.log(`      P99: ${percentile(signupStats.durations, 99).toFixed(0)}ms`);
    console.log(`      Max: ${Math.max(...signupStats.durations).toFixed(0)}ms`);
  }

  console.log('\n🔐 LOGIN RESULTS:');
  console.log(`   ✅ Successful: ${loginStats.success}/${loginStats.total} (${((loginStats.success / loginStats.total) * 100).toFixed(1)}%)`);
  console.log(`   ❌ Failed: ${loginStats.failed}/${loginStats.total} (${((loginStats.failed / loginStats.total) * 100).toFixed(1)}%)`);
  
  if (loginStats.durations.length > 0) {
    console.log(`   ⚡ Response Times:`);
    console.log(`      Average: ${average(loginStats.durations).toFixed(0)}ms`);
    console.log(`      Median (P50): ${percentile(loginStats.durations, 50).toFixed(0)}ms`);
    console.log(`      P95: ${percentile(loginStats.durations, 95).toFixed(0)}ms`);
    console.log(`      P99: ${percentile(loginStats.durations, 99).toFixed(0)}ms`);
    console.log(`      Max: ${Math.max(...loginStats.durations).toFixed(0)}ms`);
  }

  // Error analysis
  const signupErrors = allResults.filter(r => !r.signup.success);
  const loginErrors = allResults.filter(r => r.login && !r.login.success);

  if (signupErrors.length > 0) {
    console.log('\n⚠️  SIGNUP ERRORS:');
    const errorCounts = {};
    signupErrors.forEach(r => {
      const error = r.signup.error || 'Unknown error';
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });
    Object.entries(errorCounts).forEach(([error, count]) => {
      console.log(`   - ${error}: ${count} occurrences`);
    });
  }

  if (loginErrors.length > 0) {
    console.log('\n⚠️  LOGIN ERRORS:');
    const errorCounts = {};
    loginErrors.forEach(r => {
      const error = r.login.error || 'Unknown error';
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });
    Object.entries(errorCounts).forEach(([error, count]) => {
      console.log(`   - ${error}: ${count} occurrences`);
    });
  }

  console.log('\n' + '='.repeat(60));
  
  const successRate = ((signupStats.success + loginStats.success) / (signupStats.total + loginStats.total)) * 100;
  if (successRate >= 95) {
    console.log('✅ LOAD TEST PASSED - System handled load successfully!');
  } else if (successRate >= 80) {
    console.log('⚠️  LOAD TEST WARNING - System partially handled load');
  } else {
    console.log('❌ LOAD TEST FAILED - System struggled under load');
  }
  console.log('='.repeat(60) + '\n');

  // Save detailed results to file
  const fs = require('fs');
  const resultsFile = `load-test-results-${Date.now()}.json`;
  fs.writeFileSync(resultsFile, JSON.stringify({
    testConfig: {
      numUsers: NUM_USERS,
      concurrency: CONCURRENCY,
      baseUrl: BASE_URL,
      timestamp: new Date().toISOString()
    },
    summary: {
      totalDuration,
      throughput: NUM_USERS / (totalDuration / 1000),
      signupStats,
      loginStats
    },
    detailedResults: allResults
  }, null, 2));
  
  console.log(`💾 Detailed results saved to: ${resultsFile}\n`);
}

// Run the test
runLoadTest().catch(error => {
  console.error('❌ Load test failed with error:', error);
  process.exit(1);
});
