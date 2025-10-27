// Middleware functions for authentication and authorization
// file: middleware/auth.js

const Campground = require('../models/campground');
const Review = require('../models/review');
const NotFoundError = require('../utils/errors/NotFoundError');
const AuthenticationError = require('../utils/errors/AuthenticationError');
const AppError = require('../utils/errors/AppError');

/**
 * Middleware to check if user is authenticated.
 * If not, saves the requested URL in session and throws AuthenticationError.
 */
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl; // Save the url they are requesting
    return next(new AuthenticationError('You must be signed in first!'));
  }
  next();
};

/**
 * Middleware to check if the current user is the author of the campground.
 * Throws NotFoundError if campground not found.
 * Throws AppError with 403 if user is not the author.
 */
module.exports.isAuthor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
      throw new NotFoundError('Campground not found');
    }
    if (!campground.author.equals(req.user._id)) {
      throw new AppError('You do not have permission to do that!', 403);
    }
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware to check if the current user is the author of the review.
 * Throws NotFoundError if review not found.
 * Throws AppError with 403 if user is not the author.
 */
module.exports.isReviewAuthor = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }
    if (!review.author.equals(req.user._id)) {
      throw new AppError('You do not have permission to do that!', 403);
    }
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware to expose the saved returnTo URL to views.
 * Useful for redirecting users after login.
 */
module.exports.storeReturnTo = (req, res, next) => {
  if (req.session.returnTo) {
    res.locals.returnTo = req.session.returnTo;
  }
  next();
};
