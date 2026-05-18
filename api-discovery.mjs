#!/usr/bin/env node
/**
 * Backend API Discovery Script
 * Discovers and catalogs backend endpoints for admin catalog/components
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

const BACKEND = 'http://192.168.1.35:3000';
const EMAIL = 'admin@tudominio.com';
const PASSWORD = 'Admin@12345Local';
const TIMEOUT = 5000;

// Helper function to make HTTP requests
function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const targetUrl = new URL(path, BACKEND);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
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

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${title}`);
  console.log('='.repeat(60));
}

function logSuccess(msg) {
  console.log(`✓ ${msg}`);
}

function logError(msg) {
  console.log(`✗ ${msg}`);
}

function logInfo(msg) {
  console.log(`ℹ ${msg}`);
}

async function discoverBackend() {
  logSection('BACKEND API DISCOVERY');
  logInfo(`Target: ${BACKEND}`);
  logInfo(`Credentials: ${EMAIL}`);

  // Step 1: Test connectivity
  console.log('\n[1] Testing backend connectivity...');
  try {
    const res = await makeRequest('GET', '/');
    if (res.status) {
      logSuccess(`Backend is UP (Status: ${res.status})`);
    }
  } catch (err) {
    logError(`Backend not reachable: ${err.message}`);
    return;
  }

  // Step 2: Authenticate
  let token = null;
  console.log('\n[2] Attempting authentication...');
  
  const authEndpoints = ['/auth/login', '/api/auth/login', '/api/authentication/login'];
  
  for (const endpoint of authEndpoints) {
    try {
      logInfo(`Trying ${endpoint}...`);
      const res = await makeRequest('POST', endpoint, { email: EMAIL, password: PASSWORD });
      
      if (res.status === 200 || res.status === 201) {
        logSuccess(`Authentication successful at ${endpoint} (Status: ${res.status})`);
        logInfo(`Response keys: ${Object.keys(res.body || {}).join(', ')}`);
        
        // Extract token from various possible fields
        token = res.body?.token || res.body?.access_token || res.body?.accessToken || res.body?.data?.token;
        
        if (token) {
          logSuccess(`Token received: ${token.substring(0, 40)}...`);
          break;
        } else {
          logInfo(`No token field found in response`);
          logInfo(`Full response: ${JSON.stringify(res.body, null, 2)}`);
        }
      } else {
        logInfo(`${endpoint} returned status ${res.status}`);
      }
    } catch (err) {
      logInfo(`${endpoint} failed: ${err.message}`);
    }
  }

  if (!token) {
    logError('Failed to authenticate - cannot proceed');
    return;
  }

  // Step 3: Probe catalog/component endpoints
  console.log('\n[3] Probing catalog/component endpoints...');
  
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
    '/v1/admin/components'
  ];

  const authHeaders = {
    'Authorization': `Bearer ${token}`
  };

  const discoveredEndpoints = [];

  for (const endpoint of endpoints) {
    logInfo(`\nTesting ${endpoint}...`);
    
    try {
      const res = await makeRequest('GET', endpoint, null, authHeaders);
      
      if (res.status === 200 || res.status === 201) {
        logSuccess(`${endpoint} - Status ${res.status}`);
        
        const endpointInfo = {
          method: 'GET',
          path: endpoint,
          status: res.status,
          responseKeys: res.body ? Object.keys(res.body) : [],
          isList: Array.isArray(res.body),
          itemSampleKeys: null,
          itemSample: null
        };

        if (Array.isArray(res.body) && res.body.length > 0) {
          endpointInfo.itemSampleKeys = Object.keys(res.body[0]);
          endpointInfo.itemSample = res.body[0];
          logInfo(`  Response is array with ${res.body.length} items`);
          logInfo(`  First item keys: ${Object.keys(res.body[0]).join(', ')}`);
        } else if (res.body && typeof res.body === 'object') {
          logInfo(`  Response keys: ${Object.keys(res.body).join(', ')}`);
          
          // Check if data is nested in a data property
          if (res.body.data && Array.isArray(res.body.data) && res.body.data.length > 0) {
            endpointInfo.itemSampleKeys = Object.keys(res.body.data[0]);
            endpointInfo.itemSample = res.body.data[0];
            logInfo(`  Nested data array with ${res.body.data.length} items`);
            logInfo(`  First item keys: ${Object.keys(res.body.data[0]).join(', ')}`);
          }
        }

        discoveredEndpoints.push(endpointInfo);
      } else {
        logInfo(`  Status: ${res.status} (skipped)`);
      }
    } catch (err) {
      logInfo(`  Error: ${err.message}`);
    }
  }

  // Step 4: Try OPTIONS to discover allowed methods
  console.log('\n[4] Testing OPTIONS method on discovered endpoints...');
  
  for (const endpoint of discoveredEndpoints.slice(0, 3)) {
    try {
      const res = await makeRequest('OPTIONS', endpoint.path, null, authHeaders);
      if (res.headers['allow']) {
        logInfo(`${endpoint.path} allows: ${res.headers['allow']}`);
      }
    } catch (err) {
      logInfo(`OPTIONS ${endpoint.path}: ${err.message}`);
    }
  }

  // Step 5: Test query parameters on first discovered endpoint
  if (discoveredEndpoints.length > 0) {
    console.log('\n[5] Testing pagination/filters on first endpoint...');
    const endpoint = discoveredEndpoints[0];
    
    const queryTests = [
      { path: `${endpoint.path}?page=1&limit=10`, desc: 'Pagination' },
      { path: `${endpoint.path}?limit=5`, desc: 'Limit only' },
      { path: `${endpoint.path}?sort=id&order=asc`, desc: 'Sorting' },
      { path: `${endpoint.path}?search=test`, desc: 'Search' },
      { path: `${endpoint.path}?filter=active`, desc: 'Filter' }
    ];

    for (const test of queryTests) {
      try {
        const res = await makeRequest('GET', test.path, null, authHeaders);
        if (res.status === 200) {
          logSuccess(`${test.desc}: ${test.path}`);
        }
      } catch (err) {
        // Silently skip
      }
    }
  }

  // Summary
  logSection('DISCOVERY RESULTS');
  console.log(`\nEndpoints Found: ${discoveredEndpoints.length}`);
  
  if (discoveredEndpoints.length > 0) {
    console.log('\nEndpoints Details:');
    discoveredEndpoints.forEach((ep, i) => {
      console.log(`\n  ${i + 1}. ${ep.path}`);
      console.log(`     Method: ${ep.method}`);
      console.log(`     Status: ${ep.status}`);
      console.log(`     Response Keys: ${ep.responseKeys.join(', ')}`);
      if (ep.isList) {
        console.log(`     Type: List (Array)`);
        if (ep.itemSampleKeys) {
          console.log(`     Item Keys: ${ep.itemSampleKeys.join(', ')}`);
          console.log(`     Sample Item: ${JSON.stringify(ep.itemSample, null, 6).split('\n').slice(0, 8).join('\n')}`);
        }
      }
    });
  }

  console.log('\n' + '='.repeat(60));
}

// Run discovery
discoverBackend().catch(err => {
  logError(`Fatal error: ${err.message}`);
  process.exit(1);
});
