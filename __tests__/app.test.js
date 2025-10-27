/* eslint-disable no-console */
const request = require('supertest');
// const path = require('path');

// Mock basePath and buildPath from your config
jest.mock('../config/basePath', () => ({
  basePath: '/outdoorsy',
  buildPath: (subpath) => `/outdoorsy/${subpath}`,
}));

const app = require('../app'); // path to your app.js

// Add error logging middleware early in app for tests
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
    expect([200, 304, 404]).toContain(res.statusCode);
  });

  it('mounts user routes under basePath', async () => {
    const res = await request(app).get('/outdoorsy/login');
    expect([200, 302]).toContain(res.statusCode);
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/outdoorsy/nonexistentpath');
    expect(res.statusCode).toBe(404);
  });
});
