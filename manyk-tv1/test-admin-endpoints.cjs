// Admin endpoints test script
const API_BASE = 'http://localhost:3001';

async function testEndpoints() {
  console.log('🧪 Testing Admin API Endpoints...\n');

  // Mock auth headers (test JWT token)
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test_token'
  };

  const tests = [
    {
      name: '1. GET /api/plans',
      method: 'GET',
      url: '/api/plans',
      needsAuth: false
    },
    {
      name: '2. GET /api/settings',
      method: 'GET',
      url: '/api/settings',
      needsAuth: true
    },
    {
      name: '3. GET /api/users',
      method: 'GET',
      url: '/api/users',
      needsAuth: true
    },
    {
      name: '4. GET /api/promo-codes',
      method: 'GET',
      url: '/api/promo-codes',
      needsAuth: true
    }
  ];

  for (const test of tests) {
    try {
      const response = await fetch(`${API_BASE}${test.url}`, {
        method: test.method,
        headers: test.needsAuth ? authHeaders : { 'Content-Type': 'application/json' }
      });

      const status = response.status;
      const statusText = response.statusText;

      if (status === 200) {
        console.log(`✅ ${test.name}: ${status} ${statusText}`);
      } else if (status === 401 || status === 403) {
        console.log(`⚠️  ${test.name}: ${status} ${statusText} (Auth required)`);
      } else {
        console.log(`❌ ${test.name}: ${status} ${statusText}`);
      }
    } catch (err) {
      console.log(`❌ ${test.name}: ${err.message}`);
    }
  }

  console.log('\n✅ Test completed!');
  console.log('\n📝 Izoh:');
  console.log('   - ✅ = Endpoint mavjud');
  console.log('   - ⚠️  = Auth kerak (normal)');
  console.log('   - ❌ = Endpoint yo\'q yoki xato');
}

testEndpoints().catch(console.error);
