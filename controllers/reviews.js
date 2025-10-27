// Controller for handling review creation and deletion
// file: controllers/reviews.js

const Campground = require('../models/campground');
const Review = require('../models/review');

const NotFoundError = require('../utils/errors/NotFoundError');

/**
 * Create a new review for a campground.
 * - Verify campground exists.
 * - Create review and associate with current user.
 * - Add review reference to campground.
 * - Save both review and campground.
 */
module.exports.createReview = async (req, res, next) => {
  try {
    // Find campground by ID from URL params
    const campground = await Campground.findById(req.params.id);
    if (!campground) {
      // Throw 404 if campground not found
      throw new NotFoundError('Campground not found');
    }

    // Create new review from form data
    const review = new Review(req.body.review);

    // Set the author of the review to the logged-in user
    review.author = req.user._id;

    // Add review reference to campground's reviews array
    campground.reviews.push(review);

    // Save the review document
    await review.save();

    // Save the updated campground document
    await campground.save();

    req.flash('success', 'Created new review!');
    res.redirect(`/outdoorsy/campgrounds/${campground._id}`);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a review from a campground.
 * - Verify campground exists.
 * - Remove review reference from campground.
 * - Delete review document.
 */
module.exports.deleteReview = async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;

    // Find campground by ID
    const campground = await Campground.findById(id);
    if (!campground) {
      // Throw 404 if campground not found
      throw new NotFoundError('Campground not found');
    }

    // Remove review reference from campground's reviews array
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });

    // Delete the review document itself
    await Review.findByIdAndDelete(reviewId);

    req.flash('success', 'Successfully deleted review');
    res.redirect(`/outdoorsy/campgrounds/${id}`);
  } catch (err) {
    next(err);
  }
};
