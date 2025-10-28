/**
 * Campgrounds Controller Tests
 * - Mocks all Mongoose chain calls properly
 * - Ensures res.locals exists
 */

jest.mock('../../models/campground');
jest.mock('../../models/review');
jest.mock('../../models/user');

const Campground = require('../../models/campground');
const Review = require('../../models/review');
// eslint-disable-next-line no-unused-vars
const User = require('../../models/user');
const campgroundsController = require('../campgrounds');

describe('Campgrounds Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { query: {}, params: {}, user: null };
    res = {
      locals: {}, // IMPORTANT for SEO locals
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      flash: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('index', () => {
    function mockFindReturning(dataArray) {
      const lean = jest.fn().mockResolvedValue(dataArray);
      const limit = jest.fn().mockReturnValue({ lean });
      const skip = jest.fn().mockReturnValue({ limit });
      const sort = jest.fn().mockReturnValue({ skip });
      jest.spyOn(Campground, 'find').mockReturnValue({ sort });
    }

    it('renders campgrounds with no filters and pagination', async () => {
      const createdAt = new Date();
      const campData = [{ _id: 'c1', title: 'A', createdAt }];

      mockFindReturning(campData);
      jest.spyOn(Campground, 'countDocuments').mockResolvedValue(1);

      await campgroundsController.index(req, res, next);

      // Render called with expected locals
      expect(res.render).toHaveBeenCalledWith(
        'campgrounds/index',
        expect.objectContaining({
          campgrounds: campData,
          page: 1,
          totalPages: 1,
          total: 1,
          q: '',
          minPrice: '',
          maxPrice: '',
          lat: '',
          lng: '',
          radiusKm: '',
        })
      );

      // No error
      expect(next).not.toHaveBeenCalled();
    });

    it('applies text and price filters when provided', async () => {
      req.query = { q: 'lake', minPrice: '10', maxPrice: '50' };

      mockFindReturning([]);
      jest.spyOn(Campground, 'countDocuments').mockResolvedValue(0);

      await campgroundsController.index(req, res, next);

      // Render echoes filters
      expect(res.render).toHaveBeenCalledWith(
        'campgrounds/index',
        expect.objectContaining({
          q: 'lake',
          minPrice: 10,
          maxPrice: 50,
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('includes favorites when user is logged in', async () => {
      req.user = { _id: 'u1', favorites: ['c1', 'c2'] };

      mockFindReturning([]);
      jest.spyOn(Campground, 'countDocuments').mockResolvedValue(0);

      await campgroundsController.index(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'campgrounds/index',
        expect.objectContaining({
          favorites: ['c1', 'c2'],
        })
      );
    });
  });

  describe('showCampground', () => {
    function mockFindByIdReturning(cg) {
      const lean = jest.fn().mockResolvedValue(cg);
      const populate = jest.fn().mockReturnValue({ lean });
      jest.spyOn(Campground, 'findById').mockReturnValue({ populate });
    }

    function mockReviewsReturning(reviews) {
      const lean = jest.fn().mockResolvedValue(reviews);
      const populate = jest.fn().mockReturnValue({ lean });
      const limit = jest.fn().mockReturnValue({ populate });
      const skip = jest.fn().mockReturnValue({ limit });
      const sort = jest.fn().mockReturnValue({ skip });
      jest.spyOn(Review, 'find').mockReturnValue({ sort });

      jest.spyOn(Review, 'countDocuments').mockResolvedValue(reviews.length);
    }

    it('renders campground if found (optimized with lean)', async () => {
      const cg = {
        _id: 'id1',
        title: 'Test Campground',
        description: 'Nice place',
      };
      mockFindByIdReturning(cg);
      mockReviewsReturning([]);

      await campgroundsController.showCampground(req, res, next);

      // SEO locals
      expect(res.locals.pageTitle).toBe('Test Campground - Outdoorsy');
      expect(res.locals.pageDescription).toBe('Nice place');

      // Render locals
      expect(res.render).toHaveBeenCalledWith(
        'campgrounds/show',
        expect.objectContaining({
          campground: cg,
          reviews: [],
          reviewsPage: 1,
          reviewsTotalPages: 0,
          reviewsTotal: 0,
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('handles missing description gracefully', async () => {
      const cg = { _id: 'id2', title: 'No Desc Camp' };
      mockFindByIdReturning(cg);
      mockReviewsReturning([]);

      await campgroundsController.showCampground(req, res, next);

      expect(res.locals.pageTitle).toBe('No Desc Camp - Outdoorsy');
      expect(res.locals.pageDescription).toBe(
        'Explore No Desc Camp on Outdoorsy'
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});
