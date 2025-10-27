// Middleware functions for authentication, authorization, and data validation
// file: middleware.js

const { campgroundSchema, reviewSchema } = require('./schemas.js');
const ExpressError = require('./utils/ExpressError');
const Campground = require('./models/campground');
const Review = require('./models/review');
const { buildPath } = require('./config/basePath');

/**
 * Middleware to check if user is authenticated.
 * - If not authenticated, saves the requested URL in session for redirect after login.
 * - Sets a flash error message.
 * - Redirects to login page.
 */
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl; // Save the url they are requesting
    req.flash('error', 'You must be signed in first!');
    return res.redirect(buildPath('login'));
  }
  next();
};

/**
 * Middleware to validate campground data using Joi schema.
 * - If validation fails, throws an ExpressError with status 400.
 */
module.exports.validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body);
  if (error) {
    const msg = `Validation error: ${error.details.map((x) => x.message).join(', ')}`;
    // eslint-disable-next-line no-console
    console.error(msg);
    throw new ExpressError(msg, 400);
  }
  next();
};

/**
 * Middleware to check if the current user is the author of the campground.
 * - If campground not found, flashes error and redirects to campgrounds index.
 * - If user is not author, flashes error and redirects to campground show page.
 */
module.exports.isAuthor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
      req.flash('error', 'Campground not found');
      return res.redirect(buildPath('campgrounds'));
    }
    if (!campground.author.equals(req.user._id)) {
      req.flash('error', 'You do not have permission to do that!');
      return res.redirect(buildPath(`campgrounds/${id}`));
    }
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware to check if the current user is the author of the review.
 * - If review not found, flashes error and redirects to campground show page.
 * - If user is not author, flashes error and redirects to campground show page.
 */
module.exports.isReviewAuthor = async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
      req.flash('error', 'Review not found');
      return res.redirect(buildPath(`campgrounds/${id}`));
    }
    if (!review.author.equals(req.user._id)) {
      req.flash('error', 'You do not have permission to do that!');
      return res.redirect(buildPath(`campgrounds/${id}`));
    }
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware to validate review data using Joi schema.
 * - If validation fails, throws an ExpressError with status 400.
 */
module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(', ');
    throw new ExpressError(msg, 400);
  }
  next();
};

/**
 * Middleware to expose the saved returnTo URL to views.
 * - Useful for redirecting users back to originally requested page after login.
 */
module.exports.storeReturnTo = (req, res, next) => {
  if (req.session.returnTo) {
    res.locals.returnTo = req.session.returnTo;
  }
  next();
};
