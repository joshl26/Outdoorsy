// Review routes for campgrounds
// file: routes/reviews.js

const express = require('express');
// Create a router with mergeParams to access params from parent routes (e.g., campground ID)
const router = express.Router({ mergeParams: true });

const { validateReview, isLoggedIn, isReviewAuthor } = require('../middleware');
const reviews = require('../controllers/reviews');
const catchAsync = require('../utils/catchAsync');

/**
 * Route to create a new review for a campground.
 * - Requires user to be logged in.
 * - Validates review data.
 * - Uses catchAsync to handle async errors.
 */
router.post('/', isLoggedIn, validateReview, catchAsync(reviews.createReview));

/**
 * Route to delete a review by its ID.
 * - Requires user to be logged in.
 * - Checks if current user is the author of the review.
 * - Uses catchAsync to handle async errors.
 */
router.delete(
  '/:reviewId',
  isLoggedIn,
  isReviewAuthor,
  catchAsync(reviews.deleteReview)
);

module.exports = router;
