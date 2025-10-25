// __tests__/middleware.test.js

const {
  isLoggedIn,
  validateCampground,
  isAuthor,
  isReviewAuthor,
  validateReview,
  storeReturnTo,
} = require('../middleware');

const Campground = require('../models/campground');
const Review = require('../models/review');
const ExpressError = require('../utils/ExpressError');

jest.mock('../models/campground');
jest.mock('../models/review');

describe('Middleware', () => {
  let req, res, next;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
  });

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: { _id: 'user123' },
      flash: jest.fn(),
      session: {},
      isAuthenticated: jest.fn(),
      originalUrl: '/test-url',
    };
    res = {
      redirect: jest.fn(),
      locals: {},
    };
    next = jest.fn();
  });

  describe('isLoggedIn', () => {
    it('calls next() if user is authenticated', () => {
      req.isAuthenticated.mockReturnValue(true);

      isLoggedIn(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('redirects to login if user is not authenticated', () => {
      req.isAuthenticated.mockReturnValue(false);

      isLoggedIn(req, res, next);

      expect(req.session.returnTo).toBe('/test-url');
      expect(req.flash).toHaveBeenCalledWith(
        'error',
        'You must be signed in first!'
      );
      expect(res.redirect).toHaveBeenCalledWith('/outdoorsy/login');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateCampground', () => {
    it('calls next if valid data', () => {
      req.body = {
        campground: {
          title: 'Test Campground',
          price: 10,
          location: 'Test Location',
          description: 'A nice place to stay',
        },
      };
      expect(() => validateCampground(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });

    it('throws ExpressError if invalid data', () => {
      req.body = {
        campground: {
          title: 'Invalid Title', // non-empty but invalid due to other fields
          price: -10,
          location: '',
          description: '',
        },
      };
      try {
        validateCampground(req, res, next);
      } catch (e) {
        expect(e).toBeInstanceOf(ExpressError);
        expect(e.statusCode).toBe(400);
      }
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('isAuthor', () => {
    it('calls next if user is author', async () => {
      req.params.id = 'camp123';
      Campground.findById.mockResolvedValue({
        author: { equals: (id) => id === 'user123' },
      });
      await isAuthor(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('redirects if campground not found', async () => {
      req.params.id = 'camp123';
      Campground.findById.mockResolvedValue(null);
      await isAuthor(req, res, next);
      expect(req.flash).toHaveBeenCalledWith('error', 'Campground not found');
      expect(res.redirect).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('redirects if user is not author', async () => {
      req.params.id = 'camp123';
      Campground.findById.mockResolvedValue({
        author: { equals: () => false },
      });
      await isAuthor(req, res, next);
      expect(req.flash).toHaveBeenCalledWith(
        'error',
        'You do not have permission to do that!'
      );
      expect(res.redirect).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with error on exception', async () => {
      req.params.id = 'camp123';
      Campground.findById.mockRejectedValue(new Error('fail'));
      await isAuthor(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('isReviewAuthor', () => {
    it('calls next if user is review author', async () => {
      req.params = { id: 'camp123', reviewId: 'rev123' };
      Review.findById.mockResolvedValue({
        author: { equals: (id) => id === 'user123' },
      });
      await isReviewAuthor(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('redirects if review not found', async () => {
      req.params = { id: 'camp123', reviewId: 'rev123' };
      Review.findById.mockResolvedValue(null);
      await isReviewAuthor(req, res, next);
      expect(req.flash).toHaveBeenCalledWith('error', 'Review not found');
      expect(res.redirect).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('redirects if user is not review author', async () => {
      req.params = { id: 'camp123', reviewId: 'rev123' };
      Review.findById.mockResolvedValue({
        author: { equals: () => false },
      });
      await isReviewAuthor(req, res, next);
      expect(req.flash).toHaveBeenCalledWith(
        'error',
        'You do not have permission to do that!'
      );
      expect(res.redirect).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with error on exception', async () => {
      req.params = { id: 'camp123', reviewId: 'rev123' };
      Review.findById.mockRejectedValue(new Error('fail'));
      await isReviewAuthor(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('validateReview', () => {
    it('calls next if valid review', () => {
      req.body = {
        review: { rating: 5, body: 'Great!' },
      };
      expect(() => validateReview(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });

    it('throws ExpressError if invalid review', () => {
      req.body = {
        review: { rating: 10, body: '' },
      };
      try {
        validateReview(req, res, next);
      } catch (e) {
        expect(e).toBeInstanceOf(ExpressError);
        expect(e.statusCode).toBe(400);
      }
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('storeReturnTo', () => {
    it('sets res.locals.returnTo if session.returnTo exists', () => {
      req.session.returnTo = '/some/path';
      storeReturnTo(req, res, next);
      expect(res.locals.returnTo).toBe('/some/path');
      expect(next).toHaveBeenCalled();
    });

    it('does nothing if session.returnTo does not exist', () => {
      storeReturnTo(req, res, next);
      expect(res.locals.returnTo).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });
});
