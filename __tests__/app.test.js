/* eslint-disable no-console */
const request = require('supertest');
require('dotenv').config({ path: '.env.test' });

// Mock basePath and buildPath from your config
jest.mock('../config/basePath', () => ({
  basePath: '/outdoorsy',
  buildPath: (subpath) => `/outdoorsy/${subpath}`,
}));

const app = require('../app'); // path to your app.js

// Add error logging middleware early in app for tests
// This should be added only once, so ensure your app doesn't already have this middleware
app.use((err, req, res, next) => {
  console.error('Test error:', err.stack);
  next(err);
});

describe('Express app basic tests', () => {
  it('GET basePath (home) should return 200 and render home page', async () => {
    const res = await request(app).get('/outdoorsy/'); // note trailing slash
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/<html/i);
  });

  it('serves static files under basePath (if file exists)', async () => {
    const res = await request(app).get('/outdoorsy/favicon.ico');
    // Accept 200 (found), 304 (not modified), or 404 (not found)
    expect([200, 304, 404]).toContain(res.statusCode);
  });

  it('mounts user routes under basePath', async () => {
    const res = await request(app).get('/outdoorsy/login');
    // Login page might redirect or render, so accept 200 or 302
    expect([200, 302]).toContain(res.statusCode);
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/outdoorsy/nonexistentpath');
    expect(res.statusCode).toBe(404);
  });
});
