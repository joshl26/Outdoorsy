// routes/__tests__/reviews.test.js

const express = require('express');
const request = require('supertest');
const session = require('express-session');
const reviewsRouter = require('../reviews'); // adjust path if needed

// Mock middleware to bypass auth and validation
jest.mock('../../middleware', () => ({
  isLoggedIn: (req, res, next) => next(),
  isReviewAuthor: (req, res, next) => next(),
  validateReview: (req, res, next) => next(),
}));

// Mock reviews controller methods
jest.mock('../../controllers/reviews', () => ({
  createReview: (req, res) => res.status(201).send('Review Created'),
  deleteReview: (req, res) => res.status(200).send('Review Deleted'),
}));

describe('Reviews Routes', () => {
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
    // Mount router with mergeParams: true, so :id param is available
    app.use('/outdoorsy/campgrounds/:id/reviews', reviewsRouter);
  });

  it('POST /outdoorsy/campgrounds/:id/reviews should create a review', async () => {
    const res = await request(app)
      .post('/outdoorsy/campgrounds/123/reviews')
      .send({ review: { rating: 5, body: 'Great!' } });
    expect(res.statusCode).toBe(201);
    expect(res.text).toBe('Review Created');
  });

  it('DELETE /outdoorsy/campgrounds/:id/reviews/:reviewId should delete a review', async () => {
    const res = await request(app).delete(
      '/outdoorsy/campgrounds/123/reviews/456'
    );
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Review Deleted');
  });
});
