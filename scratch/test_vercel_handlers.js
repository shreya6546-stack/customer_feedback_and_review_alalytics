/**
 * Verification test for Vercel API and Static routing handlers
 */

const http = require('http');
const apiHandler = require('../api/index');
const catchAllHandler = require('../api/[...path]');

// Mock response object
function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    writeHead(status, headers) {
      this.statusCode = status;
      this.headers = Object.assign(this.headers, headers || {});
    },
    end(data) {
      this.body = data || '';
    }
  };
}

async function run() {
  console.log('Testing Vercel Serverless Handlers...\n');

  // Test 1: api/index.js with GET /api
  {
    const req = { method: 'GET', url: '/api', headers: {} };
    const res = createMockRes();
    await apiHandler(req, res);
    const data = JSON.parse(res.body);
    console.log(`[1] /api: status=${res.statusCode}, statusMsg=${data.status}`);
    if (res.statusCode !== 200 || data.status !== 'ok') throw new Error('Test 1 failed');
  }

  // Test 2: api/index.js with GET /api/health
  {
    const req = { method: 'GET', url: '/api/health', headers: {} };
    const res = createMockRes();
    await apiHandler(req, res);
    const data = JSON.parse(res.body);
    console.log(`[2] /api/health: status=${res.statusCode}, reviewsCount=${data.totalReviews}`);
    if (res.statusCode !== 200 || typeof data.totalReviews !== 'number') throw new Error('Test 2 failed');
  }

  // Test 3: api/[...path].js with GET /api/bootstrap
  {
    const req = { method: 'GET', url: '/api/bootstrap', headers: {} };
    const res = createMockRes();
    await catchAllHandler(req, res);
    const data = JSON.parse(res.body);
    console.log(`[3] /api/bootstrap: status=${res.statusCode}, reviewsLen=${data.reviews.length}`);
    if (res.statusCode !== 200 || !Array.isArray(data.reviews)) throw new Error('Test 3 failed');
  }

  // Test 4: api/[...path].js with query.path segments (Vercel catch-all behavior)
  {
    const req = { method: 'GET', url: '/api/[...path]', query: { path: ['reviews'] }, headers: {} };
    const res = createMockRes();
    await catchAllHandler(req, res);
    const data = JSON.parse(res.body);
    console.log(`[4] Catch-all /api/reviews: status=${res.statusCode}, total=${data.total}`);
    if (res.statusCode !== 200 || typeof data.total !== 'number') throw new Error('Test 4 failed');
  }

  // Test 5: api/[...path].js with POST mutation and pre-parsed body
  {
    const newRev = {
      customerName: 'Vercel Tester',
      email: 'vercel@example.com',
      product: 'SmartHub Pro',
      rating: 5,
      category: 'Product Quality',
      reviewTitle: 'Vercel handler working',
      reviewText: 'Everything deployed and running smoothly on Vercel.',
      recommendation: 'Yes'
    };
    const req = {
      method: 'POST',
      url: '/api/reviews',
      body: newRev,
      headers: { 'content-type': 'application/json' }
    };
    const res = createMockRes();
    await catchAllHandler(req, res);
    const data = JSON.parse(res.body);
    console.log(`[5] POST /api/reviews: status=${res.statusCode}, createdId=${data.data?.id}`);
    if (res.statusCode !== 201 || !data.data?.id) throw new Error('Test 5 failed');
  }

  console.log('\n✔ All Vercel Serverless Function handlers passed verification!');
}

run().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
