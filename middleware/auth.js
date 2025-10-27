// Middleware functions for authentication and authorization
// file: middleware/auth.js

const Campground = require('../models/campground');
const Review = require('../models/review');
const { buildPath } = require('../config/basePath');
const NotFoundError = require('../utils/errors/NotFoundError');
const AuthenticationError = require('../utils/errors/AuthenticationError');
const AppError = require('../utils/errors/AppError');

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl; // Save the url they are requesting
    // Throw AuthenticationError instead of redirecting here
    return next(new AuthenticationError('You must be signed in first!'));
  }
  next();
};

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

module.exports.isReviewAuthor = async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;
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

module.exports.storeReturnTo = (req, res, next) => {
  if (req.session.returnTo) {
    res.locals.returnTo = req.session.returnTo;
  }
  next();
};
