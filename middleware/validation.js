// Description: Middleware for validating campground and review data using Joi schemas.
// file: middleware/validation.js

const { campgroundSchema, reviewSchema } = require('../schemas.js');
const ExpressError = require('../utils/ExpressError');

/**
 * Middleware to validate campground data in the request body.
 * Uses Joi schema defined in schemas.js.
 * If validation fails, throws an ExpressError with status 400.
 */
module.exports.validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body);
  if (error) {
    // Construct a detailed error message from Joi validation errors
    const msg = `Validation error: ${error.details.map((x) => x.message).join(', ')}`;
    // Log the validation error for debugging
    // eslint-disable-next-line no-console
    console.error(msg);
    // Throw custom ExpressError to be handled by centralized error handler
    throw new ExpressError(msg, 400);
  }
  // If no errors, proceed to next middleware/controller
  next();
};

/**
 * Middleware to validate review data in the request body.
 * Uses Joi schema defined in schemas.js.
 * If validation fails, throws an ExpressError with status 400.
 */
module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    // Construct a detailed error message from Joi validation errors
    const msg = `Validation error: ${error.details.map((el) => el.message).join(', ')}`;
    // Log the validation error for debugging
    // eslint-disable-next-line no-console
    console.error(msg);
    // Throw custom ExpressError to be handled by centralized error handler
    throw new ExpressError(msg, 400);
  }
  // If no errors, proceed to next middleware/controller
  next();
};
