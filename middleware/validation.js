const { campgroundSchema, reviewSchema } = require('../schemas.js');
const ExpressError = require('../utils/ExpressError');

module.exports.validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body);
  if (error) {
    const msg = `Validation error: ${error.details.map((x) => x.message).join(', ')}`;
    console.error(msg);
    throw new ExpressError(msg, 400);
  }
  next();
};

module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = `Validation error: ${error.details.map((el) => el.message).join(', ')}`;
    console.error(msg);
    throw new ExpressError(msg, 400);
  }
  next();
};
