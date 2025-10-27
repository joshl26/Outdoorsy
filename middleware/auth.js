const Campground = require('../models/campground');
const Review = require('../models/review');
const { buildPath } = require('../config/basePath');

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl; // Save the url they are requesting
    req.flash('error', 'You must be signed in first!');
    return res.redirect(buildPath('login'));
  }
  next();
};

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

module.exports.storeReturnTo = (req, res, next) => {
  if (req.session.returnTo) {
    res.locals.returnTo = req.session.returnTo;
  }
  next();
};
