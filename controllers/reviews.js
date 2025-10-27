// controllers/reviews.js
const Campground = require('../models/campground');
const Review = require('../models/review');

const NotFoundError = require('../utils/errors/NotFoundError');

module.exports.createReview = async (req, res, next) => {
  try {
    const campground = await Campground.findById(req.params.id);
    if (!campground) {
      throw new NotFoundError('Campground not found');
    }
    const review = new Review(req.body.review);
    review.author = req.user._id;
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash('success', 'Created new review!');
    res.redirect(`/outdoorsy/campgrounds/${campground._id}`);
  } catch (err) {
    next(err);
  }
};

module.exports.deleteReview = async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
      throw new NotFoundError('Campground not found');
    }
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted review');
    res.redirect(`/outdoorsy/campgrounds/${id}`);
  } catch (err) {
    next(err);
  }
};
