//  Jest tests for authentication middleware functions
// file: middleware/__tests__/auth.test.js

const authMiddleware = require('../../middleware/auth');
const Campground = require('../../models/campground');
const Review = require('../../models/review');

jest.mock('../../models/campground');
jest.mock('../../models/review');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      isAuthenticated: jest.fn(),
      session: {},
      flash: jest.fn(),
      params: {},
      user: { _id: 'userId' },
      originalUrl: '/some-url',
    };
    res = {
      locals: {},
      redirect: jest.fn(),
      flash: jest.fn(),
    };
    next = jest.fn();
  });

  describe('isLoggedIn', () => {
    it('calls next if user is authenticated', () => {
      req.isAuthenticated.mockReturnValue(true);
      authMiddleware.isLoggedIn(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('calls next with AuthenticationError if not authenticated', () => {
      req.isAuthenticated.mockReturnValue(false);
      authMiddleware.isLoggedIn(req, res, next);
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('You must be signed in first!');
    });
  });

  describe('isAuthor', () => {
    it('calls next if user is author', async () => {
      req.params.id = 'campId';
      Campground.findById.mockResolvedValue({
        author: { equals: () => true },
      });
      await authMiddleware.isAuthor(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('calls next with NotFoundError if campground not found', async () => {
      req.params.id = 'campId';
      Campground.findById.mockResolvedValue(null);
      await authMiddleware.isAuthor(req, res, next);
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Campground not found');
    });

    it('calls next with AppError if user is not author', async () => {
      req.params.id = 'campId';
      Campground.findById.mockResolvedValue({
        author: { equals: () => false },
      });
      await authMiddleware.isAuthor(req, res, next);
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('You do not have permission to do that!');
    });

    it('calls next with error on exception', async () => {
      req.params.id = 'campId';
      const error = new Error('fail');
      Campground.findById.mockRejectedValue(error);
      await authMiddleware.isAuthor(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('isReviewAuthor', () => {
    it('calls next if user is review author', async () => {
      req.params.id = 'campId';
      req.params.reviewId = 'reviewId';
      Review.findById.mockResolvedValue({
        author: { equals: () => true },
      });
      await authMiddleware.isReviewAuthor(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('calls next with NotFoundError if review not found', async () => {
      req.params.id = 'campId';
      req.params.reviewId = 'reviewId';
      Review.findById.mockResolvedValue(null);
      await authMiddleware.isReviewAuthor(req, res, next);
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Review not found');
    });

    it('calls next with AppError if user is not review author', async () => {
      req.params.id = 'campId';
      req.params.reviewId = 'reviewId';
      Review.findById.mockResolvedValue({
        author: { equals: () => false },
      });
      await authMiddleware.isReviewAuthor(req, res, next);
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('You do not have permission to do that!');
    });

    it('calls next with error on exception', async () => {
      req.params.id = 'campId';
      req.params.reviewId = 'reviewId';
      const error = new Error('fail');
      Review.findById.mockRejectedValue(error);
      await authMiddleware.isReviewAuthor(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('storeReturnTo', () => {
    it('sets res.locals.returnTo if session.returnTo exists', () => {
      req.session.returnTo = '/some-url';
      authMiddleware.storeReturnTo(req, res, next);
      expect(res.locals.returnTo).toBe('/some-url');
      expect(next).toHaveBeenCalled();
    });

    it('calls next if session.returnTo does not exist', () => {
      authMiddleware.storeReturnTo(req, res, next);
      expect(res.locals.returnTo).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });
});
