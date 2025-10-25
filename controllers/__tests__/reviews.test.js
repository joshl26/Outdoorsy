// __tests__/reviews.test.js

const Campground = require('../../models/campground');
const Review = require('../../models/review');

jest.mock('../../models/campground');
jest.mock('../../models/review');

const reviewsController = require('../../controllers/reviews');

describe('Reviews Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: { id: 'camp123', reviewId: 'rev123' },
      body: { review: { rating: 5, body: 'Great place!' } },
      user: { _id: 'user123' },
      flash: jest.fn(),
    };
    res = {
      redirect: jest.fn(),
    };
  });

  describe('createReview', () => {
    it('creates a review and redirects', async () => {
      const fakeCampground = {
        _id: 'camp123',
        reviews: [],
        save: jest.fn().mockResolvedValue(),
      };
      Campground.findById.mockResolvedValue(fakeCampground);
      Review.prototype.save = jest.fn().mockResolvedValue();

      await reviewsController.createReview(req, res);

      expect(Campground.findById).toHaveBeenCalledWith('camp123');
      expect(Review.prototype.save).toHaveBeenCalled();
      expect(fakeCampground.reviews.length).toBe(1);
      expect(fakeCampground.reviews[0]).toBeInstanceOf(Review);
      expect(fakeCampground.save).toHaveBeenCalled();
      expect(req.flash).toHaveBeenCalledWith('success', 'Created new review!');
      expect(res.redirect).toHaveBeenCalledWith(
        '/outdoorsy/campgrounds/camp123'
      );
    });
  });

  describe('deleteReview', () => {
    it('deletes a review and redirects', async () => {
      Campground.findByIdAndUpdate.mockResolvedValue();
      Review.findByIdAndDelete.mockResolvedValue();

      await reviewsController.deleteReview(req, res);

      expect(Campground.findByIdAndUpdate).toHaveBeenCalledWith('camp123', {
        $pull: { reviews: 'rev123' },
      });
      expect(Review.findByIdAndDelete).toHaveBeenCalledWith('rev123');
      expect(req.flash).toHaveBeenCalledWith(
        'success',
        'Successfully deleted review'
      );
      expect(res.redirect).toHaveBeenCalledWith(
        '/outdoorsy/campgrounds/camp123'
      );
    });
  });
});
