// routes/__tests__/campgrounds.test.js

const express = require('express');
const request = require('supertest');
const session = require('express-session');
const campgroundsRouter = require('../campgrounds'); // adjust path if needed

// Mock middleware to bypass authentication for testing
jest.mock('../../middleware', () => ({
  isLoggedIn: (req, res, next) => next(),
  isAuthor: (req, res, next) => next(),
  validateCampground: (req, res, next) => next(),
}));

// Mock campgrounds controller methods to avoid real DB calls
jest.mock('../../controllers/campgrounds', () => ({
  index: (req, res) => res.send('<html><body>Campgrounds Index</body></html>'),
  renderNewForm: (req, res) =>
    res.send('<html><body>New Campground Form</body></html>'),
  showCampground: (req, res) =>
    res.send('<html><body>Show Campground</body></html>'),
  createCampground: (req, res) => res.redirect('/outdoorsy/campgrounds'),
  updateCampground: (req, res) => res.redirect('/outdoorsy/campgrounds/123'),
  deleteCampground: (req, res) => res.redirect('/outdoorsy/campgrounds'),
  renderEditForm: (req, res) =>
    res.send('<html><body>Edit Campground Form</body></html>'),
}));

describe('Campgrounds Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.urlencoded({ extended: false }));
    app.use(
      session({
        secret: 'testsecret',
        resave: false,
        saveUninitialized: false,
      })
    );
    app.use('/outdoorsy/campgrounds', campgroundsRouter);
  });

  it('GET /outdoorsy/campgrounds should return 200 and HTML', async () => {
    const res = await request(app).get('/outdoorsy/campgrounds');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('Campgrounds Index');
  });

  it('GET /outdoorsy/campgrounds/new should return 200 and HTML', async () => {
    const res = await request(app).get('/outdoorsy/campgrounds/new');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('New Campground Form');
  });

  it('POST /outdoorsy/campgrounds should redirect after creation', async () => {
    const res = await request(app)
      .post('/outdoorsy/campgrounds')
      .send({
        title: 'Test Campground',
        price: 10,
        location: 'Test Location',
        description: 'Nice place',
      });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/outdoorsy/campgrounds');
  });

  it('GET /outdoorsy/campgrounds/:id should return 200 and HTML', async () => {
    const res = await request(app).get('/outdoorsy/campgrounds/123');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('Show Campground');
  });

  it('PUT /outdoorsy/campgrounds/:id should redirect after update', async () => {
    const res = await request(app)
      .put('/outdoorsy/campgrounds/123')
      .send({
        title: 'Updated Campground',
        price: 20,
        location: 'Updated Location',
        description: 'Updated desc',
      });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/outdoorsy/campgrounds/123');
  });

  it('DELETE /outdoorsy/campgrounds/:id should redirect after deletion', async () => {
    const res = await request(app).delete('/outdoorsy/campgrounds/123');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/outdoorsy/campgrounds');
  });

  it('GET /outdoorsy/campgrounds/:id/edit should return 200 and HTML', async () => {
    const res = await request(app).get('/outdoorsy/campgrounds/123/edit');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('Edit Campground Form');
  });
});
