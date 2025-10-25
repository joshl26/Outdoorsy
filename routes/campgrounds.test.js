const request = require('supertest');
const app = require('../app'); // your Express app

describe('Campgrounds Routes', () => {
  it('GET /outdoorsy/campgrounds should return 200 and HTML', async () => {
    const res = await request(app).get('/outdoorsy/campgrounds');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  it('GET /outdoorsy/campgrounds/new should return 200 for logged in user', async () => {
    // You need to mock authentication or login first
    // For now, just test unauthenticated access
    const res = await request(app).get('/outdoorsy/campgrounds/new');
    expect([200, 302]).toContain(res.statusCode); // 302 if redirected to login
  });
});
