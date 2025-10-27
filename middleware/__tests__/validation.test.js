const { validateCampground, validateReview } = require('../validation');
const ExpressError = require('../../utils/ExpressError');

describe('Validation Middleware', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
  });

  describe('validateCampground', () => {
    it('should call next() for valid campground data', () => {
      const req = {
        body: {
          campground: {
            title: 'Test Campground',
            price: 20,
            location: 'Test Location',
            description: 'Nice place',
          },
        },
      };
      const res = {};
      const next = jest.fn();

      validateCampground(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should throw ExpressError for invalid campground data', () => {
      const req = {
        body: {
          campground: {
            title: '',
            price: -10,
          },
        },
      };
      const res = {};
      const next = jest.fn();

      expect(() => validateCampground(req, res, next)).toThrow(ExpressError);
    });
  });

  describe('validateReview', () => {
    it('should call next() for valid review data', () => {
      const req = {
        body: {
          review: {
            rating: 5,
            body: 'Great place!',
          },
        },
      };
      const res = {};
      const next = jest.fn();

      validateReview(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should throw ExpressError for invalid review data', () => {
      const req = {
        body: {
          review: {
            rating: 10,
            body: '',
          },
        },
      };
      const res = {};
      const next = jest.fn();

      expect(() => validateReview(req, res, next)).toThrow(ExpressError);
    });
  });
});
