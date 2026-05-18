import http from 'http';
import https from 'https';
import { URL } from 'url';

const BACKEND = 'http://192.168.1.35:3000';
const EMAIL = 'admin@tudominio.com';
const PASSWORD = 'Admin@12345Local';
const TIMEOUT = 5000;

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const targetUrl = new URL(path, BACKEND);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'APIDiscovery/1.0',
        ...headers
      },
      timeout: TIMEOUT
    };

    const protocol = targetUrl.protocol === 'https:' ? https : http;
    
    const req = protocol.request(targetUrl, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
            raw: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: null,
            raw: data,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function discover() {
  console.log('\n' + '='.repeat(70));
  console.log('BACKEND API ENDPOINT DISCOVERY');
  console.log('='.repeat(70));
  console.log(`Backend: ${BACKEND}`);
  console.log(`Credentials: ${EMAIL}`);
  console.log('');

  // Step 1: Test connectivity
  console.log('[1] Testing backend connectivity...');
  try {
    const res = await makeRequest('GET', '/');
    console.log(`✓ Backend is reachable (Status: ${res.status})\n`);
  } catch (err) {
    console.log(`✗ Backend connection failed: ${err.message}\n`);
    return;
  }

  // Step 2: Authenticate
  let token = null;
  console.log('[2] Attempting authentication...');
  
  try {
    const res = await makeRequest('POST', '/auth/login', {
      email: EMAIL,
      password: PASSWORD
    });

    if (res.status === 200 || res.status === 201) {
      console.log(`✓ Auth successful at /auth/login (Status: ${res.status})`);
      console.log(`  Response keys: ${Object.keys(res.body || {}).join(', ')}`);
      
      token = res.body?.token || res.body?.access_token || res.body?.accessToken || res.body?.data?.token;
      
      if (token) {
        console.log(`✓ Token received: ${token.substring(0, 40)}...`);
      } else {
        console.log(`✗ No token found in response`);
        console.log(`  Full response: ${JSON.stringify(res.body, null, 2)}`);
      }
    } else {
      console.log(`✗ Auth failed at /auth/login (Status: ${res.status})`);
      console.log(`  Response: ${res.raw}`);
    }
  } catch (err) {
    console.log(`✗ Auth request failed: ${err.message}`);
  }

  if (!token) {
    console.log('\n✗ Cannot proceed without authentication token\n');
    return;
  }

  // Step 3: Probe endpoints
  console.log('\n[3] Probing catalog/component endpoints...\n');

  const endpoints = [
    '/components',
    '/catalog',
    '/products',
    '/admin/components',
    '/admin/catalog',
    '/admin/products',
    '/api/components',
    '/api/catalog',
    '/api/products',
    '/api/admin/components',
    '/api/admin/catalog',
    '/api/admin/products',
    '/v1/components',
    '/v1/admin/components',
    '/users'
  ];

  const authHeaders = {
    'Authorization': `Bearer ${token}`
  };

  const discoveredEndpoints = [];

  for (const endpoint of endpoints) {
    try {
      const res = await makeRequest('GET', endpoint, null, authHeaders);
      
      if (res.status === 200 || res.status === 201) {
        console.log(`✓ ${endpoint}`);
        console.log(`  Method: GET | Status: ${res.status}`);
        
        const endpointInfo = {
          method: 'GET',
          path: endpoint,
          status: res.status,
          responseKeys: res.body ? Object.keys(res.body) : [],
          isList: Array.isArray(res.body),
          sample: res.body
        };

        if (Array.isArray(res.body)) {
          if (res.body.length > 0) {
            endpointInfo.itemCount = res.body.length;
            endpointInfo.itemKeys = Object.keys(res.body[0]);
            console.log(`  Type: Array (${res.body.length} items)`);
            console.log(`  Item keys: ${Object.keys(res.body[0]).join(', ')}`);
          } else {
            console.log(`  Type: Empty Array`);
          }
        } else if (res.body && typeof res.body === 'object') {
          console.log(`  Type: Object`);
          console.log(`  Keys: ${Object.keys(res.body).join(', ')}`);
          
          // Check for nested data array
          if (res.body.data && Array.isArray(res.body.data) && res.body.data.length > 0) {
            endpointInfo.nestedData = true;
            endpointInfo.dataKeys = Object.keys(res.body.data[0]);
            console.log(`  Nested data array: ${res.body.data.length} items`);
            console.log(`  Data item keys: ${Object.keys(res.body.data[0]).join(', ')}`);
          }
        }
        
        discoveredEndpoints.push(endpointInfo);
      } else if (res.status === 401) {
        console.log(`⊘ ${endpoint} (Status: 401 Unauthorized)`);
      } else if (res.status === 403) {
        console.log(`⊘ ${endpoint} (Status: 403 Forbidden)`);
      } else if (res.status === 404) {
        console.log(`⊘ ${endpoint} (Status: 404 Not Found)`);
      } else {
        console.log(`⊘ ${endpoint} (Status: ${res.status})`);
      }
    } catch (err) {
      console.log(`✗ ${endpoint} (Error: ${err.message})`);
    }
    console.log('');
  }

  // Summary
  console.log('='.repeat(70));
  console.log(`SUMMARY: Found ${discoveredEndpoints.length} working endpoints\n`);

  discoveredEndpoints.forEach((ep, i) => {
    console.log(`\n${i + 1}. ${ep.path}`);
    console.log(`   Method: ${ep.method}`);
    console.log(`   Status: ${ep.status}`);
    console.log(`   Response Type: ${ep.isList ? 'Array' : 'Object'}`);
    if (ep.isList && ep.itemKeys) {
      console.log(`   Item Structure: ${ep.itemKeys.join(', ')}`);
      if (ep.sample && ep.sample[0]) {
        console.log(`   Sample Item:`);
        console.log(JSON.stringify(ep.sample[0], null, 4).split('\n').slice(0, 15).join('\n'));
      }
    } else if (ep.nestedData) {
      console.log(`   Data Array Items: ${ep.itemCount || '?'}`);
      console.log(`   Item Structure: ${(ep.dataKeys || []).join(', ')}`);
    }
  });

  console.log('\n' + '='.repeat(70) + '\n');
}

discover().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
